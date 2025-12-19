import { Logger } from "winston";
import { CaseService } from "./cases/caseService";
import { ICaseManagementService, ICaseService, IActivityService, IChildCaseService } from "./interfaces/interface";
import { CaseManagementService } from "./casesManagement/caseManagementService";
import { JurisdictionService } from "./jurisdiction/jurisdictionServices";
import { HistoricalSubmissionService } from "./historicalSubmission/historicalSubmissionServices";
import { ProjectResourceService } from "./projectResource/projectResourceService";
import { ProjectInjestionTaskService } from "./projectTask/projectTaskService";
import { ActivityService } from "./activities/activityService";
import { ProjectService } from "./project/projectService";
import { ChildCaseService } from "./cases/childCaseService";

class Services {
  private logger: Logger;
  caseService: IChildCaseService;
  caseManagementService: ICaseManagementService;
  jurisdictionService: JurisdictionService;
  historicalSubmissionService: HistoricalSubmissionService;
  projectResourceService: ProjectResourceService;
  projectTaskInjestionServices: ProjectInjestionTaskService;
  activityService: IActivityService;
  projectService: ProjectService

  constructor(logger: Logger) {
    this.logger = logger;
    this.caseService = new ChildCaseService(logger);
    this.caseManagementService = new CaseManagementService(logger);
    this.jurisdictionService = new JurisdictionService(logger);
    this.historicalSubmissionService = new HistoricalSubmissionService(logger);
    this.projectResourceService = new ProjectResourceService(logger);
    this.projectTaskInjestionServices = new ProjectInjestionTaskService();
    this.activityService = new ActivityService(logger);
    this.projectService = new ProjectService(logger)
  }
}

export default Services;
