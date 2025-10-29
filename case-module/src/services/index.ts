import { Logger } from "winston";
import { CaseService } from "./cases/caseService";
import { ICaseService } from "./interfaces/interface";

class Services {
  private logger: Logger;
  caseService: ICaseService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.caseService = new CaseService(logger);
  }
}

export default Services;
