# app/ade_service.py
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

from landingai_ade import LandingAIADE
from landingai_ade.lib import pydantic_to_json_schema

from .config import get_settings
from .schemas import ExtractionResponse
from .pdf_field_mapper import attach_field_ids_to_extraction

def _coerce_position_component(value: Any) -> float:
    """Normalize a single bbox coordinate for Pydantic List[float] validation."""
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        s = value.strip()
        if not s:
            return 0.0
        try:
            return float(s)
        except ValueError:
            return 0.0
    return 0.0


def _sanitize_extraction_positions(extraction: Dict[str, Any]) -> Dict[str, Any]:
    """
    ADE / vision models sometimes emit bounding boxes with null components, e.g.
    [x0, null, null, null]. Pydantic expects List[float] with no null elements, so we
    coerce missing or invalid coordinates to 0.0 before validation.
    """

    def walk(obj: Any) -> Any:
        if isinstance(obj, dict):
            out: Dict[str, Any] = {}
            for k, v in obj.items():
                if k == "position" and isinstance(v, (list, tuple)):
                    out[k] = [_coerce_position_component(x) for x in v]
                else:
                    out[k] = walk(v)
            return out
        if isinstance(obj, list):
            return [walk(item) for item in obj]
        return obj

    return walk(extraction)


class ADEForm6765Service:
    """
    Service that uses LandingAI ADE to parse & extract credit forms, then
    enriches the result with actual PDF field ids from the form.
    """

    def __init__(self) -> None:
        settings = get_settings()

        client_kwargs: Dict[str, Any] = {}
        if settings.LANDING_API_KEY:
            client_kwargs["apikey"] = settings.LANDING_API_KEY
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

        # Normalize bbox coordinates before field-id attachment: pdf_field_mapper
        # computes centers with (pos[0] + pos[2]) / 2; ADE may emit null components.
        extraction_for_attach = _sanitize_extraction_positions(raw_extraction)

        # 3) Attach PDF field ids agentically
        enriched = attach_field_ids_to_extraction(
            pdf_path=pdf_path,
            parse_response=parse_resp,
            extraction_metadata=raw_metadata,
            extraction=extraction_for_attach,
        )

        sanitized = _sanitize_extraction_positions(enriched)

        # 4) Validate against Pydantic model (extra fields allowed)
        return ExtractionResponse.model_validate(sanitized)
