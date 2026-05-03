import requests
from typing import List, Dict, Any, Optional
import logging
# from db_handler import build_ai_trigger_payload
from pyspark.sql import DataFrame, SparkSession, Window
from database.db_handler import DatabaseHandler
from logger.logger import get_logger



logger = get_logger(__name__)



class AIService:

    def __init__(self):
        self.db_handler = DatabaseHandler()

    def send_ai_trigger_payload(
            self,
            incoming_df: DataFrame,
            account_r_number: str,
            account_rid: str,
            entity_type: str,
            document_id: str,
            modified_by: str,
        ) -> Optional[Dict[str, Any]]:
            """
            Builds and sends AI trigger payload to the AI API.
            """
            logger.info("send_ai_trigger_payload called")

            payload = self.db_handler.build_ai_trigger_payload(incoming_df, account_r_number, account_rid, entity_type, document_id, modified_by)
            if not payload["project_id"]:  # check project_id list instead of data
                logger.info("No AI trigger payload to send (empty).")
                return None
    
            return payload
