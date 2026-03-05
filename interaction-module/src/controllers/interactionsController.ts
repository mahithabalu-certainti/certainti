import { Request, Response } from "express";
import {
  accountinteractionFieldMappings,
  fpaFieldMappings,
  HttpStatus,
  interactionFieldMappings,
  interactionSource,
  STATUS_MESSAGE,
  techSummaryFieldMappings,
} from "../utils/constants";
import {
  deleteFromAzureBlob,
  errorLog,
  formatToLocalTime,
  generateExcelBase64,
  handleCustomResponse,
  handleErrorResponse,
  handleSuccessResponse,
  isValidTimezone,
  logMessage,
  successLog,
  uploadToAzureBlob,
  validateRequest,
} from "../utils/helpers";
import moment from "moment-timezone";
import configurations from "../config/config";
import {
  createAccountInteractionSchema,
  createInteractionSchema,
  exportTechnicalSummarySchema,
  getInteractionStatusSchema,
  listAccountInteractionSchema,
  listAllTechnicalSummarySchema,
  listTechnicalSummarySchema,
  sendInteractionSchema,
  updateAccountInteractionSchema,
  updateInteractionResponseSchema,
  updateInteractionSchema,
  updateTechSummaryContextSchema,
} from "../lib/joi/schemas/schema";

// import Joi schemas and interaction services as needed

const services = configurations.getInstance().getServices();
const interactionService = services.interactionService;

/**
 * Handles the creation of a new interaction based on the incoming HTTP request.
 *
 * This async function validates the request body against a schema, extracts the user ID from headers,
 * and calls the interaction service to create a new interaction with the provided data.
 * It sends back appropriate success or error responses based on the service outcome.
 *
 * @param {Request} req - Express request object containing interaction data in the body and user ID in headers.
 * @param {Response} res - Express response object used to send back the operation result.
 *
 * @returns {Promise<void>} - Resolves after sending the response to the client.
 *
 * @throws {Error} - Throws if the request validation fails or the interaction service encounters an error.
 */
async function createInteraction(req: Request, res: Response): Promise<void> {
  const methodName = "Create interaction";
  try {
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${req.headers["x-user-id"]}`);
    const value = await validateRequest(req, createInteractionSchema, res);
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
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const interaction = await interactionService.createInteraction(
      value,
      interactionSource.MANUAL,
      userId
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, interaction.data, interaction.message);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
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

/**
 * Handles the creation of a new account interaction from the incoming HTTP request.
 *
 * This async function validates the request body using the `createAccountInteractionSchema`,
 * extracts the user ID from request headers, and calls the interaction service to create an account interaction.
 * It returns appropriate success or error responses based on the result.
 *
 * @param {Request} req - Express request object containing account interaction data and headers.
 * @param {Response} res - Express response object used to send the result of the operation.
 *
 * @returns {Promise<void>} - Resolves after sending a response to the client.
 *
 * @throws {Error} - Throws if validation fails, user ID header is missing, or the service encounters an error.
 */
async function createAccountInteraction(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Create account interaction";
  try {
   
    const value = await validateRequest(req, createAccountInteractionSchema, res);
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const interaction = await interactionService.createAccountInteraction(
      value,
      interactionSource.MANUAL,
      userId
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, interaction.data, interaction.message);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
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

/**
 * Handles listing of account interactions based on query parameters in the HTTP request.
 *
 * This async function validates query parameters using `listAccountInteractionSchema`,
 * extracts user ID from request headers, parses pagination and filter parameters,
 * and calls the interaction service to fetch the list of account interactions.
 * It returns either a paginated list or an error response.
 *
 * @param {Request} req - Express request object containing query parameters and headers.
 * @param {Response} res - Express response object used to send the list of account interactions or errors.
 *
 * @returns {Promise<void>} - Resolves after sending a response to the client.
 *
 * @throws {Error} - Throws if validation fails, user ID header is missing, or service encounters an error.
 */
async function listAccountInteractions(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "List account interactions";
  try {
   
    const value = await validateRequest(req, listAccountInteractionSchema, res,"GET");
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(value)} userId: ${userId}`);

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
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }

    const page: number = parseInt(value.page, 10) || 1;
    const limit: number = parseInt(value.limit, 10) || 10;
    let parsedFilters: Record<string, any> = {};
    try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }
    const interaction = await interactionService.listAccountInteractions(
      value,
      page,
      limit,
      parsedFilters
    );

    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, interaction.data, interaction.message);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
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

/**
 * Updates an existing account interaction with the provided data.
 *
 * This controller method performs the following steps:
 * 1. Logs the received request body for traceability.
 * 2. Validates the request body against the `updateAccountInteractionSchema`.
 * 3. Checks for the presence of the `x-user-id` header, which is required for authentication and audit logging.
 * 4. Calls the `interactionService.updateAccountInteraction()` service method with the validated data and user ID.
 * 5. Handles and logs success or error responses based on the outcome of the service call.
 *
 * @param {Request} req - The Express request object containing the update data in the body and user ID in the headers.
 * @param {Response} res - The Express response object used to return the outcome of the update operation.
 *
 * @returns {Promise<void>} - A promise that resolves once the HTTP response is sent back to the client.
 *
 * @throws {Error} - Catches and logs any unexpected errors and returns a generic BAD_REQUEST response.
 */
async function updateAccountInteraction(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Update account interaction";
  try {
    
    const value = await validateRequest(req, updateAccountInteractionSchema, res);
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(value)} userId: ${userId}`);
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
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const interaction = await interactionService.updateAccountInteraction(
      value,
      userId
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, interaction.data, interaction.message);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
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

/**
 * Updates an existing interaction based on the request data.
 *
 * This controller function performs the following:
 * 1. Logs the incoming request for debugging and traceability.
 * 2. Validates the request body using `updateInteractionSchema`.
 * 3. Checks for the presence of the `x-user-id` header which is required for audit and user tracking.
 * 4. Invokes the `interactionService.updateInteraction()` method to perform the update operation.
 * 5. Handles and logs both success and error responses, returning appropriate HTTP status and messages.
 *
 * @param {Request} req - Express request object containing interaction data in the body and `x-user-id` in the headers.
 * @param {Response} res - Express response object used to send the result back to the client.
 *
 * @returns {Promise<void>} - Resolves when the HTTP response is sent.
 *
 * @throws {Error} - Catches unexpected service or runtime errors and returns a generic BAD_REQUEST response.
 */
async function updateInteraction(req: Request, res: Response): Promise<void> {
  const methodName = "Update interaction";
  try {
    
    const value = await validateRequest(req, updateInteractionSchema, res);
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(value)} userId: ${userId}`);

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
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const interaction = await interactionService.updateInteraction(
      value,
      userId
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, interaction.data, interaction.message);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
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

/**
 * Updates an interaction response based on the request body.
 *
 * This controller method handles the process of updating an existing interaction response by:
 * 1. Logging the incoming request payload for traceability.
 * 2. Validating the request body against the `updateInteractionResponseSchema`.
 * 3. Extracting and validating the `x-user-id` header to identify the user making the update.
 * 4. Calling the `interactionService.updateInteractionResponse()` method to perform the update.
 * 5. Handling and returning both success and error responses with appropriate HTTP status codes.
 *
 * @param {Request} req - The Express request object containing the interaction response data and headers.
 * @param {Response} res - The Express response object used to send the result back to the client.
 *
 * @returns {Promise<void>} - A Promise that resolves once the HTTP response is sent.
 *
 * @throws {Error} - Handles and logs unexpected service or application errors, returning a generic BAD_REQUEST.
 */
async function updateInteractionResponse(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Update interaction response";
  try {
   
    const value = await validateRequest(
      req,
      updateInteractionResponseSchema,
      res
    );
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(value)} userId: ${userId}`);

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
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const interaction = await interactionService.updateInteractionResponse(
      value,
      userId
    );
   
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interaction.data);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
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

/**
 * Retrieves interaction details by interaction RID and account ID.
 *
 * This controller method performs the following steps:
 * 1. Logs the incoming request payload for visibility.
 * 2. Extracts `interactionRid` and `accountId` from request parameters.
 * 3. Retrieves the `x-user-id` from headers to validate the requester.
 * 4. Validates that required fields (`userId`, `interactionRid`, `accountId`) are present.
 * 5. Calls the `interactionService.getInteractionDetailsById()` method to fetch the data.
 * 6. Returns a success response if the service returns successfully.
 * 7. Handles errors and edge cases by logging and returning a `BAD_REQUEST` response.
 *
 * @param {Request} req - Express request object containing route parameters and headers.
 * @param {Response} res - Express response object used to send results back to the client.
 *
 * @returns {Promise<void>} - A Promise that resolves once the response has been sent.
 *
 * @throws {Error} - Handles and logs any unexpected errors and responds with a 400 status code.
 */
async function getInteractionDetailsById(
  req: Request<{interactionRid : string, accountId : string}>,
  res: Response
): Promise<void> {
  const methodName = "Get interaction details";
  try {
   
    const { interactionRid, accountId } = req.params;
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);

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

    if (!interactionRid || !accountId) {
      errorLog(
        methodName,
        "interactionRid and accountId are required in params"
      );
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "interactionRid and accountId are required in params"
      );
      return;
    }
    let interactionDetails;
    interactionDetails = await interactionService.getInteractionDetailsById(
      interactionRid,
      accountId
    );

    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interactionDetails)
    );
    if (interactionDetails.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionDetails.data);
      return;
    } else {
      errorLog(methodName, interactionDetails.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionDetails.errorMessage
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

/**
 * Retrieves key contacts by case ID and account ID.
 *
 * This controller method performs the following steps:
 * 1. Logs the incoming request parameters for visibility.
 * 2. Extracts `caseId` and `accountId` from request parameters.
 * 3. Retrieves the `x-user-id` from headers to validate the requester.
 * 4. Validates that required fields (`userId`, `caseId`, `accountId`) are present.
 * 5. Calls the `interactionService.getKeyContactsByCaseId()` method to fetch the data.
 * 6. Returns a success response if the service returns successfully.
 * 7. Handles errors and edge cases by logging and returning a `BAD_REQUEST` response.
 *
 * @param {Request} req - Express request object containing route parameters and headers.
 * @param {Response} res - Express response object used to send results back to the client.
 *
 * @returns {Promise<void>} - A Promise that resolves once the response has been sent.
 *
 * @throws {Error} - Handles and logs any unexpected errors and responds with a 400 status code.
 */
async function getKeyContactsByCaseId(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get key contacts by case ID";
  try {
    const { accountId, caseId } = req.query;
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, caseId: ${caseId}, accountId: ${accountId}, userId: ${userId}`);

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

    if (!caseId) {
      errorLog(methodName, "caseId required in params");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "caseId is required in params"
      );
      return;
    }

    if (!accountId) {
      errorLog(methodName, "accountId required in params");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "accountId is required in params"
      );
      return;
    }

    const keyContacts = await interactionService.getKeyContactsByCaseId(
      caseId as string,
      accountId as string 
    );

    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(keyContacts)
    );
    
    if (keyContacts.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, keyContacts.data);
      return;
    } else {
      errorLog(methodName, keyContacts.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        keyContacts.errorMessage
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

/**
 * Retrieves technical summary details using the provided summary and account RIDs.
 *
 * This controller method performs the following operations:
 * 1. Logs the incoming request payload for traceability.
 * 2. Validates query parameters using the `listTechnicalSummarySchema` schema.
 * 3. Extracts and verifies the presence of `x-user-id` from headers.
 * 4. Ensures the validated request contains required parameters (`tech_summary_rid`, `account_rid`).
 * 5. Calls the service method `getTechnicalSummaryDetailsById` to retrieve data.
 * 6. Sends a success response with the data if service call is successful.
 * 7. If service call fails, sends a `BAD_REQUEST` with the appropriate error message.
 * 8. Handles unexpected errors and sends a standardized error response.
 *
 * @param {Request} req - Express request object containing query/body parameters and headers.
 * @param {Response} res - Express response object used to send the result back to the client.
 *
 * @returns {Promise<void>} - A Promise that resolves once the response is sent.
 *
 * @throws {Error} - Catches and handles any unexpected runtime errors.
 */
async function getTechnicalSummaryDetailsById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get technical summary details";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const value = await validateRequest(
      req,
      listTechnicalSummarySchema,
      res,
      "GET"
    );
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(value)} userId: ${userId}`);
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

    if (!value) {
      errorLog(
        methodName,
        "tech_summary_rid and account_rid are required in params"
      );
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "interactionRid and accountId are required in params"
      );
      return;
    }

    const interactionDetails =
      await interactionService.getTechnicalSummaryDetailsById(
        value.tech_summary_rid,
        value.account_rid
      );
  
    if (interactionDetails.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionDetails.data);
      return;
    } else {
      errorLog(methodName, interactionDetails.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionDetails.errorMessage
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

/**
 * Updates the context of a technical summary for a given summary and account RID.
 *
 * This controller method follows these steps:
 * 1. Logs the incoming request body for auditing and debugging.
 * 2. Validates the request body against the `updateTechSummaryContextSchema`.
 * 3. Extracts the user ID from request headers (`x-user-id`) and ensures it's present.
 * 4. Ensures the validated request body contains required values.
 * 5. Invokes the service method `updateTechSummaryContext` to update the summary context.
 * 6. If the service returns success, responds with the updated data and success message.
 * 7. If the service returns an error, responds with `BAD_REQUEST` and the error message.
 * 8. Catches and handles any unexpected errors gracefully with a standardized error response.
 *
 * @param {Request} req - Express HTTP request object containing the request body and headers.
 * @param {Response} res - Express HTTP response object used to send results back to the client.
 *
 * @returns {Promise<void>} - A Promise that resolves after sending a response.
 */
async function updateTechSummaryContext(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Update technical summary context";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const value = await validateRequest(
      req,
      updateTechSummaryContextSchema,
      res
    );
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(value)} userId: ${userId}`);
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
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const interaction = await interactionService.updateTechSummaryContext(
      value.summary_context,
      value.tech_summary_rid,
      value.account_rid,
      userId
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, interaction.data, interaction.message);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
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

/**
 * Retrieves the list of questions associated with a specific interaction.
 *
 * This controller method performs the following steps:
 * 1. Extracts `interactionRid` and `accountId` from the request parameters.
 * 2. Retrieves the `x-user-id` from the request headers and ensures it's provided.
 * 3. Validates that both `interactionRid` and `accountId` are present.
 * 4. Calls the service layer method `getInteractionQuestionsById` to fetch interaction questions.
 * 5. If successful, sends the response with the questions and logs the success.
 * 6. If the service returns an error, responds with `BAD_REQUEST` and logs the error.
 * 7. Catches any unexpected errors and returns a standardized error response.
 *
 * @param {Request} req - Express request object containing route parameters and headers.
 * @param {Response} res - Express response object used to send the result back to the client.
 *
 * @returns {Promise<void>} - A Promise that resolves once the response is sent.
 */
async function getInteractionQuestionsById(
  req: Request<{interactionRid : string, accountId : string}>,
  res: Response
): Promise<void> {
  const methodName = "Get interaction questions";
  try {
    const { interactionRid, accountId } = req.params;
    const value = req.params;
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(value)} userId: ${userId}`);

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    if (!interactionRid || !accountId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "interactionRid and accountId are required in params"
      );
      return;
    }

    const interactionDetails =
      await interactionService.getInteractionQuestionsById(
        interactionRid,
        accountId
      );
    if (interactionDetails.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionDetails.data);
      return;
    } else {
      errorLog(methodName, interactionDetails.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionDetails.errorMessage
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

/**
 * Retrieves a filtered list of interaction statuses based on the provided criteria.
 *
 * This controller method performs the following steps:
 * 1. Validates the request query using `getInteractionStatusSchema`.
 * 2. Calls the `getInteractionStatus` method from the service layer, passing:
 *    - `status_scope`: the scope or category of statuses to filter.
 *    - `current_status`: the current status to compare or exclude.
 *    - `reminder_specific_list`: a list of specific statuses for reminders (if applicable).
 * 3. If the service call is successful, sends a success response with the data.
 * 4. If the service call fails, logs the error and sends a `BAD_REQUEST` response with the error message.
 * 5. Catches and handles unexpected errors, logs them, and sends a standardized error response.
 *
 * @param {Request} req - Express request object containing validated query parameters.
 * @param {Response} res - Express response object used to send the result back to the client.
 *
 * @returns {Promise<void>} - A Promise that resolves after the HTTP response is sent.
 */
async function getInteractionStatus(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get resource roles";
  try {
    const value = await validateRequest(req, getInteractionStatusSchema, res,"GET");
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(value)} userId: ${userId}`);
    const interactionStatus = await interactionService.getInteractionStatus(value.status_scope,value.current_status, value.reminder_specific_list);
    if (interactionStatus.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionStatus.data);
      return;
    } else {
      errorLog(methodName, interactionStatus.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionStatus.errorMessage
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

/**
 * Retrieves all available interaction types from the system.
 *
 * This controller method performs the following steps:
 * 1. Calls the `getInteractionTypes` method from the `interactionService`, which fetches a list of interaction types.
 * 2. If the service call is successful, logs the success and returns a 200 OK response with the data.
 * 3. If the service call fails (e.g., no data or internal failure), logs the error and sends a `BAD_REQUEST` response with an appropriate error message.
 * 4. Handles and logs any unexpected exceptions, returning a `BAD_REQUEST` response with the error message.
 *
 * @param {Request} req - Express request object (not used for this handler but required by signature).
 * @param {Response} res - Express response object used to send the result back to the client.
 *
 * @returns {Promise<void>} - A Promise that resolves once the HTTP response is sent.
 */
async function getInteractionTypes(req: Request, res: Response): Promise<void> {
  const methodName = "Get interaction types";
  try {
    const interactionTypes = await interactionService.getInteractionTypes();
    if (interactionTypes.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionTypes.data);
      return;
    } else {
      errorLog(methodName, interactionTypes.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionTypes.errorMessage
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

/**
 * Retrieves the list of available interaction levels from the system.
 *
 * This controller method performs the following steps:
 * 1. Calls the `getInteractionLevel` method from the `interactionService`, which fetches the defined interaction levels.
 * 2. If the service responds with success, logs the success event and sends an HTTP 200 response with the interaction level data.
 * 3. If the service responds with a failure status code, logs the error and returns a `BAD_REQUEST` response with the error message.
 * 4. Handles and logs any unexpected exceptions and returns a generic `BAD_REQUEST` response with the exception message.
 *
 * @param {Request} req - Express request object (not used directly in this function).
 * @param {Response} res - Express response object used to send the HTTP response.
 *
 * @returns {Promise<void>} - A Promise that resolves after the HTTP response is sent.
 */
async function getInteractionLevel(req: Request, res: Response): Promise<void> {
  const methodName = "Get interaction level";
  try {
    const interactionLevel = await interactionService.getInteractionLevel();
    if (interactionLevel.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionLevel.data);
      return;
    } else {
      errorLog(methodName, interactionLevel.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionLevel.errorMessage
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

/**
 * Retrieves the list of available interaction sources from the system.
 *
 * This controller method performs the following steps:
 * 1. Calls the `getInteractionSource` method from the `interactionService`, which fetches all defined interaction sources.
 * 2. If the service responds with success, logs the success event and sends an HTTP 200 response with the interaction source data.
 * 3. If the service responds with a failure status code, logs the error and returns a `BAD_REQUEST` response with the error message.
 * 4. Catches and logs any unexpected exceptions and returns a generic `BAD_REQUEST` response with the exception message.
 *
 * @param {Request} req - Express request object (not used directly in this function).
 * @param {Response} res - Express response object used to send the HTTP response.
 *
 * @returns {Promise<void>} - A Promise that resolves after the HTTP response is sent.
 */
async function getInteractionSource(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get interaction source";
  try {
    const interactionSource = await interactionService.getInteractionSource();
    if (interactionSource.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionSource.data);
      return;
    } else {
      errorLog(methodName, interactionSource.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionSource.errorMessage
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

/**
 * Retrieves the list of available response sources from the system.
 *
 * This controller method performs the following steps:
 * 1. Calls the `getResponseSource` method from the `interactionService`, which fetches all defined response sources.
 * 2. If the service responds with success, logs the success event and sends an HTTP 200 response with the response source data.
 * 3. If the service responds with a failure status code, logs the error and returns a `BAD_REQUEST` response with the error message.
 * 4. Catches and logs any unexpected exceptions and returns a generic `BAD_REQUEST` response with the exception message.
 *
 * @param {Request} req - Express request object (not used directly in this function).
 * @param {Response} res - Express response object used to send the HTTP response.
 *
 * @returns {Promise<void>} - A Promise that resolves after the HTTP response is sent.
 */
async function getResponseSource(req: Request, res: Response): Promise<void> {
  const methodName = "Get response source";
  try {
    const responseSource = await interactionService.getResponseSource();
    if (responseSource.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, responseSource.data);
      return;
    } else {
      errorLog(methodName, responseSource.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        responseSource.errorMessage
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

/**
 * Lists all interaction project accounts for the authenticated user.
 *
 * This controller method performs the following steps:
 * 1. Logs the incoming request body for debugging.
 * 2. Extracts the user ID from the `x-user-id` request header.
 * 3. Returns a BAD_REQUEST response if the user ID is missing.
 * 4. Calls the `listInteractionPrjAccount` method from the `interactionService` with the request body data, user ID,
 *    and specific parameters ("list", false, []) to fetch the list of interaction project accounts.
 * 5. If the service returns a success status, responds with HTTP 200 including the fetched interaction accounts and a success message.
 * 6. If the service indicates no data was found, responds with HTTP 200 with a "data not found" message and empty data.
 * 7. Catches and handles any errors by returning an error response with the failure status and message.
 *
 * @param {Request} req - Express request object containing request body and headers.
 * @param {Response} res - Express response object used to send HTTP responses.
 *
 * @returns {Promise<void>} - A Promise that resolves after sending the HTTP response.
 */
async function listAllInteractionPrjAcc(req: Request, res: Response) {
  try {
    const methodName = "listAllInteractionPrjAcc"
    let data = req.body;
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    const result = await interactionService.listInteractionPrjAccount(
      data,
      userId,
      "list",
      false,
      []
    );
    if (result.status == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.interactionFetchedSuccess,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotFound,
        data: result.data,
      });
      return;
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

/**
 * Exports all interactions for the authenticated user based on the provided filters.
 *
 * This controller method performs the following steps:
 * 1. Logs the incoming request body for debugging.
 * 2. Extracts the user ID from the `x-user-id` request header.
 * 3. Returns a BAD_REQUEST response if the user ID is missing.
 * 4. Calls `listInteractionPrjAccount` from the `interactionService` to fetch interactions with export mode.
 * 5. Retrieves the list of allowed export fields for the user via `getAllowedExportFields`.
 * 6. Constructs a set of allowed fields based on user permissions.
 * 7. Validates the provided timezone and defines a helper function to format dates accordingly.
 * 8. Maps each interaction record into a structured export format, including formatting dates and URLs.
 * 9. Filters the fields in each record to only those allowed for export, using appropriate field mappings based on the request flag (`account` or otherwise).
 * 10. Generates an Excel file in Base64 format from the structured data using `generateExcelBase64`.
 * 11. Sends a success response with the Base64-encoded Excel file.
 * 12. If no data is found, responds with HTTP 200 and a "data not found" message.
 * 13. Catches and handles any errors by returning an error response with failure status and message.
 *
 * @param {Request} req - Express request object containing request body and headers.
 * @param {Response} res - Express response object used to send HTTP responses.
 *
 * @returns {Promise<void>} - A Promise that resolves after sending the HTTP response.
 */
async function exportAllInteractions(req: Request, res: Response) {
  try {
    const methodName = "exportAllInteractions"
    const data = req.body
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    const result = await interactionService.listInteractionPrjAccount(
      data,
      userId,
      "export",
      false,
      []
    );
    const fields = await interactionService.getAllowedExportFields(
      userId,
      "interactions_view_edit"
    );
    const allowedFieldSet = new Set<string>();
    for (const field of fields) {
      if (field.read) {
        allowedFieldSet.add(field.field_name);
      }
    }
    const isValidTZ = data.timezone && isValidTimezone(data.timezone);
    const formatDate = (date?: Date) =>
      date
        ? moment(date)
            .tz(isValidTZ ? data.timezone : "UTC")
            .utcOffset('+05:30')
            .format("YYYY-MMM-DD, hh:mm:ss A")
        : null;

    if (result.status == HttpStatus.SUCCESS) {
      const finalStructuredData =
        result.data.interactions.length < 1
          ? []
          : result.data.interactions.map((d: any) => {
              let resultMap: { [key: string]: any } = {
                r_number: d.r_number,
                interaction_level_name: d.interaction_level_name,
                project_code: d.project_code,
                interaction_age: d.interaction_age,
                fiscal_year: d.fiscal_year,
                status_name: d.status_name,
                recipient_name: d.recipient_name,
                recipient_email: d.recipient_email,
                last_resent_on:
                  d.last_resent_on === null ? "" : formatDate(d.last_resent_on),
                last_reminder_on:
                  d.last_reminder_on == null
                    ? ""
                    : formatDate(d.last_reminder_on),
                response_submitted_on:
                  d.response_submitted_on === null
                    ? ""
                    : formatDate(d.response_submitted_on),
                response_updated_on:
                  d.response_updated_on == null
                    ? ""
                    : formatDate(d.response_updated_on),
                attachment_count:
                  d.attachment_count === 0 || d.attachment_count === ""
                    ? null
                    : d.attachment_count,
                interaction_url: d.interaction_url
                  ? {
                      text: "Link",
                      hyperlink: d.interaction_url,
                      style: {
                        fontColor: "1755E7",
                      },
                    }
                  : null,
                interaction_type_name: d.interaction_type_name,
                response_source_name: d.response_source_name,
                created_by: d.created_user_name,
                created_datetime: formatDate(d.created_datetime),
                modified_by: d.updated_user_name,
                modified_datetime:
                  d.modified_datetime == null
                    ? ""
                    : formatDate(d.modified_datetime),
              };

              // Build exportRecord using allowed fields and resultMap
              const exportRecord: Record<string, any> = {};
              if (data.flag === "account") {
                accountinteractionFieldMappings.forEach((mapping) => {
                  if (allowedFieldSet.has(mapping.permissionField)) {
                    exportRecord[mapping.exportField] =
                      resultMap[mapping.dataField];
                  }
                });
              } else {
                interactionFieldMappings.forEach((mapping) => {
                  if (allowedFieldSet.has(mapping.permissionField)) {
                    exportRecord[mapping.exportField] =
                      resultMap[mapping.dataField];
                  }
                });
              }
              if(exportRecord["Fiscal Year"] != undefined) exportRecord["Fiscal Year"] = `FY-${exportRecord["Fiscal Year"]}`
              return exportRecord;
            });

      const base64Response = await generateExcelBase64(
        finalStructuredData,
        "Interactions"
      );
      handleSuccessResponse(res, base64Response);
      return;
    } else {
        return res.status(HttpStatus.SUCCESS).json({
          statusCode : HttpStatus.SUCCESS,
          statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
          statusMessage : STATUS_MESSAGE.dataNotFound,
          data : null
        })
      }
  } catch (error : any) {
    errorLog("listOutAllInteractionSummary", error.message);
    handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, error.message)
  }
}

/**
 * Lists all interaction summaries for the authenticated user with pagination.
 *
 * This controller method performs the following steps:
 * 1. Logs the incoming request body for debugging purposes.
 * 2. Extracts the user ID from the `x-user-id` request header.
 * 3. Returns a BAD_REQUEST response if the user ID is missing.
 * 4. Calls `fetchInteractionSummary` from the `interactionService` to fetch interaction summary data.
 * 5. If data retrieval is successful (status code matches success message), constructs a response containing:
 *    - Current page and limit from the request body.
 *    - Total record count from the first element of the result data.
 *    - List of interactions returned by the service.
 * 6. Returns the constructed data with a success response.
 * 7. If no data is found, returns an empty interactions list with totalCount = 0 and success status.
 * 8. Catches and handles any errors by returning a failure response with the error message.
 *
 * @param {Request} req - Express request object containing request body and headers.
 * @param {Response} res - Express response object used to send HTTP responses.
 *
 * @returns {Promise<void>} - A Promise that resolves after sending the HTTP response.
 */
async function listOutAllInteractionSummary(req: Request, res: Response) {
  try {
    const methodName = "listOutAllInteractionSummary"
    const data = req.body;
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    const result = await interactionService.fetchInteractionSummary(
      data,
      userId
    );
    if (result.statusCodeValue == HttpStatus.SUCCESS_MESSAGE) {
      const finalData = {
        page: data.page,
        limit: data.limit,
        totalCount: result.data[0].total_records,
        interactions: result.data,
      };
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.interactionFetchedSuccess,
        data: finalData,
      });
    } else {
      const finalData = {
        page: data.page,
        limit: data.limit,
        totalCount: 0,
        interactions: [],
      };
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotFound,
        data: finalData,
      });
    }
  } catch (error : any) {
    errorLog("listOutAllInteractionSummary", error.message);
    return res.status(HttpStatus.FAILED).json({
      statusCode: HttpStatus.FAILED,
      statusCodeValue: HttpStatus.FAILED_MESSAGE,
      statusMessage: error.message,
      data: [],
    });
  }
}

/**
 * Exports all interaction summaries for the authenticated user as a base64-encoded Excel file.
 *
 * This controller method performs the following steps:
 * 1. Logs the incoming request body for debugging.
 * 2. Extracts the user ID from the `x-user-id` request header.
 * 3. Returns a BAD_REQUEST response if the user ID is missing.
 * 4. Calls `fetchInteractionSummary` from `interactionService` to get interaction summary data.
 * 5. Retrieves allowed export fields for the user to control export permissions.
 * 6. Creates a set of allowed fields based on user permissions.
 * 7. Defines a helper function to format dates according to a valid timezone or UTC.
 * 8. If data retrieval is successful:
 *    - Maps each interaction record to a structured export object using allowed fields.
 *    - Formats dates, URLs, and other fields as required for export.
 *    - Generates an Excel file encoded as a base64 string from the structured data.
 *    - Returns the base64 Excel response with a success response.
 * 9. If no data is found, returns a success response with a dataNotFound message and null data.
 * 10. Catches and handles any errors by returning a failure response with the error message.
 *
 * @param {Request} req - Express request object containing request body and headers.
 * @param {Response} res - Express response object used to send HTTP responses.
 *
 * @returns {Promise<void>} - A Promise that resolves after sending the HTTP response.
 */
async function exportAllInteractionSummary(req: Request, res: Response) {
  try {
    const methodName = "exportAllInteractionSummary"
    const data = req.body;
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    const result = await interactionService.fetchInteractionSummary(
      data,
      userId
    );
    const fields = await interactionService.getAllowedExportFields(
      userId,
      "interactions_view_edit"
    );
    const allowedFieldSet = new Set<string>();
    for (const field of fields) {
      if (field.read) {
        allowedFieldSet.add(field.field_name);
      }
    }
    const isValidTZ = data.timezone && isValidTimezone(data.timezone);
    const formatDate = (date?: Date) =>
      date
        ? moment(date)
            .tz(isValidTZ ? data.timezone : "UTC")
            .format("YYYY-MM-DD, hh:mm:ss A")
        : null;
    if (result.statusCodeValue == HttpStatus.SUCCESS_MESSAGE) {
      let structuredData =
        result.data.length < 1
          ? []
          : result.data.map((d: any) => {
              let resultMap: { [key: string]: any } = {
                r_number: d.r_number,
                account_name: d.account_name,
                project_code: d.project_code,
                interaction_age: d.interaction_age,
                fiscal_year: d.fiscal_year,
                status_name: d.status_name,
                recipient_name: d.recipient_name,
                recipient_email: d.recipient_email,
                last_sent_date:
                  d.last_resent_on === null ? "" : formatDate(d.last_resent_on),
                last_reminder_date:
                  d.last_reminder_on == null
                    ? ""
                    : formatDate(d.last_reminder_on),
                response_submitted_on:
                  d.response_submitted_on === null
                    ? ""
                    : formatDate(d.response_submitted_on),
                response_updated_on:
                  d.response_updated_on == null
                    ? ""
                    : formatDate(d.response_updated_on),
                attachment_count:
                  d.attachment_count === 0 || d.attachment_count === ""
                    ? null
                    : d.attachment_count,
                interaction_url: d.interaction_url
                  ? {
                      text: "Link",
                      hyperlink: d.interaction_url,
                      style: {
                        fontColor: "1755E7",
                      },
                    }
                  : null,
                interaction_type_name: d.interaction_type_name,
                response_source_name: d.response_source_name,
                created_by: d.created_user_name,
                created_datetime:
                  d.created_datetime == null
                    ? ""
                    : formatDate(d.created_datetime),
                modified_by: d.updated_user_name,
                modified_datetime:
                  d.modified_datetime == null
                    ? ""
                    : formatDate(d.modified_datetime),
              };

              const exportRecord: Record<string, any> = {};
              interactionFieldMappings.forEach((mapping) => {
                if (allowedFieldSet.has(mapping.permissionField)) {
                  exportRecord[mapping.exportField] =
                    resultMap[mapping.dataField];
                }
              });
              return exportRecord;
            });
      const base64Response = await generateExcelBase64(
        structuredData,
        "Interactions"
      );
      handleSuccessResponse(res, base64Response);
      return;
    } else {
        return res.status(HttpStatus.SUCCESS).json({
          statusCode : HttpStatus.SUCCESS,
          statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
          statusMessage : STATUS_MESSAGE.dataNotFound,
          data : null
        })
      }
  } catch (error : any) {
    errorLog("exportAllInteractionSummary", error.message);
    return res.status(HttpStatus.FAILED).json({
      statusCode: HttpStatus.FAILED,
      statusCodeValue: HttpStatus.FAILED_MESSAGE,
      statusMessage: error.message,
      data: [],
    });
  }
}

/**
 * Retrieves and returns the paginated response history for interactions based on request criteria.
 *
 * Validates the presence of the user ID in headers, then calls the service to fetch response history.
 * Sends a success response with paginated data or a not-found message if no data exists.
 * Handles errors by returning a failure response with the error message.
 *
 * @param {Request} req - Express request object containing body and headers.
 * @param {Response} res - Express response object for sending HTTP responses.
 *
 * @returns {Promise<void>} Resolves after sending the response.
 */
async function listResponseHistory(req: Request, res: Response) {
  try {
    const methodName = "listResponseHistory"
    const data = req.body;
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    const result = await interactionService.listInteractionResponseHistory(
      data
    );
    if (result.statusCodeValue == HttpStatus.SUCCESS_MESSAGE) {
      let responseData = {
        page: data.page,
        limit: data.limit,
        totalCount: result.data[0].total_records,
        response_history: result.data,
      };
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.historyResponseFetched,
        data: responseData,
      });
    } else {
      let responseData = {
        page: data.page,
        limit: data.limit,
        totalCount: 0,
        response_history: result.data,
      };
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotFound,
        data: responseData,
      });
    }
  } catch (error : any) {
    errorLog("listResponseHistory", error.message);
    return res.status(HttpStatus.FAILED).json({
      statusCode: HttpStatus.FAILED,
      statusCodeValue: HttpStatus.FAILED_MESSAGE,
      statusMessage: error.message,
      data: [],
    });
  }
}

/**
 * Exports interaction response history as an Excel file in Base64 format.
 *
 * Validates the user ID in headers, fetches response history from the service,
 * formats the data for export, and sends the Base64-encoded Excel file.
 * Returns a not-found message if no data exists or an error response on failure.
 *
 * @param {Request} req - Express request object with body and headers.
 * @param {Response} res - Express response object for sending HTTP responses.
 *
 * @returns {Promise<void>} Resolves after sending the response.
 */
async function exportResponseHistory(req: Request, res: Response) {
  try {
    const methodName = "exportResponseHistory"
    const data = req.body;
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    const result = await interactionService.listInteractionResponseHistory(
      data
    );
    if (result.statusCodeValue == HttpStatus.SUCCESS_MESSAGE) {
      let timezone;
      if(data.timezone != undefined) timezone = data.timezone
      else timezone = "UTC"
      let structuredData = result.data.map((d: any) => {
        let isoDate = new Date(d.response_on).toISOString();
        return {
          "Interaction ID": d.r_number,
          "Interaction Type": d.interaction_source_name,
          "Response Via": d.interaction_response,
          "Response On":
            d.response_on == null
              ? ""
              : moment(d.response_on).tz(timezone).format("YYYY-MMM-DD hh:mm:ss A"),
          "Response Email-ID": d.response_email,
          "Response By": d.response_by,
        };
      });
      const base64Response = await generateExcelBase64(
        structuredData,
        "Interactions"
      );
      handleSuccessResponse(res, base64Response);
      return;
    } else {
        return res.status(HttpStatus.SUCCESS).json({
          statusCode : HttpStatus.SUCCESS,
          statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
          statusMessage : STATUS_MESSAGE.dataNotFound,
          data : null
        })
      }
  } catch (error : any) {
    errorLog("exportResponseHistory", error.message);
    return res.status(HttpStatus.FAILED).json({
      statusCode: HttpStatus.FAILED,
      statusCodeValue: HttpStatus.FAILED_MESSAGE,
      statusMessage: error.message,
      data: [],
    });
  }
}

/**
 * Sends interaction data after validating the request.
 *
 * Checks for user ID in headers and validates the request body against the schema.
 * Calls the interaction service to send the interaction, then returns success or error response accordingly.
 *
 * @param {Request} req - Express request object containing body and headers.
 * @param {Response} res - Express response object for sending HTTP responses.
 *
 * @returns {Promise<void>} Resolves after sending the response.
 */
async function sendInteraction(req: Request, res: Response): Promise<void> {
  const methodName = "Send interaction";
  try {
    const value = await validateRequest(req, sendInteractionSchema, res);
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
     const interaction = await interactionService.sendInteraction(
       value.interactions,
       value.email_info,
       value.account_rid,
       userId,
       value.is_interaction_followup
     );

    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: interaction.message,
        data: interaction.data,
      });
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
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

/**
 * Uploads an attachment file to Azure Blob Storage.
 *
 * Validates the presence of user ID in headers and checks if a file is included in the request.
 * Calls the Azure upload helper and responds with file details or error messages accordingly.
 *
 * @param {Request} req - Express request object, including file and body.
 * @param {Response} res - Express response object to send back the result.
 *
 * @returns {Promise<void>} Resolves after sending the response.
 */
async function uploadAttachmentToAzure(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Upload attachment to Azure";
  try {
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);

    let value = req.body;
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
    const accountInfo =  await interactionService.getAccountNumberByRid(value?.account_rid);
    const accountNumber = accountInfo.data?.account_number || "account";
    if (req.file) {
      let fileInfo = await uploadToAzureBlob(
        req.file,
        value?.account_rid,
        value?.project_rid,
        value?.interaction_rid,
        accountNumber
      );
      handleSuccessResponse(res, {
        fileName: fileInfo.name,
        fileSize: fileInfo.size,
        fileType: fileInfo.extension,
        fileUrl: fileInfo.url,
      });
      return;
    } else {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "No file uploaded"
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

/**
 * Deletes an attachment from Azure Blob Storage based on the provided file URL.
 *
 * Validates the presence of user ID in headers and the file URL in the request body.
 * Calls the Azure delete helper and responds with success or error messages accordingly.
 *
 * @param {Request} req - Express request object containing file URL and headers.
 * @param {Response} res - Express response object used to send the result.
 *
 * @returns {Promise<void>} Resolves after sending the response.
 */
async function deleteAttachmentFromAzure(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Delete attachment from Azure";
  try {
    //  const value = await validateRequest(req, sendInteractionSchema, res)
    const userId = req.headers["x-user-id"] as string;
    let value = req.body;
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
    if (value.file_url) {
      let deleted = await deleteFromAzureBlob(value.file_url);
      handleSuccessResponse(res, deleted);
      return;
    } else {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "No file uploaded"
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

/**
 * Handles request to list the technical summary.
 *
 * Validates user ID in headers and query parameters, parses filters,
 * calls service to fetch data, and sends a formatted JSON response.
 *
 * @param {Request} req - Express request object containing query params and headers.
 * @param {Response} res - Express response object to send the response.
 *
 * @returns {Promise<void>} Resolves after sending the HTTP response.
 */
async function listTechnicalSummary(req: Request, res: Response) {
  const methodName = "listTechnicalSummary";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listAllTechnicalSummarySchema, res, "GET");
    logMessage(`[${methodName}] Request received, ${JSON.stringify(value)} userId: ${userId}`);
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
    if (!value) return;
    let parsedFilters: Record<string, any> = {};
    try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const page: number = parseInt(value.page, 10) || 1;
    const limit: number = parseInt(value.limit, 10) || 10;
    const result = await interactionService.listTechnicalSummary(
      value,
      page,
      limit,
      parsedFilters
    );
    if (result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: HttpStatus.SUCCESS_NOTIFICATION,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotFound,
        data: result.data,
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
    return;
  }
}

/**
 * Handles exporting of the technical summary data.
 *
 * Validates the request using a schema, ensures user ID is provided,
 * parses filters from the query, fetches data from the interaction service,
 * filters allowed fields based on user permissions, formats dates with timezone support,
 * and generates an Excel file in base64 format as the response.
 *
 * Responds with an Excel file (base64 string) if data exists,
 * or a "data not found" message if the dataset is empty.
 *
 * @param {Request} req - Express request object containing headers and query parameters.
 * @param {Response} res - Express response object used to send the response.
 *
 * @returns {Promise<void>} Resolves after sending the HTTP response.
 */
async function exportTechnicalSummary(req: Request, res: Response) {
  const methodName = "exportTechnicalSummary";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, exportTechnicalSummarySchema, res, "GET");
    logMessage(`[${methodName}] Request received, ${JSON.stringify(value)} userId: ${userId}`);
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
    if (!value) return;
    let parsedFilters: Record<string, any> = {};
    try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }
    const result = await interactionService.exportTechnicalSummary(
      value,
      parsedFilters
    );
    const fields = await interactionService.getAllowedExportFields(
      userId,
      "projects_tech_summary_view_edit"
    );
    const projectFields = await interactionService.getAllowedExportFields(
      userId,
      "projects_view_edit"
    )
    const allowedFieldSet = new Set<string>();
     const allowedProjectFieldSet = new Set<string>();
    for (const field of fields) {
      if (field.read) {
        allowedFieldSet.add(field.field_name);
      }
    }
    for(let p of projectFields) {
      if(p.read) {
        allowedProjectFieldSet.add(p.field_name)
      }
    }
    const isValidTZ = value.timezone && isValidTimezone(value.timezone);
    const formatDate = (date?: Date) => {
      const offsetMs = (5 * 60 + 30) * 60 * 1000;
      const convertedDate = new Date(date?.getTime() ?? "" + offsetMs);
      return date
        ? moment
            .utc(convertedDate)
            .tz(isValidTZ ? value.timezone : "UTC")
            .utcOffset('-012:30')
            .format("YYYY-MMM-DD, hh:mm:ss A")
        : null;
    }
    if (result.statusCode === HttpStatus.SUCCESS) {
      const finalStructuredData =
        result?.data?.techSummaryInfo.length < 1
          ? []
          : result?.data?.techSummaryInfo.map((d: any) => {
              let resultMap: { [key: string]: any } = {
                r_number: d.r_number,
                project_code: d.project_code,
                project_name : d.project_name, 
                fiscal_year: d.fiscal_year,
                status_name: d.status_name,
                version: d.version,
                summary_context: d.summary_context,
                technical_summary: d.technical_summary,
                created_by: d.created_user_name,
                created_datetime: d.created_datetime ? value.timezone && isValidTimezone(value.timezone) ? moment.tz(d.created_datetime.toISOString(), value.timezone).add(5, 'hours').add(30, 'minutes').format("YYYY-MMM-DD, hh:mm:ss A") : moment(d.created_datetime.toISOString()).add(5, 'hours').add(30, 'minutes').format("YYYY-MMM-DD, hh:mm:ss A") : "-",
                modified_by: d.modified_user_name,
                modified_datetime: d.modified_datetime ? value.timezone && isValidTimezone(value.timezone) ? moment.tz(d.modified_datetime.toISOString(), value.timezone).add(5, 'hours').add(30, 'minutes').format("YYYY-MMM-DD, hh:mm:ss A") : moment(d.modified_datetime.toISOString()).add(5, 'hours').add(30, 'minutes').format("YYYY-MMM-DD, hh:mm:ss A") : "-",
              };

              // Build exportRecord using allowed fields and resultMap
              const exportRecord: Record<string, any> = {};
              techSummaryFieldMappings.forEach((mapping) => {
                if (allowedFieldSet.has(mapping.permissionField)) {
                  exportRecord[mapping.exportField] =
                    resultMap[mapping.dataField];
                }
                if(allowedProjectFieldSet.has(mapping.permissionField)) {
                  exportRecord[mapping.exportField] =
                    resultMap[mapping.dataField];
                }
              });

              return exportRecord;
            });

      const generateBase64Response = await generateExcelBase64(
        finalStructuredData,
        "Technical Summary"
      );
      handleSuccessResponse(res, generateBase64Response);
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotFound,
        data: result.data,
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
    return;
  }
}
async function listInteractionHistory (req : Request, res : Response) {
  const methodName = "listInteractionHistory"
  try {
    const userId = req.headers["x-user-id"] as string;
    let data = req.body;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    const result = await interactionService.fetchInteractionHistory(data);
    if (result.statusCodeValue === HttpStatus.SUCCESS_MESSAGE) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.interactionHistoryFetched,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotFound,
        data: result.data,
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
    return;
  }
}

/**
 * Handles the request to fetch interaction attachments.
 *
 * Validates the presence of the user ID in request headers, retrieves the request body,
 * and calls the interaction service to get a paginated list of interaction attachments.
 * Constructs and sends a structured JSON response with pagination metadata and attachment data.
 * If no attachments are found, responds with a "data not found" message.
 *
 * In case of an error during processing, logs the exception and sends a failed response.
 *
 * @param {Request} req - Express request object containing headers and body.
 * @param {Response} res - Express response object used to send the response.
 *
 * @returns {Promise<void>} Resolves after sending the HTTP response.
 */
async function fetchInteractionAttachments(req: Request, res: Response) {
  const methodName = "fetchInteractionAttachments";
  try {
  
    const userId = req.headers["x-user-id"] as string;
    let data = req.body;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);

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
    const result = await interactionService.listInteractionAttachments(data);
    if (result.statusCodeValue == HttpStatus.SUCCESS_MESSAGE) {
      let finalData = {
        page: result.page,
        limit: result.limit,
        totalRecords: result.totalRecords,
        data: result.attachments,
      };
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.interactionAttachmentFetched,
        data: finalData,
      });
    } else {
      let finalData = {
        page: result.page,
        limit: result.limit,
        totalRecords: result.totalRecords,
        data: result.attachments,
      };
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotFound,
        data: finalData,
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
    return;
  }
}

/**
 * Handles the request to fetch response history details.
 *
 * Validates the presence of the user ID in the request headers and retrieves request body data.
 * Calls the interaction service to fetch detailed history of user responses.
 * Returns a success response with the response history data if available,
 * or a "data not found" message if the dataset is empty.
 *
 * Logs any exceptions encountered during processing and returns a failed response.
 *
 * @param {Request} req - Express request object containing headers and body.
 * @param {Response} res - Express response object used to send the response.
 *
 * @returns {Promise<void>} Resolves after sending the HTTP response.
 */
async function fetchResponseHistoryDetails (req : Request, res : Response) {
   const methodName = "fetchResponseHistoryDetails"
    try {
    console.log(`[${methodName}] Request received`);
    const userId = req.headers["x-user-id"] as string;
    let data = req.body;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    const result = await interactionService.listResponseHistoryDetails(data);
    if (result.statusCodeValue == HttpStatus.SUCCESS_MESSAGE) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.historyResponseFetched,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotFound,
        data: result.data,
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
    return;
  }
}

/**
 * Handles the request to trigger an AI-based assessment and returns the response.
 *
 * Validates the presence of the user ID in the request headers and retrieves the request body.
 * Calls the interaction service to initiate the AI process using the provided data.
 * Responds with a success message and the result returned by the AI trigger service.
 *
 * Logs any errors encountered during the process and returns a failed response if needed.
 *
 * @param {Request} req - Express request object containing headers and body.
 * @param {Response} res - Express response object used to send the response.
 *
 * @returns {Promise<void>} Resolves after sending the HTTP response.
 */
async function triggerAIAndPassResponse(req: Request, res: Response) {
  const methodName = "triggerAIAndSendPassResponse";
  try {
    const userId = req.headers["x-user-id"] as string;
    let data = req.body;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    const result = await interactionService.triggerAI(data, userId);
    if(result.statusCode != HttpStatus.SUCCESS) {
       return res.status(HttpStatus.FAILED).json({
      statusCode: HttpStatus.FAILED,
      statusCodeValue: HttpStatus.FAILED_MESSAGE,
      statusMessage: result.statusMessage,
      data: result.data,
    });
    }
  
    return res.status(HttpStatus.SUCCESS).json({
      statusCode: HttpStatus.SUCCESS,
      statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
      statusMessage: STATUS_MESSAGE.assessmentInitiated,
      data: result.data,
    });
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Handles the request to export interaction history as an Excel file.
 *
 * Validates the presence of the user ID in the request headers and retrieves the request body.
 * Calls the interaction service to fetch interaction history data.
 * If data is available, formats it and generates a base64-encoded Excel file for export.
 * Sends the file as a response. If no data is found, returns a "data not found" message.
 *
 * Logs any exceptions and responds with an error message if the operation fails.
 *
 * @param {Request} req - Express request object containing headers and body.
 * @param {Response} res - Express response object used to send the response.
 *
 * @returns {Promise<void>} Resolves after sending the HTTP response.
 */
async function exportInteractionHistory(req: Request, res: Response) {
  const methodName = "exportInteractionHistory";
  try {
   
    const userId = req.headers["x-user-id"] as string;
    let data = req.body;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    const result = await interactionService.fetchInteractionHistory(data);
    if (result.statusCodeValue == HttpStatus.SUCCESS_MESSAGE) {
      let timezone : string
      if(data.timezone != undefined) {
        const res = isValidTimezone(data.timezone)
        if(res) timezone = data.timezone
      }else timezone = "UTC"
      
      let finalStructuredData = result.data.data.interaction_history.map(
        (data: any) => {
          return {
            Action: data.status_name,
            Date: moment(data.date).tz(timezone).format("YYYY-MMM-DD hh:mm:ss A"),
          }
        }
      );
      const generateBase64Response = await generateExcelBase64(
        finalStructuredData,
        "Interaction-History"
      );
      handleSuccessResponse(res, generateBase64Response);
      return;
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotFound,
        data: null,
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
    return;
  }
}

/**
 * Processes incoming Kafka messages.
 *
 * Logs the start of message processing and calls the interaction service
 * to handle the provided Kafka message data.
 * Intended to be used as a consumer function for Kafka message streams.
 *
 * In case of an error during processing, logs the exception for debugging.
 *
 * @param {any} data - The Kafka message payload to be processed.
 *
 * @returns {Promise<void>} Resolves after processing the Kafka message.
 */
async function processKafkaMessages(data: any) {
  const methodName = "processKafkaMessages";
  try {
    logMessage(`[${methodName}] Processing Kafka messages #${JSON.stringify(data)}`);
    const result = await interactionService.processKafkaMessage(data);
    // Implement your Kafka message processing logic here
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    console.log(`[${methodName}] Exception:`, error);
  }
}

/**
 * Handles the request to fetch a list of interactions for reminder notifications.
 *
 * Validates the presence of the user ID in the request headers and retrieves the request body.
 * Fetches status IDs required for filtering interactions eligible for reminders.
 * Calls the interaction service to retrieve the list of interactions based on user ID,
 * reminder-specific flags, and eligible status IDs.
 *
 * Responds with the interaction list if found, or a "data not found" message if none match.
 * Logs any exceptions encountered during the process.
 *
 * @param {Request} req - Express request object containing headers and body.
 * @param {Response} res - Express response object used to send the response.
 *
 * @returns {Promise<void>} Resolves after sending the HTTP response.
 */
async function fetchInteractionListForReminder(req: Request, res: Response) {
  const methodName = "fetchInteractionListForReminder";
  try {
    const userId = req.headers["x-user-id"] as string;
    let data = req.body;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    const statusIdsForReminder =
      await interactionService.fetchStatusIdsForReminder();
    if (statusIdsForReminder != undefined) {
      const result = await interactionService.listInteractionPrjAccount(
        data,
        userId,
        "list",
        data.reminder_specific_list,
        statusIdsForReminder
      );
      if (result.status == HttpStatus.SUCCESS) {
        return res.status(HttpStatus.SUCCESS).json({
          statusCode: HttpStatus.SUCCESS,
          statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
          statusMessage: STATUS_MESSAGE.interactionFetchedSuccess,
          data: result.data,
        });
      } else {
        return res.status(HttpStatus.SUCCESS).json({
          statusCode: HttpStatus.SUCCESS,
          statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
          statusMessage: STATUS_MESSAGE.dataNotFound,
          data: result.data,
        });
      }
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotFound,
        data: [],
      });
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    console.log(`[${methodName}] Exception:`, error);
  }
}

/**
 * Handles the request to fetch the Four Part Assessment list.
 *
 * Validates the presence of the user ID in the request headers.
 * Logs the incoming request payload along with the user ID for traceability.
 * Calls the interaction service to retrieve the Four Part Assessment list
 * based on the provided request body parameters.
 *
 * Returns the service response data along with status information.
 * In case of an exception, logs the error and returns a failure response
 * with the error message.
 *
 * @param {Request} req - Express request object containing headers and body data.
 * @param {Response} res - Express response object used to send the HTTP response.
 *
 * @returns {Promise<void>} Resolves after the HTTP response is sent.
 */
async function fetchFourPartAssessmentList (req : Request, res : Response) {
  const methodName = "fetchFourPartAssessmentList";
  try {
    const userId = req.headers["x-user-id"] as string;
    let data = req.body;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    data.isExport = false;
    const result = await interactionService.getFourPartAssessmentList(data);
    if (result.statusCode == HttpStatus.SUCCESS) {
        return res.status(HttpStatus.SUCCESS).json({
          statusCode: HttpStatus.SUCCESS,
          statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
          statusMessage: result.statusMessage,
          data: result.data,
        });
      } else {
        return res.status(HttpStatus.SUCCESS).json({
          statusCode: HttpStatus.SUCCESS,
          statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
          statusMessage: result.statusMessage,
          data: result.data,
        });
      }
  } catch (err : any) {
    return res.status(HttpStatus.SUCCESS).json({
      statusCode: HttpStatus.SUCCESS,
      statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
      statusMessage: err.message,
      data: null,
    });
  }
}

/**
 * Handles the request to fetch Four Part Assessment (FPA) details by ID.
 *
 * Extracts the request payload from the request body and calls the
 * interaction service to retrieve FPA details based on the provided identifier.
 *
 * Returns the assessment details along with status information if the
 * operation is successful. In case of failure, returns the corresponding
 * status message and data received from the service layer.
 *
 * Catches and handles unexpected errors by returning an error message
 * with a null data response.
 *
 * @param {Request} req - Express request object containing the request body.
 * @param {Response} res - Express response object used to send the HTTP response.
 *
 * @returns {Promise<void>} Resolves after sending the HTTP response.
 */
async function getFpaDetails (req : Request, res : Response) {
  try {
    const data = req.body;
    const result = await interactionService.getFpaDetailsById(data);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
          statusCode: HttpStatus.SUCCESS,
          statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
          statusMessage: result.statusMessage,
          data: result.data,
        });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
          statusCode: HttpStatus.SUCCESS,
          statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
          statusMessage: result.statusMessage,
          data: result.data,
        });
    }
  }catch (err : any) {
    return res.status(HttpStatus.FAILED).json({
      statusCode: HttpStatus.FAILED,
      statusCodeValue: HttpStatus.FAILED_MESSAGE,
      statusMessage: err.message,
      data: null,
    });
  }
}

 async function exportFetchFourPartAssessmentList (req : Request, res : Response) {
  const methodName = "exportFetchFourPartAssessmentList";
  try {
    const userId = req.headers["x-user-id"] as string;
    let data = req.body;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    data.isExport = true
    const result = await interactionService.exportFpaList(data);
    if (result.statusCode == HttpStatus.SUCCESS) {
          const fields = await interactionService.getAllowedExportFields(
      userId,
      "four_part_assessment_export"
    );
    const allowedFieldSet = new Set<string>();
    for (const field of fields) {
      if (field.read) {
        allowedFieldSet.add(field.field_name);
      }
    }
    const isValidTZ = data.timezone && isValidTimezone(data.timezone);
    const formatDate = (date?: Date) =>
      date
        ? moment(date)
            .tz(isValidTZ ? data.timezone : "UTC")
            .format("YYYY-MM-DD, hh:mm:ss A")
        : null;
    if (result.statusCode == HttpStatus.SUCCESS) {
      let structuredData =
        result.data.data.length < 1
          ? []
          : result.data.data.map((d: any) => {
              let resultMap: { [key: string]: any } = {
                r_number: d.r_number,
                project_code: d.project_code,
                rd_potential_category: d.rd_potential_category,
                permitted_purpose_status: d.permitted_purpose_status,
                technological_uncertainty_status : d.technological_uncertainty_status,
                technological_in_nature_status: d.technological_in_nature_status,
                process_of_experimentation_status : d.process_of_experimentation_status,
                status : d.status,
                summary_judgment: d.summary_judgment,
                created_datetime: d.created_datetime === null ? "" : formatDate(d.created_datetime),
                created_by: d.created_by_name
              };

              const exportRecord: Record<string, any> = {};
              fpaFieldMappings.forEach((mapping) => {
                if (allowedFieldSet.has(mapping.permissionField)) {
                  exportRecord[mapping.exportField] =
                    resultMap[mapping.dataField];
                }
              });
              return exportRecord;
            });
      const base64Response = await generateExcelBase64(
        structuredData,
        "FourPart Assessment"
      );
      handleSuccessResponse(res, base64Response);
      return;
      }
  } 
}catch (err : any) {
    return res.status(HttpStatus.FAILED).json({
      statusCode: HttpStatus.FAILED,
      statusCodeValue: HttpStatus.FAILED_MESSAGE,
      statusMessage: err.message,
      data: null,
    });
  }
}

 async function updateInteractionStatus (req : Request, res : Response) {
  const methodName = "updateInteractionStatus";
  try {
    const userId = req.headers["x-user-id"] as string;
    let data = req.body;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    const result = await interactionService.updateInteractionStatus(data, userId);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
          statusCode: HttpStatus.SUCCESS,
          statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
          statusMessage: result.statusMessage
        });
    }
}catch (err : any) {
    return res.status(HttpStatus.FAILED).json({
      statusCode: HttpStatus.FAILED,
      statusCodeValue: HttpStatus.FAILED_MESSAGE,
      statusMessage: err.message
    });
  }
}
async function getInteractionAssessmentSource (req : Request, res : Response) {
  const methodName = "getInteractionAssessmentSource"
  try {
    const userId = req.headers["x-user-id"] as string;
    let data = req.body;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
    const result = await interactionService.getInteractionAssessmentSource();
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.assessmentFetchedSuccess,
        data : result.data
      });
    }
  } catch (err : any) {
    return res.status(HttpStatus.FAILED).json({
      statusCode: HttpStatus.FAILED,
      statusCodeValue: HttpStatus.FAILED_MESSAGE,
      statusMessage: err.message
    });
  }
}
export default {
  listAllInteractionPrjAcc,
  exportAllInteractions,
  listOutAllInteractionSummary,
  exportAllInteractionSummary,
  listResponseHistory,
  exportResponseHistory,
  createInteraction,
  createAccountInteraction,
  listAccountInteractions,
  updateInteraction,
  updateInteractionResponse,
  getInteractionStatus,
  getInteractionTypes,
  getInteractionSource,
  getInteractionLevel,
  getResponseSource,
  getInteractionDetailsById,
  getKeyContactsByCaseId,
  getInteractionQuestionsById,
  sendInteraction,
  uploadAttachmentToAzure,
  deleteAttachmentFromAzure,
  listInteractionHistory,
  fetchInteractionAttachments,
  fetchResponseHistoryDetails,
  triggerAIAndPassResponse,
  exportInteractionHistory,
  processKafkaMessages,
  listTechnicalSummary,
  getTechnicalSummaryDetailsById,
  updateTechSummaryContext,
  exportTechnicalSummary,
  updateAccountInteraction,
  fetchInteractionListForReminder,
  fetchFourPartAssessmentList,
  getFpaDetails,
  exportFetchFourPartAssessmentList,
  updateInteractionStatus,
  getInteractionAssessmentSource
};
