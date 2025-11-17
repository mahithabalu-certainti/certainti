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
export const MAIN_SCHEMA_NAME = "trd365";

export const NODE_ENV = {
  DEV: "DEV",
  PROD: "PRODUCTION",
};

export const constants = {
  SQL_GET_USER: `SELECT status_description as status, "user".rid, email, profile_rid FROM ${MAIN_SCHEMA_NAME}."user" as "user" ,${MAIN_SCHEMA_NAME}."status" as status WHERE  "user".status_rid = status.rid and {whereClause} LIMIT 1`,
  SQL_GET_PERMISSION: `SELECT rid FROM ${MAIN_SCHEMA_NAME}."module_permission" WHERE permission_name = :permissionName LIMIT 1`,
  SQL_GET_PROFILE_ACCESS: `SELECT is_enabled FROM ${MAIN_SCHEMA_NAME}."profile_permission_access" WHERE profile_id = :profileId AND module_permission_id = :permissionId LIMIT 1`,
  SQL_GET_USER_ACCESS: `SELECT is_enabled FROM ${MAIN_SCHEMA_NAME}."user_permission_access" WHERE user_id = :userId AND module_permission_id = :permissionId LIMIT 1`,
  SQL_INSERT_API_DENIAL: `INSERT INTO ${MAIN_SCHEMA_NAME}."user_api_access_denials" (rid, user_id, permission_id, permission_name, api_endpoint, created_datetime, updated_datetime) VALUES (:rid, :userId, :permissionId, :permissionName, :apiEndpoint, NOW(), NOW())`,
  SELECT: "SELECT",
  INSERT: "INSERT",
};

export const R_NUMBER_PREFIX = {
  ACCOUNT: "ACC",
  COUNTRY: "CON",
  DATABASE_CONNECTION: "DBC",
  INDUSTRY: "IDU",
  REGION: "REG",
  STATE: "STA",
  PROJECT_SUMMARY: "PRS",
  KEY_CONTACT_DETAILS: "KEY",
};

export const ENV_PREFIX = process.env.NODE_ENV_DB_PREFIX || "D001-";

export const SCHEMANAME_PREFIX = "trd365_";

export const STATUS = {
  active: "Active",
  inactive: "In-Active",
};

export const STATUS_MESSAGE = {
  accountInactive: "Inactive Account",
  accountNoFound: "Account not found",
  accountUpdateSuccess: "Account updated successfully",
  accountIdMissing: "Account Id mising",
  oneFieldRequired: "Atleast one field is required to update",
  keyContactIdMissing: "Key-Contact Id is missing",
  accountUpdateFailed: "Account updation failed",
  invalidStatus: "Invalid Status. Status should either Active/In-Active.",
  noDataToUpdate: "Data is requried to update",
  storeInParent: "store_in_parent",
};

export const rawQueries = {
  fetchAccountDetails(schemaName: string, accountRid: string) {
    return `SELECT * FROM ${schemaName}.account_details WHERE account_rid = '${accountRid}'`;
  },
  updateAccDetails(
    schemaName: string,
    updatedColumns: any,
    accountRid: string
  ) {
    return `UPDATE ${schemaName}.account_details SET ${updatedColumns.join(
      ","
    )} WHERE account_rid = '${accountRid}'`;
  },
  fetchKeyContactDetailsByRid(schemaName: string, keyContactRid: string) {
    return `SELECT * FROM ${schemaName}.key_contact_details WHERE rid = '${keyContactRid}'`;
  },
  updateKeyContactDetails(
    schemaName: string,
    updatedKeyData: any,
    keyContactDetailsRid: string
  ) {
    return `UPDATE ${schemaName}.key_contact_details 
              SET 
                ${updatedKeyData.join(",")}
              WHERE 
                 rid = '${keyContactDetailsRid}'`;
  },
  fetchAccountForInlineRespone(account_rid: string) {
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
        `;
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
  SQL_GET_EX_GROUP_DATA: `SELECT ug.rid, ug.group_name
   FROM "${MAIN_SCHEMA_NAME}"."user_groups" ug
   JOIN "${MAIN_SCHEMA_NAME}"."user_group_account_mapping" ugam
     ON ug.rid = ugam.group_rid
   JOIN "${MAIN_SCHEMA_NAME}"."user_group_type" ugt
     ON ug.group_type_rid = ugt.rid
   WHERE ugam.account_rid = :account_rid
     AND ugt.type = :group_type_name
   LIMIT 1`,
  UPDATE_GROUP_NAME: `UPDATE ${MAIN_SCHEMA_NAME}.user_groups SET group_name = :group_name WHERE rid = :group_rid`,
  CREATE_AUTO_ASSIGNED_GROUP: `INSERT INTO "${MAIN_SCHEMA_NAME}"."user_groups" (group_name, group_type_rid, created_by)
      VALUES (:group_name, :group_type_rid, :created_by) RETURNING rid`,
  CREATE_ENTITY_ACCESS: `INSERT INTO "${MAIN_SCHEMA_NAME}"."user_group_entity_access" (
            group_rid, entity_type, entity_rid, access_type, created_by, created_datetime
          )
          VALUES (
            :group_rid, 'ACCOUNT', :entity_rid, 'INCLUDE', :created_by, NOW()
          )
          `,
  CREATE_ACCOUNT_MAPPING: `INSERT INTO "${MAIN_SCHEMA_NAME}"."user_group_account_mapping" (
        group_rid, account_rid, created_by
      )
      VALUES (
        :group_rid, :account_rid, :created_by
      )
      `,
  GET_PARENT_USER_GROUP_TYPE: ` SELECT ug.rid AS group_rid
        FROM "${MAIN_SCHEMA_NAME}"."user_groups" ug
        JOIN "${MAIN_SCHEMA_NAME}"."user_group_account_mapping" ugam ON ug.rid = ugam.group_rid
        JOIN "${MAIN_SCHEMA_NAME}"."user_group_type" ugt ON ug.group_type_rid = ugt.rid
        WHERE ugam.account_rid = :parent_account_rid
          AND ugt.type = 'AUTO_ASSIGNED_PARENT'`,
  GET_USER_GROUP_TYPE: `
      SELECT type group_type
      FROM ${MAIN_SCHEMA_NAME}.user_groups ug
      JOIN ${MAIN_SCHEMA_NAME}.user_group_mapping ugm ON ug.rid = ugm.group_rid 
      JOIN ${MAIN_SCHEMA_NAME}.user_group_type ugt ON ugt.rid = ug.group_type_rid
      WHERE ugm.user_rid = :userRid
      LIMIT 1`,
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
  GET_USER_PROFILE: `SELECT profile_rid FROM ${MAIN_SCHEMA_NAME}.user WHERE rid = :userId LIMIT 1`,
  GET_PROFILE_PERMISSION: `
      SELECT pf.field_desc, pf.field_name, pfa.read, pfa.edit
      FROM ${MAIN_SCHEMA_NAME}.profile_fields_access pfa
      JOIN ${MAIN_SCHEMA_NAME}.permission_fields pf ON pfa.permission_field_id = pf.rid
      JOIN ${MAIN_SCHEMA_NAME}.module_permission mp ON pf.module_permission_id = mp.rid
      WHERE mp.permission_name = :permissionName
        AND pfa.profile_id = :profileId`,
  GET_USER_EXTENDED_PERMISSION: `
      SELECT pf.field_desc, pf.field_name, ufa.read, ufa.edit
      FROM ${MAIN_SCHEMA_NAME}.user_fields_access ufa
      JOIN ${MAIN_SCHEMA_NAME}.permission_fields pf ON ufa.permission_field_id = pf.rid
      JOIN ${MAIN_SCHEMA_NAME}.module_permission mp ON pf.module_permission_id = mp.rid
      WHERE mp.permission_name = :permissionName
        AND ufa.user_id = :userId`,
  GET_IMPORT_ENTITY_TYPES: `SELECT rid, entity_name FROM ${MAIN_SCHEMA_NAME}.import_entity_types`,
  getActiveKeyContactRoleByIdQuery() {
    return `
      SELECT * 
      FROM ${MAIN_SCHEMA_NAME}.key_contact_role 
      WHERE rid = :key_contact_role 
        AND LOWER(role_status) = 'active'
    `;
  },
  getGrantSchemaUsageQuery(schemaName: string): string {
    return `GRANT USAGE ON SCHEMA ${schemaName} TO readonly_user;`;
  },
  getGrantSelectOnAllTablesQuery(schemaName: string): string {
    return `GRANT SELECT ON ALL TABLES IN SCHEMA ${schemaName} TO readonly_user;`;
  },
  getGrantSelectOnAllSequencesQuery(schemaName: string): string {
    return `GRANT SELECT ON ALL SEQUENCES IN SCHEMA ${schemaName} TO readonly_user;`;
  },
  getAlterDefaultPrivilegesForTablesQuery(schemaName: string): string {
    return `ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaName} GRANT SELECT ON TABLES TO readonly_user;`;
  },
  getAlterDefaultPrivilegesForSequencesQuery(schemaName: string): string {
    return `ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaName} GRANT SELECT ON SEQUENCES TO readonly_user;`;
  },
  getActiveKeyContactRolesByEntityTypeQuery(entityType: string) {
    return `
      SELECT * 
      FROM ${MAIN_SCHEMA_NAME}.key_contact_role 
      WHERE entity_type = '${entityType}' 
        AND LOWER(role_status) = 'active'
      ORDER BY role_name ASC;
    `;
  },
  getParentAccountByRidQuery() {
    return `
      SELECT * 
      FROM "${MAIN_SCHEMA_NAME}".account 
      WHERE rid = :parentAccountId
    `;
  },
  getFullNameByUserIdQuery() {
    return `
      SELECT first_name || ' ' || last_name AS full_name 
      FROM ${MAIN_SCHEMA_NAME}."user" 
      WHERE rid = :userId 
      LIMIT 1
    `;
  },
  getKeyContactsForAccountQuery(schemaName: string) {
    return `
      SELECT * 
      FROM "${schemaName}"."key_contact_details" 
      WHERE entity_rid = :account_rid 
        AND entity_type = 'Account'
    `;
  },
  getKeyContactRolesByIdsQuery() {
    return `
      SELECT rid, role_name 
      FROM ${MAIN_SCHEMA_NAME}.key_contact_role 
      WHERE rid IN (:ids)
    `;
  },
  getStatusesByIdsQuery() {
    return `
      SELECT rid, status_name 
      FROM ${MAIN_SCHEMA_NAME}.status 
      WHERE rid IN (:ids)
    `;
  },
  deleteKeyContactForAccountQuery(schemaName: string) {
    return `
      DELETE FROM "${schemaName}"."key_contact_details" 
      WHERE rid = :key_contact_id 
        AND entity_rid = :account_rid 
        AND entity_type = 'Account'
    `;
  },
  updateKeyContactForAccountQuery(schemaName: string) {
    return `
      UPDATE "${schemaName}"."key_contact_details"
      SET 
        key_contact_name = :key_contact_name,
        key_contact_email = :key_contact_email,
        key_contact_role = :key_contact_role_rid,
        status_rid = :status_rid,
        is_primary_contact = :is_primary_contact,
        interaction_cc_recipient = :interaction_cc_recipient,
        include_in_communication = :include_in_communication,
        modified_by = :modified_by
      WHERE entity_rid = :account_rid
        AND rid = :key_contact_id
        AND entity_type = 'Account'
    `;
  },
  insertKeyContactForAccountQuery(schemaName: string) {
    return `
      INSERT INTO "${schemaName}"."key_contact_details" (
        entity_rid, key_contact_name, 
        key_contact_email, key_contact_role, status_rid, 
        is_primary_contact, interaction_cc_recipient, include_in_communication,
        created_by, modified_by, entity_type
      ) VALUES (
        :account_rid, :key_contact_name, 
        :key_contact_email, :key_contact_role_rid, :status_rid, 
        :is_primary_contact, :interaction_cc_recipient, :include_in_communication,
        :created_by, :modified_by, 'Account'
      );
    `;
  },
  getIndustryNameByIdQuery() {
    return `
      SELECT industry_name 
      FROM ${MAIN_SCHEMA_NAME}.industry 
      WHERE rid = :id
    `;
  },
  getKeyContactRolesWithRoleMapQuery() {
    return `
      SELECT role_map, role_name 
      FROM ${MAIN_SCHEMA_NAME}.key_contact_role 
      WHERE role_map IS NOT NULL
    `;
  },
  getKeyContactsByAccountRidsQuery(schema: string) {
    const cleanedSchema = `${SCHEMANAME_PREFIX}${schema.replace(/^ACC-/, '')}`;
    return `
      SELECT * 
      FROM "${cleanedSchema}".key_contact_details 
      WHERE entity_rid IN (:accountRids) 
        AND entity_type = 'Account'
    `;
  },
  getAccountFiscalSummaryByAccountRidsQuery(schemaName: string) {
    return `
      SELECT  
        CONCAT('FY-', fiscal_year) AS fiscal_year,
        account_rid,
        SUM(total_projects::NUMERIC) AS total_projects,
        SUM(total_project_hours::NUMERIC) AS total_project_hours,
        SUM(total_project_cost::NUMERIC) AS total_project_cost,
        SUM(qualifying_project_hours_fed::NUMERIC) AS qualifying_project_hours_fed,
        SUM(qualifying_project_qre_fed::NUMERIC) AS qualifying_project_qre_fed,
        SUM(qualifying_project_rd_credits_fed::NUMERIC) AS qualifying_project_rd_credits_fed,
        SUM(total_projects_rd_credits::NUMERIC) AS total_projects_rd_credits
      FROM "${schemaName}".account_fiscal
      WHERE account_rid IN (:accountRids)
      GROUP BY account_rid, fiscal_year
    `;
  }, 
  getAccountFiscalSummaryQuery(schemaName: string) {
    return `
      SELECT 
        CONCAT('FY-', fiscal_year) AS fiscal_year, 
        account_rid,
        SUM(total_projects::NUMERIC) AS total_projects,
        SUM(total_project_hours::NUMERIC) AS total_project_hours,
        SUM(total_project_cost::NUMERIC) AS total_project_cost,
        SUM(qualifying_project_hours_fed::NUMERIC) AS qualifying_project_hours_fed,
        SUM(qualifying_project_qre_fed::NUMERIC) AS qualifying_project_qre_fed,
        SUM(qualifying_project_rd_credits_fed::NUMERIC) AS qualifying_project_rd_credits_fed,
        SUM(total_projects_rd_credits::NUMERIC) AS total_projects_rd_credits
      FROM "${schemaName}".account_fiscal
      WHERE account_rid IN (:accountRids)
    `;
  },
  getOrganizationLicensesQuery() {
    return `
      SELECT logo_url, firm_name 
      FROM ${MAIN_SCHEMA_NAME}.organization_licenses
    `;
  },
  getAttachmentSummaryByAccountRidQuery() {
    return `
      SELECT 
        a.*
      FROM "${MAIN_SCHEMA_NAME}"."attachment_summary" a
      WHERE a.attach_to = :account_rid
      ORDER BY a.created_datetime DESC
    `;
  },
  getCreateAccountDetailsTableQuery(schemaName: string) {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."account_details" (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime DATE DEFAULT CURRENT_TIMESTAMP NULL,
        modified_datetime DATE NULL,
        account_rid VARCHAR(50) NOT NULL UNIQUE,
        account_name VARCHAR(255) NOT NULL,
        tax_claim_level VARCHAR(50) NULL,
        max_ai_interactions INT CHECK (max_ai_interactions BETWEEN 1 AND 10) NOT NULL,
        autosend_interaction BOOLEAN NOT NULL,
        fiscal_start_date VARCHAR(10) NOT NULL,
        fiscal_end_date VARCHAR(10) NOT NULL,
        interaction_cc_list VARCHAR,
        blended_rate_fte NUMERIC(18,2),
        blended_rate_subcon NUMERIC(18,2),
        website VARCHAR(50),
        data_residency VARCHAR(255),
        data_storage VARCHAR(255) CHECK (data_storage IN ('separate_db', 'store_in_parent')),
        auto_access_rd BOOLEAN NOT NULL,
        business_details VARCHAR(2000) NOT NULL,
        support_email VARCHAR(255),
        subscription_created BOOLEAN DEFAULT FALSE,
        tenant_id VARCHAR(50),
        client_id VARCHAR(50),
        client_secret VARCHAR(300)
      );
    `;
  },
  getCreateIndexesForAccountDetails(schemaName: string, fieldsToIndex: string[]) {
    return fieldsToIndex.map(field => {
      const indexName = `${schemaName}_account_details_${field}_idx`;
      return `
        CREATE INDEX IF NOT EXISTS "${indexName}"
        ON "${schemaName}"."account_details"("${field}");
      `;
    });
  },
  getCreateAccountFiscalSequenceQuery(schemaName: string) {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".account_fiscal_seq START 1;
    `;
  },
  getCreateAccountFiscalTableQuery(schemaName: string) {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."account_fiscal" (
        rid VARCHAR(50) DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT 'ACF ' || LPAD(nextval('"${schemaName}".account_fiscal_seq')::text, 10, '0'),
        eid VARCHAR(120),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ,
        account_rid varchar(50) NOT NULL,
        fiscal_year integer NOT NULL,
        total_projects integer,
        total_fte integer,
        total_subcon integer,
        total_nonlabor integer,
        total_project_hours_fte numeric(18,2),
        total_project_hours_subcon numeric(18,2),
        total_project_hours numeric(18,2),
        total_project_cost_fte numeric(18,2),
        total_project_cost_subcon numeric(18,2),
        total_project_cost_nonlabor numeric(18,2),
        total_project_cost numeric(18,2),
        total_project_qre_fte numeric(18,2),
        total_project_qre_subcon numeric(18,2),
        total_projects_qre numeric(18,2),
        total_projects_rd_credits_fte numeric(18,2),
        total_projects_rd_credits_subcon numeric(18,2),
        total_projects_rd_credits numeric(18,2),
        total_qualifying_projects_fed numeric(18,2),
        qualifying_fte_fed numeric(18,2),
        qualifying_subcon_fed numeric(18,2),
        qualifying_project_hours_fte_fed numeric(18,2),
        qualifying_project_hours_subcon_fed numeric(18,2),
        qualifying_project_hours_fed numeric(18,2),
        qualifying_project_cost_fte_fed numeric(18,2),
        qualifying_project_cost_subcon_fed numeric(18,2),
        qualifying_project_cost_nonlabor_fed numeric(18,2),
        qualifying_project_cost_fed numeric(18,2),
        qualifying_project_qre_fte_fed numeric(18,2),
        qualifying_project_qre_subcon_fed numeric(18,2),
        qualifying_project_qre_fed numeric(18,2),
        qualifying_project_rd_credits_fte_fed numeric(18,2),
        qualifying_project_rd_credits_subcon_fed numeric(18,2),
        qualifying_project_rd_credits_fed numeric(18,2),
        total_project_res_hours_fte numeric(18,2),
        total_project_res_hours_subcon numeric(18,2),
        total_project_res_cost_fte numeric(18,2),
        total_project_res_cost_subcon numeric(18,2),
        total_project_res_cost_nonlabor numeric(18,2),
        total_project_task_hours_fte numeric(18,2),
        total_project_task_hours_subcon numeric(18,2),
        total_project_task_cost_fte numeric(18,2),
        total_project_task_cost_subcon numeric(18,2),
        total_project_res_hours numeric(18,2),
        total_project_res_cost numeric(18,2),
        total_project_task_hours numeric(18,2),
        total_project_task_cost numeric(18,2),
        CONSTRAINT account_fiscal_pkey PRIMARY KEY (rid),
        CONSTRAINT account_fiscal_r_number_key UNIQUE (r_number)
      );
    `;
  },
  getAccountFiscalForeignKeyQuery(schemaName: string) {
    return `
      ALTER TABLE "${schemaName}".account_fiscal
      ADD CONSTRAINT account_fiscal_account_rid_fkey
      FOREIGN KEY (account_rid)
      REFERENCES "${schemaName}".account_details(account_rid)
      ON UPDATE CASCADE;
    `;
  },
  getAccountFiscalIndexesQueries(schemaName: string) {
    const fieldsToIndex = [
      "account_rid",
      "fiscal_year",
      "total_projects",
      "total_project_hours",
      "total_project_cost",
      "total_projects_qre",
      "total_projects_rd_credits",
    ];
  
    return fieldsToIndex.map(field => {
      const indexName = `${schemaName}_account_fiscal_${field}_idx`;
      return `
        CREATE INDEX IF NOT EXISTS "${indexName}"
        ON "${schemaName}"."account_fiscal"("${field}");
      `;
    });
  },
  getCreateAccountFiscalRegionSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".account_fiscal_region_seq START 1;
    `;
  },
  getCreateAccountFiscalRegionTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".account_fiscal_region (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT 'ACFR ' || LPAD(nextval('"${schemaName}".account_fiscal_region_seq')::text, 10, '0'),
        eid varchar(120) NULL,
        created_by varchar(50) NOT NULL,
        modified_by varchar(50) NULL,
        created_datetime timestamptz NOT NULL,
        modified_datetime timestamptz NULL,
        account_rid varchar(50) NOT NULL,
        fiscal_year integer NOT NULL,
        total_projects integer NULL,
        total_fte integer NULL,
        total_subcon integer NULL,
        total_nonlabor integer NULL,
        total_project_hours_fte numeric(18, 2) NULL,
        total_project_hours_subcon numeric(18, 2) NULL,
        total_project_hours numeric(18, 2) NULL,
        total_project_cost_fte numeric(18, 2) NULL,
        total_project_cost_subcon numeric(18, 2) NULL,
        total_project_cost_nonlabor numeric(18, 2) NULL,
        total_project_cost numeric(18, 2) NULL,
        total_project_qre_fte numeric NULL,
        total_project_qre_subcon numeric NULL,
        total_projects_qre numeric NULL,
        total_projects_rd_credits_fte numeric(18, 2) NULL,
        total_projects_rd_credits_subcon numeric(18, 2) NULL,
        total_projects_rd_credits numeric(18, 2) NULL,
        total_qualifying_projects_fed numeric(18, 2) NULL,
        qualifying_fte_fed numeric(18, 2) NULL,
        qualifying_subcon_fed numeric(18, 2) NULL,
        qualifying_project_hours_fte_fed numeric(18, 2) NULL,
        qualifying_project_hours_subcon_fed numeric(18, 2) NULL,
        qualifying_project_hours_fed numeric(18, 2) NULL,
        qualifying_project_cost_fte_fed numeric(18, 2) NULL,
        qualifying_project_cost_subcon_fed numeric(18, 2) NULL,
        qualifying_project_cost_nonlabor_fed numeric(18, 2) NULL,
        qualifying_project_cost_fed numeric(18, 2) NULL,
        qualifying_project_qre_fte_fed numeric(18, 2) NULL,
        qualifying_project_qre_subcon_fed numeric(18, 2) NULL,
        qualifying_project_qre_fed numeric(18, 2) NULL,
        qualifying_project_rd_credits_fte_fed numeric(18, 2) NULL,
        qualifying_project_rd_credits_subcon_fed numeric(18, 2) NULL,
        qualifying_project_rd_credits_fed numeric(18, 2) NULL,
        region_rid varchar(50) NULL,
        total_project_res_hours_fte numeric(18, 2) NULL,
        total_project_res_hours_subcon numeric(18, 2) NULL,
        total_project_res_cost_fte numeric(18, 2) NULL,
        total_project_res_cost_subcon numeric(18, 2) NULL,
        total_project_res_cost_nonlabor numeric(18, 2) NULL,
        total_project_task_hours_fte numeric(18, 2) NULL,
        total_project_task_hours_subcon numeric(18, 2) NULL,
        total_project_task_cost_fte numeric(18, 2) NULL,
        total_project_task_cost_subcon numeric(18, 2) NULL,
        total_project_res_hours numeric(18, 2) NULL,
        total_project_res_cost numeric(18, 2) NULL,
        total_project_task_hours numeric(18, 2) NULL,
        total_project_task_cost numeric(18, 2) NULL,
        CONSTRAINT account_fiscal_region_r_number_key UNIQUE (r_number)
      );
    `;
  },
  getAccountFiscalRegionForeignKeyQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".account_fiscal_region
      ADD CONSTRAINT account_fiscal_region_account_rid_fkey
      FOREIGN KEY (account_rid)
      REFERENCES "${schemaName}".account_details(account_rid)
      ON UPDATE CASCADE;
    `;
  },                            
  getCreateProjectSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_seq START 1;
    `;
  },
  getCreateProjectTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."project" (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT 'PRJ-' || LPAD(nextval('"${schemaName}".project_seq')::text, 10, '0'),
        eid VARCHAR(120),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMP NOT NULL,
        modified_datetime TIMESTAMP,
        project_code VARCHAR(120) NOT NULL,
        industry_rid VARCHAR(50),
        industry_name VARCHAR(100),
        account_rid VARCHAR(50) NOT NULL,
        program_name VARCHAR(255),
        project_name VARCHAR(255),
        project_startdate TIMESTAMP,
        project_enddate TIMESTAMP,
        project_type_rid VARCHAR(50),
        project_classification_rid VARCHAR(50),
        project_classification_other VARCHAR(300),
        project_client_group VARCHAR(255),
        project_group VARCHAR(255),
        status_rid VARCHAR(50) NOT NULL,
        country_rid VARCHAR(50),
        region_rid VARCHAR(50),
        currency_rid VARCHAR(50),
        total_effort NUMERIC(18, 2),
        total_cost NUMERIC(18, 2),
        total_fte INTEGER,
        total_subcon INTEGER,
        total_nonlabor INTEGER,
        total_effort_fte NUMERIC(18, 2),
        total_effort_subcon NUMERIC(18, 2),
        total_cost_fte NUMERIC(18, 2),
        total_cost_subcon NUMERIC(18, 2),
        total_cost_nonlabor NUMERIC(18, 2),
        auto_send_ai_interaction BOOLEAN NOT NULL DEFAULT false,
        auto_access_rd BOOLEAN DEFAULT false,
        max_ai_interaction INTEGER NOT NULL,
        blended_rate_fte NUMERIC(18, 2),
        blended_rate_subcon NUMERIC(18, 2),
        blended_rate NUMERIC(18, 2),
        project_description VARCHAR(2000),
        comments VARCHAR(2000),
        is_rd_qualified BOOLEAN,
        qre NUMERIC(18, 2),
        assessment_status VARCHAR(150),
        qre_detailed_breakdown JSON
      );
    `;
  },  
  getAddProjectAccountForeignKeyQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".project
      ADD CONSTRAINT project_account_rid_fkey
      FOREIGN KEY (account_rid)
      REFERENCES "${schemaName}".account_details(account_rid)
      ON UPDATE CASCADE;
    `;
  },
  getProjectFieldIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_project_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."project"("${field}");
    `;
  },
  getCreateProjectFiscalSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_fiscal_seq START 1;
    `;
  },
  getCreateProjectFiscalTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".project_fiscal (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) UNIQUE DEFAULT 'PFI-' || LPAD(nextval('"${schemaName}".project_fiscal_seq')::TEXT, 10, '0'),
        eid VARCHAR(120),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMP DEFAULT NOW(),
        modified_datetime TIMESTAMP,
        project_rid VARCHAR(50) NOT NULL,
        project_code VARCHAR(120) NOT NULL,
        industry_rid VARCHAR(50),
        industry_name VARCHAR(100),
        fiscal_year INTEGER NOT NULL,
        project_name VARCHAR(200),
        program_name TEXT,
        project_type_rid VARCHAR(50),
        project_classification_rid VARCHAR(50),
        project_classification_other TEXT,
        project_client_group TEXT,
        project_group TEXT,
        auto_send_ai_interaction BOOLEAN NOT NULL DEFAULT FALSE,
        account_rid VARCHAR(50) NOT NULL,
        country_rid VARCHAR(50),
        region_rid VARCHAR(50),
        currency_rid VARCHAR(50),
        max_ai_interaction INTEGER NOT NULL,
        expiry_duration INTEGER,
        auto_access_rd BOOLEAN,
        status_rid VARCHAR(50) NOT NULL,
        project_startdate TIMESTAMP,
        project_enddate TIMESTAMP,
  
        -- FTE & Subcon
        total_fte_prj INTEGER,
        total_fte_from_prj_res INTEGER,
        total_fte_from_tasks INTEGER,
        total_subcon_prj INTEGER,
        total_subcon_from_prj_res INTEGER,
        total_subcon_from_tasks INTEGER,
  
        -- Non-labor & Resources
        total_nonlabor_prj DECIMAL(18,2),
        total_nonlabor_from_prj_res DECIMAL(18,2),
        total_nonlabor_from_tasks INTEGER,
        total_resources_prj INTEGER,
        total_resources_from_prj_res INTEGER,
        total_resources_from_tasks INTEGER,
  
        -- Effort
        total_effort_prj DECIMAL(18,2),
        total_effort_fte_prj DECIMAL(18,2),
        total_effort_subcon_prj DECIMAL(18,2),
        total_effort_from_prj_res DECIMAL(18,2),
        total_effort_fte_from_prj_res DECIMAL(18,2),
        total_effort_subcon_from_prj_res DECIMAL(18,2),
        total_effort_from_tasks DECIMAL(18,2),
        total_effort_fte_from_tasks DECIMAL(18,2),
        total_effort_subcon_from_tasks DECIMAL(18,2),
  
        -- Cost
        total_cost_prj DECIMAL(18,2),
        total_cost_fte_prj DECIMAL(18,2),
        total_cost_subcon_prj DECIMAL(18,2),
        total_cost_nonlabor_prj DECIMAL(18,2),
        total_cost_from_prj_res DECIMAL(18,2),
        total_cost_fte_from_prj_res DECIMAL(18,2),
        total_cost_subcon_from_prj_res DECIMAL(18,2),
        total_cost_nonlabor_from_prj_res DECIMAL(18,2),
        total_cost_from_tasks DECIMAL(18,2),
        total_cost_fte_from_tasks DECIMAL(18,2),
        total_cost_subcon_from_tasks DECIMAL(18,2),
  
        -- Blended Cost
        total_cost_prj_blended DECIMAL(18,2),
        total_cost_fte_prj_blended DECIMAL(18,2),
        total_cost_subcon_prj_blended DECIMAL(18,2),
        total_cost_from_prj_res_blended DECIMAL(18,2),
        total_cost_fte_from_prj_res_blended DECIMAL(18,2),
        total_cost_subcon_from_prj_res_blended DECIMAL(18,2),
        total_cost_from_tasks_blended DECIMAL(18,2),
        total_cost_fte_from_tasks_blended DECIMAL(18,2),
        total_cost_subcon_from_tasks_blended DECIMAL(18,2),
  
        -- Blended Rates
        blended_rate_fte NUMERIC(18,2),
        blended_rate_subcon NUMERIC(18,2),
  
        -- R&D + QRE
        rd_percent_potential_ai DECIMAL(18,2),
        rd_percent_potential_ai_updated NUMERIC(18, 2),
        rd_percent_adjustment DECIMAL(18,2),
        rd_percent_final DECIMAL(18,2),
        qre_fte DECIMAL(18,2),
        qre_subcon DECIMAL(18,2),
        qre_nonlabor DECIMAL(18,2),
        qre_final DECIMAL(18,2),
        rd_credits_fte_fed_level DECIMAL(18,2),
        rd_credits_subcon_fed_level DECIMAL(18,2),
        rd_credits_nonlabor_fed_level DECIMAL(18,2),
        rd_credits_fed_level DECIMAL(18,2),
        rd_credits_total DECIMAL(18,2),
        is_rd_claim_qualified BOOLEAN DEFAULT false,
  
        effective_total_fte INTEGER,
        effective_total_subcon INTEGER,
        effective_total_nonlabor INTEGER,
        effective_cost NUMERIC(18, 2),
        effective_effort NUMERIC(18, 2),
        effective_fte_cost NUMERIC(18, 2),
        effective_fte_effort NUMERIC(18, 2),
        effective_subcon_cost NUMERIC(18, 2),
        effective_subcon_effort NUMERIC(18, 2),
        effective_nonlabor_cost NUMERIC(18, 2),
        effective_metric_type VARCHAR(50),
        default_metric_type VARCHAR(50),
  
        -- Misc
        interaction_cc_list TEXT,
        assessment_status TEXT,
        claim_status TEXT,
        comments VARCHAR(2000),
        project_description VARCHAR(2000)
      );
    `;
  },
  getProjectFiscalForeignKeyQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".project_fiscal
      ADD CONSTRAINT project_fiscal_account_rid_fkey
        FOREIGN KEY (account_rid)
        REFERENCES "${schemaName}".account_details(account_rid)
        ON UPDATE CASCADE;
  
      ALTER TABLE "${schemaName}".project_fiscal
      ADD CONSTRAINT project_fiscal_project_rid_fkey
        FOREIGN KEY (project_rid)
        REFERENCES "${schemaName}".project(rid)
        ON UPDATE CASCADE;
    `;
  },
  getProjectFiscalIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_project_fiscal_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."project_fiscal"("${field}");
    `;
  },
  getCreateProjectHistorySequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_history_seq START 1;
    `;
  },        
  getCreateProjectHistoryTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".project_history (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) UNIQUE DEFAULT 'PRH-' || LPAD(nextval('"${schemaName}".project_history_seq')::TEXT, 10, '0'),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        modified_datetime TIMESTAMP WITHOUT TIME ZONE,
        project_rid VARCHAR(50) NOT NULL,
        attribute_name VARCHAR(100) NOT NULL,
        old_value VARCHAR(2000),
        new_value VARCHAR(2000) NOT NULL
      );
    `;
  },
  getAddProjectHistoryForeignKeyQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".project_history
      ADD CONSTRAINT project_history_project_rid_fkey
      FOREIGN KEY (project_rid)
      REFERENCES "${schemaName}".project_fiscal(rid)
      ON UPDATE CASCADE;
    `;
  },
  getCreateProjectFiscalRegionSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_fiscal_region_seq START 1;
    `;
  },
  getCreateProjectFiscalRegionTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".project_fiscal_region (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) UNIQUE DEFAULT 'PFIR-' || LPAD(nextval('"${schemaName}".project_fiscal_region_seq')::TEXT, 10, '0'),
        eid VARCHAR(120) NULL,
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50) NULL,
        created_datetime TIMESTAMPTZ NULL,
        modified_datetime TIMESTAMPTZ NULL,
        project_rid VARCHAR(50) NOT NULL,
        project_code VARCHAR(120) NOT NULL,
        industry_rid VARCHAR(50) NULL,
        industry_name VARCHAR(100) NULL,
        fiscal_year INTEGER NOT NULL,
        project_name VARCHAR(200) NULL,
        program_name VARCHAR(255) NULL,
        project_type_rid VARCHAR(50),
        project_classification_rid VARCHAR(50) NULL,
        project_classification_other VARCHAR(255) NULL,
        project_client_group VARCHAR(255) NULL,
        project_group VARCHAR(255) NULL,
        auto_send_ai_interaction BOOL DEFAULT false NOT NULL,
        account_rid VARCHAR(50) NOT NULL,
        country_rid VARCHAR(50) NULL,
        region_rid VARCHAR(50) NULL,
        currency_rid VARCHAR(50) NULL,
        max_ai_interaction INTEGER NOT NULL,
        expiry_duration INTEGER NULL,
        auto_access_rd BOOL NULL,
        status_rid VARCHAR(255) NOT NULL,
        project_startdate TIMESTAMPTZ NULL,
        project_enddate TIMESTAMPTZ NULL,
  
        total_fte_prj INTEGER NULL,
        total_fte_from_prj_res INTEGER NULL,
        total_fte_from_tasks INTEGER NULL,
        total_subcon_prj INTEGER NULL,
        total_subcon_from_prj_res INTEGER NULL,
        total_subcon_from_tasks INTEGER NULL,
        total_nonlabor_prj NUMERIC(18, 2) NULL,
        total_nonlabor_from_prj_res NUMERIC(18, 2) NULL,
        total_resources_prj INTEGER NULL,
        total_resources_from_prj_res INTEGER NULL,
        total_resources_from_tasks INTEGER NULL,
  
        total_effort_prj NUMERIC(18, 2) NULL,
        total_effort_fte_prj NUMERIC(18, 2) NULL,
        total_effort_subcon_prj NUMERIC(18, 2) NULL,
        total_effort_from_prj_res NUMERIC(18, 2) NULL,
        total_effort_fte_from_prj_res NUMERIC(18, 2) NULL,
        total_effort_subcon_from_prj_res NUMERIC(18, 2) NULL,
        total_effort_from_tasks NUMERIC(18, 2) NULL,
        total_effort_fte_from_tasks NUMERIC(18, 2) NULL,
        total_effort_subcon_from_tasks NUMERIC(18, 2) NULL,
  
        total_cost_prj NUMERIC(18, 2) NULL,
        total_cost_fte_prj NUMERIC(18, 2) NULL,
        total_cost_subcon_prj NUMERIC(18, 2) NULL,
        total_cost_nonlabor_prj NUMERIC(18, 2) NULL,
        total_cost_from_prj_res NUMERIC(18, 2) NULL,
        total_cost_fte_from_prj_res NUMERIC(18, 2) NULL,
        total_cost_subcon_from_prj_res NUMERIC(18, 2) NULL,
        total_cost_nonlabor_from_prj_res NUMERIC(18, 2) NULL,
        total_cost_from_tasks NUMERIC(18, 2) NULL,
        total_cost_fte_from_tasks NUMERIC(18, 2) NULL,
        total_cost_subcon_from_tasks NUMERIC(18, 2) NULL,
  
        total_cost_prj_blended NUMERIC(18, 2) NULL,
        total_cost_fte_prj_blended NUMERIC(18, 2) NULL,
        total_cost_subcon_prj_blended NUMERIC(18, 2) NULL,
        total_cost_from_prj_res_blended NUMERIC(18, 2) NULL,
        total_cost_fte_from_prj_res_blended NUMERIC(18, 2) NULL,
        total_cost_subcon_from_prj_res_blended NUMERIC(18, 2) NULL,
        total_cost_from_tasks_blended NUMERIC(18, 2) NULL,
        total_cost_fte_from_tasks_blended NUMERIC(18, 2) NULL,
        total_cost_subcon_from_tasks_blended NUMERIC(18, 2) NULL,
  
        blended_rate_fte NUMERIC(18, 2) NULL,
        blended_rate_subcon NUMERIC(18, 2) NULL,
  
        rd_percent_potential_ai NUMERIC(18, 2) NULL,
        rd_percent_potential_ai_updated NUMERIC(18, 2) NULL,
        rd_percent_adjustment NUMERIC(18, 2) NULL,
        rd_percent_final NUMERIC(18, 2) NULL,
  
        qre_fte NUMERIC(18, 2) NULL,
        qre_subcon NUMERIC(18, 2) NULL,
        qre_nonlabor NUMERIC(18, 2) NULL,
        qre_final NUMERIC(18, 2) NULL,
  
        rd_credits_fte_fed_level NUMERIC(18, 2) NULL,
        rd_credits_subcon_fed_level NUMERIC(18, 2) NULL,
        rd_credits_nonlabor_fed_level NUMERIC(18, 2) NULL,
        rd_credits_fed_level NUMERIC(18, 2) NULL,
        rd_credits_total NUMERIC(18, 2) NULL,
  
        effective_total_fte INTEGER NULL,
        effective_total_subcon INTEGER NULL,
        effective_total_nonlabor INTEGER NULL,
        effective_cost NUMERIC(18, 2) NULL,
        effective_effort NUMERIC(18, 2) NULL,
        effective_fte_cost NUMERIC(18, 2) NULL,
        effective_fte_effort NUMERIC(18, 2) NULL,
        effective_subcon_cost NUMERIC(18, 2) NULL,
        effective_subcon_effort NUMERIC(18, 2) NULL,
        effective_nonlabor_cost NUMERIC(18, 2) NULL,
        effective_metric_type VARCHAR(50) NULL,
        default_metric_type VARCHAR(50) NULL,
  
        interaction_cc_list VARCHAR(255) NULL,
        assessment_status VARCHAR(255) NULL,
        claim_status VARCHAR(255) NULL,
        comments VARCHAR(2000) NULL,
        project_description VARCHAR(2000) NULL,
  
        project_fiscal_rid VARCHAR(50) NOT NULL,
        total_nonlabor_from_tasks INTEGER,
  
        CONSTRAINT project_fiscal_region_r_number_key UNIQUE (r_number)
      );
    `;
  },
  getAddProjectFiscalRegionForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".project_fiscal_region
      ADD CONSTRAINT project_fiscal_region_account_rid_fkey
        FOREIGN KEY (account_rid)
        REFERENCES "${schemaName}".account_details(account_rid)
        ON UPDATE CASCADE,
      ADD CONSTRAINT project_fiscal_region_project_fiscal_rid_fkey
        FOREIGN KEY (project_fiscal_rid)
        REFERENCES "${schemaName}".project_fiscal(rid)
        ON UPDATE CASCADE,
      ADD CONSTRAINT project_fiscal_region_project_rid_fkey
        FOREIGN KEY (project_rid)
        REFERENCES "${schemaName}".project(rid)
        ON UPDATE CASCADE;
    `;
  },
  getCreateProjectTimelineSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_timeline_seq START 1;
    `;
  },
  getCreateProjectTimelineTableQuery(schemaName: string): string {
    return `
      CREATE TABLE "${schemaName}".project_timeline (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('\${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT ('PRT-' || LPAD(nextval('"${schemaName}".project_timeline_seq')::TEXT, 10, '0')) NULL,
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMP DEFAULT NOW(),
        modified_datetime TIMESTAMP,
        account_rid VARCHAR(50) NOT NULL,
        document_rid VARCHAR(50),
        entity_rid VARCHAR(50) NOT NULL,
        event_name VARCHAR(100) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        event_status VARCHAR(100) NOT NULL,
        event_datetime TIMESTAMPTZ NOT NULL,
        CONSTRAINT project_timeline_r_number_key UNIQUE (r_number)
      );
    `;
  },
  getAddProjectTimelineForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".project_timeline
      ADD CONSTRAINT project_timeline_account_rid_fkey
        FOREIGN KEY (account_rid)
        REFERENCES "${schemaName}".account_details(account_rid)
        ON UPDATE CASCADE,
      ADD CONSTRAINT project_timeline_entity_rid_fkey
        FOREIGN KEY (entity_rid)
        REFERENCES "${schemaName}".project_fiscal(rid)
        ON UPDATE CASCADE;
    `;
  },
  getCreateDocumentSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".doc_seq START 1;
    `;
  },
  getCreateDocumentTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."document" (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT 'DOC-' || LPAD(nextval('"${schemaName}".doc_seq')::text, 10, '0'),
        eid VARCHAR(120),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ,
        account_rid VARCHAR(50) REFERENCES "${schemaName}"."account_details"(account_rid),
        related_to VARCHAR(50) NOT NULL,
        related_to_rid VARCHAR(50),
        document_source VARCHAR(100) NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        document_format VARCHAR(10) NOT NULL,
        document_version VARCHAR(10),
        document_url VARCHAR(2048) NOT NULL,
        bypass_rd_assessment BOOLEAN DEFAULT false,
        document_size VARCHAR(100) NOT NULL,
        document_status VARCHAR(100) NOT NULL,
        failure_reason TEXT
      );
    `;
  },
  getCreateImportSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".import_seq START 1;
    `;
  },
  getCreateImportTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."import" (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT 'IMP-' || LPAD(nextval('"${schemaName}".import_seq')::text, 10, '0'),
        eid VARCHAR(120),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ,
        account_rid varchar(50) REFERENCES "${schemaName}"."account_details"(account_rid),
        project_rid varchar(50) REFERENCES "${schemaName}"."project"(rid),
        uploaded_by_user_rid varchar(50),
        related_to VARCHAR(50) NOT NULL,
        related_to_rid varchar(50),
        entity_type VARCHAR(100),
        uploaded_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        document_name VARCHAR(255) NOT NULL,
        document_rid varchar(50) REFERENCES "${schemaName}"."document"(rid),
        upload_status VARCHAR(100) NOT NULL,
        upload_failure_reason TEXT,
        staging_table VARCHAR(100),
        staging_status VARCHAR(100),
        staging_start_timestamp TIMESTAMPTZ,
        staging_end_timestamp TIMESTAMPTZ,
        staging_error TEXT,
        total_records INT,
        total_staging_processed INT,
        target_load_status VARCHAR(100),
        target_load_start_timestamp TIMESTAMPTZ,
        target_load_end_timestamp TIMESTAMPTZ,
        target_load_error_records_count INT,
        target_ai_records_processed INT,
        target_ai_error_records_count INT,
        total_staging_warning_count INT,
        fiscal_year INT,
        email_status varchar(20)
      );
    `;
  },
  getCreateKafkaEventsSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".kafka_events_seq START 1;
    `;
  },
  getCreateKafkaEventsTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."kafka_events" (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT 'KFE-' || LPAD(nextval('"${schemaName}".kafka_events_seq')::text, 10, '0'),
        eid VARCHAR(120),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ,
        source_name VARCHAR(100) NOT NULL,
        producer_id varchar(50),
        document_rid varchar(50) REFERENCES "${schemaName}"."document"(rid),
        document_name VARCHAR(255),
        document_upload_rid varchar(50) REFERENCES "${schemaName}"."import"(rid),
        topic_name VARCHAR(255) NOT NULL,
        related_to VARCHAR(50),
        related_to_rid varchar(50),
        consumer_id varchar(50),
        message_on_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) NOT NULL,
        error_description TEXT
      );
    `;
  },
  getCreateKeyContactDetailsTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."key_contact_details" (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(30),
        created_by varchar(50),
        modified_by varchar(50),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        modified_datetime TIMESTAMPTZ,
        entity_rid varchar(50) NOT NULL,
        entity_type VARCHAR(500) NOT NULL,
        key_contact_name VARCHAR(128),
        key_contact_email VARCHAR(125),
        key_contact_role varchar(50),
        is_primary_contact BOOLEAN,
        include_in_communication BOOLEAN,
        interaction_cc_recipient BOOLEAN,
        status_rid VARCHAR(50)
      );
    `;
  },
  getCreateClientFirmDocumentTemplateTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."clientfirm_document_template" (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        eid VARCHAR(120),
        created_by VARCHAR(50),
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ,
        client_document_template_name VARCHAR(100) NOT NULL,
        account_rid varchar(50) NOT NULL,
        entity_type VARCHAR(500) NOT NULL,
        version VARCHAR(10),
        status VARCHAR(50) NOT NULL
      );
    `;
  },
  getCreateClientFirmDocumentTemplateMetadataTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."clientfirm_document_template_metadata" (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        eid VARCHAR(120),
        created_by VARCHAR(50),
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ,
        account_rid varchar(50) NOT NULL,
        client_template_rid varchar(50) NOT NULL,
        sheet_name VARCHAR(100), 
        col_seq VARCHAR(100) NOT NULL,
        col_name VARCHAR(100) NOT NULL,
        col_type VARCHAR(100) NOT NULL,
        required BOOLEAN
      );
    `;
  },
  getCreateResourcesSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resources_seq START 1;
    `;
  },
  getCreateResourcesTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".resources (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT ('RES-' || LPAD((nextval('"${schemaName}".resources_seq'))::text, 10, '0')),
        eid VARCHAR(120),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ NOT NULL,
        modified_datetime TIMESTAMPTZ,
        account_rid VARCHAR(50) NOT NULL,
        resource_code VARCHAR(50) NOT NULL,
        resource_type_rid VARCHAR(50),
        resource_name VARCHAR(200),
        resource_firstname VARCHAR(100),
        resource_lastname VARCHAR(100),
        resource_orgname VARCHAR(100),
        resource_role VARCHAR(100),
        country_rid VARCHAR(50),
        region_rid VARCHAR(50),
        city_rid VARCHAR(50),
        resource_startdate DATE,
        resource_enddate DATE,
        resource_designation VARCHAR(100),
        resource_total_experience NUMERIC(4,2),
        resource_total_experience_organization NUMERIC(4,2),
        status_rid VARCHAR(50),
        comments TEXT,
        CONSTRAINT resource_code_account_key_unique UNIQUE (resource_code, account_rid)
      );
    `;
  },
  getAddResourcesForeignKeyQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".resources
      ADD CONSTRAINT resources_account_rid_fkey
      FOREIGN KEY (account_rid)
      REFERENCES "${schemaName}".account_details(account_rid)
      ON UPDATE CASCADE;
    `;
  },
  getCreateResourcesIndexesQueries(schemaName: string): string[] {
    const fieldsToIndex = [
      "account_rid",
      "resource_code",
      "resource_name",
      "resource_firstname",
      "resource_lastname",
      "resource_orgname",
      "resource_role",
      "country_rid",
      "region_rid",
      "status_rid",
    ];
  
    return fieldsToIndex.map((field) => `
      CREATE INDEX IF NOT EXISTS "${schemaName}_resources_${field}_idx"
      ON "${schemaName}".resources (${field});
    `);
  },
  getCreateResourcesHistorySequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_history_seq START 1;
    `;
  },
  getCreateResourcesHistoryTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".resources_history (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT (
          'REH-' || LPAD((nextval('"${schemaName}".resource_history_seq'::regclass))::text, 10, '0')
        ),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ NOT NULL,
        modified_datetime TIMESTAMPTZ,
        resource_rid VARCHAR(50) NOT NULL,
        attribute_name VARCHAR(100) NOT NULL,
        old_value VARCHAR(1000),
        new_value VARCHAR(1000) NOT NULL
      );
    `;
  },
  getAddResourcesHistoryForeignKeyQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".resources_history
      ADD CONSTRAINT resources_history_resource_rid_fkey
      FOREIGN KEY (resource_rid)
      REFERENCES "${schemaName}".resources(rid)
      ON UPDATE CASCADE;
    `;
  },
  getCreateResourcesTimelineSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_timeline_seq START 1;
    `;
  },
  getCreateResourcesTimelineTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".resources_timeline (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT (
          'RTL-' || LPAD((nextval('"${schemaName}".resource_timeline_seq'::regclass))::text, 10, '0')
        ),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ NOT NULL,
        modified_datetime TIMESTAMPTZ,
        account_rid VARCHAR(50) NOT NULL,
        entity_rid VARCHAR(50) NOT NULL,
        document_rid VARCHAR(50),
        event_name VARCHAR(100) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        event_status VARCHAR(100) NOT NULL,
        event_datetime TIMESTAMPTZ NOT NULL
      );
    `;
  },
  getAddResourcesTimelineForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".resources_timeline
      ADD CONSTRAINT resources_timeline_account_rid_fkey
        FOREIGN KEY (account_rid)
        REFERENCES "${schemaName}".account_details(account_rid)
        ON UPDATE CASCADE;
  
      ALTER TABLE "${schemaName}".resources_timeline
      ADD CONSTRAINT resources_timeline_entity_rid_fkey
        FOREIGN KEY (entity_rid)
        REFERENCES "${schemaName}".resources(rid)
        ON UPDATE CASCADE;
    `;
  },
  getCreateResourceCostSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_cost_seq START 1;
    `;
  },
  getCreateResourceCostTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".resource_cost (
        rid VARCHAR(50) PRIMARY KEY NOT NULL DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT (
          'RCO-' || LPAD((nextval('"${schemaName}".resource_cost_seq'::regclass))::text, 10, '0')
        ),
        eid VARCHAR(120),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ,
        modified_datetime TIMESTAMPTZ,
        account_rid VARCHAR(50) NOT NULL,
        resource_type_rid VARCHAR(50),
        resource_rid VARCHAR(50),
        resource_code VARCHAR(255) NOT NULL,
        resource_number VARCHAR(255) NOT NULL,
        fiscal_year INTEGER NOT NULL,
        effective_from DATE,
        end_date DATE,
        effort_in_hrs NUMERIC(18,2),
        currency_rid VARCHAR(50),
        status_rid VARCHAR(50),
        comments TEXT,
        deductions NUMERIC(18,2),
        insurance NUMERIC(18,2),
        bonus NUMERIC(18,2),
        resource_cost NUMERIC(18,2),
        salary NUMERIC(18,2),
        net_resource_cost NUMERIC(20,2),
        CONSTRAINT resource_cost_resource_rid_fkey
          FOREIGN KEY (resource_rid)
          REFERENCES "${schemaName}".resources (rid)
          ON UPDATE CASCADE
          ON DELETE SET NULL
      );
    `;
  },
  getAddResourceCostAccountForeignKeyQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".resource_cost
      ADD CONSTRAINT resource_cost_account_rid_fkey
      FOREIGN KEY (account_rid)
      REFERENCES "${schemaName}".account_details(account_rid)
      ON UPDATE CASCADE;
    `;
  },
  getCreateResourceCostIndexesQueries(schemaName: string): string[] {
    const fieldsToIndex = ["resource_code"];
  
    return fieldsToIndex.map((field) => `
      CREATE INDEX IF NOT EXISTS "${schemaName}_resource_cost_${field}_idx"
      ON "${schemaName}".resource_cost (${field});
    `);
  },
  getCreateResourceCostTimelineSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_cost_timeline_seq START 1;
    `;
  },
  getCreateResourceCostTimelineTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".resource_cost_timeline (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT (
          'RCT-' || LPAD((nextval('"${schemaName}".resource_cost_timeline_seq'::regclass))::text, 10, '0')
        ),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ,
        modified_datetime TIMESTAMPTZ,
        account_rid VARCHAR(50) NOT NULL,
        document_rid VARCHAR(50),
        event_name VARCHAR(255) NOT NULL,
        event_status VARCHAR(255) NOT NULL,
        event_type VARCHAR(255) DEFAULT 'Ui Handler',
        entity_rid VARCHAR(50) NOT NULL,
        event_datetime TIMESTAMPTZ NOT NULL
      );
    `;
  },
  getAddResourceCostTimelineForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".resource_cost_timeline
      ADD CONSTRAINT resource_cost_timeline_account_rid_fkey
        FOREIGN KEY (account_rid)
        REFERENCES "${schemaName}".account_details(account_rid)
        ON UPDATE CASCADE;
  
      ALTER TABLE "${schemaName}".resource_cost_timeline
      ADD CONSTRAINT resource_cost_timeline_entity_rid_fkey
        FOREIGN KEY (entity_rid)
        REFERENCES "${schemaName}".resource_cost(rid)
        ON UPDATE CASCADE;
    `;
  },
  getCreateResourceCostHistorySequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_cost_history_seq START 1;
    `;
  },
  getCreateResourceCostHistoryTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".resource_cost_history (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT (
          'RCH-' || LPAD((nextval('"${schemaName}".resource_cost_history_seq'::regclass))::text, 10, '0')
        ),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        modified_datetime TIMESTAMPTZ,
        resource_cost_rid VARCHAR(50) NOT NULL,
        attribute_name VARCHAR(255) NOT NULL,
        old_value VARCHAR(255),
        new_value VARCHAR(255) NOT NULL
      );
    `;
  },
  getAddResourceCostHistoryForeignKeyQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".resource_cost_history
      ADD CONSTRAINT resource_cost_history_resource_cost_rid_fkey
      FOREIGN KEY (resource_cost_rid)
      REFERENCES "${schemaName}".resource_cost(rid)
      ON UPDATE CASCADE;
    `;
  },
  getCreateResourceSkillSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_skill_seq START 1;
    `;
  },
  getCreateResourceSkillTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".resource_skill (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT (
          'RSK-' || LPAD((nextval('"${schemaName}".resource_skill_seq'::regclass))::text, 10, '0')
        ),
        eid VARCHAR(120),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ,
        modified_datetime TIMESTAMPTZ,
        account_rid VARCHAR(50) NOT NULL,
        resource_type_rid VARCHAR(50),
        resource_rid VARCHAR(50) NOT NULL,
        resource_number VARCHAR(255) NOT NULL,
        start_date DATE,
        skill_description VARCHAR(255),
        skill_level_rid VARCHAR(50),
        skill_type_others VARCHAR(255),
        skill_subtype_others VARCHAR(255),
        resource_code VARCHAR(255) NOT NULL,
        status_rid VARCHAR(50),
        skill_type_rid VARCHAR(255) NOT NULL,
        skill_subtype_rid VARCHAR(255) NOT NULL,
        skill_details TEXT,
        comments TEXT,
        CONSTRAINT resource_skill_resource_rid_fkey
          FOREIGN KEY (resource_rid)
          REFERENCES "${schemaName}".resources (rid)
          ON UPDATE CASCADE
          ON DELETE NO ACTION
      );
    `;
  },
  getAddResourceSkillAccountForeignKeyQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".resource_skill
      ADD CONSTRAINT resource_skill_account_rid_fkey
      FOREIGN KEY (account_rid)
      REFERENCES "${schemaName}".account_details(account_rid)
      ON UPDATE CASCADE;
    `;
  },
  getCreateResourceSkillIndexesQueries(schemaName: string): string[] {
    const fieldsToIndex = ["resource_code"];
  
    return fieldsToIndex.map((field) => `
      CREATE INDEX IF NOT EXISTS "${schemaName}_resource_skill_${field}_idx"
      ON "${schemaName}".resource_skill (${field});
    `);
  },
  getCreateResourceSkillTimelineSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_skill_timeline_seq START 1;
    `;
  },
  getCreateResourceSkillTimelineTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".resource_skill_timeline (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT (
          'RST-' || LPAD((nextval('"${schemaName}".resource_skill_timeline_seq'::regclass))::text, 10, '0')
        ),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ,
        modified_datetime TIMESTAMPTZ,
        account_rid VARCHAR(50) NOT NULL,
        document_rid VARCHAR(50),
        event_name VARCHAR(255) NOT NULL,
        event_status VARCHAR(255) NOT NULL,
        event_type VARCHAR(255) DEFAULT 'Ui Handler',
        entity_rid VARCHAR(50) NOT NULL,
        event_datetime TIMESTAMPTZ NOT NULL
      );
    `;
  },
  getAddResourceSkillTimelineForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".resource_skill_timeline
      ADD CONSTRAINT resource_skill_timeline_account_rid_fkey
        FOREIGN KEY (account_rid)
        REFERENCES "${schemaName}".account_details(account_rid)
        ON UPDATE CASCADE;
  
      ALTER TABLE "${schemaName}".resource_skill_timeline
      ADD CONSTRAINT resource_skill_timeline_entity_rid_fkey
        FOREIGN KEY (entity_rid)
        REFERENCES "${schemaName}".resource_skill(rid)
        ON UPDATE CASCADE;
    `;
  },
  getCreateResourceSkillHistorySequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_skill_history_seq START 1;
    `;
  },
  getCreateResourceSkillHistoryTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".resource_skill_history (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT (
          'RSH-' || LPAD((nextval('"${schemaName}".resource_skill_history_seq'::regclass))::text, 10, '0')
        ),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ,
        modified_datetime TIMESTAMPTZ,
        resource_skill_rid VARCHAR(50) NOT NULL,
        attribute_name VARCHAR(255) NOT NULL,
        old_value VARCHAR(255),
        new_value VARCHAR(255) NOT NULL
      );
    `;
  },
  getAddResourceSkillHistoryForeignKeyQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".resource_skill_history
      ADD CONSTRAINT resource_skill_history_resource_skill_rid_fkey
      FOREIGN KEY (resource_skill_rid)
      REFERENCES "${schemaName}".resource_skill(rid)
      ON UPDATE CASCADE;
    `;
  },
  getCreateResourceFiscalSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_fiscal_seq START 1;
    `;
  },
  getCreateResourceFiscalTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".resource_fiscal (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT ('RSF-' || LPAD((nextval('"${schemaName}".resource_fiscal_seq'))::text, 10, '0')),
        eid VARCHAR(120),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ NOT NULL,
        modified_datetime TIMESTAMPTZ,
        account_rid VARCHAR(50) NOT NULL,
        resource_rid VARCHAR(50) NOT NULL,
        resource_code VARCHAR(50) NOT NULL,
        resource_type_rid VARCHAR(50),
        fiscal_year INTEGER,
        country_rid VARCHAR(50),
        country_region_rid VARCHAR(50),
        cost_type VARCHAR(50) CHECK (cost_type IN (
          'Annual', 'Monthly', 'Bi-Weekly', 'Weekly', 'Daily', 'Hourly'
        )),
        annual_cost NUMERIC(18,2),
        monthly_cost NUMERIC(18,2),
        weekly_cost NUMERIC(18,2),
        bi_weekly_cost NUMERIC(18,2),
        daily_cost NUMERIC(18,2),
        hourly_cost NUMERIC(18,2),
        total_cost_for_year_project NUMERIC(18,2),
        total_cost_for_year_project_resource_level NUMERIC(18,2),
        total_cost_for_year_project_task_level NUMERIC(18,2),
        total_effort_for_year_project NUMERIC(18,2),
        total_effort_for_year_project_resource_level NUMERIC(18,2),
        total_effort_for_year_project_task_level NUMERIC(18,2),
        effective_date DATE,
        end_date DATE,
        estimated_rd_hours NUMERIC(18,2),
        CONSTRAINT resource_fiscal_r_number_key UNIQUE (r_number)
      );
    `;
  },
  getAddResourceFiscalForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".resource_fiscal
      ADD CONSTRAINT resource_fiscal_account_rid_fkey
        FOREIGN KEY (account_rid)
        REFERENCES "${schemaName}".account_details(account_rid)
        ON UPDATE CASCADE;
  
      ALTER TABLE "${schemaName}".resource_fiscal
      ADD CONSTRAINT resource_fiscal_resource_rid_fkey
        FOREIGN KEY (resource_rid)
        REFERENCES "${schemaName}".resources(rid)
        ON UPDATE CASCADE;
    `;
  },
  getCreateResourceFiscalIndexes(schemaName: string): string[] {
    const fieldsToIndex = [
      "account_rid",
      "resource_rid",
      "fiscal_year",
      "country_rid",
      "country_region_rid",
      "cost_type",
      "total_cost_for_year_project",
      "estimated_rd_hours",
    ];
  
    return fieldsToIndex.map(field => `
      CREATE INDEX IF NOT EXISTS "${schemaName}_resource_fiscal_${field}_idx"
      ON "${schemaName}".resource_fiscal (${field});
    `);
  },
  getCreateAttachmentSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".attachment_seq START 1;
    `;
  },                                                                              
  getCreateAttachmentsTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."attachments" (
        rid VARCHAR(50) NOT NULL DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT ('ATT-' || LPAD((nextval('"${schemaName}".attachment_seq'::regclass))::text, 10, '0')),
        created_datetime TIMESTAMPTZ NOT NULL,
        created_by VARCHAR(50) NOT NULL,
        modified_datetime TIMESTAMPTZ,
        modified_by VARCHAR(50),
        account_rid VARCHAR(50) NOT NULL,
        browse_file VARCHAR(1000) NOT NULL,
        document_name VARCHAR(100) NOT NULL,
        attach_to VARCHAR(50) NOT NULL,
        attachment_level VARCHAR(50) NOT NULL,
        fiscal_year INTEGER NOT NULL,
        format VARCHAR(10) NOT NULL,
        size_in_mb NUMERIC(10,2) NOT NULL,
        document_category_rid VARCHAR(50) NOT NULL,
        document_type_rid VARCHAR(50) NOT NULL,
        document_category_others VARCHAR(120),
        document_type_others VARCHAR(120),
        comments VARCHAR(2000),
        is_ai_processed BOOLEAN DEFAULT false,
        CONSTRAINT attachments_pkey PRIMARY KEY (rid),
        CONSTRAINT attachments_r_number_key UNIQUE (r_number)
      );
    `;
  },
  getCreateAttachmentsIndexesQueries(schemaName: string): string[] {
    const fieldsToIndex = [
      "r_number",
      "created_datetime",
      "created_by",
      "account_rid",
      "browse_file",
      "document_name",
      "attach_to",
      "attachment_level",
      "fiscal_year",
      "format",
      "size_in_mb",
      "document_category_rid",
      "document_type_rid",
      "comments",
    ];
  
    return fieldsToIndex.map(field => {
      const indexName = `${schemaName}_attachments_${field}_idx`;
      return `
        CREATE INDEX IF NOT EXISTS "${indexName}"
        ON "${schemaName}"."attachments"("${field}");
      `;
    });
  },
  getCreateAttachmentTimelineSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".attachment_timeline_seq START 1;
    `;
  },
  getCreateAttachmentTimelineTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".attachment_timeline (
        rid VARCHAR(50) NOT NULL DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT ('ATI-' || LPAD((nextval('"${schemaName}".attachment_timeline_seq'::regclass))::text, 10, '0')),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        document_rid VARCHAR(50) NOT NULL,
        document_name VARCHAR(255) NOT NULL,
        document_category_rid VARCHAR(50) NOT NULL,
        document_type_rid VARCHAR(50) NOT NULL,
        attach_to VARCHAR(50) NOT NULL,
        attachment_level VARCHAR(50) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_status VARCHAR(50) NOT NULL,
        event_name VARCHAR(255),
        event_datetime TIMESTAMPTZ NOT NULL,
        CONSTRAINT attachment_timeline_pkey PRIMARY KEY (rid),
        CONSTRAINT attachment_timeline_r_number_key UNIQUE (r_number)
      );
    `;
  },
  getCreateResourceFiscalRegionSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_fiscal_region_seq START 1;
    `;
  },
  getCreateResourceFiscalRegionTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".resource_fiscal_region (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT ('RSFR-' || LPAD(nextval('"${schemaName}".resource_fiscal_region_seq'::regclass)::text, 10, '0')),
        eid VARCHAR(120),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ NOT NULL,
        modified_datetime TIMESTAMPTZ,
        account_rid VARCHAR(50) NOT NULL,
        resource_rid VARCHAR(50) NOT NULL,
        resource_type_rid VARCHAR(50),
        resource_code VARCHAR(50) NOT NULL,
        fiscal_year INTEGER,
        country_rid VARCHAR(50),
        country_region_rid VARCHAR(50),
        annual_cost NUMERIC(18, 2),
        monthly_cost NUMERIC(18, 2),
        weekly_cost NUMERIC(18, 2),
        bi_weekly_cost NUMERIC(18, 2),
        daily_cost NUMERIC(18, 2),
        hourly_cost NUMERIC(18, 2),
        total_cost_for_year_project NUMERIC(14, 2),
        total_cost_for_year_project_resource_level NUMERIC(14, 2),
        total_cost_for_year_project_task_level NUMERIC(14, 2),
        total_effort_for_year_project NUMERIC(14, 2),
        total_effort_for_year_project_resource_level NUMERIC(14, 2),
        total_effort_for_year_project_task_level NUMERIC(14, 2),
        estimated_rd_hours NUMERIC(14, 2),
        effective_date TIMESTAMPTZ,
        end_date TIMESTAMPTZ,
        CONSTRAINT resource_fiscal_region_r_number_key UNIQUE (r_number)
      );
    `;
  },
  getResourceFiscalRegionForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".resource_fiscal_region
      ADD CONSTRAINT resource_fiscal_region_account_rid_fkey
        FOREIGN KEY (account_rid) REFERENCES "${schemaName}".account_details(account_rid) ON UPDATE CASCADE,
      ADD CONSTRAINT resource_fiscal_region_resource_rid_fkey
        FOREIGN KEY (resource_rid) REFERENCES "${schemaName}".resources(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateProjectResourceSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_resource_seq START 1;
    `;
  },
  getCreateProjectResourceTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".project_resource (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) UNIQUE DEFAULT 'PRS-' || LPAD(nextval('"${schemaName}".project_resource_seq')::TEXT, 10, '0'),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMP DEFAULT NOW(),
        modified_datetime TIMESTAMP,
        eid VARCHAR(120),
        project_rid VARCHAR(50) NOT NULL,
        project_fiscal_rid VARCHAR(50) NOT NULL,
        resource_rid VARCHAR(50) NOT NULL,
        fiscal_year INTEGER NOT NULL,
        project_resource_code VARCHAR(100) NOT NULL,
        start_date DATE,
        end_date DATE,
        total_hours_pro_res NUMERIC(18,2),
        total_cost_pro_res NUMERIC(18,2),
        net_total_cost_pro_res NUMERIC(18, 2),
        status_rid VARCHAR(50),
        account_rid VARCHAR(50),
        currency_rid VARCHAR(50),
        description TEXT,
        country_rid VARCHAR(50),
        region_rid VARCHAR(50),
  
        effort_project_resource_level NUMERIC(18,2),
        cost_project_resource_level NUMERIC(18,2),
        cost_project_task_level NUMERIC(18,2),
        blended_cost_project_task_level NUMERIC(18,2),
        blended_cost_project_resource_level NUMERIC(18,2),
        effort_project_task_level NUMERIC(18,2),
        total_hours_from_tasks NUMERIC(18,2),
        total_cost_from_tasks NUMERIC(18,2),
        total_cost_from_tasks_blended NUMERIC(18,2),
  
        rd_percent_potential_ai NUMERIC(18,2),
        rd_percent_adjustment NUMERIC(18,2),
        rd_percent_final NUMERIC(18,2),
  
        qre_fte NUMERIC(18,2),
        qre_subcon NUMERIC(18,2),
        qre_nonlabor NUMERIC(18,2),
        qre_final NUMERIC(18,2),
        qre_percent NUMERIC(5,2),
  
        rd_credits_fte_region_level NUMERIC(18,2),
        rd_credits_subcon_region_level NUMERIC(18,2),
        rd_credits_nonlabor_region_level NUMERIC(18,2),
        rd_credits_region_level NUMERIC(18,2),
  
        rd_credits_fte_fed_level NUMERIC(18,2),
        rd_credits_subcon_fed_level NUMERIC(18,2),
        rd_credits_nonlabor_fed_level NUMERIC(18,2),
        rd_credits_fed_level NUMERIC(18,2),
        rd_credits_total NUMERIC(18,2),
  
        salary NUMERIC(18,2),
        bonus NUMERIC(18,2),
        insurance NUMERIC(18,2),
        deductions NUMERIC(18,2),
        assigned_skill_role_type_rid VARCHAR(50),
        project_resource_role VARCHAR(100)
      );
    `;
  },
  getProjectResourceForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".project_resource
      ADD CONSTRAINT project_resource_account_rid_fkey
        FOREIGN KEY (account_rid) REFERENCES "${schemaName}".account_details(account_rid) ON UPDATE CASCADE,
      ADD CONSTRAINT project_resource_project_fiscal_rid_fkey
        FOREIGN KEY (project_fiscal_rid) REFERENCES "${schemaName}".project_fiscal(rid) ON UPDATE CASCADE,
      ADD CONSTRAINT project_resource_project_rid_fkey
        FOREIGN KEY (project_rid) REFERENCES "${schemaName}".project(rid) ON UPDATE CASCADE,
      ADD CONSTRAINT project_resource_resource_rid_fkey
        FOREIGN KEY (resource_rid) REFERENCES "${schemaName}".resources(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateProjectResourceTimelineSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_resources_timeline START 1;
    `;
  },
  getCreateProjectResourceTimelineTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".project_resource_timeline (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT (
          'PRRT-' || lpad(nextval('"${schemaName}".project_resources_timeline'::regclass)::text, 10, '0')
        ),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMP DEFAULT NOW(),
        modified_datetime TIMESTAMP,
        account_rid VARCHAR(50) NOT NULL,
        entity_rid VARCHAR(50) NOT NULL,
        document_rid VARCHAR(50),
        event_name VARCHAR(100) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        event_status VARCHAR(100) NOT NULL,
        event_datetime TIMESTAMPTZ NOT NULL,
        CONSTRAINT project_resource_timeline_r_number_key UNIQUE (r_number)
      );
    `;
  },
  getAddProjectResourceTimelineConstraintsQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".project_resource_timeline
      ADD CONSTRAINT project_resource_timeline_account_rid_fkey
        FOREIGN KEY (account_rid)
        REFERENCES "${schemaName}".account_details(account_rid)
        ON UPDATE CASCADE;
  
      ALTER TABLE "${schemaName}".project_resource_timeline
      ADD CONSTRAINT project_resource_timeline_entity_rid_fkey
        FOREIGN KEY (entity_rid)
        REFERENCES "${schemaName}".project_resource(rid)
        ON UPDATE CASCADE;
    `;
  },                
  getCreateProjectResourceHistorySequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_resource_history_seq START 1;
    `;
  },
  getCreateProjectResourceHistoryTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".project_resource_history (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) UNIQUE DEFAULT 'PRRH-' || LPAD(nextval('"${schemaName}".project_resource_history_seq')::TEXT, 10, '0'),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        modified_datetime TIMESTAMP WITHOUT TIME ZONE,
        project_resource_rid VARCHAR(50) NOT NULL,
        attribute_name VARCHAR(100) NOT NULL,
        old_value VARCHAR(2000),
        new_value VARCHAR(2000) NOT NULL
      );
    `;
  },
  getAddProjectResourceHistoryConstraintsQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".project_resource_history
      ADD CONSTRAINT project_resource_history_project_resource_rid_fkey
      FOREIGN KEY (project_resource_rid)
      REFERENCES "${schemaName}".project_resource(rid)
      ON UPDATE CASCADE;
    `;
  },
  getCreateProjectResourceFiscalSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_resource_fiscal_seq START 1;
    `;
  },
  getCreateProjectResourceFiscalTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".project_resource_fiscal (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number varchar(20) DEFAULT (('PRSF-'::text || lpad(nextval('"${schemaName}".project_resource_fiscal_seq'::regclass)::text, 10, '0'::text))) NULL,
        eid varchar(120) NULL,
        created_by varchar(255) NOT NULL,
        modified_by varchar(255) NULL,
        created_datetime timestamptz NOT NULL,
        modified_datetime timestamptz NULL,
        account_rid varchar(50) NOT NULL,
        project_rid varchar(50) NOT NULL,
        project_fiscal_rid VARCHAR(50) NOT NULL,
        resource_rid varchar(50) NOT NULL,
        fiscal_year integer NOT NULL,
  
        total_hours_pro_res numeric(18, 2) NULL,
        total_cost_pro_res numeric(18, 2) NULL,
        status_rid varchar(50) NULL,
        country_rid varchar(50) NULL,
        region_rid varchar(50) NULL,
        currency_rid varchar(50) NULL,
        
        effort_project_resource_level numeric(18, 2) NULL,
        cost_project_resource_level numeric(18, 2) NULL,
        cost_project_task_level numeric(18, 2) NULL,
        blended_cost_project_task_level numeric(18, 2) NULL,
        blended_cost_project_resource_level numeric(18, 2) NULL,
        effort_project_task_level numeric(18, 2) NULL,
        total_hours_from_tasks numeric(18, 2) NULL,
        total_cost_from_tasks numeric(18, 2) NULL,
        total_cost_from_tasks_blended numeric(18, 2) NULL,
        rd_percent_potential_ai numeric(18, 2) NULL,
        rd_percent_adjustment numeric(18, 2) NULL,
        rd_percent_final numeric(18, 2) NULL,
        qre_fte numeric(18, 2) NULL,
        qre_subcon numeric(18, 2) NULL,
        qre_nonlabor numeric(18, 2) NULL,
        qre_final numeric(18, 2) NULL,
        rd_credits_fte_region_level numeric(18, 2) NULL,
        rd_credits_subcon_region_level numeric(18, 2) NULL,
        rd_credits_nonlabor_region_level numeric(18, 2) NULL,
        rd_credits_region_level numeric(18, 2) NULL,
        rd_credits_fte_fed_level numeric(18, 2) NULL,
        rd_credits_subcon_fed_level numeric(18, 2) NULL,
        rd_credits_nonlabor_fed_level numeric(18, 2) NULL,
        rd_credits_fed_level numeric(18, 2) NULL,
        rd_credits_total numeric(18, 2) NULL,
        description varchar(2000) NULL,
        CONSTRAINT project_resources_fiscal_r_number_key UNIQUE (r_number)
      );
    `;
  },
  getAddProjectResourceFiscalConstraintsQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".project_resource_fiscal
      ADD CONSTRAINT project_resource_fiscal_account_rid_fkey FOREIGN KEY (account_rid) REFERENCES "${schemaName}".account_details(account_rid) ON UPDATE CASCADE,
      ADD CONSTRAINT project_resource_fiscal_project_fiscal_rid_fkey FOREIGN KEY (project_fiscal_rid) REFERENCES "${schemaName}".project_fiscal(rid) ON UPDATE CASCADE,
      ADD CONSTRAINT project_resource_fiscal_project_rid_fkey FOREIGN KEY (project_rid) REFERENCES "${schemaName}".project(rid) ON UPDATE CASCADE,
      ADD CONSTRAINT project_resource_fiscal_resource_rid_fkey FOREIGN KEY (resource_rid) REFERENCES "${schemaName}".resources(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateProjectResourceFiscalRegionSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_resource_fiscal_region_seq START 1;
    `;
  },
  getCreateProjectResourceFiscalRegionTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".project_resource_fiscal_region (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number varchar(20) DEFAULT (('PRSFR-'::text || lpad(nextval('"${schemaName}".project_resource_fiscal_region_seq'::regclass)::text, 10, '0'::text))) NULL,
        eid varchar(120) NULL,
        created_by varchar(255) NOT NULL,
        modified_by varchar(255) NULL,
        created_datetime timestamptz NOT NULL,
        modified_datetime timestamptz NULL,
        account_rid varchar(50) NOT NULL,
        project_rid varchar(50) NOT NULL,
        project_fiscal_rid VARCHAR(50) NOT NULL,
        resource_rid varchar(50) NOT NULL,
        fiscal_year integer NOT NULL,
        
        total_hours_pro_res numeric(18, 2) NULL,
        total_cost_pro_res numeric(18, 2) NULL,
        status_rid varchar(50) NULL,
        country_rid varchar(50) NULL,
        region_rid varchar(50) NULL,
        currency_rid varchar(50) NULL,
        
        effort_project_resource_level numeric(18, 2) NULL,
        cost_project_resource_level numeric(18, 2) NULL,
        cost_project_task_level numeric(18, 2) NULL,
        blended_cost_project_task_level numeric(18, 2) NULL,
        blended_cost_project_resource_level numeric(18, 2) NULL,
        effort_project_task_level numeric(18, 2) NULL,
        total_hours_from_tasks numeric(18, 2) NULL,
        total_cost_from_tasks numeric(18, 2) NULL,
        total_cost_from_tasks_blended numeric(18, 2) NULL,
        rd_percent_potential_ai numeric(18, 2) NULL,
        rd_percent_adjustment numeric(18, 2) NULL,
        rd_percent_final numeric(18, 2) NULL,
        qre_fte numeric(18, 2) NULL,
        qre_subcon numeric(18, 2) NULL,
        qre_nonlabor numeric(18, 2) NULL,
        qre_final numeric(18, 2) NULL,
        rd_credits_fte_region_level numeric(18, 2) NULL,
        rd_credits_subcon_region_level numeric(18, 2) NULL,
        rd_credits_nonlabor_region_level numeric(18, 2) NULL,
        rd_credits_region_level numeric(18, 2) NULL,
        rd_credits_fte_fed_level numeric(18, 2) NULL,
        rd_credits_subcon_fed_level numeric(18, 2) NULL,
        rd_credits_nonlabor_fed_level numeric(18, 2) NULL,
        rd_credits_fed_level numeric(18, 2) NULL,
        rd_credits_total numeric(18, 2) NULL,
        description varchar(2000) NULL,
        CONSTRAINT project_resources_fiscal_region_r_number_key UNIQUE (r_number)
      );
    `;
  },
  getAddProjectResourceFiscalRegionConstraintsQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".project_resource_fiscal_region
      ADD CONSTRAINT project_resource_fiscal_region_account_rid_fkey FOREIGN KEY (account_rid) REFERENCES "${schemaName}".account_details(account_rid) ON UPDATE CASCADE,
      ADD CONSTRAINT project_resource_fiscal_region_project_fiscal_rid_fkey FOREIGN KEY (project_fiscal_rid) REFERENCES "${schemaName}".project_fiscal(rid) ON UPDATE CASCADE,
      ADD CONSTRAINT project_resource_fiscal_region_project_rid_fkey FOREIGN KEY (project_rid) REFERENCES "${schemaName}".project(rid) ON UPDATE CASCADE,
      ADD CONSTRAINT project_resource_fiscal_region_resource_rid_fkey FOREIGN KEY (resource_rid) REFERENCES "${schemaName}".resources(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateProjectTasksSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_tasks_seq START 1;
    `;
  },
  getCreateProjectTaskTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".project_task (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number varchar(20) DEFAULT (('PTA-'::text || lpad(nextval('"${schemaName}".project_tasks_seq'::regclass)::text, 10, '0'::text))) NULL,
        eid varchar(120) NULL,
        created_by varchar(255) NOT NULL,
        modified_by varchar(255) NULL,
        created_datetime timestamptz NOT NULL,
        modified_datetime timestamptz NULL,
        account_rid varchar(50) NOT NULL,
        project_rid varchar(50) NOT NULL,
        project_fiscal_rid varchar(50) NOT NULL,
        project_resource_code varchar(50) NOT NULL,
        resource_rid varchar(50) NOT NULL,
        fiscal_year int4 NOT NULL,
        start_date date NULL,
        end_date date NULL,
        country_rid varchar(50) NULL,
        region_rid varchar(50) NULL,
        currency_rid varchar(50) NULL,
        total_hours_pro_task numeric(18, 2) NULL,
        total_cost_pro_task numeric(18, 2) NULL,
        "comments" varchar(2000) NULL,
        project_resource_rid varchar(50) NOT NULL,
        status_rid varchar(50) NOT NULL,
        task_name text NULL,
        task_type_rid varchar(50) NULL,
        task_classification_rid varchar(50) NULL,
        task_description varchar(2000) NULL,
        CONSTRAINT project_task_r_number_key UNIQUE (r_number)
      );
    `;
  },
  getAddProjectTaskConstraintsQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".project_task
      ADD CONSTRAINT project_task_account_rid_fkey FOREIGN KEY (account_rid) REFERENCES "${schemaName}".account_details(account_rid) ON UPDATE CASCADE,
      ADD CONSTRAINT project_task_project_fiscal_rid_fkey FOREIGN KEY (project_fiscal_rid) REFERENCES "${schemaName}".project_fiscal(rid) ON UPDATE CASCADE,
      ADD CONSTRAINT project_task_resource_rid_fkey FOREIGN KEY (resource_rid) REFERENCES "${schemaName}".resources(rid) ON UPDATE CASCADE,
      ADD CONSTRAINT project_task_project_rid_fkey FOREIGN KEY (project_rid) REFERENCES "${schemaName}".project(rid) ON UPDATE CASCADE,
      ADD CONSTRAINT project_task_project_resource_rid_fkey FOREIGN KEY (project_resource_rid) REFERENCES "${schemaName}".project_resource(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateProjectTaskTimelineSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_task_timeline_seq START 1;
    `;
  },
  getCreateProjectTaskTimelineTableQuery(schemaName: string): string {
    return `
      CREATE TABLE "${schemaName}".project_task_timeline (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number varchar(20) DEFAULT (('PTAT-'::text || lpad(nextval('"${schemaName}".project_task_timeline_seq'::regclass)::text, 10, '0'::text))) NULL,
        created_by varchar(50) NULL,
        modified_by varchar(50) NULL,
        event_datetime timestamptz NOT NULL,
        created_datetime timestamptz NOT NULL,
        modified_datetime timestamptz NULL,
        account_rid varchar(50) NOT NULL,
        entity_rid varchar(50) NOT NULL,
        event_name varchar(100) NOT NULL,
        event_type varchar(100) NOT NULL,
        event_status varchar(100) NOT NULL,
        document_rid varchar(100) NULL,
        CONSTRAINT project_task_timeline_r_number_key UNIQUE (r_number)
      );
    `;
  },
  getAddProjectTaskTimelineConstraintsQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".project_task_timeline
      ADD CONSTRAINT project_task_timeline_account_rid_fkey FOREIGN KEY (account_rid) REFERENCES "${schemaName}".account_details(account_rid) ON UPDATE CASCADE,
      ADD CONSTRAINT project_task_timeline_entity_rid_fkey FOREIGN KEY (entity_rid) REFERENCES "${schemaName}".project_task(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateProjectTaskHistorySequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_task_history_seq START 1;
    `;
  },
  getCreateProjectTaskHistoryTableQuery(schemaName: string): string {
    return `
      CREATE TABLE "${schemaName}".project_task_history (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number varchar(20) DEFAULT (('PTAH-'::text || lpad(nextval('"${schemaName}".project_task_history_seq'::regclass)::text, 10, '0'::text))) NOT NULL,
        project_task_rid varchar(50) NOT NULL,
        attribute_name varchar(100) NOT NULL,
        old_value varchar(2000) NULL,
        new_value varchar(2000) NOT NULL,
        modified_datetime timestamptz NOT NULL,
        created_datetime timestamptz NOT NULL,
        modified_by varchar(50) NOT NULL,
        created_by varchar(50) NOT NULL,
        CONSTRAINT project_task_history_r_number_key UNIQUE (r_number)
      );
    `;
  },
  getAddProjectTaskHistoryConstraintsQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".project_task_history
      ADD CONSTRAINT project_task_history_project_task_rid_fkey FOREIGN KEY (project_task_rid) REFERENCES "${schemaName}".project_task(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateInteractionsSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".interactions_seq START 1;
    `;
  },
  getCheckListSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".checklist_seq START 1;
    `;
  },
  getCreateInteractionsTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".interactions (
        rid VARCHAR(50) DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) UNIQUE DEFAULT 'INT-' || LPAD(nextval('"${schemaName}".interactions_seq')::TEXT, 10, '0'),
        eid character varying(120),
        created_by character varying(50) NOT NULL,
        modified_by character varying(50),
        created_datetime timestamp with time zone NOT NULL DEFAULT NOW(),
        modified_datetime timestamp with time zone,
        account_rid character varying(50) NOT NULL,
        project_rid character varying(50),
        project_fiscal_rid character varying(50),
        fiscal_year integer,
        interaction_source_rid character varying(255) NOT NULL,
        interaction_type_rid character varying(50) NOT NULL,
        template_rid character varying(50),
        recipient_email character varying(50),
        recipient_name character varying(50),
        sent_by_rid character varying(50),
        sent_by_mail_id character varying(255),
        sent_on_datetime timestamp with time zone,
        parent_interaction_rid character varying(50),
        interaction_iteration integer,
        last_resent_on timestamp with time zone,
        last_reminder_on timestamp with time zone,
        last_reminder_by varchar(255),
        response_from character varying(255),
        response_updated_on timestamp with time zone,
        response_updated_by character varying(50),
        response_submitted_on character varying(50),
        response_submission_by character varying(50),
        response_source_rid character varying(50),
        status_rid character varying(50) NOT NULL,
        interaction_url character varying(255),
        interaction_age integer,
        attachment_count integer,
        is_ai_processed boolean default false,
        interaction_version integer,
        interaction_level_rid varchar(50),
        CONSTRAINT interactions_rid_unique UNIQUE (rid)
      );
    `;
  },
   getCreateChecklistTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".checklists (
        rid VARCHAR(50) DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) UNIQUE DEFAULT 'CHK-' || LPAD(nextval('"${schemaName}".checklist_seq')::TEXT, 10, '0'),
        created_by character varying(50) NOT NULL,
        modified_by character varying(50),
        created_datetime timestamp with time zone NOT NULL DEFAULT NOW(),
        modified_datetime timestamp with time zone,
        account_rid character varying(50) NOT NULL,
        attach_to character varying(50),
        attachment_level character varying(50),
        fiscal_year integer,
        checklist_template_rid character varying(50) NOT NULL,
        checklist_name character varying(255) NOT NULL,
        checklist_description character varying(2000),
        assigned_to character varying(50),
        status_rid character varying(50),
        CONSTRAINT checklists_rid_unique UNIQUE (rid)
          CONSTRAINT checklists_pkey PRIMARY KEY (rid),
    CONSTRAINT checklists_r_number_key UNIQUE (r_number),
    CONSTRAINT checklists_account_rid_fkey FOREIGN KEY (account_rid)
        REFERENCES ${schemaName}.account_details (account_rid) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE NO ACTION
      );
    `;
  },
   getCreateChecklistIndexesQueries(schemaName: string): string[] {
    const fieldsToIndex = [
      "account_rid",
      "rid",
      "fiscal_year",
      "attach_to",
      "attachment_level"
    ];
    
    return fieldsToIndex.map(field => {
      const indexName = `${schemaName}_checklists_${field}_idx`;
      return `
        CREATE INDEX IF NOT EXISTS "${indexName}"
        ON "${schemaName}"."checklists"("${field}");
      `;
    });
  },
   getCreateCheckListItemTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".checklist_items (
        rid VARCHAR(50) DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        created_by character varying(50) NOT NULL,
        modified_by character varying(50),
        created_datetime timestamp with time zone NOT NULL DEFAULT NOW(),
        modified_datetime timestamp with time zone,
        account_rid character varying(50) NOT NULL,
        checklist_rid character varying(50) NOT NULL,
        checklist_item_name character varying(255) NOT NULL,
        checklist_item_description character varying(2000),
        status_rid character varying(50),
        CONSTRAINT checklist_items_pkey UNIQUE (rid)
        CONSTRAINT checklist_items_account_rid_fkey FOREIGN KEY (account_rid)
        REFERENCES ${schemaName}.account_details (account_rid) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE NO ACTION
      );
    `;
  },
   getCreateCheckListItemIndexesQueries(schemaName: string): string[] {
    const fieldsToIndex = [
      "account_rid",
      "checklist_rid",
      "rid"
    ];
    
    return fieldsToIndex.map(field => {
      const indexName = `${schemaName}_checklist_items_${field}_idx`;
      return `
        CREATE INDEX IF NOT EXISTS "${indexName}"
        ON "${schemaName}"."checklist_items"("${field}");
      `;
    });
  },
  getCreateInteractionsIndexesQueries(schemaName: string): string[] {
    const fieldsToIndex = [
      "account_rid",
      "project_rid",
      "fiscal_year",
      "project_fiscal_rid",
      "interaction_level_rid"
    ];
    
    return fieldsToIndex.map(field => {
      const indexName = `${schemaName}_interactions_${field}_idx`;
      return `
        CREATE INDEX IF NOT EXISTS "${indexName}"
        ON "${schemaName}"."interactions"("${field}");
      `;
    });
  },
  getCreateInteractionStatusHistoryTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".interaction_status_history (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        created_by VARCHAR(50),
        created_datetime TIMESTAMP NOT NULL DEFAULT NOW(),
        interaction_rid VARCHAR(50) NOT NULL,
        old_status_rid VARCHAR(50),
        new_status_rid VARCHAR(50) NOT NULL
      );
    `;
  },
  getCreateInteractionStatusChangeFunctionQuery(schemaName: string): string {
    return `
      CREATE OR REPLACE FUNCTION "${schemaName}".log_interaction_status_change()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          INSERT INTO "${schemaName}".interaction_status_history (
            interaction_rid,
            created_by,
            created_datetime,
            old_status_rid,
            new_status_rid
          )
          VALUES (
            NEW.rid,
            NEW.created_by,
            NOW(),
            NULL,
            NEW.status_rid
          );
        ELSIF TG_OP = 'UPDATE' AND (OLD.status_rid IS DISTINCT FROM NEW.status_rid) THEN
          INSERT INTO "${schemaName}".interaction_status_history (
            interaction_rid,
            created_by,
            created_datetime,
            old_status_rid,
            new_status_rid
          )
          VALUES (
            NEW.rid,
            NEW.modified_by,
            NOW(),
            OLD.status_rid,
            NEW.status_rid
          );
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
  },
  getDropTriggerQuery(schemaName: string): string {
    return `
      DROP TRIGGER IF EXISTS trg_log_interaction_status_change ON "${schemaName}".interactions;
    `;
  },
  getCreateTriggerQuery(schemaName: string): string {
    return `
      CREATE TRIGGER trg_log_interaction_status_change
      AFTER INSERT OR UPDATE OF status_rid ON "${schemaName}".interactions
      FOR EACH ROW
      EXECUTE FUNCTION "${schemaName}".log_interaction_status_change();
    `;
  },
  getCreateInteractionItemSequencesQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".interaction_item_seq START 1;
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".question_seq START 1;
    `;
  },
  getCreateInteractionItemsTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".interaction_items (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) UNIQUE DEFAULT 'ITI-' || LPAD(nextval('"${schemaName}".interaction_item_seq')::TEXT, 10, '0'),
        eid character varying(120),
        created_by varchar(50) NOT NULL,
        modified_by varchar(50),
        created_datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        modified_datetime TIMESTAMP WITH TIME ZONE,
        account_rid character varying(50) NOT NULL,
        project_rid character varying(50),
        fiscal_year character varying(50),
        project_fiscal_rid character varying(50),
        interaction_rid character varying(50),
        question_seq_num VARCHAR(20) UNIQUE DEFAULT 'QUE-' || LPAD(nextval('"${schemaName}".question_seq')::TEXT, 10, '0'),
        is_mandatory boolean DEFAULT false NOT NULL,
        question character varying(2000),
        notes character varying(2000),
        is_attachment boolean,
        account_interaction_rid varchar(50),
        interaction_level_rid varchar(50)
      );
    `;
  },
  getAlterInteractionItemsForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".interaction_items ADD CONSTRAINT interaction_items_account_rid_fkey FOREIGN KEY (account_rid) REFERENCES "${schemaName}".account_details(account_rid) ON UPDATE CASCADE;
      ALTER TABLE "${schemaName}".interaction_items ADD CONSTRAINT interaction_items_project_rid_fkey FOREIGN KEY (project_rid) REFERENCES "${schemaName}".project(rid) ON UPDATE CASCADE;
      ALTER TABLE "${schemaName}".interaction_items ADD CONSTRAINT interaction_items_interaction_rid_fkey FOREIGN KEY (interaction_rid) REFERENCES "${schemaName}".interactions(rid) ON UPDATE CASCADE;
      ALTER TABLE "${schemaName}".interaction_items ADD CONSTRAINT interaction_items_project_fiscal_rid_fkey FOREIGN KEY (project_fiscal_rid) REFERENCES "${schemaName}".project_fiscal(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateInteractionItemsIndexesQueries(schemaName: string): string[] {
    const fields = [
      "account_rid",
      "project_rid",
      "fiscal_year",
      "interaction_rid",
      "project_fiscal_rid"
    ];
    
    return fields.map(field => {
      const indexName = `${schemaName}_interaction_items_${field}_idx`;
      return `
        CREATE INDEX IF NOT EXISTS "${indexName}"
        ON "${schemaName}"."interaction_items"("${field}");
      `;
    });
  },
  getCreateInteractionHistorySequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".interaction_history_seq START 1;
    `;
  },
  getCreateInteractionHistoryTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".interaction_history (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) UNIQUE DEFAULT 'INH-' || LPAD(nextval('"${schemaName}".interaction_history_seq')::TEXT, 10, '0'),
        created_by varchar(50) NOT NULL,
        modified_by varchar(50),
        created_datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        modified_datetime TIMESTAMP WITH TIME ZONE,
        interaction_rid varchar(50) NOT NULL,
        interaction_item_rid varchar(50) NOT NULL,
        project_fiscal_rid varchar(50),
        attribute_name VARCHAR(100) NOT NULL,
        old_value VARCHAR(2000),
        new_value VARCHAR(2000)
      );
    `;
  },
  getAlterInteractionHistoryForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".interaction_history
      ADD CONSTRAINT interaction_history_interaction_rid_fkey
      FOREIGN KEY (interaction_rid) REFERENCES "${schemaName}".interactions(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateInteractionResponseHistorySequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".interaction_response_seq START 1;
    `;
  },
  getCreateInteractionResponseHistoryTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".interaction_response_history (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) UNIQUE DEFAULT 'ITR-' || LPAD(nextval('"${schemaName}".interaction_response_seq')::TEXT, 10, '0'),
        created_by varchar(50) NOT NULL,
        modified_by varchar(50),
        created_datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        modified_datetime TIMESTAMP WITH TIME ZONE,
        interaction_rid character varying(50) NOT NULL,
        interaction_item_rid character varying(50),
        interaction_response text,
        response_on timestamp with time zone,
        response_email character varying(255),
        response_by character varying(50),
        response_source_rid character varying(50),
        interaction_version integer
      );
    `;
  },
  getAlterInteractionResponseHistoryForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".interaction_response_history
      ADD CONSTRAINT interaction_rid_fkey
        FOREIGN KEY (interaction_rid) REFERENCES "${schemaName}".interactions(rid) ON UPDATE CASCADE,
      ADD CONSTRAINT interaction_item_rid_fkey
        FOREIGN KEY (interaction_item_rid) REFERENCES "${schemaName}".interaction_items(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateInteractionResponseHistoryIndexes(schemaName: string): string[] {
    const fieldsToIndex = ["interaction_rid", "interaction_item_rid"];
    return fieldsToIndex.map((field) => `
      CREATE INDEX IF NOT EXISTS "${schemaName}_interaction_response_history_${field}_idx"
      ON "${schemaName}"."interaction_response_history"("${field}");
    `);
  },
  getCreateInteractionAttachmentsTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".interaction_attachments (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        created_by varchar(50) NOT NULL,
        modified_by varchar(50),
        created_datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        modified_datetime TIMESTAMP WITH TIME ZONE,
        interaction_rid character varying(50) NOT NULL,
        interaction_item_rid character varying(50),
        interaction_response_rid character varying(50),
        attachment_name character varying(255) NOT NULL,
        attachment_type character varying(50) NOT NULL,
        attachment_size numeric(10,2) NOT NULL,
        attachment_url character varying(1000) NOT NULL,
        interaction_version integer
      );
    `;
  },
  getAlterInteractionAttachmentsForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".interaction_attachments
      ADD CONSTRAINT interaction_rid_fkey
        FOREIGN KEY (interaction_rid) REFERENCES "${schemaName}".interactions(rid) ON UPDATE CASCADE,
      ADD CONSTRAINT interaction_item_rid_fkey
        FOREIGN KEY (interaction_item_rid) REFERENCES "${schemaName}".interaction_items(rid) ON UPDATE CASCADE,
      ADD CONSTRAINT interaction_response_rid_fkey
        FOREIGN KEY (interaction_response_rid) REFERENCES "${schemaName}".interaction_response_history(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateInteractionAttachmentsIndexes(schemaName: string): string[] {
    const fieldsToIndex = [
      "interaction_rid",
      "interaction_item_rid",
      "interaction_response_rid"
    ];
    
    return fieldsToIndex.map((field) => `
      CREATE INDEX IF NOT EXISTS "${schemaName}_interaction_attachments_${field}_idx"
      ON "${schemaName}"."interaction_attachments"("${field}");
    `);
  },
  getCreateAiTechnicalSummarySequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".ai_technical_summary_seq START 1;
    `;
  },
  getCreateAiTechnicalSummaryTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".ai_technical_summary (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number varchar(20) UNIQUE DEFAULT (('ATS-'::text || lpad(nextval('"${schemaName}".ai_technical_summary_seq'::regclass)::text, 10, '0'::text))) NULL,
        eid character varying(120),
        created_by varchar(50) NOT NULL,
        modified_by varchar(50),
        created_datetime TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_datetime TIMESTAMP,
        account_rid varchar(50) NOT NULL,
        project_rid VARCHAR(50) NOT NULL,
        fiscal_year INT NOT NULL,
        project_fiscal_rid VARCHAR(50),
        technical_summary TEXT,
        version INT DEFAULT 1,
        status_rid VARCHAR(50),
        entity_transaction_rid VARCHAR(50),
        technical_summary_refinement_prompt TEXT
      );
    `;
  },
  getAlterAiTechnicalSummaryForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".ai_technical_summary
      ADD CONSTRAINT ai_technical_summary_account_rid_fkey FOREIGN KEY (account_rid)
        REFERENCES "${schemaName}".account_details(account_rid) ON UPDATE CASCADE,
      ADD CONSTRAINT ai_technical_summary_project_rid_fkey FOREIGN KEY (project_rid)
        REFERENCES "${schemaName}".project(rid) ON UPDATE CASCADE,
      ADD CONSTRAINT ai_technical_summary_project_fiscal_rid_fkey FOREIGN KEY (project_fiscal_rid)
        REFERENCES "${schemaName}".project_fiscal(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateAiTechnicalSummaryIndexes(schemaName: string): string[] {
    const fieldsToIndex = [
      "account_rid",
      "project_rid",
      "project_fiscal_rid",
      "status_rid"
    ];
  
    return fieldsToIndex.map(field => `
      CREATE INDEX IF NOT EXISTS "${schemaName}_ai_technical_summary_${field}_idx"
      ON "${schemaName}"."ai_technical_summary"("${field}");
    `);
  },
  getCreateInteractionTimelineSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".interaction_timeline_seq START 1;
    `;
  },
  getCreateInteractionTimelineTableQuery(schemaName: string): string {
    return `
      CREATE TABLE "${schemaName}".interaction_timeline (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number varchar(20) UNIQUE DEFAULT (('ITI-'::text || lpad(nextval('"${schemaName}".interaction_timeline_seq'::regclass)::text, 10, '0'::text))) NULL,
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMP DEFAULT NOW(),
        modified_datetime TIMESTAMP,
        account_rid varchar(50) NOT NULL,
        entity_rid varchar(50) NOT NULL,
        event_name varchar(100) NOT NULL,
        event_type varchar(100) NOT NULL,
        event_status varchar(100) NOT NULL,
        event_datetime timestamptz NOT NULL
      );
    `;
  },
  getAlterInteractionTimelineForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".interaction_timeline
      ADD CONSTRAINT interaction_timeline_account_rid_fkey FOREIGN KEY (account_rid)
        REFERENCES "${schemaName}".account_details(account_rid) ON UPDATE CASCADE,
      ADD CONSTRAINT interaction_timeline_entity_rid_fkey FOREIGN KEY (entity_rid)
        REFERENCES "${schemaName}".interactions(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateAiAssessmentAuditTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".ai_assessment_audit (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        created_by varchar(50) NOT NULL,
        modified_by varchar(50),
        created_datetime TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_datetime TIMESTAMP,
        transaction_id VARCHAR(50) NOT NULL,
        project_rid VARCHAR(50),
        project_fiscal_rid VARCHAR(50) NOT NULL,
        account_rid VARCHAR(50) NOT NULL,
        is_qre_processed BOOLEAN NOT NULL DEFAULT FALSE,
        is_tech_summary_processed BOOLEAN NOT NULL DEFAULT FALSE,
        is_interaction_question_processed BOOLEAN NOT NULL DEFAULT FALSE,
        data_ingestion BOOLEAN NOT NULL DEFAULT FALSE,
        ai_assessment_api_status TEXT,
        interaction_question_error_message JSON,
        qre_error_message JSON,
        technical_summary_error_message JSON,
        data_ingestion_error_message JSON
      );
    `;
  },
  getAlterAiAssessmentAuditForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".ai_assessment_audit
      ADD CONSTRAINT ai_assessment_audit_account_rid_fkey FOREIGN KEY (account_rid)
        REFERENCES "${schemaName}".account_details(account_rid) ON UPDATE CASCADE,
      ADD CONSTRAINT ai_assessment_audit_project_rid_fkey FOREIGN KEY (project_rid)
        REFERENCES "${schemaName}".project(rid) ON UPDATE CASCADE,
      ADD CONSTRAINT ai_assessment_audit_project_fiscal_rid_fkey FOREIGN KEY (project_fiscal_rid)
        REFERENCES "${schemaName}".project_fiscal(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateAiAssessmentQreTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".ai_assessment_qre (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        created_by varchar(50) NOT NULL,
        modified_by varchar(50),
        created_datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        modified_datetime TIMESTAMP WITH TIME ZONE,
        transaction_id VARCHAR(50) NOT NULL,
        project_fiscal_rid VARCHAR(50) NOT NULL,
        project_rid VARCHAR(50),
        account_rid VARCHAR(50) NOT NULL,
        qre_percent DECIMAL(18,2) NOT NULL,
        qre_detailed_breakdown JSON,
        version INTEGER
      );
    `;
  },
  getAlterAiAssessmentQreForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".ai_assessment_qre
      ADD CONSTRAINT ai_assessment_qre_account_rid_fkey FOREIGN KEY (account_rid)
        REFERENCES "${schemaName}".account_details(account_rid) ON UPDATE CASCADE,
      ADD CONSTRAINT ai_assessment_qre_project_rid_fkey FOREIGN KEY (project_rid)
        REFERENCES "${schemaName}".project(rid) ON UPDATE CASCADE,
      ADD CONSTRAINT ai_assessment_qre_project_fiscal_rid_fkey FOREIGN KEY (project_fiscal_rid)
        REFERENCES "${schemaName}".project_fiscal(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateAutosendInteractionAuditTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".autosend_interaction_audit (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        project_fiscal_rid character varying(50),
        account_rid character varying(50),
        interaction_level character varying(50),
        created_datetime timestamp with time zone DEFAULT now(),
        created_by character varying(50)
      );
    `;
  },
  getAlterAutosendInteractionAuditForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".autosend_interaction_audit
      ADD CONSTRAINT project_fiscal_rid_fkey
      FOREIGN KEY (project_fiscal_rid)
      REFERENCES "${schemaName}".project_fiscal(rid) ON UPDATE CASCADE;
    `;
  },
  getCreateAutosendInteractionAuditIndexes(schemaName: string): string[] {
    const fieldsToIndex = ["project_fiscal_rid"];
    
    return fieldsToIndex.map(field => `
      CREATE INDEX IF NOT EXISTS "${schemaName}_autosend_interaction_audit_${field}_idx"
      ON "${schemaName}".autosend_interaction_audit("${field}");
    `);
  },
  getCreateOtpEntriesTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".otp_entries (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        created_by TEXT NOT NULL,
        modified_by TEXT,
        created_datetime TIMESTAMP NOT NULL,
        modified_datetime TIMESTAMP,
        email VARCHAR(120) NOT NULL,
        account_rid TEXT NOT NULL,
        interaction_rid TEXT NOT NULL,
        project_fiscal_rid VARCHAR(50),
        otp VARCHAR(100) NOT NULL,
        is_verified BOOLEAN DEFAULT false NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        otp_attempt_count NUMERIC,
        otp_block_until TIMESTAMPTZ
      );
    `;
  },
  getAlterOtpEntriesForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".otp_entries
      ADD CONSTRAINT fk_otp_account_rid
      FOREIGN KEY (account_rid)
      REFERENCES "${schemaName}".account_details(account_rid)
      ON DELETE CASCADE;
    `;
  },
  getCreateOtpEntriesHistoryTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".otp_entries_history (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        created_by VARCHAR(50) NOT NULL,
        created_datetime TIMESTAMP NOT NULL,
        email VARCHAR(120) NOT NULL,
        account_rid VARCHAR(50) NOT NULL,
        interaction_rid VARCHAR(100) NOT NULL,
        project_fiscal_rid VARCHAR(50),
        otp VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL,
        attempt_number INT NOT NULL,
        error_message TEXT NULL,
        CONSTRAINT otp_entries_history_status_check CHECK (
          status IN ('SENT', 'RESENT', 'SEND_FAILED', 'VERIFIED', 'VERIFICATION_FAILED')
        )
      );
    `;
  },
  getAlterOtpEntriesHistoryForeignKeysQuery(schemaName: string): string {
    return `
      ALTER TABLE "${schemaName}".otp_entries_history
        ADD CONSTRAINT fk_otp_entries_history_account_rid
        FOREIGN KEY (account_rid)
        REFERENCES "${schemaName}".account_details(account_rid)
        ON DELETE SET NULL;
  
      ALTER TABLE "${schemaName}".otp_entries_history
        ADD CONSTRAINT fk_otp_entries_history_interaction_rid
        FOREIGN KEY (interaction_rid, project_fiscal_rid)
        REFERENCES "${schemaName}".interactions(rid, project_fiscal_rid)
        ON DELETE SET NULL;
    `;
  },
  getCreateWebhookEmailHistoryTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".webhook_email_history (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        created_by VARCHAR(50) NOT NULL,
        created_datetime TIMESTAMP NOT NULL,
        email_subject VARCHAR(500) NOT NULL,
        email_sender VARCHAR(200) NOT NULL,
        attachment_name VARCHAR(255) NULL,
        extracted_answers TEXT NULL,
        uploaded_time TIMESTAMP NOT NULL,
        status VARCHAR(20) NOT NULL,
        error_message TEXT NULL,
        CONSTRAINT webhook_email_history_status_check CHECK (
          status IN ('SUCCESS', 'FAILED', 'MISSING_ATTACHMENT', 'INVALID_FORMAT', 'NO_MATCH_FOUND')
        )
      );
    `;
  },
  getCreateNotesSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".notes START 1;
    `;
  },
  getCreateNotesTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."notes" (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) UNIQUE DEFAULT ('NOT-' || LPAD(nextval('"${schemaName}".notes_seq')::TEXT, 10, '0')),
        created_datetime TIMESTAMPTZ NOT NULL,
        created_by VARCHAR(50) NOT NULL,
        modified_datetime TIMESTAMPTZ,
        modified_by VARCHAR(50),
        account_rid VARCHAR(50) NOT NULL,
        browse_file VARCHAR(1000) NULL,
        document_name VARCHAR(100) NULL,
        attach_to VARCHAR(50) NOT NULL,
        attachment_level VARCHAR(50) NOT NULL,
        fiscal_year INTEGER NOT NULL,
        format VARCHAR(10) NULL,
        size_in_mb NUMERIC(10,2) NULL,
        title VARCHAR(64) NOT NULL,
        notes_owner VARCHAR(64) NOT NULL,
        descriptions VARCHAR(2000)
      );
    `;
  },
  getCreateNotesIndexes(schemaName: string): string[] {
    const fieldsToIndex = [
      "r_number",
      "created_datetime",
      "created_by",
      "account_rid",
      "browse_file",
      "document_name",
      "attach_to",
      "attachment_level",
      "fiscal_year",
      "format",
      "size_in_mb",
      "title",
      "notes_owner",
      "descriptions",
    ];
  
    return fieldsToIndex.map(field => `
      CREATE INDEX IF NOT EXISTS "${schemaName}_notes_${field}_idx"
      ON "${schemaName}"."notes"("${field}");
    `);
  },
  getCreateNotesTimelineSequenceQuery(schemaName: string): string {
    return `
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".notes_timeline_seq START 1;
    `;
  },
  getCreateNotesTimelineTableQuery(schemaName: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schemaName}".notes_timeline (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) UNIQUE DEFAULT ('NOTTI-' || LPAD(nextval('"${schemaName}".notes_timeline_seq')::TEXT, 10, '0')),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        document_name VARCHAR(255) NULL,
        title VARCHAR(64) NOT NULL,
        notes_owner VARCHAR(64) NOT NULL,
        attach_to VARCHAR(50) NOT NULL,
        attachment_level VARCHAR(50) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_status VARCHAR(50) NOT NULL,
        event_name VARCHAR(255),
        event_datetime TIMESTAMPTZ NOT NULL,
        descriptions VARCHAR(2000),
        notes_rid VARCHAR(50)
      );
    `;
  },
  getProjectResourceIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_project_resource_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."project_resource"("${field}");
    `;
  },
  getAccountFiscalRegionIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_account_fiscal_region_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."account_fiscal_region"("${field}");
    `;
  },
  getProjectHistoryIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_project_history_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."project_history"("${field}");
    `;
  },
  getProjectFiscalRegionIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_project_fiscal_region_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."project_fiscal_region"("${field}");
    `;
  },
  getProjectTimelineIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_project_timeline_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."project_timeline"("${field}");
    `;
  },
  getResourcesHistoryIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_resources_history_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."resources_history"("${field}");
    `;
  },
  getResourcesTimelineIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_resources_timeline_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."resources_timeline"("${field}");
    `;
  },
  getResourceCostTimelineIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_resource_cost_timeline_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."resource_cost_timeline"("${field}");
    `;
  },
  getResourceCostHistoryIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_resource_cost_history_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."resource_cost_history"("${field}");
    `;
  },
  getResourceSkillTimelineIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_resource_skill_timeline_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."resource_skill_timeline"("${field}");
    `;
  },
  getResourceSkillHistoryIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_resource_skill_history_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."resource_skill_history"("${field}");
    `;
  },
  getAttachmentTimelineIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_attachment_timeline_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."attachment_timeline"("${field}");
    `;
  },
  getResourceFiscalRegionIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_resource_fiscal_region_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."resource_fiscal_region"("${field}");
    `;
  },
  getProjectResourceTimelineIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_project_resource_timeline_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."project_resource_timeline"("${field}");
    `;
  },
  getProjectResourceHistoryIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_project_resource_history_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."project_resource_history"("${field}");
    `;
  },
  getProjectResourceFiscalIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_project_resource_fiscal_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."project_resource_fiscal"("${field}");
    `;
  },
  getProjectResourceFiscalRegionIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_project_resource_fiscal_region_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."project_resource_fiscal_region"("${field}");
    `;
  },
  getProjectTaskIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_project_task_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."project_task"("${field}");
    `;
  },
  getProjectTaskTimelineIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_project_task_timeline_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."project_task_timeline"("${field}");
    `;
  },
  getProjectTaskHistoryIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_project_task_history_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."project_task_history"("${field}");
    `;
  },
  getInteractionHistoryIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_interaction_history_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."interaction_history"("${field}");
    `;
  },
  getAiTechnicalSummaryIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_ai_technical_summary_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."ai_technical_summary"("${field}");
    `;
  },                                                                                      
  getInteractionTimelineIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_interaction_timeline_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."interaction_timeline"("${field}");
    `;
  },  
  getAiAssessmentAuditIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_ai_assessment_audit_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."ai_assessment_audit"("${field}");
    `;
  },
  getAiAssessmentQreIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_ai_assessment_qre_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."ai_assessment_qre"("${field}");
    `;
  },
  getOtpEntriesIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_otp_entries_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."otp_entries"("${field}");
    `;
  },
  getOtpEntriesHistoryIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_otp_entries_history_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."otp_entries_history"("${field}");
    `;
  },
  getWebhookEmailHistoryIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_webhook_email_history_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."webhook_email_history"("${field}");
    `;
  },
  getNotesTimelineIndexQuery(schemaName: string, field: string): string {
    const indexName = `${schemaName}_notes_timeline_${field}_idx`;
    return `
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schemaName}"."notes_timeline"("${field}");
    `;
  },          
};

export const DEFAULT_ACCOUNT_DETAILS = {
  fiscalStart: "04/01",
  fiscalEnd: "03/31",
  maxAiInteraction: 5,
};

export const primaryKeyContacts = {
  finance_lead: "finance_lead",
  finance_executive: "finance_executive",
  professional_services_consultant: "professional_services_consultant",
};