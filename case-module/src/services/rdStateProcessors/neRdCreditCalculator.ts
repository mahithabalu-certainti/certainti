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
    sub_con_percent: number;
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

        if (!cd.federal_rd_credit || cd.federal_rd_credit === 0) {
            logMessage(`WARNING: NE — federal_rd_credit is 0 or missing. ` +
                `Nebraska credit requires Federal Form 6765 credit as input.`);
        }
        if (!cd.us_total_qre_federal || cd.us_total_qre_federal === 0) {
            logMessage(`WARNING: NE — us_total_qre_federal is 0 or missing. ` +
                `Method 2 requires total US QREs from Federal Form 6765 line 9 or 28.`);
        }

        const method1Result  = this.method1(config, cd);
        const method2Result  = this.method2(config, cd, stateRdData);
        const finalResult    = this.finalCredit(method1Result, method2Result, cd);
        const inputFields    = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country:         this.country,
            creditType:      this.creditType,
            currency:        this.currency,
            fiscalYearEnded: fiscalYear,
            currentYear:     year,
        }, config);
        const computedFields = this.buildComputedFields(method1Result, method2Result, finalResult, config);

        return {
            inputFields,
            computedFields,
            finalCredit:   finalResult.neRdCredit,
            totalQRE:      finalResult.neQreTotal,
            totalWages:    method2Result.wages,
            totalContract: method2Result.contract,
            totalSupplies: method2Result.supplies,
        };
    }

    // -------------------------------------------------------------------------
    // Method 1 — Property + Payroll Factor Apportionment (lines 2–9)
    // -------------------------------------------------------------------------
    private method1(config: ConfigJson, cd: any) {
        const line2  = new Decimal(cd.federal_rd_credit             ?? 0);
        const line3a = new Decimal(cd.property_factor_off_campus_ne ?? 0);
        const line3b = new Decimal(cd.property_factor_on_campus_ne  ?? 0);
        const line4a = new Decimal(cd.payroll_factor_off_campus_ne  ?? 0);
        const line4b = new Decimal(cd.payroll_factor_on_campus_ne   ?? 0);
        const line5a = line3a.plus(line4a);
        const line5b = line3b.plus(line4b);
        const line6a = line5a.div(2);
        const line6b = line5b.div(2);
        const line7a = line2.mul(line6a.div(100));
        const line7b = line2.mul(line6b.div(100));
        const line8a = line7a.mul(config.off_campus_research_tax_percentage / 100);
        const line8b = line7b.mul(config.on_campus_research_tax_percentage  / 100);
        const line9  = line8a.plus(line8b);

        return {
            federalCredit:          this.round2(line2),
            propertyFactorOffcampus: this.round2(line3a),
            propertyFactorOncampus:  this.round2(line3b),
            payrollFactorOffcampus:  this.round2(line4a),
            payrollFactorOncampus:   this.round2(line4b),
            sumFactorsOffcampus:     this.round2(line5a),
            sumFactorsOncampus:      this.round2(line5b),
            avgFactorOffcampus:      this.round2(line6a),
            avgFactorOncampus:       this.round2(line6b),
            apportionedOffcampus:    this.round2(line7a),
            apportionedOncampus:     this.round2(line7b),
            regularCreditOffcampus:  this.round2(line8a),
            enhancedCreditOncampus:  this.round2(line8b),
            method1Total:            this.round2(line9),
        };
    }

    // -------------------------------------------------------------------------
    // Method 2 — NE QRE / Total US QRE Ratio (lines 10–20)
    // -------------------------------------------------------------------------
    private method2(config: ConfigJson, cd: any, stateRdData: StateRDData) {
        const line2 = new Decimal(cd.federal_rd_credit ?? 0);
        const { wages = 0, contract = 0, supplies = 0 } = stateRdData.currentYearQREs;

        const currentYearWages    = new Decimal(wages);
        const currentYearContract = new Decimal(contract).mul(config.sub_con_percent / 100);
        const currentYearQre      = currentYearWages.plus(currentYearContract);
        const currentYearSupplies = new Decimal(supplies);

        const neQreOffcampus = new Decimal(cd.off_campus_research_expenses_ne ?? 0);
        const line10         = currentYearQre;
        const line11         = neQreOffcampus;
        const line12         = line10.minus(line11);
        const line13         = new Decimal(cd.ri_federal_qre ?? 0);
        const line14         = line13.gt(0) ? line11.div(line13) : new Decimal(0);
        const line15         = line13.gt(0) ? line12.div(line13) : new Decimal(0);
        const line16         = line2.mul(line14);
        const line17         = line2.mul(line15);
        const line18         = line16.mul(config.off_campus_research_tax_percentage / 100);
        const line19         = line17.mul(config.on_campus_research_tax_percentage  / 100);
        const line20         = line18.plus(line19);

        return {
            neQreTotal:             this.round2(line10),
            neQreOffcampus:         this.round2(line11),
            neQreOncampus:          this.round2(line12),
            usQreTotalFederal:      this.round2(line13),
            ratioOffcampus:         this.round2(line14),
            ratioOncampus:          this.round2(line15),
            apportionedOffcampus:   this.round2(line16),
            apportionedOncampus:    this.round2(line17),
            regularCreditOffcampus: this.round2(line18),
            enhancedCreditOncampus: this.round2(line19),
            method2Total:           this.round2(line20),
            wages:                  currentYearWages,
            contract:               currentYearContract,
            supplies:               currentYearSupplies,
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
        const line21   = Decimal.max(new Decimal(m1.method1Total), new Decimal(m2.method2Total));
        const line22   = line21;
        const line23   = new Decimal(cd.credit_tax_refunds_ne  ?? 0);
        const line24   = new Decimal(cd.credit_distributed_ne  ?? 0);
        const rawLine25 = line22.plus(line23).plus(line24);
        const line25   = Decimal.min(rawLine25, line21);

        if (rawLine25.gt(line21)) {
            logMessage(`WARNING: NE — credit usage total (${rawLine25.toNumber()}) ` +
                `exceeds line 21 (${line21.toNumber()}). Capped at line 21.`);
        }

        return {
            neRdCredit:       this.round2(line21),
            neQreTotal:       m2.neQreTotal,
            incomeTaxCredit:  this.round2(line22),
            salesTaxRefund:   this.round2(line23),
            distributedCredit: this.round2(line24),
            totalCreditUsage: this.round2(line25),
        };
    }

    // -------------------------------------------------------------------------
    // Input params builder
    // -------------------------------------------------------------------------
    async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], metadata: any = {}, config: ConfigJson) {
        const storeData: any[]    = [];
        const currentYearContract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent / 100);

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
                credit_type:         metadata.creditType || "STATE_RD_NE",
                currency:            metadata.currency   || "USD",
                "Fiscal Year Ended": metadata.fiscalYearEnded,
                "Description":       "Research Tax Credit",
                stateDetails:        "Nebraska - Credit Calculations",
            },
            "Current & Prior years information": storeData,
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
                "NoTitle": {
                    "[2] Enter total amount of federal research credit allowed for this tax year from Federal Form 6765, line 38 or line 40. (Attach Federal Form 6765.) Do not include any amounts which were distributed on Federal Form 6765, line 39 (see instructions)":
                        m1.federalCredit,
                    "[3] Nebraska property factor (attach schedule showing calculations)": "",
                    "[3a] Off-campus, but in Nebraska.":
                        m1.propertyFactorOffcampus,
                    "[3b] On-campus in Nebraska. Address of college or university campus or facility in Nebraska:":
                        m1.propertyFactorOncampus,
                    "[4] Nebraska payroll factor (attach schedule showing calculations)": "",
                    "[4a] Off-campus, but in Nebraska.":
                        m1.payrollFactorOffcampus,
                    "[4b] On-campus in Nebraska.":
                        m1.payrollFactorOncampus,
                    "[5a] Add lines 3a and 4a (off-campus).":
                        m1.sumFactorsOffcampus,
                    "[5b] Add lines 3b and 4b (on-campus).":
                        m1.sumFactorsOncampus,
                    "[6] Average property and payroll factors": "",
                    "[6a] Off-campus (line 5a ÷ 2).":
                        m1.avgFactorOffcampus,
                    "[6b] On-campus (line 5b ÷ 2).":
                        m1.avgFactorOncampus,
                    "[7a] Multiply line 2 x line 6a (off-campus) .":
                        m1.apportionedOffcampus,
                    "[7b] Multiply line 2 x line 6b (on-campus).":
                        m1.apportionedOncampus,
                    "[8a] Regular research tax credit (line 7a x 15%) (off-campus).":
                        m1.regularCreditOffcampus,
                    "[8b] Enhanced research tax credit (line 7b x 35%) (on-campus).":
                        m1.enhancedCreditOncampus,
                    "[9] Total research tax credit (line 8a plus line 8b) .":
                        m1.method1Total,
                    "[10] Enter amount of all qualified expenses for R&D activities in Nebraska.":
                        m2.neQreTotal,
                    "[11] Enter amount of expenses on line 10 which were not performed on the campus of a college or university .":
                        m2.neQreOffcampus,
                    "[12] Enter amount of expenses on line 10 which were performed on the campus of a college or university (line 10 minus line 11) Address of college or university campus or facility in Nebraska":
                        m2.neQreOncampus,
                    "[13] Enter total amount of qualified expenses for R&D activities in all states (from Federal Form 6765, line 9 or line 28).":
                        m2.usQreTotalFederal,
                    "[14] Divide line 11 by line 13 (off-campus).":
                        m2.ratioOffcampus,
                    "[15] Divide line 12 by line 13 (on-campus).":
                        m2.ratioOncampus,
                    "[16] Multiply line 2 x line 14 (off-campus).":
                        m2.apportionedOffcampus,
                    "[17] Multiply line 2 x line 15 (on-campus).":
                        m2.apportionedOncampus,
                    [`[18] Regular research tax credit (line 16 × ${config.off_campus_research_tax_percentage}%) — off-campus`]:
                        m2.regularCreditOffcampus,
                    [`[19] Enhanced research tax credit (line 17 × ${config.on_campus_research_tax_percentage}%) — on-campus`]:
                        m2.enhancedCreditOncampus,
                    "[20] Total research tax credit (line 18 plus line 19.":
                        m2.method2Total,
                    "[21] Enter the larger of line 9 or line 20.":
                        final.neRdCredit,
                    "[22] Amount of credit (refundable to the entity claiming the credit) from line 21 used on Nebraska income tax return (enter here and on line 18 of Form 3800N)":
                        final.incomeTaxCredit,
                    "[23] Amount of credit from line 21 used for refunds of state sales/use taxes paid on qualifying expenditures (see instructions)":
                        final.salesTaxRefund,
                    "[24] Amount of credit from line 21 (nonrefundable) distributed to partners, shareholders, members, or beneficiaries (see instructions)":
                        final.distributedCredit,
                    "[25] Total credit usage (line 22 + line 23 + line 24). Total cannot exceed line 21":
                        final.totalCreditUsage,
                },
                "BOLD": [],
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
