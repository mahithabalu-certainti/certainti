from pyspark.sql import DataFrame
import json
import uuid
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, current_timestamp
import psycopg2
from psycopg2 import pool
from logger.logger import logger
from config import config, settings
from datetime import datetime
from contextlib import contextmanager
from constants import Constants
import psycopg2
from psycopg2 import pool
from contextlib import contextmanager
import logging
from time import sleep
from pyspark.sql.window import Window
from pyspark.sql.functions import current_timestamp, col as F_col, trim, upper
from typing import Dict,List

logger = logging.getLogger(__name__)

class DBPool:
    _connection_pool = None
    _main_connection_pool = None
    _MAX_RETRIES = 3
    _RETRY_DELAY = 1  # seconds

    @classmethod
    def initialize_pool(cls):
        logger.info(f"Initializing connection pool for {settings.ENTITY_DB_HOST}")
        if cls._connection_pool is None:
            try:
                cls._connection_pool = pool.ThreadedConnectionPool(
                    minconn=5,
                    maxconn=20,
                    dbname=settings.ENTITY_DB_NAME,
                    user=settings.ENTITY_DB_USER,
                    password=settings.ENTITY_DB_PASS,
                    host=settings.ENTITY_DB_HOST,
                    port=5432,
                    keepalives=1,  # Enable TCP keepalive
                    keepalives_idle=30,  # Start sending keepalives after 30s of idle
                    keepalives_interval=10,  # Send keepalives every 10s
                    keepalives_count=5,  # Number of keepalives before dropping connection
                    connect_timeout=10,  # Connection timeout in seconds
                    sslmode="require"  # Or "prefer" depending on your setup
                )
                logger.info("Database connection pool initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing connection pool: {str(e)}")
                raise
        if cls._main_connection_pool is None:
            try:
                cls._main_connection_pool = pool.ThreadedConnectionPool(
                    minconn=5,
                    maxconn=20,
                    dbname=settings.MAIN_DB_NAME,
                    user=settings.MAIN_DB_USER,
                    password=settings.MAIN_DB_PASSWORD,
                    host=settings.MAIN_DB_HOST,
                    port=5432,
                    keepalives=1,  # Enable TCP keepalive
                    keepalives_idle=30,  # Start sending keepalives after 30s of idle
                    keepalives_interval=10,  # Send keepalives every 10s
                    keepalives_count=5,  # Number of keepalives before dropping connection
                    connect_timeout=10,  # Connection timeout in seconds
                    sslmode="require"  # Or "prefer" depending on your setup
                )
                logger.info("Database connection pool initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing connection pool: {str(e)}")
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
        if cls._connection_pool is None:
            cls.initialize_pool()

        conn = None
        attempt = 0
        
        while attempt < cls._MAX_RETRIES:
            try:
                conn = cls._connection_pool.getconn()
                # Verify connection is still alive
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    cursor.fetchone()
                
                yield conn
                return  # Success - exit the retry loop
            
            except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
                attempt += 1
                logger.warning(f"Connection attempt {attempt} failed: {str(e)}")
                if conn:
                    try:
                        conn.close()  # Ensure broken connection is closed
                    except:
                        pass
                
                if attempt < cls._MAX_RETRIES:
                    sleep(cls._RETRY_DELAY * attempt)
                    continue
                raise
                
            except Exception as e:
                logger.error(f"Unexpected error getting connection: {str(e)}")
                raise
                
            finally:
                if conn:
                    try:
                        cls._connection_pool.putconn(conn)
                    except Exception as e:
                        logger.error(f"Error returning connection to pool: {str(e)}")
                        try:
                            conn.close()
                        except:
                            pass
    @classmethod
    @contextmanager
    def get_connection_mainDB(cls):
        if cls._main_connection_pool is None:
            cls.initialize_pool()

        conn = None
        attempt = 0
        
        while attempt < cls._MAX_RETRIES:
            try:
                conn = cls._main_connection_pool.getconn()
                # Verify connection is still alive
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    cursor.fetchone()
                
                yield conn
                return  # Success - exit the retry loop
            
            except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
                attempt += 1
                logger.warning(f"Connection attempt {attempt} failed: {str(e)}")
                if conn:
                    try:
                        conn.close()  # Ensure broken connection is closed
                    except:
                        pass
                
                if attempt < cls._MAX_RETRIES:
                    sleep(cls._RETRY_DELAY * attempt)
                    continue
                raise
                
            except Exception as e:
                logger.error(f"Unexpected error getting connection: {str(e)}")
                raise
                
            finally:
                if conn:
                    try:
                        cls._main_connection_pool.putconn(conn)
                    except Exception as e:
                        logger.error(f"Error returning connection to pool: {str(e)}")
                        try:
                            conn.close()
                        except:
                            pass


# Initialize pool when module is loaded
DBPool.initialize_pool()

def store_data(df: DataFrame, modified_by: str,document_rid: str, entity_type: str, account_r_number: str, emp_type: str):
    """
    Stores data exactly as received into staging tables without any constraints or unique keys.
    Handles Spark DataFrame writing to PostgreSQL using JDBC.
    
    Args:
        df (DataFrame): Spark DataFrame containing the data
        entity_type (str): Type of entity (e.g., resource, project)
        account_r_number (str): Account identifier
    """
    # Map of entity types to staging table names
    if emp_type == "Full-Time":
        valid_entity_types: Dict[str, str] = {
            "project_resource": config.STAGING_PROJECT_RESOURCE_FULLTIME_TM_IR_TABLE
        }
    else:
        valid_entity_types: Dict[str, str] = {
            "project_resource": config.STAGING_PROJECT_RESOURCE_SUBCON_TM_IR_TABLE
        }

    account_r_number = account_r_number.upper()

    if entity_type not in valid_entity_types:
        logger.error(f"❌ Unsupported entity_type: {entity_type}. Must be one of {list(valid_entity_types.keys())}")
        raise ValueError(f"Unsupported entity_type: {entity_type}")

    try:
        # Check for empty DataFrame
        if df.isEmpty():
            logger.warning(f"Empty DataFrame for entity_type '{entity_type}' - nothing to process.")
            return

        # Log DataFrame schema and sample for debugging
        logger.info(f"DataFrame schema for {entity_type}:\n{df.schema}")

        # Add missing timestamps
        for col_name in ["created_at", "modified_at"]:
            if col_name not in df.columns:
                df = df.withColumn(col_name, current_timestamp())

        # Cast all columns to StringType
        for field in df.schema.fields:
            if str(field.dataType) != "StringType":
                df = df.withColumn(field.name, F_col(field.name).cast("string"))

        # Repartition DataFrame
        record_count = df.count()
        if record_count == 0:
            logger.warning(f"No valid records for entity_type '{entity_type}' after processing")
            return
        num_partitions = get_partition_count(record_count)
        df = df.repartition(num_partitions)
        logger.info(f"Repartitioned DataFrame into {num_partitions} partitions.")

        # Prepare table names
        numeric_part = account_r_number.split("-")[1]
        schema_name = f"{Constants.SCHEMA_PREFIX}{numeric_part}"
        base_table_name = valid_entity_types[entity_type]
        logger.info(f"base_table_name : {base_table_name}")
        temp_table_name = f"temp_{uuid.uuid4().hex[:8]}"

        spark_table_name = f'"{schema_name}"."{base_table_name}"'
        spark_temp_table = f'"{schema_name}"."{temp_table_name}"'
        pg_full_table_name = f'"{schema_name}"."{base_table_name}"'
        pg_temp_table_name = f'"{schema_name}"."{temp_table_name}"'

        logger.info(f"Target table: {pg_full_table_name}, Temp table: {pg_temp_table_name}")

        # JDBC connection properties
        jdbc_url = config.STAGING_JDBC_URL
        conn_properties = {
            "user": settings.ENTITY_DB_USER,
            "password": settings.ENTITY_DB_PASS,
            "driver": "org.postgresql.Driver",
            "stringtype": "unspecified"
        }

        # Write DataFrame to temporary table
        try:
            logger.info(f"Writing to temporary table: {spark_temp_table}")
            (df.write
             .format("jdbc")
             .option("url", jdbc_url)
             .option("dbtable", spark_temp_table)
             .options(**conn_properties)
             .mode("overwrite")
             .save())
        except Exception as e:
            logger.error(f"Failed to write DataFrame to temp table {spark_temp_table}: {str(e)}")
            raise

        # Begin DB operations
        with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    try:
                        cursor.execute("BEGIN")
                        # Use advisory lock to prevent concurrent writes
                        lock_id = abs(hash(pg_full_table_name)) % (10 ** 8)
                        cursor.execute(f"SELECT pg_advisory_lock({lock_id})")

                        # Create target table if it doesn't exist (no constraints)
                        create_table_sql = f"""CREATE TABLE IF NOT EXISTS {pg_full_table_name} (
                            {', '.join([f'"{col}" TEXT' for col in df.columns])}
                        )"""
                        cursor.execute(create_table_sql)

                        # For all entity types, perform a simple insert of all data
                        column_list = ', '.join([f'"{col}"' for col in df.columns])
                        insert_query = f"""
                        INSERT INTO {pg_full_table_name} ({column_list})
                        SELECT {column_list} FROM {pg_temp_table_name}
                        """
                        cursor.execute(insert_query)

                        cursor.execute(f"SELECT pg_advisory_unlock({lock_id})")
                        cursor.execute("COMMIT")
                        logger.info(f"Successfully processed records into {pg_full_table_name}")

                    except Exception as e:
                        conn.rollback()
                        cursor.execute(f"SELECT pg_advisory_unlock({lock_id})")
                        logger.error(f"Database operation failed: {str(e)}")
                        raise

                    finally:
                        try:
                            cursor.execute(f'DROP TABLE IF EXISTS {pg_temp_table_name}')
                            logger.info(f"Dropped temporary table {pg_temp_table_name}")
                        except Exception as e:
                            logger.warning(f"Failed to drop temp table {pg_temp_table_name}: {str(e)}")

    except Exception as e:
        logger.error(f"Data processing failed for {entity_type}: {str(e)}")
        update_import_status(
                modified_by,
                account_r_number,
                document_rid,
                config.VALIDATION_MESSAGE_FAILURE,
                staging_end_timestamp=datetime.utcnow(),
                staging_error="Failed - Error processing the file"
            )
        update_document_status(
            modified_by,
            account_r_number,
            document_rid,
            config.PRODUCED_MESSAGE_FAILURE,
            "Failed - Error processing the file")
        raise

def get_partition_count(record_count: int) -> int:
    if record_count <= 1000:
        return 1
    elif record_count <= 100000:
        return max(2, record_count // 25000)
    elif record_count <= 5000000:
        return min(64, record_count // 100000)
    else:
        return 128 


def update_document_status(modified_by: str, account_r_number: str, document_rid: str, status: str, failure_reason: str):
    table_name = get_tenant_table(account_r_number, config.DOCUMENT_TABLE)
    try:
        with DBPool.get_connection() as conn:
            query = f"""
            UPDATE {table_name}
            SET document_status = %s,
                failure_reason = %s,
                modified_by = %s
            WHERE rid = %s;
            """
            with DBPool.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (status, failure_reason, modified_by, document_rid))
                    conn.commit()
                    logger.info(f"Updated status for document {document_rid} to {status}")
    except Exception as e:
        logger.error(f"Error updating document status: {e}")

def update_import_status(modified_by: str, account_r_number: str, document_rid: str, status: str, staging_table: str = None, 
                         staging_start_timestamp: datetime = None, 
                         staging_end_timestamp: datetime = None,
                         staging_error: str = None,
                         total_records: int = None,
                         total_staging_processed: int = None
                         ):
    table_name = get_tenant_table(account_r_number, config.IMPORT_TABLE)
    try:
        with DBPool.get_connection() as conn:
            query = f"""
            UPDATE {table_name}
            SET upload_status = %s,
                upload_failure_reason = %s,
                staging_table = %s,
                staging_status = %s,
                staging_start_timestamp = %s,
                staging_end_timestamp = %s,
                staging_error = %s,
                total_records = %s,
                total_staging_processed = %s,
                modified_by = %s
            WHERE document_rid = %s;
            """

            with conn.cursor() as cursor:
                cursor.execute(query, (
                    status, 
                    staging_error, 
                    staging_table, 
                    status, 
                    staging_start_timestamp, 
                    staging_end_timestamp, 
                    staging_error, 
                    total_records, 
                    total_staging_processed, 
                    modified_by,
                    document_rid  # This was moved to be the last parameter
                ))
                if cursor.rowcount == 0:
                    logger.warning(f"No rows updated - document_rid {document_rid} may not exist")
                else:
                    logger.info(f"Updated {cursor.rowcount} row(s) for document_rid {document_rid}")
                conn.commit()
    except Exception as e:
        logger.error(f"Error updating import status: {e}")
        raise

def update_kafka_events(modified_by, producer_id, consumer_id, status, account_r_number, error_description):
    table_name = get_tenant_table(account_r_number, config.KAFKA_EVENTS_TABLE)
    try:
        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                update_query = f"""
                    UPDATE {table_name}
                    SET consumer_id = %s,
                        message_on_timestamp = NOW(),
                        status = %s,
                        error_description = %s,
                        modified_by = %s,
                        modified_datetime = CURRENT_TIMESTAMP
                    WHERE producer_id = %s
                """
                cursor.execute(update_query, (consumer_id, status, error_description, modified_by, producer_id))
                conn.commit()
                logger.info(f"Successfully updated Kafka event for producer_id {producer_id}")
    except Exception as e:
        logger.error(f"Error updating document status: {e}")
        raise

def get_tenant_table(account_r_number: str, table_name: str) -> str:
    account_r_number = account_r_number.upper()
    account_r_number = account_r_number.split("-")[1]
    # Quote the schema name to preserve case sensitivity
    return f'"{Constants.SCHEMA_PREFIX}{account_r_number}".{table_name}'

def get_file_name_from_db(account_r_number,document_rid):
    try:
        table_name = get_tenant_table(account_r_number, config.IMPORT_TABLE)
        with DBPool.get_connection() as conn:
            query = f"""
            SELECT document_name 
            FROM {table_name}
            WHERE document_rid = %s
            """
            with conn.cursor() as cursor:
                cursor.execute(query, (document_rid,))
                result = cursor.fetchone()
                if result:
                    return result[0]  # Return the file name
                else:
                    raise ValueError(f"No file found for document_rid: {document_rid}")
    except Exception as e:
        logger.error(f"Error fetching file name for document_rid {document_rid}: {e}")
        return None


def get_valid_currencies(currency_codes: List[str]) -> List[str]:
    """Return list of valid currency codes from database"""
    with DBPool.get_connection_mainDB() as conn:
        with conn.cursor() as cursor:
            if len(currency_codes) == 1:
                query = f"SELECT currency_code FROM {Constants.MAIN_SCHEMA_PREFIX}.{Constants.CURRENCY_TABLE} WHERE currency_code = %s"
                params = (currency_codes[0],)
            else:
                query = f"SELECT currency_code FROM {Constants.MAIN_SCHEMA_PREFIX}.{Constants.CURRENCY_TABLE} WHERE currency_code IN %s"
                params = (tuple(currency_codes),)
                
            cursor.execute(query, params)
            return [row[0] for row in cursor.fetchall()]