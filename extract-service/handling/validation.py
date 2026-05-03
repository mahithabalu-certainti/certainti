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
    get_valid_currencies,get_valid_cities,get_valid_states,get_valid_countries
)
from database.db_handler import (
    update_document_status, update_import_status,fetch_by_upload_user_id,
    get_user_details,get_upload_rid_by_document_rid,fetch_document_url,get_valid_project_types,get_valid_resource_types,
    get_valid_task_types, get_valid_task_classifications
)
from pyspark.storagelevel import StorageLevel
from constants import Constants


def validate_columns(df, account_rid, document_rid, entity_type, account_r_number, modified_by):
    try:
        # Fetch required columns dynamically
        required_columns = set(get_required_columns(entity_type, account_rid, account_r_number))
        existing_columns = set(df.columns)

        logger.info(f"✅ Required columns: {required_columns}")

        if not required_columns:
            return _handle_validation_failure(
                account_r_number, document_rid, Constants.ErrorMessages.MISSING_REQUIRED_COLUMNS,modified_by
            )

        # Check for missing columns
        missing_columns = required_columns - existing_columns
        if missing_columns:
            return _handle_validation_failure(
                account_r_number, document_rid, Constants.ErrorMessages.missing_required_columns(entity_type, missing_columns),modified_by
            )
        logger.info("✅ Column validation passed!")
        return True

    except Exception as e:
        logger.error(f"❌ Error during column validation: {str(e)}")
        raise


def _handle_validation_failure(account_r_number, document_rid, error_message, modified_by):
    """Handles validation failures by updating document and import statuses."""
    logger.error(f"❌ {error_message}")
    update_document_status(modified_by, account_r_number, document_rid, config.VALIDATION_MESSAGE_FAILURE, error_message)
    update_import_status(modified_by, account_r_number, document_rid, config.VALIDATION_MESSAGE_FAILURE, error_message)

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
        # Get validation schema for this entity type
        validation_schema = get_validate_rows(entity_type, account_rid, account_r_number)
        # 2. Entity-specific validation
        df = df.withColumn("fiscal_year", lit(fiscal_year))
        logger.info("validating required rows...")
        # 1. Required field validation
        df = validate_required_fields(df, entity_type, validation_schema, start_end_date)
        if entity_type == "resource":
             logger.info("validating optional fields for resource")
             df = validate_resource_fields(df, document_rid, entity_type, modified_by, file_path, document_url, start_end_date)
        elif entity_type == "resource_cost":
            logger.info("validating optional fields for resource_cost")
            df = validate_resource_cost(df,document_rid, entity_type, modified_by, file_path, document_url, start_end_date)
        elif entity_type == "resource_skill":
            logger.info("validating optional fields for resource_skill")
            df = validate_resource_skill_fields(df,document_rid, entity_type, modified_by, file_path, document_url, start_end_date)
        elif entity_type == "project":
            logger.info("validating optional fields for project")
            df = validate_project_fields(df,document_rid, entity_type, modified_by, file_path, document_url, start_end_date)
        elif entity_type == "project_resource":  # Default case
            logger.info("validating optional fields for project_resource")
            df = validate_project_resource_fields(df,document_rid, entity_type, modified_by, file_path, document_url, start_end_date)
        elif entity_type == "project_task":  # Default case
            logger.info("validating optional fields for project_task")
            df = validate_project_task_fields(df,document_rid, entity_type, modified_by, file_path, document_url, start_end_date)
        else:
            logger.info("Invalid Entity Type")

        logger.info("apply duplication validation...")
        # 3. duplicate validation
        df = mark_duplicate_codes(df, entity_type, start_end_date)
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

def mark_duplicate_codes(df: DataFrame, entity_type: str, start_end_date) -> DataFrame:
    try:
        logger.info("✅ Applying duplicate code check...")

        if entity_type == "resource":
            code_columns = ["resource_id"]
        elif entity_type == "project":
            code_columns = ["project_id"]
        elif entity_type == "resource_skill":
            code_columns = ["resource_id", "skill_type"]
        elif entity_type == "resource_cost":
            # Special case handled below
            return mark_resource_cost_duplicates(df)
        elif entity_type == "project_resource":
            # Special case handled below
            return mark_project_resource_duplicates(df)
        elif entity_type == "project_task":
            # Special case handled below
            return mark_project_task_duplicates(df, start_end_date)
        else:
            logger.warning(f"❌ Unknown entity type: {entity_type}")
            return df

        # Validate all code columns are present
        for col_name in code_columns:
            if col_name not in df.columns:
                logger.warning(f"❌ Column '{col_name}' missing in DataFrame")
                return df

        # Create a column to mark records to process (where error_description is null)
        df = df.withColumn("__to_process", col("error_descriptions").isNull())

        # Duplicate detection - only for records to process
        dup_window = Window.partitionBy(*code_columns)
        df = df.withColumn("dup_count", 
                          when(col("__to_process"), count("*").over(dup_window))
                          .otherwise(lit(1)))

        dup_rank_window = Window.partitionBy(*code_columns).orderBy(F.monotonically_increasing_id())
        df = df.withColumn("dup_rank", 
                          when(col("__to_process"), row_number().over(dup_rank_window))
                          .otherwise(lit(1)))

        # Mark duplicate records - only for records to process
        df = df.withColumn(
            "error_descriptions",
            when(
                (col("__to_process")) & (col("dup_rank") > 1),
                concat_ws(
                    "; ",
                    coalesce(col("error_descriptions"), lit(None)),
                    lit(f"staging:{Constants.ErrorMessages.DUPLICATE_RECORD_FOUND}")
                )
            ).otherwise(col("error_descriptions"))
        )

        return df.drop("dup_count", "dup_rank", "__to_process")

    except Exception as e:
        logger.error(f"❌ Error in mark_duplicate_codes: {str(e)}", exc_info=True)
        return df

def mark_project_resource_duplicates(df: DataFrame) -> DataFrame:
    try:
        logger.info("🔁 Starting duplicate + overlap check for project resources")

        # 1. Initial Setup
        df = df.persist(StorageLevel.MEMORY_AND_DISK)

        # 2. Date Conversion (optional dates)
        df = df.withColumn("start_date", F.to_date("start_date")) \
               .withColumn("end_date", F.to_date("end_date"))

        # 3. Error Column Setup
        df = df.withColumn(
            "error_descriptions",
            F.coalesce(F.col("error_descriptions").cast("string"), F.lit(""))
        )

        duplicate_cols = [
            "project_id",
            "resource_id",
            "resource_role",
            "start_date",
            "end_date",
            "total_experience",
            "total_hours",
            "total_cost",
            "project_resource_description"
        ]

        window_spec = Window.partitionBy(*duplicate_cols) \
                            .orderBy(F.monotonically_increasing_id())

        df = df.withColumn("dup_rank", F.row_number().over(window_spec))

        df = df.withColumn(
            "error_descriptions",
            F.when(
                F.col("dup_rank") > 1,
                F.when(
                    F.col("error_descriptions") == "",
                    F.lit("staging:Duplicate record exists")
                ).otherwise(
                    F.concat_ws("; ", F.col("error_descriptions"),
                                F.lit("staging:Duplicate record exists"))
                )
            ).otherwise(F.col("error_descriptions"))
        ).drop("dup_rank")

        # 4. Partitioning
        to_process_df = df.filter(F.col("error_descriptions") == "").persist(StorageLevel.MEMORY_AND_DISK)
        clean_df = df.filter(F.col("error_descriptions") != "").persist(StorageLevel.MEMORY_AND_DISK)

        if to_process_df.isEmpty():
            df.unpersist()
            return df

        # 5. Allow records with NULL start/end dates (no validation)
        null_date_df = to_process_df.filter(F.col("start_date").isNull() | F.col("end_date").isNull())

        dated_df = to_process_df.filter(F.col("start_date").isNotNull() & F.col("end_date").isNotNull())

        # 6. Duration & Group Hours (only for records with valid dates)
        grouped_df = (
            dated_df
            .groupBy("project_id", "resource_id", "start_date", "end_date")
            .agg(F.sum("total_hours").alias("group_total_hours"))
            .withColumn("duration_hours", 
                        (F.datediff(F.col("end_date"), F.col("start_date")) + F.lit(1)) * config.WORKING_HOURS)
        )

        base_df = dated_df.join(
            grouped_df,
            ["project_id", "resource_id", "start_date", "end_date"],
            "left"
        )

        # 7. Overlap Check
        base_df_with_id = base_df.withColumn("row_id", F.monotonically_increasing_id())

        all_possible_overlaps = (
            base_df_with_id.alias("a")
            .join(
                base_df_with_id.alias("b"),
                (F.col("a.project_id") == F.col("b.project_id")) &
                (F.col("a.resource_id") == F.col("b.resource_id")) &
                (F.col("a.row_id") != F.col("b.row_id")) &
                (F.col("a.start_date") <= F.col("b.end_date")) &
                (F.col("b.start_date") <= F.col("a.end_date"))
            )
            .select(
                "a.row_id", "b.row_id",
                "a.start_date", "a.end_date", "a.total_hours",
                "b.start_date", "b.end_date", "b.total_hours"
            )
        )

        problematic_overlaps = (
            all_possible_overlaps
            .withColumn("overlap_start", F.greatest(F.col("a.start_date"), F.col("b.start_date")))
            .withColumn("overlap_end", F.least(F.col("a.end_date"), F.col("b.end_date")))
            .withColumn("overlap_days", F.datediff(F.col("overlap_end"), F.col("overlap_start")) + F.lit(1))
            .withColumn("overlap_hours_capacity", F.col("overlap_days") * config.WORKING_HOURS)
            .filter(F.col("a.total_hours") + F.col("b.total_hours") > F.col("overlap_hours_capacity"))
            .withColumn("flagged_row_id", 
                        F.when(F.col("a.start_date") >= F.col("b.start_date"), F.col("a.row_id"))
                        .otherwise(F.col("b.row_id")))
            .select("flagged_row_id")
            .distinct()
            .withColumn("overlap_error", F.lit(Constants.ErrorMessages.OVERLAPPING_RESOURCE_DATE_RANGES))
        )

        overlap_df = problematic_overlaps.withColumnRenamed("flagged_row_id", "row_id")

        # 8. Error Detection
        processed_df = (
            base_df_with_id
            .withColumn(
                "new_errors",
                F.when(
                    (F.col("group_total_hours") > F.col("duration_hours")),
                    F.lit(Constants.ErrorMessages.CUMULATIVE_TOTAL_HOURS_EXCEEDS_AVAILABLE_HOURS)
                ).when(
                    (F.col("total_hours") > F.col("duration_hours")),
                    F.lit(Constants.ErrorMessages.RECORD_TOTAL_HOURS_EXCEEDS_AVAILABLE_HOURS)
                )
            )
        )

        # 9. Merge overlap errors
        processed_df = (
            processed_df.alias("p")
            .join(overlap_df.alias("o"),
                  F.col("p.row_id") == F.col("o.row_id"),
                  "left")
            .withColumn(
                "final_error",
                F.when(
                    F.col("o.overlap_error").isNotNull(),
                    F.concat_ws(
                        "; ",
                        F.coalesce(F.col("p.new_errors"), F.lit(None)),
                        F.coalesce(F.col("o.overlap_error"), F.lit(None))
                    )
                ).otherwise(F.col("p.new_errors"))
            )
            .withColumn(
                "error_descriptions",
                F.when(
                    F.col("final_error").isNotNull() & (F.col("final_error") != ""), 
                    F.col("final_error")
                ).otherwise(F.col("p.error_descriptions"))
            )
            .drop("group_total_hours", "duration_hours", "new_errors", "overlap_error", "final_error", "row_id", "o.row_id")
        )

        # 10. Union Results → keep records with NULL dates as-is
        result = clean_df.unionByName(processed_df).unionByName(null_date_df)

        # 11. Cleanup
        df.unpersist()
        to_process_df.unpersist()
        clean_df.unpersist()

        logger.info("✅ Duplicate + overlap check for project resources completed successfully")
        return result

    except Exception as e:
        logger.error(f"❌ Error in mark_project_resource_duplicates: {str(e)}", exc_info=True)
        raise

def mark_resource_cost_duplicates(df: DataFrame) -> DataFrame:
    """
    Mark duplicates in resource_cost based on overlapping date ranges
    for the same resource_id using Spark native operations.
    """
    try:
        # Convert to date
        df = df.withColumn("start_date", F.to_date(F.col("start_date"))) \
               .withColumn("end_date", F.to_date(F.col("end_date")))

        # Ensure error_descriptions column exists
        if "error_descriptions" not in df.columns:
            df = df.withColumn("error_descriptions", F.lit(None).cast("string"))
        else:
            df = df.withColumn("error_descriptions", F.col("error_descriptions").cast("string"))

        # Define window partitioned by resource_id
        window = Window.partitionBy("resource_id").orderBy("start_date", "end_date")

        # Add previous end date to each row
        df = df.withColumn("prev_end", F.lag("end_date").over(window))

        # Check for overlap with previous row
        df = df.withColumn(
            "has_overlap",
            F.when(
                (F.col("prev_end").isNotNull()) & 
                (F.col("start_date") < F.col("prev_end")),
                F.lit(True)
            ).otherwise(F.lit(False))
        )

        # Update error descriptions for overlapping rows
        df = df.withColumn(
            "error_descriptions",
            F.when(
                F.col("has_overlap"),
                F.lit(f"staging:{Constants.ErrorMessages.DUPLICATE_OR_OVERLAPPING_DATE_RANGE}")
            ).otherwise(F.col("error_descriptions"))
        )

        return df.drop("prev_end", "has_overlap")

    except Exception as e:
        logger.error(f"❌ Error in mark_resource_cost_duplicates: {str(e)}", exc_info=True)
        return df

def mark_project_task_duplicates(df: DataFrame, start_end_date) -> DataFrame:
    try:
        logger.info("🔁 Starting duplicate + overlap check for project tasks")

        # 1. Initial Setup
        df = df.persist(StorageLevel.MEMORY_AND_DISK)

        # 2. Date Conversion
        df = df.withColumn("task_start_date", F.to_date("task_start_date")) \
               .withColumn("task_end_date", F.to_date("task_end_date"))

        # 3. Error Column Setup
        df = df.withColumn(
            "error_descriptions",
            F.coalesce(F.col("error_descriptions").cast("string"), F.lit(""))
        )

        # 4. Partitioning
        to_process_df = df.filter(F.col("error_descriptions") == "").persist(StorageLevel.MEMORY_AND_DISK)
        clean_df = df.filter(F.col("error_descriptions") != "").persist(StorageLevel.MEMORY_AND_DISK)

        if to_process_df.isEmpty():
            df.unpersist()
            return df

        # 5. Duration & Group Hours
        grouped_df = (
            to_process_df
            .groupBy("project_id", "resource_id", "task_start_date", "task_end_date")
            .agg(F.sum("total_hours").alias("group_total_hours"))
            .withColumn("duration_hours", 
                        (F.datediff(F.col("task_end_date"), F.col("task_start_date")) + F.lit(1)) * 24)
        )

        base_df = to_process_df.join(
            grouped_df,
            ["project_id", "resource_id", "task_start_date", "task_end_date"],
            "left"
        )

        # 6. Overlap Check - More precise detection
        base_df_with_id = base_df.withColumn("row_id", F.monotonically_increasing_id())
        
        # Create a DataFrame with all possible overlaps
        all_possible_overlaps = (
            base_df_with_id.alias("a")
            .join(
                base_df_with_id.alias("b"),
                (F.col("a.project_id") == F.col("b.project_id")) &
                (F.col("a.resource_id") == F.col("b.resource_id")) &
                (F.col("a.row_id") != F.col("b.row_id")) &
                (F.col("a.task_start_date") <= F.col("b.task_end_date")) &
                (F.col("b.task_start_date") <= F.col("a.task_end_date"))
            )
            .select(
                "a.row_id", "b.row_id",
                "a.task_start_date", "a.task_end_date", "a.total_hours",
                "b.task_start_date", "b.task_end_date", "b.total_hours"
            )
        )
        
        # Calculate actual overlap and only flag problematic pairs
        # Flag only the later record in each overlap
        problematic_overlaps = (
            all_possible_overlaps
            .withColumn("overlap_start", F.greatest(F.col("a.task_start_date"), F.col("b.task_start_date")))
            .withColumn("overlap_end", F.least(F.col("a.task_end_date"), F.col("b.task_end_date")))
            .withColumn("overlap_days", F.datediff(F.col("overlap_end"), F.col("overlap_start")) + F.lit(1))
            .withColumn("overlap_hours_capacity", F.col("overlap_days") * 24)
            .filter(F.col("a.total_hours") + F.col("b.total_hours") > F.col("overlap_hours_capacity"))
            # keep only the later record as problematic
            .withColumn("flagged_row_id", 
                        F.when(F.col("a.task_start_date") >= F.col("b.task_start_date"), F.col("a.row_id"))
                        .otherwise(F.col("b.row_id")))
            .select("flagged_row_id")
            .distinct()
            .withColumn("overlap_error", F.lit(Constants.ErrorMessages.OVERLAPPING_TASK_DATE_RANGES))
        )

        overlap_df = problematic_overlaps.withColumnRenamed("flagged_row_id", "row_id")

        if start_end_date:
            fiscal_start = start_end_date.get("fiscal_start_date")
            fiscal_end = start_end_date.get("fiscal_end_date")

            if fiscal_start and fiscal_end:
                fiscal_start = fiscal_start.replace("/", "-")
                fiscal_end = fiscal_end.replace("/", "-")

        # 7. Error Detection
        processed_df = (
            base_df_with_id
            .withColumn(
                "effective_start_date",
                F.coalesce(F.col("task_start_date"), F.lit(fiscal_start).cast("date"))
            )
            .withColumn(
                "effective_end_date",
                F.coalesce(F.col("task_end_date"), F.lit(fiscal_end).cast("date"))
            )
            .withColumn(
                "actual_duration",
                F.datediff(F.col("effective_end_date"), F.col("effective_start_date")) + 1
            )
            .withColumn(
                "avg_daily_hours",
                F.col("total_hours") / F.col("actual_duration")
            )
            .withColumn(
                "new_errors",
                F.when(
                    (F.col("group_total_hours") > F.col("duration_hours")),
                    F.lit(Constants.ErrorMessages.CUMULATIVE_TOTAL_HOURS_EXCEEDS_AVAILABLE_HOURS)
                ).when(
                    (F.col("total_hours") > F.col("duration_hours")),
                    F.lit(Constants.ErrorMessages.RECORD_TOTAL_HOURS_EXCEEDS_AVAILABLE_HOURS)
                ).when(
                    # Daily hours check using effective dates
                    (F.col("avg_daily_hours") > config.WORKING_HOURS),
                    F.lit(Constants.ErrorMessages.DAILY_TOTAL_HOURS_EXCEEDS_WORKING_HOURS)
                )
            ).drop("effective_start_date", "effective_end_date", "actual_duration", "avg_daily_hours")
        )

        # 8. Merge overlap errors
        processed_df = (
            processed_df.alias("p")
            .join(overlap_df.alias("o"),
                  F.col("p.row_id") == F.col("o.row_id"),
                  "left")
            .withColumn(
                "final_error",
                F.when(
                    F.col("o.overlap_error").isNotNull(),
                    F.concat_ws(
                        "; ",
                        F.coalesce(F.col("p.new_errors"), F.lit(None)),
                        F.coalesce(F.col("o.overlap_error"), F.lit(None))
                    )
                ).otherwise(F.col("p.new_errors"))
            )
            .withColumn(
                "error_descriptions",
                F.when(
                    F.col("final_error").isNotNull() & (F.col("final_error") != ""), 
                    F.col("final_error")
                ).otherwise(F.col("p.error_descriptions"))
            )
            .drop("group_total_hours", "duration_hours", "new_errors", "overlap_error", "final_error", "row_id", "o.row_id")
        )

        # 9. Union Results
        result = clean_df.unionByName(processed_df)

        # 10. Cleanup
        df.unpersist()
        to_process_df.unpersist()
        clean_df.unpersist()

        logger.info("✅ Duplicate + overlap check completed successfully")
        return result

    except Exception as e:
        logger.error(f"❌ Critical error in duplicate/overlap check: {str(e)}", exc_info=True)
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
# Helper functions for modular validation

def apply_type_casting(df, entity_type, validation_schema):
    """Apply appropriate type casting based on validation schema."""
    if entity_type == "resource_cost":
        df = df.withColumn("start_date", to_date(col("start_date"), "yyyy-MM-dd"))
        df = df.withColumn("end_date", to_date(col("end_date"), "yyyy-MM-dd"))
        
        # Cast compensation fields to Decimal
        compensation_cols = [
            "annual_compensation", "monthly_compensation", "bi_weekly_compensation",
            "weekly_compensation", "daily_compensation", "hourly_compensation"
        ]
        for col_name in compensation_cols:
            if col_name in df.columns:
                df = df.withColumn(col_name, col(col_name).cast(DecimalType(18, 2)))
    
    # Add type casting for other entity types as needed
    return df

def validate_required_fields(df, entity_type, validation_schema, start_end_date):
    """
    Validate required fields and their limitations based on entity type.
    
    Args:
        df: Input DataFrame
        entity_type: Type of entity being validated
        validation_schema: Schema containing validation rules
        
    Returns:
        DataFrame with error messages for missing required fields and field limitations
    """
    try:
        # Initialize error column if not exists
        if "error_descriptions" not in df.columns:
            df = df.withColumn("error_descriptions", lit(None))

        logger.info(f"Entity type received: {entity_type}")
        
        # Common required fields for entities that need resource info
        if entity_type in ["resource", "resource_skill", "resource_cost", "project_resource","project_task"]:
            # Resource ID validation
            df = append_error(df, 
                            (col("resource_id").isNull() | (trim(col("resource_id")) == "")), 
                            Constants.ErrorMessages.MISSING_RESOURCE_ID)
            
            # If resource_id exists, validate its format
            df = append_error(df,
                            (col("resource_id").isNotNull()) & 
                            ((length(col("resource_id")) < 1) | (length(col("resource_id")) > 50)),
                            Constants.ErrorMessages.INVALID_RESOURCE_ID_LENGTH)
            
            df = append_error(
                df,
                (F.col("resource_id").isNotNull()) &
                (~F.col("resource_id").rlike("^[a-zA-Z0-9_.-]+$")),
                Constants.ErrorMessages.INVALID_RESOURCE_ID_FORMAT
            )
            
            # Resource Type validation (only for non-resource_skill entities)
            if entity_type not in ["resource_skill","project_resource","project_task"]:
                df = append_error(df,
                                (col("resource_type").isNull() | (trim(col("resource_type")) == "")),
                                Constants.ErrorMessages.MISSING_RESOURCE_TYPE)
                
                valid_resource_types = get_valid_resource_types()
                logger.info(f"valid_resource_types : {valid_resource_types}")
                df = append_error(df,
                                (col("resource_type").isNotNull()) & 
                                (~col("resource_type").isin(valid_resource_types)),
                                Constants.ErrorMessages.invalid_resource_type(valid_resource_types))
            
            # Organization name validation for Non-Labor and Sub Con resources (only for non-resource_skill entities)
            if "resource_organization" in df.columns and entity_type != "resource_skill":
                df = append_error(df,
                                (col("resource_type").isin(["Non-Labor", "Sub Con"])) & 
                                (col("resource_organization").isNull() | (trim(col("resource_organization")) == "")),
                                Constants.ErrorMessages.MISSING_RESOURCE_ORGANIZATION)
                
                df = append_error(df,
                                (col("resource_type").isin(["Non-Labor", "Sub Con"])) & 
                                (col("resource_organization").isNotNull()) & 
                                ((length(col("resource_organization")) < 3) | (length(col("resource_organization")) > 100)),
                                Constants.ErrorMessages.INVALID_RESOURCE_ORGANIZATION_LENGTH)
        
        # Entity-specific required fields and validations
        if entity_type == "resource_cost":
            # Validate resource_id
            df = append_error(df, 
                            (col("resource_id").isNull() | (trim(col("resource_id")) == "")), 
                            Constants.ErrorMessages.MISSING_RESOURCE_ID)

            # Validate resource_type
            df = append_error(df,
                            (col("resource_type").isNull() | (trim(col("resource_type")) == "")),
                            Constants.ErrorMessages.MISSING_RESOURCE_TYPE)

            valid_resource_types = get_valid_resource_types()
            df = append_error(df,
                            (col("resource_type").isNotNull()) &
                            (~col("resource_type").isin(valid_resource_types)),
                            Constants.ErrorMessages.invalid_resource_type(valid_resource_types))
            
            # Validate resource_organization if resource_type is not Full-Time
            df = append_error(df,
                            (col("resource_type").isNotNull()) & 
                            (col("resource_type") != "Full-Time") &
                            ((col("resource_organization").isNull()) | (trim(col("resource_organization")) == "")),
                            Constants.ErrorMessages.INVALID_RESOURCE_ORGANIZATION_FORMAT)
            
            df = append_error(df,
                            (col("resource_type").isNotNull()) & 
                            (col("resource_type") != "Full-Time") &
                            (col("resource_organization").isNotNull()) &
                            ((length(col("resource_organization")) < 3) | (length(col("resource_organization")) > 100)),
                            Constants.ErrorMessages.INVALID_RESOURCE_ORGANIZATION_LENGTH_FULL_TIME)

            # Validate effort_in_hours
            df = append_error(df,
                            (col("effort_in_hours").isNull() | (trim(col("effort_in_hours")) == "")),
                            Constants.ErrorMessages.MISSING_EFFORT_IN_HOURS)

            df = append_error(df,
                            (col("effort_in_hours").isNotNull()) &
                            (~col("effort_in_hours").rlike(r'^\d+(\.\d+)?$')),
                            Constants.ErrorMessages.INVALID_EFFORT_IN_HOURS)

            df = append_error(df,
                            (col("effort_in_hours").isNotNull()) &
                            ((col("effort_in_hours") < 0) | (col("effort_in_hours") > 9999999999999999)),
                            Constants.ErrorMessages.INVALID_EFFORT_IN_HOURS_RANGE)

            df = append_error(
                df,
                (col("resource_type") == "Full-Time") &
                ((col("salary").isNull()) | (trim(col("salary")) == "")),
                Constants.ErrorMessages.MISSING_SALARY_FOR_FULL_TIME
            )

            df = append_error(
                df,
                (col("resource_type") != "Full-Time") &
                ((col("resource_cost").isNull()) | (trim(col("resource_cost")) == "")),
                Constants.ErrorMessages.MISSING_COST_FOR_NON_FULL_TIME
            )

            df = append_error(df,
                            (col("resource_cost").isNotNull()) &
                            (~col("resource_cost").rlike(r'^\d+(\.\d+)?$')),
                            Constants.ErrorMessages.INVALID_RESOURCE_COST)

            df = append_error(df,
                            (col("resource_cost").isNotNull()) &
                            ((col("resource_cost") < 0) | (col("resource_cost") > 9999999999999999.99)),
                            Constants.ErrorMessages.INVALID_RESOURCE_COST_RANGE)

        
        if entity_type == "resource_skill":
            # Skill Type validation
            df = append_error(df,
                            (col("skill_type").isNull() | (trim(col("skill_type")) == "")),
                            Constants.ErrorMessages.MISSING_SKILL_TYPE)
            
            df = append_error(df,
                            (col("skill_type").isNotNull()) & 
                            ((length(col("skill_type")) < 3) | (length(col("skill_type")) > 64)),
                            Constants.ErrorMessages.INVALID_SKILL_TYPE_LENGTH)
            
            df = append_error(df,
                            (col("skill_type").isNotNull()) & 
                            (~col("skill_type").rlike("^^[a-zA-Z][a-zA-Z .'/&_'-]*[a-zA-Z]$")),
                            Constants.ErrorMessages.INVALID_SKILL_TYPE_FORMAT)
        
        if entity_type == "project":
            # # Fiscal year validation (always applied)
            # valid_years = [str(datetime.now().year - i) for i in range(20)]
            # df = append_error(
            #     df,
            #     (col("fiscal_year").isNotNull()) & (~col("fiscal_year").cast("string").isin(valid_years)),
            #     "Invalid fiscal year"
            # )
            # Project ID validation
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
                (~trim(col("project_id")).rlike("^[A-Za-z0-9\s\-\&\.\'\,/_]+$")),
                Constants.ErrorMessages.INVALID_PROJECT_ID_FORMAT
            )
            
            # Project Type validation
            projects = df.select("project_type").distinct().collect()
            logger.info(f"projects : {projects}")
            df = append_error(
                df,
                (col("project_type").isNull() | (trim(col("project_type")) == "")),
                Constants.ErrorMessages.MISSING_PROJECT_TYPE
            )
            
            valid_project_types = get_valid_project_types()
            logger.info(f"valid_project_types : {valid_project_types}")
            df = append_error(
                df,
                (col("project_type").isNotNull()) &
                (~trim(col("project_type")).isin(valid_project_types)),
                Constants.ErrorMessages.invalid_project_type(valid_project_types)
            )
        
        if entity_type == "project_resource":
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
                (~trim(col("project_id")).rlike("^[A-Za-z0-9\s\-\&\.\'\,/_]+$")),
                Constants.ErrorMessages.INVALID_PROJECT_ID_FORMAT
            )
            
 
        if entity_type == "project_task":
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
                (~trim(col("project_id")).rlike("^[A-Za-z0-9\s\-\&\.\'\,/_]+$")),
                Constants.ErrorMessages.INVALID_PROJECT_ID_FORMAT
            )          

        return df
    except Exception as e:
        logger.error(f"Error during row validation: {str(e)}")
        raise
def validate_resource_fields(df,document_rid, entity_type, modified_by, file_path, document_url, start_end_date):
    """
    Validate resource fields with specific limitations and constraints.
    
    Args:
        df: Input DataFrame containing resource data
        
    Returns:
        DataFrame with error messages for invalid fields
    """

    # Initialize error column if not exists
    if "warning_descriptions" not in df.columns:
        df = df.withColumn("warning_descriptions", lit(None))
    
    # Name validation (if present)
    if "resource_name" in df.columns:
        df = append_warning(df,
            (col("resource_name").isNotNull()) & 
            ((length(col("resource_name")) < 2) | (length(col("resource_name")) > 64)),"resource_name",
            Constants.ErrorMessages.INVALID_NAME_LENGTH)
        
        df = append_warning(df,
            (col("resource_name").isNotNull()) & 
            ~col("resource_name").rlike("^[A-Za-z][A-Za-z\s\-,.']{0,62}[A-Za-z]$"),"resource_name",
            Constants.ErrorMessages.INVALID_NAME_FORMAT)
    
    # Resource Org Name validation
    if "resource_organization" in df.columns:
        df = append_warning(df,
            (col("resource_organization").isNotNull()) & 
            ((length(col("resource_organization")) < 3) | (length(col("resource_organization")) > 100)),"resource_organization",
            Constants.ErrorMessages.INVALID_ORGANIZATION_LENGTH)
        
        df = append_warning(df,
            (col("resource_organization").isNotNull()) & 
            ~col("resource_organization").rlike("^[a-zA-Z0-9][a-zA-Z0-9 &.,'-]*[a-zA-Z0-9]$"),"resource_organization",
            Constants.ErrorMessages.INVALID_ORGANIZATION_FORMAT)
    
    # Role validation
    if "resource_role" in df.columns:
        df = append_warning(df,
            (col("resource_role").isNotNull()) & 
            ((length(col("resource_role")) < 3) | (length(col("resource_role")) > 64)),"resource_role",
            Constants.ErrorMessages.INVALID_ROLE_LENGTH)
        
        df = append_warning(df,
            (col("resource_role").isNotNull()) & 
            ~col("resource_role").rlike("^[a-zA-Z0-9][a-zA-Z0-9 .'-]*[a-zA-Z0-9]$"),"resource_role",
            Constants.ErrorMessages.INVALID_ROLE_FORMAT)

    # Date validations
    if "resource_start_date" in df.columns:
        projects = df.select("resource_start_date").distinct().collect()
        logger.info(f"resource_start_date : {projects}")
        df = df.withColumn("start_date_str", substring(col("resource_start_date").cast("string"), 1, 10))

        # 2. Add warning if parsing fails
        df = append_warning(
            df,
            col("start_date_str").isNotNull() &
            to_date(col("start_date_str"), "yyyy-MM-dd").isNull(),
            "resource_start_date",
            Constants.ErrorMessages.INVALID_START_DATE_FORMAT
        )

        # 3. Parse it
        df = df.withColumn("resource_start_date", to_date(col("start_date_str"), "yyyy-MM-dd"))

        # 4. Drop intermediate column
        df = df.drop("start_date_str")
        projects = df.select("resource_start_date").distinct().collect()
        logger.info(f"resource_start_date : {projects}")
        df = append_warning(df,
            (col("resource_start_date").isNotNull()) & 
            (col("resource_start_date") < lit("1950-01-01")),"resource_start_date",
            Constants.ErrorMessages.INVALID_START_DATE_BEFORE_MIN_DATE)
        df = append_warning(df,
            (col("resource_start_date").isNotNull()) & 
            (col("resource_start_date") > current_date()),"resource_start_date",
            Constants.ErrorMessages.INVALID_END_DATE_IN_FUTURE)


        
    if "resource_end_date" in df.columns:
        projects = df.select("resource_end_date").distinct().collect()
        logger.info(f"resource_end_date : {projects}")
        
        df = df.withColumn("end_date_str", substring(col("resource_end_date").cast("string"), 1, 10))

        # 2. Add warning if parsing fails
        df = append_warning(
            df,
            col("end_date_str").isNotNull() &
            to_date(col("end_date_str"), "yyyy-MM-dd").isNull(),
            "resource_end_date",
            Constants.ErrorMessages.INVALID_END_DATE_FORMAT
        )

        # 3. Parse it
        df = df.withColumn("resource_end_date", to_date(col("end_date_str"), "yyyy-MM-dd"))

        # 4. Drop intermediate column
        df = df.drop("end_date_str")
        
        projects = df.select("resource_end_date").distinct().collect()
        logger.info(f"resource_end_date : {projects}")
        df = append_warning(df,
            (col("resource_end_date").isNotNull()) & 
            (col("resource_end_date") > current_date()),"resource_end_date",
            Constants.ErrorMessages.INVALID_END_DATE_IN_FUTURE)
        
        df = append_warning(df,
            (col("resource_end_date").isNotNull()) & 
            (col("resource_end_date").isNotNull()) & 
            (col("resource_end_date") <= col("resource_start_date")),"resource_end_date",
            Constants.ErrorMessages.INVALID_END_DATE_BEFORE_START_DATE)

    # Designation validation (same as Role)
    if "resource_designation" in df.columns:
        df = append_warning(df,
            (col("resource_designation").isNotNull()) & 
            ((length(col("resource_designation")) < 3) | (length(col("resource_designation")) > 64)),"resource_designation",
            Constants.ErrorMessages.INVALID_DESIGNATION_LENGTH)
        
        df = append_warning(df,
            (col("resource_designation").isNotNull()) & 
            ~col("resource_designation").rlike("^[a-zA-Z][a-zA-Z .'-]*[a-zA-Z]$"),"resource_designation",
            Constants.ErrorMessages.INVALID_DESIGNATION_FORMAT)
    
    # Experience validation
    if "total_experience" in df.columns:
        df = append_warning(df,
            (col("total_experience").isNotNull()) & 
            ((col("total_experience") < 1) | (col("total_experience") > 99.99)),"total_experience",
            Constants.ErrorMessages.INVALID_TOTAL_YEARS_OF_EXPERIENCE)
    
    if "years_in_organization" in df.columns:
        df = append_warning(df,
            (col("years_in_organization").isNotNull()) & 
            ((col("years_in_organization") < 1) | (col("years_in_organization") > 99.99)),"years_in_organization",
            Constants.ErrorMessages.INVALID_TOTAL_YEARS_IN_ORGANIZATION)
    # resource_city validation
    if "resource_city" in df.columns:
        df = append_warning(df,
            (col("resource_city").isNotNull()) & 
            (length(col("resource_city")) > 50),"resource_city",
            Constants.ErrorMessages.INVALID_RESOURCE_CITY_LENGTH)
        # cities = [row['resource_city'] for row in df.select("resource_city").distinct().collect() if row['resource_city']]
        cities = clean_column_values(df, "resource_city")
        if cities:
            valid_cities = get_valid_cities(cities)
            
            df = append_warning(df,
                (col("resource_city").isNotNull()) & 
                (~col("resource_city").isin(valid_cities)),
                "resource_city",
                Constants.ErrorMessages.INVALID_RESOURCE_CITY)
            
    # resource_country validation
    if "resource_country" in df.columns:
        df = append_warning(df,
            (col("resource_country").isNotNull()) & 
            (length(col("resource_country")) > 50),"resource_country",
            Constants.ErrorMessages.INVALID_RESOURCE_COUNTRY_LENGTH)
        
        countries = clean_column_values(df, "resource_country")
        if countries:
            valid_countries = get_valid_countries(countries)
            logger.info(f"valid_countries--{valid_countries}")
            if not valid_countries:
                df = append_warning(df,
                    (col("resource_country").isNotNull()),
                    "resource_country",
                    Constants.ErrorMessages.INVALID_RESOURCE_COUNTRY)
        
    # resource_state_province validation
    if "resource_state_province" in df.columns:
        df = append_warning(df,
            (col("resource_state_province").isNotNull()) & 
            (length(col("resource_state_province")) > 50),"resource_state_province",
            Constants.ErrorMessages.INVALID_RESOURCE_STATE_PROVINCE_LENGTH)
        # states = [row['resource_state_province'] for row in df.select("resource_state_province").distinct().collect() if row['resource_state_province']]
        states = clean_column_values(df, "resource_state_province")
        logger.info(f"states--{states}")
        if states:
            valid_states = get_valid_states(states)
            logger.info(f"valid_states--{valid_states}")
            if not valid_states:
                df = append_warning(df,
                    (col("resource_state_province").isNotNull()),
                    "resource_state_province",
                    Constants.ErrorMessages.INVALID_RESOURCE_STATE_PROVINCE)

    # Comments validation
    if "comments" in df.columns:
        df = append_warning(df,
            (col("comments").isNotNull()) & 
            (length(col("comments")) > 2000),"comments",
            Constants.ErrorMessages.INVALID_COMMENT_LENGTH)
    return df

def validate_resource_cost(df,document_rid, entity_type, modified_by, file_path, document_url, start_end_date):
    """
    Validate resource_cost fields only when values are present.
    Skips validation for null/empty values (all fields treated as optional).
    """
    # Initialize warning column if not exists
    if "warning_descriptions" not in df.columns:
        df = df.withColumn("warning_descriptions", lit(None))

        # Resource Org Name validation
    if "resource_organization" in df.columns:
        df = append_warning(df,
            (col("resource_organization").isNotNull()) & 
            ((length(col("resource_organization")) < 3) | (length(col("resource_organization")) > 100)),"resource_organization",
            Constants.ErrorMessages.INVALID_ORGANIZATION_LENGTH)
        
        df = append_warning(df,
            (col("resource_organization").isNotNull()) & 
            ~col("resource_organization").rlike("^[a-zA-Z0-9][a-zA-Z0-9 &.,'-]*[a-zA-Z0-9]$"),"resource_organization",
            Constants.ErrorMessages.INVALID_ORGANIZATION_FORMAT)
    
    # Currency validation (only if value exists)
    if "currency" in df.columns:
        df = append_warning(df, 
                          (col("currency").isNotNull()) & (length(col("currency")) != 3),"currency", 
                          Constants.ErrorMessages.INVALID_CURRENCY_LENGTH)
    
    # Date validations (only if values exist)
    if "start_date" in df.columns:
        df = append_warning(
            df,
            (col("start_date").isNotNull()) &
            (to_date(col("start_date"), "yyyy-MM-dd").isNull()),
            "start_date",
            Constants.ErrorMessages.INVALID_START_DATE_FORMAT
        )

        df = df.withColumn("start_date", to_date(col("start_date"), "yyyy-MM-dd"))

        df = append_warning(
            df,
            (col("start_date").isNotNull()) & 
            (col("fiscal_year").cast("int") == datetime.now().year) & 
            (col("start_date") > current_date()),
            "start_date",
            Constants.ErrorMessages.START_DATE_IN_FUTURE
        )

        # Apply fiscal year boundary check if available
        if start_end_date:
            fiscal_start = start_end_date.get("fiscal_start_date")
            fiscal_end = start_end_date.get("fiscal_end_date")

            if fiscal_start and fiscal_end:
                fiscal_start = fiscal_start.replace("/", "-")
                fiscal_end = fiscal_end.replace("/", "-")

                df = append_warning(
                    df,
                    (col("start_date").isNotNull()) &
                    (
                        (col("start_date") < to_date(lit(fiscal_start), "yyyy-MM-dd")) |
                        (col("start_date") > to_date(lit(fiscal_end), "yyyy-MM-dd"))
                    ),
                    "start_date",
                    Constants.ErrorMessages.START_DATE_NOT_WITHIN_FISCAL_YEAR
                )


    if "end_date" in df.columns:
        df = append_warning(
            df,
            (col("end_date").isNotNull()) &
            (to_date(col("end_date"), "yyyy-MM-dd").isNull()),
            "end_date",
            Constants.ErrorMessages.INVALID_END_DATE_FORMAT
        )
        
        df = df.withColumn("end_date", to_date(col("end_date"), "yyyy-MM-dd"))

        df = append_warning(
            df,
            (col("end_date").isNotNull()) & 
            (col("start_date").isNotNull()) & 
            (col("end_date") < col("start_date")),
            "end_date",
            Constants.ErrorMessages.END_DATE_BEFORE_START_DATE
        )

        df = append_warning(
            df,
            (col("end_date").isNotNull()) & 
            (col("fiscal_year").cast("int") == datetime.now().year) & 
            (col("end_date") > current_date()),
            "end_date",
            Constants.ErrorMessages.END_DATE_IN_FUTURE
        )

        # Apply fiscal year boundary check if available
        if start_end_date:
            fiscal_start = start_end_date.get("fiscal_start_date")
            fiscal_end = start_end_date.get("fiscal_end_date")

            if fiscal_start and fiscal_end:
                fiscal_start = fiscal_start.replace("/", "-")
                fiscal_end = fiscal_end.replace("/", "-")

                df = append_warning(
                    df,
                    (col("end_date").isNotNull()) &
                    (
                        (col("end_date") < to_date(lit(fiscal_start), "yyyy-MM-dd")) |
                        (col("end_date") > to_date(lit(fiscal_end), "yyyy-MM-dd"))
                    ),
                    "end_date",
                    Constants.ErrorMessages.END_DATE_NOT_WITHIN_FISCAL_YEAR
                )

    numeric_fields = {
        "salary": {"min": 0, "max": 9999999999999999.99, "decimal": True},
        "bonus": {"min": 0, "max": 9999999999999999.99, "decimal": True},
        "insurance": {"min": 0, "max": 9999999999999999.99, "decimal": True},
        "deductions": {"min": 0, "max": 9999999999999999.99, "decimal": True}
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
                Constants.ErrorMessages.invalid_numeric_range_res_cost(field, rules)
            )

    
    # Comments validation (only if value exists)
    if "comments" in df.columns:
        df = append_warning(df,
                          (col("comments").isNotNull()) & 
                          (length(col("comments")) > 2000),"comments",
                          Constants.ErrorMessages.INVALID_COMMENT_LENGTH)

    if "resource_type" in df.columns:
        # For Salary
        df = append_warning(
            df,
            (col("resource_type").isin("Sub Con", "Non-Labor")) & col("salary").isNotNull(),
            "salary",
            Constants.ErrorMessages.SUBCON_NON_LABOR_INVALID_SALARY
        )

        # For Bonus
        df = append_warning(
            df,
            (col("resource_type").isin("Sub Con", "Non-Labor")) & col("bonus").isNotNull(),
            "bonus",
            Constants.ErrorMessages.SUBCON_NON_LABOR_INVALID_BONUS
        )

        # For Insurance
        df = append_warning(
            df,
            (col("resource_type").isin("Sub Con", "Non-Labor")) & col("insurance").isNotNull(),
            "insurance",
            Constants.ErrorMessages.SUBCON_NON_LABOR_INVALID_INSURANCE
        )
    return df

def validate_resource_skill_fields(df,document_rid, entity_type, modified_by, file_path, document_ur, start_end_date):
    """
    Validate resource_skill fields only when values are present (all fields optional except required ones).
    Skip resource_id and resource_type validation as they're already handled.
    """
    logger.info("Starting validation for resource_skill fields...")
    
    # Initialize error column if not exists
    if "error_descriptions" not in df.columns:
        df = df.withColumn("error_descriptions", lit(None))
    
    if "resource_type" in df.columns:
        valid_resource_types = get_valid_resource_types()
        logger.info(f"valid_resource_types : {valid_resource_types}")
        df = append_warning(df,
                        (col("resource_type").isNotNull()) & 
                        (~col("resource_type").isin(valid_resource_types)),
                        "resource_type",
                        Constants.ErrorMessages.invalid_resource_type(valid_resource_types))
    # Start Date validation (optional)
    if "start_date" in df.columns:
        projects = df.select("start_date").distinct().collect()
        logger.info(f"start_date : {projects}")

        df = df.withColumn("start_date_str", substring(col("start_date").cast("string"), 1, 10))

        # 2. Add warning if parsing fails
        df = append_warning(
            df,
            col("start_date_str").isNotNull() &
            to_date(col("start_date_str"), "yyyy-MM-dd").isNull(),
            "start_date",
            Constants.ErrorMessages.INVALID_START_DATE_FORMAT
        )

        # 3. Parse it
        df = df.withColumn("start_date", to_date(col("start_date_str"), "yyyy-MM-dd"))

        # 4. Drop intermediate column
        df = df.drop("start_date_str")

        
        df = append_warning(df, 
                          (col("start_date").isNotNull()) & (col("start_date") > current_date()),"start_date", 
                          Constants.ErrorMessages.START_DATE_IS_IN_FUTURE)
    
        # Add warning if start_date is before 1950-01-01
        df = append_warning(
            df,
            (col("start_date").isNotNull()) & (col("start_date") < lit("1950-01-01")),
            "start_date",
            Constants.ErrorMessages.START_DATE_BEFORE_MIN_DATE
        )
    
    # Skill Level validation (optional)
    if "skill_level" in df.columns:
        valid_levels = ["Beginner", "Intermediate", "Advanced"]
        df = append_warning(df,
            (col("skill_level").isNotNull()) & 
            (~col("skill_level").isin(valid_levels)), "skill_level",
            Constants.ErrorMessages.invalid_skill_level(valid_levels))
    
    # Comments validation (optional)
    if "comments" in df.columns:
        df = append_warning(df,
            (col("comments").isNotNull()) & 
            (length(col("comments")) > 2000), "comments",
            Constants.ErrorMessages.INVALID_COMMENT_LENGTH)
    
    # Only validate format when value exists
    optional_text_fields = {
        "skill_subtype": {
            "min_len": 3,
            "max_len": 64,
            "regex": "^[a-zA-Z][a-zA-Z .'/&_'-]*[a-zA-Z]$",
            "message":  Constants.ErrorMessages.INVALID_SKILL_SUBTYPE_FORMAT
        },
        "skill_details": {
            "max_len": 2000,
            "message":  Constants.ErrorMessages.INVALID_SKILL_DETAILS_LENGTH
        }
    }
    
    for field, rules in optional_text_fields.items():
        if field in df.columns:
            # Length validation
            if 'min_len' in rules and 'max_len' in rules:
                df = append_warning(df,
                    (col(field).isNotNull()) & 
                    ((length(col(field)) < rules['min_len']) | (length(col(field)) > rules['max_len'])), field,
                    Constants.ErrorMessages.invalid_length(field, rules))
            elif 'max_len' in rules:
                df = append_warning(df,
                    (col(field).isNotNull()) & 
                    (length(col(field)) > rules['max_len']), field,
                    rules['message'])
            
            # Format validation
            if 'regex' in rules:
                df = append_warning(df,
                    (col(field).isNotNull()) & 
                    (~col(field).rlike(rules['regex'])), field,
                    rules['message'])
    
    logger.info("Validation for resource_skill fields completed.")
    return df

def validate_project_fields(df,document_rid, entity_type, modified_by, file_path, document_ur, start_end_date):
    """
    Validate project fields only when values are present.
    All fields are treated as optional except required ones which are handled elsewhere.
    """
    # Initialize warning column if not exists
    if "warning_descriptions" not in df.columns:
        df = df.withColumn("warning_descriptions", lit(None))

    # Name validation
    if "project_name" in df.columns:
        df = append_warning(
            df,
            col("project_name").isNotNull() &
            ((length(col("project_name")) < 3) | (length(col("project_name")) > 255)),
            "project_name",
            Constants.ErrorMessages.INVALID_NAME_LENGTH
        )
        allowed_pattern = r"^.{2,255}$"

        df = append_warning(
            df,
            col("project_name").isNotNull() & ~col("project_name").rlike(allowed_pattern),
            "project_name",
            Constants.ErrorMessages.NAME_CONTAINS_INVALID_CHARS
        )
    logger.info("Finished project_name validation")
    # Industry validation
    if "industry" in df.columns:
        df = append_warning(
            df,
            (col("industry").isNotNull()) &
            ((length(col("industry")) < 3) | (length(col("industry")) > 255)),
            "industry",
            Constants.ErrorMessages.INDUSTRY_LENGTH
        )
        df = append_warning(
            df,
            (col("industry").isNotNull()) &
            ~col("industry").rlike("^[a-zA-Z0-9][a-zA-Z0-9 &.,'-]*[a-zA-Z0-9]$"),
            "industry",
            Constants.ErrorMessages.INDUSTRY_CONTAINS_INVALID_CHARS
        )
    logger.info("Finished industry validation")
    if "fiscal_year" in df.columns:
        df = df.withColumn("fiscal_start", to_date(concat_ws("-", col("fiscal_year").cast("string"), lit("01"), lit("01"))))
        df = df.withColumn("fiscal_end", to_date(concat_ws("-", col("fiscal_year").cast("string"), lit("12"), lit("31"))))

    # Start Date Validation
    if "start_date" in df.columns:
        projects = df.select("start_date").distinct().collect()
        logger.info(f"start_date : {projects}")

        # Extract and normalize date string
        df = df.withColumn("start_date_str", substring(col("start_date").cast("string"), 1, 10))

        # 1. Invalid format
        df = append_warning(
            df,
            (col("start_date_str").isNotNull()) &
            (to_date(col("start_date_str"), "yyyy-MM-dd").isNull()),
            "start_date",
            Constants.ErrorMessages.INVALID_START_DATE_FORMAT
        )

        # 2. Parse into proper date
        df = df.withColumn("start_date", to_date(col("start_date_str"), "yyyy-MM-dd")).drop("start_date_str")

        # 3. Minimum allowed date
        df = append_warning(
            df,
            (col("start_date").isNotNull()) & (col("start_date") < lit("1950-01-01")),
            "start_date",
            Constants.ErrorMessages.START_DATE_BEFORE_MIN_DATE
        )

        # 4. Future date check
        df = append_warning(
            df,
            (col("start_date").isNotNull()) & (col("start_date") > current_date()),
            "start_date",
            Constants.ErrorMessages.INVALID_START_DATE_IN_FUTURE
        )

        # 5. Fiscal year boundary check (from dict)
        if start_end_date:
            fiscal_start = start_end_date.get("fiscal_start_date")  # "2025-04-01"
            fiscal_end = start_end_date.get("fiscal_end_date")      # "2026-03-31"

            if fiscal_start and fiscal_end:
                fiscal_start = fiscal_start.replace("/", "-")
                fiscal_end = fiscal_end.replace("/", "-")

                df = append_warning(
                    df,
                    (col("start_date").isNotNull()) &
                    ((col("start_date") < to_date(lit(fiscal_start), "yyyy-MM-dd")) |
                    (col("start_date") > to_date(lit(fiscal_end), "yyyy-MM-dd"))),
                    "start_date",
                    Constants.ErrorMessages.START_DATE_NOT_WITHIN_FISCAL_YEAR
                )

    logger.info("Finished start_date validation")


    # End Date Validation
    if "end_date" in df.columns:
        # Extract and normalize
        df = df.withColumn("end_date_str", substring(col("end_date").cast("string"), 1, 10))

        # 1. Invalid format
        df = append_warning(
            df,
            (col("end_date_str").isNotNull()) &
            (to_date(col("end_date_str"), "yyyy-MM-dd").isNull()),
            "end_date",
            Constants.ErrorMessages.INVALID_END_DATE_FORMAT
        )

        # 2. Parse
        df = df.withColumn("end_date", to_date(col("end_date_str"), "yyyy-MM-dd")).drop("end_date_str")

        # 3. End date before start date
        df = append_warning(
            df,
            (col("end_date").isNotNull()) & (col("start_date").isNotNull()) & (col("end_date") <= col("start_date")),
            "end_date",
            Constants.ErrorMessages.END_DATE_BEFORE_START_DATE
        )

        # 4. Future date check
        df = append_warning(
            df,
            (col("end_date").isNotNull()) & (col("end_date") > current_date()),
            "end_date",
            Constants.ErrorMessages.INVALID_END_DATE_IN_FUTURE
        )

        # 5. Fiscal year boundary check (from dict)
        if start_end_date:
            fiscal_start = start_end_date.get("fiscal_start_date")  # "2025-04-01"
            fiscal_end = start_end_date.get("fiscal_end_date")      # "2026-03-31"

            if fiscal_start and fiscal_end:
                fiscal_start = fiscal_start.replace("/", "-")
                fiscal_end = fiscal_end.replace("/", "-")

                df = append_warning(
                    df,
                    (col("end_date").isNotNull()) &
                    ((col("end_date") < to_date(lit(fiscal_start), "yyyy-MM-dd")) |
                    (col("end_date") > to_date(lit(fiscal_end), "yyyy-MM-dd"))),
                    "end_date",
                    Constants.ErrorMessages.INVALID_END_DATE_NOT_WITHIN_FISCAL_YEAR
                )

            
    logger.info("Finished end_date validation")
    df = df.drop("fiscal_start", "fiscal_end")
    # Project Type validation
    if "project_type" in df.columns:
        valid_types = get_valid_project_types()
        df = append_warning(
            df,
            (col("project_type").isNotNull()) & (~col("project_type").isin(valid_types)),
            "project_type",
            Constants.ErrorMessages.invalid_project_type(valid_types)
        )

    # Regex patterns
    INTEGER_REGEX = r'^\d+$'
    DECIMAL_REGEX = r'^-?(?:\d+(?:\.\d+)?|\.\d+)$'
    numeric_fields = {
        "total_fte_count": {"min": 0, "max": 999999999, "decimal": False},
        "total_sub_con_count": {"min": 0, "max": 999999999, "decimal": False},
        "total_non_labor_count": {"min": 0, "max": 999999999, "decimal": False},
        "total_hours": {"min": 0, "max": 9999999999999999, "decimal": True},
        "total_cost": {"min": -9999999999999999.99, "max": 9999999999999999.99, "decimal": True},
        "total_fte_effort_in_hrs": {"min": 0, "max": 9999999999999999, "decimal": True},
        "total_sub_con_effort_in_hrs": {"min": 0, "max": 9999999999999999, "decimal": True},
        "total_fte_cost": {"min": -9999999999999999.99, "max": 9999999999999999.99, "decimal": True},
        "total_sub_con_cost": {"min": -9999999999999999.99, "max": 9999999999999999.99, "decimal": True},
        "total_non_labor_cost": {"min": -9999999999999999.99, "max": 9999999999999999.99, "decimal": True}
    }

    for field, rules in numeric_fields.items():
        if field not in df.columns:
            continue

        regex = DECIMAL_REGEX if rules.get("decimal") else INTEGER_REGEX

        # ------------------------------------------------
        # 1️⃣ Invalid numeric format (special chars, text)
        # ------------------------------------------------
        invalid_format_cond = (
            col(field).isNotNull() &
            (~col(field).cast("string").rlike(regex))
        )

        df = append_warning(
            df,
            invalid_format_cond,
            field,
            f"{field} contains special characters or invalid numeric format"
        )

        df = df.withColumn(
            field,
            when(invalid_format_cond, lit(None)).otherwise(col(field))
        )

        # ------------------------------------------------
        # 2️⃣ Numeric range validation (SAFE for decimal(18,2))
        # ------------------------------------------------
        min_val = rules["min"]
        max_val = rules["max"]

        range_cond = (
            col(field).isNotNull() &
            (
                (col(field).cast("double") < lit(min_val)) |
                (col(field).cast("double") > lit(max_val))
            )
        )

        df = append_warning(
            df,
            range_cond,
            field,
            Constants.ErrorMessages.invalid_numeric_range(
                field, min_val, max_val
            )
        )

    required_cols = ["total_fte_cost", "total_sub_con_cost", "total_non_labor_cost", "total_cost"]
    if all(c in df.columns for c in required_cols):
        # Compute correct total only if any component is non-null
        EPSILON = 0.01
        correct_total = (
            F.when(
                F.col("total_fte_cost").isNotNull() |
                F.col("total_sub_con_cost").isNotNull() |
                F.col("total_non_labor_cost").isNotNull(),
                (
                    F.coalesce(F.col("total_fte_cost"), F.lit(0)) +
                    F.coalesce(F.col("total_sub_con_cost"), F.lit(0)) +
                    F.coalesce(F.col("total_non_labor_cost"), F.lit(0))
                )
            ).otherwise(F.col("total_cost"))
        )

        # ✅ Use tolerance instead of direct comparison
        df = append_warning(
            df,
            (
                (F.col("total_fte_cost").isNotNull() |
                F.col("total_sub_con_cost").isNotNull() |
                F.col("total_non_labor_cost").isNotNull()) &
                (F.abs(correct_total - F.col("total_cost")) > EPSILON)
            ),
            "total_cost",
            Constants.ErrorMessages.INVALID_TOTAL_COST
        )

        df = df.withColumn("total_cost", correct_total)

    EPSILON = 0.01  # small tolerance to avoid float rounding errors
    required_hours = ["total_fte_effort_in_hrs", "total_sub_con_effort_in_hrs", "total_hours"]
    if all(c in df.columns for c in required_hours):
        for c in required_hours:
            df = df.withColumn(c, F.col(c).cast("double"))
        correct_hours = (
            F.when(
                F.col("total_fte_effort_in_hrs").isNotNull() |
                F.col("total_sub_con_effort_in_hrs").isNotNull(),
                (
                    F.coalesce(F.col("total_fte_effort_in_hrs"), F.lit(0)) +
                    F.coalesce(F.col("total_sub_con_effort_in_hrs"), F.lit(0))
                )
            ).otherwise(F.col("total_hours"))  # keep old value if both are null
        )

        df = append_warning(
            df,
            (
                (F.col("total_fte_effort_in_hrs").isNotNull() |
                F.col("total_sub_con_effort_in_hrs").isNotNull()) &
                (F.abs(correct_hours - F.col("total_hours")) > EPSILON)
            ),
            "total_hours",
            Constants.ErrorMessages.INVALID_TOTAL_HOURS_SUM
        )

        df = df.withColumn("total_hours", correct_hours)
    if "country" in df.columns and "project_client_group" in df.columns:
        df = append_error(
            df,
            (
                (lower(trim(col("country"))).isin(["united kingdom", "uk", "gbr"]))  # country is UK
                & (
                    col("project_client_group").isNull()
                    | (length(trim(col("project_client_group"))) == 0)
                )
            ),
            Constants.ErrorMessages.UK_CLIENT_GROUP_MANDATORY
        )
    # Text fields
    text_fields = {
        "description": {"max_len": 2000},
        "comments": {"max_len": 2000},
        "program_name": {"min_len": 4, "max_len": 255, "regex": "^[a-zA-Z0-9][a-zA-Z0-9 &.,'_-]*[a-zA-Z0-9]$"},
        "project_client_group": {"min_len": 4, "max_len": 255, "regex": "^[a-zA-Z0-9][a-zA-Z0-9 &.,'_-]*[a-zA-Z0-9]$"},
        "project_group": {"min_len": 4, "max_len": 255, "regex": "^[a-zA-Z0-9][a-zA-Z0-9 &.,'_-]*[a-zA-Z0-9]$"}
    }

    for field, rules in text_fields.items():
        if field in df.columns:
            # Business rule: client_group mandatory for UK
            if "min_len" in rules:
                df = append_warning(
                    df,
                    (col(field).isNotNull()) & (length(col(field)) < rules["min_len"]),
                    field,
                    Constants.ErrorMessages.invalid_min_length(field, rules)
                )
            elif "max_len" in rules:
                df = append_warning(
                    df,
                    (col(field).isNotNull()) & (length(col(field)) > rules["max_len"]),
                    field,
                    Constants.ErrorMessages.invalid_max_length(field, rules)
                )
            if "regex" in rules:
                df = append_warning(
                    df,
                    (col(field).isNotNull()) & ~col(field).rlike(rules["regex"]),
                    field,
                    Constants.ErrorMessages.invalid_format(field)
                )

    if "city" in df.columns:
        df = append_warning(df,
            (col("city").isNotNull()) & 
            (length(col("city")) > 50),"city",
            Constants.ErrorMessages.INVALID_CITY_LENGTH)
        # cities = [row['city'] for row in df.select("city").distinct().collect() if row['city']]
        cities = clean_column_values(df, "city")
        if cities:
            valid_cities = get_valid_cities(cities)
            
            df = append_warning(df,
                (col("city").isNotNull()) & 
                (~col("city").isin(valid_cities)),
                "city",
                Constants.ErrorMessages.INVALID_CITY)
            
    # resource_country validation
    if "country" in df.columns:
        df = append_warning(df,
            (col("country").isNotNull()) & 
            (length(col("country")) > 50),"country",
            Constants.ErrorMessages.INVALID_COUNTRY_LENGTH)
        countries = clean_column_values(df, "country")
        if countries:
            valid_countries = get_valid_countries(countries)
            logger.info(f"valid_countries--{valid_countries}")
            if not valid_countries:
                df = append_warning(df,
                    (col("country").isNotNull()),
                    "country",
                    Constants.ErrorMessages.INVALID_COUNTRY)
        
    # resource_state_province validation
    if "region" in df.columns:
        df = append_warning(df,
            (col("region").isNotNull()) & 
            (length(col("region")) > 50),"region",
            Constants.ErrorMessages.INVALID_REGION_LENGTH)
        # states = [row['region'] for row in df.select("region").distinct().collect() if row['region']]
        states = clean_column_values(df, "region")
        if states:
            valid_states = get_valid_states(states)
            logger.info(f"valid_state--{valid_states}")
            if not valid_states:
                df = append_warning(df,
                    (col("region").isNotNull()),
                    "region",
                    Constants.ErrorMessages.INVALID_REGION)


    # Point of Contact
    if "point_of_contact" in df.columns:
        df = append_warning(
            df,
            (col("point_of_contact").isNotNull()) & ((length(col("point_of_contact")) < 2) | (length(col("point_of_contact")) > 128)),
            "point_of_contact",
            Constants.ErrorMessages.INVALID_CONTACT_NAME_LENGTH
        )
        df = append_warning(
            df,
            (col("point_of_contact").isNotNull()) & ~col("point_of_contact").rlike("^[a-zA-Z][a-zA-Z '-]*[a-zA-Z]$"),
            "point_of_contact",
            Constants.ErrorMessages.INVALID_CONTACT_NAME
        )

    # Email fields
    for email_field in ["point_of_contact_email", "project_tech_poc_email"]:
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

    # Mobile number fields
    for mobile_field in ["project_tech_poc_mobile", "point_of_contact_mobile"]:
        if mobile_field in df.columns:
            df = append_warning(
                df,
                (col(mobile_field).isNotNull()) & ~col(mobile_field).rlike(r"^\d{10,15}$"),
                mobile_field,
                Constants.ErrorMessages.invalid_mobile_length(mobile_field)
            )

    # Description fields
    for desc_field in ["project_description", "detailed_description"]:
        if desc_field in df.columns:
            df = append_warning(
                df,
                (col(desc_field).isNotNull()) & (length(col(desc_field)) > 2000),
                desc_field,
                Constants.ErrorMessages.invalid_desc_length(desc_field)
            )

    # Currency validation
    if "currency" in df.columns:
        df = append_warning(
            df,
            (col("currency").isNotNull()) & (length(col("currency")) != 3),
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

    # Organization/Name fields
    for org_field in ["project_manager", "project_lead", "project_tech_poc_name"]:
        if org_field in df.columns:
            df = append_warning(
                df,
                (col(org_field).isNotNull()) & ((length(col(org_field)) < 2) | (length(col(org_field)) > 255)),
                org_field,
                Constants.ErrorMessages.invalid_org_length(org_field)
            )

            df = append_warning(
                df,
                (col(org_field).isNotNull()) & ~col(org_field).rlike("^[a-zA-Z0-9][a-zA-Z0-9 &.,'_-]*[a-zA-Z0-9]$"),
                org_field,
                Constants.ErrorMessages.invalid_org_format(org_field)
            )

    return df


def validate_project_resource_fields(df,document_rid, entity_type, modified_by, file_path, document_ur, start_end_date):
    """
    Validate project resource fields only when values are present.
    All fields are treated as optional except required ones which are handled elsewhere.
    """
    # Initialize warning column if not exists
    if "warning_descriptions" not in df.columns:
        df = df.withColumn("warning_descriptions", lit(None))
    
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
            ~col("resource_name").rlike("^[A-Za-z][A-Za-z\s\-,.']{0,62}[A-Za-z]$"),
            "resource_name",
            Constants.ErrorMessages.INVALID_RESOURCE_NAME
        )

    if "resource_type" in df.columns:
        valid_resource_types = get_valid_resource_types()
        logger.info(f"valid_resource_types : {valid_resource_types}")
        df = append_warning(df,
                        (col("resource_type").isNotNull()) & 
                        (~col("resource_type").isin(valid_resource_types)),
                        "resource_type",
                        Constants.ErrorMessages.invalid_resource_type(valid_resource_types))
    if "project_type" in df.columns:
            valid_project_types = get_valid_project_types()
            logger.info(f"valid_project_types : {valid_project_types}")
            df = append_warning(
                df,
                (col("project_type").isNotNull()) &
                (~trim(col("project_type")).isin(valid_project_types)),
                "project_type",
                Constants.ErrorMessages.invalid_project_type(valid_project_types)
            )
    # Organization/Designation/Role fields validation
    for field in ["resource_designation", "resource_role"]:
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
            
            pattern = "^[a-zA-Z0-9][a-zA-Z0-9 .'-]*[a-zA-Z0-9]$"
            df = append_warning(
                df,
                (col(field).isNotNull()) & 
                ~col(field).rlike(pattern),
                field,
                Constants.ErrorMessages.invalid_format(field)
            )
    # Start Date Validation
    if "start_date" in df.columns:
        projects = df.select("start_date").distinct().collect()
        logger.info(f"start_date : {projects}")

        # Extract and normalize date string
        df = df.withColumn("start_date_str", substring(col("start_date").cast("string"), 1, 10))

        # 1. Invalid format
        df = append_warning(
            df,
            (col("start_date_str").isNotNull()) &
            (to_date(col("start_date_str"), "yyyy-MM-dd").isNull()),
            "start_date",
            Constants.ErrorMessages.INVALID_START_DATE_FORMAT
        )

        # 2. Parse into proper date
        df = df.withColumn("start_date", to_date(col("start_date_str"), "yyyy-MM-dd")).drop("start_date_str")

        # 3. Minimum allowed date
        df = append_warning(
            df,
            (col("start_date").isNotNull()) & (col("start_date") < lit("1950-01-01")),
            "start_date",
            Constants.ErrorMessages.START_DATE_BEFORE_MIN_DATE
        )

        # 4. Future date check
        df = append_warning(
            df,
            (col("start_date").isNotNull()) & (col("start_date") > current_date()),
            "start_date",
            Constants.ErrorMessages.INVALID_START_DATE_IN_FUTURE
        )

        # 5. Fiscal year boundary check (from dict)
        if start_end_date:
            fiscal_start = start_end_date.get("fiscal_start_date")  # "2025-04-01"
            fiscal_end = start_end_date.get("fiscal_end_date")      # "2026-03-31"

            if fiscal_start and fiscal_end:
                fiscal_start = fiscal_start.replace("/", "-")
                fiscal_end = fiscal_end.replace("/", "-")

                df = append_warning(
                    df,
                    (col("start_date").isNotNull()) &
                    ((col("start_date") < to_date(lit(fiscal_start), "yyyy-MM-dd")) |
                    (col("start_date") > to_date(lit(fiscal_end), "yyyy-MM-dd"))),
                    "start_date",
                    Constants.ErrorMessages.START_DATE_NOT_WITHIN_FISCAL_YEAR
                )

    logger.info("Finished start_date validation")

    # End Date Validation
    if "end_date" in df.columns:
        # Extract and normalize
        df = df.withColumn("end_date_str", substring(col("end_date").cast("string"), 1, 10))

        # 1. Invalid format
        df = append_warning(
            df,
            (col("end_date_str").isNotNull()) &
            (to_date(col("end_date_str"), "yyyy-MM-dd").isNull()),
            "end_date",
            Constants.ErrorMessages.INVALID_END_DATE_FORMAT
        )

        # 2. Parse
        df = df.withColumn("end_date", to_date(col("end_date_str"), "yyyy-MM-dd")).drop("end_date_str")

        # 3. End date before start date
        df = append_warning(
            df,
            (col("end_date").isNotNull()) & (col("start_date").isNotNull()) & (col("end_date") <= col("start_date")),
            "end_date",
            Constants.ErrorMessages.END_DATE_BEFORE_START_DATE
        )

        # 4. Future date check
        df = append_warning(
            df,
            (col("end_date").isNotNull()) & (col("end_date") > current_date()),
            "end_date",
            Constants.ErrorMessages.INVALID_END_DATE_IN_FUTURE
        )

        # 5. Fiscal year boundary check (from dict)
        if start_end_date:
            fiscal_start = start_end_date.get("fiscal_start_date")  # "2025-04-01"
            fiscal_end = start_end_date.get("fiscal_end_date")      # "2026-03-31"

            if fiscal_start and fiscal_end:
                fiscal_start = fiscal_start.replace("/", "-")
                fiscal_end = fiscal_end.replace("/", "-")

                df = append_warning(
                    df,
                    (col("end_date").isNotNull()) &
                    ((col("end_date") < to_date(lit(fiscal_start), "yyyy-MM-dd")) |
                    (col("end_date") > to_date(lit(fiscal_end), "yyyy-MM-dd"))),
                    "end_date",
                    Constants.ErrorMessages.INVALID_END_DATE_NOT_WITHIN_FISCAL_YEAR
                )

    
    # Numeric field validations
    # Regex patterns
    INTEGER_REGEX = r'^\d+$'
    DECIMAL_REGEX = r'^-?\d+(\.\d+)?$'   # ✅ allows optional leading minus

    numeric_fields = {
        "total_experience": {"min": 0, "max": 99.99, "decimal": True},
        "total_cost": {"min": -9999999999999999.99, "max": 9999999999999999.99, "decimal": True}
    }

    for field, rules in numeric_fields.items():
        if field in df.columns:
            regex = DECIMAL_REGEX if rules.get("decimal") else INTEGER_REGEX

            # 1️⃣ Invalid numeric format (special chars, text)
            invalid_format_cond = (
                col(field).isNotNull() &
                (~col(field).cast("string").rlike(regex))
            )

            df = append_warning(
                df,
                invalid_format_cond,
                field,
                Constants.ErrorMessages.invalid_numeric_value(field)
            )

            df = df.withColumn(
                field,
                when(invalid_format_cond, lit(None)).otherwise(col(field))
            )

            # 2️⃣ Numeric range validation (SAFE for decimal(18,2))
            # ------------------------------------------------
            min_val = rules["min"]
            max_val = rules["max"]

            range_cond = (
                col(field).isNotNull() &
                ((col(field).cast("double") < lit(min_val)) |
                (col(field).cast("double") > lit(max_val)))
            )

            df = append_warning(
                df,
                range_cond,
                field,
                Constants.ErrorMessages.invalid_numeric_range(field, min_val, max_val)
            )
    
    # Text field validations
    text_fields = {
        "project_description": {"max_len": 2000},
        "project_resource_description": {"max_len": 2000}
    }
    
    for field, rules in text_fields.items():
        if field in df.columns:
            df = append_warning(
                df,
                (col(field).isNotNull()) & 
                (length(col(field)) > rules["max_len"]),
                field,
                Constants.ErrorMessages.invalid_max_length(field, rules)
            )
    
    # Location fields validation
    for location_field in ["resource_country", "resource_state_province", "resource_city"]:
        if location_field in df.columns:
            df = append_warning(
                df,
                (col(location_field).isNotNull()) & 
                (length(col(location_field)) > 50),
                location_field,
                Constants.ErrorMessages.invalid_location_length(location_field)
            )
    
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
            

    if "total_hours" in df.columns:
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
    
    return df

def validate_project_task_fields(df,document_rid, entity_type, modified_by, file_path, document_ur, start_end_date):
    """
    Validate project task fields only when values are present.
    All fields are treated as optional except required ones which are handled elsewhere.
    """
    # Initialize warning column if not exists
    if "warning_descriptions" not in df.columns:
        df = df.withColumn("warning_descriptions", lit(None))
    
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
            ~col("resource_name").rlike("^[A-Za-z][A-Za-z\s\-,.']{0,62}[A-Za-z]$"),
            "resource_name",
            Constants.ErrorMessages.INVALID_RESOURCE_NAME
        )
    if "project_name" in df.columns:
        df = append_warning(
            df,
            col("project_name").isNotNull() &
            ((length(col("project_name")) < 3) | (length(col("project_name")) > 255)),
            "project_name",
            Constants.ErrorMessages.INVALID_NAME_LENGTH
        )

        df = append_warning(
            df,
            col("project_name").isNotNull() & ~col("project_name").rlike("^.{2,255}$"),
            "project_name",
            Constants.ErrorMessages.NAME_CONTAINS_INVALID_CHARS
        )

    if "project_type" in df.columns:
            valid_project_types = get_valid_project_types()
            logger.info(f"valid_project_types : {valid_project_types}")
            df = append_warning(
                df,
                (col("project_type").isNotNull()) &
                (~trim(col("project_type")).isin(valid_project_types)),
                "project_type",
                Constants.ErrorMessages.invalid_project_type(valid_project_types)
            )
    # Organization/Designation/Role fields validation
    for field in ["resource_designation", "resource_role"]:
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
            
            pattern = "^[a-zA-Z0-9][a-zA-Z0-9 .'-]*[a-zA-Z0-9]$"
            df = append_warning(
                df,
                (col(field).isNotNull()) & 
                ~col(field).rlike(pattern),
                field,
                Constants.ErrorMessages.invalid_format(field)
            )

    if "task_start_date" in df.columns:
        projects = df.select("task_start_date").distinct().collect()
        logger.info(f"task_start_date : {projects}")

        # 1. Extract string (yyyy-MM-dd part only)
        df = df.withColumn("task_start_date_str", substring(col("task_start_date").cast("string"), 1, 10))

        # 2. Add error if format invalid
        df = append_warning(
            df,
            col("task_start_date_str").isNotNull() &
            to_date(col("task_start_date_str"), "yyyy-MM-dd").isNull(),
            "task_start_date",
            Constants.ErrorMessages.INVALID_TASK_START_DATE_FORMAT
        )

        # 3. Parse to proper date
        df = df.withColumn("task_start_date", to_date(col("task_start_date_str"), "yyyy-MM-dd"))

        # 4. Drop intermediate column
        df = df.drop("task_start_date_str")

        # 5. Check if date is in the future
        df = append_warning(
            df,
            (col("task_start_date").isNotNull()) & (col("task_start_date") > current_date()),
            "task_start_date",
            Constants.ErrorMessages.TASK_START_DATE_IN_FUTURE
        )

        # 6. Check if date is before minimum allowed (1950-01-01)
        df = append_warning(
            df,
            (col("task_start_date").isNotNull()) & (col("task_start_date") < lit("1950-01-01")),
            "task_start_date",
            Constants.ErrorMessages.TASK_START_DATE_BEFORE_MIN_DATE
        )

        # 7. Fiscal year validation (using full yyyy-MM-dd from start_end_date)
        if start_end_date:
            fiscal_start = start_end_date.get("fiscal_start_date")  # e.g. "2025-04-01"
            fiscal_end = start_end_date.get("fiscal_end_date")      # e.g. "2026-03-31"

            if fiscal_start and fiscal_end:
                # Start date before fiscal start
                df = append_warning(
                    df,
                    (col("task_start_date").isNotNull()) &
                    (col("task_start_date") < to_date(lit(fiscal_start), "yyyy-MM-dd")),
                    "task_start_date",
                    Constants.ErrorMessages.START_DATE_BEFORE_FISCAL_YEAR
                )

                # Start date after fiscal end
                df = append_warning(
                    df,
                    (col("task_start_date").isNotNull()) &
                    (col("task_start_date") > to_date(lit(fiscal_end), "yyyy-MM-dd")),
                    "task_start_date",
                    Constants.ErrorMessages.TASK_START_DATE_NOT_WITHIN_FISCAL_YEAR
                )

    if "task_end_date" in df.columns:
        projects = df.select("task_end_date").distinct().collect()
        logger.info(f"task_end_date : {projects}")

        # 1. Extract string (yyyy-MM-dd part only)
        df = df.withColumn("task_end_date_str", substring(col("task_end_date").cast("string"), 1, 10))

        # 2. Add error if format invalid
        df = append_warning(
            df,
            col("task_end_date_str").isNotNull() &
            to_date(col("task_end_date_str"), "yyyy-MM-dd").isNull(),
            "task_end_date",
            Constants.ErrorMessages.INVALID_TASK_END_DATE_FORMAT
        )

        # 3. Parse to proper date
        df = df.withColumn("task_end_date", to_date(col("task_end_date_str"), "yyyy-MM-dd"))

        # 4. Drop intermediate column
        df = df.drop("task_end_date_str")

        # 5. Check if date is in the future
        df = append_warning(
            df,
            (col("task_end_date").isNotNull()) & (col("task_end_date") > current_date()),
            "task_end_date",
            Constants.ErrorMessages.TASK_END_DATE_IN_FUTURE
        )

        # 6. Check if date is before minimum allowed (1950-01-01)
        df = append_warning(
            df,
            (col("task_end_date").isNotNull()) & (col("task_end_date") < lit("1950-01-01")),
            "task_end_date",
            Constants.ErrorMessages.TASK_END_DATE_BEFORE_MIN_DATE
        )

        # 7. Fiscal year validation (using full yyyy-MM-dd from start_end_date)
        if start_end_date:
            fiscal_start = start_end_date.get("fiscal_start_date")  # e.g. "2025-04-01"
            fiscal_end = start_end_date.get("fiscal_end_date")      # e.g. "2026-03-31"

            if fiscal_start and fiscal_end:
                # Start date before fiscal start
                df = append_warning(
                    df,
                    (col("task_end_date").isNotNull()) &
                    (col("task_end_date") < to_date(lit(fiscal_start), "yyyy-MM-dd")),
                    "task_end_date",
                    Constants.ErrorMessages.END_DATE_BEFORE_FISCAL_YEAR
                )

                # Start date after fiscal end
                df = append_warning(
                    df,
                    (col("task_end_date").isNotNull()) &
                    (col("task_end_date") > to_date(lit(fiscal_end), "yyyy-MM-dd")),
                    "task_end_date",
                    Constants.ErrorMessages.TASK_END_DATE_NOT_WITHIN_FISCAL_YEAR
                )

    if "total_hours" in df.columns:
        df = append_warning(df,
            (col("total_hours").isNull() | (trim(col("total_hours")) == "")),
            "total_hours",
            "Missing total_hours")
        
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

    # 1. End date must be after start date
    if "task_start_date" in df.columns:
        df = append_warning(
            df,
            (col("task_end_date").isNotNull()) &
            (col("task_start_date").isNotNull()) &
            (col("task_end_date") < col("task_start_date")),
            "task_end_date",
            Constants.ErrorMessages.TASK_END_DATE_BEFORE_START_DATE
        )

    # 2. End date must fall inside fiscal start & end
    if "fiscal_start" in df.columns and "fiscal_end" in df.columns:
        df = append_warning(
            df,
            (col("task_end_date").isNotNull()) &
            ((col("task_end_date") < col("fiscal_start")) |
             (col("task_end_date") > col("fiscal_end"))),
            "task_end_date",
            Constants.ErrorMessages.TASK_END_DATE_NOT_WITHIN_FISCAL_YEAR
        )

    # 3. Future check (only if fiscal_year = current year)
    current_year = datetime.now().year
    df = append_warning(
        df,
        (col("task_end_date").isNotNull()) &
        (col("fiscal_year").cast("int") == current_year) &
        (col("task_end_date") > current_date()),
        "task_end_date",
        Constants.ErrorMessages.TASK_END_DATE_IN_FUTURE
    )

    logger.info("✅ Finished task_end_date validation")

    if start_end_date:
        fiscal_end = start_end_date.get("fiscal_end_date")
        logger.info(f"fiscal_end : {fiscal_end}")
        if fiscal_end:
            fiscal_end = fiscal_end.replace("/", "-")
            df = append_warning(
                df,
                (col("task_end_date").isNotNull()) &
                (col("task_end_date") > to_date(
                    concat_ws("-", col("fiscal_year").cast("string"), lit(fiscal_end)),
                    "yyyy-MM-dd"
                )),
                "task_end_date",
                Constants.ErrorMessages.TASK_END_DATE_BEFORE_FISCAL_YEAR_END_DATE
            )
    
    # Numeric field validations
    # Regex patterns
    INTEGER_REGEX = r'^\d+$'
    DECIMAL_REGEX = r'^-?\d+(\.\d+)?$'   # ✅ allows optional leading minus

    numeric_fields = {
        "total_experience": {"min": 0.0, "max": 99.99, "decimal": True},
        "total_cost": {"min": -9999999999999999.99, "max": 9999999999999999.99, "decimal": True}
    }

    for field, rules in numeric_fields.items():
        if field in df.columns:
            regex = DECIMAL_REGEX if rules.get("decimal") else INTEGER_REGEX

            # 1️⃣ Invalid numeric format (special chars, text)
            invalid_format_cond = (
                col(field).isNotNull() &
                (~col(field).cast("string").rlike(regex))
            )

            df = append_warning(
                df,
                invalid_format_cond,
                field,
                Constants.ErrorMessages.invalid_numeric_value(field)
            )

            df = df.withColumn(
                field,
                when(invalid_format_cond, lit(None)).otherwise(col(field))
            )

            # 2️⃣ Numeric range validation (using float)
            min_val = rules["min"]
            max_val = rules["max"]

            range_cond = (
                col(field).isNotNull() &
                ((col(field).cast("double") < lit(min_val)) |
                (col(field).cast("double") > lit(max_val)))
            )

            df = append_warning(
                df,
                range_cond,
                field,
                Constants.ErrorMessages.invalid_numeric_range(field, min_val, max_val)
            )

    
    # Text field validations
    text_fields = {
        "project_description": {"max_len": 2000},
        "resource_task_description": {"max_len": 2000},
        "task_description": {"max_len": 2000}
    }
    
    for field, rules in text_fields.items():
        if field in df.columns:
            df = append_warning(
                df,
                (col(field).isNotNull()) & 
                (length(col(field)) > rules["max_len"]),
                field,
                Constants.ErrorMessages.invalid_max_length(field, rules)
            )
    
    # Location fields validation
    for location_field in ["resource_country", "resource_state_province", "resource_city"]:
        if location_field in df.columns:
            df = append_warning(
                df,
                (col(location_field).isNotNull()) & 
                (length(col(location_field)) > 50),
                location_field,
                Constants.ErrorMessages.invalid_location_length(location_field)
            )
    
    if "task_name" in df.columns:
        df = append_warning(
            df,
            col("task_name").isNotNull() &
            ((length(col("task_name")) < 4) | (length(col("task_name")) > 255)),
            "task_name",
            Constants.ErrorMessages.INVALID_NAME_LENGTH
        )
        allowed_pattern = r"^[a-zA-Z0-9][a-zA-Z0-9 &.,'_-]{2,253}[a-zA-Z0-9]$"

        df = append_warning(
            df,
            col("task_name").isNotNull() & ~col("task_name").rlike(allowed_pattern),
            "task_name",
            Constants.ErrorMessages.NAME_CONTAINS_INVALID_CHARS
        )

    if "task_type" in df.columns:
            valid_task_types = get_valid_task_types()
            logger.info(f"valid_task_types : {valid_task_types}")
            df = append_warning(
                df,
                (col("task_type").isNotNull()) &
                (~trim(col("task_type")).isin(valid_task_types)),
                "task_type",
                Constants.ErrorMessages.invalid_task_type(valid_task_types)
            )
    
    if "task_classification" in df.columns:
            valid_task_classifications = get_valid_task_classifications()
            logger.info(f"valid_task_classifications : {valid_task_classifications}")
            df = append_warning(
                df,
                (col("task_classification").isNotNull()) &
                (~trim(col("task_classification")).isin(valid_task_classifications)),
                "task_classification",
                Constants.ErrorMessages.invalid_task_classification(valid_task_classifications)
            )
    
    return df


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

def validate_columns_exist(df, entity_type, account_rid, account_r_number):
    """
    Ensure all expected columns from validation_schema exist in df.
    Returns False if any column is missing or if extra columns are present.
    """
    validation_schema = get_validate_rows(entity_type, account_rid, account_r_number)
    expected_columns = set(validation_schema.keys())
    logger.info(f"expected_columns: {expected_columns}")
    df_columns = set(df.columns)
    logger.info(f"df_columns: {df_columns}")

    missing_columns = expected_columns - df_columns
    extra_columns = df_columns - expected_columns

    logger.info(f"missing_columns: {missing_columns}")
    logger.info(f"extra_columns: {extra_columns}")

    if missing_columns or extra_columns:
        return False

    logger.info("✅ All required columns are present and no extra columns found.")
    return True
