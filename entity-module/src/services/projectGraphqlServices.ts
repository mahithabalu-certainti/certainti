import { initMainDbSequelize } from "../config/mainDataSource";
import { initOrgSequelize } from "../config/orgDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../utils/constants";
import { setPrjFiscalData, setProject, setProjectFiscalSummary, setProjectSummary } from "../utils/helpers";

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
            return {
            statusCode : HttpStatus.SUCCESS,
            statusMessage : STATUS_MESSAGE.projectUpdateSuccess
            }
            } else {
            return {
            statusCode : HttpStatus.NOT_FOUND,
            statusMessage : STATUS_MESSAGE.invalidKeyData
            }
            }
        }
    }
}

export default ProjectGraphQlServices