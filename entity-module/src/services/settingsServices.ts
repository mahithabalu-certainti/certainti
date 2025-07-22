import { Sequelize } from "sequelize"
import { initMainDbSequelize } from "../config/mainDataSource"
import { initOrgSequelize } from "../config/orgDataSource"
import { HttpStatus, rawQueries, STATUS_MESSAGE, UPDATE_FLAG } from "../utils/constants"
import { Project } from "../models/project"
import ProjectIngestionService from "./projectIngestionService"
import { Logger } from "winston"

export default class SettingService {
    private mainDbSequelize : Sequelize | null = null
    private orgDbSequelize : Sequelize | null = null
    private projectIngestion: ProjectIngestionService;
    private logger: Logger;
    constructor(logger: Logger) {
        this.logger = logger;
        this.projectIngestion = new ProjectIngestionService(this.logger);
    }

    private async getMainDbSequelize() {
        if(!this.mainDbSequelize) {
            this.mainDbSequelize = await initMainDbSequelize()
        }
        return this.mainDbSequelize
    }

    private async getOrgDbSequelize() {
        if(!this.orgDbSequelize) {
            this.orgDbSequelize = await initOrgSequelize()
        }
        return this.orgDbSequelize
    }

    async updateSettings (data : any) {
        let mainDb = await this.getMainDbSequelize()
        let orgDb = await this.getOrgDbSequelize()

        let fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb))
        let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number)
        let updatedResult : string;
        let mainUpdatedResult : string;
        if(data.flag == UPDATE_FLAG.project) {
            let oldProjectFiscalData : any = await orgDb.query(rawQueries.findProjectFiscal(schemaName,data.project_rid, data.account_rid, data.project_fiscal_rid))
            updatedResult = await rawQueries.updateSetting(schemaName, data, orgDb, mainDb)
            if(updatedResult) {
                let findProjectFiscal : any = await orgDb.query(rawQueries.findProjectFiscal(schemaName,data.project_rid, data.account_rid, data.project_fiscal_rid))
                findProjectFiscal[0][0].account_id = findProjectFiscal[0][0].account_rid
                await this.projectIngestion.updateProjectFiscalRegion(fetchParent[0][0].r_number, findProjectFiscal[0][0], findProjectFiscal[0][0].project_code)
                await orgDb.query(rawQueries.insertProjectTimeline(schemaName, data))
                let attributeName : string;
                let oldValue : string;
                let newValue : string;
                for(let name of this.findAttributeNames(data)) {
                    attributeName = name;
                    oldValue = oldProjectFiscalData[0][0][name]
                    newValue = findProjectFiscal[0][0][name]
                    if(oldValue == undefined) oldValue = ''
                    else oldValue = oldValue
                    if(newValue == undefined) newValue = ''
                    else newValue = newValue
                    if(newValue !== oldValue) {
                        await orgDb.query(rawQueries.insertProjectHistory(schemaName, data, attributeName, newValue, oldValue))
                    }
                }
                return {
                statusCode : HttpStatus.SUCCESS,
                statusMessage : STATUS_MESSAGE.settingsUpdatedSuccess
            }
            }
        }
        else {
            mainUpdatedResult = await rawQueries.updateSetting(schemaName, data, orgDb, mainDb)
            return {
                statusCode : HttpStatus.SUCCESS,
                statusMessage : STATUS_MESSAGE.settingsUpdatedSuccess
            }
        }
    }

    private findAttributeNames (data : any) {
        let name : string[] = [];
        if(data.blended_rate_fte) name.push(`blended_rate_fte`)
        if(data.blended_rate_subcon) name.push(`blended_rate_subcon`)
        if(typeof data.autosend_interaction == 'boolean') name.push(`auto_send_ai_interaction`)
        if(data.max_ai_interactions) name.push(`max_ai_interaction`)
        if(typeof data.auto_access_rd == 'boolean') name.push(`auto_access_rd`)
        return name;
    }
}