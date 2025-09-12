import { Request, Response } from "express";
import {
  errorLog,
  generateExcelBase64,
  handleErrorResponse,
  handleSuccessResponse,
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
  updateResourceDuplicateStatus,
} from "../lib/joi/schemas/schema";

const services = configurations.getInstance().getServices();
const projectResourceServices = services.projectResourceServices;

async function createProjectResource(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Create project resource";
  try {
    const value = await validateRequest(req, createProjectResourceSchema, res);

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

    if (!value) {
      return;
    }
    const projectResource = await projectResourceServices.createProjectResource(
      value,
      userId
    );
    if (projectResource.statusCode === HttpStatus.SUCCESS || projectResource.statusCode === HttpStatus.PROMPT) {
      successLog(methodName);
      handleSuccessResponse(res, projectResource.data, projectResource.message, projectResource.statusCode);
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
    if (projectResource.statusCode === HttpStatus.SUCCESS || projectResource.statusCode === HttpStatus.PROMPT) {
      successLog(methodName);
      handleSuccessResponse(res, projectResource.data, projectResource.message, projectResource.statusCode);
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
        value.sortOrder
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

async function projectResourceDetails(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get project resource details";
  try {
    const { id: projectResourceId, accountId } = req.params;
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
        userId
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

async function resourceCodes(req: Request, res: Response): Promise<void> {
  const methodName = "Get resource codes";
  try {
    const { accountId } = req.params;
    const { search } = req.query;
    const projectResourceCodes = await projectResourceServices.getResourceCodes(
      accountId,
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

async function assignedResourceCodes(req: Request, res: Response): Promise<void> {
  const methodName = "Get assigned resource codes";
  try {
    const { accountId, projectFiscalId } = req.params;
    const projectResourceCodes = await projectResourceServices.getAssignedResourceCodes(
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

async function anomalyStatusUpdate(req: Request, res: Response): Promise<void> {
  const methodName = "Accept duplicate";
  try {
    const value = await validateRequest(req, updateProjectResourceStatus, res);

    if(!value){
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

    const result = await projectResourceServices.handleAnomalyStatus(
      value,
      userId
    );

    if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result.data);
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
  anomalyStatusUpdate
};
