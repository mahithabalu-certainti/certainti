import { Request, Response } from "express";
import Configurations from "../config/config";
import { HttpStatus } from "../utils/constants";
import { errorLog, generateExcelBase64, handleErrorResponse, handleSuccessResponse, logMessage, successLog, validateRequest } from "../utils/helpers";
import {v4 as uuid} from 'uuid'
import { exportListAccountLevelProjectCostsSchema, listAccountLevelProjectCostsSchema } from "../lib/joi/schemas/schema";
import { permission } from "process";

const services = Configurations.getInstance().getServices();
const financialService = services.financialHighlightServies;

/**
 * Handles the API request to fetch and format financial highlight data at the **account level**.
 *
 * Retrieves data including resource metrics, detailed metrics (FTE/Subcon/Nonlabor), and claim jurisdiction R&D credits
 * by calling the financial service. The data is transformed and structured for frontend consumption and returned via HTTP response.
 *
 * @async
 * @function
 * @param {Request} req - Express request object containing body with required fields:
 *   - `account_rid` (string): Unique identifier for the account
 *   - `fiscal_year` (number): Fiscal year to fetch data for
 * @param {Response} res - Express response object used to send the final result
 *
 * @returns {Promise<void>} Sends a formatted financial highlights object via `res`. Includes:
 *   - `resource_metrics`: Summary of FTE/Subcon/Nonlabor metrics
 *   - `detailed_metrics`: Project-level breakdown of hours and costs
 *   - `claim_jurisdiction`: R&D credit claims per jurisdiction (federal, state, total)
 *   - `rd_eligible_projects`: Count of R&D eligible projects
 *   - `fiscal_year`, `account_rid`
 *
 * @throws Will return a failure response via `res` if any error is thrown during processing.
 */
async function listFinancialHighlightsAccounts(req: Request, res: Response) {
  try {
    const data = req.body;
    logMessage(`listFinancialHighlightsAccounts params received: ${JSON.stringify(data)}`);
    const result = await financialService.summaryHighlightsList(data);
    if (result.statusCode == HttpStatus.SUCCESS) {
      let resourceMetricArray = [];
      let detailsMetricArray = [];
      let claimJurisdictionArray = [];

      resourceMetricArray.push({
        rid: uuid(),
        metric: result.data.resource_metrics.metric,
        fte:
          result.data.resource_metrics.fte == undefined
            ? "0"
            : Number(result.data.resource_metrics.fte).toFixed(0),
        subcon:
          result.data.resource_metrics.subcon == undefined
            ? "0"
            : Number(result.data.resource_metrics.subcon).toFixed(0),
        nonlabor:
          result.data.resource_metrics?.nonlabor == undefined
            ? "0"
            : Number(result.data.resource_metrics.nonlabor).toFixed(0),
      });

      detailsMetricArray.push({
        rid: uuid(),
        metric_name: result.data.fte_hours.metric_name,
        permission: result.data.fte_hours.permission,
        project_level: Number(result.data.fte_hours.project_level).toFixed(2),
        project_resource_level: Number(
          result.data.fte_hours.project_resource_level
        ).toFixed(2),
        project_task_level: Number(
          result.data.fte_hours.project_task_level
        ).toFixed(2),
      });
      detailsMetricArray.push({
        rid: uuid(),
        metric_name: result.data.fte_cost.metric_name,
        permission: result.data.fte_cost.permission,
        project_level: Number(result.data.fte_cost.project_level).toFixed(2),
        project_resource_level: Number(
          result.data.fte_cost.project_resource_level
        ).toFixed(2),
        project_task_level: Number(
          result.data.fte_cost.project_task_level
        ).toFixed(2),
      });
      detailsMetricArray.push({
        rid: uuid(),
        metric_name: result.data.subcon_hours.metric_name,
        permission: result.data.subcon_hours.permission,
        project_level: Number(result.data.subcon_hours.project_level).toFixed(
          2
        ),
        project_resource_level: Number(
          result.data.subcon_hours.project_resource_level
        ).toFixed(2),
        project_task_level: Number(
          result.data.subcon_hours.project_task_level
        ).toFixed(2),
      });
      detailsMetricArray.push({
        rid: uuid(),
        metric_name: result.data.subcon_cost.metric_name,
        permission: result.data.subcon_cost.permission,
        project_level: Number(result.data.subcon_cost.project_level).toFixed(2),
        project_resource_level: Number(
          result.data.subcon_cost.project_resource_level
        ).toFixed(2),
        project_task_level: Number(
          result.data.subcon_cost.project_task_level
        ).toFixed(2),
      });
      detailsMetricArray.push({
        rid: uuid(),
        metric_name: result.data.nonlabor_cost.metric_name,
        permission: result.data.nonlabor_cost.permission,
        project_level: Number(result.data.nonlabor_cost.project_level).toFixed(
          2
        ),
        project_resource_level: Number(
          result.data.nonlabor_cost.project_resource_level
        ).toFixed(2),
      });
      if(data.summaryType !== 'state') {
        claimJurisdictionArray.push({
        rid: uuid(),
        name: result.data.federal.name,
        rd_credits_fte: Number(result.data.federal.rd_credits_fte).toFixed(2),
        rd_credits_subcon: Number(
          result.data.federal.rd_credits_subcon
        ).toFixed(2),
        rd_credits_nonlabor: Number(
          result.data.federal.rd_credits_nonlabor
        ).toFixed(2),
        rd_credits_total: Number(result.data.federal.rd_credits_total).toFixed(
          2
        ),
      });
      claimJurisdictionArray.push({
        rid: uuid(),
        name: result.data.state_wise.name,
        rd_credits_fte: Number(result.data.state_wise.rd_credits_fte).toFixed(
          2
        ),
        rd_credits_subcon: Number(
          result.data.state_wise.rd_credits_subcon
        ).toFixed(2),
        rd_credits_nonlabor: Number(
          result.data.state_wise.rd_credits_nonlabor
        ).toFixed(2),
        rd_credits_total: Number(
          result.data.state_wise.rd_credits_total
        ).toFixed(2),
      });
       claimJurisdictionArray.push({
        rid: uuid(),
        name: result.data.grand_total.name,
        rd_credits_fte: Number(result.data.grand_total.rd_credits_fte).toFixed(
          2
        ),
        rd_credits_subcon: Number(
          result.data.grand_total.rd_credits_subcon
        ).toFixed(2),
        rd_credits_nonlabor: Number(
          result.data.grand_total.rd_credits_nonlabor
        ).toFixed(2),
        rd_credits_total: Number(
          result.data.grand_total.rd_credits_total
        ).toFixed(2),
      });
      } else {
        claimJurisdictionArray.push({
        rid: uuid(),
        name: result.data.state_wise.name,
        rd_credits_fte: Number(result.data.state_wise.rd_credits_fte).toFixed(
          2
        ),
        rd_credits_subcon: Number(
          result.data.state_wise.rd_credits_subcon
        ).toFixed(2),
        rd_credits_nonlabor: Number(
          result.data.state_wise.rd_credits_nonlabor
        ).toFixed(2),
        rd_credits_total: Number(
          result.data.state_wise.rd_credits_total
        ).toFixed(2),
      });
      }

      let finalData = {
        account_rid: data.account_rid,
        fiscal_year: data.fiscal_year,
        rd_eligible_projects:
          result.data.resource_metrics.total_projects_rd_credits,
        resource_metrics: resourceMetricArray,
        detailed_metrics: detailsMetricArray,
        claim_jurisdiction: claimJurisdictionArray,
      };

      handleSuccessResponse(res, finalData);
      return;
    } else {
      handleSuccessResponse(res, null);
      return;
    }
  } catch (error: any) {
    logMessage(`Error in listFinancialHighlightsAccounts: ${error.message}`);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Handles the API request to fetch and format financial highlight data at the **account level**.
 *
 * Retrieves data including resource metrics, detailed metrics (FTE/Subcon/Nonlabor), and claim jurisdiction R&D credits
 * by calling the financial service. The data is transformed and structured for frontend consumption and returned via HTTP response.
 *
 * @async
 * @function
 * @param {Request} req - Express request object containing body with required fields:
 *   - `account_rid` (string): Unique identifier for the account
 *   - `fiscal_year` (number): Fiscal year to fetch data for
 * @param {Response} res - Express response object used to send the final result
 *
 * @returns {Promise<void>} Sends a formatted financial highlights object via `res`. Includes:
 *   - `resource_metrics`: Summary of FTE/Subcon/Nonlabor metrics
 *   - `detailed_metrics`: Project-level breakdown of hours and costs
 *   - `claim_jurisdiction`: R&D credit claims per jurisdiction (federal, state, total)
 *   - `rd_eligible_projects`: Count of R&D eligible projects
 *   - `fiscal_year`, `account_rid`
 *
 * @throws Will return a failure response via `res` if any error is thrown during processing.
 */
async function listFinancialHighlightsProjects(req: Request, res: Response) {
  try {
    const data = req.body;
    logMessage(`listFinancialHighlightsProjects params received: ${JSON.stringify(data)}`);
    const result = await financialService.projectFinancialHighlights(data);
    if (result.statusCode == HttpStatus.SUCCESS) {
      let resourceMetricArray = [];
      let detailsMetricArray = [];
      let rdPercentArray = [];
      let qreArray = [];
      let rdCreditsArray = [];
      let claimJurisdictionArray = [];

      resourceMetricArray.push({
        rid: uuid(),
        metric: result.data.resource_metrics.metric,
        fte: Number(result.data.resource_metrics.fte).toFixed(0),
        subcon: Number(result.data.resource_metrics.subcon).toFixed(0),
        nonlabor: Number(result.data.resource_metrics.nonlabor).toFixed(0),
      });
      detailsMetricArray.push({
        rid: uuid(),
        metric_name: result.data.fte_hours.metric_name,
        permission: result.data.fte_hours.permission,
        project_level: Number(result.data.fte_hours.project_level).toFixed(2),
        project_resource_level: Number(
          result.data.fte_hours.project_resource_level
        ).toFixed(2),
        project_task_level: Number(
          result.data.fte_hours.project_task_level
        ).toFixed(2),
      });
      detailsMetricArray.push({
        rid: uuid(),
        metric_name: result.data.fte_cost.metric_name,
        permission: result.data.fte_cost.permission,
        project_level: Number(result.data.fte_cost.project_level).toFixed(2),
        project_resource_level: Number(
          result.data.fte_cost.project_resource_level
        ).toFixed(2),
        project_task_level: Number(
          result.data.fte_cost.project_task_level
        ).toFixed(2),
      });
      detailsMetricArray.push({
        rid: uuid(),
        metric_name: result.data.subcon_hours.metric_name,
        permission: result.data.subcon_hours.permission,
        project_level: Number(result.data.subcon_hours.project_level).toFixed(
          2
        ),
        project_resource_level: Number(
          result.data.subcon_hours.project_resource_level
        ).toFixed(2),
        project_task_level: Number(
          result.data.subcon_hours.project_task_level
        ).toFixed(2),
      });
      detailsMetricArray.push({
        rid: uuid(),
        metric_name: result.data.subcon_cost.metric_name,
        permission: result.data.subcon_cost.permission,
        project_level: Number(result.data.subcon_cost.project_level).toFixed(2),
        project_resource_level: Number(
          result.data.subcon_cost.project_resource_level
        ).toFixed(2),
        project_task_level: Number(
          result.data.subcon_cost.project_task_level
        ).toFixed(2),
      });
      detailsMetricArray.push({
        rid: uuid(),
        metric_name: result.data.nonlabor_cost.metric_name,
        permission: result.data.nonlabor_cost.permission,
        project_level: Number(result.data.nonlabor_cost.project_level).toFixed(
          2
        ),
        project_resource_level: Number(
          result.data.nonlabor_cost.project_resource_level
        ).toFixed(2),
      });
      rdCreditsArray.push({
        rid: uuid(),
        name: result.data.rd_credits.name,
        rd_credits_fte: Number(result.data.rd_credits.rd_credits_fte).toFixed(
          2
        ),
        rd_credits_subcon: Number(
          result.data.rd_credits.rd_credits_subcon
        ).toFixed(2),
        rd_credits_nonlabor: Number(
          result.data.rd_credits.rd_credits_nonlabor
        ).toFixed(2),
        rd_credits_total: Number(
          result.data.rd_credits.rd_credits_total
        ).toFixed(2),
      });
      qreArray.push({
        rid: uuid(),
        name: result.data.qre.name,
        qre_fte: Number(result.data.qre.qre_fte).toFixed(2),
        qre_subcon: Number(result.data.qre.qre_subcon).toFixed(2),
        qre_nonlabor: Number(result.data.qre.qre_nonlabor).toFixed(2),
        qre_final: Number(result.data.qre.qre_final).toFixed(2),
      });
      rdPercentArray.push({
        rid: uuid(),
        name: result.data.rd_percent.name,
        rd_percent_potential: Number(
          result.data.rd_percent.rd_percent_potential
        ).toFixed(2),
        rd_percent_adjustment: Number(
          result.data.rd_percent.rd_percent_adjustment
        ).toFixed(2),
        rd_percent_final: Number(
          result.data.rd_percent.rd_percent_final
        ).toFixed(2),
      });
      claimJurisdictionArray.push({
        rid: uuid(),
        name: result.data.federal.name,
        claim_rd_credits_fte: Number(
          result.data.federal.rd_credits_fte
        ).toFixed(2),
        claim_rd_credits_subcon: Number(
          result.data.federal.rd_credits_subcon
        ).toFixed(2),
        claim_rd_credits_nonlabor: Number(
          result.data.federal.rd_credits_nonlabor
        ).toFixed(2),
        claim_rd_credits_total: result.data.federal.rd_credits_total,
      });
      claimJurisdictionArray.push({
        rid: uuid(),
        name: result.data.state_wise.name,
        claim_rd_credits_fte: Number(
          result.data.state_wise.rd_credits_fte
        ).toFixed(2),
        claim_rd_credits_subcon: Number(
          result.data.state_wise.rd_credits_subcon
        ).toFixed(2),
        claim_rd_credits_nonlabor: Number(
          result.data.state_wise.rd_credits_nonlabor
        ).toFixed(2),
        claim_rd_credits_total: result.data.state_wise.rd_credits_total,
      });
      claimJurisdictionArray.push({
        rid: uuid(),
        name: result.data.grand_total.name,
        claim_rd_credits_fte: Number(
          result.data.grand_total.rd_credits_fte
        ).toFixed(2),
        claim_rd_credits_subcon: Number(
          result.data.grand_total.rd_credits_subcon
        ).toFixed(2),
        claim_rd_credits_nonlabor: Number(
          result.data.grand_total.rd_credits_nonlabor
        ).toFixed(2),
        claim_rd_credits_total: result.data.grand_total.rd_credits_total,
      });
      let finalData = {
        account_rid: data.account_rid,
        fiscal_year: data.fiscal_year,
        project_name: result.data.resource_metrics.project_name,
        resource_metrics: resourceMetricArray,
        detailed_metrics: detailsMetricArray,
        claim_jurisdiction: claimJurisdictionArray,
        rd_percent: rdPercentArray,
        qre: qreArray,
        rd_credits: rdCreditsArray,
        claim_status: {
          status: result.data.resource_metrics.claim_status,
        },
      };
      handleSuccessResponse(res, finalData);
      return;
    } else {
      handleSuccessResponse(res, null);
      return;
    }
  } catch (error: any) {
    
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Lists **project cost financial highlights** at the account level with support for filters, search, sorting, and pagination.
 *
 * Validates the request against a schema, checks for user ID in headers, parses filters,
 * and retrieves data from the financial service. Sends structured project cost data via response.
 *
 * @async
 * @function
 * @param {Request} req - Express request object, including query parameters and headers:
 *   - `filters` (optional, JSON string): Additional filtering criteria
 *   - `search` (optional): Search term
 *   - `fiscalYear`, `page`, `limit`, `sortBy`, `sortOrder`
 *   - Header: `x-user-id` (required)
 * @param {Response} res - Express response object used to send back the list
 *
 * @returns {Promise<void>} Sends paginated and sorted list of account-level project cost summaries
 *
 * @throws Will return an error response if validation fails or user ID is missing.
 */
async function financialHighlightsProjectCostAccountLevel(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "All financialHighlightsProjectCostAccountLevel List";
  try {
    const value = await validateRequest(
      req,
      listAccountLevelProjectCostsSchema,
      res,
      "GET"
    );

    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    let parsedFilters: Record<string, any> = {};

    if (!value) {
      return;
    }

    try {
      if (value.filters) {
        parsedFilters = JSON.parse(value.filters);
      }
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const projectCosts =
      await financialService.listAccountLevelProjectCostFinancialHighlights(
        value.accountRid,
        parsedFilters,
        value.search,
        value.fiscalYear,
        value.page,
        value.limit,
        value.sortBy,
        value.sortOrder,
        value.caseRid
      );

    if (projectCosts.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, projectCosts.data);
      return;
    } else {
      errorLog(methodName, projectCosts.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        projectCosts.errorMessage
      );
      return;
    }
  } catch (error:any) {
    logMessage(`Error in financialHighlightsProjectCostAccountLevel: ${error.message}`);
     handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, error.message)
  }
}

/**
 * Exports **project cost financial highlights** at the account level as a base64-encoded Excel file.
 *
 * Validates the request, parses filters, fetches data, and converts the response to Excel format using `generateExcelBase64`.
 * Requires `x-user-id` in headers.
 *
 * @async
 * @function
 * @param {Request} req - Express request object including:
 *   - `filters` (optional, JSON string)
 *   - `search`, `fiscalYear`, `sortBy`, `sortOrder`
 *   - Header: `x-user-id` (required)
 * @param {Response} res - Express response object used to send base64 Excel data
 *
 * @returns {Promise<void>} Sends an Excel file (base64) via HTTP response if export succeeds
 *
 * @throws Will return an error response if validation fails, user ID is missing, or export errors occur.
 */
async function exportFinancialHighlightsProjectCostAccountLevel(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "All financialHighlightsProjectCostAccountLevel List";
  try {
    const value = await validateRequest(
      req,
      exportListAccountLevelProjectCostsSchema,
      res,
      "GET"
    );

    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    let parsedFilters: Record<string, any> = {};

    if (!value) {
      return;
    }

    try {
      if (value.filters) {
        parsedFilters = JSON.parse(value.filters);
      }
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const projectCosts =
      await financialService.exportListAccountLevelProjectCostFinancialHighlights(
        value.accountRid,
        parsedFilters,
        value.search,
        value.fiscalYear,
        value.sortBy,
        value.sortOrder,
        value.caseRid
      );

    if (projectCosts.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(
        res,
        await generateExcelBase64(
          projectCosts?.data?.summaries,
          "Export All Project Costs"
        )
      );
      return;
    } else {
      errorLog(methodName, projectCosts.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        projectCosts.errorMessage
      );
      return;
    }
  } catch (error:any) {
    logMessage(`Error in exportFinancialHighlightsProjectCostAccountLevel: ${error.message}`);
     handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, error.message)
  }
}

/**
 * Fetches **region-level financial highlights** based on account, fiscal year, and country ID.
 *
 * Calls a service to retrieve region data specific to an account and fiscal year combination for a given country.
 *
 * @async
 * @function
 * @param {Request} req - Express request object with `params`:
 *   - `accountId` (string)
 *   - `fiscalYear` (number or string)
 *   - `countryId` (string)
 * @param {Response} res - Express response object used to return the region data
 *
 * @returns {Promise<void>} Sends region-wise financial highlight data via response
 *
 * @throws Will return an error response if the service call fails or input is invalid.
 */
async function fetchRegionsFromAccountFiscalRegions(
  req: Request,
  res: Response
) {
  try {
    const { accountId, fiscalYear, countryId } = req.params;
    const data: any = {};
    data.account_rid = accountId;
    data.fiscal_year = fiscalYear;
    data.country_rid = countryId;
    const result = await services.financialHighlightServies.fetchRegions(data);
    handleSuccessResponse(res, result);
    return;
  } catch (error: any) {
    logMessage(`Error in fetchRegionsFromAccountFiscalRegions: ${error.message}`);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

export default {
  listFinancialHighlightsAccounts,
  listFinancialHighlightsProjects,
  financialHighlightsProjectCostAccountLevel,
  exportFinancialHighlightsProjectCostAccountLevel,
  fetchRegionsFromAccountFiscalRegions,
};
