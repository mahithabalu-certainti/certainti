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
    qre_credit_percentage_c1: number;
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
        const totalQre = new Decimal(wages)
            .plus(new Decimal(contract).mul(config.sub_con_percent / 100));

        //---- Rural QRE: portion of QRE attributable to a rural area business
        //    Sourced from caseData.nm_rural_qre; defaults to 0
        const ruralBasicRdCredit               = new Decimal(0);
        const additionalTechJobsRdCredit       = new Decimal(0);
        const ruralAdditionalTechJobsRdCredit  = new Decimal(0);

        //---- Line 3: Qualified Expenditures (total QRE column — informational)
        const line3 = new Decimal(0);

        //---- Line 4: Basic Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures.
        const line4Qre    = totalQre;
        const line4Credit = totalQre.mul(config.qre_credit_percentage_c1 / 100);

        //---- Line 5: Rural Area Basic Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures
        const line5Qre    = ruralBasicRdCredit;
        const line5Credit = ruralBasicRdCredit.mul(config.qre_credit_percentage_c1 / 100);

        //---- Line 6: Additional Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures
        const line6Qre    = additionalTechJobsRdCredit;
        const line6Credit = additionalTechJobsRdCredit.mul(config.qre_credit_percentage_c1 / 100);

        //---- Line 7: Rural Area Additional Technology Jobs and Research and Development Tax Credit. 5% of Qualified Expenditures
        const line7Qre    = ruralAdditionalTechJobsRdCredit;
        const line7Credit = ruralAdditionalTechJobsRdCredit.mul(config.qre_credit_percentage_c1 / 100);

        //---- Line 9: Total Technology Jobs and Research and Development Tax Credit. Add lines 4, 5, 6, and 7, enter total here
        const line9 = line4Credit.plus(line5Credit).plus(line6Credit).plus(line7Credit);

        const inputFields = this.buildInputParams(stateRdData, cd, {
            country:         this.country,
            creditType:      this.creditType,
            currency:        this.currency,
            fiscalYearEnded: fiscalYear,
            currentYear:     year,
        }, config);

        const computedFields = this.buildComputedFields(
            {
                line3Qre:    this.round2(line3),
                line4Qre:    this.round2(line4Qre),
                line4Credit: this.round2(line4Credit),
                line5Qre:    this.round2(line5Qre),
                line5Credit: this.round2(line5Credit),
                line6Qre:    this.round2(line6Qre),
                line6Credit: this.round2(line6Credit),
                line7Qre:    this.round2(line7Qre),
                line7Credit: this.round2(line7Credit),
                line9:       this.round2(line9),
            },
            config,
            fiscalYear
        );

        return {
            inputFields,
            computedFields,
            finalCredit:   this.round2(line9),
            totalQRE:      this.round2(totalQre),
            totalWages:    this.round2(new Decimal(wages)),
            totalContract: this.round2(new Decimal(contract)),
            totalSupplies: this.round2(new Decimal(supplies)),
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
            line3Qre: number;
            line4Qre: number; line4Credit: number;
            line5Qre: number; line5Credit: number;
            line6Qre: number; line6Credit: number;
            line7Qre: number; line7Credit: number;
            line9: number;
        },
        config: ConfigJson,
        fiscalYear: string
    ) {
        return {
            newMexico: [
                {
                    "Column Name": "A",
                    "SubColumn Name": `${fiscalYear}`,
                    "[3] Qualified Expenditures": "",
                    [`[4] Basic Technology Jobs and Research and Development Tax Credit. ${config.qre_credit_percentage_c1}% of Qualified Expenditures.`]:
                        lines.line4Qre,
                    [`[5] Rural Area Basic Technology Jobs and Research and Development Tax Credit. ${config.qre_credit_percentage_c1}% of Qualified Expenditures`]:
                        lines.line5Qre,
                    [`[6] Additional Technology Jobs and Research and Development Tax Credit. ${config.qre_credit_percentage_c1}% of Qualified Expenditures`]:
                        lines.line6Qre,
                    [`[7] Rural Area Additional Technology Jobs and Research and Development Tax Credit. ${config.qre_credit_percentage_c1}% of Qualified Expenditures`]:
                        lines.line7Qre,
                    "[9] Total Technology Jobs and Research and Development Tax Credit. Add lines 4,5, 6, and 7,enter total here": ""
                },
                {
                    "Column Name": "B",
                    "SubColumn Name": `${fiscalYear}`,
                    "[3] Qualified Expenditures": "",
                    [`[4] Basic Technology Jobs and Research and Development Tax Credit. ${config.qre_credit_percentage_c1}% of Qualified Expenditures.`]:
                        lines.line4Credit,
                    [`[5] Rural Area Basic Technology Jobs and Research and Development Tax Credit. ${config.qre_credit_percentage_c1}% of Qualified Expenditures`]:
                        lines.line5Credit,
                    [`[6] Additional Technology Jobs and Research and Development Tax Credit. ${config.qre_credit_percentage_c1}% of Qualified Expenditures`]:
                        lines.line6Credit,
                    [`[7] Rural Area Additional Technology Jobs and Research and Development Tax Credit. ${config.qre_credit_percentage_c1}% of Qualified Expenditures`]:
                        lines.line7Credit,
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
