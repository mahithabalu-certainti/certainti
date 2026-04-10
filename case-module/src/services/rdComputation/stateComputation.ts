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
import { fetchEmployeeCountForCase, fetchFederalQREAndBaseForRI } from "../../utils/rdFinancialWorkingQueries";
import { TaskTypeResponse } from "../../utils/types";
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
    async findStateInputData(accountRid: string, caseRid: string, countryRid:string,regionRid: string, orgDb: Sequelize, schemaName: string, fiscalYear : number, isKentuckyState : boolean, classificationForKentucky : string[]) {
        const currentFiscalYear = fiscalYear

        const currentYearQREs = await this.rdCreditSchemaService.getCurrentYearQREsForState(caseRid, regionRid, schemaName, orgDb, currentFiscalYear, isKentuckyState, classificationForKentucky); //current yer QREs
        logMessage(`CurrentYearQREs: ${JSON.stringify(currentYearQREs)}`);
        

        const currentYearQREsFederal = await this.rdCreditSchemaService.getCurrentYearQREsForFederal(caseRid, countryRid, schemaName, orgDb, false); //current yer QREs
        logMessage(`CurrentYearQREs: ${JSON.stringify(currentYearQREs)}`);


        const prior3YearsQREs = await this.rdCreditSchemaService.getPrior3YearQREs(accountRid, this.jurisdictionColumn, regionRid, 4, schemaName, currentFiscalYear, orgDb);// prior 3 years QREs
        logMessage(`Prior3YearQREs: ${JSON.stringify(prior3YearsQREs)}`);

        const annualGrossReceipts = await this.rdCreditSchemaService.getAnnualGrossReceipts(accountRid, this.jurisdictionColumn, regionRid, 5, schemaName, orgDb); // current year & prior 4 years gross receipts

        logMessage(`AnnualGrossReceipts: ${JSON.stringify(annualGrossReceipts)}`);

        const stateRDData = await this.getStateRDData(currentYearQREs, prior3YearsQREs, annualGrossReceipts,currentYearQREsFederal);
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
        let isKentuckyState : boolean = false;
        let classificationForKentucky : string[] = [];

        for (const config of configStateLevel) {
            try {
                const stateComputation = stateCalculators[config.state_code];
                if(config.state_code === 'KY') {
                    isKentuckyState = true
                    const classificationIds = await mainDb.query<TaskTypeResponse>(rawQueries.getClassficationIds(), {type : QueryTypes.SELECT});
                    classificationForKentucky = classificationIds.map((d) => d.rid);
                }
                const extractConfig = this.extractConfigJson(config.config_json);
                logMessage(`Processing state: ${config.state_code} with config: ${JSON.stringify(extractConfig)}`);
                if (stateComputation) {
                
                const date = new Date(effectiveEnd);
                const formatted = date.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                });
                const stateRDData = await this.findStateInputData(accountRid, caseRid,config.country_rid, config.state_rid, orgDb, schemaName, currentFiscalYear, isKentuckyState, classificationForKentucky);
                logMessage(`State RD Data for ${config.state_code}: ${JSON.stringify(stateRDData)}`);
                isKentuckyState = false
                classificationForKentucky = []
                let result;

                if (config.state_code === "ON") {
                    const [getCompletedTaskStatus] = await mainDb.query<{rid: string}>(rawQueries.getCaseTaskCompletedStatus(), {type: QueryTypes.SELECT});
                    const caseClosed = caseDetails.status_rid == getCompletedTaskStatus?.rid;
                    result = await stateComputation.compute(caseRid, accountRid, schemaName, extractConfig, caseDetails, caseClosed);
                } else {
                    if (config.state_code === "LA" || config.state_code === "NM") {
                        const employeeCounts: any[] = await orgDb.query(fetchEmployeeCountForCase(schemaName), {
                            replacements: { case_rid: caseRid },
                            type: QueryTypes.SELECT
                        });
                        const stateCount = employeeCounts.find((r: any) => r.state_rid === config.state_rid);
                        caseDetails.employee_count = stateCount ? Number(stateCount.employee_count) : 0;
                        logMessage(`[${config.state_code}] Employee count resolved from DB: ${caseDetails.employee_count}`);

                        if (config.state_code === "NM" && caseDetails.employee_count > 25) {
                            logMessage(`[NM] Skipping computation — employee count (${caseDetails.employee_count}) exceeds 25.`);
                            await orgDb.query(rawQueries.updateStateFormError(schemaName), {
                                replacements: {
                                    errorMessage: `NM credit not applicable: employee count (${caseDetails.employee_count}) exceeds the maximum of 25 employees.`,
                                    caseRid,
                                    countryRid: config.country_rid,
                                    stateRid:   config.state_rid
                                },
                                type: QueryTypes.UPDATE
                            });
                            continue;
                        }
                    }
                    if (config.state_code === "RI") {
                        const [federalRow]: any = await orgDb.query(fetchFederalQREAndBaseForRI(schemaName), {
                            replacements: { case_rid: caseRid, country_rid: config.country_rid },
                            type: QueryTypes.SELECT
                        });
                        if (federalRow) {
                            caseDetails.ri_federal_qre = Number(federalRow.total_qre ?? 0);
                            caseDetails.ri_federal_base_amount = Number(federalRow.final_credit ?? 0);
                            logMessage(`[RI] Federal QRE from DB: ${caseDetails.ri_federal_qre}, base amount: ${caseDetails.ri_federal_base_amount}`);
                        }
                    }
                    result = await stateComputation.compute(extractConfig, stateRDData, formatted, currentFiscalYear, caseDetails);
                }

                await this.rdCreditSchemaService.insertRDStateCreditCalculation(
                    fetchParentAccountRnumber[0][0].r_number, caseRid, config.country_rid, config.state_rid, config.state_code,
                    result.inputFields, result.computedFields, result.finalCredit, result?.totalQRE ?? null, stateRDData, extractConfig,caseDetails.employee_count ?? 0,result,
                    result.computedFields.base64Result ?? null
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
    async getStateRDData(currentYearQREs: QRE, prior3YearsQREs: QRE[], annualGrossReceipts: AnnualGrossReceipt[],currentYearQREsFederal: QRE): Promise<StateRDData> {
        return {
            currentYearQREs,
            prior3YearsQREs,
            annualGrossReceipts,
            currentYearQREsFederal
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