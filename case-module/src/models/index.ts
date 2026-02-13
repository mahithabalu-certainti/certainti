import { initMainDbSequelize } from "../config/mainDataSource";
import { Case } from "./caseModel";
import { CaseTeam } from "./caseTeamModel";
import { CaseProject } from "./caseProjectsModel";
import { CaseProjectResource } from "./caseProjectResourceModel";
import { CaseProjectTask } from "./caseProjectTaskModel";
import { CheckList } from "./checkListModel";
import { CheckListItem } from "./checkListItemModel";
import { Jurisdiction } from "./jurisdiction";
import { logMessage } from "../utils/helpers";
import { TaskCollaborators } from "./taskCollaboratorsModel";
import { TaskTag } from "./taskTagsModel";
import { TaskComments } from "./taskCommentsModel";
import { CommentsAttachments } from "./commentsAttachmentModel";
import { TaskAttachments } from "./taskAttachmentModel";
import { CaseTaskWorkflowConnector } from "./caseTaskWorkflowConnectorModel";
import { ProjectResourceFiscal } from "./projectResourceFiscal";
import { ProjectTask } from "./projectTask";
import { SignoffDetails } from "./signoffDetails";

export const models = {
  Case,
  CaseTeam,
  CaseProject,
  CheckList,
  CheckListItem,
  Jurisdiction,
  TaskCollaborators,
  TaskTag,
  TaskComments,
  CommentsAttachments,
  TaskAttachments,
  CaseTaskWorkflowConnector,
  CaseProjectResource,
  CaseProjectTask,
  ProjectResourceFiscal,
  ProjectTask,
  SignoffDetails
};

export async function initModels() {
  try {
    const sequelize = await initMainDbSequelize();

    Object.values(models).forEach((model: any) => {
      if (model.associate) {
        model.associate(models);
      }
    });
  } catch (err) {
    logMessage(`Error loading models: ${err}`);
  }
}
