import { RuleMaster } from "../models/workflowRuleMaster";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateRule, IUpdateRule } from "../utils/types";
import { logMessage } from "../utils/helpers";
import { AuditService } from "./workflowAuditService";

export class RulemasterService {

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
            condition_rid: ruleRequest.condition_rid ?? null,
            event_rid: ruleRequest.event_rid,
            trigger_type: ruleRequest.trigger_type,
            is_active: ruleRequest.is_active ?? true,
            scope_type_rid: ruleRequest.scope_type_rid,
            schedule_offset_type: ruleRequest.schedule_offset_type ?? null,
            schedule_offset_value: ruleRequest.schedule_offset_value ?? null,
            created_by: ruleRequest.created_by,
            //modified_by: ruleRequest.modified_by ?? ruleRequest.created_by, // fallback to created_by if undefined
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

    async updateRuleMaster(
        ruleRequest: IUpdateRule,
        userId: string
    ) {
        const mainDb = await this.getMainDb();
        RuleMaster.initialize(mainDb);
        const rule = await RuleMaster.findOne({ where: { rid: ruleRequest.rule_rid } });
        if (!rule) {
            return {
                statusCode: HttpStatus.NOT_FOUND,
                message: "",
            };
        }
        // Capture OLD state
        const oldValue = rule.toJSON();
        //Update rule
        await rule.update({
            rule_name: ruleRequest.rule_name,
            description: ruleRequest.description ?? null,
            condition_rid: ruleRequest.condition_rid ?? null,
            event_rid: ruleRequest.event_rid,
            trigger_type: ruleRequest.trigger_type,
            is_active: ruleRequest.is_active ?? true,
            scope_type_rid: ruleRequest.scope_type_rid,
            schedule_offset_type: ruleRequest.schedule_offset_type ?? null,
            schedule_offset_value: ruleRequest.schedule_offset_value ?? null,
            modified_by: ruleRequest.modified_by,
        });

        // const updateRule = await RuleMaster.update({
        //     rule_name: ruleRequest.rule_name,
        //     description: ruleRequest.description ?? null,
        //     condition_rid: ruleRequest.condition_rid ?? null,
        //     event_rid: ruleRequest.event_rid,
        //     trigger_type: ruleRequest.trigger_type,
        //     is_active: ruleRequest.is_active ?? true,
        //     scope_type_rid: ruleRequest.scope_type_rid,
        //     schedule_offset_type: ruleRequest.schedule_offset_type ?? null,
        //     schedule_offset_value: ruleRequest.schedule_offset_value ?? null,
        //     modified_by: ruleRequest.modified_by,
        // },{
        //     where: { rid: ruleRequest.rule_rid }
        // });

        // Capture NEW state
        const newValue = rule.toJSON();

        // Write AUDIT record
        await this.auditService.createAudit({
            action: "UPDATE",
            audit_rid: "",
            rule_rid: ruleRequest.rule_rid,
            old_value: JSON.stringify(oldValue),
            new_value: JSON.stringify(newValue),
            notes: "Rule updated",
            created_by: ruleRequest.modified_by ?? userId,
            modified_by: ruleRequest.modified_by ?? userId,
        }, userId);

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.ruleUpdated,
            data: {
                rules: rule,
            },
        };
    }

    /** UPDATE RuleMaster by RID */
    // async updateRuleMaster(
    //     rulerequest: ICreateRule, userId: string
    // ): Promise<{
    //     statusCode: number;
    //     message: string;
    //     errorMessage?: string;
    //     data?: { rules: any };
    // }> {
    //     try {
    //         const mainDb = await this.getMainDb();
    //         RuleMaster.initialize(mainDb);
    //         const existingCase = await RuleMaster.findOne({
    //             where: { rid: rulerequest.rule_rid },
    //         });
    //         const caseUpdateResponse = await RuleMaster.update(
    //             {
    //                 ...rulerequest,
    //                 modified_by: "userId",
    //                 modified_datetime: new Date(),
    //             },
    //             {
    //                 where: { rid: rulerequest.rule_rid },
    //             }
    //         );

    //         return {
    //             statusCode: HttpStatus.SUCCESS,
    //             message: STATUS_MESSAGE.ruleUpdated,
    //             data: {
    //                 rules: {},
    //             },
    //         };
    //     } catch (err) {
    //         logMessage(`Error updating case, ${err}`);
    //         //await transaction.rollback();
    //         return {
    //             statusCode: HttpStatus.FAILED,
    //             message: HttpStatus.FAILED_MESSAGE,
    //             errorMessage: STATUS_MESSAGE.ruleCreationFailed,
    //         };
    //     }
    // };


    async getRuleDetailByRuleRid(
        ruleRid: string, userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: any;
    }> {
        const mainDb = await this.getMainDb();
        RuleMaster.initialize(mainDb);
        console.log("ruleRid" + ruleRid);
        const rule = await RuleMaster.findOne({ where: { rid: ruleRid } });
        if (!rule) {
            return {
                statusCode: HttpStatus.NOT_FOUND,
                message: "",
            };
        }
        return {
            statusCode: HttpStatus.SUCCESS,
            message: "",
            data: rule
        };
    }


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