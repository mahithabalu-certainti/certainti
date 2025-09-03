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
import { InteractionAttachment } from "../models/interactionAttachment";
import { AiTechnicalSummary } from "../models/aiTechnicalSummary";
import { AiAssessmentError } from "../models/aiAssessmentError";
import { AiAssessmentQre } from "../models/aiAssessmentQre";
import { AiAssessmentAudit } from "../models/aiAssessmentAudit";

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
    const AiTechnicalSummaryModel = AiTechnicalSummary.initialize(sequelize, schemaName);
    const AiAssessmentErrorResponseModel = AiAssessmentError.initialize(sequelize, schemaName);
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

    const InteractionAttachmentModel = InteractionAttachment.initialize(
      sequelize,
      schemaName
    );
    const AiAssessmentQreModel   = AiAssessmentQre.initialize(
      sequelize,
      schemaName
    );
    const AiAssessmentAuditModel = AiAssessmentAudit.initialize(
      sequelize,
      schemaName
    );

    const models = {
      Interaction: InteractionModel,
      InteractionItem: InteractionItemModel,
      InteractionHistory: InteractionHistoryModel,
      InteractionResponseHistory: InteractionResponseHistoryModel,
      InteractionTimeline: InteractionTimelineModel,
      InteractionType: InteractionTypeModel,
      InteractionSummary: InteractionSummaryModel,
      InteractionAttachment: InteractionAttachmentModel,
      AiTechnicalSummary: AiTechnicalSummaryModel,
      AiAssessmentAudit: AiAssessmentAuditModel,
      AiAssessmentError: AiAssessmentErrorResponseModel,
      AiAssessmentQre: AiAssessmentQreModel,
    };

    this.modelCache.set(schemaName, models);
    return models;
  }
}
