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
  keyContactIdMissing : "Key-Contact Id is missing",
  accountUpdateFailed : "Account updation failed",
  invalidStatus : "Invalid Status. Status should either Active/In-Active.",
  noDataToUpdate : "Data is requried to update",
  storeInParent : "store_in_parent"
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
  },
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
   SQL_GET_GROUP_TYPE: `SELECT rid FROM "${MAIN_SCHEMA_NAME}"."user_group_type" WHERE type = :group_type_name LIMIT 1`,
   SQL_GET_EX_GROUP_DATA:`SELECT ug.rid, ug.group_name
   FROM "${MAIN_SCHEMA_NAME}"."user_groups" ug
   JOIN "${MAIN_SCHEMA_NAME}"."user_group_account_mapping" ugam
     ON ug.rid = ugam.group_rid
   JOIN "${MAIN_SCHEMA_NAME}"."user_group_type" ugt
     ON ug.group_type_rid = ugt.rid
   WHERE ugam.account_rid = :account_rid
     AND ugt.type = :group_type_name
   LIMIT 1`,
   UPDATE_GROUP_NAME: `UPDATE trd365.user_groups SET group_name = :group_name WHERE rid = :group_rid`,
   CREATE_AUTO_ASSIGNED_GROUP:`INSERT INTO "${MAIN_SCHEMA_NAME}"."user_groups" (group_name, group_type_rid, created_by)
      VALUES (:group_name, :group_type_rid, :created_by) RETURNING rid`,
   CREATE_ENTITY_ACCESS: `INSERT INTO "${MAIN_SCHEMA_NAME}"."user_group_entity_access" (
            group_rid, entity_type, entity_rid, access_type, created_by, created_datetime
          )
          VALUES (
            :group_rid, 'ACCOUNT', :entity_rid, 'INCLUDE', :created_by, NOW()
          )
          `,
   CREATE_ACCOUNT_MAPPING:  `INSERT INTO "${MAIN_SCHEMA_NAME}"."user_group_account_mapping" (
        group_rid, account_rid, created_by
      )
      VALUES (
        :group_rid, :account_rid, :created_by
      )
      `,
   GET_PARENT_USER_GROUP_TYPE:` SELECT ug.rid AS group_rid
        FROM "${MAIN_SCHEMA_NAME}"."user_groups" ug
        JOIN "${MAIN_SCHEMA_NAME}"."user_group_account_mapping" ugam ON ug.rid = ugam.group_rid
        JOIN "${MAIN_SCHEMA_NAME}"."user_group_type" ugt ON ug.group_type_rid = ugt.rid
        WHERE ugam.account_rid = :parent_account_rid
          AND ugt.type = 'AUTO_ASSIGNED_PARENT'`,
    GET_USER_GROUP_TYPE:`
      SELECT type group_type
      FROM ${MAIN_SCHEMA_NAME}.user_groups ug
      JOIN ${MAIN_SCHEMA_NAME}.user_group_mapping ugm ON ug.rid = ugm.group_rid 
      JOIN ${MAIN_SCHEMA_NAME}.user_group_type ugt ON ugt.rid = ug.group_type_rid
      WHERE ugm.user_rid = :userRid
      LIMIT 1`,
    GET_ACCOUNT_DIRECT_ACCESS_USER_IDS:`SELECT 
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
    GET_GROUP_ACCESS:  `
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
      GET_USER_PROFILE:`SELECT profile_rid FROM ${MAIN_SCHEMA_NAME}.user WHERE rid = :userId LIMIT 1`,
      GET_PROFILE_PERMISSION: `
      SELECT pf.field_desc, pf.field_name, pfa.read, pfa.edit
      FROM ${MAIN_SCHEMA_NAME}.profile_fields_access pfa
      JOIN ${MAIN_SCHEMA_NAME}.permission_fields pf ON pfa.permission_field_id = pf.rid
      JOIN ${MAIN_SCHEMA_NAME}.module_permission mp ON pf.module_permission_id = mp.rid
      WHERE mp.permission_name = :permissionName
        AND pfa.profile_id = :profileId`,
      GET_USER_EXTENDED_PERMISSION:`
      SELECT pf.field_desc, pf.field_name, ufa.read, ufa.edit
      FROM ${MAIN_SCHEMA_NAME}.user_fields_access ufa
      JOIN ${MAIN_SCHEMA_NAME}.permission_fields pf ON ufa.permission_field_id = pf.rid
      JOIN ${MAIN_SCHEMA_NAME}.module_permission mp ON pf.module_permission_id = mp.rid
      WHERE mp.permission_name = :permissionName
        AND ufa.user_id = :userId` 
}

export const DEFAULT_ACCOUNT_DETAILS = {
  fiscalStart : "04/01",
  fiscalEnd : "03/31",
  maxAiInteraction : 5
}