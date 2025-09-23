import { Logger } from "winston";
import {
  ICreateAccountInteraction,
  ICreateInteraction,
  InteractionResponse,
  IProject,
  IUpdateInteraction,
} from "../../utils/types";
import InteractionSchemaService from "./schemaService";
import { InteractionModelService } from "../interactionModelsService";
import { ALPHANUMERIC_CONDITIONS, HttpStatus, mainTableFilters, rawQueries,statusAction, constants, interactionType, STATUS_MESSAGE, interactionFlag, MAIN_SCHEMA_NAME, schedulerStatus, interactionTaskName ,interactionSource} from "../../utils/constants";
import { Op, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { checkTableExists, fetchAllParentRNumber, fetchInteractionForProjectLevelQuery, fetchInteractionForSentResentStatus, fetchProjectAttachmentsRids, fetchProjectInteractionRid, interactionResponseHistoryByVersion, listAllInteractionSummary, listAttachments, listInteractionHistory, listResponseHistory } from "../../utils/rawQueries";
import { generateSasUrl } from "../../utils/blob";
import { interactionMailTemplate, interactionReminderMailTemplate } from "../../utils/mailTemplate";
import { sendEmailWithAttachment } from "../emailService";
import ExcelJS from 'exceljs';
import axios from 'axios'
import { Kafka, Producer } from "kafkajs";
import { SchedulerExecutions } from "../../models/schedulerExecution";

type filterType = {
        [key : string] : {
            [condition : string] : any
        }
}
// Assuming there is an interface named IInteractionService to implement
export class InteractionService {
  private interactionSchemaService: InteractionSchemaService;
  private interactionModelService: InteractionModelService; // Assuming this is defined somewhere in your code
  private logger: Logger;
  private producer!: Producer;
  private orgDbSequelize : Sequelize | null = null
  private mainDbSequelize : Sequelize | null = null 

  constructor(logger: Logger) {
    this.logger = logger;
    this.interactionSchemaService = new InteractionSchemaService();
    this.interactionModelService = new InteractionModelService(); // Initialize your model service here
  }

 async createAccountInteraction(
    interactionData: ICreateInteraction,
    interactionSource: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }> {
    try {
    const dbInit = await this.interactionModelService.getSequelize();
    const transaction = await dbInit.transaction();
      interactionData.created_by = userId;
      const { accountNumber, parentAccountId } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          interactionData.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const intLevel = await this.interactionSchemaService.getInteractionLevelByRid(
        interactionData?.interaction_level_rid!
      );
      if(intLevel === 'Account')
      {
       return await this.createInteraction(interactionData,interactionSource,userId,intLevel); 
      }
      else
      {
        if (interactionData.projects === undefined || interactionData.projects.length === 0) {
          return {
            statusCode: HttpStatus.FAILED,
            message: STATUS_MESSAGE.projectRequired,
            data: { interactions: null},
          };
        }
        const {  intSource,intType } =
        await this.getInteractionStatusAndSource(interactionSource);
      interactionData.interaction_source_rid = intSource || "";
      interactionData.interaction_type_rid = intType || "";
        
        this.interactionSchemaService.createBulkInteractions(
          accountNumber,
          interactionData,
          userId,
          parentAccountId,
          intLevel!
        )
      }
      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.interactionCreated,
        data: { interactions: null },
      };
    } catch (err) {
     this.logger.error(`Error creating interaction", ${err}`);
       return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.interactionFailed,
        };
    }
  }
  

  
  async createInteraction(
    interactionData: ICreateInteraction,
    interactionSource: string,
    userId: string,
    intLevel:string = 'Project'
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
      const { accountNumber, parentAccountId } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          interactionData.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const {  intSource,intType } =
        await this.getInteractionStatusAndSource(interactionSource);
      interactionData.interaction_source_rid = intSource || "";
      interactionData.interaction_type_rid = intType || "";

      const interaction =
        await this.interactionSchemaService.createInteractions(
          accountNumber,
          interactionData,
          transaction,
          intLevel
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
          interaction.get("r_number") || "",
          interaction.get("interaction_iteration") || 0,
          interaction.get("parent_interaction_rid") || null
        );
        await this.interactionSchemaService.addInteractionTimeline(
          accountNumber,
          "create",
          interactionData,
          interaction.dataValues.rid,
          userId,
          transaction
        );
      }
      await transaction.commit();
      let interactionStatus;
      //check if auto send enabled
      if( interactionData.status_rid)
      {
        interactionStatus = await this.interactionSchemaService.getInteractionStatusById(
          interactionData.status_rid
        );
      }
      const isEmailRecipientAvailable = await this.interactionSchemaService.isEmailRecipientAvailable(accountNumber, interactionData.project_fiscal_rid);
      this.logger.info(`Is email recipient available: ${isEmailRecipientAvailable} for interaction: ${interaction.dataValues.rid} with project fiscal:${interactionData.project_fiscal_rid}`);
      if((interactionStatus === statusAction.DRAFT && isEmailRecipientAvailable) || interactionData.trigger_send)
      await this.checkAutoSendEnabled(accountNumber,interactionData,interaction.rid,userId,interactionData?.account_rid,intLevel, parentAccountId);
       else
       {
        if(!isEmailRecipientAvailable && interactionStatus === statusAction.DRAFT)
         return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.interactionCreatedButNoEmailRecipient,
        data: {
          interactions: interaction,
        },
      };
       }
      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.interactionCreated,
        data: {
          interactions: interaction,
        },
      };
    } catch (err) {
      await transaction.rollback();
     this.logger.error("Error creating interaction", err);
       return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.interactionFailed,
        };
    }
  }
  async checkAutoSendEnabled(accountNumber: string, interactionData: ICreateInteraction, interactionId: string, userId: string, accountRid: string, interactionLevel:string, parentAccountId: string) {
    const isParensettingsConfigured = await this.interactionSchemaService.fetchAccountDetails(accountNumber, parentAccountId);
    if(interactionData?.trigger_send && isParensettingsConfigured){
       await this.sendInteraction([{ interaction_rid: interactionId,
        project_fiscal_rid: interactionData.project_fiscal_rid,interaction_level:interactionLevel
       }], interactionData.account_rid, userId, false,'Manual-Send');

    }
    else{
    const isEnabled = await this.interactionSchemaService.isAutoSendInteractionEnabled(accountNumber, interactionData);
    this.logger.info(`Auto-send is ${isEnabled ? "enabled" : "disabled"} for interaction ID: ${interactionId}`);
    if (isEnabled && isParensettingsConfigured) {
       const projectInfo = await this.interactionSchemaService.fetchProjectInfo(accountNumber, interactionData.project_fiscal_rid);
       const accountInfo = await this.interactionSchemaService.fetchAccountInfo(accountRid, accountNumber);
      const { AutoSendInteractionAudit } = await this.interactionModelService.getModels(accountNumber);
      const ismaxInteractionsSent = await this.checkMaxQuarterlyInteractions(AutoSendInteractionAudit, interactionData.project_fiscal_rid, projectInfo.max_ai_interaction,accountInfo);
      if (!ismaxInteractionsSent) return;
      await this.sendInteraction([{ interaction_rid: interactionId,
        project_fiscal_rid: interactionData.project_fiscal_rid,interaction_level:interactionLevel
       }], interactionData.account_rid, userId, false,'Auto-Send');
    }
  }
  }
   async  checkMaxQuarterlyInteractions(
    AiSendInteraction: any,
    projectFiscalRid: string,
    maxInteractions: number,
    accountInfo: { fiscal_start_date: string; fiscal_end_date: string }
  ) {
    const now = new Date();
    // Parse fiscal start and end month/day
    // Format: MM/DD (e.g., "01/12" for Jan 12)
    function parseFiscalDate(dateStr: string, year: number): Date {
      const [mmRaw, ddRaw] = dateStr.split("/");
      const mm = mmRaw !== undefined ? Number(mmRaw) : undefined;
      const dd = ddRaw !== undefined ? Number(ddRaw) : undefined;
      if (
        mm === undefined || dd === undefined ||
        isNaN(mm) || isNaN(dd) ||
        mm < 1 || mm > 12 || dd < 1 || dd > 31
      ) {
        throw new Error(`Invalid fiscal date format: ${dateStr}`);
      }
      return new Date(year, mm - 1, dd);
    }
    // Get fiscal year for current date
    let fiscalStart = parseFiscalDate(accountInfo.fiscal_start_date, now.getFullYear());
    let fiscalEnd = parseFiscalDate(accountInfo.fiscal_end_date, now.getFullYear());
    if (now < fiscalStart) {
      fiscalStart = parseFiscalDate(accountInfo.fiscal_start_date, now.getFullYear() - 1);
      fiscalEnd = parseFiscalDate(accountInfo.fiscal_end_date, now.getFullYear());
    }
    // Calculate quarters (start on 1st, end on last day of 3rd month)
    const quarters = [];
    let qStart = new Date(fiscalStart);
    for (let i = 0; i < 4; i++) {
      // Quarter start: always 1st of the month
      const start = new Date(qStart.getFullYear(), qStart.getMonth(), 1);
      // Quarter end: last day of the third month
      const end = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 0);
      quarters.push({ start, end });
      // Next quarter starts on the 1st of the next third month
      qStart = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 1);
    } 
    // Find current quarter
    let quarterStart, quarterEnd;
    for (const q of quarters) {
      if (now >= q.start && now <= q.end) {
        quarterStart = q.start;
        quarterEnd = new Date(q.end.getFullYear(), q.end.getMonth(), q.end.getDate(), 23, 59, 59, 999);
        console.log(`Current quarter: Start = ${quarterStart.toISOString()}, End = ${quarterEnd.toISOString()}`);
        break;
      }
    }
    if (!quarterStart || !quarterEnd) {
      // Fallback: use fiscal year start/end
      quarterStart = fiscalStart;
      quarterEnd = fiscalEnd;
      console.log(`Fallback to fiscal year: Start = ${quarterStart.toISOString()}, End = ${quarterEnd.toISOString()}`);
    }
    const sentCount = await AiSendInteraction.count({
      where: {
        project_fiscal_rid: projectFiscalRid,
        created_datetime: {
          [Op.between]: [quarterStart, quarterEnd]
        }
      }
    });
    this.logger.info(`Sent count for the current quarter: ${sentCount}`);
    if (sentCount >= maxInteractions) {
      this.logger.info(`Max interactions sent for quarter (${sentCount}) reached for project_fiscal_rid: ${projectFiscalRid}`);
      return false;
    }
    return true;
  }
  async getInteractionStatusAndSource(interactionSource: string) {

    const intSource = await this.interactionSchemaService.getInteractionSourceByType(
      interactionSource
    );
    const intType = await this.interactionSchemaService.getInteractionType(
      interactionType.RD
    );
   
    return { intSource, intType };
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
    
      let interactionStatus;  
      if(interactionData.status_rid)
      {
          interactionStatus = await this.interactionSchemaService.getInteractionStatusById(
        interactionData.status_rid
      );
      }   
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
      }

      await transaction.commit();
      const isEmailRecipientAvailable = await this.interactionSchemaService.isEmailRecipientAvailable(accountNumber, interactionData.interaction_rid);
    //   if(interactionStatus === statusAction.DRAFT && isEmailRecipientAvailable)
    // //  await this.checkAutoSendEnabled(accountNumber,interactionData,interactionData.interaction_rid,userId, interactionData?.account_rid);
    //   else{
    //     if(!isEmailRecipientAvailable && interactionStatus === statusAction.DRAFT)
    //     {
    //        return {
    //     statusCode: HttpStatus.SUCCESS,
    //     message: STATUS_MESSAGE.interactionCreatedButNoEmailRecipient,
    //     data: {
    //       interactions: null,
    //     },
    //   };
    //     }
    //   }
      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.interactionUpdated,
        data: {
          interactions: null,
        },
      };
    } catch (err) {
      console.log("Error updating resource", err);
      await transaction.rollback();
      this.logger.error("Error updating interaction", err);
       return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.interactionUpdateFailed,
        };
    }
  }

  async updateAccountInteraction(
    interactionData: ICreateAccountInteraction,
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
    
      let interactionStatus;  
      if(interactionData.status_rid)
      {
          interactionStatus = await this.interactionSchemaService.getInteractionStatusById(
        interactionData.status_rid
      );
      }   
      const updatedInteraction =
        await this.interactionSchemaService.updateAccountInteraction(
          accountNumber,
          interactionData,
          userId,
          transaction
        );
      if (updatedInteraction && interactionData?.account_interaction_rid) {
        await this.interactionSchemaService.addAccountInteractionItems(
          accountNumber,
          interactionData,
          interactionData?.account_interaction_rid,
          transaction,
          userId
        );
      }

      await transaction.commit();
      
      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.interactionUpdated,
        data: {
          interactions: null,
        },
      };
    } catch (err) {
      await transaction.rollback();
      this.logger.error("Error updating interaction", err);
       return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.interactionUpdateFailed,
        };
    }
  }



  async updateTechSummaryContext(
    summaryContext:string,
    techSummaryId: string,
    accountId: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }> {
    try {
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          accountId
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      await this.interactionSchemaService.updateTechSummaryContext(
        summaryContext,
        techSummaryId,
        accountNumber,
        userId
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.techSummarycontextUpdated,
        data: {
          interactions: null,
        },
      };
    } catch (err) {
      this.logger.error("Error updating interaction", err);
       return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.interactionUpdateFailed,
        };
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
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid account ID",
        };
      }
      const updatedInteractionResponse =
        await this.interactionSchemaService.updateInteractionResponse(
          accountNumber,
          interactionData,
          userId,
          transaction
        );
      await transaction.commit();
      const parallelTasks = [];
      if (updatedInteractionResponse.isAutoTriggerEnabled) {
        const req = {
          data: [
        {
          account_rid: interactionData.account_rid,
          project_fiscal_rid: [interactionData.project_fiscal_rid],
        },
          ],
          type: "project",
        };
        parallelTasks.push(this.triggerAI(req));
      }

      parallelTasks.push(
        this.interactionSchemaService.updateAttachmentCount(
          accountNumber,
          interactionData.interaction_rid,
          updatedInteractionResponse.interactionVersion,
          interactionData.project_fiscal_rid
        )
      );
      await Promise.all(parallelTasks);
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactions: null,
        },
      };
    } catch (err) {
      await transaction.rollback();
      return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.responseUpdateFailed,
        };
    }
  }
    async listTechnicalSummary(data : any,
    page: number, limit: number, filters: Record<string, any>
    ) :  Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { techSummaryInfo: any,count: number };
  }> {
    try {
        const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          data.account_rid
        );

      if (!accountNumber) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid account ID",
        };
      }
      const techSummary =
        await this.interactionSchemaService.listTechnicalSummary(
          accountNumber,
          data.project_fiscal_rid,
          page,
          limit,
          filters,
          data.sortBy,
          data.sortOrder,
          "list"
        );

      if (!techSummary) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid interaction ID",
        };
      }
      else
      {
        
      }

       return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          techSummaryInfo: techSummary.technicalSummary,
          count:techSummary.count
        },
      };
    }
    catch (err) {
      throw this.throwServiceError(err as Error);
    }

  }
   async listAccountInteractions(data : any,
    page: number, limit: number, filters: Record<string, any>
    ) :  Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { accountInteractions: any,count: number };
  }> {
    try {
        const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          data.account_rid
        );

      if (!accountNumber) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid account ID",
        };
      }
      const response =
        await this.interactionSchemaService.listAccountInteractions(
          accountNumber,
          data.account_rid,
          page,
          limit,
          filters,
          data.sort_by,
          data.sort_order,
          data.interaction_level,
          "list"
        );

      if (!response) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid interaction ID",
        };
      }
       return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          accountInteractions: response.accountInteractions,
          count: response.count
        },
      };
    }
    catch (err) {
      throw this.throwServiceError(err as Error);
    }

  }

   async exportTechnicalSummary(data : any,
    filters: Record<string, any>
    ) :  Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { techSummaryInfo: any,count: number };
  }> {
    try {
        const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          data.account_rid
        );

      if (!accountNumber) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid account ID",
        };
      }
      const techSummary =
        await this.interactionSchemaService.listTechnicalSummary(
          accountNumber,
          data.project_fiscal_rid,
          0,
          0,
          filters,
          data.sortBy,
          data.sortOrder,
          "download"
        );

      if (!techSummary) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid interaction ID",
        };
      }
     

       return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          techSummaryInfo: techSummary.technicalSummary,
          count:techSummary.count
        },
      };
    }
    catch (err) {
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
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid account ID",
        };
      }
      const interactionDetails =
        await this.interactionSchemaService.fetchInteractionDetailsById(
          accountNumber,
          interactionRid
        );

      if (!interactionDetails) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid interaction ID",
        };
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactionDetails,
        },
      };
    } catch (err) {
      console.log("Error fetching interaction details", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async getAccountInteractionDetailsById(
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
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid account ID",
        };
      }
      const interactionDetails =
        await this.interactionSchemaService.fetchAccountInteractionDetailsById(
          accountNumber,
          interactionRid
        );

      if (!interactionDetails) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid interaction ID",
        };
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

  async getTechnicalSummaryDetailsById(
    techSummaryId: string,
    accountRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { technicalSummaryDetails: any };
  }> {
    try {
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          accountRid
        );

      if (!accountNumber) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid account ID",
        };
      }
      const techSummaryDetails =
        await this.interactionSchemaService.fetchTechnicalSummaryDetailsById(
          accountNumber,
          techSummaryId
        );

      if (!techSummaryDetails) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid technical summary ID",
        };
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          technicalSummaryDetails: techSummaryDetails,
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
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid interaction ID",
        };
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

  async getInteractionStatus(status_scope?: string,currentStatus?: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionStatus: any };
  }> {
    try {
      const interactionStatus =
        await this.interactionSchemaService.getInteractionStatus(status_scope,currentStatus);

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
  
   async getInteractionLevel(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionLevel: any };
  }> {
    try {
      const interactionLevel =
        await this.interactionSchemaService.getInteractionLevel();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactionLevel,
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

  async getResponseSource(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { responseSource: any };
  }> {
    try {
      const responseSource =
        await this.interactionSchemaService.getResponseSource();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          responseSource,
        },
      };
    } catch (err) {
      throw this.throwServiceError(err as Error);
    }
  }
  async sendInteraction(
   interactions: {
      interaction_rid: string;
      email_info?: {
        email: string;
        name: string | null;
        ccEmails?: string[] | [];
      };
      interaction_level: string;
      project_fiscal_rid: string;
    }[],
    accountRid: string,
    userId: string,
    is_interaction_followup: boolean,
    type: string = interactionSource.MANUAL
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionResponse: any };
  }> {
    try {
      const mainDb = await this.getMainDb()
      const orgDb = await this.getOrgDb()
      const { accountNumber } = await this.interactionSchemaService.fetchValidAccountNumberById(accountRid);
      if (!accountNumber) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid account ID",
        };
      }

      const interactionResponse: any[] = [];
      const schemaName = rawQueries.fetchSchemaName(accountNumber)

      const fetchInQueueStatus : any = await mainDb.query(rawQueries.fetchInteractionQueueStatus())

      for (const { interaction_rid, email_info, project_fiscal_rid, interaction_level } of interactions) {
        let data : any = {}
        data.account_rid = accountRid
        data.project_fiscal_rid = project_fiscal_rid,
        data.account_rnumber = accountNumber,
        data.interaction_rid = interaction_rid
        data.user_rid = userId
        data.email = email_info?.email === undefined ? null : email_info?.email
        data.name = email_info?.name === undefined ? null : email_info.name
        data.is_interaction_followup = is_interaction_followup
        data.interaction_level = interaction_level
        this.logger.info(`Email info to be sent: ${JSON.stringify(data)}`);
        await this.interactionSchemaService.insertEmailInfoDatas(data);
        if(type === 'Auto-Send')
        {
          await this.interactionSchemaService.createAutoSendInteractionEntry(accountNumber, interaction_rid, project_fiscal_rid, email_info);
        }
        await orgDb.query(rawQueries.updateInteractionStatus(schemaName, fetchInQueueStatus[0][0].rid, interaction_rid))
        await mainDb.query(rawQueries.updateInteractionSummaryStatus(fetchInQueueStatus[0][0].rid, interaction_rid))
        interactionResponse.push({
          interactionRid: interaction_rid,
        });
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { interactionResponse },
      };
    } catch (err) {
      console.log("Error sending interaction", err);
      throw this.throwServiceError(err as Error);
    }
  }


  async getSenderEmailInfo(accountNumber: string, parentAccountRid: string | null) {
    if (!parentAccountRid) {
      return null;
    }
    // Fetch sender email info from the database or another service
    const senderEmailInfo = await this.interactionSchemaService.fetchSenderEmailInfoByAccountId(accountNumber, parentAccountRid);
    return senderEmailInfo;
  }

  async generateInteractionLink(
    interactionRid: string,
    accountRid: string,
    projectFiscalId: string,
    interactionLevel: string
  ) {
    if (interactionLevel === "Account") {
      return `${process.env.INTERACTION_URL}?acc=${accountRid}&int=${interactionRid}`;
    } else {
      return `${process.env.INTERACTION_URL}?acc=${accountRid}&int=${interactionRid}&proj=${projectFiscalId}`;
    }
  }

  async generateExcelBuffer(
    rid: string,
    interactionItems: any[],
    interactionInfo: any
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Interaction");

    // Header rows
    const headerRows = [
      ["Account ID", interactionInfo.accountInfo?.r_number ?? ""],
      ["Interaction ID", interactionInfo.interactionInfo?.interaction_id ?? ""],
      ["Project ID", interactionInfo.projectInfo?.project_id ?? ""],
      ["Project Name", interactionInfo.projectInfo?.project_name ?? ""],
      ["Project Code", interactionInfo.projectInfo?.project_code ?? ""],
    ];

    headerRows.forEach((row, idx) => {
      worksheet.addRow(row);
      worksheet.getRow(idx + 1).getCell(1).font = { bold: true };
      worksheet.getRow(idx + 1).getCell(1).protection = { locked: true };
      worksheet.getRow(idx + 1).getCell(2).protection = { locked: true };
    });

    // Column headers
    worksheet.addRow(["Question No","Questions", "Answers", "Notes", "Is Mandatory"]);
    worksheet.getRow(6).eachCell((cell) => {
      cell.font = { bold: true };
      cell.protection = { locked: true };
    });

    worksheet.columns = [
      { key: "question no", width: 15 },
      { key: "question", width: 50 },
      { key: "answer", width: 50 },
      { key: "notes", width: 30 },
      { key: "is_mandatory", width: 15 },
    ];

    // Add question rows
    interactionItems.forEach((item: any) => {
      const plain = item.get ? item.get({ plain: true }) : item;
      const row = worksheet.addRow({
        "question no": plain.question_seq_num,
        "question": plain.question,
        "answer": "",
        "notes": "",
        "is_mandatory": plain.is_mandatory ? "Yes" : "No",
      });

      // Lock specific columns right away
      row.getCell(1).protection = { locked: true };
      row.getCell(2).protection = { locked: true};
      row.getCell(3).protection = { locked: false };
      row.getCell(4).protection = { locked: true };
      row.getCell(5).protection = { locked: true };
    });

    // Now protect worksheet AFTER all protections are set
    await worksheet.protect("interaction123", {
      selectLockedCells: true,
      selectUnlockedCells: true,
    });

    // Write Excel file to buffer (in-memory)
    const excelBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(excelBuffer as ArrayBuffer);
  }

  async sendEmailWithAttachment(
    emailInfo: { name: string | null; email: string, ccEmails?: string[] | [] },
    projectInfo: {
      project_id: string;
      project_name: string;
      project_code: string;
      fiscalYear: number;
    },
    accountInfo: { account_name: string },
    excelAttachment: { filename: string; content: string; contentType: string },
    interactionLink: string,
    senderEmailInfo: {email:string,clientId:string, tenantId:string,clientSecret:string},
    interactionRid:string,
    is_interaction_followup: boolean,
    interactionLevel:string
  ) {
    let emailResponse = false;
    try {
      let emailContent = interactionMailTemplate(
        emailInfo,
        projectInfo,
        accountInfo,
        interactionLink,
        interactionRid,
        interactionLevel
      );
      if(is_interaction_followup)
      {
         emailContent = interactionReminderMailTemplate(
        emailInfo,
        projectInfo,
        accountInfo,
        interactionLink,
        interactionRid,
        interactionLevel
      );
      }
      //fetch sender email info
      
      emailResponse = await sendEmailWithAttachment({
        message: emailContent.message,
        attachments: [
          {
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: excelAttachment.filename,
            contentBytes: excelAttachment.content,
            contentType: excelAttachment.contentType,
          },
        ],
        senderEmailInfo:senderEmailInfo
      });
      return emailResponse;
    } catch (error) {
      this.logger.error(`Error sending email: ${error}`);
      return emailResponse;
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
  private async getMainDb() {
    if(!this.mainDbSequelize) this.mainDbSequelize = await initMainDbSequelize()
    return this.mainDbSequelize
  }
  private async getOrgDb() {
    if(!this.orgDbSequelize) this.orgDbSequelize = await initOrgSequelize()
    return this.orgDbSequelize
  }

  // Implement all methods required by IInteractionService
  // Example method (replace with actual interface methods)
  public async interact(): Promise<void> {
    this.logger.info("Interact method called.");
    // Implementation here
  }
  async listInteractionPrjAccount(data : any,userId : string,apiType:string) : Promise<any>{
    const mainDb = await this.getMainDb()
    const orgDb = await this.getOrgDb()
      const userGroupType = await this.interactionSchemaService.getUserGroupType(userId);
      const userProfileType = await this.interactionSchemaService.getUserProfileType(
        userId
      );
      const isCustomGlobal = userGroupType === "DEFAULT";
      const isDefaultParent = userGroupType === "AUTO_ASSIGNED_PARENT";
      const isPOCProfile =
        userProfileType?.profileName === "Project Point of Contact";
      let accessibleIds: string[] = [];
      if (!isCustomGlobal) {
        accessibleIds = await this.interactionSchemaService.getAccessibleProjectIds(
          userId,
          isDefaultParent,
          isPOCProfile,
          userProfileType?.email,
          isCustomGlobal
        );
        if (accessibleIds.length === 0) {
           return {
        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
        data : []
      }
        }
      }

      if (isCustomGlobal && isPOCProfile) {
        accessibleIds = await this.interactionSchemaService.getAccessibleProjectIds(
          userId,
          isDefaultParent,
          isPOCProfile,
          userProfileType?.email,
          isCustomGlobal
        );
        if (accessibleIds.length === 0) {
          return {
            statusCodeValue: HttpStatus.NOT_FOUND_MESSAGE,
            data: []
          };
        }
      }

    let fetchParentAccount : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb))
    let schemaName = rawQueries.fetchSchemaName(fetchParentAccount[0][0].r_number)
    let createdByFilter;
    let createdByConditions;
    let modifiedByFilter;
    let modifiedByConditions;
    let sourceFilter;
    let sourceConditions;
    let filterKeyName;
    let disablePagination : boolean = false
    let totalResults : number = 0

    const detectConditions = (filters : any) => {
      if(!filters) return null
      for(let conditions of Object.values(ALPHANUMERIC_CONDITIONS)) {
        if(Object.keys(filters).includes(conditions)) return conditions
      }
      return null
    }
    if(data.filters?.created_user_name) {
      createdByFilter = data.filters.created_user_name
      createdByConditions = detectConditions(createdByFilter)
    }
    if(data.filters?.updated_user_name) {
      modifiedByFilter = data.filters.updated_user_name
      modifiedByConditions = detectConditions(modifiedByFilter)
    }
    if(data.filters?.interaction_source_name) {
      sourceFilter = data.filters.interaction_source_name
      sourceConditions = detectConditions(sourceFilter)
    }

    ["created_user_name", "updated_user_name", "interaction_source_name"].forEach(key => {
      if(data.filters[key]) {
        disablePagination = true
        delete data.filters[key]
      }
    })
    if (mainTableFilters[data.sort] !== undefined) {
      disablePagination = true;
    }
    if(apiType === 'export') disablePagination = true
    const [activeStatus]: any[] = await mainDb.query(
              rawQueries.fetchActiveStatusByType("Active"),
              { type: "SELECT" }
            );
    
    const result : any = await orgDb.query(fetchInteractionForProjectLevelQuery(
      data.account_rid, 
      data.project_rid,
      data.project_fiscal_rid,
      data.fiscal_year,
      data.sort,
      data.sort_by,
      data.filters,
      data.page, 
      data.limit,
      data.flag, 
      schemaName,
      disablePagination,
      accessibleIds,
      data.search,
      activeStatus?.rid
    ))
    let hasEmailRecipient = false;
    if(result[0][0].interactions != null) {
      let statusIds : any[] = [...new Set(result[0][0].interactions.map((d : any) => d.status))]
      let typeIds : any[] = [...new Set(result[0][0].interactions.map((d : any) => d.interaction_type))]
      let interactionLevelIds : any[] = [...new Set(result[0][0].interactions.map((d : any) => d.interaction_level))]
      let sourceIds : any[] = [...new Set(result[0][0].interactions.map((d : any)=> d.interaction_source))]
      let responseSourceIds : any[] = [...new Set(result[0][0].interactions.map((d : any)=> d.response_source))]
      let createdByIds : any[] = [...new Set(result[0][0].interactions.map((user : any) => user.created_by))]
      let modifiedByIds : any[] = [...new Set(result[0][0].interactions.map((user : any) => user.modified_by))]
      let projectFiscalIds : any[] = [...new Set(result[0][0].interactions.map((project : any) => project.project_fiscal_rid))]
      let fetchStatus = await mainDb.query(rawQueries.fetchInteractionStatus(statusIds))
      let fetchTypes = await mainDb.query(rawQueries.fetchInteractionTypes(typeIds))
      let fetchLevelIds = await mainDb.query(rawQueries.fetchInteractionLevel(interactionLevelIds))
      let fetchSource = await mainDb.query(rawQueries.fetchInteractionSource(sourceIds))
      let fetchResponseSource = await mainDb.query(rawQueries.fetchInteractionResponseSource(responseSourceIds))
      let fetchCreatedByUsers = await mainDb.query(rawQueries.fetchUser(createdByIds))
      let fetchModifiedByUsers = await mainDb.query(rawQueries.fetchUser(modifiedByIds))
      let isEmailRecipient : any;
      let recipientMap : Map<string, boolean>;

      let statusMap : Map<string, string> = new Map(fetchStatus[0].map((status : any) => [status.rid, status.status_name]))
      let typeMap : Map<string, string> = new Map(fetchTypes[0].map((types : any) => [types.rid, types.interaction_type_name]))
      let levelMap : Map<string, string> = new Map(fetchLevelIds[0].map((level : any) => [level.rid, level.interaction_level_name]))
      let sourceMap : Map<string, string> = new Map(fetchSource[0].map((source : any) => [source.rid, source.interaction_source_name]))
      let responseSourceMap : Map<string, string> = new Map(fetchResponseSource[0].map((source : any) => [source.rid, source.response_source_name]))
      let createdMap : Map<string, string> = new Map(fetchCreatedByUsers[0].map((user : any) => [user.rid, `${user.first_name} ${user.last_name}`]))
      let modifiedMap : Map<string, string> = new Map(fetchModifiedByUsers[0].map((user : any) => [user.rid, `${user.first_name} ${user.last_name}`]))
      let finalData = result[0][0].interactions == null ? [] : result[0][0].interactions.map((d : any) => {
      if(levelMap.get(d.interaction_level) === 'Account')
        {
          hasEmailRecipient =d.has_account_recipient;
        }
      else
        {
            hasEmailRecipient = d.has_email_recipient;
        }
        return {
          ...d,
          status_rid: d.status,
          status_name: d.status == '' || d.status == null ? null : statusMap.get(d.status),
          recipient_name: d.recipient_name == '' || d.recipient_name == null ? null : d.recipient_name,
          recipient_email: d.recipient_email == '' || d.recipient_email == null ? null : d.recipient_email,
          interaction_type_rid: d.interaction_type,
          interaction_type_name: typeMap.get(d.interaction_type),
          interaction_source_rid: d.interaction_source,
          interaction_source_name: sourceMap.get(d.interaction_source),
          interaction_level_rid: d.interaction_level,
          interaction_level_name: levelMap.get(d.interaction_level),
          response_source_rid: d.response_source,
          response_source_name : responseSourceMap.get(d.response_source) == undefined ? null : responseSourceMap.get(d.response_source),
          created_by: d.created_by,
          created_user_name: createdMap.get(d.created_by) || null,
          modified_by: d.modified_by,
          updated_user_name: modifiedMap.get(d.modified_by) == undefined ? d.modified_by : modifiedMap.get(d.modified_by),
          has_email_recipient: hasEmailRecipient
        }
      })
      const applyFilters = (data : any[], conditions : any, value : any, field : any) => {
        if(!conditions || !field) return data
        const val = value[conditions]
        switch(conditions) {
          case ALPHANUMERIC_CONDITIONS.equals : 
            return data.filter((d : any) => d[field]?.toLowerCase() === val?.toLowerCase())
          case ALPHANUMERIC_CONDITIONS.notEquals :
            return data.filter((d : any) => d[field]?.toLowerCase() != val?.toLowerCase())
          case ALPHANUMERIC_CONDITIONS.contains : 
            return data.filter((d : any) => d[field]?.toLowerCase().includes(val?.toLowerCase()))
          case ALPHANUMERIC_CONDITIONS.isEmpty :
            return data.filter((d : any) => d[field] == null)
          default :
            return data
        }
      }
      if(createdByConditions != null && createdByConditions != undefined)
        finalData = applyFilters(finalData, createdByConditions, createdByFilter, "created_user_name")
      if(modifiedByConditions != null && modifiedByConditions != undefined)
        finalData = applyFilters(finalData, modifiedByConditions, modifiedByFilter, "updated_user_name")
      if(sourceConditions != null && sourceConditions != undefined)
        finalData = applyFilters(finalData, sourceConditions, sourceFilter, "interaction_source_name")
      if(mainTableFilters[data.sort] != undefined && data.sort_by.toLowerCase() == 'asc') {
        finalData = finalData.sort((a : any, b : any) => {
          if(!a?.[data.sort]) return 1
          if(!b?.[data.sort]) return -1 
          return a[data.sort].localeCompare(b[data.sort])
        })
      } else if(mainTableFilters[data.sort] != undefined && data.sort_by.toLowerCase() == 'desc'){
        finalData = finalData.sort((a : any, b : any) => {
          if(!b?.[data.sort]) return 1
          if(!a?.[data.sort]) return -1 
          return b[data.sort].localeCompare(a[data.sort])
        })
      }
      
      totalResults = disablePagination ? finalData.length : finalData[0].total_records
      let finalPaginatedData : any[] = []
       if(apiType === "export") 
        {
          finalPaginatedData = finalData;
        }
        else
        {
           finalPaginatedData = disablePagination ? finalData.slice((data.page - 1) * data.limit, data.page * data.limit) : finalData
        }
      let organizedData = {
        page : data.page,
        limit : data.limit,
        totalCount : totalResults,
        interactions : finalPaginatedData
      }
      return {
        status : HttpStatus.SUCCESS,
        data : organizedData
      }
    }
    else {
      let organizedData = {
        page : data.page,
        limit : data.limit,
        totalCount : 0,
        interactions : []
      }
      return {
        status : HttpStatus.NOT_FOUND,
        data : organizedData
      }
    }
  }
  async fetchInteractionSummary (data : any,userId:string) {
    const mainDb = await this.getMainDb()
       const userGroupType = await this.interactionSchemaService.getUserGroupType(userId);
      const userProfileType = await this.interactionSchemaService.getUserProfileType(
        userId
      );
      const isCustomGlobal = userGroupType === "DEFAULT";
      const isDefaultParent = userGroupType === "AUTO_ASSIGNED_PARENT";
      const isPOCProfile =
        userProfileType?.profileName === "Project Point of Contact";
      let accessibleIds: string[] = [];
      if (!isCustomGlobal) {
        accessibleIds = await this.interactionSchemaService.getAccessibleProjectIds(
          userId,
          isDefaultParent,
          isPOCProfile,
          userProfileType?.email,
          isCustomGlobal
        );
        if (accessibleIds.length === 0) {
           return {
        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
        data : []
      }
        }
      }

      if (isCustomGlobal && isPOCProfile) {
        accessibleIds = await this.interactionSchemaService.getAccessibleProjectIds(
          userId,
          isDefaultParent,
          isPOCProfile,
          userProfileType?.email,
          isCustomGlobal
        );
        if (accessibleIds.length === 0) {
         return {
        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
        data : []
      }
        }
      }
    const result : any = await mainDb.query(listAllInteractionSummary(data.page, data.limit, 
      data.filters, data.globalFilters, data.fiscal_year, data.sort, data.sort_by,accessibleIds, data.search
    ))
    if(result[0][0].interactions != null) {
      return {
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        data : result[0][0].interactions
      }
    } else {
      return {
        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
        data : []
      }
    }
  }

  async listInteractionResponseHistory (data : any) {
    const mainDb = await this.getMainDb()
    const orgDb = await this.getOrgDb();
    
    let fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb))
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number)
    const responseHistoryresult : any = await orgDb.query(listResponseHistory(data.interaction_rid, schemaName, data.page, data.limit, data.sort, data.sort_by))
    if(responseHistoryresult[0][0].response_history !== null) {
      let finalData = responseHistoryresult[0][0].response_history
      let fetchSourceIds : any = [...new Set(finalData.map((d : any) => d.interaction_source_rid))]
        let fetchResponseSourceIds : any = [...new Set(finalData.map((d : any) => d.response_source_rid))]
      let fetchUserIds : any = [...new Set(finalData.map((d : any) => d.response_by_rid))]
      let fetchUserDetails : any = await mainDb.query(rawQueries.fetchUser(fetchUserIds))
      let fetchInteractionSource : any = await mainDb.query(rawQueries.fetchInteractionSource(fetchSourceIds))
      let fetchResponseSource : any = await mainDb.query(rawQueries.fetchInteractionResponseSource(fetchResponseSourceIds))
      let mapSources = new Map(fetchInteractionSource[0].map((source : any) => [source.rid, source.interaction_source_name]))
      let mapResponseSource = new Map(fetchResponseSource[0].map((source : any) => [source.rid, source.response_source_name]))
      let userMap = new Map(fetchUserDetails[0].map((d : any) => [d.rid, `${d.first_name} ${d.last_name}`]))
      let updatedFinalData = finalData.map((d : any) => {
        return {
          ...d,
          interaction_source_name : mapSources.get(d.interaction_source_rid),
          response_source_name : mapResponseSource.get(d.response_source_rid),
          response_by : userMap.get(d.response_by_rid) || d.response_by_rid
        }
      })
      
      const sortByField = (
        data: any[],
        field: string,
        order: "asc" | "desc"
      ) => {
        return data.sort((a: any, b: any) => {
          const aField = a?.[field] ?? "";
          const bField = b?.[field] ?? "";
          if (!aField) return order === "asc" ? 1 : -1;
          if (!bField) return order === "asc" ? -1 : 1;
          return order === "asc"
        ? aField.localeCompare(bField)
        : bField.localeCompare(aField);
        });
      };

      if (
        data.sort.toLowerCase() === "interaction_source_name" &&
        ["asc", "desc"].includes(data.sort_by.toLowerCase())
      ) {
        updatedFinalData = sortByField(
          updatedFinalData,
          "interaction_source_name",
          data.sort_by.toLowerCase() as "asc" | "desc"
        );
      }
      if (
        data.sort.toLowerCase() === "response_source_name" &&
        ["asc", "desc"].includes(data.sort_by.toLowerCase())
      ) {
        updatedFinalData = sortByField(
          updatedFinalData,
          "response_source_name",
          data.sort_by.toLowerCase() as "asc" | "desc"
        );
      }
      return {
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        data : updatedFinalData
      }
    } else {
      return {
        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
        data : []
      }
    }
  }
  async fetchInteractionHistory (data : any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    let fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number); 
    const result : any = await orgDb.query(listInteractionHistory(data.page, data.limit, data.sort, data.sort_by, data.filters, data.interaction_rid, schemaName));


    const responseData = result[0][0]; // Always exists

    // Step 1: Extract response & source RIDs from the base interaction (not from history)
    const responseSourceIds = [responseData.response_source_rid].filter(Boolean);
    const sourceTypeIds = [responseData.interaction_source_rid].filter(Boolean);
    let sourceMap: Map<string, string> = new Map();

    // Step 2: Fetch response source & interaction source names
    if(sourceTypeIds.length > 0) {
    //const fetchResponseSources: any = await mainDb.query(rawQueries.fetchInteractionResponseSource(responseSourceIds));
    const fetchSourceTypes: any = await mainDb.query(rawQueries.fetchInteractionSource(sourceTypeIds));

   // const mapResponseSource = new Map(fetchResponseSources[0].map((d: any) => [d.rid, d.response_source_name]));
     sourceMap = new Map(fetchSourceTypes[0].map((d: any) => [d.rid, d.interaction_source_name]));
    }
    if (responseData.interaction_history.length !== 0) {
      // Step 3: Process status IDs from history
      const statusIds = [...new Set(responseData.interaction_history.map((d: any) => d.new_status_rid))];
      const fetchStatus: any = await mainDb.query(rawQueries.fetchInteractionStatus(statusIds));
      const mapStatus = new Map(fetchStatus[0].map((d: any) => [d.rid, d.status_name]));

      // Step 4: Enrich history with status_name only (response/source already handled above)
      const enrichedHistory = responseData.interaction_history.map((d: any) => ({
        ...d,
        status_name: mapStatus.get(d.new_status_rid) || null
      }));

      const totalRecords = enrichedHistory[0].total_records;

      const sortedData =
        data.sort === "status_name"
          ? enrichedHistory.sort((a: any, b: any) => {
              const sortBy = data.sort_by.toLowerCase();
              if (!a?.status_name) return 1;
              if (!b?.status_name) return -1;
              return sortBy === "desc"
                ? b.status_name.localeCompare(a.status_name)
                : a.status_name.localeCompare(b.status_name);
            })
          : enrichedHistory;

      const finalStructuredData = {
        interaction_rnumber: responseData.interaction_rnumber,
        project_code: responseData.project_code,
        project_name: responseData.project_name,
      //  response_source: mapResponseSource.get(responseData.response_source_rid) || null,
        interaction_source_name: sourceMap.get(responseData.interaction_source_rid) || null,
        interaction_history: sortedData.map((d: any) => {
          let isoDate = new Date(d.date).toISOString()
          let formattedDate = isoDate.replace("Z", "+00:00")
          return {
            rid: d.interaction_history_rid,
            status_rid: d.new_status_rid,
            status_name: d.status_name,
            date: formattedDate
          }
        })
      };

      return {
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        data: {
          page: data.page,
          limit: data.limit,
          total_records: totalRecords,
          data: finalStructuredData
        }
      };
    } else {
      // No history, but still include top-level fields
      const finalStructuredData = {
        interaction_rnumber: responseData.interaction_rnumber,
        project_code: responseData.project_code,
        project_name: responseData.project_name,
      //  response_source: mapResponseSource.get(responseData.response_source_rid) || null,
        interaction_source_name: sourceMap.get(responseData.interaction_source_rid) || null,
        interaction_history: []
      };

      return {
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        data: {
          page: data.page,
          limit: data.limit,
          total_records: 0,
          data: finalStructuredData
        }
      };
    }
  }
  async listInteractionAttachments (data : any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    let fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);

    const result : any = await orgDb.query(listAttachments(data.page, data.limit, data.interaction_rid, schemaName, data.search))
    if(result[0][0].attachments !== null) {
      let responseData = result[0][0].attachments
      const createdByIds = [...new Set(responseData.map((d : any) => d.created_by))]
      const fetchUsers = await mainDb.query(rawQueries.fetchUser(createdByIds))
      const mapUsers : Map<string, string> = new Map(fetchUsers[0].map((d : any) => [d.rid, `${d.first_name} ${d.last_name}`]))
      responseData = await Promise.all(responseData.map(async (d : any) => {
        return {
          ...d,
          uploaded_by : mapUsers.get(d.created_by),
          new_url : await generateSasUrl(d.download_link)
        }
      })
    )
    let total = responseData[0].total_records
    responseData = responseData.map((d : any) => {
      delete d.download_link
      const data =  {
        ...d,
        download_link : d.new_url,
        size: d.size ? `${d.size} mb` : null
      }
      delete data.total_records
      delete data.new_url
      return data;
    })
    return {
      statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
      page : data.page,
      limit : data.limit,
      totalRecords : total,
      attachments : responseData
    }
    } else {
      return {
        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
        page : data.page,
        limit : data.limit,
        totalRecords : 0,
        attachments : []
      }
    }
  }
  async listResponseHistoryDetails (data : any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    let fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);

    const result : any = await orgDb.query(interactionResponseHistoryByVersion(data.interaction_rid, data.version, schemaName));
    if(result[0][0].responses_history_details !== null) {
      let finalData = await Promise.all(result[0][0].responses_history_details.map(async (d : any) => {
        let data = {
          interaction_response_rid : d.interaction_response_rid,
          interaction_item_rid : d.interaction_item_rid,
          response_submitted_on : d.response_submitted_on,
          question_id : d.question_id,
          question : d.question,
          response : d.response,
          response_on : d.response_on,
          attachments : await Promise.all(d.attachments.filter((f : any) =>f.file_url !== null).map(async (da : any) => {
              return {
              fileName : da.file_name,
              fileUrl : da.file_url == null ? null : await generateSasUrl(da.file_url),
              fileType : da.file_type,
              fileSize : da.file_size
            }
          }))
        }
        return data
      }))
      let structuredData = {
        interaction_rid : result[0][0].responses_history_details[0].response_id,
        interaction_r_number : result[0][0].responses_history_details[0].r_number,
        project_name : result[0][0].responses_history_details[0].project_name,
        response_on: result[0][0].responses_history_details[0].response_updated_on,
        global_attachments : await Promise.all(result[0][0].responses_history_details[0].global_attachments.filter((f : any) =>f.file_url !== null).map(async (da : any) => {
          return {
            fileName : da.file_name,
            fileUrl : da.file_url == null ? null : await generateSasUrl(da.file_url),
            fileType : da.file_type,
            fileSize : da.file_size
          }
        })),
        history_details : finalData
      }
      return {
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        data : structuredData
      }
    } else {
      return {
        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
        data : []
      }
    }
  }
  private async getProducer(): Promise<Producer> {
    if (!this.producer) {
      const kafka = new Kafka({
        clientId: "my-app",
        brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
      });
      this.producer = kafka.producer();
      await this.producer.connect();
    }
    return this.producer;
  }
  async triggerAI(req: any) {
    try {
      let payload: {
        company_id?: any;
        input_text: string;
        model_type: string;
        project_id?: any;
      } = {
        input_text: "This is some text to be processed by the AI.",
        model_type: "NA"
      };
      if (req.type === 'account') {
        payload.company_id = req.data[0].account_rid;
        const { accountNumber } =
          await this.interactionSchemaService.fetchValidAccountNumberById(
            req.data[0].account_rid
          );

        if (!accountNumber) {
          throw new Error("Invalid account ID");
        }
        if (!this.orgDbSequelize) {
          this.orgDbSequelize = await initOrgSequelize();
        }
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(/\D/g, "")}`;
        const status_rid = await this.interactionSchemaService.getActiveStatusRid();
        const [projects]: any[] = await this.orgDbSequelize.query(rawQueries.fetchProjectsByAccount(req.data[0].account_rid, schemaName,status_rid!));
        const projectIds = Array.isArray(projects) ? projects.map((p: any) => p.rid) : [];
        payload.project_id = projectIds;
      } else {
        payload.company_id = req.data[0].account_rid;
        payload.project_id = req.data[0].project_fiscal_rid;
      }
      console.log("Triggering AI with payload:", payload);

      const topic = process.env.KAFKA_AI_REQUEST_TRIGGER_TOPIC || "ai_assessment_request";
      const message = {
        value: JSON.stringify(payload),
      };
      const producer = await this.getProducer();
      const sendResult = await producer.send({
        topic,
        messages: [message],
      });
      // Check if the message was processed successfully
      console.log("Send result to topic", sendResult);
      return {
        statusMessage: "RD Assessment Initiated",
        status: "success",
        data: null
      };
    } catch (error) {
      console.log(error)
      this.logger.error("Error in triggerAI", error);
      return {
        statusMessage: "Failed to process AI request",
        status: "error",
        data: null,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }
  async fetchAndUpdateFromAiTriggerResponse (data : any) {
    const account_rid = data.company_id;
    
    const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
        let techSummaryPayload ={
     // created_by: userId,
     account_rid:account_rid,
     fiscal_year:"",//need to update
      project_id: data.project_id,
      project_fiscal_rid:data.project_fiscal_rid,
      technical_summary: data.project_summary,
    //  version:"",
      status: data.status,
      entity_transaction_id: data.correlation_id

    }
    //await this.interactionSchemaService.updateQrePercentAndTechSummary(data.qre, accountNumber,data.project_id,techSummaryPayload)
    return {
      statusMessage : "Details updated successfully",
      status : data.status,
      data : data.project_summary
    };
  }

  async processKafkaMessage(message: any): Promise<void> {
    try {
       this.logger.info("Processing Kafka message...", JSON.stringify(message));
      let parsedMessage: any;
      if (typeof message === "string") {
        parsedMessage = JSON.parse(message);
      } else if (message.data !== undefined) {
        parsedMessage = message.data;
      } else {
        parsedMessage = message;
      }
      const { company_id, project_id, type, qre_percent, project_summary, transaction_id, interaction_questions, detailed_breakdown } = parsedMessage.data;
      const { accountNumber } = await this.interactionSchemaService.fetchValidAccountNumberById(company_id);
      if (!accountNumber) {
        this.logger.error("Invalid account ID in Kafka message", company_id);
        return;
      }
      if (parsedMessage.statusCode) {
        if (!company_id || !project_id || !type) {
          this.logger.error("Kafka message missing required fields", parsedMessage);
          return;
        }

        if (type === 'qre_percent') {
          await this.interactionSchemaService.updateQrePercent(qre_percent, accountNumber, project_id, detailed_breakdown, company_id, transaction_id,parsedMessage);
        }
        if (type === "project_summary") {
          await this.interactionSchemaService.updateTechSummary(project_summary, accountNumber, project_id, company_id, transaction_id,parsedMessage);
        }
        if (type === "interaction_questions") {
          const projectInfo = await this.interactionSchemaService.fetchProjectInfo(accountNumber, project_id);
          const statusRid = await this.interactionSchemaService.getInteractionStatusByType(statusAction.DRAFT);
          const questionsWithActionType = Array.isArray(interaction_questions)
            ? interaction_questions.map((q: any) => ({ ...q, action_type: "add" }))
            : [];

          let interactionData = {
            account_rid: company_id,
            project_fiscal_rid: project_id,
            fiscal_year: projectInfo.fiscal_year,
            status_rid: statusRid ?? statusAction.DRAFT,
            project_rid: projectInfo?.project_rid,
            questions: questionsWithActionType,
            interaction_source_rid: interactionSource.AUTO,
            interaction_type_rid: interactionType.RD,
            created_by: process.env.SYSTEM_USER_ID!,
            interaction_level_rid:'Project'
          };
          await this.createInteraction(interactionData, interactionSource.AUTO, process.env.SYSTEM_USER_ID!);
          await this.interactionSchemaService.updateInteractionStatus(accountNumber, parsedMessage)
        }
        if(type === 'data_ingestion')
        {
          await this.interactionSchemaService.updateAIProcessed(accountNumber, project_id,parsedMessage);
        }
      }
      else{
        this.logger.error("Kafka message indicates failure status", JSON.stringify(message));
      }

      this.logger.info(`Processed Kafka message for account: ${company_id}`);
    } catch (err) {
       this.logger.error("Error processing Kafka message", JSON.stringify(err));
    }
  }
  
  async getAllowedExportFields(
      userId: string,
      permission_name: string
    ): Promise<any[]> {
      return this.interactionSchemaService.getAllowedExportFields(userId, permission_name);
    }

  async triggerAiFromScheduler (schedulerRecord : SchedulerExecutions) {
    const mainDb = await this.getMainDb()
    const orgDb = await this.getOrgDb()
    try {
      this.logger.info("AI Trigger Scheduler started")
      let fetchAllParentsAccountsRnumber : any = await mainDb.query(rawQueries.fetchAllParentRNumber())
      for(let account of fetchAllParentsAccountsRnumber[0]) {
        let schemaName = rawQueries.fetchSchemaName(account.r_number);
        console.log("SchemaName : ", schemaName)
        let verifyTableExistsForAttachments : any = await orgDb.query(checkTableExists(schemaName, "attachments"))
        let verifyTableExistsForInteractions : any = await orgDb.query(checkTableExists(schemaName, "interactions"))
        if(verifyTableExistsForInteractions[0][0].exists === true) {
          console.log("verifyTableExistsForInteractions : ", true)
          try {
            const isRecordExists = await this.interactionSchemaService.findTaskRecordExists(schedulerRecord.rid, interactionTaskName.interactionAge)
            if(isRecordExists == null) {
              await this.interactionSchemaService.createSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.interactionAge)
            }
            await fetchInteractionForSentResentStatus(schemaName, mainDb, orgDb)
          } catch (error : any) {
            await this.interactionSchemaService.updateSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.interactionAge, schedulerStatus.Failed, error.message)
          }
          try {
            const isRecordExists = await this.interactionSchemaService.findTaskRecordExists(schedulerRecord.rid, interactionTaskName.interaction)
            if(isRecordExists == null) {
              await this.interactionSchemaService.createSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.interaction)
            }
            let fetchProjectIdsFromInteractions : any = await orgDb.query(fetchProjectInteractionRid(schemaName))
            await this.createPayloadForTriggerAi(fetchProjectIdsFromInteractions[0])
          } catch (error : any) {
            await this.interactionSchemaService.updateSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.interaction, schedulerStatus.Failed, error.message)
          }
        }
        if(verifyTableExistsForAttachments[0][0].exists == true) {
          try {
            console.log("verifyTableExistsForAttachments : ", true)
            const isRecordExists = await this.interactionSchemaService.findTaskRecordExists(schedulerRecord.rid, interactionTaskName.attachments)
            if(isRecordExists == null) {
              await this.interactionSchemaService.createSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.attachments)
            }
            let fetchProjectIdsFromAttachments : any = await orgDb.query(fetchProjectAttachmentsRids(schemaName))
            await this.createPayloadForTriggerAi(fetchProjectIdsFromAttachments[0])
          } catch (error : any) {
            await this.interactionSchemaService.updateSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.attachments, schedulerStatus.Failed, error.message)
          }
        }
      }
      await this.interactionSchemaService.updateSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.attachments, schedulerStatus.Success, '')
      await this.interactionSchemaService.updateSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.interaction, schedulerStatus.Success, '')
      await this.interactionSchemaService.updateSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.interactionAge, schedulerStatus.Success, '')
      await this.interactionSchemaService.updateSchedulerRecords(schedulerRecord.rid, schedulerStatus.Success)
    } catch (error : any) {
      console.log("Scheduler facing error : ", error)
      await this.interactionSchemaService.updateSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.attachments, schedulerStatus.Failed, error.message)
      await this.interactionSchemaService.updateSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.interaction, schedulerStatus.Failed, error.message)
      await this.interactionSchemaService.updateSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.interactionAge, schedulerStatus.Failed, error.message)
      await this.interactionSchemaService.updateSchedulerRecords(schedulerRecord.rid, schedulerStatus.Failed)
    }
  }

  async createPayloadForTriggerAi (data : any) {
    let mappingData : Map<string, {account_rid : string, project_fiscal_rid : string[]}> = new Map()
    if(data.length > 0) {
      for(let items of data) {
        if(!mappingData.has(items.account_rid)) {
          mappingData.set(items.account_rid, {
            account_rid : items.account_rid,
            project_fiscal_rid : [items.project_fiscal_rid]
          })
        } else {
          let existsIds = mappingData.get(items.account_rid)
          if(existsIds && !existsIds?.project_fiscal_rid.includes(items.project_fiscal_rid)) {
            existsIds.project_fiscal_rid.push(items.project_fiscal_rid)
          }
        }
      }
      let payload = {
        data : Array.from(mappingData.values()),
        type : "project"
      }
      console.log("Payload to Send : ", payload)
      await this.triggerAI(payload)
    }
  }

  async sendEmailInBatch () {
    const mainDb = await this.getMainDb();
    let fetchEmailInfo : any = await mainDb.query(rawQueries.fetchEmailInfo);
    console.log(`[BATCH EMAIL] Fetched ${fetchEmailInfo[0].length} unsent emails.`);

    for(let data of fetchEmailInfo[0]) {
      let email_info : {
        email: string;
        name: string | null;
        ccEmails?: string[] | [];
      } = {
        email : data.email,
        name : data.name,
        ccEmails : []
      }
      let accountNumber = data.account_rnumber
      let interaction_rid = data.interaction_rid
      let is_interaction_followup = data.is_interaction_followup
      let userId = data.user_rid
      let project_fiscal_rid = data.project_fiscal_rid
      let accountRid = data.account_rid
      let interactionLevel = data.interaction_level

      // If emailInfo.email is empty, fetch POC email
      let sendEmailInfo = email_info;
      if (!email_info || !email_info?.email) {
        console.log(`[INFO] Fetched fallback email for interaction ${interaction_rid}: ${sendEmailInfo?.email}`);
        if(interactionLevel === 'Account')
        {
           sendEmailInfo = await this.interactionSchemaService.fetchEmailInfoForAccount(accountNumber, accountRid);
        }
        else
        {
            sendEmailInfo = await this.interactionSchemaService.fetchEmailInfo(accountNumber, interaction_rid, project_fiscal_rid, accountRid);
        }
        
      }

      if (!sendEmailInfo?.email || sendEmailInfo?.email == "") {
        console.warn(`[SKIP] No email found for interaction ${interaction_rid}. Skipping.`);
        continue;
      }
       console.log(`[SEND] Sending email to ${sendEmailInfo.email} for interaction ${interaction_rid}.`);

      const [interactionItems, interactionInfo] =
        await Promise.all([
          this.interactionSchemaService.fetchInteractionQuestionsById(
            accountNumber,
            interaction_rid
          ),
          this.interactionSchemaService.fetchInteractionInfo(
            interaction_rid,
            accountNumber
          ),
        ]);
      const interactionLink = await this.generateInteractionLink(
        interaction_rid,
        interactionInfo.accountInfo.account_rid,
        project_fiscal_rid,
        interactionLevel
      );
      const senderEmailInfo = await this.getSenderEmailInfo(accountNumber,interactionInfo.accountInfo.parent_account_rid);
      const excelBuffer = await this.generateExcelBuffer(
        interaction_rid,
        interactionItems,
        interactionInfo
      );
      const excelAttachment = {
        filename: `interaction_${interaction_rid}.xlsx`,
        content: Buffer.from(excelBuffer).toString("base64"),
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
      // Send email
      const emailResponse = await this.sendEmailWithAttachment(
        sendEmailInfo,
        interactionInfo.projectInfo,
        interactionInfo.accountInfo,
        excelAttachment,
        interactionLink,
        senderEmailInfo!,
        interaction_rid,
        is_interaction_followup,
        interactionLevel
      );
      if (emailResponse) {
        console.log(`[SUCCESS] Email sent for interaction ${interaction_rid}.`);
        if(!is_interaction_followup)
        {
          await this.interactionSchemaService.updateInteractionInfo(
          accountNumber,
          interaction_rid,
          statusAction.SENT,
          userId,
          sendEmailInfo,
          interactionLink
        );
        }
        else
        {
          await this.interactionSchemaService.updateInteractionInfoForReminder(
          accountNumber,
          interaction_rid,
          project_fiscal_rid,
          statusAction.SENT,
          userId,
          sendEmailInfo,
          interactionLink
        );
        }
        await this.interactionSchemaService.updateEmailSendFlag(interaction_rid)
        
      } else {
        //need to add logic for sending toPS team
        console.error(`[FAIL] Email failed to send for interaction ${interaction_rid}. Needs manual intervention.`);
      }
    }
    console.log(`[BATCH EMAIL] Finished processing batch.`);
  }
}
