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
    let query =  `SELECT se.rid , se.event_name, se.description,st.name AS scope_type_name, st.rid as scope_type_rid 
    FROM scopes st JOIN scope_events se ON se.scope_type_rid = st.rid `;
    const conditions:string[] = [];
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

}