from pydantic_settings import BaseSettings
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    """
    App configuration with Key Vault integration.
    """
    # Key Vault
    KEY_VAULT_URI: str = os.getenv("KEY_VAULT_URI", "")

    # Database
    MAINDB_NAME: str = ""
    MAINDB_USERNAME: str = ""
    MAINDB_PASSWORD: str = ""
    MAINDB_ENDPOINT: str = ""
    LANDING_API_KEY: str = ""
    MAIN_PG_DB_PORT: str = "5432"
    MAIN_SCHEMA_NAME: str = "trd365"

    # Kafka
    KAFKA_BROKER: str = os.getenv("KAFKA_BROKER", "kafka:9092")
    KAFKA_DATA_MAPPER_TOPIC: str = os.getenv("KAFKA_DATA_MAPPER_TOPIC", "data_mapper_request")
    KAFKA_GROUP_ID: str = os.getenv("KAFKA_GROUP_ID", "form_extraction_group")

    # ADE
    landing_environment: str | None = os.getenv("ADE_ENVIRONMENT")
    ade_parse_model: str = os.getenv("ADE_PARSE_MODEL", "dpt-2-latest")
    ade_extract_model: str = os.getenv("ADE_EXTRACT_MODEL", "extract-latest")

    class Config:
        arbitrary_types_allowed = True
        env_file = ".env"
        extra = 'ignore'

    def load_secrets_from_keyvault(self):
        if not self.KEY_VAULT_URI:
            print("[Config] KEY_VAULT_URI not set, using env vars only.")
            # Fallback to env vars if KV not used, ensuring required fields are populated
            self.MAINDB_NAME = os.getenv("MAINDB_NAME", self.MAINDB_NAME)
            self.MAINDB_USERNAME = os.getenv("MAINDB_USERNAME", self.MAINDB_USERNAME)
            self.MAINDB_PASSWORD = os.getenv("MAINDB_PASSWORD", self.MAINDB_PASSWORD)
            self.MAINDB_ENDPOINT = os.getenv("MAINDB_ENDPOINT", self.MAINDB_ENDPOINT)
            self.MAIN_PG_DB_PORT = os.getenv("MAIN_PG_DB_PORT", self.MAIN_PG_DB_PORT)
            self.MAIN_SCHEMA_NAME = os.getenv("MAIN_SCHEMA_NAME", self.MAIN_SCHEMA_NAME)
            self.LANDING_API_KEY = os.getenv("VISION_AGENT_API_KEY", self.LANDING_API_KEY)
            return

        try:
            credential = DefaultAzureCredential()
            client = SecretClient(vault_url=self.KEY_VAULT_URI, credential=credential)
            
            self.MAINDB_NAME = client.get_secret(os.getenv("MAINDB_NAME", "MAINDB-NAME")).value
            self.MAINDB_USERNAME = client.get_secret(os.getenv("MAINDB_USERNAME", "MAINDB-USERNAME")).value
            self.MAINDB_PASSWORD = client.get_secret(os.getenv("MAINDB_PASSWORD", "MAINDB-PASSWORD")).value
            self.MAINDB_ENDPOINT = client.get_secret(os.getenv("MAINDB_ENDPOINT", "MAINDB-ENDPOINT")).value
            self.LANDING_API_KEY = client.get_secret(os.getenv("VISION_AGENT_API_KEY", "VISION-AGENT-API-KEY")).value
            
            # Non-secret configs that might be in KV or env
            self.MAIN_SCHEMA_NAME = os.getenv("MAIN_SCHEMA_NAME", "trd365")
            print("[Config] Secrets loaded from Key Vault.")
            
        except Exception as e:
            print(f"[Key Vault] Failed to load secrets: {str(e)}")
            print("[Config] Falling back to environment variables.")
            self.MAINDB_NAME = os.getenv("MAINDB_NAME", self.MAINDB_NAME)
            self.MAINDB_USERNAME = os.getenv("MAINDB_USERNAME", self.MAINDB_USERNAME)
            self.MAINDB_PASSWORD = os.getenv("MAINDB_PASSWORD", self.MAINDB_PASSWORD)
            self.MAINDB_ENDPOINT = os.getenv("MAINDB_ENDPOINT", self.MAINDB_ENDPOINT)
            self.LANDING_API_KEY = os.getenv("VISION_AGENT_API_KEY", self.LANDING_API_KEY)


def get_settings() -> Settings:
    settings = Settings()
    settings.load_secrets_from_keyvault()
    return settings
