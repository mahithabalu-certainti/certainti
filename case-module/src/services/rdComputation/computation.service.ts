import { Sequelize } from "sequelize";
import { HttpStatus, STATUS_MESSAGE, rawQueries } from "../../utils/constants";
import { logMessage } from "../../utils/helpers";
import RDCreditSchemaService from "./schemaService";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import StateComputationService from "./state.computation.service";
import FederalComputationService from "./federal.computation.service";

enum ConfigType {
    NONE = "NONE",
    FEDERAL_ONLY = "FEDERAL_ONLY",
    STATE_ONLY = "STATE_ONLY",
    BOTH = "BOTH"
}

/**
 * Computation Service
 */
export class ComputationService {

    private rdCreditSchemaService: RDCreditSchemaService;
    private stateComputationService: StateComputationService;
    private federalComputationService: FederalComputationService;
    private orgDbSequelize: Sequelize | null = null;
    private mainDbSequelize: Sequelize | null = null;

    constructor() {
        this.rdCreditSchemaService = new RDCreditSchemaService();
        this.stateComputationService = new StateComputationService();
        this.federalComputationService = new FederalComputationService();
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
     * Initiates the RD Credit Process by determining config levels and calling respective services.
     * @param accountRid 
     * @param caseRid 
     * @param effectiveStart 
     * @param effectiveEnd 
     * @returns 
     */
    async initiateRDCreditProcess(accountRid: string, caseRid: string, effectiveStart: string, effectiveEnd: string) {
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

            const findAvailableConfigLevels = await this.rdCreditSchemaService.findAvailableConfigLevels("USA", mainDb, effectiveStart, effectiveEnd);
            const hasFederal = findAvailableConfigLevels.includes(true);
            const hasState = findAvailableConfigLevels.includes(false);
            const configLevelKey =
                hasFederal && hasState ? ConfigType.BOTH :
                    hasFederal ? ConfigType.FEDERAL_ONLY :
                        hasState ? ConfigType.STATE_ONLY :
                            ConfigType.NONE;


            const executionConfigMap: Record<string, () => Promise<any>> = {
                [ConfigType.BOTH]: async () => {
                    logMessage("Both Federal and State computations to be executed.");
                    await this.federalComputationService.runFederalComputation(accountRid, caseRid, effectiveStart, effectiveEnd);
                    return await this.stateComputationService.initiateRDCreditStateProcess(accountRid, caseRid, effectiveStart, effectiveEnd);
                },
                [ConfigType.FEDERAL_ONLY]: async () => {
                    logMessage("Only Federal computation to be executed.");
                    return await this.federalComputationService.runFederalComputation(accountRid, caseRid, effectiveStart, effectiveEnd);
                },
                [ConfigType.STATE_ONLY]: async () => {
                    logMessage("Only State computation to be executed.");
                    return await this.stateComputationService.initiateRDCreditStateProcess(accountRid, caseRid, effectiveStart, effectiveEnd);
                },
                [ConfigType.NONE]: async () => ({
                    statusCode: HttpStatus.FAILED,
                    message: HttpStatus.FAILED_MESSAGE,
                    errorMessage: "No configuration found"
                })
            };

            const result =
                executionConfigMap[configLevelKey] ??
                executionConfigMap[ConfigType.NONE];

            return (result as () => Promise<any>)();

        } catch (error) {
            logMessage(`Error initiating RD Credit Process: ${error}`);

            return {
                statusCode: HttpStatus.FAILED,
                message: HttpStatus.FAILED_MESSAGE,
                errorMessage: STATUS_MESSAGE.rdCreditProcessInitiationFailed || "Failed to initiate process",
            };
        }
    }

    /**
     * 
     * @param accountRid 
     * @param caseRid 
     * @param stateCode 
     * @returns 
     */
    async getComputationResultsByIDAndState(accountRid: string, caseRid: string, stateCode: string) {
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
            const results = await this.rdCreditSchemaService.findRdCreditResultsByCaseIdAndState(accountNumber, caseRid, stateCode);

            return {
                statusCode: HttpStatus.SUCCESS,
                message: STATUS_MESSAGE.rdCreditPreview,
                data: results,
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
     * 
     * @param accountRid 
     * @param caseRid 
     * @returns 
     */
    async findProcessStatus(accountRid: string, caseRid: string) {
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
            logMessage(`Fetching RD Credit Status for Account: ${accountNumber}, Case: ${caseRid}`);
            const status = await this.rdCreditSchemaService.findProcessStatusByCaseRid(accountNumber, caseRid);

            return {
                statusCode: HttpStatus.SUCCESS,
                message: "RD Credit Status fetched successfully",
                data: status,
            };
        } catch (error) {
            logMessage(`Error fetching RD Credit Status: ${error}`);

            return {
                statusCode: HttpStatus.FAILED,
                message: HttpStatus.FAILED_MESSAGE,
                errorMessage: "Failed to fetch status",
            };
        }
    }

}