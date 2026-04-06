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
        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear : year
        },config);
        const computedFields = this.buildComputedFields(creditResult, bracket, config);

        return {
            inputFields,
            computedFields,
            finalCredit:   creditResult.la_research_credit,
            totalQRE:      creditResult.current_year_qre,
            totalWages:    this.round2(new Decimal(stateRdData.currentYearQREs.wages    ?? 0)),
            totalContract: this.round2(new Decimal(stateRdData.currentYearQREs.contract ?? 0)),
            totalSupplies: this.round2(new Decimal(stateRdData.currentYearQREs.supplies ?? 0)),
            employeeBracket: bracket,
        };
    }

    // -------------------------------------------------------------------------
    // Core credit computation — shared logic, bracket-specific rates
    // -------------------------------------------------------------------------
    private computeCredit(config: ConfigJson, stateRdData: StateRDData, bracket: EmployeeBracket) {
        const { wages = 0, supplies = 0, contract = 0 } = stateRdData.currentYearQREs;

        //---- Current year total LA QRE (Line 6)
        const currentYearQRE = new Decimal(wages)
            .plus(new Decimal(supplies))
            .plus(new Decimal(contract).mul(config.sub_con_percent / 100));

        //---- Prior 3 years QRE (Lines 1, 2, 3) — oldest to newest
        //     prior3YearsQREs[0] = most recent prior year (e.g. 2024)
        //     prior3YearsQREs[1] = 2 years ago (e.g. 2023)
        //     prior3YearsQREs[2] = 3 years ago (e.g. 2022)
        const prior1 = new Decimal(stateRdData.prior3YearsQREs?.[3]?.qre ?? 0); // oldest
        const prior2 = new Decimal(stateRdData.prior3YearsQREs?.[2]?.qre ?? 0);
        const prior3 = new Decimal(stateRdData.prior3YearsQREs?.[1]?.qre ?? 0); // most recent prior

        //---- Line 4: 3-year average
        const line4 = prior1.plus(prior2).plus(prior3).div(3);

        //---- Line 5: Base calculation (base% × Line 4)
        const basePct = this.getBasePct(config, bracket);
        const line5   = line4.mul(basePct / 100);

        //---- Line 7: Increase in LA R&D expenditures = max(Line 6 − Line 5, 0)
        const line7 = Decimal.max(currentYearQRE.minus(line5), 0);

        //---- Line 8: Credit rate for this bracket
        const creditRate = this.getCreditRate(config, bracket);

        //---- Line 9: Louisiana Research Credit = Line 7 × Line 8
        const line9 = line7.mul(creditRate / 100);

        return {
            prior_year_oldest:   this.round2(prior1),   // Line 1
            prior_year_middle:   this.round2(prior2),   // Line 2
            prior_year_newest:   this.round2(prior3),   // Line 3
            three_year_average:  this.round2(line4),    // Line 4
            base_calculation:    this.round2(line5),    // Line 5
            current_year_qre:    this.round2(currentYearQRE), // Line 6
            increase_in_rd:      this.round2(line7),    // Line 7
            credit_rate:         creditRate,             // Line 8
            la_research_credit:  this.round2(line9),    // Line 9
            base_pct:            basePct,
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
    async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], metadata: any = {},config : ConfigJson ) {
        
                let storeData : any[] = []
                let currentYearContract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent/100) || 0;
                storeData.push({
                    year : metadata.currentYear,
                    wages: this.round2(currentYearQREs.wages),
                    contract: this.round2(currentYearContract),
                    sum: this.round2(new Decimal(currentYearQREs.wages || 0).plus(currentYearContract)) || 0
                })
         
                prior3YearsQREs.forEach((item) => {
                    storeData.push({
                        year : item.fiscalYear,
                        wages: item.wages,
                        contract: item.contract,
                        sum: this.round2(new Decimal(item.wages || 0).plus(Number(item.contract || 0))) || 0
                    })
                });
        
                return {
                    metadata: {
                        country: metadata.country || "US",
                        credit_type: metadata.creditType || "STATE_RD_LA",
                        currency: metadata.currency || "USD",
                        "Fiscal Year Ended" : metadata.fiscalYearEnded,
                        "Description": "Research Tax Credit",
                        stateDetails : "Lousiana - Credit Calculations"
                    },
                    "Current & Prior years information" : storeData
                };
            }

    // -------------------------------------------------------------------------
    // Computed fields builder — exact Excel label text (LQRE-6765 form)
    // -------------------------------------------------------------------------
    private buildComputedFields(
        result: ReturnType<RdCreditCalculatorForLA["computeCredit"]>,
        bracket: EmployeeBracket,
        config: ConfigJson
    ) {
        const sectionTitle = `RESEARCH & DEVELOPMENT TAX CREDIT CALCULATION - 6765`;

        // Line 1/2/3 year labels differ per bracket in the Excel:
        //   small  (1-49):   1=2022, 2=2023, 3=2024
        //   mid   (50-99):   1=2021, 2=2022, 3=2023
        //   large (100+):    1=2021, 2=2022, 3=2023
        const [yr1Label, yr2Label, yr3Label, yr6Label] = this.getYearLabels(bracket);

        // Line 5 base % label
        const basePctLabel = bracket === "small"
            ? `Base Calculation (${result.base_pct}% x Line 4)`
            : `Base Calculation (${result.base_pct}% x Line 4)`;

        // Line 8 credit % label — exact Excel wording per bracket
        const creditPctLabel = bracket === "small"
            ? `Credit Percentage (${result.credit_rate} % with 1 to 49 LA employees)`
            : bracket === "mid"
            ? `Credit Percentage (${result.credit_rate} % with 50 to 99 LA employees)`
            : `Credit Percentage (${result.credit_rate} % with 100 or more LA employees)`;

        return {
            computed_fields: {
                [sectionTitle]: {
                    [`[1] ${yr1Label} LA Research & Development Expenditures`]:
                        result.prior_year_oldest,
                    [`[2] ${yr2Label} LA Research & Development Expenditures`]:
                        result.prior_year_middle,
                    [`[3] ${yr3Label} LA Research & Development Expenditures`]:
                        result.prior_year_newest,
                    "[4] 3 Previous Years Average":
                        result.three_year_average,
                    [`[5] ${basePctLabel}`]:
                        result.base_calculation,
                    [`[6] ${yr6Label} LA Research & Development Expenditures`]:
                        result.current_year_qre,
                    "[7] Increase in LA R&D Expenditures (Line 6 minus Line 5)":
                        result.increase_in_rd,
                    [`[8] ${creditPctLabel}`]:
                        result.credit_rate,
                    "[9] Louisiana Research Credit (Line 7 times Line 8)":
                        result.la_research_credit,
                }
            },
        };
    }

    // Returns [line1Year, line2Year, line3Year, line6Year] labels per bracket
    private getYearLabels(bracket: EmployeeBracket): [string, string, string, string] {
        // small (1-49): prior years are 2022, 2023, 2024; current = 2024
        if (bracket === "small") return ["2022", "2023", "2024", "2024"];
        // mid (50-99) and large (100+): prior years are 2021, 2022, 2023; current = 2024
        return ["2021", "2022", "2023", "2024"];
    }

    // -------------------------------------------------------------------------
    // Rounding utility — consistent with AZ / CA / CO / KS implementations
    // -------------------------------------------------------------------------
    round2(value: any): number {
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