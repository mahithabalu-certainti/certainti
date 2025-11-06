import { initMainDbSequelize } from "../config/mainDataSource";
import { Case } from "./caseModel";
import { CaseTeam } from "./caseTeamModel";
import { CaseProject } from "./caseProjectsModel";
import { Jurisdiction } from "./jurisdiction";
import { logMessage } from "../utils/helpers";

export const models = {
  Case,
  CaseTeam,
  CaseProject,
  Jurisdiction
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
