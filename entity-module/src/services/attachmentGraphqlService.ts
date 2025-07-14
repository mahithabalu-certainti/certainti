import Configurations from "../config/config";
import { initMainDbSequelize } from "../config/mainDataSource"
import { initOrgSequelize } from "../config/orgDataSource"
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../utils/constants"
import { setInlineForAttachments } from "../utils/helpers"

const services = Configurations.getInstance().getServices();
const attachmentService = services.attachmentServices;

export default class AttachmentGraphqlServies {
    async updateInlineGraphqlDetails(data : any) {
        const orgSequelize = await initOrgSequelize()
        const mainSequelize = await initMainDbSequelize()

        const checkAccountExists : any = await mainSequelize.query(rawQueries.fetchParentAccount(data.account_rid))
        if(checkAccountExists[0].length < 1) {
            return {
                statusCode : HttpStatus.NOT_FOUND,
                statusMessage : STATUS_MESSAGE.accountNoFound,
                data : null
            }
        }
        else {
            let schemaName = rawQueries.fetchSchemaName(checkAccountExists[0][0].r_number)
            const checkForExistingData : any = await orgSequelize.query(rawQueries.findAttachementDetails(schemaName, data.rid, data.account_rid))
            if(checkForExistingData[0].length < 1) {
            return {
                statusCode : HttpStatus.NOT_FOUND,
                statusMessage : STATUS_MESSAGE.noAttachmentRecordFound,
                data : null
            } 
            }
            else {
                if(data.document_category_rid) {
                    let checkCatExists = await mainSequelize.query(rawQueries.checkDocCategoryExists(data.document_category_rid))
                    if(!checkCatExists[0][0]) {
                        return {
                            statusCode : HttpStatus.NOT_FOUND,
                            statusMessage : STATUS_MESSAGE.docCatInvalid,
                            data : null
                        } 
                    }
                }
                if(data.document_type_rid) {
                    let checkTypeExists = await mainSequelize.query(rawQueries.checkDocTypeExists(data.document_type_rid))
                    if(!checkTypeExists[0][0]) {
                        return {
                            statusCode : HttpStatus.NOT_FOUND,
                            statusMessage : STATUS_MESSAGE.docTypeInvalid,
                            data : null
                        } 
                    }  
                }
                let getSetData = setInlineForAttachments(checkForExistingData[0][0], data)
                if(getSetData.statusMessage != null) {
                    return {
                        statusCode : HttpStatus.BAD_REQUEST,
                        statusMessage : getSetData.statusMessage,
                        data : null
                    }
                } else {
                    const updatedAttachments = await orgSequelize.query(rawQueries.updateAttachmentQuery(schemaName, getSetData, data))
                    
                    const updatedAttachmentSummary = await mainSequelize.query(rawQueries.updateAttachmentSummary(getSetData, data))
                    if(updatedAttachmentSummary && updatedAttachments) {
                        let graphqlData : any = {}
                        graphqlData.document_rid = data.rid
                        let fetchLatestUpdatedData = await attachmentService.getAttachments(data.userId, checkForExistingData[0][0].attachment_level, checkForExistingData[0][0].attach_to, data.account_rid, 1, 1, '', {}, 'created_datetime', 'DESC', 0, graphqlData)
                        let latestData : any = fetchLatestUpdatedData.data?.attachments[0]
                        await orgSequelize.query(rawQueries.insertAttachementTimeline(schemaName, data, latestData))
                        return {
                            statusCode : HttpStatus.SUCCESS,
                            statusMessage : STATUS_MESSAGE.attachmentUpdatedSuccess,
                            data : latestData
                        }
                    }
                }
            }
        }
    }
}