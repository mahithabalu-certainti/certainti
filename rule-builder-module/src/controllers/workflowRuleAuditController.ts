import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  successLog,
  handleErrorResponse,
  handleSuccessResponse,
} from "../utils/helpers";
import * as AuditService from "../services/workflowAuditService";

export const createAuditEntry = async (req: Request, res: Response) => {
  const methodName = "create Audit";
  try {
    const newAudit = await AuditService.createRuleAudit(req.body);
    successLog(methodName);
    handleSuccessResponse(res, newAudit);
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

export const getAuditById = async (req: Request, res: Response) => {
  try {
    const audit = await AuditService.getRuleAuditById(String(req.params.rid));
    if (!audit) return res.status(404).json({ error: "Audit entry not found" });
    res.json(audit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audit entry" });
  }
};

export const getAuditsByRule = async (req: Request, res: Response) => {
  try {
    const audits = await AuditService.getRuleAuditByRule(String(req.params.ruleRid));
    res.json(audits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audits" });
  }
};

export const deleteAuditEntry = async (req: Request, res: Response) => {
  try {
    const result = await AuditService.deleteRuleAudit(String(req.params.rid));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete audit entry" });
  }
};
