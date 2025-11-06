import { Sequelize, Transaction } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import { logMessage } from "../../utils/helpers";

interface IJurisdictionRequest {
  rid?: string;
  created_by: string;
  modified_by?: string;
  account_rid: string;
  case_rid: string;
  is_federal_level: boolean;
  is_state_level: boolean;
  states?: string[];
}

export class JurisdictionSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private caseModelService: CaseModelService;

  constructor() {
    this.caseModelService = new CaseModelService();
  }

  /**
   * Create or update jurisdiction record based on existence.
   * If record exists (based on account_rid + case_rid), it will update it.
   * Otherwise, it creates a new record.
   */
  async createOrUpdateJurisdiction(
    accountNumber: string,
    jurisdictionData: IJurisdictionRequest,
    transaction: Transaction
  ) {
    try {
      
      const { Jurisdiction } = await this.caseModelService.getModels(accountNumber);

      const existing = await Jurisdiction.findOne({
        where: {
          account_rid: jurisdictionData.account_rid,
          case_rid: jurisdictionData.case_rid,
        },
        transaction,
      });

      if (existing) {
        // Update existing jurisdiction
        await existing.update(
          {
            modified_by: jurisdictionData.created_by,
            modified_datetime: new Date(),
            is_federal_level: jurisdictionData.is_federal_level,
            is_state_level: jurisdictionData.is_state_level,
            states: jurisdictionData.states,
          },
          { transaction }
        );

        logMessage(`Updated jurisdiction for account ${jurisdictionData.account_rid}`);
        return existing;
      } else {
        // Create new jurisdiction
        const newJurisdiction = await Jurisdiction.create(
          {
            created_by: jurisdictionData.created_by,
            account_rid: jurisdictionData.account_rid,
            case_rid: jurisdictionData.case_rid,
            is_federal_level: jurisdictionData.is_federal_level,
            is_state_level: jurisdictionData.is_state_level,
            states: jurisdictionData.states,
          },
          { transaction }
        );

        logMessage(`Created new jurisdiction for account ${jurisdictionData.account_rid}`);
        return newJurisdiction;
      }
    } catch (error) {
      logMessage(`Error in createOrUpdateJurisdiction: ${error}`);
      throw new Error("Error processing jurisdiction: " + error);
    }
  }

}
