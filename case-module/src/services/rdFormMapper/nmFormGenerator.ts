import { QueryTypes, Sequelize } from "sequelize";
import {
  logMessage,
  uploadBufferToAzureBlob,
  downloadBufferFromAzureBlob,
} from "../../utils/helpers";
import { rawQueries } from "../../utils/constants";

// New Mexico RPD-41385 — Application For Technology Jobs and
//                        Research and Development Tax Credit
//
// Two active pages (612 x 792 pts). Pages 3–6 are instruction/reference only.
//
// ── Page 1 ────────────────────────────────────────────────────────────────
// Section I  — Business header fields (rows defined by horizontal grid lines)
// Section II — Calendar year, Line 1 (research description), Line 2 checkbox,
//              Lines 3–7, Line 8 checkbox, Line 9
//
// Value entry column: after the printed "$" at x=445.1; values left-aligned
// at x=453 and right-aligned to x=576 (right margin).
//
// ── Page 2 ────────────────────────────────────────────────────────────────
// Section III — 10 Yes/No questions (checkboxes)
// Section IV  — Signature block (Printed Name, Title, Signature, Date)
//
// ── Coordinate system ─────────────────────────────────────────────────────
// pdfplumber: top-origin (y=0 at top, increases downward).
// pdf-lib:    bottom-origin (y=0 at bottom, increases upward).
//   pdf_lib_y = PAGE_H - pdfplumber_top - FONT_SIZE
//
// All "top" values below come directly from pdfplumber measurements.
//
// ── Section I grid layout ─────────────────────────────────────────────────
// Rows (pdfplumber top of label text → used for entry y):
//   Row 1 (Name/FEIN/NMBTIN):        label_top=157.8,  entry_y ≈ 174 (mid-cell)
//   Row 2 (Phys Addr/City/State/ZIP): label_top=190.9,  entry_y ≈ 207
//   Row 3 (Mailing/City/State/ZIP):  label_top=222.9,  entry_y ≈ 239
//   Row 4 (Contact/Phone/Email):     label_top=254.3,  entry_y ≈ 270
// Column x starts (left-aligned inside cell):
//   Col 1: x=39   [x0=35.7  → x1=306]
//   Col 2: x=309  [x0=306   → x1=441.1]
//   Col 3: x=444  [x0=441.1 → x1=508.7]
//   Col 4: x=512  [x0=508.7 → x1=576.2]
//
// ── Section II value entries ───────────────────────────────────────────────
// Calendar year "20XX": left-aligned at x=254.3, pdfplumber top=300.7
// Line 3 $: pdfplumber top=435.7  → right-aligned to x=572
// Line 4 $: pdfplumber top=462.3  → right-aligned to x=572
// Line 5 $: pdfplumber top=488.8  → right-aligned to x=572
// Line 6 $: pdfplumber top=515.9  → right-aligned to x=572
// Line 7 $: pdfplumber top=542.1  → right-aligned to x=572
// Line 9 $: pdfplumber top=663.5  → right-aligned to x=572
//
// Checkbox 2 (rural area): printed "q" at x=39.7, pdfplumber top=409.1
// Checkbox 8 (small biz):  printed "q" at x=39.7, pdfplumber top=561.5
//
// ── Section III Yes/No checkboxes (page 2) ────────────────────────────────
// "q" (Yes box) at x=497.0; "q" (No box) at x=538.8
// Per-row pdfplumber top values (from the "q" character):
//   Q1=119.7  Q2=152.8  Q3=185.9  Q4=219.1  Q5=252.2
//   Q6=285.3  Q7=318.4  Q8=351.5  Q9=384.7  Q10=422.8
//
// ── Section IV signature block (page 2) ───────────────────────────────────
//   Printed Name: label top=520.2, entry at x=39, y≈537
//   Title:        label top=520.2, entry at x=377, y≈537
//   Signature:    label top=553.3, entry at x=39, y≈570
//   Date:         label top=553.3, entry at x=377, y≈570

// --- Types -------------------------------------------------------------------

/** Answers for Section III Yes/No questions (true = Yes, false = No, null = unanswered) */
type YesNo = boolean | null;

interface NMFormData {
  // Section I — Business identification
  nameOfBusiness: string;
  feinSsn: string;
  nmbtin: string;
  physicalAddress: string;
  physicalCity: string;
  physicalState: string;
  physicalZip: string;
  mailingAddress: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  contactName: string;
  phoneNumber: string;
  emailAddress: string;

  // Section II — Credit computation
  calendarYear: string;           // last 2 digits, e.g. "23"
  line1_qualifiedResearchDesc: string;  // free-text description (Line 1)
  line2_ruralArea: boolean;       // check Line 2 box if rural facility
  line3_qualifiedExpenditures: number;
  line4_basicCredit: number;
  line5_ruralBasicCredit: number;
  line6_additionalCredit: number;
  line7_ruralAdditionalCredit: number;
  line8_smallBusiness: boolean;   // check Line 8 box if qualified small business
  line9_totalCredit: number;

  // Section III — Qualifying questions (Yes/No)
  // true = Yes, false = No, null = skip (leave blank)
  s3q1_connectedToQualifiedResearch: YesNo;
  s3q2_municipalityIRB: YesNo;
  s3q3_investmentTaxCreditClaimed: YesNo;
  s3q4_ownedBeforeJuly2000: YesNo;
  s3q5_reimbursedByNonAffiliate: YesNo;
  s3q6_contractForNonAffiliate: YesNo;
  s3q7_retainRights: YesNo;
  s3q8_allocatedDepreciation: YesNo;
  s3q9_sameAllocationMethodology: YesNo;
  s3q10_usefulInNewImprovedComponent: YesNo;

  // Section IV — Signature block
  printedName: string;
  title: string;
  signatureDate: string;          // e.g. "12/31/2023"
}

// --- Formatting helpers ------------------------------------------------------

const fmtCurrency = (v: number | null | undefined): string => {
  if (v === null || v === undefined || v === 0) return "";
  return Math.round(v).toLocaleString("en-US");
};

// --- Entry point -------------------------------------------------------------

/**
 * Fetch computed R&D data for the NM case, overlay onto RPD-41385 template,
 * upload to Azure Blob, and return the blob URL.
 */
export async function processNewMexicoForm(
  caseRid: string,
  schemaName: string,
  accountNumber: string,
  templateBlobUrl: string,
  orgDb: Sequelize,
  stateRid: string,
  stateCode: string,
  countryCode: string
): Promise<string> {
  logMessage(`[NM RPD-41385] Starting form generation for case: ${caseRid}`);

  // 1. Fetch case row
  const [caseRow]: any[] = await orgDb.query(
    rawQueries.fetchCaseById(schemaName),
    { replacements: { caseId: caseRid }, type: QueryTypes.SELECT },
  );
  if (!caseRow) throw new Error(`[NM RPD-41385] Case not found: ${caseRid}`);

  // 2. Fetch computation result
  const [calcRow]: any[] = await orgDb.query(
    rawQueries.fetchStateCalculationForCase(schemaName),
    { replacements: { caseRid ,stateRid}, type: QueryTypes.SELECT },
  );
  if (!calcRow)
    throw new Error(`[NM RPD-41385] No calculation row found for case: ${caseRid}`);

  const rootCf: Record<string, any> =
    typeof calcRow.computed_fields === "string"
      ? JSON.parse(calcRow.computed_fields)
      : (calcRow.computed_fields ?? {});

  // NM calculator stores data under "newMexico" key as a two-element array:
  //   [0] = Column A  →  QRE amounts (line4Qre, line5Qre, etc.)
  //   [1] = Column B  →  Credit amounts (line4Credit, line5Credit, etc.)
  const outer: Record<string, any>   = rootCf["computed_fields"] ?? rootCf;
  const nmArray: any[]               = outer["newMexico"] ?? [];
  const colA: Record<string, any>    = nmArray[0] ?? {};   // Qualified Expenditures
  const colB: Record<string, any>    = nmArray[1] ?? {};   // Credit amounts

  const num = (v: any): number => {
    if (v === null || v === undefined || v === "-" || v === "") return 0;
    if (typeof v === "number") return v;
    return parseFloat(String(v).replace(/,/g, "")) || 0;
  };

  // Prefix-match helper for dynamic keys (keys embed config percentage)
  const findKey = (obj: Record<string, any>, prefix: string): number => {
    const key = Object.keys(obj).find(k => k.startsWith(prefix));
    return key ? num(obj[key]) : 0;
  };

  // Derive calendar year from fiscal year field (last 2 digits)
  const fiscalYear: string = String(calcRow.fiscal_year_ended ?? caseRow.fiscal_year_ended ?? "");
  const calYear2 = fiscalYear.length >= 4 ? fiscalYear.slice(2, 4) : fiscalYear.slice(-2);

  // 3. Map to form data
  const data: NMFormData = {
    // Section I — populated from case row
    nameOfBusiness:  String(caseRow.client_name                    ?? ""),
    feinSsn:         String(caseRow.federal_id ?? caseRow.ein      ?? ""),
    nmbtin:          String(caseRow.nm_business_tax_id ?? caseRow.nmbtin ?? ""),
    physicalAddress: String(caseRow.nm_physical_address            ?? caseRow.address ?? ""),
    physicalCity:    String(caseRow.nm_physical_city               ?? caseRow.city    ?? ""),
    physicalState:   String(caseRow.nm_physical_state              ?? "NM"),
    physicalZip:     String(caseRow.nm_physical_zip                ?? caseRow.zip     ?? ""),
    mailingAddress:  String(caseRow.nm_mailing_address             ?? caseRow.address ?? ""),
    mailingCity:     String(caseRow.nm_mailing_city                ?? caseRow.city    ?? ""),
    mailingState:    String(caseRow.nm_mailing_state               ?? "NM"),
    mailingZip:      String(caseRow.nm_mailing_zip                 ?? caseRow.zip     ?? ""),
    contactName:     String(caseRow.nm_contact_name                ?? caseRow.contact_name ?? ""),
    phoneNumber:     String(caseRow.nm_phone_number                ?? caseRow.phone   ?? ""),
    emailAddress:    String(caseRow.nm_email_address               ?? caseRow.email   ?? ""),

    // Section II
    calendarYear:   calYear2,
    line1_qualifiedResearchDesc: String(caseRow.nm_research_description ?? ""),
    line2_ruralArea: Boolean(caseRow.nm_rural_area ?? false),

    // Line 3: Total Qualified Expenditures (informational — from column A)
    line3_qualifiedExpenditures: findKey(colA, ""),

    // Lines 4–7: Credit amounts from column B
    line4_basicCredit:
      findKey(colB, "[4] Basic Technology Jobs and Research and Development Tax Credit."),
    line5_ruralBasicCredit:
      findKey(colB, "[5] Rural Area Basic Technology"),
    line6_additionalCredit:
      findKey(colB, "[6] Additional Technology"),
    line7_ruralAdditionalCredit:
      findKey(colB, "[7] Rural Area Additional Technology"),

    line8_smallBusiness: Boolean(caseRow.nm_small_business ?? false),

    // Line 9: Total credit
    line9_totalCredit:
      num(colB["[9] Total Technology Jobs and Research and Development Tax Credit. Add lines 4,5, 6, and 7,enter total here"]),

    // Section III — default to standard qualifying answers
    // Typical credit-qualifying answers: Yes for 1,7,9,10; No for 2,3,4,5,6,8
    s3q1_connectedToQualifiedResearch:  Boolean(caseRow.nm_s3q1  ?? true),
    s3q2_municipalityIRB:               Boolean(caseRow.nm_s3q2  ?? false),
    s3q3_investmentTaxCreditClaimed:    Boolean(caseRow.nm_s3q3  ?? false),
    s3q4_ownedBeforeJuly2000:           Boolean(caseRow.nm_s3q4  ?? false),
    s3q5_reimbursedByNonAffiliate:      Boolean(caseRow.nm_s3q5  ?? false),
    s3q6_contractForNonAffiliate:       Boolean(caseRow.nm_s3q6  ?? false),
    s3q7_retainRights:                  Boolean(caseRow.nm_s3q7  ?? true),
    s3q8_allocatedDepreciation:         Boolean(caseRow.nm_s3q8  ?? false),
    s3q9_sameAllocationMethodology:     Boolean(caseRow.nm_s3q9  ?? true),
    s3q10_usefulInNewImprovedComponent: Boolean(caseRow.nm_s3q10 ?? true),

    // Section IV
    printedName:    String(caseRow.nm_printed_name ?? caseRow.contact_name ?? ""),
    title:          String(caseRow.nm_title        ?? ""),
    signatureDate:  String(caseRow.nm_signature_date ?? ""),
  };

  // 4. Generate and upload
  return generatePdf(data, caseRid, accountNumber, templateBlobUrl, stateCode, countryCode);
}

// --- PDF generator (private) -------------------------------------------------

async function generatePdf(
  data: NMFormData,
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
    throw new Error("[NM RPD-41385] Invalid template blob URL — container not found");

  const blobName = decodeURIComponent(pathParts.slice(1).join("/"));
  logMessage(`[NM RPD-41385] Downloading template: blob=${blobName}`);

  const pdfBytes = await downloadBufferFromAzureBlob(container, blobName);
  const pdfDoc   = await PDFDocument.load(pdfBytes);
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages    = pdfDoc.getPages();

  // ── Coordinate system ────────────────────────────────────────────────────
  // All pdfplumber "top" values → pdf-lib y:
  //   y_pdllib = PAGE_H - top - FONT_SIZE
  //
  // Value right-align edge: VALUE_RIGHT_X = 572 (inside the $-column box)
  // $ sign printed at x=445.1 → entry text starts at x=453

  const PAGE_H        = 792;
  const FONT_SIZE     = 9;
  const VALUE_RIGHT_X = 572;   // right edge for currency values (right of $ column)
  const CHECK_FONT    = 10;    // slightly larger X for checkbox marks

  const page1 = pages[0];
  const page2 = pages[1];

  /** Draw text left-aligned at a given (x, pdfplumber_top). */
  const drawLeft = (
    page: any,
    text: string,
    x: number,
    top: number,
    size = FONT_SIZE,
  ) => {
    if (!text?.trim()) return;
    page.drawText(text, {
      x,
      y: PAGE_H - top - size,
      size,
      font,
      color: rgb(0, 0, 0),
    });
  };

  /** Draw text right-aligned to VALUE_RIGHT_X at a given pdfplumber_top. */
  const drawRight = (
    page: any,
    text: string,
    top: number,
    size = FONT_SIZE,
  ) => {
    if (!text?.trim()) return;
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: VALUE_RIGHT_X - w,
      y: PAGE_H - top - size,
      size,
      font,
      color: rgb(0, 0, 0),
    });
  };

  /**
   * Draw "X" inside a checkbox.
   * @param page    pdf-lib page
   * @param x       pdfplumber x0 of the "q" checkbox glyph
   * @param top     pdfplumber top of the "q" glyph
   */
  const drawCheck = (page: any, x: number, top: number) => {
    page.drawText("X", {
      x: x + 1,
      y: PAGE_H - top - CHECK_FONT + 1,
      size: CHECK_FONT,
      font,
      color: rgb(0, 0, 0),
    });
  };

  // ── Page 1: Section I — Business Identification ──────────────────────────
  //
  // Grid rows (vertical center of each cell, for text placement):
  //   Row 1 (Name/FEIN/NMBTIN):      label_top=157.8  → entry at top≈168 (mid-cell ≈172)
  //   Row 2 (Phys Addr/City/St/ZIP): label_top=190.9  → entry at top≈201
  //   Row 3 (Mailing/City/St/ZIP):   label_top=222.9  → entry at top≈234
  //   Row 4 (Contact/Phone/Email):   label_top=254.3  → entry at top≈265
  //
  // Column x positions (left edge of text inside cell, 3pt margin):
  //   Col 1 [35.7–306]:   x = 39
  //   Col 2 [306–441.1]:  x = 309
  //   Col 3 [441.1–508.7]:x = 444
  //   Col 4 [508.7–576.2]:x = 512

  // Row 1
  drawLeft(page1, data.nameOfBusiness,  39,  172);
  drawLeft(page1, data.feinSsn,         309, 172);
  drawLeft(page1, data.nmbtin,          444, 172);

  // Row 2 — Physical Address
  drawLeft(page1, data.physicalAddress, 39,  204);
  drawLeft(page1, data.physicalCity,    309, 204);
  drawLeft(page1, data.physicalState,   444, 204);
  drawLeft(page1, data.physicalZip,     512, 204);

  // Row 3 — Mailing Address
  drawLeft(page1, data.mailingAddress,  39,  236);
  drawLeft(page1, data.mailingCity,     309, 236);
  drawLeft(page1, data.mailingState,    444, 236);
  drawLeft(page1, data.mailingZip,      512, 236);

  // Row 4 — Contact Person
  drawLeft(page1, data.contactName,     39,  268);
  drawLeft(page1, data.phoneNumber,     309, 268);
  drawLeft(page1, data.emailAddress,    444, 268);

  // ── Page 1: Section II — Calendar Year ───────────────────────────────────
  //
  // "20_____" printed at x=254.3, top=300.7
  // The underscores occupy x≈275–293; write the 2-digit year over them at x=275.

  drawLeft(page1, data.calendarYear,    275, 300.7);

  // ── Page 1: Section II — Line 1 (Qualified Research Description) ─────────
  //
  // Large free-text area: top≈316.3 to ~409.1 (before Line 2 checkbox).
  // Write description starting at top of the cell with a small indent.
  // Long descriptions will overflow — truncate to first 3 lines here;
  // full narrative should be in the attached schedule.

  if (data.line1_qualifiedResearchDesc) {
    const MAX_LINE_WIDTH = 510; // pts (full width minus margins)
    const words          = data.line1_qualifiedResearchDesc.split(" ");
    let line             = "";
    let lineTop          = 328.0; // first text line inside Line 1 box
    const LINE_HEIGHT    = 12;

    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, FONT_SIZE) > MAX_LINE_WIDTH) {
        if (lineTop < 405) {          // stay inside the box (ends ~409)
          drawLeft(page1, line, 57, lineTop);
          lineTop += LINE_HEIGHT;
        }
        line = word;
      } else {
        line = test;
      }
    }
    if (line && lineTop < 405) {
      drawLeft(page1, line, 57, lineTop);
    }
  }

  // ── Page 1: Section II — Line 2 checkbox (Rural Area) ────────────────────
  //
  // "q" checkbox square at x=39.7, top=409.1
  // Only check if this is a rural area facility.

  if (data.line2_ruralArea) {
    drawCheck(page1, 39.7, 409.1);
  }

  // ── Page 1: Section II — Lines 3–7 and 9 ($ value entries) ──────────────
  //
  //  Line  |  pdfplumber top  |  Notes
  //  ──────┼──────────────────┼──────────────────────────────────────────────
  //   3    |    435.7         |  Qualified Expenditures (informational total)
  //   4    |    462.3         |  Basic credit = QRE × 5%
  //   5    |    488.8         |  Rural basic = rural QRE × 5%
  //   6    |    515.9         |  Additional credit = QRE × 5%
  //   7    |    542.1         |  Rural additional = rural QRE × 5%
  //   9    |    663.5         |  Total (lines 4+5+6+7)

  drawRight(page1, fmtCurrency(data.line3_qualifiedExpenditures),  435.7);
  drawRight(page1, fmtCurrency(data.line4_basicCredit),            462.3);
  drawRight(page1, fmtCurrency(data.line5_ruralBasicCredit),       488.8);
  drawRight(page1, fmtCurrency(data.line6_additionalCredit),       515.9);
  drawRight(page1, fmtCurrency(data.line7_ruralAdditionalCredit),  542.1);
  drawRight(page1, fmtCurrency(data.line9_totalCredit),            663.5);

  // ── Page 1: Section II — Line 8 checkbox (Small Business) ────────────────
  //
  // "q" checkbox square at x=39.7, top=561.5
  // Only check if taxpayer is a qualified R&D small business.

  if (data.line8_smallBusiness) {
    drawCheck(page1, 39.7, 561.5);
  }

  // ── Page 2: Section III — Yes/No Questions ───────────────────────────────
  //
  // Two checkbox squares per row:
  //   Yes "q" at x=497.0   No "q" at x=538.8
  //
  // pdfplumber top values per question:
  //   Q1=119.7  Q2=152.8  Q3=185.9  Q4=219.1  Q5=252.2
  //   Q6=285.3  Q7=318.4  Q8=351.5  Q9=384.7  Q10=422.8

  const YES_X = 497.0;
  const NO_X  = 538.8;

  const s3Questions: { answer: boolean | null; top: number }[] = [
    { answer: data.s3q1_connectedToQualifiedResearch,  top: 119.7 },
    { answer: data.s3q2_municipalityIRB,               top: 152.8 },
    { answer: data.s3q3_investmentTaxCreditClaimed,    top: 185.9 },
    { answer: data.s3q4_ownedBeforeJuly2000,           top: 219.1 },
    { answer: data.s3q5_reimbursedByNonAffiliate,      top: 252.2 },
    { answer: data.s3q6_contractForNonAffiliate,       top: 285.3 },
    { answer: data.s3q7_retainRights,                  top: 318.4 },
    { answer: data.s3q8_allocatedDepreciation,         top: 351.5 },
    { answer: data.s3q9_sameAllocationMethodology,     top: 384.7 },
    { answer: data.s3q10_usefulInNewImprovedComponent, top: 422.8 },
  ];

  for (const { answer, top } of s3Questions) {
    if (answer === true)  drawCheck(page2, YES_X, top);
    if (answer === false) drawCheck(page2, NO_X,  top);
    // null → leave blank
  }

  // ── Page 2: Section IV — Signature Block ─────────────────────────────────
  //
  //  Field          |  x   |  pdfplumber top  |  Notes
  //  ───────────────┼──────┼──────────────────┼────────────────────────────
  //  Printed Name   |  39  |    530           |  entry row below "Printed Name" label (top=520.2)
  //  Title          |  377 |    530           |  same row, right column
  //  Signature      |  39  |    563           |  entry row below "Signature" label (top=553.3)
  //  Date           |  377 |    563           |  same row, right column

  drawLeft(page2, data.printedName,    39,  530);
  drawLeft(page2, data.title,          377, 530);
  // Signature is intentionally left blank (cannot be digitally signed here)
  drawLeft(page2, data.signatureDate,  377, 563);

  // ── Serialize and upload ──────────────────────────────────────────────────
  const pdfBuffer      = Buffer.from(await pdfDoc.save());

  const outputFileName = `rd_form_${countryCode}${stateCode}.pdf`;
  const outputBlobName = `cases/${caseRid}/rdForms/${outputFileName}`;
  const blobUrl = await uploadBufferToAzureBlob(pdfBuffer, outputBlobName, accountNumber);

  logMessage(`[NM RPD-41385] Filled PDF uploaded: ${blobUrl}`);
  return blobUrl;
}
