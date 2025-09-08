
import { OrganizationLicenses } from "../models/organisationLicense";
import { constants } from "../utils/constant";
class SettingsService {
  async updateSettings(userId: string, settingsData: any): Promise<any> {
    // Logic to update settings for a user
    const org = await OrganizationLicenses.findOne({ where: { rid: settingsData.rid } });
    if (!org) {
        return {
            statusCode: constants.NOT_FOUND,
            message: "Organization not found",
            errorMessage: "No organization found with the given ID",
        };
    }

    await org.update(settingsData);

    return {
        statusCode: constants.SUCCESS,
        message: "Settings updated successfully",
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
             attributes: ["auto_send_interaction", "auto_access_rd","rid"],
           });
           if (!org) {
               return {
                   statusCode: constants.NOT_FOUND,
                   message: "Organization not found",
                   errorMessage: "No organization found with the given ID",
               };
           }

           return {
               statusCode: constants.SUCCESS,
               message: "Organization settings retrieved successfully",
               data: {
                   settings: org,
               },
           };
  }
}

export default SettingsService;
