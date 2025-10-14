import { Request, Response } from "express";
import {
  errorLog,
  generateExcelBase64,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  validateRequest,
} from "../utils/helpers";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import configurations from "../config/config";
import {
  createProjectTaskSchema,
  exportListProjectTasksSchema,
  listProjectTasksSchema,
  projectTaskByIdSchema,
  updateProjectResourceStatus,
  updateProjectTaskSchema,
} from "../lib/joi/schemas/schema";

const services = configurations.getInstance().getServices();
const taskService = services.projectTaskServices;
const projectTaskService = services.projectTaskInjestionServices;

async function createProjectTask(req: Request, res: Response): Promise<any> {
  const methodName = "Create project task";
  try {
    const value = await validateRequest(req, createProjectTaskSchema, res);

    const userId = req.headers["x-user-id"] as string;
    const userPreference = value.user_preference

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
    const projectResource = await projectTaskService.createProjectTask(
      value,
      userId,
      userPreference
    );
    if (projectResource.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, projectResource.data);
      return;
    } 
    else if (projectResource.statusCode === HttpStatus.PROMPT) {
      return res.status(HttpStatus.PROMPT).send({
        statusCode : HttpStatus.PROMPT,
        statusCodeValue : HttpStatus.PROMPT_MESSAGE,
        statusMessage : projectResource.message,
        data : projectResource.data
      })
    }
    else {
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

async function getProjectTasks(req: Request, res: Response): Promise<void> {
  const methodName = "getProjectTasks";
  try {
    const value = await validateRequest(
      req,
      listProjectTasksSchema,
      res,
      "GET"
    );
    if (!value) {
      return;
    }
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

    // Before calling buildRawWhereClause
    if (typeof value.filters === "string") {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error("Invalid filters JSON:", value.filters);
        value.filters = {};
      }
    }
    const tasks = await taskService.listProjectTasks(
      value.accountRid,
      value.projectRid,
      value.filters,
      value.search,
      value.page,
      value.limit,
      value.sortBy,
      value.sortOrder
    );

    if (tasks.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, tasks.data);
      return;
    } else {
      errorLog(methodName, tasks.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        tasks.errorMessage
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

async function getProjectTaskById(req: Request, res: Response): Promise<void> {
  const methodName = "getProjectTaskById";
  try {
    const value = await validateRequest(req, projectTaskByIdSchema, res, "GET");
    if (!value) {
      return;
    }
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

    const task = await taskService.getProjectTaskById(
      value.accountRid,
      value.taskRid
    );

    if (task.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, task.data);
      return;
    } else {
      errorLog(methodName, task.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        task.errorMessage
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

async function exportAllProjectTasks(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "exportAllProjectTasks";
  try {
    const value = await validateRequest(
      req,
      exportListProjectTasksSchema,
      res,
      "GET"
    );
    if (!value) {
      return;
    }
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

    // Before calling buildRawWhereClause
    if (typeof value.filters === "string") {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error("Invalid filters JSON:", value.filters);
        value.filters = {};
      }
    }
    const tasks = await taskService.listProjectTasksExport(
      userId,
      value.accountRid,
      value.projectRid,
      value.filters,
      value.search,
      value.sortBy,
      value.sortOrder
    );

    if (tasks.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(
        res,
        await generateExcelBase64(tasks?.data?.tasks, "All Tasks")
      );
      return;
    } else {
      errorLog(methodName, tasks.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        tasks.errorMessage
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

async function updateProjectTask(req: Request, res: Response): Promise<any> {
  const methodName = "Update project task";
  try {
    const value = await validateRequest(req, updateProjectTaskSchema, res);

    const userId = req.headers["x-user-id"] as string;
    const userPreference = value.user_preference

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
    const projectResource = await projectTaskService.updateProjectTask(
      value,
      userId,
      userPreference
    );
    if (projectResource.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, projectResource.data);
      return;
    }
    else if (projectResource.statusCode === HttpStatus.PROMPT) {
      return res.status(HttpStatus.PROMPT).send({
        statusCode : HttpStatus.PROMPT,
        statusCodeValue : HttpStatus.PROMPT_MESSAGE,
        statusMessage : projectResource.message,
        data : projectResource.data
      })
    } 
    else {
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

async function assignedResourceCodes(req: Request, res: Response): Promise<void> {
  const methodName = "Get assigned resource codes";
  try {
    const { accountId, projectFiscalId } = req.params;
    const projectResourceCodes = await projectTaskService.getAssignedResourceCodes(
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
  const methodName = "Accept Anamoly";
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

    const result = await projectTaskService.handleAnomalyStatus(
      value,
      userId
    );

    if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.message || '', 
        data: result.data,
      });
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
async function fetchReCodeForPrjTask (req : Request, res : Response) : Promise<any> {
  const methodName = "fetchReCodeForPrjTask"
  try {
    const data = req.body;
    if(!data.account_rid) {
      handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, STATUS_MESSAGE.accountNoFound)
    }
    const result = await projectTaskService.listResourceCodeForProjectTask(data)
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.resCodePrjTaskSuccess,
        data : result.data
      })
    } else {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.resCodeNotFound,
        data : result.data
      })
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
  getProjectTasks,
  getProjectTaskById,
  exportAllProjectTasks,
  createProjectTask,
  updateProjectTask,
  assignedResourceCodes,
  anomalyStatusUpdate,
  fetchReCodeForPrjTask
};
