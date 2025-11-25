import * as ScopeModel from "../models/workflowRuleScopeMap";
import * as ActionModel from "../models/workflowRuleAction";
import * as AuditService from "./auditService";
import * as ActionService from "./workflowActionService";

/**
 * Fetch entity (case or task) from DB.
 * Replace with real DB query.
 */
const getEntityById = async (entityType: string, entityId: number) => {
  // Example mock entity
  return {
    id: entityId,
    type: entityType,
    priority: "high",
    status: "open",
    assignedTo: 2
  };
};

/**
 * Check rule conditions
 * Replace with dynamic condition evaluation logic
 */
const checkConditions = async (entity: any, ruleId: string) => {
  // Example: simple check
  return entity.priority === "high";
};

/**
 * Execute actions for a rule
 */
const executeActions = async (ruleId: string, entity: any, userId: number) => {
  const actions = await ActionService.getRuleActionByRuleRId(ruleId);
  console.log(ruleId + "fetching actions");
  console.log(actions);
  const executedActions: string[] = [];

  // for (const action of actions) {
  //   // Action execution logic (simplified)
  //   if (action.action_type === "notify_user") {
  //     console.log(`Notify user ${action.target_user} for entity ${entity.id}`);
  //   } else if (action.action_type === "change_status") {
  //     console.log(`Change status of entity ${entity.id} to ${action.newValue}`);
  //     entity.status = action.newValue;
  //   } else if (action.action_type === "assign_user") {
  //     console.log(`Assign entity ${entity.id} to user ${action.targetUser}`);
  //     entity.assignedTo = action.target_user;
  //   }

  //   executedActions.push(action.action_type);

  //   // Log audit
  //   await AuditService.createAuditEntry({
  //     ruleRid: ruleId,
  //     action: action.actionType,
  //     oldValue: entity.status,
  //     newValue: action.newValue || null,
  //     notes: `Executed action ${action.actionType}`,
  //     createdBy: userId
  //   });
  // }

  return executedActions;
};

/**
 * Main workflow execution function
 */
export const executeWorkflowForEntity = async (
  entityType: string,
  entityId: number,
  userId: number
) => {
  // const scopes = await ScopeModel.getScopesByEntity(entityType, entityId);
  // console.log("Scopes:", scopes);
  // const entity = await getEntityById(entityType, entityId);

  const executedRules: any[] = [];

  // for (const scope of scopes) {
  //   const ruleId = scope.rule_rid;
  //   console.log("rrule_id" + ruleId);
  //   const passed = await checkConditions(entity, ruleId);

  //   if (passed) {
  //     const actionsExecuted = await executeActions(ruleId, entity, userId);
  //     executedRules.push({ ruleId, actionsExecuted });
  //   }
  // }

  return executedRules;
};
