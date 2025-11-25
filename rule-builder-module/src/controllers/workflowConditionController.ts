import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  successLog,
  handleErrorResponse,
  handleSuccessResponse,
} from "../utils/helpers";
import * as ConditionService from "../services/workflowConditionService";

export const createCondition = async (req: Request, res: Response) => {
  const methodName = "create condition";
  try {
    const newCondition = await ConditionService.createCondition(req.body);
    successLog(methodName);
    handleSuccessResponse(res, newCondition);
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

export const getConditionById = async (req: Request, res: Response) => {
  const methodName = "condition details";
  try {
    const condition = await ConditionService.getConditionById(String(req.params.rid));
    if (!condition) return res.status(404).json({ error: "Condition not found" });
    res.json(condition);
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

export const updateCondition = async (req: Request, res: Response) => {
  const methodName = "update condition";
  try {
    const updatedCondition = await ConditionService.updateCondition(String(req.params.rid), req.body);
    res.json(updatedCondition);
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

export const deleteCondition = async (req: Request, res: Response) => {
  const methodName = "delete condition";
  try {
    const result = await ConditionService.deleteCondition(String(req.params.rid));
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
