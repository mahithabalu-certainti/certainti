import { db } from "../config/db";

export interface ConditionGroup {
  rid?: number;
  ruleRid: number;
  groupOperator?: "AND" | "OR";
  createdDatetime?: Date;
}

export const createConditionGroup = async (data: ConditionGroup) => {
  const query = `
    INSERT INTO workflow_rule_condition_group (rule_rid, group_operator)
    VALUES ($1,$2)
    RETURNING *;
  `;
  const values = [data.ruleRid, data.groupOperator ?? "AND"];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const getConditionGroupById = async (rid: number) => {
  const res = await db.query(`SELECT * FROM workflow_rule_condition_group WHERE rid=$1`, [rid]);
  return res.rows[0];
};

export const getConditionGroupsByRule = async (ruleRid: number) => {
  const res = await db.query(`SELECT * FROM workflow_rule_condition_group WHERE rule_rid=$1`, [ruleRid]);
  return res.rows;
};

export const updateConditionGroup = async (rid: number, data: ConditionGroup) => {
  const query = `
    UPDATE workflow_rule_condition_group
    SET group_operator=$1
    WHERE rid=$2
    RETURNING *;
  `;
  const values = [data.groupOperator ?? "AND", rid];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const deleteConditionGroup = async (rid: number) => {
  await db.query(`DELETE FROM workflow_rule_condition_group WHERE rid=$1`, [rid]);
  return { message: "Condition group deleted successfully" };
};
