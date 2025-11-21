import * as RuleMasterModel from "../models/workflowRuleMaster";
import * as ConditionGroupModel from "../models/workflowRuleConditionGroup";
import * as ConditionModel from "../models/workflowRuleCondition";
import * as ActionService from "./actionService";
import * as AuditService from "./auditService";
import * as ScopeMapModel from "../models/workflowRuleScopeMap";

/**
 * Evaluate a rule for a given entity (case or task)
 */
export const evaluateRuleForEntity = async (ruleRid: string, entity: any, userId: number) => {
  const conditionGroups = await ConditionGroupModel.getConditionGroupsByRule(ruleRid);

  let ruleSatisfied = false;

  for (const group of conditionGroups) {
    // const conditions = await ConditionModel.getConditionsByGroup(group.rid!);
    // let groupResult = group.groupOperator === "AND";

    //   for (const condition of conditions) {
    //     const entityValue = entity[condition.fieldName];
    //     const conditionMatch = ActionService.checkCondition(entityValue, condition.operator, condition.value, condition.dataType);

    //     if (group.groupOperator === "AND") groupResult = groupResult && conditionMatch;
    //     else groupResult = groupResult || conditionMatch;
    //   }

    //   if (groupResult) {
    //     ruleSatisfied = true;
    //     break; // Stop if any group satisfies
    //   }
  }

  if (ruleSatisfied) {
    const actions = await ActionService.getActionsByRule(ruleRid);
    for (const action of actions) {
      await ActionService.executeAction(action, entity, userId);
      await AuditService.createAuditEntry({
        ruleRid,
        action: action.actionType,
        oldValue: entity[action.fieldName],
        newValue: action.newValue,
        notes: `Executed action ${action.actionType} for entity ${entity.id}`,
        createdBy: userId,
      });
    }
  }

  return ruleSatisfied;
};

/**
 * Fetch rules applicable for a given entity type (case/task)
 */
export const getApplicableRulesForEntity = async (entityType: string, entityId: number) => {
  const scopeMaps = await ScopeMapModel.getScopesByEntity(entityType, entityId);
  const rules = [];

  for (const map of scopeMaps) {
    const rule = await RuleMasterModel.getRuleMasterById(map.ruleId);
    if (rule?.isActive) rules.push(rule);
  }

  return rules;
};
