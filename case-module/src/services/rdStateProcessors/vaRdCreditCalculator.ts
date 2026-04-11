import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { AnnualGrossReceipt, QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * Virginia RD Credit Calculator — Form RDC
 */

export interface ConfigJson {
    qre_credit_percentage_all: number;            // 15%
    qre_credit_percentage_college: number;            // 20%
    eligible_expense_threshold: number;           // 300,000
    qre_credit_limit_all: number;             // 45,000
    qre_credit_limit_college: number;             // 60,000
    qre_credit_percentage_c1: number;      // 50%
    qre_credit_percentage_c2: number;            // 50%
    sub_con_percent: number;                // 65%
     asc_qre_credit_percentage_all: number;      // 50%
    asc_qre_credit_percentage_college: number;  
}

export class RdCreditCalculatorForVA {

    country = "USA";
    creditType = "State R&D Credit - VA";
    currency = "USD";

    /**
     * Main compute entry point — called by stateComputation.ts
     */
    async compute(config: ConfigJson, stateRdData: StateRDData, fiscalYear: string, year: number, caseData: Case) {
        logMessage(`Computing VA Credit with config: ${JSON.stringify(config)}`);

        // Schedule A — Summary of Expenses
        const scheduleA = this.scheduleA_SummaryOfExpenses(stateRdData.currentYearQREs, config,caseData);

        // Schedule B — Base Amount Determination (for Primary Credit)
        const scheduleB = this.scheduleB_BaseAmountDetermination(
            stateRdData.prior3YearsQREs,
            stateRdData.annualGrossReceipts || [],
            config
        );

        // Form RDC Section 1 — Primary Credit Calculation
        const primaryCredit = this.formRDC_Section1_PrimaryCreditCalculation(scheduleA, scheduleB, config);

        // Schedule C — ASC Calculation
        const scheduleC = this.scheduleC_AscCalculation(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, config,caseData);

        // Form RDC Section 2 — Alternative Simplified Credit
        const ascCredit = this.formRDC_Section2_AlternativeSimplifiedCredit(scheduleC, config);

        const inputFields = this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, stateRdData.annualGrossReceipts || [], {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded: fiscalYear
        });

        const computedFields = this.buildComputedFields(scheduleA, scheduleB, primaryCredit, scheduleC, ascCredit, config);

        const finalCredit = primaryCredit.credit_requested;

        return {
            inputFields,
            computedFields,
            finalCredit: finalCredit,
            totalQRE: this.round2(scheduleA.total_qualified_expenses_col_a),
            totalWages: this.round2(stateRdData.currentYearQREs.wages) || 0,
            totalContract: this.round2(stateRdData.currentYearQREs.contract) || 0,
            totalSupplies: this.round2(stateRdData.currentYearQREs.supplies) || 0,
        };
    }

    // =========================================================================
    // Schedule A — Section 1: Summary of Expenses
    // =========================================================================

    /**
     * Schedule A – Summary of Expenses
     * Lines 1-4: Contract + Supplies + Wages = Total (Column A & Column B)
     */
    scheduleA_SummaryOfExpenses(currentYearQREs: QRE, config: ConfigJson,caseData:Case) {
        // Column A — All Virginia Expenses
        const contract_col_a = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent / 100);
        const supplies_col_a = new Decimal(currentYearQREs.supplies || 0);
        const wages_col_a = new Decimal(currentYearQREs.wages || 0);
        const total_col_a = contract_col_a.plus(supplies_col_a).plus(wages_col_a);

        // Column B — College & University Expenses (placeholder — will be populated from case fields)
        const contract_col_b = new Decimal(caseData?.contract_research_expense_university_va ?? 0);
        const supplies_col_b = new Decimal(caseData?.supply_expense_university_va ?? 0);
        const wages_col_b = new Decimal(caseData?.wages_expense_university_va ?? 0);
        const total_col_b = contract_col_b.plus(supplies_col_b).plus(wages_col_b);

        return {
            contract_col_a: this.round2(contract_col_a),
            supplies_col_a: this.round2(supplies_col_a),
            wages_col_a: this.round2(wages_col_a),
            total_qualified_expenses_col_a: this.round2(total_col_a),
            contract_col_b: this.round2(contract_col_b),
            supplies_col_b: this.round2(supplies_col_b),
            wages_col_b: this.round2(wages_col_b),
            total_qualified_expenses_col_b: this.round2(total_col_b),
        };
    }

    // =========================================================================
    // Schedule B — Base Amount Determination (for Primary Credit)
    // =========================================================================

    /**
     * Schedule B
     * Section 1 — VA Qualified R&D Expenses (prior year)
     * Section 2 — Determine the Fixed Base Percentage (prior 3yr expenses / prior 3yr gross receipts)
     * Section 3 — Determine the Virginia Base Amount (fixed base % × avg 4yr gross receipts)
     * Section 4 — Virginia Base Amount = MAX(Section 3 result, 50% × Section 1 prior year expenses)
     */
    scheduleB_BaseAmountDetermination(prior3YearsQREs: QRE[], annualGrossReceipts: AnnualGrossReceipt[], config: ConfigJson) {

        // --- Section 1: VA Qualified R&D Expenses ---
        // Line 1a: Prior year QRD expenses (most recent prior year)
        const line_1a = new Decimal(prior3YearsQREs.length > 0 ? (prior3YearsQREs[0]?.qre || 0) : 0);

        // --- Section 2: Determine the Fixed Base Percentage ---
        // Lines 2a-2c: expenses for prior 3 years
        const line_2a = new Decimal(prior3YearsQREs.length >= 3 ? (prior3YearsQREs[2]?.qre || 0) : 0); // 3rd preceding
        const line_2b = new Decimal(prior3YearsQREs.length >= 2 ? (prior3YearsQREs[1]?.qre || 0) : 0); // 2nd preceding
        const line_2c = new Decimal(prior3YearsQREs.length >= 1 ? (prior3YearsQREs[0]?.qre || 0) : 0); // preceding

        // Line 2d: Total expenses
        const line_2d = line_2a.plus(line_2b).plus(line_2c);

        // Line 2e: Average QRD expenses for prior 3 years
        const line_2e = prior3YearsQREs.length >= 3 ? line_2d.div(3) : new Decimal(0);

        // Lines 2f-2h: Gross receipts for prior 3 years
        const line_2f = new Decimal(annualGrossReceipts.length >= 3 ? (annualGrossReceipts[2]?.grossReceipts || 0) : 0); // 3rd preceding
        const line_2g = new Decimal(annualGrossReceipts.length >= 2 ? (annualGrossReceipts[1]?.grossReceipts || 0) : 0); // 2nd preceding
        const line_2h = new Decimal(annualGrossReceipts.length >= 1 ? (annualGrossReceipts[0]?.grossReceipts || 0) : 0); // preceding

        // Line 2i: Total gross receipts
        const line_2i = line_2f.plus(line_2g).plus(line_2h);

        // Line 2j: Average gross receipts for prior 3 years
        const line_2j = line_2i.gt(0) ? line_2i.div(3) : new Decimal(0);

        // Line 2k: Fixed base percentage (round to 4 decimal places)
        const line_2k = line_2j.gt(0)
            ? line_2e.div(line_2j).toDecimalPlaces(4)
            : new Decimal(0);

        // --- Section 3: Determine the Virginia Base Amount ---
        // Lines 3a-3d: Gross receipts for prior 4 years
        const line_3a = new Decimal(annualGrossReceipts.length >= 4 ? (annualGrossReceipts[3]?.grossReceipts || 0) : 0); // 4th preceding
        const line_3b = new Decimal(annualGrossReceipts.length >= 3 ? (annualGrossReceipts[2]?.grossReceipts || 0) : 0); // 3rd preceding
        const line_3c = new Decimal(annualGrossReceipts.length >= 2 ? (annualGrossReceipts[1]?.grossReceipts || 0) : 0); // 2nd preceding
        const line_3d = new Decimal(annualGrossReceipts.length >= 1 ? (annualGrossReceipts[0]?.grossReceipts || 0) : 0); // preceding

        // Line 3e: Total gross receipts (4 years)
        const line_3e = line_3a.plus(line_3b).plus(line_3c).plus(line_3d);

        // Line 3f: Average gross receipts for prior 4 years
        const line_3f = line_3e.gt(0) ? line_3e.div(4) : new Decimal(0);

        // Line 3g: Base amount = fixed base % × avg 4yr gross receipts
        const line_3g = line_2k.mul(line_3f);

        // --- Section 4: Virginia Base Amount ---
        // Line 4a: MAX(line 3g, 50% × line 1a)
        const fiftyPercentPriorYear = line_1a.mul(config.qre_credit_percentage_c1 / 100);
        const line_4a = Decimal.max(line_3g, fiftyPercentPriorYear);

        return {
            // Section 1
            prior_year_qre_expenses: this.round2(line_1a),
            short_year_months: 0,
            short_year_ratio: 0,
            // Section 2
            expenses_3rd_preceding: this.round2(line_2a),
            expenses_2nd_preceding: this.round2(line_2b),
            expenses_preceding: this.round2(line_2c),
            total_expenses: this.round2(line_2d),
            avg_qrd_expenses_3yr: this.round2(line_2e),
            gross_receipts_3rd_preceding: this.round2(line_2f),
            gross_receipts_2nd_preceding: this.round2(line_2g),
            gross_receipts_preceding: this.round2(line_2h),
            total_gross_receipts_3yr: this.round2(line_2i),
            avg_gross_receipts_3yr: this.round2(line_2j),
            fixed_base_percentage: line_2k.toNumber(),
            // Section 3
            gross_receipts_4th_preceding: this.round2(line_3a),
            gross_receipts_3rd_preceding_sec3: this.round2(line_3b),
            gross_receipts_2nd_preceding_sec3: this.round2(line_3c),
            gross_receipts_preceding_sec3: this.round2(line_3d),
            total_gross_receipts_4yr: this.round2(line_3e),
            avg_gross_receipts_4yr: this.round2(line_3f),
            base_amount: this.round2(line_3g),
            // Section 4
            fifty_percent_prior_year: this.round2(fiftyPercentPriorYear),
            va_base_amount: this.round2(line_4a),
        };
    }

    // =========================================================================
    // Form RDC Section 1 — Primary Credit Calculation
    // =========================================================================

    /**
     * Form RDC Section 1 – Primary Credit Calculation (round to nearest whole dollar)
     * Line 1: VA Qualified R&D Expenses (from Schedule A)
     * Line 2: College & University percentage
     * Line 3: VA Base Amount (from Schedule B)
     * Line 4: Adjusted Expenses = Line 1 − Line 3
     * Line 5: Eligible Expenses = MIN($300,000, Line 4)
     * Line 6: Col A = Line 5 × 15%, Col B = Line 5 × 20%
     * Line 7: Credit Requested = MAX(Col A capped $45K, Col B capped $60K)
     */
    formRDC_Section1_PrimaryCreditCalculation(scheduleA: any, scheduleB: any, config: ConfigJson) {
        // Line 1: VA Qualified R&D Expenses
        const line1_col_a = new Decimal(scheduleA.total_qualified_expenses_col_a || 0);
        const line1_col_b = new Decimal(scheduleA.total_qualified_expenses_col_b || 0);

        // Line 2: College & University Expenses Percentage
        const line2 = line1_col_a.gt(0) ? line1_col_b.div(line1_col_a) : new Decimal(0);

        // Line 3: VA Base Amount
        const line3_col_a = new Decimal(scheduleB.va_base_amount || 0);
        const line3_col_b = line3_col_a.mul(line2);

        // Line 4: Adjusted Expenses
        const line4_col_a = Decimal.max(line1_col_a.minus(line3_col_a), 0);
        const line4_col_b = Decimal.max(line1_col_b.minus(line3_col_b), 0);

        // Line 5: Eligible Expenses = MIN(cap, adjusted)
        const line5_col_a = Decimal.min(new Decimal(config.eligible_expense_threshold), line4_col_a);
        const line5_col_b = Decimal.min(new Decimal(config.eligible_expense_threshold), line4_col_b);

        // Line 6: Credit Computation
        const line6_col_a = line5_col_a.mul(config.qre_credit_percentage_all / 100);
        const line6_col_b = line5_col_b.mul(config.qre_credit_percentage_college / 100);

        // Line 7: Credit Requested — MAX of (Col A capped at max_credit_primary, Col B capped at max_credit_college)
        const capped_col_a = Decimal.min(line6_col_a, new Decimal(config.qre_credit_limit_all));
        const capped_col_b = Decimal.min(line6_col_b, new Decimal(config.qre_credit_limit_college));
        const line7 = Decimal.max(capped_col_a, capped_col_b);

        return {
            // Line 1
            va_qrd_expenses_col_a: this.round2(line1_col_a),
            va_qrd_expenses_col_b: this.round2(line1_col_b),
            // Line 2
            college_percentage: this.round2(line2),
            // Line 3
            va_base_amount_col_a: this.round2(line3_col_a),
            va_base_amount_col_b: this.round2(line3_col_b),
            // Line 4
            adjusted_expenses_col_a: this.round2(line4_col_a),
            adjusted_expenses_col_b: this.round2(line4_col_b),
            // Line 5
            eligible_expenses_col_a: this.round2(line5_col_a),
            eligible_expenses_col_b: this.round2(line5_col_b),
            // Line 6
            credit_col_a: this.round2(line6_col_a),
            credit_col_b: this.round2(line6_col_b),
            // Line 7
            credit_requested_col_a: this.round2(capped_col_a),
            credit_requested_col_b: this.round2(capped_col_b),
            credit_requested: this.round2(line7),
        };
    }

    // =========================================================================
    // Schedule C — Alternative Simplified Credit Calculation
    // =========================================================================

    /**
     * Schedule C
     * Section 1 — Virginia Qualified R&D Expenses (current year)
     * Section 2 — Determination of How to Compute the Credit
     * Section 3 — Average Qualified R&D Expenses Calculation (prior 3 years)
     * Section 4 — Adjusted Expenses Calculation (Col A & Col B)
     */
    scheduleC_AscCalculation(currentYearQREs: QRE, prior3YearsQREs: QRE[], config: ConfigJson,caseData:Case) {

        // --- Section 1: Current year VA QRD expenses ---
        const line_1a_col_a = new Decimal(currentYearQREs.wages || 0)
            .plus(new Decimal(currentYearQREs.supplies || 0))
            .plus(new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent / 100));

        //const line_1a_col_b = new Decimal(0); // College & University — placeholder
          const contract_col_b = new Decimal(caseData?.contract_research_expense_university_va ?? 0);
        const supplies_col_b = new Decimal(caseData?.supply_expense_university_va ?? 0);
        const wages_col_b = new Decimal(caseData?.wages_expense_university_va ?? 0);
         const line_1a_col_b = contract_col_b.plus(supplies_col_b).plus(wages_col_b);

        // --- Section 2: Had prior 3 years expenses? ---
        const hasPrior3Years = prior3YearsQREs.length >= 3 && prior3YearsQREs.every(y => (y.qre || 0) > 0);

        if (!hasPrior3Years) {
            // No prior 3 years → use Line 1a directly as Form RDC Section 2 Line 1
            return {
                current_year_expenses_col_a: this.round2(line_1a_col_a),
                current_year_expenses_col_b: this.round2(line_1a_col_b),
                short_year_days: 0,
                short_year_ratio: 0,
                has_prior_3_years: false,
                // When no prior 3 years, adjusted = current year expenses
                adjusted_expenses_col_a: this.round2(line_1a_col_a),
                adjusted_expenses_col_b: this.round2(line_1a_col_b),
                expenses_3rd_preceding: 0,
                expenses_2nd_preceding: 0,
                expenses_preceding: 0,
                total_prior_3yr_expenses: 0,
                avg_prior_3yr_expenses: 0,
                avg_times_50_percent_col_a: 0,
                avg_times_50_percent_col_b: 0,
                college_percentage: 0,
                avg_prior_3yr_col_a: 0,
                avg_prior_3yr_col_b: 0,
            };
        }

        // --- Section 3: Average QRD Expenses for prior 3 years ---
        const line_3a = new Decimal(prior3YearsQREs[2]?.qre || 0); // 3rd preceding
        const line_3b = new Decimal(prior3YearsQREs[1]?.qre || 0); // 2nd preceding
        const line_3c = new Decimal(prior3YearsQREs[0]?.qre || 0); // preceding
        const line_3d = line_3a.plus(line_3b).plus(line_3c);
        const line_3e = line_3d.div(3);

        // --- Section 4: Adjusted Expenses Calculation ---
        // Line 4a: Current year expenses (Col A includes Col B)
        const line_4a_col_a = line_1a_col_a;
        const line_4a_col_b = line_1a_col_b;

        // Line 4b: College percentage
        const line_4b = line_4a_col_a.gt(0) ? line_4a_col_b.div(line_4a_col_a) : new Decimal(0);

        // Line 4c: Col A = avg from Line 3e, Col B = Col A × percentage
        const line_4c_col_a = line_3e;
        const line_4c_col_b = line_4c_col_a.mul(line_4b);

        // Line 4d: Multiply Line 4c by 50%
        const line_4d_col_a = line_4c_col_a.mul(config.qre_credit_percentage_c2 / 100);
        const line_4d_col_b = line_4c_col_b.mul(config.qre_credit_percentage_c2 / 100);

        // Line 4e: Subtract Line 4d from Line 4a
        const line_4e_col_a = Decimal.max(line_4a_col_a.minus(line_4d_col_a), 0);
        const line_4e_col_b = Decimal.max(line_4a_col_b.minus(line_4d_col_b), 0);

        return {
            current_year_expenses_col_a: this.round2(line_1a_col_a),
            current_year_expenses_col_b: this.round2(line_1a_col_b),
            short_year_days: 0,
            short_year_ratio: 0,
            has_prior_3_years: true,
            expenses_3rd_preceding: this.round2(line_3a),
            expenses_2nd_preceding: this.round2(line_3b),
            expenses_preceding: this.round2(line_3c),
            total_prior_3yr_expenses: this.round2(line_3d),
            avg_prior_3yr_expenses: this.round2(line_3e),
            college_percentage: this.round2(line_4b),
            avg_prior_3yr_col_a: this.round2(line_4c_col_a),
            avg_prior_3yr_col_b: this.round2(line_4c_col_b),
            avg_times_50_percent_col_a: this.round2(line_4d_col_a),
            avg_times_50_percent_col_b: this.round2(line_4d_col_b),
            adjusted_expenses_col_a: this.round2(line_4e_col_a),
            adjusted_expenses_col_b: this.round2(line_4e_col_b),
        };
    }

    // =========================================================================
    // Form RDC Section 2 — Alternative Simplified Credit
    // =========================================================================

    /**
     * Form RDC Section 2 — uses Schedule C output
     * Same credit computation as Section 1 but with ASC adjusted expenses
     */
    formRDC_Section2_AlternativeSimplifiedCredit(scheduleC: any, config: ConfigJson) {
        const expenses_col_a = new Decimal(scheduleC.adjusted_expenses_col_a || 0);
        const expenses_col_b = new Decimal(scheduleC.adjusted_expenses_col_b || 0);

        // Eligible = MIN(cap, adjusted)
        const eligible_col_a = Decimal.min(new Decimal(config.eligible_expense_threshold), expenses_col_a);
        const eligible_col_b = Decimal.min(new Decimal(config.eligible_expense_threshold), expenses_col_b);

        // Credit
        const credit_col_a = eligible_col_a.mul(config.asc_qre_credit_percentage_all / 100);
        const credit_col_b = eligible_col_b.mul(config.asc_qre_credit_percentage_college / 100);

        // Capped
        const capped_col_a = Decimal.min(credit_col_a, new Decimal(config.qre_credit_limit_all));
        const capped_col_b = Decimal.min(credit_col_b, new Decimal(config.qre_credit_limit_college));
        const credit_requested = Decimal.max(capped_col_a, capped_col_b);

        return {
            asc_expenses_col_a: this.round2(expenses_col_a),
            asc_expenses_col_b: this.round2(expenses_col_b),
            asc_eligible_col_a: this.round2(eligible_col_a),
            asc_eligible_col_b: this.round2(eligible_col_b),
            asc_credit_col_a: this.round2(credit_col_a),
            asc_credit_col_b: this.round2(credit_col_b),
            asc_credit_requested: this.round2(credit_requested),
        };
    }

    // =========================================================================
    // Build Input Params
    // =========================================================================

    buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], annualGrossReceipts: AnnualGrossReceipt[], metadata: any = {}) {

        const qreSummary: Record<string, any> = {
            wages: currentYearQREs.wages,
            supplies: currentYearQREs.supplies,
            contract: currentYearQREs.contract,
        };

        prior3YearsQREs.forEach((item, i) => {
            qreSummary[`prior_year_qre_${i + 1}`] = item.qre || 0;
        });

        annualGrossReceipts.forEach((item, i) => {
            qreSummary[`prior_year_gross_receipts_${i + 1}`] = item.grossReceipts || 0;
        });

        return {
            metadata: {
                country: metadata.country || "US",
                credit_type: metadata.creditType || "STATE_VA",
                currency: metadata.currency || "USD",
                "Fiscal Year Ended": metadata.fiscalYearEnded,
                "Description": "Research Tax Credit",
                stateDetails: "Virginia - Credit Calculation",
            },
        };
    }

    // =========================================================================
    // Build Computed Fields
    // =========================================================================

    buildComputedFields(scheduleA: any, scheduleB: any, primaryCredit: any, scheduleC: any, ascCredit: any, config: ConfigJson) {

        // ── Section 1 – Primary Credit Calculation ──
        const formRDC_section1_fields = [
            {
                "Column Name": "Column A",
                "SubColumn Name": "All qualified R&D Amt",
                "[1] Virginia Qualified Research and Development Expenses. Enter amount paid or incurred during the calendar year. (See Schedule A, Section 1, Line 4, Columns A and B).": primaryCredit.va_qrd_expenses_col_a,
                "[2] College and University Expenses Percentage. If expenses were incurred in conjunction with a Virginia college or university, divide the amount on Line 1, Column B by the amount on Line 1, Column A. Enter in Column B.": primaryCredit.college_percentage,
                "[3] Virginia Base Amount for the Taxable Year. Enter the amount from Schedule B, Line 4a in Column A.": primaryCredit.va_base_amount_col_a,
                "[4] Adjusted Expenses Amount. Subtract Line 3 from Line 1.": primaryCredit.adjusted_expenses_col_a,
                [`[5] Total Eligible Research Expenses. Enter the lesser of $${config.eligible_expense_threshold.toLocaleString()} or the amount from Line 4.`]: primaryCredit.eligible_expenses_col_a,
                [`[6] Credit Computation. Multiply Line 5 by ${config.qre_credit_percentage_all}% (${config.qre_credit_percentage_all / 100}).`]: primaryCredit.credit_col_a,
                [`[7] Credit Requested. Enter the greater of Line 6, Column A (not to exceed $${config.qre_credit_limit_all.toLocaleString()}) or Column B (not to exceed $${config.qre_credit_limit_college.toLocaleString()}).`]: primaryCredit.credit_requested_col_a,
            },
            {
                "Column Name": "Column B",
                "SubColumn Name": "College & University R&D Amt",
                "[1] Virginia Qualified Research and Development Expenses. Enter amount paid or incurred during the calendar year. (See Schedule A, Section 1, Line 4, Columns A and B).": primaryCredit.va_qrd_expenses_col_b,
                "[2] College and University Expenses Percentage. If expenses were incurred in conjunction with a Virginia college or university, divide the amount on Line 1, Column B by the amount on Line 1, Column A. Enter in Column B.": primaryCredit.college_percentage,
                "[3] College and University Base Amount. If expenses were incurred in conjunction with a Virginia college or university, multiply the amount in Column A by the percentage on Line 2 and enter in Column B.": primaryCredit.va_base_amount_col_b,
                "[4] Adjusted Expenses Amount. Subtract Line 3 from Line 1.": primaryCredit.adjusted_expenses_col_b,
                [`[5] Eligible College and University Research Expenses. Enter the lesser of $${config.eligible_expense_threshold.toLocaleString()} or the amount from Line 4.`]: primaryCredit.eligible_expenses_col_b,
                [`[6] Credit Computation. Multiply Line 5 by ${config.qre_credit_percentage_college}% (${config.qre_credit_percentage_college / 100}).`]: primaryCredit.credit_col_b,
                [`[7] Credit Requested. Enter the greater of Line 6, Column A (not to exceed $${config.qre_credit_limit_all.toLocaleString()}) or Column B (not to exceed $${config.qre_credit_limit_college.toLocaleString()}).`]: primaryCredit.credit_requested,
            },
        ];

        // ── Section 2 – Alternative Simplified Credit Calculation ──
        const formRDC_section2_fields = [
            {
                "Column Name": "Column A",
                "SubColumn Name": "All qualified R&D Amt",
                "[1] Total Adjusted Calendar Year Qualified Research and Development Expenses. Enter the amount(s) from Schedule C, Line 4e in the applicable column(s). Taxpayers without qualified research and development expenses for the preceding 3 taxable years, enter the applicable amount(s) from Schedule C, Line 1a in the applicable column(s).": ascCredit.asc_expenses_col_a,
            },
            {
                "Column Name": "Column B",
                "SubColumn Name": "College & University R&D Amt",
                "[1] Total Adjusted Calendar Year Qualified Research and Development Expenses. Enter the amount(s) from Schedule C, Line 4e in the applicable column(s). Taxpayers without qualified research and development expenses for the preceding 3 taxable years, enter the applicable amount(s) from Schedule C, Line 1a in the applicable column(s).": ascCredit.asc_expenses_col_b,
            },
        ];

        // ── Section 1 – Summary of Expenses ──
        const scheduleA_fields = [
            {
                "Column Name": "Column A",
                "SubColumn Name": "All Virginia Exp",
                "[1] Contract Research Expenses. Enter amount from Schedule RD-CON, Column G.": scheduleA.contract_col_a,
                "[2] Supply Expenses. Enter the amount from Schedule RD-SUP, Column C.": scheduleA.supplies_col_a,
                "[3] Wages. Enter the amount from Schedule RD-WAGE, Column C.": scheduleA.wages_col_a,
                "[4] Total Qualified Expenses. Add Lines 1-3.": scheduleA.total_qualified_expenses_col_a,
            },
            {
                "Column Name": "Column B",
                "SubColumn Name": "College & University Exp",
                "[1] Contract Research Expenses. Enter the amount associated with a college or university.": scheduleA.contract_col_b,
                "[2] Supply Expenses. Enter the amount associated with a college or university.": scheduleA.supplies_col_b,
                "[3] Wages. Enter the amount associated with a college or university.": scheduleA.wages_col_b,
                "[4] Total Qualified Expenses. Add Lines 1-3.": scheduleA.total_qualified_expenses_col_b,
            },
        ];

        // ── Section 1 – VA Qualified Research and Development Expenses ──
        const scheduleB_sec1_fields = {
            "[1a] VA Qualified Research and Development Expenses in CY. For FY filers, this will include a portion of 2 taxable years.": scheduleB.prior_year_qre_expenses,
            "[1b] Short year filers only: Enter the number of months included in the short year.": scheduleB.short_year_months,
            "[1c] Short year filers only: Divide the number of months in Line 1b by 12.": scheduleB.short_year_ratio,
        };

        // ── Section 2 – Determine the Fixed Base Percentage ──
        const scheduleB_sec2_fields = {
            "[2a] Expenses for the 3rd preceding taxable year.": scheduleB.expenses_3rd_preceding,
            "[2b] Expenses for the 2nd preceding taxable year.": scheduleB.expenses_2nd_preceding,
            "[2c] Expenses for the preceding taxable year.": scheduleB.expenses_preceding,
            "[2d] Total Expenses. Add Lines 2a-2c.": scheduleB.total_expenses,
            "[2e] Average Qualified Research and Development Expenses for the Prior 3 Taxable Years. Divide amount on Line 2d by 3.": scheduleB.avg_qrd_expenses_3yr,
            "[2f] Gross receipts for the 3rd preceding taxable year.": scheduleB.gross_receipts_3rd_preceding,
            "[2g] Gross receipts for the 2nd preceding taxable year.": scheduleB.gross_receipts_2nd_preceding,
            "[2h] Gross receipts for the preceding taxable year.": scheduleB.gross_receipts_preceding,
            "[2i] Total Gross Receipts. Add Lines 2f through 2h.": scheduleB.total_gross_receipts_3yr,
            "[2j] Average Gross Receipts for Prior 3 Taxable Years. Divide Line 2i by 3.": scheduleB.avg_gross_receipts_3yr,
            "[2k] Percentage of Virginia Qualified Research and Development Expenses. Divide Line 2e by 2j (round to 4 decimal places).": scheduleB.fixed_base_percentage,
        };

        // ── Section 3 – Determine the Virginia Base Amount ──
        const scheduleB_sec3_fields = {
            "[3a] Gross receipts for the 4th preceding taxable year.": scheduleB.gross_receipts_4th_preceding,
            "[3b] Gross receipts for the 3rd preceding taxable year.": scheduleB.gross_receipts_3rd_preceding_sec3,
            "[3c] Gross receipts for the 2nd preceding taxable year.": scheduleB.gross_receipts_2nd_preceding_sec3,
            "[3d] Gross receipts for the preceding taxable year.": scheduleB.gross_receipts_preceding_sec3,
            "[3e] Total Gross Receipts. Add Lines 3a through 3d.": scheduleB.total_gross_receipts_4yr,
            "[3f] Average Gross Receipts for Prior 4 Taxable Years. Divide Line 3e by 4.": scheduleB.avg_gross_receipts_4yr,
            "[3g] Base Amount. Calendar Year Filers: Multiply Line 2k by Line 3f. Short Year Filers: Multiply Line 2k by Line 3f. Then multiply the product by Line 1c.": scheduleB.base_amount,
        };

        // ── Section 4 – Virginia Base Amount ──
        const scheduleB_sec4_fields = {
            [`[4a] Virginia Base Amount. Your Virginia Base Amount is the greater of the amount on Line 3g OR ${config.qre_credit_percentage_c1}% (${config.qre_credit_percentage_c1 / 100}) of the Virginia Qualified Expenses from Line 1a. Enter here and on Form RDC, Section 1, Line 3, Column A.`]: scheduleB.va_base_amount,
        };

        // ── Section 1 – Virginia Qualified Research and Development Expenses ──
        const scheduleC_sec1_fields = {
            "[1a] Virginia Qualified Research and Development Expenses in CY. Column A.": scheduleC.current_year_expenses_col_a,
         //   "[1a] Virginia Qualified Research and Development Expenses in CY. Column B.": scheduleC.current_year_expenses_col_b,
            "[1b] Short year filers only: Enter the number of days included in the short year.": scheduleC.short_year_days,
            "[1c] Short year filers only: Divide the number of days in Line 1b by 365 (366 if a leap year).": scheduleC.short_year_ratio,
        };

        // ── Section 2 – Determination of How to Compute the Credit ──
        const scheduleC_sec2_fields = {
            "[2] Were research and development expenses paid or incurred for the 3 taxable years immediately preceding the taxable year for which the credit is being claimed? If Yes, complete Sections 3 and 4 below. If no, stop here and enter the amount(s) on Line 1a above on Form RDC Section 2, Line 1.": scheduleC.has_prior_3_years ? "Yes" : "No",
        };

        // ── Section 3 – Average Qualified Research and Development Expenses Calculation ──
        const scheduleC_sec3_fields = {
            "[3a] Expenses for the 3rd preceding taxable year.": scheduleC.expenses_3rd_preceding,
            "[3b] Expenses for the 2nd preceding taxable year.": scheduleC.expenses_2nd_preceding,
            "[3c] Expenses for the preceding taxable year.": scheduleC.expenses_preceding,
            "[3d] Total expenses from preceding 3 taxable years. Add Lines 3a-3c.": scheduleC.total_prior_3yr_expenses,
            "[3e] Average qualified research and development expenses for the preceding 3 taxable years. Divide amount on Line 3d by 3. If the credit year is a short taxable year, multiply the average qualified research and development expenses for the preceding 3 taxable years by the amount determined in Line 1c.": scheduleC.avg_prior_3yr_expenses,
        };

        // ── Section 4 – Adjusted Expenses Calculation ──
        const scheduleC_sec4_fields = [
            {
                "Column Name": "Column A",
                "SubColumn Name": "All qualified R&D Amt",
                "[4a] Enter the current year expenses. Column A must include the amount reported in Column B, if any.": scheduleC.current_year_expenses_col_a,
                "[4b] If expenses were incurred in connection with a Virginia college or university, divide the amount on Line 4a, Column B by the amount on Line 4a, Column A.": scheduleC.college_percentage,
                "[4c] Enter the amount from Line 3e.": scheduleC.avg_prior_3yr_col_a,
                [`[4d] Multiply the amount(s) on Line 4c by ${config.qre_credit_percentage_c2}% (${config.qre_credit_percentage_c2 / 100}).`]: scheduleC.avg_times_50_percent_col_a,
                "[4e] Subtract Line 4d from Line 4a. Enter here and on Form RDC, Section 2, Line 1 in the applicable column(s).": scheduleC.adjusted_expenses_col_a,
            },
            {
                "Column Name": "Column B",
                "SubColumn Name": "College & University R&D Amt",
                "[4a] Enter the current year expenses. Column A must include the amount reported in Column B, if any.": scheduleC.current_year_expenses_col_b,
                "[4b] If expenses were incurred in connection with a Virginia college or university, divide the amount on Line 4a, Column B by the amount on Line 4a, Column A.": scheduleC.college_percentage,
                "[4c] If expenses were incurred in connection with a Virginia college or university, multiply the amount on Line 4c, Column A by the percentage on Line 4b, Column B.": scheduleC.avg_prior_3yr_col_b,
                [`[4d] Multiply the amount(s) on Line 4c by ${config.qre_credit_percentage_c2}% (${config.qre_credit_percentage_c2 / 100}).`]: scheduleC.avg_times_50_percent_col_b,
                "[4e] Subtract Line 4d from Line 4a. Enter here and on Form RDC, Section 2, Line 1 in the applicable column(s).": scheduleC.adjusted_expenses_col_b,
            },
        ];

        return {

                virginia: {
                    "Section 1 – Summary of Expenses": scheduleA_fields,
                    "Section 1 – Primary Credit Calculation Round to the nearest whole dollar.": formRDC_section1_fields,
                    "Section 2 – Alternative Simplified Credit Calculation": formRDC_section2_fields,
                },
                computed_fields: {
                    "Section 1 – VA Qualified Research and Development Expenses": scheduleB_sec1_fields,
                    "Section 2 – Determine the Fixed Base Percentage": scheduleB_sec2_fields,
                    "Section 3 – Determine the Virginia Base Amount": scheduleB_sec3_fields,
                    "Section 4 – Virginia Base Amount": scheduleB_sec4_fields,
                    "Section 1 – Virginia Qualified Research and Development Expenses": scheduleC_sec1_fields,
                    "Section 2 – Determination of How to Compute the Credit": scheduleC_sec2_fields,
                    "Section 3 – Average Qualified Research and Development Expenses Calculation": scheduleC_sec3_fields,
                },
                virginiasection4: {
                    "Section 4 – Adjusted Expenses Calculation": scheduleC_sec4_fields,
                },
        };
    }

    // =========================================================================
    // Utility
    // =========================================================================

    round2(value: any) {
        if (value === null || value === undefined) return value;
        if (Decimal.isDecimal(value)) {
            return value.toDecimalPlaces(2).toNumber();
        }
        if (typeof value === "number" || typeof value === "string") {
            return new Decimal(value).toDecimalPlaces(2).toNumber();
        }
        return value;
    }
}
