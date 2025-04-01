import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import { IEmailMessage } from "../utils/types";
import configurations from "../config/config";

const logger = configurations.getInstance().getLogger();

/**
 * Sends an email message using the Microsoft Graph API.
 * 
 * This function initializes a Microsoft Graph client using the provided client credentials and sends an email 
 * using the `/sendMail` endpoint of the Microsoft Graph API. It takes an `emailMessage` object containing 
 * the details of the email to be sent, such as the recipient, subject, and body.
 * 
 * @param {Object} emailMessage - The email message object containing the email details.
 * @param {IEmailMessage} emailMessage.message - The email message details including recipient, subject, body, etc.
 * 
 * @returns {Promise<any>} - A promise that resolves with the response from the Graph API if the email is sent 
 * successfully, or throws an error if the request fails.
 * 
 * @throws {Error} - If there is an error in sending the email, the error is thrown with the error message.
 */
export async function sendEmail(emailMessage: {
  message: IEmailMessage;
}): Promise<any> {
  const credential = new ClientSecretCredential(
    process.env.MAIL_TENANT_ID!,
    process.env.MAIL_CLIENT_ID!,
    process.env.MAIL_CLIENT_SECRET!
  );

  const graphClient = Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async (): Promise<string> => {
        const tokenResponse = await credential.getToken(
          "https://graph.microsoft.com/.default"
        );
        return tokenResponse.token;
      },
    },
  });

  try {
    const response = await graphClient
      .api(`/users/${process.env.EMAIL_FROM}/sendMail`)
      .post(emailMessage);

    logger.info("Success log: ", {
      timestamp: new Date().toISOString(),
      method: "send mail",
    });

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
