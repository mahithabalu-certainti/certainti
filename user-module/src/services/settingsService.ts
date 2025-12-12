import { ClientSecretCredential } from "@azure/identity";
import { OrganizationLicenses } from "../models/organisationLicense";
import { constants, statusMessage } from "../utils/constant";
import { Client } from "@microsoft/microsoft-graph-client";
import { decryptClientSecret, encryptClientSecret } from "../utils/helpers";
class SettingsService {
  /**
 * Updates the organization settings based on provided data for a given user.
 *
 * @param {string} userId The ID of the user requesting the update.
 * @param {any} settingsData The settings data to update, including credentials and identifiers.
 * @returns {Promise<object>} A promise resolving to the result of the update operation, including status and updated settings.
 *
 * This method:
 * - Validates the existence of the organization using the provided `rid`.
 * - Optionally validates and creates a subscription if credentials are provided.
 * - Encrypts client secrets before saving them.
 * - Updates the organization record with new settings.
 * - Returns status and updated organization data, or error details if update fails.
 */
  async updateSettings(userId: string, settingsData: any): Promise<any> {
    // Logic to update settings for a user
    const org = await OrganizationLicenses.findOne({
      where: { rid: settingsData.rid },
    });
    if (!org) {
      return {
        statusCode: constants.NOT_FOUND,
        message: statusMessage.orgNotFound,
        errorMessage: statusMessage.orgNotFoundError,
      };
    }

    let subscriptionId = null;
    if (settingsData.client_secret && settingsData.email) {
      try {
        subscriptionId = await this.validateAndCreateSubscription(
          settingsData.tenant_id,
          settingsData.client_id,
          settingsData.client_secret,
          settingsData.email
        );
      } catch (err) {
        return {
          statusCode: constants.BAD_REQUEST,
          message: constants.BAD_REQUEST_MESSAGE,
          errorMessage: statusMessage.invaidCredentialsMessage,
        };
      }
    }

    if (subscriptionId) {
      const encryptedSecretKey = await encryptClientSecret(
        settingsData.client_secret
      );
      await org.update({
        ...settingsData,
        client_secret: encryptedSecretKey,
      });
    } else {
      await org.update(settingsData);
    }

    return {
      statusCode: constants.SUCCESS,
      message: statusMessage.orgUpdated,
      data: {
        settings: org,
      },
    };
  }

  /**
 * Retrieves the organization settings for a given user.
 *
 * @param {string} userId The ID of the user requesting the settings.
 * @returns {Promise<object>} A promise resolving to the organization settings, including decrypted client secret if available.
 *
 * This method:
 * - Fetches the organization settings from the database.
 * - Returns an error if the organization is not found.
 * - Decrypts the client secret before returning the settings.
 * - Provides status and data or error details accordingly.
 */
  async listSettings(userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { settings: any };
  }> {
    const org = await OrganizationLicenses.findOne({
      attributes: [
        "auto_send_interaction",
        "auto_access_rd",
        "email",
        "rid",
        "tenant_id",
        "client_id",
        "client_secret",
      ],
    });

    if (!org) {
      return {
        statusCode: constants.NOT_FOUND,
        message: statusMessage.orgNotFound,
        errorMessage: statusMessage.orgNotFoundError,
      };
    }

    if (org.client_secret) {
      const decryptSecret = await decryptClientSecret(org.client_secret);
      org.client_secret = decryptSecret;
    }

    return {
      statusCode: constants.SUCCESS,
      message: statusMessage.orgRetrieved,
      data: {
        settings: org,
      },
    };
  }

  private async validateAndCreateSubscription(
    tenantId: string,
    clientId: string,
    clientSecret: string,
    supportEmail: string
  ) {
    try {
      const graphClient = this.getGraphClient(tenantId, clientId, clientSecret);

      const subscription = await graphClient.api("/subscriptions").post({
        changeType: "created,updated",
        notificationUrl: process.env.EMAIL_WEBHOOK_URL,
        resource: `/users/${supportEmail}/mailFolders('Inbox')/messages`,
        expirationDateTime: new Date(
          Date.now() + 3600 * 1000 * 24
        ).toISOString(),
        clientState: "yourCustomValidationString",
      });

      return subscription?.id;
    } catch (error: any) {
      throw new Error("Invalid credentials or failed to create subscription.");
    }
  }

  private getGraphClient(
    tenantId: string,
    clientId: string,
    clientSecret: string
  ) {
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    );

    const graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken(
            "https://graph.microsoft.com/.default"
          );
          return token?.token || "";
        },
      },
    });

    return graphClient;
  }
}

export default SettingsService;
