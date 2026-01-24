import { Decimal } from "decimal.js";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";

export interface ConfigJson {
    credit_rate: number;
    tentative_credit_rate: number;
    qualified_small_business_rate: number;
    one_third_rate: number;
    half_tax_liability_rate: number;
    double_credit_multiplier: number;
    tax_limit_rate: number;
}

/**
 * 
 */
export class RdCreditCalculatorForCT {

    country = "USA";
    creditType = "State R&D Credit - CT";
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
        const part1Computation = this.part1CreditComputation(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, config);
        const part1TentativeComputation = this.part1TentativeTaxCreditComputation(stateRdData.currentYearQREs, part1Computation.excess_qre, config);
        const part2Computation = this.part2CreditComputation(part1TentativeComputation.allowable_tentative_tax_credit, stateRdData.currentYearQREs.business_tax_liability || 0, config);

        const inputFields = await this.buildInputParams(part1Computation.total_qre, part1Computation.prior_year_1_qre, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear
        });

        const computedFields = await this.buildComputedFields(part1Computation, part1TentativeComputation, part2Computation, config);
        return {
            inputFields,
            computedFields
        }
    }

    /**
     * 
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @param extractConfig 
     */
    part1CreditComputation(currentYearQREs: QRE, prior3YearsQREs: QRE[], extractConfig: ConfigJson) {
        const wages = currentYearQREs.wages || 0;
        const supplies = currentYearQREs.supplies || 0;
        const contract = currentYearQREs.contract || 0;

        //Part I - Credit Computation
        //---- Line 1: Total QREs
        const totalQREs = new Decimal(wages).plus(new Decimal(supplies)).plus(new Decimal(contract));

        //---- Line 2: PriorYear 1 QREs
        const priorYear1QREs = new Decimal(prior3YearsQREs[0]?.qre ?? 0);

        //---- Line 3: Subtract line 2 from line 1
        const excessQRE = Decimal.max(totalQREs.minus(priorYear1QREs), 0);

        //---- Line 4: Multiply line 3 by 20%
        const taxCredit = excessQRE.mul(new Decimal(extractConfig.credit_rate || 0));

        return {
            total_qre: totalQREs,
            prior_year_1_qre: priorYear1QREs,
            excess_qre: excessQRE,
            tax_credit: taxCredit
        };
    }

    /**
     * 
     * @param currentYearQREs 
     * @param excessQRE 
     * @param extractConfig 
     * @returns 
     */
    part1TentativeTaxCreditComputation(currentYearQREs: QRE, excessQRE: Decimal, extractConfig: ConfigJson) {
        const wages = currentYearQREs.wages || 0;
        const supplies = currentYearQREs.supplies || 0;
        const contract = currentYearQREs.contract || 0;


        //Part I - Tentative Credit Computation
        //Line 1: Total QREs
        const tentativeTotalQREs = new Decimal(wages).plus(new Decimal(supplies)).plus(new Decimal(contract));

        //Line 2: Excess QREs (Line 3 from Part I)
        const tentativeExcessQRE = excessQRE;

        //Line 3: Balance: Subtract Line 2 from Line 1.
        const tentativeBalance = Decimal.max(tentativeTotalQREs.minus(tentativeExcessQRE), 0);

        //Line 4c: Tetative credit rate.
        const tentativeCreditRate = tentativeBalance.mul(new Decimal(extractConfig.tentative_credit_rate || 0));

        //Line 4: Tentative credit rate from line 4c
        const tentativeCredit = tentativeCreditRate;

        //Line 5: Reduction of tentative tax credit for 2024: Applicable if Line 3 exceeds $200 million and workforce is reduced. 
        const reductionTentativeTaxCredit = new Decimal(0); //TODO: Placeholder as the actual calculation depends on additional data not provided.

        //Line 6: Allowable tentative tax credit for Current Year: Subtract Line 5 from Line 4. 
        const allowableTentativeTaxCredit = Decimal.max(tentativeCredit.minus(reductionTentativeTaxCredit), 0);

        return {
            tentative_credit_rate: tentativeCreditRate,
            tentative_total_qre: tentativeTotalQREs,
            tentative_excess_qre: tentativeExcessQRE,
            tentative_balance: tentativeBalance,
            tentative_credit: tentativeCredit,
            reduction_tentative_tax_credit: reductionTentativeTaxCredit,
            allowable_tentative_tax_credit: allowableTentativeTaxCredit
        };
    }

    /**
     * 
     * @param allowableTentativeTaxCredit 
     * @param extractConfig 
     */
    part2CreditComputation(allowableTentativeTaxCredit: Decimal, business_tax_liability: number, extractConfig: ConfigJson) {
        //Part II - Credit Computation
        //Line 1 : Allowable Tentative Tax Credit for 2024 from Part 1, line 6
        const part2AllowableTentativeTaxCredit = allowableTentativeTaxCredit;

        //Line 2:Multiply Line 1 by .3333
        const part2OneThirdRate = part2AllowableTentativeTaxCredit.mul(new Decimal(extractConfig.one_third_rate || 0));

        //Line 3: Current Year CT Business Tax Liability 
        const currentYearCTBusinessTaxLiability = new Decimal(business_tax_liability);

        //Line 4: Multiply Line 3 by 50%
        const halfTaxLiability = currentYearCTBusinessTaxLiability.mul(new Decimal(extractConfig.half_tax_liability_rate/100 || 0));

        //Line 5a: Double Credit for Certain Expenses: Multiply Line 1 by 2
        const doubleCredit = part2AllowableTentativeTaxCredit.mul(new Decimal(extractConfig.double_credit_multiplier || 0));

        //Line 5b: Enter 90% of Line 3
        const taxLimit = currentYearCTBusinessTaxLiability.mul(new Decimal(extractConfig.tax_limit_rate/100 || 0));

        //Line 5: Enter the lesser of Line 5a or Line 5b
        const minFinal = Decimal.min(doubleCredit, taxLimit);

        //Line 6: Enter the greater of Line 4 or Line 5 
        const allowableCredit = Decimal.max(halfTaxLiability, minFinal);

        //Line 7: Enter the lesser of Line 2 or Line 6. This is the CT R&D Credit for the Current Year.
        const finalCredit = Decimal.min(part2OneThirdRate, allowableCredit);

        return {
            part2_allowable_tentative_tax_credit: part2AllowableTentativeTaxCredit,
            part2_one_third_rate: part2OneThirdRate,
            current_year_ct_business_tax_liability: currentYearCTBusinessTaxLiability,
            half_tax_liability: halfTaxLiability,
            double_credit: doubleCredit,
            tax_limit: this.round2(taxLimit),
            min_final: this.round2(minFinal),
            allowable_credit: this.round2(allowableCredit),
            final_credit: this.round2(finalCredit)
        };
    }

    /**
     * 
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @param annualGrossReceipts 
     * @param metadata 
     * @returns 
     */
    async buildInputParams(totalQREs: Decimal, priorYear1QREs: Decimal, metadata: any = {}) {

        const qreSummary: Record<string, any> = {
            totalQREs: totalQREs.toNumber() || 0
        };

        qreSummary[`prior_year_qre_1`] = priorYear1QREs.toNumber() || 0;

        return {
            metadata: {
                country: metadata.country || "US",
                credit_type: metadata.creditType || "FEDERAL_RRC_ASC",
                currency: metadata.currency || "USD",
                "Fiscal Year Ended" : metadata.fiscalYearEnded,
                "Description": "Research Tax Credit",
                stateDetails : "Connecticut - Credit Calculation"
            },
        };

    }

    /**
     * 
     * @param part1Computation 
     * @returns 
     */
    async buildComputedFields(part1Computation: any, part1TentativeComputation: any, part2Computation: any, extractConfig : ConfigJson) {
       
        let part1 = {
            "1 Enter the amount of Connecticut research and experimental expenditures for the current income year.":part1Computation.total_qre,
            "2 Enter the amount of Connecticut research and experimental expenditures for the first prior income year.":part1Computation.prior_year_1_qre,
            "3 Balance: Subtract Line 2 from Line 1. If zero or less, the corporation is not eligible for this credit.":part1Computation.excess_qre,
            [`4 Tax credit: Multiply Line 3 by ${extractConfig.credit_rate}%. Enter here and on Form CT-1120K,  Part I-C, Column B.`]:part1Computation.tax_credit
        }

       
        let part2 = {
            "1 Enter the amount of Connecticut research and experimental expenditures for the current income year. ":part1TentativeComputation.tentative_total_qre,
            "2 Enter the amount of excess Connecticut research and experimental expenditures for the current income year.   From Form CT - 1120RC Part I, Line 3.":part1TentativeComputation.tentative_excess_qre,
            "3 Balance: Subtract Line 2 from Line 1.  Net research and development expenses for 2023":part1TentativeComputation.tentative_balance,
            "4c All other businesses determine amount from the Tentative Credit Rate Schedule on Page 2 of form.":part1TentativeComputation.tentative_credit,
            "4 Tentative credit: Enter the amount from Line 4a, 4b, or 4c.":part1TentativeComputation.tentative_credit,
            "5 Reduction of tentative tax credit for 2024: Applicable if Line 3 exceeds $200 million and workforce is reduced.":   part1TentativeComputation.reduction_tentative_tax_credit,    
            "6 Allowable tentative tax credit for Current Year: Subtract Line 5 from Line 4. ":part1TentativeComputation.allowable_tentative_tax_credit

        }

        let part3 = {
            "1 Allowable Tentative Tax Credit for 2024 from Part 1, line 6":part2Computation.part2_allowable_tentative_tax_credit,
            [`2 Multiply Line 1 by ${extractConfig.one_third_rate}%`]:part2Computation.part2_one_third_rate,
            "3 Current Year CT Business Tax Liability":part2Computation.current_year_ct_business_tax_liability,
            [`4 Multiply Line 3 by ${(extractConfig.half_tax_liability_rate)}% .`]:part2Computation.half_tax_liability,
            [`5a Multiply Line 1 by ${extractConfig.double_credit_multiplier}`]:part2Computation.double_credit,
            [`5b Enter ${extractConfig.tax_limit_rate}% (${extractConfig.tax_limit_rate}) of Line 3`]:part2Computation.tax_limit,
            "5 Enter the lesser of Line 5a or Line 5b":part2Computation.min_final,
            "6 Enter the greater of Line 4 or Line 5":part2Computation.allowable_credit,
            "7 2024 Research and Development Expenditures tax credit: Enter the lesser of Line 2 or Line 6 here and on Form CT-1120K, Part I-C, Column B.":part2Computation.final_credit
        }
        return {
            computed_fields: {
                "Part I - Credit Computation": part1,               
                "Part I - Tentative Credit Computation": part2,
                "Part II - Credit Computation": part3
            }
        }
    }
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