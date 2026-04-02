import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * Rhode Island R&D Credit Calculator
 *
 * Form: RI Schedule RC — R&D Expense Credit
 *
 * Key characteristics:
 *  - Lines 1–3 reference Federal Form 6765 values (informational context)
 *  - Line 4 is the primary input: RI-incurred portion of federal excess R&D expenses
 *  - Line 5 applies a SWITCHED two-tier rate on line 4:
 *      ≤ $111,111  →  22.5% applied to the entire amount
 *      > $111,111  →  16.9% applied to the entire amount  (NOT a split — a switch)
 *  - Line 9 caps current-year credit usage at 50% of tax liability
 *  - Unused credit carries over (line 10); carryforward up to 7 years
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IMPORTANT — Tier logic confirmed by reverse-engineering the Excel:
 *
 *   The form description reads:
 *     "22.5% on expenditures up to $111,111 and 16.9% on expenditures over $111,111"
 *
 *   A naïve reading suggests a SPLIT (22.5% on first $111,111, 16.9% on remainder),
 *   which for $165,000 would produce:
 *     ($111,111 × 22.5%) + ($53,889 × 16.9%) = $24,999.98 + $9,107.24 = $34,107.22
 *
 *   But the Excel produces $27,885.00 for line 4 = $165,000.
 *   Reverse-engineering: $27,885 / $165,000 = exactly 16.9%
 *
 *   This confirms the tier is a SWITCH, not a split:
 *     - If line 4 ≤ $111,111 → credit = line4 × 22.5%
 *     - If line 4 > $111,111 → credit = line4 × 16.9%  (entire amount at lower rate)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Line-by-line:
 *   Line 1  : Federal QRE (Form 6765 line 9 or 28)               — informational
 *   Line 2  : Federal base amount (Form 6765 line 12/14 or 30)   — informational
 *   Line 3  : Federal excess = Line 1 − Line 2                   — informational
 *   Line 4  : RI portion of federal excess expenses               — KEY INPUT
 *   Line 5  : Credit (switched two-tier rate on line 4)           — computed
 *   Line 6  : Prior year unused credit carryover                  — optional input
 *   Line 7  : Total available = Line 5 + Line 6
 *   Line 8  : Tax liability (Form RI-1120C line 11 or T-71 line 7)
 *   Line 9  : Max credit = Line 8 × 50%
 *   Line 10 : Carryover = Line 7 − Line 9
 *
 * finalCredit = Line 7 (total available credit)
 * Tax limitation (line 9) is tracked and reported but does not reduce finalCredit —
 * the limitation is applied at filing time, not here.
 *
 * Carryforward: Up to 7 years for unused credit.
 *
 * Sample verification (from Excel):
 *   Line 4 = $165,000  →  $165,000 > $111,111  →  $165,000 × 16.9% = $27,885  ✓
 */

export interface ConfigJson {
    /** Applicable percentage of contract expenses — default 65 (i.e. 65%) */
    sub_con_percent: number;

    /**
     * Dollar threshold that switches between tier1 and tier2 rate.
     * Default 111111 (per RI form).
     * If line 4 ≤ this threshold → tier1_rate applies to the entire amount.
     * If line 4 > this threshold → tier2_rate applies to the entire amount.
     */
    qre_threshold_amount: number;

    /** Credit rate when line 4 ≤ tier_threshold — default 22.5 (i.e. 22.5%) */
    qre_credit_percentage_c1: number;

    /** Credit rate when line 4 > tier_threshold — default 16.9 (i.e. 16.9%) */
    qre_credit_percentage_c2: number;
    qre_credit_percentage_c3: number;
}

export class RdCreditCalculatorForRI {

    country    = "USA";
    creditType = "State R&D Credit - RI";
    currency   = "USD";

    async compute(
        config: ConfigJson,
        stateRdData: StateRDData,
        fiscalYear: string,
        year: number,
        caseData: Case
    ) {
        logMessage(`Computing RI Credit — fiscal year: ${fiscalYear}`);
        logMessage(`RI config: ${JSON.stringify(config)}`);

        const cd  = caseData as any;
        const { wages = 0, supplies = 0, contract = 0 } = stateRdData.currentYearQREs;

        // ---- Total RI QRE (wages + supplies + contract × sub_con_percent%)
        //      Used to populate line 4 when ri_excess_expenses is not explicitly provided
        const totalRiQRE = new Decimal(wages)
            .plus(new Decimal(supplies))
            .plus(new Decimal(contract).mul(config.sub_con_percent / 100));

        //---- Lines 1–3: Federal Form 6765 reference values (informational only)
        const line1 = new Decimal(cd.ri_federal_qre          ?? 0);  // Form 6765 line 9 or 28
        const line2 = new Decimal(cd.ri_federal_base_amount  ?? 0);  // Form 6765 line 12/14 or 30
        const line3 = Decimal.max(line1.minus(line2), 0);             // federal excess

        //---- Line 4: RI-incurred portion of federal excess expenses
        //    Primary source: caseData.ri_excess_expenses (explicitly set RI portion)
        //    Fallback:       total RI QRE derived from currentYearQREs
        const line4 = new Decimal(cd.ri_excess_expenses ?? totalRiQRE.toNumber());

        //---- Line 5: Credit — switched two-tier rate on line 4
        //    SWITCH (not a split):
        //      ≤ tier_threshold → 22.5% on entire line 4
        //      > tier_threshold → 16.9% on entire line 4
        const tierThreshold = new Decimal(config.qre_threshold_amount);
        const appliedRate   = line4.lte(tierThreshold)
            ? config.qre_credit_percentage_c1   // 22.5%
            : config.qre_credit_percentage_c2;  // 16.9%
        const line5 = line4.mul(appliedRate / 100);

        logMessage(`RI — Line 4: ${this.round2(line4)}, ` +
            `threshold: $${config.qre_threshold_amount}, ` +
            `applied rate: ${appliedRate}% (${line4.lte(tierThreshold) ? "tier 1" : "tier 2"})`);

        //---- Line 6: Prior year unused credit carryover
        const line6 = new Decimal(cd.ri_prior_year_carryover ?? 0);

        //---- Line 7: Total R&D expense credit available = Line 5 + Line 6
        const line7 = line5.plus(line6);

        //---- Line 8: Tax liability (Form RI-1120C line 11 or T-71 line 7)
        const line8 = new Decimal(cd.ri_tax_liability ?? 0);

        //---- Line 9: Maximum credit = Line 8 × 50%
        //    When line 8 = 0, max credit = 0 and full credit carries over via line 10
        const line9 = line8.mul(config.qre_credit_percentage_c3 / 100);

        //---- Line 10: Carryover = Line 7 − Line 9 (min 0)
        const line10 = Decimal.max(line7.minus(line9), 0);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear : year
        },config);
        const computedFields = this.buildComputedFields(
            {
                line1: this.round2(line1),
                line2: this.round2(line2),
                line3: this.round2(line3),
                line4: this.round2(line4),
                line5: this.round2(line5),
                line6: this.round2(line6),
                line7: this.round2(line7),
                line8: this.round2(line8),
                line9: this.round2(line9),
                line10: this.round2(line10),
            },
            appliedRate,
            config
        );

        return {
            inputFields,
            computedFields,
            finalCredit:      this.round2(line7),    // line 7 — total available credit
            totalQRE:         this.round2(line4),    // line 4 — RI excess expenses
            totalWages:       this.round2(new Decimal(wages)),
            totalContract:    this.round2(new Decimal(contract)),
            totalSupplies:    this.round2(new Decimal(supplies)),
            appliedRate,                              // 22.5 or 16.9
            taxLimitedCredit: this.round2(line9),    // line 9 — current-year usage cap
            carryoverAmount:  this.round2(line10),   // line 10 — carried to next year
        };
    }

    // -------------------------------------------------------------------------
    // Input params builder
    // -------------------------------------------------------------------------
     async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], metadata: any = {},config : ConfigJson ) {
       
               let storeData : any[] = []
               let currentYearContract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent/100) || 0;
               storeData.push({
                   year : metadata.currentYear,
                   wages: this.round2(currentYearQREs.wages),
                   contract: this.round2(currentYearContract),
                   sum: this.round2(new Decimal(currentYearQREs.wages || 0).plus(currentYearContract)) || 0
               })
        
               prior3YearsQREs.forEach((item) => {
                   storeData.push({
                       year : item.fiscalYear,
                       wages: item.wages,
                       contract: item.contract,
                       sum: this.round2(new Decimal(item.wages || 0).plus(Number(item.contract || 0))) || 0
                   })
               });
       
               return {
                   metadata: {
                       country: metadata.country || "US",
                       credit_type: metadata.creditType || "STATE_RD_RI",
                       currency: metadata.currency || "USD",
                       "Fiscal Year Ended" : metadata.fiscalYearEnded,
                       "Description": "Research Tax Credit",
                       stateDetails : "Rhode Island - Credit Calculations"
                   },
                   "Current & Prior years information" : storeData
               };
           }

    // -------------------------------------------------------------------------
    // Computed fields builder — mirrors RI Schedule RC line layout
    // -------------------------------------------------------------------------
    private buildComputedFields(
        lines: {
            line1: number; line2: number; line3: number; line4: number;
            line5: number; line6: number; line7: number; line8: number;
            line9: number; line10: number;
        },
        appliedRate: number,
        config: ConfigJson
    ) {
        const tierLabel = lines.line4 <= config.qre_threshold_amount
            ? `${config.qre_credit_percentage_c1}% (line 4 ≤ $${config.qre_threshold_amount.toLocaleString()} — tier 1 rate applied to entire amount)`
            : `${config.qre_credit_percentage_c2}% (line 4 > $${config.qre_threshold_amount.toLocaleString()} — tier 2 rate applied to entire amount)`;

        return {
            computed_fields: {
                "RI Schedule RC — R&D Expense Credit": {
                    "[1] Federal Qualified Research Expenses (Form 6765, line 9 or line 28)":
                        lines.line1,
                    "[2] Federal Base Amount (Form 6765, line 12 or 14, or line 30)":
                        lines.line2,
                    "[3] Federal Excess Expenses (line 1 minus line 2)":
                        lines.line3,
                    "[4] Amount of Federal Excess Expenses from line 3 incurred in Rhode Island":
                        lines.line4,
                    [`[5] Credit — ${tierLabel}`]:
                        lines.line5,
                    "[6] Unused R&D Expense Credit from preceding year(s)":
                        lines.line6,
                    "[7] Total R&D Expense Credit Available (line 5 + line 6)":
                        lines.line7,
                    "[8] Tax amount (Form RI-1120C, line 11 or Form T-71, line 7)":
                        lines.line8,
                    [`[9] MAXIMUM R&D Expense Credit. Multiply line 8 by ${config.qre_credit_percentage_c3}%. Enter here and on the applicable line on Schedule B-CR`]:
                        lines.line9,
                    "[10] Credit carryover. Subtract line 9 from line 7":
                        lines.line10,
                }
            },
        };
    }

    // -------------------------------------------------------------------------
    // Rounding utility — consistent with AZ / CA / CO / KS / LA / MN / NE / IA / NH
    // -------------------------------------------------------------------------
    round2(value: any): number {
        if (value === null || value === undefined) return value;

        if (Decimal.isDecimal(value)) {
            return value.toDecimalPlaces(2).toNumber();
        }

        if (typeof value === "number" || typeof value === "string") {
            return new Decimal(value).toDecimalPlaces(2).toNumber();
        }

        return value;
    }
}
