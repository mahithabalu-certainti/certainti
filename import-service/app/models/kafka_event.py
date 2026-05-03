from pydantic import BaseModel

class KafkaEventCreate(BaseModel):
    related_to: str
    related_to_rid: str
    document_rid: str
    document_name: str
    document_upload_rid: str
    status: str
    source_name: str
    topic_name: str
    producer_id: str
    created_by: str