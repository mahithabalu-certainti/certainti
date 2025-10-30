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

export const mainTableFilters : Record<any, any> = {
  created_user_name : "created_user_name",
  updated_user_name : "updated_user_name",
  status_name : "status_name",
  modified_by: "modified_by",
  modified_user_name:"modified_user_name",
  filing_type_name : "filing_type_name",
  case_owner_name : "case_owner_name"
}

export const STATUS_MESSAGE = {
  caseCreated: "Case created successfully",
  caseUpdated: "Case updated successfully",
  caseCreationFailed: "Case creation failed",
  separateDb: "SEPARATE_DB",
  caseDetailsFetchedSuccess : "Case details fetched successfully",
  dataNotAvailable : "Data not available",
  projectsFetchedSuccess : "Project fetched successfully",
  singleProjectAssignedSuccess : "Project assigned successfully",
  multipleProjectAssignedSuccess : "Projects assigned successfully",
  projectAssignFailed: "Project assign failed",
  projectAlreadyMapped : "Project already mapped to this case",
  singleProjectDeletedSuccess : "Project deleted successfully",
  multipleProjectDeletedSuccess : "Projects deleted successfully",
  projectNotAssigned : "Requested project not found"
};

export const caseStatuses = {
  INPROGRESS: "In Progress",
  REOPENED: "Reopened",
  SUBMITTED: "Submitted",
  CLOSED: "Closed"
};

export const casesFieldMappings = [
     
    { permissionField: 'r_number', exportField: 'Case ID', dataField: 'r_number' },
    { permissionField: 'filing_type_rid', exportField: 'Filing Type', dataField: 'filing_type_name' },
    { permissionField: 'case_name', exportField: 'Case Name', dataField: 'case_name' },
    { permissionField: 'fiscal_year', exportField: 'Fiscal Year', dataField: 'fiscal_year' },
    { permissionField: 'case_owner_rid', exportField: 'Case Owner', dataField: 'case_owner_name' },
    { permissionField: 'case_total_project_cost', exportField: 'Total Case Project Cost', dataField: 'case_total_project_cost' },
    { permissionField: 'case_total_qre_cost', exportField: 'Case Project QRE Cost', dataField: 'case_total_qre_cost' },
    { permissionField: 'case_total_rd_cost', exportField: 'Case Project RD Credit', dataField: 'case_total_rd_cost' },
   // { permissionField: 'created_by', exportField: 'Created By', dataField: 'created_by' },
    { permissionField: 'created_datetime', exportField: 'Created On', dataField: 'created_datetime' },
    { permissionField: 'submitted_datetime', exportField: 'Submitted On', dataField: 'submitted_datetime' },
    { permissionField: 'approved_datetime', exportField: 'Approved On', dataField: 'approved_datetime' },

    { permissionField: 'status_rid', exportField: 'Status', dataField: 'status_name' }
    //{ permissionField: 'modified_by', exportField: 'Updated By', dataField: 'modified_by' },
    //{ permissionField: 'modified_datetime', exportField: 'Updated On', dataField: 'modified_datetime' }
   
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
    fetchAccountDetails (accountRid : string) {
    return `SELECT r_number, account_name, rid, country_rid, currency_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`
  },
  getCaseFilingTypeById(filingTypeRid : string) {
    return `
      SELECT rid, filing_type_name 
      FROM ${MAIN_SCHEMA_NAME}.case_filing_type
      WHERE 
      status = 'active'
      AND
      rid = '${filingTypeRid}'
    `;
  },
  getCountryDetails (countryRid : string) {
    return `SELECT rid, country_name FROM ${MAIN_SCHEMA_NAME}.country WHERE rid = '${countryRid}'`
  },
  getOwnerDetails (caseOwnerRid : string) {
    return `SELECT rid, CONCAT(first_name,' ',last_name) AS name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid = '${caseOwnerRid}'`
  },  
  getCaseStatusDetails (statusRid : string) {
    return `SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.case_status WHERE rid = '${statusRid}'`
  },  
  getCurrencyDetails (currencyRid : string) {
    return `SELECT rid, currency_code FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid = '${currencyRid}'`
  },
  getPointOfContactId () {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.key_contact_role WHERE role_name = '${keyContactRole.pocName}'`
  },
  getTechnicalPointOfContactId () {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.key_contact_role WHERE role_name = '${keyContactRole.tPocName}'`
  },
  getProjectClassifications (rid : any[]) {
    if(rid.length > 0)
      return `SELECT rid, classification_name FROM ${MAIN_SCHEMA_NAME}.project_classification WHERE rid IN (${rid.map((d : any) => `'${d}'`).join(',')})`
    else {
      return `SELECT rid, classification_name FROM ${MAIN_SCHEMA_NAME}.project_classification WHERE rid IN ('')`
    }
  },
  getProjectTypes (rid : any[]) {
    if(rid.length > 0) {
      return `SELECT rid, project_type_name FROM ${MAIN_SCHEMA_NAME}.project_type WHERE rid IN (${rid.map((d : any) => `'${d}'`).join(',')})`
    } else {
      return `SELECT rid, project_type_name FROM ${MAIN_SCHEMA_NAME}.project_type WHERE rid IN ('')`
    }
  },
  getTotalProjectsCount (schemaName : string, caseRid : string, accountRid : string) {
    return `SELECT COUNT(project_fiscal_rid) OVER() AS total_projects FROM ${schemaName}.case_projects WHERE case_rid = '${caseRid}' AND account_rid = '${accountRid}'`
  },
  getTotalProjectCost(schemaName : string, caseRid : string, accountRid : string) {
    return `
    SELECT COALESCE(SUM(pf.total_cost_prj), 0) AS total_cost 
    FROM ${schemaName}.project_fiscal pf 
    LEFT JOIN ${schemaName}.case_projects cp ON cp.project_fiscal_rid = pf.rid
    WHERE
    cp.case_rid = '${caseRid}'
    AND
    cp.account_rid = '${accountRid}'
    `
  },
  updateCostCountInCase (schemaName : string, caseRid : string, totalprojects : any, totalCost : any) {
    return `UPDATE ${schemaName}.cases SET case_total_projects = ${totalprojects}, case_total_project_cost = ${totalCost} WHERE rid = '${caseRid}'`
  },
  updateCostCountInCaseSummary (caseRid : string, totalprojects : any, totalCost : any) {
    return `UPDATE ${MAIN_SCHEMA_NAME}.case_summary SET case_total_projects = ${totalprojects}, case_total_project_cost = ${totalCost} WHERE case_rid = '${caseRid}'`
  },
  updateCostCountInCaseForDelete (schemaName : string, caseRid : string, totalprojects : any, totalCost : any) {
    return `UPDATE ${schemaName}.cases SET case_total_projects = GREATEST(case_total_projects - ${totalprojects}, 0), case_total_project_cost = GREATEST(case_total_project_cost - ${totalCost}, 0) WHERE rid = '${caseRid}'`
  },
  updateCostCountInCaseSummaryFoDelete (caseRid : string, totalprojects : any, totalCost : any) {
    return `UPDATE ${MAIN_SCHEMA_NAME}.case_summary SET case_total_projects = GREATEST(case_total_projects - ${totalprojects}, 0), case_total_project_cost = GREATEST(case_total_projects - ${totalCost}, 0) WHERE case_rid = '${caseRid}'`
  }
};

const keyContactRole = {
  pocName : "Project Point of Contact",
  tPocName : "Project Technical Point of Contact"
}