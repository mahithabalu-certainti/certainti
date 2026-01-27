# app/pdf_field_mapper.py

from __future__ import annotations

from collections import defaultdict
from collections.abc import MutableMapping
from dataclasses import dataclass
from math import inf
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.pdf_form_reader import extract_form_fields


# ---------------------------------------------------------------------------
# Internal helper structures
# ---------------------------------------------------------------------------

@dataclass
class NormField:
    field_id: str
    label: str
    field_type: str
    page: int          # 1-based
    x: float           # center x in PDF units
    y: float           # center y in PDF units


def _load_norm_fields(pdf_path: Path) -> List[NormField]:
    """
    Load all fields from the PDF and convert to a simplified representation that
    we can sort and match in a generic way.
    """
    raw_fields = extract_form_fields(pdf_path)
    norm_fields: List[NormField] = []

    for f in raw_fields:
        cx, cy = f.get("center", (None, None))
        if cx is None or cy is None:
            # Put fields with no geometry at the end of the page.
            cx, cy = 0.0, inf

        norm_fields.append(
            NormField(
                field_id=str(f["field_id"]),
                label=str(f.get("label") or ""),
                field_type=str(f.get("field_type") or "unknown"),
                page=int(f.get("page") or 1),
                x=float(cx),
                y=float(cy),
            )
        )

    return norm_fields


def _sorted_text_fields(fields: List[NormField]) -> List[NormField]:
    """
    Return all text-like fields sorted in visual reading order:
      page asc, y asc (top to bottom), x asc (left to right).
    """
    text_like = {"text", "signature", "choice", "dropdown", "unknown"}
    text_fields = [f for f in fields if f.field_type.lower() in text_like]
    text_fields.sort(key=lambda f: (f.page, f.y, f.x))
    return text_fields


def _build_suffix_lookup(fields: List[NormField]) -> Dict[str, List[NormField]]:
    """
    Map suffix (final token after '.' in field name) to fields.

    Examples:
        "EIN_TP.1"     -> suffix "1"
        "2a2"          -> suffix "2a2"
        "Part6.Title"  -> suffix "Title"
        "72"           -> suffix "72"
    """
    out: Dict[str, List[NormField]] = defaultdict(list)
    for f in fields:
        suffix = f.field_id.split(".")[-1]
        out[suffix].append(f)
    return out


# ---------------------------------------------------------------------------
# Mapping helpers
# ---------------------------------------------------------------------------

def _assign_header_field_ids(
    extraction: Dict[str, Any],
    text_fields: List[NormField],
    used_ids: set[str],
) -> None:
    """
    For header_fields[i] without a value_field_id, assign from text_fields in
    visual order and also attach the PDF page number.
    """
    header_fields = extraction.get("header_fields")
    if not isinstance(header_fields, list):
        return

    cursor = 0
    n = len(text_fields)

    for hf in header_fields:
        if not isinstance(hf, MutableMapping):
            continue

        if hf.get("value_field_id"):
            # Already set by ADE – respect it.
            continue

        # Skip over text fields we've already used.
        while cursor < n and text_fields[cursor].field_id in used_ids:
            cursor += 1

        if cursor >= n:
            break

        chosen = text_fields[cursor]
        hf["value_field_id"] = chosen.field_id
        hf["page"] = chosen.page          # <-- NEW
        used_ids.add(chosen.field_id)
        cursor += 1


def _assign_line_item_ids(
    extraction: Dict[str, Any],
    fields: List[NormField],
    used_ids: set[str],
) -> None:
    """
    For each section.line_items[*], assign value_field_id using:
      1) Suffix match on the line 'id'
      2) Fallback to remaining text fields in reading order
    Also attaches the PDF page number when a match is found.
    """
    suffix_lookup = _build_suffix_lookup(fields)
    text_fields = _sorted_text_fields(fields)
    cursor = 0
    n = len(text_fields)

    sections = extraction.get("sections")
    if not isinstance(sections, list):
        return

    for section in sections:
        if not isinstance(section, MutableMapping):
            continue

        line_items = section.get("line_items")
        if not isinstance(line_items, list):
            continue

        for li in line_items:
            if not isinstance(li, MutableMapping):
                continue
            if li.get("value_field_id"):
                continue

            chosen: Optional[NormField] = None

            # 1) Try suffix match with the line ID.
            line_id = li.get("id")
            if line_id is not None:
                candidates = suffix_lookup.get(str(line_id), [])
                for c in candidates:
                    if c.field_id not in used_ids:
                        chosen = c
                        break

            # 2) Fallback: next unused text field in reading order.
            if chosen is None:
                while cursor < n and text_fields[cursor].field_id in used_ids:
                    cursor += 1
                if cursor < n:
                    chosen = text_fields[cursor]
                    cursor += 1

            if chosen is not None:
                li["value_field_id"] = chosen.field_id
                li["page"] = chosen.page      # <-- NEW
                used_ids.add(chosen.field_id)


def _assign_table_ids(
    extraction: Dict[str, Any],
    fields: List[NormField],
    used_ids: set[str],
) -> None:
    """
    Assign IDs to table cells by consuming remaining text fields in reading order.
    Also attaches the PDF page number for each mapped cell.
    """
    text_fields = _sorted_text_fields(fields)
    cursor = 0
    n = len(text_fields)

    sections = extraction.get("sections")
    if not isinstance(sections, list):
        return

    for section in sections:
        if not isinstance(section, MutableMapping):
            continue

        tables = section.get("tables")
        if not isinstance(tables, list):
            continue

        for table in tables:
            rows = table.get("rows")
            if not isinstance(rows, list):
                continue

            for row in rows:
                cells = row.get("cells")
                if not isinstance(cells, list):
                    continue

                for cell in cells:
                    if not isinstance(cell, MutableMapping):
                        continue
                    if cell.get("value_field_id"):
                        continue

                    # Find next unused text field.
                    while cursor < n and text_fields[cursor].field_id in used_ids:
                        cursor += 1
                    if cursor >= n:
                        cell["value_field_id"] = None
                        continue

                    chosen = text_fields[cursor]
                    cursor += 1
                    cell["value_field_id"] = chosen.field_id
                    cell["page"] = chosen.page      # <-- NEW
                    used_ids.add(chosen.field_id)


# ---------------------------------------------------------------------------
# Public entry point used by ade_service.py
# ---------------------------------------------------------------------------

def attach_field_ids_to_extraction(
    pdf_path: Path,
    parse_response: Any,            # kept for future use if we want ADE geometry
    extraction_metadata: Dict[str, Any],
    extraction: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Main hook called from ADE service.

    - Reads all real PDF form fields (including checkboxes, signature, tables).
    - Maps them onto your existing structured extraction.
    - Keeps labels / values exactly as ADE produced them.
    - Only fills / overrides `value_field_id` where it can match something.
    - Adds a debugging list at root: `pdf_form_fields`.
    """
    # 1) Load all fields from the PDF with REAL IDs.
    norm_fields = _load_norm_fields(pdf_path)

    # 2) Prepare for mapping.
    text_fields = _sorted_text_fields(norm_fields)
    used_ids: set[str] = set()

    # 3) Header fields – top-of-form text fields in reading order.
    _assign_header_field_ids(extraction, text_fields, used_ids)

    # 4) Line items (section rows) – by line id suffix, then reading order.
    _assign_line_item_ids(extraction, norm_fields, used_ids)

    # 5) Tables – consume remaining text fields in row-major style.
    _assign_table_ids(extraction, norm_fields, used_ids)

    # 6) Expose raw PDF fields for debugging / external use.
    extraction["pdf_form_fields"] = [
        {
            "field_id": f.field_id,
            "label": f.label,
            "field_type": f.field_type,
            "page": f.page,
            "center": (f.x, f.y),
        }
        for f in norm_fields
    ]

    return extraction
