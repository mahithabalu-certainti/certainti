import requests
from typing import List, Dict, Any, Optional
import logging
# from db_handler import build_ai_trigger_payload
from pyspark.sql import DataFrame, SparkSession, Window
import pyspark.sql.functions as F
from pyspark.sql.functions import when, col, lit, expr
from database.db_handler import DatabaseHandler
from datetime import datetime
from config import settings, config
from services.customisation.tm_ir.email import EmailNotificationService
from constants import Constants
from services.customisation.tm_ir.db_handler import TM_IR_DBHandler
from services.customisation.tm_ir.transform import transform_data
from kafka_process.kafka_producer import KafkaResourceProducer
from services.trigger_ai import AIService
from logger.logger import get_logger



logger = get_logger(__name__)

class TM_IR_FileHandler:


    def __init__(self):
        self.db_handler = DatabaseHandler()
        self.email = EmailNotificationService()
        self.tm_ir_db_handler = TM_IR_DBHandler()
        self.kafka_producer = KafkaResourceProducer()
        self.trigger_AI = AIService()


    def process_file(self, message: Dict[str, Any]) -> Optional[bool]:
        target_staging_processed = 0

        # 1. Validate required fields
        required_fields = [
            "document_id", "account_rid", "producer_id",
            "entity_type", "account_r_number", "fiscal_year"
        ]
        for field in required_fields:
            if field not in message:
                raise ValueError(f"Missing required field: {field}")
            
        # 2. Extract fields
        document_id = message["document_id"]
        account_rid = message["account_rid"]
        producer_id = message["producer_id"]
        entity_type = message["entity_type"]
        account_r_number = message["account_r_number"]
        fiscal_year = message["fiscal_year"]
        emp_type = message["emp_type"]

        logger.info(f"Fiscal year test====================@@@@@111111> {fiscal_year}")
        logger.info(
            f"Processing {entity_type} message - "
            f"Document: {document_id}, Account: {account_rid}, "
            f"Account Number: {account_r_number}, "
            f"Fiscal Year: {fiscal_year}"
        )

        # 3. Update Kafka event status
        consumer_id = self.db_handler.generate_uuid()
        logger.info(f"consumer_id : {consumer_id}")

        modified_by = self.db_handler.fetch_by_upload_user_id(document_id, account_r_number)
        user_details = self.db_handler.get_user_details(modified_by)

        self.db_handler.update_kafka_event(
            modified_by=modified_by,
            account_r_number=account_r_number,
            producer_id=producer_id,
            consumer_id=consumer_id,
            status=config.CONSUMER_MESSAGE_SUCCESS
        )

        # 4. Update import status
        target_load_start_timestamp = datetime.utcnow()
        self.db_handler.update_import_status(
            modified_by,
            document_id,
            config.CONSUMER_MESSAGE_PROCESS,
            account_r_number,
            None,
            target_load_start_timestamp=target_load_start_timestamp
        )

        # 5. Fetch staging data
        staging_data, warning_count = self.tm_ir_db_handler.get_staging_records(document_id, entity_type, account_r_number, emp_type)
        if emp_type == "Full-Time":
            if "project_type" in staging_data.columns:
                staging_data = staging_data.drop("project_type")
        target_staging_processed = staging_data.count()

        if staging_data.isEmpty():
            error_msg = Constants.ErrorMessages.no_staging_data(document_id)

            # Update statuses for failure
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
            logger.info(f"load_error_record_count : {load_error_record_count}")

            # Trigger error email
            self.email.process_staging_data_email(
                document_id, 
                entity_type, 
                account_r_number,
                account_rid,
                fiscal_year,
                modified_by,
                user_details,
                load_error_record_count,
                emp_type
            )
            return True

        # 🔜 continue with normal data processing here if staging_data is not empty
        logger.info(f"Staging data found for {entity_type}, proceeding with processing...")
        # transformation logic
        transformed_data = transform_data(
                input_df=staging_data,
                entity_type=entity_type,
                account_rid=account_rid,
                document_rid=document_id,
                account_r_number=account_r_number,
                modified_by = modified_by,
                emp_type = emp_type,
                db_handler=self.db_handler
            )
        if transformed_data is None:
            raise ValueError("Transformed data is None")
        
        if isinstance(transformed_data, dict):
            for sub_entity_type, sub_df in transformed_data.items():
                logger.info(f"sub_entity_type : {sub_entity_type}")
                if sub_entity_type == "project" :
                    config_values = self.db_handler.get_account_ai_config(account_rid, account_r_number)
                    sub_df = self.db_handler.apply_ai_config_defaults(sub_df, config_values)
                    logger.info("✅ Applied account AI config values to transformed_data")
                if not self.tm_ir_db_handler.store_transformed_data(
                    sub_df,
                    sub_entity_type,
                    account_r_number,
                    account_rid,
                    modified_by,
                    fiscal_year,
                    document_id,
                    emp_type,
                    entity_type
                ):
                    raise RuntimeError(f"Failed to store transformed data for {sub_entity_type}")
                if sub_entity_type in ["resource","project","project_resource"]:
                    logger.info("📁 Project sub_df Schema:\n%s", sub_df._jdf.schema().treeString())
                    dic_type = True
                    # if entity_type == "project_resource" and sub_entity_type == "project_resource":
                    #     sub_df = self.tm_uk_db_handler.filter_failed_records(
                    #         sub_df,
                    #         entity_type,
                    #         account_rid,
                    #         document_id,
                    #         account_r_number,
                    #         emp_type
                    #     )
                    if sub_df.limit(1).count() > 0:
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
                if sub_entity_type == "project_task" and entity_type == "project_task":
                    sub_df = self.db_handler.map_entity_rid_with_data(sub_df, "project_resource", account_r_number)
                    sub_df = self.db_handler.map_fiscal_rid_with_data(sub_df, "project_resource", account_r_number, fiscal_year)
                    # sub_df.show()
                    if not self.db_handler.process_aggregation_project_task(sub_df,account_rid,account_r_number,fiscal_year):
                        raise RuntimeError(f"Failed to aggregate transformed data for {sub_entity_type}")
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
                if sub_entity_type == "project_resource" and entity_type == "project_resource":
                    sub_df = self.db_handler.map_entity_rid_with_data(sub_df, sub_entity_type, account_r_number)
                    sub_df = self.db_handler.map_fiscal_rid_with_data(sub_df, sub_entity_type, account_r_number, fiscal_year)
                    # sub_df.show()
                    if not self.db_handler.process_aggregation_project_resource(sub_df,account_rid,account_r_number,fiscal_year):
                        raise RuntimeError(f"Failed to aggregate transformed data for {sub_entity_type}")

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

        # Update status to success
        target_load_end_timestamp = datetime.utcnow()
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
        self.email.process_staging_data_email(
            document_id, 
            entity_type, 
            account_r_number,
            account_rid,
            fiscal_year,
            modified_by,
            user_details,
            load_error_record_count,
            emp_type
        )

        return True
    
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
                    df_with_rid = self.db_handler.map_fiscal_rid_with_data(df_with_rid, entity_type, account_r_number, fiscal_year)
                else:
                    df_with_rid = df_with_rid.withColumn("fiscal_year", lit(fiscal_year)) \
                                            .withColumn("project_rid", col("project_rid"))
                # Remove reference columns after mapping
                # for col_name in ["project_code", "resource_code"]:
                #     if col_name in df_with_rid.columns:
                #         df_with_rid = df_with_rid.drop(col_name)
                #         logger.info(f"🔍 Dropped reference column: {col_name}")
                if entity_type in ["project_resource"]:
                    logger.info("✅ Added fiscal attributes: fiscal_year, project_rid, is_rd_qualified")
                    group_keys = ["project_fiscal_rid", "resource_rid", "resource_role"]

                    agg_exprs = {
                        "total_hours_pro_res": F.sum("total_hours_pro_res").alias("total_hours_pro_res"),
                        "total_cost_pro_res": F.sum("total_cost_pro_res").alias("total_cost_pro_res"),
                    }

                    # add first() for all other columns
                    non_group_cols = [c for c in df_with_rid.columns if c not in group_keys + list(agg_exprs.keys())]
                    for c in non_group_cols:
                        agg_exprs[c] = F.first(c, ignorenulls=True).alias(c)

                    df_with_rid = df_with_rid.groupBy(group_keys).agg(*agg_exprs.values())
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

