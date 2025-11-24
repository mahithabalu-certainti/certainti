import { RuleAction, RuleActionCreationAttributes } from "../models/workflowRuleAction";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize } from "sequelize";


/** CREATE a new RuleMaster */
export const createRuleAction = async (data: RuleActionCreationAttributes) => {
    //const sequelize = await initSequelize();
    const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
        dialect: "postgres",
        logging: false, // optional
    });

    // Initialize model ONCE
    RuleAction.initialize(sequelize);
    const action = await RuleAction.create({
        r_number: data.r_number ?? null,
        eid: data.eid ?? null,
        rule_rid: data.rule_rid,
        action_type: data.action_type,
        target_user: data.target_user,
        new_value: data.new_value ?? null,
        action_order: data.action_order,
        message_template: data.message_template,
        metadata: data.metadata,
        created_by: data.created_by,
        modified_by: data.modified_by ?? data.created_by, // fallback to created_by if undefined
    });

    return action;
};

/** GET all RuleMasters */
export const getAllRuleActions = async () => {
    const actions = await RuleAction.findAll({
        order: [["created_datetime", "DESC"]],
    });
    return actions;
};

/** GET RuleMaster by RID */
export const getRuleActionById = async (rid: string) => {
    const actionDetail = await RuleAction.findByPk(rid);
    return actionDetail;
};

export const getRuleActionByRuleRId = async (rule_rid: string) => {
    const actionDetail = await RuleAction.findByPk(rule_rid);
    return actionDetail;
};

/** UPDATE RuleMaster by RID */
export const updateRuleAction = async (
    rid: string,
    data: Partial<RuleActionCreationAttributes>
) => {
    // Build update object dynamically
    const updateData: Partial<RuleActionCreationAttributes> = {
        modified_datetime: new Date(), // always update timestamp
    };

    if (data.rule_rid !== undefined) updateData.rule_rid = data.rule_rid;
    if (data.action_type !== undefined) updateData.action_type = data.action_type; // can be string or undefined
    if (data.target_user !== undefined) updateData.target_user = data.target_user;
    if (data.new_value !== undefined) updateData.new_value = data.new_value;
    if (data.action_order !== undefined) updateData.action_order = data.action_order;
    if (data.message_template !== undefined) updateData.message_template = data.message_template;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.modified_by !== undefined) updateData.modified_by = data.modified_by;

    const [updatedCount, [updatedAction]] = await RuleAction.update(
        updateData,
        {
            where: { rid },
            returning: true,
        }
    );

    return updatedAction;
};


/** DELETE RuleMaster by RID */
export const deleteRuleAction = async (rid: string) => {
    await RuleAction.destroy({ where: { rid } });
    return { message: "Action deleted successfully" };
};
