import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * Maine R&D Credit Calculator
 *
 * Form: Schedule A (Maine Research Expense Credit)
 *
 * Two-part credit:
 *
 *   PART A — Basic Research Payments Credit
 *   Line 1 : Basic research payments in excess of the federal base spent in Maine
 *   Line 2 : Basic research payments credit (Line 1 × 7.5%)
 *
 *   PART B — Qualified Research Expenses Credit
 *   Line 3 : Total qualified research expenses for current year (wages + contract × sub_con%)
 *   Line 4a: Prior year 1 QRE
 *   Line 4b: Prior year 2 QRE
 *   Line 4c: Prior year 3 QRE
 *   Line 4 : Base amount = (4a + 4b + 4c) ÷ 3
 *   Line 5 : Excess QRE = max(Line 3 − Line 4, 0)
 *   Line 6 : QRE credit = Line 5 × 5%
 *
 *   Line 7 : Total research expense credit = Line 2 + Line 6
 *
 * Carryforward: Up to 10 years for unused credit.
 */

export interface ConfigJson {
    /** Credit rate applied to basic research payments — default 7.5 (i.e. 7.5%) */
    basic_research_credit_rate: number;
    /** Credit rate applied to excess QRE — default 5 (i.e. 5%) */
    qre_credit_rate: number;
    /** Percentage of contract research expenses included — default 65 (i.e. 65%) */
    sub_con_percent: number;
}

export class RdCreditCalculatorForME {

    country    = "USA";
    creditType = "State R&D Credit - ME";
    currency   = "USD";

    async compute(
        config: ConfigJson,
        stateRdData: StateRDData,
        fiscalYear: string,
        year: number,
        caseDetails: Case
    ) {
        logMessage(`Computing ME Credit — fiscal year: ${fiscalYear}`);

        const partAResult = this.partA(config, caseDetails);
        const partBResult = this.partB(config, stateRdData, year);
        const totalCredit = this.round2(new Decimal(partAResult.basic_research_credit).plus(partBResult.qre_credit));

        const inputFields = this.buildInputParams(
            stateRdData.currentYearQREs,
            stateRdData.prior3YearsQREs,
            {
                country: this.country,
                creditType: this.creditType,
                currency: this.currency,
                fiscalYearEnded: fiscalYear,
                currentYear: year,
            },
            config
        );

        const computedFields = this.buildComputedFields(partAResult, partBResult, totalCredit, config);

        return {
            inputFields,
            computedFields,
            finalCredit:   totalCredit,
            totalQRE:      partBResult.current_year_qre,
            totalWages:    this.round2(new Decimal(stateRdData.currentYearQREs.wages    ?? 0)),
            totalContract: this.round2(new Decimal(stateRdData.currentYearQREs.contract ?? 0)),
            totalSupplies: this.round2(new Decimal(stateRdData.currentYearQREs.supplies ?? 0)),
        };
    }

    // -------------------------------------------------------------------------
    // Part A — Basic Research Payments Credit
    // -------------------------------------------------------------------------
    private partA(config: ConfigJson, caseDetails: Case) {
        const basic_research_payments = new Decimal(
            (caseDetails as any).basic_research_payments_me ?? 0
        );
        const basic_research_credit = basic_research_payments.mul(config.basic_research_credit_rate / 100);

        return {
            basic_research_payments: this.round2(basic_research_payments),
            basic_research_credit:   this.round2(basic_research_credit),
        };
    }

    // -------------------------------------------------------------------------
    // Part B — Qualified Research Expenses Credit
    // -------------------------------------------------------------------------
    private partB(config: ConfigJson, stateRdData: StateRDData, currentFiscalYear: number) {
        const { wages = 0, contract = 0 } = stateRdData.currentYearQREs;

        // Line 3 — current year QRE (wages + contract × sub_con%)
        const current_year_wages    = new Decimal(wages);
        const current_year_contract = new Decimal(contract).mul(config.sub_con_percent / 100);
        const current_year_qre      = current_year_wages.plus(current_year_contract);

        // Line 4 sub-lines — prior year QREs
        const prior1 = stateRdData.prior3YearsQREs?.[0];
        const prior2 = stateRdData.prior3YearsQREs?.[1];
        const prior3 = stateRdData.prior3YearsQREs?.[2];

        const prior_year_1_qre = new Decimal(prior1?.qre ?? 0);
        const prior_year_2_qre = new Decimal(prior2?.qre ?? 0);
        const prior_year_3_qre = new Decimal(prior3?.qre ?? 0);

        const prior_year_1_label = prior1?.fiscalYear ?? currentFiscalYear - 1;
        const prior_year_2_label = prior2?.fiscalYear ?? currentFiscalYear - 2;
        const prior_year_3_label = prior3?.fiscalYear ?? currentFiscalYear - 3;

        // Line 4 — base amount = sum ÷ 3
        const three_year_total   = prior_year_1_qre.plus(prior_year_2_qre).plus(prior_year_3_qre);
        const base_amount        = three_year_total.div(3);

        // Line 5 — excess QRE
        const excess_qre = Decimal.max(current_year_qre.minus(base_amount), 0);

        // Line 6 — QRE credit
        const qre_credit = excess_qre.mul(config.qre_credit_rate / 100);

        return {
            current_year_wages:    this.round2(current_year_wages),
            current_year_contract: this.round2(current_year_contract),
            current_year_qre:      this.round2(current_year_qre),
            prior_year_1_qre:      this.round2(prior_year_1_qre),
            prior_year_2_qre:      this.round2(prior_year_2_qre),
            prior_year_3_qre:      this.round2(prior_year_3_qre),
            prior_year_1_label,
            prior_year_2_label,
            prior_year_3_label,
            three_year_total:      this.round2(three_year_total),
            base_amount:           this.round2(base_amount),
            excess_qre:            this.round2(excess_qre),
            qre_credit:            this.round2(qre_credit),
        };
    }

    // -------------------------------------------------------------------------
    // Input params builder
    // -------------------------------------------------------------------------
    private buildInputParams(
        currentYearQREs: QRE,
        prior3YearsQREs: QRE[],
        metadata: any = {},
        config: ConfigJson
    ) {
        const currentYearContract = new Decimal(currentYearQREs.contract ?? 0).mul(config.sub_con_percent / 100);

        const storeData: any[] = [
            {
                year:     metadata.currentYear,
                wages:    this.round2(currentYearQREs.wages),
                contract: this.round2(currentYearContract),
                sum:      this.round2(new Decimal(currentYearQREs.wages ?? 0).plus(currentYearContract)),
            },
        ];

        prior3YearsQREs.forEach(item => {
            storeData.push({
                year:     item.fiscalYear,
                wages:    item.wages,
                contract: item.contract,
                sum:      this.round2(new Decimal(item.wages ?? 0).plus(Number(item.contract ?? 0))),
            });
        });

        return {
            metadata: {
                country:              metadata.country    || "US",
                credit_type:          metadata.creditType || "STATE_RD_ME",
                currency:             metadata.currency   || "USD",
                "Fiscal Year Ended":  metadata.fiscalYearEnded,
                "Description":        "Research Tax Credit",
                stateDetails:         "Maine - Credit Calculations",
            },
            "Current & Prior years information": storeData,
        };
    }

    // -------------------------------------------------------------------------
    // Computed fields builder — mirrors Maine Schedule A line layout
    // -------------------------------------------------------------------------
    private buildComputedFields(
        partA: ReturnType<RdCreditCalculatorForME["partA"]>,
        partB: ReturnType<RdCreditCalculatorForME["partB"]>,
        totalCredit: number,
        config: ConfigJson
    ) {
        return {
            computed_fields: {
                "Maine - Credit Calculations": {
                    "[1] Enter the basic research payments in excess of the federal base that were spent for research conducted in Maine included on federal Form 6765, Section A, line 4 or federal Form 6765, Section B, line 17. Attach a copy of federal Form 6765. See instructions":
                        partA.basic_research_payments,

                    [`[2] Basic research payments credit (multiply line 1 by ${config.basic_research_credit_rate}% (${config.basic_research_credit_rate / 100}))`]:
                        partA.basic_research_credit,

                    "[3] Enter total qualified research expenses applied to research conducted in Maine during the taxable year included on federal Form 6765, Section A, line 5 or federal Form 6765, Section B, line 20.":
                        partB.current_year_qre,

                    [`[4a] ${partB.prior_year_1_label}`]:
                        partB.prior_year_1_qre,

                    [`[4b] ${partB.prior_year_2_label}`]:
                        partB.prior_year_2_qre,

                    [`[4c] ${partB.prior_year_3_label}`]:
                        partB.prior_year_3_qre,

                    "[4] Enter the qualified research expenses applied to research conducted in Maine for the three prior tax years. This is the base amount for purpose of calculating the qualified research expense credit. (divide by 3 = base amount)":
                        partB.base_amount,

                    "[5] Qualified research expenses in excess of base amount (line 3 minus line 4)":
                        partB.excess_qre,

                    [`[6] Multiply line 5 by ${config.qre_credit_rate}% (.0${config.qre_credit_rate}). This is your credit for qualified research expenses`]:
                        partB.qre_credit,

                    "[7] Add lines 2 and 6. This is your total research expense credit":
                        totalCredit,
                },
            },
        };
    }

    // -------------------------------------------------------------------------
    // Rounding utility
    // -------------------------------------------------------------------------
    round2(value: any): number {
        if (value === null || value === undefined) return value;
        if (Decimal.isDecimal(value)) return value.toDecimalPlaces(2).toNumber();
        if (typeof value === "number" || typeof value === "string") {
            return new Decimal(value).toDecimalPlaces(2).toNumber();
        }
        return value;
    }
}
