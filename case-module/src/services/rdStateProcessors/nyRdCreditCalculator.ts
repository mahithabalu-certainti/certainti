import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { NY_PROJECT_CLASSIFICATION } from "../../utils/constants";
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

export interface NyClassificationQRE {
    classification_rid:  string | null;
    classification_name: string;
    wages:    number;
    supplies: number;
    contract: number;
}

export interface ConfigJson {
    /** Applicable % of contract expenses — default 65 (i.e. 65%) */
    sub_con_percent: number;

    /** Standard project credit rate — default 6 (i.e. 6%) */
    standard_rate_percentage: number;

    /** Semiconductor supply chain project credit rate — default 7 (i.e. 7%) */
    semiconductor_rate_percentage: number;

    /** Green / green CHIPS project credit rate — default 8 (i.e. 8%) */
    green_rate_percentage: number;
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

        // Per-classification QRE groups pre-fetched in stateComputation.ts
        const classificationQREs: NyClassificationQRE[] = cd.ny_classification_qres ?? [];

        type BreakdownEntry = { classification_name: string; project_type: NyProjectType; qre: number; rate: number; credit: number };
        const breakdown: BreakdownEntry[] = [];
        let totalQRE    = new Decimal(0);
        let totalCredit = new Decimal(0);

        if (classificationQREs.length > 0) {
            for (const group of classificationQREs) {
                const projectType = this.classifyProjectType(group.classification_name);
                const rate        = this.resolveRateByType(projectType, config);
                const groupQRE    = new Decimal(group.wages)
                    .plus(group.supplies)
                    .plus(new Decimal(group.contract).mul(config.sub_con_percent / 100));
                const groupCredit = groupQRE.mul(rate / 100);
                totalQRE    = totalQRE.plus(groupQRE);
                totalCredit = totalCredit.plus(groupCredit);
                breakdown.push({
                    classification_name: group.classification_name,
                    project_type:        projectType,
                    qre:                 this.round2(groupQRE),
                    rate,
                    credit:              this.round2(groupCredit),
                });
                logMessage(`[NY] ${group.classification_name} — type: ${projectType}, ` +
                    `rate: ${rate}%, QRE: ${this.round2(groupQRE)}, credit: ${this.round2(groupCredit)}`);
            }
        } else {
            // Fallback: aggregate QRE, standard rate
            const derivedQRE = new Decimal(wages)
                .plus(supplies)
                .plus(new Decimal(contract).mul(config.sub_con_percent / 100));
            totalQRE = new Decimal(cd.ny_qualified_expenses ?? derivedQRE.toNumber());
            const rate = config.standard_rate_percentage;
            totalCredit = totalQRE.mul(rate / 100);
            breakdown.push({
                classification_name: "Standard",
                project_type:        "standard",
                qre:                 this.round2(totalQRE),
                rate,
                credit:              this.round2(totalCredit),
            });
            logMessage(`[NY] Fallback — standard rate: ${rate}%, ` +
                `QRE: ${this.round2(totalQRE)}, credit: ${this.round2(totalCredit)}`);
        }

        const inputFields    = this.buildInputParams(stateRdData, cd, {
            country:         this.country,
            creditType:      this.creditType,
            currency:        this.currency,
            fiscalYearEnded: fiscalYear,
        });
        const computedFields = this.buildComputedFields(breakdown, config);

        return {
            inputFields,
            computedFields,
            finalCredit:             this.round2(totalCredit),
            totalQRE:                this.round2(totalQRE),
            totalWages:              this.round2(new Decimal(wages)),
            totalContract:           this.round2(new Decimal(contract)),
            totalSupplies:           this.round2(new Decimal(supplies)),
            classificationBreakdown: breakdown,
        };
    }

    // ── Classification → project type ─────────────────────────────────────
    private classifyProjectType(classificationName: string): NyProjectType {
        if (classificationName === NY_PROJECT_CLASSIFICATION.SEMICONDUCTOR) return "semiconductor";
        if (classificationName === NY_PROJECT_CLASSIFICATION.GREEN)         return "green";
        return "standard";
    }

    // ── Rate resolver ─────────────────────────────────────────────────────
    private resolveRateByType(projectType: NyProjectType, config: ConfigJson): number {
        console.log("projectType",projectType)
        switch (projectType) {
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

    // ── Computed fields — fixed 3-tier display ───────────────────────────
    private buildComputedFields(
        breakdown: Array<{ classification_name: string; project_type: NyProjectType; qre: number; rate: number; credit: number }>,
        config:    ConfigJson
    ) {
        // Accumulate QRE and credit per project type
        const byType: Record<NyProjectType, { qre: number; credit: number }> = {
            standard:      { qre: 0, credit: 0 },
            semiconductor: { qre: 0, credit: 0 },
            green:         { qre: 0, credit: 0 },
        };
        for (const group of breakdown) {
            byType[group.project_type].qre    += group.qre;
            byType[group.project_type].credit += group.credit;
        }

        return {
            computed_fields: {
                "Excelsior Research and Development Tax Credit:": {
                    "A credit of 50% of the portion of the Federal Research and Development tax credit that relates to expenditures in NYS up to credit up to 6% of research expenditures attributable to activities conducted in NYS.":
                        "",
                    "For a qualified semiconductor supply chain project, a credit of 50% of the portion of the Federal Research and Development tax credit that relates to expenditures in NYS up to 7% of research expenditures attributable to activities conducted in NYS.":
                       "",
                    "For a qualified green project or green CHIPS project, a credit of 50% of the portion of the Federal Research and Development tax credit that relates to expenditures in NYS up to 8% of research expenditures attributable to activities conducted in NYS.":
                       "",
                    "Current year Qualified R&D credit expenses in NY(Job Creation)": 0,
                    [`Credit -  ${config.standard_rate_percentage}% of qualified expenses(Job Creation)`]: 0,
                    "Current year Qualified R&D credit expenses in NY(Semiconductor supply chain project)": byType.semiconductor.qre,
                    [`Credit - ${config.semiconductor_rate_percentage}% of qualified expenses(Semiconductor supply chain project)`]: byType.semiconductor.credit,
                    "Current year Qualified R&D credit expenses in NY(Green project or Green chips project)": byType.green.qre,
                    [`Credit - ${config.green_rate_percentage}% of qualified expenses(Green project or Green chips project)`]: byType.green.credit,

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
