import { Sequelize, Transaction } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import CaseSchemaService from "../cases/schemaService";
import { logMessage, errorLog } from "../../utils/helpers";
import { ICreateHistoricalSubmission, CaseHistorySubmission } from "../../utils/types";
import { fetchCaseDetails } from "../../utils/rawQueries";
import { rawQueries, SCHEMANAME_PREFIX } from "../../utils/constants";

export class HistoricalSubmissionSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private caseModelService: CaseModelService;
  private caseSchemaService: CaseSchemaService;

  constructor() {
    this.caseModelService = new CaseModelService();
    this.caseSchemaService = new CaseSchemaService();
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
    results: any[]
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
    results: any[]
  ): Promise<void> {
    logMessage(`Processing ${editOperations.length} edit operations for history submissions...`);

    for (const submission of editOperations) {
      try {
        const [updatedRowsCount] = await CaseHistorySubmission.update(
          {
            fiscal_year: submission.fiscal_year,
            total_project: submission.total_project,
            total_qualified_project: submission.total_qualified_project,
            total_project_cost: submission.total_project_cost,
            total_qualified_project_cost: submission.total_qualified_project_cost,
            total_qre: submission.total_qre,
            total_rd_credits: submission.total_rd_credits,
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
          case_rid: submission.case_rid,
          status: "success",
        });
      } catch (submissionError) {
        logMessage(
          `Error editing history submission for fiscal year ${submission.fiscal_year}: ${submissionError}`
        );
        results.push({
          action: "edit",
          fiscal_year: submission.fiscal_year,
          case_rid: submission.case_rid,
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
    results: any[]
  ): Promise<void> {
    logMessage(`Processing ${addOperations.length} add operations for history submissions...`);

    for (const submission of addOperations) {
      try {
        const newSubmission = await CaseHistorySubmission.create({
          case_rid: historySubmissionRequest.case_rid,
          fiscal_year: submission.fiscal_year,
          total_project: submission.total_project,
          total_qualified_project: submission.total_qualified_project,
          total_project_cost: submission.total_project_cost,
          total_qualified_project_cost: submission.total_qualified_project_cost,
          total_qre: submission.total_qre,
          total_rd_credits: submission.total_rd_credits,
          annual_gross_receipts: submission.annual_gross_receipts,
          created_by: userId,
          created_datetime: new Date(),
        });

        results.push({
          action: "inserted",
          data: newSubmission,
          fiscal_year: submission.fiscal_year,
          case_rid: submission.case_rid,
          status: "success",
        });
      } catch (submissionError) {
        logMessage(
          `Error adding history submission for fiscal year ${submission.fiscal_year}: ${submissionError}`
        );
        results.push({
          action: "add",
          fiscal_year: submission.fiscal_year,
          case_rid: submission.case_rid,
          status: "failed",
          error: (submissionError as Error).message,
        });
      }
    }
  }

  /**
   * Generates a descriptive summary of history submission operations for timeline
   */
  private async generateTimelineDescription(results: any[], accountNumber: string): Promise<string> {
    const successful = results.filter((r) => r.status === "success");
    const failed = results.filter((r) => r.status === "failed");
    const skipped = results.filter((r) => r.status === "skipped");

    const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const allCaseRids = [
      ...new Set(
        [
          ...successful.map((r) => r.case_rid),
          ...failed.map((r) => r.case_rid),
          ...skipped.map((r) => r.case_rid),
        ].filter(Boolean)
      ),
    ];

    // Early return if no operations to process
    if (allCaseRids.length === 0) {
      return "No history submission operations performed";
    }

    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }

    // Fetch case details
    let caseDetailsMap = new Map();
    try {
      const caseDetails = await this.orgDbSequelize.query(
        rawQueries.fetchCasesByIds(schemaName),
        {
          replacements: { allCaseRids },
          type: "SELECT",
        }
      );

      // Convert array to map for easy lookup
      caseDetailsMap = new Map(
        caseDetails.map((caseDetail: any) => [caseDetail.rid, caseDetail])
      );
    } catch (error) {
      logMessage(`Error fetching case details: ${error}`);
      // Continue with empty map if case details fetch fails
    }

    const summaryParts: string[] = [];

    // Group successful operations by action type
    const successfulByAction = {
      added: successful.filter((r) => r.action === "inserted"),
      updated: successful.filter((r) => r.action === "updated"),
      deleted: successful.filter((r) => r.action === "deleted"),
    };

    // Helper function to get fiscal year summaries
    const getFiscalYearSummaries = (operations: any[]): string => {
      if (operations.length === 0) return "";

      return operations
        .map((r) => {
          const caseDetail = caseDetailsMap.get(r.case_rid);
          const caseName = caseDetail ? caseDetail.case_name : `Case ${r.case_rid}`;
          return `${caseName} for FY ${r.fiscal_year}`;
        })
        .join(", ");
    };

    // Add success descriptions with fiscal years
    if (successfulByAction.added.length > 0) {
      const fiscalYearDetails = getFiscalYearSummaries(successfulByAction.added);
      if (fiscalYearDetails) {
        summaryParts.push(`Added history submissions for: ${fiscalYearDetails}`);
      }
    }

    if (successfulByAction.updated.length > 0) {
      const fiscalYearDetails = getFiscalYearSummaries(successfulByAction.updated);
      if (fiscalYearDetails) {
        summaryParts.push(`Updated history submissions for: ${fiscalYearDetails}`);
      }
    }

    if (successfulByAction.deleted.length > 0) {
      const fiscalYearDetails = getFiscalYearSummaries(successfulByAction.deleted);
      if (fiscalYearDetails) {
        summaryParts.push(`Deleted history submissions for: ${fiscalYearDetails}`);
      }
    }

    // Add failure details with fiscal years if any
    if (failed.length > 0) {
      const failedFiscalYears = getFiscalYearSummaries(failed);
      if (failedFiscalYears) {
        summaryParts.push(`Failed operations for: ${failedFiscalYears}`);
      }
    }

    // Add skip details with fiscal years if any
    if (skipped.length > 0) {
      const skippedFiscalYears = getFiscalYearSummaries(skipped);
      if (skippedFiscalYears) {
        summaryParts.push(`Skipped operations for: ${skippedFiscalYears}`);
      }
    }

    // Return formatted description
    if (summaryParts.length === 0) {
      return "No history submission operations performed";
    }

    return summaryParts.join("; ") + ".";
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
        case_rid: r.case_rid,
        error: r.error,
      })),
    };
  }

  /**
   * Generates timeline entry for historical submission operations
   */
  private async addHistoricalSubmissionTimelineEntry(
    accountNumber: string,
    caseRid: string,
    accountRid: string,
    results: any[],
    userId: string,
    eventStatus: string,
    eventName: string = "",
    eventType: string = "",
    errorMessage?: string
  ) {
    try {
      let description = "";

      if (errorMessage) {
        description = `${errorMessage}`;
      } else {
        const summary = await this.generateTimelineDescription(results, accountNumber);
        description = `${summary}`;
      }

      await this.caseSchemaService.addCaseTimeline(
        accountNumber,
        caseRid,
        accountRid,
        description,
        userId,
        eventStatus,
        eventName,
        eventType
      );
    } catch (err) {
      logMessage(`Error adding historical submission timeline entry: ${err}`);
    }
  }

  async listHistoricalSubmission(
    accountNumber: string,
    data: any,
    userId: string,
    type: string = "list"
  ) {
    try {
      const { CaseHistorySubmission } = await this.caseModelService.getModels(accountNumber);
      const whereConditions: any = {
        case_rid: data.case_rid,
      };
      const queryOptions: any = {
        where: whereConditions,
        order: [["fiscal_year", "ASC"]],
      };
      const historicalSubmissions = await CaseHistorySubmission.findAll(queryOptions);
      return historicalSubmissions;
    } catch (err) {
      logMessage(`Error in fetching historical submissions: ${err}`);
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

      // Check if historical submissions already exist for this case
      const existingSubmissions = await CaseHistorySubmission.findAll({
        where: {
          case_rid: submissionRequest.case_rid,
        },
        raw: true,
      });

      const hasExistingSubmissions = existingSubmissions.length > 0;

      // Group operations by type for ordered processing
      const operationGroups = this.groupHistoricalSubmissionsByActionType(
        submissionRequest.historical_submissions
      );

      // Process operations in sequence: delete -> edit -> add
      await this.processDeleteOperations(
        CaseHistorySubmission,
        operationGroups.deleteOperations,
        results
      );
      await this.processEditOperations(
        CaseHistorySubmission,
        operationGroups.editOperations,
        submissionRequest,
        userId,
        results
      );
      await this.processAddOperations(
        CaseHistorySubmission,
        operationGroups.addOperations,
        submissionRequest,
        userId,
        results
      );

      // Generate response summary
      const response = this.generateHistorySubmissionResponse(results);

      // Determine event name based on existing submissions and operations
      let eventName = "Historical Submission Management";
      if (!hasExistingSubmissions && operationGroups.addOperations.length > 0) {
        eventName = "Historical Submission Added";
      } else if (
        hasExistingSubmissions &&
        (operationGroups.editOperations.length > 0 ||
          operationGroups.deleteOperations.length > 0 ||
          operationGroups.addOperations.length > 0)
      ) {
        eventName = "Historical Submission Updated";
      }

      // Add timeline entry for the submission management request
      await this.addHistoricalSubmissionTimelineEntry(
        accountNumber,
        submissionRequest.case_rid,
        submissionRequest.account_rid,
        results,
        userId,
        response.success ? "success" : "partial_success",
        eventName,
        "ui_handler"
      );

      return response;
    } catch (error) {
      logMessage(`Error managing historical submissions: ${error}`);

      // Add timeline entry for failed operation
      try {
        await this.addHistoricalSubmissionTimelineEntry(
          accountNumber,
          submissionRequest.case_rid,
          submissionRequest.account_rid,
          [],
          userId,
          "failed",
          "Historical Submission Management Failed",
          "historical_submission_management",
          `Error: ${(error as Error).message}`
        );
      } catch (timelineError) {
        logMessage(
          `Error adding timeline for failed operation: ${timelineError}`
        );
      }

      throw new Error("Error managing historical submissions: " + error);
    }
  }
}