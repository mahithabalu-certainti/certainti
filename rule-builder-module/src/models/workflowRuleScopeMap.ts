import { db } from "../config/db";

export interface RuleScopeMap {
  rid?: string;
  ruleRid: string;
  scopeEntityType: string;  // e.g., "case", "task"
  scopeEntityRid: string;
  isActive?: boolean;
  createdBy: number;
  modifiedBy?: number;
  createdDatetime?: Date;
  modifiedDatetime?: Date;
}

export const createRuleScope = async (data: RuleScopeMap) => {
  const query = `
    INSERT INTO workflow_rule_scope_map
    (rid,rule_rid, scope_entity_type, scope_entity_rid, is_active, created_by, modified_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *;
  `;
  const values = [data.rid, data.ruleRid, data.scopeEntityType, data.scopeEntityRid, data.isActive ?? true, data.createdBy, data.createdBy];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const getScopeById = async (rid: number) => {
  const res = await db.query(`SELECT * FROM workflow_rule_scope_map WHERE rid=$1`, [rid]);
  return res.rows[0];
};

export const getScopesByRule = async (ruleRid: number) => {
  const res = await db.query(`SELECT * FROM workflow_rule_scope_map WHERE rule_rid=$1`, [ruleRid]);
  return res.rows;
};

export const getScopesByEntity = async (entityType: string, entityId: number) => {
  const query = `
    SELECT * FROM workflow_rule_scope_map
    WHERE scope_entity_type = $1
      AND scope_entity_rid = $2
      AND is_active = true
  `;
  const values = [entityType, entityId];
  const res = await db.query(query, values);
  return res.rows;
};

export const updateRuleScope = async (rid: number, data: RuleScopeMap) => {
  const query = `
    UPDATE workflow_rule_scope_map
    SET scope_entity_type=$1, scope_entity_rid=$2, is_active=$3, modified_by=$4, modified_datetime=NOW()
    WHERE rid=$5
    RETURNING *;
  `;
  const values = [data.scopeEntityType, data.scopeEntityRid, data.isActive ?? true, data.modifiedBy, rid];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const deleteRuleScope = async (rid: number) => {
  await db.query(`DELETE FROM workflow_rule_scope_map WHERE rid=$1`, [rid]);
  return { message: "Rule scope deleted successfully" };
};
