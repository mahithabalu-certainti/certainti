import { Condition, ConditionCreationAttributes } from "../models/workflowRuleCondition";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateCondition, IUpdateCondition } from "../utils/types";
import { logMessage } from "../utils/helpers";
import { RuleHistoryService } from "./workflowRuleHistoryService";

export class ConditionService {

    private logger: Logger;
    private ruleHistoryService: RuleHistoryService;
    private mainDbSequelize: Sequelize | null = null;

    constructor(logger: Logger) {
        this.logger = logger;
        this.ruleHistoryService = new RuleHistoryService(this.logger);
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


    async getConditionsByRuleRid(ruleRid: string): Promise<any[]> {
        const mainDb = await this.getMainDb();
        Condition.initialize(mainDb);
        const conditions = await Condition.findAll({
            where: {
                rule_rid: ruleRid,
            },
            order: [['sequence', 'ASC']], // IMPORTANT for update-by-index logic
        });
        return conditions;
    }

    /** UPDATE RuleMaster by RID */
    async updateCondition(
        conditionRequest: IUpdateCondition,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { condition: any };
    }> {
        const mainDb = await this.getMainDb();
        const dbInit = Condition.initialize(mainDb);

        const oldCondition = await Condition.findOne({ where: { rid: conditionRequest.rid } });
        if (!oldCondition) {
            return {
                statusCode: HttpStatus.NOT_FOUND,
                message: "",
            };
        }
        const oldRuleData = oldCondition.toJSON();
        const historyRecords = [];
        // Compare and prepare history records for each field
        const fieldsToUpdate = [
            { field: 'category_rid', oldValue: oldRuleData.category_rid, newValue: conditionRequest.category_rid },
            { field: 'field_rid', oldValue: oldRuleData.field_rid, newValue: conditionRequest.field_rid ?? null },
            { field: 'operator_rid', oldValue: oldRuleData.operator_rid, newValue: conditionRequest.operator_rid ?? null },
            { field: 'value_rid', oldValue: oldRuleData.value_rid, newValue: conditionRequest.value_rid },
        ];
        for (const { field, oldValue, newValue } of fieldsToUpdate) {
            if (oldValue !== newValue) {
                try {
                    historyRecords.push({
                        rule_rid: oldRuleData.rule_rid,
                        attribute_name: field,
                        old_value: oldValue,
                        new_value: newValue,
                        created_by: userId,
                        action: 'ruleCondition'
                    });
                } catch (err) {
                    console.log(err);
                }
            }
        }
        for (const history of historyRecords) {
            await this.ruleHistoryService.createHistory(history, userId);
        }

        const caseUpdateResponse = await Condition.update(
            {
                ...conditionRequest,
                modified_by: userId,
                modified_datetime: new Date(),
            },
            {
                where: { rid: conditionRequest.rid },
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
    async deleteCondition(condition_rid: string, rule_rid: string, userId: string) {
        try {
            const mainDb = await this.getMainDb();
            Condition.initialize(mainDb);
            await Condition.destroy({ where: { rule_rid: rule_rid, rid: condition_rid } });
             await this.ruleHistoryService.createHistory({
                rule_rid: rule_rid,
                attribute_name: "condition_rid",
                old_value: condition_rid,
                new_value: null,
                created_by: userId,
                action: 'conditionDelete'
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