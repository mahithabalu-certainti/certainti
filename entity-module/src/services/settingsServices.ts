import { Sequelize } from "sequelize";
import { initMainDbSequelize } from "../config/mainDataSource";
import { initOrgSequelize } from "../config/orgDataSource";
import {
  HttpStatus,
  rawQueries,
  STATUS_MESSAGE,
  UPDATE_FLAG,
} from "../utils/constants";
import ProjectIngestionService from "./projectIngestionService";
import { Logger } from "winston";
import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { decryptClientSecret, errorLog } from "../utils/helpers";
export default class SettingService {
  private mainDbSequelize: Sequelize | null = null;
  private orgDbSequelize: Sequelize | null = null;
  private projectIngestion: ProjectIngestionService;
  private logger: Logger;
  constructor(logger: Logger) {
    this.logger = logger;
    this.projectIngestion = new ProjectIngestionService(this.logger);
  }

  private async getMainDbSequelize() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  private async getOrgDbSequelize() {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    return this.orgDbSequelize;
  }

  /**
 * Updates project-level or account-level settings for an organization.
 *
 * This method:
 * 1. Determines whether the update is for a project or account based on `data.flag`
 * 2. For project settings:
 *    - Validates schema existence
 *    - Updates project fiscal data
 *    - Compares old vs new values to insert history records
 *    - Logs changes to project timeline and triggers ingestion
 * 3. For account settings:
 *    - Handles subscription creation and validation if `support_email` is present
 *    - Removes old subscriptions for parent accounts when necessary
 *    - Updates account settings in the org and main databases
 *
 * @param data - Object containing setting details, including:
 *   - `flag`: A string indicating the update type ('project' or 'account')
 *   - `account_rid`, `project_rid`, `project_fiscal_rid`, and setting fields to update
 *   - Optional: `support_email`, `tenant_id`, `client_id`, `client_secret`
 * @returns Promise resolving to a status object with:
 *   - `statusCode`: Number indicating success or failure
 *   - `statusMessage`: Descriptive message indicating operation result
 */
  async updateSettings(data: any) {
    let mainDb = await this.getMainDbSequelize();
    let orgDb = await this.getOrgDbSequelize();

    let fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);
    const parentAccountID = fetchParent[0][0].rid;
    let updatedResult: string;
    let mainUpdatedResult: string;
    if (data.flag == UPDATE_FLAG.project) {
      let oldProjectFiscalData: any = await orgDb.query(
        rawQueries.findProjectFiscal(
          schemaName,
          data.project_rid,
          data.account_rid,
          data.project_fiscal_rid
        )
      );
      updatedResult = await rawQueries.updateSetting(
        schemaName,
        data,
        orgDb,
        mainDb,
        parentAccountID
      );
      if (updatedResult) {
        let findProjectFiscal: any = await orgDb.query(
          rawQueries.findProjectFiscal(
            schemaName,
            data.project_rid,
            data.account_rid,
            data.project_fiscal_rid
          )
        );
        findProjectFiscal[0][0].project_fiscal_id = findProjectFiscal[0][0].rid;
        findProjectFiscal[0][0].account_id =
          findProjectFiscal[0][0].account_rid;
        findProjectFiscal[0][0].project_id =
          findProjectFiscal[0][0].project_rid;
        await this.projectIngestion.updateProjectFiscalRegion(
          fetchParent[0][0].r_number,
          findProjectFiscal[0][0],
          findProjectFiscal[0][0].project_code
        );
        await orgDb.query(rawQueries.insertProjectTimeline(schemaName, data));
        let attributeName: string;
        let oldValue: string;
        let newValue: string;
        for (let name of this.findAttributeNames(data)) {
          attributeName = name;
          oldValue = oldProjectFiscalData[0][0][name];
          newValue = findProjectFiscal[0][0][name];
          if (oldValue == undefined) oldValue = "";
          else oldValue = oldValue;
          if (newValue == undefined) newValue = "";
          else newValue = newValue;
          if (newValue !== oldValue) {
            await orgDb.query(
              rawQueries.insertProjectHistory(
                schemaName,
                data,
                attributeName,
                newValue,
                oldValue
              )
            );
          }
        }
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.settingsUpdatedSuccess,
        };
      }
    } else {
      let parentRid;
      if(fetchParent[0][0].is_parent === true) parentRid = fetchParent[0][0].rid
      else parentRid = fetchParent[0][0].parent_account_rid
      const parentAccountForSettings : any = await mainDb.query(rawQueries.getAccountDetails(parentRid));
      let schemaForSetting = rawQueries.fetchSchemaName(parentAccountForSettings[0][0].r_number);

      let subscriptionId = parentAccountForSettings[0][0].subscription_id ?? "";
      const fetchExistingSettings: any = await rawQueries.fetchSettings(
        schemaForSetting,
        orgDb,
        parentRid
      );

      const existingSettings = fetchExistingSettings[0];
      let descyptedSecret = "";

      if(existingSettings.client_secret){
        descyptedSecret = await decryptClientSecret(existingSettings.client_secret);
      }

      if (data.support_email &&
        data.support_email !== existingSettings.support_email &&
        data.tenant_id !== existingSettings.tenant_id &&
        data.client_id !== existingSettings.client_id &&
        data.client_secret !== descyptedSecret
      ) {
        try {
          subscriptionId = await this.validateAndCreateSubscription(
            data.tenant_id,
            data.client_id,
            data.client_secret,
            data.support_email
          );
          if(subscriptionId === null){
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              statusMessage: `Subscription already exists for ${data.support_email}`,
            }
          }
        } catch (err) {
          errorLog("Error in update settings: " + (err as Error).message);
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusMessage: STATUS_MESSAGE.invalidCredentials,
          }
        }
      }else{
        const fetchExistingSettings: any = await rawQueries.fetchSettings(
          schemaForSetting,
          orgDb,
          parentRid
        );

        if(fetchExistingSettings && fetchExistingSettings.length > 0 && fetchParent[0][0]?.is_parent && !data.support_email){
          const settingsData = fetchExistingSettings[0];
          const {
            support_email: supportEmail,
            tenant_id: tenantId,
            client_id: clientId,
            client_secret: clientSecret,
          } = settingsData;

          let descyptedSecret = "";

          if(clientSecret){
            descyptedSecret = await decryptClientSecret(clientSecret);
          }

          if (supportEmail && tenantId && clientId && descyptedSecret) {
            await this.removeExistingSubscription(
              tenantId,
              clientId,
              descyptedSecret,
              supportEmail
            );
            subscriptionId = "";
          }
        }else {
            const sameCredentials =
                data.support_email === existingSettings.support_email &&
                data.tenant_id === existingSettings.tenant_id &&
                data.client_id === existingSettings.client_id &&
                data.client_secret === descyptedSecret;

            if (!sameCredentials) {
                try {
                    subscriptionId = await this.validateAndCreateSubscription(
                        data.tenant_id,
                        data.client_id,
                        data.client_secret,
                        data.support_email
                    );
                    if (subscriptionId === null) {
                        return {
                            statusCode: HttpStatus.BAD_REQUEST,
                            statusMessage: `Subscription already exists for ${data.support_email}`,
                        }
                    }
                } catch (err) {
                    errorLog("Error in update settings: " + (err as Error).message);
                    return {
                        statusCode: HttpStatus.BAD_REQUEST,
                        statusMessage: STATUS_MESSAGE.invalidCredentials,
                    }
                }
            }
        }
      }

      mainUpdatedResult = await rawQueries.updateSetting(
        schemaName,
        data,
        orgDb,
        mainDb,
        parentRid,
        subscriptionId,
        parentAccountForSettings[0][0]?.is_parent,
        schemaForSetting
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.settingsUpdatedSuccess,
      };
    }
  }

  private findAttributeNames(data: any) {
    let name: string[] = [];
    if (data.blended_rate_fte) name.push(`blended_rate_fte`);
    if (data.blended_rate_subcon) name.push(`blended_rate_subcon`);
    if (typeof data.autosend_interaction == "boolean")
      name.push(`auto_send_ai_interaction`);
    if (data.max_ai_interactions) name.push(`max_ai_interaction`);
    if (typeof data.auto_access_rd == "boolean") name.push(`auto_access_rd`);
    return name;
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

  private async validateAndCreateSubscription(
    tenantId: string,
    clientId: string,
    clientSecret: string,
    supportEmail: string
  ) {
    try {
      const graphClient = this.getGraphClient(tenantId, clientId, clientSecret);

      const existingSubscriptions = await graphClient.api('/subscriptions').get();

      const resourceToCheck = `/users/${supportEmail}/mailFolders('Inbox')/messages`;

      const alreadySubscribed = existingSubscriptions.value?.some(
        (sub: any) => sub.resource === resourceToCheck
      );

      if (alreadySubscribed) {
        return null;
      }

      const expiration = new Date();
      expiration.setMinutes(expiration.getMinutes() + 4230);

      const subscription = await graphClient.api("/subscriptions").post({
        changeType: "created,updated",
        notificationUrl: process.env.EMAIL_WEBHOOK_URL,
        resource: `/users/${supportEmail}/mailFolders('Inbox')/messages`,
        expirationDateTime: expiration.toISOString(),
        clientState: "yourCustomValidationString",
      });

      return subscription?.id;
    } catch (error: any) {
      errorLog("Graph Subscription Error: " + error.message);
      throw new Error("Invalid credentials or failed to create subscription.");
    }
  }

  private async removeExistingSubscription(
    tenantId: string,
    clientId: string,
    clientSecret: string,
    supportEmail: string
  ): Promise<void> {
    const graphClient = this.getGraphClient(tenantId, clientId, clientSecret);
  
    try {
      const existingSubscriptions = await graphClient.api('/subscriptions').get();
  
      const resourceToCheck = `/users/${supportEmail}/mailFolders('Inbox')/messages`;
  
      const matchingSubscriptions = existingSubscriptions.value?.filter(
        (sub: any) => sub.resource === resourceToCheck || sub.resource === `users/${supportEmail}/mailFolders('Inbox')/messages`
      ) || [];
  
      if (matchingSubscriptions.length === 0) {
        return;
      }
  
      for (const sub of matchingSubscriptions) {
        try {
          await graphClient.api(`/subscriptions/${sub.id}`).delete();
        } catch (deleteErr) {
          errorLog("Error deleting subscription: " + (deleteErr as Error).message);
        }
      }
    } catch (err) {
      errorLog("Error removing subscriptions: " + (err as Error).message);
      throw err; 
    }
  }  
}
