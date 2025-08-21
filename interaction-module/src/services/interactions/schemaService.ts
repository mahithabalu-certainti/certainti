import { InteractionModelService } from "../interactionModelsService";
import { initOrgSequelize } from "../../config/orgDataSource";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { Sequelize, Transaction } from "sequelize";
import {
  ICreateInteraction,
  InteractionDetailsResponse,
  InteractionResponse,
  IUpdateInteraction,
} from "../../utils/types";
import { Interaction } from "../../models/interaction";
import { MAIN_SCHEMA_NAME, rawQueries, statusAction } from "../../utils/constants";
import { InteractionHistory } from "../../models/interactionHistory";

class InteractionSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private interactionModelService: InteractionModelService;

  constructor() {
    this.interactionModelService = new InteractionModelService();
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

  private async handleAddQuestion(
    InteractionItem: any,
    interactionData: ICreateInteraction,
    interactionRid: string,
    question: any,
    transaction: Transaction
  ) {
    if (interactionRid) {
      const item = {
        interaction_rid: interactionRid,
        ...question,
        ...interactionData,
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
    await InteractionHistory.create(
      {
        interaction_rid: interactionRid,
        attribute_name: "question",
        old_value: existingData?.dataValues?.question ?? "",
        new_value: question?.question ?? "",
        interaction_item_rid: question?.rid ?? "",
        created_by: userId,
      },
      { transaction }
    );
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
        // Iterate over questions array
        console.log("Question", newValue);
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
    interactionRnumber: string
  ) {
    try {
      console.log("Rnumber received", interactionRnumber);
      const { InteractionSummary } =
        await this.interactionModelService.getModels(accountNumber);

      await InteractionSummary.create({
        rid: interactionRid,
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
    const { Interaction } = await this.interactionModelService.getModels(
      accountNumber
    );

    const updatedInteraction = await Interaction.update(
      {
        ...interactionData,
        modified_by: userId,
        modified_datetime: new Date(),
      },
      {
        where: {
          rid: interactionData.interaction_rid,
        },
        transaction,
      }
    );

    return updatedInteraction;
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

  async fetchInteractionDetailsById(
    accountNumber: string,
    interactionRid: string
  ) {
    const { Interaction } = await this.interactionModelService.getModels(
      accountNumber
    );

    let interactionDetails = await Interaction.findOne({
      where: {
        rid: interactionRid,
      },
    });
    let interactionItems = await this.fetchInteractionItems(
      accountNumber,
      interactionRid
    );
    console.log("Interaction items", interactionItems);
    const globalAttachments = await this.fetchGlobalAttachmentsByInteractionRid(
        accountNumber,
        interactionRid
      );

    if (interactionDetails && interactionDetails.dataValues) {
      // Attach interaction items (questions) to the response
      //interactionDetails.dataValues.questions = interactionItems;
      // Optionally, pick only required fields for the response
      const {
        rid,
        account_rid,
        project_rid,
        fiscal_year,
        project_fiscal_rid,
        r_number,
        interaction_type_rid,
        status_rid,
        modified_by,
        created_by,
        created_datetime,
        response_updated_by,
        response_updated_on
      } = interactionDetails.dataValues;
      const metainfo = await this.insertAdditionalInfo(
        interactionDetails,
        accountNumber
      );
      const userInfo = await this.insertUserDetails(
        created_by ?? "",
        modified_by ?? ""
      );
      console.log(metainfo);
      const response: InteractionDetailsResponse = {
        interaction_rid:rid,
        project_name: metainfo?.project_name ?? "",
        project_code: metainfo?.project_code ?? "",
        account_rid,
        project_rid,
        fiscal_year,
        project_fiscal_rid,
        r_number: r_number ?? "",
        interaction_type: interaction_type_rid ?? "",
        interaction_type_name: metainfo?.interaction_type_name ?? "",
        status: status_rid ?? "",
        status_name: metainfo?.interaction_status_name ?? "",
        modified_by: userInfo.modified_name ?? "",
        created_by: userInfo.created_name ?? "",
        created_datetime: created_datetime ?? null,
        modified_datetime:
        interactionDetails.dataValues.modified_datetime ?? null,
        questions: interactionItems,
        response_updated_by: response_updated_by ?? null,
        response_updated_on: response_updated_on ?? null,
        global_attachments: globalAttachments,
      };

      return response;
    }
    return interactionDetails;
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
      if (interactionDetails?.dataValues?.rid) {
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(/\D/g, "")}`;
        const result = await this.orgDbSequelize.query(
          `SELECT project_code, project_name FROM ${schemaName}.project WHERE rid = :id`,
          {
            replacements: { id: interactionDetails.dataValues.project_rid },
            type: "SELECT",
          }
        );
        project_info =
          Array.isArray(result) && result.length > 0 ? result[0] : null;
      }

      return {
        interaction_type_name: interaction_type?.interaction_type_name || null,
        interaction_status_name: interaction_status?.status_name || null,
        project_code: project_info?.project_code || null,
        project_name: project_info?.project_name || null,
      };

      //return interactionDetails;
    } catch (err) {
      throw new Error("Error fetching geo data: " + (err as Error).message);
    }
  }

  async fetchInteractionInfo(interactionRid: string, accountNumber: string) {
    const { Interaction } = await this.interactionModelService.getModels(accountNumber);

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
      this.mainDbSequelize = await this.interactionModelService.getMainSequelize();
    }
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(/\D/g, "")}`;

    // Fetch project info
    const [projectInfo]: any[] = await this.orgDbSequelize.query(
      rawQueries.fetchProjectInfo(interactionDetails.project_rid, schemaName),
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
        account_rid: accountInfo?.rid ?? null
      },
      interactionInfo:{
        interaction_id: interactionDetails?.r_number ?? null,
       
      }
    };
  }

  async getInteractionStatus(status_scope?: string,currentStatus?: string) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }
  let whereClause = "status = 'active' AND (status_type IS NULL OR status_type = 'UI')";
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
      `Select rid, status_name from ${MAIN_SCHEMA_NAME}.interaction_status WHERE  status_name = :type limit 1`,
      {
        replacements: { type },
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

    const interactionStatus:any[] = await this.mainDbSequelize.query(
      rawQueries.fetchInteractionStatus(id),
    );
    return interactionStatus.length > 0 ? interactionStatus[0].status_name : null;
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

  async updateInteractionResponse(
    accountNumber: string,
    responseData: InteractionResponse,
    userId: string,
    transaction: Transaction
  ) {
    try {
      const { InteractionResponseHistory, InteractionAttachment } =
        await this.interactionModelService.getModels(accountNumber);
      if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }
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
          response_by: userId,
          response_on: new Date(),
          response_source: "Manual",
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
              response_by: userId,
              response_on: new Date(),
              response_source: "Manual",
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
        const attachmentCount = await InteractionAttachment.count({
          where: { interaction_rid: responseData.interaction_rid }
        });
        const attachmentcount = attachmentCount;
        const { Interaction, InteractionSummary } =
         await this.interactionModelService.getModels(accountNumber);
         const status = statusAction[responseData.status_action as keyof typeof statusAction];
         const [statusArr]: any = await this.mainDbSequelize.query(rawQueries.fetchInteractionStatusByType(status));
         const statusRid = Array.isArray(statusArr) && statusArr.length > 0 ? statusArr[0].rid : null;
         const [result]: any[] = await this.mainDbSequelize.query(rawQueries.fetchUserEmail(userId));
         const userEmailId = result[0]?.email ?? userId;
         const updateData: any = {
          status_rid: statusRid,
          response_updated_on: new Date(),
          response_updated_by: userEmailId,
          response_source: "Manual",
          attachment_count: attachmentcount
        };

        const summaryUpdateData: any = {
          status_rid: statusRid,
          response_updated_on: new Date(),
          response_updated_by: userEmailId,
          response_source: "Manual",
          attachment_count: attachmentcount
        };
       
        if (status === "Response Received") {
          updateData.response_submitted_on = new Date();
          updateData.response_submission_by = userEmailId;
          summaryUpdateData.response_submitted_on = new Date();
          summaryUpdateData.response_submission_by = userEmailId;
        }

        await Interaction.update(updateData, {
          where: { rid: responseData.interaction_rid },
        });
        await InteractionSummary.update(summaryUpdateData, {
          where: { rid: responseData.interaction_rid },
        });
      }
    } catch (err) {
      console.log(err)
      throw new Error(

        "Error updating interaction response: " + (err as Error).message
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

async fetchGlobalAttachmentsByInteractionRid(accountNumber: string, interactionRid: string) {
  try {
    const { InteractionAttachment } = await this.interactionModelService.getModels(accountNumber);

    const attachments = await InteractionAttachment.findAll({
      where: { interaction_rid: interactionRid, interaction_item_rid: '' },
      attributes: [
        "attachment_url",
        "attachment_name",
        "attachment_size",
        "attachment_type",
      ],
    });

    return attachments.map(att => ({
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
  async fetchInteractionItems(accountNumber: string, interactionRid: string) {
    try {
      const { InteractionItem, InteractionResponseHistory,InteractionAttachment } =
        await this.interactionModelService.getModels(accountNumber);
        // Convert Sequelize instances to plain objects
        
      const items = await InteractionItem.findAll({
        attributes: [
          "rid",
          "question_seq_num",
          "question",
          "notes",
          "is_mandatory",
          "response_on_datetime",
        ],
        where: { interaction_rid: interactionRid },
      });
      const plainItems = items.map(item => item.get({ plain: true }));
      for (const item of plainItems) {
        // Fetch attachments for each question
        const attachments = await InteractionAttachment.findAll({
          where: { interaction_item_rid: item.rid },
          attributes: [
        "attachment_url",
        "attachment_name",
        "attachment_size",
        "attachment_type",
          ],
        });
        const attachmentsList = attachments.map(item => item.get({ plain: true }));
        (item as any).attachments = Array.isArray(attachmentsList) ? attachmentsList.map((att: any) => ({
          fileUrl:  att?.attachment_url ?? "",
          fileName: att?.attachment_name ?? "",
          fileSize: att?.attachment_size ?? "",
          fileType: att?.attachment_type ?? "",
        })) : [];

       
        // Fetch latest response history for each question
        const response = await InteractionResponseHistory.findOne({
          where: { interaction_item_rid: item.rid },
          order: [["response_on", "DESC"]],
        });
        item.is_editable = !response;
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

async fetchInteractionQuestionsById(
    accountNumber: string,
    interactionRid: string
  ) {
    try {
      const { InteractionItem,InteractionResponseHistory } = await this.interactionModelService.getModels(
        accountNumber
      );

      const items = await InteractionItem.findAll({
        attributes: [
          "rid",
          "question_seq_num",
          "question",
          "notes",
          "is_mandatory",
          "response_on_datetime",
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

  async fetchPOCEmail(accountNumber: string, interactionRid: string) {
    try {
      const { Interaction } =
        await this.interactionModelService.getModels(accountNumber);
        const interactionInfo = await Interaction.findOne({
          where: { rid: interactionRid },
          raw: true,
        });
        if (!this.mainDbSequelize) {
        this.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }
      if (!interactionInfo?.project_fiscal_rid) {
       return {
         name: null,
         email: null
       };
      }
      const [result]: any[] = await this.mainDbSequelize!.query(
        rawQueries.fetchPOCEmail(interactionInfo?.project_fiscal_rid),
        {
          replacements: { projectRid: interactionInfo?.project_fiscal_rid },
          type: "SELECT",
        }
      );
      return {
        name: result?.project_point_of_contact ?? null,
        email: result?.project_point_of_contact_email ?? null
      };

  } catch (err) {
    throw new Error(
      "Error fetching POC email: " + (err as Error).message
    );
  }
}
async updateInteractionInfo(
  accountNumber: string,
  interactionRid: string,
  status: string,
  userId: string,
  emailInfo: { name: string | null; email: string | null }
) {
  try {
    const { Interaction } = await this.interactionModelService.getModels(
      accountNumber
    );
    if (!this.mainDbSequelize) {
      this.mainDbSequelize =
        await this.interactionModelService.getMainSequelize();
    }
    const [statusArr]: any = await this.mainDbSequelize.query(rawQueries.fetchInteractionStatusByType(status));
    const statusRid = Array.isArray(statusArr) && statusArr.length > 0 ? statusArr[0].rid : null;
    await Interaction.update(
      { status_rid: statusRid, modified_by: userId, modified_datetime: new Date(),
        recipient_email: emailInfo.email,
        recipient_name: emailInfo.name,
        sent_by_rid: userId,
        sent_by_mail_id: "dhivya.s@hubino.com",
        sent_on_datetime: new Date(),
      },
      { where: { rid: interactionRid } }
    );
  } catch (err) {
    throw new Error(
      "Error updating interaction status: " + (err as Error).message
    );
  }
}
async fetchAndUpdateFromAiTriggerResponse (data : any) {
  console.log("Response : ", data)
  return {
    statusMessage : "Details updated successfully",
    status : data.status,
    data : data.project_summary
  };
}
async isAutoSendInteractionEnabled(accountNumber: string,interactionDetails: any, interactionRid: string) {
  try {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.interactionModelService.getSequelize();
    }
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(/\D/g, "")}`;

    // Fetch project info
    const [projectInfo]: any[] = await this.orgDbSequelize.query(
      rawQueries.fetchisAutoSendEnabled(interactionDetails.project_fiscal_rid, schemaName),
      { type: "SELECT" }
    );

    return projectInfo?.auto_send_ai_interaction ?? false;
  } catch (err) {
    throw new Error(
      "Error checking auto-send interaction status: " + (err as Error).message
    );
  }
}
}


export default InteractionSchemaService;
