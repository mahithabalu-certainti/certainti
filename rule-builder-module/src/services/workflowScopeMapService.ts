import { RuleScopeMap, RuleScopeMapCreationAttributes } from "../models/workflowRuleScopeMap";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateScope } from "../utils/types";
import { logMessage } from "../utils/helpers";


export class ScopeService {

    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    /** CREATE a new scope */
    async createScope(actionRequest: ICreateScope, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { scope: any };
    }> {
        //const sequelize = await initSequelize();
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        RuleScopeMap.initialize(sequelize);
        const scope = await RuleScopeMap.create({
            rule_rid: actionRequest.rule_rid,
            scope_entity_type: actionRequest.scope_entity_type ?? null,
            scope_entity_rid: actionRequest.scope_entity_rid,
            is_active: actionRequest.is_active ?? true,
            created_by: actionRequest.created_by,
            modified_by: actionRequest.modified_by ?? actionRequest.created_by,
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
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        RuleScopeMap.initialize(sequelize);
        const limit = data.limit;
        const offset = (data.page - 1) * limit;
        const { rows, count } = await RuleScopeMap.findAndCountAll({
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

    /** GET RuleMaster by RID */
    // export const getRuleScopeById = async (rid: string) => {
    //     const rule = await RuleScopeMap.findByPk(rid);
    //     return rule;
    // };

    // export const getRuleScopeByRule = async (rule_rid: string) => {
    //     const rule = await RuleScopeMap.findByPk(rule_rid);
    //     return rule;
    // };

    /** UPDATE RuleMaster by RID */
    async updateScope(scopeRequest: ICreateScope,
        userId: string): Promise<{
            statusCode: number;
            message: string;
            errorMessage?: string;
            data?: { scope: any };
        }> {
        // Build update object dynamically
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        const dbInit = RuleScopeMap.initialize(sequelize);
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
            const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
                dialect: "postgres",
                logging: false, // optional
            });
            RuleScopeMap.initialize(sequelize);
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