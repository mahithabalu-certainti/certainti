import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { AnnualGrossReceipt, QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * Arizona RD Credit Calculator
 */

export interface ConfigJson {
    tier1_rate: number;
    tier2_rate: number;
    credit_rate: number;
    qre_cap_rate: number;
    tier2_base_add: number;
    threshold_amount: number;
    fixed_base_percentage: number;
}
export class RdCreditCalculatorForAZ {

    country = "USA";
    creditType = "State R&D Credit - AZ";
    currency = "USD";

    /**
     * 
     * @param config 
     * @param currentYearQREs 
     * @param totalGrossReceipts 
     * @param prior3YearsQREs 
     * @param priorYearsCount 
     * @returns 
     */
    async compute(config: ConfigJson, stateRdData: StateRDData, fiscalYear : string, year : number, caseData : Case) {
        
        const priorYearsCount = stateRdData.annualGrossReceipts?.length!;
        console.log("StateData =======> ", stateRdData)
         console.log("StateData.annualGrossReceipts =======> ", stateRdData.annualGrossReceipts)
        const totalGrossReceipts = new Decimal((stateRdData.annualGrossReceipts || []).reduce(
            (sum, r) => sum + (r.grossReceipts || 0), 0));

        const rrcResult = await this.rrc(config, stateRdData.currentYearQREs, totalGrossReceipts, priorYearsCount, caseData);
        const ascResult = await this.asc(config, stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, caseData);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, stateRdData.annualGrossReceipts || [], {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear
        });
        const computedFields = await this.buildComputedFields(ascResult, rrcResult, config);

        return {
            inputFields,
            computedFields
        }

    }

    /**
     * 
     * @param config 
     * @param currentYearQREs 
     * @param totalGrossReceipts 
     * @param priorYearsCount 
     * @returns 
     */
    async rrc(config: ConfigJson, currentYearQREs: any, totalGrossReceipts: Decimal, priorYearsCount: number,caseData : Case) {
        logMessage(`Computing AZ Credit with config: ${JSON.stringify(config)}`);
        //---- Line 10: Prior year credit carryforward
        const line10 = 0;

        //---- Line 11: wages
        const line11 = currentYearQREs.wages || 0;

        //---- Line 12: supplies
        const line12 = currentYearQREs.supplies || 0;

        //---- Line 13: cost to rent
        const line13 = caseData.lease_costs_of_computers || 0;

        //---- Line 14: contract
        const line14 = currentYearQREs.contract || 0;

        const totalCurrentYearQRE = new Decimal(line11 || 0).plus(line12 || 0).plus(line14 || 0).plus(line13 || 0);
        //---- Line 15: total QRE
        const line15 = totalCurrentYearQRE;

        //---- Line 16: average gross receipts
        const line16 = totalGrossReceipts.div(priorYearsCount);

        //---- Line 17: Fixed base percenatge
        const line17 = (config.fixed_base_percentage) || 0;

        //---- Line 18: base amount
        const line18 = line16.mul(new Decimal(line17/100));

        //---- Line 19: excess QRE over base amount
        const line19 = line15.minus(line18);
        const finalLine19 = line19.lt(0) ? new Decimal(0) : line19

        //---- Line 20: Multiply line 15 by 50%
        const line20 = line15.mul(config.qre_cap_rate/100);

        //---- Line 21: Enter smaller of line 19 or line 20
        const line21 = Decimal.min(finalLine19, line20);

        //---- Line 22: Add line 10 and 21
        const line22 = line21.plus(line10);

        let line27a;
        let line23;
        let line24;
        let line25;
        let line26;

        // If line 22 is $2,500,000 or less, complete line 23 and skip lines 24 through 26.
        // If line 22 is more than $2,500,000, skip line 23 and complete lines 24 through 26.
        if (line22.lte(config.threshold_amount)) {
            //-- Line 23: Multiple line 22 by 24%
            line23 = line22.mul(config.credit_rate/100);
            line27a = line23;
        } else {
            line23 = 0
            line24 = line22.minus(config.threshold_amount);
            line25 = line24.mul(config.tier2_rate/100);
            line26 = line25.plus(config.tier2_base_add);
            line27a = line26;
        }

        return {
            prior_year_credit_carryforward: line10,
            wages: line11,
            supplies: line12,
            cost_to_rent: this.round2(line13) || 0.00,
            contract: line14,
            total_current_year_qre: this.round2(line15) || 0.00,
            average_gross_receipts: this.round2(line16) || 0.00,
            fixed_base_percentage: line17,
            base_amount: this.round2(line18) || 0.00,
            excess_qre_over_base: this.round2(line19) || 0.00,
            half_total_qre: this.round2(line20) || 0.00,
            total_section_b_credit: this.round2(line21) || 0.00,
            total_az_credit_before_limits: this.round2(line22) || 0.00,
            credit_if_under_threshold: this.round2(line23),
            excess_amount: this.round2(line24),
            credit_on_excess: this.round2(line25),
            credit_if_over_threshold: this.round2(line26),
            total_az_final_credit: this.round2(line27a),
            config: config
        }
    }

    /**
     * 
     * @param config 
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @returns 
     */
    async asc(config: ConfigJson, currentYearQREs: any, prior3YearsQREs: QRE[], caseData :Case) {
        //---- Line 77:  
        const line77 = new Decimal(currentYearQREs.wages || 0);

        //---- Line 78: wages
        const line78 = new Decimal(currentYearQREs.wages || 0);

        //---- Line 79: supplies
        const line79 = new Decimal(currentYearQREs.supplies || 0);

        //---- Line 80: cost to rent
        const line80 = new Decimal(caseData.lease_costs_of_computers || 0);

        //---- Line 81: contract
        const line81 = new Decimal(currentYearQREs.contract || 0);

        //---- Line 82: total QRE
        const line82 = new Decimal(line78.plus(line79).plus(line80).plus(line81))

        if (await this.ascRuleValidation(prior3YearsQREs)) {
            //---- Line 83: prior 3 years QRE total
            const line83 = new Decimal(prior3YearsQREs.reduce((sum, y) => sum + (y.qre || 0), 0));

            //---- Line 84: Divide line 83 by 6
            const line84 = line83.div(6);

            //---- Line 85: Excess QRE over base amount
            const line85 = Decimal.max(new Decimal(line82).minus(line84), 0);

            //---- Line 86: 50% of current year QRE
            const line86 = line82.mul(config.qre_cap_rate/100);

            //---- Line 87: Enter the lesser of line 85 or line 86
            const line87 = Decimal.min(line85, line86);

            //---- Line 88: Add Line 77 and 87
            const line88 = line87.plus(line77);

            let line93;
            let line89, line90, line91, line92;

            // If line 88 is $2,500,000 or less, complete line 89 and skip lines 90 through 92.
            // If line 88 is more than $2,500,000, skip line 89 and complete lines 90 through 92.
            if (line88.lte(config.threshold_amount)) {
                line89 = line88.mul(config.tier1_rate/100);
                line93 = line89;
            } else {
                line90 = line88.minus(config.threshold_amount);
                line91 = line90.mul(config.tier2_rate/100);
                line92 = line91.plus(config.tier2_base_add);
                line93 = line92;
            }
            return {
                wages: this.round2(line78),
                supplies: this.round2(line79),
                lease_computers : this.round2(line80),
                contract: this.round2(line81),
                total_current_year_qre: this.round2(line82) || 0.00,
                total_prior_3years_qre: this.round2(line83)|| 0.00,
                adjusted_base_amount: this.round2(line84) || 0.00,
                excess_qre: this.round2(line85) || 0.00,
                half_total_qre: this.round2(line86) || 0.00,
                total_section_b_credit: this.round2(line87)|| 0.00,
                prior_year_credit_carryforward: line77 === Decimal(0) ? 0.00 : this.round2(line77).toFixed(2),
                credit_if_under_threshold: this.round2(line89) || 0.00,
                excess_amount: this.round2(line90)|| 0.00,
                credit_on_excess: this.round2(line91) || 0.00,
                credit_if_over_threshold: this.round2(line92)|| 0.00,
                total_az_final_credit: this.round2(line93) || 0.00,
                config: config
            }

        } else {
            logMessage(`ASC AZ Credit not applicable due to prior 3 years QREs validation failure.`);
            return {};
        }
    }



    /**
     * Enter your total qualified research expenses for the prior 3 years. If you have no
     * QREs in any one of those three years, STOP! You do not qualify for the ASC
     * @param prior3YearsQREs 
     */
    async ascRuleValidation(prior3YearsQREs: QRE[]) {
        // ASC rule validation
        const lessThan3Years = prior3YearsQREs.length < 3;
        const hasZeroQRE = prior3YearsQREs.some(y => y.qre === 0);

        const ascEligible = !(lessThan3Years || hasZeroQRE);
        return ascEligible;
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

        // Add prior 3 years QREs
        prior3YearsQREs.forEach((item, i) => {
            qreSummary[`prior_year_qre_${i + 1}`] = item.qre || 0;
        });

        // Add prior 4 years gross receipts
        annualGrossReceipts.forEach((item, i) => {
            qreSummary[`prior_year_gross_receipts_${i + 1}`] = item.grossReceipts || 0;
        });


        return {
            metadata: {
                country: metadata.country || "US",
                credit_type: metadata.creditType || "FEDERAL_RRC_ASC",
                currency: metadata.currency || "USD",
                "Fiscal Year Ended" : metadata.fiscalYearEnded,
                "Description": "Research Tax Credit",
                stateDetails : "Arizona - Credit Calculation"
            },
        };
    }

    /**
     * 
     * @param creditASC 
     * @param creditRRC 
     * @returns 
     */
    async buildComputedFields(creditASC: any, creditRRC: any, config : ConfigJson) {
        let rrc ={
            "11 Wages for qualified services (do not include wages used in figuring the federal work opportunity credit)":creditRRC.wages,
            "12 Cost of supplies":creditRRC.supplies,
            "13 Cost to rent or lease computers":creditRRC.cost_to_rent,
            "14 Contract research expenses: See instructions":creditRRC.contract,
            "15 Total qualified research expenses. Add line 11 through line 14":creditRRC.total_current_year_qre,
            "16 Average annual Arizona gross receipts: See instructions":creditRRC.average_gross_receipts,
            [`17 Fixed-base percentage [not more than ${creditRRC.fixed_base_percentage}%]: See instructions`]:`${creditRRC.fixed_base_percentage}%`,
            "18 Base amount: Multiply line 16 by the percentage on line 17. Enter the result":creditRRC.base_amount,
            "19 Subtract line 18 from line 15. If less than zero, enter 0":creditRRC.excess_qre_over_base,
            [`20 Multiply line 15 by ${creditRRC?.config?.qre_cap_rate}% (${(creditRRC?.config?.qre_cap_rate ) / 100}). Enter the result`]:creditRRC.half_total_qre,
            "21 Enter the lesser of line 19 or line 20":creditRRC.total_section_b_credit,
            "22 Add lines 10 and 21. Enter the total":creditRRC.total_az_credit_before_limits,
           [`* If line 22 is $ ${creditRRC?.config?.threshold_amount} or less, complete line 23 and skip lines 24 through 26.`]:"",
            [`* If line 22 is more than $ ${creditRRC?.config?.threshold_amount}, skip line 23 and complete lines 24 through 26.`]:"",
            [`23 Multiply line 22 by ${creditRRC?.config?.credit_rate}% (${(creditRRC?.config?.credit_rate)/100}). Enter the result`]:creditRRC.credit_if_under_threshold,
            [`24 Subtract $ ${creditRRC?.config?.threshold_amount} from line 22. Enter the difference`]:creditRRC.excess_amount || '',
            [`25 Multiply line 24 by ${creditRRC?.config?.tier2_rate}%. Enter the result`]:creditRRC.credit_on_excess || '',
            [`26 Add ${creditRRC?.config?.tier2_base_add} to line 25. Enter the total`] :creditRRC.credit_if_over_threshold || '',
            "27 a If the taxpayer is electing the regular credit, enter the amount from line 23 or line 26 .":creditRRC.total_az_final_credit || '',
            "27 b If the taxpayer is electing the Alternative Simplified Credit, enter the amount from page":""
        }

        let asc = {
            "75 Basic research payments paid or incurred to qualified organizations:":"",
            "76 Qualified organization base period amount":"",
            "77 Subtract line 76 from line 75. Enter the difference. If less than zero, enter 0.":"",
            "78 Current year wages for qualified services (do not include wages used in figuring the federal work opportunity credit)":creditASC.wages || '',
            "79 Current year cost of supplies":creditASC.supplies || '',
            "80 Current year cost to rent or lease computers":creditASC.lease_computers || '',
            "81 Current contract research expenses: See instructions":creditASC.contract || '',
            "82 Total research expenses for the current year: Add lines 78 through 81. Enter the total":creditASC.total_current_year_qre || '',
            "83 Enter your total qualified research expenses for the prior 3 years. If you have no QREs in any one of those three years, STOP! You do not qualify for the ASC":creditASC.total_prior_3years_qre || '',
            "84 Average qualified research expenses for the prior three years. Divide line 83 by 6.0. Enter the result":creditASC.adjusted_base_amount || '',
            "85 Subtract line 84 from line 82. Enter the difference. If less than zero, enter 0.":creditASC.excess_qre || '',
            [`86 Multiply line 82 by ${creditASC?.config?.qre_cap_rate}% (${creditASC?.config?.qre_cap_rate/100}). Enter the result.`]:creditASC.half_total_qre || '',
            "87 Enter the lesser of line 85 or line 86.":creditASC.total_section_b_credit   || '',
            "88 Add line 77 and line 87. Enter the total":creditASC.prior_year_credit_carryforward || '',
            [`* If line 88 is ${creditASC?.config?.threshold_amount} or less, complete lines 89 and 93. Skip lines 90 through 92.`]:"",
            [`* If line 88 is more than ${creditASC?.config?.threshold_amount}, skip line 89. Complete lines 90 through 93.`]:"",
            [`89 If line 88 is ${creditASC?.config?.threshold_amount} or less, multiply line 88 by ${creditASC?.config?.tier1_rate}% (${creditASC?.config?.tier1_rate/100}). Enter the result.`]:creditASC.credit_if_under_threshold || '',
            [`90 If line 88 is more than ${creditASC?.config?.threshold_amount}, subtract ${creditASC?.config?.threshold_amount} from line 88. Enter the difference.`]:creditASC.excess_amount || '',
            [`91 Multiply line 90 by  ${creditASC?.config?.tier2_rate}%. Enter the result.`]:creditASC.credit_on_excess || '',
            [`92 Add ${creditASC?.config?.tier2_base_add} to line 91. Enter the total. `]:creditASC.credit_if_over_threshold || '',
            "93 Enter the amount from line 89 or 92. Also enter this amount on page 1, Part 2, line 27b of this form and complete the remainder of Form 308.":creditASC.total_az_final_credit || ''
        }


        return {
            computed_fields: {
                "Qualified research expenses paid or incurred.": rrc,
                "Part 12 Current Taxable Year's Alternative Simplified Credit Calculation- (Complete lines 75 through 93 if electing the Alternative Simplified Credit. To elect the regular credit, complete Part 2, lines 8 through 27a.)"    : asc   
            },
            BOLD: ["15 Total qualified research expenses. Add line 11 through line 14"]
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
}