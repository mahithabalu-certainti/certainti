import os
class Constants:
    class Database:
        DOCUMENT_TABLE = "document"
        IMPORT_TABLE = "import"
        ACCOUNT_TABLE = "account"
        KAFKA_EVENTS_TABLE = "kafka_events"
        HEALTH_CHECK_QUERY = "SELECT 1"
        CONNECTED = "connected"
        SCHEMA_PREFIX = "trd365_"
        USER_MAIN_TABLE = "user"
        UUID_PREFIX = os.getenv("UUID_PREFIX")
        MAIN_SCHEMA_PREFIX = "trd365"
        ACCOUNT_MAIN_TABLE = "account"
        
    class API:
        PROCESS_FILE_ENDPOINT = "/process-file"
        HEALTH_ENDPOINT = "/health"
        SERVICE_TITLE = "Document Importer API"
        SERVICE_VERSION = "1.0.0"
        
    class LogMessages:
        DOCUMENT_INSERT_FAIL = "Document insert failed"
        IMPORT_INSERT_FAIL = "Import insert failed"
        KAFKA_EVENT_FAIL = "Kafka event insert failed"
        PROCESSING_FAIL = "Processing failed"
        SKIPPING_KAFKA = "Skipping Kafka operations for document_id={} due to failure status"
        
    class Env:
        PRODUCER_ID = "PRODUCER_ID"
        CONSUMER_ID = "CONSUMER_ID"
        SERVICE_NAME = "SERVICE_NAME"
        KAFKA_TOPIC = "KAFKA_TOPIC"
        
    class Status:
        FAILED = "failed"
        PRODUCED = "Processing"
        HEALTHY = "healthy"
        UNHEALTHY = "unhealthy"
        PROCESSING = "Processing"
        FAILURE = "FAILED"
        FAILURE_REASON = "Invalid file type"
        
    class Metadata:
        SOURCE_NAME = "WEB Upload"
        DEFAULT_TOPIC = "stg_resource"
        FILE_FORMAT = "CSV"
        CSV_FORMAT = "csv"
        XLSX_FORMAT = "xlsx"
        WEB = "web"

    class KafkaEvents:
        ERROR_DESCRIPTION = "error_description"
        MODIFIED_AT = "modified_datetime"
        PRODUCED_MESSAGE = "Processing"
        CONSUMER_MESSAGE_SUCCESS = "Success"
        CONSUMER_MESSAGE_FAILURE = "Failed"
    
    class EntityPrefix:
        DOCUMENT = "DOC"
        IMPORT = "IM"
        KAFKA_EVENTS = "KFE"
    
    class RouterTags:
        FILE_UPLOAD = "File Upload"
        FILE_PROCESSING = "File Processing"
        SYSTEM_HEALTH = "System Health"