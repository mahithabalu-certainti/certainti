import { Request, Response } from "express";
import configurations from "../config/config";
import { handleErrorResponse, errorLog, handleCustomResponse } from "../utils/helpers";
import { HttpStatus } from "../utils/constants";

const reportService = configurations.getInstance().getServices().reportService;

async function getCountDetails(req: Request, res: Response): Promise<void> {
    const methodName = "getCountDetails";
    try {
        const userId = req.headers["x-user-id"] as string;

        if (!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required");
            return;
        }

        const result = await reportService.getCountDetails(
            userId
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
    getCountDetails
};
