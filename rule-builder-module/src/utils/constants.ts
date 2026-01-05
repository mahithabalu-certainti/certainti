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

export const NODE_ENV = {
  DEV: "DEV",
  PROD: "PRODUCTION",
};

export const STATUS_MESSAGE = {
  separateDb: "separate_db",
  ruleCreated: "Rule created successfully",
  ruleUpdated: "Rule updated successfully",
  ruleCreationFailed: "Rule creation failed",
  ruleDeleteSuccess: "Rule deleted successfully",
  ruleDeleteFailed: "Rule deletion failed",
  conditionCreated: "Condition created successfullt",
  conditionCreationFail: "Condition creation failed",
  conditionUpdated: "Condition updated successfully",
  conditionDeleteSuccess: "Condition deleted successfully",
  conditionDeleteFailed: "Condition deletion failed",
  actionCreated: "Action created successfullt",
  actionCreationFail: "Action creation failed",
  actionUpdated: "Action updated successfully",
  actionDeleteSuccess: "Action deleted successfully",
  actionDeleteFailed: "Action deletion failed",
  scopeCreated: "Scope created successfullt",
  scopeCreationFail: "Scope creation failed",
  scopeUpdated: "Scope updated successfully",
  scopeDeleteSuccess: "Scope deleted successfully",
  scopeDeleteFailed: "Scope deletion failed",
  scheduleCreated: "Schedule created successfullt",
  scheduleCreationFail: "Schedule creation failed",
  scheduleUpdated: "Schedule updated successfully",
  scheduleDeleteSuccess: "Schedule deleted successfully",
  scheduleDeleteFailed: "Schedule deletion failed",
  auditCreated: "Audit created successfullt",
  triggerLogCreated: "Trigger Log created successfullt",
  notificationTemplatesListedSuccess: "Notification templates listed successfully",
  dataNotAvailable: "Data not available",
}

export const ALPHANUMERIC_CONDITIONS: Record<string, string> = {
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

export const mainTableFilters: Record<any, any> = {
  created_user_name: "created_user_name",
  updated_user_name: "updated_user_name",
  rule_name: "rule_name",
  modified_user_name: "modified_user_name",
  scope_type_name: "scope_type_name",
}

export const notificationTypes = {
  InApp: "In App",
  Email: "Email"
}

export const notificationStatus = {
  unread: "Unread",
  failed: "Failed"
}


export const ruleTemplateNames = {
  caseCreated: "case_create",
  statusUpdated:"task_status_update",
  taskCreated:"task_create"
}

export const ruleNames = {
  caseCreated: "Case Event",
  taskCreated: "Task Event",
  taskAssigned: "Task Assigned",
}

export const schedulerStatus = {
  Success : "success",
  Failed : "failed",
  Running : "running"
}

export const schedulerTaskName = {
    caseSubmissionOverDue : "caseSubmissionOverDue",
    interaction : "interactions",
    attachments : "attachments"
  }

export const rawQueries = {
  fetchUser(data: any) {
    let ids = data.map((d: any) => `'${d}'`);
    return `
    SELECT rid, first_name, last_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (${ids})`;
  },

  fetchScopeEvents(scope_type_rid: string, status_rid: string): string {
    let query = `SELECT se.rid , se.event_name, se.description,st.name AS scope_type_name, st.rid as scope_type_rid,se.type 
    FROM ${MAIN_SCHEMA_NAME}.scopes st JOIN ${MAIN_SCHEMA_NAME}.scope_events se ON se.scope_type_rid = st.rid 
    and se.status_rid = (select rid from ${MAIN_SCHEMA_NAME}.status where status_name = 'Active') `;
    const conditions: string[] = [];
    if (scope_type_rid) {
      conditions.push(`se.scope_type_rid = '${scope_type_rid}'`);
    }
    if (status_rid) {
      conditions.push(`se.status_rid = '${status_rid}'`);
    }
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ` ORDER BY st.name;`;
    return query;
  },

  fetchEventConditions(event_rid: string, status_rid: string): string {
    let query = `SELECT ec.rid, ec.name as condition_name, ec.description,ec.type as condition_type  FROM ${MAIN_SCHEMA_NAME}.event_conditions ec JOIN ${MAIN_SCHEMA_NAME}.event_conditions_map ecm 
    ON ec.rid = ecm.condition_rid where  ec.status_rid = (select rid from ${MAIN_SCHEMA_NAME}.status where status_name = 'Active') `;
    const conditions: string[] = [];
    conditions.push(` and ecm.event_rid = '${event_rid}'`);
    // if (status_rid) {
    //   conditions.push(`ec.status_rid = '${status_rid}'`);
    // }
    query += ` ${conditions.join(' AND ')}`;
    return query;
  },

  fetchConditionCategory(condition_rid: string, status_rid: string): string {
    let query = `SELECT cc.rid, cc.name as category_name, cc.description FROM ${MAIN_SCHEMA_NAME}.condition_category cc JOIN ${MAIN_SCHEMA_NAME}.condition_category_map ccm 
    ON cc.rid = ccm.category_rid  and cc.status_rid = (select rid from ${MAIN_SCHEMA_NAME}.status where status_name = 'Active') `;
    const conditions: string[] = [];
    conditions.push(`ccm.condition_rid = '${condition_rid}'`);
    query += ` WHERE ${conditions.join(' AND ')}`;
    return query;
  },

  fetchFields(category_rid: string, status_rid: string,scope_event_rid: string): string {
    let query = `SELECT rf.rid, rf.name as name,rf.field_description FROM ${MAIN_SCHEMA_NAME}.rule_fields rf JOIN ${MAIN_SCHEMA_NAME}.field_category_map fcm 
    ON rf.rid = fcm.field_rid `;
    const conditions: string[] = [];
    conditions.push(`fcm.category_rid = '${category_rid}'`);
    if (status_rid) {
      conditions.push(`rf.status_rid = '${status_rid}'`);
    }
    if (scope_event_rid) {
      conditions.push(`fcm.scope_event_rid = '${scope_event_rid}'`);
    }
    query += ` WHERE ${conditions.join(' AND ')}`;
    return query;
  },

  fetchOperators(field_rid: string, status_rid: string): string {
    let query = `SELECT ro.rid, ro.name as name FROM ${MAIN_SCHEMA_NAME}.rule_operators ro JOIN ${MAIN_SCHEMA_NAME}.operator_category_map ocm 
    ON ro.rid = ocm.operator_rid `;
    const conditions: string[] = [];
    conditions.push(`ocm.field_rid = '${field_rid}'`);
    if (status_rid) {
      conditions.push(`ro.status_rid = '${status_rid}'`);
    }
    query += ` WHERE ${conditions.join(' AND ')}`;
    return query;
  },

  fetchValues(field_rid: string, status_rid: string): string {
    let query = `SELECT rv.rid, rv.name as name FROM ${MAIN_SCHEMA_NAME}.rule_values rv JOIN ${MAIN_SCHEMA_NAME}.value_category_map vcm 
    ON rv.rid = vcm.value_rid `;
    const conditions: string[] = [];
    conditions.push(`vcm.field_rid = '${field_rid}'`);
    if (status_rid) {
      conditions.push(`rv.status_rid = '${status_rid}'`);
    }
    query += ` WHERE ${conditions.join(' AND ')}`;
    return query;
  },

  fetchActionTypes(scope_rid: string, status_rid: string): string {
    let query = `SELECT sat.rid, sat.name FROM ${MAIN_SCHEMA_NAME}.scope_action_types sat JOIN ${MAIN_SCHEMA_NAME}.scope_actiontype_map sam 
    ON sat.rid = sam.actiontype_rid `;
    const conditions: string[] = [];
    conditions.push(`sam.scope_rid = '${scope_rid}'`);
    if (status_rid) {
      conditions.push(`sat.status_rid = '${status_rid}'`);
    }
    query += ` WHERE ${conditions.join(' AND ')}`;
    return query;
  },

  fetchActions(scope_rid: string, action_type_rid: string, status_rid: string): string {
    let query = `SELECT sa.rid, sa.name,sa.description,sam.action_type_rid,sat.name as action_type_name FROM ${MAIN_SCHEMA_NAME}.scope_actions sa JOIN ${MAIN_SCHEMA_NAME}.scope_actions_map sam 
    ON sa.rid = sam.action_rid JOIN ${MAIN_SCHEMA_NAME}.scope_action_types sat ON sat.rid = sam.action_type_rid
    JOIN ${MAIN_SCHEMA_NAME}.scope_actiontype_map samt ON samt.actiontype_rid = sam.action_type_rid `;
    const conditions: string[] = [];
    conditions.push(`samt.scope_rid = '${scope_rid}'`);
    if (action_type_rid) {
      conditions.push(`sam.action_type_rid = '${action_type_rid}'`);
    }
    if (status_rid) {
      conditions.push(`sa.status_rid = '${status_rid}'`);
    }
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    return query;
  },

  fetchEventRid(event_name: string, task_rid: string): string {
    let query = `SELECT scope_type_rid, rid as event_rid FROM ${MAIN_SCHEMA_NAME}.scope_events se WHERE se.event_name  = '${event_name}'`;
    return query;
  },

  fetchRulesFromEvent(event_rid: string, scope_type_rid: string, entity_rid: string): string {
    let query = `SELECT wrm.rid AS rule_rid,wrm.condition_rid,rm.apply_type FROM ${MAIN_SCHEMA_NAME}.workflow_rule_master wrm LEFT JOIN ${MAIN_SCHEMA_NAME}.workflow_rule_map rm 
    ON rm.rule_rid = wrm.rid LEFT JOIN ${MAIN_SCHEMA_NAME}.workflow_rule_scope_map rsm ON rsm.rule_rid = wrm.rid 
    WHERE wrm.event_rid = '${event_rid}' AND wrm.scope_type_rid = '${scope_type_rid}' AND wrm.is_active = true
    AND (
        rm.apply_type = 'ALL'
        OR (rm.apply_type = 'INDIVIDUAL' AND rsm.scope_entity_rid = '${entity_rid}')
      );`;
    return query;
  },

  fetchRuleConditions(category_rid: string, rule_rid: string): string {
    let query = `SELECT wrc.rule_rid,rf.name as field,rf.field_description ,ro.name as operator,rv.name as value,wrc.logical_operator,rv.action_phrase,ro.action_phrase as operator_phrase FROM ${MAIN_SCHEMA_NAME}.workflow_rule_condition wrc 
    JOIN ${MAIN_SCHEMA_NAME}.rule_fields rf ON rf.rid = wrc.field_rid JOIN ${MAIN_SCHEMA_NAME}.rule_operators ro ON ro.rid = wrc.operator_rid JOIN ${MAIN_SCHEMA_NAME}.rule_values rv on rv.rid = wrc.value_rid 
    WHERE wrc.rule_rid = '${rule_rid}'`;
    if (category_rid) {
      query += `\n    and wrc.category_rid = '${category_rid}'`;
    }
    query += `\n    ORDER BY wrc.sequence `;
    return query;
  },

  fetchRuleActions(rule_rid: string): string {
    let query = `SELECT wra.rule_rid,wra.action_rid, sa.name as action_name,sa.message_template,sa.metadata,wra.action_order FROM ${MAIN_SCHEMA_NAME}.workflow_rule_action wra 
    JOIN ${MAIN_SCHEMA_NAME}.scope_actions sa ON sa.rid = wra.action_rid WHERE wra.rule_rid = '${rule_rid}' ORDER BY wra.action_order `;
    return query;
  },


  fetchEventDetailByEventRid(event_rid: string): string {
    let query = `SELECT se.rid as event_rid,se.event_name, se.description FROM ${MAIN_SCHEMA_NAME}.scope_events se 
    WHERE se.rid = '${event_rid}' `;
    return query;
  },

  fetchConditionDetailByCondRid(condition_rid: string): string {
    let query = `SELECT se.rid as condition_rid,se.name as condition_name, se.description,se.type as condition_type FROM ${MAIN_SCHEMA_NAME}.event_conditions se 
    WHERE se.rid = '${condition_rid}' `;
    return query;
  },

  fetchActionDetailByRuleRid(rule_rid: string): string {
    let query = `SELECT sa.rid as action_rid,sa.name as action_name,sa.description as description,sam.action_type_rid FROM ${MAIN_SCHEMA_NAME}.scope_actions sa JOIN ${MAIN_SCHEMA_NAME}.workflow_rule_action wra ON sa.rid = wra.action_rid JOIN ${MAIN_SCHEMA_NAME}.scope_actions_map sam ON sam.action_rid = wra.action_rid
    WHERE wra.rule_rid = '${rule_rid}' `;
    return query;
  },

  fetchConditionsByRuleRid(rule_rid: string): string {
    let query = `SELECT cc.rid as category_rid,cc.name as category_name, cc.description as category_description, wrc.logical_operator as category_operator, rf.rid as field_rid, rf.name as field_name,rf.field_description, ro.rid as operator_rid, ro.name as operator_name, rv.rid as value_rid, rv.name as value_name ,rv.action_phrase FROM ${MAIN_SCHEMA_NAME}.condition_category cc JOIN ${MAIN_SCHEMA_NAME}.workflow_rule_condition wrc ON cc.rid = wrc.category_rid JOIN ${MAIN_SCHEMA_NAME}.rule_fields rf on rf.rid = wrc.field_rid JOIN ${MAIN_SCHEMA_NAME}.rule_operators ro ON ro.rid = wrc.operator_rid JOIN ${MAIN_SCHEMA_NAME}.rule_values rv ON rv.rid = wrc.value_rid
    WHERE wrc.rule_rid = '${rule_rid}' `;
    return query;
  },

  fetchNotificationTemplateDetails(template_rid: string, channel: string,): string {
    let query = `SELECT nt.message_template,nt.channel,nt.subject
    FROM ${MAIN_SCHEMA_NAME}.notification_template nt 
    WHERE lower(nt.template_name) = lower('${template_rid.toLowerCase()}')
    and nt.channel = '${channel}'
    and status_rid = (select status_rid from ${MAIN_SCHEMA_NAME}.status where status_name = 'Active');`;
    return query;
  },
  insertNotification(): string {
    let query = `INSERT INTO ${MAIN_SCHEMA_NAME}.notifications (notification_message, created_by, user_rid, created_datetime)
            VALUES (:notification_message, :created_by, :user_rid, NOW())
            RETURNING rid`;
    return query;
  },
  updateNotificationStatus(): string {
    return `UPDATE ${MAIN_SCHEMA_NAME}.notifications SET status_rid = :status_rid WHERE rid = :notificationId`;
  },
  fetchNotificationStatusByType(type: string) {
    return `
    SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.notification_status WHERE status_name = '${type}'`;
  },
  fetchAccountInfo(rid: string) {
    return `
    SELECT rid, account_name,r_number,parent_account_rid,storage_type,country_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${rid}'`;
  },
  fetchSenderEmail(schemaName: string, accountRid: string) {
    return `
    SELECT support_email,client_id,client_secret,tenant_id, subscription_created FROM ${schemaName}.account_details WHERE account_rid = '${accountRid}'  and  subscription_created is true  and support_email is not null LIMIT 1`;
  },
  fetchParentAccountDetails: `SELECT * FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = :rid`,
  async fetchParentAccount(
    accountRid: any,
    mainSequelize: Sequelize
  ): Promise<any> {
    let checkIsSeparateDb: any = await mainSequelize.query(
      `SELECT rid, r_number, account_name, storage_type FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`
    );
    if (checkIsSeparateDb[0][0].storage_type == STATUS_MESSAGE.separateDb) {
      return `SELECT rid, r_number, account_name, storage_type, currency_rid FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = '${accountRid}'`;
    } else {
      return `
      with fetch_account_details AS (
      SELECT rid, r_number, parent_account_rid, currency_rid FROM ${MAIN_SCHEMA_NAME}.account where rid = '${accountRid}'
      )
      SELECT a.rid, a.r_number, a.account_name, a.is_parent 
      FROM ${MAIN_SCHEMA_NAME}.account a
      LEFT JOIN fetch_account_details ad ON ad.parent_account_rid = a.rid
      WHERE a.rid = ad.parent_account_rid`;
    }
  },

  getScopeTypeName(data: any) {
    let scopeids = data.map((sc: any) => `'${sc}'`).join(', ');  // Join ids with commas
    let query = `SELECT rid, name as scope_name FROM ${MAIN_SCHEMA_NAME}.scopes WHERE rid IN (${scopeids})`;  // Remove extra quote at the end
    return query;
  },

  getMappedRuleRids(ruleRids: any[]) {
    const ids = ruleRids.map(id => `'${id}'`).join(', ');
    return `SELECT rule_rid FROM ${MAIN_SCHEMA_NAME}.workflow_rule_map WHERE rule_rid IN (${ids})`;
  },

  getEventTypes(eventRids: any[]) {
    const ids = eventRids.map(id => `'${id}'`).join(', ');
    return `SELECT rid,type FROM ${MAIN_SCHEMA_NAME}.scope_events WHERE rid IN (${ids})`;
  },

  fetchMapDetailsByRuleRid(rule_rid: string): string {
    let query = `SELECT wrm.apply_type,wrm.rule_rid,wrma.scope_type_rid FROM ${MAIN_SCHEMA_NAME}.workflow_rule_map wrm
    JOIN ${MAIN_SCHEMA_NAME}.workflow_rule_master wrma ON wrm.rule_rid = wrma.rid WHERE wrma.rid = '${rule_rid}' `;
    return query;
  },

  fetchScopeMapDetailsByRuleRid(rule_rid: string): string {
    let query = `SELECT wrsm.scope_entity_rid FROM ${MAIN_SCHEMA_NAME}.workflow_rule_scope_map wrsm  WHERE wrsm.rule_rid = '${rule_rid}' `;
    return query;
  },
  schedulerSelectRunning(): string {
    return `SELECT * FROM ${MAIN_SCHEMA_NAME}.scheduler_executions WHERE status = :status LIMIT 1`;
  },
  schedulerInsertRunning(): string {
    return `INSERT INTO ${MAIN_SCHEMA_NAME}.scheduler_executions (created_datetime, started_at, status) VALUES (:created_datetime, :started_at, :status) RETURNING *`;
  },
  fetchAllParentRNumber() {
    let query = `SELECT r_number FROM ${MAIN_SCHEMA_NAME}.account WHERE storage_type = '${STATUS_MESSAGE.separateDb}' AND parent_account_rid IS NULL
    ORDER BY r_number ASC limit 1`;
    return query;
  },
  fetchSchemaName(r_number: string) {
    return `${MAIN_SCHEMA_NAME}_${r_number.replace("ACC-", "")}`;
  },
  fetchCaseStatus() { 
    return `SELECT rid, status_name from ${MAIN_SCHEMA_NAME}.case_status`;
  },
  fetchTaskStatus() {
    return `SELECT rid, task_status_name from ${MAIN_SCHEMA_NAME}.case_task_status`;
  },
  fetchTaskTypes() {
    return `SELECT rid, task_type_name from ${MAIN_SCHEMA_NAME}.task_type WHERE task_type_name ='Milestone' and status = 'Active'`;
  },
   fetchAllCases() {
    return `SELECT cs.rid,
    CONCAT(ac.account_name, '-', c.country_name, '-',cs.fiscal_year,'-',cs.case_name) AS case_name,ac.account_name, cs.status_rid, planned_submission_date,statutory_submission_date,account_rid,case_owner_rid ,email FROM ${MAIN_SCHEMA_NAME}.case_summary  cs
    LEFT JOIN ${MAIN_SCHEMA_NAME}.user uu ON cs.case_owner_rid = uu.rid 
    LEFT JOIN ${MAIN_SCHEMA_NAME}.account ac ON cs.account_rid = ac.rid
     LEFT JOIN ${MAIN_SCHEMA_NAME}.country c ON ac.country_rid = c.rid
   `;
  },
  fetchAllCaseTask(taskType:string) {
    return `SELECT task_rid,task_name,ac.account_name, ts.status_rid, effective_start_datetime,effective_end_datetime,ts.account_rid,assigned_to,uu.email,
     CONCAT(ac.account_name, '-', c.country_name, '-',cs.fiscal_year,'-',cs.case_name) AS case_name
    FROM ${MAIN_SCHEMA_NAME}.task_summary ts
      LEFT JOIN ${MAIN_SCHEMA_NAME}.user uu ON ts.assigned_to = uu.rid
      LEFT JOIN ${MAIN_SCHEMA_NAME}.account ac ON ts.account_rid = ac.rid
       LEFT JOIN ${MAIN_SCHEMA_NAME}.country c ON ac.country_rid = c.rid
       LEFT JOIN trd365.case_Summary cs ON cs.case_rid = ts.attach_to
    WHERE  ts.task_type_rid = '${taskType}'`;
  },
  fetchAllCasesOverdue(inProgressStatusRid: string) {
    return `SELECT rid, status_rid, planned_submission_date FROM ${MAIN_SCHEMA_NAME}.case_summary WHERE status_rid = '${inProgressStatusRid}' AND planned_submission_date IS NOT NULL AND planned_submission_date <= CURRENT_DATE limit 1`;
  },

  fetchCasesStatutoryOverdue(inProgressStatusRid: string) {
    return `SELECT rid, status_rid, statutory_submission_date FROM ${MAIN_SCHEMA_NAME}.case_summary WHERE status_rid = '${inProgressStatusRid}' AND statutory_submission_date IS NOT NULL AND statutory_submission_date < CURRENT_DATE limit 1`;
  },
  schedulerTaskExecutionInsert(): string {
      return `INSERT INTO ${MAIN_SCHEMA_NAME}.scheduler_task_executions (task_name, execution_rid, started_at, created_datetime, status) VALUES (:taskName, :executionRid, :startedAt, :createdDatetime, :status) RETURNING *`;
  },
  schedulerExecutionSelect(): string {
      return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.scheduler_executions WHERE rid = :executionRid AND status = :status LIMIT 1`;
    },
   schedulerTaskExecutionUpdate(): string {
      return `UPDATE ${MAIN_SCHEMA_NAME}.scheduler_task_executions SET 
          status = :status, 
          error_message = :errorMessage, 
          completed_at = :completedAt 
        WHERE execution_rid = :executionRid AND task_name = :taskName`;
    },
    schedulerExecutionUpdate(): string {
      return `UPDATE ${MAIN_SCHEMA_NAME}.scheduler_executions SET status = :status WHERE rid = :executionRid`;
    },
    schedulerTaskExecutionSelect(): string {
        return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.scheduler_task_executions WHERE execution_rid = :executionRid AND task_name = :taskName LIMIT 1`;
      },
    getNotificationTemplates(channel: string, conditionRid: string,eventRid:string) {
      return `SELECT rid, template_code, channel, message_template,template_name FROM ${MAIN_SCHEMA_NAME}.notification_template WHERE channel = '${channel}'`
        + (conditionRid ? ` AND condition_rid = '${conditionRid}'` : '')
         + (eventRid ? ` AND event_rid = '${eventRid}'` : '')
        + ` AND status_rid = (SELECT status_rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_name = 'Active') order by template_name asc`;
    },
    fetchNotificationInAppTemplatesForRule(rule_rid: string) {
      return `SELECT in_app_template_rid as template_rid FROM ${MAIN_SCHEMA_NAME}.workflow_rule_master WHERE rid = '${rule_rid}' AND is_active = true`;
    },
    fetchNotificationEmailTemplatesForRule(rule_rid: string) {
      return `SELECT email_template_rid as template_rid FROM ${MAIN_SCHEMA_NAME}.workflow_rule_master WHERE rid = '${rule_rid}'  AND is_active = true`;
    },
    markTaskAsHighPriorityinCaseTask(schemaName: string){
      return `
      UPDATE ${schemaName}.case_task
      SET is_flagged = true
      WHERE rid = :taskRid
      `;
    },
    markTaskAsHighPriorityTaskSummary(){
      return `
      UPDATE ${MAIN_SCHEMA_NAME}.task_summary
      SET is_flagged = true
      WHERE task_rid = :taskRid
      `;
    },
    fetchRuleTypeByName(ruleTypeName: string) {
      return `SELECT rid, name FROM ${MAIN_SCHEMA_NAME}.condition_category WHERE lower(name) = lower('${ruleTypeName}') LIMIT 1`;
    },
    insertHistoryLog() {
      return `INSERT INTO ${MAIN_SCHEMA_NAME}.notification_history (
        created_by,
        created_datetime,
        user_rid,
        user_email,
        action_name,
        entity_rid
      ) VALUES (
        :created_by,
        NOW(),
        :user_rid,
        :user_email,
        :action_name,
        :entity_rid
      )`;
    },
    checkTableExists(schemaName: string, table: string) {
      return `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = '${schemaName}' AND table_name = '${table}')`;
}

}
