import Configurations from "../../config/config";
import { initMainDbSequelize } from "../../config/mainDataSource"
import { initOrgSequelize } from "../../config/orgDataSource"
import { HttpStatus,rawQueries, STATUS_MESSAGE } from "../../utils/constants"
import { setInlineForNotes } from "../../utils/helpers"

const notesService = Configurations.getInstance().getServices().notesService

export default class NotesGraphqlServies {
    
    async updateInlineGraphqlDetailsForNotes(data : any) {
        const orgSequelize = await initOrgSequelize()
        const mainSequelize = await initMainDbSequelize()

        const checkAccountExists : any = await mainSequelize.query(await rawQueries.fetchParentAccount(data.account_rid, mainSequelize))
        if(checkAccountExists[0].length < 1) {
            return {
                statusCode : HttpStatus.NOT_FOUND,
                statusMessage : STATUS_MESSAGE.accountNoFound,
                data : null
            }
        }
        else {
            let schemaName = rawQueries.fetchSchemaName(checkAccountExists[0][0].r_number)
            const checkForExistingData : any = await orgSequelize.query(rawQueries.findNotesDetails(schemaName, data.rid, data.account_rid))
            if(checkForExistingData[0].length < 1) {
            return {
                statusCode : HttpStatus.NOT_FOUND,
                statusMessage : STATUS_MESSAGE.noNotesRecordFound,
                data : null
            } 
            }
            else {
                let getSetData = setInlineForNotes(checkForExistingData[0][0], data)
                if(getSetData.statusMessage != null) {
                    return {
                        statusCode : HttpStatus.BAD_REQUEST,
                        statusMessage : getSetData.statusMessage,
                        data : null
                    }
                } else {
                    const updatedNotes = await orgSequelize.query(rawQueries.updateNotesQuery(schemaName, getSetData, data))
                    
                    const updatedNotesSummary = await mainSequelize.query(rawQueries.updateNotesSummary(getSetData, data))
                    if(updatedNotesSummary && updatedNotes) {
                        let graphqlData : any = {}
                        graphqlData.notes_rid = data.rid
                        let fetchLatestUpdatedData = await notesService.getNotes(data.userId, checkForExistingData[0][0].attachment_level, checkForExistingData[0][0].attach_to, data.account_rid, 1, 1, '', {}, 'created_datetime', 'DESC', 0, graphqlData)
                        let latestData : any = fetchLatestUpdatedData?.data?.notes?.[0] || null;
                        if (!latestData) {
                            await orgSequelize.query(rawQueries.insertNotesTimeline(schemaName, data, null));
                            return {
                                statusCode: HttpStatus.SUCCESS,
                                statusMessage: STATUS_MESSAGE.attachmentUpdatedSuccess,
                                data: null,
                            };
                        }
                        let finalStructuredData = {
                            rid : latestData.rid,
                            r_number: latestData.r_number,
                            created_datetime: latestData.created_datetime,
                            created_by: latestData.created_by,
                            modified_datetime: latestData.modified_datetime,
                            modified_by: latestData.modified_by,
                            account_rid: latestData.account_rid,
                            document_name: latestData.document_name,
                            attach_to: latestData.attach_to,
                            attachment_level: latestData.attachment_level,
                            fiscal_year: latestData.fiscal_year,
                            format: latestData.format,
                            size_in_mb: latestData.size_in_mb,
                            title: latestData.title,
                            notes_owner: latestData.notes_owner,
                            notes_owner_name : latestData.notes_owner_name,
                            descriptions : latestData.descriptions,
                            uploaded_by: latestData.uploaded_by,
                            attached_to: latestData.attached_to,
                            browse_file: latestData.browse_file,
                            created_by_name : latestData.created_by_name,
                            modified_by_name : latestData.modified_by_name,
                            parent_rid : latestData.parent_rid,
                            currency_rid : latestData.currency_rid  
                        }
                        await orgSequelize.query(rawQueries.insertNotesTimeline(schemaName, data, latestData))
                        return {
                            statusCode : HttpStatus.SUCCESS,
                            statusMessage : STATUS_MESSAGE.notesUpdatedSuccess,
                            data : finalStructuredData
                        }
                    }
                }
            }
        }
    }
}