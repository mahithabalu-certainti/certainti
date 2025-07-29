import { Request, Response } from "express";
import Configurations from "../config/config";
import { HttpStatus } from "../utils/constants";
import { errorLog, generateExcelBase64, handleErrorResponse, handleSuccessResponse, successLog, validateRequest } from "../utils/helpers";
import {v4 as uuid} from 'uuid'
import { exportListAccountLevelProjectCostsSchema, listAccountLevelProjectCostsSchema } from "../lib/joi/schemas/schema";

const services = Configurations.getInstance().getServices()
const financialService = services.financialHighlightServies;

async function listFinancialHighlightsAccounts (req : Request, res : Response) {
    try {
        const data = req.body;
        const result = await financialService.summaryHighlightsList(data)
        if(result.statusCode == HttpStatus.SUCCESS) {
            let resourceMetricArray = []
            let detailsMetricArray = []
            let claimJurisdictionArray = []
            resourceMetricArray.push({
                rid : uuid(),
                metric : result.data.resource_metrics.metric,
                fte : result.data.resource_metrics.fte,
                subcon : result.data.resource_metrics.subcon,
                nonlabor: result.data.resource_metrics?.nonlabor == undefined ? 0 : result.data.resource_metrics.nonlabor
                
            })
            detailsMetricArray.push({
                rid : uuid(),
                metric_name : result.data.fte_hours.metric_name,
                project_level : result.data.fte_hours.project_level,
                project_resource_level : result.data.fte_hours.project_resource_level,
                project_task_level : result.data.fte_hours.project_task_level
            })
            detailsMetricArray.push({
                rid : uuid(),
                metric_name : result.data.fte_cost.metric_name,
                project_level : result.data.fte_cost.project_level,
                project_resource_level : result.data.fte_cost.project_resource_level,
                project_task_level : result.data.fte_cost.project_task_level
            })
            detailsMetricArray.push({
                rid : uuid(),
                metric_name : result.data.subcon_hours.metric_name,
                project_level : result.data.subcon_hours.project_level,
                project_resource_level : result.data.subcon_hours.project_resource_level,
                project_task_level : result.data.subcon_hours.project_task_level
            })
            detailsMetricArray.push({
                rid : uuid(),
                metric_name : result.data.subcon_cost.metric_name,
                project_level : result.data.subcon_cost.project_level,
                project_resource_level : result.data.subcon_cost.project_resource_level,
                project_task_level : result.data.subcon_cost.project_task_level
            })
            detailsMetricArray.push({
                rid : uuid(),
                metric_name : result.data.nonlabor_cost.metric_name,
                project_level : result.data.nonlabor_cost.project_level,
                project_resource_level : result.data.nonlabor_cost.project_resource_level
            })
            claimJurisdictionArray.push({
                rid : uuid(),
                name : result.data.federal.name,
                rd_credits_fte : result.data.federal.rd_credits_fte,
                rd_credits_subcon : result.data.federal.rd_credits_subcon,
                rd_credits_nonlabor : result.data.federal.rd_credits_nonlabor,
                rd_credits_total : result.data.federal.rd_credits_total
            })
            claimJurisdictionArray.push({
                rid : uuid(),
                name : result.data.state_wise.name,
                rd_credits_fte : result.data.state_wise.rd_credits_fte,
                rd_credits_subcon : result.data.state_wise.rd_credits_subcon,
                rd_credits_nonlabor : result.data.state_wise.rd_credits_nonlabor,
                rd_credits_total : result.data.state_wise.rd_credits_total
            })
            claimJurisdictionArray.push({
                rid : uuid(),
                name : result.data.grand_total.name,
                rd_credits_fte : result.data.grand_total.rd_credits_fte,
                rd_credits_subcon : result.data.grand_total.rd_credits_subcon,
                rd_credits_nonlabor : result.data.grand_total.rd_credits_nonlabor,
                rd_credits_total : result.data.grand_total.rd_credits_total
            })
            let finalData = {
                account_rid : data.account_rid,
                fiscal_year : data.fiscal_year,
                rd_eligible_projects :  result.data.resource_metrics.total_projects_rd_credits,
                resource_metrics : resourceMetricArray,
                detailed_metrics : detailsMetricArray,
                claim_jurisdiction : claimJurisdictionArray
            }
            handleSuccessResponse(res, finalData)
            return;
        }
        else {
            handleSuccessResponse(res, null)
            return;
        }
    } catch (error : any) {
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, error.message)
    }
}

async function listFinancialHighlightsProjects (req : Request, res : Response) {
    try {
        const data = req.body;
        const result = await financialService.projectFinancialHighlights(data)
        if(result.statusCode == HttpStatus.SUCCESS) {
            let resourceMetricArray = []
            let detailsMetricArray = []
            let rdPercentArray = []
            let qreArray = []
            let rdCreditsArray = []
            let claimJurisdictionArray = []

            resourceMetricArray.push({
                rid : uuid(),
                metric : result.data.resource_metrics.metric,
                fte : result.data.resource_metrics.fte,
                subcon : result.data.resource_metrics.subcon,
                nonlabor : result.data.resource_metrics.nonlabor
            })
            detailsMetricArray.push({
                rid : uuid(),
                metric_name : result.data.fte_hours.metric_name,
                project_level : result.data.fte_hours.project_level,
                project_resource_level : result.data.fte_hours.project_resource_level,
                project_task_level : result.data.fte_hours.project_task_level
            })
            detailsMetricArray.push({
                rid : uuid(),
                metric_name : result.data.fte_cost.metric_name,
                project_level : result.data.fte_cost.project_level,
                project_resource_level : result.data.fte_cost.project_resource_level,
                project_task_level : result.data.fte_cost.project_task_level
            })
            detailsMetricArray.push({
                rid : uuid(),
                metric_name : result.data.subcon_hours.metric_name,
                project_level : result.data.subcon_hours.project_level,
                project_resource_level : result.data.subcon_hours.project_resource_level,
                project_task_level : result.data.subcon_hours.project_task_level
            })
            detailsMetricArray.push({
                rid : uuid(),
                metric_name : result.data.subcon_cost.metric_name,
                project_level : result.data.subcon_cost.project_level,
                project_resource_level : result.data.subcon_cost.project_resource_level,
                project_task_level : result.data.subcon_cost.project_task_level
            })
            detailsMetricArray.push({
                rid : uuid(),
                metric_name : result.data.nonlabor_cost.metric_name,
                project_level : result.data.nonlabor_cost.project_level,
                project_resource_level : result.data.nonlabor_cost.project_resource_level
            })
            rdCreditsArray.push({
                rid : uuid(),
                name : result.data.rd_credits.name,
                rd_credits_fte : result.data.rd_credits.rd_credits_fte,
                rd_credits_subcon : result.data.rd_credits.rd_credits_subcon,
                rd_credits_nonlabor : result.data.rd_credits.rd_credits_nonlabor,
                rd_credits_total : result.data.rd_credits.rd_credits_total
            })
            qreArray.push({
                rid : uuid(),
                name : result.data.qre.name,
                qre_fte : result.data.qre.qre_fte,
                qre_subcon : result.data.qre.qre_subcon,
                qre_nonlabor : result.data.qre.qre_nonlabor,
                qre_final : result.data.qre.qre_final
            })
            rdPercentArray.push({
                rid : uuid(),
                name : result.data.rd_percent.name,
                rd_percent_potential : result.data.rd_percent.rd_percent_potential,
                rd_percent_adjustment : result.data.rd_percent.rd_percent_adjustment,
                rd_percent_final : result.data.rd_percent.rd_percent_final
            })
            claimJurisdictionArray.push({
                rid : uuid(),
                name : result.data.federal.name,
                rd_credits_fte : result.data.federal.rd_credits_fte,
                rd_credits_subcon : result.data.federal.rd_credits_subcon,
                rd_credits_nonlabor : result.data.federal.rd_credits_nonlabor,
            })
            claimJurisdictionArray.push({
                rid : uuid(),
                name : result.data.state_wise.name,
                rd_credits_fte : result.data.state_wise.rd_credits_fte,
                rd_credits_subcon : result.data.state_wise.rd_credits_subcon,
                rd_credits_nonlabor : result.data.state_wise.rd_credits_nonlabor
            })
            claimJurisdictionArray.push({
                rid : uuid(),
                name : result.data.grand_total.name,
                rd_credits_fte : result.data.grand_total.rd_credits_fte,
                rd_credits_subcon : result.data.grand_total.rd_credits_subcon,
                rd_credits_nonlabor : result.data.grand_total.rd_credits_nonlabor
            })
            let finalData = {
                account_rid : data.account_rid,
                fiscal_year : data.fiscal_year,
                project_name :  result.data.resource_metrics.project_name,
                resource_metrics : resourceMetricArray,
                detailed_metrics : detailsMetricArray,
                claim_jurisdiction : claimJurisdictionArray,
                rd_percent : rdPercentArray,
                qre : qreArray,
                rd_credits : rdCreditsArray,
                claim_status : {
                    status : result.data.resource_metrics.claim_status
                }
            }
            handleSuccessResponse(res, finalData)
            return;
        }
        else {
            handleSuccessResponse(res, null)
            return;
        }
    } catch (error : any) {
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, error.message)
    }
}

async function financialHighlightsProjectCostAccountLevel(req: Request, res: Response): Promise<void> {
  const methodName = "All financialHighlightsProjectCostAccountLevel List";
  try {
    const value = await validateRequest(req, listAccountLevelProjectCostsSchema, res, "GET");

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


    const projectCosts = await financialService.listAccountLevelProjectCostFinancialHighlights(
        value.accountRid,
        parsedFilters,
        value.search,
        value.fiscalYear,
        value.page,
        value.limit,
        value.sortBy,
        value.sortOrder
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
     handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, error.message)
  }
}

async function exportFinancialHighlightsProjectCostAccountLevel(req: Request, res: Response): Promise<void> {
  const methodName = "All financialHighlightsProjectCostAccountLevel List";
  try {
    const value = await validateRequest(req, exportListAccountLevelProjectCostsSchema, res, "GET");

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


    const projectCosts = await financialService.exportListAccountLevelProjectCostFinancialHighlights(
        value.accountRid,
        parsedFilters,
        value.search,
        value.fiscalYear,
        value.sortBy,
        value.sortOrder
    );

    if (projectCosts.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, await generateExcelBase64(projectCosts?.data?.summaries, "Export All Project Costs"));
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
     handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, error.message)
  }
}

export default {
    listFinancialHighlightsAccounts,
    listFinancialHighlightsProjects,
    financialHighlightsProjectCostAccountLevel,
    exportFinancialHighlightsProjectCostAccountLevel
}