import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  successLog,
  handleErrorResponse,
  handleSuccessResponse,
  validateRequest
} from "../utils/helpers";
import {
  listRuleSchema,
  createRuleSchema
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";


const services = configurations.getInstance().getServices();
const RuleService = services.rulemasterService;

/** CREATE RuleMaster */
async function createRuleMaster(req: Request, res: Response): Promise<void> {
  const methodName = "create rule";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, createRuleSchema, res, "POST");
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const rule = await RuleService.createRuleMaster(value, userId);
    if (rule.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, rule);
      return;
    } {
      errorLog(methodName, rule.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        rule.errorMessage
      );
      return;
    }
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
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listRuleSchema, res, "GET");
    if (!value) {
      return;
    }
    let parsedFilters: Record<string, any> = {};
    try {
      if (value.filters) {
        parsedFilters = JSON.parse(value.filters);
      }
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }
    // if (!userId) {
    //   return;
    // }

    const result = await RuleService.listRuleMasters(
      value,
      parsedFilters,
      userId,
      "list");
    if (result.statusCode == HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result);
      return;
    } else {
      errorLog(methodName, "No data found");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.errorMessage
      );
      return;
    }
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
    // const rule = await RuleService.getRuleMasterById(rid);
    // if (!rule) {
    //   handleErrorResponse(
    //     res,
    //     HttpStatus.FAILED,
    //     HttpStatus.FAILED_MESSAGE,
    //     "Rule not found"
    //   );
    // }
    // successLog(methodName);
    // handleSuccessResponse(res, rule);
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
    // const updatedRule = await RuleService.updateRuleMaster(rid, req.body);
    // if (!updatedRule) {
    //   handleErrorResponse(
    //     res,
    //     HttpStatus.FAILED,
    //     HttpStatus.FAILED_MESSAGE,
    //     "Rule not found"
    //   );
    //   return;
    // }
    // successLog(methodName);
    // handleSuccessResponse(res, updatedRule);
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
    // await RuleService.deleteRuleMaster(rid);
    // //res.status(200).json({ success: true, message: "Rule deleted successfully" });
    // successLog(methodName);
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