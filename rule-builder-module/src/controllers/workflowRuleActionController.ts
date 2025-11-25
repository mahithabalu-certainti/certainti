import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  successLog,
  handleErrorResponse,
  handleSuccessResponse,
} from "../utils/helpers";
import * as ActionService from "../services/workflowActionService";

export const createRuleAction = async (req: Request, res: Response) => {
  const methodName = "create rule action";
  try {
    const newAction = await ActionService.createRuleAction(req.body);
    successLog(methodName);
    handleSuccessResponse(res, newAction);
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

export const getRuleActionById = async (req: Request, res: Response) => {
  const methodName = "rule action detail";
  try {
    const action = await ActionService.getRuleActionById(String(req.params.rid));
    if (!action) return res.status(404).json({ error: "Action not found" });
    res.json(action);
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

export const getActionsByRule = async (req: Request, res: Response) => {
  const methodName = "rule action detail";
  try {
    const action = await ActionService.getRuleActionByRuleRId(String(req.params.rule_rid));
    if (!action) return res.status(404).json({ error: "Action not found" });
    res.json(action);
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

export const updateRuleAction = async (req: Request, res: Response) => {
  const methodName = "update rule action";
  try {
    const updatedAction = await ActionService.updateRuleAction(String(req.params.rid), req.body);
    res.json(updatedAction);
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

export const deleteRuleAction = async (req: Request, res: Response) => {
  const methodName = "delete rule action";
  try {
    const result = await ActionService.deleteRuleAction(String(req.params.rid));
    res.json(result);
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
