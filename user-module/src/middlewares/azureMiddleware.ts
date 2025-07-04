import { ClientSecretCredential } from "@azure/identity";
import {constants} from "../utils/constant"
import {Request, Response, NextFunction} from 'express';
import { initSequelize } from "../config/dataSource";
import { v4 as uuidv4 } from 'uuid';
/**
 * Retrieves an access token for Azure AD B2C using client credentials.
 *
 * @returns {Promise<string>} - Returns the access token as a string.
 * @throws {Error} - Throws an error if token retrieval fails.
 */
const getAzureB2CToken = async (): Promise<string> => {
  const tenantId = process.env.AZURE_B2C_TENANT_ID;
  const clientId = process.env.AZURE_B2C_CLIENT_ID;
  const clientSecret = process.env.AZURE_B2C_CLIENT_SECRET;
  const scope = process.env.AZURE_SCOPE;

  if (!tenantId || !clientId || !clientSecret || !scope) {
    throw new Error("Missing required environment variables");
  }

  try {
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    );
    const tokenResponse = await credential.getToken(scope);
    return tokenResponse.token;
  } catch (error: any) {
    throw new Error("Failed to retrieve Azure B2C token: " + error.message);
  }
};

const checkUserStatusMiddleware = (permissionName?: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const azureId = req.headers['x-azure-id'] as string;
    const userIdHeader = req.headers['x-user-id'] as string;
    let userId: string | undefined;
    let whereClause: string;
    if (azureId) {
      userId = azureId;
      whereClause = 'azure_id = :userId';
    } else if (userIdHeader) {
      userId = userIdHeader;
      whereClause = '"user".rid = :userId';
    } else {
      res.status(constants.BAD_REQUEST).json({
        error: constants.BAD_REQUEST_MESSAGE,
        message: 'User ID is required in headers'
      });
      return;
    }

    const sequelize = await initSequelize();
    const users = await sequelize.query(
      constants.SQL_GET_USER.replace("{whereClause}", whereClause),
      {
        replacements: { userId },
        type: constants.SELECT
      }
    ) as Array<{ status: string; rid: string; email: string; profile_rid: string }>;      
      // Get the first user from the array
      const user = users[0];
      
      if ((typeof user === 'object' && user !== null && 'status' in user && (user as { status: string }).status !== 'active')||!user) {
          res.status(constants.FORBIDDEN).json({
              error: constants.FORBIDDEN_MESSAGE,
              message: 'User account is inactive. Please contact administrator.'
          });
          return;
      }

      if (permissionName  && permissionName !== "NA") {
        const hasPermission = await checkUserAPIPermission(
          user.rid,
          user.profile_rid,
          permissionName,
          req.originalUrl
        );
        if (!hasPermission) {
          res.status(constants.UNAUTHORIZED).json({
            error: constants.UNAUTHORIZED_MESSAGE,
            message: "Access Restricted. Contact administrator to gain access"
          });
          return;
        }
      }
      
      next();
  } catch (error) {
      console.error('Error checking user status:', error);
      res.status(constants.FAILED).json({
          error: constants.FAILED_MESSAGE,
          message: 'Failed to verify user status'
      });
  }
}
}

const checkUserAPIPermission = async (
  userId: string,
  profileId: string,
  permissionName: string,
  apiEndpoint: string
): Promise<boolean> => {
  const sequelize = await initSequelize();

  // Get permissionId from module_permission table
  const permissionResult = await sequelize.query(
    constants.SQL_GET_PERMISSION,
    {
      replacements: { permissionName },
      type: constants.SELECT
    }
  ) as Array<{ rid: string }>;
  if (!permissionResult.length) return false;

  const permissionId = permissionResult[0].rid;

  // Check enable status for profile access
  const profileAccessResult = await sequelize.query(
    constants.SQL_GET_PROFILE_ACCESS,
    {
      replacements: { profileId, permissionId },
      type: constants.SELECT
    }
  ) as Array<{ is_enabled: boolean }>;

  // Check enable status for user access
  const userAccessResult = await sequelize.query(
    constants.SQL_GET_USER_ACCESS,
    {
      replacements: { userId, permissionId },
      type: constants.SELECT
    }
  ) as Array<{ is_enabled: boolean }>;

  const isEnabled =
    (profileAccessResult.length && profileAccessResult[0].is_enabled) ||
    (userAccessResult.length && userAccessResult[0].is_enabled);

  // If not enabled, log denial
  if (!isEnabled) {
    await sequelize.query(
      constants.SQL_INSERT_API_DENIAL,
      {
        replacements: { rid: uuidv4(), userId, permissionId, permissionName, apiEndpoint },
        type: constants.INSERT
      }
    );
  }
  return !!isEnabled;
};

export { getAzureB2CToken, checkUserStatusMiddleware };
