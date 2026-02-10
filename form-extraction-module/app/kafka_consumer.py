
import json
import requests
import tempfile
from pathlib import Path
from confluent_kafka import Consumer, KafkaException
from .config import get_settings
from .ade_service import ADEForm6765Service
from .database import DBPool, update_extraction_status
import os

settings = get_settings()
ade_service = ADEForm6765Service()


def process_kafka_message(message):
    """
    Process a single Kafka message:
    1. Parse JSON payload
    2. Download file from file_url
    3. Run extraction
    4. Update DB with result
    """
    data_mapper_rid = None
    try:
        msg_value = json.loads(message.value().decode("utf-8"))
        print(f"Received Kafka message: {msg_value}")

        data_mapper_rid = msg_value.get("data_mapper_rid")
        file_url = msg_value.get("file_url")
        user_id = msg_value.get("userId")
        country_code = msg_value.get("country_code")
        state_code = msg_value.get("state_code")
        
        if not file_url:
            print("Error: No file_url in message")
            return

        # Download file
        try:
            response = requests.get(file_url)
            response.raise_for_status()
            file_content = response.content
            print(f"Downloaded file from {file_url}, size: {len(file_content)} bytes")
        except Exception as e:
            error_msg = f"Failed to download file: {e}"
            print(error_msg)
            if data_mapper_rid:
                with DBPool.get_connection() as conn:
                    update_extraction_status(conn, data_mapper_rid, 'Failed', error_message=error_msg)
            return

        # Save to temp file for ADE
        suffix = ".pdf" 
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp_path = Path(tmp.name)
            tmp.write(file_content)
        
        try:
            print(f"Starting extraction for {tmp_path}")
            extracted = ade_service.extract_form(tmp_path)
            print("Extraction successful")
            
            # Update DB on success
            if data_mapper_rid:
                with DBPool.get_connection() as conn:
                    update_extraction_status(conn, data_mapper_rid, 'Completed', extracted_data=extracted.model_dump_json(), user_id=user_id, country_code=country_code, state_code=state_code)
            
        except Exception as e:
            error_msg = f"Extraction failed: {e}"
            print(error_msg)
            # Update DB on failure
            if data_mapper_rid:
                with DBPool.get_connection() as conn:
                    update_extraction_status(conn, data_mapper_rid, 'Failed', error_message=error_msg)

        finally:
            try:
                tmp_path.unlink(missing_ok=True)
            except:
                pass

    except Exception as e:
        print(f"Error processing message: {e}")

def consume_messages():
    """
    Kafka consumer loop running in a background thread.
    """
    conf = {
        'bootstrap.servers': settings.KAFKA_BROKER,
        'group.id': settings.KAFKA_GROUP_ID,
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': True
    }

    consumer = Consumer(conf)
    
    try:
        consumer.subscribe([settings.KAFKA_DATA_MAPPER_TOPIC])
        print(f"Subscribed to topic: {settings.KAFKA_DATA_MAPPER_TOPIC}")

        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
            if msg.error():
                print(f"Consumer error: {msg.error()}")
                continue
            
            process_kafka_message(msg)

    except Exception as e:
        print(f"Kafka consumer crashed: {e}")
    finally:
        consumer.close()
