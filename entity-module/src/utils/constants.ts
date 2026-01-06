import { Sequelize } from "sequelize";
import { encryptClientSecret } from "./helpers";
import moment from "moment";

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
};

export const MAIN_SCHEMA_NAME = "trd365";

export const NODE_ENV = {
  DEV: "DEV",
  PROD: "PRODUCTION",
};

export const constants = {
  SQL_GET_USER: `SELECT status_description as status, "user".rid, email, profile_rid FROM ${MAIN_SCHEMA_NAME}."user" as "user" ,${MAIN_SCHEMA_NAME}."status" as status WHERE  "user".status_rid = status.rid and {whereClause} LIMIT 1`,
  SQL_GET_PERMISSION: `SELECT rid FROM ${MAIN_SCHEMA_NAME}."module_permission" WHERE permission_name = :permissionName LIMIT 1`,
  SQL_GET_PROFILE_ACCESS: `SELECT is_enabled FROM ${MAIN_SCHEMA_NAME}."profile_permission_access" WHERE profile_id = :profileId AND module_permission_id = :permissionId LIMIT 1`,
  SQL_GET_USER_ACCESS: `SELECT is_enabled FROM ${MAIN_SCHEMA_NAME}."user_permission_access" WHERE user_id = :userId AND module_permission_id = :permissionId LIMIT 1`,
  SQL_INSERT_API_DENIAL: `INSERT INTO ${MAIN_SCHEMA_NAME}."user_api_access_denials" (rid, user_id, permission_id, permission_name, api_endpoint, created_datetime, updated_datetime) VALUES (:rid, :userId, :permissionId, :permissionName, :apiEndpoint, NOW(), NOW())`,
  SQL_GET_ACCOUNT: `SELECT status, rid FROM ${MAIN_SCHEMA_NAME}."account" WHERE rid = :rid LIMIT 1`,
  SELECT: "SELECT",
  INSERT: "INSERT",
};
export const ENV_PREFIX = process.env.NODE_ENV_DB_PREFIX || "D001-";
export const R_NUMBER_PREFIX = {
  ACCOUNT_FISCAL_REGION: "ACFR",
  ACCOUNT_FISCAL: "ACF",
  PROJECT: "PRJ",
  PROJECT_FISCAL: "PFI",
  PROJECT_FISCAL_REGION: "PFIR",
  PROJECT_HISTORY: "PRH",
  PROJECT_TIMELINE: "PRT",
  RESOURCE: "RES",
  RESOURCE_HISTORY: "REH",
  RESOURCE_TIMELINE: "RTL",
  RESOURCE_SKILL: "RSK",
  RESOURCE_SKILL_HISTORY: "RSH",
  RESOURCE_SKILL_TIMELINE: "RST",
  RESOURCE_COST: "RCO",
  RESOURCE_COST_HISTORY: "RCH",
  RESOURCE_COST_TIMELINE: "RCT",
  RESOURCE_FISCAL: "RSF",
  RESOURCE_FISCAL_REGION: "RSFR",
  PROJECT_FISCAL_SUMMARY: "PFS",
  CLASSIFICATION: "CSF",
  KEY_CONTACT_DETAILS: "KEY",
  ATTACHMENT: "ATT",
  ATTACHMENT_TIMELINE: "ATI",
  PROJECT_RESOURCE: "PRS",
  PROJECT_RESOURCE_FISCAL: "PRSF",
  PROJECT_RESOURCE_FISCAL_REGION: "PRSFR",
  PROJECT_RESOURCE_HISTORY: "PRSH",
  PROJECT_RESOURCE_TIMELINE: "PRST",
  PROJECT_TASK: `PTA`,
  PROJECT_TASK_FISCAL: "PTAF",
  PROJECT_TASK_TIMELINE: "PTAT",
  PROJECT_TASK_HISTORY: "PTAH",
  NOTES: "NTE",
  NOTES_TIMELINE: "NTETI",
  NOTES_SUMMARY: "NOTS",
};

export const STATUS_MESSAGE = {
  accountInactive: "Inactive Account",
  accountNoFound: "Account not found",
  qualifiedProject: "Qualified project cannot be updated.",
  accountUpdateSuccess: "Account updated successfully",
  accountIdMissing: "Account RID mising",
  importIdMissing: "Import RID mising",
  entityTypeMissing: "Entity type mising",
  oneFieldRequired: "Atleast one field is required to update",
  keyContactIdMissing: "Key-Contact RID is missing",
  projectUpdateSuccess: "Field updated successfully",
  projectIdMissing: "Project RID missing",
  projectTaskIdMissing: "Project Task RID is missing",
  taskIdMissing: "Task RID is missing",
  fiscalIdMissing: "Project-Fiscal RID is missing",
  projectCodeMissing: "Project-Code missing",
  resourceNotFound: "Resource not found",
  active: "Active",
  inactive: "In-Active",
  resourceInactive: "Resource you are trying to update is currently In-Active",
  eventUpdate: "Update",
  uiHandler: "ui handler",
  success: "success",
  resourceUpdateSuccess: "Resource updated successfully",
  resourceTypeNotFound: "Resource Type you are trying to update is invalid",
  countryNotFound: "Country you are trying to update is invalid",
  stateNotFound: "Region you are trying to update is invalid",
  resourceIdMissing: "Resource RID missing",
  invalidKeyData: "Invalid Id for update. Kindly check RID and update again.",
  resourceCostNotFound: "Resource Cost not found",
  resourceCostUpdSuccess: "Resource Cost updated successfully",
  duplicateProjectCode: "Project Code already exists",
  costIdMissing: "Resource Cost RID missing",
  skillIdMissing: "Resource Skill RID missing",
  currencyInvalid: "Currency you are trying to update is invalid",
  projectCodeDuplicate: "Project Code already exists",
  resourceCodeDuplicate: "Resource Code already exists",
  resourceSkillNoFound: "Resource Skill you are trying to update is invalid",
  resourceSkillTypeNoFound:
    "Resource SkillType you are trying to update is invalid",
  resourceSkillSubTypeNoFound:
    "Resource Skill SubType you are trying to update is invalid",
  resourceSkillLevelNoFound:
    "Resource Skill level you are trying to update is invalid",
  resourceSkillUpdSuccess: "Resource Skill updated successfully",
  noAttachmentRecordFound: "No Attachment record found",
  noDataToUpdate: "Data is requried to update",
  attachmentUpdatedSuccess: "Attachment details updated successfully",
  projectTaskUpdatedSuccess: "Project task details updated successfully",
  userIdEmpty: "User-Id is missing",
  attachmentIdMissing: "Attachment RID missing",
  docCatInvalid: "Document category you are trying to update is invalid",
  docTypeInvalid: "Document Type you are trying to update is invalid",
  NoResourceFound: "No Resource found",
  separateDb: "separate_db",
  fiscalYearAlreadyExists: "Duplicate fiscal year not allowed",
  targetLoadSuccess: "Success",
  targetLoadFailed: "Failed",
  importListedSuccess: "Imports listed successfully",
  importsNoFound: "No imports found",
  importUpdatedSuccess: "Import updated successfully",
  projectTaskNotFound: "Project Task not found",
  settingsUpdatedSuccess: "Settings updated successfully",
  userIdMissingInHeader: "User-ID missing in headers",
  fiscalStartDateMissing: "Fiscal Startdate missing",
  fiscalEndDateMissing: "Fiscal Enddate missing",
  autoAccessmentMissing: "Auto Assessment missing",
  autoSendMissing: "Autosend Interaction missing",
  maxAiMissing: "Max AI Interaction missing",
  accountSummaryHighlightsSuccess: "Financial Summary fetched successfully",
  effortExceeded: "Effort cannot exceed the total hours in the duration",
  effort24HrsExceeded: "Effort cannot exceed 24 hours for the day",
  startDateLessThanEndDate: "Start date must be less than end date",
  emailMissing: "Support Email is missing or invalid.",
  tenantIdInvalidLength: "Invalid Tenant ID. Please enter a valid 36-character UUID (including hyphens).",
  clientIdInvalidLength: "Invalid Client ID. Please enter a valid 36-character UUID (including hyphens).",
  clientSecretTooShort: "Client Secret is too short or invalid.",
  invalidCredentials: "Provided Azure credentials are invalid or unusable",
  rdpercentPotentialmissing: "RD Percent Potential AI is missing",
  resCodePrjTaskSuccess: "ResourceCode for ProjectTask fetched successfully",
  resCodeNotFound: "No ResourceCode found",
  notesUpdatedSuccess: "Notes updated successfully",
  noNotesRecordFound: "Notes not found",
  notesIdMissing: "Notes RID missing",
  notesFetchedSuccess: "Notes fetched successfully",
  templateUploadedSuccess: "Template uploaded successfully",
  qreHistoryFetchedSuccess: "Qre-History fetched successfully",
  noDataFound: "Data not available",
  taskSummaryNotFound: "Task Summary not found",
  attachedTaskNotFound: "No attached Task found",
  taskSummaryUpdatedSuccess: "Task Summary updated successfully",
  updateFailed: "Update failed",
  taskNameExistsAlready: "Task name already exists",
  accountNotFound: "Account not found",
  taskUpdatedFailed: "Task update failed",
  caseNotFound: "Case not found",
  taskNotFound: "Task not found",
  taskUpdatedSuccess: "Task updated successfully",
  taskUpdateFailed: "Task update failed",
  tagMappedAlready: "Tag is already mapped to other tasks",
  workflowConnectorMappedFailed: "Workflow Connector mapping failed",
  workflowConnectorMappedSuccess: "Workflow Connector mapped successfully",
  dataNotAvailable: "Data not available",
  workflowConnectorMappedDeletedFailed: "Workflow Connector mapping deletion failed",
  workflowConnectorMappedDeleted: "Workflow Connector mapping deleted successfully",
  flagRequired: "flag is required",
  taskDetailsFetchFailed: "Task details fetch failed"
};

export const TYPES = {
  SKILL_TYPE: "skill_type",
  SKILL_SUBTYPE: "skill_subtype",
  SKILL_LEVEL: "skill_level",
};

export const SCHEMANAME_PREFIX = "trd365_";

export const rawQueries = {
  async fetchParentAccount(
    accountRid: any,
    mainSequelize: Sequelize
  ): Promise<any> {
    let checkIsSeparateDb: any = await mainSequelize.query(
      `SELECT rid, r_number, account_name, storage_type,is_parent, subscription_id FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`
    );
    if (checkIsSeparateDb[0][0].storage_type == STATUS_MESSAGE.separateDb) {
      return `SELECT rid, r_number, account_name, storage_type,is_parent, subscription_id, parent_account_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`;
    } else {
      return `
      with fetch_account_details AS (
      SELECT rid, r_number, parent_account_rid,is_parent, subscription_id FROM ${MAIN_SCHEMA_NAME}.account where rid = '${accountRid}'
      )
      SELECT a.rid, a.r_number, a.account_name, a.is_parent , a.subscription_id, a.parent_account_rid
      FROM ${MAIN_SCHEMA_NAME}.account a
      LEFT JOIN fetch_account_details ad ON ad.parent_account_rid = a.rid
      WHERE a.rid = ad.parent_account_rid`;
    }
  },
  fetchAccountDetailsByRid(accountRid: string) {
    return `
            SELECT * FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`;
  },
  findProject(schemaName: string, projectRid: string, accountRid: string) {
    return `
            SELECT * FROM ${schemaName}.project p WHERE rid = '${projectRid}' AND account_rid = '${accountRid}' 
            `;
  },
  findProjectFiscal(
    schemaName: string,
    projectRid: string,
    accountRid: string,
    projectFiscalRid: string
  ) {
    return `
            SELECT * FROM ${schemaName}.project_fiscal p WHERE project_rid = '${projectRid}' AND account_rid = '${accountRid}' AND rid = '${projectFiscalRid}'
            `;
  },
  findProjectSummary(data: any) {
    return `
            SELECT * FROM ${MAIN_SCHEMA_NAME}.project_summary p WHERE project_rid = '${data.project_rid}' AND account_rid = '${data.account_rid}'
            `;
  },
  findProjectFiscalSummary(data: any) {
    return `
            SELECT * FROM ${MAIN_SCHEMA_NAME}.project_fiscal_summary p WHERE project_rid = '${data.project_rid}' AND account_rid = '${data.account_rid}' AND project_fiscal_rid = '${data.project_fiscal_rid}'
            `;
  },
  checkProjectIdDuplicate(schemaName: string, data: any) {
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
                pf.project_code ILIKE '%${data.project_code.replace(
      /'/g,
      "''"
    )}%'
                AND
                pf.rid != p.rid
                )
                `;
  },
  fetchProjectFiscalCaseMapping(schemaName: string, data: any) {
    return `
                SELECT * FROM ${schemaName}.case_projects
                WHERE project_fiscal_rid= '${data.project_fiscal_rid}'
                `;
  },
  updateProject(schemaName: string, project_code: string, data: any) {
    return `
            UPDATE 
                ${schemaName}.project 
                SET 
                project_code = '${project_code.replace(/'/g, "''")}' 
                WHERE 
                    rid = '${data.project_rid}'
                    AND
                    account_rid = '${data.account_rid}'`;
  },
  updateCaseProjects(
    schemaName: string,
    setProjectFiscalData: any,
    data: any,
    case_rid: string
  ) {
    return `
            UPDATE 
                ${schemaName}.case_projects
            SET
                ${setProjectFiscalData.join(",")}
            WHERE 
                project_fiscal_rid = '${data.project_fiscal_rid}'
                AND
                account_rid = '${data.account_rid}'
                AND
                project_rid = '${data.project_rid}'
                AND
                case_rid = '${case_rid}'
            `;
  },
  updateProjectFiscal(
    schemaName: string,
    setProjectFiscalData: any,
    data: any
  ) {
    return `
            UPDATE 
                ${schemaName}.project_fiscal
            SET
                ${setProjectFiscalData.join(",")}
            WHERE 
                rid = '${data.project_fiscal_rid}'
                AND
                account_rid = '${data.account_rid}'
                AND
                project_rid = '${data.project_rid}'
            `;
  },
  updateProjectSummary(project_code: string, data: any) {
    return `
            UPDATE
                ${MAIN_SCHEMA_NAME}.project_summary
            SET
                project_code = '${project_code.replace(/'/g, "''")}'
            WHERE 
                account_rid = '${data.account_rid}'
                AND
                project_rid = '${data.project_rid}'
            `;
  },
  updateProjectFiscalSummary(setProjectFiscalSummary: any, data: any) {
    return `
            UPDATE
                ${MAIN_SCHEMA_NAME}.project_fiscal_summary
            SET
                ${setProjectFiscalSummary.join(",")}
            WHERE
                project_fiscal_rid = '${data.project_fiscal_rid}'
                AND
                project_rid = '${data.project_rid}'
                AND
                account_rid = '${data.account_rid}'            
            `;
  },
  fetchResources(schemaName: string, data: any) {
    return `
            SELECT * 
            FROM ${schemaName}.resources 
            WHERE 
            rid = '${data.resource_rid}' AND account_rid = '${data.account_rid}' 
            `;
  },
  checkResourceActive(fetchResources: any) {
    return `SELECT status_name FROM ${MAIN_SCHEMA_NAME}.status WHERE rid = '${fetchResources[0][0].status_rid}'`;
  },
  checkResourceTypeExists(data: any) {
    return `SELECT 1 FROM ${MAIN_SCHEMA_NAME}.resource_type WHERE rid = '${data.resource_type_rid}'`;
  },
  checkCountryExists(data: any) {
    return `SELECT 1 FROM ${MAIN_SCHEMA_NAME}.country WHERE rid = '${data.country_rid}'`;
  },
  checkRegionExists(data: any) {
    return `SELECT 1 FROM ${MAIN_SCHEMA_NAME}.state WHERE rid = '${data.region_rid}'`;
  },
  isResourceCodeDuplicate(schemaName: string, data: any) {
    return `
            SELECT resource_code FROM ${schemaName}.resources
            WHERE 
              account_rid = '${data.account_rid}'
              AND
              resource_code ILIKE '%${data.resource_code}%'
              AND
              rid != '${data.resource_rid}'
            
            `;
  },
  updateResourceQuery(schemaName: string, setResource: any, data: any) {
    return `
            UPDATE ${schemaName}.resources
            SET
              ${setResource.join(",")}
            WHERE
              rid = '${data.resource_rid}'
              AND
              account_rid = '${data.account_rid}'
            `;
  },
  getResourceFiscalQuery(schemaName: string, data: any) {
    return `SELECT * FROM ${schemaName}.resource_fiscal WHERE account_rid = '${data.account_rid}' AND resource_rid = '${data.resource_rid}'`;
  },
  updateResourceFiscalQuery(
    schemaName: string,
    setFiscalData: any,
    fetchResourceFiscal: any,
    data: any
  ) {
    return `
            UPDATE ${schemaName}.resource_fiscal
            SET
              ${setFiscalData.join(",")}
            WHERE
              rid = '${fetchResourceFiscal[0][0].rid}'
              AND
              account_rid = '${data.account_rid}'
              AND
              resource_rid = '${data.resource_rid}'
            `;
  },
  insertQueryResTimeline(schemaName: string, data: any) {
    return `
            INSERT INTO ${schemaName}.resources_timeline
            (created_by, created_datetime, account_rid, entity_rid, event_name, event_type, event_status, event_datetime)
            VALUES ('${data.userId}', NOW(), '${data.account_rid}', 
            '${data.resource_rid}','${STATUS_MESSAGE.eventUpdate}', '${STATUS_MESSAGE.uiHandler}', '${STATUS_MESSAGE.success}', NOW())
            `;
  },
  insertQueryResHistory(
    schemaName: string,
    data: any,
    attributeName: any,
    oldValue: any,
    newValue: any
  ) {
    return `INSERT INTO ${schemaName}.resources_history
      (created_by, created_datetime, resource_rid, attribute_name, old_value, new_value)
      VALUES ('${data.userId}', NOW(), '${data.resource_rid}', '${attributeName}',
      '${oldValue}', '${newValue}')`;
  },
  isResourceCostExists(schemaName: string, data: any) {
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
        `;
  },
  isCurrencyExists(data: any) {
    return `SELECT 1 FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid = '${data.currency_rid}'`;
  },
  updateResourceCostQuery(schemaName: string, setResourceCost: any, data: any) {
    return `
          UPDATE ${schemaName}.resource_cost
          SET
           ${setResourceCost.join(",")}
          WHERE
            rid = '${data.resource_cost_rid}'
            AND
            account_rid = '${data.account_rid}'
            AND
            resource_rid = '${data.resource_rid}'
          `;
  },
  insertResCostTimelineQuery(schemaName: string, data: any) {
    return `
      INSERT INTO ${schemaName}.resource_cost_timeline
      (created_by, created_datetime, account_rid, event_name, event_status, event_type, entity_rid, event_datetime)
      VALUES
      ('${data.userId}', NOW(), '${data.account_rid}', '${STATUS_MESSAGE.eventUpdate}', '${STATUS_MESSAGE.success}', 
      '${STATUS_MESSAGE.uiHandler}', '${data.resource_cost_rid}', NOW())
      `;
  },
  insertResCostHisQuery(
    schemaName: string,
    data: any,
    attribute_name: any,
    oldValue: any,
    newValue: any
  ) {
    return `
      INSERT INTO ${schemaName}.resource_cost_history
      (created_by, created_datetime, resource_cost_rid, attribute_name, old_value, new_value)
      VALUES
      ('${data.userId}', NOW(), '${data.resource_cost_rid}', '${attribute_name}', '${oldValue}', '${newValue}')`;
  },
  setFiscalYear(schemaName: string, setFiscal: any, data: any) {
    return `UPDATE ${schemaName}.resource_fiscal 
            SET fiscal_year = ${setFiscal}
              WHERE
                resource_rid = '${data.resource_rid}'
                AND
                account_rid = '${data.account_rid}'`;
  },
  fetchResourceSkill(schemaName: string, resource_skill_rid: string) {
    return `SELECT * FROM ${schemaName}.resource_skill WHERE rid = '${resource_skill_rid}'`;
  },
  checkForExists(type: string, rid: string) {
    return `SELECT 1 FROM ${MAIN_SCHEMA_NAME}.${type} WHERE rid = '${rid}'`;
  },
  updateResourceSkillQuery(
    schemaName: string,
    setSkillData: string[],
    data: any
  ) {
    return `UPDATE 
            ${schemaName}.resource_skill 
            SET ${setSkillData.join(",")}
            WHERE
              rid = '${data.resource_skill_rid}'
              AND
              account_rid = '${data.account_rid}'
              AND
              resource_rid = '${data.resource_rid}'
            `;
  },
  insertSkillTimeQuery(schemaName: string, data: any) {
    return `
          INSERT INTO ${schemaName}.resource_skill_timeline
            (created_by, created_datetime, account_rid, event_name, event_status, event_type, entity_rid, event_datetime)
          VALUES
            ('${data.userId}', NOW(), '${data.account_rid}', '${STATUS_MESSAGE.eventUpdate}', '${STATUS_MESSAGE.success}', '${STATUS_MESSAGE.uiHandler}', '${data.resource_skill_rid}', NOW())
          `;
  },
  insertSkillHistory(
    schemaName: string,
    data: any,
    attributeName: string,
    oldValue: string,
    newValue: string
  ) {
    return `
          INSERT INTO ${schemaName}.resource_skill_history
              (created_by, created_datetime, resource_skill_rid, attribute_name, old_value, new_value)
          VALUES
              ('${data.userId}', NOW(), '${data.resource_skill_rid}', '${attributeName}', '${oldValue}', '${newValue}')
          `;
  },
  fetchQreFromPrjSum(project_rid: string, account_rid: string) {
    return `SELECT qre FROM ${MAIN_SCHEMA_NAME}.project_summary WHERE project_rid = '${project_rid}' AND account_rid = '${account_rid}'`;
  },
  findAttachementDetails(schemaName: string, rid: string, account_rid: string) {
    return `
      SELECT * FROM ${schemaName}.attachments WHERE rid = '${rid}' AND account_rid = '${account_rid}'`;
  },
  findProjectTaskDetails(schemaName: string, rid: string, account_rid: string) {
    return `
      SELECT * FROM ${schemaName}.project_task WHERE rid = '${rid}' AND account_rid = '${account_rid}'`;
  },
  findCaseTaskDetails(schemaName: string, rid: string, account_rid: string) {
    return `
      SELECT * FROM ${schemaName}.case_task WHERE rid = '${rid}' AND account_rid = '${account_rid}'`;
  },
  findAccountTaskDetails(schemaName: string, rid: string, account_rid: string) {
    return `
      SELECT * FROM ${schemaName}.activities WHERE rid = '${rid}' AND account_rid = '${account_rid}'`;
  },
  fetchSchemaName(r_number: string) {
    return `${MAIN_SCHEMA_NAME}_${r_number.replace("ACC-", "")}`;
  },
  fetchCaseStatusByRid(rid: string) {
    return `SELECT status_name FROM ${MAIN_SCHEMA_NAME}.case_status where rid = '${rid}'`;
  },
  updateAttachmentQuery(schemaName: string, getSetData: any, data: any) {
    return `
    UPDATE 
        ${schemaName}.attachments 
    SET 
        ${getSetData.data.join(",")}
    WHERE
        rid = '${data.rid}'
        AND
        account_rid = '${data.account_rid}'`;
  },
  updateProjectTaskQuery(schemaName: string, getSetData: any, data: any) {
    return `
    UPDATE 
        ${schemaName}.project_task 
    SET 
        ${getSetData.data.join(",")}
    WHERE
        rid = '${data.rid}'
        AND
        account_rid = '${data.account_rid}'`;
  },
  updateCaseProjectTaskQuery(schemaName: string, getSetData: any, data: any, caseMapping: any) {
    return `
    UPDATE 
        ${schemaName}.case_project_task 
    SET 
        ${getSetData.data.join(",")}
    WHERE
        project_task_rid = '${data.rid}'
        AND
        account_rid = '${data.account_rid}'
        AND
        case_rid = '${caseMapping.case_rid}'`;
  },
  updateAttachmentSummary(getSetData: any, data: any) {
    return `
          UPDATE
              ${MAIN_SCHEMA_NAME}.attachment_summary
          SET
              ${getSetData.data.join(",")}
          WHERE
              document_rid = '${data.rid}'
              AND
              account_rid = '${data.account_rid}'
          `;
  },
  insertAttachementTimeline(schemaName: string, data: any, latestData: any) {
    return `
          INSERT INTO ${schemaName}.attachment_timeline
          (created_by, modified_by, document_rid, document_name, document_category_rid, document_type_rid, attach_to, attachment_level, event_type, event_status, event_name, event_datetime)
          VALUES
          ('${data.userId}', '${data.userId}', '${latestData.rid}', '${latestData.document_name}', '${latestData.document_category_rid}', '${latestData.document_type_rid}', '${latestData.attach_to}',
          '${latestData.attachment_level}', '${STATUS_MESSAGE.uiHandler}', '${STATUS_MESSAGE.success}', '${STATUS_MESSAGE.eventUpdate}', NOW()
          )`;
  },
  checkDocCategoryExists(rid: string) {
    return `SELECT 1 FROM ${MAIN_SCHEMA_NAME}.document_category where rid = '${rid}'`;
  },
  checkDocTypeExists(rid: string) {
    return `SELECT 1 FROM ${MAIN_SCHEMA_NAME}.document_type where rid = '${rid}'`;
  },
  updateProjectFiscalPrjCode(
    schemaName: string,
    newProject_code: string,
    account_rid: string,
    project_rid: string,
    existing_project_code: string
  ) {
    return `
    UPDATE ${schemaName}.project_fiscal SET project_code = '${newProject_code.replace(
      /'/g,
      "''"
    )}'
    WHERE
    account_rid = '${account_rid}' AND project_rid = '${project_rid}' AND project_code = '${existing_project_code.replace(
      /'/g,
      "''"
    )}'
    `;
  },
  updateCaseProjectPrjCode(
    schemaName: string,
    newProject_code: string,
    account_rid: string,
    project_rid: string,
    existing_project_code: string,
    case_rid: string
  ) {
    return `
    UPDATE ${schemaName}.case_projects SET project_code = '${newProject_code.replace(
      /'/g,
      "''"
    )}'
    WHERE
    account_rid = '${account_rid}' 
    AND project_rid = '${project_rid}' 
    AND project_code = '${existing_project_code.replace(
      /'/g,
      "''"
    )}'
    AND case_rid = '${case_rid}' 
    `;
  },
  updateProjectFiscalSummaryPrjCode(
    newProject_code: string,
    account_rid: string,
    project_rid: string,
    existing_project_code: string
  ) {
    return `
    UPDATE ${MAIN_SCHEMA_NAME}.project_fiscal_summary SET project_code = '${newProject_code.replace(
      /'/g,
      "''"
    )}'
    WHERE
    account_rid = '${account_rid}' AND project_rid = '${project_rid}' AND project_code = '${existing_project_code.replace(
      /'/g,
      "''"
    )}'
    `;
  },
  insertProjectTimeline(schemaName: string, data: any) {
    return `INSERT INTO ${schemaName}.project_timeline
                (created_by, created_datetime, account_rid, entity_rid, event_name, event_type, event_status, event_datetime)
                VALUES
                ('${data.userId}', NOW(), '${data.account_rid}', '${data.project_fiscal_rid}', '${STATUS_MESSAGE.eventUpdate}', '${STATUS_MESSAGE.uiHandler}', '${STATUS_MESSAGE.success}', NOW())
       `;
  },
  insertProjectHistory(
    schemaName: string,
    data: any,
    attributeName: string,
    newValue: string,
    oldValue: string
  ) {
    return `
    INSERT INTO ${schemaName}.project_history
    (created_by, created_datetime, project_rid, attribute_name, old_value, new_value)
    VALUES
    ('${data.userId}', NOW(), '${data.project_fiscal_rid}', '${attributeName}', '${oldValue}', '${newValue}')
    `;
  },
  checkForDuplicateFiscalYear(schemaName: string, data: any) {
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
      )`;
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
  SELECT rid, resource_type_name FROM ${MAIN_SCHEMA_NAME}.resource_type WHERE rid IN (:resourceTypeRid)
  `,
  GET_COUNTRIES: `
  SELECT rid, country_name, country_code FROM ${MAIN_SCHEMA_NAME}.country WHERE rid IN (:countryRid)
  `,
  GET_REGIONS: `
  SELECT rid, state_name FROM ${MAIN_SCHEMA_NAME}.state WHERE rid IN (:regionRid)
  `,
  GET_CURRENCIES: `
  SELECT rid, currency_symbol, currency_name, currency_code FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid IN (:currencyRid)
  `,
  GET_STATUSES: `
  SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.status WHERE rid IN (:statusRid)
  `,
  GET_CITIES: `
  SELECT rid, city_name FROM ${MAIN_SCHEMA_NAME}.city WHERE rid IN (:ids)
  `,
  GET_TASK_TYPES: `
  SELECT rid, project_task_type_name FROM ${MAIN_SCHEMA_NAME}.project_task_type WHERE rid IN (:taskTypeRid)
  `,
  GET_INDUSTRY: `
  SELECT rid, industry_name FROM ${MAIN_SCHEMA_NAME}.industry WHERE rid IN (:ids)
  `,
  GET_TASK_CLASSIFICATION: `
  SELECT rid, classification_name FROM ${MAIN_SCHEMA_NAME}.project_task_classification WHERE rid IN (:taskClassificationRids)
  `,
  fetchAccountInfo(schemaName: string, account_rid: string) {
    return `SELECT * FROM ${schemaName}.account_details WHERE account_rid = '${account_rid}'`;
  },
  fetchUserDetailsById(userId: string) {
    return `SELECT CONCAT(first_name, ' ', last_name) AS imported_by FROM ${MAIN_SCHEMA_NAME}.user WHERE rid = '${userId}'`;
  },
  updateImport(schemaName: string, updatedData: any, rid: string) {
    return `UPDATE ${schemaName}.import SET fiscal_year = ${updatedData.fiscal_year} WHERE rid = '${rid}'`;
  },
  fetchChildAccountsByParentAccountRid() {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.account WHERE parent_account_rid = :parentRid`;
  },
  findResourceByCode(schemaName: string, resource_code: string) {
    return `SELECT rid FROM ${schemaName}.resources WHERE resource_code = '${resource_code}'`;
  },
  fetchAccountById: `SELECT * FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = :rid`,
  updateTemplate(url: string, templateId: string, userId: string) {
    return `UPDATE ${MAIN_SCHEMA_NAME}.templates
    SET blob_url = '${url}',
    modified_datetime = NOW(),
    modified_by = '${userId}' 
    WHERE rid = '${templateId}';
  `;
  },
  fetchTemplate() {
    return `SELECT * FROM ${MAIN_SCHEMA_NAME}.templates order by template_name ASC`;
  },
  fetchTemplateById(templateId: string) {
    return `SELECT * FROM ${MAIN_SCHEMA_NAME}.templates WHERE rid = '${templateId}'`;
  },
  fetchCurrencyThresold() {
    return `SELECT currency_threshold FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid = :currency_rid`;
  },
  fetchDefualtCurrencyThresold() {
    return `SELECT currency_threshold FROM ${MAIN_SCHEMA_NAME}.currency WHERE currency_code = 'USD'`;
  },
  GET_ACCOUNT_ACCESS: `
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
  GET_PROJECT_ACCESS: `
      AND (
        (
          EXISTS (
            SELECT 1 FROM ${MAIN_SCHEMA_NAME}.user_group_entity_access uea
            WHERE uea.user_rid = ? 
            AND uea.entity_type = 'PROJECT'
            AND uea.entity_rid = ps.project_fiscal_rid
            AND uea.access_type = 'INCLUDE'
          )
          OR EXISTS (
            SELECT 1 FROM ${MAIN_SCHEMA_NAME}.user_group_mapping ugm
            JOIN ${MAIN_SCHEMA_NAME}.user_group_entity_access ugea 
              ON ugea.group_rid = ugm.group_rid
            WHERE ugm.user_rid = ?
            AND ugea.entity_type = 'PROJECT'
            AND ugea.entity_rid = ps.project_fiscal_rid
            AND ugea.access_type = 'INCLUDE'
          )
        )
        AND NOT EXISTS (
          SELECT 1 FROM ${MAIN_SCHEMA_NAME}.user_group_entity_access uea
          WHERE uea.user_rid = ? 
          AND uea.entity_type = 'PROJECT'
          AND uea.entity_rid = ps.project_fiscal_rid
          AND uea.access_type = 'EXCLUDE'
        )
        AND NOT EXISTS (
          SELECT 1 FROM ${MAIN_SCHEMA_NAME}.user_group_mapping ugm
          JOIN ${MAIN_SCHEMA_NAME}.user_group_entity_access ugea 
            ON ugea.group_rid = ugm.group_rid
          WHERE ugm.user_rid = ?
          AND ugea.entity_type = 'PROJECT'
          AND ugea.entity_rid = ps.project_fiscal_rid
          AND ugea.access_type = 'EXCLUDE'
        )
      )
    `,
  fetchPlatformConfig(rid: string, formattedStartDate: string, formattedEndDate: string) {
    return `
    SELECT config_json FROM ${MAIN_SCHEMA_NAME}.rd_credit_parameter_values rv
  join ${MAIN_SCHEMA_NAME}.rd_credit_config_group rg on  rv.credit_config_group_rid  = rg.rid
  where rg.country_rid = '${rid}'
  and credit_program_name = 'Platform Configuration'
    and rg.is_federal = true 
     AND rv.effective_start_date <= '${formattedEndDate}'
    AND rv.effective_end_date   >= '${formattedStartDate}'
    AND rv.status_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_description = 'active')
  ORDER BY rv.effective_start_date DESC
  LIMIT 1`;
  },
  async updateSetting(
    schemaName: string,
    data: any,
    orgDb: Sequelize,
    mainDb: Sequelize,
    parentAccountID: string,
    subscriptionId?: string,
    isParentAccount: boolean = false,
    parenSchema?: string
  ) {
    let tableName: string[];
    let whereParams: string = ``;
    let setValues: string;
    let schema: string = ``;
    let dbConnection: any;

    if (data.flag == UPDATE_FLAG.project) {
      tableName = [`project_fiscal`, `project_fiscal_summary`];

      setValues = `
      blended_rate_fte = ${data.blended_rate_fte == "" ? null : parseFloat(data.blended_rate_fte)
        },
      blended_rate_subcon = ${data.blended_rate_subcon == ""
          ? null
          : parseFloat(data.blended_rate_subcon)
        },
      auto_send_ai_interaction = ${data.autosend_interaction},
      max_ai_interaction = ${data.max_ai_interactions},
      auto_access_rd = ${data.auto_access_rd},
      modified_by = '${data.userId}',
      modified_datetime = NOW()`;
    } else {
      tableName = [`account_details`];
      setValues = `
      blended_rate_fte = ${data.blended_rate_fte == "" ? null : parseFloat(data.blended_rate_fte)
        },
      blended_rate_subcon = ${data.blended_rate_subcon == ""
          ? null
          : parseFloat(data.blended_rate_subcon)
        },
      autosend_interaction = ${data.autosend_interaction},
      max_ai_interactions = ${data.max_ai_interactions},
      auto_access_rd = ${data.auto_access_rd},
      modified_by = '${data.userId}',
      modified_datetime = NOW()`;
    }
    for (let t of tableName) {
      if (t == "project_fiscal") {
        schema = schemaName;
        whereParams = `WHERE account_rid = '${data.account_rid}' AND rid = '${data.project_fiscal_rid}'`;
        dbConnection = orgDb;
      } else if (t == "project_fiscal_summary") {
        schema = MAIN_SCHEMA_NAME;
        whereParams = `WHERE account_rid = '${data.account_rid}' AND project_fiscal_rid = '${data.project_fiscal_rid}'`;
        dbConnection = mainDb;
      } else if (t == "account_details") {
        schema = schemaName;
        whereParams = `WHERE account_rid = '${data.account_rid}'`;
        dbConnection = orgDb;
      }
      let query = `
      UPDATE ${schema}.${t}
      SET
      ${setValues}
      ${whereParams}
      `;
      if (data?.level == "parent") {
        if (
          data.flag == UPDATE_FLAG.account &&
          t == "account_details" &&
          isParentAccount
        ) {
          const encryptedSecretKey = await encryptClientSecret(
            data.client_secret
          );
          let query = `
        UPDATE ${parenSchema}.${t}
        SET
        support_email = '${data.support_email}',
        tenant_id = '${data.tenant_id}',
        client_id = '${data.client_id}',
        client_secret = '${data.client_secret ? encryptedSecretKey : ''}',
        subscription_created = ${subscriptionId ? "true" : "false"}
        WHERE account_rid = '${parentAccountID}'
        `;

          const subscriptionQuery = `
          UPDATE ${MAIN_SCHEMA_NAME}.account set subscription_id = '${subscriptionId}'
          WHERE rid = '${parentAccountID}'
        `;
          await dbConnection.query(query);
          await mainDb.query(subscriptionQuery);
        }
      }

      await dbConnection.query(query);
    }
    return HttpStatus.SUCCESS_MESSAGE;
  },
  async fetchSettings(
    schemaName: string,
    orgDb: Sequelize,
    parentAccountID: string
  ) {
    const query = `SELECT rid, support_email, tenant_id, client_id, client_secret, subscription_created from ${schemaName}.account_details WHERE account_rid = '${parentAccountID}'`;
    const accountSettigs = await orgDb.query(query, {
      type: "SELECT",
    });
    return accountSettigs;
  },
  fetchStates(stateIds: string[], country_rid: string) {
    let formattedStateIds = stateIds.map((id: string) => `'${id}'`).join(",");
    return `SELECT rid, state_name, country_code FROM ${MAIN_SCHEMA_NAME}.state 
    WHERE 
    rid IN (${formattedStateIds})
    AND
    country_rid = '${country_rid}'`;
  },
  fetchStatesName(stateIds: string[]) {
    let formattedStateIds = stateIds.map((id: string) => `'${id}'`).join(",");
    return `SELECT rid, state_name, country_code FROM ${MAIN_SCHEMA_NAME}.state 
    WHERE 
    rid IN (${formattedStateIds})`;
  },
  fetchStatesIds(schemaName: string, account_rid: string, fiscal_year: number) {
    return `
    SELECT region_rid FROM ${schemaName}.account_fiscal_region 
    WHERE 
    account_rid = '${account_rid}'
    AND
    fiscal_year = ${fiscal_year}
    `;
  },
  updateProjectFiscalEffectiveDatas(schemaName: string, data: any) {
    return `
    UPDATE ${schemaName}.project_fiscal
    SET 
      effective_cost = ${data.total_cost_prj},
      effective_effort = ${data.total_effort_prj},
      effective_total_fte = ${data.total_fte_prj},
      effective_total_subcon = ${data.total_subcon_prj},
      effective_fte_effort = ${data.total_effort_fte_prj},
      effective_subcon_effort = ${data.total_effort_subcon_prj},
      effective_fte_cost = ${data.total_cost_fte_prj},
      effective_subcon_cost = ${data.total_cost_subcon_prj},
      effective_nonlabor_cost = ${data.total_cost_nonlabor_prj}
    WHERE
      rid = '${data.rid}'
      AND
      default_metric_type = 'project'
      AND
      effective_metric_type IS NULL
    `;
  },
  updateCaseProjectEffectiveDatas(schemaName: string, data: any, case_rid: string) {
    return `
    UPDATE ${schemaName}.case_projects
    SET 
      effective_cost = ${data.total_cost_prj},
      effective_effort = ${data.total_effort_prj},
      effective_total_fte = ${data.total_fte_prj},
      effective_total_subcon = ${data.total_subcon_prj},
      effective_fte_effort = ${data.total_effort_fte_prj},
      effective_subcon_effort = ${data.total_effort_subcon_prj},
      effective_fte_cost = ${data.total_cost_fte_prj},
      effective_subcon_cost = ${data.total_cost_subcon_prj},
      effective_nonlabor_cost = ${data.total_cost_nonlabor_prj}
    WHERE
      project_fiscal_rid = '${data.rid}'
      AND
      default_metric_type = 'project'
      AND
      effective_metric_type IS NULL
      AND
      case_rid = '${case_rid}'
    `;
  },
  fetchResourceTypeById(schemaName: string) {
    return `
      SELECT 
        rid AS resource_type_rid, 
        resource_type_name 
      FROM ${schemaName}.resource_type 
      WHERE rid IN (:ids)
  `;
  },
  getAccountInteractionProjects(schemaName: string, account_rid: string) {
    return `
      SELECT
        project_fiscal_rid
      FROM    ${schemaName}.interactions
      WHERE account_interaction_rid in (:account_interaction_rid)
    `;
  },
  fetchAccountCurrencyRid(account_rid: string) {
    return `SELECT currency_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${account_rid}'`;
  },
  fetchActiveStatusRid(status: string) {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_name ILIKE '%${status}%'`;
  },
  fetchResourceStatus: `
  SELECT rid, resource_status_name FROM ${MAIN_SCHEMA_NAME}.resource_status WHERE rid IN (:projectTaskStatusId)`,
  checkResCodeExistsInPrjRes(schemaName: string, project_resource_rid: string) {
    return `SELECT * FROM ${schemaName}.project_resource WHERE rid = '${project_resource_rid}'`;
  },
  fetchActiveStatus() {
    return `
    SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.status WHERE status_name = 'Active' limit 1`;
  },
  fetchProjectFiscalById(schemaName: string, projectFiscalId: string) {
    return `SELECT * FROM ${schemaName}.project_fiscal WHERE rid = '${projectFiscalId}'`;
  },
  updateProjectFiscalQre(schemaName: string, data: any) {
    return `
    UPDATE ${schemaName}.project_fiscal
    SET 
      rd_percent_adjustment = ${data.rd_percent_adjustment},
      rd_percent_final = ${data.rd_percent_final},
      qre_final = ${data.qre_final},
      qre_fte = ${data.qre_fte},
      qre_subcon = ${data.qre_subcon},
      qre_nonlabor = ${data.qre_nonlabor},
      modified_by = '${data.modified_by}',
      modified_datetime = '${new Date().toISOString()}'
    WHERE
      rid = '${data.rid}'
    `;
  },
  updateProjectFiscalSummaryQre(data: any) {
    return `
    UPDATE ${MAIN_SCHEMA_NAME}.project_fiscal_summary
    SET 
      rd_percent_adjustment = ${data.rd_percent_adjustment},
      rd_percent_final = ${data.rd_percent_final},
      qre_final = ${data.qre_final},
      qre_fte = ${data.qre_fte},
      qre_subcon = ${data.qre_subcon},
      qre_nonlabor = ${data.qre_nonlabor},
      modified_by = '${data.modified_by}',
      modified_datetime = '${new Date().toISOString()}'
    WHERE
      project_fiscal_rid = '${data.rid}'
    `;
  },
  fetchProjecTaskType() {
    return `SELECT * FROM ${MAIN_SCHEMA_NAME}.project_task_type`;
  },
  fetchProjetClassificationQuery() {
    return `SELECT * FROM ${MAIN_SCHEMA_NAME}.project_task_classification`;
  },
  updateNotesQuery(schemaName: string, getSetData: any, data: any) {
    return `
    UPDATE 
        ${schemaName}.notes 
    SET 
        ${getSetData.data.join(",")}
    WHERE
        rid = '${data.rid}'
        AND
        account_rid = '${data.account_rid}'`;
  },
  updateNotesSummary(getSetData: any, data: any) {
    return `
          UPDATE
              ${MAIN_SCHEMA_NAME}.notes_summary
          SET
              ${getSetData.data.join(",")}
          WHERE
              notes_rid = '${data.rid}'
              AND
              account_rid = '${data.account_rid}'
          `;
  },
  findNotesDetails(schemaName: string, rid: string, account_rid: string) {
    return `
      SELECT * FROM ${schemaName}.notes WHERE rid = '${rid}' AND account_rid = '${account_rid}'`;
  },
  insertNotesTimeline(schemaName: string, data: any, latestData: any) {
    let notesOwner: string;
    let title: string;
    let descriptions: string | null;

    if (latestData.notes_owner !== null)
      notesOwner = `${latestData.notes_owner.replace(/'/g, "''")}`;
    else notesOwner = latestData.notes_owner;

    if (latestData.title !== null)
      title = `${latestData.title.replace(/'/g, "''")}`;
    else title = latestData.title;

    if (latestData.descriptions !== null)
      descriptions = `${latestData.descriptions.replace(/'/g, "''")}`;
    else descriptions = latestData.descriptions;
    return `
          INSERT INTO ${schemaName}.notes_timeline
          (created_by, modified_by, notes_rid, document_name, title, notes_owner, attach_to, attachment_level, event_type, event_status, event_name, event_datetime, descriptions)
          VALUES
          ('${data.userId}', '${data.userId}', '${latestData.rid}', '${latestData.document_name}', '${title}','${notesOwner}', '${latestData.attach_to}',
          '${latestData.attachment_level}', '${STATUS_MESSAGE.uiHandler}', '${STATUS_MESSAGE.success}', '${STATUS_MESSAGE.eventUpdate}', NOW(), '${descriptions}'
          )`;
  },
  fetchAllResourceStatus() {
    return `SELECT rid, resource_status_name FROM ${MAIN_SCHEMA_NAME}.resource_status`;
  },
  fetchSpecificResourceTypeById() {
    return `SELECT * FROM ${MAIN_SCHEMA_NAME}.resource_type WHERE rid = :resourceTypeId`;
  },
  fetchSkillRoleSubType() {
    return `SELECT rid, skill_role_rid, sub_type_name 
       FROM ${MAIN_SCHEMA_NAME}.skill_role_sub_type 
       WHERE rid = :skillTypeId`;
  },
  fetchSkillRoleSubTypeByName() {
    return `
      SELECT rid FROM ${MAIN_SCHEMA_NAME}.skill_role_sub_type
      WHERE skill_role_rid = :skill_role_rid
      AND sub_type_name = :sub_type_name
      LIMIT 1
    `;
  },
  insertSkillRoleSubType() {
    return `
      INSERT INTO ${MAIN_SCHEMA_NAME}.skill_role_sub_type
      (rid, created_by, created_datetime, skill_role_rid, sub_type_name, status)
      VALUES (:rid, :created_by, :created_datetime, :skill_role_rid, :sub_type_name, 'active')
    `;
  },
  fetchCountryById() {
    return `
      SELECT rid, country_name, country_code FROM ${MAIN_SCHEMA_NAME}.country WHERE rid = :id`;
  },
  fetchStateById() {
    return `
      SELECT rid, state_name FROM ${MAIN_SCHEMA_NAME}.state WHERE rid = :id`;
  },
  fetchCityById() {
    return `
      SELECT rid, city_name FROM ${MAIN_SCHEMA_NAME}.city WHERE rid = :id`;
  },
  fetchCurrencyById() {
    return `SELECT rid, currency_name, currency_code, currency_symbol FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid = :id`;
  },
  fetchUserById() {
    return `SELECT first_name, middle_name, last_name FROM ${MAIN_SCHEMA_NAME}."user" WHERE rid = :userId`;
  },
  fetchResourceStatusById() {
    return `SELECT resource_status_name FROM ${MAIN_SCHEMA_NAME}.resource_status WHERE rid = :id`;
  },
  fetchStatesByIds() {
    return `SELECT rid, state_name FROM ${MAIN_SCHEMA_NAME}.state WHERE rid IN (:ids)`;
  },
  fetchSkillRole() {
    return `Select rid, skill_role_name from ${MAIN_SCHEMA_NAME}.skill_role WHERE status = 'active'`;
  },
  fetchActiveSkillRoleSubType() {
    return `Select rid, skill_role_rid, sub_type_name from ${MAIN_SCHEMA_NAME}.skill_role_sub_type WHERE status = 'active'`;
  },
  fetchAllResourceTypes() {
    return `SELECT * FROM ${MAIN_SCHEMA_NAME}.resource_type`;
  },
  fetchAttachmentSummary() {
    return `SELECT 
        a.*
      FROM "${MAIN_SCHEMA_NAME}"."attachment_summary" a
      WHERE a.attach_to = :project_resource_rid
      ORDER BY a.created_datetime DESC`;
  },
  fetchDocumentByIds() {
    return `SELECT rid, type_name FROM ${MAIN_SCHEMA_NAME}.document_type WHERE rid IN (:documentTypeIds)`;
  },
  fetchDocumentCategory() {
    return `SELECT rid, category_name FROM ${MAIN_SCHEMA_NAME}.document_category WHERE rid IN (:documentCategoryIds)`;
  },
  fetchUserByIds() {
    return `SELECT rid, CONCAT(first_name, ' ', last_name) as full_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (:userIds)`;
  },
  fetchDocumentTypeByCategory(whereCategory: any) {
    return `
    SELECT 
    rid, 
    type_name, 
    type_description,
    category_rid 
    FROM ${MAIN_SCHEMA_NAME}.document_type 
    ${whereCategory}
    ORDER BY type_name ASC
    `;
  },
  fetchDocumentCategoryByorder() {
    return `
      SELECT 
      rid, 
      category_name, 
      category_description 
      FROM ${MAIN_SCHEMA_NAME}.document_category
      ORDER BY category_name ASC
    `;
  },
  fetchUserDetails(placeholders: any) {
    return `
      SELECT rid, first_name, last_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (${placeholders})
    `;
  },
  fetchProfileFromUser() {
    return `SELECT profile_rid FROM ${MAIN_SCHEMA_NAME}.user WHERE rid = :userId LIMIT 1`;
  },
  fetchExportPermission() {
    return `
      SELECT pf.field_desc, pf.field_name, pfa.read, pfa.edit
      FROM ${MAIN_SCHEMA_NAME}.profile_fields_access pfa
      JOIN ${MAIN_SCHEMA_NAME}.permission_fields pf ON pfa.permission_field_id = pf.rid
      JOIN ${MAIN_SCHEMA_NAME}.module_permission mp ON pf.module_permission_id = mp.rid
      WHERE mp.permission_name = :permissionName
        AND pfa.profile_id = :profileId  
    `;
  },
  fetchUserPermissinon() {
    return `
      SELECT pf.field_desc, pf.field_name, ufa.read, ufa.edit
      FROM ${MAIN_SCHEMA_NAME}.user_fields_access ufa
      JOIN ${MAIN_SCHEMA_NAME}.permission_fields pf ON ufa.permission_field_id = pf.rid
      JOIN ${MAIN_SCHEMA_NAME}.module_permission mp ON pf.module_permission_id = mp.rid
      WHERE mp.permission_name = :permissionName
        AND ufa.user_id = :userId
    `;
  },
  fetchKeyContactsByIds() {
    return `
      SELECT rid, role_name, role_map FROM ${MAIN_SCHEMA_NAME}.key_contact_role WHERE rid IN (:ids)
    `;
  },
  fetchStatusByIds() {
    return `
      SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.status WHERE rid IN (:ids)
    `;
  },
  fetchUserGroups() {
    return `
      SELECT ug.rid AS group_rid
      FROM "${MAIN_SCHEMA_NAME}"."user_groups" ug
      JOIN "${MAIN_SCHEMA_NAME}"."user_group_account_mapping" ugam ON ug.rid = ugam.group_rid
      JOIN "${MAIN_SCHEMA_NAME}"."user_group_type" ugt ON ug.group_type_rid = ugt.rid
      WHERE ugam.account_rid = :account_rid
        AND ugt.type = 'AUTO_ASSIGNED_CHILD' 
    `;
  },
  insertIntoGroupEntity() {
    return `
      INSERT INTO "${MAIN_SCHEMA_NAME}"."user_group_entity_access" (
        group_rid, entity_type, entity_rid, access_type, created_by, created_datetime
      )
      VALUES (
        :group_rid, 'PROJECT', :entity_rid, 'INCLUDE', :created_by, NOW()
      )
    `;
  },
  fetchAccountDetailsById(schemaName: string) {
    return `
      select * from ${schemaName}.account_details where account_rid = :accountId
    `;
  },
  fetchProjectResourceById(schemaName: string) {
    return `
      SELECT pr.rid,pr.r_number,pr.project_rid,pr.project_fiscal_rid, pf.currency_rid 
      FROM "${schemaName}".project_resource pr
      LEFT JOIN "${schemaName}".project_fiscal pf ON pf.rid = pr.project_fiscal_rid
      WHERE pr.rid = :projectResourceId
    `;
  },
  fetchProjectTaskById(schemaName: string) {
    return `
      SELECT pt.rid,pt.r_number, pf.currency_rid, pt.project_fiscal_rid 
      FROM "${schemaName}".project_task pt
      LEFT JOIN "${schemaName}".project_fiscal pf ON pf.rid = pt.project_fiscal_rid
      WHERE pt.rid = :projectTaskId
    `;
  },
  fetchResourceById(schemaName: string) {
    return `
      SELECT rid,resource_code 
      FROM "${schemaName}".resources
      WHERE rid = :resourceId
    `;
  },
  fetchResourceCostById(schemaName: string) {
    return `
      SELECT rid,r_number,resource_rid
      FROM "${schemaName}".resource_cost
      WHERE rid = :resourceCostId
    `;
  },
  fetchResourceSkillById(schemaName: string) {
    return `
    SELECT rid,r_number,resource_rid
    FROM "${schemaName}".resource_skill
    WHERE rid = :resourceSkillId
    `;
  },
  fetchCaseById(schemaName: string) {
    return `
    SELECT rid,case_name
    FROM "${schemaName}".cases
    WHERE rid = :caseId
    `;
  },
  fetchProjectClassificationById() {
    return `
      SELECT rid, classification_name FROM ${MAIN_SCHEMA_NAME}.project_classification WHERE rid IN (:ids)
    `;
  },
  fetchProjectTypeById() {
    return `
      SELECT rid, project_type_name FROM ${MAIN_SCHEMA_NAME}.project_type WHERE rid IN (:ids)
    `;
  },
  fetchCurrenciesByIds(placeholders: any) {
    return `
      SELECT rid, currency_code, currency_symbol 
      FROM ${MAIN_SCHEMA_NAME}.currency 
      WHERE rid IN (${placeholders})
    `;
  },
  fetchProjectResourceAndFiscal(schemaName: string) {
    return `
      SELECT 
        ps.rid,
        ps.project_fiscal_rid
      FROM "${schemaName}".project_resource ps
      WHERE ps.project_fiscal_rid IN (:projectIds)
      ORDER BY ps.created_datetime DESC
    `;
  },
  checkProjectTaskExists(schemaName: string) {
    return `
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = '${schemaName}'
        AND table_name = 'project_task'
      );
    `;
  },
  fetchProjectTaskAndFiscal(schemaName: string) {
    return `
      SELECT 
        pt.rid,
        pt.project_resource_code
      FROM "${schemaName}".project_task pt
      WHERE pt.project_fiscal_rid IN (:projectIds)
      ORDER BY pt.created_datetime DESC
    `;
  },
  fetchProjectFiscalSummary(accessControlWhere: any) {
    return `
      SELECT DISTINCT ps.project_fiscal_rid
      FROM ${MAIN_SCHEMA_NAME}.project_fiscal_summary AS ps
      LEFT JOIN ${MAIN_SCHEMA_NAME}.project_fiscal_summary AS pfs ON ps.project_fiscal_rid = pfs.project_fiscal_rid
      ${accessControlWhere}
    `;
  },
  fetchProjectClassification() {
    return `
      SELECT rid, classification_name, classification_description, classification_status
        FROM ${MAIN_SCHEMA_NAME}.project_classification
        WHERE classification_status = 'Active'
        ORDER BY classification_name ASC
    `;
  },
  fetchDefaultCurrency() {
    return `
      SELECT c.* FROM ${MAIN_SCHEMA_NAME}.currency c WHERE c.currency_code = 'USD'
    `;
  },
  fetchCurrencyFromAccount(accountId: string) {
    return `
      SELECT currency_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountId}'
    `;
  },
  fetchAttachmentSummaryByTask() {
    return `
      SELECT 
        a.*
      FROM "${MAIN_SCHEMA_NAME}"."attachment_summary" a
      WHERE a.attach_to = :task_rid
      ORDER BY a.created_datetime DESC
    `;
  },
  checkIfSchemaExists() {
    return `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = :schemaName
      )
    `;
  },
  checkSchemaAndTableExists() {
    return `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = :schemaName
        AND table_name = :tableName
      )
    `;
  },
  fetchProjetFiscalForFinancialHighlights(
    schemaName: string,
    accountFilter: any,
    projectFilter: any,
    filterConditions: any,
    searchCondition: any,
    caseProjectQuery?: any
  ) {
    return `
      SELECT 
        prf.total_cost_pro_res,
        pf.rd_percent_final,
        pf.qre_final,
        pf.rd_credits_total,
        prf.resource_rid,
        prf.project_fiscal_rid,
        prf.country_rid,
        prf.fiscal_year,
        prf.region_rid,
        pf.project_code,
        pf.currency_rid,
        pf.r_number,
        pf.project_name,
        r.resource_code,
        r.resource_name,
        r.resource_type_rid
      FROM "${schemaName}"."project_resource_fiscal" prf
      INNER JOIN "${schemaName}"."project_fiscal" pf ON pf.rid = prf.project_fiscal_rid
      INNER JOIN "${schemaName}"."resources" r ON r.rid = prf.resource_rid
      WHERE 1=1 
      ${accountFilter}
      ${projectFilter}
      ${caseProjectQuery}
      ${filterConditions}
      ${searchCondition}
    `;
  },
  fetchQueryForReferenceMap(idField: any, nameField: any, table: any) {
    return `SELECT ${idField}, ${nameField} FROM ${MAIN_SCHEMA_NAME}.${table}`
  },
  fetchProjectFiscalCountQuery(
    schemaName: string,
    accountFilter: any,
    projectFilter: any,
    filterConditions: any,
    searchCondition: any,
    caseProjectQuery?: any
  ) {
    return `
      SELECT COUNT(*) as total
      FROM "${schemaName}"."project_resource_fiscal" prf
      INNER JOIN "${schemaName}"."project_fiscal" pf ON pf.rid = prf.project_fiscal_rid
      INNER JOIN "${schemaName}"."resources" r ON r.rid = prf.resource_rid
      WHERE 1=1
      ${accountFilter}
      ${projectFilter}
      ${filterConditions}
      ${searchCondition}
      ${caseProjectQuery}
    `
  },
  getResourceCostQuery(
    schemaName: string,
    resource_cost_rid: string,
    filterConditions: string,
    searchCondition: string
  ): string {
    return `
      SELECT rc.*, rc.r_number as r_number, r.resource_name, r.resource_orgname, r.resource_designation, r.resource_role, 
             ad.account_name, ad.account_rid,
             TO_CHAR(rc.effective_from, 'YYYY-MM-DD') as effective_from,
             TO_CHAR(rc.end_date, 'YYYY-MM-DD') as end_date
      FROM "${schemaName}"."resource_cost" rc
      INNER JOIN "${schemaName}"."resources" r ON rc.resource_rid = r.rid
      INNER JOIN "${schemaName}"."account_details" ad ON r.account_rid = ad.account_rid
      WHERE 1=1 
        AND rc.account_rid = :account_rid 
        AND rc.resource_rid = :resource_rid 
        ${resource_cost_rid}
        ${filterConditions}
        ${searchCondition}
    `;
  },
  getResourceCostCountQuery(
    schemaName: string,
    filterConditions: string,
    searchCondition: string
  ): string {
    return `
      SELECT COUNT(*) as total
      FROM "${schemaName}"."resource_cost" rc
      INNER JOIN "${schemaName}"."resources" r ON rc.resource_rid = r.rid
      INNER JOIN "${schemaName}"."account_details" ad ON r.account_rid = ad.account_rid
      WHERE 1=1 
        AND rc.account_rid = :account_rid 
        AND rc.resource_rid = :resource_rid
        ${filterConditions}
        ${searchCondition}
    `;
  },
  getBaseResourceCostQuery(
    schemaName: string,
    filterConditions: string,
    searchCondition: string
  ): string {
    return `
      SELECT rc.*, rc.r_number as r_number, 
             r.resource_name, r.resource_orgname, r.resource_designation, r.resource_role, 
             ad.account_name, ad.account_rid,
             TO_CHAR(rc.effective_from, 'YYYY-MM-DD') as effective_from,
             TO_CHAR(rc.end_date, 'YYYY-MM-DD') as end_date
      FROM "${schemaName}"."resource_cost" rc
      INNER JOIN "${schemaName}"."resources" r ON rc.resource_rid = r.rid
      INNER JOIN "${schemaName}"."account_details" ad ON r.account_rid = ad.account_rid
      WHERE 1=1 
        AND rc.account_rid = :account_rid 
        AND rc.resource_rid = :resource_rid
        ${filterConditions}
        ${searchCondition}
    `;
  },
  fetchStatusById() {
    return `SELECT status_name FROM ${MAIN_SCHEMA_NAME}.status WHERE rid = :rid`
  },
  getUserFullNameQuery(): string {
    return `
      SELECT CONCAT(first_name, ' ', last_name) AS full_name
      FROM ${MAIN_SCHEMA_NAME}."user"
      WHERE rid = :userId
      LIMIT 1
    `;
  },
  getLatestResourceCostEntriesQuery(schemaName: string): string {
    return `
      SELECT 
        rc.rid,
        rc.resource_rid
      FROM "${schemaName}".resource_cost rc
      WHERE rc.resource_rid IN (:resourceIds)
      ORDER BY rc.created_datetime DESC
    `;
  },
  getResourcesByAccountQuery(schemaName: string): string {
    return `
      SELECT 
        r.rid
      FROM "${schemaName}".resources r
      WHERE r.account_rid = :accountRid
      ORDER BY r.created_datetime DESC
    `;
  },
  getResourceSkillQuery(
    schemaName: string,
    filterConditions: string,
    searchCondition: string,
    finalSortBy: string,
    finalSortOrder: string
  ): string {
    let sortClause = '';

    if (
      ['resource_name', 'resource_orgname', 'resource_designation', 'resource_role', 'resource_total_experience'].includes(finalSortBy)
    ) {
      sortClause = `ORDER BY r."${finalSortBy}" ${finalSortOrder}`;
    } else if (finalSortBy === 'account_name') {
      sortClause = `ORDER BY ad."${finalSortBy}" ${finalSortOrder}`;
    } else if (
      !['skill_type_name', 'skill_subtype_name', 'skill_level_name'].includes(finalSortBy)
    ) {
      sortClause = `ORDER BY rs."${finalSortBy}" ${finalSortOrder}`;
    }

    return `
      SELECT 
        rs.*,
        TO_CHAR(rs.start_date, 'YYYY-MM-DD') AS start_date,
        r.resource_name, 
        r.resource_role, 
        r.resource_orgname, 
        r.resource_designation, 
        r.resource_total_experience AS years_of_experience, 
        ad.account_name
      FROM "${schemaName}"."resource_skill" rs
      INNER JOIN "${schemaName}"."resources" r ON rs.resource_rid = r.rid
      INNER JOIN "${schemaName}"."account_details" ad ON r.account_rid = ad.account_rid
      WHERE 1=1 
        AND rs.account_rid = :account_rid 
        AND rs.resource_rid = :resource_rid
        ${filterConditions}
        ${searchCondition}
        ${sortClause}
    `;
  },
  getSkillTypeQuery(): string {
    return `
      SELECT rid, skill_type_name 
      FROM ${MAIN_SCHEMA_NAME}."skill_type" 
      WHERE rid IN (:skillTypeRids)
    `;
  },
  getSkillSubtypeQuery(): string {
    return `
      SELECT rid, skill_subtype_name 
      FROM ${MAIN_SCHEMA_NAME}."skill_subtype" 
      WHERE rid IN (:skillSubtypeRids)
    `;
  },
  getSkillLevelQuery(): string {
    return `
      SELECT rid, skill_level_name 
      FROM ${MAIN_SCHEMA_NAME}."skill_level" 
      WHERE rid IN (:skillLevelRids)
    `;
  },
  getPaginatedResourceSkillQuery(
    schemaName: string,
    resourceSkillRidClause: string,
    filterConditions: string,
    searchCondition: string,
    finalSortBy: string,
    finalSortOrder: string
  ): string {
    let sortClause = '';

    if (
      ['resource_name', 'resource_orgname', 'resource_designation', 'resource_role', 'resource_total_experience'].includes(finalSortBy)
    ) {
      sortClause = `ORDER BY r."${finalSortBy}" ${finalSortOrder}`;
    } else if (finalSortBy === 'account_name') {
      sortClause = `ORDER BY ad."${finalSortBy}" ${finalSortOrder}`;
    } else if (
      !['skill_type_name', 'skill_subtype_name', 'skill_level_name'].includes(finalSortBy)
    ) {
      sortClause = `ORDER BY rs."${finalSortBy}" ${finalSortOrder}`;
    }

    return `
      SELECT 
        rs.*,
        TO_CHAR(rs.start_date, 'YYYY-MM-DD') AS start_date,
        r.resource_name, 
        r.resource_role, 
        r.resource_orgname, 
        r.resource_designation, 
        r.resource_total_experience AS years_of_experience,
        ad.account_name
      FROM ${schemaName}.resource_skill rs
      INNER JOIN ${schemaName}.resources r ON rs.resource_rid = r.rid
      INNER JOIN ${schemaName}.account_details ad ON r.account_rid = ad.account_rid
      WHERE 1=1 
        AND rs.account_rid = :account_rid 
        AND rs.resource_rid = :resource_rid
        ${resourceSkillRidClause}
        ${filterConditions}
        ${searchCondition}
        ${sortClause}
      LIMIT :limit OFFSET :offset
    `;
  },
  getResourceSkillCountQuery(
    schemaName: string,
    filterConditions: string,
    searchCondition: string
  ): string {
    return `
      SELECT COUNT(*) AS total
      FROM ${schemaName}.resource_skill rs
      INNER JOIN ${schemaName}.resources r ON rs.resource_rid = r.rid
      INNER JOIN ${schemaName}.account_details ad ON r.account_rid = ad.account_rid
      WHERE 1=1 
        AND rs.account_rid = :account_rid 
        AND rs.resource_rid = :resource_rid
        ${filterConditions}
        ${searchCondition}
    `;
  },
  getActiveSkillTypesQuery(): string {
    return `
      SELECT 
        rid,
        skill_type_name,
        skill_type_description,
        status,
        created_by,
        modified_by,
        created_datetime,
        modified_datetime
      FROM ${MAIN_SCHEMA_NAME}.skill_type
      WHERE status = 'active'
      ORDER BY skill_type_name ASC
    `;
  },
  getActiveSkillSubtypesQuery(): string {
    return `
      SELECT
        rid,
        skill_type_rid,
        skill_subtype_name,
        skill_subtype_description,
        status,
        created_by,
        modified_by,
        created_datetime,
        modified_datetime
      FROM ${MAIN_SCHEMA_NAME}.skill_subtype
      WHERE skill_type_rid IN (:skillTypeRids) AND status = 'active'
      ORDER BY skill_subtype_name ASC
    `;
  },
  getLatestResourceSkillsQuery(schemaName: string): string {
    return `
      SELECT 
        rs.rid,
        rs.resource_rid
      FROM "${schemaName}".resource_skill rs
      WHERE rs.resource_rid IN (:resourceIds)
      ORDER BY rs.created_datetime DESC
    `;
  },
  getSchemaExistenceQuery(): string {
    return `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = :schemaName
    `;
  },
  getAccountByRidAndNumberQuery(): string {
    return `
      SELECT * 
      FROM ${MAIN_SCHEMA_NAME}.account 
      WHERE rid = :rid AND r_number = :r_number
    `;
  },
  getAccountByNumberQuery(): string {
    return `
      SELECT * 
      FROM ${MAIN_SCHEMA_NAME}.account 
      WHERE r_number = :r_number
    `;
  },
  getAccountWithStatusByRidQuery(): string {
    return `
      SELECT 
        ${MAIN_SCHEMA_NAME}.account.*, 
        ${MAIN_SCHEMA_NAME}.status.status_description AS status  
      FROM ${MAIN_SCHEMA_NAME}.account
      LEFT JOIN ${MAIN_SCHEMA_NAME}.status 
        ON ${MAIN_SCHEMA_NAME}.account.status_rid = ${MAIN_SCHEMA_NAME}.status.rid
      WHERE ${MAIN_SCHEMA_NAME}.account.rid = :rid
    `;
  },
  getCommonProjectSelectFields(): string {
    return `
      ps.project_code, ps.project_name, acc.account_name, acc.r_number as account_number, accountStatus.status_name as account_status_name,
      ps.project_rid, ps.modified_datetime, ps.assessment_status, ps.qre, ps.is_rd_qualified,
      COALESCE(ps.industry_name, ind.industry_name) AS industry_name_other,
      ps.project_type_rid, ps.project_client_group, ps.project_group,
      ps.project_classification_rid, 
      ps.project_classification_other,
      pt.project_type_name, ps.account_rid,
      pc.classification_name AS classification_name,
      ps.status_rid, s.status_name, ps.project_point_of_contact, ps.technical_point_of_contact, ps.r_number,
      ps.program_name, ps.project_startdate, ps.project_enddate,
      ps.total_cost, ps.total_effort, ps.total_fte, ps.total_cost_fte,
      ps.total_subcon, ps.total_cost_subcon, ps.total_cost_nonlabor, ps."comments",
      cou.country_name, COALESCE(curr.currency_code, acc_curr.currency_code, usd_curr.currency_code) as currency_code,
      COALESCE(curr.currency_symbol, acc_curr.currency_symbol, usd_curr.currency_symbol) as currency_symbol,
      st.state_name as region_name, ps.created_datetime
    `;
  },
  getCommonProjectJoins(): string {
    return `
      FROM ${MAIN_SCHEMA_NAME}.project_summary AS ps
      INNER JOIN ${MAIN_SCHEMA_NAME}.account acc ON acc.rid = ps.account_rid 
      LEFT JOIN ${MAIN_SCHEMA_NAME}.industry ind ON ind.rid = ps.industry_rid
      LEFT JOIN ${MAIN_SCHEMA_NAME}.country cou ON cou.rid = ps.country_rid 
      LEFT JOIN ${MAIN_SCHEMA_NAME}.state st ON st.rid = ps.region_rid 
      LEFT JOIN ${MAIN_SCHEMA_NAME}.currency curr ON curr.rid = ps.currency_rid
      LEFT JOIN ${MAIN_SCHEMA_NAME}.currency acc_curr ON acc_curr.rid = acc.currency_rid
      LEFT JOIN ${MAIN_SCHEMA_NAME}.currency usd_curr ON usd_curr.currency_code = 'USD'
      LEFT JOIN ${MAIN_SCHEMA_NAME}.project_classification pc ON pc.rid = ps.project_classification_rid
      LEFT JOIN ${MAIN_SCHEMA_NAME}.project_type pt ON pt.rid = ps.project_type_rid
      LEFT JOIN ${MAIN_SCHEMA_NAME}.status s ON s.rid = ps.status_rid
      LEFT JOIN ${MAIN_SCHEMA_NAME}.status accountStatus ON accountStatus.rid = acc.status_rid
    `;
  },
  getCommonProjectGroupBy(): string {
    return `
      GROUP BY 
        ps.project_code, ps.project_name, acc.account_name, acc.r_number, accountStatus.status_name, ps.project_rid, ps.modified_datetime, 
        ps.assessment_status, ps.qre, ps.is_rd_qualified,
        ps.industry_name, ind.industry_name, ps.project_type_rid, ps.project_client_group, ps.project_group,
        ps.project_classification_rid, ps.project_classification_other, pc.classification_name, pt.project_type_name,
        ps.status_rid, s.status_name, ps.project_point_of_contact, ps.technical_point_of_contact,
        ps.r_number, ps.program_name, ps.project_startdate, ps.project_enddate,
        ps.total_cost, ps.total_effort, ps.total_fte, ps.total_cost_fte, ps.total_subcon, ps.total_cost_subcon,
        ps.total_cost_nonlabor, ps."comments", cou.country_name, curr.currency_code, acc_curr.currency_code,
        usd_curr.currency_code, curr.currency_symbol, acc_curr.currency_symbol, usd_curr.currency_symbol,
        st.state_name, ps.created_datetime, ps.account_rid
    `;
  },
  getChildAggregationSQL(
    childSortClause: string,
    fiscalYearClause: string,
    filterWhereSQLChild?: string
  ): string {
    return `
    (
      SELECT COALESCE(
        json_agg(pfs_sub ${childSortClause}) FILTER (WHERE pfs_sub.project_fiscal_rid IS NOT NULL),
        '[]'::json
      )
      FROM (
        SELECT 
          pfs.project_code, 
          pfs.project_group, 
          pfs.project_name, 
          pt.project_type_name, 
          pfs.project_type_rid, 
          pfs.fiscal_year, 
          pfs.project_client_group, 
          pfs.project_classification_rid,
          acc.account_name, 
          ps.qre,
          pc.classification_name AS classification_name,
          pfs.project_classification_other,
          CAST(pfs.total_effort_prj AS TEXT) as total_effort, 
          CAST(pfs.total_cost_prj AS TEXT) AS total_cost,
          CAST(pfs.total_cost_fte_prj AS TEXT) AS total_cost_fte,
          CAST(pfs.total_cost_subcon_prj AS TEXT) AS total_cost_subcon,
          CAST(pfs.total_cost_nonlabor_prj AS TEXT) AS total_cost_nonlabor, 
          pfs.assessment_status, 
          pfs.created_datetime,
          pfs.qre_final, 
          pfs.project_point_of_contact, 
          pfs.technical_point_of_contact, 
          pfs.comments, 
          pfs.modified_datetime, 
          pfs.project_rid, 
          pfs.project_fiscal_rid, 
          pfs.r_number, 
          pfs.account_rid,
          COALESCE(curr.currency_code,acc_curr.currency_code,usd_curr.currency_code) as currency_code,
          COALESCE(curr.currency_symbol,acc_curr.currency_symbol,usd_curr.currency_symbol) as currency_symbol,
          pfs.rd_percent_final
        FROM ${MAIN_SCHEMA_NAME}.project_fiscal_summary pfs
        INNER JOIN ${MAIN_SCHEMA_NAME}.account acc ON acc.rid = pfs.account_rid 
        LEFT JOIN ${MAIN_SCHEMA_NAME}.project_classification pc ON pc.rid = pfs.project_classification_rid
        LEFT JOIN ${MAIN_SCHEMA_NAME}.project_type pt ON pt.rid = pfs.project_type_rid
        LEFT JOIN ${MAIN_SCHEMA_NAME}.currency curr ON curr.rid = pfs.currency_rid
        LEFT JOIN ${MAIN_SCHEMA_NAME}.currency acc_curr ON acc_curr.rid = acc.currency_rid
        LEFT JOIN ${MAIN_SCHEMA_NAME}.currency usd_curr ON usd_curr.currency_code = 'USD'
        WHERE pfs.project_rid = ps.project_rid 
          AND pfs.account_rid = ps.account_rid
          ${fiscalYearClause}
          ${filterWhereSQLChild ? `AND ${filterWhereSQLChild}` : ""}
      ) AS pfs_sub
    ) AS "ProjectFiscal"
    `;
  },
  getChildAggSQL(
    childSortClause: string,
    fiscalYearClause: string,
    filterWhereSQLChild?: string
  ): string {
    return `
      (
        SELECT COALESCE(
          json_agg(pfs_sub ${childSortClause}) FILTER (WHERE pfs_sub.project_fiscal_rid IS NOT NULL),
          '[]'::json
        )
        FROM (
          SELECT 
            pfs.project_code, 
            pfs.project_group, 
            pfs.project_name, 
            pt.project_type_name, 
            pfs.project_type_rid, 
            pfs.fiscal_year, 
            pfs.project_client_group, 
            acc.account_name, 
            ps.qre,
            COALESCE(pfs.project_classification_other, pc.classification_name) AS classification_name,
            CAST(pfs.total_effort_prj AS TEXT) as total_effort, 
            CAST(pfs.total_cost_prj AS TEXT) AS total_cost,
            CAST(pfs.total_cost_fte_prj AS TEXT) AS total_cost_fte,
            CAST(pfs.total_cost_subcon_prj AS TEXT) AS total_cost_subcon,
            CAST(pfs.total_cost_nonlabor_prj AS TEXT) AS total_cost_nonlabor, 
            pfs.assessment_status, 
            pfs.created_datetime,
            pfs.qre_final, 
            pfs.rd_percent_final,
            pfs.project_point_of_contact, 
            pfs.technical_point_of_contact, 
            pfs.comments, 
            pfs.modified_datetime, 
            pfs.project_rid, 
            pfs.project_fiscal_rid, 
            pfs.r_number, 
            pfs.account_rid
          FROM ${MAIN_SCHEMA_NAME}.project_fiscal_summary pfs
          INNER JOIN ${MAIN_SCHEMA_NAME}.account acc ON acc.rid = pfs.account_rid 
          LEFT JOIN ${MAIN_SCHEMA_NAME}.project_classification pc ON pc.rid = pfs.project_classification_rid
          LEFT JOIN ${MAIN_SCHEMA_NAME}.project_type pt ON pt.rid = pfs.project_type_rid
          WHERE pfs.project_rid = ps.project_rid 
            AND pfs.account_rid = ps.account_rid
            ${fiscalYearClause}
            ${filterWhereSQLChild ? `AND ${filterWhereSQLChild}` : ""}
        ) AS pfs_sub
      ) AS "ProjectFiscal"
    `;
  },
  getCheckTableExistsQuery() {
    return `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = :schemaName
          AND table_name = 'project'
      ) AS "exists"
    `;
  },
  getAccountListQuery() {
    return `
      SELECT rid, r_number, storage_type, parent_account_rid 
      FROM ${MAIN_SCHEMA_NAME}.account
    `;
  },
  getIndustryById() {
    return `SELECT industry_name FROM ${MAIN_SCHEMA_NAME}.industry WHERE rid = :id`
  },
  getProjectTypeByIdQuery() {
    return `
      SELECT project_type_name 
      FROM ${MAIN_SCHEMA_NAME}.project_type 
      WHERE rid = :id
    `;
  },
  getProjectClassificationByIdQuery() {
    return `
      SELECT classification_name 
      FROM ${MAIN_SCHEMA_NAME}.project_classification 
      WHERE rid = :rid
    `;
  },
  getAccountsByParentAccountRidQuery(): string {
    return `
      SELECT * 
      FROM ${MAIN_SCHEMA_NAME}.account 
      WHERE parent_account_rid = :entityId
    `;
  },
  getAttachmentsByProjectRidQuery(): string {
    return `
      SELECT 
        a.*
      FROM "${MAIN_SCHEMA_NAME}"."attachment_summary" a
      WHERE a.attach_to = :project_rid
      ORDER BY a.created_datetime DESC
    `;
  },
  getAttachmentsByResourceRidQuery(): string {
    return `
      SELECT 
        a.*
      FROM "${MAIN_SCHEMA_NAME}"."attachment_summary" a
      WHERE a.attach_to = :resource_rid
      ORDER BY a.created_datetime DESC
    `;
  },
  getAccountsByRidsQuery(): string {
    return `
      SELECT * 
      FROM ${MAIN_SCHEMA_NAME}.account 
      WHERE rid IN (:accountRids)
    `;
  },
  getAccountsWithStatusByRidsQuery(): string {
    return `
      SELECT b.rid, b.status_rid, c.status_name FROM ${MAIN_SCHEMA_NAME}.account as b
      left join ${MAIN_SCHEMA_NAME}.status as c
      on b.status_rid = c.rid
    `;
  },
  getUserGroupTypeByUserRidQuery(): string {
    return `
      SELECT ugt.type AS group_type
      FROM ${MAIN_SCHEMA_NAME}.user_groups ug
      JOIN ${MAIN_SCHEMA_NAME}.user_group_mapping ugm ON ug.rid = ugm.group_rid 
      JOIN ${MAIN_SCHEMA_NAME}.user_group_type ugt ON ugt.rid = ug.group_type_rid
      WHERE ugm.user_rid = :userRid
      LIMIT 1
    `;
  },
  getUserProfileAndEmailByUserRidQuery(): string {
    return `
      SELECT p.profile_name, u.email
      FROM ${MAIN_SCHEMA_NAME}.user u
      JOIN ${MAIN_SCHEMA_NAME}.profile p ON u.profile_rid = p.rid 
      WHERE u.rid = :userRid
      LIMIT 1
    `;
  },
  getDirectAccountAccessQuery(): string {
    return `
      SELECT 
        ugea.entity_rid,
        a.parent_account_rid,
        CASE 
          WHEN a.parent_account_rid IS NULL THEN false 
          ELSE true 
        END AS is_child
      FROM ${MAIN_SCHEMA_NAME}.user_group_entity_access ugea
      LEFT JOIN ${MAIN_SCHEMA_NAME}.account a ON ugea.entity_rid = a.rid
      WHERE ugea.user_rid = :userRid 
        AND ugea.entity_type = 'ACCOUNT'
        AND ugea.access_type = 'INCLUDE'
    `;
  },
  getGroupAccountAccessQuery(): string {
    return `
      WITH user_groups AS (
        SELECT group_rid 
        FROM ${MAIN_SCHEMA_NAME}.user_group_mapping
        WHERE user_rid = :userRid
      )
      SELECT DISTINCT 
        gea.entity_rid,
        a.parent_account_rid,
        CASE 
          WHEN a.parent_account_rid IS NULL THEN false 
          ELSE true 
        END AS is_child
      FROM ${MAIN_SCHEMA_NAME}.user_group_entity_access gea
      JOIN user_groups ug ON gea.group_rid = ug.group_rid
      LEFT JOIN ${MAIN_SCHEMA_NAME}.account a ON gea.entity_rid = a.rid
      WHERE gea.entity_type = 'ACCOUNT'
        AND gea.access_type = 'INCLUDE'
    `;
  },
  getProfileFieldsAccessQuery(): string {
    return `
      SELECT pf.field_desc, pf.field_name, pfa.read, pfa.edit
      FROM ${MAIN_SCHEMA_NAME}.profile_fields_access pfa
      JOIN ${MAIN_SCHEMA_NAME}.permission_fields pf ON pfa.permission_field_id = pf.rid
      JOIN ${MAIN_SCHEMA_NAME}.module_permission mp ON pf.module_permission_id = mp.rid
      WHERE mp.permission_name = :permissionName
        AND pfa.profile_id = :profileId
    `;
  },
  getUserFieldsAccessQuery(): string {
    return `
      SELECT pf.field_desc, pf.field_name, ufa.read, ufa.edit
      FROM ${MAIN_SCHEMA_NAME}.user_fields_access ufa
      JOIN ${MAIN_SCHEMA_NAME}.permission_fields pf ON ufa.permission_field_id = pf.rid
      JOIN ${MAIN_SCHEMA_NAME}.module_permission mp ON pf.module_permission_id = mp.rid
      WHERE mp.permission_name = :permissionName
        AND ufa.user_id = :userId
    `;
  },
  fetchChecklistStatus() {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.checklist_status WHERE status_name ILIKE '%Done%'`
  },
  getCaseTeamRoleName(roleRid: string) {
    return `SELECT rid, role_name FROM ${MAIN_SCHEMA_NAME}.case_team_role WHERE rid = '${roleRid}'`
  },
  getWeightageValue(rid: string) {
    return `SELECT weightage_value FROM ${MAIN_SCHEMA_NAME}.task_weightage WHERE rid = '${rid}'`
  },
  getTaskCategoryByRid(rid: string) {
    return `SELECT category_name FROM ${MAIN_SCHEMA_NAME}.task_category WHERE rid = '${rid}'`
  },
  getTaskNames(rid: any[], schemaName: string) {
    let ids: string[] = []
    if (rid.length > 0) {
      ids.push(`${rid.map((d: any) => `'${d}'`).join(',')}`)
      return `SELECT rid, task_name FROM ${schemaName}.case_task WHERE rid IN (${ids})`
    }
  },
  getWorkflowConnectors(rid: any[]) {
    let ids: string[] = []
    if (rid.length > 0) {
      ids.push(`${rid.map((d: any) => `'${d}'`).join(',')}`)
      return `SELECT rid, relationship_type FROM ${MAIN_SCHEMA_NAME}.workflow_connector WHERE rid IN (${ids})`
    }
  },
  getAllTagsName(rid: any[]) {
    let ids: string[] = []
    if (rid.length > 0) {
      ids.push(`${rid.map((d: any) => `'${d}'`).join(',')}`)
      return `SELECT rid, tag_name FROM ${MAIN_SCHEMA_NAME}.tags WHERE rid IN (${ids})`
    }
  },
  getOwnerDetails(caseOwnerRid: any[]) {
    return `SELECT rid, CONCAT(first_name,' ',last_name) AS name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (${caseOwnerRid.map(
      (d: any) => `'${d}'`
    )})`;
  },
  getAllPriorityTypes(rid: any[]) {
    let ids: string[] = []
    if (rid.length > 0) {
      ids.push(`${rid.map((d: any) => `'${d}'`).join(',')}`)
      return `SELECT rid, priority_name FROM ${MAIN_SCHEMA_NAME}.case_priority WHERE rid IN (${ids})`
    }
  },
  fetchCheckListStatusNamesByRids(schemaName: string, statusRids: string[]) {
    const ridsList = statusRids.map(rid => `'${rid}'`).join(",");
    if (ridsList.length > 0) {
      return `SELECT rid, status_name FROM ${schemaName}.checklist_status WHERE rid IN (${ridsList})`;
    } else {
      return `SELECT rid, status_name FROM ${schemaName}.checklist_status WHERE rid IN ('')`
    }
  },
  getAllTaskStatus(rid: any) {
    let ids: string[] = []
    if (rid.length > 0) {
      ids.push(`${rid.map((d: any) => `'${d}'`).join(',')}`)
      return `SELECT rid, task_status_name FROM ${MAIN_SCHEMA_NAME}.case_task_status WHERE rid IN (${ids})`
    }
  },
  findTaskSummaryDetails: (rid: string, accountRid: string) => {
    return `SELECT ts.*
            FROM ${MAIN_SCHEMA_NAME}.task_summary ts
            WHERE ts.rid = '${rid}' AND ts.account_rid = '${accountRid}'`;
  },
  updateTaskSummaryQuery: (getSetData: any, data: any) => {
    const { setClause } = getSetData;

    // Use named parameters for all dynamic values
    return `UPDATE ${MAIN_SCHEMA_NAME}.task_summary 
          SET ${setClause} 
          WHERE rid = :rid AND account_rid = :account_rid
          RETURNING *`;
  },
  fetchTaskSummaryDetails: (rid: string, accountRid: string) => {
    return `SELECT ts.*,
            COALESCE(cts.task_status_name, ast.status_name) as status_name,
            cp.priority_name,
            CONCAT(u_created.first_name, ' ', u_created.last_name) as created_by_name,
            CONCAT(u_modified.first_name, ' ', u_modified.last_name) as modified_by_name,
            CONCAT(u_assigned.first_name, ' ', u_assigned.last_name) as assigned_to_name,
            acc.account_name,
            acc_status.status_name as account_status_name,
            COALESCE(acc_attach.account_name, ps.project_code, cs.case_name) as attach_to_name
            FROM ${MAIN_SCHEMA_NAME}.task_summary ts
            LEFT JOIN ${MAIN_SCHEMA_NAME}.case_task_status cts ON cts.rid = ts.status_rid
            LEFT JOIN ${MAIN_SCHEMA_NAME}.activity_status ast ON ast.rid = ts.status_rid
            LEFT JOIN ${MAIN_SCHEMA_NAME}.case_priority cp ON cp.rid = ts.priority_rid
            LEFT JOIN ${MAIN_SCHEMA_NAME}."user" u_created ON u_created.rid = ts.created_by
            LEFT JOIN ${MAIN_SCHEMA_NAME}."user" u_modified ON u_modified.rid = ts.modified_by
            LEFT JOIN ${MAIN_SCHEMA_NAME}."user" u_assigned ON u_assigned.rid = ts.assigned_to
            LEFT JOIN ${MAIN_SCHEMA_NAME}.account acc ON acc.rid = ts.account_rid
            LEFT JOIN ${MAIN_SCHEMA_NAME}.account acc_attach ON acc_attach.rid = ts.attach_to
            LEFT JOIN ${MAIN_SCHEMA_NAME}.status acc_status ON acc_status.rid = acc.status_rid
            LEFT JOIN ${MAIN_SCHEMA_NAME}.project_fiscal_summary ps ON ps.project_fiscal_rid = ts.attach_to
            LEFT JOIN ${MAIN_SCHEMA_NAME}.case_summary cs ON cs.case_rid = ts.attach_to
            where ts.rid = '${rid}' AND ts.account_rid = '${accountRid}'`;
  },
  getActiveStatusId() {
    return `SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.status where status_name ILIKE '%Active%'`
  },
  fetchUserNames(oldRid: string, newRid: string) {
    if (oldRid === null) oldRid = ''
    if (newRid === null) newRid = ''
    return `SELECT rid, CONCAT(first_name, ' ', last_name) AS name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN ('${oldRid}', '${newRid}')`
  },
  fetchCheckLists(oldRid: string, newRid: string) {
    if (oldRid === null) oldRid = ''
    if (newRid === null) newRid = ''
    return `SELECT rid, checklist_name FROM ${MAIN_SCHEMA_NAME}.checklist_template WHERE rid IN ('${oldRid}', '${newRid}')`
  },
  fetchPriority(oldRid: string, newRid: string) {
    if (oldRid === null) oldRid = ''
    if (newRid === null) newRid = ''
    return `SELECT rid, priority_name FROM ${MAIN_SCHEMA_NAME}.case_priority WHERE rid IN ('${oldRid}', '${newRid}')`
  },
  fetchTaskStatus(oldRid: string, newRid: string) {
    if (oldRid === null) oldRid = ''
    if (newRid === null) newRid = ''
    return `SELECT rid, task_status_name FROM ${MAIN_SCHEMA_NAME}.case_task_status WHERE rid IN ('${oldRid}', '${newRid}')`
  },
  fetchTaskWeightage(oldRid: string, newRid: string) {
    if (oldRid === null) oldRid = ''
    if (newRid === null) newRid = ''
    return `SELECT rid, weightage_value FROM ${MAIN_SCHEMA_NAME}.task_weightage WHERE rid IN ('${oldRid}', '${newRid}')`
  },
  fetchTaskCategory(oldRid: string, newRid: string) {
    if (oldRid === null) oldRid = ''
    if (newRid === null) newRid = ''
    return `SELECT rid, category_name FROM ${MAIN_SCHEMA_NAME}.task_category WHERE rid IN ('${oldRid}', '${newRid}')`
  },
  insertTimeline: (schemaName: string, tableName: string) =>
    `INSERT INTO "${schemaName}".${tableName} (event_name, event_status, event_type, entity_rid,account_rid, description, created_by, event_datetime, created_datetime) VALUES (:event_name, :event_status, :event_type, :entity_rid, :account_rid, :description, :created_by, :event_datetime, :created_datetime)`,

  getAccountDetails(accountRid: string) {
    return `SELECT rid, r_number, subscription_id, is_parent FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`
  },
  fetchParentAccountDetails: `SELECT * FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = :rid`,
  getUserNameByIdQuery() {
    return `
      SELECT first_name, middle_name, last_name 
      FROM ${MAIN_SCHEMA_NAME}."user" 
      WHERE rid = :userId
    `;
  },
  fetchChecklistTemplates: `
    SELECT 
        ct.rid,
        ct.r_number,
        ct.checklist_name,
        ct.checklist_description,
        ct.status_rid,
        s.status_name AS status_name,
        ct.created_by,
        ct.modified_by,
        ct.created_datetime,
        ct.modified_datetime
    FROM 
        ${MAIN_SCHEMA_NAME}.checklist_template ct
    LEFT JOIN 
        ${MAIN_SCHEMA_NAME}.status s ON ct.status_rid = s.rid
        WHERE 
        ct.rid = :checklistId
    LIMIT 1;
  `,
  fetchChecklistStatusByName(statusName: string) {
    return `
    SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.checklist_status WHERE status_name = '${statusName}'`;
  },
  fetchActivityStatusById(oldRid: string, newRid: string) {
    if (oldRid === null) oldRid = ''
    if (newRid === null) newRid = ''
    return `SELECT rid, status_name as name FROM ${MAIN_SCHEMA_NAME}.activity_status WHERE activity_type ='Task' AND rid IN ('${oldRid}', '${newRid}')`
  },
  getTaskTypeRidMilestone: `SELECT rid FROM ${MAIN_SCHEMA_NAME}.task_type WHERE task_type_name = 'Milestone'`,
  getTaskTypeRidActivity: `SELECT rid FROM ${MAIN_SCHEMA_NAME}.task_type WHERE task_type_name = 'Action'`,
  checkCaseProjectsTableExists: `
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = :schemaName
                    AND table_name = 'case_projects'
                ) AS exists;
                `,
  fetchUsersByIds: `SELECT rid, CONCAT(first_name, ' ', last_name) as full_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (:userIds)`,
  getStatusNamesByIds: `SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.activity_status WHERE rid IN (:statusIds)
          union
          SELECT rid, task_status_name FROM ${MAIN_SCHEMA_NAME}.case_task_status  WHERE rid IN (:statusIds)
          `,
  getPriorityNamesByIds: `SELECT rid, priority_name FROM ${MAIN_SCHEMA_NAME}.case_priority WHERE rid IN (:priorityIds)`,
  getResourceNamesByIds(schema_name: string): string {
    return `SELECT rid, resource_name FROM ${schema_name}.resources WHERE rid IN (:resourceRids)`;
  },
  getProjectsForCases(caseRid: string, accountRid: string, schemaName: string) {
    return `SELECT project_fiscal_rid FROM ${schemaName}.case_projects WHERE case_rid = '${caseRid}' AND account_rid = '${accountRid}'`
  },
  fetchAccountDetailsInfo(rid: string) {
    return `
    SELECT rid, account_name,r_number,parent_account_rid,country_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${rid}'`;
  },
  fetchAllPlatformConfig(rid: string) {
    return `
    SELECT config_json,effective_start_date,effective_end_date  FROM ${MAIN_SCHEMA_NAME}.rd_credit_parameter_values rv
    join ${MAIN_SCHEMA_NAME}.rd_credit_config_group rg on  rv.credit_config_group_rid  = rg.rid
    where rg.country_rid = '${rid}'
    AND credit_program_name = 'Platform Configuration'
    AND rg.is_federal = true 
    AND rv.status_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_description = 'active')
  ORDER BY rv.effective_start_date DESC`;
  },
};

export const IMPORT_FILTER_COLUMNS: any = {
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
  r_number: "r_number",
};

export const IMPORT_DOC_FILTER_KEYS = {
  format: "format",
  size: "size",
  status: "status",
};

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
  records_with_warning: "records_with_warning",
};

export const ALPHANUMERIC_CONDITIONS: any = {
  equals: "equals",
  notEquals: "not_equals",
  contains: "contains",
  isEmpty: "is_empty",
  IN: "in",
  less_than: "less_than",
  greater_than: "greater_than",
  between: "between",
  before: "before",
  after: "after",
};

export const UPDATE_FLAG = {
  project: "project",
  account: "account",
};

export const SUMMARY_HIGHLIGHTS_FLAG = {
  all: "all",
  rdQualified: "rd_qualified",
};

export const DEFAULT_PROJECT_DETAILS = {
  maxAiInteraction: 5,
};

export const SUMMARY_HIGHLIGHTS_TYPE_FLAG = {
  statewise: "state",
  summary: "summary",
};

export const primaryKeyContacts = {
  technical_point_of_contact: "technical_point_of_contact",
  financial_consultant: "financial_consultant",
  project_point_of_contact: "project_point_of_contact",
};

export const IMPORT_FIELD_MAPPINGS_FOR_EXPORT = [
  {
    permissionField: "r_number",
    exportField: "Import ID",
    dataField: "r_number",
  },
  {
    permissionField: "file_name",
    exportField: "File Name",
    dataField: "file_name",
  },
  { permissionField: "format", exportField: "Format", dataField: "format" },
  { permissionField: "size", exportField: "Size", dataField: "size" },
  {
    permissionField: "fiscal",
    exportField: "Fiscal Year",
    dataField: "fiscal",
  },
  { permissionField: "entity", exportField: "Entity", dataField: "entity" },
  {
    permissionField: "total_records",
    exportField: "Total Records",
    dataField: "total_records",
  },
  {
    permissionField: "records_loaded_successfully",
    exportField: "Records Loaded Successfully",
    dataField: "records_loaded_successfully",
  },
  {
    permissionField: "records_with_warning",
    exportField: "Records with Warning",
    dataField: "records_with_warning",
  },
  {
    permissionField: "records_failed_to_load",
    exportField: "Records Failed to Load",
    dataField: "records_failed_to_load",
  },
  { permissionField: "status", exportField: "Status", dataField: "status" },
  {
    permissionField: "status_descriptions",
    exportField: "Status Description",
    dataField: "status_description",
  },
  {
    permissionField: "imported_by",
    exportField: "Imported By",
    dataField: "imported_by",
  },
  {
    permissionField: "imported_on",
    exportField: "Imported On",
    dataField: "imported_on",
    formatter: (value: any) => moment(value).format("YYYY-MMM-DD, hh:mm:ss A"),
  },
];

export const filterColumnsForQreHistoryList: any = {
  qre_percent: `qre_percent`,
  version: `version`,
  created_datetime: `created_datetime`
}

export const filterColumnsTypesForQreHistory: any = {
  qre_percent: `number`,
  version: `number`,
  created_datetime: `date`
}

export const numericConditionsForQRE: any = {
  equals: "equals",
  not_equals: "not_equals",
  is_empty: "is_empty",
  less_than: "less_than",
  greater_than: "greater_than",
  between: "between"
};

export const dateConditionsForQRE: any = {
  equals: "equals",
  between: "between",
  before: "before",
  after: "after",
  is_empty: "is_empty",
};

export const relationshipTypes = {
  blocks: "Blocks",
  enables: "Enables",
  isBlockedBy: "Is Blocked By",
  isEnabledBy: "Is Enabled By"
}

export const activityTypes = {
  email: "Email",
  meeting: "Meeting",
  call: "Call",
  task: "Task",
};