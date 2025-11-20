import * as ConditionModel from "../models/workflowRuleCondition";

export const evaluateConditionsForGroup = async (groupRid: number, entity: any) => {
  const conditions = await ConditionModel.getConditionsByGroup(groupRid);
  let result = true;

  for (const condition of conditions) {
    const entityValue = entity[condition.fieldName];
    const match = entityValue == condition.value; // simple equality, extend as needed
    result = result && match;
  }

  return result;
};
