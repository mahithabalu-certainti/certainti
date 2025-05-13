import { Request, Response } from "express";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  validateRequest,
  generateExcelBase64,
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

async function createResource(req: Request, res: Response): Promise<void> {
  const methodName = "Create resource";
  try {
    const value = await validateRequest(req, createResourcesSchema, res);
    const userId = req.headers["x-user-id"] as string;

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
        resources.errorMessage?.replace(/(Validation error:|Validation failed)/g, '').trim()
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

async function resourcesList(req: Request, res: Response): Promise<void> {
  const methodName = "Resources list";
  try {
    const { accountNumber } = req.params;

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

async function exportResourcesList(req: Request, res: Response): Promise<void> {
  const methodName = "export ResourcesList";
  try {
    const { accountNumber } = req.params;

    const value = await validateRequest(req, exportResourceSchema, res, "GET");

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
      value.sortOrder
    );

    if (resourcesList.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, await generateExcelBase64(resourcesList?.data?.resources,"Resources"));
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

async function resourcesById(req: Request, res: Response): Promise<void> {
  const methodName = "Resource By Id";
  try {
    const { accountNumber, id } = req.params;

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

async function updateResource(req: Request, res: Response): Promise<void> {
  const methodName = "Update resource";
  try {
    const value = await validateRequest(req, updateResourceSchema, res);
    const userId = req.headers["x-user-id"] as string;

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
        updateResource.errorMessage?.replace(/(Validation error:|Validation failed)/g, '').trim()
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
