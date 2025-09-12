import { InteractionModelService } from "../interactionModelsService";
import { initOrgSequelize } from "../../config/orgDataSource";
import dayjs from "dayjs";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { Op, QueryTypes, Sequelize, Transaction, UUIDV4 } from "sequelize";
import {
  ICreateAccountInteraction,
  ICreateInteraction,
  InteractionDetailsResponse,
  InteractionResponse,
  IProject,
  IUpdateInteraction,
} from "../../utils/types";
import { Interaction } from "../../models/interaction";
import { ALPHANUMERIC_CONDITIONS, MAIN_SCHEMA_NAME, mainTableFilters, rawQueries, schedulerStatus, statusAction, techSummaryStatus } from "../../utils/constants";
import { InteractionHistory } from "../../models/interactionHistory";
import { SendEmailInfo } from "../../models/sendEmailInfo";

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
      console.log("AccountInteraction model retrieved successfully");

      const interaction = await AccountInteraction.create(interactionData, {
        transaction,
      });

      return interaction;
    } catch (error) {
      console.log(error);
      throw new Error("Error creating interaction: " + error);
    }
  }
  

  async createInteractions(
    accountNumber: string,
    interactionData: ICreateInteraction,
    transaction: Transaction
  ) {
    // Implementation for creating interactions in the database
    try {
      const { Interaction } = await this.interactionModelService.getModels(
        accountNumber
      );

      // Find both parent interaction and max interaction iteration in one query
      const interactions = await Interaction.findAll({
        where: {
          account_rid: interactionData.account_rid,
          project_fiscal_rid: interactionData.project_fiscal_rid,
        },
        order: [["created_datetime", "DESC"]],
      });
      const maxIteration = interactions.reduce(
        (max, curr) => Math.max(max, curr.interaction_iteration ?? 0),
        0
      );

      const interactionExists =
        interactions.length > 0 ? interactions[0] : null;

      if (interactionExists) {
        // Find parent interaction (first one created)
        const parentInteraction =
          interactions.length > 0
            ? interactions[interactions.length - 1]
            : null;
        interactionData.parent_interaction_rid = parentInteraction?.rid || null;
      }
      interactionData.interaction_iteration = (maxIteration ?? 0) + 1;

      const interaction = await Interaction.create(interactionData, {
        transaction,
      });

      return interaction;
    } catch (error) {
      console.log(error);
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
              console.warn(
                `[addInteractionItems] Unknown action_type:`,
                question.action_type
              );
          }
        }
      } else {
        console.warn(`[addInteractionItems] No questions to process.`);
      }
    } catch (error) {
      console.error("[addInteractionItems] Error:", error);
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
              await this.handleAddQuestion(
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
              await this.handleDeleteQuestion(
                InteractionItem,
                InteractionHistory,
                interactionRid,
                question,
                userId,
                transaction
              );
              break;
           
            default:
              console.warn(
                `[addInteractionItems] Unknown action_type:`,
                question.action_type
              );
          }
        }
      } else {
        console.warn(`[addInteractionItems] No questions to process.`);
      }
    } catch (error) {
      console.error("[addInteractionItems] Error:", error);
      throw new Error(
        "Error creating interaction: " + (error as Error).message
      );
    }
  }

  async sendAccountInteractions(    
    accountNumber:string,
    accountId: string,  
    accountInteractionId:string,
    projectInfo: IProject[],
    userId:string,
    interactionSource:string,
    interactionType:string
  ) {
    try {
      const { Interaction ,InteractionItem,AccountInteraction} = await this.interactionModelService.getModels(accountNumber);
      const sendStatusRid = await this.getInteractionStatusByType(
      statusAction.DRAFT
    );
      // Generate interactionRid using raw query: select 'D001' || gen_random_uuid()
      let interactionRid: string;
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }
      const [result]: any[] = await this.orgDbSequelize.query(
       rawQueries.generate_rid(),
        { type: QueryTypes.SELECT }
      );
      interactionRid = result?.rid;
      if (Array.isArray(projectInfo) && projectInfo.length > 0) {
        const bulkData = projectInfo.map((proj) => ({
          rid: interactionRid, // same rid for all
          project_rid: proj.project_rid,
          project_fiscal_rid: proj.project_fiscal_rid,
          interaction_type_rid: interactionType,
          interaction_source_rid: interactionSource,
          account_rid: accountId,
          account_interaction_rid: accountInteractionId,
          fiscal_year: proj.fiscal_year,
          created_datetime: new Date(),
          created_by: userId,
          status_rid: sendStatusRid!,
          type: 'Account'
        }));
        console.log("Bulk data prepared:", bulkData);
        // Use bulkCreate for efficient insertion
        if (bulkData.length > 0) {
          await Interaction.bulkCreate(bulkData, { ignoreDuplicates: true });
            // Bulk insert SendEmailInfo records after bulk Interaction creation
            const sendEmailInfoData = projectInfo.map((proj) => ({
            interaction_rid: interactionRid,
            account_rid: accountId,
            account_rnumber: accountNumber,
            project_fiscal_rid: proj.project_fiscal_rid,
            user_rid: userId,
            is_email_send: false,
            }));
            await SendEmailInfo.bulkCreate(sendEmailInfoData);
        }
         console.log("Generated interactionRid:", interactionRid);
         console.log("Generated accountInteractionId:", accountInteractionId);
      await InteractionItem.update(
        { interaction_rid: interactionRid },
        { where: { account_interaction_rid: accountInteractionId } }
      );
      await AccountInteraction.update
      (
        {sent_on_datetime: new Date()},
        { where: { rid: accountInteractionId } }
      );

      console.log("Account model retrieved successfully");
    }
  }
      catch (error) {
      console.log(error); 
      throw new Error("Error creating interaction: " + error);
      }
    }
  

  private async handleAddQuestion(
    InteractionItem: any,
    interactionData: ICreateInteraction | ICreateAccountInteraction,
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
      console.log(`[addInteractionItems] Added question:`, item);
    }
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
    console.log(`[addInteractionItems] Deleted question:`, question.rid);
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
    console.log(`[addInteractionItems] Edited question:`, question.rid);
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
      console.log("Error adding timeline", err);
      throw new Error("Error creating project resource timeline");
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
      },
      {
        where: {
          rid: interactionData.interaction_rid,
          project_fiscal_rid: interactionData.project_fiscal_rid,
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
        `SELECT * FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = :rid`,
        {
          replacements: { rid: accountId },
          type: "SELECT",
        }
      );

      let accountRnumber = account?.r_number;

      if (account?.storage_type === "store_in_parent") {
        const [accountData]: any[] = await this.mainDbSequelize.query(
          `SELECT * FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = :rid`,
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
        accountName: account.account_name,
      };
    } catch (err) {
      throw new Error("Error fetching account : " + (err as Error).message);
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
       const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
      const [finalSortBy, finalSortOrder] = this.getSortParameters(sortBy, sortOrder);
      const { AccountInteraction } = await this.interactionModelService.getModels(accountNumber);
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
      let interactionTypeMap: Map<string, string> = new Map(fetchInteractionTypeInfo[0].map((type: any) => [type.rid, type.name]));
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
      console.log(err);
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
      const { AiTechnicalSummary } = await this.interactionModelService.getModels(accountNumber);
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.interactionModelService.getMainSequelize();
      }

      // Fetch technical summaries and count
      const { rows: technicalSummary, count } = await AiTechnicalSummary.findAndCountAll({
        where: {
          project_fiscal_rid: projectFiscalRid,
          ...whereClause
        },
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
      let createdByIds: any[] = [...new Set(technicalSummary.map((user: any) => user.created_by))];
      let modifiedByIds: any[] = [...new Set(technicalSummary.map((user: any) => user.modified_by))];
      let statusIds: any[] = [...new Set(technicalSummary.map((user: any) => user.status_rid))];
      let fetchCreatedByUsers = await this.mainDbSequelize.query(rawQueries.fetchUser(createdByIds));
      let fetchModifiedByUsers = await this.mainDbSequelize.query(rawQueries.fetchUser(modifiedByIds));
      let fetchStatusInfo = await this.mainDbSequelize.query(rawQueries.fetchStatus(statusIds));
      let createdMap: Map<string, string> = new Map(fetchCreatedByUsers[0].map((user: any) => [user.rid, `${user.first_name} ${user.last_name}`]));
      let modifiedMap: Map<string, string> = new Map(fetchModifiedByUsers[0].map((user: any) => [user.rid, `${user.first_name} ${user.last_name}`]));
      let statusMap: Map<string, string> = new Map(fetchStatusInfo[0].map((status: any) => [status.rid, status.name]));
      let finalData = technicalSummary == null ? [] : technicalSummary.map((d: any) => {
        return {
          rid: d.rid,
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
        technicalSummary: finalPaginatedData,
        count: totalResults
      };
    } catch (err) {
      console.log(err);
      throw new Error("Error listing technical summary: " + (err as Error).message);
    }
  }

   private buildWhereClause(filters: Record<string, any>): {
    whereClause: Record<string, any>;
  } {
    let whereClause: Record<string, any> = {};
    let includeClause: Array<any> = [];
    console.log("filters", filters);
    if (filters) {
      const filterProcessors: Record<string, Function> = {
        'r_number': (value: any) => this.processTextFilter('r_number', value, whereClause),
        'technical_summary': (value: any) => this.processTextFilter('technical_summary', value, whereClause),
        'version': (value: any) => this.processNumberFilter('version', value, whereClause),
        'created_datetime': (value: any) => this.processDateFilter('created_datetime', value, whereClause),
        'modified_datetime': (value: any) => this.processDateFilter('modified_datetime', value, whereClause),
        'status_rid': (value: any) => this.processTextFilter('status_rid', value, whereClause),
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
      "created_by",
      "modified_datetime",     
       "version",
      "status"
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
      } else if (value.between[0] && value.between[1]) {
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
  async fetchTechnicalSummaryDetailsById(
    accountNumber: string,
    techSummaryId: string
  ) {
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
      return {
        rid: techSummaryDetails.dataValues.rid,
        r_number: techSummaryDetails.dataValues.r_number,
        technical_summary: techSummaryDetails.dataValues.technical_summary,
        version: techSummaryDetails.dataValues.version,
        status_rid: techSummaryDetails.dataValues.status_rid,
        status_name: statusInfo?.status_name || null,
        created_by: techSummaryDetails.dataValues.created_by,
        created_user_name: userInfo.created_name || null,
        modified_user_name: userInfo.modified_name || null,
        modified_by: techSummaryDetails.dataValues.modified_by,
        created_datetime: techSummaryDetails.dataValues.created_datetime,
        modified_datetime: techSummaryDetails.dataValues.modified_datetime,
        technical_summary_refinement_prompt: techSummaryDetails.dataValues.technical_summary_refinement_prompt
      }
    }


    return techSummaryDetails;
  }

  async fetchInteractionDetailsById(
    accountNumber: string,
    interactionRid: string,
    projectFiscalRid : string
  ) {
    const { Interaction } = await this.interactionModelService.getModels(
      accountNumber
    );

    let interactionDetails = await Interaction.findOne({
      where: {
        rid: interactionRid,
        project_fiscal_rid: projectFiscalRid
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
      } = interactionDetails.dataValues;
      const metainfo = await this.insertAdditionalInfo(
        interactionDetails,
        accountNumber
      );
      const userInfo = await this.insertUserDetails(
        created_by ?? "",
        modified_by ?? ""
      );
      const response: InteractionDetailsResponse = {
        interaction_rid: rid,
        project_name: metainfo?.project_name ?? "",
        project_code: metainfo?.project_code ?? "",
        account_rid,
        project_rid,
        fiscal_year: metainfo?.fiscal_year ?? "",
        project_fiscal_rid,
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
        response_updated_by: response_updated_by ?? null,
        response_updated_on: response_updated_on ?? null,
        global_attachments: globalAttachments,
        recipient_name: recipient_name || null,
        recipient_email: recipient_email || null,
      };

      return response;
    }
    return interactionDetails;
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
        throw new Error("Invalid technical summary ID");
      }
      techSummary.technical_summary_refinement_prompt = summaryContext;
      techSummary.modified_by = userId;
      techSummary.modified_datetime = new Date();
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
          `SELECT first_name, middle_name, last_name FROM ${MAIN_SCHEMA_NAME}."user" WHERE rid = :userId`,
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
          `SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.status WHERE rid = :id`,
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
      let project_info: any = null;

      if (interactionDetails?.dataValues?.interaction_type_rid) {
        const result = await this.mainDbSequelize.query(
          `SELECT rid, interaction_type_name FROM ${MAIN_SCHEMA_NAME}.interaction_type WHERE rid = :id`,
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
      if (interactionDetails?.dataValues?.status_rid) {
        const result = await this.mainDbSequelize.query(
          `SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.interaction_status WHERE rid = :id`,
          {
            replacements: { id: interactionDetails.dataValues.status_rid },
            type: "SELECT",
          }
        );
        interaction_status =
          Array.isArray(result) && result.length > 0 ? result[0] : null;
      }
      if (interactionDetails?.dataValues?.project_fiscal_rid) {
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
      }

      return {
        interaction_type_name: interaction_type?.interaction_type_name || null,
        interaction_status_name: interaction_status?.status_name || null,
        project_code: project_info?.project_code || null,
        project_name: project_info?.project_name || null,
        fiscal_year: project_info?.fiscal_year || null,
      };

      //return interactionDetails;
    } catch (err) {
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
        interactionDetails.project_fiscal_rid,
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

  async getInteractionStatus(status_scope?: string, currentStatus?: string) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }
    let whereClause =
      "status = 'active' AND (status_type IS NULL OR status_type = 'UI')";
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
    const interactionStatus = await this.mainDbSequelize.query(
      rawQueries.fetchInteractionStatusList(whereClause),
      {
        type: "SELECT",
      }
    );

    return interactionStatus;
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
      `Select rid, interaction_source_name from ${MAIN_SCHEMA_NAME}.interaction_source WHERE interaction_source_name = :type limit 1`,
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
      `Select rid, interaction_type_name from ${MAIN_SCHEMA_NAME}.interaction_type WHERE status = 'active' order by interaction_type_name ASC`,
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
      `Select rid, interaction_source_name from ${MAIN_SCHEMA_NAME}.interaction_source WHERE status = 'active' order by interaction_source_name ASC`,
      {
        type: "SELECT",
      }
    );

    return interactionSource;
  }
  async getResponseSource() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }

    const responseSource = await this.mainDbSequelize.query(
      `Select rid, response_source_name from ${MAIN_SCHEMA_NAME}.interaction_response_source WHERE status = 'active' order by response_source_name ASC`,
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
      const { InteractionResponseHistory, InteractionAttachment, Interaction } =
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
          where: { rid: responseData.interaction_rid,
            project_fiscal_rid: responseData.project_fiscal_rid
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
          where: { interaction_rid: responseData.interaction_rid },
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
              created_by: userId,
            },
            { transaction }
          );
        }
      }

      if (responseData.questions && Array.isArray(responseData.questions)) {
        for (const question of responseData.questions) {
          const created = await InteractionResponseHistory.create(
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
          for (const attachment of question.attachments) {
            await InteractionAttachment.create(
              {
                interaction_rid: responseData.interaction_rid,
                interaction_response_rid: created.rid,
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

      if (responseCreated) {
        const { Interaction, InteractionSummary } =
          await this.interactionModelService.getModels(accountNumber);
        const status =
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
            responseData.project_fiscal_rid
          );
          console.log("isAutoTriggerEnabled", isAutoTriggerEnabled);
        }

        await Interaction.update(updateData, {
          where: { rid: responseData.interaction_rid },
        });
        await InteractionSummary.update(summaryUpdateData, {
          where: { interaction_rid: responseData.interaction_rid },
        });
      }
      return {
        interactionVersion,
        isAutoTriggerEnabled,
      };
    } catch (err) {
      throw new Error(
        "Error updating interaction response: " + (err as Error).message
      );
    }
  }

  async updateAttachmentCount(
    accountNumber: string,
    interactionRid: string,
    interactionVersion: number
  ) {
    const { Interaction, InteractionSummary, InteractionAttachment } =
      await this.interactionModelService.getModels(accountNumber);

    const attachmentCount = await InteractionAttachment.count({
      where: {
        interaction_rid: interactionRid,
        interaction_version: interactionVersion,
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

      return attachments.map((att) => ({
        fileUrl: att.attachment_url,
        fileName: att.attachment_name,
        fileSize: att.attachment_size,
        fileType: att.attachment_type,
      }));
    } catch (err) {
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
          "is_mandatory",
        ],
        order: [
          ["question_seq_num", "ASC"],
          ["created_datetime", "ASC"],
        ],
        where: { interaction_rid: interactionRid },
      });
      const plainItems = items.map((item) => item.get({ plain: true }));
      for (const item of plainItems) {
        // Fetch attachments for each question
        const attachments = await InteractionAttachment.findAll({
          where: {
            interaction_item_rid: item.rid,
            interaction_version: interactionVersion,
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
        (item as any).attachments = Array.isArray(attachmentsList)
          ? attachmentsList.map((att: any) => ({
              fileUrl: att?.attachment_url ?? "",
              fileName: att?.attachment_name ?? "",
              fileSize: att?.attachment_size ?? "",
              fileType: att?.attachment_type ?? "",
            }))
          : [];

        // Fetch latest response history for each question
        const response = await InteractionResponseHistory.findOne({
          where: {
            interaction_item_rid: item.rid,
            interaction_version: interactionVersion,
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
          "is_mandatory",
        ],
        order: [
          ["question_seq_num", "ASC"],
          ["created_datetime", "ASC"],
        ],
        where: { interaction_rid: interactionRid },
      });
      return items;
    } catch (err) {
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
          "is_mandatory",
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
      throw new Error(
        "Error fetching interaction items: " + (err as Error).message
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
      if (!senderEmailInfo[0]) {
         if (!this.mainDbSequelize) {
           this.mainDbSequelize = await this.interactionModelService.getMainSequelize();
         }
         const [mainSenderEmailInfo]: any[] = await this.mainDbSequelize.query(
           rawQueries.fetchGlobalSenderEmail()
         );
         if (mainSenderEmailInfo && mainSenderEmailInfo.length > 0) {
           senderEmailInfo[0] = mainSenderEmailInfo[0].email;
         }
         return {
            email: senderEmailInfo[0],
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            tenantId: process.env.TENANT_ID
          }
      } else {
        
          return {
            email: senderEmailInfo[0].support_email,
            clientId: senderEmailInfo[0].client_id,
            clientSecret: senderEmailInfo[0].client_secret,
            tenantId: senderEmailInfo[0].tenant_id,
          }
      }
    } catch (err) {
      throw new Error(
        "Error fetching sender email info: " + (err as Error).message
      );
    }
  }
  async fetchEmailInfo(
    accountNumber: string,
    interactionRid: string,
    projectFiscalRid: string,
    accountRid: string
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
      console.log("activeStatus", statusArr);
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
      const [interactionRecipients]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchInteractionRecipient(projectFiscalRid, statusArr.rid, schemaName),
        {
          type: "SELECT",
        }
      );

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
          rawQueries.fetchInteractionRecipientAccount(accountRid,statusArr.rid ,schemaName),
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
        name: interactionRecipients?.key_contact_name ?? null,
        email: interactionRecipients?.key_contact_email ?? null,
        ccEmails: uniqueCCEmails ?? [],
      };
    } catch (err) {
      throw new Error("Error fetching POC email: " + (err as Error).message);
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
      console.error("Error fetching user group type:", error);
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
      console.error("Error in getAccessibleAccountInfo:", err);
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
      console.error("Error fetching user profile info:", error);
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

    const query = `
    SELECT DISTINCT ps.project_rid
    FROM ${MAIN_SCHEMA_NAME}.project_summary AS ps
    LEFT JOIN ${MAIN_SCHEMA_NAME}.project_fiscal_summary AS pfs ON ps.project_rid = pfs.project_rid
    ${accessControlWhere}
  `;

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
      const updateData: any = {
        last_reminder_on: new Date(),
        last_reminder_by: userEmailId,
       
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
      throw new Error(
        "Error updating interaction status: " + (err as Error).message
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
        
      throw new Error(
        "Error checking email recipient availability: " +
          (err as Error).message
      );
    }
  }

  async isAutoSendInteractionEnabled(
    accountNumber: string,
    interactionDetails: any,
    interactionRid: string
  ) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }
      const [globalInteractionAccess]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchGlobalAutoSendAccess(),
        { type: "SELECT" }
      );
      console.log("globalInteractionAccess", globalInteractionAccess);
      if (globalInteractionAccess?.auto_send_interaction) {
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

        // Fetch project info
        const [projectInfo]: any[] = await this.orgDbSequelize.query(
          rawQueries.fetchisAutoSendEnabled(
            interactionDetails.project_fiscal_rid,
            schemaName
          ),
          { type: "SELECT" }
        );

        return projectInfo?.auto_send_ai_interaction ?? false;
      }
    } catch (err) {
      throw new Error(
        "Error checking auto-send interaction status: " + (err as Error).message
      );
    }
  }

  async isAutoTriggerEnabled(
    accountNumber: string,
    project_fiscal_rid: string
  ) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }
      const [globalAccess]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchGlobalAutoSendAccess(),
        { type: "SELECT" }
      );
      console.log("globalAccess", globalAccess);

      if (globalAccess?.auto_access_rd) {
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

        // Fetch project info
        const [projectInfo]: any[] = await this.orgDbSequelize.query(
          rawQueries.fetchisAutoTriggerEnabled(project_fiscal_rid, schemaName),
          { type: "SELECT" }
        );

        return projectInfo?.auto_access_rd ?? false;
      }
    } catch (err) {
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
      console.log("activeStatus", activeStatus);

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
      throw new Error("Error updating QRE percent: " + (err as Error).message);
    }
  }
  async updateAIProcessed(
    accountNumber: string,
    projectFiscalRid: string,
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
      console.log("AI Processed flag updated successfully", aiResponse);
      if (response?.data?.transaction_id) {
        AiAssessmentAudit.update(updateData, {
          where: { transaction_id: response?.data?.transaction_id },
        });
      }
    } catch (err) {
      throw new Error(
        "Error updating AI processed flag: " + (err as Error).message
      );
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
      await Promise.all([
        this.orgDbSequelize.query(
          rawQueries.updateQreInfo(projectFiscalRid, schemaName, qrePercent),
          { type: "UPDATE" }
        ),
        this.mainDbSequelize.query(
          rawQueries.updateQreInfoSummary(projectFiscalRid, qrePercent),
          { type: "UPDATE" }
        ),
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
      console.log(err);
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
        where: { transaction_id: response.transaction_id },
      });
    } catch (err) {
      console.log(err);
      throw new Error("Error updating QRE percent: " + (err as Error).message);
    }
  }

  async fetchValidAccountNumberByNumber(accountNumber: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }

      const [account]: any[] = await this.mainDbSequelize.query(
        `SELECT * FROM ${MAIN_SCHEMA_NAME}.account WHERE r_number = :r_number`,
        {
          replacements: { r_number: accountNumber },
          type: "SELECT",
        }
      );

      let accountRnumber = account?.r_number;

      if (account?.storage_type === "store_in_parent") {
        const [accountData]: any[] = await this.mainDbSequelize.query(
          `SELECT * FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = :rid`,
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
        status : schedulerStatus.Running
      }
    })
    if(!findSchedulerExists) {
      const createSchedulerExecution = await SchedulerExecution.create({
        created_datetime : new Date(),
        started_at : new Date(),
        status : schedulerStatus.Running
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
      project_fiscal_rid : data.project_fiscal_rid,
      user_rid : data.user_rid,
      is_email_send : false
    })
    return insertedData
  }

  async updateEmailSendFlag (interaction_rid : string) {
    await SendEmailInfo.update({
      is_email_send : true
    }, 
    {
      where : {
      interaction_rid : interaction_rid
    }
    })
  }

}


export default InteractionSchemaService;
