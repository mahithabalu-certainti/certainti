import { Logger } from "winston";
import { IRulemasterService } from "./interfaces/rulemasterInterface";
import { RulemasterService } from "../services/rulemasterService";
class Services {
  private logger: Logger;
  rulemasterService: IRulemasterService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.rulemasterService = new RulemasterService(logger);
  }
}

export default Services;