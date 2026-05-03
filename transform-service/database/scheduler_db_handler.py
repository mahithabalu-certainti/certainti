import logging
from database.db_handler import DBPool
from config import config
from psycopg2 import sql

logger = logging.getLogger(__name__)


class SchedulerDatabaseHandler:
    """
    Scheduler-only DB operations
    """

    ADVISORY_LOCK_ID = 987654321

    def _get_tenant_schemas(self, cur):
        """
        Fetch all tenant schemas that contain import_table
        """
        cur.execute("""
            SELECT schema_name
            FROM information_schema.schemata
            WHERE schema_name LIKE 'trd365\\_%'
            ESCAPE '\\'
        """)

        return [row[0] for row in cur.fetchall()]

    def mark_stuck_imports_failed(self):
        logger.warning("WATCHDOG EXECUTION STARTED")

        try:
            with DBPool.get_connection() as conn:
                with conn.cursor() as cur:

                    schemas = self._get_tenant_schemas(cur)
                    logger.warning(f"📦 Schemas found: {schemas}")

                    if not schemas:
                        logger.warning("⚠️ No tenant schemas found")
                        return

                    total_affected = 0

                    for schema in schemas:
                        try:
                            logger.warning(f"🔍 Processing schema: {schema}")

                            import_table = sql.Identifier(schema, config.IMPORT_TABLE)
                            document_table = sql.Identifier(schema, config.DOCUMENT_TABLE)
                            logger.info(f"Document table: {document_table}")
                            logger.info(f"Import table: {import_table}")

                            # Check import table existence safely
                            cur.execute(
                                "SELECT to_regclass(%s);",
                                (f"{schema}.{config.IMPORT_TABLE}",)
                            )
                            exists = cur.fetchone()[0]

                            if not exists:
                                logger.warning(f"❌ Import table missing in {schema}")
                                continue

                            logger.warning(f"✅ Import table exists in {schema}")

                            # ---- PRODUCTION SAFE ATOMIC UPDATE ----
                            query = sql.SQL("""
                                WITH timed_out_imports AS (
                                    UPDATE {import_tbl} i
                                    SET upload_status = %s,
                                        upload_failure_reason = %s,
                                        modified_datetime = NOW()
                                    WHERE i.upload_status = %s
                                    AND i.uploaded_datetime IS NOT NULL
                                    AND i.uploaded_datetime < (NOW() - INTERVAL '30 minutes')
                                    RETURNING i.document_rid
                                )
                                UPDATE {document_tbl} d
                                SET document_status = %s,
                                    modified_datetime = NOW()
                                WHERE d.rid IN (
                                    SELECT document_rid FROM timed_out_imports
                                );
                            """).format(
                                import_tbl=import_table,
                                document_tbl=document_table
                            )

                            logger.warning("🧾 Executing timeout update query")

                            cur.execute(query, (
                                config.STATUS_MESG_FAILED,
                                "Processing timeout exceeded (30 mins)",
                                config.PROCESS_MESSAGE,
                                config.STATUS_MESG_FAILED
                            ))

                            affected = cur.rowcount
                            total_affected += affected

                            logger.warning(
                                f"🛠 Rows updated in {schema}: {affected}"
                            )

                            conn.commit()

                        except Exception:
                            conn.rollback()
                            logger.error(
                                f"❌ Failed processing schema {schema}",
                                exc_info=True
                            )

                    logger.warning(
                        f"✅ Watchdog completed. Total rows updated: {total_affected}"
                    )

        except Exception:
            logger.error("❌ Import timeout watchdog crashed", exc_info=True)

        finally:
            logger.warning("WATCHDOG EXECUTION FINISHED")

