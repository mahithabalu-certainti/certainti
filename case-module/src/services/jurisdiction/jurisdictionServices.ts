import { Logger } from "winston";
import { Sequelize, Op } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import { JurisdictionSchemaService } from "./schemaService";
import { HttpStatus, rawQueries, STATUS_MESSAGE } from "../../utils/constants";
import { logMessage } from "../../utils/helpers";
import CaseSchemaService from "../cases/schemaService";
import { initMainDbSequelize } from "../../config/mainDataSource";

export class JurisdictionService {
  private jurisdictionSchemaService: JurisdictionSchemaService;
  private caseModelService: CaseModelService;
  private caseSchemaService: CaseSchemaService;
  private logger: Logger;
  private mainDbSequelize: Sequelize | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
    this.jurisdictionSchemaService = new JurisdictionSchemaService();
    this.caseModelService = new CaseModelService();
    this.caseSchemaService = new CaseSchemaService();
  }

  private async getMainDb() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  /**
   * Adds or updates jurisdiction configuration for a given account & case.
   *
   * - Finds org schema using parent account
   * - Checks if a record already exists for (account_rid, case_rid)
   * - If yes → updates it
   * - If no → inserts a new record
   * - Handles "state" vs "federal" logic for states array
   */
  async createOrUpdateJurisdiction(
    jurisdictionData: any,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }> {
    const db = await this.caseModelService.getSequelize();
    const transaction = await db.transaction();

    try {
      jurisdictionData.created_by = userId;

      const { accountNumber, parentAccountId } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          jurisdictionData.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const result =
        await this.jurisdictionSchemaService.createOrUpdateJurisdiction(
          accountNumber,
          jurisdictionData,
          transaction
        );

      await transaction.commit();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.jurisdictionAddedSuccess,
        data: { jurisdiction: result },
      };
    } catch (error) {
      logMessage(`Error creating/updating jurisdiction: ${error}`);
      await transaction.rollback();

      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.jurisdictionAddedFailed,
      };
    }
  }

  /**
   * Fetches jurisdiction configuration for a given account and case.
   *
   * - Resolves org schema using parent account
   * - Fetches jurisdiction record for (accountRid, caseRid)
   * - Returns success/failure structured response
   */
  async getJurisdictionConfiguration(
    accountRid: string,
    entityRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }> {
    try {
      // Step 1: Resolve account number (schema name)
      const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(accountRid);

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      // Step 2: Get Sequelize model for this account schema
      const { Jurisdiction } = await this.caseModelService.getModels(
        accountNumber
      );

      // Step 3: Fetch jurisdiction record
      const jurisdiction = await Jurisdiction.findOne({
        where: { entity_rid: entityRid },
      });

      // Step 4: Return success response
      return {
        statusCode: HttpStatus.SUCCESS,
        message:
          STATUS_MESSAGE.jurisdictionFetchedSuccess ||
          "Jurisdiction configuration fetched successfully",
        data: jurisdiction || {},
      };
    } catch (error) {
      logMessage(`Error fetching jurisdiction configuration: ${error}`);

      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage:
          STATUS_MESSAGE.jurisdictionFetchedFailed ||
          "Failed to fetch jurisdiction configuration",
      };
    }
  }

  async getJurisdictionConfigDetailsById(configRequest: any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { configDetails: any };
  }> {
    try {
      const configDetails =
        await this.jurisdictionSchemaService.fetchJurisdictionConfigDetailsById(
          configRequest
        );

      if (!configDetails) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.configNotAvailable,
        };
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          configDetails: configDetails,
        },
      };
    } catch (err) {
      logMessage(`Error fetching jurisdiction details, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: "Error fetching jurisdiction config details",
      };
    }
  }
  async updateJurisdictionConfig(configRequest: any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { response: any };
  }> {
    try {
      // Duplicate check for jurisdiction config (exclude current record)
      const { JurisdictionConfig } = await this.caseModelService.getModels("");
      const mainDb = await this.getMainDb();
      const [activeStatusRid]: any[] = await mainDb.query(
        rawQueries.getActiveStatusId(),
        { type: "SELECT" }
      );
      configRequest.status_rid = activeStatusRid.rid;
      let duplicate = false;
      if (configRequest.jurisdictionConfig) {
        const existingConfig = await JurisdictionConfig.findOne({
          where: {
            credit_config_group_rid: configRequest.jurisdiction_config_group_rid,
            status_rid: activeStatusRid.rid,
            rid: { [Op.ne]: configRequest.config_rid },
          },
        });
        // Raw query for overlap (exclude current rid)
        const overlapConfig = await JurisdictionConfig.sequelize?.query(
          rawQueries.checkJurisdictionConfigOverlap(true), // pass a flag to exclude current rid if needed
          {
            replacements: {
              groupId: configRequest.jurisdiction_config_group_rid,
              statusRid: activeStatusRid.rid,
              startDate: configRequest.effective_start_date,
              endDate: configRequest.effective_end_date,
              excludeRid: configRequest.config_rid,
            },
            type: "SELECT",
          }
        );
        if (existingConfig || (overlapConfig && overlapConfig.length > 0))
          duplicate = true;
      }
      // Duplicate check for platform config
      if (configRequest.is_federal && configRequest.platformConfig) {
       
        const existingPlatformConfig = await JurisdictionConfig.findOne({
          where: {
            credit_config_group_rid: configRequest.platform_config_group_rid,
            status_rid: activeStatusRid.rid,
            rid: { [Op.ne]: configRequest.config_rid },
          },
        });
        const overlapPlatformConfig = await JurisdictionConfig.sequelize?.query(
          rawQueries.checkJurisdictionConfigOverlap(true),
          {
            replacements: {
              groupId: configRequest.platform_config_group_rid,
              statusRid: activeStatusRid.rid,
              startDate: configRequest.effective_start_date,
              endDate: configRequest.effective_end_date,
              excludeRid: configRequest.config_rid,
            },
            type: "SELECT",
          }
        );
        if (
          existingPlatformConfig ||
          (overlapPlatformConfig && overlapPlatformConfig.length > 0)
        )
          duplicate = true;
      }
      console.log("duplicate in platform", duplicate);
      if (!duplicate) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage:
            "Duplicate platform config exists for the same effective dates wih active status.",
        };
      }
      const updatedConfig =
        await this.jurisdictionSchemaService.updateJurisdictionConfig(
          configRequest
        );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          response: updatedConfig,
        },
      };
    } catch (err) {
      logMessage(`Error updating jurisdiction config, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: "Error updating jurisdiction config",
      };
    }
  }

  async createJurisdictionConfig(configRequest: any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { response: any };
  }> {
    try {
      // Duplicate check for jurisdiction config
      const { JurisdictionConfig } = await this.caseModelService.getModels("");
      const mainDb = await this.getMainDb();
      const [activeStatusRid]: any[] = await mainDb.query(
        rawQueries.getActiveStatusId(),
        { type: "SELECT" }
      );
      configRequest.status_rid = activeStatusRid.rid;
      console.log("activeStatusRid", activeStatusRid.rid);
      let duplicate = false;
      if (configRequest.jurisdictionConfig) {
        const group = configRequest.jurisdictionConfig;
        const existingConfig = await JurisdictionConfig.findOne({
          where: {
            credit_config_group_rid: configRequest.jurisdiction_config_group_rid,
            status_rid: activeStatusRid.rid,
          },
        });
        // Raw query for overlap
        const overlapConfig = await JurisdictionConfig.sequelize?.query(
          rawQueries.checkJurisdictionConfigOverlap(),
          {
            replacements: {
              groupId: configRequest.jurisdiction_config_group_rid,
              statusRid: activeStatusRid.rid,
              startDate: configRequest.effective_start_date,
              endDate: configRequest.effective_end_date,
            },
            type: "SELECT",
          }
        );
        if (existingConfig || (overlapConfig && overlapConfig.length > 0))
          duplicate = true;
      }
      // Duplicate check for platform config
      if (configRequest.is_federal && configRequest.platformConfig) {
        const group = configRequest.platformConfig;
        const existingPlatformConfig = await JurisdictionConfig.findOne({
          where: {
            credit_config_group_rid: configRequest.platform_config_group_rid,
            status_rid: activeStatusRid.rid,
          },
        });
        const overlapPlatformConfig = await JurisdictionConfig.sequelize?.query(
          rawQueries.checkJurisdictionConfigOverlap(),
          {
            replacements: {
              groupId: configRequest.platform_config_group_rid,
              statusRid: activeStatusRid.rid,
              startDate: configRequest.effective_start_date,
              endDate: configRequest.effective_end_date,
            },
            type: "SELECT",
          }
        );
        if (
          existingPlatformConfig ||
          (overlapPlatformConfig && overlapPlatformConfig.length > 0)
        )
          duplicate = true;
      }
      if (duplicate) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage:
            "Duplicate config exists for the same effective dates and active status.",
        };
      }
      const updatedConfig =
        await this.jurisdictionSchemaService.createJurisdictionConfig(
          configRequest
        );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          response: updatedConfig,
        },
      };
    } catch (err) {
      console.log("err", err);
      logMessage(`Error updating jurisdiction config, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: "Error updating jurisdiction config",
      };
    }
  }

  async listJurisdictionConfig(
    data: any,
    apiType: string,
    filters: any
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { configs: any,count:number };
  }> {
    try {
      const updatedConfig =
        await this.jurisdictionSchemaService.listJurisdictionConfig(
          data.page,
          data.limit,
          apiType,
          filters,
          data.search,
          data.sortBy,
          data.sortOrder
        );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          configs: updatedConfig?.result,
          count: updatedConfig?.count,
        },
      };
    } catch (err) {
      logMessage(`Error updating jurisdiction config, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: "Error updating jurisdiction config",
      };
    }
  }

  async getJurisdictionConfigDetailsForNew(configRequest: any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { configDetails: any };
  }> {
    try {
      const configDetails =
        await this.jurisdictionSchemaService.getJurisdictionConfigDataForNewEntry(
          configRequest
        );

      if (!configDetails || configDetails?.jurisdictionConfig === null) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.configNotAvailable,
        };
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          configDetails: configDetails,
        },
      };
    } catch (err) {
      logMessage(`Error fetching jurisdiction details, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: "Error fetching jurisdiction config details",
      };
    }
  }
}
