import { Decimal } from "decimal.js";
import { logMessage } from "../../utils/helpers";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

/**
 * Maine R&D Credit Calculator
 *
 * Form: Schedule A (Maine Research Expense Credit)
 *
 * Two-part credit:
 *
 *   PART A — Basic Research Payments Credit
 *   Line 1a: Maine portion of federal basic research payments (Form 6765 Section A line 2 / Section B line 15)
 *   Line 1b: Maine portion of federal base period amounts (Form 6765 Section A line 3 / Section B line 16)
 *   Line 1 : Line 1a minus Line 1b, not less than 0
 *   Line 2 : Basic research payments credit (Line 1 × 7.5%)
 *
 *   PART B — Qualified Research Expenses Credit
 *   Line 3 : Total qualified research expenses for current year (wages + contract × sub_con%)
 *   Line 4a: Prior year 1 QRE
 *   Line 4b: Prior year 2 QRE
 *   Line 4c: Prior year 3 QRE
 *   Line 4 : Base amount = (4a + 4b + 4c) ÷ 3
 *   Line 5 : Excess QRE = max(Line 3 − Line 4, 0)
 *   Line 6 : QRE credit = Line 5 × 5%
 *
 *   Line 7 : Carryforward from previous years
 *   Line 8 : Total available credit = Line 2 + Line 6 + Line 7
 *
 * Carryforward: Up to 10 years for unused credit.
 */

export interface ConfigJson {
    /** Credit rate applied to basic research payments — default 7.5 (i.e. 7.5%) */
    basic_research_credit_rate: number;
    /** Credit rate applied to excess QRE — default 5 (i.e. 5%) */
    qre_credit_percentage: number;
    tax_liablity_threshold_amount: number;
    tax_liablity_threshold_percentage: number;
    /** Percentage of contract research expenses included — default 65 (i.e. 65%) */
    sub_con_percent: number;
}

export class RdCreditCalculatorForME {

    country    = "USA";
    creditType = "State R&D Credit - ME";
    currency   = "USD";

    async compute(
        config: ConfigJson,
        stateRdData: StateRDData,
        fiscalYear: string,
        year: number,
        caseDetails: Case
    ) {
        logMessage(`Computing ME Credit — fiscal year: ${fiscalYear}`);

        const partAResult  = this.partA(config, caseDetails);
        const partBResult  = this.partB(config, stateRdData, year, caseDetails);
        const totalCredit  = this.round2(new Decimal(partAResult.basicResearchCredit).plus(partBResult.qreCredit));

        const inputFields    = this.buildInputParams(
            stateRdData.currentYearQREs,
            stateRdData.prior3YearsQREs,
            {
                country:         this.country,
                creditType:      this.creditType,
                currency:        this.currency,
                fiscalYearEnded: fiscalYear,
                currentYear:     year,
            },
            config
        );
        const computedFields = this.buildComputedFields(partAResult, partBResult, totalCredit, config);

        return {
            inputFields,
            computedFields,
            finalCredit:   totalCredit,
            totalQRE:      partBResult.currentYearQre,
            totalWages:    this.round2(new Decimal(stateRdData.currentYearQREs.wages    ?? 0)),
            totalContract: this.round2(new Decimal(stateRdData.currentYearQREs.contract ?? 0)),
            totalSupplies: this.round2(new Decimal(stateRdData.currentYearQREs.supplies ?? 0)),
        };
    }

    // -------------------------------------------------------------------------
    // Part A — Basic Research Payments Credit
    //
    // Line 1: Maine portion of federal basic research payments (Form 6765
    //         Section A line 2 / Section B line 15) minus Maine portion of
    //         federal base period amounts (Form 6765 Section A line 3 /
    //         Section B line 16). Result must not be less than 0.
    // Line 2: Line 1 × basic_research_credit_rate %
    // -------------------------------------------------------------------------
    private partA(config: ConfigJson, caseDetails: Case) {
        const cd = caseDetails as any;
        const federalBasicResearchPayments = new Decimal(cd.basic_research_payments_usa ?? 0);
        const federalQualifiedOrg = new Decimal(cd.qualified_org_baseamount_usa ?? 0);
        const federalBasicResearch = federalBasicResearchPayments.minus(federalQualifiedOrg);
        const meBaseperiodAmount = new Decimal(cd.basic_research_payments_me ?? 0);
        const basicResearchPayments = Decimal.max(federalBasicResearch.minus(meBaseperiodAmount), 0);

        const basicResearchCredit   = basicResearchPayments.mul(config.basic_research_credit_rate / 100);

        return {
    
            basicResearchPayments:      this.round2(basicResearchPayments),
            basicResearchCredit:        this.round2(basicResearchCredit),
        };
    }

    // -------------------------------------------------------------------------
    // Part B — Qualified Research Expenses Credit
    // -------------------------------------------------------------------------
    private partB(config: ConfigJson, stateRdData: StateRDData, currentFiscalYear: number, caseDetails: Case) {
        const { wages = 0, contract = 0 } = stateRdData.currentYearQREs;

        // Line 3 — current year QRE (wages + contract × sub_con%)
        const currentYearWages    = new Decimal(wages);
        const currentYearContract = new Decimal(contract).mul(config.sub_con_percent / 100);
        const currentYearQre      = currentYearWages.plus(currentYearContract);

        // Line 4 sub-lines — prior year QREs
        const prior1 = stateRdData.prior3YearsQREs?.[0];
        const prior2 = stateRdData.prior3YearsQREs?.[1];
        const prior3 = stateRdData.prior3YearsQREs?.[2];

        const priorYear1Qre = new Decimal(prior1?.qre ?? 0);
        const priorYear2Qre = new Decimal(prior2?.qre ?? 0);
        const priorYear3Qre = new Decimal(prior3?.qre ?? 0);

        const priorYear1Label = prior1?.fiscalYear ?? currentFiscalYear - 1;
        const priorYear2Label = prior2?.fiscalYear ?? currentFiscalYear - 2;
        const priorYear3Label = prior3?.fiscalYear ?? currentFiscalYear - 3;

        // Line 4 — base amount = sum ÷ 3
        const threeYearTotal = priorYear1Qre.plus(priorYear2Qre).plus(priorYear3Qre);
        const baseAmount     = threeYearTotal.div(3);

        // Line 5 — excess QRE
        const excessQre = Decimal.max(currentYearQre.minus(baseAmount), 0);

        // Line 6 — QRE credit
        const qreCredit = excessQre.mul(config.qre_credit_percentage / 100);

        return {
            currentYearWages:    this.round2(currentYearWages),
            currentYearContract: this.round2(currentYearContract),
            currentYearQre:      this.round2(currentYearQre),
            priorYear1Qre:       this.round2(priorYear1Qre),
            priorYear2Qre:       this.round2(priorYear2Qre),
            priorYear3Qre:       this.round2(priorYear3Qre),
            priorYear1Label,
            priorYear2Label,
            priorYear3Label,
            threeYearTotal:      this.round2(threeYearTotal),
            baseAmount:          this.round2(baseAmount),
            excessQre:           this.round2(excessQre),
            qreCredit:           this.round2(qreCredit),
            unusedCredit:        this.round2((caseDetails as any)?.credit_carry_forward_py_me ?? 0),
        };
    }

    // -------------------------------------------------------------------------
    // Input params builder
    // -------------------------------------------------------------------------
    private buildInputParams(
        currentYearQREs: QRE,
        prior3YearsQREs: QRE[],
        metadata: any = {},
        config: ConfigJson
    ) {
        const currentYearContract = new Decimal(currentYearQREs.contract ?? 0).mul(config.sub_con_percent / 100);

        const storeData: any[] = [
            {
                year:     metadata.currentYear,
                wages:    this.round2(currentYearQREs.wages),
                contract: this.round2(currentYearContract),
                sum:      this.round2(new Decimal(currentYearQREs.wages ?? 0).plus(currentYearContract)),
            },
        ];

        prior3YearsQREs.forEach(item => {
            storeData.push({
                year:     item.fiscalYear,
                wages:    item.wages,
                contract: item.contract,
                sum:      this.round2(new Decimal(item.wages ?? 0).plus(Number(item.contract ?? 0))),
            });
        });

        return {
            metadata: {
                country:             metadata.country    || "US",
                credit_type:         metadata.creditType || "STATE_RD_ME",
                currency:            metadata.currency   || "USD",
                "Fiscal Year Ended": metadata.fiscalYearEnded,
                "Description":       "Research Tax Credit",
                stateDetails:        "Maine - Credit Calculations",
            },
            "Current & Prior years information": storeData,
        };
    }

    // -------------------------------------------------------------------------
    // Computed fields builder — mirrors Maine Schedule A line layout
    // -------------------------------------------------------------------------
    private buildComputedFields(
        partA: ReturnType<RdCreditCalculatorForME["partA"]>,
        partB: ReturnType<RdCreditCalculatorForME["partB"]>,
        totalCredit: number,
        config: ConfigJson
    ) {
        return {
            computed_fields: {
                "Maine - Credit Calculations": {


                    "[1] Basic research payments in excess of the federal base spent for research conducted in Maine (Form 6765, Section A, line 13 or Section B, line 26). Line 1a minus Line 1b, not less than 0":
                        partA.basicResearchPayments,

                    [`[2] Basic research payments credit (multiply line 1 by ${config.basic_research_credit_rate}% (${config.basic_research_credit_rate / 100}))`]:
                        partA.basicResearchCredit,

                    "[3] Total qualified research expenses spent for research conducted in Maine included on federal Form 6765, Section A, line 5 or federal Form 6765, Section B, line 20":
                        partB.currentYearQre,

                    "[4] Total qualified research expenses applied to research conducted in Maine for the three previous tax years (for short tax years, see instructions). (divide by 3 = base amount)":
                        partB.baseAmount,

                    [`[4a] ${partB.priorYear1Label}`]: partB.priorYear1Qre,
                    [`[4b] ${partB.priorYear2Label}`]: partB.priorYear2Qre,
                    [`[4c] ${partB.priorYear3Label}`]: partB.priorYear3Qre,

                    "[5] Qualified research expenses in excess of base amount (line 3 minus line 4)":
                        partB.excessQre,

                    [`[6] Qualified research expense credit (multiply line 5 by  ${config.qre_credit_percentage}% (.0${config.qre_credit_percentage}).`]:
                        partB.qreCredit,

                    "[7] Carryforward from previous years. See instructions":
                        partB.unusedCredit,

                    [`[8] Total available credit (line 2 plus lines 6 and 7). Corporations: if amount is greater than ${config.tax_liablity_threshold_amount}, see instructions. Enter allowable credit amount on Form 1040ME, Schedule A, line 16; Form 1040C-ME, Schedule A, line 6; Form 1041ME, Schedule A, line 10; or Form 1120ME, Schedule C, line 1f`]:
                        totalCredit,
                },
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
