import { Decimal } from "decimal.js";
import { StateRDData } from "../rdComputation/rdCreditTypes";

/**
 * Colorado RD Credit Calculator
 */

export interface ConfigJson {
    credit_rate: number;
    qre_cap_rate: number;
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
    async compute(config: ConfigJson, stateRdData: StateRDData) {
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
        const fiftyPercentOfPriorTwoYears = sumPriorTwoYears.mul(config.qre_cap_rate || 0);

        //---- Line F: Excess QREs
        const excessQRE = Decimal.max(totalQREs.minus(fiftyPercentOfPriorTwoYears), 0);

        //---- Line G: Allowable Credit
        const allowableCredit = excessQRE.mul(new Decimal(config.credit_rate || 0));


        const inputFields = await this.buildInputParams(totalQREs, priorYear1QREs, priorYear2QREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
        });

        const computedFields = await this.buildComputedFields({ sumPriorTwoYears, fiftyPercentOfPriorTwoYears, excessQRE, allowableCredit });

        return {
            inputFields,
            computedFields
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
    async buildInputParams(totalQREs: Decimal, priorYear1QREs: Decimal, priorYear2QREs: Decimal, metadata: any = {}) {

        const qreSummary: Record<string, any> = {
            totalQREs: totalQREs.toNumber() || 0
        };

        qreSummary[`prior_year_qre_1`] = priorYear1QREs.toNumber() || 0;
        qreSummary[`prior_year_qre_2`] = priorYear2QREs.toNumber() || 0;

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
    async buildComputedFields(data: any) {
        return {
            computed_fields: {
                sum_prior_two_years: data.sumPriorTwoYears.toNumber(),
                allowable_credit: data.allowableCredit.toNumber(),
                fifty_percent_of_prior_two_years: data.fiftyPercentOfPriorTwoYears.toNumber(),
                excess_qre: data.excessQRE.toNumber()
            }
        }
    }
}