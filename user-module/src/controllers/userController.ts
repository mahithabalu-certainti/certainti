import { Request, Response } from "express";
import {
  createUserSchema,
  enterpriseUserSchema,
  userDetailsUpdateSchema,
  listUserByIdSchema,
  listUserSchema,
  exportUserSchema,
  updateUserSchema,
  userReqSchema,
} from "../lib/joi/schemas/schema";
import { errorResponse } from "../utils/apiResponse";
import { constants } from "../utils/constant";
import configurations from "../config/config";
import { createAzureB2CUser, updateAzureUser ,deleteAzureB2CUser} from "../services/manageUser";
import { generateSecurePassword } from "../utils/generatePassword";
import { sendEmail } from "../services/emailService";
import { mailTemplate } from "../utils/mailTemplate";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  requestErrorMessages,
  successLog,
  validateRequest,
  generateExcelBase64,
} from "../utils/helpers";

const services = configurations.getInstance().getServices();

/**
 * Creates a new user by validating the request, generating a secure password,
 * creating a user in Azure AD B2C, and storing the user information.
 * Sends a welcome email to the user after creation.
 *
 * @param {Request} req - The Express request object containing the request data.
 * @param {Response} res - The Express response object used to send the response back to the client.
 * @returns {Promise<void>} - A promise that resolves when the user creation process is complete.
 *
 * @throws {Error} - Throws an error if the user creation process fails at any step.
 */
async function createUser(req: Request, res: Response): Promise<void> {
  const methodName = "Create user";
  try {
    const { organization } = req.body;

    const { error: reqErr } = userReqSchema.validate(
      {
        organization,
      },
      {
        abortEarly: false,
      }
    );

    if (reqErr) {
      const errorMessage = requestErrorMessages(reqErr);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        errorMessage
      );
      return;
    }

    const value = await validateRequest(
      req,
      organization === constants.ENV_TRD365
        ? createUserSchema
        : enterpriseUserSchema,
      organization,
      res
    );

    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "User ID is required"
      );
      return;
    }
    if (!value) {
      return;
    }

    const existingUser = await services.userServices.getUserByEmail(value.email);
    if (existingUser) {
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "Email already exists in the system"
      );
      return;
    }

    const password = await generateSecurePassword(12);
    const azureUser = await createAzureB2CUser(value, password);
    if (!azureUser) {
      errorLog(methodName, "Azure AD B2C user creation failed");
      handleErrorResponse(
        res,
        constants.FAILED,
        constants.FAILED_MESSAGE,
        "Azure AD B2C user creation failed"
      );
      return;
    }

    const user = await services.userServices.createUser(value, azureUser.id, userId);
    const mailContent = mailTemplate(value, password);
    await sendEmail(mailContent);

    if (user.statusCode === constants.SUCCESS) {
     await services.userGroupService.assignUserToUserGroups(user?.data?.user,userId);
      successLog(methodName);
      handleSuccessResponse(res, user);
      return;
    } else {
      errorLog(methodName, user.errorMessage);
      deleteAzureB2CUser(value);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        user.errorMessage
      );
      return;
    }
  } catch (error) {
    const err = error as Error;
    errorLog(methodName, err.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      err.message
    );
    return;
  }
}

/**
 * Updates an existing user by validating the request and updating their details in Azure AD B2C.
 *
 * @param {Request} req - The Express request object containing the user data to be updated.
 * @param {Response} res - The Express response object used to send the response back to the client.
 * @returns {Promise<void>} - A promise that resolves when the user update process is complete.
 *
 * @throws {Error} - Throws an error if the user update process fails at any step.
 */
async function updateUser(req: Request, res: Response): Promise<void> {
  const methodName = "Update user";
  try {
    const { organization } = req.body;
    const { error: reqErr } = userReqSchema.validate(
      {
        organization,
      },
      {
        abortEarly: false,
      }
    );

    if (reqErr) {
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "organization is required"
      );
      return;
    }

    const value = await validateRequest(
      req,
      organization === constants.ENV_TRD365
        ? updateUserSchema
        : userDetailsUpdateSchema,
      organization,
      res
    );

    const userId = req.headers['x-user-id'] as string;
    if(!userId){
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "User ID is required"
      );
      return;
    }
    if (!value) {
      return;
    }

    const azureUser = await updateAzureUser(value);
    if (!azureUser) {
      errorLog(methodName, "Azure AD B2C user update failed");
      handleErrorResponse(
        res,
        constants.FAILED,
        constants.FAILED_MESSAGE,
        "Azure AD B2C user update failed"
      );
      return;
    }

    const user = await services.userServices.updateUser(value, value.rid, userId);

    if (user.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, user.data);
      return;
    } else {
      errorLog(methodName, user.message);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        user.errorMessage
      );
      return;
    }
  } catch (error) {
    const err = error as Error;
    errorLog(methodName, err.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      err.message
    );
    return;
  }
}

/**
 * Lists users based on the provided query parameters like filters, pagination, and sorting.
 *
 * @param {Request} req - The Express request object containing the request data (filters, search, etc.).
 * @param {Response} res - The Express response object used to send the response back to the client.
 * @returns {Promise<void>} - A promise that resolves when the list of users is returned.
 *
 * @throws {Error} - Throws an error if the user listing process fails at any step.
 */
async function listUsers(req: Request, res: Response): Promise<void> {
  const methodName = "List user";
  try {
    const value = await validateRequest(req, listUserSchema, "", res, "GET");

    if (!value) {
      return;
    }

    let parsedFilters: Record<string, any> = {};

    if(!value){
      return;
    }

    try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const pageNum: number = parseInt(value.page, 10) || 1;
    const limitNum: number = parseInt(value.limit, 10) || 10;

    const result = await services.userServices.listUsers(
      pageNum,
      limitNum,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      value.organization
    );
    if (result.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result.data);
      return;
    } else {
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        result.errorMessage
      );
      return;
    }
  } catch (error) {
    const err = error as Error;
    errorLog(methodName, err.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      err.message
    );
    return;
  }
}

/**
 * Lists a specific user by their unique ID.
 *
 * @param {Request} req - The Express request object containing the user ID to be searched for.
 * @param {Response} res - The Express response object used to send the response back to the client.
 * @returns {Promise<void>} - A promise that resolves when the user details are returned.
 *
 * @throws {Error} - Throws an error if the user search process fails at any step.
 */
async function listUserById(req: Request, res: Response): Promise<void> {
  const methodName = "List user by ID";
  try {
    const { id: userId } = req.params;

    const { error, value } = listUserByIdSchema.validate(req.query, {
      abortEarly: true,
    });

    if (error) {
      const errorMessages = requestErrorMessages(error);
      errorLog(methodName, "Request validation failed");
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        errorMessages
      );
      return;
    }

    const result = await services.userServices.listUserById(
      userId,
      value.organization
    );
    if (result.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result.data);
      return;
    } else {
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        result.errorMessage
      );
      return;
    }
  } catch (error) {
    const err = error as Error;
    errorLog(methodName, err.message);
    errorResponse(res, constants.FAILED, constants.FAILED_MESSAGE, err.message);
    return;
  }
}

/**
 * Exports user data to an Excel file based on the provided filters and search criteria.
 * The function validates the request parameters, retrieves the filtered user data,
 * and generates an Excel file containing the user information.
 *
 * @param {Request} req - The Express request object containing query parameters for filtering and sorting.
 * @param {Response} res - The Express response object used to send the Excel file.
 * @returns {Promise<void>} - A promise that resolves when the export process is complete.
 *
 * @throws {Error} - Throws an error if the export process fails at any step.
 */
async function exportUsers(req: Request, res: Response): Promise<void> {
  const methodName = "Export user";
  try {
    const value = await validateRequest(req, exportUserSchema, "", res, "GET");

    if (!value) {
      return;
    }

    let parsedFilters: Record<string, any> = {};

    if(!value){
      return;
    }

    try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }
    const userId = req.headers['x-user-id'] as string;

    const result = await services.userServices.exportUsers(
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      value.organization,
      value.timezone,
      userId
    );

    if (result.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, await generateExcelBase64(result?.data?.users,'Users'));
      return;
    } else {
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        result.errorMessage
      );
      return;
    }
  } catch (error) {
    const err = error as Error;
    errorLog(methodName, err.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      err.message
    );
    return;
  }
}

export { createUser, updateUser, listUsers, listUserById, exportUsers };
