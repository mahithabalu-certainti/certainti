# app/services/azure_blob.py

from fastapi import UploadFile
from azure.storage.blob import BlobServiceClient
import os
import base64
import logging
from dotenv import load_dotenv
from app.core.config import settings
from azure.identity import DefaultAzureCredential, AzureCliCredential
from azure.keyvault.secrets import SecretClient

load_dotenv()
logger = logging.getLogger(__name__)


class AzureBlobService:
    def __init__(self):
        self.credential = DefaultAzureCredential()
        logger.info("Authenticated using DefaultAzureCredential")
        self.client = SecretClient(
            vault_url=os.getenv("KEY_VAULT_URI"),
            credential=self.credential
        )
        self.conn_string = self.client.get_secret(os.getenv("AZURE_STORAGE_CONNECTION_STRING")).value
        self.service = BlobServiceClient.from_connection_string(self.conn_string)

    async def upload_csv(self, container_name: str, file: UploadFile, blob_path: str):
        """
        Upload a CSV file to Azure Blob Storage in chunks using block blob upload.
        
        Args:
            container_name (str): Name of the Azure blob container.
            file (UploadFile): File to be uploaded.
            blob_path (str): Path where the blob should be stored.
            chunk_size (int): Size of each upload chunk (default: 4MB).
        
        Returns:
            str: URL of the uploaded blob.
        """
        try:
            container_client = self.service.get_container_client(container_name)

            if not container_client.exists():
                container_client.create_container()

            blob_client = container_client.get_blob_client(blob_path)

            block_list = []
            chunk_number = 1

            # Make sure the file pointer is at the beginning
            await file.seek(0)

            while True:
                chunk = await file.read(settings.CHUNK_SIZE)
                if not chunk:
                    break

                logger.info(f"Uploading chunk #{chunk_number}, size: {len(chunk)} bytes")

                # Generate Azure-compliant base64 block ID
                block_id = base64.b64encode(f"block-{chunk_number:07d}".encode()).decode()

                blob_client.stage_block(
                    block_id=block_id,
                    data=chunk,
                    length=len(chunk)
                )
                block_list.append(block_id)
                chunk_number += 1

            if not block_list:
                logger.warning("No blocks staged. Upload skipped.")
                return None

            # Commit the block list
            blob_client.commit_block_list(block_list)

            # Optional: Verify upload
            props = blob_client.get_blob_properties()
            logger.info(f"Upload successful: {props.size} bytes stored at {blob_client.url}")

            return blob_client.url

        except Exception as e:
            logger.error(f"Chunked upload failed: {str(e)}", exc_info=True)

            if 'blob_client' in locals():
                try:
                    blob_client.delete_blob()
                except Exception as cleanup_error:
                    logger.error(f"Cleanup failed: {cleanup_error}")

            raise
