import {
  ICreateInteraction,
  InteractionResponse,
  IUpdateInteraction,
} from "../../utils/types";

export interface IInteractionService {
  processKafkaMessage(data: any): Promise<void>;
  listInteractionPrjAccount(data: any): Promise<any>;
  fetchInteractionSummary(
    data: any
  ): Promise<{ statusCodeValue: string; data: any }>;
  listInteractionResponseHistory(
    data: any
  ): Promise<{ statusCodeValue: string; data: any }>;
  createInteraction(
    interactionData: ICreateInteraction,
    interactionSource: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }>;
  updateInteraction(
    interactionData: IUpdateInteraction,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }>;
  updateInteractionResponse(
    interactionData: InteractionResponse,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }>;

  getInteractionStatus(
    statusScope?: string,
    currentStatus?: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionStatus: any };
  }>;
  getInteractionTypes(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionTypes: any };
  }>;
  getInteractionSource(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionSource: any };
  }>;
  getResponseSource(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { responseSource: any };
  }>;
  getInteractionDetailsById(
    interactionRid: string,
    accountId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionDetails: any };
  }>;
  getInteractionQuestionsById(
    interactionRid: string,
    accountId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionQuestions: any };
  }>;
  sendInteraction(
    interactions: {
      interaction_rid: string;
      project_fiscal_rid: string;
      email_info: {
        email: string;
        name: string | null;
      };
    }[],
    accountId: string,
    userId: string,
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionResponse: any };
  }>;
  fetchInteractionHistory(data: any): Promise<{
    statusCodeValue: string;
    data: any;
  }>;
  listInteractionAttachments(data: any): Promise<{
    statusCodeValue: string;
    page: number;
    limit: number;
    totalRecords: number;
    attachments: any;
  }>;
  listResponseHistoryDetails(data: any): Promise<{
    statusCodeValue: string;
    data: any;
  }>;
  triggerAI(data : any) : Promise<{
    statusMessage : string,
    status : any,
    data : any
  }>
  triggerAiFromScheduler() : Promise<void>
}

export interface IWebHookService {
  webhookHanlder(
    data: any
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }>;
}
