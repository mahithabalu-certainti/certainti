import { db } from "../config/db";

export interface RuleAction {
  rid?: number;
  ruleRid: number;
  actionType: string; // e.g., notify_user, change_status
  targetUser?: string;
  newValue?: string;
  createdBy: number;
  modifiedBy?: number;
  createdDatetime?: Date;
  modifiedDatetime?: Date;
}

export const createRuleAction = async (data: RuleAction) => {
  const query = `
    INSERT INTO workflow_rule_action
    (rule_rid, action_type, target_user, new_value, created_by, modified_by)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *;
  `;
  const values = [data.ruleRid, data.actionType, data.targetUser ?? null, data.newValue ?? null, data.createdBy, data.createdBy];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const getRuleActionById = async (rid: number) => {
  const res = await db.query(`SELECT * FROM workflow_rule_action WHERE rid=$1`, [rid]);
  return res.rows[0];
};

export const getActionsByRule = async (ruleRid: number) => {
  const res = await db.query(`SELECT * FROM workflow_rule_action WHERE rule_rid=$1`, [ruleRid]);
  return res.rows;
};

export const updateRuleAction = async (rid: number, data: RuleAction) => {
  const query = `
    UPDATE workflow_rule_action
    SET action_type=$1, target_user=$2, new_value=$3, modified_by=$4, modified_datetime=NOW()
    WHERE rid=$5
    RETURNING *;
  `;
  const values = [data.actionType, data.targetUser ?? null, data.newValue ?? null, data.modifiedBy, rid];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const deleteRuleAction = async (rid: number) => {
  await db.query(`DELETE FROM workflow_rule_action WHERE rid=$1`, [rid]);
  return { message: "Rule action deleted successfully" };
};
