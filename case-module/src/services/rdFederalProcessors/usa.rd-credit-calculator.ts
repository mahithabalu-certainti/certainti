import { HttpStatus, STATUS_MESSAGE } from "../../utils/constants";
import { logMessage } from "../../utils/helpers";
import { Decimal } from "decimal.js";
import { AnnualGrossReceipt, QRE, FederalRDData } from "../rdComputation/rdCreditTypes";
import { FederalMockDataLoadMap } from "../rdComputation/rdDataLoadMockService";

export interface ConfigJson {
    credit_rate: number;
    elect_280c_no: number;
    elect_280c_yes: number;
    sub_con_percent: number;
    fixed_base_percentage: number;
    qre_cap_rate: number;
}

export interface Splitconfig {
    asc: ConfigJson;
    rrc: ConfigJson;
}

/**
 * USA RD Credit Calculator
 */
export class RdCreditCalculatorForUSA {

    country = "USA";
    creditType = "Federal R&D Credit - USA";
    currency = "USD";

    /**
     * 
     * @param accountRid 
     * @param caseRid 
     * @returns 
     */
    async compute(config: any, federalRdData: FederalRDData) {
        try {
            const { asc, rrc } = this.splitAscRrcConfig(config);
            logMessage(`Extracted ASC Config: ${JSON.stringify(asc)}`);
            logMessage(`Extracted RRC Config: ${JSON.stringify(rrc)}`);
            const totalCurrentYearQRE = new Decimal(federalRdData.currentYearQREs.wages || 0).plus(federalRdData.currentYearQREs.supplies || 0).plus(federalRdData.currentYearQREs.contract || 0);
            logMessage(`CurrentYearQREs: ${JSON.stringify(federalRdData.currentYearQREs)}`);

            const totalGrossReceipts = new Decimal((federalRdData.annualGrossReceipts || []).reduce(
                (sum, r) => sum + (r.grossReceipts || 0), 0));
            logMessage(`AnnualGrossReceipts: ${JSON.stringify(federalRdData.annualGrossReceipts)}`);

            const extractConfigAsc = asc;
            const creditASC = await this.calculateASC(totalCurrentYearQRE, federalRdData.prior3YearsQREs, extractConfigAsc);
            const asc280C = await this.apply280C_ASC(creditASC, extractConfigAsc);

            const extractConfigRRC = rrc;
            const creditRRC = await this.calculateRRC(totalCurrentYearQRE, totalGrossReceipts, extractConfigRRC, 4);
            const rrc280C = await this.apply280C_RRC(creditRRC, extractConfigRRC);

            const inputFields = await this.buildInputParams(federalRdData.currentYearQREs, federalRdData.prior3YearsQREs, federalRdData.annualGrossReceipts || [], {
                country: this.country,
                creditType: this.creditType,
                currency: this.currency,
            });
            logMessage(`Input Fields: ${JSON.stringify(inputFields)}`);
            let taxCredit;
            if(Number(rrc280C.reduction280c.no_elect280c["Multiply line 11 (if line 13 is No)"]) > Number(asc280C.reduction280c.no_elect280c["Multiply line 20 (equals line 25 if line 26 is No)"])) {
                taxCredit = Number(rrc280C.reduction280c.no_elect280c["Multiply line 11 (if line 13 is No)"])
            } else {
                taxCredit = Number(asc280C.reduction280c.no_elect280c["Multiply line 20 (equals line 25 if line 26 is No)"])
            }

            const computedFields = await this.buildComputedFields(creditASC, creditRRC, asc280C, rrc280C, taxCredit);

            // Step 4: Return success response
            return {
                inputFields,
                computedFields
            }
        } catch (error) {
            logMessage(`Error fetching RD Credit : ${error}`);

            return {
                statusCode: HttpStatus.FAILED,
                message: HttpStatus.FAILED_MESSAGE,
                errorMessage: STATUS_MESSAGE.jurisdictionFetchedFailed || "Failed to fetch",
            };
        }
    }

    /**
     * 
     * @param totalQRE 
     * @param prior3YearsQREs 
     * @param configAsc 
     * @returns 
     */
    async calculateASC(totalQRE: Decimal, prior3YearsQREs: QRE[], configAsc: ConfigJson) {
        logMessage(`Calculating ASC with totalQRE: ${totalQRE}, prior3YearsQREs: ${JSON.stringify(prior3YearsQREs)}, configAsc: ${JSON.stringify(configAsc)}`);
        // ---- Line 21: Prior 3 years QRE total ----
        const line21 = new Decimal(prior3YearsQREs.reduce((sum, y) => sum + (y.qre || 0), 0));

        // ---- Line 22: Divide line 21 by 6 ----
        const line22 = await this.round2(line21.div(6));

        // ---- Line 23: Subtract line 22 from line 20 ----
        const line23 = await this.round2(totalQRE.minus(line22));

        // ---- Line (14% or 6%) if any prior year QRE = zero ----
        const hadZeroYear = prior3YearsQREs.some(y => y.qre === 0);

        // IRS rule: If any year has zero → use 6%, else → 14%
        const percentage = hadZeroYear ? configAsc.fixed_base_percentage : configAsc.credit_rate;

        // ---- Line 24: Multiply line 23 by percentage ----
        const line24 = await this.round2(line23.mul(percentage));

        // ---- Line 25: (ASC Base Credit) ----
        const line25 = line24; // because you don’t have line19 in ASC

        return {
            "Total Qualified Research Expenses": Number(totalQRE),
            "Total QREs for prior 3 tax years": Number(line21),
            "Divide line 21 by 6.0": Number(line22),
            "Subtract line 22 from line 20": Number(line23),
            "Multiply line 23 by the percentage above": Number(line24),
            "Add lines 19 and 24": Number(line25),
            final_credit: Number(line25),
            "Enter 14%. If QREs in any of the 3 years is zero, enter 6%": `${percentage}%`
        };
    }

    /**
     * 
     * @param currentYearQRE 
     * @param prior4YearsGrossReceiptsTotal 
     * @param configRRC 
     * @param priorYearsCount 
     * @returns 
     */
    async calculateRRC(currentYearQRE: Decimal, prior4YearsGrossReceiptsTotal: Decimal, configRRC: ConfigJson, priorYearsCount: number) {
        logMessage(`Calculating RRC with currentYearQRE: ${currentYearQRE}, prior4YearsGrossReceiptsTotal: ${prior4YearsGrossReceiptsTotal}, configRRC: ${JSON.stringify(configRRC)}, priorYearsCount: ${priorYearsCount}`);
        // Expected: fixedBasePercentage between 0.16
        //---- Line 5: currentYearQRE
        //---- Line 6: fixedBasePercentage

        //---- Line 7: Average Gross Receipts
        const line7 = prior4YearsGrossReceiptsTotal.div(priorYearsCount); // usually 4

        //---- Line 8: Multiply line 7 by percentage on line 6 (configRRC.fixedBasePercentage)
        const line8 = line7.mul(new Decimal(configRRC.fixed_base_percentage));

        //---- Line 9: Subtract line 8 from line 5
        const line9 = currentYearQRE.minus(line8)

        //---- Line 10: Multiply line 5 by 50%
        const line10 = currentYearQRE.mul(configRRC.qre_cap_rate || 0.5);

        //---- Line 11: Enter smaller of line 9 or line 10
        const line11 = Decimal.min(line10, line9);
        let dynamicLine5 = `Multiply line 5 by ${configRRC.qre_cap_rate}`

        return {
            "Total Qualified Research Expenses": Number(currentYearQRE),
            "Fixed-base percentage": `${configRRC.fixed_base_percentage}%`,
            "Average Annual Gross Receipts": Number(line7),
            "Multiply line 7 by percentage on line 6": Number(line8),
            "Subtract line 8 from line 5": Number(line9),
            [dynamicLine5]: Number(line10),
            "Enter smaller of line 9 or line 10": Number(line11),
            final_credit: Number(line11)
        };
    }

    /**
     * 
     * @param creditRRC 
     * @param configRRC 
     * @returns 
     */
    async apply280C_RRC(creditRRC: any, configRRC: ConfigJson) {
        // ASC Federal 280C reduction rules
        const rateWhenElect = configRRC.elect_280c_yes/100;  // elect 280C
        const rateWhenNoElect = configRRC.elect_280c_no/100; // do not elect 280C

        const creditElect = creditRRC.final_credit.mul(rateWhenElect);
        const creditNoElect = creditRRC.final_credit.mul(rateWhenNoElect);

        return {
            reduction280c: {
                elect280c: {
                    "Electing reduced credit under 280C": rateWhenElect,
                    "Multiply line 11 (if line 13 is No)": Number(await this.round2(creditElect))
                },
                no_elect280c: {
                    "Electing reduced credit under 280C": rateWhenNoElect,
                    "Multiply line 11 (if line 13 is No)":  Number(await this.round2(creditNoElect))
                }
            }
        };
    }

    /**
     * 
     * @param creditASC 
     * @param configASC 
     * @returns 
     */
    async apply280C_ASC(creditASC: any, configASC: ConfigJson) {
        // Federal RRC 280C reduction factors
        const factorElect = configASC.elect_280c_yes/100;   // elect 280C → reduced credit
        const factorNoElect = configASC.elect_280c_no; // no election → full credit

        const creditElect = creditASC.final_credit.mul(factorElect);
        const creditNoElect = creditASC.final_credit
        return {
            reduction280c: {
                elect280c: {
                    "Electing reduced credit under 280C": factorElect,
                    "Multiply line 20 (equals line 25 if line 26 is No)": Number(await this.round2(creditElect))
                },
                no_elect280c: {
                    "Electing reduced credit under 280C": factorNoElect,
                    "Multiply line 20 (equals line 25 if line 26 is No)": Number(await this.round2(creditNoElect))
                }
            }
        };
    }

    /**
     * 
     * @param value 
     * @returns 
     */
    async round2(value: Decimal | number): Promise<Decimal> {
        return new Decimal(value).toDecimalPlaces(2);
    }

    /**
     * 
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @param annualGrossReceipts 
     * @param metadata 
     * @returns 
     */
    async buildInputParams(currentYearQREs: QRE, prior3YearsQREs: QRE[], annualGrossReceipts: AnnualGrossReceipt[], metadata: any = {}) {

        const qreSummary: Record<string, any> = {
            wages: currentYearQREs.wages,
            supplies: currentYearQREs.supplies,
            contract_65: currentYearQREs.contract
        };

        // Add prior 3 years QREs
        prior3YearsQREs.forEach((item, i) => {
            qreSummary[`prior_year_qre_${i + 1}`] = item.qre || 0;
        });

        // Add prior 4 years gross receipts
        annualGrossReceipts.forEach((item, i) => {
            qreSummary[`prior_year_gross_receipts_${i + 1}`] = item.grossReceipts || 0;
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
     * @param creditASC 
     * @param creditRRC 
     * @param asc280C 
     * @param rrc280C 
     * @returns 
     */
    async buildComputedFields(creditASC: any, creditRRC: any, asc280C: any, rrc280C: any, taxCredit: any) {
        return {
            "ASC Credit": { creditASC, asc280C },
            "Regular Credit": { creditRRC, rrc280C },
            "Research and Development Tax Credit" : taxCredit
        }
    }

    /**
     * 
     * @param configJson 
     * @returns 
     */
    extractConfigJson(configJson: any): ConfigJson {
        // If it's already an object, just return it
        if (typeof configJson === 'object') {
            return configJson as ConfigJson;
        }

        // If it's a string, parse it
        try {
            return JSON.parse(configJson) as ConfigJson;
        } catch (error) {
            console.error('Failed to parse config_json:', error);
            return {} as ConfigJson; // fallback
        }
    }

    /**
     * Gets the current fiscal year.
     * @param date 
     * @returns 
     */
    getCurrentFiscalYear(date: Date = new Date()): number {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12

        // Fiscal year starts in April
        return month >= 4 ? year : year - 1;
    }

    /**
     * 
     * @param config 
     * @returns 
     */
    splitAscRrcConfig(config: Record<string, number>): Splitconfig {
        const result = Object.entries(config).reduce<{
            asc: Partial<ConfigJson>;
            rrc: Partial<ConfigJson>;
        }>(
            (acc, [key, value]) => {
                if (key.startsWith("asc_")) {
                    const cleanKey = key.replace("asc_", "") as keyof ConfigJson;
                    acc.asc[cleanKey] = value;
                } else if (key.startsWith("rrc_")) {
                    const cleanKey = key.replace("rrc_", "") as keyof ConfigJson;
                    acc.rrc[cleanKey] = value;
                }
                return acc;
            },
            { asc: {}, rrc: {} }
        );

        return {
            asc: result.asc as ConfigJson,
            rrc: result.rrc as ConfigJson
        };
    }

}

export default RdCreditCalculatorForUSA;