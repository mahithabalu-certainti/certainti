import { Logger } from "winston";
import { IRulemasterService, IConditionService, IActionService, IScopeService, IScheduleService, IAuditservice, ITriggerservice } from "./interfaces/interface";
import { RulemasterService } from "../services/rulemasterService";
import { ConditionService } from "../services/workflowConditionService";
import { ActionService } from "../services/workflowActionService";
import { ScopeService } from "../services/workflowScopeMapService";
import { ScheduleService } from "../services/workflowScheduleQueueService";
import { AuditService } from "../services/workflowAuditService";
import { TriggerService } from "../services/workflowTriggerLogService";

class Services {
  private logger: Logger;
  rulemasterService: IRulemasterService;
  conditionService: IConditionService;
  actionService: IActionService;
  scopeService: IScopeService;
  scheduleService: IScheduleService;
  auditService: IAuditservice;
  triggerService: ITriggerservice;

  constructor(logger: Logger) {
    this.logger = logger;
    this.rulemasterService = new RulemasterService(logger);
    this.conditionService = new ConditionService(logger);
    this.actionService = new ActionService(logger);
    this.scopeService = new ScopeService(logger);
    this.scheduleService = new ScheduleService(logger);
    this.auditService = new AuditService(logger);
    this.triggerService = new TriggerService(logger);
  }
}

export default Services;