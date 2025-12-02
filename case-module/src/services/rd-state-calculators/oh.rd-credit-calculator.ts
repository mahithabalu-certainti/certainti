import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import FinancialRDPreviewService from "../financialRDCredit/financialRDPreviewService"

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

    private financialRDPreviewService: FinancialRDPreviewService;
    private loadData: any;

    constructor() {
        this.financialRDPreviewService = new FinancialRDPreviewService();
        this.loadData = this.financialRDPreviewService.loadDataForOH()
    }

    /**
     * 
     * @param config 
     * @param currentYearQREs 
     * @param annualGrossReceipts 
     * @param totalGrossReceipts 
     * @param prior3YearsQREs 
     * @param priorYearsCount 
     */
    async compute(config: any, currentYearQREs: any, annualGrossReceipts: any[], totalGrossReceipts: Decimal, prior3YearsQREs: any[], priorYearsCount: number) {
        const extractConfig = this.extractConfigJson(config.config_json);
        logMessage(`Computing CO Credit with config: ${JSON.stringify(extractConfig)}`);

        const current_year_wages = new Decimal(currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(currentYearQREs.contract).mul(extractConfig.sub_con_percent) || 0;
        const total_current_year_qre = current_year_wages.plus(current_year_contract);

        const qreSum = prior3YearsQREs.map(item => ({
            fiscalYear: item.fiscalYear,
            wagesContractSum: new Decimal(item.wages || 0).plus(Number(item.contract || 0))
        }));
        logMessage(`${JSON.stringify(qreSum)}`)
        const prev1_qre = new Decimal(qreSum[0]?.wagesContractSum || 0);
        const prev2_qre = new Decimal(qreSum[1]?.wagesContractSum || 0);
        const prev3_qre = new Decimal(qreSum[2]?.wagesContractSum || 0);

        const tot_prev_year_qre = prev1_qre.plus(prev2_qre).plus(prev3_qre);
        const average_tot_prev_qre = tot_prev_year_qre.div(3);

        const excess_qre = total_current_year_qre.minus(average_tot_prev_qre);
        logMessage(`EXCESS_${excess_qre}`)
        const final_excess_qre = new Decimal(excess_qre.lt(0) ? 0 : excess_qre);

        const final_credits_earned = final_excess_qre.mul(extractConfig.credit_earned_percent);

         const inputFields = await this.buildInputParams(currentYearQREs, prior3YearsQREs, {
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
            final_excess_qre : this.round2(final_excess_qre),
            final_credits_earned: this.round2(final_credits_earned)
        }
        const computedFields = await this.buildComputedFields(computeFieldsResp);

        return {
            inputFields,
            computedFields
        }


    }

    /**
     * 
     * @param configJson 
     * @returns 
     */
    extractConfigJson(configJson: any): ConfigJson {
        // If it's already an object, just return it
        if (typeof configJson === 'object') {
            return configJson as ConfigJson;
        }

        // If it's a string, parse it
        try {
            return JSON.parse(configJson) as ConfigJson;
        } catch (error) {
            console.error('Failed to parse config_json:', error);
            return {} as ConfigJson; // fallback
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
    async buildInputParams(currentYearQREs: any, prior3YearsQREs: any[], metadata: any = {}) {

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
        return {
            computed_fields: {
                credit_calculation: computeFieldsResp
            }
        }
    }
}