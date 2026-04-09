import ExcelJS from "exceljs";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectRow = Record<string, unknown>;

export type UKFinalData = {
  Title: {
    "Account ID": string;
    "Account Name": string;
    Description: string;
    "Fiscal Year": string;  // e.g. "04/01/2023 - 03/31/2024"
  };
  Columns: string[];
  Total: Record<string, unknown>;
  Projects: ProjectRow[];   // per customer group / project
  BOLD: string[];
  "Percentage Calculation": Record<string, string | number>;
  "Technical Submissions by Cost that are 50% or more of Total QRE": Array<{
    "Project Name": string;
    "Total Project Value/Labor": number;
  }>;
  "Total Project to be shared with HMRC": { Total: number };
  // Dynamic keys from extractConfig:
  reductionKey: string;       // e.g. "Reductions (35%)"
  grossRdecKey: string;       // e.g. "GROSS RDEC @ 20%"
  grossRdecPct: number;       // e.g. 20
};

type InputFields = {
  country: string;
  credit_type: string;
  currency: string;   // "GBP"
};

// ─── Currency / fills / borders ───────────────────────────────────────────────

const GBP_FMT = '_-[$£-809]* #,##0.00_-;\\-[$£-809]* #,##0.00_-;_-[$£-809]* "-"??_-;_-@_-';

// Fills verified from template (theme colors converted to RGB)
const FILL_YELLOW   = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFFF00" } };   // project name headers
const FILL_GREEN_LT = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFC5DEB5" } };   // notes col (theme6 tint0.6)
const FILL_GREEN_MD = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFE2EEDA" } };   // Total Proj Value / Pension label (theme6 tint0.8)
const FILL_GREEN_VL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFEBF1DE" } };   // Pension value cell
const FILL_ORANGE   = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFCC99" } };   // Total Qualifying RDEC + Final Credit

const THIN   = { style: "thin"   } as Partial<ExcelJS.Border>;
const MEDIUM = { style: "medium" } as Partial<ExcelJS.Border>;
const DOUBLE = { style: "double" } as Partial<ExcelJS.Border>;

// ─── Row layout (matches Summary sheet exactly) ────────────────────────────────

const ROW = {
  COMPANY:          2,
  DESCRIPTION:      3,
  FISCAL_YEAR:      4,
  PROJ_NAMES:       5,   // customer group / project names
  PROJ_COUNT:       6,   // total project count per group
  // row 7-8 blank / section
  LABOUR_LABEL:     9,
  // row 10 blank
  EMPLOYEES:        11,
  // row 12 blank
  EPW:              13,
  // row 14 blank
  REDUCTIONS:       15,
  // row 16 blank
  NET_EPW:          17,
  // row 18 blank
  TOTAL_PROJ_VALUE: 19,
  // rows 20-21 blank
  MATERIALS:        22,
  // row 23 blank
  SUBCONTRACTS:     24,
  // row 25 blank
  HEAT_LIGHT:       26,
  // row 27 blank
  OTHER:            28,
  // row 29 blank
  TOTAL_SALARY:     30,
  PENSION:          31,
  // row 32 blank
  TOTAL_RDEC:       33,
  GROSS_RDEC_PCT:   34,
  // row 35 blank
  FINAL_CREDIT:     36,
  // row 37 blank
  TECH_HEADER:      38,
  TECH_SUBHEADER:   39,
  TECH_DATA_START:  40,
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
  size = 9,
  fill?: ExcelJS.Fill,
  border?: Partial<ExcelJS.Borders>
): void {
  cell.value = value;
  cell.font = { name: "Calibri", size, bold };
  if (fill) cell.fill = fill;
  if (border) cell.border = border;
}

function setMoney(
  cell: ExcelJS.Cell,
  value: number,
  bold = false,
  fill?: ExcelJS.Fill,
  border?: Partial<ExcelJS.Borders>
): void {
  if (value !== 0) {
    cell.value = value;
    cell.numFmt = GBP_FMT;
  }
  cell.font = { name: "Calibri", size: 9, bold };
  if (fill) cell.fill = fill;
  if (border) cell.border = border;
}

function setNote(cell: ExcelJS.Cell, text: string): void {
  cell.value = text;
  cell.font = { name: "Calibri", size: 11 };
  cell.fill = FILL_GREEN_LT;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateUKRdExcelBase64(
  finalData: UKFinalData,
  inputFields: InputFields
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Summary");

  const projects    = finalData.Projects;
  const totals      = finalData.Total;
  const numProjects = Math.min(projects.length, 12); // template supports up to 12 project cols (C-N)

  const reductionKey = finalData.reductionKey;   // e.g. "Reductions (35%)"
  const grossRdecKey = finalData.grossRdecKey;   // e.g. "GROSS RDEC @ 20%"
  const grossRdecPct = finalData.grossRdecPct;

  // Column layout: A=labels, B=spare, C...(C+n-1)=projects, O=total, P=spare, Q=notes
  const labelCol     = 1;   // A
  const firstProjCol = 3;   // C
  const totalCol     = 15;  // O — always fixed per template
  const notesCol     = 17;  // Q — always fixed per template

  // ── Column widths (match template) ────────────────────────────────────────────
  ws.getColumn(1).width  = 38;   // A — labels
  ws.getColumn(2).width  = 14;   // B — spare / submission project names
  for (let i = 0; i < numProjects; i++) {
    ws.getColumn(firstProjCol + i).width = 20;  // C-N project cols
  }
  ws.getColumn(15).width = 18;   // O — total
  ws.getColumn(16).width = 9;    // P — spare
  ws.getColumn(17).width = 81;   // Q — notes

  // ── Row heights ───────────────────────────────────────────────────────────────
  ws.getRow(ROW.PROJ_NAMES).height  = 43;
  ws.getRow(ROW.TOTAL_SALARY).height = 15;
  ws.getRow(ROW.PENSION).height     = 15;
  ws.getRow(ROW.TOTAL_RDEC).height  = 15;
  ws.getRow(ROW.FINAL_CREDIT).height = 15;

  // ── Rows 2-4: Title block ─────────────────────────────────────────────────────
  setLabel(ws.getCell(ROW.COMPANY, labelCol),     finalData.Title["Account Name"], true, 9);
  setLabel(ws.getCell(ROW.DESCRIPTION, labelCol), finalData.Title.Description,    true, 9);
  setLabel(ws.getCell(ROW.FISCAL_YEAR, labelCol),
    `Fiscal Year ${finalData.Title["Fiscal Year"]}`, true, 9);

  // ── Row 5: Project name headers (yellow for main groups, plain for others) ────
  projects.forEach((proj, i) => {
    const cell = ws.getCell(ROW.PROJ_NAMES, firstProjCol + i);
    cell.value = (proj["Project Name"] as string) ?? `Project ${i + 1}`;
    cell.font  = { name: "Calibri", size: 11 };
    cell.alignment = { horizontal: "center", wrapText: true };
    // Yellow fill for highlighted projects (matching template's first few cols)
    cell.fill = FILL_YELLOW;
  });
  // Total header
  const totalHdr = ws.getCell(ROW.PROJ_NAMES, totalCol);
  totalHdr.value = "Total";
  totalHdr.font  = { name: "Calibri", size: 9, bold: true };
  totalHdr.alignment = { horizontal: "center" };

  // ── Row 6: Total projects count per group ─────────────────────────────────────
  projects.forEach((proj, i) => {
    const cell = ws.getCell(ROW.PROJ_COUNT, firstProjCol + i);
    const count = (proj["Total Projects"] ?? proj["total_projects_count"] ?? "") as string | number;
    cell.value = count;
    cell.font  = { name: "Calibri", size: 11 };
    cell.alignment = { horizontal: "center" };
  });

  // ── Row 9: LABOUR label ───────────────────────────────────────────────────────
  setLabel(ws.getCell(ROW.LABOUR_LABEL, labelCol), "LABOUR", true, 9);

  // ── writeRow: standard data row across all project cols + total + note ─────────
  const writeRow = (
    rowNum: number,
    label: string,
    key: string,
    bold = false,
    note = "",
    labelFill?: ExcelJS.Fill,
    valueFill?: ExcelJS.Fill,
    totalBorder?: Partial<ExcelJS.Borders>
  ) => {
    setLabel(ws.getCell(rowNum, labelCol), label, bold, 9, labelFill);

    projects.forEach((proj, i) => {
      setMoney(ws.getCell(rowNum, firstProjCol + i), toNum(proj[key]), bold, valueFill);
    });

    setMoney(ws.getCell(rowNum, totalCol), toNum(totals[key]), bold, valueFill, totalBorder);

    if (note) setNote(ws.getCell(rowNum, notesCol), note);
  };

  // ── Row 11: Employees ─────────────────────────────────────────────────────────
  writeRow(ROW.EMPLOYEES, "Employees", "Employees", false, "FTE QRE as per calculation");

  // ── Row 13: EPW ──────────────────────────────────────────────────────────────
  writeRow(ROW.EPW, "EPW", "EPW", false, "Subcon QRE - before 35% reduction");

  // ── Row 15: Reductions (dynamic) ─────────────────────────────────────────────
  writeRow(ROW.REDUCTIONS, reductionKey, reductionKey, false, "Subcon QRE - 35% reduction");

  // ── Row 17: Net EPW ──────────────────────────────────────────────────────────
  writeRow(ROW.NET_EPW, "Net EPW", "Net EPW", false, "Subcon QRE @ 65% of total");

  // ── Row 19: Total Project Value/Labor — green medium fill ─────────────────────
  writeRow(
    ROW.TOTAL_PROJ_VALUE, "Total Project Value/Labor", "Total Project Value/Labor",
    true, "Formula",
    undefined, FILL_GREEN_MD
  );

  // ── Row 22: Materials/Software — total col only ───────────────────────────────
  writeRow(
    ROW.MATERIALS, "Materials/Software", "Materials/Software",
    false, "Direct material & Software cost directly related to R&D work"
  );

  // ── Row 24: Subcontracts ──────────────────────────────────────────────────────
  writeRow(ROW.SUBCONTRACTS, "Subcontracts", "Subcontracts", false,
    "Outside contractors worked on R&D projects");

  // ── Row 26: Heat Light Power ──────────────────────────────────────────────────
  writeRow(ROW.HEAT_LIGHT, "Heat Light Power", "Heat Light Power", false,
    "Heating & electricity cost related to R&D work");

  // ── Row 28: Other ─────────────────────────────────────────────────────────────
  writeRow(ROW.OTHER, "Other", "Other", false,
    "Other cost as consumables, plant & machinery etc. used directly for R&D work");

  // ── Row 30: Total Salary + EPW Expenses ──────────────────────────────────────
  writeRow(ROW.TOTAL_SALARY, "Total Salary + EPW Expenses", "Total Salary + EPW Expenses",
    true, "Formula");

  // ── Row 31: Total Employers Pension Contribution NIC ──────────────────────────
  // Label: green medium fill; value cell: lighter green fill (FFEBF1DE)
  setLabel(ws.getCell(ROW.PENSION, labelCol),
    "Total Employers Pension Contribution NIC", false, 9, FILL_GREEN_MD);
  const pensionVal = ws.getCell(ROW.PENSION, totalCol);
  setMoney(pensionVal, toNum(totals["Total Employers Pension Contribution NIC"]), true,
    FILL_GREEN_VL);
  setNote(ws.getCell(ROW.PENSION, notesCol),
    "Employer's Pension & National Insurance contribution (NIC) for R&D staff");

  // ── Row 33: Total Qualifying RDEC — orange fill, thin top + medium bottom ─────
  setLabel(ws.getCell(ROW.TOTAL_RDEC, labelCol),
    "Total Qualifying RDEC", false, 9, FILL_ORANGE,
    { top: THIN, bottom: THIN, left: THIN });
  const rdecTotal = ws.getCell(ROW.TOTAL_RDEC, totalCol);
  setMoney(rdecTotal, toNum(totals["Total Qualifying RDEC"]), true, FILL_ORANGE,
    { top: THIN, bottom: MEDIUM });
  setNote(ws.getCell(ROW.TOTAL_RDEC, notesCol), "Formula");

  // ── Row 34: GROSS RDEC % ──────────────────────────────────────────────────────
  setLabel(ws.getCell(ROW.GROSS_RDEC_PCT, labelCol), grossRdecKey, false, 9);
  const grossPctCell = ws.getCell(ROW.GROSS_RDEC_PCT, totalCol);
  grossPctCell.value = grossRdecPct / 100;
  grossPctCell.font  = { name: "Calibri", size: 9 };
  grossPctCell.numFmt = "0%";

  // ── Row 36: Total Final R&D Claim Credit — orange fill, double bottom ─────────
  setLabel(ws.getCell(ROW.FINAL_CREDIT, labelCol),
    "Total Final R&D Claim Credit", false, 9, FILL_ORANGE,
    { top: THIN, bottom: THIN, left: THIN });
  const finalCreditCell = ws.getCell(ROW.FINAL_CREDIT, totalCol);
  setMoney(finalCreditCell, toNum(totals["Total Final R&D Claim Credit"]), true, FILL_ORANGE,
    { bottom: DOUBLE });
  setNote(ws.getCell(ROW.FINAL_CREDIT, notesCol), "Formula");

  // ── Rows 38-onwards: Technical Submissions section ────────────────────────────
  const pctCalc   = finalData["Percentage Calculation"];
  const techProjs = finalData["Technical Submissions by Cost that are 50% or more of Total QRE"];
  const totalShared = finalData["Total Project to be shared with HMRC"].Total;

  // Dynamic key (Total Projects or Total Customer Groups)
  const dynKey = Object.keys(pctCalc).find(k =>
    k.startsWith("Total Projects") || k.startsWith("Total Customer Groups")
  ) ?? "Total Projects";

  // Row 38: section header + count
  setLabel(ws.getCell(ROW.TECH_HEADER, labelCol),
    "Technical Submissions by Cost that are 50% or more of Total QRE", true, 9);
  ws.getCell(ROW.TECH_HEADER, 4).value = dynKey;
  ws.getCell(ROW.TECH_HEADER, 5).value = toNum(pctCalc[dynKey] as string | number);

  // Row 39: sub-header labels
  setLabel(ws.getCell(ROW.TECH_SUBHEADER, labelCol), "Customer Groups For Submission", true, 9);
  ws.getCell(ROW.TECH_SUBHEADER, 4).value = "Total QRE";
  ws.getCell(ROW.TECH_SUBHEADER, 5).value = toNum(pctCalc["Total QRE"]);
  ws.getCell(ROW.TECH_SUBHEADER, 5).numFmt = GBP_FMT;

  // Rows 40+: tech project list
  techProjs.forEach((proj, i) => {
    const rowNum = ROW.TECH_DATA_START + i;
    ws.getCell(rowNum, labelCol).value = proj["Project Name"] as string;
    ws.getCell(rowNum, labelCol).font  = { name: "Calibri", size: 11 };
    const valCell = ws.getCell(rowNum, 2);
    valCell.value  = proj["Total Project Value/Labor"] as number;
    valCell.font   = { name: "Calibri", size: 9 };
    valCell.numFmt = GBP_FMT;
  });

  // Percentage calculation block (cols D-E, beside tech list)
  const pctRow = ROW.TECH_DATA_START + Math.max(techProjs.length - 1, 1);
  ws.getCell(pctRow, 4).value = "Total value of customer groups Greater than 50%";
  ws.getCell(pctRow, 5).value = toNum(pctCalc["Total value of customer groups Greater than 50%"]);
  ws.getCell(pctRow, 5).numFmt = GBP_FMT;

  const pctRow2 = pctRow + 1;
  ws.getCell(pctRow2, 4).value = "%";
  ws.getCell(pctRow2, 5).value = String(pctCalc["%"] ?? "");

  // Total Project to be shared with HMRC
  const hmrcRow = ROW.TECH_DATA_START + techProjs.length + 2;
  ws.getCell(hmrcRow, labelCol).value = "Total Project to be shared with HMRC";
  ws.getCell(hmrcRow, labelCol).font  = { name: "Calibri", size: 9 };
  const hmrcValCell = ws.getCell(hmrcRow, 2);
  hmrcValCell.value  = totalShared;
  hmrcValCell.font   = { name: "Calibri", size: 9 };
  hmrcValCell.numFmt = GBP_FMT;

  // ── Generate base64 ───────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}