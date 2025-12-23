import { Logger } from "winston";
import { IRulemasterService, IConditionService, IActionService, IScopeService, IScheduleService, IRuleHistoryservice, ITriggerservice, IRuleMapService, IWorkFlowService } from "./interfaces/interface";
import { RulemasterService } from "../services/rulemasterService";
import { ConditionService } from "../services/workflowConditionService";
import { ActionService } from "../services/workflowActionService";
import { ScopeService } from "../services/workflowScopeMapService";
import { ScheduleService } from "../services/workflowScheduleQueueService";
import { RuleHistoryService } from "../services/workflowRuleHistoryService";
import { TriggerService } from "../services/workflowTriggerLogService";
import { RuleMapService } from "../services/workflowRuleMapService";
import { WorkFlowService } from "../services/workflowService";
import { SchedulerService } from "./schedulerRuleExecutionService";

class Services {
  private logger: Logger;
  rulemasterService: IRulemasterService;
  conditionService: IConditionService;
  actionService: IActionService;
  scopeService: IScopeService;
  scheduleService: IScheduleService;
  ruleHistoryService: IRuleHistoryservice;
  triggerService: ITriggerservice;
  ruleMapService: IRuleMapService;
  workFlowService: IWorkFlowService;
  schedulerService: SchedulerService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.rulemasterService = new RulemasterService(logger);
    this.conditionService = new ConditionService(logger);
    this.actionService = new ActionService(logger);
    this.scopeService = new ScopeService(logger);
    this.scheduleService = new ScheduleService(logger);
    this.ruleHistoryService = new RuleHistoryService(logger);
    this.triggerService = new TriggerService(logger);
    this.ruleMapService = new RuleMapService(logger);
    this.workFlowService = new WorkFlowService(logger);
    this.schedulerService = new SchedulerService(logger);
  }
}

export default Services;