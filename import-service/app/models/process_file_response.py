from pydantic import BaseModel
from typing import Optional
from app.models.process_file_data import ProcessFileData


class ProcessFileResponse(BaseModel):
    statusCode: int
    status: str
    message: Optional[str] = None
    data: Optional[ProcessFileData] = None