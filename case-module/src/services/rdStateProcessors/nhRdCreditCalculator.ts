import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * New Hampshire R&D Credit Calculator
 *
 * Form: NH Research & Development Tax Credit Application
 *
 * New Hampshire is the simplest state calculator in the set — exactly 3 lines.
 *
 * Key characteristics:
 *  - WAGES ONLY: contract, supplies, and computer rental costs are fully excluded
 *  - MANUFACTURING qualifier: only wages tied to manufacturing R&D qualify (Line B)
 *  - HARD CAP: credit is capped at $50,000 per year regardless of wage level
 *  - No prior-year comparisons, no gross receipts, no fixed-base%, no apportionment
 *  - Carryforward: up to 5 years for unused credit
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Line A: Qualified Manufacturing R&D expenditures (wages only) per Federal Return
 *         → Informational only — sourced from Federal Form 6765
 *         → Does NOT feed into the credit calculation
 *
 * Line B: Qualified Manufacturing R&D expenditures (wages only) attributable to NH
 *         → The sole input driving the credit
 *         → Read from caseData.nh_wages; falls back to currentYearQREs.wages
 *
 * Line C: Credit requested = min(Line B × credit_rate%, cap_amount)
 *         → Final credit — capped at $50,000
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Sample (from Excel):
 *   Line A = 0       (federal wages not set in sample)
 *   Line B = 100,000 (NH manufacturing wages)
 *   Line C = 10,000  (100,000 × 10% = 10,000 < $50,000 cap → not capped)
 */

export interface ConfigJson {
    /** Credit rate applied to NH qualified manufacturing wages — default 10 (i.e. 10%) */
    qre_credit_percentage: number;

    /** Maximum credit allowed in any one year — default 50000 */
    qre_threshold_amount: number;
    sub_con_percent: number;
}   

export class RdCreditCalculatorForNH {

    country    = "USA";
    creditType = "State R&D Credit - NH";
    currency   = "USD";

    async compute(
        config: ConfigJson,
        stateRdData: StateRDData,
        fiscalYear: string,
        year: number,
        caseData: Case
    ) {
        logMessage(`Computing NH Credit — fiscal year: ${fiscalYear}`);
        logMessage(`NH config: ${JSON.stringify(config)}`);

        const cd = caseData as any;

        //---- Line A: Federal qualified manufacturing R&D wages (informational only)
        //    Sourced from caseData.nh_federal_qualified_wages; defaults to 0
        const lineA = new Decimal(cd.nh_federal_qualified_wages ?? 0);

        //---- Line B: NH-attributable qualified manufacturing R&D wages
        //    Primary source: caseData.nh_wages (NH-specific portion)
        //    Fallback:       currentYearQREs.wages (when all activity is in NH)
        const nhWages = cd.nh_wages ?? stateRdData.currentYearQREs.wages ?? 0;
        const lineB   = new Decimal(nhWages);

        //---- Line C: Credit = min(Line B × credit_rate%, cap_amount)
        const uncappedCredit = lineB.mul(config.qre_credit_percentage / 100);
        const lineC          = Decimal.min(uncappedCredit, new Decimal(config.qre_threshold_amount));

        

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear : year
        },config);
        const computedFields = this.buildComputedFields(
            { lineA: this.round2(lineA), lineB: this.round2(lineB), lineC: this.round2(lineC) },
            config
        );

        return {
            inputFields,
            computedFields,
            finalCredit:   this.round2(lineC),       // Line C — capped credit
            totalQRE:      this.round2(lineB),        // NH wages only (no contract/supplies)
            totalWages:    this.round2(lineB),
            totalContract: 0,                         // excluded from NH credit
            totalSupplies: 0                        // excluded from NH credit

        };
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
                       credit_type: metadata.creditType || "STATE_RD_NH",
                       currency: metadata.currency || "USD",
                       "Fiscal Year Ended" : metadata.fiscalYearEnded,
                       "Description": "Research Tax Credit",
                       stateDetails : "New Hampshire - Credit Calculations"
                   },
                   "Current & Prior years information" : storeData
               };
           }

    // -------------------------------------------------------------------------
    // Computed fields builder — mirrors NH R&D Tax Credit Application line layout
    // -------------------------------------------------------------------------
    private buildComputedFields(
        lines:  { lineA: number; lineB: number; lineC: number },
        config: ConfigJson
    ) {
        return {
            computed_fields: {
                "NH Research & Development Tax Credit Application": {
                    "[A] Qualified Manufacturing R&D expenditures (wages only) per Federal Return (attach Form 6765)":
                        lines.lineA,
                    "[B] Qualified Manufacturing R&D expenditures (wages only) attributable to NH":
                        lines.lineB,
                    [`[C] Credit requested (Line B × ${config.qre_credit_percentage}%, not to exceed $${config.qre_threshold_amount.toLocaleString()})`]:
                        lines.lineC,
                },
            },
        };
    }

    // -------------------------------------------------------------------------
    // Rounding utility — consistent with AZ / CA / CO / KS / LA / MN / NE / IA
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
