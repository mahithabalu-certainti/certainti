import { ClientSecretCredential } from "@azure/identity";
import {constants} from "../utils/constant"
import {Request, Response, NextFunction} from 'express';
import { initSequelize } from "../config/dataSource";
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

const checkUserStatusMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
      const userId = req.headers['x_user_id'] as string;
      console.log("Request Headers: ", req.headers);
      
      if (!userId) {
          // res.status(constants.BAD_REQUEST).json({
          //     error: constants.BAD_REQUEST_MESSAGE,
          //     message: 'User ID is required in headers'
          // });
          // return;
          req.headers['x_user_id'] = '00747102-7e96-4274-a8d8-a9ef7e262b68';
      }
      
      const sequelize = await initSequelize()
      // Use raw query instead of Sequelize model
      const users = await sequelize.query(
          `SELECT status, rid, email FROM public."user" WHERE rid = :userId LIMIT 1`,
          {
              replacements: { userId },
              type: 'SELECT'
          }
      );
      
      // Get the first user from the array
      const user = users[0];
      
      if (typeof user === 'object' && user !== null && 'status' in user && (user as { status: string }).status !== 'active') {
          res.status(constants.FORBIDDEN).json({
              error: constants.FORBIDDEN_MESSAGE,
              message: 'User account is inactive. Please contact administrator.'
          });
          return;
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

export { getAzureB2CToken, checkUserStatusMiddleware };
