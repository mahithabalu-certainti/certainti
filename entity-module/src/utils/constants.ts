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
  SQL_GET_USER: `SELECT status_description as status, "user".rid, email, profile_rid FROM ${MAIN_SCHEMA_NAME}."user" as "user" ,public."status" as status WHERE  "user".status_rid = status.rid and {whereClause} LIMIT 1`,
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
  PROJECT: 'PRJ',
  PROJECT_FISCAL: 'PFI',
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
  PROJECT_SUMMARY: 'PRS',
  PROJECT_FISCAL_SUMMARY: 'PFS',
  CLASSIFICATION: 'CSF',
  KEY_CONTACT_DETAILS: 'KEY'
}