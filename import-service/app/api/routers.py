from fastapi import APIRouter
from app.api.endpoints import (
    file_upload,
    file_processing,
    system_health
)
from app.core.constants import Constants

router = APIRouter()

router.include_router(file_upload.router, tags=[Constants.RouterTags.FILE_UPLOAD])
router.include_router(file_processing.router, tags=[Constants.RouterTags.FILE_PROCESSING])
router.include_router(system_health.router, tags=[Constants.RouterTags.SYSTEM_HEALTH])