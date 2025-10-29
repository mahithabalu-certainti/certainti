import { Op, QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import { CaseModelService } from "../caseModelsService";
import CaseSchemaService from "./schemaService";
import { Accounttype, CaseOwnertype, CaseStatustype, Countrytype, Currencytype, Filingtype, ICreateCases } from "../../utils/types";
import { logMessage } from "../../utils/helpers";
import {
  caseStatuses,
  HttpStatus,
  STATUS_MESSAGE,
  rawQueries
} from "../../utils/constants";
export class CaseService {
  private caseSchemaService: CaseSchemaService;
  private caseModelService: CaseModelService; // Assuming this is defined somewhere in your code
  private logger: Logger;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
    this.caseSchemaService = new CaseSchemaService();
    this.caseModelService = new CaseModelService(); // Initialize your model service here
  }

  private async getMainDb() {
    if(!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize()
    }
    return this.mainDbSequelize
  }

  private async getOrgDb () {
    if(!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize()
    }
    return this.orgDbSequelize    
  }
  /**
   * Creates a new case along with its associated data within a database transaction.
   *
   * @param {ICreateCases} caseRequest - The case data to create, including account information, case details, and metadata.
   * @param {string} userId - The ID of the user creating the case.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { cases: any };
   * }>} - Result of the creation process, including status code, message, optional error message, and case data if successful.
   *
   * @description
   * - Initializes database transaction for atomic operations.
   * - Sets the created_by field to the provided userId.
   * - Validates account information and retrieves account details.
   * - Sets default case status to 'IN PROGRESS' for new cases.
   * - Creates the case record in the database.
   * - Adds case summary information for reporting purposes.
   * - Commits transaction on success or rolls back on error.
   * - Returns success response with case data or error response accordingly.
   * - Catches and logs errors, returning a failed status with an error message.
   */ 

  async createCase(
    caseRequest: ICreateCases,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { cases: any };
  }> {
    const dbInit = await this.caseModelService.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      caseRequest.created_by = userId;
      const { accountNumber, parentAccountId } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          caseRequest.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const { statusRid } = await this.getCaseStatusForCreate();
      caseRequest.status_rid = statusRid || "";
      const response = await this.caseSchemaService.createCases(
        accountNumber,
        caseRequest,
        transaction
      );
      if (response) {
        logMessage(`Case created with RID: ${response.rid}`);
        await this.caseSchemaService.addCaseSummary(
          accountNumber,
          caseRequest,
          response.rid,
          response.get("r_number") || ""
        );
      }

      await transaction.commit();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.caseCreated,
        data: {
          cases: response,
        },
      };
    } catch (err) {
      logMessage(`Error creating case, ${err}`);
      await transaction.rollback();
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.caseCreationFailed,
      };
    }
  }

  /**
   * Updates an existing case with new data within a database transaction.
   *
   * @param {ICreateCases} caseRequest - The updated case data, including modifications and metadata.
   * @param {string} userId - The ID of the user performing the update operation.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { cases: any };
   * }>} - Result of the update process, including status code, message, optional error message, and updated case data.
   *
   * @description
   * - Initializes database transaction for atomic operations.
   * - Sets the created_by field to the provided userId (for audit purposes).
   * - Validates account information and retrieves account details.
   * - Updates the case record in the database with provided modifications.
   * - Commits transaction on success or rolls back on error.
   * - Returns success response with updated case data or error response accordingly.
   * - Catches and logs errors, returning a failed status with an error message.
   */
  async updateCase(
    caseRequest: ICreateCases,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { cases: any };
  }> {
    const dbInit = await this.caseModelService.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      caseRequest.created_by = userId;
      const { accountNumber, parentAccountId } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          caseRequest.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const response = await this.caseSchemaService.updateCases(
        accountNumber,
        caseRequest,
        transaction
      );

      await transaction.commit();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.caseUpdated,
        data: {
          cases: {},
        },
      };
    } catch (err) {
      logMessage(`Error updating case, ${err}`);
      await transaction.rollback();
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.caseCreationFailed,
      };
    }
  }

  /**
   * Retrieves all available case filing types from the database.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { caseFilingType: any };
   * }>} - Result containing all case filing types or error information.
   *
   * @description
   * - Fetches all case filing types from the database through the schema service.
   * - Returns success response with filing type data on successful retrieval.
   * - Catches and logs errors, throwing a standardized service error.
   * - Used for populating dropdown options or validation in the frontend.
   */
  async getCaseFilingType(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseFilingType: any };
  }> {
    try {
      const caseFilingType = await this.caseSchemaService.getCaseFilingType();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          caseFilingType,
        },
      };
    } catch (err) {
      logMessage(`Error fetching case filing type, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

/**
   * Fetch Case Headers and Section List
   * -------------------------------------------------------
   * Description:
   *   This method retrieves detailed case header and section information 
   *   for a given account and case. It performs multiple database lookups 
   *   to enrich the case data with additional metadata like country, currency, 
   *   owner, and status details.
   *
   * Flow:
   *   1. Connect to both main and organization databases.
   *   2. Fetch the parent account's `r_number` to determine the schema name.
   *   3. Query the case details (header + sections) using the organization DB.
   *   4. Enrich the case data with:
   *      - Account details (r_number, country, currency)
   *      - Filing type, owner, and status details
   *   5. Return a structured response with the case details or a not-found status.
   *
   * Parameters:
   *   @param accountRid - Unique identifier (RID) of the account.
   *   @param caseRid - Unique identifier (RID) of the case.
   *
   * Returns:
   *   An object containing:
   *     - statusCode: HTTP-like status indicator.
   *     - data: Case details object (if found) or empty object.
   */
  async fetchCaseHeadersSectionsList (accountRid : string, caseRid : string) {
    const mainDb = await this.getMainDb()
    const orgDb = await this.getOrgDb();
    const fetchParentAccountRnumber : any = await mainDb.query(await rawQueries.fetchParentAccount(accountRid, mainDb))
    if(fetchParentAccountRnumber[0].length > 0) {
      let schemaName = rawQueries.fetchSchemaName(fetchParentAccountRnumber[0][0].r_number)
      const queryResult = await this.caseSchemaService.getCasesHeadersSectionList(caseRid, schemaName, orgDb);
      if(queryResult) {
        let getCountryDetails: Countrytype | undefined
        let getCurrencyDetails : Currencytype | undefined
        const [getAccountDetails] = await mainDb.query<Accounttype>(rawQueries.fetchAccountDetails(queryResult.account_rid), {type : QueryTypes.SELECT});
        const [getCaseFilingType] = await mainDb.query<Filingtype>(rawQueries.getCaseFilingTypeById(queryResult.filing_type_rid), {type : QueryTypes.SELECT}) 
        if(getAccountDetails?.country_rid != null) 
          [getCountryDetails] = await mainDb.query<Countrytype>(rawQueries.getCountryDetails(getAccountDetails.country_rid), {type : QueryTypes.SELECT})
        if(getAccountDetails?.currency_rid !== null)
          [getCurrencyDetails] = await mainDb.query<Currencytype>(rawQueries.getCurrencyDetails(getAccountDetails!.currency_rid), {type : QueryTypes.SELECT})
        const [getOwnerDetails] = await mainDb.query<CaseOwnertype>(rawQueries.getOwnerDetails(queryResult.case_owner_rid), {type : QueryTypes.SELECT})
        const [getCaseStatusDetails] = await mainDb.query<CaseStatustype>(rawQueries.getCaseStatusDetails(queryResult.status_rid), {type : QueryTypes.SELECT})
        if(getAccountDetails) queryResult.account_rnumber = getAccountDetails.r_number
        else queryResult.account_rnumber = null
        if(getCaseFilingType) queryResult.filing_type_name = getCaseFilingType.filing_type_name
        else queryResult.filing_type_name = null
        if(getCountryDetails) {
          queryResult.country_name = getCountryDetails.country_name
          queryResult.country_rid = getAccountDetails!.country_rid
        }
        else {
          queryResult.country_name = null
          queryResult.currency_rid = null
        }
        if(getOwnerDetails) queryResult.case_owner_name = getOwnerDetails.name
        else queryResult.case_owner_name = null
        if(getCaseStatusDetails) queryResult.status_name = getCaseStatusDetails.status_name
        else queryResult.status_name = null
        if(getCurrencyDetails) {
          queryResult.currency_code = getCurrencyDetails.currency_code
          queryResult.currency_rid = getAccountDetails!.currency_rid
        } else {
          queryResult.currency_code = null
          queryResult.currency_rid = null
        }
        return {
          statusCode : HttpStatus.SUCCESS,
          data : queryResult
        }
      } else {
        return {
          statusCode : HttpStatus.NOT_FOUND,
          data : {}          
        }
      }
    }
  }
  /**
   * Retrieves all available case statuses from the database.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { caseStatus: any };
   * }>} - Result containing all case statuses or error information.
   *
   * @description
   * - Fetches all case statuses from the database through the schema service.
   * - Returns success response with status data on successful retrieval.
   * - Catches and logs errors, throwing a standardized service error.
   * - Used for populating status dropdown options or validation in the frontend.
   */
  async getCaseStatus(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseStatus: any };
  }> {
    try {
      const caseStatus = await this.caseSchemaService.getCaseStatus();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          caseStatus,
        },
      };
    } catch (err) {
      logMessage(`Error fetching case status, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

  /**
   * Retrieves the default status RID for newly created cases.
   *
   * @returns {Promise<{ statusRid: string }>} - Object containing the status RID for 'IN PROGRESS' status.
   *
   * @description
   * - Fetches the status RID for the 'IN PROGRESS' status from the database.
   * - Used internally when creating new cases to set the default status.
   * - Returns the status RID that should be assigned to new cases by default.
   * - This ensures all new cases start with a consistent 'IN PROGRESS' status.
   */
  async getCaseStatusForCreate() {
    const statusRid = await this.caseSchemaService.getCaseStatusByType(
      caseStatuses.INPROGRESS
    );

    return { statusRid };
  }

  /**
   * Formats an error response to be returned from service methods.
   *
   * @param {Error} err - The caught error object containing error details.
   * 
   * @returns {{
   *   statusCode: number;
   *   message: string;
   *   errorMessage: string;
   * }} - Standardized error response object with consistent structure.
   *
   * @description
   * - Converts any caught error into a standardized service error format.
   * - Sets status code to FAILED (500) for consistent error handling.
   * - Preserves the original error message for debugging purposes.
   * - Used across all service methods to maintain consistent error response structure.
   * - Ensures all service errors follow the same format for frontend consumption.
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
}
