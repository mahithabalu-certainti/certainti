import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * New York R&D Credit Calculator
 *
 * Form: Excelsior Research and Development Tax Credit (NY)
 *
 * New York's Excelsior R&D Credit is a flat-rate credit applied to qualified
 * R&D expenditures attributable to activities conducted in New York State.
 * The rate depends on the project type:
 *
 *   Standard project                        →  6% of NY qualified R&D expenses
 *   Qualified semiconductor supply chain    →  7% of NY qualified R&D expenses
 *   Qualified green / green CHIPS project   →  8% of NY qualified R&D expenses
 *
 * As described in the Excel:
 *   "A credit of 50% of the portion of the Federal Research and Development
 *    tax credit that relates to expenditures in NYS up to credit up to 6% of
 *    research expenditures attributable to activities conducted in NYS."
 *
 *   "For a qualified semiconductor supply chain project, a credit of 50% of
 *    the portion of the Federal Research and Development tax credit that
 *    relates to expenditures in NYS up to 7% of research expenditures
 *    attributable to activities conducted in NYS."
 *
 *   "For a qualified green project or green CHIPS project, a credit of 50% of
 *    the portion of the Federal Research and Development tax credit that
 *    relates to expenditures in NYS up to 8% of research expenditures
 *    attributable to activities conducted in NYS."
 *
 * Key characteristics:
 *  - No prior-year QRE comparisons, no gross receipts, no fixed-base %
 *  - No apportionment ratios, no tiered rates, no dollar caps
 *  - Project type (config.project_type) drives the applicable rate
 *  - finalCredit = NY QRE × applicable rate %
 *  - Carryforward: up to 15 years (partial refundability for qualified small businesses)
 *
 * Verified against Excel:
 *   Current year Qualified R&D credit expenses in NY = $165,000
 *   Credit - 6% of qualified expenses = $165,000 × 6% = $9,900  ✓
 */

export type NyProjectType = "standard" | "semiconductor" | "green";

export interface ConfigJson {
    /** Applicable % of contract expenses — default 65 (i.e. 65%) */
    sub_con_percent: number;

    /**
     * Project type — determines which Excelsior credit rate applies.
     * "standard"       → 6%  (default — standard qualified R&D activities)
     * "semiconductor"  → 7%  (qualified semiconductor supply chain project)
     * "green"          → 8%  (qualified green project or green CHIPS project)
     */
    project_type: NyProjectType;

    /** Standard project credit rate — default 6 (i.e. 6%) */
    standard_rate_percentage: number;

    /** Semiconductor supply chain project credit rate — default 7 (i.e. 7%) */
    semiconductor_rate_percentage: number;

    /** Green / green CHIPS project credit rate — default 8 (i.e. 8%) */
    green_rate_percentage: number;
    qre_credit_percentage:number;
}

export class RdCreditCalculatorForNY {

    country    = "USA";
    creditType = "State R&D Credit - NY";
    currency   = "USD";

    async compute(
        config: ConfigJson,
        stateRdData: StateRDData,
        fiscalYear: string,
        year: number,
        caseData: Case
    ) {
        logMessage(`Computing NY Credit — fiscal year: ${fiscalYear}`);
        logMessage(`NY config: ${JSON.stringify(config)}`);

        const cd = caseData as any;
        const { wages = 0, supplies = 0, contract = 0 } = stateRdData.currentYearQREs;

        //---- Current year Qualified R&D credit expenses in NY
        //     Primary source: caseData.ny_qualified_expenses (NY-specific amount)
        //     Fallback: wages + supplies + contract × sub_con_percent% from stateRdData
        const derivedQRE = new Decimal(wages)
            .plus(new Decimal(supplies))
            .plus(new Decimal(contract).mul(config.sub_con_percent / 100));

        const nyQRE = new Decimal(cd.ny_qualified_expenses ?? derivedQRE.toNumber());

        //---- Resolve applicable rate based on project type
        const appliedRate = this.resolveRate(config);

        //---- Credit = NY QRE × applicable rate %
        const credit = nyQRE.mul(appliedRate / 100);

        logMessage(`NY — project type: ${config.project_type}, rate: ${appliedRate}%, ` +
            `QRE: ${this.round2(nyQRE)}, credit: ${this.round2(credit)}`);

        const inputFields    = this.buildInputParams(stateRdData, cd, {
            country:         this.country,
            creditType:      this.creditType,
            currency:        this.currency,
            fiscalYearEnded: fiscalYear,
        });
        const computedFields = this.buildComputedFields(
            this.round2(nyQRE),
            this.round2(credit),
            appliedRate,
            config
        );

        return {
            inputFields,
            computedFields,
            finalCredit:   this.round2(credit),
            totalQRE:      this.round2(nyQRE),
            totalWages:    this.round2(new Decimal(wages)),
            totalContract: this.round2(new Decimal(contract)),
            totalSupplies: this.round2(new Decimal(supplies)),
            projectType:   config.project_type,
            appliedRate,
        };
    }

    // ── Rate resolver ─────────────────────────────────────────────────────
    private resolveRate(config: ConfigJson): number {
        switch (config.project_type) {
            case "semiconductor": return config.semiconductor_rate_percentage;
            case "green":         return config.green_rate_percentage;
            default:              return config.standard_rate_percentage;
        }
    }

    // ── Input params ──────────────────────────────────────────────────────
    private buildInputParams(stateRdData: StateRDData, cd: any, metadata: any = {}) {
        const { wages = 0, supplies = 0, contract = 0 } = stateRdData.currentYearQREs;

        return {
            metadata: {
                country:             metadata.country    || "US",
                credit_type:         metadata.creditType || "STATE_RD_NY",
                currency:            metadata.currency   || "USD",
                "Fiscal Year Ended": metadata.fiscalYearEnded,
                "Description":       "Research Tax Credit",
                stateDetails:        "New York - Credit Calculation",
            },
            qreSummary: {
                wages,
                supplies,
                contract,
                ny_qualified_expenses: cd.ny_qualified_expenses ?? 0,
            },
        };
    }

    // ── Computed fields — exact Excel label text ──────────────────────────
    private buildComputedFields(
        nyQRE:       number,
        credit:      number,
        appliedRate: number,
        config:      ConfigJson
    ) {
        // Credit label mirrors Excel row 14 exactly, with rate substituted
        const creditLabel = `Credit - ${appliedRate}% of qualified expenses`;

        return {
            computed_fields: {
                "Excelsior Research and Development Tax Credit:": {
                    "A credit of 50% of the portion of the Federal Research and Development tax credit that relates to expenditures in NYS up to credit up to 6% of research expenditures attributable to activities conducted in NYS.":
                        `Standard rate: ${config.standard_rate_percentage}%`,
                    "For a qualified semiconductor supply chain project, a credit of 50% of the portion of the Federal Research and Development tax credit that relates to expenditures in NYS up to 7% of research expenditures attributable to activities conducted in NYS.":
                        `Semiconductor rate: ${config.semiconductor_rate_percentage}%`,
                    "For a qualified green project or green CHIPS project, a credit of 50% of the portion of the Federal Research and Development tax credit that relates to expenditures in NYS up to 8% of research expenditures attributable to activities conducted in NYS.":
                        `Green/CHIPS rate: ${config.green_rate_percentage}%`,
                    "Current year Qualified R&D credit expenses in NY":
                        nyQRE,
                    [creditLabel]:
                        credit,
                },
            },
        };
    }

    // ── Rounding utility ──────────────────────────────────────────────────
    round2(value: any): number {
        if (value === null || value === undefined) return value;
        if (Decimal.isDecimal(value)) return value.toDecimalPlaces(2).toNumber();
        if (typeof value === "number" || typeof value === "string")
            return new Decimal(value).toDecimalPlaces(2).toNumber();
        return value;
    }
}
