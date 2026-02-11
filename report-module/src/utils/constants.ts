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

export const TaskType = {
  MILESTONE: 'Milestone',
};

export const TaskStatus = {
  IN_PROGRESS: 'In Progress',
  TO_DO: 'To Do',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
};

export const TaskCategory = {
  REVIEWS: 'Reviews',
  APPROVALS_SIGN_OFFS: 'Approvals & Sign-offs',
};

export const ActivityType = {
  MEETING: 'Meeting',
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
    and b.status_name = :status`;

    const replacements: any = { status };

    if (accountIds && accountIds.length > 0) {
      query += ` and a.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }
    return { query, replacements };
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
    WHERE b.task_type_name = '${TaskType.MILESTONE}'
      AND d.task_status_name IN ('${TaskStatus.IN_PROGRESS}', '${TaskStatus.TO_DO}')`;

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
    WHERE b.task_type_name = '${TaskType.MILESTONE}'
      AND d.task_status_name IN ('${TaskStatus.IN_PROGRESS}', '${TaskStatus.TO_DO}')`;

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
    WHERE b.task_type_name = '${TaskType.MILESTONE}'
      AND d.task_status_name = '${TaskStatus.BLOCKED}'`;

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
    WHERE b.task_type_name = '${TaskType.MILESTONE}'
      AND d.task_status_name IN ('${TaskStatus.IN_PROGRESS}', '${TaskStatus.TO_DO}')`;

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
    WHERE b.task_type_name = '${TaskType.MILESTONE}'
      AND d.task_status_name IN ('${TaskStatus.IN_PROGRESS}', '${TaskStatus.TO_DO}')`;

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
    WHERE b.task_type_name = '${TaskType.MILESTONE}'
      AND d.task_status_name IN ('${TaskStatus.IN_PROGRESS}', '${TaskStatus.TO_DO}')`;

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
    WHERE b.task_type_name = '${TaskType.MILESTONE}'
      AND d.task_status_name = '${TaskStatus.COMPLETED}'`;

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
    WHERE LOWER(a.activity_type) = '${ActivityType.MEETING}'
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
    WHERE b.task_type_name = '${TaskType.MILESTONE}'`;

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
    WHERE LOWER(a.activity_type) = '${ActivityType.MEETING}'
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
      SELECT profile_rid FROM ${MAIN_SCHEMA_NAME}."user" WHERE rid = :userId LIMIT 1;
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
	  concat(g.first_name, ' ', g.last_name) as assigned_to_name,
    g.profile_url
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
    WHERE b.task_type_name = '${TaskType.MILESTONE}'
      AND d.task_status_name IN ('${TaskStatus.IN_PROGRESS}', '${TaskStatus.TO_DO}')`;

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
	  concat(g.first_name, ' ', g.last_name) as assigned_to_name,
    g.profile_url
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
    WHERE b.task_type_name = '${TaskType.MILESTONE}'
      AND d.task_status_name IN ('${TaskStatus.IN_PROGRESS}', '${TaskStatus.TO_DO}')`;

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
	  concat(g.first_name, ' ', g.last_name) as assigned_to_name,
    g.profile_url
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
    WHERE b.task_type_name = '${TaskType.MILESTONE}'
      AND d.task_status_name IN ('${TaskStatus.IN_PROGRESS}', '${TaskStatus.TO_DO}')`;

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
	  concat(g.first_name, ' ', g.last_name) as assigned_to_name,
    g.profile_url
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
    WHERE b.task_type_name = '${TaskType.MILESTONE}'
      AND d.task_status_name = '${TaskStatus.COMPLETED}'`;

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
  fetchWeeklyPendingFollowUps(accountIds?: string[], userId?: string) {
    let query = `
    SELECT 
      a.rid,
      a.r_number,
      a.task_name,
      a.status_rid,
      d.task_status_name as status_name,
      a.account_rid,
      a.attach_to,
      a.attachment_level,
      a.task_rid,
      b.task_type_name,
	    a.effective_start_datetime,
      a.effective_end_datetime,
      c.r_number as case_r_number,
      c.case_name,
      a.assigned_to,
      e.priority_name,
      a.fiscal_year,
      f.account_name,
      concat(g.first_name, ' ', g.last_name) as assigned_to_name,
      h.category_name,
      g.profile_url
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
    left join ${MAIN_SCHEMA_NAME}.task_category h
    on a.task_category_rid = h.rid
    WHERE b.task_type_name = '${TaskType.MILESTONE}'
      AND d.task_status_name IN ('${TaskStatus.IN_PROGRESS}', '${TaskStatus.TO_DO}')
	  AND h.category_name = '${TaskCategory.REVIEWS}'`;

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
  fetchOverdueApprovals(accountIds?: string[], userId?: string) {
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
	concat(g.first_name, ' ', g.last_name) as assigned_to_name,
	h.category_name,
    g.profile_url
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
    left join ${MAIN_SCHEMA_NAME}.task_category h
    on a.task_category_rid = h.rid
    WHERE b.task_type_name = '${TaskType.MILESTONE}'
      AND d.task_status_name IN ('${TaskStatus.IN_PROGRESS}', '${TaskStatus.TO_DO}')
	  AND h.category_name = '${TaskCategory.APPROVALS_SIGN_OFFS}'`;

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in ('${accountIds.join("','")}')`;
    }

    if (userId) {
      query += ` AND a.assigned_to = '${userId}'`;
    }

    query += ` AND a.effective_end_datetime::date <= CURRENT_DATE;`;
    return query;
  },
  checkTableExistence() {
    return `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = :schemaName 
        AND table_name = :tableName
      ) as "exists";
    `;
  },
  fetchActiveCountries(countryRid?: string) {
    const replacements: any = {};
    let query = `
      SELECT 
        c.rid as country_rid,
        c.country_name,
        c.country_code
      FROM ${MAIN_SCHEMA_NAME}.country c
      WHERE c.status = 'active'
    `;

    if (countryRid) {
      query += ` AND c.rid = :countryRid`;
      replacements.countryRid = countryRid;
    }

    return { query, replacements };
  },
  fetchOverallProjectValue(accountIds?: string[], fiscalYear?: string) {
    let query = `
      SELECT 
        c.rid as country_rid,
        c.country_name,
	      c.country_code, 
        COALESCE(SUM(p.total_cost_prj), 0) as total_project_cost,
        COALESCE(SUM(case when p.is_qualified = true then p.total_cost_prj else 0 end), 0) as qualified_project_cost,
        COALESCE(SUM(p.qre_final), 0) as qre_cost
      FROM ${MAIN_SCHEMA_NAME}.project_fiscal_summary p
      LEFT JOIN ${MAIN_SCHEMA_NAME}.country c ON p.country_rid = c.rid
      WHERE c.status = 'active'
    `;

    const replacements: any = {};

    if (accountIds && accountIds.length > 0) {
      query += ` AND p.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (fiscalYear) {
      query += ` AND p.fiscal_year = :fiscalYear`;
      replacements.fiscalYear = fiscalYear;
    }

    query += ` GROUP BY c.rid, c.country_name, c.country_code;`;

    return { query, replacements };
  },
  fetchCountryWiseRDAmounts(schemaName: string, accountIds?: string[], fiscalYear?: string, activeCountriesRidsSet?: Set<string>) {
    let query = `
      SELECT a.country_rid,
       COALESCE(SUM(final_credit), 0) as final_credit_computed,
       COALESCE(SUM(final_credit_submitted), 0) as final_credit_submitted,
       COALESCE(SUM(final_credit_approved), 0) as final_credit_approved
      FROM ${schemaName}.rd_credit_country_calculations a
      join ${schemaName}.cases b
      on a.case_rid = b.rid
      join ${schemaName}.account_details c
      on b.account_rid = c.account_rid
      WHERE 1=1
    `;

    const replacements: any = {};

    if (accountIds && accountIds.length > 0) {
      query += ` AND b.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (fiscalYear) {
      query += ` AND b.fiscal_year = :fiscalYear`;
      replacements.fiscalYear = fiscalYear;
    }

    if (activeCountriesRidsSet) {
      query += ` AND a.country_rid in (:activeCountriesRids)`;
      replacements.activeCountriesRids = Array.from(activeCountriesRidsSet);
    }

    query += ` GROUP BY a.country_rid;`;

    return { query, replacements };
  },
  fetchCountryAccountWiseRDAmounts(schemaName: string, accountIds?: string[], fiscalYear?: string, activeCountriesRidsSet?: Set<string>) {
    let query = `
      SELECT a.country_rid,
       b.account_rid,
       COALESCE(SUM(final_credit), 0) as final_credit_computed,
       COALESCE(SUM(final_credit_submitted), 0) as final_credit_submitted,
       COALESCE(SUM(final_credit_approved), 0) as final_credit_approved
      FROM ${schemaName}.rd_credit_country_calculations a
      join ${schemaName}.cases b
      on a.case_rid = b.rid
      join ${schemaName}.account_details c
      on b.account_rid = c.account_rid
      WHERE 1=1
    `;

    const replacements: any = {};

    if (accountIds && accountIds.length > 0) {
      query += ` AND b.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (fiscalYear) {
      query += ` AND b.fiscal_year = :fiscalYear`;
      replacements.fiscalYear = fiscalYear;
    }

    if (activeCountriesRidsSet) {
      query += ` AND a.country_rid in (:activeCountriesRids)`;
      replacements.activeCountriesRids = Array.from(activeCountriesRidsSet);
    }

    query += ` GROUP BY a.country_rid, b.account_rid`;

    return { query, replacements };
  },
  fetchGlobalAccountClaimedAmounts(accountIds?: string[], fiscalYear?: string, activeCountriesRidsSet?: Set<string>) {
    let query = `
      SELECT 
        a.rid as account_rid,
        a.account_name,
        c.rid as country_rid,
        c.country_name,
	      c.country_code, 
        COALESCE(SUM(p.total_cost_prj), 0) as total_project_cost,
        COALESCE(SUM(case when p.is_qualified = true then p.total_cost_prj else 0 end), 0) as qualified_project_cost,
        COALESCE(SUM(p.qre_final), 0) as qre_cost
      FROM ${MAIN_SCHEMA_NAME}.project_fiscal_summary p
      LEFT JOIN ${MAIN_SCHEMA_NAME}.country c ON p.country_rid = c.rid
      LEFT JOIN ${MAIN_SCHEMA_NAME}.account a ON p.account_rid = a.rid
      WHERE 1=1
    `;

    const replacements: any = {};

    if (accountIds && accountIds.length > 0) {
      query += ` AND p.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (fiscalYear) {
      query += ` AND p.fiscal_year = :fiscalYear`;
      replacements.fiscalYear = fiscalYear;
    }

    if (activeCountriesRidsSet) {
      query += ` AND p.country_rid in (:activeCountriesRids)`;
      replacements.activeCountriesRids = Array.from(activeCountriesRidsSet);
    }

    query += ` GROUP BY a.rid, a.account_name, c.rid, c.country_name, c.country_code;`;

    return { query, replacements };
  },
  fetchCasesByHealthStatus(accountIds?: string[], fiscalYear?: string) {
    let query = `
      SELECT 
        a.rid as account_rid,
        a.account_name,
        c.fiscal_year,
        COALESCE(ROUND(AVG(c.case_completion_percentage), 2),0) as progress
      FROM ${MAIN_SCHEMA_NAME}.case_summary c
      JOIN ${MAIN_SCHEMA_NAME}.account a ON c.account_rid = a.rid
      WHERE 1=1
    `;

    const replacements: any = {};

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (fiscalYear) {
      query += ` AND c.fiscal_year = :fiscalYear`;
      replacements.fiscalYear = fiscalYear;
    } else {
      // If no specific fiscal year, get last 4 years
      query += ` AND c.fiscal_year::int >= (EXTRACT(YEAR FROM CURRENT_DATE)::int - 3)`;
    }

    query += ` GROUP BY a.account_name, c.fiscal_year, a.rid`;
    query += ` ORDER BY a.account_name, c.fiscal_year`;

    return { query, replacements };
  }
};
