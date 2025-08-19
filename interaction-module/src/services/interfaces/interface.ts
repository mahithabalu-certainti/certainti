import {
  ICreateInteraction,
  InteractionResponse,
  IUpdateInteraction,
} from "../../utils/types";

export interface IInteractionService {
  listInteractionPrjAccount(data: any): Promise<any>;
  fetchInteractionSummary(
    data: any
  ): Promise<{ statusCodeValue: string; data: any }>;
  listInteractionResponseHistory(
    data: any
  ): Promise<{ statusCodeValue: string; data: any }>;
  createInteraction(
    interactionData: ICreateInteraction,
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

  getInteractionStatus(): Promise<{
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
    interactionRid: string[],
    accountId: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionResponse: any };
  }>;
  fetchInteractionHistory(data : any) : Promise<{
    statusCodeValue : string,
    data : any
  }>
  listInteractionAttachments(data : any) : Promise<{
    statusCodeValue : string,
    page : number,
    limit : number,
    totalRecords : number,
    attachments : any
  }>
  listResponseHistoryDetails(data : any) : Promise<{
    statusCodeValue : string,
    data : any
  }>
}
