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

        if entity_type == "resource_cost":
            logger.info("validating optional fields for project")
            df = validate_resource_cost_fields(df,document_rid, entity_type, modified_by, file_path, document_url, start_end_date)
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

def validate_resource_cost_fields(df,document_rid, entity_type, modified_by, file_path, document_ur, start_end_date):
    """
    Validate project fields only when values are present.
    All fields are treated as optional except required ones which are handled elsewhere.
    """
    # Initialize warning column if not exists
    if "warning_descriptions" not in df.columns:
        df = df.withColumn("warning_descriptions", lit(None))

    df = append_error(df,
                    (col("emp_num").isNull() | (trim(col("emp_num")) == "")), 
                    Constants.ErrorMessages.MISSING_RESOURCE_ID)
            
    # If resource_id exists, validate its format
    df = append_error(df,
                    (col("emp_num").isNotNull()) & 
                    ((length(col("emp_num")) < 1) | (length(col("emp_num")) > 50)),
                    Constants.ErrorMessages.INVALID_RESOURCE_ID_LENGTH)
            
    df = append_error(
                df,
                (F.col("emp_num").isNotNull()) &
                (~F.col("emp_num").rlike("^[a-zA-Z0-9_.-]+$")),
                Constants.ErrorMessages.INVALID_RESOURCE_ID_FORMAT
                )
                # Validate resource_cost
    df = append_error(df,
                    (col("amount").isNull() | (trim(col("amount")) == "")), 
                    Constants.ErrorMessages.MISSING_RESOURCE_COST)

    df = append_error(
        df,
        (col("amount").isNotNull()) &
        (~col("amount").rlike(r'^-?\d+(\.\d+)?$')),   # ✅ allow optional negative sign
        Constants.ErrorMessages.INVALID_RESOURCE_COST
    )


    df = append_error(df,
                    (col("amount").isNotNull()) &
                    (col("amount") > 9999999999999999.99),
                    Constants.ErrorMessages.INVALID_RESOURCE_COST_RANGE)
    
    df = append_error(df,
                    (col("gl_text").isNull() | (trim(col("gl_text")) == "")), 
                    Constants.ErrorMessages.MISSING_GL_TEXT)
 
    return df



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