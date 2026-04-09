import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * Vermont R&D Credit Calculator
 *
 * Form: Vermont — Credit for Increasing Research Activities (mirrors Federal Form 6765)
 *
 * Sections (computed in this order):
 *   Section F — Qualified Research Expenses Summary  (lines 42–48)  ← MUST RUN FIRST
 *   Section A — Regular Credit                       (lines 1–13)
 *   Section B — Alternative Simplified Credit        (lines 14–26)
 *   Section C — Current Year Credit                  (lines 27–32)  ← finalCredit = line 30
 *   Section D — Payroll Tax Election                 (lines 33–36)  ← defaults 0
 *   Section E — Other Information                    (lines 37–41)  ← informational
 *
 * Only ONE of Section A or Section B is used per filing (config.use_asc drives the choice).
 * Both are computed and appear in computedFields for audit transparency.
 *
 * Section A — Regular Credit:
 *   Needs avg gross receipts (line 7). When gross receipts = 0 → line 13 = 0.
 *   280C election: line 12 × 15.8% (elected) or × 20% (not elected)
 *
 * Section B — Alternative Simplified Credit:
 *   Prior 3yr QRE ÷ 6 → excess → × 14% (or × 6% if no prior QREs in any year)
 *   280C election: line 25 × 79% (elected) or unchanged (not elected)
 *
 * Verified:
 *   QRE=$165,000, prior3yr=$305,000
 *   Line 22 = 305,000÷6 = 50,833.33
 *   Line 23 = 165,000−50,833.33 = 114,166.67
 *   Line 24 = 114,166.67×14% = 15,983.33  ✓  (Excel: 15983.333333333334)
 *   Line 26 = 15,983.33 (no 280C)          ✓
 *
 * Carryforward: Up to 10 years.
 */

export interface ConfigJson {
    /** Applicable % of contract expenses (Section F line 45) — default 65 (i.e. 65%) */
    sub_con_percent: number;
    rrc_qre_credit_percentage:number;
    asc_qre_credit_percentage_c1:number;
    rrc_elect_280c_yes:number;
    rrc_elect_280c_no :number;
    asc_elect_280c_yes: number;

    /** Fixed-base % for RRC base amount (Section A line 6, max 16) — default 16 */
    rrc_fixed_base_percentage: number;

    /** ASC rate when prior 3yr QREs all > 0 (Section B line 24) — default 14 (i.e. 14%) */
    asc_qre_credit_percentage_c2: number;

    /**
     * ASC rate when no QREs in one or more prior years (Section B line 24).
     * Lines 22 and 23 are skipped; line 20 × this rate is used instead.
     * Default 6 (i.e. 6%)
     */
    asc_qre_credit_percentage_c3: number;

   

   
}

export class RdCreditCalculatorForVT {

    country    = "USA";
    creditType = "State R&D Credit - VT";
    currency   = "USD";

    async compute(
        config: ConfigJson,
        stateRdData: StateRDData,
        fiscalYear: string,
        year: number,
        caseData: Case
    ) {
        logMessage(`Computing VT Credit — fiscal year: ${fiscalYear}`);
        logMessage(`VT config: ${JSON.stringify(config)}`);

        // Section F must run first — line 48 feeds both Section A (line 5) and Section B (line 20)
        const sectionF = this.computeSectionF(config, stateRdData, caseData);
        const sectionA = this.computeSectionA(config, stateRdData, sectionF,caseData);
        const sectionB = this.computeSectionB(config, stateRdData, sectionF,caseData);
        const sectionC = this.computeSectionC(config, sectionA, sectionB, caseData);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear : year
        },config);
        const computedFields = this.buildComputedFields(sectionF, sectionA, sectionB,sectionC, config);

        return {
            inputFields,
            computedFields,
            finalCredit:   Math.max(sectionA.line13,sectionB.line26),
            totalQRE:      sectionF.line48,
            totalWages:    this.round2(new Decimal(stateRdData.currentYearQREs.wages    ?? 0)),
            totalContract: this.round2(new Decimal(stateRdData.currentYearQREs.contract ?? 0)),
            totalSupplies: this.round2(new Decimal(stateRdData.currentYearQREs.supplies ?? 0)),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Section F—Qualified Research Expenses Summary. See instructions. (lines 42–48)
    // ─────────────────────────────────────────────────────────────────────────
    private computeSectionF(config: ConfigJson, stateRdData: StateRDData, caseData: Case) {
        const { wages = 0, supplies = 0, contract = 0 } = stateRdData.currentYearQREs;
        const cd = caseData as any;

        // [42] Total wages for qualified services for all business components
        //      (do not include any wages used figuring the work opportunity credit)
        const line42 = new Decimal(wages);

        // [43] Total costs of supplies for all business components
        const line43 = new Decimal(supplies);

        // [44] Total rental or lease cost of computers for all business components
        const line44 = new Decimal(cd.lease_costs_of_computers_vt ?? 0);

        // [45] Total applicable amount of contract research for all business components
        //      (do not include basic research payments)
        const line45 = new Decimal(contract).mul(config.sub_con_percent / 100);

        // [46] Enter the applicable amount of all basic research payments. See instructions
        const line46 = new Decimal(0);

        // [47] Add line 45 and line 46
        const line47 = line45.plus(line46);

        // [48] Add lines 42, 43, 44, and 47, then enter line 48 on either line 5 or line 20,
        //      whichever is appropriate
        const line48 = line42.plus(line43).plus(line44).plus(line47);

        return {
            line42:  this.round2(line42),
            line43:  this.round2(line43),
            line44:  this.round2(line44),
            line45:  this.round2(line45),
            line46:  this.round2(line46),
            line47:  this.round2(line47),
            line48:  this.round2(line48),
            _line48: line48,   // raw Decimal forwarded to Section A and B
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Section A—Regular Credit (lines 1–13)
    // Skip this section and go to Section B if you are electing or previously
    // elected (and are not revoking) the alternative simplified credit
    // ─────────────────────────────────────────────────────────────────────────
    private computeSectionA(
        config: ConfigJson,
        stateRdData: StateRDData,
        sectionF: ReturnType<RdCreditCalculatorForVT["computeSectionF"]>,
        caseData: Case
    ) {
        // [1] Certain amounts paid or incurred to energy consortia (see instructions)
        const line1 = new Decimal(caseData.energy_consortia_amount_vt ?? 0);
        const line2 = new Decimal(caseData.basic_research_payments_vt ?? 0);
         const line3 = new Decimal(caseData.qualified_org_baseamount_vt ?? 0);

        // [4] Subtract line 3 from line 2. If zero or less, enter -0-
        const line4 = new Decimal(line2.minus(line3));

        // Note: Complete Section F before going to line 5.
        // [5] Total qualified research expenses (QREs). Enter amount from line 48
        const line5 = sectionF._line48;

        // [6] Enter fixed-base percentage, but not more than 16% (0.16). See instructions
        const fixedBasePct = Math.min(config.rrc_fixed_base_percentage, 16);

        // [7] Enter average annual gross receipts. See instructions
        const gr      = stateRdData.annualGrossReceipts ?? [];
        const totalGR = new Decimal(gr.reduce((s, r) => s + (r.grossReceipts ?? 0), 0));
        const line7   = gr.length > 0 ? totalGR.div(gr.length) : new Decimal(0);

        // [8] Multiply line 7 by the percentage on line 6
        const line8 = line7.mul(fixedBasePct / 100);

        // [9] Subtract line 8 from line 5. If zero or less, enter -0-
        const line9 = Decimal.max(line5.minus(line8), 0);

        // [10] Multiply line 5 by 50% (0.50)
        const line10 = line5.mul(config.rrc_qre_credit_percentage / 100);

        // [11] Enter the smaller of line 9 or line 10
        const line11 = Decimal.min(line9, line10);

        // [12] Add lines 1, 4, and 11
        const line12 = line1.plus(line4).plus(line11);

        // [13] If you elect to reduce the credit under section 280C, then multiply line 12
        //      by 15.8% (0.158). If not, multiply line 12 by 20% (0.20) and see instructions
        //      for the statement that must be attached
        const rrcMultiplier = caseData.rrc_credit_280_c === "Yes" ? config.rrc_elect_280c_yes : config.rrc_elect_280c_no;
        const line13        = line12.mul(rrcMultiplier / 100);
        console.log(caseData.rrc_credit_280_c)
        console.log("RRC config",rrcMultiplier)
         console.log("RRC config vT check",line13)

        return {
            line1:           this.round2(line1),
            line2:           this.round2(line2),
            line3:           this.round2(line3),
            line4:           this.round2(line4),
            line5:           this.round2(line5),
            fixed_base_pct:  fixedBasePct,
            line7:           this.round2(line7),
            line8:           this.round2(line8),
            line9:           this.round2(line9),
            line10:          this.round2(line10),
            line11:          this.round2(line11),
            line12:          this.round2(line12),
            line13:          this.round2(line13),
            rrc_multiplier:  rrcMultiplier ,   // 20 or 15.8
            _line13:         line13,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Section B—Alternative Simplified Credit (lines 14–26)
    // Skip this section if you are completing Section A.
    // ─────────────────────────────────────────────────────────────────────────
    private computeSectionB(
        config: ConfigJson,
        stateRdData: StateRDData,
        sectionF: ReturnType<RdCreditCalculatorForVT["computeSectionF"]>,
        caseData:any
    ) {
        // [14] Certain amounts paid or incurred to energy consortia (see the line 1 instructions)
        const line14 = new Decimal(caseData.energy_consortia_amount_vt ?? 0);;

        // [15] Basic research payments to qualified organizations (see the line 2 instructions)
        const line15 = new Decimal(caseData.basic_research_payments_vt ?? 0);;

        // [16] Qualified organization base period amount (see the line 3 instructions)
        const line16 = new Decimal(caseData.qualified_org_baseamount_vt ?? 0);;

        // [17] Subtract line 16 from line 15. If zero or less, enter -0-
        const line17 = Decimal.max(line15.minus(line16), 0);

        // [18] Add lines 14 and 17
        const line18 = line14.plus(line17);

        // [19] Multiply line 18 by 20% (0.20)
        const line19 = line18.mul(config.asc_qre_credit_percentage_c1 / 100);

        // Note: Complete Section F before going to line 20.
        // [20] Total qualified research expenses (QREs). Enter amount from line 48
        const line20 = sectionF._line48;

        // [21] Enter your total QREs for the prior 3 tax years. If you had no QREs in any 1 of
        //      those years, skip lines 22 and 23
        const prior3       = (stateRdData.prior3YearsQREs ?? []).slice(0, 3);
        const line21       = new Decimal(prior3.reduce((s, y) => s + (y.qre ?? 0), 0));
        const hasPriorQREs = prior3.length >= 3 && prior3.every(y => (y.qre ?? 0) > 0);

        let line22 = new Decimal(0);
        let line23 = new Decimal(0);
        let line24: Decimal;

        if (hasPriorQREs) {
            // [22] Divide line 21 by 6.0
            line22 = line21.div(6);

            // [23] Subtract line 22 from line 20. If zero or less, enter -0-
            line23 = Decimal.max(line20.minus(line22), 0);

            // [24] Multiply line 23 by 14% (0.14). If you skipped lines 22 and 23,
            //      multiply line 20 by 6% (0.06)
            line24 = line23.mul(config.asc_qre_credit_percentage_c2 / 100);
        } else {
            // Skipped lines 22 and 23 — multiply line 20 by 6% (0.06)
            line24 = line20.mul(config.asc_qre_credit_percentage_c3 / 100);
            logMessage(`VT ASC — no prior QREs in one or more years. ` +
                `Using ${config.asc_qre_credit_percentage_c3}% on line 20.`);
        }

        // [25] Add lines 19 and 24
        const line25 = line19.plus(line24);

        // [26] If you elect to reduce the credit under section 280C, then multiply line 25
        //      by 79% (0.79). If not, enter the amount from line 25 and see the line 13
        //      instructions for the statement that must be attached
        const line26 = caseData.asc_credit_280_c === "Yes" ? line25.mul(config.asc_elect_280c_yes / 100) : line25;

        return {
            line14:          this.round2(line14),
            line15:          this.round2(line15),
            line16:          this.round2(line16),
            line17:          this.round2(line17),
            line18:          this.round2(line18),
            line19:          this.round2(line19),
            line20:          this.round2(line20),
            line21:          this.round2(line21),
            line22:          this.round2(line22),
            line23:          this.round2(line23),
            line24:          this.round2(line24),
            line25:          this.round2(line25),
            line26:          this.round2(line26),
            has_prior_qres:  hasPriorQREs,
            asc_rate_used:   hasPriorQREs
                ? config.asc_qre_credit_percentage_c2
                : config.asc_qre_credit_percentage_c3,
            _line26:         line26,
        };
    }

      // ─────────────────────────────────────────────────────────────────────────
    // Section C — Current Year Credit (lines 27–32)
    // ─────────────────────────────────────────────────────────────────────────
    private computeSectionC(
        config: ConfigJson,
        sectionA: ReturnType<RdCreditCalculatorForVT["computeSectionA"]>,
        sectionB: ReturnType<RdCreditCalculatorForVT["computeSectionB"]>,
        caseData: Case
    ) {
        const cd = caseData as any;

        //---- Active method credit: Line 13 (RRC) or Line 26 (ASC)
        //const activeMethodCredit = config.use_asc ? sectionB._line26 : sectionA._line13;
        const activeMethodCredit =   Decimal.max(sectionA._line13,sectionB._line26);

        //---- Line 27: Form 8932 payroll tax wages
        const line27 = new Decimal(cd.credit_shared_wages_vt ?? 0);

        //---- Line 28: max(active credit − Line 27, 0)
        const line28 = Decimal.max(activeMethodCredit.minus(line27), 0);

        //---- Line 29: Pass-through credit from partnerships/S-corps/trusts
        const line29 = new Decimal(cd.pass_through_research_credit_vt ?? 0);

        //---- Line 30: Line 28 + Line 29  ← FINAL CREDIT
        const line30 = line28.plus(line29);

        //---- Line 31: Allocated to beneficiaries (hardcoded 0)
        const line31 = new Decimal(cd.amount_allocated_beneficiaries_vt ?? 0);

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

    // ─────────────────────────────────────────────────────────────────────────
    // Section C—Current Year Credit (lines 27–32)
    // ─────────────────────────────────────────────────────────────────────────
    // private computeSectionC(
    //     config: ConfigJson,
    //     sectionA: ReturnType<RdCreditCalculatorForVT["computeSectionA"]>,
    //     sectionB: ReturnType<RdCreditCalculatorForVT["computeSectionB"]>,
    //     caseData: Case
    // ) {
    //     const cd = caseData as any;

    //     // Active method credit: line 13 (RRC) or line 26 (ASC)
    //     const activeMethodCredit = config.use_asc ? sectionB._line26 : sectionA._line13;

    //     // [27] Enter the portion of the credit from Form 8932, line 2, that is attributable
    //     //      to wages that were also used to figure the credit on line 13 or line 26
    //     //      (whichever applies)
    //     const line27 = new Decimal(cd.vt_form8932_wages ?? 0);

    //     // [28] Subtract line 27 from line 13 or line 26 (whichever applies).
    //     //      If zero or less, enter -0-
    //     const line28 = Decimal.max(activeMethodCredit.minus(line27), 0);

    //     // [29] Credit for increasing research activities from partnerships, S corporations,
    //     //      estates, and trusts
    //     const line29 = new Decimal(cd.vt_passthrough_credit ?? 0);

    //     // [30] Add lines 28 and 29
    //     const line30 = line28.plus(line29);

    //     // [31] Amount allocated to beneficiaries of the estate or trust (see instructions)
    //     const line31 = new Decimal(0);

    //     // [32] Estates and trusts, subtract line 31 from line 30. For eligible small businesses,
    //     //      report the credit on Form 3800, Part III, line 4i. See instructions. For filers
    //     //      other than eligible small businesses, report the credit on Form 3800, Part III,
    //     //      line 1c
    //     const line32 = line30.minus(line31);

    //     return {
    //         active_method: config.use_asc ? "ASC (Section B)" : "RRC (Section A)",
    //         line27:        this.round2(line27),
    //         line28:        this.round2(line28),
    //         line29:        this.round2(line29),
    //         line30:        this.round2(line30),
    //         line31:        this.round2(line31),
    //         line32:        this.round2(line32),
    //     };
    // }

    // ─────────────────────────────────────────────────────────────────────────
    // Input params
    // ─────────────────────────────────────────────────────────────────────────
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
                       credit_type: metadata.creditType || "STATE_RD_VT",
                       currency: metadata.currency || "USD",
                       "Fiscal Year Ended" : metadata.fiscalYearEnded,
                       "Description": "Research Tax Credit",
                       stateDetails : "Vermont - Credit Calculations"
                   },
                   "Current & Prior years information" : storeData
               };
           }

    // ─────────────────────────────────────────────────────────────────────────
    // Computed fields — exact Excel label text throughout
    // ─────────────────────────────────────────────────────────────────────────
    private buildComputedFields(
        f: ReturnType<RdCreditCalculatorForVT["computeSectionF"]>,
        a: ReturnType<RdCreditCalculatorForVT["computeSectionA"]>,
        b: ReturnType<RdCreditCalculatorForVT["computeSectionB"]>,
        c: ReturnType<RdCreditCalculatorForVT["computeSectionC"]>,
        config: ConfigJson
    ) {
        // const method280c_a = config.elect_280c
        //     ? `Multiply line 12 by 15.8% (0.158)`
        //     : `Multiply line 12 by 20% (0.20)`;

        // const method280c_b = config.elect_280c
        //     ? `Multiply line 25 by 79% (0.79)`
        //     : `Enter the amount from line 25`;

        const ascRateLine24 = `Multiply line 23 by ${config.asc_qre_credit_percentage_c2}% (${config.asc_qre_credit_percentage_c2 / 100}). If you skipped lines 22 and 23, multiply line 20 by ${config.asc_qre_credit_percentage_c3}% (${config.asc_qre_credit_percentage_c3 / 100})`
       //     ? `Multiply line 23 by 14% (0.14). If you skipped lines 22 and 23, multiply line 20 by 6% (0.06)`
       //     : `Multiply line 20 by 6% (0.06) [lines 22 and 23 skipped — no prior QREs in one or more years]`;

        return {
            computed_fields: {
                // ── Section A ────────────────────────────────────────────────
                "Section A—Regular Credit. Skip this section and go to Section B if you are electing or previously elected (and are not revoking) the alternative simplified credit": {
                    "[1] Certain amounts paid or incurred to energy consortia (see instructions)":
                        a.line1,
                    "[2] Basic research payments to qualified organizations (see instructions) ":a.line2,
                    "[3] Qualified organization base period amount": a.line3,
                    "[4] Subtract line 3 from line 2. If zero or less, enter -0-":
                        a.line4,
                    "Note: Complete Section F before going to line 5.":"",
                    "[5] Total qualified research expenses (QREs). Enter amount from line 48":
                        a.line5,
                    [`[6] Enter fixed-base percentage, but not more than ${config.rrc_fixed_base_percentage}% (${config.rrc_fixed_base_percentage / 100}). See instructions: ${a.fixed_base_pct}%`]:
                        `${a.fixed_base_pct}%`,
                    "[7] Enter average annual gross receipts. See instructions":
                        a.line7,
                    "[8] Multiply line 7 by the percentage on line 6":
                        a.line8,
                    "[9] Subtract line 8 from line 5. If zero or less, enter -0-":
                        a.line9,
                    [`[10] Multiply line 5 by ${config.rrc_qre_credit_percentage}% (${config.rrc_qre_credit_percentage / 100})`]:
                        a.line10,
                    "[11] Enter the smaller of line 9 or line 10":
                        a.line11,
                    "[12] Add lines 1, 4, and 11":
                        a.line12,
                    [`[13] If you elect to reduce the credit under section 280C, then multiply line 12 by ${config.rrc_elect_280c_yes} (${config.rrc_elect_280c_yes / 100}). If not, multiply line 12 by ${config.rrc_elect_280c_no}% (${config.rrc_elect_280c_no / 100}) and see instructions for the statement that must be attached`]:
                        a.line13,
                },

                // ── Section B ────────────────────────────────────────────────
                "Section B—Alternative Simplified Credit. Skip this section if you are completing Section A.": {
                    "[14] Certain amounts paid or incurred to energy consortia (see the line 1 instructions)":
                        b.line14,
                    "[15] Basic research payments to qualified organizations (see the line 2 instructions)":
                        b.line15,
                    "[16] Qualified organization base period amount (see the line 3 instructions)":
                        b.line16,
                    "[17] Subtract line 16 from line 15. If zero or less, enter -0-":
                        b.line17,
                    "[18] Add lines 14 and 17":
                        b.line18,
                    [`[19] Multiply line 18 by ${config.asc_qre_credit_percentage_c1}% (${config.asc_qre_credit_percentage_c1 /100})`]:
                        b.line19,
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

                // ── Section C ────────────────────────────────────────────────
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

                // ── Section D ────────────────────────────────────────────────
                "Section D—Qualified Small Business Payroll Tax Election and Payroll Tax Credit. Skip this section if the payroll tax election does not apply. See instructions.": {
                    "[33 a] Check this box if you are a qualified small business electing the payroll tax credit. See instructions]":0,
                    "[33 b] Check the box if payroll tax is reported on a different EIN " : 0,
                    "[34] Enter  the  portion  of  line  28  elected  as  a  payroll  tax  credit  (do  not  enter  more  than  $500,000). See instructions":
                        0,
                    "[35] General  business  credit  carryforward  from  the  current  year.  See  instructions.  Partnerships  and  S corporations, skip this line and go to line 36":
                        0,
                    "[36] Partnerships and S corporations, enter the smaller of line 28 or line 34. All others, enter the smallest of line  28, line  34,  or  line  35.  Enter  here  and  on  the  applicable  line  of  Form  8974,  Part  1,  column  (e)":
                        0,
                },

                // ── Section E ────────────────────────────────────────────────
                "Section E—Other Information. See instructions.": {
                    "[37] Enter the number of business components generating the QREs on line 5 or line 20":
                        0,
                    "[38] Enter the amount of officers' wages included on line 42":
                        0,
                    "[39] Did you acquire or dispose of any major portion of a trade or business in the tax year?        Yes    No":
                        0,
                    "[40] Did you include any new categories of expenses as current year QREs?   .    .    .    .          Yes        No":
                        0,
                    "[41] Did you determine any of the QREs on line 5 or line 20 following the ASC 730 Directive?":
                        0,
                },

                // ── Section F ────────────────────────────────────────────────
                "Section F—Qualified Research Expenses Summary. See instructions.": {
                    "[42] Total wages for qualified services for all business components (do not include any wages used figuring the work opportunity credit)":
                        f.line42,
                    "[43] Total costs of supplies for all business components":
                        f.line43,
                    "[44] Total rental or lease cost of computers for all business components":
                        f.line44,
                    "[45] Total applicable amount of contract research for all business components (do not include basic research payments)":
                        f.line45,
                    "[46] Enter the applicable amount of all basic research payments. See instructions":
                        f.line46,
                    "[47] Add line 45 and line 46":
                        f.line47,
                    "[48] Add lines 42, 43, 44, and 47, then enter line 48 on either line 5 or line 20, whichever is appropriate":
                        f.line48,
                },
            }
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Rounding utility — consistent with all other state calculators
    // ─────────────────────────────────────────────────────────────────────────
    round2(value: any): number {
        if (value === null || value === undefined) return value;
        if (Decimal.isDecimal(value)) return value.toDecimalPlaces(2).toNumber();
        if (typeof value === "number" || typeof value === "string")
            return new Decimal(value).toDecimalPlaces(2).toNumber();
        return value;
    }
}