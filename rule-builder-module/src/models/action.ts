import { db } from "../config/db";

export interface Action {
  id?: number;
  ruleId: number;
  actionType: string;  // e.g., "send_notification"
  config?: any;        // JSON config for action
}

export const createAction = async (action: Action) => {
  const query = `
    INSERT INTO actions (rule_id, action_type, config)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [action.ruleId, action.actionType, action.config ?? null];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const getActionsByRule = async (ruleId: number) => {
  const query = `SELECT * FROM actions WHERE rule_id = $1`;
  const res = await db.query(query, [ruleId]);
  return res.rows;
};

export const deleteActionsByRule = async (ruleId: number) => {
  const query = `DELETE FROM actions WHERE rule_id = $1`;
  await db.query(query, [ruleId]);
  return true;
};
