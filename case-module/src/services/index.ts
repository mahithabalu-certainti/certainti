import { Logger } from "winston";
import { CaseService } from "./cases/caseService";
import { ICaseManagementService, ICaseService } from "./interfaces/interface";
import { CaseManagementService } from "./casesManagement/caseManagementService";

class Services {
  private logger: Logger;
  caseService: ICaseService;
  caseManagementService: ICaseManagementService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.caseService = new CaseService(logger);
    this.caseManagementService = new CaseManagementService(logger);
  }
}

export default Services;
