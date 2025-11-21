import { db } from "../config/db";

export interface Condition {
  rid?: string;
  logicalOperator: String;
  fieldName: string;
  operator: string;
  value: string;
  dataType: string;
  sequence: number;
  createdDatetime?: Date;
}

export const createCondition = async (data: Condition) => {
  const query = `
    INSERT INTO workflow_rule_condition
    (rid,logical_operator, field_name, operator, value, data_type,sequence)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *;
  `;
  const values = [data.rid, data.logicalOperator, data.fieldName, data.operator, data.value, data.dataType, data.sequence];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const getConditionById = async (rid: number) => {
  const res = await db.query(`SELECT * FROM workflow_rule_condition WHERE rid=$1`, [rid]);
  return res.rows[0];
};

// export const getConditionsByGroup = async (groupRid: number) => {
//   const res = await db.query(`SELECT * FROM workflow_rule_condition WHERE group_rid=$1`, [groupRid]);
//   return res.rows;
// };

export const updateCondition = async (rid: number, data: Condition) => {
  const query = `
    UPDATE workflow_rule_condition
    SET field_name=$1, operator=$2, value=$3, data_type=$4
    WHERE rid=$5
    RETURNING *;
  `;
  const values = [data.fieldName, data.operator, data.value, data.dataType, rid];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const deleteCondition = async (rid: number) => {
  await db.query(`DELETE FROM workflow_rule_condition WHERE rid=$1`, [rid]);
  return { message: "Condition deleted successfully" };
};
