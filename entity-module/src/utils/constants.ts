export const HttpStatus = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  FAILED: 500,
  PROMPT: 210, 
  UNAUTHORIZED: 401,
  SUCCESS_MESSAGE: "Success",
  PROMPT_MESSAGE: "Prompt",
  BAD_REQUEST_MESSAGE: "BadRequest",
  NOT_FOUND_MESSAGE: "NotFound",
  FORBIDDEN_MESSAGE: "Forbidden",
  FAILED_MESSAGE: "Failed",
  UNAUTHORIZED_MESSAGE: "Unauthorized",
  SUCCESS_NOTIFICATION: "Operation completed successfully!",
}

export const MAIN_SCHEMA_NAME = "trd365"

export const NODE_ENV = {
  DEV: "DEV",
  PROD: "PRODUCTION"
}

export const constants = {
  SQL_GET_USER: `SELECT status_description as status, "user".rid, email, profile_rid FROM ${MAIN_SCHEMA_NAME}."user" as "user" ,${MAIN_SCHEMA_NAME}."status" as status WHERE  "user".status_rid = status.rid and {whereClause} LIMIT 1`,
  SQL_GET_PERMISSION: `SELECT rid FROM ${MAIN_SCHEMA_NAME}."module_permission" WHERE permission_name = :permissionName LIMIT 1`,
  SQL_GET_PROFILE_ACCESS: `SELECT is_enabled FROM ${MAIN_SCHEMA_NAME}."profile_permission_access" WHERE profile_id = :profileId AND module_permission_id = :permissionId LIMIT 1`,
  SQL_GET_USER_ACCESS: `SELECT is_enabled FROM ${MAIN_SCHEMA_NAME}."user_permission_access" WHERE user_id = :userId AND module_permission_id = :permissionId LIMIT 1`,
  SQL_INSERT_API_DENIAL: `INSERT INTO ${MAIN_SCHEMA_NAME}."user_api_access_denials" (rid, user_id, permission_id, permission_name, api_endpoint, created_datetime, updated_datetime) VALUES (:rid, :userId, :permissionId, :permissionName, :apiEndpoint, NOW(), NOW())`,
  SQL_GET_ACCOUNT: `SELECT status, rid FROM ${MAIN_SCHEMA_NAME}."account" WHERE rid = :rid LIMIT 1`,
  SELECT: 'SELECT',
  INSERT: 'INSERT'
}
export const ENV_PREFIX = process.env.NODE_ENV_DB_PREFIX || 'D001-';
export const R_NUMBER_PREFIX = {
  ACCOUNT_FISCAL_REGION: "ACFR",
  ACCOUNT_FISCAL: "ACF",
  PROJECT: 'PRJ',
  PROJECT_FISCAL: 'PFI',
  PROJECT_FISCAL_REGION: 'PFIR',
  PROJECT_HISTORY: 'PRH',
  PROJECT_TIMELINE: 'PRT',
  RESOURCE: 'RES',
  RESOURCE_HISTORY: 'REH',
  RESOURCE_TIMELINE: 'RTL',
  RESOURCE_SKILL: 'RSK',
  RESOURCE_SKILL_HISTORY: 'RSH',
  RESOURCE_SKILL_TIMELINE: 'RST',
  RESOURCE_COST: 'RCO',
  RESOURCE_COST_HISTORY: 'RCH',
  RESOURCE_COST_TIMELINE: 'RCT',
  RESOURCE_FISCAL: 'RSF',
  RESOURCE_FISCAL_REGION: 'RSFR',
  PROJECT_FISCAL_SUMMARY: 'PFS',
  CLASSIFICATION: 'CSF',
  KEY_CONTACT_DETAILS: 'KEY',
  ATTACHMENT: 'ATT',
  ATTACHMENT_TIMELINE: 'ATI',
  PROJECT_RESOURCE: 'PRS',
  PROJECT_RESOURCE_FISCAL: 'PRSF',
  PROJECT_RESOURCE_FISCAL_REGION: 'PRSFR',
  PROJECT_RESOURCE_HISTORY: 'PRSH',
  PROJECT_RESOURCE_TIMELINE: 'PRST',
}

export const STATUS_MESSAGE = {
  accountInactive : "Inactive Account",
  accountNoFound : "Account not found",
  accountUpdateSuccess : "Account updated successfully",
  accountIdMissing : "Account RID mising",
  oneFieldRequired : "Atleast one field is required to update",
  keyContactIdMissing : "Key-Contact RID is missing",
  projectUpdateSuccess : "Field updated successfully",
  projectIdMissing : "Project RID missing",
  fiscalIdMissing : "Project-Fiscal RID is missing",
  projectCodeMissing : "Project-Code missing",
  active : "Active",
  inactive : "In-Active",
  resourceInactive : "Resource you are trying to update is currently In-Active",
  eventUpdate : "Update",
  uiHandler : "ui handler",
  success : "success",
  resourceUpdateSuccess : "Resource updated successfully",
  resourceTypeNotFound : "Resource Type you are trying to update is invalid",
  countryNotFound : "Country you are trying to update is invalid",
  stateNotFound : "Region you are trying to update is invalid",
  resourceIdMissing : "Resource RID missing",
  invalidKeyData : "Invalid Id for update. Kindly check RID and update again.",
  resourceCostNotFound : "Resource Cost not found",
  resourceCostUpdSuccess : "Resource Cost updated successfully",
  duplicateProjectCode : "Project Code already exists",
  costIdMissing : "Resource Cost RID missing",
  skillIdMissing : "Resource Skill RID missing",
  currencyInvalid : "Currency you are trying to update is invalid",
  projectCodeDuplicate : "Project Code already exists",
  resourceCodeDuplicate : "Resource Code already exists",
  resourceSkillNoFound : "Resource Skill you are trying to update is invalid",
  resourceSkillTypeNoFound : "Resource SkillType you are trying to update is invalid",
  resourceSkillSubTypeNoFound : "Resource Skill SubType you are trying to update is invalid",
  resourceSkillLevelNoFound : "Resource Skill level you are trying to update is invalid",
  resourceSkillUpdSuccess : "Resource Skill updated successfully",
    
}

export const TYPES = {
  SKILL_TYPE : "skill_type",
  SKILL_SUBTYPE : "skill_subtype",
  SKILL_LEVEL : "skill_level"
}

export const rawQueries = {
  fetchParentAccount (accountRid : string) {
      return `
      with fetch_account_details AS (
      SELECT rid, r_number, parent_account_rid FROM ${MAIN_SCHEMA_NAME}.account where rid = '${accountRid}'
      )
      SELECT a.rid, a.r_number, a.account_name, a.is_parent 
      FROM ${MAIN_SCHEMA_NAME}.account a
      LEFT JOIN fetch_account_details ad ON ad.parent_account_rid = a.rid
      WHERE a.rid = ad.parent_account_rid`
  },
  findProject (schemaName : string, projectRid : string, accountRid : string) {
    return `
            SELECT * FROM ${schemaName}.project p WHERE rid = '${projectRid}' AND account_rid = '${accountRid}' 
            `
  },
  findProjectFiscal (schemaName : string, projectRid : string, accountRid : string, projectFiscalRid : string) {
    return `
            SELECT * FROM ${schemaName}.project_fiscal p WHERE project_rid = '${projectRid}' AND account_rid = '${accountRid}' AND rid = '${projectFiscalRid}'
            `
  },
  findProjectSummary (data : any) {
    return `
            SELECT * FROM ${MAIN_SCHEMA_NAME}.project_summary p WHERE project_rid = '${data.project_rid}' AND account_rid = '${data.account_rid}'
            `
  },
  findProjectFiscalSummary (data : any) {
    return `
            SELECT * FROM ${MAIN_SCHEMA_NAME}.project_fiscal_summary p WHERE project_rid = '${data.project_rid}' AND account_rid = '${data.account_rid}' AND project_fiscal_rid = '${data.project_fiscal_rid}'
            `
  },
  checkProjectIdDuplicate (schemaName : string, data : any) {
    return `
                SELECT p.rid, p.project_code, p.fiscal_year 
                FROM ${schemaName}.project_fiscal p
                WHERE
                p.account_rid = '${data.account_rid}'
                AND
                p.rid = '${data.project_fiscal_rid}'
                AND
                p.fiscal_year IN (
                SELECT fiscal_year FROM ${schemaName}.project_fiscal pf
                WHERE 
                pf.account_rid = '${data.account_rid}'
                AND
                pf.project_code ILIKE '%${data.project_code}%'
                AND
                pf.rid != p.rid
                )
                `
  },
  updateProject(schemaName : string, setProjectData : any, data : any) {
    return `
            UPDATE 
                ${schemaName}.project 
                SET 
                ${setProjectData.join(',')} 
                WHERE 
                    rid = '${data.project_rid}'
                    AND
                    account_rid = '${data.account_rid}'`
  },
  updateProjectFiscal (schemaName : string, setProjectFiscalData : any, data : any) {
    return `
            UPDATE 
                ${schemaName}.project_fiscal
            SET
                ${setProjectFiscalData.join(',')}
            WHERE 
                rid = '${data.project_fiscal_rid}'
                AND
                account_rid = '${data.account_rid}'
                AND
                project_rid = '${data.project_rid}'
            `
  },
  updateProjectSummary(setProjectSummary : any, data : any) {
    return `
            UPDATE
                ${MAIN_SCHEMA_NAME}.project_summary
            SET
                ${setProjectSummary.join(',')}
            WHERE 
                account_rid = '${data.account_rid}'
                AND
                project_rid = '${data.project_rid}'
            `
  },
  updateProjectFiscalSummary(setProjectFiscalSummary : any, data : any) {
    return `
            UPDATE
                ${MAIN_SCHEMA_NAME}.project_fiscal_summary
            SET
                ${setProjectFiscalSummary.join(',')}
            WHERE
                project_fiscal_rid = '${data.project_fiscal_rid}'
                AND
                project_rid = '${data.project_rid}'
                AND
                account_rid = '${data.account_rid}'            
            `
  },
  fetchResources (schemaName : string, data : any) {
    return `
            SELECT * 
            FROM ${schemaName}.resources 
            WHERE 
            rid = '${data.resource_rid}' AND account_rid = '${data.account_rid}' 
            `
  },
  checkResourceActive(fetchResources : any) {
    return `SELECT status_name FROM ${MAIN_SCHEMA_NAME}.status WHERE rid = '${fetchResources[0][0].status_rid}'`
  },
  checkResourceTypeExists(data : any) {
    return `SELECT 1 FROM ${MAIN_SCHEMA_NAME}.resource_type WHERE rid = '${data.resource_type_rid}'`
  },
  checkCountryExists(data : any) {
    return `SELECT 1 FROM ${MAIN_SCHEMA_NAME}.country WHERE rid = '${data.country_rid}'`
  },
  checkRegionExists(data : any) {
    return `SELECT 1 FROM ${MAIN_SCHEMA_NAME}.state WHERE rid = '${data.region_rid}'`
  },
  isResourceCodeDuplicate(schemaName : string, data : any) {
    return `
            SELECT resource_code FROM ${schemaName}.resources
            WHERE 
              account_rid = '${data.account_rid}'
              AND
              resource_code ILIKE '%${data.resource_code}%'
              AND
              rid != '${data.resource_rid}'
            
            `
  },
  updateResourceQuery (schemaName : string, setResource : any, data : any) {
    return `
            UPDATE ${schemaName}.resources
            SET
              ${setResource.join(',')}
            WHERE
              rid = '${data.resource_rid}'
              AND
              account_rid = '${data.account_rid}'
            `
  },
  getResourceFiscalQuery (schemaName : string, data : any) {
    return `SELECT * FROM ${schemaName}.resource_fiscal WHERE account_rid = '${data.account_rid}' AND resource_rid = '${data.resource_rid}'`
  },
  updateResourceFiscalQuery (schemaName : string, setFiscalData : any, fetchResourceFiscal : any, data : any) {
    return `
            UPDATE ${schemaName}.resource_fiscal
            SET
              ${setFiscalData.join(',')}
            WHERE
              rid = '${fetchResourceFiscal[0][0].rid}'
              AND
              account_rid = '${data.account_rid}'
              AND
              resource_rid = '${data.resource_rid}'
            `
  },
  insertQueryResTimeline(schemaName : string, data : any) {
    return `
            INSERT INTO ${schemaName}.resources_timeline
            (created_by, created_datetime, account_rid, entity_rid, event_name, event_type, event_status, event_datetime)
            VALUES ('${data.userId}', NOW(), '${data.account_rid}', 
            '${data.resource_rid}','${STATUS_MESSAGE.eventUpdate}', '${STATUS_MESSAGE.uiHandler}', '${STATUS_MESSAGE.success}', NOW())
            `
  },
  insertQueryResHistory(schemaName : string, data : any, attributeName : any, oldValue : any, newValue : any) {
    return `INSERT INTO ${schemaName}.resources_history
      (created_by, created_datetime, resource_rid, attribute_name, old_value, new_value)
      VALUES ('${data.userId}', NOW(), '${data.resource_rid}', '${attributeName}',
      '${oldValue}', '${newValue}')`
  },
  isResourceCostExists (schemaName : string, data : any) {
    return `
        SELECT 
          * 
        FROM 
          ${schemaName}.resource_cost 
        WHERE
          rid = '${data.resource_cost_rid}'
          AND
          resource_rid = '${data.resource_rid}'
          AND
          account_rid = '${data.account_rid}'   
        `
  },
  isCurrencyExists(data : any) {
    return `SELECT 1 FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid = '${data.currency_rid}'`
  },
  updateResourceCostQuery (schemaName : string, setResourceCost : any, data : any) {
    return `
          UPDATE ${schemaName}.resource_cost
          SET
           ${setResourceCost.join(',')}
          WHERE
            rid = '${data.resource_cost_rid}'
            AND
            account_rid = '${data.account_rid}'
            AND
            resource_rid = '${data.resource_rid}'
          `
  },
  insertResCostTimelineQuery (schemaName : string, data : any) {
    return `
      INSERT INTO ${schemaName}.resource_cost_timeline
      (created_by, created_datetime, account_rid, event_name, event_status, event_type, entity_rid, event_datetime)
      VALUES
      ('${data.userId}', NOW(), '${data.account_rid}', '${STATUS_MESSAGE.eventUpdate}', '${STATUS_MESSAGE.success}', 
      '${STATUS_MESSAGE.uiHandler}', '${data.resource_cost_rid}', NOW())
      `
  },
  insertResCostHisQuery (schemaName : string, data : any, attribute_name : any, oldValue : any, newValue : any) {
    return `
      INSERT INTO ${schemaName}.resource_cost_history
      (created_by, created_datetime, resource_cost_rid, attribute_name, old_value, new_value)
      VALUES
      ('${data.userId}', NOW(), '${data.resource_cost_rid}', '${attribute_name}', '${oldValue}', '${newValue}')`
  },
  setFiscalYear(schemaName : string, setFiscal : any, data : any) {
    return `UPDATE ${schemaName}.resource_fiscal 
            SET fiscal_year = ${setFiscal}
              WHERE
                resource_rid = '${data.resource_rid}'
                AND
                account_rid = '${data.account_rid}'`  
  },
  fetchResourceSkill(schemaName : string, resource_skill_rid : string) {
    return `SELECT * FROM ${schemaName}.resource_skill WHERE rid = '${resource_skill_rid}'`
  },
  checkForExists(type : string, rid : string) {
    return `SELECT 1 FROM ${MAIN_SCHEMA_NAME}.${type} WHERE rid = '${rid}'`
  },
  updateResourceSkillQuery (schemaName : string, setSkillData : string[], data : any) {
    return `UPDATE 
            ${schemaName}.resource_skill 
            SET ${setSkillData.join(',')}
            WHERE
              rid = '${data.resource_skill_rid}'
              AND
              account_rid = '${data.account_rid}'
              AND
              resource_rid = '${data.resource_rid}'
            `},
  insertSkillTimeQuery (schemaName : string, data : any) {
    return `
          INSERT INTO ${schemaName}.resource_skill_timeline
            (created_by, created_datetime, account_rid, event_name, event_status, event_type, entity_rid, event_datetime)
          VALUES
            ('${data.userId}', NOW(), '${data.account_rid}', '${STATUS_MESSAGE.eventUpdate}', '${STATUS_MESSAGE.success}', '${STATUS_MESSAGE.uiHandler}', '${data.resource_skill_rid}', NOW())
          `
  },
  insertSkillHistory (schemaName : string, data : any, attributeName : string, oldValue : string, newValue : string) {
    return `
          INSERT INTO ${schemaName}.resource_skill_history
              (created_by, created_datetime, resource_skill_rid, attribute_name, old_value, new_value)
          VALUES
              ('${data.userId}', NOW(), '${data.resource_skill_rid}', '${attributeName}', '${oldValue}', '${newValue}')
          `
  },
  fetchQreFromPrjSum (project_rid : string, account_rid : string) {
    return `SELECT qre FROM ${MAIN_SCHEMA_NAME}.project_summary WHERE project_rid = '${project_rid}' AND account_rid = '${account_rid}'`
  }
}