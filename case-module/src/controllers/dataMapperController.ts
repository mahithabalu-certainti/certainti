import { Request, Response } from "express";
import { handleSuccessResponse, handleErrorResponse, logMessage, errorLog, validateRequest } from "../utils/helpers";
import { HttpStatus } from "../utils/constants";
import configurations from "../config/config";
import { createDataMapperSchema } from "../lib/joi/schemas/schema";


const services = configurations.getInstance().getServices();

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

        handleSuccessResponse(res, result.data);

    } catch (error) {
        const err = error as Error;
        errorLog(methodName, err.message);
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, err.message);
    }
}

export default {
    createDataMapper
};
