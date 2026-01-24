import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";

export interface ConfigJson {
    average_qret_rate_50pct: number;
    sub_con_percent: number;
    qre_rate_5pct: number;
    qre_rate_6_25pct: number;
    wages_rate_2_5pct: number;
    wages_rate_3_125pct: number;
}


export class RdCreditCalculatorForTX {

    country = "USA";
    creditType = "State R&D Credit - TX";
    currency = "USD";

    /**
     * Computes TX state R&D credit values for the given configuration and state R&D data.
     * @param config Configuration values used for the TX R&D credit calculation.
     * @param stateRdData State R&D data for TX, including currentYearQREs, prior3YearsQREs, and related fields.
     */
    async compute(config: ConfigJson, stateRdData: StateRDData, fiscalYear : string) {

        const qretInfo = this.creditCalculationQRET(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, config)
        const precedingWithQretInfo = this.precedingCalculationWithQRET(qretInfo, config);
        const precedingWithNoQretInfo = this.precedingCalculationWithNoQRET(qretInfo, precedingWithQretInfo.average_prev_year_qre, config);
        const qreActivitiesCreditInfo = this.qreActivitiesCredit(precedingWithQretInfo.credit_eq_zero, precedingWithQretInfo.credit_gt_zero, precedingWithNoQretInfo.credit_eq_zero, precedingWithNoQretInfo.credit_gt_zero);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear
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

        const tot_prev_year_qre = new Decimal(qretInfo.prev1_qre)
            .plus(qretInfo.prev2_qre)
            .plus(qretInfo.prev3_qre);

        // Line 5
        const average_prev_year_qre = tot_prev_year_qre.div(3)

        // Line 6
        const average_qret_rate_50pct = average_prev_year_qre.mul(
            new Decimal(config.average_qret_rate_50pct).div(100)
        );

        // Line 7
        const difference = new Decimal(qretInfo.total_current_year_qre)
            .minus(average_qret_rate_50pct);

        // Line 8
        const credit_eq_zero =
            new Decimal(qretInfo.qret_high_edu_contract).eq(0)
            ? difference.mul(new Decimal(config.qre_rate_5pct).div(100))
            : "N/A";

        const credit_gt_zero =
            new Decimal(qretInfo.qret_high_edu_contract).gt(0)
            ? difference.mul(new Decimal(config.qre_rate_6_25pct).div(100))
            : "N/A";

        return {
            average_prev_year_qre: average_prev_year_qre,
            average_qret_rate_50pct: average_qret_rate_50pct,
            difference: difference,
            credit_eq_zero:
            credit_eq_zero instanceof Decimal ? credit_eq_zero : credit_eq_zero,
            credit_gt_zero:
            credit_gt_zero instanceof Decimal ? credit_gt_zero : credit_gt_zero,
            config
        };
    }


    /**
     * 
     * @param qretInfo 
     * @param average_prev_year_qre 
     * @param config 
     * @returns 
     */
    precedingCalculationWithNoQRET(qretInfo: any, average_prev_year_qre: Decimal, config: ConfigJson) {
        const credit_eq_zero = new Decimal(qretInfo.qret_high_edu_contract).eq(0) ? average_prev_year_qre.mul(config.wages_rate_2_5pct/100) : "N/A";
        const credit_gt_zero = new Decimal(qretInfo.qret_high_edu_contract).gt(0) ? average_prev_year_qre.mul(config.wages_rate_3_125pct/100) : "N/A";
        return {
            credit_eq_zero: credit_eq_zero instanceof Decimal ? this.round2(credit_eq_zero) : credit_eq_zero,
            credit_gt_zero: credit_gt_zero instanceof Decimal ? this.round2(credit_gt_zero) : credit_gt_zero,
            config: config
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
     * Rounds the given value to two decimal places using Decimal.js.
     * @param value Value to be rounded.
     * @returns The rounded value as a Decimal with two decimal places.
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
    * Builds a normalized input object for the RD credit calculation engine.
    * Aggregates the current-year qualified research expenses (QREs) together
    * with summaries of the prior three years' QREs, and attaches metadata (such as country, credit type, and currency) with sensible defaults.
    * @param currentYearQREs The current fiscal year's qualified research expenses.
    * @param prior3YearsQREs An array of QRE records for each of the prior three fiscal years.
    * @param metadata Optional metadata, including country, creditType, and currency.
    * @returns An object containing normalized metadata and the aggregated qreSummary. 
    */
    async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], metadata: any = {}) {
        let storeData : any[] = []
        storeData.push({
            year : metadata.currentYear,
            wages: currentYearQREs.wages,
            supplies: currentYearQREs.supplies,
            contract: currentYearQREs.contract
        })
        const qreSummary: Record<string, any> = {
            wages: currentYearQREs.wages,
            supplies: currentYearQREs.supplies,
            contract: currentYearQREs.contract
        };

        // Add prior 3 years QREs
        prior3YearsQREs.forEach((item) => {
            storeData.push({
                year : item.fiscalYear,
                wages: item.wages,
                contract: item.contract,
                sum: new Decimal(item.wages || 0).plus(Number(item.contract || 0))
            })
        });



        return {
            metadata: {
                country: metadata.country || "US",
                credit_type: metadata.creditType || "FEDERAL_RRC_ASC",
                currency: metadata.currency || "USD",
                "Fiscal Year Ended" : metadata.fiscalYearEnded,
                "Description": "Research Tax Credit",
                stateDetails : "Texas - Credit Calculation"
            },
            "Current & Prior years information" : storeData
        };
    }

    /**
     * Builds the computed_fields structure for the TX RD credit response.
     * @param qretInfo Information about the current year QRET calculation.
     * @param precedingWithQretInfo Information about preceding years with QRET.
     * @param precedingWithNoQretInfo Information about preceding years with no QRET.
     * @param qreActivitiesCreditInfo Information about QRET activities credit details.
     */
    buildComputedFields(qretInfo: any, precedingWithQretInfo: any, precedingWithNoQretInfo: any, qreActivitiesCreditInfo: any) {
          let qret = {
            "1a. Total QRET for the period covered by this report":qretInfo.total_current_year_qre,
            "1b. QRET under higher education contracts for the period covered by this report ":"",
            "2a. Total QRET in 1st preceding tax period":qretInfo.prev1_qre,
            "2b. QRET under higher education contracts for the 1st preceding tax period":"",
            "3a. Total QRET in 2nd preceding tax period":qretInfo.prev2_qre,
            "3b. QRET under higher education contracts for the 2nd preceding tax period":"",
            "4a. Total QRET in 3rd preceding tax period":qretInfo.prev3_qre,
            "4b. QRET under higher education contracts for the 3rd preceding tax period":""
        }

        let precedingWithQret ={
            "5. Average QRET for preceding periods":precedingWithQretInfo.average_prev_year_qre,
           [`6. Average QRET x ${precedingWithQretInfo.config.average_qret_rate_50pct}%`]:precedingWithQretInfo.average_qret_rate_50pct,
            "7. Difference":precedingWithQretInfo.difference,
            [`8. Credit (If amount in Item 1b is zero, multiply Item 7 by ${precedingWithQretInfo.config.average_qret_rate_50pct};`]:precedingWithQretInfo.credit_eq_zero,
            [`9. Credit  (If amount in Item 1b is greater than zero, multiply Item 7 by ${precedingWithQretInfo.config.average_qret_rate_50pct})`]: precedingWithQretInfo.credit_gt_zero
        }
       
        let precedingWithNoQret = {
            [`10. Credit (If amount in Item 1b is zero, multiply Item 1a by ${precedingWithQretInfo.config.qre_rate_5pct}`]:precedingWithNoQretInfo.credit_eq_zero,
            [`11. Credit (If amount in Item 1b is greater than zero, multiply item 1a by ${precedingWithQretInfo.config.qre_rate_6_25pct})`]:precedingWithNoQretInfo.credit_gt_zero
        }
        let qreActivitiesCredit = {
            "12. R&D activities credit" : qreActivitiesCreditInfo.rd_credit_activities,
            "13. R&D activities credit carried forward from prior years":qreActivitiesCreditInfo.rd_credit_activities_carry_forward,
            "14. R&D activities credit available":qreActivitiesCreditInfo.rd_credit_activities_avail

        }
        return {
            computed_fields: {
                "Qualified Research Expenses in Texas (QRET)": qret,
                "Credit Calculation for Entities with 3 preceding periods of QRET ": precedingWithQret,
                "Credit Calculation for Entities with no QRET in one or more of the 3 preceding periods": precedingWithNoQret,
                "Research and Development (R&D) Activities Credit": qreActivitiesCredit
            }
        }
    }
}