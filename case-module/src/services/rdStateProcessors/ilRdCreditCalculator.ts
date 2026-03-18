import { Decimal } from "decimal.js";
import { QRE, StateRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";


export interface ConfigJson {
    fixed_base_percentage: number;
    sub_con_percent: number;
}

export class RdCreditCalculatorForIL {

    country = "USA";
    creditType = "State R&D Credit - IL";
    currency = "USD";

    /**
     * 
     * @param config 
     * @param stateRdData 
     * @param totalGrossReceipts 
     * @param priorYearsCount 
     * @returns 
     */
    async compute(config: ConfigJson, stateRdData: StateRDData, fiscalYear : string, year : string, caseDetails? : Case) {
        const columnABasePeriodExpenseInfo = this.columnABasePeriodExpense(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, config, caseDetails!);
        const columnBCurrentYearExpenseInfo = this.columnBCurrentYearExpense(stateRdData.currentYearQREs, columnABasePeriodExpenseInfo.total_qres, config, caseDetails!);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
            fiscalYearEnded : fiscalYear,
            currentYear : year
        },config);

        const computedFields = await this.buildComputedFields(columnABasePeriodExpenseInfo, columnBCurrentYearExpenseInfo, caseDetails!, config);

        return {
            inputFields,
            computedFields,
            finalCredit: this.round2(columnBCurrentYearExpenseInfo.il_research_development_credit),
            totalQRE: this.round2(columnBCurrentYearExpenseInfo.total_qre),
            totalWages: this.round2(stateRdData.currentYearQREs.wages) || 0,
            totalContract: this.round2(stateRdData.currentYearQREs.contract) || 0,
            totalSupplies: this.round2(stateRdData.currentYearQREs.supplies) || 0
        }
    }

    /**
     * 
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @param config 
     * @returns 
     */
    columnABasePeriodExpense(currentYearQREs: QRE, prior3YearsQREs: QRE[], config: ConfigJson, caseData : Case) {

        //Prior Year wages
        const priorYear1Wages = new Decimal(prior3YearsQREs[0]?.wages ?? 0);
        const priorYear2Wages = new Decimal(prior3YearsQREs[1]?.wages ?? 0);
        const priorYear3Wages = new Decimal(prior3YearsQREs[2]?.wages ?? 0);


        //Prior Year Contract
        const priorYear1Contract = new Decimal(prior3YearsQREs[0]?.contract ?? 0);
        const priorYear2Contract = new Decimal(prior3YearsQREs[1]?.contract ?? 0);
        const priorYear3Contract = new Decimal(prior3YearsQREs[2]?.contract ?? 0);

        const total_prior_year_wages = priorYear1Wages.plus(priorYear2Wages).plus(priorYear3Wages);
        const average_prior_year_wages = total_prior_year_wages.div(3);

        const total_prior_year_contract = priorYear1Contract.plus(priorYear2Contract).plus(priorYear3Contract);
        const average_prior_year_contract = total_prior_year_contract.div(3);
        const cost_of_supplies = 0.00
        const lease_costs_of_computers = caseData.lease_costs_of_computers_il || 0.00

        const total_qres = average_prior_year_contract.plus(average_prior_year_wages).plus(cost_of_supplies).plus(lease_costs_of_computers);

        return {
            average_prior_year_wages: this.round2(average_prior_year_wages),
            average_prior_year_contract: this.round2(average_prior_year_contract),
            cost_of_supplies : cost_of_supplies,
            lease_costs_of_computers: lease_costs_of_computers,
            total_qres: this.round2(total_qres),
            llinois_research_payments_corp_only : caseData.llinois_research_payments_corp_only || 0.00
        }
    }

    /**
     * 
     * @param currentYearQREs 
     * @param final_total_qres_column_a 
     * @param config 
     * @returns 
     */
    columnBCurrentYearExpense(currentYearQREs: QRE, final_total_qres_column_a: number, config: ConfigJson, caseData : Case) {
        const current_year_wages = new Decimal(currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent/100) || 0;
        const cost_of_supplies = new Decimal(currentYearQREs.supplies || 0)
        const lease_costs_of_computers = caseData.lease_costs_of_computers_il || 0.00
        const llinois_research_payments_corp_only = caseData.llinois_research_payments_corp_only || 0.00

        //---Line 28 : D16
        const total_qre = current_year_wages.plus(current_year_contract).plus(cost_of_supplies || 0.00).plus(lease_costs_of_computers || 0.00).plus(llinois_research_payments_corp_only || 0.00);

        const excessQRE = new Decimal(total_qre.minus(final_total_qres_column_a));
        const final_excess_qre = new Decimal(excessQRE.gt(0) ? excessQRE : 0);

        const final_credit = final_excess_qre.mul(config.fixed_base_percentage/100);
        const illinois_rd_credit_partnership_corp = caseData.illinois_rd_credit_partnership_corp || 0.00
        const il_research_development_credit = final_credit.plus(illinois_rd_credit_partnership_corp)

        return {
            current_year_wages : this.round2(current_year_wages),
            current_year_contract : this.round2(current_year_contract),
            total_qre,
            final_excess_qre: this.round2(final_excess_qre),
            final_credit: this.round2(final_credit),
            illinois_rd_credit_partnership_corp : illinois_rd_credit_partnership_corp,
            il_research_development_credit : this.round2(il_research_development_credit),
            cost_of_supplies : cost_of_supplies,
            lease_costs_of_computers : lease_costs_of_computers,
            llinois_research_payments_corp_only : llinois_research_payments_corp_only,
           

        }
    }

    /**
     * 
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @param annualGrossReceipts 
     * @param metadata 
     * @returns 
     */
    async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], metadata: any = {},config : ConfigJson) {

        let storeData : any[] = []
        let currentYearContract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent/100) || 0;
        storeData.push({
            year : metadata.currentYear,
            wages: currentYearQREs.wages,
            contract: currentYearContract,
            sum: this.round2(new Decimal(currentYearQREs.wages || 0).plus(currentYearContract))
        })

        prior3YearsQREs.forEach((item) => {
            storeData.push({
                year : item.fiscalYear,
                wages: item.wages,
                contract: item.contract,
                sum: this.round2(new Decimal(item.wages || 0).plus(Number(item.contract || 0)))
            })
        });

        return {
            metadata: {
                country: metadata.country || "US",
                credit_type: metadata.creditType || "FEDERAL_RRC_ASC",
                currency: metadata.currency || "USD",
                "Fiscal Year Ended" : metadata.fiscalYearEnded,
                "Description": "Research Tax Credit",
                stateDetails : "IL Research and Development Tax Credit"
            },
            "Current & Prior years information" : storeData
        };
    }

    /**
     * 
     * @param columnABasePeriodExpenseInfo 
     * @param columnBCurrentYearExpenseInfo 
     * @returns 
     */
    buildComputedFields(columnABasePeriodExpenseInfo: any, columnBCurrentYearExpenseInfo: any, caseData : Case, config : ConfigJson) {
        return {
            "computed_fields" : [
            {
                "Column Name": "Column A",
                "SubColumn Name": `Base Period avg. expenses (${caseData.fiscal_year - 3}-${caseData.fiscal_year - 1})`,

                "[Line 23] Illinois wages for qualified services":
                    columnABasePeriodExpenseInfo.average_prior_year_wages,

                "[Line 24] Illinois cost of supplies":
                    this.round2(columnABasePeriodExpenseInfo.cost_of_supplies),

                "[Line 25] Illinois rental or lease costs of computers":
                    this.round2(columnABasePeriodExpenseInfo.lease_costs_of_computers),

                [`[Line 26] ${config.sub_con_percent}% of Illinois contract expenses`]:
                    columnABasePeriodExpenseInfo.average_prior_year_contract,

                "[Line 27] Illinois basic research payments to qualified organizations (corporations only)":
                    columnABasePeriodExpenseInfo.llinois_research_payments_corp_only,

                "[Line 28] Add lines 23 through 27 of each column. Total Illinois qualifying expenses":
                    columnABasePeriodExpenseInfo.total_qres,

                "[Line 29] Subtract Column A, Line 28 from Column B, Line 28. If negative, enter zero":
                    "",

                [`[Line 30] Multiply Line 29 by ${config.fixed_base_percentage}%`]:
                    "",

                "[Line 31] Enter any distributive share of R&D Credit from partnerships and S corporations":
                    "",

                "[Line 32] IL Research and Development Credit":
                    ""
                },
                {
                "Column Name": "Column B",
                "SubColumn Name": `${caseData.fiscal_year} Expenses`,

                "[Line 23] Illinois wages for qualified services":
                    columnBCurrentYearExpenseInfo.current_year_wages,

                "[Line 24] Illinois cost of supplies":
                    this.round2(columnBCurrentYearExpenseInfo.cost_of_supplies),

                "[Line 25] Illinois rental or lease costs of computers":
                    this.round2(columnBCurrentYearExpenseInfo.lease_costs_of_computers),

                [`[Line 26] ${config.sub_con_percent}% of Illinois contract expenses`]:
                    columnBCurrentYearExpenseInfo.current_year_contract,

                "[Line 27] Illinois basic research payments to qualified organizations (corporations only)":
                    columnBCurrentYearExpenseInfo.llinois_research_payments_corp_only,

                "[Line 28] Add lines 23 through 27 of each column. Total Illinois qualifying expenses":
                    this.round2(columnBCurrentYearExpenseInfo.total_qre) || 0.00,

                "[Line 29] Subtract Column A, Line 28 from Column B, Line 28. If negative, enter zero":
                    this.round2(columnBCurrentYearExpenseInfo.final_excess_qre) || 0.00,

                [`[Line 30] Multiply Line 29 by ${config.fixed_base_percentage}%`]:
                    columnBCurrentYearExpenseInfo.final_credit,

                "[Line 31] Enter any distributive share of R&D Credit from partnerships and S corporations":
                    columnBCurrentYearExpenseInfo.illinois_rd_credit_partnership_corp,

                "[Line 32] IL Research and Development Credit":
                    columnBCurrentYearExpenseInfo.il_research_development_credit
                }
            ]
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

}