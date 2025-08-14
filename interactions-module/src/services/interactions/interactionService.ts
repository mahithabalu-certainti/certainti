import { Logger } from "winston";
import {
  HttpStatus,
  interactionSource,
  statusAction,
} from "../../utils/constants";
import {
  ICreateInteraction,
  InteractionResponse,
  IUpdateInteraction,
} from "../../utils/types";
import InteractionSchemaService from "./schemaService";
import { InteractionModelService } from "../interactionModelsService";

// Assuming there is an interface named IInteractionService to implement
export class InteractionService {
  private interactionSchemaService: InteractionSchemaService;
  private interactionModelService: InteractionModelService; // Assuming this is defined somewhere in your code
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.interactionSchemaService = new InteractionSchemaService();
    this.interactionModelService = new InteractionModelService(); // Initialize your model service here
  }

  async createInteraction(
    interactionData: ICreateInteraction,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }> {
    const dbInit = await this.interactionModelService.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      interactionData.created_by = userId;
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          interactionData.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const { interactionStatus, intSource } =
        await this.getInteractionStatusAndSource(interactionData.status_action);
      interactionData.interaction_status_rid = interactionStatus || "";
      interactionData.interaction_source_rid = intSource || "";

      const interaction =
        await this.interactionSchemaService.createInteractions(
          accountNumber,
          interactionData,
          transaction
        );
      if (interaction) {
        await this.interactionSchemaService.addInteractionItems(
          accountNumber,
          interactionData,
          interaction.rid,
          transaction,
          userId
        );
        console.log("Interaction created successfully", interaction.rid);
        await this.interactionSchemaService.addInteractionSummary(
          accountNumber,
          interactionData,
          interaction.rid,
          interaction.get("r_number") || ""
        );
        await this.interactionSchemaService.addInteractionTimeline(
          accountNumber,
          "create",
          interactionData,
          interaction.rid,
          userId,
          transaction
        );
      }
      await transaction.commit();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactions: interaction,
        },
      };
    } catch (err) {
      await transaction.rollback();
      console.log("Error creatng resource", err);
      throw this.throwServiceError(err as Error);
    }
  }
  async getInteractionStatusAndSource(status_action: string) {
    const status = statusAction[status_action as keyof typeof statusAction];
    if (!status) {
      throw new Error("Invalid status_action value");
    }
    const [interactionStatus, intSource] = await Promise.all([
      this.interactionSchemaService.getInteractionStatusByType(status),
      this.interactionSchemaService.getInteractionSourceByType(
        interactionSource.MANUAL
      ),
    ]);
    return { interactionStatus, intSource };
  }

  async updateInteraction(
    interactionData: IUpdateInteraction,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }> {
    const dbInit = await this.interactionModelService.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          interactionData?.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const existingInteractionData =
        await this.interactionSchemaService.fetchInteractionById(
          accountNumber,
          interactionData.interaction_rid
        );
      const { interactionStatus, intSource } =
        await this.getInteractionStatusAndSource(interactionData.status_action);
      interactionData.interaction_status_rid = interactionStatus || "";
      interactionData.interaction_source_rid = intSource || "";
      const updatedInteraction =
        await this.interactionSchemaService.updateInteraction(
          accountNumber,
          interactionData,
          userId,
          transaction
        );
      if (updatedInteraction) {
        await this.interactionSchemaService.addInteractionItems(
          accountNumber,
          interactionData,
          interactionData.interaction_rid,
          transaction,
          userId
        );
        await this.interactionSchemaService.addInteractionTimeline(
          accountNumber,
          "update",
          interactionData,
          interactionData.interaction_rid,
          userId,
          transaction
        );

        // await this.interactionSchemaService.addInteractionHistory(
        //   accountNumber,
        //   interactionData,
        //   existingInteractionData,
        //   interactionData.interaction_rid,
        //   userId,
        //   transaction
        // );
      }

      await transaction.commit();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactions: null,
        },
      };
    } catch (err) {
      await transaction.rollback();
      console.log("Error creatng resource", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async updateInteractionResponse(
    interactionData: InteractionResponse,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }> {
    const dbInit = await this.interactionModelService.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          interactionData?.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const updatedInteractionResponse =
        await this.interactionSchemaService.updateInteractionResponse(
          accountNumber,
          interactionData,
          userId,
          transaction
        );
      await transaction.commit();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactions: updatedInteractionResponse,
        },
      };
    } catch (err) {
      await transaction.rollback();
      console.log("Error creatng resource", err);
      throw this.throwServiceError(err as Error);
    }
  }
  async getInteractionDetailsById(
    interactionRid: string,
    accountRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionDetails: any };
  }> {
    try {
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          accountRid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const interactionDetails =
        await this.interactionSchemaService.fetchInteractionDetailsById(
          accountNumber,
          interactionRid
        );

      if (!interactionDetails) {
        throw new Error("Invalid interaction ID");
      } else {
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactionDetails,
        },
      };
    } catch (err) {
      console.log("Error creatng resource", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async getInteractionQuestionsById(
    interactionRid: string,
    accountRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionQuestions: any };
  }> {
    try {
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          accountRid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const interactionQuestions =
        await this.interactionSchemaService.fetchInteractionQuestionsById(
          accountNumber,
          interactionRid
        );

      if (!interactionQuestions) {
        throw new Error("Invalid interaction ID");
      } else {
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactionQuestions,
        },
      };
    } catch (err) {
      console.log("Error creatng resource", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async getInteractionStatus(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionStatus: any };
  }> {
    try {
      const interactionStatus =
        await this.interactionSchemaService.getInteractionStatus();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactionStatus,
        },
      };
    } catch (err) {
      throw this.throwServiceError(err as Error);
    }
  }

  async getInteractionTypes(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionTypes: any };
  }> {
    try {
      const interactionTypes =
        await this.interactionSchemaService.getInteractionTypes();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactionTypes,
        },
      };
    } catch (err) {
      throw this.throwServiceError(err as Error);
    }
  }

  async getInteractionSource(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionSource: any };
  }> {
    try {
      const interactionSource =
        await this.interactionSchemaService.getInteractionSource();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactionSource,
        },
      };
    } catch (err) {
      throw this.throwServiceError(err as Error);
    }
  }
  /**
   * Formats an error response to be returned from service methods.
   *
   * @param {Error} err - The caught error.
   * @returns {object} - Standardized error response object.
   */
  throwServiceError(err: Error): {
    statusCode: number;
    message: string;
    errorMessage: string;
  } {
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }
}
