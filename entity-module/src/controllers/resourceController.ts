import { Request, Response } from "express";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  validateRequest,
  generateExcelBase64,
  logMessage,
} from "../utils/helpers";
import { HttpStatus } from "../utils/constants";
import {
  createResourcesSchema,
  listResourceSchema,
  exportResourceSchema,
  updateResourceSchema,
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const resourceService = services.resourceService;

/**
 * Handles the creation of a new resource.
 *
 * - Validates the incoming request using the `createResourcesSchema`.
 * - Verifies the presence of a user ID from the headers.
 * - Delegates the creation logic to the `resourceService`.
 * - Returns a success or error response based on service outcome.
 *
 * @param {Request} req - Express request object containing resource data and user ID in headers.
 * @param {Response} res - Express response object used to send the result.
 * @returns {Promise<void>}
 */
async function createResource(req: Request, res: Response): Promise<void> {
  const methodName = "Create resource";
  try {
    const value = await validateRequest(req, createResourcesSchema, res);
    const userId = req.headers["x-user-id"] as string;
    logMessage(`Create Resource payload received: ${JSON.stringify(value)} for User Id: ${userId}`);

    if (!userId) {
      errorLog(methodName, "User Id not found");
      handleErrorResponse(
        res,
        HttpStatus.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED_MESSAGE,
        "User Id not found in headers"
      );
      return;
    }

    if (!value) {
      return;
    }

    const resources = await resourceService.createResource(value, userId);
    if (resources.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, resources.data);
      return;
    } else {
      errorLog(methodName, resources.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resources.errorMessage
          ?.replace(/(Validation error:|Validation failed)/g, "")
          .trim()
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
 * Retrieves a paginated and optionally filtered list of resources.
 *
 * - Validates request using `listResourceSchema`.
 * - Parses pagination, search, filters, and sorting options.
 * - Fetches resources from `resourceService`.
 * - Returns the result as success or error response.
 *
 * @param {Request} req - Express request containing query parameters and accountNumber in path.
 * @param {Response} res - Express response used to send results back to the client.
 * @returns {Promise<void>}
 */
async function resourcesList(req: Request, res: Response): Promise<void> {
  const methodName = "Resources list";
  try {
    const { accountNumber } = req.params;

    const value = await validateRequest(req, listResourceSchema, res, "GET");
    const userId = req.headers["x-user-id"] as string;
    logMessage(`Resource List payload received: ${JSON.stringify(value)} for User Id: ${userId}`);

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

    const resourcesList = await resourceService.resourcesList(
      accountNumber,
      pageNum,
      limitNum,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder
    );

    if (resourcesList.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, resourcesList.data);
      return;
    } else {
      errorLog(methodName, resourcesList.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resourcesList.errorMessage
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
 * Exports the filtered and sorted resource list as a downloadable Excel file.
 *
 * - Validates the request using `exportResourceSchema`.
 * - Parses filters and user ID from the request.
 * - Fetches resource data from `resourceService`.
 * - Converts the data to Excel format and returns a Base64 string.
 *
 * @param {Request} req - Express request containing export parameters and user ID.
 * @param {Response} res - Express response used to send the exported data.
 * @returns {Promise<void>}
 */
async function exportResourcesList(req: Request, res: Response): Promise<void> {
  const methodName = "export ResourcesList";
  try {
    const { accountNumber } = req.params;
    const userId = req.headers["x-user-id"] as string;

    const value = await validateRequest(req, exportResourceSchema, res, "GET");
    logMessage(`Export Resource payload received: ${JSON.stringify(value)} for User Id: ${userId}`);

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

    const resourcesList = await resourceService.exportResourcesList(
      accountNumber,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      userId
    );

    if (resourcesList.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(
        res,
        await generateExcelBase64(resourcesList?.data?.resources, "Resources")
      );
      return;
    } else {
      errorLog(methodName, resourcesList.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resourcesList.errorMessage
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
 * Fetches detailed information for a specific resource by its ID.
 *
 * - Retrieves resource details using accountNumber and resource ID.
 * - Sends the resource details or an error response.
 *
 * @param {Request} req - Express request containing accountNumber and resource ID in path parameters.
 * @param {Response} res - Express response object used to return resource details or error.
 * @returns {Promise<void>}
 */
async function resourcesById(req: Request, res: Response): Promise<void> {
  const methodName = "Resource By Id";
  try {
    const { accountNumber, id } = req.params;
    const userId = req.headers["x-user-id"] as string;
    logMessage(`Resource By Id payload received Account Number: ${accountNumber} ID: ${id} for User Id: ${userId}`);


    const resourceDetails = await resourceService.resourceById(
      accountNumber,
      id
    );

    if (resourceDetails.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, resourceDetails.data);
      return;
    } else {
      errorLog(methodName, resourceDetails.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resourceDetails.errorMessage
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
 * Updates an existing resource's information.
 *
 * - Validates the incoming request using `updateResourceSchema`.
 * - Verifies the presence of a user ID.
 * - Delegates update logic to the `resourceService`.
 * - Returns a success or error response based on the update outcome.
 *
 * @param {Request} req - Express request containing updated resource data and user ID.
 * @param {Response} res - Express response object used to return update result.
 * @returns {Promise<void>}
 */
async function updateResource(req: Request, res: Response): Promise<void> {
  const methodName = "Update resource";
  try {
    const value = await validateRequest(req, updateResourceSchema, res);
    const userId = req.headers["x-user-id"] as string;
    logMessage(`Update Resource payload received: ${JSON.stringify(value)} for User Id: ${userId}`);

    if (!userId) {
      errorLog(methodName, "User Id not found");
      handleErrorResponse(
        res,
        HttpStatus.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED_MESSAGE,
        "User Id not found in headers"
      );
      return;
    }

    if (!value) {
      return;
    }

    const updateResource = await resourceService.updateResource(value, userId);

    if (updateResource.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, updateResource.data);
      return;
    } else {
      errorLog(methodName, updateResource.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        updateResource.errorMessage
          ?.replace(/(Validation error:|Validation failed)/g, "")
          .trim()
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

export default {
  createResource,
  resourcesList,
  exportResourcesList,
  resourcesById,
  updateResource,
};
