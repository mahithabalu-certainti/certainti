import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import FinancialRDPreviewService from "../financialRDCredit/financialRDPreviewService"

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

    private financialRDPreviewService: FinancialRDPreviewService;
    private loadData: any;

    constructor() {
        this.financialRDPreviewService = new FinancialRDPreviewService();
        this.loadData = this.financialRDPreviewService.loadDataForSC()
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
    async compute(config: ConfigJson, currentYearQREs: any, annualGrossReceipts: any[], totalGrossReceipts: Decimal, prior3YearsQREs: any[], priorYearsCount: number) {
        const current_year_wages = new Decimal(currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(currentYearQREs.contract).mul(config.sub_con_percent) || 0;
        const total_current_year_qre = current_year_wages.plus(current_year_contract);

        const current_year_credit = total_current_year_qre.mul(config.credit_rate);
        const tot_qre_credit = current_year_credit;
        const total_tax_liability = new Decimal(currentYearQREs.business_tax_liability);

        const tot_all_credits_other_than_qre = 0;
        const net_base_amount = total_tax_liability.minus(tot_all_credits_other_than_qre);

        const fifty_percent_credit = net_base_amount.mul(config.carry_forward_credit_rate);
        const final_credit = Decimal.min(tot_qre_credit, fifty_percent_credit);

        const inputFields = await this.buildInputParams(currentYearQREs, prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
        });

        const computeFieldsResp = {
            total_current_year_qre,
            current_year_credit,
            tot_qre_credit,
            total_tax_liability,
            net_base_amount,
            fifty_percent_credit,
            final_credit

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