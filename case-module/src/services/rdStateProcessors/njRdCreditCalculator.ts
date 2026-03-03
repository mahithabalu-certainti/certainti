import { Decimal } from "decimal.js";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

export interface ConfigJson {
    qre_credit_percentage: number;
    sub_con_percent: number;
    fixed_base_percent: number;
}

/**
 * 
 */

export class RdCreditCalculatorForNJ {

    country = "USA";
    creditType = "State R&D Credit - NJ";
    currency = "USD";

    /**
     * 
     * @param config 
     * @param currentYearQREs 
     * @param annualGrossReceipts 
     * @param totalGrossReceipts 
     * @param prior3YearsQREs 
     * @param priorYearsCount 
     * @returns 
     */
    async compute(config: ConfigJson, stateRdData: StateRDData, fiscalYear : string, year : string, caseDetails : Case) {
        const part4ASCCreditCalculationInfo = this.part4ASCCreditCalculation(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, config, caseDetails);
        const part5DevelopmentTaxCreditCalculationInfo = this.part5DevelopmentTaxCreditCalculation(new Decimal(part4ASCCreditCalculationInfo.final_credit), config);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear : year
        },config);

        const computedFields = await this.buildComputedFields(part4ASCCreditCalculationInfo, part5DevelopmentTaxCreditCalculationInfo, config);

        return {
            inputFields,
            computedFields,
            finalCredit: this.round2(part5DevelopmentTaxCreditCalculationInfo.tot_available_credit),
            totalQRE: this.round2(part4ASCCreditCalculationInfo.total_current_year_qre),
            prev1yearQRE: this.round2(part4ASCCreditCalculationInfo.prev1yearQRE) || 0,
            prev2yearQRE: this.round2(part4ASCCreditCalculationInfo.prev2yearQRE) || 0,
            prev3yearQRE: this.round2(part4ASCCreditCalculationInfo.prev3yearQRE) || 0,
            totalWages: this.round2(stateRdData.currentYearQREs.wages) || 0,
            totalContract: this.round2(stateRdData.currentYearQREs.contract) || 0,
            totalSupplies: this.round2(stateRdData.currentYearQREs.supplies) || 0,
        }

    }

    /**
     * 
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @param config 
     * @returns 
     */
    part4ASCCreditCalculation(currentYearQREs: QRE, prior3YearsQREs: QRE[], config: ConfigJson, caseDetails : Case) {

        const current_year_wages = new Decimal(currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent / 100) || 0;
        const costOfSupplies = new Decimal(currentYearQREs.supplies || 0)
        const leaseComputerCost = new Decimal(caseDetails.lease_costs_of_computers || 0.00)

        const total_current_year_qre = current_year_wages.plus(current_year_contract).plus(costOfSupplies).plus(leaseComputerCost);
        const prev1_qre = new Decimal(prior3YearsQREs[0]?.qre || 0);

        //----Line3a: Enter 2 years prior QRE for TX State
        const prev2_qre = new Decimal(prior3YearsQREs[1]?.qre || 0);

        //----Line4a: Enter 3 years prior QRE for TX State
        const prev3_qre = new Decimal(prior3YearsQREs[2]?.qre || 0);
        const qreSum = prior3YearsQREs.map(item => ({
            fiscalYear: item.fiscalYear,
            wagesContractSum: new Decimal(item.wages || 0).plus(Number(item.contract || 0))
        }));
        const isPriorYearQreZero = prior3YearsQREs.some(q => q.qre === 0)

        const total_prev_qre = new Decimal(qreSum.reduce((sum, item) => sum + Number(item.wagesContractSum), 0));
        let final_credit : Decimal;
        const average_tot_prev_qre = total_prev_qre.div(config.fixed_base_percent);
        const sub_credit = total_current_year_qre.minus(average_tot_prev_qre);
         if(isPriorYearQreZero) {
            final_credit =  total_current_year_qre
        } else {
            final_credit = sub_credit
        }

        return {
            current_year_wages : this.round2(current_year_wages),
            current_year_contract : this.round2(current_year_contract),
            total_current_year_qre : this.round2(total_current_year_qre),
            total_prev_qre : this.round2(total_prev_qre),
            average_tot_prev_qre: this.round2(average_tot_prev_qre),
            sub_credit: this.round2(sub_credit),
            final_credit: this.round2(final_credit),
            costOfSupplies : this.round2(costOfSupplies),
            leaseComputerCost : this.round2(leaseComputerCost),
            prev1yearQRE: this.round2(prev1_qre),
            prev2yearQRE: this.round2(prev2_qre),
            prev3yearQRE: this.round2(prev3_qre),
        }
    }

    /**
     * 
     * @param part4_final_credit 
     * @param config 
     * @returns 
     */
    part5DevelopmentTaxCreditCalculation(part4_final_credit: Decimal, config: ConfigJson) {
        const tot_credit = this.round2(part4_final_credit.mul(config.qre_credit_percentage/100));

        return {
            part4_final_credit: this.round2(part4_final_credit),
            tot_credit,
            tot_available_credit: tot_credit,
            config_percent:config.qre_credit_percentage

        }
    }

    /**
    * 
    * @param value 
    * @returns 
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
    * 
    * @param currentYearQREs 
    * @param prior3YearsQREs 
    * @param annualGrossReceipts 
    * @param metadata 
    * @returns 
    */
    async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], metadata: any = {},config : ConfigJson) {

       let storeData : any[] = []
       let currentYearContract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent / 100) || 0;
        storeData.push({
            year : metadata.currentYear,
            wages: currentYearQREs.wages,
            contract: currentYearContract,
            sum: this.round2(new Decimal(currentYearQREs.wages || 0).plus(currentYearContract))
        })

        prior3YearsQREs.forEach((item) => {
            storeData.push({
                year : item.fiscalYear,
                wages: item.wages,
                contract: item.contract,
                sum: this.round2(new Decimal(item.wages || 0).plus(Number(item.contract || 0)))
            })
        });



        return {
            metadata: {
                country: metadata.country || "US",
                credit_type: metadata.creditType || "FEDERAL_RRC_ASC",
                currency: metadata.currency || "USD",
                "Fiscal Year Ended" : metadata.fiscalYearEnded,
                "Description": "Research Tax Credit",
                stateDetails : "NJ Research and Development Tax Credit"
            },
            "Current & Prior years information" : storeData
        };
    }

    /**
     * 
     * @param part4ASCCreditCalculationInfo 
     * @param part5DevelopmentTaxCreditCalculationInfo 
     * @returns 
     */
    buildComputedFields(part4ASCCreditCalculationInfo: any, part5DevelopmentTaxCreditCalculationInfo: any, config : ConfigJson) {
        let part4ASCCreditCalculation = {
        "[16] Wages for qualified services (do not include wages used to compute the Federal Jobs Credit)":
            this.round2(part4ASCCreditCalculationInfo.current_year_wages),

        "[17] Cost of Supplies":
            part4ASCCreditCalculationInfo.costOfSupplies,

        "[18] Rental or lease costs of computers":
            part4ASCCreditCalculationInfo.leaseComputerCost,

        "[19] Enter the applicable percentage of contract research expenses (see instructions)":
            part4ASCCreditCalculationInfo.current_year_contract,

        "[20] Total qualified research expenses. Add lines 16 through 19":
            part4ASCCreditCalculationInfo.total_current_year_qre,

        "[21] Enter your total qualified research expenses for the prior 3 privilege periods or tax years. If you had no qualified research expenses in any one of those years, skip lines 22 and 23 and enter the amount from line 20 on line 24.":
            part4ASCCreditCalculationInfo.total_prev_qre,

        [`[22] Divide line 21 by ${config.fixed_base_percent}`]:
            part4ASCCreditCalculationInfo.average_tot_prev_qre,

        "[23] Subtract line 22 from line 20. If zero or less, enter zero. Include here and on line 24.":
            part4ASCCreditCalculationInfo.sub_credit,

        "[24] Enter amount from line 23 or if you skipped lines 22 and 23, enter amount from line 20.":
            part4ASCCreditCalculationInfo.final_credit
        }

       let part5DevelopmentTaxCreditCalculation = {
        "[26] Enter either line 15 or 24 (whichever method was used for federal purposes)":
            part5DevelopmentTaxCreditCalculationInfo.part4_final_credit,

        "[27] Add lines 25c and 26":
            part5DevelopmentTaxCreditCalculationInfo.part4_final_credit,

        [`[28] Multiply line 27 by ${part5DevelopmentTaxCreditCalculationInfo.config_percent}%`]:
            part5DevelopmentTaxCreditCalculationInfo.tot_credit,

        "[29] Research and Development Tax Credit carried forward from prior year (do not recompute)":
            "",

        "[30] Total credit available - Add lines 28 and 29":
            part5DevelopmentTaxCreditCalculationInfo.tot_available_credit
        }

        return {
            computed_fields: {
                "[PART IV] CREDIT CALCULATION FOR QUALIFIED RESEARCH EXPENESES (ALTERNATIVE SIMPLIFIED CREDIT METHOD)": part4ASCCreditCalculation,
                "[PART V] TOTAL RESEARCH AND DEVELOPMENT TAX CREDIT": part5DevelopmentTaxCreditCalculation
            }
        }
    }
}