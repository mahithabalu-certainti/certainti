import { Decimal } from "decimal.js";
import { AnnualGrossReceipt, QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";


export interface ConfigJson {
    max_credit_cap_percent: number;
    tax_base_cap_percent: number;
    tax_credit_rate_percent: number;
}

/**
 * 
 */
export class RdCreditCalculatorForGA {

    country = "USA";
    creditType = "State R&D Credit - GA";
    currency = "USD";

    /**
     * 
     * @param config 
     * @param stateRdData 
     * @param totalGrossReceipts 
     * @param priorYearsCount 
     * @returns 
     */
    async compute(config: ConfigJson, stateRdData: StateRDData, fiscalYear : string, year : string, caseDetails : Case) {
        const inputInfo = this.computeInputInformation(stateRdData.currentYearQREs, stateRdData.annualGrossReceipts || [],caseDetails);
        const ratioCalculationInfo = this.ratioCalculation(stateRdData.prior3YearsQREs, stateRdData.annualGrossReceipts || []);
        const baseAmountInfo = this.taxBaseCalculation(inputInfo.curent_year_gross_receipts, ratioCalculationInfo.average_ratio, config);
        const taxCreditInfo = this.taxCreditCalculation(inputInfo.current_year_qre, baseAmountInfo.base_amount, config);
        const creditAndCarryForwardInfo = this.creditAndCreditForwardCalculation(inputInfo.current_year_tax_liability, new Decimal(taxCreditInfo.tax_credit), config);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, stateRdData.annualGrossReceipts || [], {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear
        });

        const computedFields = await this.buildComputedFields(inputInfo, ratioCalculationInfo, baseAmountInfo, taxCreditInfo, creditAndCarryForwardInfo,config);

        return {
            inputFields,
            computedFields
        }
    }

    /**
     * 
     * @param currentYearQREs 
     * @param annualGrossReceipts 
     * @returns 
     */
    computeInputInformation(currentYearQREs: QRE, annualGrossReceipts: AnnualGrossReceipt[], caseDetails : Case) {
        const wages = currentYearQREs.wages || 0;
        const supplies = currentYearQREs.supplies || 0;
        const contract = currentYearQREs.contract || 0;
        const tax_liability = currentYearQREs.business_tax_liability || 0;
        const currentYearGrossReceipts = new Decimal(caseDetails.current_year_gross_receipts || 0.00)

        //Total current year QREs
        const totalCurrentYearQREs = new Decimal(wages).plus(new Decimal(supplies)).plus(new Decimal(contract));

        // const currentYearGrossReceipts = annualGrossReceipts.find(
        //     (item) => item.fiscalYear === this.getCurrentFiscalYear()
        // )?.grossReceipts || 0;

        //Enter current year - any other credit for GA State
        //TODO: Placeholder as the actual calculation depends on additional data not provided.
        const totalOfAllOtherCredits = new Decimal(0)

        //Enter any carry forward from prior years for GA State
        //TODO: Placeholder as the actual calculation depends on additional data not provided.
        const carryForwardPriorYear = new Decimal(caseDetails.credit_carry_forward_py || 0.00);

        const currentYearTaxLiability = tax_liability;

        return {
            current_year_qre: totalCurrentYearQREs,
            curent_year_gross_receipts: currentYearGrossReceipts,
            total_of_all_other_credits: totalOfAllOtherCredits,
            carry_forward_prior_year: carryForwardPriorYear,
            current_year_tax_liability: currentYearTaxLiability
        }
    }

    /**
     * 
     * @param prior3YearsQREs 
     * @param annualGrossReceipts 
     * @returns 
     */
    ratioCalculation(prior3YearsQREs: QRE[], annualGrossReceipts: AnnualGrossReceipt[]) {

        const details = prior3YearsQREs.map(qreItem => {

            const grossReceiptsItem = annualGrossReceipts.find(
                r => r.fiscalYear === qreItem.fiscalYear
            );

            const prior_qre = Number(qreItem.qre || 0);
            const prior_receipts = Number(grossReceiptsItem?.grossReceipts || 0);

            const ratio = prior_receipts > 0 ? new Decimal(this.round2((prior_qre / prior_receipts) * 100)) : new Decimal(0);

            return {
                fiscal_year: qreItem.fiscalYear,
                prior_qre,
                prior_receipts,
                ratio
            };
        });
        // sum of ratios
        const sum_ratio = details.reduce((sum, item) => sum + Number(item.ratio), 0);

        return {
            previous_years: details,
            sum_ratio,
            average_ratio: this.round2(sum_ratio / 3)
        };
    }

    /**
     * 
     * @param curent_year_gross_receipts 
     * @param average_ratio 
     */
    taxBaseCalculation(curent_year_gross_receipts: Decimal, average_ratio: Decimal, config: ConfigJson) {
        const taxBaseRate = new Decimal(this.round2(Decimal.min(average_ratio, config.tax_base_cap_percent * 100)));
        const baseAmount = new Decimal(curent_year_gross_receipts).mul(taxBaseRate.div(100));
        return {
            current_year_gross_receipt: curent_year_gross_receipts,
            tax_base_rate: taxBaseRate,
            base_amount: baseAmount
        };
    }

    /**
     * 
     * @param current_year_qre 
     * @param base_amount 
     * @param config 
     * @returns 
     */
    taxCreditCalculation(current_year_qre: Decimal, base_amount: Decimal, config: ConfigJson) {
        const difference = current_year_qre.minus(base_amount);
        const tax_credit = difference.gt(0) ? difference.mul(config.tax_credit_rate_percent) : 0;
        return {
            current_year_qre: current_year_qre,
            difference: difference,
            tax_credit: tax_credit
        }
    }

    /**
     * 
     * @param current_year_tax_liability 
     * @param tax_credit 
     * @param config 
     * @returns 
     */
    creditAndCreditForwardCalculation(current_year_tax_liability: number, tax_credit: Decimal, config: ConfigJson) {
        //TODO:2) Value of all Other Credits Claimed - C
        const value_of_other_credit_claimed = new Decimal(0);

        const remaining_tax_liability = new Decimal(current_year_tax_liability).minus(value_of_other_credit_claimed);
        const max_credits_allowed = remaining_tax_liability.mul(config.max_credit_cap_percent);
        const research_tax_credit = tax_credit.gt(0) ? tax_credit : 0;
        const tax_carryover_py = new Decimal(0);
        const total_tax_credit = new Decimal(research_tax_credit).plus(tax_carryover_py);
        const credit_claimed_return = total_tax_credit.lte(max_credits_allowed) ? total_tax_credit : max_credits_allowed;
        const unused_credit = total_tax_credit.gte(credit_claimed_return) ? total_tax_credit.minus(credit_claimed_return) : 0;

        return {
            current_year_tax_liability,
            value_of_other_credit_claimed,
            remaining_tax_liability,
            max_credits_allowed,
            research_tax_credit,
            tax_carryover_py,
            total_tax_credit,
            credit_claimed_return,
            unused_credit
        }
    }

    /**
     * 
     * @param date 
     * @returns 
     */
    getCurrentFiscalYear(date: Date = new Date()): number {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12

        // Fiscal year starts in April
        return month >= 4 ? year : year - 1;
    }

    /**
     * 
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @param annualGrossReceipts 
     * @param metadata 
     * @returns 
     */
    async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], annualGrossReceipts: AnnualGrossReceipt[], metadata: any = {}) {

        const qreSummary: Record<string, any> = {
            wages: currentYearQREs.wages,
            supplies: currentYearQREs.supplies,
            contract: currentYearQREs.contract
        };

        // Add prior 4 years gross receipts
        annualGrossReceipts.forEach((item, i) => {
            qreSummary[`prior_year_gross_receipts_${i + 1}`] = item.grossReceipts || 0;
        });

        // Add prior 3 years QREs
        prior3YearsQREs.forEach((item, i) => {
            qreSummary[`prior_year_qre_${i + 1}`] = item.qre || 0;
        });


        return {
            metadata: {
                country: metadata.country || "US",
                credit_type: metadata.creditType || "FEDERAL_RRC_ASC",
                currency: metadata.currency || "USD",
                "Fiscal Year Ended" : metadata.fiscalYearEnded,
                "Description": "Research Tax Credit",
                stateDetails : "Georgia -  Credit Calculations"
            },
        };
    }

    /**
     * 
     * @param inputInfo 
     * @param ratioCalculationInfo 
     * @param baseAmountInfo 
     * @param taxCreditInfo 
     * @param creditAndCarryForwardInfo 
     * @returns 
     */
    buildComputedFields(inputInfo: any, ratioCalculationInfo: any, baseAmountInfo: any, taxCreditInfo: any, creditAndCarryForwardInfo: any,config:any) {
        // Prepare table rows for Ratio Calculation
        const ratioTableHeaders = [
            "3 Previous Years",
            "Georgia Research Expenses",
            "Georgia Gross Receipts",
            "Equals Ratio (%)"
        ];
        const ratioTableRows = ratioCalculationInfo.previous_years.map((item: any) => ({
            "3 Previous Years": item.fiscal_year,
            "Georgia Research Expenses": item.prior_qre,
            "Georgia Gross Receipts": item.prior_receipts,
            "Equals Ratio (%)": `${item.ratio}%`
        }));

        return {
            "Input Information": {
                "Current Year Georgia Gross Receipts (A)" : inputInfo.curent_year_gross_receipts,
                "Current Year Research Expenses in Georgia (B)" : inputInfo.current_year_qre,
                "Total of all other credits (C)": inputInfo.total_of_all_other_credits,
                "Credit carry-over from PY (D)": inputInfo.carry_forward_prior_year,
                "Current Tax Liability Without Credits (E)" : inputInfo.current_year_tax_liability
            },
            tables: {
                "Ratio Calculation": {
                    table_headers: ratioTableHeaders,
                    table_rows: ratioTableRows,
                    Total: ratioCalculationInfo.sum_ratio
                },
                "Calculation of Average": {
                    table_headers: ["Total - F", "Average Research Ratio (F/3) - G"],
                    table_rows: [
                        {
                            "Total - F": `${ratioCalculationInfo.sum_ratio}%`,
                            "Average Research Ratio (F/3) - G": `${ratioCalculationInfo.average_ratio}%`
                        }
                    ]
                },
                "Calculation of Tax Base": {
                    table_headers: ["Current Year Georgia Gross Receipts - A", `Lesser of G or ${config.tax_credit_rate_percent}%`, "Base Amount"],
                    table_rows: [
                        {
                            "Current Year Georgia Gross Receipts - A": baseAmountInfo.current_year_gross_receipt,
                            [`Lesser of G or ${config.tax_credit_rate_percent}%`]: `${baseAmountInfo.tax_base_rate}%`,
                            "Base Amount (H)": baseAmountInfo.base_amount
                        }
                    ]
                },
                "Calculation of Tax Credit": {
                    table_headers: ["Current Year Research Expense - B", "Base Amount From - H", "Difference - I", `Tax Credit (${config.tax_base_cap_percent}% of I)`],
                    table_rows: [
                        {
                            "Current Year Research Expense - B": taxCreditInfo.current_year_qre,
                            "Base Amount From - H": baseAmountInfo.base_amount,
                            "Difference - I": taxCreditInfo.difference,
                            [`Tax Credit (${config.tax_base_cap_percent}% of I)`]: taxCreditInfo.tax_credit
                        }
                    ]
                }
            },
            "Application of Credit and Carry-Forward": {
                "1) Current Tax Liability w/o applied credits - E" : creditAndCarryForwardInfo.current_year_tax_liability,
                "2) Value of all Other Credits Claimed - C" : creditAndCarryForwardInfo.value_of_other_credit_claimed,
                "3) Remaining Tax Liability (C-E)" : creditAndCarryForwardInfo.remaining_tax_liability,
                "4) Maximum Credit Allowed (Line 3 * 50%)" : creditAndCarryForwardInfo.max_credits_allowed,
                "5) Research Tax Credit - J" : creditAndCarryForwardInfo.research_tax_credit,
                "5a)Tax Carryover from PY - D": creditAndCarryForwardInfo.tax_carryover_py,
                "6) Total available Research Tax Credit (J+D)" : creditAndCarryForwardInfo.total_tax_credit,
                "7) Credit to be claimed on return  (lesser of line 4 or 6)" : creditAndCarryForwardInfo.credit_claimed_return,
                "8) Unused Credit or Carry-Forward" : creditAndCarryForwardInfo.unused_credit
            }
        }
    }

    
    /**
     * 
     * @param value 
     * @returns 
     */
    round2(value: any) {
    if (value === null || value === undefined) return value;

    // ✅ Handle Decimal.js instances
    if (Decimal.isDecimal(value)) {
        return value.toDecimalPlaces(2).toNumber();
    }

    // Handle numbers / numeric strings
    if (typeof value === "number" || typeof value === "string") {
        return new Decimal(value).toDecimalPlaces(2).toNumber();
    }

    return value;
}

}