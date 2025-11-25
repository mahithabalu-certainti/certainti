import { RuleScheduleQueue, RuleScheduleQueueCreationAttributes } from "../models/workflowRuleScheduleQueue";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize } from "sequelize";


/** CREATE a new RuleMaster */
export const createRuleSchedule = async (data: RuleScheduleQueueCreationAttributes) => {
    //const sequelize = await initSequelize();
    const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
        dialect: "postgres",
        logging: false, // optional
    });

    // Initialize model ONCE
    RuleScheduleQueue.initialize(sequelize);
    const rule = await RuleScheduleQueue.create({
        r_number: data.r_number ?? null,
        eid: data.eid ?? null,
        rule_rid: data.rule_rid,
        related_task_rid: data.related_task_rid,
        scheduled_datetime: data.scheduled_datetime,
        executed_datetime: data.executed_datetime,
        executed: data.executed ?? true,
        created_by: data.created_by,
        modified_by: data.modified_by ?? data.created_by, // fallback to created_by if undefined
    });

    return rule;
};

/** GET all RuleMasters */
export const getAllRuleScheduleQueue = async () => {
    const queues = await RuleScheduleQueue.findAll({
        order: [["created_datetime", "DESC"]],
    });
    return queues;
};

/** GET RuleMaster by RID */
export const getRuleScheduleById = async (rid: string) => {
    const queue = await RuleScheduleQueue.findByPk(rid);
    return queue;
};

export const getRuleScheduleByRule = async (rule_rid: string) => {
    const queue = await RuleScheduleQueue.findByPk(rule_rid);
    return queue;
};

export const markScheduleExecuted = async (rule_rid: string) => {
    const queue = await RuleScheduleQueue.findByPk(rule_rid);
    return queue;
};

/** UPDATE RuleMaster by RID */
export const updateRuleSchedule = async (
    rid: string,
    data: Partial<RuleScheduleQueueCreationAttributes>
) => {
    // Build update object dynamically
    const updateData: Partial<RuleScheduleQueueCreationAttributes> = {
        modified_datetime: new Date(), // always update timestamp
    };

    if (data.rule_rid !== undefined) updateData.rule_rid = data.rule_rid;
    if (data.related_task_rid !== undefined) updateData.related_task_rid = data.related_task_rid; // can be string or undefined
    if (data.scheduled_datetime !== undefined) updateData.scheduled_datetime = data.scheduled_datetime;
    if (data.executed_datetime !== undefined) updateData.executed_datetime = data.executed_datetime;
    if (data.executed !== undefined) updateData.executed = data.executed;
    if (data.modified_by !== undefined) updateData.modified_by = data.modified_by;

    const [updatedCount, [updatedRuleSchedule]] = await RuleScheduleQueue.update(
        updateData,
        {
            where: { rid },
            returning: true,
        }
    );

    return updatedRuleSchedule;
};


/** DELETE RuleMaster by RID */
export const deleteRuleSchedule = async (rid: string) => {
    await RuleScheduleQueue.destroy({ where: { rid } });
    return { message: "Schedule deleted successfully" };
};
