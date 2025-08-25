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
};
export const statusAction = {
  CREATE: "Created",
  DRAFT: "Draft",
  SENT: "Sent",
  RESPONSE_DRAFT: "Response Draft",
  RESPONSE_RECEIVED: "Response Received",
  CANCELLED: "Cancelled",
  ON_HOLD: "On Hold",
  RESUME: "Resume",
  RESENT: "Resent"
};

export const interactionSource = {
  AUTO: "Auto",
  MANUAL: "Manual",
};
export const interactionType = {
  RD: "RD",
  GREENENERGY: "Green Energy",
};
export const ENV_PREFIX = process.env.NODE_ENV_DB_PREFIX || 'D001-';
export const MAIN_SCHEMA_NAME = "trd365";
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

export const NODE_ENV = {
  DEV: "DEV",
  PROD: "PRODUCTION",
};

export const OTP_EXPIRY_MINUTES = 10;
export const MAX_RESEND_ATTEMPTS = 3;

export const filtersColumns : Record<string, string> =
  {
    r_number : "r_number",
    iteration : "interaction_iteration",
    interaction_age : "interaction_age",
    recipient_name : "recipient_name",
    recipient_email : "recipient_email",
    last_resent_on : "last_resent_on",
    last_reminder_on : "last_reminder_on",
    response_submitted_on : "response_submitted_on",
    response_updated_on : "response_updated_on",
    attachment_count : "attachment_count",
    response_source : "response_source",
    created_datetime : "created_datetime",
    modified_datetime : "modified_datetime",
    status_rid : "status_rid",
    interaction_type_rid : "interaction_type_rid",
    interaction_iteration : "interaction_iteration"
  }

  export const filterTypes : Record<string, any> = 
  {
    r_number : "string",
    iteration : "number",
    interaction_age : "number",
    recipient_name : "string",
    recipient_email : "string",
    last_resent_on : "datetime",
    last_reminder_on : "datetime",
    response_submitted_on : "datetime",
    response_updated_on : "datetime",
    attachment_count : "number",
    response_source : "string",
    created_datetime : "datetime",
    modified_datetime : "datetime",
    status_rid : "string",
    interaction_type_rid : "string"
  }

  export const ALPHANUMERIC_CONDITIONS : Record <string, string> = {
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

export const interactionFlag = {
  account : "account",
  project : "project"
}

export const mainTableFilters : Record<any, any> = {
  created_user_name : "created_user_name",
  updated_user_name : "updated_user_name",
  interaction_type_name : "interaction_type_name",
  interaction_source_name : "interaction_source_name",
  status_name : "status_name"
}

export const STATUS_MESSAGE = {
  accountInactive: "Inactive Account",
  accountNoFound: "Account not found",
  accountUpdateSuccess: "Account updated successfully",
  accountIdMissing: "Account RID mising",
  importIdMissing: "Import RID mising",
  entityTypeMissing: "Entity type mising",
  oneFieldRequired: "Atleast one field is required to update",
  keyContactIdMissing: "Key-Contact RID is missing",
  projectUpdateSuccess: "Field updated successfully",
  projectIdMissing: "Project RID missing",
  projectTaskIdMissing: "Project Task RID is missing",
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
  settingsUpdatedSuccess: "Operation updated successfully",
  userIdMissingInHeader: "User-ID missing in headers",
  fiscalStartDateMissing: "Fiscal Startdate missing",
  fiscalEndDateMissing: "Fiscal Enddate missing",
  autoAccessmentMissing: "Auto Assessment missing",
  autoSendMissing: "Autosend Interaction missing",
  maxAiMissing: "Max AI Interaction missing",
  accountSummaryHighlightsSuccess: "Financial Summary fetched successfully",
  effortExceeded: "Effort cannot exceed the total hours in the duration",
  effort24HrsExceeded: "Effort cannot exceed 24 hours for the day",
  interactionFetchedSuccess : "Interactions fetched successfully",
  dataNotFound : "Data not found",
  historyResponseFetched : "Interaction Response history fetched successfully",
  interactionHistoryFetched : "Interaction history fetched successfully",
  interactionAttachmentFetched : "Interaction attachments fetched successfully",
  nodDataToExport : "No Data available for download",
  technicalIssue:"Technical Issue",
  interactionFailed:"Interaction Creation Failed",
  interactionUpdateFailed:"Interaction Update Failed",
  responseUpdateFailed:"Interaction Response Update Failed",
  assessmentInitiated : "AI Assessment Initiated"
};

export const rawQueries = {
  async fetchParentAccount(
    accountRid: any,
    mainSequelize: Sequelize
  ): Promise<any> {
    let checkIsSeparateDb: any = await mainSequelize.query(
      `SELECT rid, r_number, account_name, storage_type FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`
    );
    if (checkIsSeparateDb[0][0].storage_type == STATUS_MESSAGE.separateDb) {
      return `SELECT rid, r_number, account_name, storage_type FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`;
    } else {
      return `
      with fetch_account_details AS (
      SELECT rid, r_number, parent_account_rid FROM ${MAIN_SCHEMA_NAME}.account where rid = '${accountRid}'
      )
      SELECT a.rid, a.r_number, a.account_name, a.is_parent 
      FROM ${MAIN_SCHEMA_NAME}.account a
      LEFT JOIN fetch_account_details ad ON ad.parent_account_rid = a.rid
      WHERE a.rid = ad.parent_account_rid`;
    }
  },
  fetchSchemaName(r_number: string) {
    return `${MAIN_SCHEMA_NAME}_${r_number.replace("ACC-", "")}`;
  },
  fetchInteractionTypes(data : any) {
    let ids = data.map((d : any) => `'${d}'`)
    return `
    SELECT rid, interaction_type_name FROM ${MAIN_SCHEMA_NAME}.interaction_type WHERE rid IN (${ids})`
  },
  fetchInteractionSource(data : any) {
     let ids = data.map((d : any) => `'${d}'`)
    return `
    SELECT rid, interaction_source_name FROM ${MAIN_SCHEMA_NAME}.interaction_source WHERE rid IN (${ids})`
  },
  fetchInteractionStatus(data: any) {
    let ids: string[];
    if (Array.isArray(data)) {
      ids = data.map((d: any) => `'${d}'`);
    } else if (typeof data === "string") {
      ids = [`'${data}'`];
    } else {
      ids = [];
    }
    return `
    SELECT rid, status_name  FROM ${MAIN_SCHEMA_NAME}.interaction_status WHERE rid IN (${ids})`;
  },
  fetchInteractionStatusByType(type : string) {
    return `
    SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.interaction_status WHERE status_name = '${type}'`
  },
  fetchProjectInfo(rid : string,schemaName : string) {
    return `
    SELECT rid, project_name,project_code,r_number,fiscal_year FROM ${schemaName}.project_fiscal WHERE rid = '${rid}'`
  },
   updateQreInfo(rid : string, schemaName : string, qrePercent: number) {
    return `
    UPDATE ${schemaName}.project_fiscal SET qre_final = ${qrePercent} WHERE rid = '${rid}'`
  },
  updateQreInfoSummary(rid: string, qrePercent: number) {
    return `
    UPDATE ${MAIN_SCHEMA_NAME}.project_fiscal_summary SET qre_final = ${qrePercent} WHERE project_fiscal_rid = '${rid}'`
  },
  fetchAccountInfo(rid: string) {
    return `
    SELECT rid, account_name FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${rid}'`
  },
  fetchPreviousInteractionStatus(statusRid: string,schemaName: string) {
    return `
    SELECT old_status_rid FROM ${schemaName}.interaction_status_history WHERE new_status_rid = '${statusRid}' ORDER BY created_datetime DESC LIMIT 1`
  },
  fetchUser(data : any) {
     let ids = data.map((d : any) => `'${d}'`)
    return `
    SELECT rid, first_name, last_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (${ids})`
  },
  fetchPOCEmail(projectFiscalRid: string) {
    return `
    SELECT project_point_of_contact_email,project_point_of_contact FROM ${MAIN_SCHEMA_NAME}.project_fiscal_summary WHERE project_fiscal_rid = '${projectFiscalRid}' LIMIT 1`
  },
  fetchisAutoSendEnabled(projectFiscalRid: string,schemaName : string) {
    return `
    SELECT auto_send_ai_interaction FROM ${schemaName}.project_fiscal WHERE rid = '${projectFiscalRid}' LIMIT 1`
  },
  fetchInteractionStatusList(whereClause: string) {
    return `
    SELECT rid, status_name,status_type FROM ${MAIN_SCHEMA_NAME}.interaction_status WHERE ${whereClause} ORDER BY status_name ASC`
  },
  fetchUserEmail(userId:string)
  {
    return `
    SELECT email FROM ${MAIN_SCHEMA_NAME}.user WHERE rid = '${userId}' LIMIT 1`
  },
  fetchInteractionType(type:string)
  {
    return `
    SELECT rid FROM ${MAIN_SCHEMA_NAME}.interaction_type WHERE interaction_type_name = '${type}' LIMIT 1`
  },
  fetchAllParentRNumber () {
    let query =
    `SELECT r_number FROM ${MAIN_SCHEMA_NAME}.account WHERE storage_type = '${STATUS_MESSAGE.separateDb}' AND parent_account_rid IS NULL`
    return query;

}
};

export const filterTypesForSummaryInteractions : Record<string, any> = 
  {
    r_number : "string",
    iteration : "number",
    interaction_age : "number",
    recipient_name : "string",
    recipient_email : "string",
    last_resent_on : "datetime",
    last_reminder_on : "datetime",
    response_submitted_on : "datetime",
    response_updated_on : "datetime",
    attachment_count : "number",
    response_source : "string",
    created_datetime : "datetime",
    modified_datetime : "datetime",
    interaction_source_name : "string",
    created_user_name : "string",
    updated_user_name : "string",
    status_rid : "string",
    interaction_type_rid : "string",
    interaction_iteration : "number"
  }

  export const filtersColumnsForInteractionSummary : Record<string, string> =
  {
    r_number : "r_number",
    iteration : "interaction_iteration",
    interaction_age : "interaction_age",
    recipient_name : "recipient_name",
    recipient_email : "recipient_email",
    last_resent_on : "last_resent_on",
    last_reminder_on : "last_reminder_on",
    response_submitted_on : "response_submitted_on",
    response_updated_on : "response_updated_on",
    attachment_count : "attachment_count",
    response_source : "response_source",
    created_datetime : "created_datetime",
    modified_datetime : "modified_datetime",
    interaction_source_name : "interaction_source_name",
    interaction_type_name : "interaction_type_name",
    created_user_name : "created_user_name",
    updated_user_name : "updated_user_name",
    status_rid : "status_rid",
    interaction_type_rid : "interaction_type_rid",
    status_name : "status_name",
    interaction_iteration : "interaction_iteration"
  }

  export const responseSortKeys = ["r_number","response_by", "response_on","response_email","interaction_response", "interaction_version"]
  export const blobUrlExpiration = 60

  export const filterTypesForIntHistory : Record<string, string> = {
    status_rid : "string",
    date : "datetime"
  }