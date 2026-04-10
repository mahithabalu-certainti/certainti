import { QueryTypes, Sequelize } from "sequelize";
import {
  logMessage,
  uploadBufferToAzureBlob,
  downloadBufferFromAzureBlob,
} from "../../utils/helpers";
import { rawQueries } from "../../utils/constants";

// New Jersey Form 306 -- Research and Development Tax Credit (2025)
//
// Form layout (3 pages used, 612 x 792 pts each):
//   Page 1 -- Header + Part I (line 1) + Part II (lines 2-4) + Part III (lines 5-15)
//   Page 2 -- Part IV (lines 16-24) + Part V (lines 25a-31) + Part VI (lines 32-38)
//   Page 3 -- Part VII (lines 39-52) -- Combined filers only, skipped
//
// Coordinates extracted from blank PDF via pdfplumber line/rect analysis.
// Value box: x0=482.3 (Part I-IV) / x0=476.4 (Part V+), x1=582.0
// Text is right-aligned inside the box, vertically centred.
//
// computed_fields structure (from RdCreditCalculatorForNJ.buildComputedFields):
//   computed_fields: {
//     "[PART IV] CREDIT CALCULATION FOR QUALIFIED RESEARCH EXPENESES (ALTERNATIVE SIMPLIFIED CREDIT METHOD)": {
//       "[16] Wages...": number,  "[17]...": number, ... "[24]...": number
//     },
//     "[PART V] TOTAL RESEARCH AND DEVELOPMENT TAX CREDIT": {
//       "[26]...": number, "[27]...": number, "[28]...": number, "[30]...": number
//     },
//     "[PART I/II/III/VI]...": { ... }
//   }
//
// Usage from processStateForms in rdFormMapperService.ts:
//
//   import { processNewJerseyForm } from "./stateForms/njForm306Generator";
//
//   if (resolvedStateCode === "NJ") {
//     const url = await processNewJerseyForm(
//       caseRid, schemaName, accountNumber, formInfo.browse_file, orgDb,
//     );
//     await this.rdFormMapperSchemaService.saveStateFilledFormUrl(
//       caseRid, state, url, orgDb, accountNumber,
//     );
//     continue;
//   }

// --- Types -------------------------------------------------------------------

interface NJForm306Data {
  // Header
  corporationName: string;
  federalId: string;

  // Part I -- Energy Consortia
  line1_energyConsortia: number;

  // Part II -- Basic Research Payments
  line2_basicResearchPayments: number;
  line3_basePeriodAmount: number;
  line4_line2MinusLine3: number;

  // Part III -- Regular Method (skipped if using ASC / Part IV)
  line5_wages: number;
  line6_supplies: number;
  line7_computerRental: number;
  line8_contractPct: number;
  line9_totalQre: number;
  line10_fixedBasePct: number;     // stored as decimal e.g. 0.16
  line11_avgGrossReceipts: number;
  line12_baseAmount: number;
  line13_line9MinusLine12: number;
  line14_50pctLine9: number;
  line15_lesserLine13or14: number;

  // Part IV -- Alternative Simplified Credit Method (ASC)
  line16_wages: number;
  line17_supplies: number;
  line18_computerRental: number;
  line19_contractPct: number;
  line20_totalQre: number;
  line21_prior3YrsQre: number;
  line22_line21DivBy6: number;
  line23_line20MinusLine22: number;
  line24_finalAscAmount: number;

  // Part V -- Total Credit
  line25a_fromLine1: number;
  line25b_fromLine4: number;
  line25c_total25aPlus25b: number;
  line26_line15or24: number;
  line27_line25cPlusLine26: number;
  line28_line27Times10pct: number;
  line29_carryforward: number;
  line30_njk1Credit: number;
  line31_totalCreditAvailable: number;

  // Part VI -- Allowable Credit (non-combined filers)
  line32_taxLiability: number;
  line33_minTaxLiability: number;
  line34_line32MinusLine33: number;
  line35_otherCredits: number;
  line36_line34MinusLine35: number;
  line37_allowableCredit: number;
  line38_carryforward: number;

  // Which method was used (drives which part gets filled)
  useAscMethod: boolean;  // true = Part IV, false = Part III
}

// --- Formatting helpers ------------------------------------------------------

const fmtCurrency = (v: number): string =>
  v ? Math.round(v).toLocaleString("en-US") : "";

const fmtDecimal = (v: number, d = 4): string =>
  v !== 0 ? v.toFixed(d) : "";

// --- Entry point -------------------------------------------------------------

/**
 * Fetch computed R&D data for the NJ case, overlay onto Form 306 template,
 * upload to Azure Blob, and return the blob URL.
 */
export async function processNewJerseyForm(
  caseRid: string,
  schemaName: string,
  accountNumber: string,
  templateBlobUrl: string,
  orgDb: Sequelize,
  stateRid: String,
   stateCode:string,
  countryCode: string
): Promise<string> {
  logMessage(`[NJ 306] Starting form generation for case: ${caseRid}`);

  // 1. Fetch case row
  const [caseRow]: any[] = await orgDb.query(
    rawQueries.fetchCaseById(schemaName),
    { replacements: { caseId: caseRid }, type: QueryTypes.SELECT },
  );
  if (!caseRow) throw new Error(`[NJ 306] Case not found: ${caseRid}`);

  // 2. Fetch computation result
 const [calcRow]: any[] = await orgDb.query(
    rawQueries.fetchStateCalculationForCase(schemaName),
    { replacements: { caseRid,stateRid }, type: QueryTypes.SELECT },
  );
  if (!calcRow)
    throw new Error(`[NJ 306] No calculation row found for case: ${caseRid}`);

  const rootCf: Record<string, any> =
    typeof calcRow.computed_fields === "string"
      ? JSON.parse(calcRow.computed_fields)
      : (calcRow.computed_fields ?? {});

  // computed_fields may be one level nested
  const cf: Record<string, any> = rootCf["computed_fields"] ?? rootCf;

  // 3. Extract sections from computed_fields
  const p1  = cf["[PART I] CREDIT CALCULATION FOR BASIC RESEARCH PAYMENTS"]  ?? {};
  const p2  = cf["[PART II] CREDIT CALCULATION FOR BASIC RESEARCH PAYMENTS"]  ?? {};
  const p3  = cf["[PART III] CREDIT CALCULATION FOR QUALIFIED RESEARCH EXPENSES"] ?? {};
  const p4  = cf["[PART IV] CREDIT CALCULATION FOR QUALIFIED RESEARCH EXPENESES (ALTERNATIVE SIMPLIFIED CREDIT METHOD)"] ?? {};
  const p5  = cf["[PART V] TOTAL RESEARCH AND DEVELOPMENT TAX CREDIT"]        ?? {};
  const p6  = cf["[PART VI] CALCULATION OF THE ALLOWABLE CREDIT AMOUNT AND CARRYOVER"] ?? {};

  const num = (v: any): number => {
    if (v === null || v === undefined || v === "-" || v === "") return 0;
    if (typeof v === "number") return v;
    const s = String(v).replace(/,/g, "").trim();
    if (s.endsWith("%")) return parseFloat(s) / 100;
    return parseFloat(s) || 0;
  };

  // Determine method from computed_fields content
  const useAscMethod = Object.keys(p4).length > 0;

  // 4. Map to form data
  const data: NJForm306Data = {
    corporationName: String(caseRow.client_name ?? ""),
    federalId:       String(caseRow.federal_id ?? caseRow.ein ?? ""),

    // Part I
    line1_energyConsortia: num(p1["[1] Enter the basic research payments paid or incurred to qualified organizations"]),

    // Part II
    line2_basicResearchPayments: num(p2["[2] Enter the basic research payments paid or incurred to qualified organizations"]),
    line3_basePeriodAmount:      num(p2["[3] Enter the base period amount"]),
    line4_line2MinusLine3:       num(p2["[4] Subtract line 3 from line 2. If zero or less, enter zero"]),

    // Part III (regular method)
    line5_wages:            num(p3["[5] Wages for Qualified services (do not include wages used to compute the Federal Jobs Credit)"]),
    line6_supplies:         num(p3["[6] Cost of Supplies"]),
    line7_computerRental:   num(p3["[7] Rental or lease costs of computers"]),
    line8_contractPct:      num(p3["[8] Enter 65% (.65) of contract expenses"]),
    line9_totalQre:         num(p3["[9] Total qualified research expenses. Add lines 5 through 8"]),
    line10_fixedBasePct:    num(p3["[10] Enter fixed-based percentage, but not more than 16%"]),
    line11_avgGrossReceipts:num(p3["[11] Enter average annual gross receipts"]),
    line12_baseAmount:      num(p3["[12] Base amount - multiply line 10 by the percentage on line 9"]),
    line13_line9MinusLine12:num(p3["[13] Subtract line 12 from line 9"]),
    line14_50pctLine9:      num(p3["[14] Enter 50% (.50) of line 9"]),
    line15_lesserLine13or14:num(p3["[15] Enter the smaller of line 13 or 14"]),

    // Part IV (ASC method -- primary path for this calculator)
    line16_wages:           num(p4["[16] Wages for qualified services (do not include wages used to compute the Federal Jobs Credit)"]),
    line17_supplies:        num(p4["[17] Cost of Supplies"]),
    line18_computerRental:  num(p4["[18] Rental or lease costs of computers"]),
    line19_contractPct:     num(p4["[19] Enter the applicable percentage of contract research expenses (see instructions)"]),
    line20_totalQre:        num(p4["[20] Total qualified research expenses. Add lines 16 through 19"]),
    line21_prior3YrsQre:    num(p4["[21] Enter your total qualified research expenses for the prior 3 privilege periods or tax years. If you had no qualified research expenses in any one of those years, skip lines 22 and 23 and enter the amount from line 20 on line 24."]),
    line22_line21DivBy6:    num(p4[Object.keys(p4).find(k => k.startsWith("[22]")) ?? ""]),
    line23_line20MinusLine22: num(p4["[23] Subtract line 22 from line 20. If zero or less, enter zero. Include here and on line 24."]),
    line24_finalAscAmount:  num(p4["[24] Enter amount from line 23 or if you skipped lines 22 and 23, enter amount from line 20."]),

    // Part V
    line25a_fromLine1:       0,  // energy consortia -- usually 0
    line25b_fromLine4:       0,  // basic research -- usually 0
    line25c_total25aPlus25b: 0,
    line26_line15or24:       num(p5["[26] Enter either line 15 or 24 (whichever method was used for federal purposes)"]),
    line27_line25cPlusLine26: num(p5["[27] Add lines 25c and 26"]),
    line28_line27Times10pct: num(p5[Object.keys(p5).find(k => k.startsWith("[28]")) ?? ""]),
    line29_carryforward:     0,
    line30_njk1Credit:       0,
    line31_totalCreditAvailable: num(p5["[30] Total credit available - Add lines 28 and 29"]),

    // Part VI
    line32_taxLiability:   num(p6["[31] Enter tax liability from page 1, line 2 of CBT-100, CBT-100S, or BFC-1, or the member's column of Schedule A. Part III, line 5 of CBT-100U"]),
    line33_minTaxLiability:num(p6["[32] Enter the required minimum tax liability as indicated in section (b) for Part VI"]),
    line34_line32MinusLine33: num(p6["[33] Subtract line 32 from line 31"]),
    line35_otherCredits:   0,
    line36_line34MinusLine35: num(p6["[35] Subtract line 34 form line 33. If zero or less, enter zero"]),
    line37_allowableCredit:num(p6["[36] Allowable credit for the current period or tax year. Enter the lessor of line 30 or line 35 here and on Part I, Schedule A-3 of the CBT-100, CBT-100U, CBT-100S or BFC-1."]),
    line38_carryforward:   num(p6["[37] a) research and development tax credit carryover (subtract line 36 from line 30)"]),

    useAscMethod,
  };

  // 5. Generate and upload
  return generatePdf(data, caseRid, accountNumber, templateBlobUrl,stateCode,countryCode);
}

// --- PDF generator (private) -------------------------------------------------

async function generatePdf(
  data: NJForm306Data,
  caseRid: string,
  accountNumber: string,
  templateBlobUrl: string,
   stateCode:string,
  countryCode: string
): Promise<string> {
  const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

  // Download template
  const parsedUrl = new URL(templateBlobUrl);
  const pathParts  = parsedUrl.pathname.split("/").filter(Boolean);
  const container  = pathParts[0];
  if (!container)
    throw new Error("[NJ 306] Invalid template blob URL -- container not found");

  const blobName = decodeURIComponent(pathParts.slice(1).join("/"));
  logMessage(`[NJ 306] Downloading template: blob=${blobName}`);

  const pdfBytes = await downloadBufferFromAzureBlob(container, blobName);
  const pdfDoc   = await PDFDocument.load(pdfBytes);
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages    = pdfDoc.getPages();

  if (pages.length < 2)
    throw new Error("[NJ 306] Template must have at least 2 pages");

  const PAGE_H    = 792;
  const FONT_SIZE = 9;

  // Value box geometry
  // Part I-IV (page 1 + page 2 lines 16-24): x0=482.3, x1=582.0
  // Part V+   (page 2 lines 25a+):            x0=476.4, x1=582.0
  const BOX_X1    = 582.0;
  const BOX_X0_P1 = 482.3;  // Part I-IV
  const BOX_X0_P5 = 476.4;  // Part V+

  // --- Draw helpers -----------------------------------------------------------

  /** Left-aligned text (header) */
  const drawLeft = (
    pageIdx: number, text: string, x: number, top: number,
    size = FONT_SIZE, bold = false,
  ) => {
    if (!text?.trim()) return;
    pages[pageIdx].drawText(text, {
      x, y: PAGE_H - top - size,
      size, font: bold ? fontBold : font, color: rgb(0, 0, 0),
    });
  };

  /**
   * Right-aligned text inside value box.
   * draw_top = vertical midpoint of the box row (pdfplumber top-origin).
   * We nudge up by half font size to visually centre in the row.
   */
  const drawValue = (
    pageIdx: number, text: string, drawTop: number,
    boxX0 = BOX_X0_P1, size = FONT_SIZE,
  ) => {
    if (!text?.trim()) return;
    const textWidth = font.widthOfTextAtSize(text, size);
    const rightMargin = 4;
    pages[pageIdx].drawText(text, {
      x: BOX_X1 - textWidth - rightMargin,
      y: PAGE_H - drawTop - size / 2,
      size, font, color: rgb(0, 0, 0),
    });
  };

  // Convenience aliases for the two box types
  const dv1 = (pi: number, text: string, top: number) => drawValue(pi, text, top, BOX_X0_P1);
  const dv5 = (pi: number, text: string, top: number) => drawValue(pi, text, top, BOX_X0_P5);

  // --- Header (page 1) --------------------------------------------------------
  // "Name as Shown on Return" field: x~56, top~238 (just below the header rule)
  // "Federal ID Number" field:       x~300, top~238
  drawLeft(0, data.corporationName, 56,  238);
  drawLeft(0, data.federalId,       303, 238);

  // --- Page 1 line coordinates (draw_top = midpoint of value box row) ---------
  // Derived from pdfplumber h-line analysis: midpoint between consecutive row tops
  //
  // Part I
  dv1(0, fmtCurrency(data.line1_energyConsortia),      277.5);

  // Part II
  dv1(0, fmtCurrency(data.line2_basicResearchPayments), 307.1);
  dv1(0, fmtCurrency(data.line3_basePeriodAmount),      322.1);
  dv1(0, fmtCurrency(data.line4_line2MinusLine3),       337.1);

  // Part III -- only fill if regular method used
  if (!data.useAscMethod) {
    dv1(0, fmtCurrency(data.line5_wages),              504.2);
    dv1(0, fmtCurrency(data.line6_supplies),           519.2);
    dv1(0, fmtCurrency(data.line7_computerRental),     534.2);
    dv1(0, fmtCurrency(data.line8_contractPct),        549.2);
    dv1(0, fmtCurrency(data.line9_totalQre),           564.2);
    dv1(0, fmtDecimal(data.line10_fixedBasePct, 4),    579.2);
    dv1(0, fmtCurrency(data.line11_avgGrossReceipts),  594.2);
    dv1(0, fmtCurrency(data.line12_baseAmount),        609.2);
    dv1(0, fmtCurrency(data.line13_line9MinusLine12),  624.2);
    dv1(0, fmtCurrency(data.line14_50pctLine9),        639.2);
    dv1(0, fmtCurrency(data.line15_lesserLine13or14),  654.2);
  }

  // --- Page 2 line coordinates ------------------------------------------------
  // Header repeat
  drawLeft(1, data.corporationName, 56,  44);
  drawLeft(1, data.federalId,       303, 44);

  // Part IV -- ASC Method (fill if useAscMethod, or fill regardless as calculator always populates it)
  dv1(1, fmtCurrency(data.line16_wages),             83.2);
  dv1(1, fmtCurrency(data.line17_supplies),          98.2);
  dv1(1, fmtCurrency(data.line18_computerRental),    113.2);
  dv1(1, fmtCurrency(data.line19_contractPct),       128.2);
  dv1(1, fmtCurrency(data.line20_totalQre),          143.2);
  dv1(1, fmtCurrency(data.line21_prior3YrsQre),      162.4);
  dv1(1, fmtCurrency(data.line22_line21DivBy6),      181.6);
  dv1(1, fmtCurrency(data.line23_line20MinusLine22), 196.6);
  dv1(1, fmtCurrency(data.line24_finalAscAmount),    211.3);

  // Part V -- box shifts to x0=476.4 from here
  dv5(1, fmtCurrency(data.line25a_fromLine1),        245.1);
  dv5(1, fmtCurrency(data.line25b_fromLine4),        269.1);
  dv5(1, fmtCurrency(data.line25c_total25aPlus25b),  293.1);
  dv5(1, fmtCurrency(data.line26_line15or24),        317.1);
  dv5(1, fmtCurrency(data.line27_line25cPlusLine26), 341.1);
  dv5(1, fmtCurrency(data.line28_line27Times10pct),  365.1);
  dv5(1, fmtCurrency(data.line29_carryforward),      389.1);
  // line 30 (NJK-1 partnerships) -- skip, multi-row entry not applicable
  dv5(1, fmtCurrency(data.line31_totalCreditAvailable), 483.5);

  // Part VI
  dv5(1, fmtCurrency(data.line32_taxLiability),      532.8);
  dv5(1, fmtCurrency(data.line33_minTaxLiability),   556.8);
  dv5(1, fmtCurrency(data.line34_line32MinusLine33), 580.8);
  // line 35 (other credits list) -- skip multi-row
  dv5(1, fmtCurrency(data.line36_line34MinusLine35), 662.7);
  dv5(1, fmtCurrency(data.line37_allowableCredit),   686.7);
  dv5(1, fmtCurrency(data.line38_carryforward),      734.7);

  // --- Serialize and upload ---------------------------------------------------
  const pdfBuffer = Buffer.from(await pdfDoc.save());
  const outputFileName = `rd_form_${countryCode}${stateCode}.pdf`;
  const outputBlobName = `cases/${caseRid}/rdForms/${outputFileName}`;


  const blobUrl   = await uploadBufferToAzureBlob(pdfBuffer, outputBlobName, accountNumber);

  logMessage(`[NJ 306] Filled PDF uploaded: ${blobUrl}`);
  return blobUrl;
}
