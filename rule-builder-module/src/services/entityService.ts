import * as CaseModel from "../models/case";
import * as TaskModel from "../models/tasks";

/**
 * Fetch entity (case/task) by ID
 */
export const getEntityById = async (taskId: number) => {
  // Try fetching task first
  let entity = await TaskModel.getTaskById(taskId);
  if (entity) return entity;

  // If not a task, try fetching a case
  entity = await CaseModel.getCaseById(taskId);
  if (entity) return entity;

  throw new Error(`Entity not found for id ${taskId}`);
};
