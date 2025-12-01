import { Router } from "express";
import RuleController from "../controllers/workflowRuleMasterController";
import ConditionController from "../controllers/workflowConditionController";
import ActionController from "../controllers/workflowRuleActionController";
import ScopeController from "../controllers/workflowRuleScopeMapController";
import AuditController from "../controllers/workflowRuleAuditController";
import TriggerController from "../controllers/workflowRuleTriggerLogController";
import ScheduleController from "../controllers/workflowRuleScheduleQueueController";
import WorkFlowController from "../controllers/workFlowController";

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
router.post("/condition/delete", ConditionController.deleteCondition);
// router.get("/condition/group/:groupRid", ConditionController.getConditionsByGroup);

// Action
router.post("/action", ActionController.createAction);
router.get("/action", ActionController.listActions);
router.put("/action/update", ActionController.updateAction);
router.post("/action/delete", ActionController.deleteAction);

// ScopeMap
router.post("/scope", ScopeController.createRuleScope);
router.get("/scope", ScopeController.listScopes);
router.put("/scope/update", ScopeController.updateScope);
router.post("/scope/delete", ScopeController.deleteScope);

// Audit
router.post("/audit", AuditController.createAudit);
// router.get("/audit/:rid", AuditController.getAuditById);
// router.get("/audit/rule/:ruleRid", AuditController.getAuditsByRule);
// router.delete("/audit/:rid", AuditController.deleteAuditEntry);

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

//execute
router.post("/createRuleMap", WorkFlowController.createRuleMapWithScope);

// ConditionGroup
// router.post("/condition-group", ConditionGroupController.createConditionGroup);
// router.get("/condition-group/:rid", ConditionGroupController.getConditionGroupById);
// router.get("/condition-group/rule/:ruleRid", ConditionGroupController.getConditionGroupsByRule);
// router.put("/condition-group/:rid", ConditionGroupController.updateConditionGroup);
// router.delete("/condition-group/:rid", ConditionGroupController.deleteConditionGroup);


export default router;
