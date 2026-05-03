from azure.storage.blob import BlobServiceClient, BlobClient
import os
import base64
from datetime import datetime
from logger.logger import logger
from urllib.parse import urlparse
from config import config,settings

LOCAL_TMP_FOLDER = "tmp"

def download_blob_from_url(blob_url):
    try:
        logger.info(f"entering into blob storage")
        parsed_url = urlparse(blob_url)
        path_parts = parsed_url.path.lstrip("/").split("/", 1)
        path_parts = parsed_url.path.lstrip("/").split("/", 1)
        logger.info(f"pathparts : {path_parts}")
        if len(path_parts) < 2:  # Ensure the URL contains both container and blob name
            raise ValueError(f"Invalid blob URL format: {blob_url}")

        container_name = path_parts[0]
        blob_name = path_parts[1]
        logger.info(f"blob_name : {blob_name}")
        if not os.path.exists(LOCAL_TMP_FOLDER):
            os.makedirs(LOCAL_TMP_FOLDER)

        local_file_path = os.path.join(LOCAL_TMP_FOLDER, os.path.basename(blob_name))

        blob_service_client = BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING)
        blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)

        with open(local_file_path, "wb") as file:
            download_stream = blob_client.download_blob()
            file.write(download_stream.readall())

        print(f"✅ Blob downloaded to: {local_file_path}")
        return local_file_path

    except Exception as e:
        print(f"❌ Error downloading blob: {e}")
        raise

def generate_blob_path(entity_type: str, file_name: str) -> str:
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    base_name = file_name.lower().rsplit('.', 1)[0]
    base_path = f"{entity_type}/error/{base_name}_{config.WEB}_{timestamp}.{config.CSV_FORMAT}"
    return base_path


def upload_csv(container_name: str, file_path: str, blob_path: str):
    """
    Upload a CSV file to Azure Blob Storage in chunks using block blob upload.

    Args:
        container_name (str): Name of the Azure blob container.
        file_path (str): Local path of the file to upload.
        blob_path (str): Path where the blob should be stored in Azure Blob Storage.

    Returns:
        str: URL of the uploaded blob.
    """
    try:
        # Get Azure Storage connection string
        conn_string = settings.AZURE_STORAGE_CONNECTION_STRING
        if not conn_string:
            raise ValueError("Azure Storage connection string is not set in the environment variables.")

        # Initialize Blob Service Client
        blob_service_client = BlobServiceClient.from_connection_string(conn_string)

        # Ensure container exists or create it
        container_client = blob_service_client.get_container_client(container_name)
        if not container_client.exists():
            container_client.create_container()
            logger.info(f"✅ Created container: {container_name}")

        # Get Blob Client
        blob_client = container_client.get_blob_client(blob_path)

        logger.info(f"⚡ Starting upload of file: {file_path} to {blob_path}...")

        # Read and upload file in chunks
        with open(file_path, "rb") as file:
            block_list = []
            chunk_number = 1

            while True:
                chunk = file.read(config.CHUNK_SIZE)
                if not chunk:
                    break

                # Generate base64 block ID
                block_id = base64.b64encode(f"block-{chunk_number:07d}".encode()).decode()

                logger.info(f"Uploading chunk #{chunk_number}, size: {len(chunk)} bytes")

                # Stage the block
                blob_client.stage_block(block_id=block_id, data=chunk)
                block_list.append(block_id)
                chunk_number += 1

        # Commit blocks to finalize the upload
        if block_list:
            blob_client.commit_block_list(block_list)
            props = blob_client.get_blob_properties()
            logger.info(f"✅ Upload complete: {props.size} bytes stored at {blob_client.url}")
            return blob_client.url
        else:
            raise ValueError("No blocks were staged for upload.")

    except Exception as e:
        logger.error(f"❌ Upload failed for file: {file_path} - Error: {e}")

        # Attempt to clean up partial uploads
        if 'blob_client' in locals():
            try:
                blob_client.delete_blob()
                logger.info(f"🧹 Cleanup successful for blob path: {blob_path}")
            except Exception as cleanup_error:
                logger.error(f"❌ Cleanup failed: {cleanup_error}")

        raise
