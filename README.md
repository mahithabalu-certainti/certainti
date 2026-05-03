# rdcredits_platform_int
🧠 Think RD 365 – ETL Platform
This is the ETL (Extract, Transform, Load) service suite for Think RD 365, designed to handle end-to-end data ingestion, processing, and transformation workflows. Built using python, kafka, PySpark, PostgreSQL, and modular microservices, the platform ensures flexibility, scalability, and maintainability.

🔧 Features
    ✅ Modular microservice architecture
    ✅ Data ingestion from files, APIs, and databases
    ✅ Transformation pipeline using PySpark
    ✅ Logging and error handling
    ✅ Config-driven and environment-based execution
    ✅ Dockerized deployment

📁 Project Structure

    rdcredits_platform_int/
    │
    ├── extract-service/         # Pulls data from external APIs or databases
    ├── file-ingest-service/     # Processes raw files like CSV/Excel
    ├── import-service/          # Loads ingested data into staging tables
    ├── transform-service/       # Cleans, joins, and enriches data for reporting
    │
    ├── .coverage                # Code coverage reports
    ├── .gitignore
    ├── app.log                  # Centralized log file
    ├── docker-compose.yml       # Service orchestration using Docker
    └── README.md                # This documentation


📦 Service Overviews
🔹 1. extract-service
    Purpose: Extract data from the sheets (csv,excel) Based on the API's

    📦 Directory Structure
```
    extract-service/
    │
    ├── database/
    │   └── db_handler.py              # Handles database connections and queries
    │
    │── handling/
    │      ├── blob_file.py          # Error handling for blob/file-related issues
    │      ├── file_handler.py       # File validation and parsing logic
    │      └── validation.py         # Generic validation and error capture
    │
    ├── kafka_process/
    │   ├── kafka_consumer.py         # Kafka consumer for data stream processing
    │   └── kafka_producer.py         # Kafka producer to publish messages
    │
    ├── logger/
    │   ├── logger.py                 # Central logging setup
    │
    ├── schema/
    │   └── columns_mapping.json      # Defines expected schema mappings
    │
    ├── services/
    │   └── email.py                  # Email utility for future purpose of sending email's
    │
    ├── config.py
    └── constants.py 
    └── email_template_success.py 
    └── email_tempalte.py 
    └── main.py
    └── requirements.txt              # Python dependencies
```
    🚀 Features
        ✅ Extracts data from file systems and databases
        ✅ Kafka integration (producer & consumer)
        ✅ Centralized logging
        ✅ Schema-based validation
        ✅ Error handling with structured modules

    ⚙️ How to Run
        Install Dependencies
            cd extract-service
            pip install -r requirements.txt
        Run the Extraction Pipeline
            python main.py
 🔹 2. file-ingest-service
    Purpose: The File Ingest Service is responsible for sending the files via SFTP, S3(Future)
         
    📦 Directory Structure
```
    file-ingest-service/
    │
    ├── src/main/
    │   ├── java/ai/certainty/
    │   │   ├── config/             # Spring and service-specific configs
    │   │   ├── model/              # Data models and DTOs
    │   │   ├── repository/         # Persistence layer (if DB is involved)
    │   │   ├── routes/             # REST controllers
    │   │   ├── service/            # Business logic layer
    │   │   └── Application.java    # Spring Boot entry point
    │   │
    │   └── resources/
    │       ├── application.properties  # Application configs
    │       └── logback.xml             # Logging configuration
    │
    ├── target/                      # Compiled artifacts
    ├── Dockerfile                   # Containerization config
    ├── pom.xml                      # Maven dependencies and build config
    └── README.md                    # Project documentation
```
    🚀 Features
        ✅ RESTful APIs for file upload
        ✅ File validation (extension, schema, size)
        ✅ Stores files to blob storage or a staging directory
        ✅ Logging and configuration using Spring Boot
        ✅ Docker-compatible
        ✅ Supports integration with downstream services (e.g., Import Service)

    🛠️ Setup & Installation
        ✅ Prerequisites
            Java 17+
            Maven 3.8+
        🔧 Build the App
            mvn clean install
        🧪 Run Locally
            mvn spring-boot:run

🔹 3. Import-service
    purpose - The Import Service handles the loading of ingested data (from files or external systems) and API endpoints. Built using Python and FastAPI, it provides RESTful endpoints for file upload, validation, and status monitoring.

    📁 Directory Structure
```
    import-service/
    │
    ├── app/
    │   ├── api/
    │   │   ├── endpoints/
    │   │   │   ├── file_processing.py   # Logic for parsing and importing data
    │   │   │   ├── file_upload.py       # Endpoint for uploading files
    │   │   │   └── system_health.py     # Health check endpoint
    │   │   └── routers.py               # API route registration
    │   │
    │   ├── core/
    │   │   ├── config.py                # Environment & config variables
    │   │   └── constants.py             # Constants used across the app
    │   │
    │   ├── database/                    # DB connection and schema utils
    │   ├── logger/                      # Logging setup
    │   ├── models/                      # Pydantic or ORM models
    │   ├── services/                    # Business logic for import
    │   └── utils/                       # Utility functions
    │
    ├── main.py                          # FastAPI app entry point
    ├── email_template_success.py        # Email template for successful file upload
    ├── email_template.py                # Email template
    ├── test/                            # Unit & integration tests
    ├── requirements.txt                 # Python dependencies
    ├── Dockerfile                       # Container config
    └── README.md                        # Documentation
```
    🚀 Features
        ✅ REST APIs for importing files
        ✅ File validation & transformation
        ✅ Health check and monitoring endpoints
        ✅ Modular FastAPI design
        ✅ Centralized logging and configuration
        ✅ Docker support for deployment

    🛠️ Setup & Installation
        ✅ Prerequisites
            Python 3.10+
            pip / poetry
            PostgreSQL
            Docker
        🔧 Install Dependencies
            pip install -r requirements.txt
        🚀 Run the App
            uvicorn main:app --reload


🔹 4. Transform-service
    purpose - The Transform Service processes data extracted and ingested by upstream services. It applies business rules, data cleaning, enrichment, and aggregation before loading into final reporting or analytics layers.

    📁 Directory Structure
```
    transform-service/
    │
    ├── database/                    # DB connection utils and queries
    ├── handling/                    # Error handling and validation logic
    ├── kafka_process/               # Kafka consumer/producer integration
    ├── logger/                      # Logging configuration
    ├── schema/                      # JSON schema definitions for transformation
    ├── services/                    # Core business logic and transformers
    ├── tmp/                         # Temporary file storage
    │
    ├── config.py                    # Configuration management
    ├── constants.py                 # Constants and global definitions
    ├── email_template.py            # Failure notification template
    ├── email_template_success.py    # Success notification template
    ├── main.py                      # Entry point of the transformation logic
    ├── .env                         # Environment variables
    ├── Dockerfile                   # Docker config
    ├── requirements.txt             # Python dependencies
```
    🚀 Features
        ✅ Data transformation using PySpark
        ✅ Schema-based column validation
        ✅ Email notifications for success/failure
        ✅ Kafka integration for processing triggers
        ✅ Logging and monitoring support
        ✅ Docker-ready microservice

    ⚙️ Setup & Installation

        ✅ Prerequisites
            Python 3.10+
            pip / poetry
            Java 8+ (required for Spark)
            PySpark
            PostgreSQL JDBC driver

        🔧 Install Dependencies
            pip install -r requirements.txt
        
        🚀 Run the App
            python main.py
