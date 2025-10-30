import { Sequelize } from "sequelize";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import { SCHEMANAME_PREFIX } from "../utils/constants";
import { Case } from "../models/caseModel";
import { CaseSummary } from "../models/caseSummaryModel";
import { CaseProject } from "../models/caseProjectsModel";

export class CaseModelService {
  orgDbSequelize: Sequelize | null = null;
  mainDbSequelize: Sequelize | null = null;

  modelCache: Map<
    string,
    {
      Case: ReturnType<typeof Case.initialize>;
      CaseSummary: ReturnType<typeof CaseSummary.initialize>;
      CaseProject : ReturnType<typeof CaseProject.initialize>
    }
  > = new Map();

  constructor() {}

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
    const CaseSummaryModel = CaseSummary.initialize(
      mainDbSequelize,
      ""
    );
    const CaseProjectModel = CaseProject.initialize(sequelize, schemaName) 

    const models = {
      Case: CaseModel,
      CaseSummary: CaseSummaryModel,
      CaseProject: CaseProjectModel
    };

    this.modelCache.set(schemaName, models);
    return models;
  }
}
