import { InteractionModelService } from "../interactionModelsService";

class SchemaService {
  private interactionModelService: InteractionModelService;

  constructor() {
    this.interactionModelService = new InteractionModelService();
  }

  /**
   * Checks if the schema for a given account number exists.
   */
  async checkIfSchemaExists(accountNumber: string) {
    try {
      const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await this.interactionModelService.getSequelize();
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
      const {
        Interaction,
        InteractionItem,
        InteractionHistory,
        InteractionTimeline,
        InteractionType,
      } = await this.interactionModelService.getModels(accountNumber);

      await Interaction.sync({ force: false });
      await InteractionItem.sync({ force: false });
      await InteractionHistory.sync({ force: false });
      await InteractionTimeline.sync({ force: false });
      await InteractionType.sync({ force: false });
    } catch (err) {
      throw new Error(
        "Error creating interaction tables: " + (err as Error).message
      );
    }
  }

  /**
   * Checks if an interaction exists by ID in a given schema.
   */
  async checkIfInteractionExists(
    accountNumber: string,
    interactionId: string
  ): Promise<boolean> {
    try {
      const { Interaction } = await this.interactionModelService.getModels(
        accountNumber
      );

      const interaction = await Interaction.findOne({
        where: { rid: interactionId },
      });
      return interaction !== null;
    } catch (err) {
      throw new Error(
        "Error checking interaction existence: " + (err as Error).message
      );
    }
  }

  /**
   * Fetches a single interaction by ID.
   */
  async fetchInteractionById(accountNumber: string, interactionId: string) {
    try {
      const { Interaction } = await this.interactionModelService.getModels(
        accountNumber
      );
      return await Interaction.findOne({ where: { rid: interactionId } });
    } catch (err) {
      throw new Error("Error fetching interaction: " + (err as Error).message);
    }
  }

  /**
   * Fetches a list of interactions for an account.
   */
  async fetchInteractions(
    accountNumber: string,
    whereClause: Record<string, any> = {},
    limit = 25,
    offset = 0
  ) {
    try {
      const { Interaction } = await this.interactionModelService.getModels(
        accountNumber
      );
      return await Interaction.findAll({
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
      const { InteractionItem } = await this.interactionModelService.getModels(
        accountNumber
      );
      return await InteractionItem.findAll({
        where: { interaction_rid: interactionRid },
      });
    } catch (err) {
      throw new Error(
        "Error fetching interaction items: " + (err as Error).message
      );
    }
  }

  /**
   * Fetches interaction history for a given interaction.
   */
  async fetchInteractionHistory(accountNumber: string, interactionRid: string) {
    try {
      const { InteractionHistory } =
        await this.interactionModelService.getModels(accountNumber);
      return await InteractionHistory.findAll({
        where: { resource_rid: interactionRid },
      });
    } catch (err) {
      throw new Error(
        "Error fetching interaction history: " + (err as Error).message
      );
    }
  }

  /**
   * Fetches interaction timeline for a given interaction.
   */
  async fetchInteractionTimeline(accountNumber: string, entityRid: string) {
    try {
      const { InteractionTimeline } =
        await this.interactionModelService.getModels(accountNumber);
      return await InteractionTimeline.findAll({
        where: { entity_rid: entityRid },
      });
    } catch (err) {
      throw new Error(
        "Error fetching interaction timeline: " + (err as Error).message
      );
    }
  }
}

export default SchemaService;
