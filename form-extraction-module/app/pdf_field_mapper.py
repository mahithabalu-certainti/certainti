# app/pdf_field_mapper.py

from __future__ import annotations

from collections import defaultdict
from collections.abc import MutableMapping
from dataclasses import dataclass
from math import inf
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.pdf_form_reader import extract_form_fields, get_page_dimensions


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
    bbox: Optional[List[float]] = None


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
                bbox=f.get("bbox"),
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
    # Sort primarily by page.
    # Within a page, standard reading order is Top-to-Bottom, Left-to-Right.
    # PDF Y-coordinates usually start at 0 at the bottom and increase upwards.
    # So "Top" has a higher Y value. We need to sort by Y DESCENDING.
    text_fields.sort(key=lambda f: (f.page, -f.y, f.x))
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

def _build_chunk_map(parse_response: Any) -> Dict[str, Any]:
    """
    Build a map of chunk ID -> chunk object from parse_response.
    """
    chunk_map = {}
    # Handle parse_response as object or dict
    chunks = getattr(parse_response, 'chunks', None)
    if chunks is None and isinstance(parse_response, dict):
        chunks = parse_response.get('chunks')
    
    if not chunks:
        return {}
        
    for chunk in chunks:
        # chunk might be dict or object
        c_id = getattr(chunk, 'id', None)
        if c_id is None and isinstance(chunk, dict):
            c_id = chunk.get('id')
        
        if c_id:
            chunk_map[c_id] = chunk
    return chunk_map


def _calculate_union_box(
    chunk_ids: List[str], 
    chunk_map: Dict[str, Any], 
    page_dims: List[Tuple[float, float]]
) -> Tuple[Optional[List[float]], Optional[int]]:
    """
    Calculate the union bounding box for a list of chunk IDs.
    Returns (bbox, page_index).
    bbox is [x0, y0, x1, y1] in PDF user units.
    page_index is 1-based (matching schema).
    """
    if not chunk_ids:
        return None, None
        
    min_x, min_y = float('inf'), float('inf')
    max_x, max_y = float('-inf'), float('-inf')
    found_any = False
    page_idx_0based = None
    
    for c_id in chunk_ids:
        chunk = chunk_map.get(c_id)
        if not chunk:
            continue
            
        # Access grounding.box
        grounding = getattr(chunk, 'grounding', None)
        if grounding is None and isinstance(chunk, dict):
            grounding = chunk.get('grounding')
        
        if not grounding:
            continue
            
        box = getattr(grounding, 'box', None)
        if box is None and isinstance(grounding, dict):
            box = grounding.get('box')
            
        if not box:
            continue

        # Get page index (0-based) form chunk
        p = getattr(grounding, 'page', None)
        if p is None and isinstance(grounding, dict):
            p = grounding.get('page')
        
        if p is None:
            p = 0 # Default to page 0 if not specified
        
        # We only handle chunks on the same page (or take the first page found)
        # Ideally all chunks for a field value are on the same page.
        if page_idx_0based is None:
            page_idx_0based = int(p)
        elif page_idx_0based != int(p):
            # If spanning pages, ignore chunks on other pages for bbox calculation
            # This is a simplification but robust for most cases.
            continue
            
        # Get dimensions for this page
        if page_idx_0based < len(page_dims):
            width, height = page_dims[page_idx_0based]
        else:
            # Fallback if page index out of range?
            width, height = 0, 0
            continue
            
        # Normalize coords. Box is usually normalized [0,1] relative to page size.
        # box has top, left, bottom, right.
        # In Google Document AI:
        # (0,0) is TOP-LEFT.
        # left, right are x coordinates.
        # top, bottom are y coordinates.
        
        # Access attributes or dict keys
        b_top = getattr(box, 'top', None)
        if b_top is None and isinstance(box, dict): b_top = box.get('top', 0)
        
        b_left = getattr(box, 'left', None)
        if b_left is None and isinstance(box, dict): b_left = box.get('left', 0)
        
        b_bottom = getattr(box, 'bottom', None)
        if b_bottom is None and isinstance(box, dict): b_bottom = box.get('bottom', 0)
        
        b_right = getattr(box, 'right', None)
        if b_right is None and isinstance(box, dict): b_right = box.get('right', 0)

        # Convert to PDF units (Bottom-Left origin)
        # x0 = left * width
        # x1 = right * width
        # y0 = (1 - bottom) * height
        # y1 = (1 - top) * height
        
        x0 = b_left * width
        x1 = b_right * width
        y0 = (1.0 - b_bottom) * height
        y1 = (1.0 - b_top) * height
        
        if x0 < min_x: min_x = x0
        if y0 < min_y: min_y = y0
        if x1 > max_x: max_x = x1
        if y1 > max_y: max_y = y1
        
        found_any = True
        
    if not found_any or page_idx_0based is None:
        return None, None
        
    return [min_x, min_y, max_x, max_y], page_idx_0based + 1


def _assign_ai_positions(
    extraction: Dict[str, Any],
    metadata: Dict[str, Any],
    chunk_map: Dict[str, Any],
    page_dims: List[Tuple[float, float]]
) -> None:
    """
    Traverse extraction and metadata in parallel to assign AI-derived positions.
    """
    # 1. Header Fields
    ex_headers = extraction.get("header_fields", [])
    md_headers = metadata.get("header_fields", [])
    if isinstance(ex_headers, list) and isinstance(md_headers, list):
        for h_ex, h_md in zip(ex_headers, md_headers):
            if not isinstance(h_ex, dict) or not isinstance(h_md, dict):
                continue
            
            # Use value references if present
            refs = h_md.get("value", {}).get("references", [])
            if refs:
                box, page_idx = _calculate_union_box(refs, chunk_map, page_dims)
                if box:
                    h_ex["position"] = box
                    if page_idx is not None:
                        h_ex["page"] = page_idx

    # 2. Sections
    ex_sections = extraction.get("sections", [])
    md_sections = metadata.get("sections", [])
    if isinstance(ex_sections, list) and isinstance(md_sections, list):
        for s_ex, s_md in zip(ex_sections, md_sections):
            if not isinstance(s_ex, dict) or not isinstance(s_md, dict):
                continue
            
            # Line Items
            ex_lines = s_ex.get("line_items", [])
            md_lines = s_md.get("line_items", [])
            if isinstance(ex_lines, list) and isinstance(md_lines, list):
                for li_ex, li_md in zip(ex_lines, md_lines):
                    if not isinstance(li_ex, dict) or not isinstance(li_md, dict):
                        continue
                    refs = li_md.get("value", {}).get("references", [])
                    if refs:
                        box, page_idx = _calculate_union_box(refs, chunk_map, page_dims)
                        if box:
                            li_ex["position"] = box
                            if page_idx is not None:
                                li_ex["page"] = page_idx
            
            # Tables
            ex_tables = s_ex.get("tables", [])
            md_tables = s_md.get("tables", [])
            if isinstance(ex_tables, list) and isinstance(md_tables, list):
                for t_ex, t_md in zip(ex_tables, md_tables):
                    if not isinstance(t_ex, dict) or not isinstance(t_md, dict):
                        continue
                    
                    ex_rows = t_ex.get("rows", [])
                    md_rows = t_md.get("rows", [])
                    if isinstance(ex_rows, list) and isinstance(md_rows, list):
                        for r_ex, r_md in zip(ex_rows, md_rows):
                            ex_cells = r_ex.get("cells", [])
                            md_cells = r_md.get("cells", [])
                            if isinstance(ex_cells, list) and isinstance(md_cells, list):
                                for c_ex, c_md in zip(ex_cells, md_cells):
                                    refs = c_md.get("value", {}).get("references", [])
                                    if refs:
                                        box, page_idx = _calculate_union_box(refs, chunk_map, page_dims)
                                        if box:
                                            c_ex["position"] = box
                                            if page_idx is not None:
                                                c_ex["page"] = page_idx

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
        if not hf.get("page"):
            hf["page"] = chosen.page
        if not hf.get("position"):
            hf["position"] = chosen.bbox
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
                if not li.get("page"):
                    li["page"] = chosen.page
                if not li.get("position"):
                    li["position"] = chosen.bbox
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
                    if not cell.get("page"):
                        cell["page"] = chosen.page
                    if not cell.get("position"):
                        cell["position"] = chosen.bbox
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

    # 3) Build chunk map and assign AI positions first
    try:
        page_dims = get_page_dimensions(pdf_path)
        chunk_map = _build_chunk_map(parse_response)
        _assign_ai_positions(extraction, extraction_metadata, chunk_map, page_dims)
    except Exception as e:
        # Fallback gently if AI positioning fails
        print(f"Warning: Failed to assign AI positions: {e}")

    # 4) Header fields – top-of-form text fields in reading order.
    _assign_header_field_ids(extraction, text_fields, used_ids)

    # 5) Line items (section rows) – by line id suffix, then reading order.
    _assign_line_item_ids(extraction, norm_fields, used_ids)

    # 6) Tables – consume remaining text fields in row-major style.
    _assign_table_ids(extraction, norm_fields, used_ids)

    # 6) Expose raw PDF fields for debugging / external use.
    extraction["pdf_form_fields"] = [
        {
            "field_id": f.field_id,
            "label": f.label,
            "field_type": f.field_type,
            "page": f.page,
            "center": (f.x, f.y),
            "position": f.bbox,
        }
        for f in norm_fields
    ]

    return extraction
