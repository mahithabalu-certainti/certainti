import { RuleAudit, RuleAuditCreationAttributes } from "../models/workflowRuleAudit";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize } from "sequelize";


/** CREATE a new RuleMaster */
export const createRuleAudit = async (data: RuleAuditCreationAttributes) => {
    //const sequelize = await initSequelize();
    const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
        dialect: "postgres",
        logging: false, // optional
    });

    // Initialize model ONCE
    RuleAudit.initialize(sequelize);
    const rule = await RuleAudit.create({
        r_number: data.r_number ?? null,
        eid: data.eid ?? null,
        rule_rid: data.rule_rid,
        action: data.action,
        old_value: data.old_value,
        new_value: data.new_value,
        notes: data.notes,
        created_by: data.created_by,
        modified_by: data.modified_by ?? data.created_by, // fallback to created_by if undefined
    });

    return rule;
};

/** GET all RuleMasters */
export const getAllRuleAudit = async () => {
    const audits = await RuleAudit.findAll({
        order: [["created_datetime", "DESC"]],
    });
    return audits;
};

/** GET RuleMaster by RID */
export const getRuleAuditById = async (rid: string) => {
    const auditDetail = await RuleAudit.findByPk(rid);
    return auditDetail;
};

export const getRuleAuditByRule = async (rule_rid: string) => {
    const auditDetail = await RuleAudit.findByPk(rule_rid);
    return auditDetail;
};

/** UPDATE RuleMaster by RID */
export const updateRuleAudit = async (
    rid: string,
    data: Partial<RuleAuditCreationAttributes>
) => {
    // Build update object dynamically
    const updateData: Partial<RuleAuditCreationAttributes> = {
        modified_datetime: new Date(), // always update timestamp
    };

    if (data.rule_rid !== undefined) updateData.rule_rid = data.rule_rid;
    if (data.action !== undefined) updateData.action = data.action; // can be string or undefined
    if (data.old_value !== undefined) updateData.old_value = data.old_value;
    if (data.new_value !== undefined) updateData.new_value = data.new_value;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.modified_by !== undefined) updateData.modified_by = data.modified_by;

    const [updatedCount, [updatedRuleAudit]] = await RuleAudit.update(
        updateData,
        {
            where: { rid },
            returning: true,
        }
    );

    return updatedRuleAudit;
};


/** DELETE RuleMaster by RID */
export const deleteRuleAudit = async (rid: string) => {
    await RuleAudit.destroy({ where: { rid } });
    return { message: "Audit deleted successfully" };
};
