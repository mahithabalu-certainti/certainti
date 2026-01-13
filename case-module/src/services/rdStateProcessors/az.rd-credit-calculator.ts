import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { AnnualGrossReceipt, QRE, StateRDData } from "../rdComputation/rdCreditTypes";

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
    async compute(config: ConfigJson, stateRdData: StateRDData) {
        
        const priorYearsCount = 4;
        const totalGrossReceipts = new Decimal((stateRdData.annualGrossReceipts || []).reduce(
            (sum, r) => sum + (r.grossReceipts || 0), 0));

        const rrcResult = await this.rrc(config, stateRdData.currentYearQREs, totalGrossReceipts, priorYearsCount);
        const ascResult = await this.asc(config, stateRdData.currentYearQREs, stateRdData.prior3YearsQREs);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, stateRdData.annualGrossReceipts || [], {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
        });
        const computedFields = await this.buildComputedFields(ascResult, rrcResult);

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
    async rrc(config: ConfigJson, currentYearQREs: any, totalGrossReceipts: Decimal, priorYearsCount: number) {
        logMessage(`Computing AZ Credit with config: ${JSON.stringify(config)}`);
        //---- Line 10: Prior year credit carryforward
        const line10 = 0;

        //---- Line 11: wages
        const line11 = currentYearQREs.wages || 0;

        //---- Line 12: supplies
        const line12 = currentYearQREs.supplies || 0;

        //---- Line 13: cost to rent
        const line13 = 0;

        //---- Line 14: contract
        const line14 = currentYearQREs.contract || 0;

        const totalCurrentYearQRE = new Decimal(currentYearQREs.wages || 0).plus(currentYearQREs.supplies || 0).plus(currentYearQREs.contract || 0);
        //---- Line 15: total QRE
        const line15 = totalCurrentYearQRE;

        //---- Line 16: average gross receipts
        const line16 = totalGrossReceipts.div(priorYearsCount);

        //---- Line 17: Fixed base percenatge
        const line17 = config.fixed_base_percentage;

        //---- Line 18: base amount
        const line18 = line16.mul(new Decimal(line17));

        //---- Line 19: excess QRE over base amount
        const line19 = line15.minus(line18);

        //---- Line 20: Multiply line 15 by 50%
        const line20 = line15.mul(config.qre_cap_rate);

        //---- Line 21: Enter smaller of line 19 or line 20
        const line21 = Decimal.min(line19, line20);

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
            line23 = line22.mul(config.credit_rate).toNumber();
            line27a = line23;
        } else {
            line24 = line22.minus(config.threshold_amount);
            line25 = line24.mul(config.tier2_rate);
            line26 = line25.plus(config.tier2_base_add);
            line27a = line26;
        }

        return {
            prior_year_credit_carryforward: line10,
            wages: line11,
            supplies: line12,
            cost_to_rent: line13,
            contract: line14,
            total_current_year_qre: line15.toNumber(),
            average_gross_receipts: line16.toNumber(),
            fixed_base_percentage: line17,
            base_amount: line18.toNumber(),
            excess_qre_over_base: line19.toNumber(),
            half_total_qre: line20.toNumber(),
            total_section_b_credit: line21.toNumber(),
            total_az_credit_before_limits: line22.toNumber(),
            credit_if_under_threshold: line23,
            excess_amount: line24,
            credit_on_excess: line25,
            credit_if_over_threshold: line26,
            total_az_final_credit: line27a
        }
    }

    /**
     * 
     * @param config 
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @returns 
     */
    async asc(config: ConfigJson, currentYearQREs: any, prior3YearsQREs: QRE[]) {
        //---- Line 77:  
        const line77 = currentYearQREs.wages || 0;

        //---- Line 78: wages
        const line78 = currentYearQREs.wages || 0;

        //---- Line 79: supplies
        const line79 = currentYearQREs.supplies || 0;

        //---- Line 80: cost to rent
        const line80 = 0;

        //---- Line 81: contract
        const line81 = currentYearQREs.contract || 0;

        //---- Line 82: total QRE
        const line82 = new Decimal(line78 + line79 + line80 + line81)

        if (await this.ascRuleValidation(prior3YearsQREs)) {
            //---- Line 83: prior 3 years QRE total
            const line83 = new Decimal(prior3YearsQREs.reduce((sum, y) => sum + (y.qre || 0), 0));

            //---- Line 84: Divide line 83 by 6
            const line84 = line83.div(6);

            //---- Line 85: Excess QRE over base amount
            const line85 = Decimal.max(new Decimal(line82).minus(line84), 0);

            //---- Line 86: 50% of current year QRE
            const line86 = line82.mul(config.qre_cap_rate);

            //---- Line 87: Enter the lesser of line 85 or line 86
            const line87 = Decimal.min(line85, line86);

            //---- Line 88: Add Line 77 and 87
            const line88 = line87.plus(line77);

            let line93;
            let line89, line90, line91, line92;

            // If line 88 is $2,500,000 or less, complete line 89 and skip lines 90 through 92.
            // If line 88 is more than $2,500,000, skip line 89 and complete lines 90 through 92.
            if (line88.lte(config.threshold_amount)) {
                line89 = line88.mul(config.tier1_rate);
                line93 = line89;
            } else {
                line90 = line88.minus(config.threshold_amount);
                line91 = line90.mul(config.tier2_rate);
                line92 = line91.plus(config.tier2_base_add);
                line93 = line92;
            }
            return {
                wages: line78,
                supplies: line79,
                contract: line81,
                total_current_year_qre: line82,
                total_prior_3years_qre: line83,
                adjusted_base_amount: line84,
                excess_qre: line85,
                half_total_qre: line86,
                total_section_b_credit: line87,
                prior_year_credit_carryforward: line77,
                credit_if_under_threshold: line89,
                excess_amount: line90,
                credit_on_excess: line91,
                credit_if_over_threshold: line92,
                total_az_final_credit: line93
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
            },
            qreSummary
        };

    }

    /**
     * 
     * @param creditASC 
     * @param creditRRC 
     * @returns 
     */
    async buildComputedFields(creditASC: any, creditRRC: any) {
        let rrc ={
            "Wages for qualified services (do not include wages used in figuring the federal work opportunity credit)":creditRRC.wages,
            "Cost of supplies":creditRRC.supplies,
            "Cost to rent or lease computers":creditRRC.cost_to_rent,
            "Contract research expenses: See instructions":creditRRC.contract,
            "Total qualified research expenses. Add line 11 through line 14":creditRRC.total_current_year_qre,
            "Average annual Arizona gross receipts: See instructions":creditRRC.average_gross_receipts,
            "Fixed-base percentage [not more than 16% (.1600)]: See instructions":creditRRC.fixed_base_percentage,
            "Base amount: Multiply line 16 by the percentage on line 17. Enter the result":creditRRC.base_amount,
            "Subtract line 18 from line 15. If less than zero, enter 0":creditRRC.excess_qre_over_base,
            "Enter 50% (.50) of line 15":creditRRC.half_total_qre,
            "Multiply line 15 by 50% (.50). Enter the result":creditRRC.half_total_qre,
            "Enter the lesser of line 19 or line 20":creditRRC.total_section_b_credit,
            "Add lines 10 and 21. Enter the total":creditRRC.total_az_credit_before_limits,
            "If line 22 is $2,500,000 or less, complete line 23 and skip lines 24 through 26.":"",
            "If line 22 is more than $2,500,000, skip line 23 and complete lines 24 through 26.":"",
            "Multiply line 22 by 24% (.24). Enter the result":creditRRC.credit_if_under_threshold,
            "Subtract $2,500,000 from line 22. Enter the result":creditRRC.excess_amount,
            "Multiply line 24 by 15% (.15). Enter the result":creditRRC.credit_on_excess,
            "Add $600,000 to line 25. Enter the total":"",
            "If the taxpayer is electing the regular credit, enter the amount from line 23 or line 26 .":creditRRC.total_az_final_credit,
            "If the taxpayer is electing the Alternative Simplified Credit, enter the amount from page":""
        }
        let asc = {
            "Basic research payments paid or incurred to qualified organizations:":"",
            "Qualified organization base period amount":"",
            "Subtract line 76 from line 75. Enter the difference. If less than zero, enter “0”.":"",
            "Current year wages for qualified services (do not include wages used in figuring the federal work opportunity credit)":creditASC.wages,
            "Current year cost of supplies":creditASC.supplies,
            "Current year cost to rent or lease computers":"",
            "Current contract research expenses: See instructions":creditASC.contract,
            "Total research expenses for the current year: Add lines 78 through 81. Enter the total":creditASC.total_current_year_qre,
            "Enter your total qualified research expenses for the prior 3 years. If you have no QREs in any one of those three years, STOP! You do not qualify for the ASC":creditASC.total_prior_3years_qre,
            "Average qualified research expenses for the prior three years. Divide line 83 by 6.0. Enter the result":creditASC.adjusted_base_amount,
            "Subtract line 84 from line 82. Enter the difference. If less than zero, enter 0.":creditASC.excess_qre,
            "Multiply line 82 by 50% (.50). Enter the result.":creditASC.half_total_qre,
            "Enter the lesser of line 85 or line 86.":creditASC.total_section_b_credit,
            "Add line 77 and line 87. Enter the total":creditASC.prior_year_credit_carryforward,
            "If line 88 is $2,500,000 or less, complete lines 89 and 93. Skip lines 90 through 92.":"",
            "If line 88 is more than $2,500,000, skip line 89. Complete lines 90 through 93.":"",
            "If line 88 is $2,500,000 or less, multiply line 88 by 24% (.24). Enter the result.":creditASC.credit_if_under_threshold,
            "If line 88 is more than $2,500,000, subtract $2,500,000 from line 88. Enter the difference.":creditASC.excess_amount,
            "Multiply line 90 by 15% (.15). Enter the result.":creditASC.credit_on_excess,
            "Add $600,000 to line 91. Enter the total. ":creditASC.credit_if_over_threshold,
            "Enter the amount from line 89 or 92. Also enter this amount on page 1, Part 2, line 27b of this form and complete the remainder of Form 308.":creditASC.total_az_final_credit

        }


        return {
            computed_fields: {
                "Qualified research expenses paid or incurred.": rrc,
                "Alternative Simplified Credit. To elect the regular credit, complete Part 2, lines 8 through 27a.)"    : asc   
            }
        }
    }
}