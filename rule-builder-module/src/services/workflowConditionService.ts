import { Condition, ConditionCreationAttributes } from "../models/workflowRuleCondition";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize } from "sequelize";


/** CREATE a new RuleMaster */
export const createCondition = async (data: ConditionCreationAttributes) => {
    //const sequelize = await initSequelize();
    const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
        dialect: "postgres",
        logging: false, // optional
    });

    // Initialize model ONCE
    Condition.initialize(sequelize);
    const condition = await Condition.create({
        r_number: data.r_number ?? null,
        eid: data.eid ?? null,
        logical_operator: data.logical_operator,
        field_name: data.field_name,
        operator: data.operator,
        value: data.value,
        data_type: data.data_type ?? null,
        sequence: data.sequence,
        group_id: data.group_id,
        created_by: data.created_by,
        modified_by: data.modified_by ?? data.created_by, // fallback to created_by if undefined
    });

    return condition;
};

/** GET all RuleMasters */
export const getAllConditions = async () => {
    const rules = await Condition.findAll({
        order: [["created_datetime", "DESC"]],
    });
    return rules;
};

/** GET RuleMaster by RID */
export const getConditionById = async (rid: string) => {
    const rule = await Condition.findByPk(rid);
    return rule;
};

/** UPDATE RuleMaster by RID */
export const updateCondition = async (
    rid: string,
    data: Partial<ConditionCreationAttributes>
) => {
    // Build update object dynamically
    const updateData: Partial<ConditionCreationAttributes> = {
        modified_datetime: new Date(), // always update timestamp
    };

    if (data.logical_operator !== undefined) updateData.logical_operator = data.logical_operator;
    if (data.field_name !== undefined) updateData.field_name = data.field_name; // can be string or undefined
    if (data.operator !== undefined) updateData.operator = data.operator;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.data_type !== undefined) updateData.data_type = data.data_type;
    if (data.sequence !== undefined) updateData.sequence = data.sequence;
    if (data.modified_by !== undefined) updateData.modified_by = data.modified_by;

    const [updatedCount, [updatedRule]] = await Condition.update(
        updateData,
        {
            where: { rid },
            returning: true,
        }
    );

    return updatedRule;
};


/** DELETE RuleMaster by RID */
export const deleteCondition = async (rid: string) => {
    await Condition.destroy({ where: { rid } });
    return { message: "Rule deleted successfully" };
};
