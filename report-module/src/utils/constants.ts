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

export const USER_FLAG = "user";

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

export const ATTACHMENT_LEVEL = {
  ACCOUNT: 'account',
  PROJECT: 'project',
  CASE: 'case',
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
  fetchAllChildAccounts() {
    return {
      query: `SELECT rid FROM ${MAIN_SCHEMA_NAME}.account WHERE parent_account_rid IS NOT NULL`
    }
  },
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
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    WHERE b.task_type_name = :taskType
      AND d.task_status_name IN (:taskStatus)`;

    const replacements: any = {
      taskType: TaskType.MILESTONE,
      taskStatus: [TaskStatus.IN_PROGRESS, TaskStatus.TO_DO]
    };

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (userId) {
      query += ` AND a.assigned_to = :userId`;
      replacements.userId = userId;
    }

    return { query, replacements };
  },
  fetchWeeklyOpenTaskCount(accountIds?: string[], userId?: string) {
    let query = `SELECT count('x')
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    WHERE b.task_type_name = :taskType
      AND d.task_status_name IN (:taskStatus)`;

    const replacements: any = {
      taskType: TaskType.MILESTONE,
      taskStatus: [TaskStatus.IN_PROGRESS, TaskStatus.TO_DO]
    };

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (userId) {
      query += ` AND a.assigned_to = :userId`;
      replacements.userId = userId;
    }

    query += ` AND a.effective_end_datetime::date >= date_trunc('week', CURRENT_DATE)::date
      AND a.effective_end_datetime::date < date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days'`;
    return { query, replacements };
  },
  fetchWeeklyBlockedTaskCount(accountIds?: string[], userId?: string) {
    let query = `SELECT count('x')
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    WHERE b.task_type_name = :taskType
      AND d.task_status_name = :taskStatus`;

    const replacements: any = {
      taskType: TaskType.MILESTONE,
      taskStatus: TaskStatus.BLOCKED
    };

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (userId) {
      query += ` AND a.assigned_to = :userId`;
      replacements.userId = userId;
    }

    query += ` AND a.effective_end_datetime::date >= date_trunc('week', CURRENT_DATE)::date
      AND a.effective_end_datetime::date < date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days'`;
    return { query, replacements };
  },
  fetchOverDueTaskCount(accountIds?: string[], userId?: string) {
    let query = `
    SELECT count('x')
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    WHERE b.task_type_name = :taskType
      AND d.task_status_name IN (:taskStatus)`;

    const replacements: any = {
      taskType: TaskType.MILESTONE,
      taskStatus: [TaskStatus.IN_PROGRESS, TaskStatus.TO_DO]
    };

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (userId) {
      query += ` AND a.assigned_to = :userId`;
      replacements.userId = userId;
    }

    query += ` AND a.effective_end_datetime::date <= CURRENT_DATE;`;
    return { query, replacements };
  },
  fetchWeeklyOverDueTaskCount(accountIds?: string[], userId?: string) {
    let query = `
    SELECT count('x')
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    WHERE b.task_type_name = :taskType
      AND d.task_status_name IN (:taskStatus)`;

    const replacements: any = {
      taskType: TaskType.MILESTONE,
      taskStatus: [TaskStatus.IN_PROGRESS, TaskStatus.TO_DO]
    };

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (userId) {
      query += ` AND a.assigned_to = :userId`;
      replacements.userId = userId;
    }

    query += ` AND a.effective_end_datetime::date >= date_trunc('week', CURRENT_DATE)::date
      AND a.effective_end_datetime::date < date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days'`;

    query += ` AND a.effective_end_datetime::date <= CURRENT_DATE;`;

    return { query, replacements };
  },
  fetchUpcomingTaskCount(accountIds?: string[], userId?: string) {
    let query = `
    SELECT count('x')
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    WHERE b.task_type_name = :taskType
      AND d.task_status_name IN (:taskStatus)`;

    const replacements: any = {
      taskType: TaskType.MILESTONE,
      taskStatus: [TaskStatus.IN_PROGRESS, TaskStatus.TO_DO]
    };

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (userId) {
      query += ` AND a.assigned_to = :userId`;
      replacements.userId = userId;
    }

    query += ` AND a.effective_start_datetime::date > CURRENT_DATE
      AND a.effective_start_datetime::date <= CURRENT_DATE + INTERVAL '7 days';`;
    return { query, replacements };
  },
  fetchWeeklyCompletedTaskCount(accountIds?: string[], userId?: string) {
    let query = `
    SELECT count('x')
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    WHERE b.task_type_name = :taskType
      AND d.task_status_name = :taskStatus`;

    const replacements: any = {
      taskType: TaskType.MILESTONE,
      taskStatus: TaskStatus.COMPLETED
    };

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (userId) {
      query += ` AND a.assigned_to = :userId`;
      replacements.userId = userId;
    }

    query += ` AND a.effective_end_datetime::date >= date_trunc('week', CURRENT_DATE)::date
      AND a.effective_end_datetime::date < date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days';`;
    return { query, replacements };
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
    return {
      query: `SELECT email FROM ${MAIN_SCHEMA_NAME}."user" WHERE rid = :userId LIMIT 1`,
      replacements: { userId }
    };
  },
  fetchUsersByEmails(emails: string[]) {
    return {
      query: `SELECT email, first_name, last_name FROM ${MAIN_SCHEMA_NAME}."user" WHERE email IN (:emails)`,
      replacements: { emails }
    };
  },
  fetchUsersByRids(rids: string[]) {
    return {
      query: `SELECT rid, email, first_name, last_name FROM ${MAIN_SCHEMA_NAME}."user" WHERE rid IN (:rids)`,
      replacements: { rids }
    };
  },
  fetchWeeklyTotalTaskCount(accountIds?: string[], userId?: string) {
    let query = `
    SELECT count('x')
    FROM ${MAIN_SCHEMA_NAME}.task_summary a
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    WHERE b.task_type_name = :taskType`;

    const replacements: any = {
      taskType: TaskType.MILESTONE
    };

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (userId) {
      query += ` AND a.assigned_to = :userId`;
      replacements.userId = userId;
    }

    query += ` AND a.effective_end_datetime::date >= date_trunc('week', CURRENT_DATE)::date
      AND a.effective_end_datetime::date < date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days';`;
    return { query, replacements };
  },
  getAccountsByRidsQuery(): string {
    return `
      SELECT * 
      FROM ${MAIN_SCHEMA_NAME}.account 
      WHERE rid IN (:accountRids)
    `;
  },
  fetchAccountDetailsByRid(accountRid: string) {
    return {
      query: `SELECT * FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = :accountRid`,
      replacements: { accountRid }
    };
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
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
	left join ${MAIN_SCHEMA_NAME}.case_priority e
	 on a.priority_rid = e.rid
	left join ${MAIN_SCHEMA_NAME}.account f
	 on a.account_rid = f.rid
	 left join ${MAIN_SCHEMA_NAME}.user g
	 on a.assigned_to = g.rid
    WHERE b.task_type_name = :taskType
      AND d.task_status_name IN (:taskStatus)`;

    const replacements: any = {
      taskType: TaskType.MILESTONE,
      taskStatus: [TaskStatus.IN_PROGRESS, TaskStatus.TO_DO]
    };

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (userId) {
      query += ` AND a.assigned_to = :userId`;
      replacements.userId = userId;
    }

    query += ` AND a.effective_start_datetime::date > CURRENT_DATE
      AND a.effective_start_datetime::date <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY a.effective_start_datetime::date ASC;`;
    return { query, replacements };
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
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
	left join ${MAIN_SCHEMA_NAME}.case_priority e
	 on a.priority_rid = e.rid
	left join ${MAIN_SCHEMA_NAME}.account f
	 on a.account_rid = f.rid
	 left join ${MAIN_SCHEMA_NAME}.user g
	 on a.assigned_to = g.rid
    WHERE b.task_type_name = :taskType
      AND d.task_status_name IN (:taskStatus)`;

    const replacements: any = {
      taskType: TaskType.MILESTONE,
      taskStatus: [TaskStatus.IN_PROGRESS, TaskStatus.TO_DO]
    };

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (userId) {
      query += ` AND a.assigned_to = :userId`;
      replacements.userId = userId;
    }

    query += ` AND a.effective_end_datetime::date <= CURRENT_DATE
    ORDER BY a.effective_end_datetime::date ASC;`;
    return { query, replacements };
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
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
	left join ${MAIN_SCHEMA_NAME}.case_priority e
	 on a.priority_rid = e.rid
	left join ${MAIN_SCHEMA_NAME}.account f
	 on a.account_rid = f.rid
	 left join ${MAIN_SCHEMA_NAME}.user g
	 on a.assigned_to = g.rid
    WHERE b.task_type_name = :taskType
      AND d.task_status_name IN (:taskStatus)`;

    const replacements: any = {
      taskType: TaskType.MILESTONE,
      taskStatus: [TaskStatus.IN_PROGRESS, TaskStatus.TO_DO]
    };

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (userId) {
      query += ` AND a.assigned_to = :userId`;
      replacements.userId = userId;
    }

    query += ` AND a.effective_end_datetime::date >= date_trunc('week', CURRENT_DATE)::date
      AND a.effective_end_datetime::date < date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days'
      ORDER BY a.effective_end_datetime::date ASC;`;

    return { query, replacements };
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
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
	left join ${MAIN_SCHEMA_NAME}.case_priority e
	 on a.priority_rid = e.rid
	left join ${MAIN_SCHEMA_NAME}.account f
	 on a.account_rid = f.rid
	 left join ${MAIN_SCHEMA_NAME}.user g
	 on a.assigned_to = g.rid
    WHERE b.task_type_name = :taskType
      AND d.task_status_name = :taskStatus`;

    const replacements: any = {
      taskType: TaskType.MILESTONE,
      taskStatus: TaskStatus.COMPLETED
    };

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (userId) {
      query += ` AND a.assigned_to = :userId`;
      replacements.userId = userId;
    }

    query += ` AND a.effective_end_datetime::date >= date_trunc('week', CURRENT_DATE)::date
      AND a.effective_end_datetime::date < date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days'
      ORDER BY a.effective_end_datetime::date ASC;`;
    return { query, replacements };
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
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    left join ${MAIN_SCHEMA_NAME}.case_priority e
    on a.priority_rid = e.rid
    left join ${MAIN_SCHEMA_NAME}.account f
    on a.account_rid = f.rid
    left join ${MAIN_SCHEMA_NAME}.user g
    on a.assigned_to = g.rid
    left join ${MAIN_SCHEMA_NAME}.task_category h
    on a.task_category_rid = h.rid
    WHERE b.task_type_name = :taskType
      AND d.task_status_name IN (:taskStatus)
	  AND h.category_name = :taskCategory`;

    const replacements: any = {
      taskType: TaskType.MILESTONE,
      taskStatus: [TaskStatus.IN_PROGRESS, TaskStatus.TO_DO],
      taskCategory: TaskCategory.REVIEWS
    };

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (userId) {
      query += ` AND a.assigned_to = :userId`;
      replacements.userId = userId;
    }

    query += ` AND a.effective_end_datetime::date >= date_trunc('week', CURRENT_DATE)::date
      AND a.effective_end_datetime::date < date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days'
      ORDER BY a.effective_end_datetime::date ASC;`;
    return { query, replacements };
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
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_type b
      ON a.task_type_rid = b.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_summary c
      ON a.attach_to = c.case_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_task_status d
      ON a.status_rid = d.rid
    left join ${MAIN_SCHEMA_NAME}.case_priority e
    on a.priority_rid = e.rid
    left join ${MAIN_SCHEMA_NAME}.account f
    on a.account_rid = f.rid
    left join ${MAIN_SCHEMA_NAME}.user g
    on a.assigned_to = g.rid
    left join ${MAIN_SCHEMA_NAME}.task_category h
    on a.task_category_rid = h.rid
    WHERE b.task_type_name = :taskType
      AND d.task_status_name IN (:taskStatus)
	  AND h.category_name = :taskCategory`;

    const replacements: any = {
      taskType: TaskType.MILESTONE,
      taskStatus: [TaskStatus.IN_PROGRESS, TaskStatus.TO_DO],
      taskCategory: TaskCategory.APPROVALS_SIGN_OFFS
    };

    if (accountIds && accountIds.length > 0) {
      query += ` AND c.account_rid in (:accountIds)`;
      replacements.accountIds = accountIds;
    }

    if (userId) {
      query += ` AND a.assigned_to = :userId`;
      replacements.userId = userId;
    }

    query += ` AND a.effective_end_datetime::date <= CURRENT_DATE
    ORDER BY a.effective_end_datetime::date ASC;`;
    return { query, replacements };
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
  fetchCountries(countryRid?: string, countryType?: string) {
    const replacements: any = {};
    let query = `
      SELECT 
        c.rid as country_rid,
        c.country_name,
        c.country_code
      FROM ${MAIN_SCHEMA_NAME}.country c
      WHERE 1 = 1
    `;

    if (countryRid) {
      query += ` AND c.rid = :countryRid`;
      replacements.countryRid = countryRid;
    }

    if (countryType === "active") {
      query += ` AND c.status = 'active'`;
    }

    return { query, replacements };
  },
  fetchOverallProjectValue(
    accountIds?: string[],
    fiscalYear?: string,
    activeCountriesRidsSet?: Set<string>
  ) {

    const replacements: any = {};
    let projectFilters = ` WHERE 1 = 1 `;
    let rccFilters = ` WHERE 1 = 1 `;

    if (accountIds && accountIds.length > 0) {
      projectFilters += ` AND p.account_rid IN (:accountIds) `;
      rccFilters += ` AND cs.account_rid IN (:accountIds) `;
      replacements.accountIds = accountIds;
    }

    if (fiscalYear) {
      projectFilters += ` AND p.fiscal_year = :fiscalYear `;
      rccFilters += ` AND cs.fiscal_year = :fiscalYear `;
      replacements.fiscalYear = fiscalYear;
    }

    let query = `
    SELECT 
      c.rid AS country_rid,
      c.country_name,
      c.country_code,

      COALESCE(p.total_project_cost, 0) AS total_project_cost,
      COALESCE(p.qualified_project_cost, 0) AS qualified_project_cost,
      COALESCE(p.qre_cost, 0) AS qre_cost,

      COALESCE(rcc.final_credit_computed, 0) AS final_credit_computed,
      COALESCE(rcc.final_credit_submitted, 0) AS final_credit_submitted,
      COALESCE(rcc.final_credit_approved, 0) AS final_credit_approved

    FROM ${MAIN_SCHEMA_NAME}.country c

    LEFT JOIN (
      SELECT 
        p.country_rid,
        SUM(p.total_cost_prj) AS total_project_cost,
        SUM(CASE WHEN p.is_qualified = true THEN p.total_cost_prj ELSE 0 END) AS qualified_project_cost,
        SUM(p.qre_final) AS qre_cost
      FROM ${MAIN_SCHEMA_NAME}.project_fiscal_summary p
      ${projectFilters}
      GROUP BY p.country_rid
    ) p ON c.rid = p.country_rid

    LEFT JOIN (
      SELECT 
        rcc.country_rid,
        SUM(CASE WHEN rcc.final_credit = 'NaN' THEN 0 ELSE rcc.final_credit END) AS final_credit_computed,
        SUM(CASE WHEN rcc.final_credit_submitted = 'NaN' THEN 0 ELSE rcc.final_credit_submitted END) AS final_credit_submitted,
        SUM(CASE WHEN rcc.final_credit_approved = 'NaN' THEN 0 ELSE rcc.final_credit_approved END) AS final_credit_approved
      FROM ${MAIN_SCHEMA_NAME}.rd_credit_calculations_summary rcc
      JOIN ${MAIN_SCHEMA_NAME}.case_summary cs 
        ON rcc.case_rid = cs.case_rid
      ${rccFilters}
      GROUP BY rcc.country_rid
    ) rcc ON c.rid = rcc.country_rid

    WHERE 1 = 1
  `;

    if (activeCountriesRidsSet && activeCountriesRidsSet.size > 0) {
      query += ` AND c.rid IN (:activeCountriesRids) `;
      replacements.activeCountriesRids = Array.from(activeCountriesRidsSet);
    }

    query += `
    ORDER BY c.country_name;
  `;

    return { query, replacements };
  },
  fetchGlobalAccountClaimedAmounts(
    accountIds?: string[],
    fiscalYear?: string,
    activeCountriesRidsSet?: Set<string>
  ) {

    const replacements: any = {};
    let projectFilters = ` WHERE 1=1 `;
    let rccFilters = ` WHERE 1=1 `;

    if (accountIds && accountIds.length > 0) {
      projectFilters += ` AND p.account_rid IN (:accountIds) `;
      rccFilters += ` AND cs.account_rid IN (:accountIds) `;
      replacements.accountIds = accountIds;
    }

    if (fiscalYear) {
      projectFilters += ` AND p.fiscal_year = :fiscalYear `;
      rccFilters += ` AND cs.fiscal_year = :fiscalYear `;
      replacements.fiscalYear = fiscalYear;
    }

    if (activeCountriesRidsSet && activeCountriesRidsSet.size > 0) {
      projectFilters += ` AND p.country_rid IN (:activeCountriesRids) `;
      rccFilters += ` AND rcc.country_rid IN (:activeCountriesRids) `;
      replacements.activeCountriesRids = Array.from(activeCountriesRidsSet);
    }

    const query = `
    WITH project_agg AS (
      SELECT 
        p.country_rid,
        p.account_rid,
        SUM(p.total_cost_prj) AS total_project_cost,
        SUM(CASE WHEN p.is_qualified THEN p.total_cost_prj ELSE 0 END) AS qualified_project_cost,
        SUM(p.qre_final) AS qre_cost
      FROM ${MAIN_SCHEMA_NAME}.project_fiscal_summary p
      ${projectFilters}
      GROUP BY p.country_rid, p.account_rid
    ),

    rcc_agg AS (
      SELECT 
        rcc.country_rid,
        cs.account_rid,
        SUM(CASE WHEN rcc.final_credit = 'NaN' THEN 0 ELSE rcc.final_credit END) AS final_credit_computed,
        SUM(CASE WHEN rcc.final_credit_submitted = 'NaN' THEN 0 ELSE rcc.final_credit_submitted END) AS final_credit_submitted,
        SUM(CASE WHEN rcc.final_credit_approved = 'NaN' THEN 0 ELSE rcc.final_credit_approved END) AS final_credit_approved
      FROM ${MAIN_SCHEMA_NAME}.rd_credit_calculations_summary rcc
      JOIN ${MAIN_SCHEMA_NAME}.case_summary cs 
        ON rcc.case_rid = cs.case_rid
      ${rccFilters}
      GROUP BY rcc.country_rid, cs.account_rid
    ),

    combined_keys AS (
      SELECT country_rid, account_rid FROM project_agg
      UNION
      SELECT country_rid, account_rid FROM rcc_agg
    )

    SELECT 
      a.rid AS account_rid,
      a.account_name,
      c.rid AS country_rid,
      c.country_name,
      c.country_code,

      COALESCE(p.total_project_cost, 0) AS total_project_cost,
      COALESCE(p.qualified_project_cost, 0) AS qualified_project_cost,
      COALESCE(p.qre_cost, 0) AS qre_cost,

      COALESCE(r.final_credit_computed, 0) AS final_credit_computed,
      COALESCE(r.final_credit_submitted, 0) AS final_credit_submitted,
      COALESCE(r.final_credit_approved, 0) AS final_credit_approved

    FROM combined_keys k
    LEFT JOIN project_agg p 
      ON k.country_rid = p.country_rid 
      AND k.account_rid = p.account_rid
    LEFT JOIN rcc_agg r 
      ON k.country_rid = r.country_rid 
      AND k.account_rid = r.account_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.country c 
      ON k.country_rid = c.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.account a 
      ON k.account_rid = a.rid

    ORDER BY a.account_name, c.country_name;
  `;

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
  },
  fetchMeetingSummaryList(accountRids: string[], statusId?: string, userEmail?: string) {
    let query = `
    SELECT 
      *
    FROM ${MAIN_SCHEMA_NAME}.meeting_summary a
    WHERE a.account_rid IN (:accountRids)
    `;

    const replacements: any = {
      accountRids,
    };

    if (statusId) {
      query += ` AND a.status_rid = :statusId`;
      replacements.statusId = statusId;
    }

    if (userEmail) {
      query += `
        AND (
            a.meeting_participants::jsonb @> :userEmailJson
            OR a.invited_by = :userEmail
          )
        `;
      replacements.userEmailJson = JSON.stringify([userEmail]);
      replacements.userEmail = userEmail;
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
    return { query, replacements };
  },
  fetchMeetingSummaryCount(accountRids: string[], statusIds?: string[], userEmail?: string) {
    let query = `
    SELECT 
      count('x')
    FROM ${MAIN_SCHEMA_NAME}.meeting_summary a
    WHERE a.account_rid IN (:accountRids)
    `;

    const replacements: any = {
      accountRids,
    };

    if (statusIds && statusIds.length > 0) {
      query += ` AND a.status_rid IN (:statusIds)`;
      replacements.statusIds = statusIds;
    }

    if (userEmail) {
      query += `
        AND (
            a.meeting_participants::jsonb @> :userEmailJson
            OR a.invited_by = :userEmail
          )
        `;
      replacements.userEmailJson = JSON.stringify([userEmail]);
      replacements.userEmail = userEmail;
    }

    query += `
      AND a.effective_start_time IS NOT NULL
      AND a.effective_end_time IS NOT NULL
      AND a.effective_start_datetime >= date_trunc('week', CURRENT_DATE)
      AND a.effective_start_datetime < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'
    `;

    return { query, replacements };
  },
  getAccountWithStatusByRidQuery(): string {
    return `
      SELECT 
        ${MAIN_SCHEMA_NAME}.account.*, 
        ${MAIN_SCHEMA_NAME}.status.status_description AS status  
      FROM ${MAIN_SCHEMA_NAME}.account
      LEFT JOIN ${MAIN_SCHEMA_NAME}.status 
        ON ${MAIN_SCHEMA_NAME}.account.status_rid = ${MAIN_SCHEMA_NAME}.status.rid
      WHERE ${MAIN_SCHEMA_NAME}.account.rid = :rid
    `;
  },
  getProjectWithStatusByRidQuery(): string {
    return `
      SELECT * FROM ${MAIN_SCHEMA_NAME}.project_fiscal_summary
      WHERE ${MAIN_SCHEMA_NAME}.project_fiscal_summary.project_fiscal_rid = :projectFiscalRid
    `;
  },
  getProjectsByRidsQuery(): string {
    return `
      SELECT * FROM ${MAIN_SCHEMA_NAME}.project_fiscal_summary
      WHERE ${MAIN_SCHEMA_NAME}.project_fiscal_summary.project_fiscal_rid IN (:projectRids)
    `;
  },
  fetchCaseById() {
    return `
    SELECT case_name
    FROM "${MAIN_SCHEMA_NAME}".case_summary
    WHERE case_rid = :caseId
    `;
  },
  fetchCasesByRids() {
    return `
    SELECT case_rid, case_name
    FROM "${MAIN_SCHEMA_NAME}".case_summary
    WHERE case_rid IN (:caseRids)
    `;
  },

};
