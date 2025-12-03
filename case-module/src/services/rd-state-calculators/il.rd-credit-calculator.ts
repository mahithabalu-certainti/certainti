import { Decimal } from "decimal.js";
import { QRE, StateRDData } from "../financialRDCredit/rdCreditTypes";


export interface ConfigJson {
    credit_rate: number;
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
     * To load mock Data : stateRdData = StateMockDataLoadMap["IL"]!;
     * @returns 
     */
    async compute(config: ConfigJson, stateRdData: StateRDData) {
        const columnABasePeriodExpenseInfo = this.columnABasePeriodExpense(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, config);
        const columnBCurrentYearExpenseInfo = this.columnBCurrentYearExpense(stateRdData.currentYearQREs, columnABasePeriodExpenseInfo.total_qres, config);

        const inputFields = await this.buildInputParams(stateRdData.currentYearQREs, stateRdData.prior3YearsQREs, {
            country: this.country,
            creditType: this.creditType,
            currency: this.currency,
        });

        const computedFields = await this.buildComputedFields(columnABasePeriodExpenseInfo, columnBCurrentYearExpenseInfo);

        return {
            inputFields,
            computedFields
        }
    }

    /**
     * 
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @param config 
     * @returns 
     */
    columnABasePeriodExpense(currentYearQREs: QRE, prior3YearsQREs: QRE[], config: ConfigJson) {

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

        const total_qres = average_prior_year_contract.plus(average_prior_year_wages);

        return {
            average_prior_year_wages: this.round2(average_prior_year_wages).toNumber(),
            average_prior_year_contract: this.round2(average_prior_year_contract).toNumber(),
            total_qres: this.round2(total_qres).toNumber(),
        }
    }

    /**
     * 
     * @param currentYearQREs 
     * @param final_total_qres_column_a 
     * @param config 
     * @returns 
     */
    columnBCurrentYearExpense(currentYearQREs: QRE, final_total_qres_column_a: number, config: ConfigJson) {
        const current_year_wages = new Decimal(currentYearQREs.wages || 0);
        const current_year_contract = new Decimal(currentYearQREs.contract || 0).mul(config.sub_con_percent) || 0;

        //---Line 28 : D16
        const total_qre = current_year_wages.plus(current_year_contract);

        const excessQRE = new Decimal(total_qre.minus(final_total_qres_column_a));
        const final_excess_qre = new Decimal(excessQRE.gt(0) ? excessQRE : 0);

        const final_credit = final_excess_qre.mul(config.credit_rate);

        return {
            current_year_wages,
            current_year_contract,
            total_qre,
            final_excess_qre: this.round2(final_excess_qre).toNumber(),
            final_credit: this.round2(final_credit).toNumber()
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
    async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], metadata: any = {}) {

        const qreSummary: Record<string, any> = {
            wages: currentYearQREs.wages,
            supplies: currentYearQREs.supplies,
            contract: currentYearQREs.contract
        };

        // Add prior 3 years QREs
        prior3YearsQREs.forEach((item, i) => {
            qreSummary[`prior_year_qre_wages_${i + 1}`] = item.wages || 0;
        });

        prior3YearsQREs.forEach((item, i) => {
            qreSummary[`prior_year_qre_contract_${i + 1}`] = item.contract || 0;
        });


        return {
            metadata: {
                country: metadata.country || "US",
                credit_type: metadata.creditType || "FEDERAL_RRC_ASC",
                currency: metadata.currency || "USD",
            },
            qreSummary
        };
    }

    /**
     * 
     * @param columnABasePeriodExpenseInfo 
     * @param columnBCurrentYearExpenseInfo 
     * @returns 
     */
    buildComputedFields(columnABasePeriodExpenseInfo: any, columnBCurrentYearExpenseInfo: any) {
        return {
            column_a: columnABasePeriodExpenseInfo,
            column_b: columnBCurrentYearExpenseInfo
        }

    }

    /**
    * 
    * @param value 
    * @returns 
    */
    round2(value: Decimal | number): Decimal {
        return new Decimal(value).toDecimalPlaces(2);
    }

}