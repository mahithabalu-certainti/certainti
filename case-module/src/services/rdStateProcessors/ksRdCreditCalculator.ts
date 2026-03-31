import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * Kansas R&D Credit Calculator
 *
 * Form: K-53 — Research and Development Credit
 *
 * Logic (K-53 Part A & Part B):
 *
 *   Part A — Maximum Allowable Credit
 *   Line 1 : Total current year R&D expenditures (wages + machinery + other/contract)
 *   Line 2a: First preceding year expenditures
 *   Line 2b: Second preceding year expenditures (if applicable)
 *   Line 3 : Total  = Line 1 + Line 2a + Line 2b
 *   Line 4 : Average = Line 3 ÷ 3
 *   Line 5 : Expenditure amount for credit = max(Line 1 − Line 4, 0)
 *   Line 6 : Total credit = Line 5 × 10%
 *   Line 7 : Maximum allowable credit in any one year = Line 6 × 25%
 *
 *   Part B — Allowed Credit for Current Year
 *   Line 8 : Tax liability (after all other credits)
 *   Line 9 : Allowable credit = min(Line 7, Line 8)
 *             If Line 8 is not provided (0 / unknown), Line 7 is used as the final credit.
 *
 * Carryforward: Up to 16 years for unused credit.
 */

export interface ConfigJson {
    /** Percentage applied to excess expenditures — default 10 (i.e. 10%) */
    qre_credit_percentage_c1: number;
    /** Percentage of total credit claimable in any one year — default 25 (i.e. 25%) */
    qre_credit_percentage_c2: number;
    /** Percentage of contract expenses included — default 65 (i.e. 65%) */
    sub_con_percent: number;
}

export class RdCreditCalculatorForKS {

    country    = "USA";
    creditType = "State R&D Credit - KS";
    currency   = "USD";

    async compute(
        config: ConfigJson,
        stateRdData: StateRDData,
        fiscalYear: string,
        year: number,
        caseData: Case
    ) {
        logMessage(`Computing KS Credit — fiscal year: ${fiscalYear}`);

        const partAResult    = await this.partA(config, stateRdData);
        const partBResult    = await this.partB(partAResult.maximumAnnualCredit, stateRdData);
       
        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear : year
        },config);
        const computedFields = this.buildComputedFields(partAResult, partBResult, config);

        return {
            inputFields,
            computedFields,
            finalCredit:   partBResult.allowableCredit,
            totalQRE:      partAResult.currentYearTotal,
            totalWages:    this.round2(new Decimal(stateRdData.currentYearQREs.wages    ?? 0)),
            totalContract: this.round2(new Decimal(stateRdData.currentYearQREs.contract ?? 0)),
            totalSupplies: this.round2(new Decimal(stateRdData.currentYearQREs.supplies ?? 0)),
        };
    }

    // -------------------------------------------------------------------------
    // Part A — Maximum Allowable Credit
    // -------------------------------------------------------------------------
    private partA(config: ConfigJson, stateRdData: StateRDData) {
        const { wages = 0, supplies = 0, contract = 0 } = stateRdData.currentYearQREs;

        //---- Line 1a: Machinery and Equipment — mapped to supplies
        const line1a = new Decimal(supplies);

        //---- Line 1b: Payroll — mapped to wages
        const line1b = new Decimal(wages);

        //---- Line 1c: Other (contract research at applicable sub-con %)
        const line1c = new Decimal(contract).mul(config.sub_con_percent / 100);

        //---- Line 1: Total current year R&D expenditures
        const line1 = line1a.plus(line1b).plus(line1c);

        //---- Line 2a: First preceding year expenditures (total QRE)
        const priorYear1 = stateRdData.prior3YearsQREs?.[0];
        const line2a     = new Decimal(priorYear1?.qre ?? 0);

        //---- Line 2b: Second preceding year expenditures (total QRE)
        const priorYear2 = stateRdData.prior3YearsQREs?.[1];
        const line2b     = new Decimal(priorYear2?.qre ?? 0);

        //---- Line 3: Total (Line 1 + 2a + 2b)
        const line3 = line1.plus(line2a).plus(line2b);

        //---- Line 4: Average (Line 3 ÷ 3)
        const line4 = line3.div(3);

        //---- Line 5: Expenditure amount for credit = max(Line 1 − Line 4, 0)
        const line5 = Decimal.max(line1.minus(line4), 0);

        //---- Line 6: Total R&D credit = Line 5 × credit_rate%
        const line6 = line5.mul(config.qre_credit_percentage_c1 / 100);

        //---- Line 7: Maximum allowable credit in any one year = Line 6 × max_annual_credit%
        const line7 = line6.mul(config.qre_credit_percentage_c2 / 100);

        return {
            machinery_and_equipment: this.round2(line1a),
            payroll:                 this.round2(line1b),
            other_contract:          this.round2(line1c),
            currentYearTotal:        this.round2(line1),
            prior_year_1:            this.round2(line2a),
            prior_year_2:            this.round2(line2b),
            three_year_total:        this.round2(line3),
            three_year_average:      this.round2(line4),
            expenditure_for_credit:  this.round2(line5),
            total_credit:            this.round2(line6),
            maximumAnnualCredit:     this.round2(line7),
            config,
        };
    }

    // -------------------------------------------------------------------------
    // Part B — Allowed Credit for Current Year
    // -------------------------------------------------------------------------
    private partB(maximumAnnualCredit: number, stateRdData: StateRDData) {
        //---- Line 8: Tax liability after all other credits
        const line8 = new Decimal((stateRdData as any).taxLiability ?? 0);

        //---- Line 9: Allowable credit = min(Line 7, Line 8)
        //    When line 8 is zero (not supplied), report line 7 as the final credit
        const line9 = line8.gt(0)
            ? Decimal.min(new Decimal(maximumAnnualCredit), line8)
            : new Decimal(maximumAnnualCredit);

        return {
            tax_liability:   this.round2(line8),
            allowableCredit: this.round2(line9),
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
                    credit_type: metadata.creditType || "STATE_RD_KS",
                    currency: metadata.currency || "USD",
                    "Fiscal Year Ended" : metadata.fiscalYearEnded,
                    "Description": "Research Tax Credit",
                    stateDetails : "Kansas - Credit Calculations"
                },
                "Current & Prior years information" : storeData
            };
        }

    // -------------------------------------------------------------------------
    // Computed fields builder — mirrors K-53 form line layout
    // -------------------------------------------------------------------------
    private buildComputedFields(
        partA: ReturnType<RdCreditCalculatorForKS["partA"]>,
        partB: ReturnType<RdCreditCalculatorForKS["partB"]>,
        config: ConfigJson
    ) {
        return {
            computed_fields: {
                "PART A – COMPUTATION OF MAXIMUM ALLOWABLE CREDIT FOR THIS YEAR'S EXPENDITURES": {
                    "[1] Research and development expenditures for current year":                       partA.currentYearTotal,
                    "[1a] Machinery and Equipment":                                                    partA.machinery_and_equipment,
                    "[1b] Payroll":                                                                    partA.payroll,
                    "[1c] Other (contract research expenses)":                                         partA.other_contract,
                    "[2a] First preceding taxable year expenditures":                                  partA.prior_year_1,
                    "[2b] Second preceding taxable year expenditures":                                 partA.prior_year_2,
                    "[3] Total (add lines 1, 2a, and 2b)":                                            partA.three_year_total,
                    "[4] Average (divide line 3 by 3)":                                               partA.three_year_average,
                    "[5] Expenditure amount for credit (line 1 minus line 4, not less than zero)":    partA.expenditure_for_credit,
                    [`[6] Total research and development credit (line 5 × ${config.qre_credit_percentage_c1}%)`]:          partA.total_credit,
                    [`[7] Maximum allowable credit in any one year (line 6 × ${config.qre_credit_percentage_c2}%)`]: partA.maximumAnnualCredit,
                },
                "PART B – COMPUTATION OF ALLOWED CREDIT FOR THIS YEAR'S EXPENDITURES": {
                    "[8] Tax liability for this tax year after all other credits": partB.tax_liability,
                    "[9] Amount of credit allowable (lesser of line 7 or line 8)": partB.allowableCredit,
                }
            },
        };
    }

    // -------------------------------------------------------------------------
    // Rounding utility — consistent with AZ / CA / CO implementations
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