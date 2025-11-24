import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";

/**
 * Arizona RD Credit Calculator
 */
export class AZrdCreditCalculator {

    /**
     * 
     * @param config 
     * @param currentYearQREs 
     * @param totalGrossReceipts 
     * @param prior3YearsQREs 
     * @param priorYearsCount 
     * @returns 
     */
    async compute(config: any, currentYearQREs: any, annualGrossReceipts: any[], totalGrossReceipts: Decimal, prior3YearsQREs: { fiscalYear: number; qre: number }[], priorYearsCount: number) {
        const rrcResult = await this.rrcAZ(config, currentYearQREs, totalGrossReceipts, priorYearsCount);
        const ascResult = await this.ascAZ(config, currentYearQREs, prior3YearsQREs);

        const inputFields = await this.buildInputParams(currentYearQREs, prior3YearsQREs, annualGrossReceipts, {
            country: "USA",
            creditType: "State R&D Credit - AZ",
            currency: "USD",
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
    async rrcAZ(config: any, currentYearQREs: any, totalGrossReceipts: Decimal, priorYearsCount: number) {
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
            line23 = line22.mul(config.credit_rate);
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
            total_current_year_qre: line15,
            average_gross_receipts: line16,
            fixed_base_percentage: line17,
            base_amount: line18,
            excess_qre_over_base: line19,
            half_total_qre: line20,
            total_section_b_credit: line21,
            total_az_credit_before_limits: line22,
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
    async ascAZ(config: any, currentYearQREs: any, prior3YearsQREs: { fiscalYear: number; qre: number }[]) {
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
    async ascRuleValidation(prior3YearsQREs: { fiscalYear: number; qre: number }[]) {
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
    async buildInputParams(currentYearQREs: any, prior3YearsQREs: any[], annualGrossReceipts: any[], metadata: any = {}) {

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
        return {
            computed_fields: {
                asc: creditASC,
                rrc: creditRRC
            }
        }
    }
}