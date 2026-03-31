import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * Kentucky R&D Credit Calculator
 *
 * Form: Kentucky Schedule RC — Qualified Research Facility Tax Credit
 *
 * Kentucky's R&D credit applies to the Qualified Research Facility Tax Credit,
 * one of many business credit categories listed on Schedule TCS. The credit
 * is a flat 5% on total qualified costs (construction + equipment) with
 * no prior-year comparison, no gross receipts, and no tiered rates.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PART I—Computation of Allowable Tax Credit
 * ─────────────────────────────────────────────────────────────────────────────
 *   Line 1 : Cost of construction (attach schedule)
 *   Line 2 : Cost of equipment (attach schedule)
 *   Line 3 : Total qualified costs (add lines 1 and 2)
 *            → In practice, wages + supplies + contract × sub_con_percent%
 *              are mapped here as total R&D expenditures
 *   Line 4 : Allowable tax credit (enter 5% of line 3)   ← FINAL CREDIT
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PART II—Current Year Credit
 * ─────────────────────────────────────────────────────────────────────────────
 *   Line 1 : LLET Credit—Enter on Schedule TCS, Part II, Column E
 *   Line 2 : Corporation Income Tax Credit—Enter on Schedule TCS, Part II, Column F
 *   Line 3 : Individual Income Tax Credit—Enter on Form 740, 740-NP, or 741
 *
 *   PART II distributes the allowable credit (PART I Line 4) across entity
 *   tax types. The split is driven by caseData.ky_entity_type:
 *     "llet"        → Line 1 (Limited Liability Entity Tax)
 *     "corporation" → Line 2 (Corporation Income Tax)
 *     "individual"  → Line 3 (Individual Income Tax)
 *   Only the applicable line is populated; the others default to 0.
 *
 * Note from Excel:
 *   "Need to know the exact category for which the R&D activity was done."
 *   The applicable KY credit category is "Qualified Research Facility Tax Credit".
 *
 * Key characteristics:
 *  - Flat 5% on total qualified costs — no prior years, no gross receipts
 *  - No fixed-base%, no tiered rates, no dollar caps
 *  - PART II usage split depends on entity type (LLET / Corp / Individual)
 *  - Carryforward: up to 10 years
 *
 * Verified against Excel:
 *   Total QRE (Line 3) = $165,000
 *   Line 4 = $165,000 × 5% = $8,250  ✓
 */

export type KyEntityType = "llet" | "corporation" | "individual";

export interface ConfigJson {
    /** Applicable % of contract expenses — default 65 (i.e. 65%) */
    sub_con_percent: number;

    /** Credit rate applied to total qualified costs — default 5 (i.e. 5%) */
    qre_credit_percentage: number;

    /**
     * Entity type — determines which PART II line the credit is allocated to.
     * "llet"        → Line 1: LLET Credit (Schedule TCS, Part II, Column E)
     * "corporation" → Line 2: Corporation Income Tax Credit (Schedule TCS, Part II, Column F)
     * "individual"  → Line 3: Individual Income Tax Credit (Form 740, 740-NP, or 741)
     * Default: "corporation"
     */
    entity_type: KyEntityType ;
}

export class RdCreditCalculatorForKY {

    country    = "USA";
    creditType = "State R&D Credit - KY";
    currency   = "USD";

    async compute(
        config: ConfigJson,
        stateRdData: StateRDData,
        fiscalYear: string,
        year: number,
        caseData: Case
    ) {
        logMessage(`Computing KY Credit — fiscal year: ${fiscalYear}`);
        logMessage(`KY config: ${JSON.stringify(config)}`);
   //     config.entity_type = 'llet'

        const cd = caseData as any;
        const { wages = 0, supplies = 0, contract = 0 } = stateRdData.currentYearQREs;

        // ─────────────────────────────────────────────────────────────────────
        // PART I—Computation of Allowable Tax Credit
        // ─────────────────────────────────────────────────────────────────────

        // [1] Cost of construction (attach schedule)
        //     Source: caseData.ky_construction_cost; defaults to 0
        const line1 = new Decimal(wages ?? 0);

        // [2] Cost of equipment (attach schedule)
        //     Source: caseData.ky_equipment_cost; defaults to 0
        //     When neither construction nor equipment is explicitly set,
        //     total QRE (wages + supplies + contract × sub_con_percent%) is
        //     used as the qualified cost base — matching Excel sample behaviour
      //  const line2 = new Decimal( ?? 0);
       const line2 = new Decimal(contract).mul(config.sub_con_percent / 100);

        // [3] Total qualified costs (add lines 1 and 2)
        //     When line1 + line2 = 0, fall back to derived total QRE
        const derivedQRE = new Decimal(wages)
            .plus(new Decimal(supplies))
            .plus(new Decimal(contract).mul(config.sub_con_percent / 100));

        const sumLines1And2 = line1.plus(line2);
        const line3 = sumLines1And2.gt(0) ? sumLines1And2 : derivedQRE;

        // [4] Allowable tax credit (enter 5% of line 3)
        const line4 = line3.mul(config.qre_credit_percentage / 100);

        logMessage(
            `KY — Line 3 (total qualified costs): ${this.round2(line3)}, ` +
            `Line 4 (${config.qre_credit_percentage}% credit): ${this.round2(line4)}, ` +
            `entity type: ${config.entity_type}`
        );

        // ─────────────────────────────────────────────────────────────────────
        // PART II—Current Year Credit
        // Only the line matching entity_type is populated; others = 0
        // ─────────────────────────────────────────────────────────────────────

        // [1] LLET Credit—Enter on Schedule TCS, Part II, Column E
        const partII_line1 = config.entity_type === "llet"
            ? line4
            : new Decimal(0);

        // [2] Corporation Income Tax Credit—Enter on Schedule TCS, Part II, Column F
        const partII_line2 = config.entity_type === "corporation"
            ? line4
            : new Decimal(0);

        // [3] Individual Income Tax Credit—Enter on Form 740, 740-NP, or 741
        const partII_line3 = config.entity_type === "individual"
            ? line4
            : new Decimal(0);

       const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear : year
        },config);
        const computedFields = this.buildComputedFields(
            {
                line1:         this.round2(line1),
                line2:         this.round2(line2),
                line3:         this.round2(line3),
                line4:         this.round2(line4),
                partII_line1:  this.round2(partII_line1),
                partII_line2:  this.round2(partII_line2),
                partII_line3:  this.round2(partII_line3),
            },
            config
        );

        return {
            inputFields,
            computedFields,
            finalCredit:   this.round2(line4),        // PART I Line 4
            totalQRE:      this.round2(line3),         // PART I Line 3
            totalWages:    this.round2(new Decimal(wages)),
            totalContract: this.round2(new Decimal(contract)),
            totalSupplies: this.round2(new Decimal(supplies)),
            entityType:    config.entity_type,
        };
    }

    // ── Input params ──────────────────────────────────────────────────────
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
                        credit_type: metadata.creditType || "STATE_RD_KY",
                        currency: metadata.currency || "USD",
                        "Fiscal Year Ended" : metadata.fiscalYearEnded,
                        "Description": "Research Tax Credit",
                        stateDetails : "Kentucky - Credit Calculations"
                    },
                    "Current & Prior years information" : storeData
                };
            }

    // ── Computed fields — exact Excel label text ──────────────────────────
    private buildComputedFields(
        lines: {
            line1:        number;
            line2:        number;
            line3:        number;
            line4:        number;
            partII_line1: number;
            partII_line2: number;
            partII_line3: number;
        },
        config: ConfigJson
    ) {
        return {
            computed_fields: {
                 "PART I—Computation of Allowable Tax Credit": {
                     "[1] Cost of construction (attach schedule)":
                        lines.line1,
                    "[2] Cost of equipment (attach schedule)":
                        lines.line2,
                    "[3] Total qualified costs (add lines 1 and 2)":
                        lines.line3,
                    [`[4] Allowable tax credit (enter ${config.qre_credit_percentage}% of line 3)`]:
                        lines.line4,
                 },
                 "PART II—Current Year Credit": {
                    "[1] LLET Credit—Enter on Schedule TCS, Part II, Column E":
                        lines.partII_line1,
                    "[2] Corporation Income Tax Credit—Enter on Schedule TCS, Part II, Column F":
                        lines.partII_line2,
                    "[3] Individual Income Tax Credit—Enter on Form 740, 740-NP, or 741":
                        lines.partII_line3,
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
