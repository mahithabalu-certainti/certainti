import { Decimal } from "decimal.js";
import { StateRDData } from "../rdComputation/rdCreditTypes";

/**
 * Colorado RD Credit Calculator
 */

export interface ConfigJson {
    qre_credit_percentage_c2: number;
    qre_credit_percentage_c1: number;
}

export class RdCreditCalculatorForCO {
    country = "USA";
    creditType = "State R&D Credit - CO";
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
        const wages = stateRdData.currentYearQREs.wages || 0;
        const supplies = stateRdData.currentYearQREs.supplies || 0;
        const costToRent = 0;
        const contract = stateRdData.currentYearQREs.contract || 0;

        //---- Line A: Total QREs
        const totalQREs = new Decimal(wages).plus(new Decimal(supplies)).plus(new Decimal(costToRent)).plus(new Decimal(contract));

        //---- Line B: PriorYear 1 QREs
        const priorYear1QREs = new Decimal(stateRdData.prior3YearsQREs[0]?.qre ?? 0);

        //---- Line C: PriorYear 2 QREs
        const priorYear2QREs = new Decimal(stateRdData.prior3YearsQREs[1]?.qre ?? 0);

        //---- Line D: Sum of Prior Year 1 and 2 QREs
        const sumPriorTwoYears = new Decimal(priorYear1QREs).plus(new Decimal(priorYear2QREs));

        //---- Line E: 50% of Sum of Prior Year 1 and 2 QREs
        const fiftyPercentOfPriorTwoYears = sumPriorTwoYears.mul(config.qre_credit_percentage_c1/100 || 0);

        //---- Line F: Excess QREs
        const excessQRE = Decimal.max(totalQREs.minus(fiftyPercentOfPriorTwoYears), 0);

        //---- Line G: Allowable Credit
        const allowableCredit = excessQRE.mul(new Decimal(config.qre_credit_percentage_c2/100 || 0));


        const inputFields = await this.buildInputParams({
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear
        });

        const computedFields = await this.buildComputedFields({ sumPriorTwoYears, fiftyPercentOfPriorTwoYears, excessQRE, allowableCredit, config, totalQREs, priorYear1QREs, priorYear2QREs});

        return {
            inputFields,
            computedFields,
            finalCredit: allowableCredit.toNumber(),
            totalQRE: totalQREs.toNumber(),
            totalWages: wages,
            totalSupplies: supplies,
            totalContract: contract
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
    async buildInputParams(metadata: any = {}) {

        return {
            metadata: {
                country: metadata.country || "US",
                credit_type: metadata.creditType || "FEDERAL_RRC_ASC",
                currency: metadata.currency || "USD",
                "Fiscal Year Ended" : metadata.fiscalYearEnded,
                "Description": "Research Tax Credit",
                stateDetails : "Colorado - Credit Calculation"
            }
        };

    }

    /**
     * 
     * @param creditASC 
     * @param creditRRC 
     * @returns 
     */
    async buildComputedFields(data: any) {
        return {
            computed_fields: {
                "(PART IV) Research and Experimental Activities Credit" : {
                    "text" : "In order to calculate any current year Research and Experimental Activities Credit in Part III, please use worksheet 3 below. Complete the remainder of the form following the instructions to claim allowable credit you earned in prior periods."
                },
                "Research and Experimental Activities Credit Do not send, keep for your records" : {
                "[A] Enter the current year qualified expenditures": data.totalQREs.toNumber() || 0,
                "[B] Enter the first preceding year expenditures": data.priorYear1QREs.toNumber() || 0,
                "[C] Enter the second preceding year expenditures": data.priorYear2QREs.toNumber() || 0,
                "[D] Enter the sum of lines B and C": data.sumPriorTwoYears.toNumber(),
                [`[E] Enter ${data.config.qre_credit_percentage_c1}% of line D`]: data.fiftyPercentOfPriorTwoYears.toNumber(),
                "[F] Enter line A minus line E": data.excessQRE.toNumber(),
                [`[G] Allowable amount: ${data.config.qre_credit_percentage_c2}% of line F`]: data.allowableCredit.toNumber(),
                }
            }
        }
    }
}