import { Sequelize } from "sequelize";
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
  PROJECT_TASK: `PTA`,
  PROJECT_TASK_FISCAL: 'PTAF',
  PROJECT_TASK_TIMELINE: 'PTAT',
  PROJECT_TASK_HISTORY: 'PTAH',
}

export const STATUS_MESSAGE = {
  accountInactive : "Inactive Account",
  accountNoFound : "Account not found",
  accountUpdateSuccess : "Account updated successfully",
  accountIdMissing : "Account RID mising",
  importIdMissing : "Import RID mising",
  entityTypeMissing : "Entity type mising",
  oneFieldRequired : "Atleast one field is required to update",
  keyContactIdMissing : "Key-Contact RID is missing",
  projectUpdateSuccess : "Field updated successfully",
  projectIdMissing : "Project RID missing",
  projectTaskIdMissing : "Project Task RID is missing",
  fiscalIdMissing : "Project-Fiscal RID is missing",
  projectCodeMissing : "Project-Code missing",
  resourceNotFound : "Resource not found",
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
  noAttachmentRecordFound : "No Attachment record found",
  noDataToUpdate : "Data is requried to update",
  attachmentUpdatedSuccess : "Attachment details updated successfully",
  projectTaskUpdatedSuccess: "Project task details updated successfully",
  userIdEmpty : "User-Id is missing",
  attachmentIdMissing : "Attachment RID missing",
  docCatInvalid : "Document category you are trying to update is invalid",
  docTypeInvalid : "Document Type you are trying to update is invalid",
  NoResourceFound : "No Resource found",
  separateDb : "separate_db",
  fiscalYearAlreadyExists : "Duplicate fiscal year not allowed",
  targetLoadSuccess : "Success",
  targetLoadFailed : "Failed",
  importListedSuccess : "Imports listed successfully",
  importsNoFound : "No imports found",
  importUpdatedSuccess : "Import updated successfully",
  projectTaskNotFound : "Project Task not found",
  settingsUpdatedSuccess : "Operation updated successfully",
  userIdMissingInHeader : "User-ID missing in headers",
  fiscalStartDateMissing : "Fiscal Startdate missing",
  fiscalEndDateMissing : "Fiscal Enddate missing",
  autoAccessmentMissing : "Auto Assessment missing",
  autoSendMissing : "Autosend Interaction missing",
  maxAiMissing : "Max AI Interaction missing",
  accountSummaryHighlightsSuccess : "Financial Summary fetched successfully",
  effortExceeded : "Effort cannot exceed the total hours in the duration",
  effort24HrsExceeded : "Effort cannot exceed 24 hours for the day",
}

export const TYPES = {
  SKILL_TYPE : "skill_type",
  SKILL_SUBTYPE : "skill_subtype",
  SKILL_LEVEL : "skill_level"
}

export const rawQueries = {
  async fetchParentAccount (accountRid : any, mainSequelize : Sequelize) : Promise <any> {
    let checkIsSeparateDb : any = await mainSequelize.query(`SELECT rid, r_number, account_name, storage_type FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`)
    if(checkIsSeparateDb[0][0].storage_type == STATUS_MESSAGE.separateDb) {
      return `SELECT rid, r_number, account_name, storage_type FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`
    } else {
      return `
      with fetch_account_details AS (
      SELECT rid, r_number, parent_account_rid FROM ${MAIN_SCHEMA_NAME}.account where rid = '${accountRid}'
      )
      SELECT a.rid, a.r_number, a.account_name, a.is_parent 
      FROM ${MAIN_SCHEMA_NAME}.account a
      LEFT JOIN fetch_account_details ad ON ad.parent_account_rid = a.rid
      WHERE a.rid = ad.parent_account_rid`
    }
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
                pf.project_code ILIKE '%${data.project_code.replace(/'/g, "''")}%'
                AND
                pf.rid != p.rid
                )
                `
  },
  updateProject(schemaName : string, project_code : string, data : any) {
    return `
            UPDATE 
                ${schemaName}.project 
                SET 
                project_code = '${project_code.replace(/'/g, "''")}' 
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
  updateProjectSummary(project_code : string, data : any) {
    return `
            UPDATE
                ${MAIN_SCHEMA_NAME}.project_summary
            SET
                project_code = '${project_code.replace(/'/g, "''")}'
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
  },
  findAttachementDetails (schemaName : string, rid : string, account_rid : string) {
    return `
      SELECT * FROM ${schemaName}.attachments WHERE rid = '${rid}' AND account_rid = '${account_rid}'`
  },
  findProjectTaskDetails (schemaName : string, rid : string, account_rid : string) {
    return `
      SELECT * FROM ${schemaName}.project_task WHERE rid = '${rid}' AND account_rid = '${account_rid}'`
  },
  fetchSchemaName(r_number : string) {
    return `${MAIN_SCHEMA_NAME}_${r_number.replace('ACC-', '')}`
  },
  updateAttachmentQuery (schemaName : string, getSetData : any, data : any) {
    return `
    UPDATE 
        ${schemaName}.attachments 
    SET 
        ${getSetData.data.join(',')}
    WHERE
        rid = '${data.rid}'
        AND
        account_rid = '${data.account_rid}'`
  },
  updateProjectTaskQuery (schemaName : string, getSetData : any, data : any) {
    return `
    UPDATE 
        ${schemaName}.project_task 
    SET 
        ${getSetData.data.join(',')}
    WHERE
        rid = '${data.rid}'
        AND
        account_rid = '${data.account_rid}'`
  },
  updateAttachmentSummary (getSetData : any, data : any) {
    return `
          UPDATE
              ${MAIN_SCHEMA_NAME}.attachment_summary
          SET
              ${getSetData.data.join(',')}
          WHERE
              document_rid = '${data.rid}'
              AND
              account_rid = '${data.account_rid}'
          `
  },
  insertAttachementTimeline (schemaName : string, data : any, latestData : any) {
    return `
          INSERT INTO ${schemaName}.attachment_timeline
          (created_by, modified_by, document_rid, document_name, document_category_rid, document_type_rid, attach_to, attachment_level, event_type, event_status, event_name, event_datetime)
          VALUES
          ('${data.userId}', '${data.userId}', '${latestData.rid}', '${latestData.document_name}', '${latestData.document_category_rid}', '${latestData.document_type_rid}', '${latestData.attach_to}',
          '${latestData.attachment_level}', '${STATUS_MESSAGE.uiHandler}', '${STATUS_MESSAGE.success}', '${STATUS_MESSAGE.eventUpdate}', NOW()
          )`
  },
  checkDocCategoryExists(rid : string) {
    return `SELECT 1 FROM ${MAIN_SCHEMA_NAME}.document_category where rid = '${rid}'`
  },
  checkDocTypeExists(rid : string) {
    return `SELECT 1 FROM ${MAIN_SCHEMA_NAME}.document_type where rid = '${rid}'`
  },
  updateProjectFiscalPrjCode (schemaName : string, newProject_code : string, account_rid : string, project_rid : string, existing_project_code : string) {
    return `
    UPDATE ${schemaName}.project_fiscal SET project_code = '${newProject_code.replace(/'/g, "''")}'
    WHERE
    account_rid = '${account_rid}' AND project_rid = '${project_rid}' AND project_code = '${existing_project_code.replace(/'/g, "''")}'
    `
  },
    updateProjectFiscalSummaryPrjCode (newProject_code : string, account_rid : string, project_rid : string, existing_project_code : string) {
    return `
    UPDATE ${MAIN_SCHEMA_NAME}.project_fiscal_summary SET project_code = '${newProject_code.replace(/'/g, "''")}'
    WHERE
    account_rid = '${account_rid}' AND project_rid = '${project_rid}' AND project_code = '${existing_project_code.replace(/'/g, "''")}'
    `
  },
  insertProjectTimeline(schemaName : string, data : any) {
    return `INSERT INTO ${schemaName}.project_timeline
                (created_by, created_datetime, account_rid, entity_rid, event_name, event_type, event_status, event_datetime)
                VALUES
                ('${data.userId}', NOW(), '${data.account_rid}', '${data.project_rid}', '${STATUS_MESSAGE.eventUpdate}', '${STATUS_MESSAGE.uiHandler}', '${STATUS_MESSAGE.success}', NOW())
       `
  },
  insertProjectHistory(schemaName : string, data : any, attributeName : string, newValue : string, oldValue : string) {
    return `
    INSERT INTO ${schemaName}.project_history
    (created_by, created_datetime, project_rid, attribute_name, old_value, new_value)
    VALUES
    ('${data.userId}', NOW(), '${data.project_rid}', '${attributeName}', '${oldValue}', '${newValue}')
    `
  },
  checkForDuplicateFiscalYear (schemaName : string, data : any) {
    return `
    SELECT p.rid, p.project_code, p.fiscal_year 
    FROM 
      ${schemaName}.project_fiscal p
    WHERE
      p.account_rid = '${data.account_rid}'
      AND
      p.rid = '${data.project_fiscal_rid}'
      AND
      p.project_code IN (
      SELECT project_code FROM ${schemaName}.project_fiscal pf
      WHERE 
      pf.account_rid = '${data.account_rid}'
      AND
      pf.fiscal_year = ${data.fiscal_year}
      AND
      pf.rid != p.rid
      )`
  },
  GET_DOCUMENT_TYPES: `
    SELECT rid, type_name 
    FROM ${MAIN_SCHEMA_NAME}.document_type 
    WHERE rid IN (:documentTypeIds)
  `,

  GET_DOCUMENT_CATEGORIES: `
    SELECT rid, category_name 
    FROM ${MAIN_SCHEMA_NAME}.document_category 
    WHERE rid IN (:documentCategoryIds)
  `,

  GET_USERS: `
    SELECT rid, concat(first_name,' ',last_name) as full_name 
    FROM ${MAIN_SCHEMA_NAME}.user 
    WHERE rid IN (:userIds)
  `,
  GET_RESOURCE_TYPES: `
  SELECT resource_type_name FROM ${MAIN_SCHEMA_NAME}.resource_type WHERE rid IN (:resourceTypeRid)
  `,
  GET_COUNTRIES:`
  SELECT country_name FROM ${MAIN_SCHEMA_NAME}.country WHERE rid IN (:countryRid)
  `,
  GET_REGIONS:`
  SELECT state_name FROM ${MAIN_SCHEMA_NAME}.state WHERE rid IN (:regionRid)
  `,
  GET_CURRENCIES:`
  SELECT rid, currency_symbol, currency_name FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid IN (:currencyRid)
  `,
  GET_STATUSES:`
  SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.status WHERE rid IN (:statusRid)
  `,
  fetchUserDetailsById (userId : string) {
    return `SELECT CONCAT(first_name, ' ', last_name) AS imported_by FROM ${MAIN_SCHEMA_NAME}.user WHERE rid = '${userId}'`
  },
  updateImport(schemaName : string, updatedData : any, rid : string) {
    return `UPDATE ${schemaName}.import SET fiscal_year = ${updatedData.fiscal_year} WHERE rid = '${rid}'`
  },
  fetchChildAccountsByParentAccountRid(){
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.account WHERE parent_account_rid = :parentRid`
  },
  findResourceByCode(schemaName: string, resource_code: string){
     return `SELECT rid FROM ${schemaName}.resources WHERE resource_code = '${resource_code}'`},
  GET_ACCOUNT_ACCESS:`
(
  (
    EXISTS (
      SELECT 1 FROM ${MAIN_SCHEMA_NAME}.user_group_entity_access uea
      WHERE uea.user_rid = ? 
      AND uea.entity_type = 'ACCOUNT'
      AND uea.entity_rid = ps.account_rid
      AND uea.access_type = 'INCLUDE' 
    )
    OR EXISTS (
      SELECT 1 FROM ${MAIN_SCHEMA_NAME}.user_group_mapping ugm
      JOIN ${MAIN_SCHEMA_NAME}.user_group_entity_access ugea 
        ON ugea.group_rid = ugm.group_rid
      WHERE ugm.user_rid = ?
      AND ugea.entity_type = 'ACCOUNT'
      AND ugea.entity_rid = ps.account_rid
      AND ugea.access_type = 'INCLUDE'
    )
  )
  AND NOT EXISTS (
    SELECT 1 FROM ${MAIN_SCHEMA_NAME}.user_group_entity_access uea
    WHERE uea.user_rid = ? 
    AND uea.entity_type = 'ACCOUNT'
    AND uea.entity_rid = ps.account_rid
    AND uea.access_type = 'EXCLUDE'
  )
  AND NOT EXISTS (
    SELECT 1 FROM ${MAIN_SCHEMA_NAME}.user_group_mapping ugm
    JOIN ${MAIN_SCHEMA_NAME}.user_group_entity_access ugea 
      ON ugea.group_rid = ugm.group_rid
    WHERE ugm.user_rid = ?
    AND ugea.entity_type = 'ACCOUNT'
    AND ugea.entity_rid = ps.account_rid
    AND ugea.access_type = 'EXCLUDE'
  )
)`,
  GET_PROJECT_ACCESS:`
      AND (
        (
          EXISTS (
            SELECT 1 FROM ${MAIN_SCHEMA_NAME}.user_group_entity_access uea
            WHERE uea.user_rid = ? 
            AND uea.entity_type = 'PROJECT'
            AND uea.entity_rid = ps.project_rid
            AND uea.access_type = 'INCLUDE'
          )
          OR EXISTS (
            SELECT 1 FROM ${MAIN_SCHEMA_NAME}.user_group_mapping ugm
            JOIN ${MAIN_SCHEMA_NAME}.user_group_entity_access ugea 
              ON ugea.group_rid = ugm.group_rid
            WHERE ugm.user_rid = ?
            AND ugea.entity_type = 'PROJECT'
            AND ugea.entity_rid = ps.project_rid
            AND ugea.access_type = 'INCLUDE'
          )
        )
        AND NOT EXISTS (
          SELECT 1 FROM ${MAIN_SCHEMA_NAME}.user_group_entity_access uea
          WHERE uea.user_rid = ? 
          AND uea.entity_type = 'PROJECT'
          AND uea.entity_rid = ps.project_rid
          AND uea.access_type = 'EXCLUDE'
        )
        AND NOT EXISTS (
          SELECT 1 FROM ${MAIN_SCHEMA_NAME}.user_group_mapping ugm
          JOIN ${MAIN_SCHEMA_NAME}.user_group_entity_access ugea 
            ON ugea.group_rid = ugm.group_rid
          WHERE ugm.user_rid = ?
          AND ugea.entity_type = 'PROJECT'
          AND ugea.entity_rid = ps.project_rid
          AND ugea.access_type = 'EXCLUDE'
        )
      )
    `,
  async updateSetting(schemaName : string, data : any, orgDb : Sequelize, mainDb : Sequelize) {
    let tableName : string[];
    let whereParams : string = ``
    let setValues : string;
    let schema : string = ``
    let dbConnection : any

    if(data.flag == UPDATE_FLAG.project) {
      tableName = [`project_fiscal`, `project_fiscal_summary`]
      
      setValues = `
      blended_rate_fte = ${data.blended_rate_fte == '' ? null : parseFloat(data.blended_rate_fte)},
      blended_rate_subcon = ${data.blended_rate_subcon == '' ? null : parseFloat(data.blended_rate_subcon) },
      auto_send_ai_interaction = ${data.autosend_interaction},
      max_ai_interaction = ${data.max_ai_interactions},
      auto_access_rd = ${data.auto_access_rd},
      modified_by = '${data.userId}',
      modified_datetime = NOW()`
    } else {
      tableName = [`account_details`]
      setValues = 
      `
      blended_rate_fte = ${data.blended_rate_fte == '' ? null : parseFloat(data.blended_rate_fte)},
      blended_rate_subcon = ${data.blended_rate_subcon == '' ? null : parseFloat(data.blended_rate_subcon) },
      autosend_interaction = ${data.autosend_interaction},
      max_ai_interactions = ${data.max_ai_interactions},
      auto_access_rd = ${data.auto_access_rd},
      modified_by = '${data.userId}',
      modified_datetime = NOW()`
    }
    for(let t of tableName) {
      if(t == 'project_fiscal') {
        schema = schemaName
        whereParams = `WHERE account_rid = '${data.account_rid}' AND rid = '${data.project_fiscal_rid}'`
        dbConnection = orgDb
      }
      else if(t == 'project_fiscal_summary') {
        schema = MAIN_SCHEMA_NAME
        whereParams = `WHERE account_rid = '${data.account_rid}' AND project_fiscal_rid = '${data.project_fiscal_rid}'`
        dbConnection = mainDb
      }
      else if(t == 'account_details') {
        schema = schemaName
        whereParams = `WHERE account_rid = '${data.account_rid}'`
        dbConnection = orgDb
      }
      let query = `
      UPDATE ${schema}.${t}
      SET
      ${setValues}
      ${whereParams}
      `
      await dbConnection.query(query)
    }
    return HttpStatus.SUCCESS_MESSAGE 
  },
}

export const IMPORT_FILTER_COLUMNS : any = {
  file_name: "document_name",
  format: "document_format",
  size: "document_size",
  fiscal: "fiscal_year",
  entity: "entity_type",
  total_records: "total_records",
  records_loaded_successfully: "records_loaded_successfully",
  records_failed_to_load: "records_failed_to_load",
  status: "document_status",
  imported_on: "uploaded_datetime",
  status_description: "upload_failure_reason",
  import_type: "import_type",
  imported_by: "uploaded_by_user_rid",
  records_with_warning: "total_staging_warning_count",
  r_number : "r_number"
}

export const IMPORT_DOC_FILTER_KEYS = {
  format: "format",
  size: "size",
  status : "status"
}

export const IMPORT_DOC_IMPORT_KEYS = {
  file_name: "file_name",
  fiscal: "fiscal",
  entity: "entity",
  total_records: "total_records",
  records_loaded_successfully: "records_loaded_successfully",
  records_failed_to_load: "records_failed_to_load",
  imported_on: "imported_on",
  status_description: "status_description",
  import_type: "import_type",
  imported_by: "imported_by",
  records_with_warning: "records_with_warning"
}


export const ALPHANUMERIC_CONDITIONS = {
  equals : "equals",
  notEquals : "not_equals",
  contains : "contains",
  isEmpty : "is_empty",
  IN : "in",
  less_than : "less_than",
  greater_than : "greater_than",
  between : "between",
  before : "before",
  after : "after",

}

export const UPDATE_FLAG = {
  project : "project",
  account : "account"
}

export const SUMMARY_HIGHLIGHTS_FLAG = {
  all : "all",
  rdQualified : "rd_qualified"
}

export const DEFAULT_PROJECT_DETAILS = {
  maxAiInteraction : 5
}

export const SUMMARY_HIGHLIGHTS_TYPE_FLAG = {
  statewise : "state",
  summary : "summary"
}