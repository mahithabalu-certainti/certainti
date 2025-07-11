export const HttpStatus = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  FAILED: 500,
  UNAUTHORIZED: 401,
  SUCCESS_MESSAGE: "Success",
  BAD_REQUEST_MESSAGE: "BadRequest",
  NOT_FOUND_MESSAGE: "NotFound",
  FORBIDDEN_MESSAGE: "Forbidden",
  FAILED_MESSAGE: "Failed",
  UNAUTHORIZED_MESSAGE: "Unauthorized",
};
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
  SELECT: 'SELECT',
  INSERT: 'INSERT'
}

export const R_NUMBER_PREFIX = {
  ACCOUNT: 'ACC',
  COUNTRY: 'CON',
  DATABASE_CONNECTION: 'DBC',
  INDUSTRY: 'IDU',
  REGION: 'REG',
  STATE: 'STA',
  PROJECT_SUMMARY: 'PRS',
  KEY_CONTACT_DETAILS: 'KEY'
}


export const ENV_PREFIX = process.env.NODE_ENV_DB_PREFIX || 'D001-';

export const STATUS = {
  active : 'Active',
  inactive : 'In-Active'
}

export const STATUS_MESSAGE = {
  accountInactive : "Inactive Account",
  accountNoFound : "Account not found",
  accountUpdateSuccess : "Account updated successfully",
  accountIdMissing : "Account Id mising",
  oneFieldRequired : "Atleast one field is required to update",
  keyContactIdMissing : "Key-Contact Id is missing"
}

export const rawQueries = {
  fetchAccountDetails (schemaName : string, accountRid : string) {
    return `SELECT * FROM ${schemaName}.account_details WHERE account_rid = '${accountRid}'`
  },
  updateAccDetails (schemaName : string, updatedColumns : any, accountRid : string) {
    return `UPDATE ${schemaName}.account_details SET ${updatedColumns.join(',')} WHERE account_rid = '${accountRid}'`
  },
  fetchKeyContactDetailsByRid (schemaName : string, keyContactRid : string) {
    return `SELECT * FROM ${schemaName}.key_contact_details WHERE rid = '${keyContactRid}'`
  },
  updateKeyContactDetails (schemaName : string, updatedKeyData : any, keyContactDetailsRid : string) {
    return `UPDATE ${schemaName}.key_contact_details 
              SET 
                ${updatedKeyData.join(',')}
              WHERE 
                 rid = '${keyContactDetailsRid}'`
  },
  fetchAccountForInlineRespone (account_rid : string) {
    return `
    WITH fetch_parent_account AS (
      SELECT a.parent_account_rid, aa.account_name 
      FROM ${MAIN_SCHEMA_NAME}.account a 
      LEFT JOIN ${MAIN_SCHEMA_NAME}.account aa ON aa.rid = a.parent_account_rid
      WHERE 
      a.rid = '${account_rid}')
    SELECT 
        a.rid, a.account_name, a.currency_rid, a.total_project_hours,
        a.total_projects, a.total_project_cost, a.total_projects_rd_credits,
        a.qualifying_project_hours_fed, a.qualifying_project_qre_fed,
        a.qualifying_project_rd_credits_fed, a.r_number, a.storage_type,
        a.professional_services_consultant, a.finance_lead, a.finance_executive,
        a.industry_name_other,
        jsonb_build_object(
        'rid', c.rid,
        'country_name', c.country_name
        ) AS country,
        jsonb_build_object(
        'rid', cu.rid,
        'created_by', cu.created_by,
        'modified_by', cu.modified_by,
        'created_datetime', cu.created_datetime,
        'modified_datetime', cu.modified_datetime,
        'currency_code', cu.currency_code,
        'currency_name', cu.currency_name,
        'currency_symbol', cu.currency_symbol
        ) AS currency,
        jsonb_build_object(
        'rid', i.rid,
        'industry_name', i.industry_name
        ) AS industry,
        jsonb_build_object(
        'status_name', s.status_name
        ) AS status,
        jsonb_build_object(
        'rid', a.parent_account_rid,
        'account_name', aa.account_name
        ) AS parent_account

        FROM ${MAIN_SCHEMA_NAME}.account a
        LEFT JOIN ${MAIN_SCHEMA_NAME}.country c ON c.rid = a.country_rid
        LEFT JOIN ${MAIN_SCHEMA_NAME}.currency cu ON cu.rid = a.currency_rid
        LEFT JOIN ${MAIN_SCHEMA_NAME}.industry i ON i.rid = a.industry_rid
        LEFT JOIN ${MAIN_SCHEMA_NAME}.status s ON s.rid = a.status_rid
        LEFT JOIN fetch_parent_account aa ON a.parent_account_rid = aa.parent_account_rid
        WHERE
        a.rid = '${account_rid}'
        `
  }
}