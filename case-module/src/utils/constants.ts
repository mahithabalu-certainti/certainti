import { Sequelize } from "sequelize";
import { CaseTaskWorkflowConnector } from "../models/caseTaskWorkflowConnectorModel";
import { WorkflowConnectorMapping } from "../models/workflowConnectorMapModel";

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

export const ENV_PREFIX = process.env.NODE_ENV_DB_PREFIX || "D001-";
export const MAIN_SCHEMA_NAME = "trd365";
export const SCHEMANAME_PREFIX = "trd365_";

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

export const NODE_ENV = {
  DEV: "DEV",
  PROD: "PRODUCTION",
};

export const ALPHANUMERIC_CONDITIONS = {
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

export const mainTableFilters: Record<any, any> = {
  created_user_name: "created_user_name",
  updated_user_name: "updated_user_name",
  status_name: "status_name",
  modified_by: "modified_by",
  modified_user_name: "modified_user_name",
  filing_type_name: "filing_type_name",
  case_owner_name: "case_owner_name",
  case_name: "case_full_name",
  industry_name: "industry_name",
  project_classification_name: "project_classification_name",
  project_type_name: "project_type_name",
};

export const STATUS_MESSAGE = {
  caseCreated: "Case created successfully",
  caseTeamCreated: "Case team updated successfully",
  caseUpdated: "Case updated successfully",
  caseUpdateFailed: "Case update failed",
  caseCreationFailed: "Case creation failed",
  caseTeamCreationFailed: "Case team creation failed",
  separateDb: "separate_db",
  caseDetailsFetchedSuccess: "Case details fetched successfully",
  dataNotAvailable: "Data not available",
  projectsFetchedSuccess: "Project fetched successfully",
  singleProjectAssignedSuccess: "Project assigned successfully",
  multipleProjectAssignedSuccess: "Projects assigned successfully",
  projectAssignFailed: "Project assign failed",
  projectAlreadyMapped: "Project already mapped to this case",
  singleProjectDeletedSuccess: "Project deleted successfully",
  multipleProjectDeletedSuccess: "Projects deleted successfully",
  projectNotAssigned: "Requested project not found",
  caseIdMissing: "Case ID is required",
  countryValidationFailed:
    "Country is not associated with the account,Please select country",
  adminChecklistCreated: "Checklist created successfully",
  adminChecklistFailed: "Checklist creation failed",
  emailCreatedSuccess: "Email Template created successfully",
  emailCreationFailed: "Email Template creation failed",
  emailUpdatedSuccess: "Email Template updated successfully",
  emailUpdateFailed: "Email Template update failed",
  accountIdMissing: "Account RID mising",
  invalidJurisdictionLevel: "Level must be either 'state' or 'federal'.",
  statesMissing: "States array is required when level is 'state'.",
  invalidStatesArray: "All states must be valid non-empty strings.",
  userIdMissingInHeader: "User ID is missing in request header.",
  jurisdictionAddedSuccess: "Jurisdiction configuration added successfully",
  jurisdictionAddedFailed: "Jurisdiction configuration addition failed",
  taskNameExistsAlready: "Task name already exists",
  taskCreatedSuccess: "Task Template created successfully",
  casePrioritySuccess: "Priority fetched successfully",
  milestonesSuccess: "Milestones fetched successfully",
  checklistSuccess: "Checklist fetched successfully",
  taskUpdatedSuccess: "Task Template updated successfully",
  taskUpdateFailed: "Task Template updation failed",
  taskTemplateSuccess: "Task Template fetched successfully",
  taskTemplateExport: "Task Template export successfully",
  checkListError: "Checklist retrieval failed",
  jurisdictionFetchedSuccess: "Jurisdiction configuration fetched successfully",
  jurisdictionFetchedFailed: "Failed to fetch jurisdiction configuration",
  jurisdictionNotFound: "No jurisdiction configuration found for this case",
  taskTypeFetchedSuccess: "Task Type fetched successfully",
  checkListNotFound: "Checklist not found",
  checkListNotFoundError: "Checklist with the provided RID does not exist",
  caseBreakdownSuccess: "Work Breakdown fetched successfully",
  userLevelTaskCreatedSuccess: "Task created successfully",
  userLevelTaskUpdatedSuccess: "Task updated successfully",
  taskCreateFailed: "Task creation failed",
  accountNotFound: "Account not found",
  caseNotFound: "Case not found",
  taskNotFound: "Task not founds",
  taskUpdatedFailed: "Task updation failed",
  userLevelTaskFetchSuccess: "Task fetched successfully",
  tagsCreatedSuccesfully: "Tags added successfully",
  tagMappedAlready: "Tag already added",
  tagsListedSuccess: "Tags listed successfully",
  tagDeletedSuccess: "Tag deleted successfully",
  tagRequired: "Atleast one tag is required to delete",
  multipleTagDeletedSuccess: "Tags deleted successfully",
  tagDeletionFailed: "Tag deletion failed",
  commentsAddedSuccess: "Comments added successfully",
  commentsFailed: "Failed to create comments",
  taskExportedSuccess: "Case Task exported successfully",
  commentsUpdatedSuccess: "Comments updated successfully",
  commentsFailedUpdate: "Failed to update comments",
  commentsDeletedSuccess: "Comments deleted successfully",
  commentsFaileDDelete: "Failed to delete comments",
  commentsFetchedSuccess: "Task Comments fetched successfully",
  historicalSubmissionCreated: "Historical submission created successfully",
  historicalSubmissionCreationFailed: "Historical submission creation failed",
  fileNotFound: "No file attached",
  attachmentUploadedSuccess: "Attachment uploaded successfully",
  attachmentDeletedSuccess: "Attachment deleted successfully",
  attachmentDeleteFailed: "Attachment deletion failed",
  attachmentNotFound: "Attachment not found",
  attachementTaskListSuccess: "Task Attachments fetched successfully",
  categoryPlaceHolderSuccess: "Placeholders fetched successfully",
  categoryPlaceHolderFailed: "Failed to fetch Placeholders",
  activitiesFetchedSuccess: "Task Activities fetched successfully",
  detailFetchedFailed: "Failed to fetch details",
  casePriorityListedSuccess: "Case Task Priority fetched successfully",
  caseTaskStatusListedSuccess: "Case Task Status fetched successfully",
  collaboratorAlreadyAdded: "Requested Collaborator already added",
  collaboratorsAddedSuccesss: "Collaborator added successfully",
  collaboratorsRemovedSuccesss: "Collaborator removed successfully",
  collaboratorAddedFailed: "Failed to add collaborator",
  collaboratorRemovedFailed: "Failed to remove collaborator",
  collaboratorsListedSuccess: "Collaborators fetched successfully",
  workflowConnectorListSuccess: "Workflow Connector listed successfully",
  dataAlreadyMapped: "Requested data already mapped",
  workflowConnectorMappedSuccess: "Task linked successfully",
  workflowConnectorMappedFailed: "Task linking failed",
  workflowConnectorMappedDeleted: "Linked Task deleted successfully",
  workflowConnectorMappedDeletedFailed: "Failed to link task",
  caseTaskFetchedSuccess: "Case Task fetched successfully",
  tagsCreationFailed: "Failed to add Tags",
  checklistItemsStatusSuccess: "Checklist-Item updated successfully",
  failedToUpdate: "Failed to update",
  activityCreated: "Activity created successfully",
  activityCreationFailed: "Activity creation failed",
  activityUpdated: "Activity updated successfully",
  activityUpdateFailed: "Activity update failed",
  taskWeightageListSuccess: "Task Weightage fetched successfully",
  emailTemplatePreviewSuccess: "Email template preview generated successfully",
  emailTemplatePreviewFailed: "Failed to generate email template preview",
  emailSentSuccessfully: "Email sent successfully",
  emailSendingFailed: "Failed to send email",
  taskCategoryListedSuccess: "Task Category fetched successfully",
  caseDateChangeNotAllowed: "Date changes are not allowed after case tasks transition to In Progress.",
  fiscalIdMissing: "Project Resource RID is required",
  projectIdMissing: "Project RID is required",
  noDataToUpdate: "No data provided to update",
  accountNoFound: "Account not found",
  projectTaskNotFound: "Project Task not found",
  resourceNotFound: "Resource not found",
  startDateLessThanEndDate: "Start date must be less than end date",
  effort24HrsExceeded: "Effort cannot exceed 24 hours for the day",
  projectTaskUpdatedSuccess: "Project task details updated successfully",
  configNotAvailable: "Configuration not available for the selected criteria",
  technicalDocumentationSignedOff : "Technical documentation has been successfully signed off",
  technicalDocsAlreadySignedOff : "Technical documentation is already signed off",
  signoffNotAllowed : "Sign-off cannot be reverted. Approval is required to proceed",
  configCreatedSuccess: "Configuration created successfully",
  configUpdatedSuccess: "Configuration updated successfully",
  configCreationFailed: "Configuration creation failed",
  configUpdateFailed: "Configuration update failed",
  rdCreditPreviewSuccess : "R&D Credit preview fetched successfully",
  rdCreditPreview: "RD credit calculation results retrieved",
  rdCreditProcessInitiatedSuccess : "RD credit calculation initiated successfully",
  rdCreditProcessInitiationFailed: "Failed to initiate RD credit process",
  noProjectsAssignedToCase : "No Assigned Projects found. Kindly assign a project to case and try again",
  financialWorkingSignedOff : "Financial Working has been successfully signed off",
  financialWorkingSignedOffFailed : "Failed to signoff financial working",
  regionsFetchedSuccess : "Regions listed successfully",
  financialWorkingInitiated:"Financial workings are being computed. Refresh the page to check the status",
  userPreferenceUpdatedSuccess : "UserPreference updated successfully",
  userPreferenceUpdationFailed : "UserPreference updation failed",
};

export const caseStatuses = {
  INPROGRESS: "In Progress",
  REOPENED: "Reopened",
  SUBMITTED: "Submitted",
  CLOSED: "Closed",
};

export const caseFilingTypes = {
 regular: "Regular",
  amendment: "Amendment",
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

export const rawQueries = {
  fetchParentAccountDetails: `SELECT * FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = :rid`,
  async fetchParentAccount(
    accountRid: any,
    mainSequelize: Sequelize
  ): Promise<any> {
    let checkIsSeparateDb: any = await mainSequelize.query(
      `SELECT rid, r_number, account_name, storage_type FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`
    );
    if (checkIsSeparateDb[0][0].storage_type == STATUS_MESSAGE.separateDb) {
      return `SELECT rid, r_number, account_name, storage_type, currency_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`;
    } else {
      return `
      with fetch_account_details AS (
      SELECT rid, r_number, parent_account_rid, currency_rid FROM ${MAIN_SCHEMA_NAME}.account where rid = '${accountRid}'
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
  fetchUser(data: any) {
    let ids = data.map((d: any) => `'${d}'`);
    return `
    SELECT rid, first_name, last_name,email FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (${ids})`;
  },
  fetchUserDetails(data: string) {

    return `
    SELECT rid, first_name, last_name, email FROM ${MAIN_SCHEMA_NAME}.user WHERE rid = '${data}'`;
  },
  fetchAccountAndCountryDetails(accountRid: string) {
    return `SELECT r_number, account_name, country_rid,c.country_code, currency_rid FROM ${MAIN_SCHEMA_NAME}.account 
    LEFT JOIN ${MAIN_SCHEMA_NAME}.country c ON c.rid = account.country_rid
    WHERE account.rid = '${accountRid}'`;
  },
  fetchCountryByAccountId(accountRid: string) {
    return `SELECT country_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`;
  },
  fetchPOCRoleId() {
    return `
    SELECT rid FROM ${MAIN_SCHEMA_NAME}.key_contact_role WHERE role_name = '${keyContactRole.pocName}'`;
  },
  fetchStatus(statusIds: any): string {
    let ids = statusIds.map((d: any) => `'${d}'`);
    return `
    SELECT rid, status_name as name FROM ${MAIN_SCHEMA_NAME}.case_status WHERE rid IN (${ids})`;
  },
  fetchActivityStatus(statusIds: any): string {
    let ids = statusIds.map((d: any) => `'${d}'`);
    return `
    SELECT rid, status_name as name FROM ${MAIN_SCHEMA_NAME}.activity_status WHERE rid IN (${ids})`;
  },
  fetchActivityStatusByName(statusName: string, activityType: string): string {
    return `
    SELECT rid, status_name as name FROM ${MAIN_SCHEMA_NAME}.activity_status WHERE lower(activity_type) = lower('${activityType}') and lower(status_name) = lower('${statusName}')`;
  },
  fetchIndustry(industryIds: any): string {
    let ids = industryIds.map((d: any) => `'${d}'`);
    return `
    SELECT rid, industry_name as name FROM ${MAIN_SCHEMA_NAME}.industry WHERE rid IN (${ids})`;
  },
  fetchClassification(classificationIds: any): string {
    let ids = classificationIds.map((d: any) => `'${d}'`);
    return `
    SELECT rid, classification_name as name FROM ${MAIN_SCHEMA_NAME}.project_classification WHERE rid IN (${ids})`;
  },
  fetchProjectType(projectTypeIds: any): string {
    let ids = projectTypeIds.map((d: any) => `'${d}'`);
    return `
    SELECT rid, project_type_name as name FROM ${MAIN_SCHEMA_NAME}.project_type WHERE rid IN (${ids})`;
  },
  fetchFilingType(filingTypeIds: any): string {
    let ids = filingTypeIds.map((d: any) => `'${d}'`);
    return `
    SELECT rid, filing_type_name as name FROM ${MAIN_SCHEMA_NAME}.case_filing_type WHERE rid IN (${ids})`;
  },
  getCaseFilingType() {
    return `
      SELECT rid, filing_type_name 
      FROM ${MAIN_SCHEMA_NAME}.case_filing_type
      WHERE status = 'active'
      ORDER BY filing_type_name ASC
    `;
  },
  fetchFilingTypeByName(typeName: string): string {
    return `
    SELECT rid, filing_type_name as name FROM ${MAIN_SCHEMA_NAME}.case_filing_type WHERE filing_type_name = '${typeName}'`;
  },
  getActivityStatus(activityType: string) {
    return `
      SELECT distinct status_name ,rid
      FROM ${MAIN_SCHEMA_NAME}.activity_status
      WHERE status = 'active'${activityType && activityType !== "All" ? ` AND lower(activity_type) = lower('${activityType}')` : ""}
      ORDER BY status_name ASC
    `;
  },
  getCaseStatus() {
    return `
      SELECT rid, status_name 
      FROM ${MAIN_SCHEMA_NAME}.case_status
      WHERE status = 'active'
      ORDER BY status_name ASC
    `;
  },
  getChecklistStatus() {
    return `
      SELECT rid, status_name 
      FROM ${MAIN_SCHEMA_NAME}.checklist_status
      WHERE status = 'active'
      ORDER BY status_name ASC
    `;
  },
  getCaseTeamRoles() {
    return `
      SELECT rid, role_name 
      FROM ${MAIN_SCHEMA_NAME}.case_team_role
      WHERE status = 'active'
      ORDER BY role_name ASC
    `;
  },
  listUsersForCaseTeam(accountRid: string) {
    return `  
      SELECT u.rid, CONCAT(u.first_name, ' ', u.last_name) AS name,email, profile_url,phone as phone_number
      FROM ${MAIN_SCHEMA_NAME}.user u
	  where (is_consultant_firm is true
	  or org_id = '${accountRid}')
    AND u.status_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_description = 'active')
	  order by name asc`
  },
  listAllUsers() {
    return `  
      SELECT u.rid, CONCAT(u.first_name, ' ', u.last_name) AS name, profile_url
      FROM ${MAIN_SCHEMA_NAME}.user u
	  where  u.status_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_description = 'active')
	  order by name asc`
  },
  getCaseOwners() {
    return `
      SELECT u.rid, CONCAT(u.first_name, ' ', u.last_name) AS name
      FROM ${MAIN_SCHEMA_NAME}.user u
        WHERE is_consultant_firm is true and u.status_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_description = 'active')
    ORDER BY name ASC`
  },
  getEmailPlaceHolders() {
    return `
      SELECT rid,placeholder_key,display_name
      FROM ${MAIN_SCHEMA_NAME}.email_placeholder 
    ORDER BY placeholder_key ASC`
  },
  getEmailCategoryPlaceHolders(categoryRid: string) {
    return `
      SELECT ec.rid,placeholder_rid,ep.placeholder_key,applicable_to,ep.display_name
      FROM ${MAIN_SCHEMA_NAME}.email_category_placeholder  ec
      LEFT JOIN ${MAIN_SCHEMA_NAME}.email_placeholder ep ON ep.rid = ec.placeholder_rid
      WHERE category_rid = '${categoryRid}'
    ORDER BY placeholder_key ASC`
  },
  checkCaseTableExists(schemaName: string) {
    return `
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = '${schemaName}'
      AND table_name = 'cases'
    )`;
  },
  fetchCaseStatusByType(type: string) {
    return `
    SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.case_status WHERE status_name = '${type}'`;
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
  fetchAccountDetails(accountRid: string) {
    return `SELECT r_number, account_name, rid, country_rid, currency_rid, status_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`;
  },
  getCaseFilingTypeById(filingTypeRid: string) {
    return `
      SELECT rid, filing_type_name 
      FROM ${MAIN_SCHEMA_NAME}.case_filing_type
      WHERE 
      status = 'active'
      AND
      rid = '${filingTypeRid}'
    `;
  },
  getCountryDetails(countryRid: string) {
    return `SELECT rid, country_name,country_code FROM ${MAIN_SCHEMA_NAME}.country WHERE rid = '${countryRid}'`;
  },
  getCandaStateDetails() {
    return `SELECT rid, state_name FROM ${MAIN_SCHEMA_NAME}.state WHERE state_name ILIKE '%Ontario%'`;
  },
  getOwnerDetails(caseOwnerRid: any[]) {
    return `SELECT rid, CONCAT(first_name,' ',last_name) AS name, profile_url FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (${caseOwnerRid.map(
      (d: any) => `'${d}'`
    )})`;
  },
  getChecklistItemsStatusDetails(statusIds: any[]) {
    return `SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.checklist_status WHERE rid IN (${statusIds.map(
      (d: any) => `'${d}'`
    )})`;
  },
  getCaseStatusDetails(statusRid: string) {
    return `SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.case_status WHERE rid = '${statusRid}'`;
  },
  getCurrencyDetails(currencyRid: string) {
    return `SELECT rid, currency_code, currency_symbol FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid = '${currencyRid}'`;
  },
  getPointOfContactId() {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.key_contact_role WHERE role_name = '${keyContactRole.pocName}'`;
  },
  getTechnicalPointOfContactId() {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.key_contact_role WHERE role_name = '${keyContactRole.tPocName}'`;
  },
  getProjectClassifications(rid: any[]) {
    if (rid.length > 0)
      return `SELECT rid, classification_name FROM ${MAIN_SCHEMA_NAME}.project_classification WHERE rid IN (${rid
        .map((d: any) => `'${d}'`)
        .join(",")})`;
    else {
      return `SELECT rid, classification_name FROM ${MAIN_SCHEMA_NAME}.project_classification WHERE rid IN ('')`;
    }
  },
  getProjectTypes(rid: any[]) {
    if (rid.length > 0) {
      return `SELECT rid, project_type_name FROM ${MAIN_SCHEMA_NAME}.project_type WHERE rid IN (${rid
        .map((d: any) => `'${d}'`)
        .join(",")})`;
    } else {
      return `SELECT rid, project_type_name FROM ${MAIN_SCHEMA_NAME}.project_type WHERE rid IN ('')`;
    }
  },
  getTotalProjectsCountInCase(
    schemaName: string,
    fiscalYear: number,
    accountRid: string,
    caseRid: string
  ) {
    let query = `SELECT 
    CASE WHEN COUNT(cp.project_fiscal_rid) = 0 THEN NULL ELSE COUNT(cp.project_fiscal_rid) END AS total_projects,
    SUM(pf.total_cost_prj) AS total_projects_cost,
    COUNT(CASE WHEN pf.is_qualified = true THEN pf.rid END) AS total_qualified_projects,
    COALESCE(SUM(CASE WHEN pf.is_qualified = true THEN pf.total_cost_prj END), 0) AS total_qualified_project_cost,
    COALESCE(SUM(pf.qre_final), 0) AS total_projects_qre_cost
    FROM ${schemaName}.project_fiscal pf
    LEFT JOIN ${schemaName}.case_projects cp ON cp.project_fiscal_rid = pf.rid
    WHERE
    cp.case_rid = '${caseRid}'
    AND
    cp.account_rid = '${accountRid}'`;
    return query;
  },
  updateCostCountInCase(
    schemaName: string,
    caseRid: string,
    totalprojects: any,
    totalCost: any,
    total_projects_qre_cost: any,
    totalQualifiedProjects : any,
    totalQualifiedProjectCost : any
  ) {
    return `UPDATE ${schemaName}.cases SET case_total_projects = ${totalprojects}, case_total_project_cost = ${totalCost}, case_total_qre_cost = ${total_projects_qre_cost}, case_total_qualified_projects = ${totalQualifiedProjects}, case_total_qualified_project_cost = ${totalQualifiedProjectCost} WHERE rid = '${caseRid}'`;
  },
  updateCostCountInCaseSummary(
    caseRid: string,
    totalprojects: any,
    totalCost: any,
    total_projects_qre_cost: any,
    totalQualifiedProjects : any,
    totalQualifiedProjectCost : any
  ) {
    return `UPDATE ${MAIN_SCHEMA_NAME}.case_summary SET case_total_projects = ${totalprojects}, case_total_project_cost = ${totalCost}, case_total_qre_cost = ${total_projects_qre_cost}, case_total_qualified_projects = ${totalQualifiedProjects}, case_total_qualified_project_cost = ${totalQualifiedProjectCost} WHERE case_rid = '${caseRid}'`;
  },
  updateCostCountInCaseForDelete(
    schemaName: string,
    caseRid: string,
    totalprojects: any,
    totalCost: any
  ) {
    return `UPDATE ${schemaName}.cases SET case_total_projects = GREATEST(case_total_projects - ${totalprojects}, 0), case_total_project_cost = GREATEST(case_total_project_cost - ${totalCost}, 0) WHERE rid = '${caseRid}'`;
  },
  updateCostCountInCaseSummaryFoDelete(
    caseRid: string,
    totalprojects: any,
    totalCost: any
  ) {
    return `UPDATE ${MAIN_SCHEMA_NAME}.case_summary SET case_total_projects = GREATEST(case_total_projects - ${totalprojects}, 0), case_total_project_cost = GREATEST(case_total_projects - ${totalCost}, 0) WHERE case_rid = '${caseRid}'`;
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
  fetchSenderEmail(schemaName: string, accountRid: string) {
    return `
    SELECT support_email,client_id,client_secret,tenant_id, subscription_created FROM ${schemaName}.account_details WHERE account_rid = '${accountRid}'  and  subscription_created is true  and support_email is not null LIMIT 1`;
  },
  fetchAccountInfo(rid: string) {
    return `
    SELECT rid, account_name,r_number,parent_account_rid,storage_type,country_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${rid}'`;
  },
  fetchCasesInfo(rid:string) {
      return `SELECT cs.rid,
      CONCAT(ac.account_name, '-', c.country_name, '-',cs.fiscal_year,'-',cs.case_name) AS case_name,ac.account_name, cs.status_rid, planned_submission_date,statutory_submission_date,account_rid,case_owner_rid ,email ,s.status_name FROM ${MAIN_SCHEMA_NAME}.case_summary  cs
      LEFT JOIN ${MAIN_SCHEMA_NAME}.user uu ON cs.case_owner_rid = uu.rid 
      LEFT JOIN ${MAIN_SCHEMA_NAME}.account ac ON cs.account_rid = ac.rid
       LEFT JOIN ${MAIN_SCHEMA_NAME}.country c ON ac.country_rid = c.rid
       LEFT JOIN ${MAIN_SCHEMA_NAME}.case_status  s ON cs.status_rid = s.rid
      WHERE cs.case_rid = '${rid}'
     `;
    },
  fetchUserGroupType: `
      SELECT type group_type
      FROM ${MAIN_SCHEMA_NAME}.user_groups ug
      JOIN ${MAIN_SCHEMA_NAME}.user_group_mapping ugm ON ug.rid = ugm.group_rid 
      JOIN ${MAIN_SCHEMA_NAME}.user_group_type ugt ON ugt.rid = ug.group_type_rid
      WHERE ugm.user_rid = :userRid
      LIMIT 1`,
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
  fetchProjectFiscalSummary(accessControlWhere: any) {
    return `
      SELECT DISTINCT ps.project_fiscal_rid
      FROM ${MAIN_SCHEMA_NAME}.project_fiscal_summary AS ps
      LEFT JOIN ${MAIN_SCHEMA_NAME}.project_fiscal_summary AS pfs ON ps.project_fiscal_rid = pfs.project_fiscal_rid
      ${accessControlWhere}
    `;
  },
  GET_ACCOUNT_DIRECT_ACCESS_USER_IDS: `SELECT 
        ugea.entity_rid,
        a.parent_account_rid,
        CASE WHEN a.parent_account_rid IS NULL THEN false ELSE true END as is_child
      FROM ${MAIN_SCHEMA_NAME}.user_group_entity_access ugea
      LEFT JOIN ${MAIN_SCHEMA_NAME}.account a ON ugea.entity_rid = a.rid
      WHERE ugea.user_rid = :userRid 
        AND ugea.entity_type = 'ACCOUNT'
        AND ugea.access_type = 'INCLUDE'`,
  GET_ACCOUNT_DIRECT_EXCLUDE_ACCESS_USER_IDS: `
      SELECT ugea.entity_rid
      FROM ${MAIN_SCHEMA_NAME}.user_group_entity_access ugea
      WHERE ugea.user_rid = :userRid 
        AND ugea.entity_type = 'ACCOUNT'
        AND ugea.access_type = 'EXCLUDE'`,
  GET_GROUP_ACCESS: `
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
        AND gea.access_type = 'INCLUDE'`,
  getPriorityTypes() {
    return `SELECT rid, priority_name FROM ${MAIN_SCHEMA_NAME}.case_priority ORDER BY priority_level DESC`
  },
  getMilestones() {
    return `
    SELECT m.rid, m.milestone_name, m.case_filing_type_rid, c.filing_type_name
    FROM ${MAIN_SCHEMA_NAME}.milestone_template m
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_filing_type c ON c.rid = m.case_filing_type_rid
    ORDER BY m.milestone_name ASC
    `
  },
  getChecklistTypes() {
    return `SELECT rid, checklist_name FROM ${MAIN_SCHEMA_NAME}.checklist_template
     WHERE status_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_description = 'active')
    ORDER BY checklist_name ASC`
  },
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
  fetchEmailTemplates: `
    SELECT 
        et.rid,
        et.r_number,
        et.template_name,
        et.description,
        et.subject,
        et.body_html,
        et.category_rid,
        et.status_rid,
        s.status_name AS status_name,
        et.created_by,
        et.modified_by,
        et.created_datetime,
        et.modified_datetime
    FROM 
        ${MAIN_SCHEMA_NAME}.email_template et
    LEFT JOIN 
        ${MAIN_SCHEMA_NAME}.status s ON et.status_rid = s.rid
        WHERE 
        et.rid = :emailTemplateId
    LIMIT 1;
  `,
  updateTaskTemplate(data: string[], rid: string) {
    let query = `UPDATE ${MAIN_SCHEMA_NAME}.task_template SET ${data.map((d: any) => d).join(',')} WHERE rid = '${rid}'`
    return query;
  },
  getTaskType() {
    return `SELECT rid, task_type_name FROM ${MAIN_SCHEMA_NAME}.task_type ORDER BY task_type_name ASC`
  },
  getSpecificTaskType() {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.task_type WHERE task_type_name ILIKE '%Milestone%'`
  },
  getActivityTaskType() {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.task_type WHERE task_type_name ILIKE '%Action%'`
  },
  getStatusDetails(rid: string) {
    return `SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.status WHERE rid = '${rid}'`
  },
  getActivityStatusDetails(rid: string, activityType: string) {
    return `SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.activity_status WHERE rid = '${rid}' AND lower(activity_type) = lower('${activityType}')`
  },
  getCategoryDetails(rid: string) {
    return `SELECT rid, category_name FROM ${MAIN_SCHEMA_NAME}.email_template_category WHERE rid = '${rid}'`
  },
  getEmailTemplateCategory() {
    return `SELECT rid, category_name FROM ${MAIN_SCHEMA_NAME}.email_template_category ORDER BY category_name ASC`
  },
  getEmailTemplateCategoryByName(categoryName: string) {
    return `SELECT rid, category_name FROM ${MAIN_SCHEMA_NAME}.email_template_category where category_name = '${categoryName}' ORDER BY category_name ASC`
  },
  getAllPriorityTypes(rid: any[]) {
    let ids: string[] = []
    if (rid.length > 0) {
      ids.push(`${rid.map((d: any) => `'${d}'`).join(',')}`)
      return `SELECT rid, priority_name FROM ${MAIN_SCHEMA_NAME}.case_priority WHERE rid IN (${ids})`
    }
  },
  getAllTags (rid : any[]) {
    let ids : string[] = []
    if(rid.length > 0) {
      ids.push(`${rid.map((d : any) => `'${d}'`).join(',')}`)
      return `SELECT rid, tag_name FROM ${MAIN_SCHEMA_NAME}.tags WHERE rid IN (${ids})`
    }
  },
  getAllUsers(rid: any[]) {
    let ids: string[] = []
    if (rid.length > 0) {
      ids.push(`${rid.map((d: any) => `'${d}'`).join(',')}`)
      return `SELECT rid, CONCAT(first_name,' ', last_name) AS name, profile_url FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (${ids})`
    }
  },
  getAllCaseTeamRoles(rid: any[]) {
    let ids: string[] = []
    if (rid.length > 0) {
      ids.push(`${rid.map((d: any) => `'${d}'`).join(',')}`)
      return `SELECT rid, role_name FROM ${MAIN_SCHEMA_NAME}.case_team_role WHERE rid IN (${ids})`
    }
  },
  getAllTeamRoles(rid: any[]) {
    let ids: string[] = []
    if (rid.length > 0) {
      ids.push(`${rid.map((d: any) => `'${d}'`).join(',')}`)
      return `SELECT rid, role_name FROM ${MAIN_SCHEMA_NAME}.case_team_role WHERE rid IN (${ids})`
    }
  },
  getAllTaskTypes(rid: any[]) {
    let ids: string[] = []
    if (rid.length > 0) {
      ids.push(`${rid.map((d: any) => `'${d}'`).join(',')}`)
      return `SELECT rid, task_type_name FROM ${MAIN_SCHEMA_NAME}.task_type WHERE rid IN (${ids})`
    }
  },
  getAllStatus(rid: any[]) {
    let ids: string[] = []
    if (rid.length > 0) {
      ids.push(`${rid.map((d: any) => `'${d}'`).join(',')}`)
      return `SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.status WHERE rid IN (${ids})`
    }
  },
  getAllTaskStatus(rid: any) {
    let ids: string[] = []
    if (rid.length > 0) {
      ids.push(`${rid.map((d: any) => `'${d}'`).join(',')}`)
      return `SELECT rid, task_status_name FROM ${MAIN_SCHEMA_NAME}.case_task_status WHERE rid IN (${ids})`
    }
  },
  getAllProjectsByAccountId(schemaName: string, accountRid: string, accessibleIds: string[]) {
    let query = `SELECT rid, project_name FROM ${schemaName}.project_fiscal WHERE account_rid = '${accountRid}'`;
    if (Array.isArray(accessibleIds) && accessibleIds.length > 0) {
      query += ` AND rid IN (${accessibleIds.map(id => `'${id}'`).join(',')})`;
    }
    query += ` ORDER BY project_name ASC`;
    return query;
  },
  getAllCasesByAccountId(schemaName: string, accountRid: string) {
    let query = `SELECT rid FROM ${schemaName}.cases WHERE account_rid = '${accountRid}'`;
    return query;
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
  getResourcesByAccountQuery(schemaName: string): string {
    return `
      SELECT 
        r.rid
      FROM "${schemaName}".resources r
      WHERE r.account_rid = :accountRid
      ORDER BY r.created_datetime DESC
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
  fetchProjectResourceById(schemaName: string) {
    return `
      SELECT pr.rid,pr.r_number,pr.project_rid,pr.project_fiscal_rid, pf.currency_rid 
      FROM "${schemaName}".project_resource pr
      LEFT JOIN "${schemaName}".project_fiscal pf ON pf.rid = pr.project_fiscal_rid
      WHERE pr.rid = :projectResourceId
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
    SELECT rid,r_number,case_name,account_rid ,fiscal_year, material_software_cost, heat_light_power, total_nonlabor_cost,
    employers_pension_contribution,other, total_expenses, other, sub_contracts, cloud_software, unpaid_amounts_paid,
    unpaid_amounts, aggregated_turnover, taxable_income, export_sales_revenue,
    lease_costs_of_computers, illinois_rd_credit_partnership_corp, illinois_research_payments_corp_only,
    basic_research_payments, qualified_computer_rental_time_expenses,credit_carry_forward_py,current_year_gross_receipts,other_credits_total,
    rrc_credit_280_c, asc_credit_280_c
    FROM "${schemaName}".cases
    WHERE rid = :caseId
    `;
  },
  fetchCasesByIds(schemaName: string) {
    return `
    SELECT rid,r_number,case_name,account_rid ,fiscal_year
    FROM "${schemaName}".cases
    WHERE rid in (:caseIds)
    `;
  },
  fetchProjectInfoById(schemaName: string) {
    return `SELECT rid, project_code, currency_rid,fiscal_year FROM ${schemaName}.project_fiscal WHERE rid = :projectId LIMIT 1`;
  },
  listUsersByIds(userIds: any) {
    return `SELECT rid, CONCAT(first_name, ' ', last_name) as full_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (:userIds)`
  },
  fetchCheckListStatusNamesByRids(schemaName: string, statusRids: string[]) {
    const ridsList = statusRids.map(rid => `'${rid}'`).join(",");
    if (ridsList.length > 0) {
      return `SELECT rid, status_name FROM ${schemaName}.checklist_status WHERE rid IN (${ridsList})`;
    } else {
      return `SELECT rid, status_name FROM ${schemaName}.checklist_status WHERE rid IN ('')`
    }
  },
  fetchCaseInfo(schemaName: string, caseRid: string) {
    return `SELECT rid, r_number, case_name, account_rid, fiscal_year FROM ${schemaName}.cases WHERE rid = '${caseRid}' LIMIT 1`;
  },
  getTaskInfo(rid: string, schemaName: string) {
      return `SELECT rid, task_name FROM ${schemaName}.case_task WHERE rid = '${rid}'`
  },
  getSpecificTaskStatus() {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.case_task_status WHERE task_status_name ILIKE '%To Do%'`
  },
  getActiveStatusId() {
    return `SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.status where status_name = 'Active' limit 1`
  },
  getTaskTypeRid(rid: string) {
    return `SELECT rid, task_type_name FROM ${MAIN_SCHEMA_NAME}.task_type WHERE rid = '${rid}'`
  },
  fetchChecklistStatusByName(statusName: string) {
    return `
    SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.checklist_status WHERE status_name = '${statusName}'`;
  },
  fetchCaseTeamRole(oldRid: string, newRid: string) {
    if (oldRid === null) oldRid = ''
    if (newRid === null) newRid = ''
    return `SELECT rid, role_name FROM ${MAIN_SCHEMA_NAME}.case_team_role WHERE rid IN ('${oldRid}', '${newRid}')`
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
   fetchCaseStatus(oldRid: string, newRid: string) {
    if (oldRid === null) oldRid = ''
    if (newRid === null) newRid = ''
    return `SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.case_status WHERE rid IN ('${oldRid}', '${newRid}')`
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
  fetchUserNames(oldRid: string, newRid: string) {
    if (oldRid === null) oldRid = ''
    if (newRid === null) newRid = ''
    return `SELECT rid, CONCAT(first_name, ' ', last_name) AS name,email FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN ('${oldRid}', '${newRid}')`
  },
  fetchActivityStatusById(oldRid: string, newRid: string) {
    if (oldRid === null) oldRid = ''
    if (newRid === null) newRid = ''
    return `SELECT rid, status_name as name FROM ${MAIN_SCHEMA_NAME}.activity_status WHERE activity_type ='Task' AND rid IN ('${oldRid}', '${newRid}')`
  },
  insertTimeline: (schemaName: string, tableName: string) =>
    `INSERT INTO "${schemaName}".${tableName} (event_name, event_status, event_type, entity_rid,account_rid, description, created_by, event_datetime, created_datetime) VALUES (:event_name, :event_status, :event_type, :entity_rid, :account_rid, :description, :created_by, :event_datetime, :created_datetime)`,
  fetchChecklistStatus() {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.checklist_status WHERE status_name ILIKE '%Done%'`
  },
  fetchWorkFlowConnector() {
    return `SELECT rid, relationship_type FROM ${MAIN_SCHEMA_NAME}.workflow_connector ORDER BY sequence ASC`
  },
  getAllTagsName(rid: any[]) {
    let ids: string[] = []
    if (rid.length > 0) {
      ids.push(`${rid.map((d: any) => `'${d}'`).join(',')}`)
      return `SELECT rid, tag_name FROM ${MAIN_SCHEMA_NAME}.tags WHERE rid IN (${ids})`
    }
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
  fetchCaseName( caseRids: string) {
    return `SELECT  CONCAT(a.account_name, '-', ct.country_name, '-',c.fiscal_year,'-',c.case_name) AS case_full_name FROM ${MAIN_SCHEMA_NAME}.case_summary  c
    lEFT JOIN ${MAIN_SCHEMA_NAME}.account a ON a.rid = c.account_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.country ct ON ct.rid = a.country_rid
    WHERE c.case_rid = '${caseRids}'`
  },

  getTaskTypeMilestone() {
    return `SELECT rid, task_type_name FROM ${MAIN_SCHEMA_NAME}.task_type WHERE task_type_name ILIKE '%Milestone%'`
  },
  fetchStatesByIds() {
    return `SELECT rid, state_name,state_code FROM ${MAIN_SCHEMA_NAME}.state WHERE rid IN (:ids) order by state_name asc`;
  },
  GET_COUNTRIES: `
    SELECT rid, country_name, country_code FROM ${MAIN_SCHEMA_NAME}.country WHERE rid IN (:countryRid)
    `,
  GET_RESOURCE_TYPES: `
      SELECT rid, resource_type_name FROM ${MAIN_SCHEMA_NAME}.resource_type WHERE rid IN (:resourceTypeRid)
      `,
  fetchResourceStatus: `
        SELECT rid, resource_status_name FROM ${MAIN_SCHEMA_NAME}.resource_status WHERE rid IN (:projectTaskStatusId)`,
  fetchCountryById() {
    return `
      SELECT rid, country_name, country_code FROM ${MAIN_SCHEMA_NAME}.country WHERE rid = :id`;
  },
  fetchStateById() {
    return `
        SELECT rid, state_name FROM ${MAIN_SCHEMA_NAME}.state WHERE rid = :id`;
  },
  fetchCurrencyById() {
    return `SELECT rid, currency_name, currency_code, currency_symbol FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid = :id`;
  },
  fetchCurrencies(rid : any[]) {
    return `SELECT rid, currency_name, currency_code, currency_symbol FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid IN (${rid.map((d : any) => `'${d}'`).join(',')})`;
  },
  fetchUserById() {
    return `SELECT first_name, middle_name, last_name FROM ${MAIN_SCHEMA_NAME}."user" WHERE rid = :userId`;
  },
  fetchResourceStatusById() {
    return `SELECT resource_status_name FROM ${MAIN_SCHEMA_NAME}.resource_status WHERE rid = :id`;
  },
  fetchSpecificResourceTypeById() {
    return `SELECT * FROM ${MAIN_SCHEMA_NAME}.resource_type WHERE rid = :resourceTypeId`;
  },
  fetchSkillRoleSubType() {
    return `SELECT rid, skill_role_rid, sub_type_name 
       FROM ${MAIN_SCHEMA_NAME}.skill_role_sub_type 
       WHERE rid = :skillTypeId`;
  },
  fetchAllResourceStatus() {
    return `SELECT rid, resource_status_name FROM ${MAIN_SCHEMA_NAME}.resource_status`;
  },
  fetchCurrencyThresold() {
    return `SELECT currency_threshold FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid = :currency_rid`;
  },
  fetchDefualtCurrencyThresold() {
    return `SELECT currency_threshold FROM ${MAIN_SCHEMA_NAME}.currency WHERE currency_code = 'USD'`;
  },
  fetchActiveStatusRid(status: string) {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_name ILIKE '%${status}%'`;
  },
  checkResCodeExistsInPrjRes(schemaName: string, project_resource_rid: string) {
    return `SELECT * FROM ${schemaName}.project_resource WHERE rid = '${project_resource_rid}'`;
  },
  fetchAccountCurrencyRid(account_rid: string) {
    return `SELECT currency_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${account_rid}'`;
  },
  fetchActiveStatus() {
    return `
    SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.status WHERE status_name = 'Active' limit 1`;
  },
  fetchConfiguration(schemaName:string,caseRid:string)
  {
    return `
      SELECT is_federal_level, is_state_level, states FROM ${schemaName}.jurisdictions WHERE entity_rid = '${caseRid}' LIMIT 1;
    `
  },
  GET_CURRENCIES: `
  SELECT rid, currency_symbol, currency_name, currency_code FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid IN (:currencyRid)
  `,
  GET_TASK_TYPES: `
  SELECT rid, project_task_type_name FROM ${MAIN_SCHEMA_NAME}.project_task_type WHERE rid IN (:taskTypeRid)
  `,
  GET_TASK_CLASSIFICATION: `
  SELECT rid, classification_name FROM ${MAIN_SCHEMA_NAME}.project_task_classification WHERE rid IN (:taskClassificationRids)
  `,
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
  fetchAttachmentSummaryByTask() {
    return `
      SELECT 
        a.*
      FROM "${MAIN_SCHEMA_NAME}"."attachment_summary" a
      WHERE a.attach_to = :task_rid
      ORDER BY a.created_datetime DESC
    `;
  },
  fetchProjecTaskType() {
    return `SELECT * FROM ${MAIN_SCHEMA_NAME}.project_task_type`;
  },
  fetchProjetClassificationQuery() {
    return `SELECT * FROM ${MAIN_SCHEMA_NAME}.project_task_classification`;
  },
  fetchProfileFromUser() {
    return `SELECT profile_rid FROM ${MAIN_SCHEMA_NAME}.user WHERE rid = :userId LIMIT 1`;
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
  fetchAccountById: `SELECT * FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = :rid`,
  findProjectTaskDetails(schemaName: string, rid: string, account_rid: string) {
    return `
      SELECT * FROM ${schemaName}.project_task WHERE rid = '${rid}' AND account_rid = '${account_rid}'`;
  },
  findResourceByCode(schemaName: string, resource_code: string) {
    return `SELECT rid FROM ${schemaName}.resources WHERE resource_code = '${resource_code}'`;
  },
  fetchCurrencyFromAccount(accountId: string) {
    return `
      SELECT currency_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountId}'
    `;
  },
  updateProjectTaskQuery(schemaName: string, getSetData: any, data: any) {
    return `
    UPDATE 
        ${schemaName}.case_project_task 
    SET 
        ${getSetData.data.join(",")}
    WHERE
        rid = '${data.rid}'
        AND
        account_rid = '${data.account_rid}'`;
  },
  getRelationShipIds() {
    return `SELECT rid, relationship_type FROM ${MAIN_SCHEMA_NAME}.workflow_connector where relationship_type ILIKE '%by%'`
  },
  getCaseStatusById(statusRid: string) {
    return `SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.case_status WHERE rid = '${statusRid}'`
  },
  getCaseTeamRoleName(roleRid: string) {
    return `SELECT rid, role_name FROM ${MAIN_SCHEMA_NAME}.case_team_role WHERE rid = '${roleRid}'`
  },
  getCaseTeamRoleByName(roleName: string) {
    return `SELECT rid, role_name FROM ${MAIN_SCHEMA_NAME}.case_team_role WHERE role_name = '${roleName}'`
  },
  fetchEmailRecipientsForReviewProjects(schemaName: string, caseRid: string, roleRid: string, statusActiveRid: string) {
    return `
    SELECT ct.user_rid
    FROM ${schemaName}.case_team ct
    WHERE ct.case_rid = '${caseRid}'
    AND ct.role_rid = '${roleRid}'
    AND ct.status_rid = '${statusActiveRid}'
    `;
  },
  fetchEmailRecipientsByRids(userRids: string[]) {
    let ids: string[] = []
    if (userRids.length > 0) {
      ids.push(`${userRids.map((d: any) => `'${d}'`).join(',')}`)
      return `SELECT rid, email FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (${ids})
      and status_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_description = 'active')`
    }
  },
  fetchEmailTemplateByCategory(categoryName: string) {
    return `SELECT rid, template_name, subject, body_html FROM ${MAIN_SCHEMA_NAME}.email_template WHERE category_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.email_template_category WHERE category_name ILIKE '%${categoryName}%')`
  },
  getChecklistStatusByName(statusName: string) {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.checklist_status WHERE status_name ILIKE '%${statusName}%'`;
  },
  getWeightageValue(rid: string) {
    return `SELECT weightage_value FROM ${MAIN_SCHEMA_NAME}.task_weightage WHERE rid = '${rid}'`
  },
  getCategoryName(rid: string) {
    return `SELECT category_name FROM ${MAIN_SCHEMA_NAME}.task_category WHERE rid = '${rid}'`
  },
  getTaskCategoryList() {
    return `SELECT rid, category_name FROM ${MAIN_SCHEMA_NAME}.task_category ORDER BY category_name ASC`
  },
  getTaskCategoryByRid(rid: string) {
    return `SELECT category_name FROM ${MAIN_SCHEMA_NAME}.task_category WHERE rid = '${rid}'`
  },
  getProjectByIds(rid: string[], schemaName: string) {
    return `SELECT * FROM ${schemaName}.project_fiscal WHERE rid IN (${rid.map((d: any) => `'${d}'`).join(',')})`
  },
  getTaskTypes(rid: any[]) {
    let ids: string[] = []
    if (rid.length > 0) {
      ids.push(`${rid.map((d: any) => `'${d}'`).join(',')}`)
      return `SELECT rid, task_type_name FROM ${MAIN_SCHEMA_NAME}.task_type WHERE rid IN (${ids})`
    }
  },
  getTaskDropdownForCaseLevel(schemaName: string, caseRid: string, accountRid: string, isAuditReviewInclude: boolean, milestoneTemplateRid: string) {
    let query;
    if (isAuditReviewInclude) {
      query = `SELECT rid, task_name FROM ${schemaName}.case_task WHERE case_rid = '${caseRid}' AND account_rid = '${accountRid}' ORDER BY task_name ASC`
    } else {
      query = `SELECT rid, task_name FROM ${schemaName}.case_task WHERE case_rid = '${caseRid}' AND account_rid = '${accountRid}' AND milestone_template_rid != '${milestoneTemplateRid}' ORDER BY task_name ASC`
    }
    return query;
  },
  getMilestoneReview() {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.milestone_template where milestone_name ILIKE '%Audit Review%'`
  },
  fetchAccountDetailsByRid(accountRid: string) {
    return `
            SELECT * FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`;
  },
  fetchAccountInfos(schemaName: string, account_rid: string) {
    return `SELECT * FROM ${schemaName}.account_details WHERE account_rid = '${account_rid}'`;
  },
  fetchTaskBasedOnSequence(sequenceNo: number, milestoneTemplateRid: string) {
    return `SELECT rid, sequence_no FROM ${MAIN_SCHEMA_NAME}.task_template WHERE milestone_template_rid = '${milestoneTemplateRid}' AND sequence_no > ${sequenceNo} ORDER BY sequence_no ASC`
  },
  fetchTaskBasedOnSequenceForActive(sequenceNo: number, milestoneTemplateRid: string, taskRid: string) {
    return `SELECT rid, sequence_no FROM ${MAIN_SCHEMA_NAME}.task_template WHERE milestone_template_rid = '${milestoneTemplateRid}' AND sequence_no >= ${sequenceNo} AND rid != '${taskRid}' ORDER BY sequence_no ASC`
  },
  getStatus() {
    return `SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.status`
  },
  getMilestoneSequence(rid: string) {
    return `SELECT rid, r_number FROM ${MAIN_SCHEMA_NAME}.milestone_template WHERE rid = '${rid}'`
  },
  getUserById(userId: string) {
    return `
      SELECT CONCAT(first_name,' ',last_name) AS name
      FROM ${MAIN_SCHEMA_NAME}."user" 
      WHERE rid = '${userId}'
    `;
  },
  checkCaseStatusChanged(schemaName: string, caseRid: string, accountRid: string, toDoStatusRid: string) {
    return `
    SELECT rid FROM ${schemaName}.case_task 
    WHERE
    case_rid = '${caseRid}'
    AND
    account_rid = '${accountRid}'
    AND
    task_status_rid !='${toDoStatusRid}'
    `
  },
  checkCaseTaskStatusToDo() {
    return `
    SELECT rid FROM ${MAIN_SCHEMA_NAME}.case_task_status 
    WHERE
    task_status_name ILIKE '%To Do%'
    `
  },
  getChecklistOpenStatusId() {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.checklist_status WHERE status_name ILIKE '%Done%'`
  },
  getUserAssignedCount(schemaName: string, userIds: string[], caseRid: string) {
    return `
    SELECT
      array_agg(jsonb_build_object(
      'total_task_assigned_count', (
      SELECT count(*) FROM ${schemaName}.case_task ctt 
      where 
      ctt.assigned_to = ct.user_rid
      AND
      ctt.case_rid = ct.case_rid
      AND
      ctt.case_team_member_role_rid = ct.role_rid
      ),
      'user_rid', ct.user_rid
      )) AS assigned_user_details
      FROM ${schemaName}.case_team ct
      WHERE
      ct.user_rid IN (${userIds.map((d: any) => `'${d}'`).join(',')})
      AND
      ct.case_rid = '${caseRid}'`
  },
  getJurisdictionById(credit_config_group_rid: string) {
    return `
      SELECT 
      k.rid as credit_parameter_key_rid,
      k.credit_parameter_name,
      k.data_type,
      k.credit_parameter_display_name,
      k.credit_config_group_rid,
      g.credit_program_name,
      g.country_rid,
      g.is_federal,
      g.state_rid,
      c.country_name,
      c.country_code,
      s.state_name,
      g.rid as credit_config_group_rid,
      k.is_required
    FROM ${MAIN_SCHEMA_NAME}.rd_credit_parameter_key k
    JOIN ${MAIN_SCHEMA_NAME}.rd_credit_config_group g ON k.credit_config_group_rid = g.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.country c ON g.country_rid = c.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.state s ON g.state_rid = s.rid
    WHERE g.rid = '${credit_config_group_rid}';
    `;
  },
  getPlatformJurisdictionConfig(countryRid : string) {
    return `
      SELECT 
      k.rid as credit_parameter_key_rid,
      k.credit_parameter_name,
      k.data_type,
      k.credit_parameter_display_name,
      k.credit_config_group_rid,
      g.credit_program_name,
      g.country_rid,
      g.is_federal,
      g.state_rid,
      c.country_name,
      c.country_code,
      s.state_name,
      k.is_required
    FROM ${MAIN_SCHEMA_NAME}.rd_credit_parameter_key k
    JOIN ${MAIN_SCHEMA_NAME}.rd_credit_config_group g ON k.credit_config_group_rid = g.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.country c ON g.country_rid = c.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.state s ON g.state_rid = s.rid
    WHERE g.credit_program_name = 'Platform Configuration'
    AND g.is_federal = true
    AND g.country_rid = '${countryRid}'
    `;
  },
  checkJurisdictionConfigOverlap(excludeCurrent = false) {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.rd_credit_parameter_values WHERE credit_config_group_rid = :groupId  AND ((:endDate IS NULL AND :startDate < effective_end_date) OR (:endDate IS NOT NULL AND :startDate < effective_end_date AND :endDate > effective_start_date))${excludeCurrent ? ' AND federal_config_id is null AND rid != :excludeRid' : ''} LIMIT 1`;
  },
  getJurisdictionByCountryId(country_rid: string, state_rid: string, is_federal: boolean, credit_program_name: string) {
    let whereClause = `g.country_rid = '${country_rid}' AND g.is_federal = ${is_federal}`;
    if (state_rid && state_rid.trim() !== "") {
      whereClause += ` AND g.state_rid = '${state_rid}'`;
    }
    return `
      SELECT 
      k.rid as credit_parameter_key_rid,
      k.credit_parameter_name,
      k.data_type,
      k.credit_parameter_display_name,
      k.credit_config_group_rid,
      g.credit_program_name,
      g.country_rid,
      g.is_federal,
      g.state_rid,
      c.country_name,
      c.country_code,
      s.state_name,
      g.rid as credit_config_group_rid,
      k.is_required
    FROM ${MAIN_SCHEMA_NAME}.rd_credit_parameter_key k
    JOIN ${MAIN_SCHEMA_NAME}.rd_credit_config_group g ON k.credit_config_group_rid = g.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.country c ON g.country_rid = c.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.state s ON g.state_rid = s.rid
    WHERE ${whereClause}
    and g.credit_program_name != 'Platform Configuration';
    `;
  },
  getJurisdictionConfigValuesById(config_rid: string) {
    return `SELECT rv.rid,credit_config_group_rid, config_json,effective_start_date,config_name,rv.status_rid,rv.r_number,
    effective_end_date,rv.created_datetime,rv.created_by,rv.modified_datetime,rv.modified_by,
     CONCAT(u.first_name, ' ', u.last_name) AS created_user_name,
    CASE WHEN uu.first_name IS NULL THEN rv.modified_by ELSE CONCAT(uu.first_name, ' ', uu.last_name) END AS modified_user_name
    FROM ${MAIN_SCHEMA_NAME}.rd_credit_parameter_values rv
     LEFT JOIN ${MAIN_SCHEMA_NAME}.user u ON u.rid = rv.created_by
    LEFT JOIN ${MAIN_SCHEMA_NAME}.user uu ON uu.rid = rv.modified_by
     WHERE rv.rid = '${config_rid}';`
  },
  getJurisdictionPlatformConfigValuesById(config_rid: string) {
    return `SELECT rv.rid,credit_config_group_rid, config_json,effective_start_date,effective_end_date,config_name,rv.status_rid,rv.r_number,
    rv.created_datetime,rv.created_by,rv.modified_datetime,rv.modified_by,
     CONCAT(u.first_name, ' ', u.last_name) AS created_user_name,
    CASE WHEN uu.first_name IS NULL THEN rv.modified_by ELSE CONCAT(uu.first_name, ' ', uu.last_name) END AS modified_user_name
    FROM ${MAIN_SCHEMA_NAME}.rd_credit_parameter_values rv
     LEFT JOIN ${MAIN_SCHEMA_NAME}.user u ON u.rid = rv.created_by
    LEFT JOIN ${MAIN_SCHEMA_NAME}.user uu ON uu.rid = rv.modified_by
    WHERE federal_config_id = '${config_rid}';`
  },
  fetchPlatformConfig(rid: string,formattedStartDate: string,formattedEndDate:string) {
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

  fetchAccountDetailsInfo(schemaName: string, account_rid: string) {
    return `SELECT * FROM ${schemaName}.account_details WHERE account_rid = '${account_rid}'`;
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
  getIndustryById() {
    return `SELECT industry_name FROM ${MAIN_SCHEMA_NAME}.industry WHERE rid = :id`
  },
  fetchStatusById() {
    return `SELECT status_name FROM ${MAIN_SCHEMA_NAME}.status WHERE rid = :rid`
  },
  getProjectTypeByIdQuery() {
    return `
      SELECT project_type_name 
      FROM ${MAIN_SCHEMA_NAME}.project_type 
      WHERE rid = :id
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
  getProjectClassificationByIdQuery() {
    return `
      SELECT classification_name 
      FROM ${MAIN_SCHEMA_NAME}.project_classification 
      WHERE rid = :rid
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
  fetchDefaultCurrency() {
    return `
      SELECT c.* FROM ${MAIN_SCHEMA_NAME}.currency c WHERE c.currency_code = 'USD'
    `;
  },
  fetchProjectFiscalById (rid : string, accountRid : string, schemaName : string) {
    return `SELECT rid, signoff, project_code FROM ${schemaName}.project_fiscal WHERE rid = '${rid}' AND account_rid = '${accountRid}'`
  },
  getProjectsForCases(caseRid: string, accountRid: string, schemaName: string) {
    return `SELECT rid, project_fiscal_rid, region_rid, fiscal_year FROM ${schemaName}.case_projects WHERE case_rid = '${caseRid}' AND account_rid = '${accountRid}'`
  },
  updateSignoffInCase(schemaName : string, caseRid : string, signOff : boolean) {
    return `UPDATE ${schemaName}.cases SET financial_working_signoff = ${signOff} WHERE rid = '${caseRid}'`
  },
  updateClaimQualifiedInCaseProject (caseRid : string, projectFiscalRids : string[], accountRid : string, schemaName : string) {
    return `UPDATE ${schemaName}.case_projects SET is_rd_claim_qualified = true WHERE case_rid = '${caseRid}' AND account_rid = '${accountRid}' AND project_fiscal_rid IN (${projectFiscalRids.map((d : any) => `'${d}'`).join(',')})`
  },
  updateClaimQualifiedInProjectFiscal (projectFiscalRids : string[], accountRid : string, schemaName : string) {
    return `UPDATE ${schemaName}.project_fiscal SET is_rd_claim_qualified = true WHERE rid IN (${projectFiscalRids.map((d : any) => `'${d}'`).join(',')}) AND account_rid = '${accountRid}'`
  },
  updateClaimQualifiedInProjectFiscalSummary (projectFiscalRids : string[], accountRid : string) {
    return `UPDATE ${MAIN_SCHEMA_NAME}.project_fiscal_summary SET is_rd_claim_qualified = true WHERE project_fiscal_rid IN (${projectFiscalRids.map((d : any) => `'${d}'`).join(',')}) AND account_rid = '${accountRid}'`
  },
  getFinancialWorkingId () {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.signoff_type WHERE signoff_type_name ILIKE '%financial_working%'`
  },
  updateClaimQualifiedInCaseProjectFiscalRegion (ProjectRegionIds : any[], accountRid : string, schemaName : string) {
    let ids = ProjectRegionIds.filter((d : any) => d.region_rid !== null)
    let validIds;
    validIds = ids.map((d : any) => `('${d.case_project_rid}','${d.project_fiscal_rid}', '${d.region_rid}')`).join(',')
    let finalQuery;
    if(validIds === '') {
      finalQuery = ''
    } else {
      finalQuery = `UPDATE ${schemaName}.case_project_fiscal_region SET is_rd_claim_qualified = true WHERE account_rid = '${accountRid}' AND (case_project_rid, project_fiscal_rid, region_rid) IN (${validIds})`
    }
    return finalQuery;
  },
  fetchStates(stateIds: string[]) {
    let formattedStateIds = stateIds.map((id: string) => `'${id}'`).join(",");
    return `SELECT rid, state_name FROM ${MAIN_SCHEMA_NAME}.state 
    WHERE 
    rid IN (${formattedStateIds})`;
  },
  fetchMilestoneDetails (rid : string) {
    return `SELECT r_number FROM ${MAIN_SCHEMA_NAME}.milestone_template WHERE rid = '${rid}'`
  },
  fetchAccountStartEndDate (accountRid : string, schemaName : string) {
    return `SELECT fiscal_start_date, fiscal_end_date FROM ${schemaName}.account_details WHERE account_rid = '${accountRid}'`
  },
  insertDataIntoAttachments (schemaName : string, caseRid : string, userId : string, accountRid : string, browseFile : string, documentName : string, fiscalYear : number, format : string, size : number, comments : any) {
    return `INSERT INTO ${schemaName}.attachments (created_by, created_datetime, account_rid, browse_file, document_name, attach_to, attachment_level, fiscal_year, format, size_in_mb, document_category_rid, document_type_rid, document_category_others, document_type_others, comments) VALUES ('${userId}', NOW(), '${accountRid}', '${browseFile}', '${documentName}', '${caseRid}', 'case', ${fiscalYear}, '${format}', ${size}, '', '', '', '', '${comments.replace(/'/g, "")}')`
  },
  insertSignoffDetails (createdBy : string, signoffTypeRid : string, caseRid : string, accountRid : string, schemaName : string) {
    return `INSERT INTO ${schemaName}.signoff_details (created_by, created_datetime, signoff_type_rid, case_rid, account_rid) VALUES('${createdBy}', NOW(), '${signoffTypeRid}', '${caseRid}', '${accountRid}')`
  },
  fetchFiscalEndDate (accountRid : string, schemaName : string) {
    return `SELECT fiscal_end_date FROM ${schemaName}.account_details WHERE account_rid = '${accountRid}'`
  },
  fetchProjectCountsAndQreByState(schemaName: string) {
    return  `
                SELECT 
                    pfr.region_rid as state_rid,
                    COUNT(DISTINCT cp.project_fiscal_rid) as total_projects,
                    COUNT(DISTINCT pr.rid) as total_resources,
                    SUM(pfr.total_cost_fte_from_prj_res + pfr.total_cost_nonlabor_from_prj_res + pfr.total_cost_subcon_from_prj_res) as total_qre
                FROM ${schemaName}.case_projects cp
                JOIN ${schemaName}.project_fiscal pf ON cp.project_fiscal_rid = pf.rid
                JOIN ${schemaName}.project_fiscal_region pfr ON pf.rid = pfr.project_fiscal_rid
                LEFT JOIN ${schemaName}.project_resource pr ON pf.rid = pr.project_fiscal_rid 
                    AND pr.region_rid = pfr.region_rid
                WHERE cp.case_rid = :case_rid 
                    AND pf.fiscal_year = cp.fiscal_year
                    AND pfr.region_rid IN (:stateRids)
                GROUP BY pfr.region_rid
            `
  }
};
// AND status_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_description = 'active') 
const keyContactRole = {
  pocName: "Project Point of Contact",
  tPocName: "Project Technical Point of Contact",
};

export const filterTypesForCaseSummary: Record<string, any> = {
  r_number: "string",
  created_datetime: "datetime",
  modified_datetime: "datetime",
  created_user_name: "string",
  updated_user_name: "string",
  status_rid: "string",
  fiscal_year: "number",
  createdAt: "datetime",
  total_resources_prj: "number",
  total_cost_prj: "number",
  total_cost_nonlabor_prj: "number",
  total_cost_subcon_prj: "number",
  total_cost_fte_prj: "number",
  total_effort_prj: "number",
  total_effort_subcon_prj: "number",
  total_effort_fte_prj: "number",
  total_subcon_prj: "number",
  total_nonlabor_prj: "number",
  total_fte_prj: "number",
  case_name: "string",
  country_name: "string",
  filing_type_name: "string",
  account_name: "string",
  case_owner_name: "string",

};

export const filterTypesForReviewProjects: Record<string, any> = {
  r_number: "string",
  created_datetime: "datetime",
  modified_datetime: "datetime",
  created_user_name: "string",
  updated_user_name: "string",
  status_rid: "string",
  fiscal_year: "number",
  createdAt: "datetime",
  total_cost_prj: "number",
  total_effort_prj: "number",
  total_subcon_prj: "number",
  total_cost_fte_prj: "number",
  total_nonlabor_prj: "number",
  total_resources_prj: "number",
  total_effort_fte_prj: "number",
  total_cost_subcon_prj: "number",
  total_cost_nonlabor_prj: "number",
  total_effort_subcon_prj: "number",
  project_classification_rid: "string",
  project_type_name: "string",
  total_tasks: "number",
  project_group: "string",
  project_name: "string",
  project_code: "string",
  total_technical_summaries: "number",
  industry_rid: "string",
  project_point_of_contact_email: "string",
  project_point_of_contact: "string",
};

export const filtersColumnsForReviewProjects: Record<string, string> = {
  r_number: "r_number",
  created_datetime: "created_datetime",
  modified_datetime: "modified_datetime",
  fiscal_year: "fiscal_year",
  createdAt: "created_datetime",
  total_resources_prj: "total_resources_prj",
  total_cost_prj: "total_cost_prj",
  total_cost_nonlabor_prj: "total_cost_nonlabor_prj",
  total_cost_subcon_prj: "total_cost_subcon_prj",
  total_cost_fte_prj: "total_cost_fte_prj",
  total_effort_prj: "total_effort_prj",
  total_effort_subcon_prj: "total_effort_subcon_prj",
  total_effort_fte_prj: "total_effort_fte_prj",
  total_subcon_prj: "total_subcon_prj",
  total_nonlabor_prj: "total_nonlabor_prj",
  total_fte_prj: "total_fte_prj",
  project_group: "project_group",
  project_name: "project_name",
  project_code: "project_code",
  total_tasks: "total_tasks",
  total_technical_summaries: "total_technical_summaries",
  industry_rid: "industry_rid",
  project_type_name: "project_type_rid",
  project_point_of_contact_email: "project_point_of_contact_email",
  project_point_of_contact: "project_point_of_contact",
};

export const filtersColumnsForCaseSummary: Record<string, string> = {
  r_number: "r_number",
  created_datetime: "created_datetime",
  modified_datetime: "modified_datetime",
  created_user_name: "created_user_name",
  updated_user_name: "updated_user_name",
  status_rid: "status_rid",
  status_name: "status_name",
  account_name: "account_name",
  fiscal_year: "fiscal_year",
  createdAt: "createdAt",
  case_owner_name: "case_owner_rid",
  filing_type_name: "filing_type_rid",
  case_name: "case_name",
  submitted_datetime: "submitted_datetime",
  approved_datetime: "approved_datetime",
  case_total_project_cost: "case_total_project_cost",
  case_total_qre_cost: "case_total_qre_cost",
  case_total_rd_cost: "case_total_rd_cost",
  case_total_projects: "case_total_projects",
  case_total_qualified_projects: "case_total_qualified_projects",
  country_name: "country_rid",
};


export const filterTypesForAdminCheckList: Record<string, any> = {
  r_number: "string",
  created_datetime: "datetime",
  modified_datetime: "datetime",
  created_user_name: "string",
  updated_user_name: "string",
  status_rid: "string",
  checklist_name: "string",
  checklist_description: "string",
  createdAt: "datetime"
};

export const filtersColumnsForAdminCheckList: Record<string, string> = {
  r_number: "r_number",
  created_datetime: "created_datetime",
  modified_datetime: "modified_datetime",
  created_user_name: "created_user_name",
  updated_user_name: "updated_user_name",
  status_rid: "status_rid",
  status_name: "status_name",
  createdAt: "createdAt",
  checklist_name: "checklist_name",
  checklist_description: "checklist_description"

};

export const filterTypesForEmailTemplate: Record<string, any> = {
  r_number: "string",
  created_datetime: "datetime",
  modified_datetime: "datetime",
  created_user_name: "string",
  modified_user_name: "string",
  status_rid: "string",
  template_name: "string",
  description: "string",
  createdAt: "datetime",
  category_rid: "string"
};

export const filtersColumnsForEmailTemplate: Record<string, string> = {
  r_number: "r_number",
  created_datetime: "created_datetime",
  modified_datetime: "modified_datetime",
  created_user_name: "created_user_name",
  modified_user_name: "modified_user_name",
  status_rid: "status_rid",
  status_name: "status_name",
  createdAt: "createdAt",
  template_name: "template_name",
  description: "description",
  category_rid: "category_rid"

};

export const filterTypesForJurisdictionConfig: Record<string, any> = {
  r_number: "string",
  created_datetime: "datetime",
  modified_datetime: "datetime",
  created_user_name: "string",
  modified_user_name: "string",
  status_rid: "string",
  effective_start_date: "datetime",
  effective_end_date: "datetime",
  createdAt: "datetime",
  config_name: "string",
  state_rid: "string",
  country_rid: "string",
  is_federal: "boolean"
};

export const filtersColumnsForJurisdictionConfig: Record<string, string> = {
  r_number: "r_number",
  created_datetime: "created_datetime",
  modified_datetime: "modified_datetime",
  created_user_name: "created_user_name",
  modified_user_name: "modified_user_name",
  status_rid: "status_rid",
  status_name: "status_name",
  createdAt: "createdAt",
  effective_start_date: "effective_start_date",
  effective_end_date: "effective_end_date",
  state_rid: "state_rid",
  country_rid: "country_rid",
  is_federal: "is_federal",
  config_name: "config_name"

};

export const validColumnsForSortFilters: Record<string, string> = {
  r_number: "t.r_number",
  task_name: "t.task_name",
  milestone_name: "m.milestone_name",
  checklist_name: "c.checklist_name",
  priority_name: "p.priority_name",
  status_name: "s.status_name",
  role_name: "r.role_name",
  effective_start_datetime: "t.effective_start_datetime",
  effective_end_datetime: "t.effective_end_datetime",
  effort_in_days: "t.effort_in_days",
  created_datetime: "t.created_datetime",
  modified_datetime: "t.modified_datetime",
  created_by_name: "CONCAT(u.first_name,' ', u.last_name)",
  modified_by_name: "CONCAT(uu.first_name,' ', uu.last_name)",
  sequence_no: "t.sequence_no",
  task_type_name: "tt.task_type_name",
  task_description: "t.task_description",
  weightage_value: "wt.weightage_value",
  category_name: "tc.category_name"
}

export const validColumnsForFilters: Record<string, string> = {
  r_number: "t.r_number",
  task_name: "t.task_name",
  milestone_template_rid: "t.milestone_template_rid",
  checklist_template_rid: "t.checklist_template_rid",
  priority_rid: "t.priority_rid",
  status_rid: "t.status_rid",
  case_team_member_role_rid: "t.case_team_member_role_rid",
  effective_start_datetime: "t.effective_start_datetime",
  effective_end_datetime: "t.effective_end_datetime",
  effort_in_days: "t.effort_in_days",
  created_datetime: "t.created_datetime",
  modified_datetime: "t.modified_datetime",
  created_by_name: "CONCAT(u.first_name,' ', u.last_name)",
  updated_by_name: "CONCAT(uu.first_name,' ', uu.last_name)",
  sequence_no: "t.sequence_no",
  task_type_rid: "t.task_type_rid",
  task_description: "t.task_description",
  weightage_rid: 't.weightage_rid',
  task_category_rid: "t.task_category_rid"
}

export const validFilterColumnTypes: Record<string, string> = {
  r_number: "string",
  task_name: "string",
  milestone_template_rid: "string",
  checklist_template_rid: "string",
  priority_rid: "string",
  status_rid: "string",
  case_team_member_role_rid: "string",
  effective_start_datetime: "date",
  effective_end_datetime: "date",
  effort_in_days: "number",
  created_datetime: "date",
  modified_datetime: "date",
  created_by_name: "string",
  updated_by_name: "string",
  sequence_no: "number",
  task_type_rid: "string",
  task_description: "string",
  weightage_rid: "string",
  task_category_rid: "string"
}

export const sortByColumnsCaseTask: any = {
  task_name: `task_name`,
  effective_start_datetime: `effective_start_datetime`,
  effective_end_datetime: `effective_end_datetime`
}

export const filterColumnsCaseTask = {
  task_name: `task_name`,
  assigned_to: `assigned_to`,
  effective_start_datetime: `effective_start_datetime`,
  effective_end_datetime: `effective_end_datetime`,
  task_status_rid: `task_status_rid`,
  role_rid: "role_rid"
}

export const filterColumnsCaseTaskTypes: any = {
  task_name: `string`,
  assigned_to: `string`,
  effective_start_datetime: `date`,
  effective_end_datetime: `date`,
  task_status_rid: `string`,
  role_rid: `string`
}

export const relationshipTypes = {
  blocks: "Blocks",
  enables: "Enables",
  isBlockedBy: "Is Blocked By",
  isEnabledBy: "Is Enabled By"
}

export const emailCategorties = {
  "review_projects": "Review Projects",
  "general": "General"
}

export const activityStatus = {
  completed: "Completed",
  scheduled: "Scheduled",
};
export const computationStatus = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
}

export const ruleTemplateNames = {
  caseCreated: "case_create",
  statusUpdated:"task_status_update",
  taskCreated:"task_create",
  assigneeChanged:"task_assignee_change"
}

export const ruleNames = {
  caseCreated: "Case Event",
  taskCreated: "Task Event",
}

export const entityNames = {
  case: "Case",
  task: "Task",
}


export const activityTypes = {
  email: "Email",
  meeting: "Meeting",
  call: "Call",
  task: "Task",
};


// Common fields for activity select queries
export const meetingFields = [
  "a.rid",
  "a.subject",
  "a.body_html",
  "a.created_by",
  "a.modified_by",
  "a.account_rid",
  "a.created_datetime",
  "a.modified_datetime",
  "a.fiscal_year",
  "e.name AS attached_to",
  "a.attachment_level",
  "a.r_number",
  "a.attach_to",
  "a.status_rid",
  "a.meeting_invite",
  "a.meeting_id",
  "a.meeting_participants",
  "a.activity_type",
  "a.recurrence_days",
  "a.recurrence_interval",
  "a.recurrence_type",
  "a.effective_end_datetime",
  "a.effective_start_datetime",
  "a.effective_end_time",
  "a.effective_start_time",
  "a.recurrence_monthly_index",
  "a.recurrence_day_of_month",

];

export const callFields = [
  "a.rid",
  "a.subject",
  "a.created_by",
  "a.modified_by",
  "a.account_rid",
  "a.created_datetime",
  "a.modified_datetime",
  "a.fiscal_year",
  "e.name AS attached_to",
  "a.attachment_level",
  "a.r_number",
  "a.attach_to",
  "a.status_rid",
  "a.call_participants",
  "a.caller_id",
  "a.minutes_of_meeting",
  "a.call_platform",
  "a.activity_type",
  "a.effective_start_datetime",
  "a.effective_end_datetime",

];

export const mainTableFiltersForCase: Record<any, any> = {
  role_name: "role_name",
  task_status_name: "task_status_name",
  assigned_to_name: "assigned_to_name"
}

export const onlyFederals = {
  usa : "USA",
  canada : "CAN"
}