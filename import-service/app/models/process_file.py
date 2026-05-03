from pydantic import BaseModel, Field
from app.models.document import DocumentCreate
from app.models.import_model import ImportCreate

class ProcessFileRequest(BaseModel):
    document: DocumentCreate
    import_: ImportCreate = Field(..., alias="import")

    class Config:
        populate_by_name = True  # Allow instantiation using the alias