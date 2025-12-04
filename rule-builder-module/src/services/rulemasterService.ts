import { RuleMaster } from "../models/workflowRuleMaster";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateRule } from "../utils/types";
import { logMessage } from "../utils/helpers";

export class RulemasterService {

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

    /** CREATE a new RuleMaster */
    async createRuleMaster(ruleRequest: ICreateRule, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { rules: any };
    }> {
        const mainDb = await this.getMainDb();
        RuleMaster.initialize(mainDb);
        const rulem = await RuleMaster.create({
            rule_name: ruleRequest.rule_name,
            description: ruleRequest.description ?? null,
            trigger_event: ruleRequest.trigger_event,
            trigger_type: ruleRequest.trigger_type,
            is_active: ruleRequest.is_active ?? true,
            scope_type_rid: ruleRequest.scope_type_rid,
            schedule_offset_type: ruleRequest.schedule_offset_type ?? null,
            schedule_offset_value: ruleRequest.schedule_offset_value ?? null,
            created_by: ruleRequest.created_by,
            modified_by: ruleRequest.modified_by ?? ruleRequest.created_by, // fallback to created_by if undefined
        });

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.ruleCreated,
            data: {
                rules: rulem,
            },
        };
    };

    /** GET all RuleMasters */
    async listRuleMasters(
        data: any,
        filters: Record<string, any>,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { rules: any; count: number };
    }> {
        console.log("listing all rules");
        const mainDb = await this.getMainDb();
        RuleMaster.initialize(mainDb);
        const limit = data.limit;
        const offset = (data.page - 1) * limit;

        const where: any = {};

        if (filters && Object.keys(filters).length > 0) {
            for (const key in filters) {
                if (filters[key] !== undefined && filters[key] !== null) {
                    // You can also add LIKE support here if needed
                    if (key === "rule_name" || key === "description") {
                        where[key] = { [Op.iLike]: `%${filters[key]}%` };
                    } else {
                        // Exact match for other fields
                        where[key] = filters[key];
                    }
                }
            }
        }

        const { rows, count } = await RuleMaster.findAndCountAll({
            where,
            order: [[data.sortBy, data.sortOrder]],
            limit,
            offset
        });

        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
                rules: rows,
                count: count,
            },
        };
    };

    /** UPDATE RuleMaster by RID */
    async updateRuleMaster(
        rulerequest: ICreateRule, userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { rules: any };
    }> {
        try {
            const mainDb = await this.getMainDb();
            RuleMaster.initialize(mainDb);
            const existingCase = await RuleMaster.findOne({
                where: { rid: rulerequest.rule_rid },
            });
            const caseUpdateResponse = await RuleMaster.update(
                {
                    ...rulerequest,
                    modified_by: "userId",
                    modified_datetime: new Date(),
                },
                {
                    where: { rid: rulerequest.rule_rid },
                }
            );

            return {
                statusCode: HttpStatus.SUCCESS,
                message: STATUS_MESSAGE.ruleUpdated,
                data: {
                    rules: {},
                },
            };
        } catch (err) {
            logMessage(`Error updating case, ${err}`);
            //await transaction.rollback();
            return {
                statusCode: HttpStatus.FAILED,
                message: HttpStatus.FAILED_MESSAGE,
                errorMessage: STATUS_MESSAGE.ruleCreationFailed,
            };
        }
    };


    // /** DELETE RuleMaster by RID */
    async deleteRuleMaster(data: any, userId: string) {
        try {
            const mainDb = await this.getMainDb();
            RuleMaster.initialize(mainDb);
            await RuleMaster.destroy({ where: { rid: data.rule_rid } });
            return {
                statusCode: HttpStatus.SUCCESS,
                message: STATUS_MESSAGE.ruleDeleteSuccess,
            };
        } catch (err) {
            console.log(`Error deleting, ${err}`)
            return {
                statusCode: HttpStatus.FAILED,
                message: STATUS_MESSAGE.ruleDeleteFailed,
            };
        }
    };

}