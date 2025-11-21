import { Request, Response } from "express";
import * as ConditionModel from "../models/workflowRuleCondition";

export const createCondition = async (req: Request, res: Response) => {
  try {
    const newCondition = await ConditionModel.createCondition(req.body);
    res.status(201).json(newCondition);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create condition" });
  }
};

export const getConditionById = async (req: Request, res: Response) => {
  try {
    const condition = await ConditionModel.getConditionById(Number(req.params.rid));
    if (!condition) return res.status(404).json({ error: "Condition not found" });
    res.json(condition);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch condition" });
  }
};

// export const getConditionsByGroup = async (req: Request, res: Response) => {
//   try {
//     const conditions = await ConditionModel.getConditionsByGroup(Number(req.params.groupRid));
//     res.json(conditions);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch conditions" });
//   }
// };

export const updateCondition = async (req: Request, res: Response) => {
  try {
    const updatedCondition = await ConditionModel.updateCondition(Number(req.params.rid), req.body);
    res.json(updatedCondition);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update condition" });
  }
};

export const deleteCondition = async (req: Request, res: Response) => {
  try {
    const result = await ConditionModel.deleteCondition(Number(req.params.rid));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete condition" });
  }
};
