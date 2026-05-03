import base64
import requests
from msgraph import GraphServiceClient
from azure.identity import ClientSecretCredential
import os
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Initialize Microsoft Graph client
def get_graph_client():
    credential = ClientSecretCredential(
        tenant_id=settings.TENANT_ID,
        client_id=settings.CLIENT_ID,
        client_secret=settings.CLIENT_SECRET
    )

    client =  client = GraphServiceClient(credential)
    return client

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

# Send email
def send_email_with_attachment(
    to_email: str,
    subject: str,
    body: str,
    blob_url: str,
    blob_filename: str
):
    client = get_graph_client()
    from_email = settings.EMAIL_FROM

    attachment = get_blob_attachment(blob_url, blob_filename)

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

    try:
        response = client.post(
            f"/users/{from_email}/sendMail",
            json=email_message
        )
        logger.info("Email sent successfully")
        return response.json() if response.content else {"status": "sent"}
    except Exception as e:
        logger.error("Email sending failed", exc_info=True)
        raise