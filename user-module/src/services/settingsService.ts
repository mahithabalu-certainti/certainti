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
    await org.update(settingsData);

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
        "assessment_methodology",
        "auto_send_four_part_assessment",
        "auto_send_interaction",
        "auto_access_rd",
        "rid"
      ],
    });

    if (!org) {
      return {
        statusCode: constants.NOT_FOUND,
        message: statusMessage.orgNotFound,
        errorMessage: statusMessage.orgNotFoundError,
      };
    }

    return {
      statusCode: constants.SUCCESS,
      message: statusMessage.orgRetrieved,
      data: {
        settings: org,
      },
    };
  }
}

export default SettingsService;
