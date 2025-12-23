import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import {
    errorLog,
    generateExcelBase64,
    handleErrorResponse,
    handleSuccessResponse,
    logMessage,
    successLog,
    validateRequest,
} from "../utils/helpers";
import { listResourceCostSchemaForFinancialHighlights } from "../lib/joi/schemas/schema";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const projectService = services.projectService;

/**
 * Retrieves a specific project's details by account and project IDs.
 *
 * @async
 * @function projectById
 * @param {Request} req - The Express request object with `accountId` and `projectId` as route params.
 * @param {Response} res - The Express response object to send the result.
 * @returns {Promise<void>} Sends project details or error response.
 *
 * @description
 * - Calls `projectService.projectById` using provided params.
 * - Sends back the project info or an appropriate error message.
 */
async function projectById(req: Request, res: Response): Promise<void> {
    const methodName = "Project Details";
    try {
        const { accountId, projectId, caseId } = req.query;
        logMessage(`Project Details - Request received for Account ID: ${accountId}, Project ID: ${projectId}`);

        const project = await projectService.projectById(accountId as string, projectId as string, caseId as string);

        if (project.statusCode === HttpStatus.SUCCESS) {
            successLog(methodName);
            handleSuccessResponse(res, project.data);
            return;
        } else {
            errorLog(methodName, project.errorMessage);
            handleErrorResponse(
                res,
                HttpStatus.BAD_REQUEST,
                HttpStatus.BAD_REQUEST_MESSAGE,
                project.errorMessage
            );
            return;
        }
    } catch (err) {
        const error = err as Error;
        errorLog(methodName, error.message);
        handleErrorResponse(
            res,
            HttpStatus.BAD_REQUEST,
            HttpStatus.BAD_REQUEST_MESSAGE,
            error.message
        );
        return;
    }
}

async function listFinancialHighlightsProjects(req: Request, res: Response) {
    try {
        const data = req.body;
        logMessage(`listFinancialHighlightsProjects params received: ${JSON.stringify(data)}`);
        const result = await projectService.projectFinancialHighlights(data);
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


async function resourceCostsForFinancialHighlights(
    req: Request,
    res: Response
): Promise<void> {
    const methodName = "resourceCosts For FinancialHighlights";
    try {
        const value = await validateRequest(
            req,
            listResourceCostSchemaForFinancialHighlights,
            res,
            "GET"
        );
        logMessage(`Resource Costs For Financial Highlights payload received: ${JSON.stringify(value)} User Id: ${req.headers["x-user-id"]}`);

        let parsedFilters: Record<string, any> = {};

        if (!value) {
            return;
        }

        try {
            parsedFilters = JSON.parse(value.filters);
        } catch (error) {
            errorLog(
                methodName,
                "Invalid filters format. Must be a valid JSON object."
            );
        }

        const pageNum: number = parseInt(value.page, 10) || 1;
        const limitNum: number = parseInt(value.limit, 10) || 10;

        const resourceCost =
            await projectService.resourceCostsForFinancialHighlights(
                pageNum,
                limitNum,
                value.search,
                parsedFilters,
                value.sortBy,
                value.sortOrder,
                value.accountNumber,
                value.fiscalYear,
                value.caseRid,
                value.accountRid,
                value.projectRid
            );

        if (resourceCost.statusCode === HttpStatus.SUCCESS) {
            successLog(methodName);
            handleSuccessResponse(res, resourceCost.data);
        } else {
            errorLog(methodName, resourceCost.errorMessage);
            handleErrorResponse(
                res,
                HttpStatus.BAD_REQUEST,
                HttpStatus.BAD_REQUEST_MESSAGE,
                resourceCost.message
            );
        }
    } catch (err) {
        const error = err as Error;
        errorLog(error.message);

        handleErrorResponse(
            res,
            HttpStatus.FAILED,
            HttpStatus.FAILED_MESSAGE,
            error.message
        );
    }
}

export default {
    projectById,
    listFinancialHighlightsProjects,
    resourceCostsForFinancialHighlights
};
