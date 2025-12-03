import { Decimal } from "decimal.js";
import { QRE, StateRDData } from "../financialRDCredit/rdCreditTypes";


export interface ConfigJson {
    sub_con_percent: number;
    credit_rate: number;
    fixed_base_percentage: number;
    credit_earned: number;
}

/**
 * 
 */
export class RdCreditCalculatorForID {

    country = "USA";
    creditType = "State R&D Credit - ID";
    currency = "USD";

    /**
     * 
     * @param config 
     * @param currentYearQREs 
     * @param annualGrossReceipts 
     * @param totalGrossReceipts 
     * @param prior3YearsQREs 
     * @param priorYearsCount 
     * To load mock Data : stateRdData = StateMockDataLoadMap["ID"]!;
     */
    async compute(config: ConfigJson, stateRdData: StateRDData) {
        const qreCalInfo = this.qreCreditCalculation(stateRdData.currentYearQREs, config);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
        });

        const computedFields = await this.buildComputedFields(qreCalInfo);

        return {
            inputFields,
            computedFields
        }
    }

    /**
     * 
     * @param currentYearQREs 
     * @param config 
     */
    qreCreditCalculation(currentYearQREs: QRE, config: ConfigJson) {
        const current_year_wages = new Decimal(currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent) || 0;

        const supplies = 0;
        const cost_to_rent = 0;

        const total_current_year_qre = current_year_wages.plus(current_year_contract);
        const fixed_base_percentage = config.fixed_base_percentage * 100;
        const average_annual_gross_receipts = 0;
        const base_amount = new Decimal(0);
        const difference = total_current_year_qre.minus(base_amount);
        const credit_rate_percent = total_current_year_qre.mul(config.credit_rate);
        const min_credit_rate = Decimal.min(difference, credit_rate_percent);
        const tot_base_amount = base_amount.plus(credit_rate_percent);
        const credit_earned = tot_base_amount.mul(config.credit_earned);
        const final_credit = credit_earned;
        const tot_credit_avail = final_credit;

        return {
            current_year_wages,
            current_year_contract,
            total_current_year_qre,
            fixed_base_percentage,
            difference,
            credit_rate_percent,
            min_credit_rate,
            tot_base_amount,
            credit_earned,
            final_credit,
            tot_credit_avail
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

        // Add prior 3 years QREs
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
    buildComputedFields(qretInfo: any) {
        return {
            computed_fields: {
                qre: qretInfo
            }
        }
    }
}