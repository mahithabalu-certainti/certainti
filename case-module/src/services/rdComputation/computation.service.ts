import { Sequelize } from "sequelize";
import { HttpStatus, STATUS_MESSAGE, rawQueries } from "../../utils/constants";
import { logMessage } from "../../utils/helpers";
import RDCreditSchemaService from "./schemaService";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";

export class ComputationService {

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
            const results = this.rdCreditSchemaService.getRDStateCreditCalculation(accountNumber, caseRid, stateCode);
            
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

}