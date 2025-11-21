import { db } from "../config/db";

export interface RuleMaster {
  rid?: string;
  ruleName: string;
  description?: string;
  triggerEvent: string;
  triggerType: number;
  isActive?: boolean;
  scopeType: number;
  scheduleOffsetType: string;
  scheduleOffsetValue: string;
  createdBy: number;
  modifiedBy?: number;
  createdDatetime?: Date;
  modifiedDatetime?: Date;
}

export const createRuleMaster = async (data: RuleMaster) => {
  const query = `
    INSERT INTO workflow_rule_master
    (rid,rule_name, description, trigger_event, is_active, scope_type,trigger_type,schedule_offset_type,schedule_offset_value, created_by, modified_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *;
  `;
  const values = [data.rid, data.ruleName, data.description ?? null, data.triggerEvent, data.isActive, data.scopeType, data.triggerType, data.scheduleOffsetType, data.scheduleOffsetValue, data.createdBy, data.createdBy];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const getRuleMasterById = async (rid: number) => {
  const res = await db.query(`SELECT * FROM workflow_rule_master WHERE rid=$1`, [rid]);
  return res.rows[0];
};

export const getAllRuleMasters = async () => {
  const res = await db.query(`SELECT * FROM workflow_rule_master ORDER BY rid DESC`);
  return res.rows;
};

export const updateRuleMaster = async (rid: number, data: RuleMaster) => {
  const query = `
    UPDATE workflow_rule_master
    SET rule_name=$1, description=$2, trigger_event=$3, modified_by=$4, modified_datetime=NOW()
    WHERE rid=$5
    RETURNING *;
  `;
  const values = [data.ruleName, data.description ?? null, data.triggerEvent, data.modifiedBy, rid];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const deleteRuleMaster = async (rid: number) => {
  await db.query(`DELETE FROM workflow_rule_master WHERE rid=$1`, [rid]);
  return { message: "Rule deleted successfully" };
};
