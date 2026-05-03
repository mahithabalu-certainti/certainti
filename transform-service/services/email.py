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

from config import settings
from database.db_handler import DatabaseHandler
import time
import json
import requests

MAX_RETRIES = 5
RETRY_DELAY_BASE = 2  # seconds


# -------------------------------------------------------------------
# Logging Configuration
# -------------------------------------------------------------------
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class EmailService:
    def __init__(self):
        self.db_handler = DatabaseHandler()

    # Initialize Microsoft Graph client
    def get_graph_access_token(self):
        tenant_id = settings.TENANT_ID
        client_id = settings.CLIENT_ID
        client_secret = settings.CLIENT_SECRET

        credential = ClientSecretCredential(
            tenant_id=tenant_id,
            client_id=client_id,
            client_secret=client_secret
        )

        token = credential.get_token("https://graph.microsoft.com/.default")
        return token.token

    def send_email_with_attachment(self, to_email, subject, body, attachment_path, document_id, modified_by, account_r_number):
        access_token = self.get_graph_access_token()
        from_email = settings.EMAIL_FROM

        logger.info(f"From: {from_email}")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body: {body}")

        attachment = self.get_attachment_from_file(attachment_path)
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

        url = f"https://graph.microsoft.com/v1.0/users/{from_email}/sendMail"
        logger.info(f"Payload: {json.dumps(email_message, indent=2)}")

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                # Check if email already sent
                already_sent = self.db_handler.get_import_email_status(document_id, account_r_number)

                if already_sent:
                    logger.info(f"⚠️ Email already sent for document_id: {document_id}. Skipping send.")
                    return

                response = requests.post(url, headers=headers, json=email_message, timeout=30)
                response.raise_for_status()

                logger.info("✅ Email sent successfully.")
                self.db_handler.update_import_email_status(
                        modified_by,
                        document_id,
                        account_r_number,
                        status="sent"
                    )
                return response.json() if response.content else {"status": "sent"}

            except Exception as e:
                logger.warning(
                    f"⚠️ Attempt {attempt}/{MAX_RETRIES} failed due to: {str(e)}"
                )
                if attempt < MAX_RETRIES:
                    sleep_time = RETRY_DELAY_BASE ** attempt
                    logger.info(f"⏳ Retrying in {sleep_time} seconds...")
                    time.sleep(sleep_time)
                else:
                    logger.error("❌ All retry attempts failed. Email not sent.", exc_info=True)
                    raise

    def get_attachment_from_file(self, file_path: str):
        """
        Prepare attachment payload from file
        """
        if not os.path.isfile(file_path):
            raise FileNotFoundError(f"Attachment file not found: {file_path}")
        
        # Get file info
        file_name = os.path.basename(file_path)
        content_type, _ = mimetypes.guess_type(file_path)
        content_type = content_type or "application/octet-stream"

        # Read and encode file content
        with open(file_path, "rb") as f:
            file_content = f.read()
            base64_content = base64.b64encode(file_content).decode("utf-8")

        return {
            "@odata.type": "#microsoft.graph.fileAttachment",
            "name": file_name,
            "contentType": content_type,
            "contentBytes": base64_content
        }
