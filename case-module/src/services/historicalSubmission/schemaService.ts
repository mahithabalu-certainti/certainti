import { Sequelize, Transaction, Op } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import CaseSchemaService from "../cases/schemaService";
import { logMessage, errorLog } from "../../utils/helpers";
import { ICreateHistoricalSubmission, CaseHistorySubmission, CurrencyType } from "../../utils/types";
import { fetchCaseDetails } from "../../utils/rawQueries";
import { entityTypes, eventTypes, rawQueries, SCHEMANAME_PREFIX, eventNames } from "../../utils/constants";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { HelperMethods } from "../cases/helperMethods";

export class HistoricalSubmissionSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private caseModelService: CaseModelService;
  private caseSchemaService: CaseSchemaService;
  private mainDbSequelize: Sequelize | null = null
  private helperMethod: HelperMethods


  constructor() {
    this.caseModelService = new CaseModelService();
    this.caseSchemaService = new CaseSchemaService();
    this.helperMethod = new HelperMethods(
      this.caseModelService
    );
  }

  async getMainDb() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  private async checkUniqueFiscalYear(
    CaseHistorySubmission: any,
    account_rid: string,
    fiscal_year: string,
    country_rid: string,
    state_rid: string,
    excludeRid?: string
  ): Promise<boolean> {
    const whereClause: any = {
      account_rid,
      fiscal_year,
      country_rid
    };

    if (excludeRid) {
      whereClause.rid = { [Op.ne]: excludeRid };
    }

    if (state_rid != null) {
      whereClause.state_rid = state_rid;
    }

    const existing = await CaseHistorySubmission.findOne({
      where: whereClause
    });

    return !existing;
  }

  /**
   * Groups historical submissions by their action type for ordered processing
   */
  private groupHistoricalSubmissionsByActionType(submissions: CaseHistorySubmission[]) {
    return {
      deleteOperations: submissions.filter((sub) => sub.action_type === "delete"),
      editOperations: submissions.filter((sub) => sub.action_type === "edit"),
      addOperations: submissions.filter((sub) => sub.action_type === "add"),
      unknownOperations: submissions.filter(
        (sub) => !["delete", "edit", "add"].includes(sub.action_type)
      ),
    };
  }

  /**
   * Processes delete operations for historical submissions
   */
  private async processDeleteOperations(
    CaseHistorySubmission: any,
    deleteOperations: CaseHistorySubmission[],
    results: any[],
    historySubmissionRequest: ICreateHistoricalSubmission,
    accountNumber: string,
    userId: string
  ): Promise<void> {
    logMessage(`Processing ${deleteOperations.length} delete operations for historical submissions...`);

    for (const submission of deleteOperations) {
      try {
        const deletedRowsCount = await CaseHistorySubmission.destroy({
          where: {
            rid: submission.history_submission_rid,
          },
        });
        results.push({
          action: "deleted",
          affectedRows: deletedRowsCount,
          fiscal_year: submission.fiscal_year,
          account_rid: historySubmissionRequest.account_rid,
          status: "success",
        });
      } catch (submissionError) {
        logMessage(
          `Error deleting historical submission for fiscal year ${submission.fiscal_year}: ${submissionError}`
        );
        results.push({
          action: "delete",
          fiscal_year: submission.fiscal_year,
          status: "failed",
          account_rid: historySubmissionRequest.account_rid,
          error: (submissionError as Error).message,
        });
      }
    }
  }

  /**
   * Processes edit operations for history submissions
   */
  private async processEditOperations(
    CaseHistorySubmission: any,
    editOperations: CaseHistorySubmission[],
    historySubmissionRequest: ICreateHistoricalSubmission,
    userId: string,
    results: any[],
    accountNumber: string
  ): Promise<void> {
    logMessage(`Processing ${editOperations.length} edit operations for history submissions...`);

    for (const submission of editOperations) {
      try {
        const isUnique = await this.checkUniqueFiscalYear(
          CaseHistorySubmission,
          historySubmissionRequest.account_rid,
          submission.fiscal_year,
          submission.country_rid,
          submission.state_rid || "",
          submission.history_submission_rid
        );

        if (!isUnique) {
          results.push({
            action: "edit",
            fiscal_year: submission.fiscal_year,
            account_rid: historySubmissionRequest.account_rid,
            status: "failed",
            error: "Another submission already exists for this account and fiscal year"
          });
          continue;
        }

        const [updatedRowsCount] = await CaseHistorySubmission.update(
          {
            fiscal_year: submission.fiscal_year,
            total_project: submission.total_project,
            total_qualified_project: submission.total_qualified_project,
            total_project_cost: submission.total_project_cost,
            total_qualified_project_cost: submission.total_qualified_project_cost,
            total_qre: submission.total_qre,
            total_rd_credits: submission.total_rd_credits,
            total_fte_cost: submission.total_fte_cost,
            total_subcon_cost: submission.total_subcon_cost,
            total_nonlabor_cost: submission.total_nonlabor_cost,
            country_rid: submission.country_rid,
            state_rid: submission.state_rid,
            annual_gross_receipts: submission.annual_gross_receipts,
            modified_by: userId,
            modified_datetime: new Date(),
          },
          {
            where: {
              rid: submission.history_submission_rid,
            },
          }
        );

        results.push({
          action: "updated",
          affectedRows: updatedRowsCount,
          fiscal_year: submission.fiscal_year,
          account_rid: historySubmissionRequest.account_rid,
          status: "success",
        });
      } catch (submissionError) {
        logMessage(
          `Error editing history submission for fiscal year ${submission.fiscal_year}: ${submissionError}`
        );
        results.push({
          action: "edit",
          fiscal_year: submission.fiscal_year,
          account_rid: historySubmissionRequest.account_rid,
          status: "failed",
          error: (submissionError as Error).message,
        });
      }
    }
  }

  /**
   * Processes add operations for history submissions
   */
  private async processAddOperations(
    CaseHistorySubmission: any,
    addOperations: CaseHistorySubmission[],
    historySubmissionRequest: ICreateHistoricalSubmission,
    userId: string,
    results: any[],
    accountNumber: string
  ): Promise<void> {
    logMessage(`Processing ${addOperations.length} add operations for history submissions...`);

    for (const submission of addOperations) {
      try {
        const isUnique = await this.checkUniqueFiscalYear(
          CaseHistorySubmission,
          historySubmissionRequest.account_rid,
          submission.fiscal_year,
          submission.country_rid,
          submission.state_rid || ""
        );

        if (!isUnique) {
          results.push({
            action: "add",
            fiscal_year: submission.fiscal_year,
            account_rid: historySubmissionRequest.account_rid,
            status: "failed",
            error: "A submission already exists for this account and fiscal year"
          });
          continue;
        }

        const newSubmission = await CaseHistorySubmission.create({
          account_rid: historySubmissionRequest.account_rid,
          fiscal_year: submission.fiscal_year,
          total_project: submission.total_project,
          total_qualified_project: submission.total_qualified_project,
          total_project_cost: submission.total_project_cost,
          total_qualified_project_cost: submission.total_qualified_project_cost,
          total_qre: submission.total_qre,
          total_rd_credits: submission.total_rd_credits,
          annual_gross_receipts: submission.annual_gross_receipts,
          total_fte_cost: submission.total_fte_cost,
          total_subcon_cost: submission.total_subcon_cost,
          total_nonlabor_cost: submission.total_nonlabor_cost,
          country_rid: submission.country_rid,
          state_rid: submission.state_rid,
          created_by: userId,
          created_datetime: new Date(),
        });

        results.push({
          action: "inserted",
          data: newSubmission,
          fiscal_year: submission.fiscal_year,
          account_rid: historySubmissionRequest.account_rid,
          status: "success",
        });
      } catch (submissionError) {
        logMessage(
          `Error adding history submission for fiscal year ${submission.fiscal_year}: ${submissionError}`
        );
        results.push({
          action: "add",
          fiscal_year: submission.fiscal_year,
          account_rid: historySubmissionRequest.account_rid,
          status: "failed",
          error: (submissionError as Error).message,
        });
      }
    }
    const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
      userId: userId!,
      eventType: eventTypes.UI_HANDLER
    });

    await this.helperMethod.createAccountTimelineEntry(accountNumber!, {
      created_by: userId!,
      account_rid: historySubmissionRequest.account_rid,
      entity_rid: historySubmissionRequest.account_rid,
      entity_name: entityTypes.HISTORICAL_SUBMISSION,
      created_by_name: userEventInfo.full_name,
      event_type_rid: userEventInfo.event_type_rid,
      event_name: eventNames.ADDED,
      descriptions: '',

    }, ["account"]);
  }

  /**
  * Generates the final response for history submission operations
  */
  private generateHistorySubmissionResponse(results: any[]) {
    const failedOperations = results.filter((r) => r.status === "failed");
    const successfulOperations = results.filter((r) => r.status === "success");
    const skippedOperations = results.filter((r) => r.status === "skipped");

    // Create summary message
    let summaryMessage = "";
    if (failedOperations.length === 0) {
      summaryMessage = "All history submission operations completed successfully";
    } else {
      const messages = [];
      if (successfulOperations.length > 0) {
        messages.push(`${successfulOperations.length} operations succeeded`);
      }
      if (failedOperations.length > 0) {
        messages.push(`${failedOperations.length} operations failed`);
      }
      if (skippedOperations.length > 0) {
        messages.push(`${skippedOperations.length} operations skipped`);
      }
      summaryMessage = messages.join(", ");
    }

    return {
      success: failedOperations.length === 0,
      message: summaryMessage,
      results: results,
      validationErrors: failedOperations.map((r) => ({
        fiscal_year: r.fiscal_year,
        account_rid: r.account_rid,
        error: r.error,
      })),
    };
  }

  async listHistoricalSubmission(
    accountNumber: string,
    data: any,
    userId: string,
    type: string = "list",
    currencyRid: string
  ) {
    try {
      const { CaseHistorySubmission } = await this.caseModelService.getModels(accountNumber);
      const whereConditions: any = {
        account_rid: data.account_rid,
        country_rid: data.country_rid
      };
      if (data.state_rid != null && data.state_rid !== "") {
        whereConditions.state_rid = data.state_rid;
      } else {
        whereConditions.state_rid = { [Op.or]: [{ [Op.is]: null }, ""] };
      }
      const queryOptions: any = {
        where: whereConditions,
        order: [["fiscal_year", "ASC"]],
        raw: true
      };
      let currencySymbol: string | null;
      let currencyId: string | null;
      if (currencyRid !== null) {
        const mainDb = await this.getMainDb();
        const getCurrencySymbol: any = await mainDb.query(rawQueries.getCurrencyDetails(currencyRid))
        if (getCurrencySymbol[0].length > 0) {
          currencySymbol = getCurrencySymbol[0][0].currency_symbol
          currencyId = getCurrencySymbol[0][0].rid
        } else {
          currencySymbol = null
          currencyId = null
        }
      }
      let historicalSubmissions = await CaseHistorySubmission.findAll(queryOptions);
      historicalSubmissions = historicalSubmissions.map((d: any) => {
        return {
          ...d,
          currency_rid: currencyId,
          currency_symbol: currencySymbol
        }
      })
      return historicalSubmissions;
    } catch (err) {
      logMessage(`Error in fetching historical submissions : ${err}`);
      errorLog("Error in fetching historical submissions:", (err as Error).message);
      return [];
    }
  }

  async createHistoricalSubmission(
    accountNumber: string,
    submissionRequest: ICreateHistoricalSubmission,
    userId: string
  ) {
    try {
      const { CaseHistorySubmission } = await this.caseModelService.getModels(accountNumber);
      const results: any[] = [];

      // Group operations by type for ordered processing
      const operationGroups = this.groupHistoricalSubmissionsByActionType(
        submissionRequest.historical_submissions
      );

      // Process operations in sequence: delete -> edit -> add
      await this.processDeleteOperations(
        CaseHistorySubmission,
        operationGroups.deleteOperations,
        results,
        submissionRequest,
        accountNumber,
        userId
      );
      await this.processEditOperations(
        CaseHistorySubmission,
        operationGroups.editOperations,
        submissionRequest,
        userId,
        results,
        accountNumber
      );
      await this.processAddOperations(
        CaseHistorySubmission,
        operationGroups.addOperations,
        submissionRequest,
        userId,
        results,
        accountNumber
      );

      // Generate response summary
      const response = this.generateHistorySubmissionResponse(results);

      return response;
    } catch (error) {
      logMessage(`Error managing historical submissions: ${error}`);
      throw new Error("Error managing historical submissions: " + error);
    }
  }
}