# app/pdf_form_reader.py

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, List, Optional, Tuple, Dict

# Support either `pypdf` or `PyPDF2` so it works in more environments.
try:  # pragma: no cover - import flexibility
    from pypdf import PdfReader
    from pypdf.generic import IndirectObject, DictionaryObject
except Exception as ex:  # pragma: no cover
    print(f"Failed to import pypdf: {ex}")
    from PyPDF2 import PdfReader  # type: ignore[no-redef]
    from PyPDF2.generic import (  # type: ignore[no-redef]
        IndirectObject,
        DictionaryObject,
    )


@dataclass
class FillableField:
    """
    One fillable AcroForm field (widget) in the PDF.

    name        -> full hierarchical field name as shown by Acrobat / PDF tools
                   e.g. "EIN_TP.1", "2a2", "Part6.Title",
                        "topmostSubform[0].Page1[0].f1_01[0]"
    page_index  -> zero-based page index
    rect        -> (x0, y0, x1, y1) in PDF user units
    field_type  -> "text", "checkbox", "radio", "choice", "signature", or "unknown"
    value       -> current value (text, number, "Yes"/"No" for checkboxes, or None)
    """

    name: str
    page_index: int
    rect: Tuple[float, float, float, float]
    field_type: str
    value: Optional[str]


def _normalize_rect(raw_rect: Any) -> Tuple[float, float, float, float]:
    """Normalize a /Rect array to (x0, y0, x1, y1) with x0<=x1, y0<=y1."""
    x0, y0, x1, y1 = [float(v) for v in raw_rect]
    left = min(x0, x1)
    right = max(x0, x1)
    bottom = min(y0, y1)
    top = max(y0, y1)
    return left, bottom, right, top


def _resolve(obj: Any) -> DictionaryObject:
    """Follow IndirectObject references to get the underlying dictionary."""
    if isinstance(obj, IndirectObject):  # type: ignore[arg-type]
        return obj.get_object()  # type: ignore[no-any-return]
    return obj  # type: ignore[return-value]


def _build_full_name(widget: DictionaryObject) -> str:
    """
    Walk up the /Parent chain and build the full field name.

    Example:
      Parent /T = "EIN_TP"
      Child  /T = "1"
      -> full name "EIN_TP.1"
    """
    parts: List[str] = []
    current: Optional[DictionaryObject] = _resolve(widget)
    seen: set[int] = set()

    while current is not None and id(current) not in seen:
        seen.add(id(current))
        t = current.get("/T")
        if t is not None:
            parts.append(str(t))
        parent = current.get("/Parent")
        if parent is None:
            break
        current = _resolve(parent)

    if not parts:
        return ""
    # We collected bottom-up, so reverse to get top-down.
    return ".".join(reversed(parts))


def _classify_type(annot: DictionaryObject) -> str:
    ftype = annot.get("/FT")
    flags = int(annot.get("/Ff", 0))

    if ftype == "/Btn":
        # Radio buttons set the "radio" bit (32768)
        if flags & 32768:
            return "radio"
        return "checkbox"
    if ftype == "/Tx":
        # Some text fields are actually signature fields
        if annot.get("/Type") == "/Sig" or annot.get("/FT") == "/Sig":
            return "signature"
        return "text"
    if ftype == "/Sig":
        return "signature"
    if ftype == "/Ch":
        return "choice"
    return "unknown"


def _extract_raw_value(annot: DictionaryObject) -> Any:
    """Return the raw /V or checkbox state."""
    if "/V" in annot:
        return annot["/V"]
    # Checkboxes sometimes only have /AS for appearance state.
    if annot.get("/FT") == "/Btn" and "/AS" in annot:
        return annot["/AS"]
    return None


def _normalize_value(field_type: str, raw_value: Any) -> Optional[str]:
    if raw_value is None:
        return None

    # Checkboxes: treat anything other than explicit "Off" as "Yes"
    if field_type == "checkbox":
        val = str(raw_value)
        if val in ("/Off", "Off", "0"):
            return "No"
        return "Yes"

    # Radio: just stringify
    if field_type == "radio":
        return str(raw_value)

    # Signature / text / choice: simple string
    return str(raw_value)


def read_fillable_fields(pdf_path: Path) -> List[FillableField]:
    """
    Read ALL fillable fields from a PDF, with full field IDs and values.

    This function is generic and should work for IRS forms, state forms,
    and any other AcroForm-based fillable PDF.
    """
    reader = PdfReader(str(pdf_path))
    result: List[FillableField] = []

    for page_index, page in enumerate(reader.pages):
        annots = page.get("/Annots") or []
        for annot_ref in annots:
            annot = _resolve(annot_ref)
            if annot.get("/Subtype") != "/Widget":
                continue

            rect = annot.get("/Rect")
            if not rect:
                continue

            name = _build_full_name(annot)
            # Some widgets (like decorative push buttons) have no /T – skip them.
            if not name:
                continue

            field_type = _classify_type(annot)
            raw_value = _extract_raw_value(annot)
            value = _normalize_value(field_type, raw_value)

            result.append(
                FillableField(
                    name=name,
                    page_index=page_index,
                    rect=_normalize_rect(rect),
                    field_type=field_type,
                    value=value,
                )
            )

    return result


def extract_form_fields(pdf_path: Path) -> List[Dict[str, Any]]:
    """
    Convenience helper used by pdf_field_mapper.

    Returns a lightweight list of dicts with:

      - page        (1-based page index, to match ADE)
      - label       (tooltip or field name)
      - field_id    (FULL hierarchical ID, e.g. 'EIN_TP.1', '2a2', 'Part6.Title')
      - field_type  ('text', 'checkbox', 'radio', 'signature', ...)
      - value       (normalized string or None)
      - bbox        (original PDF rect [x0, y0, x1, y1])
      - center      ((x_center, y_center) in PDF units)
    """
    reader = PdfReader(str(pdf_path))
    fields: List[Dict[str, Any]] = []

    for page_index, page in enumerate(reader.pages):
        page_annotations = page.get("/Annots") or []
        for annot_ref in page_annotations:
            annot = _resolve(annot_ref)
            if annot.get("/Subtype") != "/Widget":
                continue

            rect = annot.get("/Rect")
            if rect and len(rect) == 4:
                bbox = [float(x) for x in rect]
                x1, y1, x2, y2 = bbox
                x_center = (x1 + x2) / 2.0
                y_center = (y1 + y2) / 2.0
            else:
                bbox, x_center, y_center = None, None, None, None

            full_name = _build_full_name(annot)
            if not full_name:
                continue

            field_type = _classify_type(annot)
            raw_value = _extract_raw_value(annot)
            value = _normalize_value(field_type, raw_value)

            # /TU is often a tooltip/description; fall back to full name.
            label = annot.get("/TU") or full_name or annot.get("/TM")

            fields.append(
                {
                    "page": page_index + 1,  # ADE pages are 1-based
                    "label": str(label) if label else "Unknown",
                    "field_id": full_name,
                    "field_type": field_type,
                    "value": value,
                    "bbox": bbox,
                    "center": (x_center, y_center),
                }
            )

    return fields
