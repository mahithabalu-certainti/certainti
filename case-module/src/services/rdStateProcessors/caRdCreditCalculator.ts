import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * California RD Credit Calculator
 */
export interface ConfigJson {
    qre_credit_percentage_c2: number;
    qre_credit_percentage_c1: number;
    fixed_base_percentage: number;
    s_corp: number;
    corporation: number;
    individual: number;
    sub_con_percent: number;
    reduced_credit_amount_percentage : number
}
export class RdCreditCalculatorForCA {

    country = "USA";
    creditType = "State R&D Credit - CA";
    currency = "USD";

    /**
     * 
     * @param config 
     * @param stateRdData 
     * @param totalGrossReceipts 
     * @param priorYearsCount 
     * @returns 
     */
    async compute(config: ConfigJson, stateRdData: StateRDData, fiscalYear : string, year : number, caseData : Case) {

        const priorYearsCount = 4;
        const totalGrossReceipts = new Decimal((stateRdData.annualGrossReceipts || []).reduce(
            (sum, r) => sum + (r.grossReceipts || 0), 0));

        const rrcResult = await this.rrc(config, stateRdData.currentYearQREs, totalGrossReceipts, priorYearsCount, caseData);
        const ascResult = {}; //California does NOT have ASC, so return {} or null

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.annualGrossReceipts || [], {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear
        });
        const computedFields = await this.buildComputedFields(ascResult, rrcResult, config);

        return {
            inputFields,
            computedFields,
            finalCredit: rrcResult?.reducedCreditAmountPercentageValue,
            totalQRE: rrcResult?.total_qre,
            totalWages: this.round2(stateRdData.currentYearQREs.wages) || 0,
            totalContract: this.round2(stateRdData.currentYearQREs.contract) || 0,
            totalSupplies: this.round2(stateRdData.currentYearQREs.supplies) || 0,
            averageAnnualGrossReceipts: this.round2(rrcResult.average_gross_receipts) || 0
            
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
    async rrc(config: ConfigJson, currentYearQREs: QRE, totalGrossReceipts: Decimal, priorYearsCount: number, caseData : Case) {
        logMessage(`Computing CA Credit with config: ${JSON.stringify(config)}`);
        logMessage(`Current Year QREs: ${JSON.stringify(currentYearQREs)}`);

        //---- Line 5: wages
        const line5 = new Decimal(currentYearQREs.wages ?? 0.00);

        //---- Line 6: supplies
        const line6 = new Decimal(currentYearQREs.supplies ?? 0.00)

        //---- Line 7: cost to rent
        const line7 = new Decimal(caseData.lease_costs_of_computers_ca ?? 0.00)
        const contract = new Decimal(currentYearQREs.contract ?? 0.00)

        //---- Line 8: contract
        const line8 = contract.mul(config.sub_con_percent/100) || 0;

        //---- Line 9: total QREs   
        const line9 = line5.plus(line6).plus(line7).plus(line8);

        //---- Line10: Fixed base percentage
        let line10 = new Decimal(config.fixed_base_percentage || 0).div(100);

        //---- Line 11: Average annual gross receipts
        const line11 = totalGrossReceipts.div(priorYearsCount);

        //---- Line 12: Computation base
        const line12 = line11.mul(line10);

        //---- Line 13: Excess QREs
        let line13 = Decimal.max(line9.minus(line12), 0);

        //---- Line 14: 50% of current year QRE
        let line14 = line9.mul(config.qre_credit_percentage_c1/100);

        //----Line 15: Smaller of Line 13 or Line 14
        let line15 = Decimal.min(line13, line14);

        //---- Line 16: Credit before carryforward
        let line16 = line15.mul(config.qre_credit_percentage_c2/100);

        //---- Line 17a: 
        let line17a = line16;

        //---- Reduced credit amount by entity type
        const s_corp_rate = line17a.mul(config.s_corp/100);
        const corporation_rate = line17a.mul(config.corporation/100);
        const individual_rate = line17a.mul(config.individual/100);
        const reducedCreditAmountPercentage = line17a.mul(config.corporation/100)

        return {
            wages: line5,
            supplies: line6,
            cost_to_rent: line7,
            contract: this.round2(line8),
            total_qre: this.round2(line9),
            fixed_base_percentage: config.fixed_base_percentage,
            average_gross_receipts: this.round2(line11),
            base_amount: this.round2(line12),
            excess_qre_over_base: this.round2(line13),
            half_total_qre: this.round2(line14),
            smaller_of_excess_or_half: this.round2(line15),
            credit_before_280c: this.round2(line16),
            regular_credit: this.round2(line17a),
            reduced_credit_amount: { s_corp: this.round2(s_corp_rate), corporation: this.round2(corporation_rate), individual: this.round2(individual_rate) },
            reducedCreditAmountPercentageValue : this.round2(reducedCreditAmountPercentage),
            config: config
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
                "Fiscal Year Ended" : metadata.fiscalYearEnded,
                "Description": "Research Tax Credit",
                stateDetails : "California - Credit Calculation"
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
    async buildComputedFields(creditASC: any, creditRRC: any, config : ConfigJson) {
        let finalData = {
            "[5] Wages for qualified services. See instructions": creditRRC.wages,
            "[6] Cost of supplies. See instructions": creditRRC.supplies,
            "[7] Rental or lease costs of computers. See instructions": creditRRC.cost_to_rent,
            "[8] Enter the applicable percentage of contract research expenses (see instructions)": creditRRC.contract,
            "[9] Total qualified research expenses. Add line 5 through line 8": creditRRC.total_qre,
            [`[10] Enter fixed-base percentage, but not more than ${config.fixed_base_percentage}% (${config.fixed_base_percentage / 100}). See instructions`]: `${creditRRC.fixed_base_percentage}%`,
            "[11] Enter average annual gross receipts. See instructions": creditRRC.average_gross_receipts,
            "[12] Base amount. Multiply line 11 by the percentage on line 10": creditRRC.base_amount,
            "[13] Subtract line 12 from line 9. If zero or less, enter -0-": creditRRC.excess_qre_over_base,
            [`[14] Multiply line 9 by ${creditRRC.config.qre_credit_percentage_c1}% (${creditRRC.config.qre_credit_percentage_c1 / 100}). See instructions`]: creditRRC.half_total_qre,
            "[15] Enter the smaller of line 13 or line 14": creditRRC.smaller_of_excess_or_half,
            [`[16] Multiply line 15 by ${creditRRC.config.qre_credit_percentage_c2}% (${creditRRC.config.qre_credit_percentage_c2 / 100})`]: creditRRC.credit_before_280c,
            "[17 a] Regular credit. Add line 4 and line 16. If you do not elect the reduced credit under IRC Section 280C(c), enter the result here, and see instructions for the schedule to attach": creditRRC.regular_credit,
            "[17 b] Reduced regular credit under IRC Section 280C(c). Multiply line 17a by the applicable percentage below:": "",
            [`${creditRRC.config.individual}% (${(creditRRC.config.individual/100).toFixed(3)}) for individuals and estates or trusts`]:creditRRC.reduced_credit_amount.individual,
            [`${creditRRC.config.corporation}% (${(creditRRC.config.corporation/100).toFixed(3)}) for  corporations`]:creditRRC.reduced_credit_amount.s_corp,
            [`${creditRRC.config.s_corp}% (${(creditRRC.config.s_corp/100).toFixed(3)}) for S corporations`]:creditRRC.reduced_credit_amount.corporation,
            "Enter the reduced credit amount and write Section 280C(c) on the dotted line to the left of the entry space . . . . . . . . . . . . . . . . 17b":creditRRC.reducedCreditAmountPercentageValue

        }
        return {
            computed_fields: {
                "(Line) Qualified research expenses paid or incurred.":finalData,
                "BOLD":["[15] Total qualified research expenses. Add line 11 through line 14"]
                
            }
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