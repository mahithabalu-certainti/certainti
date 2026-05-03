from logger.logger import logger
from pyspark.sql import DataFrame,Window,Row
from config import settings,config
from functools import reduce
from constants import Constants
from database.db_handler import get_required_columns,get_validate_rows, get_start_end_date_by_account_rid
from datetime import datetime
from pyspark.sql import functions as F
from pyspark.sql import functions as F, Window
from datetime import timedelta
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, when, lit, trim, 
    to_date, year, current_date, count,  monotonically_increasing_id,lag,datediff,
    concat_ws, length,trim, lower, substring, row_number, coalesce,collect_list, struct, regexp_replace
)
from pyspark.sql.types import DecimalType,StringType,StructField,StructType
from database.db_handler import (
    update_document_status, update_import_status,
    get_valid_currencies,get_valid_cities,get_valid_states
)
from database.db_handler import (
    update_document_status, update_import_status,fetch_by_upload_user_id,
    get_user_details,get_upload_rid_by_document_rid,fetch_document_url,get_valid_project_types,get_valid_resource_types
)
from pyspark.storagelevel import StorageLevel


def validate_columns_exist(df, document_rid, column_mapping):
    """
    Check whether the DataFrame has all the expected columns for the entity_type and document_type.
    Accounts for columns where empty strings ("") have been replaced with "-".
    Returns True if all expected columns exist, False otherwise.
    """
    try:
        # Expected columns (right side of mapping)
        expected_columns = set(column_mapping.values())
        logger.info(f"expected_columns : {expected_columns}")
        # Normalize actual DataFrame columns
        actual_columns = set(df.columns)
        logger.info(f"expected_columns : {actual_columns}")
        missing_cols = expected_columns - actual_columns
        
        if missing_cols:
            logger.warning(f"document {document_rid} missing columns: {missing_cols}")
            return False
        return True

    except Exception as e:
        logger.error(f"Error validating columns for document {document_rid}: {e}")
        return False



def _handle_validation_failure(account_r_number, document_rid, error_message, modified_by):
    """Handles validation failures by updating document and import statuses."""
    logger.error(f"❌ {error_message}")
    update_document_status(modified_by, account_r_number, document_rid, config.VALIDATION_MESSAGE_FAILURE, error_message)
    update_import_status(modified_by, account_r_number, document_rid, config.VALIDATION_MESSAGE_FAILURE, error_message)


def log_validation_results(df, validation_schema):
    """Log validation results and schema information."""
    # Log data types
    for column in df.columns:
        logger.info(f"Column: {column}")
        expected_dtype, is_required = validation_schema.get(column, (None, False))
        logger.info(f"Expected type: {expected_dtype}")
        actual_dtype = str(df.schema[column].dataType)
        logger.info(f"Actual type: {actual_dtype}")
    
    # Log validation statistics
    df.persist(StorageLevel.MEMORY_AND_DISK)
    total_rows = df.count()
    failed_rows = df.filter(col("status") == config.VALIDATION_MESSAGE_FAILURE).count()
    logger.info(f"✅ Total rows processed: {total_rows}, Failed rows: {failed_rows}")
    df.unpersist()

def clean_column_values(df, column_name):
    return [
        str(row[column_name]).strip()
        for row in df
            .filter(col(column_name).isNotNull())
            .select(column_name).distinct().collect()
        if str(row[column_name]).strip() and str(row[column_name]).strip().lower() != "nan"
    ]

def validate_columns(df: DataFrame, document_rid: str, column_mapping: dict, entity_type: str) -> bool:
    """
    Validate that all mandatory columns exist in the DataFrame.
    Returns True if all mandatory columns are present, False otherwise.
    """
    try:
        # Actual columns from DataFrame
        actual_columns = set(df.columns)

        mandatory_columns_set = set()
        if entity_type == "project":
            mandatory_columns_set = set(config.MANDATORY_COLUMNS_BS_PROJECT)
        elif entity_type == "project_resource":
            mandatory_columns_set = set(config.MANDATORY_COLUMNS_BS_PROJECT_RESOURCE)

        # Expected columns from mapping
        expected_columns = set(column_mapping.values())

        # 1. Check missing mapped columns
        missing_cols = expected_columns - actual_columns
        if missing_cols:
            logger.warning(f"Document {document_rid} missing mapped columns: {missing_cols}")
            return False

        # 2. Check mandatory columns
        missing_mandatory_cols = mandatory_columns_set - actual_columns
        if missing_mandatory_cols:
            logger.warning(f"Document {document_rid} missing mandatory columns: {missing_mandatory_cols}")
            return False

        return True

    except Exception as e:
        logger.error(f"Error validating columns for document {document_rid}: {e}")
        return False

def validate_rows(df, document_rid, entity_type, account_rid, account_r_number, fiscal_year, modified_by, file_path, document_url):
    """
    Validates DataFrame rows based on entity type and business rules.
    
    Args:
        df: Input DataFrame to validate
        document_rid: Document reference ID
        entity_type: Type of entity being validated (resource, resource_skill, resource_cost, project)
        account_rid: Account reference ID
        account_r_number: Account number
        fiscal_year: Fiscal year for validation
        
    Returns:
        DataFrame with validation results (status, errors, warnings)
    """
    try:

        start_end_date = get_start_end_date_by_account_rid(account_r_number, account_rid, fiscal_year)
        logger.info(f"start_end_date : {start_end_date}")

        for column in df.columns:
            if isinstance(df.schema[column].dataType, StringType):
                df = df.withColumn(column, trim(col(column)))
        # Initialize error and warning columns
        df = df.withColumn("error_descriptions", lit(None))
        df = df.withColumn("warning_descriptions", lit(None))
        logger.info("fetching required rows...")

        # 2. Entity-specific validation
        df = df.withColumn("fiscal_year", lit(fiscal_year))
        logger.info("validating required rows...")

        if entity_type == "project":
            logger.info("validating optional fields for project")
            df = validate_project_fields(df,document_rid, entity_type, modified_by, file_path, document_url, start_end_date)
        elif entity_type == "project_resource":  # Default case
            logger.info("validating optional fields for project_resource")
            df = validate_project_resource_fields(df,document_rid, entity_type, document_url, start_end_date)
        else:
            logger.info("Invalid Entity Type")

        # 4. Determine final status
        df = df.withColumn(
            "status",
            when(trim(col("error_descriptions")).isNull() | (trim(col("error_descriptions")) == ""),
                 config.VALIDATION_MESSAGE_SUCCESS)
            .otherwise(config.VALIDATION_MESSAGE_FAILURE)
        )
        return df

    except Exception as e:
        logger.error(f"❌ Error during row validation: {str(e)}")
        raise

def validate_project_fields(df,document_rid, entity_type, modified_by, file_path, document_ur, start_end_date):
    """
    Validate project fields only when values are present.
    All fields are treated as optional except required ones which are handled elsewhere.
    """
    # Initialize warning column if not exists
    if "warning_descriptions" not in df.columns:
        df = df.withColumn("warning_descriptions", lit(None))

    df = append_error(
        df,
        (col("project_id").isNull() | (trim(col("project_id")) == "")),
        Constants.ErrorMessages.MISSING_PROJECT_ID
    )

    df = append_error(
        df,
        (col("project_id").isNotNull()) &
        ((length(trim(col("project_id"))) < 2) | (length(trim(col("project_id"))) > 50)),
        Constants.ErrorMessages.INVALID_PROJECT_ID_LENGTH
    )

    df = append_error(
        df,
        (col("project_id").isNotNull()) &
        (~trim(col("project_id")).rlike("^[A-Za-z0-9\s\-\&\.\'\,_]+$")),
        Constants.ErrorMessages.INVALID_PROJECT_ID_FORMAT
    )

    # Name validation
    if "project_name" in df.columns:
        df = append_warning(
            df,
            col("project_name").isNotNull() &
            ((length(col("project_name")) < 4) | (length(col("project_name")) > 255)),
            "project_name",
            Constants.ErrorMessages.INVALID_NAME_LENGTH
        )

        allowed_pattern = r"^[a-zA-Z0-9][a-zA-Z0-9 &.,'_\-\u2013\u2014]{2,253}[a-zA-Z0-9]$"

        df = append_warning(
            df,
            col("project_name").isNotNull() & ~col("project_name").rlike(allowed_pattern),
            "project_name",
            Constants.ErrorMessages.NAME_CONTAINS_INVALID_CHARS
        )
    logger.info("Finished project_name validation")

    # Description fields
    for desc_field in ["project_description"]:
        if desc_field in df.columns:
            df = append_warning(
                df,
                (col(desc_field).isNotNull()) & (length(col(desc_field)) > 2000),
                desc_field,
                Constants.ErrorMessages.invalid_desc_length(desc_field)
            )

    required_cols = ["fte_cost", "sub_con_cost", "total_project_cost"]
    if all(c in df.columns for c in required_cols):
        
        # Cast all to DecimalType for consistent precision
        fte = F.col("fte_cost").cast(DecimalType(18, 2))
        sub_con = F.col("sub_con_cost").cast(DecimalType(18, 2))
        total = F.col("total_project_cost").cast(DecimalType(18, 2))

        correct_total = (
            F.when(
                fte.isNotNull() | sub_con.isNotNull(),
                (F.coalesce(fte, F.lit(0)) + F.coalesce(sub_con, F.lit(0)))
            ).otherwise(total)
        )

        # Compare using a small tolerance to handle float precision
        df = append_warning(
            df,
            (fte.isNotNull() | sub_con.isNotNull()) &
            (F.abs(correct_total - total) > F.lit(0.01)),  # tolerance of 0.01
            "total_project_cost",
            Constants.ErrorMessages.INVALID_TOTAL_COST
        )

        # Update the column
        df = df.withColumn("total_project_cost", correct_total)
    
    # Point of Contact
    if "spoc_name_pm_dm" in df.columns:
        df = append_warning(
            df,
            (col("spoc_name_pm_dm").isNotNull()) & ((length(col("spoc_name_pm_dm")) < 2) | (length(col("spoc_name_pm_dm")) > 128)),
            "spoc_name_pm_dm",
            Constants.ErrorMessages.INVALID_CONTACT_NAME_LENGTH
        )
        df = append_warning(
            df,
            (col("spoc_name_pm_dm").isNotNull()) & ~col("spoc_name_pm_dm").rlike("^[a-zA-Z][a-zA-Z '-]*[a-zA-Z]$"),
            "spoc_name_pm_dm",
            Constants.ErrorMessages.INVALID_CONTACT_NAME
        )

        # Email fields
    for email_field in ["spoc_email"]:
        if email_field in df.columns:
            df = append_warning(
                df,
                (col(email_field).isNotNull()) & ((length(col(email_field)) < 6) | (length(col(email_field)) > 125)),
                email_field,
                Constants.ErrorMessages.invalid_email_length(email_field)
            )
            df = append_warning(
                df,
                (col(email_field).isNotNull()) & ~col(email_field).rlike(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"),
                email_field,
                Constants.ErrorMessages.invalid_email_format(email_field)
            )
            
    return df



def validate_project_resource_fields(df: DataFrame, document_rid: str, entity_type: str, document_url: str, start_end_date: str):
    """
    Validate rows for project_resource entity when type == Full-Time.
    Mandatory fields -> error_descriptions
    Non-mandatory fields -> warning_descriptions
    """
    try:
        if "error_descriptions" not in df.columns:
            df = df.withColumn("error_descriptions", lit(None))
    
        if "warning_descriptions" not in df.columns:
            df = df.withColumn("warning_descriptions", lit(None))
    

        # --- resource_id validations ---
        df = append_error(
            df,
            (col("resource_id").isNull() | (trim(col("resource_id")) == "")),
            "Missing resource_id"
        )
        df = append_error(
            df,
            (col("resource_id").isNotNull()) &
            ((length(trim(col("resource_id"))) < 3) | (length(trim(col("resource_id"))) > 15)),
            "resource_id must be between 3-15 characters"
        )
        df = append_error(
            df,
            (col("resource_id").isNotNull()) &
            (~trim(col("resource_id")).rlike("^[A-Za-z0-9]+$")),
            "resource_id contains invalid characters"
        )

        # Resource Name validation (if value exists)
        if "resource_name" in df.columns:
            df = append_warning(
                df,
                (col("resource_name").isNotNull()) & 
                ((length(col("resource_name")) < 2) | (length(col("resource_name")) > 64)),
                "resource_name",
                Constants.ErrorMessages.INVALID_RESOURCE_NAME_LENGTH
            )
            
            df = append_warning(
                df,
                (col("resource_name").isNotNull()) & 
                ~col("resource_name").rlike("^[a-zA-Z][a-zA-Z '-]*[a-zA-Z]$"),
                "resource_name",
                Constants.ErrorMessages.INVALID_RESOURCE_NAME
            )

        # Organization/Designation/Role fields validation
        for field in ["resource_role"]:
            if field in df.columns:
                min_len = 3
                max_len = 64
                
                df = append_warning(
                    df,
                    (col(field).isNotNull()) & 
                    ((length(col(field)) < min_len) | (length(col(field)) > max_len)),
                    field,
                    Constants.ErrorMessages.invalid_length_range(field, min_len, max_len)
                )
                
                pattern = "^[a-zA-Z][a-zA-Z .'-]*[a-zA-Z]$"
                df = append_warning(
                    df,
                    (col(field).isNotNull()) & 
                    ~col(field).rlike(pattern),
                    field,
                    Constants.ErrorMessages.invalid_format(field)
                )

        # --- resource_type validations ---

        df = append_error(df,
        (col("resource_type").isNull() | (trim(col("resource_type")) == "")),
        Constants.ErrorMessages.MISSING_RESOURCE_TYPE)
        
        valid_resource_types = set(get_valid_resource_types())  | {"Full Time Employee", "Sub Contractor"}
        logger.info(f"valid_resource_types : {valid_resource_types}")
        df = append_error(df,
                        (col("resource_type").isNotNull()) & 
                        (~col("resource_type").isin(valid_resource_types)),
                        Constants.ErrorMessages.invalid_resource_type(valid_resource_types))
        
        # --- project_id validations ---

        df = append_error(df,
            (col("project_id").isNull() | (trim(col("project_id")) == "")),
            Constants.ErrorMessages.MISSING_PROJECT_ID)

        df = append_error(
            df,
            (col("project_id").isNotNull()) &
            ((length(trim(col("project_id"))) < 2) | (length(trim(col("project_id"))) > 50)),
            Constants.ErrorMessages.INVALID_PROJECT_ID_LENGTH
        )

        df = append_error(
            df,
            (col("project_id").isNotNull()) &
            (~trim(col("project_id")).rlike("^[A-Za-z0-9\s\-\&\.\'\,_]+$")),
            Constants.ErrorMessages.INVALID_PROJECT_ID_FORMAT
        )

        # --- state_if_us validation ---
        if "state_if_us" in df.columns:
            df = append_warning(df,
                (col("state_if_us").isNotNull()) & 
                (length(col("state_if_us")) > 50),"state_if_us",
                Constants.ErrorMessages.INVALID_REGION_LENGTH)
            # states = [row['state_if_us'] for row in df.select("state_if_us").distinct().collect() if row['state_if_us']]
            states = clean_column_values(df, "state_if_us")
            if states:
                valid_states = get_valid_states(states)
                
                df = append_warning(df,
                    (col("state_if_us").isNotNull()) & 
                    (~col("state_if_us").isin(valid_states)),
                    "state_if_us",
                    Constants.ErrorMessages.INVALID_REGION)

        # --- total_hours validation ---
        if "total_hours" in df.columns:        
            df = append_warning(df,
                (col("total_hours").isNull() | (trim(col("total_hours")) == "")),
                "total_hours",
                Constants.ErrorMessages.MISSING_TOTAL_HOURS)
            
            # Total Hours validation
            df = append_warning(
                df,
                (col("total_hours").isNotNull()) & (~col("total_hours").rlike(r'^\d+(\.\d+)?$')),
                "total_hours",
                Constants.ErrorMessages.INVALID_TOTAL_HOURS)

            df = append_warning(df,
                (col("total_hours").isNotNull()) & 
                ((col("total_hours") < 0) | (col("total_hours") > 9999999999999999)),
                "total_hours",
                Constants.ErrorMessages.INVALID_TOTAL_HOURS_RANGE)

            numeric_fields = {
                "total_cost": {"min": 0, "max": 9999999999999999.99, "decimal": True}
            }
            
            for field, rules in numeric_fields.items():
                if field in df.columns:
                    df = append_warning(
                        df,
                        (col(field).isNotNull()) & 
                        (~col(field).rlike(r'^\d+(\.\d+)?$')),
                        field,
                        Constants.ErrorMessages.invalid_numeric_value(field)
                    )

                    df = append_warning(
                        df,
                        (col(field).isNotNull()) & 
                        ((col(field) < rules["min"]) | (col(field) > rules["max"])),
                        field,
                        Constants.ErrorMessages.invalid_numeric_range(field, rules)
                    )

        return df

    except Exception as e:
        logger.error(f"Error validating rows for document {document_rid}: {e}")
        raise

def append_message(df, condition, message, column_name):
    return df.withColumn(
        column_name,
        when(
            condition,
            concat_ws("; ", coalesce(col(column_name), lit(None)), lit(message))
        ).otherwise(col(column_name))
    )

def append_error(df, condition, message):
        staging_message = f"staging: {message}"
        return append_message(df, condition, staging_message, "error_descriptions")

def append_warning(df, condition, field_name, message):
    """Enhanced to include field name in warning messages"""
    full_message = f"{field_name}: {message}"
    return append_message(df, condition, full_message, "warning_descriptions")