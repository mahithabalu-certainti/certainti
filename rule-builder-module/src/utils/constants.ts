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
export const MAIN_SCHEMA_NAME = "public";
export const SCHEMANAME_PREFIX = "trd365_";

export const NODE_ENV = {
  DEV: "DEV",
  PROD: "PRODUCTION",
};

export const STATUS_MESSAGE = {
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
}


export const rawQueries = {
  fetchScopeEvents(scope_type_rid: string, status_rid: string): string {
    let query = `SELECT se.rid , se.event_name, se.description,st.name AS scope_type_name, st.rid as scope_type_rid 
    FROM ${MAIN_SCHEMA_NAME}.scopes st JOIN ${MAIN_SCHEMA_NAME}.scope_events se ON se.scope_type_rid = st.rid `;
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
    ON ec.rid = ecm.condition_rid `;
    const conditions: string[] = [];
    conditions.push(`ecm.event_rid = '${event_rid}'`);
    if (status_rid) {
      conditions.push(`ec.status_rid = '${status_rid}'`);
    }
    query += ` WHERE ${conditions.join(' AND ')}`;
    return query;
  },

  fetchConditionCategory(condition_rid: string, status_rid: string): string {
    let query = `SELECT cc.rid, cc.name as category_name, cc.description FROM ${MAIN_SCHEMA_NAME}.condition_category cc JOIN ${MAIN_SCHEMA_NAME}.condition_category_map ccm 
    ON cc.rid = ccm.category_rid `;
    const conditions: string[] = [];
    conditions.push(`ccm.condition_rid = '${condition_rid}'`);
    if (status_rid) {
      conditions.push(`cc.status_rid = '${status_rid}'`);
    }
    query += ` WHERE ${conditions.join(' AND ')}`;
    return query;
  },

  fetchFields(category_rid: string, status_rid: string): string {
    let query = `SELECT rf.rid, rf.name as name FROM ${MAIN_SCHEMA_NAME}.rule_fields rf JOIN ${MAIN_SCHEMA_NAME}.field_category_map fcm 
    ON rf.rid = fcm.field_rid `;
    const conditions: string[] = [];
    conditions.push(`fcm.category_rid = '${category_rid}'`);
    if (status_rid) {
      conditions.push(`rf.status_rid = '${status_rid}'`);
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

  fetchActions(action_type_rid: string, status_rid: string): string {
    let query = `SELECT sa.rid, sa.name,sa.description,sam.action_type_rid,sat.name as action_type_name FROM ${MAIN_SCHEMA_NAME}.scope_actions sa JOIN ${MAIN_SCHEMA_NAME}.scope_actions_map sam 
    ON sa.rid = sam.action_rid JOIN scope_action_types sat ON sat.rid = sam.action_type_rid `;
    const conditions: string[] = [];
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
    let query = `SELECT scope_type_rid, rid as event_rid FROM scope_events se WHERE se.event_name  = '${event_name}'`;
    return query;
  },

  fetchRulesFromEvent(event_rid: string, scope_type_rid: string, entity_rid: string): string {
    let query = `SELECT wrm.rid AS rule_rid,wrm.condition_rid,rm.apply_type FROM workflow_rule_master wrm LEFT JOIN workflow_rule_map rm 
    ON rm.rule_rid = wrm.rid LEFT JOIN workflow_rule_scope_map rsm ON rsm.rule_rid = wrm.rid 
    WHERE wrm.event_rid = '${event_rid}' AND wrm.scope_type_rid = '${scope_type_rid}'
    AND (
        rm.apply_type = 1
        OR (rm.apply_type = 2 AND rsm.scope_entity_rid = '${entity_rid}')
      );`;
    return query;
  },

  fetchCategories(condition_rid: string, rule_rid: string): string {
    let query = `SELECT  `;
    return query;
  }
}