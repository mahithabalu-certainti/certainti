import json
from pyspark.sql import DataFrame
from pyspark.sql.types import StringType, DateType, DecimalType, NullType
from pyspark.sql.functions import col, lit, current_timestamp , when, trim, coalesce
from logger.logger import get_logger
from database.db_handler import DatabaseHandler
from pyspark.sql import functions as F
from typing import Dict, Union
from pathlib import Path
from datetime import datetime,timezone
from email_template_success import get_success_email_html

logger = get_logger(__name__)

class DataTransformer:
    
    def __init__(self, config_path: str = "schema/", db_handler: DatabaseHandler = None):
        try:
            self.configs = self._load_configs(config_path)
            self.db_handler = db_handler
        except Exception as e:
            logger.error(f"Failed to load transformation configs: {str(e)}")
            raise

    def _load_configs(self, config_path: str) -> Dict[str, dict]:
        """Load all transformation configurations from JSON files."""
        configs = {}
        try:
            # Load main resource mappings
            main_config_path = Path(config_path) / "entity_column_mappings.json"
            if main_config_path.exists():
                with open(main_config_path, "r") as f:
                    main_config = json.load(f)
                    configs.update({
                        "resource": main_config.get("resource", {}),
                        "resource_skill": main_config.get("resource_skill", {}),
                        "resource_cost": main_config.get("resource_cost", {}),
                        "project": main_config.get("project", {})
                    })

            # Load project_resource mappings
            pr_config_path = Path(config_path) / "project_resource_mappings.json"
            if pr_config_path.exists():
                with open(pr_config_path, "r") as f:
                    pr_config = json.load(f)
                    # Store project_resource mappings with proper prefixes
                    configs.update({
                        "project_resource_resource": pr_config.get("resource", {}),
                        "project_resource_project": pr_config.get("project", {}),
                        "project_resource": pr_config.get("project_resource", {})
                    })
            pt_config_path = Path(config_path) / "project_task_mappings.json"
            if pt_config_path.exists():
                with open(pt_config_path, "r") as f:
                    pt_config = json.load(f)
                    # Store project_resource mappings with proper prefixes
                    configs.update({
                        "project_task_resource": pt_config.get("resource", {}),
                        "project_task_project": pt_config.get("project", {}),
                        "project_task_project_resource": pt_config.get("project_resource", {}),
                        "project_task": pt_config.get("project_task", {})
                    })
            logger.info(f"Loaded configurations for entities: {list(configs.keys())}")
            return configs
        except Exception as e:
            logger.error(f"Failed to load transformation configs: {str(e)}")
            raise

    def transform_project_resource(self, df: DataFrame, account_r_number: str, account_rid: str, document_rid: str, modified_by: str) -> Dict[str, DataFrame]:
        """
        Special handler for project_resource that transforms data for all four tables.
        Returns a dictionary of DataFrames keyed by table name.
        """
        results = {}
        user_details = None
        entity_type = None
        try :
            user_details = self.db_handler.get_user_details(modified_by)
            # Transform for each target table
            for target in ["resource", "project", "project_resource"]:
                entity_type = f"project_resource_{target}" if target != "project_resource" else target
                if entity_type in self.configs:
                    logger.info(f"Transforming project_resource data for {target} table")
                    
                    # Apply mappings for this target table
                    mapped_df = self._apply_column_mappings(df, entity_type)
                    
                    # Add missing columns
                    mapped_df = self._add_missing_columns(mapped_df, entity_type)
                    
                    # Cast columns based on target entity type
                    mapped_df = self._cast_columns(mapped_df, target)
                    
                    # Add metadata
                    mapped_df = self._add_metadata(mapped_df, target, account_rid, modified_by, account_r_number)
                    
                    # Select final columns
                    mapped_df = self._select_final_columns(mapped_df, target, "project_resource")

                    # Map RID columns if db_handler is available
                    if self.db_handler:
                        mapped_df = self._map_rid_columns(mapped_df, target, account_rid, document_rid)
                    
                    for field in mapped_df.schema.fields:
                        if isinstance(field.dataType, NullType):
                            mapped_df = mapped_df.withColumn(field.name, lit(None).cast(StringType()))

                    schema_info = ", ".join([f"{f.name}: {f.dataType.simpleString()}" for f in mapped_df.schema.fields])
                    logger.info(f"Schema (name: type): {schema_info}")

                    
                    results[target] = mapped_df
                    logger.info(f"Completed transformation for {target} ({mapped_df.count()} records)")
            return results
        except Exception as e :
            logger.error(f"Transformation failed for {entity_type}: {str(e)}")
            raise
    def transform_project_task(self, df: DataFrame, account_r_number: str, account_rid: str, document_rid: str, modified_by: str) -> Dict[str, DataFrame]:
        """
        Special handler for project_resource that transforms data for all four tables.
        Returns a dictionary of DataFrames keyed by table name.
        """
        results = {}
        user_details = None
        entity_type = None
        try :
            user_details = self.db_handler.get_user_details(modified_by)
            # Transform for each target table
            for target in ["resource", "project", "project_resource","project_task"]:
                entity_type = f"project_task_{target}" if target != "project_task" else target
                if entity_type in self.configs:
                    logger.info(f"Transforming project_resource data for {target} table")
                    
                    # Apply mappings for this target table
                    mapped_df = self._apply_column_mappings(df, entity_type)
                    
                    # Add missing columns
                    mapped_df = self._add_missing_columns(mapped_df, entity_type)
                    
                    # Cast columns based on target entity type
                    mapped_df = self._cast_columns(mapped_df, target)
                    
                    # Add metadata
                    mapped_df = self._add_metadata(mapped_df, target, account_rid, modified_by, account_r_number)
                    
                    # Select final columns
                    mapped_df = self._select_final_columns(mapped_df, target, "project_task")

                    # Map RID columns if db_handler is available
                    if self.db_handler:
                        mapped_df = self._map_rid_columns(mapped_df, target, account_rid, document_rid)
                    
                    for field in mapped_df.schema.fields:
                        if isinstance(field.dataType, NullType):
                            mapped_df = mapped_df.withColumn(field.name, lit(None).cast(StringType()))

                    schema_info = ", ".join([f"{f.name}: {f.dataType.simpleString()}" for f in mapped_df.schema.fields])
                    logger.info(f"Schema (name: type): {schema_info}")

                    
                    results[target] = mapped_df
                    logger.info(f"Completed transformation for {target} ({mapped_df.count()} records)")
            return results
        except Exception as e :
            logger.error(f"Transformation failed for {entity_type}: {str(e)}")
            raise

    def transform(self, df: DataFrame, entity_type: str, account_r_number: str, account_rid: str, document_rid: str, modified_by: str) -> DataFrame:
        """Standard transformation for non-project_resource entities."""
        user_details = self.db_handler.get_user_details(modified_by)
        try:
            logger.info(f"Starting transformation for {entity_type}")

            if entity_type not in self.configs:
                raise ValueError(f"Unsupported entity_type: {entity_type}")

            # Apply transformation steps
            df = self._apply_column_mappings(df, entity_type)
            logger.info(f"df0 : {df.columns}")
            df = self._add_missing_columns(df, entity_type)
            logger.info(f"df1 : {df.columns}")
            df = self._cast_columns(df, entity_type)
            logger.info(f"df2 : {df.columns}")
            df = self._add_metadata(df, entity_type, account_rid, modified_by, account_r_number)
            logger.info(f"df3 : {df.columns}")
            df = self._select_final_columns(df, entity_type)
            logger.info(f"df4 : {df.columns}")

            # Map RID columns if db_handler is available
            if self.db_handler:
                df = self._map_rid_columns(df, entity_type, account_rid, document_rid)

            if entity_type == "project":
                df = df.withColumn(
                    "total_effort",
                    when(
                        col("total_effort").isNotNull(),
                        col("total_effort")
                    ).otherwise(
                        # If all are null, result remains null
                        (col("total_effort_fte") + col("total_effort_subcon"))
                    )
                )

                df = df.withColumn(
                    "total_cost",
                    when(
                        col("total_cost").isNotNull(),
                        col("total_cost")
                    ).otherwise(
                        coalesce(col("total_cost_fte"), lit(0)) +
                        coalesce(col("total_cost_subcon"), lit(0)) +
                        coalesce(col("total_cost_nonlabor"), lit(0))
                    )
                )
            for field in df.schema.fields:
                if isinstance(field.dataType, NullType):
                    df = df.withColumn(field.name, lit(None).cast(StringType()))

            schema_info = ", ".join([f"{f.name}: {f.dataType.simpleString()}" for f in df.schema.fields])
            logger.info(f"Schema (name: type): {schema_info}")

            logger.info(f"Successfully transformed {df.count()} records for {entity_type}")
            return df
        except Exception as e:
            logger.error(f"Transformation failed for {entity_type}: {str(e)}")
            raise

    def get_date_and_time(self):
        return datetime.now(timezone.utc)
    
    def _apply_column_mappings(self, df: DataFrame, entity_type: str) -> DataFrame:
        """Apply column mappings from config."""
        try:
            # Get the config for this entity type
            config = self.configs.get(entity_type, {})
            
            # Handle both direct configs and nested configs
            if "field_mappings" in config:
                field_mappings = config["field_mappings"]
            else:
                field_mappings = config.get("field_mappings", {})
            
            # Apply the mappings
            for src, target in field_mappings.items():
                if src in df.columns:
                    df = df.withColumnRenamed(src, target)
            
            return df
        except Exception as e:
            logger.error(f"Failed to apply column mappings for {entity_type}: {str(e)}")
            raise

    def _add_missing_columns(self, df: DataFrame, entity_type: str) -> DataFrame:
        """Add missing columns with appropriate defaults."""
        try:
            # Get the config for this entity type
            config = self.configs.get(entity_type, {})
            
            # Handle both direct configs and nested configs
            if "missing_columns" in config:
                missing_columns = config["missing_columns"]
            else:
                missing_columns = config.get("missing_columns", [])
            
            # Add missing columns with appropriate types
            for col_name in missing_columns:
                if col_name not in df.columns:
                    if col_name.endswith(("_date", "date")):
                        df = df.withColumn(col_name, lit(None).cast(DateType()))
                    elif col_name.endswith("_datetime"):
                        df = df.withColumn(col_name, lit(None).cast("timestamp"))
                    # elif any(x in col_name for x in ["cost", "rate", "amount"]):
                    #     df = df.withColumn(col_name, lit(0.0).cast(DecimalType(19, 2)))
                    else:
                        df = df.withColumn(col_name, lit(None).cast(StringType()))
            
            return df
        except Exception as e:
            logger.error(f"Failed to add missing columns for {entity_type}: {str(e)}")
            raise

    def _cast_columns(self, df: DataFrame, entity_type: str) -> DataFrame:
        """Cast columns to appropriate types based on entity type."""
        type_rules = {
            "resource": {
                "numeric": ["resource_total_experience", "resource_total_experience_organization", "standard_rate"],
                "date": ["resource_startdate", "resource_enddate"]
            },
            "resource_cost": {
                "numeric":["annual_cost","semi_annual_cost","monthly_cost","bi_weekly_cost","weekly_cost","daily_cost","hourly_cost"],
                "date": ["effective_date", "end_date"]
            },
            "resource_skill": {
                "numeric": ["experience_years"],
                "date": ["last_used_date"]
            },
            "project": {
                "numeric": ["total_cost", "total_effort", "total_fte", "total_subcon","total_nonlabor",
                          "total_effort_fte", "total_cost_fte", "total_effort_subcon",
                          "total_cost_subcon", "total_cost_nonlabor", "blended_rate"],
                "date": ["project_startdate", "project_enddate"],
                "boolean" : ["auto_send_ai_interaction"]
            },
            "project_resource": {
                "numeric": ["total_cost_pro_res", "total_hours_pro_res","total_cost_pro_task","total_hours_pro_task"],
                "date": ["start_date", "end_date"]
            },
            "project_task": {
                "numeric": ["total_cost_pro_task", "total_hours_pro_task"],
                "date": ["start_date", "end_date"]
            }

        }
        
        rules = type_rules.get(entity_type, {})
        
        # Apply numeric casting
        for col_name in rules.get("numeric", []):
            if col_name in df.columns:
                df = df.withColumn(
                    col_name,
                    F.when(F.col(col_name).isNotNull(), F.col(col_name).cast(DecimalType(18, 2))).otherwise(None)
                )
        
        # Apply date casting
        for col_name in rules.get("date", []):
            if col_name in df.columns:
                df = df.withColumn(col_name, F.to_date(F.col(col_name)))
        
        # for col_name in rules.get("boolean", []):
        #     if col_name in df.columns:
        #         df = df.withColumn(
        #             col_name,
        #             F.when(F.col(col_name).isin("true", "True", True, 1), F.lit(True))
        #             .when(F.col(col_name).isin("false", "False", False, 0), F.lit(False))
        #             .otherwise(F.lit(False))
        #             .cast("boolean")
        #         )
        
        return df

    def _add_metadata(self, df: DataFrame, entity_type: str, account_rid: str, modified_by: str, account_r_number: str) -> DataFrame:
        """Add system-generated metadata columns with conditional status validation."""
        metadata = {
            "created_datetime": lit(self.get_date_and_time()),
            "account_rid": lit(account_rid),
            "created_by": lit(modified_by)
        }
        # Add all metadata columns
        for col_name, value in metadata.items():
            df = df.withColumn(col_name, value)
        # df.show()
        return df

    def get_config_key(self, entity_name: str, context: str) -> str:
        """
        Returns the config key based on entity name and context.
        - If context is 'standalone', return the entity_name.
        - If entity_name == context, return context.
        - Otherwise, return context + '_' + entity_name
        """
        if context == "standalone":
            return entity_name
        elif entity_name == context:
            return context
        else:
            return f"{context}_{entity_name}"

    def _select_final_columns(self, df: DataFrame, entity_name: str, context: str = "standalone") -> DataFrame:
        """
        Select final columns based on configuration.
        
        Args:
            df: Input DataFrame
            entity_name: Target entity name (e.g., "resource", "project")
            context: Transformation context ("standalone" or "project_resource")
        """
        try:
            logger.info(f"entity_name {entity_name}")
            logger.info(f"context {context}")
            # Determine the config key based on context

            config_key = self.get_config_key(entity_name, context)

            config = self.configs.get(config_key, {})
            # logger.info(f"config ----> : {config}")
            # if context == "standalone":
            #     config = config[entity_name]

            logger.info(f"config : {config}")
            if not config:
                raise ValueError(f"No configuration found for {config_key}")
            
            # Get expected columns from config
            expected_columns = (
                list(config.get("field_mappings", {}).values()) +  # Mapped columns
                config.get("missing_columns", []) +               # Missing columns
                ["created_datetime", "account_rid", "created_by"]  # Standard metadata
            )
            
            # Select only columns that exist in the DataFrame
            existing_columns = [col for col in expected_columns if col in df.columns]
            missing_columns = [col for col in expected_columns if col not in df.columns]
            
            if missing_columns:
                logger.warning(f"Missing expected columns in output: {missing_columns}")
            
            return df.select(*existing_columns)
            
        except Exception as e:
            logger.error(f"Failed to select final columns for {entity_name}: {str(e)}")
            raise

    def _map_rid_columns(self, df: DataFrame, entity_type: str, account_rid: str, document_rid : str) -> DataFrame:
        """Map reference columns to their RIDs if present in the DataFrame."""
        if not self.db_handler:
            return df
            
        try:
            return self.db_handler._map_geo_rids(df, entity_type, document_rid, account_rid)
        except Exception as e:
            logger.error(f"Failed to map RID columns: {str(e)}")
            raise

def transform_data(
    input_df: DataFrame,
    entity_type: str,
    account_rid: str,
    document_rid: str,
    account_r_number: str,
    modified_by: str,
    db_handler: DatabaseHandler = None
) -> Union[DataFrame, Dict[str, DataFrame]]:
    """
    Public transformation interface.
    For project_resource, returns a dict of DataFrames.
    For other entities, returns a single DataFrame.
    """
    transformer = DataTransformer(db_handler=db_handler)
    
    if entity_type == "project_resource":
        return transformer.transform_project_resource(input_df, account_r_number, account_rid, document_rid, modified_by)
    elif entity_type == "project_task":
        return transformer.transform_project_task(input_df, account_r_number, account_rid, document_rid, modified_by)
    else:
        return transformer.transform(input_df, entity_type, account_r_number, account_rid, document_rid, modified_by)