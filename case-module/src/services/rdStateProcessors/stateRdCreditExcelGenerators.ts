import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { uploadToAzureBlob } from "../../utils/helpers";
import { reorderComputedFieldsForState } from "../../utils/stateFieldOrdering";

/**
 * Universal State R&D Credit — Excel Generator
 *
 * Single file that dynamically renders any state's worksheet directly from the
 * `computed_fields` object returned by each state calculator.
 * No per-state hardcoding — layout is driven by per-state config in LAYOUT below.
 *
 * Supports: AZ · CA · CO · CT · DC · KS · IL · NM  (+ any future state via LAYOUT)
 *
 * Three rendering modes:
 *   standard    — single value column  (KS, AZ, CA, CO, CT, DC)
 *   dual-column — side-by-side Col A / Col B  (IL: computed_fields is an array)
 *   dual-value  — two value columns per row: QRE col + Credit col  (NM)
 *
 * Dependencies:  npm install exceljs
 */

// ─────────────────────────────────────────────────────────────────────────────
// Layout types
// ─────────────────────────────────────────────────────────────────────────────

interface DualColumnConfig {
    colAIndex: number;   // 1-based col for Column A values  (IL → 3)
    colBIndex: number;   // 1-based col for Column B values  (IL → 4)
    headerFill: string;  // ARGB fill for the column header rows
}

interface DualValueConfig {
    qreCol: number;      // 1-based col for QRE / expenditure input  (NM → 13)
    creditCol: number;   // 1-based col for computed credit           (NM → 14)
}

interface StateLayout {
    valueCol: number;           // primary value column (unused when dualColumn/dualValue set)
    labelCol: number;           // description column start
    lineNumCol: number | null;  // line-number column (null = none)
    labelMergeEndCol: number;   // description merges up to this col (inclusive)
    colWidths: Record<number, number>;
    fontSize: number;
    headerStyle: "navy-white" | "dark-inline" | "bold-text";
    dataStartRow: number;
    sheetLabel: string;
    dualColumn?: DualColumnConfig;
    dualValue?: DualValueConfig;
    gaTable?: boolean;          // GA-style: computedFields has no computed_fields wrapper; uses table-based sections
    hasQRETable?: boolean;      // Render a QRE summary table (Year / Wages / Contract / Total) from inputFields
    qreTableStartCol?: number;  // Starting column for the side-by-side QRE table (e.g. 8 = col H)
    dualColumnSectionHeader?: string; // Section header row rendered above dual-column headers (default: IL's label; "" = skip)
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-state layout registry
// ─────────────────────────────────────────────────────────────────────────────

const LAYOUT: Record<string, StateLayout> = {
    KS: { valueCol: 7,  
        labelCol: 2, lineNumCol: 1,    
        labelMergeEndCol: 6,  colWidths: { 1:6, 2:53, 7:17.5 },  
        fontSize: 10, headerStyle: "bold-text",  
        dataStartRow: 8,  sheetLabel: "Kansas - Credit Calculations" ,
     hasQRETable: true, qreTableStartCol: 10,             },

    // ME — Col A (8): line num | Col B-M (merged, 90): label | Col N (14): value
    //      QRE table side-by-side at col Q (17): Year | R (18): Wages | S (19): Contract | T (20): Total
    ME: {
        valueCol: 14, labelCol: 2, lineNumCol: 1, labelMergeEndCol: 13,
        colWidths: { 1:8, 2:90, 14:16, 16:4, 17:10, 18:18, 19:20, 20:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "Maine - Credit Calculations",
        hasQRETable: true, qreTableStartCol: 17,
    },
    AZ: { valueCol: 3,  labelCol: 2, lineNumCol: 1,    labelMergeEndCol: 2,  colWidths: { 1:30, 2:128, 3:16.6, 4:42.1 },       fontSize: 10, headerStyle: "bold-text",   dataStartRow: 8,  sheetLabel: "Arizona - Credit Calculation"               },
    CA: { valueCol: 3,  labelCol: 2, lineNumCol: 1,    labelMergeEndCol: 2,  colWidths: { 1:30, 2:128, 3:16.6, 4:42.1 },       fontSize: 10, headerStyle: "bold-text",   dataStartRow: 8,  sheetLabel: "California - Credit Calculation"            },
    CO: { valueCol: 6,  labelCol: 1, lineNumCol: null, labelMergeEndCol: 1,  colWidths: { 1:55, 6:13.6, 7:38.2 },              fontSize: 12, headerStyle: "bold-text",   dataStartRow: 7,  sheetLabel: "Colorado - Credit Calculation"              },
    CT: { valueCol: 3,  labelCol: 2, lineNumCol: 1,    labelMergeEndCol: 2,  colWidths: { 1:17, 2:85, 3:12.6, 4:8 },           fontSize: 9,  headerStyle: "dark-inline", dataStartRow: 9,  sheetLabel: "Connecticut - Credit Calculation"           },
    DC: { valueCol: 11, labelCol: 2, lineNumCol: 1,    labelMergeEndCol: 10, colWidths: { 1:9, 10:10.5, 11:9 },                fontSize: 10, headerStyle: "bold-text",   dataStartRow: 8,  sheetLabel: "District of Columbia - Credit Calculations" },

    // IL — dual-column: computed_fields is an ARRAY [{Column A data}, {Column B data}]
    IL: {
        valueCol: 4,  // Column B (primary) — used for label alignment only
        labelCol: 2, lineNumCol: 1, labelMergeEndCol: 2,
        colWidths: { 1:12, 2:80, 3:16.5, 4:14.6, 5:18.6, 7:4, 8:10, 9:18, 10:20, 11:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 9,
        sheetLabel: "IL Research and Development Tax Credit",
        dualColumn: { colAIndex: 3, colBIndex: 4, headerFill: "FFBFBFBF" },
        hasQRETable: true, qreTableStartCol: 8,
    },

    // NM — dual-value: col M (13) = Qualified Expenditures, col N (14) = Credit
    //      Year header M7:N7 merged; data rows 8–13
    //      QRE side table at cols Q–T (17–20)
    NM: {
        valueCol: 14, labelCol: 2, lineNumCol: 1, labelMergeEndCol: 13,
        colWidths: { 1:8, 2:80, 13:12.625, 14:11.375, 17:8, 18:14.125, 19:17.375, 20:11.25 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "New Mexico - Credit Calculations",
        dualValue: { qreCol: 3, creditCol: 4 },
        hasQRETable: true, qreTableStartCol: 17,
    },

    // IA — standard single-value column; BOLD array lives at computed_fields top level (skipped as a section)
    IA: {
        valueCol: 3,  labelCol: 2, lineNumCol: 1, labelMergeEndCol: 2,
        colWidths: { 1:8, 2:90, 3:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "Iowa - Credit Calculations",
    },

    // ID — standard single-value column (two sections: Basic Research + Qualified Research Expenses)
    ID: {
        valueCol: 3,  labelCol: 2, lineNumCol: 1, labelMergeEndCol: 2,
        colWidths: { 1:8, 2:90, 3:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "Idaho - Credit Calculations",
    },

    // MA — 4-col standard; PART 1/2/3; QRE table side-by-side starting at col H (8)
    MA: {
        valueCol: 4, labelCol: 2, lineNumCol: 1, labelMergeEndCol: 3,
        colWidths: { 1:8, 2:50, 3:25, 4:16, 7:4, 8:10, 9:18, 10:20, 11:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "Massachusetts - Credit Calculations",
        hasQRETable: true, qreTableStartCol: 8,
    },

    // NJ — 4-col standard; PART I–VI; QRE table side-by-side starting at col H (8)
    NJ: {
        valueCol: 4, labelCol: 2, lineNumCol: 1, labelMergeEndCol: 3,
        colWidths: { 1:8, 2:50, 3:25, 4:16, 7:4, 8:10, 9:18, 10:20, 11:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "New Jersey - Credit Calculations",
        hasQRETable: true, qreTableStartCol: 8,
    },

    // OH — 4-col standard; "NoTitle" section (header suppressed); QRE table side-by-side starting at col H (8)
    OH: {
        valueCol: 4, labelCol: 2, lineNumCol: 1, labelMergeEndCol: 3,
        colWidths: { 1:8, 2:50, 3:25, 4:16, 7:4, 8:10, 9:18, 10:20, 11:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "Ohio - Credit Calculations",
        hasQRETable: true, qreTableStartCol: 8,
    },

    // TX — 4-col standard; QRET / preceding / R&D credit sections; QRE table side-by-side starting at col H (8)
    TX: {
        valueCol: 4, labelCol: 2, lineNumCol: 1, labelMergeEndCol: 3,
        colWidths: { 1:8, 2:50, 3:25, 4:16, 7:4, 8:10, 9:18, 10:20, 11:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "Texas - Credit Calculations",
        hasQRETable: true, qreTableStartCol: 8,
    },

    // RI — 4-col standard; single section 10 lines; QRE table side-by-side at col H (8)
    RI: {
        valueCol: 4, labelCol: 2, lineNumCol: 1, labelMergeEndCol: 3,
        colWidths: { 1:8, 2:50, 3:25, 4:16, 7:4, 8:10, 9:18, 10:20, 11:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "Rhode Island - Credit Calculations",
        hasQRETable: true, qreTableStartCol: 8,
    },

    // MN — valueCol N (14), label merges cols 2–13; 34 lines; QRE table side-by-side at col Q (17)
    MN: {
        valueCol: 14, labelCol: 2, lineNumCol: 1, labelMergeEndCol: 13,
        colWidths: { 1:8, 2:90, 14:16, 16:4, 17:10, 18:18, 19:20, 20:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "Minnesota - Credit Calculations",
        hasQRETable: true, qreTableStartCol: 17,
    },

    // WI — wider label col (lines 9/11/23 are very long); single section 23 lines; no QRE side table
    WI: {
        valueCol: 4, labelCol: 2, lineNumCol: 1, labelMergeEndCol: 3,
        colWidths: { 1:8, 2:90, 3:30, 4:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "Wisconsin - Credit Calculations",
        hasQRETable: true, qreTableStartCol: 17,
    },

    // KY — 4-col standard; PART I (4 lines) + PART II (3 lines); QRE table side-by-side at col H (8)
    KY: {
        valueCol: 4, labelCol: 2, lineNumCol: 1, labelMergeEndCol: 3,
        colWidths: { 1:8, 2:50, 3:25, 4:16, 7:4, 8:10, 9:18, 10:20, 11:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "Kentucky - Credit Calculations",
        hasQRETable: true, qreTableStartCol: 8,
    },

    // LA — 4-col standard; single LQRE-6765 section (9 lines); QRE table side-by-side at col H (8)
    LA: {
        valueCol: 4, labelCol: 2, lineNumCol: 1, labelMergeEndCol: 3,
        colWidths: { 1:8, 2:50, 3:25, 4:16, 7:4, 8:10, 9:18, 10:20, 11:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "Louisiana - Credit Calculations",
        hasQRETable: true, qreTableStartCol: 8,
    },

    // SC — 4-col standard; single "yesSpilt" section (header suppressed); QRE table side-by-side at col H
    SC: {
        valueCol: 4, labelCol: 2, lineNumCol: 1, labelMergeEndCol: 3,
        colWidths: { 1:8, 2:50, 3:25, 4:16, 7:4, 8:10, 9:18, 10:20, 11:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "South Carolina - Credit Calculations",
        hasQRETable: true, qreTableStartCol: 8,
    },

    // NE — 4-col standard; single "NoTitle" section (25 lines); wide label col for long descriptions
    //      QRE table side-by-side at col H (8)
    NE: {
        valueCol: 4, labelCol: 2, lineNumCol: 1, labelMergeEndCol: 3,
        colWidths: { 1:8, 2:80, 3:30, 4:16, 7:4, 8:10, 9:18, 10:20, 11:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "Nebraska - Credit Calculations",
        hasQRETable: true, qreTableStartCol: 8,
    },

    // NH — 4-col standard; single section 3 lines (A/B/C); QRE table side-by-side at col H (8)
    NH: {
        valueCol: 4, labelCol: 2, lineNumCol: 1, labelMergeEndCol: 3,
        colWidths: { 1:8, 2:50, 3:25, 4:16, 7:4, 8:10, 9:18, 10:20, 11:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "New Hampshire - Credit Calculations",
        hasQRETable: true, qreTableStartCol: 8,
    },

    // VT — wide label col (6 sections with very long labels); valueCol N (14); QRE table at col Q (17)
    VT: {
        valueCol: 14, labelCol: 2, lineNumCol: 1, labelMergeEndCol: 13,
        colWidths: { 1:8, 2:90, 14:16, 16:4, 17:10, 18:18, 19:20, 20:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "Vermont - Credit Calculations",
        hasQRETable: true, qreTableStartCol: 17,
    },

    // GA — complex table structure; computedFields has NO computed_fields wrapper
    //   Col 1 (8)  : line number / prior year label
    //   Col 2 (46) : description / label
    //   Col 3 (22) : table data col 1 (Research Expenses)
    //   Col 4 (22) : table data col 2 (Gross Receipts)
    //   Col 5 (16) : table data col 3 / primary value for single-value rows
    GA: {
        valueCol: 5,  labelCol: 2, lineNumCol: 1, labelMergeEndCol: 4,
        colWidths: { 1:8, 2:46, 3:22, 4:22, 5:16 },
        fontSize: 10, headerStyle: "bold-text", dataStartRow: 8,
        sheetLabel: "Georgia - Credit Calculations",
        gaTable: true,
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Style constants
// ─────────────────────────────────────────────────────────────────────────────

const WHITE        = "FFBFBFBF";
const NEAR_BLACK   = "FF221E1F";
const CURRENCY_FMT = '$#,##0.00;($#,##0.00);"-"';
const THIN         = { style: "thin" } as Partial<ExcelJS.Border>;
const BOTTOM_THIN  = { bottom: THIN };
const ALL_THIN     = { top: THIN, bottom: THIN, left: THIN, right: THIN };

// ─────────────────────────────────────────────────────────────────────────────
// Key parser — handles all bracket formats across states
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedKey {
    lineNum: string;
    description: string;
    isAnnotation: boolean;
    isSubLine: boolean;
}

function parseLineKey(key: string): ParsedKey {
    const m = key.match(/^\[([^\]]+)\]\s*(.*)$/);
    if (m && m[1] !== undefined) {
        const lineNum     = m[1].trim();
        const description = (m[2] ?? "").trim() || key;
        const isSubLine   = /^[0-9]+\s*[a-zA-Z]$/.test(lineNum) || /^[A-Z]$/.test(lineNum);
        return { lineNum, description, isAnnotation: false, isSubLine };
    }
    return { lineNum: "", description: key, isAnnotation: true, isSubLine: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function applyColWidths(ws: ExcelJS.Worksheet, widths: Record<number, number>) {
    for (const [col, width] of Object.entries(widths)) {
        ws.getColumn(Number(col)).width = width;
    }
}

function extractYear(fy: string): number {
    const m = fy?.match(/\d{4}/);
    return m ? parseInt(m[0], 10) : new Date().getFullYear();
}

function writeMetaBlock(ws: ExcelJS.Worksheet, meta: Record<string, any>, fontSize = 10) {
    [
        meta.country     || "TMTI US",
        meta.Description || "Research Tax Credit",
        `Fiscal Year Ended ${meta["Fiscal Year Ended"] ?? ""}`,
        meta.stateDetails || "",
    ].forEach((text, i) => {
        const c = ws.getCell(i + 1, 1);
        c.value = text;
        c.font  = { bold: true, size: fontSize };
    });
}

function setVal(cell: ExcelJS.Cell, raw: unknown, fmt = CURRENCY_FMT, bold = false) {
    const isFormula = typeof raw === "string" && raw.startsWith("=");
    if (isFormula) {
        cell.value = { formula: raw.slice(1) } as ExcelJS.CellFormulaValue;
    } else {
        cell.value = (raw ?? "") as ExcelJS.CellValue;
    }
    cell.numFmt = fmt;
    cell.border = ALL_THIN;
    cell.font   = { size: 10, bold };
    if (!isFormula && typeof raw === "string") {
        cell.alignment = { horizontal: "center" };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };

function writeSectionHeader(ws: ExcelJS.Worksheet, row: number, sectionKey: string, layout: StateLayout, fyLabel?: string) {
    const { headerStyle, valueCol, labelCol, fontSize } = layout;

    if (headerStyle === "dark-inline") {
        ws.getCell(row, 1).value = "Line";
        ws.getCell(row, 1).font  = { size: fontSize };
        const b = ws.getCell(row, labelCol);
        b.value = sectionKey;
        b.font  = { bold: true, size: fontSize, color: { argb: NEAR_BLACK } };
        b.fill  = SECTION_HEADER_FILL;
        b.border = ALL_THIN;
        b.alignment = { horizontal: "left", wrapText: true };
        if (fyLabel) {
            const c = ws.getCell(row, valueCol);
            c.value = fyLabel;
            c.font  = { bold: true, size: fontSize, color: { argb: NEAR_BLACK } };
            c.fill  = SECTION_HEADER_FILL;
            c.border = ALL_THIN;
            c.alignment = { horizontal: "center" };
        }
    } else {
        // navy-white and bold-text both use the same unified style
        try { ws.mergeCells(row, 1, row, valueCol); } catch (_) {}
        const c = ws.getCell(row, 1);
        c.value = sectionKey;
        c.fill  = SECTION_HEADER_FILL;
        c.font  = { bold: true, size: fontSize, color: { argb: NEAR_BLACK } };
        c.alignment = { horizontal: "left", wrapText: true };
        c.border = ALL_THIN;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Standard single-value data row
// ─────────────────────────────────────────────────────────────────────────────

function writeDataRow(ws: ExcelJS.Worksheet, row: number, parsed: ParsedKey, rawValue: unknown, layout: StateLayout, bold = false) {
    const { valueCol, labelCol, lineNumCol, labelMergeEndCol, fontSize } = layout;

    if (lineNumCol && !parsed.isAnnotation) {
        const c = ws.getCell(row, lineNumCol);
        c.value = parsed.lineNum;
        c.font  = { size: fontSize, bold };
        c.border = ALL_THIN;
        c.alignment = { horizontal: parsed.isSubLine ? "center" : "center" };
    }
    if (labelMergeEndCol > labelCol) {
        try { ws.mergeCells(row, labelCol, row, labelMergeEndCol); } catch (_) {}
    }
    const d = ws.getCell(row, labelCol);
    d.value = parsed.description;
    d.font  = { size: fontSize, color: { argb: NEAR_BLACK }, bold };
    d.alignment = { horizontal: "left", wrapText: true };
    d.border = ALL_THIN;

    const vc = ws.getCell(row, valueCol);
    vc.border = ALL_THIN;
    if (rawValue !== "" && rawValue != null) {
        setVal(vc, rawValue, CURRENCY_FMT, bold);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// IL — dual-column renderer
// ─────────────────────────────────────────────────────────────────────────────
//
// IL computed_fields is an ARRAY of two objects:
//   [0] = Column A  (base period averages) — keys shared with [1]
//   [1] = Column B  (current year)         — same keys, different values
//
// Special reserved keys per column object:
//   "Column Name"    → column header title  (row 9)
//   "SubColumn Name" → column sub-title     (row 10)
//   "[Line N] ..."   → normal data rows     (rows 11+)
//
// Layout in the sheet:
//   Col A (lineNum) | Col B (description) | Col C (Column A values) | Col D (Column B values)
//   Lines 23–28 both columns filled; lines 29–32 only Column B (D).
// ─────────────────────────────────────────────────────────────────────────────

function renderIL(ws: ExcelJS.Worksheet, sections: unknown, layout: StateLayout, _fyYear: number) {
    const { dualColumn, fontSize } = layout;
    const dc = dualColumn!;

    // sections for IL is an array
    const cols = Array.isArray(sections) ? sections as Record<string, unknown>[] : [];
    const colA = cols[0] ?? {};
    const colB = cols[1] ?? {};

    // ── Preamble rows ────────────────────────────────────────────────────────
    // Row 7: Schedule 1299-I
    const r7 = ws.getCell(7, 1);
    r7.value = "Schedule 1299-I";
    r7.font  = { bold: true, size: fontSize };

    // Row 8: Research and Development Credit
    const sectionHeader = layout.dualColumnSectionHeader !== undefined
        ? layout.dualColumnSectionHeader
        : "Research and Development Credit (see page 2)";
    const r8 = ws.getCell(8, 1);
    r8.value = sectionHeader;
    r8.font  = { bold: true, size: fontSize };

    // ── Column headers (rows 9–10) ───────────────────────────────────────────
    const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: dc.headerFill } };

    // Row 9: "Column A" | "Column B"  headers with bottom border
    for (const [col, label] of [[dc.colAIndex, colA["Column Name"] ?? "Column A"], [dc.colBIndex, colB["Column Name"] ?? "Column B"]] as [number, string][]) {
        const c = ws.getCell(9, col);
        c.value = label;
        c.font  = { bold: true, size: fontSize };
        c.fill  = HEADER_FILL;
        c.alignment = { horizontal: "center" };
        c.border = BOTTOM_THIN;
    }

    // Row 10: sub-column labels (wrap, taller row)
    ws.getRow(10).height = 50.4;
    for (const [col, label] of [[dc.colAIndex, colA["SubColumn Name"] ?? ""], [dc.colBIndex, colB["SubColumn Name"] ?? ""]] as [number, string][]) {
        const c = ws.getCell(10, col);
        c.value = label;
        c.font  = { bold: true, size: fontSize };
        c.fill  = HEADER_FILL;
        c.alignment = { horizontal: "center", wrapText: true };
    }

    // ── Data rows (lines 23–32) ──────────────────────────────────────────────
    // Collect unique line keys (preserving order) from Column B (the authoritative column)
    const lineKeys = Object.keys(colB).filter(k => k !== "Column Name" && k !== "SubColumn Name");

    let currentRow = 11;
    for (const lineKey of lineKeys) {
        const parsed  = parseLineKey(lineKey);
        const valA    = colA[lineKey];
        const valB    = colB[lineKey];
        const isBold  = lineKey.includes("Line 32") || lineKey.includes("Line 28");

        // Line number — col A
        if (!parsed.isAnnotation) {
            const ln = ws.getCell(currentRow, 1);
           ln.value = parsed.lineNum.replace(/^Line\s*/i, "");  // "Line 23" → "23", then displayed as "Line 23"
            ln.font  = { size: fontSize, bold: isBold };
            ln.border = BOTTOM_THIN;
        }

        // Description — col B
        const desc = ws.getCell(currentRow, 2);
        desc.value = parsed.description;
        desc.font  = { size: fontSize, bold: isBold };
        desc.border = BOTTOM_THIN;
        desc.alignment = { wrapText: true };

        // Column A value (col C) — only if value is meaningful
        if (valA !== "" && valA !== undefined) {
            const cA = ws.getCell(currentRow, dc.colAIndex);
            if (typeof valA === "string" && valA.startsWith("=")) {
                cA.value = { formula: valA.slice(1) } as ExcelJS.CellFormulaValue;
            } else {
                cA.value = (valA ?? 0) as ExcelJS.CellValue;
            }
            cA.numFmt = CURRENCY_FMT;
            cA.border = BOTTOM_THIN;
            cA.font   = { size: fontSize };
        }

        // Column B value (col D)
        const cB = ws.getCell(currentRow, dc.colBIndex);
        if (typeof valB === "string" && valB.startsWith("=")) {
            cB.value = { formula: valB.slice(1) } as ExcelJS.CellFormulaValue;
        } else {
            cB.value = (valB ?? 0) as ExcelJS.CellValue;
        }
        cB.numFmt = CURRENCY_FMT;
        cB.border = BOTTOM_THIN;
        cB.font   = { size: fontSize, bold: isBold };

        currentRow++;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// NM — dual-value renderer
// ─────────────────────────────────────────────────────────────────────────────
// NM — RPD-41326  (Technology Jobs and R&D Tax Credit)
// ─────────────────────────────────────────────────────────────────────────────
//
// NM Excel layout (cols A–N):
//   Row 7 : M7:N7 merged  = fiscal year label
//   Row 8 : A=3, B8:M8 merged = "Qualified Expenditures"   (no value cols)
//   Rows 9–12 (lines 4–7):
//           A = line number, B:L merged = description, M = QRE, N = credit
//   Row 13: A=9, B13:M13 merged = total description, N = total credit (bold)
//
// Input:  sections = { illinois: [colQREobj, colCreditObj] }
//         colQREObj    keys "[N] description" → QRE amount
//         colCreditObj keys "[N] description" → credit amount / total
// ─────────────────────────────────────────────────────────────────────────────

const NM_ACCT_FMT = '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)';
const NM_QRE_FILL = SECTION_HEADER_FILL;

function renderNM(ws: ExcelJS.Worksheet, sections: any, layout: StateLayout, fyYear: number) {
    const { fontSize } = layout;
    const dv = layout.dualValue!;

    // illinois array: [0] = QRE column values, [1] = Credit column values
    const arr: Record<string, unknown>[] = Array.isArray(sections)
        ? sections
        : ((sections as any)?.illinois ?? []);
    const colQRE    = (arr[0] ?? {}) as Record<string, unknown>;
    const colCredit = (arr[1] ?? {}) as Record<string, unknown>;

    // Row 7: M7:N7 merged = fiscal year
    try { ws.mergeCells(7, dv.qreCol, 7, dv.creditCol); } catch (_) {}
    const yrCell = ws.getCell(7, dv.qreCol);
    yrCell.value     = fyYear;
    yrCell.font      = { bold: true, size: fontSize };
    yrCell.alignment = { horizontal: "center" };

    // Iterate credit column keys (authoritative order); skip metadata keys
    let row = layout.dataStartRow;  // starts at 8
    for (const [key, creditVal] of Object.entries(colCredit)) {
        if (key === "Column Name" || key === "SubColumn Name") continue;
        const m = key.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
        if (!m) continue;
        const lineNum = (m[1] ?? "").trim();
        const desc    = (m[2] ?? "").trim();
        const isTotal  = lineNum === "9";
        const isHeader = lineNum === "3";   // Line 3: "Qualified Expenditures" info row

        // Col A: line number (centered)
        const lnCell = ws.getCell(row, 1);
        lnCell.value     = Number(lineNum) || lineNum;
        lnCell.font      = { size: fontSize };
        lnCell.alignment = { horizontal: "center" };

        // Description merge:
        //   Line 3 header → B:M  (cols 2–13)  — full width, no value columns
        //   Lines 4–7     → B:L  (cols 2–12)  — M=QRE, N=credit
        //   Line 9 total  → B:M  (cols 2–13)  — only N=credit
        const labelEnd = (isHeader || isTotal) ? dv.qreCol : dv.qreCol - 1;
        try { ws.mergeCells(row, 2, row, labelEnd); } catch (_) {}
        const descCell = ws.getCell(row, 2);
        descCell.value     = desc;
        descCell.font      = { size: fontSize, bold: isTotal };
        descCell.alignment = { horizontal: "left", wrapText: true };

        if (!isHeader) {
            const qreVal = colQRE[key];

            // M (col 13): QRE value — lines 4–7 only
            if (!isTotal && qreVal !== undefined && qreVal !== "") {
                const qreCell  = ws.getCell(row, dv.qreCol);
                qreCell.value  = qreVal as ExcelJS.CellValue;
                qreCell.numFmt = NM_ACCT_FMT;
                qreCell.font   = { size: fontSize };
            }

            // N (col 14): credit value
            if (creditVal !== undefined && creditVal !== "") {
                const credCell  = ws.getCell(row, dv.creditCol);
                credCell.value  = creditVal as ExcelJS.CellValue;
                credCell.numFmt = NM_ACCT_FMT;
                credCell.font   = { size: fontSize, bold: isTotal };
            }
        }

        row++;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// NM QRE side-table  (cols Q–T = 17–20, rows 1+)
//
// Template layout:
//   Row 1: R1:T1 merged — "Current & Prior years information"  (green fill)
//   Row 2: R2="QRE Wages"  S2="QRE Contractor"  T2="TOTAL"    (bold, centered, green fill)
//   Row 3+: Q=year  R=wages  S=contract  T=total
// ─────────────────────────────────────────────────────────────────────────────

function renderNMQRETable(
    ws: ExcelJS.Worksheet,
    inputFields: Record<string, any>,
    layout: StateLayout
) {
    const { fontSize, qreTableStartCol } = layout;
    const startCol = qreTableStartCol!;   // col Q = 17
    const wagesCol    = startCol + 1;     // col R = 18
    const contractCol = startCol + 2;     // col S = 19
    const totalCol    = startCol + 3;     // col T = 20

    const qreData = inputFields["Current & Prior years information"] as Array<{
        year: any; wages: any; contract: any; sum: any;
    }>;
    if (!Array.isArray(qreData) || qreData.length === 0) return;

    // Row 1: title merged R1:T1
    try { ws.mergeCells(1, wagesCol, 1, totalCol); } catch (_) {}
    const title = ws.getCell(1, wagesCol);
    title.value     = "Current & Prior years information";
    title.font      = { bold: true, size: fontSize, color: { argb: NEAR_BLACK } };
    title.fill      = NM_QRE_FILL;
    title.border    = ALL_THIN;
    title.alignment = { horizontal: "left" };

    // Row 2: column headers (no "Year" header in col Q — matches template)
    const HEADERS: [number, string][] = [
        [wagesCol,    "QRE Wages"],
        [contractCol, "QRE Contractor"],
        [totalCol,    "TOTAL"],
    ];
    for (const [col, label] of HEADERS) {
        const c = ws.getCell(2, col);
        c.value     = label;
        c.font      = { bold: true, size: fontSize };
        c.fill      = NM_QRE_FILL;
        c.alignment = { horizontal: "center", wrapText: true };
        c.border    = ALL_THIN;
    }

    // Data rows starting at row 3
    let dataRow = 3;
    for (const row of qreData) {
        const cells: [any, number, boolean][] = [
            [row.year,     startCol,    false],
            [row.wages,    wagesCol,    true ],
            [row.contract, contractCol, true ],
            [row.sum,      totalCol,    true ],
        ];
        for (const [val, col, isCurrency] of cells) {
            const cell = ws.getCell(dataRow, col);
            if (isCurrency && typeof val === "number") {
                cell.value  = val;
                cell.numFmt = NM_ACCT_FMT;
            } else {
                cell.value = (val ?? "") as ExcelJS.CellValue;
            }
            cell.font   = { size: fontSize, bold: col === totalCol };
            cell.border = ALL_THIN;
            cell.alignment = { horizontal: col === startCol ? "center" : "right" };
        }
        dataRow++;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GA — complex table renderer
// ─────────────────────────────────────────────────────────────────────────────
//
// GA computedFields has NO computed_fields wrapper. Its top-level shape is:
//   {
//     "Input Information"                    : { label: value, ... }
//     "tables"                               : {
//         "Ratio Calculation"                : { table_headers, table_rows, Total }
//         "Calculation of Average"           : { table_headers, table_rows }
//         "Calculation of Tax Base"          : { table_headers, table_rows }
//         "Calculation of Tax Credit"        : { table_headers, table_rows }
//     }
//     "Application of Credit and Carry-Forward" : { "[1] ...": value, ... }
//   }
//
// Layout (5 columns):
//   Col 1 (8)  — line number / year
//   Col 2 (46) — label / description (merged 2–4 for single-value rows)
//   Col 3 (22) — table data col 1
//   Col 4 (22) — table data col 2
//   Col 5 (16) — table data col 3 / primary value for single-value rows
// ─────────────────────────────────────────────────────────────────────────────

const TABLE_HEADER_FILL = SECTION_HEADER_FILL;

function renderGA(ws: ExcelJS.Worksheet, computedFields: Record<string, any>, layout: StateLayout, fyYear: number) {
    const { fontSize, valueCol, labelMergeEndCol } = layout;

    // Year label (col 5, row 6)
    const yrCell = ws.getCell(6, valueCol);
    yrCell.value = fyYear;
    yrCell.font  = { bold: true, size: fontSize };
    yrCell.alignment = { horizontal: "center" };

    let currentRow = layout.dataStartRow;

    // ── 1. Input Information ─────────────────────────────────────────────────
    const inputInfo = computedFields["Input Information"] as Record<string, unknown> | undefined;
    if (inputInfo && typeof inputInfo === "object") {
        const h = ws.getCell(currentRow, 1);
        h.value = "Input Information";
        h.font  = { bold: true, size: fontSize };
        currentRow++;

        for (const [key, value] of Object.entries(inputInfo)) {
            try { ws.mergeCells(currentRow, 1, currentRow, labelMergeEndCol); } catch (_) {}
            const d = ws.getCell(currentRow, 1);
            d.value = key;
            d.font  = { size: fontSize };
            d.alignment = { horizontal: "left", wrapText: true };
            setVal(ws.getCell(currentRow, valueCol), value);
            currentRow++;
        }
        currentRow++; // spacer
    }

    // ── 2. Tables ─────────────────────────────────────────────────────────────
    const tables = computedFields["tables"] as Record<string, any> | undefined;
    if (tables && typeof tables === "object") {
        for (const [tableName, tableData] of Object.entries(tables)) {
            if (!tableData || typeof tableData !== "object") continue;

            const headers: string[]              = tableData.table_headers ?? [];
            const rows: Record<string, unknown>[] = tableData.table_rows   ?? [];
            const total: unknown                 = tableData.Total;
            const numCols = Math.max(headers.length, 1);

            // Table section header (merged across numCols)
            try { ws.mergeCells(currentRow, 1, currentRow, numCols); } catch (_) {}
            const shdr = ws.getCell(currentRow, 1);
            shdr.value = tableName;
            shdr.font  = { bold: true, size: fontSize, color: { argb: NEAR_BLACK } };
            shdr.fill  = TABLE_HEADER_FILL;
            shdr.border = ALL_THIN;
            shdr.alignment = { horizontal: "left" };
            currentRow++;

            // Column headers row
            if (headers.length > 0) {
                ws.getRow(currentRow).height = 28;
                headers.forEach((h, i) => {
                    const c = ws.getCell(currentRow, i + 1);
                    c.value = h;
                    c.font  = { bold: true, size: fontSize };
                    c.alignment = { horizontal: "center", wrapText: true };
                    c.border   = ALL_THIN;
                    c.fill     = TABLE_HEADER_FILL;
                });
                currentRow++;
            }

            // Data rows
            for (const row of rows) {
                headers.forEach((h, i) => {
                    const rawVal = row[h];
                    const c = ws.getCell(currentRow, i + 1);
                    if (typeof rawVal === "number") {
                        c.value  = rawVal;
                        c.numFmt = CURRENCY_FMT;
                    } else {
                        c.value = (rawVal ?? "") as ExcelJS.CellValue;
                    }
                    c.border = ALL_THIN;
                    c.font   = { size: fontSize };
                    c.alignment = { horizontal: i === 0 ? "left" : "right", wrapText: true };
                });
                currentRow++;
            }

            // Total row (Ratio Calculation)
            if (total !== undefined) {
                if (numCols > 1) {
                    try { ws.mergeCells(currentRow, 1, currentRow, numCols - 1); } catch (_) {}
                }
                const tlbl = ws.getCell(currentRow, 1);
                tlbl.value = "Total";
                tlbl.font  = { bold: true, size: fontSize };
                const tval = ws.getCell(currentRow, numCols);
                tval.value = total as ExcelJS.CellValue;
                tval.font  = { bold: true, size: fontSize };
                tval.border = ALL_THIN;
                currentRow++;
            }

            currentRow++; // spacer between tables
        }
    }

    // ── 3. Application of Credit and Carry-Forward ────────────────────────────
    const appSection = computedFields["Application of Credit and Carry-Forward"] as Record<string, unknown> | undefined;
    if (appSection && typeof appSection === "object") {
        const shdr = ws.getCell(currentRow, 1);
        shdr.value = "Application of Credit and Carry-Forward";
        shdr.font  = { bold: true, size: fontSize };
        currentRow++;

        for (const [key, value] of Object.entries(appSection)) {
            writeDataRow(ws, currentRow, parseLineKey(key), value, layout);
            currentRow++;
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// QRE input summary table
// ─────────────────────────────────────────────────────────────────────────────
//
// Renders a "Current & Prior Years QRE Information" table from inputFields.
// Table columns (4):  Year | Wages | Contract Research | Total QRE
// Data comes from inputFields["Current & Prior years information"] which is an
// array of { year, wages, contract, sum }.
// ─────────────────────────────────────────────────────────────────────────────

function renderQRETable(
    ws: ExcelJS.Worksheet,
    inputFields: Record<string, any>,
    layout: StateLayout,
    startRow: number,
    startCol: number = 1
): number {
    const { fontSize } = layout;
    const qreData = inputFields["Current & Prior years information"] as Array<{
        year: any; wages: any; contract: any; sum: any;
    }>;
    if (!Array.isArray(qreData) || qreData.length === 0) return startRow;

    const c0 = startCol;       // Year col
    const c1 = startCol + 1;   // Wages col
    const c2 = startCol + 2;   // Contract col
    const c3 = startCol + 3;   // Total col

    let currentRow = startRow;

    // Section title — merge across 4 cols
    try { ws.mergeCells(currentRow, c0, currentRow, c3); } catch (_) {}
    const title = ws.getCell(currentRow, c0);
    title.value = "Current & Prior Years QRE Information";
    title.font  = { bold: true, size: fontSize };
    title.fill  = TABLE_HEADER_FILL;
    title.alignment = { horizontal: "left" };
    currentRow++;

    // Column headers
    const QRE_HEADERS = ["Year", "Wages", "Contract Research", "Total QRE"];
    QRE_HEADERS.forEach((h, i) => {
        const c = ws.getCell(currentRow, c0 + i);
        c.value = h;
        c.font  = { bold: true, size: fontSize };
        c.alignment = { horizontal: "center", wrapText: true };
        c.border = ALL_THIN;
        c.fill   = TABLE_HEADER_FILL;
    });
    currentRow++;

    // Data rows
    for (const row of qreData) {
        const cells: [any, number, number][] = [
            [row.year,     c0, 0],   // Year — plain
            [row.wages,    c1, 1],   // Wages — currency
            [row.contract, c2, 1],   // Contract — currency
            [row.sum,      c3, 1],   // Total — currency, bold
        ];
        cells.forEach(([val, col, isCurrency]) => {
            const isTotal = col === c3;
            const cell = ws.getCell(currentRow, col);
            if (typeof val === "number" && isCurrency) {
                cell.value  = val;
                cell.numFmt = CURRENCY_FMT;
            } else {
                cell.value = (val ?? "") as ExcelJS.CellValue;
            }
            cell.border = ALL_THIN;
            cell.font   = { size: fontSize, bold: isTotal };
            cell.alignment = { horizontal: col === c0 ? "center" : "right" };
        });
        currentRow++;
    }

    return currentRow;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core generator — dispatches to the right renderer
// ─────────────────────────────────────────────────────────────────────────────

export async function generateStateSheet(
    stateCode: string,
    computeResult: {
        inputFields: { metadata: Record<string, any>; [key: string]: any };
        computedFields: { computed_fields: Record<string, any> | Array<Record<string, unknown>> };
    },
    wb?: ExcelJS.Workbook,
    sheetName?: string
): Promise<ExcelJS.Workbook> {

    const layout   = LAYOUT[stateCode.toUpperCase()];
    if (!layout) throw new Error(`No layout config for state: ${stateCode}`);

    const workbook = wb ?? new ExcelJS.Workbook();
    const tabName  = sheetName ?? stateCode.toUpperCase();
    const existing = workbook.getWorksheet(tabName);
    if (existing) workbook.removeWorksheet(existing.id);

    const ws      = workbook.addWorksheet(tabName);
    const meta    = computeResult.inputFields.metadata;

    // GA does not wrap its output in a computed_fields key — fall back to computedFields itself
    const rawCF      = computeResult.computedFields as any;
    const rawSections = rawCF.computed_fields ?? rawCF;
    // Apply state-specific field/section ordering (skip IL whose sections is an array)
    const sections = Array.isArray(rawSections)
        ? rawSections
        : reorderComputedFieldsForState(stateCode, rawSections);

    const fy      = (meta["Fiscal Year Ended"] as string) ?? "";
    const fyYear  = extractYear(fy);
    const fyLabel = `FY${fyYear}`;

    applyColWidths(ws, layout.colWidths);
    writeMetaBlock(ws, meta, layout.fontSize);

    // ── IL: dual-column ────────────────────────────────────────────────────
    if (layout.dualColumn) {
        renderIL(ws, sections, layout, fyYear);
        if (layout.hasQRETable && layout.qreTableStartCol) {
            renderQRETable(ws, computeResult.inputFields, layout, 1, layout.qreTableStartCol);
        }
        return workbook;
    }

    // ── NM: dual-value ─────────────────────────────────────────────────────
    if (layout.dualValue) {
        renderNM(ws, sections, layout, fyYear);
        if (layout.hasQRETable && layout.qreTableStartCol) {
            renderNMQRETable(ws, computeResult.inputFields, layout);
        }
        return workbook;
    }

    // ── GA: complex table renderer ─────────────────────────────────────────
    if (layout.gaTable) {
        renderGA(ws, sections as Record<string, any>, layout, fyYear);
        return workbook;
    }

    // ── Standard: single value column ──────────────────────────────────────

    // QRE table — rendered side-by-side on the right starting at row 1, col H (qreTableStartCol).
    // This runs independently of the left-side computed-field layout.
    if (layout.hasQRETable && layout.qreTableStartCol) {
        renderQRETable(ws, computeResult.inputFields, layout, 1, layout.qreTableStartCol);
    }

    writeYearLabel(ws, layout, fyYear);
    let currentRow = layout.dataStartRow;

    // Collect bold key names declared at the top level of sections (e.g. IA)
    const boldKeys = new Set<string>(
        Array.isArray(sections["BOLD"]) ? (sections["BOLD"] as string[]) : []
    );

    for (const [sectionKey, sectionData] of Object.entries(sections as Record<string, Record<string, unknown>>)) {
        // Skip non-object sections and top-level arrays (e.g. BOLD key in IA)
        if (typeof sectionData !== "object" || sectionData === null || Array.isArray(sectionData)) continue;

        // Sentinel keys used by some states to emit a section with no visible header
        const SUPPRESS_HEADER = new Set(["NoTitle", "yesSpilt"]);
        if (!SUPPRESS_HEADER.has(sectionKey)) {
            writeSectionHeader(ws, currentRow, sectionKey, layout, fyLabel);
            currentRow++;
        }

        for (const [lineKey, rawValue] of Object.entries(sectionData)) {
            if (lineKey === "BOLD" || Array.isArray(rawValue)) continue;
            if (lineKey === "text") {
                const c = ws.getCell(currentRow, layout.labelCol);
                c.value = rawValue as string;
                c.font  = { size: layout.fontSize };
                c.alignment = { wrapText: true };
                currentRow++;
                continue;
            }
            const isBold = boldKeys.has(lineKey);
            writeDataRow(ws, currentRow, parseLineKey(lineKey), rawValue, layout, isBold);
            currentRow++;
        }
        currentRow++;
    }

    return workbook;
}

function writeYearLabel(ws: ExcelJS.Worksheet, layout: StateLayout, fyYear: number) {
    const c = ws.getCell(6, layout.valueCol);
    c.value = fyYear;
    c.font  = { bold: true, size: layout.fontSize };
    c.alignment = { horizontal: "center" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Save + dispatch helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function saveStateExcel(
    stateCode: string,
    computeResult: Parameters<typeof generateStateSheet>[1],
    caseRid: string,
    fiscalYear: number | string,
    outputDir?: string,
    prebuiltWorkbook?: ExcelJS.Workbook
): Promise<string> {
    const dir = outputDir
        ? path.resolve(outputDir)
        : path.resolve(__dirname, "..", "..", "exports");
    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, `${stateCode.toUpperCase()}_${caseRid}_${fiscalYear}.xlsx`);
    const workbook = prebuiltWorkbook ?? await generateStateSheet(stateCode, computeResult);
    await workbook.xlsx.writeFile(filePath);
    console.log(`R&D Credit Excel saved → ${filePath}`);
    return filePath;
}

/**
 * Call this after insertRDStateCreditCalculation() for every state.
 * Silently skips states that have no layout config yet.
 *
 * When uploadParams is provided the workbook is written to an in-memory buffer,
 * uploaded to Azure Blob Storage, and the blob URL is returned.
 * Without uploadParams the workbook is saved to the local filesystem instead.
 *
 * Usage in stateComputation.ts > runComputationState():
 *
 *   const url = await dispatchStateExcelGenerator(
 *       config.state_code, result, caseRid, currentFiscalYear,
 *       { accountRid, accountNumber: r_number }
 *   );
 */
export async function dispatchStateExcelGenerator(
    stateCode: string,
    computeResult: Parameters<typeof generateStateSheet>[1],
    caseRid: string,
    fiscalYear: number | string,
    uploadParams?: { accountRid: string; accountNumber: string },
    outputDir?: string
): Promise<string | null> {
    if (!LAYOUT[stateCode.toUpperCase()]) {
        console.log(`[ExcelGen] No layout registered for state: ${stateCode} — skipping`);
        return null;
    }
    try {
        const workbook = await generateStateSheet(stateCode, computeResult);

        if (uploadParams) {
            const { accountRid, accountNumber } = uploadParams;
            const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
            const fileName = `${stateCode.toUpperCase()}_${caseRid}_${fiscalYear}.xlsx`;

            const mockFile: Express.Multer.File = {
                fieldname: "file",
                originalname: fileName,
                encoding: "7bit",
                mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                buffer,
                size: buffer.length,
                stream: null as any,
                destination: "",
                filename: fileName,
                path: "",
            };

            const { url } = await uploadToAzureBlob(mockFile, accountRid, caseRid, accountNumber, "cases");
            console.log(`[ExcelGen] Uploaded ${stateCode} Excel → ${url}`);
            return url;
        }

        return await saveStateExcel(stateCode, computeResult, caseRid, fiscalYear, outputDir, workbook);
    } catch (err) {
        console.error(`[ExcelGen] Failed for ${stateCode}:`, err);
        return null;
    }
}

export function registerStateLayout(stateCode: string, layout: StateLayout): void {
    LAYOUT[stateCode.toUpperCase()] = layout;
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined workbook helpers — generate ONE Excel with one sheet per state
// ─────────────────────────────────────────────────────────────────────────────

// Sheet 1: Fed R&D-2025, Sheet 2: State-Credit Summary, then states in this order
export const STATE_SHEET_ORDER: string[] = [
    "AZ", "CA", "CO", "CT", "GA", "IL", "MA", "NJ", "OH", "SC", "TX",
    "ID", "IA", "KS", "KY", "LA", "ME", "MD", "MN", "NE", "NH", "NM",
    "NY", "ND", "RI", "VT", "VA", "DC", "WI",
];

/**
 * Create an empty workbook to share across all state generators.
 */
export function createWorkbook(): ExcelJS.Workbook {
    return new ExcelJS.Workbook();
}

/**
 * Add one state's sheet to an existing shared workbook.
 * Returns true if the state has a registered layout and the sheet was added,
 * false if the state is unsupported (so the caller can track which states were included).
 */
export async function addStateSheetToWorkbook(
    workbook: ExcelJS.Workbook,
    stateCode: string,
    computeResult: Parameters<typeof generateStateSheet>[1]
): Promise<boolean> {
    if (!LAYOUT[stateCode.toUpperCase()]) {
        console.log(`[ExcelGen] No layout for ${stateCode} — sheet skipped`);
        return false;
    }
    try {
        await generateStateSheet(stateCode, computeResult, workbook);
        return true;
    } catch (err) {
        console.error(`[ExcelGen] Failed to add sheet for ${stateCode}:`, err);
        return false;
    }
}

/**
 * Upload the combined workbook (all state sheets) to Azure Blob Storage.
 * Returns the blob URL, or null on failure.
 */
export async function uploadCombinedWorkbook(
    workbook: ExcelJS.Workbook,
    caseRid: string,
    fiscalYear: number | string,
    accountRid: string,
    accountNumber: string
): Promise<string | null> {
    try {
        const buffer   = Buffer.from(await workbook.xlsx.writeBuffer());
        const fileName = `RD_Credits_${caseRid}_${fiscalYear}.xlsx`;

        const mockFile: Express.Multer.File = {
            fieldname:    "file",
            originalname: fileName,
            encoding:     "7bit",
            mimetype:     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            buffer,
            size:         buffer.length,
            stream:       null as any,
            destination:  "",
            filename:     fileName,
            path:         "",
        };

        const { url } = await uploadToAzureBlob(mockFile, accountRid, caseRid, accountNumber, "cases");
        console.log(`[ExcelGen] Uploaded combined workbook → ${url}`);
        return url;
    } catch (err) {
        console.error(`[ExcelGen] Failed to upload combined workbook:`, err);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Federal USA sheet — Form 6765 (RRC + ASC)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a "Federal USA" sheet to an existing workbook from country calculation data.
 * computedFields shape (from usaRdCreditCalculator.buildComputedFields):
 *   { "(Regular Credit)": { ..., rrc280C: { reduction280c: { no_elect280c: {...} } } },
 *     "(ASC Credit)":     { ..., asc280C: { reduction280c: { no_elect280c: {...} } } },
 *     "Research and Development Tax Credit": <number> }
 */
export function addFederalSheetToWorkbook(
    workbook: ExcelJS.Workbook,
    inputParams: Record<string, any>,
    computedFields: Record<string, any>,
): void {
    const LABEL_COL  = 2;
    const LINE_COL   = 1;
    const VALUE_COL  = 4;
    const MERGE_END  = 3;
    const FONT_SIZE  = 10;

    const tabName = "Fed R&D-2025";
    const existing = workbook.getWorksheet(tabName);
    if (existing) workbook.removeWorksheet(existing.id);
    const ws = workbook.addWorksheet(tabName);

    ws.getColumn(1).width = 10;
    ws.getColumn(2).width = 70;
    ws.getColumn(3).width = 20;
    ws.getColumn(4).width = 18;

    // Meta block (rows 1–4)
    const meta = inputParams?.metadata ?? {};
    const taxYearEnded = meta["Tax Year Ended:"] ?? meta["Fiscal Year Ended"] ?? "";
    [
        "Federal USA",
        "Research and Development Tax Credit",
        `Tax Year Ended: ${taxYearEnded}`,
        meta.credit_type ?? "Federal R&D Credit - USA",
    ].forEach((text, i) => {
        const c = ws.getCell(i + 1, 1);
        c.value = text;
        c.font  = { bold: true, size: FONT_SIZE };
    });

    // QRE summary table (rows 1–6, cols 6–9)
    const qreSummary: Record<string, number> = inputParams?.qreSummary ?? {};
    const priorQREs: any[]  = inputParams?.["Total Qualified Research Expenses"] ?? [];
    const grossReceipts: any[] = inputParams?.["Average Annual Gross Receipts"] ?? [];

    const drawQREHeader = (row: number, col: number, label: string) => {
        const c = ws.getCell(row, col);
        c.value = label;
        c.font  = { bold: true, size: FONT_SIZE, color: { argb: NEAR_BLACK } };
        c.fill  = SECTION_HEADER_FILL;
        c.border = ALL_THIN;
        c.alignment = { horizontal: "center", wrapText: true };
    };

    // QRE Summary block at cols 6–9
    drawQREHeader(1, 6, "QRE Summary");
    ws.mergeCells(1, 6, 1, 9);
    ["Category", "Amount"].forEach((h, i) => drawQREHeader(2, 6 + i * 3, h));
    let qRow = 3;
    for (const [label, val] of Object.entries(qreSummary)) {
        ws.getCell(qRow, 6).value = label;
        ws.getCell(qRow, 6).border = ALL_THIN;
        ws.getCell(qRow, 6).font  = { size: FONT_SIZE };
        const vc = ws.getCell(qRow, 9);
        vc.value  = typeof val === "number" ? val : 0;
        vc.numFmt = CURRENCY_FMT;
        vc.border = ALL_THIN;
        vc.font   = { size: FONT_SIZE };
        qRow++;
    }

    // Prior QREs table (cols 6–9, after QRE summary)
    if (priorQREs.length > 0) {
        qRow++;
        drawQREHeader(qRow, 6, "Prior Year QREs");
        ws.mergeCells(qRow, 6, qRow, 9);
        qRow++;
        ["Year", "Total QRE"].forEach((h, i) => drawQREHeader(qRow, 6 + i, h));
        qRow++;
        for (const row of priorQREs) {
            ws.getCell(qRow, 6).value  = row["Fiscal Year"] ?? "";
            ws.getCell(qRow, 6).border = ALL_THIN;
            ws.getCell(qRow, 6).font   = { size: FONT_SIZE };
            const vc = ws.getCell(qRow, 7);
            vc.value  = typeof row["Total"] === "number" ? row["Total"] : 0;
            vc.numFmt = CURRENCY_FMT;
            vc.border = ALL_THIN;
            vc.font   = { size: FONT_SIZE };
            qRow++;
        }
    }

    // Gross receipts table
    if (grossReceipts.length > 0) {
        qRow++;
        drawQREHeader(qRow, 6, "Annual Gross Receipts");
        ws.mergeCells(qRow, 6, qRow, 9);
        qRow++;
        ["Year", "Gross Receipts"].forEach((h, i) => drawQREHeader(qRow, 6 + i, h));
        qRow++;
        for (const row of grossReceipts) {
            ws.getCell(qRow, 6).value  = row["Fiscal Year"] ?? "";
            ws.getCell(qRow, 6).border = ALL_THIN;
            ws.getCell(qRow, 6).font   = { size: FONT_SIZE };
            const vc = ws.getCell(qRow, 7);
            vc.value  = typeof row["Total"] === "number" ? row["Total"] : Number(row["Total"] ?? 0);
            vc.numFmt = CURRENCY_FMT;
            vc.border = ALL_THIN;
            vc.font   = { size: FONT_SIZE };
            qRow++;
        }
    }

    // Year label at row 6
    ws.getCell(6, VALUE_COL).value = taxYearEnded ? extractYear(String(taxYearEnded)) : "";
    ws.getCell(6, VALUE_COL).font  = { bold: true, size: FONT_SIZE };

    let currentRow = 8;

    const writeFederalSectionHeader = (label: string) => {
        try { ws.mergeCells(currentRow, 1, currentRow, VALUE_COL); } catch (_) {}
        const c = ws.getCell(currentRow, 1);
        c.value = label;
        c.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
        c.font  = { bold: true, size: FONT_SIZE, color: { argb: NEAR_BLACK } };
        c.alignment = { horizontal: "left", wrapText: true };
        c.border = ALL_THIN;
        c.alignment = { wrapText: true };
        currentRow++;
    };

    const writeFederalDataRow = (lineKey: string, rawValue: unknown, bold = false) => {
        const parsed = parseLineKey(lineKey);
        if (!parsed.isAnnotation) {
            const lc = ws.getCell(currentRow, LINE_COL);
            lc.value = parsed.lineNum;
            lc.font  = { size: FONT_SIZE, bold };
            lc.border = ALL_THIN;
            lc.alignment = { horizontal: "center" };
        }
        try { ws.mergeCells(currentRow, LABEL_COL, currentRow, MERGE_END); } catch (_) {}
        const dc = ws.getCell(currentRow, LABEL_COL);
        dc.value = parsed.description;
        dc.font  = { size: FONT_SIZE, color: { argb: NEAR_BLACK }, bold };
        dc.alignment = { horizontal: "left", wrapText: true };
        dc.border = ALL_THIN;

        const vc = ws.getCell(currentRow, VALUE_COL);
        vc.border = ALL_THIN;
        if (rawValue !== "" && rawValue != null) {
            const isStr = typeof rawValue === "string";
            vc.value  = rawValue as ExcelJS.CellValue;
            vc.numFmt = isStr ? "@" : CURRENCY_FMT;
            vc.font   = { size: FONT_SIZE, bold };
            if (isStr) vc.alignment = { horizontal: "center" };
        }
        currentRow++;
    };

    // Flatten rrc280C / asc280C sub-objects into their parent section, drop final_credit
    const flattenSection = (sectionData: Record<string, any>): Record<string, any> => {
        const flat: Record<string, any> = {};
        for (const [k, v] of Object.entries(sectionData)) {
            if (k === "final_credit") continue;
            if ((k === "rrc280C" || k === "asc280C") && v?.reduction280c?.no_elect280c) {
                Object.assign(flat, v.reduction280c.no_elect280c);
            } else {
                flat[k] = v;
            }
        }
        return flat;
    };

    // Render an already-flattened and ordered section
    const renderFederalSection = (sectionLabel: string, sectionData: Record<string, any>, boldSet: Set<string>) => {
        writeFederalSectionHeader(sectionLabel);
        for (const [lineKey, rawValue] of Object.entries(sectionData)) {
            writeFederalDataRow(lineKey, rawValue, boldSet.has(lineKey));
        }
        currentRow++;
    };

    const rawCf = typeof computedFields === "string" ? JSON.parse(computedFields) : (computedFields ?? {});

    // Pre-flatten 280C nesting, then apply field ordering for USA federal
    const flatCf: Record<string, any> = {};
    for (const [k, v] of Object.entries(rawCf)) {
        if ((k === "(Regular Credit)" || k === "(ASC Credit)") && typeof v === "object" && v !== null) {
            flatCf[k] = flattenSection(v as Record<string, any>);
        } else {
            flatCf[k] = v;
        }
    }
    const cf = reorderComputedFieldsForState("USA", flatCf);
    const boldKeys = new Set<string>(Array.isArray(cf["BOLD"]) ? (cf["BOLD"] as string[]) : []);

    const rrcSection = cf["(Regular Credit)"];
    const ascSection = cf["(ASC Credit)"];
    const finalCredit = rawCf["Research and Development Tax Credit"];

    if (rrcSection && typeof rrcSection === "object") {
        renderFederalSection("Regular Research Credit (RRC) — Form 6765, Section A", rrcSection, boldKeys);
    }
    if (ascSection && typeof ascSection === "object") {
        renderFederalSection("Alternative Simplified Credit (ASC) — Form 6765, Section B", ascSection, boldKeys);
    }

    // Final credit row
    if (finalCredit != null) {
        writeFederalSectionHeader("Research and Development Tax Credit");
        const vc = ws.getCell(currentRow, VALUE_COL);
        vc.value  = typeof finalCredit === "number" ? finalCredit : 0;
        vc.numFmt = CURRENCY_FMT;
        vc.border = ALL_THIN;
        vc.font   = { bold: true, size: FONT_SIZE };
        try { ws.mergeCells(currentRow, LABEL_COL, currentRow, MERGE_END); } catch (_) {}
        const dc = ws.getCell(currentRow, LABEL_COL);
        dc.value = "Tax Credit";
        dc.font  = { bold: true, size: FONT_SIZE };
        dc.border = ALL_THIN;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// State Credit Summary sheet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a "State Credit Summary" sheet to an existing workbook.
 * summaryData shape (from RDCreditSchemaService.getStateSummaryResults):
 *   { federal: { stateName: { state_code, total_projects, total_resources, total_QRE, RD_credits }, Total: { RD_credits } } }
 */
export function addStateSummarySheetToWorkbook(
    workbook: ExcelJS.Workbook,
    summaryData: Record<string, any>,
): void {
    const tabName = "State-Credit Summary";
    const existing = workbook.getWorksheet(tabName);
    if (existing) workbook.removeWorksheet(existing.id);
    const ws = workbook.addWorksheet(tabName);

    ws.getColumn(1).width = 14;
    ws.getColumn(2).width = 30;
    ws.getColumn(3).width = 18;
    ws.getColumn(4).width = 18;
    ws.getColumn(5).width = 18;
    ws.getColumn(6).width = 18;

    const TITLE_ROW = 1;
    ws.mergeCells(TITLE_ROW, 1, TITLE_ROW, 6);
    const title = ws.getCell(TITLE_ROW, 1);
    title.value = "State R&D Credit Summary";
    title.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
    title.font  = { bold: true, size: 12, color: { argb: NEAR_BLACK } };
    title.border = ALL_THIN;
    title.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(TITLE_ROW).height = 20;

    const HEADERS = ["State Code", "State Name", "Total Projects", "Total Resources", "Total QRE", "R&D Credits"];
    const HEADER_ROW = 2;
    HEADERS.forEach((h, i) => {
        const c = ws.getCell(HEADER_ROW, i + 1);
        c.value = h;
        c.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
        c.font  = { bold: true, size: 10, color: { argb: NEAR_BLACK } };
        c.border = ALL_THIN;
        const noCenter = ["State Code", "State Name"];
        c.alignment = { horizontal: (noCenter.includes(h) ? "left" : "center"), wrapText: true };
    });

    const stateRows = Object.entries((summaryData?.federal ?? summaryData) as Record<string, any>)
        .filter(([name]) => name !== "Total");

    let dataRow = HEADER_ROW + 1;
    for (const [stateName, info] of stateRows) {
        const cols = [
            info.state_code ?? "",
            stateName,
            info.total_projects ?? "",
            info.total_resources ?? "",
            info.total_QRE ?? 0,
            info.RD_credits ?? 0,
        ];
        cols.forEach((val, i) => {
            const c = ws.getCell(dataRow, i + 1);
            const isCurrency = i >= 4;
            c.value  = val as ExcelJS.CellValue;
            c.border = ALL_THIN;
            c.font   = { size: 10 };
            if (isCurrency) {
                c.numFmt = CURRENCY_FMT;
                c.alignment = { horizontal: "right" };
            } else {
                c.alignment = { horizontal: "center" };
            }
        });
        dataRow++;
    }

    // Total row
    const totalInfo = (summaryData?.federal ?? summaryData)?.["Total"] ?? {};
    ["Total", "", "", "", "", totalInfo.RD_credits ?? 0].forEach((val, i) => {
        const c = ws.getCell(dataRow, i + 1);
        c.value  = val as ExcelJS.CellValue;
        c.border = ALL_THIN;
        c.font   = { bold: true, size: 10, color: { argb: NEAR_BLACK } };
        c.fill   = SECTION_HEADER_FILL;
        if (i >= 4) {
            c.numFmt = CURRENCY_FMT;
            c.alignment = { horizontal: "right" };
        } else {
            c.alignment = { horizontal: "center" };
        }
    });
}

/**
 * Save combined workbook locally to the filesystem for testing purposes
 * @param workbook The ExcelJS workbook to save
 * @param caseRid The case ID
 * @param fiscalYear The fiscal year
 * @param outputDir Optional output directory (defaults to ./temp/excel_exports)
 * @returns Path to the saved file or null if save failed
 */
export async function saveCombinedWorkbookLocal(
    workbook: ExcelJS.Workbook,
    caseRid: string,
    fiscalYear: number | string,
    outputDir: string = "./temp/excel_exports"
): Promise<string | null> {
    try {
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const fileName = `RD_Credits_${caseRid}_${fiscalYear}.xlsx`;
        const filePath = path.join(outputDir, fileName);

        // Save workbook to file
        await workbook.xlsx.writeFile(filePath);
        console.log(`[ExcelGen] Saved combined workbook locally → ${filePath}`);
        return filePath;
    } catch (err) {
        console.error(`[ExcelGen] Failed to save combined workbook locally:`, err);
        return null;
    }
}