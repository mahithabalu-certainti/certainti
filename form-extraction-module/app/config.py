# app/config.py
from __future__ import annotations

import os
from functools import lru_cache
from pydantic import BaseModel


class Settings(BaseModel):
    """
    App configuration.

    Required env var:
      - VISION_AGENT_API_KEY : LandingAI API key

    Optional env vars:
      - ADE_ENVIRONMENT      : 'us', 'eu', etc. (if omitted, SDK default is used)
      - ADE_PARSE_MODEL      : parse model id (default: 'dpt-2-latest')
      - ADE_EXTRACT_MODEL    : extract model id (default: 'extract-latest')
    """

    landing_api_key: str = os.getenv("VISION_AGENT_API_KEY", "")
    landing_environment: str | None = os.getenv("ADE_ENVIRONMENT")

    ade_parse_model: str = os.getenv("ADE_PARSE_MODEL", "dpt-2-latest")
    ade_extract_model: str = os.getenv("ADE_EXTRACT_MODEL", "extract-latest")

    kafka_broker: str = os.getenv("KAFKA_BROKER", "kafka:9092")
    kafka_topic: str = os.getenv("KAFKA_DATA_MAPPER_TOPIC", "data_mapper_request")
    kafka_group_id: str = os.getenv("KAFKA_GROUP_ID", "form_extraction_group")

    class Config:
        arbitrary_types_allowed = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
