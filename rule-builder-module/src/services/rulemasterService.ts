import { RuleMaster, RuleMasterCreationAttributes } from "../models/workflowRuleMaster";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateRule } from "../utils/types";

export class RulemasterService {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    /** CREATE a new RuleMaster */
    async createRuleMaster(ruleRequest: ICreateRule, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { rules: any };
    }> {
        //const sequelize = await initSequelize();
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });

        // Initialize model ONCE
        RuleMaster.initialize(sequelize);
        const rulem = await RuleMaster.create({
            rule_name: ruleRequest.rule_name,
            description: ruleRequest.description ?? null,
            trigger_event: ruleRequest.trigger_event,
            trigger_type: ruleRequest.trigger_type,
            is_active: ruleRequest.is_active ?? true,
            scope_type: ruleRequest.scope_type,
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
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        RuleMaster.initialize(sequelize);
        const limit = data.limit;
        const offset = (data.page - 1) * limit;
        const { rows, count } = await RuleMaster.findAndCountAll({
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

    /** GET RuleMaster by RID */
    // export const getRuleMasterById = async (rid: string) => {
    //     const rule = await RuleMaster.findByPk(rid);
    //     return rule;
    // };

    /** UPDATE RuleMaster by RID */
    // export const updateRuleMaster = async (
    //     rid: string,
    //     data: Partial<RuleMasterCreationAttributes>
    // ) => {
    //     // Build update object dynamically
    //     const updateData: Partial<RuleMasterCreationAttributes> = {
    //         modified_datetime: new Date(), // always update timestamp
    //     };

    //     if (data.rule_name !== undefined) updateData.rule_name = data.rule_name;
    //     if (data.description !== undefined) updateData.description = data.description; // can be string or undefined
    //     if (data.trigger_event !== undefined) updateData.trigger_event = data.trigger_event;
    //     if (data.trigger_type !== undefined) updateData.trigger_type = data.trigger_type;
    //     if (data.is_active !== undefined) updateData.is_active = data.is_active;
    //     if (data.scope_type !== undefined) updateData.scope_type = data.scope_type;
    //     if (data.schedule_offset_type !== undefined) updateData.schedule_offset_type = data.schedule_offset_type;
    //     if (data.schedule_offset_value !== undefined) updateData.schedule_offset_value = data.schedule_offset_value;
    //     if (data.modified_by !== undefined) updateData.modified_by = data.modified_by;

    //     const [updatedCount, [updatedRule]] = await RuleMaster.update(
    //         updateData,
    //         {
    //             where: { rid },
    //             returning: true,
    //         }
    //     );

    //     return updatedRule;
    // };


    // /** DELETE RuleMaster by RID */
    // export const deleteRuleMaster = async (rid: string) => {
    //     await RuleMaster.destroy({ where: { rid } });
    //     return { message: "Rule deleted successfully" };
    // };

}