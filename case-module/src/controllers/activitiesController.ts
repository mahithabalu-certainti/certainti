import { Request, Response } from "express";
import {
  errorLog,
  generateExcelBase64,
  handleCustomResponse,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  validateRequest,
  isValidTimezone,
  logMessage,
} from "../utils/helpers";
import { HttpStatus } from "../utils/constants";
import {
  listActivityTaskSchema,
  exportActivitySchema,
  createActivityEmailSchema,
  updateActivityEmailSchema,
  updateActivityMeetingSchema,
  createActivityMeetingSchema,
  updateActivityCallSchema,
  createActivityCallSchema,
  updateActivityTaskSchema,
  createActivityTaskSchema,
  cancelActivityMeetingSchema,
  completeActivityMeetingSchema
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";
import moment from "moment";
import { activityFieldMappings, callactivityFieldMappings, emailactivityFieldMappings, meetingactivityFieldMappings, taskactivityFieldMappings } from "../utils/excelExportMapping";

const services = configurations.getInstance().getServices();
const activityService = services.activityService;
const caseService = services.caseService;

async function createActivityTask(req: Request, res: Response) {
  const methodName = "Create Task";
  try {
    const value = await validateRequest(
      req,
      createActivityTaskSchema,
      res,
      "POST"
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
    const data = req.body;
    data.created_by = userId;
    const result = await activityService.createActivityTask(data, userId);
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

async function updateActivityTask(req: Request, res: Response) {
  const methodName = "Update Task";
  try {
    const value = await validateRequest(
      req,
      updateActivityTaskSchema,
      res,
      "POST"
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
    const data = req.body;
    data.created_by = userId;
    const result = await activityService.updateActivityTask(data, userId);
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

async function createActivityEmail(req: Request, res: Response) {
  const methodName = "Create Task";
  try {
    const value = await validateRequest(
      req,
      createActivityEmailSchema,
      res,
      "POST"
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
    const data = req.body;
    let fileArray: Express.Multer.File[] | [];
    if (Array.isArray(req.files)) {
      fileArray = req.files;
    } else {
      fileArray = [];
    }
    data.created_by = userId;
    const result = await activityService.createActivityEmail(
      data,
      userId,
      fileArray
    );
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
async function updateActivityEmail(req: Request, res: Response) {
  const methodName = "Update Email";
  try {
    const value = await validateRequest(
      req,
      updateActivityEmailSchema,
      res,
      "POST"
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
    const data = req.body;
    let fileArray: Express.Multer.File[] | [];
    if (Array.isArray(req.files)) {
      fileArray = req.files;
    } else {
      fileArray = [];
    }
    data.created_by = userId;
    if (data.deleted_file_ids !== undefined) {
      data.deleted_file_ids = JSON.parse(data.deleted_file_ids)
    }
    const result = await activityService.updateActivityEmail(
      data,
      userId,
      fileArray
    );
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

async function createActivityMeeting(req: Request, res: Response) {
  const methodName = "Create Meeting";
  try {
    const value = await validateRequest(
      req,
      createActivityMeetingSchema,
      res,
      "POST"
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
    const data = req.body;
    let fileArray: Express.Multer.File[] | [];
    if (Array.isArray(req.files)) {
      fileArray = req.files;
    } else {
      fileArray = [];
    }
    data.created_by = userId;
    const result = await activityService.createActivityMeeting(
      data,
      userId,
      fileArray
    );
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
async function updateActivityMeeting(req: Request, res: Response) {
  const methodName = "Update Meeting";
  try {
    const value = await validateRequest(
      req,
      updateActivityMeetingSchema,
      res,
      "POST"
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
    const data = req.body;
    let fileArray: Express.Multer.File[] | [];
    if (Array.isArray(req.files)) {
      fileArray = req.files;
    } else {
      fileArray = [];
    }
    data.created_by = userId;
    if (data.deleted_file_ids !== undefined) {
      data.deleted_file_ids = JSON.parse(data.deleted_file_ids)
    }
    const result = await activityService.updateActivityMeeting(
      data,
      userId,
      fileArray
    );
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

async function cancelActivityMeeting(req: Request, res: Response) {
  const methodName = "Cancel Meeting";
  try {
    const value = await validateRequest(
      req,
      cancelActivityMeetingSchema,
      res,
      "POST"
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
    const result = await activityService.cancelActivityMeeting(
      value,
      userId
    );
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

async function completeActivityMeeting(req: Request, res: Response) {
  const methodName = "Complete Meeting";
  try {
    const value = await validateRequest(
      req,
      completeActivityMeetingSchema,
      res,
      "POST"
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
    const result = await activityService.completeActivityMeeting(
      value,
      userId
    );
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
async function createActivityCall(req: Request, res: Response) {
  const methodName = "Create Call";
  try {
    const value = await validateRequest(
      req,
      createActivityCallSchema,
      res,
      "POST"
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
    const data = req.body;
    let fileArray: Express.Multer.File[] | [];
    if (Array.isArray(req.files)) {
      fileArray = req.files;
    } else {
      fileArray = [];
    }
    data.created_by = userId;
    const result = await activityService.createActivityCall(
      data,
      userId,
      fileArray
    );
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
async function updateActivityCall(req: Request, res: Response) {
  const methodName = "Update Call";
  try {
    const value = await validateRequest(
      req,
      updateActivityCallSchema,
      res,
      "POST"
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
    const data = req.body;
    let fileArray: Express.Multer.File[] | [];
    if (Array.isArray(req.files)) {
      fileArray = req.files;
    } else {
      fileArray = [];
    }
    data.created_by = userId;
    if (data.deleted_file_ids !== undefined) {
      data.deleted_file_ids = JSON.parse(data.deleted_file_ids)
    }
    const result = await activityService.updateActivityCall(
      data,
      userId,
      fileArray
    );
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


async function deleteActivityAttachments(req: Request, res: Response) {
  const methodName = "deleteActivityAttachments";
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    const result = await activityService.deleteActivityAttachments(
      data,
      userId
    );
    if (result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else if (result.statusCode === HttpStatus.NOT_FOUND) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage,
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function getAllActivityTask(req: Request, res: Response) {
  const methodName = "Create Task";
  try {
    const value = await validateRequest(
      req,
      listActivityTaskSchema,
      res,
      "GET"
    );
    if (!value) {
      return;
    }
    const userId = req.headers["x-user-id"] as string;
    if (typeof value.filters === 'string') {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error('Invalid filters JSON:', value.filters);
        value.filters = {};
      }
    }

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
    data.created_by = userId;
    const result = await activityService.getAllActivities(
      userId,
      value.attachmentLevel,
      value.entityId,
      value.accountRid,
      value.page,
      value.limit,
      value.search,
      value.filters,
      value.sortBy,
      value.sortOrder,
      value.fiscalYear,
      "list",
      value.activityType,
      {}
    );
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

async function exportAllActivity(req: Request, res: Response): Promise<void> {
  const methodName = "export all activities";
  try {
    const value = await validateRequest(req, exportActivitySchema, res, "GET");
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
    const checklists = await activityService.getAllActivities(
      userId,
      value.attachmentLevel,
      value.entityId,
      value.accountRid,
      value.page,
      value.limit,
      value.search,
      value.filters,
      value.sortBy,
      value.sortOrder,
      value.fiscalYear,
      "download",
      value.activityType,
      {}
    );
    let permissionName = "activity_task_view_edit";
    if (value.activityType && value.activityType.toLowerCase() === "email") {
      permissionName = "activity_email_view_edit";
    } else if (
      value.activityType &&
      value.activityType.toLowerCase() === "meeting"
    ) {
      permissionName = "activity_meeting_view_edit";
    } else if (
      value.activityType &&
      value.activityType.toLowerCase() === "call log"
    ) {
      permissionName = "activity_call_view_edit";
    } else {
      permissionName = "activity_task_view_edit";
    }
    const fields = await caseService.getAllowedExportFields(
      userId,
      permissionName
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

    // Helper for just date
    const formatDateOnly = (date?: Date) => {
      if (!date) return null;
      return moment(date).format("YYYY-MMM-DD");
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
              status_name: d.status_name,
              created_by: d.created_by_name,
              description: d.description,
              created_datetime: formatDate(d.created_datetime),
              effective_start_datetime:
              d.activity_type && d.activity_type.toLowerCase() === "task" ? 
              formatDateOnly(d.effective_start_datetime) 
              : value.activityType && value.activityType === 'All' ? "-" : formatDate(d.effective_start_datetime),
              effective_end_datetime:
                d.activity_type && d.activity_type.toLowerCase() === "task"
                  ? formatDateOnly(d.effective_end_datetime)
                  : value.activityType && value.activityType === 'All' ? "-" : formatDate(d.effective_end_datetime),
              activity_type: d.activity_type,
              created_by_name: d.created_by_name,
              call_platform: d.call_platform,
              to_email: Array.isArray(d.to_email) ? d.to_email.join(",") : d.to_email,

              effective_start_time: d.effective_start_time ? moment(d.effective_start_time, 'HH:mm').format('h:mm A') : '',
              effective_end_time: d.effective_end_time ? moment(d.effective_end_time, 'HH:mm').format('h:mm A') : '',
              subject: d.subject,
              modified_by: d.modified_by_name,
              modified_datetime:
                d.modified_datetime == null
                  ? ""
                  : formatDate(d.modified_datetime),
              assigned_to_name: d.assigned_to_name,
              invited_by: d.invited_by,
              task_name: d.task_name,
            };

            // Build exportRecord using allowed fields and resultMap
            const exportRecord: Record<string, any> = {};
            if (value.activityType && value.activityType.toLowerCase() === "email") {
              emailactivityFieldMappings.forEach((mapping) => {
                if (allowedFieldSet.has(mapping.permissionField)) {
                  exportRecord[mapping.exportField] =
                    resultMap[mapping.dataField];
                }
              });
            } else if (value.activityType && value.activityType.toLowerCase() === "meeting") {
              meetingactivityFieldMappings.forEach((mapping) => {
                if (allowedFieldSet.has(mapping.permissionField)) {
                  exportRecord[mapping.exportField] =
                    resultMap[mapping.dataField];
                }
              });
            } else if (value.activityType && value.activityType.toLowerCase() === "call log") {
              callactivityFieldMappings.forEach((mapping) => {
                if (allowedFieldSet.has(mapping.permissionField)) {
                  exportRecord[mapping.exportField] =
                    resultMap[mapping.dataField];
                }
              });
            } else if (value.activityType && value.activityType.toLowerCase() === "task") {
              taskactivityFieldMappings.forEach((mapping) => {
                if (allowedFieldSet.has(mapping.permissionField)) {
                  exportRecord[mapping.exportField] =
                    resultMap[mapping.dataField];
                }
              });
            } else {
              activityFieldMappings.forEach((mapping) => {
                exportRecord[mapping.exportField] =
                  resultMap[mapping.dataField];
              });
            }


            return exportRecord;
          });

      const generateBase64Response = await generateExcelBase64(
        finalStructuredData,
        "Activities"
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

async function fetchEmailActivityById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get email template details";
  try {
    const { activityRid, accountRid } = req.params;
    const userId = req.headers["x-user-id"] as string;
    logMessage(
      `[${methodName}] Request received,  activityRid: ${activityRid} userId: ${userId}`
    );
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    if (!activityRid) {
      errorLog(methodName, "Activity ID is required in params");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Activity ID is required in params"
      );
      return;
    }
    if (!accountRid) {
      errorLog(methodName, "Account RID is required in params");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Account RID is required in params"
      );
      return;
    }
    let emailTemplateResponse;
    emailTemplateResponse = await activityService.getEmailActivityDetailsById(
      activityRid,
      accountRid
    );

    if (emailTemplateResponse.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, emailTemplateResponse.data);
      return;
    } else {
      errorLog(methodName, emailTemplateResponse.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        emailTemplateResponse.errorMessage
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

async function fetchMeetingActivityById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get meeting  details";
  try {
    const { activityRid, accountRid } = req.params;
    const userId = req.headers["x-user-id"] as string;
    logMessage(
      `[${methodName}] Request received,  activityRid: ${activityRid} userId: ${userId}`
    );
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    if (!activityRid) {
      errorLog(methodName, "Activity ID is required in params");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Activity ID is required in params"
      );
      return;
    }
    if (!accountRid) {
      errorLog(methodName, "Account RID is required in params");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Account RID is required in params"
      );
      return;
    }
    let emailTemplateResponse;
    emailTemplateResponse = await activityService.getMeetingActivityDetailsById(
      activityRid,
      accountRid
    );

    if (emailTemplateResponse.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, emailTemplateResponse.data);
      return;
    } else {
      errorLog(methodName, emailTemplateResponse.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        emailTemplateResponse.errorMessage
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

async function fetchCallActivityById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get call details";
  try {
    const { activityRid, accountRid } = req.params;
    const userId = req.headers["x-user-id"] as string;
    logMessage(
      `[${methodName}] Request received,  activityRid: ${activityRid} userId: ${userId}`
    );
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    if (!activityRid) {
      errorLog(methodName, "Activity ID is required in params");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Activity ID is required in params"
      );
      return;
    }
    if (!accountRid) {
      errorLog(methodName, "Account RID is required in params");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Account RID is required in params"
      );
      return;
    }
    let emailTemplateResponse;
    emailTemplateResponse = await activityService.getCallActivityDetailsById(
      activityRid,
      accountRid
    );

    if (emailTemplateResponse.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, emailTemplateResponse.data);
      return;
    } else {
      errorLog(methodName, emailTemplateResponse.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        emailTemplateResponse.errorMessage
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

async function getActivityStatus(req: Request, res: Response): Promise<void> {
  const methodName = "Get Activity Status";
  try {
    const activityType = req.query.activity_type as string || 'all'
    const activityStatus = await activityService.getActivityStatus(activityType);
    if (activityStatus.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, activityStatus.data);
      return;
    } else {
      errorLog(methodName, activityStatus.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        activityStatus.errorMessage
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
  exportAllActivity,
  createActivityEmail,
  deleteActivityAttachments,
  updateActivityEmail,
  fetchEmailActivityById,
  getActivityStatus,
  createActivityMeeting,
  updateActivityMeeting,
  createActivityCall,
  updateActivityCall,
  fetchMeetingActivityById,
  fetchCallActivityById,
  cancelActivityMeeting,
  completeActivityMeeting
};
