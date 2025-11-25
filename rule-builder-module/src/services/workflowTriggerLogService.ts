import { RuleTriggerLog, RuleTriggerLogCreationAttributes } from "../models/workflowRuleTriggerLog";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize } from "sequelize";


/** CREATE a new RuleMaster */
export const createRuleTriggerLog = async (data: RuleTriggerLogCreationAttributes) => {
    //const sequelize = await initSequelize();
    const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
        dialect: "postgres",
        logging: false, // optional
    });

    // Initialize model ONCE
    RuleTriggerLog.initialize(sequelize);
    const rule = await RuleTriggerLog.create({
        r_number: data.r_number ?? null,
        eid: data.eid ?? null,
        rule_rid: data.rule_rid,
        event_name: data.event_name,
        event_time: data.event_time,
        context_entity_id: data.context_entity_id,
        status: data.status,
        message: data.message,
        created_by: data.created_by,
        modified_by: data.modified_by ?? data.created_by, // fallback to created_by if undefined
    });

    return rule;
};

/** GET all RuleMasters */
export const getAllRuleTriggerLogs = async () => {
    const triggerLogs = await RuleTriggerLog.findAll({
        order: [["created_datetime", "DESC"]],
    });
    return triggerLogs;
};

/** GET RuleMaster by RID */
export const getRuleTriggerLogById = async (rid: string) => {
    const logDetail = await RuleTriggerLog.findByPk(rid);
    return logDetail;
};

export const getRuleTriggerLogByRule = async (rule_rid: string) => {
    const logDetail = await RuleTriggerLog.findByPk(rule_rid);
    return logDetail;
};

/** UPDATE RuleMaster by RID */
export const updateRuleTriggerLog = async (
    rid: string,
    data: Partial<RuleTriggerLogCreationAttributes>
) => {
    // Build update object dynamically
    const updateData: Partial<RuleTriggerLogCreationAttributes> = {
        modified_datetime: new Date(), // always update timestamp
    };

    if (data.rule_rid !== undefined) updateData.rule_rid = data.rule_rid;
    if (data.event_name !== undefined) updateData.event_name = data.event_name; // can be string or undefined
    if (data.event_time !== undefined) updateData.event_time = data.event_time;
    if (data.context_entity_id !== undefined) updateData.context_entity_id = data.context_entity_id;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.message !== undefined) updateData.message = data.message;
    if (data.modified_by !== undefined) updateData.modified_by = data.modified_by;

    const [updatedCount, [updatedTriggerLog]] = await RuleTriggerLog.update(
        updateData,
        {
            where: { rid },
            returning: true,
        }
    );

    return updatedTriggerLog;
};


/** DELETE RuleMaster by RID */
export const deleteRuleTriggerLog = async (rid: string) => {
    await RuleTriggerLog.destroy({ where: { rid } });
    return { message: "TriggerLog deleted successfully" };
};
