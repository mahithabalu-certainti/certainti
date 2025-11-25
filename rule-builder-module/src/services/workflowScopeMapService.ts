import { RuleScopeMap, RuleScopeMapCreationAttributes } from "../models/workflowRuleScopeMap";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize } from "sequelize";


/** CREATE a new RuleMaster */
export const createRuleScopeMap = async (data: RuleScopeMapCreationAttributes) => {
    //const sequelize = await initSequelize();
    const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
        dialect: "postgres",
        logging: false, // optional
    });

    // Initialize model ONCE
    RuleScopeMap.initialize(sequelize);
    const rule = await RuleScopeMap.create({
        r_number: data.r_number ?? null,
        eid: data.eid ?? null,
        rule_rid: data.rule_rid,
        scope_entity_type: data.scope_entity_type ?? null,
        scope_entity_rid: data.scope_entity_rid,
        is_active: data.is_active ?? true,
        created_by: data.created_by,
        modified_by: data.modified_by ?? data.created_by,
    });

    return rule;
};

/** GET all RuleMasters */
export const getAllRuleScopes = async () => {
    const rules = await RuleScopeMap.findAll({
        order: [["created_datetime", "DESC"]],
    });
    return rules;
};

/** GET RuleMaster by RID */
export const getRuleScopeById = async (rid: string) => {
    const rule = await RuleScopeMap.findByPk(rid);
    return rule;
};

export const getRuleScopeByRule = async (rule_rid: string) => {
    const rule = await RuleScopeMap.findByPk(rule_rid);
    return rule;
};

/** UPDATE RuleMaster by RID */
export const updateRuleScope = async (
    rid: string,
    data: Partial<RuleScopeMapCreationAttributes>
) => {
    // Build update object dynamically
    const updateData: Partial<RuleScopeMapCreationAttributes> = {
        modified_datetime: new Date(), // always update timestamp
    };

    if (data.rule_rid !== undefined) updateData.rule_rid = data.rule_rid;
    if (data.scope_entity_type !== undefined) updateData.scope_entity_type = data.scope_entity_type; // can be string or undefined
    if (data.scope_entity_rid !== undefined) updateData.scope_entity_rid = data.scope_entity_rid;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.modified_by !== undefined) updateData.modified_by = data.modified_by;

    const [updatedCount, [updatedRule]] = await RuleScopeMap.update(
        updateData,
        {
            where: { rid },
            returning: true,
        }
    );

    return updatedRule;
};


/** DELETE RuleMaster by RID */
export const deleteRuleScope = async (rid: string) => {
    await RuleScopeMap.destroy({ where: { rid } });
    return { message: "Scope deleted successfully" };
};
