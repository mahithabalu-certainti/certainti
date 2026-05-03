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
                    minconn=10,
                    maxconn=50,
                    dbname=settings.ENTITY_DB_NAME,
                    user=settings.ENTITY_DB_USER,
                    password=settings.ENTITY_DB_PASS,
                    host=settings.ENTITY_DB_HOST,
                    port=5432,
                    keepalives=1,
                    keepalives_idle=15,
                    keepalives_interval=5,
                    keepalives_count=5,
                    connect_timeout=10,
                    sslmode="require"
                )
                logger.info(
                    f"✅ Database connection pool initialized successfully\n"
                    f"   Pool size: min=10, max=50\n"
                    f"   Keepalive: idle=15s, interval=5s, count=5\n"
                    f"   Host: {settings.ENTITY_DB_HOST}"
                )
            except Exception as e:
                logger.error(f"Error initializing connection pool: {str(e)}")
                raise
        if cls._main_connection_pool is None:
            try:
                cls._main_connection_pool = pool.ThreadedConnectionPool(
                    minconn=10,
                    maxconn=50,
                    dbname=settings.MAIN_DB_NAME,
                    user=settings.MAIN_DB_USER,
                    password=settings.MAIN_DB_PASSWORD,
                    host=settings.MAIN_DB_HOST,
                    port=5432,
                    keepalives=1,
                    keepalives_idle=15,
                    keepalives_interval=5,
                    keepalives_count=5,
                    connect_timeout=10,
                    sslmode="require"
                )
                logger.info(
                    f"✅ Database connection pool initialized successfully\n"
                    f"   Pool size: min=10, max=50\n"
                    f"   Keepalive: idle=15s, interval=5s, count=5\n"
                    f"   Host: {settings.MAIN_DB_HOST}"
                )
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

def get_required_columns(entity_type: str, account_rid: str, account_r_number: str):
    table_name = get_tenant_table(account_r_number, config.CLIENT_TEMPLATE_COLUMNS_TEMPLATES_TABLE)
    TEMPLATE_COLUMNS_TABLE = get_tenant_table(account_r_number, config.TEMPLATE_COLUMNS_TABLE)
    try:
        with DBPool.get_connection() as conn:
            # Fetch the template ID (rid) based on entity_type and account_rid
            query_template = f"""
            SELECT rid 
            FROM {table_name}
            WHERE entity_type = %s AND account_rid = %s
            """
            
            with conn.cursor() as cursor:
                cursor.execute(query_template, (entity_type, account_rid))
                template_id = cursor.fetchone()
                
                if not template_id:
                    logger.error(f"No matching template found for entity_type '{entity_type}' and account_rid '{account_rid}'")
                    return []

                logger.info(f"Fetched template_id: {template_id[0]}")
            logger.info(f"account: {account_rid}")
            logger.info(f"account: {TEMPLATE_COLUMNS_TABLE}")
            # Fetch the required columns using the retrieved rid
            query_columns = f"""
            SELECT col_name 
            FROM {TEMPLATE_COLUMNS_TABLE}
            WHERE client_template_rid = %s AND account_rid = %s AND required = true
            """
            
            with conn.cursor() as cursor:
                cursor.execute(query_columns, (template_id[0], account_rid))
                required_columns = [row[0] for row in cursor.fetchall()]
                logger.info(f"Fetched required columns: {required_columns}")
                return required_columns
                
    except Exception as e:
        logger.error(f"Error fetching required columns for entity_type '{entity_type}': {e}")
        return []

def get_validate_rows(entity_type: str, account_rid: str, account_r_number: str):
    table_name = get_tenant_table(account_r_number, config.CLIENT_TEMPLATE_COLUMNS_TEMPLATES_TABLE)
    TEMPLATE_COLUMNS_TABLE = get_tenant_table(account_r_number, config.TEMPLATE_COLUMNS_TABLE)
    try:
        with DBPool.get_connection() as conn:
            # Fetch the template ID (rid) based on entity_type and account_rid
            query_template = f"""
            SELECT rid 
            FROM {table_name}
            WHERE entity_type = %s AND account_rid = %s
            """
            
            with conn.cursor() as cursor:
                cursor.execute(query_template, (entity_type, account_rid))
                template_id = cursor.fetchone()
                
                if not template_id:
                    logger.error(f"No matching template found for entity_type '{entity_type}' and account_rid '{account_rid}'")
                    return []

                logger.info(f"Fetched template_id: {template_id[0]}")

            # Fetch the required columns using the retrieved rid
            query_columns = f"""
                SELECT col_name, col_type, required 
                FROM {TEMPLATE_COLUMNS_TABLE}
                WHERE client_template_rid = %s AND account_rid = %s
            """
            
            try:
                with DBPool.get_connection() as conn:
                    with conn.cursor() as cursor:
                        cursor.execute(query_columns, (template_id[0], account_rid))
                        rows = cursor.fetchall()
                        
                        # Construct schema dynamically
                        schema = {row[0]: (row[1], row[2]) for row in rows}
                        
                        logger.info(f"✅ Constructed schema: {schema}")
            
            except Exception as e:
                logger.error(f"❌ Error fetching schema for entity_type '{entity_type}': {e}")
                return {}

            return schema
                
    except Exception as e:
        logger.error(f"Error fetching required columns for entity_type '{entity_type}': {e}")
        return []


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
    
def get_start_end_date_by_account_rid(account_r_number, account_rid, fiscal_year):
    try:
        table_name = get_tenant_table(account_r_number, config.ACCOUNT_DETAIL_TABLE)

        with DBPool.get_connection() as conn:
            query = f"""
            SELECT fiscal_start_date, fiscal_end_date 
            FROM {table_name}
            WHERE account_rid = %s
            """
            with conn.cursor() as cursor:
                cursor.execute(query, (account_rid,))
                result = cursor.fetchone()
                
                if result:
                    fiscal_start_str, fiscal_end_str = result[0], result[1]
                    logger.info(f"fiscal_start_str : {fiscal_start_str}")
                    logger.info(f"fiscal_end_str : {fiscal_end_str}")

                    # Ensure fiscal_year is int
                    fiscal_year = int(fiscal_year)

                    # Parse month/day only (assumes DB values are "MM/DD")
                    start_md = datetime.strptime(fiscal_start_str, "%m/%d")
                    end_md = datetime.strptime(fiscal_end_str, "%m/%d")

                    # Build actual fiscal dates
                    start_date = datetime(fiscal_year, start_md.month, start_md.day)
                    if (end_md.month, end_md.day) < (start_md.month, start_md.day):
                        # Fiscal year spans across years
                        start_date = datetime(fiscal_year - 1, start_md.month, start_md.day)
                        end_date = datetime(fiscal_year, end_md.month, end_md.day)
                    else:
                        start_date = datetime(fiscal_year, start_md.month, start_md.day)
                        end_date = datetime(fiscal_year, end_md.month, end_md.day)

                    return {
                        "fiscal_start_date": start_date.strftime("%Y-%m-%d"),
                        "fiscal_end_date": end_date.strftime("%Y-%m-%d")
                    }
                else:
                    logger.warning(f"No fiscal data found for account_rid: {account_rid}")
                    return None
    except Exception as e:
        logger.error(f"Error fetching fiscal data for account_rid {account_rid}: {e}")
        raise

def check_customisation_accounts(account_rid, account_name):
    try:
        table_name = get_public_table(config.CHECK_CUSTOMISATION_TABLE)

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

def get_public_table(table_name: str) -> str:
    logger.info(f"table_name : {table_name}")
    return f'"{Constants.SCHEMA_MAIN}".{table_name}'

def store_data(df: DataFrame, modified_by: str,document_rid: str, entity_type: str, account_r_number: str):
    """
    Stores data exactly as received into staging tables without any constraints or unique keys.
    Handles Spark DataFrame writing to PostgreSQL using JDBC.
    
    Args:
        df (DataFrame): Spark DataFrame containing the data
        entity_type (str): Type of entity (e.g., resource, project)
        account_r_number (str): Account identifier
    """
    # Map of entity types to staging table names
    valid_entity_types: Dict[str, str] = {
        "resource": config.STAGING_RESOURCE_TABLE,
        "resource_cost": config.STAGING_RESOURCE_COST_TABLE,
        "resource_skill": config.STAGING_RESOURCE_SKILL_TABLE,
        "project": config.STAGING_PROJECT_TABLE,
        "project_resource": config.STAGING_PROJECT_RESOURCE_TABLE,
        "project_task": config.STAGING_PROJECT_TASK_TABLE
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


def fetch_by_kafka_producer_id(producer_id: str, account_r_number: str, status: str = None):
    """Fetch record based on producer_id with optional status filter.
   
    Args:
        producer_id (str): The producer ID to search for.
        account_r_number (str): Account number for tenant table identification.
        status (str, optional): Status to filter by. Defaults to None (no status filter).
   
    Returns:
        dict/None: The matching record if found, None otherwise.
    """
    table_name = get_tenant_table(account_r_number, config.KAFKA_EVENTS_TABLE)
    
    try:
        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                if status:
                    cursor.execute(
                        f"SELECT * FROM {table_name} WHERE producer_id = %s AND status = %s",
                        (producer_id, status)
                    )
                else:
                    cursor.execute(
                        f"SELECT * FROM {table_name} WHERE producer_id = %s",
                        (producer_id,)
                    )


                result = cursor.fetchone()
                if result:
                    return result
                else:
                    logger.warning(
                        f"Record with producer_id {producer_id}" +
                        (f" and status '{status}'" if status else "") +
                        " not found."
                    )
                    return None
 
    except Exception as e:
        logger.error(f"Error fetching record for producer_id {producer_id}: {e}", exc_info=True)
        return None


def fetch_document_url(document_rid,account_r_number):
    """Fetch the document URL from the document table based on document_rid."""
    table_name = get_tenant_table(account_r_number, config.DOCUMENT_TABLE)
    if not document_rid:
        logger.error("document_rid cannot be None")
        return None

    try:
        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(f"""
                    SELECT document_url 
                    FROM {table_name} 
                    WHERE rid = %s
                """, (document_rid,))
                result = cursor.fetchone()
                if result:
                    return result[0]
                else:
                    logger.warning(f"No document URL found for document_rid {document_rid}")
                    return None
    except Exception as e:
        logger.error(f"Error fetching document URL for document_rid {document_rid}: {e}")
        return None

def fetch_document_entity(document_rid,account_r_number):
    """Fetch the document URL from the document table based on document_rid."""
    table_name = get_tenant_table(account_r_number, config.IMPORT_TABLE)
    if not document_rid:
        logger.error("document_rid cannot be None")
        return None

    try:
        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(f"""
                    SELECT entity_type 
                    FROM {table_name} 
                    WHERE document_rid = %s
                """, (document_rid,))
                result = cursor.fetchone()
                if result:
                    return result[0]
                else:
                    logger.warning(f"No document entity found for document_rid {document_rid}")
                    return None
    except Exception as e:
        logger.error(f"Error fetching document entity for document_rid {document_rid}: {e}")
        return None

def insert_kafka_event(event,account_r_number):
    table_name = get_tenant_table(account_r_number, config.KAFKA_EVENTS_TABLE)
    """Insert Kafka event metadata with all required fields"""
    try:
        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(f"""
                    INSERT INTO {table_name} (
                        document_rid, document_name,
                        document_upload_rid, status, source_name,
                        topic_name, producer_id, created_by
                    ) VALUES (
                        %(document_rid)s, %(document_name)s,
                        %(document_upload_rid)s, %(status)s, %(source_name)s,
                        %(topic_name)s, %(producer_id)s, %(created_by)s
                    )
                """, event)
                conn.commit()
    except Exception as e:
        logger.error(f"Kafka event insert failed: {str(e)}")
        raise

def fetch_by_kafka_source_name(document_rid: str,account_r_number: str):
    """Fetch record based on producer_id."""
    table_name = get_tenant_table(account_r_number, config.KAFKA_EVENTS_TABLE)
    try:
        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(f"SELECT source_name FROM {table_name} WHERE document_rid = %s", (document_rid,))
                result = cursor.fetchone()
                if result:
                    return result
                else:
                    logger.warning(f"Record with document_rid {document_rid} not found.")
                    return None
    except Exception as e:
        logger.error(f"Error fetching record: {e}")
        return None

def fetch_by_kafka_document_upload_rid(document_rid: str,account_r_number: str):
    """Fetch record based on producer_id."""
    table_name = get_tenant_table(account_r_number, config.KAFKA_EVENTS_TABLE)
    try:
        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(f"SELECT document_upload_rid FROM {table_name} WHERE document_rid = %s", (document_rid,))
                result = cursor.fetchone()
                if result:
                    return result
                else:
                    logger.warning(f"Record with document_rid {document_rid} not found.")
                    return None
    except Exception as e:
        logger.error(f"Error fetching record: {e}")
        return None
        
def fetch_by_kafka_document_id(document_rid: str,account_r_number: str):
    """Fetch record based on producer_id."""
    table_name = get_tenant_table(account_r_number, config.KAFKA_EVENTS_TABLE)
    try:
        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(f"SELECT * FROM {table_name} WHERE document_rid = %s", (document_rid,))
                result = cursor.fetchone()
                logger.info(f"Result frm fetch_by_kafka_document_id ======> {result}")
                if result:
                    return result
                else:
                    logger.warning(f"Record with document_rid {document_rid} not found.")
                    return None
    except Exception as e:
        logger.error(f"Error fetching record: {e}")
        return None

def fetch_by_kafka_document_name(document_rid: str,account_r_number: str):
    """Fetch record based on producer_id."""
    table_name = get_tenant_table(account_r_number, config.KAFKA_EVENTS_TABLE)
    try:
        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(f"SELECT document_name FROM {table_name} WHERE document_rid = %s", (document_rid,))
                result = cursor.fetchone()
                if result:
                    return result
                else:
                    logger.warning(f"Record with document_rid {document_rid} not found.")
                    return None
    except Exception as e:
        logger.error(f"Error fetching record: {e}")
        return None

def generate_uuid():
    try:
        with DBPool.get_connection_uuid() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT gen_random_uuid();")
                uuid_val = cursor.fetchone()[0]
                uuid_val = f"{Constants.UUID_PREFIX}-{uuid_val}"
                logger.info(f"UUID generated: {uuid_val}")
                return uuid_val
    except Exception as e:
        logger.error(f"Error in generating UUID: {e}")
        return None


def fetch_by_upload_user_id(document_rid, account_r_number):
    """Fetch the document URL from the document table based on document_rid."""
    table_name = get_tenant_table(account_r_number, config.IMPORT_TABLE)
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

def get_user_details(user_rid: str) -> str:
    with DBPool.get_connection_mainDB() as conn:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    SELECT email, CONCAT(first_name,' ',last_name) FROM {Constants.MAIN_SCHEMA_PREFIX}.{Constants.USER_MAIN_TABLE}
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

def get_valid_project_types() -> list:
    try:
        with DBPool.get_connection_mainDB() as conn:
            with conn.cursor() as cur:
                cur.execute(f"""
                    SELECT DISTINCT project_type_name
                    FROM {Constants.MAIN_SCHEMA_PREFIX}.{Constants.PROJECT_TYPE_TABLE}
                    WHERE status = 'active'
                """)
                result = cur.fetchall()
                return [row[0].strip() for row in result if row[0]]
    except Exception as e:
        logger.error(f"Error fetching valid project types: {str(e)}")
        raise

def get_valid_task_types() -> list:
    try:
        with DBPool.get_connection_mainDB() as conn:
            with conn.cursor() as cur:
                cur.execute(f"""
                    SELECT DISTINCT project_task_type_name
                    FROM {Constants.MAIN_SCHEMA_PREFIX}.{Constants.TASK_TYPE_TABLE}
                    WHERE status = 'active'
                """)
                result = cur.fetchall()
                return [row[0].strip() for row in result if row[0]]
    except Exception as e:
        logger.error(f"Error fetching valid task types: {str(e)}")
        raise

def get_valid_task_classifications() -> list:
    try:
        with DBPool.get_connection_mainDB() as conn:
            with conn.cursor() as cur:
                cur.execute(f"""
                    SELECT DISTINCT classification_name
                    FROM {Constants.MAIN_SCHEMA_PREFIX}.{Constants.TASK_CLASSIFICATION_TABLE}
                    WHERE classification_status = 'active'
                """)
                result = cur.fetchall()
                return [row[0].strip() for row in result if row[0]]
    except Exception as e:
        logger.error(f"Error fetching valid task classifications: {str(e)}")
        raise

def get_valid_resource_types() -> list:
    try:
        with DBPool.get_connection_mainDB() as conn:
            with conn.cursor() as cur:
                cur.execute(f"""
                    SELECT DISTINCT resource_type_name
                    FROM {Constants.MAIN_SCHEMA_PREFIX}.{Constants.RESOURCE_TYPE_TABLE}
                    WHERE status = 'active'
                """)
                result = cur.fetchall()
                return [row[0].strip() for row in result if row[0]]
    except Exception as e:
        logger.error(f"Error fetching valid resource types: {str(e)}")
        raise


def fetch_document_url(document_rid,account_r_number):
    """Fetch the document URL from the document table based on document_rid."""
    table_name = get_tenant_table(account_r_number, Constants.DOCUMENT_TABLE)
    if not document_rid:
        logger.error("document_rid cannot be None")
        return None

    try:
        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(f"""
                    SELECT document_url 
                    FROM {table_name} 
                    WHERE rid = %s
                """, (document_rid,))
                result = cursor.fetchone()
                if result:
                    return result[0]
                else:
                    logger.warning(f"No document URL found for document_rid {document_rid}")
                    return None
    except Exception as e:
        logger.error(f"Error fetching document URL for document_rid {document_rid}: {e}")
        return None
    
def get_upload_rid_by_document_rid(document_rid : str,account_r_number) : 
    """Fetch the kafka events details from the kafka events table based on producer_id."""
    table_name = get_tenant_table(account_r_number, Constants.IMPORT_TABLE)
    if not document_rid:
        logger.error("document_rid cannot be None")
        return None

    try:
        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(f"""
                    SELECT document_name 
                    FROM {table_name} 
                    WHERE document_rid = %s
                """, (document_rid,))
                result = cursor.fetchone()
                logger.info(f"result====> {result}")
                if result:
                    return result[0]
                else:
                    logger.warning(f"No Details found for document_rid {document_rid}")
                    return None
    except Exception as e:
        logger.error(f"Error fetching Kafka Details for document_rid {document_rid}: {e}")
        return None
    
def get_user_id_by_upload_rid(upload_rid : str,account_r_number) : 
    """Fetch the User_id from the Imports table based on upload rid."""
    table_name = get_tenant_table(account_r_number, Constants.Database.IMPORT_TABLE)
    if not upload_rid:
        logger.error("upload_rid cannot be None")
        return None

    try:
        with DBPool.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(f"""
                    SELECT uploaded_by_user_rid 
                    FROM {table_name} 
                    WHERE rid = %s AND LOWER(upload_status) = 'processing'
                """, (upload_rid,))
                result = cursor.fetchone()
                if result:
                    return result[0]
                else:
                    logger.warning(f"No Details found for producer_id {upload_rid}")
                    return None
    except Exception as e:
        logger.error(f"Error fetching Upload Details for producer_id {upload_rid}: {e}")
        return None
    

    
def get_valid_countries(country_names: List[str]) -> List[str]:
    """Return list of valid country names from database.
       If input length <= 3, check against country_code.
       If input length > 3, check against country_name.
    """
    with DBPool.get_connection_mainDB() as conn:
        with conn.cursor() as cursor:
            results = []

            for name in country_names:
                if len(name) <= 3:
                    # Search by country_code
                    query = f"""
                        SELECT country_name 
                        FROM {Constants.MAIN_SCHEMA_PREFIX}.{Constants.COUNTRY} 
                        WHERE lower(country_code) = lower(%s)
                    """
                    params = (name,)
                else:
                    # Search by country_name
                    query = f"""
                        SELECT country_name 
                        FROM {Constants.MAIN_SCHEMA_PREFIX}.{Constants.COUNTRY} 
                        WHERE lower(country_name) = lower(%s)
                    """
                    params = (name,)
                logger.info(f"Executing query: {query.strip()}")
                logger.info(f"With params: {params}")
                cursor.execute(query, params)
                results.extend([row[0] for row in cursor.fetchall()])
                logger.info(f"results====> {results}")
            return results


def get_valid_states(state_names: List[str]) -> List[str]:
    """Return list of valid state names from database"""
    if not state_names:
        return []

    with DBPool.get_connection_mainDB() as conn:
        with conn.cursor() as cursor:
            query = f"""
                SELECT state_name
                FROM {Constants.MAIN_SCHEMA_PREFIX}.{Constants.STATE}
                WHERE state_name = ANY(%s)
                   OR state_code = ANY(%s)
            """
            params = (state_names, state_names)
            logger.info(f"Executing query: {query.strip()}")
            logger.info(f"With params: {params}")
            cursor.execute(query, params)
            return [row[0] for row in cursor.fetchall()]

def get_valid_cities(city_names: List[str]) -> List[str]:
    """Return list of valid city names from database"""
    with DBPool.get_connection_mainDB() as conn:
        with conn.cursor() as cursor:
            if len(city_names) == 1:
                query = f"SELECT city_name FROM {Constants.MAIN_SCHEMA_PREFIX}.{Constants.CITY} WHERE city_name = %s"
                params = (city_names[0],)
            else:
                query = f"SELECT city_name FROM {Constants.MAIN_SCHEMA_PREFIX}.{Constants.CITY} WHERE city_name IN %s"
                params = (tuple(city_names),)
                
            cursor.execute(query, params)
            return [row[0] for row in cursor.fetchall()]

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

def get_account_details(account_rid: str):
    """
    Retrieve account name, country_rid, and country_code from account table using account_rid.
    """
    try:
        with DBPool.get_connection_mainDB() as conn:
            query = f"""
                SELECT a.account_name,
                       a.country_rid,
                       c.country_code
                FROM   {Constants.MAIN_SCHEMA_PREFIX}.{Constants.ACCOUNT_TABLE} a
                JOIN   {Constants.MAIN_SCHEMA_PREFIX}.{Constants.COUNTRY} c
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
                return None, None, None
    except Exception as e:
        logger.error(f"Error fetching account info for {account_rid}: {e}")
        return None, None, None

