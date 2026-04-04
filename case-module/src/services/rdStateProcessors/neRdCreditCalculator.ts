import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * Nebraska R&D Credit Calculator
 *
 * Form: Nebraska Research Tax Credit (Form 3800N)
 *
 * Nebraska is structurally unique — it does NOT compute an independent QRE-based credit.
 * Instead it takes the already-computed federal research credit (Form 6765, line 38 or 40)
 * and applies Nebraska-specific apportionment factors via TWO parallel methods,
 * then takes the larger of the two results as the final state credit.
 *
 * REQUIRED external inputs (from caseData):
 *   - federal_rd_credit       : Federal Form 6765 credit (line 38 or 40)
 *   - us_total_qre_federal    : Total US QREs from Federal Form 6765 (line 9 or 28)
 *
 * On-campus vs off-campus split:
 *   Research conducted on the campus of a Nebraska college or university qualifies
 *   for an ENHANCED credit rate (35%) vs the regular rate (15%) for off-campus work.
 *   This split applies identically in both Method 1 and Method 2.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * METHOD 1 — Property + Payroll Factor Apportionment (Lines 2–9)
 * ─────────────────────────────────────────────────────────────────────────────
 *   Line 2  : Federal research credit (external input)
 *   Line 3a : NE property factor — off-campus (%)
 *   Line 3b : NE property factor — on-campus (%)
 *   Line 4a : NE payroll factor — off-campus (%)
 *   Line 4b : NE payroll factor — on-campus (%)
 *   Line 5a : Line 3a + Line 4a
 *   Line 5b : Line 3b + Line 4b
 *   Line 6a : Line 5a ÷ 2  (average off-campus factor)
 *   Line 6b : Line 5b ÷ 2  (average on-campus factor)
 *   Line 7a : Line 2 × Line 6a
 *   Line 7b : Line 2 × Line 6b
 *   Line 8a : Line 7a × regular_rate%   (15% off-campus)
 *   Line 8b : Line 7b × enhanced_rate%  (35% on-campus / university)
 *   Line 9  : Line 8a + Line 8b         ← Method 1 total
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * METHOD 2 — NE QRE / Total US QRE Ratio (Lines 10–20)
 * ─────────────────────────────────────────────────────────────────────────────
 *   Line 10 : Total NE qualified R&D expenses (ne_qre_offcampus + ne_qre_oncampus)
 *   Line 11 : NE expenses — off-campus portion
 *   Line 12 : NE expenses — on-campus portion  (Line 10 − Line 11, derived)
 *   Line 13 : Total US QREs from Federal Form 6765 (external input)
 *   Line 14 : Line 11 ÷ Line 13  (off-campus ratio)
 *   Line 15 : Line 12 ÷ Line 13  (on-campus ratio)
 *   Line 16 : Line 2 × Line 14
 *   Line 17 : Line 2 × Line 15
 *   Line 18 : Line 16 × regular_rate%   (15%)
 *   Line 19 : Line 17 × enhanced_rate%  (35%)
 *   Line 20 : Line 18 + Line 19         ← Method 2 total
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Final Credit & Usage Allocation (Lines 21–25)
 * ─────────────────────────────────────────────────────────────────────────────
 *   Line 21 : max(Line 9, Line 20)      ← Nebraska R&D credit (FINAL CREDIT)
 *   Line 22 : Income tax credit portion (refundable — Form 3800N line 18)
 *   Line 23 : Sales/use tax refund portion
 *   Line 24 : Distributed to partners/shareholders/beneficiaries (nonrefundable)
 *   Line 25 : Line 22 + Line 23 + Line 24  (must not exceed Line 21)
 *
 * Carryforward: Up to 20 years for unused credit.
 */

export interface ConfigJson {
    /** Regular credit rate applied to off-campus research — default 15 (i.e. 15%) */
    off_campus_research_tax_percentage: number;
    sub_con_percent:number;

    /**
     * Enhanced credit rate applied to on-campus / university research — default 35 (i.e. 35%).
     * Applies when R&D is conducted on the campus of a Nebraska college or university.
     */
    on_campus_research_tax_percentage: number;
}

export class RdCreditCalculatorForNE {

    country    = "USA";
    creditType = "State R&D Credit - NE";
    currency   = "USD";

    async compute(
        config: ConfigJson,
        stateRdData: StateRDData,
        fiscalYear: string,
        year: number,
        caseData: Case
    ) {
        logMessage(`Computing NE Credit — fiscal year: ${fiscalYear}`);
        logMessage(`NE config: ${JSON.stringify(config)}`);

        const cd = caseData as any;

        // Warn early if federal credit is absent — entire calculation will be zero
        if (!cd.federal_rd_credit || cd.federal_rd_credit === 0) {
            logMessage(`WARNING: NE — federal_rd_credit is 0 or missing. ` +
                `Nebraska credit requires Federal Form 6765 credit as input.`);
        }
        if (!cd.us_total_qre_federal || cd.us_total_qre_federal === 0) {
            logMessage(`WARNING: NE — us_total_qre_federal is 0 or missing. ` +
                `Method 2 requires total US QREs from Federal Form 6765 line 9 or 28.`);
        }

        const method1Result  = this.method1(config, cd);
        const method2Result  = this.method2(config, cd);
        const finalResult    = this.finalCredit(method1Result, method2Result, cd);
        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear : year
        },config);
        const computedFields = this.buildComputedFields(method1Result, method2Result, finalResult, config);

        return {
            inputFields,
            computedFields,
            finalCredit:         finalResult.ne_rd_credit,        // line 21
            totalQRE:            finalResult.ne_qre_total,         // line 10
            winningMethod:       finalResult.winning_method,       // "method1" | "method2"
            // NE does not separately track wages/contract/supplies
            // as they come from the federal return — return 0 for consistency
            totalWages:    0,
            totalContract: 0,
            totalSupplies: 0,
        };
    }

    // -------------------------------------------------------------------------
    // Method 1 — Property + Payroll Factor Apportionment (lines 2–9)
    // -------------------------------------------------------------------------
    private method1(config: ConfigJson, cd: any) {
        //---- Line 2: Federal credit
        const line2 = new Decimal(cd.federal_rd_credit ?? 0);

        //---- Lines 3a/3b: NE property factors (supplied as decimals, e.g. 0.30)
        const line3a = new Decimal(cd.property_factor_off_campus_ne ?? 0);
        const line3b = new Decimal(cd.property_factor_on_campus_ne  ?? 0);

        //---- Lines 4a/4b: NE payroll factors
        const line4a = new Decimal(cd.payroll_factor_off_campus_ne ?? 0);
        const line4b = new Decimal(cd.payroll_factor_on_campus_ne  ?? 0);

        //---- Lines 5a/5b: Sum of property + payroll per campus type
        const line5a = line3a.plus(line4a);
        const line5b = line3b.plus(line4b);

        //---- Lines 6a/6b: Average factors (÷ 2)
        const line6a = line5a.div(2);
        const line6b = line5b.div(2);

        //---- Lines 7a/7b: Federal credit apportioned by average factor
        const line7a = line2.mul(line6a.div(100));
        const line7b = line2.mul(line6b.div(100));

        //---- Lines 8a/8b: Apply credit rates
        const line8a = line7a.mul(config.off_campus_research_tax_percentage  / 100);
        const line8b = line7b.mul(config.on_campus_research_tax_percentage / 100);

        //---- Line 9: Method 1 total
        const line9 = line8a.plus(line8b);

        return {
            federal_credit:             this.round2(line2),
            property_factor_offcampus:  this.round2(line3a),
            property_factor_oncampus:   this.round2(line3b),
            payroll_factor_offcampus:   this.round2(line4a),
            payroll_factor_oncampus:    this.round2(line4b),
            sum_factors_offcampus:      this.round2(line5a),
            sum_factors_oncampus:       this.round2(line5b),
            avg_factor_offcampus:       this.round2(line6a),
            avg_factor_oncampus:        this.round2(line6b),
            apportioned_offcampus:      this.round2(line7a),
            apportioned_oncampus:       this.round2(line7b),
            regular_credit_offcampus:   this.round2(line8a),
            enhanced_credit_oncampus:   this.round2(line8b),
            method1_total:              this.round2(line9),
        };
    }

    // -------------------------------------------------------------------------
    // Method 2 — NE QRE / Total US QRE Ratio (lines 10–20)
    // -------------------------------------------------------------------------
    private method2(config: ConfigJson, cd: any) {
        //---- Line 2: Federal credit (shared with Method 1)
        const line2 = new Decimal(cd.federal_rd_credit ?? 0);

        //---- Lines 10/11: NE QRE breakdown
        const ne_qre_offcampus = new Decimal(cd.ne_qre_offcampus ?? 0);
        const ne_qre_oncampus  = new Decimal(cd.ne_qre_oncampus  ?? 0);
        const line10 = ne_qre_offcampus.plus(ne_qre_oncampus);  // total NE QRE
        const line11 = ne_qre_offcampus;                         // off-campus portion

        //---- Line 12: On-campus portion = line10 − line11 (derived)
        const line12 = line10.minus(line11);

        //---- Line 13: Total US QRE from Federal Form 6765
        const line13 = new Decimal(cd.us_total_qre_federal ?? 0);

        //---- Lines 14/15: NE apportionment ratios
        //    Guard against division by zero when line13 = 0
        const line14 = line13.gt(0) ? line11.div(line13) : new Decimal(0);
        const line15 = line13.gt(0) ? line12.div(line13) : new Decimal(0);

        //---- Lines 16/17: Federal credit × NE ratios
        const line16 = line2.mul(line14);
        const line17 = line2.mul(line15);

        //---- Lines 18/19: Apply credit rates
        const line18 = line16.mul(config.off_campus_research_tax_percentage  / 100);
        const line19 = line17.mul(config.on_campus_research_tax_percentage / 100);

        //---- Line 20: Method 2 total
        const line20 = line18.plus(line19);

        return {
            ne_qre_total:               this.round2(line10),
            ne_qre_offcampus:           this.round2(line11),
            ne_qre_oncampus:            this.round2(line12),
            us_qre_total_federal:       this.round2(line13),
            ratio_offcampus:            this.round2(line14),
            ratio_oncampus:             this.round2(line15),
            apportioned_offcampus:      this.round2(line16),
            apportioned_oncampus:       this.round2(line17),
            regular_credit_offcampus:   this.round2(line18),
            enhanced_credit_oncampus:   this.round2(line19),
            method2_total:              this.round2(line20),
        };
    }

    // -------------------------------------------------------------------------
    // Final Credit & Usage Allocation (lines 21–25)
    // -------------------------------------------------------------------------
    private finalCredit(
        m1: ReturnType<RdCreditCalculatorForNE["method1"]>,
        m2: ReturnType<RdCreditCalculatorForNE["method2"]>,
        cd: any
    ) {
        //---- Line 21: max(Method 1, Method 2)
        const line21 = Decimal.max(
            new Decimal(m1.method1_total),
            new Decimal(m2.method2_total)
        );

        const winningMethod = new Decimal(m1.method1_total).gte(new Decimal(m2.method2_total))
            ? "method1"
            : "method2";

        //---- Lines 22–24: Usage allocation (taxpayer-elected, defaults 0)
        const line22 = new Decimal(cd.ne_credit_income_tax   ?? 0);
        const line23 = new Decimal(cd.ne_credit_sales_tax    ?? 0);
        const line24 = new Decimal(cd.ne_credit_distributed  ?? 0);

        //---- Line 25: Total usage — enforced cap at line 21
        const rawLine25 = line22.plus(line23).plus(line24);
        const line25    = Decimal.min(rawLine25, line21);

        if (rawLine25.gt(line21)) {
            logMessage(`WARNING: NE — credit usage total (${rawLine25.toNumber()}) ` +
                `exceeds line 21 (${line21.toNumber()}). Capped at line 21.`);
        }

        return {
            ne_rd_credit:     this.round2(line21),   // line 21 — final credit
            winning_method:   winningMethod,
            ne_qre_total:     m2.ne_qre_total,        // for top-level return
            income_tax_credit:     this.round2(line22),
            sales_tax_refund:      this.round2(line23),
            distributed_credit:    this.round2(line24),
            total_credit_usage:    this.round2(line25),
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
                        credit_type: metadata.creditType || "STATE_RD_KS",
                        currency: metadata.currency || "USD",
                        "Fiscal Year Ended" : metadata.fiscalYearEnded,
                        "Description": "Research Tax Credit",
                        stateDetails : "Kansas - Credit Calculations"
                    },
                    "Current & Prior years information" : storeData
                };
            }

    // -------------------------------------------------------------------------
    // Computed fields builder — mirrors Form 3800N line layout
    // -------------------------------------------------------------------------
    private buildComputedFields(
        m1:    ReturnType<RdCreditCalculatorForNE["method1"]>,
        m2:    ReturnType<RdCreditCalculatorForNE["method2"]>,
        final: ReturnType<RdCreditCalculatorForNE["finalCredit"]>,
        config: ConfigJson
    ) {
        return {
            computed_fields: {
                "Method 1 — Property and Payroll Factor Apportionment (Lines 2–9)": {
                    "[2] Federal research credit (Form 6765, line 38 or 40)":                    m1.federal_credit,
                    "[3a] Nebraska property factor — off-campus (%)":                            m1.property_factor_offcampus,
                    "[3b] Nebraska property factor — on-campus (%)":                             m1.property_factor_oncampus,
                    "[4a] Nebraska payroll factor — off-campus (%)":                             m1.payroll_factor_offcampus,
                    "[4b] Nebraska payroll factor — on-campus (%)":                              m1.payroll_factor_oncampus,
                    "[5a] Add lines 3a and 4a (off-campus)":                                     m1.sum_factors_offcampus,
                    "[5b] Add lines 3b and 4b (on-campus)":                                      m1.sum_factors_oncampus,
                    "[6a] Average off-campus factor (line 5a ÷ 2)":                              m1.avg_factor_offcampus,
                    "[6b] Average on-campus factor (line 5b ÷ 2)":                               m1.avg_factor_oncampus,
                    "[7a] Federal credit apportioned off-campus (line 2 × line 6a)":             m1.apportioned_offcampus,
                    "[7b] Federal credit apportioned on-campus (line 2 × line 6b)":              m1.apportioned_oncampus,
                    [`[8a] Regular research tax credit (line 7a × ${config.off_campus_research_tax_percentage}%) — off-campus`]:  m1.regular_credit_offcampus,
                    [`[8b] Enhanced research tax credit (line 7b × ${config.on_campus_research_tax_percentage}%) — on-campus`]: m1.enhanced_credit_oncampus,
                    "[9] Method 1 total (line 8a + line 8b)":                                    m1.method1_total,
                },
                "Method 2 — NE QRE / Total US QRE Ratio (Lines 10–20)": {
                    "[10] Total NE qualified R&D expenses":                                      m2.ne_qre_total,
                    "[11] NE expenses — off-campus portion":                                     m2.ne_qre_offcampus,
                    "[12] NE expenses — on-campus portion (line 10 minus line 11)":              m2.ne_qre_oncampus,
                    "[13] Total US QREs from Federal Form 6765 (line 9 or line 28)":             m2.us_qre_total_federal,
                    "[14] Off-campus NE ratio (line 11 ÷ line 13)":                              m2.ratio_offcampus,
                    "[15] On-campus NE ratio (line 12 ÷ line 13)":                               m2.ratio_oncampus,
                    "[16] Federal credit × off-campus ratio (line 2 × line 14)":                 m2.apportioned_offcampus,
                    "[17] Federal credit × on-campus ratio (line 2 × line 15)":                  m2.apportioned_oncampus,
                    [`[18] Regular research tax credit (line 16 × ${config.off_campus_research_tax_percentage}%) — off-campus`]:  m2.regular_credit_offcampus,
                    [`[19] Enhanced research tax credit (line 17 × ${config.on_campus_research_tax_percentage}%) — on-campus`]: m2.enhanced_credit_oncampus,
                    "[20] Method 2 total (line 18 + line 19)":                                   m2.method2_total,
                },
                "Final Credit and Usage Allocation (Lines 21–25)": {
                    "[21] Nebraska R&D credit — larger of line 9 or line 20":                    final.ne_rd_credit,
                    [`[21] Winning method: ${final.winning_method}`]:                            "",
                    "[22] Credit used on Nebraska income tax return (refundable — Form 3800N line 18)": final.income_tax_credit,
                    "[23] Credit used for refund of state sales/use taxes":                      final.sales_tax_refund,
                    "[24] Credit distributed to partners, shareholders, or beneficiaries (nonrefundable)": final.distributed_credit,
                    "[25] Total credit usage (lines 22 + 23 + 24, must not exceed line 21)":     final.total_credit_usage,
                },
                "BOLD": [
                    "[9] Method 1 total (line 8a + line 8b)",
                    "[20] Method 2 total (line 18 + line 19)",
                    "[21] Nebraska R&D credit — larger of line 9 or line 20",
                ],
            },
        };
    }

    // -------------------------------------------------------------------------
    // Rounding utility — consistent with AZ / CA / CO / KS / LA / MN
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
