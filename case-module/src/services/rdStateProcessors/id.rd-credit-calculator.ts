import { Decimal } from "decimal.js";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";

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
    async compute(config: ConfigJson, stateRdData: StateRDData, fiscalYear : string) {
        const qreCalInfo = this.qreCreditCalculation(stateRdData.currentYearQREs, config);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear
        });

        const computedFields = await this.buildComputedFields(qreCalInfo,config);

        return {
            inputFields,
            computedFields
        }
    }

    /**
     * 
     * @param currentYearQREs 
     * @param config 
     */
    qreCreditCalculation(currentYearQREs: QRE, config: ConfigJson) {
        const current_year_wages = new Decimal(currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent) || 0;

        const supplies = 0;
        const cost_to_rent = 0;

        const total_current_year_qre = current_year_wages.plus(current_year_contract);
        const fixed_base_percentage = config.fixed_base_percentage * 100;
        const average_annual_gross_receipts = 0;
        const base_amount = new Decimal(0);
        const difference = total_current_year_qre.minus(base_amount);
        const credit_rate_percent = total_current_year_qre.mul(config.credit_rate).div(100);
        const min_credit_rate = Decimal.min(difference, credit_rate_percent);
        const tot_base_amount = base_amount.plus(min_credit_rate);
        const credit_earned = tot_base_amount.mul(config.credit_earned);
        const final_credit = credit_earned;
        const tot_credit_avail = final_credit;

        return {
            current_year_wages,
            current_year_contract,
            total_current_year_qre,
            fixed_base_percentage,
            difference,
            credit_rate_percent,
            min_credit_rate,
            tot_base_amount,
            credit_earned,
            final_credit,
            tot_credit_avail
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
    async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], metadata: any = {}) {

        let storeData : any[] = []
        storeData.push({
            year : metadata.currentYear,
            wages: currentYearQREs.wages,
            supplies: currentYearQREs.supplies,
            contract: currentYearQREs.contract
        })
 
        prior3YearsQREs.forEach((item) => {
            storeData.push({
                year : item.fiscalYear,
                wages: item.wages,
                contract: item.contract,
                sum: new Decimal(item.wages || 0).plus(Number(item.contract || 0))
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
            "1 Basic research payments paid or incurred during the tax year to qualiﬁed organizations":"",
            "2 Qualiﬁed organization base period amount":"",
            "3 Subtract line 2 from line 1. If less than zero, enter zero":""
        }
        let part2 = {
            "4 Wages for qualiﬁed services performed in Idaho":qretInfo.current_year_wages,
            "5 Cost of supplies used in Idaho"  :"",
            "6 Rental or lease costs of computers in Idaho":"",
            "7 Enter the applicable percentage of contract research expenses":qretInfo.current_year_contract,
            "8 Total qualiﬁed research expenses for research conducted in Idaho. Add lines 4 through 7 ":qretInfo.total_current_year_qre,
            "9 Enter ﬁxed-base percentage, but not more than 16%, from page 2, Part A or B":qretInfo.fixed_base_percentage,
            "10 Enter average annual Idaho gross receipts from page 2, Part C":"",
            "11 Base amount. Multiply line 10 by the percentage on line 9":"",
            "12 Subtract line 11 from line 8. If zero or less, enter zero":qretInfo.difference,
            [`13 Multiply line 8 by $${config.credit_rate_percent} %`]:qretInfo.credit_rate_percent,
            "14 Enter the smaller amount from line 12 or line 13":qretInfo.min_credit_rate,
            "15 Add lines 3 and 14 ":qretInfo.tot_base_amount,
            [`16 Credit earned. Multiply line 15 by ${config.credit_earned} % `]:qretInfo.credit_earned,
            "17 Pass-through share of credit from an S corporation, partnership, trust, or estate":"",
            "18 Credit received through unitary sharing. Include a schedule":"",
            "19 Carryover of credit for Idaho research activities from prior years":"",
            "20 Credit distributed to shareholders, partners, or beneﬁciaries":"",
            "21 Credit shared with unitary aﬃliates":"",
            "22 Total credit available subject to limitations. Add lines 16 through 19,then subtract lines 20 and 21":qretInfo.final_credit,
            "23 Enter the Idaho income tax from your tax return":"",
            "24.a Credit for income tax paid to other states ":"",
            "24.b Part-year resident grocery credit ":"",
            "24.c Credit for contributions to Idaho educational entities":"",
            "24.d Investment tax credit":"",
            "24.e Credit for contributions to Idaho youth and rehabilitation facilities":"",
            "24.f Credit for production equipment using post-consumer waste":"",
            "24.g Promoter-sponsored event credit ":"",
            "24.h Add lines 24a through 24g ":"",
            "25 Net income tax after allowance of other credits. Subtract line 24h from line 23":"",
            "26 Total credit available subject to limitations. Enter the amount from line 22":qretInfo.tot_credit_avail,
            "27 Credit for Idaho research activities allowed. Enter the smaller amount from line 25 or line 26 here and on Form 44, Part I, line 4":""



        }
        return {
            computed_fields: {
                "Basic Research Payments. Only corporations complete lines 1 through 3":part1,
                "Qualiﬁed Research Expenses Paid or Incurred for Research Conducted in Idaho":part2
            }
        }
    }
}