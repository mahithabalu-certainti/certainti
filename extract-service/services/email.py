import base64
import os
import logging
import requests
from azure.identity import ClientSecretCredential
import mimetypes
from config import settings

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Initialize Microsoft Graph client
def get_graph_access_token():
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

# Download blob and prepare attachment
def get_blob_attachment(blob_url: str, filename: str):
    response = requests.get(blob_url)
    response.raise_for_status()
    base64_content = base64.b64encode(response.content).decode("utf-8")

    attachment = {
        "@odata.type": "#microsoft.graph.fileAttachment",
        "name": filename,
        "contentType": "application/octet-stream",
        "contentBytes": base64_content
    }
    return attachment

def get_attachment_from_file(file_path: str, filename: str = None):
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    with open(file_path, "rb") as f:
        file_content = f.read()
        base64_content = base64.b64encode(file_content).decode("utf-8")

    content_type, _ = mimetypes.guess_type(file_path)
    content_type = content_type or "application/octet-stream"

    return {
        "@odata.type": "#microsoft.graph.fileAttachment",
        "name": filename or os.path.basename(file_path),
        "contentType": content_type,
        "contentBytes": base64_content
    }

def send_email_with_attachment(to_email, subject, body, file_path, blob_filename):
    access_token = get_graph_access_token()
    from_email = settings.EMAIL_FROM

    attachment = get_attachment_from_file(file_path, blob_filename)

    email_message = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "HTML",
                "content": body
            },
            "toRecipients": [
                {
                    "emailAddress": {
                        "address": to_email
                    }
                }
            ],
            "attachments": [attachment]
        },
        "saveToSentItems": True
    }

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    url = f"https://graph.microsoft.com/v1.0/users/{from_email}/sendMail"

    try:
        response = requests.post(url, headers=headers, json=email_message)
        response.raise_for_status()
        logger.info("✅ Email sent successfully.")
        return response.json() if response.content else {"status": "sent"}
    except Exception as e:
        logger.error(f"❌ Email sending failed: {e}", exc_info=True)
        raise