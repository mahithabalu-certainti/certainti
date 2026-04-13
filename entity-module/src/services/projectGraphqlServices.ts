import { Logger } from "winston";
import Configurations from "../config/config";
import { initMainDbSequelize } from "../config/mainDataSource";
import { initOrgSequelize } from "../config/orgDataSource";
import { entityTypes, eventNames, eventTypes, HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../utils/constants";
import { logMessage, setPrjFiscalData, setProject, setProjectFiscalSummary } from "../utils/helpers";
import ProjectIngestionService from "./projectIngestionService";
import { IUpdateProject, CaseStatusResult } from "../utils/types";
import { ProjectService } from "./projectService";
import { CaseProject } from "../models/caseProjectsModel";
import { Case } from "../models/caseModel";
import { QueryTypes } from "sequelize";


const services = Configurations.getInstance().getServices();
const projectService = services.projectServices;

class ProjectGraphQlServices {
    private projectIngestion: ProjectIngestionService;
    private projectService: ProjectService;
    private logger: Logger;
    constructor(logger: Logger) {
        this.logger = logger;
        this.projectIngestion = new ProjectIngestionService(this.logger);
        this.projectService = new ProjectService(this.logger);
    }

    async inLineEditProject(data: any) {
        const mainSequelize = await initMainDbSequelize();
        const orgSequelize = await initOrgSequelize();
        logMessage(`In-line editing project for account: ${data.account_rid}, project: ${data.project_rid}, fiscal: ${data.project_fiscal_rid}`);
        const checkAccountExists: any = await mainSequelize.query(await rawQueries.fetchParentAccount(data.account_rid, mainSequelize))
        if (checkAccountExists[0].length < 1) {
            return {
                statusCode: HttpStatus.NOT_FOUND,
                statusMessage: STATUS_MESSAGE.accountNoFound
            }
        }
        else {
            let schemaName = `"${MAIN_SCHEMA_NAME}_${checkAccountExists[0][0].r_number.replace('ACC-', '')}"`
            let findProjectFiscal: any = await orgSequelize.query(rawQueries.findProjectFiscal(schemaName, data.project_rid, data.account_rid, data.project_fiscal_rid))
            if (findProjectFiscal[0].length > 0 && findProjectFiscal[0][0].is_rd_claim_qualified) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    statusMessage: STATUS_MESSAGE.qualifiedProject
                }
            }
            let findProjectSummary: any = await mainSequelize.query(rawQueries.findProjectSummary(data))
            let findProjectFisSummary: any = await mainSequelize.query(rawQueries.findProjectFiscalSummary(data))
            if (findProjectFiscal[0].length > 0 && findProjectFisSummary[0].length > 0) {
                if (data.project_code) {
                    let checkDuplicateCode = await orgSequelize.query(rawQueries.checkProjectIdDuplicate(schemaName, data))
                    if (checkDuplicateCode[0].length > 0) {
                        return {
                            statusCode: HttpStatus.BAD_REQUEST,
                            statusMessage: STATUS_MESSAGE.projectCodeDuplicate
                        }
                    }
                }
                if (data.fiscal_year) {
                    data.global_fiscal_year = data.fiscal_year;
                    let checkDuplicateYear = await orgSequelize.query(rawQueries.checkForDuplicateFiscalYear(schemaName, data))
                    if (checkDuplicateYear[0].length > 0) {
                        return {
                            statusCode: HttpStatus.BAD_REQUEST,
                            statusMessage: STATUS_MESSAGE.fiscalYearAlreadyExists
                        }
                    }
                }
                let setProjectFiscalData = setPrjFiscalData(findProjectFiscal[0][0], data);
                let setProjectsFiscalSummary = setProjectFiscalSummary(findProjectFisSummary[0][0], data)
                if (setProjectFiscalData.length > 0) {
                    if (data.project_code) {
                        if (data.project_code !== '') {
                            await orgSequelize.query(rawQueries.updateProjectFiscalPrjCode(schemaName, data.project_code, data.account_rid, data.project_rid, findProjectFiscal[0][0].project_code))
                            await orgSequelize.query(rawQueries.updateProject(schemaName, data.project_code, data))
                            await mainSequelize.query(rawQueries.updateProjectSummary(data.project_code, data))
                        }
                    }
                    await orgSequelize.query(rawQueries.updateProjectFiscal(schemaName, setProjectFiscalData, data))
                    findProjectFiscal[0][0].project_fiscal_id = findProjectFiscal[0][0].rid
                    findProjectFiscal[0][0].account_id = findProjectFiscal[0][0].account_rid
                    findProjectFiscal[0][0].project_id = findProjectFiscal[0][0].project_rid
                    data.account_id = findProjectFiscal[0][0].account_rid;
                    data.project_code = findProjectFiscal[0][0].project_code;
                    data.project_fiscal_id = findProjectFiscal[0][0].project_fiscal_id;
                    data.project_id = findProjectFiscal[0][0].project_id;
                    data.project_type_rid = findProjectFiscal[0][0].project_type_rid;
                    data.created_by = findProjectFiscal[0][0].created_by;
                    data.status_rid = findProjectFiscal[0][0].status_rid;
                    data.fiscal_year = data.fiscal_year ? data.fiscal_year : findProjectFiscal[0][0].fiscal_year;
                    data.region_rid = findProjectFiscal[0][0].region_rid
                    await this.projectIngestion.updateProjectFiscalRegion(checkAccountExists[0][0].r_number, data, findProjectFiscal[0][0].project_code)
                }
                if (setProjectFiscalSummary.length > 0) {
                    if (data.project_code) {
                        if (data.project_code !== '') {
                            await mainSequelize.query(rawQueries.updateProjectFiscalSummaryPrjCode(data.project_code, data.account_rid, data.project_rid, findProjectFisSummary[0][0].project_code))
                        }
                    }
                    await mainSequelize.query(rawQueries.updateProjectFiscalSummary(setProjectsFiscalSummary, data))
                }
                let findProject: any = await orgSequelize.query(rawQueries.findProject(schemaName, data.project_rid, data.account_rid))
                let updatedProjectFiscal: any = await orgSequelize.query(rawQueries.findProjectFiscal(schemaName, data.project_rid, data.account_rid, data.project_fiscal_rid))
                await orgSequelize.query(rawQueries.updateProjectFiscalEffectiveDatas(schemaName, updatedProjectFiscal[0][0]))
                await this.projectIngestion.updateProjectAggregatesFromFiscal(checkAccountExists[0][0].r_number, data.account_rid, findProject[0][0].project_code)
                await this.projectIngestion.updateProjectSummaryAggregatesFromFiscal(checkAccountExists[0][0].r_number, findProject[0][0].project_code, data.account_rid)
                // Only set the required fields in updatedProjectFiscal[0][0]
                updatedProjectFiscal[0][0].account_id = updatedProjectFiscal[0][0].account_rid;
                updatedProjectFiscal[0][0].total_effort = updatedProjectFiscal[0][0].total_effort_prj ?? null;
                updatedProjectFiscal[0][0].total_cost = updatedProjectFiscal[0][0].total_cost_prj ?? null;
                updatedProjectFiscal[0][0].total_fte = updatedProjectFiscal[0][0].total_fte_prj ?? null;
                updatedProjectFiscal[0][0].total_subcon = updatedProjectFiscal[0][0].total_subcon_prj ?? null;
                updatedProjectFiscal[0][0].total_cost_nonlabor = updatedProjectFiscal[0][0].total_cost_nonlabor_prj ?? null;
                updatedProjectFiscal[0][0].total_effort_fte = updatedProjectFiscal[0][0].total_effort_fte_prj ?? null;
                updatedProjectFiscal[0][0].total_effort_subcon = updatedProjectFiscal[0][0].total_effort_subcon_prj ?? null;
                updatedProjectFiscal[0][0].total_cost_fte = updatedProjectFiscal[0][0].total_cost_fte_prj ?? null;
                updatedProjectFiscal[0][0].total_cost_subcon = updatedProjectFiscal[0][0].total_cost_subcon_prj ?? null;

                await this.projectIngestion.addAccountFiscal(checkAccountExists[0][0].r_number, updatedProjectFiscal[0][0]);
                if (findProjectFiscal[0][0].fiscal_year !== updatedProjectFiscal[0][0].fiscal_year) {
                    await this.projectIngestion.deleteAccountFiscalForInlineEdit(checkAccountExists[0][0].r_number, findProjectFiscal[0][0].account_rid, findProjectFiscal[0][0].fiscal_year, findProjectFiscal[0][0]);
                }
                await this.projectIngestion.addAccountFiscalRegion(checkAccountExists[0][0].r_number, updatedProjectFiscal[0][0]);
                if (findProjectFiscal[0][0].fiscal_year !== updatedProjectFiscal[0][0].fiscal_year) {
                    await this.projectIngestion.deleteAccountFiscalRegionForInlineEdit(checkAccountExists[0][0].r_number, findProjectFiscal[0][0].account_rid, findProjectFiscal[0][0].fiscal_year, findProjectFiscal[0][0]);
                }
                await this.projectIngestion.updateAccountAggregatesFromAccountFiscal(
                    checkAccountExists[0][0].r_number,
                    data.account_rid
                );

                await this.projectIngestion.updateProjectResources(checkAccountExists[0][0].r_number, updatedProjectFiscal[0][0], findProjectFiscal[0][0].rid, findProjectFiscal[0][0].fiscal_year);
                const userEventInfo: any = await this.projectService.schemaService.fetchUserAndEventInfo({
                    userId: data.userId!,
                    eventType: eventTypes.UI_HANDLER
                });
                await this.projectService.schemaService.createAccountTimelineEntry(checkAccountExists[0][0].r_number!, {
                    created_by: data.userId!,
                    account_rid: data.account_rid,
                    created_by_name: userEventInfo.full_name,
                    entity_rid: data.project_fiscal_id,
                    entity_name: entityTypes.PROJECT,
                    event_type_rid: userEventInfo.event_type_rid,
                    event_name: eventNames.UPDATE,
                    descriptions: data.project_code,
                    project_rid: data.project_fiscal_id
                }, ["project"]);
                //  await orgSequelize.query(rawQueries.insertProjectTimeline(schemaName,data));
                let attributeName;
                let newValue;
                let oldValue;
                if (setProjectFiscalData.length > 0) {
                    for (let items of setProjectFiscalData) {
                        let splittedKey = items.split('=')[0]
                        let trimmedKey = splittedKey.trim()
                        if (trimmedKey != 'modified_by' && trimmedKey != 'modified_datetime') {
                            attributeName = trimmedKey
                            newValue = updatedProjectFiscal[0][0][trimmedKey]
                            oldValue = findProjectFiscal[0][0][trimmedKey]
                            if (oldValue !== null && oldValue !== undefined && typeof oldValue === 'string') {
                                oldValue = oldValue.replace(/'/g, "''");
                            }
                            if (newValue !== null && newValue !== undefined && typeof newValue === 'string') {
                                newValue = newValue.replace(/'/g, "''");
                            }
                            if (newValue !== oldValue) {
                                await orgSequelize.query(rawQueries.insertProjectHistory(schemaName, data, attributeName, newValue, oldValue))
                            }
                        }
                    }
                }
                const { accountNumber: validAccountNumber } = await this.projectIngestion.fetchValidAccountNumberById(data.account_rid);

                const checkTableExists = await this.projectIngestion.checkCaseProjectsTableExists(validAccountNumber);
                if (checkTableExists) {
                    const projectCaseMapping = await orgSequelize.query(rawQueries.fetchProjectFiscalCaseMapping(schemaName, data));
                    if (projectCaseMapping.length > 0) {
                        for (let caseMapping of projectCaseMapping[0] as CaseProject[]) {
                            const caseData = await Case.findOne({
                                where: {
                                    rid: caseMapping.case_rid,
                                },
                            });

                            if (!caseData) {
                                continue;
                            }

                            const caseStatus = await mainSequelize.query(
                                rawQueries.fetchCaseStatusByRid(caseData.status_rid),
                                {
                                    type: "SELECT",
                                }
                            ) as CaseStatusResult[];

                            if (caseStatus[0]?.status_name === "Closed") {
                                continue;
                            }

                            if (setProjectFiscalData.length > 0) {
                                if (data.project_code) {
                                    if (data.project_code !== '') {
                                        await orgSequelize.query(rawQueries.updateCaseProjectPrjCode(schemaName, data.project_code, data.account_rid, data.project_rid, findProjectFiscal[0][0].project_code, caseMapping.case_rid))
                                    }
                                }
                                await orgSequelize.query(rawQueries.updateCaseProjects(schemaName, setProjectFiscalData, data, caseMapping.case_rid))
                                await this.projectIngestion.updateCaseProjectFiscalRegion(checkAccountExists[0][0].r_number, data, caseMapping as CaseProject, findProjectFiscal[0][0].project_code)
                            }

                            await orgSequelize.query(rawQueries.updateCaseProjectEffectiveDatas(schemaName, updatedProjectFiscal[0][0], caseMapping.case_rid))
                        }
                    }
                }

                let accountData: any = {}
                accountData.rid = data.account_rid
                let graphqlData: any = {};
                graphqlData.type = 'graphql'
                graphqlData.project_rid = data.project_rid
                graphqlData.accountrid = data.account_rid
                graphqlData.fiscal_rid = data.project_fiscal_rid

                let fetchUpdatedProjectResponse: any = await this.projectIngestion.fetchProjectList
                    (checkAccountExists[0][0].r_number, accountData, {}, data.global_fiscal_year, 0, 2, [], false, {}, 'project_code', 'ASC', graphqlData, [])

                if (fetchUpdatedProjectResponse.projects.length > 0) {
                    let data: any = fetchUpdatedProjectResponse.projects[0]
                    let finalData = {
                        rid: data.rid,
                        r_number: data.r_number,
                        eid: data.eid,
                        created_datetime: data.created_datetime,
                        modified_datetime: data.modified_datetime,
                        created_by: data.created_by,
                        modified_by: data.modified_by,
                        project_code: data.project_code,
                        industry_rid: data.industry_rid,
                        industry_name: data.industry_name,
                        account_rid: data.account_rid,
                        program_name: data.program_name,
                        project_name: data.project_name,
                        project_startdate: data.project_startdate,
                        project_enddate: data.project_enddate,
                        project_type_rid: data.project_type_rid,
                        project_classification_rid: data.project_classification_rid,
                        project_classification_other: data.project_classification_other,
                        project_client_group: data.project_client_group,
                        project_group: data.project_group,
                        status_rid: data.status_rid,
                        country_rid: data.country_rid,
                        region_rid: data.region_rid,
                        currency_rid: data.currency_rid,
                        comments: data.comments,
                        project_description: data.project_description,
                        assessment_status: data.assessment_status,
                        is_assesed: data.is_assesed,
                        is_qualified: data.is_qualified,
                        total_fte: data.total_fte,
                        total_subcon: data.total_subcon,
                        total_effort: data.total_effort,
                        total_cost: data.total_cost,
                        total_effort_fte: data.total_effort_fte,
                        total_effort_subcon: data.total_effort_subcon,
                        total_cost_fte: data.total_cost_fte,
                        total_cost_subcon: data.total_cost_subcon,
                        total_cost_nonlabor: data.total_cost_nonlabor,
                        auto_send_ai_interaction: data.auto_send_ai_interaction,
                        auto_access_rd: data.auto_access_rd,
                        max_ai_interaction: data.max_ai_interaction,
                        blended_rate_fte: data.blended_rate_fte,
                        blended_rate_subcon: data.blended_rate_subcon,
                        blended_rate: data.blended_rate,
                        is_rd_qualified: data.is_rd_qualified,
                        qre: data.qre,
                        project_rid: data.rid,
                        technical_point_of_contact: data.technical_point_of_contact,
                        financial_consultant: data.financial_consultant,
                        project_point_of_contact: data.project_point_of_contact,
                        currency_code: data.currency_code,
                        currency_symbol: data.currency_symbol,
                        classification_name: data.classification_name,
                        is_other_classification: data.is_other_classification,
                        project_type_name: data.project_type_name,
                        status_name: data.status_name,
                        ProjectFiscal: data.ProjectFiscal.map((d: any) => {
                            return {
                                rid: d.rid,
                                r_number: d.r_number,
                                eid: d.eid,
                                created_by: d.created_by,
                                modified_by: d.modified_by,
                                created_datetime: d.created_datetime,
                                modified_datetime: d.modified_datetime,
                                project_rid: d.project_rid,
                                project_code: d.project_code,
                                industry_rid: d.industry_rid,
                                industry_name: d.industry_name,
                                fiscal_year: d.fiscal_year,
                                project_name: d.project_name,
                                program_name: d.program_name,
                                project_type_rid: d.project_type_rid,
                                project_classification_rid: d.project_classification_rid,
                                project_classification_other: d.project_classification_other,
                                project_client_group: d.project_client_group,
                                project_group: d.project_group,
                                auto_send_ai_interaction: d.auto_send_ai_interaction,
                                account_rid: d.account_rid,
                                country_rid: d.country_rid,
                                region_rid: d.region_rid,
                                currency_rid: d.currency_rid,
                                max_ai_interaction: d.max_ai_interaction,
                                expiry_duration: d.expiry_duration,
                                auto_access_rd: d.auto_access_rd,
                                status_rid: d.status_rid,
                                project_startdate: d.project_startdate,
                                project_enddate: d.project_enddate,
                                total_fte_prj: d.total_fte_prj,
                                total_fte_from_prj_res: d.total_fte_from_prj_res,
                                total_fte_from_tasks: d.total_fte_from_tasks,
                                total_subcon_prj: d.total_subcon_prj,
                                total_subcon_from_prj_res: d.total_subcon_from_prj_res,
                                total_subcon_from_tasks: d.total_subcon_from_tasks,
                                total_nonlabor_prj: d.total_nonlabor_prj,
                                total_nonlabor_from_prj_res: d.total_nonlabor_from_prj_res,
                                total_resources_prj: d.total_resources_prj,
                                total_resources_from_prj_res: d.total_resources_from_prj_res,
                                total_resources_from_tasks: d.total_resources_from_tasks,
                                total_effort_prj: d.total_effort_prj,
                                total_effort_fte_prj: d.total_effort_fte_prj,
                                total_effort_subcon_prj: d.total_effort_subcon_prj,
                                total_effort_from_prj_res: d.total_effort_from_prj_res,
                                total_effort_fte_from_prj_res: d.total_effort_fte_from_prj_res,
                                total_effort_subcon_from_prj_res: d.total_effort_subcon_from_prj_res,
                                total_effort_from_tasks: d.total_effort_from_tasks,
                                total_effort_fte_from_tasks: d.total_effort_fte_from_tasks,
                                total_effort_subcon_from_tasks: d.total_effort_subcon_from_tasks,
                                total_cost_prj: d.total_cost_prj,
                                total_cost_fte_prj: d.total_cost_fte_prj,
                                total_cost_subcon_prj: d.total_cost_subcon_prj,
                                total_cost_nonlabor_prj: d.total_cost_nonlabor_prj,
                                total_cost_from_prj_res: d.total_cost_from_prj_res,
                                total_cost_fte_from_prj_res: d.total_cost_fte_from_prj_res,
                                total_cost_subcon_from_prj_res: d.total_cost_subcon_from_prj_res,
                                total_cost_nonlabor_from_prj_res: d.total_cost_nonlabor_from_prj_res,
                                total_cost_from_tasks: d.total_cost_from_tasks,
                                total_cost_fte_from_tasks: d.total_cost_fte_from_tasks,
                                total_cost_subcon_from_tasks: d.total_cost_subcon_from_tasks,
                                total_cost_prj_blended: d.total_cost_prj_blended,
                                project_fiscal_rid: d.project_fiscal_rid,
                                classification_name: d.classification_name,
                                total_cost_fte_prj_blended: d.total_cost_fte_prj_blended,
                                total_cost_subcon_prj_blended: d.total_cost_subcon_prj_blended,
                                total_cost_from_prj_res_blended: d.total_cost_from_prj_res_blended,
                                total_cost_fte_from_prj_res_blended: d.total_cost_fte_from_prj_res_blended,
                                total_cost_subcon_from_prj_res_blended: d.total_cost_subcon_from_prj_res_blended,
                                total_cost_from_tasks_blended: d.total_cost_from_tasks_blended,
                                total_cost_fte_from_tasks_blended: d.total_cost_fte_from_tasks_blended,
                                total_cost_subcon_from_tasks_blended: d.total_cost_subcon_from_tasks_blended,
                                blended_rate_fte: d.blended_rate_fte,
                                blended_rate_subcon: d.blended_rate_subcon,
                                rd_percent_potential_ai: d.rd_percent_potential_ai,
                                rd_percent_adjustment: d.rd_percent_adjustment,
                                rd_percent_final: d.rd_percent_final,
                                qre_fte: d.qre_fte,
                                qre_subcon: d.qre_subcon,
                                qre_nonlabor: d.qre_nonlabor,
                                rd_credits_fte_fed_level: d.rd_credits_fte_fed_level,
                                rd_credits_subcon_fed_level: d.rd_credits_subcon_fed_level,
                                rd_credits_nonlabor_fed_level: d.rd_credits_nonlabor_fed_level,
                                rd_credits_fed_level: d.rd_credits_fed_level,
                                rd_credits_total: d.rd_credits_total,
                                interaction_cc_list: d.interaction_cc_list,
                                assessment_status: d.assessment_status,
                                is_assesed: d.is_assesed,
                                is_qualified: d.is_qualified,
                                claim_status: d.claim_status,
                                comments: d.comments,
                                project_description: d.project_description,
                                total_fte: d.total_fte,
                                total_effort: d.total_effort,
                                total_cost: d.total_cost,
                                total_cost_fte: d.total_cost_fte,
                                total_cost_subcon: d.total_cost_subcon,
                                total_cost_nonlabor: d.total_cost_nonlabor,
                                project_type_name: d.project_type_name,
                                currency_symbol: d.currency_symbol,
                                qre_final: d.qre_final
                            }
                        })
                    }
                    return {
                        statusCode: HttpStatus.SUCCESS,
                        statusMessage: STATUS_MESSAGE.projectUpdateSuccess,
                        data: finalData
                    }
                }
                else {
                    return {
                        statusCode: HttpStatus.SUCCESS,
                        statusMessage: STATUS_MESSAGE.projectUpdateSuccess,
                        data: null
                    }
                }
            } else {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    statusMessage: STATUS_MESSAGE.invalidKeyData,
                    data: null
                }
            }
        }
    }

    async updateProjectQreAdjustment(data: any) {
        const result = await this.projectService.updateQrePercentAdjustment(data, data.userId);
        if (result.statusCode === HttpStatus.SUCCESS) {
            const projectDetails = await this.projectService.projectById(data.account_rid, data.rid);
            if (projectDetails.statusCode === HttpStatus.SUCCESS) {
                return {
                    statusCode: HttpStatus.SUCCESS,
                    statusMessage: STATUS_MESSAGE.projectUpdateSuccess,
                    data: projectDetails.data?.project
                }
            }
        } else {
            return {
                statusCode: HttpStatus.BAD_REQUEST,
                statusMessage: result.errorMessage,
            }
        }
    }
}

export default ProjectGraphQlServices