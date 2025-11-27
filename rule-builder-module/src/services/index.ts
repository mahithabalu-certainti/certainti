import { Logger } from "winston";
import { IRulemasterService, IConditionService, IActionService, IScopeService } from "./interfaces/interface";
import { RulemasterService } from "../services/rulemasterService";
import { ConditionService } from "../services/workflowConditionService";
import { ActionService } from "../services/workflowActionService";
import { ScopeService } from "../services/workflowScopeMapService";

class Services {
  private logger: Logger;
  rulemasterService: IRulemasterService;
  conditionService: IConditionService;
  actionService: IActionService;
  scopeService: IScopeService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.rulemasterService = new RulemasterService(logger);
    this.conditionService = new ConditionService(logger);
    this.actionService = new ActionService(logger);
    this.scopeService = new ScopeService(logger);
  }
}

export default Services;