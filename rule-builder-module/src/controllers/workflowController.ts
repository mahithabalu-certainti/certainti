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
    listScopeEventSchema
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
        const result = await workFlowService.listScopes(
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
/**
 * POST /api/workflow/execute
 * Trigger workflow for a case or task
 * Payload: { entityType: "case" | "task", entityId: number, userId: number }
 */
// export const executeWorkflow = async (req: Request, res: Response) => {
//   try {
//     const { entityType, entityId, userId } = req.body;

//     if (!entityType || !entityId || !userId) {
//       return res.status(400).json({ error: "entityType, entityId, and userId are required" });
//     }

//     const result = await WorkflowService.executeWorkflowForEntity(entityType, entityId, userId);

//     res.status(200).json({
//       message: "Workflow executed successfully",
//       executedRules: result
//     });
//   } catch (err) {
//     res.status(500).json({ error: (err as Error).message });
//   }
// };


export default {
    listScopes,
    listScopeEvents,
    createRuleMapWithScope
}