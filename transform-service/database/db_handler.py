import time
from decimal import Decimal
from pyspark.sql import DataFrame, SparkSession, Window
import pyspark.sql.functions as F
from pyspark.sql.functions import sha2, broadcast, when, col, lit, expr, current_timestamp,md5, udf, Column, concat_ws, countDistinct, count as f_count, to_date,concat, trim, row_number,first, lower, datediff, to_timestamp
from pyspark.sql.functions import (sum as _sum, coalesce)
from pyspark.sql.types import NullType, StructType, StructField, StringType, DecimalType, NumericType, IntegerType, LongType, FloatType, DoubleType, BooleanType, DateType, TimestampType
from config import settings, config
from logger.logger import get_logger
import psycopg2
from psycopg2 import sql, pool, OperationalError
from pyspark.sql.utils import AnalysisException
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timezone, timedelta
from functools import reduce
from contextlib import contextmanager
from constants import Constants
from html import escape
from pyspark.sql.functions import sum as spark_sum
import pandas as pd
from typing import Set 
import os
import json
from pyspark import StorageLevel
from pyspark.sql.types import *
import calendar
import uuid
from psycopg2.extras import execute_values


logger = get_logger(__name__)
class DBPool:
    """Database connection pool manager"""
    _connection_pool = None
    main_connection_pool = None

    @classmethod
    def initialize_pool(cls):
        """Initialize the connection pool"""
        logger.info(config.ENTITY_DB_URL.split("//")[1].split(":")[0])
        if cls._connection_pool is None:
            try:
                cls._connection_pool = pool.ThreadedConnectionPool(
                    minconn=10,
                    maxconn=50,
                    dbname=config.ENTITY_DB_NAME,
                    user=config.ENTITY_DB_USER,
                    password=settings.ENTITY_DB_PASSWORD,
                    host=config.ENTITY_DB_HOST,
                    port="5432",
                    keepalives=1,
                    keepalives_idle=15,
                    keepalives_interval=5,
                    keepalives_count=5,
                    connect_timeout=10,
                    sslmode="require"
                )
                cls.main_connection_pool = pool.ThreadedConnectionPool(
                    minconn=10,
                    maxconn=50,
                    dbname=config.MAIN_DB_NAME,
                    user=config.MAIN_DB_USER,
                    password=settings.MAIN_DB_PASSWORD,
                    host=config.MAIN_DB_HOST,
                    port="5432",
                    keepalives=1,
                    keepalives_idle=15,
                    keepalives_interval=5,
                    keepalives_count=5,
                    connect_timeout=10,
                    sslmode="require"
                )
                logger.info("Database connection pool initialized")
            except Exception as e:
                logger.error(f"Error initializing connection pool: {e}")
                raise

    @classmethod
    @contextmanager
    def get_connection_uuid(cls):
        logger.info("connected")
        conn = None
        try:
            conn = cls._connection_pool.getconn()
            yield conn
            conn.commit()
        except Exception as e:
            logger.error(f"Database error: {str(e)}")
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                cls._connection_pool.putconn(conn)

    @classmethod
    @contextmanager
    def get_connection(cls):
        """Context manager for getting a connection from the pool"""
        if cls._connection_pool is None:
            cls.initialize_pool()

        
        conn = None
        try:
            conn = cls._connection_pool.getconn()
            yield conn
        except Exception as e:
            logger.error(f"Error getting connection from pool: {e}")
            raise
        finally:
            if conn:
                cls._connection_pool.putconn(conn)

    @classmethod
    @contextmanager
    def get_connection_mainDB(cls):
        """Context manager for getting a connection from the pool"""
        if cls.main_connection_pool is None:
            cls.initialize_pool()
        conn = None
        try:
            conn = cls.main_connection_pool.getconn()
            yield conn
        except Exception as e:
            logger.error(f"Error getting connection from pool: {e}")
            raise
        finally:
            if conn:
                cls.main_connection_pool.putconn(conn)


    @classmethod
    def close_all_connections(cls):
        """Close all connections in the pool"""
        if cls._connection_pool:
            cls._connection_pool.closeall()
            cls.main_connection_pool.closeall()
            logger.info("All database connections closed")

# Initialize the pool when module loads
DBPool.initialize_pool()

class DatabaseHandler:
    """Main database handler class for the service with connection pooling"""
    
    def __init__(self):
        logger.info("creating spark")
        self.spark = self._get_spark_session()
        self._verify_jdbc_driver()
    
    # ====================== Spark Session Management ======================
    @staticmethod
    def _get_spark_session() -> SparkSession:
        """Create configured Spark session with proper JDBC configuration"""
        logger.info("creating spark 00")
        return SparkSession.builder \
            .appName("ETL-Processor") \
            .config("spark.sql.shuffle.partitions", config.SPARK_SHUFFLE_PARTITIONS) \
            .config("spark.jars", "postgresql-42.5.6.jar") \
            .config("spark.executor.extraClassPath", "postgresql-42.5.6.jar") \
            .config("spark.driver.extraClassPath", "postgresql-42.5.6.jar") \
            .config("spark.port.maxRetries", "100") \
            .config("spark.sql.legacy.timeParserPolicy", "LEGACY") \
            .config("spark.sql.debug.maxToStringFields", "2000") \
            .config("spark.driver.memory", "6g") \
            .config("spark.default.parallelism", config.SPARK_SHUFFLE_PARTITIONS) \
            .config("spark.sql.adaptive.enabled", "true") \
            .config("spark.sql.autoBroadcastJoinThreshold", "-1") \
            .config("spark.executor.extraJavaOptions", "-Dsun.net.client.defaultConnectTimeout=10000 -Dsun.net.client.defaultReadTimeout=60000") \
            .config("spark.driver.extraJavaOptions", "-Dsun.net.client.defaultConnectTimeout=10000 -Dsun.net.client.defaultReadTimeout=60000") \
            .getOrCreate()

    def _verify_jdbc_driver(self):
        """Verify JDBC driver is properly configured"""
        try:
            # Test JDBC driver availability
            self.spark._jvm.Class.forName("org.postgresql.Driver")
            logger.info("PostgreSQL JDBC driver successfully loaded")
        except Exception as e:
            logger.error(f"Failed to load JDBC driver: {str(e)}")
            raise RuntimeError("JDBC driver not available. Please ensure the JAR is in the classpath.")

    # ====================== Core Data Operations ======================
    from config import config

    def store_transformed_data(
        self,
        df: DataFrame,
        entity_type: str,
        account_r_number: str,
        account_rid: str,
        modified_by: str,
        fiscal_year: int,
        document_id: str,
        parent_entity_type: Optional[str] = None  # Optional param with default
    ) -> bool:

        try:
            logger.info(f"[{entity_type}] Start processing entity data.")

            logger.info(f"[{entity_type}] Fetching entity config...")
            db_config = self._get_entity_config(entity_type, account_r_number)
            logger.info(f"[{entity_type}] Configuration loaded: {db_config}")

            logger.info(f"[{entity_type}] Preparing input DataFrame (casting, cleaning, etc)...")
            df = self._prepare_dataframe(df, db_config, fiscal_year, entity_type, account_r_number)
            logger.info(f"[{entity_type}] DataFrame prepared with columns: {df.columns}")

            if not db_config["is_parent"] and entity_type not in  ["project_resource","project_task"]:
                logger.info(f"[{entity_type}] Ensuring parent records exist...")
                self._ensure_parent_records(df, db_config, modified_by, account_r_number, account_rid, entity_type)
                logger.info(f"[{entity_type}] Parent validation complete.")

            if not db_config["is_parent"]:
                logger.info(f"[{entity_type}] Resolving parent RIDs...")
                df = self._resolve_parents(df, db_config, account_r_number, account_rid)
                logger.info(f"[{entity_type}] Parent RIDs mapped.")

            logger.info(f"[{entity_type}] Loading existing records from DB table: {db_config['main_table']}")
            existing_df = self._load_existing_data(df, db_config, account_rid, entity_type)
            if existing_df is not None and not existing_df.rdd.isEmpty():
                existing_df.persist(StorageLevel.MEMORY_AND_DISK)
            
            if df is not None and not df.rdd.isEmpty():
                df.persist(StorageLevel.MEMORY_AND_DISK)
            logger.info(f"[{entity_type}] Existing record count: {existing_df.count()}")

            logger.info(f"[{entity_type}] Handling special entity validations (if applicable)...")
            df = self._handle_special_entities(df, existing_df, account_r_number, db_config, entity_type, modified_by, account_rid, document_id, fiscal_year, parent_entity_type)
            df.printSchema()
          # df.show()
            logger.info(f"[{entity_type}] Special handling complete. Cleaned record count: {df.count()}")
            if df is not None and not df.rdd.isEmpty():
                if entity_type in ["resource", "project"]:

                    key_col = f"{entity_type}_code"
                    type_col = f"{entity_type}_type_rid"

                    active_status_rid = self.get_active_status_rid()
                    # -----------------------------
                    # Split DF
                    # -----------------------------
                    df_with_type = df.filter(F.col(type_col).isNotNull())
                    df_without_type = df.filter(F.col(type_col).isNull())
                    # -----------------------------
                    # WITH TYPE → FORCE ACTIVE
                    # -----------------------------
                    if not df_with_type.rdd.isEmpty():
                        df_with_type = df_with_type.withColumn(
                            "status_rid",
                            F.lit(active_status_rid)
                        )
                    # -----------------------------
                    # WITHOUT TYPE → MAP FROM DB
                    # -----------------------------
                    if not df_without_type.rdd.isEmpty():
                        df_without_type = self._map_type_from_existing(
                            df_without_type,
                            existing_df,
                            key_col=key_col,
                            type_col=type_col,
                            fiscal_year=fiscal_year
                        )
                        df_without_type = self._map_status_from_existing(
                            df_without_type,
                            existing_df,
                            key_col=key_col,
                            fiscal_year=fiscal_year
                        )
                    # -----------------------------
                    # RECOMBINE (SAFE)
                    # -----------------------------
                    df = df_with_type.unionByName(df_without_type)

                logger.info(f"[{entity_type}] Classifying new vs updated records...")
                new_records, update_comparison = self._classify_records(df, existing_df, entity_type, db_config)
                if new_records is not None and not new_records.rdd.isEmpty():
                    new_records.persist(StorageLevel.MEMORY_AND_DISK)

                if update_comparison is not None and not update_comparison.rdd.isEmpty():
                    update_comparison.persist(StorageLevel.MEMORY_AND_DISK)
                logger.info(f"[{entity_type}] New records: {new_records.count()}, Records to compare for updates: {update_comparison.count() if update_comparison else 0}")
                if new_records is not None and not new_records.rdd.isEmpty() and entity_type in ["resource","project"]:
                            logger.info(f"[{entity_type}] Applying new-record status")
                            active_status_rid = self.get_active_status_rid()
                            inactive_status_rid = self.get_inactive_status_rid()
                            new_records = self._apply_new_record_status(
                                new_records,
                                type_col=f"{entity_type}_type_rid",
                                active_status_rid=active_status_rid,
                                inactive_status_rid=inactive_status_rid
                            )
                logger.info(f"[{entity_type}] Inserting new records (if any)...")
                self._insert_new_records(new_records, db_config, account_rid, account_r_number, modified_by, entity_type, document_id)
                logger.info(f"[{entity_type}] New record insertion complete.")

                if entity_type not in ['project', 'resource_cost','project_task'] and update_comparison is not None and not update_comparison.rdd.isEmpty():

                    start_time = time.perf_counter()
                    if entity_type == "resource":
                        update_comparison = update_comparison.withColumn(
                            f"{entity_type}_type_rid",
                            coalesce(
                                col(f"new_{entity_type}_type_rid"),
                                col(f"old_{entity_type}_type_rid")
                            )
                        )
                        update_comparison = update_comparison.withColumn(
                            "status_rid",
                            coalesce(
                                col("new_status_rid"),
                                col("old_status_rid")
                            )
                        )
                    self._update_existing_records(update_comparison, db_config, df, account_rid, account_r_number, modified_by, entity_type, document_id, parent_entity_type)

                    end_time = time.perf_counter()
                    elapsed_time = end_time - start_time

                    logger.info(f"[{entity_type}] Update operation complete. Time taken: {elapsed_time:.2f} seconds")
            else:
                logger.info("skipping because of empty dataframe")
            logger.info(f"[{entity_type}] Successfully stored transformed data for entity.")
            return True

        except Exception as e:
            logger.error(f"[{entity_type}] Error occurred while storing transformed data: {str(e)}", exc_info=True)
            return False
        finally:
            def is_not_empty(df):
                return df is not None and not df.rdd.isEmpty()
            cleanup_dfs = [
                df,
                existing_df,
                new_records if "new_records" in locals() else None,
                update_comparison if "update_comparison" in locals() else None
            ]

            if any(is_not_empty(d) for d in cleanup_dfs):
                # cleanup persisted DFs
                for temp_df in cleanup_dfs:
                    if temp_df is not None and temp_df.is_cached:
                        temp_df.unpersist()

    def _get_entity_config(self, entity_type: str, account_r_number: str) -> dict:
        try:
            logger.info(f"[{entity_type}] Fetching table configuration for account {account_r_number}.")

            config_map = {
                "resource": {
                    "main_table": config.PROD_RESOURCE_TABLE,
                    "history_table": config.PROD_RESOURCE_HISTORY_TABLE,
                    "timeline_table": config.ACCOUNT_TIMELINE_TABLE,
                    "ref_column": "resource_code",
                    "rid_column": "rid",
                    "is_parent": True,
                    "numeric_columns": ["resource_total_experience", "resource_total_experience_organization", "standard_rate"],
                    "date_columns": ["resource_startdate", "resource_enddate"],
                    "allow_duplicates": False
                },
                "resource_cost": {
                    "main_table": config.PROD_RESOURCE_COST_TABLE,
                    "history_table": config.PROD_RESOURCE_COST_HISTORY_TABLE,
                    "timeline_table": config.ACCOUNT_TIMELINE_TABLE,
                    "ref_column": "resource_code",
                    "rid_column": "rid",
                    "parent_table": config.PROD_RESOURCE_TABLE,
                    "parent_ref_column": "resource_code",
                    "parent_rid_column": "rid",
                    "is_parent": False,
                    "numeric_columns": ["salary", "bonus", "effort_in_hrs", "resource_cost", "net_resource_cost", "insurance", "deductions"],
                    "date_columns": ["effective_from", "end_date"],
                    "allow_duplicates": True,
                    "unique_columns": ["resource_code"]
                },
                "resource_skill": {
                    "main_table": config.PROD_RESOURCE_SKILL_TABLE,
                    "history_table": config.PROD_RESOURCE_SKILL_HISTORY_TABLE,
                    "timeline_table": config.ACCOUNT_TIMELINE_TABLE,
                    "ref_column": "resource_code",
                    "rid_column": "rid",
                    "parent_table": config.PROD_RESOURCE_TABLE,
                    "parent_ref_column": "resource_code",
                    "parent_rid_column": "rid",
                    "is_parent": False,
                    "numeric_columns": ["experience_years"],
                    "date_columns": ["start_date"],
                    "allow_duplicates": True,
                    "unique_columns": ["resource_code", "skill_type_rid"]
                },
                "project": {
                    "main_table": config.PROD_PROJECT_TABLE,
                    "history_table": config.PROD_PROJECT_HISTORY_TABLE,
                    "timeline_table": config.PROJECT_TIMELINE_TABLE,
                    "ref_column": "project_code",
                    "rid_column": "rid",
                    "is_parent": True,
                    "numeric_columns": ["total_cost", "total_effort", 
                                        "total_cost_nonlabor", "total_effort_fte", "total_effort_subcon", "total_cost_fte", 
                                        "total_cost_subcon", "blended_rate_fte", "blended_rate_subcon", "blended_rate"],
                    "date_columns": ["project_startdate", "project_enddate"],
                    "allow_duplicates": False
                },
                "project_resource": {
                    "main_table": config.PROD_PROJECT_RESOURCE_TABLE,
                    "history_table": config.PROD_PROJECT_RESOURCE_HISTORY_TABLE,
                    "timeline_table": config.PROJECT_TIMELINE_TABLE,
                    "ref_column": ["project_fiscal_rid", "resource_rid"],
                    "rid_column": "rid",
                    "is_parent": False,
                    "dual_parents": {
                        "project": {
                            "table": config.PROD_PROJECT_TABLE,
                            "ref_column": "project_code",
                            "rid_column": "project_rid"
                        },
                        "resource": {
                            "table": config.PROD_RESOURCE_TABLE,
                            "ref_column": "resource_code",
                            "rid_column": "resource_rid"
                        }
                    },
                    "unique_columns": ["project_fiscal_rid", "resource_rid", "project_resource_role"],
                    "numeric_columns": ["total_cost_pro_res", "net_total_cost_pro_res", "total_hours_pro_res", "total_hours_from_tasks", "total_cost_from_tasks"],
                    "date_columns": ["start_date", "end_date"],
                    "allow_duplicates": True
                },
                "project_task": {
                    "main_table": config.PROD_PROJECT_TASK_TABLE,
                    "history_table": config.PROD_PROJECT_TASK_HISTORY_TABLE,
                    "timeline_table": config.PROJECT_TIMELINE_TABLE,
                    "ref_column": ["project_fiscal_rid", "resource_rid"],
                    "rid_column": "rid",
                    "is_parent": False,
                    "dual_parents": {
                        "project": {
                            "table": config.PROD_PROJECT_TABLE,
                            "ref_column": "project_code",
                            "rid_column": "project_rid"
                        },
                        "resource": {
                            "table": config.PROD_RESOURCE_TABLE,
                            "ref_column": "resource_code",
                            "rid_column": "resource_rid"
                        }
                    },
                    "numeric_columns": ["total_cost", "total_hours"],
                    "date_columns": ["start_date", "end_date"],
                    "allow_duplicates": True
                }
            }

            if entity_type not in config_map:
                logger.error(f"[{entity_type}] Unsupported entity type encountered.")
                raise ValueError(f"Unsupported entity type: {entity_type}")

            db_config = config_map[entity_type]
            logger.info(f"[{entity_type}] Base configuration retrieved.")

            # Resolve tenant-specific table names
            db_config["main_table"] = self.get_tenant_table(account_r_number, db_config["main_table"])
            db_config["history_table"] = self.get_tenant_table(account_r_number, db_config["history_table"])
            logger.info(f"[{entity_type}] Main & history tables resolved to tenant-specific names.")

            if not db_config.get("is_parent", False) and "parent_table" in db_config:
                db_config["parent_table"] = self.get_tenant_table(account_r_number, db_config["parent_table"])
                logger.info(f"[{entity_type}] Parent table resolved to tenant-specific name.")

            return db_config

        except Exception as e:
            logger.error(f"[{entity_type}] Failed to get entity configuration: {str(e)}", exc_info=True)
            raise


    def _prepare_dataframe(self, df: DataFrame, db_config: dict, fiscal_year: int, entity_type: str, account_r_number: str) -> DataFrame:
        try:
            logger.info(f"[{entity_type}] Preparing input DataFrame: casting numeric/date columns, removing extras.")

            # Cast numeric columns
            for col_name in db_config.get("numeric_columns", []):
                if col_name in df.columns:
                    logger.debug(f"[{entity_type}] Casting column '{col_name}' to Decimal(19, 2).")
                    df = df.withColumn(col_name, F.col(col_name).cast(DecimalType(18, 2)))
                else:
                    logger.debug(f"[{entity_type}] Column '{col_name}' not found in DataFrame for casting.")

            # Cast date columns
            for col_name in db_config.get("date_columns", []):
                if col_name in df.columns:
                    logger.debug(f"[{entity_type}] Converting column '{col_name}' to DateType.")
                    df = df.withColumn(col_name, F.to_date(F.col(col_name)))
                else:
                    logger.debug(f"[{entity_type}] Column '{col_name}' not found in DataFrame for date conversion.")

            # Add fiscal year for applicable entities
            if entity_type == "resource_cost":
                logger.debug(f"[{entity_type}] Adding 'fiscal_year' column with value '{fiscal_year}'.")
                df = df.withColumn("fiscal_year", F.lit(fiscal_year))

            if entity_type in ["project_resource","project_task"]:
                if "project_fiscal_rid" not in df.columns:
                    df = self.map_fiscal_rid_with_data(df, entity_type, account_r_number, fiscal_year)

                if entity_type == "project_resource":
                    if "resource_role" in df.columns and "project_resource_role" not in df.columns:
                        logger.info(f"[{entity_type}] Renaming 'resource_role' to 'project_resource_role' for consistency.")
                        df = df.withColumnRenamed("resource_role", "project_resource_role")
            if entity_type == "project":
                for col_name in ["total_effort_from_tasks", "total_cost_from_tasks"]:
                    if col_name in df.columns:
                        df=df.drop(col_name)
                        logger.info(f"🔍 Dropped reference column: {col_name}")

            logger.info(f"[{entity_type}] DataFrame preparation complete. Final columns: {df.columns}")
            return df

        except Exception as e:
            logger.error(f"[{entity_type}] Error while preparing DataFrame: {str(e)}", exc_info=True)
            raise

    def _resolve_parents(self, df: DataFrame, db_config: dict, account_r_number: str, account_rid: str) -> DataFrame:
        try:
            if "dual_parents" in db_config:
                logger.info("Mapping dual parents for the DataFrame.")
                return self._map_dual_parents(df, db_config["dual_parents"], account_r_number, account_rid)
            
            logger.info("Mapping single parent for the DataFrame.")
            return self._map_parent_rid(df, db_config, account_rid)
        
        except Exception as e:
            logger.error(f"Error resolving parents: {str(e)}", exc_info=True)
            raise

    def _load_existing_data(
        self,
        df: DataFrame,
        db_config: dict,
        account_rid: str,
        entity_type: str
    ) -> DataFrame:

        table = db_config["main_table"]

        if entity_type == "project":
            filter_columns = ["project_code"]

        elif entity_type in ["resource", "resource_cost", "resource_skill"]:
            filter_columns = ["resource_code"]

        elif entity_type in ["project_resource"]:
            filter_columns = ["resource_rid", "project_fiscal_rid", "project_resource_role"]

        elif entity_type in ["project_task"]:
            filter_columns = ["resource_rid", "project_fiscal_rid"]

        else:
            raise ValueError(f"❌ Unsupported entity_type: {entity_type}")

        for col_name in filter_columns:
            if col_name not in df.columns:
                raise ValueError(f"❌ '{col_name}' column not found in input DataFrame.")

        base_query = f"""
            (SELECT *
            FROM {table}
            WHERE account_rid = '{account_rid}'
            ) AS base_table
        """

        logger.info(f"Base JDBC query for {entity_type}: {base_query}")

        existing_df = (
            self.spark.read
            .format("jdbc")
            .option("url", config.ENTITY_DB_URL)
            .option("dbtable", base_query)
            .option("user", config.ENTITY_DB_USER)
            .option("password", settings.ENTITY_DB_PASSWORD)
            .option("driver", config.ENTITY_DB_DRIVER)
            .load()
        )

        incoming_keys_df = df.select(*filter_columns).dropDuplicates()

        join_conds = []

        for c in filter_columns:
            if dict(df.dtypes)[c] == "string":
                join_conds.append(
                    F.lower(F.trim(existing_df[c])) ==
                    F.lower(F.trim(incoming_keys_df[c]))
                )
            else:
                join_conds.append(existing_df[c] == incoming_keys_df[c])

        final_condition = join_conds[0]
        for cond in join_conds[1:]:
            final_condition = final_condition & cond

        filtered_existing_df = (
            existing_df.alias("e")
            .join(incoming_keys_df.alias("i"), final_condition, "inner")
            .select("e.*")
        )
        logger.info(f"filtered_existing_df- {filtered_existing_df.columns}")
        return filtered_existing_df


    def _classify_records(self, df: DataFrame, existing_df: DataFrame, entity_type: str, db_config: dict) -> Tuple[DataFrame, Optional[DataFrame]]:
        """
        Classifies records into new records and records that need updating by comparing with existing data.
        
        Args:
            df: New data DataFrame
            existing_df: Existing data DataFrame
            db_config: Configuration dictionary containing:
                - entity_type: The type of entity being processed
                - ref_column: Reference column name
                - allow_duplicates: Boolean indicating if duplicates are allowed
                - unique_columns: List of columns that uniquely identify a record
                
        Returns:
            Tuple of (new_records, update_comparison) where:
            - new_records: Records that don't exist in the current data
            - update_comparison: Records that exist with both old and new values for comparison,
                                or None if no existing records
            
        Raises:
            ValueError: If required columns are missing
            AnalysisException: For Spark analysis errors
        """
        prefix = "existing_"  # Could make this configurable if needed

        try:
            logger.info(f"[{entity_type}] Starting record classification: new vs update.")
            self._validate_input_dataframes(df, existing_df, db_config)
            existing_count = existing_df.count()
            logger.info(f"[{entity_type}] Existing record count: {existing_count}")
            
            if existing_count == 0:
                logger.info(f"[{entity_type}] No existing records found. All records are new.")
                return df, None

            original_existing_cols = existing_df.columns
            logger.info(f"[{entity_type}] Original existing columns: {original_existing_cols}")

            # Alias existing columns with prefix
            existing_df = existing_df.select([F.col(c).alias(f"{prefix}{c}") for c in original_existing_cols])
            logger.info(f"[{entity_type}] Aliased existing columns with prefix '{prefix}'.")

            if entity_type not in ["resource_cost", "project_task"]:
                join_cond = self._get_join_condition(entity_type, db_config, prefix)
                logger.info(f"[{entity_type}] Join condition prepared: {join_cond}")

                # New records (records that don't exist in existing data)
                new_records = df.join(existing_df, join_cond, "left_anti")
                if new_records is not None and not new_records.rdd.isEmpty():
                    new_records.persist(StorageLevel.MEMORY_AND_DISK)
                new_count = new_records.count()
                logger.info(f"[{entity_type}] Identified {new_count} new records.")

                # Records that might need updates
                if entity_type == "project_resource":
                    logger.info("[project_resource] Applying role-based update filtering...")
                    
                    # First, get all records that match the join condition (potential updates)
                    all_potential_updates = df.join(existing_df, join_cond, "inner")
                    
                    # Apply the role-based filtering logic
                    update_comparison = all_potential_updates.filter(
                        # CASE 1: Both roles are NULL or empty → ALLOW UPDATE
                        (
                            (F.col("project_resource_role").isNull() | (F.col("project_resource_role") == "")) &
                            (F.col(f"{prefix}project_resource_role").isNull() | (F.col(f"{prefix}project_resource_role") == ""))
                        ) |
                        # CASE 2: Existing role is NULL/empty, incoming has any role → ALLOW UPDATE  
                        (
                            (F.col(f"{prefix}project_resource_role").isNull() | (F.col(f"{prefix}project_resource_role") == "")) &
                            (F.col("project_resource_role").isNotNull() & (F.col("project_resource_role") != ""))
                        ) |
                        # CASE 3: Both roles have values and they match → ALLOW UPDATE
                        (
                            (F.col("project_resource_role").isNotNull() & (F.col("project_resource_role") != "")) &
                            (F.col(f"{prefix}project_resource_role").isNotNull() & (F.col(f"{prefix}project_resource_role") != "")) &
                            (F.col("project_resource_role") == F.col(f"{prefix}project_resource_role"))
                        )
                        # CASE 4: Existing role has value, incoming is NULL/empty → EXCLUDE (do nothing - handled by not matching)
                        # CASE 5: Both have values but don't match → EXCLUDE from updates (will become inserts)
                    ).select(
                        *[F.col(f"{prefix}{c}").alias(f"old_{c}") for c in original_existing_cols],
                        *[df[c].alias(f"new_{c}") for c in df.columns]
                    )
                    
                    # Log the filtering results for debugging
                    total_potential = all_potential_updates.count()
                    final_updates = update_comparison.count()
                    excluded_count = total_potential - final_updates
                    
                    logger.info(f"[project_resource] Role filtering: {total_potential} potential → {final_updates} allowed → {excluded_count} excluded")
                    
                    # Now handle the excluded records - they should become new inserts
                    if excluded_count > 0:
                        # Get records that were excluded from updates
                        excluded_from_updates = all_potential_updates.join(
                            update_comparison.select(
                                F.col("new_project_fiscal_rid").alias("project_fiscal_rid"),
                                F.col("new_resource_rid").alias("resource_rid")
                            ),
                            on=["project_fiscal_rid", "resource_rid"],
                            how="left_anti"
                        )
                        
                        # Analyze what types of records were excluded
                        excluded_cases = excluded_from_updates.select(
                            F.col("project_resource_role").alias("incoming_role"),
                            F.col(f"{prefix}project_resource_role").alias("existing_role")
                        ).distinct().collect()
                        
                        for case in excluded_cases:
                            existing_role = case.existing_role if case.existing_role else "NULL"
                            incoming_role = case.incoming_role if case.incoming_role else "NULL"
                            logger.info(f"[project_resource] Excluded case: Existing='{existing_role}', Incoming='{incoming_role}'")
                        
                        # Convert excluded records to the format for new_records
                        excluded_new_records = (
                            excluded_from_updates
                            .select([df[c] for c in df.columns])
                            .dropDuplicates(db_config["unique_columns"])  # or the set of columns that define one record
                        )
                        
                        if excluded_new_records is not None and not excluded_new_records.rdd.isEmpty():
                            logger.info(f"[project_resource] Converting {excluded_new_records.count()} excluded updates to new records")
                            
                            # Add these excluded records to new_records as inserts
                            new_records = new_records.unionByName(excluded_new_records)
                            
                            # Re-persist and recount
                            if new_records is not None and not new_records.rdd.isEmpty():
                                new_records.persist(StorageLevel.MEMORY_AND_DISK)
                                new_count = new_records.count()
                                logger.info(f"[project_resource] Final new records count after adding excluded updates: {new_count}")

                else:
                    # For other entity types, use standard update logic
                    update_comparison = df.join(existing_df, join_cond, "inner").select(
                        *[F.col(f"{prefix}{c}").alias(f"old_{c}") for c in original_existing_cols],
                        *[df[c].alias(f"new_{c}") for c in df.columns]
                    )

                if update_comparison is not None and not update_comparison.rdd.isEmpty():
                    update_comparison.persist(StorageLevel.MEMORY_AND_DISK)
                update_count = update_comparison.count()
                logger.info(f"[{entity_type}] Identified {update_count} records to check for updates.")

            else:
                logger.info(f"{entity_type} Skipping join condition - only inserts allowed (no updates).")

                # For resource_cost → only inserts
                new_records = df
                if new_records is not None and not new_records.rdd.isEmpty():
                    new_records.persist(StorageLevel.MEMORY_AND_DISK)
                new_count = new_records.count()
                logger.info(f"[resource_cost] Identified {new_count} new records.")

                # No updates at all
                update_comparison = self.spark.createDataFrame([], df.schema)
            # Clean up persisted DataFrames
            if new_records is not None and not new_records.rdd.isEmpty():
                new_records.unpersist()
            if update_comparison is not None and not update_comparison.rdd.isEmpty():
                update_comparison.unpersist()
                
            return new_records, update_comparison

        except AnalysisException as ae:
            logger.error(f"[{entity_type}] Spark analysis error while classifying records: {str(ae)}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"[{entity_type}] Unexpected error while classifying records: {str(e)}", exc_info=True)
            raise

    def _safe_eq(self, col1: str, col2: str, case_insensitive: bool = False) -> Column:
        """
        Null-safe column comparison with optional case insensitivity.
        """
        if case_insensitive:
            return F.lower(F.trim(F.col(col1))).eqNullSafe(
                F.lower(F.trim(F.col(col2)))
            )
        else:
            return F.col(col1).eqNullSafe(F.col(col2))


    def _get_join_condition(self, entity_type: str, db_config: dict, prefix: str) -> Column:
        """
        Creates the appropriate join condition based on entity type and configuration.
        """

        # ============================================================
        # PROJECT → CASE-INSENSITIVE project_code + NULL SAFE
        # ============================================================
        if entity_type == "project":
            logger.info(f"{entity_type} Using composite key (account_rid, project_code) for matching.")

            return (
                self._safe_eq("account_rid", f"{prefix}account_rid") &
                self._safe_eq("project_code", f"{prefix}project_code", case_insensitive=True)
            )
        # ============================================================
        # RESOURCE → CASE-INSENSITIVE resource_code + NULL SAFE
        # ============================================================
        if entity_type == "resource":
            logger.info(f"{entity_type} Using case-insensitive resource_code for matching.")

            return (
                self._safe_eq("account_rid", f"{prefix}account_rid") &
                self._safe_eq("resource_code", f"{prefix}resource_code", case_insensitive=True)
            )
        # ============================================================
        # PROJECT_RESOURCE & PROJECT_TASK → NULL SAFE RID MATCHING
        # ============================================================
        if entity_type in ["project_resource", "project_task"]:
            ref_cols = ["project_rid", "resource_rid"]
            logger.info(f"{entity_type} Using composite reference keys {ref_cols} for matching.")

            return reduce(
                lambda a, b: a & b,
                [self._safe_eq(c, f"{prefix}{c}") for c in ref_cols]
            )

        # ============================================================
        # DUPLICATES ALLOWED → UNIQUE COLUMNS
        # ============================================================
        if db_config.get("allow_duplicates", False):
            unique_cols = db_config.get("unique_columns", db_config["ref_column"])
            if not isinstance(unique_cols, list):
                unique_cols = [unique_cols]

            logger.info(f"{entity_type} Duplicates allowed. Using unique columns for comparison: {unique_cols}")

            return reduce(
                lambda a, b: a & b,
                [self._safe_eq(c, f"{prefix}{c}") for c in unique_cols]
            )

        # ============================================================
        # DUPLICATES NOT ALLOWED → REF COLUMN(S)
        # ============================================================
        ref_col = db_config["ref_column"]

        if isinstance(ref_col, list):
            logger.info(f"{entity_type} Duplicates NOT allowed. Using reference columns {ref_col} for comparison.")

            return reduce(
                lambda a, b: a & b,
                [self._safe_eq(c, f"{prefix}{c}") for c in ref_col]
            )
        else:
            logger.info(f"{entity_type} Duplicates NOT allowed. Using reference column '{ref_col}' for comparison.")

            return self._safe_eq(ref_col, f"{prefix}{ref_col}")

    def _validate_input_dataframes(self, df: DataFrame, existing_df: DataFrame, db_config: dict) -> None:
        """
        Validates that input DataFrames contain required columns.
        
        Args:
            df: New data DataFrame
            existing_df: Existing data DataFrame
            db_config: Configuration dictionary
            
        Raises:
            ValueError: If required columns are missing
        """
        entity_type = db_config.get("entity_type")
        
        if entity_type == "project":
            required_cols = {"account_rid", "project_code"}
            missing_cols = required_cols - set(df.columns)
            if missing_cols:
                raise ValueError(f"[{entity_type}] Missing required columns in input DataFrame: {missing_cols}")
            
            missing_existing_cols = {f"account_rid", "project_code"} - set(existing_df.columns)
            if missing_existing_cols:
                raise ValueError(f"[{entity_type}] Missing required columns in existing DataFrame: {missing_existing_cols}")
        
        # Add validation for other entity types if needed

    def _insert_new_records(self, new_df: DataFrame, db_config: dict, account_rid: str, account_r_number: str, modified_by: str, entity_type: str, document_id: str):
        try:
            if new_df is not None and not new_df.rdd.isEmpty():
                new_df.persist(StorageLevel.MEMORY_AND_DISK)
            record_count = new_df.count()
            if record_count == 0:
                logger.info(f"[{entity_type}] No new records to insert.")
                return

            logger.info(f"[{entity_type}] Inserting {record_count} new records into {db_config['main_table']}.")

            num_partitions = self.get_partition_count(record_count)
            new_df = new_df.withColumn(
                "rid",
                F.concat(F.lit(Constants.Database.UUID_PREFIX + "-"), F.expr("uuid()"))
            )
            event_df = new_df
            if "source_record_count" in new_df.columns:
                new_df = new_df.drop("source_record_count")
            
            new_df = new_df.repartition(num_partitions)
            logger.info(f"Repartitioned DataFrame into {num_partitions} partitions.")
            new_df.write \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", db_config["main_table"]) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .option("stringtype", "unspecified") \
                .option("batchsize", 100) \
                .mode("append") \
                .save()
            if new_df is not None:
                new_df.unpersist()
            logger.info(f"[{entity_type}] Insert completed. Fetching inserted records for logging.")

            if entity_type != "project":
                logger.info("proceeding for log entity insert event")
                event_type_rid = self.get_event_type_rid(event_type_name="etl", entity_type=entity_type)
                self.log_entity_event_spark(
                    df= event_df,
                    account_rid=account_rid,
                    account_r_number=account_r_number,
                    event_name="created",
                    event_type_rid= event_type_rid,
                    event_status="success",
                    entity_type=entity_type,
                    rid_column=db_config["rid_column"],
                    document_id=document_id,
                    created_by=modified_by,
                    modified_by=modified_by
                )
            # ---------------------------------------------------------
            # HANDLE CASE_PROJECT_RESOURCE / CASE_PROJECT_TASK
            # ---------------------------------------------------------
            if entity_type in ["project_resource", "project_task"]:

                logger.info(f"[{entity_type}] Processing case mappings...")

                # 1️⃣ Read CASE_PROJECT table
                case_project_table = self.get_tenant_table(account_r_number, config.CASE_PROJECTS_TABLE)
                if not self.table_exists_pg(case_project_table):
                    logger.warning(f"CASE_PROJECT table {case_project_table} does not exist. Skipping case insert.")
                    return

                case_project_df = (
                    self.spark.read.format("jdbc")
                    .option("url", config.ENTITY_DB_URL)
                    .option("dbtable", case_project_table)
                    .option("user", config.ENTITY_DB_USER)
                    .option("password", settings.ENTITY_DB_PASSWORD)
                    .option("driver", config.ENTITY_DB_DRIVER)
                    .load()
                    .select(
                        "rid",         
                        "case_rid",
                        "project_fiscal_rid"
                    )
                    .withColumnRenamed("rid", "case_project_rid")
                )

                # 2️⃣ Read CASES table
                cases_table = self.get_tenant_table(account_r_number, config.CASES_TABLE)
                closed_status_rid = self.get_case_status_rid("Closed")
                if not self.table_exists_pg(cases_table):
                    logger.warning(f"CASES table {cases_table} does not exist. Skipping case insert.")
                    return

                cases_df = (
                    self.spark.read.format("jdbc")
                    .option("url", config.ENTITY_DB_URL)
                    .option("dbtable", cases_table)
                    .option("user", config.ENTITY_DB_USER)
                    .option("password", settings.ENTITY_DB_PASSWORD)
                    .option("driver", config.ENTITY_DB_DRIVER)
                    .load()
                    .select(
                        F.col("rid").alias("case_rid"),
                        F.col("status_rid").alias("case_status_rid")
                    )
                )

                # ---------------------------------------------------------
                # 🔄 FETCH r_number for the inserted rows
                # ---------------------------------------------------------
                inserted_rids = [row["rid"] for row in new_df.select("rid").collect()]

                if entity_type == "project_resource":
                    prod_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_RESOURCE_TABLE)
                else:
                    prod_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_TASK_TABLE)

                logger.info(f"[{entity_type}] Fetching r_number for inserted rows...")

                inserted_prod_df = (
                    self.spark.read.format("jdbc")
                        .option("url", config.ENTITY_DB_URL)
                        .option(
                            "dbtable",
                            f"""
                            (SELECT rid, r_number
                            FROM {prod_table}
                            WHERE rid IN ({','.join([f"'{x}'" for x in inserted_rids])})
                            ) AS sub
                            """
                        )
                        .option("user", config.ENTITY_DB_USER)
                        .option("password", settings.ENTITY_DB_PASSWORD)
                        .option("driver", config.ENTITY_DB_DRIVER)
                        .load()
                )
                # Join r_number back into new_df WITHOUT dropping any business columns
                joined_df = (
                    new_df.alias("n")
                        .join(
                            inserted_prod_df.alias("p"),
                            F.col("n.rid") == F.col("p.rid"),
                            "inner"
                        )
                        .drop(F.col("p.rid"))
                )
                if entity_type == "project_resource":
                    joined_df = joined_df.withColumnRenamed("rid", "project_resource_rid")
                else:
                    joined_df = joined_df.withColumnRenamed("rid", "project_task_rid")
                mapped_case_df = (
                    joined_df
                        .join(case_project_df, "project_fiscal_rid", "inner")
                        .join(cases_df, "case_rid", "inner")
                        .filter(F.col("case_status_rid") != closed_status_rid)
                )
                if "case_status_rid" in mapped_case_df.columns:
                    mapped_case_df = mapped_case_df.drop("case_status_rid")
                if "fiscal_year" in mapped_case_df.columns:
                    mapped_case_df = mapped_case_df.withColumn("fiscal_year", F.col("fiscal_year").cast("int"))
                if mapped_case_df.rdd.isEmpty():
                    logger.info(f"[{entity_type}] No active cases found — skipping case mapping.")
                else:
                    # 4️⃣ Decide target table
                    if entity_type == "project_resource":
                        target_table = self.get_tenant_table(
                            account_r_number,
                            config.CASE_PROJECT_RESOURCE_TABLE
                        )
                    else:
                        target_table = self.get_tenant_table(
                            account_r_number,
                            config.CASE_PROJECT_TASK_TABLE
                        )

                    # 5️⃣ Build insert DF
                    case_insert_df = (
                        mapped_case_df
                        .withColumn(
                            "rid",
                            F.concat(
                                F.lit(Constants.Database.UUID_PREFIX + "-"),
                                F.expr("uuid()")
                            )
                        )
                    )
                    if not self.table_exists_pg(target_table):
                        logger.warning(f"{target_table} does not exist. Skipping case insert.")
                        return
                        
                    logger.info(
                        f"[{entity_type}] Inserting {case_insert_df.count()} rows into {target_table}"
                    )
                    case_insert_df.write \
                        .format("jdbc") \
                        .mode("append") \
                        .option("url", config.ENTITY_DB_URL) \
                        .option("dbtable", target_table) \
                        .option("user", config.ENTITY_DB_USER) \
                        .option("password", settings.ENTITY_DB_PASSWORD) \
                        .option("driver", config.ENTITY_DB_DRIVER) \
                        .option("batchsize", 500) \
                        .save()

                    logger.info(f"[{entity_type}] Case mapping insert completed.")

        except Exception as e:
            logger.error(f"[{entity_type}] Error while inserting records: {str(e)}", exc_info=True)
            raise

    def get_event_type_rid(self, event_type_name: str, entity_type: str) -> str:
        """
        Get event_type_rid for a given event_type.
        """
        event_type_table = self.get_public_table(config.EVENT_TYPE_TABLE)
        with DBPool.get_connection_mainDB() as conn:
            with conn.cursor() as cursor:
                query = f"""
                    SELECT rid 
                    FROM {event_type_table} 
                    WHERE event_type_name = %s
                """
                params = (event_type_name,)
                cursor.execute(query, params)
                result = cursor.fetchone()
                if result:
                    return result[0]
                else:
                    logger.error(f"[{entity_type}] No event_type_rid found for event_type_name: {event_type_name}")
                    raise ValueError(f"[{entity_type}] No event_type_rid found for event_type_name: {event_type_name}")



    def _update_existing_records(
        self,
        update_df: DataFrame,
        db_config: dict,
        df: DataFrame,
        account_rid: str,
        account_r_number: str,
        modified_by: str,
        entity_type: str,
        document_id: str,
        parent_entity_type: Optional[str] = None
    ):
        """
        Optimized update routine:
        - compute changed rows fully in Spark (no collect())
        - produce changed_records_df with dynamic RID column name per entity_type
        - write staging updates and MERGE once
        - insert history rows using Spark unions
        """
        try:
            temp_tables = []
            if update_df is None or update_df.rdd.isEmpty():
                logger.info(f"[{entity_type}] No records to evaluate for update.")
                return

            logger.info(f"[{entity_type}] Evaluating update candidates...")
            metadata_fields = ["created_datetime", "created_by", db_config["rid_column"]]
            update_columns = [c for c in df.columns if c not in metadata_fields]

            parent_rid_col = db_config.get("parent_rid_column")
            logger.info(f"parent_rid_col: {parent_rid_col}")

            # Build change conditions for each column (old_ / new_ prefixed columns expected in update_df)
            change_conditions = []
            for col_name in update_columns:
                old_col = f"old_{col_name}"
                new_col = f"new_{col_name}"
                if old_col in update_df.columns and new_col in update_df.columns:
                    change_conditions.append(
                        (~F.col(old_col).eqNullSafe(F.col(new_col))) & F.col(new_col).isNotNull()
                    )

            has_changes = reduce(lambda a, b: a | b, change_conditions) if change_conditions else F.lit(False)

            changed_records_df_spark = update_df.filter(has_changes)
            unchanged_records = update_df.filter(~has_changes)

            # Mark unchanged records as failed in staging (existing behavior)
            if not unchanged_records.rdd.isEmpty() and parent_entity_type not in ["project_task", "project_resource"]:
                staging_table = self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_TABLE)
                failed_df = unchanged_records.select(
                    F.when(F.col("new_resource_code").isNotNull(), F.col("new_resource_code"))
                    .otherwise(F.col("old_resource_code")).alias("resource_id"),
                    F.lit(account_rid).alias("account_rid"),
                    F.lit(document_id).alias("document_rid"),
                    F.lit(Constants.ErrorMessages.NO_CHANGE_DETECTED).alias("error_descriptions"),
                    F.lit("Failed").alias("status")
                )
                uid = uuid.uuid4().hex[:8]
                staging_updates = f"{staging_table}_temp_{uid}"
                temp_tables.append(staging_updates)
                failed_df.write \
                    .format("jdbc") \
                    .option("url", config.ENTITY_DB_URL) \
                    .option("dbtable", staging_updates) \
                    .option("user", config.ENTITY_DB_USER) \
                    .option("password", settings.ENTITY_DB_PASSWORD) \
                    .option("driver", config.ENTITY_DB_DRIVER) \
                    .option("stringtype", "unspecified") \
                    .option("createTableColumnTypes", "resource_id VARCHAR(255), account_rid VARCHAR(100), document_rid VARCHAR(100), error_descriptions VARCHAR(255), status VARCHAR(50)") \
                    .mode("overwrite") \
                    .save()

                update_sql = f"""
                    UPDATE {staging_table} s
                    SET error_descriptions = TRIM(BOTH ';' FROM 
                                                COALESCE(s.error_descriptions, '') 
                                                || CASE WHEN s.error_descriptions IS NULL OR s.error_descriptions = '' 
                                                        THEN '' ELSE '; ' END
                                                || u.error_descriptions),
                        status = u.status
                    FROM {staging_updates} u
                    WHERE s.account_rid = u.account_rid
                    AND s.resource_id = u.resource_id
                    AND s.document_rid = u.document_rid;
                """
                drop_staging_sql = f"DROP TABLE IF EXISTS {staging_updates};"
                with DBPool.get_connection() as conn:
                    with conn.cursor() as cursor:
                        cursor.execute(update_sql)
                        cursor.execute(drop_staging_sql)
                    conn.commit()
                logger.info(f"[{entity_type}] Marked {unchanged_records.count()} unchanged records as Failed in staging.")

            # duplicates / existing_codes check (keep as-is but try to avoid huge collect)
            if db_config.get("ref_column") and not db_config.get("allow_duplicates", False):
                code_column = db_config["ref_column"]
                existing_codes_df = (
                    self.spark.read
                    .format("jdbc")
                    .option("url", config.ENTITY_DB_URL)
                    .option("dbtable", db_config["main_table"])
                    .option("user", config.ENTITY_DB_USER)
                    .option("password", settings.ENTITY_DB_PASSWORD)
                    .option("driver", config.ENTITY_DB_DRIVER)
                    .load()
                    .select(*([code_column] if isinstance(code_column, str) else code_column),
                            "account_rid", db_config["rid_column"])
                )

                if isinstance(code_column, list):
                    # build multi-column join condition
                    join_condition = (
                        (F.col("c.new_account_rid") == F.col("e.account_rid")) &
                        (F.col(f"c.old_{db_config['rid_column']}") != F.col(f"e.{db_config['rid_column']}"))
                    )
                    for cc in code_column:
                        join_condition &= (F.col(f"c.new_{cc}") == F.col(f"e.{cc}"))
                    duplicates = (
                        changed_records_df_spark.alias("c")
                        .join(existing_codes_df.alias("e"), join_condition, "inner")
                        .select(F.col(f"c.old_{db_config['rid_column']}").alias("dup_rid"))
                    )
                else:
                    duplicates = (
                        changed_records_df_spark.alias("c")
                        .join(existing_codes_df.alias("e"),
                            (F.col(f"c.new_{code_column}") == F.col(f"e.{code_column}")) &
                            (F.col("c.new_account_rid") == F.col("e.account_rid")) &
                            (F.col(f"c.old_{db_config['rid_column']}") != F.col(f"e.{db_config['rid_column']}")),
                            "inner")
                        .select(F.col(f"c.old_{db_config['rid_column']}").alias("dup_rid"))
                    )

                valid_updates = changed_records_df_spark.join(
                    duplicates, changed_records_df_spark[f"old_{db_config['rid_column']}"] == duplicates["dup_rid"], "left_anti"
                )
            else:
                valid_updates = changed_records_df_spark

            # -----------------------------
            # Build changed_records_df in Spark (distributed)
            # -----------------------------
            # dynamic RID column mapping requested:
            if entity_type == "project":
                dynamic_rid_col = "project_rid"
            elif entity_type == "resource":
                dynamic_rid_col = "resource_rid"
            elif entity_type == "project_resource":
                dynamic_rid_col = "project_resource_rid"
            elif entity_type == "project_task":
                dynamic_rid_col = "project_task_rid"
            else:
                dynamic_rid_col = db_config["rid_column"]

            # create a list of small DataFrames — each DataFrame contains changes for one column
            change_dfs = []
            for col_name in update_columns:
                old_col = f"old_{col_name}"
                new_col = f"new_{col_name}"
                if old_col in valid_updates.columns and new_col in valid_updates.columns:
                    cond = (~F.col(old_col).eqNullSafe(F.col(new_col))) & F.col(new_col).isNotNull()
                    # fiscal_year: prefer new_fiscal_year if present otherwise fallback to fiscal_year; cast to int safely
                    if "new_fiscal_year" in valid_updates.columns:
                        fy_expr = F.col("new_fiscal_year").cast("int")
                    elif "fiscal_year" in valid_updates.columns:
                        fy_expr = F.col("fiscal_year").cast("int")
                    else:
                        fy_expr = F.lit(None).cast("int")
                    # Determine the dynamic rid value expression:
                    # Try common variants that may exist in valid_updates: old_<physical rid>, new_<physical rid>, or physical rid column itself
                    physical_rid = db_config["rid_column"]
                    rid_expr = None
                    if f"old_{dynamic_rid_col}" in valid_updates.columns:
                        rid_expr = F.col(f"old_{dynamic_rid_col}")
                    elif f"new_{dynamic_rid_col}" in valid_updates.columns:
                        rid_expr = F.col(f"new_{dynamic_rid_col}")
                    elif dynamic_rid_col in valid_updates.columns:
                        rid_expr = F.col(dynamic_rid_col)
                    else:
                        # fallback to old_<physical rid> or new_<physical rid> or physical rid
                        if f"old_{physical_rid}" in valid_updates.columns:
                            rid_expr = F.col(f"old_{physical_rid}")
                        elif f"new_{physical_rid}" in valid_updates.columns:
                            rid_expr = F.col(f"new_{physical_rid}")
                        elif physical_rid in valid_updates.columns:
                            rid_expr = F.col(physical_rid)
                        else:
                            # if we cannot find a rid expression, produce a NULL -- those rows will be filtered out later
                            rid_expr = F.lit(None).cast(StringType())

                    change_df = valid_updates.filter(cond).select(
                        rid_expr.alias(dynamic_rid_col),
                        fy_expr.alias("fiscal_year"),
                        F.lit(col_name).alias("attribute_name"),
                        F.col(old_col).cast("string").alias("old_value"),
                        F.col(new_col).cast("string").alias("new_value"),
                        F.lit(account_rid).alias("account_rid")
                    )
                    change_dfs.append(change_df)

            # union all change dfs into a single changed_records_df (or None)
            changed_records_df = None
            if change_dfs:
                changed_records_df = reduce(lambda a, b: a.unionByName(b, allowMissingColumns=True), change_dfs)
                # remove rows without rid (can't update cases without a rid)
                changed_records_df = changed_records_df.filter(F.col(dynamic_rid_col).isNotNull())
                # persist if we'll use it again
                changed_records_df = changed_records_df.persist(StorageLevel.MEMORY_AND_DISK)

            if changed_records_df is not None:
                logger.info(f"[{entity_type}] Detected changed_records (sample):")
            else:
                logger.info(f"[{entity_type}] No changed records detected.")

            # -----------------------------
            # Build updates_df (staging) - keep your original pattern
            # -----------------------------
            rid_column = db_config["rid_column"]
            updates_df = valid_updates.select(
                *[F.col(f"new_{c}").alias(c) for c in update_columns],
                F.lit(modified_by).alias("modified_by"),
                F.current_timestamp().alias("modified_datetime"),
                F.col(f"old_{rid_column}").alias(rid_column)
            )
            event_df = updates_df.select("*")
            uid = uuid.uuid4().hex[:8]
            staging_updates = f"{db_config['main_table']}_temp_{uid}"
            temp_tables.append(staging_updates)

            # build createTableColumnTypes similarly to your previous approach
            def map_column_type(col_name: str):
                if col_name == "fiscal_year":
                    return f"{col_name} INTEGER"
                # Explicitly handle numeric columns with precision/scale
                if col_name in db_config.get("numeric_columns", []):
                    return f"{col_name} NUMERIC(18,2)"
                if col_name in db_config.get("date_columns", []):
                    return f"{col_name} DATE"
                if col_name.endswith("_rid") or col_name.endswith("_code"):
                    return f"{col_name} VARCHAR(50)"
                if col_name in ("rid", "modified_by"):
                    return f"{col_name} VARCHAR(50)"
                if col_name == "modified_datetime":
                    return f"{col_name} TIMESTAMP"
                return f"{col_name} VARCHAR(255)"
            if "source_record_count" in updates_df.columns:
                updates_df = updates_df.drop("source_record_count")
            column_types = [map_column_type(c) for c in update_columns]
            column_types.append("rid VARCHAR(50)")
            column_types.append("modified_by VARCHAR(50)")
            column_types.append("modified_datetime TIMESTAMP")
            create_table_types = ", ".join(column_types)
            updates_df.write \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", staging_updates) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .option("stringtype", "unspecified") \
                .option("createTableColumnTypes", create_table_types) \
                .mode("overwrite") \
                .save()

            logger.info(f"[{entity_type}] Written updates to staging table: {staging_updates}")

            # Run single MERGE / UPDATE in DB
            schema, table = db_config["main_table"].split('.') if '.' in db_config["main_table"] else ("trd365", db_config["main_table"])
            set_expressions = [f"{c} = COALESCE(s.{c}, m.{c})" for c in update_columns]
            merge_sql = f"""
                UPDATE {schema}.{table} m
                SET {", ".join(set_expressions)},
                    modified_by = s.modified_by,
                    modified_datetime = s.modified_datetime
                FROM {staging_updates} s
                WHERE m.{rid_column} = s.{rid_column}
                AND m.account_rid = s.account_rid;
            """
            drop_staging_sql = f"DROP TABLE IF EXISTS {staging_updates};"

            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(merge_sql)
                    cursor.execute(drop_staging_sql)
                conn.commit()

            logger.info(f"[{entity_type}] Bulk update applied via MERGE.")

            # If project_resource, call update_cases_from_changed_records using the changed_records_df (if present)
            if entity_type == "project_resource" and changed_records_df is not None:
                try:
                    # change function expects (cursor, account_rid, changed_records, account_r_number, table_type)
                    self.update_cases_from_changed_records(
                        account_rid,
                        changed_records_df,
                        account_r_number,
                        "project_resource",
                        modified_by
                    )
                except Exception as case_exc:
                    logger.error(f"Failed to update cases from changed records: {case_exc}", exc_info=True)
                    raise

            # -----------------------------
            # Build history DataFrames (distributed) and append
            # -----------------------------
            history_table = db_config["history_table"]

            history_parts = []
            for col_name in update_columns:
                old_col = f"old_{col_name}"
                new_col = f"new_{col_name}"
                if old_col in valid_updates.columns and new_col in valid_updates.columns:
                    parent_expr = F.col(f"old_{parent_rid_col}") if parent_rid_col else F.col(f"old_{rid_column}")
                    history_part = valid_updates.filter((~F.col(old_col).eqNullSafe(F.col(new_col))) & F.col(new_col).isNotNull()).select(
                        parent_expr.alias(
                            "project_rid" if entity_type == "project" else
                            "project_resource_rid" if entity_type == "project_resource" else
                            "project_task_rid" if entity_type == "project_task" else
                            ("resource_rid" if entity_type == "resource" else "resource_skill_rid")
                        ),
                        F.lit(col_name).alias("attribute_name"),
                        F.col(old_col).cast("string").alias("old_value"),
                        F.col(new_col).cast("string").alias("new_value"),
                        F.current_timestamp().alias("modified_datetime"),
                        F.col("old_created_datetime").alias("created_datetime"),
                        F.lit(modified_by).alias("created_by"),
                        F.lit(modified_by).alias("modified_by")
                    )
                    history_parts.append(history_part)

            if history_parts:
                final_history_df = reduce(lambda a, b: a.unionByName(b, allowMissingColumns=True), history_parts)
                final_history_df.write \
                    .format("jdbc") \
                    .option("url", config.ENTITY_DB_URL) \
                    .option("dbtable", history_table) \
                    .option("user", config.ENTITY_DB_USER) \
                    .option("password", settings.ENTITY_DB_PASSWORD) \
                    .option("driver", config.ENTITY_DB_DRIVER) \
                    .option("stringtype", "unspecified") \
                    .mode("append") \
                    .save()
                logger.info(f"[{entity_type}] Inserted {final_history_df.count()} history records.")

            event_type_rid = self.get_event_type_rid(event_type_name="etl", entity_type=entity_type)
            # Log entity events
            self.log_entity_event_spark(
                df=event_df,
                account_rid=account_rid,
                account_r_number=account_r_number,
                event_name="updated",
                event_type_rid=event_type_rid,
                event_status="success",
                entity_type=entity_type,
                rid_column=rid_column,
                document_id=document_id,
                created_by=modified_by,
                modified_by=modified_by,
            )

            # cleanup
            if update_df is not None:
                update_df.unpersist()
            if 'valid_updates' in locals() and valid_updates is not None:
                try:
                    valid_updates.unpersist()
                except Exception:
                    pass
            if 'changed_records_df' in locals() and changed_records_df is not None:
                try:
                    changed_records_df.unpersist()
                except Exception:
                    pass

        except Exception as e:
            logger.error(f"[{entity_type}] Error while updating records: {str(e)}", exc_info=True)
            raise
        finally:
            for temp in temp_tables:
                try:
                    logger.info(f"🧹 Cleaning temp table (if exists): {temp}")
                    drop_sql = f"DROP TABLE IF EXISTS {temp};"
                    with DBPool.get_connection() as conn:
                        with conn.cursor() as cursor:
                            cursor.execute(drop_sql)
                        conn.commit()
                    logger.info(f"✅ Temp table {temp} dropped successfully.")
                except Exception as cleanup_err:
                    logger.error(f"⚠️ Failed to drop temp table {temp}: {cleanup_err}")

    def _handle_special_entities(
        self,
        df: DataFrame,
        existing_df: DataFrame,
        account_r_number: str,
        db_config: dict,
        entity_type: str,
        modified_by: str,
        account_rid: str,
        document_id: str,
        fiscal_year: int,
        parent_entity_type: str = None,
    ) -> DataFrame:
        try:
            logger.info(f"[{entity_type}] 🚀 Starting special entity handling...")
            if parent_entity_type == "project_resource" and entity_type == "project_resource":
                try:
                    logger.info(f"[project_resource] 🚀 Starting project resource entity handling...")
                    
                    # Map RIDs and R-Numbers
                    df = self.map_entity_rid_and_r_number_with_data(df, entity_type, account_r_number, account_rid)
                    active_status_rid = self.get_active_status_rid()
                    inactive_status_rid = self.get_inactive_status_rid()

                    df = df.withColumn(
                        "status_rid",
                        when(
                            (col("project_status_rid") == lit(active_status_rid)) &
                            (col("resource_status_rid") == lit(active_status_rid)),
                            lit(active_status_rid)
                        ).otherwise(lit(inactive_status_rid))
                    )
                    invalid_nulls = self.spark.createDataFrame([], df.schema)
                    
                    # First rename the column to match existing data structure
                    if "resource_role" in df.columns:
                        df = df.withColumnRenamed("resource_role", "project_resource_role")
                    
                    incoming_count = df.count()
                    
                    if incoming_count == 0:
                        logger.info("[project_resource] No incoming records to process")
                        return df
                        
                    elif incoming_count == 1:
                        logger.info("[project_resource] Single incoming record, applying simplified deduplication")
                        # For single record, just check if it's a complete duplicate of existing data
                        valid_df = df
                        invalid_df = self.spark.createDataFrame([], df.schema)
                        
                    else:
                        # Define window: group by project, resource AND role, rank by start_date
                        w = Window.partitionBy(
                            "project_fiscal_rid",
                            "resource_rid",
                            "project_resource_role"
                        ).orderBy(F.col("start_date"))

                        null_w = Window.partitionBy(
                            "project_fiscal_rid",
                            "resource_rid",
                            "project_resource_role"
                        ).orderBy(F.monotonically_increasing_id())

                        df2 = (
                            df
                            .withColumn("prev_start_date", F.lag("start_date").over(w))
                            .withColumn("prev_end_date",   F.lag("end_date").over(w))
                            .withColumn(
                                "null_date_rn",
                                F.when(
                                    F.col("start_date").isNull() & F.col("end_date").isNull(),
                                    F.row_number().over(null_w)
                                )
                            )
                        )

                        df2 = df2.withColumn(
                            "is_invalid",
                            F.when(
                                # CASE 1: BOTH DATES PRESENT → overlap or same start_date
                                F.col("start_date").isNotNull() & F.col("end_date").isNotNull() &
                                (
                                    (F.col("start_date") == F.col("prev_start_date")) |
                                    (
                                        F.col("prev_end_date").isNotNull() &
                                        (F.col("start_date") <= F.col("prev_end_date"))
                                    )
                                ),
                                F.lit(True)
                            )
                            .when(
                                # CASE 2: BOTH DATES NULL → allow ONLY ONE
                                (F.col("start_date").isNull() & F.col("end_date").isNull()) &
                                (F.col("null_date_rn") > 1),
                                F.lit(True)
                            )
                            .otherwise(F.lit(False))
                        )

                        valid_df = df2.filter(~F.col("is_invalid")) \
                                    .drop("prev_start_date", "prev_end_date", "null_date_rn", "is_invalid")

                        invalid_df = df2.filter(F.col("is_invalid")) \
                                        .drop("prev_start_date", "prev_end_date", "null_date_rn", "is_invalid")

                        invalid_nulls = self.spark.createDataFrame([], df.schema)

                    # =====================================================
                    # ✅ NEW VALIDATION: Resource dates must fall within Project dates
                    # =====================================================
                    logger.info("[project_resource] ✅ Validating resource dates against project dates...")

                    # Make sure these are DATE type (in case they came as strings)
                    for c in ["resource_startdate", "resource_enddate", "project_startdate", "project_enddate"]:
                        if c in valid_df.columns:
                            valid_df = valid_df.withColumn(c, to_date(col(c)))

                    # A row is INVALID if:
                    #   all 4 dates are NOT NULL
                    #   AND (resource_startdate < project_startdate OR resource_enddate > project_enddate)
                    invalid_date_condition = (
                        col("resource_startdate").isNotNull() &
                        col("project_startdate").isNotNull() &
                        (
                            (col("resource_startdate") < col("project_startdate")) |
                            (
                                col("project_enddate").isNotNull() &
                                col("resource_enddate").isNotNull() &
                                (col("resource_enddate") > col("project_enddate"))
                            )
                        )
                    )
                    invalid_date_df = valid_df.filter(invalid_date_condition)
                    valid_df = valid_df.filter(~invalid_date_condition)

                    if not invalid_date_df.rdd.isEmpty():
                        count_invalid = invalid_date_df.count()
                        logger.warning(
                            f"[project_resource] ⚠️ {count_invalid} rows failed project-resource date validation"
                        )

                        staging_table = self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE)

                        # Only distinct project/resource pairs to avoid duplicate updates
                        for row in invalid_date_df.select(
                            "resource_code", "project_code"
                        ).distinct().collect():
                            self._update_staging_failure(
                                staging_table,
                                account_rid,
                                row.resource_code,
                                row.project_code,
                                document_id,
                                Constants.ErrorMessages.RESOURCE_DATE_OUTSIDE_PROJECT_RANGE
                            )


                    # Step 2: If match found, update staging error
                    if not invalid_df.rdd.isEmpty():
                        logger.info("[project_resource] invalid_df has duplicate rows – marking staging records as Failed")

                        staging_table = self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE)

                        update_query = f"""
                        UPDATE {staging_table}
                        SET error_descriptions = COALESCE(error_descriptions, '') || %s,
                            status = 'Failed'
                        WHERE account_rid = %s
                        AND document_rid = %s
                        AND project_id = %s
                        AND project_name IS NOT DISTINCT FROM %s
                        AND NULLIF(project_description,'') IS NOT DISTINCT FROM NULLIF(%s,'')

                        AND resource_id = %s

                        AND resource_role IS NOT DISTINCT FROM %s

                        AND NULLIF(start_date,'')::date IS NOT DISTINCT FROM %s::date
                        AND NULLIF(end_date,'')::date   IS NOT DISTINCT FROM %s::date

                        AND NULLIF(total_cost,'')::numeric  IS NOT DISTINCT FROM %s
                        AND NULLIF(total_hours,'')::numeric IS NOT DISTINCT FROM %s
                        """

                        with DBPool.get_connection() as conn:
                            with conn.cursor() as cursor:
                                for row in invalid_df.select(
                                    "project_code",
                                    "project_name",
                                    "project_description",
                                    "resource_code",
                                    "project_resource_role",
                                    "start_date",
                                    "end_date",
                                    "total_cost_pro_res",
                                    "total_hours_pro_res"
                                ).distinct().collect():

                                    logger.warning(
                                        f"[project_resource] ❌ Duplicate: "
                                        f"project_id={row.project_code}, resource_id={row.resource_code}, "
                                        f"project_name={row.project_name}, project_description={row.project_description}, "
                                        f"role={row.project_resource_role}, start={row.start_date}, "
                                        f"end={row.end_date}, cost={row.total_cost_pro_res}, hours={row.total_hours_pro_res}"
                                    )

                                    params = (
                                        Constants.ErrorMessages.DUPLICATE_PROJECT_RESOURCE_ENTRY,
                                        account_rid,
                                        document_id,
                                        row.project_code,
                                        row.project_name,
                                        row.project_description,
                                        row.resource_code,
                                        row.project_resource_role,
                                        row.start_date,
                                        row.end_date,
                                        row.total_cost_pro_res,
                                        row.total_hours_pro_res
                                    )
                                    logger.info(f"Executing update query: {update_query}") 
                                    logger.info(f"With parameters: {params}")
                                    cursor.execute(update_query, params)
                                    logger.info(f"[project_resource] Rows updated: {cursor.rowcount}")

                            conn.commit()

                        logger.info(
                            f"[project_resource] ✅ Deduplication complete. "
                            f"Valid count={valid_df.count()}, Invalid count={invalid_df.count()}"
                        )
                    # NEW: Check against existing data for exact duplicates with proper null handling
                    if not existing_df.rdd.isEmpty():
                        logger.info("[project_resource] 🔍 Checking against existing data for exact duplicates...")
                        
                        # Define the key columns for exact duplicate matching
                        key_columns = [
                            "project_fiscal_rid", 
                            "resource_rid", 
                            "project_resource_role",
                            "total_cost_pro_res", 
                            "total_hours_pro_res",
                            "description",
                            "start_date", 
                            "end_date",
                            "country_rid",
                            "region_rid"
                        ]
                        
                        # Create aliases to avoid column name conflicts
                        valid_alias = valid_df.alias("valid")
                        existing_alias = existing_df.select(key_columns).distinct().alias("existing")
                        
                        # Build join condition that properly handles nulls for each column
                        join_condition = None
                        
                        for col_name in key_columns:
                            # For each column: (valid.col = existing.col) OR (both are null)
                            col_condition = (
                                (F.col(f"valid.{col_name}") == F.col(f"existing.{col_name}")) |
                                (F.col(f"valid.{col_name}").isNull() & F.col(f"existing.{col_name}").isNull())
                            )
                            
                            if join_condition is None:
                                join_condition = col_condition
                            else:
                                join_condition = join_condition & col_condition
                        
                        # Find exact duplicates using the join condition
                        exact_duplicates = valid_alias.join(
                            existing_alias,
                            join_condition,
                            how="inner"
                        ).select("valid.*")  # Select only columns from valid DataFrame
                        
                        if not exact_duplicates.rdd.isEmpty():
                            logger.info(f"[project_resource] Found {exact_duplicates.count()} exact duplicates")
                            
                            # Update staging table for exact duplicates
                            staging_table = self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE)
                            
                            for row in exact_duplicates.collect():
                                error_message = Constants.ErrorMessages.DUPLICATE_PROJECT_RESOURCE_ENTRY
                                self._update_staging_failure(
                                    staging_table, account_rid, row.resource_code, 
                                    row.project_code, document_id, error_message
                                )
                                logger.warning(
                                    f"[project_resource] ❌ Exact duplicate: "
                                    f"project_id={row.project_code}, resource_id={row.resource_code}, "
                                    f"role={row.project_resource_role}, start={row.start_date}, end={row.end_date}, "
                                    f"cost={row.total_cost_pro_res}, hours={row.total_hours_pro_res}, "
                                    f"description={row.description}"
                                )
                            
                            # Remove exact duplicates from valid_df using left anti join with the same condition
                            valid_df = valid_alias.join(
                                existing_alias,
                                join_condition,
                                how="left_anti"
                            ).select("valid.*")
                            
                            logger.info(f"[project_resource] 🔄 Removed {exact_duplicates.count()} exact duplicates")
                        else:
                            logger.info("[project_resource] No exact duplicates found")
                    if valid_df is not None and not valid_df.rdd.isEmpty():
                        valid_df.unpersist()
                    
                    df = valid_df
                    
                    # Drop project_number if present
                    if "project_number" in df.columns:
                        df = df.drop("project_number")
                    
                    # Create project_resource_code
                    df = df.withColumn("project_resource_code", concat_ws("-", col("project_code"), col("resource_code")))
                    
                    # Normalize date fields
                    for col_name in ["start_date", "end_date"]:
                        if col_name in df.columns:
                            df = df.withColumn(col_name, to_date(col(col_name)))
                        if col_name in existing_df.columns:
                            existing_df = existing_df.withColumn(col_name, to_date(col(col_name)))
                    
                    # Trim resource_code and project_code
                    df = df.withColumn("resource_code", trim(col("resource_code")))
                    df = df.withColumn("project_code", trim(col("project_code")))
                    
                    # Status RIDs
                    active_status_rid = self.get_resource_status_rid("Active")
                    anomaly_status_rid = self.get_resource_status_rid("Anomaly")  # Make sure this status exists
                    
                    # Get staging table
                    staging_table = self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE)
                    
                    # Lists to track failed rows and anomaly rows
                    failed_rows = []
                    anomaly_rows = []
                    
                    # Check if existing data is not empty - ONLY for role validation
                    if not existing_df.rdd.isEmpty():
                        logger.info("[project_resource] Checking for role validation against existing data...")
                        
                        # Collect existing data for efficient lookup
                        existing_data = {}
                        for row in existing_df.collect():
                            key = (row.project_fiscal_rid, row.resource_rid)
                            existing_data[key] = {
                                'project_resource_role': row.project_resource_role,
                                'start_date': row.start_date,
                                'end_date': row.end_date
                            }
                        
                        # Validate each new row for role conflicts with existing data
                        for row in df.collect():
                            project_fiscal_rid = row.project_fiscal_rid
                            resource_rid = row.resource_rid
                            new_resource_role = row.project_resource_role
                            resource_code = row.resource_code
                            project_code = row.project_code
                            
                            # Check if this project-resource combination exists
                            existing_key = (project_fiscal_rid, resource_rid)
                            
                            if existing_key in existing_data:
                                existing_role = existing_data[existing_key]['project_resource_role']
                                
                                # Resource role validation rules
                                if existing_role is not None and existing_role != "":
                                    # Existing record has project_resource_role
                                    if new_resource_role is None or new_resource_role == "":
                                        # New record has empty project_resource_role - NOT ALLOWED
                                        error_message = Constants.ErrorMessages.MISSING_RESOURCE_ROLE
                                        self._update_staging_failure(
                                            staging_table, account_rid, resource_code, 
                                            project_code, document_id, error_message
                                        )
                                        failed_rows.append((project_fiscal_rid, resource_rid))
                                        continue

                    # ANOMALY DETECTION - This should run regardless of whether existing_df is empty or not
                    logger.info("[project_resource] Checking for cost and hours anomalies...")
                    
                    for row in df.collect():
                        project_fiscal_rid = row.project_fiscal_rid
                        resource_rid = row.resource_rid
                        
                        # Skip if this row already failed role validation
                        if (project_fiscal_rid, resource_rid) in failed_rows:
                            continue
                            
                        # Validate hours against date range
                        start_date = row.start_date
                        end_date = row.end_date
                        total_hours = row.total_hours_pro_res if hasattr(row, 'total_hours_pro_res') else 0
                        total_cost = row.total_cost_pro_res if hasattr(row, 'total_cost_pro_res') else 0  
                        currency_rid = row.currency_rid if hasattr(row, 'currency_rid') else None    
                        
                        # Check hours anomaly
                        if start_date and end_date and total_hours:
                            try:
                                total_hours_decimal = Decimal(str(total_hours))
                                # Calculate maximum possible hours
                                total_days = (end_date - start_date).days + 1
                                max_hours = total_days * config.WORKING_HOURS
                                
                                if total_hours_decimal > max_hours:
                                    anomaly_rows.append((project_fiscal_rid, resource_rid, total_hours_decimal, total_cost))
                                    logger.warning(
                                        f"[project_resource] ⚠️ Hours anomaly detected: "
                                        f"project_fiscal_rid={project_fiscal_rid}, resource_rid={resource_rid}, "
                                        f"hours={total_hours_decimal}, max_possible={max_hours}"
                                    )
                                    continue
                            except Exception as e:
                                logger.warning(f"[project_resource] Error parsing hours: {e}")
                                # Continue with other checks even if hours parsing fails
                        
                        # Check cost anomaly
                        if total_cost:
                            try:
                                cost_decimal = Decimal(str(total_cost))
                                currency_threshold = self.get_currency_threshold(currency_rid)
                                if cost_decimal > currency_threshold:
                                    anomaly_rows.append((project_fiscal_rid, resource_rid, total_hours, cost_decimal))
                                    logger.warning(
                                        f"[project_resource] ⚠️ Cost anomaly detected: "
                                        f"project_fiscal_rid={project_fiscal_rid}, resource_rid={resource_rid}, "
                                        f"cost={cost_decimal}, threshold={currency_threshold}"
                                    )
                                    continue
                            except Exception as e:
                                logger.warning(f"[project_resource] Error parsing cost: {e}")
                                # If cost parsing fails, allow as-is without blocking

                    # Filter out failed rows from the final DataFrame
                    if failed_rows:
                        logger.warning(f"[project_resource] ⚠️ {len(failed_rows)} rows failed role validation and will be filtered out.")
                        
                        # Create filter condition
                        failed_fiscal_rids = [r[0] for r in failed_rows]
                        failed_resource_rids = [r[1] for r in failed_rows]
                        
                        filter_condition = ~(
                            (col("project_fiscal_rid").isin(failed_fiscal_rids)) &
                            (col("resource_rid").isin(failed_resource_rids))
                        )
                        
                        df = df.filter(filter_condition)

                    # Handle anomaly rows - mark them with anomaly status
                    if anomaly_rows:
                        logger.warning(f"[project_resource] ⚠️ {len(anomaly_rows)} rows detected as anomalies.")
                        
                        
                        anomaly_schema = StructType([
                            StructField("project_fiscal_rid_temp", StringType(), True),
                            StructField("resource_rid_temp", StringType(), True),
                            StructField("total_hours_pro_res_temp", DecimalType(18,2), True),
                            StructField("total_cost_pro_res_temp", DecimalType(18,2), True)
                        ])
                        
                        anomaly_df = self.spark.createDataFrame(anomaly_rows, anomaly_schema).dropDuplicates()

                        # Join and mark anomalies
                        df = (
                            df.join(
                                anomaly_df.withColumn("is_anomaly", lit(1)),
                                (df.project_fiscal_rid == anomaly_df.project_fiscal_rid_temp) &
                                (df.resource_rid == anomaly_df.resource_rid_temp) &
                                (df.total_cost_pro_res == anomaly_df.total_cost_pro_res_temp) &
                                (df.total_hours_pro_res.eqNullSafe(anomaly_df.total_hours_pro_res_temp)),
                                how="left"
                            )
                            .withColumn(
                                "status_rid",
                                when(col("is_anomaly") == 1, lit(anomaly_status_rid)).otherwise(lit(active_status_rid))
                            )
                            .drop("is_anomaly")
                        )

                    else:
                        df = df.withColumn("status_rid", lit(active_status_rid))
                        logger.info("[project_resource] No anomalies detected, all records marked as active.")

                    # =====================================================
                    # STEP: Compute net_resource_cost
                    # =====================================================
                    logger.info("[project_resource] Calculating net_resource_cost for each record...")

                    # Compute net_resource_cost without forcing NULLs to 0
                    df = df.withColumn(
                        "net_total_cost_pro_res",
                        col("total_cost_pro_res").cast(DecimalType(18, 2))
                    )

                    # Drop unnecessary columns
                    cols_to_drop = [
                        "project_code", "resource_code", "resource_name", "resource_type_rid","resource_startdate","resource_enddate", 
                        "designation", "resource_orgname", "resource_firstname", "resource_status_rid", "project_name", "project_description",
                        "resource_middlename", "resource_lastname", "manager_name", "manager_ref_rid","project_status_rid","project_startdate","project_enddate",
                        "project_fiscal_rid_temp", "resource_rid_temp", "total_hours_pro_res_temp", "total_cost_pro_res_temp"
                    ]
                    
                    cols_to_drop = [col for col in cols_to_drop if col in df.columns]
                    if cols_to_drop:
                        df = df.drop(*cols_to_drop)

                    if invalid_df is not None and not invalid_df.rdd.isEmpty():
                        invalid_df.unpersist()
                        
                    logger.info(f"[project_resource] ✅ Project resource handling completed. Remaining count: {df.count()}")
                    
                    if not df.rdd.isEmpty():
                        logger.info("[project_resource] Final DataFrame schema:")
                        df.printSchema()
                    else:
                        logger.info("[project_resource] Final DataFrame is empty")
                        
                    return df
                    
                except Exception as e:
                    logger.error(f"[project_resource] ❌ Error in project resource handler: {str(e)}", exc_info=True)
                    raise

            elif parent_entity_type == "project_task" and entity_type == "project_resource":
                try:
                    logger.info(f"[project_resource from task] 🚀 Starting project resource entity handling...")
                    
                    if "resource_role" in df.columns:
                        df = df.withColumnRenamed("resource_role", "project_resource_role")
                    
                    # Map RIDs and R-Numbers
                    df = self.map_entity_rid_and_r_number_with_data(df, "project_resource", account_r_number, account_rid)
                    active_status_rid = self.get_active_status_rid()
                    inactive_status_rid = self.get_inactive_status_rid()

                    df = df.withColumn(
                        "status_rid",
                        when(
                            (col("project_status_rid") == lit(active_status_rid)) &
                            (col("resource_status_rid") == lit(active_status_rid)),
                            lit(active_status_rid)
                        ).otherwise(lit(inactive_status_rid))
                    )
                    w = Window.partitionBy(
                            "project_fiscal_rid",
                            "resource_rid",
                            "project_resource_role"
                        ).orderBy(F.col("start_date"))

                    df2 = (
                        df
                        .withColumn("prev_start_date", F.lag("start_date").over(w))
                        .withColumn("prev_end_date",   F.lag("end_date").over(w))
                    )

                    df2 = df2.withColumn(
                        "is_invalid",
                        F.when(
                            # BOTH DATES PRESENT → overlap or same start_date
                            F.col("start_date").isNotNull() & F.col("end_date").isNotNull() &
                            (
                                (F.col("start_date") == F.col("prev_start_date")) |
                                (
                                    F.col("prev_end_date").isNotNull() &
                                    (F.col("start_date") <= F.col("prev_end_date"))
                                )
                            ),
                            F.lit(True)
                        )
                        .when(
                            # BOTH DATES NULL → skip here, exact-duplicate logic later
                            F.col("start_date").isNull() & F.col("end_date").isNull(),
                            F.lit(False)
                        )
                        .otherwise(F.lit(False))  # mixed NULL → do not invalidate
                    )

                    valid_df   = df2.filter(~F.col("is_invalid")).drop("prev_start_date","prev_end_date","is_invalid")
                    invalid_df = df2.filter(F.col("is_invalid")).drop("prev_start_date","prev_end_date","is_invalid")

                    df = valid_df

                    # =====================================================
                    # ✅ VALIDATE: Resource dates must fall within Project dates
                    # =====================================================
                    logger.info("[project_resource from task] ✅ Validating resource dates against project dates...")

                    # Force all to DATE (safety)
                    for c in ["resource_startdate", "resource_enddate", "project_startdate", "project_enddate"]:
                        if c in df.columns:
                            df = df.withColumn(c, to_date(col(c)))

                    # INVALID if:
                    # - All 4 dates exist
                    # - AND resource_startdate < project_startdate
                    # - OR resource_enddate > project_enddate
                    invalid_date_condition = (
                        col("resource_startdate").isNotNull() &
                        col("project_startdate").isNotNull() &
                        (
                            (col("resource_startdate") < col("project_startdate")) |
                            (
                                col("project_enddate").isNotNull() &
                                col("resource_enddate").isNotNull() &
                                (col("resource_enddate") > col("project_enddate"))
                            )
                        )
                    )

                    invalid_date_df = df.filter(invalid_date_condition)
                    df = df.filter(~invalid_date_condition)

                    if not invalid_date_df.rdd.isEmpty():
                        invalid_count = invalid_date_df.count()
                        logger.warning(
                            f"[project_resource from task] ⚠️ {invalid_count} rows failed project-resource date validation"
                        )

                        staging_table = self.get_tenant_table(
                            account_r_number, config.STAGING_PROJECT_TASK_TABLE
                        )

                        # Only update staging for FAILED ones (small set → safe collect)
                        for row in invalid_date_df.select(
                            "resource_code", "project_code"
                        ).distinct().collect():
                            self._update_staging_failure(
                                staging_table,
                                account_rid,
                                row.resource_code,
                                row.project_code,
                                document_id,
                                Constants.ErrorMessages.RESOURCE_DATE_OUTSIDE_PROJECT_RANGE
                            )
                    # Drop project_number if present
                    if "project_number" in df.columns:
                        df = df.drop("project_number")
                    
                    # Create project_resource_code
                    df = df.withColumn("project_resource_code", concat_ws("-", col("project_code"), col("resource_code")))
                    
                    # Normalize date fields
                    for col_name in ["start_date", "end_date"]:
                        if col_name in df.columns:
                            df = df.withColumn(col_name, to_date(col(col_name)))
                        if col_name in existing_df.columns:
                            existing_df = existing_df.withColumn(col_name, to_date(col(col_name)))
                    
                    # Trim resource_code and project_code
                    df = df.withColumn("resource_code", trim(col("resource_code")))
                    df = df.withColumn("project_code", trim(col("project_code")))
                    
                    # Status RIDs
                    active_status_rid = self.get_resource_status_rid("Active")
                    duplicate_status_rid = self.get_resource_status_rid("Duplicate")
                    
                    # Step 1: Identify exact duplicates against existing data
                    exact_duplicates = self.spark.createDataFrame([], df.schema)
                    if not existing_df.rdd.isEmpty() and not df.rdd.isEmpty():
                        logger.info("[project_resource from task] 🔍 Checking against existing data for exact duplicates...")
                        
                        join_condition = [
                            "project_fiscal_rid", "resource_rid", "project_resource_role",
                            "start_date", "end_date", "total_cost_from_tasks", "total_hours_from_tasks"
                        ]
                        
                        exact_duplicates = df.join(existing_df, join_condition, how="inner")
                        
                        if not exact_duplicates.rdd.isEmpty():
                            logger.info(f"[project_resource from task] Found {exact_duplicates.count()} exact duplicates")
                            # Mark duplicates but DON'T include them in final output
                            exact_duplicates = exact_duplicates.withColumn("status_rid", lit(duplicate_status_rid))
                            # Remove exact duplicates from the main dataframe
                            df = df.join(exact_duplicates, join_condition, how="left_anti")
                    
                    # If no records left after duplicate removal, return empty DF
                    if df.rdd.isEmpty():
                        logger.info("[project_resource from task] No records left after duplicate removal")
                        return self.spark.createDataFrame([], df.schema)
                    
                    # Step 2: Process anomalies on remaining records (non-duplicates)
                    working_df = df
                    
                    # Calculate date range and max hours
                    working_df = working_df.withColumn(
                        "total_days", 
                        datediff(col("end_date"), col("start_date")) + lit(1)
                    ).withColumn(
                        "max_hours", 
                        col("total_days") * lit(config.WORKING_HOURS)
                    ).withColumn(
                        "total_hours_decimal",
                        when(col("total_hours_from_tasks").isNotNull(), 
                            col("total_hours_from_tasks").cast("decimal(18,2)"))
                        .otherwise(lit(0))
                    ).withColumn(
                        "total_cost_decimal",
                        when(col("total_cost_from_tasks").isNotNull(), 
                            col("total_cost_from_tasks").cast("decimal(18,2)"))
                        .otherwise(lit(0))
                    )
                    
                    # Get currency thresholds
                    currency_ids = [row["currency_rid"] for row in working_df.select("currency_rid").distinct().collect()]
                    
                    if currency_ids:
                        id_list = ",".join([f"'{cid}'" for cid in currency_ids])
                        currency_threshold_df = (
                            self.spark.read \
                                .format("jdbc") \
                                .option("url", config.MAIN_DB_URL) \
                                .option(
                                    "dbtable",
                                    f"(SELECT rid, currency_threshold "
                                    f"FROM {Constants.Database.SCHEMA_MAIN}.{Constants.Tables.CURRENCY} "
                                    f"WHERE rid IN ({id_list})) AS currency_subquery"
                                ) \
                                .option("user", config.MAIN_DB_USER) \
                                .option("password", settings.MAIN_DB_PASSWORD) \
                                .option("driver", config.ENTITY_DB_DRIVER) \
                                .load() \
                                .select(
                                    F.col("rid").alias("currency_rid"),
                                    F.col("currency_threshold").cast("decimal(18,2)")
                                )
                        )
                        working_df = working_df.join(currency_threshold_df, on="currency_rid", how="left")
                    else:
                        working_df = working_df.withColumn("currency_threshold", lit(0).cast("decimal(18,2)"))
                    
                    # Process anomalies by modifying the original records
                    working_df = working_df.withColumn("is_hour_anomaly", 
                        col("total_hours_decimal") > col("max_hours")
                    ).withColumn("is_cost_anomaly", 
                        col("total_cost_decimal") > col("currency_threshold")
                    ).withColumn("is_anomaly",
                        col("is_hour_anomaly") | col("is_cost_anomaly")
                    )
                    
                    # Apply anomaly processing: nullify cost/hours for anomalies, keep original for non-anomalies
                    working_df = working_df.withColumn(
                        "total_hours_from_tasks",
                        when(col("is_anomaly"), lit(None).cast("decimal(18,2)"))
                        .otherwise(col("total_hours_from_tasks"))
                    ).withColumn(
                        "total_cost_from_tasks", 
                        when(col("is_anomaly"), lit(None).cast("decimal(18,2)"))
                        .otherwise(col("total_cost_from_tasks"))
                    ).withColumn(
                        "status_rid", lit(active_status_rid)  # All non-duplicate records get Active status
                    ).drop("is_hour_anomaly", "is_cost_anomaly", "is_anomaly")
                    
                    # Count anomalies for logging
                    anomaly_count = working_df.filter(
                        (col("total_hours_decimal") > col("max_hours")) | 
                        (col("total_cost_decimal") > col("currency_threshold"))
                    ).count()
                    
                    logger.info(f"[project_resource from task] Found {anomaly_count} anomaly records (cost/hours nullified)")
                    
                    # Clean up temporary columns
                    working_df = working_df.drop("total_days", "max_hours", "total_hours_decimal", "total_cost_decimal", "currency_threshold")
                    
                    # Step 3: Return only the processed records (anomalies + active), excluding duplicates
                    df = working_df
                    # Drop unnecessary columns
                    cols_to_drop = [
                        "project_code", "resource_code", "resource_name", "resource_type_rid", "resource_startdate","resource_enddate",
                        "designation", "resource_orgname", "resource_firstname", "resource_status_rid",
                        "resource_middlename", "resource_lastname", "manager_name", "manager_ref_rid","project_status_rid","project_startdate", "project_enddate",
                        "project_fiscal_rid_temp", "resource_rid_temp", "total_hours_pro_res_temp", "total_cost_pro_res_temp"
                    ]
                    
                    cols_to_drop = [col for col in cols_to_drop if col in df.columns]
                    if cols_to_drop:
                        df = df.drop(*cols_to_drop)
                    
                    logger.info(f"[project_resource from task] ✅ Project resource handling completed. Final count: {df.count()}")
                    
                    # Log distribution of statuses
                    status_counts = df.groupBy("status_rid").count().collect()
                    for status_count in status_counts:
                        logger.info(f"Status RID {status_count['status_rid']}: {status_count['count']} rows")
                    return df
                    
                except Exception as e:
                    logger.error(f"[project_resource from task] ❌ Error in project resource handler: {str(e)}", exc_info=True)
                    raise
            
            elif parent_entity_type == "project_task" and entity_type == "project_task":
                try:
                    logger.info(f"[project_task from task] 🚀 Starting project task entity handling...")
                    # Check if both columns exist before renaming
                    if "resource_role" in df.columns and "project_resource_role" not in df.columns:
                        df = df.withColumnRenamed("resource_role", "project_resource_role")
                    elif "resource_role" in df.columns and "project_resource_role" in df.columns:
                        # If both exist, drop the resource_role column and keep project_resource_role
                        df = df.drop("resource_role")                    # Map RIDs and R-Numbers
                    df = self.map_entity_rid_and_r_number_with_data(df, "project_task", account_r_number, account_rid)

                    staging_table = self.get_tenant_table(
                        account_r_number,
                        config.STAGING_PROJECT_TASK_TABLE
                    )
                    failed_staging_df = (
                        self.spark.read
                            .format("jdbc")
                            .option("url", config.ENTITY_DB_URL)
                            .option("dbtable", staging_table)
                            .option("user", config.ENTITY_DB_USER)
                            .option("password", settings.ENTITY_DB_PASSWORD)
                            .option("driver", config.ENTITY_DB_DRIVER)
                            .load()
                            .filter(
                                (col("status") == lit("Failed")) &
                                (col("document_rid") == lit(document_id)) &
                                (col("account_rid") == lit(account_rid))
                            )
                            .select("resource_id", "project_id")
                            .distinct()
                    )

                    failed_staging_df = (
                        failed_staging_df
                            .withColumnRenamed("resource_id", "resource_code")
                            .withColumnRenamed("project_id", "project_code")
                    )

                    if not failed_staging_df.rdd.isEmpty():  # Efficient existence check
                        logger.info("[project_task] ⛔ Skipping rows because project_resource failed earlier")

                        df = df.join(
                            failed_staging_df,
                            on=["resource_code", "project_code"],
                            how="left_anti"
                        )

                        logger.info(f"[project_task] Remaining rows after removing failed project_resource rows: {df.count()}")

                    active_status_rid = self.get_active_status_rid()
                    inactive_status_rid = self.get_inactive_status_rid()
                    if not df.rdd.isEmpty():
                        df = df.withColumn(
                            "status_rid",
                            when(
                                (col("project_status_rid") == lit(active_status_rid)) &
                                (col("resource_status_rid") == lit(active_status_rid)),
                                lit(active_status_rid)
                            ).otherwise(lit(inactive_status_rid))
                        )
                        # Drop project_number if present
                        if "project_number" in df.columns:
                            df = df.drop("project_number")

                        df = df.withColumn("project_resource_code", concat_ws("-", col("project_code"), col("resource_code")))

                        # Normalize date fields
                        for col_name in ["start_date", "end_date"]:
                            if col_name in df.columns:
                                df = df.withColumn(col_name, to_date(col(col_name)))
                            if col_name in existing_df.columns:
                                existing_df = existing_df.withColumn(col_name, to_date(col(col_name)))

                        # Trim project_code
                        df = df.withColumn("project_code", trim(col("project_code")))

                        # Status RIDs
                        active_status_rid = self.get_resource_status_rid("Active")
                        anomaly_status_rid = self.get_resource_status_rid("Anomaly")
                        duplicate_status_rid = self.get_resource_status_rid("Duplicate")

                        # Step 0: Normalize numeric columns before hashing (avoid 8 vs 8.00 mismatch)
                        numeric_cols = ["total_hours_pro_task", "total_cost_pro_task"]
                        for col_name in numeric_cols:
                            df = df.withColumn(col_name, F.col(col_name).cast("double"))
                            existing_df = existing_df.withColumn(col_name, F.col(col_name).cast("double"))

                        # Step 1: Add row_hash - FIXED business keys
                        business_cols = [
                            "project_fiscal_rid",
                            "resource_rid",
                            "project_resource_rid",  # CRITICAL: Different roles = different records
                            "start_date",
                            "end_date", 
                            "total_hours_pro_task",
                            "total_cost_pro_task",
                            "comments"
                        ]

                        def add_row_hash(df):
                            return df.withColumn(
                                "row_hash",
                                F.sha2(F.concat_ws("|", *[F.coalesce(F.col(c).cast("string"), F.lit("")) for c in business_cols]), 256)
                            )

                        df = add_row_hash(df)
                        existing_df = add_row_hash(existing_df)

                        # Step 2: Identify duplicates against existing records
                        existing_hashes = existing_df.select("row_hash").distinct()
                        duplicate_vs_existing_df = df.join(existing_hashes, on="row_hash", how="inner")
                        
                        # Step 3: Identify anomalies using Spark transformations (distributed)
                        # Validate hours against date range
                        working_df = df.withColumn(
                            "total_days", 
                            datediff(col("end_date"), col("start_date")) + lit(1)
                        ).withColumn(
                            "max_hours", 
                            col("total_days") * lit(config.WORKING_HOURS)
                        ).withColumn(
                            "total_hours_decimal",
                            when(col("total_hours_pro_task").isNotNull(), 
                                col("total_hours_pro_task").cast("decimal(18,2)"))
                            .otherwise(lit(0))
                        )

                        # Collect distinct currency_rids from working_df
                        currency_ids = [row["currency_rid"] for row in working_df.select("currency_rid").distinct().collect()]

                        # Use subquery with WHERE condition
                        if currency_ids:
                            id_list = ",".join([f"'{cid}'" for cid in currency_ids])
                            currency_threshold_df = (
                                self.spark.read \
                                    .format("jdbc") \
                                    .option("url", config.MAIN_DB_URL) \
                                    .option(
                                        "dbtable",
                                        f"(SELECT rid, currency_threshold "
                                        f"FROM {Constants.Database.SCHEMA_MAIN}.{Constants.Tables.CURRENCY} "
                                        f"WHERE rid IN ({id_list})) AS currency_subquery"
                                    ) \
                                    .option("user", config.MAIN_DB_USER) \
                                    .option("password", settings.MAIN_DB_PASSWORD) \
                                    .option("driver", config.ENTITY_DB_DRIVER) \
                                    .load() \
                                    .select(
                                        F.col("rid").alias("currency_rid"),
                                        F.col("currency_threshold").cast("decimal(18,2)")
                                    )
                            )
                        else:
                            currency_threshold_df = self.spark.createDataFrame([], schema="currency_rid string, currency_threshold decimal(18,2)")

                        # Step B: Join thresholds into working_df and create decimal columns
                        working_df = (
                            working_df
                            .join(currency_threshold_df, on="currency_rid", how="left")
                            .withColumn(
                                "total_cost_decimal", 
                                when(col("total_cost_pro_task").isNotNull(),
                                    col("total_cost_pro_task").cast("decimal(18,2)"))
                                .otherwise(lit(0))
                            )
                        )

                        # Mark duplicates against existing records
                        if not duplicate_vs_existing_df.rdd.isEmpty():
                            duplicate_vs_existing_df = duplicate_vs_existing_df.withColumn("status_rid", F.lit(duplicate_status_rid))
                            logger.info(f"[project_task] Found {duplicate_vs_existing_df.count()} duplicates against existing records")
                        
                        # Step 3: Deduplicate within incoming data (only non-existing duplicates)
                        working_df = df.join(existing_hashes, on="row_hash", how="left_anti")
                        logger.info(f"[project_task] After removing existing duplicates, working with {working_df.count()} records")

                        if not working_df.rdd.isEmpty():
                            # For project_task, we should deduplicate based on the complete business key including project_resource_rid
                            working_df = working_df.withColumn("unique_id", F.monotonically_increasing_id())

                            # Window should partition by ALL business keys to find exact duplicates
                            window_spec = Window.partitionBy(*business_cols).orderBy(F.asc("unique_id"))

                            df_with_rank = working_df.withColumn("row_rank", F.row_number().over(window_spec))

                            # Active: first occurrence of each unique combination
                            active_df = df_with_rank.filter(F.col("row_rank") == 1) \
                                .drop("row_rank", "unique_id") \
                                .withColumn("status_rid", F.lit(active_status_rid))

                            # Duplicate: all other rows (exact same business keys)
                            duplicate_within_incoming_df = df_with_rank.filter(F.col("row_rank") > 1) \
                                .drop("row_rank", "unique_id") \
                                .withColumn("status_rid", F.lit(duplicate_status_rid))
                            
                            logger.info(f"[project_task] Within incoming data: {active_df.count()} active, {duplicate_within_incoming_df.count()} duplicates")
                            
                            # Combine active and incoming duplicates
                            working_df = active_df.unionByName(duplicate_within_incoming_df, allowMissingColumns=True)
                        else:
                            working_df = self.spark.createDataFrame([], working_df.schema)

                        # Step 4: Combine all records: working data + duplicates against existing
                        final_dfs = []
                        
                        if not working_df.rdd.isEmpty():
                            final_dfs.append(working_df)
                        
                        # REMOVED: The problematic cost anomaly detection that was here
                        
                        if not duplicate_vs_existing_df.rdd.isEmpty():
                            final_dfs.append(duplicate_vs_existing_df)
                        
                        if final_dfs:
                            df = final_dfs[0]
                            for next_df in final_dfs[1:]:
                                df = df.unionByName(next_df, allowMissingColumns=True)
                        else:
                            df = self.spark.createDataFrame([], df.schema)

                        # Step 5: Identify anomalies (hours/cost thresholds) - only for active records
                        active_records_df = df.filter(F.col("status_rid") == active_status_rid)
                        
                        if not active_records_df.rdd.isEmpty():
                            active_records_df = active_records_df.withColumn(
                                "total_days", datediff(col("end_date"), col("start_date")) + lit(1)
                            ).withColumn(
                                "max_hours", col("total_days") * lit(config.WORKING_HOURS)
                            ).withColumn(
                                "total_hours_decimal", 
                                when(col("total_hours_pro_task").isNotNull(),
                                    col("total_hours_pro_task").cast("decimal(18,2)"))
                                .otherwise(lit(0))
                            )

                            # Collect currency thresholds
                            currency_ids = [row["currency_rid"] for row in active_records_df.select("currency_rid").distinct().collect()]

                            if currency_ids:
                                id_list = ",".join([f"'{cid}'" for cid in currency_ids])
                                dbtable_query = f"(SELECT rid, currency_threshold FROM {Constants.Database.SCHEMA_MAIN}.{Constants.Tables.CURRENCY} WHERE rid IN ({id_list})) AS currency_subquery"

                                currency_threshold_df = (
                                    self.spark.read
                                    .format("jdbc")
                                    .option("url", config.MAIN_DB_URL)
                                    .option("dbtable", dbtable_query)
                                    .option("user", config.MAIN_DB_USER)
                                    .option("password", settings.MAIN_DB_PASSWORD)
                                    .option("driver", config.ENTITY_DB_DRIVER)
                                    .load()
                                    .select(F.col("rid").alias("currency_rid"),
                                            F.col("currency_threshold").cast("decimal(18,2)"))
                                )
                            else:
                                currency_threshold_df = self.spark.createDataFrame([], schema="currency_rid string, currency_threshold decimal(18,2)")

                            active_records_df = active_records_df.join(currency_threshold_df, on="currency_rid", how="left")
                            active_records_df = active_records_df.withColumn(
                                "total_cost_decimal", 
                                when(col("total_cost_pro_task").isNotNull(),
                                    col("total_cost_pro_task").cast("decimal(18,2)"))
                                .otherwise(lit(0))
                            )

                            # Identify anomalies - NOW total_cost_decimal exists
                            hour_anomaly_df = active_records_df.filter(col("total_hours_decimal") > col("max_hours")) \
                                                                .withColumn("status_rid", lit(anomaly_status_rid)) \
                                                                .withColumn("anomaly_reason", lit("EFFORT_EXCEEDS_CAPACITY"))

                            cost_anomaly_df = active_records_df.filter(col("total_cost_decimal") > col("currency_threshold")) \
                                                                .withColumn("status_rid", lit(anomaly_status_rid)) \
                                                                .withColumn("anomaly_reason", lit("COST_EXCEEDS_THRESHOLD"))

                            anomaly_df = hour_anomaly_df.unionByName(cost_anomaly_df, allowMissingColumns=True)

                            # Remove anomalies from active records and replace with anomaly records
                            valid_active_df = active_records_df.join(anomaly_df.select("row_hash"), on="row_hash", how="left_anti")
                            
                            # Update the main dataframe: remove original active records, add valid active + anomalies
                            non_active_df = df.filter(F.col("status_rid") != active_status_rid)
                            
                            final_dfs = [non_active_df, valid_active_df]
                            if not anomaly_df.rdd.isEmpty():
                                final_dfs.append(anomaly_df)
                                
                            df = final_dfs[0]
                            for next_df in final_dfs[1:]:
                                df = df.unionByName(next_df, allowMissingColumns=True)

                    # Step 6: Clean temporary columns
                    cols_to_drop = [
                        "row_hash", "total_days", "max_hours", "total_hours_decimal", "project_startdate", "project_enddate",
                        "total_cost_decimal", "anomaly_reason", "project_code", 
                        "resource_code", "resource_name", "resource_type_rid", "resource_startdate", "resource_enddate",
                        "designation", "resource_orgname", "resource_firstname","resource_status_rid","project_status_rid",
                        "resource_middlename", "resource_lastname", "manager_name","is_mapped",
                        "manager_ref_rid", "project_resource_role", "currency_threshold", "unique_id",
                        "project_fiscal_rid_temp", "resource_rid_temp", "total_hours_pro_task_temp", "total_cost_pro_task_temp"
                    ]
                    cols_to_drop = [col for col in cols_to_drop if col in df.columns]
                    if cols_to_drop:
                        df = df.drop(*cols_to_drop)

                    logger.info(f"[project_task from task] ✅ Project task handling completed. Final count: {df.count()}")

                    # Log distribution of statuses
                    if not df.rdd.isEmpty():
                        status_counts = df.groupBy("status_rid").count().collect()
                        for status_count in status_counts:
                            logger.info(f"Status RID {status_count['status_rid']}: {status_count['count']} rows")
                    return df

                except Exception as e:
                    logger.error(f"[project_task from task] ❌ Error in project task handler: {str(e)}", exc_info=True)
                    raise

            elif entity_type == "resource_skill":
                df = self.map_entity_rid_and_r_number_with_data(df, entity_type, account_r_number, account_rid)
                df = self._map_resource_type_rid_if_missing(df, db_config, account_r_number)
                
                if "resource_name" in df.columns:
                    df = df.drop("resource_name")
                
                if existing_df.rdd.isEmpty():
                    logger.info(f"[{entity_type}] No existing records found for account_rid={account_rid}. Skipping duplicate check.")
                else:
                    # Clean and standardize all columns for comparison
                    df = df.withColumn("resource_code", trim(col("resource_code"))) \
                        .withColumn("skill_type_rid", trim(col("skill_type_rid"))) \
                        .withColumn("skill_subtype_rid", trim(col("skill_subtype_rid"))) \
                        .withColumn("skill_level_rid", trim(col("skill_level_rid"))) \
                        .withColumn("comments", trim(col("comments"))) \
                        .withColumn("skill_details", trim(col("skill_details"))) \
                        .withColumn("start_date", to_date(col("start_date")))
                    
                    existing_df_clean = existing_df.withColumn("resource_code", trim(col("resource_code"))) \
                                                .withColumn("skill_type_rid", trim(col("skill_type_rid"))) \
                                                .withColumn("skill_subtype_rid", trim(col("skill_subtype_rid"))) \
                                                .withColumn("skill_level_rid", trim(col("skill_level_rid"))) \
                                                .withColumn("comments", trim(col("comments"))) \
                                                .withColumn("skill_details", trim(col("skill_details"))) \
                                                .withColumn("start_date", to_date(col("start_date")))

                    # ✅ PERSIST DataFrames for repeated use
                    df.persist(StorageLevel.MEMORY_AND_DISK)
                    existing_df_clean.persist(StorageLevel.MEMORY_AND_DISK)
                    
                    staging_table = self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_SKILL_TABLE)
                    
                    # Step 1: Pre-resolve skill_type_names efficiently
                    skill_type_table = self.get_public_table(config.SKILL_TYPE_TABLE)
                    skill_type_mapping = {}
                    
                    # Get unique skill_type_rids using Spark operations (no collect)
                    unique_skill_rids_df = df.select("skill_type_rid").union(existing_df_clean.select("skill_type_rid")).distinct().filter(col("skill_type_rid").isNotNull())
                    unique_skill_rids = [row.skill_type_rid for row in unique_skill_rids_df.collect()]  # Limited collect since skill types are small
                    
                    if unique_skill_rids:
                        placeholders = ','.join(['%s'] * len(unique_skill_rids))
                        resolve_query = f"SELECT rid, skill_type_name FROM {skill_type_table} WHERE rid IN ({placeholders})"
                        
                        with DBPool.get_connection_mainDB() as conn:
                            with conn.cursor() as cursor:
                                cursor.execute(resolve_query, unique_skill_rids)
                                results = cursor.fetchall()
                                for rid, skill_type_name in results:
                                    skill_type_mapping[rid] = skill_type_name

                    # ✅ METHOD 1: Use Spark JOIN for duplicate detection (SCALABLE)
                    # Add combination key to both DataFrames
                    df_with_key = df.withColumn("combo_key", 
                        concat_ws("|", 
                            col("account_rid"),
                            col("resource_code"),
                            col("skill_type_rid"),
                            coalesce(col("skill_subtype_rid"), lit("NULL")),
                            coalesce(col("skill_level_rid"), lit("NULL")),
                            coalesce(col("comments"), lit("NULL")),
                            coalesce(col("skill_details"), lit("NULL")),
                            coalesce(col("start_date").cast("string"), lit("NULL"))
                        )
                    )
                    
                    existing_with_key = existing_df_clean.withColumn("combo_key", 
                        concat_ws("|", 
                            col("account_rid"),
                            col("resource_code"),
                            col("skill_type_rid"),
                            coalesce(col("skill_subtype_rid"), lit("NULL")),
                            coalesce(col("skill_level_rid"), lit("NULL")),
                            coalesce(col("comments"), lit("NULL")),
                            coalesce(col("skill_details"), lit("NULL")),
                            coalesce(col("start_date").cast("string"), lit("NULL"))
                        )
                    )
                    
                    # Find duplicates using LEFT SEMI JOIN (efficient)
                    duplicates_df = df_with_key.join(existing_with_key.select("combo_key"), "combo_key", "left_semi")
                    
                    # Count duplicates without collecting all data
                    duplicate_count = duplicates_df.count()
                    
                    if duplicate_count > 0:
                        logger.warning(f"[{entity_type}] ⚠️ Found {duplicate_count} duplicate records")
                        
                        # ✅ Process duplicates in BATCHES for large datasets
                        batch_size = Constants.Threshold.BATCH_SIZE  # Adjust based on your memory
                        duplicate_rids = duplicates_df.select("combo_key", "resource_code", "skill_type_rid").collect()
                        
                        updated_rows = []
                        for i in range(0, len(duplicate_rids), batch_size):
                            batch = duplicate_rids[i:i + batch_size]
                            
                            for row in batch:
                                rc = row.resource_code
                                sk_rid = row.skill_type_rid
                                
                                skill_type_name = skill_type_mapping.get(sk_rid)
                                if skill_type_name:
                                    update_query = f"""
                                    UPDATE {staging_table}
                                    SET error_descriptions = COALESCE(error_descriptions, '') || '{Constants.ErrorMessages.DUPLICATE_SKILL_ENTRY}',
                                        status = 'Failed'
                                    WHERE account_rid = %s
                                    AND resource_id = %s
                                    AND skill_type = %s
                                    """
                                    
                                    try:
                                        with DBPool.get_connection() as conn:
                                            with conn.cursor() as cursor:
                                                cursor.execute(update_query, (account_rid, rc, skill_type_name))
                                            conn.commit()
                                        updated_rows.append((rc, sk_rid))
                                    except Exception as e:
                                        logger.error(f"Error updating staging table: {str(e)}")
                        
                        logger.warning(f"[{entity_type}] ⚠️ Updated {len(updated_rows)} duplicate records in staging table")
                        
                        # ✅ Filter out duplicates using ANTI JOIN (most efficient for large datasets)
                        non_duplicates_df = df_with_key.join(existing_with_key.select("combo_key"), "combo_key", "left_anti")
                        df = non_duplicates_df.drop("combo_key")
                        
                        logger.info(f"[{entity_type}] ✅ After filtering duplicates: {df.count()} records remain")
                    else:
                        logger.info(f"[{entity_type}] ✅ No duplicates found")
                        df = df_with_key.drop("combo_key")
                    
                    # ✅ UNPERSIST temporary DataFrames
                    existing_df_clean.unpersist()
                    df_with_key.unpersist()
                    
                # Final persistence check
                if df.rdd.isEmpty():
                    logger.info(f"[{entity_type}] No records remaining after duplicate check.")
                else:
                    df.persist(StorageLevel.MEMORY_AND_DISK)
                    logger.info(f"[{entity_type}] ✅ Final record count: {df.count()}")
                
                logger.info(f"[{entity_type}] ✅ Special entity handling completed.")
                
                
                # Schema info only
                logger.info("📁 Resource Skill df_with_rid Schema:\n%s", df._jdf.schema().treeString())
                
                return df
            
            elif entity_type == "resource":
                # df = self.map_entity_rid_and_r_number_with_data(df, entity_type, account_r_number)
                df = df.withColumn("resource_code", trim(col("resource_code")))

                # Drop duplicates based on resource_code
                df = df.dropDuplicates(["resource_code"])

                logger.info(f"[{entity_type}] ✅ Deduplicated using dropDuplicates on resource_code")

            elif entity_type == "project":
                # df = self.map_entity_rid_and_r_number_with_data(df, entity_type, account_r_number)
                df = df.withColumn("project_code", trim(col("project_code")))

                # Drop duplicates based on project_code
                df = df.dropDuplicates(["project_code"])
               
                cols_to_drop = ["spoc_name", "spoc_email", "project_tech_poc_name", "project_tech_poc_email", "project_delivery_head_name", "project_delivery_head_email"]
                cols_to_drop = [col for col in cols_to_drop if col in df.columns]
                if cols_to_drop:
                    df = df.drop(*cols_to_drop)

                logger.info(f"[{entity_type}] ✅ Deduplicated using dropDuplicates on project_code")

            elif entity_type == "resource_cost":
                # Map RID and R-Number
                df = self.map_entity_rid_and_r_number_with_data(df, entity_type, account_r_number, account_rid)

                # Status RIDs
                active_status_rid = self.get_resource_status_rid("Active")
                anomaly_status_rid = self.get_resource_status_rid("Anomaly")
                duplicate_status_rid = self.get_resource_status_rid("Duplicate")

                # Convert date columns
                for col_name in ["effective_from", "end_date"]:
                    if col_name in df.columns:
                        df = df.withColumn(col_name, to_date(col(col_name)))
                    if col_name in existing_df.columns:
                        existing_df = existing_df.withColumn(col_name, to_date(col(col_name)))
                # existing_df.show()
                # Match keys for identifying duplicates
                match_keys = [
                    "resource_code","effort_in_hrs", "resource_cost"
                ]

                # ----------------------
                # Handle Duplicates
                # ----------------------
                # Alias the two DataFrames
                # Deduplicate columns to avoid ambiguity
                # df.show()
                # existing_df.show()
                df = df.toDF(*dict.fromkeys(df.columns))  # ensures unique column names
                existing_df = existing_df.toDF(*dict.fromkeys(existing_df.columns))
                # existing_df.show()
                # Step 1: Handle Duplicates
                # ----------------------
                df_alias = df.alias("new")
                existing_alias = existing_df.alias("old")
                existing_filtered = existing_df.filter(
                    col("status_rid").isin([active_status_rid, anomaly_status_rid])
                )
                existing_filtered_unique = existing_filtered.dropDuplicates(match_keys)
                duplicate_df = df_alias.join(
                    existing_filtered_unique.alias("old"),
                    on=[df_alias[k] == col("old." + k) for k in match_keys],
                    how="inner"
                ).select([df_alias[c] for c in df.columns]) \
                .withColumn("status_rid", lit(duplicate_status_rid)) \
                .withColumn("net_resource_cost", lit(None).cast("double"))
                # duplicate_df.show()
                # Remove duplicates from working set
                working_df = df.join(
                    duplicate_df.select(*match_keys),
                    on=match_keys,
                    how="left_anti"
                )

                # ====================================================
                # Step 2: Join Currency Thresholds
                # ====================================================
                currency_threshold_df = None
                if working_df.rdd.isEmpty():
                    currency_threshold_df = self.spark.createDataFrame([], schema="""
                        currency_rid string,
                        currency_threshold decimal(18,2)
                    """)
                else:
                    currency_ids = (
                        working_df.select("currency_rid")
                        .where(col("currency_rid").isNotNull())
                        .distinct()
                        .rdd.flatMap(lambda x: x)
                        .collect()
                    )

                    if currency_ids:
                        id_list = ",".join([f"'{cid}'" for cid in currency_ids])
                        currency_threshold_df = (
                            self.spark.read
                            .format("jdbc")
                            .option("url", config.MAIN_DB_URL)
                            .option(
                                "dbtable",
                                f"(SELECT rid, currency_threshold "
                                f"FROM {Constants.Database.SCHEMA_MAIN}.{Constants.Tables.CURRENCY} "
                                f"WHERE rid IN ({id_list})) AS currency_subquery"
                            )
                            .option("user", config.MAIN_DB_USER)
                            .option("password", settings.MAIN_DB_PASSWORD)
                            .option("driver", config.ENTITY_DB_DRIVER)
                            .load()
                            .select(
                                F.col("rid").alias("currency_rid"),
                                F.col("currency_threshold").cast("decimal(18,2)").alias("currency_threshold")
                            )
                        )
                    else:
                        currency_threshold_df = self.spark.createDataFrame([], schema="""
                            currency_rid string,
                            currency_threshold decimal(18,2)
                        """)

                working_df = working_df.join(currency_threshold_df, on="currency_rid", how="left")

                # ====================================================
                # Step 3: Handle Anomalies
                # ====================================================
                if duplicate_df.rdd.isEmpty():
                    anomaly_df = (
                        working_df.filter(
                            (col("salary") > col("currency_threshold")) |
                            (col("resource_cost") > col("currency_threshold")) |
                            (col("effort_in_hrs") > config.RESOURCE_COST_HOURLY)
                        )
                        .withColumn("status_rid", lit(anomaly_status_rid))
                        .withColumn("net_resource_cost", lit(None).cast("double"))
                        .drop("currency_threshold")
                    )

                    working_df = working_df.drop("currency_threshold")

                    # Remove anomalies from working set
                    working_df = working_df.join(
                        anomaly_df.select(*match_keys),
                        on=match_keys,
                        how="left_anti"
                    )
                    # working_df.show()
                else:
                    extended_schema = StructType(df.schema.fields + [
                        StructField("net_resource_cost", DoubleType(), True),
                    ])
                    anomaly_df = self.spark.createDataFrame([], extended_schema)
                    working_df = working_df.drop("currency_threshold")

                # ----------------------
                # Step 3: Handle Valid (Active)
                # ----------------------
                valid_df = working_df.withColumn("status_rid", lit(active_status_rid)) \
                                    .withColumn(
                                        "net_resource_cost",
                                        coalesce(col("salary"), lit(0)) +
                                        coalesce(col("bonus"), lit(0)) +
                                        coalesce(col("insurance"), lit(0)) +
                                        coalesce(col("resource_cost"), lit(0)) -
                                        coalesce(col("deductions"), lit(0))
                                    )

                # ----------------------
                # Step 4: Final Union
                # ----------------------
                final_columns = list(set(valid_df.columns) | set(anomaly_df.columns) | set(duplicate_df.columns))
                final_df = duplicate_df.select(*final_columns) \
                    .unionByName(anomaly_df.select(*final_columns), allowMissingColumns=True) \
                    .unionByName(valid_df.select(*final_columns), allowMissingColumns=True)

                # Drop unused columns
                final_df = final_df.drop(*[c for c in ["resource_organization", "resource_name"] if c in final_df.columns])
                df = final_df
            
            return df

        except Exception as e:
            logger.error(f"[{entity_type}] ❌ Error in special entity handler: {str(e)}", exc_info=True)
            raise

    def _map_type_from_existing(
        self,
        df,
        existing_df,
        key_col,
        type_col,
        fiscal_year=False
    ):
        """
        Map type_col from existing_df into df
        ONLY when incoming type_col is NULL.
        """

        if key_col not in df.columns:
            logger.warning(
                f"[_map_type_from_existing] '{key_col}' not found. Skipping."
            )
            return df

        # Alias new
        new_df = df.alias("new")

        # Prepare old df — RENAME KEY!
        select_cols = [
            F.trim(F.col(key_col)).alias(f"old_{key_col}"),
            F.col(type_col).alias(f"existing_{type_col}")
        ]

        use_fiscal_year = (
            fiscal_year
            and "fiscal_year" in df.columns
            and "fiscal_year" in existing_df.columns
        )

        if use_fiscal_year:
            select_cols.append(F.col("fiscal_year").alias("old_fiscal_year"))

        old_df = (
            existing_df
            .select(*select_cols)
            .dropDuplicates()
            .alias("old")
        )
        # Join condition
        join_cond = F.col(f"new.{key_col}") == F.col(f"old.old_{key_col}")

        if use_fiscal_year:
            join_cond = join_cond & (
                F.col("new.fiscal_year") == F.col("old.old_fiscal_year")
            )
        # LEFT JOIN
        joined = new_df.join(old_df, join_cond, "left")
        # Resolve type
        joined = joined.withColumn(
            type_col,
            F.when(
                F.col(f"new.{type_col}").isNull(),
                F.col(f"existing_{type_col}")
            ).otherwise(F.col(f"new.{type_col}"))
        )
        # Final projection — ONLY new columns
        result = joined.select(
            *[F.col(c) for c in df.columns]
        )
        return result

    def _dedupe(self, df):
        """Force Spark to remove hidden duplicate column references."""
        return df.select(*dict.fromkeys(df.columns))

    def _dedupe_columns(self, df):
        """
        Removes duplicate column names safely.
        Keeps the first occurrence only.
        """
        seen = set()
        cols = []
        for c in df.columns:
            if c not in seen:
                seen.add(c)
                cols.append(F.col(c))
        return df.select(*cols)


    def _map_status_from_existing(
        self,
        df,
        existing_df,
        key_col,
        fiscal_year=False
    ):
        # 🔒 HARD SAFETY: remove duplicate columns first
        df = self._dedupe_columns(df)
        existing_df = self._dedupe_columns(existing_df)

        df = df.dropDuplicates([key_col])

        new_df = df.alias("new")
        # -----------------------------
        # Prepare OLD DF
        # -----------------------------
        select_cols = [
            F.col(key_col).alias(key_col),
            F.col("status_rid").alias("existing_status_rid")
        ]

        if fiscal_year and "fiscal_year" in existing_df.columns:
            select_cols.append("fiscal_year")

        old_df = (
            existing_df
            .select(*select_cols)
            .dropDuplicates()
            .alias("old")
        )
        # -----------------------------
        # JOIN
        # -----------------------------
        join_cond = F.col(f"new.{key_col}") == F.col(f"old.{key_col}")

        if fiscal_year and "fiscal_year" in df.columns:
            join_cond = join_cond & (
                F.col("new.fiscal_year") == F.col("old.fiscal_year")
            )

        joined = new_df.join(old_df, join_cond, "left")

        # -----------------------------
        # RESOLVE STATUS (new wins)
        # -----------------------------
        resolved_cols = [
            F.col(f"new.{c}").alias(c)
            for c in df.columns
            if c != "status_rid"
        ]

        resolved = joined.select(
            *resolved_cols,
            F.coalesce(
                F.col("new.status_rid"),
                F.col("old.existing_status_rid")
            ).alias("status_rid")
        )

        return resolved


    def _apply_status_from_type(self, df, type_col, inactive_status_rid, active_status_rid):
        """
        If type_col is NULL → set status_rid = inactive_status_rid
        Else                → leave existing status_rid unchanged
        """
        return df.withColumn(
            "status_rid",
            when(col(type_col).isNull(), lit(inactive_status_rid))
            .otherwise(lit(active_status_rid))
        )

    def _apply_new_record_status(self, df, type_col, active_status_rid, inactive_status_rid):
        return df.withColumn(
            "status_rid",
            when(col(type_col).isNotNull(), lit(active_status_rid))      # type exists → ACTIVE
            .otherwise(lit(inactive_status_rid))                         # missing type → INACTIVE
        )

    def _update_staging_failure(self, staging_table, account_rid, resource_code, project_code, document_rid, error_message):
        """Update staging table with failure information"""
        update_query = f"""
        UPDATE {staging_table}
        SET error_descriptions = COALESCE(error_descriptions, '') || '{error_message}',
            status = 'Failed'
        WHERE account_rid = '{account_rid}'
        AND resource_id = '{resource_code}'
        AND project_id = '{project_code}'
        AND document_rid = '{document_rid}'
        """
        
        try:
            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    logger.info(f"Updating staging failure: {update_query}")
                    cursor.execute(update_query)
                conn.commit()
        except Exception as e:
            logger.error(f"❌ Error updating staging entity: {str(e)}", exc_info=True)
            raise

    def _update_task_staging_failure(self, staging_table, account_rid, resource_rid, project_rid, start_date, end_date, error_message):
        """Update task staging table with failure information"""
        update_query = f"""
        UPDATE {staging_table}
        SET error_descriptions = COALESCE(error_descriptions, '') || '{error_message}',
            status = 'Failed'
        WHERE account_rid = '{account_rid}'
        AND resource_rid = '{resource_rid}'
        AND project_rid = '{project_rid}'
        AND task_start_date = '{start_date}'
        AND task_end_date = '{end_date}'
        """
        
        try:
            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    logger.info(f"Updating task staging failure: {update_query}")
                    cursor.execute(update_query)
                conn.commit()
        except Exception as e:
            logger.error(f"❌ Error updating task staging entity: {str(e)}", exc_info=True)
            raise

    def is_changed(self, old_val, new_val):
        if old_val is None and new_val is None:
            return False
        if old_val is None or new_val is None:
            logger.info(f"Detected change: old={old_val}, new={new_val} (one is None)")
            return True
        try:
            old_float = float(old_val)
            new_float = float(new_val)
            if old_float != new_float:
                logger.info(f"Detected change (float compare): old={old_val}, new={new_val}")
                return True
            return False
        except (ValueError, TypeError):
            pass
        if str(old_val).strip() != str(new_val).strip():
            logger.info(f"Detected change (string compare): old={old_val}, new={new_val}")
            return True
        return False

    def _ensure_parent_records(
        self, df: DataFrame, db_config: dict, modified_by: str,
        account_r_number: str, account_rid: str, entity_type: str = None
    ):
        # Fix column if needed
        if "resource_organization" in df.columns:
            df = df.withColumnRenamed("resource_organization", "resource_orgname")

        parent_columns = ["resource_code", "resource_type_rid", "resource_name"]
        if entity_type == "resource_cost":
            parent_columns.append("resource_orgname")

        # Collect unique parent reference records
        parent_ref_ids = df.select(*parent_columns).distinct().collect()

        # Map: resource_code → (type_rid, name, orgname)
        parent_id_type_map = {}
        for row in parent_ref_ids:
            parent_id_type_map[row["resource_code"]] = (
                row["resource_type_rid"],
                row["resource_name"],
                row["resource_orgname"] if entity_type == "resource_cost" else None
            )

        logger.info(f"Checking and creating/updating: {db_config['parent_table']}")

        # Load existing parent records
        existing_parents = self.spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", db_config["parent_table"]) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .filter(F.col("account_rid") == account_rid) \
            .select("resource_code", "account_rid", "resource_name", "resource_type_rid", "resource_orgname") \
            .collect()

        existing_parent_refs = {(x["resource_code"], x["account_rid"]) for x in existing_parents}
        existing_details_map = {
            (x["resource_code"], x["account_rid"]): (
                x["resource_type_rid"], x["resource_name"], x["resource_orgname"]
            )
            for x in existing_parents
        }

        # Identify missing parents
        missing_parent_refs = [
            ref_id for ref_id in parent_id_type_map
            if (ref_id, account_rid) not in existing_parent_refs
        ]

        # Helper: check if value changed but skip NULL new values
        def has_changed(old, new):
            return new is not None and old != new

        # Identify changed parents with NULL-safe comparison
        changed_parents = []
        for ref_id, (new_type, new_name, new_org) in parent_id_type_map.items():
            key = (ref_id, account_rid)
            if key in existing_details_map:
                old_type, old_name, old_org = existing_details_map[key]

                if (
                    has_changed(old_type, new_type) or
                    has_changed(old_name, new_name) or
                    (entity_type == "resource_cost" and has_changed(old_org, new_org))
                ):
                    # Preserve old values if new ones are NULL
                    final_type = new_type if new_type is not None else old_type
                    final_name = new_name if new_name is not None else old_name
                    final_org = (
                        new_org if new_org is not None else old_org
                        if entity_type == "resource_cost" else None
                    )

                    changed_parents.append((ref_id, final_type, final_name, final_org))

        # ------------------------- INSERT missing parents -------------------------
        if missing_parent_refs:
            logger.info(f"Inserting {len(missing_parent_refs)} missing parent records...")
            parent_data = []
            now = self.get_date_and_time()

            for ref_id in missing_parent_refs:
                type_rid, name, orgname = parent_id_type_map[ref_id]
                status_rid = self.get_active_status_rid() if type_rid else self.get_inactive_status_rid()

                record = {
                    "resource_code": ref_id,
                    "resource_type_rid": type_rid,
                    "resource_name": name,
                    "status_rid": status_rid,
                    "created_by": modified_by,
                    "created_datetime": now,
                    "account_rid": account_rid,
                }

                if entity_type == "resource_cost":
                    record["resource_orgname"] = orgname

                parent_data.append(record)

            schema_fields = [
                StructField("resource_code", StringType(), True),
                StructField("resource_type_rid", StringType(), True),
                StructField("resource_name", StringType(), True),
                StructField("status_rid", StringType(), True),
                StructField("created_by", StringType(), True),
                StructField("created_datetime", TimestampType(), True),
                StructField("account_rid", StringType(), True),
            ]

            if entity_type == "resource_cost":
                schema_fields.append(StructField("resource_orgname", StringType(), True))

            parent_df = self.spark.createDataFrame(parent_data, StructType(schema_fields))
            parent_df.write \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", db_config["parent_table"]) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .option("stringtype", "unspecified") \
                .option("batchsize", 100) \
                .mode("append") \
                .save()

        # ------------------------- UPDATE changed parents -------------------------
        if changed_parents:
            logger.info(f"Updating {len(changed_parents)} existing parent records...")
            now = self.get_date_and_time()

            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    for ref_id, new_type, new_name, new_org in changed_parents:

                        if entity_type == "resource_cost":
                            cursor.execute(
                                f"""
                                UPDATE {db_config['parent_table']}
                                SET resource_name = %s,
                                    resource_type_rid = %s,
                                    resource_orgname = %s,
                                    modified_by = %s,
                                    modified_datetime = %s
                                WHERE resource_code = %s AND account_rid = %s
                                """,
                                (new_name, new_type, new_org, modified_by, now, ref_id, account_rid)
                            )
                        else:
                            cursor.execute(
                                f"""
                                UPDATE {db_config['parent_table']}
                                SET resource_name = %s,
                                    resource_type_rid = %s,
                                    modified_by = %s,
                                    modified_datetime = %s
                                WHERE resource_code = %s AND account_rid = %s
                                """,
                                (new_name, new_type, modified_by, now, ref_id, account_rid)
                            )

                conn.commit()

        logger.info(f"Parent table sync completed: {len(missing_parent_refs)} inserted, {len(changed_parents)} updated.")

    def _map_parent_rid(self, df: DataFrame, db_config: dict, account_rid: str) -> DataFrame:
        """Map parent reference ID to resource_rid from parent table and overwrite in df"""

        # Load parent table with reference id and rid
        parent_rid_df = self.spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", db_config["parent_table"]) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .filter(F.col("account_rid") == account_rid) \
            .select(
                F.col(db_config["parent_ref_column"]).alias("parent_ref_id"),
                F.col(db_config["parent_rid_column"]).alias("mapped_rid")
            )

        # Join using reference column and update resource_rid
        df = df.alias("child")
        parent_rid_df = parent_rid_df.alias("parent")

        updated_df = df.join(
            parent_rid_df,
            F.col("child." + db_config["parent_ref_column"]) == F.col("parent.parent_ref_id"),
            "left"
        ).drop("resource_rid")  # drop old resource_rid

        # Rename mapped_rid to resource_rid (overwriting the old column)
        return updated_df.withColumnRenamed("mapped_rid", "resource_rid").drop("parent_ref_id")

    def _map_dual_parents(self, df: DataFrame, dual_parents_config: dict, account_r_number: str, account_rid: str) -> DataFrame:
        for parent_key, parent_details in dual_parents_config.items():
            parent_table = self.get_tenant_table(account_r_number, parent_details["table"])
            parent_df = self.spark.read \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", parent_table) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .filter(F.col("account_rid") == account_rid) \
                .select(
                    F.col(parent_details["ref_column"]),
                    F.col("rid").alias(parent_details["rid_column"])
                )
            df = df.join(parent_df, on=parent_details["ref_column"], how="left")
        return df

    def _map_resource_type_rid_if_missing(
        self,
        df: DataFrame,
        db_config: dict,
        account_rid: str
    ) -> DataFrame:
        """
        For rows with null or empty resource_type_rid, fetch from the resource table using resource_code.
        """
        logger.info("[resource_skill] 🔄 Mapping missing resource_type_rid from resource table...")

        # Load resource table
        resource_df = self.spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", db_config["parent_table"]) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .filter(F.col("account_rid") == account_rid) \
            .select("resource_code", "resource_type_rid")

        # Identify rows with null/empty resource_type_rid
        df_with_flag = df.withColumn(
            "missing_rtr",
            (col("resource_type_rid").isNull()) | (trim(col("resource_type_rid")) == "")
        )

        # Only join for missing values
        updated_df = df_with_flag.alias("child").join(
            resource_df.alias("res"),
            col("child.resource_code") == col("res.resource_code"),
            "left"
        ).withColumn(
            "final_resource_type_rid",
            when(col("child.missing_rtr"), col("res.resource_type_rid")).otherwise(col("child.resource_type_rid"))
        ).select(
            *[col("child." + c) for c in df.columns],  # preserve original df columns
            col("final_resource_type_rid")
        ).drop("resource_type_rid").withColumnRenamed("final_resource_type_rid", "resource_type_rid")

        logger.info("Mapping completed")
        return updated_df.withColumnRenamed("final_resource_type_rid", "resource_type_rid")


    def _load_default_json_config(self) -> dict:
        """
        Load the fiscal mappings config from the correct schema directory.
        Looks in both possible locations for backward compatibility.
        """
        config_filename = "fiscal_mappings.json"  # Note: Typo in filename? Should it be 'fiscal_mappings.json'?
        
        # Try two possible locations
        possible_paths = [
            # 1. First try the sibling schema directory
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "schema", config_filename),
            # 2. Then try the database/schema directory (old location)
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema", config_filename)
        ]
        
        for config_path in possible_paths:
            try:
                logger.info(f"Looking for config at: {config_path}")
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    logger.info(f"Successfully loaded config from {config_path}")
                    return config
            except FileNotFoundError:
                continue
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in config file {config_path}: {str(e)}")
                raise
        
        # If we get here, neither path worked
        error_msg = f"Config file '{config_filename}' not found in:\n" + "\n".join(possible_paths)
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)
    

    def transform_dataframe(self, df_mapped, entity_type):
        """
        Transforms the dataframe by mapping field names and ensuring correct data types,
        while filling missing columns with default values.

        Args:
            df_mapped (DataFrame): The input dataframe with initial column mappings.
            entity_type (str): The entity type (e.g., "project") used for configuration lookup.

        Returns:
            DataFrame: The transformed dataframe with correctly mapped fields and missing values handled.
        """
        try:
            logger.info(f"🚀 Starting transformation for entity_type: {entity_type}")
            
            # Load JSON configuration
            json_config = self._load_default_json_config()
            entity_config = json_config["entity_mappings"].get(entity_type, {})

            # Extract field mappings and missing columns
            field_mappings = entity_config.get("field_mappings", {})
            missing_columns = entity_config.get("missing_columns", [])

            # Step 1: Apply column renaming using selectExpr
            df_transformed = df_mapped.selectExpr(
                *[f"{old_col} as {new_col}" for old_col, new_col in field_mappings.items()]
            )

            # Optional: Drop unnecessary column for resource entity
            if entity_type == "resource" and "resource_code" in df_transformed.columns:
                df_transformed = df_transformed.drop("resource_code")

            # Step 2: Define type mapping for expected columns
            column_type_mapping = {
                "expiry_duration": "int",
                "total_fte_prj": "int",
                "total_subcon_prj": "int",
                "total_nonlabor_prj": "int",
                "total_fte_from_tasks": "int",
                "total_subcon_from_tasks": "int",
                "total_subcon_from_tasks": "int",
                "total_nonlabor_from_tasks": "int",
                "total_fte_from_tasks": "int",
                "total_resources_prj": "int",
                "total_resources_from_tasks": "int",
                "total_resources_from_tasks": "int",
                "max_ai_interaction": "int",
                # Decimals
                **{col: "decimal(18,2)" for col in [
                    "total_effort_from_tasks", "total_effort_fte_from_tasks", "total_effort_subcon_from_tasks",
                    "total_effort_from_tasks", "total_effort_fte_from_tasks", "total_effort_subcon_from_tasks",
                    "total_cost_fte_from_tasks", "total_cost_subcon_from_tasks", "total_cost_nonlabor_from_tasks",
                    "total_cost_from_tasks", "total_cost_fte_from_tasks", "total_cost_subcon_from_tasks",
                    "total_cost_from_tasks", "total_cost_prj_blended", "total_cost_fte_prj_blended",
                    "total_cost_subcon_prj_blended", "total_cost_from_tasks_blended", "total_cost_fte_from_tasks_blended",
                    "total_cost_subcon_from_tasks_blended", "total_cost_from_tasks_blended", "total_cost_fte_from_tasks_blended",
                    "total_cost_subcon_from_tasks_blended", "rd_percent_potential_ai", "rd_percent_adjustment",
                    "rd_percent_final", "qre_fte", "qre_subcon", "qre_nonlabor", "rd_credits_fte_fed_level",
                    "rd_credits_subcon_fed_level", "rd_credits_nonlabor_fed_level", "rd_credits_fed_level",
                    "rd_credits_total"
                ]},
                "interaction_cc_list": "string",
                "claim_status": "string"
            }

            # Step 3: Add missing columns with default values
            for col_name in missing_columns:
                if col_name not in df_transformed.columns:
                    col_type = column_type_mapping.get(col_name, "string")
                    if col_type.startswith("decimal") or col_type == "int":
                        default_value = None
                    else:
                        default_value = ""

                    df_transformed = df_transformed.withColumn(
                        col_name, lit(default_value).cast(col_type)
                    )
            logger.info("✅ DataFrame transformation complete")
            return df_transformed

        except Exception as e:
            logger.error(f"❌ Error in transform_dataframe: {str(e)}", exc_info=True)
            raise
    
    def upsert_fiscal_table(
        self,
        df_mapped: DataFrame,
        entity_type: str,
        account_r_number: str,
        fiscal_year: int,
        account_rid: str,
        document_rid: str,
        modified_by: str,
        parent_entity_type: Optional[str] = None,
    ) -> None:

        inserts = updates = changed_records = None
        key_inserts = key_updates = key_changed_records = None
        df_prepared = None

        try:
            # -------------------------------------------------------
            # 1️⃣ Transform + Prepare
            # -------------------------------------------------------
            df_transformed = self.transform_dataframe(df_mapped, entity_type)

            df_prepared = self._prepare_fiscal_data(
                df_transformed,
                entity_type,
                account_r_number,
                fiscal_year,
                modified_by,
            ).persist(StorageLevel.MEMORY_AND_DISK)

            table_name = self._get_fiscal_table_name(entity_type, account_r_number)
            history_table_name = self.get_tenant_table(
                account_r_number,
                config.PROD_PROJECT_HISTORY_TABLE
            )

            # -------------------------------------------------------
            # 2️⃣ Identify fiscal changes
            # -------------------------------------------------------
            inserts, updates, changed_records = self._identify_fiscal_changes(
                df_prepared, table_name, entity_type, account_r_number
            )

            for df_var in [inserts, updates, changed_records]:
                if df_var is not None and not df_var.rdd.isEmpty():
                    df_var.persist(StorageLevel.MEMORY_AND_DISK)

            # -------------------------------------------------------
            # 3️⃣ Identify key contact changes
            # -------------------------------------------------------
            key_inserts, key_updates, key_changed_records = \
                self._identify_key_contact_changes(
                    df_prepared, entity_type, account_r_number
                )

            for df_var in [key_inserts, key_updates, key_changed_records]:
                if df_var is not None and not df_var.rdd.isEmpty():
                    df_var.persist(StorageLevel.MEMORY_AND_DISK)

            # -------------------------------------------------------
            # 4️⃣ COMBINED ROW-LEVEL DUPLICATE HANDLING
            # -------------------------------------------------------
            processed_all = None

            # Fiscal processed
            if inserts is not None and not inserts.rdd.isEmpty():
                processed_all = inserts.select("project_code")

            if updates is not None and not updates.rdd.isEmpty():
                upd = updates.select("project_code")
                processed_all = upd if processed_all is None \
                    else processed_all.union(upd)

            # Key processed
            if key_inserts is not None and not key_inserts.rdd.isEmpty():
                ki = key_inserts.select("project_code")
                processed_all = ki if processed_all is None \
                    else processed_all.union(ki)

            if key_updates is not None and not key_updates.rdd.isEmpty():
                ku = key_updates.select("project_code")
                processed_all = ku if processed_all is None \
                    else processed_all.union(ku)

            # Final duplicate detection
            if processed_all is not None:
                processed_all = processed_all.distinct()

                unchanged_all = df_prepared.join(
                    processed_all,
                    on="project_code",
                    how="left_anti"
                )
            else:
                unchanged_all = df_prepared

            # -------------------------------------------------------
            # 5️⃣ Update staging for true duplicates
            # -------------------------------------------------------
            if (
                not unchanged_all.rdd.isEmpty()
                and parent_entity_type not in ["project_task", "project_resource"]
            ):

                staging_table = self.get_tenant_table(
                    account_r_number,
                    config.STAGING_PROJECT_TABLE
                )

                project_codes = [
                    row.project_code
                    for row in unchanged_all.select("project_code").distinct().collect()
                ]

                if project_codes:
                    project_list = ",".join([f"'{pc}'" for pc in project_codes])

                    update_query = f"""
                        UPDATE {staging_table}
                        SET error_descriptions = TRIM(BOTH ';' FROM 
                            COALESCE(error_descriptions, '') 
                            || CASE 
                                WHEN error_descriptions IS NULL 
                                    OR error_descriptions = '' 
                                THEN '' 
                                ELSE '; ' 
                            END
                            || '{Constants.ErrorMessages.NO_CHANGE_DETECTED}'),
                            status = 'Failed'
                        WHERE account_rid = '{account_rid}'
                        AND document_rid = '{document_rid}'
                        AND project_id IN ({project_list})
                    """

                    with DBPool.get_connection() as conn:
                        with conn.cursor() as cursor:
                            cursor.execute(update_query)
                        conn.commit()

            # -------------------------------------------------------
            # 6️⃣ Execute fiscal DB operations
            # -------------------------------------------------------
            self._execute_fiscal_operations_for_project(
                inserts,
                updates,
                entity_type,
                account_r_number,
                account_rid,
                document_rid,
                table_name,
                history_table_name,
                modified_by,
                changed_records,
            )

            # ---------------------------------------------
            # 🔧 FIX: Backfill entity_rid for fresh projects
            # ---------------------------------------------
            if key_inserts is not None and not key_inserts.rdd.isEmpty():
                # ==================================================
                # 🔧 FIX: Reload fiscal table WITH RID
                # ==================================================
                fiscal_with_rid = (
                    self.spark.read
                        .format("jdbc")
                        .option("url", config.ENTITY_DB_URL)
                        .option("dbtable", table_name)
                        .option("user", config.ENTITY_DB_USER)
                        .option("password", settings.ENTITY_DB_PASSWORD)
                        .option("driver", config.ENTITY_DB_DRIVER)
                        .load()
                        .filter(
                            (col("account_rid") == account_rid) &
                            (col("fiscal_year") == fiscal_year)
                        )
                        .select("rid", "project_code")
                )

                ki = key_inserts.alias("ki")
                fr = fiscal_with_rid.select(
                    col("project_code").alias("fr_project_code"),
                    col("rid").alias("fr_entity_rid")
                ).alias("fr")

                key_inserts = (
                    ki
                    .join(
                        fr,
                        col("ki.project_code") == col("fr.fr_project_code"),
                        "left"
                    )
                    # 👇 explicitly choose which entity_rid to keep
                    .withColumn(
                        "entity_rid",
                        coalesce(col("ki.entity_rid"), col("fr.fr_entity_rid"))
                    )
                    # 🧹 drop helper columns
                    .drop("fr_project_code", "fr_entity_rid", "project_code")
                    # 🛡 safety
                    .filter(col("entity_rid").isNotNull())
                )
            # -------------------------------------------------------
            # 7️⃣ Execute key contact DB operations
            # -------------------------------------------------------
            if (
                (key_inserts is not None and not key_inserts.rdd.isEmpty())
                or (key_updates is not None and not key_updates.rdd.isEmpty())
                or (key_changed_records is not None and not key_changed_records.rdd.isEmpty())
            ):
                self.update_key_contacts_for_fiscal(
                    key_inserts,
                    key_updates,
                    inserts,
                    updates,
                    changed_records,
                    entity_type,
                    account_r_number,
                    account_rid,
                    modified_by,
                    document_rid,
                    fiscal_year,
                )

            # -------------------------------------------------------
            # 8️⃣ Handle region table (if applicable)
            # -------------------------------------------------------
            if "region_rid" in df_prepared.columns:

                df_region = (
                    df_prepared
                    .filter(col("region_rid").isNotNull())
                    .dropDuplicates([
                        "account_rid",
                        "project_code",
                        "fiscal_year",
                        "region_rid"
                    ])
                )

                df_region = self.map_fiscal_rid_with_data_by_rid(df_region, entity_type, account_r_number, fiscal_year)

                if not df_region.rdd.isEmpty():

                    region_table_name = self._get_fiscal_region_table_name(
                        entity_type, account_r_number
                    )

                    ins_r, upd_r, chg_r = self._identify_fiscal_changes(
                        df_region,
                        region_table_name,
                        entity_type,
                        account_r_number
                    )
                    self._execute_fiscal_operations(
                        ins_r,
                        upd_r,
                        entity_type,
                        region_table_name,
                        modified_by,
                        account_rid,
                        account_r_number,
                        document_rid,
                        chg_r,
                    )

                    self.upsert_account_fiscal_region(
                        df_region,
                        account_r_number,
                        account_rid,
                        fiscal_year,
                        modified_by,
                        entity_type,
                        "region_rid"
                    )

        except Exception as e:
            logger.error(f"Fiscal upsert failed: {str(e)}", exc_info=True)
            raise

        finally:
            for df_cache in [
                df_prepared,
                inserts,
                updates,
                changed_records,
                key_inserts,
                key_updates,
                key_changed_records,
            ]:
                if df_cache is not None:
                    df_cache.unpersist()




    # Internal helper methods
    def _prepare_fiscal_data(self, df: DataFrame, entity_type: str, account_r_number: str, fiscal_year: int, modified_by: str) -> DataFrame:
        """Add metadata columns and checksums for change detection with column validation.
        
        Args:
            df: Input DataFrame
            fiscal_year: Fiscal year to add
            modified_by: User modifying the data
            
        Returns:
            DataFrame with added metadata columns
            
        Raises:
            ValueError: If required columns are missing
        """
        try:            
            # Columns to add with their default values
            metadata_columns = {
                'created_datetime': self.get_date_and_time(),
                'created_by': modified_by,
                'fiscal_year': fiscal_year
            }
            
            # Add each metadata column if it doesn't exist
            for col_name, default_value in metadata_columns.items():
                if col_name not in df.columns:
                    df = df.withColumn(col_name, lit(default_value))
                    logger.info(f"Added missing metadata column: {col_name}")
                else:
                    # Handle null values for existing columns
                    if col_name in ['created_datetime', 'created_by']:
                        df = df.withColumn(col_name, 
                                        when(col(col_name).isNull(), lit(default_value))
                                        .otherwise(col(col_name)))
            
            integer_cols = [
                    "fiscal_year",
                    "max_ai_interaction",
                    "expiry_duration",
                    "total_fte_prj",
                    "total_fte_from_prj_res",
                    "total_fte_from_tasks",
                    "total_subcon_prj",
                    "total_subcon_from_prj_res",
                    "total_subcon_from_tasks",
                    "total_nonlabor_prj",
                    "total_nonlabor_from_tasks",
                    "total_resources_prj",
                    "total_resources_from_prj_res",
                    "total_resources_from_tasks",
                    "effective_total_fte",
                    "effective_total_subcon",
                    "effective_total_nonlabor"
            ]
            numeric_cols = [
                    "total_nonlabor_from_prj_res",
                    "total_effort_prj",
                    "total_effort_fte_prj",
                    "total_effort_subcon_prj",
                    "total_effort_from_prj_res",
                    "total_effort_fte_from_prj_res",
                    "total_effort_subcon_from_prj_res",
                    "total_effort_from_tasks",
                    "total_effort_fte_from_tasks",
                    "total_effort_subcon_from_tasks",
                    "total_cost_prj",
                    "total_cost_fte_prj",
                    "total_cost_subcon_prj",
                    "total_cost_nonlabor_prj",
                    "total_cost_from_prj_res",
                    "total_cost_fte_from_prj_res",
                    "total_cost_subcon_from_prj_res",
                    "total_cost_nonlabor_from_prj_res",
                    "total_cost_from_tasks",
                    "total_cost_fte_from_tasks",
                    "total_cost_subcon_from_tasks",
                    "total_cost_prj_blended",
                    "total_cost_fte_prj_blended",
                    "total_cost_subcon_prj_blended",
                    "total_cost_from_prj_res_blended",
                    "total_cost_fte_from_prj_res_blended",
                    "total_cost_subcon_from_prj_res_blended",
                    "total_cost_from_tasks_blended",
                    "total_cost_fte_from_tasks_blended",
                    "total_cost_subcon_from_tasks_blended",
                    "blended_rate_fte",
                    "blended_rate_subcon",
                    "rd_percent_potential_ai",
                    "rd_percent_potential_ai_updated",
                    "rd_percent_adjustment",
                    "rd_percent_final",
                    "qre_fte",
                    "qre_subcon",
                    "qre_nonlabor",
                    "qre_final",
                    "rd_credits_fte_fed_level",
                    "rd_credits_subcon_fed_level",
                    "rd_credits_nonlabor_fed_level",
                    "rd_credits_fed_level",
                    "rd_credits_total",
                    "effective_cost",
                    "effective_effort",
                    "effective_fte_cost",
                    "effective_fte_effort",
                    "effective_subcon_cost",
                    "effective_subcon_effort",
                    "effective_nonlabor_cost"
            ]
            # Cast integer columns
            for col in integer_cols:
                if col in df.columns:
                    df = df.withColumn(col, F.col(col).cast("int"))

            # Cast decimal columns
            for col in numeric_cols:
                if col in df.columns:
                    df = df.withColumn(col, F.col(col).cast("decimal(18,2)"))

            return df
        except Exception as e:
            logger.error(f"Failed to prepare fiscal data: {str(e)}")
            raise ValueError(f"Data preparation failed: {str(e)}") from e

    def _get_fiscal_table_name(self, entity_type: str, account_r_number: str) -> str:
        """Determine the target table name based on entity type."""
        if entity_type in ["resource", "resource_cost", "resource_skill"]:
            return self.get_tenant_table(account_r_number, config.PROD_RESOURCE_FISCAL_TABLE)
        elif entity_type in ["project"]:
            return self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
        else:
            return self.get_tenant_table(account_r_number, config.PROD_PROJECT_RESOURCE_FISCAL_TABLE)
        
    def _get_fiscal_region_table_name(self, entity_type: str, account_r_number: str) -> str:
        """Determine the target table name based on entity type."""
        if entity_type in ["resource", "resource_cost", "resource_skill"]:
            return self.get_tenant_table(account_r_number, config.PROD_RESOURCE_FISCAL_REGION_TABLE)
        elif entity_type in ["project"]:
            return self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_REGION_TABLE)
        else:
            return self.get_tenant_table(account_r_number, config.PROD_PROJECT_RESOURCE_FISCAL_REGION_TABLE)

    def _identify_fiscal_changes(self, df: DataFrame, table_name: str, entity_type: str, account_r_number: str) -> Tuple[DataFrame, DataFrame, DataFrame]:
        """Identify inserts vs updates with precise change detection and NULL handling."""

        try:
            cols_to_drop = ["spoc_name", "spoc_email", "project_tech_poc_name", "project_tech_poc_email", "project_delivery_head_name", "project_delivery_head_email"]
            cols_to_drop = [col for col in cols_to_drop if col in df.columns]
            if cols_to_drop:
                df = df.drop(*cols_to_drop)
            region_table_name = self._get_fiscal_region_table_name(entity_type, account_r_number)
            # 1. Define join keys
            join_keys = ["fiscal_year", "account_rid"]

            if table_name == region_table_name:
                join_keys.extend(["project_rid", "region_rid"])
            else:
                join_keys.append("project_rid" if entity_type == "project" else "resource_rid")
            
            # 2. Determine parent column based on entity type
            parent_column = "project_rid" if entity_type == "project" else "resource_rid"
            
            # 3. Initialize empty DataFrames
            empty_schema = StructType([StructField("rid", StringType())] + 
                        [StructField(c, df.schema[c].dataType) for c in df.columns])
            empty_updates = self.spark.createDataFrame([], empty_schema)
            empty_inserts = self.spark.createDataFrame([], df.schema)
            empty_changes = self.spark.createDataFrame([], 
                StructType([
                    StructField("parent_rid", StringType()),  # Changed from project_rid to parent_rid
                    StructField("fiscal_year", StringType()),
                    StructField("attribute_name", StringType()),
                    StructField("old_value", StringType()),
                    StructField("new_value", StringType())
                ])
            )

            # 4. Check table existence
            if not self._check_table_exists(table_name):
                return empty_updates, df, empty_changes

            filter_keys_df = df.select(join_keys).dropDuplicates()
            filter_key_list = [tuple(row) for row in filter_keys_df.collect()]

            if not filter_key_list:
                return empty_updates, df, empty_changes

            where_conditions = " OR ".join([
                "(" + " AND ".join([f"{key} = '{value}'" for key, value in zip(join_keys, key_tuple)]) + ")"
                for key_tuple in filter_key_list
            ])

            custom_query = f"(SELECT * FROM {table_name} WHERE {where_conditions}) AS filtered_table"
            existing_df = (self.spark.read
                .format("jdbc")
                .option("url", config.ENTITY_DB_URL)
                .option("dbtable", custom_query)
                .option("user", config.ENTITY_DB_USER)
                .option("password", settings.ENTITY_DB_PASSWORD)
                .option("driver", config.ENTITY_DB_DRIVER)
                .load()
            )
            active_status_rid = self.get_active_status_rid()
            inactive_status_rid = self.get_inactive_status_rid()
            if existing_df is None or existing_df.rdd.isEmpty():
                logger.info("No existing data")
                df = self._apply_new_record_status(
                            df,
                            type_col="project_type_rid",
                            active_status_rid=active_status_rid,
                            inactive_status_rid=inactive_status_rid
                        )
                return df, empty_updates, empty_changes

            df = self._map_type_from_existing(
                    df,
                    existing_df,
                    key_col="project_code",
                    type_col="project_type_rid"
                )
            df = self._map_status_from_existing(
                    df,
                    existing_df,
                    key_col = "project_code"
                )
            df = self._apply_status_from_type(
                    df,
                    type_col="project_type_rid",
                    inactive_status_rid=inactive_status_rid,
                    active_status_rid=active_status_rid
                )
            # 5. Join with precise change detection
            joined_df = df.alias("new").join(existing_df.alias("old"), join_keys, "left")

            # 6. Identify inserts
            inserts = joined_df.filter(F.col("old.rid").isNull()).select(
                *[F.col(f"new.{c}") for c in df.columns]
            )
            if inserts is not None and not inserts.rdd.isEmpty():
                inserts.persist(StorageLevel.MEMORY_AND_DISK)
            logger.info(f"inserts: {inserts.count()}")
            if inserts is not None and not inserts.rdd.isEmpty():
                inserts = self._apply_new_record_status(
                    inserts,
                    type_col="project_type_rid",
                    active_status_rid=active_status_rid,
                    inactive_status_rid=inactive_status_rid
                )

            # 7. Identify updates and changed fields
            metadata_columns = {"created_by", "created_datetime", "modified_by", "modified_datetime", "rid", "auto_send_ai_interaction", "auto_access_rd", "max_ai_interaction"}
            candidate_columns = [c for c in df.columns 
                            if c not in join_keys 
                            and c not in metadata_columns
                            and c in existing_df.columns]

            change_conditions = [
                (~F.col(f"new.{col}").eqNullSafe(F.col(f"old.{col}"))) & 
                (F.col(f"new.{col}").isNotNull()) &
                (F.col("old.rid").isNotNull())
                for col in candidate_columns
            ]

            if not change_conditions:
                inserts.unpersist()
                return inserts, empty_updates, empty_changes

            combined_condition = reduce(lambda a, b: a | b, change_conditions)

            # Prepare updates DataFrame
            updates = joined_df.filter(combined_condition).select(
                *[F.col(f"old.rid")] +
                [F.col(f"new.{c}") for c in df.columns]
            )
            if updates is not None and not updates.rdd.isEmpty():
                updates.persist(StorageLevel.MEMORY_AND_DISK)
            logger.info(f"updates: {updates.count()}")
            # updates.show()
            # Keep the comparison on native types
            schema_dict = {field.name: field.dataType for field in df.schema}

            change_structs = []
            for col_name in candidate_columns:
                col_type = schema_dict[col_name]
                
                change_structs.append(
                    F.struct(
                        F.lit(col_name).alias("attribute_name"),
                        self.format_value(col_name, col_type, "old").alias("old_value"),
                        self.format_value(col_name, col_type, "new").alias("new_value")
                    )
                )

            if table_name == region_table_name:
                # Create the final DataFrame
                logger.info("fiscal region changes detecting....")
                changed_records = (
                    joined_df
                    .filter(combined_condition)
                    .select(
                        F.col("old.rid").alias("project_fiscal_region_rid"),
                        F.col("old.project_rid").alias("project_rid"),
                        F.col("new.fiscal_year").alias("fiscal_year"),
                        F.col("new.project_code").alias("project_code"),
                        F.explode(F.array(*change_structs)).alias("change")
                    )
                    .select(
                        "project_fiscal_region_rid",
                        "project_rid",
                        "fiscal_year",
                        "project_code",
                        F.col("change.attribute_name"),
                        F.col("change.old_value"),
                        F.col("change.new_value")
                    )
                    .filter(
                        (~F.col("old_value").eqNullSafe(F.col("new_value"))) &
                        (F.col("new_value").isNotNull())
                    )
                )
            else:
                # Create the final DataFrame
                logger.info("fiscal changes detecting....")
                changed_records = (
                    joined_df
                    .filter(combined_condition)
                    .select(
                        F.col("old.rid").alias("project_fiscal_rid"),
                        F.col("old.project_rid").alias("project_rid"),
                        F.col("new.fiscal_year").alias("fiscal_year"),
                        F.col("new.project_code").alias("project_code"),
                        F.explode(F.array(*change_structs)).alias("change")
                    )
                    .select(
                        "project_fiscal_rid",
                        "project_rid",
                        "fiscal_year",
                        "project_code",
                        F.col("change.attribute_name"),
                        F.col("change.old_value"),
                        F.col("change.new_value")
                    )
                    .filter(
                        (~F.col("old_value").eqNullSafe(F.col("new_value"))) &
                        (F.col("new_value").isNotNull())
                    )
                )
                # changed_records.show()
            if changed_records is not None and not changed_records.rdd.isEmpty():
                changed_records.persist(StorageLevel.MEMORY_AND_DISK)
            
            logger.info(f"Identified {inserts.count()} inserts, {updates.count()} updates, and {changed_records.count()} changes")
            if inserts is not None:
                inserts.unpersist()
            if updates is not None:
                updates.unpersist()
            if changed_records is not None:
                changed_records.unpersist()
            return inserts, updates, changed_records

        except Exception as e:
            logger.error(f"Change detection failed: {str(e)}")
            raise

    def _identify_key_contact_changes(
        self, df: DataFrame, entity_type: str, account_r_number: str
    ) -> Tuple[DataFrame, DataFrame, DataFrame]:

        from pyspark.sql import functions as F
        from pyspark.sql.window import Window
        from functools import reduce
        from pyspark.sql.types import StructType

        try:
            logger.info("🔍 Checking key contact changes...")

            # ---------------------------------------------------------
            # Map fiscal RID (may be NULL for new projects)
            # ---------------------------------------------------------
            df = self.map_entity_fiscal_rid(df, entity_type, account_r_number)
            table_name = self.get_tenant_table(account_r_number, config.KEY_CONTACTS_TABLE)

            role_mappings = [
                {"input_name_col": "spoc_name", "input_email_col": "spoc_email",
                "role_name": "Project Point of Contact"},
                {"input_name_col": "project_tech_poc_name", "input_email_col": "project_tech_poc_email",
                "role_name": "Project Technical Point of Contact"},
                {"input_name_col": "project_delivery_head_name", "input_email_col": "project_delivery_head_email",
                "role_name": "Project Delivery Head"},
            ]

            # ---------------------------------------------------------
            # Load Role RID Map
            # ---------------------------------------------------------
            with DBPool.get_connection_mainDB() as conn:
                with conn.cursor() as cur:
                    role_tbl = self.get_public_table(config.KEY_CONTACTS_ROLE_TABLE)
                    cur.execute(f"""
                        SELECT LOWER(TRIM(role_name)), rid
                        FROM {role_tbl}
                        WHERE entity_type='Project'
                        AND role_status='active'
                    """)
                    role_map = {r[0]: r[1] for r in cur.fetchall()}

            # ---------------------------------------------------------
            # Normalize Incoming Contacts
            # ---------------------------------------------------------
            contact_dfs = []
            for m in role_mappings:
                role_rid = role_map.get(m["role_name"].lower())
                if not role_rid:
                    continue

                is_poc = m["role_name"].strip().lower() == "project point of contact"

                contact_dfs.append(
                    df.select(
                        F.col("project_fiscal_rid").alias("entity_rid"),
                        F.col("project_code"),
                        F.col(m["input_name_col"]).alias("key_contact_name"),
                        F.col(m["input_email_col"]).alias("key_contact_email"),
                        F.lit(role_rid).alias("key_contact_role"),
                        F.lit(True).alias("is_primary_contact"),
                        F.lit(is_poc).alias("include_in_communication"),
                        F.lit(not is_poc).alias("interaction_cc_recipient"),
                    )
                )

            key_contact_df = (
                reduce(DataFrame.unionByName, contact_dfs)
                .filter(
                    F.col("key_contact_name").isNotNull() &
                    F.col("key_contact_email").isNotNull()
                )
                .withColumn("email_norm", F.lower(F.trim("key_contact_email")))
                .withColumn("name_norm", F.lower(F.trim("key_contact_name")))
                # 🔑 CRITICAL FIX
                .withColumn(
                    "contact_identity",
                    F.coalesce(F.col("entity_rid"), F.col("project_code"))
                )
                .dropDuplicates([
                    "contact_identity",
                    "key_contact_role",
                    "email_norm",
                    "name_norm"
                ])
            )

            # ---------------------------------------------------------
            # If key contact table does not exist → all inserts
            # ---------------------------------------------------------
            if not self._check_table_exists(table_name):
                logger.warning("⚠️ Key contact table not found – treating all as inserts")
                return (
                    key_contact_df.drop("email_norm", "name_norm", "contact_identity"),
                    self.spark.createDataFrame([], key_contact_df.schema),
                    self.spark.createDataFrame([], StructType([])),
                )

            # ---------------------------------------------------------
            # Load Existing Contacts
            # ---------------------------------------------------------
            existing_df = self.spark.read.format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", f"""
                    (
                        SELECT entity_rid, key_contact_name, key_contact_email,
                            key_contact_role, is_primary_contact,
                            include_in_communication, interaction_cc_recipient,
                            modified_datetime
                        FROM {table_name}
                    ) t
                """) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .withColumn("email_norm", F.lower(F.trim("key_contact_email"))) \
                .withColumn("name_norm", F.lower(F.trim("key_contact_name"))) \
                .withColumn("contact_identity", F.col("entity_rid"))

            # Deduplicate existing history
            w = Window.partitionBy(
                "contact_identity", "key_contact_role", "email_norm", "name_norm"
            ).orderBy(F.col("modified_datetime").desc_nulls_last())

            existing_df = (
                existing_df.withColumn("rn", F.row_number().over(w))
                        .filter("rn = 1")
                        .drop("rn")
            )

            # ---------------------------------------------------------
            # INSERTS
            # ---------------------------------------------------------
            inserts = (
                key_contact_df.alias("new")
                .join(
                    existing_df.select(
                        "contact_identity",
                        "key_contact_role",
                        "email_norm",
                        "name_norm"
                    ).alias("old"),
                    on=[
                        F.col("new.contact_identity") == F.col("old.contact_identity"),
                        F.col("new.key_contact_role") == F.col("old.key_contact_role"),
                        F.col("new.email_norm") == F.col("old.email_norm"),
                        F.col("new.name_norm") == F.col("old.name_norm"),
                    ],
                    how="left_anti"
                )
                .drop("email_norm", "name_norm", "contact_identity")
            )

            # ---------------------------------------------------------
            # UPDATES (real changes only)
            # ---------------------------------------------------------
            updates_new = (
                key_contact_df.alias("new")
                .join(
                    existing_df.alias("old"),
                    on=[
                        F.col("new.contact_identity") == F.col("old.contact_identity"),
                        F.col("new.key_contact_role") == F.col("old.key_contact_role"),
                        F.col("new.email_norm") == F.col("old.email_norm"),
                        F.col("new.name_norm") == F.col("old.name_norm"),
                    ],
                    how="inner"
                )
                .filter(
                    (F.col("new.is_primary_contact") != F.col("old.is_primary_contact")) |
                    (F.col("new.include_in_communication") != F.col("old.include_in_communication")) |
                    (F.col("new.interaction_cc_recipient") != F.col("old.interaction_cc_recipient"))
                )
                .select(
                    "new.entity_rid",
                    "new.key_contact_role",
                    "new.key_contact_name",
                    "new.key_contact_email",
                    "new.is_primary_contact",
                    "new.include_in_communication",
                    "new.interaction_cc_recipient",
                    F.col("old.key_contact_name").alias("old_key_contact_name"),
                    F.col("old.key_contact_email").alias("old_key_contact_email"),
                    F.col("old.is_primary_contact").alias("old_is_primary_contact"),
                    F.col("old.include_in_communication").alias("old_include_in_communication"),
                    F.col("old.interaction_cc_recipient").alias("old_interaction_cc_recipient"),
                )
            )

            # ---------------------------------------------------------
            # DEMOTIONS
            # ---------------------------------------------------------
            demotions = updates_new.select(
                "entity_rid",
                "key_contact_role",
                F.col("old_key_contact_name").alias("key_contact_name"),
                F.col("old_key_contact_email").alias("key_contact_email"),
                F.lit(False).alias("is_primary_contact"),
                F.lit(False).alias("include_in_communication"),
                F.lit(True).alias("interaction_cc_recipient"),
                "old_key_contact_name",
                "old_key_contact_email",
                "old_is_primary_contact",
                "old_include_in_communication",
                "old_interaction_cc_recipient",
            )

            updates = updates_new.unionByName(demotions)

            # ---------------------------------------------------------
            # CHANGE LOG – ONLY REAL CHANGES
            # ---------------------------------------------------------
            changes = (
                updates.select(
                    "entity_rid",
                    "key_contact_role",
                    F.lit("contact_update").alias("attribute_name"),
                    F.concat_ws(" / ", "old_key_contact_name", "old_key_contact_email").alias("old_value"),
                    F.concat_ws(" / ", "key_contact_name", "key_contact_email").alias("new_value"),
                )
                .filter(F.col("old_value") != F.col("new_value"))
            )

            return inserts, updates, changes

        except Exception:
            logger.error("❌ Key contact change detection failed", exc_info=True)
            raise




    def format_value(self, col_name, col_type, prefix="", is_old=True):
        """Helper function to format values consistently based on their type"""
        col_ref = f"{prefix}.{col_name}"
        
        if isinstance(col_type, (DateType, TimestampType)):
            return F.date_format(F.col(col_ref), "yyyy-MM-dd")
        elif isinstance(col_type, (DecimalType, DoubleType, FloatType)):
            return F.format_number(F.col(col_ref).cast(DecimalType(18,2)), 2)
        elif isinstance(col_type, IntegerType):
            return F.format_number(F.col(col_ref).cast(DecimalType(18,2)), 0)
        elif isinstance(col_type, BooleanType):
            return F.when(F.col(col_ref), "true").otherwise("false")
        else:
            return F.col(col_ref)

    def _check_table_exists(self, table_name: str) -> bool:
        """Check if a table exists in the database."""
        try:
            # Use information_schema to check table existence
            query = f"""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = '{table_name.split('.')[-1]}'
            )
            """
            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query)
                    return cursor.fetchone()[0]
        except Exception as e:
            logger.warning(f"Table existence check failed: {str(e)}")
            return False

    def _execute_fiscal_operations(
        self,
        inserts: DataFrame,
        updates: DataFrame,
        entity_type: str,
        table_name: str,
        modified_by: str,
        account_rid: str,
        account_r_number: str,
        document_rid: str,
        changed_records_df: DataFrame
    ) -> None:
        """
        Execute DB operations:
        - Inserts (append)
        - Updates (bulk from staging)
        - History insert using changed_records_df (already computed)
        - Update cases using changed_records_df (calls update_cases_from_changed_records)

        Assumptions:
        - changed_records_df already contains: entity_rid, fiscal_year, attribute_name, old_value, new_value
        - this function must NOT re-compute changed_records
        """
        temp_tables = []
        actual_table_name = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
        actual_project_resource_table_name = self.get_tenant_table(account_r_number, config.PROD_PROJECT_RESOURCE_FISCAL_TABLE)
        # Ensure changed_records is a Spark DataFrame and attach account_rid
        changed_records = changed_records_df
        if changed_records is not None and not changed_records.rdd.isEmpty():
            changed_records = changed_records.withColumn("account_rid", F.lit(account_rid))
            logger.info("Using provided changed_records_df (sample):")
        else:
            changed_records = None
            logger.info("No changed_records provided or empty.")

        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                try:
                    # ---------------------------------------------------------
                    # INSERT RECORDS
                    # ---------------------------------------------------------
                    if inserts is not None and not inserts.rdd.isEmpty():
                        inserts.persist(StorageLevel.MEMORY_AND_DISK)
                        try:
                            inserts = inserts.withColumn(
                                "rid",
                                F.concat(F.lit(Constants.Database.UUID_PREFIX + "-"), F.expr("uuid()"))
                            )
                            record_count = inserts.count()
                            num_partitions = self.get_partition_count(record_count)
                            inserts = inserts.repartition(num_partitions)
                            logger.info(f"Inserting {record_count} records into {table_name}...")
                            inserts.write \
                                .format("jdbc") \
                                .option("url", config.ENTITY_DB_URL) \
                                .option("dbtable", table_name) \
                                .option("user", config.ENTITY_DB_USER) \
                                .option("password", settings.ENTITY_DB_PASSWORD) \
                                .option("driver", config.ENTITY_DB_DRIVER) \
                                .option("stringtype", "unspecified") \
                                .option("batchsize", 100) \
                                .mode("append") \
                                .save()

                            logger.info(f"Inserted {record_count} records")

                            # -------------------------------------------------
                            # EXISTING: Project fiscal timeline logging
                            # -------------------------------------------------
                            if entity_type == "project" and table_name == actual_table_name:
                                ref_columns = ["project_rid", "account_rid", "fiscal_year"]
                                inserted_refs = inserts.select(*ref_columns).distinct().collect()

                                if inserted_refs:
                                    where_conditions = " OR ".join(
                                        [" AND ".join([f"{col} = '{row[col]}'" for col in ref_columns])
                                        for row in inserted_refs]
                                    )

                                    fetch_query = f"""
                                        SELECT {', '.join(ref_columns)}, rid
                                        FROM {table_name}
                                        WHERE {where_conditions}
                                    """

                                    inserted_records = (
                                        self.spark.read
                                        .format("jdbc")
                                        .option("url", config.ENTITY_DB_URL)
                                        .option("query", fetch_query)
                                        .option("user", config.ENTITY_DB_USER)
                                        .option("password", settings.ENTITY_DB_PASSWORD)
                                        .option("driver", config.ENTITY_DB_DRIVER)
                                        .load()
                                    )
                                    logger.info("proceeding for log entity insert event")
                                    event_type_rid = self.get_event_type_rid(event_type_name="etl", entity_type=entity_type)
                                    self.log_entity_event_spark(
                                        df=inserted_records,
                                        account_rid=account_rid,
                                        account_r_number=account_r_number,
                                        event_name="created",
                                        event_type_rid=event_type_rid,
                                        event_status="success",
                                        entity_type=entity_type,
                                        rid_column="rid",
                                        document_id=document_rid,
                                        created_by=modified_by,
                                        modified_by=modified_by
                                    )

                            # -------------------------------------------------
                            # NEW: Handle case_project_resource for fiscal inserts
                            # -------------------------------------------------
                            if entity_type == "project_resource":

                                logger.info(f"[{entity_type}] Processing case mappings for fiscal inserted records...")

                                # -------------------------------
                                # Load CASE_PROJECT
                                # -------------------------------
                                case_project_table = self.get_tenant_table(
                                    account_r_number, config.CASE_PROJECTS_TABLE
                                )
                                if not self.table_exists_pg(case_project_table):
                                    logger.warning(f"CASE_PROJECT table {case_project_table} does not exist. Skipping case insert.")
                                    return

                                case_project_df = (
                                    self.spark.read.format("jdbc")
                                    .option("url", config.ENTITY_DB_URL)
                                    .option("dbtable", case_project_table)
                                    .option("user", config.ENTITY_DB_USER)
                                    .option("password", settings.ENTITY_DB_PASSWORD)
                                    .option("driver", config.ENTITY_DB_DRIVER)
                                    .load()
                                    .select(
                                        F.col("rid").alias("case_project_rid"),
                                        "case_rid",
                                        "project_fiscal_rid"
                                    )
                                )
                                # -------------------------------
                                # Load CASES
                                # -------------------------------
                                cases_table = self.get_tenant_table(account_r_number, config.CASES_TABLE)
                                if not self.table_exists_pg(cases_table):
                                    logger.warning(f"CASES table {cases_table} does not exist. Skipping case insert.")
                                    return

                                closed_status_rid = self.get_case_status_rid("Closed")

                                cases_df = (
                                    self.spark.read.format("jdbc")
                                    .option("url", config.ENTITY_DB_URL)
                                    .option("dbtable", cases_table)
                                    .option("user", config.ENTITY_DB_USER)
                                    .option("password", settings.ENTITY_DB_PASSWORD)
                                    .option("driver", config.ENTITY_DB_DRIVER)
                                    .load()
                                    .select(
                                        F.col("rid").alias("case_rid"),
                                        F.col("status_rid").alias("case_status_rid")
                                    )
                                )
                                # -------------------------------
                                # Project Fiscal RID matches from inserts
                                # Keep all insert_df columns
                                # -------------------------------
                                fiscal_df = (
                                    inserts
                                    .withColumn("project_resource_fiscal_rid", F.col("rid"))
                                    .drop("rid")
                                )
                                inserted_rids = [row["project_resource_fiscal_rid"] for row in fiscal_df.select("project_resource_fiscal_rid").collect()]
                                prod_pr_fiscal_table = self.get_tenant_table(
                                    account_r_number,
                                    config.PROD_PROJECT_RESOURCE_FISCAL_TABLE
                                )
                                rid_list = ",".join([f"'{x}'" for x in inserted_rids])

                                subquery = (
                                    f"(SELECT rid, r_number "
                                    f"FROM {prod_pr_fiscal_table} "
                                    f"WHERE rid IN ({rid_list})) AS sub"
                                )

                                inserted_fiscal_prod_df = (
                                    self.spark.read.format("jdbc")
                                        .option("url", config.ENTITY_DB_URL)
                                        .option("dbtable", subquery)
                                        .option("user", config.ENTITY_DB_USER)
                                        .option("password", settings.ENTITY_DB_PASSWORD)
                                        .option("driver", config.ENTITY_DB_DRIVER)
                                        .load()
                                )
                                joined_df = (
                                    fiscal_df.alias("f")
                                        .join(
                                            inserted_fiscal_prod_df.alias("p"),
                                            F.col("f.project_resource_fiscal_rid") == F.col("p.rid"),
                                            "inner"
                                        )
                                        .drop(F.col("p.rid"))  # drop duplicate rid
                                )
                                # -------------------------------
                                # Join → CASE_PROJECT → CASES
                                # -------------------------------
                                mapped_case_df = (
                                    joined_df
                                    .join(case_project_df, "project_fiscal_rid", "inner")
                                    .join(cases_df, "case_rid", "inner")
                                    .filter(F.col("case_status_rid") != closed_status_rid)
                                )

                                # Cleanup unwanted columns
                                drop_cols = ["case_status_rid"]
                                for c in drop_cols:
                                    if c in mapped_case_df.columns:
                                        mapped_case_df = mapped_case_df.drop(c)

                                # FIX fiscal year type
                                if "fiscal_year" in mapped_case_df.columns:
                                    mapped_case_df = mapped_case_df.withColumn(
                                        "fiscal_year", F.col("fiscal_year").cast("int")
                                    )

                                # ---------------------------------------
                                # CAST all numeric columns correctly
                                # ---------------------------------------
                                numeric_cols = [
                                    "total_hours_pro_res",
                                    "total_cost_pro_res",
                                    "net_total_cost_pro_res",
                                    "total_hours_from_tasks",
                                    "total_cost_from_tasks",
                                    "total_cost_from_tasks_blended",
                                    "qre_percent",
                                    "qre_fte",
                                    "qre_subcon",
                                    "qre_nonlabor",
                                    "qre_final"
                                ]

                                for col_name in numeric_cols:
                                    if col_name in mapped_case_df.columns:
                                        mapped_case_df = mapped_case_df.withColumn(
                                            col_name,
                                            F.col(col_name).cast("decimal(18,2)")
                                        )


                                if mapped_case_df.rdd.isEmpty():
                                    logger.info(f"[{entity_type}] No active cases found — skipping case mapping.")
                                    return

                                # -------------------------------
                                # Target table = case_project_resource_fiscal
                                # -------------------------------
                                target_table = self.get_tenant_table(
                                    account_r_number, config.CASE_PROJECT_RESOURCE_FISCAL_TABLE
                                )
                                if not self.table_exists_pg(target_table):
                                    logger.warning(f"{target_table} does not exist. Skipping case insert.")
                                    return

                                # -------------------------------
                                # Build final insert rows
                                # Keep ALL fiscal_df columns + add case fields
                                # -------------------------------
                                case_insert_df = (
                                    mapped_case_df
                                    .withColumn(
                                        "rid",
                                        F.concat(
                                            F.lit(Constants.Database.UUID_PREFIX + "-"),
                                            F.expr("uuid()")
                                        )
                                    )
                                )

                                logger.info(
                                    f"[{entity_type}] Inserting {case_insert_df.count()} rows into {target_table}"
                                )
                                case_insert_df.write \
                                    .format("jdbc") \
                                    .mode("append") \
                                    .option("url", config.ENTITY_DB_URL) \
                                    .option("dbtable", target_table) \
                                    .option("user", config.ENTITY_DB_USER) \
                                    .option("password", settings.ENTITY_DB_PASSWORD) \
                                    .option("driver", config.ENTITY_DB_DRIVER) \
                                    .option("batchsize", 500) \
                                    .save()

                                logger.info(f"[{entity_type}] Case mapping insert completed.")


                        except Exception as e:
                            conn.rollback()
                            logger.error(f"Insert operation failed: {e}", exc_info=True)
                            raise
                        finally:
                            inserts.unpersist()

                    # -------------------------
                    # UPDATES (bulk via staging) and HISTORY
                    # -------------------------
                    if updates is not None and not updates.rdd.isEmpty():
                        updates.persist(StorageLevel.MEMORY_AND_DISK)
                        try:
                            logger.info("Processing updates with provided change tracking...")

                            # Use the provided changed_records (do not recompute)
                            if changed_records is None:
                                logger.info("No changed_records present; skipping updates & history.")
                                updates.unpersist()
                                return

                            # Prepare updates_df: select only relevant columns to write to staging
                            exclude_cols = {'rid', 'created_datetime', 'created_by', 'fiscal_year', 'account_rid', 'auto_send_ai_interaction', 'auto_access_rd', 'max_ai_interaction'}
                            # Determine join keys according to entity_type
                            if entity_type == "resource":
                                join_keys = ["resource_rid"]
                            elif entity_type == "project":
                                join_keys = ["project_rid"]
                            else:
                                join_keys = ["project_fiscal_rid", "resource_rid"]

                            update_columns = [c for c in updates.columns if c not in exclude_cols and c not in join_keys]
                            # ensure join keys and audit columns included
                            staging_select_cols = [*update_columns, *join_keys, "rid", "fiscal_year", "account_rid"]

                            updates_df = updates.select(*[F.col(c) for c in staging_select_cols])

                            # optional filter
                            if "project_code" in updates_df.columns:
                                updates_df = updates_df.filter(F.col("project_code").isNotNull())

                            # cast fiscal_year to int
                            updates_df = updates_df.withColumn("fiscal_year", F.col("fiscal_year").cast("int"))

                            # cast numeric columns
                            numeric_cols = [
                                "total_hours_pro_res", "total_cost_pro_res", "total_cost_from_tasks",
                                "total_effort_from_tasks", "total_hours_from_tasks", "total_effort_prj",
                                "total_cost_prj", "total_nonlabor_prj", "total_fte_prj", "total_subcon_prj",
                                "total_effort_fte_prj", "total_cost_fte_prj", "total_effort_subcon_prj",
                                "total_cost_subcon_prj", "total_cost_nonlabor_prj", "total_cost", "total_hours",
                                "total_effort", "total_cost_nonlabor", "total_effort_fte", "total_effort_subcon",
                                "blended_rate_fte", "blended_rate_subcon", "blended_rate", "experience_years",
                                "salary", "bonus", "effort_in_hrs", "resource_cost", "net_resource_cost",
                                "insurance", "deductions", "resource_total_experience",
                                "resource_total_experience_organization", "standard_rate"
                            ]
                            for col in numeric_cols:
                                if col in updates_df.columns:
                                    updates_df = updates_df.withColumn(col, F.col(col).cast("decimal(18,2)"))

                            # Write updates to staging
                            uid = uuid.uuid4().hex[:8]
                            staging_table = f"{table_name}_temp_{uid}"
                            temp_tables.append(staging_table)

                            updates_df.write \
                                .format("jdbc") \
                                .option("url", config.ENTITY_DB_URL) \
                                .option("dbtable", staging_table) \
                                .option("user", config.ENTITY_DB_USER) \
                                .option("password", settings.ENTITY_DB_PASSWORD) \
                                .option("driver", config.ENTITY_DB_DRIVER) \
                                .option("createTableColumnTypes", ", ".join([
                                    f"{f.name} {self.spark_to_postgres_type(f.name, f.dataType.simpleString())}"
                                    for f in updates_df.schema.fields
                                ])) \
                                .mode("overwrite") \
                                .save()

                            logger.info(f"[{entity_type}] Written {updates_df.count()} updates to staging {staging_table}")

                            # Build SET clause from update_columns (only columns we wrote to staging)
                            set_clause = ", ".join([f"{col}=s.{col}" for col in update_columns])

                            # Build where clause
                            if entity_type == "resource":
                                where_clause = "t.fiscal_year=s.fiscal_year AND t.account_rid=s.account_rid AND t.resource_rid=s.resource_rid"
                            elif entity_type == "project":
                                where_clause = "t.fiscal_year=s.fiscal_year AND t.account_rid=s.account_rid AND t.project_rid=s.project_rid"
                            else:
                                where_clause = "t.fiscal_year=s.fiscal_year AND t.account_rid=s.account_rid AND t.project_fiscal_rid=s.project_fiscal_rid AND t.resource_rid=s.resource_rid"

                            update_sql = f"""
                                UPDATE {table_name} t
                                SET {set_clause}
                                FROM {staging_table} s
                                WHERE {where_clause}
                            """

                            logger.info("Executing bulk update on main table.")
                            cursor.execute(update_sql)

                            # At this point main table updated. Now update linked cases (if project).
                            if entity_type == "project":
                                try:
                                    if table_name == actual_table_name:
                                        self.update_cases_from_changed_records(account_rid, changed_records, account_r_number, "project", modified_by)
                                    else:
                                        self.update_cases_from_changed_records(account_rid, changed_records, account_r_number, "project_region", modified_by)
                                except Exception as case_exc:
                                    # choose whether to fail or log and continue; here we log and re-raise to rollback whole transaction
                                    logger.error(f"Failed to update cases from changed records: {case_exc}", exc_info=True)
                                    raise
                            else:
                                try:
                                    if table_name == actual_project_resource_table_name:
                                        self.update_cases_from_changed_records(account_rid, changed_records, account_r_number, "project_resource_fiscal", modified_by)
                                except Exception as case_exc:
                                    # choose whether to fail or log and continue; here we log and re-raise to rollback whole transaction
                                    logger.error(f"Failed to update cases from changed records: {case_exc}", exc_info=True)
                                    raise

                            # Drop staging
                            cursor.execute(f"DROP TABLE IF EXISTS {staging_table}")
                            conn.commit()
                            logger.info(f"[{entity_type}] Bulk update committed and staging {staging_table} dropped.")

                            # log update event
                            if entity_type == "project" and table_name == actual_table_name:
                                event_type_rid = self.get_event_type_rid(event_type_name="etl", entity_type=entity_type)
                                self.log_entity_event_spark(
                                    df=updates_df,
                                    account_rid=account_rid,
                                    account_r_number=account_r_number,
                                    event_name="updated",
                                    event_type_rid=event_type_rid,
                                    event_status="success",
                                    entity_type=entity_type,
                                    rid_column="rid",
                                    document_id=document_rid,
                                    created_by=modified_by,
                                    modified_by=modified_by
                                )

                            # Insert history records (from provided changed_records)
                            if entity_type == "project" and table_name == actual_table_name and changed_records is not None:
                                history_table_name = self.get_tenant_table(account_r_number, config.PROD_PROJECT_HISTORY_TABLE)
                                if entity_type == "project":
                                    rid_col_name = "project_fiscal_rid"
                                elif entity_type == "resource":
                                    rid_col_name = "resource_fiscal_rid"
                                elif entity_type == "project_resource":
                                    rid_col_name = "project_resource_fiscal_rid"
                                else:
                                    rid_col_name = "entity_rid"   # fallback
                                history_df = changed_records.select(
                                    F.col(rid_col_name).alias("project_rid"),
                                    F.col("attribute_name"),
                                    F.col("old_value"),
                                    F.col("new_value"),
                                    F.current_timestamp().alias("modified_datetime"),
                                    F.current_timestamp().alias("created_datetime"),
                                    F.lit(modified_by).alias("created_by"),
                                    F.lit(modified_by).alias("modified_by"),
                                )
                                history_df.write \
                                    .format("jdbc") \
                                    .option("url", config.ENTITY_DB_URL) \
                                    .option("dbtable", history_table_name) \
                                    .option("user", config.ENTITY_DB_USER) \
                                    .option("password", settings.ENTITY_DB_PASSWORD) \
                                    .option("driver", config.ENTITY_DB_DRIVER) \
                                    .mode("append") \
                                    .save()
                                logger.info(f"[{entity_type}] Inserted {history_df.count()} history records into {history_table_name}")

                        except Exception as e:
                            conn.rollback()
                            logger.error(f"Update operation failed: {e}", exc_info=True)
                            raise
                        finally:
                            updates.unpersist()
                            if changed_records is not None:
                                try:
                                    changed_records.unpersist()
                                except Exception:
                                    pass

                except Exception as e:
                    conn.rollback()
                    logger.error(f"Database operation failed: {str(e)}", exc_info=True)
                    raise

                finally:
                    # cleanup any temp tables that remained
                    for temp in temp_tables:
                        try:
                            logger.info(f"Cleaning temp table: {temp}")
                            with DBPool.get_connection() as c2:
                                with c2.cursor() as cur2:
                                    cur2.execute(f"DROP TABLE IF EXISTS {temp};")
                                c2.commit()
                            logger.info(f"Dropped temp table {temp}")
                        except Exception as ce:
                            logger.error(f"Failed to drop temp table {temp}: {ce}", exc_info=True)

   
    def _execute_fiscal_operations_for_project(
        self,
        inserts: DataFrame,
        updates: DataFrame,
        entity_type: str,
        account_r_number: str,
        account_rid: str,
        document_id: str,
        table_name: str,
        history_table_name: str,
        modified_by: str,
        changed_records: DataFrame
    ) -> None:
        """Execute the appropriate database operations."""
        temp_tables = []
        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                try:
                    # Generate RIDs for inserts first
                    inserts = inserts.withColumn(
                        "rid",
                        F.concat(F.lit(Constants.Database.UUID_PREFIX + "-"), F.expr("uuid()"))
                    )
                
                    # Handle inserts
                    if inserts is not None and not inserts.rdd.isEmpty():
                        record_count = inserts.count()
                        num_partitions = self.get_partition_count(record_count)
                        inserts = inserts.repartition(num_partitions)
                        logger.info("Inserting records...")
                        try:
                            inserts.write \
                                .format("jdbc") \
                                .option("url", config.ENTITY_DB_URL) \
                                .option("dbtable", table_name) \
                                .option("user", config.ENTITY_DB_USER) \
                                .option("password", settings.ENTITY_DB_PASSWORD) \
                                .option("driver", config.ENTITY_DB_DRIVER) \
                                .option("stringtype", "unspecified") \
                                .option("batchsize", 100) \
                                .mode("append") \
                                .save()
                            logger.info(f"Inserted {inserts.count()} records")
                            # --- Fetch inserted records for logging ---
                            ref_columns = ["project_rid", "account_rid", "fiscal_year"]
                            inserted_refs = inserts.select(*ref_columns).distinct().collect()
                            if not inserted_refs:
                                logger.warning(f"[{entity_type}] No reference values collected after insert.")
                            else:
                                event_type_rid = self.get_event_type_rid(event_type_name="etl", entity_type=entity_type)
                                self.log_entity_event_spark(
                                    df=inserts,
                                    account_rid=account_rid,
                                    account_r_number=account_r_number,
                                    event_name="created",
                                    event_type_rid=event_type_rid,
                                    event_status="success",
                                    entity_type=entity_type,
                                    rid_column="rid",
                                    document_id=document_id,
                                    created_by=modified_by,
                                    modified_by=modified_by
                                )

                        except Exception as e:
                            conn.rollback()
                            logger.error(f"Database insert failed: {str(e)}")
                            raise

                    # Handle updates
                    if updates is not None and not updates.rdd.isEmpty():
                        try:
                            logger.info("Updating modified fields selectively...")
                            # Create a copy of updates for the staging operation
                            updates_for_staging = updates\
                                .withColumn("modified_by", F.lit(modified_by)) \
                                .withColumn("modified_datetime", F.lit(self.get_date_and_time())) \
                                .withColumn("fiscal_year", F.col("fiscal_year").cast("int")) 

                            uid = uuid.uuid4().hex[:8]
                            staging_table = f"{table_name}_temp_{uid}"
                            temp_tables.append(staging_table)
                            updates_for_staging.write \
                                .format("jdbc") \
                                .option("url", config.ENTITY_DB_URL) \
                                .option("dbtable", staging_table) \
                                .option("user", config.ENTITY_DB_USER) \
                                .option("password", settings.ENTITY_DB_PASSWORD) \
                                .option("driver", config.ENTITY_DB_DRIVER) \
                                .option(
                                    "createTableColumnTypes",
                                    ", ".join([
                                        f"{f.name} {self.spark_to_postgres_type(f.name, f.dataType.simpleString())}"
                                        for f in updates_for_staging.schema.fields
                                    ])
                                ) \
                                .mode("overwrite") \
                                .save()
                            # updates_for_staging.show()
                            logger.info(f"[{entity_type}] Written {updates_for_staging.count()} updates to staging table {staging_table}")
                            # ✅ Build dynamic SET clause
                            update_columns = [c for c in updates_for_staging.columns if c not in {"rid", "created_datetime", "created_by", "auto_send_ai_interaction", "auto_access_rd", "max_ai_interaction"}]
                            logger.info(f"update_columns-{update_columns}")
                            set_clause = ", ".join([f"{col}=s.{col}" for col in update_columns])

                            # ✅ Entity-specific WHERE clause
                            if entity_type == "resource":
                                where_clause = "t.fiscal_year=s.fiscal_year AND t.account_rid=s.account_rid AND t.resource_rid=s.resource_rid"
                            elif entity_type == "project":
                                where_clause = "t.fiscal_year=s.fiscal_year AND t.account_rid=s.account_rid AND t.project_rid=s.project_rid"
                            else:  # project_resource
                                where_clause = "t.fiscal_year=s.fiscal_year AND t.account_rid=s.account_rid AND t.project_fiscal_rid=s.project_fiscal_rid AND t.resource_rid=s.resource_rid"

                            # ✅ Run one bulk update
                            update_sql = f"""
                                UPDATE {table_name} t
                                SET {set_clause}
                                FROM {staging_table} s
                                WHERE {where_clause}
                            """
                            drop_staging_sql = f"DROP TABLE IF EXISTS {staging_table}"

                            cursor.execute(update_sql)

                            logger.info(f"✅ Bulk updated {updates.count()} records in {table_name}")
                            try:
                                # update cases (only those not closed) using staging s (which contains the updated values)
                                self.update_cases_from_changed_records(account_rid, changed_records, account_r_number, "project", modified_by)
                            except Exception as case_update_exc:
                                # If you prefer not to fail the whole transaction on case update, comment out the raise
                                logger.error(f"Error while updating cases from staging: {case_update_exc}", exc_info=True)
                                # Optional: choose to rollback and raise to stop everything
                                # conn.rollback()
                                # raise

                            # Now drop staging table (cleanup)
                            cursor.execute(drop_staging_sql)
                            conn.commit()
                            # ✅ Insert history records (if project) - USE PERSISTED changed_records
                            if entity_type == "project" and changed_records is not None and not changed_records.rdd.isEmpty():
                                logger.info(f"[{entity_type}] Inserting history records for {changed_records.count()} changed records")
                                
                                # Force materialization of changed_records
                                history_count = changed_records.count()
                                logger.info(f"History records to insert: {history_count}")
                                if "project_rid" in changed_records.columns:
                                    changed_records = changed_records.drop("project_rid")
                                history_df = changed_records.select(
                                    F.col("project_fiscal_rid").alias("project_rid"),
                                    F.col("attribute_name"),
                                    F.col("old_value"),
                                    F.col("new_value"),
                                    F.current_timestamp().alias("modified_datetime"),
                                    F.current_timestamp().alias("created_datetime"),
                                    F.lit(modified_by).alias("created_by"),
                                    F.lit(modified_by).alias("modified_by"),
                                ).persist(StorageLevel.MEMORY_AND_DISK)  # Persist history_df too
                                
                                history_df.write \
                                    .format("jdbc") \
                                    .option("url", config.ENTITY_DB_URL) \
                                    .option("dbtable", history_table_name) \
                                    .option("user", config.ENTITY_DB_USER) \
                                    .option("password", settings.ENTITY_DB_PASSWORD) \
                                    .option("driver", config.ENTITY_DB_DRIVER) \
                                    .mode("append") \
                                    .save()

                                logger.info(f"[{entity_type}] Inserted {history_df.count()} history records into {history_table_name}")
                                event_type_rid = self.get_event_type_rid(event_type_name="etl", entity_type=entity_type)
                                self.log_entity_event_spark(
                                    df=updates,
                                    account_rid=account_rid,
                                    account_r_number=account_r_number,
                                    event_name="updated",
                                    event_type_rid= event_type_rid,
                                    event_status="success",
                                    entity_type=entity_type,
                                    rid_column="rid",
                                    document_id=document_id,
                                    created_by=modified_by,
                                    modified_by=modified_by
                                )
                                
                                history_df.unpersist()
                            else:
                                logger.warning(f"No history records to insert. entity_type: {entity_type}, changed_records empty: {changed_records is None or changed_records.rdd.isEmpty()}")

                        except Exception as e:
                            conn.rollback()
                            logger.error(f"Selective update failed: {e}")
                            raise
                        
                except Exception as e:
                    conn.rollback()
                    logger.error(f"Database operation failed: {str(e)}")
                    raise

                finally:
                    for temp in temp_tables:
                        try:
                            logger.info(f"🧹 Dropping temp table if exists: {temp}")
                            with DBPool.get_connection() as c2:
                                with c2.cursor() as cur2:
                                    cur2.execute(f"DROP TABLE IF EXISTS {temp};")
                                c2.commit()
                            logger.info(f"✔ Temp table {temp} dropped")
                        except Exception as ce:
                            logger.error(f"⚠ Failed to drop temp table {temp}: {ce}")
   
    def _insert_history_records(self, cursor, records, history_table):
        """Batch insert history records."""
        history_sql = f"""
            INSERT INTO {history_table} (
                project_rid, attribute_name, old_value, new_value,
                modified_datetime, created_datetime, created_by, modified_by
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.executemany(history_sql, records)
        logger.info(f"Inserted {len(records)} history records")

    def get_case_status_rid(self, status_name: str) -> Optional[str]:
        """Fetch the RID from the case_status table for the given status_name."""
        try:
            status_table = self.get_public_table(config.CASE_STATUS_TABLE)
            jdbc_options = {
                "url": config.MAIN_DB_URL,
                "user": config.MAIN_DB_USER,
                "password": settings.MAIN_DB_PASSWORD,
                "driver": config.ENTITY_DB_DRIVER
            }
            query = f"(SELECT rid FROM {status_table} WHERE status_name = '{status_name}' LIMIT 1) AS status_query"
            df = self.spark.read.format("jdbc").option("dbtable", query).options(**jdbc_options).load()
            row = df.first()
            return row["rid"] if row else None
        except Exception as e:
            logger.error(f"❌ Failed to fetch '{status_name}' case_status rid: {e}", exc_info=True)
            return None


    def update_cases_from_changed_records(
        self,
        account_rid: str,
        changed_records: DataFrame,
        account_r_number: str,
        entity_type: str,
        modified_by: str
    ):
        try:
            staging_table_created = False
            if changed_records is None or changed_records.rdd.isEmpty():
                logger.info("[case-update] No changed records. Skipping.")
                return

            logger.info(f"[case-update] Processing changed records for entity_type={entity_type}")

            CASE_MAPPING_RULES = {
                "project": {
                    "mapping_table": config.CASE_PROJECTS_TABLE,
                    "join_column": "project_fiscal_rid"
                },
                "project_region": {
                    "mapping_table": config.CASE_PROJECT_FISCAL_REGION_TABLE,
                    "join_column": "project_fiscal_region_rid"
                },
                "project_resource": {
                    "mapping_table": config.CASE_PROJECT_RESOURCE_TABLE,
                    "join_column": "project_resource_rid"
                },
                "project_resource_fiscal": {
                    "mapping_table": config.CASE_PROJECT_RESOURCE_FISCAL_TABLE,
                    "join_column": "project_resource_fiscal_rid"
                },
                "project_task": {
                    "mapping_table": config.CASE_PROJECT_TASK_TABLE,
                    "join_column": "project_task_rid"
                }
            }

            # ----------------------------
            # Type-casting maps
            # ----------------------------
            PROJECT_RESOURCE_DB_TYPES = {
                "fiscal_year": IntegerType(),
                "total_hours_pro_res": DecimalType(18, 2),
                "total_cost_pro_res": DecimalType(18, 2),
                "net_total_cost_pro_res": DecimalType(18, 2),
                "effort_project_resource_level": DecimalType(18, 2),
                "cost_project_resource_level": DecimalType(18, 2),
                "cost_project_task_level": DecimalType(18, 2),
                "blended_cost_project_task_level": DecimalType(18, 2),
                "blended_cost_project_resource_level": DecimalType(18, 2),
                "effort_project_task_level": DecimalType(18, 2),
                "total_hours_from_tasks": DecimalType(18, 2),
                "total_cost_from_tasks": DecimalType(18, 2),
                "total_cost_from_tasks_blended": DecimalType(18, 2),
                "rd_percent_potential_ai": DecimalType(18, 2),
                "rd_percent_adjustment": DecimalType(18, 2),
                "rd_percent_final": DecimalType(18, 2),
                "qre_fte": DecimalType(18, 2),
                "qre_subcon": DecimalType(18, 2),
                "qre_nonlabor": DecimalType(18, 2),
                "qre_final": DecimalType(18, 2),
                "qre_percent": DecimalType(5, 2),
                "rd_credits_fte_region_level": DecimalType(18, 2),
                "rd_credits_subcon_region_level": DecimalType(18, 2),
                "rd_credits_nonlabor_region_level": DecimalType(18, 2),
                "rd_credits_region_level": DecimalType(18, 2),
                "rd_credits_fte_fed_level": DecimalType(18, 2),
                "rd_credits_subcon_fed_level": DecimalType(18, 2),
                "rd_credits_nonlabor_fed_level": DecimalType(18, 2),
                "rd_credits_fed_level": DecimalType(18, 2),
                "rd_credits_total": DecimalType(18, 2),
                "salary": DecimalType(18, 2),
                "bonus": DecimalType(18, 2),
                "insurance": DecimalType(18, 2),
                "deductions": DecimalType(18, 2),
                "start_date": DateType(),
                "end_date" : DateType()
            }
            PROJECT_DB_TYPES = {
                # -------------------------
                # INTEGER COLUMNS
                # -------------------------
                "fiscal_year": IntegerType(),
                "max_ai_interaction": IntegerType(),
                "expiry_duration": IntegerType(),
                "total_fte_prj": IntegerType(),
                "total_fte_from_prj_res": IntegerType(),
                "total_fte_from_tasks": IntegerType(),
                "total_subcon_prj": IntegerType(),
                "total_subcon_from_prj_res": IntegerType(),
                "total_subcon_from_tasks": IntegerType(),
                "total_nonlabor_prj": IntegerType(),
                "total_nonlabor_from_tasks": IntegerType(),
                "total_resources_prj": IntegerType(),
                "total_resources_from_prj_res": IntegerType(),
                "total_resources_from_tasks": IntegerType(),
                "effective_total_fte": IntegerType(),
                "effective_total_subcon": IntegerType(),
                "effective_total_nonlabor": IntegerType(),

                # -------------------------
                # DECIMAL / NUMERIC (18,2)
                # -------------------------
                "total_nonlabor_from_prj_res": DecimalType(18, 2),
                "total_effort_prj": DecimalType(18, 2),
                "total_effort_fte_prj": DecimalType(18, 2),
                "total_effort_subcon_prj": DecimalType(18, 2),
                "total_effort_from_prj_res": DecimalType(18, 2),
                "total_effort_fte_from_prj_res": DecimalType(18, 2),
                "total_effort_subcon_from_prj_res": DecimalType(18, 2),
                "total_effort_from_tasks": DecimalType(18, 2),
                "total_effort_fte_from_tasks": DecimalType(18, 2),
                "total_effort_subcon_from_tasks": DecimalType(18, 2),

                "total_cost_prj": DecimalType(18, 2),
                "total_cost_fte_prj": DecimalType(18, 2),
                "total_cost_subcon_prj": DecimalType(18, 2),
                "total_cost_nonlabor_prj": DecimalType(18, 2),

                "total_cost_from_prj_res": DecimalType(18, 2),
                "total_cost_fte_from_prj_res": DecimalType(18, 2),
                "total_cost_subcon_from_prj_res": DecimalType(18, 2),
                "total_cost_nonlabor_from_prj_res": DecimalType(18, 2),

                "total_cost_from_tasks": DecimalType(18, 2),
                "total_cost_fte_from_tasks": DecimalType(18, 2),
                "total_cost_subcon_from_tasks": DecimalType(18, 2),

                "total_cost_prj_blended": DecimalType(18, 2),
                "total_cost_fte_prj_blended": DecimalType(18, 2),
                "total_cost_subcon_prj_blended": DecimalType(18, 2),

                "total_cost_from_prj_res_blended": DecimalType(18, 2),
                "total_cost_fte_from_prj_res_blended": DecimalType(18, 2),
                "total_cost_subcon_from_prj_res_blended": DecimalType(18, 2),

                "total_cost_from_tasks_blended": DecimalType(18, 2),
                "total_cost_fte_from_tasks_blended": DecimalType(18, 2),
                "total_cost_subcon_from_tasks_blended": DecimalType(18, 2),

                "blended_rate_fte": DecimalType(18, 2),
                "blended_rate_subcon": DecimalType(18, 2),

                "rd_percent_potential_ai": DecimalType(18, 2),
                "rd_percent_potential_ai_updated": DecimalType(18, 2),
                "rd_percent_adjustment": DecimalType(18, 2),
                "rd_percent_final": DecimalType(18, 2),

                "qre_fte": DecimalType(18, 2),
                "qre_subcon": DecimalType(18, 2),
                "qre_nonlabor": DecimalType(18, 2),
                "qre_final": DecimalType(18, 2),

                "rd_credits_fte_fed_level": DecimalType(18, 2),
                "rd_credits_subcon_fed_level": DecimalType(18, 2),
                "rd_credits_nonlabor_fed_level": DecimalType(18, 2),
                "rd_credits_fed_level": DecimalType(18, 2),
                "rd_credits_total": DecimalType(18, 2),

                "effective_cost": DecimalType(18, 2),
                "effective_effort": DecimalType(18, 2),
                "effective_fte_cost": DecimalType(18, 2),
                "effective_fte_effort": DecimalType(18, 2),
                "effective_subcon_cost": DecimalType(18, 2),
                "effective_subcon_effort": DecimalType(18, 2),
                "effective_nonlabor_cost": DecimalType(18, 2),

                "auto_send_ai_interaction": BooleanType(),
                "auto_access_rd" : BooleanType(),
                "is_rd_claim_qualified" : BooleanType(),
                "is_qualified" :  BooleanType(),
                "signoff": BooleanType(),

                "project_startdate" : DateType(),
                "project_enddate" : DateType()

            }
            if entity_type not in CASE_MAPPING_RULES:
                logger.error(f"[case-update] Unsupported entity_type={entity_type}")
                return

            mapping_info = CASE_MAPPING_RULES[entity_type]
            join_key = mapping_info["join_column"]
            mapping_table = self.get_tenant_table(account_r_number, mapping_info["mapping_table"])
            if not self.table_exists_pg(mapping_table):
                logger.warning(f"CASE_PROJECT table {mapping_table} does not exist. Skipping case update.")
                return
            cases_table = self.get_tenant_table(account_r_number, config.CASES_TABLE)
            closed_status_rid = self.get_case_status_rid("Closed")

            audit_columns = {
                "account_rid": account_rid,
                "modified_by": modified_by,
                "modified_datetime": self.get_date_and_time()
            }

            for c, v in audit_columns.items():
                if c not in changed_records.columns:
                    changed_records = changed_records.withColumn(c, F.lit(v))
                else:
                    changed_records = changed_records.withColumn(c, F.when(F.col(c).isNull(), F.lit(v)).otherwise(F.col(c)))

            pivot_df = (
                changed_records
                .groupBy(join_key, "account_rid", "modified_by", "modified_datetime")
                .pivot("attribute_name")
                .agg(F.first("new_value"))
            )
            # ---------------------------------------------------
            # 5. Type casting by entity type
            # ---------------------------------------------------
            try:
                if entity_type in ["project_resource", "project_resource_fiscal"]:
                    for col in pivot_df.columns:
                        if col in PROJECT_RESOURCE_DB_TYPES:
                            logger.info(f"[case-update] Casting column {col} → {PROJECT_RESOURCE_DB_TYPES[col]}")
                            pivot_df = pivot_df.withColumn(col, F.col(col).cast(PROJECT_RESOURCE_DB_TYPES[col]))

                if entity_type in ["project", "project_region"]:
                    for col in pivot_df.columns:
                        if col in PROJECT_DB_TYPES:
                            logger.info(f"[case-update] Casting column {col} → {PROJECT_DB_TYPES[col]}")
                            pivot_df = pivot_df.withColumn(col, F.col(col).cast(PROJECT_DB_TYPES[col]))

            except Exception as cast_err:
                logger.error(f"[case-update] ERROR while casting pivot_df: {cast_err}", exc_info=True)
                raise
            uid = uuid.uuid4().hex[:8]
            staging_table = f"{mapping_table}_temp_{uid}"
            pivot_df.write.format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", staging_table) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .mode("overwrite").save()
            staging_table_created = True
            update_columns = [c for c in pivot_df.columns if c not in {join_key, "account_rid"}]
            set_clause = ", ".join([f"{c}=s.{c}" for c in update_columns])

            sql = f"""
                UPDATE {mapping_table} t
                SET {set_clause}
                FROM {staging_table} s, {cases_table} c
                WHERE t.{join_key} = s.{join_key}
                AND t.account_rid = s.account_rid
                AND c.rid = t.case_rid
                AND c.account_rid = t.account_rid
                AND c.status_rid <> '{closed_status_rid}'
            """

            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:

                    # Log projects not mapped to any case
                    cursor.execute(f"""
                        SELECT s.{join_key}
                        FROM {staging_table} s
                        LEFT JOIN {mapping_table} t
                        ON t.{join_key} = s.{join_key}
                        AND t.account_rid = s.account_rid
                        WHERE t.{join_key} IS NULL
                    """)
                    for r in cursor.fetchall():
                        logger.info(f"[case-update] ❗ Skipped — {join_key} not mapped to any case_project: {r[0]}")

                    # Log CLOSED cases
                    cursor.execute(f"""
                        SELECT DISTINCT t.{join_key}, t.case_rid
                        FROM {mapping_table} t
                        JOIN {staging_table} s
                        ON t.{join_key} = s.{join_key}
                        AND t.account_rid = s.account_rid
                        JOIN {cases_table} c
                        ON c.rid = t.case_rid
                        AND c.account_rid = t.account_rid
                        WHERE c.status_rid = %s
                    """, (closed_status_rid,))
                    for pid, case_rid in cursor.fetchall():
                        logger.info(f"[case-update] ⛔ Skipped — project {pid} belongs to CLOSED case {case_rid}")

                    cursor.execute(sql)
                    cursor.execute(f"DROP TABLE IF EXISTS {staging_table}")
                    conn.commit()

            logger.info("✅ Bulk case update complete.")

        except Exception as e:
            logger.error(f"[case-update] FATAL ERROR: {e}", exc_info=True)
            raise
        finally:
            if staging_table_created:
                try:
                    with DBPool.get_connection() as cleanup_conn:
                        with cleanup_conn.cursor() as cleanup_cur:
                            cleanup_cur.execute(f"DROP TABLE IF EXISTS {staging_table}")
                            cleanup_conn.commit()
                    logger.info(f"[case-update] 🧹 Cleaned temp table {staging_table}")
                except Exception as cleanup_err:
                    logger.error(f"[case-update] ⚠️ Failed to cleanup temp table {staging_table}: {cleanup_err}")



    def table_exists_pg(self, full_table_name: str) -> bool:
        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT to_regclass(%s);", (full_table_name,))
                return cursor.fetchone()[0] is not None

    def apply_project_type_and_status(
        self,
        df: DataFrame,
        existing_df: DataFrame,
        fiscal_year: int
    ) -> DataFrame:
        """
        Apply project type + status logic correctly at ROW LEVEL.

        Rules:
        - New projects      → ACTIVE if type exists, else INACTIVE
        - Existing projects → map type + map status + inactive if type missing
        - Helper functions remain generic and unchanged
        """

        if df is None or df.rdd.isEmpty():
            return df

        active_status_rid = self.get_active_status_rid()
        inactive_status_rid = self.get_inactive_status_rid()

        key_col = "project_code"
        type_col = "project_type_rid"

        # --------------------------------------------------
        # CASE 1: No existing data at all → all are NEW
        # --------------------------------------------------
        if existing_df is None or existing_df.rdd.isEmpty():
            return self._apply_new_record_status(
                df,
                type_col=type_col,
                active_status_rid=active_status_rid,
                inactive_status_rid=inactive_status_rid
            )

        # --------------------------------------------------
        # CASE 2: Mixed data → detect NEW vs EXISTING (ROW LEVEL)
        # --------------------------------------------------
        join_cond = (
            (df[key_col] == existing_df[key_col]) &
            (df["account_rid"] == existing_df["account_rid"]) &
            (df["fiscal_year"] == existing_df["fiscal_year"])
        )

        joined = df.alias("new").join(
            existing_df.select(
                key_col,
                "account_rid",
                "fiscal_year"
            ).alias("old"),
            join_cond,
            "left"
        )

        new_rows = joined.filter(F.col(f"old.{key_col}").isNull()).select("new.*")
        existing_rows = joined.filter(F.col(f"old.{key_col}").isNotNull()).select("new.*")

        # --------------------------------------------------
        # NEW rows → new record status
        # --------------------------------------------------
        if not new_rows.rdd.isEmpty():
            new_rows = self._apply_new_record_status(
                new_rows,
                type_col=type_col,
                active_status_rid=active_status_rid,
                inactive_status_rid=inactive_status_rid
            )

        # --------------------------------------------------
        # EXISTING rows → map + apply rules
        # --------------------------------------------------
        if not existing_rows.rdd.isEmpty():
            existing_rows = self._map_type_from_existing(
                existing_rows,
                existing_df,
                key_col=key_col,
                type_col=type_col,
                fiscal_year=fiscal_year
            )

            existing_rows = self._map_status_from_existing(
                existing_rows,
                existing_df,
                key_col=key_col,
                fiscal_year=fiscal_year
            )

            existing_rows = self._apply_status_from_type(
                existing_rows,
                type_col=type_col,
                inactive_status_rid=inactive_status_rid,
                active_status_rid=active_status_rid
            )

        # --------------------------------------------------
        # Recombine and return
        # --------------------------------------------------
        if not new_rows.rdd.isEmpty() and not existing_rows.rdd.isEmpty():
            return new_rows.unionByName(existing_rows)
        elif not new_rows.rdd.isEmpty():
            return new_rows
        else:
            return existing_rows

    def upsert_fiscal_table_project_resource(self, df_with_rid: DataFrame, entity_type: str, account_r_number: str, fiscal_year: int, account_rid: str, modified_by: str, document_rid: str, parent_entity_type: Optional[str] = None):
        try:
            # df_with_rid.show()

            # Entity config with region_composite_keys
            entity_config = {
                "resource": {
                    "column_mapping": {
                        "region_rid": "country_region_rid"
                    },
                    "fiscal_columns": [
                        "resource_rid", "country_rid", "country_region_rid", "resource_code",
                        "resource_type_rid", "account_rid"
                    ],
                    "join_keys": ["resource_rid", "account_rid", "fiscal_year"],
                    "id_column": "resource_rid",
                    "region_composite_keys": ["resource_rid", "country_region_rid", "account_rid" , "fiscal_year"]
                },
                "project": {
                    "column_mapping": {
                        "total_effort": "total_effort_from_tasks",
                        "total_cost": "total_cost_from_tasks"
                    },
                    "fiscal_columns": [
                        "project_rid", "project_code", "account_rid", "project_name","project_type_rid",
                        "total_cost_from_tasks", "project_startdate", "project_enddate",
                        "total_effort_from_tasks", "region_rid", "country_rid", "currency_rid", "status_rid",
                        "auto_send_ai_interaction", "max_ai_interaction", "auto_access_rd"
                    ],
                    "join_keys": ["project_rid", "account_rid", "fiscal_year"],
                    "id_column": "project_rid",
                    "region_composite_keys": ["project_rid", "region_rid", "account_rid" , "fiscal_year"]
                },
                "project_resource": {
                    "column_mapping": {},
                    "fiscal_columns": [
                        "project_rid", "project_fiscal_rid", "resource_rid",
                        "total_hours_pro_res", "total_cost_pro_res", "currency_rid",
                        "country_rid", "region_rid", "status_rid", "account_rid"
                    ],
                    "join_keys": ["project_fiscal_rid", "resource_rid", "account_rid", "fiscal_year"],
                    "id_column": "resource_rid",
                    "region_composite_keys": ["region_rid", "project_fiscal_rid", "project_rid", "resource_rid", "account_rid" , "fiscal_year"]
                },
                "project_task": {
                    "column_mapping": {},
                    "fiscal_columns": [
                        "project_rid", "project_fiscal_rid", "resource_rid",
                        "total_hours_from_tasks", "total_cost_from_tasks", "currency_rid",
                        "country_rid", "region_rid", "status_rid", "account_rid"
                    ],
                    "join_keys": ["project_fiscal_rid","resource_rid", "account_rid", "fiscal_year"],
                    "id_column": "project_rid",
                    "region_composite_keys": ["region_rid", "project_fiscal_rid", "project_rid", "resource_rid", "account_rid" , "fiscal_year"]
                }
            }
            logger.info(f"entity_type - {entity_type}")
            logger.info(f"parent_entity_type - {parent_entity_type}")
            if entity_type == "project":
                config_data = entity_config["project"].copy()

                if parent_entity_type == "project_resource":
                    logger.info("entity_type - project from project_resource")
                    config_data["column_mapping"] = {
                        "total_effort": "total_effort_from_prj_res",
                        "total_cost": "total_cost_from_prj_res"
                    }
                    config_data["fiscal_columns"] = [
                        "project_rid", "project_code", "account_rid", "project_name", "project_type_rid",
                        "total_cost_from_prj_res", "project_startdate", "project_enddate",
                        "total_effort_from_prj_res", "region_rid", "country_rid", "currency_rid", "status_rid",
                        "auto_send_ai_interaction", "max_ai_interaction", "auto_access_rd"
                    ]

            elif entity_type == "project_resource":
                if parent_entity_type == "project_task":
                    logger.info("entity_type - project_resource from project_task")
                    config_data = entity_config["project_task"].copy()
                else:
                    config_data = entity_config.get(entity_type)

            else:
                config_data = entity_config.get(entity_type)


            if not config_data:
                raise ValueError(f"Unsupported entity type: {entity_type}")

            column_mapping = config_data["column_mapping"]
            fiscal_cols = config_data["fiscal_columns"]
            join_keys = config_data["join_keys"]
            id_column = config_data["id_column"]

            metadata_columns = {
                'created_datetime': self.get_date_and_time(),
                'created_by': modified_by,
                'fiscal_year': fiscal_year
            }

            for old_col, new_col in column_mapping.items():
                if old_col in df_with_rid.columns:
                    df_with_rid = df_with_rid.withColumnRenamed(old_col, new_col)
            df = df_with_rid.select([col(c) for c in fiscal_cols if c in df_with_rid.columns])
            for col_name, default_value in metadata_columns.items():
                if col_name not in df.columns:
                    df = df.withColumn(col_name, lit(default_value))
                else:
                    if col_name in ['created_datetime', 'created_by']:
                        df = df.withColumn(
                            col_name,
                            when(col(col_name).isNull(), lit(default_value)).otherwise(col(col_name))
                        )

            df = self._deduplicate_fiscal_data(df, entity_type)
            table_name = self._get_fiscal_table_name(entity_type, account_r_number)
            if entity_type in ["project_resource", "project_task"]:
                ids = df.select("project_fiscal_rid", "resource_rid").distinct().collect()
                if not ids:
                    logger.info("No valid IDs found - skipping processing")
                    return
                conditions = " OR ".join(
                    f"(project_fiscal_rid = '{row['project_fiscal_rid']}' AND resource_rid = '{row['resource_rid']}')" for row in ids
                )
                where_conditions = f"account_rid = '{account_rid}' AND fiscal_year = '{fiscal_year}' AND ({conditions})"
            else:
                ids = [row[id_column] for row in df.select(id_column).distinct().collect()]
                if not ids:
                    logger.info("No valid IDs found - skipping processing")
                    return
                id_list = ','.join(f"'{id}'" for id in ids)
                where_conditions = f"account_rid = '{account_rid}' AND fiscal_year = '{fiscal_year}' AND {id_column} IN ({id_list})"

            custom_query = f"(SELECT * FROM {table_name} WHERE {where_conditions}) AS filtered_table"
            logger.info(f"custom_query: {custom_query}")

            existing_df = (self.spark.read
                .format("jdbc")
                .option("url", config.ENTITY_DB_URL)
                .option("dbtable", custom_query)
                .option("user", config.ENTITY_DB_USER)
                .option("password", settings.ENTITY_DB_PASSWORD)
                .option("driver", config.ENTITY_DB_DRIVER)
                .load()
            )
            if entity_type == "project":
                df = self.apply_project_type_and_status(
                    df=df,
                    existing_df=existing_df,
                    fiscal_year=fiscal_year
                )

            if existing_df is None or existing_df.rdd.isEmpty():
                inserts = df.withColumn("modified_datetime", lit(None).cast("timestamp")) \
                            .withColumn("modified_by", lit(None).cast("string"))
                # inserts.show()
                self._execute_fiscal_operations(
                    inserts=inserts,
                    updates=None,
                    entity_type=entity_type,
                    table_name=table_name,
                    modified_by=modified_by,
                    account_rid = account_rid,
                    account_r_number = account_r_number,
                    document_rid = document_rid,
                    changed_records_df=None
                )
            else:
                # ---------------------------------------------------------
                # JOIN NEW + OLD USING JOIN KEYS
                # ---------------------------------------------------------
                join_conditions = [col(f"new.{k}") == col(f"old.{k}") for k in join_keys]

                joined = df.alias("new").join(
                    existing_df.alias("old"),
                    join_conditions,
                    "left"
                )

                # ---------------------------------------------------------
                # ALIAS ALL OLD + NEW COLUMNS PROPERLY
                # ---------------------------------------------------------
                joined_df = joined.select(
                    col("old.rid").alias("old_rid"),   # <-- IMPORTANT FIX

                    # old column aliases
                    *[
                        col(f"old.{c}").alias(f"old_{c}")
                        for c in df.columns
                        if c in existing_df.columns
                    ],

                    # new column aliases
                    *[
                        col(f"new.{c}").alias(f"new_{c}")
                        for c in df.columns
                    ]
                )
                # ------------------------------------------
                # CHANGE DETECTION USING ALIASED COLUMNS
                # ------------------------------------------
                def is_column_changed(field):
                    old_col = f"old_{field}"
                    new_col = f"new_{field}"

                    if old_col not in joined_df.columns or new_col not in joined_df.columns:
                        return False

                    sample = joined_df.select(old_col, new_col).filter(
                        col(new_col).isNotNull() &
                        (col(old_col).isNull() | (col(new_col) != col(old_col)))
                    ).limit(1).collect()

                    return bool(sample)
                changed_cols = [
                    c for c in df.columns
                    if c not in join_keys and c in existing_df.columns and is_column_changed(c)
                ]
                # Always exclude metadata
                exclude_cols = {"created_by", "created_datetime"}

                # Extra exclusions only for project entity_type
                if entity_type == "project":
                    exclude_cols.update({"country_rid", "region_rid", "currency_rid"})

                changed_cols = [c for c in changed_cols if c not in exclude_cols]

                # ------------------------------------------
                # BUILD changed_records_df
                # ------------------------------------------
                changed_records_list = []
                # Determine output column name for changed records
                if entity_type == "project":
                    rid_col_name = "project_fiscal_rid"
                elif entity_type == "resource":
                    rid_col_name = "resource_fiscal_rid"
                elif entity_type == "project_resource":
                    rid_col_name = "project_resource_fiscal_rid"
                else:
                    rid_col_name = "entity_rid"   # fallback
                for row in joined_df.collect():
                    rid = row["old_rid"]
                    if rid is None:
                        continue

                    for col_name in changed_cols:
                        old_val = row[f"old_{col_name}"]
                        new_val = row[f"new_{col_name}"]

                        if new_val is not None and new_val != old_val:
                            changed_records_list.append({
                                "rid": str(rid),                 # ALWAYS "rid"
                                "fiscal_year": int(fiscal_year),
                                "attribute_name": col_name,
                                "old_value": str(old_val) if old_val is not None else None,
                                "new_value": str(new_val)
                            })

                # ---- Build fixed schema ----
                schema = StructType([
                    StructField("rid", StringType(), True),
                    StructField("fiscal_year", IntegerType(), True),
                    StructField("attribute_name", StringType(), True),
                    StructField("old_value", StringType(), True),
                    StructField("new_value", StringType(), True),
                ])

                changed_records_df = (
                    self.spark.createDataFrame(changed_records_list, schema=schema)
                        .withColumnRenamed("rid", rid_col_name)    # ✔ DYNAMIC NAME APPLIED HERE
                    if changed_records_list else None
                )

                if changed_records_df is not None:
                    logger.info("changed records detected for this update.")
                else:
                    logger.info("No changed records detected for this update.")
                if changed_cols:
                    # Build update expressions using aliased new_ columns
                    update_exprs = [
                        col(f"new_{c}").alias(c)
                        for c in changed_cols
                    ]

                    # Ensure required keys appear in update df
                    required_update_keys = ["fiscal_year", "account_rid"]

                    if entity_type == "resource":
                        required_update_keys.append("resource_rid")
                    elif entity_type == "project":
                        required_update_keys.append("project_rid")
                    else:  # project_resource, project_task
                        required_update_keys.extend(["project_fiscal_rid", "resource_rid"])

                    for key in required_update_keys:
                        new_key = f"new_{key}"
                        if new_key in joined_df.columns:
                            update_exprs.append(col(new_key).alias(key))

                    # Add metadata
                    update_exprs.extend([
                        lit(self.get_date_and_time()).alias("modified_datetime"),
                        lit(modified_by).alias("modified_by")
                    ])

                    # -------------------------
                    # BUILD UPDATES DF
                    # -------------------------
                    updates = joined_df.filter(col("old_rid").isNotNull()).select(
                        col("old_rid").alias("rid"),
                        *update_exprs
                    )

                    # -------------------------
                    # BUILD INSERTS DF
                    # -------------------------
                    inserts = joined_df.filter(col("old_rid").isNull()).select(
                        *[
                            col(f"new_{c}").alias(c)
                            for c in df.columns
                        ],
                        lit(None).cast("timestamp").alias("modified_datetime"),
                        lit(None).cast("string").alias("modified_by")
                    )
                    # Execute
                    logger.info(
                        f"Calling _execute_fiscal_operations → "
                        f"entity_type={entity_type}, "
                        f"table_name={table_name}, "
                        f"account_rid={account_rid}, "
                        f"account_r_number={account_r_number}, "
                        f"document_rid={document_rid}"
                    )
                    self._execute_fiscal_operations(
                        inserts=inserts,
                        updates=updates,
                        entity_type=entity_type,
                        table_name=table_name,
                        modified_by=modified_by,
                        account_rid=account_rid,
                        account_r_number=account_r_number,
                        document_rid=document_rid,
                        changed_records_df=changed_records_df
                    )


            # Process region table
            logger.info(f"columns- {df.columns}")
            # choose first available column in priority order
            region_candidates = ["region_rid", "country_region_rid", "country_rid", "currency_rid"]

            region_col = next((c for c in region_candidates if c in df.columns), None)

            if not region_col:
                raise ValueError(f"No region-related column found in DataFrame. Columns: {df.columns}")

            logger.info(f"Using region column: {region_col}")

            region_df = (
                df.filter(
                    col(region_col).isNotNull() &
                    (trim(col(region_col)) != "")
                )
                .persist(StorageLevel.MEMORY_AND_DISK)
            )

            logger.info(f"region df count -: {region_df.count()}")

            if not region_df.rdd.isEmpty():
                self._upsert_region_table(
                    df=region_df,
                    entity_type=entity_type,
                    account_r_number=account_r_number,
                    fiscal_year=fiscal_year,
                    account_rid=account_rid,
                    modified_by=modified_by,
                    document_rid=document_rid,
                    region_col=region_col,
                    composite_keys=config_data.get("region_composite_keys")
                )
                self.upsert_account_fiscal_region( 
                    df_region=region_df,
                    account_r_number=account_r_number, 
                    account_rid=account_rid, 
                    fiscal_year=fiscal_year, 
                    modified_by=modified_by, 
                    entity_type=entity_type,
                    region_col=region_col
                )

            region_df.unpersist()

        except Exception as e:
            logger.error(f"Error in upsert_fiscal_table for {entity_type}: {str(e)}")
            raise e

    def upsert_account_fiscal_region(
        self,
        df_region: DataFrame,
        account_r_number: str,
        account_rid: str,
        fiscal_year: int,
        modified_by: str,
        entity_type: str,
        region_col: str
    ):
        from pyspark.sql import functions as F
        logger.info("🔁 Upserting account_fiscal_region...")

        table_name = self.get_tenant_table(account_r_number, config.ACCOUNT_FISCAL_REGION_TABLE)
        if region_col != "region_rid":
            df_region= df_region.withColumnRenamed(region_col,"region_rid")
        # Load existing rows for this account + fiscal year
        existing = self.spark.read.format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", table_name) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER).load() \
            .filter((F.col("account_rid") == account_rid) & (F.col("fiscal_year") == fiscal_year)) \
            .select("region_rid","fiscal_year","account_rid")

        existing = existing \
            .withColumnRenamed("region_rid", "existing_region_rid") \
            .withColumnRenamed("fiscal_year", "existing_fiscal_year") \
            .withColumnRenamed("account_rid", "existing_account_rid")

        joined = df_region.join(
            existing,
            (df_region.region_rid == existing.existing_region_rid) &
            (df_region.fiscal_year == existing.existing_fiscal_year) &
            (df_region.account_rid == existing.existing_account_rid),
            "left_outer"
        )

        # Inserts → only region_rid
        inserts = joined.filter(F.col("existing_region_rid").isNull()) \
                        .select("region_rid")

        # Updates → only region_rid
        updates = joined.filter(F.col("existing_region_rid").isNotNull()) \
                        .select("region_rid")
        # INSERT new rows
        if not inserts.rdd.isEmpty():
            logger.info(f"Inserting {inserts.count()} new rows into account_fiscal_region")
            inserts.withColumn("created_by", F.lit(modified_by)) \
                .withColumn("created_datetime", F.current_timestamp()) \
                .withColumn("account_rid", F.lit(account_rid)) \
                .withColumn("fiscal_year", F.lit(int(fiscal_year)).cast("int")) \
                .write.format("jdbc") \
                .mode("append") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", table_name) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER).save()

        # UPDATE existing rows (only audit + region_rid)
        if not updates.rdd.isEmpty():
            logger.info(f"Updating {updates.count()} existing rows in account_fiscal_region")
            for row in updates.collect():
                self.execute_sql_in_tenant(account_r_number, f"""
                    UPDATE {table_name}
                    SET region_rid = '{row.region_rid}',
                        modified_by = '{modified_by}',
                        modified_datetime = NOW()
                    WHERE account_rid = '{account_rid}'
                    AND fiscal_year = {fiscal_year}
                    AND region_rid = '{row.region_rid}';
                """)

        logger.info("✅ Account Fiscal Region upsert complete.")

    def _upsert_region_table(
        self,
        df: DataFrame,
        entity_type: str,
        account_r_number: str,
        fiscal_year: int,
        account_rid: str,
        modified_by: str,
        document_rid: str,
        region_col: str,
        composite_keys: list
    ):
        try:
            # ------------------------------------------
            # PREPARE DF
            # ------------------------------------------
            if df is not None and not df.rdd.isEmpty():
                df.persist(StorageLevel.MEMORY_AND_DISK)

            metadata_columns = {
                "created_datetime": self.get_date_and_time(),
                "created_by": modified_by,
                "fiscal_year": fiscal_year
            }

            for col_name, default_value in metadata_columns.items():
                if col_name not in df.columns:
                    df = df.withColumn(col_name, lit(default_value))
                else:
                    df = df.withColumn(
                        col_name,
                        when(col(col_name).isNull(), lit(default_value)).otherwise(col(col_name))
                    )

            if entity_type in ["project", "project_resource"]:
                df = self.map_fiscal_rid_with_data_by_rid(df, entity_type, account_r_number, fiscal_year)

            if entity_type == "project_resource" and "project_resource_rid" in df.columns:
                df = df.drop("project_resource_rid")

            df = self._deduplicate_fiscal_data(df, entity_type)

            table_name = self._get_fiscal_region_table_name(entity_type, account_r_number)

            # ------------------------------------------
            # COMPOSITE KEYS VALIDATION
            # ------------------------------------------
            if not composite_keys or not set(composite_keys).issubset(df.columns):
                logger.warning("Composite keys missing or invalid for region table.")
                return

            unique_rows = df.select(*composite_keys).distinct().collect()
            if not unique_rows:
                logger.info(f"No composite key records for {table_name}, skipping.")
                return

            or_conditions = " OR ".join([
                " AND ".join([f"{key} = '{row[key]}'" for key in composite_keys])
                for row in unique_rows
            ])
            where_conditions = f"account_rid='{account_rid}' AND fiscal_year='{fiscal_year}' AND ({or_conditions})"

            custom_query = f"(SELECT * FROM {table_name} WHERE {where_conditions}) as filtered_table"
            logger.info(f"Region Query: {custom_query}")

            # ------------------------------------------
            # READ EXISTING
            # ------------------------------------------
            existing_df = (
                self.spark.read
                .format("jdbc")
                .option("url", config.ENTITY_DB_URL)
                .option("dbtable", custom_query)
                .option("user", config.ENTITY_DB_USER)
                .option("password", settings.ENTITY_DB_PASSWORD)
                .option("driver", config.ENTITY_DB_DRIVER)
                .load()
            )
            if existing_df is not None and not existing_df.rdd.isEmpty():
                existing_df.persist(StorageLevel.MEMORY_AND_DISK)

            # ------------------------------------------
            # INSERT ONLY CASE
            # ------------------------------------------
            if existing_df is None or existing_df.rdd.isEmpty():
                logger.info(f"No region rows exist → performing inserts.")
                logger.info(
                    f"Calling _execute_fiscal_region_operations → "
                    f"entity_type={entity_type}, "
                    f"table_name={table_name}, "
                    f"account_rid={account_rid}, "
                    f"account_r_number={account_r_number}, "
                    f"document_rid={document_rid}"
                )
                return self._execute_fiscal_operations(
                    inserts=df,
                    updates=None,
                    entity_type=entity_type,
                    table_name=table_name,
                    modified_by=modified_by,
                    account_rid=account_rid,
                    account_r_number=account_r_number,
                    document_rid=document_rid,
                    changed_records_df=None
                )

            # ------------------------------------------
            # BUILD JOIN CONDITIONS
            # ------------------------------------------
            if entity_type == "resource":
                join_conditions = [
                    col(f"new.{k}") == col(f"old.{k}") for k in composite_keys
                ] + [
                    col("new.account_rid") == col("old.account_rid"),
                    col("new.fiscal_year") == col("old.fiscal_year"),
                    col("new.country_region_rid") == col("old.country_region_rid"),
                    col("new.resource_rid") == col("old.resource_rid")
                ]
            elif entity_type == "project":
                join_conditions = [
                    col(f"new.{k}") == col(f"old.{k}") for k in composite_keys
                ] + [
                    col("new.account_rid") == col("old.account_rid"),
                    col("new.fiscal_year") == col("old.fiscal_year"),
                    col("new.region_rid") == col("old.region_rid"),
                    col("new.project_rid") == col("old.project_rid")
                ]
            else:  # project_resource
                join_conditions = [
                    col(f"new.{k}") == col(f"old.{k}") for k in composite_keys
                ] + [
                    col("new.account_rid") == col("old.account_rid"),
                    col("new.fiscal_year") == col("old.fiscal_year"),
                    col("new.region_rid") == col("old.region_rid"),
                    col("new.project_fiscal_rid") == col("old.project_fiscal_rid"),
                    col("new.resource_rid") == col("old.resource_rid")
                ]

            joined_df = df.alias("new").join(existing_df.alias("old"), join_conditions, "left")

            # ------------------------------------------
            # SELECT MERGED COLUMNS
            # ------------------------------------------
            joined_df = joined_df.select(
                col("old.rid").alias("rid"),
                *[col(f"new.{c}").alias(c) for c in df.columns],
                *[col(f"old.{c}").alias(f"old_{c}") for c in df.columns]
            )

            # ------------------------------------------
            # DETECT CHANGED RECORDS → changed_records_df
            # ------------------------------------------
            changed_list = []
            if entity_type == "project":
                rid_col_name = "project_fiscal_region_rid"
            elif entity_type == "resource":
                rid_col_name = "resource_fiscal_region_rid"
            else:  # project_resource
                rid_col_name = "project_resource_fiscal_region_rid"
            def values_different(old_val, new_val):
                if old_val is None and new_val is None:
                    return False
                if old_val is None or new_val is None:
                    return True

                # Try numeric comparison
                try:
                    return float(old_val) != float(new_val)
                except:
                    # fallback to string compare
                    return str(old_val).strip() != str(new_val).strip()

            for row in joined_df.collect():
                rid = row["rid"]
                if rid is None:
                    continue

                for col_name in df.columns:
                    if col_name in ["created_by", "created_datetime"]:
                        continue

                    old_value = row[f"old_{col_name}"]
                    new_value = row[col_name]
                    
                    if new_value is None:
                        continue

                    if values_different(old_value, new_value):
                        changed_list.append({
                            rid_col_name: rid,
                            "fiscal_year": fiscal_year,
                            "attribute_name": col_name,
                            "old_value": str(old_value) if old_value is not None else None,
                            "new_value": str(new_value)
                        })

            changed_records_df = None
            if changed_list:

                schema = StructType([
                    StructField(rid_col_name, StringType(), True),
                    StructField("fiscal_year", StringType(), True),
                    StructField("attribute_name", StringType(), True),
                    StructField("old_value", StringType(), True),
                    StructField("new_value", StringType(), True),
                ])

                cleaned_rows = []
                for item in changed_list:
                    cleaned_rows.append({
                        rid_col_name: "" if item[rid_col_name] is None else str(item[rid_col_name]),
                        "fiscal_year": "" if item["fiscal_year"] is None else str(item["fiscal_year"]),
                        "attribute_name": "" if item["attribute_name"] is None else str(item["attribute_name"]),
                        "old_value": "" if item["old_value"] is None else str(item["old_value"]),
                        "new_value": "" if item["new_value"] is None else str(item["new_value"]),
                    })

                changed_records_df = self.spark.createDataFrame(cleaned_rows, schema=schema)
            if changed_records_df is not None:
                logger.info("changed records detected for this update.")
                # changed_records_df.show()
            else:
                logger.info("No changed records detected for this update.")

            if changed_records_df:
                logger.info(f"Region table changed_records count: {changed_records_df.count()}")

            # ------------------------------------------
            # BUILD INSERTS + UPDATES
            # ------------------------------------------
            updates = joined_df.filter(col("rid").isNotNull()) \
                .select(
                    col("rid"),
                    *[col(c) for c in df.columns]
                )

            inserts = joined_df.filter(col("rid").isNull()) \
                .select(
                    *[col(c) for c in df.columns],
                    lit(None).cast("timestamp").alias("modified_datetime"),
                    lit(None).cast("string").alias("modified_by")
                )
            # ------------------------------------------
            # EXECUTE WITH changed_records_df
            # ------------------------------------------
            logger.info(
                f"Calling _execute_fiscal_region_operations → "
                f"entity_type={entity_type}, "
                f"table_name={table_name}, "
                f"account_rid={account_rid}, "
                f"account_r_number={account_r_number}, "
                f"document_rid={document_rid}"
            )
            self._execute_fiscal_operations(
                inserts=inserts,
                updates=updates,
                entity_type=entity_type,
                table_name=table_name,
                modified_by=modified_by,
                account_rid=account_rid,
                account_r_number=account_r_number,
                document_rid=document_rid,
                changed_records_df=changed_records_df
            )

            if existing_df:
                existing_df.unpersist()
            if df:
                df.unpersist()

        except Exception as e:
            logger.error(f"Error in _upsert_region_table for {entity_type}: {str(e)}")
            raise


    def _deduplicate_fiscal_data(self, df: DataFrame, entity_type: str) -> DataFrame:
        from pyspark.sql.functions import to_date

        df = df.withColumn("fiscal_year", col("fiscal_year").cast("string"))

        if entity_type == "resource":
            df = df.withColumn("resource_code", trim(col("resource_code")))
            grouped_df = df.groupBy("region_rid", "fiscal_year")
            df = df.dropDuplicates(["resource_code", "fiscal_year"])
            logger.info(f"[{entity_type}_fiscal] ✅ Dropped duplicates on resource_code + fiscal_year")
            # df.show()

        elif entity_type == "project":
            df = df.withColumn("project_code", trim(col("project_code")))
            df = df.dropDuplicates(["project_code", "fiscal_year", "region_rid"])
            logger.info(f"[{entity_type}_fiscal] ✅ Dropped duplicates on project_code + fiscal_year")

        elif entity_type == "project_resource":
            df = df.withColumn("project_rid", trim(col("project_rid")))
            df = df.withColumn("project_fiscal_rid", trim(col("project_fiscal_rid")))
            df = df.withColumn("resource_rid", trim(col("resource_rid")))

            dedup_cols = [
                "account_rid",
                "project_fiscal_rid",
                "resource_rid",
                "fiscal_year"
            ]

            df = df.dropDuplicates(dedup_cols)
            logger.info(f"[{entity_type}_fiscal] ✅ Dropped duplicates on {dedup_cols}")
            # df.show()

        return df

    def _deduplicate_fiscal_region_data(self, df: DataFrame, entity_type: str) -> DataFrame:
        from pyspark.sql.functions import to_date

        df = df.withColumn("fiscal_year", col("fiscal_year").cast("string"))

        if entity_type == "resource":
            df = df.withColumn("resource_code", trim(col("resource_code")))
            region_col = "region_rid" if "region_rid" in df.columns else "country_region_rid"
            df = df.withColumn(region_col, trim(col(region_col)))

            # Deduplicate based on resource_code + region_rid + fiscal_year
            deduplicated_df = df.dropDuplicates(["resource_code", region_col, "fiscal_year"])
            logger.info(f"[{entity_type}_fiscal] ✅ Dropped duplicates on resource_code + fiscal_year")
            # deduplicated_df.show()

        elif entity_type == "project":
            df = df.withColumn("project_code", trim(col("project_code")))
            region_col = "region_rid" if "region_rid" in df.columns else "country_region_rid"
            df = df.withColumn(region_col, trim(col(region_col)))

            # Deduplicate based on resource_code + region_rid + fiscal_year
            deduplicated_df = df.dropDuplicates(["resource_code", region_col, "fiscal_year"])
            logger.info(f"[{entity_type}_fiscal] ✅ Dropped duplicates on resource_code + fiscal_year")
            # deduplicated_df.show()

        elif entity_type == "project_resource":
            df = df.withColumn("project_fiscal_rid", trim(col("project_rid")))
            df = df.withColumn("resource_rid", trim(col("resource_rid")))

            dedup_cols = [
                "account_rid",
                "project_fiscal_rid",
                "resource_rid",
                "fiscal_year",
                "region_rid"
            ]

            df = df.dropDuplicates(dedup_cols)
            logger.info(f"[{entity_type}_fiscal] ✅ Dropped duplicates on {dedup_cols}")
            # df.show()

        return deduplicated_df

    def update_project_totals_from_fiscal(self, account_r_number: str, account_rid: str, entity_type: str, modified_by: str = "system"):
        """Fetch project fiscal entries, aggregate totals, and update project table using BULK UPDATE."""
        try:
            logger.info("🔄 Starting project totals update from fiscal data...")
            temp_table = None
            # Get table names
            project_fiscal_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
            project_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_TABLE)

            # Mapping fiscal column → project column
            column_mapping = {
                "total_fte_prj": "total_fte",
                "total_subcon_prj": "total_subcon",
                "total_effort_prj": "total_effort",
                "total_cost_prj": "total_cost",
                "total_effort_fte_prj": "total_effort_fte",
                "total_effort_subcon_prj": "total_effort_subcon",
                "total_cost_fte_prj": "total_cost_fte",
                "total_cost_subcon_prj": "total_cost_subcon",
                "total_cost_nonlabor_prj": "total_cost_nonlabor"
            }

            fiscal_cols = list(column_mapping.keys())
            project_cols = list(column_mapping.values())

            # Read fiscal data
            logger.info(f"📖 Reading fiscal data from {project_fiscal_table} for account_rid={account_rid}")

            fiscal_df = (
                self.spark.read.format("jdbc")
                .option("url", config.ENTITY_DB_URL)
                .option("dbtable", project_fiscal_table)
                .option("user", config.ENTITY_DB_USER)
                .option("password", settings.ENTITY_DB_PASSWORD)
                .option("driver", config.ENTITY_DB_DRIVER)
                .load()
                .filter(col("account_rid") == account_rid)
            )

            if fiscal_df.rdd.isEmpty():
                logger.info("ℹ️ No fiscal data found for the specified account")
                return

            # 🧮 Aggregate totals (group by project)
            logger.info("🧮 Aggregating fiscal totals...")
            aggregated_df = fiscal_df.groupBy("account_rid", "project_code", "project_rid").agg(
                *[spark_sum(col(f)).alias(f) for f in fiscal_cols]
            )

            # Rename fiscal columns → project column names
            for fiscal_col, project_col in column_mapping.items():
                aggregated_df = aggregated_df.withColumnRenamed(fiscal_col, project_col)

            # Load project table
            logger.info(f"📖 Reading project data from {project_table}")
            projects_df = (
                self.spark.read.format("jdbc")
                .option("url", config.ENTITY_DB_URL)
                .option("dbtable", project_table)
                .option("user", config.ENTITY_DB_USER)
                .option("password", settings.ENTITY_DB_PASSWORD)
                .option("driver", config.ENTITY_DB_DRIVER)
                .load()
                .select("rid", "account_rid", "project_code")
            )

            # Join aggregated fiscal totals with project list
            logger.info("🔗 Joining fiscal totals with project list...")
            update_df = aggregated_df.join(
                projects_df,
                ["account_rid", "project_code"],
                "inner"
            ).select("rid", *project_cols)

            updates = update_df.collect()
            if not updates:
                logger.info("ℹ️ No matching projects found to update")
                return

            logger.info(f"📊 Found {len(updates)} projects to update with fiscal totals")

            # -----------------------------
            # 🚀 BULK UPDATE USING TEMP TABLE
            # -----------------------------
            temp_table = f"tmp_project_update_{account_rid.replace('-', '')}"

            create_temp_sql = f"""
                CREATE TEMP TABLE {temp_table} (
                    rid VARCHAR PRIMARY KEY,
                    total_fte NUMERIC,
                    total_subcon NUMERIC,
                    total_effort NUMERIC,
                    total_cost NUMERIC,
                    total_effort_fte NUMERIC,
                    total_effort_subcon NUMERIC,
                    total_cost_fte NUMERIC,
                    total_cost_subcon NUMERIC,
                    total_cost_nonlabor NUMERIC
                );
            """

            logger.info("🛠️ Creating temporary table for bulk update...")

            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:

                    # Create temp table
                    cursor.execute(create_temp_sql)

                    # Bulk insert data into temp table
                    logger.info("📥 Inserting aggregated data into temp table...")

                    insert_sql = f"""
                        INSERT INTO {temp_table} (
                            rid, total_fte, total_subcon, total_effort, total_cost,
                            total_effort_fte, total_effort_subcon, total_cost_fte,
                            total_cost_subcon, total_cost_nonlabor
                        ) VALUES %s
                    """

                    rows_to_insert = [
                        (
                            row.rid,
                            row.total_fte,
                            row.total_subcon,
                            row.total_effort,
                            row.total_cost,
                            row.total_effort_fte,
                            row.total_effort_subcon,
                            row.total_cost_fte,
                            row.total_cost_subcon,
                            row.total_cost_nonlabor
                        )
                        for row in updates
                    ]

                    execute_values(cursor, insert_sql, rows_to_insert)
                    conn.commit()

                    # One-shot update via join
                    logger.info("🔄 Running BULK UPDATE on project table...")

                    bulk_update_sql = f"""
                        UPDATE {project_table} p
                        SET
                            total_fte = t.total_fte,
                            total_subcon = t.total_subcon,
                            total_effort = t.total_effort,
                            total_cost = t.total_cost,
                            total_effort_fte = t.total_effort_fte,
                            total_effort_subcon = t.total_effort_subcon,
                            total_cost_fte = t.total_cost_fte,
                            total_cost_subcon = t.total_cost_subcon,
                            total_cost_nonlabor = t.total_cost_nonlabor
                        FROM {temp_table} t
                        WHERE p.rid = t.rid
                    """

                    cursor.execute(bulk_update_sql)
                    
                    conn.commit()

                    # After bulk update completes
                    drop_sql = f"DROP TABLE IF EXISTS {temp_table};"
                    cursor.execute(drop_sql)
                    conn.commit()
                    logger.info(f"🧹 Temp table {temp_table} dropped successfully.")


            logger.info(f"✅ Successfully bulk updated {len(updates)} projects using temp table!")
            return True

        except Exception as e:
            logger.error(f"❌ Error during project totals update: {str(e)}", exc_info=True)
            if 'conn' in locals():
                conn.rollback()
            raise
        finally:
            if temp_table:
                try:
                    logger.info(f"🧹 Cleaning temp table (if exists): {temp_table}")
                    with DBPool.get_connection() as conn:
                        with conn.cursor() as cursor:
                            cursor.execute(f"DROP TABLE IF EXISTS {temp_table};")
                            conn.commit()
                    logger.info(f"✅ Temp table {temp_table} dropped.")
                except Exception as cleanup_err:
                    logger.error(f"⚠️ Failed to drop temp table {temp_table}: {cleanup_err}")

    def update_project_region_totals_from_fiscal(self, account_r_number: str, account_rid: str, entity_type: str, modified_by: str = "system"):
        """Fetch project region-level fiscal entries, aggregate totals, and update region table using BULK UPDATE."""
        try:
            logger.info("🔄 Starting project region totals update...")
            temp_table = None
            project_fiscal_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
            project_fiscal_region_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_REGION_TABLE)

            column_mapping = {
                "total_fte_prj": "total_fte_prj",
                "total_subcon_prj": "total_subcon_prj",
                "total_effort_prj": "total_effort_prj",
                "total_cost_prj": "total_cost_prj",
                "total_effort_fte_prj": "total_effort_fte_prj",
                "total_effort_subcon_prj": "total_effort_subcon_prj",
                "total_cost_fte_prj": "total_cost_fte_prj",
                "total_cost_subcon_prj": "total_cost_subcon_prj",
                "total_cost_nonlabor_prj": "total_cost_nonlabor_prj"
            }

            fiscal_cols = list(column_mapping.keys())
            project_cols = list(column_mapping.values())

            # Read fiscal data
            logger.info(f"📖 Reading fiscal data from {project_fiscal_table}")

            fiscal_df = (
                self.spark.read.format("jdbc")
                .option("url", config.ENTITY_DB_URL)
                .option("dbtable", project_fiscal_table)
                .option("user", config.ENTITY_DB_USER)
                .option("password", settings.ENTITY_DB_PASSWORD)
                .option("driver", config.ENTITY_DB_DRIVER)
                .load()
                .filter(col("account_rid") == account_rid)
            )

            if fiscal_df.rdd.isEmpty():
                logger.info("ℹ️ No fiscal data found")
                return

            # Aggregate
            aggregated_df = fiscal_df.groupBy("account_rid", "rid", "region_rid", "fiscal_year").agg(
                *[spark_sum(col(c)).alias(c) for c in fiscal_cols]
            )

            # Rename fiscal → project cols
            for fiscal_col, project_col in column_mapping.items():
                aggregated_df = aggregated_df.withColumnRenamed(fiscal_col, project_col)

            # Load region table
            projects_df = (
                self.spark.read.format("jdbc")
                .option("url", config.ENTITY_DB_URL)
                .option("dbtable", project_fiscal_region_table)
                .option("user", config.ENTITY_DB_USER)
                .option("password", settings.ENTITY_DB_PASSWORD)
                .option("driver", config.ENTITY_DB_DRIVER)
                .load()
                .select("rid", "account_rid", "project_fiscal_rid", "fiscal_year")
            )

            aggregated_df = aggregated_df.withColumnRenamed("rid", "project_fiscal_rid")

            update_df = aggregated_df.join(
                projects_df,
                ["account_rid", "project_fiscal_rid", "fiscal_year"],
                "inner"
            ).select("rid", *project_cols)

            updates = update_df.collect()
            if not updates:
                logger.info("ℹ️ No matching region records found")
                return

            logger.info(f"📊 Preparing to bulk update {len(updates)} region records...")

            # --------------------------------------
            # 🔥 BULK UPDATE
            # --------------------------------------
            temp_table = f"tmp_region_update_{account_rid.replace('-', '')}"

            create_temp_sql = f"""
                CREATE TEMP TABLE {temp_table} (
                    rid VARCHAR PRIMARY KEY,
                    {', '.join([f'{col} NUMERIC' for col in project_cols])}
                );
            """

            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(create_temp_sql)

                    # Insert rows in bulk
                    insert_sql = f"""
                        INSERT INTO {temp_table} (rid, {', '.join(project_cols)})
                        VALUES %s
                    """
                    rows_to_insert = [
                        tuple([row.rid] + [getattr(row, c) for c in project_cols])
                        for row in updates
                    ]

                    execute_values(cursor, insert_sql, rows_to_insert)
                    conn.commit()

                    # Bulk update join
                    bulk_update_sql = f"""
                        UPDATE {project_fiscal_region_table} p
                        SET {', '.join([f'{c} = t.{c}' for c in project_cols])}
                        FROM {temp_table} t
                        WHERE p.rid = t.rid
                    """
                    cursor.execute(bulk_update_sql)
                    conn.commit()

                    # After bulk update completes
                    drop_sql = f"DROP TABLE IF EXISTS {temp_table};"
                    cursor.execute(drop_sql)
                    conn.commit()
                    logger.info(f"🧹 Temp table {temp_table} dropped successfully.")

            logger.info(f"✅ Successfully bulk updated {len(updates)} region totals!")
            return True

        except Exception as e:
            logger.error(f"❌ Error in region totals update: {str(e)}", exc_info=True)
            raise
        finally:
            if temp_table:
                try:
                    logger.info(f"🧹 Cleaning temp table (if exists): {temp_table}")
                    with DBPool.get_connection() as conn:
                        with conn.cursor() as cursor:
                            cursor.execute(f"DROP TABLE IF EXISTS {temp_table};")
                            conn.commit()
                    logger.info(f"✅ Temp table {temp_table} dropped.")
                except Exception as cleanup_err:
                    logger.error(f"⚠️ Failed to drop temp table {temp_table}: {cleanup_err}")

    def update_project_summary_from_fiscal_summary(self, account_r_number: str, account_rid: str, entity_type: str, modified_by: str = "system"):
        """Fetch project summary fiscal entries and bulk update project summary."""
        try:
            logger.info("🔄 Starting project summary bulk update...")
            temp_table = None
            project_fiscal_summary_table = self.get_public_table(config.PROJECT_FISCAL_SUMMARY_TABLE)
            project_summary_table = self.get_public_table(config.PROJECT_SUMMARY_TABLE)

            column_mapping = {
                "total_fte_prj": "total_fte",
                "total_subcon_prj": "total_subcon",
                "total_effort_prj": "total_effort",
                "total_cost_prj": "total_cost",
                "total_cost_fte_prj": "total_cost_fte",
                "total_cost_subcon_prj": "total_cost_subcon",
                "total_cost_nonlabor_prj": "total_cost_nonlabor",
                "blended_rate_fte": "blended_rate_fte",
                "blended_rate_subcon": "blended_rate_subcon"
            }

            fiscal_cols = list(column_mapping.keys())
            summary_cols = list(column_mapping.values())

            fiscal_df = (
                self.spark.read.format("jdbc")
                .option("url", config.MAIN_DB_URL)
                .option("dbtable", project_fiscal_summary_table)
                .option("user", config.MAIN_DB_USER)
                .option("password", settings.MAIN_DB_PASSWORD)
                .option("driver", config.ENTITY_DB_DRIVER)
                .load()
                .filter(col("account_rid") == account_rid)
            )

            aggregated_df = fiscal_df.groupBy("account_rid", "project_code").agg(
                *[spark_sum(col(f)).alias(f) for f in fiscal_cols]
            )

            # Rename fiscal → summary
            for fiscal_col, summary_col in column_mapping.items():
                aggregated_df = aggregated_df.withColumnRenamed(fiscal_col, summary_col)

            summary_df = (
                self.spark.read.format("jdbc")
                .option("url", config.MAIN_DB_URL)
                .option("dbtable", project_summary_table)
                .option("user", config.MAIN_DB_USER)
                .option("password", settings.MAIN_DB_PASSWORD)
                .option("driver", config.ENTITY_DB_DRIVER)
                .load()
                .select("rid", "account_rid", "project_code")
            )

            update_df = aggregated_df.join(
                summary_df,
                ["account_rid", "project_code"],
                "inner"
            ).select("rid", *summary_cols)

            updates = update_df.collect()
            if not updates:
                logger.info("ℹ️ No summaries to update")
                return

            logger.info(f"📊 Preparing to bulk update {len(updates)} project summary rows...")

            temp_table = f"tmp_project_summary_{account_rid.replace('-', '')}"

            # Create temp table dynamically
            create_temp_sql = f"""
                CREATE TEMP TABLE {temp_table} (
                    rid VARCHAR PRIMARY KEY,
                    {', '.join([f'{c} NUMERIC' for c in summary_cols])}
                );
            """

            with DBPool.get_connection_mainDB() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(create_temp_sql)

                    insert_sql = f"""
                        INSERT INTO {temp_table} (rid, {', '.join(summary_cols)})
                        VALUES %s
                    """

                    rows_to_insert = [
                        tuple([row.rid] + [getattr(row, c) for c in summary_cols])
                        for row in updates
                    ]

                    execute_values(cursor, insert_sql, rows_to_insert)
                    conn.commit()

                    bulk_update_sql = f"""
                        UPDATE {project_summary_table} p
                        SET {', '.join([f'{c} = t.{c}' for c in summary_cols])}
                        FROM {temp_table} t
                        WHERE p.rid = t.rid
                    """

                    cursor.execute(bulk_update_sql)
                    conn.commit()

                    # After bulk update completes
                    drop_sql = f"DROP TABLE IF EXISTS {temp_table};"
                    cursor.execute(drop_sql)
                    conn.commit()
                    logger.info(f"🧹 Temp table {temp_table} dropped successfully.")


            logger.info(f"✅ Successfully bulk updated {len(updates)} project summary rows!")
            return True

        except Exception as e:
            logger.error(f"❌ Error during summary update: {str(e)}", exc_info=True)
            raise
        finally:
            if temp_table:
                try:
                    logger.info(f"🧹 Cleaning temp table (if exists): {temp_table}")
                    with DBPool.get_connection() as conn:
                        with conn.cursor() as cursor:
                            cursor.execute(f"DROP TABLE IF EXISTS {temp_table};")
                            conn.commit()
                    logger.info(f"✅ Temp table {temp_table} dropped.")
                except Exception as cleanup_err:
                    logger.error(f"⚠️ Failed to drop temp table {temp_table}: {cleanup_err}")


    def upsert_account_fiscal(self, account_r_number: str, account_rid: str, fiscal_year: int, modified_by: str):
        """Fetch project fiscal entries, calculate fiscal totals, and insert/update account fiscal and account_fiscal_region tables."""
        try:
            logger.info(f"🔄 Processing account fiscal summary for account_rid={account_rid}, fiscal_year={fiscal_year}...")

            # Table names
            project_fiscal_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
            account_fiscal_table = self.get_tenant_table(account_r_number, config.ACCOUNT_FISCAL_TABLE)
            account_fiscal_region_table = self.get_tenant_table(account_r_number, config.ACCOUNT_FISCAL_REGION_TABLE)

            # Load fiscal data
            fiscal_df = self.spark.read \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", project_fiscal_table) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .filter((col("account_rid") == account_rid) & (col("fiscal_year") == fiscal_year))

            if fiscal_df.rdd.isEmpty():
                logger.info(f"ℹ️ No fiscal data found for account_rid={account_rid}, fiscal_year={fiscal_year}")
                return
            # Aggregate for account_fiscal (no region)
            aggregated_df = fiscal_df.groupBy("account_rid", "fiscal_year").agg(
                countDistinct("project_rid").alias("total_projects"),
                spark_sum(col("total_fte_prj")).alias("total_fte"),
                spark_sum(col("total_subcon_prj")).alias("total_subcon"),
                spark_sum(col("total_nonlabor_prj")).alias("total_nonlabor"),
                spark_sum(col("total_effort_fte_prj")).alias("total_project_hours_fte"),
                spark_sum(col("total_effort_subcon_prj")).alias("total_project_hours_subcon"),
                spark_sum(col("total_effort_prj")).alias("total_project_hours"),
                spark_sum(col("total_cost_fte_prj")).alias("total_project_cost_fte"),
                spark_sum(col("total_cost_subcon_prj")).alias("total_project_cost_subcon"),
                spark_sum(col("total_cost_nonlabor_prj")).alias("total_project_cost_nonlabor"),
                spark_sum(col("total_cost_prj")).alias("total_project_cost")
            )

            # Aggregate for account_fiscal_region (with region)
            aggregated_region_df = fiscal_df.filter(col("region_rid").isNotNull()) \
                .groupBy("account_rid", "fiscal_year", "region_rid").agg(
                    countDistinct("project_rid").alias("total_projects"),
                    spark_sum(col("total_fte_prj")).alias("total_fte"),
                    spark_sum(col("total_subcon_prj")).alias("total_subcon"),
                    spark_sum(col("total_nonlabor_prj")).alias("total_nonlabor"),
                    spark_sum(col("total_effort_fte_prj")).alias("total_project_hours_fte"),
                    spark_sum(col("total_effort_subcon_prj")).alias("total_project_hours_subcon"),
                    spark_sum(col("total_effort_prj")).alias("total_project_hours"),
                    spark_sum(col("total_cost_fte_prj")).alias("total_project_cost_fte"),
                    spark_sum(col("total_cost_subcon_prj")).alias("total_project_cost_subcon"),
                    spark_sum(col("total_cost_nonlabor_prj")).alias("total_project_cost_nonlabor"),
                    spark_sum(col("total_cost_prj")).alias("total_project_cost")
                )

            current_time = self.get_date_and_time()

            # ===== Account Fiscal Upsert =====
            existing_df = self.spark.read \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", account_fiscal_table) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .filter((col("account_rid") == account_rid) & (col("fiscal_year") == fiscal_year))

            if existing_df.rdd.isEmpty():
                logger.info(f"➕ Inserting into account_fiscal for account_rid={account_rid}, fiscal_year={fiscal_year}")
                (aggregated_df.withColumn("created_datetime", lit(current_time))
                            .withColumn("created_by", lit(modified_by))
                            .write.format("jdbc")
                            .option("url", config.ENTITY_DB_URL)
                            .option("dbtable", account_fiscal_table)
                            .option("user", config.ENTITY_DB_USER)
                            .option("password", settings.ENTITY_DB_PASSWORD)
                            .option("driver", config.ENTITY_DB_DRIVER)
                            .option("stringtype", "unspecified")
                            .option("batchsize", 100)
                            .mode("append")
                            .save())
            else:
                logger.info(f"✏️ Updating account_fiscal for account_rid={account_rid}, fiscal_year={fiscal_year}")
                update_clause = ", ".join([f"{field} = %s" for field in aggregated_df.columns])
                update_sql = f"""
                    UPDATE {account_fiscal_table} 
                    SET {update_clause}, modified_datetime = %s, modified_by = %s 
                    WHERE account_rid = %s AND fiscal_year = %s
                """
                aggregated_data = aggregated_df.collect()[0]
                values = [getattr(aggregated_data, field) for field in aggregated_df.columns]
                values.extend([current_time, modified_by, account_rid, fiscal_year])
                with DBPool.get_connection() as conn:
                    with conn.cursor() as cursor:
                        cursor.execute(update_sql, values)
                        conn.commit()

            account_fiscal_summary_table = self.get_public_table(config.ACCOUNT_FISCAL_SUMMARY_TABLE)
            # ===== Account Fiscal Summary Upsert (MAIN DB) =====
            summary_existing_df = self.spark.read \
                .format("jdbc") \
                .option("url", config.MAIN_DB_URL) \
                .option("dbtable", account_fiscal_summary_table) \
                .option("user", config.MAIN_DB_USER) \
                .option("password", settings.MAIN_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .filter((col("account_rid") == account_rid) & (col("fiscal_year") == fiscal_year))

            if summary_existing_df.rdd.isEmpty():
                logger.info(f"➕ Inserting into account_fiscal_summary for account_rid={account_rid}, fiscal_year={fiscal_year}")

                (aggregated_df.withColumn("created_datetime", lit(current_time))
                            .withColumn("created_by", lit(modified_by))
                            .write.format("jdbc")
                            .option("url", config.MAIN_DB_URL)
                            .option("dbtable", account_fiscal_summary_table)
                            .option("user", config.MAIN_DB_USER)
                            .option("password", settings.MAIN_DB_PASSWORD)
                            .option("driver", config.ENTITY_DB_DRIVER)
                            .option("stringtype", "unspecified")
                            .option("batchsize", 1000)
                            .mode("append")
                            .save())
            else:
                logger.info(f"✏️ Updating account_fiscal_summary for account_rid={account_rid}, fiscal_year={fiscal_year}")

                update_clause = ", ".join([f"{field} = %s" for field in aggregated_df.columns])

                update_sql = f"""
                    UPDATE {account_fiscal_summary_table}
                    SET {update_clause}, modified_datetime = %s, modified_by = %s
                    WHERE account_rid = %s AND fiscal_year = %s
                """

                aggregated_data = aggregated_df.collect()[0]
                values = [getattr(aggregated_data, field) for field in aggregated_df.columns]
                values.extend([current_time, modified_by, account_rid, fiscal_year])

                with DBPool.get_connection_mainDB() as conn:
                    with conn.cursor() as cursor:
                        cursor.execute(update_sql, values)
                        conn.commit()

            # ===== Account Fiscal Region Upsert =====
            if aggregated_region_df.rdd.isEmpty():
                for row in aggregated_region_df.collect():
                    region_rid = row["region_rid"]

                    # Check if region entry exists
                    existing_region_df = self.spark.read \
                        .format("jdbc") \
                        .option("url", config.ENTITY_DB_URL) \
                        .option("dbtable", account_fiscal_region_table) \
                        .option("user", config.ENTITY_DB_USER) \
                        .option("password", settings.ENTITY_DB_PASSWORD) \
                        .option("driver", config.ENTITY_DB_DRIVER) \
                        .load() \
                        .filter((col("account_rid") == account_rid) & 
                                (col("fiscal_year") == fiscal_year) & 
                                (col("region_rid") == region_rid))

                    if existing_region_df.rdd.isEmpty():
                        logger.info(f"➕ Inserting into account_fiscal_region for region_rid={region_rid}")
                        (
                            aggregated_region_df
                            .filter(col("region_rid") == region_rid)
                            .withColumn("created_datetime", lit(current_time))
                            .withColumn("created_by", lit(modified_by))
                            .write.format("jdbc")
                            .option("url", config.ENTITY_DB_URL)
                            .option("dbtable", account_fiscal_region_table)
                            .option("user", config.ENTITY_DB_USER)
                            .option("password", settings.ENTITY_DB_PASSWORD)
                            .option("driver", config.ENTITY_DB_DRIVER)
                            .option("stringtype", "unspecified")
                            .option("batchsize", 100)
                            .mode("append")
                            .save()
                        )
                    else:
                        logger.info(f"✏️ Updating account_fiscal_region for region_rid={region_rid}")
                        update_clause = ", ".join([f"{field} = %s" for field in aggregated_region_df.columns])
                        update_sql = f"""
                            UPDATE {account_fiscal_region_table} 
                            SET {update_clause}, modified_datetime = %s, modified_by = %s 
                            WHERE account_rid = %s AND fiscal_year = %s AND region_rid = %s
                        """
                        values = [getattr(row, field) for field in aggregated_region_df.columns]
                        values.extend([current_time, modified_by, account_rid, fiscal_year, region_rid])
                        with DBPool.get_connection() as conn:
                            with conn.cursor() as cursor:
                                cursor.execute(update_sql, values)
                                conn.commit()

            logger.info(f"✅ Upsert completed for account_fiscal and account_fiscal_region")
            return True

        except Exception as e:
            logger.error(f"❌ Error during account fiscal summary upsert: {str(e)}", exc_info=True)
            raise


    def upsert_account_fiscal_by_project_resource(self, account_r_number: str, account_rid: str, fiscal_year: int, modified_by: str):
        """Fetch project fiscal entries, calculate fiscal totals, and insert/update account fiscal & account_fiscal_region tables."""
        try:
            logger.info(f"🔄 Processing account fiscal summary for account_rid={account_rid}, fiscal_year={fiscal_year}...")

            # Table names
            project_fiscal_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
            account_fiscal_table = self.get_tenant_table(account_r_number, config.ACCOUNT_FISCAL_TABLE)
            account_fiscal_region_table = self.get_tenant_table(account_r_number, config.ACCOUNT_FISCAL_REGION_TABLE)

            # Read fiscal data
            fiscal_df = self.spark.read \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", project_fiscal_table) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .filter((col("account_rid") == account_rid) & (col("fiscal_year") == fiscal_year))

            if fiscal_df.rdd.isEmpty():
                logger.info(f"ℹ️ No fiscal data found for account_rid={account_rid}, fiscal_year={fiscal_year}")
                return

            # Aggregate for account-level
            aggregated_df = fiscal_df.groupBy("account_rid", "fiscal_year").agg(
                countDistinct("project_rid").alias("total_projects"),
                spark_sum(col("total_fte_from_prj_res")).alias("total_fte"),
                spark_sum(col("total_subcon_from_prj_res")).alias("total_subcon"),
                spark_sum(col("total_effort_fte_from_prj_res")).alias("total_project_res_hours_fte"),
                spark_sum(col("total_effort_subcon_from_prj_res")).alias("total_project_res_hours_subcon"),
                spark_sum(col("total_effort_from_prj_res")).alias("total_project_res_hours"),
                spark_sum(col("total_cost_fte_from_prj_res")).alias("total_project_res_cost_fte"),
                spark_sum(col("total_cost_subcon_from_prj_res")).alias("total_project_res_cost_subcon"),
                spark_sum(col("total_cost_nonlabor_from_prj_res")).alias("total_project_res_cost_nonlabor"),
                spark_sum(col("total_cost_from_prj_res")).alias("total_project_res_cost")
            )

            # Aggregate for region-level if region_rid present
            region_df = None
            if "region_rid" in fiscal_df.columns:
                region_df = fiscal_df.groupBy("account_rid", "fiscal_year", "region_rid").agg(
                    countDistinct("project_rid").alias("total_projects"),
                    spark_sum(col("total_fte_from_prj_res")).alias("total_fte"),
                    spark_sum(col("total_subcon_from_prj_res")).alias("total_subcon"),
                    spark_sum(col("total_effort_fte_from_prj_res")).alias("total_project_res_hours_fte"),
                    spark_sum(col("total_effort_subcon_from_prj_res")).alias("total_project_res_hours_subcon"),
                    spark_sum(col("total_effort_from_prj_res")).alias("total_project_res_hours"),
                    spark_sum(col("total_cost_fte_from_prj_res")).alias("total_project_res_cost_fte"),
                    spark_sum(col("total_cost_subcon_from_prj_res")).alias("total_project_res_cost_subcon"),
                    spark_sum(col("total_cost_nonlabor_from_prj_res")).alias("total_project_res_cost_nonlabor"),
                    spark_sum(col("total_cost_from_prj_res")).alias("total_project_res_cost")
                )

            current_time = self.get_date_and_time()

            # ===== Upsert for account_fiscal =====
            existing_df = self.spark.read \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", account_fiscal_table) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .filter((col("account_rid") == account_rid) & (col("fiscal_year") == fiscal_year))

            if existing_df.rdd.isEmpty():
                logger.info(f"➕ Inserting new fiscal summary into {account_fiscal_table}")
                (aggregated_df.withColumn("created_datetime", lit(current_time))
                    .withColumn("created_by", lit(modified_by))
                    .write
                    .format("jdbc")
                    .option("url", config.ENTITY_DB_URL)
                    .option("dbtable", account_fiscal_table)
                    .option("user", config.ENTITY_DB_USER)
                    .option("password", settings.ENTITY_DB_PASSWORD)
                    .option("driver", config.ENTITY_DB_DRIVER)
                    .option("stringtype", "unspecified")
                    .option("batchsize", 100)
                    .mode("append")
                    .save())
            else:
                logger.info(f"✏️ Updating existing fiscal summary in {account_fiscal_table}")
                update_clause = ", ".join([f"{field} = %s" for field in aggregated_df.columns])
                update_sql = f"""
                    UPDATE {account_fiscal_table} 
                    SET {update_clause}, modified_datetime = %s, modified_by = %s 
                    WHERE account_rid = %s AND fiscal_year = %s
                """
                aggregated_data = aggregated_df.collect()[0]
                values = [getattr(aggregated_data, field) for field in aggregated_df.columns]
                values.extend([current_time, modified_by, account_rid, fiscal_year])
                with DBPool.get_connection() as conn:
                    with conn.cursor() as cursor:
                        cursor.execute(update_sql, values)
                        conn.commit()

            # ===== Upsert for account_fiscal_region =====
            if region_df and region_df.rdd.isEmpty():
                logger.info(f"🌍 Processing account_fiscal_region for {account_rid}, {fiscal_year}")
                existing_region_df = self.spark.read \
                    .format("jdbc") \
                    .option("url", config.ENTITY_DB_URL) \
                    .option("dbtable", account_fiscal_region_table) \
                    .option("user", config.ENTITY_DB_USER) \
                    .option("password", settings.ENTITY_DB_PASSWORD) \
                    .option("driver", config.ENTITY_DB_DRIVER) \
                    .load() \
                    .filter((col("account_rid") == account_rid) & (col("fiscal_year") == fiscal_year))

                if existing_region_df.rdd.isEmpty():
                    logger.info(f"➕ Inserting into {account_fiscal_region_table}")
                    (region_df.withColumn("created_datetime", lit(current_time))
                        .withColumn("created_by", lit(modified_by))
                        .write
                        .format("jdbc")
                        .option("url", config.ENTITY_DB_URL)
                        .option("dbtable", account_fiscal_region_table)
                        .option("user", config.ENTITY_DB_USER)
                        .option("password", settings.ENTITY_DB_PASSWORD)
                        .option("driver", config.ENTITY_DB_DRIVER)
                        .option("stringtype", "unspecified")
                        .option("batchsize", 100)
                        .mode("append")
                        .save())
                else:
                    logger.info(f"✏️ Updating existing records in {account_fiscal_region_table}")
                    for row in region_df.collect():
                        update_clause = ", ".join([f"{field} = %s" for field in region_df.columns])
                        update_sql = f"""
                            UPDATE {account_fiscal_region_table} 
                            SET {update_clause}, modified_datetime = %s, modified_by = %s 
                            WHERE account_rid = %s AND fiscal_year = %s AND region_rid = %s
                        """
                        values = [getattr(row, field) for field in region_df.columns]
                        values.extend([current_time, modified_by, row.account_rid, row.fiscal_year, row.region_rid])
                        with DBPool.get_connection() as conn:
                            with conn.cursor() as cursor:
                                cursor.execute(update_sql, values)
                                conn.commit()
            logger.info(f"✅ Completed fiscal summary processing for account_rid={account_rid}, fiscal_year={fiscal_year}")
            return True

        except Exception as e:
            logger.error(f"❌ Error during account fiscal summary upsert: {str(e)}", exc_info=True)
            raise

    
    def upsert_account_fiscal_by_project_task(self, account_r_number:str, account_rid: str, fiscal_year: int, modified_by: str):
        """Fetch project fiscal entries, calculate fiscal totals, and insert/update account fiscal and account_fiscal_region tables."""
        try:
            logger.info(f"🔄 Processing account fiscal summary for account_rid={account_rid}, fiscal_year={fiscal_year}...")

            # Fetch fiscal records from project_fiscal_table
            project_fiscal_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
            account_fiscal_table = self.get_tenant_table(account_r_number, config.ACCOUNT_FISCAL_TABLE)
            account_fiscal_region_table = self.get_tenant_table(account_r_number, config.ACCOUNT_FISCAL_REGION_TABLE)

            fiscal_df = self.spark.read \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", project_fiscal_table) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .filter((col("account_rid") == account_rid) & (col("fiscal_year") == fiscal_year))
            
            if fiscal_df is not None and not fiscal_df.rdd.isEmpty():
                fiscal_df.persist(StorageLevel.MEMORY_AND_DISK)

            if fiscal_df.rdd.isEmpty():
                logger.info(f"ℹ️ No fiscal data found for account_rid={account_rid}, fiscal_year={fiscal_year}")
                return

            logger.info(f" fiscal_count - {fiscal_df.count()}")
            # fiscal_df.show()

            # ------------------------
            # Account Fiscal Aggregation
            # ------------------------
            aggregated_df = fiscal_df.groupBy("account_rid", "fiscal_year").agg(
                countDistinct("project_rid").alias("total_projects"),
                spark_sum(col("total_fte_from_tasks")).alias("total_fte"),
                spark_sum(col("total_subcon_from_tasks")).alias("total_subcon"),
                spark_sum(col("total_effort_fte_from_tasks")).alias("total_project_task_hours_fte"),
                spark_sum(col("total_effort_subcon_from_tasks")).alias("total_project_task_hours_subcon"),
                spark_sum(col("total_effort_from_tasks")).alias("total_project_task_hours"),
                spark_sum(col("total_cost_fte_from_tasks")).alias("total_project_task_cost_fte"),
                spark_sum(col("total_cost_subcon_from_tasks")).alias("total_project_task_cost_subcon"),
                spark_sum(col("total_cost_from_tasks")).alias("total_project_task_cost")
            )
            # aggregated_df.show()
            if aggregated_df is not None and not aggregated_df.rdd.isEmpty():
                aggregated_df.persist(StorageLevel.MEMORY_AND_DISK)
            logger.info(f" aggregated_df - {aggregated_df.count()}")

            # Upsert into account_fiscal
            existing_df = self.spark.read \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", account_fiscal_table) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .filter((col("account_rid") == account_rid) & (col("fiscal_year") == fiscal_year))
            
            if existing_df is not None and not existing_df.rdd.isEmpty():
                existing_df.persist(StorageLevel.MEMORY_AND_DISK)

            current_time = self.get_date_and_time()
            if existing_df.rdd.isEmpty():
                logger.info(f"➕ Inserting new fiscal summary for account_rid={account_rid}, fiscal_year={fiscal_year}")
                (aggregated_df.withColumn("created_datetime", lit(current_time))
                    .withColumn("created_by", lit(modified_by))
                    .write
                    .format("jdbc")
                    .option("url", config.ENTITY_DB_URL)
                    .option("dbtable", account_fiscal_table)
                    .option("user", config.ENTITY_DB_USER)
                    .option("password", settings.ENTITY_DB_PASSWORD)
                    .option("driver", config.ENTITY_DB_DRIVER)
                    .option("stringtype", "unspecified")
                    .option("batchsize", 100)
                    .mode("append")
                    .save())
            else:
                logger.info(f"✏️ Updating existing fiscal summary for account_rid={account_rid}, fiscal_year={fiscal_year}")
                update_clause = ", ".join([f"{field} = %s" for field in aggregated_df.columns])
                update_sql = f"""
                    UPDATE {account_fiscal_table} 
                    SET {update_clause}, modified_datetime = %s, modified_by = %s 
                    WHERE account_rid = %s AND fiscal_year = %s
                """
                logger.info(f"update_sql: {update_sql}")
                aggregated_data = aggregated_df.collect()[0]
                values = [getattr(aggregated_data, field) for field in aggregated_df.columns]
                values.extend([current_time, modified_by, account_rid, fiscal_year])

                with DBPool.get_connection() as conn:
                    with conn.cursor() as cursor:
                        cursor.execute(update_sql, values)
                        conn.commit()
                        logger.info(f"✅ Successfully updated fiscal summary for account_rid={account_rid}, fiscal_year={fiscal_year}")

            # ------------------------
            # Account Fiscal Region Aggregation
            # ------------------------
            if "region_rid" in fiscal_df.columns:
                region_agg_df = fiscal_df.groupBy("account_rid", "region_rid", "fiscal_year").agg(
                    countDistinct("project_rid").alias("total_projects"),
                    spark_sum(col("total_fte_from_tasks")).alias("total_fte"),
                    spark_sum(col("total_subcon_from_tasks")).alias("total_subcon"),
                    spark_sum(col("total_effort_fte_from_tasks")).alias("total_project_task_hours_fte"),
                    spark_sum(col("total_effort_subcon_from_tasks")).alias("total_project_task_hours_subcon"),
                    spark_sum(col("total_effort_from_tasks")).alias("total_project_task_hours"),
                    spark_sum(col("total_cost_fte_from_tasks")).alias("total_project_task_cost_fte"),
                    spark_sum(col("total_cost_subcon_from_tasks")).alias("total_project_task_cost_subcon"),
                    spark_sum(col("total_cost_from_tasks")).alias("total_project_task_cost")
                )

                existing_region_df = self.spark.read \
                    .format("jdbc") \
                    .option("url", config.ENTITY_DB_URL) \
                    .option("dbtable", account_fiscal_region_table) \
                    .option("user", config.ENTITY_DB_USER) \
                    .option("password", settings.ENTITY_DB_PASSWORD) \
                    .option("driver", config.ENTITY_DB_DRIVER) \
                    .load() \
                    .filter((col("account_rid") == account_rid) & (col("fiscal_year") == fiscal_year))

                if existing_region_df.rdd.isEmpty():
                    logger.info(f"➕ Inserting new account_fiscal_region entries...")
                    (region_agg_df.withColumn("created_datetime", lit(current_time))
                        .withColumn("created_by", lit(modified_by))
                        .write
                        .format("jdbc")
                        .option("url", config.ENTITY_DB_URL)
                        .option("dbtable", account_fiscal_region_table)
                        .option("user", config.ENTITY_DB_USER)
                        .option("password", settings.ENTITY_DB_PASSWORD)
                        .option("driver", config.ENTITY_DB_DRIVER)
                        .option("stringtype", "unspecified")
                        .option("batchsize", 100)
                        .mode("append")
                        .save())
                else:
                    logger.info(f"✏️ Updating existing account_fiscal_region entries...")
                    for row in region_agg_df.collect():
                        update_clause = ", ".join([f"{field} = %s" for field in region_agg_df.columns])
                        update_sql = f"""
                            UPDATE {account_fiscal_region_table} 
                            SET {update_clause}, modified_datetime = %s, modified_by = %s 
                            WHERE account_rid = %s AND region_rid = %s AND fiscal_year = %s
                        """
                        values = [getattr(row, field) for field in region_agg_df.columns]
                        values.extend([current_time, modified_by, row.account_rid, row.region_rid, row.fiscal_year])
                        with DBPool.get_connection() as conn:
                            with conn.cursor() as cursor:
                                cursor.execute(update_sql, values)
                                conn.commit()
                    logger.info(f"✅ Successfully updated account_fiscal_region entries.")
            if fiscal_df is not None:
                fiscal_df.unpersist()
            if aggregated_df is not None:
                aggregated_df.unpersist()
            if existing_df is not None:
                existing_df.unpersist()
            return True

        except Exception as e:
            logger.error(f"❌ Error during account fiscal summary upsert: {str(e)}", exc_info=True)
            raise
  
    def update_account_totals_from_fiscal(self, account_r_number: str, account_rid: str, fiscal_year: int, modified_by: str):
        """Aggregate fiscal values year-wise and update account table with overall totals."""
        try:
            logger.info(f"🔄 Processing account totals for account_rid={account_rid}...")

            # Fetch fiscal records from account_fiscal_table
            project_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_TABLE)
            account_table = self.get_public_table(config.ACCOUNT_TABLE)

            project_df = self.spark.read \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", project_table) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .filter(col("account_rid") == account_rid)

            if project_df.rdd.isEmpty():
                logger.info(f"ℹ️ No fiscal data found for account_rid={account_rid}")
                return

            # Compute overall totals across all years
            overall_totals_df = project_df.groupBy("account_rid").agg(
                f_count("*").alias("total_projects"),                          # ✅ count projects
                spark_sum(col("total_cost")).alias("total_project_cost"),
                spark_sum(col("total_effort")).alias("total_project_hours")
            )

            # Read account data to ensure correct identifier ("rid" instead of "account_rid")
            account_df = self.spark.read \
                .format("jdbc") \
                .option("url", config.MAIN_DB_URL) \
                .option("dbtable", account_table) \
                .option("user", config.MAIN_DB_USER) \
                .option("password", settings.MAIN_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .select("rid", "account_name")
            mapped_df = overall_totals_df.join(account_df, overall_totals_df["account_rid"] == account_df["rid"], "inner") \
                                        .select(account_df["rid"], *overall_totals_df.columns)

            current_time = self.get_date_and_time()

            # Check if account record already exists
            existing_df = account_df.filter(col("rid") == account_rid)
            mapped_df = mapped_df.drop("account_rid")
            if existing_df.rdd.isEmpty():
                logger.info(f"➕ Inserting new overall totals for account_rid={account_rid}")

                (mapped_df.withColumn("created_datetime", lit(current_time))
                    .withColumn("created_by", lit(modified_by))
                    .write
                    .format("jdbc")
                    .option("url", config.ENTITY_DB_URL)
                    .option("dbtable", account_table)
                    .option("user", config.ENTITY_DB_USER)
                    .option("password", settings.ENTITY_DB_PASSWORD)
                    .option("driver", config.ENTITY_DB_DRIVER)
                    .option("stringtype", "unspecified")
                    .option("batchsize", 100)
                    .mode("append")
                    .save())
            else:
                logger.info(f"✏️ Updating existing overall totals for account_rid={account_rid}")
                update_clause = ", ".join([f"{field} = %s" for field in mapped_df.columns if field != "rid"])
                update_sql = f"""
                    UPDATE {account_table} 
                    SET {update_clause}
                    WHERE rid = %s
                """

                aggregated_data = mapped_df.collect()[0]
                values = [getattr(aggregated_data, field) for field in mapped_df.columns if field != "rid"]
                logger.info(f"values----: {values}")
                values.extend([account_rid])

                with DBPool.get_connection_mainDB() as conn:
                    with conn.cursor() as cursor:
                        cursor.execute(update_sql, values)
                        conn.commit()
                        logger.info(f"✅ Successfully updated overall totals for account_rid={account_rid}")

            logger.info(f"✅ Successfully processed both year-wise and overall account totals!")
            return True

        except Exception as e:
            logger.error(f"❌ Error during account totals update: {str(e)}", exc_info=True)
            raise
    
    def get_account_fiscal_rid(self, account_r_number: str, account_rid: str, fiscal_year: int) -> str:
        """Fetch the fiscal RID for a given account_rid from account_fiscal_table."""
        try:
            logger.info(f"🔍 Fetching fiscal RID for account_rid={account_rid}...")
            table_name = self.get_tenant_table(account_r_number, config.ACCOUNT_FISCAL_TABLE)
            # Read fiscal data
            account_fiscal_df = (
                self.spark.read
                    .format("jdbc")
                    .option("url", config.ENTITY_DB_URL)
                    .option("dbtable", table_name)
                    .option("user", config.ENTITY_DB_USER)
                    .option("password", settings.ENTITY_DB_PASSWORD)
                    .option("driver", config.ENTITY_DB_DRIVER)
                    .load()
                    .filter((col("account_rid") == account_rid) & (col("fiscal_year") == fiscal_year))
                    .select("rid")
            )

            # Extract RID if exists
            if not account_fiscal_df.rdd.isEmpty():
                rid_value = account_fiscal_df.collect()[0]["rid"]
                logger.info(f"✅ Found fiscal RID: {rid_value} for account_rid={account_rid}")
                return rid_value
            else:
                logger.warning(f"⚠️ No fiscal record found for account_rid={account_rid}")
                return None

        except Exception as e:
            logger.error(f"❌ Error fetching fiscal RID: {str(e)}", exc_info=True)
            raise

    def log_entity_event(self, account_rid: str, account_r_number:str,
                        event_name: str, event_type : str, event_status: str, 
                        entity_rid: str, entity_type: str, timeline_table: str, document_id: str, created_by: str, modified_by: str):
        """Generic version to log events for any entity type"""
        table_name = self.get_tenant_table(account_r_number, timeline_table)
        logger.info(f"table_name ==> {table_name}")
        if event_name == "insert":
            check_query = f"""
                SELECT COUNT(*) as count 
                FROM {table_name} 
                WHERE entity_rid = '{entity_rid}' 
                AND event_name = 'insert'
            """
            try:
                count_df = self.spark.read \
                    .format("jdbc") \
                    .option("url", config.ENTITY_DB_URL) \
                    .option("query", check_query) \
                    .option("user", config.ENTITY_DB_USER) \
                    .option("password", settings.ENTITY_DB_PASSWORD) \
                    .option("driver", config.ENTITY_DB_DRIVER) \
                    .load()
                
                existing_count = count_df.collect()[0]['count']
                
                if existing_count > 0:
                    logger.warning(f"Record with entity_rid {entity_rid} already exists in timeline table. Skipping.")
                    return
            
            except Exception as e:
                logger.error(f"Error checking for duplicate timeline entry: {e}")
                # Proceed with insert if check fails
                pass
        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                insert_sql = f"""
                INSERT INTO {table_name} (
                    account_rid, event_name, event_type, 
                    event_status, event_datetime, entity_rid, created_by, modified_by,created_datetime,modified_datetime,document_rid
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                logger.info(f"Insert SQL===> {insert_sql}")
                cursor.execute(insert_sql, (
                    account_rid,
                    event_name,
                    event_type,
                    event_status,
                    self.get_date_and_time(),
                    entity_rid,
                    modified_by,
                    modified_by,
                    self.get_date_and_time(),
                    self.get_date_and_time(),
                    document_id
                ))
                logger.info(f"Executed successfully Timeline")
                conn.commit()
                logger.info(f"Committed successfully Timeline")

    def get_map_project_code(self, df: DataFrame, account_r_number: str, account_rid: str, rid_column: str) -> DataFrame:
        """Map project_code to project_fiscal_rid"""
        project_code_df = (
            self.spark.read
                .format("jdbc")
                .option("url", config.ENTITY_DB_URL)
                .option("dbtable", self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE))
                .option("user", config.ENTITY_DB_USER)
                .option("password", settings.ENTITY_DB_PASSWORD)
                .option("driver", config.ENTITY_DB_DRIVER)
                .load()
                .filter(col("account_rid") == account_rid)
                .select("project_code", "rid")
        )

        # Explicit join condition
        df = df.join(project_code_df, df[rid_column] == project_code_df.rid, how="left") \
            .drop(project_code_df.rid)

        return df

    def log_entity_event_spark(
            self,
            df: DataFrame,
            account_rid: str,
            account_r_number: str,
            event_name: str,
            event_type_rid: str,
            event_status: str,
            entity_type: str,
            rid_column: str,
            document_id: str,
            created_by: str,
            modified_by: str
        ):
        """Bulk insert entity events into timeline tables using Spark JDBC"""

        from pyspark.sql import functions as F
        from pyspark.sql.functions import lit

        if "project_code" not in df.columns and entity_type in ["project", "project_resource", "project_task", "Auto RD Assessment"]:
            rid_column = 'rid'
            df = self.get_map_project_code(df,account_r_number,account_rid, rid_column)
        # --------------------------------------------------
        # Safety cleanup
        # --------------------------------------------------
        if "project_rid" in df.columns:
            df = df.drop("project_rid")

        # --------------------------------------------------
        # Common RID Mapping
        # rid -> entity_rid
        # rid -> project_rid (when needed)
        # --------------------------------------------------
        df = df.withColumn("entity_rid", F.col(rid_column))

        # --------------------------------------------------
        # Description column mapping
        # --------------------------------------------------
        if entity_type == "project":
            description_col = "project_code"
        elif entity_type in ["resource", "resource_skill", "resource_cost"]:
            description_col = "resource_code"
        elif entity_type in ["project_resource", "project_task"]:
            description_col = "project_resource_code"
        else:
            description_col = "project_code"
        # --------------------------------------------------
        # ACCOUNT TIMELINE DF
        # --------------------------------------------------
        if entity_type in ["resource", "resource_skill", "resource_cost", "project"]:
            event_df_account = (
                df
                .withColumn("account_rid", lit(account_rid))
                .withColumn("event_name", lit(event_name))
                .withColumn("event_type_rid", lit(event_type_rid))
                .withColumn("entity_name", lit(entity_type))
                .withColumn("created_by", lit(created_by))
                .withColumn("created_by_name", lit(self.get_user_name(created_by)))
                .withColumn("created_datetime", lit(self.get_date_and_time()))
                .withColumn("document_rid", lit(document_id))
                .withColumn("descriptions", F.col(description_col))
                .select(
                    "account_rid",
                    "event_name",
                    "event_type_rid",
                    "entity_rid",
                    "entity_name",
                    "created_by",
                    "created_by_name",
                    "created_datetime",
                    "document_rid",
                    "descriptions"
                )
            )

            # Count of records
            total_count = df.count()
            account_name = self.get_account_name(account_rid)
            # Summary entry
            summary_df = (
                self.spark.range(1)
                .withColumn("account_rid", F.lit(account_rid))
                .withColumn("event_name", F.lit(event_name))
                .withColumn("event_type_rid", F.lit(event_type_rid))
                .withColumn("entity_rid", F.lit(account_rid))
                .withColumn("entity_name", F.lit(entity_type))
                .withColumn("created_by", F.lit(created_by))
                .withColumn("created_by_name", F.lit(self.get_user_name(created_by)))
                .withColumn("created_datetime", F.lit(self.get_date_and_time()))
                .withColumn("document_rid", F.lit(None).cast("string"))
                .withColumn(
                    "descriptions",
                    F.lit(f"via import to account {account_name} ({total_count} {entity_type} records)")
                )
                .select(event_df_account.columns)
            )

            # Final dataframe (individual + summary)
            event_df_account = event_df_account.unionByName(summary_df)
        # --------------------------------------------------
        # PROJECT TIMELINE DF
        # --------------------------------------------------
        if entity_type in ["project", "project_resource", "project_task", "Auto RD Assessment"]:
            if entity_type == "project":
                df = df.withColumn("project_rid", F.col(rid_column)) 
            else:
                df = df.withColumn("project_rid", F.col("project_fiscal_rid"))
            event_df_project = (
                df
                .withColumn("account_rid", lit(account_rid))
                .withColumn("event_name", lit(event_name))
                .withColumn("event_type_rid", lit(event_type_rid))
                .withColumn("event_status", lit(event_status))
                .withColumn("entity_name", lit(entity_type))
                .withColumn("event_datetime", lit(self.get_date_and_time()))
                .withColumn("created_by", lit(created_by))
                .withColumn("created_by_name", lit(self.get_user_name(created_by)))
                .withColumn("modified_by", lit(modified_by))
                .withColumn("created_datetime", lit(self.get_date_and_time()))
                .withColumn("modified_datetime", lit(self.get_date_and_time()))
                .withColumn("document_rid", lit(document_id))
                .withColumn("descriptions", F.col(description_col))
            )
            if "source_record_count" in df.columns:
                event_df_project = event_df_project.withColumn(
                    "source_record_count", F.col("source_record_count")
                )
            else:
                event_df_project = event_df_project.withColumn(
                    "source_record_count", F.lit(None).cast("int")
                )

            event_df_project = event_df_project.select(
                "account_rid",
                "event_name",
                "event_type_rid",
                "event_status",
                "event_datetime",
                "entity_rid",
                "entity_name",
                "project_rid",
                "created_by",
                "created_by_name",
                "modified_by",
                "created_datetime",
                "modified_datetime",
                "document_rid",
                "descriptions",
                "source_record_count"
            )
        # --------------------------------------------------
        # Decide Timeline Tables
        # --------------------------------------------------
        if entity_type in ["resource", "resource_cost", "resource_skill"]:
            timeline_tables = [
                (event_df_account, config.ACCOUNT_TIMELINE_TABLE)
            ]

        elif entity_type == "project":
            timeline_tables = [
                (event_df_project, config.PROJECT_TIMELINE_TABLE),
                (event_df_account, config.ACCOUNT_TIMELINE_TABLE)
            ]

        else:
            timeline_tables = [
                (event_df_project, config.PROJECT_TIMELINE_TABLE)
            ]

        # --------------------------------------------------
        # JDBC WRITE
        # --------------------------------------------------
        for event_df, timeline_table in timeline_tables:

            table_name = self.get_tenant_table(
                account_r_number,
                timeline_table
            )

            logger.info(
                f"[{entity_type}] Logging events in bulk to {table_name}"
            )
            (
                event_df.write
                .format("jdbc")
                .option("url", config.ENTITY_DB_URL)
                .option("dbtable", table_name)
                .option("user", config.ENTITY_DB_USER)
                .option("password", settings.ENTITY_DB_PASSWORD)
                .option("driver", config.ENTITY_DB_DRIVER)
                .option("batchsize", 100)
                .mode("append")
                .save()
            )

            logger.info(
                f"[{entity_type}] Inserted "
                f"{event_df.count()} records into {table_name}"
            )


    def get_user_name(self, user_rid: str) -> str:
        """Get full user name from user table"""
        try:
            with DBPool.get_connection_mainDB() as conn:
                with conn.cursor() as cursor:
                    query = f"""
                        SELECT first_name, middle_name, last_name
                        FROM {Constants.Database.SCHEMA_MAIN}.{Constants.Tables.USER_MAIN_TABLE}
                        WHERE rid = %s
                    """
                    cursor.execute(query, (user_rid,))
                    row = cursor.fetchone()

                    if not row:
                        return ""

                    first_name, middle_name, last_name = row

                    # Safely concatenate, skipping None/empty values
                    name_parts = [
                        str(first_name).strip() if first_name else "",
                        str(middle_name).strip() if middle_name else "",
                        str(last_name).strip() if last_name else "",
                    ]
                    full_name = " ".join(part for part in name_parts if part)
                    return full_name
        except Exception as e:
            logger.error(f"Error fetching user name for rid {user_rid}: {e}")
            return ""


    def get_staging_records(self, document_rid: str, entity_type: str, account_r_number: str) -> tuple[DataFrame, int]:
        """Get records from staging database with enhanced warning tracking and nullify fields with warnings.
        Returns: (filtered_df, warning_count)
        """
        try:
            # Get the full table name based on entity type
            full_table_name = {
                "resource": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_TABLE),
                "resource_cost": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_COST_TABLE),
                "resource_skill": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_SKILL_TABLE),
                "project": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE),
                "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE),
                "project_task": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TASK_TABLE)
            }.get(entity_type)

            if not full_table_name:
                raise ValueError(f"Unsupported entity type: {entity_type}")

            # JDBC configuration
            jdbc_options = {
                "url": config.ENTITY_DB_URL,
                "dbtable": full_table_name,
                "user": config.ENTITY_DB_USER,
                "password": settings.ENTITY_DB_PASSWORD,
                "driver": config.ENTITY_DB_DRIVER,
                "numPartitions": "10"
            }

            # Validate JDBC config
            missing_keys = [k for k, v in jdbc_options.items() if v is None]
            if missing_keys:
                raise ValueError(f"Missing JDBC config values for: {', '.join(missing_keys)}")

            # Load the data from staging table
            df = self.spark.read.format("jdbc").options(**jdbc_options).load()
            
            # Filter records for the current document_rid and status = Success
            filtered_df = df.filter(
                (F.col("document_rid") == document_rid) & 
                (F.col("status") == "Success")
            )
            # Ensure warning and error columns exist
            if "warning_descriptions" not in filtered_df.columns:
                filtered_df = filtered_df.withColumn("warning_descriptions", F.lit(None))
            if "error_descriptions" not in filtered_df.columns:
                filtered_df = filtered_df.withColumn("error_descriptions", F.lit(None))

            # Extract warnings as structured data
            filtered_df = filtered_df.withColumn(
                "validation_warnings",
                F.when(
                    F.col("warning_descriptions").isNotNull(),
                    F.expr("""
                        transform(
                            split(warning_descriptions, '; '),
                            x -> named_struct(
                                'field', split(x, ': ')[0],
                                'message', split(x, ': ')[1]
                            )
                        )
                    """)
                ).otherwise(F.array())
            )
            # Cache for multiple actions
            filtered_df.persist(StorageLevel.MEMORY_AND_DISK)

            # Handle warning fields by nullifying them
            sample_warnings = filtered_df.select("validation_warnings").limit(10).collect()
            logger.info(f"Sample validation_warnings: {sample_warnings}")
            filtered_df = self.handle_warning_fields(filtered_df)
            # ✅ Count warnings efficiently
            warning_count = filtered_df.filter(F.col("warning_descriptions").isNotNull()).count()
            logger.info(f"warning_count: {warning_count}")
            # Unpersist after actions
            filtered_df.unpersist()

            return filtered_df, warning_count

        except Exception as e:
            logger.error(f"Error getting staging records: {e}", exc_info=True)
            raise

    def handle_warning_fields(self, filtered_df):
        """
        Processes DataFrame to identify and handle fields with validation warnings.
        Sets fields with warnings to NULL, except for cross-field total mismatch warnings.
        
        Args:
            filtered_df: Input DataFrame with warning_descriptions column
            
        Returns:
            DataFrame with warning fields set to NULL and additional tracking columns
        """
        try:
            if "warning_descriptions" not in filtered_df.columns:
                logger.info("No warning_descriptions column found - skipping warning handling")
                return filtered_df
  
            logger.info("Processing fields with validation warnings...")
            
            # Extract fields with warnings
            warning_processed_df = filtered_df.withColumn(
                "field_warnings",
                F.when(
                    F.col("warning_descriptions").isNotNull(),
                    F.expr("""
                        transform(
                            split(warning_descriptions, '; '),
                            x -> named_struct(
                                'field', regexp_extract(trim(x), '^([^:]+):', 1),
                                'message', trim(regexp_replace(x, '^([^:]+):', ''))
                            )
                        )
                    """)
                ).otherwise(F.array())
            )

            sample_warnings = warning_processed_df.select("field_warnings").limit(10).collect()
            logger.info(f"field_warnings validation_warnings: {sample_warnings}")
            
            system_columns = {
                "warning_descriptions", "error_descriptions", "validation_warnings",
                "document_rid", "status", "created_at", "updated_at"
            }
            data_columns = [
                col for col in warning_processed_df.columns 
                if col not in system_columns and col != "field_warnings"
            ]
            
            logger.info(f"Setting NULLs for warning fields among: {data_columns}")
            
            # Excluded warning messages (don’t nullify values for these)
            excluded_messages = [
                "total_cost must equal total_fte_cost + total_sub_con_cost + total_non_labor_cost",
                "total_hours must equal total_fte_effort_in_hrs + total_sub_con_effort_in_hrs"
            ]

            # Nullify only if the warning is not in excluded list
            for col_name in data_columns:
                warning_processed_df = warning_processed_df.withColumn(
                    col_name,
                    F.when(
                        F.exists(
                            F.col("field_warnings"),
                            lambda fw: (fw["field"] == col_name) & (~F.array_contains(F.array([F.lit(m) for m in excluded_messages]), fw["message"]))
                        ),
                        F.lit(None)
                    ).otherwise(F.col(col_name))
                )
            
            warning_processed_df = warning_processed_df.withColumn(
                "warning_fields_count",
                F.size(F.col("field_warnings"))
            )
            
            result_df = warning_processed_df.drop("field_warnings")
            result_df = result_df.drop("warning_descriptions")
            result_df = result_df.drop("error_descriptions")             
            return result_df
            
        except Exception as e:
            logger.error(f"Error processing warning fields: {str(e)}")
            raise

    def map_resource_ref_to_rid(self, df: DataFrame, account_r_number: str) -> DataFrame:
        table_name = self.get_tenant_table(account_r_number, config.PROD_RESOURCE_TABLE)
        resource_df = self.spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", table_name) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .select("resource_code", "account_rid", "rid")

        # Ensure account_rid exists in input
        if "account_rid" not in df.columns:
            raise ValueError("❌ 'account_rid' column is required in the input DataFrame")

        # Join on both resource_code and account_rid
        df = df.join(
            resource_df,
            on=["resource_code", "account_rid"],
            how="left"
        )

        # Replace resource_rid safely
        if "resource_rid" in df.columns:
            df = df.drop("resource_rid")
        df = df.withColumnRenamed("rid", "resource_rid")

        return df

    def map_fiscal_rid_with_data_by_rid(self, df: DataFrame, entity_type: str, account_r_number: str, fiscal_year: int) -> DataFrame:
        """
        Maps project_fiscal_rid or project_resource_fiscal_rid to the input DataFrame
        based on fiscal entity_type and available keys (like project_code, fiscal_year, resource_code).
        """
        df = df.withColumn("fiscal_year",lit(fiscal_year))
        def read_fiscal_mapping_table(table_name: str, selected_columns: list):
            return self.spark.read \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", table_name) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .select(*selected_columns)

        if entity_type == "project":
            table_name = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
            selected_columns = ["account_rid", "project_rid", "fiscal_year", "rid"]
            join_keys = ["account_rid", "project_rid", "fiscal_year"]

            fiscal_df = read_fiscal_mapping_table(table_name, selected_columns).dropDuplicates(join_keys)

            for key in join_keys:
                if key not in df.columns:
                    raise ValueError(f"❌ Missing required column '{key}' in input DataFrame")
            df = df.join(fiscal_df, on=join_keys, how="left") \
                .withColumn("project_fiscal_rid", col("rid")) \
                .drop("rid")

        elif entity_type in ["project_resource", "project_task"]:
            # ✅ Step 1: First map project_fiscal_rid
            df = self.map_fiscal_rid_with_data_by_rid(df, "project", account_r_number, fiscal_year)
        else:
            raise ValueError(f"❌ Invalid fiscal entity_type: {entity_type}")

        return df

    def map_fiscal_rid_with_data(self, df: DataFrame, entity_type: str, account_r_number: str, fiscal_year: int) -> DataFrame:
        """
        Maps project_fiscal_rid or project_resource_fiscal_rid to the input DataFrame
        based on fiscal entity_type and available keys (like project_code, fiscal_year, resource_code).
        """
        df = df.withColumn("fiscal_year",lit(fiscal_year))
        def read_fiscal_mapping_table(table_name: str, selected_columns: list):
            return self.spark.read \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", table_name) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .select(*selected_columns)

        if entity_type == "project":
            table_name = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
            selected_columns = ["account_rid", "project_code", "fiscal_year", "rid"]
            join_keys = ["account_rid", "project_code", "fiscal_year"]

            fiscal_df = read_fiscal_mapping_table(table_name, selected_columns).dropDuplicates(join_keys)

            for key in join_keys:
                if key not in df.columns:
                    raise ValueError(f"❌ Missing required column '{key}' in input DataFrame")

            df = df.join(fiscal_df, on=join_keys, how="left") \
                .withColumn("project_fiscal_rid", col("rid")) \
                .drop("rid")

        elif entity_type in ["project_resource", "project_task"]:
            # ✅ Step 1: First map project_fiscal_rid
            df = self.map_fiscal_rid_with_data(df, "project", account_r_number, fiscal_year)
        else:
            raise ValueError(f"❌ Invalid fiscal entity_type: {entity_type}")

        return df

    def map_entity_rid_with_data(self, df: DataFrame, entity_type: str, account_r_number: str) -> DataFrame:
        """Dynamically maps rid to resource_rid, project_rid, or project_resource_rid based on entity_type and account_r_number."""

        def read_mapping_table(table_name: str, selected_columns: list):
            return self.spark.read \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", table_name) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .select(*selected_columns)

        if entity_type == "project_resource":
            # Step 1: Map project_rid
            df = self.map_entity_rid_with_data(df, "project", account_r_number)

            # Step 2: Map resource_rid
            df = self.map_entity_rid_with_data(df, "resource", account_r_number)

        elif entity_type == "project":
            table_name = self.get_tenant_table(account_r_number, config.PROD_PROJECT_TABLE)
            selected_columns = ["project_code", "account_rid", "rid"]
            join_keys = ["project_code", "account_rid"]

            entity_df = read_mapping_table(table_name, selected_columns)
            entity_df = entity_df.dropDuplicates(join_keys)

            for key in join_keys:
                if key not in df.columns:
                    raise ValueError(f"❌ Missing required column '{key}' in input DataFrame")

            df = df.join(entity_df, on=join_keys, how="left") \
                .withColumn("project_rid", col("rid")) \
                .drop("rid")

        elif entity_type in ["resource", "resource_cost", "resource_skill"]:
            table_name = self.get_tenant_table(account_r_number, config.PROD_RESOURCE_TABLE)
            selected_columns = ["resource_code", "account_rid", "rid"]
            join_keys = ["resource_code", "account_rid"]

            entity_df = read_mapping_table(table_name, selected_columns)
            entity_df = entity_df.dropDuplicates(join_keys)

            for key in join_keys:
                if key not in df.columns:
                    raise ValueError(f"❌ Missing required column '{key}' in input DataFrame")

            df = df.join(entity_df, on=join_keys, how="left") \
                .withColumn("resource_rid", col("rid")) \
                .drop("rid")

        else:
            raise ValueError(f"❌ Invalid entity_type: {entity_type}")

        return df
        
    def map_entity_fiscal_rid_and_r_number_with_data(self, df: DataFrame, entity_type: str, account_r_number: str) -> DataFrame:
        """Maps fiscal rid (project_fiscal_rid or resource_fiscal_rid) using code, account_rid, and fiscal_year.
        Also maps r_number as project_number/resource_number.
        """
        logger.info("🔄 Mapping fiscal rid using r_number and fiscal year...")

        if entity_type in ["resource", "resource_cost", "resource_skill"]:
            table_name = self.get_tenant_table(account_r_number, config.PROD_RESOURCE_FISCAL_TABLE)
            join_key = "rid"
            target_column = "resource_fiscal_rid"
            code_column = "resource_code"
            r_number_column = "r_number"
        elif entity_type in ["project"]:
            table_name = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
            join_key = "rid"
            target_column = "project_fiscal_rid"
            code_column = "project_code"
            r_number_column = "r_number"
        else:
            raise ValueError(f"❌ Invalid entity_type: {entity_type}")

        # Alias entity_df columns to avoid ambiguity
        entity_df = self.spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", table_name) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .select(
                col(code_column).alias(f"{code_column}_entity"),
                col("account_rid").alias("account_rid_entity"),
                col("fiscal_year").alias("fiscal_year_entity"),
                col(join_key),
                col(r_number_column)
            )

        # logger.info(f"[{entity_type}] Fiscal entity_df count: {entity_df.count()}")
        logger.info(f"[{entity_type}] EntityDF Columns: {entity_df.columns}")
        logger.info(f"[{entity_type}] DF Columns: {df.columns}")

        # Join on code, fiscal_year, account_rid
        df = df.join(
            entity_df,
            (df[code_column] == entity_df[f"{code_column}_entity"]) &
            (df["account_rid"] == entity_df["account_rid_entity"]) &
            (df["fiscal_year"] == entity_df["fiscal_year_entity"]),
            how="left"
        ).withColumn(target_column, col(join_key)) \
        .withColumn(r_number_column, col(r_number_column)) \
        .drop(
            f"{code_column}_entity", "account_rid_entity", "fiscal_year_entity", join_key
        )

        logger.info(f"✅ Successfully mapped {target_column} and {r_number_column}")
        return df

    def map_entity_fiscal_rid(self, df: DataFrame, entity_type: str, account_r_number: str) -> DataFrame:
        """Dynamically maps rid to resource_rid or project_rid based on entity type, including fiscal year and account_rid."""
        
        if entity_type in ["resource", "resource_cost", "resource_skill"]:
            table_name = self.get_tenant_table(account_r_number, config.PROD_RESOURCE_FISCAL_TABLE)
            join_key = "rid"
            target_column = "resource_rid"
            code_column = "resource_code"
        elif entity_type in ["project", "project_resource"]:
            table_name = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
            join_key = "rid"
            target_column = "project_fiscal_rid"
            code_column = "project_code"
        else:
            raise ValueError(f"❌ Invalid entity_type: {entity_type}")

        # Load entity mapping from database including fiscal_year and account_rid
        entity_df = self.spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", table_name) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .select(
                col(code_column).alias(f"entity_{code_column}"),
                col(join_key),
                col("fiscal_year").alias("entity_fiscal_year"),
                col("account_rid").alias("entity_account_rid")
            )
        
        if entity_df is not None and not entity_df.rdd.isEmpty():
            entity_df.persist(StorageLevel.MEMORY_AND_DISK)
        
        logger.info(f"entity_df count: {entity_df.count()}")
        logger.info(f"EntityDF Columns: {entity_df.columns}")

        # Ensure required columns exist
        required_columns = ["fiscal_year", "account_rid", code_column]
        for col_name in required_columns:
            if col_name not in df.columns:
                raise ValueError(f"❌ '{col_name}' column is required in the input DataFrame")

        logger.info(f"Input DF Columns: {df.columns}")

        # Perform left join on code, fiscal_year, and account_rid
        df = df.join(
            entity_df,
            on=[
                df[code_column] == entity_df[f"entity_{code_column}"],
                df["fiscal_year"] == entity_df["entity_fiscal_year"],
                df["account_rid"] == entity_df["entity_account_rid"]
            ],
            how="left"
        ).withColumn(target_column, col(join_key)) \
        .drop(join_key, f"entity_{code_column}", "entity_fiscal_year", "entity_account_rid")

        matched_count = df.filter(col(target_column).isNotNull()).count()
        logger.info(f"✅ Successfully mapped {matched_count} records with fiscal year and account_rid matching")
        logger.info(f"count01: {df.count()}")
        if entity_df is not None:
            entity_df.unpersist()
        return df
    
    def map_entity_rid_and_r_number_with_data(self, df: DataFrame, entity_type: str, account_r_number: str, account_rid: str) -> DataFrame:
        """Dynamically maps rid to resource_rid or project_rid based on entity type.
        Also maps r_number as project_number when entity is project/project_resource.
        """
        logger.info("calling... r_number")

        if entity_type in ["resource", "resource_cost", "resource_skill"]:
            table_name = self.get_tenant_table(account_r_number, config.PROD_RESOURCE_TABLE)
            join_key = "rid"
            target_column = "resource_rid"
            column_name = "resource_code"
            r_number_column = "r_number"
            account_rid_column = "account_rid"
            select_cols = [column_name, join_key, r_number_column, account_rid_column]

            entity_df = self.spark.read \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", table_name) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .filter(F.col("account_rid") == account_rid) \
                .select(*select_cols)

            df = df.join(entity_df, on=[column_name, account_rid_column], how="left") \
                .withColumn(target_column, col(join_key)) \
                .drop(join_key)

            if entity_type in ["resource_cost", "resource_skill"]:
                df = df.withColumn("resource_number", col(r_number_column)).drop(r_number_column)
            logger.info(f"count : {df.count()}")

        elif entity_type == "project":
            table_name = self.get_tenant_table(account_r_number, config.PROD_PROJECT_TABLE)
            join_key = "rid"
            target_column = "project_rid"
            column_name = "project_code"
            r_number_column = "r_number"
            account_rid_column = "account_rid"
            select_cols = [column_name, join_key, r_number_column, account_rid_column]

            entity_df = self.spark.read \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", table_name) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .filter(F.col("account_rid") == account_rid) \
                .select(*select_cols)

            df = df.join(entity_df, on=[column_name, account_rid_column], how="left") \
                .withColumn(target_column, col(join_key)) \
                .drop(join_key)

            df = df.withColumn("project_number", col(r_number_column)).drop(r_number_column)

        elif entity_type in ["project_resource", "project_task"]:
            # First join with project to get project_rid and project_number
            project_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_TABLE)
            project_df = self.spark.read \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", project_table) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .filter(F.col("account_rid") == account_rid) \
                .select("project_code", "rid", "r_number", "account_rid", "status_rid", "project_startdate", "project_enddate") \
                .dropDuplicates(["project_code", "account_rid"])  # optional deduplication

            project_df = project_df \
                .withColumnRenamed("status_rid", "project_status_rid") \
                .withColumn("project_number", col("r_number")) \
                .drop("rid", "r_number")

            df = df.join(project_df, on=["project_code", "account_rid"], how="left")



            # Now join with resource to get resource_rid
            resource_table = self.get_tenant_table(account_r_number, config.PROD_RESOURCE_TABLE)
            resource_df = self.spark.read \
                .format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", resource_table) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .filter(F.col("account_rid") == account_rid) \
                .select("resource_code", "rid", "account_rid","status_rid", "resource_startdate","resource_enddate") \
                .dropDuplicates(["resource_code", "account_rid"])

            resource_df = resource_df \
                .withColumnRenamed("status_rid", "resource_status_rid") \
                .drop("rid")

            df = df.join(resource_df, on=["resource_code", "account_rid"], how="left")

            if entity_type == "project_task":
                logger.info(f"[project_task] 🚀 Starting project task entity rid handling...")

                # Bring project_resource rid -> project_resource_rid along with extra fields
                project_resource_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_RESOURCE_TABLE)
                project_resource_df = self.spark.read \
                    .format("jdbc") \
                    .option("url", config.ENTITY_DB_URL) \
                    .option("dbtable", project_resource_table) \
                    .option("user", config.ENTITY_DB_USER) \
                    .option("password", settings.ENTITY_DB_PASSWORD) \
                    .option("driver", config.ENTITY_DB_DRIVER) \
                    .load() \
                    .filter(F.col("account_rid") == account_rid) \
                    .select(
                        "project_fiscal_rid",
                        "resource_rid",
                        "account_rid",
                        "rid",
                        "project_resource_role",
                        "created_datetime"
                    )

                # Get the latest record for each project_fiscal_rid + resource_rid + project_resource_role combination
                window_spec = Window.partitionBy("project_fiscal_rid", "resource_rid", "project_resource_role").orderBy(F.desc("created_datetime"))
                latest_project_resource_df = project_resource_df \
                    .withColumn("row_num", F.row_number().over(window_spec)) \
                    .filter(F.col("row_num") == 1) \
                    .drop("row_num", "created_datetime")

                # Store the original column names before renaming
                original_columns = latest_project_resource_df.columns
                
                # Rename all columns with lookup_ prefix
                for col_name in original_columns:
                    latest_project_resource_df = latest_project_resource_df.withColumnRenamed(col_name, f"lookup_{col_name}")

                # **SMART JOIN STRATEGY**
                if "project_resource_role" in df.columns and df.filter(F.col("project_resource_role").isNotNull() & (F.col("project_resource_role") != "")).count() > 0:
                    logger.info("[project_task] Using role-based join (exact role match)")

                    df_with_role = df.filter(F.col("project_resource_role").isNotNull() & (F.col("project_resource_role") != ""))
                    df_without_role = df.filter(F.col("project_resource_role").isNull() | (F.col("project_resource_role") == ""))

                    if not df_with_role.rdd.isEmpty():

                        join_condition = (
                            (df_with_role["project_fiscal_rid"] == latest_project_resource_df["lookup_project_fiscal_rid"]) &
                            (df_with_role["resource_rid"] == latest_project_resource_df["lookup_resource_rid"]) &
                            (df_with_role["account_rid"] == latest_project_resource_df["lookup_account_rid"]) &
                            (df_with_role["project_resource_role"] == latest_project_resource_df["lookup_project_resource_role"])
                        )

                        df_with_role_matched = df_with_role.join(
                            latest_project_resource_df,
                            on=join_condition,
                            how="left"
                        )

                    else:
                        df_with_role_matched = self.spark.createDataFrame([], df.schema)
                else:
                    logger.info("[project_task] No role specified in incoming data") 
                    df_with_role = self.spark.createDataFrame([], df.schema)
                    df_without_role = df
                    df_with_role_matched = self.spark.createDataFrame([], df.schema)

                # Case 2: Records without role → latest role
                if not df_without_role.rdd.isEmpty():
                    window_spec_single = Window.partitionBy("project_fiscal_rid", "resource_rid").orderBy(F.desc("created_datetime"))
                    single_role_df = project_resource_df \
                        .withColumn("row_num", F.row_number().over(window_spec_single)) \
                        .filter(F.col("row_num") == 1) \
                        .drop("row_num", "created_datetime")

                    for col_name in single_role_df.columns:
                        single_role_df = single_role_df.withColumnRenamed(col_name, f"lookup_{col_name}")
                    
                    logger.info(f"[project_task] Renamed columns in single_role_df: {single_role_df.columns}")

                    join_condition_no_role = (
                        (df_without_role["project_fiscal_rid"] == single_role_df["lookup_project_fiscal_rid"]) &
                        (df_without_role["resource_rid"] == single_role_df["lookup_resource_rid"]) &
                        (df_without_role["account_rid"] == single_role_df["lookup_account_rid"])
                    )

                    df_without_role_matched = df_without_role.join(
                        single_role_df,
                        on=join_condition_no_role,
                        how="left"
                    )
                else:
                    df_without_role_matched = self.spark.createDataFrame([], df.schema)

                # Combine both cases
                combined_dfs = []
                if not df_with_role_matched.rdd.isEmpty():
                    combined_dfs.append(df_with_role_matched)
                if not df_without_role_matched.rdd.isEmpty():
                    combined_dfs.append(df_without_role_matched)

                if combined_dfs:
                    df = combined_dfs[0]
                    for next_df in combined_dfs[1:]:
                        df = df.unionByName(next_df, allowMissingColumns=True)
                else:
                    df = self.spark.createDataFrame([], df.schema)

                # Final mapping
                df = df.withColumn("project_resource_rid", F.col("lookup_rid")).drop("lookup_rid")

                lookup_columns = [col for col in df.columns if col.startswith("lookup_")]
                if lookup_columns:
                    logger.info(f"[project_task] Dropping lookup columns: {lookup_columns}")
                    df = df.drop(*lookup_columns)

                # Add flag for mapping status
                df = df.withColumn("is_mapped", F.when(F.col("project_resource_rid").isNotNull(), F.lit("YES")).otherwise(F.lit("NO")))

                # Logging stats
                total_count = df.count()
                mapped_count = df.filter(F.col("is_mapped") == "YES").count()
                unmapped_count = df.filter(F.col("is_mapped") == "NO").count()

                logger.info(f"[project_task] ✅ Mapping complete → Total: {total_count}, Mapped: {mapped_count}, Not Mapped: {unmapped_count}")

                logger.info("[project_task] 🔎 Sample of final DataFrame after mapping:")
                # df.show(20, truncate=False)

        else:
            raise ValueError(f"❌ Invalid entity_type: {entity_type}")

        return df

    def upsert_project_summary(self, incoming_df: DataFrame, entity_type: str, 
                            account_r_number: str, account_rid: str, 
                            fiscal_year: int, modified_by: str):
        """Upsert project summary data with proper column references and change detection"""
        try:
            if incoming_df is not None and not incoming_df.rdd.isEmpty():
                incoming_df.persist(StorageLevel.MEMORY_AND_DISK)
            logger.info("🔄 Starting project summary upsert process...")
            logger.info(f"Incoming record count: {incoming_df.count()}")
            if incoming_df is not None:
                incoming_df.unpersist()
            # Step 1: Map project_rid and project_number
            mapped_df = self.map_entity_rid_and_r_number_with_data(incoming_df, entity_type, account_r_number, account_rid)
            # logger.info(f"Mapped record count: {mapped_df.count()}")
            
            if "project_number" in mapped_df.columns:
                logger.info("Renaming project_number to r_number")
                mapped_df = mapped_df.withColumnRenamed("project_number", "r_number")

            # Step 2: Rename columns safely
            column_mapping = {
                "spoc_name": "project_point_of_contact",
                "project_tech_poc_name": "technical_point_of_contact"
            }
            for old_name, new_name in column_mapping.items():
                if old_name in mapped_df.columns:
                    mapped_df = mapped_df.withColumnRenamed(old_name, new_name)

            # Step 3: Add metadata columns
            metadata_columns = {
                "fiscal_year": lit(fiscal_year),
                "created_datetime": self.get_date_and_time(),
                "created_by": lit(modified_by),
                "financial_consultant": lit(None),
                "qre_potential": lit(None),
                "is_rd_qualified": lit(False)
            }
            for col_name, col_expr in metadata_columns.items():
                if col_name not in mapped_df.columns:
                    mapped_df = mapped_df.withColumn(col_name, col_expr)

            # Step 4: Select final columns
            final_columns = [
                "project_rid", "r_number", "project_code", "account_rid",
                "program_name", "project_name", "project_startdate",
                "project_enddate", "currency_rid", "industry_name", 
                "industry_rid", "country_rid", "region_rid", 
                "technical_point_of_contact", "project_point_of_contact",
                "project_type_rid", "project_classification_rid",
                "project_classification_other", "project_client_group",
                "project_group", "total_effort", "total_cost", 
                "total_fte", "total_subcon", "total_cost_fte", 
                "total_cost_subcon", "total_cost_nonlabor", 
                "project_description", "comments", "qre",
                "is_rd_qualified", "blended_rate_fte", 
                "blended_rate_subcon", "blended_rate", 
                "assessment_status", "created_datetime", 
                "created_by", "status_rid"
            ]
            final_df = mapped_df.select(*[col(c) for c in final_columns])

            # Step 5: Get existing data
            table_name = self.get_public_table(config.PROJECT_SUMMARY_TABLE)
            join_keys = ["project_code", "account_rid", "project_rid"]
            
            # Read only necessary columns from existing data
            existing_df = (
                self.spark.read.format("jdbc")
                .option("url", config.MAIN_DB_URL)
                .option("dbtable", 
                    f"(SELECT rid, {', '.join(final_columns)} FROM {table_name} " +
                    f"WHERE account_rid = '{account_rid}') AS existing")
                .option("user", config.MAIN_DB_USER)
                .option("password", settings.MAIN_DB_PASSWORD)
                .option("driver", config.ENTITY_DB_DRIVER)
                .load()
            )

            # Step 6: Join and identify changes
            joined_df = final_df.alias("new").join(
                existing_df.alias("old"), 
                join_keys, 
                "left"
            )

            # Step 7: Create conditions for changed columns
            protected_columns = {"rid", "created_by", "created_datetime"}
            change_conditions = []
            
            for col_name in final_columns:
                if col_name not in join_keys and col_name not in protected_columns:
                    new_col = col(f"new.{col_name}")
                    old_col = col(f"old.{col_name}")
                    change_conditions.append(
                        (new_col.isNotNull() & old_col.isNull()) |
                        (new_col.isNull() & old_col.isNotNull()) |
                        (new_col != old_col)
                    )

            # Combine all change conditions with OR
            has_changes = reduce(lambda a, b: a | b, change_conditions) if change_conditions else lit(False)
            updates = joined_df.filter(
                col("old.rid").isNotNull() & has_changes
            ).select(
                col("old.rid").alias("rid"),
                *[col(f"new.{k}") for k in join_keys],
                *[col(f"new.{c}").alias(c) for c in final_columns if c not in join_keys]
            ).persist(StorageLevel.MEMORY_AND_DISK)

            has_updates = bool(not updates.rdd.isEmpty())
            logger.info("✅ Checked for records needing updates.")

                # Step 8: Create inserts DataFrame for new records
            inserts = joined_df.filter(
                col("old.rid").isNull()
            ).select(
                *[col(f"new.{c}").alias(c) for c in final_columns]
            ).persist(StorageLevel.MEMORY_AND_DISK)

            has_inserts = bool(not inserts.rdd.isEmpty())
            logger.info("✅ Checked for new records to insert.")

            # Step 9: Execute operations
            if has_inserts:
                logger.info("🚀 Processing inserts...")
                self._execute_batch_insert(inserts, table_name)
            if inserts is not None:
                inserts.unpersist()

            # if has_updates:
            #     logger.info("🔄 Processing updates...")
            #     self._execute_batch_update(updates, table_name, join_keys, modified_by)
            if updates is not None:
                updates.unpersist()

            logger.info("✅ Project summary upsert completed successfully")
            return True

        except Exception as e:
            logger.error(f"❌ Project summary upsert failed: {str(e)}", exc_info=True)
            raise

    def _execute_batch_insert(self, df: DataFrame, table_name: str):
        """Execute batch insert operation safely"""
        df.write.format("jdbc") \
            .option("url", config.MAIN_DB_URL) \
            .option("dbtable", table_name) \
            .option("user", config.MAIN_DB_USER) \
            .option("password", settings.MAIN_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .option("batchsize", 100) \
            .option("stringtype", "unspecified") \
            .mode("append") \
            .save()

    def _execute_batch_update(self, df: DataFrame, table_name: str, where_keys: list, modified_by: str):
        """Execute batch update operation without overwriting existing data 
        EXCEPT cost/effort fields, which are allowed to be NULL."""
        
        # Add metadata
        df = df.withColumn("modified_by", F.lit(modified_by))
        df = df.withColumn("modified_datetime", F.lit(self.get_date_and_time()))

        # Columns that must not be updated
        protected_columns = {"rid", "eid", "created_by", "created_datetime"}

        # Boolean fields
        boolean_columns = {"is_rd_qualified"}
        if "auto_send_ai_interaction" in df.columns:
            boolean_columns.add("auto_send_ai_interaction")
        if "auto_access_rd" in df.columns:
            boolean_columns.add("auto_access_rd")

        # Cost/Effort fields that allow NULL updates
        nullable_cost_effort_cols = {
            "total_effort_prj",
            "total_cost_prj",
            "total_fte_prj",
            "total_subcon_prj",
            "total_effort_fte_prj",
            "total_cost_fte_prj",
            "total_effort_subcon_prj",
            "total_cost_subcon_prj",
            "total_cost_nonlabor_prj",
            "total_effort_fte_from_prj_res",
            "total_effort_subcon_from_prj_res",
            "total_cost_fte_from_prj_res",
            "total_cost_subcon_from_prj_res",
            "total_cost_nonlabor_from_prj_res",
            "total_cost_from_tasks",
            "total_effort_from_tasks",
        }

        # Convert DF to pandas for row-wise processing
        updates_pd = df.toPandas()

        with DBPool.get_connection_mainDB() as conn:
            with conn.cursor() as cursor:

                for _, row in updates_pd.iterrows():
                    set_clause_parts = []
                    set_values = []

                    # Iterate all columns
                    for col_name in df.columns:

                        if col_name in where_keys or col_name in protected_columns:
                            continue

                        val = row[col_name]

                        # ========== SPECIAL LOGIC: COST/EFFORT FIELDS (ALLOW NULL) ==========
                        if col_name in nullable_cost_effort_cols:
                            set_clause_parts.append(f"{col_name} = %s")

                            if pd.isna(val):
                                set_values.append(None)
                            else:
                                set_values.append(float(val) if isinstance(val, (int, float)) else val)
                            
                            continue
                        # ==================================================================

                        # Skip NULL for all other fields
                        if pd.notna(val):
                            if col_name in boolean_columns:
                                set_clause_parts.append(f"{col_name} = %s::boolean")
                                set_values.append(bool(val))

                            elif isinstance(val, (float, int, Decimal)):
                                set_clause_parts.append(f"{col_name} = %s")
                                set_values.append(float(val))

                            elif isinstance(val, str):
                                set_clause_parts.append(f"{col_name} = %s")
                                set_values.append(val)

                            elif hasattr(val, 'isoformat'):  # datetime
                                set_clause_parts.append(f"{col_name} = %s")
                                set_values.append(val.isoformat())

                            else:
                                set_clause_parts.append(f"{col_name} = %s")
                                set_values.append(str(val))

                    logger.info(f"set_clause_parts- {set_clause_parts}")

                    # Build WHERE clause
                    where_clause = " AND ".join([f"{col} = %s" for col in where_keys])
                    where_values = [row[col] for col in where_keys]

                    # If only metadata fields → skip
                    if len(set_clause_parts) <= 2:
                        logger.debug("No data fields to update for this row")
                        continue

                    # Final SQL
                    update_sql = f"""
                        UPDATE {table_name}
                        SET {", ".join(set_clause_parts)}
                        WHERE {where_clause}
                    """

                    all_values = set_values + where_values
                    logger.info(f"all_values- {all_values}")

                    try:
                        logger.info(f"Executing update: {update_sql}")
                        cursor.execute(update_sql, all_values)
                    except Exception as e:
                        logger.error(f"Failed to execute update: {str(e)}")
                        logger.error(f"SQL was: {update_sql}")
                        logger.error(f"Values were: {all_values}")
                        raise

            conn.commit()

    def upsert_project_summary_by_project_resource(self, df: DataFrame, entity_type: str, 
                                               account_r_number: str, account_rid: str, fiscal_year: int, modified_by: str):
        try:
            logger.info("Upsert process started for project_summary table")
            audit_columns = {
                "created_datetime": self.get_date_and_time(),
                "created_by": modified_by,
                "modified_by": modified_by,
                "account_rid": account_rid
            }

            # 1. Drop duplicates based on project_code
            df = df.dropDuplicates(["project_code"])

            # 2. Trim project_code
            df = df.withColumn("project_code", trim(col("project_code")))

            # 3. Enrich with project_rid and r_number using existing mapping utility
            df = self.map_entity_rid_and_r_number_with_data(df, entity_type, account_r_number, account_rid)
            if "project_number" in df.columns:
                logger.info("Renaming project_number to r_number")
                df = df.withColumnRenamed("project_number", "r_number")
            # 4. Add audit columns
            for col_name, col_value in audit_columns.items():
                df = df.withColumn(col_name, lit(col_value))
                final_columns = [
                "project_rid", "r_number", "project_code", "account_rid",
                "project_name", "project_startdate",
                "project_enddate", "currency_rid", 
                "region_rid",
                "created_datetime", 
                "created_by", "status_rid"
            ]
            final_df = df.select(*[col(c) for c in final_columns])
            final_columns = final_df.columns
            table_name = self.get_public_table(config.PROJECT_SUMMARY_TABLE)
            join_keys = ["project_code", "account_rid", "project_rid"]
            
            # Read only necessary columns from existing data
            existing_df = (
                self.spark.read.format("jdbc")
                .option("url", config.MAIN_DB_URL)
                .option(
                    "dbtable",
                    f"(SELECT rid, {', '.join(final_columns)} FROM {table_name} WHERE account_rid = '{account_rid}') existing"
                )
                .option("user", config.MAIN_DB_USER)
                .option("password", settings.MAIN_DB_PASSWORD)
                .option("driver", config.ENTITY_DB_DRIVER)
                .load()
            )
            # Step 6: Join and identify changes
            joined_df = final_df.alias("new").join(
                existing_df.alias("old"), 
                join_keys, 
                "left"
            )

            # Step 7: Create conditions for changed columns
            protected_columns = {"rid", "created_by", "created_datetime"}
            change_conditions = []
            
            for col_name in final_columns:
                if col_name not in join_keys and col_name not in protected_columns:
                    new_col = col(f"new.{col_name}")
                    old_col = col(f"old.{col_name}")
                    change_conditions.append(
                        (new_col.isNotNull() & old_col.isNull()) |
                        (new_col.isNull() & old_col.isNotNull()) |
                        (new_col != old_col)
                    )

            # Combine all change conditions with OR
            has_changes = reduce(lambda a, b: a | b, change_conditions) if change_conditions else lit(False)

            # Create updates DataFrame with only changed records
            updates = joined_df.filter(
                col("old.rid").isNotNull() & has_changes
            ).select(
                col("old.rid").alias("rid"),
                *[col(f"new.{k}") for k in join_keys],
                *[col(f"new.{c}").alias(c) for c in final_columns if c not in join_keys]
            )
            if updates is not None and not updates.rdd.isEmpty():
                updates.persist(StorageLevel.MEMORY_AND_DISK)

            updates_count = updates.limit(1).count()
            logger.info(f"Records needing updates: {updates_count}")

            # Step 8: Create inserts DataFrame for new records
            inserts = joined_df.filter(col("old.rid").isNull()).select(
                *[col(f"new.{c}").alias(c) for c in final_columns]
            )
            if inserts is not None and not inserts.rdd.isEmpty():
                inserts.persist(StorageLevel.MEMORY_AND_DISK)

            inserts_count = inserts.limit(1).count()
            logger.info(f"New records to insert: {inserts_count}")

            # Step 9: Execute operations
            if inserts_count > 0:
                logger.info("Processing inserts...")
                self._execute_batch_insert(inserts, table_name)

            if updates_count > 0:
                logger.info("Processing updates...")
                self._execute_batch_update(updates, table_name, join_keys, modified_by)

            logger.info("Upsert process completed for project_summary table")
            if inserts is not None:
                inserts.unpersist()
            if updates is not None:
                updates.unpersist()
            return True
        except Exception as e:
            logger.error(f"Error during upsert_project_summary_by_project_resource: {str(e)}")
            raise

    def upsert_project_fiscal_summary(self, incoming_df: DataFrame, entity_type: str, 
                                  account_r_number: str, account_rid: str, 
                                  fiscal_year: int, modified_by: str):
        """Upsert project fiscal summary data with proper change detection."""
        try:
            logger.info("🔄 Starting project fiscal summary upsert process...")
            # logger.info(f"Incoming record count: {incoming_df.count()}")

            # Step 1: Map project_rid and project_fiscal_rid
            mapped_df = self.map_entity_rid_and_r_number_with_data(incoming_df, entity_type, account_r_number, account_rid)
            mapped_df = mapped_df.withColumn("fiscal_year", lit(fiscal_year))
            mapped_df = self.map_entity_fiscal_rid_and_r_number_with_data(mapped_df, entity_type, account_r_number)
            # Step 2: Rename columns
            column_mapping = {
                "total_effort": "total_effort_prj",
                "total_cost": "total_cost_prj",
                "spoc_name": "project_point_of_contact",
                "spoc_email": "project_point_of_contact_email",
                "project_tech_poc_name": "technical_point_of_contact",
                "project_tech_poc_email": "technical_point_of_contact_email",
                "total_fte": "total_fte_prj",
                "total_subcon": "total_subcon_prj",
                "total_effort_fte": "total_effort_fte_prj",
                "total_cost_fte": "total_cost_fte_prj",
                "total_effort_subcon": "total_effort_subcon_prj",
                "total_cost_subcon": "total_cost_subcon_prj",
                "total_cost_nonlabor": "total_cost_nonlabor_prj",
                "qre": "qre_final"
            }
            for old_name, new_name in column_mapping.items():
                if old_name in mapped_df.columns:
                    mapped_df = mapped_df.withColumnRenamed(old_name, new_name)

            # Step 3: Add metadata
            current_time = self.get_date_and_time()
            metadata_columns = {
                "fiscal_year": lit(fiscal_year),
                "created_datetime": self.get_date_and_time(),
                "created_by": lit(modified_by),
                "financial_consultant": lit(None),
                "qre_potential": lit(None),
                "is_rd_qualified": lit(False)
            }
            for col_name, col_expr in metadata_columns.items():
                if col_name not in mapped_df.columns:
                    mapped_df = mapped_df.withColumn(col_name, col_expr)

            # Step 4: Prepare final dataframe
            final_df = self._prepare_final_dataframe(mapped_df, account_rid, account_r_number)
            final_columns = final_df.columns
            join_keys = ["account_rid", "project_rid", "project_fiscal_rid", "fiscal_year"]
            table_name = self.get_public_table(config.PROJECT_FISCAL_SUMMARY_TABLE)

            # Step 5: Read existing data
            existing_df = (
                self.spark.read.format("jdbc")
                    .option("url", config.MAIN_DB_URL)
                    .option("dbtable", f"(SELECT rid, {', '.join(final_columns)} FROM {table_name}) AS existing")
                    .option("user", config.MAIN_DB_USER)
                    .option("password", settings.MAIN_DB_PASSWORD)
                    .option("driver", config.ENTITY_DB_DRIVER)
                    .load()
            )
            # Step 6: Join incoming and existing data
            joined_df = final_df.alias("new").join(existing_df.alias("old"), join_keys, "left")

            # Step 7: Detect changed records
            protected_columns = {"rid", "created_by", "created_datetime"}
            change_conditions = []
            for col_name in final_columns:
                if col_name not in join_keys and col_name not in protected_columns:
                    change_conditions.append(
                        (col(f"new.{col_name}").isNotNull() & col(f"old.{col_name}").isNull()) |
                        (col(f"new.{col_name}").isNull() & col(f"old.{col_name}").isNotNull()) |
                        (col(f"new.{col_name}") != col(f"old.{col_name}"))
                    )

            has_changes = reduce(lambda a, b: a | b, change_conditions) if change_conditions else lit(False)

            updates = joined_df.filter(
                col("old.rid").isNotNull() & has_changes
            ).select(
                col("old.rid").alias("rid"),
                *[col(f"new.{k}") for k in join_keys],
                *[col(f"new.{c}").alias(c) for c in final_columns if c not in join_keys]
            )
            if updates is not None and not updates.rdd.isEmpty():
                updates.persist(StorageLevel.MEMORY_AND_DISK)

            updates_count = updates.limit(1).count()
            logger.info(f"Records needing updates: {updates_count}")

            # Step 8: Detect new records
            inserts = joined_df.filter(col("old.rid").isNull()).select(
                *[col(f"new.{c}").alias(c) for c in final_columns]
            )
            if inserts is not None and not inserts.rdd.isEmpty():
                inserts.persist(StorageLevel.MEMORY_AND_DISK)

            inserts_count = inserts.limit(1).count()
            logger.info(f"New records to insert: {inserts_count}")

            # Step 9: Perform operations
            if inserts_count > 0:
                logger.info("Processing inserts...")
                self._execute_batch_insert(inserts, table_name)

            if updates_count > 0:
                logger.info("Processing updates...")
                self._execute_batch_update(updates, table_name, join_keys, modified_by)

            logger.info("✅ Project fiscal summary upsert completed successfully")
            if inserts is not None:
                inserts.unpersist()
            if updates is not None:
                updates.unpersist()
            return True

        except Exception as e:
            logger.error(f"❌ Project fiscal summary upsert failed: {str(e)}", exc_info=True)
            raise

    def _prepare_final_dataframe(self, df: DataFrame, account_rid: str, account_r_number: str) -> DataFrame:
        """Prepare final DataFrame with proper data types and columns."""
        # Add default values for new columns with explicit casting
        config_values = self.get_account_ai_config(account_rid, account_r_number)
        df = self.apply_ai_config_defaults(df, config_values)
        
        # Cast numeric fields
        numeric_fields = [
            "total_effort_prj", "total_cost_prj", "total_effort_fte_prj", 
            "total_cost_fte_prj", "total_effort_subcon_prj", 
            "total_cost_subcon_prj", "total_cost_nonlabor_prj"
        ]
        for col_name in numeric_fields:
            if col_name in df.columns:
                df = df.withColumn(col_name, col(col_name).cast(DecimalType(18, 2)))

        # Ensure boolean fields are properly typed
        boolean_fields = ["auto_send_ai_interaction"]
        for col_name in boolean_fields:
            if col_name in df.columns:
                df = df.withColumn(col_name, col(col_name).cast("boolean"))

        # Select final columns safely
        final_columns = [
            "rid","r_number", "project_rid", "project_fiscal_rid", "project_code", 
            "account_rid", "program_name", "project_name", 
            "project_startdate", "project_enddate", "currency_rid", 
            "industry_name", "industry_rid", "country_rid", "region_rid", 
            "technical_point_of_contact", "project_point_of_contact",
            "project_type_rid", "project_classification_rid", 
            "project_classification_other", "project_client_group",
            "project_group", "total_effort_prj", "total_cost_prj", 
            "total_fte_prj", "total_subcon_prj", "total_effort_fte_prj",
            "total_cost_fte_prj", "total_effort_subcon_prj",
            "total_cost_subcon_prj", "total_cost_nonlabor_prj",
            "project_description", "comments", "qre_final",
            "assessment_status", "created_datetime",
            "created_by", "status_rid",
            "max_ai_interaction", "auto_send_ai_interaction", "fiscal_year"
        ]
        
        return df.select(*[col(c) for c in final_columns if c in df.columns])

    def upsert_project_fiscal_summary_by_project_resource(
        self,
        incoming_df: DataFrame,
        entity_type : str,
        account_r_number: str,
        account_rid: str,
        fiscal_year: int,
        modified_by: str,
    ) -> None:
        try:
            # Map project_rid and project_number
            mapped_df = self.map_entity_rid_and_r_number_with_data(incoming_df, entity_type, account_r_number, account_rid)

            # Add fiscal year column
            mapped_df = mapped_df.withColumn("fiscal_year", lit(fiscal_year))
            mapped_df = mapped_df.dropDuplicates(["project_code", "fiscal_year"])
            # Map project_fiscal_rid and project_fiscal_number
            mapped_df = self.map_entity_fiscal_rid_and_r_number_with_data(mapped_df, entity_type, account_r_number)
            metadata_columns = {
                "fiscal_year": lit(fiscal_year),
                "created_datetime": self.get_date_and_time(),
                "created_by": lit(modified_by),
                "financial_consultant": lit(None),
                "qre_potential": lit(None),
                "is_rd_qualified": lit(False)
            }
            for col_name, col_expr in metadata_columns.items():
                if col_name not in mapped_df.columns:
                    mapped_df = mapped_df.withColumn(col_name, col_expr)

            final_columns = [
                "project_rid","project_fiscal_rid","r_number", "project_code", "account_rid",
                "project_name", "project_startdate","fiscal_year",
                "project_enddate", "currency_rid", 
                "region_rid",
                "created_datetime", "auto_send_ai_interaction","max_ai_interaction",
                "created_by", "status_rid","auto_access_rd",
            ]
            final_df = mapped_df.select(*[col(c) for c in final_columns])
            final_columns = final_df.columns
            join_keys = ["account_rid", "project_rid", "project_fiscal_rid", "fiscal_year"]
            table_name = self.get_public_table(config.PROJECT_FISCAL_SUMMARY_TABLE)

            # Step 5: Read existing data
            existing_df = (
                self.spark.read.format("jdbc")
                    .option("url", config.MAIN_DB_URL)
                    .option("dbtable", f"(SELECT rid, {', '.join(final_columns)} FROM {table_name}) AS existing")
                    .option("user", config.MAIN_DB_USER)
                    .option("password", settings.MAIN_DB_PASSWORD)
                    .option("driver", config.ENTITY_DB_DRIVER)
                    .load()
            )

            # Step 6: Join incoming and existing data
            joined_df = final_df.alias("new").join(existing_df.alias("old"), join_keys, "left")

            # Step 7: Detect changed records
            protected_columns = {"rid", "created_by", "created_datetime"}
            change_conditions = []
            for col_name in final_columns:
                if col_name not in join_keys and col_name not in protected_columns:
                    change_conditions.append(
                        (col(f"new.{col_name}").isNotNull() & col(f"old.{col_name}").isNull()) |
                        (col(f"new.{col_name}").isNull() & col(f"old.{col_name}").isNotNull()) |
                        (col(f"new.{col_name}") != col(f"old.{col_name}"))
                    )

            has_changes = reduce(lambda a, b: a | b, change_conditions) if change_conditions else lit(False)

            updates = joined_df.filter(
                col("old.rid").isNotNull() & has_changes
            ).select(
                col("old.rid").alias("rid"),
                *[col(f"new.{k}") for k in join_keys],
                *[col(f"new.{c}").alias(c) for c in final_columns if c not in join_keys]
            )
            if updates is not None and not updates.rdd.isEmpty():
                updates.persist(StorageLevel.MEMORY_AND_DISK)

            updates_count = updates.limit(1).count()
            logger.info(f"Records needing updates: {updates_count}")

            # Step 8: Detect new records
            inserts = joined_df.filter(col("old.rid").isNull()).select(
                *[col(f"new.{c}").alias(c) for c in final_columns]
            )
            if inserts is not None and not inserts.rdd.isEmpty():
                inserts.persist(StorageLevel.MEMORY_AND_DISK)

            inserts_count = inserts.limit(1).count()
            logger.info(f"New records to insert: {inserts_count}")

            # Step 9: Perform operations
            if inserts_count > 0:
                logger.info("Processing inserts...")
                self._execute_batch_insert(inserts, table_name)

            if updates_count > 0:
                logger.info("Processing updates...")
                self._execute_batch_update(updates, table_name, join_keys, modified_by)

            logger.info("✅ Project fiscal summary upsert completed successfully")
            if inserts is not None:
                inserts.unpersist()
            if updates is not None:
                updates.unpersist()
            return True

        except Exception as e:
            logger.error(f"[{entity_type}] Upsert failed: {str(e)}")
            raise


    # ====================== Template Operations ======================
    def fetch_column_mappings(self, account_rid: str,account_r_number: str) -> Dict[str, str]:
        """Get column mappings from templates database"""
        table_name = self.get_tenant_table(account_r_number, config.TEMPLATE_COLUMNS_TABLE)
        try:
            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = f"""
                        SELECT col_name, col_type 
                        FROM {table_name}
                        WHERE account_rid = %s
                    """
                    cursor.execute(query, (account_rid,))
                    return {row[0]: row[1] for row in cursor.fetchall()}
        except Exception as e:
            logger.error(f"Error fetching column mappings: {e}", exc_info=True)
            raise

    # ====================== Kafka Event Operations ======================
    def update_kafka_event(
        self,
        modified_by: str,
        account_r_number: str,
        producer_id: str,
        consumer_id: Optional[str] = None,
        status: Optional[str] = None,
        error_description: Optional[str] = None
    ) -> bool:
        """Update Kafka event status in database"""
        table_name = self.get_tenant_table(account_r_number, config.KAFKA_EVENTS_TABLE)
        try:
            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    update_query = f"""
                        UPDATE {table_name}
                        SET 
                            consumer_id = COALESCE(%s, consumer_id),
                            message_on_timestamp = CASE WHEN %s IS NOT NULL THEN NOW() ELSE message_on_timestamp END,
                            status = COALESCE(%s, status),
                            error_description = COALESCE(%s, error_description),
                            modified_datetime = CURRENT_TIMESTAMP,
                            modified_by = %s
                        WHERE producer_id = %s
                    """
                    cursor.execute(update_query, (consumer_id, status, status, error_description, modified_by, producer_id))
                    conn.commit()
                    logger.info(f"Updated Kafka event for producer_id: {producer_id}")
                    return True
        except Exception as e:
            logger.error(f"Error updating Kafka event: {e}")
            return False

    def insert_kafka_event(self, event_data: Dict[str, Any], account_r_number: str) -> bool:
        """Insert a new Kafka event record"""
        table_name = self.get_tenant_table(account_r_number, config.KAFKA_EVENTS_TABLE)
        try:
            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    insert_query = f"""
                        INSERT INTO {table_name} (
                            document_rid, document_name,
                            document_upload_rid, status, source_name,
                            topic_name, producer_id, created_by, created_datetime
                        ) VALUES (
                            %(document_rid)s, %(document_name)s,
                            %(document_upload_rid)s, %(status)s, %(source_name)s,
                            %(topic_name)s, %(producer_id)s, %(created_by)s, CURRENT_TIMESTAMP
                        )
                    """
                    cursor.execute(insert_query, event_data)
                    conn.commit()
                    logger.info(f"Inserted Kafka event for document: {event_data.get('document_rid')}")
                    return True
        except Exception as e:
            logger.error(f"Error inserting Kafka event: {e}")
            return False

    def fetch_kafka_event(self, field: str, value: str, account_r_number: str) -> Optional[Dict[str, Any]]:
        """Generic method to fetch Kafka event by any field"""
        table_name = self.get_tenant_table(account_r_number, config.KAFKA_EVENTS_TABLE)
        try:
            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        f"SELECT * FROM {table_name} WHERE {field} = %s",
                        (value,)
                    )
                    result = cursor.fetchone()
                    if result:
                        columns = [desc[0] for desc in cursor.description]
                        return dict(zip(columns, result))
                    return None
        except Exception as e:
            logger.error(f"Error fetching Kafka event by {field}: {e}")
            return None

    def fetch_kafka_event_field(self, field: str, document_rid: str, account_r_number: str) -> Optional[Any]:
        """Fetch specific field from Kafka events"""
        table_name = self.get_tenant_table(account_r_number, config.KAFKA_EVENTS_TABLE)
        try:
            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        f"SELECT {field} FROM {table_name} WHERE document_rid = %s",
                        (document_rid,)
                    )
                    result = cursor.fetchone()
                    return result[0] if result else None
        except Exception as e:
            logger.error(f"Error fetching {field} from Kafka events: {e}")
            return None

    def fetch_by_upload_user_id(self, document_rid, account_r_number):
        """Fetch the document URL from the document table based on document_rid."""
        table_name = self.get_tenant_table(account_r_number, config.IMPORT_TABLE)
        if not document_rid:
            logger.error("document_rid cannot be None")
            return None

        try:
            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(f"""
                        SELECT uploaded_by_user_rid 
                        FROM {table_name} 
                        WHERE document_rid = %s
                    """, (document_rid,))
                    result = cursor.fetchone()
                    if result:
                        return result[0]
                    else:
                        logger.warning(f"No document upload_user_id found for document_rid {document_rid}")
                        return None
        except Exception as e:
            logger.error(f"Error fetching document upload_user_id for document_rid {document_rid}: {e}")
            return None

    def update_key_contacts(self, key_contact_df, entity_type, account_r_number, account_rid, modified_by, fiscal_year):
        """Update key contacts with proper cross-schema database access handling.
        
        Args:
            key_contact_df: DataFrame containing contact information
            entity_type: Type of entity ('Project' etc.)
            account_r_number: Account identifier
            account_rid: Account record ID
            modified_by: User performing the update
            fiscal_year: Fiscal year for record keeping
        """
        try:
            # Map entity_rid first
            key_contact_df = self.map_entity_rid_with_data(key_contact_df, entity_type, account_r_number)
            table_name = self.get_tenant_table(account_r_number, config.KEY_CONTACTS_TABLE)
            
            logger.info(f"Starting key contact update for {entity_type} {account_r_number}")
            
            # Define role mappings
            role_mappings = [
                {
                    'input_name_col': 'spoc_name',
                    'input_email_col': 'spoc_email',
                    'role_name': 'Project Point of Contact',
                    'include_in_communication': False,
                    'is_primary': True
                },
                {
                    'input_name_col': 'project_tech_poc_name',
                    'input_email_col': 'project_tech_poc_email',
                    'role_name': 'Project Technical Point of Contact',
                    'include_in_communication': False,
                    'is_primary': True
                },
                {
                    'input_name_col': 'project_delivery_head_name',
                    'input_email_col': 'project_delivery_head_email',
                    'role_name': 'Project Delivery Head',
                    'include_in_communication': False,
                    'is_primary': True
                }
            ]
            
            active_status = self.get_active_status_rid()
            
            # PHASE 1: Fetch all role RIDs from public schema first
            role_cache = {}
            with DBPool.get_connection_mainDB() as main_conn:
                with main_conn.cursor() as main_cursor:
                    key_contact_role_table = self.get_public_table(config.KEY_CONTACTS_ROLE_TABLE)
                    for role_mapping in role_mappings:
                        main_cursor.execute(f"""
                            SELECT rid FROM {key_contact_role_table}
                            WHERE entity_type = %s AND role_name = %s
                        """, ('Project', role_mapping['role_name']))
                        result = main_cursor.fetchone()
                        if result:
                            role_cache[role_mapping['role_name']] = result[0]
                        else:
                            logger.warning(f"Role not found: {role_mapping['role_name']}")
                            role_cache[role_mapping['role_name']] = None

            # PHASE 2: Process contacts using tenant connection
            with DBPool.get_connection() as tenant_conn:
                with tenant_conn.cursor() as cursor:
                    processed_contacts = 0
                    
                    for row in key_contact_df.collect():
                        entity_rid = row["project_rid"]
                        
                        for role_mapping in role_mappings:
                            name = row[role_mapping['input_name_col']]
                            email = row[role_mapping['input_email_col']]
                        
                            # Convert empty strings to None
                            name = name if name and str(name).strip() != '' else None
                            email = email if email and str(email).strip() != '' else None
                            
                            # Skip if both converted to None after empty string check
                            if name is None and email is None:
                                logger.debug(f"Skipping {role_mapping['role_name']} - both name and email are empty after conversion")
                                continue
                            
                            role_rid = role_cache[role_mapping['role_name']]
                            if not role_rid:
                                continue
                            
                            # Update previous contacts for this role to non-primary
                            cursor.execute(f"""
                                UPDATE {table_name}
                                SET is_primary_contact = FALSE, 
                                    include_in_communication = FALSE,
                                    modified_by = %s,
                                    modified_datetime = NOW()
                                WHERE entity_rid = %s 
                                AND entity_type = %s
                                AND key_contact_role = %s
                                AND status_rid = %s
                            """, (modified_by, entity_rid, entity_type, role_rid, active_status))
                            
                            # Check if contact already exists with same details
                            cursor.execute(f"""
                                SELECT 1 FROM {table_name}
                                WHERE entity_rid = %s
                                AND entity_type = %s
                                AND key_contact_role = %s
                                AND key_contact_name = %s
                                AND key_contact_email = %s
                                AND status_rid = %s
                            """, (entity_rid, entity_type, role_rid, name, email, active_status))

                            exists = cursor.fetchone()

                            if exists:
                                # Just update the existing record to make sure it's primary
                                cursor.execute(f"""
                                    UPDATE {table_name}
                                    SET is_primary_contact = %s,
                                        include_in_communication = %s,
                                        modified_by = %s,
                                        modified_datetime = NOW()
                                    WHERE entity_rid = %s
                                    AND entity_type = %s
                                    AND key_contact_role = %s
                                    AND key_contact_name = %s
                                    AND key_contact_email = %s
                                    AND status_rid = %s
                                """, (
                                    role_mapping['is_primary'], role_mapping['include_in_communication'], modified_by,
                                    entity_rid, entity_type, role_rid, name, email, active_status
                                ))
                                logger.debug(f"Updated existing contact for {entity_rid}: {name}, {role_mapping['role_name']}")
                            else:
                                # Insert new active contact
                                cursor.execute(f"""
                                    INSERT INTO {table_name} (
                                        entity_rid, entity_type, r_number,
                                        key_contact_name, key_contact_email, key_contact_role,
                                        is_primary_contact, include_in_communication, status_rid,
                                        created_by, modified_by, created_datetime, modified_datetime
                                    ) VALUES (
                                        %s, %s, %s,
                                        %s, %s, %s,
                                        %s, %s, %s,
                                        %s, %s, NOW(), NOW()
                                    )
                                """, (
                                    entity_rid, entity_type, account_r_number,
                                    name, email, role_rid,
                                    role_mapping['is_primary'], role_mapping['include_in_communication'], active_status,
                                    modified_by, modified_by
                                ))
                                logger.debug(f"Inserted new contact for {entity_rid}: {name}, {role_mapping['role_name']}")

                    tenant_conn.commit()
                    logger.info(f"✅ Successfully processed contact updates")
                    return True

        except Exception as e:
            logger.error(f"❌ Failed to update key contacts: {str(e)}")
            if 'tenant_conn' in locals():
                tenant_conn.rollback()
            raise
    def execute_sql_in_tenant(self, account_r_number: str, sql: str) -> None:
        """
        Execute a raw SQL command inside the tenant's database.

        Args:
            account_r_number (str): The tenant account number (e.g. "ACC-00601").
            sql (str): The SQL query or command to execute.
        """
        try:
            with DBPool.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql)
                conn.commit()
            logger.info(f"✅ Successfully executed SQL in tenant DB ({account_r_number})")
        except Exception as e:
            logger.error(f"❌ SQL execution failed for tenant {account_r_number}: {str(e)}", exc_info=True)
            raise

    def update_key_contacts_for_fiscal(
        self,
        key_inserts: DataFrame,
        key_updates: DataFrame,
        inserts: DataFrame,
        updates: DataFrame,
        changed_records: DataFrame,
        entity_type: str,
        account_r_number: str,
        account_rid: str,
        modified_by: str,
        document_rid: str,
        fiscal_year: int
    ):
        from pyspark.sql import functions as F
        import uuid

        key_tbl   = self.get_tenant_table(account_r_number, config.KEY_CONTACTS_TABLE)
        ck_tbl    = self.get_tenant_table(account_r_number, config.CASES_KEY_CONTACT_TABLE)
        pf_tbl    = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
        cp_tbl    = self.get_tenant_table(account_r_number, config.CASE_PROJECTS_TABLE)
        cases_tbl = self.get_tenant_table(account_r_number, config.CASES_TABLE)
        active_status = self.get_active_status_rid()

        tmp_primary = tmp_pf = tmp_upsert = None

        try:
            # =====================================================
            # 🔑 LOAD ROLE UUIDs (NO CONSTANTS)
            # =====================================================
            with DBPool.get_connection_mainDB() as conn:
                with conn.cursor() as cur:
                    role_tbl = self.get_public_table(config.KEY_CONTACTS_ROLE_TABLE)
                    cur.execute(f"""
                        SELECT LOWER(TRIM(role_name)), rid
                        FROM {role_tbl}
                        WHERE entity_type='Project'
                        AND role_status='active'
                    """)
                    role_map = {r[0]: r[1] for r in cur.fetchall()}

            poc_role_rid = role_map.get("project point of contact")
            if not poc_role_rid:
                raise Exception("❌ Project Point of Contact role not configured")

            # =====================================================
            # 1️⃣ NORMALIZE INCOMING
            # =====================================================
            incoming = (
                key_inserts.select(
                    "entity_rid","key_contact_role","key_contact_name","key_contact_email"
                )
                .unionByName(
                    key_updates.select(
                        "entity_rid","key_contact_role","key_contact_name","key_contact_email"
                    ),
                    allowMissingColumns=True
                )
                .withColumn(
                    "include_in_communication",
                    F.when(F.col("key_contact_role") == poc_role_rid, F.lit(True)).otherwise(F.lit(False))
                )
                .withColumn(
                    "interaction_cc_recipient",
                    F.when(F.col("key_contact_role") == poc_role_rid, F.lit(False)).otherwise(F.lit(True))
                )
                .withColumn("email_norm", F.lower(F.trim("key_contact_email")))
                .withColumn("name_norm",  F.lower(F.trim("key_contact_name")))
                .dropDuplicates(["entity_rid","key_contact_role","email_norm","name_norm"])
                .persist(StorageLevel.MEMORY_AND_DISK)
            )

            if incoming.rdd.isEmpty():
                logger.info("ℹ️ No key contact changes")
                return

            # =====================================================
            # 2️⃣ UPSERT INTO key_contacts
            # =====================================================
            tmp_upsert = f"tmp_upsert_{uuid.uuid4().hex[:8]}"

            incoming.select(
                "entity_rid",
                "key_contact_role",
                "key_contact_name",
                "key_contact_email",
                "include_in_communication",
                "interaction_cc_recipient"
            ).write.format("jdbc").mode("overwrite") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", tmp_upsert) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .save()

            self.execute_sql_in_tenant(account_r_number, f"""
                MERGE INTO {key_tbl} t
                USING (
                    SELECT *,
                        ROW_NUMBER() OVER (
                            PARTITION BY entity_rid, key_contact_role, key_contact_email
                            ORDER BY entity_rid
                        ) rn
                    FROM {tmp_upsert}
                ) s
                ON t.entity_rid = s.entity_rid
            AND t.key_contact_role = s.key_contact_role
            AND lower(trim(t.key_contact_email)) = lower(trim(s.key_contact_email))
                WHEN MATCHED AND s.rn = 1 THEN
                    UPDATE SET
                        key_contact_name = s.key_contact_name,
                        include_in_communication = s.include_in_communication,
                        interaction_cc_recipient = s.interaction_cc_recipient,
                        modified_by = '{modified_by}',
                        modified_datetime = NOW()
                WHEN NOT MATCHED AND s.rn = 1 THEN
                    INSERT (
                        rid, entity_rid, entity_type,
                        key_contact_role, key_contact_name, key_contact_email,
                        is_primary_contact,
                        include_in_communication, interaction_cc_recipient,
                        status_rid, created_by, modified_by,
                        created_datetime, modified_datetime
                    )
                    VALUES (
                        concat('{Constants.Database.UUID_PREFIX}-', gen_random_uuid()),
                        s.entity_rid, '{entity_type}',
                        s.key_contact_role, s.key_contact_name, s.key_contact_email,
                        false,
                        s.include_in_communication, s.interaction_cc_recipient,
                        '{active_status}', '{modified_by}', '{modified_by}',
                        NOW(), NOW()
                    );
            """)

            # =====================================================
            # 3️⃣ ENFORCE ROLE-BASED COMMUNICATION (UUID ONLY)
            # =====================================================
            self.execute_sql_in_tenant(
                account_r_number,
                f"""
                WITH ranked AS (
                    SELECT
                        t.rid,
                        t.entity_rid,
                        t.key_contact_role,
                        ROW_NUMBER() OVER (
                            PARTITION BY t.entity_rid, t.key_contact_role
                            ORDER BY t.modified_datetime DESC,
                                    t.created_datetime DESC,
                                    t.rid DESC
                        ) AS rn
                    FROM {key_tbl} t
                    WHERE t.entity_rid IN (
                        SELECT DISTINCT entity_rid FROM {tmp_upsert}
                    )
                )
                UPDATE {key_tbl} t
                SET
                    is_primary_contact = CASE
                        WHEN r.rn = 1 THEN true
                        ELSE false
                    END,
                    include_in_communication = CASE
                        WHEN r.rn = 1 AND t.key_contact_role = '{poc_role_rid}'
                            THEN true
                        ELSE false
                    END,
                    interaction_cc_recipient = CASE
                        WHEN r.rn = 1 AND t.key_contact_role = '{poc_role_rid}'
                            THEN false
                        ELSE true
                    END
                FROM ranked r
                WHERE t.rid = r.rid;
                """
            )


            # =====================================================
            # 4️⃣ TOUCH PROJECT_FISCAL
            # =====================================================
            tmp_pf = f"tmp_pf_{uuid.uuid4().hex[:8]}"
            incoming.select(F.col("entity_rid").alias("rid")).distinct() \
                .write.format("jdbc").mode("overwrite") \
                .option("url",config.ENTITY_DB_URL) \
                .option("dbtable",tmp_pf) \
                .option("user",config.ENTITY_DB_USER) \
                .option("password",settings.ENTITY_DB_PASSWORD) \
                .option("driver",config.ENTITY_DB_DRIVER).save()

            if (
                inserts.rdd.isEmpty()
                and updates.rdd.isEmpty()
                and changed_records.rdd.isEmpty()
                and (not key_inserts.rdd.isEmpty() or not key_updates.rdd.isEmpty())
            ):
                self.execute_sql_in_tenant(account_r_number,f"""
                    UPDATE {pf_tbl} pf
                    SET modified_by='{modified_by}', modified_datetime=NOW()
                    FROM {tmp_pf} s WHERE pf.rid=s.rid;
                """)

            # =====================================================
            # 5️⃣ LOG ENTITY TIMELINE
            # =====================================================
            if ((not inserts or inserts.rdd.isEmpty()) and (not updates or updates.rdd.isEmpty()) and (not changed_records or changed_records.rdd.isEmpty())):
                timeline_df = incoming.select("entity_rid").distinct().withColumnRenamed("entity_rid","rid")
                event_type_rid = self.get_event_type_rid(event_type_name="etl", entity_type=entity_type)
                self.log_entity_event_spark(
                    df=timeline_df,
                    account_rid=account_rid,
                    account_r_number=account_r_number,
                    event_name="updated",
                    event_type_rid=event_type_rid,
                    event_status="success",
                    entity_type=entity_type,
                    rid_column="rid",
                    document_id=document_rid,
                    created_by=modified_by,
                    modified_by=modified_by
                )

            # =====================================================
            # 6️⃣ SYNC INTO cases_key_contact_details (ACTIVE CASES)
            # =====================================================
            closed_rid = self.get_case_status_rid("Closed")
            if not self.table_exists_pg(cp_tbl):
                logger.warning(f"CASE table {cp_tbl} does not exist. Skipping case update.")
                return
            cp_df = self.spark.read.format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", cp_tbl) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER).load() \
                .alias("cp")
            if not self.table_exists_pg(cases_tbl):
                logger.warning(f"CASE table {cases_tbl} does not exist. Skipping case update.")
                return
            cases_df = self.spark.read.format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", cases_tbl) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER).load() \
                .alias("c")

            active_cases = cp_df.join(
                    cases_df,
                    cp_df.case_rid == cases_df.rid
                ).filter(cases_df.status_rid != closed_rid) \
                .select(
                    cp_df.case_rid,
                    cp_df.project_fiscal_rid,
                    cp_df.rid.alias("case_project_rid")
                )

            pf_ids = [r.entity_rid for r in incoming.select("entity_rid").distinct().collect()]
            pf_csv = ",".join([f"'{x}'" for x in pf_ids]) if pf_ids else "''"

            kc_query = f"""
            (
                SELECT rid,
                    entity_rid,
                    key_contact_role,
                    key_contact_name,
                    key_contact_email,
                    is_primary_contact,
                    include_in_communication,
                    interaction_cc_recipient
                FROM {key_tbl}
                WHERE entity_rid IN ({pf_csv})
            ) t
            """

            kc_df = self.spark.read.format("jdbc") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", kc_query) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER) \
                .load() \
                .select(
                    F.col("rid").alias("key_contact_rid"),
                    "entity_rid","key_contact_role",
                    "key_contact_name","key_contact_email","is_primary_contact",
                    "include_in_communication","interaction_cc_recipient"
                )

            joined_df = kc_df.join(
                active_cases,
                kc_df.entity_rid == active_cases.project_fiscal_rid,
                "inner"
            )

            selected_df = joined_df.select(
                "case_rid","case_project_rid","key_contact_rid","key_contact_role",
                "key_contact_name","key_contact_email",
                "is_primary_contact","include_in_communication","interaction_cc_recipient","entity_rid"
            )

            enriched_df = selected_df.withColumn(
                "rid", F.concat(F.lit(Constants.Database.UUID_PREFIX+"-"), F.expr("uuid()"))
            ).withColumn(
                "account_rid", F.lit(account_rid)
            ).withColumn(
                "status_rid", F.lit(active_status)
            ).withColumn(
                "entity_type", F.lit(entity_type)
            )

            # Stage into temp table
            tmp_ck = f"tmp_ck_{uuid.uuid4().hex[:8]}"
            enriched_df.write.format("jdbc").mode("overwrite") \
                .option("url", config.ENTITY_DB_URL) \
                .option("dbtable", tmp_ck) \
                .option("user", config.ENTITY_DB_USER) \
                .option("password", settings.ENTITY_DB_PASSWORD) \
                .option("driver", config.ENTITY_DB_DRIVER).save()

            # Upsert into ck_tbl
            self.execute_sql_in_tenant(account_r_number, f"""
                MERGE INTO {ck_tbl} AS ck
                USING (
                    SELECT case_rid,
                        case_project_rid,
                        key_contact_rid,
                        key_contact_role,
                        trim(key_contact_role) AS role_norm,
                        key_contact_name,
                        key_contact_email,
                        lower(trim(key_contact_email)) AS email_norm,
                        is_primary_contact,
                        include_in_communication,
                        interaction_cc_recipient,
                        entity_rid,
                        ROW_NUMBER() OVER (
                            PARTITION BY case_rid, key_contact_role, key_contact_email
                            ORDER BY case_rid, key_contact_rid
                        ) AS rn
                    FROM {tmp_ck}
                ) AS s
                ON ck.case_rid = s.case_rid
                AND trim(ck.key_contact_role) = s.role_norm
                AND lower(trim(ck.key_contact_email)) = s.email_norm
                WHEN MATCHED AND s.rn = 1 THEN
                    UPDATE SET is_primary_contact = s.is_primary_contact,
                            include_in_communication = s.include_in_communication,
                            interaction_cc_recipient = s.interaction_cc_recipient,
                            key_contact_name = s.key_contact_name,
                            modified_by = '{modified_by}',
                            modified_datetime = NOW()
                WHEN NOT MATCHED AND s.rn = 1 THEN
                    INSERT (rid, case_rid, case_project_rid, key_contact_rid,
                            key_contact_role, key_contact_name, key_contact_email,
                            is_primary_contact,include_in_communication,interaction_cc_recipient,entity_rid,
                            account_rid, status_rid, entity_type,
                            created_by, created_datetime, modified_by, modified_datetime)
                    VALUES (
                        concat('{Constants.Database.UUID_PREFIX}-', gen_random_uuid()),
                        s.case_rid, s.case_project_rid, s.key_contact_rid,
                        s.role_norm,              -- use normalized role instead of empty original
                        s.key_contact_name,
                        s.key_contact_email,
                        s.is_primary_contact,
                        s.include_in_communication,
                        s.interaction_cc_recipient,
                        s.entity_rid, '{account_rid}', '{active_status}', '{entity_type}',
                        '{modified_by}', NOW(), '{modified_by}', NOW()
                    );

            """)


            logger.info("✅ Case key contacts upserted cleanly.")


        finally:
            for t in [tmp_primary, tmp_pf, tmp_upsert]:
                if t:
                    self.execute_sql_in_tenant(account_r_number, f"DROP TABLE IF EXISTS {t}")
            if 'incoming' in locals() and not incoming.rdd.isEmpty():
                incoming.unpersist()

    def get_loaded_record_counts(self, document_rid: str, account_r_number: str) -> Tuple[int, int]:
        """Get the number of records loaded into project and project_fiscal for given document_rid"""
        project_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_TABLE)
        fiscal_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)

        jdbc_opts = {
            "url": config.ENTITY_DB_URL,
            "user": config.ENTITY_DB_USER,
            "password": settings.ENTITY_DB_PASSWORD,
            "driver": config.ENTITY_DB_DRIVER,
        }

        project_df = (
            self.spark.read.format("jdbc")
            .options(**jdbc_opts, dbtable=f"(SELECT * FROM {project_table} WHERE document_rid = '{document_rid}') AS project")
            .load()
        )
        if project_df is not None and not project_df.rdd.isEmpty():
            project_df.persist(StorageLevel.MEMORY_AND_DISK)
        fiscal_df = (
            self.spark.read.format("jdbc")
            .options(**jdbc_opts, dbtable=f"(SELECT * FROM {fiscal_table} WHERE document_rid = '{document_rid}') AS fiscal")
            .load()
        )
        if fiscal_df is not None and not fiscal_df.rdd.isEmpty():
            fiscal_df.persist(StorageLevel.MEMORY_AND_DISK)
        project_count = project_df.count()
        fiscal_count = fiscal_df.count()
        if project_df is not None:
            project_df.unpersist()
        if fiscal_df is not None:
            fiscal_df.unpersist()
        return project_count, fiscal_count

    # ====================== Kafka Event Convenience Methods ======================
    def fetch_by_kafka_producer_id(self, producer_id: str , account_r_number: str) -> Optional[Dict[str, Any]]:
        """Fetch Kafka event by producer_id"""
        return self.fetch_kafka_event("producer_id", producer_id, account_r_number)

    def fetch_by_kafka_document_id(self, document_rid: str, account_r_number: str) -> Optional[Dict[str, Any]]:
        """Fetch Kafka event by document_rid"""
        return self.fetch_kafka_event("document_rid", document_rid, account_r_number)

    def fetch_by_kafka_document_name(self, document_rid: str, account_r_number: str) -> Optional[str]:
        """Fetch document name from Kafka events"""
        return self.fetch_kafka_event_field("document_name", document_rid , account_r_number)

    def fetch_by_kafka_source_name(self, document_rid: str, account_r_number: str) -> Optional[str]:
        """Fetch source name from Kafka events"""
        return self.fetch_kafka_event_field("source_name", document_rid, account_r_number)

    def fetch_by_kafka_document_upload_rid(self, document_rid: str, account_r_number: str) -> Optional[str]:
        """Fetch document upload rid from Kafka events"""
        return self.fetch_kafka_event_field("document_upload_rid", document_rid, account_r_number)

    # ====================== Utility Methods ======================
    @staticmethod
    def generate_uuid():
        try:
            with DBPool.get_connection_uuid() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT gen_random_uuid();")
                    uuid_val = cursor.fetchone()[0]
                    uuid_val = f"{Constants.Database.UUID_PREFIX}-{uuid_val}"
                    logger.info(f"UUID generated: {uuid_val}")
                    return uuid_val
        except Exception as e:
            logger.error(f"Error in generating UUID: {e}")
        return None
    # ====================== History Table Operations ======================
    def _create_history_table_if_not_exists(self, entity_type: str, account_r_number: str) -> bool:
        """Create history table if it doesn't exist by copying schema from staging table."""
        try:
            staging_table_mapping = {
                "resource": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_TABLE),
                "resource_skill": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_SKILL_TABLE),
                "resource_cost": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_COST_TABLE),
                "project": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE),
                "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE),
                "project_task": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TASK_TABLE),
            }

            history_table_mapping = {
                "resource": self.get_tenant_table(account_r_number, config.HISTORY_RESOURCE_TABLE_STAGING),
                "resource_skill": self.get_tenant_table(account_r_number, config.HISTORY_RESOURCE_SKILL_TABLE_STAGING),
                "resource_cost": self.get_tenant_table(account_r_number, config.HISTORY_RESOURCE_COST_TABLE_STAGING),
                "project": self.get_tenant_table(account_r_number, config.HISTORY_PROJECT_TABLE_STAGING),
                "project_resource": self.get_tenant_table(account_r_number, config.HISTORY_PROJECT_RESOURCE_TABLE_STAGING),
                "project_task": self.get_tenant_table(account_r_number, config.HISTORY_PROJECT_TASK_TABLE_STAGING)
            }

            staging_table = staging_table_mapping.get(entity_type)
            history_table = history_table_mapping.get(entity_type)

            if not staging_table or not history_table:
                logger.error(f"Invalid entity type provided: {entity_type}")
                return False

            schema_name, staging_table_name = staging_table.replace('"', '').split('.')

            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    # Get schema from staging table
                    cursor.execute("""
                        SELECT column_name, data_type
                        FROM information_schema.columns
                        WHERE table_name = %s AND table_schema = %s
                    """, (staging_table_name, schema_name))
                    columns = cursor.fetchall()

                    if not columns:
                        raise ValueError(f"Schema not found for staging table: {staging_table}")

                    column_defs = [f'"{col[0]}" {col[1]}' for col in columns]

                    create_query = f"""
                        CREATE TABLE IF NOT EXISTS {history_table} (
                            {', '.join(column_defs)},
                            archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """
                    cursor.execute(create_query)
                    conn.commit()
                    logger.info(f"History table created or already exists: {history_table}")
                    return True

        except Exception as e:
            logger.error(f"Failed to create history table for {entity_type}: {e}", exc_info=True)
            return False


    def archive_and_flush_staging_data(self, entity_type: str, document_rid: str, account_r_number: str) -> bool:
        """Copy all records from staging to history, then clear the staging table."""
        try:
            staging_table_mapping = {
                "resource": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_TABLE),
                "resource_skill": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_SKILL_TABLE),
                "resource_cost": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_COST_TABLE),
                "project": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE),
                "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE),
                "project_task": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TASK_TABLE)
            }

            history_table_mapping = {
                "resource": self.get_tenant_table(account_r_number, config.HISTORY_RESOURCE_TABLE_STAGING),
                "resource_skill": self.get_tenant_table(account_r_number, config.HISTORY_RESOURCE_SKILL_TABLE_STAGING),
                "resource_cost": self.get_tenant_table(account_r_number, config.HISTORY_RESOURCE_COST_TABLE_STAGING),
                "project": self.get_tenant_table(account_r_number, config.HISTORY_PROJECT_TABLE_STAGING),
                "project_resource": self.get_tenant_table(account_r_number, config.HISTORY_PROJECT_RESOURCE_TABLE_STAGING),
                "project_task": self.get_tenant_table(account_r_number, config.HISTORY_PROJECT_TASK_TABLE_STAGING)
            }

            staging_table = staging_table_mapping.get(entity_type)
            history_table = history_table_mapping.get(entity_type)
            logger.info(f"staging_table : {staging_table}")
            logger.info(f"history_table : {history_table}")
            if not staging_table or not history_table:
                logger.error(f"Invalid entity type: {entity_type}")
                return False

            # Create history table if missing
            if not self._create_history_table_if_not_exists(entity_type, account_r_number):
                logger.error("Failed to ensure history table exists.")
                return False

            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    # Get all columns from staging table
                    schema_name, table_name = staging_table.split('.')  # Extract dynamic schema and table name

                    cursor.execute(f"""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_schema = %s AND table_name = %s 
                        ORDER BY ordinal_position
                    """, (schema_name.strip('"'), table_name))  # Ensure schema is correctly formatted

                    columns = [row[0] for row in cursor.fetchall()]
                    unique_columns = list(dict.fromkeys(columns)) 
                    column_list = ', '.join(unique_columns)

                    # Insert all data to history
                    copy_query = f"""
                        INSERT INTO {history_table} ({column_list})
                        SELECT {column_list}
                        FROM {staging_table}
                        WHERE document_rid = %s
                    """
                    logger.info(f"Copying data to history: {copy_query}")
                    cursor.execute(copy_query, (document_rid,))
                    logger.info(f"Copied {cursor.rowcount} rows to {history_table}")

                    # Delete from staging
                    delete_query = f"""
                        DELETE FROM {staging_table}
                        WHERE document_rid = %s
                    """
                    logger.info(f"Deleting from staging: {delete_query}")
                    cursor.execute(delete_query, (document_rid,))
                    conn.commit()
                    logger.info(f"Deleted {cursor.rowcount} rows from {staging_table}")

                    return True

        except Exception as e:
            logger.error(f"Error during archiving and flushing for {entity_type}: {e}", exc_info=True)
            return False
    
    def update_import_status(
        self,
        modified_by: str,
        document_rid: str,
        status: str,
        account_r_number: str,
        load_error_record_count: Optional[int] = None,
        warning_count: Optional[int] = None,
        upload_failure_reason: Optional[str] = None,
        target_load_start_timestamp: Optional[datetime] = None,
        target_load_end_timestamp: Optional[datetime] = None,
        target_staging_processed: Optional[int] = None
    ) -> bool:
        table_name = self.get_tenant_table(account_r_number, config.IMPORT_TABLE)
        try:
            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = f"""
                    UPDATE {table_name}
                    SET upload_failure_reason = COALESCE(%s, upload_failure_reason),
                        modified_by = %s,
                        target_load_status = COALESCE(%s, target_load_status),
                        target_load_start_timestamp = COALESCE(%s, target_load_start_timestamp),
                        target_load_end_timestamp = COALESCE(%s, target_load_end_timestamp),
                        total_staging_processed = COALESCE(%s, total_staging_processed),
                        target_load_error_records_count = %s,
                        total_staging_warning_count = %s
                    WHERE document_rid = %s
                    """
                    cursor.execute(
                        query,
                        (
                            upload_failure_reason,
                            modified_by,
                            status,
                            target_load_start_timestamp,
                            target_load_end_timestamp,
                            target_staging_processed,
                            load_error_record_count,
                            warning_count,
                            document_rid
                        )
                    )
                    conn.commit()
                    logger.info(f"Updated import status for {document_rid} to {status}")
                    return True
        except Exception as e:
            logger.error(f"Error updating import status: {e}", exc_info=True)
            return False
    
    def update_document_status(
        self,
        modified_by: str,
        document_rid: str,
        status: str,
        account_r_number: str,
        failure_reason: Optional[str] = None
    ) -> bool:
        table_name = self.get_tenant_table(account_r_number, config.DOCUMENT_TABLE)
        try:
            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = f"""
                    UPDATE {table_name}
                    SET 
                        document_status = %s,
                        failure_reason = COALESCE(%s, failure_reason),
                        modified_by = %s
                    WHERE rid = %s
                    """
                    cursor.execute(
                        query,
                        (status, failure_reason, modified_by, document_rid)
                    )
                    conn.commit()
                    logger.info(f"Updated document {document_rid} status to {status}")
                    return True
        except Exception as e:
            logger.error(f"Error updating document status: {e}", exc_info=True)
            return False

    def get_tenant_table(self, account_r_number: str, table_name: str) -> str:
        account_r_number = account_r_number.upper()
        account_r_number = account_r_number.split("-")[1]
        logger.info(f"account_r_number : {account_r_number}")
        logger.info(f"table_name : {table_name}")
        return f'"{Constants.Database.SCHEMA_PREFIX}{account_r_number}".{table_name}'
    
    def get_public_table(self,table_name: str) -> str:
        logger.info(f"table_name : {table_name}")
        return f'"{Constants.Database.SCHEMA_MAIN}".{table_name}'


    def _map_geo_rids(self, df: DataFrame, entity_type: str, document_rid : str, account_rid : str) -> DataFrame:
        """Map geographic columns to their respective RIDs, replacing original columns with IDs."""
        try:
            logger.info("Starting geographic RID mapping process")
            logger.info(f"Initial DataFrame schema: {df.schema.json()}")
            logger.info(f"Initial DataFrame columns: {df.columns}")
            logger.info(f"Entity type being processed: {entity_type}")
            column_mapping = dict.fromkeys(
                ['resource', 'project', 'project_resource', 'project_task'],
                {
                    'country': 'country_rid',
                    'state': 'region_rid',
                    'city': 'city_rid',
                    'currency': 'currency_rid'
                }
            )


            # Get the appropriate column names for the current entity type
            cols = column_mapping.get(entity_type, {})
            
            # 1. COUNTRY MAPPING
            if cols.get('country') in df.columns:
                country_col = cols['country']
                logger.info(f"Phase 1: Mapping {country_col} to IDs")
                
                # Get distinct country values
                countries = [row[country_col] 
                            for row in df.select(country_col).distinct().collect() 
                            if row[country_col] is not None]
                
                logger.info(f"Found {len(countries)} distinct countries to map: {countries}")
                
                if countries:
                    country_mapping = {}
                    currency_mapping = {}
                    country_table = self.get_public_table(config.COUNTRY_TABLE)
                    
                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            # Decide whether values look like codes or names
                            is_code = all(len(c) <= 3 for c in countries)

                            if is_code:
                                query = f"""
                                    SELECT rid, country_code, default_currency_rid 
                                    FROM {country_table} 
                                    WHERE country_code IN %s
                                """
                            else:
                                query = f"""
                                    SELECT rid, country_name, default_currency_rid 
                                    FROM {country_table} 
                                    WHERE country_name IN %s
                                """

                            params = (tuple(countries),)
                            logger.info(f"Executing query: {cursor.mogrify(query, params).decode('utf-8')}")
                            cursor.execute(query, params)
                            results = cursor.fetchall()
                            logger.info(f"Found {len(results)} matches")

                            for rid, country_val, currency_rid in results:
                                country_mapping[country_val] = rid
                                currency_mapping[country_val] = currency_rid
                                logger.info(f"Mapped: {country_val} → {rid}")

                    # Log unmapped
                    unmapped_countries = set(countries) - set(country_mapping.keys())
                    if unmapped_countries:
                        logger.warning(f"No RIDs found for {len(unmapped_countries)} countries: {unmapped_countries}")

                    # Broadcast mappings
                    country_bcast = df.sparkSession.sparkContext.broadcast(country_mapping)
                    currency_bcast = df.sparkSession.sparkContext.broadcast(currency_mapping)

                    # Replace with RID
                    df = df.withColumn(
                        country_col,
                        F.udf(lambda x: country_bcast.value.get(x), StringType())(F.col(country_col))
                    )

                    collect = df.select(country_col).collect()
                    logger.info(f"Successfully replaced {country_col} with RIDs: {collect}")

                

            # 2. STATE MAPPING
            if cols.get('state') in df.columns:
                state_col = cols['state']
                logger.info(f"\nPhase 2: Mapping {state_col} to IDs")

                # Get distinct states
                states = [x[state_col] for x in df.select(state_col).distinct().collect() if x[state_col] is not None]
                logger.info(f"Found {len(states)} states to map: {states}")

                if states:
                    state_mapping = {}
                    state_table = self.get_public_table(config.STATE_TABLE)

                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            query = f"""
                                SELECT rid, state_name, state_code, country_rid
                                FROM {state_table}
                                WHERE state_name = ANY(%s)
                                OR state_code = ANY(%s)
                            """
                            params = (states, states)  # psycopg2 will adapt Python list → SQL array
                            logger.info(f"Executing query: {cursor.mogrify(query, params).decode('utf-8')}")
                            cursor.execute(query, params)
                            results = cursor.fetchall()
                            logger.info(f"Found {len(results)} matches")

                            for rid, state_name, state_code, country_rid in results:
                                state_mapping[state_name] = rid
                                state_mapping[state_code] = rid
                                logger.debug(f"Mapped: {state_name}/{state_code} → {rid}")

                    # Log unmapped
                    unmapped_states = set(states) - set(state_mapping.keys())
                    if unmapped_states:
                        logger.warning(f"No RIDs found for {len(unmapped_states)} states: {unmapped_states}")

                    # Broadcast and map
                    state_bcast = df.sparkSession.sparkContext.broadcast(state_mapping)

                    @udf(StringType())
                    def get_state_rid(state):
                        return state_bcast.value.get(state)

                    df = df.withColumn(
                        state_col,
                        F.when(F.col(state_col).isNotNull(), get_state_rid(F.col(state_col))).otherwise(None)
                    )
                    collect = df.select(state_col).collect()
                    logger.info(f"Successfully replaced {state_col} with RIDs: {collect}")

            # 3. CITY MAPPING
            if cols.get('city') in df.columns:
                city_col = cols['city']
                logger.info(f"\nPhase 3: Mapping {city_col} to IDs")
                
                # Get distinct cities
                cities = df.select(city_col).distinct().collect()
                cities = [x[city_col] for x in cities if x[city_col] is not None]
                logger.info(f"Found {len(cities)} cities to map")
                
                if cities:
                    # Create city mapping
                    city_mapping = {}
                    city_table = self.get_public_table(config.CITY_TABLE)
                    logger.info("Executing database query for city RIDs...")
                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            # Handle single city case
                            if len(cities) == 1:
                                query = f"""
                                    SELECT rid, city_name, state_rid
                                    FROM {city_table}
                                    WHERE city_name = %s
                                """
                                params = (cities[0],)
                            else:
                                query = f"""
                                    SELECT rid, city_name, state_rid
                                    FROM {city_table} 
                                    WHERE city_name IN %s
                                """
                                params = (tuple(cities),)
                            
                            logger.info(f"Executing query: {cursor.mogrify(query, params).decode('utf-8')}")
                            cursor.execute(query, params)
                            results = cursor.fetchall()
                            logger.info(f"Found {len(results)} matches")
                            
                            for rid, city_name, state_rid in results:
                                city_mapping[city_name] = rid
                                logger.debug(f"Mapped: {city_name} → {rid}")
                    
                    # Log mapping coverage
                    unmapped_cities = set(cities) - set(city_mapping.keys())
                    if unmapped_cities:
                        ## Need to send mail
                        logger.warning(f"No RIDs found for {len(unmapped_cities)} cities")
                    
                    # Broadcast and map
                    city_bcast = df.sparkSession.sparkContext.broadcast(city_mapping)
                    
                    @udf(StringType())
                    def get_city_rid(city):
                        return city_bcast.value.get(city)

                    # Apply the UDF
                    df = df.withColumn(
                        city_col,
                        F.when(
                            F.col(city_col).isNotNull(),
                            get_city_rid(F.col(city_col))
                        ).otherwise(None)  # Optional: if you want to nullify missing values
                    )
                    
                    collect = df.select(city_col).collect()
                    logger.info(f"Successfully replaced {city_col} : {collect}")
                    logger.info(f"Successfully replaced {city_col} with RIDs")
            # 4. CURRENCY CODE MAPPING (for project and project_resource)
            # logger.info(f"Currency values before mapping: {df.select('currency_rid').distinct().collect()}")
            if entity_type in ['resource_cost', 'project', 'project_resource','project_task']:
                # Determine the correct column name based on entity type
                currency_column = 'currency_rid'
                
                if currency_column in df.columns:
                    logger.info(f"\nPhase 4: Mapping currency codes to RIDs from column: {currency_column}")
                    
                    # Get distinct currency values
                    currency_codes = [row[currency_column] 
                                    for row in df.select(currency_column).distinct().collect() 
                                    if row[currency_column] is not None]
                    
                    logger.info(f"Found {len(currency_codes)} distinct currency values to map: {currency_codes}")

                if currency_codes:
                    currency_mapping = {}
                    currency_table = self.get_public_table(config.CURRENCY_TABLE)
                    logger.info("Executing database query for currency RIDs...")
                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            if len(currency_codes) == 1:
                                query = f"SELECT rid, currency_code FROM {currency_table} WHERE currency_code = %s"
                                params = (currency_codes[0],)
                            else:
                                query = f"SELECT rid, currency_code FROM {currency_table} WHERE currency_code IN %s"
                                params = (tuple(currency_codes),)

                            logger.info(f"Executing query: {cursor.mogrify(query, params).decode('utf-8')}")
                            cursor.execute(query, params)
                            results = cursor.fetchall()

                            for rid, code in results:
                                currency_mapping[code] = rid
                                logger.debug(f"Mapped currency code: {code} → {rid}")

                    unmapped = set(currency_codes) - set(currency_mapping.keys())
                    if unmapped:
                        logger.warning(f"No RIDs found for {len(unmapped)} currency codes: {unmapped}")
                    currency_bcast = df.sparkSession.sparkContext.broadcast(currency_mapping)

                    df = df.withColumn(
                        'currency_rid',
                        F.when(
                            F.col('currency_rid').isNotNull(),
                            F.udf(lambda x: currency_bcast.value.get(x), StringType())(F.col('currency_rid'))
                        )
                    )
                    logger.info("Mapped currency_code to original column")


                    logger.info("Successfully mapped currency_code to currency_rid")

                # Fallback: fill null currency_rid using account table if still missing
                if currency_column in df.columns and not df.filter(F.col(currency_column).isNull()).rdd.isEmpty():
                    logger.info("Phase 4b: Filling missing currency_rid from account table fallback...")

                    account_table = self.get_public_table(config.ACCOUNT_TABLE)
      
                    logger.info(f"Querying account table {account_table} for currency_rid using account_rid = {account_rid}")
                    account_currency_rid = None

                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            cursor.execute(f"SELECT rid, currency_rid FROM {account_table} WHERE rid = %s", (account_rid,))
                            row = cursor.fetchone()
                            if row and row[1]:
                                account_currency_rid = row[1]
                                logger.info(f"✅ Retrieved fallback currency_rid={account_currency_rid} from account table")
                            else:
                                logger.info(f"⚠️ No currency_rid found for account_rid={account_rid}, using 'USD' as default")

                                # Phase 4c: Get USD RID from currency table
                                currency_table = self.get_public_table(config.CURRENCY_TABLE)
                                cursor.execute(f"SELECT rid FROM {currency_table} WHERE currency_code = 'USD'")
                                usd_result = cursor.fetchone()
                                if usd_result:
                                    account_currency_rid = usd_result[0]
                                    logger.info(f"✅ Retrieved USD RID: {account_currency_rid}")
                                else:
                                    raise Exception("⚠️ 'USD' not found in currency table.")

                    # Apply fallback RID
                    if account_currency_rid:
                        df = df.withColumn(
                            currency_column,
                            F.when(F.col(currency_column).isNull(), F.lit(account_currency_rid))
                            .otherwise(F.col(currency_column))
                        )
                        logger.info("✅ Applied fallback currency_rid to missing rows")

            if entity_type == 'resource_skill' and 'skill_type_rid' in df.columns and 'skill_subtype_rid' in df.columns:
                logger.info("\nPhase 4: Mapping skill_type and skill_subtype text to actual RIDs")
                # Step 1: Fetch distinct skill_type text values
                skill_type_texts = [row['skill_type_rid']
                                    for row in df.select('skill_type_rid').distinct().collect()
                                    if row['skill_type_rid'] is not None]

                logger.info(f"Found {len(skill_type_texts)} distinct skill_type texts to map: {skill_type_texts}")

                if skill_type_texts:
                    skill_type_table = self.get_public_table(config.SKILL_TYPE_TABLE)
                    skill_subtype_table = self.get_public_table(config.SKILL_SUB_TYPE_TABLE)
                    skill_type_mapping = {}

                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            # Fetch RID of 'Others'
                            cursor.execute(f"SELECT rid FROM {skill_type_table} WHERE skill_type_name ILIKE '%Others%'")
                            skill_type_others_rid = cursor.fetchone()[0]

                            # Get actual skill_type mappings
                            if len(skill_type_texts) == 1:
                                query = f"SELECT rid, skill_type_name FROM {skill_type_table} WHERE skill_type_name = %s"
                                params = (skill_type_texts[0],)
                            else:
                                query = f"SELECT rid, skill_type_name FROM {skill_type_table} WHERE skill_type_name IN %s"
                                params = (tuple(skill_type_texts),)

                            logger.info(f"Executing query: {cursor.mogrify(query, params).decode('utf-8')}")
                            cursor.execute(query, params)
                            results = cursor.fetchall()

                            for rid, name in results:
                                skill_type_mapping[name] = rid

                    unmapped_types = set(skill_type_texts) - set(skill_type_mapping.keys())
                    if unmapped_types:
                        logger.warning(f"No RIDs found for skill_type: {unmapped_types}")

                    skill_type_bcast = df.sparkSession.sparkContext.broadcast(skill_type_mapping)
                    skill_type_others_bcast = df.sparkSession.sparkContext.broadcast(skill_type_others_rid)
                    unmapped_skill_type_texts_bcast = df.sparkSession.sparkContext.broadcast(unmapped_types)

                    # Replace skill_type text with RID; add unmapped values to 'skill_type_others'
                    df = df.withColumn(
                        'skill_type_others',
                        F.when(F.col('skill_type_rid').isin(list(unmapped_types)), F.col('skill_type_rid'))
                    ).withColumn(
                        'skill_type_rid',
                        F.udf(lambda x: skill_type_bcast.value.get(x) if x in skill_type_bcast.value else skill_type_others_bcast.value,
                            StringType())(F.col('skill_type_rid'))
                    )

                    # Step 2: Map skill_subtype using skill_type
                    skill_subtype_rows = df.select('skill_subtype_rid', 'skill_type_rid') \
                        .distinct().filter("skill_subtype_rid IS NOT NULL AND skill_type_rid IS NOT NULL").collect()

                    skill_subtype_queries = {(row['skill_type_rid'], row['skill_subtype_rid']) for row in skill_subtype_rows}
                    skill_subtype_mapping = {}
    
                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            # Fetch RID of 'Others' for subtype
                            cursor.execute(f"SELECT rid FROM {skill_subtype_table} WHERE skill_subtype_name ILIKE '%Others%'")
                            skill_subtype_others_rid = cursor.fetchone()[0]

                            for st_rid, sub_text in skill_subtype_queries:
                                cursor.execute(
                                    f"SELECT rid FROM {skill_subtype_table} WHERE skill_type_rid = %s AND skill_subtype_name = %s",
                                    (st_rid, sub_text)
                                )
                                result = cursor.fetchone()
                                if result:
                                    skill_subtype_mapping[(st_rid, sub_text)] = result[0]

                    mapped_keys = set(skill_subtype_mapping.keys())
                    unmapped_subtypes = skill_subtype_queries - mapped_keys
                    if unmapped_subtypes:
                        logger.warning(f"No RIDs found for skill_subtype: {unmapped_subtypes}")

                    subtype_bcast = df.sparkSession.sparkContext.broadcast(skill_subtype_mapping)
                    subtype_others_bcast = df.sparkSession.sparkContext.broadcast(skill_subtype_others_rid)
                    unmapped_subtype_set_bcast = df.sparkSession.sparkContext.broadcast(unmapped_subtypes)

                    # UDF to check if a subtype is unmapped
                    def is_unmapped_subtype(type_rid, subtype_text):
                        return (type_rid, subtype_text) in unmapped_subtype_set_bcast.value

                    is_unmapped_udf = F.udf(is_unmapped_subtype, BooleanType())

                    # Replace skill_subtype text with RID; add unmapped to 'skill_subtype_others'
                    df = df.withColumn(
                        'skill_subtype_others',
                        F.when(
                            is_unmapped_udf(F.col('skill_type_rid'), F.col('skill_subtype_rid')),
                            F.col('skill_subtype_rid')
                        )
                    ).withColumn(
                        'skill_subtype_rid',
                        F.udf(
                            lambda st, sub: subtype_bcast.value.get((st, sub)) if (st, sub) in subtype_bcast.value else subtype_others_bcast.value,
                            StringType()
                        )(F.col('skill_type_rid'), F.col('skill_subtype_rid'))
                    )

                    logger.info("Successfully mapped skill_type and skill_subtype text values to RIDs")

            # Handle skill_level mapping for resource_skill
            if entity_type == 'resource_skill' and 'skill_level_rid' in df.columns:
                logger.info("\nPhase 9: Mapping skill_level to skill_level_rid for resource_skill")
                
                # Get distinct skill levels
                skill_levels = [row['skill_level_rid'] 
                            for row in df.select('skill_level_rid').distinct().collect() 
                            if row['skill_level_rid'] is not None]
                
                logger.info(f"Found {len(skill_levels)} distinct skill levels to map: {skill_levels}")
                
                if skill_levels:
                    # Create skill level mapping
                    skill_level_mapping = {}
                    skill_level_table = self.get_public_table(config.SKILL_LEVEL_TABLE)
                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            # Handle single level case
                            if len(skill_levels) == 1:
                                query = f"""
                                    SELECT rid, skill_level_name 
                                    FROM {skill_level_table} 
                                    WHERE skill_level_name = %s
                                """
                                params = (skill_levels[0],)
                            else:
                                query = f"""
                                    SELECT rid, skill_level_name 
                                    FROM {skill_level_table} 
                                    WHERE skill_level_name IN %s
                                """
                                params = (tuple(skill_levels),)
                            
                            logger.info(f"Executing query: {cursor.mogrify(query, params).decode('utf-8')}")
                            cursor.execute(query, params)
                            results = cursor.fetchall()
                            logger.info(f"Found {len(results)} matches")
                            
                            for rid, level_name in results:
                                skill_level_mapping[level_name] = rid
                    
                    # Log mapping coverage
                    unmapped_skill_levels = set(skill_levels) - set(skill_level_mapping.keys())
                    if unmapped_skill_levels:
                        logger.warning(f"No RIDs found for {len(unmapped_skill_levels)} skill levels: {unmapped_skill_levels}")
                    
                    # Broadcast mapping
                    skill_level_bcast = df.sparkSession.sparkContext.broadcast(skill_level_mapping)

                    # UDF to map skill level name to rid
                    def map_skill_level_rid(skill_level):
                        return skill_level_bcast.value.get(skill_level)

                    map_rid_udf = F.udf(map_skill_level_rid, StringType())

                    # Apply mapping - we keep the same column name but replace values
                    df = df.withColumn('skill_level_rid', map_rid_udf(F.col('skill_level_rid')))
                    logger.info("Successfully mapped skill_level to skill_level_rid")
            if entity_type == 'project' and 'industry_name' in df.columns:
                logger.info("\n🧭 Phase 5: Mapping industry_name to industry_rid")

                # Step 1: Extract unique, non-null industry names
                industries = [row['industry_name']
                            for row in df.select('industry_name').distinct().collect()
                            if row['industry_name'] is not None]

                logger.info(f"🔍 Found {len(industries)} distinct industry names to map: {industries}")

                # ✅ If all values are null, create a null-filled column and skip mapping
                if not industries:
                    logger.warning("⚠️ All industry_name values are null. Setting industry_rid as null.")
                    df = df.withColumn("industry_rid", F.lit(None).cast(StringType()))
                
                else:
                    # Step 2: Continue with mapping logic
                    industry_mapping = {}
                    industry_table = self.get_public_table(config.PROJECT_INDUSTRY_TABLE)

                    logger.info(f"📡 Querying industry table: {industry_table}")

                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            # Fetch matched RIDs
                            if len(industries) == 1:
                                query = f"""
                                    SELECT rid, industry_name FROM {industry_table}
                                    WHERE industry_name = %s
                                """
                                params = (industries[0],)
                            else:
                                query = f"""
                                    SELECT rid, industry_name FROM {industry_table}
                                    WHERE industry_name IN %s
                                """
                                params = (tuple(industries),)

                            logger.info(f"📥 Executing query: {cursor.mogrify(query, params).decode('utf-8')}")
                            cursor.execute(query, params)
                            results = cursor.fetchall()

                            logger.info(f"✅ Found {len(results)} industry name matches")

                            for rid, industry_name in results:
                                industry_mapping[industry_name] = rid
                                logger.info(f"🔗 Mapped: {industry_name} → {rid}")

                            # Fetch fallback 'Other' RID
                            cursor.execute(f"SELECT rid FROM {industry_table} WHERE industry_name = 'Other'")
                            others_result = cursor.fetchone()
                            if others_result:
                                others_rid = others_result[0]
                                logger.info(f"📍 'Other' industry RID: {others_rid}")
                            else:
                                raise Exception("Industry 'Other' not found in industry table.")

                    # Broadcast mappings
                    industry_bcast = df.sparkSession.sparkContext.broadcast(industry_mapping)
                    others_rid_bcast = df.sparkSession.sparkContext.broadcast(others_rid)

                    def get_industry_rid(industry_name):
                        if industry_name is None:
                            return None
                        return industry_bcast.value.get(industry_name, others_rid_bcast.value)

                    get_industry_rid_udf = F.udf(get_industry_rid, StringType())

                    # Step 3: Apply industry_rid and update industry_name
                    df = df.withColumn(
                        'industry_rid',
                        F.when(
                            F.col('industry_name').isNull(),
                            F.lit(None).cast(StringType())
                        ).otherwise(get_industry_rid_udf(F.col('industry_name')))
                    )

                    df = df.withColumn(
                        'industry_name',
                        F.when(
                            F.col('industry_rid').isNull(),
                            F.lit(None)
                        ).when(
                            F.col('industry_rid') == F.lit(others_rid),
                            F.lit("Other")
                        ).otherwise(F.col('industry_name'))
                    )

                    logger.info("✅ Successfully mapped industry_name to industry_rid")

            if entity_type == 'project' and 'project_classification' in df.columns:
                non_null_count = df.filter(F.col("project_classification").isNotNull()).count()
                if non_null_count == 0:
                    logger.info("⚠️ 'project_classification' column is empty. Creating project_classification_rid with nulls.")
                    df = df.withColumn("project_classification_rid", lit(None).cast(StringType()))
                    df = df.withColumn("project_classification_other", lit(None).cast(StringType()))
                    df = df.drop("project_classification")
                else:
                    logger.info("🧠 Mapping project_classification to RID...")
                    logger.info("\nPhase 6: Mapping project_classification to project_classification_rid")
                    
                    # Get distinct classification names
                    classifications = [row['project_classification'] 
                                    for row in df.select('project_classification').distinct().collect() 
                                    if row['project_classification'] is not None]
                    
                    logger.info(f"Found {len(classifications)} distinct classifications to map: {classifications}")
                    
                    if classifications:
                        # Create classification mapping
                        classification_mapping = {}
                        project_classification_table = self.get_public_table(config.PROJECT_CLASSIFICATION_TABLE)
                        with DBPool.get_connection_mainDB() as conn:
                            with conn.cursor() as cursor:
                                # Fetch RID of 'Others' classification
                                cursor.execute(f"SELECT rid FROM {project_classification_table} WHERE classification_name ILIKE '%Other%'")
                                classification_others_rid = cursor.fetchone()[0]
                                
                                # Handle single classification case
                                if len(classifications) == 1:
                                    query = f"""
                                        SELECT rid, classification_name 
                                        FROM {project_classification_table} 
                                        WHERE classification_name = %s
                                    """
                                    params = (classifications[0],)
                                else:
                                    query = f"""
                                        SELECT rid, classification_name 
                                        FROM {project_classification_table} 
                                        WHERE classification_name IN %s
                                    """
                                    params = (tuple(classifications),)
                                
                                logger.info(f"Executing query: {cursor.mogrify(query, params).decode('utf-8')}")
                                cursor.execute(query, params)
                                results = cursor.fetchall()
                                logger.info(f"Found {len(results)} matches")
                                
                                for rid, name in results:
                                    classification_mapping[name] = rid
                        
                        # Log mapping coverage
                        unmapped_classifications = set(classifications) - set(classification_mapping.keys())
                        if unmapped_classifications:
                            logger.warning(f"No RIDs found for {len(unmapped_classifications)} classifications: {unmapped_classifications}")
                        
                        # Broadcast mappings
                        classification_bcast = df.sparkSession.sparkContext.broadcast(classification_mapping)
                        classification_others_bcast = df.sparkSession.sparkContext.broadcast(classification_others_rid)
                        unmapped_bcast = df.sparkSession.sparkContext.broadcast(unmapped_classifications)

                        # UDF to map classification name to rid
                        def map_to_rid(classification):
                            if classification is None:
                                return None
                            if classification in classification_bcast.value:
                                return classification_bcast.value[classification]
                            return classification_others_bcast.value  # fallback only for unknown non-null values

                        def map_to_other_name(classification):
                            if classification is None:
                                return None
                            if classification in unmapped_bcast.value:
                                return "Other"
                            return None

                        map_rid_udf = F.udf(map_to_rid, StringType())
                        map_other_udf = F.udf(map_to_other_name, StringType())

                        # Apply both columns
                        df = df.withColumn('project_classification_rid', map_rid_udf(F.col('project_classification')))
                        df = df.withColumn('project_classification_other', map_other_udf(F.col('project_classification')))

                        # Drop original column
                        if 'project_classification' in df.columns:
                            df = df.drop('project_classification')
                        logger.info("Successfully mapped project_classification with special handling for 'other' values")

            if entity_type == 'project_task' and 'task_type_rid' in df.columns:
                logger.info(f"\nPhase 7: Mapping task_type to task_type_rid for {entity_type}")
                
                # Get distinct task types (including nulls/empties)
                task_types = [row['task_type_rid'] 
                            for row in df.select('task_type_rid').distinct().collect()]
                
                # Filter out null/empty values for mapping lookup
                valid_task_types = [pt for pt in task_types if pt is not None and str(pt).strip()]
                
                logger.info(f"Found {len(valid_task_types)} distinct task types to map: {valid_task_types}")
                
                task_type_mapping = {}
                if valid_task_types:
                    # Create project type mapping only for valid types
                    task_type_table = self.get_public_table(config.TASK_TYPE)
                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            if len(valid_task_types) == 1:
                                query = f"""
                                    SELECT rid, project_task_type_name 
                                    FROM {task_type_table} 
                                    WHERE project_task_type_name = %s
                                """
                                params = (valid_task_types[0],)
                            else:
                                query = f"""
                                    SELECT rid, project_task_type_name 
                                    FROM {task_type_table} 
                                    WHERE project_task_type_name IN %s
                                """
                                params = (tuple(valid_task_types),)
                            
                            logger.info(f"Executing query: {cursor.mogrify(query, params).decode('utf-8')}")
                            cursor.execute(query, params)
                            results = cursor.fetchall()
                            logger.info(f"Found {len(results)} matches")
                            
                            for rid, name in results:
                                task_type_mapping[name] = rid
                
                # Broadcast mapping (empty if no valid types)
                task_type_bcast = df.sparkSession.sparkContext.broadcast(task_type_mapping)

                # UDF to map task type name to rid (returns null for null/empty inputs)
                def map_task_type_rid(task_type):
                    if task_type is None or not str(task_type).strip():
                        return None
                    return task_type_bcast.value.get(task_type)

                map_rid_udf = F.udf(map_task_type_rid, StringType())

                # Apply mapping and rename column (always rename, even for nulls)
                df = df.withColumn('task_type_rid', map_rid_udf(F.col('task_type_rid')))
                logger.info("Successfully mapped task_type to task_type_rid (including null/empty values)")

            if entity_type == 'project_task' and 'task_classification_rid' in df.columns:
                logger.info(f"\nPhase 7: Mapping task_classification to task_classification_rid for {entity_type}")
                
                # Get distinct task classifications (including nulls/empties)
                task_classifications = [row['task_classification_rid'] 
                            for row in df.select('task_classification_rid').distinct().collect()]
                
                # Filter out null/empty values for mapping lookup
                valid_task_classifications = [pt for pt in task_classifications if pt is not None and str(pt).strip()]
                
                logger.info(f"Found {len(valid_task_classifications)} distinct task classifications to map: {valid_task_classifications}")
                
                task_classification_mapping = {}
                if valid_task_classifications:
                    # Create project classifications mapping only for valid classifications
                    task_classification_table = self.get_public_table(config.TASK_CLASSIFICATION)
                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            if len(valid_task_classifications) == 1:
                                query = f"""
                                    SELECT rid, classification_name 
                                    FROM {task_classification_table} 
                                    WHERE classification_name = %s
                                """
                                params = (valid_task_classifications[0],)
                            else:
                                query = f"""
                                    SELECT rid, classification_name 
                                    FROM {task_classification_table} 
                                    WHERE classification_name IN %s
                                """
                                params = (tuple(valid_task_classifications),)
                            
                            logger.info(f"Executing query: {cursor.mogrify(query, params).decode('utf-8')}")
                            cursor.execute(query, params)
                            results = cursor.fetchall()
                            logger.info(f"Found {len(results)} matches")
                            
                            for rid, name in results:
                                task_classification_mapping[name] = rid
                
                # Broadcast mapping (empty if no valid classifications)
                task_classification_bcast = df.sparkSession.sparkContext.broadcast(task_classification_mapping)

                # UDF to map task classifications name to rid (returns null for null/empty inputs)
                def map_task_classification_rid(task_classification):
                    if task_classification is None or not str(task_classification).strip():
                        return None
                    return task_classification_bcast.value.get(task_classification)

                map_rid_udf = F.udf(map_task_classification_rid, StringType())

                # Apply mapping and rename column (always rename, even for nulls)
                df = df.withColumn('task_classification_rid', map_rid_udf(F.col('task_classification_rid')))
                logger.info("Successfully mapped task_classification to task_classification_rid (including null/empty values)")

            if entity_type in ['project', 'project_resource','project_task'] and 'project_type' in df.columns:
                logger.info(f"\nPhase 7: Mapping project_type to project_type_rid for {entity_type}")
                
                # Get distinct project types (including nulls/empties)
                project_types = [row['project_type'] 
                            for row in df.select('project_type').distinct().collect()]
                
                # Filter out null/empty values for mapping lookup
                valid_project_types = [pt for pt in project_types if pt is not None and str(pt).strip()]
                
                logger.info(f"Found {len(valid_project_types)} distinct project types to map: {valid_project_types}")
                
                project_type_mapping = {}
                if valid_project_types:
                    # Create project type mapping only for valid types
                    project_type_table = self.get_public_table(config.PROJECT_TYPE)
                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            if len(valid_project_types) == 1:
                                query = f"""
                                    SELECT rid, project_type_name 
                                    FROM {project_type_table} 
                                    WHERE project_type_name = %s
                                """
                                params = (valid_project_types[0],)
                            else:
                                query = f"""
                                    SELECT rid, project_type_name 
                                    FROM {project_type_table} 
                                    WHERE project_type_name IN %s
                                """
                                params = (tuple(valid_project_types),)
                            
                            logger.info(f"Executing query: {cursor.mogrify(query, params).decode('utf-8')}")
                            cursor.execute(query, params)
                            results = cursor.fetchall()
                            logger.info(f"Found {len(results)} matches")
                            
                            for rid, name in results:
                                project_type_mapping[name] = rid
                
                # Broadcast mapping (empty if no valid types)
                project_type_bcast = df.sparkSession.sparkContext.broadcast(project_type_mapping)

                # UDF to map project type name to rid (returns null for null/empty inputs)
                def map_project_type_rid(project_type):
                    if project_type is None or not str(project_type).strip():
                        return None
                    return project_type_bcast.value.get(project_type)

                map_rid_udf = F.udf(map_project_type_rid, StringType())

                # Apply mapping and rename column (always rename, even for nulls)
                df = df.withColumn('project_type_rid', map_rid_udf(F.col('project_type')))
                df = df.drop('project_type')
                logger.info("Successfully mapped project_type to project_type_rid (including null/empty values)")

            # Handle resource_type mapping
            if entity_type in ['resource', 'resource_cost','resource_skill','project_resource','project_task'] and 'resource_type' in df.columns:
                logger.info("\nPhase 8: Mapping resource_type to resource_type_rid")
                
                # Get distinct resource types (including nulls/empties)
                resource_types = [row['resource_type'] 
                                for row in df.select('resource_type').distinct().collect()]
                
                # Filter out null/empty values for mapping lookup
                valid_resource_types = [rt for rt in resource_types if rt is not None and str(rt).strip()]
                
                logger.info(f"Found {len(valid_resource_types)} distinct resource types to map: {valid_resource_types}")
                
                resource_type_mapping = {}
                if valid_resource_types:
                    # Create resource type mapping only for valid types
                    resource_type_table = self.get_public_table(config.RESOURCE_TYPE)
                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            if len(valid_resource_types) == 1:
                                query = f"""
                                    SELECT rid, resource_type_name 
                                    FROM {resource_type_table} 
                                    WHERE resource_type_name = %s
                                """
                                params = (valid_resource_types[0],)
                            else:
                                query = f"""
                                    SELECT rid, resource_type_name 
                                    FROM {resource_type_table} 
                                    WHERE resource_type_name IN %s
                                """
                                params = (tuple(valid_resource_types),)
                            
                            logger.info(f"Executing query: {cursor.mogrify(query, params).decode('utf-8')}")
                            cursor.execute(query, params)
                            results = cursor.fetchall()
                            logger.info(f"Found {len(results)} matches")
                            
                            for rid, name in results:
                                resource_type_mapping[name] = rid
                
                # Broadcast mapping (empty if no valid types)
                resource_type_bcast = df.sparkSession.sparkContext.broadcast(resource_type_mapping)

                # UDF to map resource type name to rid (returns null for null/empty inputs)
                def map_resource_type_rid(resource_type):
                    if resource_type is None or not str(resource_type).strip():
                        return None
                    return resource_type_bcast.value.get(resource_type)

                map_rid_udf = F.udf(map_resource_type_rid, StringType())

                # Apply mapping and rename column (always rename, even for nulls)
                df = df.withColumn('resource_type_rid', map_rid_udf(F.col('resource_type')))
                df = df.drop('resource_type')
                logger.info("Successfully mapped resource_type to resource_type_rid (including null/empty values)")

            return df

        except Exception as e:
            logger.error(f"Failed to map geographic RIDs: {str(e)}", exc_info=True)
            raise
    
    # Add these methods to your DatabaseHandler class
    def get_resource_status_rid(self, status_name: str) -> Optional[str]:
        """
        Fetch the RID from the resource_status table for the given status_name.

        Args:
            status_name (str): The resource_status_name to fetch the RID for (e.g., 'Active', 'Anomaly', 'Duplicate')

        Returns:
            Optional[str]: RID if found, None otherwise
        """
        try:
            status_table = self.get_public_table(config.RESOURCE_STATUS_TABLE)
            if not status_table:
                raise ValueError("No mapping found for resource_status table")

            jdbc_options = {
                "url": config.MAIN_DB_URL,
                "user": config.MAIN_DB_USER,
                "password": settings.MAIN_DB_PASSWORD,
                "driver": config.ENTITY_DB_DRIVER
            }

            query = f"(SELECT rid FROM {status_table} WHERE resource_status_name = '{status_name}' LIMIT 1) AS status_query"
            df = self.spark.read.format("jdbc").option("dbtable", query).options(**jdbc_options).load()
            row = df.first()

            return row["rid"] if row else None

        except Exception as e:
            logger.error(f"❌ Failed to fetch '{status_name}' resource_status rid: {str(e)}", exc_info=True)
            return None

    def get_active_status_rid(self) -> Optional[str]:
        try:
            status_table = self.get_public_table(config.STATUS_TABLE)
            if not status_table:
                raise ValueError(f"No status table mapping for entity")
            
            jdbc_options = {
                "url": config.MAIN_DB_URL,
                "user": config.MAIN_DB_USER,
                "password": settings.MAIN_DB_PASSWORD,
                "driver": config.ENTITY_DB_DRIVER
            }

            query = f"(SELECT rid FROM {status_table} WHERE status_name = 'Active' LIMIT 1) AS active_status"
            df = self.spark.read.format("jdbc").option("dbtable", query).options(**jdbc_options).load()
            row = df.first()

            return row["rid"] if row else None

        except Exception as e:
            logger.error(f"Failed to fetch 'Active' status_rid: {str(e)}", exc_info=True)
            return None
        
    def get_inactive_status_rid(self) -> Optional[str]:
        try:
            status_table = self.get_public_table(config.STATUS_TABLE)
            if not status_table:
                raise ValueError(f"No status table mapping for entity")
            
            jdbc_options = {
                "url": config.MAIN_DB_URL,
                "user": config.MAIN_DB_USER,
                "password": settings.MAIN_DB_PASSWORD,
                "driver": config.ENTITY_DB_DRIVER
            }

            query = f"(SELECT rid FROM {status_table} WHERE status_name = 'In-Active' LIMIT 1) AS inactive_status"
            df = self.spark.read.format("jdbc").option("dbtable", query).options(**jdbc_options).load()
            row = df.first()

            return row["rid"] if row else None

        except Exception as e:
            logger.error(f"Failed to fetch 'Active' status_rid: {str(e)}", exc_info=True)
            return None

    def get_user_details(self, user_rid: str) -> str:
            try:
                with DBPool.get_connection_mainDB() as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            f"""
                            SELECT email, CONCAT(first_name,' ', last_name) FROM {Constants.Database.SCHEMA_MAIN}.{Constants.Tables.USER_MAIN_TABLE}
                            WHERE rid = %s
                            """,
                            (user_rid,)
                        )
                        result = cur.fetchone()
                        if result:
                            return result
                        else:
                            raise ValueError(f"User not found for rid: {user_rid}")
            except Exception as e:
                logger.error(f"Error fetching User details: {str(e)}")
                raise

    def get_partition_count(self,record_count: int) -> int:
        if record_count <= 1000:
            return 1
        elif record_count <= 100000:
            return max(2, record_count // 25000)
        elif record_count <= 5000000:
            return min(64, record_count // 100000)
        else:
            return 128

    def exclude_rows(self, df: DataFrame, records: set, entity_type: str):
        if not records:
            return df

        def condition(row):
            if entity_type == "resource_cost":
                return (
                    (col("resource_code") == lit(row[0])) &
                    (col("effective_from") == lit(row[1])) &
                    (col("end_date") == lit(row[2]))
                )
            elif entity_type == "resource_skill":
                return (
                    (col("resource_code") == lit(row[0])) &
                    (col("skill_type_rid") == lit(row[1]))
                )

        conditions = [condition(r) for r in records]

        # Debugging: Ensure df is correctly recognized
        if not isinstance(df, DataFrame):
            raise TypeError(f"Expected a DataFrame but got {type(df)} instead.")

        return df.filter(~reduce(lambda a, b: a | b, conditions))

    def get_import_statistics(self, document_rid: str, account_r_number: str) -> Dict[str, Any]:
        """
        Retrieve complete import record with all columns from the import table.
        
        Args:
            document_rid: The document RID to look up
            account_r_number: The account number for tenant isolation
        
        Returns:
            Dictionary containing all import record fields with calculated statistics
        """
        table_name = self.get_tenant_table(account_r_number, config.IMPORT_TABLE)
        try:
            with DBPool.get_connection() as conn:
                query = f"""
                SELECT 
                    rid, r_number, eid, created_by, modified_by,
                    created_datetime, modified_datetime, account_rid,
                    project_rid, uploaded_by_user_rid, related_to,
                    related_to_rid, entity_type, uploaded_datetime,
                    document_name, document_rid, upload_status,
                    upload_failure_reason, staging_table, staging_status,
                    staging_start_timestamp, staging_end_timestamp,
                    staging_error, total_records, total_staging_processed,
                    target_load_status, target_load_start_timestamp,
                    target_load_end_timestamp, target_load_error_records_count,
                    target_ai_records_processed, target_ai_error_records_count
                FROM {table_name}
                WHERE document_rid = %s;
                """
                
                with conn.cursor() as cursor:
                    cursor.execute(query, (document_rid,))
                    columns = [desc[0] for desc in cursor.description]
                    result = cursor.fetchone()
                    
                    if not result:
                        logger.warning(f"No import record found for document_rid {document_rid}")
                        return {}
                    
                    # Convert result to dictionary with column names
                    record = dict(zip(columns, result))
                    
                    # Calculate derived statistics
                    staging_time = 0
                    if record.get('staging_start_timestamp') and record.get('staging_end_timestamp'):
                        staging_time = (record['staging_end_timestamp'] - record['staging_start_timestamp']).total_seconds()
                    
                    processing_time = 0
                    if record.get('target_load_start_timestamp') and record.get('target_load_end_timestamp'):
                        processing_time = (record['target_load_end_timestamp'] - record['target_load_start_timestamp']).total_seconds()
                    
                    # Determine staging status description
                    staging_status = record.get('staging_status')
                    staging_error = record.get('staging_error')
                    
                    if staging_status == 'Success':
                        staging_status_description = "Successfully loaded all records"
                    elif staging_status == 'Failed' or staging_status is None:
                        staging_status_description = staging_error if staging_error else "Staging failed with unknown error"
                    # Add calculated fields
                    record.update({
                        'staging_time_sec': staging_time,
                        'processing_time_sec': processing_time,
                        'total_time_sec': staging_time + processing_time,
                        'records_success': record.get('total_staging_processed', 0) - record.get('target_load_error_records_count', 0),
                        'records_failed': (record.get('total_records', 0) - record.get('total_staging_processed', 0)),
                        'records_warning': record.get('target_load_error_records_count', 0),
                        'staging_status_description': staging_status_description
                    })
                    logger.info(f"record: {record}")
                    return record
                    
        except Exception as e:
            logger.error(f"Error fetching import statistics: {e}")
            return {}
    
    def get_account_name(self, account_rid: str) -> str:
        """
        Retrieve account name from account table using account_rid
        
        Args:
            account_rid: The account RID to look up
        
        Returns:
            Account name as string, or empty string if not found
        """
        try:
            with DBPool.get_connection_mainDB() as conn:
                query = f"""
                SELECT account_name 
                FROM {Constants.Database.SCHEMA_MAIN}.{Constants.Tables.ACCOUNT}
                WHERE rid = %s
                ORDER BY rid ASC
                LIMIT 1;
                """
                
                with conn.cursor() as cursor:
                    cursor.execute(query, (account_rid,))
                    result = cursor.fetchone()
                    return result[0] if result else ""
                    
        except Exception as e:
            logger.error(f"Error fetching account name for {account_rid}: {e}")
            return ""
    def get_account_country(self, account_rid: str) -> str:
        try:
            with DBPool.get_connection_mainDB() as conn:
                query = f"""
                SELECT country_rid 
                FROM {Constants.Database.SCHEMA_MAIN}.{Constants.Tables.ACCOUNT}
                WHERE rid = %s
                ORDER BY rid ASC
                LIMIT 1;
                """
                
                with conn.cursor() as cursor:
                    cursor.execute(query, (account_rid,))
                    result = cursor.fetchone()
                    return result[0] if result else ""
                    
        except Exception as e:
            logger.error(f"Error fetching account name for {account_rid}: {e}")
            return ""

    def get_staging_records_with_errors_and_warnings(self, document_rid: str, entity_type: str, account_r_number: str) -> Tuple[DataFrame, DataFrame]:
        """Get records from staging database and return both records and error summary."""
        try:
            # Get the full table name based on entity type (same as before)
            full_table_name = {
                "resource": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_TABLE),
                "resource_cost": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_COST_TABLE),
                "resource_skill": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_SKILL_TABLE),
                "project": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE),
                "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE),
                "project_task": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TASK_TABLE)
            }.get(entity_type)

            if not full_table_name:
                raise ValueError(f"Unsupported entity type: {entity_type}")
            
            full_query = f"(SELECT * FROM {full_table_name} WHERE document_rid = '{document_rid}') AS subquery"
            # JDBC configuration (same as before)
            jdbc_options = {
                "url": config.ENTITY_DB_URL,
                "dbtable": full_query,
                "user": config.ENTITY_DB_USER,
                "password": settings.ENTITY_DB_PASSWORD,
                "driver": config.ENTITY_DB_DRIVER,
                "numPartitions": "10"
            }

            # Load the data from staging table
            df = self.spark.read.format("jdbc").options(**jdbc_options).load()
           # Filter only records with errors (assuming there's an 'error_description' column)
            error_df = df.filter(
                (col("error_descriptions").isNotNull()) & (trim(col("error_descriptions")) != "")
            )
            
            # Create error summary DataFrame
            error_summary = (error_df
                            .groupBy("error_descriptions")
                            .agg(f_count("*").alias("No_of_records"))
                            .orderBy("No_of_records", ascending=False))
            logger.info(f"error_summary : {error_summary}")
            warning_only_df = df.filter(
                (col("warning_descriptions").isNotNull()) &
                (col("error_descriptions").isNull())
            )
            if warning_only_df is not None and not warning_only_df.rdd.isEmpty():
                warning_only_df.persist(StorageLevel.MEMORY_AND_DISK)
            warning_count = warning_only_df.count()
            if warning_only_df is not None:
                warning_only_df.unpersist()
            return error_summary,warning_count

        except Exception as e:
            logger.error(f"Error getting staging records: {e}", exc_info=True)
            raise

    def get_staging_records_for_email(self, document_rid: str, entity_type: str, account_r_number: str) -> DataFrame:
            """Get records from staging database with enhanced warning tracking and nullify fields with warnings."""
            try:
                # Get the full table name based on entity type
                full_table_name = {
                    "resource": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_TABLE),
                    "resource_cost": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_COST_TABLE),
                    "resource_skill": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_SKILL_TABLE),
                    "project": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE),
                    "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE),
                    "project_task": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TASK_TABLE)
                }.get(entity_type)

                if not full_table_name:
                    raise ValueError(f"Unsupported entity type: {entity_type}")

                full_query = f"(SELECT * FROM {full_table_name} WHERE document_rid = '{document_rid}') AS subquery"

                # JDBC configuration
                jdbc_options = {
                    "url": config.ENTITY_DB_URL,
                    "dbtable": full_query,
                    "user": config.ENTITY_DB_USER,
                    "password": settings.ENTITY_DB_PASSWORD,
                    "driver": config.ENTITY_DB_DRIVER,
                    "numPartitions": "10"
                }

                # Validate JDBC config
                missing_keys = [k for k, v in jdbc_options.items() if v is None]
                if missing_keys:
                    raise ValueError(f"Missing JDBC config values for: {', '.join(missing_keys)}")

                # Load the data from staging table
                df = self.spark.read.format("jdbc").options(**jdbc_options).load()
                total_records = df.count()
                logger.info(f"total_records for email sending--- : {total_records}")
                return df
            except Exception as e:
                logger.error(f"Error getting staging records: {e}", exc_info=True)
                raise

    def get_account_ai_config(self, account_rid: str, account_r_number: str) -> dict:
        """
        Fetch AI config for a single account_rid.
        Priority:
        1. Platform-level (ORG_LICENSES) if high priority
        2. Account-level (ACCOUNT_DETAILS) if platform flags are False
        3. Defaults
        """
        logger.info(f"🔍 Fetching AI configuration for {account_rid}")

        table_name = self.get_tenant_table(account_r_number, config.ACCOUNT_DETAIL_TABLE)
        pl_table_name = self.get_public_table(config.ORG_LICENSES_TABLE)

        query_pl = f"""
            SELECT auto_send_interaction,
                auto_access_rd
            FROM {pl_table_name}
            LIMIT 1
        """

        query_account = f"""
            SELECT max_ai_interactions,
                autosend_interaction,
                auto_access_rd
            FROM {table_name}
            WHERE account_rid = %s
        """

        try:
            # Step 1: Check platform-level
            with DBPool.get_connection_mainDB() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query_pl)
                    pl_row = cursor.fetchone()

            if pl_row:
                logger.info(f"Platform-level config: {pl_row}")
                auto_send, auto_access = pl_row

                if auto_send or auto_access:  # platform overrides
                    return {
                        "max_ai_interaction": 9,
                        "auto_send_ai_interaction": auto_send if auto_send is not None else False,
                        "auto_access_rd": auto_access if auto_access is not None else False
                    }

                # If both flags are False → check account table
                if not auto_send and not auto_access:
                    with DBPool.get_connection() as conn:
                        with conn.cursor() as cursor:
                            cursor.execute(query_account, (account_rid,))
                            acc_row = cursor.fetchone()
                            logger.info(f"Account-level config: {acc_row}")
                            if acc_row:
                                return {
                                    "max_ai_interaction": acc_row[0] if acc_row[0] is not None else 9,
                                    "auto_send_ai_interaction": acc_row[1] if acc_row[1] is not None else False,
                                    "auto_access_rd": acc_row[2] if acc_row[2] is not None else False
                                }

            # Step 3: Defaults
            logger.warning(f"⚠️ No config found for {account_rid}. Using defaults.")
            return {
                "max_ai_interaction": 9,
                "auto_send_ai_interaction": False,
                "auto_access_rd": False
            }

        except Exception as e:
            logger.error(f"❌ Error fetching AI config: {e}", exc_info=True)
            raise


    def apply_ai_config_defaults(self, df: DataFrame, config_values: Dict[str, any]) -> DataFrame:
        """
        Adds or fills default AI-related columns based on account config.
        Safely handles datatype mismatches.
        """
        existing_cols = df.columns
        logger.info(f"config_values: {config_values}")
        # max_ai_interaction (int)
        if "max_ai_interaction" in existing_cols:
            df = df.withColumn(
                "max_ai_interaction",
                when(col("max_ai_interaction").cast("int").isNull(), lit(config_values["max_ai_interaction"]))
                .otherwise(col("max_ai_interaction").cast("int"))
            )
        else:
            df = df.withColumn("max_ai_interaction", lit(config_values["max_ai_interaction"]).cast("int"))

        # auto_send_ai_interaction (boolean)
        if "auto_send_ai_interaction" in existing_cols:
            df = df.withColumn(
                "auto_send_ai_interaction",
                when(col("auto_send_ai_interaction").cast("boolean").isNull(), lit(config_values["auto_send_ai_interaction"]))
                .otherwise(col("auto_send_ai_interaction").cast("boolean"))
            )
        else:
            df = df.withColumn("auto_send_ai_interaction", lit(config_values["auto_send_ai_interaction"]).cast("boolean"))

        # auto_access_rd (boolean)
        if "auto_access_rd" in existing_cols:
            df = df.withColumn(
                "auto_access_rd",
                when(col("auto_access_rd").cast("boolean").isNull(), lit(config_values["auto_access_rd"]))
                .otherwise(col("auto_access_rd").cast("boolean"))
            )
        else:
            df = df.withColumn("auto_access_rd", lit(config_values["auto_access_rd"]).cast("boolean"))

        return df

    def get_date_and_time(self):
        return datetime.now(timezone.utc)

    def process_aggregation_project_resource(self, incoming_df: DataFrame, account_rid: str, account_r_number: str, fiscal_year: int) -> None:

        spark = self.spark

        # account_rid_filter = f"('{account_rid}')"
        active_status_rid = self.get_resource_status_rid("Active")

        # === Read project_resource table ===
        pr_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_RESOURCE_TABLE)
        query = f"""(
            SELECT account_rid, project_rid, project_fiscal_rid, resource_rid, region_rid,
                total_hours_pro_res, total_cost_pro_res, net_total_cost_pro_res, fiscal_year
            FROM {pr_table}
            WHERE account_rid = '{account_rid}' AND fiscal_year = {fiscal_year} AND status_rid = '{active_status_rid}'
        ) AS pr_filtered"""

        base_df = spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", query) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load()

        # base_df = base_df.withColumn("fiscal_year", lit(fiscal_year))
        # logger.info(f"✅ Aggregation source row count: {base_df.count()}")
        # === 1. project_resource_fiscal ===
        pr_fiscal = base_df.groupBy("fiscal_year", "account_rid", "project_fiscal_rid", "resource_rid") \
            .agg(
                _sum("total_hours_pro_res").alias("total_hours_pro_res"),
                _sum("net_total_cost_pro_res").alias("total_cost_pro_res")
            )
        logger.info("project resource fiscal table")
        # pr_fiscal.show()

        self._upsert_aggregated_data(
            df=pr_fiscal,
            target_table=self.get_tenant_table(account_r_number, config.PROD_PROJECT_RESOURCE_FISCAL_TABLE),
            keys=["fiscal_year", "account_rid", "project_fiscal_rid", "resource_rid"],
            update_fields=[
                "total_hours_pro_res",
                "total_cost_pro_res"
            ],
            account_r_number=account_r_number
        )

        # === 2. project_resource_fiscal_region ===
        pr_fiscal_region = base_df.groupBy("fiscal_year", "account_rid", "project_fiscal_rid", "resource_rid", "region_rid") \
            .agg(
                _sum("total_hours_pro_res").alias("total_hours_pro_res"),
                _sum("net_total_cost_pro_res").alias("total_cost_pro_res")
            )
        logger.info("project resource fiscal region table")
        # pr_fiscal_region.show()

        self._upsert_aggregated_data(
            df=pr_fiscal_region,
            target_table=self.get_tenant_table(account_r_number, config.PROD_PROJECT_RESOURCE_FISCAL_REGION_TABLE),
            keys=["fiscal_year", "account_rid", "project_fiscal_rid", "resource_rid", "region_rid"],
            update_fields=[
                "total_hours_pro_res",
                "total_cost_pro_res"
            ],
            account_r_number=account_r_number
        )
        # Step 1: Load the resource table
        resource_table = self.get_tenant_table(account_r_number, config.PROD_RESOURCE_TABLE)

        # Only select necessary columns
        # Step 1: Read and prepare the resource_df
        resource_df = spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", resource_table) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .selectExpr("rid as resource_rid", "resource_code", "resource_type_rid", "account_rid")

        # Step 2: Join with base_df on resource_rid and account_rid
        base_df = base_df.join(
            resource_df,
            on=["resource_rid", "account_rid"],
            how="left"
        )


        # === Fetch resource_type_name mapping ===
        resource_type_table = self.get_public_table(config.RESOURCE_TYPE)
        res_type_df = spark.read \
            .format("jdbc") \
            .option("url", config.MAIN_DB_URL) \
            .option("dbtable", resource_type_table) \
            .option("user", config.MAIN_DB_USER) \
            .option("password", settings.MAIN_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .select(col("rid").alias("resource_type_rid"), col("resource_type_name"))

        base_df = base_df.join(res_type_df, on="resource_type_rid", how="left")

        # === Fetch project_fiscal for default_metric_type ===
        pf_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
        pf_region_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_REGION_TABLE)
        fiscal_df = spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", pf_table) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .select("account_rid", "rid", "project_rid", "fiscal_year", "default_metric_type") \
            .withColumnRenamed("rid", "project_fiscal_rid")

        df = base_df.join(fiscal_df, on=["project_fiscal_rid", "account_rid", "fiscal_year"], how="left")
        
        fiscal_region_df = spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", pf_region_table) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .select("account_rid", "rid", "project_rid", "fiscal_year", "region_rid", "default_metric_type") \
            .withColumnRenamed("rid", "project_fiscal_rid")
        # logger.info("1")
        # fiscal_region_df.show(40, truncate=False)
        df_region= base_df.join(fiscal_region_df, on=["project_fiscal_rid", "account_rid", "fiscal_year", "region_rid"], how="left")
        # df = df.withColumn(
        #     "skip_metrics",
        #     ~(
        #         col("default_metric_type").isNull() |
        #         (lower(col("default_metric_type")) == "project resource level")
        #     )
        # )

        # Determine if we should include effective fields
        # include_effective_fields = df.filter(~col("skip_metrics")).count() > 0

        # === Prepare common columns ===
        df = df.withColumn("total_cost_fte_from_prj_res", when((col("resource_type_name") == "Full-Time"), col("net_total_cost_pro_res"))) \
            .withColumn("total_effort_fte_from_prj_res", when((col("resource_type_name") == "Full-Time"), col("total_hours_pro_res"))) \
            .withColumn("total_cost_subcon_from_prj_res", when((col("resource_type_name") == "Sub Con"), col("net_total_cost_pro_res"))) \
            .withColumn("total_effort_subcon_from_prj_res", when((col("resource_type_name") == "Sub Con") , col("total_hours_pro_res"))) \
            .withColumn("total_cost_nonlabor_from_prj_res", when((col("resource_type_name") == "Non-Labor") , col("net_total_cost_pro_res")))

        df = df.withColumn("total_cost_from_prj_res",
            coalesce(col("total_cost_fte_from_prj_res").cast("double"), lit(0.0)) +
            coalesce(col("total_cost_subcon_from_prj_res").cast("double"), lit(0.0)) +
            coalesce(col("total_cost_nonlabor_from_prj_res").cast("double"), lit(0.0))
        )

        df = df.withColumn("total_effort_from_prj_res",
            coalesce(col("total_effort_fte_from_prj_res").cast("double"), lit(0.0)) +
            coalesce(col("total_effort_subcon_from_prj_res").cast("double"), lit(0.0))
        )

        df_region = df_region.withColumn("total_cost_fte_from_prj_res", when((col("resource_type_name") == "Full-Time"), col("net_total_cost_pro_res"))) \
            .withColumn("total_effort_fte_from_prj_res", when((col("resource_type_name") == "Full-Time"), col("total_hours_pro_res"))) \
            .withColumn("total_cost_subcon_from_prj_res", when((col("resource_type_name") == "Sub Con"), col("net_total_cost_pro_res"))) \
            .withColumn("total_effort_subcon_from_prj_res", when((col("resource_type_name") == "Sub Con") , col("total_hours_pro_res"))) \
            .withColumn("total_cost_nonlabor_from_prj_res", when((col("resource_type_name") == "Non-Labor") , col("net_total_cost_pro_res")))

        df_region = df_region.withColumn("total_cost_from_prj_res",
            coalesce(col("total_cost_fte_from_prj_res").cast("double"), lit(0.0)) +
            coalesce(col("total_cost_subcon_from_prj_res").cast("double"), lit(0.0)) +
            coalesce(col("total_cost_nonlabor_from_prj_res").cast("double"), lit(0.0))
        )

        df_region = df_region.withColumn("total_effort_from_prj_res",
            coalesce(col("total_effort_fte_from_prj_res").cast("double"), lit(0.0)) +
            coalesce(col("total_effort_subcon_from_prj_res").cast("double"), lit(0.0))
        )
        # logger.info("2")
        # df_region.show(40, truncate=False)
        # === Aggregations ===
        # 1. Project Fiscal
        base_group = ["fiscal_year", "account_rid", "project_fiscal_rid"]

        project_fiscal = df.groupBy(base_group).agg(
            _sum(when(col("resource_type_name") == "Full-Time", 1).otherwise(0)).alias("total_fte_from_prj_res"),
            _sum(when(col("resource_type_name") == "Sub Con", 1).otherwise(0)).alias("total_subcon_from_prj_res"),
            _sum(when(col("resource_type_name") == "Non-Labor", 1).otherwise(0)).alias("total_nonlabor_from_prj_res"),
            _sum("net_total_cost_pro_res").alias("total_cost_from_prj_res"),
            _sum("total_effort_from_prj_res").alias("total_effort_from_prj_res"),
            _sum("total_cost_fte_from_prj_res").alias("total_cost_fte_from_prj_res"),
            _sum("total_effort_fte_from_prj_res").alias("total_effort_fte_from_prj_res"),
            _sum("total_cost_subcon_from_prj_res").alias("total_cost_subcon_from_prj_res"),
            _sum("total_effort_subcon_from_prj_res").alias("total_effort_subcon_from_prj_res"),
            _sum("total_cost_nonlabor_from_prj_res").alias("total_cost_nonlabor_from_prj_res")
            )

        project_fiscal = project_fiscal.withColumn("total_resources_from_prj_res",
            coalesce(col("total_fte_from_prj_res").cast("double"), lit(0.0)) +
            coalesce(col("total_subcon_from_prj_res").cast("double"), lit(0.0)) +
            coalesce(col("total_nonlabor_from_prj_res").cast("double"), lit(0.0))
        )
        project_fiscal_final = project_fiscal.withColumnRenamed("project_fiscal_rid", "rid")
        logger.info("project fiscal table")
        # project_fiscal.show()

        self._upsert_aggregated_data(
            df=project_fiscal_final,
            target_table=self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE),
            keys=["fiscal_year", "account_rid", "rid"],
            update_fields=[
                "total_resources_from_prj_res",
                "total_fte_from_prj_res",
                "total_subcon_from_prj_res",
                "total_nonlabor_from_prj_res",
                "total_cost_from_prj_res",
                "total_effort_from_prj_res",
                "total_cost_fte_from_prj_res",
                "total_effort_fte_from_prj_res",
                "total_cost_subcon_from_prj_res",
                "total_effort_subcon_from_prj_res",
                "total_cost_nonlabor_from_prj_res"
            ],
            account_r_number=account_r_number
        )

        # 2. Project Fiscal Region
        base_region_group = ["fiscal_year", "account_rid", "project_fiscal_rid", "region_rid"]

        project_fiscal_region = df_region.groupBy(base_region_group).agg(
            _sum(when(col("resource_type_name") == "Full-Time", 1).otherwise(0)).alias("total_fte_from_prj_res"),
            _sum(when(col("resource_type_name") == "Sub Con", 1).otherwise(0)).alias("total_subcon_from_prj_res"),
            _sum(when(col("resource_type_name") == "Non-Labor", 1).otherwise(0)).alias("total_nonlabor_from_prj_res"),
            _sum("net_total_cost_pro_res").alias("total_cost_from_prj_res"),
            _sum("total_effort_from_prj_res").alias("total_effort_from_prj_res"),
            _sum("total_cost_fte_from_prj_res").alias("total_cost_fte_from_prj_res"),
            _sum("total_effort_fte_from_prj_res").alias("total_effort_fte_from_prj_res"),
            _sum("total_cost_subcon_from_prj_res").alias("total_cost_subcon_from_prj_res"),
            _sum("total_effort_subcon_from_prj_res").alias("total_effort_subcon_from_prj_res"),
            _sum("total_cost_nonlabor_from_prj_res").alias("total_cost_nonlabor_from_prj_res")
            )

        project_fiscal_region = project_fiscal_region.withColumn("total_resources_from_prj_res",
            coalesce(col("total_fte_from_prj_res").cast("double"), lit(0.0)) +
            coalesce(col("total_subcon_from_prj_res").cast("double"), lit(0.0)) +
            coalesce(col("total_nonlabor_from_prj_res").cast("double"), lit(0.0))
        )
        # logger.info("project fiscal region table")
        # project_fiscal_region.show(40, truncate=False)

        self._upsert_aggregated_data(
            df=project_fiscal_region,
            target_table=self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_REGION_TABLE),
            keys=["fiscal_year", "account_rid", "project_fiscal_rid", "region_rid"],
            update_fields=[
                "total_resources_from_prj_res",
                "total_fte_from_prj_res",
                "total_subcon_from_prj_res",
                "total_nonlabor_from_prj_res",
                "total_cost_from_prj_res",
                "total_effort_from_prj_res",
                "total_cost_fte_from_prj_res",
                "total_effort_fte_from_prj_res",
                "total_cost_subcon_from_prj_res",
                "total_effort_subcon_from_prj_res",
                "total_cost_nonlabor_from_prj_res"
            ],
            account_r_number=account_r_number
        )

        # Project table aggregation
        # df.show()

        # 3. Resource Fiscal
        resource_fiscal = df.groupBy("fiscal_year", "account_rid", "resource_rid") \
            .agg(
                _sum("total_hours_pro_res").alias("total_effort_for_year_project_resource_level"),
                _sum("total_cost_pro_res").alias("total_cost_for_year_project_resource_level")
            )
        # resource_fiscal.show()
        self._upsert_aggregated_data(
            df=resource_fiscal,
            target_table=self.get_tenant_table(account_r_number, config.PROD_RESOURCE_FISCAL_TABLE),
            keys=["fiscal_year", "account_rid", "resource_rid"],
            update_fields=[
                "total_effort_for_year_project_resource_level",
                "total_cost_for_year_project_resource_level"
            ],
            account_r_number=account_r_number
        )
        logger.info("region changing")
        # df.show()
        # 4. Resource Fiscal Region (renamed region to country_region)
        df_resource = df.withColumnRenamed("region_rid", "country_region_rid")
        # df.show()
        resource_fiscal_region = df_resource.groupBy("fiscal_year", "account_rid", "resource_rid", "country_region_rid") \
            .agg(
                _sum("total_hours_pro_res").alias("total_effort_for_year_project_resource_level"),
                _sum("net_total_cost_pro_res").alias("total_cost_for_year_project_resource_level")
            )
        # resource_fiscal_region.show()
        self._upsert_aggregated_data(
            df=resource_fiscal_region,
            target_table=self.get_tenant_table(account_r_number, config.PROD_RESOURCE_FISCAL_REGION_TABLE),
            keys=["fiscal_year", "account_rid", "resource_rid", "country_region_rid"],
            update_fields=[
                "total_effort_for_year_project_resource_level",
                "total_cost_for_year_project_resource_level"
            ],
            account_r_number=account_r_number
        )
        # Get total_projects from fiscal_df
        # project_fiscal.show()
        project_count_df = project_fiscal.groupBy("account_rid", "fiscal_year") \
            .agg(countDistinct("project_fiscal_rid").alias("total_projects"))
        project_count_df = project_count_df.withColumnRenamed("total_projects", "project_count")

        pf_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
        project_count_query = f"""(
            SELECT account_rid, fiscal_year, COUNT(DISTINCT rid) as project_count
            FROM {pf_table}
            WHERE account_rid = '{account_rid}' AND fiscal_year = {fiscal_year}
            GROUP BY account_rid, fiscal_year
        ) AS project_count"""

        project_count_df = spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", project_count_query) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load()


        # Aggregate other metrics from df
        account_fiscal_df = project_fiscal.groupBy("account_rid", "fiscal_year").agg(
            _sum("total_effort_from_prj_res").alias("total_project_res_hours"),
            _sum("total_cost_from_prj_res").alias("total_project_res_cost"),
            _sum("total_effort_fte_from_prj_res").alias("total_project_res_hours_fte"),
            _sum("total_effort_subcon_from_prj_res").alias("total_project_res_hours_subcon"),
            _sum("total_cost_fte_from_prj_res").alias("total_project_res_cost_fte"),
            _sum("total_cost_subcon_from_prj_res").alias("total_project_res_cost_subcon"),
            _sum("total_cost_nonlabor_from_prj_res").alias("total_project_res_cost_nonlabor") 
        )

        # Join with project count
        account_fiscal_df = account_fiscal_df.join(
            project_count_df,
            on=["account_rid", "fiscal_year"],
            how="left"
        ).withColumn(
            "total_projects",
            coalesce(col("project_count"), lit(0))
        ).drop("project_count")

        logger.info("account fiscal table")
        # account_fiscal_df.show()

        self._upsert_aggregated_data(
            df=account_fiscal_df,
            target_table=self.get_tenant_table(account_r_number, config.ACCOUNT_FISCAL_TABLE),
            keys=["fiscal_year", "account_rid"],
            update_fields=[
                "total_projects",
                "total_project_res_hours",
                "total_project_res_cost",
                "total_project_res_hours_fte",
                "total_project_res_hours_subcon",
                "total_project_res_cost_fte",
                "total_project_res_cost_subcon",
                "total_project_res_cost_nonlabor"
            ],
            account_r_number=account_r_number
        )

        self._upsert_aggregated_data_account(
            df=account_fiscal_df,
            target_table=self.get_public_table(config.ACCOUNT_FISCAL_SUMMARY_TABLE),
            keys=["fiscal_year", "account_rid"],
            update_fields=[
                "total_projects",
                "total_project_res_hours",
                "total_project_res_cost",
                "total_project_res_hours_fte",
                "total_project_res_hours_subcon",
                "total_project_res_cost_fte",
                "total_project_res_cost_subcon",
                "total_project_res_cost_nonlabor"
            ],
            account_r_number=account_r_number
        )
        # logger.info("4")
        # project_fiscal_region.show(40, truncate=False)
        project_count_df = project_fiscal_region.groupBy("account_rid", "fiscal_year","region_rid") \
            .agg(countDistinct("project_fiscal_rid").alias("total_projects"))
        
        project_count_df = project_count_df.withColumnRenamed("total_projects", "project_count")
        project_count_df = project_count_df.withColumnRenamed("region_rid", "region_rid_project")
        # logger.info("5")
        # project_fiscal_region.show(40, truncate=False)
        account_fiscal_region_df = project_fiscal_region.groupBy("account_rid", "fiscal_year", "region_rid").agg(
            _sum("total_effort_from_prj_res").alias("total_project_res_hours"),
            _sum("total_cost_from_prj_res").alias("total_project_res_cost"),
            _sum("total_effort_fte_from_prj_res").alias("total_project_res_hours_fte"),
            _sum("total_effort_subcon_from_prj_res").alias("total_project_res_hours_subcon"),
            _sum("total_cost_fte_from_prj_res").alias("total_project_res_cost_fte"),
            _sum("total_cost_subcon_from_prj_res").alias("total_project_res_cost_subcon"),
            _sum("total_cost_nonlabor_from_prj_res").alias("total_project_res_cost_nonlabor") 
        )


        account_fiscal_region_df = account_fiscal_region_df.join(
            project_count_df,
            (account_fiscal_region_df["account_rid"] == project_count_df["account_rid"]) &
            (account_fiscal_region_df["fiscal_year"] == project_count_df["fiscal_year"]) &
            (account_fiscal_region_df["region_rid"] == project_count_df["region_rid_project"]),
            how="left"
        ).withColumn(
            "total_projects", coalesce(col("project_count"), lit(0))
        ).drop(
            project_count_df["account_rid"]
        ).drop(
            project_count_df["fiscal_year"]
        ).drop(
            "region_rid_project", "project_count"
        )

        # logger.info("account fiscal region table")
        # account_fiscal_region_df.show(40, truncate=False)
        self._upsert_aggregated_data(
            df=account_fiscal_region_df,
            target_table=self.get_tenant_table(account_r_number, config.ACCOUNT_FISCAL_REGION_TABLE),
            keys=["fiscal_year", "account_rid", "region_rid"],
            update_fields=[
                "total_projects",
                "total_project_res_hours",
                "total_project_res_cost",
                "total_project_res_hours_fte",
                "total_project_res_hours_subcon",
                "total_project_res_cost_fte",
                "total_project_res_cost_subcon",
                "total_project_res_cost_nonlabor"
            ],
            account_r_number=account_r_number
        )

        # Load project table filtered by account_rid
        project_df = (
            spark.read.format("jdbc")
            .option("url", config.ENTITY_DB_URL)
            .option(
                "dbtable",
                f"(SELECT * FROM {self.get_tenant_table(account_r_number, config.PROD_PROJECT_TABLE)} "
                f"WHERE account_rid = '{account_rid}') as t"
            )
            .option("user", config.ENTITY_DB_USER)
            .option("password", config.ENTITY_DB_PASSWORD)
            .load()
        )

        # ✅ Aggregate: count projects per account
        account_summary_df = project_df.groupBy("account_rid").agg(
            F.count("*").alias("total_projects")
        )
        # Rename for consistency with account table
        account_summary_df = account_summary_df.withColumnRenamed("account_rid", "rid")

        # ✅ Upsert into account table
        self._upsert_aggregated_data_account(
            df=account_summary_df,
            target_table=self.get_public_table(config.ACCOUNT_TABLE),
            keys=["rid"],
            update_fields=["total_projects"],
            account_r_number=account_r_number
        )

        return True

    def process_aggregation_project_task(self, incoming_df: DataFrame, account_rid: str, account_r_number: str, fiscal_year: int) -> None:

        spark = self.spark

        active_status_rid = self.get_resource_status_rid("Active")

        # === Read project_resource table ===
        pr_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_TASK_TABLE)
        query = f"""(
            SELECT account_rid, project_fiscal_rid, resource_rid, region_rid,
                total_hours_pro_task, total_cost_pro_task, fiscal_year
            FROM {pr_table}
            WHERE account_rid = '{account_rid}' AND fiscal_year = {fiscal_year} AND status_rid = '{active_status_rid}'
        ) AS pr_filtered"""
        logger.info(f"query - {query}")
        base_df = spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", query) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load()

        # base_df.show()
        resource_table = self.get_tenant_table(account_r_number, config.PROD_RESOURCE_TABLE)
        resource_df = spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", resource_table) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .select("rid", "resource_type_rid")
        resource_df = resource_df.withColumnRenamed("rid", "resource_rid")
        base_df = base_df.join(
            resource_df,
            on="resource_rid",
            how="left"
        )
        if base_df is not None and not base_df.rdd.isEmpty():
            base_df.persist(StorageLevel.MEMORY_AND_DISK)
        # base_df.show()
        logger.info(f"✅ Aggregation source row count: {base_df.count()}")
        if base_df is not None:
            base_df.unpersist()
        # === 1. project_resource_fiscal ===
        pr_fiscal = base_df.groupBy("fiscal_year", "account_rid", "project_fiscal_rid", "resource_rid") \
            .agg(
                _sum("total_hours_pro_task").alias("total_hours_from_tasks"),
                _sum("total_cost_pro_task").alias("total_cost_from_tasks"),
                _sum("total_hours_pro_task").alias("effort_project_task_level"),
                _sum("total_cost_pro_task").alias("cost_project_task_level")
            )
        logger.info("project resource fiscal table")
        # pr_fiscal.show()

        self._upsert_aggregated_data(
            df=pr_fiscal,
            target_table=self.get_tenant_table(account_r_number, config.PROD_PROJECT_RESOURCE_FISCAL_TABLE),
            keys=["fiscal_year", "account_rid", "project_fiscal_rid", "resource_rid"],
            update_fields=[
                "total_hours_from_tasks",
                "total_cost_from_tasks",
                "effort_project_task_level",
                "cost_project_task_level"
            ],
            account_r_number=account_r_number
        )

        # === 2. project_resource_fiscal_region ===
        pr_fiscal_region = base_df.groupBy("fiscal_year", "account_rid", "project_fiscal_rid", "resource_rid", "region_rid") \
            .agg(
                _sum("total_hours_pro_task").alias("total_hours_from_tasks"),
                _sum("total_cost_pro_task").alias("total_cost_from_tasks"),
                _sum("total_hours_pro_task").alias("effort_project_task_level"),
                _sum("total_cost_pro_task").alias("cost_project_task_level")
            )
        logger.info("project resource fiscal region table")
        # pr_fiscal_region.show()

        self._upsert_aggregated_data(
            df=pr_fiscal_region,
            target_table=self.get_tenant_table(account_r_number, config.PROD_PROJECT_RESOURCE_FISCAL_REGION_TABLE),
            keys=["fiscal_year", "account_rid", "project_fiscal_rid", "resource_rid", "region_rid"],
            update_fields=[
                "total_hours_from_tasks",
                "total_cost_from_tasks",
                "effort_project_task_level",
                "cost_project_task_level"
            ],
            account_r_number=account_r_number
        )

        # === Fetch resource_type_name mapping ===
        resource_type_table = self.get_public_table(config.RESOURCE_TYPE)
        res_type_df = spark.read \
            .format("jdbc") \
            .option("url", config.MAIN_DB_URL) \
            .option("dbtable", resource_type_table) \
            .option("user", config.MAIN_DB_USER) \
            .option("password", settings.MAIN_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .select(col("rid").alias("resource_type_rid"), col("resource_type_name"))

        base_df = base_df.join(res_type_df, on="resource_type_rid", how="left")

        # === Fetch project_fiscal for default_metric_type ===
        pf_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
        pf_region_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_REGION_TABLE)
        fiscal_df = spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", pf_table) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .select("account_rid", "rid", "project_rid", "fiscal_year", "default_metric_type") \
            .withColumnRenamed("rid", "project_fiscal_rid")

        df = base_df.join(fiscal_df, on=["project_fiscal_rid", "account_rid", "fiscal_year"], how="left")

        fiscal_region_df = spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", pf_region_table) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .select("account_rid", "rid", "project_rid", "fiscal_year", "default_metric_type") \
            .withColumnRenamed("rid", "project_fiscal_rid")

        df_region = base_df.join(fiscal_region_df, on=["project_fiscal_rid", "account_rid", "fiscal_year"], how="left")
        # === Prepare common columns ===
        df = df.withColumn("total_cost_fte_from_tasks", when((col("resource_type_name") == "Full-Time"), col("total_cost_pro_task"))) \
            .withColumn("total_effort_fte_from_tasks", when((col("resource_type_name") == "Full-Time") , col("total_hours_pro_task"))) \
            .withColumn("total_cost_subcon_from_tasks", when((col("resource_type_name") == "Sub Con") , col("total_cost_pro_task"))) \
            .withColumn("total_effort_subcon_from_tasks", when((col("resource_type_name") == "Sub Con") , col("total_hours_pro_task")))

        df = df.withColumn("total_cost_from_tasks",
            coalesce(col("total_cost_fte_from_tasks").cast("double"), lit(0.0)) +
            coalesce(col("total_cost_subcon_from_tasks").cast("double"), lit(0.0))
        )

        df = df.withColumn("total_effort_from_tasks",
            coalesce(col("total_effort_fte_from_tasks").cast("double"), lit(0.0)) +
            coalesce(col("total_effort_subcon_from_tasks").cast("double"), lit(0.0))
        )

        # === Prepare common columns ===
        df_region = df_region.withColumn("total_cost_fte_from_tasks", when((col("resource_type_name") == "Full-Time"), col("total_cost_pro_task"))) \
            .withColumn("total_effort_fte_from_tasks", when((col("resource_type_name") == "Full-Time") , col("total_hours_pro_task"))) \
            .withColumn("total_cost_subcon_from_tasks", when((col("resource_type_name") == "Sub Con") , col("total_cost_pro_task"))) \
            .withColumn("total_effort_subcon_from_tasks", when((col("resource_type_name") == "Sub Con") , col("total_hours_pro_task")))

        df_region = df_region.withColumn("total_cost_from_tasks",
            coalesce(col("total_cost_fte_from_tasks").cast("double"), lit(0.0)) +
            coalesce(col("total_cost_subcon_from_tasks").cast("double"), lit(0.0))
        )

        df_region = df_region.withColumn("total_effort_from_tasks",
            coalesce(col("total_effort_fte_from_tasks").cast("double"), lit(0.0)) +
            coalesce(col("total_effort_subcon_from_tasks").cast("double"), lit(0.0))
        )
        # df.show()
        # === Aggregations ===
        # 1. Project Fiscal
        base_group = ["fiscal_year", "account_rid", "project_fiscal_rid"]

            # Exclude effective fields
        project_fiscal = df.groupBy(base_group).agg(
            _sum(when(col("resource_type_name") == "Full-Time", 1).otherwise(0)).alias("total_fte_from_tasks"),
            _sum(when(col("resource_type_name") == "Sub Con", 1).otherwise(0)).alias("total_subcon_from_tasks"),
            _sum(when(col("resource_type_name") == "Non-Labor", 1).otherwise(0)).alias("total_nonlabor_from_tasks"),
            _sum("total_cost_from_tasks").alias("total_cost_from_tasks"),
            _sum("total_effort_from_tasks").alias("total_effort_from_tasks"),
            _sum("total_cost_fte_from_tasks").alias("total_cost_fte_from_tasks"),
            _sum("total_effort_fte_from_tasks").alias("total_effort_fte_from_tasks"),
            _sum("total_cost_subcon_from_tasks").alias("total_cost_subcon_from_tasks"),
            _sum("total_effort_subcon_from_tasks").alias("total_effort_subcon_from_tasks")
        )

        project_fiscal = project_fiscal.withColumn("total_resources_from_tasks",
            coalesce(col("total_fte_from_tasks").cast("double"), lit(0.0)) +
            coalesce(col("total_subcon_from_tasks").cast("double"), lit(0.0)) +
            coalesce(col("total_nonlabor_from_tasks").cast("double"), lit(0.0))
        )
        project_fiscal_final = project_fiscal.withColumnRenamed("project_fiscal_rid", "rid")
        logger.info("project fiscal table")
        # project_fiscal.show()

        self._upsert_aggregated_data(
            df=project_fiscal_final,
            target_table=self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE),
            keys=["fiscal_year", "account_rid", "rid"],
            update_fields=[
                "total_fte_from_tasks",
                "total_subcon_from_tasks",
                "total_nonlabor_from_tasks",
                "total_resources_from_tasks",
                "total_cost_from_tasks",
                "total_effort_from_tasks",
                "total_cost_fte_from_tasks",
                "total_effort_fte_from_tasks",
                "total_cost_subcon_from_tasks",
                "total_effort_subcon_from_tasks"
            ],
            account_r_number=account_r_number
        )

        # 2. Project Fiscal Region
        base_region_group = ["fiscal_year", "account_rid", "project_fiscal_rid", "region_rid"]

        project_fiscal_region = df_region.groupBy(base_region_group).agg(
            _sum(when(col("resource_type_name") == "Full-Time", 1).otherwise(0)).alias("total_fte_from_tasks"),
            _sum(when(col("resource_type_name") == "Sub Con", 1).otherwise(0)).alias("total_subcon_from_tasks"),
            _sum(when(col("resource_type_name") == "Non-Labor", 1).otherwise(0)).alias("total_nonlabor_from_tasks"),
            _sum("total_cost_from_tasks").alias("total_cost_from_tasks"),
            _sum("total_effort_from_tasks").alias("total_effort_from_tasks"),
            _sum("total_cost_fte_from_tasks").alias("total_cost_fte_from_tasks"),
            _sum("total_effort_fte_from_tasks").alias("total_effort_fte_from_tasks"),
            _sum("total_cost_subcon_from_tasks").alias("total_cost_subcon_from_tasks"),
            _sum("total_effort_subcon_from_tasks").alias("total_effort_subcon_from_tasks")
        )
        project_fiscal_region = project_fiscal_region.withColumn("total_resources_from_tasks",
            coalesce(col("total_fte_from_tasks").cast("double"), lit(0.0)) +
            coalesce(col("total_subcon_from_tasks").cast("double"), lit(0.0)) +
            coalesce(col("total_nonlabor_from_tasks").cast("double"), lit(0.0))
        )
        logger.info("project fiscal region table")
        # project_fiscal_region.show()

        self._upsert_aggregated_data(
            df=project_fiscal_region,
            target_table=self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_REGION_TABLE),
            keys=["fiscal_year", "account_rid", "project_fiscal_rid", "region_rid"],
            update_fields=[
                "total_fte_from_tasks",
                "total_subcon_from_tasks",
                "total_nonlabor_from_tasks",
                "total_resources_from_tasks",
                "total_cost_from_tasks",
                "total_effort_from_tasks",
                "total_cost_fte_from_tasks",
                "total_effort_fte_from_tasks",
                "total_cost_subcon_from_tasks",
                "total_effort_subcon_from_tasks",
            ],
            account_r_number=account_r_number
        )

        # Step 1: Group and aggregate task-level fields
        resource_fiscal = df.groupBy("fiscal_year", "account_rid", "resource_rid") \
            .agg(
                _sum("total_hours_pro_task").alias("total_effort_for_year_project_task_level"),
                _sum("total_cost_pro_task").alias("total_cost_for_year_project_task_level")
            )
        # resource_fiscal.show()
        self._upsert_aggregated_data(
            df=resource_fiscal,
            target_table=self.get_tenant_table(account_r_number, config.PROD_RESOURCE_FISCAL_TABLE),
            keys=["fiscal_year", "account_rid", "resource_rid"],
            update_fields=[
                "total_effort_for_year_project_task_level",
                "total_cost_for_year_project_task_level"
            ],
            account_r_number=account_r_number
        )
        logger.info("region changing")
        # df.show()
        # 4. Resource Fiscal Region (renamed region to country_region)
        df_resource = df.withColumnRenamed("region_rid", "country_region_rid")
        # df.show()
        resource_fiscal_region = df_resource.groupBy("fiscal_year", "account_rid", "resource_rid", "country_region_rid") \
            .agg(
                _sum("total_hours_pro_task").alias("total_effort_for_year_project_task_level"),
                _sum("total_cost_pro_task").alias("total_cost_for_year_project_task_level")
            )
        # resource_fiscal_region.show()
        self._upsert_aggregated_data(
            df=resource_fiscal_region,
            target_table=self.get_tenant_table(account_r_number, config.PROD_RESOURCE_FISCAL_REGION_TABLE),
            keys=["fiscal_year", "account_rid", "resource_rid", "country_region_rid"],
            update_fields=[
                "total_effort_for_year_project_task_level",
                "total_cost_for_year_project_task_level"
            ],
            account_r_number=account_r_number
        )
        # Get total_projects from fiscal_df
        # project_fiscal.show()
        pf_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)
        project_count_query = f"""(
            SELECT account_rid, fiscal_year, COUNT(DISTINCT rid) as project_count
            FROM {pf_table}
            WHERE account_rid = '{account_rid}' AND fiscal_year = {fiscal_year}
            GROUP BY account_rid, fiscal_year
        ) AS project_count"""

        project_count_df = (
            spark.read
            .format("jdbc")
            .option("url", config.ENTITY_DB_URL)
            .option("dbtable", project_count_query)
            .option("user", config.ENTITY_DB_USER)
            .option("password", settings.ENTITY_DB_PASSWORD)
            .option("driver", config.ENTITY_DB_DRIVER)
            .load()
        )
        pf_table = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)

        project_fiscal_query = f"""(
            SELECT *
            FROM {pf_table}
            WHERE account_rid = '{account_rid}'
            AND fiscal_year = {fiscal_year}
        ) AS project_fiscal_filtered"""

        project_fiscal_df = (
            spark.read
            .format("jdbc")
            .option("url", config.ENTITY_DB_URL)
            .option("dbtable", project_fiscal_query)
            .option("user", config.ENTITY_DB_USER)
            .option("password", settings.ENTITY_DB_PASSWORD)
            .option("driver", config.ENTITY_DB_DRIVER)
            .load()
        )
        # Base aggregation
        account_fiscal_df = project_fiscal_df.groupBy("account_rid", "fiscal_year").agg(
            _sum("total_effort_from_tasks").alias("total_project_task_hours"),
            _sum("total_cost_from_tasks").alias("total_project_task_cost"),
            _sum("total_effort_fte_from_tasks").alias("total_project_task_hours_fte"),
            _sum("total_effort_subcon_from_tasks").alias("total_project_task_hours_subcon"),
            _sum("total_cost_fte_from_tasks").alias("total_project_task_cost_fte"),
            _sum("total_cost_subcon_from_tasks").alias("total_project_task_cost_subcon"),
            _sum("total_fte_prj").alias("total_fte_prj"),
            _sum("total_fte_from_prj_res").alias("total_fte_from_prj_res"),
            _sum("total_fte_from_tasks").alias("total_fte_from_tasks"),
            _sum("total_subcon_prj").alias("total_subcon_prj"),
            _sum("total_subcon_from_prj_res").alias("total_subcon_from_prj_res"),
            _sum("total_subcon_from_tasks").alias("total_subcon_from_tasks"),
            _sum("total_nonlabor_prj").alias("total_nonlabor_prj"),
            _sum("total_nonlabor_from_prj_res").alias("total_nonlabor_from_prj_res"),
            _sum("total_nonlabor_from_tasks").alias("total_nonlabor_from_tasks")
        )

        # Add derived totals
        account_fiscal_df = account_fiscal_df.withColumn(
            "total_fte",
            coalesce(col("total_fte_prj"), lit(0)) +
            coalesce(col("total_fte_from_prj_res"), lit(0)) +
            coalesce(col("total_fte_from_tasks"), lit(0))
        ).withColumn(
            "total_subcon",
            coalesce(col("total_subcon_prj"), lit(0)) +
            coalesce(col("total_subcon_from_prj_res"), lit(0)) +
            coalesce(col("total_subcon_from_tasks"), lit(0))
        ).withColumn(
            "total_nonlabor",
            coalesce(col("total_nonlabor_prj"), lit(0)) +
            coalesce(col("total_nonlabor_from_prj_res"), lit(0)) +
            coalesce(col("total_nonlabor_from_tasks"), lit(0))
        )

        # Join with project count
        account_fiscal_df = account_fiscal_df.join(
            project_count_df,
            on=["account_rid", "fiscal_year"],
            how="left"
        ).withColumn(
            "total_projects",
            coalesce(col("project_count"), lit(0))
        ).drop("project_count")

        logger.info("✅ Aggregated account fiscal table with total_fte, total_subcon, and total_nonlabor")
        # account_fiscal_df.show()
        # Upsert into account_fiscal
        self._upsert_aggregated_data(
            df=account_fiscal_df,
            target_table=self.get_tenant_table(account_r_number, config.ACCOUNT_FISCAL_TABLE),
            keys=["fiscal_year", "account_rid"],
            update_fields=[
                "total_projects",
                "total_project_task_hours",
                "total_project_task_cost",
                "total_project_task_hours_fte",
                "total_project_task_hours_subcon",
                "total_project_task_cost_fte",
                "total_project_task_cost_subcon",
                "total_fte",
                "total_subcon",
                "total_nonlabor"
            ],
            account_r_number=account_r_number
        )
        self._upsert_aggregated_data_account(
            df=account_fiscal_df,
            target_table=self.get_public_table(config.ACCOUNT_FISCAL_SUMMARY_TABLE),
            keys=["fiscal_year", "account_rid"],
            update_fields=[
                "total_projects",
                "total_project_task_hours",
                "total_project_task_cost",
                "total_project_task_hours_fte",
                "total_project_task_hours_subcon",
                "total_project_task_cost_fte",
                "total_project_task_cost_subcon"
            ],
            account_r_number=account_r_number
        )

        project_count_df = project_fiscal_region.groupBy("account_rid", "fiscal_year","region_rid") \
            .agg(countDistinct("project_fiscal_rid").alias("total_projects"))

        project_count_df = project_count_df.withColumnRenamed("total_projects", "project_count")
        project_count_df = project_count_df.withColumnRenamed("region_rid", "region_rid_project")
        # project_fiscal_region.show()
        account_fiscal_region_df = project_fiscal_region.groupBy("account_rid", "fiscal_year", "region_rid").agg(
            _sum("total_effort_from_tasks").alias("total_project_task_hours"),
            _sum("total_cost_from_tasks").alias("total_project_task_cost"),
            _sum("total_effort_fte_from_tasks").alias("total_project_task_hours_fte"),
            _sum("total_effort_subcon_from_tasks").alias("total_project_task_hours_subcon"),
            _sum("total_cost_fte_from_tasks").alias("total_project_task_cost_fte"),
            _sum("total_cost_subcon_from_tasks").alias("total_project_task_cost_subcon")
        )

        account_fiscal_region_df = account_fiscal_region_df.join(
            project_count_df,
            (account_fiscal_region_df["account_rid"] == project_count_df["account_rid"]) &
            (account_fiscal_region_df["fiscal_year"] == project_count_df["fiscal_year"]) &
            (account_fiscal_region_df["region_rid"] == project_count_df["region_rid_project"]),
            how="left"
        ).withColumn(
            "total_projects", coalesce(col("project_count"), lit(0))
        ).drop(
            project_count_df["account_rid"]
        ).drop(
            project_count_df["fiscal_year"]
        ).drop(
            "region_rid_project", "project_count"
        )

        logger.info("account fiscal region table")
        # account_fiscal_region_df.show()
        self._upsert_aggregated_data(
            df=account_fiscal_region_df,
            target_table=self.get_tenant_table(account_r_number, config.ACCOUNT_FISCAL_REGION_TABLE),
            keys=["fiscal_year", "account_rid", "region_rid"],
            update_fields=[
                "total_projects",
                "total_project_task_hours",
                "total_project_task_cost",
                "total_project_task_hours_fte",
                "total_project_task_hours_subcon",
                "total_project_task_cost_fte",
                "total_project_task_cost_subcon"
            ],
            account_r_number=account_r_number
        )
        # Load project table filtered by account_rid
        project_df = (
            spark.read.format("jdbc")
            .option("url", config.ENTITY_DB_URL)
            .option(
                "dbtable",
                f"(SELECT * FROM {self.get_tenant_table(account_r_number, config.PROD_PROJECT_TABLE)} "
                f"WHERE account_rid = '{account_rid}') as t"
            )
            .option("user", config.ENTITY_DB_USER)
            .option("password", config.ENTITY_DB_PASSWORD)
            .load()
        )

        # ✅ Aggregate: count projects per account
        account_summary_df = project_df.groupBy("account_rid").agg(
            F.count("*").alias("total_projects")
        )
        # Rename for consistency with account table
        account_summary_df = account_summary_df.withColumnRenamed("account_rid", "rid")

        # ✅ Upsert into account table
        self._upsert_aggregated_data_account(
            df=account_summary_df,
            target_table=self.get_public_table(config.ACCOUNT_TABLE),
            keys=["rid"],
            update_fields=["total_projects"],
            account_r_number=account_r_number
        )
        return True


    def _upsert_aggregated_data(self, df: DataFrame, target_table: str, keys: list, update_fields: list, account_r_number: str) -> None:
        """
        Updates aggregated values in the specified target_table using composite keys.

        :param df: DataFrame containing the aggregated values to update.
        :param target_table: Fully qualified target table name (tenant-specific).
        :param keys: List of key column names used for matching rows (e.g., fiscal_year, project_code, etc.).
        :param update_fields: List of column names to be updated (e.g., total_cost_pro_res).
        :param account_r_number: Used for tenant-specific logging or validation if needed.
        """
        if df is not None and not df.rdd.isEmpty():
            df.persist(StorageLevel.MEMORY_AND_DISK)
        if df.rdd.isEmpty():
            logger.info(f"[{target_table}] ⚠️ No records to update.")
            return

        logger.info(f"[{target_table}] 🔄 Starting bulk update of {df.count()} records...")

        # Convert DataFrame to list of rows (as dictionaries)
        records = df.select(keys + update_fields).collect()
        if df is not None:
            df.unpersist()
        # Build SET clause and WHERE clause templates
        set_clause = ", ".join([f"{col} = %s" for col in update_fields])
        where_clause = " AND ".join([f"{col} = %s" for col in keys])

        # Final SQL template
        sql = f"""
            UPDATE {target_table}
            SET {set_clause}
            WHERE {where_clause}
        """

        # Prepare list of value tuples [(set values..., where values...), ...]
        update_values = [tuple([row[col] for col in update_fields] + [row[key] for key in keys]) for row in records]

        try:
            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.executemany(sql, update_values)
                conn.commit()

            logger.info(f"[{target_table}] ✅ Updated {len(update_values)} rows successfully.")
        except Exception as e:
            logger.error(f"[{target_table}] ❌ Failed to update records: {e}")

    def _upsert_aggregated_data_account(self, df: DataFrame, target_table: str, keys: list, update_fields: list, account_r_number: str) -> None:
            if df is not None and not df.rdd.isEmpty():
                df.persist(StorageLevel.MEMORY_AND_DISK)
            if df.rdd.isEmpty():
                logger.info(f"[{target_table}] ⚠️ No records to update.")
                return

            logger.info(f"[{target_table}] 🔄 Starting bulk update of {df.count()} records...")
            if df is not None:
                df.unpersist()
            # Convert DataFrame to list of rows (as dictionaries)
            records = df.select(keys + update_fields).collect()

            # Build SET clause and WHERE clause templates
            set_clause = ", ".join([f"{col} = %s" for col in update_fields])
            where_clause = " AND ".join([f"{col} = %s" for col in keys])

            # Final SQL template
            sql = f"""
                UPDATE {target_table}
                SET {set_clause}
                WHERE {where_clause}
            """

            # Prepare list of value tuples [(set values..., where values...), ...]
            update_values = [tuple([row[col] for col in update_fields] + [row[key] for key in keys]) for row in records]

            try:
                with DBPool.get_connection_mainDB() as conn:
                    with conn.cursor() as cursor:
                        cursor.executemany(sql, update_values)
                    conn.commit()

                logger.info(f"[{target_table}] ✅ Updated {len(update_values)} rows successfully.")
            except Exception as e:
                logger.error(f"[{target_table}] ❌ Failed to update records: {e}")

    def process_aggregation_case_project_resource(
        self,
        incoming_df: DataFrame,
        account_rid: str,
        account_r_number: str,
        fiscal_year: int
    ) -> None:

        spark = self.spark
        active_status_rid = self.get_resource_status_rid("Active")

        # ==========================================================
        # 1. CASE_PROJECT_RESOURCE  → CASE_PROJECT_RESOURCE_FISCAL
        # ==========================================================
        cpr_table = self.get_tenant_table(account_r_number, config.CASE_PROJECT_RESOURCE_TABLE)

        query = f"""(
            SELECT account_rid, case_rid, case_project_rid, project_fiscal_rid, resource_rid, region_rid,
                total_hours_pro_res, net_total_cost_pro_res, fiscal_year
            FROM {cpr_table}
            WHERE account_rid = '{account_rid}'
            AND fiscal_year = {fiscal_year}
            AND status_rid = '{active_status_rid}'
        ) AS cpr_filtered"""

        base_df = spark.read.format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", query) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load()
        cpr_fiscal = base_df.groupBy(
            "fiscal_year", "account_rid", "project_fiscal_rid", "resource_rid", "case_rid", "case_project_rid"
        ).agg(
            _sum("total_hours_pro_res").alias("total_hours_pro_res"),
            _sum("net_total_cost_pro_res").alias("total_cost_pro_res")
        )
        self._upsert_aggregated_data(
            df=cpr_fiscal,
            target_table=self.get_tenant_table(account_r_number, config.CASE_PROJECT_RESOURCE_FISCAL_TABLE),
            keys=["fiscal_year", "account_rid", "project_fiscal_rid", "resource_rid", "case_rid", "case_project_rid"],
            update_fields=["total_hours_pro_res", "total_cost_pro_res"],
            account_r_number=account_r_number
        )

        # ==========================================================
        # 2. JOIN RESOURCE + RESOURCE TYPE
        # ==========================================================
        resource_df = spark.read.format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", self.get_tenant_table(account_r_number, config.PROD_RESOURCE_TABLE)) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .selectExpr("rid as resource_rid", "resource_type_rid", "account_rid")

        base_df = base_df.join(resource_df, ["resource_rid", "account_rid"], "left")

        res_type_df = spark.read.format("jdbc") \
            .option("url", config.MAIN_DB_URL) \
            .option("dbtable", self.get_public_table(config.RESOURCE_TYPE)) \
            .option("user", config.MAIN_DB_USER) \
            .option("password", settings.MAIN_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .select(col("rid").alias("resource_type_rid"), col("resource_type_name"))

        base_df = base_df.join(res_type_df, "resource_type_rid", "left")

        # ==========================================================
        # 3. JOIN CASE_PROJECT (CASE PROJECT FISCAL)
        # ==========================================================
        cpf_df = spark.read.format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", self.get_tenant_table(account_r_number, config.CASE_PROJECTS_TABLE)) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .select("rid", "account_rid", "fiscal_year" , "case_rid", "project_fiscal_rid") \
            .withColumnRenamed("rid", "case_project_rid")

        df = base_df.join(cpf_df, ["project_fiscal_rid", "account_rid", "fiscal_year", "case_rid", "case_project_rid"], "left")

        # ==========================================================
        # 4. METRIC COLUMNS
        # ==========================================================
        df = df.withColumn("total_cost_fte_from_prj_res",
                        when(col("resource_type_name") == "Full-Time", col("net_total_cost_pro_res"))) \
            .withColumn("total_effort_fte_from_prj_res",
                        when(col("resource_type_name") == "Full-Time", col("total_hours_pro_res"))) \
            .withColumn("total_cost_subcon_from_prj_res",
                        when(col("resource_type_name") == "Sub Con", col("net_total_cost_pro_res"))) \
            .withColumn("total_effort_subcon_from_prj_res",
                        when(col("resource_type_name") == "Sub Con", col("total_hours_pro_res"))) \
            .withColumn("total_cost_nonlabor_from_prj_res",
                        when(col("resource_type_name") == "Non-Labor", col("net_total_cost_pro_res")))

        # ==========================================================
        # 5. CASE_PROJECT (PROJECT LEVEL)
        # ==========================================================
        base_group = ["fiscal_year", "account_rid", "project_fiscal_rid", "case_rid", "case_project_rid"]

        case_project = df.groupBy(base_group).agg(
            _sum(when(col("resource_type_name") == "Full-Time", 1).otherwise(0)).alias("total_fte_from_prj_res"),
            _sum(when(col("resource_type_name") == "Sub Con", 1).otherwise(0)).alias("total_subcon_from_prj_res"),
            _sum(when(col("resource_type_name") == "Non-Labor", 1).otherwise(0)).alias("total_nonlabor_from_prj_res"),
            _sum("net_total_cost_pro_res").alias("total_cost_from_prj_res"),
            _sum("total_hours_pro_res").alias("total_effort_from_prj_res"),
            _sum("total_cost_fte_from_prj_res").alias("total_cost_fte_from_prj_res"),
            _sum("total_effort_fte_from_prj_res").alias("total_effort_fte_from_prj_res"),
            _sum("total_cost_subcon_from_prj_res").alias("total_cost_subcon_from_prj_res"),
            _sum("total_effort_subcon_from_prj_res").alias("total_effort_subcon_from_prj_res"),
            _sum("total_cost_nonlabor_from_prj_res").alias("total_cost_nonlabor_from_prj_res")
        )

        case_project_final = case_project.withColumnRenamed("case_project_rid", "rid")
        self._upsert_aggregated_data(
            df=case_project_final,
            target_table=self.get_tenant_table(account_r_number, config.CASE_PROJECTS_TABLE),
            keys=["fiscal_year", "account_rid", "rid", "case_rid"],
            update_fields=[
                "total_fte_from_prj_res", "total_subcon_from_prj_res", "total_nonlabor_from_prj_res",
                "total_cost_from_prj_res", "total_effort_from_prj_res",
                "total_cost_fte_from_prj_res", "total_effort_fte_from_prj_res",
                "total_cost_subcon_from_prj_res", "total_effort_subcon_from_prj_res",
                "total_cost_nonlabor_from_prj_res"
            ],
            account_r_number=account_r_number
        )

        # ==========================================================
        # 6. CASE_PROJECT_FISCAL_REGION
        # ==========================================================
        base_region_group = ["fiscal_year", "account_rid", "project_fiscal_rid", "region_rid", "case_rid", "case_project_rid"]

        case_project_region = df.groupBy(base_region_group).agg(
            _sum(when(col("resource_type_name") == "Full-Time", 1).otherwise(0)).alias("total_fte_from_prj_res"),
            _sum(when(col("resource_type_name") == "Sub Con", 1).otherwise(0)).alias("total_subcon_from_prj_res"),
            _sum(when(col("resource_type_name") == "Non-Labor", 1).otherwise(0)).alias("total_nonlabor_from_prj_res"),
            _sum("net_total_cost_pro_res").alias("total_cost_from_prj_res"),
            _sum("total_hours_pro_res").alias("total_effort_from_prj_res"),
            _sum("total_cost_fte_from_prj_res").alias("total_cost_fte_from_prj_res"),
            _sum("total_effort_fte_from_prj_res").alias("total_effort_fte_from_prj_res"),
            _sum("total_cost_subcon_from_prj_res").alias("total_cost_subcon_from_prj_res"),
            _sum("total_effort_subcon_from_prj_res").alias("total_effort_subcon_from_prj_res"),
            _sum("total_cost_nonlabor_from_prj_res").alias("total_cost_nonlabor_from_prj_res")
        )
        self._upsert_aggregated_data(
            df=case_project_region,
            target_table=self.get_tenant_table(account_r_number, config.CASE_PROJECT_FISCAL_REGION_TABLE),
            keys=["fiscal_year", "account_rid", "project_fiscal_rid", "region_rid", "case_rid", "case_project_rid"],
            update_fields=[
                "total_fte_from_prj_res", "total_subcon_from_prj_res", "total_nonlabor_from_prj_res",
                "total_cost_from_prj_res", "total_effort_from_prj_res",
                "total_cost_fte_from_prj_res", "total_effort_fte_from_prj_res",
                "total_cost_subcon_from_prj_res", "total_effort_subcon_from_prj_res",
                "total_cost_nonlabor_from_prj_res"
            ],
            account_r_number=account_r_number
        )

        return True

    def process_aggregation_case_project_task(self, incoming_df: DataFrame,
                                          account_rid: str,
                                          account_r_number: str,
                                          fiscal_year: int) -> None:

        spark = self.spark
        active_status_rid = self.get_resource_status_rid("Active")

        # ======================================================
        # 1. case_project_task → case_project_resource_fiscal
        # ======================================================
        cpt_table = self.get_tenant_table(account_r_number, config.CASE_PROJECT_TASK_TABLE)

        query = f"""(
            SELECT account_rid, case_rid, case_project_rid, project_fiscal_rid, resource_rid, region_rid,
                total_hours_pro_task, total_cost_pro_task, fiscal_year
            FROM {cpt_table}
            WHERE account_rid = '{account_rid}'
            AND fiscal_year = {fiscal_year}
            AND status_rid = '{active_status_rid}'
        ) AS cpt_filtered"""

        base_df = spark.read.format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", query) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load()

        cpr_fiscal = base_df.groupBy(
            "fiscal_year","account_rid","project_fiscal_rid","resource_rid","case_project_rid","case_rid"
        ).agg(
            _sum("total_hours_pro_task").alias("total_hours_from_tasks"),
            _sum("total_cost_pro_task").alias("total_cost_from_tasks")
        )

        self._upsert_aggregated_data(
            df=cpr_fiscal,
            target_table=self.get_tenant_table(account_r_number, config.CASE_PROJECT_RESOURCE_FISCAL_TABLE),
            keys=["fiscal_year","account_rid","project_fiscal_rid","resource_rid","case_project_rid","case_rid"],
            update_fields=["total_hours_from_tasks","total_cost_from_tasks"],
            account_r_number=account_r_number
        )

        # ======================================================
        # 2. Join resource + type
        # ======================================================
        resource_df = spark.read.format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", self.get_tenant_table(account_r_number, config.PROD_RESOURCE_TABLE)) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .selectExpr("rid as resource_rid","resource_type_rid","account_rid")

        base_df = base_df.join(resource_df,["resource_rid","account_rid"],"left")

        res_type_df = spark.read.format("jdbc") \
            .option("url", config.MAIN_DB_URL) \
            .option("dbtable", self.get_public_table(config.RESOURCE_TYPE)) \
            .option("user", config.MAIN_DB_USER) \
            .option("password", settings.MAIN_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load() \
            .select(col("rid").alias("resource_type_rid"),col("resource_type_name"))

        df = base_df.join(res_type_df,"resource_type_rid","left")

        # ======================================================
        # 3. Metric columns
        # ======================================================
        df = df.withColumn("cost_fte", when(col("resource_type_name")=="Full-Time", col("total_cost_pro_task"))) \
            .withColumn("effort_fte", when(col("resource_type_name")=="Full-Time", col("total_hours_pro_task"))) \
            .withColumn("cost_subcon", when(col("resource_type_name")=="Sub Con", col("total_cost_pro_task"))) \
            .withColumn("effort_subcon", when(col("resource_type_name")=="Sub Con", col("total_hours_pro_task"))) \
            .withColumn("cost_nonlabor", when(col("resource_type_name")=="Non-Labor", col("total_cost_pro_task")))

        # ======================================================
        # 4. case_project_fiscal_region  (PROJECT_FISCAL)
        # ======================================================
        cpf_region = df.groupBy(
            "fiscal_year","account_rid","project_fiscal_rid","region_rid","case_project_rid","case_rid"
        ).agg(
            _sum(when(col("resource_type_name")=="Full-Time",1).otherwise(0)).alias("total_fte_from_tasks"),
            _sum(when(col("resource_type_name")=="Sub Con",1).otherwise(0)).alias("total_subcon_from_tasks"),
            _sum(when(col("resource_type_name")=="Non-Labor",1).otherwise(0)).alias("total_nonlabor_from_tasks"),
            _sum("total_cost_pro_task").alias("total_cost_from_tasks"),
            _sum("total_hours_pro_task").alias("total_effort_from_tasks"),
            _sum("cost_fte").alias("total_cost_fte_from_tasks"),
            _sum("effort_fte").alias("total_effort_fte_from_tasks"),
            _sum("cost_subcon").alias("total_cost_subcon_from_tasks"),
            _sum("effort_subcon").alias("total_effort_subcon_from_tasks")
        )

        self._upsert_aggregated_data(
            df=cpf_region,
            target_table=self.get_tenant_table(account_r_number, config.CASE_PROJECT_FISCAL_REGION_TABLE),
            keys=["fiscal_year","account_rid","project_fiscal_rid","region_rid","case_project_rid"],
            update_fields=[
                "total_fte_from_tasks","total_subcon_from_tasks","total_nonlabor_from_tasks",
                "total_cost_from_tasks","total_effort_from_tasks",
                "total_cost_fte_from_tasks","total_effort_fte_from_tasks",
                "total_cost_subcon_from_tasks","total_effort_subcon_from_tasks"
            ],
            account_r_number=account_r_number
        )

        # ======================================================
        # 5. case_project  (PROJECT_FISCAL_REGION)
        # ======================================================
        case_project = df.groupBy(
            "fiscal_year","account_rid","case_project_rid","case_rid"
        ).agg(
            _sum(when(col("resource_type_name")=="Full-Time",1).otherwise(0)).alias("total_fte_from_tasks"),
            _sum(when(col("resource_type_name")=="Sub Con",1).otherwise(0)).alias("total_subcon_from_tasks"),
            _sum(when(col("resource_type_name")=="Non-Labor",1).otherwise(0)).alias("total_nonlabor_from_tasks"),
            _sum("total_cost_pro_task").alias("total_cost_from_tasks"),
            _sum("total_hours_pro_task").alias("total_effort_from_tasks"),
            _sum("cost_fte").alias("total_cost_fte_from_tasks"),
            _sum("effort_fte").alias("total_effort_fte_from_tasks"),
            _sum("cost_subcon").alias("total_cost_subcon_from_tasks"),
            _sum("effort_subcon").alias("total_effort_subcon_from_tasks")
        )

        case_project_final = case_project.withColumnRenamed("case_project_rid","rid")

        self._upsert_aggregated_data(
            df=case_project_final,
            target_table=self.get_tenant_table(account_r_number, config.CASE_PROJECTS_TABLE),
            keys=["fiscal_year","account_rid","rid","case_rid"],
            update_fields=[
                "total_fte_from_tasks","total_subcon_from_tasks","total_nonlabor_from_tasks",
                "total_cost_from_tasks","total_effort_from_tasks",
                "total_cost_fte_from_tasks","total_effort_fte_from_tasks",
                "total_cost_subcon_from_tasks","total_effort_subcon_from_tasks"
            ],
            account_r_number=account_r_number
        )

        return True

    def get_open_case_projects_df(self, account_rid: str, account_r_number: str):
        spark = self.spark

        case_projects = self.get_tenant_table(account_r_number, config.CASE_PROJECTS_TABLE)
        if not self.table_exists_pg(case_projects):
            logger.warning(f"CASE_PROJECT table {case_projects} does not exist. Skipping case aggregation.")
            return None
        cases = self.get_tenant_table(account_r_number, config.CASES_TABLE)
        if not self.table_exists_pg(cases):
            logger.warning(f"CASE_PROJECT table {cases} does not exist. Skipping case aggregation.")
            return None
        closed_status_rid = self.get_case_status_rid("Closed")

        query = f"""
            ( SELECT cp.project_fiscal_rid
            FROM {case_projects} cp
            JOIN {cases} c
                ON c.rid = cp.case_rid
            AND c.account_rid = cp.account_rid
            WHERE cp.account_rid = '{account_rid}'
                AND c.status_rid <> '{closed_status_rid}'
            ) AS open_case_projects
        """

        return spark.read.format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", query) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", settings.ENTITY_DB_PASSWORD) \
            .option("driver", config.ENTITY_DB_DRIVER) \
            .load()

    
    def get_load_error_record_count(self, entity_type: str, document_id: str, account_r_number: str, account_rid: str, target_staging_processed: int) -> int:
        """
        Calculates error record count by subtracting the number of loaded records
        from the target staging processed count in the import table.
        """
        # Map entity_type to the corresponding tenant timeline table
        full_table_name = {
            "resource": self.get_tenant_table(account_r_number, config.ACCOUNT_TIMELINE_TABLE),
            "resource_cost": self.get_tenant_table(account_r_number, config.ACCOUNT_TIMELINE_TABLE),
            "resource_skill": self.get_tenant_table(account_r_number, config.ACCOUNT_TIMELINE_TABLE),
            "project": self.get_tenant_table(account_r_number, config.PROJECT_TIMELINE_TABLE),
            "project_resource": self.get_tenant_table(account_r_number, config.PROJECT_TIMELINE_TABLE),
            "project_task": self.get_tenant_table(account_r_number, config.PROJECT_TIMELINE_TABLE)
        }.get(entity_type)

        if not full_table_name:
            raise ValueError(f"Unsupported entity_type: {entity_type}")

        # Step 1: Count how many records are actually loaded (in timeline table)
        df: DataFrame = self.spark.read \
            .format("jdbc") \
            .option("url", config.ENTITY_DB_URL) \
            .option("dbtable", full_table_name) \
            .option("user", config.ENTITY_DB_USER) \
            .option("password", config.ENTITY_DB_PASSWORD) \
            .load()
        if df is not None and not df.rdd.isEmpty():
            df.persist(StorageLevel.MEMORY_AND_DISK)
        
        filtered_df = df.filter(
            (col("document_rid") == document_id) &
            (col("entity_name") == entity_type) &
            (col("account_rid") == account_rid)
        )

        sum_val = filtered_df.agg(
            spark_sum("source_record_count").alias("sum_count")
        ).first()["sum_count"]

        if sum_val is None:
            load_count = filtered_df.count()
        else:
            load_count = sum_val

        logger.info(f"load_count: {load_count}")
        if df is not None:
            df.unpersist()
        logger.info(f"target_staging_processed: {target_staging_processed}")
        return target_staging_processed - load_count

 
    def build_ai_trigger_payload(
        self,
        records_df,
        account_r_number: str,
        account_rid: str,
        entity_type: str,
        document_id: str,
        modified_by: str,
    ) -> Dict[str, Any]:

        payload = {
            "company_id": None,
            "input_text": "This is some text to be processed by the AI.",
            "model_type": "NA",
            "project_id": []
        }

        try:
            # Load project_fiscal table via JDBC (same method you already use)
            table_name = self.get_tenant_table(account_r_number, config.PROD_PROJECT_FISCAL_TABLE)

            fiscal_df = (
                self.spark.read
                .format("jdbc")
                .option("url", config.ENTITY_DB_URL)
                .option("dbtable", table_name)
                .option("user", config.ENTITY_DB_USER)
                .option("password", settings.ENTITY_DB_PASSWORD)
                .option("driver", config.ENTITY_DB_DRIVER)
                .load()
                .select("rid", "account_rid", "auto_access_rd")
            )

            # Prepare input
            input_df = records_df.select("project_fiscal_rid", "account_rid").distinct()

            # JOIN inside Spark (super fast)
            matched = (
                input_df.join(
                    fiscal_df,
                    (input_df.project_fiscal_rid == fiscal_df.rid) &
                    (input_df.account_rid == fiscal_df.account_rid),
                    "inner"
                )
                .filter(col("auto_access_rd") == True)
                .select(fiscal_df.rid, fiscal_df.account_rid)
            )

            result_rows = matched.collect()
            matched_ids = [r["rid"] for r in matched.collect()]
            if result_rows:
                payload["company_id"] = result_rows[0]["account_rid"]
                payload["project_id"] = matched_ids
                
                filtered_records = records_df.filter(
                    col("project_fiscal_rid").isin(matched_ids)
                )

                event_type_rid = self.get_event_type_rid(event_type_name="etl", entity_type=entity_type)
                self.log_entity_event_spark(
                        df= filtered_records,
                        account_rid=account_rid,
                        account_r_number=account_r_number,
                        event_name="triggered",
                        event_type_rid= event_type_rid,
                        event_status="success",
                        entity_type="Auto RD Assessment",
                        rid_column= "project_fiscal_rid",
                        document_id=document_id,
                        created_by=modified_by,
                        modified_by=modified_by
                    )
            return payload
        except Exception as e:
            logger.error(f"Error building AI trigger payload: {e}", exc_info=True)

        return payload

    def filter_failed_records(
        self,
        df: DataFrame,
        entity_type: str,
        account_rid: str,
        document_rid: str,
        account_r_number: str
    ) -> DataFrame:
        """
        Filters out records from df that already exist in staging table with status='Failed'.

        Args:
            df (DataFrame): Input DataFrame (with project_code, resource_code, resource_role, start_date, end_date).
            entity_type (str): One of ["project_resource", "project_task"].
            account_rid (str): Account RID.
            document_rid (str): Document RID.
            account_r_number (str): Tenant-specific account number.

        Returns:
            DataFrame: Filtered DataFrame with only non-failed records.
        """
        spark = self.spark

        # Map entity type to staging table
        staging_table_mapping = {
            "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE),
            "project_task": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TASK_TABLE),
        }
        staging_table = staging_table_mapping.get(entity_type)

        if not staging_table:
            raise ValueError(f"Invalid entity_type: {entity_type}")

        logger.info(f"Using staging_table: {staging_table}")

        # Step 1: Rename df columns to align with staging
        renamed_df = (
            df
            .withColumnRenamed("project_code", "project_id")
            .withColumnRenamed("resource_code", "resource_id")
        )

        # Step 2: Read staging data
        staging_df = (
            spark.read
            .format("jdbc")
            .option("url", config.ENTITY_DB_URL)
            .option("dbtable", staging_table)
            .option("user", config.ENTITY_DB_USER)
            .option("password", config.ENTITY_DB_PASSWORD)
            .load()
            .filter(F.col("account_rid") == account_rid)
            .filter(F.col("document_rid") == document_rid)
            .select("project_id", "resource_id", "resource_role", "start_date", "end_date", "status")
        )

        # Step 3: Filter only failed rows from staging
        failed_df = staging_df.filter(F.col("status") == "Failed")

        # Step 4: Anti-join to exclude failed records
        filtered_df = renamed_df.join(
            failed_df,
            on=[
                renamed_df.project_id == failed_df.project_id,
                renamed_df.resource_id == failed_df.resource_id,
                F.coalesce(renamed_df.resource_role, F.lit("")) == F.coalesce(failed_df.resource_role, F.lit("")),
            ],
            how="left_anti"
        )

        # Step 5: Rename back to original column names
        filtered_df = (
            filtered_df
            .withColumnRenamed("project_id", "project_code")
            .withColumnRenamed("resource_id", "resource_code")
        )

        return filtered_df

    def spark_to_postgres_type(self, col_name, spark_type):
        spark_type = spark_type.lower()

        if spark_type.startswith("decimal"):
            return "NUMERIC(18,2)"   # ✅ FIX
        elif spark_type in ("double", "float"):
            return "NUMERIC(18,6)"
        elif spark_type in ("int", "integer"):
            return "INTEGER"
        elif spark_type in ("bigint", "long"):
            return "BIGINT"
        elif spark_type == "date":
            return "DATE"
        elif spark_type == "timestamp":
            return "TIMESTAMP"
        elif spark_type == "boolean":
            return "BOOLEAN"
        else:
            return "VARCHAR(255)"

    def safe_spark_cast(self, spark_type: str) -> str:
        mapping = {
            "integer": "int",
            "bigint": "bigint",
            "double": "double",
            "float": "float",
            "decimal(18,2)": "decimal(18,2)",
            "date": "date",
            "timestamp": "timestamp"
        }
        return mapping.get(spark_type, spark_type)

    def get_currency_threshold(self, currency_rid: str) -> str:
        try:
            with DBPool.get_connection_mainDB() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        f"""
                        SELECT currency_threshold 
                        FROM {Constants.Database.SCHEMA_MAIN}.{Constants.Tables.CURRENCY}
                        WHERE rid = %s
                        """,
                        (currency_rid,)
                    )
                    result = cur.fetchone()
                    if result:
                        return result[0]  # return only the threshold value
                    else:
                        raise ValueError(f"Currency threshold not found for rid: {currency_rid}")
        except Exception as e:
            logger.error(f"Error fetching Currency threshold details: {str(e)}")
            raise

    def update_import_email_status(self, modified_by: str, document_id: str, account_r_number: str, status: str):
        """Update import email status in the database"""
        try:
            table_name=self.get_tenant_table(account_r_number, config.IMPORT_TABLE)
            with DBPool.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        f"""
                        UPDATE {table_name}
                        SET email_status = %s, modified_by = %s, modified_datetime = CURRENT_TIMESTAMP
                        WHERE document_rid = %s
                        """,
                        (status, modified_by, document_id)
                    )
                    conn.commit()
        except Exception as e:
            logger.error(f"Error updating import email status: {str(e)}")
            raise

    def get_import_email_status(self, document_id: str, account_r_number: str) -> bool:
        """Return True if email_status for the document is 'SENT', else False."""
        try:
            table_name = self.get_tenant_table(account_r_number, config.IMPORT_TABLE)

            with DBPool.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        f"""
                        SELECT email_status
                        FROM {table_name}
                        WHERE document_rid = %s
                        """,
                        (document_id,)
                    )
                    result = cur.fetchone()

                    # No record found
                    if not result:
                        return False

                    email_status = result[0]

                    # Return True if email_status is SENT
                    return email_status is not None and email_status.upper() == "SENT"

        except Exception as e:
            logger.error(f"Error fetching import email status: {str(e)}")
            raise

    def check_customisation_accounts(self, account_rid, account_name):
        try:
            table_name = self.get_public_table(config.CHECK_CUSTOMISATION_TABLE)

            with DBPool.get_connection_mainDB() as conn:
                query = f"""
                    SELECT 1
                    FROM {table_name}
                    WHERE account_rid = %s
                    AND TRIM(account_ref_name) = TRIM(%s)
                    AND status_rid = 'active'
                    LIMIT 1;
                """

                with conn.cursor() as cursor:
                    logger.info(f"Executing query: {query}")
                    cursor.execute(query, (account_rid, account_name))
                    result = cursor.fetchone()

                    logger.info(f"Query result -> {result}")

                    if result:
                        return True
                    else:
                        logger.warning(
                            f"No ACTIVE account found for "
                            f"account_rid={account_rid}, account_name={account_name}"
                        )
                        return False

        except Exception as e:
            logger.error(
                f"Error checking customisation accounts: {e}",
                exc_info=True
            )
            return False
    def get_account_details(self, account_rid: str):
        """
        Fetch account details from the database using account_rid.

        :param account_rid: The unique identifier for the account.
        :return: A dictionary containing account details if found, else None.
        """
        try:
            account_table_name = self.get_public_table(config.ACCOUNT_TABLE)
            country_table_name = self.get_public_table(config.COUNTRY_TABLE)

            with DBPool.get_connection_mainDB() as conn:
                query = f"""
                    SELECT a.account_name,
                        a.country_rid,
                        c.country_code
                    FROM  {account_table_name} a
                    JOIN  {country_table_name} c
                        ON a.country_rid = c.rid
                    WHERE  a.rid = %s
                    ORDER BY a.rid ASC
                    LIMIT 1;
                """
                with conn.cursor() as cursor:
                    cursor.execute(query, (account_rid,))
                    result = cursor.fetchone()
                    if result:
                        account_name, country_rid, country_code = result
                        return account_name, country_rid, country_code
                    return None
        except Exception as e:
            logger.error(f"Error fetching account info for {account_rid}: {e}")
            return None

    def filter_rd_claim_and_mark_staging(
        self,
        df: DataFrame,
        sub_entity_type: str,
        entity_type: str,
        account_rid: str,
        account_r_number: str,
        document_id: str,
        fiscal_year: int
    ) -> DataFrame:
        """
        Blocks upserts when project_fiscal.is_rd_claim_status = true.
        Updates staging for blocked rows and returns only allowed rows.
        Applies to: project, project_resource, project_task
        """

        if entity_type not in ["project", "project_resource", "project_task"]:
            return df
        df = self.map_fiscal_rid_with_data(
                    df,
                    entity_type,
                    account_r_number,
                    fiscal_year
                )
        logger.info(f"[{entity_type}] Applying RD-claim guard before upsert...")

        project_fiscal_table = self.get_tenant_table(account_r_number, "project_fiscal")

        project_fiscal_df = (
            self.spark.read
            .format("jdbc")
            .option("url", config.ENTITY_DB_URL)
            .option(
                "dbtable",
                f"(SELECT rid AS project_fiscal_rid, is_rd_claim_qualified FROM {project_fiscal_table}) pf"
            )
            .option("user", config.ENTITY_DB_USER)
            .option("password", settings.ENTITY_DB_PASSWORD)
            .option("driver", config.ENTITY_DB_DRIVER)
            .load()
        )

        df = df.join(F.broadcast(project_fiscal_df), "project_fiscal_rid", "left")

        blocked_df = df.filter(F.col("is_rd_claim_qualified") == True)
        allowed_df = df.filter(
            (F.col("is_rd_claim_qualified") == False) |
            (F.col("is_rd_claim_qualified").isNull())
        ).drop("is_rd_claim_qualified")
        if not blocked_df.rdd.isEmpty():
            logger.warning(
                f"[{entity_type}] {blocked_df.count()} rows blocked because RD claim already qualified"
            )

            if entity_type == "project_resource" and sub_entity_type == "project_resource":
                staging_table = self.get_tenant_table(
                    account_r_number,
                    config.STAGING_PROJECT_RESOURCE_TABLE
                )
                rows = (
                    blocked_df
                    .select("project_code", "resource_code")
                    .distinct()
                    .collect()
                )

                for r in rows:
                    self._update_staging_failure(
                        staging_table,
                        account_rid,
                        r.resource_code,
                        r.project_code,
                        document_id,
                        Constants.ErrorMessages.RD_CLAIM_ALREADY_QUALIFIED
                    )

            elif entity_type == "project_task" and sub_entity_type == "project_task":
                staging_table = self.get_tenant_table(
                    account_r_number,
                    config.STAGING_PROJECT_TASK_TABLE
                )
                rows = (
                    blocked_df
                    .select("project_code", "resource_code")
                    .distinct()
                    .collect()
                )

                for r in rows:
                    self._update_staging_failure(
                        staging_table,
                        account_rid,
                        r.resource_code,
                        r.project_code,
                        document_id,
                        Constants.ErrorMessages.RD_CLAIM_ALREADY_QUALIFIED
                    )
        if "project_fiscal_rid" in allowed_df.columns:
            allowed_df=allowed_df.drop("project_fiscal_rid")
            allowed_df=allowed_df.drop("fiscal_year")
        return allowed_df

    def filter_rd_claim_and_mark_staging_for_project(
        self,
        df: DataFrame,
        entity_type: str,
        account_rid: str,
        account_r_number: str,
        document_id: str,
        fiscal_year: int
    ) -> DataFrame:
        """
        Blocks upserts when project_fiscal.is_rd_claim_status = true.
        Updates staging for blocked rows and returns only allowed rows.
        Applies to: project
        """
        df = self.map_fiscal_rid_with_data(
                    df,
                    entity_type,
                    account_r_number,
                    fiscal_year
                )
        logger.info(f"[{entity_type}] Applying RD-claim guard before upsert...")

        project_fiscal_table = self.get_tenant_table(account_r_number, "project_fiscal")

        project_fiscal_df = (
            self.spark.read
            .format("jdbc")
            .option("url", config.ENTITY_DB_URL)
            .option(
                "dbtable",
                f"(SELECT rid AS project_fiscal_rid, is_rd_claim_qualified FROM {project_fiscal_table}) pf"
            )
            .option("user", config.ENTITY_DB_USER)
            .option("password", settings.ENTITY_DB_PASSWORD)
            .option("driver", config.ENTITY_DB_DRIVER)
            .load()
        )

        df = df.join(F.broadcast(project_fiscal_df), "project_fiscal_rid", "left")

        blocked_df = df.filter(F.col("is_rd_claim_qualified") == True)
        allowed_df = df.filter(
            (F.col("is_rd_claim_qualified") == False) |
            (F.col("is_rd_claim_qualified").isNull())
        ).drop("is_rd_claim_qualified")
        if not blocked_df.rdd.isEmpty():
            logger.warning(
                f"[{entity_type}] {blocked_df.count()} rows blocked because RD claim already qualified"
            )

            staging_table = self.get_tenant_table(
                account_r_number,
                config.STAGING_PROJECT_TABLE
            )

            rows = blocked_df.select("project_code").distinct().collect()

            for r in rows:
                update_query = f"""
                UPDATE {staging_table}
                SET error_descriptions = COALESCE(error_descriptions, '') || '{Constants.ErrorMessages.RD_CLAIM_ALREADY_QUALIFIED}',
                    status = 'Failed'
                WHERE account_rid = '{account_rid}'
                AND project_id = '{r.project_code}'
                AND document_rid = '{document_id}'
                """
                
                try:
                    with DBPool.get_connection() as conn:
                        with conn.cursor() as cursor:
                            logger.info(f"Updating staging failure: {update_query}")
                            cursor.execute(update_query)
                        conn.commit()
                except Exception as e:
                    logger.error(f"❌ Error updating staging entity: {str(e)}", exc_info=True)
                    raise
        if "project_fiscal_rid" in allowed_df.columns:
            allowed_df=allowed_df.drop("project_fiscal_rid")
            allowed_df=allowed_df.drop("fiscal_year")
        return allowed_df