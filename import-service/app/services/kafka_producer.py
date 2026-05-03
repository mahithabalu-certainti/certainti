# app/kafka_producer.py
import json
import logging
import asyncio
from confluent_kafka import Producer
from typing import Optional
from ..core.config import settings  # Using centralized config

class KafkaProducer:
    def __init__(self):
        self.conf = {
            'bootstrap.servers': settings.KAFKA_BROKER,
            'client.id': settings.SERVICE_NAME,
            'enable.idempotence': True,
            'acks': 'all',
            'message.timeout.ms': 5000,
            'queue.buffering.max.messages': 100000
        }
        # self.topic = settings.KAFKA_TOPIC
        self.producer = Producer(self.conf)
        self.logger = logging.getLogger(__name__)
        # self.logger.info(f"Initialized Kafka producer for topic: {self.topic}")

    async def send_async_message(self, document_id: str, account_rid: str):
        """Async wrapper for message sending"""
        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(
                None,  # Uses default executor (thread pool)
                self.send_message,
                document_id,
                account_rid
            )
        except Exception as e:
            self.logger.error(f"Async send failed: {str(e)}")
            raise

    def send_message(self, document_id: str, account_rid: str,account_r_number: str,producer_id: str,topic_name: str,fiscal_year: str):
        """Synchronous message sending"""
        try:
            message = {
                "document_id": str(document_id),
                "account_rid": str(account_rid),
                "producer_id": producer_id,
                "account_r_number": str(account_r_number),
                "fiscal_year": fiscal_year,
                "service": settings.SERVICE_NAME
            }
            
            self.producer.produce(
                topic=topic_name,
                value=json.dumps(message),
                key=str(document_id),  # For partition ordering
                callback=self._delivery_report
            )
            self.producer.poll(0)
            self.logger.debug(f"Queued message for document {document_id}")

        except BufferError as be:
            self.logger.warning("Kafka producer queue full: %s", str(be))
            raise
        except Exception as e:
            self.logger.error("Message production failed: %s", str(e))
            raise

    def _delivery_report(self, err, msg):
        """Callback for message delivery status"""
        if err:
            self.logger.error("Delivery failed for %s: %s", 
                            msg.key(), err.str())
        else:
            self.logger.info("Delivered %s to %s [%s]", 
                           msg.key(), msg.topic(), msg.partition())

    def flush(self, timeout: Optional[float] = 5.0):
        """Flush pending messages with timeout"""
        remaining = self.producer.flush(timeout)
        if remaining > 0:
            self.logger.warning("Failed to flush %d messages", remaining)
            return False
        return True

# Singleton instance for dependency injection
kafka_producer = KafkaProducer()