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
};

export const STATUS_MESSAGE = {
  caseCreated: "Case created successfully",
  caseTeamCreated: "Case team updated successfully",
  caseUpdated: "Case updated successfully",
  caseCreationFailed: "Case creation failed",
  caseTeamCreationFailed: "Case team creation failed",
  separateDb: "SEPARATE_DB",
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
  adminChecklistCreated: "Admin checklist created successfully",
  adminChecklistFailed: "Admin checklist creation failed",
  taskNameExistsAlready : "Taskname already exists",
  taskCreatedSuccess : "Task Template created successfully",
  casePrioritySuccess : "Priority fetched successfully",
  milestonesSuccess : "Milestones fetched successfully",
  checklistSuccess : "Checklist fetched successfully"
};

export const caseStatuses = {
  INPROGRESS: "In Progress",
  REOPENED: "Reopened",
  SUBMITTED: "Submitted",
  CLOSED: "Closed",
};

export const casesFieldMappings = [
  {
    permissionField: "r_number",
    exportField: "Case ID",
    dataField: "r_number",
  },
  {
    permissionField: "filing_type_rid",
    exportField: "Filing Type",
    dataField: "filing_type_name",
  },
  {
    permissionField: "case_name",
    exportField: "Case Name",
    dataField: "case_name",
  },
  {
    permissionField: "fiscal_year",
    exportField: "Fiscal Year",
    dataField: "fiscal_year",
  },
  {
    permissionField: "case_owner_rid",
    exportField: "Case Owner",
    dataField: "case_owner_name",
  },
  {
    permissionField: "case_total_project_cost",
    exportField: "Total Project Cost",
    dataField: "case_total_project_cost",
  },
  {
    permissionField: "case_total_qre_cost",
    exportField: "Total QRE",
    dataField: "case_total_qre_cost",
  },
  {
    permissionField: "case_total_rd_cost",
    exportField: "Total RD Credits",
    dataField: "case_total_rd_cost",
  },
  {
    permissionField: "case_total_projects",
    exportField: "No of Projects",
    dataField: "case_total_projects",
  },
  {
    permissionField: "case_total_qualified_projects",
    exportField: "No of Qualified Projects",
    dataField: "case_total_qualified_projects",
  },
  // { permissionField: 'created_by', exportField: 'Created By', dataField: 'created_by' },
  {
    permissionField: "created_datetime",
    exportField: "Created On",
    dataField: "created_datetime",
  },
  {
    permissionField: "submitted_datetime",
    exportField: "Submitted On",
    dataField: "submitted_datetime",
  },
  {
    permissionField: "approved_datetime",
    exportField: "Approved On",
    dataField: "approved_datetime",
  },

  {
    permissionField: "status_rid",
    exportField: "Status",
    dataField: "status_name",
  },
  //{ permissionField: 'modified_by', exportField: 'Updated By', dataField: 'modified_by' },
  //{ permissionField: 'modified_datetime', exportField: 'Updated On', dataField: 'modified_datetime' }
];

export const casesSummaryFieldMappings = [
  {
    permissionField: "r_number",
    exportField: "Case ID",
    dataField: "r_number",
  },
  {
    permissionField: "account_name",
    exportField: "Account Name",
    dataField: "account_name",
  },
  {
    permissionField: "filing_type_rid",
    exportField: "Filing Type",
    dataField: "filing_type_name",
  },
  {
    permissionField: "case_name",
    exportField: "Case Name",
    dataField: "case_name",
  },
  {
    permissionField: "fiscal_year",
    exportField: "Fiscal Year",
    dataField: "fiscal_year",
  },
  {
    permissionField: "country_rid",
    exportField: "Country",
    dataField: "country_name",
  },
  {
    permissionField: "case_owner_rid",
    exportField: "Case Owner",
    dataField: "case_owner_name",
  },
  {
    permissionField: "case_total_project_cost",
    exportField: "Total Project Cost",
    dataField: "case_total_project_cost",
  },
  {
    permissionField: "case_total_qre_cost",
    exportField: "Total QRE",
    dataField: "case_total_qre_cost",
  },
  {
    permissionField: "case_total_rd_cost",
    exportField: "Total RD Credits",
    dataField: "case_total_rd_cost",
  },
  {
    permissionField: "case_total_projects",
    exportField: "No of Projects",
    dataField: "case_total_projects",
  },
  {
    permissionField: "case_total_qualified_projects",
    exportField: "No of Qualified Projects",
    dataField: "case_total_qualified_projects",
  },
  {
    permissionField: "created_datetime",
    exportField: "Created On",
    dataField: "created_datetime",
  },
  {
    permissionField: "submitted_datetime",
    exportField: "Submitted On",
    dataField: "submitted_datetime",
  },
  {
    permissionField: "approved_datetime",
    exportField: "Approved On",
    dataField: "approved_datetime",
  },
  {
    permissionField: "status_rid",
    exportField: "Status",
    dataField: "status_name",
  },
];

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
  fetchUser(data: any) {
    let ids = data.map((d: any) => `'${d}'`);
    return `
    SELECT rid, first_name, last_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (${ids})`;
  },
  fetchAccountAndCountryDetails(accountRid: string) {
    return `SELECT r_number, account_name, country_rid,c.country_code, currency_rid FROM ${MAIN_SCHEMA_NAME}.account 
    LEFT JOIN ${MAIN_SCHEMA_NAME}.country c ON c.rid = account.country_rid
    WHERE account.rid = '${accountRid}'`;
  },
  fetchCountryByAccountId(accountRid: string) {
    return `SELECT country_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`;
  },
  fetchStatus(statusIds: any): string {
    let ids = statusIds.map((d: any) => `'${d}'`);
    return `
    SELECT rid, status_name as name FROM ${MAIN_SCHEMA_NAME}.case_status WHERE rid IN (${ids})`;
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
  getCaseStatus() {
    return `
      SELECT rid, status_name 
      FROM ${MAIN_SCHEMA_NAME}.case_status
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
      SELECT u.rid, CONCAT(u.first_name, ' ', u.last_name) AS name
      FROM ${MAIN_SCHEMA_NAME}.user u
	  where is_consultant_firm is true
	  or org_id = '${accountRid}'
    AND u.status_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_description = 'active')
	  order by name asc`
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
    return `SELECT r_number, account_name, rid, country_rid, currency_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`;
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
  getOwnerDetails(caseOwnerRid: any[]) {
    return `SELECT rid, CONCAT(first_name,' ',last_name) AS name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (${caseOwnerRid.map(
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
  getTotalProjectsCount(
    schemaName: string,
    caseRid: string,
    accountRid: string
  ) {
    return `SELECT COUNT(project_fiscal_rid) OVER() AS total_projects FROM ${schemaName}.case_projects WHERE case_rid = '${caseRid}' AND account_rid = '${accountRid}'`;
  },
  getTotalProjectCost(schemaName: string, caseRid: string, accountRid: string) {
    return `
    SELECT COALESCE(SUM(pf.total_cost_prj), 0) AS total_cost 
    FROM ${schemaName}.project_fiscal pf 
    LEFT JOIN ${schemaName}.case_projects cp ON cp.project_fiscal_rid = pf.rid
    WHERE
    cp.case_rid = '${caseRid}'
    AND
    cp.account_rid = '${accountRid}'
    `;
  },
  updateCostCountInCase(
    schemaName: string,
    caseRid: string,
    totalprojects: any,
    totalCost: any
  ) {
    return `UPDATE ${schemaName}.cases SET case_total_qualified_projects = ${totalprojects}, case_total_qualified_project_cost = ${totalCost} WHERE rid = '${caseRid}'`;
  },
  updateCostCountInCaseSummary(
    caseRid: string,
    totalprojects: any,
    totalCost: any
  ) {
    return `UPDATE ${MAIN_SCHEMA_NAME}.case_summary SET case_total_qualified_projects = ${totalprojects}, case_total_qualified_project_cost = ${totalCost} WHERE case_rid = '${caseRid}'`;
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
    FROM ${MAIN_SCHEMA_NAME}.case_milestones m
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_filing_type c ON c.rid = m.case_filing_type_rid
    ORDER BY r_number ASC
    `
  },
  getChecklistTypes() {
    return `SELECT rid, checklist_name FROM ${MAIN_SCHEMA_NAME}.checklist_template ORDER BY created_datetime ASC`
  },
};

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
  account_name: "string",
  fiscal_year: "number",
  createdAt: "datetime",
  case_owner_name: "string",
  filing_type_name: "string",
  case_name: "string",
  submitted_datetime: "datetime",
  approved_datetime: "datetime",
  case_total_project_cost: "number",
  case_total_qre_cost: "number",
  case_total_rd_cost: "number",
  case_total_projects: "number",
  case_total_qualified_projects: "number",
  country_name: "string",
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
  country_name: "country_name",
};
