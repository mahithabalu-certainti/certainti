# app/ade_service.py
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

from landingai_ade import LandingAIADE
from landingai_ade.lib import pydantic_to_json_schema

from .config import get_settings
from .schemas import ExtractionResponse
from .pdf_field_mapper import attach_field_ids_to_extraction


class ADEForm6765Service:
    """
    Service that uses LandingAI ADE to parse & extract credit forms, then
    enriches the result with actual PDF field ids from the form.
    """

    def __init__(self) -> None:
        settings = get_settings()

        client_kwargs: Dict[str, Any] = {}
        if settings.landing_api_key:
            client_kwargs["apikey"] = settings.landing_api_key
        #if settings.landing_environment:
            # Only set if explicitly configured
            #client_kwargs["environment"] = settings.landing_environment

        self.client = LandingAIADE(**client_kwargs)
        self.schema = pydantic_to_json_schema(ExtractionResponse)
        self.parse_model = settings.ade_parse_model
        self.extract_model = settings.ade_extract_model

    def extract_form(self, pdf_path: Path) -> ExtractionResponse:
        # 1) Parse PDF into ADE markdown
        parse_resp = self.client.parse(
            document=pdf_path,
            model=self.parse_model,
        )
        markdown = getattr(parse_resp, "markdown", None)
        if not markdown:
            raise RuntimeError("ADE parse did not return markdown.")

        # 2) Extract structured JSON
        extract_resp = self.client.extract(
            schema=self.schema,
            markdown=markdown,
            model=self.extract_model,
        )

        raw_extraction: Dict[str, Any] = extract_resp.extraction  # type: ignore[assignment]
        raw_metadata: Dict[str, Any] = getattr(extract_resp, "extraction_metadata", {})  # noqa: F841

        # 3) Attach PDF field ids agentically
        enriched = attach_field_ids_to_extraction(
            pdf_path=pdf_path,
            parse_response=parse_resp,
            extraction_metadata=raw_metadata,
            extraction=raw_extraction,
        )

        # 4) Validate against Pydantic model (extra fields allowed)
        return ExtractionResponse.model_validate(enriched)
