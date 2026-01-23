import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";

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
    async compute(config: ConfigJson, stateRdData: StateRDData, fiscalYear : string) {

        const priorYearsCount = 4;
        const totalGrossReceipts = new Decimal((stateRdData.annualGrossReceipts || []).reduce(
            (sum, r) => sum + (r.grossReceipts || 0), 0));

        const rrcResult = await this.rrc(config, stateRdData.currentYearQREs, totalGrossReceipts, priorYearsCount);
        const ascResult = {}; //California does NOT have ASC, so return {} or null

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.annualGrossReceipts || [], {
            country: this.country,
            creditType: this.creditType,
            currency: this.creditType,
            fiscalYearEnded : fiscalYear
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
    async rrc(config: ConfigJson, currentYearQREs: QRE, totalGrossReceipts: Decimal, priorYearsCount: number) {
        logMessage(`Computing CA Credit with config: ${JSON.stringify(config)}`);
        logMessage(`Current Year QREs: ${JSON.stringify(currentYearQREs)}`);

        //---- Line 5: wages
        const line5 = currentYearQREs.wages || 0;

        //---- Line 6: supplies
        const line6 = currentYearQREs.supplies || 0;

        //---- Line 7: cost to rent
        const line7 = 0;

        //---- Line 8: contract
        const line8 = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent/100) || 0;

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
        const reducedCreditAmountPercentage = line17a.mul(config.reduced_credit_amount_percentage/100).toNumber()

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
            reduced_credit_amount: { s_corp: s_corp_rate, corporation: corporation_rate, individual: individual_rate },
            reducedCreditAmountPercentageValue : reducedCreditAmountPercentage,
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
    async buildComputedFields(creditASC: any, creditRRC: any) {
        let finalData = {
            "5 Wages for qualified services. See instructions":creditRRC.wages,
            "6 Cost of supplies. See instructions":creditRRC.supplies,
            "7 Rental or lease costs of computers. See instructions":creditRRC.cost_to_rent,
            "8 Enter the applicable percentage of contract research expenses (see instructions)":creditRRC.contract,
            "9 Total qualified research expenses. Add line 5 through line 8 ":creditRRC.total_qre,
            "10 Enter fixed-base percentage, but not more than 16% (.16). See instructions ":creditRRC.fixed_base_percentage,
            "11 Enter average annual gross receipts. See instructions":creditRRC.average_gross_receipts,
            "12 Base amount. Multiply line 11 by the percentage on line 10":creditRRC.base_amount,
            "13 Subtract line 12 from line 9. If zero or less, enter -0-":creditRRC.excess_qre_over_base,
            [`14 Multiply line 9 by ${creditRRC.config.qre_cap_rate}. See instructions`]:creditRRC.half_total_qre,
            "15 Enter the smaller of line 13 or line 14":creditRRC.smaller_of_excess_or_half,
            [`16 Multiply line 15 by ${creditRRC.config.credit_rate}`]:creditRRC.credit_before_280c,
            "17 a Regular credit. Add line 4 and line 16. If you do not elect the reduced credit under IRC Section 280C(c), enter the result here, and see instructions for the schedule to attach":creditRRC.regular_credit,
            "b Reduced regular credit under IRC Section 280C(c). Multiply line 17a by the applicable percentage below:":"",
            [`${creditRRC.config.individual}% (${creditRRC.config.individual/100}) for individuals and estates or trusts`]:creditRRC.reduced_credit_amount.individual,
            [`${creditRRC.config.corporation}% (${creditRRC.config.corporation/100}) for  corporations`]:creditRRC.reduced_credit_amount.s_corp,
            [`${creditRRC.config.s_corp}% (${creditRRC.config.s_corp/100}) for S corporations`]:creditRRC.reduced_credit_amount.corporation,
            "Enter the reduced credit amount and write Section 280C(c) on the dotted line to the left of the entry space . . . . . . . . . . . . . . . . 17b :":creditRRC.reducedCreditAmountPercentageValue

        }
        return {
            computed_fields: {
                "Qualified research expenses paid or incurred.":finalData,
                "BOLD":["15 Total qualified research expenses. Add line 11 through line 14"]
                
            }
        }
    }
}