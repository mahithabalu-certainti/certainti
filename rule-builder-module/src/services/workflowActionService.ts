import { RuleAction, RuleActionCreationAttributes } from "../models/workflowRuleAction";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateAction } from "../utils/types";
import { logMessage } from "../utils/helpers";
import { AuditService } from "./workflowAuditService";

export class ActionService {

    private logger: Logger;
    private auditService: AuditService;
    private mainDbSequelize: Sequelize | null = null;

    constructor(logger: Logger) {
        this.logger = logger;
        this.auditService = new AuditService(this.logger);
    }

    private async getMainDb() {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initSequelize();
        }
        return this.mainDbSequelize;
    }

    /** CREATE a new Action */
    async createAction(actionRequest: ICreateAction, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { action: any };
    }> {
        const mainDb = await this.getMainDb();
        RuleAction.initialize(mainDb);
        const action = await RuleAction.create({
            rule_rid: actionRequest.rule_rid,
            action_rid: actionRequest.action_rid,
            target_user: actionRequest.target_user,
            new_value: actionRequest.new_value ?? null,
            action_order: actionRequest.action_order,
            created_by: actionRequest.created_by,
            //modified_by: actionRequest.modified_by ?? actionRequest.created_by, // fallback to created_by if undefined
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
        const mainDb = await this.getMainDb();
        RuleAction.initialize(mainDb);
        const limit = data.limit;
        const offset = (data.page - 1) * limit;
        const where: any = {};

        if (filters && Object.keys(filters).length > 0) {
            for (const key in filters) {
                if (filters[key] !== undefined && filters[key] !== null) {
                    // You can also add LIKE support here if needed
                    if (key === "action_type") {
                        where[key] = { [Op.iLike]: `%${filters[key]}%` };
                    } else {
                        where[key] = filters[key];
                    }
                }
            }
        }

        const { rows, count } = await RuleAction.findAndCountAll({
            where,
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
        const mainDb = await this.getMainDb();
        const dbInit = RuleAction.initialize(mainDb);
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
    async deleteActionByRuleRid(rule_rid: any, userId: string) {
        try {
            const mainDb = await this.getMainDb();
            RuleAction.initialize(mainDb);
            await RuleAction.destroy({ where: { rule_rid: rule_rid } });
            await this.auditService.createAudit({
                action: "DELETE",
                audit_rid: "",
                rule_rid: rule_rid,
                old_value: "",
                new_value: "",
                notes: "Rule action deleted",
                created_by: userId,
                modified_by: userId,
            }, userId);
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