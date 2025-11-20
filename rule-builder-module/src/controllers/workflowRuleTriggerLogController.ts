import { Request, Response } from "express";
import * as TriggerLogModel from "../models/workflowRuleTriggerLog";

export const createTriggerLog = async (req: Request, res: Response) => {
  try {
    const newLog = await TriggerLogModel.createTriggerLog(req.body);
    res.status(201).json(newLog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create trigger log" });
  }
};

export const getTriggerLogById = async (req: Request, res: Response) => {
  try {
    const log = await TriggerLogModel.getTriggerLogById(Number(req.params.rid));
    if (!log) return res.status(404).json({ error: "Trigger log not found" });
    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trigger log" });
  }
};

export const getTriggerLogsByRule = async (req: Request, res: Response) => {
  try {
    const logs = await TriggerLogModel.getTriggerLogsByRule(Number(req.params.ruleRid));
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trigger logs" });
  }
};

export const deleteTriggerLog = async (req: Request, res: Response) => {
  try {
    const result = await TriggerLogModel.deleteTriggerLog(Number(req.params.rid));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete trigger log" });
  }
};
