import ExcelJS from "exceljs";

export type AustraliaTier = {
  name: string;
  "Notional deductions applied": number;
  "offset Amount": number;
};

export type AustraliaFinalData = {
  Title: {
    "Account ID": string;
    "Account Name": string;
    Description: string;
    "Fiscal Year": number | string;
  };
  "Preliminary Calculation": {
    "Add-back of R&D accounting expenditure (Item 7D)": number;
  };
  "R&D Expenditure": {
    "R&D expenditure - Research service provider (RSP)": number;
    "R&D expenditure - Contract expenditure (not RSP)": number;
    "R&D expenditure - Salary expenditure": number;
    "Total of allocated notional deductions": number;
    "Total of notional R&D deductions (X plus Y)": number;
  };
  "Additional Information": {
    "Tax rate": string;
  };
  "Non-refundable tax offset": {
    "R&D entity total expenses": number;
    "Total notional R&D deductions": number;
    "R&D intensity": string;
  };
  "Tier of intensity": AustraliaTier[];
  "Non-refundable R&D tax offset": {
    "Total Offset Amount": number;
  };
};

export async function generateAustraliaRdExcelBase64(data: AustraliaFinalData) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("R&D");

  const money = (v: number) => v ?? 0;

  // ─── Styles ─────────────────────────────
  const border: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  const headerFill = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FFD9D9D9" },
  };

  const bold = { bold: true };

  const addRow = (values: any[], isHeader = false) => {
    const row = ws.addRow(values);

    row.eachCell((cell, colNumber) => {
      cell.font = { name: "Arial", size: 11, ...(isHeader ? bold : {}) };
      cell.border = border;

      if (isHeader) {
        cell.fill = headerFill;
      }

      if (colNumber === 3) {
        cell.alignment = { horizontal: "right" };
      }
    });

    return row;
  };

  // ───────────── TITLE SECTION ─────────────
  const title = data.Title;

  addRow(["Account Name", "", title["Account Name"]], true);
  addRow(["Description", "", title.Description], true);
  addRow(["Fiscal Year", "", title["Fiscal Year"]], true);

  ws.addRow([]);

  // ───────────── PRELIMINARY ─────────────
  addRow(["Preliminary Calculation"], true);
  addRow([
    "Add-Back Of R&D Accounting Expenditure (Item 7D)",
    "",
    money(data["Preliminary Calculation"]["Add-back of R&D accounting expenditure (Item 7D)"]),
  ]);

  ws.addRow([]);

  // ───────────── PART A ─────────────
  addRow(["PART A", "Calculation Of Notional R&D Deductions"], true);

  const rd = data["R&D Expenditure"];

  addRow(["1", "R&D Expenditure - Research Service Provider (RSP)", money(rd["R&D expenditure - Research service provider (RSP)"])]);
  addRow(["2", "R&D Expenditure - Contract Expenditure (Not RSP)", money(rd["R&D expenditure - Contract expenditure (not RSP)"])]);
  addRow(["3", "R&D Expenditure - Salary Expenditure", money(rd["R&D expenditure - Salary expenditure"])]);
  addRow(["10", "Total Of Allocated Notional Deductions", money(rd["Total of allocated notional deductions"])]);
  addRow(["11", "Total Of Notional R&D Deductions (X Plus Y)", money(rd["Total of notional R&D deductions (X plus Y)"])]);

  ws.addRow([]);

  // ───────────── PART E ─────────────
  addRow(["PART E", "R&D Tax Offset Calculation"], true);
  addRow(["1", "Additional Information"], true);

  addRow(["Tax Rate", "", data["Additional Information"]["Tax rate"]]);

  ws.addRow([]);

  // ───────────── NON-REFUNDABLE ─────────────
  const nr = data["Non-refundable tax offset"];

  addRow(["3", "Non-Refundable Tax Offset"], true);
  addRow(["R&D Entity Total Expenses", "", money(nr["R&D entity total expenses"])]);
  addRow(["Total Notional R&D Deductions", "", money(nr["Total notional R&D deductions"])]);
  addRow(["R&D Intensity", "", nr["R&D intensity"]]);

  ws.addRow([]);

  // ───────────── TIER TABLE ─────────────
  addRow(["Tier Of Intensity", "Notional Deductions Applied", "Offset Amount"], true);

  data["Tier of intensity"].forEach((tier) => {
    addRow([
      tier.name,
      money(tier["Notional deductions applied"]),
      money(tier["offset Amount"]),
    ]);
  });

  ws.addRow([]);

  // ───────────── FINAL ─────────────
  addRow(
    ["Non-Refundable R&D Tax Offset", "", money(data["Non-refundable R&D tax offset"]["Total Offset Amount"])],
    true
  );

  // ───────────── COLUMN WIDTHS ─────────────
  ws.columns = [
    { width: 18 },
    { width: 50 },
    { width: 22 },
  ];

  // ───────────── FORMAT NUMBERS ($) ─────────────
  ws.eachRow((row) => {
    row.eachCell((cell, col) => {
      const label = row.getCell(1).value?.toString();

      if (col === 3 && typeof cell.value === "number") {
        // Skip currency for Fiscal Year
        if (label === "Fiscal Year") {
          cell.numFmt = "0"; // plain number
        } else {
          cell.numFmt = '"$"#,##0.00';
        }
      }
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}