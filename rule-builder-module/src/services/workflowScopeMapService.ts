import { RuleScopeMap, RuleScopeMapCreationAttributes } from "../models/workflowRuleScopeMap";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateScope } from "../utils/types";
import { logMessage } from "../utils/helpers";


export class ScopeService {

    private logger: Logger;
    private mainDbSequelize: Sequelize | null = null;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    private async getMainDb() {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initSequelize();
        }
        return this.mainDbSequelize;
    }

    /** CREATE a new scope */
    async createScope(scopeRequest: ICreateScope, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { scope: any };
    }> {
        const mainDb = await this.getMainDb();
        RuleScopeMap.initialize(mainDb);
        const scope = await RuleScopeMap.create({
            rule_rid: scopeRequest.rule_rid,
            scope_entity_type: scopeRequest.scope_entity_type ?? null,
            scope_entity_rid: scopeRequest.scope_entity_rid,
            is_active: scopeRequest.is_active ?? true,
            created_by: scopeRequest.created_by,
            modified_by: scopeRequest.modified_by ?? scopeRequest.created_by,
        });

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.scopeCreated,
            data: {
                scope: scope,
            },
        };
    };

    /** GET all RuleMasters */
    async listScopes(data: any,
        filters: Record<string, any>,
        userId: string,
        apiType: string): Promise<{
            statusCode: number;
            message: string;
            errorMessage?: string;
            data?: { scopes: any; count: number };
        }> {
        const mainDb = await this.getMainDb();
        RuleScopeMap.initialize(mainDb);
        const limit = data.limit;
        const offset = (data.page - 1) * limit;
        const where: any = {};

        if (filters && Object.keys(filters).length > 0) {
            for (const key in filters) {
                if (filters[key] !== undefined && filters[key] !== null) {
                    where[key] = filters[key];
                }
            }
        }
        const { rows, count } = await RuleScopeMap.findAndCountAll({
            where,
            order: [[data.sortBy, data.sortOrder]],
            limit,
            offset
        });
        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
                scopes: rows,
                count: count,
            },
        };
    };

    /** UPDATE RuleMaster by RID */
    async updateScope(scopeRequest: any,
        userId: string): Promise<{
            statusCode: number;
            message: string;
            errorMessage?: string;
            data?: { scope: any };
        }> {
        // Build update object dynamically
        const mainDb = await this.getMainDb();
        const dbInit = RuleScopeMap.initialize(mainDb);
        const caseUpdateResponse = await RuleScopeMap.update(
            {
                ...scopeRequest,
                modified_by: "userId",
                modified_datetime: new Date(),
            },
            {
                where: { rid: scopeRequest.scope_rid },
            }
        );

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.scopeUpdated,
            data: {
                scope: {},
            },
        };
    };


    /** DELETE RuleMaster by RID */
    async deleteScope(data: any, userId: string) {
        try {
            const mainDb = await this.getMainDb();
            RuleScopeMap.initialize(mainDb);
            await RuleScopeMap.destroy({ where: { rid: data.scope_rid } });
            return {
                statusCode: HttpStatus.SUCCESS,
                message: STATUS_MESSAGE.scopeDeleteSuccess,
            };
        } catch (err) {
            console.log(`Error deleting, ${err}`)
            return {
                statusCode: HttpStatus.FAILED,
                message: STATUS_MESSAGE.scopeDeleteFailed,
            };
        }
    };

}