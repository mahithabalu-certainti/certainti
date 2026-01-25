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
    async compute(config: any, federalRdData: FederalRDData, annualGrossReceiptsCount : number, date? : string) {
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
            const creditRRC = await this.calculateRRC(totalCurrentYearQRE, totalGrossReceipts, extractConfigRRC, annualGrossReceiptsCount);
            const rrc280C = await this.apply280C_RRC(creditRRC, extractConfigRRC);

            const inputFields = await this.buildInputParams(federalRdData.currentYearQREs, federalRdData.prior3YearsQREs, federalRdData.annualGrossReceipts || [], {
                country: this.country,
                creditType: this.creditType,
                currency: this.currency,
                fiscalYearEnded : date,
            });
            logMessage(`Input Fields: ${JSON.stringify(inputFields)}`);
            let taxCredit;
            const rrcValue = this.getMultiplyValue(rrc280C.reduction280c.no_elect280c);
            const ascValue = this.getMultiplyValue(asc280C.reduction280c.no_elect280c);

            taxCredit = rrcValue! > ascValue! ? rrcValue : ascValue;

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
        const line23 = new Decimal(await this.round2(totalQRE.minus(line22)));

        // ---- Line (14% or 6%) if any prior year QRE = zero ----
        const hadZeroYear = prior3YearsQREs.some(y => y.qre === 0);

        // IRS rule: If any year has zero → use 6%, else → 14%
        const percentage = hadZeroYear ? configAsc.fixed_base_percentage : configAsc.credit_rate;

        // ---- Line 24: Multiply line 23 by percentage ----
        const line24 = await this.round2(line23.mul(percentage));

        // ---- Line 25: (ASC Base Credit) ----
        const line25 = line24; // because you don’t have line19 in ASC
        let dynamicPercentageKey = `Enter ${configAsc.credit_rate}%. If QREs in any of the 3 years is zero, enter ${configAsc.fixed_base_percentage}%`

        return {
            "20 Total Qualified Research Expenses": Number(await this.round2(totalQRE)),
            "21 Total QREs for prior 3 tax years": Number(await this.round2(line21)),
            "22 Divide line 21 by 6.0": Number(await this.round2(line22)),
            "23 Subtract line 22 from line 20": Number(await this.round2(line23)),
            [dynamicPercentageKey]: `${percentage}%`,
            "24 Multiply line 23 by the percentage above": Number(await this.round2(line24)),
            "25 Add lines 19 and 24": Number(await this.round2(line25)),
            final_credit: line25,
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
        const line8 = line7.mul(new Decimal(configRRC.fixed_base_percentage/100));

        //---- Line 9: Subtract line 8 from line 5
        const line9 = currentYearQRE.minus(line8)

        //---- Line 10: Multiply line 5 by 50%
        const line10 = currentYearQRE.mul(configRRC.qre_cap_rate || 0.5);

        //---- Line 11: Enter smaller of line 9 or line 10
        const line11 = Decimal.min(line10, line9);
        let dynamicLine5 = `10 Multiply line 5 by ${configRRC.qre_cap_rate}`

        return {
            "5 Total Qualified Research Expenses": Number(await this.round2(currentYearQRE)),
            "6 Fixed-base percentage": `${configRRC.fixed_base_percentage}%`,
            "7 Average Annual Gross Receipts": Number(await this.round2(line7)),
            "8 Multiply line 7 by percentage on line 6": Number(await this.round2(line8)),
            "9 Subtract line 8 from line 5": Number(await this.round2(line9)),
            [dynamicLine5]: Number(await this.round2(line10)),
            "11 Enter smaller of line 9 or line 10": Number(await this.round2(line11)),
            final_credit: line11
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
        const rateWhenElect = configRRC.elect_280c_yes/100;
        const rateWhenNoElect = configRRC.elect_280c_no/100; // do not elect 280C

        const creditNoElect = creditRRC.final_credit.mul(rateWhenNoElect);
        let dynamicRRC280CKey = `Multiply line 11 by ${configRRC.elect_280c_no}% (by ${configRRC.elect_280c_yes}% if line 13 is No)`;

        return {
            reduction280c: {
                no_elect280c: {
                    "13 Electing reduced credit under 280C": "NO",
                    [dynamicRRC280CKey]:  Number(await this.round2(creditNoElect))
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

        const creditNoElect = creditASC.final_credit
        let dynamicRRC280CKey = `Multiply line 20 by ${configASC.elect_280c_yes}% (equals line 25 if line 26 is No)`
        return {
            reduction280c: {
                no_elect280c: {
                    "26 Electing reduced credit under 280C": "NO",
                    [dynamicRRC280CKey]: Number(await this.round2(creditNoElect))
                }
            }
        };
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
                "For the Year Ended" : metadata.fiscalYearEnded,
                "Descriptions" : "Research Tax Credit",
                "Tax Year Ended:" : metadata.fiscalYearEnded

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

    getMultiplyValue(noElect: Record<string, string | number>): number | undefined {
    const key = Object.keys(noElect).find(k =>
        k.startsWith("Multiply line")
    );

    const value = key ? noElect[key] : undefined;
    return typeof value === "number" ? value : undefined;
    }


}

export default RdCreditCalculatorForUSA;