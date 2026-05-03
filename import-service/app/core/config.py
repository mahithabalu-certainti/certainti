from pydantic import BaseSettings
from pydantic import PostgresDsn, Field
from typing import Optional
import os
import logging
from azure.identity import DefaultAzureCredential, AzureCliCredential
from azure.keyvault.secrets import SecretClient
from azure.core.exceptions import ClientAuthenticationError
from dotenv import load_dotenv

load_dotenv()  # Explicitly load .env file

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # Azure Key Vault
    KEY_VAULT_URI: str

    # Database Configuration
    DB_HOST: Optional[str] = None
    DB_PORT: int = 5432
    DB_NAME: Optional[str] = None
    DB_USER: Optional[str] = None
    DB_PASSWORD: Optional[str] = None
    credential: Optional[str] = None
    DB_SSLMODE: Optional[str] = "require"
    DB_CONN_URL: Optional[PostgresDsn] = None
    MAIN_DB_HOST: Optional[str] = None
    MAIN_DB_PORT: int = 5432
    MAIN_DB_NAME: Optional[str] = None
    MAIN_DB_USER: Optional[str] = None
    MAIN_DB_PASSWORD: Optional[str] = None
    MAIN_DB_CONN_URL: Optional[PostgresDsn] = None
    TENANT_ID: Optional[str] = None
    CLIENT_ID: Optional[str] = None
    CLIENT_SECRET: Optional[str] = None
    EMAIL_FROM: Optional[str] = None
    
    # Azure Storage
    AZURE_STORAGE_CONNECTION_STRING: str
    AZURE_CONTAINER_NAME: str
    CHUNK_SIZE: int = 4_194_304
    ETL_TESTING_DIR: str = "/data/downloads/etl-testing"

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str
    KAFKA_TOPIC_RESOURCE: str = "stg_resource"
    KAFKA_TOPIC_RESOURCE_COST: str = "stg_resource_cost"
    KAFKA_TOPIC_RESOURCE_SKILL: str = "stg_resource_skill"
    KAFKA_TOPIC_PROJECT: str = "stg_project"
    KAFKA_TOPIC_PROJECT_RESOURCE: str = "stg_project_resource"
    KAFKA_TOPIC_PROJECT_TASK: str = "stg_project_task"
    SERVICE_NAME: str = "document-importer"

    # kafka consumer
    KAFKA_BROKER: str = os.getenv("KAFKA_BROKER")
    # KAFKA_BROKER = "localhost:9092"
    KAFKA_CONSUMER_GROUP = "etl-transform-group"
    KAFKA_CONSUMER_TOPIC_RESOURCE: str = "final_resource"
    KAFKA_CONSUMER_TOPIC_RESOURCE_COST: str = "final_resource_cost"
    KAFKA_CONSUMER_TOPIC_RESOURCE_SKILL: str = "final_resource_skill"
    KAFKA_CONSUMER_TOPIC_PROJECT: str = "final_project"
    KAFKA_CONSUMER_TOPIC_PROJECT_RESOURCE: str = "final_project_resource"

    CONSUMER_MESSAGE_FAILURE = "Failed"

    # App
    APP_DEBUG: bool = False
    APP_RELOAD: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True

    def __init__(self, **data):
        super().__init__(**data)
        self._initialize_credentials()

    def _initialize_credentials(self):
        """Initialize Azure credentials with fallback mechanisms"""
        try:
            # Try DefaultAzureCredential first (uses env vars we set in .env)
            self.credential = DefaultAzureCredential()
            logger.info("Authenticated using DefaultAzureCredential")
        except ClientAuthenticationError:
            try:
                # Fallback to Azure CLI credentials
                self.credential = AzureCliCredential()
                logger.info("Authenticated using AzureCliCredential")
            except Exception as cli_error:
                logger.error(f"Azure authentication failed: {cli_error}")
                raise

    def load_from_key_vault(self):
        """Load secrets from Azure Key Vault with fallback to environment variables"""
        try:
            client = SecretClient(
                vault_url=os.getenv("KEY_VAULT_URI"),
                credential=self.credential
            )
                        # Get secrets with environment variable fallbacks
            self.DB_NAME = self._get_secret_or_env(client, os.getenv("ORGDB_NAME"))
            self.DB_USER = self._get_secret_or_env(client, os.getenv("ORGDB_USERNAME"))
            self.DB_PASSWORD = self._get_secret_or_env(client, os.getenv("ORGDB_PASSWORD"))
            self.DB_HOST = self._get_secret_or_env(client, os.getenv("ORGDB_ENDPOINT"))
            self.MAIN_DB_NAME = self._get_secret_or_env(client,os.getenv("MAINDB_NAME"))
            self.MAIN_DB_USER = self._get_secret_or_env(client, os.getenv("MAINDB_USERNAME"))
            self.MAIN_DB_PASSWORD = self._get_secret_or_env(client, os.getenv("MAINDB_PASSWORD"))
            self.MAIN_DB_HOST = self._get_secret_or_env(client, os.getenv("MAINDB_ENDPOINT"))
            self.DB_PORT = 5432
            self.MAIN_DB_PORT = 5432
            self.TENANT_ID = client.get_secret(os.getenv("MAIL_TENANT_ID")).value
            self.CLIENT_ID = client.get_secret(os.getenv("MAIL_CLIENT_ID")).value
            self.CLIENT_SECRET = client.get_secret(os.getenv("MAIL_CLIENT_SECRET")).value
            self.EMAIL_FROM = client.get_secret(os.getenv("EMAIL_FROM")).value

            if all([self.DB_NAME, self.DB_USER, self.DB_PASSWORD, self.DB_HOST]):
                self.DB_CONN_URL = PostgresDsn.build(
                    scheme="postgresql",
                    user=self.DB_USER,
                    password=self.DB_PASSWORD,
                    host=self.DB_HOST,
                    port=str(self.DB_PORT),
                    path=f"/{self.DB_NAME}",
                )
                logger.info(f"Successfully loaded Org database configuration {self.DB_CONN_URL}")
            else:
                logger.warning("Incomplete database configuration")

            if all([self.MAIN_DB_NAME, self.MAIN_DB_USER, self.MAIN_DB_PASSWORD, self.MAIN_DB_HOST]):
                self.MAIN_DB_CONN_URL = PostgresDsn.build(
                    scheme="postgresql",
                    user=self.MAIN_DB_USER,
                    password=self.MAIN_DB_PASSWORD,
                    host=self.MAIN_DB_HOST,
                    port=str(self.MAIN_DB_PORT),
                    path=f"/{self.MAIN_DB_NAME}",
                )
                logger.info("Successfully loaded Main database configuration")
            else:
                logger.warning("Incomplete database configuration")

        except Exception as e:
            logger.error(f"Failed to load from Key Vault: {e}")
            if self.APP_DEBUG:
                raise

    def _get_secret_or_env(self, client: SecretClient, secret_name: str) -> Optional[str]:
        """Try getting secret from Key Vault, fallback to environment variable"""
        try:
            return client.get_secret(secret_name).value
        except Exception as kv_error:
            logger.warning(f"Key Vault secret {secret_name} not found, trying env var: {kv_error}")

try:
    settings = Settings()
    settings.load_from_key_vault()
    
    # Validate required settings
    if not settings.AZURE_STORAGE_CONNECTION_STRING:
        raise ValueError("Azure Storage connection string is required")
        
except Exception as e:
    logger.critical(f"Failed to initialize settings: {e}")
    raise