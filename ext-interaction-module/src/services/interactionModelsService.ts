import { Sequelize } from "sequelize";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import { Interaction } from "../models/interaction";
import { Otp } from "../models/otp";
import { OtpHistory } from "../models/otpHistory";
import { SCHEMANAME_PREFIX } from "../utils/constants";

export class InteractionModelService {
  orgDbSequelize: Sequelize | null = null;
  mainDbSequelize: Sequelize | null = null;

  modelCache: Map<
    string,
    {
      Interaction: ReturnType<typeof Interaction.initialize>;
      Otp: ReturnType<
        typeof Otp.initialize
      >;
      OtpHistory: ReturnType<
      typeof OtpHistory.initialize
    >;
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
    const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;

    const sequelize = await initOrgSequelize();

    const InteractionModel = Interaction.initialize(sequelize, schemaName);
    
    const OtpModel = Otp.initialize(
      sequelize,
      schemaName
    );
    const OtpHistoryModel = OtpHistory.initialize(
      sequelize,
      schemaName
    )

    const models = {
      Interaction: InteractionModel,
      Otp: OtpModel,
      OtpHistory: OtpHistoryModel,
    };

    this.modelCache.set(schemaName, models);
    return models;
  }
}
