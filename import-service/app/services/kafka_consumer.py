import pyspark.sql.functions as F
from confluent_kafka import Consumer
import json
from core.constants import Constants
import uuid
import json
from logger.logger import get_logger
from core.config import settings
from database.db_handler import (update_kafka_events, update_document_status, 
        update_import_status, generate_uuid, get_upload_rid_by_producer_id,
        fetch_document_url, get_user_id_by_upload_rid, get_user_details)
from services.email_service import send_email_with_attachment
from datetime import datetime
from email_template import get_error_email_html
from email_template_success import get_success_email_html

logger = get_logger("kafka_consumer")

def kafka_consume_messages() :
        
        ENTITY_TOPIC_MAP = {
        "resource": settings.KAFKA_CONSUMER_TOPIC_RESOURCE,
        "resource_cost": settings.KAFKA_CONSUMER_TOPIC_RESOURCE_COST,
        "resource_skill": settings.KAFKA_CONSUMER_TOPIC_RESOURCE_SKILL,
        "project": settings.KAFKA_CONSUMER_TOPIC_PROJECT,
        "project_resource": settings.KAFKA_CONSUMER_TOPIC_PROJECT_RESOURCE,}
        
        entity_types = ["resource", "resource_cost","resource_skill","project","project_resource"]  # This can be from settings or arguments
        subscribed_topics = [ENTITY_TOPIC_MAP[etype] for etype in entity_types if etype in ENTITY_TOPIC_MAP]

        consumer = Consumer({
        'bootstrap.servers': settings.KAFKA_BROKER,
        'group.id': settings.KAFKA_CONSUMER_GROUP,
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': True,
        'auto.commit.interval.ms': 5000
        })
        consumer.subscribe(subscribed_topics)
        logger.info(f"Listening for Kafka messages...{subscribed_topics}")

        while True:
            message = consumer.poll(timeout=1.0)
            if message is None:
                continue
            if message.error():
                logger.error(f"Consumer error: {message.error()}")
                continue 

            entity_type = None
            document_id = None
            account_r_number = None
            producer_id = None
            try:
                msg_value = json.loads(message.value().decode("utf-8"))
                logger.info(f"Received message: {msg_value}")
                
                # Validate Kafka message
                if not validate_kafka_message(msg_value):
                    logger.error("Skipping invalid message due to invalid UUIDs.")
                    error_description = Constants.invalidMessage(msg_value)
                    status = settings.CONSUMER_MESSAGE_FAILURE
                    update_kafka_events(producer_id, consumer_id, status, error_description)
                    update_document_status(document_id, status, error_description)
                    update_import_status(document_id, status, error_description)
                    raise ValueError("Invalid Kafka message structure or UUID.") 

                # Extract validated fields
                document_id = msg_value["document_id"]
                account_rid = msg_value["account_rid"]
                producer_id = msg_value["producer_id"]
                account_r_number = msg_value["account_r_number"]
                consumer_id = generate_uuid()
                entity_type = msg_value["entity_type"]

                logger.info(f"Processing Producer ID: {producer_id}, Account RID: {account_rid}, Consumer ID: {consumer_id}")      
                existing_record = get_upload_rid_by_producer_id(producer_id, account_r_number)
                if not existing_record:
                    logger.info(f"Message with producer_id {producer_id} was already successfully processed - skipping")
                else :
                    record = get_upload_rid_by_producer_id(producer_id,account_r_number)
                    if record:
                        status = Constants.KafkaEvents.CONSUMER_MESSAGE_SUCCESS
                        error_description = msg_value.get("error_description", None)
                        update_kafka_events(producer_id, consumer_id, status,account_r_number, error_description)
                        logger.info(f"Successfully processed Producer ID: {producer_id}")
                        document_url = fetch_document_url(document_id,account_r_number)
                        kafka_event_details = get_upload_rid_by_producer_id(producer_id, account_r_number)
                        user_id = get_user_id_by_upload_rid(kafka_event_details.document_upload_rid, account_r_number)
                        user_datas = get_user_details(user_id)
                        subject = f"ImportService - {entity_type} - Successfully processed"
                        html_content = get_success_email_html(user_datas[1], entity_type, datetime.utcnow(), document_id)
                        send_email_with_attachment(user_datas[0], subject,html_content , document_url, kafka_event_details.document_name)
                        consumer.commit()
                    else :
                        error_description = f"Invalid Producer ID: {producer_id}."
                        status = Constants.KafkaEvents.CONSUMER_MESSAGE_FAILURE
                        update_kafka_events(producer_id, consumer_id, status, account_r_number, error_description)
                        update_document_status(account_r_number, document_id, status, error_description)
                        update_import_status(account_r_number, document_id, status, error_description)
                        logger.error(f"❌ Error: {error_description}")
                        document_url = fetch_document_url(document_id,account_r_number)
                        kafka_event_details = get_upload_rid_by_producer_id(producer_id, account_r_number)
                        user_id = get_user_id_by_upload_rid(kafka_event_details.document_upload_rid, account_r_number)
                        user_datas = get_user_details(user_id)
                        subject = f"ImportService - {entity_type} - Kafka Consumer error"
                        error = f"Failed to process Producer ID: {producer_id}"
                        html_content = get_error_email_html(error, user_datas[1], entity_type, datetime.utcnow(), document_id)
                        send_email_with_attachment(user_datas[0], subject,html_content , document_url, kafka_event_details.document_name)
                        consumer.commit()
                        raise ValueError(f"Failed to process Producer ID: {producer_id}")

            except Exception as e:
                logger.error(f"Error processing Kafka message: {e}", exc_info=True)
                document_url = fetch_document_url(document_id,account_r_number)
                kafka_event_details = get_upload_rid_by_producer_id(producer_id, account_r_number)
                user_id = get_user_id_by_upload_rid(kafka_event_details.document_upload_rid, account_r_number)
                user_datas = get_user_details(user_id)
                subject = f"ImportService - {entity_type} - Kafka Consumer error"
                error = f"Error processing Kafka message: {e}"
                html_content = get_error_email_html(error, user_datas[1], entity_type, datetime.utcnow(), document_id)
                send_email_with_attachment(user_datas[0], subject,html_content, document_url, kafka_event_details.document_name)
                consumer.commit()
                continue


def is_valid_uuid(value: str) -> bool:
    """Check if a value is a valid UUID."""
    try:
        uuid.UUID(value, version=4)
        return True
    except ValueError:
        return False

def validate_kafka_message(message: dict) -> bool:
    """Validate the structure and content of the Kafka message."""
    required_keys = ["document_id", "account_rid", "producer_id"]
    for key in required_keys:
        if key not in message or not is_valid_uuid(message[key]):
            logger.error(f"Invalid or missing UUID for key: {key} in message: {message}")
            return False
    return True

