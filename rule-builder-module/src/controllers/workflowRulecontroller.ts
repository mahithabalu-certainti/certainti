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
    listScopeConditionCategorySchema,
    listScopeFieldSchema,
    listScopeOperatorSchema,
    listScopeValueSchema,
    listScopeActionTypeSchema,
    listScopeActionsSchema,
    createRuleSchema,
    updateRuleSchema,
    getRuleDetailSchema
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
        if (!userId) {
            return;
        }
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
        if (!userId) {
            return;
        }
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
        if (!userId) {
            return;
        }
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
        if (!userId) {
            return;
        }
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

async function listFields(req: Request, res: Response): Promise<void> {
    const methodName = "operators list";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, listScopeFieldSchema, res, "POST");
        if (!value) {
            return;
        }
        if (!userId) {
            return;
        }
        const result = await workFlowService.listFields(
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

async function listOperators(req: Request, res: Response): Promise<void> {
    const methodName = "operators list";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, listScopeOperatorSchema, res, "POST");
        if (!value) {
            return;
        }
        if (!userId) {
            return;
        }
        const result = await workFlowService.listOperators(
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

async function listValues(req: Request, res: Response): Promise<void> {
    const methodName = "values list";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, listScopeValueSchema, res, "POST");
        if (!value) {
            return;
        }
        if (!userId) {
            return;
        }
        const result = await workFlowService.listValues(
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

async function listActionTypes(req: Request, res: Response): Promise<void> {
    const methodName = "action types list";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, listScopeActionTypeSchema, res, "POST");
        if (!value) {
            return;
        }
        if (!userId) {
            return;
        }
        const result = await workFlowService.listActionTypes(
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


async function listActions(req: Request, res: Response): Promise<void> {
    const methodName = "actions list";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, listScopeActionsSchema, res, "POST");
        if (!value) {
            return;
        }
        if (!userId) {
            return;
        }
        const result = await workFlowService.listActions(
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

async function createRule(req: Request, res: Response): Promise<void> {
    const methodName = "create condition";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, createRuleSchema, res, "POST");
        if (!value) {
            errorLog(methodName, "Request body is empty");
            return;
        }
        const newRuleMap = await workFlowService.createRule(value, userId);
        if (newRuleMap.statusCode === HttpStatus.SUCCESS) {
            successLog(methodName);
            handleSuccessResponse(res, newRuleMap.data);
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


async function ruleDetailByRuleRid(req: Request, res: Response): Promise<void> {
    const methodName = "create condition";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, getRuleDetailSchema, res, "POST");
        if (!value) {
            errorLog(methodName, "Request body is empty");
            return;
        }
        const newRuleMap = await workFlowService.ruleDetailByRuleRid(value.rule_rid, userId);
        if (newRuleMap.statusCode === HttpStatus.SUCCESS) {
            successLog(methodName);
            handleSuccessResponse(res, newRuleMap.data);
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

async function updateRule(req: Request, res: Response): Promise<void> {
    const methodName = "update Rule";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, updateRuleSchema, res, "POST");
        if (!value) {
            errorLog(methodName, "Request body is empty");
            return;
        }
        const newRuleMap = await workFlowService.updateRule(value, userId);
        if (newRuleMap.statusCode === HttpStatus.SUCCESS) {
            successLog(methodName);
            handleSuccessResponse(res, newRuleMap.data);
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


async function execute(req: Request, res: Response): Promise<void> {
    const methodName = "create condition";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = req.body;
        const execute = await workFlowService.execute(value, userId);
        if (execute.statusCode === HttpStatus.SUCCESS) {
            successLog(methodName);
            handleSuccessResponse(res, execute.data);
            return;
        } {
            errorLog(methodName, execute.errorMessage);
            handleErrorResponse(
                res,
                HttpStatus.BAD_REQUEST,
                HttpStatus.BAD_REQUEST_MESSAGE,
                execute.errorMessage
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
    listFields,
    listOperators,
    listValues,
    listActionTypes,
    listActions,
    createRule,
    ruleDetailByRuleRid,
    updateRule,
    createRuleMapWithScope,
    execute
}