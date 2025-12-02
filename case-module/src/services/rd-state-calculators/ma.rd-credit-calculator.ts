import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import FinancialRDPreviewService from "../financialRDCredit/financialRDPreviewService"


export interface ConfigJson {
    credit_rate: number;
    sub_con_percent: number;
    qre_cap_rate: number;
    fixed_base_ratio: number;
}

/**
 * 
 */
export class RdCreditCalculatorForMA {

    country = "USA";
    creditType = "State R&D Credit - MA";
    currency = "USD";


    private financialRDPreviewService: FinancialRDPreviewService;
    private loadData: any;

    constructor() {
        this.financialRDPreviewService = new FinancialRDPreviewService();
        this.loadData = this.financialRDPreviewService.loadDataForMA()
    }

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
    async compute(config: any, currentYearQREs: any, annualGrossReceipts: any[], totalGrossReceipts: Decimal, prior3YearsQREs: any[], priorYearsCount: number) {    
        const extractConfig = this.extractConfigJson(config.config_json);
        logMessage(`Computing CO Credit with config: ${JSON.stringify(extractConfig)}`);
        const part1QualifiedResearchExpenseInfo = this.part1QualifiedResearchExpense(currentYearQREs, extractConfig);
        const part2ASCCreditCalculationInfo = this.part2ASCCreditCalculation(prior3YearsQREs, part1QualifiedResearchExpenseInfo.total_qre, part1QualifiedResearchExpenseInfo.total_qre_aggregate, extractConfig);
        const part3CreditCalInfo = this.part3CreditCalculation(annualGrossReceipts, part2ASCCreditCalculationInfo.aggregate_group_credit_percent, extractConfig);

        const inputFields = await this.buildInputParams(currentYearQREs, prior3YearsQREs, annualGrossReceipts, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
        });

        const computedFields = await this.buildComputedFields(part1QualifiedResearchExpenseInfo, part2ASCCreditCalculationInfo, part3CreditCalInfo);

        return {
            inputFields,
            computedFields
        }

    }

    /**
     * 
     * @param currentYearQREs 
     * @param config 
     * @returns 
     */
    part1QualifiedResearchExpense(currentYearQREs: any, config: ConfigJson) {
        const current_year_wages = new Decimal(currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(currentYearQREs.contract).mul(config.sub_con_percent) || 0;

        const total_qre = current_year_wages.plus(current_year_contract);

        const total_qre_aggregate = total_qre;

        return {
            current_year_wages,
            current_year_contract,
            total_qre,
            total_qre_aggregate
        }
    }

    /**
     * 
     * @param prior3YearsQREs 
     * @param part1TotalQre 
     * @param part1TotalQreAgg 
     * @param config 
     * @returns 
     */
    part2ASCCreditCalculation(prior3YearsQREs: any[], part1TotalQre: Decimal, part1TotalQreAgg: Decimal, config: ConfigJson) {

        const qreSum = prior3YearsQREs.map(item => ({
            fiscalYear: item.fiscalYear,
            wagesContractSum: new Decimal(item.wages || 0).plus(Number(item.contract || 0))
        }));
        const total_qre = new Decimal(qreSum.reduce((sum, item) => sum + Number(item.wagesContractSum), 0));
        const average_qre = total_qre.div(3);

        const fifty_percent_qre = average_qre.mul(config.qre_cap_rate);
        const excess_qre = part1TotalQre.minus(fifty_percent_qre)

        const final_excess_qre = new Decimal(excess_qre.lt(0) ? 0 : excess_qre);
        const applicable_credit_rate = config.credit_rate * 100;

        const total_credit_group = final_excess_qre.mul(config.credit_rate);

        const aggregate_group_credit_percent = part1TotalQre.div(part1TotalQreAgg).mul(100);

        const amount_group_credit = total_credit_group.mul(aggregate_group_credit_percent.div(100));

        return {
            average_qre: this.round2(average_qre),
            fifty_percent_qre: this.round2(fifty_percent_qre),
            final_excess_qre: this.round2(final_excess_qre),
            applicable_credit_rate,
            total_credit_group: this.round2(total_credit_group),
            aggregate_group_credit_percent,
            amount_group_credit: this.round2(amount_group_credit)
        }

    }

    /**
     * 
     * @param annualGrossReceipts 
     * @param aggregate_group_credit_percent 
     * @param config 
     * @returns 
     */
    part3CreditCalculation(annualGrossReceipts: any[], aggregate_group_credit_percent: Decimal, config: ConfigJson) {

        const currentFiscalYear = this.getCurrentFiscalYear();
        // Filter out current year
        const previousYearsGrossReceipts = annualGrossReceipts.filter(
            (item) => item.fiscalYear !== currentFiscalYear
        );

        // Sum grossReceipts from previous years
        const totalPreviousGrossReceipts = new Decimal(previousYearsGrossReceipts.reduce(
            (sum, item) => sum + Number(item.grossReceipts || 0), 0));
        const avg_total_previous_receipts = totalPreviousGrossReceipts.div(previousYearsGrossReceipts.length);

        const fixed_base_ratio = new Decimal(config.fixed_base_ratio).mul(100);

        const base_amount = avg_total_previous_receipts.mul(config.fixed_base_ratio);

        return {
            fixed_base_ratio,
            avg_total_previous_receipts,
            base_amount,
            aggregate_group_credit_percent
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

    /**
    * 
    * @param value 
    * @returns 
    */
    round2(value: Decimal | number): Decimal {
        return new Decimal(value).toDecimalPlaces(2);
    }

    /**
     * 
     * @param date 
     * @returns 
     */
    getCurrentFiscalYear(date: Date = new Date()): number {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12

        // Fiscal year starts in April
        return month >= 4 ? year : year - 1;
    }

    /**
    * 
    * @param currentYearQREs 
    * @param prior3YearsQREs 
    * @param annualGrossReceipts 
    * @param metadata 
    * @returns 
    */
    async buildInputParams(currentYearQREs: any, prior3YearsQREs: any[], annualGrossReceipts: any[], metadata: any = {}) {

        const qreSummary: Record<string, any> = {
            wages: currentYearQREs.wages,
            supplies: currentYearQREs.supplies,
            contract: currentYearQREs.contract
        };

        // Add prior 4 years gross receipts
        annualGrossReceipts.forEach((item, i) => {
            qreSummary[`prior_year_gross_receipts_${i + 1}`] = item.grossReceipts || 0;
        });

        prior3YearsQREs.forEach((item) => {
            qreSummary[`${item.fiscalYear}`] = {
                wages: item.wages,
                contract: item.contract,
                sum: new Decimal(item.wages || 0).plus(Number(item.contract || 0))
            }
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
     * @param part1QualifiedResearchExpenseInfo 
     * @param part2ASCCreditCalculationInfo 
     * @param part3CreditCalInfo 
     * @returns 
     */
    buildComputedFields(part1QualifiedResearchExpenseInfo: any, part2ASCCreditCalculationInfo: any, part3CreditCalInfo: any) {
        return {
            computed_fields: {
                part1_qre: part1QualifiedResearchExpenseInfo,
                part2_asc_credit: part2ASCCreditCalculationInfo,
                part3_credit: part3CreditCalInfo
            }
        }
    }
}