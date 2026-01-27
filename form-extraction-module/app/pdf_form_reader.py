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

def analyze_table_structure(table: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze a table structure and return metrics that indicate if it's likely misidentified.
    """
    results = {
        "is_likely_table": True,
        "confidence_score": 0.0,
        "issues": [],
        "metrics": {}
    }
        
    # Metric 1: Check for column headers
    column_headers = table.get("column_headers", [])
    results["metrics"]["column_count"] = len(column_headers)
    
    if not column_headers:
        results["confidence_score"] -= 20
        results["issues"].append("No column headers found")
    
    # Metric 2: Analyze row structure consistency
    rows = table.get("rows", [])
    results["metrics"]["row_count"] = len(rows)
    
    if not rows:
        results["confidence_score"] -= 30
        results["issues"].append("No rows found")
        results["is_likely_table"] = False
        return results
    
    # Collect statistics about cell values
    cell_values = []
    null_count = 0
    text_count = 0
    numeric_count = 0
    mixed_content_rows = 0
    
    for row in rows:
        cells = row.get("cells", [])
        row_has_null = False
        row_has_text = False
        
        for cell in cells:
            value = cell.get("value")
            cell_values.append(value)
            
            if value is None:
                null_count += 1
                row_has_null = True
            elif isinstance(value, (int, float)):
                numeric_count += 1
            elif isinstance(value, str):
                text_count += 1
                row_has_text = True
                
                # Check for form-like content
                if any(keyword in value.lower() for keyword in 
                      ["checkbox", "select", "enter", "specify", "fill", "form"]):
                    results["confidence_score"] -= 15
                    results["issues"].append(f"Form-like content found: {value[:50]}...")
        
        if row_has_null and row_has_text:
            mixed_content_rows += 1
    
    results["metrics"]["total_cells"] = len(cell_values)
    results["metrics"]["null_cells"] = null_count
    results["metrics"]["text_cells"] = text_count
    results["metrics"]["numeric_cells"] = numeric_count
    results["metrics"]["mixed_content_rows"] = mixed_content_rows
    
    # Metric 3: Check for header-value mismatch
    header_value_mismatches = 0
    for row in rows:
        cells = row.get("cells", [])
        for cell in cells:
            header = cell.get("header", "")
            value = cell.get("value", "")
            
            # Check if header makes sense for the value
            if value and header:
                # Simple heuristic: if header and value are completely different concepts
                header_lower = header.lower()
                value_lower = str(value).lower()
                
                # Check if value contains header or vice versa (they should be related in a table)
                if (header_lower not in value_lower and 
                    value_lower not in header_lower and
                    len(value_lower) > 5):  # Avoid short values
                    # Check for common unrelated pairs
                    unrelated_pairs = [
                        ("name", "address"),
                        ("id", "checkbox"),
                        ("code", "telephone"),
                        ("tax", "city"),
                        ("number", "ending")
                    ]
                    
                    for pair in unrelated_pairs:
                        if (pair[0] in header_lower and pair[1] in value_lower) or \
                           (pair[1] in header_lower and pair[0] in value_lower):
                            header_value_mismatches += 1
                            break
    
    results["metrics"]["header_value_mismatches"] = header_value_mismatches
    if header_value_mismatches > 0:
        results["confidence_score"] -= header_value_mismatches * 10
        results["issues"].append(f"Found {header_value_mismatches} header-value mismatches")
    
    # Metric 4: Check for form field identifiers in values
    form_field_indicators = 0
    for value in cell_values:
        if isinstance(value, str):
            if value.startswith("fill_") or "value_field_id" in value.lower():
                form_field_indicators += 1
    
    results["metrics"]["form_field_indicators"] = form_field_indicators
    if form_field_indicators > 0:
        results["confidence_score"] -= form_field_indicators * 25
        results["issues"].append(f"Found {form_field_indicators} form field indicators")
    
    # Metric 5: Analyze row_id patterns
    row_ids = [row.get("row_id", "") for row in rows]
    unique_row_ids = set(row_ids)
    results["metrics"]["unique_row_ids"] = len(unique_row_ids)
    
    # Check if row_ids look like form labels vs data identifiers
    form_like_row_ids = 0
    for row_id in row_ids:
        if isinstance(row_id, str) and row_id:
            # Form-like row_ids are often descriptive labels
            if any(word in row_id.lower() for word in 
                  ["name", "address", "contact", "telephone", "city", "state", "zip"]):
                form_like_row_ids += 1
    
    results["metrics"]["form_like_row_ids"] = form_like_row_ids
    if form_like_row_ids > len(rows) * 0.5:  # More than 50% of row_ids look like form labels
        results["confidence_score"] -= 30
        results["issues"].append("Row IDs appear to be form field labels, not data identifiers")
    
    # Metric 6: Check data consistency within columns
    if column_headers and rows:
        column_data = {header: [] for header in column_headers}
        
        for row in rows:
            cells = row.get("cells", [])
            for cell in cells:
                header = cell.get("header")
                value = cell.get("value")
                if header in column_data:
                    column_data[header].append(value)
        
        # Analyze each column's data consistency
        inconsistent_columns = 0
        for header, values in column_data.items():
            if values:
                # Check if values in same column have consistent type/content
                null_values = sum(1 for v in values if v is None)
                text_values = sum(1 for v in values if isinstance(v, str))
                numeric_values = sum(1 for v in values if isinstance(v, (int, float)))
                
                # A proper table column should have consistent data types
                type_counts = [null_values, text_values, numeric_values]
                non_zero_types = sum(1 for count in type_counts if count > 0)
                
                if non_zero_types > 2:  # More than 2 types of data in same column
                    inconsistent_columns += 1
        
        results["metrics"]["inconsistent_columns"] = inconsistent_columns
        if inconsistent_columns > 0:
            results["confidence_score"] -= inconsistent_columns * 15
            results["issues"].append(f"Found {inconsistent_columns} columns with inconsistent data types")
    
    # Calculate final confidence score (starting from 100)
    base_score = 100 + results["confidence_score"]
    results["confidence_score"] = max(0, min(100, base_score))
    
    # Determine if it's likely a table
    if results["confidence_score"] < 50:
        results["is_likely_table"] = False
    elif len(results["issues"]) > 3:
        results["is_likely_table"] = False
    
    return results


def detect_mislabeled_table(table_data: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
    """
    Main function to detect if a table is mislabeled.
    Returns (is_mislabeled, analysis_results)
    """
    analysis = analyze_table_structure(table_data)
    
    # Decision logic
    is_mislabeled = not analysis["is_likely_table"]
    
    # Additional strong indicators
    strong_indicators = []
    
    if analysis["metrics"].get("form_field_indicators", 0) > 0:
        strong_indicators.append("Contains form field IDs")
    
    if analysis["metrics"].get("header_value_mismatches", 0) > 2:
        strong_indicators.append("Multiple header-value mismatches")
    
    if analysis["metrics"].get("mixed_content_rows", 0) > len(table_data["rows"]) * 0.5:
        strong_indicators.append("High percentage of rows with mixed content")
    
    if strong_indicators:
        is_mislabeled = True
        analysis["strong_indicators"] = strong_indicators
    
    return is_mislabeled, analysis

def split_by_keywords(input_string: str) -> Tuple[bool, Any]:
    """
    Split input string by multiple keywords.
    
    Args:
        input_string: The input string to process
    
    Returns:
        Tuple[bool, Any]: (True, list_of_parts) if split/keywords found, 
                          (False, original_string_or_None) otherwise.
    """
    keywords = ["(checkbox)", "(radio)", "(dropdown)"]
    
    if not input_string:
        return False, input_string
    
    # Check if any keyword is present
    found_keyword = False
    temp_string = input_string
    for keyword in keywords:
        if keyword in temp_string:
            # Use a unique placeholder for splitting
            temp_string = temp_string.replace(keyword, "|||SPLIT_KEYWORD|||")
            found_keyword = True
            
    if not found_keyword:
        return False, input_string
    
    # Split by the placeholder and clean results
    parts = temp_string.split("|||SPLIT_KEYWORD|||")
    result = [part.strip() for part in parts if part.strip()]
    
    return True, result