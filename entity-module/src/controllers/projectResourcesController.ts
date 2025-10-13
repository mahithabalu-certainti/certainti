import { Request, Response } from "express";
import {
  errorLog,
  generateExcelBase64,
  handleErrorResponse,
  handleSuccessResponse,
  logMessage,
  successLog,
  validateRequest,
} from "../utils/helpers";
import configurations from "../config/config";
import { HttpStatus } from "../utils/constants";
import {
  createProjectResourceSchema,
  exportListProjectResourceSchema,
  listResourceSchema,
  updateProjectResourceSchema,
  updateProjectResourceStatus,
} from "../lib/joi/schemas/schema";

const services = configurations.getInstance().getServices();
const projectResourceServices = services.projectResourceServices;

/**
 * Create a new project resource.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Resolves when the creation process is complete.
 */
async function createProjectResource(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Create project resource";
  try {
    const value = await validateRequest(req, createProjectResourceSchema, res);

    const userId = req.headers["x-user-id"] as string;
    logMessage("Request received for create project resource with data: " + JSON.stringify(value) + " and userId: " + userId);

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    if (!value) {
      return;
    }
    const projectResource = await projectResourceServices.createProjectResource(
      value,
      userId
    );
    if (
      projectResource.statusCode === HttpStatus.SUCCESS ||
      projectResource.statusCode === HttpStatus.PROMPT
    ) {
      successLog(methodName);
      handleSuccessResponse(
        res,
        projectResource.data,
        projectResource.message,
        projectResource.statusCode
      );
      return;
    } else {
      errorLog(methodName, projectResource.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        projectResource.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Update an existing project resource.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Resolves when the update process is complete.
 */
async function updateProjectResource(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Update project resource";
  try {
    const value = await validateRequest(req, updateProjectResourceSchema, res);
    if (!value) {
      return;
    }

    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    const projectResource = await projectResourceServices.updateProjectResource(
      value,
      userId
    );
    if (
      projectResource.statusCode === HttpStatus.SUCCESS ||
      projectResource.statusCode === HttpStatus.PROMPT
    ) {
      successLog(methodName);
      handleSuccessResponse(
        res,
        projectResource.data,
        projectResource.message,
        projectResource.statusCode
      );
      return;
    } else {
      errorLog(methodName, projectResource.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        projectResource.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * List project resources with optional filters, pagination, and sorting.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Resolves when the list retrieval is complete.
 */
async function listProjectResource(req: Request, res: Response): Promise<void> {
  const methodName = "Get project resource list";
  try {
    const { accountId, projectId } = req.params;

    const userId = req.headers["x-user-id"] as string;

    const value = await validateRequest(req, listResourceSchema, res, "GET");

    let parsedFilters: Record<string, any> = {};

    if (!value) {
      return;
    }

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

    const pageNum: number = parseInt(value.page, 10) || 1;
    const limitNum: number = parseInt(value.limit, 10) || 25;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    const projectResourceDetails =
      await projectResourceServices.listProjectResources(
        accountId,
        projectId,
        value.fiscalYear !== "" && value.fiscalYear !== null
          ? value.fiscalYear
          : 0,
        pageNum,
        limitNum,
        parsedFilters,
        value.sortBy,
        value.sortOrder,
        value.search
      );

    if (projectResourceDetails.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, projectResourceDetails.data);
      return;
    } else {
      errorLog(methodName, projectResourceDetails.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        projectResourceDetails.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Get detailed information about a specific project resource.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Resolves when the details retrieval is complete.
 */
async function projectResourceDetails(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get project resource details";
  try {
    const { id: projectResourceId, accountId } = req.params;
    const userId = req.headers["x-user-id"] as string;
    logMessage("Request received for project resource details with projectResourceId: " + projectResourceId + " and accountId: " + accountId + " and userId: " + userId);

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    const projectResourceDetails =
      await projectResourceServices.projectResourceDetails(
        projectResourceId,
        accountId
      );
    if (projectResourceDetails.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, projectResourceDetails.data);
      return;
    } else {
      errorLog(methodName, projectResourceDetails.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        projectResourceDetails.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Export the list of project resources based on filters and sorting.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Resolves when the export process is complete.
 */
async function exportProjectResource(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Export project resource list";
  try {
    const { accountId, projectId } = req.params;

    const userId = req.headers["x-user-id"] as string;

    const value = await validateRequest(
      req,
      exportListProjectResourceSchema,
      res,
      "GET"
    );
    logMessage("Request received for export project resource with data: " + JSON.stringify(value) + " and userId: " + userId);

    let parsedFilters: Record<string, any> = {};

    if (!value) {
      return;
    }

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

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    const projectResourceDetails =
      await projectResourceServices.exportProjectResources(
        accountId,
        projectId,
        value.fiscalYear !== "" && value.fiscalYear !== null
          ? value.fiscalYear
          : 0,
        parsedFilters,
        value.sortBy,
        value.sortOrder,
        userId,
        value.search
      );

    if (projectResourceDetails.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(
        res,
        await generateExcelBase64(
          projectResourceDetails.data?.projectResources,
          "Project Resource"
        )
      );
      return;
    } else {
      errorLog(methodName, projectResourceDetails.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        projectResourceDetails.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Get all resource skill roles.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Resolves when the roles retrieval is complete.
 */
async function resourceSkillRoles(req: Request, res: Response): Promise<void> {
  const methodName = "Get resource roles";
  try {
    const projectResourceRoles =
      await projectResourceServices.getResourceSkillRoles();
    if (projectResourceRoles.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, projectResourceRoles.data);
      return;
    } else {
      errorLog(methodName, projectResourceRoles.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        projectResourceRoles.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Get all resource skill role subtypes.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Resolves when the subtypes retrieval is complete.
 */
async function resourceSkillRolesSubtype(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get resource roles";
  try {
    const projectResourceRolesSubtype =
      await projectResourceServices.getResourceSkillRolesSubtype();
    if (projectResourceRolesSubtype.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, projectResourceRolesSubtype.data);
      return;
    } else {
      errorLog(methodName, projectResourceRolesSubtype.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        projectResourceRolesSubtype.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Get resource codes filtered by account and optional search term.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Resolves when the codes retrieval is complete.
 */
async function resourceCodes(req: Request, res: Response): Promise<void> {
  const methodName = "Get resource codes";
  try {
    const { accountId, projectFiscalRid } = req.params;
    const { search } = req.query;
    const projectResourceCodes = await projectResourceServices.getResourceCodes(
      accountId,
      projectFiscalRid,
      search?.toString() ?? null
    );
    if (projectResourceCodes.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, projectResourceCodes.data);
      return;
    } else {
      errorLog(methodName, projectResourceCodes.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        projectResourceCodes.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Get assigned resource codes for a given account and project fiscal ID.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Resolves when the assigned codes retrieval is complete.
 */
async function assignedResourceCodes(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get assigned resource codes";
  try {
    const { accountId, projectFiscalId } = req.params;
    const projectResourceCodes =
      await projectResourceServices.getAssignedResourceCodes(
        accountId,
        projectFiscalId
      );
    if (projectResourceCodes.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, projectResourceCodes.data);
      return;
    } else {
      errorLog(methodName, projectResourceCodes.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        projectResourceCodes.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Update anomaly status, such as accepting duplicates.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Resolves when the status update is complete.
 */
async function anomalyStatusUpdate(req: Request, res: Response): Promise<void> {
  const methodName = "Accept duplicate";
  try {
    const value = await validateRequest(req, updateProjectResourceStatus, res);

    if (!value) {
      return;
    }
    logMessage(`Request received for anomaly status update with data: ${JSON.stringify(value)} user ID: ${req.headers["x-user-id"]}`);

    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    const result = await projectResourceServices.handleAnomalyStatus(
      value,
      userId
    );

    if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.message || "",
        data: result.data,
      });
      return;
    } else {
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.errorMessage
      );
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

export default {
  createProjectResource,
  updateProjectResource,
  projectResourceDetails,
  resourceCodes,
  resourceSkillRoles,
  resourceSkillRolesSubtype,
  listProjectResource,
  exportProjectResource,
  assignedResourceCodes,
  anomalyStatusUpdate,
};
