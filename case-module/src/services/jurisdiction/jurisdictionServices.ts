import { Logger } from "winston";
import { Sequelize } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import { JurisdictionSchemaService } from "./schemaService";
import { HttpStatus, STATUS_MESSAGE } from "../../utils/constants";
import { logMessage } from "../../utils/helpers";
import CaseSchemaService from "../cases/schemaService";

export class JurisdictionService {
  private jurisdictionSchemaService: JurisdictionSchemaService;
  private caseModelService: CaseModelService;
  private caseSchemaService: CaseSchemaService;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.jurisdictionSchemaService = new JurisdictionSchemaService();
    this.caseModelService = new CaseModelService();
    this.caseSchemaService = new CaseSchemaService();
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
}
