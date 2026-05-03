from fastapi import HTTPException
from ..models import FileUploadRequest
import io
import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(), logging.FileHandler('app.log')]
)
logger = logging.getLogger(__name__)

def validate_file(file_data: bytes, filename: str) -> bool:
    allowed_extensions = ('.csv', '.xls', '.xlsx')
    if " " in filename:
        logger.warning(f"Filename contains spaces: '{filename}'")
        raise ValueError("Filename must not contain spaces")
    if not filename.lower().endswith(allowed_extensions):
        logger.warning(f"Invalid file extension for {filename}")
        raise ValueError("File must have a .csv or .xlsx extension")
    return True