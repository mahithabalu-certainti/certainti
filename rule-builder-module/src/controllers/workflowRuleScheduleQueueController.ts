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
  listScheduleSchema,
  createSchedulechema,
  updateScheduleSchema
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const ScheduleService = services.scheduleService;

async function createSchedule(req: Request, res: Response): Promise<void> {
  const methodName = "create schedule";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, createSchedulechema, res, "POST");
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const newSchedule = await ScheduleService.createSchedule(value, userId);
    if (newSchedule.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, newSchedule);
      return;
    } {
      errorLog(methodName, newSchedule.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        newSchedule.errorMessage
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

async function listAllSchedules(req: Request, res: Response): Promise<void> {
  const methodName = "schedule list";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listScheduleSchema, res, "GET");
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
    const result = await ScheduleService.listSchedules(
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

// export const getSchedulesByRule = async (req: Request, res: Response) => {
//   try {
//     const schedules = await ScheduleService.getRuleScheduleByRule(String(req.params.ruleRid));
//     res.json(schedules);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch schedule entries" });
//   }
// };

async function updateSchedule(req: Request, res: Response): Promise<void> {
  const methodName = "update schedule";
  try {
    const value = await validateRequest(req, updateScheduleSchema, res);
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      // errorLog(methodName, "User ID is required in headers");
      // handleErrorResponse(
      //   res,
      //   HttpStatus.BAD_REQUEST,
      //   HttpStatus.BAD_REQUEST_MESSAGE,
      //   "User ID is required in headers"
      // );
      // return;
    }
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const response = await ScheduleService.updateSchedule(value, req.body);
    if (response.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, response.data, response.message);
      return;
    } else {
      errorLog(methodName, response.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        response.errorMessage
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

// export const markScheduleExecuted = async (req: Request, res: Response) => {
//   try {
//     const updatedSchedule = await ScheduleService.markScheduleExecuted(String(req.params.rid));
//     res.json(updatedSchedule);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to mark schedule as executed" });
//   }
// };

async function deleteSchedule(req: Request, res: Response): Promise<any> {
  const methodName = "delete schedule";
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      // errorLog(methodName, "User ID is required in headers");
      // handleErrorResponse(
      //   res,
      //   HttpStatus.BAD_REQUEST,
      //   HttpStatus.BAD_REQUEST_MESSAGE,
      //   "User ID is required in headers"
      // );
      // return;
    }
    const data = req.body;
    const result = await ScheduleService.deleteSchedule(data, userId);
    if (result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else if (result.statusCode === HttpStatus.NOT_FOUND) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else {
      return res.status(HttpStatus.FAILED).send({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage,
      });
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


export default {
  createSchedule,
  listAllSchedules,
  updateSchedule,
  deleteSchedule
};