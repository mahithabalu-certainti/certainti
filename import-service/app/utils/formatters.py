# app/utils/formatters.py
from datetime import datetime
from app.core.constants import Constants
import logging
logger = logging.getLogger(__name__)

def generate_blob_path(entity_type: str, is_valid: bool, file_name: str) -> str:
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    base_name = file_name.lower().rsplit('.', 1)[0]
    file_type = file_name.lower().rsplit('.', 1)[1]
    logger.info(f"fileType===============> {file_type}")
    if file_type == 'xlsx' :
        file_format = Constants.Metadata.XLSX_FORMAT
    else :
        file_format = Constants.Metadata.CSV_FORMAT
    base_path = f"{entity_type}/{base_name}_{Constants.Metadata.WEB}_{timestamp}.{file_format}" if is_valid else f"{entity_type}/error/{base_name}_{Constants.Metadata.WEB}_{timestamp}.{file_type}"
    return base_path


def format_file_size(size_in_bytes: int) -> str:
    for unit in ['Bytes', 'KB', 'MB', 'GB', 'TB']:
        if size_in_bytes < 1024.0:
            return f"{size_in_bytes:.2f} {unit}"
        size_in_bytes /= 1024.0
    return f"{size_in_bytes:.2f} PB"