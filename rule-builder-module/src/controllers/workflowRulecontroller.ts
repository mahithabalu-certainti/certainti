import { Request, Response } from "express";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
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
    getRuleDetailSchema,
    updateRuleStatusSchema,
    updateRuleMapSchema
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

async function updateRuleStatus(req: Request, res: Response): Promise<void> {
    const methodName = "update Rule Status";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, updateRuleStatusSchema, res, "POST");
        if (!value) {
            errorLog(methodName, "Request body is empty");
            return;
        }
        const ruleStatus = await workFlowService.updateRuleStatus(value, userId);
        if (ruleStatus.statusCode === HttpStatus.SUCCESS) {
            successLog(methodName);
            handleSuccessResponse(res, ruleStatus.data);
            return;
        } {
            errorLog(methodName, ruleStatus.errorMessage);
            handleErrorResponse(
                res,
                HttpStatus.BAD_REQUEST,
                HttpStatus.BAD_REQUEST_MESSAGE,
                ruleStatus.errorMessage
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
}

async function createRuleMapWithScope(req: Request, res: Response): Promise<void> {
    const methodName = "create rule scope map";
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

async function ruleMapDetailByRuleRid(req: Request, res: Response): Promise<void> {
    const methodName = "rulemap detail";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, getRuleDetailSchema, res, "POST");
        if (!value) {
            errorLog(methodName, "Request body is empty");
            return;
        }
        const ruleMapDetail = await workFlowService.ruleMapDetailByRuleRid(value.rule_rid, userId);
        if (ruleMapDetail.statusCode === HttpStatus.SUCCESS) {
            successLog(methodName);
            handleSuccessResponse(res, ruleMapDetail.data);
            return;
        } {
            errorLog(methodName, ruleMapDetail.errorMessage);
            handleErrorResponse(
                res,
                HttpStatus.BAD_REQUEST,
                HttpStatus.BAD_REQUEST_MESSAGE,
                ruleMapDetail.errorMessage
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

async function updateRuleMapWithScope(req: Request, res: Response): Promise<void> {
    const methodName = "update rule scope map";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, updateRuleMapSchema, res, "POST");
        if (!value) {
            errorLog(methodName, "Request body is empty");
            return;
        }
        const newRuleMap = await workFlowService.updateRuleMapWithScope(value, userId);
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
    const methodName = "execute rule";
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
async function fetchNotificationTemplates (req : Request, res : Response) {
  const methodName = "fetchNotificationTemplates"
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const { channel } = req.params;
    const conditionRid = req.query.condition_rid as string || '';
    const eventRid = req.query.event_rid as string || '';

    if (!channel) {
        errorLog(methodName, "Channel parameter is required");
        handleErrorResponse(
          res,
          HttpStatus.BAD_REQUEST,
          HttpStatus.BAD_REQUEST_MESSAGE,
          "Channel parameter is required"
        );
        return;
    }
    const result = await workFlowService.getNotificationTemplates(channel,conditionRid,eventRid);
    if(result.data?.templates.length > 0) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.notificationTemplatesListedSuccess,
        data : result
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data : []
      });
    }

  }
  catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}


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
    updateRuleStatus,
    createRuleMapWithScope,
    ruleMapDetailByRuleRid,
    updateRuleMapWithScope,
    fetchNotificationTemplates,
    execute
}