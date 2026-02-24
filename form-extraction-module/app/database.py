
import json
import uuid
import psycopg2
from psycopg2 import pool
from contextlib import contextmanager
from .config import get_settings
from .pdf_form_reader import detect_mislabeled_table, split_by_keywords
from .constants import LINE_ITEM, TABLE_ITEM, MAPPING_STATUS

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
        # Try to get a valid connection (retry logic for stale connections)
        for attempt in range(cls._MAX_RETRIES):
            try:
                conn = cls._connection_pool.getconn()
                # Verify connection is still alive
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    cursor.fetchone()
                break # Connection is good
            except Exception as e:
                print(f"Warning: Discarding dead connection (attempt {attempt+1}/{cls._MAX_RETRIES}): {e}")
                if conn:
                    # Close and remove from pool
                    try:
                        cls._connection_pool.putconn(conn, close=True)
                    except:
                        pass
                conn = None
        
        if conn is None:
            raise Exception("Failed to acquire valid database connection after retries")

        should_close = False
        try:
            yield conn
            # No commit here, handled by caller or explicit commit
        except Exception as e:
            print(f"Database error: {str(e)}")
            should_close = True
            if conn:
                try:
                    conn.rollback()
                except:
                    pass
            raise
        finally:
            if conn:
                # Return to pool (close if marked bad)
                try:
                    cls._connection_pool.putconn(conn, close=should_close)
                except:
                    pass


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


def update_extraction_status(conn, rid, status, error_message=None, extracted_data=None, user_id=None, country_code=None, state_code=None):
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
            query = f"UPDATE {schema}.data_mapper_forms SET status_rid = %s, error_message = %s WHERE rid = %s"
            params = [status_rid, error_message, rid]
            cur.execute(query, tuple(params))

            # 3. If we have extracted data, insert mappings
            if extracted_data:
                # delete existing mappings for this form
                cur.execute(f"DELETE FROM {schema}.data_mapper_form_mappings WHERE form_rid = %s", (rid,))
                cur.execute(f"DELETE FROM {schema}.data_mapper_table_mappings WHERE form_rid = %s", (rid,))

                # Parse extracted_data if it's a string
                data_obj = extracted_data
                if isinstance(data_obj, str):
                    try:
                        data_obj = json.loads(data_obj)
                    except:
                        pass
                
                field_insert_sql = f"""
                                INSERT INTO {schema}.data_mapper_form_mappings 
                            (form_rid, field_label, created_by, field_type, column_id, extraction_order, field_id, status)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            """
                
                # insert labels
                if isinstance(data_obj, dict):
                    processed_labels = set()
                    form_type = ""
                    extraction_order = 0

                    pdf_form_fields = data_obj.get("pdf_form_fields", [])
                    if pdf_form_fields and isinstance(pdf_form_fields, list):
                        if len(pdf_form_fields) > 1:
                            form_type = "fillable"
                        else:
                            form_type = "non-fillable"
                    else:
                        form_type = "non-fillable"

                    form_type_query = f"UPDATE {schema}.data_mapper_forms SET form_type = %s,field_array = %s, extracted_data = %s WHERE rid = %s"
                    form_type_params = [form_type, json.dumps(pdf_form_fields), json.dumps(extracted_data), rid]

                    cur.execute(form_type_query, tuple(form_type_params))

                    def insert_safe_label(label, f_type, field_id=None):
                        nonlocal extraction_order
                        if label and label not in processed_labels:
                            extraction_order += 1
                            if not field_id:
                                if form_type == "non-fillable" and country_code:
                                    if state_code:
                                        field_id = f"{country_code}-{state_code}-F{extraction_order:04d}"
                                    else:
                                        field_id = f"{country_code}-F{extraction_order:04d}"

                            cur.execute(field_insert_sql, (rid, label, user_id, f_type, None, extraction_order, field_id, MAPPING_STATUS.ANOMALY))
                            processed_labels.add(label)

                    header_fields = data_obj.get("header_fields", [])
                    if header_fields and isinstance(header_fields, list):
                        for header_field in header_fields:
                            f_label = header_field.get("label", "")
                            field_id = header_field.get("value_field_id", "")
                            insert_safe_label(f_label, LINE_ITEM, field_id)

                    sections = data_obj.get("sections", [])
                    if sections and isinstance(sections, list):
                        for section in sections:
                            #insert line items
                            line_items = section.get("line_items", [])
                            if line_items and isinstance(line_items, list):
                                for line_item in line_items:
                                    line_item_id = line_item.get("id", "")
                                    f_label = f"{line_item_id} - {line_item.get('label', '')}" if line_item_id else line_item.get('label', '')
                                    field_id = line_item.get("value_field_id", "")
                                    insert_safe_label(f_label, LINE_ITEM, field_id)
                            
                            #insert tables
                            tables = section.get("tables", [])
                            if tables and isinstance(tables, list):
                                for table in tables:
                                    is_mislabeled, analysis = detect_mislabeled_table(table)

                                    rows = table.get("rows")
                                    if rows and isinstance(rows, list) and len(rows) == 1:
                                        is_mislabeled = True

                                    # if not mislabeled, insert as table
                                    if not is_mislabeled:

                                        column_headers = table.get("column_headers")
                                        if column_headers and isinstance(column_headers, list):
                                            first_row_field_id_map = {}
                                            rows = table.get("rows")    
                                            if rows and isinstance(rows, list):
                                                first_row = rows[0]
                                                if first_row and isinstance(first_row, dict):
                                                    cells = first_row.get("cells")
                                                    if cells and isinstance(cells, list):
                                                        for idx, cell in enumerate(cells):
                                                            value_field_id = cell.get("value_field_id", "")
                                                            header = cell.get("header", "").replace(" ", "").lower()
                                                            if header:
                                                                first_row_field_id_map[header] = value_field_id
                                            for idx, header in enumerate(column_headers):
                                                header_key = header.replace(" ", "").lower()
                                                field_id = first_row_field_id_map.get(header_key, "")
                                                insert_safe_label(header, TABLE_ITEM, field_id)

                                        rows = table.get("rows")    
                                        if rows and isinstance(rows, list):
                                            for row_idx, row in enumerate(rows, 1):
                                                if row and isinstance(row, dict):
                                                    row_id = row.get("row_id")
                                                    if isinstance(row_id, str) and any(word in row_id.lower() for word in ("total", "sum")):
                                                        cells = row.get("cells")
                                                        if cells and isinstance(cells, list):
                                                            for cell in cells:
                                                                header = cell.get("header")
                                                                field_id = cell.get("value_field_id", "")
                                                                f_label = row_id + " -> " + header
                                                                insert_safe_label(f_label, LINE_ITEM, field_id)

                                    # if mislabeled, insert second cell as line-item for each row
                                    else:
                                        rows = table.get("rows")
                                        if rows and isinstance(rows, list):
                                            for row in rows:
                                                cells = row.get("cells")
                                                if cells and isinstance(cells, list):
                                                    for cell in cells:
                                                        if isinstance(cell, dict):

                                                            f_label = cell.get("value") or cell.get("header")
                                                            field_id = cell.get("value_field_id", "")

                                                            is_split, f_label = split_by_keywords(f_label)

                                                            if is_split:
                                                                for label in f_label:
                                                                    insert_safe_label(label, LINE_ITEM, field_id)
                                                            else:
                                                                insert_safe_label(f_label, LINE_ITEM, field_id)


                        
        conn.commit()
        print(f"Updated record {rid} to {status}")

    except Exception as e:
        print(f"Error updating status for {rid}: {e}")
        conn.rollback()
