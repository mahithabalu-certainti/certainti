import { QueryTypes, Sequelize } from "sequelize";
import { HttpStatus, STATUS_MESSAGE, rawQueries } from "../../utils/constants";
import { logMessage } from "../../utils/helpers";
import RDCreditSchemaService from "./schemaService";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { stateCalculators } from "../rdStateProcessors";
import { AnnualGrossReceipt, QRE, StateRDData } from "./rdCreditTypes";
import { kafkaProducerService } from "../../kafka/producerService";
import FederalComputationService from "./federalComputation";
import Decimal from "decimal.js";

enum ConfigType {
    NONE = "NONE",
    FEDERAL_ONLY = "FEDERAL_ONLY",
    STATE_ONLY = "STATE_ONLY",
    BOTH = "BOTH"
}

/**
 * State Computation Service
 */
export class StateComputationService {

    private rdCreditSchemaService: RDCreditSchemaService;
    private orgDbSequelize: Sequelize | null = null;
    private mainDbSequelize: Sequelize | null = null;
    private federalComputationService;

    readonly programName = "State R&D Credit";
    readonly jurisdictionColumn = "state_rid";


    constructor() {
        this.rdCreditSchemaService = new RDCreditSchemaService();
        this.federalComputationService = new FederalComputationService()
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
            const processRid = await this.rdCreditSchemaService.markAsInitiated(fetchParentAccountRnumber[0][0].r_number, caseRid, 'financial_computation');
            // Publish to Kafka
            await kafkaProducerService.publish(accountRid, fetchParentAccountRnumber[0][0].r_number, processRid, caseRid, effectiveStart, effectiveEnd);

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
            const fetchAccountCountryId : any = await mainDb.query(rawQueries.fetchAccountAndCountryDetails(accountRid))
            const findAvailableConfigLevels = await this.rdCreditSchemaService.findAvailableConfigLevels(fetchAccountCountryId[0][0].country_code, mainDb, effectiveStart, effectiveEnd);
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
                    return await this.runComputationState(accountRid, caseRid, effectiveStart, effectiveEnd)
                },
                [ConfigType.STATE_ONLY]: async () => {
                    logMessage("Only State computation to be executed.");
                    return await this.runComputationState(accountRid, caseRid, effectiveStart, effectiveEnd)
                },
                [ConfigType.NONE]: async () => ({
                    statusCode: HttpStatus.FAILED,
                    message: HttpStatus.FAILED_MESSAGE,
                    errorMessage: "No configuration found"
                })
            };
            const executeComputation = executionConfigMap[configLevelKey];
            if (executeComputation) {
                return await executeComputation();
            } else {
                throw new Error(`Invalid ConfigType: ${configLevelKey}`);
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
     * @param accountRid 
     * @param caseRid 
     * @param regionRid 
     * @param orgDb 
     * @param schemaName 
     */
    async findStateInputData(accountRid: string, caseRid: string, regionRid: string, orgDb: Sequelize, schemaName: string, fiscalYear : number) {
        const currentFiscalYear = fiscalYear

        const currentYearQREs = await this.rdCreditSchemaService.getCurrentYearQREsForState(caseRid, regionRid, schemaName, orgDb, currentFiscalYear); //current yer QREs
        logMessage(`CurrentYearQREs: ${JSON.stringify(currentYearQREs)}`);

        const prior3YearsQREs = await this.rdCreditSchemaService.getPrior3YearQREs(accountRid, this.jurisdictionColumn, regionRid, 3, schemaName, currentFiscalYear, orgDb);// prior 3 years QREs
        logMessage(`Prior3YearQREs: ${JSON.stringify(prior3YearsQREs)}`);

        const annualGrossReceipts = await this.rdCreditSchemaService.getAnnualGrossReceipts(accountRid, this.jurisdictionColumn, regionRid, 5, schemaName, orgDb); // current year & prior 4 years gross receipts

        logMessage(`AnnualGrossReceipts: ${JSON.stringify(annualGrossReceipts)}`);

        const stateRDData = await this.getStateRDData(currentYearQREs, prior3YearsQREs, annualGrossReceipts);
        return stateRDData;
    }

    async runComputationState (accountRid : string, caseRid : string, effectiveStart : string, effectiveEnd : string) {
        const mainDb = await this.getMainDb();
        const orgDb = await this.getOrgDb();

        const fetchParentAccountRnumber: any = await mainDb.query(
            await rawQueries.fetchParentAccount(accountRid, mainDb)
        );

        let schemaName = rawQueries.fetchSchemaName(
            fetchParentAccountRnumber[0][0].r_number
        );
        const countryInfo = await this.rdCreditSchemaService.getCountryByAccountRid(accountRid, mainDb);
        const configStateLevel = await this.rdCreditSchemaService.getRDCreditConfigStateLevel(countryInfo.countryCode, mainDb, effectiveStart, effectiveEnd, "", this.programName);
        const [caseDetails] : any = await orgDb.query(rawQueries.fetchCaseById(schemaName), {replacements : {caseId : caseRid}, type : QueryTypes.SELECT})
        let currentFiscalYear = caseDetails.fiscal_year;
        for (const config of configStateLevel) {
            try {
                const stateComputation = stateCalculators[config.state_code];
                const extractConfig = this.extractConfigJson(config.config_json);
                logMessage(`Processing state: ${config.state_code} with config: ${JSON.stringify(extractConfig)}`);
                if (stateComputation) {
                    
                    const date = new Date(effectiveEnd);
                    const formatted = date.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                    });
                    const stateRDData = await this.findStateInputData(accountRid, caseRid, config.state_rid, orgDb, schemaName, currentFiscalYear);
                    logMessage(`State RD Data for ${config.state_code}: ${JSON.stringify(stateRDData)}`);
                    let result;
                    
                    if(config.state_code === "ON") {
                        result = await stateComputation.compute(caseRid, accountRid, schemaName, extractConfig, caseDetails)
                    } else {
                        result = await stateComputation.compute(extractConfig, stateRDData, formatted, currentFiscalYear, caseDetails);
                    }                  
                    
                    await this.rdCreditSchemaService.insertRDStateCreditCalculation(
                        fetchParentAccountRnumber[0][0].r_number, caseRid, config.country_rid, config.state_rid,
                        result.inputFields, result.computedFields, result.finalCredit, result?.totalQRE ?? null
                    );
                }
            } catch (err) {
                logMessage(`Error processing state ${config.state_code}: ${err}`);
            }
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