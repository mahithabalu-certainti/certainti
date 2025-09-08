
import { OrganizationLicenses } from "../models/organisationLicense";
import { constants, statusMessage } from "../utils/constant";
class SettingsService {
  async updateSettings(userId: string, settingsData: any): Promise<any> {
    // Logic to update settings for a user
    const org = await OrganizationLicenses.findOne({ where: { rid: settingsData.rid } });
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
  async listSettings(userId: string):  Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { settings: any;};
  }> {
     const org = await OrganizationLicenses.findOne({
             attributes: ["auto_send_interaction", "auto_access_rd", "email","rid"],
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
