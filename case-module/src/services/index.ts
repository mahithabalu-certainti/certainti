import { Logger } from "winston";
import { CaseService } from "./cases/caseService";
import { ICaseManagementService, ICaseService, IActivityService } from "./interfaces/interface";
import { CaseManagementService } from "./casesManagement/caseManagementService";
import { JurisdictionService }  from "./jurisdiction/jurisdictionServices";
import { HistoricalSubmissionService }  from "./historicalSubmission/historicalSubmissionServices";
import { ActivityService } from "./activities/activityService";
import { ProjectResourceService } from "./projectResource/projectResourceService";
import { ProjectInjestionTaskService } from "./projectTask/projectTaskService";
import { ProjectService } from "./project/projectService";
import { StateComputationService } from "../services/rdComputation/state.computation.service";
import { FederalComputationService } from "../services/rdComputation/federal.computation.service";
import { ComputationService } from "./rdComputation/computation.service";


class Services {
  private logger: Logger;
  caseService: ICaseService;
  caseManagementService: ICaseManagementService;
  jurisdictionService: JurisdictionService;
  historicalSubmissionService: HistoricalSubmissionService;
  projectResourceService: ProjectResourceService;
  projectTaskInjestionServices: ProjectInjestionTaskService;
  activityService: IActivityService;
  projectService: ProjectService
  stateComputationService: StateComputationService;
  federalComputationService: FederalComputationService;
  computationService: ComputationService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.caseService = new CaseService(logger);
    this.caseManagementService = new CaseManagementService(logger);
    this.jurisdictionService = new JurisdictionService(logger);
    this.historicalSubmissionService = new HistoricalSubmissionService(logger);
    this.projectResourceService = new ProjectResourceService(logger);
    this.projectTaskInjestionServices = new ProjectInjestionTaskService();
    this.activityService = new ActivityService(logger);
    this.projectService = new ProjectService(logger)
    this.stateComputationService = new StateComputationService();
    this.federalComputationService = new FederalComputationService();
    this.computationService = new ComputationService();
  }
}

export default Services;
