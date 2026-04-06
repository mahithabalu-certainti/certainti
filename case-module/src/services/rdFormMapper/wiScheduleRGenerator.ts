import { QueryTypes, Sequelize } from "sequelize";
import {
  logMessage,
  uploadBufferToAzureBlob,
  downloadBufferFromAzureBlob,
} from "../../utils/helpers";
import { rawQueries } from "../../utils/constants";
import path from "path";
import fs from "fs";

// Wisconsin Schedule R -- Research Credits (2024)
//
// Form layout (2 pages, 612 x 792 pts each):
//   Page 1 -- Header + Lines 1-14  (QRE calc + credit rate section)
//   Page 2 -- Lines 15-23          (pass-through + refundable/nonrefundable split)
//
// Value column geometry:
//   Main column (lines 1-11, 14, 15d-23): x=563.5 marks the ".00" cents field.
//     Values right-align to x=560 (just before the cents column).
//   Sub-lines 9a-9d:  ".00" at x=432.4  -> right-align to x=429
//   Sub-lines 15a-15c amounts: ".00" at x=385.9 -> right-align to x=383
//
// Coordinates extracted by matching ".00" label tops from pdfplumber.
//
// computed_fields structure (from RdCreditCalculatorForWI.buildComputedFields):
//   computed_fields: {
//     "Wisconsin Schedule R - Research Credits": {
//       "[1] Enter Wisconsin research wage expenses": number,
//       "[2] ...", ..., "[23] ...": number
//     }
//   }
//
// Usage from processStateForms in rdFormMapperService.ts:
//
//   import { processWisconsinForm } from "./stateForms/wiScheduleRGenerator";
//
//   if (resolvedStateCode === "WI") {
//     const url = await processWisconsinForm(
//       caseRid, schemaName, accountNumber, formInfo.browse_file, orgDb,
//     );
//     await this.rdFormMapperSchemaService.saveStateFilledFormUrl(
//       caseRid, state, url, orgDb, accountNumber,
//     );
//     continue;
//   }

// --- Types -------------------------------------------------------------------

interface WIScheduleRData {
  // Header
  corporationName: string;
  identifyingNumber: string;

  // Lines 1-11: QRE calculation
  line1_wages: number;
  line2_supplies: number;
  line3_computerRental: number;
  line4_contractPct: number;
  line5_orphanDrug: number;
  line6_total1thru5: number;
  line7_devZonesWages: number;
  line8_totalWiResearch: number;

  // Lines 9a-9e: Prior year sub-lines
  line9a_prior1: number;
  line9b_prior2: number;
  line9c_prior3: number;
  line9d_total9ato9c: number;
  line9e_avg: number;          // 9d / 3

  line10_9eBy50pct: number;
  line11_eligibleQre: number;

  // Lines 12/13: Credit rate checkboxes (which box is checked)
  hasPriorQREs: boolean;       // true -> line 12 rates, false -> line 13 rates
  activityType: string;        // "standard" | "combustion_engine" | "energy_efficient"

  // Line 14: Computed credit
  line14_credit: number;

  // Lines 15a-15d: Pass-through credits
  line15a_amount: number;
  line15b_amount: number;
  line15c_amount: number;
  line15d_total: number;

  // Lines 16-23: Total + refundable/nonrefundable split
  line16_totalCredits: number;
  line16a_fiduciary: number;
  line16b_fiduciaryNet: number;
  line17_25pct: number;
  line18_offsetTax: number;
  line19_line16MinusLine18: number;
  line20_refundable: number;
  line21_nonrefundable: number;
  line22_carryover: number;
  line23_totalNonrefundable: number;
}

// --- Formatting helpers ------------------------------------------------------

// WI form says "Round Amounts to Nearest Dollar" -- no cents in value field
const fmtCurrency = (v: number): string =>
  v ? Math.round(v).toLocaleString("en-US") : "";

// Checkbox marker
const CHECK = "X";

// --- Entry point -------------------------------------------------------------

/**
 * Fetch WI computed R&D data, overlay onto Schedule R template, upload to Azure Blob.
 * @returns Blob URL of filled PDF
 */
export async function processWisconsinForm(
  caseRid: string,
  schemaName: string,
  accountNumber: string,
  templateBlobUrl: string,
  orgDb: Sequelize,
  stateRid: string,
): Promise<string> {
  logMessage(`[WI SCH-R] Starting form generation for case: ${caseRid}`);

  // 1. Fetch case row
  const [caseRow]: any[] = await orgDb.query(
    rawQueries.fetchCaseById(schemaName),
    { replacements: { caseId: caseRid }, type: QueryTypes.SELECT },
  );
  if (!caseRow) throw new Error(`[WI SCH-R] Case not found: ${caseRid}`);

  // 2. Fetch computation result from state calculations table
  const [calcRow]: any[] = await orgDb.query(
    rawQueries.fetchStateCalculationForCase(schemaName),
    { replacements: { caseRid, stateRid }, type: QueryTypes.SELECT },
  );
  if (!calcRow)
    throw new Error(`[WI SCH-R] No calculation row found for case: ${caseRid}`);

  const rootCf: Record<string, any> =
    typeof calcRow.computed_fields === "string"
      ? JSON.parse(calcRow.computed_fields)
      : (calcRow.computed_fields ?? {});

  // May be nested one level
  const outer: Record<string, any> = rootCf["computed_fields"] ?? rootCf;

  // WI calculator stores everything under this key
  const cf: Record<string, any> =
    outer["Wisconsin Schedule R \u2014 Research Credits"] ??
    outer["Wisconsin Schedule R - Research Credits"] ??
    outer;

  const num = (v: any): number => {
    if (v === null || v === undefined || v === "") return 0;
    if (typeof v === "number") return v;
    return parseFloat(String(v).replace(/,/g, "")) || 0;
  };

  // Line 14 key is dynamic: "[14] Multiply line 11 by the credit rate indicated on line 12a ."
  const line14Key = Object.keys(cf).find(k => k.startsWith("[14]")) ?? "";

  // 3. Map to form data
  const data: WIScheduleRData = {
    corporationName:    String(caseRow.client_name ?? ""),
    identifyingNumber:  String(caseRow.federal_id ?? caseRow.ein ?? ""),

    line1_wages:          num(cf["[1] Enter Wisconsin research wage expenses"]),
    line2_supplies:       num(cf["[2] Enter Wisconsin research supplies expenses"]),
    line3_computerRental: num(cf["[3] Enter Wisconsin research computer rental expenses"]),
    line4_contractPct:    num(cf["[4] Enter applicable percentage of Wisconsin contract research expenses"]),
    line5_orphanDrug:     num(cf["[5] Enter expenses used to compute the federal orphan drug credit that qualify as Wisconsin research expenses"]),
    line6_total1thru5:    num(cf["[6] Add lines 1 through 5"]),
    line7_devZonesWages:  num(cf["[7] Wages included on line 6 that qualify for the Wisconsin development zones credit"]),
    line8_totalWiResearch:num(cf["[8] Subtract line 7 from line 6. This is total Wisconsin research expenses ."]),

    line9a_prior1: num(cf["[9a] 1st prior year qualified research expenses"]),
    line9b_prior2: num(cf["[9b] 2nd prior year qualified research expenses"]),
    line9c_prior3: num(cf["[9c] 3rd prior year qualified research expenses"]),
    line9d_total9ato9c: num(cf["[9d] Total (add lines 9a through 9c) ."]),
    line9e_avg:         num(cf["[9e] Divide line 9d by 3 ."]),

    line10_9eBy50pct: num(cf["[10] Multiply line 9e by 50% (0.50) ."]),
    line11_eligibleQre: num(cf["[11] Subtract line 10 from line 8. This is your eligible Wisconsin qualified research expenses"]),

    // hasPriorQREs and activityType drive checkbox selection
    hasPriorQREs: num(cf["[10] Multiply line 9e by 50% (0.50) ."]) > 0,
    activityType: (() => {
      // Infer from which rate key has a non-zero value at the selected line
      if (num(cf["[12b] Qualified research activities related to internal combustion engines (11.5%)"]) > 5) return "combustion_engine";
      if (num(cf["[12c] Qualified research activities related to certain energy efficient products (11.5%)"]) > 5) return "energy_efficient";
      return "standard";
    })(),

    line14_credit: num(cf[line14Key]),

    line15a_amount: num(cf["[15a] Entity Name"]),  // amount stored here
    line15b_amount: num(cf["[15b] Entity Name"]),
    line15c_amount: num(cf["[15c] Total pass through credits from additional schedule"]),
    line15d_total:  num(cf["[15d] Total pass through credits (add lines 15a through 15c)"]),

    line16_totalCredits:   num(cf["[16] Total research credits (add lines 14 and 15d). Form 3 and 5S filers stop here ."]),
    line16a_fiduciary:     num(cf["[16a] Fiduciaries - Fill in the amount of credit allocated to beneficiaries"]),
    line16b_fiduciaryNet:  num(cf["[16b] Fiduciaries - Subtract line 16a from line 16 ."]),
    line17_25pct:          num(cf["[17] Multiply line 16 (line 16b for fiduciary) by .25 (25%)"]),
    line18_offsetTax:      num(cf["[18] Amount of credit from line 16 (line 16b for fiduciary) used to offset tax"]),
    line19_line16MinusLine18: num(cf["[19] Subtract line 18 from line 16 (line 16b for fiduciary)"]),
    line20_refundable:     num(cf["[20] Enter the lesser of line 17 or line 19. This is the refundable portion of the credit"]),
    line21_nonrefundable:  num(cf["[21] Subtract line 20 from line 19. This is the remaining nonrefundable portion of the credit"]),
    line22_carryover:      num(cf["[22] Carryover of prior year\u2019s unused research credit. Include Schedule CF"]),
    line23_totalNonrefundable: num(cf["[23] Add lines 18, 21, and 22. This is the total nonrefundable portion of the credit. Include Schedule CF if the credit was not used in full"]),
  };

  return _generatePdf(data, caseRid, accountNumber, templateBlobUrl);
}

// --- PDF generator (private) -------------------------------------------------

async function _generatePdf(
  data: WIScheduleRData,
  caseRid: string,
  accountNumber: string,
  templateBlobUrl: string,
): Promise<string> {
  const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

  const parsedUrl = new URL(templateBlobUrl);
  const pathParts  = parsedUrl.pathname.split("/").filter(Boolean);
  const container  = pathParts[0];
  if (!container)
    throw new Error("[WI SCH-R] Invalid template blob URL -- container not found");

  const blobName = decodeURIComponent(pathParts.slice(1).join("/"));
  logMessage(`[WI SCH-R] Downloading template: blob=${blobName}`);

  const pdfBytes = await downloadBufferFromAzureBlob(container, blobName);
  const pdfDoc   = await PDFDocument.load(pdfBytes);
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages    = pdfDoc.getPages();

  if (pages.length < 2)
    throw new Error("[WI SCH-R] Template must have at least 2 pages");

  // --- Coordinate system ---------------------------------------------------
  // All `top` values are pdfplumber-measured ".00" label tops (top-origin).
  // pdf-lib y = PAGE_H - top - FONT_SIZE
  //
  // Three value columns:
  //   MAIN  (lines 1-11, 14, 15d-23): right-align to x=558  (before ".00" at 563.5)
  //   SUB9  (lines 9a-9d):             right-align to x=428  (before ".00" at 432.4)
  //   SUB15 (lines 15a-15c amounts):   right-align to x=382  (before ".00" at 385.9)

  const PAGE_H     = 792;
  const FONT_SIZE  = 9;
  const MAIN_RIGHT = 558;
  const SUB9_RIGHT = 428;

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

  // Right-align to rightX, placed at the given dot-label top
  const drawRight = (
    pageIdx: number, text: string, dotTop: number,
    rightX = MAIN_RIGHT, size = FONT_SIZE,
  ) => {
    if (!text?.trim()) return;
    const w = font.widthOfTextAtSize(text, size);
    pages[pageIdx].drawText(text, {
      x: rightX - w,
      y: PAGE_H - dotTop - size,
      size, font, color: rgb(0, 0, 0),
    });
  };

  // Small checkbox marker
  const drawCheck = (pageIdx: number, x: number, top: number) => {
    pages[pageIdx].drawText(CHECK, {
      x, y: PAGE_H - top - 8,
      size: 8, font: fontBold, color: rgb(0, 0, 0),
    });
  };

  // --- PAGE 1 --------------------------------------------------------------

  // Header
  // Name field: below top rule at top=111.5, ID Number field same row right side
  drawLeft(0, data.corporationName,   32,  122);
  drawLeft(0, data.identifyingNumber, 429, 122);

  // Lines 1-8: dot-label tops from ".00" markers at x=563.5
  // top: 138.6, 156.5, 174.4, 193.6, 223.1, 241.0, 259.9, 277.2
  drawRight(0, fmtCurrency(data.line1_wages),           134.6);
  drawRight(0, fmtCurrency(data.line2_supplies),         152.5);
  drawRight(0, fmtCurrency(data.line3_computerRental),   170.4);
  drawRight(0, fmtCurrency(data.line4_contractPct),      189.6);
  drawRight(0, fmtCurrency(data.line5_orphanDrug),       219.1);
  drawRight(0, fmtCurrency(data.line6_total1thru5),      237.0);
  drawRight(0, fmtCurrency(data.line7_devZonesWages),    253.9);
  drawRight(0, fmtCurrency(data.line8_totalWiResearch),  273.2);

  // Lines 9a-9d: sub-column, ".00" at x=432.4, tops: 336.8, 355.0, 373.1, 391.7
  drawRight(0, fmtCurrency(data.line9a_prior1),    332.8, SUB9_RIGHT);
  drawRight(0, fmtCurrency(data.line9b_prior2),    351.0, SUB9_RIGHT);
  drawRight(0, fmtCurrency(data.line9c_prior3),    369.1, SUB9_RIGHT);
  drawRight(0, fmtCurrency(data.line9d_total9ato9c), 389.7, SUB9_RIGHT);

  // Line 9e: main column, ".00" top=409.2
  drawRight(0, fmtCurrency(data.line9e_avg),        405.2);

  // Lines 10, 11: tops 427.2, 444.6
  drawRight(0, fmtCurrency(data.line10_9eBy50pct),  423.2);
  drawRight(0, fmtCurrency(data.line11_eligibleQre), 440.6);

  // Lines 12/13 checkboxes
  // The checkbox is a small box just after the rate label.
  // Checkbox x positions measured from form -- approx x=535 for the check mark.
  // Label tops from pdfplumber word extraction:
  //   12a=501.5, 12b=519.5, 12c=537.5  (line 12 group)
  //   13a=595.1, 13b=613.1, 13c=631.1  (line 13 group)
  if (data.hasPriorQREs) {
    // Check the appropriate line 12 box
    const checkTop12 =
      data.activityType === "combustion_engine" ? 519.5 :
      data.activityType === "energy_efficient"  ? 537.5 : 501.5;
    drawCheck(0, 537, checkTop12);
  } else {
    // Check the appropriate line 13 box
    const checkTop13 =
      data.activityType === "combustion_engine" ? 613.1 :
      data.activityType === "energy_efficient"  ? 631.1 : 595.1;
    drawCheck(0, 537, checkTop13);
  }

  // Line 14: top=648.4
  drawRight(0, fmtCurrency(data.line14_credit), 644.4);

  // --- PAGE 2 --------------------------------------------------------------

  // Header repeat (Name + ID Number)
  drawLeft(1, data.corporationName,   114, 49);
  drawLeft(1, data.identifyingNumber, 380, 49);

  // Lines 15a, 15b amount sub-column: ".00" tops 105.2, 141.4 at x=385.9
  // right-align to x=382
  drawRight(1, fmtCurrency(data.line15a_amount), 105.2, 379);
  drawRight(1, fmtCurrency(data.line15b_amount), 141.4, 379);
  // Line 15c: ".00" at top=159.1, same sub-column
  drawRight(1, fmtCurrency(data.line15c_amount), 159.1, 379);

  // Lines 15d-23: main column, ".00" tops from page 2
  // 15d=178.8, 16=196.7, 16a=214.3, 16b=232.3
  // 17=250.0, 18=267.9, 19=285.7, 20=303.6, 21=321.4, 22=339.3, 23=367.7
  drawRight(1, fmtCurrency(data.line15d_total),         172.8);
  drawRight(1, fmtCurrency(data.line16_totalCredits),   192.7);
  drawRight(1, fmtCurrency(data.line16a_fiduciary),     210.3);
  drawRight(1, fmtCurrency(data.line16b_fiduciaryNet),  228.3);
  drawRight(1, fmtCurrency(data.line17_25pct),          246.0);
  drawRight(1, fmtCurrency(data.line18_offsetTax),      263.9);
  drawRight(1, fmtCurrency(data.line19_line16MinusLine18), 281.7);
  drawRight(1, fmtCurrency(data.line20_refundable),    299.6);
  drawRight(1, fmtCurrency(data.line21_nonrefundable),  318.4);
  drawRight(1, fmtCurrency(data.line22_carryover),      335.3);
  drawRight(1, fmtCurrency(data.line23_totalNonrefundable), 363.7);

  // --- Serialize and upload ------------------------------------------------
  const pdfBuffer = Buffer.from(await pdfDoc.save());
  const outBlob   = `cases/${caseRid}/rdForms/wi_schedule_r_${caseRid}_${Date.now()}.pdf`;
  const blobUrl   = await uploadBufferToAzureBlob(pdfBuffer, outBlob, accountNumber);

  logMessage(`[WI SCH-R] Filled PDF uploaded: ${blobUrl}`);
  return blobUrl;
}
