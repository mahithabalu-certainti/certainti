from pydantic import BaseModel
from typing import Optional


class ProcessFileData(BaseModel):
    document_id: str
    upload_id: str