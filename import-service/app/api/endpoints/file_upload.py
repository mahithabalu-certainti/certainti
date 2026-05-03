from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status
from app.services.blob_service import AzureBlobService
from app.models import FileUploadRequest, ProcessFileRequest, DocumentCreate, ImportCreate
from app.utils.validators import validate_file
from app.utils.id_generator import generate_prefixed_id
from app.core.config import settings
from app.core.constants import Constants
from app.utils.formatters import format_file_size, generate_blob_path
from .file_processing import handle_file_processing
import logging
from datetime import datetime

router = APIRouter()
blob_service = AzureBlobService()
logger = logging.getLogger(__name__)

@router.post("/upload-csv", status_code=status.HTTP_201_CREATED)
async def upload_csv(
    file: UploadFile = File(...),
    entity_type: str = Form(...),
    account_rid: str = Form(...),
    account_r_number: str = Form(...),
    fiscal_year: int = Form(...),
    related_to: str = Form(...),
    related_to_rid: str = Form(...),
    uploaded_by_user_rid: str = Form(...)
):
    try:
        # Validate form data
        request = FileUploadRequest(
            entity_type=entity_type,
            account_rid=account_rid,
            account_r_number=account_r_number,
            fiscal_year=fiscal_year,
            related_to=related_to,
            related_to_rid=related_to_rid
        )


        # Read and validate file
        await file.seek(0)
        entity_type = entity_type.lower().replace(" ", "_")
        file_data = await file.read()

        # Fiscal year validation for specific entity types
        if entity_type in ["project", "resource_cost", "project_resource", "project_task"]:
            try:
                current_year = datetime.now().year

                if fiscal_year < 1950 or fiscal_year > current_year:
                    logger.error(f"Fiscal year must be between 1950 and {current_year}: {fiscal_year}")
                    raise ValueError(f"Fiscal year must be between 1950 and {current_year}.")

            except Exception as e:
                logger.error(f"Invalid fiscal year: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": "InvalidFiscalYear",
                        "message": str(e)
                    }
                )

        # Validate file
        logger.debug(f"Calling validate_file with filename: {file.filename}, data length: {len(file_data)}")
        try:
            is_valid = validate_file(file_data, file.filename)
            logger.debug(f"validate_file returned: {is_valid}")
        except ValueError as ve:
            logger.warning(f"File validation failed: {str(ve)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "FileValidationError", "message": str(ve)}
            )
        except Exception as e:
            logger.error(f"Unexpected error in file validation: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"error": "UnexpectedError", "message": str(e)}
            )

        # Generate blob path and upload file
        blob_path = generate_blob_path(entity_type, is_valid, file.filename)
        try:
            # Reset file pointer for upload
            await file.seek(0)
            blob_url = await blob_service.upload_csv(
                container_name=account_r_number.strip().lower().replace(" ", ""),
                file=file,
                blob_path=blob_path
            )
            if not isinstance(blob_url, str):
                logger.error(f"Invalid blob_url type: {type(blob_url)}")
                raise ValueError("Blob service returned invalid URL")
        except Exception as blob_error:
            logger.error(f"Blob upload failed: {str(blob_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"error": "BlobUploadError", "message": str(blob_error)}
            )
        finally:
            await file.close()

        # Set document status
        doc_status = Constants.Status.PROCESSING if is_valid else Constants.Status.FAILURE
        failure_reason = "" if is_valid else Constants.Status.FAILURE_REASON
        file_type = file.filename.lower().rsplit('.', 1)[1]
        logger.info(f"fileType===============> {file_type}")
        if file_type == 'xlsx' :
            file_format = Constants.Metadata.XLSX_FORMAT
        else :
            file_format = Constants.Metadata.CSV_FORMAT
        # Create document data
        try:
            doc_data = DocumentCreate(
                account_rid=account_rid,
                related_to=related_to,
                related_to_rid=related_to_rid,
                document_source=Constants.Metadata.SOURCE_NAME,
                document_type=entity_type,
                document_format=file_format,
                document_url=blob_url,
                document_size=format_file_size(len(file_data)),
                document_status=doc_status,
                created_by=uploaded_by_user_rid,
                modified_by=uploaded_by_user_rid,
                failure_reason=failure_reason
            )
        except Exception as ve:
            logger.error(f"Pydantic validation error: {str(ve)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "ValidationError", "message": str(ve)}
            )

        # Create import data
        import_data = ImportCreate(
            account_rid=account_rid,
            uploaded_by_user_rid=uploaded_by_user_rid,
            document_name=file.filename,
            related_to=related_to,
            related_to_rid=related_to_rid,
            entity_type=entity_type,
            upload_status=doc_status,
            upload_failure_reason=failure_reason,
            fiscal_year=fiscal_year,
            created_by=uploaded_by_user_rid,
        )

        # Process file
        process_request = ProcessFileRequest(
            document=doc_data,
            **{"import": import_data} 
        )
        return handle_file_processing(process_request)

    except HTTPException:
        raise
    finally:
        await file.close()