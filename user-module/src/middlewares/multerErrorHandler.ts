import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { handleErrorResponse } from "../utils/helpers";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const multerErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof multer.MulterError) {
         let msg = err.message;
         switch (err.code) {
            case "LIMIT_FILE_SIZE":
                msg = `File size exceeds the allowed limit of ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)} MB`;
                break;

            case "LIMIT_UNEXPECTED_FILE":
                msg = "Unexpected file — Only image files are allowed (jpg, jpeg, png, webp, gif).";
                break;

            default:
                msg = err.message;
        }
        return handleErrorResponse(
            res,
            400,
            "BadRequest",
            msg
        );
    } else if (err) {
        // Any other error from Multer
        return handleErrorResponse(
            res,
            400,
            "File upload error",
            err.message
        );
    }
    next();
};
