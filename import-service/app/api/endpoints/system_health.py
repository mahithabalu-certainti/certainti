from fastapi import APIRouter, HTTPException
from app.core.constants import Constants
from app.database.db_handler import get_connection
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get(Constants.API.HEALTH_ENDPOINT)
async def health_check():
    try:
        with get_connection() as cur:
            cur.execute(Constants.Database.HEALTH_CHECK_QUERY)
            return {
                "status": Constants.Status.HEALTHY,
                "database": Constants.Database.CONNECTED
            }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"status": Constants.Status.UNHEALTHY, "error": str(e)}
        )