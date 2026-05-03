from confluent_kafka import Producer
from logger.logger import logger
from config import config
from database.db_handler import (
    generate_uuid, insert_kafka_event, fetch_by_kafka_document_id,
    fetch_by_kafka_document_upload_rid, fetch_by_kafka_source_name,
    fetch_by_kafka_document_name, update_document_status, update_import_status,fetch_by_upload_user_id,
    get_user_details,get_upload_rid_by_document_rid,fetch_document_url
)
import json
from services.email import send_email_with_attachment
from email_template import get_error_email_html
from handling.blob_file import download_blob_from_url
from datetime import datetime


def delivery_report(err, msg):
    """ Delivery callback to report message status. """
    if err is not None:
        logger.error(f"❌ Delivery failed: {err}")
    else:
        logger.info(f"✅ Message delivered to {msg.topic()} [{msg.partition()}]")


def send_to_kafka(document_rid: str, account_rid: str, entity_type: str, account_r_number:str, fiscal_year: str, emp_type: str = None, customization_flag: str = None):
    producer = Producer({'bootstrap.servers': config.KAFKA_BROKER})
    modified_by = fetch_by_upload_user_id(document_rid, account_r_number)
    try:
        producer_id = generate_uuid()
        result = fetch_by_kafka_document_id(document_rid,account_r_number)
        logger.info(f"Result frm send kafka ======> {result}")
        if entity_type == "resource":
            topic_name = config.KAFKA_OUTPUT_TOPIC_RESOURCE
        elif entity_type == "resource_cost":
            topic_name = config.KAFKA_OUTPUT_TOPIC_RESOURCE_COST
        elif entity_type == "resource_skill":
            topic_name = config.KAFKA_OUTPUT_TOPIC_RESOURCE_SKILL
        elif entity_type == "project":
            topic_name = config.KAFKA_OUTPUT_TOPIC_PROJECT
        elif entity_type == "project_resource":
            topic_name = config.KAFKA_OUTPUT_TOPIC_PROJECT_RESOURCE
        else:
            topic_name = config.KAFKA_OUTPUT_TOPIC_PROJECT_TASK
        logger.info(f"topic_name : {topic_name}")
        if result:
            event = {
                "document_rid": document_rid,
                "document_name": fetch_by_kafka_document_name(document_rid,account_r_number) or "Unknown",
                "document_upload_rid": fetch_by_kafka_document_upload_rid(document_rid,account_r_number) or "Unknown",
                "producer_id": producer_id,
                "status": config.PRODUCED_MESSAGE,
                "source_name": fetch_by_kafka_source_name(document_rid,account_r_number) or "Unknown",
                "topic_name": topic_name,
                "related_to": "ACCOUNT",
                "related_to_rid" : account_rid,
                "created_by" : modified_by
            }
            logger.info(f"event : {event}")
        try:
            insert_kafka_event(event,account_r_number)
            logger.info(f"✅ inserted kafka events")
        except Exception as e:
            logger.error(f"❌ Error inserting data into Kafka events table: {e}")
            error_message = f"Error while inserting data into Kafka events table"
            update_document_status(modified_by, account_r_number, document_rid, config.PRODUCED_MESSAGE_FAILURE, error_message)
            update_import_status(modified_by, account_r_number, document_rid, config.PRODUCED_MESSAGE_FAILURE, error_message)
            return
        message = {
            "document_id": str(document_rid),
            "account_rid": str(account_rid),
            "producer_id": producer_id,
            "account_r_number": str(account_r_number),
            "entity_type" : entity_type,
            "fiscal_year": fiscal_year 
        }

        if customization_flag:
            message["customization_flag"] = customization_flag
        if emp_type:
            message["emp_type"] = emp_type
        producer.produce(topic_name, key=str(document_rid), value=json.dumps(message), callback=delivery_report)
        producer.flush()  # Ensure all messages are sent
        logger.info(f"✅ Sent records to Kafka topic {topic_name}")
    except Exception as e:
        logger.error(f"❌ Error sending data to Kafka: {e}")
        error_message = f"Error while sending data to Kafka"
        update_document_status(modified_by, account_r_number,document_rid, config.PRODUCED_MESSAGE_FAILURE, error_message)
        update_import_status(modified_by, account_r_number, document_rid, config.PRODUCED_MESSAGE_FAILURE, error_message)
    finally:
        producer.flush()  # Ensure all remaining messages are sent
