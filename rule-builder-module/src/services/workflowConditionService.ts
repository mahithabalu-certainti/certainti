import { Condition, ConditionCreationAttributes } from "../models/workflowRuleCondition";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateCondition } from "../utils/types";
import { logMessage } from "../utils/helpers";

export class ConditionService {

    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    /** CREATE a new Condition */
    async createCondition(conditionRequest: ICreateCondition, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { condition: any };
    }> {
        //const sequelize = await initSequelize();
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        // Initialize model ONCE
        Condition.initialize(sequelize);
        const condition = await Condition.create({
            logical_operator: conditionRequest.logical_operator,
            field_name: conditionRequest.field_name,
            operator: conditionRequest.operator,
            value: conditionRequest.value,
            data_type: conditionRequest.data_type ?? null,
            sequence: conditionRequest.sequence,
            group_id: conditionRequest.group_id,
            created_by: conditionRequest.created_by,
            modified_by: conditionRequest.modified_by ?? conditionRequest.created_by, // fallback to created_by if undefined
        });

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.conditionCreated,
            data: {
                condition: condition,
            },
        };
    };

    /** GET all Conditions */
    async listConditions(
        data: any,
        filters: Record<string, any>,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { conditions: any; count: number };
    }> {
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        Condition.initialize(sequelize);
        const limit = data.limit;
        const offset = (data.page - 1) * limit;
        const where: any = {};

        if (filters && Object.keys(filters).length > 0) {
            for (const key in filters) {
                if (filters[key] !== undefined && filters[key] !== null) {
                    // You can also add LIKE support here if needed
                    if (key === "field_name") {
                        where[key] = { [Op.iLike]: `%${filters[key]}%` };
                    } else {
                        where[key] = filters[key];
                    }
                }
            }
        }
        const { rows, count } = await Condition.findAndCountAll({
            where,
            order: [[data.sortBy, data.sortOrder]],
            limit,
            offset
        });
        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
                conditions: rows,
                count: count,
            },
        };
    };

    /** GET RuleMaster by RID */
    // export const getConditionById = async (rid: string) => {
    //     const rule = await Condition.findByPk(rid);
    //     return rule;
    // };

    /** UPDATE RuleMaster by RID */
    async updateCondition(
        conditionRequest: ICreateCondition,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { condition: any };
    }> {
        // Build update object dynamically
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        const dbInit = Condition.initialize(sequelize);
        const caseUpdateResponse = await Condition.update(
            {
                ...conditionRequest,
                modified_by: "userId",
                modified_datetime: new Date(),
            },
            {
                where: { rid: conditionRequest.condition_rid },
            }
        );

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.conditionUpdated,
            data: {
                condition: {},
            },
        };
    };


    /** DELETE RuleMaster by RID */
    async deleteCondition(data: any, userId: string) {
        try {
            const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
                dialect: "postgres",
                logging: false, // optional
            });
            Condition.initialize(sequelize);
            await Condition.destroy({ where: { rid: data.condition_rid } });
            return {
                statusCode: HttpStatus.SUCCESS,
                message: STATUS_MESSAGE.conditionDeleteSuccess,
            };
        } catch (err) {
            console.log(`Error deleting, ${err}`)
            return {
                statusCode: HttpStatus.FAILED,
                message: STATUS_MESSAGE.conditionDeleteFailed,
            };
        }
    };

}