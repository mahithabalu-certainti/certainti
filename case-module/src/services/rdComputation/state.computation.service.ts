import { Sequelize } from "sequelize";
import { HttpStatus, STATUS_MESSAGE, rawQueries } from "../../utils/constants";
import { logMessage } from "../../utils/helpers";
import RDCreditSchemaService from "./schemaService";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { stateCalculators } from "../rdStateProcessors";
import { AnnualGrossReceipt, QRE, StateRDData } from "./rdCreditTypes";
import { kafkaProducerService } from "../../kafka/producer.service";

/**
 * State Computation Service
 */
export class StateComputationService {

    private rdCreditSchemaService: RDCreditSchemaService;
    private orgDbSequelize: Sequelize | null = null;
    private mainDbSequelize: Sequelize | null = null;

    constructor() {
        this.rdCreditSchemaService = new RDCreditSchemaService();
    }

    /**
     * 
     * @returns 
     */
    private async getOrgDb() {
        if (!this.orgDbSequelize) {
            this.orgDbSequelize = await initOrgSequelize();
        }
        return this.orgDbSequelize;
    }

    /**
     * 
     * @returns 
     */
    private async getMainDb() {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initMainDbSequelize();
        }
        return this.mainDbSequelize;
    }

    /**
     * Initiates the RD Credit Process by publishing a message to Kafka.
     * @param accountRid 
     * @param caseRid 
     * @param effectiveStart 
     * @param effectiveEnd 
     * @returns 
     */
    async initiateRDCreditStateProcess(accountRid: string, caseRid: string, effectiveStart: string, effectiveEnd: string) {
        try {
            const mainDb = await this.getMainDb();

            const fetchParentAccountRnumber: any = await mainDb.query(
                await rawQueries.fetchParentAccount(accountRid, mainDb)
            );

            let schemaName = rawQueries.fetchSchemaName(
                fetchParentAccountRnumber[0][0].r_number
            );

            const accountNumber = 'ACC-00001';
            schemaName = 'trd365_00001';
            const processRid = await this.rdCreditSchemaService.markAsInitiated(accountNumber, caseRid);
            // Publish to Kafka
            await kafkaProducerService.publish(accountRid, accountNumber, processRid, caseRid, effectiveStart, effectiveEnd);
            
            return {
                statusCode: HttpStatus.SUCCESS,
                message: STATUS_MESSAGE.rdCreditProcessInitiatedSuccess || "RD credit process initiated successfully",
                data: {},
            };
        } catch (error) {
            logMessage(`Error initiating RD Credit Process : ${error}`);
            return {
                statusCode: HttpStatus.FAILED,
                message: HttpStatus.FAILED_MESSAGE,
                errorMessage: STATUS_MESSAGE.rdCreditProcessInitiationFailed || "Failed to initiate RD credit process",
            };
        }
    }

    /**
     * Runs the state computation process.
     * @param accountRid 
     * @param caseRid 
     * @param effectiveStart 
     * @param effectiveEnd 
     * @returns 
     */
    async runComputation(accountRid: string, caseRid: string, effectiveStart: string, effectiveEnd: string) {
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

            const configStateLevel = await this.rdCreditSchemaService.getRDCreditConfigStateLevel("USA", mainDb, effectiveStart, effectiveEnd, "", "State R&D Credit");

            const currentYearQREs = await this.rdCreditSchemaService.getCurrentYearQREs(caseRid, schemaName, orgDb); //current yer QREs
            logMessage(`CurrentYearQREs: ${JSON.stringify(currentYearQREs)}`);

            const prior3YearsQREs = await this.rdCreditSchemaService.getPrior3YearQREs(accountRid, 3, schemaName, currentFiscalYear, orgDb);// prior 3 years QREs
            logMessage(`Prior3YearQREs: ${JSON.stringify(prior3YearsQREs)}`);

            const annualGrossReceipts = await this.rdCreditSchemaService.getAnnualGrossReceipts(accountRid, 5, schemaName, orgDb); // current year & prior 4 years gross receipts

            logMessage(`AnnualGrossReceipts: ${JSON.stringify(annualGrossReceipts)}`);

            const stateRDData = await this.getStateRDData(currentYearQREs, prior3YearsQREs, annualGrossReceipts);

            for (const config of configStateLevel) {
                try {
                    const stateComputation = stateCalculators[config.state_code];
                    const extractConfig = this.extractConfigJson(config.config_json);

                    if (stateComputation) {
                        const result = await stateComputation.compute(extractConfig, stateRDData);
                        await this.rdCreditSchemaService.insertRDStateCreditCalculation(
                            accountNumber, caseRid, "USA", config.state_code,
                            result.inputFields, result.computedFields
                        );
                    }
                } catch (err) {
                    logMessage(`Error processing state ${config.state_code}: ${err}`);
                }
            }

            return {
                statusCode: HttpStatus.SUCCESS,
                message: STATUS_MESSAGE.rdCreditPreviewSuccess || "RD credit calculation initiated successfully",
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
     * Gets the State RD Data.
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @param annualGrossReceipts 
     * @returns 
     */
    async getStateRDData(currentYearQREs: QRE, prior3YearsQREs: QRE[], annualGrossReceipts: AnnualGrossReceipt[]): Promise<StateRDData> {
        return {
            currentYearQREs,
            prior3YearsQREs,
            annualGrossReceipts
        }
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

    /**
     * Gets the current fiscal year based on the provided date.
     * @param date 
     * @returns 
     */
    getCurrentFiscalYear(date: Date = new Date()): number {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12

        // Fiscal year starts in April
        return month >= 4 ? year : year - 1;
    }
}

export default StateComputationService;