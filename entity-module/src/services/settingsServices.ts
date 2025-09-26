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
import { decryptClientSecret } from "../utils/helpers";
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
      let subscriptionId = "";
      if (data.support_email) {
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
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusMessage: STATUS_MESSAGE.invalidCredentials,
          }
        }
      }else{
        const fetchExistingSettings: any = await rawQueries.fetchSettings(
          schemaName,
          orgDb,
          parentAccountID
        );

        if(fetchExistingSettings && fetchExistingSettings.length > 0){
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
          }
        }
      }

      mainUpdatedResult = await rawQueries.updateSetting(
        schemaName,
        data,
        orgDb,
        mainDb,
        parentAccountID,
        subscriptionId
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
      this.logger.error("Graph Subscription Error:", error);
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
          console.log(`Failed to delete subscription ${sub.id}`)
        }
      }
    } catch (err) {
      throw err; 
    }
  }  
}
