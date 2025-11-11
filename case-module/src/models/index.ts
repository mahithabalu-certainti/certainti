import { initMainDbSequelize } from "../config/mainDataSource";
import { Case } from "./caseModel";
import { CaseTeam } from "./caseTeamModel";
import { CaseProject } from "./caseProjectsModel";
import { CheckList } from "./checkListModel";
import { CheckListItem } from "./checkListItemModel";
import { Jurisdiction } from "./jurisdiction";
import { logMessage } from "../utils/helpers";
import { TaskCollaborators } from "./taskCollaboratorsModel";
import { TaskTag } from "./TaskTagsModel";

export const models = {
  Case,
  CaseTeam,
  CaseProject,
  CheckList,
  CheckListItem,
  Jurisdiction,
  TaskCollaborators,
  TaskTag
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
