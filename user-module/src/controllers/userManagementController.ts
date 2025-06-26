import { Request, Response } from "express";
import { constants } from "../utils/constant";
import { errorResponse, successResponse } from "../utils/apiResponse";
import configurations from "../config/config";
import { ParsedQs } from "qs";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  validateRequest,
  generateExcelBase64
} from "../utils/helpers";

import {
  userPermissionByIdSchema,
  createProfileSchema,
  getProfilePermissionsSchema,
  updateProfilePermissionsSchema,
  editProfilePermissionsSchema,
  updateUserExtendedPermissionsSchema,
  listProfileSchema
} from "../lib/joi/schemas/schema";

const logger = configurations.getInstance().getLogger();
const services = configurations.getInstance().getServices();

/**
 * Fetches the user roles from the service and returns them in the response.
 * Logs success or failure depending on the outcome.
 *
 * @param {Request} req - The Express request object containing any necessary request data.
 * @param {Response} res - The Express response object used to send the response back to the client.
 * @returns {Promise<void>} - A promise that resolves when the user roles are fetched and the response is sent.
 *
 * @throws {Error} - Throws an error if the request to fetch roles fails at any step.
 */
async function userRoles(req: Request, res: Response): Promise<void> {
  const methodName = "User roles";
  try {
    const roles = await services.userServices.roles();

    if (roles.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, roles.data);
    } else {
      errorLog(methodName, roles.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        roles.errorMessage
      );
    }
  } catch (error) {
    const err = error as Error;
    errorLog(methodName, err.message);
    handleErrorResponse(res, constants.FAILED, constants.FAILED_MESSAGE, err.message);
  }
}

/**
 * Fetches the user profiles from the service with pagination, filtering, and sorting options.
 * Logs success or failure depending on the outcome.
 *
 * @param {Request} req - The Express request object containing query parameters for filtering and pagination.
 * @param {Response} res - The Express response object used to send the response back to the client.
 * @returns {Promise<void>} - A promise that resolves when the user profiles are fetched and the response is sent.
 *
 * @throws {Error} - Throws an error if the request to fetch profiles fails at any step.
 */
async function userProfiles(req: Request, res: Response): Promise<void> {
  const methodName = "User profiles";
  try {
        // Check if no query parameters are provided
        const hasNoQueryParams = !req.query.page && !req.query.limit && !req.query.filters && !req.query.sortBy && !req.query.sortOrder;
    
        if (hasNoQueryParams) {
          // If no parameters provided, get all profiles
          const allProfiles = await services.userManagementServices.getAllProfiles();
          
          if (allProfiles.statusCode === constants.SUCCESS) {
            successLog(methodName);
            handleSuccessResponse(res, allProfiles.data);
            return;
          } else {
            errorLog(methodName, allProfiles.errorMessage);
            handleErrorResponse(
              res,
              constants.BAD_REQUEST,
              constants.BAD_REQUEST_MESSAGE,
              allProfiles.errorMessage
            );
            return;
          }
        }
        
        // Continue with existing validation and pagination logic for when parameters are provided
    const value = await validateRequest(req, listProfileSchema,"ENV_TRD365", res, "GET");

    let parsedFilters: Record<string, any> = {};

    if (!value) {
      return;
    }

    try {
      if (value.filters) {
        parsedFilters = JSON.parse(value.filters);
      }
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const pageNum: number = parseInt(value.page, 10) || 1;
    const limitNum: number = parseInt(value.limit, 10) || 10;

    const profilesList = await services.userManagementServices.profilesList(
      pageNum,
      limitNum,
      parsedFilters,
      value.sortBy,
      value.sortOrder
    );

    if (profilesList.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, profilesList.data);
      return;
    } else {
      errorLog(methodName, profilesList.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        profilesList.errorMessage
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

// ... existing code ...
async function userPermissionFields(req: Request, res: Response): Promise<void> {
  const methodName = "User permission fields";
  try {
    const userId: string = req.params.userId;
    let permissionIds = req.query.id;

    if (!userId || !permissionIds) {
      errorLog(methodName, "userId and permission ids are required");
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "userId and permission ids are required"
      );
      return;
    }

    if (typeof permissionIds === "string") {
      permissionIds = permissionIds.split(",");
    } else {
      permissionIds = [];
    }

    // Ensure permissionIds is string[]
    const permissionIdsArr: string[] = (permissionIds as Array<string | ParsedQs>)
      .map(id => typeof id === "string" ? id : String(id));

    const result = await services.userServices.getPermissionFieldsByIds(userId, permissionIdsArr);

    successLog(methodName);
    handleSuccessResponse(res, result);
  } catch (err: any) {
    errorLog("User permission fields", err.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      err.message
    );
  }
}
// ... existing code ...
async function userPermissionById(req: Request, res: Response): Promise<void> {
  const methodName = "User permission by ID";
  try {
    const validatedData = await validateRequest(
      req,
      userPermissionByIdSchema,
      "ENV_TRD365", // Or appropriate organization value
      res,
      "GET"
    );
    // If validation fails, validateRequest will handle the response
    if (!validatedData) return;
    
    const userAzureId = req.params.id;
    const userRole = await services.userServices.permissionById(userAzureId);
    if (userRole.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, userRole.data);
    } else {
      errorLog(methodName, userRole.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        userRole.errorMessage
      );
    }
  } catch (error) {
    console.log(error)
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
 * Creates a new profile with the provided details
 * Logs success or failure depending on the outcome.
 *
 * @param {Request} req - The Express request object containing profile data
 * @param {Response} res - The Express response object used to send the response back to the client
 * @returns {Promise<void>} - A promise that resolves when the profile is created and the response is sent
 */
async function createProfile(req: Request, res: Response): Promise<void> {
  const methodName = "Create profile";
  try {
    const validatedData = await validateRequest(
      req,
      createProfileSchema,
      "ENV_TRD365",
      res,
      "POST"
    );
    
    // If validation fails, validateRequest will handle the response
    if (!validatedData) return;
    
    // Use the validated data instead of req.body
    const { source_profile_id, profile_name, profile_description, profile_type } = validatedData;
    
    // Get user ID from request (assuming it's set by auth middleware)
    const userId = req.headers["x-user-id"] as string || "";

    
    const result = await services.userManagementServices.createProfile({
      source_profile_id,
      profile_name,
      profile_description,
      profile_type
    }, userId);
    
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
 * Retrieves profile permissions based on profile ID and optional type and ID filters
 * 
 * @param {Request} req - Express request object containing profile ID and optional filters
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Returns permissions data based on filters
 */
async function getProfilePermissions(req: Request, res: Response): Promise<void> {
  const methodName = "Get profile permissions";
  try {
    const validatedData = await validateRequest(
      req,
      getProfilePermissionsSchema,
      "ENV_TRD365", // Or appropriate organization value
      res,
      "GET"
    );
    console.log("Validated Data:", validatedData);
    
    // If validation fails, validateRequest will handle the response
    if (!validatedData) return;
    
    const profileId = req.params.profileId;
    // Get type and id from validated data
    const { type, id } = validatedData;

    // Call service method to get permissions
    const result = await services.userManagementServices.getProfilePermissions({
      profileId,
      type: type as string,
      id: id as string
    });
    
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
 * Updates profile permissions based on the provided data
 * 
 * @param {Request} req - Express request object containing profile ID and permissions to update
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Returns updated profile data
 */
async function updateProfilePermissions(req: Request, res: Response): Promise<void> {
  const methodName = "Update profile permissions";
  try {
    // Validate request data
    const validatedData = await validateRequest(
      req,
      updateProfilePermissionsSchema,
      "ENV_TRD365", // Or appropriate organization value
      res,
      "POST"
    );
    // If validation fails, validateRequest will handle the response
    if (!validatedData) return;
    
    // Use the validated data instead of req.body
    const { profile_id, profile_name, privileges } = validatedData;
    
    // Get user ID from request (assuming it's set by auth middleware)
    const userId = req.headers["x-user-id"] as string || "";
    
    // Call service method to update permissions
    const result = await services.userManagementServices.updateProfilePermissions(
      profile_id,
      profile_name,
      privileges,
      userId,
      req.originalUrl // Pass "create" as the event name
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
 * Edits profile permissions based on the provided data
 * 
 * @param {Request} req - Express request object containing profile ID and permissions to update
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Returns updated profile data
 */
async function editProfilePermissions(req: Request, res: Response): Promise<void> {
  const methodName = "Edit profile permissions";
  try {
  // Validate request data
  const validatedData = await validateRequest(
    req,
    editProfilePermissionsSchema,
    "ENV_TRD365", // Or appropriate organization value
    res,
    "PUT"
  );
  
  // If validation fails, validateRequest will handle the response
  if (!validatedData) return;
  
  // Use the validated data instead of req.body
  const { profile_id, profile_name, privileges } = validatedData;
    
    // Get user ID from request (assuming it's set by auth middleware)
    const userId = req.headers["x-user-id"] as string || "";
    
    // Call service method to update permissions
    const result = await services.userManagementServices.updateProfilePermissions(
      profile_id,
      profile_name,
      privileges,
      userId,
      req.originalUrl // Pass "edit" as the event name
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
 * Edits profile permissions for specific user based on the provided data
 * 
 * @param {Request} req - Express request object containing profile ID and permissions to update
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Returns updated profile data
 */
async function updateUserExtendedPermissions(req: Request, res: Response): Promise<void> {
  const methodName = "Upate user extended profile permissions";
  try {
  // Validate request data
  const validatedData = await validateRequest(
    req,
    updateUserExtendedPermissionsSchema,
    "ENV_TRD365", // Or appropriate organization value
    res,
    "PUT"
  );
  
  // If validation fails, validateRequest will handle the response
  if (!validatedData) return;
  
  // Use the validated data instead of req.body
  const {user_id,privileges } = validatedData;
    
    // Get user ID from request (assuming it's set by auth middleware)
    const loggedInUsername = req.headers['x-user-id'] as string;
    // Call service method to update permissions
    const result = await services.userManagementServices.updateUserExtendedPermissions(
      privileges,
      user_id ,loggedInUsername
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
 * Returns profile permissions for specific user with profile permissions
 * 
 * @param {Request} req - Express request object containing profile ID and permissions to update
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Returns updated profile data
 */

async function getUserExtendedPermissions(req: Request, res: Response): Promise<void> {
  const methodName = "Get User extended permission";
  try {
    const userId = req.params.userId;
    const userExtendedPermsissions = await services.userServices.fetchUserExtendedpermission(userId);
    if (userExtendedPermsissions.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, userExtendedPermsissions.data);
    } else {
      errorLog(methodName, userExtendedPermsissions.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        userExtendedPermsissions.errorMessage
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
 * Fetches the user profiles from the service and returns them in the response for excel download.
 * Logs success or failure depending on the outcome.
 *
 * @param {Request} req - The Express request object containing any necessary request data.
 * @param {Response} res - The Express response object used to send the response back to the client.
 * @returns {Promise<void>} - A promise that resolves when the user profiles are fetched and the response is sent.
 *
 * @throws {Error} - Throws an error if the request to fetch profiles fails at any step.
 */
async function exportUserProfiles(req: Request, res: Response): Promise<void> {
  const methodName = "Export user profiles"
  try {
    //  const validatedData = await validateRequest(req, exportUserProfilesSchema,"ENV_TRD365", res, "GET");
    //   if (!validatedData) return;
    const profileId = req.params.profileId;
    const profiles = await services.userServices.exportUserprofiles(profileId);

    if (profiles.statusCode === constants.SUCCESS) {
      successLog(methodName)
      handleSuccessResponse(res, profiles?.data?.exportProfiles);
    } else {
      errorLog(methodName, profiles.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        profiles.errorMessage
      );
    }
  } catch (error) {
    const err = error as Error;
    errorLog(methodName, err.message);
    handleErrorResponse(res, constants.FAILED, constants.FAILED_MESSAGE, err.message);
  }
}


export { userProfiles, userRoles, userPermissionById, userPermissionFields, createProfile, getProfilePermissions, updateProfilePermissions, editProfilePermissions,exportUserProfiles,getUserExtendedPermissions,updateUserExtendedPermissions};
