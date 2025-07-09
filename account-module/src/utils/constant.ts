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

export const TYPES_FLAG = {
  parent : "parent",
  child : "child"
}

export const FLAG = {
  restAPI : "restAPI",
  graphql : "graphql"
}

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
  fetchAccountWithRelevantData (schemaName : string, account_rid : string) {
    return `
    SELECT 
      account_rid, account_name, max_ai_interactions,
      autosend_interaction, fiscal_start_date, fiscal_end_date,
      website, data_storage AS storage_type, business_details
    FROM
      ${schemaName}.account_details
    WHERE account_rid = '${account_rid}'
    `
  },
  fetchCountry (rid : string) {
    return `SELECT rid, country_name FROM ${MAIN_SCHEMA_NAME}.country WHERE rid = '${rid}'`
  },
  fetchIndustry (rid : string) {
    return `SELECT rid, industry_name FROM ${MAIN_SCHEMA_NAME}.industry WHERE rid = '${rid}'`
  },
  fetchCurrency (rid : string) {
    return `SELECT rid, currency_code, currency_name, currency_symbol FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid = '${rid}'`
  }
}