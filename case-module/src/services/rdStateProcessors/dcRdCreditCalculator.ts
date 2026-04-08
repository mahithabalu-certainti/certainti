import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * District of Columbia R&D Credit Calculator
 *
 * Form: DC Schedule UB / Form 6765 (DC mirrors federal Form 6765 exactly)
 *
 * DC is structurally IDENTICAL to Vermont — both mirror the federal Form 6765
 * structure with the same six sections, same line numbers, same rates, and
 * same 280C election mechanics. The only differences are:
 *   - State label ("District of Columbia" vs "Vermont")
 *   - Carryforward: 15 years (vs 10 years for VT)
 *   - Credit type identifier: STATE_RD_DC
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Section F  (lines 42–48) — QRE Summary           ← MUST RUN FIRST
 * Section A  (lines 1–13)  — Regular Credit (RRC)
 * Section B  (lines 14–26) — Alt. Simplified (ASC)
 * Section C  (lines 27–32) — Current Year Credit   ← finalCredit = line 30
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Section F (lines 42–48):
 *   Line 42: wages | Line 43: supplies | Line 44: computer rental
 *   Line 45: contract × sub_con_percent% | Line 47: line45+line46
 *   Line 48: total QRE → feeds line 5 (RRC) or line 20 (ASC)
 *
 * Section A — RRC (lines 1–13):
 *   Line 5:  QRE from line 48
 *   Line 6:  fixed-base % (max 16%)
 *   Line 7:  avg gross receipts
 *   Line 8:  base = line7 × line6
 *   Line 9:  max(line5 − line8, 0)
 *   Line 10: line5 × 50%
 *   Line 11: min(line9, line10)
 *   Line 12: line1 + line4 + line11
 *   Line 13: elect_280c → line12 × 15.8%  |  no → line12 × 20%
 *
 * Section B — ASC (lines 14–26):
 *   Line 20: QRE from line 48
 *   Line 21: sum of prior 3yr QREs
 *   Line 22: line21 ÷ 6
 *   Line 23: max(line20 − line22, 0)
 *   Line 24: hasPriorQREs → line23 × 14%  |  no → line20 × 6%
 *   Line 25: line19 + line24
 *   Line 26: elect_280c → line25 × 79%  |  no → line25
 *
 * Section C (lines 27–32):
 *   Line 27: Form 8932 wages
 *   Line 28: max(active credit − line27, 0)
 *   Line 29: pass-through credit
 *   Line 30: line28 + line29  ← FINAL CREDIT
 *
 * Verified: DC sample all zeros (QREs not populated in sheet).
 * With sample data: ASC would produce $15,983.33 (identical to VT).
 *
 * Carryforward: Up to 15 years.
 */

export interface ConfigJson {
    /** Applicable % of contract expenses (Section F line 45) — default 65 */
    sub_con_percent: number;
    rrc_qre_credit_percentage:number;
    asc_qre_credit_percentage_c1:number;

    /** Fixed-base % for RRC (Section A line 6, max 16) — default 16 */
    rrc_fixed_base_percentage: number;
    rrc_elect_280c_yes:number;
    rrc_elect_280c_no :number;
    asc_elect_280c_yes: number;

    /** ASC rate when prior 3yr QREs all > 0 (Section B line 24) — default 14 */
    asc_qre_credit_percentage_c2: number;

    /** ASC rate when no prior QREs in one or more years — default 6 */
    asc_qre_credit_percentage_c3: number;

}

export class RdCreditCalculatorForDC {

    country    = "USA";
    creditType = "State R&D Credit - DC";
    currency   = "USD";

    async compute(
        config: ConfigJson,
        stateRdData: StateRDData,
        fiscalYear: string,
        year: number,
        caseData: Case
    ) {
        logMessage(`Computing DC Credit — fiscal year: ${fiscalYear}`);
        logMessage(`DC config: ${JSON.stringify(config)}`);

        const sectionA = this.computeSectionA(config, stateRdData,caseData );
        const sectionB = this.computeSectionB(config, stateRdData, caseData,sectionA);
       const sectionC = this.computeSectionC(config, sectionA, sectionB, caseData);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear : year
        },config);
        const computedFields = this.buildComputedFields( sectionA, sectionB,sectionC, config);

        return {
            inputFields,
            computedFields,
            finalCredit:   Math.max(sectionA.line13,sectionB.line26),
            totalQRE:      sectionA.line48,
            totalWages:    this.round2(new Decimal(stateRdData.currentYearQREs.wages    ?? 0)),
            totalContract: this.round2(new Decimal(stateRdData.currentYearQREs.contract ?? 0)),
            totalSupplies: this.round2(new Decimal(stateRdData.currentYearQREs.supplies ?? 0))
        };
    }

   

    // ── Section A — RRC (lines 1–13) ──────────────────────────────────────
    private computeSectionA(
        config: ConfigJson,
        stateRdData: StateRDData,
        caseData:any
    ) {
          const { wages = 0, supplies = 0, contract = 0 } = stateRdData.currentYearQREs;
        const cd = caseData as any;

        const line42 = new Decimal(wages);
        const line43 = new Decimal(supplies);
        const line44 = new Decimal(cd.lease_costs_of_computers_dc ?? 0);
        const line45 = new Decimal(contract).mul(config.sub_con_percent / 100);
        const line46 = new Decimal(0);
        const line47 = line45.plus(line46);
        const line48 = line42.plus(line43).plus(line44).plus(line47);
        const line1  = new Decimal(0);
        const line4  = new Decimal(0);
        const line5  = line48;
        const fixedBasePct = Math.min(config.rrc_fixed_base_percentage, 16);
        const gr     = stateRdData.annualGrossReceipts ?? [];
        const totalGR = new Decimal(gr.reduce((s, r) => s + (r.grossReceipts ?? 0), 0));
        const line7  = gr.length > 0 ? totalGR.div(gr.length) : new Decimal(0);
        const line8  = line7.mul(fixedBasePct / 100);
        const line9  = Decimal.max(line5.minus(line8), 0);
        const line10 = line5.mul(config.rrc_qre_credit_percentage / 100);
        const line11 = Decimal.min(line9, line10);
        const line12 = line1.plus(line4).plus(line11);
        const rrcMultiplier = caseData.rrc_credit_280_c === "Yes" ? config.rrc_elect_280c_yes : config.rrc_elect_280c_no;
        const line13 = line12.mul(rrcMultiplier);

        return {
            line1:          this.round2(line1),
            line4:          this.round2(line4),
            line5:          this.round2(line5),
            fixed_base_pct: fixedBasePct,
            line7:          this.round2(line7),
            line8:          this.round2(line8),
            line9:          this.round2(line9),
            line10:         this.round2(line10),
            line11:         this.round2(line11),
            line12:         this.round2(line12),
            line13:         this.round2(line13),
            line48:         this.round2(line48),
            rrc_multiplier: rrcMultiplier * 100,
            _line13:        line13,
        };
    }

    // ── Section B — ASC (lines 14–26) ─────────────────────────────────────
    private computeSectionB(
        config: ConfigJson,
        stateRdData: StateRDData,
        caseData:Case,
        sectionA:any
    ) {
        const line19 = new Decimal(config.asc_qre_credit_percentage_c1 / 100);
        const line20 = new Decimal(sectionA.line48);
        const prior3 = stateRdData.prior3YearsQREs ?? [];
        const line21 = new Decimal(prior3.reduce((s, y) => s + (y.qre ?? 0), 0));
        const hasPriorQREs = prior3.length >= 3 && prior3.every(y => (y.qre ?? 0) > 0);

        let line22 = new Decimal(0);
        let line23 = new Decimal(0);
        let line24: Decimal;

        if (hasPriorQREs) {
            line22 = line21.div(6);
            line23 = Decimal.max(line20.minus(line22), 0);
            line24 = line23.mul(config.asc_qre_credit_percentage_c2 / 100);
        } else {
            line24 = line20.mul(config.asc_qre_credit_percentage_c3 / 100);
            logMessage(`DC ASC — no prior QREs. Using no-prior rate: ${config.asc_qre_credit_percentage_c3}%`);
        }

        const line25 = line19.plus(line24);
        const line26 = caseData.asc_credit_280_c ? line25.mul(config.asc_elect_280c_yes) : line25;

        return {
            line19:         this.round2(line19),
            line20:         this.round2(line20),
            line21:         this.round2(line21),
            line22:         this.round2(line22),
            line23:         this.round2(line23),
            line24:         this.round2(line24),
            line25:         this.round2(line25),
            line26:         this.round2(line26),
            has_prior_qres: hasPriorQREs,
            asc_rate_used:  hasPriorQREs ? config.asc_qre_credit_percentage_c2 : config.asc_qre_credit_percentage_c3,
            _line26:        line26,
        };
    }

        // ─────────────────────────────────────────────────────────────────────────
        // Section C — Current Year Credit (lines 27–32)
        // ─────────────────────────────────────────────────────────────────────────
        private computeSectionC(
            config: ConfigJson,
            sectionA: ReturnType<RdCreditCalculatorForDC["computeSectionA"]>,
            sectionB: ReturnType<RdCreditCalculatorForDC["computeSectionB"]>,
            caseData: Case
        ) {
            const cd = caseData as any;
    
            //---- Active method credit: Line 13 (RRC) or Line 26 (ASC)
            //const activeMethodCredit = config.use_asc ? sectionB._line26 : sectionA._line13;
            const activeMethodCredit =  sectionA._line13;
    
            //---- Line 27: Form 8932 payroll tax wages
            const line27 = new Decimal(cd.credit_shared_wages_dc ?? 0);
    
            //---- Line 28: max(active credit − Line 27, 0)
            const line28 = Decimal.max(activeMethodCredit.minus(line27), 0);
    
            //---- Line 29: Pass-through credit from partnerships/S-corps/trusts
            const line29 = new Decimal(cd.pass_through_research_credit_dc ?? 0);
    
            //---- Line 30: Line 28 + Line 29  ← FINAL CREDIT
            const line30 = line28.plus(line29);
    
            //---- Line 31: Allocated to beneficiaries (hardcoded 0)
            const line31 = new Decimal(cd.amount_allocated_beneficiaries_dc ?? 0);
    
            //---- Line 32: Line 30 − Line 31
            const line32 = line30.minus(line31);
    
            return {
                line27:         this.round2(line27),
                line28:         this.round2(line28),
                line29:         this.round2(line29),
                line30:         this.round2(line30),   // final credit
                line31:         this.round2(line31),
                line32:         this.round2(line32),
            };
        }


    // ── Input params ───────────────────────────────────────────────────────
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
                              credit_type: metadata.creditType || "STATE_RD_DC",
                              currency: metadata.currency || "USD",
                              "Fiscal Year Ended" : metadata.fiscalYearEnded,
                              "Description": "Research Tax Credit",
                              stateDetails : "District of Columbia - Credit Calculations"
                          },
                          "Current & Prior years information" : storeData
                      };
                  }
    

    // ── Computed fields ────────────────────────────────────────────────────
    private buildComputedFields(
        a: ReturnType<RdCreditCalculatorForDC["computeSectionA"]>,
        b: ReturnType<RdCreditCalculatorForDC["computeSectionB"]>,
        c: ReturnType<RdCreditCalculatorForDC["computeSectionC"]>,
        config: ConfigJson
    ) {
        // const method280c   = config.elect_280c ? "280C elected" : "No 280C election";
        // const ascRateLabel = b.has_prior_qres
        //     ? `${b.asc_rate_used}% (prior QREs exist)`
        //     : `${b.asc_rate_used}% (no prior QREs — reduced rate on line 20)`;
        const ascRateLine24 = `Multiply line 23 by ${config.asc_qre_credit_percentage_c2}% (${config.asc_qre_credit_percentage_c2 / 100}). If you skipped lines 22 and 23, multiply line 20 by ${config.asc_qre_credit_percentage_c3}% (${config.asc_qre_credit_percentage_c3 / 100})`
         //   ? `Multiply line 23 by 14% (0.14). If you skipped lines 22 and 23, multiply line 20 by 6% (0.06)`
         //   : `Multiply line 20 by 6% (0.06) [lines 22 and 23 skipped — no prior QREs in one or more years]`;


        return {
            computed_fields: {
                "Section A — Section A—Regular Credit. Skip this section and go to Section B if you are electing or previously elected (and are not revoking) the alternative simplified credit.": {
                    "[1] Certain amounts paid or incurred to energy consortia (see instructions)":                                  a.line1,
                    "[2] Basic research payments to qualified organizations (see instructions)":                             a.line4,
                    "[3] Qualified organization base period amount":0,
                    "Subtract line 3 from line 2. If zero or less, enter -0- ":0,
                    "[4] Note: Complete Section F before going to line 5.":                          "" ,
                    "[5] Total qualified research expenses (QREs). Enter amount from line 48":a.line5,
                    [`[6] Enter fixed-base percentage, but not more than ${config.rrc_fixed_base_percentage}% (${config.rrc_fixed_base_percentage / 100}). See instructions`]:  `${a.fixed_base_pct}%`,
                    "[7] Enter average annual gross receipts. See instructions":                     a.line7,
                    "[8] Multiply line 7 by the percentage on line 6":                    a.line8,
                    "[9] Subtract line 8 from line 5. If zero or less, enter -0- ":             a.line9,
                    [`[10] Multiply line 5 by ${config.rrc_qre_credit_percentage}% (${config.rrc_qre_credit_percentage / 100}) "`]:                                    a.line10,
                    "[11] Enter the smaller of line 9 or line 10":                    a.line11,
                    "[12] Add lines 1, 4, and 11":                          a.line12,
                    [`[13]If you elect to reduce the credit under section 280C, then multiply line 12 by ${config.rrc_elect_280c_yes}% (${config.rrc_elect_280c_yes / 100}).If not, multiply line 12 by ${config.rrc_elect_280c_no}% (${config.rrc_elect_280c_no /100}) and see instructions for the statement that must be attached`]: a.line13,
                },
                 "Section B—Alternative Simplified Credit. Skip this section if you are completing Section A.": {
                    "[14] Certain amounts paid or incurred to energy consortia (see the line 1 instructions)":
                       0,
                    "[15] Basic research payments to qualified organizations (see the line 2 instructions)":
                       0,
                    "[16] Qualified organization base period amount (see the line 3 instructions)":
                       0,
                    "[17] Subtract line 16 from line 15. If zero or less, enter -0-":
                       0,
                    "[18] Add lines 14 and 17":
                        0,
                    [`[19] Multiply line 18 by ${config.asc_qre_credit_percentage_c1}% (${config.asc_qre_credit_percentage_c2 / 100})`]:
                        b.line19,
                    "Note: Complete Section F before going to line 20.":"",
                    "[20] Total qualified research expenses (QREs). Enter amount from line 48":
                        b.line20,
                    "[21] Enter your total QREs for the prior 3 tax years. If you had no QREs in any 1 of those years, skip lines 22 and 23":
                        b.line21,
                    "[22] Divide line 21 by 6.0":
                        b.line22,
                    "[23] Subtract line 22 from line 20. If zero or less, enter -0-":
                        b.line23,
                    [`[24] ${ascRateLine24}`]:
                        b.line24,
                    "[25] Add lines 19 and 24":
                        b.line25,
                    [`[26] If you elect to reduce the credit under section 280C, then multiply line 25 by ${config.asc_elect_280c_yes}% (${config.asc_elect_280c_yes / 100}). If not, enter the amount from line 25 and see the line 13 instructions for the statement that must be attached `]:
                        b.line26,
                },
                "Section C—Current Year Credit": {
                    "[27] Enter  the  portion  of  the  credit  from  Form  8932,  line  2,  that  is  attributable  to  wages  that  were also used to figure the credit on line 13 or line 26 (whichever applies)":
                        c.line27,
                    "[28] Subtract line 27 from line 13 or line 26 (whichever applies). If zero or less, enter -0-":
                       c.line28,
                    "[29] Credit for increasing research activities from partnerships, S corporations, estates, and trusts":
                        c.line29,
                    "[30] Add lines 28 and 29":
                        c.line30,
                    "[31] Amount allocated to beneficiaries of the estate or trust (see instructions)":
                        c.line31,
                    "[32] Estates and trusts, subtract line 31 from line 30. For eligible small businesses, report the credit on Form 3800, Part III, line 4i. See instructions. For filers other than eligible small businesses, report the credit on Form 3800, Part III, line 1c":
                        c.line32,
                },
            },
        };
    }

    // ── Rounding utility ───────────────────────────────────────────────────
    round2(value: any): number {
        if (value === null || value === undefined) return value;
        if (Decimal.isDecimal(value)) return value.toDecimalPlaces(2).toNumber();
        if (typeof value === "number" || typeof value === "string")
            return new Decimal(value).toDecimalPlaces(2).toNumber();
        return value;
    }
}
