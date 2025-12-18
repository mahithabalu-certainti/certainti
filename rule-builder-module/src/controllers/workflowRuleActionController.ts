import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  successLog,
  handleErrorResponse,
  handleSuccessResponse,
  handleCustomResponse,
  validateRequest
} from "../utils/helpers";
import {
  listActionSchema,
  createActionSchema,
  updateActionSchema
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const ActionService = services.actionService;

async function createAction(req: Request, res: Response): Promise<void> {
  const methodName = "create rule action";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, createActionSchema, res, "POST");
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const newAction = await ActionService.createAction(value, userId);
    if (newAction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, newAction);
      return;
    } {
      errorLog(methodName, newAction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        newAction.errorMessage
      );
      return;
    }
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

async function listActions(req: Request, res: Response): Promise<void> {
  const methodName = "rule action detail";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listActionSchema, res, "GET");
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
    const result = await ActionService.listActions(value,
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

// export const getActionsByRule = async (req: Request, res: Response) => {
//   const methodName = "rule action detail";
//   try {
//     const action = await ActionService.getRuleActionByRuleRId(String(req.params.rule_rid));
//     if (!action) return res.status(404).json({ error: "Action not found" });
//     res.json(action);
//   } catch (err) {
//     const error = err as Error;
//     errorLog(methodName, error.message);
//     handleErrorResponse(
//       res,
//       HttpStatus.FAILED,
//       HttpStatus.FAILED_MESSAGE,
//       error.message
//     );
//   }
// };

async function updateAction(req: Request, res: Response): Promise<void> {
  const methodName = "update rule action";
  try {
    const value = await validateRequest(req, updateActionSchema, res);
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      // errorLog(methodName, "User ID is required in headers");
      // handleErrorResponse(
      //   res,
      //   HttpStatus.BAD_REQUEST,
      //   HttpStatus.BAD_REQUEST_MESSAGE,
      //   "User ID is required in headers"
      // );
      // return;
    }
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const response = await ActionService.updateAction(value, req.body);
    if (response.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, response.data, response.message);
      return;
    } else {
      errorLog(methodName, response.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        response.errorMessage
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

async function deleteAction(req: Request, res: Response) {
  const methodName = "delete rule action";
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      // errorLog(methodName, "User ID is required in headers");
      // handleErrorResponse(
      //   res,
      //   HttpStatus.BAD_REQUEST,
      //   HttpStatus.BAD_REQUEST_MESSAGE,
      //   "User ID is required in headers"
      // );
      // return;
    }
    const data = req.body;
    const result = await ActionService.deleteAction(data, userId);
    if (result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else if (result.statusCode === HttpStatus.NOT_FOUND) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else {
      return res.status(HttpStatus.FAILED).send({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage,
      });
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


export default {
  createAction,
  listActions,
  updateAction,
  deleteAction
};