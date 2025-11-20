import { Request, Response } from "express";
import * as AuditModel from "../models/workflowRuleAudit";

export const createAuditEntry = async (req: Request, res: Response) => {
  try {
    const newAudit = await AuditModel.createAuditEntry(req.body);
    res.status(201).json(newAudit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create audit entry" });
  }
};

export const getAuditById = async (req: Request, res: Response) => {
  try {
    const audit = await AuditModel.getAuditById(Number(req.params.rid));
    if (!audit) return res.status(404).json({ error: "Audit entry not found" });
    res.json(audit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audit entry" });
  }
};

export const getAuditsByRule = async (req: Request, res: Response) => {
  try {
    const audits = await AuditModel.getAuditsByRule(Number(req.params.ruleRid));
    res.json(audits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audits" });
  }
};

export const deleteAuditEntry = async (req: Request, res: Response) => {
  try {
    const result = await AuditModel.deleteAuditEntry(Number(req.params.rid));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete audit entry" });
  }
};
