import { Sequelize } from "sequelize";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import { MAIN_SCHEMA_NAME, SCHEMANAME_PREFIX } from "../utils/constants";
import { Case } from "../models/caseModel";
import { CaseSummary } from "../models/caseSummaryModel";
import { CaseProject } from "../models/caseProjectsModel";
import { CaseProjectResource } from "../models/caseProjectResourceModel";
import { CaseProjectTask } from "../models/caseProjectTaskModel";
import { CaseTimeline } from "../models/caseTimeline";
import { CaseHistory } from "../models/caseHistory";
import { CaseTeam } from "../models/caseTeamModel";
import { AdminChecklist } from "../models/adminChecklistModel";
import { AdminCheckListItem } from "../models/adminCheckListItemsModel";
import { Jurisdiction } from "../models/jurisdiction";
import { TaskTemplate } from "../models/caseTaskTemplateModel";
import { CheckList } from "../models/checkListModel";
import { CheckListItem } from "../models/checkListItemModel";
import { CaseMilestone } from "../models/caseMilestoneModel";
import { CaseTask } from "../models/caseTaskModel";
import { TaskCollaborators } from "../models/taskCollaboratorsModel";
import { Tags } from "../models/tagsModel";
import { TaskTag } from "../models/taskTagsModel";
import { CaseHistorySubmission } from "../models/caseHistorySubmissionModel";
import { EmailTemplate } from "../models/emailTemplateModel"; import { TaskComments } from "../models/taskCommentsModel";
import { CommentsAttachments } from "../models/commentsAttachmentModel";
import { TaskAttachments } from "../models/taskAttachmentModel";
import { CaseTaskWorkflowConnector } from "../models/caseTaskWorkflowConnectorModel";
import { WorkflowConnector } from "../models/workflowConnectorModel";
import { WorkflowConnectorMapping } from "../models/workflowConnectorMapModel";
import { ProjectResourceFiscal } from "../models/projectResourceFiscal";
import { ProjectTask } from "../models/projectTask";
import { CaseProjectResourceFiscal } from "../models/caseProjectResourceFiscalModel";
import { ProjectResource } from "../models/projectResource";
import { ProjectFiscal } from "../models/projectFiscal";
import { ProjectFiscalRegion } from "../models/projectFiscalRegion";
import { CaseProjectFiscalRegion } from "../models/caseProjectFiscalRegionModel";

import { Activities } from "../models/activitiesModel";
import { TaskHistory } from "../models/taskHistory";
import { ActivityAttachments } from "../models/activitiesAttachmentModel";
import { ActivityHistory } from "../models/activityHistory";
import { TaskSummary } from "../models/taskSummaryModel";
import { JurisdictionConfig } from "../models/jurisdictionConfigModel";
import { CaseKeyContactDetails } from "../models/caseKeyContactModel";
import { KeyContact } from "../models/keyContactDetails";
import { RdCreditCountryCalculations } from "../models/rdCreditCountryCalcModel";
import { RdCreditStateCalculations } from "../models/rdCreditStateCalcModel";
import { RdCreditProcess } from "../models/rdCreditProcessModel";
import { RdCreditCalculationsSummary } from "../models/rdCreditCalculationsSummaryModel";
import { MeetingSummary } from "../models/meetingSummaryModel";
import { SignoffDetails } from "../models/signoffDetails";
import { Attachment } from "../models/attachments";

export class CaseModelService {
  orgDbSequelize: Sequelize | null = null;
  mainDbSequelize: Sequelize | null = null;

  modelCache: Map<
    string,
    {
      Case: ReturnType<typeof Case.initialize>;
      CaseSummary: ReturnType<typeof CaseSummary.initialize>;
      CaseProject: ReturnType<typeof CaseProject.initialize>;
      CaseProjectResource: ReturnType<typeof CaseProjectResource.initialize>;
      CaseProjectTask: ReturnType<typeof CaseProjectTask.initialize>;
      CaseTimeline: ReturnType<typeof CaseTimeline.initialize>;
      TaskTemplate: ReturnType<typeof TaskTemplate.initialize>
      CaseMilestone: ReturnType<typeof CaseMilestone.initialise>
      CaseTask: ReturnType<typeof CaseTask.initialise>
      TaskCollaborators: ReturnType<typeof TaskCollaborators.initialise>
      TaskTag: ReturnType<typeof TaskTag.initialise>
      Tags: ReturnType<typeof Tags.initialise>
      EmailTemplate?: ReturnType<typeof EmailTemplate.initialize>
      TaskComments: ReturnType<typeof TaskComments.initialise>
      CommentsAttachments: ReturnType<typeof CommentsAttachments.initialise>
      TaskAttachments: ReturnType<typeof TaskAttachments.initialise>
      CaseHistorySubmission: ReturnType<typeof CaseHistorySubmission.initialize>;
      CaseTaskWorkflowConnector: ReturnType<typeof CaseTaskWorkflowConnector.initialize>
      WorkflowConnector: ReturnType<typeof WorkflowConnector.initialize>
      WorkflowConnectorMapping: ReturnType<typeof WorkflowConnectorMapping.initialize>
      ProjectResourceFiscal: ReturnType<typeof ProjectResourceFiscal.initialize>
      ProjectTask: ReturnType<typeof ProjectTask.initialize>
      CaseProjectResourceFiscal: ReturnType<typeof CaseProjectResourceFiscal.initialize>
      ProjectResource: ReturnType<typeof ProjectResource.initialize>
      ProjectFiscal: ReturnType<typeof ProjectFiscal.initialize>
      ProjectFiscalRegion: ReturnType<typeof ProjectFiscalRegion.initialize>
      CaseProjectFiscalRegion: ReturnType<typeof CaseProjectFiscalRegion.initialize>
      TaskHistory: ReturnType<typeof TaskHistory.initialize>;
      ActivityAttachments: ReturnType<typeof ActivityAttachments.initialise>
      ActivityHistory: ReturnType<typeof ActivityHistory.initialize>;
      TaskSummary: ReturnType<typeof TaskSummary.initialize>;
      Jurisdiction: ReturnType<typeof Jurisdiction.initialize>;
      CaseKeyContactDetails: ReturnType<typeof CaseKeyContactDetails.initialize>;
      KeyContact: ReturnType<typeof KeyContact.initialize>;
      RdCreditCalculationsSummary: ReturnType<typeof RdCreditCalculationsSummary.initialize>;
      MeetingSummary: ReturnType<typeof MeetingSummary.initialize>;
      SignoffDetails : ReturnType<typeof SignoffDetails.initialize>;
      Attachment : ReturnType<typeof Attachment.initialize>;
    }
  > = new Map();

  constructor() { }

  async getSequelize(): Promise<Sequelize> {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    return this.orgDbSequelize;
  }

  async getMainSequelize(): Promise<Sequelize> {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  async getModels(accountNumber: string) {
    const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const sequelize = await initOrgSequelize();
    const mainDbSequelize = await this.getMainSequelize();
    const CaseModel = Case.initialize(sequelize, schemaName);
    const CaseSummaryModel = CaseSummary.initialize(mainDbSequelize, "");
    const CaseProjectModel = CaseProject.initialize(sequelize, schemaName);
    const CaseProjectResourceModel = CaseProjectResource.initialize(sequelize, schemaName);
    const CaseProjectTaskModel = CaseProjectTask.initialize(sequelize, schemaName);
    const CaseTimelineModel = CaseTimeline.initialize(sequelize, schemaName);
    const CaseHistoryModel = CaseHistory.initialize(sequelize, schemaName);
    const CaseTeamModel = CaseTeam.initialize(sequelize, schemaName);
    const JurisdictionModel = Jurisdiction.initialize(sequelize, schemaName);
    const AdminChecklistModel = AdminChecklist.initialize(mainDbSequelize, "");
    const AdminCheckListItemModel = AdminCheckListItem.initialize(mainDbSequelize, "");
    const TaskTemplateModel = TaskTemplate.initialize(mainDbSequelize, "");
    const CheckListModel = CheckList.initialize(sequelize, schemaName);
    const CheckListItemModel = CheckListItem.initialize(sequelize, schemaName);
    const CaseMilestoneModel = CaseMilestone.initialise(sequelize, schemaName);
    const CaseTaskModel = CaseTask.initialise(sequelize, schemaName)
    const TaskCollaboratorsModel = TaskCollaborators.initialise(sequelize, schemaName)
    const TaskTagModel = TaskTag.initialise(sequelize, schemaName)
    const TagsModel = Tags.initialise(mainDbSequelize, "")
    const EmailTemplateModel = EmailTemplate.initialize(mainDbSequelize, MAIN_SCHEMA_NAME);
    const TaskCommentsModel = TaskComments.initialise(sequelize, schemaName)
    const CommentsAttachmentsModel = CommentsAttachments.initialise(sequelize, schemaName)
    const TaskAttachmentsModel = TaskAttachments.initialise(sequelize, schemaName)
    const CaseHistorySubmissionModel = CaseHistorySubmission.initialize(sequelize, schemaName);
    const CaseTaskWorkflowConnectorModel = CaseTaskWorkflowConnector.initialize(sequelize, schemaName)
    const WorkflowConnectorModel = WorkflowConnector.initialize(mainDbSequelize, MAIN_SCHEMA_NAME);
    const ProjectResourceFiscalModel = ProjectResourceFiscal.initialize(sequelize, schemaName);
    const ProjectTaskModel = ProjectTask.initialize(sequelize, schemaName);
    const CaseProjectResourceFiscalModel = CaseProjectResourceFiscal.initialize(sequelize, schemaName);
    const ProjectResourceModel = ProjectResource.initialize(sequelize, schemaName);
    const ProjectFiscalModel = ProjectFiscal.initialize(sequelize, schemaName);
    const ProjectFiscalRegionModel = ProjectFiscalRegion.initialize(sequelize, schemaName);
    const CaseProjectFiscalRegionModel = CaseProjectFiscalRegion.initialize(sequelize, schemaName);
    const WorkflowConnectorMappingModel = WorkflowConnectorMapping.initialize(mainDbSequelize, MAIN_SCHEMA_NAME)
    const ActivitiesModel = Activities.initialize(sequelize, schemaName);
    const TaskHistoryModel = TaskHistory.initialize(sequelize, schemaName);
    const ActivityAttachmentsModel = ActivityAttachments.initialise(sequelize, schemaName);
    const ActivityHistoryModel = ActivityHistory.initialize(sequelize, schemaName);
    const TaskSummaryModel = TaskSummary.initialize(mainDbSequelize, "");
    const JurisdictionConfigModel = JurisdictionConfig.initialize(mainDbSequelize, "");
    const CaseKeyContactDetailsModel = CaseKeyContactDetails.initialize(sequelize, schemaName);
    const KeyContactModel = KeyContact.initialize(sequelize, schemaName);
    const RdCreditCountryCalculationsModel = RdCreditCountryCalculations.initialize(sequelize, schemaName);
    const RdCreditStateCalculationsModel = RdCreditStateCalculations.initialize(sequelize, schemaName);
    const RdCreditProcessModel = RdCreditProcess.initialize(sequelize, schemaName);
    const RdCreditCalculationsSummaryModel = RdCreditCalculationsSummary.initialize(mainDbSequelize, "");
    const MeetingSummaryModel = MeetingSummary.initialize(mainDbSequelize, "");
    const SignoffDetailsModel = SignoffDetails.initialize(sequelize, schemaName);
    const AttachmentModel = Attachment.initialize(sequelize, schemaName);

    CaseProjectModel.belongsTo(ProjectFiscalModel, {
      foreignKey: "project_fiscal_rid",
      targetKey: "rid",
      as: "case_project_project_fiscal",
    });

    const models = {
      Case: CaseModel,
      CaseSummary: CaseSummaryModel,
      CaseProject: CaseProjectModel,
      CaseProjectResource: CaseProjectResourceModel,
      CaseProjectTask: CaseProjectTaskModel,
      CaseTimeline: CaseTimelineModel,
      CaseHistory: CaseHistoryModel,
      CaseTeam: CaseTeamModel,
      AdminChecklist: AdminChecklistModel,
      AdminCheckListItem: AdminCheckListItemModel,
      TaskTemplate: TaskTemplateModel,
      CheckList: CheckListModel,
      CheckListItem: CheckListItemModel,
      Jurisdiction: JurisdictionModel,
      CaseMilestone: CaseMilestoneModel,
      CaseTask: CaseTaskModel,
      TaskCollaborators: TaskCollaboratorsModel,
      TaskTag: TaskTagModel,
      Tags: TagsModel,
      EmailTemplate: EmailTemplateModel,
      TaskComments: TaskCommentsModel,
      CommentsAttachments: CommentsAttachmentsModel,
      TaskAttachments: TaskAttachmentsModel,
      CaseHistorySubmission: CaseHistorySubmissionModel,
      Activities: ActivitiesModel,
      TaskHistory: TaskHistoryModel,
      RdCreditCountryCalculationsModel: RdCreditCountryCalculationsModel,
      CaseTaskWorkflowConnector: CaseTaskWorkflowConnectorModel,
      WorkflowConnector: WorkflowConnectorModel,
      WorkflowConnectorMapping: WorkflowConnectorMappingModel,
      ProjectResourceFiscal: ProjectResourceFiscalModel,
      ProjectTask: ProjectTaskModel,
      CaseProjectResourceFiscal: CaseProjectResourceFiscalModel,
      ProjectResource: ProjectResourceModel,
      ProjectFiscal: ProjectFiscalModel,
      ProjectFiscalRegion: ProjectFiscalRegionModel,
      CaseProjectFiscalRegion: CaseProjectFiscalRegionModel,
      ActivityAttachments: ActivityAttachmentsModel,
      ActivityHistory: ActivityHistoryModel,
      TaskSummary: TaskSummaryModel,
      JurisdictionConfig: JurisdictionConfigModel,
      CaseKeyContactDetails: CaseKeyContactDetailsModel,
      KeyContact: KeyContactModel,
      RdCreditCountryCalculations: RdCreditCountryCalculationsModel,
      RdCreditStateCalculations: RdCreditStateCalculationsModel,
      RdCreditProcess: RdCreditProcessModel,
      RdCreditCalculationsSummary: RdCreditCalculationsSummaryModel,
      MeetingSummary: MeetingSummaryModel,
      SignoffDetails : SignoffDetailsModel,
      Attachment : AttachmentModel
    };

    this.modelCache.set(schemaName, models);
    return models;
  }
}
