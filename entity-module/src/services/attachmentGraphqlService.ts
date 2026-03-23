import Configurations from "../config/config";
import { initMainDbSequelize } from "../config/mainDataSource"
import { initOrgSequelize } from "../config/orgDataSource"
import { entityTypes, eventNames, eventTypes, HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../utils/constants"
import { logMessage, setInlineForAttachments } from "../utils/helpers"
import SchemaService from "./schemaService";

export default class AttachmentGraphqlServies {
    private attachmentService = Configurations.getInstance().getServices().attachmentServices;
    private schemaService : SchemaService
    constructor() {
        this.schemaService = new SchemaService();
      }
    
    async updateInlineGraphqlDetails(data : any) {
        logMessage(`Updating inline GraphQL details for account: ${JSON.stringify(data)}`);
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
                        let fetchLatestUpdatedData = await this.attachmentService.getAttachments(data.userId, checkForExistingData[0][0].attachment_level, checkForExistingData[0][0].attach_to, data.account_rid, 1, 1, '', {}, 'created_datetime', 'DESC', 0, graphqlData)
                        let latestData : any = fetchLatestUpdatedData?.data?.attachments?.[0] || null;
                        if (!latestData) {
                            await orgSequelize.query(rawQueries.insertAttachementTimeline(schemaName, data, null));
                            return {
                                statusCode: HttpStatus.SUCCESS,
                                statusMessage: STATUS_MESSAGE.attachmentUpdatedSuccess,
                                data: null,
                            };
                        }
                        let finalStructuredData = {
                            document_rid : latestData.rid,
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
                            document_category_rid: latestData.document_category_rid,
                            document_type_rid: latestData.document_type_rid,
                            document_category_others: latestData.document_category_others,
                            document_type_others: latestData.document_type_others,
                            comments: latestData.comments,
                            document_type: latestData.document_type,
                            document_category: latestData.document_category,
                            uploaded_by: latestData.uploaded_by,
                            attached_to: latestData.attached_to,
                            browse_file: latestData.browse_file
                                
                        }
                        await orgSequelize.query(rawQueries.insertAttachementTimeline(schemaName, data, latestData))
                        const userEventInfo:any = await this.schemaService.fetchUserAndEventInfo({userId: data.userId!, eventType: eventTypes.UI_HANDLER});
                        let projectFiscalId = latestData.attach_to;
                        if(latestData.attachment_level === 'project_resource' || latestData.attachment_level === 'project_task') {
                        if(latestData.attachment_level === 'project_resource') {
                            const projectResource = await this.fetchProjectResourceById(checkAccountExists[0][0].r_number, latestData.attach_to);
                        projectFiscalId = (projectResource as any)?.project_fiscal_rid || '';
                        }
                        if(latestData.attachment_level === 'project_task') {
                            const projectTask = await this.fetchProjectTaskById(checkAccountExists[0][0].r_number, latestData.attach_to);
                            projectFiscalId = (projectTask as any)?.project_fiscal_rid || '';
                        }
                        }
                        const timelineTypes = this.schemaService.getTimelineTypesForAttachmentLevel(latestData.attachment_level);
                        await this.schemaService.createAccountTimelineEntry(checkAccountExists[0][0].r_number, {
                                created_by: data.userId!,
                                account_rid: data.account_rid,
                                entity_rid: latestData.rid,
                                entity_name: entityTypes.ATTACHMENT,
                                created_by_name: userEventInfo.full_name,
                                event_type_rid: userEventInfo.event_type_rid,
                                event_name: eventNames.UPDATE,
                                descriptions: latestData.document_name,
                                //  project_rid: attachmentData.attachment_level === "project" ? attachmentData.attach_to : '',
                                project_rid: ['project', 'project_resource', 'project_task'].includes(latestData.attachment_level) ? projectFiscalId : '',
                                    case_rid:latestData.attachment_level === 'case' ? latestData.attach_to : '', 
                                }, timelineTypes);
                        return {
                            statusCode : HttpStatus.SUCCESS,
                            statusMessage : STATUS_MESSAGE.attachmentUpdatedSuccess,
                            data : finalStructuredData
                        }
                    }
                }
            }
        }
    }
     async fetchProjectResourceById(
        accountNumber: string,
        projectResourceId: string
      ) {
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
    
        const query = rawQueries.fetchProjectResourceById(schemaName);
    
        const sequelize = await initOrgSequelize()
        const result = await sequelize.query(query, {
          replacements: { projectResourceId },
          type: "SELECT",
          raw: true,
        });
        return result[0];
      }
    
      async fetchProjectTaskById(accountNumber: string, projectTaskId: string) {
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
    
        const query = rawQueries.fetchProjectTaskById(schemaName);
    
        const sequelize = await initOrgSequelize()
        const result = await sequelize.query(query, {
          replacements: { projectTaskId },
          type: "SELECT",
          raw: true,
        });
        return result[0];
      }
}