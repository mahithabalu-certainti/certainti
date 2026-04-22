import { Request, Response } from "express";
import { constants } from "../utils/constant";
import configurations from "../config/config";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  validateRequest,
  generateExcelBase64,
} from "../utils/helpers";
import {
  assignUserToAccountSchema,
  assignUserToProjectSchema,
  createUserGroupSchema,
  exportUserGroupSchema,
  listAccountUserSchema,
  listActiveUserGroupSchema,
  listProjectOfAccountSchema,
  listProjectUserGroupSchema,
  listUserGroupSchema,
  listUserGroupTypeSchema,
  listUserGroupUserSchema,
  updateUserGroupSchema,
} from "../lib/joi/schemas/schema";

const logger = configurations.getInstance().getLogger();
const services = configurations.getInstance().getServices();

/**
 * Creates a new user group with the provided details
 *
 * @param {Request} req - Express request object containing group details in the body
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise representing the completion of the operation
 */
async function createUserGroup(req: Request, res: Response): Promise<void> {
  const methodName = "Create User Group";
  try {
    const validatedData = await validateRequest(
      req,
      createUserGroupSchema,
      "",
      res,
      "POST"
    );

    // If validation fails, validateRequest will handle the response
    if (!validatedData) return;

    // Use the validated data instead of req.body
    const {
      group_name,
      users,
      accounts,
      status_rid,
      is_consultant_only_group,
      projects,
      group_type_rid,
    } = validatedData;

    // Get user ID from request (assuming it's set by auth middleware)
    const userId = (req.headers["x-user-id"] as string) || "";

    const result = await services.userGroupService.createUserGroup(
      {
        group_name,
        users,
        accounts,
        projects,
        status_rid,
        is_consultant_only_group,
        group_type_rid,
      },
      userId
    );

    if (result.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result.data);
    } else {
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        result.errorMessage
      );
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
  }
}

/**
 * Updates an existing user group with the provided details
 *
 * @param {Request} req - Express request object containing updated group details in the body
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise representing the completion of the operation
 */
async function updateUserGroup(req: Request, res: Response): Promise<void> {
  const methodName = "Update User Group";
  try {
    const validatedData = await validateRequest(
      req,
      updateUserGroupSchema,
      "ENV_TRD365",
      res,
      "POST"
    );

    // If validation fails, validateRequest will handle the response
    if (!validatedData) return;

    // Use the validated data instead of req.body
    const {
      group_name,
      users,
      accounts,
      group_rid,
      status_rid,
      is_consultant_only_group,
      projects,
    } = validatedData;

    // Get user ID from request (assuming it's set by auth middleware)
    const userId = (req.headers["x-user-id"] as string) || "";

    const result = await services.userGroupService.updateUserGroup(
      {
        group_name,
        users,
        accounts,
        projects,
        group_rid,
        status_rid,
        is_consultant_only_group,
      },
      userId
    );

    if (result.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result.data);
    } else {
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        result.errorMessage
      );
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
  }
}

/**
 * Retrieves a list of active users that can be added to a group
 *
 * @param {Request} req - Express request object containing filter parameters
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise representing the completion of the operation
 */
async function getActiveUsersForGrouping(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "List Active Users For Grouping";
  try {
    const validatedData = await validateRequest(
      req,
      listActiveUserGroupSchema,
      "",
      res,
      "POST"
    );
    // If validation fails, validateRequest will handle the response
    if (!validatedData) return;
    if (!validatedData) return;
    let parsedFilters: Record<string, any> = {};

    try {
      parsedFilters = validatedData.filters;
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const {
      is_consultant_only_group,
      account_rid,
      group_rid,
      sortBy,
      sortOrder,
    } = validatedData;
    let account;
    if (!group_rid) {
      account = await services.userGroupService.getActiveUsersForGrouping(
        is_consultant_only_group,
        account_rid,
        validatedData.page,
        validatedData.limit,
        sortBy,
        sortOrder,
        parsedFilters
      );
    } else {
      account = await services.userGroupService.getActiveUsersForUpdate(
        is_consultant_only_group,
        account_rid,
        group_rid,
        validatedData.page,
        validatedData.limit,
        sortBy,
        sortOrder,
        parsedFilters
      );
    }

    if (account.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, account.data);
    } else {
      errorLog(methodName, account.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        account.errorMessage
      );
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Retrieves all users associated with a specific account
 *
 * @param {Request} req - Express request object containing account ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise representing the completion of the operation
 */
async function getAccountUsers(req: Request<{accountid : string}>, res: Response): Promise<void> {
  const methodName = "List Account Users";
  try {
    const validatedData = await validateRequest(
      req,
      listAccountUserSchema,
      "",
      res,
      "GET"
    );
    // If validation fails, validateRequest will handle the response
    if (!validatedData) return;
    let parsedFilters: Record<string, any> = {};

    try {
      parsedFilters = JSON.parse(validatedData.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const account = await services.userGroupService.getAccountUsers(
      req.params.accountid,
      validatedData.project_rid,
      validatedData.entity_type,
      validatedData.page,
      validatedData.limit,
      validatedData.sortBy,
      validatedData.sortOrder,
      parsedFilters,
      validatedData.search
    );

    if (account.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, account?.data);
    } else {
      errorLog(methodName, account.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        account.errorMessage
      );
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Retrieves all users associated with a specific account
 *
 * @param {Request} req - Express request object containing account ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise representing the completion of the operation
 */
async function getProjectUsers(req: Request, res: Response): Promise<void> {
  const methodName = "List Project Users";
  try {
    const validatedData = await validateRequest(
      req,
      listProjectUserGroupSchema,
      "",
      res,
      "GET"
    );
    // If validation fails, validateRequest will handle the response
    if (!validatedData) return;
    let parsedFilters: Record<string, any> = {};

    try {
      parsedFilters = JSON.parse(validatedData.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const page: number = parseInt(validatedData.page, 10) || 1;
    const limit: number = parseInt(validatedData.limit, 10) || 10;
    const projectUsers =
      await services.userGroupService.getProjectsWithUserAccessFlag(
        validatedData.access_type,
        validatedData.account_rid,
        validatedData.entity_rid,
        page,
        limit,
        parsedFilters,
        validatedData.sortBy,
        validatedData.sortOrder
      );

    if (projectUsers.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, projectUsers.data);
    } else {
      errorLog(methodName, projectUsers.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        projectUsers.errorMessage
      );
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Retrieves all users associated with a specific account
 *
 * @param {Request} req - Express request object containing account ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise representing the completion of the operation
 */
async function getProjectOfAccounts(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "List Project Of Accounts";
  try {
    const validatedData = await validateRequest(
      req,
      listProjectOfAccountSchema,
      "",
      res,
      "POST"
    );
    // If validation fails, validateRequest will handle the response
    if (!validatedData) return;
    let parsedFilters: Record<string, any> = {};

    try {
      parsedFilters = validatedData.filters;
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const projectUsers =
      await services.userGroupService.getProjectsOfSelectedAccounts(
        validatedData.account_rid,
        validatedData?.group_rid,
        validatedData.page,
        validatedData.limit,
        parsedFilters,
        validatedData.sortBy,
        validatedData.sortOrder
      );

    if (projectUsers.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, projectUsers.data);
    } else {
      errorLog(methodName, projectUsers.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        projectUsers.errorMessage
      );
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Retrieves all groups associated with a specific account
 *
 * @param {Request} req - Express request object containing account ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise representing the completion of the operation
 */
async function getAccountGroups(req: Request<{accountid : string}>, res: Response): Promise<void> {
  const methodName = "List Account Groups";
  try {
    const validatedData = await validateRequest(
      req,
      listAccountUserSchema,
      "",
      res,
      "GET"
    );
    // If validation fails, validateRequest will handle the response
    if (!validatedData) return;
    let parsedFilters: Record<string, any> = {};
    try {
      parsedFilters = JSON.parse(validatedData.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const account = await services.userGroupService.getAccountGroups(
      req.params.accountid,
      validatedData.page,
      validatedData.limit,
      validatedData.sortBy,
      validatedData.sortOrder,
      parsedFilters,
      validatedData.search
    );

    if (account.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, account.data);
    } else {
      errorLog(methodName, account.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        account.errorMessage
      );
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Retrieves a paginated list of user groups with optional filtering, sorting and searching
 *
 * @param {Request} req - Express request object containing query parameters
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise representing the completion of the operation
 */
async function listUserGroup(req: Request, res: Response): Promise<void> {
  const methodName = "List User Group";
  try {
    const validatedData = await validateRequest(
      req,
      listUserGroupSchema,
      "",
      res,
      "GET"
    );

    // If validation fails, validateRequest will handle the response
    if (!validatedData) return;

    let parsedFilters: Record<string, any> = {};

    try {
      parsedFilters = JSON.parse(validatedData.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const page: number = parseInt(validatedData.page, 10) || 1;
    const limit: number = parseInt(validatedData.limit, 10) || 10;
    const userId = (req.headers["x-user-id"] as string) || "";
    const result = await services.userGroupService.listUserGroup(
      page,
      limit,
      parsedFilters,
      userId,
      validatedData.sortBy,
      validatedData.sortOrder,
      validatedData.search
    );

    if (result.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result.data);
    } else {
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        result.errorMessage
      );
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
  }
}

/**
 * Expots a  list of user groups with optional filtering, sorting and searching
 *
 * @param {Request} req - Express request object containing query parameters
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise representing the completion of the operation
 */
async function exportUserGroup(req: Request, res: Response): Promise<void> {
  const methodName = "Export User Group";
  try {
    const validatedData = await validateRequest(
      req,
      exportUserGroupSchema,
      "",
      res,
      "GET"
    );

    // If validation fails, validateRequest will handle the response
    if (!validatedData) return;

    let parsedFilters: Record<string, any> = {};
    const userId = (req.headers["x-user-id"] as string) || "";

    try {
      parsedFilters = JSON.parse(validatedData.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const result = await services.userGroupService.exportUserGroup(
      parsedFilters,
      validatedData.sortBy,
      validatedData.sortOrder,
      validatedData.timezone,
      userId,
      validatedData.search
    );

    if (result.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(
        res,
        await generateExcelBase64(result.data?.usergroup, "User Group")
      );
    } else {
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        result.errorMessage
      );
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
  }
}

/**
 * Retrieves details of a specific user group by its ID
 *
 * @param {Request} req - Express request object containing group ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise representing the completion of the operation
 */
async function listGroupDetailsById(
  req: Request<{groupId : string}>,
  res: Response
): Promise<void> {
  const methodName = "List User Group Details By Id";
  try {
    const { groupId } = req.params;
    const account = await services.userGroupService.listUserGroupDetailsById(
      groupId
    );
    // const account = await services.userGroupService.listUserGroupById(id);

    if (account.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, account?.data);
    } else {
      errorLog(methodName, account.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        account.errorMessage
      );
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Assigns or revokes account access for a user or group
 *
 * @param {Request} req - Express request object containing access details in body
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise representing the completion of the operation
 */
async function assignEntityAccessToAccount(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Assign Entity Access To Account";
  try {
    const validatedData = await validateRequest(
      req,
      assignUserToAccountSchema,
      "",
      res,
      "POST"
    );

    // If validation fails, validateRequest will handle the response
    if (!validatedData) return;

    // Use the validated data instead of req.body
    const {
      users,
      account_rid,
      groups,
      access_type,
      entity_type,
      project_rid,
    } = validatedData;

    // Get user ID from request (assuming it's set by auth middleware)
    const userId = (req.headers["x-user-id"] as string) || "";

    let result;

    if (access_type === "USER") {
      result = await services.userGroupService.assignUserAccessToAccount({
        users,
        account_rid,
        userId,
        entity_type,
        project_rid,
      });
    }
    if (access_type === "GROUP") {
      result = await services.userGroupService.assignGroupAccessToAccount({
        groups,
        account_rid,
        userId,
        entity_type,
        project_rid,
      });
    }

    if (result?.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result?.data);
    } else {
      errorLog(methodName, result?.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        result?.errorMessage
      );
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
  }
}

/**
 * Assigns or updates project access permissions for a user or group
 *
 * @param {Request} req - Express request object containing project access details in body
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise representing the completion of the operation
 */
async function assignEntityAccessToProject(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Update Entity Access To Project";
  try {
    const validatedData = await validateRequest(
      req,
      assignUserToProjectSchema,
      "",
      res,
      "POST"
    );

    // If validation fails, validateRequest will handle the response
    if (!validatedData) return;

    // Use the validated data instead of req.body
    const { user_rid, projects, group_rid } = validatedData;

    // Get user ID from request (assuming it's set by auth middleware)
    const userId = (req.headers["x-user-id"] as string) || "";

    const result = await services.userGroupService.assignEntityAccessToProjects(
      {
        user_rid,
        group_rid,
        projects,
        userId,
      }
    );

    if (result.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result?.data);
    } else {
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        result.errorMessage
      );
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
  }
}

/**
 * Handles the request to retrieve user group types based on a provided type filter.
 *
 * @param {Request} req The HTTP request object containing query parameters for validation.
 * @param {Response} res The HTTP response object used to send the response.
 * @returns {Promise<void>} A promise that resolves when the request has been processed.
 *
 * This function performs the following steps:
 * - Validates the incoming request against `listUserGroupTypeSchema`.
 * - Calls the `getUserGroupType` service with the validated type parameter.
 * - Sends a success response with the group types if the service call succeeds.
 * - Logs and returns an error response if validation or the service call fails.
 */
async function getUserGroupType(req: Request, res: Response): Promise<void> {
  const methodName = "List User Group Type";
  try {
    const validatedData = await validateRequest(
      req,
      listUserGroupTypeSchema,
      "",
      res,
      "GET"
    );
    const groupTypes = await services.userGroupService.getUserGroupType(
      validatedData?.type
    );
    if (groupTypes.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, groupTypes.data);
      return;
    } else {
      errorLog(methodName, groupTypes.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        groupTypes.message
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Handles the request to list users belonging to a specific user group within an account.
 *
 * @param {Request} req The HTTP request object containing path parameters and query filters.
 * @param {Response} res The HTTP response object used to send the results or errors.
 * @returns {Promise<void>} A promise that resolves when the request processing is complete.
 *
 * This function performs the following steps:
 * - Extracts `accountid` and `userGroupId` from the request parameters.
 * - Validates the incoming request against `listUserGroupUserSchema`.
 * - Parses optional filter criteria from the `filters` query parameter.
 * - Calls the `getUserGroupUsers` service with pagination, filtering, and search inputs.
 * - Sends a success response with the list of users if the service call succeeds.
 * - Logs and returns an error response if validation or the service call fails.
 * - Handles malformed filter JSON gracefully by logging an error without breaking the flow.
 */
async function listUserGroupUser(req: Request<{accountid : string, userGroupId: string}>, res: Response): Promise<void> {
  const methodName = "List User Group User";
  try {
    const { accountid, userGroupId } = req.params;

    const validatedData = await validateRequest(
      req,
      listUserGroupUserSchema,
      "",
      res,
      "GET"
    );

    if (!validatedData) return;
    let parsedFilters: Record<string, any> = {};

    try {
      parsedFilters = JSON.parse(validatedData.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const groupTypes = await services.userGroupService.getUserGroupUsers(
      accountid,
      userGroupId,
      validatedData,
      parsedFilters,
      validatedData.search
    );
    if (groupTypes.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, groupTypes.data);
      return;
    } else {
      errorLog(methodName, groupTypes.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        groupTypes.message
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}

export {
  createUserGroup,
  updateUserGroup,
  getActiveUsersForGrouping,
  listUserGroup,
  exportUserGroup,
  listGroupDetailsById,
  getAccountUsers,
  getProjectUsers,
  getAccountGroups,
  assignEntityAccessToAccount,
  assignEntityAccessToProject,
  getUserGroupType,
  getProjectOfAccounts,
  listUserGroupUser,
};
