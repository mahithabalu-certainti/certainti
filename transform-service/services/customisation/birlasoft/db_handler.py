import time
from decimal import Decimal
from pyspark.sql import DataFrame, SparkSession, Window
import pyspark.sql.functions as F
from pyspark.sql.functions import when, col, lit, expr, current_timestamp,md5, udf, Column, concat_ws, countDistinct, count as f_count, to_date,concat, trim, row_number,first, lower, datediff
from pyspark.sql.functions import (sum as _sum, coalesce)
from pyspark.sql.types import NullType, StructType, StructField, StringType, DecimalType, NumericType, IntegerType, LongType, FloatType, DoubleType, BooleanType, DateType, TimestampType, ArrayType
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

class Birlasoft_DBHandler:
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

    def get_staging_records(self, document_rid: str, entity_type: str, account_r_number: str) -> DataFrame:
        """Get records from staging database with enhanced warning tracking and nullify fields with warnings."""
        try:
            # Get the full table name based on entity type
            full_table_name = {
                "project": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE_BR),
                "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE_BR)
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
    
    def get_staging_records_for_email(self, document_rid: str, entity_type: str, account_r_number: str) -> DataFrame:
        """Get records from staging database with enhanced warning tracking and nullify fields with warnings."""
        try:
            # Get the full table name based on entity type
            full_table_name = {
                "project": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE_BR),
                "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE_BR)
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


    def archive_and_flush_staging_data(self, entity_type: str, document_rid: str, account_r_number: str) -> bool:
        """Copy all records from staging to history, then clear the staging table."""
        try:
            staging_table_mapping = {
                "project": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE_BR),
                "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE_BR)
            }

            history_table_mapping = {
                "project": self.get_tenant_table(account_r_number, config.HISTORY_PROJECT_TABLE_BR_STAGING),
                "project_resource": self.get_tenant_table(account_r_number, config.HISTORY_PROJECT_RESOURCE_TABLE_BR_STAGING)
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

                    # Properly quote all column names to handle special characters
                    quoted_columns = [f'"{col}"' for col in unique_columns]
                    column_list = ', '.join(quoted_columns)

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

    def _create_history_table_if_not_exists(self, entity_type: str, account_r_number: str) -> bool:
        """Create history table if it doesn't exist by copying schema from staging table."""
        try:
            staging_table_mapping = {
                "project": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE_BR),
                "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE_BR)
            }

            history_table_mapping = {
                "project": self.get_tenant_table(account_r_number, config.HISTORY_PROJECT_TABLE_BR_STAGING),
                "project_resource": self.get_tenant_table(account_r_number, config.HISTORY_PROJECT_RESOURCE_TABLE_BR_STAGING)
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

    def get_staging_records_with_errors_and_warnings(self, document_rid: str, entity_type: str, account_r_number: str) -> Tuple[DataFrame, DataFrame]:
        """Get records from staging database and return both records and error summary."""
        try:
            # Get the full table name based on entity type (same as before)
            full_table_name = {
                "project": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE_BR),
                "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE_BR)
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
                "project": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE_BR),
                "project_resource": self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE_BR)
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
            .select("project_id", "resource_id", "resource_role", "status")
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
                    df = self.db_handler.map_entity_rid_and_r_number_with_data(df, entity_type, account_r_number, account_rid)

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
                        w = Window.partitionBy("project_fiscal_rid", "resource_rid", "project_resource_role","start_date").orderBy(F.col("start_date").asc())

                        # Rank within each project-resource-role combination
                        df = df.withColumn("row_rank", F.row_number().over(w))

                        # Keep only the first record for each project-resource-role combination
                        valid_df = df.filter(F.col("row_rank") == 1)
                        
                        # Everything else is invalid (duplicates within same project-resource-role combo)
                        invalid_df = df.filter(F.col("row_rank") > 1)
                        
                        # No more invalid_nulls - null roles are treated like any other role value
                        invalid_nulls = self.spark.createDataFrame([], df.schema)

                        # Drop helper columns
                        valid_df = valid_df.drop("row_rank")
                        invalid_df = invalid_df.drop("row_rank")

                    # Step 2: If match found, update staging error
                    if invalid_df.limit(1).count() > 0:
                        logger.info("invalid_df has value")
                        staging_table = self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE_BR)
                        

                        update_query = f"""
                        UPDATE {staging_table}
                        SET error_descriptions = COALESCE(error_descriptions, '') || '{Constants.ErrorMessages.DUPLICATE_PROJECT_RESOURCE_ENTRY}',
                            status = 'Failed'
                        WHERE account_rid = %s
                        AND document_rid = %s
                        AND project_id = %s
                        AND resource_id = %s
                        AND COALESCE(resource_role, '') = COALESCE(%s, '')                        
                        """

                        """
                        AND COALESCE(total_cost::text, '') = COALESCE(%s, '')
                        AND COALESCE(total_hours::text, '') = COALESCE(%s, '')
                        """
                        with DBPool.get_connection() as conn:
                            with conn.cursor() as cursor:
                                for row in invalid_df.select(
                                    "project_code", "resource_code", "project_resource_role",
                                    "start_date", "end_date", "total_cost_pro_res", "total_hours_pro_res"
                                ).distinct().collect():
                                    logger.warning(
                                        f"[project_resource] ❌ Duplicate: "
                                        f"project_id={row.project_code}, resource_id={row.resource_code}, "
                                        f"role={row.project_resource_role}, start={row.start_date}, end={row.end_date}, "
                                        f"cost={row.total_cost_pro_res}, hours={row.total_hours_pro_res}"
                                    )
                                    cursor.execute(update_query, (
                                        account_rid,
                                        document_id,
                                        row.project_code,
                                        row.resource_code,
                                        str(row.project_resource_role) if row.project_resource_role else None,
                                        # str(row.start_date) if row.start_date else None,
                                        #str(row.end_date) if row.end_date else None,
                                        # str(row.total_cost_pro_res) if row.total_cost_pro_res is not None else None,
                                        # str(row.total_hours_pro_res) if row.total_hours_pro_res is not None else None,
                                    ))
                            conn.commit()
                        logger.info(f"[project_resource] ✅ Deduplication complete. Valid count={valid_df.count()}, Invalid count={invalid_df.count()}")


                    # NEW: Check against existing data for exact duplicates with proper null handling
                    if existing_df.limit(1).count() > 0:
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
                            "end_date"
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
                        
                        if exact_duplicates.limit(1).count() > 0:
                            logger.info(f"[project_resource] Found {exact_duplicates.count()} exact duplicates")
                            
                            # Update staging table for exact duplicates
                            staging_table = self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE_BR)
                            
                            for row in exact_duplicates.collect():
                                error_message = Constants.ErrorMessages.DUPLICATE_PROJECT_RESOURCE_ENTRY
                                self._update_staging_failure(
                                    staging_table, account_rid, row.resource_code, 
                                    row.project_code, error_message
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
                    if valid_df is not None and not valid_df.isEmpty():
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
                    active_status_rid = self.db_handler.get_resource_status_rid("Active")
                    anomaly_status_rid = self.db_handler.get_resource_status_rid("Anomaly")  # Make sure this status exists
                    
                    # Get staging table
                    staging_table = self.get_tenant_table(account_r_number, config.STAGING_PROJECT_RESOURCE_TABLE_BR)

                    # Lists to track failed rows and anomaly rows
                    failed_rows = []
                    anomaly_rows = []
                    
                    # Check if existing data is not empty - ONLY for role validation
                    if existing_df.limit(1).count() > 0:
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
                                            project_code, error_message
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
                                currency_threshold = self.db_handler.get_currency_threshold(currency_rid)
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
                            StructField("total_hours_pro_res_temp", DecimalType(10,2), True),
                            StructField("total_cost_pro_res_temp", DecimalType(10,2), True)
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

                    # Drop unnecessary columns
                    cols_to_drop = [
                        "project_code", "resource_code", "resource_name", "resource_type_rid", 
                        "designation", "resource_orgname", "resource_firstname", 
                        "resource_middlename", "resource_lastname", "manager_name", "manager_ref_rid",
                          "project_fiscal_rid_temp", "resource_rid_temp", "total_hours_pro_res_temp", "total_cost_pro_res_temp"
                    ]
                    
                    cols_to_drop = [col for col in cols_to_drop if col in df.columns]
                    if cols_to_drop:
                        df = df.drop(*cols_to_drop)

                    if invalid_df is not None and not invalid_df.isEmpty():
                        invalid_df.unpersist()
                        
                    logger.info(f"[project_resource] ✅ Project resource handling completed. Remaining count: {df.count()}")
                    
                    if not df.isEmpty():
                        logger.info("[project_resource] Final DataFrame schema:")
                        df.printSchema()
                        logger.info("[project_resource] Final DataFrame sample:")
                        df.show(truncate=False)
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
                
                # Show sample of final DataFrame (not all data)
                if df.limit(1).count() > 0:
                    logger.info("Sample of final DataFrame:")
                    df.show(10)  # Show only 10 rows
                
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
            df = self._handle_special_entities(df, existing_df, account_r_number, db_config, entity_type, modified_by, account_rid, document_id, fiscal_year, parent_entity_type)
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

                if entity_type not in ['project', 'resource_cost','project_task']:

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
  

    def _update_staging_failure(self, staging_table, account_rid, resource_code, project_code, error_message):
        """Update staging table with failure information"""

        update_query = f"""
        UPDATE {staging_table}
        SET error_descriptions = COALESCE(error_descriptions, '') || '{error_message}',
            status = 'Failed'
        WHERE account_rid = '{account_rid}'
        AND resource_id = '{resource_code}'
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
                    # Create country mapping
                    country_mapping = {}
                    currency_mapping = {}
                    country_table = self.get_public_table(config.COUNTRY_TABLE)
                    logger.info("Executing database query for country RIDs...")
                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            # Handle single country case
                            if len(countries) == 1:
                                query = f"""
                                    SELECT rid, country_name, default_currency_rid FROM {country_table} 
                                    WHERE country_name = %s
                                """
                                params = (countries[0],)
                            else:
                                query = f"""
                                    SELECT rid, country_name, default_currency_rid FROM {country_table} 
                                    WHERE country_name IN %s
                                """
                                params = (tuple(countries),)
                            
                            logger.info(f"Executing query: {cursor.mogrify(query, params).decode('utf-8')}")
                            cursor.execute(query, params)
                            results = cursor.fetchall()
                            logger.info(f"Found {len(results)} matches")
                            
                            for rid, country_code, currency_rid in results:
                                country_mapping[country_code] = rid
                                currency_mapping[country_code] = currency_rid
                                logger.info(f"Mapped: {country_code} → {rid}")
                    
                    # Log mapping coverage
                    unmapped_countries = set(countries) - set(country_mapping.keys())
                    if unmapped_countries:
                        ## Need to send mail
                        logger.warning(f"No RIDs found for {len(unmapped_countries)} countries: {unmapped_countries}")
                    # Broadcast mappings
                    country_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(country_mapping)
                    currency_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(currency_mapping)
                    
                    # Replace country column with RID
                    df = df.withColumn(
                        country_col,
                        F.when(
                            F.col(country_col).isNotNull(),
                            F.udf(lambda x: country_bcast.value.get(x), StringType())(F.col(country_col)))
                    )
                    collect= df.select(country_col).collect()
                    logger.info(f"sucessfully replaced {country_col} : {collect}")
                    logger.info(f"Successfully replaced {country_col} with RIDs")

            # 2. STATE MAPPING
            if cols.get('state') in df.columns:
                state_col = cols['state']
                logger.info(f"\nPhase 2: Mapping {state_col} to IDs")
                
                # Get distinct states
                states = df.select(state_col).distinct().collect()
                states = [x[state_col] for x in states if x[state_col] is not None]
                logger.info(f"Found {len(states)} states to map")
                
                if states:
                    # Create state mapping
                    state_mapping = {}
                    state_table = self.get_public_table(config.STATE_TABLE)
                    logger.info("Executing database query for state RIDs...")
                    with DBPool.get_connection_mainDB() as conn:
                        with conn.cursor() as cursor:
                            # Handle single state case
                            if len(states) == 1:
                                query = f"""
                                    SELECT rid, state_name, country_rid
                                    FROM {state_table} 
                                    WHERE state_name = %s
                                """
                                params = (states[0],)
                            else:
                                query = f"""
                                    SELECT rid, state_name, country_rid
                                    FROM {state_table} 
                                    WHERE state_name IN %s
                                """
                                params = (tuple(states),)
                            
                            logger.info(f"Executing query: {cursor.mogrify(query, params).decode('utf-8')}")
                            cursor.execute(query, params)
                            results = cursor.fetchall()
                            logger.info(f"Found {len(results)} matches")
                            
                            for rid, state_name, country_rid in results:
                                state_mapping[state_name] = rid
                                logger.debug(f"Mapped: {state_name} → {rid}")
                    
                    # Log mapping coverage
                    unmapped_states = set(states) - set(state_mapping.keys())
                    if unmapped_states:
                        ## Need to send mail
                        logger.warning(f"No RIDs found for {len(unmapped_states)} states")
                    
                    # Broadcast and map
                    state_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(state_mapping)
                    
                    @udf(StringType())
                    def get_state_rid(state):
                        return state_bcast.value.get(state)

                    # Apply the UDF
                    df = df.withColumn(
                        state_col,
                        F.when(
                            F.col(state_col).isNotNull(),
                            get_state_rid(F.col(state_col))
                        ).otherwise(None)  # Optional: if you want to nullify missing values
                    )
                    
                    collect = df.select(state_col).collect()
                    logger.info(f"Successfully replaced {state_col} : {collect}")
                    logger.info(f"Successfully replaced {state_col} with RIDs")


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
                    city_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(city_mapping)
                    
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

                    skill_type_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(skill_type_mapping)
                    skill_type_others_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(skill_type_others_rid)
                    unmapped_skill_type_texts_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(unmapped_types)

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

                    subtype_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(skill_subtype_mapping)
                    subtype_others_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(skill_subtype_others_rid)
                    unmapped_subtype_set_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(unmapped_subtypes)

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
                    skill_level_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(skill_level_mapping)

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
                    industry_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(industry_mapping)
                    others_rid_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(others_rid)

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
                        classification_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(classification_mapping)
                        classification_others_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(classification_others_rid)
                        unmapped_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(unmapped_classifications)

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
                task_type_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(task_type_mapping)

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
                task_classification_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(task_classification_mapping)

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
                
                # Broadcast mapping (empty if no valid types)
                project_type_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(project_type_mapping)

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

                            query = f"""
                                    SELECT rid, resource_type_name 
                                    FROM {resource_type_table} 
                                """
                            logger.info(f"Executing query: {cursor.mogrify(query, params).decode('utf-8')}")
                            cursor.execute(query, params)
                            results = cursor.fetchall()
                            logger.info(f"Found {len(results)} matches")
                            
                            for rid, name in results:
                                resource_type_mapping[name] = rid

                            resource_type_mapping['Full Time Employee'] = resource_type_mapping.get('Full-Time')
                            resource_type_mapping['Sub Contractor'] = resource_type_mapping.get('Sub Con')
                
                # Broadcast mapping (empty if no valid types)
                resource_type_bcast = df.sql_ctx.sparkSession.sparkContext.broadcast(resource_type_mapping)

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

    def upsert_fiscal_table(self, df_mapped: DataFrame, entity_type: str, 
                            account_r_number: str, fiscal_year: int, 
                            account_rid: str, document_rid: str, modified_by: str, parent_entity_type: Optional[str] = None ) -> None:
        """
        Upsert fiscal table with dynamic schema mapping.
        """
        try:
            df_transformed = self.db_handler.transform_dataframe(df_mapped, entity_type)

            # 3. Prepare data with metadata and checksums
            df_prepared = self.db_handler._prepare_fiscal_data(df_transformed, entity_type, account_r_number, fiscal_year, modified_by)

            # 4. Get target table name
            table_name = self.db_handler._get_fiscal_table_name(entity_type, account_r_number)

            history_table_name = self.get_tenant_table(account_r_number, config.PROD_PROJECT_HISTORY_TABLE)

            # 5. Identify changes needed
            inserts, updates, changed_records = self.db_handler._identify_fiscal_changes(df_prepared, table_name, entity_type)

            # If nothing new is identified, update staging with error
            if inserts.count() == 0 and updates.count() == 0 and changed_records.count() == 0:
                logger.info("No changes are detected")
                logger.info(f"parent_entity_type : {parent_entity_type}")
                if parent_entity_type not in ["project_task", "project_resource"]:
                    staging_table = self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE_BR)
                    for row in df_prepared.collect():
                        pc = row.project_code
                        update_query = f"""
                            UPDATE {staging_table}
                            SET error_descriptions = TRIM(BOTH ';' FROM 
                                                        COALESCE(error_descriptions, '') 
                                                        || CASE WHEN error_descriptions IS NULL OR error_descriptions = '' 
                                                                THEN '' 
                                                                ELSE '; ' 
                                                            END
                                                        || '{Constants.ErrorMessages.NO_CHANGE_DETECTED}'),
                                status = 'Failed'
                            WHERE account_rid = '{account_rid}'
                            AND project_id = '{pc}'
                            AND document_rid = '{document_rid}'
                        """

                        with DBPool.get_connection() as conn:
                            with conn.cursor() as cursor:
                                logger.info(f"update_query : {update_query}")
                                try:
                                    cursor.execute(update_query)
                                except Exception as e:
                                    logger.error(
                                        f"[{entity_type}] ❌ Error updating staging entity : {str(e)}",
                                        exc_info=True,
                                    )
                                    raise
                            conn.commit()
                logger.info("successfully updated staging table")
            
            invalid_changes = changed_records.filter(
                (col("old_value").isNotNull()) & (col("new_value").isNull())
            )

            if invalid_changes.count() > 0:
                logger.info("Detected invalid changes where old_value exists but new_value is null.")
                staging_table = self.get_tenant_table(account_r_number, config.STAGING_PROJECT_TABLE_BR)
                
                for row in invalid_changes.collect():
                    pc = row.project_code  # or project_rid depending on your schema
                    update_query = f"""
                        UPDATE {staging_table}
                        SET error_descriptions = TRIM(BOTH ';' FROM 
                                                    COALESCE(error_descriptions, '') 
                                                    || CASE WHEN error_descriptions IS NULL OR error_descriptions = '' 
                                                            THEN '' 
                                                            ELSE '; ' 
                                                        END
                                                    || 'Error: old value of {row.attribute_name} exists but new_value is null'),
                            status = 'Failed'
                        WHERE account_rid = '{account_rid}'
                        AND project_id = '{pc}'
                        AND document_rid = '{document_rid}'
                    """

                    with DBPool.get_connection() as conn:
                        with conn.cursor() as cursor:
                            logger.info(f"update_query : {update_query}")
                            try:
                                cursor.execute(update_query)
                            except Exception as e:
                                logger.error(
                                    f"[{entity_type}] ❌ Error updating staging for invalid change : {str(e)}",
                                    exc_info=True,
                                )
                                raise
                        conn.commit()
                logger.info("Successfully updated staging table for invalid changes.")
            
            # 6. Execute database operations
            self.db_handler._execute_fiscal_operations_for_project(inserts, updates, entity_type, account_r_number, account_rid, document_rid, table_name, history_table_name, modified_by, changed_records)

            # 5b. Handle fiscal region table if 'region_rid' is present
            if 'region_rid' in df_prepared.columns:
                df_region = df_prepared.filter(col("region_rid").isNotNull())
                df_region = self.db_handler.map_fiscal_rid_with_data_by_rid(df_region, entity_type, account_r_number, fiscal_year)

                # Optional: Drop unrelated columns if schema is minimal for region table
                region_table_name = self.db_handler._get_fiscal_region_table_name(entity_type, account_r_number)
                
                # Reuse identify + execute logic
                inserts_region,updates_region,changed_records = self.db_handler._identify_fiscal_changes(df_region, region_table_name, entity_type)

                logger.info("🔁 Upserting project_fiscal_region data...")
                # updates_region.show()
                # inserts_region.show()

                self.db_handler._execute_fiscal_operations(inserts_region, updates_region, entity_type, region_table_name, modified_by, account_rid, account_r_number, document_rid)


        except Exception as e:
            logger.error(f"Fiscal upsert failed: {str(e)}")
            raise
