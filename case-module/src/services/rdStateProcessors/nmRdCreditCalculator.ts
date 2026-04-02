import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * New Mexico R&D Credit Calculator
 *
 * Form: NM RPD-41326 — Technology Jobs and Research and Development Tax Credit
 *
 * New Mexico provides TWO separate 5% credits that can BOTH be claimed on the
 * same qualified expenditures, making the effective rate 10% for standard filers:
 *
 *   Line 4 : Basic Technology Jobs and R&D Tax Credit    = 5% of QRE
 *   Line 5 : Rural Area Basic Technology Jobs and R&D   = 5% of rural QRE
 *   Line 6 : Additional Technology Jobs and R&D Credit  = 5% of QRE
 *   Line 7 : Rural Area Additional Technology Jobs and R&D = 5% of rural QRE
 *   Line 9 : Total = sum of lines 4, 5, 6, and 7
 *
 * Rural area flag: when the taxpayer qualifies as a rural area business,
 * lines 5 and 7 also apply (additional 10% on top of standard 10% = 20% total).
 *
 * Key characteristics:
 *  - No prior-year QRE comparisons, no gross receipts, no fixed-base %
 *  - No apportionment, no tiered rates, no caps
 *  - Two credit types × two area types = up to 4 active lines
 *  - finalCredit = line 9 (total of all applicable credits)
 *  - Carryforward: up to 3 years
 *
 * Verified against Excel:
 *   QRE = $165,000, rural = $0
 *   Line 4  = $165,000 × 5% = $8,250  ✓
 *   Line 5  = $0 × 5%       = $0      ✓
 *   Line 6  = $165,000 × 5% = $8,250  ✓
 *   Line 7  = $0 × 5%       = $0      ✓
 *   Line 9  = $16,500                  ✓
 */

export interface ConfigJson {
    /** Applicable % of contract expenses — default 65 (i.e. 65%) */
    sub_con_percent: number;

    /** Basic credit rate (lines 4 & 5) — default 5 (i.e. 5%) */
    basic_credit_rate_percentage: number;

    /** Additional credit rate (lines 6 & 7) — default 5 (i.e. 5%) */
    additional_credit_rate_percentage: number;
}

export class RdCreditCalculatorForNM {

    country    = "USA";
    creditType = "State R&D Credit - NM";
    currency   = "USD";

    async compute(
        config: ConfigJson,
        stateRdData: StateRDData,
        fiscalYear: string,
        year: number,
        caseData: Case
    ) {
        logMessage(`Computing NM Credit — fiscal year: ${fiscalYear}`);
        logMessage(`NM config: ${JSON.stringify(config)}`);

        const cd = caseData as any;

        //---- Total NM QRE: wages + supplies + contract × sub_con_percent%
        const { wages = 0, supplies = 0, contract = 0 } = stateRdData.currentYearQREs;
        const totalQRE = new Decimal(wages)
            .plus(new Decimal(supplies))
            .plus(new Decimal(contract).mul(config.sub_con_percent / 100));

        //---- Rural QRE: portion of QRE attributable to a rural area business
        //    Sourced from caseData.nm_rural_qre; defaults to 0
        const ruralQRE = new Decimal(cd.nm_rural_qre ?? 0);

        //---- Line 3: Qualified Expenditures (total QRE column — informational)
        const line3 = totalQRE;

        //---- Line 4: Basic Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures.
        const line4_qre    = totalQRE;
        const line4_credit = totalQRE.mul(config.basic_credit_rate_percentage / 100);

        //---- Line 5: Rural Area Basic Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures
        const line5_qre    = ruralQRE;
        const line5_credit = ruralQRE.mul(config.basic_credit_rate_percentage / 100);

        //---- Line 6: Additional Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures
        const line6_qre    = totalQRE;
        const line6_credit = totalQRE.mul(config.additional_credit_rate_percentage / 100);

        //---- Line 7: Rural Area Additional Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures
        const line7_qre    = ruralQRE;
        const line7_credit = ruralQRE.mul(config.additional_credit_rate_percentage / 100);

        //---- Line 9: Total Technology Jobs and Research and Development Tax Credit. Add lines 4, 5, 6, and 7, enter total here
        const line9 = line4_credit.plus(line5_credit).plus(line6_credit).plus(line7_credit);

        const inputFields    = this.buildInputParams(stateRdData, cd, {
            country:         this.country,
            creditType:      this.creditType,
            currency:        this.currency,
            fiscalYearEnded: fiscalYear,
            currentYear:     year,
        }, config);
        const computedFields = this.buildComputedFields(
            {
                line3_qre:     this.round2(line3),
                line4_qre:     this.round2(line4_qre),
                line4_credit:  this.round2(line4_credit),
                line5_qre:     this.round2(line5_qre),
                line5_credit:  this.round2(line5_credit),
                line6_qre:     this.round2(line6_qre),
                line6_credit:  this.round2(line6_credit),
                line7_qre:     this.round2(line7_qre),
                line7_credit:  this.round2(line7_credit),
                line9:         this.round2(line9),
            },
            config
        );

        return {
            inputFields,
            computedFields,
            finalCredit:   this.round2(line9),
            totalQRE:      this.round2(totalQRE),
            totalWages:    this.round2(new Decimal(wages)),
            totalContract: this.round2(new Decimal(contract)),
            totalSupplies: this.round2(new Decimal(supplies)),
            ruralQRE:      this.round2(ruralQRE),
        };
    }

    // ── Input params ──────────────────────────────────────────────────────
    private buildInputParams(stateRdData: StateRDData, _cd: any, metadata: any = {}, config: ConfigJson) {
        const { wages = 0, contract = 0 } = stateRdData.currentYearQREs;
        const currentYearContract = new Decimal(contract).mul(config.sub_con_percent / 100);

        const storeData: any[] = [];
        storeData.push({
            year:     metadata.currentYear,
            wages:    this.round2(new Decimal(wages)),
            contract: this.round2(currentYearContract),
            sum:      this.round2(new Decimal(wages).plus(currentYearContract)),
        });
        (stateRdData.prior3YearsQREs ?? []).forEach(item => {
            storeData.push({
                year:     item.fiscalYear,
                wages:    item.wages,
                contract: item.contract,
                sum:      this.round2(new Decimal(item.wages || 0).plus(Number(item.contract || 0))),
            });
        });

        return {
            metadata: {
                country:             metadata.country    || "US",
                credit_type:         metadata.creditType || "STATE_RD_NM",
                currency:            metadata.currency   || "USD",
                "Fiscal Year Ended": metadata.fiscalYearEnded,
                "Description":       "Research Tax Credit",
                stateDetails:        "New Mexico - Credit Calculation",
            },
            "Current & Prior years information": storeData,
        };
    }

    // ── Computed fields — dual-column array format (like IL)
    //    [0] = "Qualified Expenditures" column (col M)
    //    [1] = "Credit" column (col N)
    private buildComputedFields(
        lines: {
            line3_qre: number;
            line4_qre: number; line4_credit: number;
            line5_qre: number; line5_credit: number;
            line6_qre: number; line6_credit: number;
            line7_qre: number; line7_credit: number;
            line9: number;
        },
        _config: ConfigJson
    ) {
        return {
            computed_fields: [
                {
                    "Column Name": "Qualified Expenditures",
                    "SubColumn Name": "",
                    "[3] Qualified Expenditures": "",
                    "[4] Basic Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures.":
                        lines.line4_qre,
                    "[5] Rural Area Basic Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures":
                        lines.line5_qre,
                    "[6] Additional Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures":
                        lines.line6_qre,
                    "[7] Rural Area Additional Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures":
                        lines.line7_qre,
                    "[9] Total Technology Jobs and Research and Development Tax Credit. Add lines 4,5, 6, and 7,enter total here": "",
                },
                {
                    "Column Name": "Credit",
                    "SubColumn Name": "",
                    "[3] Qualified Expenditures": "",
                    "[4] Basic Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures.":
                        lines.line4_credit,
                    "[5] Rural Area Basic Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures":
                        lines.line5_credit,
                    "[6] Additional Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures":
                        lines.line6_credit,
                    "[7] Rural Area Additional Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures":
                        lines.line7_credit,
                    "[9] Total Technology Jobs and Research and Development Tax Credit. Add lines 4,5, 6, and 7,enter total here":
                        lines.line9,
                },
            ],
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
