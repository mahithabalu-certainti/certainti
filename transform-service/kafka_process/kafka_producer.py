from confluent_kafka import Producer, KafkaException
from logger.logger import get_logger
from config import settings, config
from database.db_handler import DatabaseHandler
import json
from typing import Dict, Any
from datetime import datetime

logger = get_logger("kafka_producer")

class KafkaResourceProducer:
    """Handles production of resource messages to Kafka"""

    def __init__(self):
        self.db_handler = DatabaseHandler()
        self.producer = self._initialize_producer()

    def _initialize_producer(self) -> Producer:
        """Initialize producer with compatibility settings"""
        return Producer({
            'bootstrap.servers': config.KAFKA_BROKER,
            'linger.ms': 100,
            'batch.num.messages': 1000,
            'message.max.bytes': 1000000,   
            'compression.type': 'none',     
            'acks': '1',                    
        })

    def delivery_report(self, err, msg):
        """Delivery report callback to handle success or failure of message delivery"""
        if err is not None:
            logger.error(f"❌ Delivery failed for record {msg.key()}: {err}")
        else:
            logger.info(f"✅ Record successfully delivered to {msg.topic()} [{msg.partition()}] @ offset {msg.offset()}")

    def _create_kafka_event(self, document_rid: str, account_r_number: str, modified_by: str) -> Dict[str, Any]:
        """Create Kafka event metadata dictionary"""
        return {
            "document_rid": document_rid,
            "document_name": self.db_handler.fetch_by_kafka_document_name(document_rid,account_r_number) or "Unknown",
            "document_upload_rid": self.db_handler.fetch_by_kafka_document_upload_rid(document_rid,account_r_number) or "Unknown",
            "producer_id": self.db_handler.generate_uuid(),
            "status": config.PROCESS_MESSAGE,
            "source_name": self.db_handler.fetch_by_kafka_source_name(document_rid,account_r_number) or "Unknown",
            "topic_name": config.KAFKA_OUTPUT_TOPIC,
            "created_by": modified_by
        }

    def _create_kafka_message(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Create the actual Kafka message payload"""
        return json.dumps(payload)
    

    def send_resource_message(self, document_rid: str, account_rid: str, status_message: str, entity_type: str,account_r_number: str,modified_by: str, payload: Dict[str, Any]) -> bool:
        """
        Produce Kafka message after storing resource data.
        Returns True if successful, False otherwise.
        """
        try:
            # Create and log Kafka event
            event = self._create_kafka_event(document_rid,account_r_number,modified_by)
            logger.info(f"Kafka Event: {event}")

            # Store event in database
            if not self.db_handler.insert_kafka_event(event, account_r_number):
                raise RuntimeError("Failed to insert Kafka event into database")

            # Create and send Kafka message
            message = self._create_kafka_message(
                payload=payload
            )

            logger.info(f"Producing message to Kafka topic {config.KAFKA_AI_REQUEST_TRIGGER_TOPIC}: {message}")
            
            self.producer.produce(
                topic=config.KAFKA_AI_REQUEST_TRIGGER_TOPIC,
                key=str(document_rid).encode('utf-8'),  
                value=message.encode('utf-8'),          
                callback=self.delivery_report
            )
            modified_by = self.db_handler.fetch_by_upload_user_id(document_rid, account_r_number)
            user_details = self.db_handler.get_user_details(modified_by)

            self.producer.flush()  # Ensure all messages are sent
            logger.info(f"✅ Successfully sent resource event to Kafka topic: {config.KAFKA_AI_REQUEST_TRIGGER_TOPIC}")
            return True

        except KafkaException as e:
            logger.error(f"❌ Kafka error while sending message: {e}", exc_info=True)
            return False
        except Exception as e:
            logger.error(f"❌ General error while sending resource data to Kafka: {e}", exc_info=True)
            return False

    def close(self):
        """Clean up producer resources"""
        if self.producer:
            self.producer.flush()  # Ensure all messages are delivered before closing
            logger.info("Kafka producer closed")
