from concurrent.futures import ThreadPoolExecutor
from confluent_kafka import Consumer, KafkaException
from pyspark.sql import DataFrame
from typing import Dict, List, Optional, Any
from kafka_process.kafka_producer import KafkaResourceProducer
import pyspark.sql.functions as F
from pyspark.sql.functions import when, col, lit, expr
import json
from config import settings, config
from constants import Constants
from database.db_handler import DatabaseHandler
from logger.logger import get_logger
from handling.transform import transform_data
from typing import Dict, Any
from datetime import datetime
import uuid
import json
from email_template import get_import_completion_email_html
import os
import shutil
from pyspark.sql import SparkSession
import threading
from confluent_kafka.admin import AdminClient, NewTopic, KafkaException
import confluent_kafka
from services.trigger_ai import AIService
from services.scheduler.scheduler import SchedulerProcessor
from services.customisation.mastek_UK.file_handler import Mastek_UK_FileHandler
from services.customisation.tm_uk.file_handler import TM_UK_FileHandler
from services.customisation.tm_us.file_handler import TM_US_FileHandler
from services.customisation.tm_ca.file_handler import TM_CA_FileHandler
from services.customisation.birlasoft.file_handler import Birlasoft_FileHandler
from services.customisation.tm_ir.file_handler import TM_IR_FileHandler
from services.customisation.tm_au.file_handler import TM_AU_FileHandler
from services.customisation.tmti.file_handler import TMTI_FileHandler
from services.customisation.tm_allyis.file_handler import TM_ALLYIS_FileHandler



from services.email import EmailService

logger = get_logger(__name__)

executor = ThreadPoolExecutor(max_workers=5)  

class KafkaMessageProcessor:
    """Handles Kafka message consumption and processing for all entity types"""

    def __init__(self):
        self.db_handler = DatabaseHandler()
        self.consumer = None
        self.kafka_producer = KafkaResourceProducer()
        self.trigger_AI = AIService()
        self.Mastek_UK_FileHandler = Mastek_UK_FileHandler()
        self.TM_UK_FileHandler = TM_UK_FileHandler()
        self.TM_US_FileHandler = TM_US_FileHandler()
        self.TM_CA_FileHandler = TM_CA_FileHandler()
        self.TM_IR_FileHandler = TM_IR_FileHandler()
        self.TM_AU_FileHandler = TM_AU_FileHandler()
        self.TMTI_FileHandler = TMTI_FileHandler()
        self.TM_ALLYIS_FileHandler = TM_ALLYIS_FileHandler()
        self.Birlasoft_FileHandler = Birlasoft_FileHandler()
        self.email = EmailService()
    
    def load_entity_mappings(self) -> Dict[str, Dict[str, str]]:
        """Load and validate entity mappings from JSON file"""
        try:
            with open("schema/fiscal_mappings.json", "r") as f:
                mappings = json.load(f)
            
            if "entity_mappings" not in mappings:
                raise ValueError("JSON format incorrect: Missing 'entity_mappings' key")
            
            # Validate all required entity mappings exist
            required_entities = ["resource", "project", "project_resource"]
            for entity in required_entities:
                if entity not in mappings["entity_mappings"]:
                    raise ValueError(f"Missing mapping configuration for {entity}")
            
            return mappings["entity_mappings"]
        except Exception as e:
            raise RuntimeError(f"Failed to load entity mappings: {e}")

    def initialize_consumer(self) -> Consumer:
        """Initialize and return Confluent Kafka consumer"""
        return Consumer({
            'bootstrap.servers': config.KAFKA_BROKER,
            'group.id': config.KAFKA_GROUP_ID,
            'auto.offset.reset': config.KAFKA_AUTO_OFFSET_RESET,
            "enable.auto.commit": True,
            "max.poll.interval.ms": 600000 
        })

    def process_fiscal_data(self, transformed_data: DataFrame, entity_type: str, 
                            account_r_number: str, account_rid: str, document_id: str, fiscal_year: int, modified_by: str, dic_type: bool, parent_entity_type: Optional[str] = None ) -> bool:
        """
        Process fiscal data for the given entity type.
        Returns True if successful, False otherwise.
        """
        try:
            logger.info(f"🚀 Starting fiscal data processing for entity type: {entity_type}")

            # Map reference IDs to RIDs based on entity type
            if entity_type == "resource":
                logger.info("📌 Mapping resource reference IDs")
                df_with_rid = self.db_handler.map_resource_ref_to_rid(transformed_data, account_r_number)
            
            elif entity_type in ["project", "project_resource"]:
                logger.info(f"📌 Mapping project-related reference IDs for entity type: {entity_type}")
                # logger.info(f"transformed_data count - {transformed_data.count()}")
                df_with_rid = self.db_handler.map_entity_rid_with_data(transformed_data, entity_type, account_r_number)
                if entity_type in ["project_resource"]:
                    if "project_fiscal_rid" not in df_with_rid.columns:
                        df_with_rid = self.db_handler.map_fiscal_rid_with_data(df_with_rid, entity_type, account_r_number, fiscal_year)
                else:
                    df_with_rid = df_with_rid.withColumn("fiscal_year", lit(fiscal_year)) \
                                            .withColumn("project_rid", col("project_rid"))
                # Remove reference columns after mapping
                # for col_name in ["project_code", "resource_code"]:
                #     if col_name in df_with_rid.columns:
                #         df_with_rid = df_with_rid.drop(col_name)
                #         logger.info(f"🔍 Dropped reference column: {col_name}")


                logger.info("✅ Added fiscal attributes: fiscal_year, project_rid, is_rd_qualified")
            # Upsert into appropriate fiscal table
            logger.info("📡 Upserting fiscal data into the database...")
            logger.info("📁 Project df_with_rid Schema 01:\n%s", df_with_rid._jdf.schema().treeString())
            if dic_type:
                logger.info("📁 Project df_with_rid Schema 02:\n%s", df_with_rid._jdf.schema().treeString())
                self.db_handler.upsert_fiscal_table_project_resource(
                    df_with_rid, 
                    entity_type, 
                    account_r_number,
                    fiscal_year,
                    account_rid,
                    modified_by,
                    document_id,
                    parent_entity_type
                )
                logger.info(f"🎯 Successfully processed fiscal data for {entity_type}")
                return True
            else:
                self.db_handler.upsert_fiscal_table(
                    df_with_rid, 
                    entity_type, 
                    account_r_number,
                    fiscal_year,
                    account_rid,
                    document_id,
                    modified_by,
                    parent_entity_type
                )
                logger.info(f"🎯 Successfully processed fiscal data for {entity_type}")
                return True
            
        except Exception as e:
            logger.error(f"❌ Failed to process fiscal data for {entity_type}: {str(e)}", exc_info=True)
            return False

    def process_message(self, message: Dict[str, Any]) -> bool:
        """Process individual Kafka message for all entity types"""
        modified_by = None
        document_id = None
        entity_type = None
        account_r_number = None
        fiscal_year = None
        consumer_id = None
        dic_type = False
        try:
            # Extract message fields with validation
            required_fields = [
                'document_id', 'account_rid', 'producer_id', 
                'entity_type', 'account_r_number', 'fiscal_year'
            ]
            for field in required_fields:
                if field not in message:
                    raise ValueError(f"Missing required field: {field}")
            
            document_id = message['document_id']
            account_rid = message['account_rid']
            producer_id = message['producer_id']
            entity_type = message['entity_type']
            account_r_number = message['account_r_number']
            fiscal_year = message['fiscal_year']
            logger.info(f"Fiscal year test====================@@@@@111111> {fiscal_year}")
            
            logger.info(
                f"Processing {entity_type} message - "
                f"Document: {document_id}, Account: {account_rid}, "
                f"Account Number: {account_r_number}"
                f"Fiscal Year: {fiscal_year}"
            )

            # Update Kafka event status
            consumer_id = self.db_handler.generate_uuid()
            logger.info(f"consumer_id : {consumer_id}")
            # Get modified_by user
            modified_by = self.db_handler.fetch_by_upload_user_id(document_id, account_r_number)
            user_details = self.db_handler.get_user_details(modified_by)
            self.db_handler.update_kafka_event(
                modified_by = modified_by,
                account_r_number=account_r_number,
                producer_id=producer_id,
                consumer_id=consumer_id,
                status=config.CONSUMER_MESSAGE_SUCCESS
            )

            # Update import status
            target_load_start_timestamp = datetime.utcnow()
            self.db_handler.update_import_status(
                modified_by,
                document_id,
                config.CONSUMER_MESSAGE_PROCESS,
                account_r_number,
                None,
                target_load_start_timestamp=target_load_start_timestamp
            )

            # Get staging data
            staging_data, warning_count = self.db_handler.get_staging_records(document_id, entity_type, account_r_number)
            target_staging_processed = staging_data.count()
            if staging_data.isEmpty():
                error_msg = Constants.ErrorMessages.no_staging_data(document_id)
                self.db_handler.update_document_status(
                    modified_by,
                    document_id,
                    config.CONSUMER_MESSAGE_FAILURE,
                    account_r_number,
                    failure_reason=error_msg
                )
                self.db_handler.update_import_status(
                    modified_by,
                    document_id,
                    config.CONSUMER_MESSAGE_FAILURE,
                    account_r_number,
                    upload_failure_reason=error_msg
                )
                load_error_record_count = self.db_handler.get_load_error_record_count(
                    entity_type=entity_type,
                    document_id=document_id,
                    account_r_number=account_r_number,
                    account_rid=account_rid,
                    target_staging_processed=target_staging_processed
                )
                logger.info(f"load_error_record_count :{load_error_record_count}")
                self._process_staging_data_email(
                    document_id, 
                    entity_type, 
                    account_r_number,
                    account_rid,
                    fiscal_year,
                    modified_by,
                    user_details,
                    load_error_record_count
                )
                return True

            # Transform data
            transformed_data = transform_data(
                input_df=staging_data,
                entity_type=entity_type,
                account_rid=account_rid,
                document_rid=document_id,
                account_r_number=account_r_number,
                modified_by = modified_by,
                db_handler=self.db_handler
            )
            if transformed_data is None:
                raise ValueError("Transformed data is None")

            #getbackup and remove spoc name and email for key contact

            if entity_type == "project":

                logger.info(f"Fiscal year test====================@@@@@> {fiscal_year}")
                transformed_data = self.db_handler.filter_rd_claim_and_mark_staging_for_project(
                            transformed_data,
                            entity_type,
                            account_rid,
                            account_r_number,
                            document_id,
                            fiscal_year
                    )
                config_values = self.db_handler.get_account_ai_config(account_rid, account_r_number)
                transformed_data = self.db_handler.apply_ai_config_defaults(transformed_data, config_values)

                logger.info("✅ Applied account AI config values to transformed_data")

                transformed_data = transformed_data.withColumn("is_rd_qualified", lit(False))  # Always set to False
                key_contact_df = transformed_data
                
            # Handle multiple DataFrames 
            if isinstance(transformed_data, dict):
                for sub_entity_type, sub_df in transformed_data.items():
                    logger.info(f"sub_entity_type : {sub_entity_type}")
                    if sub_entity_type in ["project", "project_resource", "project_task"]:
                        sub_df = self.db_handler.filter_rd_claim_and_mark_staging(
                            sub_df,
                            sub_entity_type,
                            entity_type,
                            account_rid,
                            account_r_number,
                            document_id,
                            fiscal_year
                        )
                    if not sub_df.rdd.isEmpty():
                        if sub_entity_type == "project" :
                            config_values = self.db_handler.get_account_ai_config(account_rid, account_r_number)
                            sub_df = self.db_handler.apply_ai_config_defaults(sub_df, config_values)
                            logger.info("✅ Applied account AI config values to transformed_data")
                        if not self.db_handler.store_transformed_data(
                            sub_df,
                            sub_entity_type,
                            account_r_number,
                            account_rid,
                            modified_by,
                            fiscal_year,
                            document_id,
                            entity_type
                        ):
                            raise RuntimeError(f"Failed to store transformed data for {sub_entity_type}")
                        if sub_entity_type in ["resource","project","project_resource"]:
                            # sub_df.show()
                            logger.info("📁 Project sub_df Schema:\n%s", sub_df._jdf.schema().treeString())
                            dic_type = True
                            if entity_type == "project_resource" and sub_entity_type == "project_resource":
                                sub_df = self.db_handler.filter_failed_records(
                                    sub_df,
                                    entity_type,
                                    account_rid,
                                    document_id,
                                    account_r_number
                                )
                            if not sub_df.rdd.isEmpty():
                                if not self.process_fiscal_data(
                                    sub_df,
                                    sub_entity_type,
                                    account_r_number,
                                    account_rid,
                                    document_id,
                                    fiscal_year,
                                    modified_by,
                                    dic_type,
                                    entity_type
                                ):
                                    logger.error(f"Fiscal data processing failed for {sub_entity_type}, continuing...")
                            if sub_entity_type == 'project':
                                # Fetch the fiscal RID
                                account_fiscal_rid = self.db_handler.get_account_fiscal_rid(account_r_number, account_rid, fiscal_year)

                                # If not found, try to upsert and retrieve again
                                if not account_fiscal_rid:
                                    if entity_type == "project_resource":
                                        if not self.db_handler.upsert_account_fiscal_by_project_resource(account_r_number, account_rid, fiscal_year, modified_by):
                                            logger.error(f"Update account fiscal failed for {entity_type}, continuing...")
                                            logger.warning(f"⚠️ No fiscal RID found for account_rid={account_rid}, skipping mapping.")
                                    else:
                                        if not self.db_handler.upsert_account_fiscal_by_project_task(account_r_number, account_rid, fiscal_year, modified_by):
                                            logger.error(f"Update account fiscal failed for {entity_type}, continuing...")
                                            logger.warning(f"⚠️ No fiscal RID found for account_rid={account_rid}, skipping mapping.")

                                    account_fiscal_rid = self.db_handler.get_account_fiscal_rid(account_r_number, account_rid, fiscal_year)

                                # Map the fiscal RID (even if None)
                                sub_df = sub_df.withColumn("account_fiscal_rid", lit(account_fiscal_rid))
                                logger.info(f"✅ Mapped account_fiscal_rid={account_fiscal_rid} into sub_df")
                                # sub_df.show()
                                if not self.db_handler.upsert_project_summary_by_project_resource(
                                    sub_df,
                                    sub_entity_type,
                                    account_r_number,
                                    account_rid,
                                    fiscal_year,
                                    modified_by
                                ):
                                    logger.error(f"Update project summary data processing failed for {sub_entity_type}, continuing...")
                                if not self.db_handler.upsert_project_fiscal_summary_by_project_resource(
                                    sub_df,
                                    sub_entity_type,
                                    account_r_number,
                                    account_rid,
                                    fiscal_year,
                                    modified_by
                                ):
                                    logger.error(f"Update project summary fiscal data processing failed for {sub_entity_type}, continuing...")
                        if sub_entity_type in ["project_resource", "project_task"] and entity_type in ["project_resource", "project_task"]:
                            if "project_fiscal_rid" not in sub_df.columns:
                                sub_df = self.db_handler.map_fiscal_rid_with_data(sub_df, entity_type, account_r_number, fiscal_year)
                            if sub_df is None:
                                logger.error(f"❌ sub_df is None after mapping fiscal_rid for {entity_type} — skipping case aggregation")
                            else:
                                logger.info(f"✅ Mapped project_fiscal_rid into sub_df for {entity_type}")

                                # Retrieve open case projects
                                open_case_pf_df = self.db_handler.get_open_case_projects_df(account_rid, account_r_number)
                                if open_case_pf_df is None:
                                    logger.warning(f"⚠️ open_case_pf_df is None for {account_r_number} — skipping case aggregation")
                                else:
                                    logger.info(f"✅ Retrieved open_case_pf_df for {account_r_number}")

                                    # Collect distinct incoming project_fiscal_rid
                                    incoming_pf = sub_df.select("project_fiscal_rid").distinct()

                                    has_open_cases = False
                                    try:
                                        if incoming_pf is not None and open_case_pf_df is not None:
                                            has_open_cases = (
                                                incoming_pf.join(open_case_pf_df, on="project_fiscal_rid", how="inner")
                                                .limit(1)
                                                .count() > 0
                                            )
                                    except Exception as e:
                                        logger.error(f"❌ Error checking open cases: {e}")

                                    logger.info(f"✅ has_open_cases: {has_open_cases}")

                                    # Log skipped projects (not part of OPEN cases)
                                    try:
                                        if incoming_pf is not None and open_case_pf_df is not None:
                                            skipped_pf = incoming_pf.join(open_case_pf_df, on="project_fiscal_rid", how="left_anti")
                                            skipped_cnt = skipped_pf.count()
                                            if skipped_cnt > 0:
                                                logger.warning(f"[case-aggregation] ⚠️ {skipped_cnt} projects skipped — not mapped to OPEN cases")
                                    except Exception as e:
                                        logger.error(f"❌ Error computing skipped projects: {e}")

                                    # Trigger CASE aggregation only if at least one OPEN project exists
                                    if has_open_cases:
                                        logger.info("[case-aggregation] 🔄 OPEN case-project detected — running CASE aggregation")

                                        if sub_entity_type == "project_task" and entity_type == "project_task":
                                            self.db_handler.process_aggregation_case_project_task(sub_df, account_rid, account_r_number, fiscal_year)

                                        elif sub_entity_type == "project_resource" and entity_type == "project_resource":
                                            self.db_handler.process_aggregation_case_project_resource(sub_df, account_rid, account_r_number, fiscal_year)

                                    else:
                                        logger.warning("[case-aggregation] ⛔ No OPEN case-projects in this batch — CASE aggregation skipped")
                        
                        if sub_entity_type == "project_task" and entity_type == "project_task":
                            sub_df = self.db_handler.map_entity_rid_with_data(sub_df, "project_resource", account_r_number)
                            if "project_fiscal_rid" not in sub_df.columns:
                                sub_df = self.db_handler.map_fiscal_rid_with_data(sub_df, "project_resource", account_r_number, fiscal_year)
                            # sub_df.show()
                            if not self.db_handler.process_aggregation_project_task(sub_df,account_rid,account_r_number,fiscal_year):
                                raise RuntimeError(f"Failed to aggregate transformed data for {sub_entity_type}")
                            acc_country = self.db_handler.get_account_country(account_rid)
                            logger.info(f"✅ Mapped account_country={acc_country} into dataframe")
                            if acc_country:
                                payload = self.trigger_AI.send_ai_trigger_payload(
                                            sub_df,
                                            account_r_number,
                                            account_rid,
                                            entity_type,
                                            document_id,
                                            modified_by
                                            )
                                if payload:
                                    # Send success notification
                                    status_message = Constants.Messages.success_message()
                                    self.kafka_producer.send_resource_message(
                                        document_id, 
                                        account_rid, 
                                        status_message, 
                                        entity_type, 
                                        account_r_number,
                                        modified_by,
                                        payload
                                    )
                            else:
                                logger.warning(f"⛔ No account_country found for account_r_number={account_r_number}, skipping AI trigger")
                        if sub_entity_type == "project_resource" and entity_type == "project_resource":
                            sub_df = self.db_handler.map_entity_rid_with_data(sub_df, sub_entity_type, account_r_number)
                            if "project_fiscal_rid" not in sub_df.columns:
                                sub_df = self.db_handler.map_fiscal_rid_with_data(sub_df, sub_entity_type, account_r_number, fiscal_year)
                            # sub_df.show()
                            if not self.db_handler.process_aggregation_project_resource(sub_df,account_rid,account_r_number,fiscal_year):
                                raise RuntimeError(f"Failed to aggregate transformed data for {sub_entity_type}")
                            acc_country = self.db_handler.get_account_country(account_rid)
                            logger.info(f"✅ Mapped account_country={acc_country} into dataframe")
                            if acc_country:
                                payload = self.trigger_AI.send_ai_trigger_payload(
                                            sub_df,
                                            account_r_number,
                                            account_rid,
                                            entity_type,
                                            document_id,
                                            modified_by
                                            )
                                if payload:
                                    # Send success notification
                                    status_message = Constants.Messages.success_message()
                                    self.kafka_producer.send_resource_message(
                                        document_id, 
                                        account_rid, 
                                        status_message, 
                                        entity_type, 
                                        account_r_number,
                                        modified_by,
                                        payload
                                    )
                            else:
                                logger.warning(f"⛔ No account_country found for account_r_number={account_r_number}, skipping AI trigger")
                    else:
                        logger.warning(f"filtered dataframe is empty-{sub_entity_type}")
            else:
                if not self.db_handler.store_transformed_data(
                    transformed_data, 
                    entity_type, 
                    account_r_number, 
                    account_rid, 
                    modified_by,
                    fiscal_year,
                    document_id
                ):
                    raise RuntimeError(f"Failed to store transformed data for {entity_type}")

            # Process fiscal data for applicable entities
            if entity_type in ["project"]:
                if not self.process_fiscal_data(
                    transformed_data,
                    entity_type,
                    account_r_number,
                    account_rid,
                    document_id,
                    fiscal_year,
                    modified_by,
                    dic_type
                ):
                    logger.error(f"Fiscal data processing failed for {entity_type}, continuing...")
                # transformed_data.printSchema()
                if entity_type == "project":
                    # key_contact_df.printSchema()
                    if not self.db_handler.update_project_region_totals_from_fiscal(
                        account_r_number,
                        account_rid,
                        entity_type, 
                        modified_by
                    ):
                        logger.error(f"update_project_totals_from_fiscal failed for {entity_type}, continuing...")
                    if not self.db_handler.update_project_totals_from_fiscal(
                        account_r_number,
                        account_rid,
                        entity_type, 
                        modified_by
                    ):
                        logger.error(f"update_project_totals_from_fiscal failed for {entity_type}, continuing...")

            if entity_type == 'project':
                # Fetch the fiscal RID
                account_fiscal_rid = self.db_handler.get_account_fiscal_rid(account_r_number,account_rid,fiscal_year)

                # Ensure fiscal RID is valid before mapping
                if account_fiscal_rid:
                    key_contact_df = key_contact_df.withColumn("account_fiscal_rid", lit(account_fiscal_rid))
                    logger.info(f"✅ Mapped account_fiscal_rid={account_fiscal_rid} into key_contact_df")
                else:
                    logger.warning(f"⚠️ No fiscal RID found for account_rid={account_rid}, skipping mapping.")

                if not self.db_handler.upsert_project_summary(
                    key_contact_df,
                    entity_type,
                    account_r_number,
                    account_rid,
                    fiscal_year,
                    modified_by
                ):
                    logger.error(f"Update project summary data processing failed for {entity_type}, continuing...")
                if not self.db_handler.upsert_project_fiscal_summary(
                    key_contact_df,
                    entity_type,
                    account_r_number,
                    account_rid,
                    fiscal_year,
                    modified_by
                ):
                    logger.error(f"Update project summary fiscal data processing failed for {entity_type}, continuing...")
                if not self.db_handler.update_project_summary_from_fiscal_summary(
                        account_r_number,
                        account_rid,
                        entity_type, 
                        modified_by
                ):
                    logger.error(f"update_project_summary_from_fiscal_summary failed for {entity_type}, continuing...")
                if not self.db_handler.upsert_account_fiscal(
                        account_r_number,
                        account_rid,
                        fiscal_year, 
                        modified_by
                ):
                    logger.error(f"update account fiscal failed for {entity_type}, continuing...")
                if not self.db_handler.update_account_totals_from_fiscal(
                        account_r_number,
                        account_rid,
                        fiscal_year, 
                        modified_by
                ):
                    logger.error(f"update_account_totals_from_fiscal failed for {entity_type}, continuing...")
                
                logger.info("send_ai_trigger_payload started")
                acc_country = self.db_handler.get_account_country(account_rid)
                logger.info(f"✅ Mapped account_country={acc_country} into dataframe")
                if acc_country:
                    if "project_fiscal_rid" not in key_contact_df.columns:
                        key_contact_df = self.db_handler.map_fiscal_rid_with_data(key_contact_df, "project", account_r_number, fiscal_year)

                    payload = self.trigger_AI.send_ai_trigger_payload(key_contact_df,account_r_number, account_rid, entity_type, document_id, modified_by)
                    if payload:
                        # Send success notification
                        status_message = Constants.Messages.success_message()
                        self.kafka_producer.send_resource_message(
                            document_id, 
                            account_rid, 
                            status_message, 
                            entity_type, 
                            account_r_number,
                            modified_by,
                            payload
                        )
                        logger.info("send_ai_trigger_payload end")
                else:
                    logger.warning(f"⚠️ No country found for account_rid={account_rid}, skipping AI trigger payload.")
            # Update status to success
            target_load_end_timestamp = datetime.utcnow()
            logger.info(f"target_staging_processed: {target_staging_processed}")
            load_error_record_count = self.db_handler.get_load_error_record_count(
                    entity_type=entity_type,
                    document_id=document_id,
                    account_r_number=account_r_number,
                    account_rid=account_rid,
                    target_staging_processed=target_staging_processed
            )
            self.db_handler.update_import_status(
                modified_by,
                document_id,
                config.CONSUMER_MESSAGE_SUCCESS,
                account_r_number,
                load_error_record_count,
                warning_count,
                None,
                target_load_start_timestamp=target_load_start_timestamp,
                target_load_end_timestamp=target_load_end_timestamp,
                target_staging_processed=target_staging_processed
            )
            self.db_handler.update_document_status(
                modified_by,
                document_id,
                config.CONSUMER_MESSAGE_SUCCESS,
                account_r_number
            )
           
            # 1. Fetch and cache staging data
            self._process_staging_data_email(
                document_id, 
                entity_type, 
                account_r_number,
                account_rid,
                fiscal_year,
                modified_by,
                user_details,
                load_error_record_count
            )
            return True

        except Exception as e:
                logger.error(f"Error processing message: {str(e)}", exc_info=True)       
                # Update all statuses to failed
                error_msg = Constants.ErrorMessages.document_processing_failed(document_id, str(e))
                self.db_handler.update_kafka_event(
                    modified_by = modified_by,
                    account_r_number=account_r_number,
                    producer_id=producer_id,
                    consumer_id=consumer_id,
                    status=config.CONSUMER_MESSAGE_FAILURE,
                    error_description=error_msg
                )
                self.db_handler.update_document_status(
                    modified_by,
                    document_id,
                    config.CONSUMER_MESSAGE_FAILURE,
                    account_r_number,
                    failure_reason=error_msg
                )
                load_error_record_count = self.db_handler.get_load_error_record_count(
                    entity_type=entity_type,
                    document_id=document_id,
                    account_r_number=account_r_number,
                    account_rid=account_rid,
                    target_staging_processed=target_staging_processed
                )
                self.db_handler.update_import_status(
                    modified_by,
                    document_id,
                    config.CONSUMER_MESSAGE_FAILURE,
                    account_r_number,
                    load_error_record_count,
                    upload_failure_reason=error_msg
                )
                modified_by = self.db_handler.fetch_by_upload_user_id(document_id, account_r_number)
                user_details = self.db_handler.get_user_details(modified_by)
                self._process_staging_data_email(
                    document_id, 
                    entity_type, 
                    account_r_number,
                    account_rid,
                    fiscal_year,
                    modified_by,
                    user_details,
                    load_error_record_count
                )
        
    def _process_staging_data_email(self, document_id, entity_type, account_r_number, account_rid, 
                                    fiscal_year, modified_by, user_details,load_error_record_count):
        """Main function to process staging data and send email"""
        staging_data = None
        output_dir = None
        
        try:
            staging_data = self._get_and_cache_staging_data(document_id, entity_type, account_r_number)
            event = self._create_email_event(
                document_id=document_id,
                account_rid=account_rid,
                entity_type=entity_type,
                account_r_number=account_r_number,
                load_error_record_count=load_error_record_count,
                fiscal_year=fiscal_year,
                modified_by=modified_by
            )

            
            output_dir, file_name = self._setup_output_paths(entity_type, document_id)
            
            if not staging_data.rdd.isEmpty():
                self._export_data_to_csv(staging_data, output_dir)
                self._send_email_with_attachment(output_dir, file_name, event, user_details, document_id, modified_by, account_r_number)
            
            self._archive_staging_data(entity_type, document_id, account_r_number)
            logger.info(f"✅ Successfully processed {entity_type} document {document_id}")
            
        except Exception as e:
            logger.error(f"Error processing staging data email: {e}")
            raise
        finally:
            self._cleanup_resources(staging_data, output_dir)

    def _cleanup_resources(self, staging_data, output_dir):
        """Clean up temporary resources including data and directories"""
        try:
            # Clean up Spark cache
            if staging_data is not None:
                staging_data.unpersist()
                logger.debug("Unpersisted staging data")
                
            # Clean up temporary directory
            if output_dir and os.path.exists(output_dir):
                shutil.rmtree(output_dir)
                logger.info(f"✅ Successfully deleted temporary directory: {output_dir}")
                
        except Exception as e:
            logger.error(f"❌ Error during cleanup: {str(e)}")
            # Even if cleanup fails, we still want to unpersist the data
            if staging_data is not None:
                staging_data.unpersist()

    def _get_and_cache_staging_data(self, document_id, entity_type, account_r_number):
        """Retrieve and cache staging data"""
        staging_data = self.db_handler.get_staging_records_for_email(
            document_id, entity_type, account_r_number
        )
        # logger.info(f"staging_data count: {staging_data.count()}")
        return staging_data

    def _setup_output_paths(self, entity_type, document_id):
        """Set up output directory and file names"""
        output_dir = f"/tmp/{entity_type}_{document_id}"
        file_name = f"{entity_type}-{document_id}.csv"
        return output_dir, file_name

    def _export_data_to_csv(self, staging_data, output_dir):
        """Export data to CSV file"""
        logger.info("Dropping unnecessary columns...")
        staging_data = staging_data.drop(
            'account_rid', 'document_rid', 'fiscal_year', 'created_at', 'modified_at'
        )
        
        (
            staging_data
            .coalesce(1)
            .write
            .option("header", "true")
            .option("delimiter", ",")
            .mode("overwrite")
            .csv(output_dir)
        )
        logger.info(f"CSV files written to: {output_dir}")

    def _send_email_with_attachment(self, output_dir, file_name, event, user_details, document_id, modified_by, account_r_number):
        """Send email with CSV attachment"""
        if not os.path.exists(output_dir):
            logger.warning(f"Output directory {output_dir} doesn't exist")
            return
        
        csv_files = [f for f in os.listdir(output_dir) if f.startswith('part-') and f.endswith('.csv')]
        if not csv_files:
            logger.warning(f"No CSV files found in {output_dir}")
            return
        
        original_path = os.path.join(output_dir, csv_files[0])
        final_path = os.path.join(output_dir, file_name)
        shutil.move(original_path, final_path)
        
        html_content = get_import_completion_email_html(event)
        self.email.send_email_with_attachment(user_details[0], event['subject'], html_content, final_path, document_id, modified_by, account_r_number)

    def _archive_staging_data(self, entity_type, document_id, account_r_number):
        """Archive staging data after processing"""
        self.db_handler.archive_and_flush_staging_data(entity_type, document_id, account_r_number)

    def _create_email_event(self,
                            document_id: str,
                            account_rid: str,
                            entity_type: str,
                            account_r_number: str,
                            load_error_record_count: int,
                            fiscal_year: int,
                            modified_by: str) -> Dict[str, Any]:
        
        """Create email event with all required details for import completion notification"""
        # Fetch additional required data from database
        # document_name = self.db_handler.fetch_by_kafka_document_name(document_id, account_r_number) or "Unknown"
        import_stats = self.db_handler.get_import_statistics(document_id, account_r_number)
        user_details = self.db_handler.get_user_details(modified_by)
        account_name = self.db_handler.get_account_name(account_rid)
        error_summary, warning_count = self.db_handler.get_staging_records_with_errors_and_warnings(document_id, entity_type, account_r_number)
        # project_count, fiscal_count = self.db_handler.get_loaded_record_counts(document_id, account_r_number)

        # Only count mismatch as error if either table is missing records
        # min_loaded = min(project_count, fiscal_count)
        # target_load_error_record_count = max(0, str(import_stats.get('total_records', 0)) - min_loaded)

        file_name = import_stats.get('document_name', 'Unknown')
        subject = f"Data Import Status Notification - {file_name} for Account - {account_name}, Fiscal Year - FY{fiscal_year} and Entity - {entity_type}"
        
        return {
                # Basic information
                "user_name": user_details[1] if user_details else "User",
                "file_name": file_name,
                "fiscal_year":fiscal_year,
                "account_name": account_name,
                "entity": entity_type,
                "subject": subject,
                # Status information
                "status": import_stats.get('upload_status', 'Unknown'),
                "status_desc": None,
                "total_records": int(import_stats.get('total_records', 0)),
                
                # Staging information
                "staging_status": import_stats.get('staging_status', 'Unknown'),
                "staging_description": None,
                "staging_status_desc": import_stats.get('staging_status_description', 'None'),
                
                # Load information
                "entity_load_status": import_stats.get('target_load_status', 'Unknown'),
                "records_success": int(import_stats.get('records_success', 0)),
                "records_warning": int(import_stats.get('total_staging_warning_count', 0)),
                "entity_load_error_records_count":load_error_record_count,
                "records_failed": int(import_stats.get('target_load_error_records_count') or 0) +
                  (int(import_stats.get('total_records') or 0) - int(import_stats.get('total_staging_processed') or 0)),
                "error_descriptions": error_summary,
                
                # Import metadata
                "imported_by": user_details[1] if user_details else import_stats.get('modified_by', 'System'),
                "imported_on": import_stats.get('uploaded_datetime', datetime.utcnow()).strftime("%Y-%m-%d %H:%M:%S"),
                "time_taken": f"{import_stats.get('total_time_sec', 0):.2f}",
                "import_type": 'Manual Upload',
                "document_rid": document_id
            }
    
    def get_subscribed_topics(self) -> List[str]:
        """Get list of topics to subscribe to based on active entity types"""
        ENTITY_TOPIC_MAP = {
            "resource": config.KAFKA_OUTPUT_TOPIC_RESOURCE,
            "resource_cost": config.KAFKA_OUTPUT_TOPIC_RESOURCE_COST,
            "resource_skill": config.KAFKA_OUTPUT_TOPIC_RESOURCE_SKILL,
            "project": config.KAFKA_OUTPUT_TOPIC_PROJECT,
            "project_resource": config.KAFKA_OUTPUT_TOPIC_PROJECT_RESOURCE,
            "project_task": config.KAFKA_OUTPUT_TOPIC_PROJECT_TASK
        }
        return [ENTITY_TOPIC_MAP[etype] for etype in ENTITY_TOPIC_MAP]

    def consume_messages(self):
        """Main message consumption loop with parallel message processing"""
        try:
            self.consumer = self.initialize_consumer()
            topics = self.get_subscribed_topics()
            self.consumer.subscribe(topics)
            logger.info(f"Subscribed to topics: {topics}")

            with ThreadPoolExecutor(max_workers=5) as executor:
                while True:
                    msg = self.consumer.poll(timeout=1.0)
                    if msg is None:
                        continue
                    if msg.error():
                        logger.error(f"Consumer error: {msg.error()}")
                        continue

                    try:
                        message_value = json.loads(msg.value().decode('utf-8'))

                        # Submit task for parallel processing
                        executor.submit(self._safe_process_message, message_value, msg)
                    except Exception as e:
                        logger.error(f"Failed to process message: {e}", exc_info=True)

        except KafkaException as e:
            logger.critical(f"Kafka consumer error: {str(e)}", exc_info=True)
            raise
        finally:
            if self.consumer:
                self.consumer.close()
                logger.info("Kafka consumer closed")

    def create_topics(self):
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
            config.KAFKA_OUTPUT_TOPIC_PROJECT_TASK,
            config.KAFKA_AI_REQUEST_TRIGGER_TOPIC,
            config.KAFKA_AI_RESPONSE_TRIGGER_TOPIC
        ]

        new_topics = [NewTopic(topic, num_partitions=3, replication_factor=1) for topic in topics]

        fs = admin_client.create_topics(new_topics)

        for topic, f in fs.items():
            try:
                f.result()  # If no exception, topic created
                logger.info(f"✅ Topic '{topic}' created")
            except confluent_kafka.KafkaException as e:
                if e.args[0].code() == confluent_kafka.KafkaError.TOPIC_ALREADY_EXISTS:
                    logger.info(f"ℹ️ Topic '{topic}' already exists, skipping creation")
                else:
                    logger.error(f"❌ Failed to create topic {topic}: {e}")

    def _safe_process_message(self, message_value, msg):
        try:
            # Check customization_flag condition
            account_rid = message_value["account_rid"]
            account_name, country_rid, account_country = self.db_handler.get_account_details(account_rid)
            
            if self.db_handler.check_customisation_accounts(account_rid, account_name):
                # Primary country-based handlers
                if account_country == "USA":
                    if "TMTI" in account_name:
                        logger.info(f"Processing customisation for TMTI account RID: {account_rid}")
                        self.TMTI_FileHandler.process_file(message_value)
                    elif "ALLYIS" in account_name:
                        logger.info(f"Processing customisation for TM_ALLYIS account RID: {account_rid}")
                        self.TM_ALLYIS_FileHandler.process_file(message_value)
                    else:
                        logger.info(f"Processing customisation for TM_US account RID: {account_rid}")
                        self.TM_US_FileHandler.process_file(message_value)
                elif account_country == "CAN":
                    logger.info(f"Processing customisation for TM_CA account RID: {account_rid}")
                    self.TM_CA_FileHandler.process_ca_file(message_value)
                elif account_country == "GBR":
                    logger.info(f"Processing customisation for TM_UK account RID: {account_rid}")
                    self.TM_UK_FileHandler.process_file(message_value)
                elif account_country == "IRL":
                    logger.info(f"Processing customisation for TM_IR account RID: {account_rid}")
                    self.TM_IR_FileHandler.process_file(message_value)
                elif account_country == "AUS":
                    logger.info(f"Processing customisation for TM_AU account RID: {account_rid}")
                    self.TM_AU_FileHandler.process_file(message_value)
                else:
                    logger.info("No Customisation for this account")
            else:
                # Normal processing
                logger.info(f"Processing normal message for account RID: {account_rid}")
                self.process_message(message_value)

                # Commit after successful processing
                self.consumer.commit(msg)

        except Exception as e:
            logger.error(f"Error during parallel message processing: {e}", exc_info=True)



def consume_messages():
    """Entry point for Kafka message consumption"""
    logger.info("Kafka message consumption and scheduling started")
    scheduler_processor = SchedulerProcessor()
    scheduler_processor.start_import_timeout_scheduler()
    processor = KafkaMessageProcessor()
    processor.create_topics()
    processor.consume_messages()