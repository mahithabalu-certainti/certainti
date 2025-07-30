export const MAIN_SCHEMA_NAME = "trd365"

export const constants = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,//For inactive_users
  FAILED: 500,
  UNAUTHORIZED: 401,//For users with no permssion_access
  SUCCESS_MESSAGE: "Success",
  BAD_REQUEST_MESSAGE: "BadRequest",
  NOT_FOUND_MESSAGE: "NotFound",
  FAILED_MESSAGE: "Failed",
  UNAUTHORIZED_MESSAGE: "Unauthorized",
  FORBIDDEN_MESSAGE: "Forbidden",

  ENV_TRD365: "TRD365",
  ENV_EA: "EA",

  SQL_GET_USER: `SELECT status_description as status, "user".rid, email, profile_rid FROM ${MAIN_SCHEMA_NAME}."user" as "user" ,${MAIN_SCHEMA_NAME}."status" as status WHERE  "user".status_rid = status.rid and {whereClause} LIMIT 1`,
  SQL_GET_PERMISSION: `SELECT rid FROM ${MAIN_SCHEMA_NAME}."module_permission" WHERE permission_name = :permissionName LIMIT 1`,
  SQL_GET_PROFILE_ACCESS: `SELECT is_enabled FROM ${MAIN_SCHEMA_NAME}."profile_permission_access" WHERE profile_id = :profileId AND module_permission_id = :permissionId LIMIT 1`,
  SQL_GET_USER_ACCESS: `SELECT is_enabled FROM ${MAIN_SCHEMA_NAME}."user_permission_access" WHERE user_id = :userId AND module_permission_id = :permissionId LIMIT 1`,
  SQL_INSERT_API_DENIAL: `INSERT INTO ${MAIN_SCHEMA_NAME}."user_api_access_denials" (rid, user_id, permission_id, permission_name, api_endpoint, created_datetime, updated_datetime) VALUES (:rid, :userId, :permissionId, :permissionName, :apiEndpoint, NOW(), NOW())`,
  SQL_GET_ACCOUNT: `SELECT rid,parent_account_rid,is_parent FROM ${MAIN_SCHEMA_NAME}."account" WHERE {whereClause}  LIMIT 1`,
  SQL_GET_USER_PROJECTS : `
  SELECT
    ps.project_rid,
    ps.project_name,
    ps.project_code,
    ps.account_rid,
    
    -- Access resolution (EXCLUDE takes precedence)
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM ${MAIN_SCHEMA_NAME}.user_group_entity_access ex
        WHERE ex.entity_rid = ps.project_rid
          AND ex.entity_type = 'PROJECT'
          AND ex.access_type = 'EXCLUDE'
          AND (
            ex.user_rid = :entity_rid
            OR ex.group_rid IN (
              SELECT group_rid FROM ${MAIN_SCHEMA_NAME}.user_group_mapping
              WHERE user_rid = :entity_rid
            )
          )
      ) THEN false
      WHEN EXISTS (
        SELECT 1
        FROM ${MAIN_SCHEMA_NAME}.user_group_entity_access inc
        WHERE inc.entity_rid = ps.project_rid
          AND inc.entity_type = 'PROJECT'
          AND inc.access_type = 'INCLUDE'
          AND (
            inc.user_rid = :entity_rid
            OR inc.group_rid IN (
              SELECT group_rid FROM ${MAIN_SCHEMA_NAME}.user_group_mapping
              WHERE user_rid = :entity_rid
            )
          )
      ) THEN true
      ELSE false
    END AS has_access,
    
    -- Group-based access flag (true only if access is exclusively through groups)
    EXISTS (
      SELECT 1
      FROM ${MAIN_SCHEMA_NAME}.user_group_mapping ugm
      JOIN ${MAIN_SCHEMA_NAME}.user_group_entity_access uga
        ON uga.group_rid = ugm.group_rid
        AND uga.entity_rid = ps.project_rid
        AND uga.entity_type = 'PROJECT'
      WHERE ugm.user_rid = :entity_rid
    )  AS is_grouped
    
  FROM ${MAIN_SCHEMA_NAME}.project_summary ps
  WHERE {whereClauses}
  {orderByClause}
  LIMIT :limit OFFSET :offset
`,
  SQL_GET_PROJECTS : `
      SELECT 
        ps.project_rid,
        ps.project_name,
         ps.project_code,
        ps.account_rid,
        uga.access_type,
        (uga.access_type = 'INCLUDE') AS has_access
        {isGroupedSelect}
      FROM ${MAIN_SCHEMA_NAME}.project_summary ps
      {extraJoin}
      LEFT JOIN ${MAIN_SCHEMA_NAME}.user_group_entity_access uga
        ON uga.entity_rid = ps.project_rid
        AND uga.entity_type = 'PROJECT'
        AND {joinCondition}
      WHERE {whereClauses}
      {orderByClause}
      LIMIT :limit OFFSET :offset
`,
  SQL_GET_ALL_PROJECTS_OF_ACCOUNT: `
    SELECT distinct
      ps.project_rid,
      ps.project_name,
      ps.project_code,
      ps.account_rid,
      acc.account_name,
      CASE 
        WHEN uga.rid IS NOT NULL AND uga.access_type != 'EXCLUDE' THEN true
        ELSE false
      END as has_access,
      uga.access_type
    FROM ${MAIN_SCHEMA_NAME}.project_summary ps
     LEFT JOIN trd365.account acc
      ON acc.rid = ps.account_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.user_group_entity_access uga 
      ON uga.entity_rid = ps.project_rid 
      AND uga.entity_type = 'PROJECT'
      AND uga.group_rid = :group_rid -- only works if group_rid is provided
    WHERE {whereClauses}
    {orderByClause}
    LIMIT :limit OFFSET :offset
  `,
  SQL_GET_ALL_PROJECTS_OF_ACCOUNT_COUNT : `SELECT COUNT(DISTINCT ps.project_rid) as total_count
      FROM ${MAIN_SCHEMA_NAME}.project_summary ps
      WHERE {whereClauses}`,
  SQL_GET_PROJECTS_COUNT : `SELECT COUNT(*) as total_count
    FROM ${MAIN_SCHEMA_NAME}.project_summary ps
    {extraJoin}
    LEFT JOIN ${MAIN_SCHEMA_NAME}.user_group_entity_access uga
      ON uga.entity_rid = ps.rid
      AND uga.entity_type = 'PROJECT'
     AND {joinCondition}
    WHERE {whereClauses}`,
  SQL_GET_DEFAULT_ACCOUNT:`SELECT rid, account_name, true as has_access FROM ${MAIN_SCHEMA_NAME}.account`,
  SQL_GET_SELECTED_ACCOUNT_ACCESS:  `SELECT a.rid, a.account_name,
            CASE WHEN uga.account_rid IS NOT NULL THEN true ELSE false END as has_access
     FROM ${MAIN_SCHEMA_NAME}.account a
     JOIN ${MAIN_SCHEMA_NAME}.user_group_account_mapping uga 
     ON uga.account_rid = a.rid AND uga.group_rid = :group_rid`,
  SQL_GET_DEFAULT_PROJECT_ACCESS:`SELECT rid, project_name,project_code ,true as has_access FROM ${MAIN_SCHEMA_NAME}.project_summary`,
  SQL_GET_SELECTED_PROJECT_ACCESS: `SELECT 
      ps.project_rid,
      ps.project_name,
      ps.project_code,
      ps.account_rid,
      acc.account_name,
      CASE 
        WHEN uga.rid IS NOT NULL AND uga.access_type != 'EXCLUDE' THEN true
        ELSE false
      END as has_access,
      uga.access_type
    FROM ${MAIN_SCHEMA_NAME}.project_summary ps
     LEFT JOIN trd365.account acc
      ON acc.rid = ps.account_rid
    INNER JOIN ${MAIN_SCHEMA_NAME}.user_group_entity_access uga 
      ON uga.entity_rid = ps.project_rid 
      AND uga.entity_type = 'PROJECT'
      AND uga.group_rid = :group_rid`,
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

export const rawQuery = {
  fetchUserByIdForGraphql (user_rid : string) {
    return `
    SELECT u.rid, u.email, u.status_rid, u.first_name, u.created_datetime, 
    u.modified_datetime, u.azure_id,
    jsonb_build_object(
    'rid', p.rid,
    'profile_name', p.profile_name
    ) AS profile,
    jsonb_build_object(
    'rid', b.rid,
    'business_teams', b.business_teams
    ) AS business_teams,
    jsonb_build_object(
    'status_name', s.status_name,
    'status_description', s.status_description
    ) AS status
    
    FROM 
    ${MAIN_SCHEMA_NAME}.user u
    LEFT JOIN ${MAIN_SCHEMA_NAME}.business_teams b ON b.rid = u.role_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.profile p ON p.rid = u.profile_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.status s ON s.rid = u.status_rid

    WHERE
    u.rid = '${user_rid}'
    `
  }
}

export const ENV_PREFIX = process.env.NODE_ENV_DB_PREFIX || 'D001-';