import { Request, Response } from "express";
import * as ActionModel from "../models/workflowRuleAction";

export const createRuleAction = async (req: Request, res: Response) => {
  try {
    const newAction = await ActionModel.createRuleAction(req.body);
    res.status(201).json(newAction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create action" });
  }
};

export const getRuleActionById = async (req: Request, res: Response) => {
  try {
    const action = await ActionModel.getRuleActionById(Number(req.params.rid));
    if (!action) return res.status(404).json({ error: "Action not found" });
    res.json(action);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch action" });
  }
};

export const getActionsByRule = async (req: Request, res: Response) => {
  try {
    const actions = await ActionModel.getActionsByRule(Number(req.params.ruleRid));
    res.json(actions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch actions" });
  }
};

export const updateRuleAction = async (req: Request, res: Response) => {
  try {
    const updatedAction = await ActionModel.updateRuleAction(Number(req.params.rid), req.body);
    res.json(updatedAction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update action" });
  }
};

export const deleteRuleAction = async (req: Request, res: Response) => {
  try {
    const result = await ActionModel.deleteRuleAction(Number(req.params.rid));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete action" });
  }
};
