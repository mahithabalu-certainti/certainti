import { Router } from "express";
import RuleController from "../controllers/workflowRuleMasterController";
import ConditionController from "../controllers/workflowConditionController";
import ActionController from "../controllers/workflowRuleActionController";
import ScopeController from "../controllers/workflowRuleScopeMapController";
import TriggerController from "../controllers/workflowRuleTriggerLogController";
import ScheduleController from "../controllers/workflowRuleScheduleQueueController";
import WorkFlowController from "../controllers/workflowRulecontroller";
import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const router = Router();

// RuleMaster
router.post("/rule",checkUserStatusMiddleware("workflow_rule_create"), RuleController.createRuleMaster);
router.get("/rule",checkUserStatusMiddleware("workflow_rule_view_edit"), RuleController.getAllRuleMasters);
router.get("/rule/export",checkUserStatusMiddleware("workflow_rule_export"), RuleController.exportRuleMasters);
router.put("/rule/update",checkUserStatusMiddleware("workflow_rule_view_edit"), RuleController.updateRuleMaster);
router.post("/rule/delete",checkUserStatusMiddleware("workflow_rule_delete"), RuleController.deleteRuleMaster);

// Condition
router.post("/condition",checkUserStatusMiddleware("NA"), ConditionController.createCondition);
router.get("/condition",checkUserStatusMiddleware("NA"), ConditionController.listAllConditions);
router.put("/condition/update",checkUserStatusMiddleware("NA"), ConditionController.updateCondition);
//router.post("/condition/delete", ConditionController.deleteCondition);
// router.get("/condition/group/:groupRid", ConditionController.getConditionsByGroup);

// Action
router.post("/action",checkUserStatusMiddleware("NA"), ActionController.createAction);
router.get("/action",checkUserStatusMiddleware("NA"), ActionController.listActions);
router.put("/action/update",checkUserStatusMiddleware("NA"), ActionController.updateAction);
//router.post("/action/delete", ActionController.deleteAction);

// ScopeMap
router.post("/scope",checkUserStatusMiddleware("NA"), ScopeController.createRuleScope);
router.put("/scope/update",checkUserStatusMiddleware("NA"), ScopeController.updateScope);
router.post("/scope/delete",checkUserStatusMiddleware("NA"), ScopeController.deleteScope);

// TriggerLog
router.post("/trigger",checkUserStatusMiddleware("NA"), TriggerController.createTriggerLog);
// router.get("/trigger/:rid", TriggerController.getTriggerLogById);
// router.get("/trigger/rule/:ruleRid", TriggerController.getTriggerLogsByRule);
// router.delete("/trigger/:rid", TriggerController.deleteTriggerLog);

// ScheduleQueue
router.post("/schedule",checkUserStatusMiddleware("NA"), ScheduleController.createSchedule);
router.get("/schedule",checkUserStatusMiddleware("NA"), ScheduleController.listAllSchedules);
// router.get("/schedule/rule/:ruleRid", ScheduleController.getSchedulesByRule);
// router.put("/schedule/:rid", ScheduleController.updateScheduleQueue);
router.put("/schedule/update",checkUserStatusMiddleware("NA"), ScheduleController.updateSchedule);
router.post("/schedule/delete",checkUserStatusMiddleware("NA"), ScheduleController.deleteSchedule);

//workflow
router.get("/scopeList",  checkUserStatusMiddleware("NA"), WorkFlowController.listScopes);
router.post("/scopeEventList", checkUserStatusMiddleware("NA"), WorkFlowController.listScopeEvents);
router.post("/eventConditions", checkUserStatusMiddleware("NA"), WorkFlowController.listEventConditions);
router.post("/conditionCategory", checkUserStatusMiddleware("NA"), WorkFlowController.listConditionCategory);
router.post("/ruleFields", checkUserStatusMiddleware("NA"), WorkFlowController.listFields);
router.post("/ruleOperators", checkUserStatusMiddleware("NA"), WorkFlowController.listOperators);
router.post("/ruleValues",checkUserStatusMiddleware("NA"), WorkFlowController.listValues);
router.post("/scopeActionTypes", checkUserStatusMiddleware("NA"), WorkFlowController.listActionTypes);
router.post("/scopeActions", checkUserStatusMiddleware("NA"), WorkFlowController.listActions);
router.post("/createRule", checkUserStatusMiddleware("NA"), WorkFlowController.createRule);
router.post("/getRuleDetail", checkUserStatusMiddleware("NA"), WorkFlowController.ruleDetailByRuleRid);
router.post("/getRuleMapDetail", checkUserStatusMiddleware("NA"), WorkFlowController.ruleMapDetailByRuleRid);
router.post("/updateRule", checkUserStatusMiddleware("NA"), WorkFlowController.updateRule);
router.post("/updateRuleStatus", checkUserStatusMiddleware("workflow_rule_view_edit"), WorkFlowController.updateRuleStatus);
router.post("/createRuleMap", checkUserStatusMiddleware("workflow_rule_view_edit"), WorkFlowController.createRuleMapWithScope);
router.post("/updateRuleMap", checkUserStatusMiddleware("workflow_rule_view_edit"), WorkFlowController.updateRuleMapWithScope);
router.get("/notificationTemplate/:channel", checkUserStatusMiddleware("NA"), WorkFlowController.fetchNotificationTemplates)

router.post("/execute", checkUserStatusMiddleware("NA"), WorkFlowController.execute);


export default router;
