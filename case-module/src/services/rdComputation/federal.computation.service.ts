import { Sequelize } from "sequelize";
import { HttpStatus, STATUS_MESSAGE, rawQueries } from "../../utils/constants";
import { logMessage } from "../../utils/helpers";
import RDCreditSchemaService from "./schemaService";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { federalCalculators } from "../rdFederalProcessors";
import { AnnualGrossReceipt, QRE, StateRDData } from "./rdCreditTypes";

export class FederalComputationService {
    private rdCreditSchemaService: RDCreditSchemaService;
    private orgDbSequelize: Sequelize | null = null;
    private mainDbSequelize: Sequelize | null = null;

    constructor() {
        this.rdCreditSchemaService = new RDCreditSchemaService();
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
     * Runs the federal RD credit computation for USA.
     * @param accountRid 
     * @param caseRid 
     * @param effectiveStart 
     * @param effectiveEnd 
     * @returns 
     */
    async runFederalComputation(accountRid: string, caseRid: string, effectiveStart: string, effectiveEnd: string) {
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

            const currentFiscalYear = this.getCurrentFiscalYear();

            const countryInfo = await this.rdCreditSchemaService.getCountryByAccountRid(accountRid, mainDb);
            logMessage(`Country Info: ${JSON.stringify(countryInfo)}`);

            const currentYearQREs = await this.rdCreditSchemaService.getCurrentYearQREsForFederal(caseRid, countryInfo.rid, schemaName, orgDb); //current yer QREs
            logMessage(`CurrentYearQREs: ${JSON.stringify(currentYearQREs)}`);

            const jurisdictionColumn = "country_rid";
            const prior3YearsQREs = await this.rdCreditSchemaService.getPrior3YearQREs(accountRid, jurisdictionColumn, countryInfo.rid, 3, schemaName, currentFiscalYear, orgDb);// prior 3 years QREs

            logMessage(`Total Prior 3 Years QREs: ${JSON.stringify(prior3YearsQREs)}`);
            const annualGrossReceipts = await this.rdCreditSchemaService.getAnnualGrossReceipts(accountRid, jurisdictionColumn, countryInfo.rid, 4, schemaName, orgDb); // prior 4 years gross receipts

            const federalRDData = await this.getFederalRDData(currentYearQREs, prior3YearsQREs, annualGrossReceipts);

            const configASC = await this.rdCreditSchemaService.getRDCreditConfig("USA", mainDb, effectiveStart, effectiveEnd, "", "ASC");
            const extractConfigAsc = this.extractConfigJson(configASC.config_json);

            const configRRC = await this.rdCreditSchemaService.getRDCreditConfig("USA", mainDb, effectiveStart, effectiveEnd, "", "RRC");
            const extractConfigRRC = this.extractConfigJson(configRRC.config_json);

            const config = {
                ascConfig: extractConfigAsc,
                rrcConfig: extractConfigRRC
            };

            // const federalComputation = federalCalculators[countryInfo.countryCode];
            const federalComputation = federalCalculators["USA"];


            if (federalComputation) {
                const result = await federalComputation.compute(config, federalRDData);
                await this.rdCreditSchemaService.insertRDCreditCalculation(accountNumber, caseRid, "USA", result.inputFields, result.computedFields);
                return {
                    statusCode: HttpStatus.SUCCESS,
                    message: STATUS_MESSAGE.rdCreditPreviewSuccess || "RD credit calculation processed successfully",
                    data: result,
                };
            }

            return {
                statusCode: HttpStatus.FAILED,
                message: "RD credit calculation processed failed",
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

    /**
     * Gets the federal RD data structure.
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @param annualGrossReceipts 
     * @returns 
     */
    async getFederalRDData(currentYearQREs: QRE, prior3YearsQREs: QRE[], annualGrossReceipts: AnnualGrossReceipt[]): Promise<StateRDData> {
        return {
            currentYearQREs,
            prior3YearsQREs,
            annualGrossReceipts
        }
    }

    /**
     * Get current fiscal year based on date.
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
     * Extracts and parses the config_json field.
     * @param configJson 
     * @returns 
     */
    extractConfigJson(configJson: any) {
        // If it's already an object, just return it
        if (typeof configJson === 'object') {
            return configJson;
        }

        // If it's a string, parse it
        try {
            return JSON.parse(configJson);
        } catch (error) {
            console.error('Failed to parse config_json:', error);
            return {}; // fallback
        }
    }

}
export default FederalComputationService;