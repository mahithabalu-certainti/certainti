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

export const STATUS_MESSAGE = {
  caseCreated: "Case created successfully",
  caseUpdated: "Case updated successfully",
  dataNotAvailable: "Data not available",
  caseIdMissing: "Case ID is required",
  accountNotFound: "Account not found",
  caseNotFound: "Case not found",
  accountIdMissing: "Account RID missing",
};

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

export const rawQueries = {
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
  fetchCaseCountWithStatus(status: string, accountIds?: string[]) {
    let query = `SELECT count('x') FROM ${MAIN_SCHEMA_NAME}.case_summary a
    join ${MAIN_SCHEMA_NAME}.case_status b
    on a.status_rid = b.rid 
    and b.status_name = '${status}'`;

    if (accountIds && accountIds.length > 0) {
      query += ` and a.account_rid in ('${accountIds.join("','")}')`;
    }
    return query;
  },
  fetchOpenTaskCount(accountIds?: string[], userId?: string) {
    let query = `SELECT count('x')
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    WHERE b.task_type_name = 'Milestone'
      AND d.task_status_name IN ('In Progress', 'To Do')`;

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in ('${accountIds.join("','")}')`;
    }

    if (userId) {
      query += ` AND a.assigned_to = '${userId}'`;
    }

    return query;
  },
  fetchWeeklyOpenTaskCount(accountIds?: string[], userId?: string) {
    let query = `SELECT count('x')
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    WHERE b.task_type_name = 'Milestone'
      AND d.task_status_name IN ('In Progress', 'To Do')`;

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in ('${accountIds.join("','")}')`;
    }

    if (userId) {
      query += ` AND a.assigned_to = '${userId}'`;
    }

    query += ` AND a.effective_end_datetime::date >= date_trunc('week', CURRENT_DATE)::date
      AND a.effective_end_datetime::date < date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days'`;
    return query;
  },
  fetchWeeklyBlockedTaskCount(accountIds?: string[], userId?: string) {
    let query = `SELECT count('x')
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    WHERE b.task_type_name = 'Milestone'
      AND d.task_status_name = 'Blocked'`;

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in ('${accountIds.join("','")}')`;
    }

    if (userId) {
      query += ` AND a.assigned_to = '${userId}'`;
    }

    query += ` AND a.effective_end_datetime::date >= date_trunc('week', CURRENT_DATE)::date
      AND a.effective_end_datetime::date < date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days'`;
    return query;
  },
  fetchOverDueTaskCount(accountIds?: string[], userId?: string) {
    let query = `
    SELECT count('x')
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    WHERE b.task_type_name = 'Milestone'
      AND d.task_status_name IN ('In Progress', 'To Do')`;

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in ('${accountIds.join("','")}')`;
    }

    if (userId) {
      query += ` AND a.assigned_to = '${userId}'`;
    }

    query += ` AND a.effective_end_datetime::date <= CURRENT_DATE;`;
    return query;
  },
  fetchWeeklyOverDueTaskCount(accountIds?: string[], userId?: string) {
    let query = `
    SELECT count('x')
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    WHERE b.task_type_name = 'Milestone'
      AND d.task_status_name IN ('In Progress', 'To Do')`;

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in ('${accountIds.join("','")}')`;
    }

    if (userId) {
      query += ` AND a.assigned_to = '${userId}'`;
    }

    query += ` AND a.effective_end_datetime::date >= date_trunc('week', CURRENT_DATE)::date
      AND a.effective_end_datetime::date < date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days'`;

    query += ` AND a.effective_end_datetime::date <= CURRENT_DATE;`;

    return query;
  },
  fetchUpcomingTaskCount(accountIds?: string[], userId?: string) {
    let query = `
    SELECT count('x')
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    WHERE b.task_type_name = 'Milestone'
      AND d.task_status_name IN ('In Progress', 'To Do')`;

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in ('${accountIds.join("','")}')`;
    }

    if (userId) {
      query += ` AND a.assigned_to = '${userId}'`;
    }

    query += ` AND a.effective_start_datetime::date > CURRENT_DATE
      AND a.effective_start_datetime::date <= CURRENT_DATE + INTERVAL '7 days';`;
    return query;
  },
  fetchWeeklyCompletedTaskCount(accountIds?: string[], userId?: string) {
    let query = `
    SELECT count('x')
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    WHERE b.task_type_name = 'Milestone'
      AND d.task_status_name = 'Completed'`;

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in ('${accountIds.join("','")}')`;
    }

    if (userId) {
      query += ` AND a.assigned_to = '${userId}'`;
    }

    query += ` AND a.effective_end_datetime::date >= date_trunc('week', CURRENT_DATE)::date
      AND a.effective_end_datetime::date < date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days';`;
    return query;
  },
  fetchActiveAccountsCount() {
    let query = `SELECT count(*) as count FROM ${MAIN_SCHEMA_NAME}.account WHERE parent_account_rid IS NOT NULL`;
    return query;
  },
  fetchActivityStatus() {
    return `SELECT * FROM ${MAIN_SCHEMA_NAME}.activity_status WHERE activity_type = 'Meeting' ORDER BY rid ASC`;
  },
  fetchCasePriority() {
    return `SELECT rid, priority_name FROM ${MAIN_SCHEMA_NAME}.case_priority`;
  },
  fetchUserEmail(userId: string) {
    return `SELECT email FROM ${MAIN_SCHEMA_NAME}."user" WHERE rid = '${userId}' LIMIT 1`;
  },
  fetchUsersByEmails(emails: string[]) {
    const emailList = emails.map((e) => `'${e}'`).join(",");
    return `SELECT email, first_name, last_name FROM ${MAIN_SCHEMA_NAME}."user" WHERE email IN (${emailList})`;
  },
  fetchUsersByRids(rids: string[]) {
    const ridList = rids.map((r) => `'${r}'`).join(",");
    return `SELECT rid, email, first_name, last_name FROM ${MAIN_SCHEMA_NAME}."user" WHERE rid IN (${ridList})`;
  },
  fetchWeeklyMeetingList(schemaName: string, statusId: string, userId?: string) {
    let query = `
    SELECT 
    *
    FROM ${schemaName}.activities a
    WHERE LOWER(a.activity_type) = 'meeting'
      AND a.status_rid = '${statusId}'`;

    if (userId) {
      query += `
        AND (
            a.meeting_participants::jsonb @> '["${userId}"]'
            OR a.invited_by = '${userId}'
          )
        `;
    }
    query += `
      AND a.effective_start_time IS NOT NULL
      AND a.effective_end_time IS NOT NULL
      AND a.effective_start_datetime >= date_trunc('week', CURRENT_DATE)
      AND a.effective_start_datetime < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'

    ORDER BY 
        a.effective_start_datetime DESC,
        a.effective_start_time DESC,
        a.effective_end_time DESC
    LIMIT 5;
    `;
    return query;
  },
  fetchWeeklyTotalTaskCount(accountIds?: string[], userId?: string) {
    let query = `
    SELECT count('x')
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    WHERE b.task_type_name = 'Milestone'`;

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in ('${accountIds.join("','")}')`;
    }

    if (userId) {
      query += ` AND a.assigned_to = '${userId}'`;
    }

    query += ` AND a.effective_end_datetime::date >= date_trunc('week', CURRENT_DATE)::date
      AND a.effective_end_datetime::date < date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days';`;
    return query;
  },
  fetchWeeklyMeetingCount(schemaName: string, statusIds: string[], userId?: string) {
    let query = `
    SELECT 
    count('x')
    FROM ${schemaName}.activities a
    WHERE LOWER(a.activity_type) = 'meeting'
    `;

    if (statusIds && statusIds.length > 0) {
      const ids = statusIds.map(id => `'${id}'`).join(",");
      query += ` AND a.status_rid IN (${ids})`;
    }

    if (userId) {
      query += `
        AND (
            a.meeting_participants::jsonb @> '["${userId}"]'
            OR a.invited_by = '${userId}'
          )
        `;
    }
    query += `
      AND a.effective_start_time IS NOT NULL
      AND a.effective_end_time IS NOT NULL
      AND a.effective_start_datetime >= date_trunc('week', CURRENT_DATE)
      AND a.effective_start_datetime < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'
    `;
    return query;
  },
  getAccountsByRidsQuery(): string {
    return `
      SELECT * 
      FROM ${MAIN_SCHEMA_NAME}.account 
      WHERE rid IN (:accountRids)
    `;
  },
  fetchAccountDetailsByRid(accountRid: string) {
    return `
            SELECT * FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`;
  },
  fetchSchemas() {
    return `
            SELECT schema_name
            FROM information_schema.schemata
            WHERE schema_name NOT LIKE 'pg_%'
            AND schema_name not in ('information_schema', 'public')
            ORDER BY schema_name;`;
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
  fetchUpcomingTasks(accountIds?: string[], userId?: string) {
    let query = `
    SELECT 
      a.rid,
      a.r_number,
      a.task_name,
      d.task_status_name as status,
	  a.effective_start_datetime,
      a.effective_end_datetime,
      c.r_number as case_r_number,
      c.case_name,
      a.assigned_to,
	  e.priority_name,
	  a.fiscal_year,
	  f.account_name,
	  concat(g.first_name, ' ', g.last_name) as assigned_to_name
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
	left join ${MAIN_SCHEMA_NAME}.case_priority e
	 on a.priority_rid = e.rid
	left join ${MAIN_SCHEMA_NAME}.account f
	 on a.account_rid = f.rid
	 left join ${MAIN_SCHEMA_NAME}.user g
	 on a.assigned_to = g.rid
    WHERE b.task_type_name = 'Milestone'
      AND d.task_status_name IN ('In Progress', 'To Do')`;

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in ('${accountIds.join("','")}')`;
    }

    if (userId) {
      query += ` AND a.assigned_to = '${userId}'`;
    }

    query += ` AND a.effective_start_datetime::date > CURRENT_DATE
      AND a.effective_start_datetime::date <= CURRENT_DATE + INTERVAL '7 days';`;
    return query;
  },
  fetchOverDueTasks(accountIds?: string[], userId?: string) {
    let query = `
    SELECT 
      a.rid,
      a.r_number,
      a.task_name,
      d.task_status_name as status,
	  a.effective_start_datetime,
      a.effective_end_datetime,
      c.r_number as case_r_number,
      c.case_name,
      a.assigned_to,
	  e.priority_name,
	  a.fiscal_year,
	  f.account_name,
	  concat(g.first_name, ' ', g.last_name) as assigned_to_name
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
	left join ${MAIN_SCHEMA_NAME}.case_priority e
	 on a.priority_rid = e.rid
	left join ${MAIN_SCHEMA_NAME}.account f
	 on a.account_rid = f.rid
	 left join ${MAIN_SCHEMA_NAME}.user g
	 on a.assigned_to = g.rid
    WHERE b.task_type_name = 'Milestone'
      AND d.task_status_name IN ('In Progress', 'To Do')`;

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in ('${accountIds.join("','")}')`;
    }

    if (userId) {
      query += ` AND a.assigned_to = '${userId}'`;
    }

    query += ` AND a.effective_end_datetime::date <= CURRENT_DATE;`;
    return query;
  },
  fetchOpenTasks(accountIds?: string[], userId?: string) {
    let query = `
    SELECT 
      a.rid,
      a.r_number,
      a.task_name,
      d.task_status_name as status,
	  a.effective_start_datetime,
      a.effective_end_datetime,
      c.r_number as case_r_number,
      c.case_name,
      a.assigned_to,
	  e.priority_name,
	  a.fiscal_year,
	  f.account_name,
	  concat(g.first_name, ' ', g.last_name) as assigned_to_name
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
	left join ${MAIN_SCHEMA_NAME}.case_priority e
	 on a.priority_rid = e.rid
	left join ${MAIN_SCHEMA_NAME}.account f
	 on a.account_rid = f.rid
	 left join ${MAIN_SCHEMA_NAME}.user g
	 on a.assigned_to = g.rid
    WHERE b.task_type_name = 'Milestone'
      AND d.task_status_name IN ('In Progress', 'To Do')`;

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in ('${accountIds.join("','")}')`;
    }

    if (userId) {
      query += ` AND a.assigned_to = '${userId}'`;
    }

    query += ` AND a.effective_end_datetime::date >= date_trunc('week', CURRENT_DATE)::date
      AND a.effective_end_datetime::date < date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days';`;

    return query;
  },
  fetchWeeklyCompletedTasks(accountIds?: string[], userId?: string) {
    let query = `
    SELECT 
      a.rid,
      a.r_number,
      a.task_name,
      d.task_status_name as status,
	  a.effective_start_datetime,
      a.effective_end_datetime,
      c.r_number as case_r_number,
      c.case_name,
      a.assigned_to,
	  e.priority_name,
	  a.fiscal_year,
	  f.account_name,
	  concat(g.first_name, ' ', g.last_name) as assigned_to_name
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
	left join ${MAIN_SCHEMA_NAME}.case_priority e
	 on a.priority_rid = e.rid
	left join ${MAIN_SCHEMA_NAME}.account f
	 on a.account_rid = f.rid
	 left join ${MAIN_SCHEMA_NAME}.user g
	 on a.assigned_to = g.rid
    WHERE b.task_type_name = 'Milestone'
      AND d.task_status_name = 'Completed'`;

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in ('${accountIds.join("','")}')`;
    }

    if (userId) {
      query += ` AND a.assigned_to = '${userId}'`;
    }

    query += ` AND a.effective_end_datetime::date >= date_trunc('week', CURRENT_DATE)::date
      AND a.effective_end_datetime::date < date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days';`;
    return query;
  }
};
