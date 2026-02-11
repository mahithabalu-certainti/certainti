import Joi from "joi";
import { Request, Response } from "express";
import { errorResponse, successResponse } from "./apiResponse";
import { ALPHANUMERIC_CONDITIONS, HttpStatus, STATUS_MESSAGE } from "./constants";
import configurations from "../config/config";
import ExcelJS from 'exceljs'
import {
    BlobServiceClient,
    StorageSharedKeyCredential,
    generateBlobSASQueryParameters,
    BlobSASPermissions,
    SASProtocol
} from "@azure/storage-blob";
import { getSecret } from "./azureSecrets";
import moment from "moment-timezone";



function getLogger() {
    return configurations.getInstance().getLogger();
}

export async function validateRequest(
    req: Request,
    schema: Joi.Schema,
    res: Response,
    type?: "GET" | "POST" | "PUT" | "DELETE",
    organization?: string
): Promise<any> {
    const requestValidationType = type === "GET" ? req.query : req.body;
    const { error, value } = schema.validate(requestValidationType, {
        abortEarly: false,
    });
    if (error) {
        const errorMessages = requestErrorMessages(error);
        getLogger().error("Validation failed:", {
            timestamp: new Date().toISOString(),
            method: "API method",
            message: "Request validation failed",
        });
        errorResponse(
            res,
            HttpStatus.BAD_REQUEST,
            HttpStatus.BAD_REQUEST_MESSAGE,
            errorMessages
        );
        return;
    }

    return value;
}

export function requestErrorMessages(
    error: any
): Record<string, string> | string {
    const errors = error.details.map((err: any) => {
        const field = err.path.length ? err.path.join(".") : null;
        const message = err.message.replace(/"/g, "");
        return field ? { [field]: message } : message;
    });

    // If only one message and it's a string (object-level), return it directly
    if (errors.length === 1 && typeof errors[0] === "string") {
        return errors[0];
    }

    // Merge all object field errors
    return errors.reduce(
        (acc: Record<string, string>, curr: Record<string, string> | string) => {
            if (typeof curr === "string") {
                acc["message"] = curr;
            } else {
                Object.assign(acc, curr);
            }
            return acc;
        },
        {} as Record<string, string>
    );
}

export function successLog(methodName: string): void {
    getLogger().info(`Successfully retrieved ${methodName} data `, {
        timestamp: new Date().toISOString(),
        method: methodName,
    });
}

export function errorLog(methodName: string, errorMessage?: string): void {
    getLogger().error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: methodName,
        message: errorMessage,
    });
}

export function logMessage(message: string): void {
    getLogger().info(`${message}`);
}

export function handleSuccessResponse(res: Response, data: any) {
    return successResponse(
        res,
        HttpStatus.SUCCESS,
        HttpStatus.SUCCESS_MESSAGE,
        data,
        HttpStatus.SUCCESS_NOTIFICATION
    );
}

export function handleCustomResponse(
    res: Response,
    data: any,
    message: string
) {
    return successResponse(
        res,
        HttpStatus.SUCCESS,
        HttpStatus.SUCCESS_MESSAGE,
        data,
        message
    );
}
export function handleErrorResponse(
    res: Response,
    statusCode: number,
    statusCodeValue: string,
    message?: string
): void {
    errorResponse(res, statusCode, statusCodeValue, message);
}

export function handlePromptResponse(
    res: Response,
    statusCode: number,
    statusMessage: string,
    data: any
): void {
    res.status(statusCode).json({
        statusCode: statusCode,
        statusCodeValue: HttpStatus.PROMPT_MESSAGE,
        statusMessage: statusMessage,
        data: data,
    });
}

/**
 * Generates a base64-encoded Excel file from structured data, highlighting empty cells.
 * @param {Array<Record<string, any>>} data - Array of objects representing rows.
 * @param {string} sheetName - Name of the worksheet.
 * @returns {Promise<string>} - Base64 string of the Excel file.
 */
export async function generateExcelBase64WithEmptyCheck(data: Array<Record<string, any>>, sheetName: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (!data || data.length === 0 || !data[0]) {
        worksheet.addRow(['No data available']);
    } else {
        // Add header row
        const header = Object.keys(data[0] ?? {});
        const headerRow = worksheet.addRow(header);
        headerRow.eachCell((cell) => {
            cell.alignment = { wrapText: true };
        });

        // Auto-adjust column widths based on header and data
        worksheet.columns = header.map((h, i) => {
            // Find max length in column (header or any data row)
            const maxDataLength = Math.max(
                h.length,
                ...data.map(rowObj => {
                    const v = rowObj[h];
                    return (v === null || v === undefined) ? 0 : String(v).length;
                })
            );
            // Minimum width 12, max 50
            return {
                key: h,
                width: Math.min(Math.max(maxDataLength + 2, 12), 50)
            };
        });

        // Add data rows
        data.forEach(rowObj => {
            const rowValues = header.map(h => {
                // Treat null, undefined, or empty string as empty
                const v = rowObj[h];
                return v === null || v === undefined || v === '' ? '' : v;
            });
            const row = worksheet.addRow(rowValues);
            row.eachCell((cell, colNumber) => {
                // Enable text wrapping for all cells
                cell.alignment = { wrapText: true };
                // Highlight if value is null, empty string, or 0
                if (cell.value === '' || cell.value === null || cell.value === 0) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFC7CE' } // Light red fill for empty/null/zero cells
                    };
                }
            });
        });
    }

    // Generate buffer and encode to base64
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer).toString('base64');
}


export async function generateExcelBase64(data: any, sheetName: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Get headers from the first object in data
    const headers = Object.keys(data[0] || {});
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((row: any) => {
        worksheet.addRow(Object.values(row));
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer).toString("base64");
}

export function isValidTimezone(tz: string) {
    return moment.tz.names().includes(tz);
}


export async function generateSasUrl(blobUrl: string, expiryMinutes = 15): Promise<string> {
    try {
        const connectionString = await getSecret(process.env.AZURE_STORAGE_CONNECTION_STRING as string);

        if (!connectionString) {
            throw new Error("Azure storage connection string is required");
        }

        const url = new URL(blobUrl);
        const pathParts = url.pathname.replace(/^\/+/, "").split("/");

        if (pathParts.length < 2) {
            throw new Error("Invalid blob URL format");
        }

        const containerName = pathParts[0] as string;
        const blobName = pathParts.slice(1).join("/");

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const credential = (blobServiceClient as any).credential as StorageSharedKeyCredential;

        if (!credential) {
            throw new Error("StorageSharedKeyCredential missing from BlobServiceClient");
        }

        const expiresOn = new Date();
        expiresOn.setMinutes(expiresOn.getMinutes() + expiryMinutes);

        const sasQueryParameters = generateBlobSASQueryParameters(
            {
                containerName,
                blobName,
                permissions: BlobSASPermissions.parse("r"),
                expiresOn,
                protocol: SASProtocol.Https
            },
            credential
        );

        const sasToken = sasQueryParameters.toString();
        const sasParams = new URLSearchParams(sasToken);
        sasParams.forEach((value, key) => {
            url.searchParams.append(key, value);
        });

        return url.toString();
    } catch (error) {
        logMessage(`Error generating SAS URL: ${error}`);
        throw new Error(`SAS URL generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
