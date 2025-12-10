import { Logger } from "winston";
import { CaseService } from "./cases/caseService";
import { ICaseManagementService, ICaseService, IActivityService } from "./interfaces/interface";
import { CaseManagementService } from "./casesManagement/caseManagementService";
import { JurisdictionService }  from "./jurisdiction/jurisdictionServices";
import { HistoricalSubmissionService }  from "./historicalSubmission/historicalSubmissionServices";
import { ActivityService } from "./activities/activityService";

class Services {
  private logger: Logger;
  caseService: ICaseService;
  caseManagementService: ICaseManagementService;
  jurisdictionService: JurisdictionService;
  historicalSubmissionService: HistoricalSubmissionService;
  activityService: IActivityService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.caseService = new CaseService(logger);
    this.caseManagementService = new CaseManagementService(logger);
    this.jurisdictionService = new JurisdictionService(logger);
    this.historicalSubmissionService = new HistoricalSubmissionService(logger);
    this.activityService = new ActivityService(logger);
  }
}

export default Services;
