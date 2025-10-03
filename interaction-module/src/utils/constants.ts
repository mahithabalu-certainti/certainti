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
  RESENT: "Resent",
  INQUEUE: "In-Queue"
};

export const techSummaryStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive"
}

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
export const sendEmailCount = 25
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
    sent_on_datetime : "sent_on_datetime",
    last_reminder_on : "last_reminder_on",
    response_submitted_on : "response_submitted_on",
    response_updated_on : "response_updated_on",
    attachment_count : "attachment_count",
    response_source : "response_source",
    created_datetime : "created_datetime",
    modified_datetime : "modified_datetime",
    status_rid : "status_rid",
    interaction_type_rid : "interaction_type_rid",
    interaction_iteration : "interaction_iteration",
    project_code : "project_code",
    fiscal_year : "fiscal_year",
    response_source_rid : "response_source_rid",
    interaction_level_rid:"interaction_level_rid",
    parent_interaction_rid : "parent_interaction_rid",
    createdAt : "createdAt",
    template_name : "template_name"
  }

  export const templatefiltersColumns : Record<string, string> =
  {
    r_number : "r_number",
    created_user_name:"created_user_name",
    modified_user_name:"modified_user_name",
    created_datetime : "created_datetime",
    modified_datetime : "modified_datetime",
    status_rid : "status_rid",
    interaction_type_rid : "interaction_type_rid",
    interaction_level_rid:"interaction_level_rid",
    parent_interaction_rid : "parent_interaction_rid",
    createdAt : "createdAt",
    template_name : "template_name"
  }

  export const filterTypes : Record<string, any> = 
  {
    r_number : "string",
    interaction_iteration : "number",
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
    sent_on_datetime : "datetime",
    status_rid : "string",
    interaction_type_rid : "string",
    project_code : "string",
    fiscal_year : "number",
    response_source_rid : "string",
    parent_interaction_rid:"string",
    interaction_level_rid:"string",
    createdAt:"datetime",
    template_name : "string",
    created_user_name : "string",
    modified_user_name : "string"
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
  status_name : "status_name",
  response_source_name : "response_source_name",
  interaction_level_name:"interaction_level_name",
  modified_by: "modified_by",
  modified_user_name:"modified_user_name"
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
  assessmentInitiated : "RD Assessment Initiated",
  interactionCreatedButNoEmailRecipient:"Auto send skipped as no email recipient found",
  interactionCreated:"Interaction created successfully",
  interactionUpdated:"Interaction updated successfully",
  techSummarycontextUpdated:"Technical summary context updated successfully",
  projectRequired:"Atleast one project is required to create interaction",
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
  fetchGlobalAutoSendAccess() {
    return `
    SELECT auto_send_interaction FROM ${MAIN_SCHEMA_NAME}.organization_licenses limit 1`;
  },
  fetchGlobalAutoTriggerAccess() {
    return `
    SELECT auto_access_rd FROM ${MAIN_SCHEMA_NAME}.organization_licenses limit 1`;
  },
  fetchInteractionTypes(data: any) {
    let ids = data.map((d: any) => `'${d}'`);
    return `
    SELECT rid, interaction_type_name FROM ${MAIN_SCHEMA_NAME}.interaction_type WHERE rid IN (${ids})`;
  },
  fetchInteractionLevel(data: any) {
    let ids = data.map((d: any) => `'${d}'`);
    return `
    SELECT rid, interaction_level_name FROM ${MAIN_SCHEMA_NAME}.interaction_level WHERE rid IN (${ids})`;
  },
  fetchAllInteractionLevels() {
    return `Select rid, interaction_level_name from ${MAIN_SCHEMA_NAME}.interaction_level WHERE status = 'active' order by interaction_level_name ASC`;
  },
  fetchInteractionSource(data: any) {
    let ids = data.map((d: any) => `'${d}'`);
    return `
    SELECT rid, interaction_source_name FROM ${MAIN_SCHEMA_NAME}.interaction_source WHERE rid IN (${ids})`;
  },
  fetchInteractionResponseSource(data: any) {
    let ids = data.map((d: any) => `'${d}'`);
    return `
    SELECT rid, response_source_name FROM ${MAIN_SCHEMA_NAME}.interaction_response_source WHERE rid IN (${ids})`;
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

  fetchActiveStatus() {
    return `
    SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.status WHERE status_name = 'Active' limit 1`;
  },
  fetchInteractionStatusByType(type: string) {
    return `
    SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.interaction_status WHERE status_name = '${type}'`;
  },
  fetchResponseSourceByType(type: string) {
    return `
    SELECT rid, response_source_name FROM ${MAIN_SCHEMA_NAME}.interaction_response_source WHERE type = '${type}'`;
  },
  fetchProjectInfo(rid: string, schemaName: string) {
    return `
    SELECT rid, project_name,project_code,r_number,fiscal_year,project_rid,max_ai_interaction FROM ${schemaName}.project_fiscal WHERE rid = '${rid}'`;
  },
  fetchProjectsByAccount(accountRid: string, schemaName: string,status_rid:string) {
    return `
    SELECT rid, project_rid FROM ${schemaName}.project_fiscal WHERE account_rid = '${accountRid}' and status_rid='${status_rid}'`;
  },
  updateQreInfo(rid: string, schemaName: string, qrePercent: number, data: any) {
    return `
      UPDATE ${schemaName}.project_fiscal
      SET
        rd_percent_potential_ai = ${qrePercent},
        rd_percent_potential_ai_updated = ${qrePercent},
        rd_percent_final = ${data.netQre},
        qre_final = ${data.qreFinalCost},
        qre_fte = ${data.qreFteCost},
        qre_subcon = ${data.qreSubconCost},
        qre_nonlabor = ${data.qreNonlaborCost}
      WHERE rid = '${rid}'
    `;
  },
  updateQreInfoLocked(rid: string, schemaName: string, qrePercent: number) {
    return `
      UPDATE ${schemaName}.project_fiscal
      SET
        rd_percent_potential_ai_updated = ${qrePercent}
      WHERE rid = '${rid}'
    `;
  },
  updateAIProcessedFlag(
    rid: string,
    schemaName: string,
    isAiProcessed: boolean,
    statusRid:string
  ) {
    return `
    UPDATE ${schemaName}.interactions SET is_ai_processed = ${isAiProcessed} WHERE project_fiscal_rid = '${rid}' and status_rid='${statusRid}' `;
  },
  updateAIProcessedFlagAttachments(
    rid: string,
    schemaName: string,
    isAiProcessed: boolean
  ) {
    return `
    UPDATE ${schemaName}.attachments SET is_ai_processed = ${isAiProcessed} WHERE attach_to = '${rid}'`;
  },
  updateQreInfoSummary(rid: string, qrePercent: number, data: any) {
    return `
    UPDATE ${MAIN_SCHEMA_NAME}.project_fiscal_summary 
    SET 
      rd_percent_potential_ai = ${qrePercent},
      rd_percent_potential_ai_updated = ${qrePercent},
      rd_percent_final = ${data.netQre},
      qre_final = ${data.qreFinalCost},
      qre_fte = ${data.qreFteCost},
      qre_subcon = ${data.qreSubconCost},
      qre_nonlabor = ${data.qreNonlaborCost}
    WHERE project_fiscal_rid = '${rid}'`;
  },
  updateQreInfoSummarLocked(rid: string, qrePercent: number) {
    return `
    UPDATE ${MAIN_SCHEMA_NAME}.project_fiscal_summary 
    SET rd_percent_potential_ai_updated = ${qrePercent}
    WHERE project_fiscal_rid = '${rid}'`;
  },
  fetchAccountInfo(rid: string) {
    return `
    SELECT rid, account_name,r_number,parent_account_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${rid}'`;
  },
   fetchAccountDetailsInfo(rid: string,schemaName: string) {
    return `
    SELECT rid, fiscal_start_date,fiscal_end_date,autosend_interaction,max_ai_interactions FROM ${schemaName}.account_details WHERE account_rid = '${rid}'`;
  },
  
  fetchPreviousInteractionStatus(statusRid: string, schemaName: string) {
    return `
    SELECT old_status_rid FROM ${schemaName}.interaction_status_history WHERE new_status_rid = '${statusRid}' ORDER BY created_datetime DESC LIMIT 1`;
  },
  fetchUser(data: any) {
    let ids = data.map((d: any) => `'${d}'`);
    return `
    SELECT rid, first_name, last_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (${ids})`;
  },
  fetchInteractionRecipientSummary(projectFiscalRid: any, schemaName: string) {
    let ids = projectFiscalRid.map((d: any) => `'${d}'`);
    return `
    SELECT  is_interaction_recipient,project_fiscal_rid FROM ${MAIN_SCHEMA_NAME}.project_fiscal_summary WHERE project_fiscal_rid IN (${ids})`;
  },
  fetchPOCEmail(projectFiscalRid: string) {
    return `
    SELECT project_point_of_contact_email,project_point_of_contact FROM ${MAIN_SCHEMA_NAME}.project_fiscal_summary WHERE project_fiscal_rid = '${projectFiscalRid}' LIMIT 1`;
  },
  fetchInteractionSenderEmail(schemaName: string, accountRid: string) {
    return `
    SELECT support_email,client_id,client_secret,tenant_id, subscription_created FROM ${schemaName}.account_details WHERE account_rid = '${accountRid}'  and  subscription_created is true  and support_email is not null LIMIT 1`;
  },
  fetchGlobalSenderEmail() {
    return `
    SELECT * FROM ${MAIN_SCHEMA_NAME}.organization_licenses LIMIT 1`;
  },
  isEmailRecipientAvailable(projectFiscalRid: string, schemaName: string, statusRid: string) {
    return `
    SELECT EXISTS (
      SELECT 1
      FROM ${schemaName}.key_contact_details
      WHERE lower(entity_type) = 'project'
        AND include_in_communication IS true
        AND entity_rid = '${projectFiscalRid}'
        AND status_rid = '${statusRid}'
    ) AS recipient_available
  `;
  },
  isEmailRecipientAvailableFrAccount(accountRid: string, schemaName: string, statusRid: string) {
    return `
    SELECT EXISTS (
      SELECT 1
      FROM ${schemaName}.key_contact_details
      WHERE lower(entity_type) = 'account'
        AND interaction_cc_recipient IS true
        AND entity_rid = '${accountRid}'
        AND status_rid = '${statusRid}'
    ) AS recipient_available
  `;
  },
  fetchInteractionRecipient(projectFiscalRid: string, statusRid: string, schemaName: string) {
    return `
    SELECT  key_contact_name,key_contact_email FROM ${schemaName}.key_contact_details WHERE lower(entity_type) = 'project' and include_in_communication is true and entity_rid = '${projectFiscalRid}' and status_rid = '${statusRid}'`;
  },
  fetchInteractionRecipientProject(
    projectFiscalRid: string,
    statusRid: string,
    schemaName: string
  ) {
    return `
    SELECT  key_contact_name,key_contact_email FROM ${schemaName}.key_contact_details WHERE lower(entity_type) = 'project' and interaction_cc_recipient is true and entity_rid = '${projectFiscalRid}' and status_rid = '${statusRid}'`;
  },
  fetchInteractionRecipientAccount(accountRid: string,statusRid:string,schemaName: string) {
    return `
    SELECT  key_contact_name,key_contact_email FROM ${schemaName}.key_contact_details WHERE lower(entity_type) = 'account' and include_in_communication is true and entity_rid = '${accountRid}' and status_rid = '${statusRid}'`;
  },
  fetchRemainderEmailInfo(interactionRid: string, schemaName: string) {
    return `
    SELECT recipient_name, recipient_email FROM ${schemaName}.interactions WHERE rid = '${interactionRid}' `
  },
  fetchisAutoSendEnabled(projectFiscalRid: string, schemaName: string) {
    return `
    SELECT auto_send_ai_interaction FROM ${schemaName}.project_fiscal WHERE rid = '${projectFiscalRid}' LIMIT 1`;
  },
  fetchisAutoTriggerEnabled(projectFiscalRid: string, schemaName: string) {
    return `
    SELECT auto_access_rd FROM ${schemaName}.project_fiscal WHERE rid = '${projectFiscalRid}' LIMIT 1`;
  },

  fetchInteractionStatusList(whereClause: string) {
    return `
    SELECT rid, status_name,status_type FROM ${MAIN_SCHEMA_NAME}.interaction_status WHERE ${whereClause} ORDER BY status_name ASC`;
  },
  fetchUserEmail(userId: string) {
    return `
    SELECT email FROM ${MAIN_SCHEMA_NAME}.user WHERE rid = '${userId}' LIMIT 1`;
  },
  fetchInteractionType(type: string) {
    return `
    SELECT rid FROM ${MAIN_SCHEMA_NAME}.interaction_type WHERE interaction_type_name = '${type}' LIMIT 1`;
  },
   fetchInteractionLevelRidByName(type: string) {
    return `
    SELECT rid FROM ${MAIN_SCHEMA_NAME}.interaction_level WHERE interaction_level_name = '${type}' LIMIT 1`;
  },
  fetchAllParentRNumber() {
    let query = `SELECT r_number FROM ${MAIN_SCHEMA_NAME}.account WHERE storage_type = '${STATUS_MESSAGE.separateDb}' AND parent_account_rid IS NULL
    ORDER BY r_number ASC`;
    return query;
  },
  fetchEmailResponseSourceRid(): string {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.interaction_response_source WHERE response_source_name = 'Email'`;
  },
  fetchInteractionSummaryById(): string {
    return `
      SELECT rid, r_number, account_rid, interaction_rid
      FROM ${MAIN_SCHEMA_NAME}.interactions_summary
      WHERE interaction_rid = :interaction_rid
    `;
  },
  fetchKeyContactsByEntityRid(schemaName: string): string {
    return `
      SELECT rid, key_contact_role, key_contact_email
      FROM "${schemaName}".key_contact_details
      WHERE entity_rid = :entity_rid
    `;
  },
  fetchRolesByIds(): string {
    return `
      SELECT rid, role_name
      FROM "${MAIN_SCHEMA_NAME}".key_contact_role
      WHERE rid IN (:roleIds)
    `;
  },
  fetchUserProfileId(): string {
    return `
      SELECT profile_rid FROM ${MAIN_SCHEMA_NAME}.user WHERE rid = :userId LIMIT 1;
    `;
  },
  fetchProfilePermissions(): string {
    return `
      SELECT pf.field_desc, pf.field_name, pfa.read, pfa.edit
      FROM ${MAIN_SCHEMA_NAME}.profile_fields_access pfa
      JOIN ${MAIN_SCHEMA_NAME}.permission_fields pf ON pfa.permission_field_id = pf.rid
      JOIN ${MAIN_SCHEMA_NAME}.module_permission mp ON pf.module_permission_id = mp.rid
        WHERE mp.permission_name = :permissionName
          AND pfa.profile_id = :profileId
        `;
  },
  fetchUserPermissions(): string {
    return `
      SELECT pf.field_desc, pf.field_name, ufa.read, ufa.edit
      FROM ${MAIN_SCHEMA_NAME}.user_fields_access ufa
      JOIN ${MAIN_SCHEMA_NAME}.permission_fields pf ON ufa.permission_field_id = pf.rid
      JOIN ${MAIN_SCHEMA_NAME}.module_permission mp ON pf.module_permission_id = mp.rid
      WHERE mp.permission_name = :permissionName
        AND ufa.user_id = :userId
    `;
  },
  fetchAccountBySubscriptionId(): string {
    return `
      SELECT rid, r_number from ${MAIN_SCHEMA_NAME}.account
      WHERE subscription_id = :subscriptionId
    `;
  },
  fetchAccountDetailsById(schemaName: string): string {
    return `
      SELECT rid, support_email, tenant_id, client_id, client_secret, subscription_created from ${schemaName}.account_details
      WHERE account_rid = :accountId
    `;
  },
  fetchPlatformSettings(): string {
    return `
      SELECT rid, email from ${MAIN_SCHEMA_NAME}.organization_licenses
    `;
  },
  fetchActiveStatusByType(type: string): string {
    return `
      SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_name = '${type}' AND status = 'active' LIMIT 1
    `;
  },
  generate_rid()
  {
    return `SELECT '${ENV_PREFIX}' || gen_random_uuid() as rid`;
  },

  fetchAllStatus(): string {
    return `
      SELECT rid, status_name, status
      FROM ${MAIN_SCHEMA_NAME}.status
    `;
  },
  fetchStatus(statusIds: any): string {
    let ids = statusIds.map((d: any) => `'${d}'`);
    return `
    SELECT rid, status_name as name FROM ${MAIN_SCHEMA_NAME}.status WHERE rid IN (${ids})`;
  },
  fetchProjectFiscal(projectFiscalId: string, schemaName: string) {
    return `
    SELECT * FROM ${schemaName}.project_fiscal WHERE rid = '${projectFiscalId}'`;
  },
  fetchInteractionDetailsById(schemaName: string, interactionId: string): string {
    return `
      SELECT rid, interaction_level_rid from ${schemaName}.interactions
      WHERE rid = '${interactionId}'
    `;
  },
  fetchParentAccountforEmail : `SELECT * FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = :rid`,
  fetchInteractionTemplates :  `
    SELECT 
        it.rid,
        it.r_number,
        it.template_name,
        it.interaction_type_rid,
        itype.interaction_type_name,
        it.interaction_level_rid,
        il.interaction_level_name,
        it.status_rid,
        s.status_name AS status_name,
        it.created_by,
        it.modified_by,
        it.created_datetime,
        it.modified_datetime
    FROM 
        trd365.interaction_templates it
    LEFT JOIN 
        trd365.interaction_level il ON it.interaction_level_rid = il.rid
    LEFT JOIN 
        trd365.status s ON it.status_rid = s.rid
     LEFT JOIN 
        trd365.interaction_type itype ON it.interaction_type_rid = itype.rid
    WHERE 
        it.rid = :interactionRid;
  `,
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
  fetchUserGroupType: `
      SELECT type group_type
      FROM ${MAIN_SCHEMA_NAME}.user_groups ug
      JOIN ${MAIN_SCHEMA_NAME}.user_group_mapping ugm ON ug.rid = ugm.group_rid 
      JOIN ${MAIN_SCHEMA_NAME}.user_group_type ugt ON ugt.rid = ug.group_type_rid
      WHERE ugm.user_rid = :userRid
      LIMIT 1`,
  fetchDirectAccountAccess: `
      SELECT 
        ugea.entity_rid,
        a.parent_account_rid,
        CASE WHEN a.parent_account_rid IS NULL THEN false ELSE true END as is_child
      FROM ${MAIN_SCHEMA_NAME}.user_group_entity_access ugea
      LEFT JOIN ${MAIN_SCHEMA_NAME}.account a ON ugea.entity_rid = a.rid
      WHERE ugea.user_rid = :userRid 
        AND ugea.entity_type = 'ACCOUNT'
        AND ugea.access_type = 'INCLUDE'
      `,
  fetchGroupAccountAccess: `
      WITH user_groups AS (
        SELECT group_rid FROM ${MAIN_SCHEMA_NAME}.user_group_mapping
        WHERE user_rid = :userRid
      )
      SELECT DISTINCT 
        gea.entity_rid,
        a.parent_account_rid,
        CASE WHEN a.parent_account_rid IS NULL THEN false ELSE true END as is_child
      FROM ${MAIN_SCHEMA_NAME}.user_group_entity_access gea
      JOIN user_groups ug ON gea.group_rid = ug.group_rid
      LEFT JOIN ${MAIN_SCHEMA_NAME}.account a ON gea.entity_rid = a.rid
      WHERE gea.entity_type = 'ACCOUNT'
        AND gea.access_type = 'INCLUDE'
      `,
  fetchUserProfileInfo: `
      SELECT p.profile_name, u.email
      FROM ${MAIN_SCHEMA_NAME}.user u
      JOIN ${MAIN_SCHEMA_NAME}.profile p ON u.profile_rid = p.rid 
      WHERE u.rid = :userRid
      LIMIT 1
      `,
  fetchEmailInfo: `SELECT * FROM ${MAIN_SCHEMA_NAME}.send_email_info WHERE is_email_send = false ORDER BY created_datetime ASC LIMIT ${sendEmailCount}`,
  updateInteractionStatus(schemaName : string, statusRid : string, interactionRid : string) {
    return `UPDATE ${schemaName}.interactions SET status_rid = '${statusRid}' WHERE rid = '${interactionRid}'`
  },
  updateInteractionStatusAndResEmailName(schemaName : string, statusRid : string, interactionRid : string, email : string, name : string) {
    return `UPDATE ${schemaName}.interactions SET status_rid = '${statusRid}', recipient_name = '${name}', recipient_email = '${email}' WHERE rid = '${interactionRid}'`
  },
  fetchInteractionQueueStatus() {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.interaction_status WHERE status_name ILIKE '%In-Queue%'`
  },
  updateInteractionSummaryStatus(statusRid : string, interactionRid : string) {
    return `UPDATE ${MAIN_SCHEMA_NAME}.interactions_summary SET status_rid = '${statusRid}' WHERE interaction_rid = '${interactionRid}'`
  },
  updateInteractionSummaryStatusAndResEmailName(statusRid : string, interactionRid : string, name : string, email : string) {
    return `UPDATE ${MAIN_SCHEMA_NAME}.interactions_summary SET status_rid = '${statusRid}', recipient_name = '${name}', recipient_email = '${email}' WHERE interaction_rid = '${interactionRid}'`
  },
  fetchOrganizationSettings(): string {
    return `
      SELECT * from ${MAIN_SCHEMA_NAME}.organization_licenses
    `;
  },
  fetchAccountRnumber (account_rid : string) {
    return `SELECT account_name , r_number FROM ${MAIN_SCHEMA_NAME}.account where rid = '${account_rid}'`
  },
  fetchKeyContactForInteraction(schemaName : string, id : string) {
    return `SELECT key_contact_name, key_contact_email FROM ${schemaName}.key_contact_details where entity_rid = '${id}' AND include_in_communication = TRUE`
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
    interaction_iteration : "number",
    account_name : "string",
    project_code : "string",
    fiscal_year : "number",
    response_source_rid : "string",
    parent_interaction_rid:"string",
    createdAt:"datetime",
  }

  export const filtersColumnsForInteractionSummary : Record<string, string> =
  {
    r_number : "r_number",
    iteration : "interaction_iteration",
    interaction_age : "interaction_age",
    recipient_name : "recipient_name",
    recipient_email : "recipient_email",
    last_resent_on : "sent_on_datetime",
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
    interaction_iteration : "interaction_iteration",
    account_name : "account_name",
    project_code : "project_code",
    fiscal_year : "fiscal_year",
    response_source_rid : "response_source_rid",
    response_source_name : "response_source_name",
    parent_interaction_rid:"parent_interaction_rid",
    createdAt:"createdAt"
  }

  export const responseSortKeys = ["r_number","response_by", "response_on","response_email","interaction_response", "interaction_version"]
  export const blobUrlExpiration = 60

  export const filterTypesForIntHistory : Record<string, string> = {
    status_rid : "string",
    date : "datetime"
  }

  export const interactionTypes = [
    "qre",
    "interaction",
    "tech_summary"
  ]

  export const interactionFieldMappings = [
    { permissionField: 'r_number', exportField: 'Interaction ID', dataField: 'r_number' },
     { permissionField: 'interaction_age', exportField: 'Age (Days)', dataField: 'interaction_age' },
    { permissionField: 'status', exportField: 'Status', dataField: 'status_name' },
    { permissionField: 'recipient_name', exportField: 'Recipient Name', dataField: 'recipient_name' },
    { permissionField: 'recipient_email', exportField: 'Recipient Email', dataField: 'recipient_email' },
    { permissionField: 'last_resent_on', exportField: 'Last Sent Date', dataField: 'last_resent_on' },
    { permissionField: 'last_reminder_on', exportField: 'Last Reminder Date', dataField: 'last_reminder_on' },
    { permissionField: 'response_submitted_on', exportField: 'Response Date', dataField: 'response_submitted_on' },
    { permissionField: 'response_updated_on', exportField: 'Last Response Update', dataField: 'response_updated_on' },
    { permissionField: 'attachment_count', exportField: 'Attachments', dataField: 'attachment_count' },
    { permissionField: 'interaction_url', exportField: 'Interaction Link', dataField: 'interaction_url' },
    { permissionField: 'interaction_type_name', exportField: 'Type', dataField: 'interaction_type_name' },
    { permissionField: 'response_source_name', exportField: 'Response Source', dataField: 'response_source_name' },
    { permissionField: 'created_by', exportField: 'Created By', dataField: 'created_by' },
    { permissionField: 'created_datetime', exportField: 'Created Date', dataField: 'created_datetime' },
    { permissionField: 'modified_by', exportField: 'Last Updated By', dataField: 'modified_by' },
    { permissionField: 'modified_datetime', exportField: 'Last Updated Date', dataField: 'modified_datetime' }
  ];
    export const templateFieldMappings = [
    { permissionField: 'r_number', exportField: 'Template ID', dataField: 'r_number' },
    { permissionField: 'template_name', exportField: 'Template Name', dataField: 'template_name' },
    { permissionField: 'interaction_level_name', exportField: 'Interaction Level', dataField: 'interaction_level_name' },
    { permissionField: 'interaction_type_name', exportField: 'Type', dataField: 'interaction_type_name' },
    { permissionField: 'created_by', exportField: 'Created By', dataField: 'created_by' },
    { permissionField: 'created_datetime', exportField: 'Created On', dataField: 'created_datetime' },
    { permissionField: 'modified_by', exportField: 'Updated By', dataField: 'modified_by' },
    { permissionField: 'modified_datetime', exportField: 'Updated On', dataField: 'modified_datetime' },
    { permissionField: 'status_name', exportField: 'Status', dataField: 'status_name' },
  ];

   export const accountinteractionFieldMappings = [
    { permissionField: 'r_number', exportField: 'Interaction ID', dataField: 'r_number' },
    { permissionField: 'project_code', exportField: 'Project Code', dataField: 'project_code' },
     { permissionField: 'interaction_level_name', exportField: 'Interaction Level', dataField: 'interaction_level_name' },
       { permissionField: 'fiscal_year', exportField: 'Fiscal Year', dataField: 'fiscal_year' },
     { permissionField: 'interaction_age', exportField: 'Age (Days)', dataField: 'interaction_age' },
    { permissionField: 'status', exportField: 'Status', dataField: 'status_name' },
    { permissionField: 'recipient_name', exportField: 'Recipient Name', dataField: 'recipient_name' },
    { permissionField: 'recipient_email', exportField: 'Recipient Email', dataField: 'recipient_email' },
    { permissionField: 'last_resent_on', exportField: 'Last Sent Date', dataField: 'last_resent_on' },
    { permissionField: 'last_reminder_on', exportField: 'Last Reminder Date', dataField: 'last_reminder_on' },
    { permissionField: 'response_submitted_on', exportField: 'Response Date', dataField: 'response_submitted_on' },
    { permissionField: 'response_updated_on', exportField: 'Last Response Update', dataField: 'response_updated_on' },
    { permissionField: 'attachment_count', exportField: 'Attachments', dataField: 'attachment_count' },
    { permissionField: 'interaction_url', exportField: 'Interaction Link', dataField: 'interaction_url' },
    { permissionField: 'interaction_type_name', exportField: 'Type', dataField: 'interaction_type_name' },
    { permissionField: 'response_source_name', exportField: 'Response Source', dataField: 'response_source_name' },
    { permissionField: 'created_by', exportField: 'Created By', dataField: 'created_by' },
    { permissionField: 'created_datetime', exportField: 'Created Date', dataField: 'created_datetime' },
    { permissionField: 'modified_by', exportField: 'Last Updated By', dataField: 'modified_by' },
    { permissionField: 'modified_datetime', exportField: 'Last Updated Date', dataField: 'modified_datetime' }
  ];

   export const techSummaryFieldMappings = [
     
    { permissionField: 'r_number', exportField: 'Sequence Number', dataField: 'r_number' },
    { permissionField: 'version', exportField: 'Summary Version', dataField: 'version' },
    { permissionField: 'created_by', exportField: 'Created By', dataField: 'created_by' },
    { permissionField: 'created_datetime', exportField: 'Created On', dataField: 'created_datetime' },
    { permissionField: 'modified_by', exportField: 'Updated By', dataField: 'modified_by' },
    { permissionField: 'modified_datetime', exportField: 'Updated On', dataField: 'modified_datetime' }
   
  ];


  export const schedulerStatus = {
    Success : "success",
    Failed : "failed",
    Running : "running"
  }

  export const interactionTaskName = {
    interactionAge : "interaction_age",
    interaction : "interactions",
    attachments : "attachments"
  }