import { initMainDbSequelize } from "../config/mainDataSource";
import { initOrgSequelize } from "../config/orgDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE, TYPES } from "../utils/constants";
import { setResourceSkillData } from "../utils/helpers";
import resourceSkillSchemaService from "./resourceSkillSchemaService";

export default class ResourceSkillGraphQlService {

async updateInlineResourceSkill (data : any) {
    const mainSequelize = await initMainDbSequelize();
    const orgSequelize = await initOrgSequelize();

    let fetchParentAccount : any = await mainSequelize.query(rawQueries.fetchParentAccount(data.account_rid))
    if(fetchParentAccount[0].length < 1) {
        return {
            statusCode : HttpStatus.NOT_FOUND,
            statusMessage : STATUS_MESSAGE.accountNoFound,
            data : null
        }
    }
    else {
        let schemaName = `"${MAIN_SCHEMA_NAME}_${fetchParentAccount[0][0].r_number.replace('ACC-', '')}"`;
        let getResourceSkill : any = await orgSequelize.query(rawQueries.fetchResourceSkill(schemaName, data.resource_skill_rid))
        if(getResourceSkill[0].length < 1) {
            return {
                statusCode : HttpStatus.NOT_FOUND,
                statusMessage : STATUS_MESSAGE.resourceSkillNoFound,
                data : null
                }
            }
        else {
            if(data.skill_type_rid) {
                let checkSkillTypeRidValid = await mainSequelize.query(rawQueries.checkForExists(TYPES.SKILL_TYPE, data.skill_type_rid))
                if(checkSkillTypeRidValid[0].length < 1) {
                    return {
                        statusCode : HttpStatus.NOT_FOUND,
                        statusMessage : STATUS_MESSAGE.resourceSkillTypeNoFound,
                        data : null
                    }
                }
            }
            if(data.skill_subtype_rid) {
                let checkSkillSubTypeRidValid = await mainSequelize.query(rawQueries.checkForExists(TYPES.SKILL_SUBTYPE, data.skill_subtype_rid))
                if(checkSkillSubTypeRidValid[0].length < 1) {
                    return {
                        statusCode : HttpStatus.NOT_FOUND,
                        statusMessage : STATUS_MESSAGE.resourceSkillSubTypeNoFound,
                        data : null
                    }
                }
            }
            if(data.skill_level_rid) {
                let checkSkillLevelRidValid = await mainSequelize.query(rawQueries.checkForExists(TYPES.SKILL_LEVEL, data.skill_level_rid))
                if(checkSkillLevelRidValid[0].length < 1) {
                    return {
                        statusCode : HttpStatus.NOT_FOUND,
                        statusMessage : STATUS_MESSAGE.resourceSkillLevelNoFound,
                        data : null 
                    }
                }
            }
            let setSkillData = setResourceSkillData(getResourceSkill[0][0], data);
            let updateSkill = await orgSequelize.query(rawQueries.updateResourceSkillQuery(schemaName, setSkillData, data))
            if(updateSkill) {
                await orgSequelize.query(rawQueries.insertSkillTimeQuery(schemaName, data))
                for(let history of setSkillData) {
                    let attributeName;
                    let oldValue;
                    let newValue;
                    let splitData = history.split('=')[0]
                    let trimmedData = splitData.trim()

                    attributeName = trimmedData
                    oldValue = getResourceSkill[0][0][trimmedData]
                    newValue = data[trimmedData]
                    if(newValue == undefined) newValue = ''
                    else newValue = newValue
                    await orgSequelize.query(rawQueries.insertSkillHistory(schemaName, data, attributeName, oldValue, newValue))
                    let graphQlData : any = {};
                    graphQlData.is_graphQl = true
                    graphQlData.rid = data.resource_skill_rid
                    let fetchResourceSkillData = await resourceSkillSchemaService.executeQueries(
                        schemaName,
                        '',
                        '',
                        'resource_name',
                        'ASC',
                        data.resource_rid,
                        1,
                        0,
                        '',
                        data.account_rid,
                        graphQlData
                    )
                    let d = fetchResourceSkillData.data.resourceSkill[0]
                    let finalData = {
                        rid: d.rid,
                        r_number: d.r_number,
                        eid: d.eid,
                        created_by: d.created_by,
                        modified_by: d.modified_by,
                        created_datetime: d.created_datetime,
                        modified_datetime: d.modified_datetime,
                        account_rid: d.account_rid,
                        resource_rid: d.resource_rid,
                        resource_number: d.resource_number,
                        start_date: d.start_date,
                        skill_description: d.skill_description,
                        skill_type_others: d.skill_type_others,
                        skill_subtype_others: d.skill_subtype_others,
                        resource_code: d.resource_code,
                        skill_type_rid: d.skill_type_rid,
                        skill_subtype_rid: d.skill_subtype_rid,
                        skill_details: d.skill_details,
                        comments: d.comments,
                        status_rid: d.status_rid,
                        resource_type_rid: d.resource_type_rid,
                        skill_level_rid: d.skill_level_rid,
                        resource_name: d.resource_name,
                        resource_role: d.resource_role,
                        resource_orgname: d.resource_orgname,
                        resource_designation: d.resource_designation,
                        years_of_experience: d.years_of_experience,
                        account_name: d.account_name,
                        skill_type_name: d.skill_type_name,
                        skill_subtype_name: d.skill_subtype_name,
                        skill_level_name: d.skill_level_name
                    }
                    return {
                        statusCode : HttpStatus.SUCCESS,
                        statusMessage : STATUS_MESSAGE.resourceSkillUpdSuccess,
                        data : finalData
                    }
                }
            }
        }
    }










  }
}