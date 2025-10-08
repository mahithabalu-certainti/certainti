import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  generateExcelBase64,
  handleErrorResponse,
  handleSuccessResponse,
  logMessage,
  successLog,
  validateRequest,
} from "../utils/helpers";
import {
  createProjectSchema,
  exportListResourceSchema,
  listAllResourceSchema,
  listResourceSchema,
  updateProjectSchema,
  updateQreAdjutmentSchema,
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const projectService = services.projectServices;

async function createProject(req: Request, res: Response): Promise<void> {
  const methodName = "Create project";
  try {
    const value = await validateRequest(req, createProjectSchema, res);
    const userId = req.headers["x-user-id"] as string;
    logMessage(`Create Project payload received: ${JSON.stringify(value)} for User Id: ${userId}`);

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

    const project = await projectService.createProject(value, userId);

    if (project.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, project.data);
      return;
    } else {
      errorLog(methodName, project.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        project.errorMessage
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

async function updateProject(req: Request, res: Response): Promise<void> {
  const methodName = "Update project";
  try {
    const value = await validateRequest(req, updateProjectSchema, res);

    const userId = req.headers["x-user-id"] as string;
    logMessage(`Update Project payload received: ${JSON.stringify(value)} for User Id: ${userId}`);

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

    const project = await projectService.updateProject(value, userId);

    if (project.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, project.data);
      return;
    } else {
      errorLog(methodName, project.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        project.errorMessage
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

async function projectById(req: Request, res: Response): Promise<void> {
  const methodName = "Project Details";
  try {
    const { accountId, projectId } = req.params;
    logMessage(`Project Details - Request received for Account ID: ${accountId}, Project ID: ${projectId}`);

    const project = await projectService.projectById(accountId, projectId);

    if (project.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, project.data);
      return;
    } else {
      errorLog(methodName, project.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        project.errorMessage
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

async function projectList(req: Request, res: Response): Promise<void> {
  const methodName = "Project List";
  try {
    const { accountId } = req.params;

    const value = await validateRequest(req, listResourceSchema, res, "GET");
    const userId = req.headers["x-user-id"] as string;
    logMessage(
      `Project List -Params for Account ID: ${accountId}, User ID: ${userId}, Payload: ${JSON.stringify(value)}`
    );

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

    const project = await projectService.projectList(
      accountId,
      value.fiscalYear !== "" && value.fiscalYear !== null
        ? value.fiscalYear
        : 0,
      pageNum,
      limitNum,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      value.bothParentAndChild,
      userId,
      value.apiSource
    );

    if (project.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, project.data);
      return;
    } else {
      errorLog(methodName, project.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        project.errorMessage
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

async function exportProjectList(req: Request, res: Response): Promise<void> {
  const methodName = "Export Project List";
  try {
    const { accountId } = req.params;

    const value = await validateRequest(req, exportListResourceSchema, res, "GET");

    let parsedFilters: Record<string, any> = {};
    const userId = req.headers["x-user-id"] as string;
    logMessage(`Export Project List - Params for Account ID: ${accountId}, User ID: ${userId}, Payload: ${JSON.stringify(value)}`);

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

    const project = await projectService.exportProjectList(
      accountId,
      value.fiscalYear !== "" && value.fiscalYear !== null
        ? value.fiscalYear
        : 0,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      value.bothParentAndChild,
      value.timezone,
      userId
    );

    if (project.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, await generateExcelBase64(project?.data?.projects,"Projects"));
      return;
    } else {
      errorLog(methodName, project.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        project.errorMessage
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

async function allProjectList(req: Request, res: Response): Promise<void> {
  const methodName = "All Project List";
  try {
    const value = await validateRequest(req, listAllResourceSchema, res, "POST");

    const userId = req.headers["x-user-id"] as string;
    logMessage(`All Project List - Param for User ID: ${userId}, Payload: ${JSON.stringify(value)}`);

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    let parsedFilters: Record<string, any> = {};
    let parsedGlobalFilters: Record<string, string[]> = {}

    if (!value) {
      return;
    }

    try {
      if (value.filters) {
        parsedFilters = value.filters;
      }
      if (value.globalFilters) {
        parsedGlobalFilters = value.globalFilters;
      }
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const pageNum: number = value.page || 1;
    const limitNum: number = value.limit || 100;

    const project = await projectService.allProjectList(
      value.fiscalYear !== "" && value.fiscalYear !== null
        ? value.fiscalYear
        : 0,
      pageNum,
      limitNum,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      parsedGlobalFilters,
      userId,
      value.bothParentAndChild,
      value.isFromuserGroup,
      value.accountRid
    );

    if (project.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, project.data);
      return;
    } else {
      errorLog(methodName, project.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        project.errorMessage
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

async function exportAllProjectList(req: Request, res: Response): Promise<void> {
  const methodName = "Export All Project List";
  try {
    const value = await validateRequest(req, exportListResourceSchema, res, "GET");

    const userId = req.headers["x-user-id"] as string;
    logMessage(`Export All Project List - Param for User ID: ${userId}, Payload: ${JSON.stringify(value)}`);

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    let parsedFilters: Record<string, any> = {};
    let parsedGlobalFilters: Record<string, string[]> = {}

    if (!value) {
      return;
    }

    try {
      if (value.filters) {
        parsedFilters = JSON.parse(value.filters);
      }
      if (value.globalFilters) {
        parsedGlobalFilters = JSON.parse(value.globalFilters);
      }
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const project = await projectService.exportAllProjectList(
      value.fiscalYear !== "" && value.fiscalYear !== null
        ? value.fiscalYear
        : 0,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      parsedGlobalFilters,
      userId,
      value.bothParentAndChild,
      value.timezone
    );

    if (project.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, await generateExcelBase64(project?.data?.projects,"Projects"));
      return;
    } else {
      errorLog(methodName, project.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        project.errorMessage
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
 * Handles the request to fetch a list of Project Classification from the geoDataService.
 *
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 *
 * This method calls the `Project Classification` service, checks the status, and sends an appropriate response:
 * - If successful, it sends a success response with the list of Project Classification.
 * - If failed, it logs the error and sends an error response.
 */
async function projectClassification(req: Request, res: Response): Promise<void> {
  const methodName = "Project Classification";
  try {
    const projectClassifications = await services.projectServices.getProjectClassification();
    if (projectClassifications.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, projectClassifications.data);
      return;
    } else {
      errorLog(methodName, projectClassifications.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        projectClassifications.message
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
    return;
  }
}

export default {
  createProject,
  updateProject,
  projectById,
  projectList,
  allProjectList,
  projectClassification,
  exportProjectList,
  exportAllProjectList
};
