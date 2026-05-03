from kafka_process.kafka_consumer import consume_messages
import logging

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    consume_messages()