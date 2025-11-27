import { RuleAction, RuleActionCreationAttributes } from "../models/workflowRuleAction";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateAction } from "../utils/types";
import { logMessage } from "../utils/helpers";

export class ActionService {

    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    /** CREATE a new Action */
    async createAction(actionRequest: ICreateAction, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { action: any };
    }> {
        //const sequelize = await initSequelize();
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        RuleAction.initialize(sequelize);
        const action = await RuleAction.create({
            rule_rid: actionRequest.rule_rid,
            action_type: actionRequest.action_type,
            target_user: actionRequest.target_user,
            new_value: actionRequest.new_value ?? null,
            action_order: actionRequest.action_order,
            message_template: actionRequest.message_template,
            metadata: actionRequest.metadata,
            created_by: actionRequest.created_by,
            modified_by: actionRequest.modified_by ?? actionRequest.created_by, // fallback to created_by if undefined
        });

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.actionCreated,
            data: {
                action: action,
            },
        };
    };

    /** GET all RuleMasters */
    async listActions(
        data: any,
        filters: Record<string, any>,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { actions: any; count: number };
    }> {
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        RuleAction.initialize(sequelize);
        const limit = data.limit;
        const offset = (data.page - 1) * limit;
        const { rows, count } = await RuleAction.findAndCountAll({
            order: [[data.sortBy, data.sortOrder]],
            limit,
            offset
        });
        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
                actions: rows,
                count: count,
            },
        };
    };

    /** GET RuleMaster by RID */
    // export const getRuleActionById = async (rid: string) => {
    //     const actionDetail = await RuleAction.findByPk(rid);
    //     return actionDetail;
    // };

    // export const getRuleActionByRuleRId = async (rule_rid: string) => {
    //     const actionDetail = await RuleAction.findByPk(rule_rid);
    //     return actionDetail;
    // };

    /** UPDATE RuleMaster by RID */
    async updateAction(
        actionRequest: ICreateAction,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { action: any };
    }> {
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        const dbInit = RuleAction.initialize(sequelize);
        const UpdateResponse = await RuleAction.update(
            {
                ...actionRequest,
                modified_by: "userId",
                modified_datetime: new Date(),
            },
            {
                where: { rid: actionRequest.action_rid },
            }
        );

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.actionUpdated,
            data: {
                action: {},
            },
        };
    };


    /** DELETE RuleMaster by RID */
    async deleteAction(data: any, userId: string) {
        try {
            const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
                dialect: "postgres",
                logging: false, // optional
            });
            RuleAction.initialize(sequelize);
            await RuleAction.destroy({ where: { rid: data.action_rid } });
            return {
                statusCode: HttpStatus.SUCCESS,
                message: STATUS_MESSAGE.actionDeleteSuccess,
            };
        } catch (err) {
            console.log(`Error deleting, ${err}`)
            return {
                statusCode: HttpStatus.FAILED,
                message: STATUS_MESSAGE.actionDeleteFailed,
            };
        }
    };
}