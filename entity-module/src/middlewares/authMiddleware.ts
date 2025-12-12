import {Request, Response, NextFunction} from 'express';
import { HttpStatus } from '../utils/constants';
import { initMainDbSequelize } from '../config/mainDataSource';
import {constants} from "../utils/constants";
import { v4 as uuidv4 } from 'uuid';
import { errorLog } from '../utils/helpers';

const authMiddleware = (req: Request, res: Response, next: NextFunction):void => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(!token) {
        res.status(HttpStatus.UNAUTHORIZED).json({
            error: HttpStatus.UNAUTHORIZED_MESSAGE,
            message : 'Invalid token'
        })

        return;
    }

    next();
}

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
        res.status(HttpStatus.BAD_REQUEST).json({
          error: HttpStatus.BAD_REQUEST_MESSAGE,
          message: 'User ID is required in headers'
        });
        return;
      }
  
      const sequelize = await initMainDbSequelize();
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
            res.status(HttpStatus.FORBIDDEN).json({
                error: HttpStatus.FORBIDDEN_MESSAGE,
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
            res.status(HttpStatus.UNAUTHORIZED).json({
              error: HttpStatus.UNAUTHORIZED_MESSAGE,
              message: "Access Restricted. Contact administrator to gain access"
            });
            return;
          }
        }
        // const accountrid = req.headers['x-account-id'] as string;
        // if (!accountrid) {
        //   res.status(HttpStatus.BAD_REQUEST).json({
        //     error: HttpStatus.BAD_REQUEST_MESSAGE,
        //     message: "Account ID is required in headers"
        //   });
        //   return;
        // }
        // const isActiveAccount = await checkAccountStatus(accountrid, sequelize);

        // if (!isActiveAccount) {
        //   res.status(HttpStatus.FORBIDDEN).json({
        //     error: HttpStatus.FORBIDDEN_MESSAGE,
        //     message: "Account is inactive. Please contact administrator."
        //   });
        //   return;
        // }
        next();
    } catch (error) {
       errorLog('Error checking user status:', (error as Error).message);
        res.status(HttpStatus.FAILED).json({
            error: HttpStatus.FAILED_MESSAGE,
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
    const sequelize = await initMainDbSequelize();
  
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

  // Function to Check Account Status
async function checkAccountStatus(rid: string, sequelize: any): Promise<boolean> {
  const accountRecords = await sequelize.query(
    constants.SQL_GET_ACCOUNT,
    {
      replacements: { rid },
      type: constants.SELECT
    }
  ) as Array<{ rid: string, status: string }>;

  const account = accountRecords[0];
  return account ? account.status === 'active' : false;
}

export { authMiddleware, checkUserStatusMiddleware};