import { Sequelize } from "sequelize"
import { initOrgSequelize } from "../config/orgDataSource"
import { initMainDbSequelize } from "../config/mainDataSource"
import { HttpStatus, rawQueries, STATUS_MESSAGE, SUMMARY_HIGHLIGHTS_FLAG, SUMMARY_HIGHLIGHTS_TYPE_FLAG } from "../utils/constants"
import { fetchIsRdQualifiedProjectQuery, fetchIsRdQualifiedProjectQueryRegion, summaryHighlightsQuery, summaryHighlightsQueryRegion } from "../utils/rawQueries"

export default class FinancialHighlightsService {
    private mainDbSequelize : Sequelize | null = null
    private orgDbSequelize :Sequelize | null = null

    async getOrgDbSequelize() {
        if(!this.orgDbSequelize) {
            this.orgDbSequelize = await initOrgSequelize()
        }
        return this.orgDbSequelize 
    }
    async getMainDbSequelize() {
        if(!this.mainDbSequelize) {
            this.mainDbSequelize = await initMainDbSequelize()
        }
        return this.mainDbSequelize 
    }

    async summaryHighlightsList (data : any) {
        let mainDb = await this.getMainDbSequelize()
        let orgDb = await this.getOrgDbSequelize()
        let result;

        let fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb))
        let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number)

        if(data.flag == SUMMARY_HIGHLIGHTS_FLAG.all) {
            if(data.summaryType == SUMMARY_HIGHLIGHTS_TYPE_FLAG.statewise) {
                result = await orgDb.query(summaryHighlightsQueryRegion(data.account_rid, data.fiscal_year, schemaName, data.region_rid))
            } else {
                result = await orgDb.query(summaryHighlightsQuery(data.account_rid, data.fiscal_year, schemaName))
            }
        } else {
            if(data.summaryType == SUMMARY_HIGHLIGHTS_TYPE_FLAG.statewise) {
                result = await orgDb.query(fetchIsRdQualifiedProjectQueryRegion(data.account_rid,  schemaName, data.fiscal_year, data.region_rid))
            } else {
                result = await orgDb.query(fetchIsRdQualifiedProjectQuery(data.account_rid, schemaName, data.fiscal_year))
            }
            
        }
        if(result[0].length > 0) {
            return {
                statusCode : HttpStatus.SUCCESS,
                statusMessage : STATUS_MESSAGE.accountSummaryHighlightsSuccess,
                data : result[0][0]
            }
        } else {
            return {
                statusCode : HttpStatus.SUCCESS,
                statusMessage : STATUS_MESSAGE.accountSummaryHighlightsSuccess,
                data : null
            }
        }

    }
}