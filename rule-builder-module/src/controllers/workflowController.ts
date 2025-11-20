import { Request, Response } from "express";
import * as WorkflowService from "../services/workflowService";

/**
 * POST /api/workflow/execute
 * Trigger workflow for a case or task
 * Payload: { entityType: "case" | "task", entityId: number, userId: number }
 */
export const executeWorkflow = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, userId } = req.body;

    if (!entityType || !entityId || !userId) {
      return res.status(400).json({ error: "entityType, entityId, and userId are required" });
    }

    const result = await WorkflowService.executeWorkflowForEntity(entityType, entityId, userId);

    res.status(200).json({
      message: "Workflow executed successfully",
      executedRules: result
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
