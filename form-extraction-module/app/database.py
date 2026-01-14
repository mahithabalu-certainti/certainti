
import json
import psycopg2
from psycopg2 import pool
from contextlib import contextmanager
from .config import get_settings

settings = get_settings()

class DBPool:
    _connection_pool = None
    _MAX_RETRIES = 3
    _RETRY_DELAY = 1

    @classmethod
    def initialize_pool(cls):
        print(f"Initializing connection pool for {settings.MAINDB_ENDPOINT}")
        if cls._connection_pool is None:
            try:
                cls._connection_pool = pool.ThreadedConnectionPool(
                    minconn=5,
                    maxconn=20,
                    dbname=settings.MAINDB_NAME,
                    user=settings.MAINDB_USERNAME,
                    password=settings.MAINDB_PASSWORD,
                    host=settings.MAINDB_ENDPOINT,
                    port=settings.MAIN_PG_DB_PORT,
                    keepalives=1,
                    keepalives_idle=30,
                    keepalives_interval=10,
                    keepalives_count=5,
                    connect_timeout=10,
                    sslmode="require"
                )
                print("Database connection pool initialized successfully")
            except Exception as e:
                print(f"Error initializing connection pool: {str(e)}")
                raise

    @classmethod
    @contextmanager
    def get_connection(cls):
        if cls._connection_pool is None:
            cls.initialize_pool()

        conn = None
        try:
            conn = cls._connection_pool.getconn()
            # Verify connection is still alive
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            yield conn
            # No commit here, handled by caller or explicit commit
        except Exception as e:
            print(f"Database error: {str(e)}")
            if conn:
                try:
                    conn.rollback()
                except:
                    pass
            raise
        finally:
            if conn:
                cls._connection_pool.putconn(conn)


# Initialize pool when module is loaded
DBPool.initialize_pool()


def get_status_rid(conn, status_name):
    """Fetch status rid by name."""
    try:
        cur = conn.cursor()
        schema = settings.MAIN_SCHEMA_NAME
        cur.execute(f"SELECT rid FROM {schema}.data_mapper_upload_status WHERE status_name = %s LIMIT 1", (status_name,))
        result = cur.fetchone()
        cur.close()
        return result[0] if result else None
    except Exception as e:
        print(f"Error fetching status {status_name}: {e}")
        return None


def update_extraction_status(conn, rid, status, error_message=None, extracted_data=None, user_id=None):
    """
    Update data mapper form status.
    If extracted_data is provided, parse 'pdf_form_fields' and insert into data_mapper_form_mappings.
    """
    try:
        status_rid = get_status_rid(conn, status)
        if not status_rid:
            print(f"Status {status} not found")
            return

        schema = settings.MAIN_SCHEMA_NAME
        
        with conn.cursor() as cur:

            # 2. Update status in main table
            query = f"UPDATE {schema}.data_mapper_forms SET status_rid = %s"
            params = [status_rid]

            if error_message:
                query += ", error_message = %s"
                params.append(error_message)
            
            query += " WHERE rid = %s"
            params.append(rid)
            cur.execute(query, tuple(params))

            # 3. If we have extracted data, insert mappings
            if extracted_data:

                # Parse extracted_data if it's a string
                data_obj = extracted_data
                if isinstance(data_obj, str):
                    try:
                        data_obj = json.loads(data_obj)
                    except:
                        pass
                
                insert_sql = f"""
                                INSERT INTO {schema}.data_mapper_form_mappings 
                            (form_rid, field_label, created_by)
                            VALUES (%s, %s, %s)
                            """
                
                # Check for pdf_form_fields
                if isinstance(data_obj, dict):
                    sections = data_obj.get("sections", [])
                    if sections and isinstance(sections, list):
                        for section in sections:
                            line_items = section.get("line_items", [])
                            if line_items and isinstance(line_items, list):
                                for line_item in line_items:
                                    f_label = line_item.get("label", "")
                                    cur.execute(insert_sql, (rid, f_label, user_id))

        conn.commit()
        print(f"Updated record {rid} to {status}")

    except Exception as e:
        print(f"Error updating status for {rid}: {e}")
        conn.rollback()
