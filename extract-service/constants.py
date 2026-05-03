import os
from dotenv import load_dotenv
load_dotenv()

class Constants:
    # Database Settings
    SCHEMA_MAIN = "trd365"
    # Kafka Settings
    KAFKA_BROKER = os.getenv("KAFKA_BROKER")
    # KAFKA_BROKER = "localhost:9092"
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
    KAFKA_CONSUMER_GROUP = "etl-transform-group"
    WORKING_HOURS = 24
    # Production Database
    PROD_DB_HOST = "localhost"
    PROD_DB_NAME = "certainti"
    PROD_DB_USER = "postgres"
    USER_MAIN_TABLE = "user"
    
    # Entity Database
    ENTITY_DB_HOST = "localhost"
    ENTITY_DB_NAME = "certainti"
    ENTITY_DB_USER = "postgres"
    ENTITY_DB_PORT = "5432"
    SCHEMA_PREFIX = "trd365_"
    MAIN_SCHEMA_PREFIX = "trd365"
    UUID_PREFIX = os.getenv("UUID_PREFIX")
    
    # Application Constants
    SERVICE_NAME = "document-importer"
    PRODUCED_MESSAGE = "Processing"
    CONSUMER_MESSAGE_SUCCESS = "Success"
    CONSUMER_MESSAGE_PROCESS = "Processing"
    CONSUMER_MESSAGE_FAILURE = "Failed"
    PRODUCED_MESSAGE_SUCCESS = "Success"
    PRODUCED_MESSAGE_PROCESS = "Processing"
    PRODUCED_MESSAGE_FAILURE = "Failed"
    VALIDATION_MESSAGE_FAILURE = "Failed"
    VALIDATION_MESSAGE_SUCCESS = "Success"
    VALIDATION_MESSAGE_PROCESS = "Processing"
    
    # Table names
    STAGING_RESOURCE_TABLE = "resources_staging"
    STAGING_RESOURCE_COST_TABLE = "resource_cost_staging"
    STAGING_RESOURCE_SKILL_TABLE = "resource_skill_staging"
    STAGING_PROJECT_TABLE = "project_staging"
    STAGING_PROJECT_RESOURCE_TABLE = "project_resource_staging"
    STAGING_PROJECT_RESOURCE_TM_US_TABLE = "project_resource_staging_tm_us"
    STAGING_PROJECT_RESOURCE_TM_CA_TABLE = "project_resource_staging_tm_ca"
    STAGING_PROJECT_RESOURCE_FULLTIME_TM_CA_TABLE = "project_resource_fulltime_staging_tm_ca"
    STAGING_PROJECT_RESOURCE_SUBCON_TM_CA_TABLE = "project_resource_subcon_staging_tm_ca"
    STAGING_PROJECT_RESOURCE_FULLTIME_TM_US_TABLE = "project_resource_fulltime_staging_tm_us"
    STAGING_PROJECT_RESOURCE_SUBCON_TM_US_TABLE = "project_resource_subcon_staging_tm_us"
    STAGING_PROJECT_RESOURCE_FULLTIME_TM_UK_TABLE = "project_resource_fulltime_staging_tm_uk"
    STAGING_PROJECT_RESOURCE_SUBCON_TM_UK_TABLE = "project_resource_subcon_staging_tm_uk"
    STAGING_PROJECT_RESOURCE_FULLTIME_TM_IR_TABLE = "project_resource_fulltime_staging_tm_ir"
    STAGING_PROJECT_RESOURCE_SUBCON_TM_IR_TABLE = "project_resource_subcon_staging_tm_ir"
    STAGING_PROJECT_RESOURCE_FULLTIME_TM_AU_TABLE = "project_resource_fulltime_staging_tm_au"
    STAGING_PROJECT_RESOURCE_SUBCON_TM_AU_TABLE = "project_resource_subcon_staging_tm_au"
    STAGING_PROJECT_RESOURCE_FULLTIME_TMTI_TABLE = "project_resource_fulltime_staging_tmti"
    STAGING_PROJECT_RESOURCE_SUBCON_TMTI_TABLE = "project_resource_subcon_staging_tmti"
    STAGING_PROJECT_RESOURCE_FULLTIME_TM_ALLYIS_TABLE = "project_resource_fulltime_staging_tm_allyis"
    STAGING_PROJECT_RESOURCE_SUBCON_TM_ALLYIS_TABLE = "project_resource_subcon_staging_tm_allyis"
    STAGING_PROJECT_TABLE_BR = "project_staging_br"
    STAGING_PROJECT_RESOURCE_TABLE_BR = "project_resource_staging_br"   
    STAGING_RESOURCE_COST_TABLE_MASTEK = "resource_cost_staging_mastek"
    STAGING_PROJECT_TASK_TABLE = "project_task_staging"
    TEMPLATE_COLUMNS_TABLE = "clientfirm_document_template_metadata"
    CLIENT_TEMPLATE_COLUMNS_TEMPLATES_TABLE = "clientfirm_document_template"
    DOCUMENT_TABLE = "document"
    IMPORT_TABLE = "import"
    KAFKA_EVENTS_TABLE= "kafka_events"
    CURRENCY_TABLE = "currency"
    ACCOUNT_DETAIL_TABLE = "account_details"
    PROJECT_TYPE_TABLE = "project_type"
    TASK_TYPE_TABLE = "project_task_type"
    TASK_CLASSIFICATION_TABLE = "project_task_classification"
    RESOURCE_TYPE_TABLE = "resource_type"
    COUNTRY = "country"
    CITY="city"
    STATE="state"
    ACCOUNT_TABLE = "account"
    CHECK_CUSTOMISATION_TABLE = "customisation_checks"
    
    #customisation account names 
    MANDATORY_COLUMNS_FULLTIME_US = [
        "emp_id",
        "month",
        "gross_pay",
        "project_id",
        "contract_type",
        "resource_type"
    ]
    MANDATORY_COLUMNS_SUBCON_US = [
        "fiscal_year_period",
        "project_id",
        "employee",
        "*1000000$",
        "contract_type",
        "resource_type"
    ]

    MANDATORY_COLUMNS_FULLTIME_CA = [
        "emplid",
        "month",
        "gross_salary",
        "project_id",
        "contract_type",
        "resource_type"
    ]
    MANDATORY_COLUMNS_SUBCON_CA = [
        "emp_id",
        "effort_month",
        "project_id",
        "resource_type",
        #"contract_type"# yet to confirm
    ]
    MANDATORY_COLUMNS_TM_FULLTIME_UK = [
        "emp_id",
        "gross_pay",
        "project_id",
        "contract_type"
    ]
    MANDATORY_COLUMNS_TM_SUBCON_UK = [
        "project_id",
        "subcon_id",
        "amount_in_doc_currency",
        "contract_type"
    ]
    MANDATORY_COLUMNS_PT_TM_UK = [
        "project_id",
        "employee_id",
        "timesheet_efforts",
        "timesheet_date"
    ]
    MANDATORY_COLUMNS_BS_PROJECT = [
        "project_id"
    ]
    MANDATORY_COLUMNS_BS_PROJECT_RESOURCE = [
        "project_id",
        "resource_id",
        "resource_type",
        "total_hours"
    ]
    MANDATORY_COLUMNS_MASTEK = [
        "amount",
        "emp_num"
    ]
    MANDATORY_COLUMNS_TM_FULLTIME_IR = [
        "employee_id",
        "gross_pay",
        "project_id",
        "contract_type"
    ]
    MANDATORY_COLUMNS_TM_SUBCON_IR = [
        "project_id",
        "emp_id",
    ]
    MANDATORY_COLUMNS_TM_FULLTIME_AU = [
        "emp_id",
        "gross_pay",
        "project_id",
        "contract_type"
    ]
    MANDATORY_COLUMNS_TM_SUBCON_AU = [
        "project_id",
        "emp_id",
    ]
    MANDATORY_COLUMNS_TMTI_FULLTIME = [
        "employee_id",
        "taxable_gross",
        "project_id",
        "contract_type"
    ]
    MANDATORY_COLUMNS_TMTI_SUBCON = [
        "subcon_id",
        "employee",
    ]
    MANDATORY_COLUMNS_TM_ALLYIS_FULLTIME = [
        "allyis_id",
        "grand_total",
        "project_id",
    ]
    MANDATORY_COLUMNS_TM_ALLYIS_SUBCON = [
        "project_id",
        "emp_id",
        "total"
    ]
    
    #Azure 
    BLOB_CONTAINER = "etl-testing"
    BLOB_NAME = "resource"

    SOURCE_NAME = "WEB Upload"
    # DEFAULT_TOPIC = "stg_resource"
    FILE_FORMAT = "CSV"
    CSV_FORMAT = ".csv"
    WEB = "web"
    CHUNK_SIZE=4194304

    @staticmethod
    def invalidMessage(message: str) -> str:
        return f"Invalid message due to invalid UUIDs..{message.value}"

    @staticmethod
    def invalidRequiredColumns():
        return f"Not Able to fetch required columns"
    
    class ErrorMessages:
        UK_CLIENT_GROUP_MANDATORY = "project client group is mandatory for UK region"
        MISSING_REQUIRED_COLUMNS = "Missing required columns from table"
        OVERLAPPING_RESOURCE_DATE_RANGES = "staging: overlapping resource date ranges detected"
        DUPLICATE_RECORD_FOUND = "staging: Duplicate record found"
        CUMULATIVE_TOTAL_HOURS_EXCEEDS_AVAILABLE_HOURS = "staging: cumulative total hours exceeds available hours"
        RECORD_TOTAL_HOURS_EXCEEDS_AVAILABLE_HOURS = "staging: record total hours exceeds available hours"
        DUPLICATE_OR_OVERLAPPING_DATE_RANGE = "staging: Duplicate/overlapping date range"
        OVERLAPPING_TASK_DATE_RANGES = "staging: overlapping task date ranges detected"
        CUMULATIVE_TASK_TOTAL_HOURS_EXCEEDS_AVAILABLE_HOURS = "staging: cumulative total hours exceeds available hours"
        RECORD_TASK_TOTAL_HOURS_EXCEEDS_AVAILABLE_HOURS = "staging: record total hours exceeds available hours"
        DAILY_TOTAL_HOURS_EXCEEDS_WORKING_HOURS = "staging: Daily total hours exceeds 24 hours"
        MISSING_RESOURCE_ID = "Missing resource_id"
        INVALID_RESOURCE_ID_LENGTH = "Resource ID must be between 3-50 characters"
        INVALID_RESOURCE_ID_FORMAT = "Resource ID must start with letter and contain only alphanumerics, hyphens or underscores"
        MISSING_RESOURCE_TYPE = "Missing resource_type"
        MISSING_RESOURCE_ORGANIZATION = "Missing resource_organization for Non-Labor/Sub Con resource"
        INVALID_RESOURCE_ORGANIZATION_LENGTH = "Organization name must be between 3-100 characters for Non-Labor/Sub Con resource"
        INVALID_RESOURCE_ORGANIZATION_FORMAT = "Missing resource_organization for non-Full-Time resource_type"
        INVALID_RESOURCE_ORGANIZATION_LENGTH_FULL_TIME = "Organization name must be between 3-100 characters for non-Full-Time resources"
        MISSING_EFFORT_IN_HOURS = "Missing effort_in_hours"
        INVALID_EFFORT_IN_HOURS = "Effort in hours must be a valid numeric value"
        INVALID_EFFORT_IN_HOURS_RANGE = "Effort in hours must be between 0 and 9,999,999,999,999,999"
        MISSING_RESOURCE_COST = "Missing resource_cost"
        INVALID_RESOURCE_COST = "Resource cost must be a valid numeric value"
        INVALID_RESOURCE_COST_RANGE = "Resource cost must be between 0 and 9,999,999,999,999,999.99"
        MISSING_SKILL_TYPE = "Missing skill_type"
        INVALID_SKILL_TYPE_LENGTH = "Skill Type must be between 3-64 characters"
        INVALID_SKILL_TYPE_FORMAT = "Skill Type can only contain letters, spaces, hyphens, apostrophes, periods, underscores"
        MISSING_PROJECT_ID = "Missing project_id"
        INVALID_PROJECT_ID_LENGTH = "Project ID must be between 5-50 characters"
        INVALID_PROJECT_ID_FORMAT = "Project ID contains invalid characters"
        MISSING_PROJECT_TYPE = "Missing project_type"
        MISSING_TOTAL_HOURS = "Missing total_hours"
        MISSING_TASK_START_DATE = "Missing task_start_date"
        MISSING_TASK_END_DATE = "Missing task_end_date"
        INVALID_TOTAL_HOURS = "Total hours must be a valid numeric value"
        INVALID_TOTAL_HOURS_RANGE = "Total hours must be between 0 and 9,999,999,999,999,999"
        INVALID_TASK_START_DATE_FORMAT = "Invalid Task Start Date format (expected YYYY-MM-DD)"
        INVALID_TASK_END_DATE_FORMAT = "Invalid Task End Date format (expected YYYY-MM-DD)"
        TASK_START_DATE_NOT_WITHIN_FISCAL_YEAR = "Task Start Date not within Fiscal Year"
        TASK_END_DATE_NOT_WITHIN_FISCAL_YEAR = "Task End Date not within Fiscal Year"
        TASK_START_DATE_IN_FUTURE = "Task Start Date is in the future"
        TASK_END_DATE_IN_FUTURE = "Task End Date is in the future"
        TASK_START_DATE_BEFORE_MIN_DATE = "Task Start Date is before the minimum allowed date (1950-01-01)"
        TASK_END_DATE_BEFORE_MIN_DATE = "Task End Date is before the minimum allowed date (1950-01-01)"
        TASK_END_DATE_BEFORE_START_DATE = "Task End Date cannot be before Task Start Date"  
        START_DATE_BEFORE_FISCAL_YEAR = "Start Date cannot be before Fiscal Year start date"
        INVALID_NAME_LENGTH = "Name must be between 2-64 characters when provided"
        INVALID_NAME_FORMAT = "Name can only contain letters, spaces, hyphens, apostrophes and must start/end with letter"
        INVALID_ORGANIZATION_LENGTH = "Organization Name must be between 3-100 characters when provided"
        INVALID_ORGANIZATION_FORMAT = "Organization Name contains invalid characters or formatting"
        INVALID_ROLE_LENGTH = "Role must be between 3-64 characters when provided"
        INVALID_ROLE_FORMAT = "Role can only contain letters, spaces, hyphens, apostrophes, periods and must start/end with letter"
        INVALID_START_DATE_FORMAT = "Invalid Start Date format (expected YYYY-MM-DD)"
        INVALID_START_DATE_BEFORE_MIN_DATE =  "Effective Date cannot be before 1950-01-01"
        INVALID_START_DATE_BEFORE_FISCAL_YEAR = "Effective Date cannot be before Fiscal Year start date"
        INVALID_END_DATE_FORMAT = "Invalid End Date format (expected YYYY-MM-DD)"
        INVALID_END_DATE_IN_FUTURE = "End Date cannot be in the future"
        INVALID_END_DATE_BEFORE_START_DATE = "End Date must be after Effective Date if both provided"
        INVALID_END_DATE_BEFORE_FISCAL_YEAR = "End Date must be before Fiscal Year end date"
        INVALID_DESIGNATION_LENGTH = "Designation must be between 3-64 characters when provided"
        INVALID_DESIGNATION_FORMAT = "Designation can only contain letters, spaces, hyphens, apostrophes, periods and must start/end with letter"
        INVALID_TOTAL_YEARS_OF_EXPERIENCE =  "Total Years of Experience must be between 1.00-99.99 when provided"
        INVALID_TOTAL_YEARS_IN_ORGANIZATION = "Total Years in Organization must be between 1.00-99.99 when provided"
        INVALID_RESOURCE_CITY_LENGTH = "resource_city cannot exceed 50 characters"
        INVALID_RESOURCE_CITY = "Invalid City - Not Found in R&D Think 365 Platform Database"
        INVALID_RESOURCE_COUNTRY_LENGTH = "resource_country cannot exceed 50 characters"
        INVALID_RESOURCE_COUNTRY = "Invalid Country - Not Found in R&D Think 365 Platform Database"
        INVALID_RESOURCE_STATE_PROVINCE_LENGTH = "resource_state_province cannot exceed 50 characters"
        INVALID_RESOURCE_STATE_PROVINCE = "Invalid State - Not Found in R&D Think 365 Platform Database"
        INVALID_COMMENT_LENGTH = "Comments cannot exceed 2000 characters"
        INVALID_COMMENT_FORMAT = "Organization Name contains invalid characters or formatting"
        INVALID_CURRENCY_LENGTH = "Currency code must be 3 characters"
        START_DATE_NOT_WITHIN_FISCAL_YEAR = "Start Date not within Fiscal Year"
        START_DATE_IN_FUTURE = "Start Date cannot be in the future for current fiscal year"
        START_DATE_BEFORE_FISCAL_YEAR = "Start Date cannot be before Fiscal Year start date"
        END_DATE_BEFORE_FISCAL_YEAR = "End Date cannot be before Fiscal Year start date"
        END_DATE_BEFORE_START_DATE = "End Date must be after Start Date"
        END_DATE_NOT_WITHIN_FISCAL_YEAR = "End Date not within Fiscal Year"
        END_DATE_IN_FUTURE = "End Date cannot be in the future for current fiscal year"
        SUBCON_NON_LABOR_INVALID_SALARY = "For Sub Con/Non-Labor: Salary must be null"
        SUBCON_NON_LABOR_INVALID_INSURANCE = "For Sub Con/Non-Labor: Insurance must be null"
        SUBCON_NON_LABOR_INVALID_BONUS = "For Sub Con/Non-Labor: Bonus must be null"
        START_DATE_IS_IN_FUTURE = "Start Date is in the future"
        START_DATE_BEFORE_MIN_DATE = "Start Date is before the minimum allowed date (1950-01-01)"
        INVALID_SKILL_SUBTYPE_FORMAT = "Skill SubType: 3-64 chars, letters/spaces/hyphens/apostrophes/periods/underscores"
        INVALID_SKILL_DETAILS_LENGTH = "Skill Details cannot exceed 2000 characters"
        INVALID_NAME_LENGTH = "Name must be 4-255 characters"
        NAME_CONTAINS_INVALID_CHARS = "Name contains invalid characters"
        INDUSTRY_LENGTH = "Industry must be 3-255 characters"
        INDUSTRY_CONTAINS_INVALID_CHARS = "Industry contains invalid characters"
        INVALID_START_DATE_IN_FUTURE = "Start Date cannot be in the future"
        INVALID_END_DATE_NOT_WITHIN_FISCAL_YEAR = "End Date must fall within the fiscal year"
        INVALID_TOTAL_COST = "total_cost must equal total_fte_cost + total_sub_con_cost + total_non_labor_cost"
        INVALID_TOTAL_HOURS_SUM = "total_hours must equal total_fte_effort_in_hrs + total_sub_con_effort_in_hrs"
        INVALID_CITY_LENGTH = "city cannot exceed 50 characters"
        INVALID_CITY = "Invalid City - Not Found in R&D Think 365 Platform Database"
        INVALID_COUNTRY_LENGTH = "country cannot exceed 50 characters"
        INVALID_COUNTRY = "Invalid Country - Not Found in R&D Think 365 Platform Database"
        INVALID_REGION_LENGTH = "region cannot exceed 50 characters"
        INVALID_REGION = "Invalid Region - Not Found in R&D Think 365 Platform Database"
        INVALID_CONTACT_NAME_LENGTH = "Point of Contact name must be 2-128 characters"
        INVALID_CONTACT_NAME = "Point of Contact name contains invalid characters"
        INVALID_CURRENCY = "Invalid Currency - Not Found in R&D Think 365 Platform"
        INVALID_RESOURCE_NAME_LENGTH = "Resource Name must be 2-64 characters"
        INVALID_RESOURCE_NAME = "Resource Name can only contain letters, spaces, hyphens, apostrophes"
        INVALID_TASK_END_DATE_FORMAT = "Invalid Task End Date format (expected YYYY-MM-DD)"
        TASK_END_DATE_BEFORE_START_DATE =    "Task End Date must be after Start Date"
        TASK_END_DATE_NOT_WITHIN_FISCAL_YEAR = "Task End Date not within Fiscal Year"
        TASK_END_DATE_IN_FUTURE = "Task End Date cannot be in the future for current fiscal year"
        TASK_END_DATE_BEFORE_FISCAL_YEAR_END_DATE = "Task End Date must be before Fiscal Year end date"
        MISSING_EMP_ID = "Missing emp_id"
        INVALID_EMP_ID_LENGTH = "emp_id must be between 3-50 characters"
        INVALID_EMP_ID_FORMAT = "emp_id can only contain letters, numbers, hyphens, and underscores"
        MISSING_MONTH = "Missing month"
        INVALID_MONTH_FORMAT = "month must be in the format 'Month YYYY'"
        MISSING_GROSS_PAY = "Missing gross_pay"
        INVALID_GROSS_PAY_FORMAT = "gross_pay must be a valid number"
        MISSING_CONTRACT_TYPE = "Missing contract_type"
        INVALID_CURRENT_WORK_LOCATION_FORMAT = "current_work_location must be in the format 'City, State, Country'"
        INVALID_PROGRAM_MANAGER_NAME_FORMAT = "program_manager_name must be in the format 'First Name Last Name'"
        MISSING_FISCAL_YEAR_PERIOD = "Missing fiscal_year_period"
        INVALID_FISCAL_YEAR_PERIOD_FORMAT = "fiscal_year_period must be in the format 'YYYY-MM-DD'"
        MISSING_EMPLOYEE = "Missing employee"
        INVALID_EMPLOYEE_LENGTH = "employee must be between 3-50 characters"
        MISSING_GL_TEXT = "Missing gl_text"
        MISSING_SUB_CON_ID = "Missing subcon_id"
        INVALID_SUB_CON_ID_LENGTH = "subcon_id must be between 1-50 characters"
        MISSING_SALARY_FOR_FULL_TIME = "For Full-Time: Salary is mandatory"
        MISSING_COST_FOR_NON_FULL_TIME = "For sub-con/non-labor: Resource Cost is mandatory"
        MISSING_EFFORT_FOR_NON_FULL_TIME = "For sub-con/non-labor: Resource Effort is mandatory"
        MISSING_TIMESHEET_EFFORTS = "Missing timesheet_efforts"
        INVALID_TIMESHEET_EFFORTS_FORMAT = "timesheet_efforts must be a valid number"
        NEGATIVE_TIMESHEET_EFFORTS = "timesheet_efforts must be non-negative"
        MISSING_TIMESHEET_DATE = "Missing timesheet_date"
        INVALID_TIMESHEET_DATE_FORMAT = "timesheet_date must be in the format 'YYYY-MM-DD'"







        @staticmethod
        def missing_required_columns(entity_type: str, missing_columns: str) -> str:
            return f"Missing required columns in {entity_type}: {missing_columns}"
        
        @staticmethod
        def invalid_resource_type(valid_resource_types: list) -> str: 
            return f"Resource Type must be one of: {', '.join(valid_resource_types)}"
        
        @staticmethod
        def invalid_project_type(valid_project_types: list) -> str: 
            return f"Project Type must be one of: {', '.join(valid_project_types)}"
        
        @staticmethod
        def invalid_numeric_value(field: str) -> str: 
            return f"{field} must be a valid numeric value"
        
        @staticmethod
        def invalid_numeric_range_res_cost(field: str, rules: dict) -> str:
            return f"{field} must be between {rules['min']} and {rules['max']}"

        @staticmethod
        def invalid_numeric_range(field: str, min_val, max_val) -> str:
            # Ensure values are Decimal for precise formatting
            from decimal import Decimal
            min_val = Decimal(str(min_val))
            max_val = Decimal(str(max_val))
            return (
                f"{field} must be between "
                f"{min_val:.2f} and {max_val:.2f}"
            )


        @staticmethod
        def invalid_skill_level(valid_levels: list) -> str: 
            return f"Invalid Skill Level. Use one of: {', '.join(valid_levels)}"
        
        @staticmethod
        def invalid_length(field: str, rules: dict) -> str: 
            return f"{field} must be {rules['min_len']}-{rules['max_len']} characters"
        
        @staticmethod
        def invalid_min_length(field: str, rules: dict) -> str: 
            return f"{field} must be at least {rules['min_len']} characters"
        
        @staticmethod
        def invalid_max_length(field: str, rules: dict) -> str: 
            return f"{field} cannot exceed {rules['max_len']} characters"
        
        @staticmethod 
        def invalid_format(field: str) -> str: 
            return f"{field} contains invalid characters"
        
        @staticmethod 
        def invalid_email_length(email_field: str) -> str: 
            return f"{email_field} must be 6-125 characters"
        
        @staticmethod 
        def invalid_email_format(email_field: str) -> str: 
            return f"{email_field} has invalid format"
        
        @staticmethod 
        def invalid_mobile_length(mobile_field: str) -> str: 
            return f"{mobile_field} must be 10-15 digits"
        
        @staticmethod 
        def invalid_desc_length(desc_field: str) -> str: 
            return f"{desc_field} cannot exceed 2000 characters"
        
        @staticmethod
        def invalid_org_length(org_field: str) -> str: 
            return f"{org_field} must be 2-255 characters"

        @staticmethod
        def invalid_org_format(org_field: str) -> str: 
            return f"{org_field} contains invalid characters"
        
        @staticmethod
        def invalid_resource_type(valid_resource_types: list) -> str: 
            return f"Resource Type must be one of: {', '.join(valid_resource_types)}"
        
        @staticmethod 
        def invalid_project_type(valid_project_types: list) -> str: 
            return f"Project Type must be one of: {', '.join(valid_project_types)}"
        
        @staticmethod 
        def invalid_task_type(valid_task_types: list) -> str: 
            return f"Task Type must be one of: {', '.join(valid_task_types)}"
        
        @staticmethod 
        def invalid_task_classification(valid_classification_types: list) -> str: 
            return f"Task Type must be one of: {', '.join(valid_classification_types)}"
        
        @staticmethod
        def invalid_length_range(field: str, min_len: int, max_len: int) -> str: 
            return f"{field} must be {min_len}-{max_len} characters"
        
        @staticmethod
        def invalid_location_length(location_field: str) -> str: 
            return f"{location_field} must be at least 2 characters"
