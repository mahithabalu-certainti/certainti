import { Decimal } from "decimal.js";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";


export interface ConfigJson {
    credit_rate: number;
    carry_forward_credit_rate: number;
    sub_con_percent: number;
}

/**
 * 
 */
export class RdCreditCalculatorForSC {

    country = "USA";
    creditType = "State R&D Credit - SC";
    currency = "USD";

    /**
     * 
     * @param config 
     * @param currentYearQREs 
     * @param annualGrossReceipts 
     * @param totalGrossReceipts 
     * @param prior3YearsQREs 
     * @param priorYearsCount 
     */
    async compute(config: ConfigJson, stateRdData: StateRDData, fiscalYear : string,year : string,caseDetails : Case) {
        const current_year_wages = new Decimal(stateRdData.currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(stateRdData.currentYearQREs.contract || 0).mul(config.sub_con_percent / 100) || 0;
        const total_current_year_qre = current_year_wages.plus(current_year_contract);
        const carry_forward_py = new Decimal(caseDetails.credit_carry_forward_py || 0);

        const current_year_credit = total_current_year_qre.mul(config.credit_rate).div(100);
        const tot_qre_credit = current_year_credit.plus(carry_forward_py);
        const total_tax_liability = new Decimal(stateRdData.currentYearQREs.business_tax_liability || 0);

        const tot_all_credits_other_than_qre = new Decimal(caseDetails.other_credits_total || 0);
        const net_base_amount = total_tax_liability.minus(tot_all_credits_other_than_qre);

        const fifty_percent_credit = net_base_amount.mul(config.carry_forward_credit_rate).div(100);
        const final_credit = Decimal.min(tot_qre_credit, fifty_percent_credit);
        const unused_credit = tot_qre_credit.minus(final_credit);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear:year
        },config);

        const computeFieldsResp = {
            total_current_year_qre,
            current_year_credit,
            tot_qre_credit,
            total_tax_liability,
            net_base_amount,
            fifty_percent_credit,
            final_credit,
            unused_credit,
            config: config,
            tot_all_credits_other_than_qre

        }
        const computedFields = await this.buildComputedFields(computeFieldsResp, config, caseDetails);

        return {
            inputFields,
            computedFields,
            finalCredit: this.round2(final_credit),
            totalQRE: this.round2(total_current_year_qre)
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

    /**
   * 
   * @param currentYearQREs 
   * @param prior3YearsQREs 
   * @param metadata 
   * @returns 
   */
    async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], metadata: any = {},config : ConfigJson) {

         let storeData : any[] = []
         let currentYearContract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent / 100) || 0;       
        storeData.push({
            year : metadata.currentYear,
            wages: currentYearQREs.wages,
            contract: currentYearContract,
            sum: this.round2(new Decimal(currentYearQREs.wages || 0).plus(currentYearContract))
        })
 
        prior3YearsQREs.forEach((item) => {
            storeData.push({
                year : item.fiscalYear,
                wages: item.wages,
                contract: item.contract,
                sum: this.round2(new Decimal(item.wages || 0).plus(Number(item.contract || 0)))
            })
        });
        const qreSummary: Record<string, any> = {
            wages: currentYearQREs.wages,
            supplies: currentYearQREs.supplies,
            contract: currentYearQREs.contract
        };

        prior3YearsQREs.forEach((item) => {
            qreSummary[`${item.fiscalYear}`] = {
                wages: item.wages,
                contract: item.contract,
                sum: new Decimal(item.wages || 0).plus(Number(item.contract || 0))
            }
        });

        return {
            metadata: {
                country: metadata.country || "US",
                credit_type: metadata.creditType || "FEDERAL_RRC_ASC",
                currency: metadata.currency || "USD",
                "Fiscal Year Ended" : metadata.fiscalYearEnded,
                "Description": "Research Tax Credit",
                stateDetails : "South Carolina - Credit Calculation"
            },
            "Current & Prior years information" : storeData
        };
    }

    /**
     * 
     * @param part4ASCCreditCalculationInfo 
     * @param part5DevelopmentTaxCreditCalculationInfo 
     * @returns 
     */
    buildComputedFields(computeFieldsResp: any, config : ConfigJson, caseDetails : Case) {

        let finalData = {
        "[1] Qualified research expenses made in South Carolina.": this.round2(computeFieldsResp.total_current_year_qre),
        [`[2] Enter ${config.credit_rate}% of line 1. This is your current year credit.`]: this.round2(computeFieldsResp.current_year_credit),
        "[3] Research Expenses Credit Carried forward from previous years (attach schedule).": this.round2(caseDetails.credit_carry_forward_py),
        "[4] Line 2 plus line 3 (Total Research Expenses Credit before limitations).": this.round2(computeFieldsResp.tot_qre_credit),
        "[5] Tax Liability (income tax and license fees) before claiming credits.": this.round2(computeFieldsResp.total_tax_liability),
        "[6] Total of all credits other than the Research Expenses Credit": this.round2(computeFieldsResp.tot_all_credits_other_than_qre),
        "[7] Line 5 minus line 6 (If less than zero enter zero).": this.round2(computeFieldsResp.net_base_amount),
        [`[8] Multiply line 7 by ${computeFieldsResp.config.carry_forward_credit_rate} % (${computeFieldsResp.config.carry_forward_credit_rate / 100}).`]: this.round2(computeFieldsResp.fifty_percent_credit),
        "[9] Enter the lesser of line 4 or line 8. (This is the amount of Research Expenses Credit you may use this year.)": this.round2(computeFieldsResp.final_credit),
        "[10] Line 4 minus line 9. (Unused Research Expenses Credit can be carried forward for up to 10 years.)": this.round2(computeFieldsResp.unused_credit)
    };
        return {
            computed_fields: {
                "yesSpilt": finalData
            }
        }
    }
}