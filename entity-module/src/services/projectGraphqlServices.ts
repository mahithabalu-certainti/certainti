import Configurations from "../config/config";
import { initMainDbSequelize } from "../config/mainDataSource";
import { initOrgSequelize } from "../config/orgDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../utils/constants";
import { setPrjFiscalData, setProject, setProjectFiscalSummary, setProjectSummary } from "../utils/helpers";

const services = Configurations.getInstance().getServices();
const projectService = services.projectServices;

class ProjectGraphQlServices {
    async inLineEditProject (data : any) {
        const mainSequelize = await initMainDbSequelize();
        const orgSequelize = await initOrgSequelize();
        const checkAccountExists : any = await mainSequelize.query(rawQueries.fetchParentAccount(data.account_rid))
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
            let fetchUpdatedProjectResponse = await projectService.projectById(data.account_rid, data.project_fiscal_rid);
            let fetchQre : any = await mainSequelize.query(rawQueries.fetchQreFromPrjSum(data.project_rid, data.account_rid))
            if(fetchUpdatedProjectResponse.data?.project) {
                let data = fetchUpdatedProjectResponse.data?.project
                let finalData = {
                    project_fiscal_rid: data.rid,
                    r_number: data.r_number,
                    eid: data.eid,
                    created_by: data.created_by,
                    modified_by: data.modified_by,
                    created_datetime: data.created_datetime,
                    modified_datetime: data.modified_datetime,
                    project_rid: data.project_rid,
                    project_code: data.project_code,
                    industry_rid: data.industry_rid,
                    industry_name: data.industry_name,
                    fiscal_year: data.fiscal_year,
                    project_name: data.project_name,
                    program_name: data.program_name,
                    project_type_rid: data.project_type_rid,
                    project_classification_rid: data.project_classification_rid,
                    project_classification_other: data.project_classification_other,
                    project_client_group: data.project_client_group,
                    project_group: data.project_group,
                    auto_send_ai_interaction: data.auto_send_ai_interaction,
                    account_rid: data.account_rid,
                    country_rid: data.country_rid,
                    region_rid: data.region_rid,
                    currency_rid: data.currency_rid,
                    max_ai_interaction: data.max_ai_interaction,
                    expiry_duration: data.expiry_duration,
                    auto_access_rd: data.auto_access_rd,
                    status_rid: data.status_rid,
                    project_startdate: data.project_startdate,
                    project_enddate: data.project_enddate,
                    total_fte_prj: data.total_fte_prj,
                    total_fte_from_prj_res: data.total_fte_from_prj_res,
                    total_fte_from_tasks: data.total_fte_from_tasks,
                    total_subcon_prj: data.total_subcon_prj,
                    total_subcon_from_prj_res: data.total_subcon_from_prj_res,
                    total_subcon_from_tasks: data.total_subcon_from_tasks,
                    total_nonlabor_prj: data.total_nonlabor_prj,
                    total_nonlabor_from_prj_res: data.total_nonlabor_from_prj_res,
                    total_resources_prj: data.total_resources_prj,
                    total_resources_from_prj_res: data.total_resources_from_prj_res,
                    total_resources_from_tasks: data.total_resources_from_tasks,
                    total_effort_prj: data.total_effort_prj,
                    total_effort_fte_prj: data.total_effort_fte_prj,
                    total_effort_subcon_prj: data.total_effort_subcon_prj,
                    total_effort_from_prj_res: data.total_effort_from_prj_res,
                    total_effort_fte_from_prj_res: data.total_effort_fte_from_prj_res,
                    total_effort_subcon_from_prj_res: data.total_effort_subcon_from_prj_res,
                    total_effort_from_tasks: data.total_effort_from_tasks,
                    total_effort_fte_from_tasks: data.total_effort_fte_from_tasks,
                    total_effort_subcon_from_tasks: data.total_effort_subcon_from_tasks,
                    total_cost_prj: data.total_cost_prj,
                    total_cost_fte_prj: data.total_cost_fte_prj,
                    total_cost_subcon_prj: data.total_cost_subcon_prj,
                    total_cost_nonlabor_prj: data.total_cost_nonlabor_prj,
                    total_cost_from_prj_res: data.total_cost_from_prj_res,
                    total_cost_fte_from_prj_res: data.total_cost_fte_from_prj_res,
                    total_cost_subcon_from_prj_res: data.total_cost_subcon_from_prj_res,
                    total_cost_nonlabor_from_prj_res: data.total_cost_nonlabor_from_prj_res,
                    total_cost_from_tasks: data.total_cost_from_tasks,
                    total_cost_fte_from_tasks: data.total_cost_fte_from_tasks,
                    total_cost_subcon_from_tasks: data.total_cost_subcon_from_tasks,
                    total_cost_prj_blended: data.total_cost_prj_blended,
                    total_cost_fte_prj_blended: data.total_cost_fte_prj_blended,
                    total_cost_subcon_prj_blended: data.total_cost_subcon_prj_blended,
                    total_cost_from_prj_res_blended: data.total_cost_from_prj_res_blended,
                    total_cost_fte_from_prj_res_blended: data.total_cost_fte_from_prj_res_blended,
                    total_cost_subcon_from_prj_res_blended: data.total_cost_subcon_from_prj_res_blended,
                    total_cost_from_tasks_blended: data.total_cost_from_tasks_blended,
                    total_cost_fte_from_tasks_blended: data.total_cost_fte_from_tasks_blended,
                    total_cost_subcon_from_tasks_blended: data.total_cost_subcon_from_tasks_blended,
                    blended_rate_fte: data.blended_rate_fte,
                    blended_rate_subcon: data.blended_rate_subcon,
                    rd_percent_potential_ai: data.rd_percent_potential_ai,
                    rd_percent_adjustment: data.rd_percent_adjustment,
                    rd_percent_final: data.rd_percent_final,
                    qre : fetchQre[0][0].qre,
                    qre_fte: data.qre_fte,
                    qre_subcon: data.qre_subcon,
                    qre_nonlabor: data.qre_nonlabor,
                    qre_final: data.qre_final,
                    rd_credits_fte_fed_level: data.rd_credits_fte_fed_level,
                    rd_credits_subcon_fed_level: data.rd_credits_subcon_fed_level,
                    rd_credits_nonlabor_fed_level: data.rd_credits_nonlabor_fed_level,
                    rd_credits_fed_level: data.rd_credits_fed_level,
                    rd_credits_total: data.rd_credits_total,
                    interaction_cc_list: data.interaction_cc_list,
                    assessment_status: data.assessment_status,
                    claim_status: data.claim_status,
                    comments: data.comments,
                    project_description: data.project_description,
                    total_fte: data.total_fte,
                    total_subcon: data.total_subcon,
                    total_cost: data.total_cost,
                    total_effort: data.total_effort,
                    total_effort_fte: data.total_effort_fte,
                    total_effort_subcon: data.total_effort_subcon,
                    total_cost_fte: data.total_cost_fte,
                    total_cost_subcon: data.total_cost_subcon,
                    total_cost_nonlabor: data.total_cost_nonlabor,
                    country: data.country,
                    region: data.region,
                    currency: data.currency,
                    keyContact: data.keyContact.length < 1 ? [] : data.keyContact.map((d : any) => {
                        return {
                            rid: d.rid,
                            r_number: d.r_number,
                            created_by: d.created_by,
                            modified_by: d.modified_by,
                            created_datetime: d.created_datetime,
                            modified_datetime: d.modified_datetime,
                            entity_rid: d.entity_rid,
                            entity_type: d.entity_type,
                            key_contact_name: d.key_contact_name,
                            key_contact_email: d.key_contact_email,
                            key_contact_role: d.key_contact_role,
                            is_primary_contact: d.is_primary_contact,
                            include_in_communication: d.include_in_communication,
                            status_rid: d.status_rid,
                            role_name: d.role_name,
                            status_name: d.status_name
                        }
                    }),
                    country_name: data.country_name,
                    country_code: data.country_code,
                    region_name: data.region_name,
                    currency_name: data.currency_name,
                    currency_symbol: data.currency_symbol,
                    status_name: data.status_name,
                    project_type_name: data.project_type_name,
                    classification_name: data.classification_name,
                    account_name: data.account_name,
                    account_status: data.account_status,
                    created_name: data.created_name,
                    modified_name: data.modified_name
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