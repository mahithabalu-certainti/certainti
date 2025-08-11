import { Sequelize } from "sequelize";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import { Interaction } from "../models/interaction";
import { InteractionItem } from "../models/interactionItem";
import { InteractionHistory } from "../models/interactionHistory";
import { InteractionTimeline } from "../models/interactionTimeline";
import { InteractionType } from "../models/interactionType";

export class InteractionModelService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

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
    }
  > = new Map();

  constructor() {}

  async getSequelize(): Promise<Sequelize> {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    return this.orgDbSequelize;
  }

  private async getMainSequelize(): Promise<Sequelize> {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  async getModels(accountNumber: string) {
    const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;

    const sequelize = await initOrgSequelize();

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

    const models = {
      Interaction: InteractionModel,
      InteractionItem: InteractionItemModel,
      InteractionHistory: InteractionHistoryModel,
      InteractionTimeline: InteractionTimelineModel,
      InteractionType: InteractionTypeModel,
    };

    this.modelCache.set(schemaName, models);
    return models;
  }
  
  async hello(){
    const { Interaction } = await this.getModels("acc");

  }
}
