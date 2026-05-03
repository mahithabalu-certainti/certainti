import time
from decimal import Decimal
from pyspark.sql import DataFrame, SparkSession, Window
import pyspark.sql.functions as F
from pyspark.sql.functions import when, col, lit, expr, current_timestamp,md5, udf, Column, concat_ws, countDistinct, count as f_count, to_date,concat, trim, row_number,first, lower
from pyspark.sql.functions import (sum as _sum, coalesce)
from pyspark.sql.types import NullType, StructType, StructField, StringType, DecimalType, NumericType, IntegerType, LongType, FloatType, DoubleType, BooleanType, DateType, TimestampType
from config import settings, config
from logger.logger import get_logger
import psycopg2
from psycopg2 import sql, pool
from pyspark.sql.utils import AnalysisException
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timezone, timedelta
from functools import reduce
from contextlib import contextmanager
from constants import Constants
from html import escape
from pyspark.sql.window import Window
from pyspark.sql.functions import sum as spark_sum
import pandas as pd
from typing import Set 
import os
import json
from pyspark import StorageLevel
from pyspark.sql.types import *
import calendar
from database.db_handler import DatabaseHandler
from logger.logger import get_logger


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
                    minconn=5,
                    maxconn=20,
                    dbname=config.ENTITY_DB_NAME,
                    user=config.ENTITY_DB_USER,
                    password=settings.ENTITY_DB_PASSWORD,
                    host=config.ENTITY_DB_HOST,
                    port="5432",
                    sslmode="require"
                )
                cls.main_connection_pool = pool.ThreadedConnectionPool(
                    minconn=5,
                    maxconn=20,
                    dbname=config.MAIN_DB_NAME,
                    user=config.MAIN_DB_USER,
                    password=settings.MAIN_DB_PASSWORD,
                    host=config.MAIN_DB_HOST,
                    port="5432",
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

class TMTI_DBHandler:
    """Main database handler class for the service with connection pooling"""
    
    def __init__(self):
        logger.info("creating spark")
        self.spark = self._get_spark_session()
        self._verify_jdbc_driver()
        self.db_handler = DatabaseHandler()
    
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
    def get_tenant_table(self, account_r_number: str, table_name: str) -> str:
        account_r_number = account_r_number.upper()
        account_r_number = account_r_number.split("-")[1]
        logger.info(f"account_r_number : {account_r_number}")
        logger.info(f"table_name : {table_name}")
        return f'"{Constants.Database.SCHEMA_PREFIX}{account_r_number}".{table_name}'
    
    def get_public_table(self,table_name: str) -> str:
        logger.info(f"table_name : {table_name}")
        return f'"{Constants.Database.SCHEMA_MAIN}".{table_name}'

    def get_staging_records(self, document_rid: str, entity_type: str, account_r_number: str, emp_type: str) -> DataFrame:
        """Get records from staging database with enhanced warning tracking and nullify fields with warnings."""
        try:
            # Get the full table name based on entity type
            if emp_type == "Full-Time":
                full_table_name = {
                    "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_FULLTIME_TMTI_TABLE),
                }.get(entity_type)
            else:
                full_table_name = {
                    "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_SUBCON_TMTI_TABLE),
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
            ).cache()

            # Ensure warning and error columns exist
            if "warning_descriptions" not in filtered_df.columns:
                filtered_df = filtered_df.withColumn("warning_descriptions", F.lit(None))
            if "error_descriptions" not in filtered_df.columns:
                filtered_df = filtered_df.withColumn("error_descriptions", F.lit(None))

            # Extract warnings as structured data for further analysis (optional)
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

            # Handle warning fields by nullifying them
            sample_warnings = filtered_df.select("validation_warnings").limit(10).collect()
            logger.info(f"Sample validation_warnings: {sample_warnings}")
            filtered_df = self.handle_warning_fields(filtered_df)

            # ✅ Count warnings efficiently
            warning_count = filtered_df.filter(F.col("warning_descriptions").isNotNull()).count()

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

    def get_staging_records_for_email(self, document_rid: str, entity_type: str, account_r_number: str, emp_type: str) -> DataFrame:
        """Get records from staging database with enhanced warning tracking and nullify fields with warnings."""
        try:
            # Get the full table name based on entity type
            full_table_name = {
                "resource": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_TABLE),
                "resource_cost": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_COST_TABLE),
                "resource_skill": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_SKILL_TABLE),
                "project": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE),
                "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_FULLTIME_TMTI_TABLE if emp_type == "Full-Time" else config.STAGING_PROJECT_RESOURCE_SUBCON_TMTI_TABLE),
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

    def archive_and_flush_staging_data(self, entity_type: str, document_rid: str, account_r_number: str, emp_type: str  ) -> bool:
        """Copy all records from staging to history, then clear the staging table."""
        try:
            staging_table_mapping = {
                "resource": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_TABLE),
                "resource_skill": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_SKILL_TABLE),
                "resource_cost": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_COST_TABLE),
                "project": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE),
                "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_FULLTIME_TMTI_TABLE if emp_type == "Full-Time" else config.STAGING_PROJECT_RESOURCE_SUBCON_TMTI_TABLE),
                "project_task": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TASK_TABLE)
            }

            history_table_mapping = {
                "resource": self.get_tenant_table(account_r_number, config.HISTORY_RESOURCE_TABLE_STAGING),
                "resource_skill": self.get_tenant_table(account_r_number, config.HISTORY_RESOURCE_SKILL_TABLE_STAGING),
                "resource_cost": self.get_tenant_table(account_r_number, config.HISTORY_RESOURCE_COST_TABLE_STAGING),
                "project": self.get_tenant_table(account_r_number, config.HISTORY_PROJECT_TABLE_STAGING),
                "project_resource": self.get_tenant_table(account_r_number, config.HISTORY_PROJECT_RESOURCE_FULLTIME_TMTI_TABLE_STAGING if emp_type == "Full-Time" else config.HISTORY_PROJECT_RESOURCE_SUBCON_TMTI_TABLE_STAGING),
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
            if not self._create_history_table_if_not_exists(entity_type, account_r_number, emp_type):
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
                    
                    column_list_raw = []
                    for column_name in unique_columns:
                        column_list_raw.append(f'"{column_name}"')
                    column_list = ', '.join(column_list_raw)

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

    def _create_history_table_if_not_exists(self, entity_type: str, account_r_number: str, emp_type: str) -> bool:
        """Create history table if it doesn't exist by copying schema from staging table."""
        try:
            staging_table_mapping = {
                "resource": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_TABLE),
                "resource_skill": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_SKILL_TABLE),
                "resource_cost": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_COST_TABLE),
                "project": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE),
                "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_FULLTIME_TMTI_TABLE if emp_type == "Full-Time" else config.STAGING_PROJECT_RESOURCE_SUBCON_TMTI_TABLE),
                "project_task": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TASK_TABLE),
            }

            history_table_mapping = {
                "resource": self.get_tenant_table(account_r_number, config.HISTORY_RESOURCE_TABLE_STAGING),
                "resource_skill": self.get_tenant_table(account_r_number, config.HISTORY_RESOURCE_SKILL_TABLE_STAGING),
                "resource_cost": self.get_tenant_table(account_r_number, config.HISTORY_RESOURCE_COST_TABLE_STAGING),
                "project": self.get_tenant_table(account_r_number, config.HISTORY_PROJECT_TABLE_STAGING),
                "project_resource": self.get_tenant_table(account_r_number, config.HISTORY_PROJECT_RESOURCE_FULLTIME_TMTI_TABLE_STAGING if emp_type == "Full-Time" else config.HISTORY_PROJECT_RESOURCE_SUBCON_TMTI_TABLE_STAGING),
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

                    # Properly quote column names to handle special characters
                    column_defs = []
                    for col in columns:
                        column_name = col[0]
                        data_type = col[1]

                        column_defs.append(f'"{column_name}" {data_type}')

                        create_query = f"""
                            CREATE TABLE IF NOT EXISTS {history_table} (
                                {', '.join(column_defs)},
                                archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                            )
                        """

                    logger.info(f"Creating history table: {create_query}")
                    
                    cursor.execute(create_query)
                    conn.commit()
                    logger.info(f"History table created or already exists: {history_table}")
                    return True

        except Exception as e:
            logger.error(f"Failed to create history table for {entity_type}: {e}", exc_info=True)
            return False

    def get_staging_records_with_errors_and_warnings(self, document_rid: str, entity_type: str, account_r_number: str, emp_type: str) -> Tuple[DataFrame, DataFrame]:
        """Get records from staging database and return both records and error summary."""
        try:
            # Get the full table name based on entity type (same as before)
            full_table_name = {
                "resource": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_TABLE),
                "resource_cost": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_COST_TABLE),
                "resource_skill": self.get_tenant_table(account_r_number, config.STAGING_RESOURCE_SKILL_TABLE),
                "project": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE),
                "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_FULLTIME_TMTI_TABLE if emp_type == "Full-Time" else config.STAGING_PROJECT_RESOURCE_SUBCON_TMTI_TABLE),
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
            if warning_only_df is not None and not warning_only_df.isEmpty():
                warning_only_df.persist(StorageLevel.MEMORY_AND_DISK)
            warning_count = warning_only_df.count()
            if warning_only_df is not None:
                warning_only_df.unpersist()
            return error_summary,warning_count

        except Exception as e:
            logger.error(f"Error getting staging records: {e}", exc_info=True)
            raise

    def filter_failed_records(
        self,
        df: DataFrame,
        entity_type: str,
        account_rid: str,
        document_rid: str,
        account_r_number: str,
        emp_type: str
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
            "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_FULLTIME_TMTI_TABLE if emp_type == "Full-Time" else config.STAGING_PROJECT_RESOURCE_SUBCON_TMTI_TABLE),
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

        resource_id_column = "emp_id" if emp_type == "Full-Time" else "employee"
        start_date_column = "month" if emp_type == "Full-Time" else "fiscal_year_period"

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
            .select("project_id", resource_id_column, start_date_column, "status")
        )

        # Step 3: Filter only failed rows from staging
        failed_df = staging_df.filter(F.col("status") == "Failed")

        # Step 4: Anti-join to exclude failed records
        if emp_type == "Full-Time":
            filtered_df = renamed_df.join(
                failed_df,
                on=[
                    renamed_df.project_id == failed_df.project_id,
                    renamed_df.resource_id == failed_df.emp_id,
                ],
                how="left_anti"
            )
        else:
            filtered_df = renamed_df.join(
                failed_df,
                on=[
                    renamed_df.project_id == failed_df.project_id,
                    renamed_df.resource_id == failed_df.employee,
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
        emp_type: str,
        parent_entity_type: str = None,
    ) -> DataFrame:
        try:
            logger.info(f"[{entity_type}] 🚀 Starting special entity handling...")

            if parent_entity_type == "project_resource" and entity_type == "project_resource":
                try:
                    logger.info("[project_resource] 🚀 Starting new project resource entity handling...")

                    # Step 1. Map RIDs and R-Numbers
                    df = self.db_handler.map_entity_rid_and_r_number_with_data(df, entity_type, account_r_number, account_rid)

                    if df.limit(1).count() == 0:
                        logger.info("[project_resource] No incoming records to process.")
                        return df

                    # Rename to match schema
                    if "resource_role" in df.columns:
                        df = df.withColumnRenamed("resource_role", "project_resource_role")
                    df = df.withColumn("project_resource_code", concat_ws("-", col("project_code"), col("resource_code")))
                    # Step 2. Group data
                    df = df.withColumn("start_date", F.lit(None).cast("date"))
                    df = df.withColumn("end_date", F.lit(None).cast("date"))
                    group_keys = ["project_fiscal_rid", "resource_rid", "project_resource_role"]

                    agg_exprs = {
                        "total_hours_pro_res": F.sum("total_hours_pro_res").alias("total_hours_pro_res"),
                        "total_cost_pro_res": F.sum("total_cost_pro_res").alias("total_cost_pro_res"),
                        "source_record_count": F.count("*").alias("source_record_count") 
                    }

                    # add first() for all other columns
                    non_group_cols = [c for c in df.columns if c not in group_keys + list(agg_exprs.keys())]
                    for c in non_group_cols:
                        agg_exprs[c] = F.first(c, ignorenulls=True).alias(c)

                    grouped_df = df.groupBy(group_keys).agg(*agg_exprs.values())
                    logger.info(f"[project_resource] Grouped Data Count: {grouped_df.count()}")
                    currency_table = self.get_public_table(config.CURRENCY_TABLE)
                    # Step 2: Join with your grouped_df
                    threshold_df = self.fetch_as_dataframe(
                        f"SELECT rid, currency_threshold FROM {currency_table}",
                        spark=self.spark
                    )

                    grouped_df = (
                        grouped_df.join(threshold_df, on="currency_rid", how="left")
                        .withColumn(
                            "is_anomaly",
                            F.when(F.col("total_cost_pro_res") > F.col("currency_threshold"), F.lit(1))
                            .otherwise(F.lit(0))
                        )
                    )

                    # Step 3. Assign status based on anomaly
                    active_status_rid = self.db_handler.get_resource_status_rid("Active")
                    anomaly_status_rid = self.db_handler.get_resource_status_rid("Anomaly")

                    if "is_anomaly" in grouped_df.columns:
                        grouped_df = grouped_df.withColumn(
                            "status_rid",
                            F.when(F.col("is_anomaly") == 1, F.lit(anomaly_status_rid))
                            .otherwise(F.lit(active_status_rid))
                        )
                    else:
                        # Default: no anomalies detected → all active
                        grouped_df = grouped_df.withColumn("status_rid", F.lit(active_status_rid))
                    # Step 4. Match with existing data (to find already existing)
                    if existing_df.limit(1).count() > 0:
                        logger.info("[project_resource] Checking for existing records...")

                        key_columns = [
                            "project_fiscal_rid",
                            "resource_rid",
                            "project_resource_role",
                            "total_cost_pro_res",
                            "total_hours_pro_res"
                        ]

                        valid_alias = grouped_df.alias("new")
                        existing_alias = existing_df.select(key_columns).distinct().alias("old")

                        join_condition = None
                        for col_name in key_columns:
                            condition = (
                                (F.col(f"new.{col_name}") == F.col(f"old.{col_name}")) |
                                (F.col(f"new.{col_name}").isNull() & F.col(f"old.{col_name}").isNull())
                            )
                            join_condition = condition if join_condition is None else join_condition & condition

                        matched_df = valid_alias.join(existing_alias, join_condition, "inner").select("new.*")
                        new_df = valid_alias.join(existing_alias, join_condition, "left_anti").select("new.*")

                        # Step 5. Update staging for matched (existing) records
                        if matched_df.limit(1).count() > 0:
                            logger.info(f"[project_resource] Found {matched_df.count()} records already existing, updating staging...")

                            staging_table = self.get_tenant_table(
                                account_r_number,
                                config.STAGING_PROJECT_RESOURCE_FULLTIME_TMTI_TABLE
                                if emp_type == "Full-Time"
                                else config.STAGING_PROJECT_RESOURCE_SUBCON_TMTI_TABLE
                            )

                            for row in matched_df.collect():
                                self._update_staging_failure(
                                    staging_table,
                                    account_rid,
                                    row.resource_code,
                                    row.project_code,
                                    Constants.ErrorMessages.DUPLICATE_PROJECT_RESOURCE_ENTRY,
                                    emp_type
                                )

                        else:
                            logger.info("[project_resource] No exact matches found in existing data.")

                    else:
                        new_df = grouped_df
                    cols_to_drop = [
                        "project_code", "resource_code", "resource_name", "resource_type_rid", "city_rid", "project_number",
                        "designation", "resource_orgname", "resource_firstname", "resource_status_rid", "currency_threshold",
                        "resource_middlename", "resource_lastname", "manager_name", "manager_ref_rid","project_status_rid", "is_anomaly",
                        "project_fiscal_rid_temp", "resource_rid_temp", "total_hours_pro_res_temp", "total_cost_pro_res_temp"
                    ]
                    
                    cols_to_drop = [col for col in cols_to_drop if col in new_df.columns]
                    if cols_to_drop:
                        new_df = new_df.drop(*cols_to_drop)
                    new_df = new_df.withColumn("net_total_cost_pro_res", col("total_cost_pro_res"))
                    logger.info(f"[project_resource] ✅ Processing complete. Final valid records: {new_df.count()}")
                    # new_df.show()
                    return new_df

                except Exception as e:
                    logger.error(f"[project_resource] ❌ Error in project resource handler: {str(e)}", exc_info=True)
                    raise
            elif parent_entity_type == "project_task" and entity_type == "project_resource":
                try:
                    logger.info(f"[project_resource from task] 🚀 Starting project resource entity handling...")
                    
                    if "resource_role" in df.columns:
                        df = df.withColumnRenamed("resource_role", "project_resource_role")
                    
                    # Map RIDs and R-Numbers
                    df = self.db_handler.map_entity_rid_and_r_number_with_data(df, "project_resource", account_r_number, account_rid)

                    # Simplified deduplication logic
                    df = df.withColumn("dedup_key", 
                        F.concat_ws("|", 
                            F.col("project_fiscal_rid"), 
                            F.col("resource_rid"),
                            F.coalesce(F.col("project_resource_role"), F.lit("NULL"))
                        )
                    )
                    
                    # Use window function to rank records
                    window_spec = Window.partitionBy("dedup_key").orderBy(
                        F.col("project_resource_role").asc_nulls_last(),
                        F.col("start_date").asc()
                    )
                    
                    df = df.withColumn("row_rank", F.row_number().over(window_spec))
                    df = df.filter(F.col("row_rank") == 1).drop("row_rank", "dedup_key")
                    
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
                    active_status_rid = self.db_handler.get_resource_status_rid("Active")
                    duplicate_status_rid = self.db_handler.get_resource_status_rid("Duplicate")
                    
                    # Step 1: Identify exact duplicates against existing data
                    exact_duplicates = self.spark.createDataFrame([], df.schema)
                    
                    if existing_df.limit(1).count() > 0 and df.limit(1).count() > 0:
                        logger.info("[project_resource from task] 🔍 Checking against existing data for exact duplicates...")
                        
                        join_condition = [
                            "project_fiscal_rid", "resource_rid", "project_resource_role",
                            "start_date", "end_date", "total_cost_from_tasks", "total_hours_from_tasks"
                        ]
                        
                        exact_duplicates = df.join(existing_df, join_condition, how="inner")
                        
                        if exact_duplicates.limit(1).count() > 0:
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
                            col("total_hours_from_tasks").cast("decimal(38,2)"))
                        .otherwise(lit(0))
                    ).withColumn(
                        "total_cost_decimal",
                        when(col("total_cost_from_tasks").isNotNull(), 
                            col("total_cost_from_tasks").cast("decimal(38,2)"))
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
                                    F.col("currency_threshold").cast("decimal(38,2)")
                                )
                        )
                        working_df = working_df.join(currency_threshold_df, on="currency_rid", how="left")
                    else:
                        working_df = working_df.withColumn("currency_threshold", lit(0).cast("decimal(38,2)"))
                    
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
                        when(col("is_anomaly"), lit(None).cast("decimal(10,2)"))
                        .otherwise(col("total_hours_from_tasks"))
                    ).withColumn(
                        "total_cost_from_tasks", 
                        when(col("is_anomaly"), lit(None).cast("decimal(12,2)"))
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
                        "project_code", "resource_code", "resource_name", "resource_type_rid", 
                        "designation", "resource_orgname", "resource_firstname",
                        "resource_middlename", "resource_lastname", "manager_name", "manager_ref_rid"
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
                    df = self.db_handler.map_entity_rid_and_r_number_with_data(df, "project_task", account_r_number, account_rid)
                    
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
                    active_status_rid = self.db_handler.get_resource_status_rid("Active")
                    anomaly_status_rid = self.db_handler.get_resource_status_rid("Anomaly")
                    duplicate_status_rid = self.db_handler.get_resource_status_rid("Duplicate")

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
                            col("total_hours_pro_task").cast("decimal(38,2)"))
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
                                    F.col("currency_threshold").cast("decimal(38,2)")
                                )
                        )
                    else:
                        currency_threshold_df = self.spark.createDataFrame([], schema="currency_rid string, currency_threshold decimal(38,2)")

                    # Step B: Join thresholds into working_df and create decimal columns
                    working_df = (
                        working_df
                        .join(currency_threshold_df, on="currency_rid", how="left")
                        .withColumn(
                            "total_cost_decimal", 
                            when(col("total_cost_pro_task").isNotNull(),
                                col("total_cost_pro_task").cast("decimal(38,2)"))
                            .otherwise(lit(0))
                        )
                    )

                    # Mark duplicates against existing records
                    if duplicate_vs_existing_df.limit(1).count() > 0:
                        duplicate_vs_existing_df = duplicate_vs_existing_df.withColumn("status_rid", F.lit(duplicate_status_rid))
                        logger.info(f"[project_task] Found {duplicate_vs_existing_df.count()} duplicates against existing records")
                    
                    # Step 3: Deduplicate within incoming data (only non-existing duplicates)
                    working_df = df.join(existing_hashes, on="row_hash", how="left_anti")
                    logger.info(f"[project_task] After removing existing duplicates, working with {working_df.count()} records")

                    if working_df.limit(1).count() > 0:
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
                    
                    if working_df.limit(1).count() > 0:
                        final_dfs.append(working_df)
                    
                    # REMOVED: The problematic cost anomaly detection that was here
                    
                    if duplicate_vs_existing_df.limit(1).count() > 0:
                        final_dfs.append(duplicate_vs_existing_df)
                    
                    if final_dfs:
                        df = final_dfs[0]
                        for next_df in final_dfs[1:]:
                            df = df.unionByName(next_df, allowMissingColumns=True)
                    else:
                        df = self.spark.createDataFrame([], df.schema)

                    # Step 5: Identify anomalies (hours/cost thresholds) - only for active records
                    active_records_df = df.filter(F.col("status_rid") == active_status_rid)
                    
                    if active_records_df.limit(1).count() > 0:
                        active_records_df = active_records_df.withColumn(
                            "total_days", datediff(col("end_date"), col("start_date")) + lit(1)
                        ).withColumn(
                            "max_hours", col("total_days") * lit(config.WORKING_HOURS)
                        ).withColumn(
                            "total_hours_decimal", 
                            when(col("total_hours_pro_task").isNotNull(),
                                col("total_hours_pro_task").cast("decimal(38,2)"))
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
                                        F.col("currency_threshold").cast("decimal(38,2)"))
                            )
                        else:
                            currency_threshold_df = self.spark.createDataFrame([], schema="currency_rid string, currency_threshold decimal(38,2)")

                        active_records_df = active_records_df.join(currency_threshold_df, on="currency_rid", how="left")
                        active_records_df = active_records_df.withColumn(
                            "total_cost_decimal", 
                            when(col("total_cost_pro_task").isNotNull(),
                                col("total_cost_pro_task").cast("decimal(38,2)"))
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
                        if anomaly_df.limit(1).count() > 0:
                            final_dfs.append(anomaly_df)
                            
                        df = final_dfs[0]
                        for next_df in final_dfs[1:]:
                            df = df.unionByName(next_df, allowMissingColumns=True)

                    # Step 6: Clean temporary columns
                    cols_to_drop = [
                        "row_hash", "total_days", "max_hours", "total_hours_decimal", 
                        "total_cost_decimal", "anomaly_reason", "project_code", 
                        "resource_code", "resource_name", "resource_type_rid", 
                        "designation", "resource_orgname", "resource_firstname", 
                        "resource_middlename", "resource_lastname", "manager_name","is_mapped",
                        "manager_ref_rid", "project_resource_role", "currency_threshold", "unique_id"
                    ]
                    cols_to_drop = [col for col in cols_to_drop if col in df.columns]
                    if cols_to_drop:
                        df = df.drop(*cols_to_drop)

                    logger.info(f"[project_task from task] ✅ Project task handling completed. Final count: {df.count()}")

                    # Log distribution of statuses
                    status_counts = df.groupBy("status_rid").count().collect()
                    for status_count in status_counts:
                        logger.info(f"Status RID {status_count['status_rid']}: {status_count['count']} rows")
                    return df

                except Exception as e:
                    logger.error(f"[project_task from task] ❌ Error in project task handler: {str(e)}", exc_info=True)
                    raise

            elif entity_type == "resource_skill":
                df = self.db_handler.map_entity_rid_and_r_number_with_data(df, entity_type, account_r_number, account_rid)
                df = self.db_handler._map_resource_type_rid_if_missing(df, db_config, account_r_number)
                
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

                                resource_id_column = "emp_id" if emp_type == "Full-Time" else "employee"

                                if skill_type_name:
                                    update_query = f"""
                                    UPDATE {staging_table}
                                    SET error_descriptions = COALESCE(error_descriptions, '') || '{Constants.ErrorMessages.DUPLICATE_SKILL_ENTRY}',
                                        status = 'Failed'
                                    WHERE account_rid = %s
                                    AND {resource_id_column} = %s
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
                
                # Show sample of final DataFrame (not all data)
                if df.limit(1).count() > 0:
                    logger.info("Sample of final DataFrame:")
                    # df.show(10)  # Show only 10 rows
                
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
                cols_to_drop = ["spoc_name", "spoc_email", "project_tech_poc_name", "project_tech_poc_email", "project_delivery_head_name", "project_delivery_head_email", "city_rid"]
                cols_to_drop = [col for col in cols_to_drop if col in df.columns]
                if cols_to_drop:
                    df = df.drop(*cols_to_drop)
                logger.info(f"[{entity_type}] ✅ Deduplicated using dropDuplicates on project_code")

            elif entity_type == "resource_cost":
                # Map RID and R-Number
                df = self.db_handler.map_entity_rid_and_r_number_with_data(df, entity_type, account_r_number, account_rid)

                # Status RIDs
                active_status_rid = self.db_handler.get_resource_status_rid("Active")
                anomaly_status_rid = self.db_handler.get_resource_status_rid("Anomaly")
                duplicate_status_rid = self.db_handler.get_resource_status_rid("Duplicate")

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
                        currency_threshold decimal(38,2)
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
                                F.col("currency_threshold").cast("decimal(38,2)").alias("currency_threshold")
                            )
                        )
                    else:
                        currency_threshold_df = self.spark.createDataFrame([], schema="""
                            currency_rid string,
                            currency_threshold decimal(38,2)
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

    def store_transformed_data(
        self,
        df: DataFrame,
        entity_type: str,
        account_r_number: str,
        account_rid: str,
        modified_by: str,
        fiscal_year: int,
        document_id: str,
        emp_type: str,
        parent_entity_type: Optional[str] = None  # Optional param with default
    ) -> bool:

        try:
            logger.info(f"[{entity_type}] Start processing entity data.")

            logger.info(f"[{entity_type}] Fetching entity config...")
            db_config = self.db_handler._get_entity_config(entity_type, account_r_number)
            logger.info(f"[{entity_type}] Configuration loaded: {db_config}")

            logger.info(f"[{entity_type}] Preparing input DataFrame (casting, cleaning, etc)...")
            df = self.db_handler._prepare_dataframe(df, db_config, fiscal_year, entity_type, account_r_number)
            logger.info(f"[{entity_type}] DataFrame prepared with columns: {df.columns}")

            if not db_config["is_parent"] and entity_type not in  ["project_resource","project_task"]:
                logger.info(f"[{entity_type}] Ensuring parent records exist...")
                self.db_handler._ensure_parent_records(df, db_config, modified_by, account_r_number, account_rid, entity_type)
                logger.info(f"[{entity_type}] Parent validation complete.")

            if not db_config["is_parent"]:
                logger.info(f"[{entity_type}] Resolving parent RIDs...")
                df = self.db_handler._resolve_parents(df, db_config, account_r_number, account_rid)
                logger.info(f"[{entity_type}] Parent RIDs mapped.")

            logger.info(f"[{entity_type}] Loading existing records from DB table: {db_config['main_table']}")
            existing_df = self.db_handler._load_existing_data(df, db_config, account_rid, entity_type)

            if existing_df is not None and not existing_df.isEmpty():
                existing_df.persist(StorageLevel.MEMORY_AND_DISK)
            
            if df is not None and df.limit(1).count() > 0:
                df.persist(StorageLevel.MEMORY_AND_DISK)
            logger.info(f"[{entity_type}] Existing record count: {existing_df.count()}")

            logger.info(f"[{entity_type}] Handling special entity validations (if applicable)...")
            df = self._handle_special_entities(df, existing_df, account_r_number, db_config, entity_type, modified_by, account_rid, document_id, fiscal_year, emp_type, parent_entity_type)
            logger.info(f"[{entity_type}] Special handling complete. Cleaned record count: {df.count()}")
            if df is not None and df.limit(1).count() > 0:
                logger.info(f"[{entity_type}] Classifying new vs updated records...")
                new_records, update_comparison = self.db_handler._classify_records(df, existing_df, entity_type, db_config)
                if new_records is not None and new_records.limit(1).count() > 0:
                    new_records.persist(StorageLevel.MEMORY_AND_DISK)

                if update_comparison is not None and update_comparison.limit(1).count() > 0:
                    update_comparison.persist(StorageLevel.MEMORY_AND_DISK)
                logger.info(f"[{entity_type}] New records: {new_records.count()}, Records to compare for updates: {update_comparison.count() if update_comparison else 0}")

                logger.info(f"[{entity_type}] Inserting new records (if any)...")
                self.db_handler._insert_new_records(new_records, db_config, account_rid, account_r_number, modified_by, entity_type, document_id)
                logger.info(f"[{entity_type}] New record insertion complete.")

                # if not (entity_type not in ["project_resource"] and parent_entity_type == "project_task"):
                #     logger.info(f"[{entity_type}] Updating existing records (if applicable)...")
                #     self._update_existing_records(update_comparison, db_config, df, account_rid, account_r_number, modified_by, entity_type, document_id)
                #     logger.info(f"[{entity_type}] Update operation complete.")
                # else:
                #     logger.info(f"[{entity_type}] Skipping update as parent_entity_type is project_task.")

                if entity_type not in ['project', 'resource_cost','project_task'] and update_comparison is not None and update_comparison.limit(1).count() > 0:

                    start_time = time.perf_counter()

                    self.db_handler._update_existing_records(update_comparison, db_config, df, account_rid, account_r_number, modified_by, entity_type, document_id, parent_entity_type)

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
                return df is not None and df.limit(1).count() > 0

            # Collect only defined DFs
            cleanup_dfs = [
                df,
                existing_df,
                new_records if "new_records" in locals() else None,
                update_comparison if "update_comparison" in locals() else None
            ]

            # Check if any DF has data
            if any(is_not_empty(d) for d in cleanup_dfs):
                # cleanup persisted DFs
                for temp_df in cleanup_dfs:
                    if temp_df is not None and temp_df.is_cached:
                        temp_df.unpersist()

    def _update_staging_failure(self, staging_table, account_rid, resource_code, project_code, error_message, emp_type):
        """Update staging table with failure information"""

        resource_id_column = "emp_id" if emp_type == "Full-Time" else "employee"

        update_query = f"""
        UPDATE {staging_table}
        SET error_descriptions = COALESCE(error_descriptions, '') || '{error_message}',
            status = 'Failed'
        WHERE account_rid = '{account_rid}'
        AND {resource_id_column} = '{resource_code}'
        AND project_id = '{project_code}'
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


    def _map_geo_rids(
        self,
        df: DataFrame,
        entity_type: str,
        document_rid: str,
        account_rid: str,
        emp_type: str
    ) -> DataFrame:
        """Map geographic columns to their respective RIDs, replacing original columns with IDs."""
        try:
            logger.info("Starting geographic RID mapping process")
            logger.info(f"Initial DataFrame schema: {df.schema.json()}")
            logger.info(f"Initial DataFrame columns: {df.columns}")
            logger.info(f"Entity type being processed: {entity_type}")
            # ================================================================
            # PHASE 0: EXTRACT COUNTRY, STATE, CITY FROM RAW LOCATION STRING
            # ================================================================
            if "region_rid" in df.columns:
                logger.info("Phase 0: Extracting country, state, city...")

                parts = F.split(F.col("region_rid"), "-")

                # -----------------------------
                # COUNTRY
                # -----------------------------
                df = df.withColumn(
                    "country_rid",
                    F.when(F.array_contains(parts, "US"), "USA")
                    .when(F.array_contains(parts, "USA"), "USA")
                    .otherwise(None)
                )

                # -----------------------------
                # STATE
                # -----------------------------
                df = df.withColumn("state_raw", parts.getItem(2))
                df = df.withColumn("state_clean", F.regexp_replace("state_raw", "[^A-Za-z]", ""))

                df = df.withColumn(
                    "state_code",
                    F.when(F.length("state_clean") == 2, F.upper("state_clean"))
                    .otherwise(None)
                )

                df = df.withColumn(
                    "state_name",
                    F.when(F.length("state_clean") > 2, F.initcap("state_clean"))
                    .otherwise(None)
                )

                # -----------------------------
                # CITY (ROBUST)
                # -----------------------------
                last_part = parts.getItem(F.size(parts) - 1)
                second_last = parts.getItem(F.size(parts) - 2)

                df = df.withColumn("last_clean", F.regexp_replace(last_part, "[^A-Za-z]", ""))
                df = df.withColumn("second_last_clean", F.regexp_replace(second_last, "[^A-Za-z]", ""))

                df = df.withColumn(
                    "city_key",
                    F.when(F.length(F.col("last_clean")) > 2, F.initcap(F.lower(F.col("last_clean"))))
                    .when(F.length(F.col("second_last_clean")) > 2, F.initcap(F.lower(F.col("second_last_clean"))))
                    .otherwise(None)
                )

                df = df.drop("last_clean", "second_last_clean", "state_raw", "state_clean")

                logger.info("Completed Phase 0 extraction")
                # df.select("country_rid", "state_code", "state_name", "city_key").show(truncate=False)

            # ================================================================
            # PHASE 1: CONVERT STATE CODES → FULL NAMES
            # ================================================================
            STATE_CODE_MAP = {
                "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
                "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
                "DC": "District Of Columbia", "FL": "Florida", "GA": "Georgia",
                "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana",
                "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana",
                "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan",
                "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
                "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire",
                "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
                "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
                "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania",
                "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota",
                "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
                "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
                "WI": "Wisconsin", "WY": "Wyoming", "PR": "Puerto Rico",
                "GU": "Guam", "VI": "United States Virgin Islands",
                "MP": "Northern Mariana Islands", "AS": "American Samoa"
            }

            state_map_b = df.sparkSession.sparkContext.broadcast(STATE_CODE_MAP)

            df = df.withColumn(
                "state_name_final",
                F.when(
                    F.col("state_code").isNotNull(),
                    F.udf(lambda x: state_map_b.value.get(x), StringType())(F.col("state_code"))
                ).otherwise(F.col("state_name"))
            )

            # ================================================================
            # PHASE 2: MAP COUNTRY → RID
            # ================================================================
            if "country_rid" in df.columns:
                countries = [r["country_rid"] for r in df.select("country_rid").distinct().collect() if r["country_rid"]]

                if countries:
                    table = self.get_public_table(config.COUNTRY_TABLE)

                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            query = f"""
                                SELECT rid, country_code
                                FROM {table}
                                WHERE country_code IN %s
                            """
                            cursor.execute(query, (tuple(countries),))
                            rows = cursor.fetchall()

                    country_map = {code: rid for rid, code in rows}
                    b_country = df.sparkSession.sparkContext.broadcast(country_map)

                    df = df.withColumn(
                        "country_rid",
                        F.udf(lambda x: b_country.value.get(x), StringType())(F.col("country_rid"))
                    )

            # ================================================================
            # PHASE 3: MAP STATE → RID
            # ================================================================
            state_names = [r["state_name_final"] for r in df.select("state_name_final").distinct().collect() if r["state_name_final"]]

            if state_names:
                state_table = self.get_public_table(config.STATE_TABLE)

                with DBPool.get_connection_mainDB() as conn:
                    with conn.cursor() as cursor:
                        query = f"""
                            SELECT rid, state_name
                            FROM {state_table}
                            WHERE state_name IN %s
                        """
                        cursor.execute(query, (tuple(state_names),))
                        rows = cursor.fetchall()

                state_map = {name: rid for rid, name in rows}
                b_state = df.sparkSession.sparkContext.broadcast(state_map)

                df = df.withColumn(
                    "region_rid",
                    F.udf(lambda x: b_state.value.get(x), StringType())(F.col("state_name_final"))
                )

            # ================================================================
            # PHASE 4: MAP CITY → RID
            # ================================================================
            df = df.withColumn("city_rid", F.col("city_key"))  # ✅ FIX: CRITICAL LINE

            city_list = [r["city_rid"] for r in df.select("city_rid").distinct().collect() if r["city_rid"]]
            country_list = [r["country_rid"] for r in df.select("country_rid").distinct().collect() if r["country_rid"]]

            if city_list and country_list:
                city_table = self.get_public_table(config.CITY_TABLE)

                with DBPool.get_connection_mainDB() as conn:
                    with conn.cursor() as cursor:
                        query = f"""
                            SELECT rid, city_name
                            FROM {city_table}
                            WHERE city_name IN %s
                            AND country_rid IN %s
                        """
                        cursor.execute(query, (tuple(city_list), tuple(country_list)))
                        results = cursor.fetchall()

                city_map = {name: rid for rid, name in results}
                b_city = df.sparkSession.sparkContext.broadcast(city_map)

                df = df.withColumn(
                    "city_rid",
                    F.udf(lambda x: b_city.value.get(x), StringType())(F.col("city_rid"))
                )

            # ================================================================
            # FINAL OUTPUT CHECK
            # ================================================================
            # df.select("country_rid", "region_rid", "city_rid").show(truncate=False)
            # ------------------------------
            # Phase 4b: Currency Fallback
            # ------------------------------
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
                        currency_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(currency_mapping)

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
                if currency_column in df.columns and df.filter(F.col(currency_column).isNull()).limit(1).count() > 0:
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

            # ------------------------------
            # Phase 7: Project Type Mapping
            # ------------------------------
            if entity_type in ["project", "project_resource", "project_task"] and "project_type" in df.columns:
                logger.info(f"\nPhase 7: Mapping project_type to project_type_rid for {entity_type}")

                project_types = [row["project_type"] for row in df.select("project_type").distinct().collect()]
                valid_project_types = [pt for pt in project_types if pt and str(pt).strip()]

                logger.info(f"Found {len(valid_project_types)} distinct project types: {valid_project_types}")

                project_type_mapping = {}
                if valid_project_types:
                    project_type_table = self.get_public_table(config.PROJECT_TYPE)


                project_type_mapping = {}
                if valid_project_types:
                    # Create project type mapping only for valid types
                    project_type_table = self.get_public_table(config.PROJECT_TYPE)
                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            query = f"""
                                SELECT rid, project_type_name 
                                FROM {project_type_table} 
                            """
                            
                            logger.info(f"Executing query: {cursor.mogrify(query).decode('utf-8')}")
                            cursor.execute(query)
                            results = cursor.fetchall()
                            logger.info(f"Found {len(results)} matches")
                            
                            for rid, name in results:
                                    project_type_mapping[name.upper()] = rid
                                    project_type_mapping[name] = rid
                                    abbreviation = ''.join(word[0] for word in name.split())
                                    project_type_mapping[abbreviation] = rid
                            
                project_type_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(project_type_mapping)

                def map_project_type_rid(project_type):
                    if not project_type or not str(project_type).strip():
                        return None
                    return project_type_bcast.value.get(project_type)

                map_rid_udf = F.udf(map_project_type_rid, StringType())
                df = df.withColumn("project_type_rid", map_rid_udf(F.col("project_type")))
                df = df.drop("project_type")

                logger.info("Successfully mapped project_type → project_type_rid")

            # ------------------------------
            # Phase 8: Resource Type Mapping
            # ------------------------------
            if entity_type in ["resource", "resource_cost", "resource_skill", "project_resource", "project_task"] \
            and "resource_type" in df.columns:
                logger.info("\nPhase 8: Mapping resource_type to resource_type_rid")

                resource_types = [row["resource_type"] for row in df.select("resource_type").distinct().collect()]
                valid_resource_types = [rt for rt in resource_types if rt and str(rt).strip()]

                logger.info(f"Found {len(valid_resource_types)} distinct resource types: {valid_resource_types}")

                resource_type_mapping = {}
                if valid_resource_types:
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

                            logger.info(
                                f"Executing query: {cursor.mogrify(query, params).decode('utf-8')}"
                            )
                            cursor.execute(query, params)
                            results = cursor.fetchall()
                            logger.info(f"Found {len(results)} matches")

                            for rid, name in results:
                                resource_type_mapping[name] = rid

                resource_type_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(resource_type_mapping)

                def map_resource_type_rid(resource_type):
                    if not resource_type or not str(resource_type).strip():
                        return None
                    return resource_type_bcast.value.get(resource_type)

                map_rid_udf = F.udf(map_resource_type_rid, StringType())
                df = df.withColumn("resource_type_rid", map_rid_udf(F.col("resource_type")))
            cols_to_drop = [
                        "resource_type", "state_code", "state_name", "city_key", "state_name_final"
                    ]
            cols_to_drop = [col for col in cols_to_drop if col in df.columns]
            if cols_to_drop:
                df = df.drop(*cols_to_drop)
            # logger.info("Successfully mapped resource_type → resource_type_rid")

            # df.show()
            return df

        except Exception as e:
            logger.error(f"Failed to map geographic RIDs: {str(e)}", exc_info=True)
            raise

    def fetch_as_dataframe(self, query: str, spark):
        """
        Fetch data from the database as a Spark DataFrame.
        This uses Spark's JDBC connector (distributed, scalable).
        """
        jdbc_url = config.MAIN_DB_URL
        conn_properties = {
            "user": settings.MAIN_DB_USER,
            "password": settings.MAIN_DB_PASSWORD,
            "driver": "org.postgresql.Driver",
            "stringtype": "unspecified"
        }

        try:
            logger.info(f"Fetching data via JDBC: {query[:200]}...")
            df = (
                spark.read.format("jdbc")
                .option("url", jdbc_url)
                .option("query", query)
                .options(**conn_properties)
                .load()
            )
            df = df.withColumnRenamed("rid", "currency_rid")
            logger.info(f"✅ Successfully fetched {df.count()} records from DB.")
            return df

        except Exception as e:
            logger.error(f"❌ Error fetching data as Spark DataFrame: {e}")
            raise
