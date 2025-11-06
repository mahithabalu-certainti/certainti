import { initMainDbSequelize } from "../config/mainDataSource";
import { Case } from "./caseModel";
import { CaseTeam } from "./caseTeamModel";
import { CaseProject } from "./caseProjectsModel";
import { CheckList } from "./checkListModel";
import { CheckListItem } from "./checkListItemModel";
import { logMessage } from "../utils/helpers";

export const models = {
  Case,
  CaseTeam,
  CaseProject,
  CheckList,
  CheckListItem,
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
