import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  successLog,
  handleErrorResponse,
  handleSuccessResponse,
} from "../utils/helpers";
import * as RuleService from "../services/rulemasterService";

/** CREATE RuleMaster */
async function createRuleMaster(req: Request, res: Response): Promise<void> {
  const methodName = "create rule";
  try {
    const rule = await RuleService.createRuleMaster(req.body);
    successLog(methodName);
    handleSuccessResponse(res, rule);
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

/** GET all RuleMasters */
async function getAllRuleMasters(req: Request, res: Response): Promise<void> {
  const methodName = "list rules";
  try {
    const page = Number(req.query.page) || 1;
    const size = Number(req.query.size) || 10;
    const rules = await RuleService.getAllRuleMasters(page, size);
    successLog(methodName);
    handleSuccessResponse(res, rules);
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

/** GET RuleMaster by RID */
async function getRuleMasterById(req: Request, res: Response): Promise<void> {
  const methodName = "rule details";
  try {
    const { rid } = req.params;
    if (!rid) {
      handleErrorResponse(
        res,
        HttpStatus.FAILED,
        HttpStatus.FAILED_MESSAGE,
        "RID is required"
      );
      return;
    }
    const rule = await RuleService.getRuleMasterById(rid);
    if (!rule) {
      handleErrorResponse(
        res,
        HttpStatus.FAILED,
        HttpStatus.FAILED_MESSAGE,
        "Rule not found"
      );
    }
    successLog(methodName);
    handleSuccessResponse(res, rule);
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
async function updateRuleMaster(req: Request, res: Response): Promise<void> {
  const methodName = "update rule";
  try {
    const { rid } = req.params;
    if (!rid) {
      handleErrorResponse(
        res,
        HttpStatus.FAILED,
        HttpStatus.FAILED_MESSAGE,
        "RID is required"
      );
      return;
    }
    const updatedRule = await RuleService.updateRuleMaster(rid, req.body);
    if (!updatedRule) {
      handleErrorResponse(
        res,
        HttpStatus.FAILED,
        HttpStatus.FAILED_MESSAGE,
        "Rule not found"
      );
      return;
    }
    successLog(methodName);
    handleSuccessResponse(res, updatedRule);
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
async function deleteRuleMaster(req: Request, res: Response): Promise<void> {
  const methodName = "delete rule";
  try {
    const { rid } = req.params;
    if (!rid) {
      handleErrorResponse(
        res,
        HttpStatus.FAILED,
        HttpStatus.FAILED_MESSAGE,
        "RID is required"
      );
      return;
    }
    await RuleService.deleteRuleMaster(rid);
    //res.status(200).json({ success: true, message: "Rule deleted successfully" });
    successLog(methodName);
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


export default {
  createRuleMaster,
  getAllRuleMasters,
  getRuleMasterById,
  updateRuleMaster,
  deleteRuleMaster
};