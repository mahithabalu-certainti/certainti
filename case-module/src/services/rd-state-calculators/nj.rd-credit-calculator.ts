import { Decimal } from "decimal.js";
import { QRE, StateRDData } from "../financialRDCredit/rdCreditTypes";

export interface ConfigJson {
    credit_rate: number;
    sub_con_percent: number;
    fixed_base_percent: number;
}

/**
 * 
 */

export class RdCreditCalculatorForNJ {

    country = "USA";
    creditType = "State R&D Credit - NJ";
    currency = "USD";

    /**
     * 
     * @param config 
     * @param currentYearQREs 
     * @param annualGrossReceipts 
     * @param totalGrossReceipts 
     * @param prior3YearsQREs 
     * @param priorYearsCount 
     * To load mock Data : stateRdData = StateMockDataLoadMap["NJ"]!;
     * @returns 
     */
    async compute(config: ConfigJson, stateRdData: StateRDData, totalGrossReceipts: Decimal, priorYearsCount: number) {
        const part4ASCCreditCalculationInfo = this.part4ASCCreditCalculation(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, config);
        const part5DevelopmentTaxCreditCalculationInfo = this.part5DevelopmentTaxCreditCalculation(new Decimal(part4ASCCreditCalculationInfo.final_credit), config);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
        });

        const computedFields = await this.buildComputedFields(part4ASCCreditCalculationInfo, part5DevelopmentTaxCreditCalculationInfo);

        return {
            inputFields,
            computedFields
        }

    }

    /**
     * 
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @param config 
     * @returns 
     */
    part4ASCCreditCalculation(currentYearQREs: QRE, prior3YearsQREs: QRE[], config: ConfigJson) {

        const current_year_wages = new Decimal(currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent) || 0;

        const total_current_year_qre = current_year_wages.plus(current_year_contract);

        const qreSum = prior3YearsQREs.map(item => ({
            fiscalYear: item.fiscalYear,
            wagesContractSum: new Decimal(item.wages || 0).plus(Number(item.contract || 0))
        }));

        const total_prev_qre = new Decimal(qreSum.reduce((sum, item) => sum + Number(item.wagesContractSum), 0));
        const average_tot_prev_qre = total_prev_qre.div(config.fixed_base_percent * 100);
        const sub_credit = total_current_year_qre.minus(average_tot_prev_qre);
        const final_credit = sub_credit.gt(0) ? sub_credit : 0;

        return {
            current_year_wages,
            current_year_contract,
            total_current_year_qre,
            total_prev_qre,
            average_tot_prev_qre: this.round2(average_tot_prev_qre),
            sub_credit: this.round2(sub_credit),
            final_credit: this.round2(final_credit)
        }
    }

    /**
     * 
     * @param part4_final_credit 
     * @param config 
     * @returns 
     */
    part5DevelopmentTaxCreditCalculation(part4_final_credit: Decimal, config: ConfigJson) {
        const tot_credit = this.round2(part4_final_credit.mul(config.credit_rate));

        return {
            part4_final_credit: this.round2(part4_final_credit),
            tot_credit,
            tot_available_credit: tot_credit
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
    * @param annualGrossReceipts 
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
    buildComputedFields(part4ASCCreditCalculationInfo: any, part5DevelopmentTaxCreditCalculationInfo: any) {
        return {
            computed_fields: {
                part4_asc_credit: part4ASCCreditCalculationInfo,
                part5_dev_tax_credit: part5DevelopmentTaxCreditCalculationInfo
            }
        }
    }
}