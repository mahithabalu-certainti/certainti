import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";

/**
 * California RD Credit Calculator
 */
export interface ConfigJson {
    credit_rate: number;
    qre_cap_rate: number;
    fixed_base_percentage: number;
    s_corp: number;
    corporation: number;
    individual: number;
    sub_con_percent: number;
}
export class RdCreditCalculatorForCA {

    country = "USA";
    creditType = "State R&D Credit - CA";
    currency = "USD";

    async compute(config: ConfigJson, currentYearQREs: any, annualGrossReceipts: any[], totalGrossReceipts: Decimal, prior3YearsQREs: { fiscalYear: number; qre: number }[], priorYearsCount: number) {
        const rrcResult = await this.rrc(config, currentYearQREs, totalGrossReceipts, priorYearsCount);
        const ascResult = {}; //California does NOT have ASC, so return {} or null

        const inputFields = await this.buildInputParams(currentYearQREs, annualGrossReceipts, {
            country: this.country,
            creditType: this.creditType,
            currency: this.creditType,
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
        logMessage(`Computing CA Credit with config: ${JSON.stringify(config)}`);
        logMessage(`Current Year QREs: ${JSON.stringify(currentYearQREs)}`);

        //---- Line 5: wages
        const line5 = currentYearQREs.wages || 0;

        //---- Line 6: supplies
        const line6 = currentYearQREs.supplies || 0;

        //---- Line 7: cost to rent
        const line7 = 0;

        //---- Line 8: contract
        const line8 = new Decimal(currentYearQREs.contract).mul(config.sub_con_percent) || 0;

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

        //---- Reduced credit amount by entity type
        const s_corp_rate = line17a.mul(config.s_corp).toNumber();
        const corporation_rate = line17a.mul(config.corporation).toNumber();
        const individual_rate = line17a.mul(config.individual).toNumber();

        return {
            wages: line5,
            supplies: line6,
            cost_to_rent: line7,
            contract: line8.toNumber(),
            total_qre: line9.toNumber(),
            fixed_base_percentage: line10.toNumber(),
            average_gross_receipts: line11.toNumber(),
            base_amount: line12.toNumber(),
            excess_qre_over_base: line13.toNumber(),
            half_total_qre: line14.toNumber(),
            smaller_of_excess_or_half: line15.toNumber(),
            credit_before_280c: line16.toNumber(),
            regular_credit: line17a.toNumber(),
            reduced_credit_amount: { s_corp: s_corp_rate, corporation: corporation_rate, individual: individual_rate }
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
}