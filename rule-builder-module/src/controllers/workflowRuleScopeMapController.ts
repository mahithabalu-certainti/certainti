import { Request, Response } from "express";
import * as ScopeMapModel from "../models/workflowRuleScopeMap";

export const createRuleScope = async (req: Request, res: Response) => {
  try {
    const newScope = await ScopeMapModel.createRuleScope(req.body);
    res.status(201).json(newScope);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create rule scope" });
  }
};

export const getScopeById = async (req: Request, res: Response) => {
  try {
    const scope = await ScopeMapModel.getScopeById(Number(req.params.rid));
    if (!scope) return res.status(404).json({ error: "Scope not found" });
    res.json(scope);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch scope" });
  }
};

export const getScopesByRule = async (req: Request, res: Response) => {
  try {
    const scopes = await ScopeMapModel.getScopesByRule(Number(req.params.ruleRid));
    res.json(scopes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch scopes" });
  }
};

export const updateRuleScope = async (req: Request, res: Response) => {
  try {
    const updatedScope = await ScopeMapModel.updateRuleScope(Number(req.params.rid), req.body);
    res.json(updatedScope);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update scope" });
  }
};

export const deleteRuleScope = async (req: Request, res: Response) => {
  try {
    const result = await ScopeMapModel.deleteRuleScope(Number(req.params.rid));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete scope" });
  }
};
