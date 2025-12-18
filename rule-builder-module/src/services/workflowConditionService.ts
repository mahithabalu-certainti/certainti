import { Condition, ConditionCreationAttributes } from "../models/workflowRuleCondition";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateCondition } from "../utils/types";
import { logMessage } from "../utils/helpers";
import { AuditService } from "./workflowAuditService";

export class ConditionService {

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

    /** CREATE a new Condition */
    async createCondition(conditionRequest: ICreateCondition, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { condition: any };
    }> {
        const mainDb = await this.getMainDb();
        Condition.initialize(mainDb);
        const condition = await Condition.create({
            rule_rid: conditionRequest.rule_rid,
            category_rid: conditionRequest.category_rid,
            logical_operator: conditionRequest.logical_operator,
            field_rid: conditionRequest.field_rid,
            operator_rid: conditionRequest.operator_rid,
            value_rid: conditionRequest.value_rid,
            data_type: conditionRequest.data_type ?? null,
            sequence: conditionRequest.sequence,
            group_id: conditionRequest.group_id,
            created_by: conditionRequest.created_by,
            //modified_by: conditionRequest.modified_by ?? conditionRequest.created_by, // fallback to created_by if undefined
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
        const mainDb = await this.getMainDb();
        Condition.initialize(mainDb);
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
        const mainDb = await this.getMainDb();
        const dbInit = Condition.initialize(mainDb);
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
    async deleteConditionsByRuleRid(rule_rid: any, userId: string) {
        try {
            const mainDb = await this.getMainDb();
            Condition.initialize(mainDb);
            await Condition.destroy({ where: { rule_rid: rule_rid } });
            await this.auditService.createAudit({
                action: "DELETE",
                audit_rid: "",
                rule_rid: rule_rid,
                old_value: "",
                new_value: "",
                notes: "Rule condition deleted",
                created_by: userId,
                modified_by: userId,
            }, userId);
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