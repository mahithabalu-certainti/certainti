import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * Minnesota R&D Credit Calculator
 *
 * Form: M30-I — Credit for Increasing Research Activities
 *
 * Key differences from other states:
 *  - Uses prior 4 years gross INCOME (not gross receipts) × 25% to derive average (line 20)
 *  - Fixed-base % (line 14) is derived from 1984–1988 historical data — treated as 0/blank
 *    for most modern filers; when 0, line 20 is used DIRECTLY as line 21 (startup path)
 *  - Tiered credit rates: 10% on first $2,000,000 of excess QRE, 4% on anything above
 *  - Final credit (line 33) is limited to MN occupation tax (line 32); when 0, line 31 is used
 *  - Unused tentative credit carries forward up to 15 years (line 34)
 *
 * Line-by-line logic:
 *
 *   QRE Section (lines 1–7)
 *   Line 1  : Wages for qualified services
 *   Line 2  : Cost of supplies
 *   Line 3  : Computer rental costs
 *   Line 4  : Contract expenses × sub_con_percent%
 *   Line 5  : Basic research payments (hardcoded 0 — not in scope)
 *   Line 6  : Development contributions (hardcoded 0 — not in scope)
 *   Line 7  : Total MN QRE = sum(lines 1–6)
 *
 *   Lines 8–13: 1984–1988 historical gross income — not applicable for modern filings
 *   Line 14 : Fixed-base % (config; 0 = not established → startup path)
 *
 *   Base Amount Section (lines 15–23)
 *   Lines 15–18 : Prior 4 years gross income
 *   Line 19 : Sum of lines 15–18
 *   Line 20 : Line 19 × 25%
 *   Line 21 : Line 20 × fixedBasePct  OR  line 20 directly when fixedBasePct = 0
 *   Line 22 : Line 7 × 50%  (floor / safety net)
 *   Line 23 : max(line 21, line 22)  ← base amount
 *
 *   Credit Computation (lines 24–29)
 *   Line 24 : max(line 7 − line 23, 0)           ← excess QRE
 *   Line 25 : min(line 24, tier1_threshold)        ← tier 1 portion (≤ $2M)
 *   Line 26 : line 24 − line 25                   ← tier 2 portion (> $2M)
 *   Line 27 : line 25 × tier1_rate% (10%)
 *   Line 28 : line 26 × tier2_rate% (4%)
 *   Line 29 : line 27 + line 28                   ← current year credit
 *
 *   Final Credit (lines 30–34)
 *   Line 30 : Credit carryover from prior year
 *   Line 31 : line 29 + line 30                   ← tentative credit
 *   Line 32 : MN occupation tax limitation (Form M30-I line 28)
 *   Line 33 : min(line 31, line 32) — if line 32 = 0, use line 31  ← FINAL CREDIT
 *   Line 34 : line 31 − line 33                   ← carryover to next year
 *
 * Carryforward: Up to 15 years for unused credit.
 */

export interface ConfigJson {
    /** Applicable percentage of contract expenses — default 65 (i.e. 65%) */
    sub_con_percent: number;

    /**
     * Fixed-base percentage derived from 1984–1988 historical data (line 14).
     * Set to 0 when not established (startups or companies without 1984–1988 records).
     * When 0: line 21 = line 20 directly (startup path per MN form instructions).
     * When > 0: line 21 = line 20 × fixedBasePct.
     * Maximum value: 16 (i.e. 16%) per MN form cap.
     */
    fixed_base_percentage: number;
    gross_credit_percentage:number;
    qre_credit_percentage_c1: number;

    /** Credit rate applied to tier 1 excess (up to tier1_threshold) — default 10 (i.e. 10%) */
    qre_credit_percentage_c2: number;

    /** Credit rate applied to tier 2 excess (above tier1_threshold) — default 4 (i.e. 4%) */
    qre_credit_percentage_c3: number;

    /** Dollar threshold separating tier 1 and tier 2 — default 2_000_000 */
    qre_threshold_amount: number;
}

export class RdCreditCalculatorForMN {

    country    = "USA";
    creditType = "State R&D Credit - MN";
    currency   = "USD";

    async compute(
        config: ConfigJson,
        stateRdData: StateRDData,
        fiscalYear: string,
        year: number,
        caseData: Case
    ) {
        logMessage(`Computing MN Credit — fiscal year: ${fiscalYear}`);
        logMessage(`MN config: ${JSON.stringify(config)}`);

        const creditResult   = this.computeCredit(config, stateRdData, caseData);
        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear : year
        },config);
        const computedFields = this.buildComputedFields(creditResult, config, year);

        return {
            inputFields,
            computedFields,
            finalCredit:               creditResult.final_allowed_credit,   // line 33
            totalQRE:                  creditResult.total_mn_qre,            // line 7
            totalWages:                this.round2(new Decimal(stateRdData.currentYearQREs.wages    ?? 0)),
            totalContract:             this.round2(new Decimal(stateRdData.currentYearQREs.contract ?? 0)),
            totalSupplies:             this.round2(new Decimal(stateRdData.currentYearQREs.supplies ?? 0)),
            averageAnnualGrossIncome:  creditResult.avg_gross_income,        // line 20
            carryoverToNextYear:       creditResult.carryover_to_next_year,  // line 34
        };
    }

    // -------------------------------------------------------------------------
    // Core credit computation
    // -------------------------------------------------------------------------
    private computeCredit(config: ConfigJson, stateRdData: StateRDData, caseData: Case) {
        const { wages = 0, supplies = 0, contract = 0 } = stateRdData.currentYearQREs;

        //---- Line 1: Wages
        const line1 = new Decimal(wages);

        //---- Line 2: Supplies
        const line2 = new Decimal(supplies);

        //---- Line 3: Computer rental costs
        const line3 = new Decimal((caseData as any).lease_costs_of_computers_mn ?? 0);

        //---- Line 4: Contract expenses × sub_con_percent%
        const line4 = new Decimal(contract).mul(config.sub_con_percent / 100);

        //---- Lines 5 & 6: Basic research / development contributions — not in scope
        const line5 = new Decimal((caseData as any).basic_research_amount_mn ?? 0);
        const line6 =  new Decimal((caseData as any).nonprofit_development_contributions_mn ?? 0);

        //---- Line 7: Total MN QRE
        const line7 = line1.plus(line2).plus(line3).plus(line4).plus(line5).plus(line6);

        // Lines 8–13: 1984–1988 historical data — not applicable, skipped

        //---- Lines 15–18: Prior 4 years gross income (oldest → newest)
        //     annualGrossReceipts[0] = most recent prior year (e.g. 2024)
        //     annualGrossReceipts[1] = 2023, [2] = 2022, [3] = 2021
        const priorQRE = stateRdData.prior3YearsQREs ?? [];
        const line15 = new Decimal(priorQRE[0]?.qre ?? 0); // most recent prior
        const line16 = new Decimal(priorQRE[1]?.qre ?? 0);
        const line17 = new Decimal(priorQRE[2]?.qre ?? 0);
        const line18 = new Decimal(priorQRE[3]?.qre ?? 0); // oldest

        //---- Line 19: Sum of lines 15–18
        const line19 = line15.plus(line16).plus(line17).plus(line18);

        //---- Line 20: Average gross income × 25% (25% is fixed per MN form)
        const line20 = line19.mul(config.gross_credit_percentage);

        //---- Line 21: Base income amount
        //    DUAL PATH:
        //    - fixedBasePct > 0 (established company): line21 = line20 × fixedBasePct
        //    - fixedBasePct = 0 (startup / not established): line21 = line20 directly
        //    This is confirmed by Excel: line23=91,250=line20 when fixedBasePct=0
        const fixedBasePct = config.fixed_base_percentage;
        const line21 = fixedBasePct > 0
            ? line20.mul(fixedBasePct / 100)
            : line20;

        //---- Line 22: Floor = totalQRE × 50%
        const line22 = line7.mul(config.qre_credit_percentage_c1 / 100);

        //---- Line 23: Base amount = max(line21, line22)
        const line23 = Decimal.max(line20, line22);

        //---- Line 24: Excess QRE = max(line7 − line23, 0)
        const line24 = Decimal.max(line7.minus(line23), 0);

        //---- Line 25: Tier 1 portion = min(line24, tier1_threshold)
        const line25 = Decimal.min(line24, new Decimal(config.qre_threshold_amount));

        //---- Line 26: Tier 2 portion = line24 − line25
        const line26 = line24.minus(line25);

        //---- Line 27: Tier 1 credit = line25 × tier1_rate%
        const line27 = line25.mul(config.qre_credit_percentage_c2 / 100);

        //---- Line 28: Tier 2 credit = line26 × tier2_rate%
        const line28 = line26.mul(config.qre_credit_percentage_c3 / 100);

        //---- Line 29: Current year credit = line27 + line28
        const line29 = line27.plus(line28);

        //---- Line 30: Credit carryover from prior year
        const line30 = new Decimal(0);

        //---- Line 31: Tentative credit = line29 + line30
        const line31 = line29.plus(line30);

        //---- Line 32: MN occupation tax limitation (Form M30-I line 28)
        const line32 = new Decimal((caseData as any).credit_tax_limit_mn?? 0);

        //---- Line 33: Final allowed credit
        //    When line32 = 0 (no occupation tax / not applicable), use line31 directly
        const line33 = line32.gt(0)
            ? Decimal.min(line31, line32)
            : line31;

        //---- Line 34: Carryover to next year = line31 − line33
        const line34 = line31.minus(line33);

        return {
            // QRE lines
            wages:              this.round2(line1),
            supplies:           this.round2(line2),
            computer_rental:    this.round2(line3),
            contract:           this.round2(line4),
            total_mn_qre:       this.round2(line7),
            // Prior gross income lines
            gross_income_yr1:   this.round2(line15),
            gross_income_yr2:   this.round2(line16),
            gross_income_yr3:   this.round2(line17),
            gross_income_yr4:   this.round2(line18),
            sum_gross_income:   this.round2(line19),
            avg_gross_income:   this.round2(line20),
            // Base amount lines
            fixed_base_pct:     fixedBasePct,
            base_income_amount: this.round2(line21),
            qre_floor:          this.round2(line22),
            base_amount:        this.round2(line23),
            // Credit computation lines
            excess_qre:         this.round2(line24),
            tier1_portion:      this.round2(line25),
            tier2_portion:      this.round2(line26),
            tier1_credit:       this.round2(line27),
            tier2_credit:       this.round2(line28),
            current_credit:     this.round2(line29),
            // Final credit lines
            prior_carryover:    this.round2(line30),
            tentative_credit:   this.round2(line31),
            occupation_tax:     this.round2(line32),
            final_allowed_credit: this.round2(line33),
            carryover_to_next_year: this.round2(line34),
            config,
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
                        credit_type: metadata.creditType || "STATE_RD_MN",
                        currency: metadata.currency || "USD",
                        "Fiscal Year Ended" : metadata.fiscalYearEnded,
                        "Description": "Research Tax Credit",
                        stateDetails : "Minnesota - Credit Calculations"
                    },
                    "Current & Prior years information" : storeData
                };
            }

    // -------------------------------------------------------------------------
    // Computed fields builder — exact Excel label text (M30-I form)
    // year = current fiscal year (e.g. 2025); prior-year labels are derived from it
    // -------------------------------------------------------------------------
    private buildComputedFields(
        r: ReturnType<RdCreditCalculatorForMN["computeCredit"]>,
        config: ConfigJson,
        year: number
    ) {
        const py1 = year - 1;   // most recent prior year  (line 15)
        const py2 = year - 2;   // 2nd prior year          (line 16)
        const py3 = year - 3;   // 3rd prior year          (line 17)
        const py4 = year - 4;   // 4th prior year          (line 18)

        const line34Key = `[34] Credit carryover to ${year} (see instructions)`;

        return {
            computed_fields: {
                "Minnesota Credit for Increasing Research Activities (M30-I)": {
                    "[1] Wages for qualifed services (do not include wages used in figuring the work opportunity credit)":
                        r.wages,
                    "[2] Cost of supplies":
                        r.supplies,
                    "[3] Amounts paid or incurred for the right to use computers to conduct research":
                        r.computer_rental,
                    "[4] Applicable percentage of contract expenses":
                        r.contract,
                    "[5] Amount paid to qualified research organizations for basic research":
                        0,
                    "[6] Development contributions to a nonprofit organization":
                        0,
                    "[7] Total qualified research expenses in Minnesota for the tax year (add lines 1 through 6)":
                        r.total_mn_qre,
                    "[14] Fixed base percentage (divide line 13B by line 13A; do not fill in more than 16% [.16]). Start-up companies, see instructions":
                        `${r.fixed_base_pct}%`,
                    [`[15] Tax year ${py1}`]: r.gross_income_yr1,
                    [`[16] Tax year ${py2}`]: r.gross_income_yr2,
                    [`[17] Tax year ${py3}`]: r.gross_income_yr3,
                    [`[18] Tax year ${py4}`]: r.gross_income_yr4,
                    "[19] Add lines 15 through 18":
                        r.sum_gross_income,
                    "[20] Average annual gross income/mine value (multiply line 19 by 25% [.25])":
                        r.avg_gross_income,
                    "[21] Multiply line 20 by the percentage on line 14":
                        r.base_income_amount,
                    [`"[22] Multiply line 7 by ${config.qre_credit_percentage_c1} (${config.qre_credit_percentage_c1 / 100})`]:
                        r.qre_floor,
                    "[23] Base amount (enter amount from line 21 or line 22, whichever is greater)":
                        r.base_amount,
                    "[24] Subtract line 23 from line 7 (if result is zero or less, leave blank)":
                        r.excess_qre,
                    [`[25] Enter the amount from line 24 or $${config.qre_threshold_amount.toLocaleString()}, whichever is less`]:
                        r.tier1_portion,
                    "[26] Subtract line 25 from line 24":
                        r.tier2_portion,
                    [`[27] Multiply line 25 by ${config.qre_credit_percentage_c2}% (.${String(config.qre_credit_percentage_c2).padStart(2,"0")})`]:
                        r.tier1_credit,
                    [`[28] Multiply line 26 by ${config.qre_credit_percentage_c3}% (.0${config.qre_credit_percentage_c3})`]:
                        r.tier2_credit,
                    "[29] Current credit (add lines 27 and 28)":
                        r.current_credit,
                    [`[30] Credit carryover from ${py2}`]:
                        r.prior_carryover,
                    "[31] Tentative credit (add lines 29 and 30)":
                        r.tentative_credit,
                    "[32] Limitation (see instructions)":
                        r.occupation_tax,
                    "[33] Credit for increasing research activities (enter line 31 or line 32, whichever is less). Enter this amount on M30-I, line 29.":
                        r.final_allowed_credit,
                    [line34Key]: r.carryover_to_next_year,
                },
            
            },
        };
    }

    // -------------------------------------------------------------------------
    // Rounding utility — consistent with AZ / CA / CO / KS / LA implementations
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