import { SchedulerExecutions } from "../../models/schedulerExecution";
import {
  ICreateAccountInteraction,
  ICreateInteraction,
  InteractionResponse,
  IProject,
  IUpdateInteraction,
} from "../../utils/types";

export interface IInteractionService {
  processKafkaMessage(data: any): Promise<void>;
  listInteractionPrjAccount(data: any,userId: string,apiType: string): Promise<any>;
  fetchInteractionSummary(
    data: any,userId: string
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
  createAccountInteraction(
    interactionData: ICreateAccountInteraction,
    interactionSource: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }>;

   listAccountInteractions(data: any, page: number, limit: number, filters: Record<string, any>): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { accountInteractions: any , count: number};
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
   updateAccountInteraction(
    interactionData: IUpdateInteraction,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }>;
   updateTechSummaryContext(
    summaryContext:string,
    techSummaryId: string,
    accountId: string,
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
  
  getInteractionLevel(
    statusScope?: string,
    currentStatus?: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionLevel: any };
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
  
  getAccountInteractionDetailsById(
    interactionRid: string,
    accountId: string,
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionDetails: any };
  }>;
   getTechnicalSummaryDetailsById(
    techSummaryId: string,
    accountId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { technicalSummaryDetails: any };
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
      interaction_level: string;
      email_info: {
        email: string;
        name: string | null;
      };
    }[],
    accountId: string,
    userId: string,
    is_interaction_followup?: boolean
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
  listTechnicalSummary(data: any, page: number, limit: number, filters: Record<string, any>): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { techSummaryInfo: any , count: number};
  }>;
  exportTechnicalSummary(data: any, filters: Record<string, any>): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { techSummaryInfo: any , count: number};
  }>;
  exportAccountInteractions(data: any, filters: Record<string, any>): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { accountInteractions: any , count: number};
  }>;
  triggerAI(data : any) : Promise<{
    statusMessage : string,
    status : any,
    data : any
  }>
  triggerAiFromScheduler(schedulerRecord : SchedulerExecutions) : Promise<void>
   getAllowedExportFields(
      userId: string,
      permission_name: string
    ): Promise<any[]>;
  sendEmailInBatch() : Promise<void>
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
