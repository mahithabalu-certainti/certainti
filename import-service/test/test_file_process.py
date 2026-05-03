import unittest
import asyncio
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from app.models import ProcessFileRequest, ProcessFileResponse, ProcessFileData, KafkaEventCreate, DocumentCreate, ImportCreate
from app.core.constants import Constants
from app.core.config import settings
from uuid import uuid4
import logging
from app.api.endpoints.file_processing import process_file, handle_file_processing

# Configure logging for the test
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Output to console
        logging.FileHandler('test_file_processing.log')  # Output to file
    ]
)
logger = logging.getLogger(__name__)

class TestFileProcessor(unittest.TestCase):
    def setUp(self):
        logger.info("Setting up TestFileProcessor")
        # Setup mocks
        self.connection_patch = patch('app.api.endpoints.file_processing.get_connection')
        self.account_r_number_patch = patch('app.api.endpoints.file_processing.get_account_r_number')
        self.insert_document_patch = patch('app.api.endpoints.file_processing.insert_document')
        self.insert_document_upload_patch = patch('app.api.endpoints.file_processing.insert_document_upload')
        self.insert_kafka_event_patch = patch('app.api.endpoints.file_processing.insert_kafka_event')
        self.kafka_producer_patch = patch('app.api.endpoints.file_processing.kafka_producer')
        self.update_status_patch = patch('app.api.endpoints.file_processing.update_status')

        # Start mocks
        self.mock_connection = self.connection_patch.start()
        self.mock_get_account_r_number = self.account_r_number_patch.start()
        self.mock_insert_document = self.insert_document_patch.start()
        self.mock_insert_document_upload = self.insert_document_upload_patch.start()
        self.mock_insert_kafka_event = self.insert_kafka_event_patch.start()
        self.mock_kafka_producer = self.kafka_producer_patch.start()
        self.mock_update_status = self.update_status_patch.start()

        # Mock return values
        logger.info("Configuring mock return values")
        self.mock_get_account_r_number.return_value = '12345'
        self.mock_insert_document.return_value = 'doc123'
        self.mock_insert_document_upload.return_value = 'upload123'
        self.mock_insert_kafka_event.return_value = 'event123'
        self.mock_kafka_producer.send_message.return_value = None  # Successful Kafka send
        self.mock_kafka_producer.flush.return_value = None
        self.mock_connection().__enter__.return_value = MagicMock()  # Mock DB connection context

        # Create valid DocumentCreate and ImportCreate objects
        logger.info("Creating sample DocumentCreate and ImportCreate objects")
        self.document = DocumentCreate(
            account_rid='acc123',
            document_status='processed',
            related_to='related',
            related_to_rid='related_rid',
            document_source='test_source',
            document_type='test_type',
            document_format='pdf',
            document_url='http://test.com/doc.pdf',
            document_size='1024',
            created_by='test_user',
            modified_by='test_user'
        )
        self.import_obj = ImportCreate(
            account_rid='acc123',
            uploaded_by_user_rid='user123',
            document_name='doc_name',
            related_to='related',
            related_to_rid='related_rid',
            entity_type='resource',
            upload_status='pending',
            fiscal_year='2023'
        )

        self.request = ProcessFileRequest(
            document=self.document,
            **{'import': self.import_obj}  # Use **kwargs to handle reserved keyword
        )  # type: ignore

    def tearDown(self):
        logger.info("Tearing down TestFileProcessor")
        patch.stopall()

    def test_process_file_success(self):
        logger.info("Starting test_process_file_success")
        logger.info(f"Input request: document_status={self.request.document.document_status}, entity_type={self.request.import_.entity_type}")

        response = asyncio.run(process_file(self.request))

        logger.info(f"Response received: statusCode={response.statusCode}, status={response.status}, message={response.message}")
        if response.data:
            logger.info(f"Response data: document_id={response.data.document_id}, upload_id={response.data.upload_id}")

        self.assertEqual(response.statusCode, 200)
        self.assertEqual(response.status, "Success")
        self.assertEqual(response.message, "File processed successfully")
        self.assertIsInstance(response.data, ProcessFileData)
        self.assertEqual(response.data.document_id, 'doc123')
        self.assertEqual(response.data.upload_id, 'upload123')

        logger.info("Verifying mock calls")
        self.mock_kafka_producer.send_message.assert_called_once()
        self.mock_update_status.assert_called_once_with('event123', Constants.Status.PRODUCED, '12345')
        logger.info("test_process_file_success completed successfully")

    def test_process_file_failure_invalid_format(self):
        logger.info("Starting test_process_file_failure_invalid_format")
        # Create request with failed document status
        failed_document = self.document.copy(update={'document_status': 'failed'})
        failed_request = self.request.copy(update={'document': failed_document})
        logger.info(f"Input request: document_status={failed_request.document.document_status}, entity_type={failed_request.import_.entity_type}")

        response = asyncio.run(process_file(failed_request))

        logger.info(f"Response received: statusCode={response.statusCode}, status={response.status}, message={response.message}")
        if response.data:
            logger.info(f"Response data: document_id={response.data.document_id}, upload_id={response.data.upload_id}")

        self.assertEqual(response.statusCode, 400)
        self.assertEqual(response.status, "Error")
        self.assertEqual(response.message, "File upload failed due to invalid file format.")
        self.assertIsInstance(response.data, ProcessFileData)
        self.assertEqual(response.data.document_id, 'doc123')
        self.assertEqual(response.data.upload_id, 'upload123')

        logger.info("Verifying mock calls")
        self.mock_kafka_producer.send_message.assert_not_called()
        self.mock_update_status.assert_not_called()
        logger.info("test_process_file_failure_invalid_format completed successfully")

    def test_process_file_kafka_failure(self):
        logger.info("Starting test_process_file_kafka_failure")
        logger.info("Configuring mock_kafka_producer.send_message to raise Exception")
        self.mock_kafka_producer.send_message.side_effect = Exception("Kafka error")
        logger.info(f"Input request: document_status={self.request.document.document_status}, entity_type={self.request.import_.entity_type}")

        response = asyncio.run(process_file(self.request))

        logger.info(f"Response received: statusCode={response.statusCode}, status={response.status}, message={response.message}")
        if response.data:
            logger.info(f"Response data: document_id={response.data.document_id}, upload_id={response.data.upload_id}")

        self.assertEqual(response.statusCode, 500)
        self.assertEqual(response.status, "Error")
        self.assertEqual(response.message, "Failed to send Kafka event. Please try again later.")
        self.assertIsInstance(response.data, ProcessFileData)
        self.assertEqual(response.data.document_id, 'doc123')
        self.assertEqual(response.data.upload_id, 'upload123')

        logger.info("Verifying mock calls")
        self.mock_update_status.assert_called_once_with('event123', Constants.Status.FAILURE, '12345', 'Exception: Kafka error')
        logger.info("test_process_file_kafka_failure completed successfully")

if __name__ == '__main__':
    unittest.main()