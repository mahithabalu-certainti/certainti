from kafka_process.kafka_consumer import consume_messages
from database.db_handler import store_data,update_document_status,update_import_status
from logger.logger import logger

if __name__ == "__main__":
    consume_messages()


