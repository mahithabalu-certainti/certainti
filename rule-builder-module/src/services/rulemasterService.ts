import { RuleMaster, RuleMasterCreationAttributes } from "../models/workflowRuleMaster";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize } from "sequelize";


/** CREATE a new RuleMaster */
export const createRuleMaster = async (data: RuleMasterCreationAttributes) => {
    //const sequelize = await initSequelize();
    const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
        dialect: "postgres",
        logging: false, // optional
    });

    // Initialize model ONCE
    RuleMaster.initialize(sequelize);
    const rule = await RuleMaster.create({
        r_number:data.r_number ?? null,
        eid:data.eid ?? null,
        rule_name: data.rule_name,
        description: data.description ?? null,
        trigger_event: data.trigger_event,
        trigger_type: data.trigger_type,
        is_active: data.is_active ?? true,
        scope_type: data.scope_type,
        schedule_offset_type: data.schedule_offset_type ?? null,
        schedule_offset_value: data.schedule_offset_value ?? null,
        created_by: data.created_by,
        modified_by: data.modified_by ?? data.created_by, // fallback to created_by if undefined
    });

    return rule;
};

/** GET all RuleMasters */
export const getAllRuleMasters = async () => {
    const rules = await RuleMaster.findAll({
        order: [["created_datetime", "DESC"]],
    });
    return rules;
};

/** GET RuleMaster by RID */
export const getRuleMasterById = async (rid: string) => {
    const rule = await RuleMaster.findByPk(rid);
    return rule;
};

/** UPDATE RuleMaster by RID */
export const updateRuleMaster = async (
    rid: string,
    data: Partial<RuleMasterCreationAttributes>
) => {
    // Build update object dynamically
    const updateData: Partial<RuleMasterCreationAttributes> = {
        modified_datetime: new Date(), // always update timestamp
    };

    if (data.rule_name !== undefined) updateData.rule_name = data.rule_name;
    if (data.description !== undefined) updateData.description = data.description; // can be string or undefined
    if (data.trigger_event !== undefined) updateData.trigger_event = data.trigger_event;
    if (data.trigger_type !== undefined) updateData.trigger_type = data.trigger_type;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.scope_type !== undefined) updateData.scope_type = data.scope_type;
    if (data.schedule_offset_type !== undefined) updateData.schedule_offset_type = data.schedule_offset_type;
    if (data.schedule_offset_value !== undefined) updateData.schedule_offset_value = data.schedule_offset_value;
    if (data.modified_by !== undefined) updateData.modified_by = data.modified_by;

    const [updatedCount, [updatedRule]] = await RuleMaster.update(
        updateData,
        {
            where: { rid },
            returning: true,
        }
    );

    return updatedRule;
};


/** DELETE RuleMaster by RID */
export const deleteRuleMaster = async (rid: string) => {
    await RuleMaster.destroy({ where: { rid } });
    return { message: "Rule deleted successfully" };
};
