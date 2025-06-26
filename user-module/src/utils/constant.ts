export const constants = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  FAILED: 500,
  UNAUTHORIZED: 401,
  SUCCESS_MESSAGE: "Success",
  BAD_REQUEST_MESSAGE: "BadRequest",
  NOT_FOUND_MESSAGE: "NotFound",
  FAILED_MESSAGE: "Failed",
  UNAUTHORIZED_MESSAGE: "Unauthorized",
  FORBIDDEN_MESSAGE: "Forbidden",

  ENV_TRD365: "TRD365",
  ENV_EA: "EA",

  SQL_GET_USER: `SELECT status_description as status, "user".rid, email, profile_rid FROM public."user" as "user" ,public."status" as status WHERE  "user".status_rid = status.rid and {whereClause} LIMIT 1`,
  SQL_GET_PERMISSION: `SELECT rid FROM public."module_permission" WHERE permission_name = :permissionName LIMIT 1`,
  SQL_GET_PROFILE_ACCESS: `SELECT is_enabled FROM public."profile_permission_access" WHERE profile_id = :profileId AND module_permission_id = :permissionId LIMIT 1`,
  SQL_GET_USER_ACCESS: `SELECT is_enabled FROM public."user_permission_access" WHERE user_id = :userId AND module_permission_id = :permissionId LIMIT 1`,
  SQL_INSERT_API_DENIAL: `INSERT INTO public."user_api_access_denials" (rid, user_id, permission_id, permission_name, api_endpoint, created_datetime, updated_datetime) VALUES (:rid, :userId, :permissionId, :permissionName, :apiEndpoint, NOW(), NOW())`,
  SELECT: 'SELECT',
  INSERT: 'INSERT'
} as const;

export const NODE_ENV = {
  DEV: "DEV",
  PROD: "PRODUCTION"
}

export const R_NUMBER_PREFIX = {
  USER: 'UID',
  PROFILE: 'PRF',
}


export const ENV_PREFIX = process.env.NODE_ENV_DB_PREFIX || 'D001-';