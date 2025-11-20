import { 
  createRule, getRuleById, updateRule, deleteRule 
} from "../models/rule";

import { 
  createCondition, deleteConditionsByRule, getConditionsByRule 
} from "../models/condition";

import { 
  createAction, deleteActionsByRule, getActionsByRule 
} from "../models/action";

export const createFullRule = async (
  ruleData: any,
  conditions: any[],
  actions: any[]
) => {

  const rule = await createRule(ruleData);

  for (const c of conditions) {
    await createCondition({ ...c, ruleId: rule.id! });
  }

  for (const a of actions) {
    await createAction({ ...a, ruleId: rule.id! });
  }

  return rule;
};

export const getFullRule = async (id: number) => {
  const rule = await getRuleById(id);
  const conditions = await getConditionsByRule(id);
  const actions = await getActionsByRule(id);

  return { rule, conditions, actions };
};

export const updateFullRule = async (
  id: number,
  ruleData: any,
  conditions: any[],
  actions: any[]
) => {
  const updated = await updateRule(id, ruleData);

  await deleteConditionsByRule(id);
  await deleteActionsByRule(id);

  for (const c of conditions) {
    await createCondition({ ...c, ruleId: id });
  }

  for (const a of actions) {
    await createAction({ ...a, ruleId: id });
  }

  return updated;
};

export const deleteFullRule = async (id: number) => {
  await deleteConditionsByRule(id);
  await deleteActionsByRule(id);
  await deleteRule(id);
  return true;
};
