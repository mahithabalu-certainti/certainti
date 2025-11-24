import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";

/**
 * California RD Credit Calculator
 */
export class RdCreditCalculatorForCA {

    async compute(config: any, currentYearQREs: any, annualGrossReceipts: any[], totalGrossReceipts: Decimal, prior3YearsQREs: { fiscalYear: number; qre: number }[], priorYearsCount: number) {
        const rrcResult = await this.rrc(config, currentYearQREs, totalGrossReceipts, priorYearsCount);
        const ascResult = {}; //California does NOT have ASC, so return {} or null

        const inputFields = await this.buildInputParams(currentYearQREs, annualGrossReceipts, {
            country: "USA",
            creditType: "State R&D Credit - CA",
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
    async rrc(config: any, currentYearQREs: any, totalGrossReceipts: Decimal, priorYearsCount: number) {
        logMessage(`Computing CA Credit with config: ${JSON.stringify(config)}`);

        //---- Line 5: wages
        const line5 = currentYearQREs.wages || 0;

        //---- Line 6: supplies
        const line6 = currentYearQREs.supplies || 0;

        //---- Line 7: cost to rent
        const line7 = 0;

        //---- Line 8: contract
        const line8 = currentYearQREs.contract.mul(0.65) || 0;

        //---- Line 9: total QREs   
        const line9 = new Decimal(line5).plus(new Decimal(line6)).plus(new Decimal(line7)).plus(new Decimal(line8));

        //---- Line10: Fixed base percentage
        let line10 = new Decimal(config.fixed_base_percentage || 0);

        //---- Line 11: Average annual gross receipts
        const line11 = totalGrossReceipts.div(priorYearsCount);

        //---- Line 12: Computation base
        const line12 = line11.mul(line10);

        //---- Line 13: Excess QREs
        let line13 = Decimal.max(line9.minus(line12), 0);

        //---- Line 14: 50% of current year QRE
        let line14 = line13.mul(config.qre_cap_rate);

        //----Line 15: Smaller of Line 13 or Line 14
        let line15 = Decimal.min(line13, line14);

        //---- Line 16: Credit before carryforward
        let line16 = line15.mul(config.credit_rate);

        //---- Line 17a: 
        let line17a = line16;

        const entities = ["individual", "corporation", "s_corp"];
        const reductionConfig = config.reduction_config;
        const resultsByEntity: any = {};
        for (const entity of entities) {
            const multiplier = reductionConfig[entity] ?? 1;

            const reducedCredit = line17a.mul(multiplier);

            resultsByEntity[entity] = {
                entityType: entity,
                multiplier,
                reducedCredit: reducedCredit
            };
        }

        return {
            wages: line5,
            supplies: line6,
            cost_to_rent: line7,
            contract: line8,
            total_qre: line9,
            fixed_base_percentage: line10,
            average_gross_receipts: line11,
            base_amount: line12,
            excess_qre_over_base: line13,
            half_total_qre: line14,
            smaller_of_excess_or_half: line15,
            credit_before_280c: line16,
            regular_credit: line17a,
            reduced_credit_amount: resultsByEntity
        }

    }

    /**
     * 
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @param annualGrossReceipts 
     * @param metadata 
     * @returns 
     */
    async buildInputParams(currentYearQREs: any, annualGrossReceipts: any[], metadata: any = {}) {

        const qreSummary: Record<string, any> = {
            wages: currentYearQREs.wages,
            supplies: currentYearQREs.supplies,
            contract: currentYearQREs.contract
        };

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