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

def validate_columns(df: DataFrame, document_rid: str, column_mapping: dict, emp_type: str) -> bool:
    """
    Validate that all mandatory columns exist in the DataFrame.
    Returns True if all mandatory columns are present, False otherwise.
    """
    try:
        # Actual columns from DataFrame
        actual_columns = set(df.columns)

        # Config-defined mandatory columns
        mandatory_columns = set(config.MANDATORY_COLUMNS_FULLTIME_CA if emp_type == "Full-Time" else config.MANDATORY_COLUMNS_SUBCON_CA)

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

            # --- emplid validations ---
            df = append_error(
                df,
                (col("emplid").isNull() | (trim(col("emplid")) == "")),
                "Missing emplid"
            )
            df = append_error(
                df,
                (col("emplid").isNotNull()) &
                ((length(trim(col("emplid"))) < 3) | (length(trim(col("emplid"))) > 15)),
                "emplid must be between 3-15 characters"
            )
            df = append_error(
                df,
                (col("emplid").isNotNull()) &
                (~trim(col("emplid")).rlike("^[A-Za-z0-9]+$")),
                "emplid contains invalid characters"
            )

            # --- month validation (expected like 'Apr2024') ---
            df = append_error(
                df,
                (col("month").isNull() | (trim(col("month")) == "")),
                "Missing month"
            )
            df = append_error(
                df,
                (col("month").isNotNull()) &
                (~trim(col("month")).rlike(r"^[A-Za-z]{3}\d{4}$")),
                "Month must be in format 'MMMYYYY' (e.g., Apr2024)"
            )

            # --- designation validation ---
            df = append_warning(
                df,
                (col("designation").isNotNull()) & 
                ((length(col("designation")) < 3) | (length(col("designation")) > 64)),
                "designation",
                Constants.ErrorMessages.invalid_length_range("designation", 3, 64)
            )
            
            df = append_warning(
                df,
                (col("designation").isNotNull()) & 
                ~col("designation").rlike("^[a-zA-Z][a-zA-Z .'-]*[a-zA-Z]$"),
                "designation",
                Constants.ErrorMessages.invalid_format("designation")
            )

            # --- gross_salary validation ---
            df = append_error(
                df,
                (col("gross_salary").isNull() | (trim(col("gross_salary")) == "")),
                "Missing gross_salary"
            )
            df = append_error(
                df,
                (col("gross_salary").isNotNull()) &
                (~trim(col("gross_salary")).rlike(r"^[0-9,]")),
                "Gross Salary must be a valid numeric with commas"
            )

            # --- work_location validation ---
            df = append_warning(
                df,
                (col("work_location").isNotNull()) & 
                (length(col("work_location")) < 2),
                "work_location",
                Constants.ErrorMessages.invalid_location_length("work_location")
            )

            # ===============================
            # STRICT US / USA REGION VALIDATION
            # ===============================
            df = append_error(
                df,
                ~(
                    F.col("work_location").rlike(r"-CA-") |
                    F.col("work_location").rlike(r"-CAN-") |
                    F.col("work_location").rlike(r"-CANADA-") |
                    F.col("work_location").rlike(r"-Canada-") |
                    F.col("work_location").rlike(r"-canada-") |
                    F.col("work_location").rlike(r"-Can-")
                ),
                "Only CA region employees are allowed for this process"
            )
            # --- project_id validation ---
            df = append_error(
                df,
                (col("project_id").isNull() | (trim(col("project_id")) == "")),
                "Missing project_id"
            )
            df = append_error(
                df,
                (col("project_id").isNotNull()) &
                ((length(trim(col("project_id"))) < 5) | (length(trim(col("project_id"))) > 50)),
                "Project ID must be between 5-50 characters"
            )
            df = append_error(
                df,
                (col("project_id").isNotNull()) &
                (~trim(col("project_id")).rlike("^[A-Za-z0-9 &.,'_-]+$")),
                "Project ID contains invalid characters"
            )


            # --- project_des validation ---
            df = append_warning(
                df,
                (col("project_des").isNotNull()) & 
                (length(col("project_des")) > 2000),
                "project_des",
                "Project Description cannot exceed 2000 characters"
            )

            # --- project_type validation ---
            valid_project_types = set(get_valid_project_types()) | {"TIME & MATERIAL", "FIXED PRICE"}
            df = append_error(
                df,
                (col("contract_type").isNull() | (trim(col("contract_type")) == "")),
                "Missing contract_type"
            )
            df = append_error(
                df,
                (col("contract_type").isNotNull()) &
                (~col("contract_type").isin(valid_project_types)),
                f"Invalid contract_type (must be one of {valid_project_types})"
            )

            # --- project_manager validation ---
            df = append_warning(
                df,
                (col("project_manager").isNotNull()) &
                (trim(col("project_manager")).rlike(r".*\d.*")),
                "project_manager",
                "Project Manager Name should not contain numbers"
            )   


        if entity_type == "project_resource" and emp_type == "Sub Con":

            # --- description validation ---
            df = append_warning(
                df,
                (col("description").isNotNull()) & 
                (length(col("description")) > 2000),
                "description",
                f"Resource Description cannot exceed 2000 characters"
            )

            # --- emp_id validations ---
            df = append_error(
                df,
                (col("emp_id").isNull() | (trim(col("emp_id")) == "")),
                "Missing emp_id"
            )
            df = append_error(
                df,
                (col("emp_id").isNotNull()) &
                ((length(trim(col("emp_id"))) < 3) | (length(trim(col("emp_id"))) > 15)),
                "emp_id must be between 3-15 characters"
            )
            df = append_error(
                df,
                (col("emp_id").isNotNull()) &
                (~trim(col("emp_id")).rlike("^[A-Za-z0-9]+$")),
                "emp_id contains invalid characters"
            )

            # --- effort_month validation (expected like '04-2024') ---

            df = append_error(
                df,
                (col("effort_month").isNull() | (trim(col("effort_month")) == "")),
                "Missing effort_month"
            )

            df = append_error(
                df,
                col("effort_month").isNotNull() &
                to_date(concat_ws("-", lit("01"), col("effort_month")), "dd-MM-yyyy").isNull(),
                Constants.ErrorMessages.INVALID_START_DATE_FORMAT
            )

            df = append_error(
                df,
                (col("effort_month").isNotNull()) & 
                (year(concat_ws("01-",col("effort_month"))) != col("fiscal_year").cast("int")),
                Constants.ErrorMessages.START_DATE_NOT_WITHIN_FISCAL_YEAR
            )

            df = append_error(
                df,
                (col("effort_month").isNotNull()) & 
                (col("fiscal_year").cast("int") == datetime.now().year) & 
                (to_date(concat_ws("01-",col("effort_month")), "dd-mm-yyyy") > current_date()),
                Constants.ErrorMessages.START_DATE_IN_FUTURE
            )

            if start_end_date and start_end_date.get("fiscal_start_date"):

                start_date = start_end_date.get("fiscal_start_date").replace("/", "-")
                df = append_error(df,
                    (col("effort_month").isNotNull()) & 
                    (to_date(concat_ws("01-",col("effort_month")), "dd-mm-yyyy") < to_date(concat_ws("-", col("fiscal_year").cast("string"), lit(start_date)), "yyyy-MM-dd")),
                    Constants.ErrorMessages.START_DATE_BEFORE_FISCAL_YEAR)

            # Currency validation (if value exists)
            if "currency" in df.columns:
                df = append_warning(
                    df,
                    (col("currency").isNotNull()) & 
                    (length(col("currency")) != 3),
                    "currency",
                    Constants.ErrorMessages.INVALID_CURRENCY_LENGTH
                )
                currencies = [row['currency'] for row in df.select("currency").distinct().collect() if row['currency']]

                if currencies:
                    valid_currencies = get_valid_currencies(currencies)

                    df = append_warning(df,
                        (col("currency").isNotNull()) & 
                        (~col("currency").isin(valid_currencies)),
                        "currency",
                        Constants.ErrorMessages.INVALID_CURRENCY)
                    
            
            if "foreign_amt" in df.columns:
                df = append_warning(
                    df,
                    (col("foreign_amt").isNotNull()) & 
                    (~col("foreign_amt").rlike(r'^\(?[0-9,]+\)?$')),
                    "foreign_amt",
                    Constants.ErrorMessages.invalid_numeric_value("foreign_amt")
                )

                df = append_warning(
                    df,
                    (col("foreign_amt").isNotNull()) & 
                    (
                        (regexp_replace(regexp_replace(trim(col("foreign_amt")), "[,()]", ""), "^\\s+|\\s+$", "").cast("double") < 0) |
                        (regexp_replace(regexp_replace(trim(col("foreign_amt")), "[,()]", ""), "^\\s+|\\s+$", "").cast("double") > 9999999999999999.99)
                    ),
                    "foreign_amt",
                    "foreign_amt must be between 0 and 9999999999999999.99"
                )


            # --- project_id (3–15 chars, alphanumeric + '-') ---
            df = append_error(
                df,
                (col("project_id").isNull() | (trim(col("project_id")) == "")),
                "Missing project_id"
            )
            df = append_error(
                df,
                (col("project_id").isNotNull()) &
                ((length(trim(col("project_id"))) < 3) | (length(trim(col("project_id"))) > 15)),
                "Project ID must be between 3-15 characters"
            )
            df = append_error(
                df,
                (col("project_id").isNotNull()) &
                (~trim(col("project_id")).rlike(r"^[A-Za-z0-9\.-]+$")),
                "Project ID must contain only letters, numbers, or '-'"
            )

            # --- project_desc validation ---
            df = append_warning(
                df,
                (col("project_desc").isNotNull()) & 
                (length(col("project_desc")) > 2000),
                "project_desc",
                "Project Description cannot exceed 2000 characters"
            )

            if "resource_type" in df.columns:
                valid_resource_types = get_valid_resource_types()
                df = append_error(df,
                    (col("resource_type").isNotNull()) & 
                    (~col("resource_type").isin(valid_resource_types)),
                    Constants.ErrorMessages.invalid_resource_type(valid_resource_types)
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