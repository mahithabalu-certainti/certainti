import { Logger } from "winston";
import { CaseService } from "./cases/caseService";
import { ICaseManagementService, ICaseService } from "./interfaces/interface";
import { CaseManagementService } from "./casesManagement/caseManagementService";
import { JurisdictionService }  from "./jurisdiction/jurisdictionServices";

class Services {
  private logger: Logger;
  caseService: ICaseService;
  caseManagementService: ICaseManagementService;
  jurisdictionService: JurisdictionService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.caseService = new CaseService(logger);
    this.caseManagementService = new CaseManagementService(logger);
    this.jurisdictionService = new JurisdictionService(logger);
  }
}

export default Services;
