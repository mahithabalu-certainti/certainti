import { Request, Response } from "express";
import * as CaseModel from "../models/case";

export const createCase = async (req: Request, res: Response) => {
  try {
    const newCase = await CaseModel.createCase(req.body);
    res.status(201).json(newCase);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create case" });
  }
};

export const getCaseById = async (req: Request, res: Response) => {
  try {
    const caseItem = await CaseModel.getCaseById(Number(req.params.caseId));
    if (!caseItem) return res.status(404).json({ error: "Case not found" });
    res.json(caseItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch case" });
  }
};

export const getAllCases = async (_req: Request, res: Response) => {
  try {
    const cases = await CaseModel.getAllCases();
    res.json(cases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cases" });
  }
};

export const updateCase = async (req: Request, res: Response) => {
  try {
    const updatedCase = await CaseModel.updateCase(Number(req.params.caseId), req.body);
    res.json(updatedCase);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update case" });
  }
};

export const deleteCase = async (req: Request, res: Response) => {
  try {
    const result = await CaseModel.deleteCase(Number(req.params.caseId));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete case" });
  }
};
