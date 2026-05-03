from pydantic import BaseModel
from typing import Optional

class DocumentCreate(BaseModel):
    account_rid: str
    related_to: str
    related_to_rid: str
    document_source: str
    document_type: str
    document_format: str
    document_url: str
    document_size: str
    document_status: str
    failure_reason: Optional[str] = None
    created_by: str
    modified_by: str