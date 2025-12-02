import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import FinancialRDPreviewService from "../financialRDCredit/financialRDPreviewService"


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

    private financialRDPreviewService: FinancialRDPreviewService;
    private loadData: any;

    constructor() {
        this.financialRDPreviewService = new FinancialRDPreviewService();
        this.loadData = this.financialRDPreviewService.loadDataForCT()
    }

    async compute(config: ConfigJson, currentYearQREs: any, annualGrossReceipts: any[], totalGrossReceipts: Decimal, prior3YearsQREs: { fiscalYear: number; qre: number }[], priorYearsCount: number) {
        const part1Computation = this.part1CreditComputation(currentYearQREs, prior3YearsQREs, config);
        const part1TentativeComputation = this.part1TentativeTaxCreditComputation(currentYearQREs, part1Computation.excess_qre, config);
        const part2Computation = this.part2CreditComputation(part1TentativeComputation.allowable_tentative_tax_credit, currentYearQREs.business_tax_liability, config);

        const inputFields = await this.buildInputParams(part1Computation.total_qre, part1Computation.prior_year_1_qre, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
        });

        const computedFields = await this.buildComputedFields(part1Computation, part1TentativeComputation, part2Computation);
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
    part1CreditComputation(currentYearQREs: any, prior3YearsQREs: { fiscalYear: number; qre: number }[], extractConfig: ConfigJson) {
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
    part1TentativeTaxCreditComputation(currentYearQREs: any, excessQRE: Decimal, extractConfig: ConfigJson) {
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
        const tentativeCreditRate = new Decimal(extractConfig.tentative_credit_rate || 0);

        //Line 4: Tentative credit rate from line 4c
        const tentativeCredit = tentativeCreditRate;

        //Line 5: Reduction of tentative tax credit for 2024: Applicable if Line 3 exceeds $200 million and workforce is reduced. 
        const reductionTentativeTaxCredit = new Decimal(0); //TODO: Placeholder as the actual calculation depends on additional data not provided.

        //Line 6: Allowable tentative tax credit for Current Year: Subtract Line 5 from Line 4. 
        const allowableTentativeTaxCredit = Decimal.max(tentativeCredit.minus(reductionTentativeTaxCredit), 0);

        return {
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
        const halfTaxLiability = currentYearCTBusinessTaxLiability.mul(new Decimal(extractConfig.half_tax_liability_rate || 0));

        //Line 5a: Double Credit for Certain Expenses: Multiply Line 1 by 2
        const doubleCredit = part2AllowableTentativeTaxCredit.mul(new Decimal(extractConfig.double_credit_multiplier || 0));

        //Line 5b: Enter 90% of Line 3
        const taxLimit = currentYearCTBusinessTaxLiability.mul(new Decimal(extractConfig.tax_limit_rate || 0));

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
            tax_limit: taxLimit,
            min_final: minFinal,
            allowable_credit: allowableCredit,
            final_credit: finalCredit
        };
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
            },
            qreSummary
        };

    }

    /**
     * 
     * @param part1Computation 
     * @returns 
     */
    async buildComputedFields(part1Computation: any, part1TentativeComputation: any, part2Computation: any) {
        return {
            computed_fields: {
                part1_computation: part1Computation,
                part1_tentative_computation: part1TentativeComputation,
                part2_computation: part2Computation
            }
        }
    }
}