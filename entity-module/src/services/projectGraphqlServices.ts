import { Logger } from "winston";
import Configurations from "../config/config";
import { initMainDbSequelize } from "../config/mainDataSource";
import { initOrgSequelize } from "../config/orgDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../utils/constants";
import { setPrjFiscalData, setProject, setProjectFiscalSummary, setProjectSummary } from "../utils/helpers";
import ProjectIngestionService from "./projectIngestionService";

const services = Configurations.getInstance().getServices();
const projectService = services.projectServices;

class ProjectGraphQlServices {
    private projectIngestion: ProjectIngestionService;
    private logger: Logger;
    constructor(logger: Logger) {
        this.logger = logger;
        this.projectIngestion = new ProjectIngestionService(this.logger);
    }

    async inLineEditProject (data : any) {
        const mainSequelize = await initMainDbSequelize();
        const orgSequelize = await initOrgSequelize();
        const checkAccountExists : any = await mainSequelize.query(await rawQueries.fetchParentAccount(data.account_rid))
        if(checkAccountExists[0].length < 1) {
            return {
            statusCode : HttpStatus.NOT_FOUND,
            statusMessage : STATUS_MESSAGE.accountNoFound
            }
        }
        else {
            let schemaName = `"${MAIN_SCHEMA_NAME}_${checkAccountExists[0][0].r_number.replace('ACC-', '')}"`
            let findProject = await orgSequelize.query(rawQueries.findProject(schemaName, data.project_rid, data.account_rid))
            let findProjectFiscal = await orgSequelize.query(rawQueries.findProjectFiscal(schemaName,data.project_rid, data.account_rid, data.project_fiscal_rid))
            let findProjectSummary = await mainSequelize.query(rawQueries.findProjectSummary(data))
            let findProjectFisSummary = await mainSequelize.query(rawQueries.findProjectFiscalSummary(data))
            if(findProject[0].length > 0 && findProjectSummary[0].length > 0 && findProjectFiscal[0].length > 0 && findProjectFisSummary[0].length > 0) {
            if(data.project_code) {
                let checkDuplicateCode = await orgSequelize.query(rawQueries.checkProjectIdDuplicate(schemaName, data))
                if(checkDuplicateCode[0].length > 0) {
                return {
                statusCode : HttpStatus.BAD_REQUEST,
                statusMessage : STATUS_MESSAGE.projectCodeDuplicate
                }            
            }
            }
            let setProjectData = setProject(findProject[0][0], data);
            let setProjectFiscalData = setPrjFiscalData(findProjectFiscal[0][0], data);
            let setProjectsSummary = setProjectSummary(findProjectSummary[0][0], data);
            let setProjectsFiscalSummary = setProjectFiscalSummary(findProjectFisSummary[0][0], data)
            
            if(setProjectData.length > 0) {
            await orgSequelize.query(rawQueries.updateProject(schemaName, setProjectData, data))
            }
            if(setProjectFiscalData.length > 0) {
            await orgSequelize.query(rawQueries.updateProjectFiscal(schemaName, setProjectFiscalData, data)) 
            }

            if(setProjectSummary.length > 0) {
            await mainSequelize.query(rawQueries.updateProjectSummary(setProjectsSummary, data))
            }

            if(setProjectFiscalSummary.length > 0) {
            await mainSequelize.query(rawQueries.updateProjectFiscalSummary(setProjectsFiscalSummary, data))
            }
            let accountData : any = {}
            accountData.rid = data.account_rid
            let graphqlData : any = {};
            graphqlData.type = 'graphql'
            graphqlData.project_rid = data.project_rid
            graphqlData.accountrid = data.account_rid
            graphqlData.fiscal_rid = data.project_fiscal_rid
            
            let fetchUpdatedProjectResponse : any = await this.projectIngestion.fetchProjectList
            (checkAccountExists[0][0].r_number, accountData, {}, 0, 0, 1,[], false, {}, 'project_code', 'ASC',graphqlData)
            if(fetchUpdatedProjectResponse.projects.length > 0) {
                let data : any = fetchUpdatedProjectResponse.projects[0]
                let d : any = data.ProjectFiscal[0]
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
                    ProjectFiscal : {
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
                            project_fiscal_rid : d.project_fiscal_rid,
                            classification_name : d.classification_name,
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
                        }
                    }
            return {
                statusCode : HttpStatus.SUCCESS,
                statusMessage : STATUS_MESSAGE.projectUpdateSuccess,
                data : finalData
            }
            }
            } else {
            return {
            statusCode : HttpStatus.NOT_FOUND,
            statusMessage : STATUS_MESSAGE.invalidKeyData,
            data : null
            }
            }
        }
    }
}

export default ProjectGraphQlServices