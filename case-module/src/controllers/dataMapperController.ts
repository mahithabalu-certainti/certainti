import { Request, Response } from "express";
import { handleSuccessResponse, handleErrorResponse, logMessage, errorLog, validateRequest, isValidTimezone, generateExcelBase64, handleCustomResponse } from "../utils/helpers";
import { HttpStatus } from "../utils/constants";
import configurations from "../config/config";
import { createDataMapperSchema, listDataMapperSchema, exportDataMapperSchema, updateDataMapperSchema, updateDataMapperMappingSchema, getObjectsListSchema } from "../lib/joi/schemas/schema";
import moment from "moment";
import { dataMapperFieldMappings } from "../utils/excelExportMapping";


const services = configurations.getInstance().getServices();

const caseService = services.caseService;
const dataMapperService = services.dataMapperService;

async function createDataMapper(req: Request, res: Response): Promise<void> {
    const methodName = "createDataMapper";
    try {
        const userId = req.headers["x-user-id"] as string;

        logMessage(`Request received for createDataMapper with userId: ${userId}`);

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const value = await validateRequest(req, createDataMapperSchema, res, "POST");
        if (!value) return;

        // We expect multipart/form-data, so req.body has fields and req.file has the file
        // validateRequest validates req.body, so 'value' holds the validated body data
        const file = req.file;

        if (!file) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "File is required");
            return;
        }

        const result = await dataMapperService.createDataMapper(value, file, userId);

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

async function listDataMapperForms(req: Request, res: Response): Promise<void> {
    const methodName = "listDataMapperForms";
    try {
        const userId = req.headers["x-user-id"] as string;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const value = await validateRequest(req, listDataMapperSchema, res, "POST");
        if (!value) return;

        if (typeof value.filters === 'string') {
            try {
                value.filters = JSON.parse(value.filters);
            } catch (err) {
                errorLog(methodName, 'Invalid filters JSON');
                value.filters = {};
            }
        }

        const result = await dataMapperService.listDataMapperForms(
            userId,
            value.page,
            value.limit,
            value.search,
            value.filters,
            value.sortBy,
            value.sortOrder
        );

        handleCustomResponse(res, result.data, result.message);

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}

async function getDataMapperFormsDetail(req: Request, res: Response): Promise<void> {
    const methodName = "getDataMapperFormsDetail";
    try {
        const userId = req.headers["x-user-id"] as string;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const value = req.params;
        if (!value) return;

        if (!value.rid) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "Record ID is required");
            return;
        }

        const result = await dataMapperService.getDataMapperFormsDetail(
            userId,
            value.rid
        );

        handleCustomResponse(res, result.data, result.message);

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}

async function getDataMapperFormsMappingDetail(req: Request, res: Response): Promise<void> {
    const methodName = "getDataMapperFormsMappingDetail";
    try {
        const userId = req.headers["x-user-id"] as string;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const value = req.params;
        if (!value) return;

        if (!value.rid) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "Record ID is required");
            return;
        }

        const result = await dataMapperService.getDataMapperFormsMappingDetail(
            userId,
            value.rid
        );

        handleCustomResponse(res, result.data, result.message);

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}

async function getObjectsList(req: Request, res: Response): Promise<void> {
    const methodName = "getObjectsList";
    try {
        const userId = req.headers["x-user-id"] as string;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const value = await validateRequest(req, getObjectsListSchema, res, "GET");
        if (!value) return;

        const result = await dataMapperService.getObjectsList(value);

        handleCustomResponse(res, result.data, result.message);

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}


async function listDataMapperUploadStatus(req: Request, res: Response): Promise<void> {
    const methodName = "listDataMapperUploadStatus";
    try {
        const userId = req.headers["x-user-id"] as string;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const result = await dataMapperService.listDataMapperUploadStatus();

        handleCustomResponse(res, result.data, result.message);

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}

async function exportDataMapperForms(req: Request, res: Response): Promise<void> {
    const methodName = "exportDataMapperForms";
    try {
        const userId = req.headers["x-user-id"] as string;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const value = await validateRequest(req, exportDataMapperSchema, res, "POST");
        if (!value) return;

        if (typeof value.filters === 'string') {
            try {
                value.filters = JSON.parse(value.filters);
            } catch (err) {
                errorLog(methodName, 'Invalid filters JSON');
                value.filters = {};
            }
        }

        const result = await dataMapperService.listDataMapperForms(
            userId,
            value.page,
            value.limit,
            value.search,
            value.filters,
            value.sortBy,
            value.sortOrder
        );

        const [dataMapperFields] = await Promise.all([
            caseService.getAllowedExportFields(userId, "rd_form_data_mapper_view_edit"),
        ]);
        const allowedFieldSet = new Set<string>();
        for (const field of dataMapperFields) {
            if (field.read) {
                allowedFieldSet.add(field.field_name);
            }
        }

        const isValidTZ = value.timezone && isValidTimezone(value.timezone);
        const formatDate = (date?: Date | string | null) => {
            if (!date) return null;

            // Convert string to Date if needed
            const dateObj = date instanceof Date ? date : new Date(date);

            // Check if date is valid
            if (isNaN(dateObj.getTime())) return null;

            return moment(dateObj)
                .tz(isValidTZ ? value.timezone : "UTC")
                .format("YYYY-MMM-DD, hh:mm:ss A");
        };

        if (result.statusCode == HttpStatus.SUCCESS) {
            const finalStructuredData =
                (!result?.data?.items || result?.data?.items.length < 1)
                    ? []
                    : result?.data?.items.map((d: any) => {
                        let resultMap: { [key: string]: any } = {
                            rid: d.rid,
                            r_number: d.r_number,
                            created_datetime: formatDate(d.created_datetime),
                            created_by: d.created_by_name,
                            modified_datetime: d.modified_datetime ? formatDate(d.modified_datetime) : "",
                            modified_by: d.modified_by_name || "",
                            form_name: d.form_name,
                            browse_file: d.browse_file,
                            document_name: d.document_name,
                            effective_from_date: formatDate(d.effective_from_date),
                            effective_to_date: d.effective_to_date ? formatDate(d.effective_to_date) : "",
                            country_name: d.country_name,
                            state_name: d.state_name,
                            format: d.format,
                            size_in_mb: d.size_in_mb,
                            status_name: d.status_name,
                            is_active: d.is_active ? "Active" : "Inactive",
                            error_message: d.error_message || ""
                        };

                        // Build exportRecord using allowed fields and resultMap
                        const exportRecord: Record<string, any> = {};
                        dataMapperFieldMappings.forEach((mapping) => {
                            if (allowedFieldSet.has(mapping.permissionField)) {
                                exportRecord[mapping.exportField] =
                                    resultMap[mapping.dataField];
                            }
                        });
                        return exportRecord;
                    });

            const generateBase64Response = await generateExcelBase64(
                finalStructuredData,
                "DataMapperForms"
            );
            handleSuccessResponse(res, generateBase64Response);

        } else {
            errorLog(methodName, "No data found");
            handleErrorResponse(
                res,
                HttpStatus.BAD_REQUEST,
                HttpStatus.BAD_REQUEST_MESSAGE,
                result.errorMessage
            );
        }
    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}

async function editDataMapper(req: Request, res: Response): Promise<void> {
    const methodName = "editDataMapper";
    try {
        const userId = req.headers["x-user-id"] as string;

        logMessage(`Request received for editDataMapper with userId: ${userId}`);

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const value = await validateRequest(req, updateDataMapperSchema, res, "POST");
        if (!value) return;

        const file = req.file;

        const result = await dataMapperService.editDataMapper(value, file, userId);

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

async function editDataMapperMapping(req: Request, res: Response): Promise<void> {
    const methodName = "editDataMapperMapping";
    try {
        const userId = req.headers["x-user-id"] as string;

        logMessage(`Request received for editDataMapperMapping with userId: ${userId}`);

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const value = await validateRequest(req, updateDataMapperMappingSchema, res, "POST");
        if (!value) return;


        const result = await dataMapperService.editDataMapperMapping(value, userId);

        handleCustomResponse(res, result.data, result.message);

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}

export default {
    createDataMapper,
    listDataMapperForms,
    exportDataMapperForms,
    getDataMapperFormsDetail,
    editDataMapper,
    getDataMapperFormsMappingDetail,
    editDataMapperMapping,
    getObjectsList,
    listDataMapperUploadStatus
};
