import { QueryTypes, Sequelize } from "sequelize";
import {
  logMessage,
  uploadBufferToAzureBlob,
  downloadBufferFromAzureBlob,
} from "../../utils/helpers";
import { rawQueries } from "../../utils/constants";

// Australia R&D Tax Incentive Schedule – NAT 73794-06.2024
// Four-page form (612 x 792 pts).
//
// Page 1 – Preliminary Calculation + Part A (Notional R&D Deductions)
// Page 2 – Part B (Clawback) + Part C (Expenditure to Associates)
// Page 3 – Part D (Aggregated Turnover) + Part E (R&D Tax Offset Calculation)
// Page 4 – Tier of Intensity table + Non-refundable R&D tax offset + Declaration
//
// computed_fields structure (from RdCreditCalculatorForAus.computeForAus):
//   finalData: {
//     Title: { "Account ID", "Account Name", "Description", "Fiscal Year" }
//     "Preliminary Calculation": { "Add-back of R&D accounting expenditure (Item 7D)": number }
//     "R&D Expenditure": {
//       "R&D expenditure - Research service provider (RSP)": number,
//       "R&D expenditure - Contract expenditure (not RSP)": number,
//       "R&D expenditure - Salary expenditure": number,
//       "Total of allocated notional deductions": number,
//       "Total of notional R&D deductions (X plus Y)": number
//     }
//     "Additional Information": { "Tax rate": string }          // e.g. "30%"
//     "Non-refundable tax offset": {
//       "R&D entity total expenses": number,
//       "Total notional R&D deductions": number,
//       "R&D intensity": string                                 // e.g. "2.5%"
//     }
//     "Tier of intensity": [
//       { name, "offset Amount": number, "Notional deductions applied": number },
//       { name, "offset Amount": number, "Notional deductions applied": number }
//     ]
//     "Non-refundable R&D tax offset": { "Total Offset Amount": number }
//   }
//
// Usage from processStateForms / processCountryForms in rdFormMapperService.ts:
//
//   import { processAustraliaForm } from "./countryForms/ausFormGenerator";
//
//   if (resolvedCountryCode === "AUS") {
//     const url = await processAustraliaForm(
//       caseRid, schemaName, accountNumber, formInfo.browse_file, orgDb,
//       stateCode, countryCode
//     );
//     await this.rdFormMapperSchemaService.saveStateFilledFormUrl(
//       caseRid, "AUS", url, orgDb, accountNumber,
//     );
//     continue;
//   }

// --- Types -------------------------------------------------------------------

interface AusRdScheduleData {
  // Header (Page 1)
  companyName: string;
  tfn: string;
  abn: string;
  iisaNumber: string;
  fiscalYear: string;

  // Preliminary Calculation – label D (Page 1)
  preliminaryCalcD: number;

  // Part A – Australian owned R&D (labels A/C/E/G/I/K/M/Q/X and total Z)
  // Items correspond to lines 1-11 of the schedule.
  partA_rsp_australian: number;           // item 1 label A (Australian owned RSP)
  partA_contract_australian: number;      // item 2 label C (Contract not RSP)
  partA_salary_australian: number;        // item 3 label E (Salary)
  partA_other_australian: number;         // item 4 label G (Other)
  partA_feedstock_australian: number;     // item 5 label I (Feedstock)
  partA_associates_australian: number;    // item 6 label K (Paid to associates)
  partA_assetDecline_australian: number;  // item 7 label M (Decline in value)
  partA_crc_australian: number;           // item 9 label Q (CRC contributions)
  partA_totalAllocated_australian: number;// item 10 label X (Total allocated)
  partA_totalNotional: number;            // item 11 label Z (X plus Y)

  // Part E – Additional Information (Page 3)
  taxRate: string;                        // label R  e.g. "30"

  // Part E – Non-refundable R&D tax offset (Page 3)
  rdEntityTotalExpenses: number;          // label V
  totalNotionalDeductionsZ2: number;      // label Z2
  rdIntensity: string;                    // label W  e.g. "2.50"

  // Page 4 – Tier of intensity
  tier1_notionalDeductions: number;       // label A1
  tier1_offsetAmount: number;             // label A2
  tier2_notionalDeductions: number;       // label B1
  tier2_offsetAmount: number;             // label B2
  excessNotionalDeductions: number;       // label C1 (non-tier excess)
  excessOffsetAmount: number;             // label C2

  // Page 4 – Non-refundable R&D tax offset total
  nonRefundableTaxOffset: number;         // label A (final)
}

// --- Formatting helpers ------------------------------------------------------

const fmtCurrency = (v: number): string =>
  v ? Math.round(v).toLocaleString("en-US") : "";

const stripPct = (s: string): string =>
  s ? s.replace("%", "").trim() : "";

// --- Entry point -------------------------------------------------------------

/**
 * Fetch computed R&D data for the Australian case, overlay onto the
 * ATO R&D Tax Incentive Schedule template, upload to Azure Blob, and
 * return the blob URL.
 */
export async function processAustraliaForm(
  caseRid: string,
  schemaName: string,
  accountNumber: string,
  templateBlobUrl: string,
  orgDb: Sequelize,
  stateCode: string,
  countryCode: string
): Promise<string> {
  logMessage(`[AUS RDTI] Starting form generation for case: ${caseRid}`);

  // 1. Fetch case row
  const [caseRow]: any[] = await orgDb.query(
    rawQueries.fetchCaseById(schemaName),
    { replacements: { caseId: caseRid }, type: QueryTypes.SELECT },
  );
  if (!caseRow) throw new Error(`[AUS RDTI] Case not found: ${caseRid}`);

  // 2. Fetch computation result
  const [calcRow]: any[] = await orgDb.query(
    rawQueries.fetchCountryCalculationForCase(schemaName),
    { replacements: { caseRid }, type: QueryTypes.SELECT },
  );
  if (!calcRow)
    throw new Error(`[AUS RDTI] No calculation row found for case: ${caseRid}`);

  const rootCf: Record<string, any> =
    typeof calcRow.computed_fields === "string"
      ? JSON.parse(calcRow.computed_fields)
      : (calcRow.computed_fields ?? {});

  // computed_fields may be one level nested
  const cf: Record<string, any> = rootCf["computed_fields"] ?? rootCf;

  const num = (v: any): number => {
    if (v === null || v === undefined || v === "-" || v === "") return 0;
    if (typeof v === "number") return v;
    return parseFloat(String(v).replace(/,/g, "")) || 0;
  };

  const str = (v: any): string =>
    v !== null && v !== undefined ? String(v) : "";

  // Safely extract tier data
  const tiers: any[] = Array.isArray(cf["Tier of intensity"])
    ? cf["Tier of intensity"]
    : [];
  const tier1 = tiers[0] ?? {};
  const tier2 = tiers[1] ?? {};

  const rdExpenditure: Record<string, any> = cf["R&D Expenditure"] ?? {};
  const nonRefundable: Record<string, any> = cf["Non-refundable tax offset"] ?? {};
  const titleBlock: Record<string, any>    = cf["Title"] ?? {};

  // 3. Map to form data
  const data: AusRdScheduleData = {
    companyName: str(titleBlock["Account Name"] ?? caseRow.client_name ?? ""),
    tfn:         str(caseRow.tfn ?? caseRow.tax_file_number ?? ""),
    abn:         str(caseRow.abn ?? caseRow.australian_business_number ?? ""),
    iisaNumber:  str(caseRow.iisa_number ?? ""),
    fiscalYear:  str(titleBlock["Fiscal Year"] ?? caseRow.fiscal_year ?? ""),

    // Preliminary Calculation
    preliminaryCalcD: num(
      cf["Preliminary Calculation"]?.["Add-back of R&D accounting expenditure (Item 7D)"]
    ),

    // Part A – Australian owned R&D
    // RSP and Other are not currently calculated by the AUS calculator;
    // set to 0.  Contract and Salary come from the computed R&D Expenditure block.
    partA_rsp_australian:            num(rdExpenditure["R&D expenditure - Research service provider (RSP)"]),
    partA_contract_australian:       num(rdExpenditure["R&D expenditure - Contract expenditure (not RSP)"]),
    partA_salary_australian:         num(rdExpenditure["R&D expenditure - Salary expenditure"]),
    partA_other_australian:          0,
    partA_feedstock_australian:      0,
    partA_associates_australian:     0,
    partA_assetDecline_australian:   0,
    partA_crc_australian:            0,
    partA_totalAllocated_australian: num(rdExpenditure["Total of allocated notional deductions"]),
    partA_totalNotional:             num(rdExpenditure["Total of notional R&D deductions (X plus Y)"]),

    // Part E
    taxRate:                    stripPct(str(cf["Additional Information"]?.["Tax rate"])),
    rdEntityTotalExpenses:      num(nonRefundable["R&D entity total expenses"]),
    totalNotionalDeductionsZ2:  num(nonRefundable["Total notional R&D deductions"]),
    rdIntensity:                stripPct(str(nonRefundable["R&D intensity"])),

    // Tier of intensity (Page 4)
    tier1_notionalDeductions: num(tier1["Notional deductions applied"]),
    tier1_offsetAmount:       num(tier1["offset Amount"]),
    tier2_notionalDeductions: num(tier2["Notional deductions applied"]),
    tier2_offsetAmount:       num(tier2["offset Amount"]),
    excessNotionalDeductions: 0,   // excess / non-tier not computed by current calculator
    excessOffsetAmount:       0,

    nonRefundableTaxOffset: num(cf["Non-refundable R&D tax offset"]?.["Total Offset Amount"]),
  };

  // 4. Generate and upload
  return generatePdf(data, caseRid, accountNumber, templateBlobUrl, stateCode, countryCode);
}

// --- PDF generator (private) -------------------------------------------------

async function generatePdf(
  data: AusRdScheduleData,
  caseRid: string,
  accountNumber: string,
  templateBlobUrl: string,
  stateCode: string,
  countryCode: string
): Promise<string> {
  const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

  // Download blank template
  const parsedUrl = new URL(templateBlobUrl);
  const pathParts  = parsedUrl.pathname.split("/").filter(Boolean);
  const container  = pathParts[0];
  if (!container)
    throw new Error("[AUS RDTI] Invalid template blob URL -- container not found");

  const blobName = decodeURIComponent(pathParts.slice(1).join("/"));
  logMessage(`[AUS RDTI] Downloading template: blob=${blobName}`);

  const pdfBytes = await downloadBufferFromAzureBlob(container, blobName);
  const pdfDoc   = await PDFDocument.load(pdfBytes);
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages    = pdfDoc.getPages();

  // -------------------------------------------------------------------------
  // Coordinate system
  // pdfplumber: top-origin.   pdf-lib: bottom-origin.
  //   y_pdf = PAGE_H - label_top - FONT_SIZE
  //
  // All coordinate values (label_top) were measured from the ATO template
  // using pdfplumber.  Adjust if your template differs.
  // -------------------------------------------------------------------------

  const PAGE_H    = 792;
  const FONT_SIZE = 9;

  // Right-aligned value column ends at x=574 (matches SC form convention)
  const VALUE_RIGHT_X = 574;

  // For fields that are left-aligned (header text boxes, labels etc.)
  const drawLeftOnPage = (
    pg: any,
    text: string,
    x: number,
    top: number,
    size = FONT_SIZE,
    bold = false
  ) => {
    if (!text?.trim()) return;
    pg.drawText(text, {
      x,
      y: PAGE_H - top - size,
      size,
      font: bold ? fontBold : font,
      color: rgb(0, 0, 0),
    });
  };

  // Right-aligned numeric / text value
  const drawRightOnPage = (
    pg: any,
    text: string,
    top: number,
    size = FONT_SIZE
  ) => {
    if (!text?.trim()) return;
    const textWidth = font.widthOfTextAtSize(text, size);
    pg.drawText(text, {
      x: VALUE_RIGHT_X - textWidth,
      y: PAGE_H - top - size,
      size,
      font,
      color: rgb(0, 0, 0),
    });
  };

  // =========================================================================
  // PAGE 1 – Preliminary Calculation + Part A
  // =========================================================================
  const page1 = pages[0];

  const drawLeft1  = (t: string, x: number, top: number, sz = FONT_SIZE, bold = false) =>
    drawLeftOnPage(page1, t, x, top, sz, bold);
  const drawRight1 = (t: string, top: number, sz = FONT_SIZE) =>
    drawRightOnPage(page1, t, top, sz);

  // --- Header ---------------------------------------------------------------
  // Company name: two rows of char-box fields, top ~68 and ~83
  drawLeft1(data.companyName, 36, 76, FONT_SIZE);

  // TFN: char boxes at top ~108, starting x ~36
  drawLeft1(data.tfn, 36, 116, FONT_SIZE);

  // AusIndustry IISA number: char boxes at top ~108, starting x ~230
  drawLeft1(data.iisaNumber, 230, 116, FONT_SIZE);

  // ABN: char boxes at top ~108, starting x ~430
  drawLeft1(data.abn, 430, 116, FONT_SIZE);

  // --- Preliminary Calculation – label D ------------------------------------
  // Dollar value box at top ~150
  drawRight1(fmtCurrency(data.preliminaryCalcD), 150);

  // --- Part A ---------------------------------------------------------------
  // Line 1  – RSP (Australian)  label A,  top ~196
  drawRight1(fmtCurrency(data.partA_rsp_australian), 196);

  // Line 2  – Contract (not RSP) label C, top ~220
  drawRight1(fmtCurrency(data.partA_contract_australian), 220);

  // Line 3  – Salary             label E, top ~244
  drawRight1(fmtCurrency(data.partA_salary_australian), 244);

  // Line 4  – Other              label G, top ~268
  drawRight1(fmtCurrency(data.partA_other_australian), 268);

  // Line 5  – Feedstock          label I, top ~292
  drawRight1(fmtCurrency(data.partA_feedstock_australian), 292);

  // Line 6  – Associates         label K, top ~316
  drawRight1(fmtCurrency(data.partA_associates_australian), 316);

  // Line 7  – Asset decline      label M, top ~340
  drawRight1(fmtCurrency(data.partA_assetDecline_australian), 340);

  // Line 9  – CRC contributions  label Q, top ~364
  drawRight1(fmtCurrency(data.partA_crc_australian), 364);

  // Line 10 – Total allocated    label X, top ~388
  drawRight1(fmtCurrency(data.partA_totalAllocated_australian), 388);

  // Line 11 – Total notional     label Z, top ~412
  drawRight1(fmtCurrency(data.partA_totalNotional), 412);

  // =========================================================================
  // PAGE 3 – Part D (Aggregated Turnover) + Part E (R&D Tax Offset)
  // =========================================================================
  const page3 = pages[2];

  const drawLeft3  = (t: string, x: number, top: number, sz = FONT_SIZE, bold = false) =>
    drawLeftOnPage(page3, t, x, top, sz, bold);
  const drawRight3 = (t: string, top: number, sz = FONT_SIZE) =>
    drawRightOnPage(page3, t, top, sz);

  // Part E – Additional Information
  // Tax rate  label R: small char-boxes at top ~338, starting around x~490
  drawLeft3(data.taxRate, 490, 346, FONT_SIZE);

  // Part E – Non-refundable R&D tax offset section
  // R&D entity total expenses  label V, top ~416
  drawRight3(fmtCurrency(data.rdEntityTotalExpenses), 416);

  // Total notional R&D deductions  label Z2, top ~440
  drawRight3(fmtCurrency(data.totalNotionalDeductionsZ2), 440);

  // R&D intensity  label W: small char-boxes, top ~464, x~480
  drawLeft3(data.rdIntensity, 480, 472, FONT_SIZE);

  // =========================================================================
  // PAGE 4 – Tier of Intensity + Non-refundable total + Declaration
  // =========================================================================
  const page4 = pages[3];

  const drawLeft4  = (t: string, x: number, top: number, sz = FONT_SIZE, bold = false) =>
    drawLeftOnPage(page4, t, x, top, sz, bold);
  const drawRight4 = (t: string, top: number, sz = FONT_SIZE) =>
    drawRightOnPage(page4, t, top, sz);

  // Tier 1 row
  // Notional deductions  label A1, top ~108  (left side of tier table)
  // Offset amount        label A2, top ~108  (right side)
  drawRight4(fmtCurrency(data.tier1_notionalDeductions), 108);
  // A2 is right-aligned in a narrower column ending at ~574; A1 ends at ~370
  {
    const t = fmtCurrency(data.tier1_offsetAmount);
    if (t) {
      const w = font.widthOfTextAtSize(t, FONT_SIZE);
      page4.drawText(t, {
        x: VALUE_RIGHT_X - w,
        y: PAGE_H - 108 - FONT_SIZE,
        size: FONT_SIZE,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }

  // Tier 2 row, top ~132
  drawRight4(fmtCurrency(data.tier2_notionalDeductions), 132);
  {
    const t = fmtCurrency(data.tier2_offsetAmount);
    if (t) {
      const w = font.widthOfTextAtSize(t, FONT_SIZE);
      page4.drawText(t, {
        x: VALUE_RIGHT_X - w,
        y: PAGE_H - 132 - FONT_SIZE,
        size: FONT_SIZE,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }

  // Excess (non-tier) row, top ~156
  drawRight4(fmtCurrency(data.excessNotionalDeductions), 156);
  {
    const t = fmtCurrency(data.excessOffsetAmount);
    if (t) {
      const w = font.widthOfTextAtSize(t, FONT_SIZE);
      page4.drawText(t, {
        x: VALUE_RIGHT_X - w,
        y: PAGE_H - 156 - FONT_SIZE,
        size: FONT_SIZE,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }

  // Non-refundable R&D tax offset total  label A, top ~180
  drawRight4(fmtCurrency(data.nonRefundableTaxOffset), 180);

  // --- Serialize and upload -------------------------------------------------
  const pdfBuffer    = Buffer.from(await pdfDoc.save());
  const outputFileName = `rd_form_${countryCode}${stateCode ? "_" + stateCode : ""}.pdf`;
  const outputBlobName = `cases/${caseRid}/rdForms/${outputFileName}`;

  const blobUrl = await uploadBufferToAzureBlob(pdfBuffer, outputBlobName, accountNumber);

  logMessage(`[AUS RDTI] Filled PDF uploaded: ${blobUrl}`);
  return blobUrl;
}
