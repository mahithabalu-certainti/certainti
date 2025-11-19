import { Request, Response } from "express";
import {
  errorLog,
  generateExcelBase64,
  handleCustomResponse,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  validateRequest,
  isValidTimezone
} from "../utils/helpers";
import {
  HttpStatus,
  activityFieldMappings,
  
} from "../utils/constants";
import {
  createActivitTaskSchema,
  listActivityTaskSchema,
  exportActivitySchema
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";
import moment from "moment";

const services = configurations.getInstance().getServices();
const activityService = services.activityService;
const caseService = services.caseService;

async function createActivityTask (req : Request, res : Response) {
  const methodName = "Create Task";
  try {
  const value = await validateRequest(req, createActivitTaskSchema, res, "POST");
    if (!value) {
      return;    }
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }
    const data = req.body;
    data.created_by = userId
    const result = await activityService.createActivityTask(data,userId);
     if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, result.data, result.message);
      return;
    } else {
      errorLog(methodName, result.errorMessage);
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
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function updateActivityTask (req : Request, res : Response) {
  const methodName = "Update Task";
  try {
  const value = await validateRequest(req, createActivitTaskSchema, res, "POST");
    if (!value) {
      return;    }
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }
    const data = req.body;
    data.created_by = userId
    const result = await activityService.createActivityTask(data,userId);
     if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, result.data, result.message);
      return;
    } else {
      errorLog(methodName, result.errorMessage);
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
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}


async function getAllActivityTask (req : Request, res : Response) {
  const methodName = "Create Task";
  try {
  const value = await validateRequest(req, listActivityTaskSchema, res, "GET");
    if (!value) {
      return;    }
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }
    const data = req.body;
    data.created_by = userId
    const result = await activityService.getAllActivities(userId,value.attachmentLevel,value.entityId,value.accountRid,value.page,value.limit,value.search,value.filters,value.sortBy,value.sortOrder,value.fiscalYear,"list", {});
     if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, result.data, result.message);
      return;
    } else {
      errorLog(methodName, result.errorMessage);
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
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function exportAllChecklists(req: Request, res: Response): Promise<void> {
  const methodName = "export all checklists";
  try {

    const value = await validateRequest(req, exportActivitySchema, res, "GET");
     if (!value) {
      return;    }
    const userId = req.headers['x-user-id'] as string;

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
    if (typeof value.filters === 'string') {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error('Invalid filters JSON:', value.filters);
        value.filters = {};
      }
    }
    const checklists = await activityService.getAllActivities(userId,value.attachmentLevel,value.entityId,value.accountRid,value.page,value.limit,value.search,value.filters,value.sortBy,value.sortOrder,value.fiscalYear,"download", {});
    const fields = await caseService.getAllowedExportFields(
      userId,
      "activity_task_view_edit"
    );
    const allowedFieldSet = new Set<string>();
    for (const field of fields) {
      if (field.read) {
        allowedFieldSet.add(field.field_name);
      }
    }
    const isValidTZ = value.timezone && isValidTimezone(value.timezone);
    const formatDate = (date?: Date) => {
      if (!date) return null;
      
      return moment(date)
        .tz(isValidTZ ? value.timezone : "UTC")
        .format("YYYY-MMM-DD, hh:mm:ss A");
    };
    if (checklists.statusCode === HttpStatus.SUCCESS) {
        const finalStructuredData =
        !checklists?.data?.activities || checklists.data.activities.length < 1
          ? []
          : checklists.data.activities.map((d: any) => {
              let resultMap: { [key: string]: any } = {
                r_number: d.r_number,
                fiscal_year: `FY-${d.fiscal_year}`,
                checklist_name: d.checklist_name,
                attachment_level: d.attachment_level,
                attach_to: d.attach_to,
                attached_to: d.attached_to,
                created_by: d.created_by_name,
                created_datetime: formatDate(d.created_datetime),
                modified_by: d.modified_by_name,
                modified_datetime:
                  d.modified_datetime == null
                    ? ""
                    : formatDate(d.modified_datetime),
              };

              // Build exportRecord using allowed fields and resultMap
              const exportRecord: Record<string, any> = {};
              activityFieldMappings.forEach((mapping) => {
                if (allowedFieldSet.has(mapping.permissionField)) {
                  exportRecord[mapping.exportField] =
                    resultMap[mapping.dataField];
                }
              });

              return exportRecord;
            });

      const generateBase64Response = await generateExcelBase64(
        finalStructuredData,
        "Cases"
      );
      successLog(methodName);
      handleSuccessResponse(res, generateBase64Response);
      return;
    } else {
      errorLog(methodName, checklists.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        checklists.errorMessage
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
  createActivityTask,
  updateActivityTask,
  getAllActivityTask,
  exportAllChecklists
};