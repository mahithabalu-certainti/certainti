import { Sequelize } from "sequelize";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import { logMessage } from "../utils/helpers";
import { Interaction } from "../models/interaction";
import { InteractionItem } from "../models/interactionItem";
import { InteractionHistory } from "../models/interactionHistory";
import { InteractionTimeline } from "../models/interactionTimeline";
import { InteractionType } from "../models/interactionType";
import { MAIN_SCHEMA_NAME, rawQueries, SCHEMANAME_PREFIX } from "../utils/constants";
import { InteractionSummary } from "../models/interactionSummary";
import { InteractionResponseHistory } from "../models/interactionResponseHistory";
import { InteractionAttachment } from "../models/interactionAttachment";
import { AiTechnicalSummary } from "../models/aiTechnicalSummary";
import { AiAssessmentError } from "../models/aiAssessmentError";
import { AiAssessmentQre } from "../models/aiAssessmentQre";
import { AiAssessmentAudit } from "../models/aiAssessmentAudit";
import { SchedulerExecutions } from "../models/schedulerExecution";
import { SchedulerTaskExecutions } from "../models/schedulerTaskExecution";
import { WebhookEmailLog } from "../models/webhookEmailLog";
import { AccountInteractions } from "../models/accountInteractions";
import { SendEmailInfo } from "../models/sendEmailInfo";
import { AutoSendInteractionAudit } from "../models/autoSendInteractionAudit";
import { InteractionTemplate } from "../models/interactionTemplate";
import { InteractionTemplateItem } from "../models/interactionTemplateItems";
import { AiAssessmentEventTracker } from "../models/aiAssessmentEventTracker";
import { FourPartAssessment } from "../models/fourPartAssessment";

type OrgModels = {
  Interaction: typeof Interaction;
  InteractionItem: typeof InteractionItem;
  InteractionHistory: typeof InteractionHistory;
  InteractionResponseHistory: typeof InteractionResponseHistory;
  InteractionTimeline: typeof InteractionTimeline;
  InteractionType: typeof InteractionType;
  InteractionSummary: typeof InteractionSummary;
  InteractionAttachment: typeof InteractionAttachment;
  AiTechnicalSummary: typeof AiTechnicalSummary;
  AiAssessmentAudit: typeof AiAssessmentAudit;
  AiAssessmentError: typeof AiAssessmentError;
  AiAssessmentQre: typeof AiAssessmentQre;
  SchedulerExecution: typeof SchedulerExecutions;
  SchedulerTaskExecution: typeof SchedulerTaskExecutions;
  WebhookEmailLog: typeof WebhookEmailLog;
  AccountInteraction: typeof AccountInteractions;
  SendEmailInfo: typeof SendEmailInfo;
  AutoSendInteractionAudit: typeof AutoSendInteractionAudit;
  InteractionTemplate: typeof InteractionTemplate;
  InteractionTemplateItem: typeof InteractionTemplateItem;
  AiAssessmentEventTracker: typeof AiAssessmentEventTracker;
  FourPartAssessment: typeof FourPartAssessment;
};

export class InteractionModelService {
  orgDbSequelize: Sequelize | null = null;
  mainDbSequelize: Sequelize | null = null;
  private syncInProgress = new Map<string, Promise<void>>();
  private initLocks  = new Map<string, Promise<OrgModels>>();
  private syncLocks  = new Map<string, Promise<void>>();

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
      WebhookEmailLog: ReturnType<
        typeof WebhookEmailLog.initialize
      >;
      FourPartAssessment: ReturnType<typeof FourPartAssessment.initialise>
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

  async getModels(accountNumber: string) : Promise<OrgModels> {
    if (accountNumber === undefined || accountNumber === null || accountNumber === 'undefined') {
    throw new Error(`getModels called with invalid accountNumber: ${accountNumber}`);
  }

    logMessage(`Fetching the schema name for Models with AccountNumber : ${accountNumber}`)
    const numericPart = accountNumber.replace(/\D/g, "");
    if(!numericPart) {
      logMessage(`Error SchemaName with AccountNumber  : ${numericPart}`)
    }
    const schemaName = accountNumber === ''  ? MAIN_SCHEMA_NAME : rawQueries.fetchSchemaName(accountNumber);
    if (this.modelCache.has(schemaName)) {
      return this.modelCache.get(schemaName) as OrgModels; // ← skip re-initialization entirely
    }

    logMessage(`SchemaName After fetching AccountNumber  : ${schemaName}`)

    const sequelize = await this.getSequelize();
    const mainDbSequelize = await this.getMainSequelize();

    const InteractionModel = Interaction.initialize(sequelize, schemaName);
    const AiTechnicalSummaryModel = AiTechnicalSummary.initialize(sequelize, schemaName);
    const AiAssessmentErrorResponseModel = AiAssessmentError.initialize(sequelize, schemaName);
    const AutoSendInteractionAuditModel = AutoSendInteractionAudit.initialize(sequelize, schemaName);
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
    const InteractionTemplateModel = InteractionTemplate.initialize(
      mainDbSequelize,
      ""
    );
    const InteractionTemplateItemModel = InteractionTemplateItem.initialize(
      mainDbSequelize,
      ""
    );
    const AiAssessmentEventTrackerModel = AiAssessmentEventTracker.initialize(
      mainDbSequelize,
      ""
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
    const AccountInteractionModel = AccountInteractions.initialize(sequelize, schemaName)
    const SchedulerExcecutionModel = SchedulerExecutions.initialize(mainDbSequelize, "")
    const SchedulerTaskExecutionModel = SchedulerTaskExecutions.initialize(mainDbSequelize, "")
    const SendEmailInfoModel = SendEmailInfo.initialize(mainDbSequelize, "")

    const WebhookEmailLogModel = WebhookEmailLog.initialize(
      sequelize,
      schemaName
    );
    const FourPartAssessmentModel = FourPartAssessment.initialise(sequelize, schemaName)

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
      SchedulerExecution : SchedulerExcecutionModel,
      SchedulerTaskExecution : SchedulerTaskExecutionModel,
      WebhookEmailLog: WebhookEmailLogModel,
      AccountInteraction : AccountInteractionModel,
      SendEmailInfo : SendEmailInfoModel,
      AutoSendInteractionAudit: AutoSendInteractionAuditModel,
      InteractionTemplate: InteractionTemplateModel,
      InteractionTemplateItem: InteractionTemplateItemModel,
      AiAssessmentEventTracker: AiAssessmentEventTrackerModel,
      FourPartAssessment : FourPartAssessmentModel
    };

    this.modelCache.set(schemaName, models);
    return models;
  }

  async syncOrgDbModels(accountNumber: string): Promise<void> {
  if (!accountNumber || accountNumber === 'undefined') {
    throw new Error(`syncOrgDbModels called with invalid accountNumber: ${accountNumber}`);
  }

  const schemaName = rawQueries.fetchSchemaName(accountNumber);

  // If a sync is already running for this account, wait for it instead of starting another
  if (this.syncLocks.has(schemaName)) {
    logMessage(`[syncOrgDbModels] Sync already in progress for schema: ${schemaName}, waiting...`);
    return this.syncLocks.get(schemaName)!;
  }

  const syncPromise = this._doSync(accountNumber, schemaName);
  this.syncLocks.set(schemaName, syncPromise);

  try {
    await syncPromise;
  } finally {
    this.syncLocks.delete(schemaName); // always clean up lock
  }
}
private async _doSync(accountNumber: string, schemaName: string): Promise<void> {
  try {
    const sequelize = await this.getSequelize();

    // Initialize models into cache before syncing
    await this.getModels(accountNumber);

    // Check if schema exists
    const schemaExists = await sequelize.query(
      `SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = '${schemaName}');`,
      { type: 'SELECT', raw: true }
    );

    if (!schemaExists || !schemaExists[0] || !Object.values(schemaExists[0])[0]) {
      logMessage(`[syncOrgDbModels] Schema ${schemaName} does not exist, creating it...`);
      try {
        await sequelize.createSchema(schemaName, {});
        logMessage(`[syncOrgDbModels] Schema ${schemaName} created successfully`);
      } catch (schemaErr: any) {
        // Race condition — another process may have created it; safe to continue
        if (!schemaErr.message.includes('already exists')) {
          throw schemaErr;
        }
        logMessage(`[syncOrgDbModels] Schema ${schemaName} already exists (race condition), continuing`);
      }
    }

    // Sync tables
    try {
      await sequelize.sync({
        force:   false,
        schema:  schemaName,
        alter:   false,
        logging: false,
      });
      logMessage(`[syncOrgDbModels] Tables synced successfully for schema: ${schemaName}`);
    } catch (syncErr: any) {
      if (
        syncErr.message.includes('already exists') ||
        syncErr.name === 'SequelizeUniqueConstraintError'
      ) {
        logMessage(`[syncOrgDbModels] Tables already exist in schema: ${schemaName}, skipping sync`);
      } else {
        // Log but don't throw — tables likely exist from account creation
        logMessage(`[syncOrgDbModels] Sync warning for schema ${schemaName}: ${syncErr.message}`);
      }
    }
  } catch (error) {
    logMessage(`[syncOrgDbModels] Warning syncing tables for account ${accountNumber}: ${error}`);
    // Don't throw — assume tables exist from account creation
  }
}
  // async syncOrgDbModels(accountNumber: string): Promise<void> {
  //   try {
  //     const schemaName = rawQueries.fetchSchemaName(accountNumber)
  //     const sequelize = await this.getSequelize();

  //     // Get all models for this account to initialize them
  //     await this.getModels(accountNumber);

  //     // Check if schema exists
  //     const schemaExists = await sequelize.query(
  //       `SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = '${schemaName}');`,
  //       { type: "SELECT", raw: true }
  //     );

  //     if (!schemaExists || !schemaExists[0] || !Object.values(schemaExists[0])[0]) {
  //       logMessage(`[syncOrgDbModels] Schema ${schemaName} does not exist, creating it...`);
  //       try {
  //         await sequelize.createSchema(schemaName, {});
  //         logMessage(`[syncOrgDbModels] Schema ${schemaName} created successfully`);
  //       } catch (schemaErr: any) {
  //         // Schema might already exist (race condition), continue
  //         if (!schemaErr.message.includes('already exists')) {
  //           throw schemaErr;
  //         }
  //       }
  //     }

  //     // Try to sync only if needed, with error handling
  //     try {
  //       await sequelize.sync({
  //         force: false,
  //         schema: schemaName,
  //         alter: false,
  //         logging: false,
  //       });
  //       logMessage(`[syncOrgDbModels] Tables synced successfully for schema: ${schemaName}`);
  //     } catch (syncErr: any) {
  //       // If tables already exist, this is not an error we need to propagate
  //       if (syncErr.message.includes('already exists') || syncErr.name === 'SequelizeUniqueConstraintError') {
  //         logMessage(`[syncOrgDbModels] Tables already exist in schema: ${schemaName}, skipping sync`);
  //       } else {
  //         logMessage(`[syncOrgDbModels] Sync warning for schema ${schemaName}: ${syncErr.message}`);
  //         // Don't throw - tables likely already exist from account creation
  //       }
  //     }
  //   } catch (error) {
  //     logMessage(`[syncOrgDbModels] Warning syncing tables for account ${accountNumber}: ${error}`);
  //     // Don't throw - assume tables exist from account creation, just log the warning
  //   }
  // }

}
