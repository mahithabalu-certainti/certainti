import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
} from "../utils/helpers";
import * as Scopeservice from "../services/workflowScopeMapService";

export const createRuleScope = async (req: Request, res: Response) => {
  const methodName = "create scope";
  try {
    const newScope = await Scopeservice.createRuleScopeMap(req.body);
    res.status(201).json(newScope);
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  };
}

export const getScopeById = async (req: Request, res: Response) => {
  const methodName = "scope details";
  try {
    const scope = await Scopeservice.getRuleScopeById(String(req.params.rid));
    if (!scope) return res.status(404).json({ error: "Scope not found" });
    res.json(scope);
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

export const getScopesByRule = async (req: Request, res: Response) => {
  const methodName = "scope By rule";
  try {
    const scopes = await Scopeservice.getRuleScopeByRule(String(req.params.ruleRid));
    res.json(scopes);
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

export const updateRuleScope = async (req: Request, res: Response) => {
  const methodName = "update scope";
  try {
    const updatedScope = await Scopeservice.updateRuleScope(String(req.params.rid), req.body);
    res.json(updatedScope);
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

export const deleteRuleScope = async (req: Request, res: Response) => {
  const methodName = "delete scope";
  try {
    const result = await Scopeservice.deleteRuleScope(String(req.params.rid));
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
