import { QueryTypes, Sequelize } from "sequelize";
import {
  logMessage,
  uploadBufferToAzureBlob,
  downloadBufferFromAzureBlob,
} from "../../utils/helpers";
import { rawQueries } from "../../utils/constants";

// South Carolina SC SCH.TC-18 -- Research Expenses Credit
//
// Single page form (612 x 792 pts), 10 lines.
// Value entry area: after the "$" sign at x=486.5, right-aligned to x=574.
//
// computed_fields structure (from RdCreditCalculatorForSC.buildComputedFields):
//   computed_fields: {
//     "yesSpilt": {
//       "[1] Qualified research expenses...": number,
//       "[2] Enter 5% of line 1...":          number,   // dynamic key
//       "[3] Research Expenses Credit...":    number,
//       ...
//       "[10] Line 4 minus line 9...":        number
//     }
//   }
//
// Usage from processStateForms in rdFormMapperService.ts:
//
//   import { processSouthCarolinaForm } from "./stateForms/scSchTC18Generator";
//
//   if (resolvedStateCode === "SC") {
//     const url = await processSouthCarolinaForm(
//       caseRid, schemaName, accountNumber, formInfo.browse_file, orgDb,
//     );
//     await this.rdFormMapperSchemaService.saveStateFilledFormUrl(
//       caseRid, state, url, orgDb, accountNumber,
//     );
//     continue;
//   }

// --- Types -------------------------------------------------------------------

interface SCSchTC18Data {
  // Header
  corporationName: string;
  fein: string;

  // Lines 1-10
  line1_qualifiedResearchExpenses: number;
  line2_currentYearCredit: number;       // line1 * credit_pct (dynamic)
  line3_carryforward: number;
  line4_totalBeforeLimitations: number;
  line5_taxLiability: number;
  line6_otherCredits: number;
  line7_line5MinusLine6: number;
  line8_50pctOfLine7: number;            // line7 * 50% (dynamic)
  line9_lesserLine4orLine8: number;
  line10_unusedCredit: number;
}

// --- Formatting helpers ------------------------------------------------------

const fmtCurrency = (v: number): string =>
  v ? Math.round(v).toLocaleString("en-US") : "";

// --- Entry point -------------------------------------------------------------

/**
 * Fetch computed R&D data for the SC case, overlay onto SC SCH.TC-18 template,
 * upload to Azure Blob, and return the blob URL.
 */
export async function processSouthCarolinaForm(
  caseRid: string,
  schemaName: string,
  accountNumber: string,
  templateBlobUrl: string,
  orgDb: Sequelize,
  stateCode: string,
  countryCode: string
): Promise<string> {
  logMessage(`[SC TC-18] Starting form generation for case: ${caseRid}`);

  // 1. Fetch case row
  const [caseRow]: any[] = await orgDb.query(
    rawQueries.fetchCaseById(schemaName),
    { replacements: { caseId: caseRid }, type: QueryTypes.SELECT },
  );
  if (!caseRow) throw new Error(`[SC TC-18] Case not found: ${caseRid}`);

  // 2. Fetch computation result
  const [calcRow]: any[] = await orgDb.query(
    rawQueries.fetchCountryCalculationForCase(schemaName),
    { replacements: { caseRid }, type: QueryTypes.SELECT },
  );
  if (!calcRow)
    throw new Error(`[SC TC-18] No calculation row found for case: ${caseRid}`);

  const rootCf: Record<string, any> =
    typeof calcRow.computed_fields === "string"
      ? JSON.parse(calcRow.computed_fields)
      : (calcRow.computed_fields ?? {});

  // computed_fields may be one level nested
  const outer: Record<string, any> = rootCf["computed_fields"] ?? rootCf;

  // SC calculator stores all 10 lines under the "yesSpilt" key
  const cf: Record<string, any> = outer["yesSpilt"] ?? outer;

  const num = (v: any): number => {
    if (v === null || v === undefined || v === "-" || v === "") return 0;
    if (typeof v === "number") return v;
    return parseFloat(String(v).replace(/,/g, "")) || 0;
  };

  // Lines 2 and 8 have dynamic keys (embed config percentages)
  // Use startsWith match to find them regardless of exact config value
  const findKey = (prefix: string): number => {
    const key = Object.keys(cf).find(k => k.startsWith(prefix));
    return key ? num(cf[key]) : 0;
  };

  // 3. Map to form data
  const data: SCSchTC18Data = {
    corporationName: String(caseRow.client_name ?? ""),
    fein:            String(caseRow.federal_id ?? caseRow.ein ?? ""),

    line1_qualifiedResearchExpenses: num(cf["[1] Qualified research expenses made in South Carolina."]),
    line2_currentYearCredit:         findKey("[2]"),
    line3_carryforward:              num(cf["[3] Research Expenses Credit Carried forward from previous years (attach schedule)."]),
    line4_totalBeforeLimitations:    num(cf["[4] Line 2 plus line 3 (Total Research Expenses Credit before limitations)."]),
    line5_taxLiability:              num(cf["[5] Tax Liability (income tax and license fees) before claiming credits."]),
    line6_otherCredits:              num(cf["[6] Total of all credits other than the Research Expenses Credit"]),
    line7_line5MinusLine6:           num(cf["[7] Line 5 minus line 6 (If less than zero enter zero)."]),
    line8_50pctOfLine7:              findKey("[8]"),
    line9_lesserLine4orLine8:        num(cf["[9] Enter the lesser of line 4 or line 8. (This is the amount of Research Expenses Credit you may use this year.)"]),
    line10_unusedCredit:             num(cf["[10] Line 4 minus line 9. (Unused Research Expenses Credit can be carried forward for up to 10 years.)"]),
  };

  // 4. Generate and upload
  return generatePdf(data, caseRid, accountNumber, templateBlobUrl,stateCode,countryCode);
}

// --- PDF generator (private) -------------------------------------------------

async function generatePdf(
  data: SCSchTC18Data,
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
    throw new Error("[SC TC-18] Invalid template blob URL -- container not found");

  const blobName = decodeURIComponent(pathParts.slice(1).join("/"));
  logMessage(`[SC TC-18] Downloading template: blob=${blobName}`);

  const pdfBytes = await downloadBufferFromAzureBlob(container, blobName);
  const pdfDoc   = await PDFDocument.load(pdfBytes);
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages    = pdfDoc.getPages();
  const page     = pages[0];

  // --- Coordinate system ---------------------------------------------------
  // pdfplumber: top-origin.   pdf-lib: bottom-origin.
  //   y_pdf = PAGE_H - label_top - FONT_SIZE
  //
  // Value entry: right-aligned inside x=[494, 574], vertically at label_top.
  // Header "Name" field: baseline at top=96.0 underline -> draw at top~108
  // Header "SSN or FEIN" field: same baseline, x starts ~500
  // Pass-through entity: top~123.5 underline -> draw at top~137

  const PAGE_H    = 792;
  const FONT_SIZE = 9;
  const VALUE_RIGHT_X = 574;  // right edge of value entry area

  const drawLeft = (text: string, x: number, top: number, size = FONT_SIZE, bold = false) => {
    if (!text?.trim()) return;
    page.drawText(text, {
      x,
      y: PAGE_H - top - size,
      size,
      font: bold ? fontBold : font,
      color: rgb(0, 0, 0),
    });
  };

  const drawRight = (text: string, top: number, size = FONT_SIZE) => {
    if (!text?.trim()) return;
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: VALUE_RIGHT_X - textWidth,
      y: PAGE_H - top - size,
      size,
      font,
      color: rgb(0, 0, 0),
    });
  };

  // --- Header ---------------------------------------------------------------
  // Name field: underline at top=96.0, draw text just above it
  drawLeft(data.corporationName, 36,  107);
  // FEIN field: underline at top=92.4 (shorter line), draw text above it
  drawLeft(data.fein,            501, 104);

  // --- Lines 1-10 -----------------------------------------------------------
  // label_top values from pdfplumber right-side line number labels ("1.", "2."...)
  // Each row's $ sign is at x=486.5; value is right-aligned to x=574
  //
  //  Line  label_top
  //   1     161.8
  //   2     185.8
  //   3     209.8
  //   4     233.8
  //   5     257.8
  //   6     281.8
  //   7     305.8
  //   8     329.8
  //   9     353.8
  //  10     389.8

  drawRight(fmtCurrency(data.line1_qualifiedResearchExpenses), 161.8);
  drawRight(fmtCurrency(data.line2_currentYearCredit),         185.8);
  drawRight(fmtCurrency(data.line3_carryforward),              209.8);
  drawRight(fmtCurrency(data.line4_totalBeforeLimitations),    233.8);
  drawRight(fmtCurrency(data.line5_taxLiability),              257.8);
  drawRight(fmtCurrency(data.line6_otherCredits),              281.8);
  drawRight(fmtCurrency(data.line7_line5MinusLine6),           305.8);
  drawRight(fmtCurrency(data.line8_50pctOfLine7),              329.8);
  drawRight(fmtCurrency(data.line9_lesserLine4orLine8),        353.8);
  drawRight(fmtCurrency(data.line10_unusedCredit),             389.8);

  // --- Serialize and upload -------------------------------------------------
  const pdfBuffer = Buffer.from(await pdfDoc.save());
  const outputFileName = `rd_form_${countryCode}${stateCode}.pdf`;
  const outputBlobName = `cases/${caseRid}/rdForms/${outputFileName}`;

  const blobUrl   = await uploadBufferToAzureBlob(pdfBuffer, outputBlobName, accountNumber);

  logMessage(`[SC TC-18] Filled PDF uploaded: ${blobUrl}`);
  return blobUrl;
}
