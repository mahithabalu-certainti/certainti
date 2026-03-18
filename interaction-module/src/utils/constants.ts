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
export const interactionAssessmentSourceType = {
  RD: "RD Assessment",
  FPA: "Four Part Assessment",
};

export const ENV_PREFIX = process.env.NODE_ENV_DB_PREFIX || 'D001-';
export const MAIN_SCHEMA_NAME = "trd365";
export const SCHEMANAME_PREFIX = "trd365_";

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
export const entityTypes = {
  ACCOUNT: "Account",
  PROJECT: "Project",
  RESOURCE: "Resource",
  PROJECT_TASK: "Project Task",
  NOTES: "Notes",
  ATTACHMENT: "Attachment",
  PROJECT_RESOURCE: "Project Resource",
  ACTIVITY_CALL:"Call",
  ACTIVITY_MEETING:"Meeting",
  ACTIVITY_EMAIL:"Email",
  ACTIVITY_TASK:"Task",
  CHECKLIST:"Checklist",
  CASE:"Case",
  INTERACTION:"Interaction",
  AUTO_RD_ASSESSMENT:"Auto RD Assessment",
  MANUAL_RD_ASSESSMENT:"Manual RD Assessment",
  SCHEDULER_RD_ASSESSMENT:"Scheduler RD Assessment",
  TECHNICAL_SUMMARY:"Technical Summary",
  QRE_PERCENT:"QRE Percent"

};

export const eventNames = {
  CREATE: "created",
  UPDATE: "updated",
  CANCEL: "cancelled",
  SENT: "sent",
  REMAINDER: "remainder sent",
  REINITIATED: "reinitiated",
  TRIGGERED: "triggered",
  GENERATED: "generated",
}

export const eventTypes = {
   UI_HANDLER: "web",
}
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
    project_name : "project_name",
    fiscal_year : "fiscal_year",
    response_source_rid : "response_source_rid",
    interaction_level_rid:"interaction_level_rid",
    parent_interaction_rid : "parent_interaction_rid",
    createdAt : "createdAt",
    template_name : "template_name",
    interaction_assessment_source_rid : "interaction_assessment_source_rid",
    interaction_batch_id : "interaction_batch_id",
    four_part_r_number : "four_part_r_number"
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
    project_name : "string",
    fiscal_year : "number",
    response_source_rid : "string",
    parent_interaction_rid:"string",
    interaction_level_rid:"string",
    createdAt:"datetime",
    template_name : "string",
    created_user_name : "string",
    modified_user_name : "string",
    interaction_assessment_source_rid : "string",
    interaction_batch_id : "string",
    four_part_r_number : "string"
  }

  export const ALPHANUMERIC_CONDITIONS : Record <string, string> = {
  equals: "equals",
  notEquals: "not_equals",
  contains: "contains",
  is_empty: "is_empty",
  in: "in",
  less_than: "less_than",
  greater_than: "greater_than",
  between: "between",
  before: "before",
  after: "after",
};

export const interactionFlag = {
  account : "account",
  project : "project",
  case : "case"
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
  modified_user_name:"modified_user_name",
  project_name : "project_name",
  project_code : "project_code",
  interaction_assessment_source_name : "interaction_assessment_source_name"
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
  fourPartListSuccess : "FourPart Assessment fetched successfully",
  assessmentFetchedSuccess : "Interaction Assessment Fetched successfully"
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
  fetchStatusNameForInteractions(data: any) {
    let ids: string[];
    if (Array.isArray(data)) {
      ids = data.map((d: any) => `'${d}'`);
    } else if (typeof data === "string") {
      ids = [`'${data}'`];
    } else {
      ids = [];
    }
    return `
    SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.status WHERE rid IN (${ids})`;
  },

  fetchInteractionAssessmentSource(data: any) {
    let ids: string[];
    if (Array.isArray(data)) {
      ids = data.map((d: any) => `'${d}'`);
    } else if (typeof data === "string") {
      ids = [`'${data}'`];
    } else {
      ids = [];
    }
    return `
    SELECT rid, interaction_assessment_source_name  FROM ${MAIN_SCHEMA_NAME}.interaction_assessment_source WHERE rid IN (${ids})`;
  },
   fetchInteractionAllAssessmentSource() {
    return `SELECT rid, interaction_assessment_source_name FROM ${MAIN_SCHEMA_NAME}.interaction_assessment_source`;
  },

  fetchActiveStatus() {
    return `
    SELECT rid, status_name, status FROM ${MAIN_SCHEMA_NAME}.status WHERE status_name ILIKE '%Active%' limit 1`;
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
  fetchProjectTypeNames(ids: string[]) {
    console.log(ids);
      return `SELECT project_type_name FROM ${MAIN_SCHEMA_NAME}.project_type WHERE rid IN (${ids})`;
    },
  fetchKeyContactsByCaseId(caseRid: string, schemaName: string) {
  return `
    SELECT 
      a.project_fiscal_rid, 
      b.project_code, 
      b.project_name, 
      c.key_contact_name, 
      c.key_contact_email
    FROM ${schemaName}.case_projects as a
    LEFT JOIN ${schemaName}.project_fiscal as b
      ON a.project_fiscal_rid = b.rid
    LEFT JOIN ${schemaName}.key_contact_details as c
      ON b.rid = c.entity_rid
    WHERE 
    a.case_rid = '${caseRid}'
    AND
    c.include_in_communication = TRUE
  `;
  },
 fetchProjectsByAccount(
  accountRid: string,
  schemaName: string,
  status_rid: string,
  fiscalStart: string,
  fiscalEnd: string,
  groupedProjectTypes?: Record<string, string[]>
) {
  let query = `
    SELECT DISTINCT
      pf.rid,
      pf.project_rid,
      pf.project_type_rid,
      pf.fiscal_year
    FROM ${schemaName}.project_fiscal pf
  `;
  // Parse MM/DD for fiscalStart and fiscalEnd
  const [startMM, startDD] = fiscalStart.split('/').map(Number);
  const [endMM, endDD] = fiscalEnd.split('/').map(Number);

  if (groupedProjectTypes && Object.keys(groupedProjectTypes).length > 0) {
    const values = Object.entries(groupedProjectTypes)
      .flatMap(([key, typeRids]) => {
        const [start, end] = key.split('_');
        return typeRids.map(pt => 
          `(DATE '${start}', DATE '${end}', '${pt}')`
        );
      })
      .join(',\n');

    query += `
      JOIN (
        VALUES
          ${values}
      ) AS ir(range_start, range_end, project_type_rid)
        ON pf.project_type_rid = ir.project_type_rid
       AND ir.range_start <= make_date(pf.fiscal_year, ${endMM}, ${endDD})
       AND ir.range_end   >= make_date(pf.fiscal_year - 1, ${startMM}, ${startDD})
    `;
  }

  query += `
    WHERE pf.account_rid = '${accountRid}'
      AND pf.status_rid  = '${status_rid}'
      AND (pf.is_rd_claim_qualified = false or pf.is_rd_claim_qualified is null)
  `;

  return query;
}
,
  fetchProjectsByCase(caseRid: string, schemaName: string) {
    return `
    SELECT a.project_fiscal_rid FROM ${schemaName}.case_projects as a WHERE a.case_rid = '${caseRid}'
    `
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
    SELECT rid, account_name,r_number,parent_account_rid,country_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${rid}'`;
  },
  fetchPlatformConfig(rid: string,formattedStartDate: string,formattedEndDate:string) {
    return `
    SELECT config_json,,effective_start_date,effective_end_date  FROM ${MAIN_SCHEMA_NAME}.rd_credit_parameter_values rv
    join ${MAIN_SCHEMA_NAME}.rd_credit_config_group rg on  rv.credit_config_group_rid  = rg.rid
    where rg.country_rid = '${rid}'
    AND credit_program_name = 'Platform Configuration'
    AND rg.is_federal = true 
    AND rv.effective_start_date <= '${formattedEndDate}'
    AND rv.effective_end_date   >= '${formattedStartDate}'
    AND rv.status_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_description = 'active')
  ORDER BY rv.effective_start_date DESC
  LIMIT 1`;
  },
   fetchAllPlatformConfig(rid: string) {
    return `
    SELECT config_json,effective_start_date,effective_end_date  FROM ${MAIN_SCHEMA_NAME}.rd_credit_parameter_values rv
    join ${MAIN_SCHEMA_NAME}.rd_credit_config_group rg on  rv.credit_config_group_rid  = rg.rid
    where rg.country_rid = '${rid}'
    AND credit_program_name = 'Platform Configuration'
    AND rg.is_federal = true 
    AND rv.status_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_description = 'active')
  ORDER BY rv.effective_start_date DESC `;
  },
  fetchProjectTypeRid(projectType: string | string[]) {
    // Accepts either a string or array of strings
    let condition = "";
    if (Array.isArray(projectType)) {
      const types = projectType.map(pt => `'${pt.replace(/'/g, "''")}'`).join(",");
      condition = `lower(project_type_name) IN (${types.toLowerCase()})`;
    } else {
      condition = `lower(project_type_name) = lower('${projectType.replace(/'/g, "''")}')`;
    }
    return `
      select rid from trd365.project_type where ${condition}`;
  },
   fetchAccountDetailsInfo(rid: string,schemaName: string) {
    return `
    SELECT rid, fiscal_start_date,fiscal_end_date,autosend_interaction,max_ai_interactions FROM ${schemaName}.account_details WHERE account_rid = '${rid}'`;
  },
   fetchUserAndEventInfo() {
    return `
      SELECT
        (SELECT CONCAT(first_name, ' ', last_name) as full_name FROM trd365.user WHERE rid = :userId LIMIT 1) AS full_name,
        (SELECT rid FROM trd365.event_types WHERE event_type_name = :eventType LIMIT 1) AS event_type_rid
    `;
  },
  insertTimeLine(schemaName: string,tableName: string)
  {
   return  `
          INSERT INTO "${schemaName}".${tableName} (
            created_by, event_type_rid, event_name, descriptions,account_rid,entity_name,entity_rid,created_by_name
          ) VALUES (
            :created_by,  :event_type_rid, :event_name, :descriptions, :account_rid,:entity_name,:entity_rid,:created_by_name
          )
          RETURNING *;
        ` 
  },
   insertProjectTimeLine(schemaName: string,tableName: string)
  {
   return  `
          INSERT INTO "${schemaName}".${tableName} (
            created_by, event_type_rid, event_name, descriptions,account_rid,entity_name,entity_rid,created_by_name,project_rid
          ) VALUES (
            :created_by,  :event_type_rid, :event_name, :descriptions, :account_rid,:entity_name,:entity_rid,:created_by_name,:project_rid
          )
          RETURNING *;
        ` 
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
  fetchInteractionCCRecipientAccount(accountRid: string,statusRid:string,schemaName: string) {
    return `
    SELECT  key_contact_name,key_contact_email FROM ${schemaName}.key_contact_details WHERE lower(entity_type) = 'account' and (interaction_cc_recipient is true or include_in_communication is true) and entity_rid = '${accountRid}' and status_rid = '${statusRid}'`;
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
    SELECT rid, interaction_level_name FROM ${MAIN_SCHEMA_NAME}.interaction_level WHERE interaction_level_name = '${type}' LIMIT 1`;
  },
  fetchAllParentRNumber() {
    let query = `SELECT r_number FROM ${MAIN_SCHEMA_NAME}.account WHERE storage_type = '${STATUS_MESSAGE.separateDb}'
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
  fetchProjectFiscalDetails(projectFiscalIds: string[], schemaName: string) {
    return `
    SELECT rid, project_name, project_code, signoff FROM ${schemaName}.project_fiscal WHERE rid IN (${projectFiscalIds.map((d : any) => `'${d}'`).join(',')})`;
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
  fetchEmailInfo: `SELECT * FROM ${MAIN_SCHEMA_NAME}.send_email_info WHERE is_email_sent = false ORDER BY created_datetime ASC LIMIT ${sendEmailCount}`,
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
  },
  fetchProjectsWithoutKeyContacts(schemaName: string, projectFiscalRids: string[]) {
    return `SELECT DISTINCT entity_rid FROM ${schemaName}.key_contact_details 
           WHERE entity_rid IN (${projectFiscalRids.map(rid => `'${rid}'`).join(',')}) 
           AND include_in_communication = TRUE`;
  },
  fetchProfServConsultantDetails (schemaName : string, accountRid : string, keyContactRoleId : string) {
    return `SELECT * FROM ${schemaName}.key_contact_details WHERE entity_rid = '${accountRid}' AND key_contact_role = '${keyContactRoleId}'`
  },
  fetchProfServConsultantRid () {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.key_contact_role WHERE role_name = '${keyContactRoleName.professionalServiceConsultant}'`
  },
  fetchProjectDetails (schemaName : string, projectFiscalRid : string) {
    return `SELECT project_name, project_code, fiscal_year FROM ${schemaName}.project_fiscal
    WHERE rid = '${projectFiscalRid}'`
  },
  fetchInteractionLevelById (interactionLevelRid : string) {
    return `SELECT * FROM ${MAIN_SCHEMA_NAME}.interaction_level WHERE rid = '${interactionLevelRid}'`
  },
  getAccountDetailsQuery(schemaName: string) {
    return `
      SELECT * 
      FROM ${schemaName}.account_details 
      WHERE account_rid = :accountRid
    `;
  },
  getAccountsWithSubscriptionQuery() {
    return `
      SELECT * 
      FROM ${MAIN_SCHEMA_NAME}.account 
      WHERE subscription_id IS NOT NULL
    `;
  },
  getUserNameByIdQuery() {
    return `
      SELECT first_name, middle_name, last_name 
      FROM ${MAIN_SCHEMA_NAME}."user" 
      WHERE rid = :userId
    `;
  },
  getStatusByIdQuery() {
    return `
      SELECT rid, status_name 
      FROM ${MAIN_SCHEMA_NAME}.status 
      WHERE rid = :id
    `;
  },
  getInteractionTypeByIdQuery() {
    return `
      SELECT rid, interaction_type_name 
      FROM ${MAIN_SCHEMA_NAME}.interaction_type 
      WHERE rid = :id
    `;
  },
  getInteractionStatusByIdQuery() {
    return `
      SELECT rid, status_name 
      FROM ${MAIN_SCHEMA_NAME}.interaction_status 
      WHERE rid = :id
    `;
  },
  getInteractionSourceByNameQuery() {
    return `
      SELECT rid, interaction_source_name 
      FROM ${MAIN_SCHEMA_NAME}.interaction_source 
      WHERE interaction_source_name = :type 
      LIMIT 1
    `;
  },
  getInteractionAssessmentSourceByNameQuery() {
    return `
      SELECT rid, interaction_assessment_source_name 
      FROM ${MAIN_SCHEMA_NAME}.interaction_assessment_source 
      WHERE interaction_assessment_source_name = :type 
      LIMIT 1
    `;
  },
  getInteractionLevelNameByIdQuery() {
    return `
      SELECT interaction_level_name 
      FROM ${MAIN_SCHEMA_NAME}.interaction_level 
      WHERE rid = :type 
      LIMIT 1
    `;
  },
  getActiveInteractionTypesQuery() {
    return `
      SELECT rid, interaction_type_name 
      FROM ${MAIN_SCHEMA_NAME}.interaction_type 
      WHERE status = 'active' 
      ORDER BY interaction_type_name ASC
    `;
  },
  getActiveInteractionSourcesQuery() {
    return `
      SELECT rid, interaction_source_name 
      FROM ${MAIN_SCHEMA_NAME}.interaction_source 
      WHERE status = 'active' 
      ORDER BY interaction_source_name ASC
    `;
  },
  getActiveInteractionResponseSourcesQuery() {
    return `
      SELECT rid, response_source_name 
      FROM ${MAIN_SCHEMA_NAME}.interaction_response_source 
      WHERE status = 'active' 
      ORDER BY response_source_name ASC
    `;
  },
  getProjectSummaryWithFiscalAccessQuery(accessControlWhere: any) {
    return `
      SELECT DISTINCT ps.project_rid
      FROM ${MAIN_SCHEMA_NAME}.project_summary AS ps
      LEFT JOIN ${MAIN_SCHEMA_NAME}.project_fiscal_summary AS pfs ON ps.project_rid = pfs.project_rid
      ${accessControlWhere}
    `;
  },
  getAccountByRNumberQuery() {
    return `
      SELECT * 
      FROM ${MAIN_SCHEMA_NAME}.account 
      WHERE r_number = :r_number
    `;
  },
  checkProjectFiscalExistsQuery(schemaName: string) {
    return `
      SELECT 1 
      FROM "${schemaName}".project_fiscal 
      WHERE r_number = :projectId 
      LIMIT 1;
    `;
  },
  checkProjectFiscalByNameExistsQuery(schemaName: string) {
    return `
      SELECT 1 
      FROM "${schemaName}".project_fiscal 
      WHERE project_name = :projectName 
      LIMIT 1;
    `;
  },
  checkProjectFiscalByCodeExistsQuery(schemaName: string) {
    return `
      SELECT 1 
      FROM "${schemaName}".project_fiscal 
      WHERE project_code = :projectCode 
      LIMIT 1;
    `;
  },
  checkProjectFiscalExistsByAnyQuery(schemaName: string) {
    return `
      SELECT 1 
      FROM "${schemaName}".project_fiscal 
      WHERE project_rid = :projectId 
         OR project_name = :projectName 
         OR project_code = :projectCode
      LIMIT 1;
    `;
  },
  getCaseProjectsIds (caseRid : string, accountRid : string, schemaName : string, summaryType? : string) {
    if(summaryType === 'qualifiedProjects') {
      return `SELECT pf.rid AS project_fiscal_rid 
       FROM ${schemaName}.project_fiscal pf
       LEFT JOIN ${schemaName}.case_projects cp ON cp.project_fiscal_rid = pf.rid
       WHERE cp.case_rid = '${caseRid}' AND cp.account_rid = '${accountRid}' AND pf.is_qualified = true`
    } else {
        return `SELECT project_fiscal_rid FROM ${schemaName}.case_projects WHERE case_rid = '${caseRid}' AND account_rid = '${accountRid}'`
    }
  },
  fetchEmailTemplateByCategory (categoryName : string) {
    return `SELECT rid, template_name, subject, body_html FROM ${MAIN_SCHEMA_NAME}.email_template WHERE category_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.email_template_category WHERE lower(category_name) = lower('${categoryName}') LIMIT 1) LIMIT 1`
  },
  fetchInteractionEmailSubject(){
    return `SELECT interaction_email_subject,interaction_remainder_email_subject FROM ${MAIN_SCHEMA_NAME}.organization_licenses LIMIT 1`
   },
     fetchFpaRid (schemaName : string, transactionId : string) {
    return `SELECT rid FROM ${schemaName}.four_part_assessment WHERE transaction_id = '${transactionId}'`
  },
  fetchBatchInInteraction(schemaName : string, accountId : string) {
    return `
    SELECT interaction_batch_id 
    FROM 
    (
    SELECT interaction_batch_id, 
    ROW_NUMBER() OVER(ORDER BY interaction_batch_id DESC) AS rn
    FROM
    ${schemaName}.interactions
    where
    account_rid = '${accountId}'
    AND
	  four_part_assessment_rid IS NOT NULL
    )
    WHERE
    rn = 1
    `
  },
  fetchBatchInInteractionByTransId(schemaName : string, transactionId : string) {
    return `
    SELECT interaction_batch_id 
    FROM
    ${schemaName}.interactions
    WHERE
    transaction_id = '${transactionId}'
    ORDER BY interaction_batch_id DESC
    `
  },
    fetchCaseStatusByType(type: string) {
    return `
    SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.case_status WHERE status_name = '${type}'`;
  },
    fetchCaseInfo(schemaName: string, caseRid: string) {
    return `SELECT rid, r_number, case_name, account_rid, fiscal_year, status_rid FROM ${schemaName}.cases WHERE rid = '${caseRid}' LIMIT 1`;
  },
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
    { permissionField: 'interaction_assessment_source_name', exportField: 'Assessment Type', dataField: 'interaction_assessment_source_name' },
    { permissionField: 'r_number', exportField: 'Four Part Assessment ID', dataField: 'r_number' },
    { permissionField: 'r_number', exportField: 'Four Part Assessment ID', dataField: 'four_part_r_number' },
    { permissionField: 'interaction_batch_id', exportField: 'Batch ID', dataField: 'interaction_batch_id' },
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
  export const fpaFieldMappings = [
    { permissionField: 'r_number', exportField: 'Four Part Assessment ID', dataField: 'r_number' },
    { permissionField: 'project_code', exportField: 'Project Code', dataField: 'project_code' },
    { permissionField: 'rd_potential_category', exportField: 'Rd Potential Category', dataField: 'rd_potential_category' },
    { permissionField: 'permitted_purpose_status', exportField: 'Permitted Purpose', dataField: 'permitted_purpose_status' },
    { permissionField: 'technological_uncertainty_status', exportField: 'Technological Uncertainty', dataField: 'technological_uncertainty_status' },
    { permissionField: 'technological_in_nature_status', exportField: 'Technological In Nature', dataField: 'technological_in_nature_status' },
    { permissionField: 'process_of_experimentation_status', exportField: 'Process Of Experimentation', dataField: 'process_of_experimentation_status' },
    { permissionField: 'status', exportField: 'Status', dataField: 'status' },
    { permissionField: 'created_by', exportField: 'Created By', dataField: 'created_by' },
    { permissionField: 'created_datetime', exportField: 'Created On', dataField: 'created_datetime' }
  ];
    export const templateFieldMappings = [
    { permissionField: 'r_number', exportField: 'Template ID', dataField: 'r_number' },
    { permissionField: 'template_name', exportField: 'Template Name', dataField: 'template_name' },
    { permissionField: 'interaction_level_rid', exportField: 'Interaction Level', dataField: 'interaction_level_rid' },
    { permissionField: 'interaction_type_rid', exportField: 'Type', dataField: 'interaction_type_rid' },
    { permissionField: 'created_by', exportField: 'Created By', dataField: 'created_by' },
    { permissionField: 'created_datetime', exportField: 'Created On', dataField: 'created_datetime' },
    { permissionField: 'modified_by', exportField: 'Updated By', dataField: 'modified_by' },
    { permissionField: 'modified_datetime', exportField: 'Updated On', dataField: 'modified_datetime' },
    { permissionField: 'status_rid', exportField: 'Status', dataField: 'status_rid' },
  ];

   export const accountinteractionFieldMappings = [
    { permissionField: 'r_number', exportField: 'Interaction ID', dataField: 'r_number' },
    { permissionField: 'interaction_assessment_source_name', exportField: 'Assessment Type', dataField: 'interaction_assessment_source_name' },
    { permissionField: 'r_number', exportField: 'Four Part Assessment ID', dataField: 'four_part_r_number' },
    { permissionField: 'interaction_batch_id', exportField: 'Batch ID', dataField: 'interaction_batch_id' },
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
    { permissionField: 'project_code', exportField: 'Project Code', dataField: 'project_code' },
    { permissionField: 'project_name', exportField: 'Project Name', dataField: 'project_name' },
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

   export const interactionTemplateName = {
    interactionProject : "interaction project",
    interactionProjectReminder : "interaction project reminder",
    interactionAccount : "interaction account",
    interactionAccountReminder : "interaction account reminder",
    interactionProjectUpdate : "interaction project update",
    interactionAccountUpdate : "interaction account update"
  }

  export const keyContactRoleName = {
    professionalServiceConsultant : "Professional Services Consultant"
  }

  export const FourPartColumns : Record<string, string> = {
  r_number : 'f.r_number',
  project_code : 'p.project_code',
  rd_potential_category : 'f.rd_potential_category',
  status : 'f.status',
  created_datetime : 'f.created_datetime',
  modified_datetime : 'f.modified_datetime',
  permitted_purpose_status : 'f.permitted_purpose_status',
  technological_uncertainty_status : 'f.technological_uncertainty_status',
  technological_in_nature_status : 'f.technological_in_nature_status',
  process_of_experimentation_status : 'f.process_of_experimentation_status',
  summary_judgment : 'f.summary_judgment'
}

export const FourPartColumnsTypes : Record<string, string> = {
  r_number : 'string',
  project_code : 'string',
  rd_potential_category : 'string',
  status : 'string',
  created_datetime : 'date',
  modified_datetime : 'date',
  permitted_purpose_status : 'string',
  technological_uncertainty_status : 'string',
  technological_in_nature_status : 'string',
  process_of_experimentation_status : 'string',
  summary_judgment : 'string'
}

export const MainTableFilter : Record<string, string> = {
  created_by_name : 'created_by_name',
  modified_by_name : 'modified_by_name'
}