import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * Louisiana R&D Credit Calculator
 *
 * Form: LQRE-6765 — Louisiana Research & Development Tax Credit
 *
 * Louisiana uses THREE separate brackets based on the number of Louisiana employees.
 * Only ONE bracket applies per filing — determined by employeeCount on caseData.
 *
 * ┌─────────────────────────┬──────────────┬──────────────┬─────────────┐
 * │ Bracket                 │ Employees    │ Base %       │ Credit Rate │
 * ├─────────────────────────┼──────────────┼──────────────┼─────────────┤
 * │ LQRE-6765 (small)       │  1 – 49      │  50% of avg  │  30%        │
 * │ Mid-size                │ 50 – 99      │  80% of avg  │  10%        │
 * │ Large                   │ 100+         │  80% of avg  │   5%        │
 * └─────────────────────────┴──────────────┴──────────────┴─────────────┘
 *
 * Common logic across all brackets:
 *   Line 1–3 : Prior 3 years LA R&D expenditures (oldest → newest)
 *   Line 4   : Average of Lines 1–3  (÷ 3)
 *   Line 5   : Base = Line 4 × base_percentage  (50% small / 80% mid & large)
 *   Line 6   : Current year LA R&D expenditures
 *   Line 7   : Increase = max(Line 6 − Line 5, 0)
 *   Line 8   : Credit rate for bracket
 *   Line 9   : Louisiana Research Credit = Line 7 × Line 8
 *
 * Carryforward: Up to 5 years for unused credit.
 */

export interface ConfigJson {
    /** sub-contractor inclusion percentage — default 65 (i.e. 65%) */
    sub_con_percent: number;

    // --- Bracket 1: 1–49 employees ---
    /** Base percentage for small bracket — default 50 */
    base_percentage_small_c1: number;
    /** Credit rate for small bracket — default 30 */
    qre_credit_percentage_small_c1: number;

    // --- Bracket 2: 50–99 employees ---
    /** Base percentage for mid bracket — default 80 */
    base_percentage_mid_c1: number;
    /** Credit rate for mid bracket — default 10 */
    qre_credit_percentage_mid_c1: number;

    // --- Bracket 3: 100+ employees ---
    /** Base percentage for large bracket — default 80 */
    base_percentage_large_c1: number;
    /** Credit rate for large bracket — default 5 */
    qre_credit_percentage_large_c1: number;
}

/** Employee bracket identifier — drives which section of LQRE-6765 is used */
export type EmployeeBracket = "small" | "mid" | "large";

export class RdCreditCalculatorForLA {

    country    = "USA";
    creditType = "State R&D Credit - LA";
    currency   = "USD";

    async compute(
        config: ConfigJson,
        stateRdData: StateRDData,
        fiscalYear: string,
        year: number,
        caseData: Case
    ) {
        logMessage(`Computing LA Credit — fiscal year: ${fiscalYear}`);
        logMessage(`LA config: ${JSON.stringify(config)}`);

        const employeeCount: number = (caseData as any).employee_count ?? 0;
        const bracket: EmployeeBracket = employeeCount >= 100 ? "large" : employeeCount >= 50 ? "mid" : "small";
        logMessage(`LA employee count from DB: ${employeeCount}, bracket resolved: ${bracket}`);

        const creditResult   = this.computeCredit(config, stateRdData, bracket);
        const inputFields    = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country:         this.country,
            creditType:      this.creditType,
            currency:        this.currency,
            fiscalYearEnded: fiscalYear,
            currentYear:     year,
        }, config);
        const computedFields = this.buildComputedFields(creditResult, bracket, config, year);

        return {
            inputFields,
            computedFields,
            finalCredit:     creditResult.laResearchCredit,
            totalQRE:        creditResult.currentYearQre,
            totalWages:      this.round2(new Decimal(stateRdData.currentYearQREs.wages    ?? 0)),
            totalContract:   this.round2(new Decimal(stateRdData.currentYearQREs.contract ?? 0)),
            totalSupplies:   this.round2(new Decimal(stateRdData.currentYearQREs.supplies ?? 0)),
            employeeBracket: bracket,
        };
    }

    // -------------------------------------------------------------------------
    // Core credit computation — shared logic, bracket-specific rates
    // -------------------------------------------------------------------------
    private computeCredit(config: ConfigJson, stateRdData: StateRDData, bracket: EmployeeBracket) {
        const { wages = 0, contract = 0 } = stateRdData.currentYearQREs;

        //---- Current year total LA QRE (Line 6)
        const currentYearQre = new Decimal(wages)
            .plus(new Decimal(contract).mul(config.sub_con_percent / 100));

        const qreSum = stateRdData?.prior3YearsQREs.map(item => ({
            fiscalYear:       item.fiscalYear,
            wagesContractSum: new Decimal(item.wages || 0).plus(Number(item.contract || 0)),
        }));
        logMessage(`${JSON.stringify(qreSum)}`);

        //---- Lines 1–3: Prior year QREs (oldest → newest)
        const prev1Qre = new Decimal(qreSum[0]?.wagesContractSum || 0);
        const prev2Qre = new Decimal(qreSum[1]?.wagesContractSum || 0);
        const prev3Qre = new Decimal(qreSum[2]?.wagesContractSum || 0);

        //---- Line 4: 3-year average
        const line4 = prev3Qre.plus(prev2Qre).plus(prev1Qre).div(3);

        //---- Line 5: Base calculation (base% × Line 4)
        const basePct = this.getBasePct(config, bracket);
        const line5   = line4.mul(basePct / 100);

        //---- Line 7: Increase in LA R&D expenditures = max(Line 6 − Line 5, 0)
        const line7 = Decimal.max(currentYearQre.minus(line5), 0);

        //---- Line 8: Credit rate for this bracket
        const creditRate = this.getCreditRate(config, bracket);

        //---- Line 9: Louisiana Research Credit = Line 7 × Line 8
        const line9 = line7.mul(creditRate / 100);

        return {
            priorYearOldest:  this.round2(prev3Qre),       // Line 1
            priorYearMiddle:  this.round2(prev2Qre),       // Line 2
            priorYearNewest:  this.round2(prev1Qre),       // Line 3
            threeYearAverage: this.round2(line4),          // Line 4
            baseCalculation:  this.round2(line5),          // Line 5
            currentYearQre:   this.round2(currentYearQre), // Line 6
            increaseInRd:     this.round2(line7),          // Line 7
            creditRate,                                     // Line 8
            laResearchCredit: this.round2(line9),          // Line 9
            basePct,
        };
    }

    // -------------------------------------------------------------------------
    // Bracket helpers
    // -------------------------------------------------------------------------
    private getBasePct(config: ConfigJson, bracket: EmployeeBracket): number {
        if (bracket === "small") return config.base_percentage_small_c1;
        if (bracket === "mid")   return config.base_percentage_mid_c1;
        return config.base_percentage_large_c1;
    }

    private getCreditRate(config: ConfigJson, bracket: EmployeeBracket): number {
        if (bracket === "small") return config.qre_credit_percentage_small_c1;
        if (bracket === "mid")   return config.qre_credit_percentage_mid_c1;
        return config.qre_credit_percentage_large_c1;
    }

    private bracketLabel(bracket: EmployeeBracket): string {
        if (bracket === "small") return "LQRE-6765 (Less than 50 Employees)";
        if (bracket === "mid")   return "EXPENDITURES (50\u00B799 EMPLOYEES)";
        return "CREDIT FOR INCREASING R&D EXPENDITURES (100 OR MORE EMPLOYEES)";
    }

    // -------------------------------------------------------------------------
    // Input params builder
    // -------------------------------------------------------------------------
    async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], metadata: any = {}, config: ConfigJson) {
        const storeData: any[]         = [];
        const currentYearContract      = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent / 100);

        storeData.push({
            year:     metadata.currentYear,
            wages:    this.round2(currentYearQREs.wages),
            contract: this.round2(currentYearContract),
            sum:      this.round2(new Decimal(currentYearQREs.wages || 0).plus(currentYearContract)) || 0,
        });

        prior3YearsQREs.forEach(item => {
            storeData.push({
                year:     item.fiscalYear,
                wages:    item.wages,
                contract: item.contract,
                sum:      this.round2(new Decimal(item.wages || 0).plus(Number(item.contract || 0))) || 0,
            });
        });

        return {
            metadata: {
                country:             metadata.country    || "US",
                credit_type:         metadata.creditType || "STATE_RD_LA",
                currency:            metadata.currency   || "USD",
                "Fiscal Year Ended": metadata.fiscalYearEnded,
                "Description":       "Research Tax Credit",
                stateDetails:        "Lousiana - Credit Calculations",
            },
            "Current & Prior years information": storeData,
        };
    }

    // -------------------------------------------------------------------------
    // Computed fields builder — exact Excel label text (LQRE-6765 form)
    // -------------------------------------------------------------------------
    private buildComputedFields(
        result: ReturnType<RdCreditCalculatorForLA["computeCredit"]>,
        bracket: EmployeeBracket,
        config: ConfigJson,
        currentYear: number
    ) {
        
        const sectionTitle = bracket === "small"
         ? "LQRE-6765 (Less than 50 Employees)" : 
         bracket === "mid" ? "EXPENDITURES (50·99 EMPLOYEES)" :
         "CREDIT FOR INCREASING R&D EXPENDITURES (100 OR MORE EMPLOYEES)";

        const yr1Label = String(currentYear - 3);
        const yr2Label = String(currentYear - 2);
        const yr3Label = String(currentYear - 1);
        const yr6Label = String(currentYear);

        const basePctLabel = `Base Calculation (${result.basePct}% x Line 4)`;

        const creditPctLabel = bracket === "small"
            ? `Credit Percentage (${result.creditRate} % with 1 to 49 LA employees)`
            : bracket === "mid"
            ? `Credit Percentage (${result.creditRate} % with 50 to 99 LA employees)`
            : `Credit Percentage (${result.creditRate} % with 100 or more LA employees)`;

        return {
            computed_fields: {
                "RESEARCH & DEVELOPMENT TAX CREDIT CALCULATION - 6765":{},
                [sectionTitle]: {
                    [`[1] ${yr1Label} LA Research & Development Expenditures`]: result.priorYearOldest,
                    [`[2] ${yr2Label} LA Research & Development Expenditures`]: result.priorYearMiddle,
                    [`[3] ${yr3Label} LA Research & Development Expenditures`]: result.priorYearNewest,
                    "[4] 3 Previous Years Average":                             result.threeYearAverage,
                    [`[5] ${basePctLabel}`]:                                    result.baseCalculation,
                    [`[6] ${yr6Label} LA Research & Development Expenditures`]: result.currentYearQre,
                    "[7] Increase in LA R&D Expenditures (Line 6 minus Line 5)": result.increaseInRd,
                    [`[8] ${creditPctLabel}`]:                                  result.creditRate,
                    "[9] Louisiana Research Credit (Line 7 times Line 8)":      result.laResearchCredit,
                },
            },
        };
    }

    // -------------------------------------------------------------------------
    // Rounding utility
    // -------------------------------------------------------------------------
    round2(value: any): number {
        if (value === null || value === undefined) return value;
        if (Decimal.isDecimal(value)) return value.toDecimalPlaces(2).toNumber();
        if (typeof value === "number" || typeof value === "string")
            return new Decimal(value).toDecimalPlaces(2).toNumber();
        return value;
    }
}
