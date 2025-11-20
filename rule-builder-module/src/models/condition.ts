import { db } from "../config/db";

export interface Condition {
  id?: number;
  ruleId: number;
  field: string;     // e.g., "task.status"
  operator: string;  // Equals, Contains, etc.
  value: string;     // "Open"
}

export const createCondition = async (cond: Condition) => {
  const query = `
    INSERT INTO conditions (rule_id, field, operator, value)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [cond.ruleId, cond.field, cond.operator, cond.value];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const getConditionsByRule = async (ruleId: number) => {
  const query = `SELECT * FROM conditions WHERE rule_id = $1`;
  const res = await db.query(query, [ruleId]);
  return res.rows;
};

export const deleteConditionsByRule = async (ruleId: number) => {
  const query = `DELETE FROM conditions WHERE rule_id = $1`;
  await db.query(query, [ruleId]);
  return true;
};
