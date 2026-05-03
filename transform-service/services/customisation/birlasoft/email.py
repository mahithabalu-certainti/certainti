import os
import json
import base64
import logging
import mimetypes
import shutil
from datetime import datetime
from typing import Any, Dict
from email_template import get_import_completion_email_html
from database.db_handler import DatabaseHandler
import requests
from azure.identity import ClientSecretCredential
from services.customisation.birlasoft.db_handler import Birlasoft_DBHandler
import time
import requests


from config import settings


# -------------------------------------------------------------------
# Logging Configuration
# -------------------------------------------------------------------
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# -------------------------------------------------------------------
# Constants
# -------------------------------------------------------------------
GRAPH_API_SCOPE = "https://graph.microsoft.com/.default"
GRAPH_API_BASE_URL = "https://graph.microsoft.com/v1.0"
MAX_RETRIES = 5
RETRY_DELAY = 2  # seconds


class EmailNotificationService:
    """Service class for sending email notifications with attachments."""

    def __init__(self) -> None:
        self.tenant_id = settings.TENANT_ID
        self.client_id = settings.CLIENT_ID
        self.client_secret = settings.CLIENT_SECRET
        self.from_email = settings.EMAIL_FROM
        self.db_handler = DatabaseHandler()  # should be set externally if DB is used
        self.birlasoft_db_handler = Birlasoft_DBHandler()

    # -------------------------------------------------------------------
    # Microsoft Graph Authentication
    # -------------------------------------------------------------------
    def _get_graph_access_token(self) -> str:
        credential = ClientSecretCredential(
            tenant_id=self.tenant_id,
            client_id=self.client_id,
            client_secret=self.client_secret,
        )
        token = credential.get_token(GRAPH_API_SCOPE)
        return token.token

    # -------------------------------------------------------------------
    # Email Sending
    # -------------------------------------------------------------------
    def send_email_with_attachment(
        self, to_email: str, subject: str, body: str, attachment_path: str
    ) -> Dict[str, Any]:
        """Send an email with attachment using Microsoft Graph API, with retry logic."""

        access_token = self._get_graph_access_token()
        attachment = self._get_attachment_from_file(attachment_path)

        email_message = {
            "message": {
                "subject": subject,
                "body": {"contentType": "HTML", "content": body},
                "toRecipients": [{"emailAddress": {"address": to_email}}],
                "attachments": [attachment],
            },
            "saveToSentItems": True,
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        url = f"{GRAPH_API_BASE_URL}/users/{self.from_email}/sendMail"

        # Retry logic
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = requests.post(url, headers=headers, json=email_message)
                response.raise_for_status()
                logger.info(f"✅ Email sent successfully to {to_email}")
                return response.json() if response.content else {"status": "sent"}

            except Exception as e:
                logger.error(f"❌ Attempt {attempt} failed: {e}", exc_info=True)

                if attempt < MAX_RETRIES:
                    logger.info(f"🔁 Retrying in {RETRY_DELAY} seconds... (Attempt {attempt + 1}/{MAX_RETRIES})")
                    time.sleep(RETRY_DELAY)
                else:
                    logger.error("🚫 All retry attempts failed. Email not sent.")
                    raise

    def _get_attachment_from_file(self, file_path: str) -> Dict[str, Any]:
        """Prepare attachment payload from a file."""

        if not os.path.isfile(file_path):
            raise FileNotFoundError(f"Attachment file not found: {file_path}")

        file_name = os.path.basename(file_path)
        content_type, _ = mimetypes.guess_type(file_path)
        content_type = content_type or "application/octet-stream"

        with open(file_path, "rb") as f:
            file_content = f.read()
            base64_content = base64.b64encode(file_content).decode("utf-8")

        return {
            "@odata.type": "#microsoft.graph.fileAttachment",
            "name": file_name,
            "contentType": content_type,
            "contentBytes": base64_content,
        }

    # -------------------------------------------------------------------
    # Staging Data Processing Workflow
    # -------------------------------------------------------------------p
    def process_staging_data_email(
        self,
        document_id: str,
        entity_type: str,
        account_r_number: str,
        account_rid: str,
        fiscal_year: int,
        modified_by: str,
        user_details: list,
        load_error_record_count: int,
    ) -> None:
        """Main function to process staging data and send email."""

        staging_data = None
        output_dir = None

        try:
            staging_data = self._get_and_cache_staging_data(
                document_id, entity_type, account_r_number
            )
            event = self._create_email_event(
                document_id=document_id,
                account_rid=account_rid,
                entity_type=entity_type,
                account_r_number=account_r_number,
                load_error_record_count=load_error_record_count,
                fiscal_year=fiscal_year,
                modified_by=modified_by
            )

            output_dir, file_name = self._setup_output_paths(entity_type, document_id)

            if not staging_data.rdd.isEmpty():
                self._export_data_to_csv(staging_data, output_dir)
                self._send_email_with_attachment(output_dir, file_name, event, user_details)

            self._archive_staging_data(entity_type, document_id, account_r_number)
            logger.info(f"✅ Successfully processed {entity_type} document {document_id}")

        except Exception as e:
            logger.error(f"❌ Error processing staging data email: {e}", exc_info=True)
            raise
        finally:
            self._cleanup_resources(staging_data, output_dir)

    def _cleanup_resources(self, staging_data, output_dir: str) -> None:
        """Clean up temporary resources including data and directories."""
        try:
            if staging_data is not None:
                staging_data.unpersist()
                logger.debug("Unpersisted staging data")

            if output_dir and os.path.exists(output_dir):
                shutil.rmtree(output_dir)
                logger.info(f"✅ Deleted temporary directory: {output_dir}")
        except Exception as e:
            logger.error(f"❌ Error during cleanup: {str(e)}", exc_info=True)
            if staging_data is not None:
                staging_data.unpersist()

    def _get_and_cache_staging_data(self, document_id, entity_type, account_r_number) -> Any:
        """Retrieve and cache staging data."""
        return self.birlasoft_db_handler.get_staging_records_for_email(
            document_id, entity_type, account_r_number
        )

    def _setup_output_paths(self, entity_type: str, document_id: str) -> tuple[str, str]:
        """Set up output directory and file names."""
        output_dir = f"/tmp/{entity_type}_{document_id}"
        file_name = f"{entity_type}-{document_id}.csv"
        return output_dir, file_name

    def _export_data_to_csv(self, staging_data, output_dir: str) -> None:
        """Export data to CSV file."""
        logger.info("Dropping unnecessary columns...")
        staging_data = staging_data.drop(
            "account_rid", "document_rid", "fiscal_year", "created_at", "modified_at"
        )

        (
            staging_data.coalesce(1)
            .write.option("header", "true")
            .option("delimiter", ",")
            .mode("overwrite")
            .csv(output_dir)
        )
        logger.info(f"CSV files written to: {output_dir}")

    def _send_email_with_attachment(
        self, output_dir: str, file_name: str, event: Dict[str, Any], user_details: list
    ) -> None:
        """Send email with CSV attachment."""

        if not os.path.exists(output_dir):
            logger.warning(f"⚠️ Output directory {output_dir} doesn't exist")
            return

        csv_files = [
            f for f in os.listdir(output_dir) if f.startswith("part-") and f.endswith(".csv")
        ]
        if not csv_files:
            logger.warning(f"⚠️ No CSV files found in {output_dir}")
            return

        original_path = os.path.join(output_dir, csv_files[0])
        final_path = os.path.join(output_dir, file_name)
        shutil.move(original_path, final_path)

        # Placeholder for your template renderer
        html_content = get_import_completion_email_html(event)

        self.send_email_with_attachment(user_details[0], event["subject"], html_content, final_path)

    def _archive_staging_data(self, entity_type, document_id, account_r_number) -> None:
        """Archive staging data after processing."""
        self.birlasoft_db_handler.archive_and_flush_staging_data(
            entity_type, document_id, account_r_number
        )

    def _create_email_event(
        self,
        document_id: str,
        account_rid: str,
        entity_type: str,
        account_r_number: str,
        load_error_record_count: int,
        fiscal_year: int,
        modified_by: str,
    ) -> Dict[str, Any]:
        """Create email event with details for import completion notification."""

        import_stats = self.db_handler.get_import_statistics(document_id, account_r_number)
        user_details = self.db_handler.get_user_details(modified_by)
        account_name = self.db_handler.get_account_name(account_rid)
        error_summary, _ = self.birlasoft_db_handler.get_staging_records_with_errors_and_warnings(
            document_id, entity_type, account_r_number
        )

        file_name = import_stats.get("document_name", "Unknown")
        subject = (
            f"Data Import Status Notification - {file_name} for Account - {account_name}, "
            f"Fiscal Year - FY{fiscal_year} and Entity - {entity_type}"
        )

        return {
            "user_name": user_details[1] if user_details else "User",
            "file_name": file_name,
            "fiscal_year": fiscal_year,
            "account_name": account_name,
            "entity": entity_type,
            "subject": subject,
            "status": import_stats.get("upload_status", "Unknown"),
            "status_desc": None,
            "total_records": int(import_stats.get("total_records", 0)),
            "staging_status": import_stats.get("staging_status", "Unknown"),
            "staging_description": None,
            "staging_status_desc": import_stats.get("staging_status_description", "None"),
            "entity_load_status": import_stats.get("target_load_status", "Unknown"),
            "records_success": int(import_stats.get("records_success", 0)),
            "records_warning": int(import_stats.get("total_staging_warning_count", 0)),
            "entity_load_error_records_count": load_error_record_count,
            "records_failed": int(import_stats.get("target_load_error_records_count") or 0)
            + (
                int(import_stats.get("total_records") or 0)
                - int(import_stats.get("total_staging_processed") or 0)
            ),
            "error_descriptions": error_summary,
            "imported_by": user_details[1] if user_details else import_stats.get("modified_by", "System"),
            "imported_on": import_stats.get("uploaded_datetime", datetime.utcnow()).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
            "time_taken": f"{import_stats.get('total_time_sec', 0):.2f}",
            "import_type": "Manual Upload",
            "document_rid": document_id,
        }
