import { initOrgSequelize } from "../../config/orgDataSource";
import dayjs from "dayjs";
import { initMainDbSequelize } from "../../config/mainDataSource";
import {
  col,
  fn,
  Op,
  QueryTypes,
  Sequelize,
  Transaction,
  UUIDV4,
  where,
} from "sequelize";
import { CaseModelService } from "../caseModelsService";
import { HttpStatus, rawQueries, SCHEMANAME_PREFIX } from "../../utils/constants";
import { errorLog, logMessage } from "../../utils/helpers";
import { ICreateCases } from "../../utils/types";
import { Case, setupCaseSequence } from "../../models/caseModel";
class CaseSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private caseModelService: CaseModelService;

  constructor() {
    this.caseModelService = new CaseModelService();
  }

  async fetchValidAccountNumberById(accountId: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }

      const [account]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchParentAccountDetails,
        {
          replacements: { rid: accountId },
          type: "SELECT",
        }
      );

      let accountRnumber = account?.r_number;

      if (account?.storage_type === "store_in_parent") {
        const [accountData]: any[] = await this.mainDbSequelize.query(
          rawQueries.fetchParentAccountDetails,
          {
            replacements: { rid: account?.parent_account_rid },
            type: "SELECT",
          }
        );
        accountRnumber = accountData?.r_number;
      }

      return {
        accountNumber: accountRnumber,
        accountId: account?.rid,
        accountName: account?.account_name,
        parentAccountId: account?.parent_account_rid,
      };
    } catch (err) {
      logMessage(`Error fetching account: ${err}`);
      throw new Error("Error fetching account : " + (err as Error).message);
    }
  }
  async createCases(
    accountNumber: string,
    caseRequest: ICreateCases,
    transaction: Transaction
  ) {
    // Implementation for creating interactions in the database
    try {
      const { Case } = await this.caseModelService.getModels(accountNumber);
      await this.createCaseTables(accountNumber);
      const casecreationResponse = await Case.create(caseRequest, {
        transaction,
      });

      return casecreationResponse;
    } catch (error) {
      logMessage(`Error creating interaction: ${error}`);
      throw new Error("Error creating interaction: " + error);
    }
  }
   async addCaseSummary(
    accountNumber: string,
    caseData: ICreateCases,
    caseRid: string,
    caseRnumber: string
  ) {
    try {
      const { CaseSummary } = await this.caseModelService.getModels(accountNumber);

      await CaseSummary.create({
        case_rid: caseRid,
        r_number: caseRnumber,
        ...caseData,
      });
    } catch (error) {
      logMessage(`Error creating case summary: ${error}`);
      throw new Error(
        "Error creating case summary: " + (error as Error).message
      );
    }
  }

  async updateCases(
    accountNumber: string,
    caseRequest: ICreateCases,
    transaction: Transaction
  ) {
    // Implementation for creating interactions in the database
    try {
      const { Case ,CaseSummary } = await this.caseModelService.getModels(accountNumber);

      const caseUpdateResponse = await Case.update(caseRequest, {
        where: { rid: caseRequest.case_rid },
        transaction,
      });
      await CaseSummary.update(
      {
        ...caseRequest,
        modified_datetime: new Date(),
      },
      {
        where: {
          case_rid: caseRequest.case_rid,
        },
      }
    );

      return caseUpdateResponse;
    } catch (error) {
      logMessage(`Error updating cases: ${error}`);
      throw new Error("Error updating cases: " + error);
    }
  }

  async createCaseTables(accountNumber: string) {
    try {
      const orgDbSequlize = await initOrgSequelize();
      const mainDbSequlize = await initMainDbSequelize();
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;

      const CaseModel = await Case.initialize(
        orgDbSequlize,
        schemaName
      );

      await CaseModel.sync({ force: false });
      await setupCaseSequence(orgDbSequlize, schemaName);
    } catch (err) {
      errorLog("Error creating case tables", (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }

   async getCaseStatusByType(type: string) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.caseModelService.getMainSequelize();
    }

    const caseStatus = await this.mainDbSequelize.query(
     rawQueries.fetchCaseStatusByType(type),
      {
        replacements: { type },
        type: "SELECT",
      }
    );

    const sourceArr = caseStatus as Array<{
      rid: string;
      case_status_name: string;
    }>;
    return sourceArr.length > 0 ? sourceArr[0]?.rid : null;
  }

  /**
   * Formats an error response to be returned from service methods.
   *
   * @param {Error} err - The caught error.
   * @returns {object} - Standardized error response object.
   */
  throwServiceError(err: Error): {
    statusCode: number;
    message: string;
    errorMessage: string;
  } {
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }

  async getCaseFilingType() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const caseFilingType = await this.mainDbSequelize.query(
      rawQueries.getCaseFilingType(),
      {
        type: "SELECT",
      }
    );

    return caseFilingType;
  }

   async getCaseStatus() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const caseStatus = await this.mainDbSequelize.query(
      rawQueries.getCaseStatus(),
      {
        type: "SELECT",
      }
    );

    return caseStatus;
  }
}

export default CaseSchemaService;
