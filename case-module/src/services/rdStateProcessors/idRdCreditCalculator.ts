import { Decimal } from "decimal.js";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

export interface ConfigJson {
    sub_con_percent: number;
    credit_rate: number;
    fixed_base_percentage: number;
    credit_earned: number;
}

/**
 * 
 */
export class RdCreditCalculatorForID {

    country = "USA";
    creditType = "State R&D Credit - ID";
    currency = "USD";

    /**
     * 
     * @param config 
     * @param currentYearQREs 
     * @param annualGrossReceipts 
     * @param totalGrossReceipts 
     * @param prior3YearsQREs 
     * @param priorYearsCount 
     */
    async compute(config: ConfigJson, stateRdData: StateRDData, fiscalYear : string,year: string,caseDetails? : Case) {
        const priorYearsCount = (stateRdData.annualGrossReceipts || []).length;
        const totalGrossReceipts = new Decimal((stateRdData.annualGrossReceipts || []).reduce(
            (sum, r) => sum + (r.grossReceipts || 0), 0));
        const qreCalInfo = this.qreCreditCalculation(stateRdData.currentYearQREs, config,totalGrossReceipts, priorYearsCount,caseDetails);
        
        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear : year
        },config);

        const computedFields = await this.buildComputedFields(qreCalInfo,config);

        return {
            inputFields,
            computedFields,
            finalCredit: this.round2(qreCalInfo.final_credit)
        }
    }

    /**
     * 
     * @param currentYearQREs 
     * @param config 
     */
    qreCreditCalculation(currentYearQREs: QRE, config: ConfigJson, totalGrossReceipts: Decimal, priorYearsCount: number,caseDetails: Case | undefined,) {
        const current_year_wages = new Decimal(currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent) || 0;
        const basic_research_payments = new Decimal(caseDetails?.basic_research_payments || 0);
        const qualified_organization_base_period_amount = new Decimal(0);
        const line_3 = Decimal.max(0, basic_research_payments.minus(qualified_organization_base_period_amount));
        const supplies = new Decimal(currentYearQREs.supplies || 0);
        const cost_to_rent = new Decimal(caseDetails?.lease_costs_of_computers || 0.00);
        const total_current_year_qre = current_year_wages.plus(current_year_contract).plus(cost_to_rent).plus(supplies);
        const fixed_base_percentage = config.fixed_base_percentage;
        const average_annual_gross_receipts = priorYearsCount > 0 ? totalGrossReceipts.div(priorYearsCount) : new Decimal(0);
        const base_amount = average_annual_gross_receipts.mul(config.fixed_base_percentage /100);
        const difference = Decimal.max(0, base_amount.minus(total_current_year_qre));
        const credit_rate_percent = total_current_year_qre.mul(config.credit_rate).div(100);
        const min_credit_rate = Decimal.min(difference, credit_rate_percent);
        const tot_base_amount = min_credit_rate.plus(line_3);
        const credit_earned = tot_base_amount.mul(config.credit_earned /100);
        const final_credit = credit_earned;
        const tot_credit_avail = final_credit;

        return {
            current_year_wages,
            cost_to_rent,
            current_year_contract,
            total_current_year_qre,
            fixed_base_percentage,
            average_annual_gross_receipts,
            base_amount,
            difference,
            credit_rate_percent,
            min_credit_rate,
            tot_base_amount,
            credit_earned,
            final_credit,
            tot_credit_avail,
            supplies,
            basic_research_payments,
            line_3
        }

    }

    /**
    * 
    * @param value 
    * @returns 
    */
    round2(value: any) {
    if (value === null || value === undefined) return value;

    // ✅ Handle Decimal.js instances
    if (Decimal.isDecimal(value)) {
        return value.toDecimalPlaces(2).toNumber();
    }

    // Handle numbers / numeric strings
    if (typeof value === "number" || typeof value === "string") {
        return new Decimal(value).toDecimalPlaces(2).toNumber();
    }

    return value;
}

    /**
     * 
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @param metadata 
     * @returns 
     */
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
                credit_type: metadata.creditType || "FEDERAL_RRC_ASC",
                currency: metadata.currency || "USD",
                "Fiscal Year Ended" : metadata.fiscalYearEnded,
                "Description": "Research Tax Credit",
                stateDetails : "Idaho - Credit Calculations"
            },
            "Current & Prior years information" : storeData
        };
    }

    /**
     * 
     * @param part4ASCCreditCalculationInfo 
     * @param part5DevelopmentTaxCreditCalculationInfo 
     * @returns 
     */
    buildComputedFields(qretInfo: any, config: any) {
        let part1 = {
            "[1] Basic research payments paid or incurred during the tax year to qualified organizations": qretInfo.basic_research_payments,
            "[2] Qualified organization base period amount": "0",
            "[3] Subtract line 2 from line 1. If less than zero, enter zero": qretInfo.line_3
        };

        let part2 = {
        "[4] Wages for qualified services performed in Idaho": qretInfo.current_year_wages,
        "[5] Cost of supplies used in Idaho": qretInfo.supplies || "",
        "[6] Rental or lease costs of computers in Idaho": qretInfo.cost_to_rent,
        "[7] Enter the applicable percentage of contract research expenses": qretInfo.current_year_contract,
        "[8] Total qualified research expenses for research conducted in Idaho. Add lines 4 through 7": qretInfo.total_current_year_qre,
        "[9] Enter fixed-base percentage, but not more than 16%, from page 2, Part A or B": `${qretInfo.fixed_base_percentage}%`,
        "[10] Enter average annual Idaho gross receipts from page 2, Part C": qretInfo.average_annual_gross_receipts,
        "[11] Base amount. Multiply line 10 by the percentage on line 9": qretInfo.base_amount,
        "[12] Subtract line 11 from line 8. If zero or less, enter zero": qretInfo.difference,
        [`[13] Multiply line 8 by ${config.credit_rate || 0}%`]: qretInfo.credit_rate_percent,
        "[14] Enter the smaller amount from line 12 or line 13": qretInfo.min_credit_rate,
        "[15] Add lines 3 and 14": qretInfo.tot_base_amount,
        [`[16] Credit earned. Multiply line 15 by ${config.credit_earned}%`]: qretInfo.credit_earned,

        "[17] Pass-through share of credit from an S corporation, partnership, trust, or estate": "",
        "[18] Credit received through unitary sharing. Include a schedule": "",
        "[19] Carryover of credit for Idaho research activities from prior years": "",
        "[20] Credit distributed to shareholders, partners, or beneficiaries": "",
        "[21] Credit shared with unitary affiliates": "",

        "[22] Total credit available subject to limitations. Add lines 16 through 19, then subtract lines 20 and 21": qretInfo.final_credit,
        "[23] Enter the Idaho income tax from your tax return": "",

        "[24 a] Credit for income tax paid to other states": "",
        "[b] Part-year resident grocery credit": "",
        "[c] Credit for contributions to Idaho educational entities": "",
        "[d] Investment tax credit": "",
        "[e] Credit for contributions to Idaho youth and rehabilitation facilities": "",
        "[f] Credit for production equipment using post-consumer waste": "",
        "[g] Promoter-sponsored event credit": "",
        "[h] Add lines 24a through 24g": "",

        "[25] Net income tax after allowance of other credits. Subtract line 24h from line 23": "",
        "[26] Total credit available subject to limitations. Enter the amount from line 22": qretInfo.tot_credit_avail,
        "[27] Credit for Idaho research activities allowed. Enter the smaller amount from line 25 or line 26 here and on Form 44, Part I, line 4": ""
        };

        return {
            computed_fields: {
                "Basic Research Payments. Only corporations complete lines 1 through 3":part1,
                "Qualiﬁed Research Expenses Paid or Incurred for Research Conducted in Idaho":part2
            }
        }
    }
}