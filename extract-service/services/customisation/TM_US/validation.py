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
    concat_ws, length,trim, lower, substring, row_number, coalesce,collect_list, struct
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

def validate_columns(df: DataFrame, document_rid: str, column_mapping: dict, emp_type: str) -> bool:
    """
    Validate that all mandatory columns exist in the DataFrame.
    Returns True if all mandatory columns are present, False otherwise.
    """
    try:
        # Actual columns from DataFrame
        actual_columns = set(df.columns)

        # Config-defined mandatory columns
        mandatory_columns = set(config.MANDATORY_COLUMNS_FULLTIME_US if emp_type == "Full-Time" else config.MANDATORY_COLUMNS_SUBCON_US)

        # Expected columns from mapping
        expected_columns = set(column_mapping.values())

        # 1. Check missing mapped columns
        missing_cols = expected_columns - actual_columns
        if missing_cols:
            logger.warning(f"Document {document_rid} missing mapped columns: {missing_cols}")
            return False

        # 2. Check mandatory columns
        missing_mandatory_cols = mandatory_columns - actual_columns
        if missing_mandatory_cols:
            logger.warning(f"Document {document_rid} missing mandatory columns: {missing_mandatory_cols}")
            return False

        return True

    except Exception as e:
        logger.error(f"Error validating columns for document {document_rid}: {e}")
        return False

def validate_rows(df, document_rid, entity_type, account_rid, account_r_number, fiscal_year, emp_type):
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


        for column in df.columns:
            if isinstance(df.schema[column].dataType, StringType):
                df = df.withColumn(column, trim(col(column)))
        # Initialize error and warning columns
        df = df.withColumn("error_descriptions", lit(None))
        df = df.withColumn("warning_descriptions", lit(None))

        df = df.withColumn("fiscal_year", lit(fiscal_year))
        logger.info("validating rows...")
    
        if entity_type == "project_resource":  # Default case
            logger.info("validating optional fields for project_resource")
            df = validate_project_resource_fields(df, document_rid, entity_type, emp_type, start_end_date)

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
def validate_project_resource_fields(df: DataFrame, document_rid: str, entity_type: str, emp_type: str, start_end_date: str):
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
    
        if entity_type == "project_resource" and emp_type == "Full-Time":

            # ===============================
            # EMP ID VALIDATIONS
            # ===============================
            df = append_error(
                df,
                (col("emp_id").isNull() | (trim(col("emp_id")) == "")),
                Constants.ErrorMessages.MISSING_EMP_ID
            )

            df = append_error(
                df,
                (col("emp_id").isNotNull()) &
                ((length(trim(col("emp_id"))) < 3) | (length(trim(col("emp_id"))) > 50)),
                Constants.ErrorMessages.INVALID_EMP_ID_LENGTH
            )

            df = append_error(
                df,
                (F.col("emp_id").isNotNull()) &
                (~F.trim(F.col("emp_id")).rlike("^[a-zA-Z0-9][a-zA-Z0-9_-]*$")),
                Constants.ErrorMessages.INVALID_EMP_ID_FORMAT
            )

            # ===============================
            # MONTH VALIDATION
            # ===============================
            df = append_warning(
                df,
                (col("month").isNull() | (trim(col("month")) == "")),
                "month",
                Constants.ErrorMessages.MISSING_MONTH
            )

            df = df.withColumn("month", to_date(col("month")))

            df = append_warning(
                df,
                (col("month").isNotNull()) &
                (to_date(col("month"), "yyyy-MM-dd").isNull()),
                "month",
                Constants.ErrorMessages.INVALID_MONTH_FORMAT
            )

            # ===============================
            # GROSS PAY VALIDATION
            # ===============================
            df = append_error(
                df,
                (col("gross_pay").isNull() | (trim(col("gross_pay")) == "")),
                Constants.ErrorMessages.MISSING_GROSS_PAY
            )

            df = append_error(
                df,
                (col("gross_pay").isNotNull()) &
                (~trim(col("gross_pay")).rlike(r"^(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d{1,15})?$")),
                Constants.ErrorMessages.INVALID_GROSS_PAY_FORMAT
            )

            # ===============================
            # PROJECT ID VALIDATION
            # ===============================
            df = append_error(
                df,
                (col("project_id").isNull() | (trim(col("project_id")) == "")),
                Constants.ErrorMessages.MISSING_PROJECT_ID
            )

            df = append_error(
                df,
                (col("project_id").isNotNull()) &
                ((length(trim(col("project_id"))) < 2) | (length(trim(col("project_id"))) > 50)),
                "Project ID must be between 5-50 characters"
            )

            df = append_error(
                df,
                (col("project_id").isNotNull()) &
                (~trim(col("project_id")).rlike("^[A-Za-z0-9\s\-\&\.\'\,/_]+$")),
                Constants.ErrorMessages.INVALID_PROJECT_ID_FORMAT
            )    

            # ===============================
            # STRICT US / USA REGION VALIDATION  ✅✅✅
            # ===============================
            df = append_error(
                df,
                ~(
                    F.col("current_work_location").rlike(r"-US-") |
                    F.col("current_work_location").rlike(r"-USA-")
                ),
                "Only US / USA region employees are allowed for this process"
            )

            # ===============================
            # STRICT FIXED PRICE CONTRACT TYPE ✅✅✅
            # ===============================
            df = df.withColumn(
                "contract_type_normalized",
                F.upper(F.regexp_replace(F.col("contract_type"), r"\s+", ""))
            )

            df = append_error(
                df,
                ~F.col("contract_type_normalized").isin("FIXEDPRICE", "FP"),
                "For US region, only Fixed Price (FP) contract type is allowed"
            )

            # ===============================
            # RESOURCE TYPE VALIDATION
            # ===============================
            df = append_error(
                df,
                (col("resource_type").isNull() | (trim(col("resource_type")) == "")),
                Constants.ErrorMessages.MISSING_RESOURCE_TYPE
            )

            # ===============================
            # CURRENT WORK LOCATION WARNING (NUMERIC ONLY)
            # ===============================
            df = append_warning(
                df,
                (col("current_work_location").rlike("^[0-9]+$")),
                "current_work_location",
                Constants.ErrorMessages.INVALID_CURRENT_WORK_LOCATION_FORMAT
            )

            # ===============================
            # PROGRAM MANAGER NAME WARNING
            # ===============================
            df = append_warning(
                df,
                (col("program_manager_name").isNotNull()) &
                (trim(col("program_manager_name")).rlike(r".*\d.*")),
                "program_manager_name",
                Constants.ErrorMessages.INVALID_PROGRAM_MANAGER_NAME_FORMAT
            )

            # ===============================
            # CLEANUP
            # ===============================
            df = df.drop("contract_type_normalized")


        if entity_type == "project_resource" and emp_type == "Sub Con":
            # --- fiscal_year_period (APR 2024 format) ---
            df = append_error(
                df,
                (col("fiscal_year_period").isNull() | (trim(col("fiscal_year_period")) == "")),
                Constants.ErrorMessages.MISSING_FISCAL_YEAR_PERIOD
            )
            df = append_error(
                df,
                (col("fiscal_year_period").isNotNull()) &
                (~trim(col("fiscal_year_period")).rlike(r"^[A-Za-z]{3}\s+\d{4}$")),
                Constants.ErrorMessages.INVALID_FISCAL_YEAR_PERIOD_FORMAT
            )

            # --- project_id (3–15 chars, alphanumeric + '-') ---
            df = append_error(
                df,
                (col("project_id").isNull() | (trim(col("project_id")) == "")),
                Constants.ErrorMessages.MISSING_PROJECT_ID
            )
            df = append_error(
                df,
                (col("project_id").isNotNull()) &
                ((length(trim(col("project_id"))) < 2) | (length(trim(col("project_id"))) > 15)),
                Constants.ErrorMessages.INVALID_PROJECT_ID_LENGTH
            )
            df = append_error(
                df,
                (col("project_id").isNotNull()) &
                (~trim(col("project_id")).rlike("^[A-Za-z0-9\s\-\&\.\'\,/_]+$")),
                Constants.ErrorMessages.INVALID_PROJECT_ID_FORMAT
            )    

            # --- employee (3–15 chars, any content) ---
            df = append_error(
                df,
                (col("employee").isNull() | (trim(col("employee")) == "")),
                Constants.ErrorMessages.MISSING_EMPLOYEE
            )
            df = append_error(
                df,
                (col("employee").isNotNull()) &
                ((length(trim(col("employee"))) < 3) | (length(trim(col("employee"))) > 50)),
                Constants.ErrorMessages.INVALID_EMPLOYEE_LENGTH
            )

            # --- *1000000$ (numeric with decimals, can be negative) ---
            df = append_error(
                df,
                (col("*1000000$").isNull() | (trim(col("*1000000$")) == "")),
                "Missing *1000000$"
            )
            df = append_error(
                df,
                (col("*1000000$").isNotNull()) &
                (~trim(col("*1000000$")).rlike(r"^-?\d*\.\d+$")),
                "*1000000$ must be a valid decimal (e.g., -0.01, 0.12)"
            )

            # ===============================
            # STRICT FIXED PRICE CONTRACT TYPE ✅✅✅
            # ===============================
            df = df.withColumn(
                "contract_type_normalized",
                F.upper(F.regexp_replace(F.col("contract_type"), r"\s+", ""))
            )

            df = append_error(
                df,
                ~F.col("contract_type_normalized").isin("FIXEDPRICE", "FP"),
                "For US region, only Fixed Price (FP) contract type is allowed"
            )
            df = df.drop("contract_type_normalized")
            # --- project_manager (alphabets + special chars allowed, NO digits) ---
            df = append_warning(
                df,
                (col("pgm_manager_name").isNotNull()) &
                (trim(col("pgm_manager_name")).rlike(r".*\d.*")),
                "pgm_manager_name",
                Constants.ErrorMessages.INVALID_PROGRAM_MANAGER_NAME_FORMAT
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