
import os
import tempfile
from pathlib import Path
import threading
import json
import requests
import io

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from .schemas import ExtractionResponse
from .ade_service import ADEForm6765Service
from .config import get_settings
from .kafka_consumer import consume_messages

settings = get_settings()

app = FastAPI(
    title="Form 6765 ADE Extraction Service",
    description=(
        "Agentic extraction of all sections and line items from Form 6765 "
        "using LandingAI Agentic Document Extraction (ADE)."
    ),
    version="1.0.0",
)

# Reuse a single service instance (client + schema) for the process
ade_service = ADEForm6765Service()


@app.get("/health", tags=["system"])
def health_check():
    """
    Basic health endpoint.
    """
    has_key = bool(os.getenv("VISION_AGENT_API_KEY"))
    return {"status": "ok", "vision_agent_api_key_set": has_key}


@app.post(
    "/extract/form",
    response_model=ExtractionResponse,
    tags=["extraction"],
)
async def extract_form(file: UploadFile = File(...)):
    """
    Upload a Form 6765 PDF and get structured JSON back.

    Returns:
    - form_name (if detected)
    - tax_year (if detected)
    - sections: list of { section_id, section_title, line_items: [{id, label, value}] }

    Example usage (curl):

    curl -X POST "http://localhost:8000/extract/form6765" \\
         -H "accept: application/json" \\
         -H "Content-Type: multipart/form-data" \\
         -F "file=@/path/to/f6765.pdf"
    """
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Save to a temporary file so ADE can read from disk
    try:
        suffix = Path(file.filename or "upload.pdf").suffix or ".pdf"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp_path = Path(tmp.name)
            contents = await file.read()
            tmp.write(contents)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {exc}")

    extracted = None
    try:
        extracted = ade_service.extract_form(tmp_path)
    except Exception as exc:
        # You can log the traceback here as needed
        raise HTTPException(status_code=500, detail=f"Extraction failed: {exc}")
    finally:
        # Clean up temporary file
        try:
            tmp_path.unlink(missing_ok=True)
        except Exception as ex:
            print(ex)
            pass

    # FastAPI will serialize the Pydantic model to JSON
    return JSONResponse(content=extracted.model_dump())


@app.on_event("startup")
async def startup_event():
    """
    Start the Kafka consumer in a background thread on app startup.
    """
    consumer_thread = threading.Thread(target=consume_messages, daemon=True)
    consumer_thread.start()
    print("Kafka consumer thread started")
