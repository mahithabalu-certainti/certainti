import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * Iowa R&D Credit Calculator
 *
 * Form: Iowa Research Activities Credit (RAC) — IA 128
 *
 * Iowa uses a TWO-PART structure:
 *
 *   PART II  — Compute total allowable US QRE using standard RRC logic (lines 5–16)
 *   PART III — Apportion the allowable US QRE to Iowa using Iowa-specific QRE inputs (lines 17–34)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PART II — US QRE Calculation (lines 5–16)
 * ─────────────────────────────────────────────────────────────────────────────
 *   Line 2  : Energy consortia amounts (hardcoded 0 — not in scope)
 *   Line 5  : Wages for qualified research services
 *   Line 6  : Cost of supplies
 *   Line 7  : Computer rental costs
 *   Line 8  : Applicable portion of contract research expenses (× sub_con_percent%)
 *   Line 9  : Total US QRE = sum(lines 5–8)
 *   Line 10 : Fixed-base percentage (max 16%)
 *   Line 11 : Average US annual gross receipts (prior 4 years)
 *   Line 12 : Base amount = line 11 × line 10
 *   Line 13 : max(line 9 − line 12, 0)    ← excess QRE
 *   Line 14 : line 9 × 50%                ← 50% floor
 *   Line 15 : min(line 13, line 14)        ← allowable excess
 *   Line 16 : line 2 + line 15             ← total allowable US QRE
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PART III — Iowa Apportionment (lines 17–34)
 * ─────────────────────────────────────────────────────────────────────────────
 *   Iowa QRE uses different rules per expense type vs the US QRE in Part II:
 *     Wages    : Iowa qualifying wages = Iowa wages − non-qualifying Iowa wages (line 23)
 *     Supplies : Iowa eligible supplies = Iowa supplies × 60%                   (line 25) ← 60%, NOT 65%
 *     Contract : Iowa qualifying contract = Iowa contract − non-qualifying       (line 28)
 *
 *   Line 17 : Basic research payments in Iowa (hardcoded 0)
 *   Line 18 : Iowa apportioned base period amount (hardcoded 0)
 *   Line 19 : max(line 17 − line 18, 0)
 *   Line 20 : line 19 × credit_rate%  (6.5%)
 *   Line 21 : Iowa wages for qualified services
 *   Line 22 : Non-qualifying Iowa wages
 *   Line 23 : Qualifying Iowa wages = line 21 − line 22
 *   Line 24 : Iowa supplies cost
 *   Line 25 : Eligible Iowa supplies = line 24 × 60%
 *   Line 26 : Iowa contract research expenses
 *   Line 27 : Non-qualifying Iowa contract expenses
 *   Line 28 : Qualifying Iowa contract = line 26 − line 27
 *   Line 29 : Total Iowa QRE = line 23 + line 25 + line 28
 *   Line 30 : Total US QRE = line 2 + line 9   ← uses full line 9, NOT line 16
 *   Line 31 : Iowa share ratio = line 29 ÷ line 30
 *   Line 32 : Iowa allocable expenses = line 16 × line 31
 *   Line 33 : line 32 × credit_rate%  (6.5%)
 *   Line 34 : Iowa RAC = line 20 + line 33      ← FINAL CREDIT (single entity)
 *   Line 35 : Controlled group share (0 for single entity)
 *   Line 37 : Pass-through Iowa RAC from partnerships/S-corps (optional)
 *
 * Carryforward: Up to 7 years for unused credit.
 */

export interface ConfigJson {
    /** Applicable percentage of contract expenses for US QRE — default 65 (i.e. 65%) */
    sub_con_percent: number;

    /**
     * Fixed-base percentage for US QRE base amount computation (line 10).
     * Maximum 16 per Iowa form instructions. Default 16.
     */
    fixed_base_percentage: number;

    /** Iowa credit rate applied to Iowa-allocable expenses (lines 20 & 33) — default 6.5 (i.e. 6.5%) */
     qre_credit_percentage_c2:number;

    /**
     * Iowa supplies inclusion percentage (line 25).
     * Iowa-specific rule: 60%, NOT the standard 65% used for contract expenses.
     * Default 60.
     */
    qre_credit_percentage_c3: number;
    qre_credit_percentage_c1:number;
   
}

export class RdCreditCalculatorForIA {

    country    = "USA";
    creditType = "State R&D Credit - IA";
    currency   = "USD";

    async compute(
        config: ConfigJson,
        stateRdData: StateRDData,
        fiscalYear: string,
        year: number,
        caseData: Case
    ) {
        logMessage(`Computing IA Credit — fiscal year: ${fiscalYear}`);
        logMessage(`IA config: ${JSON.stringify(config)}`);

        const partIIResult   = this.partII(config, stateRdData, caseData);
        const partIIIResult  = this.partIII(config, stateRdData, caseData, partIIResult);
        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear : year
        },config);
        const computedFields = this.buildComputedFields(partIIResult, partIIIResult, config);

        return {
            inputFields,
            computedFields,
            finalCredit:              partIIIResult.iowa_rac,            // line 34
            totalQRE:                 partIIResult.total_us_qre,          // line 9
            totalWages:               this.round2(new Decimal(stateRdData.currentYearQREs.wages    ?? 0)),
            totalContract:            this.round2(new Decimal(stateRdData.currentYearQREs.contract ?? 0)),
            totalSupplies:            this.round2(new Decimal(stateRdData.currentYearQREs.supplies ?? 0)),
            averageAnnualGrossReceipts: partIIResult.avg_gross_receipts,  // line 11
            iowaShareRatio:           partIIIResult.iowa_share_ratio,     // line 31
            iowaAllocableExpenses:    partIIIResult.iowa_allocable_expenses, // line 32
        };
    }

    // -------------------------------------------------------------------------
    // Part II — US QRE Calculation (lines 5–16)
    // -------------------------------------------------------------------------
    private partII(config: ConfigJson, stateRdData: StateRDData, caseData: Case) {
        const { wages = 0, supplies = 0, contract = 0 } = stateRdData.currentYearQREsFederal!;
        const cd = caseData as any;

        //---- Line 2: Energy consortia (hardcoded 0 — not in scope)
        const line2 = new Decimal(cd.energy_consortia_amount_usa ?? 0);
        const line3 = new Decimal(cd.basic_research_payments_usa ?? 0);
        const line4 = new Decimal(cd.qualified_org_baseamount_usa ?? 0);

        //---- Line 5: Wages
        const line5 = new Decimal(wages);

        //---- Line 6: Supplies
        const line6 = new Decimal(supplies);

        //---- Line 7: Computer rental costs
        const line7 = new Decimal(cd.lease_costs_of_computers_ia ?? 0);

        //---- Line 8: Contract expenses × sub_con_percent%
        const line8 = new Decimal(contract).mul(config.sub_con_percent / 100);

        //---- Line 9: Total US QRE
        const line9 = line5.plus(line6).plus(line7).plus(line8);

        //---- Line 10: Fixed-base percentage (max 16%)
        const fixedBasePct = Math.min(config.fixed_base_percentage, 16);

        //---- Line 11: Average US annual gross receipts (prior years total ÷ count)
        const grossReceipts     = stateRdData.annualGrossReceipts ?? [];
        const totalGrossReceipts = new Decimal(
            grossReceipts.reduce((sum, r) => sum + (r.grossReceipts ?? 0), 0)
        );
        const line11 = grossReceipts.length > 0
            ? totalGrossReceipts.div(grossReceipts.length)
            : new Decimal(0);

        //---- Line 12: Base amount = line 11 × line 10
        const line12 = line11.mul(fixedBasePct / 100);

        //---- Line 13: max(line 9 − line 12, 0)
        const line13 = Decimal.max(line9.minus(line12), 0);

        //---- Line 14: line 9 × 50%
        const line14 = line9.mul(config.qre_credit_percentage_c1 / 100);

        //---- Line 15: min(line 13, line 14)
        const line15 = Decimal.min(line13, line14);

        //---- Line 16: Total allowable US QRE = line 2 + line 15
        const line16 = line2.plus(line15);

        return {
            energy_consortia:        this.round2(line2),
            wages:                   this.round2(line5),
            supplies:                this.round2(line6),
            computer_rental:         this.round2(line7),
            contract:                this.round2(line8),
            total_us_qre:            this.round2(line9),    // line 9 — used in line 30
            fixed_base_pct:          fixedBasePct,
            avg_gross_receipts:      this.round2(line11),
            base_amount:             this.round2(line12),
            excess_qre:              this.round2(line13),
            half_total_qre:          this.round2(line14),
            allowable_excess:        this.round2(line15),
            total_allowable_us_qre:  this.round2(line16),   // line 16 — used in line 32
            // keep Decimal references for Part III calculations
            _line2:  line2,
            _line9:  line9,
            _line16: line16,
        };
    }

    // -------------------------------------------------------------------------
    // Part III — Iowa Apportionment (lines 17–34)
    // -------------------------------------------------------------------------
    private partIII(
        config: ConfigJson,
        stateRdData: StateRDData,
        caseData: Case,
        p2: ReturnType<RdCreditCalculatorForIA["partII"]>
    ) {
        const { wages = 0, supplies = 0, contract = 0 } = stateRdData.currentYearQREs;
        const cd = caseData as any;
        const creditRate = config.qre_credit_percentage_c2 / 100;
        const suppliesInclusion = config.qre_credit_percentage_c3 / 100;

        //---- Lines 17–20: Basic research payments in Iowa (hardcoded 0)
        const line17 = new Decimal(cd.basic_research_payments_ia ?? 0);
        const line18 = new Decimal(cd.qualified_org_baseamount_ia ?? 0);
        const line19 = Decimal.max(line17.minus(line18), 0);
        const line20 = line19.mul(creditRate);

        //---- Lines 21–23: Iowa wages
        const line21 = new Decimal(wages ?? 0);
        const line22 = new Decimal(cd.non_qualifying_wages_ia ?? 0);
        const line23 = line21.minus(line22);

        //---- Lines 24–25: Iowa supplies × 60% (Iowa-specific rule)
        const line24 = new Decimal(cd.cost_of_supplies_ia ?? 0);
        const line25 = line24.mul(suppliesInclusion);   // 60%, not 65%

        //---- Lines 26–28: Iowa contract expenses
        const line26 = new Decimal(contract ?? 0);
        const line27 = new Decimal(cd.non_qualifying_contract_expenses_ia ?? 0);
        const line28 = line26.minus(line27);

        //---- Line 29: Total Iowa QRE = line 23 + line 25 + line 28
        const line29 = line23.plus(line25).plus(line28);

        //---- Line 30: Total US QRE = line 2 + line 9
        //    NOTE: uses full line 9 (not the capped line 16) as the denominator
        const line30 = p2._line2.plus(p2._line9);

        //---- Line 31: Iowa share ratio = line 29 ÷ line 30
        //    Guard against division by zero
        const line31 = line30.gt(0)
            ? line29.div(line30)
            : new Decimal(0);

        //---- Line 32: Iowa allocable expenses = line 16 × line 31
        const line32 = p2._line16.mul(line31);

        //---- Line 33: line 32 × credit rate
        const line33 = line32.mul(creditRate);

        //---- Line 34: Iowa RAC = line 20 + line 33  ← FINAL CREDIT (single entity)
        const line34 = line20.plus(line33);

        //---- Line 35: Controlled group share (0 for single entity)
        const line35 = new Decimal(cd.rac_share_ia ?? 0);

         //---- Line 35: Controlled group share (0 for single entity)
        const line36 = new Decimal(cd.supplement_rac_ia ?? 0);

        //---- Line 37: Pass-through Iowa RAC from partnerships/S-corps
        const line37 = new Decimal(cd.passthrough_supplement_rac_ia ?? 0);

        return {
            // Basic research (lines 17–20)
            basic_research_iowa:         this.round2(line17),
            iowa_base_period_amount:     this.round2(line18),
            basic_research_excess:       this.round2(line19),
            basic_research_credit:       this.round2(line20),
            // Iowa wages (lines 21–23)
            iowa_wages:                  this.round2(line21),
            non_qualifying_iowa_wages:   this.round2(line22),
            qualifying_iowa_wages:       this.round2(line23),
            // Iowa supplies (lines 24–25)
            iowa_supplies:               this.round2(line24),
            eligible_iowa_supplies:      this.round2(line25),
            // Iowa contract (lines 26–28)
            iowa_contract:               this.round2(line26),
            non_qualifying_iowa_contract: this.round2(line27),
            qualifying_iowa_contract:    this.round2(line28),
            // Apportionment (lines 29–33)
            total_iowa_qre:              this.round2(line29),
            total_us_qre_denominator:    this.round2(line30),
            iowa_share_ratio:            this.round2(line31),
            iowa_allocable_expenses:     this.round2(line32),
            iowa_allocable_credit:       this.round2(line33),
            // Final (lines 34–37)
            iowa_rac:                    this.round2(line34),
            controlled_group_share:      this.round2(line35),
            supplement_rac:this.round2(line36),
            passthrough_rac:             this.round2(line37),
            credit_rate_used:            config.qre_credit_percentage_c2,
            supplies_inclusion_used:     config.qre_credit_percentage_c3,
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
                          credit_type: metadata.creditType || "STATE_RD_IA",
                          currency: metadata.currency || "USD",
                          "Fiscal Year Ended" : metadata.fiscalYearEnded,
                          "Description": "Research Tax Credit",
                          stateDetails : "Iowa - Credit Calculations"
                      },
                      "Current & Prior years information" : storeData
                  };
              }

    // -------------------------------------------------------------------------
    // Computed fields builder — mirrors IA 128 form line layout
    // -------------------------------------------------------------------------
    private buildComputedFields(
        p2:    ReturnType<RdCreditCalculatorForIA["partII"]>,
        p3:    ReturnType<RdCreditCalculatorForIA["partIII"]>,
        config: ConfigJson
    ) {
        return {
            computed_fields: {
                "PART II — U.S. Qualified Research Expenses (Lines 5–16)": {
                    "[2] Certain amounts paid or incurred to energy consortia":                           p2.energy_consortia,
                    "[3] Basic research payments to qualified organizations":"",
                    "[4] Qualified organization base period amount":"",
                    "[5] Wages for qualified research services":                                          p2.wages,
                    "[6] Cost of supplies used in conducting qualified research":                         p2.supplies,
                    "[7] Rental or lease costs of computers used in conducting qualified research":                                             p2.computer_rental,
                    "[8] Applicable portion of contract research expenses": p2.contract,
                    "[9] Total qualified research expenses. Add lines 5 through 8":                      p2.total_us_qre,
                    [`[10] Fixed-base percentage (not more than 16%): ${p2.fixed_base_pct}%`]:           `${p2.fixed_base_pct}%`,
                    "[11] Average U.S. annual gross receipts for tax years ":                                           p2.avg_gross_receipts,
                    "[12] Multiply line 11 by the percentage on line 10":                                p2.base_amount,
                    "[13] Subtract line 12 from line 9. If zero or less, enter zero":                   p2.excess_qre,
                    [`[14] Multiply line 9 by ${config.qre_credit_percentage_c1} (${config.qre_credit_percentage_c1 / 100})`]:                                                p2.half_total_qre,
                    "[15] Enter the smaller of line 13 or line 14":                                     p2.allowable_excess,
                    "[16] Total allowable U.S. qualified research expenses. Add lines 2 and 15":        p2.total_allowable_us_qre,
                },
                "PART III — Calculation of Tax Credit Based on Percentage of Research Occurring within Iowa": {
                    "[17] Basic research payments to qualified organizations in Iowa":                   p3.basic_research_iowa,
                    "[18] Iowa apportioned qualified organization base period amount":                   p3.iowa_base_period_amount,
                    "[19] Subtract line 18 from line 17. If zero or less, enter zero":                  p3.basic_research_excess,
                    [`[20] Multiply line 19 by ${p3.credit_rate_used}% (${p3.credit_rate_used / 100})`]: p3.basic_research_credit,
                    "[21] Wages for qualified research services performed in Iowa":                      p3.iowa_wages,
                    "[22] Non-qualifying Iowa wages. See instructions":                                                    p3.non_qualifying_iowa_wages,
                    "[23] Qualifying Iowa wages. Subtract line 22 from line 21":                        p3.qualifying_iowa_wages,
                    "[24] Cost of supplies used in conducting qualified research in Iowa":               p3.iowa_supplies,
                    [`[25] Eligible cost of Iowa supplies. Multiply line 24 by ${p3.supplies_inclusion_used}% (Iowa-specific rule)`]: p3.eligible_iowa_supplies,
                    "[26] Applicable portion of contract research expenses incurred in Iowa":            p3.iowa_contract,
                    "[27] Non-qualifying Iowa contract research expenses. See instructions":                               p3.non_qualifying_iowa_contract,
                    "[28] Qualifying Iowa contract research expenses. Subtract line 27 from line 26":   p3.qualifying_iowa_contract,
                    "[29] Total Iowa qualified research expenses. Add lines 23, 25, and 28":            p3.total_iowa_qre,
                    "[30] Total U.S. qualified research expenses. Add lines 2 and 9":                   p3.total_us_qre_denominator,
                    "[31] Iowa share of research. Divide line 29 by line 30,enter percentage to the nearest":                           p3.iowa_share_ratio,
                    "[32] Expenses allocable to Iowa. Multiply line 16 by the percentage on line 31":   p3.iowa_allocable_expenses,
                    [`[33] Multiply line 32 by ${p3.credit_rate_used}% (${p3.credit_rate_used / 100})`]: p3.iowa_allocable_credit,
                    "[34] Iowa RAC. Add lines 20 and 33. If you are computing the credit as a controlled group or group of businesses under common control per Internal Revenue Code section 41(f)(1),complete Schedule A and proceed to line 35. Otherwise, this is your tax credit. See Where to Report this Tax Credit in instructions":                                               p3.iowa_rac,
                    "[35] Share of Iowa RAC for members of a controlled group or group of businesses under common control. Enter your share of the Iowa RAC from Schedule A, Column E.See Where to Report this Tax Credit in instructions":                 p3.controlled_group_share,
                    "[36] Iowa Supplemental RAC. See Where to Report this Tax Credit in instructions Pass-through Iowa RAC received from partnership, LLC, S corporation, estate, or trust. See Where to Report this Tax Credit in instructions":p3.supplement_rac,
                    "[37] Pass-through Iowa Supplemental RAC received from partnership, LLC, S corporation, estate, or trust. See Where to Report this Tax Credit in instructions":    p3.passthrough_rac,
                }
            },
        };
    }

    // -------------------------------------------------------------------------
    // Rounding utility — consistent with AZ / CA / CO / KS / LA / MN / NE
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
