import { db } from "../config/db";

export interface RuleScheduleQueue {
  rid?: number;
  ruleRid: number;
  relatedTaskRid: number;
  scheduledDatetime: Date;
  executed?: boolean;
  executedDatetime?: Date;
}

export const createScheduleQueue = async (data: RuleScheduleQueue) => {
  const query = `
    INSERT INTO workflow_rule_schedule_queue
    (rule_rid, related_task_rid, scheduled_datetime)
    VALUES ($1,$2,$3)
    RETURNING *;
  `;
  const values = [data.ruleRid, data.relatedTaskRid, data.scheduledDatetime];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const getScheduleById = async (rid: number) => {
  const res = await db.query(`SELECT * FROM workflow_rule_schedule_queue WHERE rid=$1`, [rid]);
  return res.rows[0];
};

export const getSchedulesByRule = async (ruleRid: number) => {
  const res = await db.query(`SELECT * FROM workflow_rule_schedule_queue WHERE rule_rid=$1 ORDER BY rid DESC`, [ruleRid]);
  return res.rows;
};

export const updateScheduleQueue = async (rid: number, data: Partial<RuleScheduleQueue>) => {
  const query = `
    UPDATE workflow_rule_schedule_queue
    SET scheduled_datetime=$1, executed=$2, executed_datetime=$3
    WHERE rid=$4
    RETURNING *;
  `;
  const values = [data.scheduledDatetime, data.executed ?? false, data.executedDatetime ?? null, rid];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const getPendingSchedules = async () => {
  const query = `
    SELECT * FROM workflow_rule_schedule_queue
    WHERE executed = false
  `;
  const res = await db.query(query);
  return res.rows;
};

export const markScheduleExecuted = async (rid: number) => {
  const res = await db.query(`
    UPDATE workflow_rule_schedule_queue
    SET executed=true, executed_datetime=NOW()
    WHERE rid=$1
    RETURNING *;
  `, [rid]);
  return res.rows[0];
};

export const deleteScheduleQueue = async (rid: number) => {
  await db.query(`DELETE FROM workflow_rule_schedule_queue WHERE rid=$1`, [rid]);
  return { message: "Schedule queue entry deleted successfully" };
};
