import * as ActionModel from "../models/workflowRuleAction";

export const getActionsByRule = async (ruleRid: number) => {
  return await ActionModel.getActionsByRule(ruleRid);
};

export const executeAction = async (action: any, entity: any, userId: number) => {
  switch (action.actionType) {
    case "notify_user":
      console.log(`[Action] Notify user ${action.targetUser} about entity ${entity.id}`);
      break;
    case "change_status":
      console.log(`[Action] Change status of entity ${entity.id} to ${action.newValue}`);
      entity[action.fieldName] = action.newValue; // optional: update in DB
      break;
    case "assign_user":
      console.log(`[Action] Assign entity ${entity.id} to user ${action.targetUser}`);
      break;
    default:
      console.log(`[Action] Unknown action type: ${action.actionType}`);
  }
};

/**
 * Check a single condition
 */
export const checkCondition = (entityValue: any, operator: string, value: any, dataType: string): boolean => {
  switch (dataType) {
    case "number":
      entityValue = Number(entityValue);
      value = Number(value);
      break;
    case "string":
      entityValue = String(entityValue);
      value = String(value);
      break;
    case "boolean":
      entityValue = Boolean(entityValue);
      value = Boolean(value);
      break;
  }

  switch (operator) {
    case "==": return entityValue === value;
    case "!=": return entityValue !== value;
    case ">": return entityValue > value;
    case "<": return entityValue < value;
    case ">=": return entityValue >= value;
    case "<=": return entityValue <= value;
    case "contains": return String(entityValue).includes(String(value));
    default: return false;
  }
};
