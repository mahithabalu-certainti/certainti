import { QueryTypes, Sequelize } from "sequelize";
import {
  logMessage,
  uploadBufferToAzureBlob,
  downloadBufferFromAzureBlob,
} from "../../utils/helpers";
import { rawQueries } from "../../utils/constants";

// Connecticut Form CT-1120 RDC — Research and Development Expenditures Tax Credit
//
// Two-page form (612 x 792 pts).
//
// Page 1 — Part I: Tentative Research and Development Expenses Tax Credit Computation
//   Lines 1–6 (right column, value right-aligned at x≈571)
//   Lines 4a, 4b, 4c (mid-page partial sub-entries, right-aligned at x≈464)
//
// Page 2 — Part II: Research and Development Expenses Tax Credit Computation
//   Lines 1–7 (right column, right-aligned at x≈572)
//   Lines 5a, 5b (mid-page sub-entries, right-aligned at x≈468)
//
// Header fields:
//   - Corporation name    : page 1, top≈92.5,  x range [40, 380]
//   - CT Tax Reg Number   : page 1, top≈92.5,  x range [389, 576]
//   - Income Year Begin   : page 1, top≈76.6,  x≈178
//   - Income Year End     : page 1, top≈76.6,  x≈374
//   - DECD Certificate    : page 1, top≈118.1, x range [389, 576]
//
// Coordinate system: pdfplumber top-origin (y=0 at top, increases downward).
// pdf-lib uses bottom-origin → pdf_y = PAGE_H - top - FONT_SIZE
//
// Value entry:
//   Right-column values: right-aligned to x = 571 (just before the "00" cents placeholder)
//   Mid-column values  : right-aligned to x = 464 (for 4a/4b/4c and 5a/5b)

// --- Types -------------------------------------------------------------------

interface CTFormData {
  // Header
  corporationName: string;
  ctTaxRegistrationNumber: string;
  incomeYearBegin: string; // e.g. "01/01"
  incomeYearEnd: string;   // e.g. "12/31"
  incomeYearEndYear: string; // e.g. "2023"
  decdCertificateNumber: string;

  // Part I — Tentative Credit Computation (page 1)
  partI_line1_ctRdExpenses: number;
  partI_line2_incrementalExpenses: number;
  partI_line3_netRdExpenses: number;
  partI_line4a_smallBusiness: number | null;   // null = not applicable
  partI_line4b_enterpriseZone: number | null;  // null = not applicable
  partI_line4c_otherBusinesses: number | null; // null = not applicable
  partI_line4_tentativeCredit: number;
  partI_line5_reduction: number;
  partI_line6_allowableTentativeCredit: number;

  // Part II — Credit Computation (page 2)
  partII_line1_allowableTentativeCredit: number;
  partII_line2_oneThirdRate: number;
  partII_line3_ctBusinessTaxLiability: number;
  partII_line4_halfTaxLiability: number;
  partII_line5a_doubleCredit: number;
  partII_line5b_90pctOfLine3: number;
  partII_line5_lesserOf5aOr5b: number;
  partII_line6_greaterOf4Or5: number;
  partII_line7_finalCredit: number;
}

// --- Formatting helpers ------------------------------------------------------

const fmtCurrency = (v: number | null | undefined): string => {
  if (v === null || v === undefined || v === 0) return "";
  return Math.round(v).toLocaleString("en-US");
};

// --- Entry point -------------------------------------------------------------

/**
 * Fetch computed R&D data for the CT case, overlay onto CT-1120 RDC template,
 * upload to Azure Blob, and return the blob URL.
 */
export async function processConnecticutForm(
  caseRid: string,
  schemaName: string,
  accountNumber: string,
  templateBlobUrl: string,
  orgDb: Sequelize,
  stateRid: string,
  stateCode: string,
  countryCode: string
): Promise<string> {
  logMessage(`[CT RDC] Starting form generation for case: ${caseRid}`);

  // 1. Fetch case row
  const [caseRow]: any[] = await orgDb.query(
    rawQueries.fetchCaseById(schemaName),
    { replacements: { caseId: caseRid }, type: QueryTypes.SELECT },
  );
  if (!caseRow) throw new Error(`[CT RDC] Case not found: ${caseRid}`);

  // 2. Fetch computation result
  const [calcRow]: any[] = await orgDb.query(
    rawQueries.fetchStateCalculationForCase(schemaName),
    { replacements: { caseRid,stateRid }, type: QueryTypes.SELECT },
  );
  if (!calcRow)
    throw new Error(`[CT RDC] No calculation row found for case: ${caseRid}`);

  const rootCf: Record<string, any> =
    typeof calcRow.computed_fields === "string"
      ? JSON.parse(calcRow.computed_fields)
      : (calcRow.computed_fields ?? {});

  // Unwrap outer "computed_fields" wrapper if present
  const outer: Record<string, any> = rootCf["computed_fields"] ?? rootCf;

  // CT calculator stores lines under these three section keys
  const partI_Credit:    Record<string, any> = outer["Part I - Credit Computation"]          ?? {};
  const partI_Tentative: Record<string, any> = outer["Part I - Tentative Credit Computation"] ?? {};
  const partII:          Record<string, any> = outer["Part II - Credit Computation"]          ?? {};

  const num = (v: any): number => {
    if (v === null || v === undefined || v === "-" || v === "") return 0;
    if (typeof v === "number") return v;
    return parseFloat(String(v).replace(/,/g, "")) || 0;
  };

  // Fiscal year dates from case
  const fiscalYearEnded: string = String(calcRow.fiscal_year_ended ?? caseRow.fiscal_year_ended ?? "");

  // 3. Map computed fields to form data
  const data: CTFormData = {
    corporationName:         String(caseRow.client_name ?? ""),
    ctTaxRegistrationNumber: String(caseRow.ct_tax_registration_number ?? caseRow.state_tax_id ?? ""),
    incomeYearBegin:         String(caseRow.income_year_begin ?? ""),
    incomeYearEnd:           String(caseRow.income_year_end ?? ""),
    incomeYearEndYear:       String(caseRow.income_year_end_year ?? "2023"),
    decdCertificateNumber:   String(caseRow.decd_certificate_number ?? ""),

    // Page 1 — Part I Tentative
    // Line 1: CT R&D expenses for current year
    partI_line1_ctRdExpenses:
      num(partI_Tentative["[1] Enter the amount of Connecticut research and development expenses for the current income year."]),

    // Line 2: Incremental expenditures from CT-1120RC Part I Line 3
    partI_line2_incrementalExpenses:
      num(partI_Tentative["[2] Enter the amount of excess Connecticut research and experimental expenditures for the current income year. From Form CT-1120RC Part I, Line 3."]),

    // Line 3: Net R&D expenses (Line 1 − Line 2)
    partI_line3_netRdExpenses:
      num(findKeyStartsWith(partI_Tentative, "[3] Balance:")),

    // Lines 4a/4b/4c: conditionally filled based on taxpayer type
    partI_line4a_smallBusiness:   null, // small business only — not auto-filled
    partI_line4b_enterpriseZone:  null, // enterprise zone only — not auto-filled
    // Line 4c: computed from tentative credit rate schedule (all other businesses)
    partI_line4c_otherBusinesses:
      num(findKeyStartsWith(partI_Tentative, "[4 c]")),

    // Line 4: Tentative credit (from 4a, 4b, or 4c)
    partI_line4_tentativeCredit:
      num(findKeyStartsWith(partI_Tentative, "[4] Tentative credit:")),

    // Line 5: Reduction (if Line 3 > $200M and workforce reduced)
    partI_line5_reduction:
      num(findKeyStartsWith(partI_Tentative, "[5] Reduction")),

    // Line 6: Allowable tentative tax credit
    partI_line6_allowableTentativeCredit:
      num(findKeyStartsWith(partI_Tentative, "[6] Allowable tentative tax credit")),

    // Page 2 — Part II Credit Computation
    // Line 1: Allowable tentative tax credit from Part I Line 6
    partII_line1_allowableTentativeCredit:
      num(findKeyStartsWith(partII, "[1] Allowable Tentative Tax Credit")),

    // Line 2: Line 1 × 33⅓%
    partII_line2_oneThirdRate:
      num(findKeyStartsWith(partII, "[2] Multiply Line 1")),

    // Line 3: CT Business Tax Liability
    partII_line3_ctBusinessTaxLiability:
      num(findKeyStartsWith(partII, "[3] Current Year CT Business Tax Liability")),

    // Line 4: Line 3 × 50%
    partII_line4_halfTaxLiability:
      num(findKeyStartsWith(partII, "[4] Multiply Line 3")),

    // Line 5a: Line 1 × 2
    partII_line5a_doubleCredit:
      num(findKeyStartsWith(partII, "[5 a] Multiply Line 1")),

    // Line 5b: 90% of Line 3
    partII_line5b_90pctOfLine3:
      num(findKeyStartsWith(partII, "[5 b] Enter")),

    // Line 5: Lesser of 5a or 5b
    partII_line5_lesserOf5aOr5b:
      num(findKeyStartsWith(partII, "[5] Enter the lesser of Line 5a")),

    // Line 6: Greater of Line 4 or Line 5
    partII_line6_greaterOf4Or5:
      num(findKeyStartsWith(partII, "[6] Enter the greater")),

    // Line 7: Final CT R&D Credit (lesser of Line 2 or Line 6)
    partII_line7_finalCredit:
      num(findKeyStartsWith(partII, "[7]")),
  };

  // 4. Generate and upload
  return generatePdf(data, caseRid, accountNumber, templateBlobUrl, stateCode, countryCode);
}

// --- Helpers -----------------------------------------------------------------

/** Find a value in a record by key prefix match */
function findKeyStartsWith(obj: Record<string, any>, prefix: string): any {
  const key = Object.keys(obj).find(k => k.startsWith(prefix));
  return key ? obj[key] : 0;
}

// --- PDF generator (private) -------------------------------------------------

async function generatePdf(
  data: CTFormData,
  caseRid: string,
  accountNumber: string,
  templateBlobUrl: string,
  stateCode: string,
  countryCode: string
): Promise<string> {
  const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

  // Download blank template
  const parsedUrl = new URL(templateBlobUrl);
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
  const container = pathParts[0];
  if (!container)
    throw new Error("[CT RDC] Invalid template blob URL — container not found");

  const blobName = decodeURIComponent(pathParts.slice(1).join("/"));
  logMessage(`[CT RDC] Downloading template: blob=${blobName}`);

  const pdfBytes = await downloadBufferFromAzureBlob(container, blobName);
  const pdfDoc   = await PDFDocument.load(pdfBytes);
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages    = pdfDoc.getPages();

  // ── Coordinate system ────────────────────────────────────────────────────
  // pdfplumber: top-origin (y=0 at top, y increases downward).
  // pdf-lib:    bottom-origin (y=0 at bottom, y increases upward).
  //   pdf_lib_y = PAGE_H - top - FONT_SIZE
  //
  // All "top" values below come from pdfplumber measurements.
  //
  // Value columns (right-aligned):
  //   MAIN_RIGHT_X  = 571  → right-column values (lines 1-6 page1, lines 1-7 page2)
  //   MID_RIGHT_X   = 464  → mid-column sub-entries (4a/4b/4c page1, 5a/5b page2)
  //
  // Header field positions (page 1):
  //   Corporation name    : top≈103, left-aligned at x=40
  //   CT Tax Reg Number   : top≈103, left-aligned at x=389
  //   Income Year Begin   : top≈82,  left-aligned at x=178
  //   Income Year End     : top≈82,  left-aligned at x=374
  //   Income Year End Yr  : top≈82,  left-aligned at x=498
  //   DECD Cert Number    : top≈128, left-aligned at x=389

  const PAGE_H       = 792;
  const FONT_SIZE    = 9;
  const MAIN_RIGHT_X = 571; // right edge of main value column
  const MID_RIGHT_X  = 464; // right edge of mid-page sub-entry column

  const page1 = pages[0];
  const page2 = pages[1];

  /**
   * Draw text right-aligned to a given right-edge X on the specified page.
   * @param page    - pdf-lib page object
   * @param text    - text to draw
   * @param rightX  - right edge x coordinate (PDF coords)
   * @param top     - pdfplumber "top" of the row
   * @param size    - font size
   */
  const drawRight = (page: any, text: string, rightX: number, top: number, size = FONT_SIZE) => {
    if (!text?.trim()) return;
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: rightX - textWidth,
      y: PAGE_H - top - size,
      size,
      font,
      color: rgb(0, 0, 0),
    });
  };

  /**
   * Draw text left-aligned on the specified page.
   */
  const drawLeft = (page: any, text: string, x: number, top: number, size = FONT_SIZE) => {
    if (!text?.trim()) return;
    page.drawText(text, {
      x,
      y: PAGE_H - top - size,
      size,
      font,
      color: rgb(0, 0, 0),
    });
  };

  // ── Page 1: Header ─────────────────────────────────────────────────────
  // Corporation name field (underline at top≈109, text drawn just above)
  drawLeft(page1, data.corporationName, 40, 103);

  // CT Tax Registration Number (right header box, top≈103)
  drawLeft(page1, data.ctTaxRegistrationNumber, 389, 103);

  // Income Year Begin (top≈82, after "Beginning:" label at x≈174)
  if (data.incomeYearBegin) drawLeft(page1, data.incomeYearBegin, 178, 82);

  // Income Year End date (top≈82, after "Ending:" label at x≈373)
  if (data.incomeYearEnd) drawLeft(page1, data.incomeYearEnd, 374, 82);

  // Income Year End year (top≈82, x≈498 — last blank before period)
  if (data.incomeYearEndYear) drawLeft(page1, data.incomeYearEndYear, 498, 82);

  // DECD Eligibility Certificate Number (top≈128, right header box)
  if (data.decdCertificateNumber) drawLeft(page1, data.decdCertificateNumber, 389, 128);

  // ── Page 1: Part I — Tentative Credit Computation ────────────────────
  //
  //  Line  |  pdfplumber top  |  Column
  //  ──────┼──────────────────┼──────────────────
  //    1   |     568.4        |  MAIN_RIGHT_X
  //    2   |     595.6        |  MAIN_RIGHT_X
  //    3   |     612.8        |  MAIN_RIGHT_X
  //   4a   |     630.0 (mid)  |  MID_RIGHT_X   (Qualified small businesses)
  //   4b   |     667.2 (mid)  |  MID_RIGHT_X   (Enterprise Zone)
  //   4c   |     694.4 (mid)  |  MID_RIGHT_X   (All other businesses)
  //    4   |     711.6        |  MAIN_RIGHT_X
  //    5   |     728.8        |  MAIN_RIGHT_X
  //    6   |     746.0        |  MAIN_RIGHT_X

  drawRight(page1, fmtCurrency(data.partI_line1_ctRdExpenses),              MAIN_RIGHT_X, 568.4);
  drawRight(page1, fmtCurrency(data.partI_line2_incrementalExpenses),        MAIN_RIGHT_X, 595.6);
  drawRight(page1, fmtCurrency(data.partI_line3_netRdExpenses),              MAIN_RIGHT_X, 612.8);

  // Line 4a — only fill if small business path was taken
  if (data.partI_line4a_smallBusiness !== null) {
    drawRight(page1, fmtCurrency(data.partI_line4a_smallBusiness),           MID_RIGHT_X,  630.0);
  }
  // Line 4b — only fill if enterprise zone path was taken
  if (data.partI_line4b_enterpriseZone !== null) {
    drawRight(page1, fmtCurrency(data.partI_line4b_enterpriseZone),          MID_RIGHT_X,  667.2);
  }
  // Line 4c — all other businesses (tentative credit rate schedule)
  if (data.partI_line4c_otherBusinesses !== null) {
    drawRight(page1, fmtCurrency(data.partI_line4c_otherBusinesses),         MID_RIGHT_X,  694.4);
  }

  drawRight(page1, fmtCurrency(data.partI_line4_tentativeCredit),            MAIN_RIGHT_X, 711.6);
  drawRight(page1, fmtCurrency(data.partI_line5_reduction),                  MAIN_RIGHT_X, 728.8);
  drawRight(page1, fmtCurrency(data.partI_line6_allowableTentativeCredit),   MAIN_RIGHT_X, 746.0);

  // ── Page 2: Part II — R&D Expenses Tax Credit Computation ───────────────
  //
  //  Line  |  pdfplumber top  |  Column
  //  ──────┼──────────────────┼──────────────────
  //    1   |     178.4        |  MAIN_RIGHT_X
  //    2   |     195.6        |  MAIN_RIGHT_X
  //    3   |     242.8        |  MAIN_RIGHT_X
  //    4   |     260.0        |  MAIN_RIGHT_X
  //   5a   |     277.2 (mid)  |  MID_RIGHT_X
  //   5b   |     294.4 (mid)  |  MID_RIGHT_X
  //    5   |     311.6        |  MAIN_RIGHT_X
  //    6   |     328.8        |  MAIN_RIGHT_X
  //    7   |     356.0        |  MAIN_RIGHT_X

  drawRight(page2, fmtCurrency(data.partII_line1_allowableTentativeCredit),  MAIN_RIGHT_X, 178.4);
  drawRight(page2, fmtCurrency(data.partII_line2_oneThirdRate),              MAIN_RIGHT_X, 195.6);
  drawRight(page2, fmtCurrency(data.partII_line3_ctBusinessTaxLiability),    MAIN_RIGHT_X, 242.8);
  drawRight(page2, fmtCurrency(data.partII_line4_halfTaxLiability),          MAIN_RIGHT_X, 260.0);
  drawRight(page2, fmtCurrency(data.partII_line5a_doubleCredit),             MID_RIGHT_X,  277.2);
  drawRight(page2, fmtCurrency(data.partII_line5b_90pctOfLine3),             MID_RIGHT_X,  294.4);
  drawRight(page2, fmtCurrency(data.partII_line5_lesserOf5aOr5b),            MAIN_RIGHT_X, 311.6);
  drawRight(page2, fmtCurrency(data.partII_line6_greaterOf4Or5),             MAIN_RIGHT_X, 328.8);
  drawRight(page2, fmtCurrency(data.partII_line7_finalCredit),               MAIN_RIGHT_X, 356.0);

  // ── Serialize and upload ──────────────────────────────────────────────────
  const pdfBuffer    = Buffer.from(await pdfDoc.save());
  const outputFileName = `rd_form_${countryCode}${stateCode}.pdf`;
  const outputBlobName = `cases/${caseRid}/rdForms/${outputFileName}`;

  const blobUrl = await uploadBufferToAzureBlob(pdfBuffer, outputBlobName, accountNumber);

  logMessage(`[CT RDC] Filled PDF uploaded: ${blobUrl}`);
  return blobUrl;
}
