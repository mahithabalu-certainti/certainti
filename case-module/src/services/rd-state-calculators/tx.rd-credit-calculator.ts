import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../financialRDCredit/rdCreditTypes";

export interface ConfigJson {
    average_qret_rate_50pct: number;
    sub_con_percent: number;
    qre_rate_5pct: number;
    qre_rate_6_25pct: number;
    wages_rate_2_5pct: number;
    wages_rate_3_125pct: number;
}

/**
 * 
 */
export class RdCreditCalculatorForTX {

    country = "USA";
    creditType = "State R&D Credit - TX";
    currency = "USD";

    /**
     * 
     * @param config 
     * @param currentYearQREs 
     * @param annualGrossReceipts 
     * @param totalGrossReceipts 
     * @param prior3YearsQREs 
     * @param priorYearsCount 
     * To load mock Data : stateRdData = StateMockDataLoadMap["TX"]!;
     */
    async compute(config: ConfigJson, stateRdData: StateRDData) {

        const qretInfo = this.creditCalculationQRET(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, config)
        const precedingWithQretInfo = this.precedingCalculationWithQRET(qretInfo, config);
        const precedingWithNoQretInfo = this.precedingCalculationWithNoQRET(qretInfo, precedingWithQretInfo.average_prev_year_qre, config);
        const qreActivitiesCreditInfo = this.qreActivitiesCredit(precedingWithQretInfo.credit_eq_zero, precedingWithQretInfo.credit_gt_zero, precedingWithNoQretInfo.credit_eq_zero, precedingWithNoQretInfo.credit_gt_zero);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
        });

        const computedFields = await this.buildComputedFields(qretInfo, precedingWithQretInfo, precedingWithNoQretInfo, qreActivitiesCreditInfo);

        return {
            inputFields,
            computedFields
        }
    }

    /**
     * Qualified Research Expenses in Texas (QRET)	
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @param config 
     */
    creditCalculationQRET(currentYearQREs: QRE, prior3YearsQREs: QRE[], config: ConfigJson) {
        const current_year_wages = new Decimal(currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent) || 0;

        //-----Line1a: Enter Current year QRE for TX State
        const total_current_year_qre = current_year_wages.plus(current_year_contract);
        //----Line1b: QRET under higher education contracts for the period covered by this report
        const qret_high_edu_contract = 0;


        const qreSum = prior3YearsQREs.map(item => ({
            fiscalYear: item.fiscalYear,
            wagesContractSum: new Decimal(item.wages || 0).plus(Number(item.contract || 0))
        }));
        logMessage(`${JSON.stringify(qreSum)}`)
        //----Line2a: Enter prior year QRE for TX State
        const prev1_qre = new Decimal(qreSum[0]?.wagesContractSum || 0);

        //----Line3a: Enter 2 years prior QRE for TX State
        const prev2_qre = new Decimal(qreSum[1]?.wagesContractSum || 0);

        //----Line4a: Enter 3 years prior QRE for TX State
        const prev3_qre = new Decimal(qreSum[2]?.wagesContractSum || 0);

        return {
            total_current_year_qre,
            prev1_qre,
            prev2_qre,
            prev3_qre,
            qret_high_edu_contract
        }
    }

    /**
     * Credit Calculation for Entities with 3 preceding periods of QRET 	
     * @param qretInfo 
     * @param config 
     * @returns 
     */
    precedingCalculationWithQRET(qretInfo: any, config: ConfigJson) {
        const tot_prev_year_qre = new Decimal(qretInfo.prev1_qre).plus(qretInfo.prev2_qre).plus(qretInfo.prev3_qre);
        //----Line5: Average QRET for preceding periods.
        const average_prev_year_qre = tot_prev_year_qre.div(3);

        //----Line6: Average QRET x 50%
        const average_qret_rate_50pct = average_prev_year_qre.mul(config.average_qret_rate_50pct);

        //----Line7: Difference
        const difference = new Decimal(qretInfo.total_current_year_qre).minus(average_qret_rate_50pct);

        //----Line8: Credit.
        //(If amount in Item 1b is zero, multiply Item 7 by 5% (0.05); 
        //otherwise, leave Item 8 blank and calculate credit in Item 9)
        const credit_eq_zero = new Decimal(qretInfo.qret_high_edu_contract).eq(0) ? difference.mul(config.qre_rate_5pct) : "N/A";
        const credit_gt_zero = new Decimal(qretInfo.qret_high_edu_contract).gt(0) ? difference.mul(config.qre_rate_6_25pct) : "N/A";
        return {
            average_prev_year_qre: this.round2(average_prev_year_qre),
            average_qret_rate_50pct: this.round2(average_qret_rate_50pct),
            difference: this.round2(difference),
            credit_eq_zero: credit_eq_zero instanceof Decimal ? this.round2(credit_eq_zero).toNumber() : credit_eq_zero,
            credit_gt_zero: credit_gt_zero instanceof Decimal ? this.round2(credit_gt_zero).toNumber() : credit_gt_zero

        }

    }

    /**
     * 
     * @param qretInfo 
     * @param average_prev_year_qre 
     * @param config 
     * @returns 
     */
    precedingCalculationWithNoQRET(qretInfo: any, average_prev_year_qre: Decimal, config: ConfigJson) {
        const credit_eq_zero = new Decimal(qretInfo.qret_high_edu_contract).eq(0) ? average_prev_year_qre.mul(config.wages_rate_2_5pct) : "N/A";
        const credit_gt_zero = new Decimal(qretInfo.qret_high_edu_contract).gt(0) ? average_prev_year_qre.mul(config.wages_rate_3_125pct) : "N/A";
        return {
            credit_eq_zero: credit_eq_zero instanceof Decimal ? this.round2(credit_eq_zero).toNumber() : credit_eq_zero,
            credit_gt_zero: credit_gt_zero instanceof Decimal ? this.round2(credit_gt_zero).toNumber() : credit_gt_zero
        }
    }

    /**
     * 
     * @param credit_eq_zero_qret 
     * @param credit_gt_zero_qret 
     * @param credit_eq_zero_no_qret 
     * @param credit_gt_zero_no_qret 
     */
    qreActivitiesCredit(credit_eq_zero_qret: any, credit_gt_zero_qret: any, credit_eq_zero_no_qret: any, credit_gt_zero_no_qret: any) {
        const rd_credit_activities =
            [
                credit_eq_zero_qret,
                credit_gt_zero_qret,
                credit_eq_zero_no_qret,
                credit_gt_zero_no_qret
            ].find(v => v !== "N/A") || "No Credit";

        const rd_credit_activities_carry_forward = 0;
        const rd_credit_activities_avail =
            typeof rd_credit_activities === "number" && rd_credit_activities > 0
                ? new Decimal(rd_credit_activities).plus(rd_credit_activities_carry_forward)
                : rd_credit_activities;

        return {
            rd_credit_activities: this.round2(rd_credit_activities),
            rd_credit_activities_carry_forward,
            rd_credit_activities_avail: this.round2(rd_credit_activities_avail)
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
    buildComputedFields(qretInfo: any, precedingWithQretInfo: any, precedingWithNoQretInfo: any, qreActivitiesCreditInfo: any) {
        return {
            computed_fields: {
                qret: qretInfo,
                preceding_with_qret: precedingWithQretInfo,
                preceding_with_no_qret: precedingWithNoQretInfo,
                qret_activities: qreActivitiesCreditInfo
            }
        }
    }
}