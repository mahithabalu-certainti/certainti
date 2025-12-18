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
      let duplicate = false;
      if (configRequest.config_name) {
        const existingConfigName = await JurisdictionConfig.findOne({
          where: {
            config_name: configRequest.config_name,
            status_rid: activeStatusRid.rid,
            rid: { [Op.ne]: configRequest.config_rid },
            credit_config_group_rid:configRequest.jurisdiction_config_group_rid,
            federal_config_id: { [Op.is]: null },
          },
        });
        if (existingConfigName) {
          return {
            statusCode: HttpStatus.FAILED,
            message: STATUS_MESSAGE.configUpdateFailed,
            errorMessage: `A config with name ${configRequest.config_name} already exists.Please use a different name.`,
          };
        }
      }
      if (configRequest.jurisdictionConfig &&  configRequest.effective_start_date) {
        duplicate = await this.hasOverlapConfig({
          JurisdictionConfig,
          groupId: configRequest.jurisdiction_config_group_rid,
          statusRid: activeStatusRid.rid,
          startDate: configRequest.effective_start_date,
          endDate: configRequest.effective_end_date,
          excludeRid: configRequest.config_rid,
          isUpdate: true
        });
      }
      // Duplicate check for platform config
      if (!duplicate && configRequest.is_federal && configRequest.platformConfig  && configRequest.effective_start_date) {
        duplicate = await this.hasOverlapConfig({
          JurisdictionConfig,
          groupId: configRequest.platform_config_group_rid,
          statusRid: activeStatusRid.rid,
          startDate: configRequest.effective_start_date,
          endDate: configRequest.effective_end_date,
          excludeRid: configRequest.config_rid,
          isUpdate: true
        });
      }
      if (duplicate) {
        return {
          statusCode: HttpStatus.FAILED,
          message: STATUS_MESSAGE.configUpdateFailed,
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
        message: STATUS_MESSAGE.configUpdatedSuccess,
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
      let duplicate = false;
      if (configRequest.config_name) {
        const existingConfigName = await JurisdictionConfig.findOne({
          where: {
            config_name: configRequest.config_name,
            status_rid: activeStatusRid.rid,
            credit_config_group_rid:configRequest.jurisdiction_config_group_rid
          },
        });
        if (existingConfigName) {
          return {
            statusCode: HttpStatus.FAILED,
            message: HttpStatus.FAILED_MESSAGE,
            errorMessage: `A config with name ${configRequest.config_name} already exists.Please use a different name.`,
          };
        }
      }
      
      if (configRequest.jurisdictionConfig) {
        // Check for overlap only (existingConfig check is redundant with overlap query)
        duplicate = await this.hasOverlapConfig({
          JurisdictionConfig,
          groupId: configRequest.jurisdiction_config_group_rid,
          statusRid: activeStatusRid.rid,
          startDate: configRequest.effective_start_date,
          endDate: configRequest.effective_end_date,
          isUpdate: false
        });
      }
      // Duplicate check for platform config
      if (!duplicate && configRequest.is_federal && configRequest.platformConfig) {
        duplicate = await this.hasOverlapConfig({
          JurisdictionConfig,
          groupId: configRequest.platform_config_group_rid,
          statusRid: activeStatusRid.rid,
          startDate: configRequest.effective_start_date,
          endDate: configRequest.effective_end_date,
          isUpdate: false
        });
      }
      if (duplicate) {
        return {
          statusCode: HttpStatus.FAILED,
          message: STATUS_MESSAGE.configCreationFailed,
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
        message: STATUS_MESSAGE.configCreatedSuccess,
        data: {
          response: updatedConfig,
        },
      };
    } catch (err) {
      logMessage(`Error creating jurisdiction config, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: STATUS_MESSAGE.configCreationFailed,
        errorMessage: "Error creating jurisdiction config",
      };
    }
  }

    /**
   * Checks for overlapping jurisdiction or platform config for duplicate prevention.
   * @param {object} params - Parameters for the check
   * @param {object} params.JurisdictionConfig - The Sequelize model
   * @param {string} params.groupId - The config group id
   * @param {string} params.statusRid - The status rid
   * @param {string} params.startDate - The effective start date
   * @param {string} params.endDate - The effective end date
   * @param {string} [params.excludeRid] - The config rid to exclude (for update)
   * @param {boolean} [params.isUpdate] - Whether this is an update operation
   * @returns {Promise<boolean>} - True if overlap exists, false otherwise
   */
  private async hasOverlapConfig({
    JurisdictionConfig,
    groupId,
    statusRid,
    startDate,
    endDate,
    excludeRid,
    isUpdate = false
  }: {
    JurisdictionConfig: any,
    groupId: string,
    statusRid: string,
    startDate: string,
    endDate?: string,
    excludeRid?: string,
    isUpdate?: boolean
  }): Promise<boolean> {
    const query = rawQueries.checkJurisdictionConfigOverlap(isUpdate);
    const replacements: any = {
      groupId,
      statusRid,
      startDate
    };
    if (typeof endDate !== 'undefined') {
      replacements.endDate = endDate;
    }
    if (isUpdate && excludeRid) {
      replacements.excludeRid = excludeRid;
    }
    const overlap = await JurisdictionConfig.sequelize?.query(query, {
      replacements,
      type: "SELECT"
    });
    return !!(overlap && overlap.length > 0);
  }

  async listJurisdictionConfig(
    data: any,
    apiType: string,
    filters: any,
    configRid?: string
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
          data.sortOrder,          
          configRid
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
