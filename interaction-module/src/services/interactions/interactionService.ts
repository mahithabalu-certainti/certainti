import { Logger } from "winston";
import {
  AllStatusType,
  FourPartAssessmentListResponse,
  FourPartAssessmentRequestPayload,
  FourPartAssessmentResponse,
  ICreateAccountInteraction,
  ICreateInteraction,
  ICreateTemplateInteraction,
  IEmailMessage,
  InteractionStatusUpdateRequest,
  InteractionResponse,
  IProject,
  IUpdateInteraction,
  ParentAccountType,
  UserReturnType,
} from "../../utils/types";
import InteractionSchemaService from "./schemaService";
import { InteractionModelService } from "../interactionModelsService";
import {
  ALPHANUMERIC_CONDITIONS,
  HttpStatus,
  mainTableFilters,
  rawQueries,
  statusAction,
  constants,
  interactionType,
  STATUS_MESSAGE,
  interactionFlag,
  MAIN_SCHEMA_NAME,
  schedulerStatus,
  interactionTaskName,
  interactionSource,
  interactionTemplateName,
  entityTypes,
  eventNames,
  eventTypes,
  interactionAssessmentSourceType,
  FourPartColumns,
  MainTableFilter,
} from "../../utils/constants";
import { Op, QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import {
  checkTableExists,
  fetchAllParentRNumber,
  fetchInteractionForProjectLevelQuery,
  fetchInteractionForSentResentStatus,
  fetchProjectAttachmentsRids,
  fetchProjectInteractionRid,
  fetchStatusIdsForReminderList,
  interactionResponseHistoryByVersion,
  listAllInteractionSummary,
  listAttachments,
  listInteractionHistory,
  listResponseHistory,
  fetchInteractionTemplates,
  fetchKeyContactDetailsForInteractions,
  fetchFourPartAssessment,
  fetchProjectFiscalIds,
  fetchFpaDetails,
} from "../../utils/rawQueries";
import { generateSasUrl } from "../../utils/blob";
import {
  interactionMailTemplate,
  interactionReminderMailTemplate,
  interactionResponseReceivedTemplate,
} from "../../utils/mailTemplate";
import { sendEmailWithAttachment } from "../emailService";
import ExcelJS from "exceljs";
import axios from "axios";
import { Kafka, Producer } from "kafkajs";
import { SchedulerExecutions } from "../../models/schedulerExecution";
import { errorLog, getFiscalEndYear, logMessage, parseFiscalDate } from "../../utils/helpers";
import "moment-timezone";
import moment from "moment";

type filterType = {
  [key: string]: {
    [condition: string]: any;
  };
};
// Assuming there is an interface named IInteractionService to implement
export class InteractionService {
  private interactionSchemaService: InteractionSchemaService;
  private interactionModelService: InteractionModelService; // Assuming this is defined somewhere in your code
  private logger: Logger;
  private producer!: Producer;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

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

      const intLevel =
        await this.interactionSchemaService.getInteractionLevelByRid(
          interactionData?.interaction_level_rid!
        );
      if (intLevel === "Account") {
        return await this.createInteraction(
          interactionData,
          interactionSource,
          userId,
          intLevel
        );
      } else {
        if (
          interactionData.projects === undefined ||
          interactionData.projects.length === 0
        ) {
          return {
            statusCode: HttpStatus.FAILED,
            message: STATUS_MESSAGE.projectRequired,
            data: { interactions: null },
          };
        }
        const { intSource, intType } = await this.getInteractionStatusAndSource(
          interactionSource
        );
        interactionData.interaction_source_rid = intSource || "";
        interactionData.interaction_type_rid = intType || "";

        this.interactionSchemaService.createBulkInteractions(
          accountNumber,
          interactionData,
          userId,
          parentAccountId,
          intLevel!
        );
      }
      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.interactionCreated,
        data: { interactions: null },
      };
    } catch (err) {
     logMessage(`Error creating interaction", ${err}`);
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
    intLevel: string = "Project"
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
      if(interactionData.interaction_assessment_source_rid == undefined) interactionData.interaction_assessment_source_rid = interactionAssessmentSourceType.RD
      const { accountNumber, parentAccountId } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          interactionData.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const { intSource, intType } = await this.getInteractionStatusAndSource(
        interactionSource
      );
      const intResponseSource = await this.getInteractionAssessmentStatus(interactionData.interaction_assessment_source_rid!)
      interactionData.interaction_source_rid = intSource || "";
      interactionData.interaction_type_rid = intType || "";
      interactionData.interaction_assessment_source_rid = intResponseSource || ""

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
        logMessage(`Interaction created successfully, ${interaction.rid}`);
        await this.interactionSchemaService.addInteractionSummary(
          accountNumber,
          interactionData,
          interaction.rid,
          interaction.get("r_number") || "",
          interaction.get("interaction_iteration") || 0,
          interaction.get("parent_interaction_rid") || null
        );
        const userEventInfo:any = await this.interactionSchemaService.fetchUserAndEventInfo({
                                                  userId: userId!,
                                                  eventType: eventTypes.UI_HANDLER
                                                });
        let timelineTypes = ["account"];
        if(intLevel.toLowerCase() === 'project')
        {
          timelineTypes = ["project"]
        }
                        
        await this.interactionSchemaService.createAccountTimelineEntry(accountNumber!, {
                                            created_by: userId!,
                                            account_rid: interactionData.account_rid,
                                            entity_rid: interaction.rid!,
                                            entity_name: entityTypes.INTERACTION,
                                            created_by_name: userEventInfo.full_name,
                                            event_type_rid: userEventInfo.event_type_rid,
                                            event_name: eventNames.CREATE,
                                            descriptions:'',
                                            project_rid: intLevel === 'Project' ? interactionData.project_fiscal_rid : '',
                                          }, timelineTypes);
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
      if (interactionData.status_rid) {
        interactionStatus =
          await this.interactionSchemaService.getInteractionStatusById(
            interactionData.status_rid
          );
      }
      let isEmailRecipientAvailable = false;
      if(intLevel === 'Account')
      {
        isEmailRecipientAvailable = await this.interactionSchemaService.isEmailRecipientAvailableForAccount(accountNumber, interactionData.account_rid);
      }
      else
      {
        isEmailRecipientAvailable = await this.interactionSchemaService.isEmailRecipientAvailable(accountNumber, interactionData.project_fiscal_rid);
      }

      logMessage(`Is email recipient available: ${isEmailRecipientAvailable} for interaction: ${interaction.dataValues.rid} with project fiscal:${interactionData.project_fiscal_rid}`);
      if((interactionStatus === statusAction.DRAFT && (isEmailRecipientAvailable || interactionData.email_info?.email)) || interactionData.trigger_send)
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
      logMessage(`Error creating interaction, ${err}`);
      await transaction.rollback();
       return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.interactionFailed,
        };
    }
  }
  async checkAutoSendEnabled(
    accountNumber: string,
    interactionData: ICreateInteraction,
    interactionId: string,
    userId: string,
    accountRid: string,
    interactionLevel: string,
    parentAccountId: string
  ) {
    try {
      const isParensettingsConfigured = await this.interactionSchemaService.fetchAccountDetails(
        accountNumber,
        parentAccountId,
        accountRid
      );
      logMessage(
        `Auto-send: ${interactionData?.trigger_send ? "enabled" : "disabled"}, Parent settings: ${isParensettingsConfigured ? "enabled" : "disabled"} for interaction ID: ${interactionId}`
      );
      if (interactionData?.trigger_send && isParensettingsConfigured) {
        await this.sendInteraction(
          [
            {
              interaction_rid: interactionId,
              project_fiscal_rid: interactionData.project_fiscal_rid,
              interaction_level: interactionLevel,
            },
          ],
          {
            email: interactionData.email_info?.email || null,
            name: interactionData.email_info?.name || null,
          },
          interactionData.account_rid,
          userId,
          false,
          "Manual-Send"
        );
      } else {
        const isEnabled = await this.interactionSchemaService.isAutoSendInteractionEnabled(
          accountNumber,
          interactionData
        );
       logMessage(
          `Auto-send: ${isEnabled ? "enabled" : "disabled"}, Parent settings: ${isParensettingsConfigured ? "enabled" : "disabled"} for interaction ID: ${interactionId}`
        );
        let maxInteractions = 0;
        let accountInfo = null;
        if (isEnabled && isParensettingsConfigured) {
          accountInfo = await this.interactionSchemaService.fetchAccountInfo(
            accountRid,
            accountNumber
          );
          if (interactionLevel === "Account") {
            maxInteractions = accountInfo?.max_ai_interactions || 0;
          } else {
            const projectInfo =
              await this.interactionSchemaService.fetchProjectInfo(
                accountNumber,
                interactionData.project_fiscal_rid
              );
            maxInteractions = projectInfo?.max_ai_interaction || 0;
          }
          const { AutoSendInteractionAudit } =
            await this.interactionModelService.getModels(accountNumber);
          const ismaxInteractionsSent =
            await this.checkMaxQuarterlyInteractions(
              AutoSendInteractionAudit,
              interactionData.project_fiscal_rid,
              maxInteractions,
              accountInfo,
              interactionLevel,
              interactionData.account_rid
            );
          if (!ismaxInteractionsSent) return;
          await this.sendInteraction(
            [
              {
                interaction_rid: interactionId,
                project_fiscal_rid: interactionData.project_fiscal_rid,
                interaction_level: interactionLevel,
              },
            ],
            {
              email: interactionData.email_info?.email || null,
              name: interactionData.email_info?.name || null,
            },
            interactionData.account_rid,
            userId,
            false,
            "Auto-Send"
          );
        }
      }
    } catch (err) {
      logMessage(`Error in checkAutoSendEnabled: ${err}`);
    }
  }
  async checkMaxQuarterlyInteractions(
    AiSendInteraction: any,
    projectFiscalRid: string,
    maxInteractions: number,
    accountInfo: { fiscal_start_date: string; fiscal_end_date: string },
    interactionLevel: string,
    accountRid: string
  ) {
    const now = new Date();
    // Parse fiscal start and end month/day
    // Format: MM/DD (e.g., "01/12" for Jan 12)
    
    logMessage(`Checking max quarterly interactions for projectFiscalRid: ${projectFiscalRid} with maxInteractions: ${maxInteractions}, accountRid: ${accountRid}, accountInfo: ${JSON.stringify(accountInfo)}`);
    function parseFiscalDate(dateStr: string, year: number): Date {
      const [mmRaw, ddRaw] = dateStr.split("/");
      const mm = mmRaw !== undefined ? Number(mmRaw) : undefined;
      const dd = ddRaw !== undefined ? Number(ddRaw) : undefined;
      if (
        mm === undefined ||
        dd === undefined ||
        isNaN(mm) ||
        isNaN(dd) ||
        mm < 1 ||
        mm > 12 ||
        dd < 1 ||
        dd > 31
      ) {
        logMessage(`Invalid fiscal date format: ${dateStr}`);
        throw new Error(`Invalid fiscal date format: ${dateStr}`);
      }
      return new Date(year, mm - 1, dd);
    }
    // Get fiscal year for current date
    let fiscalStart = parseFiscalDate(
      accountInfo.fiscal_start_date,
      now.getFullYear()
    );
    let fiscalEnd = parseFiscalDate(
      accountInfo.fiscal_end_date,
      now.getFullYear()
    );
    if (now < fiscalStart) {
      fiscalStart = parseFiscalDate(
        accountInfo.fiscal_start_date,
        now.getFullYear() - 1
      );
      fiscalEnd = parseFiscalDate(
        accountInfo.fiscal_end_date,
        now.getFullYear()
      );
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
        logMessage(`Current quarter: Start = ${quarterStart.toISOString()}, End = ${quarterEnd.toISOString()}`);
        break;
      }
    }
    if (!quarterStart || !quarterEnd) {
      // Fallback: use fiscal year start/end
      quarterStart = fiscalStart;
      quarterEnd = fiscalEnd;
      logMessage(`Fallback to fiscal year: Start = ${quarterStart.toISOString()}, End = ${quarterEnd.toISOString()}`);
    }
    let sentCount = 0;
    if (interactionLevel === "Account") {
      sentCount = await AiSendInteraction.count({
        where: {
          account_rid: accountRid,
          project_fiscal_rid: null,
          interaction_level: "Account",
          created_datetime: {
            [Op.between]: [quarterStart, quarterEnd],
          },
        },
      });
    } else {
      sentCount = await AiSendInteraction.count({
      where: {
        project_fiscal_rid: projectFiscalRid,
        interaction_level:"Project",
        created_datetime: {
          [Op.between]: [quarterStart, quarterEnd]
        }
      }
    });
    }  
    logMessage(`Sent count for the current quarter: ${sentCount} ${maxInteractions} ${sentCount >= maxInteractions} for ${projectFiscalRid}`);
    if (sentCount >= maxInteractions) {
      logMessage(`Max interactions sent for quarter (${sentCount}) reached for project_fiscal_rid: ${projectFiscalRid}`);
      return false;
    }
    return true;
  }
  async getInteractionStatusAndSource(interactionSource: string) {
    const intSource =
      await this.interactionSchemaService.getInteractionSourceByType(
        interactionSource
      );
    const intType = await this.interactionSchemaService.getInteractionType(
      interactionType.RD
    );

    return { intSource, intType };
  }
  async getInteractionAssessmentStatus(interactionSource: string) {
    const intSource =
      await this.interactionSchemaService.getInteractionAssessmentSourceByType(
        interactionSource
      );

    return intSource!
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
      const { accountNumber, parentAccountId, accountName } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          interactionData?.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      let interactionStatus;
      if (interactionData.status_rid) {
        interactionStatus =
          await this.interactionSchemaService.getInteractionStatusById(
            interactionData.status_rid
          );
      }
       const intLevel =
          await this.interactionSchemaService.getInteractionLevelByRid(
            interactionData?.interaction_level_rid!
          );
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
        const userEventInfo:any = await this.interactionSchemaService.fetchUserAndEventInfo({
                                                  userId: userId!,
                                                  eventType: eventTypes.UI_HANDLER
                                                });
        let timelineTypes = ["account"];
        let projectFiscalRid = interactionData.project_fiscal_rid;
        if(intLevel?.toLowerCase() === 'project')
        {
          timelineTypes = ["project"];
          const projectInfo = await this.interactionSchemaService.fetchProjectInfo(accountNumber, interactionData.project_fiscal_rid);
          projectFiscalRid = projectInfo?.project_fiscal_rid || interactionData.project_fiscal_rid;

        }
                        
        await this.interactionSchemaService.createAccountTimelineEntry(accountNumber!, {
                                            created_by: userId!,
                                            account_rid: interactionData.account_rid,
                                            entity_rid: interactionData.interaction_rid!,
                                            entity_name: entityTypes.INTERACTION,
                                            created_by_name: userEventInfo.full_name,
                                            event_type_rid: userEventInfo.event_type_rid,
                                            event_name: eventNames.UPDATE,
                                            descriptions:'',
                                            project_rid: interactionData?.interaction_level?.toLowerCase() === 'project' ? projectFiscalRid : '',
                                          }, timelineTypes);
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
      if (interactionData.trigger_send === true) {
        
        const isEmailRecipientAvailable =
          await this.interactionSchemaService.isEmailRecipientAvailable(
            accountNumber,
            interactionData.interaction_rid
          );
        if (
          interactionStatus === statusAction.DRAFT &&
          isEmailRecipientAvailable
        ) {
          await this.checkAutoSendEnabled(
            accountNumber,
            interactionData,
            interactionData.interaction_rid,
            userId,
            interactionData.account_rid,
            intLevel!,
            parentAccountId
          );
        } else {
          if (
            !isEmailRecipientAvailable &&
            interactionStatus === statusAction.DRAFT
          ) {
            return {
              statusCode: HttpStatus.SUCCESS,
              message: STATUS_MESSAGE.interactionCreatedButNoEmailRecipient,
              data: {
                interactions: null,
              },
            };
          }
        }
      }
      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.interactionUpdated,
        data: {
          interactions: null,
        },
      };
    } catch (err) {
      errorLog("Error updating resource", (err as Error).message);
      await transaction.rollback();
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
        logMessage(`Invalid account ID ${interactionData?.account_rid}`);
        throw new Error("Invalid account ID");
      }

      let interactionStatus;
      if (interactionData.status_rid) {
        interactionStatus =
          await this.interactionSchemaService.getInteractionStatusById(
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
      errorLog("Error updating interaction", (err as Error).message);
      await transaction.rollback();
       return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.interactionUpdateFailed,
        };
    }
  }

  async updateTechSummaryContext(
    summaryContext: string,
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
        logMessage(`Invalid account ID ${accountId}`);
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
      errorLog("Error updating interaction", (err as Error).message);
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
    const mainDbSequelize = await this.getMainDb();
    const orgDbSequelize = await this.getOrgDb();
    try {
      const { accountNumber, accountName } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          interactionData?.account_rid
        );

      if (!accountNumber) {
        logMessage(`Invalid account ID ${interactionData?.account_rid}`);
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
        parallelTasks.push(this.triggerAI(req,userId, entityTypes.AUTO_RD_ASSESSMENT));
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
      if(updatedInteractionResponse.status === statusAction.RESPONSE_RECEIVED) {
        const fetchInteractionDetails: any =
          await this.interactionSchemaService.fetchInteractionDetailsById(
            accountNumber,
            interactionData.interaction_rid
          );
        if (fetchInteractionDetails) {
          const professionalServiceConsultantRid: any =
            await mainDbSequelize.query(
              rawQueries.fetchProfServConsultantRid()
            );
          if (professionalServiceConsultantRid[0].length > 0) {
            let schemaName = rawQueries.fetchSchemaName(accountNumber);
            const fetchProfSerConsultantId: any = await orgDbSequelize.query(
              rawQueries.fetchProfServConsultantDetails(
                schemaName,
                interactionData.account_rid,
                professionalServiceConsultantRid[0][0].rid
              )
            );
            const consultantObj = fetchProfSerConsultantId && fetchProfSerConsultantId[0] && fetchProfSerConsultantId[0][0] ? fetchProfSerConsultantId[0][0] : null;
            if (consultantObj !== null && consultantObj !== undefined) {
              const interactionLevel: any = await mainDbSequelize.query(
                rawQueries.fetchInteractionLevelById(
                  fetchInteractionDetails.interaction_level_rid
                )
              );
              const [interactionItems, interactionInfo] = await Promise.all([
                this.interactionSchemaService.fetchInteractionQuestionsById(
                  accountNumber,
                  interactionData.interaction_rid
                ),
                this.interactionSchemaService.fetchInteractionInfo(
                  interactionData.interaction_rid,
                  accountNumber
                ),
              ]);
              const senderEmailInfo = await this.getSenderEmailInfo(
                interactionInfo.accountInfo.parent_account_rid,
                interactionInfo.accountInfo.account_rid
              );
              const interactionLink = await this.generateInteractionLink(
                interactionData.interaction_rid,
                interactionInfo.accountInfo.account_rid,
                interactionData.project_fiscal_rid,
                interactionLevel[0][0].interaction_level_name
              );
              const excelBuffer = await this.generateExcelBuffer(
                interactionData.interaction_rid,
                interactionItems,
                interactionInfo
              );
              const excelAttachment = {
                filename: `interaction_${interactionData.interaction_rid}.xlsx`,
                content: Buffer.from(excelBuffer).toString("base64"),
                contentType:
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              };
              let project;
              let account;
              let recipient;
              if (interactionLevel[0][0].interaction_level_name === "Project") {
                const fetchProjectDetails: any = await orgDbSequelize.query(
                  rawQueries.fetchProjectDetails(
                    schemaName,
                    interactionData.project_fiscal_rid
                  )
                );
                project = {
                  project_id: fetchProjectDetails[0][0].rid,
                  project_name: fetchProjectDetails[0][0].project_name,
                  project_code: fetchProjectDetails[0][0].project_code,
                  fiscalYear: fetchProjectDetails[0][0].fiscal_year,
                };
                account = {
                  account_name: accountName,
                };
                recipient = {
                  name: fetchProfSerConsultantId[0][0].key_contact_name,
                  email: fetchProfSerConsultantId[0][0].key_contact_email,
                };
              } else {
                recipient = {
                  name: fetchProfSerConsultantId[0][0].key_contact_name,
                  email: fetchProfSerConsultantId[0][0].key_contact_email,
                };
                account = {
                  account_name: accountName,
                };
                project = {
                  project_id: "",
                  project_name: "",
                  project_code: "",
                  fiscalYear: 0,
                };
              }
              const sendEmailResult = await this.sendEmailWithAttachment(
                recipient,
                project,
                account,
                excelAttachment,
                interactionLink,
                senderEmailInfo!,
                fetchInteractionDetails.r_number,
                false,
                interactionLevel[0][0].interaction_level_name,
                true,
                userId,
                accountNumber,
                interactionData.account_rid




              );
            }
            else{
              logMessage(`No professional services consultant found for account ID ${interactionData.account_rid}`);
              /*Notification part will be implemented later if there is no professional services consultant added in account*/
            }
          }
        }        
      }
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactions: null,
        },
      };
    } catch (err) {
      logMessage(`Error updating interaction response, ${err}`);
      await transaction.rollback();
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.responseUpdateFailed,
      };
    }
  }

  /**
   * Retrieves a paginated list of technical summaries based on provided filters and sorting options.
   *
   * @param {any} data - The input data containing account_rid, project_fiscal_rid, sorting, and other parameters.
   * @param {number} page - The page number for pagination.
   * @param {number} limit - The maximum number of items to return per page.
   * @param {Record<string, any>} filters - Filtering criteria for the technical summary list.
   * 
   * @returns {Promise<{
   *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { techSummaryInfo: any; count: number };
  * }>} - The response containing status, message, optional error message, and data with technical summary info and count.
  * 
  * @throws Throws a service error if any exception occurs during execution.
  * 
  * @description
  * This function validates the account ID, fetches the technical summary from the interaction schema service,
  * and returns the paginated results along with a total count. If the account ID or technical summary is invalid,
  * appropriate failure responses are returned.
  */ 
  async listTechnicalSummary(
    data: any,
    page: number,
    limit: number,
    filters: Record<string, any>
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { techSummaryInfo: any; count: number };
  }> {
    try {
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          data.account_rid
        );

      if (!accountNumber) {
        logMessage(`Invalid account ID ${data.account_rid}`);
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
          "list",
          data?.case_rid,
          data.account_rid,
          data.summaryType
        );

      if (!techSummary) {
        logMessage(`No technical summary found for account ID ${data.account_rid}`);
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
          count: techSummary.count,
        },
      };
    }
    catch (err) {
      logMessage(`Error listing technical summary, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

  async listAccountInteractions(
    data: any,
    page: number,
    limit: number,
    filters: Record<string, any>
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { accountInteractions: any; count: number };
  }> {
    try {
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          data.account_rid
        );

      if (!accountNumber) {
        logMessage(`Invalid account ID ${data.account_rid}`);
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
        logMessage(`No account interactions found for account ID ${data.account_rid}`);
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
          count: response.count,
        },
      };
    }
    catch (err) {
      logMessage(`Error listing account interactions, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

  /**
 * Exports the complete technical summary data based on provided filters and sorting options.
 *
 * @param {any} data - The input data containing account_rid, project_fiscal_rid, sorting, and other parameters.
 * @param {Record<string, any>} filters - Filtering criteria for the technical summary export.
 * 
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { techSummaryInfo: any; count: number };
  * }>} - The response containing status, message, optional error message, and data with the full technical summary info and count.
  * 
  * @throws Throws a service error if any exception occurs during execution.
  * 
  * @description
  * This function validates the account ID, fetches the full technical summary (without pagination)
  * from the interaction schema service with the mode set to "download", and returns the results.
  * If the account ID or technical summary is invalid, appropriate failure responses are returned.
  */ 
  async exportTechnicalSummary(
    data: any,
    filters: Record<string, any>
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { techSummaryInfo: any; count: number };
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
          "download",
          data.case_rid,
          data.account_rid
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
          count: techSummary.count,
        },
      };
    }
    catch (err) {
      logMessage(`Error exporting technical summary, ${err}`);
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
      logMessage(`Error fetching interaction details, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

  async getKeyContactsByCaseId(
    caseRid: string,
    accountRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { keyContacts: any };
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

      const keyContacts =
        await this.interactionSchemaService.fetchKeyContactsByCaseId(
          accountNumber,
          caseRid
        );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          keyContacts,
        },
      };
    } catch (err) {
      logMessage(`Error fetching key contacts, ${err}`);
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
        logMessage(`No interaction details found for interaction ID ${interactionRid}`);
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
      logMessage(`Error creating resource, ${err}`);
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
    data?: any;
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
        logMessage(`No technical summary found for ID ${techSummaryId}`);
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid technical summary ID",
        };
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: techSummaryDetails,
      };
    } catch (err) {
      logMessage(`Error fetching technical summary details, ${err}`);
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
        logMessage(`Invalid account ID ${accountRid}`);
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
      logMessage(`Error fetching interaction questions, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

  async getInteractionStatus(
    status_scope?: string,
    currentStatus?: string,
    reminderFlag?: boolean
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionStatus: any };
  }> {
    try {
      const interactionStatus =
        await this.interactionSchemaService.getInteractionStatus(
          status_scope,
          currentStatus,
          reminderFlag
        );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactionStatus,
        },
      };
    } catch (err) {
      logMessage(`Error fetching interaction status, ${err}`);
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
      logMessage(`Error fetching interaction types, ${err}`);
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
      logMessage(`Error fetching interaction level, ${err}`);
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
      logMessage(`Error fetching interaction source, ${err}`);
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
      logMessage(`Error fetching response source, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

  /**
   * Sends interaction emails based on the provided interactions array and email information.
   * Handles inserting email info, creating auto-send entries, and updating interaction status
   * and email recipient details in both main and organization databases.
   *
   * @param {Array<{interaction_rid: string; interaction_level: string; project_fiscal_rid: string}>} interactions
   *   - Array of interaction objects containing:
   *     - interaction_rid: The interaction record ID.
   *     - interaction_level: The level of the interaction (e.g., "Account", "Project").
   *     - project_fiscal_rid: The fiscal project record ID.
   *
   * @param {{email: string | null; name: string | null; ccEmails?: string[]}} email_info
   *   - Email information including:
   *     - email: Recipient email address (nullable).
   *     - name: Recipient name (nullable).
   *     - ccEmails: Optional array of CC email addresses.
   *
   * @param {string} accountRid - The account record ID.
   * @param {string} userId - The user ID performing the send operation.
   * @param {boolean} is_interaction_followup - Flag indicating if this is a follow-up interaction.
   * @param {string} [type=interactionSource.MANUAL] - The type of interaction source (default is 'MANUAL').
   *
   * @returns {Promise<{
   *   statusCode: number;
    *   message: string;
    *   errorMessage?: string;
    *   data?: { interactionResponse: any[] };
    * }>} Promise resolving with the status, message, and optionally interaction response details.
    *
    * @throws Throws a service error if any step fails during the send process.
    */ 
  async sendInteraction(
    interactions: {
      interaction_rid: string;
      interaction_level: string;
      project_fiscal_rid: string;
    }[],
    email_info: {
      email: string | null;
      name: string | null;
      ccEmails?: string[] | [];
    },
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
      const mainDb = await this.getMainDb();
      const orgDb = await this.getOrgDb();
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          accountRid
        );
      if (!accountNumber) {
        // return {
        //   statusCode: HttpStatus.FAILED,
        //   message: HttpStatus.FAILED_MESSAGE,
        //   errorMessage: "Invalid account ID",
        // };
      }

      const interactionResponse: any[] = [];
      const schemaName = rawQueries.fetchSchemaName(accountNumber);

      const fetchInQueueStatus: any = await mainDb.query(
        rawQueries.fetchInteractionQueueStatus()
      );

      for (const { interaction_rid, project_fiscal_rid, interaction_level } of interactions) {
        let data : any = {}
        let email : string;
        let name : string;
        data.account_rid = accountRid
        data.project_fiscal_rid = project_fiscal_rid,
        data.account_rnumber = accountNumber,
        data.interaction_rid = interaction_rid
        data.user_rid = userId
        data.email = email_info?.email === "" ? null : email_info?.email
        data.name = email_info?.name === "" ? null : email_info.name
        data.is_interaction_followup = is_interaction_followup
        data.interaction_level = interaction_level
        if(type === 'Auto-Send')
        {
          await this.interactionSchemaService.createAutoSendInteractionEntry(accountNumber, interaction_rid, project_fiscal_rid, email_info,accountRid,interaction_level);
        }
        logMessage(`Interaction queued for sending: ${interaction_rid}, ${fetchInQueueStatus[0][0].rid}`);
        if(!is_interaction_followup){
        if(interaction_level.toLowerCase() === 'account') {
          const fetchResNameEmail : any = await orgDb.query(rawQueries.fetchKeyContactForInteraction(schemaName, data.account_rid))
            if(fetchResNameEmail[0].length > 0 || data.email !== "" && data.email !== null && data.email !== undefined) {
            if(data.email !== "" && data.email !== null && data.email !== undefined && data.name !== "" && data.name !== null && data.name !== undefined) {
              email = data.email;
              name = data.name;
          } 
          else {
              email = fetchResNameEmail[0][0].key_contact_email
              name = fetchResNameEmail[0][0].key_contact_name
          }
          logMessage(`Email info to be sent: ${JSON.stringify(data)}`);
          await this.interactionSchemaService.insertEmailInfoDatas(data);
          await orgDb.query(rawQueries.updateInteractionStatusAndResEmailName(schemaName, fetchInQueueStatus[0][0].rid, interaction_rid, email, name))
          await mainDb.query(rawQueries.updateInteractionSummaryStatusAndResEmailName(fetchInQueueStatus[0][0].rid, interaction_rid, name, email))
          }
        } 
        else {
          const fetchResNameEmail : any = await orgDb.query(rawQueries.fetchKeyContactForInteraction(schemaName, project_fiscal_rid))
          if(fetchResNameEmail[0].length > 0 || data.email !== "" && data.email !== null && data.email !== undefined) {
            if(data.email !== "" && data.email !== null && data.email !== undefined && data.name !== "" && data.name !== null && data.name !== undefined) {
            email = data.email;
            name = data.name;
          } 
          else {
            email = fetchResNameEmail[0][0].key_contact_email
            name = fetchResNameEmail[0][0].key_contact_name
          
          }
          logMessage(`Email info to be sent: ${JSON.stringify(data)}`);
          await this.interactionSchemaService.insertEmailInfoDatas(data);
          await orgDb.query(rawQueries.updateInteractionStatusAndResEmailName(schemaName, fetchInQueueStatus[0][0].rid, interaction_rid, email, name))
          await mainDb.query(rawQueries.updateInteractionSummaryStatusAndResEmailName(fetchInQueueStatus[0][0].rid, interaction_rid, name, email))
          }
        }
      }
      else
      {
        logMessage(`Email info to be sent: ${JSON.stringify(data)}`);
        await this.interactionSchemaService.insertEmailInfoDatas(data);
        await orgDb.query(rawQueries.updateInteractionStatus(schemaName, fetchInQueueStatus[0][0].rid, interaction_rid))
        await mainDb.query(rawQueries.updateInteractionSummaryStatus(fetchInQueueStatus[0][0].rid, interaction_rid))
      }
      interactionResponse.push({
        interactionRid: interaction_rid,
      });
    }
    return {
      statusCode: HttpStatus.SUCCESS,
      message: "Interaction has been sent successfully",
      data: { interactionResponse },
    };
    } catch (err) {
      logMessage(`Error sending interaction: ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

  async getSenderEmailInfo(
    parentAccountRid: string | null,
    accountRid: string
  ) {
    if (!parentAccountRid) {
      return null;
    }
    const { accountNumber } =
      await this.interactionSchemaService.fetchValidAccountNumberByIdForEmail(
        accountRid
      );
    if (!accountNumber) {
      return null;
    }
    // Fetch sender email info from the database or another service
    const senderEmailInfo =
      await this.interactionSchemaService.fetchSenderEmailInfoByAccountId(
        accountNumber,
        parentAccountRid
      );
    return senderEmailInfo ?? null;
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
    worksheet.addRow([
      "Record ID",
      "Questions",
      "Answers",
      "Notes",
      "Question No",
    ]);
    worksheet.getRow(6).eachCell((cell) => {
      cell.font = { bold: true };
      cell.protection = { locked: true };
    });

    worksheet.columns = [
      { key: "record id", width: 15 },
      { key: "question", width: 50 },
      { key: "answer", width: 50 },
      { key: "notes", width: 30 },
      { key: "question no", width: 15 },
    ];

    // Add question rows
    let sequenceNo : number = 0;
    interactionItems.forEach((item: any) => {
      sequenceNo = sequenceNo + 1
      const plain = item.get ? item.get({ plain: true }) : item;
      const row = worksheet.addRow({
        "record id": `Q${sequenceNo}`,
        question: plain.question,
        answer: "",
        notes: "",
        "question no": plain.question_seq_num
      });

      // Lock specific columns right away
      row.getCell(1).protection = { locked: true };
      row.getCell(2).protection = { locked: true };
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
    emailInfo: { name: string | null; email: string; ccEmails?: string[] | [] },
    projectInfo: {
      project_id: string;
      project_name: string;
      project_code: string;
      fiscalYear: number;
    },
    accountInfo: { account_name: string },
    excelAttachment: { filename: string; content: string; contentType: string },
    interactionLink: string,
    senderEmailInfo: {
      email: string;
      clientId: string;
      tenantId: string;
      clientSecret: string;
    },
    interactionRid: string,
    is_interaction_followup: boolean,
    interactionLevel: string,
    isResponseReceived: boolean,
    createdBy: string,
    accountNumber: string,
    data: any,
  ) {
    let emailResponse = false;
    try {
       let templateName ="";
       if(interactionLevel.toLowerCase() === 'project') {
        templateName = interactionTemplateName.interactionProject
       } else {
        templateName = interactionTemplateName.interactionAccount
       }
      let emailPreview = await this.interactionSchemaService.getTemplateDetailsByCategory(templateName);
      const emailSubject = await this.interactionSchemaService.fetchEmailSubjectPrefix();
      let emailPrefix  = emailSubject?.interaction_email_subject || '';;
      if (is_interaction_followup) {
          emailPrefix = emailSubject?.interaction_remainder_email_subject || '';
         if(interactionLevel.toLowerCase() === 'project') {
        templateName = interactionTemplateName.interactionProjectReminder
       } else {
        templateName = interactionTemplateName.interactionAccountReminder
       }
      emailPreview = await this.interactionSchemaService.getTemplateDetailsByCategory(templateName);
      
      }
      if (isResponseReceived) {
         if(interactionLevel.toLowerCase() === 'project') {
        templateName = interactionTemplateName.interactionProjectUpdate
       } else {
        templateName = interactionTemplateName.interactionAccountUpdate
       }
         emailPreview = await this.interactionSchemaService.getTemplateDetailsByCategory(templateName);
      }
      let  emailContent = {
          message: {
          subject :  this.replacePlaceholders(emailPreview.subject, emailInfo,projectInfo, accountInfo, interactionLink,emailPrefix,interactionRid, interactionLevel),
          body: {
              contentType: "HTML",
              content:this.replacePlaceholders(emailPreview.body_html, emailInfo, projectInfo, accountInfo,interactionLink,emailPrefix, interactionRid, interactionLevel),
            },
        toRecipients: [
              {
                emailAddress: {address: emailInfo.email,},
              },
            ],
          ccRecipients: emailInfo.ccEmails && emailInfo.ccEmails.length > 0
            ? emailInfo.ccEmails.map(email => ({
            emailAddress: { address: email }
          }))
        : [],
        },
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
        senderEmailInfo: senderEmailInfo,
      });
      const userEventInfo:any = await this.interactionSchemaService.fetchUserAndEventInfo({
                                                  userId: createdBy!,
                                                  eventType: eventTypes.UI_HANDLER
                                                });
        let timelineTypes = ["account"];
        if(interactionLevel.toLowerCase() === 'project')
        {
          timelineTypes = ["project"]
        }
        let eventName = eventNames.SENT;
        if(is_interaction_followup)
        {            
          eventName = eventNames.REMAINDER
        }
        if(data.interaction_reinitiated)
        {
          eventName = eventNames.REINITIATED
        }             
        await this.interactionSchemaService.createAccountTimelineEntry(accountNumber!, {
                                            created_by: createdBy!,
                                            account_rid: data.account_rid!,
                                            entity_rid: interactionRid!,
                                            entity_name: entityTypes.INTERACTION,
                                            created_by_name: userEventInfo.full_name,
                                            event_type_rid: userEventInfo.event_type_rid,
                                            event_name: data.is_interaction_followup ? eventNames.REMAINDER : eventNames.SENT,
                                            descriptions: data.r_number + ' to ' + emailInfo.email,
                                            project_rid: interactionLevel?.toLowerCase() === 'project' ? data?.project_fiscal_rid : null,
                                          }, timelineTypes);
      return emailResponse;
    } catch (error) {
      logMessage(`Error sending email: ${error}`);
      return emailResponse;
    }
  }

    replacePlaceholders(
        template: string,
        emailInfo: Record<string, any>,
        projectInfo: Record<string, any>,
        accountInfo: Record<string, any>,
        interactionLink: string,
        emailPrefix: string,
        interactionRid?: string,
        interactionLevel?: string,
        
      ): string {
        return template.replace(/{{(.*?)}}/g, (_: string, key: string) => {
          const raw = key.trim();
          const normalized = raw.toLowerCase().replace(/\s+/g, "_");
          const noUnderscore = normalized.replace(/_/g, "");
          // Helper to check in an object
          const checkObj = (obj: Record<string, any>) => {
            if (!obj) return undefined;
            if (raw in obj && obj[raw] != null) return obj[raw];
            if (normalized in obj && obj[normalized] != null) return obj[normalized];
            if (noUnderscore in obj && obj[noUnderscore] != null) return obj[noUnderscore];
            return undefined;
          };
          // Dynamic special fields mapping
          const specialFields: Record<string, (args: any) => any> = {
            fiscalyear: ({ projectInfo }) => projectInfo && projectInfo.fiscalYear != null ? projectInfo.fiscalYear : "",
            interactionlink: ({ interactionLink }) => interactionLink ?? "",
            interactionrid: ({ interactionRid }) => interactionRid ?? "",
            interactionlevel: ({ interactionLevel }) => interactionLevel ?? "",
            fiscalYear: ({ projectInfo }) => projectInfo && projectInfo.fiscalYear != null ? projectInfo.fiscalYear : "",
          };
          // Normalize key for dynamic check
          const specialKey = noUnderscore.toLowerCase();
          if (specialFields[specialKey]) {
            return specialFields[specialKey]({
              emailInfo,
              projectInfo,
              accountInfo,
              interactionLink,
              interactionRid,
              interactionLevel
            });
          }
          // Check in all provided objects in order
          let val =
            checkObj(emailInfo) ??
            checkObj(projectInfo) ??
            checkObj(accountInfo);
          if (val !== undefined) return val;
          
          // Use automated key matching for special placeholders
          const matchesKey = (keyList: string[]) =>
            keyList.some(
              (k) =>
                raw === k ||
                normalized === k.toLowerCase().replace(/\s+/g, "_") ||
                noUnderscore === k.toLowerCase().replace(/\s+/g, "_").replace(/_/g, "")
            );

          if (matchesKey(["name", "recipient name", "Recipient Name"]) && emailInfo && "name" in emailInfo) {
            return emailInfo.name ?? "";
          }
          if (matchesKey(["Interaction Id"])) {
            return interactionRid ?? "";
          }
          if (matchesKey(["interactionLevel"])) {
            return interactionLevel ?? "";
          }
          if (matchesKey(["emailPrefix"])) {
            return emailPrefix ?? "";
          }
          return "";
        });
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
    if (!this.mainDbSequelize)
      this.mainDbSequelize = await initMainDbSequelize();
    return this.mainDbSequelize;
  }
  private async getOrgDb() {
    if (!this.orgDbSequelize) this.orgDbSequelize = await initOrgSequelize();
    return this.orgDbSequelize;
  }

  // Implement all methods required by IInteractionService
  // Example method (replace with actual interface methods)
  public async interact(): Promise<void> {
   logMessage("Interact method called.");
    // Implementation here
  }

  /**
   * Retrieves a filtered and paginated list of interaction records for a given project and account,
   * based on user access, reminder filters, and other input criteria.
   *
   * This function:
   * - Determines the user's access scope and role.
   * - Optionally applies filters for reminder-specific interactions.
   * - Builds dynamic query parameters for filtering by creator, modifier, source, and sorting options.
   * - Fetches and maps related metadata (statuses, types, sources, users, etc.).
   * - Applies additional alphanumeric condition filters (equals, notEquals, contains, isEmpty).
   * - Paginates and sorts the final result set.
   * - Returns interaction data along with key contact details, if available.
   *
   * @param {any} data - Request body containing pagination, filters, sorting, and interaction context.
   * @param {string} userId - The ID of the user making the request.
   * @param {string} apiType - Type of API call (e.g., 'list' or 'export') to determine pagination behavior.
   * @param {boolean} reminderSpecificList - Flag indicating whether to apply reminder-specific filters.
   * @param {string[]} statusIdsForReminderList - List of status IDs relevant for reminders.
   *
   * @returns {Promise<any>} An object containing status, metadata, and filtered interaction data.
   */
  async listInteractionPrjAccount(
    data: any,
    userId: string,
    apiType: string,
    reminderSpecificList: boolean,
    statusIdsForReminderList: string[]
  ): Promise<any> {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    const userGroupType = await this.interactionSchemaService.getUserGroupType(
      userId
    );
    const userProfileType =
      await this.interactionSchemaService.getUserProfileType(userId);
    const isCustomGlobal = userGroupType === "DEFAULT";
    const isDefaultParent = userGroupType === "AUTO_ASSIGNED_PARENT";
    const isPOCProfile =
      userProfileType?.profileName === "Project Point of Contact";
    let accessibleIds: string[] = [];
    let reminderFlag: boolean;
    let reminderIds: string[];
    if (reminderSpecificList) {
      reminderFlag = true;
      reminderIds = statusIdsForReminderList;
    } else {
      reminderFlag = false;
      reminderIds = [];
    }
    if (!isCustomGlobal) {
      accessibleIds =
        await this.interactionSchemaService.getAccessibleProjectIds(
          userId,
          isDefaultParent,
          isPOCProfile,
          userProfileType?.email,
          isCustomGlobal
        );
      if (accessibleIds.length === 0) {
        return {
          statusCodeValue: HttpStatus.NOT_FOUND_MESSAGE,
          data: [],
        };
      }
    }

    if (isCustomGlobal && isPOCProfile) {
      accessibleIds =
        await this.interactionSchemaService.getAccessibleProjectIds(
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
    logMessage(`Accessible Project Fiscal Ids: ${JSON.stringify(accessibleIds)} userId: ${userId}, isDefaultParent: ${isDefaultParent}, isPOCProfile: ${isPOCProfile}, isCustomGlobal: ${isCustomGlobal}`);

    let fetchParentAccount: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(
      fetchParentAccount[0][0].r_number
    );
    let createdByFilter;
    let createdByConditions;
    let modifiedByFilter;
    let modifiedByConditions;
    let sourceFilter;
    let sourceConditions;
    let filterKeyName;
    let disablePagination: boolean = false;
    let totalResults: number = 0;

    const detectConditions = (filters: any) => {
      if (!filters) return null;
      for (let conditions of Object.values(ALPHANUMERIC_CONDITIONS)) {
        if (Object.keys(filters).includes(conditions)) return conditions;
      }
      return null;
    };
    if (data.filters?.created_user_name) {
      createdByFilter = data.filters.created_user_name;
      createdByConditions = detectConditions(createdByFilter);
    }
    if (data.filters?.updated_user_name) {
      modifiedByFilter = data.filters.updated_user_name;
      modifiedByConditions = detectConditions(modifiedByFilter);
    }
    if (data.filters?.interaction_source_name) {
      sourceFilter = data.filters.interaction_source_name;
      sourceConditions = detectConditions(sourceFilter);
    }
    if (data.filters?.interaction_source_name) {
      sourceFilter = data.filters.interaction_source_name;
      sourceConditions = detectConditions(sourceFilter);
    }

    [
      "created_user_name",
      "updated_user_name",
      "interaction_source_name",
    ].forEach((key) => {
      if (data.filters[key]) {
        disablePagination = true;
        delete data.filters[key];
      }
    });
    if (mainTableFilters[data.sort] !== undefined) {
      disablePagination = true;
    }
    if (apiType === "export" || apiType === "graphql") disablePagination = true;
    const [activeStatus]: any[] = await mainDb.query(
      rawQueries.fetchActiveStatusByType("Active"),
      { type: "SELECT" }
    );

    const result: any = await orgDb.query(
      fetchInteractionForProjectLevelQuery(
        data.account_rid,
        data.project_rid,
        data.project_fiscal_rid,
        data.case_rid,
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
        activeStatus?.rid,
        reminderFlag,
        reminderIds,
        apiType,
        data.rid
      )
    );
    let hasEmailRecipient = false;
    let entityRid: string = "";
    if (data.flag === "project") {
      entityRid = data.project_fiscal_rid;
    } else if (data.flag === "case") {
      entityRid = ""
    } else {
      entityRid = data.account_rid;
    }
    const keyContactData : any = await orgDb.query(fetchKeyContactDetailsForInteractions(schemaName, entityRid))
      const keyContactDetails =
        keyContactData[0][0] !== null ? keyContactData[0][0] : null;
    if (result[0][0].interactions != null) {
      let statusIds: any[] = [
        ...new Set(result[0][0].interactions.map((d: any) => d.status)),
      ];
      let interactionStatusIds: any[] = [
        ...new Set(result[0][0].interactions.map((d: any) => d.interaction_status_rid)),
      ];
      let interactionAssessmentRids: any[] = [
        ...new Set(result[0][0].interactions.map((d: any) => d.interaction_assessment_source_rid)),
      ];
      let typeIds: any[] = [
        ...new Set(
          result[0][0].interactions.map((d: any) => d.interaction_type)
        ),
      ];
      let interactionLevelIds: any[] = [
        ...new Set(
          result[0][0].interactions.map((d: any) => d.interaction_level)
        ),
      ];
      let sourceIds: any[] = [
        ...new Set(
          result[0][0].interactions.map((d: any) => d.interaction_source)
        ),
      ];
      let responseSourceIds: any[] = [
        ...new Set(
          result[0][0].interactions.map((d: any) => d.response_source)
        ),
      ];
      let createdByIds: any[] = [
        ...new Set(
          result[0][0].interactions.map((user: any) => user.created_by)
        ),
      ];
      let modifiedByIds: any[] = [
        ...new Set(
          result[0][0].interactions.map((user: any) => user.modified_by)
        ),
      ];
      let mergeUserIds = [...createdByIds, ...modifiedByIds]
      let projectFiscalIds: any[] = [
        ...new Set(
          result[0][0].interactions.map(
            (project: any) => project.project_fiscal_rid
          )
        ),
      ];
      let fetchStatus = await mainDb.query(
        rawQueries.fetchInteractionStatus(statusIds)
      );
      let fetchIntStatus = await mainDb.query(
        rawQueries.fetchStatusNameForInteractions(interactionStatusIds)
      );
      let fetchInteractionAssessment = await mainDb.query(
        rawQueries.fetchInteractionAssessmentSource(interactionAssessmentRids)
      );
      let fetchTypes = await mainDb.query(
        rawQueries.fetchInteractionTypes(typeIds)
      );
      let fetchLevelIds = await mainDb.query(
        rawQueries.fetchInteractionLevel(interactionLevelIds)
      );
      let fetchSource = await mainDb.query(
        rawQueries.fetchInteractionSource(sourceIds)
      );
      let fetchResponseSource = await mainDb.query(
        rawQueries.fetchInteractionResponseSource(responseSourceIds)
      );
      let fetchCreatedByUsers = await mainDb.query(
        rawQueries.fetchUser(mergeUserIds)
      );
      let isEmailRecipient: any;
      let recipientMap: Map<string, boolean>;

      let statusMap: Map<string, string> = new Map(
        fetchStatus[0].map((status: any) => [status.rid, status.status_name])
      );
      let intStatusMap: Map<string, string> = new Map(
        fetchIntStatus[0].map((status: any) => [status.rid, status.status_name])
      );
      let interactionAssessmentMap: Map<string, string> = new Map(
        fetchInteractionAssessment[0].map((intAccess: any) => [intAccess.rid, intAccess.interaction_assessment_source_name])
      );
      let typeMap: Map<string, string> = new Map(
        fetchTypes[0].map((types: any) => [
          types.rid,
          types.interaction_type_name,
        ])
      );
      let levelMap: Map<string, string> = new Map(
        fetchLevelIds[0].map((level: any) => [
          level.rid,
          level.interaction_level_name,
        ])
      );
      let sourceMap: Map<string, string> = new Map(
        fetchSource[0].map((source: any) => [
          source.rid,
          source.interaction_source_name,
        ])
      );
      let responseSourceMap: Map<string, string> = new Map(
        fetchResponseSource[0].map((source: any) => [
          source.rid,
          source.response_source_name,
        ])
      );
      let createdMap: Map<string, string> = new Map(
        fetchCreatedByUsers[0].map((user: any) => [
          user.rid,
          `${user.first_name} ${user.last_name}`,
        ])
      );
      let finalData =
        result[0][0].interactions == null
          ? []
          : result[0][0].interactions.map((d: any) => {
              if (levelMap.get(d.interaction_level) === "Account") {
                hasEmailRecipient = d.has_account_recipient;
              } else {
                hasEmailRecipient = d.has_email_recipient;
              }
              return {
                ...d,
                status_rid: d.status,
                status_name:
                  d.status == "" || d.status == null
                    ? null
                    : statusMap.get(d.status),
                recipient_name:
                  d.recipient_name == "" || d.recipient_name == null
                    ? null
                    : d.recipient_name,
                recipient_email:
                  d.recipient_email == "" || d.recipient_email == null
                    ? null
                    : d.recipient_email,
                interaction_type_rid: d.interaction_type,
                interaction_type_name: typeMap.get(d.interaction_type),
                interaction_source_rid: d.interaction_source,
                interaction_source_name: sourceMap.get(d.interaction_source),
                interaction_level_rid: d.interaction_level,
                interaction_level_name: levelMap.get(d.interaction_level),
                response_source_rid: d.response_source,
                response_source_name:
                  responseSourceMap.get(d.response_source) == undefined
                    ? null
                    : responseSourceMap.get(d.response_source),
                created_by: d.created_by,
                created_user_name: createdMap.get(d.created_by) || null,
                modified_by: d.modified_by,
                updated_user_name:
                  createdMap.get(d.modified_by) == undefined
                    ? d.modified_by
                    : createdMap.get(d.modified_by),
                has_email_recipient: hasEmailRecipient,
                interaction_batch_id : d.interaction_batch_id,
                four_part_assessment_rid : d.four_part_assessment_rid,
                four_part_r_number : d.four_part_r_number,
                interaction_assessment_source_rid : d.interaction_assessment_source_rid,
                interaction_assessment_source_name : interactionAssessmentMap.get(d.interaction_assessment_source_rid) ?? null,
                interaction_status_rid : d.interaction_status_rid,
                interaction_status_name : intStatusMap.get(d.interaction_status_rid) ?? null
              };
            });
      const applyFilters = (
        data: any[],
        conditions: any,
        value: any,
        field: any
      ) => {
        if (!conditions || !field) return data;
        const val = value[conditions];
        switch (conditions) {
          case ALPHANUMERIC_CONDITIONS.equals:
            return data.filter(
              (d: any) => d[field]?.toLowerCase() === val?.toLowerCase()
            );
          case ALPHANUMERIC_CONDITIONS.notEquals:
            return data.filter(
              (d: any) => d[field]?.toLowerCase() != val?.toLowerCase()
            );
          case ALPHANUMERIC_CONDITIONS.contains:
            return data.filter((d: any) =>
              d[field]?.toLowerCase().includes(val?.toLowerCase())
            );
          case ALPHANUMERIC_CONDITIONS.isEmpty:
            return data.filter((d: any) => d[field] == null);
          default:
            return data;
        }
      };
      if (createdByConditions != null && createdByConditions != undefined)
        finalData = applyFilters(
          finalData,
          createdByConditions,
          createdByFilter,
          "created_user_name"
        );
      if (modifiedByConditions != null && modifiedByConditions != undefined)
        finalData = applyFilters(
          finalData,
          modifiedByConditions,
          modifiedByFilter,
          "updated_user_name"
        );
      if (sourceConditions != null && sourceConditions != undefined)
        finalData = applyFilters(
          finalData,
          sourceConditions,
          sourceFilter,
          "interaction_source_name"
        );
      if (
        mainTableFilters[data.sort] != undefined &&
        data.sort_by.toLowerCase() == "asc"
      ) {
        finalData = finalData.sort((a: any, b: any) => {
          if (!a?.[data.sort]) return 1;
          if (!b?.[data.sort]) return -1;
          return a[data.sort].localeCompare(b[data.sort]);
        });
      } else if (
        mainTableFilters[data.sort] != undefined &&
        data.sort_by.toLowerCase() == "desc"
      ) {
        finalData = finalData.sort((a: any, b: any) => {
          if (!b?.[data.sort]) return 1;
          if (!a?.[data.sort]) return -1;
          return b[data.sort].localeCompare(a[data.sort]);
        });
      }

      totalResults = disablePagination
        ? finalData.length
        : finalData[0].total_records;
      let finalPaginatedData: any[] = [];
      if (apiType === "export" || apiType === "graphql") {
        finalPaginatedData = finalData;
      } else {
        finalPaginatedData = disablePagination
          ? finalData.slice(
              (data.page - 1) * data.limit,
              data.page * data.limit
            )
          : finalData;
      }
      
      let organizedData = {
        page: data.page,
        limit: data.limit,
        totalCount: totalResults,
        keyContact:
          keyContactDetails != null
            ? {
                key_contact_name: keyContactData[0][0].key_contact_name,
                key_contact_email:
                  keyContactData[0][0].key_contact_email,
              }
            : {},
        interactions: finalPaginatedData,
      };
      return {
        status: HttpStatus.SUCCESS,
        data: organizedData,
      };
    } else {
      let organizedData = {
        page: data.page,
        limit: data.limit,
        totalCount: 0,
        keyContact:
          keyContactDetails != null
            ? {
                key_contact_name: keyContactData[0][0].key_contact_name,
                key_contact_email:
                  keyContactData[0][0].key_contact_email,
              }
            : {},
        interactions: [],
      };
      return {
        status: HttpStatus.NOT_FOUND,
        data: organizedData,
      };
    }
  }

  /**
   * Fetches a summarized list of interaction records accessible to the user.
   *
   * Determines the user's access level based on group and profile types, and retrieves
   * a filtered, paginated list of interaction summaries. Supports filtering by fiscal year,
   * global filters, field-specific filters, and search terms.
   *
   * Access is restricted to projects the user has permission to view.
   *
   * @param {any} data - Request payload containing pagination, filters, sorting, fiscal year, and search input.
   * @param {string} userId - The ID of the user making the request, used to determine access scope.
   *
   * @returns {Promise<any>} A promise that resolves to an object containing the status code and list of interactions.
   *                          Returns an empty list if no accessible records are found.
   */
  async fetchInteractionSummary(data: any, userId: string) {
    const mainDb = await this.getMainDb();
    const userGroupType = await this.interactionSchemaService.getUserGroupType(
      userId
    );
    const userProfileType =
      await this.interactionSchemaService.getUserProfileType(userId);
    const isCustomGlobal = userGroupType === "DEFAULT";
    const isDefaultParent = userGroupType === "AUTO_ASSIGNED_PARENT";
    const isPOCProfile =
      userProfileType?.profileName === "Project Point of Contact";
    let accessibleIds: string[] = [];
    if (!isCustomGlobal) {
      accessibleIds =
        await this.interactionSchemaService.getAccessibleProjectIds(
          userId,
          isDefaultParent,
          isPOCProfile,
          userProfileType?.email,
          isCustomGlobal
        );
      if (accessibleIds.length === 0) {
        return {
          statusCodeValue: HttpStatus.NOT_FOUND_MESSAGE,
          data: [],
        };
      }
    }

    if (isCustomGlobal && isPOCProfile) {
      accessibleIds =
        await this.interactionSchemaService.getAccessibleProjectIds(
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
    logMessage(`Accessible Project Fiscal Ids: ${JSON.stringify(accessibleIds)} userId: ${userId}, isDefaultParent: ${isDefaultParent}, isPOCProfile: ${isPOCProfile}, isCustomGlobal: ${isCustomGlobal}`);
    const result : any = await mainDb.query(listAllInteractionSummary(data.page, data.limit, 
      data.filters, data.globalFilters, data.fiscal_year, data.sort, data.sort_by,accessibleIds, data.search
    ))
    if(result[0][0].interactions != null) {
      return {
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        data: result[0][0].interactions,
      };
    } else {
      return {
        statusCodeValue: HttpStatus.NOT_FOUND_MESSAGE,
        data: [],
      };
    }
  }

  /**
   * Fetches and processes the response history for a specific interaction, including
   * mapping related source names and user details, and supports sorting by specific fields.
   *
   * @param {any} data - An object containing parameters for the query:
   *   - {string} data.account_rid - Account RID for fetching parent account and schema.
   *   - {string} data.interaction_rid - Interaction RID to fetch response history for.
   *   - {number} data.page - Page number for pagination.
   *   - {number} data.limit - Number of records per page.
   *   - {string} data.sort - Field name to sort by (e.g., 'interaction_source_name').
   *   - {string} data.sort_by - Sort order, either 'asc' or 'desc'.
   *
   * @returns {Promise<{statusCodeValue: number, data: any[]}>} A promise resolving to an object containing
   *   the HTTP status code value and an array of processed response history records.
   *   Returns an empty array with a NOT_FOUND status if no response history exists.
   */
  async listInteractionResponseHistory(data: any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();

    let fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);
    const responseHistoryresult: any = await orgDb.query(
      listResponseHistory(
        data.interaction_rid,
        schemaName,
        data.page,
        data.limit,
        data.sort,
        data.sort_by
      )
    );
    if (responseHistoryresult[0][0].response_history !== null) {
      let finalData = responseHistoryresult[0][0].response_history;
      let fetchSourceIds: any = [
        ...new Set(finalData.map((d: any) => d.interaction_source_rid)),
      ];
      let fetchResponseSourceIds: any = [
        ...new Set(finalData.map((d: any) => d.response_source_rid)),
      ];
      let fetchUserIds: any = [
        ...new Set(finalData.map((d: any) => d.response_by_rid)),
      ];
      let fetchUserDetails: any = await mainDb.query(
        rawQueries.fetchUser(fetchUserIds)
      );
      let fetchInteractionSource: any = await mainDb.query(
        rawQueries.fetchInteractionSource(fetchSourceIds)
      );
      let fetchResponseSource: any = await mainDb.query(
        rawQueries.fetchInteractionResponseSource(fetchResponseSourceIds)
      );
      let mapSources = new Map(
        fetchInteractionSource[0].map((source: any) => [
          source.rid,
          source.interaction_source_name,
        ])
      );
      let mapResponseSource = new Map(
        fetchResponseSource[0].map((source: any) => [
          source.rid,
          source.response_source_name,
        ])
      );
      let userMap = new Map(
        fetchUserDetails[0].map((d: any) => [
          d.rid,
          `${d.first_name} ${d.last_name}`,
        ])
      );
      let updatedFinalData = finalData.map((d: any) => {
        return {
          ...d,
          interaction_source_name: mapSources.get(d.interaction_source_rid),
          response_source_name: mapResponseSource.get(d.response_source_rid),
          response_by: userMap.get(d.response_by_rid) || d.response_by_rid,
        };
      });

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
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        data: updatedFinalData,
      };
    } else {
      return {
        statusCodeValue: HttpStatus.NOT_FOUND_MESSAGE,
        data: [],
      };
    }
  }

  /**
 * Retrieves paginated interaction history for a given interaction ID, including sorting and filtering.
 *
 * @param {any} data - Input data containing pagination, sorting, filters, interaction_rid, and account_rid.
 *
 * @returns {Promise<{
 *   statusCodeValue: number;
  *   data: {
  *     page: number;
  *     limit: number;
  *     total_records: number;
  *     data: {
  *       interaction_rnumber: string;
  *       project_code: string;
  *       project_name: string;
  *       interaction_source_name: string | null;
  *       interaction_history: Array<{
  *         rid: string;
  *         status_rid: string;
  *         status_name: string | null;
  *         date: string;
  *       }>;
  *     };
  *   };
  * }>} - Paginated and enriched interaction history with metadata.
  *
  * Returns empty history if no records found.
  */ 
  async fetchInteractionHistory(data: any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    let fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);
    const result: any = await orgDb.query(
      listInteractionHistory(
        data.page,
        data.limit,
        data.sort,
        data.sort_by,
        data.filters,
        data.interaction_rid,
        schemaName
      )
    );

    const responseData = result[0][0]; // Always exists

    // Step 1: Extract response & source RIDs from the base interaction (not from history)
    const responseSourceIds = [responseData.response_source_rid].filter(
      Boolean
    );
    const sourceTypeIds = [responseData.interaction_source_rid].filter(Boolean);
    let sourceMap: Map<string, string> = new Map();

    // Step 2: Fetch response source & interaction source names
    if (sourceTypeIds.length > 0) {
      //const fetchResponseSources: any = await mainDb.query(rawQueries.fetchInteractionResponseSource(responseSourceIds));
      const fetchSourceTypes: any = await mainDb.query(
        rawQueries.fetchInteractionSource(sourceTypeIds)
      );

      // const mapResponseSource = new Map(fetchResponseSources[0].map((d: any) => [d.rid, d.response_source_name]));
      sourceMap = new Map(
        fetchSourceTypes[0].map((d: any) => [d.rid, d.interaction_source_name])
      );
    }
    if (responseData.interaction_history.length !== 0) {
      // Step 3: Process status IDs from history
      const statusIds = [
        ...new Set(
          responseData.interaction_history.map((d: any) => d.new_status_rid)
        ),
      ];
      const fetchStatus: any = await mainDb.query(
        rawQueries.fetchInteractionStatus(statusIds)
      );
      const mapStatus = new Map(
        fetchStatus[0].map((d: any) => [d.rid, d.status_name])
      );

      // Step 4: Enrich history with status_name only (response/source already handled above)
      const enrichedHistory = responseData.interaction_history.map(
        (d: any) => ({
          ...d,
          status_name: mapStatus.get(d.new_status_rid) || null,
        })
      );

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
        interaction_source_name:
          sourceMap.get(responseData.interaction_source_rid) || null,
        interaction_history: sortedData.map((d: any) => {
          let isoDate = new Date(d.date).toISOString();
          // let formattedDate = 
          // isoDate.replace("Z", "+00:00");
          return {
            rid: d.interaction_history_rid,
            status_rid: d.new_status_rid,
            status_name: d.status_name,
            date: isoDate ? moment(isoDate).add(5, 'hours').add(30, 'minutes').format('YYYY-MMM-DD, hh:mm:ss A') : null,
          };
        }),
      };

      return {
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        data: {
          page: data.page,
          limit: data.limit,
          total_records: totalRecords,
          data: finalStructuredData,
        },
      };
    } else {
      // No history, but still include top-level fields
      const finalStructuredData = {
        interaction_rnumber: responseData.interaction_rnumber,
        project_code: responseData.project_code,
        project_name: responseData.project_name,
        //  response_source: mapResponseSource.get(responseData.response_source_rid) || null,
        interaction_source_name:
          sourceMap.get(responseData.interaction_source_rid) || null,
        interaction_history: [],
      };

      return {
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        data: {
          page: data.page,
          limit: data.limit,
          total_records: 0,
          data: finalStructuredData,
        },
      };
    }
  }

  /**
 * Retrieves paginated list of attachments for a given interaction, enriched with uploader info and signed download URLs.
 *
 * @param {any} data - Input data containing:
 *   - page: number - Current page number.
 *   - limit: number - Number of records per page.
 *   - interaction_rid: string - Interaction record ID.
 *   - account_rid: string - Account record ID (used internally to fetch schema).
 *   - search?: string - Optional search term to filter attachments.
 *
 * @returns {Promise<{
 *   statusCodeValue: number;
  *   page: number;
  *   limit: number;
  *   totalRecords: number;
  *   attachments: Array<{
  *     rid: string;
  *     uploaded_by: string | undefined;
  *     download_link: string;
  *     size: string | null;
  *     [key: string]: any;
  *   }>;
  * }>} - Paginated attachment list with uploader names and signed download links.
  *
  * Returns empty list with NOT_FOUND status if no attachments exist.
  */ 
  async listInteractionAttachments(data: any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    let fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);

    const result: any = await orgDb.query(
      listAttachments(
        data.page,
        data.limit,
        data.interaction_rid,
        schemaName,
        data.search
      )
    );
    if (result[0][0].attachments !== null) {
      let responseData = result[0][0].attachments;
      const createdByIds = [
        ...new Set(responseData.map((d: any) => d.created_by)),
      ];
      const fetchUsers = await mainDb.query(rawQueries.fetchUser(createdByIds));
      const mapUsers: Map<string, string> = new Map(
        fetchUsers[0].map((d: any) => [d.rid, `${d.first_name} ${d.last_name}`])
      );
      responseData = await Promise.all(
        responseData.map(async (d: any) => {
          return {
            ...d,
            uploaded_by: mapUsers.get(d.created_by) === undefined ? d.created_by : mapUsers.get(d.created_by),
            new_url: await generateSasUrl(d.download_link),
          };
        })
      );
      let total = responseData[0].total_records;
      responseData = responseData.map((d: any) => {
        delete d.download_link;
        const data = {
          ...d,
          download_link: d.new_url,
          size: d.size ? `${d.size} mb` : null,
        };
        delete data.total_records;
        delete data.new_url;
        return data;
      });
      return {
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        page: data.page,
        limit: data.limit,
        totalRecords: total,
        attachments: responseData,
      };
    } else {
      return {
        statusCodeValue: HttpStatus.NOT_FOUND_MESSAGE,
        page: data.page,
        limit: data.limit,
        totalRecords: 0,
        attachments: [],
      };
    }
  }

  /**
 * Fetches detailed response history for a specific interaction version, including attachments with signed URLs.
 *
 * @param {any} data - Input data containing:
 *   - account_rid: string - Account record ID (used internally for schema).
 *   - interaction_rid: string - Interaction record ID.
 *   - version: number - Version number of the response history.
 *
 * @returns {Promise<{
 *   statusCodeValue: number;
  *   data: {
  *     interaction_rid: string;
  *     interaction_r_number: string;
  *     project_name: string;
  *     response_on: string;
  *     global_attachments: Array<{
  *       fileName: string;
  *       fileUrl: string | null;
  *       fileType: string;
  *       fileSize: number;
  *     }>;
  *     history_details: Array<{
  *       interaction_response_rid: string;
  *       interaction_item_rid: string;
  *       response_submitted_on: string;
  *       question_id: string;
  *       question: string;
  *       response: string;
  *       response_on: string;
  *       is_mandatory: boolean;
  *       attachments: Array<{
  *         fileName: string;
  *         fileUrl: string | null;
  *         fileType: string;
  *         fileSize: number;
  *       }>;
  *     }>;
  *   } | [];
  * }>} - Detailed response history and attachments, or empty data if none found.
  */ 
  async listResponseHistoryDetails(data: any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    let fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);

    const result: any = await orgDb.query(
      interactionResponseHistoryByVersion(
        data.interaction_rid,
        data.version,
        schemaName
      )
    );
    if (result[0][0].responses_history_details !== null) {
      let finalData = await Promise.all(
        result[0][0].responses_history_details.map(async (d: any) => {
          let data = {
            interaction_response_rid: d.interaction_response_rid,
            interaction_item_rid: d.interaction_item_rid,
            response_submitted_on: d.response_submitted_on,
            question_id: d.question_id,
            question: d.question,
            response: d.response,
            response_on: d.response_on,
            is_mandatory: d.is_mandatory,
            attachments: await Promise.all(
              d.attachments
                .filter((f: any) => f.file_url !== null)
                .map(async (da: any) => {
                  return {
                    fileName: da.file_name,
                    fileUrl:
                      da.file_url == null
                        ? null
                        : await generateSasUrl(da.file_url),
                    fileType: da.file_type,
                    fileSize: da.file_size,
                  };
                })
            ),
          };
          return data;
        })
      );
      let structuredData = {
        interaction_rid: result[0][0].responses_history_details[0].response_id,
        interaction_r_number:
          result[0][0].responses_history_details[0].r_number,
        project_name: result[0][0].responses_history_details[0].project_name,
        response_on:
          result[0][0].responses_history_details[0].response_updated_on,
        global_attachments: await Promise.all(
          result[0][0].responses_history_details[0].global_attachments
            .filter((f: any) => f.file_url !== null)
            .map(async (da: any) => {
              return {
                fileName: da.file_name,
                fileUrl:
                  da.file_url == null
                    ? null
                    : await generateSasUrl(da.file_url),
                fileType: da.file_type,
                fileSize: da.file_size,
              };
            })
        ),
        history_details: finalData,
      };
      return {
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        data: structuredData,
      };
    } else {
      return {
        statusCodeValue: HttpStatus.NOT_FOUND_MESSAGE,
        data: [],
      };
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

  /**
   * Triggers an AI assessment by preparing and sending a message payload to a Kafka topic.
   *
   * @param {any} req - Request object containing:
   *   - type: string - "account" or other type to determine payload structure.
   *   - data: Array - Contains account_rid and optionally project_fiscal_rid.
   *
   * @returns {Promise<{
   *   statusMessage: string;
    *   status: "success" | "error";
    *   data: null;
    *   errorMessage?: string;
    * }>} - Result of the trigger operation with success or error details.
    *
    * @description
    * - Constructs payload based on request type.
    * - Fetches account and project info when type is "account".
    * - Sends payload to a Kafka topic for AI processing.
    * - Logs and handles errors gracefully.
    */ 
  async triggerAI(req: any,userId:string,type: string = entityTypes.MANUAL_RD_ASSESSMENT) {
    try {
      let payload: {
        company_id?: any;
        input_text: string;
        model_type: string;
        project_id?: any;
      } = {
        input_text: "This is some text to be processed by the AI.",
        model_type: "NA",
      };
      const { accountNumber } =
          await this.interactionSchemaService.fetchValidAccountNumberById(
            req.data[0].account_rid
          );

        if (!accountNumber) {
          logMessage(`Invalid account ID in triggerAI: ${req.data[0].account_rid}`);
          throw new Error("Invalid account ID");
        }
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
        if (!this.orgDbSequelize) {
          this.orgDbSequelize = await initOrgSequelize();
        }
        if (!this.mainDbSequelize) {
          this.mainDbSequelize = await initMainDbSequelize();
        }
        let entityName = '';
      if (req.type === "account") {
        payload.company_id = req.data[0].account_rid;
      
        
        const status_rid =
          await this.interactionSchemaService.getActiveStatusRid();
        const [accountInfo]: any[] = await this.mainDbSequelize.query(
          rawQueries.fetchAccountInfo(
            req.data[0].account_rid,
          )
        );
        entityName = accountInfo[0].account_name;
    const [accountFiscalInfo]: any[] = await this.orgDbSequelize.query(
      rawQueries.fetchAccountDetailsInfo(
        req.data[0].account_rid,schemaName
      ), { type: 'SELECT' }
    );
    const fiscalStart = accountFiscalInfo?.fiscal_start_date; // e.g. 'Apr/01'
    const fiscalEnd = accountFiscalInfo?.fiscal_end_date; // e.g. 'Mar/31'
    const platFormConfigResult: any[] = await this.mainDbSequelize.query(
          rawQueries.fetchAllPlatformConfig(accountInfo[0].country_rid),
          { type: 'SELECT' }
        );
        let projectTypes: any;
        const platFormConfigs = Array.isArray(platFormConfigResult) ? platFormConfigResult : [platFormConfigResult];
        const groupedProjectTypes: Record<string, any[]> = {};
        platFormConfigs.forEach((config: any) => {
          if (config && config.config_json && config.config_json.project_type) {
            const projectTypeArr = Array.isArray(config.config_json.project_type)
              ? config.config_json.project_type
              : [config.config_json.project_type];
            const key = `${config.effective_start_date || ''}_${config.effective_end_date || ''}`;
            if (!groupedProjectTypes[key]) groupedProjectTypes[key] = [];
            groupedProjectTypes[key].push(...projectTypeArr);
          }
        });
        projectTypes = groupedProjectTypes;
        if(!projectTypes || (typeof projectTypes === 'object' && Object.keys(projectTypes).length === 0))
        {
           return {
            statusCode: HttpStatus.FAILED,
            statusMessage: `No active projects found for the account`,
            data: null,
            status: "error",
            errorMessage: `No active projects found for the account`,
          };
        }
       
        // Pass as IN clause to fetchProjectsByAccount
        const [projects]: any[] = await this.orgDbSequelize.query(
          rawQueries.fetchProjectsByAccount(
            req.data[0].account_rid,
            schemaName,
            status_rid!,
            fiscalStart,fiscalEnd,
            projectTypes
          )
        );
        const projectIds = Array.isArray(projects)
          ? projects.map((p: any) => p.rid)
          : [];
        if (projectIds.length === 0) {
          logMessage(`No active projects found for account ID in triggerAI: ${req.data[0].account_rid}`);
          
          return {
            statusCode: HttpStatus.FAILED,
            statusMessage: `No active projects found for the account`,
            data: null,
            status: "error",
            errorMessage: `No active projects found for the account`,
          };
        }
        payload.project_id = projectIds;
      }
      else if (req.type === "case") {
        payload.company_id = req.data[0].account_rid;
        if (!this.orgDbSequelize) {
          this.orgDbSequelize = await initOrgSequelize();
        }
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;

        const [projects]: any[] = await this.orgDbSequelize.query(
          rawQueries.fetchProjectsByCase(
            req.data[0].case_rid,
            schemaName
          )
        );
        const projectIds = Array.isArray(projects)
          ? projects.map((p: any) => p.project_fiscal_rid)
          : [];
        payload.project_id = projectIds;
      }
       else {
        payload.company_id = req.data[0].account_rid;
        payload.project_id = req.data[0].project_fiscal_rid;
        const projectInfo: any = await this.orgDbSequelize.query(
          rawQueries.fetchProjectInfo(
            req.data[0].project_fiscal_rid,
            schemaName
          ), { type: 'SELECT' }
        );
        entityName = projectInfo[0]?.project_code || '';
      }
      logMessage(`Triggering AI with payload: ${JSON.stringify(payload)}`);

      const topic =
        process.env.KAFKA_AI_REQUEST_TRIGGER_TOPIC || "ai_assessment_request";
      const message = {
        value: JSON.stringify(payload),
      };
      const producer = await this.getProducer();
      const sendResult = await producer.send({
        topic,
        messages: [message],
      });
      // Check if the message was processed successfully
   //   logMessage(`Send result to topic: ${JSON.stringify(sendResult)}`);
      const userEventInfo:any = await this.interactionSchemaService.fetchUserAndEventInfo({
                                                  userId: userId!,
                                                  eventType: eventTypes.UI_HANDLER
                                                });
        let timelineTypes = [req.type];
        
        if (req.type === "project") {
          const projectIds = req.data[0].project_fiscal_rid;
          if (Array.isArray(projectIds)) {
            for (const projectId of projectIds) {
              const projectInfo: any = await this.orgDbSequelize.query(
                rawQueries.fetchProjectInfo(projectId, schemaName), { type: 'SELECT' }
              );
              const projectCode = projectInfo[0]?.project_code || '';
              await this.interactionSchemaService.createAccountTimelineEntry(accountNumber!, {
                created_by: userId!,
                account_rid: req.data[0].account_rid,
                entity_rid: projectId,
                entity_name: type,
                created_by_name: userEventInfo.full_name,
                event_type_rid: userEventInfo.event_type_rid,
                event_name: eventNames.TRIGGERED,
                descriptions: `for ${projectCode}`,
                project_rid: projectId,
              }, timelineTypes);
            }
          } else {
            const projectInfo: any = await this.orgDbSequelize.query(
              rawQueries.fetchProjectInfo(projectIds, schemaName), { type: 'SELECT' }
            );
            entityName = projectInfo[0]?.project_code || '';
            await this.interactionSchemaService.createAccountTimelineEntry(accountNumber!, {
              created_by: userId!,
              account_rid: req.data[0].account_rid,
              entity_rid: projectIds,
              entity_name: type,
              created_by_name: userEventInfo.full_name,
              event_type_rid: userEventInfo.event_type_rid,
              event_name: eventNames.TRIGGERED,
              descriptions: `for ${entityName}`,
              project_rid: projectIds,
            }, timelineTypes);
          }
        } else {
          let entityRid  = req.type === "case" ? req.data[0].case_rid : req.data[0].account_rid;
          await this.interactionSchemaService.createAccountTimelineEntry(accountNumber!, {
            created_by: userId!,
            account_rid: req.data[0].account_rid,
            entity_rid: entityRid,
            entity_name: type,
            created_by_name: userEventInfo.full_name,
            event_type_rid: userEventInfo.event_type_rid,
            event_name: eventNames.TRIGGERED,
            descriptions: req.type === 'account' ? `for ${entityName}` : '',
            project_rid: '',
          }, timelineTypes);
        }
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: "RD Assessment Initiated",
        status: "success",
        data: null,
      };
    } catch (error) {
      logMessage(`Error in triggerAI: ${error}`);
      return {
          statusCode: HttpStatus.FAILED,
        statusMessage: "Failed to process AI request",
        status: "error",
        data: null,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async fetchAndUpdateFromAiTriggerResponse(data: any) {
    const account_rid = data.company_id;

    const { accountNumber } =
      await this.interactionSchemaService.fetchValidAccountNumberById(
        account_rid
      );

      if (!accountNumber) {
        logMessage(`Invalid account ID in fetchAndUpdateFromAiTriggerResponse: ${account_rid}`);
        throw new Error("Invalid account ID");
      }
        let techSummaryPayload ={
     // created_by: userId,
     account_rid:account_rid,
     fiscal_year:"",//need to update
      project_id: data.project_id,
      project_fiscal_rid: data.project_fiscal_rid,
      technical_summary: data.project_summary,
      //  version:"",
      status: data.status,
      entity_transaction_id: data.correlation_id,
    };
    //await this.interactionSchemaService.updateQrePercentAndTechSummary(data.qre, accountNumber,data.project_id,techSummaryPayload)
    return {
      statusMessage: "Details updated successfully",
      status: data.status,
      data: data.project_summary,
    };
  }

  /**
   * Processes a Kafka message related to AI interaction updates.
   *
   * @param {any} message - Incoming Kafka message (string or object) containing data and status.
   *
   * @returns {Promise<void>} - Resolves after processing the message or logs errors.
   *
   * @description
   * - Parses the message payload.
   * - Validates the company/account ID.
   * - Handles different message types:
   *   - "qre_percent": updates QRE percentage data.
   *   - "project_summary": updates technical summary.
   *   - "interaction_questions": creates new interactions and updates status.
   *   - "data_ingestion": marks AI processing status.
   * - Logs success or errors accordingly.
   */
  async processKafkaMessage(message: any): Promise<void> {
    try {
       logMessage(`Processing Kafka message: ${JSON.stringify(message)}`);
      let parsedMessage: any;
      if (typeof message === "string") {
        parsedMessage = JSON.parse(message);
      } else if (message.data !== undefined) {
        parsedMessage = message.data;
      } else {
        parsedMessage = message;
      }
      const {
        company_id,
        project_id,
        type,
        qre_percent,
        project_summary,
        transaction_id,
        interaction_questions,
        detailed_breakdown,
        four_part_assessment
      } = parsedMessage.data;
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          company_id
        );
      if (!accountNumber) {
        logMessage(`Invalid account ID in Kafka message: ${company_id}`);
        return;
      }
      if (parsedMessage.statusCode) {
        if (!company_id || !project_id || !type) {
          logMessage(`Kafka message missing required fields: ${JSON.stringify(parsedMessage)}`);
          return;
        }

        if(type === "four_part_assessment") {
          let fourPartPayload : FourPartAssessmentResponse;
          fourPartPayload = four_part_assessment
          await this.interactionSchemaService.createFourPartAssessment(
            four_part_assessment,
            accountNumber,
            project_id,
            company_id,
            transaction_id            
          )
        }

        if (type === "qre_percent") {
          await this.interactionSchemaService.updateQrePercent(
            qre_percent,
            accountNumber,
            project_id,
            detailed_breakdown,
            company_id,
            transaction_id,
            parsedMessage
          );
        }
        if (type === "project_summary") {
          await this.interactionSchemaService.updateTechSummary(
            project_summary,
            accountNumber,
            project_id,
            company_id,
            transaction_id,
            parsedMessage
          );
        }
        if (type === "interaction_questions" || type === 'four_part_assessment') {
          let interactionAssessmentSource : string;
          let fourPartAssessmentRid : string | null;
          let fourPartPayload : FourPartAssessmentResponse;
          let batchId : string;
          fourPartPayload = four_part_assessment
          let dynamicQuestions : any[];
          let intStatusRid : string = ''
          const findStatus = await this.interactionSchemaService.getStatus();
          if(type === 'four_part_assessment') {
            interactionAssessmentSource = interactionAssessmentSourceType.FPA
            const findFpaRid = await this.interactionSchemaService.fetchAccountFpaInfo(transaction_id, accountNumber);
            fourPartAssessmentRid = findFpaRid.rid;
            dynamicQuestions = fourPartPayload.follow_up_questions.map((d) => {
              return {
                question : d
              }
            })
            const findBatchAndIncrement = await this.interactionSchemaService.fetchInteractionBatch(accountNumber);
            if(findBatchAndIncrement) {
              const splitBatchNumber = Number(findBatchAndIncrement.split('_')[1])
              const incrementedBatchNumber = splitBatchNumber + 1
              batchId = `${process.env.BATCH_PREFIX}${String(incrementedBatchNumber).padStart(6, '0')}`
            } else {
              batchId = `${process.env.BATCH_PREFIX}000001`
            }
          }
          else {
            interactionAssessmentSource = interactionAssessmentSourceType.RD
            fourPartAssessmentRid = null;
            dynamicQuestions = interaction_questions
            const findBatchAndIncrement = await this.interactionSchemaService.fetchInteractionBatchByTransactionId(accountNumber, transaction_id);
            batchId = findBatchAndIncrement
          }

          const projectInfo =
            await this.interactionSchemaService.fetchProjectInfo(
              accountNumber,
              project_id
            );
          const statusRid =
            await this.interactionSchemaService.getInteractionStatusByType(
              statusAction.DRAFT
            );
          const questionsWithActionType = Array.isArray(dynamicQuestions)
            ? dynamicQuestions.map((q: any) => ({
                ...q,
                action_type: "add",
              }))
            : [];

          if(findStatus.length > 0) {
            const mapStatus = new Map(findStatus.map((d) => [d.status_name, d.rid]));
            intStatusRid = interactionAssessmentSource == interactionAssessmentSourceType.RD ? mapStatus.get('In-Active')! : mapStatus.get('Active')!
          }
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
            interaction_level_rid: "Project",
            interaction_assessment_source_rid : interactionAssessmentSource,
            transaction_id : transaction_id,
            four_part_assessment_rid : fourPartAssessmentRid,
            interaction_batch_id : batchId,
            interaction_status_rid : intStatusRid
          };
          await this.createInteraction(
            interactionData,
            interactionSource.AUTO,
            process.env.SYSTEM_USER_ID!
          );
          await this.interactionSchemaService.updateInteractionStatus(
            accountNumber,
            parsedMessage
          );
        }
        if(type === 'data_ingestion')
        {
          logMessage(`Processing data_ingestion type for account: ${company_id}  ${accountNumber}`);
          await this.interactionSchemaService.updateAIProcessed(accountNumber, project_id,parsedMessage);
        }
      }
      else{
        logMessage(`Kafka message indicates failure status: ${JSON.stringify(message)}`);
      }

      logMessage(`Processed Kafka message for account: ${company_id}`);
    } catch (err) {
       logMessage(`Error processing Kafka message: ${JSON.stringify(err)}`);
    }
  }

  /**
   * Retrieves the list of export fields that the specified user is permitted to access
   * based on a given permission name.
   *
   * @param {string} userId - The ID of the user requesting the allowed export fields.
   * @param {string} permission_name - The name of the permission to check against.
   *
   * @returns {Promise<any[]>} A promise that resolves to an array of allowed export fields for the user.
   */
  async getAllowedExportFields(
    userId: string,
    permission_name: string
  ): Promise<any[]> {
    return this.interactionSchemaService.getAllowedExportFields(
      userId,
      permission_name
    );
  }

  async triggerAiFromScheduler(schedulerRecord: SchedulerExecutions) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    try {
      logMessage("AI Trigger Scheduler started");
      let fetchAllParentsAccountsRnumber : any = await mainDb.query(rawQueries.fetchAllParentRNumber())
      for(let account of fetchAllParentsAccountsRnumber[0]) {
        let schemaName = rawQueries.fetchSchemaName(account.r_number);
        logMessage(`SchemaName: ${schemaName}`);
        let verifyTableExistsForAttachments: any = await orgDb.query(checkTableExists(schemaName, "attachments"));
        let verifyTableExistsForInteractions: any = await orgDb.query(checkTableExists(schemaName, "interactions"));
        if (verifyTableExistsForInteractions[0][0].exists === true) {
          logMessage(`verifyTableExistsForInteractions: ${true}`);
          try {
            const isRecordExists =
              await this.interactionSchemaService.findTaskRecordExists(
                schedulerRecord.rid,
                interactionTaskName.interactionAge
              );
            if (isRecordExists == null) {
              await this.interactionSchemaService.createSchedulerTaskRecords(
                schedulerRecord.rid,
                interactionTaskName.interactionAge
              );
            }
            await fetchInteractionForSentResentStatus(
              schemaName,
              mainDb,
              orgDb
            );
          } catch (error: any) {
            await this.interactionSchemaService.updateSchedulerTaskRecords(
              schedulerRecord.rid,
              interactionTaskName.interactionAge,
              schedulerStatus.Failed,
              error.message
            );
          }
          try {
            const isRecordExists =
              await this.interactionSchemaService.findTaskRecordExists(
                schedulerRecord.rid,
                interactionTaskName.interaction
              );
            if (isRecordExists == null) {
              await this.interactionSchemaService.createSchedulerTaskRecords(
                schedulerRecord.rid,
                interactionTaskName.interaction
              );
            }
            let fetchProjectIdsFromInteractions: any = await orgDb.query(
              fetchProjectInteractionRid(schemaName)
            );
            await this.createPayloadForTriggerAi(
              fetchProjectIdsFromInteractions[0]
            );
          } catch (error: any) {
            await this.interactionSchemaService.updateSchedulerTaskRecords(
              schedulerRecord.rid,
              interactionTaskName.interaction,
              schedulerStatus.Failed,
              error.message
            );
          }
        }
        if (verifyTableExistsForAttachments[0][0].exists == true) {
          try {
            logMessage(`verifyTableExistsForAttachments :, true`)
            const isRecordExists = await this.interactionSchemaService.findTaskRecordExists(schedulerRecord.rid, interactionTaskName.attachments)
            if(isRecordExists == null) {
              await this.interactionSchemaService.createSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.attachments)
            }
            let fetchProjectIdsFromAttachments: any = await orgDb.query(
              fetchProjectAttachmentsRids(schemaName)
            );
            await this.createPayloadForTriggerAi(
              fetchProjectIdsFromAttachments[0]
            );
          } catch (error: any) {
            await this.interactionSchemaService.updateSchedulerTaskRecords(
              schedulerRecord.rid,
              interactionTaskName.attachments,
              schedulerStatus.Failed,
              error.message
            );
          }
        }
      }
      await this.interactionSchemaService.updateSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.attachments, schedulerStatus.Success, '')
      await this.interactionSchemaService.updateSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.interaction, schedulerStatus.Success, '')
      await this.interactionSchemaService.updateSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.interactionAge, schedulerStatus.Success, '')
      await this.interactionSchemaService.updateSchedulerRecords(schedulerRecord.rid, schedulerStatus.Success)
    } catch (error : any) {
      logMessage(`Scheduler facing error: ${error}`);
      await this.interactionSchemaService.updateSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.attachments, schedulerStatus.Failed, error.message);
      await this.interactionSchemaService.updateSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.interaction, schedulerStatus.Failed, error.message);
      await this.interactionSchemaService.updateSchedulerTaskRecords(schedulerRecord.rid, interactionTaskName.interactionAge, schedulerStatus.Failed, error.message);
      await this.interactionSchemaService.updateSchedulerRecords(schedulerRecord.rid, schedulerStatus.Failed);
    }
  }

  async createPayloadForTriggerAi(data: any) {
    let mappingData: Map<
      string,
      { account_rid: string; project_fiscal_rid: string[] }
    > = new Map();
    if (data.length > 0) {
      for (let items of data) {
        if (!mappingData.has(items.account_rid)) {
          mappingData.set(items.account_rid, {
            account_rid: items.account_rid,
            project_fiscal_rid: [items.project_fiscal_rid],
          });
        } else {
          let existsIds = mappingData.get(items.account_rid);
          if (
            existsIds &&
            !existsIds?.project_fiscal_rid.includes(items.project_fiscal_rid)
          ) {
            existsIds.project_fiscal_rid.push(items.project_fiscal_rid);
          }
        }
      }
      let payload = {
        data : Array.from(mappingData.values()),
        type : "project"
      }
      logMessage(`AI Trigger Payload: ${JSON.stringify(payload)}`);
      await this.triggerAI(payload,process.env.SYSTEM_USER_ID!,entityTypes.SCHEDULER_RD_ASSESSMENT);
    }
  }

   async sendEmailInBatch() {
    const mainDb = await this.getMainDb();
    let fetchEmailInfo : any = await mainDb.query(rawQueries.fetchEmailInfo);
    logMessage(`[BATCH EMAIL] Fetched ${fetchEmailInfo[0].length} unsent emails.`);

    for (let data of fetchEmailInfo[0]) {
      let email_info: {
        email: string;
        name: string | null;
        ccEmails?: string[] | [];
      } = {
        email: data.email,
        name: data.name,
        ccEmails: [],
      };
      let accountNumber = data.account_rnumber;
      let interaction_rid = data.interaction_rid;
      let is_interaction_followup = data.is_interaction_followup;
      let userId = data.user_rid;
      let project_fiscal_rid = data.project_fiscal_rid;
      let accountRid = data.account_rid;
      let interactionLevel = data.interaction_level;
      let createdBy = data.user_rid;

      // If emailInfo.email is empty, fetch POC email
      let sendEmailInfo = email_info;

        logMessage(`[INFO] Fetched fallback email for interaction ${interaction_rid}: ${sendEmailInfo?.email}`);
        if(interactionLevel === 'Account')
        {
           sendEmailInfo = await this.interactionSchemaService.fetchEmailInfoForAccount(accountNumber, accountRid,email_info,is_interaction_followup,data.interaction_rid);
        }
        else
        {
            sendEmailInfo = await this.interactionSchemaService.fetchEmailInfo(accountNumber, interaction_rid, project_fiscal_rid, accountRid,email_info,is_interaction_followup);
         if (!sendEmailInfo?.email || sendEmailInfo?.email == "") {
        logMessage(`[SKIP] No email found for interaction ${interaction_rid}. Skipping.`);
        continue;
      }
          }
        

      if (!sendEmailInfo?.email || sendEmailInfo?.email == "") {
        logMessage(`[SKIP] No email found for interaction ${interaction_rid}. Skipping.`);
        continue;
      }
       logMessage(`[SEND] Sending email to ${sendEmailInfo.email} for interaction ${interaction_rid}.`);

      const [interactionItems, interactionInfo] = await Promise.all([
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
      console.log(interactionInfo)
      const senderEmailInfo = await this.getSenderEmailInfo(
        interactionInfo.accountInfo.parent_account_rid,
        interactionInfo.accountInfo.account_rid
      );
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
        interactionInfo.projectInfo || null,
        interactionInfo.accountInfo,
        excelAttachment,
        interactionLink,
        senderEmailInfo!,
        interaction_rid,
        is_interaction_followup,
        interactionLevel,
        false,
        createdBy,
        accountNumber,
        data
      );
      if (emailResponse) {
        logMessage(`[SUCCESS] Email sent for interaction ${interaction_rid}.`);
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
        } else {
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
        await this.interactionSchemaService.updateEmailSendFlag(
          interaction_rid
        );
      } else {
        //need to add logic for sending toPS team
        logMessage(`[FAIL] Email failed to send for interaction ${interaction_rid}. Needs manual intervention.`);
      }
    }
    logMessage(`[BATCH EMAIL] Finished processing batch.`);
  }
  async fetchStatusIdsForReminder() {
    const mainDb = await this.getMainDb();
    const result: any = await mainDb.query(fetchStatusIdsForReminderList());
    if (result[0].length > 0) {
      return result[0].map((d: any) => d.rid);
    }
  }

  //code for interaction templates
  /**
 * Creates a new interaction template along with its associated questions within a database transaction.
 *
 * @param {ICreateTemplateInteraction} interactionData - The interaction template data to create.
 * @param {string} userId - The ID of the user creating the interaction template.
 *
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { interactions: any };
  * }>} - Result of the creation process, including status code, message, optional error message, and interaction data if successful.
  *
  * @description
  * - Initializes database transaction.
  * - Sets the created_by field to the provided userId.
  * - Retrieves interaction status and source info.
  * - Calls service to create interaction template.
  * - If successful, adds associated questions within the same transaction.
  * - Returns success response with interaction data or error response accordingly.
  * - Catches and logs errors, returning a failed status with an error message.
  */ 
  async createInteractionTemplate(
    interactionData: ICreateTemplateInteraction,
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

      const { intSource, intType } = await this.getInteractionStatusAndSource(
        "manual"
      );
      interactionData.interaction_type_rid = intType || "";

      const templateInteraction =
        await this.interactionSchemaService.createInteractionTemplate(
          interactionData
        );
      if (templateInteraction.statusCode === HttpStatus.SUCCESS) {
        await this.interactionSchemaService.addInteractionTemplateQuestions(
          interactionData,
          templateInteraction?.data?.interaction?.rid!,
          transaction,
          userId
        );
        return {
          statusCode: HttpStatus.SUCCESS,
          message: STATUS_MESSAGE.interactionCreated,
          data: {
            interactions: templateInteraction,
          },
        };
      } else {
        return {
          statusCode: templateInteraction.statusCode,
          message: templateInteraction.message,
          errorMessage: templateInteraction.errorMessage!,
        };
      }
    } catch (err) {
      logMessage(`Error creating interaction, ${err}`);
       return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.interactionFailed,
        };
    }
  }

  /**
   * Retrieves a paginated list of interaction templates based on provided filters, sorting, and search criteria.
   *
   * @param {any} data - The query parameters including sorting, filtering, pagination, and search details.
   * @param {string} userId - The ID of the user requesting the list.
   * @param {any} filters - Additional filters to apply to the query.
   * @param {string} apiType - The API source type (e.g., "list", "export") that influences query behavior.
   *
   * @returns {Promise<any>} - An object containing the status code and the organized interaction template data, including pagination info.
   *
   * @description
   * - Obtains a database connection instance.
   * - Executes a raw SQL query to fetch interaction templates according to the provided criteria.
   * - Parses and organizes the results with pagination metadata.
   * - Returns success response with data if interactions found.
   * - Returns a not found status with empty results if no interactions present.
   */
  async listInteractionTemplates(
    data: any,
    userId: string,
    filters: any,
    apiType: string
  ): Promise<any> {
    const mainDb = await this.getMainDb();

    //let fetchParentAccount : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb))

    let totalResults: number = 0;

    const result: any = await mainDb.query(
      await fetchInteractionTemplates(
        data.sortBy,
        data.sortOrder,
        data.filters,
        data.page,
        data.limit,
        data.search,
        data.apiSource,
        data.templateType,
        mainDb,
        apiType
      )
    );
    if (result[0][0].interactions != null) {
      let finalData =
        result[0][0].interactions == null ? [] : result[0][0].interactions;
      totalResults = finalData[0].total_records;
      let organizedData = {
        page: data.page,
        limit: data.limit,
        totalCount: totalResults,
        interactions: finalData,
      };
      return {
        statusCode: HttpStatus.SUCCESS,
        data: organizedData,
      };
    } else {
      let organizedData = {
        page: data.page,
        limit: data.limit,
        totalCount: 0,
        interactions: [],
      };
      return {
        status: HttpStatus.NOT_FOUND,
        data: organizedData,
      };
    }
  }

  /**
 * Updates an existing interaction template along with its associated questions within a database transaction.
 *
 * @param {ICreateTemplateInteraction} interactionData - The interaction template data to update, including template ID and questions.
 * @param {string} userId - The ID of the user performing the update.
 *
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { interactions: any };
  * }>} 
  * An object containing the status code, a message, optional error message, and optionally the updated interaction data.
  *
  * @description
  * - Initiates a database transaction.
  * - Calls service to update the interaction template in the database.
  * - If successful, updates the related interaction template questions.
  * - Commits the transaction on success.
  * - Rolls back the transaction on failure or error.
  * - Logs errors and returns appropriate failure messages.
  */ 
  async updateInteractionTemplate(
    interactionData: ICreateTemplateInteraction,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }> {
    const dbInit = await this.interactionModelService.getMainSequelize();
    const transaction = await dbInit.transaction();
    try {
      const updatedInteraction =
        await this.interactionSchemaService.updateInteractionTemplate(
          interactionData,
          userId,
          transaction
        );
      if (updatedInteraction.statusCode === HttpStatus.SUCCESS) {
        await this.interactionSchemaService.addInteractionTemplateQuestions(
          interactionData,
          interactionData.template_rid!,
          transaction,
          userId
        );
        await transaction.commit();
        return {
          statusCode: HttpStatus.SUCCESS,
          message: STATUS_MESSAGE.interactionUpdated,
          data: {
            interactions: null,
          },
        };
      } else {
        await transaction.rollback();
        return {
          statusCode: updatedInteraction.statusCode,
          message: updatedInteraction.message,
          errorMessage: updatedInteraction.errorMessage!,
        };
      }
    } catch (err) {
      logMessage(`Error updating interaction template, ${err}`);
      await transaction.rollback();
     
       return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.interactionUpdateFailed,
        };
    }
  }

  /**
 * Retrieves the details of an interaction template by its unique template ID.
 *
 * @param {string} templateRid - The unique identifier (RID) of the interaction template.
 *
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { interactionDetails: any };
  * }>} 
  * An object containing the status code, a message, optional error message, and the interaction template details if found.
  *
  * @throws Throws a service error if fetching the interaction details fails unexpectedly.
  *
  * @description
  * - Calls the service to fetch interaction template details by the provided template RID.
  * - Returns a failure status if no details are found.
  * - Returns success status with the interaction details if found.
  * - Logs any error encountered during the fetch and rethrows it as a service error.
  */ 
  async getInteractionTemplateDetailsById(templateRid: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionDetails: any };
  }> {
    try {
      const interactionDetails =
        await this.interactionSchemaService.fetchInteractionTemplateDetailsById(
          templateRid
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
      logMessage(`Error fetching interaction details, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }
  async getAccountNumberByRid(accountRid: string): Promise<{
    statusCode: number;
    message: string;  
    errorMessage?: string;
    data?: { account_number: string };
  }> {  
    if(!this.mainDbSequelize) {
      this.mainDbSequelize = await this.interactionModelService.getMainSequelize();
    }
    const [accountInfo]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchAccountInfo(accountRid),
      {
        replacements: { rid: accountRid },
        type: "SELECT"
        
      }
    );
    if (!accountInfo) {
      return {
        statusCode: HttpStatus.FAILED,
        message: "Account not found",
        errorMessage: "Invalid account RID",
      };
    } 
    return {
      statusCode: HttpStatus.SUCCESS,
      message: "Account found",
      data: { account_number: accountInfo.r_number },
    };
}
async getFourPartAssessmentList (data : FourPartAssessmentRequestPayload) {
  const mainDb = await this.getMainDb();
  const orgDb = await this.getOrgDb();
  const [fetchParentAccount] = await mainDb.query<ParentAccountType>(await rawQueries.fetchParentAccount(data.account_rid, mainDb), {type : QueryTypes.SELECT});
  if(fetchParentAccount) {
    let isPagination : boolean = false;
    let isSorting : boolean = false;
    let isFiltering : boolean = false;
    let createdByFilters : string = '';
    let modifiedByFilters : string = '';
    let orgDbFilterArray = [];
    let mainDbFilterArray = [];

    for(let [key, cond] of Object.entries(data.filter)) {
      if(Object.keys(FourPartColumns).includes(key)) {
        orgDbFilterArray.push(key)
      }
      if(Object.keys(MainTableFilter).includes(key)) {
        mainDbFilterArray.push(key)
      }
    }
    if(FourPartColumns[data.sort] !== undefined) {
      isSorting = true
    }
    if(MainTableFilter[data.sort] !== undefined) {
      isSorting = false
    }

    if(orgDbFilterArray.length > 0 && mainDbFilterArray.length > 0) {
      isFiltering = true
      isPagination = false
    }
    else if(orgDbFilterArray.length > 0) {
      isFiltering = true
      isPagination = true
    }
    else if(mainDbFilterArray.length > 0) {
      isFiltering = false
      isPagination = false
    }
    else {
      isFiltering = false
      isPagination = true
    }
    let schemaName = rawQueries.fetchSchemaName(fetchParentAccount.r_number)
    let projectFiscalRids : string[] = []
    if(data.type === 'case') {
      const findProjectIdsBasedOnCase : any = await orgDb.query(fetchProjectFiscalIds(data.case_rid, schemaName));
      if(findProjectIdsBasedOnCase[0].length > 0) {
        for(let id of findProjectIdsBasedOnCase[0]) {
          projectFiscalRids.push(id.project_fiscal_rid)
        }
      } else {
        projectFiscalRids = ['']
      }
    }
    let result = await orgDb.query<FourPartAssessmentListResponse>(fetchFourPartAssessment(data.page, data.limit, data.sort, data.sort_by, data.filter, data.search, schemaName,isPagination, isSorting, isFiltering, data.account_rid, data.project_fiscal_rid, projectFiscalRids, data.type, data.isExport ), {type : QueryTypes.SELECT});
    if(result.length > 0) {
      const fetchCreatedByIds = [...new Set(result.filter((f) => f.created_by !== null).map((d) => d.created_by))];
      const findUserDetails = await mainDb.query<UserReturnType>(rawQueries.fetchUser(fetchCreatedByIds), {type : QueryTypes.SELECT});
      let mapUserDetails = new Map(findUserDetails?.map((u) => [u.rid, `${u.first_name} ${u.last_name}`]));

      result = result.map((d) => {
        return {
          ...d,
          created_by_name : mapUserDetails.get(d.created_by) as string,
        }
      });

      if(!isFiltering) {
        let dynamicFilteringName : keyof FourPartAssessmentListResponse;
        for(let [key, condition] of Object.entries(data.filter)) {
          if(key === 'created_by_name') dynamicFilteringName = 'created_by_name'
          else dynamicFilteringName = 'modified_by_name'
            for(let [cond, value] of Object.entries(condition)) {
              if(cond === 'equals') {
                result = result.filter((f) => f[dynamicFilteringName]!.toLowerCase() === value.toLowerCase())
              }
              else if(cond === 'not_equals') {
                result = result.filter((f) => f[dynamicFilteringName]!.toLowerCase() !== value.toLowerCase())
              }
              else if(cond === 'contains') {
                result = result.filter((f) => f[dynamicFilteringName]!.includes(value))
              }
            }
        }
      }
      if(!isSorting) {
        if(data.sort === "created_by_name") {
          if(data.sort_by.toLowerCase() === "desc")
            result = result.sort((a, b) => b.created_by_name?.localeCompare(a.created_by_name))
          else 
            result = result.sort((a, b) => a.created_by_name?.localeCompare(b.created_by_name))
        } else {
          if(data.sort_by.toLowerCase() === "desc")
            result = result.sort((a, b) => b.modified_by_name?.localeCompare(a.modified_by_name ?? '') ?? 0)
          else 
            result = result.sort((a, b) => a.modified_by_name?.localeCompare(b.modified_by_name ?? '') ?? 0)
        }
      }
      let totalResultCount;
      if(!isPagination) totalResultCount = result.length
      else totalResultCount = result[0]?.total_results || 0
      result = isPagination && !data.isExport ? result : result.slice(((data.page - 1) * data.limit), data.page * data.limit) 

      const finalData = {
        page : data.page,
        limit : data.limit,
        total_results : totalResultCount,
        data : result
      }
      return {
        statusCode : HttpStatus.SUCCESS,
        statusMessage : STATUS_MESSAGE.fourPartListSuccess,
        data : finalData
      }
    } else {
      return {
        statusCode : HttpStatus.SUCCESS,
        statusMessage : STATUS_MESSAGE.dataNotFound,
        data : {
          page : data.page,
          limit : data.limit,
          total_results : 0,
          data : []
        }
      }
    }
  } return {
   statusCode : HttpStatus.NOT_FOUND,
   statusMessage : STATUS_MESSAGE.accountNoFound,
   data : {
    page : data.page,
    limit : data.limit,
    total_results : 0,
    data : []
   }
  }
}
async getFpaDetailsById (data : any) : Promise<any> {
  const mainDb = await this.getMainDb();
  const orgDb = await this.getOrgDb();

  const [fetchParentAccount] = await mainDb.query<ParentAccountType>(await rawQueries.fetchParentAccount(data.account_rid, mainDb), {type : QueryTypes.SELECT});
  if(fetchParentAccount) {
    const schemaName = rawQueries.fetchSchemaName(fetchParentAccount.r_number);
    const result = await orgDb.query(fetchFpaDetails(data.rid, schemaName));
    if(result[0][0]) {
      const userIds = [];
      let detailsResult = result[0][0] as any
      userIds.push(detailsResult?.audit_information.created_by);
      const findUserDetails : any = await mainDb.query(rawQueries.fetchUser(userIds));
      const mapUser = new Map(findUserDetails[0].map((d : any) => [d.rid, `${d.first_name} ${d.last_name}`]));
      detailsResult.audit_information.created_by_name = mapUser.get(detailsResult.audit_information.created_by);
      return {
        statusCode : HttpStatus.SUCCESS,
        statusMessage : STATUS_MESSAGE.fourPartListSuccess,
        data : {
          title : detailsResult.title,
          record_information : detailsResult.record_information,
          four_part_assessment_evaluation : detailsResult.four_part_assessment_evaluation,
          audit_information : detailsResult.audit_information,
          interaction_questions : detailsResult.interaction_questions
        }
      }
    } else {
      return {
      statusCode : HttpStatus.SUCCESS,
      statusMessage : STATUS_MESSAGE.dataNotFound,
      data : {}
      }
    }
  } else {
    return {
    statusCode : HttpStatus.NOT_FOUND,
    statusMessage : STATUS_MESSAGE.accountNoFound,
    data : {}
    }
  }
}
async exportFpaList (data : any) {
  const result = await this.getFourPartAssessmentList(data);
  return result;
}
async updateInteractionStatus (data : InteractionStatusUpdateRequest, userId : string) {
  const mainDb = await this.getMainDb();
  const fetchParentNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb))
  const { Interaction } = await this.interactionModelService.getModels(fetchParentNumber[0][0].r_number);
  const getAllStatus = await mainDb.query<AllStatusType>(rawQueries.fetchAllStatus(), {type : QueryTypes.SELECT})
  const mapStatus = new Map(getAllStatus.map((d) => [d.status_name, d.rid]));
  const getId = mapStatus.get(data.status_name) ?? ''
  const [result] = await Interaction.update({
    interaction_status_rid : getId,
    modified_by : userId,
    modified_datetime : new Date()
  }, {
    where : {
      rid : data.rid
    }
  });
  if(result > 0) {
    return {
      statusCode : HttpStatus.SUCCESS,
      statusMessage : STATUS_MESSAGE.interactionUpdated
    }
  } else {
    return {
      statusCode : HttpStatus.SUCCESS,
      statusMessage : STATUS_MESSAGE.noDataToUpdate
    }
  }
}
async getInteractionAssessmentSource () {
  const mainDb = await this.getMainDb();
  const result = await mainDb.query(rawQueries.fetchInteractionAllAssessmentSource());
  return {
    statusCode : HttpStatus.SUCCESS,
    data : result[0]
  }
}
}
