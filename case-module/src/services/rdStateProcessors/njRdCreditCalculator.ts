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
        const priorYearsCount = 4;
        const totalGrossReceipts = new Decimal((stateRdData.annualGrossReceipts || []).reduce(
            (sum, r) => sum + (r.grossReceipts || 0), 0));
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
            totalWages: this.round2(part4ASCCreditCalculationInfo.current_year_wages) || 0,
            totalContract: this.round2(part4ASCCreditCalculationInfo.current_year_contract) || 0,
            totalSupplies: this.round2(part4ASCCreditCalculationInfo.costOfSupplies) || 0,
            averageAnnualGrossReceipts: this.round2(totalGrossReceipts.div(priorYearsCount)) || 0
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
        const leaseComputerCost = new Decimal(caseDetails.lease_costs_of_computers_nj || 0.00)

        const total_current_year_qre = current_year_wages.plus(current_year_contract).plus(costOfSupplies).plus(leaseComputerCost);
       
       const qreSum = prior3YearsQREs.map(item => ({
    fiscalYear: item.fiscalYear,
    wagesContractSum: new Decimal(item.wages || 0).plus(Number(item.contract || 0))
}));

        const currentFiscalYearInt = caseDetails.fiscal_year;

        // Helper: find wagesContractSum for a specific year, defaulting to 0 if missing
        const getQREForYear = (year: number): Decimal => {
            const entry = qreSum.find(q => parseInt(String(q.fiscalYear), 10) === year);
            return new Decimal(entry?.wagesContractSum || 0);
        };

        // Line 2a: currentYear - 1
        const prev1_qre = getQREForYear(currentFiscalYearInt - 1);
        console.log(`Prev Year 1 QRE (Year ${currentFiscalYearInt - 1}):`, prev1_qre.toString());

        // Line 3a: currentYear - 2
        const prev2_qre = getQREForYear(currentFiscalYearInt - 2);
        console.log(`Prev Year 2 QRE (Year ${currentFiscalYearInt - 2}):`, prev2_qre.toString());

        // Line 4a: currentYear - 3
        const prev3_qre = getQREForYear(currentFiscalYearInt - 3);
        const isPriorYearQreZero = prior3YearsQREs.some(q => q.qre === 0)

        const total_prev_qre = new Decimal(qreSum.reduce((sum, item) => sum + Number(item.wagesContractSum), 0));
        let final_credit : Decimal;
        const average_tot_prev_qre = total_prev_qre.div(config.fixed_base_percent);
        const sub_credit = total_current_year_qre.minus(average_tot_prev_qre);
        const sub_credit_final = sub_credit.lte(0) ? new Decimal(0) : sub_credit;
         if(isPriorYearQreZero) {
            final_credit =  total_current_year_qre
        } else {
            final_credit = sub_credit_final
        }

        return {
            current_year_wages : this.round2(current_year_wages),
            current_year_contract : this.round2(current_year_contract),
            total_current_year_qre : this.round2(total_current_year_qre),
            total_prev_qre : this.round2(total_prev_qre),
            average_tot_prev_qre: this.round2(average_tot_prev_qre),
            sub_credit: this.round2(sub_credit_final),
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
            contract: this.round2(currentYearContract),
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

       let part1Calculation = {
        "[1] Enter the basic research payments paid or incurred to qualified organizations":"-"
       }

       let part2Calculation = {
        "[2] Enter the basic research payments paid or incurred to qualified organizations":"-",
        "[3] Enter the base period amount":"-",
        "[4] Subtract line 3 from line 2. If zero or less, enter zero":"-"
       }

       let part3Calculation = {
        "[5] Wages for Qualified services (do not include wages used to compute the Federal Jobs Credit)":"-",
        "[6] Cost of Supplies":"-",
        "[7] Rental or lease costs of computers":"-",
        "[8] Enter 65% (.65) of contract expenses":"-",
        "[9] Total qualified research expenses. Add lines 5 through 8":"-",
        "[10] Enter fixed-based percentage, but not more than 16%":"-",
        "[11] Enter average annual gross receipts":"-",
        "[12] Base amount - multiply line 10 by the percentage on line 9":"-",
        "[13] Subtract line 12 from line 9":"-",
        "[14] Enter 50% (.50) of line 9":"-",
        "[15] Enter the smaller of line 13 or 14":"-"
       }
       let part6Calculation = {
        "[31] Enter tax liability from page 1, line 2 of CBT-100, CBT-100S, or BFC-1, or the member's column of Schedule A. Part III, line 5 of CBT-100U":"-",
        "[32] Enter the required minimum tax liability as indicated in section (b) for Part VI":"-",
        "[33] Subtract line 32 from line 31":"-",
        "[34] Tax credit used by taxpayer on current year's return:":"-",
         "(a)":"-",
         "(b)":"-",
         "(c)":"-",
          "(d)":"-",
        "[35] Subtract line 34 form line 33. If zero or less, enter zero":"-",
        "[36] Allowable credit for the current period or tax year. Enter the lessor of line 30 or line 35 here and on Part I, Schedule A-3 of the CBT-100, CBT-100U, CBT-100S or BFC-1.":"-",
        "[37] a) research and development tax credit carryover (subtract line 36 from line 30)":"-",
        "[37] b) Amount of credit shared in current year from Part VII, line 44, if applicable":"-",
        "[37] c) Amount of credit carryover to following year's return (subtract line 37b from the 37a)":"-",


       }
       
         

        return {
            computed_fields: {
                "[PART I] CREDIT CALCULATION FOR BASIC RESEARCH PAYMENTS": part1Calculation,
                "[PART II] CREDIT CALCULATION FOR BASIC RESEARCH PAYMENTS": part2Calculation,
                "[PART III] CREDIT CALCULATION FOR QUALIFIED RESEARCH EXPENSES": part3Calculation,
                "[PART IV] CREDIT CALCULATION FOR QUALIFIED RESEARCH EXPENESES (ALTERNATIVE SIMPLIFIED CREDIT METHOD)": part4ASCCreditCalculation,
                "[PART V] TOTAL RESEARCH AND DEVELOPMENT TAX CREDIT": part5DevelopmentTaxCreditCalculation,
                "[PART VI] CALCULATION OF THE ALLOWABLE CREDIT AMOUNT AND CARRYOVER": part6Calculation 
            }
        }
    }
}