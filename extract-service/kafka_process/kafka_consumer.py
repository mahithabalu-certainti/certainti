from concurrent.futures import ThreadPoolExecutor
from confluent_kafka import Consumer
from confluent_kafka.admin import AdminClient, NewTopic, KafkaException
import confluent_kafka
import json
from handling.file_handler import process_file
from logger.logger import logger
from constants import Constants
from config import config
from database.db_handler import (
    update_kafka_events, generate_uuid, fetch_by_kafka_producer_id,
    fetch_document_url, fetch_document_entity, update_document_status,
    update_import_status, fetch_by_upload_user_id, check_customisation_accounts,
    get_upload_rid_by_document_rid, get_account_details
)
from handling.blob_file import download_blob_from_url
from datetime import datetime
from services.customisation.TM_US.file_handler import process_file as process_file_tm_us
from services.customisation.TM_CA.file_handler import process_file as process_file_tm_ca
from services.customisation.Birlasoft.file_handler import process_file as process_file_bs
from services.customisation.Mastek_UK.file_handler import process_file as process_file_mastek
from services.customisation.TM_UK.file_handler import process_file as process_file_tm_uk
from services.customisation.TM_IR.file_handler import process_file as process_file_tm_ir
from services.customisation.TM_AU.file_handler import process_file as process_file_tm_au
from services.customisation.TMTI.file_handler import process_file as process_file_tmti
from services.customisation.TM_ALLYIS.file_handler import process_file as process_file_tm_allyis



def process_kafka_message(message):
    user_details = None
    modified_by = None
    file_path = None
    document_details = None
    document_url = None
    document_entity = None
    document_id = None

    try:
        msg_value = json.loads(message.value().decode("utf-8"))
        logger.info(f"Received message: {msg_value}")

        document_id = msg_value["document_id"]
        account_rid = msg_value["account_rid"]
        producer_id = msg_value["producer_id"]
        account_r_number = msg_value["account_r_number"]
        fiscal_year = msg_value["fiscal_year"]
        consumer_id = generate_uuid()
        modified_by = fetch_by_upload_user_id(document_id, account_r_number)

        if not validate_kafka_message(msg_value):
            error_description = Constants.invalidMessage(msg_value)
            status = config.CONSUMER_MESSAGE_FAILURE
            update_kafka_events(modified_by, producer_id, consumer_id, status, account_r_number, error_description)
            update_document_status(modified_by, account_r_number, document_id, status, error_description)
            update_import_status(modified_by, account_r_number, document_id, status, error_description)
            raise ValueError("Invalid Kafka message structure or UUID.")


        logger.info(f"Processing Producer ID: {producer_id}, Account RID: {account_rid}, Consumer ID: {consumer_id}")
        existing_record = fetch_by_kafka_producer_id(producer_id, account_r_number, config.PRODUCED_MESSAGE)
        if not existing_record:
            logger.info(f"Message with producer_id {producer_id} already processed - skipping")
            return

        status = config.CONSUMER_MESSAGE_SUCCESS
        error_description = msg_value.get("error_description", None)
        update_kafka_events(modified_by, producer_id, consumer_id, status, account_r_number, error_description)

        document_url = fetch_document_url(document_id, account_r_number)
        document_entity = fetch_document_entity(document_id, account_r_number)
        normalized_entity = document_entity.strip().lower()

        if not document_url:
            raise ValueError(f"Document URL not found for document ID: {document_id}")

        logger.info(f"Fetched Document URL: {document_url}")
        account_name, country_rid, account_country = get_account_details(account_rid)
        if check_customisation_accounts(account_rid, account_name):
            # Primary country-based handlers
            if account_country == "USA":
                if "TMTI" in account_name:
                    logger.info(f"Processing customisation for TMTI account RID: {account_rid}")
                    process_file_tmti(account_rid, document_id, document_url, normalized_entity,
                                    account_r_number, fiscal_year, producer_id)
                elif "ALLYIS" in account_name:
                    logger.info(f"Processing customisation for TM_ALLYIS account RID: {account_rid}")
                    process_file_tm_allyis(account_rid, document_id, document_url, normalized_entity,
                                        account_r_number, fiscal_year, producer_id)
                else:
                    logger.info(f"Processing customisation for TM_US account RID: {account_rid}")
                    process_file_tm_us(account_rid, document_id, document_url, normalized_entity,
                                    account_r_number, fiscal_year, producer_id)

            elif account_country == "CAN":
                logger.info(f"Processing customisation for TM_CA account RID: {account_rid}")
                process_file_tm_ca(account_rid, document_id, document_url, normalized_entity,
                                account_r_number, fiscal_year, producer_id)

            elif account_country == "GBR":
                logger.info(f"Processing customisation for TM_UK account RID: {account_rid}")
                process_file_tm_uk(account_rid, document_id, document_url, normalized_entity,
                                account_r_number, fiscal_year, producer_id)

            elif account_country == "IRL":
                logger.info(f"Processing customisation for TM_IR account RID: {account_rid}")
                process_file_tm_ir(account_rid, document_id, document_url, normalized_entity,
                                account_r_number, fiscal_year, producer_id)

            elif account_country == "AUS":
                logger.info(f"Processing customisation for TM_AU account RID: {account_rid}")
                process_file_tm_au(account_rid, document_id, document_url, normalized_entity,
                                account_r_number, fiscal_year, producer_id)
            else:
                logger.info(f"No customisation found for this account: {account_rid}")
        else:
            logger.info(f"No customisation found for this account: {account_rid}")
            process_file(account_rid, document_id, document_url, normalized_entity,
                        account_r_number, fiscal_year, producer_id)

    except Exception as e:
        logger.error(f"❌ Error processing Kafka message: {e}", exc_info=True)
        error_description = 'Error processing the file in Staging'
        status = config.CONSUMER_MESSAGE_FAILURE
        update_kafka_events(modified_by, producer_id, consumer_id, status, account_r_number, error_description)
        update_document_status(modified_by, account_r_number, document_id, status, error_description)
        update_import_status(modified_by, account_r_number, document_id, status, error_description)


def consume_messages():
    create_topics()
    ENTITY_TOPIC_MAP = {
        "resource": config.KAFKA_TOPIC_RESOURCE,
        "resource_cost": config.KAFKA_TOPIC_RESOURCE_COST,
        "resource_skill": config.KAFKA_TOPIC_RESOURCE_SKILL,
        "project": config.KAFKA_TOPIC_PROJECT,
        "project_resource": config.KAFKA_TOPIC_PROJECT_RESOURCE,
        "project_task": config.KAFKA_TOPIC_PROJECT_TASK
    }

    entity_types = ["resource", "resource_cost", "resource_skill", "project", "project_resource", "project_task"]
    subscribed_topics = [ENTITY_TOPIC_MAP[etype] for etype in entity_types if etype in ENTITY_TOPIC_MAP]

    consumer = Consumer({
        'bootstrap.servers': config.KAFKA_BROKER,
        'group.id': config.KAFKA_CONSUMER_GROUP,
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': True,
        'auto.commit.interval.ms': 5000
    })
    consumer.subscribe(subscribed_topics)

    logger.info(f"Listening for Kafka messages... {subscribed_topics}")

    # Set max number of parallel workers
    executor = ThreadPoolExecutor(max_workers=5)

    try:
        while True:
            message = consumer.poll(timeout=1.0)
            if message is None:
                continue
            if message.error():
                logger.error(f"Consumer error: {message.error()}")
                continue

            # Submit the message to thread pool for processing
            executor.submit(process_kafka_message, message)

    except KeyboardInterrupt:
        logger.info("Kafka consumer interrupted and shutting down...")
    finally:
        consumer.close()


def validate_kafka_message(message: dict) -> bool:
    required_keys = ["document_id", "account_rid", "producer_id"]
    for key in required_keys:
        if key not in message:
            logger.error(f"Missing key: {key} in Kafka message: {message}")
            return False
    return True

def create_topics():
    admin_client = AdminClient({
        "bootstrap.servers": config.KAFKA_BROKER
    })

    topics = [
        config.KAFKA_TOPIC_RESOURCE,
        config.KAFKA_TOPIC_RESOURCE_COST,
        config.KAFKA_TOPIC_RESOURCE_SKILL,
        config.KAFKA_TOPIC_PROJECT,
        config.KAFKA_TOPIC_PROJECT_RESOURCE,
        config.KAFKA_TOPIC_PROJECT_TASK,
        config.KAFKA_OUTPUT_TOPIC_RESOURCE,
        config.KAFKA_OUTPUT_TOPIC_RESOURCE_COST,
        config.KAFKA_OUTPUT_TOPIC_RESOURCE_SKILL,
        config.KAFKA_OUTPUT_TOPIC_PROJECT,
        config.KAFKA_OUTPUT_TOPIC_PROJECT_RESOURCE,
        config.KAFKA_OUTPUT_TOPIC_PROJECT_TASK
    ]

    new_topics = [NewTopic(topic, num_partitions=3, replication_factor=1) for topic in topics]

    fs = admin_client.create_topics(new_topics)

    for topic, f in fs.items():
        try:
            f.result()  # raises exception if creation failed
            logger.info(f"✅ Topic '{topic}' created")
        except confluent_kafka.KafkaException as e:
            if e.args[0].code() == confluent_kafka.KafkaError.TOPIC_ALREADY_EXISTS:
                logger.info(f"ℹ️ Topic '{topic}' already exists, skipping creation")
            else:
                logger.error(f"❌ Failed to create topic {topic}: {e}")
