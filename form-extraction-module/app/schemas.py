# app/schemas.py
from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


# ---------- Header / top-of-form fields ----------


class FormHeaderField(BaseModel):
    """
    A field that appears in the header or immediately before Section A on page 1.
    """
    label: str = Field(
        description=(
            "The exact text label that appears next to the field in the form header or "
            "pre-Section questions."
        )
    )
    field_type: Optional[str] = Field(
        default=None,
        description=(
            "The type of field, such as 'text', 'number', or 'yes_no'. "
            "For yes/no questions, use 'yes_no'."
        ),
    )
    value: Optional[str] = Field(
        default=None,
        description=(
            "The value of the field as filled in the document. If nothing is filled or "
            "selected, this must be null."
        ),
    )
    value_field_id: Optional[str] = Field(
        default=None,
        description=(
            "The underlying PDF form field ID (e.g. 'EIN_TP.1', '2a2', '72', etc.) "
            "if this header field is backed by a fillable control."
        ),
    )
    page: Optional[int] = Field(
        default=None,
        description=(
            "1-based page number in the source PDF where this header field's input "
            "control appears."
        ),
    )
    position: Optional[List[float]] = Field(
        default=None,
        description=(
            "Bounding box [x0, y0, x1, y1] in PDF user units."
        ),
    )


# ---------- Line items (1–xx etc.) ----------


class LineItem(BaseModel):
    """
    One numbered line in any section of the form that is represented as
    a single row of text with an amount box (e.g. lines 1–48).
    """
    id: str = Field(
        description=(
            "The line identifier printed at the left of the line in the form. "
            "For example, '1', '2', '3', '13', etc."
        )
    )
    label: str = Field(
        description=(
            "The full descriptive text of the line item as printed in the document."
        )
    )
    value: Optional[str] = Field(
        default=None,
        description=(
            "The value or amount entered on that line, if any. "
            "If the field is blank on the document, this must be null."
        ),
    )
    value_field_id: Optional[str] = Field(
        default=None,
        description=(
            "The underlying PDF form field ID that holds the numeric value "
            "for this line, or null if there is no fillable control."
        ),
    )
    page: Optional[int] = Field(
        default=None,
        description=(
            "1-based page number in the source PDF where this line's input box appears."
        ),
    )
    position: Optional[List[float]] = Field(
        default=None,
        description=(
            "Bounding box [x0, y0, x1, y1] in PDF user units."
        ),
    )


# ---------- Generic table structures (Section G / Part 8 / etc.) ----------


class TableCell(BaseModel):
    """
    One cell in a tabular structure.
    """
    header: Optional[str] = Field(
        default=None,
        description=(
            "The header text of the column this cell belongs to. "
            "Null when the model cannot infer the column header (e.g. body cells)."
        ),
    )
    value: Optional[str] = Field(
        default=None,
        description=(
            "The value contained in the cell under this header for the row. "
            "If the table cell is blank, this must be null."
        )
    )
    value_field_id: Optional[str] = Field(
        default=None,
        description=(
            "The underlying PDF form field ID used for this table cell, "
            "or null if the cell is not backed by a fillable control."
        ),
    )
    page: Optional[int] = Field(
        default=None,
        description=(
            "1-based page number in the source PDF where this table cell's "
            "input control appears."
        ),
    )
    position: Optional[List[float]] = Field(
        default=None,
        description=(
            "Bounding box [x0, y0, x1, y1] in PDF user units."
        ),
    )


class TableRow(BaseModel):
    """
    One row in a table.

    `row_id` is usually the number in the first column (e.g. '1', '43', '50', 'Total').
    """

    row_id: str = Field(
        description=(
            "Identifier for the row as printed in the first column ('1', '2', '50', "
            "'Total', etc.)."
        )
    )
    cells: List[TableCell] = Field(
        description="All cells in this row, one per column, ordered left-to-right."
    )


class SectionTable(BaseModel):
    """
    A logical table inside a section / part.
    """

    table_id: Optional[str] = Field(
        default=None,
        description=(
            "Identifier for the table if apparent, such as '49(a)-49(d)', "
            "'49(e)-49(f)', 'Part 8 (a)-(d)', etc."
        ),
    )
    title: Optional[str] = Field(
        default=None,
        description="Caption / title of the table, if present.",
    )
    column_headers: List[str] = Field(
        description=(
            "Ordered list of column header texts as they appear at the top of the table."
        )
    )
    rows: List[TableRow] = Field(
        description="All rows in the table, in reading order (including totals rows)."
    )


# ---------- Sections & full form ----------


class FormSection(BaseModel):
    """
    A logical section / part of the form.

    Examples:
      - 'Section A—Regular Credit'
      - 'Section G—Business Component Information'
      - 'Part 1 – Qualification for the Credit'
      - 'Part 8 – Available Credit Carryover Generated Before 01/01/2022'
    """

    section_id: Optional[str] = Field(
        default=None,
        description=(
            "Section identifier as printed, e.g. 'A', 'B', 'C', 'G', 'Part 1', 'Part 8'."
        ),
    )
    section_title: str = Field(
        description="Full section / part title exactly as printed on the form."
    )
    line_items: List[LineItem] = Field(
        default_factory=list,
        description=(
            "All numbered / lettered line items that belong to this section and are "
            "not part of a multi-column table."
        ),
    )
    tables: List[SectionTable] = Field(
        default_factory=list,
        description=(
            "All tabular structures that belong to this section (e.g. Section G tables, "
            "Part 8 tables)."
        ),
    )


class Form6765(BaseModel):
    """
    High-level structure for the entire (generic) credit form.
    """

    form_name: Optional[str] = Field(
        default=None,
        description="Official name of the form, e.g. 'Form 6765', 'Arizona Form 308'.",
    )
    tax_year: Optional[str] = Field(
        default=None,
        description="Tax year / revision text, e.g. '2024', 'Rev. December 2024'.",
    )
    header_fields: List[FormHeaderField] = Field(
        default_factory=list,
        description=(
            "All header / pre-section fields on page 1 (names, EIN, and initial yes/no "
            "questions)."
        ),
    )
    sections: List[FormSection] = Field(
        default_factory=list,
        description=(
            "All major sections / parts in reading order; each has line items and/or "
            "tables."
        ),
    )

    class Config:
        # Needed so we can attach `pdf_form_fields` later even though it's not
        # defined in the schema we send to ADE.
        extra = "allow"


class ExtractionResponse(Form6765):
    """
    API response model – currently same as Form6765.
    """
    pass
