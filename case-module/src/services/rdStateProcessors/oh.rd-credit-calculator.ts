import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";


export interface ConfigJson {
    sub_con_percent: number;
    credit_earned_percent: number;
}

/**
 * 
 */
export class RdCreditCalculatorForOH {

    country = "USA";
    creditType = "State R&D Credit - OH";
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
    async compute(config: ConfigJson, stateRdData: StateRDData) {
        const current_year_wages = new Decimal(stateRdData.currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(stateRdData.currentYearQREs.contract || 0).mul(config.sub_con_percent) || 0;
        const total_current_year_qre = current_year_wages.plus(current_year_contract);

        const qreSum = stateRdData.prior3YearsQREs.map(item => ({
            fiscalYear: item.fiscalYear,
            wagesContractSum: new Decimal(item.wages || 0).plus(Number(item.contract || 0))
        }));
        logMessage(`${JSON.stringify(qreSum)}`)
        const prev1_qre = new Decimal(qreSum[0]?.wagesContractSum || 0);
        const prev1_year = qreSum[0]?.fiscalYear;
        const prev2_qre = new Decimal(qreSum[1]?.wagesContractSum || 0);
        const prev2_year = qreSum[1]?.fiscalYear;
        const prev3_qre = new Decimal(qreSum[2]?.wagesContractSum || 0);
        const prev3_year = qreSum[2]?.fiscalYear;

        const tot_prev_year_qre = prev1_qre.plus(prev2_qre).plus(prev3_qre);
        const average_tot_prev_qre = tot_prev_year_qre.div(3);

        const excess_qre = total_current_year_qre.minus(average_tot_prev_qre);
        logMessage(`EXCESS_${excess_qre}`)
        const final_excess_qre = new Decimal(excess_qre.lt(0) ? 0 : excess_qre);

        const final_credits_earned = final_excess_qre.mul(config.credit_earned_percent);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
        });

        const computeFieldsResp = {
            prev1_qre,
            prev2_qre,
            prev3_qre,
            average_tot_prev_qre: this.round2(average_tot_prev_qre),
            total_current_year_qre,
            tot_prev_year_qre,
            final_excess_qre: this.round2(final_excess_qre),
            final_credits_earned: this.round2(final_credits_earned),
            prev1_year,
            prev2_year,
            prev3_year
        }
        const computedFields = await this.buildComputedFields(computeFieldsResp);

        return {
            inputFields,
            computedFields
        }


    }

    /**
    * 
    * @param value 
    * @returns 
    */
    round2(value: Decimal | number): Decimal {
        return new Decimal(value).toDecimalPlaces(2);
    }

    /**
    * 
    * @param currentYearQREs 
    * @param prior3YearsQREs 
    * @param metadata 
    * @returns 
    */
    async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], metadata: any = {}) {

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
            },
            qreSummary
        };
    }

    /**
     * 
     * @param part4ASCCreditCalculationInfo 
     * @param part5DevelopmentTaxCreditCalculationInfo 
     * @returns 
     */
    buildComputedFields(computeFieldsResp: any) {
        let finalData = {
            "Average Investment in Qualifying Research Expenses for Three Preceding Taxable Years:":"",
            [`Tax Year ${computeFieldsResp.prev1_year} QREs`]:computeFieldsResp.prev1_qre,
            [`Tax Year ${computeFieldsResp.prev2_year} QREs`] :computeFieldsResp.prev2_qre,
            [`Tax Year ${computeFieldsResp.prev3_year} QREs`]: computeFieldsResp.prev3_qre,
            "Average": computeFieldsResp.average_tot_prev_qre,
            "Total Investment in Qualifying Research Expense for Calendar Year 2025":computeFieldsResp.total_current_year_qre,
            "Average Investment in Qualifying Research Expenses for Three Preceding Calendar Years":computeFieldsResp.tot_prev_year_qre,
            "Net Excess of Qualifying Research Expenses for the Taxable Year":computeFieldsResp.final_credits_earned   
        }
        return {
            computed_fields: {
                credit_calculation: finalData
            }
        }
    }
}