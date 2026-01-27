import { Decimal } from "decimal.js";
import { AnnualGrossReceipt, QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";


export interface ConfigJson {
    credit_rate: number;
    sub_con_percent: number;
    qre_cap_rate: number;
    fixed_base_ratio: number;
    total_group_qre_percent : number;
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
    async compute(config: ConfigJson, stateRdData: StateRDData, fiscalYear : string, year : string, caseDetails : Case) {
        const part1QualifiedResearchExpenseInfo = this.part1QualifiedResearchExpense(stateRdData.currentYearQREs, config, caseDetails);
        const part2ASCCreditCalculationInfo = this.part2ASCCreditCalculation(stateRdData.prior3YearsQREs, part1QualifiedResearchExpenseInfo.total_qre, part1QualifiedResearchExpenseInfo.total_qre_aggregate, config);
        const part3CreditCalInfo = this.part3CreditCalculation(stateRdData.annualGrossReceipts || [], part2ASCCreditCalculationInfo.aggregate_group_credit_percent, config, part1QualifiedResearchExpenseInfo.total_qre_aggregate, part1QualifiedResearchExpenseInfo.total_qre, caseDetails);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, stateRdData.annualGrossReceipts || [], {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear : year
        },config);

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
    part1QualifiedResearchExpense(currentYearQREs: QRE, config: ConfigJson, caseData : Case) {
        const current_year_wages = new Decimal(currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent/100) || 0;
        const current_year_supply = new Decimal(currentYearQREs.supplies || 0.00)
        const qualified_computer_rental_time_expenses = new Decimal(caseData.qualified_computer_rental_time_expenses || 0.00)

        const total_qre = current_year_wages.plus(current_year_contract).plus(current_year_supply).plus(qualified_computer_rental_time_expenses);

        const total_qre_aggregate = total_qre;

        return {
            current_year_wages,
            current_year_contract,
            current_year_supply,
            qualified_computer_rental_time_expenses,
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
        const total_qre = new Decimal(prior3YearsQREs.reduce((sum, item) => sum + Number(item.qre), 0));
        const average_qre = total_qre.div(3);

        const fifty_percent_qre = average_qre.mul(config.qre_cap_rate/100);
        const excess_qre = part1TotalQre.minus(fifty_percent_qre)

        const final_excess_qre = new Decimal(excess_qre.lt(0) ? 0 : excess_qre);
        const applicable_credit_rate = config.credit_rate;

        const total_credit_group = final_excess_qre.mul(config.credit_rate/100);

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
    part3CreditCalculation(annualGrossReceipts: AnnualGrossReceipt[], aggregate_group_credit_percent: Decimal, config: ConfigJson, part1TotalAggregate : Decimal, part1TotalQre : Decimal,  caseDetails : Case) {

        const currentFiscalYear = caseDetails.fiscal_year;
        // Filter out current year
        const previousYearsGrossReceipts = annualGrossReceipts.filter(
            (item) => item.fiscalYear !== currentFiscalYear
        );

        // Sum grossReceipts from previous years
        const totalPreviousGrossReceipts = new Decimal(previousYearsGrossReceipts.reduce(
            (sum, item) => sum + Number(item.grossReceipts || 0), 0));
        const avg_total_previous_receipts = totalPreviousGrossReceipts.div(previousYearsGrossReceipts.length);

        const fixed_base_ratio = config.fixed_base_ratio;

        const base_amount = avg_total_previous_receipts.mul(config.fixed_base_ratio/100);
        const calculateDifference = part1TotalAggregate.minus(base_amount)
        const line17 = new Decimal(calculateDifference.lessThan(0) ? 0.00 : calculateDifference);
        const line18 = line17.mul(config.total_group_qre_percent/100)
        const line19 = caseDetails.basic_research_payments || 0.00
        const line20 = new Decimal(line18.add(line19))
        const line21 = part1TotalQre.div(part1TotalAggregate)
        const line21Final = line21.mul(100)
        const line22 = line20.mul(line21)

        return {
            fixed_base_ratio,
            avg_total_previous_receipts : this.round2(avg_total_previous_receipts),
            base_amount : this.round2(base_amount),
            aggregate_group_credit_percent,
            line17 : this.round2(line17),
            line18 : this.round2(line18),
            line19 : this.round2(line19),
            line20 : this.round2(line20),
            line21Final,
            line22 : this.round2(line22)
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
    async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], annualGrossReceipts: any[], metadata: any = {}, config : ConfigJson) {
        let storeData : any[] = []
        let annualGrossReceiptsData :any[] = []
        let currentYearContract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent / 100) || 0;
        storeData.push({
            year : metadata.currentYear,
            wages: currentYearQREs.wages,
            sum: new Decimal(currentYearQREs.wages || 0).plus(currentYearContract),
            contract: currentYearContract

        })
        annualGrossReceipts.forEach((item) => {
            annualGrossReceiptsData.push({
                year : item.fiscalYear,
                grossReceipts: item.grossReceipts
            })
        });

        prior3YearsQREs.forEach((item) => {
            storeData.push({
                year : item.fiscalYear,
                wages: item.wages,
                contract: item.contract,
                sum: new Decimal(item.wages || 0).plus(Number(item.contract || 0))
            })
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
            "Current & Prior years information" : storeData,
            "Gross Receipts Information" : annualGrossReceiptsData
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
            "1 Qualified wage expenses for this corporation": this.round2(part1QualifiedResearchExpenseInfo.current_year_wages),
            "2 Qualified supply expenses for this corporation": this.round2(part1QualifiedResearchExpenseInfo.current_year_supply),
            "3 Qualified computer rental time expenses for this corporation": this.round2(part1QualifiedResearchExpenseInfo.qualified_computer_rental_time_expenses),
            [`4 Enter ${extractConfig.sub_con_percent}% of qualified contract expenses for this corporation`]: this.round2(part1QualifiedResearchExpenseInfo.current_year_contract),
            "5 Total qualified research expenses for this corporation. Add lines 1 through 4": this.round2(part1QualifiedResearchExpenseInfo.total_qre),
            "6 Total qualified research expenses for this aggregate group": this.round2(part1QualifiedResearchExpenseInfo.total_qre_aggregate)
        }
        let part2ASCCreditCalculation = {
            "text" : "If using the Alternative Simplified Method and you did not have qualified research expenses in each of the three prior years, fill in oval Also skip lines 7 through 10",
            "7 Average qualified research expenses for the 3 most recent prior years":part2ASCCreditCalculationInfo.average_qre,
            [`8 Enter ${extractConfig.qre_cap_rate}% of line 7`]:part2ASCCreditCalculationInfo.fifty_percent_qre,
            "9 Subtract the amount on line 8 from current year expenses on line 6. Not less than 0":part2ASCCreditCalculationInfo.final_excess_qre,
            "10 Applicable rate for Alternative Simplified Method":`${part2ASCCreditCalculationInfo.applicable_credit_rate}%`,   
            "11 Total credit for the group. if the taxpayer did not have qualified research expenses in each of the three prior years,enter 5% of the amount on line 6; otherwise, multiply line 9 by line 10":part2ASCCreditCalculationInfo.total_credit_group,
            "12 Percentage of aggregate group credit attributable to this corporation. Line 5 divided by line 6":`${part2ASCCreditCalculationInfo.aggregate_group_credit_percent}%`,
            "13 Amount of group credit for this corporation. Multiply line 11 by line 12":part2ASCCreditCalculationInfo.amount_group_credit
        }
        let part3CreditCal = {
            "14 Fixed-base ratio (see instructions)":`${part3CreditCalInfo.fixed_base_ratio}%`,
            "15 Average annual gross receipts from the 4 most recent taxable years":part3CreditCalInfo.avg_total_previous_receipts,
            [`16 Base amount. Multiply line 14 by line 15. Not less than ${extractConfig.fixed_base_ratio}% of line 6`]:part3CreditCalInfo.base_amount,
            "17 Subtract line 16 from current year expenses on line 6. Not less than 0" : part3CreditCalInfo.line17,
            [`18 Total group credit for qualified research expenses. Multiply line 17 by ${extractConfig.total_group_qre_percent}%`]: part3CreditCalInfo.line18,
            "19 Total group credit for basic research payments (see instructions)" : part3CreditCalInfo.line19,
            "20 Total Research Credit for aggregate group. Combine line 18 and 19" : part3CreditCalInfo.line20,
            "21 Percentage of aggregated group credit attributable to this corporation. Line 5 divided by line 6.": `${part3CreditCalInfo.line21Final}%`,
            "22 Amount of credit for this corporation. Multiply line 20 by line 21." : part3CreditCalInfo.line22
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