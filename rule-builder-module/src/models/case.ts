import { db } from "../config/db";

export interface Case {
  caseId?: number;
  caseTitle: string;
  caseStatus: string;
  casePriority: string;
  caseOwner: number;
  createdDatetime?: Date;
  modifiedDatetime?: Date;
}

export const createCase = async (data: Case) => {
  const query = `
    INSERT INTO cases (case_title, case_status, case_priority, case_owner)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [data.caseTitle, data.caseStatus, data.casePriority, data.caseOwner];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const getCaseById = async (caseId: number) => {
  const res = await db.query(`SELECT * FROM cases WHERE case_id=$1`, [caseId]);
  return res.rows[0];
};

export const getAllCases = async () => {
  const res = await db.query(`SELECT * FROM cases ORDER BY case_id DESC`);
  return res.rows;
};

export const updateCase = async (caseId: number, data: Case) => {
  const query = `
    UPDATE cases
    SET case_title=$1, case_status=$2, case_priority=$3, case_owner=$4, modified_datetime=NOW()
    WHERE case_id=$5
    RETURNING *;
  `;
  const values = [data.caseTitle, data.caseStatus, data.casePriority, data.caseOwner, caseId];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const deleteCase = async (caseId: number) => {
  await db.query(`DELETE FROM cases WHERE case_id=$1`, [caseId]);
  return { message: "Case deleted successfully" };
};
