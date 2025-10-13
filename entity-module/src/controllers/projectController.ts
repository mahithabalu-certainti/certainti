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
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const projectService = services.projectServices;

/**
 * Creates a new project using the validated request body.
 *
 * @async
 * @function createProject
 * @param {Request} req - The Express request object containing project data.
 * @param {Response} res - The Express response object used to send the response.
 * @returns {Promise<void>} Sends success or error response based on creation outcome.
 *
 * @description
 * - Validates request using `createProjectSchema`.
 * - Extracts user ID from request headers.
 * - Delegates to `projectService.createProject` for business logic.
 * - Returns the created project or an error response.
 */
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

/**
 * Updates an existing project with the provided request body.
 *
 * @async
 * @function updateProject
 * @param {Request} req - The Express request object containing updated project data.
 * @param {Response} res - The Express response object used to send the response.
 * @returns {Promise<void>} Sends success or error response based on update outcome.
 *
 * @description
 * - Validates request using `updateProjectSchema`.
 * - Extracts user ID from headers.
 * - Delegates to `projectService.updateProject` for update logic.
 */
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

/**
 * Retrieves a specific project's details by account and project IDs.
 *
 * @async
 * @function projectById
 * @param {Request} req - The Express request object with `accountId` and `projectId` as route params.
 * @param {Response} res - The Express response object to send the result.
 * @returns {Promise<void>} Sends project details or error response.
 *
 * @description
 * - Calls `projectService.projectById` using provided params.
 * - Sends back the project info or an appropriate error message.
 */
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

/**
 * Fetches a paginated list of projects for a given account with optional filters and search.
 *
 * @async
 * @function projectList
 * @param {Request} req - Express request object containing filters, pagination, and sort info.
 * @param {Response} res - Express response object to send results.
 * @returns {Promise<void>} Sends a list of projects or an error response.
 *
 * @description
 * - Validates the query using `listResourceSchema`.
 * - Parses filters and handles pagination.
 * - Fetches data using `projectService.projectList`.
 */
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

/**
 * Exports a filtered list of projects for a given account in Excel (Base64) format.
 *
 * @async
 * @function exportProjectList
 * @param {Request} req - The Express request object containing query filters and params.
 * @param {Response} res - The Express response object to send the file data.
 * @returns {Promise<void>} Sends Base64-encoded Excel file or error response.
 *
 * @description
 * - Validates query using `exportListResourceSchema`.
 * - Parses filters and fetches exportable data from `projectService.exportProjectList`.
 * - Converts data to Excel via `generateExcelBase64`.
 */
async function exportProjectList(req: Request, res: Response): Promise<void> {
  const methodName = "Export Project List";
  try {
    const { accountId } = req.params;

    const value = await validateRequest(
      req,
      exportListResourceSchema,
      res,
      "GET"
    );

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
      handleSuccessResponse(
        res,
        await generateExcelBase64(project?.data?.projects, "Projects")
      );
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
 * Fetches a global list of all accessible projects, with optional filters, global filters, and pagination.
 *
 * @async
 * @function allProjectList
 * @param {Request} req - Express request object with filter and user info in body and headers.
 * @param {Response} res - Express response object to return the results.
 * @returns {Promise<void>} Sends paginated global project list or error response.
 *
 * @description
 * - Validates request using `listAllResourceSchema`.
 * - Supports both per-account and global project listing.
 * - Uses `projectService.allProjectList` to fetch data.
 */
async function allProjectList(req: Request, res: Response): Promise<void> {
  const methodName = "All Project List";
  try {
    const value = await validateRequest(
      req,
      listAllResourceSchema,
      res,
      "POST"
    );

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
    let parsedGlobalFilters: Record<string, string[]> = {};

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

/**
 * Exports all projects globally accessible to the user based on filters and permissions.
 *
 * @async
 * @function exportAllProjectList
 * @param {Request} req - Express request object containing query params, filters, and headers.
 * @param {Response} res - Express response object to send the Excel file in Base64 format.
 * @returns {Promise<void>} Sends export data or an error message.
 *
 * @description
 * - Validates query using `exportListResourceSchema`.
 * - Parses JSON filters and global filters from query params.
 * - Uses `projectService.exportAllProjectList` and exports to Excel via `generateExcelBase64`.
 */
async function exportAllProjectList(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Export All Project List";
  try {
    const value = await validateRequest(
      req,
      exportListResourceSchema,
      res,
      "GET"
    );

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
    let parsedGlobalFilters: Record<string, string[]> = {};

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
      handleSuccessResponse(
        res,
        await generateExcelBase64(project?.data?.projects, "Projects")
      );
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
async function projectClassification(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Project Classification";
  try {
    const projectClassifications =
      await services.projectServices.getProjectClassification();
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
  exportAllProjectList,
};
