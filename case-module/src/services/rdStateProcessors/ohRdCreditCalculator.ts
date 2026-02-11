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
    async compute(config: ConfigJson, stateRdData: StateRDData, fiscalYear : string, year? : number) {
        const current_year_wages = new Decimal(stateRdData.currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(stateRdData.currentYearQREs.contract || 0).mul(config.sub_con_percent/100) || 0;
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

        const final_credits_earned = final_excess_qre.mul(config.credit_earned_percent/100);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear : year
        },config);

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
            prev3_year,
            year
        }
        const computedFields = await this.buildComputedFields(computeFieldsResp, config, year!);

        return {
            inputFields,
            computedFields,
            finalCredit: this.round2(final_credits_earned),
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
    async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], metadata: any = {},config : ConfigJson ) {

        let storeData : any[] = []
        let currentYearContract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent/100) || 0;
        storeData.push({
            year : metadata.currentYear,
            wages: currentYearQREs.wages,
            contract: currentYearContract,
            sum: this.round2(new Decimal(currentYearQREs.wages || 0).plus(currentYearContract) || 0)
        })

        prior3YearsQREs.forEach((item) => {
            storeData.push({
                year : item.fiscalYear,
                wages: item.wages,
                contract: item.contract,
                sum: this.round2(new Decimal(item.wages || 0).plus(Number(item.contract || 0)))
            })
        });



        return {
            metadata: {
                country: metadata.country || "US",
                credit_type: metadata.creditType || "FEDERAL_RRC_ASC",
                currency: metadata.currency || "USD",
                "Fiscal Year Ended" : metadata.fiscalYearEnded,
                "Description": "Research Tax Credit",
                stateDetails : "Ohio Credit Calculation"
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
    buildComputedFields(computeFieldsResp: any, config : ConfigJson, year : number) {
        logMessage(`COMPUTE_FIELDS_RESP_${JSON.stringify(computeFieldsResp)}`)
        let finalData = {
            "Average Investment in Qualifying Research Expenses for Three Preceding Taxable Years:":JSON.stringify(computeFieldsResp.year),
            [`Tax Year ${year - 1} QREs`]:Number(computeFieldsResp.prev1_qre) || 0,
            [`Tax Year ${year - 2} QREs`] :Number(computeFieldsResp.prev2_qre) || 0,
            [`Tax Year ${year - 3} QREs`]: Number(computeFieldsResp.prev3_qre) || 0,
            "Average": Number(computeFieldsResp.average_tot_prev_qre) || 0,
            [`Total Investment in Qualifying Research Expense for Calendar Year ${computeFieldsResp.year}`]:Number(computeFieldsResp.total_current_year_qre) || 0,
            "Average Investment in Qualifying Research Expenses for Three Preceding Calendar Years":Number(computeFieldsResp.average_tot_prev_qre) || 0,
            "Net Excess of Qualifying Research Expenses for the Taxable Year":Number(computeFieldsResp.final_excess_qre) || 0,
            [`${computeFieldsResp.year} Credit Earned (${config.credit_earned_percent}%)`] : Number(computeFieldsResp.final_credits_earned) || 0
        }
        return {
            computed_fields: {
                "NoTitle": finalData
            }
        }
    }
}