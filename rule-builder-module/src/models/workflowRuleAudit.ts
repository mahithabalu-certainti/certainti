import { db } from "../config/db";

export interface RuleAudit {
  rid?: number;
  ruleRid: number;
  action: string;
  oldValue?: string;
  newValue?: string;
  notes?: string;
  createdBy: number;
  createdDatetime?: Date;
}

export const createAuditEntry = async (data: RuleAudit) => {
  const query = `
    INSERT INTO workflow_rule_audit
    (rule_rid, action, old_value, new_value, notes, created_by)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *;
  `;
  const values = [data.ruleRid, data.action, data.oldValue ?? null, data.newValue ?? null, data.notes ?? null, data.createdBy];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const getAuditById = async (rid: number) => {
  const res = await db.query(`SELECT * FROM workflow_rule_audit WHERE rid=$1`, [rid]);
  return res.rows[0];
};

export const getAuditsByRule = async (ruleRid: number) => {
  const res = await db.query(`SELECT * FROM workflow_rule_audit WHERE rule_rid=$1 ORDER BY rid DESC`, [ruleRid]);
  return res.rows;
};

export const deleteAuditEntry = async (rid: number) => {
  await db.query(`DELETE FROM workflow_rule_audit WHERE rid=$1`, [rid]);
  return { message: "Audit entry deleted successfully" };
};
