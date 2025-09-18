import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import { IEmailMessage } from "../utils/types";
import { initMainDbSequelize } from "../config/mainDataSource";
import { MAIN_SCHEMA_NAME } from "../utils/constants";
import { decryptClientSecret } from "../utils/helpers";

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
  const { email, tenant_id, client_id, client_secret } =
    await fetchPlatFormCredentials();

  const credential = new ClientSecretCredential(
    tenant_id,
    client_id,
    client_secret
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
      .api(`/users/${email}/sendMail`)
      .post(emailMessage);

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

async function fetchPlatFormCredentials() {
  const mainSequilze = await initMainDbSequelize();

  const platformCredentials: any = await mainSequilze.query(
    `SELECT * from "${MAIN_SCHEMA_NAME}".organization_licenses`,
    {
      type: "SELECT",
    }
  );

  let decryptedSecret = "";
  if (platformCredentials && platformCredentials[0]?.client_secret) {
    decryptedSecret = await decryptClientSecret(
      platformCredentials[0]?.client_secret
    );
  }

  return {
    email: platformCredentials[0]?.email ?? null,
    tenant_id: platformCredentials[0]?.tenant_id ?? null,
    client_id: platformCredentials[0]?.client_id ?? null,
    client_secret: decryptedSecret ?? null,
  };
}
