import { Request, Response } from "express";
import Configurations from "../config/config";
import { HttpStatus } from "../utils/constants";
import { handleErrorResponse, handleSuccessResponse } from "../utils/helpers";
import {v4 as uuid} from 'uuid'

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
                subcon : result.data.resource_metrics.subcon
                
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
                metric_name : result.data.nonlabor_cost.metric_name,
                project_level : result.data.nonlabor_cost.project_level,
                project_resource_level : result.data.nonlabor_cost.project_resource_level
            })
            claimJurisdictionArray.push({
                rid : uuid(),
                name : result.data.federal.name,
                rd_credits_fte : result.data.federal.rd_credits_fte,
                rd_credits_subcon : result.data.federal.rd_credits_subcon,
            })
            claimJurisdictionArray.push({
                rid : uuid(),
                name : result.data.state_wise.name,
                rd_credits_fte : result.data.state_wise.rd_credits_fte,
                rd_credits_subcon : result.data.state_wise.rd_credits_subcon
            })
            claimJurisdictionArray.push({
                rid : uuid(),
                name : result.data.grand_total.name,
                rd_credits_fte : result.data.grand_total.rd_credits_fte,
                rd_credits_subcon : result.data.grand_total.rd_credits_subcon
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

export default {
    listFinancialHighlightsAccounts
}