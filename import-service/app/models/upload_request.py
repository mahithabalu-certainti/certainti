from pydantic import BaseModel, constr
from typing import Optional
import uuid

class FileUploadRequest(BaseModel):
    entity_type: str
    account_rid: str
    account_r_number: str
    fiscal_year: int
    related_to: Optional[str] = None
    related_to_rid: Optional[str] = None
    uploaded_by_user_rid: Optional[str] = None
