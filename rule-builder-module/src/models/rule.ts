import { db } from "../config/db";

export interface Rule {
  id?: number;
  name: string;
  description?: string;
  triggerEvent: string; // e.g. "task_created"
}

export const createRule = async (rule: Rule) => {
  const query = `
    INSERT INTO rules (name, description, trigger_event)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [rule.name, rule.description ?? null, rule.triggerEvent];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const getRuleById = async (id: number) => {
  const query = `SELECT * FROM rules WHERE id = $1`;
  const res = await db.query(query, [id]);
  return res.rows[0];
};

export const getAllRules = async () => {
  const query = `SELECT * FROM rules ORDER BY id DESC`;
  const res = await db.query(query);
  return res.rows;
};

export const updateRule = async (id: number, rule: Rule) => {
  const query = `
    UPDATE rules 
    SET name = $1, description = $2, trigger_event = $3, updated_at = NOW()
    WHERE id = $4
    RETURNING *;
  `;
  const values = [rule.name, rule.description ?? null, rule.triggerEvent, id];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const deleteRule = async (id: number) => {
  const query = `DELETE FROM rules WHERE id = $1`;
  await db.query(query, [id]);
  return true;
};
