import pandas as pd
import pyspark.sql.functions as F
from pyspark.sql import SparkSession
from pyspark.sql.functions import col
from pyspark.sql.types import DecimalType,StringType,StructField,StructType
from handling.blob_file import download_blob_from_url, upload_csv, generate_blob_path
from datetime import datetime
from services.customisation.Mastek_UK.db_handler import store_data,update_document_status,update_import_status, get_file_name_from_db
from services.customisation.Mastek_UK.validation import validate_columns,validate_columns_exist,validate_rows
import os
import json
import numpy as np
from logger.logger import logger
from kafka_process.kafka_producer import send_to_kafka
from config import config
from database.db_handler import (
    update_document_status, update_import_status,fetch_by_upload_user_id,
    get_user_details,get_upload_rid_by_document_rid,fetch_document_url
)
from pyspark.storagelevel import StorageLevel

LOCAL_FAILED_ROWS_FOLDER = "Failed_Files"

# ERROR_FOLDER = "Error"

def get_spark_session():
    spark = SparkSession.builder \
        .appName("ETL-Extract") \
        .config("spark.jars", "/app/jars/postgresql-42.7.2.jar") \
        .config("spark.port.maxRetries", "100") \
        .getOrCreate()
    spark.conf.set("spark.sql.legacy.timeParserPolicy", "LEGACY")
    return spark


# def move_to_error_folder(file_path):
#     if not os.path.exists(ERROR_FOLDER):
#         os.makedirs(ERROR_FOLDER)  # Create folder if not exists

#     destination = os.path.join(ERROR_FOLDER, os.path.basename(file_path))
#     shutil.move(file_path, destination)
#     logger.error(f"❌ File moved to Error folder: {destination}")

def delete_file(file_path):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"🧹 Deleted file: {file_path}")
    except Exception as e:
        print(f"⚠️ Could not delete file: {e}")

def read_excel_with_spark(file_path, entity_type):
    try:
        if entity_type == 'resource_cost':
            sheet_name = 1
        else:
            sheet_name = 0
        # Step 1: Read Excel with pandas, forcing all columns as strings
        pdf = pd.read_excel(
            file_path,
            sheet_name= sheet_name,
            header=0,  
            engine='openpyxl',
            dtype=str,  # Force all columns to be read as strings
            keep_default_na=False,
            na_values=["", " ", "NaN", "nan"]
        )

        pdf.columns = pdf.columns.str.strip()

        # Step 2: Ensure all columns are strings and handle nulls
        for col in pdf.columns:
            pdf[col] = pdf[col].astype(str)
            pdf[col] = pdf[col].replace(['nan', 'None', 'NULL', ''], None)

        # Step 3: Initialize Spark session
        spark = SparkSession.builder \
            .appName("ExcelReader") \
            .config("spark.sql.execution.arrow.pyspark.enabled", "true") \
            .getOrCreate()

        # Step 4: Convert to Spark DataFrame with all StringType columns
        schema = StructType([StructField(col, StringType()) for col in pdf.columns])
        sdf = spark.createDataFrame(pdf, schema=schema)

        return sdf

    except Exception as e:
        print(f"Error reading Excel file: {e}")
        raise

def load_column_mapping(document_entity):
    base_path = os.path.dirname(os.path.abspath(__file__))
    mapping_file = os.path.join(base_path, "..", "..", "..", "schema", "columns_mapping_mastek.json")

    with open(mapping_file, "r") as f:
        all_mappings = json.load(f)
    
    if document_entity in all_mappings:
        return {k.lower(): v.lower() for k, v in all_mappings[document_entity].items()}
    else:
        raise ValueError(f"No column mapping found for document_entity: {document_entity}")


def store_invalid_file_to_blob(file_path, document_rid, entity_type, account_r_number, is_valid=False):
    """Upload invalid file to Azure Blob Storage"""
    try:
        filename = get_file_name_from_db(account_r_number,document_rid)
        blob_path = generate_blob_path(entity_type, filename)
        blob_url = upload_csv(
            container_name=account_r_number.strip().lower().replace(" ", ""),
            file_path=file_path,
            blob_path=blob_path
        )
        return blob_url
    except Exception as blob_error:
        logger.error(f"Blob upload failed: {str(blob_error)}")
        raise ValueError("Blob upload failed")

# Process file from Azure Blob Storage
def process_file(account_rid, document_rid,file_url,document_entity,account_r_number,fiscal_year, producer_id):
    user_details = None
    document_details = None
    document_url = None
    file_path = None
    entity_type = document_entity.lower().replace(" ", "_")
    customization_flag = True
    try:
        modified_by = fetch_by_upload_user_id(document_rid, account_r_number)
        user_details = get_user_details(modified_by)
        logger.info(f"user_details returned: {user_details}")
        document_name = get_upload_rid_by_document_rid(document_rid, account_r_number)
        document_url = fetch_document_url(document_rid,account_r_number)
        staging_start_timestamp = datetime.utcnow() 
        file_path = download_blob_from_url(file_url)
        # file_path = "tmp/sample_data.csv"
        # entity_type = "project"
        
        column_mapping = load_column_mapping(entity_type)

        spark = get_spark_session()

        file_extension = os.path.splitext(file_path)[-1].lower()

        if file_extension == ".csv":
            df = spark.read.option("multiLine", "true") \
                    .option("quote", "\"") \
                    .option("escape", "\"") \
                    .csv(file_path, header=True, inferSchema=True)
        elif file_extension in [".xls", ".xlsx"]:
            df = read_excel_with_spark(file_path, entity_type)
        else:
            raise ValueError("Unsupported file format! Only CSV and XLSX are allowed.")

        logger.info("✅ File read successfully. Starting validation...")

        for old_col, new_col in column_mapping.items():
            df = df.withColumnRenamed(old_col, new_col)

        # Update import table: Staging in progress
        update_import_status(modified_by,account_r_number,document_rid, config.VALIDATION_MESSAGE_PROCESS, staging_table=config.STAGING_RESOURCE_TABLE, 
                             staging_start_timestamp=staging_start_timestamp)
                             
        # Validate Columns,
        if not validate_columns(df, document_rid, column_mapping, entity_type):
            store_invalid_file_to_blob(file_path, document_rid, entity_type, account_r_number)
            update_import_status(
                modified_by,
                account_r_number,
                document_rid,
                config.VALIDATION_MESSAGE_FAILURE,
                staging_end_timestamp=datetime.utcnow(),
                staging_error="File doesn't match the template - mandatory column missing"
            )
            update_document_status(modified_by,account_r_number,document_rid, config.PRODUCED_MESSAGE_FAILURE, "File doesn't match the template- mandatory column missing")
            return  # Stop further process
        # df.show()

        # Validate each record
        df_with_status = validate_rows(df, document_rid,entity_type,account_rid,account_r_number,fiscal_year, modified_by, file_path, document_url)
        df_with_status = df_with_status.withColumn("account_rid", F.lit(account_rid))
        df_with_status = df_with_status.withColumn("document_rid", F.lit(document_rid))
        # df_with_status.show()
        df_with_status = df_with_status.persist(StorageLevel.MEMORY_AND_DISK)
        total_records = df_with_status.count()
        store_data(df_with_status, modified_by, document_rid, entity_type, account_r_number)
        total_staging_processed = df_with_status.filter(col("status") == config.VALIDATION_MESSAGE_SUCCESS).count()
        # Update status and send to Kafka
        update_import_status(modified_by,account_r_number, document_rid, config.VALIDATION_MESSAGE_SUCCESS, 
                            staging_table=config.STAGING_RESOURCE_TABLE, 
                            staging_start_timestamp=staging_start_timestamp,
                            staging_end_timestamp=datetime.utcnow(),
                            total_records=total_records,
                            total_staging_processed=total_staging_processed)
        send_to_kafka(document_rid, account_rid, entity_type, account_r_number, fiscal_year, customization_flag)

        # Unpersist to free memory
        df_with_status.unpersist()

        logger.info("✅ File processing completed successfully.")

    except Exception as e:
        error_message = f"Failed to extract and store the data to staging"
        logger.error(f"error while extracting ❌ : {e}")

        # Move file to error folder
        # move_to_error_folder(file_path)
        # store_invalid_file_to_blob(file_path, document_rid, entity_type, account_r_number)

        # Update both document and import tables with failure reason
        update_document_status(modified_by,account_r_number,document_rid, config.PRODUCED_MESSAGE_FAILURE, error_message)
        update_import_status(modified_by,account_r_number,document_rid, config.PRODUCED_MESSAGE_FAILURE, staging_table=config.STAGING_RESOURCE_TABLE, 
                             staging_start_timestamp=staging_start_timestamp,
                             staging_end_timestamp=datetime.utcnow(),
                             staging_error=error_message)
        logger.info(f"user_details from Exceptions: {user_details}")
    finally:
        delete_file(file_path)
        logger.info("deleted")