import { db } from "../config/db";

export interface RuleTriggerLog {
  rid?: number;
  ruleRid: number;
  eventName: string;
  eventTime: Date;
  contextEntityId: number;
  status: string;
  message?: string;
  createdDatetime?: Date;
}

export const createTriggerLog = async (data: RuleTriggerLog) => {
  const query = `
    INSERT INTO workflow_rule_trigger_log
    (rule_rid, event_name, event_time, context_entity_id, status, message)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *;
  `;
  const values = [data.ruleRid, data.eventName, data.eventTime, data.contextEntityId, data.status, data.message ?? null];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const getTriggerLogById = async (rid: number) => {
  const res = await db.query(`SELECT * FROM workflow_rule_trigger_log WHERE rid=$1`, [rid]);
  return res.rows[0];
};

export const getTriggerLogsByRule = async (ruleRid: number) => {
  const res = await db.query(`SELECT * FROM workflow_rule_trigger_log WHERE rule_rid=$1 ORDER BY rid DESC`, [ruleRid]);
  return res.rows;
};

export const deleteTriggerLog = async (rid: number) => {
  await db.query(`DELETE FROM workflow_rule_trigger_log WHERE rid=$1`, [rid]);
  return { message: "Trigger log deleted successfully" };
};
