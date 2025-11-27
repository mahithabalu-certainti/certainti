import { Logger } from "winston";
import { IRulemasterService, IConditionService } from "./interfaces/interface";
import { RulemasterService } from "../services/rulemasterService";
import { ConditionService } from "../services/workflowConditionService";
class Services {
  private logger: Logger;
  rulemasterService: IRulemasterService;
  conditionService: IConditionService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.rulemasterService = new RulemasterService(logger);
    this.conditionService = new ConditionService(logger);

  }
}

export default Services;