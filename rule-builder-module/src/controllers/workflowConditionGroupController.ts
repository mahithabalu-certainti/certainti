import { Request, Response } from "express";
import * as ConditionGroupModel from "../models/workflowRuleConditionGroup";

export const createConditionGroup = async (req: Request, res: Response) => {
  try {
    const newGroup = await ConditionGroupModel.createConditionGroup(req.body);
    res.status(201).json(newGroup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create condition group" });
  }
};

export const getConditionGroupById = async (req: Request, res: Response) => {
  try {
    const group = await ConditionGroupModel.getConditionGroupById(Number(req.params.rid));
    if (!group) return res.status(404).json({ error: "Condition group not found" });
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch condition group" });
  }
};

export const getConditionGroupsByRule = async (req: Request, res: Response) => {
  try {
    const groups = await ConditionGroupModel.getConditionGroupsByRule(Number(req.params.ruleRid));
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch condition groups" });
  }
};

export const updateConditionGroup = async (req: Request, res: Response) => {
  try {
    const updatedGroup = await ConditionGroupModel.updateConditionGroup(Number(req.params.rid), req.body);
    res.json(updatedGroup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update condition group" });
  }
};

export const deleteConditionGroup = async (req: Request, res: Response) => {
  try {
    const result = await ConditionGroupModel.deleteConditionGroup(Number(req.params.rid));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete condition group" });
  }
};
