from pydantic import BaseModel
from typing import Optional

class ImportCreate(BaseModel):
    account_rid: str
    uploaded_by_user_rid: str
    document_name: str
    related_to: str
    related_to_rid: str
    entity_type: str
    upload_status: str
    fiscal_year: int
    fiscal_year : Optional[str] = None
    upload_failure_reason: Optional[str] = None
    created_by: str