from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database.db_handler import (
    get_connection,
    get_account_r_number,
    insert_document,
    insert_document_upload,
    insert_kafka_event,
    update_status,
    generate_uuid,
    get_account_country
)
from app.models import ProcessFileRequest, KafkaEventCreate
from app.services.kafka_producer import kafka_producer
from app.models import ProcessFileRequest, KafkaEventCreate,ProcessFileData,ProcessFileResponse
from app.core.constants import Constants
from app.utils.id_generator import generate_prefixed_id
from app.core.config import settings
from uuid import uuid4
import logging
from typing import Optional
from app.logger.logger import get_logger
from confluent_kafka.admin import AdminClient, NewTopic, KafkaException
import confluent_kafka 

router = APIRouter()
logger = get_logger("file_processing")


@router.post(Constants.API.PROCESS_FILE_ENDPOINT, response_model=ProcessFileResponse)
async def process_file(request: ProcessFileRequest):
    try:
        response = handle_file_processing(request)
        return response
    except Exception as e:
        error_msg = f"File processing failed: {type(e).__name__} - {str(e)}"
        logger.error(error_msg, exc_info=True)
        return ProcessFileResponse(
            statusCode=500,
            status="Error",
            message=error_msg,
            data=None
        )

def create_topic(broker, topic_name, num_partitions=3, replication_factor=1):
    admin_client = AdminClient({"bootstrap.servers": broker})

    new_topic = [NewTopic(topic_name, num_partitions=num_partitions, replication_factor=replication_factor)]

    # Trigger topic creation
    fs = admin_client.create_topics(new_topic)

    for topic, f in fs.items():
        try:
            f.result()  # The result() will raise exception if creation failed
            logger.info(f"✅ Topic '{topic}' created successfully")
        except confluent_kafka.KafkaException as e:
            if e.args[0].code() == confluent_kafka.KafkaError.TOPIC_ALREADY_EXISTS:
                logger.info(f"ℹ️ Topic '{topic}' already exists, skipping creation")
            else:
                logger.error(f"❌ Failed to create topic {topic}: {e}")

def handle_file_processing(request: ProcessFileRequest) -> ProcessFileResponse:
    account_rid = request.document.account_rid or request.import_.account_rid
    entity_type = request.import_.entity_type
    account_r_number = get_account_r_number(account_rid)
    logger.info(f" Account r number {account_r_number}")
    with get_connection() as cur:
        doc_id = str(insert_document(request.document, account_r_number))
        upload_id = str(insert_document_upload(doc_id, request.import_, account_r_number))
        if entity_type == "resource":
            topic_name = settings.KAFKA_TOPIC_RESOURCE
        elif entity_type == "resource_cost":
            topic_name = settings.KAFKA_TOPIC_RESOURCE_COST
        elif entity_type == "resource_skill":
            topic_name = settings.KAFKA_TOPIC_RESOURCE_SKILL
        elif entity_type == "project":
            topic_name = settings.KAFKA_TOPIC_PROJECT
        elif entity_type == "project_resource":
            topic_name = settings.KAFKA_TOPIC_PROJECT_RESOURCE
        else:
            topic_name = settings.KAFKA_TOPIC_PROJECT_TASK
        create_topic(settings.KAFKA_BROKER, topic_name)
        if request.document.document_status.lower() == Constants.Status.FAILED:
            logger.info(Constants.LogMessages.SKIPPING_KAFKA.format(doc_id))
            return ProcessFileResponse(
                statusCode=400,
                status="Error",
                message="File upload failed due to invalid file format.",
                data=ProcessFileData(
                    document_id=doc_id,
                    upload_id=upload_id
                )
            )
        account_country = get_account_country(account_rid)
        logger.info(f"Account country : {account_country}")
        if account_country is None:
            logger.info(f"Account country not mapped for this account: {account_rid}")
            return ProcessFileResponse(
                statusCode=400,
                status="Error",
                message="Country is not mapped for this account.",
                data=ProcessFileData(
                    document_id=doc_id,
                    upload_id=upload_id
                )
            )
        # Prefix from Constants
        producer_id = generate_uuid()
        event_data = KafkaEventCreate(
            related_to=request.document.related_to,
            related_to_rid=request.document.related_to_rid,
            document_rid=doc_id,
            document_name=request.import_.document_name,
            document_upload_rid=upload_id,
            producer_id=producer_id,
            source_name=Constants.Metadata.SOURCE_NAME,
            status=Constants.Status.PROCESSING,
            topic_name= topic_name,
            created_by = request.import_.uploaded_by_user_rid
        )
        logger.info(f"event_data : {event_data}")
        event_id = insert_kafka_event(event_data,account_r_number)

        try:
            kafka_producer.send_message(
                document_id=doc_id,
                account_rid=request.document.account_rid,
                account_r_number= account_r_number,
                producer_id = producer_id,
                topic_name = topic_name,
                fiscal_year = request.import_.fiscal_year
                )
            kafka_producer.flush()
            update_status(event_id, Constants.Status.PRODUCED,account_r_number)
            return ProcessFileResponse(
                statusCode=200,
                status="Success",
                message="File uploaded successfully and is being processed",
                data=ProcessFileData(
                    document_id=doc_id,
                    upload_id=upload_id
                )
            )
        except Exception as kafka_error:
            error_msg = f"{type(kafka_error).__name__}: {str(kafka_error)}"[:500]
            update_status(event_id, Constants.Status.FAILURE, account_r_number, error_msg)
            logger.error(f"Kafka production failed: {error_msg}", exc_info=True)
            return ProcessFileResponse(
                statusCode=500,
                status="Error",
                message="Failed to send Kafka event. Please try again later.",
                data=ProcessFileData(
                    document_id=doc_id,
                    upload_id=upload_id
                )
            )