import { Router } from "express";
import RuleController from "../controllers/workflowRuleMasterController";
import ConditionController from "../controllers/workflowConditionController";
import ActionController from "../controllers/workflowRuleActionController";
import ScopeController from "../controllers/workflowRuleScopeMapController";
import TriggerController from "../controllers/workflowRuleTriggerLogController";
import ScheduleController from "../controllers/workflowRuleScheduleQueueController";
import WorkFlowController from "../controllers/workflowRulecontroller";

const router = Router();

// RuleMaster
router.post("/rule", RuleController.createRuleMaster);
router.get("/rule", RuleController.getAllRuleMasters);
router.put("/rule/update", RuleController.updateRuleMaster);
router.post("/rule/delete", RuleController.deleteRuleMaster);

// Condition
router.post("/condition", ConditionController.createCondition);
router.get("/condition", ConditionController.listAllConditions);
router.put("/condition/update", ConditionController.updateCondition);
//router.post("/condition/delete", ConditionController.deleteCondition);
// router.get("/condition/group/:groupRid", ConditionController.getConditionsByGroup);

// Action
router.post("/action", ActionController.createAction);
router.get("/action", ActionController.listActions);
router.put("/action/update", ActionController.updateAction);
//router.post("/action/delete", ActionController.deleteAction);

// ScopeMap
router.post("/scope", ScopeController.createRuleScope);
router.put("/scope/update", ScopeController.updateScope);
router.post("/scope/delete", ScopeController.deleteScope);

// TriggerLog
router.post("/trigger", TriggerController.createTriggerLog);
// router.get("/trigger/:rid", TriggerController.getTriggerLogById);
// router.get("/trigger/rule/:ruleRid", TriggerController.getTriggerLogsByRule);
// router.delete("/trigger/:rid", TriggerController.deleteTriggerLog);

// ScheduleQueue
router.post("/schedule", ScheduleController.createSchedule);
router.get("/schedule", ScheduleController.listAllSchedules);
// router.get("/schedule/rule/:ruleRid", ScheduleController.getSchedulesByRule);
// router.put("/schedule/:rid", ScheduleController.updateScheduleQueue);
router.put("/schedule/update", ScheduleController.updateSchedule);
router.post("/schedule/delete", ScheduleController.deleteSchedule);


//workflow
router.get("/scopeList", WorkFlowController.listScopes);
router.post("/scopeEventList", WorkFlowController.listScopeEvents);
router.post("/eventConditions", WorkFlowController.listEventConditions);
router.post("/conditionCategory", WorkFlowController.listConditionCategory);
router.post("/ruleFields", WorkFlowController.listFields);
router.post("/ruleOperators", WorkFlowController.listOperators);
router.post("/ruleValues", WorkFlowController.listValues);
router.post("/scopeActionTypes", WorkFlowController.listActionTypes);
router.post("/scopeActions", WorkFlowController.listActions);
router.post("/createRule", WorkFlowController.createRule);
router.post("/getRuleDetail", WorkFlowController.ruleDetailByRuleRid);
router.post("/getRuleMapDetail", WorkFlowController.ruleMapDetailByRuleRid);
router.post("/updateRule", WorkFlowController.updateRule);
router.post("/updateRuleStatus", WorkFlowController.updateRuleStatus);
router.post("/createRuleMap", WorkFlowController.createRuleMapWithScope);
router.post("/updateRuleMap", WorkFlowController.updateRuleMapWithScope);
router.get("/notificationTemplate/:channel",WorkFlowController.fetchNotificationTemplates)

router.post("/execute", WorkFlowController.execute);


export default router;
