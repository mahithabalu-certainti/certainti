import ExcelJS from "exceljs";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectRow = Record<string, unknown>;

export type IrelandFinalData = {
  Title: {
    "Account ID": string;
    "Account Name": string;
    Description: string;
    Expleo: string;       // e.g. "FY-2024"
  };
  Columns: string[];
  Total: Record<string, unknown>;
  Projects: ProjectRow[];
  BOLD: string[];
};

// Dynamic keys passed separately so finalData shape stays unchanged
type ExportOptions = {
  dynamicReductionKey: string;  // e.g. "Reductions (35%)"
  dynamicRdCreditKey: string;   // e.g. "Research and Development (R&D) Corporation Tax credit @30%"
  creditRatePct: number;        // e.g. 30
};

type InputFields = {
  country: string;
  credit_type: string;
  currency: string;   // "EUR"
};

// ─── Currency format ──────────────────────────────────────────────────────────

const EUR_FMT = '_-[$€-407]* #,##0.00_-;\\-[$€-407]* #,##0.00_-;_-[$€-407]* "-"??_-;_-@_-';
const GBP_FMT = '_-[$£-809]* #,##0.00_-;\\-[$£-809]* #,##0.00_-;_-[$£-809]* "-"??_-;_-@_-';

// ─── Border presets (verified against template) ───────────────────────────────

const THIN   = { style: "thin"   } as Partial<ExcelJS.Border>;
const MEDIUM = { style: "medium" } as Partial<ExcelJS.Border>;
const DOUBLE = { style: "double" } as Partial<ExcelJS.Border>;

// ─── Fill colors (from template theme colors converted to RGB) ────────────────
// Notes col: theme 6 (Accent6 green) + tint 0.6 = #C5DEB5
const FILL_NOTES = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFC5DEB5" } };
// R&D Credit row: theme 9 (red) + tint 0.8 = #FFCBCB
const FILL_RD    = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFCBCB" } };
// Total header: theme 8 (gold) + tint 0.8 = #FFF2CB
const FILL_HDR   = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFF2CB" } };

// ─── Row layout — matches template exactly (blank rows between data rows) ──────

const ROW = {
  TITLE:          2,
  SUBTITLE:       3,
  HEADER:         5,
  LABOUR_LABEL:   6,
  EMPLOYEES:      8,
  EPW:            10,
  REDUCTIONS:     12,
  NET_EPW:        14,
  UNPAID_ADD:     16,
  UNPAID_LESS:    18,
  TOTAL_LABOUR:   20,
  CLOUD_SOFTWARE: 22,
  SUBCONTRACTS:   24,
  HEAT_LIGHT:     26,
  OTHER:          28,
  TOTAL_QRE:      30,
  RD_CREDIT:      32,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  return 0;
}

function setLabel(
  cell: ExcelJS.Cell,
  value: string,
  bold = false,
  size = 11,
  border?: Partial<ExcelJS.Borders>
): void {
  cell.value = value;
  cell.font  = { name: "Calibri", size, bold };
  if (border) cell.border = border;
}

function setMoney(
  cell: ExcelJS.Cell,
  value: number,
  fmt: string,
  bold = false,
  border?: Partial<ExcelJS.Borders>
): void {
  // Only write value and currency format when non-zero — avoids "€ -" on empty cells
  if (value !== 0 && value !== null && value !== undefined) {
    cell.value  = value;
    cell.numFmt = fmt;
  }
  cell.font = { name: "Calibri", size: 11, bold };
  if (border) cell.border = border;
}

function setNote(cell: ExcelJS.Cell, text: string): void {
  cell.value = text;
  cell.font  = { name: "Calibri", size: 11 };
  cell.fill  = FILL_NOTES;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateIrelandRdExcelBase64(
  finalData: IrelandFinalData,
  inputFields: InputFields,
  options: ExportOptions
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Summary Costing");

  const projects    = finalData.Projects;
  const totals      = finalData.Total;
  const numProjects = projects.length;
  const fmt         = inputFields.currency === "EUR" ? EUR_FMT : GBP_FMT;

  const { dynamicReductionKey: reductionKey, dynamicRdCreditKey: rdCreditKey, creditRatePct } = options;

  // Column layout
  const labelCol    = 1;                               // A
  const firstProjCol = 2;                              // B
  const totalCol    = firstProjCol + numProjects;      // one past last project col
  const notesCol    = totalCol + 1;

  // ── Column widths ─────────────────────────────────────────────────────────────
  ws.getColumn(labelCol).width = 25;
  for (let i = 0; i < numProjects; i++) {
    ws.getColumn(firstProjCol + i).width = 16;
  }
  ws.getColumn(totalCol).width = 18;
  ws.getColumn(notesCol).width = 55;

  // ── Row heights ───────────────────────────────────────────────────────────────
  ws.getRow(ROW.TITLE).height    = 18;
  ws.getRow(ROW.SUBTITLE).height = 18;
  ws.getRow(ROW.TOTAL_QRE).height = 15;
  ws.getRow(ROW.RD_CREDIT).height = 16;

  // ── Row 2: Title ─────────────────────────────────────────────────────────────
  ws.mergeCells(ROW.TITLE, labelCol, ROW.TITLE, totalCol);
  const titleCell = ws.getCell(ROW.TITLE, labelCol);
  titleCell.value = `${finalData.Title["Account Name"]} - ${finalData.Title.Expleo}`;
  titleCell.font  = { name: "Calibri", size: 14, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  // ── Row 3: Subtitle ───────────────────────────────────────────────────────────
  ws.mergeCells(ROW.SUBTITLE, labelCol, ROW.SUBTITLE, totalCol);
  const subtitleCell = ws.getCell(ROW.SUBTITLE, labelCol);
  subtitleCell.value = finalData.Title.Description;
  subtitleCell.font  = { name: "Calibri", size: 14, bold: true };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };

  // ── Row 5: Column headers ─────────────────────────────────────────────────────
  projects.forEach((proj, i) => {
    const cell = ws.getCell(ROW.HEADER, firstProjCol + i);
    cell.value = (proj["Project Name"] as string) ?? `Project ${i + 1}`;
    cell.font  = { name: "Calibri", size: 11, bold: true };
  });
  const totalHdr = ws.getCell(ROW.HEADER, totalCol);
  totalHdr.value = "Total";
  totalHdr.font  = { name: "Calibri", size: 10, bold: true };
  totalHdr.alignment = { horizontal: "center" };
  totalHdr.fill = FILL_HDR;

  // ── Row 6: LABOUR label ───────────────────────────────────────────────────────
  setLabel(ws.getCell(ROW.LABOUR_LABEL, labelCol), "LABOUR", true);

  // ── writeRow helper ───────────────────────────────────────────────────────────
  // projBorder → applied to each project column
  // totalBorder → applied to the Total column (falls back to projBorder if not set)
  // Projects missing a key get 0 (e.g. Cloud Software, Subcontracts are total-only)
  const writeRow = (
    rowNum: number,
    label: string,
    key: string,
    bold = false,
    note = "",
    projBorder?: Partial<ExcelJS.Borders>,
    totalBorder?: Partial<ExcelJS.Borders>
  ) => {
    setLabel(ws.getCell(rowNum, labelCol), label, bold);

    projects.forEach((proj, i) => {
      setMoney(
        ws.getCell(rowNum, firstProjCol + i),
        toNum(proj[key]),
        fmt, bold, projBorder
      );
    });

    setMoney(
      ws.getCell(rowNum, totalCol),
      toNum(totals[key]),
      fmt, bold,
      totalBorder ?? projBorder
    );

    if (note) setNote(ws.getCell(rowNum, notesCol), note);
  };

  // ── Row 8: Employees ─────────────────────────────────────────────────────────
  writeRow(
    ROW.EMPLOYEES, "Employees", "Employees", false,
    "FTE QRE as per calculation",
    undefined,
    { top: THIN }
  );

  // ── Row 10: EPW ──────────────────────────────────────────────────────────────
  writeRow(ROW.EPW, "EPW", "EPW", false, "Subcon QRE - before 35% reduction");

  // ── Row 12: Reductions (dynamic label from extractConfig) ─────────────────────
  writeRow(
    ROW.REDUCTIONS, reductionKey, reductionKey, false,
    "Subcon QRE - 35% reduction"
  );

  // ── Row 14: Net EPW ──────────────────────────────────────────────────────────
  writeRow(ROW.NET_EPW, "Net EPW", "Net EPW", false, "Subcon QRE @ 65% of total");

  // ── Row 16: Unpaid amounts (+) ────────────────────────────────────────────────
  writeRow(
    ROW.UNPAID_ADD, "Unpaid amounts (+)", "Unpaid amounts (+)", false,
    "Unpaid from last year paid this year - wages or contract cost to be included"
  );

  // ── Row 18: Unpaid amounts (-) ────────────────────────────────────────────────
  writeRow(
    ROW.UNPAID_LESS, "Unpaid amounts (-)", "Unpaid amounts (-)", false,
    "Unpaid from this year - wages or contract cost to be reduced"
  );

  // ── Row 20: Total Labour ──────────────────────────────────────────────────────
  // Template: project cols — thin top+bottom+left; total col — thin top+bottom+right
  writeRow(
    ROW.TOTAL_LABOUR, "Total Labour", "Total Labour", true, "Formula",
    { top: THIN, bottom: THIN, left: THIN },
    { top: THIN, bottom: THIN, right: THIN }
  );

  // ── Row 22: Cloud Software (total only — projects get 0) ──────────────────────
  writeRow(
    ROW.CLOUD_SOFTWARE, "Cloud Software", "Cloud Software", false,
    "Software cost directly related to R&D work"
  );

  // ── Row 24: Subcontracts (total only) ─────────────────────────────────────────
  writeRow(
    ROW.SUBCONTRACTS, "Subcontracts", "Subcontracts", false,
    "Outside contractors worked on R&D projects"
  );

  // ── Row 26: Heat Light Power (total only) ─────────────────────────────────────
  writeRow(
    ROW.HEAT_LIGHT, "Heat Light Power", "Heat Light Power", false,
    "Heating & electricity cost related to R&D work"
  );

  // ── Row 28: Other (total only) ────────────────────────────────────────────────
  writeRow(
    ROW.OTHER, "Other", "Other", false,
    "Other cost as materials and consumables, plant & machinery etc. used during R&D"
  );

  // ── Row 30: Total QRE ─────────────────────────────────────────────────────────
  // Template: total col — thin top + double bottom
  writeRow(
    ROW.TOTAL_QRE, "Total QRE", "Total QRE", true, "Formula",
    undefined,
    { top: THIN, bottom: DOUBLE }
  );

  // ── Row 32: R&D Credit ───────────────────────────────────────────────────────
  // Template: A32 — medium top+bottom+left
  //           project cols — medium top+bottom
  //           total col — medium top+bottom+right
  const rdLabelCell = ws.getCell(ROW.RD_CREDIT, labelCol);
  setLabel(
    rdLabelCell,
    `Research and Development (R&D) Corporation Tax credit @${creditRatePct}%`,
    true, 11,
    { top: MEDIUM, bottom: MEDIUM, left: MEDIUM }
  );
  rdLabelCell.fill = FILL_RD;

  projects.forEach((proj, i) => {
    const rdProjCell = ws.getCell(ROW.RD_CREDIT, firstProjCol + i);
    setMoney(rdProjCell, toNum(proj[rdCreditKey]), fmt, true, { top: MEDIUM, bottom: MEDIUM });
    rdProjCell.fill = FILL_RD;
  });

  const rdTotalCell = ws.getCell(ROW.RD_CREDIT, totalCol);
  setMoney(rdTotalCell, toNum(totals[rdCreditKey]), fmt, true, { top: MEDIUM, bottom: MEDIUM, right: MEDIUM });
  rdTotalCell.fill = FILL_RD;

  setNote(ws.getCell(ROW.RD_CREDIT, notesCol), "Formula");

  // ── Generate base64 ───────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}