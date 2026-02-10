import { Request, Response } from "express";
import configurations from "../config/config";
import { handleErrorResponse, errorLog, handleCustomResponse, validateRequest, generateExcelBase64, handleSuccessResponse, isValidTimezone } from "../utils/helpers";
import moment from "moment-timezone";
import { HttpStatus } from "../utils/constants";
import { reportFlagSchema, getOverallProjectValueSchema, globalLevelChartSchema, casesByHealthStatusSchema } from "../lib/joi/schemas/schema";


const reportService = configurations.getInstance().getServices().reportService;

async function getCountDetails(req: Request, res: Response): Promise<void> {
    const methodName = "getCountDetails";
    try {
        const userId = req.headers["x-user-id"] as string;

        const value = await validateRequest(req, reportFlagSchema, res, "GET");

        if (!value) return;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const result = await reportService.getCountDetails(
            userId,
            value.flag
        );

        if (result.statusCode === HttpStatus.SUCCESS) {
            handleCustomResponse(res, result.data, result.message);
        } else {
            handleErrorResponse(res, result.statusCode, HttpStatus.BAD_REQUEST_MESSAGE, result.message);
        }

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}

async function getMeetingList(req: Request, res: Response): Promise<void> {
    const methodName = "getMeetingList";
    try {
        const userId = req.headers["x-user-id"] as string;

        const value = await validateRequest(req, reportFlagSchema, res, "GET");

        if (!value) return;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const result = await reportService.getMeetingList(
            userId,
            value.flag
        );

        if (result.statusCode === HttpStatus.SUCCESS) {
            handleCustomResponse(res, result.data, result.message);
        } else {
            handleErrorResponse(res, result.statusCode, HttpStatus.BAD_REQUEST_MESSAGE, result.message);
        }

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}

async function exportMeetingList(req: Request, res: Response): Promise<void> {
    const methodName = "exportMeetingList";
    try {
        const userId = req.headers["x-user-id"] as string;

        // Manually extract timezone as it's not in reportFlagSchema
        const timezone = req.query.timezone as string;

        const value = await validateRequest(req, reportFlagSchema, res, "GET");

        if (!value) return;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const result = await reportService.getMeetingList(
            userId,
            value.flag
        );

        if (result.statusCode === HttpStatus.SUCCESS) {
            const permissionName = "activity_meeting_view_edit";
            const allowedFields = await reportService.getAllowedExportFields(userId, permissionName);

            const allowedFieldSet = new Set<string>();
            for (const field of allowedFields) {
                if (field.read) {
                    allowedFieldSet.add(field.field_name);
                }
            }

            // Define mappings
            const fieldMappings = [
                { header: "R Number", key: "r_number", permission: "r_number" },
                { header: "Subject", key: "subject", permission: "subject" },
                { header: "Status", key: "status_name", permission: "status_rid" },
                { header: "Priority", key: "priority_name", permission: "priority_rid" },
                { header: "Start Date", key: "effective_start_datetime", permission: "effective_start_datetime" },
                { header: "Start Time", key: "effective_start_time", permission: "effective_start_time" },
                { header: "End Time", key: "effective_end_time", permission: "effective_end_time" },
                { header: "Description", key: "description", permission: "description" },
                { header: "Participants", key: "meeting_participants", permission: "meeting_participants" },
                { header: "Invited By", key: "invited_by", permission: "invited_by" },
                { header: "Created By", key: "created_by_name", permission: "created_by" },
                { header: "Modified By", key: "modified_by_name", permission: "modified_by" }
            ];

            const isValidTZ = timezone && isValidTimezone(timezone);
            const formatDate = (date?: Date | string | null) => {
                if (!date) return "";
                const dateObj = date instanceof Date ? date : new Date(date);
                if (isNaN(dateObj.getTime())) return "";
                return moment(dateObj)
                    .tz(isValidTZ ? timezone : "UTC")
                    .format("YYYY-MMM-DD, hh:mm:ss A");
            };

            const finalStructuredData = result.data.map((d: any) => {
                let resultMap: { [key: string]: any } = {
                    ...d,
                    invited_by: d.invited_by?.email ? `${d.invited_by.name} (${d.invited_by.email})` : "",
                    meeting_participants: Array.isArray(d.meeting_participants)
                        ? d.meeting_participants.map((p: any) => `${p.name}`).join(", ")
                        : "",
                    effective_start_datetime: formatDate(d.effective_start_datetime),
                    created_by_name: d.created_by_name || "",
                    modified_by_name: d.modified_by_name || ""
                };

                const exportRecord: Record<string, any> = {};

                fieldMappings.forEach(mapping => {
                    if (allowedFieldSet.has(mapping.permission)) {
                        exportRecord[mapping.header] = resultMap[mapping.key];
                    }
                });

                return exportRecord;
            });

            const base64 = await generateExcelBase64(finalStructuredData, "MeetingList");
            handleSuccessResponse(res, base64);
        } else {
            handleErrorResponse(res, result.statusCode, HttpStatus.BAD_REQUEST_MESSAGE, result.message);
        }

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}


async function getWeeklyProductivityList(req: Request, res: Response): Promise<void> {
    const methodName = "getWeeklyProductivityList";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, reportFlagSchema, res, "GET");

        if (!value) return;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const result = await reportService.getWeeklyProductivityList(
            userId,
            value.flag
        );

        if (result.statusCode === HttpStatus.SUCCESS) {
            handleCustomResponse(res, result.data, result.message);
        } else {
            handleErrorResponse(res, result.statusCode, HttpStatus.BAD_REQUEST_MESSAGE, result.message);
        }

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}

async function exportWeeklyProductivity(req: Request, res: Response): Promise<void> {
    const methodName = "exportWeeklyProductivity";
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, reportFlagSchema, res, "GET");

        if (!value) return;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const result = await reportService.getWeeklyProductivityList(
            userId,
            value.flag
        );

        if (result.statusCode === HttpStatus.SUCCESS) {
            const base64 = await generateExcelBase64(result.data, "WeeklyProductivity");
            handleSuccessResponse(res, base64);
        } else {
            handleErrorResponse(res, result.statusCode, HttpStatus.BAD_REQUEST_MESSAGE, result.message);
        }

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}

async function handleTaskList(req: Request, res: Response, serviceMethod: Function, methodName: string): Promise<void> {
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, reportFlagSchema, res, "GET");

        if (!value) return;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const result = await serviceMethod.call(reportService, userId, value.flag);

        if (result.statusCode === HttpStatus.SUCCESS) {
            handleCustomResponse(res, result.data, result.message);
        } else {
            handleErrorResponse(res, result.statusCode, HttpStatus.BAD_REQUEST_MESSAGE, result.message);
        }

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}

async function handleTaskExport(req: Request, res: Response, serviceMethod: Function, methodName: string, fileName: string): Promise<void> {
    try {
        const userId = req.headers["x-user-id"] as string;
        const value = await validateRequest(req, reportFlagSchema, res, "GET");

        if (!value) return;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const result = await serviceMethod.call(reportService, userId, value.flag);

        if (result.statusCode === HttpStatus.SUCCESS) {
            const data = result.data.map((item: any) => ({
                "Task ID": item.r_number,
                "Task Name": item.task_name,
                "Status": item.status,
                "Start Date": item.effective_start_datetime ? moment(item.effective_start_datetime).format("YYYY-MMM-DD") : "",
                "End Date": item.effective_end_datetime ? moment(item.effective_end_datetime).format("YYYY-MMM-DD") : "",
                "Case ID": item.case_r_number,
                "Case Name": item.case_name,
                "Assigned To": item.assigned_to_name,
                "Priority": item.priority_name,
                "Fiscal Year": item.fiscal_year,
                "Account Name": item.account_name,
            }));

            const base64 = await generateExcelBase64(data, fileName);
            handleSuccessResponse(res, base64);
        } else {
            handleErrorResponse(res, result.statusCode, HttpStatus.BAD_REQUEST_MESSAGE, result.message);
        }

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}

async function getUpcomingTasksList(req: Request, res: Response): Promise<void> {
    await handleTaskList(req, res, reportService.getUpcomingTasksList, "getUpcomingTasksList");
}

async function exportUpcomingTasks(req: Request, res: Response): Promise<void> {
    await handleTaskExport(req, res, reportService.getUpcomingTasksList, "exportUpcomingTasks", "UpcomingTasks");
}

async function getDueTodayOverdueTasksList(req: Request, res: Response): Promise<void> {
    await handleTaskList(req, res, reportService.getDueTodayOverdueTasksList, "getDueTodayOverdueTasksList");
}

async function exportDueTodayOverdueTasks(req: Request, res: Response): Promise<void> {
    await handleTaskExport(req, res, reportService.getDueTodayOverdueTasksList, "exportDueTodayOverdueTasks", "DueTodayOverdueTasks");
}

async function getOpenTasksList(req: Request, res: Response): Promise<void> {
    await handleTaskList(req, res, reportService.getOpenTasksList, "getOpenTasksList");
}

async function exportOpenTasks(req: Request, res: Response): Promise<void> {
    await handleTaskExport(req, res, reportService.getOpenTasksList, "exportOpenTasks", "OpenTasks");
}

async function getCompletedTasksThisWeekList(req: Request, res: Response): Promise<void> {
    await handleTaskList(req, res, reportService.getCompletedTasksThisWeekList, "getCompletedTasksThisWeekList");
}

async function exportCompletedTasksThisWeek(req: Request, res: Response): Promise<void> {
    await handleTaskExport(req, res, reportService.getCompletedTasksThisWeekList, "exportCompletedTasksThisWeek", "CompletedTasksThisWeek");
}

async function getPendingFollowUpsList(req: Request, res: Response): Promise<void> {
    await handleTaskList(req, res, reportService.getPendingFollowUpsList, "getPendingFollowUpsList");
}

async function exportPendingFollowUps(req: Request, res: Response): Promise<void> {
    await handleTaskExport(req, res, reportService.getPendingFollowUpsList, "exportPendingFollowUps", "PendingFollowUps");
}

async function getOverallProjectValue(req: Request, res: Response): Promise<void> {
    const methodName = "getOverallProjectValue";
    try {
        const userId = req.headers["x-user-id"] as string;

        const value = await validateRequest(req, getOverallProjectValueSchema, res, "GET");

        if (!value) return;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const result = await reportService.getOverallProjectValue(
            userId,
            value.flag,
            value.fiscalYear
        );

        if (result.statusCode === HttpStatus.SUCCESS) {
            handleCustomResponse(res, result.data, result.message);
        } else {
            handleErrorResponse(res, result.statusCode, HttpStatus.BAD_REQUEST_MESSAGE, result.message);
        }

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}

async function getGlobalLevelChart(req: Request, res: Response): Promise<void> {
    const methodName = "getGlobalLevelChart";
    try {
        const userId = req.headers["x-user-id"] as string;

        const value = await validateRequest(req, globalLevelChartSchema, res, "GET");

        if (!value) return;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const result = await reportService.getGlobalLevelChart(
            userId,
            value.flag,
            value.fiscalYear,
            value.countryRid
        );

        if (result.statusCode === HttpStatus.SUCCESS) {
            handleCustomResponse(res, result.data, result.message);
        } else {
            handleErrorResponse(res, result.statusCode, HttpStatus.BAD_REQUEST_MESSAGE, result.message);
        }

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}

async function getCasesByHealthStatus(req: Request, res: Response): Promise<void> {
    const methodName = "getCasesByHealthStatus";
    try {
        const userId = req.headers["x-user-id"] as string;

        const value = await validateRequest(req, casesByHealthStatusSchema, res, "GET");

        if (!value) return;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const result = await reportService.getCasesByHealthStatus(
            userId,
            value.flag,
            value.fiscalYear
        );

        if (result.statusCode === HttpStatus.SUCCESS) {
            handleCustomResponse(res, result.data, result.message);
        } else {
            handleErrorResponse(res, result.statusCode, HttpStatus.BAD_REQUEST_MESSAGE, result.message);
        }

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}


export default {
    getCountDetails,
    getMeetingList,
    exportMeetingList,
    getWeeklyProductivityList,
    exportWeeklyProductivity,
    getUpcomingTasksList,
    exportUpcomingTasks,
    getDueTodayOverdueTasksList,
    exportDueTodayOverdueTasks,
    getOpenTasksList,
    exportOpenTasks,
    getCompletedTasksThisWeekList,
    exportCompletedTasksThisWeek,
    getPendingFollowUpsList,
    exportPendingFollowUps,
    getOverallProjectValue,
    getGlobalLevelChart,
    getCasesByHealthStatus
};

