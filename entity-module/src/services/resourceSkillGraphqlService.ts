import { initMainDbSequelize } from "../config/mainDataSource";
import { initOrgSequelize } from "../config/orgDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE, TYPES } from "../utils/constants";
import { setResourceSkillData } from "../utils/helpers";

export default class ResourceSkillGraphQlService {

async updateInlineResourceSkill (data : any) {
    const mainSequelize = await initMainDbSequelize();
    const orgSequelize = await initOrgSequelize();

    let fetchParentAccount : any = await mainSequelize.query(rawQueries.fetchParentAccount(data.account_rid))
    if(fetchParentAccount[0].length < 1) {
        return {
            statusCode : HttpStatus.NOT_FOUND,
            statusMessage : STATUS_MESSAGE.accountNoFound
        }
    }
    else {
        let schemaName = `"${MAIN_SCHEMA_NAME}_${fetchParentAccount[0][0].r_number.replace('ACC-', '')}"`;
        let getResourceSkill : any = await orgSequelize.query(rawQueries.fetchResourceSkill(schemaName, data.resource_skill_rid))
        if(getResourceSkill[0].length < 1) {
            return {
                statusCode : HttpStatus.NOT_FOUND,
                statusMessage : STATUS_MESSAGE.resourceSkillNoFound
                }
            }
        else {
            if(data.skill_type_rid) {
                let checkSkillTypeRidValid = await mainSequelize.query(rawQueries.checkForExists(TYPES.SKILL_TYPE, data.skill_type_rid))
                if(checkSkillTypeRidValid[0].length < 1) {
                    return {
                        statusCode : HttpStatus.NOT_FOUND,
                        statusMessage : STATUS_MESSAGE.resourceSkillTypeNoFound
                    }
                }
            }
            if(data.skill_subtype_rid) {
                let checkSkillSubTypeRidValid = await mainSequelize.query(rawQueries.checkForExists(TYPES.SKILL_SUBTYPE, data.skill_subtype_rid))
                if(checkSkillSubTypeRidValid[0].length < 1) {
                    return {
                        statusCode : HttpStatus.NOT_FOUND,
                        statusMessage : STATUS_MESSAGE.resourceSkillSubTypeNoFound
                    }
                }
            }
            if(data.skill_level_rid) {
                let checkSkillLevelRidValid = await mainSequelize.query(rawQueries.checkForExists(TYPES.SKILL_LEVEL, data.skill_level_rid))
                if(checkSkillLevelRidValid[0].length < 1) {
                    return {
                        statusCode : HttpStatus.NOT_FOUND,
                        statusMessage : STATUS_MESSAGE.resourceSkillLevelNoFound
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
                    return {
                        statusCode : HttpStatus.SUCCESS,
                        statusMessage : STATUS_MESSAGE.resourceSkillUpdSuccess
                    }
                }
            }
        }
    }










  }
}