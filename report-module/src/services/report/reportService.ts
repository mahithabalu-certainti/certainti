import { initMainDbSequelize } from "../../config/mainDataSource";
import { Sequelize, Op, QueryTypes } from "sequelize";
import { MAIN_SCHEMA_NAME, HttpStatus, rawQueries } from "../../utils/constants";
import { errorLog } from "../../utils/helpers";
import SchemaService from "./schemaService";


export class ReportService {
    private mainDbSequelize: Sequelize | null = null;
    private schemaService: SchemaService;

    constructor() {
        this.schemaService = new SchemaService();
    }

    async getMainSequelize(): Promise<Sequelize> {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initMainDbSequelize();
        }
        return this.mainDbSequelize;
    }

    async getCountDetails(userId: string): Promise<{ statusCode: number; message: string; errorMessage?: string; data?: any }> {
        try {

            const accessibleAccountsInfo =
                await this.schemaService.getAccessibleAccountInfo(userId);
            const accessibleAccountIds = accessibleAccountsInfo.map(
                (acc) => acc.id
            );
            if (accessibleAccountIds.length === 0) {
                return {
                    statusCode: HttpStatus.SUCCESS,
                    message: "No accessible accounts found",
                    data: { account: [], count: 0 },
                };
            }
            // Separate child and parent accounts
            const childAccountsInfo = accessibleAccountsInfo.filter(
                (acc) => acc.isChild
            );
            const childAccountIds = childAccountsInfo.map((acc) => acc.id);

            return {
                statusCode: HttpStatus.SUCCESS,
                message: "Success",
                data: {}
            };

        } catch (error) {
            errorLog("getDataMapperFormsDetail", (error as Error).message);
            throw error;
        }
    }

}
