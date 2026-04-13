import { HttpStatus, STATUS_MESSAGE } from "../../utils/constants";
import { logMessage } from "../../utils/helpers";
import { Decimal } from "decimal.js";
import { AnnualGrossReceipt, QRE, FederalRDData } from "../rdComputation/rdCreditTypes";
import { Case } from "../../models/caseModel";

export interface ConfigJson {
    credit_rate: number;
    elect_280c_no: number;
    elect_280c_yes: number;
    sub_con_percent: number;
    fixed_base_percentage: number;
    rrc_qre_credit_percentage: number;
    credit_rate_c1: number;
    credit_rate_c2: number;
    qre_credit_percentage: number;
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
    async compute(config: any, federalRdData: FederalRDData, annualGrossReceiptsCount : number, date : string, caseDetails : Case) {
        try {
            const { asc, rrc } = this.splitAscRrcConfig(config);
            logMessage(`Extracted ASC Config: ${JSON.stringify(asc)}`);
            logMessage(`Extracted RRC Config: ${JSON.stringify(rrc)}`);
            const contract = new Decimal(federalRdData.currentYearQREs.contract || 0).mul(config.rrc_sub_con_percent/100)
            federalRdData.currentYearQREs.contract = contract.toNumber()
            const totalCurrentYearQRE = new Decimal(federalRdData.currentYearQREs.wages || 0).plus(federalRdData.currentYearQREs.supplies || 0).plus(contract || 0);
            logMessage(`CurrentYearQREs: ${JSON.stringify(federalRdData.currentYearQREs)}`);

            const totalGrossReceipts = new Decimal((federalRdData.annualGrossReceipts || []).reduce(
                (sum, r) => sum + (r.grossReceipts || 0), 0));
            logMessage(`AnnualGrossReceipts: ${JSON.stringify(federalRdData.annualGrossReceipts)}`);

            const extractConfigAsc = asc;
            const creditASC = await this.calculateASC(totalCurrentYearQRE, federalRdData.prior3YearsQREs, extractConfigAsc);
            const asc280C = await this.apply280C_ASC(creditASC, extractConfigAsc, caseDetails);

            const extractConfigRRC = rrc;
            const creditRRC = await this.calculateRRC(totalCurrentYearQRE, totalGrossReceipts, extractConfigRRC, annualGrossReceiptsCount);
            const rrc280C = await this.apply280C_RRC(creditRRC, extractConfigRRC, caseDetails);

            const inputFields = await this.buildInputParams(federalRdData.currentYearQREs, federalRdData.prior3YearsQREs, federalRdData.annualGrossReceipts || [], {
                country: this.country,
                creditType: this.creditType,
                currency: this.currency,
                fiscalYearEnded : date,
                subConPercent : config.rrc_sub_con_percent
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
                computedFields,
                finalCredit:taxCredit,
                totalQRE:totalCurrentYearQRE,
                totalWages:federalRdData.currentYearQREs.wages,
                 totalContract:new Decimal(federalRdData.currentYearQREs.contract),
                 totalSupplies:federalRdData.currentYearQREs.supplies,
                averageAnnualGrossReceipts:totalGrossReceipts.div(annualGrossReceiptsCount),
                prev1yearQRE: federalRdData.prior3YearsQREs[0]?.qre || 0,
                prev2yearQRE: federalRdData.prior3YearsQREs[1]?.qre || 0,
                prev3yearQRE: federalRdData.prior3YearsQREs[2]?.qre || 0,

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
        const line22 = line21.div(6);

        // ---- Line 23: Subtract line 22 from line 20 ----
        const line23 = new Decimal(totalQRE.minus(line22));

        // ---- Line (14% or 6%) if any prior year QRE = zero ----
        const hadZeroYear = prior3YearsQREs.some(y => y.qre === 0);


         // IRS rule: If any year has zero → use 6%, else → 14%
        const percentage = hadZeroYear ? configAsc.credit_rate_c2 : configAsc.credit_rate_c1;


        // ---- Line 24: Multiply line 23 by percentage ----
        const line24 = line23.mul(percentage/100);

        // ---- Line 25: (ASC Base Credit) ----
        const line25 = line24; // because you don’t have line19 in ASC
        let dynamicPercentageKey = `Enter ${configAsc.credit_rate_c1}%. If QREs in any of the 3 years is zero, enter ${configAsc.credit_rate_c2}%`;

        return {
            "[20] Total Qualified Research Expenses": Number(await this.round2(totalQRE)),
            "[21] Total QREs for prior 3 tax years": Number(await this.round2(line21)),
            "[22] Divide line 21 by 6.0": Number(await this.round2(line22)),
            "[23] Subtract line 22 from line 20": Number(await this.round2(line23)),
            [dynamicPercentageKey]: `${percentage}%`,
            "[24] Multiply line 23 by the percentage above": Number(await this.round2(line24)),
            "[25] Add lines 19 and 24": Number(await this.round2(line25)),

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
        // Ensure valid inputs to prevent NaN
        const validYearsCount = priorYearsCount > 0 ? priorYearsCount : 1;
        const validGrossReceipts = Decimal.isDecimal(prior4YearsGrossReceiptsTotal) ? prior4YearsGrossReceiptsTotal : new Decimal(0);
        const line7 = validGrossReceipts.div(validYearsCount); // usually 4
        logMessage(`RRC Line 7 (Average Annual Gross Receipts): ${line7}`);
        //---- Line 8: Multiply line 7 by percentage on line 6 (configRRC.fixedBasePercentage)
        const line8 = line7.mul(new Decimal((configRRC.fixed_base_percentage ?? 0.16)/100));

        //---- Line 9: Subtract line 8 from line 5
        const line9 = currentYearQRE.minus(line8);
        const maxLine9 = Decimal.max(line9, 0);
        logMessage(`RRC Line 9 (QRE - Base): ${maxLine9}`);

        //---- Line 10: Multiply line 5 by 50%
        const line10 = currentYearQRE.mul(configRRC.rrc_qre_credit_percentage/100 || 0.5);

        //---- Line 11: Enter smaller of line 9 or line 10
        const line11 = Decimal.min(line10, maxLine9);
        let dynamicLine5 = `[10] Multiply line 5 by ${configRRC.qre_credit_percentage}`

        return {
            "[5] Total Qualified Research Expenses": await this.round2(currentYearQRE),
            "[6] Fixed-base percentage": `${configRRC.fixed_base_percentage}%`,
            "[7] Average Annual Gross Receipts": await this.round2(line7),
            "[8] Multiply line 7 by percentage on line 6": await this.round2(line8),
            "[9] Subtract line 8 from line 5": await this.round2(maxLine9),
            [dynamicLine5]: await this.round2(line10),
            "[11] Enter smaller of line 9 or line 10": await this.round2(line11),
            final_credit: line11
        };
    }

    /**
     * 
     * @param creditRRC 
     * @param configRRC 
     * @returns 
     */
    async apply280C_RRC(creditRRC: any, configRRC: ConfigJson, caseDetails : Case) {
        // ASC Federal 280C reduction rules
        const rateWhenElect = configRRC.elect_280c_yes/100;
        const rateWhenNoElect = configRRC.elect_280c_no/100; // do not elect 280C

        const creditNoElect = creditRRC.final_credit.mul(rateWhenNoElect);
        const creditYesElect = creditRRC.final_credit.mul(rateWhenElect);
        let dynamicRRC280CKey = `Multiply line 11 by ${configRRC.elect_280c_no}% (by ${configRRC.elect_280c_yes}% if line 13 is No)`;
        let dynamicRRCValue;
        if(caseDetails.rrc_credit_280_c == 'No') {
            dynamicRRCValue = Number(await this.round2(creditNoElect))
        } else {
            dynamicRRCValue = Number(await this.round2(creditYesElect))
        }
        return {
            reduction280c: {
                no_elect280c: {
                    "[13] Electing reduced credit under 280C": caseDetails.rrc_credit_280_c!,
                    [dynamicRRC280CKey]: dynamicRRCValue
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
    async apply280C_ASC(creditASC: any, configASC: ConfigJson, caseDetails : Case) {
        // Federal RRC 280C reduction factors
        const factorElect = configASC.elect_280c_yes/100;   // elect 280C → reduced credit
        const factorNoElect = configASC.elect_280c_no; // no election → full credit

        const creditNoElect = creditASC.final_credit
        const creditYesElect = creditASC.final_credit.mul(factorElect);
        let dynamicRRC280CKey = `Multiply line 20 by ${configASC.elect_280c_yes}% (equals line 25 if line 26 is No)`
        let dynamicASCValue;
        if(caseDetails.asc_credit_280_c === 'No') {
            dynamicASCValue = Number(await this.round2(creditNoElect))
        } 
        else {
            dynamicASCValue = Number(await this.round2(creditYesElect))
        }
        return {
            reduction280c: {
                no_elect280c: {
                    "[26] Electing reduced credit under 280C": caseDetails.asc_credit_280_c!,
                    [dynamicRRC280CKey]: dynamicASCValue
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

        const priorYearsQre: Record<string, any> = []
        const priorYearGross : Record<string, any> = []
        const mapNumbers = new Map();
        mapNumbers.set(1, "st")
        mapNumbers.set(2, "nd")
        mapNumbers.set(3, "rd")
        mapNumbers.set(4, "th")

        // Add prior 3 years QREs
        prior3YearsQREs.forEach((item, i) => {
            priorYearsQre.push({
                "Preceding Year Wise" : `${i + 1}${mapNumbers.get(i + 1)} Preceding year`,
                "Total" : item.qre || 0,
                "Fiscal Year" : JSON.stringify(item.fiscalYear)
            })
        });

        // Add prior 4 years gross receipts
        annualGrossReceipts.forEach((item, i) => {
            priorYearGross.push({
                "Preceding Year Wise" : `${i + 1}${mapNumbers.get(i + 1)} Preceding year`,
                "Total" : item.grossReceipts || 0,
                "Fiscal Year" : JSON.stringify(item.fiscalYear)
            })
        });
       


        return {
            metadata: {
                country: metadata.country || "US",
                credit_type: metadata.creditType || "FEDERAL_RRC_ASC",
                currency: metadata.currency || "USD",
                "Descriptions" : "Research Tax Credit",
                "Tax Year Ended:" : metadata.fiscalYearEnded
            },
            "Average Annual Gross Receipts" : priorYearGross,
            "Total Qualified Research Expenses" : priorYearsQre,
            "qreSummary" : {
                "Wages" : this.round2(currentYearQREs.wages ?? 0.00),
                "Supplies" : this.round2(currentYearQREs.supplies ?? 0.00),
                [`${metadata.subConPercent}% Contract Expenses`] : this.round2(currentYearQREs.contract ?? 0.00)
            }
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
            "(Regular Credit)": { ...creditRRC, rrc280C },
            "(ASC Credit)": { ...creditASC, asc280C },
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