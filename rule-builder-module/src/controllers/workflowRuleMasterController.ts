import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
} from "../utils/helpers";
import * as RuleService from "../services/rulemasterService";

/** CREATE RuleMaster */
export const createRuleMaster = async (req: Request, res: Response) => {
  const methodName = "create rule";
  try {
    const rule = await RuleService.createRuleMaster(req.body);
    res.status(201).json({ success: true, data: rule });
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

/** GET all RuleMasters */
export const getAllRuleMasters = async (_req: Request, res: Response) => {
  const methodName = "list rules";
  try {
    const rules = await RuleService.getAllRuleMasters();
    res.status(200).json({ success: true, data: rules });
  } catch (err) {
    console.error("Error fetching RuleMasters:", err);
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

/** GET RuleMaster by RID */
export const getRuleMasterById = async (req: Request, res: Response) => {
  const methodName = "rule details";
  try {
    const { rid } = req.params;
    if (!rid) {
      return res.status(400).json({ success: false, message: "RID is required" });
    }
    const rule = await RuleService.getRuleMasterById(rid);
    if (!rule) {
      return res.status(404).json({ success: false, message: "Rule not found" });
    }
    res.status(200).json({ success: true, data: rule });
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

/** UPDATE RuleMaster by RID */
export const updateRuleMaster = async (req: Request, res: Response) => {
  const methodName = "update rule";
  try {
    const { rid } = req.params;
    if (!rid) {
      return res.status(400).json({ success: false, message: "RID is required" });
    }
    const updatedRule = await RuleService.updateRuleMaster(rid, req.body);
    if (!updatedRule) {
      return res.status(404).json({ success: false, message: "Rule not found" });
    }
    res.status(200).json({ success: true, data: updatedRule });
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

/** DELETE RuleMaster by RID */
export const deleteRuleMaster = async (req: Request, res: Response) => {
  const methodName = "delete rule";
  try {
    const { rid } = req.params;
    if (!rid) {
      return res.status(400).json({ success: false, message: "RID is required" });
    }
    await RuleService.deleteRuleMaster(rid);
    res.status(200).json({ success: true, message: "Rule deleted successfully" });
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
