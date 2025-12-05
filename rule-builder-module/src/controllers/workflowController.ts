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
    createRuleMapSchema,
    listScopesSchema,
    listScopeEventSchema,
    listScopeEventConditionSchema,
    listScopeConditionCategorySchema
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const workFlowService = services.workFlowService;


async function listScopes(req: Request, res: Response): Promise<void> {
    const methodName = "scope list";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, listScopesSchema, res, "GET");
        if (!value) {
            return;
        }
        // if (!userId) {
        //   return;
        // }
        const result = await workFlowService.listScopes(
            value,
            userId,
            "list");
        if (result.statusCode == HttpStatus.SUCCESS) {
            successLog(methodName);
            handleSuccessResponse(res, result.data);
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


async function listScopeEvents(req: Request, res: Response): Promise<void> {
    const methodName = "scope event list";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, listScopeEventSchema, res, "POST");
        if (!value) {
            return;
        }
        // if (!userId) {
        //   return;
        // }
        const result = await workFlowService.listScopeEvents(
            value,
            userId,
            "list");
        if (result.statusCode == HttpStatus.SUCCESS) {
            successLog(methodName);
            handleSuccessResponse(res, result.data);
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

async function listEventConditions(req: Request, res: Response): Promise<void> {
    const methodName = "event condition list";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, listScopeEventConditionSchema, res, "POST");
        if (!value) {
            return;
        }
        // if (!userId) {
        //   return;
        // }
        const result = await workFlowService.listEventConditions(
            value,
            userId,
            "list");
        if (result.statusCode == HttpStatus.SUCCESS) {
            successLog(methodName);
            handleSuccessResponse(res, result.data);
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

async function listConditionCategory(req: Request, res: Response): Promise<void> {
    const methodName = "event condition list";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, listScopeConditionCategorySchema, res, "POST");
        if (!value) {
            return;
        }
        // if (!userId) {
        //   return;
        // }
        const result = await workFlowService.listConditionCategory(
            value,
            userId,
            "list");
        if (result.statusCode == HttpStatus.SUCCESS) {
            successLog(methodName);
            handleSuccessResponse(res, result.data);
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

async function createRuleMapWithScope(req: Request, res: Response): Promise<void> {
    const methodName = "create condition";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, createRuleMapSchema, res, "POST");
        if (!value) {
            errorLog(methodName, "Request body is empty");
            return;
        }
        const newRuleMap = await workFlowService.createRuleMapWithScope(value, userId);
        if (newRuleMap.statusCode === HttpStatus.SUCCESS) {
            successLog(methodName);
            handleSuccessResponse(res, newRuleMap);
            return;
        } {
            errorLog(methodName, newRuleMap.errorMessage);
            handleErrorResponse(
                res,
                HttpStatus.BAD_REQUEST,
                HttpStatus.BAD_REQUEST_MESSAGE,
                newRuleMap.errorMessage
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


export default {
    listScopes,
    listScopeEvents,
    listEventConditions,
    listConditionCategory,
    createRuleMapWithScope
}