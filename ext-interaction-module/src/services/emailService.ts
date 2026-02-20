import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import { IEmailMessage } from "../utils/types";
import { initMainDbSequelize } from "../config/mainDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../utils/constants";
import { decryptClientSecret } from "../utils/helpers";
import { initOrgSequelize } from "../config/orgDataSource";

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
}, account_rid : string): Promise<any> {
  const mainDb = await initMainDbSequelize();
  const orgDb = await initOrgSequelize();
  let parentRid;
  let fetchParent: any = await mainDb.query(await rawQueries.fetchParentAccount(account_rid, mainDb));
  if(fetchParent[0][0].is_parent === true) parentRid = fetchParent[0][0].rid
  else parentRid = fetchParent[0][0].parent_account_rid
  const parentAccountForSettings : any = await mainDb.query(rawQueries.getAccountDetails(parentRid));
  let schemaForSetting = rawQueries.fetchSchemaName(parentAccountForSettings[0][0].r_number);
  const fetchExistingSettings: any = await rawQueries.fetchSettings(schemaForSetting,orgDb,parentRid);
  const existingSettings = fetchExistingSettings[0];

  if(existingSettings.email === null) {
    return {
      status : HttpStatus.NOT_FOUND_MESSAGE,
      data : null
    }
  }

  const credential = new ClientSecretCredential(
    existingSettings.tenant_id,
    existingSettings.client_id,
    existingSettings.client_secret
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
      .api(`/users/${existingSettings.email}/sendMail`)
      .post(emailMessage);

    return {
      status : HttpStatus.SUCCESS,
      data : response
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

async function fetchPlatFormCredentials() {
  const mainSequilze = await initMainDbSequelize();

  const platformCredentials: any = await mainSequilze.query(
    rawQueries.getOrganizationLicensesQuery(),
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
