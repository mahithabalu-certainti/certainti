import { db } from "../config/db";

export interface RuleAction {
  rid?: string;
  ruleRid: string;
  actionType: string; // e.g., notify_user, change_status
  targetUser?: string;
  newValue?: string;
  actionOrder: number;
  messageTemplate: string;
  metadata: string;
  createdBy: number;
  modifiedBy?: number;
  createdDatetime?: Date;
  modifiedDatetime?: Date;
}

export const createRuleAction = async (data: RuleAction) => {
  const query = `
    INSERT INTO workflow_rule_action
    (rid,rule_rid, action_type, target_user, new_value, action_order, message_template, metadata, created_by, modified_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *;
  `;
  const values = [data.rid, data.ruleRid, data.actionType, data.targetUser ?? null, data.newValue ?? null, data.actionOrder, data.messageTemplate, data.metadata, data.createdBy, data.createdBy];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const getRuleActionById = async (rid: number) => {
  const res = await db.query(`SELECT * FROM workflow_rule_action WHERE rid=$1`, [rid]);
  return res.rows[0];
};

export const getActionsByRule = async (ruleRid: string) => {
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
