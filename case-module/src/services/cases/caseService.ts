import { Op, QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import { CaseModelService } from "../caseModelsService";
import CaseSchemaService from "./schemaService";
import { Accounttype, CaseOwnertype, CaseStatustype, Countrytype, Currencytype, Filingtype, ICreateCases } from "../../utils/types";
import { logMessage } from "../../utils/helpers";
import { HttpStatus, rawQueries, STATUS_MESSAGE } from "../../utils/constants";
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

      const response = await this.caseSchemaService.createCases(
        accountNumber,
        caseRequest,
        transaction
      );

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
        message: STATUS_MESSAGE.caseCreated,
        data: {
          cases: response,
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
}
