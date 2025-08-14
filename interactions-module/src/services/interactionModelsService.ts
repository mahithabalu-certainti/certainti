import { Sequelize } from "sequelize";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import { Interaction } from "../models/interaction";
import { InteractionItem } from "../models/interactionItem";
import { InteractionHistory } from "../models/interactionHistory";
import { InteractionTimeline } from "../models/interactionTimeline";
import { InteractionType } from "../models/interactionType";
import { MAIN_SCHEMA_NAME } from "../utils/constants";
import { InteractionSummary } from "../models/interactionSummary";
import { InteractionResponseHistory } from "../models/interactionResponseHistory";

import { Otp } from "../models/otp";
import { OtpHistory } from "../models/otpHistory";
export class InteractionModelService {
  orgDbSequelize: Sequelize | null = null;
  mainDbSequelize: Sequelize | null = null;

  modelCache: Map<
    string,
    {
      Interaction: ReturnType<typeof Interaction.initialize>;
      InteractionItem: ReturnType<typeof InteractionItem.initialize>;
      InteractionHistory: ReturnType<typeof InteractionHistory.initialize>;
      InteractionTimeline: ReturnType<
        typeof InteractionTimeline.initialize
      >;
      InteractionType: ReturnType<
        typeof InteractionType.initialize
      >;
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
    const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;

    const sequelize = await initOrgSequelize();
    const mainDbSequelize = await this.getMainSequelize();

    const InteractionModel = Interaction.initialize(sequelize, schemaName);
    const InteractionItemModel = InteractionItem.initialize(
      sequelize,
      schemaName
    );
    const InteractionHistoryModel = InteractionHistory.initialize(
      sequelize,
      schemaName
    );
    const InteractionTimelineModel = InteractionTimeline.initialize(
      sequelize,
      schemaName
    );
    const InteractionTypeModel = InteractionType.initialize(
      sequelize,
      schemaName
    );
    const InteractionSummaryModel = InteractionSummary.initialize(
      mainDbSequelize,
      ""
    );
    const InteractionResponseHistoryModel =
      InteractionResponseHistory.initialize(sequelize, schemaName);
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
      InteractionItem: InteractionItemModel,
      InteractionHistory: InteractionHistoryModel,
      InteractionResponseHistory: InteractionResponseHistoryModel,
      InteractionTimeline: InteractionTimelineModel,
      InteractionType: InteractionTypeModel,
      InteractionSummary: InteractionSummaryModel,
      Otp: OtpModel,
      OtpHistory: OtpHistoryModel
    };

    this.modelCache.set(schemaName, models);
    return models;
  }
}
