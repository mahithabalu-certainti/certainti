import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from contextlib import contextmanager
from sqlalchemy import text
from dotenv import load_dotenv
import logging
from typing import Generator
from app.models import DocumentCreate, ImportCreate, KafkaEventCreate
from app.core.constants import Constants
from app.core.config import settings
from datetime import datetime
from app.logger.logger import get_logger

load_dotenv()

logger = get_logger("db_handler")

# Connection pool
orgPool= ThreadedConnectionPool(
    minconn=1,
    maxconn=10,
    host=settings.DB_HOST,
    port=settings.DB_PORT,
    dbname=settings.DB_NAME,
    user=settings.DB_USER,
    password=settings.DB_PASSWORD,
    sslmode=settings.DB_SSLMODE,
)
mainPool = ThreadedConnectionPool(
    minconn=1,
    maxconn=10,
    host=settings.MAIN_DB_HOST,
    port=settings.MAIN_DB_PORT,
    dbname=settings.MAIN_DB_NAME,
    user=settings.MAIN_DB_USER,
    password=settings.MAIN_DB_PASSWORD,
    sslmode=settings.DB_SSLMODE,
)

@contextmanager
def get_connection(max_retries: int = 3) -> Generator:
    logger.info("connected")
    conn = None
    try:
        conn = orgPool.getconn()
        with conn.cursor() as cur:
            yield cur
        conn.commit()
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            orgPool.putconn(conn)

@contextmanager
def get_connection_uuid(max_retries: int = 3) -> Generator:
    logger.info("connected")
    conn = None
    try:
        conn = orgPool.getconn()
        yield conn
        conn.commit()
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            orgPool.putconn(conn)


@contextmanager
def get_connection_main_db(max_retries: int = 3) -> Generator:
    logger.info("1connected")
    conn = None
    try:
        conn = mainPool.getconn()
        with conn.cursor() as cur:
            yield cur
            conn.commit()
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            mainPool.putconn(conn)

def get_account_r_number(account_rid: str) -> str:
    with get_connection_main_db() as cur:
        try:
            # First, check the storage_type for the account
            cur.execute(
                f"""
                SELECT storage_type, parent_account_rid 
                FROM {Constants.Database.MAIN_SCHEMA_PREFIX}.{Constants.Database.ACCOUNT_TABLE}
                WHERE rid = %s
                """,
                (account_rid,)
            )
            account_info = cur.fetchone()
            
            if not account_info:
                raise ValueError(f"Account not found for rid: {account_rid}")
                
            storage_type = account_info[0]
            
            if storage_type == 'separate_db':
                # Normal flow - get r_number directly
                cur.execute(
                    f"""
                    SELECT r_number FROM {Constants.Database.MAIN_SCHEMA_PREFIX}.{Constants.Database.ACCOUNT_TABLE}
                    WHERE rid = %s
                    """,
                    (account_rid,)
                )
                result = cur.fetchone()
                if result:
                    return result[0]
                else:
                    raise ValueError(f"Account r_number not found for rid: {account_rid}")
                    
            elif storage_type == 'store_in_parent':
                # Get parent account's r_number
                parent_account_rid = account_info[1]

                if not parent_account_rid:
                    raise ValueError(f"Parent account rid not found for account: {account_rid}")

                cur.execute(
                    f"""
                    SELECT r_number FROM {Constants.Database.MAIN_SCHEMA_PREFIX}.{Constants.Database.ACCOUNT_TABLE}
                    WHERE rid = %s
                    """,
                    (parent_account_rid,)
                )
                result = cur.fetchone()
                if result:
                    logger.info(f"result: {result[0]}")
                    return result[0]
                else:
                    raise ValueError(f"Parent account r_number not found for rid: {parent_account_rid}")
                    
            else:
                raise ValueError(f"Unknown storage_type: {storage_type} for account rid: {account_rid}")
                
        except Exception as e:
            logger.error(f"Error fetching account_r_number: {str(e)}")
            raise

def get_tenant_table(account_r_number: str, table_name: str) -> str:
    account_r_number = account_r_number.upper()
    account_r_number = account_r_number.split("-")[1]
    # Quote the schema name to preserve case sensitivity
    return f'"{Constants.Database.SCHEMA_PREFIX}{account_r_number}".{table_name}'

def insert_document(document: DocumentCreate, account_r_number) -> str:
    # Track 1: Initial parameters
    logger.info(f"[Track 1] Starting insert - Account: {account_r_number}")
    logger.info(f"[Track 1] Document data: {document.dict()}")
    
    table_name = get_tenant_table(account_r_number, Constants.Database.DOCUMENT_TABLE)
    logger.info(f"[Track 2] Resolved table name: {table_name}")
    with get_connection() as cursor:
        try:
            # Track 3: Pre-execution check
            logger.debug("[Track 4] Executing INSERT statement...")
            insert_query = f"""
                INSERT INTO {table_name} (
                    account_rid, related_to, related_to_rid,
                    document_source, document_type, document_format,
                    document_url, document_size, document_status,
                    created_by, modified_by, failure_reason
                ) VALUES (
                    %(account_rid)s, %(related_to)s,
                    %(related_to_rid)s, %(document_source)s, %(document_type)s,
                    %(document_format)s, %(document_url)s, %(document_size)s,
                    %(document_status)s, %(created_by)s, %(modified_by)s, %(failure_reason)s
                )
                RETURNING rid
            """
            logger.debug(f"[Track 4] Full query:\n{insert_query}")
            logger.debug(f"[Track 4] Parameters:\n{document.dict()}")
            
            cursor.execute(insert_query, document.dict())
            # Track 5: Post-execution analysis
            logger.info(f"[Track 5] Rows affected: {cursor.rowcount}")
            result = cursor.fetchone()
            logger.info(f"[Track 5] Raw result: {result}")

            # Get the returned rid
            rid = result[0]
            
            # Add debug logs
            logger.info(f"Insert successful, returned rid: {rid}")
        
            if not result:
                # Track 6: Detailed failure analysis
                logger.error("[Track 6] INSERT succeeded but no rows returned!")
                logger.error("Possible causes:")
                logger.error("- RETURNING clause not working")
                logger.error("- Trigger interfering with operation")
                logger.error("- Transaction isolation issues")
                raise ValueError("Insert operation completed but no ID returned")
            
            rid = result[0]
            logger.info(f"[Track 7] Successfully inserted with RID: {rid}")
            return rid
            
        except Exception as e:
            # Track 8: Error handling
            logger.error(f"[Track 8] {Constants.LogMessages.DOCUMENT_INSERT_FAIL}")
            logger.error(f"[Track 8] Error type: {type(e).__name__}")
            logger.error(f"[Track 8] Error details: {str(e)}")
            
            # For PostgreSQL specific errors
            if hasattr(e, 'pgcode'):
                logger.error(f"[Track 8] PostgreSQL error code: {e.pgcode}")
                logger.error(f"[Track 8] PostgreSQL error message: {e.pgerror}")
            
            raise

def insert_document_upload(document_rid: str, upload: ImportCreate , account_r_number) -> str:
    table_name = get_tenant_table(account_r_number, Constants.Database.IMPORT_TABLE)
    with get_connection() as cursor:
        try:
            upload_data = upload.dict()
            upload_data["document_rid"] = document_rid
            if upload_data.get("entity_type") in ["resource", "resource_skill"]:
                upload_data["fiscal_year"] = None
            logger.info(f"[Track 1] upload_data data: {upload_data}")
            cursor.execute(
                f"""
                INSERT INTO {table_name} (
                    document_rid, account_rid,
                    uploaded_by_user_rid, document_name,
                    related_to, related_to_rid, entity_type, fiscal_year,
                    upload_status, upload_failure_reason, created_by
                ) VALUES (
                    %(document_rid)s, %(account_rid)s,
                    %(uploaded_by_user_rid)s, %(document_name)s,
                    %(related_to)s, %(related_to_rid)s, %(entity_type)s,
                    %(fiscal_year)s, %(upload_status)s, %(upload_failure_reason)s, %(created_by)s
                )
                RETURNING rid
            """,
                upload_data,
            )
            return cursor.fetchone()[0]

        except Exception as e:
            logger.error(f"{Constants.LogMessages.IMPORT_INSERT_FAIL}: {str(e)}")
            raise


def insert_kafka_event(event: KafkaEventCreate,account_r_number) -> str:
    """Insert Kafka event and return generated rid"""
    table_name = get_tenant_table(account_r_number, Constants.Database.KAFKA_EVENTS_TABLE)
    with get_connection() as cursor:
        try:
            cursor.execute(f"""
                INSERT INTO {table_name} (
                    related_to, related_to_rid, document_rid,
                    document_name, document_upload_rid, status,
                    source_name, topic_name, producer_id,created_by
                ) VALUES (
                    %(related_to)s, %(related_to_rid)s,
                    %(document_rid)s, %(document_name)s, %(document_upload_rid)s,
                    %(status)s, %(source_name)s, %(topic_name)s,
                    %(producer_id)s, %(created_by)s
                )
                RETURNING rid  -- Critical addition
            """, event.dict())
            return cursor.fetchone()[0]
        except Exception as e:
            logger.error(f"{Constants.LogMessages.KAFKA_EVENT_FAIL}: {str(e)}")
            raise


def update_status(event_id: str, new_status: str, account_r_number, error_desc: str = None):
    table_name = get_tenant_table(account_r_number, Constants.Database.KAFKA_EVENTS_TABLE)
    with get_connection() as cursor:
        try:
            cursor.execute(f"""
                UPDATE {table_name}
                SET status = %s,
                    {Constants.KafkaEvents.ERROR_DESCRIPTION} = %s,
                    {Constants.KafkaEvents.MODIFIED_AT} = NOW()
                WHERE rid = %s
            """, (new_status, error_desc, event_id))
        except Exception as e:
            logger.error(f"{Constants.LogMessages.KAFKA_EVENT_FAIL}: {str(e)}")
            raise


def fetch_document_url(document_rid,account_r_number):
    """Fetch the document URL from the document table based on document_rid."""
    table_name = get_tenant_table(account_r_number, Constants.Database.DOCUMENT_TABLE)
    if not document_rid:
        logger.error("document_rid cannot be None")
        return None

    try:
        with get_connection() as conn:
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

def get_upload_rid_by_producer_id(producer_id : str,account_r_number) : 
    """Fetch the kafka events details from the kafka events table based on producer_id."""
    table_name = get_tenant_table(account_r_number, Constants.Database.KAFKA_EVENTS_TABLE)
    if not producer_id:
        logger.error("producer_id cannot be None")
        return None

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(f"""
                    SELECT document_upload_rid, document_name 
                    FROM {table_name} 
                    WHERE producer_id = %s AND LOWER(status) = 'processing'
                """, (producer_id,))
                result = cursor.fetchone()
                if result:
                    return {
                        "document_upload_rid" : result[0],
                        "document_name" : result[1]
                    }
                else:
                    logger.warning(f"No Details found for producer_id {producer_id}")
                    return None
    except Exception as e:
        logger.error(f"Error fetching Kafka Details for producer_id {producer_id}: {e}")
        return None
    
def get_user_id_by_upload_rid(upload_rid : str,account_r_number) : 
    """Fetch the User_id from the Imports table based on upload rid."""
    table_name = get_tenant_table(account_r_number, Constants.Database.IMPORT_TABLE)
    if not upload_rid:
        logger.error("upload_rid cannot be None")
        return None

    try:
        with get_connection() as conn:
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

def get_user_details(user_rid: str) -> str:
    with get_connection_main_db() as cur:
        try:
            cur.execute(
                f"""
                SELECT email FROM {Constants.Database.USER_MAIN_TABLE}
                WHERE rid = %s
                """,
                (user_rid,)
            )
            result = cur.fetchone()
            if result:
                return result[0]
            else:
                raise ValueError(f"User not found for rid: {user_rid}")
        except Exception as e:
            logger.error(f"Error fetching User details: {str(e)}")
            raise

def update_kafka_events(modified_by, producer_id, consumer_id, status, account_r_number, error_description):
    table_name = get_tenant_table(account_r_number, Constants.Database.KAFKA_EVENTS_TABLE)
    try:
        with get_connection() as conn:
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

def update_document_status(modified_by: str, account_r_number: str, document_rid: str, status: str, failure_reason: str):
    table_name = get_tenant_table(account_r_number, Constants.Database.IMPORT_TABLE)
    try:
        with get_connection() as conn:
            query = f"""
            UPDATE {table_name}
            SET upload_status = %s,
                upload_failure_reason = %s,
                modified_by = %s
            WHERE rid = %s;
            """
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (status, failure_reason, modified_by, document_rid))
                    conn.commit()
                    logger.info(f"Updated status for document {document_rid} to {status}")
    except Exception as e:
        logger.error(f"Error updating document status: {e}")


def update_import_status(account_r_number: str, document_rid: str, status: str, staging_table: str = None, 
                         staging_start_timestamp: datetime = None, 
                         staging_end_timestamp: datetime = None,
                         staging_error: str = None,
                         total_records: int = None,
                         total_staging_processed: int = None):
    table_name = get_tenant_table(account_r_number, Constants.Database.IMPORT_TABLE)
    try:
        with get_connection() as conn:
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
                total_staging_processed = %s
            WHERE document_rid = %s;
            """

            with conn.cursor() as cursor:
                cursor.execute(query, (status, staging_error, staging_table, status, 
                                     staging_start_timestamp, staging_end_timestamp, 
                                     staging_error, total_records, total_staging_processed, 
                                     document_rid))
                conn.commit()
                logger.info(f"Updated import status for {document_rid}: {status}")
    except Exception as e:
        logger.error(f"Error updating import status: {e}")
        raise

def generate_uuid():
    try:
        with get_connection_uuid() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT gen_random_uuid();")
                uuid_val = cursor.fetchone()[0]
                uuid_val = f"{Constants.Database.UUID_PREFIX}-{uuid_val}"
                logger.info(f"UUID generated: {uuid_val}")
                return uuid_val
    except Exception as e:
        logger.error(f"Error in generating UUID: {e}")
        return None

def get_account_country(account_rid: str):
    try:
        with get_connection_main_db() as cur:
                cur.execute(
                    f"""
                    SELECT country_rid FROM {Constants.Database.MAIN_SCHEMA_PREFIX}.{Constants.Database.ACCOUNT_MAIN_TABLE}
                    WHERE rid = %s
                    """,
                    (account_rid,)
                )
                result = cur.fetchone()
                if result:
                    return result[0]
                else:
                    logger.error(f"Account country not found for account_rid: {account_rid}")
                    return None
    except Exception as e:
        logger.error(f"Error fetching account country: {str(e)}")
        return None
