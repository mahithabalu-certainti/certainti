import { Decimal } from "decimal.js";
import { AnnualGrossReceipt, QRE, StateRDData } from "../rdComputation/rdCreditTypes";


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
    async compute(config: ConfigJson, stateRdData: StateRDData, fiscalYear : string) {
        const part1QualifiedResearchExpenseInfo = this.part1QualifiedResearchExpense(stateRdData.currentYearQREs, config);
        const part2ASCCreditCalculationInfo = this.part2ASCCreditCalculation(stateRdData.prior3YearsQREs, part1QualifiedResearchExpenseInfo.total_qre, part1QualifiedResearchExpenseInfo.total_qre_aggregate, config);
        const part3CreditCalInfo = this.part3CreditCalculation(stateRdData.annualGrossReceipts || [], part2ASCCreditCalculationInfo.aggregate_group_credit_percent, config);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, stateRdData.annualGrossReceipts || [], {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear
        });

        const computedFields = await this.buildComputedFields(part1QualifiedResearchExpenseInfo, part2ASCCreditCalculationInfo, part3CreditCalInfo, config);

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
    part1QualifiedResearchExpense(currentYearQREs: QRE, config: ConfigJson) {
        const current_year_wages = new Decimal(currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent) || 0;

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
    part2ASCCreditCalculation(prior3YearsQREs: QRE[], part1TotalQre: Decimal, part1TotalQreAgg: Decimal, config: ConfigJson) {

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
    part3CreditCalculation(annualGrossReceipts: AnnualGrossReceipt[], aggregate_group_credit_percent: Decimal, config: ConfigJson) {

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
    async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], annualGrossReceipts: any[], metadata: any = {}) {

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
                "Fiscal Year Ended" : metadata.fiscalYearEnded,
                "Description": "Research Tax Credit",
                stateDetails : "MA Research Credit"
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
    buildComputedFields(part1QualifiedResearchExpenseInfo: any, part2ASCCreditCalculationInfo: any, part3CreditCalInfo: any, extractConfig : ConfigJson) {
        let part1QualifiedResearchExpense = {
            "1 Qualified wage expenses for this corporation":part1QualifiedResearchExpenseInfo.current_year_wages,
            "2 Qualified supply expenses for this corporation":"",
            "3 Qualified computer rental time expenses for this corporation":"",
            [`4 Enter ${extractConfig.sub_con_percent}% of qualified contract expenses for this corporation`]:part1QualifiedResearchExpenseInfo.current_year_contract,
            "5 Total qualified research expenses for this corporation. Add lines 1 through 4":part1QualifiedResearchExpenseInfo.total_qre,
            "6 Total qualified research expenses for this aggregate group":part1QualifiedResearchExpenseInfo.total_qre_aggregate
        }
        let part2ASCCreditCalculation = {
            "If using the Alternative Simplified Method and you did not have qualified research expenses in each of the three prior years, fill in oval Also skip lines 7 through 10":"",
            "7 Average qualified research expenses for the 3 most recent prior years":part2ASCCreditCalculationInfo.average_qre,
            [`8 Enter ${extractConfig.qre_cap_rate}% of line 7`]:part2ASCCreditCalculationInfo.fifty_percent_qre,
            "9 Subtract the amount on line 8 from current year expenses on line 6. Not less than 0":part2ASCCreditCalculationInfo.final_excess_qre,
            "10 Applicable rate for Alternative Simplified Method":part2ASCCreditCalculationInfo.applicable_credit_rate,   
            "11 Total credit for the group. if the taxpayer did not have qualified research expenses in each of the three prior years,enter 5% of the amount on line 6; otherwise, multiply line 9 by line 10":part2ASCCreditCalculationInfo.total_credit_group,
            "12 Percentage of aggregate group credit attributable to this corporation. Line 5 divided by line 6":part2ASCCreditCalculationInfo.aggregate_group_credit_percent,
            "13 Amount of group credit for this corporation. Multiply line 11 by line 12":part2ASCCreditCalculationInfo.amount_group_credit
        }
        let part3CreditCal = {
            "14 Fixed-base ratio (see instructions)":part3CreditCalInfo.fixed_base_ratio,
            "15 Average annual gross receipts from the 4 most recent taxable years":part3CreditCalInfo.avg_total_previous_receipts,
            [`16 Base amount. Multiply line 14 by line 15. Not less than ${extractConfig.fixed_base_ratio}% of line 6`]:part3CreditCalInfo.base_amount,
            "21 Percentage of aggregated group credit attributable to this corporation. Line 5 divided by line 6.": part3CreditCalInfo.aggregate_group_credit_percent,

        }

        return {
            computed_fields: {
                "PART 1. QUALIFIED RESEARCH EXPENSES": part1QualifiedResearchExpense,
                "PART 2. CREDIT DETERMINED UNDER c. 63, s. 38M(b), (ALTERNATE SIMPLIFIED METHOD)": part2ASCCreditCalculation,
                "PART 3. CREDIT DETERMINED UNDER c. 63, A. 38M(a)": part3CreditCal
            }
        }
    }
}