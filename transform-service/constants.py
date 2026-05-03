import os
from dotenv import load_dotenv
load_dotenv()
class Constants:
    class Spark:
        SHUFFLE_PARTITIONS = 10
    
    class Threshold:
        RESOURCE_COST_SALARY = 200000
        RESOURCE_COST_HOURLY = 3000
        RESOURCE_COST_TOTAL_COST = 200000
        WORKING_HOURS = 24
        BATCH_SIZE = 1000
    
    class Kafka:
        BROKER = os.getenv("KAFKA_BROKER")
        # BROKER = "localhost:9092"
        INPUT_TOPIC = "processed_documents"
        OUTPUT_TOPIC = "final_resource"
        GROUP_ID = "etl-transform-group"
        AUTO_OFFSET_RESET = "earliest"
        SERVICE_NAME = "document-importer"
        KAFKA_TOPIC_RESOURCE = "stg_resource"
        KAFKA_TOPIC_RESOURCE_COST = "stg_resource_cost"
        KAFKA_TOPIC_RESOURCE_SKILL = "stg_resource_skill"
        KAFKA_TOPIC_PROJECT = "stg_project"
        KAFKA_TOPIC_PROJECT_RESOURCE = "stg_project_resource"
        KAFKA_TOPIC_PROJECT_TASK = "stg_project_task"
        KAFKA_OUTPUT_TOPIC_RESOURCE = "entity_resource"
        KAFKA_OUTPUT_TOPIC_RESOURCE_COST = "entity_resource_cost"
        KAFKA_OUTPUT_TOPIC_RESOURCE_SKILL = "entity_resource_skill"
        KAFKA_OUTPUT_TOPIC_PROJECT = "entity_project"
        KAFKA_OUTPUT_TOPIC_PROJECT_RESOURCE = "entity_project_resource"
        KAFKA_OUTPUT_TOPIC_PROJECT_TASK = "entity_project_task"
        KAFKA_AI_REQUEST_TRIGGER_TOPIC="ai_assessment_request"
        KAFKA_AI_RESPONSE_TRIGGER_TOPIC="ai_assessment_response"

    
    class Database:
        DRIVER = "org.postgresql.Driver"
        ENTITY_DB_HOST = "localhost"
        ENTITY_DB_NAME = "certainti"
        ENTITY_DB_USER = "postgres"
        ENTITY_DB_PORT = "5432"
        JDBC_JAR = "postgresql-42.5.6.jar"
        SCHEMA_NAME = "entity"
        SCHEMA_PREFIX = "trd365_"
        UUID_PREFIX = os.getenv("UUID_PREFIX")
        SCHEMA_MAIN = "trd365"
    
    class Tables:
        STAGING_RESOURCE_TABLE = "resources_staging"
        STAGING_RESOURCE_COST_TABLE = "resource_cost_staging"
        STAGING_RESOURCE_SKILL_TABLE = "resource_skill_staging"
        STAGING_PROJECT_TABLE = "project_staging"
        STAGING_PROJECT_RESOURCE_TABLE = "project_resource_staging"
        HISTORY_RESOURCE_TABLE_STAGING = "history_staging_resource"
        HISTORY_RESOURCE_SKILL_TABLE_STAGING = "history_staging_resource_skill"
        HISTORY_RESOURCE_COST_TABLE_STAGING = "history_staging_resource_cost"
        HISTORY_PROJECT_TABLE_STAGING="history_staging_project"
        HISTORY_PROJECT_RESOURCE_TABLE_STAGING="history_staging_project_resource"
        PROJECT_HISTORY_TABLE = "project_history"
        PROJECT_RESOURCE_HISTORY_TABLE = "project_resource_history" 
        RESOURCE_TABLE = "resources"
        RESOURCE_COST_TABLE = "resource_cost"
        RESOURCE_SKILL_TABLE = "resource_skill"
        PROJECT_TABLE ="project"
        PROJECT_RESOURCE_TABLE ="project_resource"
        RESOURCE_HISTORY = "resources_history"
        RESOURCE_COST_HISTORY = "resource_cost_history"
        RESOURCE_SKILL_HISTORY = "resource_skill_history"
        RESOURCE_FISCAL = "resource_fiscal"
        PROJECT_FISCAL = "project_fiscal"
        RESOURCE_TIMELINE = "resources_timeline"
        RESOURCE_COST_TIMELINE = "resource_cost_timeline"
        RESOURCE_SKILL_TIMELINE = "resource_skill_timeline"
        PROJECT_TIMELINE ="project_timeline"
        PROJECT_RESOURCE_TIMELINE="project_resource_timeline"
        DOCUMENT = "document"
        IMPORT = "import"
        KAFKA_EVENTS = "kafka_events"
        KEY_CONTACTS = "key_contact_details"
        KEY_CONTACTS_ROLE = "key_contact_role"
        PROJECT_CLASSIFICATION = "project_classification"
        PROJECT_INDUSTRY = "industry"
        PROJECT_SUMMARY = "project_summary"
        PROJECT_FISCAL_SUMMARY = "project_fiscal_summary"
        SKILL_TYPE = "skill_type"
        SKILL_SUB_TYPE = "skill_subtype"
        CURRENCY="currency"
        CITY="city"
        STATE="state"
        COUNTRY = "country"
        ACCOUNT_FISCAL = "account_fiscal"
        ACCOUNT = "account"
        PROJECT_RESOURCE_FISCAL = "project_resource_fiscal"
        RESOURCE_FISCAL_REGION = "resource_fiscal_region"
        PROJECT_FISCAL_REGION = "project_fiscal_region"
        PROJECT_RESOURCE_FISCAL_REGION = "project_resource_fiscal_region"
        ACCOUNT_FISCAL_REGION = "account_fiscal_region"
        PROJECT_TASK_TABLE = "project_task"
        PROJECT_TASK_HISTORY_TABLE = "project_task_history"
        PROJECT_TASK_TIMELINE = "project_task_timeline"
        HISTORY_PROJECT_TASK_TABLE_STAGING = "history_staging_project_task"
        STAGING_PROJECT_TASK_TABLE = "project_task_staging"
        RESOURCE_STATUS_TABLE = "resource_status"
        STATUS_TABLE = "status" 
        PROJECT_TYPE_TABLE = "project_type"
        TASK_TYPE_TABLE = "project_task_type"
        TASK_CLASSIFICATION_TABLE = "project_task_classification"
        RESOURCE_TYPE_TABLE = "resource_type"
        SKILL_LEVEL_TABLE = "skill_level"
        ACCOUNT_DETAIL_TABLE = "account_details"
        ACCOUNT_FISCAL_SUMMARY = "account_fiscal_summary"
        USER_MAIN_TABLE = "user"
        EVENT_TYPE_TABLE = "event_types"
        ACCOUNT_TIMELINE_TABLE = "account_timeline"
        ORG_LICENSES_TABLE = "organization_licenses"

        #customisation
        STAGING_PROJECT_RESOURCE_SUBCON_TM_US_TABLE = "project_resource_subcon_staging_tm_us"
        STAGING_PROJECT_RESOURCE_FULLTIME_TM_US_TABLE = "project_resource_fulltime_staging_tm_us"
        STAGING_PROJECT_RESOURCE_SUBCON_TM_CA_TABLE = "project_resource_subcon_staging_tm_ca"
        STAGING_PROJECT_RESOURCE_FULLTIME_TM_CA_TABLE = "project_resource_fulltime_staging_tm_ca"
        STAGING_PROJECT_RESOURCE_FULLTIME_TM_UK_TABLE = "project_resource_fulltime_staging_tm_uk"
        STAGING_PROJECT_RESOURCE_SUBCON_TM_UK_TABLE = "project_resource_subcon_staging_tm_uk"
        HISTORY_PROJECT_RESOURCE_SUBCON_TM_CA_TABLE_STAGING = "history_staging_project_resource_subcon_tm_ca"
        HISTORY_PROJECT_RESOURCE_FULLTIME_TM_CA_TABLE_STAGING = "history_staging_project_resource_fulltime_tm_ca"
        HISTORY_PROJECT_RESOURCE_SUBCON_TM_US_TABLE_STAGING = "history_staging_project_resource_subcon_tm_us"
        HISTORY_PROJECT_RESOURCE_FULLTIME_TM_US_TABLE_STAGING = "history_staging_project_resource_fulltime_tm_us"
        HISTORY_PROJECT_RESOURCE_SUBCON_TM_UK_TABLE_STAGING = "history_staging_project_resource_subcon_tm_uk"
        HISTORY_PROJECT_RESOURCE_FULLTIME_TM_UK_TABLE_STAGING = "history_staging_project_resource_fulltime_tm_uk"
        STAGING_PROJECT_TABLE_BR = "project_staging_br"
        STAGING_PROJECT_RESOURCE_TABLE_BR = "project_resource_staging_br"   
        HISTORY_PROJECT_TABLE_BR_STAGING = "history_staging_project_br"
        HISTORY_PROJECT_RESOURCE_TABLE_BR_STAGING = "history_staging_project_resource_br"
        STAGING_RESOURCE_COST_TABLE_MASTEK_UK = "resource_cost_staging_mastek"
        HISTORY_RESOURCE_COST_TABLE_MASTEK_UK = "history_staging_resource_cost_mastek"
        STAGING_PROJECT_RESOURCE_FULLTIME_TM_IR_TABLE = "project_resource_fulltime_staging_tm_ir"
        STAGING_PROJECT_RESOURCE_SUBCON_TM_IR_TABLE = "project_resource_subcon_staging_tm_ir"
        HISTORY_PROJECT_RESOURCE_SUBCON_TM_IR_TABLE_STAGING = "history_staging_project_resource_subcon_tm_ir"
        HISTORY_PROJECT_RESOURCE_FULLTIME_TM_IR_TABLE_STAGING = "history_staging_project_resource_fulltime_tm_ir"
        STAGING_PROJECT_RESOURCE_FULLTIME_TM_AU_TABLE = "project_resource_fulltime_staging_tm_au"
        STAGING_PROJECT_RESOURCE_SUBCON_TM_AU_TABLE = "project_resource_subcon_staging_tm_au"
        HISTORY_PROJECT_RESOURCE_SUBCON_TM_AU_TABLE_STAGING = "history_staging_project_resource_subcon_tm_au"
        HISTORY_PROJECT_RESOURCE_FULLTIME_TM_AU_TABLE_STAGING = "history_staging_project_resource_fulltime_tm_au"
        STAGING_PROJECT_RESOURCE_FULLTIME_TMTI_TABLE = "project_resource_fulltime_staging_tmti"
        STAGING_PROJECT_RESOURCE_SUBCON_TMTI_TABLE = "project_resource_subcon_staging_tmti"
        HISTORY_PROJECT_RESOURCE_SUBCON_TMTI_TABLE_STAGING = "history_staging_project_resource_subcon_tmti"
        HISTORY_PROJECT_RESOURCE_FULLTIME_TMTI_TABLE_STAGING = "history_staging_project_resource_fulltime_tmti"
        STAGING_PROJECT_RESOURCE_FULLTIME_TM_ALLYIS_TABLE = "project_resource_fulltime_staging_tm_allyis"
        STAGING_PROJECT_RESOURCE_SUBCON_TM_ALLYIS_TABLE = "project_resource_subcon_staging_tm_allyis"
        HISTORY_PROJECT_RESOURCE_SUBCON_TM_ALLYIS_TABLE_STAGING = "history_staging_project_resource_subcon_tm_allyis"
        HISTORY_PROJECT_RESOURCE_FULLTIME_TM_ALLYIS_TABLE_STAGING = "history_staging_project_resource_fulltime_tm_allyis"
        CHECK_CUSTOMISATION_TABLE = "customisation_checks"

        CASE_STATUS_TABLE = "case_status"
        CASE_PROJECTS_TABLE = "case_projects"
        CASES_TABLE = "cases"
        CASE_PROJECT_FISCAL_REGION_TABLE = "case_project_fiscal_region"
        CASE_PROJECT_RESOURCE_TABLE = "case_project_resource"
        CASE_PROJECT_RESOURCE_FISCAL_TABLE = "case_project_resource_fiscal"
        CASE_PROJECT_TASK_TABLE = "case_project_task"
        CASES_KEY_CONTACT_TABLE = "case_key_contact_details"
        
    class Messages:
        PRODUCED = "Processing"
        SUCCESS = "Success"
        PROCESS = "Processing"
        FAILURE = "Failed"
        INVALID_UUID = "Invalid UUIDs in message fields.."
        RESOURCE_STATUS_ACTIVE = "Active"
        @staticmethod
        def success_message() -> str:
            return "SUCCESSFULLY LOADED ALL THE DATA"

    class Mastek_UK_Constants:
        INCLUSION_GL_CODES = ["5178", "5101", "5173", "5112"]
        EXCLUSION_GL_CODES = ["5170", "5114"]
        INCLUSION_GL_TEXTS = [
                    "Apprenticeship levy charges",
                    "Gross Salary",
                    "Employer- AE Pension Contribution",
                    "Bonus/Incentive/Commission"
                ]
        EXCLUSION_GL_TEXTS = [
                    "Employer's NI",
                    "Vacation/Leave Encashment"
                ]
        @staticmethod
        def success_message() -> str:
            return "SUCCESSFULLY LOADED ALL THE DATA"
        
    class ErrorMessages:

        OVERLAPPING_DATE_RANGE = "Overlapping date range found"
        DUPLICATE_SKILL_ENTRY = "Duplicate skill entry found"
        NO_CHANGE_DETECTED = "Duplicate record found, but no changes were detected"
        MISSING_RESOURCE_ROLE = "Already has record with project and resource, kindly update resource role"
        DUPLICATE_PROJECT_RESOURCE_ENTRY = "Already have a record for this project, resource, role"
        DUPLICATE_PROJECT_RESOURCE_ROLE = "Project-Resource-Role combination already exists"
        INVALID_NULL_RESOURCE_ROLE = "Resource role cannot be null when non-null roles exist for the same project-resource combination. "
        RESOURCE_DATE_OUTSIDE_PROJECT_RANGE = "Resource start and end date must fall within project start and end date"
        RD_CLAIM_ALREADY_QUALIFIED = "Project update denied. The R&D claim has already been qualified"


        @staticmethod
        def invalid_producer_id(producer_id: str) -> str:
            return f"Producer ID {producer_id} from import service is not valid."
        
        @staticmethod
        def missing_producer_id() -> str:
            return "Missing producer_id in message"
            
        @staticmethod
        def no_staging_data(document_id: str) -> str:
            return f"Kindly Check Validations for Document {document_id} ."
            
        @staticmethod
        def store_transform_failed() -> str:
            return "Failed Due to Technical Error"
            
        @staticmethod
        def document_processing_failed(document_id: str, error: str) -> str:
            return f"Failed Due to Technical Error"
            
        @staticmethod
        def kafka_event_update_failed(error: str) -> str:
            return f"Failed to update Kafka event"
            
        @staticmethod
        def generic_processing_error(error: str) -> str:
            return f"Error while processing the data to entity tables"
        
        @staticmethod
        def effort_exceeds_capacity(remaining_hours: int, total_days: int) -> str: 
            return f"Effort exceeds available capacity ({remaining_hours} hrs left for {total_days} calendar days)"

        @staticmethod
        def cost_exceeds_capacity(remaining_cost: int ) -> str: 
            return f"Cost exceeds Threshold capacity ({remaining_cost})"
