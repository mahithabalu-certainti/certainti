import { Logger } from "winston";
import { CaseService } from "./cases/caseService";
import { ICaseManagementService, ICaseService, IActivityService, IChildCaseService } from "./interfaces/interface";
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
import { ChildCaseService } from "./cases/childCaseService";
import { CaseTaskService } from "./cases/caseTask/caseTaskService";
import { ChecklistService } from "./cases/caseChecklist/checklistService";
import { RdFormMapperService } from "./rdFormMapper/rdFormMapperService";

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
  stateComputationService: StateComputationService;
  federalComputationService: FederalComputationService;
  computationService: ComputationService;
  caseTaskService : CaseTaskService
  checklistService : ChecklistService
  rdFormMapperService : RdFormMapperService

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
    this.stateComputationService = new StateComputationService();
    this.federalComputationService = new FederalComputationService();
    this.computationService = new ComputationService();
    this.caseTaskService = new CaseTaskService()
    this.checklistService = new ChecklistService()
    this.rdFormMapperService = new RdFormMapperService(logger);
  }
}

export default Services;
