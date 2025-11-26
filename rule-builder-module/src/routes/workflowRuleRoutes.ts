import { Router } from "express";
import RuleController from "../controllers/workflowRuleMasterController";
import * as ConditionController from "../controllers/workflowConditionController";
import * as ActionController from "../controllers/workflowRuleActionController";
import * as ScopeController from "../controllers/workflowRuleScopeMapController";
import * as AuditController from "../controllers/workflowRuleAuditController";
import * as TriggerController from "../controllers/workflowRuleTriggerLogController";
import * as ScheduleController from "../controllers/workflowRuleScheduleQueueController";
import { executeWorkflow } from "../controllers/workflowController";

const router = Router();

// RuleMaster
router.post("/rule", RuleController.createRuleMaster);
router.get("/rule", RuleController.getAllRuleMasters);
// router.get("/rule/:rid", RuleController.getRuleMasterById);
// router.put("/rule/:rid", RuleController.updateRuleMaster);
// router.delete("/rule/:rid", RuleController.deleteRuleMaster);

// Condition
router.post("/condition", ConditionController.createCondition);
router.get("/condition/:rid", ConditionController.getConditionById);
router.put("/condition/:rid", ConditionController.updateCondition);
router.delete("/condition/:rid", ConditionController.deleteCondition);
// router.get("/condition/group/:groupRid", ConditionController.getConditionsByGroup);


// Action
router.post("/action", ActionController.createRuleAction);
router.get("/action/:rid", ActionController.getRuleActionById);
router.get("/action/rule/:ruleRid", ActionController.getActionsByRule);
router.put("/action/:rid", ActionController.updateRuleAction);
router.delete("/action/:rid", ActionController.deleteRuleAction);

// ScopeMap
router.post("/scope", ScopeController.createRuleScope);
router.get("/scope/:rid", ScopeController.getScopeById);
router.get("/scope/rule/:ruleRid", ScopeController.getScopesByRule);
router.put("/scope/:rid", ScopeController.updateRuleScope);
router.delete("/scope/:rid", ScopeController.deleteRuleScope);

// Audit
router.post("/audit", AuditController.createAuditEntry);
router.get("/audit/:rid", AuditController.getAuditById);
router.get("/audit/rule/:ruleRid", AuditController.getAuditsByRule);
router.delete("/audit/:rid", AuditController.deleteAuditEntry);

// TriggerLog
router.post("/trigger", TriggerController.createTriggerLog);
router.get("/trigger/:rid", TriggerController.getTriggerLogById);
router.get("/trigger/rule/:ruleRid", TriggerController.getTriggerLogsByRule);
router.delete("/trigger/:rid", TriggerController.deleteTriggerLog);

// ScheduleQueue
router.post("/schedule", ScheduleController.createScheduleQueue);
router.get("/schedule/:rid", ScheduleController.getScheduleById);
router.get("/schedule/rule/:ruleRid", ScheduleController.getSchedulesByRule);
router.put("/schedule/:rid", ScheduleController.updateScheduleQueue);
router.put("/schedule/execute/:rid", ScheduleController.markScheduleExecuted);
router.delete("/schedule/:rid", ScheduleController.deleteScheduleQueue);

//execute
router.post("/execute", executeWorkflow);

// ConditionGroup
// router.post("/condition-group", ConditionGroupController.createConditionGroup);
// router.get("/condition-group/:rid", ConditionGroupController.getConditionGroupById);
// router.get("/condition-group/rule/:ruleRid", ConditionGroupController.getConditionGroupsByRule);
// router.put("/condition-group/:rid", ConditionGroupController.updateConditionGroup);
// router.delete("/condition-group/:rid", ConditionGroupController.deleteConditionGroup);


export default router;
