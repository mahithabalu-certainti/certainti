import { Request, Response } from "express";
import * as RuleMasterModel from "../models/workflowRuleMaster";

export const createRuleMaster = async (req: Request, res: Response) => {
  try {
    const newRule = await RuleMasterModel.createRuleMaster(req.body);
    res.status(201).json(newRule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create rule" });
  }
};

export const getRuleMasterById = async (req: Request, res: Response) => {
  try {
    const rule = await RuleMasterModel.getRuleMasterById(Number(req.params.rid));
    if (!rule) return res.status(404).json({ error: "Rule not found" });
    res.json(rule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch rule" });
  }
};

export const getAllRuleMasters = async (_req: Request, res: Response) => {
  try {
    const rules = await RuleMasterModel.getAllRuleMasters();
    res.json(rules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch rules" });
  }
};

export const updateRuleMaster = async (req: Request, res: Response) => {
  try {
    const updatedRule = await RuleMasterModel.updateRuleMaster(Number(req.params.rid), req.body);
    res.json(updatedRule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update rule" });
  }
};

export const deleteRuleMaster = async (req: Request, res: Response) => {
  try {
    const result = await RuleMasterModel.deleteRuleMaster(Number(req.params.rid));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete rule" });
  }
};
