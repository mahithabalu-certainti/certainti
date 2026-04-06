import { QueryTypes, Sequelize } from "sequelize";
import {
  logMessage,
  uploadBufferToAzureBlob,
  downloadBufferFromAzureBlob,
} from "../../utils/helpers";
import { rawQueries } from "../../utils/constants";
import path from "path";
import fs from "fs";

// Massachusetts Schedule RC -- Research Credit (2024)
//
// Form layout (2 pages, 594 x 783 pts each):
//   Page 1 -- Header + Part 1 (lines 1-6) + Part 2 (lines 7-13)
//   Page 2 -- Part 3 (lines 14-22) + Part 4 (lines 23-29)
//
// Each value field is a row of individual digit boxes (12.5 pts wide each).
// Characters are placed one-per-box, right-aligned, centred within each box.
// Box positions measured from blank PDF via pdfplumber rect extraction.
//
// Usage from processStateForms in rdFormMapperService.ts:
//
//   import { processMassachusettsForm } from "./stateForms/maScheduleRcGenerator";
//
//   if (resolvedStateCode === "MA") {
//     const url = await processMassachusettsForm(
//       caseRid, schemaName, accountNumber, formInfo.browse_file, orgDb,
//     );
//     await this.rdFormMapperSchemaService.saveStateFilledFormUrl(
//       caseRid, state, url, orgDb, accountNumber,
//     );
//     continue;
//   }

// --- Types -------------------------------------------------------------------

interface MAScheduleRCData {
  corporationName: string;
  federalId: string;

  // Election checkboxes
  electDefenseRelated?: boolean;
  electAlternateSimplified?: boolean;
  electMassGrossReceipts?: boolean;
  noQreInPriorThreeYears?: boolean;

  // Part 1
  line1_qualifiedWages: number;
  line2_qualifiedSupply: number;
  line3_qualifiedComputerRental: number;
  line4_qualifiedContract65pct: number;
  line5_totalQreCorp: number;
  line6_totalQreGroup: number;

  // Part 2 -- Alternate Simplified Method
  line7_avgQrePrior3Yrs?: number;
  line8_50pctOfLine7?: number;
  line9_line6MinusLine8?: number;
  line10_applicableRate?: number;    // stored as decimal e.g. 0.10
  line11_totalCreditGroup: number;
  line12_pctGroupCreditCorp: number; // stored as decimal e.g. 1.0
  line13_amtGroupCreditCorp: number;

  // Part 3 -- Standard Method 38M(a)
  line14_fixedBaseRatio: number;     // stored as decimal e.g. 0.16
  line15_avgAnnualGrossReceipts4Yrs: number;
  line16_baseAmount: number;
  line17_line6MinusLine16: number;
  line18_totalGroupCreditQre: number;
  line19_totalGroupCreditBasicResearch: number;
  line20_totalResearchCreditGroup: number;
  line21_pctGroupCreditCorp: number; // stored as decimal e.g. 1.0
  line22_amtCreditCorp: number;

  // Part 4 -- Credit Used (excise lines)
  line23_totalExciseBeforeCredits: number;
  line24_totalAggGroupExcise: number;
  line25_allocationPct: number;      // stored as decimal e.g. 1.0
  line26_corpShareExciseNotSubjectTo75: number;
  line27_corpExciseSubjectTo75: number;
  line28_75pctOfLine27: number;
  line29_corpSubtotalExcise: number;
}

// --- Box layout constants ----------------------------------------------------
//
// Each row of digit boxes was measured from the blank PDF using pdfplumber.
// BOX_W = 12.5 pts on both pages.
// Page 1 rightmost x1 = 576.5  |  Page 2 rightmost x1 = 560.5
//
// Row descriptor: [boxTop, boxCount, leftmostX0, rightmostX1]
// Boxes always start from rightmostX1 and extend left.

const BOX_W = 12.5;

// Page 1 rows  (box top -> [count, leftmost x0, rightmost x1])
const P1_ROWS: Record<number, [number, number, number]> = {
  214.5: [8, 476.5, 576.5],  // line 1
  236.5: [8, 476.5, 576.5],  // line 2
  258.5: [8, 476.5, 576.5],  // line 3
  280.5: [8, 476.5, 576.5],  // line 4
  302.5: [8, 476.5, 576.5],  // line 5
  324.5: [8, 476.5, 576.5],  // line 6
  394.5: [8, 476.5, 576.5],  // line 7
  416.5: [8, 476.5, 576.5],  // line 8
  438.5: [8, 476.5, 576.5],  // line 9
  460.5: [7, 489.0, 576.5],  // line 10 (7 boxes -- percent field)
  493.5: [8, 476.5, 576.5],  // line 11
  515.5: [7, 489.0, 576.5],  // line 12 (7 boxes -- percent field)
  537.5: [8, 476.5, 576.5],  // line 13
};

// Page 2 rows
const P2_ROWS: Record<number, [number, number, number]> = {
   82.0: [7, 473.0, 560.5],  // line 14 (ratio -- 7 boxes)
  104.0: [8, 460.5, 560.5],  // line 15
  126.0: [8, 460.5, 560.5],  // line 16
  148.0: [8, 460.5, 560.5],  // line 17
  170.0: [8, 460.5, 560.5],  // line 18
  192.0: [8, 460.5, 560.5],  // line 19
  214.0: [8, 460.5, 560.5],  // line 20
  236.0: [7, 473.0, 560.5],  // line 21 (7 boxes -- percent field)
  258.0: [8, 460.5, 560.5],  // line 22
  395.0: [8, 460.5, 560.5],  // line 23
  428.0: [8, 460.5, 560.5],  // line 24
  461.0: [7, 473.0, 560.5],  // line 25 (allocation pct -- 7 boxes)
  494.0: [7, 472.0, 560.5],  // line 26 (7 boxes)
  516.0: [8, 460.5, 560.5],  // line 27
  538.0: [8, 460.5, 560.5],  // line 28
  560.0: [8, 460.5, 560.5],  // line 29
};

// --- Formatting helpers ------------------------------------------------------

// Dollar amounts -- strip decimals for whole numbers, keep 2dp for cents
const fmtCurrency = (v: number): string => {
  if (!v) return "";
  return Number.isInteger(v)
    ? v.toLocaleString("en-US")
    : v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Rate fields stored as decimals: 0.10 -> "10.00%"
const fmtPct = (v: number): string =>
  v ? (v * 100).toFixed(2) + "%" : "";

// Ratio/allocation fields: 1.0 -> "1.000000", 0.16 -> "0.160000"
const fmtDecimal = (v: number, decimals = 6): string =>
  v !== 0 ? v.toFixed(decimals) : "";

// --- Entry point -------------------------------------------------------------

/**
 * Fetch computed R&D data for the case, overlay it onto the blank
 * Massachusetts Schedule RC PDF template, and upload to Azure Blob.
 *
 * @returns Blob URL of the filled PDF
 */
export async function processMassachusettsForm(
  caseRid: string,
  schemaName: string,
  accountNumber: string,
  templateBlobUrl: string,
  orgDb: Sequelize,
  stateRid: string
): Promise<string> {
  logMessage(`[MA RC] Starting form generation for case: ${caseRid}`);

  // 1. Fetch case + computed_fields
  const [caseRow]: any[] = await orgDb.query(
    rawQueries.fetchCaseById(schemaName),
    { replacements: { caseId: caseRid }, type: QueryTypes.SELECT },
  );
  if (!caseRow) throw new Error(`[MA RC] Case not found: ${caseRid}`);

  const [calcRow]: any[] = await orgDb.query(
    rawQueries.fetchStateCalculationForCase(schemaName),
    { replacements: { caseRid,stateRid }, type: QueryTypes.SELECT },
  );
  if (!calcRow)
    throw new Error(`[MA RC] No calculation row found for case: ${caseRid}`);

  const rootCf: Record<string, any> =
    typeof calcRow.computed_fields === "string"
      ? JSON.parse(calcRow.computed_fields)
      : (calcRow.computed_fields ?? {});

  // computed_fields may be nested one level deeper
  const cf: Record<string, any> = rootCf["computed_fields"] ?? rootCf;

  // 2. Extract each part section
  const p1 = cf["PART 1. QUALIFIED RESEARCH EXPENSES"] ?? {};
  const p2 = cf["PART 2. CREDIT DETERMINED UNDER c. 63, s. 38M(b), (ALTERNATE SIMPLIFIED METHOD)"] ?? {};
  const p3 = cf["PART 3. CREDIT DETERMINED UNDER c. 63, A. 38M(a)"] ?? {};

  // Parse a value that may be a number or a percent string e.g. "16%" -> 0.16
  const numOrPct = (v: any, fallback = 0): number => {
    if (v === null || v === undefined) return fallback;
    if (typeof v === "number") return v;
    const s = String(v).trim();
    if (s.endsWith("%")) return parseFloat(s) / 100;
    return parseFloat(s) || fallback;
  };

  // 3. Map to form data
  const data: MAScheduleRCData = {
    corporationName: String(caseRow.client_name ?? ""),
    federalId:       String(caseRow.federal_id ?? caseRow.ein ?? ""),

    electDefenseRelated:      false,
    electAlternateSimplified: false,
    electMassGrossReceipts:   false,
    noQreInPriorThreeYears:   false,

    // Part 1
    line1_qualifiedWages:          numOrPct(p1["[1] Qualified wage expenses for this corporation"]),
    line2_qualifiedSupply:         numOrPct(p1["[2] Qualified supply expenses for this corporation"]),
    line3_qualifiedComputerRental: numOrPct(p1["[3] Qualified computer rental time expenses for this corporation"]),
    line4_qualifiedContract65pct:  numOrPct(p1["[4] Enter 65% of qualified contract expenses for this corporation"]),
    line5_totalQreCorp:            numOrPct(p1["[5] Total qualified research expenses for this corporation. Add lines 1 through 4"]),
    line6_totalQreGroup:           numOrPct(p1["[6] Total qualified research expenses for this aggregate group"]),

    // Part 2
    line7_avgQrePrior3Yrs:     numOrPct(p2["[7] Average qualified research expenses for the 3 most recent prior years"]),
    line8_50pctOfLine7:        numOrPct(p2["[8] Enter 50% of line 7"]),
    line9_line6MinusLine8:     numOrPct(p2["[9] Subtract the amount on line 8 from current year expenses on line 6. Not less than 0"]),
    line10_applicableRate:     numOrPct(p2["[10] Applicable rate for Alternative Simplified Method"], 0.10),
    line11_totalCreditGroup:   numOrPct(p2["[11] Total credit for the group. if the taxpayer did not have qualified research expenses in each of the three prior years,enter 5% of the amount on line 6; otherwise, multiply line 9 by line 10"]),
    line12_pctGroupCreditCorp: numOrPct(p2["[12] Percentage of aggregate group credit attributable to this corporation. Line 5 divided by line 6"]),
    line13_amtGroupCreditCorp: numOrPct(p2["[13] Amount of group credit for this corporation. Multiply line 11 by line 12"]),

    // Part 3
    line14_fixedBaseRatio:             numOrPct(p3["[14] Fixed-base ratio (see instructions)"]),
    line15_avgAnnualGrossReceipts4Yrs: numOrPct(p3["[15] Average annual gross receipts from the 4 most recent taxable years"]),
    line16_baseAmount:                 numOrPct(p3["[16] Base amount. Multiply line 14 by line 15. Not less than 16% of line 6"]),
    line17_line6MinusLine16:           numOrPct(p3["[17] Subtract line 16 from current year expenses on line 6. Not less than 0"]),
    line18_totalGroupCreditQre:        numOrPct(p3["[18] Total group credit for qualified research expenses. Multiply line 17 by 10%"]),
    line19_totalGroupCreditBasicResearch: numOrPct(p3["[19] Total group credit for basic research payments (see instructions)"]),
    line20_totalResearchCreditGroup:   numOrPct(p3["[20] Total Research Credit for aggregate group. Combine line 18 and 19"]),
    line21_pctGroupCreditCorp:         numOrPct(p3["[21] Percentage of aggregated group credit attributable to this corporation. Line 5 divided by line 6."]),
    line22_amtCreditCorp:              numOrPct(p3["[22] Amount of credit for this corporation. Multiply line 20 by line 21."]),

    // Part 4 -- not yet in computed_fields; blank until engine adds them
    line23_totalExciseBeforeCredits:      0,
    line24_totalAggGroupExcise:           0,
    line25_allocationPct:                 1,
    line26_corpShareExciseNotSubjectTo75: 0,
    line27_corpExciseSubjectTo75:         0,
    line28_75pctOfLine27:                 0,
    line29_corpSubtotalExcise:            0,
  };

  // 4. Generate and upload PDF
  return _generatePdf(data, caseRid, accountNumber, templateBlobUrl);
}

// --- PDF generator (private to this module) ----------------------------------

async function _generatePdf(
  data: MAScheduleRCData,
  caseRid: string,
  accountNumber: string,
  templateBlobUrl: string,
): Promise<string> {
  const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

  // Download blank template
  const parsedUrl = new URL(templateBlobUrl);
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
  const templateContainer = pathParts[0];
  if (!templateContainer)
    throw new Error("[MA RC] Invalid template blob URL -- container not found");

  const templateBlobName = decodeURIComponent(pathParts.slice(1).join("/"));
  logMessage(`[MA RC] Downloading template: blob=${templateBlobName}`);

  const pdfBytes = await downloadBufferFromAzureBlob(templateContainer, templateBlobName);
  const pdfDoc   = await PDFDocument.load(pdfBytes);
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages    = pdfDoc.getPages();

  if (pages.length < 2)
    throw new Error("[MA RC] Template must have at least 2 pages");

  const PAGE_H    = 783;
  const FONT_SIZE = 9;

  // --- drawBoxed ---------------------------------------------------------------
  // Places each character of `text` centred in its own box, right-aligned.
  // `boxTop`     -- top of the box row (pdfplumber top-origin)
  // `boxCount`   -- number of available boxes in this row
  // `rightmostX1`-- x1 of the rightmost box
  // Characters fill from right to left; leading digits that overflow are dropped.
  const drawBoxed = (
    pageIdx: number,
    text: string,
    boxTop: number,
    boxCount: number,
    rightmostX1: number,
    size = FONT_SIZE,
  ): void => {
    if (!text?.trim()) return;

    // Strip thousands separators for box placement; keep decimals and % as chars
    const chars = text.replace(/,/g, "").split("");

    // Truncate to fit available boxes (keep rightmost chars)
    const visible = chars.length > boxCount
      ? chars.slice(chars.length - boxCount)
      : chars;

    const charW = font.widthOfTextAtSize("0", size); // representative char width
    const y     = PAGE_H - boxTop - size - 1.5;       // slight vertical nudge to centre in box

    visible.forEach((ch, i) => {
      // i=0 is leftmost visible char; place relative to rightmost box
      const offsetFromRight = visible.length - 1 - i;
      const boxX0 = rightmostX1 - (offsetFromRight + 1) * BOX_W;
      // Centre the character horizontally in the box
      const x = boxX0 + (BOX_W - charW) / 2;
      pages[pageIdx].drawText(ch, {
        x,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
      });
    });
  };

  // Convenience: look up box layout and call drawBoxed
  const fillRow = (
    pageIdx: number,
    text: string,
    rowMap: Record<number, [number, number, number]>,
    boxTop: number,
  ): void => {
    const row = rowMap[boxTop];
    if (!row) return;
    const [boxCount, , rightmostX1] = row;
    drawBoxed(pageIdx, text, boxTop, boxCount, rightmostX1);
  };

  // Left-aligned plain text (header fields, corp name)
  const drawLeft = (pageIdx: number, text: string, x: number, top: number, size = FONT_SIZE, bold = false) => {
    if (!text?.trim()) return;
    pages[pageIdx].drawText(text, {
      x,
      y: PAGE_H - top - size,
      size,
      font: bold ? fontBold : font,
      color: rgb(0, 0, 0),
    });
  };

  // Oval checkbox
  const drawOval = (pageIdx: number, checked: boolean | undefined, x: number, top: number) => {
    if (!checked) return;
    pages[pageIdx].drawText("X", {
      x,
      y: PAGE_H - top - 7,
      size: 7,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
  };

  // Auto-compute line 5 if not provided
  const line5 =
    data.line5_totalQreCorp ||
    data.line1_qualifiedWages +
    data.line2_qualifiedSupply +
    data.line3_qualifiedComputerRental +
    data.line4_qualifiedContract65pct;

  // =========================================================================
  // PAGE 1
  // =========================================================================

  // Header -- plain text fields (no boxes)
  drawLeft(0, data.corporationName, 37,  68);
  drawLeft(0, data.federalId,       451, 71);

  // Election ovals
  drawOval(0, data.electDefenseRelated,      61, 167);
  drawOval(0, data.electAlternateSimplified, 61, 177);
  drawOval(0, data.electMassGrossReceipts,   61, 187);

  // Part 1 -- lines 1-6  (box tops: 214.5, 236.5, 258.5, 280.5, 302.5, 324.5)
  fillRow(0, fmtCurrency(data.line1_qualifiedWages),          P1_ROWS, 214.5);
  fillRow(0, fmtCurrency(data.line2_qualifiedSupply),         P1_ROWS, 236.5);
  fillRow(0, fmtCurrency(data.line3_qualifiedComputerRental), P1_ROWS, 258.5);
  fillRow(0, fmtCurrency(data.line4_qualifiedContract65pct),  P1_ROWS, 280.5);
  fillRow(0, fmtCurrency(line5),                              P1_ROWS, 302.5);
  fillRow(0, fmtCurrency(data.line6_totalQreGroup),           P1_ROWS, 324.5);

  // Part 2 -- no-prior-QRE oval + lines 7-13
  drawOval(0, data.noQreInPriorThreeYears, 499, 378);
  const skip710 = !!data.noQreInPriorThreeYears;

  if (!skip710) {
    fillRow(0, fmtCurrency(data.line7_avgQrePrior3Yrs ?? 0), P1_ROWS, 394.5);
    fillRow(0, fmtCurrency(data.line8_50pctOfLine7    ?? 0), P1_ROWS, 416.5);
    fillRow(0, fmtCurrency(data.line9_line6MinusLine8 ?? 0), P1_ROWS, 438.5);
    fillRow(0, fmtPct(data.line10_applicableRate      ?? 0), P1_ROWS, 460.5);
  }
  fillRow(0, fmtCurrency(data.line11_totalCreditGroup),        P1_ROWS, 493.5);
  fillRow(0, fmtPct(data.line12_pctGroupCreditCorp),           P1_ROWS, 515.5);
  fillRow(0, fmtCurrency(data.line13_amtGroupCreditCorp),      P1_ROWS, 537.5);

  // =========================================================================
  // PAGE 2
  // =========================================================================

  // Part 3 -- lines 14-22
  fillRow(1, fmtDecimal(data.line14_fixedBaseRatio, 6),           P2_ROWS,  82.0);
  fillRow(1, fmtCurrency(data.line15_avgAnnualGrossReceipts4Yrs), P2_ROWS, 104.0);
  fillRow(1, fmtCurrency(data.line16_baseAmount),                 P2_ROWS, 126.0);
  fillRow(1, fmtCurrency(data.line17_line6MinusLine16),           P2_ROWS, 148.0);
  fillRow(1, fmtCurrency(data.line18_totalGroupCreditQre),        P2_ROWS, 170.0);
  fillRow(1, fmtCurrency(data.line19_totalGroupCreditBasicResearch), P2_ROWS, 192.0);
  fillRow(1, fmtCurrency(data.line20_totalResearchCreditGroup),   P2_ROWS, 214.0);
  fillRow(1, fmtDecimal(data.line21_pctGroupCreditCorp, 6),       P2_ROWS, 236.0);
  fillRow(1, fmtCurrency(data.line22_amtCreditCorp),              P2_ROWS, 258.0);

  // Part 4 -- lines 23-29
  fillRow(1, fmtCurrency(data.line23_totalExciseBeforeCredits),      P2_ROWS, 395.0);
  fillRow(1, fmtCurrency(data.line24_totalAggGroupExcise),           P2_ROWS, 428.0);
  fillRow(1, fmtDecimal(data.line25_allocationPct, 6),               P2_ROWS, 461.0);
  fillRow(1, fmtCurrency(data.line26_corpShareExciseNotSubjectTo75), P2_ROWS, 494.0);
  fillRow(1, fmtCurrency(data.line27_corpExciseSubjectTo75),         P2_ROWS, 516.0);
  fillRow(1, fmtCurrency(data.line28_75pctOfLine27),                 P2_ROWS, 538.0);
  fillRow(1, fmtCurrency(data.line29_corpSubtotalExcise),            P2_ROWS, 560.0);

  // Serialize and upload
    const pdfBuffer = Buffer.from(await pdfDoc.save());
    const pdfBuf = pdfBuffer;
  
  const blobName  = `cases/${caseRid}/rdForms/ma_schedule_rc_${caseRid}_${Date.now()}.pdf`;
  const blobUrl   = await uploadBufferToAzureBlob(pdfBuffer, blobName, accountNumber);

  logMessage(`[MA RC] Filled PDF uploaded: ${blobUrl}`);
  return blobUrl;
}