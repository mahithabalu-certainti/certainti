import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  successLog,
  handleErrorResponse,
  handleSuccessResponse,
} from "../utils/helpers";
import * as LogService from "../services/workflowTriggerLogService";

export const createTriggerLog = async (req: Request, res: Response) => {
  const methodName = "create trigger";
  try {
    const newLog = await LogService.createRuleTriggerLog(req.body);
    successLog(methodName);
    handleSuccessResponse(res, newLog);
    return;
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
};

export const getTriggerLogById = async (req: Request, res: Response) => {
  try {
    const log = await LogService.getRuleTriggerLogById(String(req.params.rid));
    if (!log) return res.status(404).json({ error: "Trigger log not found" });
    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trigger log" });
  }
};

export const getTriggerLogsByRule = async (req: Request, res: Response) => {
  try {
    const logs = await LogService.getRuleTriggerLogByRule(String(req.params.ruleRid));
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trigger logs" });
  }
};

export const deleteTriggerLog = async (req: Request, res: Response) => {
  try {
    const result = await LogService.deleteRuleTriggerLog(String(req.params.rid));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete trigger log" });
  }
};
