import { InteractionModelService } from "../interactionModelsService";
import { initOrgSequelize } from "../../config/orgDataSource";
import dayjs from "dayjs";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { col, fn, Op, QueryTypes, Sequelize, Transaction, UUIDV4, where } from "sequelize";
import {
  FourPartAssessmentResponse,
  ICreateAccountInteraction,
  ICreateInteraction,
  ICreateTemplateInteraction,
  InteractionDetailsResponse,
  InteractionResponse,
  IProject,
  IUpdateInteraction,
} from "../../utils/types";
import { Interaction } from "../../models/interaction";
import { ALPHANUMERIC_CONDITIONS, HttpStatus, MAIN_SCHEMA_NAME, mainTableFilters, rawQueries, schedulerStatus, SCHEMANAME_PREFIX, statusAction, techSummaryStatus } from "../../utils/constants";
import { SendEmailInfo } from "../../models/sendEmailInfo";
import { decryptClientSecret, logMessage } from "../../utils/helpers";
import { fetchStatusIdsForReminderList } from "../../utils/rawQueries";
import { generateSasUrl } from "../../utils/blob";
import axios from "axios";

class InteractionSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private interactionModelService: InteractionModelService;

  constructor() {
    this.interactionModelService = new InteractionModelService();
  }

   async createAccountInteractions(
    accountNumber: string,
    interactionData: ICreateAccountInteraction,
    transaction: Transaction
  ) {
    // Implementation for creating interactions in the database
    try {
      const { AccountInteraction } = await this.interactionModelService.getModels(
        accountNumber
      );

      const interaction = await AccountInteraction.create(interactionData, {
        transaction,
      });

      return interaction;
    } catch (error) {
      logMessage(`Error Account interaction: ${error}`);
      throw new Error("Error creating interaction: " + error);
    }
  }
  

  async createInteractions(
    accountNumber: string,
    interactionData: ICreateInteraction,
    transaction: Transaction,
    intLevel :string
  ) {
    // Implementation for creating interactions in the database
    try {
      const { Interaction } = await this.interactionModelService.getModels(
        accountNumber
      );
      const interactionLevel = await this.getInteractionLevelByType(intLevel);
      interactionData.interaction_level_rid = interactionLevel!;
      interactionData.recipient_name = interactionData.email_info?.name || null
      interactionData.recipient_email = interactionData.email_info?.email || null
      const interaction = await Interaction.create(interactionData, {
        transaction,
      });

      return interaction;
    } catch (error) {
      logMessage(`Error creating interaction: ${error}`);
      throw new Error("Error creating interaction: " + error);
    }
  }

  async addInteractionItems(
    accountNumber: string,
    interactionData: ICreateInteraction,
    interactionRid: string,
    transaction: Transaction,
    userId: string
  ) {
    try {
      const { InteractionItem, InteractionHistory } =
        await this.interactionModelService.getModels(accountNumber);

      if (Array.isArray(interactionData.questions)) {
        for (const question of interactionData.questions) {
          switch (question.action_type) {
            case "add":
              await this.handleAddQuestion(
                InteractionItem,
                interactionData,
                interactionRid,
                question,
                userId,
                'Project',
                transaction
              );
              break;
            case "delete":
              await this.handleDeleteQuestion(
                InteractionItem,
                InteractionHistory,
                interactionRid,
                question,
                userId,
                transaction
              );
              break;
            case "edit":
              await this.handleEditQuestion(
                InteractionItem,
                InteractionHistory,
                interactionData,
                interactionRid,
                question,
                userId,
                transaction
              );
              break;
            default:
            logMessage(
                `[addInteractionItems] Unknown action_type: ${question.action_type}`
              );
          }
        }
      } else {
        logMessage(`[addInteractionItems] No questions to process.`);
      }
    } catch (error) {
      logMessage(`[addInteractionItems] Error: ${error}`);
      throw new Error(
        "Error creating interaction: " + (error as Error).message
      );
    }
  }

   async addAccountInteractionItems(
    accountNumber: string,
    interactionData: ICreateAccountInteraction,
    interactionRid: string,
    transaction: Transaction,
    userId: string
  ) {
    try {
      const { InteractionItem, InteractionHistory } =
        await this.interactionModelService.getModels(accountNumber);

      if (Array.isArray(interactionData.questions)) {
        for (const question of interactionData.questions) {
          switch (question.action_type) {
            case "add":
              await this.handleAddQuestionAccount(
                InteractionItem,
                interactionData,
                interactionRid,
                question,
                userId,
                'Account',
                transaction
              );
              break;
            case "delete":
              await this.handleDeleteQuestionAccount(
                InteractionItem,
                InteractionHistory,
                interactionRid,
                question,
                userId,
                transaction
              );
              break;
               case "edit":
              await this.handleEditQuestionAccount(
                InteractionItem,
                InteractionHistory,
                interactionData,
                interactionRid,
                question,
                userId,
                transaction
              );
              break;
           
            default:
              logMessage(
                `[addInteractionItems] Unknown action_type: ${question.action_type}`
              );
          }
        }
      } else {
        logMessage(`[addInteractionItems] No questions to process.`);
      }
    } catch (error) {
      logMessage(`[addInteractionItems] Error: ${error}`);
      throw new Error(
        "Error creating interaction: " + (error as Error).message
      );
    }
  }


  async createBulkInteractions(
    accountNumber: string,
    interactionData: ICreateInteraction,
    userId: string,
    parentAccountId: string,
    interactionLevel: string
  ) {
    try {
      const { Interaction, InteractionItem, InteractionSummary } = await this.interactionModelService.getModels(accountNumber);
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      const chunkSize = 500;

      // Utility: Prepare bulk interaction data
      const prepareInteractionData = (projects: IProject[]) =>
        projects.map((proj) => ({
          project_rid: proj.project_rid,
          project_fiscal_rid: proj.project_fiscal_rid,
          interaction_type_rid: interactionData.interaction_type_rid,
          interaction_source_rid: interactionData.interaction_source_rid,
          account_rid: interactionData.account_rid,
          fiscal_year: proj.fiscal_year,
          created_datetime: new Date(),
          created_by: userId,
          status_rid: interactionData.status_rid,
          interaction_level_rid: interactionData.interaction_level_rid,
          recipient_name : interactionData.email_info?.name,
          recipient_email : interactionData.email_info?.email
        }));

      // Utility: Bulk create with chunking
      const batchInsert = async (model: any, data: any[], options: any = {}) => {
        let results: any[] = [];
        for (let j = 0; j < data.length; j += chunkSize) {
          const chunk = data.slice(j, j + chunkSize);
          const created = await model.bulkCreate(chunk, { ...options, returning: true });
          results.push(...created);
        }
        return results;
      };

      // Utility: Prepare bulk interaction items
      const prepareInteractionItems = (interactions: any[], questions: any[]) =>
        interactions.flatMap((interaction) =>
          questions.map((question: any) => ({
            interaction_rid: interaction.rid,
            account_rid: interactionData.account_rid,
            interaction_level_rid: interactionData.interaction_level_rid,
            ...question,
            created_by: userId,
            created_datetime: new Date(),
          }))
        );

      // Utility: Prepare bulk InteractionSummary data
      const prepareInteractionSummary = (interactions: any[]) =>
        interactions.map((interaction) => ({
          interaction_rid: interaction.rid,
          r_number: interaction.r_number || null,
          ...interactionData,
          created_datetime: new Date(),
          created_by: userId,
        }));

      // Utility: Prepare bulk SendEmailInfo data
      // Maps interactions to projects by project_fiscal_rid instead of array index to handle skipped interactions from ignoreDuplicates
      const prepareSendEmailInfoData = (interactions: any[], projects: IProject[]) => {
        const projectMap = new Map(projects.map(p => [p.project_fiscal_rid, p]));
        return interactions.map((interaction) => {
          const project = projectMap.get(interaction.project_fiscal_rid);
          return {
            interaction_rid: interaction.rid,
            account_rid: interactionData.account_rid,
            account_rnumber: accountNumber,
            project_fiscal_rid: interaction.project_fiscal_rid,
            user_rid: userId,
            is_email_send: false,
            interaction_level: interactionLevel,
            name: interactionData.email_info?.name || "",
            email: interactionData.email_info?.email || "",
          };
        });
      };

      // For Project level interactions, bulk check if key contact details exist when name and email are empty
      let projectsWithoutKeyContacts: Set<string> = new Set();
      if (Array.isArray(interactionData.projects) && interactionData.projects.length > 0) {
        if (interactionLevel === 'Project' && (!interactionData.email_info?.name || !interactionData.email_info?.email)) {
          const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(/\D/g, "")}`;
          projectsWithoutKeyContacts = await this.getProjectsWithoutKeyContacts(
            interactionData.projects.map(p => p.project_fiscal_rid),
            schemaName
          );
        }

        // Bulk create Interactions
        const interactionRequests = prepareInteractionData(interactionData.projects);
        const createdInteractions = await batchInsert(Interaction, interactionRequests, { ignoreDuplicates: true });

        // Bulk insert InteractionSummary
        const interactionSummaryData = prepareInteractionSummary(createdInteractions);
        await batchInsert(InteractionSummary, interactionSummaryData);

        // Bulk insert InteractionItem
        if (interactionData.questions && Array.isArray(interactionData.questions) && interactionData.questions.length > 0) {
          const interactionItemsBulk = prepareInteractionItems(createdInteractions, interactionData.questions);
          await batchInsert(InteractionItem, interactionItemsBulk);
        }
        let autoSendAccess:boolean = false;
        if(!interactionData.trigger_send)
        {
           const globalInteractionAccess = await this.checkGlobalAutoSendAccess();
           if(globalInteractionAccess) {
            autoSendAccess = true;
           }
           else
           {
            const accountInteraction = await this.checkAccountAutoSendAccess(accountNumber, interactionData.account_rid);
            if(accountInteraction) {
              autoSendAccess = true;
            }
           }
        }
       
        const isParensettingsConfigured = await this.fetchAccountDetails(accountNumber, parentAccountId,interactionData.account_rid);
        if (isParensettingsConfigured && (interactionData.trigger_send || autoSendAccess)) {
          // Filter projects: exclude those with no key contacts and no email_info
          const filteredProjects = interactionData.projects.filter(proj => 
            !projectsWithoutKeyContacts.has(proj.project_fiscal_rid)
          );
          // Filter interactions based on their own project_fiscal_rid to avoid index misalignment
          const filteredInteractions = createdInteractions.filter((interaction: any) => {
            const projectRid = (interaction as any).project_fiscal_rid;
            return projectRid ? !projectsWithoutKeyContacts.has(projectRid) : true;
          });
          
          // Bulk insert SendEmailInfo only for projects with key contacts or email_info
          if (filteredProjects.length > 0 && filteredInteractions.length > 0) {
            const sendEmailInfoData = prepareSendEmailInfoData(filteredInteractions, filteredProjects);
            await batchInsert(SendEmailInfo, sendEmailInfoData);
          }

          // Bulk update Interaction status to INQUEUE for projects with email info
          const inqueueStatusRid = await this.getInteractionStatusByType(statusAction.INQUEUE);
          if (filteredInteractions.length > 0) {
            await Interaction.update(
              { status_rid: inqueueStatusRid! },
              { where: { rid: filteredInteractions.map(i => i.rid) } }
            );
          }
        }
        else
        {
          // Check project auto-send access and collect enabled projects
          const enabledProjects: IProject[] = [];
          const enabledInteractions: any[] = [];
          
          // Create a map of interactions by project_fiscal_rid for accurate matching
          const interactionMap = new Map(
            createdInteractions.map((interaction: any) => [interaction.project_fiscal_rid, interaction])
          );
          
          for (const project of interactionData.projects) {
            if (!project) continue; // Skip if project is undefined
            
            // Skip projects that have no key contacts and no email_info
            if (projectsWithoutKeyContacts.has(project.project_fiscal_rid)) {
              continue;
            }
            
            const isEnabled = await this.checkProjectAutoSendAccess(accountNumber, project.project_fiscal_rid);
            
            if (isEnabled) {
              enabledProjects.push(project);
              // Find corresponding interaction for this project by project_fiscal_rid instead of array index
              const correspondingInteraction = interactionMap.get(project.project_fiscal_rid);
              if (correspondingInteraction) {
                enabledInteractions.push(correspondingInteraction);
              }
            }
          }

          // Bulk insert SendEmailInfo for enabled projects only
          if (enabledProjects.length > 0 && enabledInteractions.length > 0 && isParensettingsConfigured) {
            const sendEmailInfoData = prepareSendEmailInfoData(enabledInteractions, enabledProjects);
            await batchInsert(SendEmailInfo, sendEmailInfoData);

            // Bulk update Interaction status to INQUEUE for enabled projects only
            const inqueueStatusRid = await this.getInteractionStatusByType(statusAction.INQUEUE);
            await Interaction.update(
              { status_rid: inqueueStatusRid! },
              { where: { rid: enabledInteractions.map(i => i.rid) } }
            );
          }
        }
      }
    } catch (error) {
      logMessage(`Error creating bulk interactions: ${error}`);
      throw new Error("Error creating interaction: " + error);
    }
  }
  

  private async handleAddQuestion(
    InteractionItem: any,
    interactionData: ICreateInteraction,
    interactionRid: string,
    question: any,
    userId: string,
    type: string,
    transaction: Transaction
  ) {
    if (interactionRid) {
      interactionData.created_by = userId;
      const item = {
        interaction_rid: interactionRid,
        ...question,
        ...interactionData,
        created_by: userId, // Ensure created_by is always userId
      };
      await InteractionItem.create(item, { transaction });
    }
  }

  
  private async handleAddQuestionAccount(
    InteractionItem: any,
    interactionData:  ICreateAccountInteraction,
    interactionRid: string,
    question: any,
    userId: string,
    type: string,
    transaction: Transaction
  ) {
    if (interactionRid) {
      interactionData.created_by = userId;
      const item = {
        account_interaction_rid: interactionRid,
        type: type,
        ...question,
        ...interactionData,
        created_by: userId, // Ensure created_by is always userId
      };
      await InteractionItem.create(item, { transaction });
      logMessage(`[addInteractionItems] Added question: ${JSON.stringify(item)}`);
    }
  }

   private async handleAddQuestionTemplate(
    InteractionTemplate: any,
    interactionData: ICreateTemplateInteraction,
    interactionRid: string,
    question: any,
    userId: string,
    type: string
  ) {
    if (interactionRid) {
      interactionData.created_by = userId;
      const item = {
        ...question,
        ...interactionData,
        template_rid: interactionRid,
        created_by: userId, // Ensure created_by is always userId
      };
      await InteractionTemplate.create(item);
    }
  }

  private async handleDeleteQuestionTemplate(
    InteractionTemplateQuestions: any,
    interactionRid: string,
    question: any,
    userId: string,
    transaction: Transaction
  ) {
    await InteractionTemplateQuestions.destroy({
      where: { template_rid: interactionRid, rid: question.rid },
      transaction,
    });
  }
   private async handleEditQuestionTemplate(
    InteractionTemplateQuestions: any,
    interactionData: ICreateTemplateInteraction,
    interactionRid: string,
    question: any,
    userId: string,
    transaction: Transaction
  ) {
    const existingData = await InteractionTemplateQuestions.findOne({
      where: { template_rid: interactionRid, rid: question.rid },
    });
    await InteractionTemplateQuestions.update(
      { ...question, ...interactionData },
      {
        where: { template_rid: interactionRid, rid: question.rid },
        transaction,
      }
    );
  }

  private async handleDeleteQuestion(
    InteractionItem: any,
    InteractionHistory: any,
    interactionRid: string,
    question: any,
    userId: string,
    transaction: Transaction
  ) {
    const existingData = await InteractionItem.findOne({
      where: { interaction_rid: interactionRid, rid: question.rid },
    });
    await Promise.all([
      InteractionHistory.create(
        {
          interaction_rid: interactionRid,
          attribute_name: "question",
          old_value: existingData?.dataValues?.question ?? "",
          new_value: "",
          interaction_item_rid: question?.rid ?? "",
          created_by: userId,
        },
        { transaction }
      ),
      InteractionHistory.create(
        {
          interaction_rid: interactionRid,
          attribute_name: "notes",
          old_value: existingData?.dataValues?.notes ?? "",
          new_value: "",
          interaction_item_rid: question?.rid ?? "",
          created_by: userId,
        },
        { transaction }
      ),
      InteractionHistory.create(
        {
          interaction_rid: interactionRid,
          attribute_name: "is_mandatory",
          old_value: existingData?.dataValues?.is_mandatory ?? "",
          new_value: "",
          interaction_item_rid: question?.rid ?? "",
          created_by: userId,
        },
        { transaction }
      ),
    ]);
    await InteractionItem.destroy({
      where: { interaction_rid: interactionRid, rid: question.rid },
      transaction,
    });
    await InteractionHistory.create(
      {
        interaction_rid: interactionRid,
        attribute_name: "question",
        old_value: existingData?.dataValues?.question ?? "",
        new_value: "",
        interaction_item_rid: question?.rid ?? "",
        created_by: userId,
      },
      { transaction }
    );
  }

   private async handleDeleteQuestionAccount(
    InteractionItem: any,
    InteractionHistory: any,
    interactionRid: string,
    question: any,
    userId: string,
    transaction: Transaction
  ) {
    const existingData = await InteractionItem.findOne({
      where: { interaction_rid: interactionRid, rid: question.rid },
    });
    await Promise.all([
      InteractionHistory.create(
        {
          interaction_rid: interactionRid,
          attribute_name: "question",
          old_value: existingData?.dataValues?.question ?? "",
          new_value: "",
          interaction_item_rid: question?.rid ?? "",
          created_by: userId,
        },
        { transaction }
      ),
      InteractionHistory.create(
        {
          interaction_rid: interactionRid,
          attribute_name: "notes",
          old_value: existingData?.dataValues?.notes ?? "",
          new_value: "",
          interaction_item_rid: question?.rid ?? "",
          created_by: userId,
        },
        { transaction }
      ),
      InteractionHistory.create(
        {
          interaction_rid: interactionRid,
          attribute_name: "is_mandatory",
          old_value: existingData?.dataValues?.is_mandatory ?? "",
          new_value: "",
          interaction_item_rid: question?.rid ?? "",
          created_by: userId,
        },
        { transaction }
      ),
    ]);
    await InteractionItem.destroy({
      where: { account_interaction_rid: interactionRid, rid: question.rid },
      transaction,
    });
    await InteractionHistory.create(
      {
        interaction_rid: interactionRid,
        attribute_name: "question",
        old_value: existingData?.dataValues?.question ?? "",
        new_value: "",
        interaction_item_rid: question?.rid ?? "",
        created_by: userId,
      },
      { transaction }
    );
  }

  private async handleEditQuestionAccount(
    InteractionItem: any,
    InteractionHistory: any,
    interactionData:  ICreateAccountInteraction,
    interactionRid: string,
    question: any,
    userId: string,
    transaction: Transaction
  ) {
    const existingData = await InteractionItem.findOne({
      where: { interaction_rid: interactionRid, rid: question.rid },
    });
    await InteractionItem.update(
      { ...question, ...interactionData },
      {
        where: { account_interaction_rid: interactionRid, rid: question.rid },
        transaction,
      }
    );
    await Promise.all([
      InteractionHistory.create(
        {
          interaction_rid: interactionRid,
          attribute_name: "question",
          old_value: existingData?.dataValues?.question ?? "",
          new_value: question?.question ?? "",
          interaction_item_rid: question?.rid ?? "",
          created_by: userId,
        },
        { transaction }
      ),
      InteractionHistory.create(
        {
          interaction_rid: interactionRid,
          attribute_name: "notes",
          old_value: existingData?.dataValues?.notes ?? "",
          new_value: question?.notes ?? "",
          interaction_item_rid: question?.rid ?? "",
          created_by: userId,
        },
        { transaction }
      ),
      InteractionHistory.create(
        {
          interaction_rid: interactionRid,
          attribute_name: "is_mandatory",
          old_value: existingData?.dataValues?.is_mandatory ?? "",
          new_value: question?.is_mandatory ?? "",
          interaction_item_rid: question?.rid ?? "",
          created_by: userId,
        },
        { transaction }
      ),
    ]);
  }

  
  private async handleEditQuestion(
    InteractionItem: any,
    InteractionHistory: any,
    interactionData: ICreateInteraction,
    interactionRid: string,
    question: any,
    userId: string,
    transaction: Transaction
  ) {
    const existingData = await InteractionItem.findOne({
      where: { interaction_rid: interactionRid, rid: question.rid },
    });
    await InteractionItem.update(
      { ...question, ...interactionData },
      {
        where: { interaction_rid: interactionRid, rid: question.rid },
        transaction,
      }
    );
    await Promise.all([
      InteractionHistory.create(
        {
          interaction_rid: interactionRid,
          attribute_name: "question",
          old_value: existingData?.dataValues?.question ?? "",
          new_value: question?.question ?? "",
          interaction_item_rid: question?.rid ?? "",
          created_by: userId,
        },
        { transaction }
      ),
      InteractionHistory.create(
        {
          interaction_rid: interactionRid,
          attribute_name: "notes",
          old_value: existingData?.dataValues?.notes ?? "",
          new_value: question?.notes ?? "",
          interaction_item_rid: question?.rid ?? "",
          created_by: userId,
        },
        { transaction }
      ),
      InteractionHistory.create(
        {
          interaction_rid: interactionRid,
          attribute_name: "is_mandatory",
          old_value: existingData?.dataValues?.is_mandatory ?? "",
          new_value: question?.is_mandatory ?? "",
          interaction_item_rid: question?.rid ?? "",
          created_by: userId,
        },
        { transaction }
      ),
    ]);
  }

  
    /**
       * Fetches user full name, event type, and event name in a single query.
       * @param params Object with userId, eventType, eventName
       * @returns Object with fullName, eventType, eventName
       */
    async fetchUserAndEventInfo(params: { userId: string; eventType: string;}) {
      const sequelize = await initMainDbSequelize();
      // Assumes the rawQueries have the correct SQL for each subquery
      // This query returns a single row with all three values
      const query = rawQueries.fetchUserAndEventInfo();
      const [result] = await sequelize.query(query, {
        replacements: {
          userId: params.userId,
          eventType: params.eventType
        },
        type: "SELECT",
      });
      return result;
    }
  
    /**
     * Create an entry in the account_timeline table for the given schema.
     * @param sequelize Sequelize instance connected to the main DB
     * @param schemaName The schema name where the account_timeline table exists
     * @param entryData Object containing the timeline entry fields
     */
    async createAccountTimelineEntry(accountNumber: string,
      entryData: {
        created_by: string;
        account_rid: string;
        entity_rid: string;
        entity_name: string;
        created_by_name: string;
        event_type_rid: string;
        event_name?: string;
        descriptions?: string;
        project_rid?: string;
        case_rid?: string;
      },
      entityTypes: string[]
    ) {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
        if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      for (const entityType of entityTypes) {
        if(entityType === "account")
          {
              const [result] = await this.orgDbSequelize.query(rawQueries.insertTimeLine(schemaName,"account_timeline"), {
              replacements: entryData,
              type: QueryTypes.INSERT,
          });
          }
          else if(entityType === "project")
          {
              const [result] = await this.orgDbSequelize.query(rawQueries.insertProjectTimeLine(schemaName,"project_timeline"), {
              replacements: entryData,
              type: QueryTypes.INSERT,
          });
          }
  
      }
    }

  async addInteractionHistory(
    accountNumber: string,
    newProjectTaskData: any,
    existingProjectTaskData: any,
    interaction_rid: string,
    userId: string,
    transaction: Transaction
  ) {
    const { InteractionHistory } = await this.interactionModelService.getModels(
      accountNumber
    );

    const excludedFields = [
      "modified_by",
      "account_rid",
      "project_rid",
      "project_fiscal_rid",
      "interaction_rid",
      "modified_datetime",
      "fiscal_year",
      "interaction_type_rid",
      "interaction_source_rid",
    ];

    const cleanedNewData = Object.fromEntries(
      Object.entries(newProjectTaskData).filter(
        ([key]) => !excludedFields.includes(key)
      )
    );

    const historyChanges: any[] = [];

    for (const [key, newValue] of Object.entries(cleanedNewData)) {
      let oldValue = existingProjectTaskData[key];

      if (key === "questions" && Array.isArray(newValue)) {
        oldValue = existingProjectTaskData["question"];
        for (let i = 0; i < newValue.length; i++) {
          const newQuestion = newValue[i];
          const oldQuestion = Array.isArray(oldValue) ? oldValue[i] : undefined;

          // Compare question text or other properties as needed
          if ((newQuestion?.question ?? "") !== (oldQuestion?.question ?? "")) {
            historyChanges.push({
              interaction_rid: interaction_rid,
              attribute_name: "question",
              old_value: oldQuestion?.question ?? "",
              new_value: newQuestion?.question ?? "",
              interaction_item_rid: newQuestion?.rid ?? "",
              modified_by: userId,
              r_number: "",
              created_by: userId,
            });
          }
        }
        continue;
      }

      if (newValue == null && oldValue == null) continue;

      // Handle numeric comparison with fixed precision
      if (!isNaN(newValue as any) && !isNaN(oldValue as any)) {
        const roundedNew = Number(parseFloat(newValue as any).toFixed(2));
        const roundedOld = Number(parseFloat(oldValue as any).toFixed(2));
        if (roundedNew === roundedOld) continue;
      } else if (String(newValue ?? "") === String(oldValue ?? "")) {
        continue;
      }

      historyChanges.push({
        interaction_rid: interaction_rid,
        attribute_name: key,
        old_value:
          oldValue !== null && oldValue !== undefined ? String(oldValue) : "",
        new_value:
          newValue !== null && newValue !== undefined ? String(newValue) : "",
        modified_by: userId,
        r_number: "",
        created_by: userId,
      });
    }

    if (historyChanges.length === 0) return;

    const latest = await InteractionHistory.findAll();

    historyChanges.forEach((change, i) => {
      change.r_number = `PTAH${(latest.length + i + 1)
        .toString()
        .padStart(4, "0")}`;
    });

    await InteractionHistory.bulkCreate(historyChanges, {
      transaction,
    });
  }

  async addInteractionSummary(
    accountNumber: string,
    interactionData: ICreateInteraction,
    interactionRid: string,
    interactionRnumber: string,
    interactionIteration: number,
    parentInteractionRid: string | null
  ) {
    try {
      const { InteractionSummary } =
        await this.interactionModelService.getModels(accountNumber);

      await InteractionSummary.create({
        interaction_rid: interactionRid,
        parent_interaction_rid: parentInteractionRid,
        interaction_iteration: interactionIteration,
        r_number: interactionRnumber,
        ...interactionData,
      });
    } catch (error) {
      logMessage(`Error creating interaction summary: ${error}`);
      throw new Error(
        "Error creating interaction summary: " + (error as Error).message
      );
    }
  }

  async addInteractionTimeline(
    accountNumber: string,
    eventName: string,
    interactionData: ICreateInteraction,
    interactionId: string,
    userId: string,
    transaction: Transaction
  ) {
    try {
      const { InteractionTimeline } =
        await this.interactionModelService.getModels(accountNumber);

      await InteractionTimeline.create(
        {
          account_rid: interactionData.account_rid,
          event_name: eventName,
          event_status: "success",
          event_type: "ui handler",
          entity_rid: interactionId,
          created_by: userId,
          event_datetime: new Date(),
          created_datetime: new Date(),
        },
        {
          transaction,
        }
      );
    } catch (err) {
      logMessage(`Error creating interaction timeline: ${err}`);
      throw new Error("Error creating interaction timeline");
    }
  }

  async updateInteraction(
    accountNumber: string,
    interactionData: IUpdateInteraction,
    userId: string,
    transaction: Transaction
  ) {
    const { Interaction, InteractionSummary } =
      await this.interactionModelService.getModels(accountNumber);

    const updatedInteraction = await Interaction.update(
      {
        ...interactionData,
        modified_by: userId,
        modified_datetime: new Date(),
        recipient_name : interactionData.email_info?.name,
        recipient_email : interactionData.email_info?.email
      },
      {
        where: {
          rid: interactionData.interaction_rid
        },
        transaction,
      }
    );
    await InteractionSummary.update(
      {
        ...interactionData,
        modified_by: userId,
        modified_datetime: new Date(),
      },
      {
        where: {
          interaction_rid: interactionData.interaction_rid,
        },
      }
    );

    return updatedInteraction;
  }

   async updateAccountInteraction(
    accountNumber: string,
    interactionData: ICreateAccountInteraction,
    userId: string,
    transaction: Transaction
  ) {
    const { AccountInteraction } =
      await this.interactionModelService.getModels(accountNumber);

    const updatedInteraction = await AccountInteraction.update(
      {
        ...interactionData,
        modified_by: userId,
        modified_datetime: new Date(),
      },
      {
        where: {
          rid: interactionData.account_interaction_rid,

        },
        transaction,
      }
    );

    return updatedInteraction;
  }

  

  async getPreviousInteractionStatus(statusRid: string, accountNumber: string) {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.interactionModelService.getSequelize();
    }
    const prevStatus = await this.getInteractionStatusByType(
      statusAction.ON_HOLD
    );
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;
    const [previousStatus]: any[] = await this.orgDbSequelize.query(
      rawQueries.fetchPreviousInteractionStatus(
        prevStatus || statusAction.CREATE,
        schemaName
      ),
      {
        replacements: { rid: statusRid },
        type: "SELECT",
      }
    );

    return previousStatus?.old_status_rid;
  }
  async fetchValidAccountNumberById(accountId: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }

      const [account]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchParentAccountforEmail,
        {
          replacements: { rid: accountId },
          type: "SELECT",
        }
      );

      let accountRnumber = account?.r_number;

      if (account?.storage_type === "store_in_parent") {
        const [accountData]: any[] = await this.mainDbSequelize.query(
          rawQueries.fetchParentAccountforEmail,
          {
            replacements: { rid: account?.parent_account_rid },
            type: "SELECT",
          }
        );
        accountRnumber = accountData?.r_number;
      }

      return {
        accountNumber: accountRnumber,
        accountId: account?.rid,
        accountName: account?.account_name,
        parentAccountId: account?.parent_account_rid
      };
    } catch (err) {
      logMessage(`Error fetching account: ${err}`);
      throw new Error("Error fetching account : " + (err as Error).message);
    }
  }

  async fetchValidAccountNumberByIdForEmail(accountId: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }

      const [account]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchParentAccountforEmail,
        {
          replacements: { rid: accountId },
          type: "SELECT",
        }
      );

      let accountRnumber = account?.r_number;

      if (!account?.is_parent) {
        const [accountData]: any[] = await this.mainDbSequelize.query(
          rawQueries.fetchParentAccountforEmail,
          {
            replacements: { rid: account?.parent_account_rid },
            type: "SELECT",
          }
        );
        accountRnumber = accountData?.r_number;
      }

      return {
        accountNumber: accountRnumber,
        accountId: account?.rid,
        accountName: account?.account_name,
        parentAccountId: account?.parent_account_rid
      };
    } catch (err) {
      logMessage(`Error fetching account for email: ${err}`);
      throw new Error("Error fetching account for email: " + (err as Error).message);
    }
  }
   async listAccountInteractions(
    accountNumber: string,
    accountRid: string,
    page: number = 1,
    limit: number = 100,
    filters: Record<string, string>,
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    interactionLevel:string = 'Project',
    type: string = "list"
  ) {
    try {
      const offset = (page - 1) * limit;
        let modifiedByFilter;
      let modifiedByConditions;
      let createdByFilter;
      let createdByConditions;
      let totalResults: number = 0;
      let disablePagination = false;
      if(type === "download")
        {
          disablePagination = true
        }
       const detectConditions = (filters: any) => {
        if (!filters) return null;
        for (let conditions of Object.values(ALPHANUMERIC_CONDITIONS)) {
          if (Object.keys(filters).includes(conditions)) return conditions;
        }
        return null;
      };
      if (filters?.modified_user_name) {
        modifiedByFilter = filters.modified_user_name;
        modifiedByConditions = detectConditions(modifiedByFilter);
      }
       if (filters?.created_user_name) {
        createdByFilter = filters.created_user_name;
        createdByConditions = detectConditions(createdByFilter);
      }
       ["created_user_name","modified_user_name"].forEach(key => {
        if (filters[key]) {
          disablePagination = true;
          delete filters[key];
        }
      });
      if (mainTableFilters[sortBy] !== undefined) {
            disablePagination = true;
          }
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
      const { whereClause } = this.buildWhereClause(filters, schemaName);

      const [finalSortBy, finalSortOrder] = this.getSortParameters(sortBy, sortOrder);
      const { AccountInteraction,Interaction } = await this.interactionModelService.getModels(accountNumber);
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.interactionModelService.getMainSequelize();
      }

      // Fetch account interactions and count
      const { rows: accountInteractions, count } = await AccountInteraction.findAndCountAll({
        where: {
          account_rid: accountRid,
          ...whereClause
        },
        order: [[finalSortBy, finalSortOrder]],
        ...(disablePagination
          ? {}
          : { limit: limit, offset: offset }),
        attributes: {
          include: [
        [
                  // Subquery to count interactions for each AccountInteraction.rid
                Sequelize.literal(`(
          SELECT COUNT(*)
          FROM "${schemaName}"."interactions" AS i
          WHERE i.account_interaction_rid = "AccountInteractions"."rid"
        )`),
        'project_count'
        ]
          ]
        }
      });
      // You can now use both technicalSummary (array) and count (number)
      if (accountInteractions.length === 0) {
        return {
          accountInteractions: [],
          count: 0
        };
      }
      let createdByIds: any[] = [...new Set(accountInteractions.map((user: any) => user.created_by))];
      let modifiedByIds: any[] = [...new Set(accountInteractions.map((user: any) => user.modified_by))];
      let statusIds: any[] = [...new Set(accountInteractions.map((user: any) => user.status_rid))];
      let interactionTypeIds: any[] = [...new Set(accountInteractions.map((user: any) => user.interaction_type_rid))];
      let fetchCreatedByUsers = await this.mainDbSequelize.query(rawQueries.fetchUser(createdByIds));
      let fetchModifiedByUsers = await this.mainDbSequelize.query(rawQueries.fetchUser(modifiedByIds));
      let fetchStatusInfo = await this.mainDbSequelize.query(rawQueries.fetchStatus(statusIds));
      let fetchInteractionTypeInfo = await this.mainDbSequelize.query(rawQueries.fetchInteractionTypes(interactionTypeIds));
      let createdMap: Map<string, string> = new Map(fetchCreatedByUsers[0].map((user: any) => [user.rid, `${user.first_name} ${user.last_name}`]));
      let modifiedMap: Map<string, string> = new Map(fetchModifiedByUsers[0].map((user: any) => [user.rid, `${user.first_name} ${user.last_name}`]));
      let statusMap: Map<string, string> = new Map(fetchStatusInfo[0].map((status: any) => [status.rid, status.name]));
      let interactionTypeMap: Map<string, string> = new Map(fetchInteractionTypeInfo[0].map((type: any) => [type.rid, type.interaction_type_name]));
      let finalData = accountInteractions == null ? [] : accountInteractions.map((d: any) => {
        return {
          rid: d.rid,
          r_number: d.r_number,
          status_rid: d.status_rid,
          status_name: statusMap.get(d.status_rid) || null,
          created_by: d.created_by,
          created_user_name: createdMap.get(d.created_by) || null,
          modified_by: d.modified_by,
          modified_user_name: modifiedMap.get(d.modified_by) || null,
          created_datetime: d.created_datetime,
          interaction_type: d.interaction_type_rid,
          interaction_type_name: interactionTypeMap.get(d.interaction_type_rid) || null,
          modified_datetime: d.modified_datetime,
          sent_on_datetime: d.created_datetime,
          project_count: d.dataValues.project_count,
        };
      });
      const applyFilters = (data: any[], conditions: any, value: any, field: any) => {
        if (!conditions || !field) return data;
        const val = value[conditions];
        switch (conditions) {
          case ALPHANUMERIC_CONDITIONS.equals:
            return data.filter((d: any) => d[field]?.toLowerCase() === val?.toLowerCase());
          case ALPHANUMERIC_CONDITIONS.notEquals:
            return data.filter((d: any) => d[field]?.toLowerCase() != val?.toLowerCase());
          case ALPHANUMERIC_CONDITIONS.contains:
            return data.filter((d: any) => d[field]?.toLowerCase().includes(val?.toLowerCase()));
          case ALPHANUMERIC_CONDITIONS.isEmpty:
            return data.filter((d: any) => d[field] == null);
          default:
            return data;
        }
      };
      if (modifiedByConditions != null && modifiedByConditions != undefined)
        finalData = applyFilters(finalData, modifiedByConditions, modifiedByFilter, "modified_user_name");
        if (createdByConditions != null && createdByConditions != undefined)
        finalData = applyFilters(finalData, createdByConditions, createdByFilter, "created_user_name");
      if (mainTableFilters[sortBy] != undefined && sortBy.toLowerCase() == 'asc') {
        finalData = finalData.sort((a: any, b: any) => {
          if (!a?.[sortBy]) return 1;
          if (!b?.[sortBy]) return -1;
          return a[sortBy].localeCompare(b[sortBy]);
        });
      } else if (mainTableFilters[sortBy] != undefined && sortBy.toLowerCase() == 'desc') {
        finalData = finalData.sort((a: any, b: any) => {
          if (!b?.[sortBy]) return 1;
          if (!a?.[sortBy]) return -1;
          return b[sortBy].localeCompare(a[sortBy]);
        });
      }
      totalResults = disablePagination ? finalData.length : count;
      let finalPaginatedData = [];
      if(type === "download") 
        {
          finalPaginatedData = finalData;
        }
        else
        {
           finalPaginatedData = disablePagination ? finalData.slice((page - 1) * limit, page * limit) : finalData;
        }

    
      return {
        accountInteractions: finalPaginatedData,
        count: totalResults
      };
    } catch (err) {
      logMessage(`Error listing technical summary: ${err}`);
      throw new Error("Error listing technical summary: " + (err as Error).message);
    }
  }
  async listTechnicalSummary(
    accountNumber: string,
    projectFiscalRid: string,
    page: number = 1,
    limit: number = 100,
    filters: Record<string, string>,
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    type: string = "list",
    caseRid? : string,
    accountRid? : string,
    summaryType? : string 
  ) {
    try {
      if(!this.orgDbSequelize) {
        this.orgDbSequelize = await initOrgSequelize();
      }
      const offset = (page - 1) * limit;
        let modifiedByFilter;
      let modifiedByConditions;
      let projectNameFilter;
      let projectNameConditions;
      let projectCodeFilter;
      let projectCodeConditions;
      let totalResults: number = 0;
      let disablePagination = false;
      if(type === "download")
        {
          disablePagination = true
        }
       const detectConditions = (filters: any) => {
        if (!filters) return null;
        for (let conditions of Object.values(ALPHANUMERIC_CONDITIONS)) {
          if (Object.keys(filters).includes(conditions)) return conditions;
        }
        return null;
      };
      if (filters?.modified_by) {
        modifiedByFilter = filters.modified_by;
        modifiedByConditions = detectConditions(modifiedByFilter);
      }
      if (filters?.project_name) {
        projectNameFilter = filters.project_name;
        projectNameConditions = detectConditions(projectNameFilter);
      }
      if (filters?.project_code) {
        projectCodeFilter = filters.project_code;
        projectCodeConditions = detectConditions(projectCodeFilter);
      }
       ["modified_by"].forEach(key => {
        if (filters[key]) {
          disablePagination = true;
          delete filters[key];
        }
      });
      ["project_name"].forEach(key => {
        if (filters[key]) {
          disablePagination = true;
          delete filters[key];
        }
      });
      ["project_code"].forEach(key => {
        if (filters[key]) {
          disablePagination = true;
          delete filters[key];
        }
      });
      if (mainTableFilters[sortBy] !== undefined) {
            disablePagination = true;
          }
      const { whereClause } = this.buildWhereClause(filters);
      const [finalSortBy, finalSortOrder] = this.getSortParameters(sortBy, sortOrder);
      const { AiTechnicalSummary } = await this.interactionModelService.getModels(accountNumber);
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.interactionModelService.getMainSequelize();
      }
      let schemaName = rawQueries.fetchSchemaName(accountNumber)
      // Fetch technical summaries and count
      let whereCondition;
      if(caseRid !== undefined && caseRid !== '') {
        const projectFiscalIds : any = await this.orgDbSequelize.query(rawQueries.getCaseProjectsIds(caseRid, accountRid!, schemaName, summaryType))
        whereCondition = {
          account_rid : accountRid,
          project_fiscal_rid: {
            [Op.in] : projectFiscalIds[0].length > 0 ? projectFiscalIds[0].map((d : any) => d.project_fiscal_rid) : []
          },
          [Op.and]: Sequelize.where(
        Sequelize.col('"AiTechnicalSummary".version'),
        '=',
        Sequelize.literal(`
          (
            SELECT MAX(t2.version)
            FROM ${schemaName}.ai_technical_summary AS t2
            WHERE 
              t2.account_rid = "AiTechnicalSummary".account_rid
              AND t2.project_fiscal_rid = "AiTechnicalSummary".project_fiscal_rid
          )
        `)),
          ...whereClause
        }
      } else {
        whereCondition = {
          project_fiscal_rid: projectFiscalRid,
          ...whereClause
        }
      }
      const { rows: technicalSummary, count } = await AiTechnicalSummary.findAndCountAll({
        where: whereCondition,
        order: [[finalSortBy, finalSortOrder]],
        ...(disablePagination
          ? {}
          : { limit: limit, offset: offset }),
      });
      // You can now use both technicalSummary (array) and count (number)
      if (technicalSummary.length === 0) {
        return {
          technicalSummary: [],
          count: 0
        };
      }
      let fetchProjectDetails : any[] = [...new Set(technicalSummary.map((project : any) => project.project_fiscal_rid))];
      let createdByIds: any[] = [...new Set(technicalSummary.map((user: any) => user.created_by))];
      let modifiedByIds: any[] = [...new Set(technicalSummary.map((user: any) => user.modified_by))];
      let statusIds: any[] = [...new Set(technicalSummary.map((user: any) => user.status_rid))];
      let fetchCreatedByUsers = await this.mainDbSequelize.query(rawQueries.fetchUser(createdByIds));
      let fetchModifiedByUsers = await this.mainDbSequelize.query(rawQueries.fetchUser(modifiedByIds));
      let fetchStatusInfo = await this.mainDbSequelize.query(rawQueries.fetchStatus(statusIds));
      let projectFiscalDetails = await this.orgDbSequelize.query(rawQueries.fetchProjectFiscalDetails(fetchProjectDetails, schemaName));

      let createdMap: Map<string, string> = new Map(fetchCreatedByUsers[0].map((user: any) => [user.rid, `${user.first_name} ${user.last_name}`]));
      let modifiedMap: Map<string, string> = new Map(fetchModifiedByUsers[0].map((user: any) => [user.rid, `${user.first_name} ${user.last_name}`]));
      let statusMap: Map<string, string> = new Map(fetchStatusInfo[0].map((status: any) => [status.rid, status.name]));
      let projectDetailsMap = new Map(projectFiscalDetails[0].map((d : any) => [d.rid, {project_name : d.project_name, project_code : d.project_code, signoff : d.signoff}]))
      let finalData = technicalSummary == null ? [] : technicalSummary.map((d: any) => {
        return {
          rid: d.rid,
          account_rid : d.account_rid,
          project_rid : d.project_rid,
          project_fiscal_rid : d.project_fiscal_rid,
          project_code : projectDetailsMap.get(d.project_fiscal_rid)?.project_code || null,
          project_name : projectDetailsMap.get(d.project_fiscal_rid)?.project_name || null,
          signoff : projectDetailsMap.get(d.project_fiscal_rid)?.signoff,
          r_number: d.r_number,
          technical_summary: d.technical_summary,
          version: d.version,
          status_rid: d.status_rid,
          status_name: statusMap.get(d.status_rid) || null,
          created_by: d.created_by,
          created_user_name: createdMap.get(d.created_by) || null,
          modified_by: d.modified_by,
          modified_user_name: modifiedMap.get(d.modified_by) || null,
          created_datetime: d.created_datetime,
          modified_datetime: d.modified_datetime
        };
      });
      const applyFilters = (data: any[], conditions: any, value: any, field: any) => {
        if (!conditions || !field) return data;
        const val = value[conditions];
        switch (conditions) {
          case ALPHANUMERIC_CONDITIONS.equals:
            return data.filter((d: any) => d[field]?.toLowerCase() === val?.toLowerCase());
          case ALPHANUMERIC_CONDITIONS.notEquals:
            return data.filter((d: any) => d[field]?.toLowerCase() != val?.toLowerCase());
          case ALPHANUMERIC_CONDITIONS.contains:
            return data.filter((d: any) => d[field]?.toLowerCase().includes(val?.toLowerCase()));
          case ALPHANUMERIC_CONDITIONS.isEmpty:
            return data.filter((d: any) => d[field] == null);
          default:
            return data;
        }
      };
      if (modifiedByConditions != null && modifiedByConditions != undefined)
        finalData = applyFilters(finalData, modifiedByConditions, modifiedByFilter, "modified_user_name");
      if(projectCodeConditions != null && projectCodeConditions != undefined)
        finalData = applyFilters(finalData, projectCodeConditions, projectCodeFilter, "project_code")
      if(projectNameConditions != null && projectNameConditions != undefined)
        finalData = applyFilters(finalData, projectNameConditions, projectNameFilter, "project_name")
      if (mainTableFilters[sortBy] != undefined && sortOrder.toLowerCase() == 'asc') {
        finalData = finalData.sort((a: any, b: any) => {
          if (!a?.[sortBy]) return 1;
          if (!b?.[sortBy]) return -1;
          return a[sortBy].localeCompare(b[sortBy]);
        });
      } else if (mainTableFilters[sortBy] != undefined && sortOrder.toLowerCase() == 'desc') {
        finalData = finalData.sort((a: any, b: any) => {
          if (!b?.[sortBy]) return 1;
          if (!a?.[sortBy]) return -1;
          return b[sortBy].localeCompare(a[sortBy]);
        });
      }
      totalResults = disablePagination ? finalData.length : count;
      let finalPaginatedData = [];
      if(type === "download") 
        {
          finalPaginatedData = finalData;
        }
        else
        {
           finalPaginatedData = disablePagination ? finalData.slice((page - 1) * limit, page * limit) : finalData;
        }

    
      return {
        technicalSummary: finalPaginatedData,
        count: totalResults
      };
    } catch (err) {
      logMessage(`Error listing technical summary: ${err}`);
      throw new Error("Error listing technical summary: " + (err as Error).message);
    }
  }

   private buildWhereClause(filters: Record<string, any>, schemaName?: string): {
    whereClause: Record<string, any>;
  } {
    let whereClause: Record<string, any> = {};
    let includeClause: Array<any> = [];
    if (filters) {
      const filterProcessors: Record<string, Function> = {
        'r_number': (value: any) => this.processTextFilter('r_number', value, whereClause),
        'technical_summary': (value: any) => this.processTextFilter('technical_summary', value, whereClause),
        'version': (value: any) => this.processNumberFilter('version', value, whereClause),
        'created_datetime': (value: any) => this.processDateFilter('created_datetime', value, whereClause),
        'modified_datetime': (value: any) => this.processDateFilter('modified_datetime', value, whereClause),
        'status_rid': (value: any) => this.processTextFilter('status_rid', value, whereClause),
        'project_count': (value: any) => this.processProjectCountFilter(value, whereClause, schemaName ?? ""),
      };
      Object.keys(filters).forEach(key => {
        
        const value = filters[key];
        if (value === undefined || value === null) return;
        if (filterProcessors[key]) {
          filterProcessors[key](value);
        } else if (value !== '') {
          whereClause[key] = value;
        }
      });
    }
    return { whereClause };
  }

    /**
   * Validates and normalizes sort parameters
   * 
   * @param {string} sortBy - Field to sort by
   * @param {string} sortOrder - Sort order (ASC or DESC)
   * @returns {[string, string]} - Tuple of validated sort parameters
   */
  private getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "r_number",
      "created_datetime",
      "modified_datetime",     
       "version",
      "status",
      "project_count"
    ];
    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  /**
   * Process text field filter with various operators
   * 
   * @param {string} field - Field name
   * @param {any} value - Filter value
   * @param {Record<string, any>} whereClause - Where clause to modify
   */
  private processTextFilter(field: string, value: any,  whereClause: Record<string | symbol, any>): void {
    if (typeof value === 'string') {
      // Simple string value - treat as equals
      whereClause[field] = value;
    } else if (typeof value === 'object') {
      if (value.equals !== undefined) {
        whereClause[field] = Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col(field)),
        value.equals.toLowerCase()
      );
      } else if (value.not_equals !== undefined) {
        whereClause[field] = Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col(field)),
        '!=',
        value.not_equals.toLowerCase()
      );
      } else if (value.contains !== undefined) {
        whereClause[field] = { [Op.iLike]: `%${value.contains}%` };
      } else if (Array.isArray(value.in) && value.in.length > 0) {
        whereClause[Op.or] = value.in.map((val: string) =>
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col(field)),
          '=',
          val.toLowerCase()
        )
      );
      } else if (value.is_empty !== undefined) {
        if (value.is_empty) {
          whereClause[field] = { [Op.or]: [null, ''] };
        } else {
          whereClause[field] = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] };
        }
      }
    }
  }
    private processNumberFilter(field: string, value: any, whereClause: Record<string | symbol, any>): void {
    if (typeof value === 'number') {
      // Simple number value - treat as equals
      whereClause[field] = value;
    } else if (typeof value === 'object') {
      if (value.equals !== undefined) {
        whereClause[field] = value.equals;
      } else if (value.not_equals !== undefined) {
        whereClause[field] = { [Op.ne]: value.not_equals };
      } else if (value.greater_than !== undefined) {
        whereClause[field] = { ...(whereClause[field] || {}), [Op.gt]: value.greater_than };
      } 
      if (value.less_than !== undefined) {
        whereClause[field] = { ...(whereClause[field] || {}), [Op.lt]: value.less_than };
      }
      if (Array.isArray(value.in) && value.in.length > 0) {
        whereClause[field] = { [Op.in]: value.in };
      }
      // Support for between operator (e.g., { between: [min, max] })
      if ('between' in value && Array.isArray(value.between) && value.between.length === 2) {
        whereClause[field] = {
          ...(whereClause[field] || {}),
          [Op.gte]: value.between[0],
          [Op.lte]: value.between[1],
        };
      }
    }
      if (value.is_empty !== undefined) {
        if (value.is_empty) {
          whereClause[field] = null;
        } else {
          whereClause[field] = { [Op.ne]: null };
        }
      }
    }
  
   private processDateFilter(
    field: string,
    value: any,
    whereClause: Record<string, any>
  ): void {
    if (typeof value === 'string') {
      const date = dayjs(value, 'YYYY-MM-DD').startOf('day').toDate();
      const nextDay = dayjs(date).add(1, 'day').toDate();

      whereClause[field] = {
        [Op.gte]: date,
        [Op.lt]: nextDay
      };
    } else if (typeof value === 'object') {
      if (value.equals !== undefined) {
        const date = dayjs(value.equals, 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
        const nextDay = dayjs(date).add(1, 'day').toDate();

        whereClause[field] = {
          [Op.gte]: date,
          [Op.lt]: nextDay
        };
      } else if (value.before !== undefined) {
        const beforeDate = dayjs(value.before, 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
        whereClause[field] = { [Op.lt]: beforeDate };
      } else if (value.after !== undefined) {
        const afterDate = dayjs(value.after, 'YYYY-MM-DD').endOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
        whereClause[field] = { [Op.gt]: afterDate };
      } else if (value.between) {
        const fromDate = dayjs(value.between[0], 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
        const toDate = dayjs(value.between[1], 'YYYY-MM-DD').endOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');

        whereClause[field] = {
          [Op.gte]: fromDate,
          [Op.lte]: toDate
        };
      } else if (value.is_empty !== undefined) {
        if (value.is_empty) {
          whereClause[field] = null;
        } else {
          whereClause[field] = { [Op.ne]: null };
        }
      }
    }
  }

  private processProjectCountFilter(value: any, whereClause: Record<string, any>, schemaName: string): void {
  const conditions: any[] = [];
  
  if (typeof value === 'number') {
    conditions.push(this.createProjectCountCondition('=', value,schemaName));
  } else if (value && typeof value === 'object') {
    if ('equals' in value) {
      conditions.push(this.createProjectCountCondition('=', value.equals,schemaName));
    }
    if ('not_equals' in value) {
      conditions.push(this.createProjectCountCondition('!=', value.not_equals,schemaName));
    }
    if ('greater_than' in value) {
      conditions.push(this.createProjectCountCondition('>', value.greater_than,schemaName));
    }
    if ('less_than' in value) {
      conditions.push(this.createProjectCountCondition('<', value.less_than,schemaName));
    }
    if ('between' in value && Array.isArray(value.between) && value.between.length === 2) {
      conditions.push({
        [Op.and]: [
          this.createProjectCountCondition('>=', value.between[0],schemaName),
          this.createProjectCountCondition('<=', value.between[1],schemaName),
        ]
      });
    }
    if ('is_empty' in value) {
      conditions.push(
        value.is_empty
          ? this.createProjectCountCondition('=', 0, schemaName)
          : this.createProjectCountCondition('>', 0, schemaName)
      );
    }
  }

  if (conditions.length > 0) {
    if (!whereClause[Op.and as any]) {  // Type assertion for Op.and
      whereClause[Op.and as any] = [];
    }
    (whereClause[Op.and as any] as any[]).push(...conditions);
  }
}

private createProjectCountCondition(operator: string, value: number,schemaName: string): any {
  return {
    [Op.and as any]: [  // Type assertion for Op.and
      Sequelize.literal(`(
        SELECT COUNT(*)
          FROM "${schemaName}"."interactions" AS i
          WHERE i.account_interaction_rid = "AccountInteractions"."rid"
      ) ${operator} ${value}`)
    ]
  };
}
  async fetchTechnicalSummaryDetailsById(
    accountNumber: string,
    techSummaryId: string
  ) {
    if(!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize()
    }
    const { AiTechnicalSummary } = await this.interactionModelService.getModels(
      accountNumber
    );

    let techSummaryDetails = await AiTechnicalSummary.findOne({
      where: {
        rid: techSummaryId,
      },
    });
    if(techSummaryDetails && techSummaryDetails.dataValues){
       const userInfo = await this.insertUserDetails(
        techSummaryDetails.dataValues.created_by ?? "",
        techSummaryDetails.dataValues.modified_by ?? ""
      );
      const statusInfo = await this.insertStatusInfo(
        techSummaryDetails.dataValues.status_rid
      );
      const fetchProjectDetails : string[] = []
      fetchProjectDetails.push(techSummaryDetails.project_fiscal_rid!)
      let schemaName = rawQueries.fetchSchemaName(accountNumber)
      let projectFiscalDetails = await this.orgDbSequelize.query(rawQueries.fetchProjectFiscalDetails(fetchProjectDetails, schemaName));
      let projectDetailsMap = new Map(projectFiscalDetails[0].map((d : any) => [d.rid, {project_name : d.project_name, project_code : d.project_code, signoff : d.signoff}]))

      return {
        rid: techSummaryDetails.dataValues.rid,
        r_number: techSummaryDetails.dataValues.r_number,
        technical_summary: JSON.parse(techSummaryDetails.dataValues.technical_summary!),
        version: techSummaryDetails.dataValues.version,
        status_rid: techSummaryDetails.dataValues.status_rid,
        status_name: statusInfo?.status_name || null,
        created_by: techSummaryDetails.dataValues.created_by,
        created_user_name: userInfo.created_name || null,
        modified_user_name: userInfo.modified_name || null,
        modified_by: techSummaryDetails.dataValues.modified_by,
        created_datetime: techSummaryDetails.dataValues.created_datetime,
        modified_datetime: techSummaryDetails.dataValues.modified_datetime,
        technical_summary_refinement_prompt: techSummaryDetails.dataValues.technical_summary_refinement_prompt,
        project_fiscal_rid : techSummaryDetails.project_fiscal_rid,
        project_code : projectDetailsMap.get(techSummaryDetails.project_fiscal_rid)?.project_code || null,
        project_name : projectDetailsMap.get(techSummaryDetails.project_fiscal_rid)?.project_name || null,
        signoff : projectDetailsMap.get(techSummaryDetails.project_fiscal_rid)?.signoff || null
      }
    }
    return techSummaryDetails;
  }

  async fetchInteractionDetailsById(
    accountNumber: string,
    interactionRid: string
  ) {
    const { Interaction } = await this.interactionModelService.getModels(
      accountNumber
    );

    let interactionDetails = await Interaction.findOne({
      where: {
        rid: interactionRid
      },
    });
    let interactionItems = await this.fetchInteractionItems(
      accountNumber,
      interactionRid,
      interactionDetails?.dataValues.interaction_version || 1
    );
    const globalAttachments = await this.fetchGlobalAttachmentsByInteractionRid(
      accountNumber,
      interactionRid,
      interactionDetails?.dataValues.interaction_version || 1
    );

    if (interactionDetails && interactionDetails.dataValues) {
      const {
        rid,
        account_rid,
        project_rid,
        project_fiscal_rid,
        r_number,
        interaction_type_rid,
        status_rid,
        modified_by,
        created_by,
        created_datetime,
        response_updated_by,
        response_updated_on,
        recipient_name,
        recipient_email,
        interaction_level_rid,
        fiscal_year
      } = interactionDetails.dataValues;
      const metainfo = await this.insertAdditionalInfo(
        interactionDetails,
        accountNumber
      );
      const userInfo = await this.insertUserDetails(
        created_by ?? "",
        modified_by ?? ""
      );
      const fiscalYear =
        metainfo?.interaction_level_name === "Project"
          ? metainfo?.fiscal_year ?? ""
          : fiscal_year ?? "";

      const response: InteractionDetailsResponse = {
        interaction_rid: rid,
        r_number: r_number ?? "",
        project_name: metainfo?.project_name ?? "",
        account_name : metainfo?.account_name ?? "",
        account_rnumber : metainfo?.account_rnumber ?? "",
        project_code: metainfo?.project_code ?? "",
        project_rnumber : metainfo?.project_rnumber ?? "",
        account_rid,
        project_rid: project_rid ?? "",
        fiscal_year: fiscalYear,
        project_fiscal_rid: project_fiscal_rid ?? "",
        interaction_type: interaction_type_rid ?? "",
        interaction_type_name: metainfo?.interaction_type_name ?? "",
        interaction_level_rid: interaction_level_rid ?? '',
        interaction_level_name: metainfo?.interaction_level_name ?? '',
        status: status_rid ?? "",
        status_name: metainfo?.interaction_status_name ?? "",
        modified_by: userInfo.modified_name ?? modified_by,
        created_by: userInfo.created_name ?? "",
        created_datetime: created_datetime ?? null,
        modified_datetime:
        interactionDetails.dataValues.modified_datetime ?? null,
        questions: interactionItems,
        response_updated_by: response_updated_by ?? null,
        response_updated_on: response_updated_on ?? null,
        global_attachments: globalAttachments,
        recipient_name: recipient_name || metainfo?.recipient_name || null,
        recipient_email: recipient_email || metainfo?.recipient_email || null,
        hasEmailRecipient: metainfo?.hasEmailRecipient || false
      };

      return response;
    }
    return interactionDetails;
  }

  async fetchKeyContactsByCaseId(
    accountNumber: string,
    caseRid: string
  ) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.interactionModelService.getSequelize();
    }

    const result = await this.orgDbSequelize.query(
      rawQueries.fetchKeyContactsByCaseId(
        caseRid,
        schemaName
      ),
      { type: "SELECT" }
    );

    return result;
  }

   async fetchAccountInteractionDetailsById(
    accountNumber: string,
    interactionRid: string
  ) {
    const { AccountInteraction } = await this.interactionModelService.getModels(
      accountNumber
    );

    let interactionDetails = await AccountInteraction.findOne({
      where: {
        rid: interactionRid
      },
    });
    let interactionItems = await this.fetchAccountInteractionItems(
      accountNumber,
      interactionRid
    );
   

    if (interactionDetails && interactionDetails.dataValues) {
      const {
        rid,
        account_rid,
        r_number,
        interaction_type_rid,
        status_rid,
        modified_by,
        created_by,
        created_datetime,
        sent_on_datetime
      } = interactionDetails.dataValues;
      const metainfo = await this.insertAdditionalInfo(
        interactionDetails,
        accountNumber
      );
      const userInfo = await this.insertUserDetails(
        created_by ?? "",
        modified_by ?? ""
      );
      const response: any = {
        interaction_rid: rid,
        account_rid,
        r_number: r_number ?? "",
        interaction_type: interaction_type_rid ?? "",
        interaction_type_name: metainfo?.interaction_type_name ?? "",
        status: status_rid ?? "",
        status_name: metainfo?.interaction_status_name ?? "",
        modified_by: userInfo.modified_name ?? modified_by,
        created_by: userInfo.created_name ?? "",
        created_datetime: created_datetime ?? null,
        modified_datetime:
          interactionDetails.dataValues.modified_datetime ?? null,
        questions: interactionItems,
        sent_on_datetime: sent_on_datetime ?? null
      };

      return response;
    }
    return interactionDetails;
  }

  async updateTechSummaryContext(
    summaryContext:string,
    techSummaryId: string,
    accountNumber: string,  
    userId: string
  )
  {
    try {
    
      const { AiTechnicalSummary } = await this.interactionModelService.getModels(
        accountNumber
      );
      const techSummary = await AiTechnicalSummary.findOne({
        where: {
          rid: techSummaryId,
        },
      });
      if (!techSummary) {
        logMessage(`Invalid technical summary ID: ${techSummaryId}`);
        throw new Error("Invalid technical summary ID");
      }
      techSummary.technical_summary_refinement_prompt = summaryContext;
      techSummary.modified_by = userId;
      techSummary.modified_datetime = new Date();
      
      const payload = {
            company_id:techSummary.account_rid,
            project_id: techSummary.project_fiscal_rid,
            refinment_prompt: summaryContext,
            existing_summary: techSummary.technical_summary,
            request_id: techSummaryId,
          };
      let headers = {
                  contentType: "application/json",
                };
      await axios.post(
            process.env.TRIGGER_AI_REFINE_SUMMARY!,
            payload,
            {
              headers: headers,
            }
          );
      await AiTechnicalSummary.update(
        {
          technical_summary_refinement_prompt: summaryContext,  
          modified_by: userId,
          modified_datetime: new Date(),
        },
        {
          where: {
            rid: techSummaryId,
          },
        }
      );
    } catch (err) {
      logMessage(`Error updating technical summary context: ${err}`);
      throw new Error("Error updating technical summary context" + (err as Error).message);
    }
  }

  async insertUserDetails(
    createdById: string,
    modifiedById: string
  ): Promise<any> {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }

      const getUserFullName = async (userId: string) => {
        if (!userId) return null;

        const [results]: any = await this.mainDbSequelize?.query(
          rawQueries.getUserNameByIdQuery(),
          {
            replacements: { userId },
            type: "SELECT",
          }
        );

        if (!results) return null;

        const { first_name, middle_name, last_name } = results as any;
        return [first_name, middle_name, last_name].filter(Boolean).join(" ");
      };

      const createdName = await getUserFullName(createdById);
      const modifiedName = await getUserFullName(modifiedById);

      return {
        created_name: createdName || null,
        modified_name: modifiedName || null,
      };
    } catch (err) {
      logMessage(`Error adding user details: ${err}`);
      throw new Error("Error adding user details" + (err as Error).message);
    }
  }

  async insertStatusInfo(status_rid : any) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }
     

      let status: any = null;
     
      if (status_rid) {
        const result = await this.mainDbSequelize.query(
          rawQueries.getStatusByIdQuery(),
          {
            replacements: {
              id: status_rid,
            },
            type: "SELECT",
          }
        );
        status =
          Array.isArray(result) && result.length > 0 ? result[0] : null;
      }
    
    
      return {
       
        status_name: status?.status_name || null,
      };
      
      //return interactionDetails;
    } catch (err) {
      logMessage(`Error fetching geo data: ${err}`);
      throw new Error("Error fetching geo data: " + (err as Error).message);
    }
  }

  async insertAdditionalInfo(interactionDetails: any, accountNumber: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }

      let interaction_type: any = null;
      let interaction_status: any = null;
      let interaction_level:any = null
      let project_info: any = null;
      let hasEmailRecipient: boolean = false;
      let recipient_name: string | null = null;
      let recipient_email: string | null = null;

      if (interactionDetails?.dataValues?.interaction_type_rid) {
        const result = await this.mainDbSequelize.query(
          rawQueries.getInteractionTypeByIdQuery(),
          {
            replacements: {
              id: interactionDetails.dataValues.interaction_type_rid,
            },
            type: "SELECT",
          }
        );
        interaction_type =
          Array.isArray(result) && result.length > 0 ? result[0] : null;
      }
      if (interactionDetails?.dataValues?.interaction_level_rid) {
        const result = await this.mainDbSequelize.query(
        rawQueries.fetchInteractionLevelById(interactionDetails.dataValues.interaction_level_rid),
          {
            type: "SELECT",
          }
        );
        interaction_level =
          Array.isArray(result) && result.length > 0 ? result[0] : null;
      }
      if (interactionDetails?.dataValues?.status_rid) {
        const result = await this.mainDbSequelize.query(
          rawQueries.getInteractionStatusByIdQuery(),
          {
            replacements: { id: interactionDetails.dataValues.status_rid },
            type: "SELECT",
          }
        );
        interaction_status =
          Array.isArray(result) && result.length > 0 ? result[0] : null;
      }
      if (interactionDetails?.dataValues?.project_fiscal_rid && interaction_level?.interaction_level_name === 'Project') {
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
        const result = await this.orgDbSequelize.query(
          rawQueries.fetchProjectInfo(
            interactionDetails.project_fiscal_rid,
            schemaName
          ),
          { type: "SELECT" }
        );
        project_info =
          Array.isArray(result) && result.length > 0 ? result[0] : null;
      

      const [activeStatus]: any[] = await this.mainDbSequelize.query(
                  rawQueries.fetchActiveStatusByType("Active"),
                  { type: "SELECT" }
                );
       const [emailRecipients]: any[] = await this.orgDbSequelize.query(
            rawQueries.fetchInteractionRecipient(
              interactionDetails?.project_fiscal_rid,
              activeStatus?.rid,
              schemaName
            )
            );
            if (emailRecipients && emailRecipients.length > 0 && emailRecipients[0]?.key_contact_email) {
            hasEmailRecipient = true;
            recipient_name = emailRecipients[0]?.key_contact_name || null;
            recipient_email = emailRecipients[0]?.key_contact_email || null;
            } else {
            hasEmailRecipient = false;
            recipient_name = null;
            recipient_email = null;
            }
        }
      if(interaction_level?.interaction_level_name === 'Account')
      {
         const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
         const [activeStatus]: any[] = await this.mainDbSequelize.query(
                  rawQueries.fetchActiveStatusByType("Active"),
                  { type: "SELECT" }
                );
         const [emailRecipients]: any[] = await this.orgDbSequelize.query(
            rawQueries.fetchInteractionRecipientAccount(
              interactionDetails?.dataValues?.account_rid,
              activeStatus?.rid,
              schemaName
            )
            );
            if (emailRecipients && emailRecipients.length > 0 && emailRecipients[0]?.key_contact_email) {
            hasEmailRecipient = true;
            recipient_name = emailRecipients[0]?.key_contact_name || null;
            recipient_email = emailRecipients[0]?.key_contact_email || null;
            } else {
            hasEmailRecipient = false;
            recipient_name = null;
            recipient_email = null;
            }
      }
      const accountDetails : any = await this.mainDbSequelize.query(rawQueries.fetchAccountRnumber(interactionDetails.dataValues.account_rid))
      return {
        interaction_type_name: interaction_type?.interaction_type_name || null,
        interaction_status_name: interaction_status?.status_name || null,
        interaction_level_name:interaction_level?.interaction_level_name || null, 
        project_code: project_info?.project_code || null,
        project_name: project_info?.project_name || null,
        project_rnumber : project_info?.r_number || null,
        fiscal_year: project_info?.fiscal_year || null,
        account_name : accountDetails[0][0].account_name,
        account_rnumber : accountDetails[0][0].r_number,
        hasEmailRecipient:hasEmailRecipient,
        recipient_email:recipient_email,
        recipient_name:recipient_name
      };

      //return interactionDetails;
    } catch (err) {
      logMessage(`Error fetching geo data: ${err}`);
      throw new Error("Error fetching geo data: " + (err as Error).message);
    }
  }

  async fetchInteractionInfo(interactionRid: string, accountNumber: string) {
    const { Interaction } = await this.interactionModelService.getModels(
      accountNumber
    );

    const interactionDetails = await Interaction.findOne({
      where: { rid: interactionRid },
      raw: true,
    });
    if (!interactionDetails) {
      throw new Error("Interaction not found");
    }

    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.interactionModelService.getSequelize();
    }
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    // Fetch project info
    const [projectInfo]: any[] = await this.orgDbSequelize.query(
      rawQueries.fetchProjectInfo(
        interactionDetails?.project_fiscal_rid!,
        schemaName
      ),
      { type: "SELECT" }
    );

    // Fetch account info
    const [accountInfo]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchAccountInfo(interactionDetails.account_rid),
      { type: "SELECT" }
    );

    return {
      projectInfo: {
        project_id: projectInfo?.r_number ?? null,
        project_code: projectInfo?.project_code ?? null,
        project_name: projectInfo?.project_name ?? null,
        fiscalYear: interactionDetails.fiscal_year ?? null,
      },
      accountInfo: {
        account_name: accountInfo?.account_name ?? null,
        account_rid: accountInfo?.rid ?? null,
        parent_account_rid: accountInfo?.parent_account_rid ?? null,
        r_number: accountInfo?.r_number ?? null,
      },
      interactionInfo: {
        interaction_id: interactionDetails?.r_number ?? null,
      },
    };
  }

  async getInteractionStatus(status_scope?: string, currentStatus?: string, reminderFlag? : boolean) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }
    let whereClause =
      "status = 'active' AND (status_type IS NULL OR status_type = 'UI')";
    let interactionStatus : any
    if (currentStatus) {
      // Fetch status_name for the given status_rid (currentStatus)
      const [statusResult]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchInteractionStatus(currentStatus),
        {
          replacements: { rid: currentStatus },
          type: "SELECT",
        }
      );
      if (statusResult?.status_name === "On Hold") {
        whereClause += " OR status_type = 'CONDITIONAL'";
      }
    }
    if(reminderFlag) {
      interactionStatus = await this.mainDbSequelize.query(
        fetchStatusIdsForReminderList(),
        {
          type : "SELECT"
        }
      )
    } else {
        interactionStatus = await this.mainDbSequelize.query(
      rawQueries.fetchInteractionStatusList(whereClause),
      {
        type: "SELECT",
      }
    );
    }

    return interactionStatus;
  }
  

  async getActiveStatusRid() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }

    const activeStatus = await this.mainDbSequelize.query(
      rawQueries.fetchActiveStatus(),
      {
        type: "SELECT",
      }
    );

    const statusArr = activeStatus as Array<{
      rid: string;
      status_name: string;
    }>;
    return statusArr.length > 0 ? statusArr[0]?.rid : null;
  }

  async getInteractionStatusByType(type: string) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }

    const interactionStatus = await this.mainDbSequelize.query(
      rawQueries.fetchInteractionStatusByType(type),
      {
        type: "SELECT",
      }
    );

    const statusArr = interactionStatus as Array<{
      rid: string;
      status_name: string;
    }>;
    return statusArr.length > 0 ? statusArr[0]?.rid : null;
  }
  async getInteractionStatusById(id: string) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }

    const interactionStatusArr: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchInteractionStatus(id),
      { type: "SELECT" }
    );
    const interactionStatus =
      Array.isArray(interactionStatusArr) && interactionStatusArr.length > 0
        ? interactionStatusArr[0]
        : null;
    return interactionStatus ? interactionStatus.status_name : null;
  }
  async getInteractionSourceByType(type: string) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }

    const interactionSource = await this.mainDbSequelize.query(
     rawQueries.getInteractionSourceByNameQuery(),
      {
        replacements: { type },
        type: "SELECT",
      }
    );

    const sourceArr = interactionSource as Array<{
      rid: string;
      interaction_source_name: string;
    }>;
    return sourceArr.length > 0 ? sourceArr[0]?.rid : null;
  }
  async getInteractionAssessmentSourceByType(type: string) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }

    const interactionSource = await this.mainDbSequelize.query(
     rawQueries.getInteractionAssessmentSourceByNameQuery(),
      {
        replacements: { type },
        type: "SELECT",
      }
    );

    const sourceArr = interactionSource as Array<{
      rid: string;
      interaction_assessment_source_name: string;
    }>;
    return sourceArr.length > 0 ? sourceArr[0]?.rid : null;
  }
   async getInteractionLevelByRid(type: string) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }

    const interactionLevel = await this.mainDbSequelize.query(
      rawQueries.getInteractionLevelNameByIdQuery(),
      {
        replacements: { type },
        type: "SELECT",
      }
    );

    const levelArr = interactionLevel as Array<{
      rid: string;
      interaction_level_name: string;
    }>;
    return levelArr.length > 0 ? levelArr[0]?.interaction_level_name : null;
  }
   async getInteractionLevelByType(type: string) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }

    const interactionLevel = await this.mainDbSequelize.query(
      rawQueries.fetchInteractionLevelRidByName(type),
      {
        type: "SELECT",
      }
    );

    const levelArr = interactionLevel as Array<{
      rid: string;
      interaction_level_name: string;
    }>;
    return levelArr.length > 0 ? levelArr[0]?.rid : null;
  }

  async getInteractionType(type: string) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }
    const interactionTypeArr: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchInteractionType(type),
      { type: "SELECT" }
    );
    const interactionType =
      Array.isArray(interactionTypeArr) && interactionTypeArr.length > 0
        ? interactionTypeArr[0]
        : null;
    return interactionType?.rid ? interactionType.rid : null;
  }

  async getInteractionTypes() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }

    const interactionTypes = await this.mainDbSequelize.query(
      rawQueries.getActiveInteractionTypesQuery(),
      {
        type: "SELECT",
      }
    );

    return interactionTypes;
  }

  async getInteractionSource() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }

    const interactionSource = await this.mainDbSequelize.query(
      rawQueries.getActiveInteractionSourcesQuery(),
      {
        type: "SELECT",
      }
    );

    return interactionSource;
  }
   async getInteractionLevel() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }

    const interactionLevel = await this.mainDbSequelize.query(
      rawQueries.fetchAllInteractionLevels(),
      {
        type: "SELECT",
      }
    );

    return interactionLevel;
  
  }
  async getResponseSource() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }

    const responseSource = await this.mainDbSequelize.query(
      rawQueries.getActiveInteractionResponseSourcesQuery(),
      {
        type: "SELECT",
      }
    );

    return responseSource;
  }

  async updateInteractionResponse(
    accountNumber: string,
    responseData: InteractionResponse,
    userId: string,
    transaction: Transaction
  ) {
    try {
      const { InteractionResponseHistory, InteractionAttachment, Interaction ,AiAssessmentEventTracker} =
        await this.interactionModelService.getModels(accountNumber);
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }
      let isAutoTriggerEnabled = false;
       let resonseBy =userId
      const [responseSourceIDs]: any = await this.mainDbSequelize.query(
        rawQueries.fetchResponseSourceByType(responseData.response_source)
      );
      responseData.response_source_rid = responseSourceIDs[0]?.rid ?? null;
      if (
        responseData.response_source === "Email Reply" ||
        responseData.response_source === "Email"
      ) {
        const interaction = await Interaction.findOne({
          where: { rid: responseData.interaction_rid
           },
        });
        const fetchRecipientName = interaction
          ? [{ recipient_name: interaction.recipient_name }]
          : [{ recipient_name: null }];
        resonseBy = fetchRecipientName[0]?.recipient_name ?? userId;
      }
      else
      {
        resonseBy =userId
      }
      const [emailInfo]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchUserEmail(userId)
      );
      const userEmailId = emailInfo[0]?.email ?? userId;
      let responseCreated = false;
      let interactionVersion = 0;
      const latestResponse = await InteractionResponseHistory.max(
        "interaction_version",
        {
          where: { interaction_rid: responseData.interaction_rid }
        }
      );
      if (latestResponse !== null && latestResponse !== undefined) {
        interactionVersion = Number(latestResponse) + 1;
      } else {
        interactionVersion = 1;
      }
      if (
        responseData.attachments &&
        Array.isArray(responseData.attachments) &&
        responseData.attachments.length > 0
      ) {
        await InteractionResponseHistory.create({
          interaction_rid: responseData.interaction_rid,
          interaction_version: interactionVersion,
          interaction_item_rid: null,
          interaction_response: "",
          created_by: userId,
          response_email: userEmailId,
          response_by: resonseBy,
          response_on: new Date(),
          response_source_rid: responseData.response_source_rid,
        });
        for (const attachment of responseData.attachments) {
          await InteractionAttachment.create(
            {
              interaction_rid: responseData.interaction_rid,
              interaction_version: interactionVersion,
              interaction_response_rid: null,
              attachment_url: attachment.fileUrl,
              attachment_name: attachment.fileName,
              attachment_size: attachment.fileSize,
              attachment_type: attachment.fileType,
              created_by: userId
            },
            { transaction }
          );
        }
      }

      const [statusData]: any = await this.mainDbSequelize.query(
        rawQueries.fetchInteractionStatusByType(statusAction.RESPONSE_RECEIVED)
      );

      if (responseData.questions && Array.isArray(responseData.questions)) {
        for (const question of responseData.questions) {
          const recievedStatusid = statusData[0]?.rid;

          const isExisting = await Interaction.findOne({
            where: {
              rid: responseData.interaction_rid,
              status_rid: recievedStatusid
            }
          });

          const existing = await InteractionResponseHistory.findOne({
            where: {
              interaction_rid: responseData.interaction_rid,
              interaction_item_rid: question.rid,
            },
            transaction,
          });

          let created = null;

          if (existing && isExisting) {
            // Update existing response
            await existing.update({
              interaction_response: question.response,
              response_by: resonseBy,
              response_on: new Date(),
              response_email: userEmailId,
              response_source_rid: responseData.response_source_rid,
              modified_by: userId, 
              modified_datetime: new Date(), 
            }, { transaction });
          } else {
            created = await InteractionResponseHistory.create(
              {
                interaction_rid: responseData.interaction_rid,
                interaction_version: interactionVersion,
                interaction_item_rid: question.rid,
                interaction_response: question.response,
                created_by: userId,
                response_email: userEmailId,
                response_by: resonseBy,
                response_on: new Date(),
                response_source_rid: responseData.response_source_rid,
              },
              { transaction }
            );
          }

          for (const attachment of question.attachments) {
            await InteractionAttachment.create(
              {
                interaction_rid: responseData.interaction_rid,
                interaction_response_rid: created?.rid || "",
                interaction_version: interactionVersion,
                interaction_item_rid: question.rid,
                attachment_url: attachment.fileUrl,
                attachment_name: attachment.fileName,
                attachment_size: attachment.fileSize,
                attachment_type: attachment.fileType,
                created_by: userId,
              },
              { transaction }
            );
          }
          if (created) responseCreated = true;
        }
      }

      let status : string = ``

      if (responseCreated) {
        const { Interaction, InteractionSummary } =
          await this.interactionModelService.getModels(accountNumber);
        status =
          statusAction[responseData.status_action as keyof typeof statusAction];
        const [statusArr]: any = await this.mainDbSequelize.query(
          rawQueries.fetchInteractionStatusByType(status)
        );
        const statusRid =
          Array.isArray(statusArr) && statusArr.length > 0
            ? statusArr[0].rid
            : null;

        const updateData: any = {
          status_rid: statusRid,
          interaction_version: interactionVersion,
          response_updated_on: new Date(),
          response_updated_by: userEmailId,
          response_source_rid: responseData.response_source_rid,
          modified_by: resonseBy,
          modified_datetime: new Date(),
          //   attachment_count: attachmentcount
        };

        const summaryUpdateData: any = {
          status_rid: statusRid,
          response_updated_on: new Date(),
          response_updated_by: userEmailId,
          response_source_rid: responseData.response_source_rid,
          modified_by: resonseBy,
          modified_datetime: new Date(),
          //   attachment_count: attachmentcount
        };
        if (status === statusAction.RESPONSE_RECEIVED) {
          updateData.response_submitted_on = new Date();
          updateData.response_submission_by = userEmailId;
          summaryUpdateData.response_submitted_on = new Date();
          summaryUpdateData.response_submission_by = userEmailId;
          //check for auto trigger ai
          isAutoTriggerEnabled = await this.isAutoTriggerEnabled(
            accountNumber,
            responseData.project_fiscal_rid,
            AiAssessmentEventTracker,
            responseData.account_rid,
          );
            
            logMessage(`account_rid: ${responseData.account_rid}, project_fiscal_account_id: ${responseData.project_fiscal_rid} isAutoTriggerEnabled: ${isAutoTriggerEnabled}`);
        }

        await Interaction.update(updateData, {
          where: { rid: responseData.interaction_rid
          },
        });
        await InteractionSummary.update(summaryUpdateData, {
          where: { interaction_rid: responseData.interaction_rid
           },
        });
      }
      return {
        interactionVersion,
        isAutoTriggerEnabled,
        status
      };
    } catch (err) {
      logMessage(`Error updating interaction response: ${err}`);
      throw new Error(
        "Error updating interaction response: " + (err as Error).message
      );
    }
  }

  async updateAttachmentCount(
    accountNumber: string,
    interactionRid: string,
    interactionVersion: number,
    projectFiscalRid: string
  ) {
    const { Interaction, InteractionSummary, InteractionAttachment } =
      await this.interactionModelService.getModels(accountNumber);

    const attachmentCount = await InteractionAttachment.count({
      where: {
        interaction_rid: interactionRid,
        interaction_version: interactionVersion
      },
    });

    await Interaction.update(
      { attachment_count: attachmentCount },
      {
        where: { rid: interactionRid },
      }
    );

    await InteractionSummary.update(
      { attachment_count: attachmentCount },
      {
        where: { interaction_rid: interactionRid },
      }
    );
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
      logMessage(`Error fetching interaction: ${err}`);
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
      logMessage(`Error fetching interactions: ${err}`);
      throw new Error("Error fetching interactions: " + (err as Error).message);
    }
  }

  async fetchGlobalAttachmentsByInteractionRid(
    accountNumber: string,
    interactionRid: string,
    interaction_version: number
  ) {
    try {
      const { InteractionAttachment } =
        await this.interactionModelService.getModels(accountNumber);

      const attachments = await InteractionAttachment.findAll({
        where: {
          interaction_rid: interactionRid,
          interaction_version: interaction_version,
          interaction_item_rid: {
            [require("sequelize").Op.or]: ["", null],
          },
        },
        attributes: [
          "attachment_url",
          "attachment_name",
          "attachment_size",
          "attachment_type",
        ],
      });

      return Promise.resolve(
        await Promise.all(
          attachments.map(async (att) => ({
            fileUrl: await generateSasUrl(att.attachment_url),
            fileName: att.attachment_name,
            fileSize: att.attachment_size,
            fileType: att.attachment_type,
          }))
        )
      );
    } catch (err) {
      logMessage(`Error fetching global attachments: ${err}`);
      throw new Error(
        "Error fetching global attachments: " + (err as Error).message
      );
    }
  }
  /**
   * Fetches interaction items for a given interaction.
   */
  async fetchInteractionItems(
    accountNumber: string,
    interactionRid: string,
    interactionVersion: number
  ) {
    try {
      const {
        InteractionItem,
        InteractionResponseHistory,
        InteractionAttachment,
      } = await this.interactionModelService.getModels(accountNumber);
      // Convert Sequelize instances to plain objects

      const items = await InteractionItem.findAll({
        attributes: [
          "rid",
          "question_seq_num",
          "question",
          "notes",
          [Sequelize.literal("false"), "is_mandatory"],
        ],
        order: [
          ["question_seq_num", "ASC"],
          ["created_datetime", "ASC"],
        ],
        where: { interaction_rid: interactionRid},
      });
      const plainItems = items.map((item) => item.get({ plain: true }));
      for (const item of plainItems) {
        // Fetch attachments for each question
        const attachments = await InteractionAttachment.findAll({
          where: {
            interaction_item_rid: item.rid,
            interaction_version: interactionVersion
          },
          attributes: [
            "attachment_url",
            "attachment_name",
            "attachment_size",
            "attachment_type",
          ],
        });
        const attachmentsList = attachments.map((item) =>
          item.get({ plain: true })
        );
        (item as any).attachments = Array.isArray(attachmentsList) && attachmentsList.length > 0
          ? await Promise.all(
              attachmentsList.map(async (att: any) => ({
                fileUrl: await generateSasUrl(att.attachment_url),
                fileName: att?.attachment_name ?? "",
                fileSize: att?.attachment_size ?? "",
                fileType: att?.attachment_type ?? "",
              }))
            )
          : [];

        // Fetch latest response history for each question
        const response = await InteractionResponseHistory.findOne({
          where: {
            interaction_item_rid: item.rid,
            interaction_version: interactionVersion
          },
          order: [["response_on", "DESC"]],
        });
        item.is_editable = !response || response === null || response.interaction_response === null || response.interaction_response === "";
        item.response =
          response && typeof response.interaction_response === "string"
            ? response.interaction_response
            : "";
      }
      // for (const item of items) {
      //   const response = await InteractionResponseHistory.findOne({
      //     where: { interaction_item_rid: item.dataValues.rid },
      //     order: [["response_on", "DESC"]],
      //   });
      //   item.dataValues.response =
      //     response && typeof response.interaction_response === "string"
      //       ? response.interaction_response
      //       : "";
      // }
      return items;
    } catch (err) {
      logMessage(`Error fetching interaction items: ${err}`);
      throw new Error(
        "Error fetching interaction items: " + (err as Error).message
      );
    }
  }

  async fetchAccountInteractionItems(
    accountNumber: string,
    interactionRid: string
  ) {
    try {
      const {
        InteractionItem,
      } = await this.interactionModelService.getModels(accountNumber);
      // Convert Sequelize instances to plain objects

      const items = await InteractionItem.findAll({
        attributes: [
          "rid",
          "question_seq_num",
          "question",
          "notes",
          [Sequelize.literal("false"), "is_mandatory"],
        ],
       order: [
          ["question_seq_num", "ASC"],
          ["created_datetime", "ASC"],
        ],
        where: { account_interaction_rid: interactionRid },
      });
      return items;
    } catch (err) {
      logMessage(`Error fetching interaction items: ${err}`);
      throw new Error(
        "Error fetching interaction items: " + (err as Error).message
      );
    }
  }



  
  async fetchInteractionQuestionsById(
    accountNumber: string,
    interactionRid: string
  ) {
    try {
      const { InteractionItem, InteractionResponseHistory } =
        await this.interactionModelService.getModels(accountNumber);

      const items = await InteractionItem.findAll({
        attributes: [
          "rid",
          "question_seq_num",
          "question",
          "notes",
          [Sequelize.literal("false"), "is_mandatory"],
        ],
        order: [
          ["question_seq_num", "ASC"],
          ["created_datetime", "ASC"],
        ],
        where: { interaction_rid: interactionRid },
      });

      for (const item of items) {
        // Check if there is at least one response for this item
        const response = await InteractionResponseHistory.findOne({
          where: { interaction_item_rid: item.dataValues.rid },
        });
        item.dataValues.is_editable = !response; // false if response exists, true otherwise
      }
      return items;
    } catch (err) {
      logMessage(`Error fetching questions by id: ${err}`);
      throw new Error(
        "Error fetching questions by id: " + (err as Error).message
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
      logMessage(`Error fetching interaction timeline: ${err}`);
      throw new Error(
        "Error fetching interaction timeline: " + (err as Error).message
      );
    }
  }
  async fetchSenderEmailInfoByAccountId(
    accountNumber: string,
    parentAccountId: string
  ) {
    try {
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      const [senderEmailInfo]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchInteractionSenderEmail(schemaName, parentAccountId)
      ); 
      const clientSecret = senderEmailInfo[0]?.client_secret;
      const decryptedSecret = await decryptClientSecret(clientSecret);
      
      return {
        email: senderEmailInfo[0]?.support_email,
        clientId: senderEmailInfo[0]?.client_id,
        clientSecret: decryptedSecret,
        tenantId: senderEmailInfo[0]?.tenant_id,
      }
    } catch (err) {
      logMessage(`Error fetching sender email info for account: ${err}`);
    }
  }
  async fetchEmailInfo(
    accountNumber: string,
    interactionRid: string,
    projectFiscalRid: string,
    accountRid: string,
    emailInfo:any,
    isRemainder?: boolean
  ) {
    try {
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      if(!this.mainDbSequelize) {
        this.mainDbSequelize = await this.interactionModelService.getMainSequelize();
      }
      const [statusArr]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchActiveStatusByType('Active'),
        {
          type: "SELECT",
        }
      );
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      if (!projectFiscalRid) {
        return {
          name: null,
          email: null,
          ccEmails: [],
        };
      }
      let keyContactName =null;
      let keyContactEmail =null;
      if ((!emailInfo || !emailInfo?.email) && !isRemainder) {  
      const [interactionRecipients]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchInteractionRecipient(projectFiscalRid, statusArr.rid, schemaName),
        {
          type: "SELECT",
        }
      );
      keyContactName = interactionRecipients?.key_contact_name ?? null;
      keyContactEmail = interactionRecipients?.key_contact_email ?? null;
    }
    else
    {
      if(isRemainder)
        {
          const [remainderRecipients]: any[] =  await this.orgDbSequelize.query(  
            rawQueries.fetchRemainderEmailInfo(interactionRid? interactionRid : '', schemaName),
            { type: "SELECT" }
          );
          keyContactName = remainderRecipients?.recipient_name ?? emailInfo?.name;
          keyContactEmail = remainderRecipients?.recipient_email ?? emailInfo?.email;
        }
        else
        {
          keyContactName = emailInfo?.name;
          keyContactEmail = emailInfo?.email;
        }
      
    }

      const interactionCCRecipients: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchInteractionRecipientProject(
          projectFiscalRid,
          statusArr.rid,
          schemaName
        ),
        { type: "SELECT" }
      );
      const interactionCCRecipientsAccount: any[] =
        await this.orgDbSequelize.query(
          rawQueries.fetchInteractionCCRecipientAccount(accountRid,statusArr.rid ,schemaName),
          { type: "SELECT" }
        );

      // Combine emails for CC (filter out null/undefined and duplicates)
      const ccEmails = [
        ...interactionCCRecipients
          .map((rec) => rec.key_contact_email)
          .filter(Boolean),
        ...interactionCCRecipientsAccount
          .map((rec) => rec.key_contact_email)
          .filter(Boolean),
      ].filter((email, idx, arr) => email && arr.indexOf(email) === idx);

      // Remove duplicates
      const uniqueCCEmails = Array.from(new Set(ccEmails));
      return {
        name: keyContactName ?? null,
        email: keyContactEmail ?? null,
        ccEmails: uniqueCCEmails ?? [],
      };
    } catch (err) {
      logMessage(`Error fetching POC email for account: ${err}`);
      throw new Error("Error fetching POC email: " + (err as Error).message);
    }
  }
  async fetchEmailInfoForAccount(
    accountNumber: string,
    accountRid: string,
    emailInfo:any,
    isRemainder?: boolean,
    interactionRid?: string
  ) {
    try {
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      if(!this.mainDbSequelize) {
        this.mainDbSequelize = await this.interactionModelService.getMainSequelize();
      }
      const [statusArr]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchActiveStatusByType('Active'),
        {
          type: "SELECT",
        }
      );
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      let keyContactName ="";
      let keyContactEmail ="";
       if ((!emailInfo || !emailInfo?.email) && !isRemainder) {
      const [interactionRecipients]: any[] =
        await this.orgDbSequelize.query(
          rawQueries.fetchInteractionRecipientAccount(accountRid,statusArr.rid ,schemaName),
          { type: "SELECT" }
        );
        keyContactName = interactionRecipients?.key_contact_name ?? null;
        keyContactEmail = interactionRecipients?.key_contact_email ?? null;
      }
      else
      {
        if(isRemainder)
        {
          const [remainderRecipients]: any[] =  await this.orgDbSequelize.query(  
            rawQueries.fetchRemainderEmailInfo(interactionRid? interactionRid : '', schemaName),
            { type: "SELECT" }
          );
          keyContactName = remainderRecipients?.recipient_name ?? emailInfo?.name;
          keyContactEmail = remainderRecipients?.recipient_email ?? emailInfo?.email;
        }
        else
        {
           keyContactName = emailInfo?.name;
           keyContactEmail = emailInfo?.email;
        }
      }
      
        const interactionCCRecipientsAccount: any[] =
        await this.orgDbSequelize.query(
          rawQueries.fetchInteractionRecipientAccount(accountRid,statusArr.rid ,schemaName),
          { type: "SELECT" }
        );

    
      const ccEmails = [
        ...interactionCCRecipientsAccount
          .map((rec) => rec.key_contact_email)
          .filter(Boolean),
      ].filter((email, idx, arr) => email && arr.indexOf(email) === idx);

      // Remove duplicates
      const uniqueCCEmails = Array.from(new Set(ccEmails));

      return {
        name: keyContactName ?? null,
        email: keyContactEmail ?? null,
        ccEmails: uniqueCCEmails ?? [],
      };
    } catch (err) {
      logMessage(`Error fetching  email for account: ${err}`);
      throw new Error("Error fetching  email for account: " + (err as Error).message);
    }
  }
  async getUserGroupType(userRid: string): Promise<string | null> {
    const mainDbSequelize = await initMainDbSequelize();

    try {
      const results = await mainDbSequelize.query<{ group_type: string }>(
        rawQueries.fetchUserGroupType,
        {
          replacements: { userRid },
          type: QueryTypes.SELECT,
        }
      );

      if (!results || results.length === 0) {
        return null;
      }

      return results[0]?.group_type || null;
    } catch (error) {
      // Log the error for debugging
      logMessage(`Error fetching user group type: ${error}`);
      throw new Error("Failed to get user group type");
    }
  }
  async getAccessibleAccountInfo(userRid: string): Promise<
    Array<{
      id: string;
      isChild: boolean;
      parentId: string | null;
    }>
  > {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }

    try {
      // 1. Direct access with account info
      const directAccess = await this.mainDbSequelize.query<{
        entity_rid: string;
        parent_account_rid: string | null;
        is_child: boolean;
      }>(rawQueries.fetchDirectAccountAccess, {
        replacements: { userRid },
        type: QueryTypes.SELECT,
      });

      // 2. Group access with account info
      const groupAccess = await this.mainDbSequelize.query<{
        entity_rid: string;
        parent_account_rid: string | null;
        is_child: boolean;
      }>(rawQueries.fetchGroupAccountAccess, {
        replacements: { userRid },
        type: QueryTypes.SELECT,
      });

      // 3. Combine and deduplicate
      const allAccess = [...directAccess, ...groupAccess];
      const uniqueAccess = new Map<
        string,
        {
          id: string;
          isChild: boolean;
          parentId: string | null;
        }
      >();

      allAccess.forEach((access) => {
        if (!uniqueAccess.has(access.entity_rid)) {
          uniqueAccess.set(access.entity_rid, {
            id: access.entity_rid,
            isChild: access.is_child,
            parentId: access.parent_account_rid,
          });
        }
      });

      return Array.from(uniqueAccess.values());
    } catch (err) {
      logMessage(`Error in getAccessibleAccountInfo: ${err}`);
      return [];
    }
  }

  async getUserProfileType(
    userRid: string
  ): Promise<{ profileName: string; email: string } | null> {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }
    try {
      const results = await this.mainDbSequelize.query<{
        profile_name: string;
        email: string;
      }>(rawQueries.fetchUserProfileInfo, {
        replacements: { userRid },
        type: QueryTypes.SELECT,
      });

      if (!results || results.length === 0) {
        return null;
      }

      // Return renamed keys to match camelCase (optional)
      return {
        profileName: results[0]?.profile_name || "Standard User",
        email: results[0]?.email || "",
      };
    } catch (error) {
      logMessage(`Error fetching user profile info: ${error}`);
      throw new Error("Failed to get user profile information");
    }
  }

  async getAccessibleProjectIds(
    userId: string,
    isdefaultparent: boolean,
    isPOC: boolean = false,
    userEmail?: string,
    isCustomGlobal: boolean = false
  ): Promise<string[]> {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }
    const replacements: any[] = [];
    let accessControlWhere = "WHERE 1=1";
    if (isCustomGlobal) {
      // If isPOC is also true, restrict to POC email
      if (isPOC && userEmail) {
        accessControlWhere += ` AND (ps.project_point_of_contact_email = ? OR pfs.project_point_of_contact_email = ?)`;
        replacements.push(userEmail, userEmail);
      }
      // Else allow all projects (no extra access checks)
    } else {
      // Non-global user – apply account/project access checks
      const accountAccessSubquery = rawQueries.GET_ACCOUNT_ACCESS;
      replacements.push(userId, userId, userId, userId);
      accessControlWhere += ` AND ${accountAccessSubquery}`;

      if (!isdefaultparent) {
        // Add project-level access checks if not a parent group
        accessControlWhere += rawQueries.GET_PROJECT_ACCESS;
        replacements.push(userId, userId, userId, userId);
      }

      // Only non-global users can be further filtered by POC
      if (isPOC && userEmail) {
        accessControlWhere += ` AND (ps.project_point_of_contact_email = ? OR pfs.project_point_of_contact_email = ?)`;
        replacements.push(userEmail, userEmail);
      }
    }

    const query = rawQueries.getProjectSummaryWithFiscalAccessQuery(accessControlWhere);

    const results = await this.mainDbSequelize.query(query, {
      replacements,
      type: "SELECT",
    });

    return results.map((row: any) => row.project_rid);
  }

  async updateInteractionInfo(
    accountNumber: string,
    interactionRid: string,
    status: string,
    userId: string,
    emailInfo: { name: string | null; email: string | null | string[] },
    interactionLink: string
  ) {
    try {
      const { Interaction, InteractionSummary } =
        await this.interactionModelService.getModels(accountNumber);
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }

      const [senderemailInfo]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchUserEmail(userId)
      );
      const userEmailId = senderemailInfo[0]?.email ?? userId;
      const [statusArr]: any = await this.mainDbSequelize.query(
        rawQueries.fetchInteractionStatusByType(status)
      );
      const statusRid =
        Array.isArray(statusArr) && statusArr.length > 0
          ? statusArr[0].rid
          : null;

      const updateData: any = {
        recipient_email: emailInfo.email,
        recipient_name: emailInfo.name,
        sent_by_rid: userId,
        sent_by_mail_id: userEmailId,
        interaction_url: interactionLink,
        sent_on_datetime : new Date(),
        status_rid : statusRid
      };
      await Interaction.update(updateData, { where: { rid: interactionRid } });
      await InteractionSummary.update(updateData, {
        where: { interaction_rid: interactionRid },
      });
    } catch (err) {
      logMessage(`Error updating interaction status: ${err}`);
      throw new Error(
        "Error updating interaction status: " + (err as Error).message
      );
    }
  }

  async updateInteractionInfoForReminder(
    accountNumber: string,
    interactionRid: string,
    projectFiscalRid: string,
    status: string,
    userId: string,
    emailInfo: { name: string | null; email: string | null | string[] },
    interactionLink: string
  ) {
    try {
      const { Interaction, InteractionSummary } =
        await this.interactionModelService.getModels(accountNumber);
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }

      const [senderemailInfo]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchUserEmail(userId)
      );
      const userEmailId = senderemailInfo[0]?.email ?? userId;
      const interaction = await Interaction.findOne({
        where: { rid: interactionRid },
      });
      const [statusArr]: any = await this.mainDbSequelize.query(
        rawQueries.fetchInteractionStatusByType(status)
      );
      const statusRid =
        Array.isArray(statusArr) && statusArr.length > 0
          ? statusArr[0].rid
          : null;
      const updateData: any = {
        last_reminder_on: new Date(),
        last_reminder_by: userEmailId,
        status_rid : statusRid
      };

      if (!interaction?.sent_on_datetime || interaction?.sent_on_datetime === null) {
        updateData.sent_on_datetime = new Date();
        updateData.last_resent_on = new Date();
        const [statusArr]: any = await this.mainDbSequelize.query(
          rawQueries.fetchInteractionStatusByType(status)
        );
        const statusRid =
          Array.isArray(statusArr) && statusArr.length > 0
            ? statusArr[0].rid
            : null;
        updateData.status_rid = statusRid;
      } 

      await Interaction.update(updateData, { where: { rid: interactionRid ,project_fiscal_rid:projectFiscalRid} });
      await InteractionSummary.update(updateData, {
        where: { interaction_rid: interactionRid },
      });
    } catch (err) {
      logMessage(`Error updating interaction reminder: ${err}`);
      throw new Error(
        "Error updating interaction reminder: " + (err as Error).message
      );
    }
  }

  async isEmailRecipientAvailable
  (     
    accountNumber: string,  
    projectFiscalRid: string
  ): Promise<boolean> {
    try {
      if (!this.orgDbSequelize) {     
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      if(!this.mainDbSequelize)
      {
        this.mainDbSequelize = await this.interactionModelService.getMainSequelize();
      }
      const [activeStatus]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchActiveStatusByType("Active"),
        { type: "SELECT" }
      );

       const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
      const [recipientInfo]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchInteractionRecipient(projectFiscalRid, activeStatus.rid, schemaName),
        { type: "SELECT" }
      );

      return !!(recipientInfo && recipientInfo.key_contact_email);
    } catch (err) {   
      logMessage(`Error checking email recipient availability: ${err}`);    
        
      throw new Error(
        "Error checking email recipient availability: " +
          (err as Error).message
      );
    }
  }

   async isEmailRecipientAvailableForAccount
  (     
    accountNumber: string,  
    accountRid: string
  ): Promise<boolean> {
    try {
      if (!this.orgDbSequelize) {     
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      if(!this.mainDbSequelize)
      {
        this.mainDbSequelize = await this.interactionModelService.getMainSequelize();
      }
      const [activeStatus]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchActiveStatusByType("Active"),
        { type: "SELECT" }
      );

       const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
      const [recipientInfo]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchInteractionRecipientAccount(accountRid, activeStatus.rid, schemaName),
        { type: "SELECT" }
      );

      return !!(recipientInfo && recipientInfo.key_contact_email);
    } catch (err) {
      throw new Error(
        "Error checking email recipient availability: " +
          (err as Error).message
      );
    }
  }

  async checkGlobalAutoSendAccess() {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }
      const [globalInteractionAccess]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchGlobalAutoSendAccess(),
        { type: "SELECT" }
      );
      return globalInteractionAccess?.auto_send_interaction ?? false;
    } catch (err) {
      logMessage(`Error checking global auto-send interaction access: ${err}`);
      throw new Error(
        "Error checking global auto-send interaction access: " +
          (err as Error).message
      );
    } 
  }

  async checkAccountAutoSendAccess( accountNumber: string,
    accountRid: string) {
    try {
      if (!this.orgDbSequelize) {
        this.orgDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
       const [accountInfo]: any[] = await this.orgDbSequelize.query(
          rawQueries.fetchAccountDetailsInfo(accountRid, schemaName),  
          { type: "SELECT" }
        );
      return accountInfo?.autosend_interaction ?? false;
    } catch (err) {
      logMessage(`Error checking account auto-send interaction access: ${err}`);
      throw new Error(
        "Error checking global auto-send interaction access: " +
          (err as Error).message
      );
    } 
  }

  async checkProjectAutoSendAccess( accountNumber: string,
    project_fiscal_rid: string) {
    try {
      if (!this.orgDbSequelize) {
        this.orgDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
       const [projectInfo]: any[] = await this.orgDbSequelize.query(
          rawQueries.fetchisAutoSendEnabled(
            project_fiscal_rid,
            schemaName
          ),
          { type: "SELECT" }
        );
      return projectInfo?.auto_send_ai_interaction ?? false;
    } catch (err) {
      logMessage(`Error checking project auto-send interaction access: ${err}`);
      throw new Error(
        "Error checking global auto-send interaction access: " +
          (err as Error).message
      );
    } 
  }

  async isAutoSendInteractionEnabled(
    accountNumber: string,
    interactionDetails: any
  ) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }
      const globalInteractionAccess = await this.checkGlobalAutoSendAccess();
      if (globalInteractionAccess) {
        return true;
      } else {
        
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
        const accountInteraction = await this.checkAccountAutoSendAccess(accountNumber, interactionDetails.account_rid);
        if(accountInteraction){
          return true;
        }
        
        const projectInteraction = await this.checkProjectAutoSendAccess(accountNumber, interactionDetails.project_fiscal_rid);
        if(projectInteraction){
          return true;
        }

        // Fetch project info
       
        return false;
      }
    } catch (err) {
      logMessage(`Error checking auto-send interaction status: ${err}`);
      throw new Error(
        "Error checking auto-send interaction status: " + (err as Error).message
      );
    }
  }

  async isAutoTriggerEnabled(
    accountNumber: string,
    project_fiscal_rid: string,
    AiAssessmentEventTracker: any,
    accountRid: string
  ) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }
      const [globalAccess]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchGlobalAutoTriggerAccess(),
        { type: "SELECT" }
      );
      const responseReceivedEvent = await AiAssessmentEventTracker.findOne({
        where: {
          is_active:true,
          event_name: 'response_received'
        }
      });

     if(!responseReceivedEvent || !responseReceivedEvent?.event_name){
      return false;
     }
      if (globalAccess?.auto_access_rd && (responseReceivedEvent && responseReceivedEvent?.event_name)) {
        return true;
      } else {
        if (!this.orgDbSequelize) {
          this.orgDbSequelize =
            await this.interactionModelService.getSequelize();
        }
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
        const [accountInfo]: any[] = await this.orgDbSequelize.query(
                    rawQueries.fetchAccountDetailsInfo(accountRid, schemaName),  
                    { type: "SELECT" }
                  );
        if(accountInfo?.auto_access_rd && (responseReceivedEvent && responseReceivedEvent?.event_name))
        {
            return true;
        }
        // Fetch project info
        const [projectInfo]: any[] = await this.orgDbSequelize.query(
          rawQueries.fetchisAutoTriggerEnabled(project_fiscal_rid, schemaName),
          { type: "SELECT" }
        );
        return (projectInfo?.auto_access_rd ?? false) && !!responseReceivedEvent.event_name;
      }
    } catch (err) {
      logMessage(`Error checking auto-trigger enabled status: ${err}`);
      throw new Error(
        "Error checking auto-trigger interaction status: " +
          (err as Error).message
      );
    }
  }
  async updateTechSummary(
    projectSummary: string,
    accountNumber: string,
    projectFiscalId: string,
    accountId: string,
    correlationId: string,
    response: any
  ) {
    try {
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }
      const activeStatus: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchAllStatus(),
        { type: "SELECT" }
      );

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      const [projectInfo]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchProjectInfo(projectFiscalId, schemaName),
        { type: "SELECT" }
      );

      const { AiTechnicalSummary, AiAssessmentAudit } =
        await this.interactionModelService.getModels(accountNumber);
      const maxVersion = await AiTechnicalSummary.max("version", {
        where: {
          account_rid: accountId,
          project_rid: projectInfo?.project_rid ?? null,
          project_fiscal_rid: projectFiscalId,
        },
      });
      let version =
        (typeof maxVersion === "number"
          ? maxVersion
          : parseInt(maxVersion as any) || 0) + 1;
      const activeStatusObj = activeStatus.find(s => s.status_name === 'Active');
      let techSummaryPayload = {
        created_by: process.env.SYSTEM_USER_ID || "system",
        account_rid: accountId,
        fiscal_year: projectInfo?.fiscal_year ?? null,
        project_rid: projectInfo?.project_rid ?? null,
        project_fiscal_rid: projectFiscalId,
        technical_summary: projectSummary,
        version,
        status_rid: activeStatusObj?.rid,
        entity_transaction_id: correlationId,
      };
      const updateData: any = {
        is_tech_summary_processed: response.statusCode === 200,
      };
      if (response.statusCode !== 200) {
        updateData.tech_summary_error_message = response.error_message;
      }
      const [aiResponse] = await Promise.all([
        AiTechnicalSummary.create(techSummaryPayload),
        AiAssessmentAudit.update(updateData, {
          where: { transaction_id: correlationId },
        }),
      ]);
      if (aiResponse.rid) {
        await AiTechnicalSummary.update(
          { status_rid:activeStatus.find(s => s.status_name === 'In-Active')?.rid },
          {
            where: {
              account_rid: accountId,
              project_rid: projectInfo?.project_rid ?? null,
              project_fiscal_rid: projectFiscalId,
              rid: { [require("sequelize").Op.ne]: aiResponse.rid },
            },
          }
        );
      }
    } catch (err) {
      logMessage(`Error updating Tech Summary: ${err}`);
      throw new Error("Error updating Tech Summary: " + (err as Error).message);
    }
  }

  async fetchProjectInfo(accountNumber: string, projectFiscalId: string) {
    try {
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const [projectInfo]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchProjectInfo(projectFiscalId, schemaName),
        { type: "SELECT" }
      );

      return projectInfo;
    } catch (err) {
      logMessage(`Error fetching project info: ${err}`);
      throw new Error("Error fetching project info: " + (err as Error).message);
    }
  }
   async fetchAccountInfo(accountRid: string, accountNumber: string) {
    try {
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const [accountInfo]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchAccountDetailsInfo(accountRid, schemaName),
        { type: "SELECT" }
      );

      return accountInfo;
    } catch (err) {
      logMessage(`Error fetching account info: ${err}`);
      throw new Error("Error fetching account info: " + (err as Error).message);
    }
  }

  async fetchAccountFpaInfo(transactionId: string, accountNumber: string) {
    try {
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const [accountFpaInfo]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchFpaRid(schemaName, transactionId),
        { type: "SELECT" }
      );

      return accountFpaInfo;
    } catch (err) {
      logMessage(`Error fetching account info: ${err}`);
      throw new Error("Error fetching account info: " + (err as Error).message);
    }
  }

  async fetchInteractionBatch(accountNumber: string) {
    try {
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const interactionBatchInfo : any = await this.orgDbSequelize.query(
        rawQueries.fetchBatchInInteraction(schemaName),
        { type: "SELECT" }
      );
      return interactionBatchInfo[0][0]?.interaction_batch_id ?? null
    } catch (err) {
      logMessage(`Error fetching account info: ${err}`);
      throw new Error("Error fetching account info: " + (err as Error).message);
    }
  }

  async fetchInteractionBatchByTransactionId(accountNumber: string, transactionId : string) {
    try {
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      const interactionBatchInfo : any = await this.orgDbSequelize.query(
        rawQueries.fetchBatchInInteractionByTransId(schemaName, transactionId),
        { type: "SELECT" }
      );
      return interactionBatchInfo[0]?.interaction_batch_id ?? null
    } catch (err) {
      logMessage(`Error fetching account info: ${err}`);
      throw new Error("Error fetching account info: " + (err as Error).message);
    }
  }


  async updateAIProcessed(
    accountNumber: string,
    projectFiscalRid: string,
    response: any
  ) {
    try {
      logMessage(`Updating AI processed flag for projectFiscalRid: ${projectFiscalRid}, accountNumber: ${accountNumber}`);
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }

       const [statusArr]: any = await this.mainDbSequelize.query(
          rawQueries.fetchInteractionStatusByType(statusAction.RESPONSE_RECEIVED)
        );
        const statusRid =
          Array.isArray(statusArr) && statusArr.length > 0
            ? statusArr[0].rid
            : null;


      let isAiProcessed = false;
      if (response.statusCode === 200) {
        isAiProcessed = true;
      }
      const { AiAssessmentAudit } =
        await this.interactionModelService.getModels(accountNumber);
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const updateData: any = {
        data_ingestion: response.statusCode === 200,
      };
      if (response.statusCode !== 200) {
        updateData.data_ingestion_error_message = response.error_message;
      }
      const [aiResponse] = await Promise.all([
        await this.orgDbSequelize.query(
          rawQueries.updateAIProcessedFlag(
            projectFiscalRid,
            schemaName,
            isAiProcessed,
            statusRid
          ),
          { type: "UPDATE" }
        ),
        await this.orgDbSequelize.query(
          rawQueries.updateAIProcessedFlagAttachments(
            projectFiscalRid,
            schemaName,
            isAiProcessed
          ),
          { type: "UPDATE" }
        ),
      ]);

      if (response?.data?.transaction_id) {
        logMessage(`Updating AiAssessmentAudit for transaction_id: ${response?.data?.transaction_id} ${schemaName}`);
        await AiAssessmentAudit.update(updateData, {
          where: { transaction_id: response?.data?.transaction_id },
        });
      }
    } catch (err) {
      logMessage(`Error updating AI processed flag: ${err}`);
    }
  }

  async updateQrePercent(
    qrePercent: number,
    accountNumber: string,
    projectFiscalRid: string,
    qreBreakdown: JSON,
    accountId: string,
    transaction_id: string,
    response: any
  ) {
    try {
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const projectFiscalData: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchProjectFiscal(projectFiscalRid, schemaName),
        { type: "SELECT" } // Correct type for SELECT
      );
      
      // Step 2: Safely get qreAdjustment
      const qreAdjustment = projectFiscalData[0]?.rd_percent_adjustment ?? 0;

      const netQre = qreAdjustment + qrePercent;
  
      const totalCost = projectFiscalData[0]?.total_cost_prj ?? 0;
      const totalFteCost = projectFiscalData[0]?.total_cost_fte_prj ?? 0;
      const totalSubconCost = projectFiscalData[0]?.total_cost_subcon_prj ?? 0;
      const totalNonlaborCost = projectFiscalData[0]?.total_cost_nonlabor_prj ?? 0;
    
      const qreFinalCost = totalCost * (netQre / 100);
      const qreFteCost = totalFteCost * (netQre / 100);
      const qreSubconCost = totalSubconCost * (netQre / 100);
      const qreNonlaborCost = totalNonlaborCost * (netQre / 100);

      const shouldUseStandardUpdate = qreAdjustment === null || qreAdjustment === undefined || qreAdjustment === 0;
      
      const finalQreUpdateQuery = shouldUseStandardUpdate
        ? rawQueries.updateQreInfo(projectFiscalRid, schemaName, qrePercent, {
          qreFinalCost,
          qreFteCost,
          qreSubconCost,
          qreNonlaborCost,
          netQre
        })
        : rawQueries.updateQreInfoLocked(projectFiscalRid, schemaName, qrePercent);

      const finalQreSummaryUpdateQuery = shouldUseStandardUpdate
        ? rawQueries.updateQreInfoSummary(projectFiscalRid, qrePercent, {
          qreFinalCost,
          qreFteCost,
          qreSubconCost,
          qreNonlaborCost,
          netQre
        })
        : rawQueries.updateQreInfoSummarLocked(projectFiscalRid, qrePercent);
      
      // Step 4: Run both updates in parallel
      await Promise.all([
        this.orgDbSequelize.query(finalQreUpdateQuery, { type: "UPDATE" }),
        this.mainDbSequelize.query(finalQreSummaryUpdateQuery, { type: "UPDATE" }),
      ]);

      // Fetch project info after updates
      const [projectInfo]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchProjectInfo(projectFiscalRid, schemaName),
        { type: "SELECT" }
      );

      const { AiAssessmentQre, AiAssessmentAudit } =
        await this.interactionModelService.getModels(accountNumber);
      const maxVersion = await AiAssessmentQre.max("version", {
        where: {
          account_rid: accountId,
          project_rid: projectInfo?.project_rid ?? null,
          project_fiscal_rid: projectFiscalRid,
        },
      });
      let version =
        (typeof maxVersion === "number"
          ? maxVersion
          : parseInt(maxVersion as any) || 0) + 1;
      let qrePayload = {
        created_by: process.env.SYSTEM_USER_ID || "system",
        account_rid: accountId,
        project_rid: projectInfo?.project_rid ?? null,
        project_fiscal_rid: projectFiscalRid,
        qre_percent: qrePercent,
        version,
        qre_detailed_breakdown: qreBreakdown,
        transaction_id: transaction_id,
      };
      const updateData: any = {
        is_qre_processed: response.statusCode === 200,
      };
      if (response.statusCode !== 200) {
        updateData.qre_error_message = response.error_message;
      }
      const [aiResponse] = await Promise.all([
        AiAssessmentQre.create(qrePayload),
        AiAssessmentAudit.update(updateData, {
          where: { transaction_id: transaction_id },
        }),
      ]);
    } catch (err) {
      logMessage(`Error updating QRE percent: ${err}`);
      throw new Error("Error updating QRE percent: " + (err as Error).message);
    }
  }
  async updateInteractionStatus(accountNumber: string, response: any) {
    try {
      const { AiAssessmentAudit } =
        await this.interactionModelService.getModels(accountNumber);
      const updateData: any = {
        is_interaction_question_processed: response.statusCode === 200,
      };
      if (response.statusCode !== 200) {
        updateData.interaction_question_error_message = response.error_message;
      }
      await AiAssessmentAudit.update(updateData, {
        where: { transaction_id: response.data.transaction_id },
      });
    } catch (err) {
      logMessage(`Error updating interaction status: ${err}`);
      throw new Error("Error updating interaction status: " + (err as Error).message);
    }
  }

  async fetchValidAccountNumberByNumber(accountNumber: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }

      const [account]: any[] = await this.mainDbSequelize.query(
       rawQueries.getAccountByRNumberQuery(),
        {
          replacements: { r_number: accountNumber },
          type: "SELECT",
        }
      );

      let accountRnumber = account?.r_number;

      if (account?.storage_type === "store_in_parent") {
        const [accountData]: any[] = await this.mainDbSequelize.query(
          rawQueries.fetchParentAccountforEmail,
          {
            replacements: { rid: account?.parent_account_rid },
            type: "SELECT",
          }
        );
        accountRnumber = accountData?.r_number;
      }

      return {
        accountNumber: accountRnumber,
        accountId: account?.rid,
        accountName: account?.account_name,
      };
    } catch (err) {
      logMessage(`Error fetching account : ${err}`);
      throw new Error("Error fetching account : " + (err as Error).message);
    }
  }
  async getAllowedExportFields(
    userId: string,
    permission_name: string
  ): Promise<any[]> {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }
    const [userInfo] = (await this.mainDbSequelize.query(
      rawQueries.fetchUserProfileId(),
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    )) as [{ profile_rid: string }] | [];

    if (!userInfo?.profile_rid) {
      return [];
    }

    const [profileFields, userFields] = await Promise.all([
      this.mainDbSequelize.query(rawQueries.fetchProfilePermissions(), {
        replacements: {
          permissionName: permission_name,
          profileId: userInfo?.profile_rid,
        },
        type: "SELECT",
      }),
      this.mainDbSequelize.query(rawQueries.fetchUserPermissions(), {
        replacements: {
          permissionName: permission_name,
          userId,
        },
        type: QueryTypes.SELECT,
      }),
    ]);

    // Merge: user overrides profile
    const userFieldMap = new Map<string, any>();
    for (const field of userFields as any[]) {
      userFieldMap.set(field.field_name, field);
    }

    const merged = (profileFields as any[]).map((pf) => {
      const userPerm = userFieldMap.get(pf.field_name);
      if (userPerm) {
        userFieldMap.delete(pf.field_name);
        return {
          field_desc: pf.field_desc,
          field_name: pf.field_name,
          read: pf.read ? true : userPerm?.read === true,
        };
      }
      return {
        field_desc: pf.field_desc,
        field_name: pf.field_name,
        read: pf.read,
      };
    });

    const userOnly = Array.from(userFieldMap.values()).map((uf) => ({
      field_desc: uf.field_desc,
      field_name: uf.field_name,
      read: uf.read,
    }));

    const exportableFields = [...merged, ...userOnly].filter((f) => f.read);
    return exportableFields;
  }

  async createSchedulerRecords () {
    const { SchedulerExecution } = await this.interactionModelService.getModels("");
    const findSchedulerExists = await SchedulerExecution.findOne({
      where : {
        scheduler_name : 'AITrigger',
        status : schedulerStatus.Running
      }
    })
    if(!findSchedulerExists) {
      const createSchedulerExecution = await SchedulerExecution.create({
        created_datetime : new Date(),
        started_at : new Date(),
        status : schedulerStatus.Running,
        scheduler_name : 'AITrigger'
      })
      return createSchedulerExecution
    }
  }

  async createSchedulerTaskRecords (executionRid : string, taskName : string) {
    const {SchedulerTaskExecution, SchedulerExecution} = await this.interactionModelService.getModels("")
    const findTaskAlreadyRunning = await SchedulerExecution.findOne({
      where : {
        rid : executionRid,
        status : schedulerStatus.Running
      }
    })
    if(findTaskAlreadyRunning) {
      const taskCreationRecord = await SchedulerTaskExecution.create({
        task_name : taskName,
        execution_rid : executionRid,
        started_at : new Date(),
        created_datetime : new Date(),
        status : schedulerStatus.Running
      })
      return taskCreationRecord;
    }
  }

  async updateSchedulerRecords (executionRid : string, status : string) {
    const {SchedulerExecution} = await this.interactionModelService.getModels("")
    await SchedulerExecution.update({
      status : status
    }, {
      where : {
        rid : executionRid
      }
    })
  }

  async updateSchedulerTaskRecords (executionRid : string, taskName : string, status : string, errorMessage : string) {
    const {SchedulerTaskExecution} = await this.interactionModelService.getModels("")
    await SchedulerTaskExecution.update({
      status : status,
      error_message : errorMessage,
      completed_at : status == schedulerStatus.Success ? new Date() : null
    }, {
      where : {
        execution_rid : executionRid,
        task_name : taskName
      }
    })
  }
  async findTaskRecordExists (executionRid : string, taskName : string) {
    const {SchedulerTaskExecution} = await this.interactionModelService.getModels("")
    return await SchedulerTaskExecution.findOne({
      where : {
        execution_rid : executionRid,
        task_name : taskName
      }, 
      attributes: ["rid"],
      raw : true,
    })
  }

  async insertEmailInfoDatas (data : any) {
    const {SendEmailInfo} = await this.interactionModelService.getModels("");
    const insertedData = await SendEmailInfo.create({
      interaction_rid : data.interaction_rid,
      account_rid : data.account_rid,
      account_rnumber : data.account_rnumber,
      email : data.email,
      name : data.name,
      project_fiscal_rid : data?.project_fiscal_rid || null,
      user_rid : data.user_rid,
      is_email_send : false,
      is_interaction_followup : data?.is_interaction_followup || false,
      interaction_level: data.interaction_level || 'Project',
      email_sent_at : null
    })
    return insertedData
  }

  async createAutoSendInteractionEntry(accountNumber: string, interaction_rid: string, project_fiscal_rid: string, email_info: any, account_rid: string, interaction_level: string) {
    const { AutoSendInteractionAudit } = await this.interactionModelService.getModels(accountNumber);
    const createdEntry = await AutoSendInteractionAudit.create({
      interaction_level: interaction_level,
      account_rid: account_rid,
      project_fiscal_rid: project_fiscal_rid,
      
    });
    return createdEntry;
  }

  async updateEmailSendFlag (interaction_rid : string) {
    await SendEmailInfo.update({
      is_email_send : true,
      email_sent_at : new Date().toISOString(),
      modified_datetime : new Date()
    }, 
    {
      where : {
      interaction_rid : interaction_rid
    }
    })
  }

  async fetchAccountDetails(account_number: string, parentAccountId: string, accountRid: string) {
    const {accountNumber} = await this.fetchValidAccountNumberByIdForEmail(accountRid);
  
    const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
    try {

      const sequelize = await initOrgSequelize();

      const fetchParentAccount: any = await sequelize.query(rawQueries.fetchInteractionSenderEmail(schemaName, parentAccountId), {
        replacements: { account_rid: accountRid },
        type: "SELECT",
      });

      if(fetchParentAccount && fetchParentAccount.length > 0){
        const parentDetails = fetchParentAccount[0];
        
        const isSubscriptionCreated = Boolean(
          parentDetails.subscription_created &&
          parentDetails.tenant_id &&
          parentDetails.client_id &&
          parentDetails.client_secret
        );
      
        return isSubscriptionCreated;
      }

      return false;
    } catch (err) {
      logMessage(`Error retrieving account details: ${err}`);
      throw new Error("Error retrieving account details");
    }
  }

  async createInteractionTemplate(
    interactionData: ICreateTemplateInteraction
  ) {
    // Implementation for creating interactions in the database
    try {
      const { InteractionTemplate } = await this.interactionModelService.getModels("");
      
      const isUnique = await this.checkIsTemplateUnique(interactionData.template_name,InteractionTemplate);
      if (!isUnique) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `An template with the name "${interactionData.template_name}" already exists. Please choose a different name.`,
        };
      }
      else
      {
        const interaction = await InteractionTemplate.create(interactionData);
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: { interaction },
        };
      }

     
    } catch (error) {
      logMessage(`Error creating interaction template: ${error}`);
      throw new Error("Error creating interaction template: " + error);
    }
  }

  private async checkIsTemplateUnique(
    template_name: string,
    InteractionTemplate: any
  ): Promise<boolean> {
    const response = await InteractionTemplate.findOne({
      where: where(
        fn("LOWER", col("template_name")),
        Op.eq,
        template_name.toLowerCase()
      ),
    });
    return !response;
  }


  async listInteractionTemplates(
  page: number = 1,
  limit: number = 100,
  filters: Record<string, string>,
  sortBy: string = "created_datetime",
  sortOrder: string = "ASC",
  type: string = "list"
) {
  try {
    const offset = (page - 1) * limit;
      let modifiedByFilter;
    let modifiedByConditions;
    let totalResults: number = 0;
    let disablePagination = false;
    if(type === "download")
      {
        disablePagination = true
      }
      const detectConditions = (filters: any) => {
      if (!filters) return null;
      for (let conditions of Object.values(ALPHANUMERIC_CONDITIONS)) {
        if (Object.keys(filters).includes(conditions)) return conditions;
      }
      return null;
    };
    if (filters?.modified_by) {
      modifiedByFilter = filters.modified_by;
      modifiedByConditions = detectConditions(modifiedByFilter);
    }
      ["modified_by"].forEach(key => {
      if (filters[key]) {
        disablePagination = true;
        delete filters[key];
      }
    });
    if (mainTableFilters[sortBy] !== undefined) {
          disablePagination = true;
        }
    const { whereClause } = this.buildWhereClause(filters);
    const [finalSortBy, finalSortOrder] = this.getSortParameters(sortBy, sortOrder);
    const { InteractionTemplate } = await this.interactionModelService.getModels("");
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.interactionModelService.getMainSequelize();
    }

    // Fetch technical summaries and count
    const { rows: interactionTemplates, count } = await InteractionTemplate.findAndCountAll({
      where: whereClause,
      order: [[finalSortBy, finalSortOrder]],
      ...(disablePagination
        ? {}
        : { limit: limit, offset: offset }),
    });
    // You can now use both interactionTemplates (array) and count (number)
    if (interactionTemplates.length === 0) {
      return {
        interactionTemplates: [],
        count: 0
      };
    }
    let createdByIds: any[] = [...new Set(interactionTemplates.map((user: any) => user.created_by))];
    let modifiedByIds: any[] = [...new Set(interactionTemplates.map((user: any) => user.modified_by))];
    let statusIds: any[] = [...new Set(interactionTemplates.map((user: any) => user.status_rid))];
    let fetchCreatedByUsers = await this.mainDbSequelize.query(rawQueries.fetchUser(createdByIds));
    let fetchModifiedByUsers = await this.mainDbSequelize.query(rawQueries.fetchUser(modifiedByIds));
    let fetchStatusInfo = await this.mainDbSequelize.query(rawQueries.fetchStatus(statusIds));
    let createdMap: Map<string, string> = new Map(fetchCreatedByUsers[0].map((user: any) => [user.rid, `${user.first_name} ${user.last_name}`]));
    let modifiedMap: Map<string, string> = new Map(fetchModifiedByUsers[0].map((user: any) => [user.rid, `${user.first_name} ${user.last_name}`]));
    let statusMap: Map<string, string> = new Map(fetchStatusInfo[0].map((status: any) => [status.rid, status.name]));
    let finalData = interactionTemplates == null ? [] : interactionTemplates.map((d: any) => {
      return {
        rid: d.rid,
        r_number: d.r_number,
        interaction_type_rid: d.interaction_type_rid,
        interaction_type_name: d.interaction_type_name,
        interaction_level_rid: d.interaction_level_rid,
        interaction_level_name: d.interaction_level_name,
        status_rid: d.status_rid,
        created_by: d.created_by,
        created_user_name: createdMap.get(d.created_by) || null,
        modified_by: d.modified_by,
        modified_user_name: modifiedMap.get(d.modified_by) || null,
        created_datetime: d.created_datetime,
        modified_datetime: d.modified_datetime
      };
    });
    const applyFilters = (data: any[], conditions: any, value: any, field: any) => {
      if (!conditions || !field) return data;
      const val = value[conditions];
      switch (conditions) {
        case ALPHANUMERIC_CONDITIONS.equals:
          return data.filter((d: any) => d[field]?.toLowerCase() === val?.toLowerCase());
        case ALPHANUMERIC_CONDITIONS.notEquals:
          return data.filter((d: any) => d[field]?.toLowerCase() != val?.toLowerCase());
        case ALPHANUMERIC_CONDITIONS.contains:
          return data.filter((d: any) => d[field]?.toLowerCase().includes(val?.toLowerCase()));
        case ALPHANUMERIC_CONDITIONS.isEmpty:
          return data.filter((d: any) => d[field] == null);
        default:
          return data;
      }
    };
    if (modifiedByConditions != null && modifiedByConditions != undefined)
      finalData = applyFilters(finalData, modifiedByConditions, modifiedByFilter, "modified_user_name");
    if (mainTableFilters[sortBy] != undefined && sortBy.toLowerCase() == 'asc') {
      finalData = finalData.sort((a: any, b: any) => {
        if (!a?.[sortBy]) return 1;
        if (!b?.[sortBy]) return -1;
        return a[sortBy].localeCompare(b[sortBy]);
      });
    } else if (mainTableFilters[sortBy] != undefined && sortBy.toLowerCase() == 'desc') {
      finalData = finalData.sort((a: any, b: any) => {
        if (!b?.[sortBy]) return 1;
        if (!a?.[sortBy]) return -1;
        return b[sortBy].localeCompare(a[sortBy]);
      });
    }
    totalResults = disablePagination ? finalData.length : count;
    let finalPaginatedData = [];
    if(type === "download") 
      {
        finalPaginatedData = finalData;
      }
      else
      {
          finalPaginatedData = disablePagination ? finalData.slice((page - 1) * limit, page * limit) : finalData;
      }
    return {
      interactionTemplates: finalPaginatedData,
      count: totalResults
    };
  } catch (err) {
    logMessage(`Error listing interaction templates: ${err}`);  
    throw new Error("Error listing interaction templates: " + (err as Error).message);
  }
  }
  
  async updateInteractionTemplate(
    interactionData: ICreateTemplateInteraction,
    userId: string,
    transaction: Transaction
  ) {
    const { InteractionTemplate } =
      await this.interactionModelService.getModels("");
const existingTemplate = await InteractionTemplate.findOne({
        where: {
          [Op.and]: [
            where(
              fn("LOWER", col("template_name")),
              Op.eq,
              interactionData.template_name.toLowerCase()
            ),
            { rid: { [Op.ne]: interactionData.template_rid } },
          ],
        },
      });
       if (existingTemplate) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `An account with the template name "${interactionData.template_name}" already exists. Please choose a different name.`,
        };
      }
      else
      {
        const updatedInteraction = await InteractionTemplate.update(
      {
        ...interactionData,
        modified_by: userId,
        modified_datetime: new Date(),
      },
      {
        where: {
          rid: interactionData.template_rid
        },
        transaction,
      }
    );
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: { interaction: updatedInteraction },
        };
      }
  }
  async addInteractionTemplateQuestions(
    interactionData: ICreateTemplateInteraction,
    interactionRid: string,
    transaction: Transaction,
    userId: string
  ) {
    try {
       const { InteractionTemplateItem } = await this.interactionModelService.getModels("");


      if (Array.isArray(interactionData.questions)) {
        for (const question of interactionData.questions) {
          switch (question.action_type) {
            case "add":
              await this.handleAddQuestionTemplate(
                InteractionTemplateItem,
                interactionData,
                interactionRid,
                question,
                userId,
                'Project',
              );
              break;
            case "delete":
              await this.handleDeleteQuestionTemplate(
                InteractionTemplateItem,
                interactionRid,
                question,
                userId,
                transaction
              );
              break;
            case "edit":
              await this.handleEditQuestionTemplate(
                InteractionTemplateItem,
                interactionData,
                interactionRid,
                question,
                userId,
                transaction
              );
              break;
            default:
              logMessage(
                `[addInteractionItems] Unknown action_type: ${question.action_type}`
              );
          }
        }
      } else {
        logMessage(`[addInteractionItems] No questions to process.`);
      }
    } catch (error) {
      logMessage(`[addInteractionItems] Error: ${error}`);
      throw new Error(
        "Error creating interaction: " + (error as Error).message
      );
    }
  }
  async fetchInteractionTemplateDetailsById(
  interactionRid: string
) {
  if (!this.mainDbSequelize) {
    this.mainDbSequelize = await this.interactionModelService.getMainSequelize();
  }

  const [interactionDetailsResult] = await this.mainDbSequelize.query(rawQueries.fetchInteractionTemplates, {
    replacements: { interactionRid },
    type: "SELECT"
  }) as [any[], any];

  if (!interactionDetailsResult || interactionDetailsResult.length === 0) {
    return null;
  }

  const interactionDetails = interactionDetailsResult as any;

  let interactionItems = await this.fetchInteractionTemplateItems(
    interactionRid
  );

   const userInfo = await this.insertUserDetails(
     interactionDetails.created_by ?? "",
     interactionDetails.modified_by ?? ""
   );

  const response: any = {
    template_rid: interactionDetails?.rid,
    template_name: interactionDetails?.template_name ?? "",
    r_number: interactionDetails.r_number ?? "",
    interaction_type: interactionDetails.interaction_type_rid ?? "",
    interaction_type_name: interactionDetails.interaction_type_name ?? "",
    interaction_level_rid: interactionDetails.interaction_level_rid ?? '',
    interaction_level_name: interactionDetails.interaction_level_name ?? '',
    status_rid: interactionDetails.status_rid ?? "",
    status_name: interactionDetails.status_name ?? "",
    modified_by: userInfo.modified_name ?? interactionDetails.modified_by,
    created_by: userInfo.created_name ?? interactionDetails.created_by,
    created_datetime: interactionDetails.created_datetime ?? null,
    modified_datetime: interactionDetails.modified_datetime ?? null,
    questions: interactionItems
  };

  return response;
  }
  async fetchInteractionTemplateItems(
    interactionRid: string,
  ) {
    try {
      const {
        InteractionTemplateItem,
      } = await this.interactionModelService.getModels("");
      // Convert Sequelize instances to plain objects

      const items = await InteractionTemplateItem.findAll({
        attributes: [
          "rid",
          "question_seq_num",
          "question",
          "notes",
          "is_mandatory",
        ],
        order: [
          ["question_seq_num", "ASC"],
          ["created_datetime", "ASC"],
        ],
        where: { template_rid: interactionRid},
      });
      const plainItems = items.map((item) => item.get({ plain: true }));
      return items;
    } catch (err) {
      logMessage(`Error fetching interaction template items: ${err}`);
      throw new Error(
        "Error fetching interaction template items: " + (err as Error).message
      );
    }
  }

  async getTemplateDetailsByCategory(categoryName: string) {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.interactionModelService.getMainSequelize();  
      }
      const [templateDetails]:any[] = await this.mainDbSequelize.query(
        rawQueries.fetchEmailTemplateByCategory(categoryName),
        {
          type: "SELECT",
        }
      );
  
  
      return templateDetails;
    }

  async createFourPartAssessment (fourPartAssessment : FourPartAssessmentResponse, accountNumber : string, project_id : string, company_id : string, transaction_id : string) {
    const {FourPartAssessment} = await this.interactionModelService.getModels(accountNumber);
    await FourPartAssessment.create({
      account_rid : company_id,
      project_fiscal_rid : project_id,
      created_by : process.env.SYSTEM_USER_ID!,
      created_datetime : new Date(),
      permitted_purpose : fourPartAssessment.assessment.four_part_assessment.permitted_purpose,
      process_of_experimentation : fourPartAssessment.assessment.four_part_assessment.process_of_experimentation,
      project_metadata : JSON.stringify(fourPartAssessment.assessment.project_metadata),
      rationale : fourPartAssessment.assessment.four_part_assessment.rationale,
      rd_potential_category : fourPartAssessment.assessment.four_part_assessment.rd_potential_category,
      status : fourPartAssessment.assessment.four_part_assessment.status,
      summary_judgment : fourPartAssessment.assessment.four_part_assessment.summary_judgment,
      technological_in_nature : fourPartAssessment.assessment.four_part_assessment.technological_in_nature,
      technological_uncertainty : fourPartAssessment.assessment.four_part_assessment.technological_uncertainty,
      tracker_one_liner : fourPartAssessment.assessment.tracker_one_liner,
      transaction_id : transaction_id
    })
}

  /**
   * Bulk fetch projects that do NOT have key contacts
   * Returns a Set of project fiscal RIDs that have no key contacts
   * 
   * @param {string[]} projectFiscalRids - Array of project fiscal RIDs to check
   * @param {string} schemaName - Schema name
   * @returns {Promise<Set<string>>} Set of project fiscal RIDs without key contacts
   */
  private async getProjectsWithoutKeyContacts(
    projectFiscalRids: string[],
    schemaName: string
  ): Promise<Set<string>> {
    try {
      // Short-circuit if there are no projects to check
      if (!projectFiscalRids || projectFiscalRids.length === 0) {
        return new Set<string>();
      }

      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }

      // Limit the number of project RIDs per query to avoid very large IN clauses
      const BATCH_SIZE = 1000;
      const projectsWithKeyContacts = new Set<string>();

      // Fetch key contacts for projects in batches
      for (let i = 0; i < projectFiscalRids.length; i += BATCH_SIZE) {
        const batch = projectFiscalRids.slice(i, i + BATCH_SIZE);

        const batchKeyContacts: any[] = await this.orgDbSequelize.query(
          rawQueries.fetchProjectsWithoutKeyContacts(schemaName, batch),
          {
            type: "SELECT",
          }
        );

        for (const row of batchKeyContacts) {
          if (row && row.entity_rid) {
            projectsWithKeyContacts.add(row.entity_rid);
          }
        }
      }
      // Return projects that DON'T have key contacts
      const projectsWithoutKeyContacts = new Set(
        projectFiscalRids.filter(rid => !projectsWithKeyContacts.has(rid))
      );

      if (projectsWithoutKeyContacts.size > 0) {
        logMessage(
          `[getProjectsWithoutKeyContacts] ${projectsWithoutKeyContacts.size} projects have no key contacts`
        );
      }

      return projectsWithoutKeyContacts;
    } catch (error) {
      logMessage(
        `Error fetching projects without key contacts: ${error}`
      );
      // Return empty set on error to avoid filtering out projects
      return new Set();
    }
  }
}


export default InteractionSchemaService;
