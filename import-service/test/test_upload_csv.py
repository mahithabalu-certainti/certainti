import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from fastapi import FastAPI, status
from app.api.endpoints import file_upload
from app.api.endpoints.file_upload import router
from app.services.blob_service import AzureBlobService
from app.models import ProcessFileResponse, ProcessFileData
import io

app = FastAPI()
app.include_router(router)
client = TestClient(app)

class StorageException(Exception):
    pass

class TestUploadCSV(unittest.TestCase):
    def setUp(self):
        self.validate_patch = patch('app.api.endpoints.file_upload.validate_file')
        self.path_patch = patch('app.utils.formatters.generate_blob_path')
        self.processing_patch = patch('app.api.endpoints.file_upload.handle_file_processing')
        self.mock_blob_service = patch.object(AzureBlobService, 'upload_csv')

        self.mock_validate = self.validate_patch.start()
        self.mock_generate_path = self.path_patch.start()
        self.mock_processing = self.processing_patch.start()
        self.mock_upload_csv = self.mock_blob_service.start()

        self.mock_validate.return_value = True
        self.mock_generate_path.return_value = "test/path/file.csv"
        self.mock_processing.return_value = ProcessFileResponse(
            statusCode=200,
            status="Success",
            message="File processed successfully",
            data=ProcessFileData(document_id="doc_123", upload_id="upload_123")
        )
        self.mock_upload_csv.return_value = "https://blob.url/test.csv"

    def tearDown(self):
        patch.stopall()

    def test_successful_upload_valid_file(self):
        test_file = io.BytesIO(b"valid,file,content")
        response = client.post(
            "/upload-csv",
            data={
                **self._base_form_data(),
                "entity_type": "resources"
            },
            files={"file": ("test.csv", test_file, "text/csv")}
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json().get("status"), "Success")
        self.mock_upload_csv.assert_called_once()

    def test_upload_with_validation_failure(self):
        self.mock_validate.side_effect = ValueError("Invalid file format")
        print(f"Mock validate side_effect: {self.mock_validate.side_effect}")  # Debug
        test_file = io.BytesIO(b"invalid,file,content")
        response = client.post(
            "/upload-csv",
            data={
                **self._base_form_data(),
                "entity_type": "account"
            },
            files={"file": ("test.csv", test_file, "text/csv")}
        )
        print(f"Response status: {response.status_code}, body: {response.json()}")  # Debug
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json().get("detail", {}).get("error"), "FileValidationError")
        self.mock_upload_csv.assert_not_called()

    def test_blob_upload_failure(self):
        self.mock_upload_csv.side_effect = StorageException("Storage error")
        test_file = io.BytesIO(b"valid,content")
        response = client.post(
            "/upload-csv",
            data={
                **self._base_form_data(),
                "entity_type": "account"
            },
            files={"file": ("test.csv", test_file, "text/csv")}
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.json().get("detail", {}).get("error"), "BlobUploadError")
        self.mock_upload_csv.assert_called_once()

    def test_unexpected_exception_handling(self):
        self.mock_validate.side_effect = Exception("Unexpected error")
        print(f"Mock validate side_effect: {self.mock_validate.side_effect}")  # Debug
        test_file = io.BytesIO(b"valid,content")
        response = client.post(
            "/upload-csv",
            data={
                **self._base_form_data(),
                "entity_type": "account"
            },
            files={"file": ("test.csv", test_file, "text/csv")}
        )
        print(f"Response status: {response.status_code}, body: {response.json()}")  # Debug
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.json().get("detail", {}).get("error"), "UnexpectedError")
        self.mock_upload_csv.assert_not_called()

    def test_validate_file_mock(self):
        self.mock_validate.side_effect = ValueError("Invalid file format")
        with self.assertRaises(ValueError) as cm:
            self.mock_validate(b"test", "test.csv")
        self.assertEqual(str(cm.exception), "Invalid file format")

    def _base_form_data(self):
        return {
            "account_rid": "c265b225-a4b7-4bba-877e-79c3ee1e8f00",
            "account_r_number": "ACC 0000000046",
            "fiscal_year": "2024",
            "related_to": "account",
            "related_to_rid": "6f1209aa-ce1e-4281-909b-d0ca310f3d68",
            "uploaded_by_user_rid": "0d5bcd12-ab14-4a93-a62b-6e676ad8952b"
        }

if __name__ == '__main__':
    unittest.main()