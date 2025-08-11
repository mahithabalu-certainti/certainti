import { Sequelize, DataTypes, Op, QueryTypes } from "sequelize";
import { initMainDbSequelize } from "../config/mainDataSource";
import { initOrgSequelize } from "../config/orgDataSource";
import { MAIN_SCHEMA_NAME } from "../utils/constants";
import { Interaction } from "../models/interaction";
import { InteractionItem } from "../models/interactionItem";
import { InteractionHistory } from "../models/interactionHistory";
import { InteractionTimeline } from "../models/interactionTimeline";
import { InteractionType } from "../models/interactionType";

class SchemaService {
  constructor() {}

  /**
   * Checks if the schema for a given account number exists.
   */
  async checkIfSchemaExists(accountNumber: string) {
    try {
      const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();
      const result = await sequelize.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = :schemaName`,
        {
          replacements: { schemaName },
          type: "SELECT",
        }
      );
      return (result as any[]).length !== 0;
    } catch (err) {
      throw new Error("Error checking schema :" + (err as Error).message);
    }
  }

  /**
   * Creates the interaction-related tables for a given account schema.
   */
  async createInteractionTables(accountNumber: string) {
    try {
      const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();

      const InteractionModel = Interaction.initialize(sequelize, schemaName);
      const InteractionItemModel = InteractionItem.initialize(sequelize, schemaName);
      const InteractionHistoryModel = InteractionHistory.initialize(sequelize, schemaName);
      const InteractionTimelineModel = InteractionTimeline.initialize(sequelize, schemaName);
      const InteractionTypeModel = InteractionType.initialize(sequelize, schemaName);

      // Add associations if needed
      // Example: InteractionModel.hasMany(InteractionItemModel, { foreignKey: 'interaction_rid', as: 'items' });

      await InteractionModel.sync({ force: false });
      await InteractionItemModel.sync({ force: false });
      await InteractionHistoryModel.sync({ force: false });
      await InteractionTimelineModel.sync({ force: false });
      await InteractionTypeModel.sync({ force: false });
    } catch (err) {
      throw new Error("Error creating interaction tables: " + (err as Error).message);
    }
  }

  /**
   * Checks if an interaction exists by ID in a given schema.
   */
  async checkIfInteractionExists(accountNumber: string, interactionId: string): Promise<boolean> {
    try {
      const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();
      const InteractionModel = Interaction.initialize(sequelize, schemaName);
      const interaction = await InteractionModel.findOne({
        where: { rid: interactionId },
      });
      return interaction !== null;
    } catch (err) {
      throw new Error("Error checking interaction existence: " + (err as Error).message);
    }
  }

  /**
   * Fetches a single interaction by ID.
   */
  async fetchInteractionById(accountNumber: string, interactionId: string) {
    try {
      const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();
      const InteractionModel = Interaction.initialize(sequelize, schemaName);
      return await InteractionModel.findOne({ where: { rid: interactionId } });
    } catch (err) {
      throw new Error("Error fetching interaction: " + (err as Error).message);
    }
  }

  /**
   * Fetches a list of interactions for an account.
   */
  async fetchInteractions(accountNumber: string, whereClause: Record<string, any> = {}, limit = 25, offset = 0) {
    try {
      const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();
      const InteractionModel = Interaction.initialize(sequelize, schemaName);
      return await InteractionModel.findAll({
        where: whereClause,
        limit,
        offset,
        order: [["created_datetime", "DESC"]],
      });
    } catch (err) {
      throw new Error("Error fetching interactions: " + (err as Error).message);
    }
  }

  /**
   * Fetches interaction items for a given interaction.
   */
  async fetchInteractionItems(accountNumber: string, interactionRid: string) {
    try {
      const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();
      const InteractionItemModel = InteractionItem.initialize(sequelize, schemaName);
      return await InteractionItemModel.findAll({ where: { interaction_rid: interactionRid } });
    } catch (err) {
      throw new Error("Error fetching interaction items: " + (err as Error).message);
    }
  }

  /**
   * Fetches interaction history for a given interaction.
   */
  async fetchInteractionHistory(accountNumber: string, interactionRid: string) {
    try {
      const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();
      const InteractionHistoryModel = InteractionHistory.initialize(sequelize, schemaName);
      return await InteractionHistoryModel.findAll({ where: { resource_rid: interactionRid } });
    } catch (err) {
      throw new Error("Error fetching interaction history: " + (err as Error).message);
    }
  }

  /**
   * Fetches interaction timeline for a given interaction.
   */
  async fetchInteractionTimeline(accountNumber: string, entityRid: string) {
    try {
      const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();
      const InteractionTimelineModel = InteractionTimeline.initialize(sequelize, schemaName);
      return await InteractionTimelineModel.findAll({ where: { entity_rid: entityRid } });
    } catch (err) {
      throw new Error("Error fetching interaction timeline: " + (err as Error).message);
    }
  }
}

export default SchemaService;
