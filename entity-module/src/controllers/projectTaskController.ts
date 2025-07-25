import { Request, Response } from "express";
import {
  errorLog,
  generateExcelBase64,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  validateRequest,
} from "../utils/helpers";
import { HttpStatus } from "../utils/constants";
import configurations from "../config/config";
import {
  createProjectTaskSchema,
  exportListProjectTasksSchema,
  listProjectTasksSchema,
  projectTaskByIdSchema,
} from "../lib/joi/schemas/schema";

const services = configurations.getInstance().getServices();
const taskService = services.projectTaskServices;
const projectTaskService = services.projectTaskInjestionServices;

async function createProjectTask(req: Request, res: Response): Promise<void> {
  const methodName = "Create project task";
  try {
    const value = await validateRequest(req, createProjectTaskSchema, res);

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
    const projectResource = await projectTaskService.createProjectTask(
      value,
      userId
    );
    if (projectResource.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, projectResource.data);
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
      value.projectResourceRid,
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
      value.projectResourceRid,
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

export default {
  getProjectTasks,
  getProjectTaskById,
  exportAllProjectTasks,
  createProjectTask,
};
