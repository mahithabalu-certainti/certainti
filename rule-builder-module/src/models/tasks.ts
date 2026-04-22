import { db } from "../config/db";

export interface Task {
  taskId?: number;
  caseId: number;
  taskTitle: string;
  taskStatus: string;
  taskPriority: string;
  assignee: number;
  dueDate: Date;
  createdDatetime?: Date;
  modifiedDatetime?: Date;
}

export const createTask = async (data: Task) => {
  const query = `
    INSERT INTO case_tasks
    (case_id, task_title, task_status, task_priority, assignee, due_date)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *;
  `;
  const values = [data.caseId, data.taskTitle, data.taskStatus, data.taskPriority, data.assignee, data.dueDate];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const getTaskById = async (taskId: number) => {
  const res = await db.query(`SELECT * FROM case_tasks WHERE task_id=$1`, [taskId]);
  return res.rows[0];
};

export const getAllTasks = async () => {
  const res = await db.query(`SELECT * FROM case_tasks ORDER BY task_id DESC`);
  return res.rows;
};

export const updateTask = async (taskId: number, data: Task) => {
  const query = `
    UPDATE case_tasks
    SET task_title=$1, task_status=$2, task_priority=$3, assignee=$4, due_date=$5, modified_datetime=NOW()
    WHERE task_id=$6
    RETURNING *;
  `;
  const values = [data.taskTitle, data.taskStatus, data.taskPriority, data.assignee, data.dueDate, taskId];
  const res = await db.query(query, values);
  return res.rows[0];
};

export const deleteTask = async (taskId: number) => {
  await db.query(`DELETE FROM case_tasks WHERE task_id=$1`, [taskId]);
  return { message: "Task deleted successfully" };
};
