import { Logger } from "winston";
import { Sequelize } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import { HttpStatus, STATUS_MESSAGE, rawQueries, MAIN_SCHEMA_NAME, caseStatuses } from "../../utils/constants";
import { logMessage } from "../../utils/helpers";
import RDCreditSchemaService from "./schemaService";
import CaseSchemaService from "../cases/schemaService";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Decimal } from "decimal.js";
import { Any } from "currency.js";
import { log } from "console";
import { stateCalculators } from "../rd-state-calculators";

// Type definition for the config JSON
export interface ConfigJson {
    credit_rate: number;
    elect_280c_no: number;
    elect_280c_yes: number;
    sub_con_percent: number;
    fixed_base_percentage: number;
    qre_cap_rate: number;
}


/**
 * 
 */
export class FinancialRDCreditService {
    private logger: Logger;
    private caseModelService: CaseModelService;
    private rdCreditSchemaService: RDCreditSchemaService;
    private caseSchemaService: CaseSchemaService;
    private orgDbSequelize: Sequelize | null = null;
    private mainDbSequelize: Sequelize | null = null;

    constructor(logger: Logger) {
        this.logger = logger;
        this.caseModelService = new CaseModelService();
        this.rdCreditSchemaService = new RDCreditSchemaService();
        this.caseSchemaService = new CaseSchemaService();
    }

    private async getOrgDb() {
        if (!this.orgDbSequelize) {
            this.orgDbSequelize = await initOrgSequelize();
        }
        return this.orgDbSequelize;
    }

    private async getMainDb() {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initMainDbSequelize();
        }
        return this.mainDbSequelize;
    }

    /**
     * 
     * @param accountRid 
     * @param caseRid 
     * @returns 
     */
    async computeRDCredit(accountRid: string, caseRid: string, effectiveStart: string, effectiveEnd: string) {
        try {

            const mainDb = await this.getMainDb();
            const orgDb = await this.getOrgDb();

            const fetchParentAccountRnumber: any = await mainDb.query(
                await rawQueries.fetchParentAccount(accountRid, mainDb)
            );

            if (fetchParentAccountRnumber[0].length > 0) {

                let schemaName = rawQueries.fetchSchemaName(
                    fetchParentAccountRnumber[0][0].r_number
                );

                const accountNumber = 'ACC-00001';
                schemaName = 'trd365_00001';

                const countryInfo = await this.rdCreditSchemaService.getCountryByAccountRid(accountRid, mainDb);
                logMessage(`Country Info: ${JSON.stringify(countryInfo)}`);

                const currentYearQREs = await this.rdCreditSchemaService.getCurrentYearQREs(caseRid, schemaName, orgDb); //current yer QREs
                const totalCurrentYearQRE = new Decimal(currentYearQREs.wages || 0).plus(currentYearQREs.supplies || 0).plus(currentYearQREs.contract || 0);
                logMessage(`CurrentYearQREs: ${JSON.stringify(currentYearQREs)}`);

                const prior3YearsQREs = await this.rdCreditSchemaService.getPrior3YearQREs(accountRid, 3, schemaName, orgDb);// prior 3 years QREs

                logMessage(`Total Prior 3 Years QREs: ${JSON.stringify(prior3YearsQREs)}`);
                const annualGrossReceipts = await this.rdCreditSchemaService.getAnnualGrossReceipts(accountRid, 4, schemaName, orgDb); // prior 4 years gross receipts
                const totalGrossReceipts = new Decimal(annualGrossReceipts.reduce(
                    (sum, r) => sum + (r.grossReceipts || 0), 0));
                logMessage(`AnnualGrossReceipts: ${JSON.stringify(annualGrossReceipts)}`);

                const configASC = await this.rdCreditSchemaService.getRDCreditConfig("USA", mainDb, effectiveStart, effectiveEnd, "", "ASC");
                const extractConfigAsc = this.extractConfigJson(configASC.config_json);

                const creditASC = await this.calculateASC(totalCurrentYearQRE, prior3YearsQREs, extractConfigAsc);
                const asc280C = await this.apply280C_ASC(creditASC, extractConfigAsc);

                const configRRC = await this.rdCreditSchemaService.getRDCreditConfig("USA", mainDb, effectiveStart, effectiveEnd, "", "RRC");
                const extractConfigRRC = this.extractConfigJson(configRRC.config_json);

                const creditRRC = await this.calculateRRC(totalCurrentYearQRE, totalGrossReceipts, extractConfigRRC, 4);
                const rrc280C = await this.apply280C_RRC(creditRRC, extractConfigRRC);

                const inputFields = await this.buildInputParams(currentYearQREs, prior3YearsQREs, annualGrossReceipts, {
                    country: "USA",
                    creditType: "FEDERAL_RRC_ASC",
                    currency: "USD",
                });
                logMessage(`Input Fields: ${JSON.stringify(inputFields)}`);

                const computedFields = await this.buildComputedFields(creditASC, creditRRC, asc280C, rrc280C);
                this.rdCreditSchemaService.insertRDCreditCalculation(accountNumber, caseRid, "USA", inputFields, computedFields);

                // Step 4: Return success response
                return {
                    statusCode: HttpStatus.SUCCESS,
                    message: STATUS_MESSAGE.rdCreditPreviewSuccess || "RD credit calculation generated successfully",
                    data: {},
                };
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
    async calculateASC(totalQRE: Decimal, prior3YearsQREs: { fiscalYear: number; qre: number }[], configAsc: ConfigJson) {
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
            tot_current_year_qre: totalQRE,
            total_prior_3years_qre: line21,
            adjusted_base_amount: line22,
            excess_qre: line23,
            asc_credit_amount: line24,
            total_section_b_credit: line25,
            final_credit: line25,
            percentage_used: Math.round(percentage * 100)
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

        return {
            tot_current_year_qre: currentYearQRE,
            fixed_base_percentage: Math.round(configRRC.fixed_base_percentage * 100),
            average_annual_gross_receipts: line7,
            base_amount: line8,
            excess_qre_over_base_amount: line9,
            half_total_qre: line10,
            total_section_a_credit: line11,
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
        const rateWhenElect = configRRC.elect_280c_yes;  // elect 280C
        const rateWhenNoElect = configRRC.elect_280c_no; // do not elect 280C

        const creditElect = creditRRC.final_credit.mul(rateWhenElect);
        const creditNoElect = creditRRC.final_credit.mul(rateWhenNoElect);

        return {
            reduction280c: {
                elect280c: {
                    rate: rateWhenElect,
                    credit: await this.round2(creditElect)
                },
                no_elect280c: {
                    rate: rateWhenNoElect,
                    credit: await this.round2(creditNoElect)
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
        const factorElect = configASC.elect_280c_yes;   // elect 280C → reduced credit
        const factorNoElect = configASC.elect_280c_no; // no election → full credit

        const creditElect = creditASC.final_credit.mul(factorElect);
        const creditNoElect = creditASC.final_credit.mul(factorNoElect);
        return {
            reduction280c: {
                elect280c: {
                    factor: factorElect,
                    credit: await this.round2(creditElect)
                },
                no_elect280c: {
                    factor: factorNoElect,
                    credit: await this.round2(creditNoElect)
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
    async buildInputParams(currentYearQREs: any, prior3YearsQREs: any[], annualGrossReceipts: any[], metadata: any = {}) {

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
    async buildComputedFields(creditASC: any, creditRRC: any, asc280C: any, rrc280C: any) {
        return {
            computed_fields: {
                asc: { creditASC, asc280C },
                rrc: { creditRRC, rrc280C }
            }
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
     * 
     * @param accountRid 
     * @param caseRid 
     * @param effectiveStart 
     * @param effectiveEnd 
     * @returns 
     */
    async computeRDCreditForStateLevel(accountRid: string, caseRid: string, effectiveStart: string, effectiveEnd: string) {
        try {

            const mainDb = await this.getMainDb();
            const orgDb = await this.getOrgDb();

            const fetchParentAccountRnumber: any = await mainDb.query(
                await rawQueries.fetchParentAccount(accountRid, mainDb)
            );

            let schemaName = rawQueries.fetchSchemaName(
                fetchParentAccountRnumber[0][0].r_number
            );

            const accountNumber = 'ACC-00001';
            schemaName = 'trd365_00001';

            const configStateLevel = await this.rdCreditSchemaService.getRDCreditConfigStateLevel("USA", mainDb, effectiveStart, effectiveEnd, "", "State R&D Credit");

            const currentYearQREs = await this.rdCreditSchemaService.getCurrentYearQREs(caseRid, schemaName, orgDb); //current yer QREs
            logMessage(`CurrentYearQREs: ${JSON.stringify(currentYearQREs)}`);
            const prior3YearsQREs = await this.rdCreditSchemaService.getPrior3YearQREs(accountRid, 3, schemaName, orgDb);// prior 3 years QREs
            logMessage(`Prior3YearQREs: ${JSON.stringify(prior3YearsQREs)}`);

            const annualGrossReceipts = await this.rdCreditSchemaService.getAnnualGrossReceipts(accountRid, 4, schemaName, orgDb); // prior 4 years gross receipts
            const totalGrossReceipts = new Decimal(annualGrossReceipts.reduce(
                (sum, r) => sum + (r.grossReceipts || 0), 0));
            logMessage(`AnnualGrossReceipts: ${JSON.stringify(annualGrossReceipts)}`);

            // Iterate through each 36 state configuration and compute credits
            for (const config of configStateLevel) {
                logMessage(`State Level Config: ${JSON.stringify(config)}`);
                const calculator = stateCalculators[config.state_code];
                if (calculator) {
                    const result = await calculator.compute(config, currentYearQREs, annualGrossReceipts, totalGrossReceipts, prior3YearsQREs, 4);
                    logMessage(`Result for ${config.state_code}: ${JSON.stringify(result)}`);
                    this.rdCreditSchemaService.insertRDStateCreditCalculation(accountNumber, caseRid, "USA", config.state_code, result.inputFields, result.computedFields);
                } else {
                    logMessage(`No calculator implemented for state: ${config.state_code}`);
                }
            }

            return {
                statusCode: HttpStatus.SUCCESS,
                message: STATUS_MESSAGE.rdCreditPreviewSuccess || "RD credit calculation generated successfully",
                data: {},
            };

        } catch (error) {
            logMessage(`Error fetching RD Credit : ${error}`);

            return {
                statusCode: HttpStatus.FAILED,
                message: HttpStatus.FAILED_MESSAGE,
                errorMessage: STATUS_MESSAGE.jurisdictionFetchedFailed || "Failed to fetch",
            };
        }
    }
}