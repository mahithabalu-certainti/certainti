import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * Wisconsin R&D Credit Calculator
 *
 * Form: Wisconsin Schedule R — Research Credits
 *
 * Wisconsin uses an ASC-style calculation but with two important differences
 * from the federal ASC (and from states like VT/DC):
 *   1. Prior 3yr average divides by 3 (not 6 like federal ASC)
 *   2. THREE activity types with different credit rates — and when the taxpayer
 *      has no prior-year QREs, each rate is halved
 *
 * Additionally, WI has a unique refundable/nonrefundable split (lines 17–23)
 * where up to 25% of the total credit may be refundable.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QRE Computation (lines 1–11):
 * ─────────────────────────────────────────────────────────────────────────────
 *   Line 1  : WI wages
 *   Line 2  : WI supplies
 *   Line 3  : WI computer rental
 *   Line 4  : WI contract × sub_con_percent%
 *   Line 5  : Orphan drug credit wages (hardcoded 0)
 *   Line 6  : Total = lines 1–5
 *   Line 7  : Development zones wages (hardcoded 0)
 *   Line 8  : Total WI research expenses = line 6 − line 7
 *   Lines 9a–9c : Prior 3yr QREs (most recent → oldest)
 *   Line 9d : Sum of 9a–9c
 *   Line 9e : Line 9d ÷ 3  ← WI divides by 3, NOT 6
 *   Line 10 : Line 9e × 50%
 *   Line 11 : Line 8 − Line 10  ← eligible WI QRE (min 0)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Activity Type & Credit Rate (lines 12–14):
 * ─────────────────────────────────────────────────────────────────────────────
 * When prior QREs exist (line 9 NOT skipped):
 *   Line 12a: Standard qualified research          →  5.75%
 *   Line 12b: Internal combustion engines          → 11.5%
 *   Line 12c: Certain energy efficient products    → 11.5%
 *
 * When NO prior QREs (line 9 skipped — all rates halved):
 *   Line 13a: Standard qualified research          →  2.875%
 *   Line 13b: Internal combustion engines          →  5.75%
 *   Line 13c: Certain energy efficient products    →  5.75%
 *
 *   Line 14: Line 11 × selected rate  ← computed credit
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Pass-through & Total (lines 15–16):
 * ─────────────────────────────────────────────────────────────────────────────
 *   Lines 15a–15d : Pass-through credits from other entities (default 0)
 *   Line 16       : Line 14 + Line 15d  ← total research credits  ← FINAL CREDIT
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Refundable / Nonrefundable Split (lines 17–23):
 * ─────────────────────────────────────────────────────────────────────────────
 *   Line 17 : Line 16 × 25%   ← maximum potential refundable portion
 *   Line 18 : Credit used to offset tax (caseData input, default 0)
 *   Line 19 : Line 16 − Line 18
 *   Line 20 : min(Line 17, Line 19)  ← actual refundable portion
 *   Line 21 : Line 19 − Line 20      ← nonrefundable portion
 *   Line 22 : Prior year carryover (caseData input, default 0)
 *   Line 23 : Line 18 + Line 21 + Line 22  ← total nonrefundable credit
 *
 * finalCredit = line 16 (total credits before tax/refund split)
 *
 * Verified against Excel:
 *   WI QRE=$165,000, prior3yr=$305,000
 *   Line 9e  = 305,000 ÷ 3 = 101,666.67
 *   Line 10  = 101,666.67 × 50% = 50,833.33
 *   Line 11  = 165,000 − 50,833.33 = 114,166.67
 *   Line 14  = 114,166.67 × 5.75% = 6,564.58  ✓ (Excel: 6564.583333)
 *   Line 16  = 6,564.58  ✓
 *   Line 23  = 6,564.58  ✓
 *
 * Carryforward: Up to 15 years (partial refundability for small businesses).
 */

export type WiActivityType = "standard" | "combustion_engine" | "energy_efficient";

export interface ConfigJson {
    /** Applicable % of contract expenses — default 65 (i.e. 65%) */
    sub_con_percent: number;

    /**
     * Activity type — determines which credit rate line applies.
     * "standard"          → 5.75% (with prior QREs) / 2.875% (without)
     * "combustion_engine" → 11.5% (with prior QREs) / 5.75% (without)
     * "energy_efficient"  → 11.5% (with prior QREs) / 5.75% (without)
     * Default: "standard"
     */
    activity_type: WiActivityType;

    qre_credit_percentage_c1: number;
    qre_credit_percentage_c2: number;

    // Standard credit rates (when prior QREs exist — line 12)
    /** Standard research rate — default 5.75 */
    rate_standard_percentage: number;
    /** Internal combustion engine rate — default 11.5 */
    rate_combustion_percentage: number;
    /** Energy efficient products rate — default 11.5 */
    rate_energy_percentage: number;

    // No-prior-QRE rates (halved — line 13)
    /** Standard rate when no prior QREs — default 2.875 */
    rate_standard_no_prior_percentage: number;
    /** Combustion rate when no prior QREs — default 5.75 */
    rate_combustion_no_prior_percentage: number;
    /** Energy efficient rate when no prior QREs — default 5.75 */
    rate_energy_no_prior_percentage: number;
}

export class RdCreditCalculatorForWI {

    country    = "USA";
    creditType = "State R&D Credit - WI";
    currency   = "USD";

    async compute(
        config: ConfigJson,
        stateRdData: StateRDData,
        fiscalYear: string,
        year: number,
        caseData: Case
    ) {
        logMessage(`Computing WI Credit — fiscal year: ${fiscalYear}`);
        logMessage(`WI config: ${JSON.stringify(config)}`);

        const qreResult      = this.computeQRE(config, stateRdData, caseData);
        const creditResult   = this.computeCredit(config, qreResult,caseData);
        const splitResult    = this.computeSplit(creditResult, caseData,config);
        const inputFields    = this.buildInputParams(stateRdData, caseData, {
            country:         this.country,
            creditType:      this.creditType,
            currency:        this.currency,
            fiscalYearEnded: fiscalYear,
        });
        const computedFields = this.buildComputedFields(qreResult, creditResult, splitResult, config);

        return {
            inputFields,
            computedFields,
            finalCredit:         creditResult.line16,        // total credits
            totalQRE:            qreResult.line8,             // total WI QRE
            totalWages:          this.round2(new Decimal(stateRdData.currentYearQREs.wages    ?? 0)),
            totalContract:       this.round2(new Decimal(stateRdData.currentYearQREs.contract ?? 0)),
            totalSupplies:       this.round2(new Decimal(stateRdData.currentYearQREs.supplies ?? 0)),
            activityType:        config.activity_type,
            appliedRate:         creditResult.rate_used,
            hasPriorQREs:        qreResult.has_prior_qres,
            refundablePortion:   splitResult.line20,
            nonrefundablePortion: splitResult.line21,
        };
    }

    // ── QRE Computation (lines 1–11) ──────────────────────────────────────
    private computeQRE(config: ConfigJson, stateRdData: StateRDData, caseData: Case) {
        const { wages = 0, supplies = 0, contract = 0 } = stateRdData.currentYearQREs;
        const cd = caseData as any;

        //---- Lines 1–5: WI expense components
        const line1 = new Decimal(wages);
        const line2 = new Decimal(cd.research_supplies_expenses_wi ?? 0);
        const line3 = new Decimal(cd.qualified_computer_rental_time_expenses_wi ?? 0);
        const line4 = new Decimal(contract).mul(config.sub_con_percent / 100);
        const line5 = new Decimal(cd.orphan_drug_qualified_expenses_wi ?? 0);   // orphan drug credit wages — not in scope

        //---- Line 6: Total WI expenses
        const line6 = line1.plus(line2).plus(line3).plus(line4).plus(line5);

        //---- Line 7: Development zones wages (hardcoded 0)
        const line7 = new Decimal(0);

        //---- Line 8: Total WI research expenses = line6 − line7
        const line8 = line6.minus(line7);

        //---- Lines 9a–9c: Prior 3yr QREs (index 0 = most recent prior)
        const prior3   = stateRdData.prior3YearsQREs ?? [];
        const line9a   = new Decimal(prior3[0]?.qre ?? 0);   // 1st prior
        const line9b   = new Decimal(prior3[1]?.qre ?? 0);   // 2nd prior
        const line9c   = new Decimal(prior3[2]?.qre ?? 0);   // 3rd prior

        //---- Has prior QREs: all 3 years must have QRE > 0
        const hasPriorQREs = prior3.length >= 3 && prior3.every(y => (y.qre ?? 0) > 0);

        //---- Line 9d: Sum of 9a–9c
        const line9d = line9a.plus(line9b).plus(line9c);

        //---- Line 9e: Average = line9d ÷ 3  (WI divides by 3, NOT 6)
        const line9e = hasPriorQREs ? line9d.div(3) : new Decimal(0);

        //---- Line 10: line9e × 50%
        const line10 = line9e.mul(config.qre_credit_percentage_c1 / 100);

        //---- Line 11: eligible WI QRE = max(line8 − line10, 0)
        const line11 = hasPriorQREs
            ? Decimal.max(line8.minus(line10), 0)
            : line8;   // when no prior QREs: line9 skipped → line10=0 → line11=line8

        if (!hasPriorQREs) {
            logMessage(`WI — no prior QREs in one or more years. ` +
                `Skipping lines 9e/10, using line 8 directly. Halved rates apply.`);
        }

        return {
            line1:          this.round2(line1),
            line2:          this.round2(line2),
            line3:          this.round2(line3),
            line4:          this.round2(line4),
            line5:          this.round2(line5),
            line6:          this.round2(line6),
            line7:          this.round2(line7),
            line8:          this.round2(line8),
            line9a:         this.round2(line9a),
            line9b:         this.round2(line9b),
            line9c:         this.round2(line9c),
            line9d:         this.round2(line9d),
            line9e:         this.round2(line9e),
            line10:         this.round2(line10),
            line11:         this.round2(line11),
            has_prior_qres: hasPriorQREs,
            _line11:        line11,
        };
    }

    // ── Credit Computation (lines 12–16) ──────────────────────────────────
    private computeCredit(
        config: ConfigJson,
        qre: ReturnType<RdCreditCalculatorForWI["computeQRE"]>,
        caseDetails: Case
    ) {
        //---- Resolve credit rate based on activity type and prior QRE presence
        const rate = this.resolveRate(config, qre.has_prior_qres);

        //---- Line 14: Line 11 × selected rate
        const line14 = qre._line11.mul(rate / 100);


        //---- Lines 15a–15d: Pass-through credits (default 0)
        const line15a = new Decimal(0);
        const line15b = new Decimal(0);
        const line15c = new Decimal(caseDetails.additional_pass_through_credits_wi ?? 0);
        const line15d = line15a.plus(line15b).plus(line15c);

        //---- Line 16: Total research credits = line14 + line15d
        const line16 = line14.plus(line15d);

        return {
            rate_used:  rate,
            line14:     this.round2(line14),
            line15d:    this.round2(line15d),
            line16:     this.round2(line16),
            _line16:    line16,
        };
    }

    // ── Refundable / Nonrefundable Split (lines 17–23) ────────────────────
    private computeSplit(
        credit: ReturnType<RdCreditCalculatorForWI["computeCredit"]>,
        caseData: Case,
        config: ConfigJson
    ) {
        const cd = caseData as any;

        //---- Line 16a/16b: Fiduciary allocation (hardcoded 0)
        const line16a = new Decimal(caseData.fiduciary_beneficiary_credit_wi ?? 0);
        const line16b = credit._line16.minus(line16a);   // same as line16 for non-fiduciaries

        //---- Line 17: Max refundable portion = line16 × 25%
        const line17 = line16b.mul(config.qre_credit_percentage_c2  / 100);

        //---- Line 18: Credit used to offset tax (caseData input)
        const line18 = new Decimal(cd.credit_offset_tax_wi ?? 0);

        //---- Line 19: line16 − line18
        const line19 = Decimal.max(credit._line16.minus(line18), 0);

        //---- Line 20: Actual refundable = min(line17, line19)
        const line20 = Decimal.min(line17, line19);

        //---- Line 21: Nonrefundable = line19 − line20
        const line21 = line19.minus(line20);

        //---- Line 22: Prior year carryover
        const line22 = new Decimal(cd.credit_carry_forward_py_wi ?? 0);

        //---- Line 23: Total nonrefundable = line18 + line21 + line22
        const line23 = line18.plus(line21).plus(line22);

        return {
            line17: this.round2(line17),
            line18: this.round2(line18),
            line19: this.round2(line19),
            line20: this.round2(line20),   // refundable portion
            line21: this.round2(line21),   // nonrefundable portion
            line22: this.round2(line22),
            line23: this.round2(line23),   // total nonrefundable
        };
    }

    // ── Rate resolver ──────────────────────────────────────────────────────
    private resolveRate(config: ConfigJson, hasPriorQREs: boolean): number {
        if (hasPriorQREs) {
            switch (config.activity_type) {
                case "combustion_engine":  return config.rate_combustion_percentage;
                case "energy_efficient":   return config.rate_energy_percentage;
                default:                   return config.rate_standard_percentage;
            }
        } else {
            switch (config.activity_type) {
                case "combustion_engine":  return config.rate_combustion_no_prior_percentage;
                case "energy_efficient":   return config.rate_energy_no_prior_percentage;
                default:                   return config.rate_standard_no_prior_percentage;
            }
        }
    }

    // ── Input params ───────────────────────────────────────────────────────
    private buildInputParams(stateRdData: StateRDData, caseData: Case, metadata: any = {}) {
        const { wages = 0, supplies = 0, contract = 0 } = stateRdData.currentYearQREs;
        const qreSummary: Record<string, any> = { wages, supplies, contract };

        (stateRdData.prior3YearsQREs ?? []).forEach((item, i) => {
            qreSummary[`prior_year_qre_${i + 1}`] = item.qre ?? 0;
        });

        return {
            metadata: {
                country:             metadata.country    || "US",
                credit_type:         metadata.creditType || "STATE_RD_WI",
                currency:            metadata.currency   || "USD",
                "Fiscal Year Ended": metadata.fiscalYearEnded,
                "Description":       "Research Tax Credit",
                stateDetails:        "Wisconsin - Credit Calculations",
            },
            qreSummary,
        };
    }

    // ── Computed fields — exact Excel label text (Wisconsin Schedule R) ───
    private buildComputedFields(
        qre:    ReturnType<RdCreditCalculatorForWI["computeQRE"]>,
        credit: ReturnType<RdCreditCalculatorForWI["computeCredit"]>,
        split:  ReturnType<RdCreditCalculatorForWI["computeSplit"]>,
        config: ConfigJson
    ) {
        // Line 14 label: show which rate line was used (12a/12b/12c or 13a/13b/13c)
        const rateLine = qre.has_prior_qres
            ? (config.activity_type === "combustion_engine" ? "12b"
                : config.activity_type === "energy_efficient" ? "12c" : "12a")
            : (config.activity_type === "combustion_engine" ? "13b"
                : config.activity_type === "energy_efficient" ? "13c" : "13a");

        return {
            computed_fields: {
                "Wisconsin Schedule R — Research Credits": {
                    "[1] Enter Wisconsin research wage expenses":
                        qre.line1,
                    "[2] Enter Wisconsin research supplies expenses":
                        qre.line2,
                    "[3] Enter Wisconsin research computer rental expenses":
                        qre.line3,
                    "[4] Enter applicable percentage of Wisconsin contract research expenses":
                        qre.line4,
                    "[5] Enter expenses used to compute the federal orphan drug credit that qualify as Wisconsin research expenses":
                        qre.line5,
                    "[6] Add lines 1 through 5":
                        qre.line6,
                    "[7] Wages included on line 6 that qualify for the Wisconsin development zones credit":
                        qre.line7,
                    "[8] Subtract line 7 from line 6. This is total Wisconsin research expenses .":
                        qre.line8,
                    "[9] Enter average Wisconsin qualified research expenses for the three prior years. If you did not have qualified Wisconsin research expenses in one or more of the three prior years, check the box, skip to line 10, and enter 0 on that line .":
                        qre.has_prior_qres ? qre.line9e : 0,
                    "[9a] 1st prior year qualified research expenses":
                        qre.line9a,
                    "[9b] 2nd prior year qualified research expenses":
                        qre.line9b,
                    "[9c] 3rd prior year qualified research expenses":
                        qre.line9c,
                    "[9d] Total (add lines 9a through 9c) .":
                        qre.line9d,
                    "[9e] Divide line 9d by 3 .":
                        qre.line9e,
                    "[10] Multiply line 9e by 50% (0.50) .":
                        qre.line10,
                    "[11] Subtract line 10 from line 8. This is your eligible Wisconsin qualified research expenses":
                        qre.line11,
                    "[12] Check one of the boxes below to indicate the credit being claimed and the credit rate that applies. If you are claiming more than one research credit, see instructions. If the box on line 9 is checked,do not check one of the boxes. Proceed to line 13.":"",
                    "[12a] Qualified research activities (5.75%)":
                        config.rate_standard_percentage,
                    "[12b] Qualified research activities related to internal combustion engines (11.5%)":
                        config.rate_combustion_percentage,
                    "[12c] Qualified research activities related to certain energy efficient products (11.5%)":
                        config.rate_energy_percentage,
                    "[13] If line 10 is -0- because you did not have qualified research expenses in one or more of the three prior years, and checked the box on line 9, check one of the boxes below to indicate the credit being claimed and the rate that applies. If you are claiming more than one research credit, see instructions.":"",
                    "[13a] Qualified research activities (2.875%) .":
                        config.rate_standard_no_prior_percentage,
                    "[13b] Qualified research activities related to internal combustion engines (5.75%)":
                        config.rate_combustion_no_prior_percentage,
                    "[13c] Qualified research activities related to certain energy efficient products (5.75%)":
                        config.rate_energy_no_prior_percentage,
                    [`[14] Multiply line 11 by the credit rate indicated on line ${rateLine} .`]:
                        credit.line14,
                    "[15a] Entity Name":
                        0,
                    "[15a] FEIN":
                        0,
                    "[15b] Entity Name":
                        0,
                    "[15b] FEIN":
                        0,
                    "[15c] Total pass through credits from additional schedule":
                        0,
                    "[15d] Total pass through credits (add lines 15a through 15c)":
                        credit.line15d,
                    "[16] Total research credits (add lines 14 and 15d). Form 3 and 5S filers stop here .":
                        credit.line16,
                    "[16a] Fiduciaries - Fill in the amount of credit allocated to beneficiaries":
                        0,
                    "[16b] Fiduciaries - Subtract line 16a from line 16 .":
                        0,
                    "[17] Multiply line 16 (line 16b for fiduciary) by .25 (25%)":
                        split.line17,
                    "[18] Amount of credit from line 16 (line 16b for fiduciary) used to offset tax":
                        split.line18,
                    "[19] Subtract line 18 from line 16 (line 16b for fiduciary)":
                        split.line19,
                    "[20] Enter the lesser of line 17 or line 19. This is the refundable portion of the credit":
                        split.line20,
                    "[21] Subtract line 20 from line 19. This is the remaining nonrefundable portion of the credit":
                        split.line21,
                    "[22] Carryover of prior year\u2019s unused research credit. Include Schedule CF":
                        split.line22,
                    "[23] Add lines 18, 21, and 22. This is the total nonrefundable portion of the credit. Include Schedule CF if the credit was not used in full":
                        split.line23,
                }
            },
        };
    }

    // ── Rounding utility ───────────────────────────────────────────────────
    round2(value: any): number {
        if (value === null || value === undefined) return value;
        if (Decimal.isDecimal(value)) return value.toDecimalPlaces(2).toNumber();
        if (typeof value === "number" || typeof value === "string")
            return new Decimal(value).toDecimalPlaces(2).toNumber();
        return value;
    }
}