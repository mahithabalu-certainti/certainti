import ExcelJS from "exceljs";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectRow = Record<string, unknown>;

type FinalData = {
  Title: {
    "Fiscal Year": string;
    Descriptions: string;
  };
  Columns: string[];
  Projects: ProjectRow[];
  Total: Record<string, unknown>;
  BOLD: string[];
};

type InputFields = {
  country: string;
  credit_type: string;
  currency: string;
};

// ─── Colour constants (match template exactly) ────────────────────────────────

const COLOR = {
  RED_TITLE: "FFFF0000",       // Row 1 title text — red
  LABEL_BG: "FFD8E8DA",        // Green-tinted label column  (Project Code, Project Name, Provincial rows)
  YELLOW_BG: "FFFFFF00",       // Yellow — project code data cells
  COST_BG: "FFD4D47F",         // Olive-yellow — cost metric labels (rows 5-10)
  TOTAL_LABEL_BG: "FFFFD8E8",  // Pink — TOTAL Credit label rows
  HEADER_BG: "FFB8CCB9",       // Header row background for project columns
  WHITE: "FFFFFFFF",
} as const;

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top:    { style: "thin" },
  bottom: { style: "thin" },
  left:   { style: "thin" },
  right:  { style: "thin" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyLabelCell(
  cell: ExcelJS.Cell,
  value: string,
  bgColor: string,
  bold = false
): void {
  cell.value = value;
  cell.font = { name: "Calibri", size: 9, bold };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
  cell.alignment = { horizontal: "right", vertical: "middle" };
  cell.border = THIN_BORDER;
}

function applyDataCell(
  cell: ExcelJS.Cell,
  value: string | number,
  bold = false,
  numFmt?: string
): void {
  cell.value = value;
  cell.font = { name: "Calibri", size: 11, bold };
  cell.alignment = { horizontal: "left", vertical: "middle" };
  cell.border = THIN_BORDER;
  if (numFmt) cell.numFmt = numFmt;
}

function applyTotalCell(
  cell: ExcelJS.Cell,
  value: string | number,
  bold = true,
  numFmt?: string
): void {
  cell.value = value;
  cell.font = { name: "Calibri", size: 11, bold, color: { argb: "FF000000" } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD8E8DA" } };
  cell.alignment = { horizontal: "right", vertical: "middle" };
  cell.border = THIN_BORDER;
  if (numFmt) cell.numFmt = numFmt;
}


// ─── Row layout constants ─────────────────────────────────────────────────────

const ROW = {
  TITLE:            1,
  PROJECT_CODE:     3,
  PROJECT_NAME:     4,
  TOTAL_HOURS:      5,
  PROJECT_TOTAL:    6,
  FTE_COST:         7,
  SUBCON_COST:      8,
  OTHER_COST:       9,
  TOTAL_COST:       10,
  NET_QRE_PCT:      11,
  FTE_QRE_ADJ:      12,
  SUBCON_QRE_ADJ:   13,
  FTE_QRE:          14,
  FTE_PROXY:        15,
  SUBCON_QRE:       16,
  CONTRACTORS_AMT:  17,
  QRE:              18,
  PROV_OITC_PCT:    19,
  PROV_OITC_AMT:    20,
  PROV_ORDTC_AMT:   21,
  PROV_ORDTC_PCT:   22,
  ORDTC_CLAIMED:    23,
  FED_ITC_AMT_ORDTC:  24,
  FED_ITC_PCT_ORDTC:  25,
  FED_ITC_CRD_ORDTC:  26,
  // row 27 is blank (matches template)
  FED_ITC_AMT_NO:   28,
  FED_ITC_PCT_NO:   29,
  FED_ITC_CRD_NO:   30,
  // row 31 is blank
  TOTAL_WITH_ORDTC: 32,
  // row 33 is blank
  TOTAL_NO_ORDTC:   34,
};

// ─── Main export function ─────────────────────────────────────────────────────

export async function generateCanadaRdExcelBase64(
  finalData: FinalData,
  inputFields: InputFields
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Project Summary");

  const projects = finalData.Projects;
  const totals = finalData.Total;
  const boldCols = new Set(finalData.BOLD);

  // Number of project columns (B, C, D … up to H max = 7 projects)
  const numProjects = Math.min(projects.length, 7);
  // TOTAL column sits immediately after the last project — 4 projects → totalCol = 6 (col F)
  const totalCol = numProjects + 2;

  // ── Column widths ────────────────────────────────────────────────────────────
  ws.getColumn(1).width = 34;
  for (let i = 0; i < numProjects; i++) {
    ws.getColumn(i + 2).width = 18;
  }
  ws.getColumn(totalCol).width = 14;

  // ── Row 1: Title — merge across all columns so it never clips ───────────────
  ws.mergeCells(ROW.TITLE, 1, ROW.TITLE, totalCol);
  const titleCell = ws.getCell(ROW.TITLE, 1);
  titleCell.value = `${finalData.Title["Fiscal Year"]} - ${finalData.Title.Descriptions}`;
  titleCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: COLOR.RED_TITLE } };
  titleCell.alignment = { horizontal: "left", vertical: "middle" };

  // ── Row 2: sub-header — merge across all columns ─────────────────────────────
  ws.mergeCells(2, 1, 2, totalCol);
  const subCell = ws.getCell(2, 1);
  subCell.value = `${inputFields.credit_type} | ${inputFields.currency}`;
  subCell.font = { name: "Calibri", size: 9, color: { argb: "FF666666" } };

  // ── Helper: get column letter for project index (0-based) ───────────────────
  const projCol = (i: number) => i + 2; // project 0 → col B (2)

  // ── Row 3: Project Code ──────────────────────────────────────────────────────
  applyLabelCell(ws.getCell(ROW.PROJECT_CODE, 1), "Project Code", COLOR.LABEL_BG);
  projects.forEach((proj, i) => {
    const cell = ws.getCell(ROW.PROJECT_CODE, projCol(i));
    cell.value = proj["Project Code"] as string;
    cell.font = { name: "Calibri", size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.YELLOW_BG } };
    cell.border = THIN_BORDER;
  });
  // TOTAL header
  const totalHeaderCell = ws.getCell(ROW.PROJECT_CODE, totalCol);
  totalHeaderCell.value = `TOTAL ${finalData.Title["Fiscal Year"].slice(-4)}`;
  totalHeaderCell.font = { name: "Calibri", size: 11, bold: true };
  totalHeaderCell.alignment = { horizontal: "center" };
  totalHeaderCell.border = THIN_BORDER;

  // ── Row 4: Project Name ───────────────────────────────────────────────────────
  applyLabelCell(ws.getCell(ROW.PROJECT_NAME, 1), "Project Name", COLOR.LABEL_BG);
  projects.forEach((proj, i) => {
    const cell = ws.getCell(ROW.PROJECT_NAME, projCol(i));
    cell.value = proj["Project Name"] as string;
    cell.font = { name: "Calibri", size: 11 };
    cell.alignment = { wrapText: true };
    cell.border = THIN_BORDER;
  });
  // TOTAL column for project name row — empty but bordered
  const projNameTotalCell = ws.getCell(ROW.PROJECT_NAME, totalCol);
  projNameTotalCell.border = THIN_BORDER;

  // ── Rows 5-18: Metric rows ────────────────────────────────────────────────────

  type MetricRowDef = {
    row: number;
    label: string;
    key: string;
    labelBg: string;
    numFmt?: string;
    pctRow?: boolean;   // true → value is already a "xx%" string, write as-is
    adjRow?: boolean;   // true → write raw value (e.g. "100%" string from TS)
  };

  const metricRows: MetricRowDef[] = [
    { row: ROW.TOTAL_HOURS,     label: "Total Hours",            key: "Total Hours",           labelBg: COLOR.COST_BG },
    { row: ROW.PROJECT_TOTAL,   label: "Project Total Cost",     key: "Project Total Cost",    labelBg: COLOR.COST_BG, numFmt: "#,##0" },
    { row: ROW.FTE_COST,        label: "FTE Cost",               key: "FTE Cost",              labelBg: COLOR.COST_BG, numFmt: "#,##0" },
    { row: ROW.SUBCON_COST,     label: "SubCon Cost",            key: "SubCon Cost",           labelBg: COLOR.COST_BG, numFmt: "#,##0" },
    { row: ROW.OTHER_COST,      label: "Other Cost",             key: "Other Cost",            labelBg: COLOR.COST_BG, numFmt: "#,##0" },
    { row: ROW.TOTAL_COST,      label: "Total Cost",             key: "Total Cost",            labelBg: COLOR.COST_BG, numFmt: "#,##0" },
    { row: ROW.NET_QRE_PCT,     label: "Net QRE %",              key: "Net QRE %",             labelBg: COLOR.WHITE,   pctRow: true },
    { row: ROW.FTE_QRE_ADJ,     label: "FTE QRE Adjustment",     key: "FTE QRE Adjustment",    labelBg: COLOR.WHITE,   pctRow: true },
    { row: ROW.SUBCON_QRE_ADJ,  label: "Subcon QRE Adjustment",  key: "Subcon QRE Adjustment", labelBg: COLOR.WHITE,   pctRow: true },
    { row: ROW.FTE_QRE,         label: "FTE QRE",                key: "FTE QRE",               labelBg: COLOR.WHITE,   numFmt: "#,##0" },
    { row: ROW.FTE_PROXY,       label: finalData.Columns.find(c => c.startsWith("FTE Proxy")) ?? "FTE Proxy",
                                                                   key: finalData.Columns.find(c => c.startsWith("FTE Proxy")) ?? "FTE Proxy",
                                                                                                 labelBg: COLOR.WHITE,   numFmt: "#,##0" },
    { row: ROW.SUBCON_QRE,      label: "Subcon QRE",             key: "Subcon QRE",            labelBg: COLOR.WHITE,   numFmt: "#,##0" },
    { row: ROW.CONTRACTORS_AMT, label: finalData.Columns.find(c => c.startsWith("Contractors")) ?? "Contractors Amt",
                                                                   key: finalData.Columns.find(c => c.startsWith("Contractors")) ?? "Contractors Amt",
                                                                                                 labelBg: COLOR.WHITE,   numFmt: "#,##0" },
    { row: ROW.QRE,             label: "QRE",                    key: "QRE",                   labelBg: COLOR.WHITE,   numFmt: "#,##0" },
  ];

  for (const def of metricRows) {
    const isBoldRow = boldCols.has(def.key);
    applyLabelCell(ws.getCell(def.row, 1), def.label, def.labelBg, isBoldRow);

    projects.forEach((proj, i) => {
      const rawVal = (proj[def.key] as string | number) ?? 0;
      const cell = ws.getCell(def.row, projCol(i));
      applyDataCell(cell, rawVal, isBoldRow, def.pctRow ? undefined : def.numFmt);
    });

    // TOTAL column value
    const totalVal = totals[def.key];
    const totalCell = ws.getCell(def.row, totalCol);
    applyTotalCell(totalCell, (totalVal as string | number) ?? 0, true, def.pctRow ? undefined : def.numFmt);
  }

  // ── Rows 19-34: Provincial & Federal credit rows (TOTAL col only) ────────────

  type SummaryRowDef = {
    row: number;
    label: string;
    key: string;
    labelBold?: boolean;
    numFmt?: string;
    isTotal?: boolean;
  };

  const summaryRows: SummaryRowDef[] = [
    { row: ROW.PROV_OITC_PCT,     label: "Provincial OITC %",              key: "Provincial OITC %",              numFmt: "0.0%" },
    { row: ROW.PROV_OITC_AMT,     label: "Provincial OITC Amount",         key: "Provincial OITC Amount",         numFmt: "#,##0" },
    { row: ROW.PROV_ORDTC_AMT,    label: "Provincial ORDTC Amount",        key: "Provincial ORDTC Amount",        numFmt: "#,##0" },
    { row: ROW.PROV_ORDTC_PCT,    label: "Provincial ORDTC %",             key: "Provincial ORDTC %",             numFmt: "0.0%" },
    { row: ROW.ORDTC_CLAIMED,     label: "ORDTC Claimed",                  key: "ORDTC Claimed",                  numFmt: "#,##0" },
    { row: ROW.FED_ITC_AMT_ORDTC, label: "Federal ITC Amount after ORDTC", key: "Federal ITC Amount after ORDTC", numFmt: "#,##0" },
    { row: ROW.FED_ITC_PCT_ORDTC, label: "Federal ITC % (ORDTC)",          key: "Federal ITC % (ORDTC)",          numFmt: "0.0%" },
    { row: ROW.FED_ITC_CRD_ORDTC, label: "Federal ITC Credits after ORDTC",key: "Federal ITC Credits after ORDTC",numFmt: "#,##0" },
    { row: ROW.FED_ITC_AMT_NO,    label: "Federal ITC Amount (No ORDTC)",  key: "Federal ITC Amount (No ORDTC)",  numFmt: "#,##0" },
    { row: ROW.FED_ITC_PCT_NO,    label: "Federal ITC % (No ORDTC)",       key: "Federal ITC % (No ORDTC)",       numFmt: "0.0%" },
    { row: ROW.FED_ITC_CRD_NO,    label: "Federal ITC Credits (No ORDTC)", key: "Federal ITC Credits (No ORDTC)", numFmt: "#,##0" },
    { row: ROW.TOTAL_WITH_ORDTC,  label: "TOTAL Credit with ORDTC",        key: "TOTAL Credit with ORDTC",        numFmt: "#,##0", labelBold: true, isTotal: true },
    { row: ROW.TOTAL_NO_ORDTC,    label: "TOTAL Credit with No ORDTC",     key: "TOTAL Credit with No ORDTC",     numFmt: "#,##0", labelBold: true, isTotal: true },
  ];

  for (const def of summaryRows) {
    const bgColor = def.isTotal ? COLOR.TOTAL_LABEL_BG : COLOR.LABEL_BG;
    applyLabelCell(ws.getCell(def.row, 1), def.label, bgColor, def.labelBold ?? false);

    // Apply empty bordered cells across all project columns (B to last project col)
    for (let i = 0; i < numProjects; i++) {
      const emptyCell = ws.getCell(def.row, projCol(i));
      emptyCell.border = THIN_BORDER;
      if (def.isTotal) {
        emptyCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFD8E8" } };
      } else {
        emptyCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
      }
    }

    // Raw value from totals — strip "%" suffix if present, convert to number for % rows
    let rawVal = totals[def.key];
    if (typeof rawVal === "string" && (rawVal as string).endsWith("%")) {
      rawVal = parseFloat(rawVal as string) / 100;
    }

    const valueCell = ws.getCell(def.row, totalCol);
    valueCell.value = (rawVal as string | number) ?? 0;
    valueCell.font = { name: "Calibri", size: 11, bold: def.isTotal };
    valueCell.border = THIN_BORDER;
    valueCell.alignment = { horizontal: "right" };
    if (def.numFmt) valueCell.numFmt = def.numFmt;

    if (def.isTotal) {
      valueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD8E8DA" } };
      valueCell.font = { name: "Calibri", size: 11, bold: true };
    }
  }

  // ── Freeze top 3 rows + label column ─────────────────────────────────────────
  ws.views = [{ state: "frozen", xSplit: 1, ySplit: 3 }];

  // ── Generate base64 ───────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}