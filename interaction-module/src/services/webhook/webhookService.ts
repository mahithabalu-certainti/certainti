import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import csv from "csv-parser";
import ExcelJS from "exceljs";
import { HttpStatus, rawQueries } from "../../utils/constants";
import { Readable } from "stream";
import { InteractionModelService } from "../interactionModelsService";
import InteractionSchemaService from "../interactions/schemaService";
import { InteractionService } from "../interactions/interactionService";
import { Logger } from "winston";
import { decryptClientSecret } from "../../utils/helpers";
import { WebhookEmailLogAttributes } from "../../models/webhookEmailLog";

export class WebHookService {
  private graphClient: Client | null = null;
  private interactionModelService: InteractionModelService;
  private interactionSchemaService: InteractionSchemaService;
  private interactionService: InteractionService;
  private processedMessageIds = new Set();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;

    this.interactionModelService = new InteractionModelService();
    this.interactionSchemaService = new InteractionSchemaService();
    this.interactionService = new InteractionService(logger);
  }

  async webhookHanlder(data: any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }> {
    try {
      const notifications = data.value;
      const results = [];
      let mailProcessedResults = null;
      let finalResult = null;
      let receivedEmail = null;
      let messageId = null;

      for (const notification of notifications) {
        const subscriptionId = notification.subscriptionId;
        messageId = notification.resourceData?.id;

        if (!messageId) {
          continue;
        }

        if (this.processedMessageIds.has(messageId)) {
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.BAD_REQUEST_MESSAGE,
            errorMessage: "Duplicate message. Skipping...",
          };
        }
        this.processedMessageIds.add(messageId);

        const {
          subscription_created,
          email,
          tenant_id,
          client_id,
          client_secret,
        } = await this.fetchCredentialsBySubscriptionId(subscriptionId);

        receivedEmail = email;

        if (subscription_created && email) {
          const decryptedSecret = await decryptClientSecret(client_secret);
          this.graphClient = this.createGraphClient(
            tenant_id,
            client_id,
            decryptedSecret
          );
        } else {
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.BAD_REQUEST_MESSAGE,
            errorMessage: "Invalid Graph Connections",
          };
        }

        finalResult = await this.processNotification(
          notification,
          email,
          this.graphClient
        );

        mailProcessedResults = finalResult;

        if (!finalResult.success) {
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.BAD_REQUEST_MESSAGE,
            errorMessage: "Invalid notification",
          };
        }

        if (finalResult.attachments && finalResult.attachments.length == 0) {
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.BAD_REQUEST_MESSAGE,
            errorMessage: "Attachemnts Not found",
          };
        }
        if (finalResult) {
          results.push(finalResult);
        }
      }

      if (
        !results[0].attachments &&
        results[0].attachments.length === 0 &&
        results[0].attachments[0].parsedData
      ) {
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid attachments",
        };
      }

      const parsedData = results[0].attachments[0].parsedData;
      let interactionId: string | null = null;
      let accountNumber: string | null = null;
      let projectId: string | null = null;
      let projectName: string | null = null;
      let projectCode: string | null = null;
      let accountNumberById = finalResult.accountNumber;

      let answers: {
        rid: string;
        notes: string;
        question: string;
        response: string;
        attachments: [];
        questionSeqId?: string;
      }[] = [];

      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];

        // Extract interaction ID
        if (row[0]?.toLowerCase() === "interaction id") {
          interactionId = row[1] || null;
        }

        if (row[0]?.toLowerCase() === "account id") {
          accountNumber = row[1] || null;
        }

        if (row[0]?.toLowerCase() === "project id") {
          projectId = row[1] || null;
        }

        if (row[0]?.toLowerCase() === "project name") {
          projectName = row[1] || null;
        }

        if (row[0]?.toLowerCase() === "project code") {
          projectCode = row[1] || null;
        }

        // Find header row for questions/answers
        if (
          row[1]?.toLowerCase() === "questions" &&
          row[2]?.toLowerCase() === "answers"
        ) {
          // Start reading data from the next row
          for (let j = i + 1; j < parsedData.length; j++) {
            const dataRow = parsedData[j];
            if (dataRow.length >= 2) {
              answers.push({
                rid: "",
                questionSeqId: dataRow[0]?.trim(),
                question: dataRow[1]?.trim() || "",
                response: dataRow[2]?.trim() || "",
                notes: dataRow[3]?.trim() || "",
                attachments: [],
              });
            }
          }

          break;
        }
      }

      if(answers && answers.length > 0){
        answers = answers.filter((val) => val.response.trim() != "" && val.response != null)
      }

      if (!this.graphClient) {
        await this.logWebhookEmailEvent({
          schemaName: mailProcessedResults.accountNumber,
          emailSubject: mailProcessedResults.subject,
          emailSender: mailProcessedResults.from,
          status: "FAILED",
          errorMessage: "Invalid Graph Credentials",
        });
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid Graph Credentials",
        };
      }

      if (!accountNumber) {
        await this.logWebhookEmailEvent({
          schemaName: mailProcessedResults.accountNumber,
          emailSubject: mailProcessedResults.subject,
          emailSender: mailProcessedResults.from,
          status: "FAILED",
          errorMessage: "Invalid Account Number",
        });
        this.sendMailWithAttachment(
          finalResult,
          finalResult.attachments[0].fileName,
          finalResult.attachments[0].file,
          "Invalid account number",
          finalResult.forwardEmail,
          this.graphClient,
          receivedEmail
        );
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid Account Number",
        };
      }

      const { accountNumber: accountNumberByUser } =
        await this.interactionSchemaService.fetchValidAccountNumberByNumber(
          accountNumber
        );
      if (!accountNumberByUser) {
        await this.logWebhookEmailEvent({
          schemaName: mailProcessedResults.accountNumber,
          emailSubject: mailProcessedResults.subject,
          emailSender: mailProcessedResults.from,
          status: "FAILED",
          errorMessage: "Invalid Account Number",
        });
        this.sendMailWithAttachment(
          finalResult,
          finalResult.attachments[0].fileName,
          finalResult.attachments[0].file,
          "Invalid account number",
          finalResult.forwardEmail,
          this.graphClient,
          receivedEmail
        );
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid Account Number",
        };
      }

      if (!interactionId) {
        await this.logWebhookEmailEvent({
          schemaName: mailProcessedResults.accountNumber,
          emailSubject: mailProcessedResults.subject,
          emailSender: mailProcessedResults.from,
          status: "FAILED",
          errorMessage: "Invalid Interaction ID",
        });
        this.sendMailWithAttachment(
          finalResult,
          finalResult.attachments[0].fileName,
          finalResult.attachments[0].file,
          "Invalid Interaction ID",
          finalResult.forwardEmail,
          this.graphClient,
          receivedEmail
        );
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid Interaction ID",
        };
      }

      const { accountNumber: validAccountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberByNumber(
          accountNumberById
        );

      if (!validAccountNumber) {
        await this.logWebhookEmailEvent({
          schemaName: mailProcessedResults.accountNumber,
          emailSubject: mailProcessedResults.subject,
          emailSender: mailProcessedResults.from,
          status: "FAILED",
          errorMessage: "Invalid Account ID",
        });
        this.sendMailWithAttachment(
          finalResult,
          finalResult.attachments[0].fileName,
          finalResult.attachments[0].file,
          "Invalid Account ID",
          finalResult.forwardEmail,
          this.graphClient,
          receivedEmail
        );
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid Account ID",
        };
      }

      const interaction = await this.fetchInteractionById(
        validAccountNumber,
        interactionId,
        finalResult.interactionId
      );
      if (!interaction) {
        await this.logWebhookEmailEvent({
          schemaName: mailProcessedResults.accountNumber,
          emailSubject: mailProcessedResults.subject,
          emailSender: mailProcessedResults.from,
          status: "FAILED",
          errorMessage: "Invalid Interaction ID",
        });
        this.sendMailWithAttachment(
          finalResult,
          finalResult.attachments[0].fileName,
          finalResult.attachments[0].file,
          "Invalid Interaction ID",
          finalResult.forwardEmail,
          this.graphClient,
          receivedEmail
        );
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid Interaction ID",
        };
      }

      const projectData = await this.validateProjectData(
        validAccountNumber,
        finalResult.interactionLevel,
        {
          projectId,
          projectName,
          projectCode,
        }
      );
      if (projectData !== null) {
        await this.logWebhookEmailEvent({
          schemaName: mailProcessedResults.accountNumber,
          emailSubject: mailProcessedResults.subject,
          emailSender: mailProcessedResults.from,
          status: "FAILED",
          errorMessage: projectData,
        });
        this.sendMailWithAttachment(
          finalResult,
          finalResult.attachments[0].fileName,
          finalResult.attachments[0].file,
          projectData,
          finalResult.forwardEmail,
          this.graphClient,
          receivedEmail
        );
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: projectData,
        };
      }

      const interactionItem = await this.fetchInteractionItemById(
        validAccountNumber,
        interaction.rid
      );

      const unmatchedSeqNums: string[] = [];
      const unmatchedQuestion: string[] = [];

      for (const answer of answers) {
        const questionSeqNum = answer?.questionSeqId || ""; // Adjust key if needed
        const question = answer?.question || "";

        const matchingItem = interactionItem.find(
          (item: any) =>
            item.question_seq_num?.toString() === questionSeqNum?.toString()
        );

        const matchingQuestion = interactionItem.find(
          (item: any) => item.question?.toString() === question?.toString()
        );

        if (matchingItem) {
          answer.rid = matchingItem.rid;
        } else {
          unmatchedSeqNums.push(questionSeqNum);
          this.logger.warn(
            `No matching interaction item found for question_seq_num: ${questionSeqNum}`
          );
        }

        if (matchingQuestion) {
          answer.rid = matchingQuestion.rid;
        } else {
          unmatchedQuestion.push(questionSeqNum);
          this.logger.warn(
            `No matching interaction item found for Question: ${questionSeqNum}`
          );
        }
      }

      if (unmatchedSeqNums.length > 0) {
        await this.logWebhookEmailEvent({
          schemaName: mailProcessedResults.accountNumber,
          emailSubject: mailProcessedResults.subject,
          emailSender: mailProcessedResults.from,
          status: "FAILED",
          errorMessage: "Invalid Question Number",
        });
        this.sendMailWithAttachment(
          finalResult,
          finalResult.attachments[0].fileName,
          finalResult.attachments[0].file,
          "Invalid Question Number",
          finalResult.forwardEmail,
          this.graphClient,
          receivedEmail
        );
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid Question Number",
        };
      }

      if (unmatchedQuestion.length > 0) {
        await this.logWebhookEmailEvent({
          schemaName: mailProcessedResults.accountNumber,
          emailSubject: mailProcessedResults.subject,
          emailSender: mailProcessedResults.from,
          status: "FAILED",
          errorMessage: "Invalid Question",
        });
        this.sendMailWithAttachment(
          finalResult,
          finalResult.attachments[0].fileName,
          finalResult.attachments[0].file,
          "Invalid Question",
          finalResult.forwardEmail,
          this.graphClient,
          receivedEmail
        );
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid Question",
        };
      }

      const responsSource: any = await this.fetchResponseSource();

      const updateResponeObj = {
        interaction_rid: interaction.rid,
        account_rid: interaction.account_rid,
        project_rid: interaction.project_rid || "",
        project_fiscal_rid: interaction.project_fiscal_rid || "",
        status_action: "RESPONSE_RECEIVED",
        response_source: "Email Reply",
        parent_interaction_rid: null,
        attachments: [],
        questions: answers,
        created_by: interaction.recipient_email || "",
        response_source_rid: responsSource[0]?.rid || "",
      };

      await this.interactionService.updateInteractionResponse(
        updateResponeObj,
        interaction.recipient_email || ""
      );

      await this.logWebhookEmailEvent({
        schemaName: mailProcessedResults.accountNumber,
        emailSubject: mailProcessedResults.subject,
        emailSender: mailProcessedResults.from,
        status: "SUCCESS",
      });

      this.processedMessageIds.delete(messageId);

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {},
      };
    } catch (err) {
      this.logger.error(
        `Error handling webhook: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`
      );
      throw this.throwServiceError(err as Error);
    }
  }

  async fetchCredentialsFromDb() {
    const mainDbSequelize =
      await this.interactionModelService.getMainSequelize();

    const platformSettings: any = await mainDbSequelize.query(
      rawQueries.fetchOrganizationSettings(),
      {
        type: "SELECT",
      }
    );

    const tenantId = platformSettings[0]?.tenant_id;
    const clientIdId = platformSettings[0]?.client_id;
    const clientSecret = platformSettings[0]?.client_secret;

    const decryptedSecret = await decryptClientSecret(clientSecret);

    const credential = new ClientSecretCredential(
      tenantId,
      clientIdId,
      decryptedSecret
    );

    return Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken(
            "https://graph.microsoft.com/.default"
          );
          return token.token;
        },
      },
    });
  }

  async fetchCredentialsBySubscriptionId(subscriptionId: string) {
    const mainDbSequelize =
      await this.interactionModelService.getMainSequelize();

    const accountData: any = await mainDbSequelize.query(
      rawQueries.fetchAccountBySubscriptionId(),
      {
        type: "SELECT",
        replacements: {
          subscriptionId,
        },
      }
    );

    const accountNumber = accountData[0]?.r_number;
    const accountId = accountData[0]?.rid;
    const schemaName = accountNumber
      ? `trd365_${accountNumber.replace(/\D/g, "")}`
      : null;

    if (!schemaName) {
      const platformSettings: any = await mainDbSequelize.query(
        rawQueries.fetchPlatformSettings(),
        {
          type: "SELECT",
        }
      );
      let accountEmail = platformSettings[0].email ?? null;

      return {
        email: accountEmail,
        tenant_id: null,
        client_id: null,
        client_secret: null,
        subscription_created: null,
      };
    }

    const orgDbSequelize = await this.interactionModelService.getSequelize();
    const accountDetails: any = await orgDbSequelize.query(
      rawQueries.fetchAccountDetailsById(schemaName),
      {
        type: "SELECT",
        replacements: {
          accountId,
        },
      }
    );
    let accountEmail = accountDetails[0].support_email ?? null;

    if (!accountEmail) {
      const platformSettings: any = await mainDbSequelize.query(
        rawQueries.fetchPlatformSettings(),
        {
          type: "SELECT",
        }
      );
      accountEmail = platformSettings[0].email ?? null;
    }

    return {
      email: accountEmail,
      tenant_id: accountDetails[0].tenant_id ?? null,
      client_id: accountDetails[0].client_id ?? null,
      client_secret: accountDetails[0].client_secret ?? null,
      subscription_created: accountDetails[0].subscription_created ?? null,
    };
  }

  async validateProjectData(
    accountNumber: string,
    interactionLevel: string,
    {
      projectId,
      projectName,
      projectCode,
    }: {
      projectId: string | null;
      projectName: string | null;
      projectCode: string | null;
    }
  ): Promise<string | null> {
    if (interactionLevel !== "Project") {
      return null;
    }

    if (!projectId || typeof projectId !== "string") {
      return "Invalid Project Id";
    }

    if (!projectCode || typeof projectCode !== "string") {
      return "Invalid Project Code";
    }

    try {
      const orgDbSequelize = await this.interactionModelService.getSequelize();

      const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;

      const [idResult] = await orgDbSequelize.query(
        `SELECT 1 FROM "${schemaName}".project_fiscal 
         WHERE r_number = :projectId 
         LIMIT 1;`,
        {
          type: "SELECT",
          replacements: { projectId },
        }
      );

      if (!idResult) {
        return "Invalid Project ID";
      }

      if (
        projectName &&
        typeof projectName === "string" &&
        projectName.trim() !== ""
      ) {
        const [nameResult] = await orgDbSequelize.query(
          `SELECT 1 FROM "${schemaName}".project_fiscal 
           WHERE project_name = :projectName 
           LIMIT 1;`,
          {
            type: "SELECT",
            replacements: { projectName },
          }
        );

        if (!nameResult) {
          return "Invalid Project Name";
        }
      }

      const [codeResult] = await orgDbSequelize.query(
        `SELECT 1 FROM "${schemaName}".project_fiscal 
         WHERE project_code = :projectCode 
         LIMIT 1;`,
        {
          type: "SELECT",
          replacements: { projectCode },
        }
      );

      if (!codeResult) {
        return "Invalid Project Code";
      }

      const [finalResult] = await orgDbSequelize.query(
        `SELECT 1 FROM "${schemaName}".project_fiscal 
         WHERE project_rid = :projectId 
            OR project_name = :projectName 
            OR project_code = :projectCode
         LIMIT 1;`,
        {
          type: "SELECT",
          replacements: {
            projectId,
            projectName,
            projectCode,
          },
        }
      );

      if (!finalResult) {
        return "Invalid Project Details";
      }
    } catch (err) {
      return `Database error: ${(err as Error).message || err}`;
    }

    return null;
  }

  async fetchInteractionById(
    accountNumber: string,
    interactionCode: string,
    interactionId: string
  ) {
    const { Interaction } = await this.interactionModelService.getModels(
      accountNumber
    );

    const interaction = await Interaction.findOne({
      where: {
        r_number: interactionCode,
        rid: interactionId,
      },
    });

    return interaction;
  }

  async fetchResponseSource() {
    const mainDbSequelize =
      await this.interactionModelService.getMainSequelize();

    const responseSource = await mainDbSequelize.query(
      rawQueries.fetchEmailResponseSourceRid(),
      { type: "SELECT" }
    );

    return responseSource;
  }

  async fetchInteractionItemById(accountNumber: string, interactionId: string) {
    const { InteractionItem } = await this.interactionModelService.getModels(
      accountNumber
    );

    const interaction = await InteractionItem.findAll({
      where: {
        interaction_rid: interactionId,
      },
    });

    return interaction;
  }

  private async processNotification(
    notification: any,
    email: string,
    graphClient: Client
  ): Promise<any | null> {
    const messageId = notification.resourceData?.id;
    if (!messageId) return null;

    const message = await graphClient
      .api(
        `/users/${email}/messages/${encodeURIComponent(
          messageId
        )}?$expand=attachments`
      )
      .expand("attachments")
      .get();

    const subject = message.subject;
    if (!subject.toLowerCase().includes("interaction invitation")) {
      this.logger.error("Subject is not related to interaction. Skipping.");
      return {
        success: false,
      };
    }

    const htmlBodyContent = message.body.content;

    const from = message.from?.emailAddress?.address;
    const attachments: any = message.attachments || [];
    let interactionIdFomBody: string = "";
    let FORWARD_EMAIL: string | null = null;
    let accountRNumber = "";
    let interactionLevel = "";

    const match = htmlBodyContent.match(
      /\(Interaction Ref Id:\s*((?:D001|U001|S001|P001)-[a-f0-9\-]+)\s*\)/i
    );
    if (match && match[1]) {
      interactionIdFomBody = match[1];
      const globalInteraction: any = await this.fetchGlobalInteractions(
        interactionIdFomBody
      );
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          globalInteraction[0].account_rid
        );

      accountRNumber = accountNumber;
      const keyContactsEmail = await this.fetchKeyContacts(
        accountNumber,
        globalInteraction[0].account_rid
      );
      FORWARD_EMAIL = keyContactsEmail;

      interactionLevel = await this.fetchInteractionLevel(
        accountNumber,
        interactionIdFomBody
      );
    } else {
      return {
        success: false,
      };
    }

    const processedAttachments = [];

    if (attachments.length === 0) {
      await this.sendMailWithAttachment(
        message,
        "",
        null,
        "Non-CSV attachment",
        FORWARD_EMAIL,
        graphClient,
        email
      );
      this.logWebhookEmailEvent({
        schemaName: accountRNumber,
        emailSubject: subject,
        emailSender: message.from.emailAddress.address,
        status: "MISSING_ATTACHMENT",
        errorMessage: "No PDF attachment found in the email.",
      });
      return {
        success: false,
      };
    }

    for (const att of attachments) {
      const result = await this.processAttachment(
        att,
        message,
        interactionLevel,
        FORWARD_EMAIL,
        graphClient,
        {
          accountNumber: accountRNumber,
          subject: subject,
          sender: message.from.emailAddress.address,
        },
        email
      );
      if (result) {
        processedAttachments.push(result);
      }
    }

    await graphClient
      .api(
        `/users/${encodeURIComponent(email)}/messages/${encodeURIComponent(
          messageId
        )}`
      )
      .update({ isRead: true });

    return {
      subject,
      from,
      attachments: processedAttachments,
      accountNumber: accountRNumber,
      forwardEmail: FORWARD_EMAIL,
      originlMessage: message,
      interactionId: interactionIdFomBody,
      interactionLevel,
      success: true,
    };
  }

  private async processAttachment(
    att: any,
    message: any,
    interactionLevel: string,
    forwardEmail: string | null,
    graphClient: Client,
    options: {
      accountNumber: string;
      subject: string;
      sender: string;
    },
    email: string
  ): Promise<any | null> {
    if (
      att["@odata.type"] !== "#microsoft.graph.fileAttachment" ||
      !att.contentBytes
    ) {
      return null;
    }

    const buffer = Buffer.from(att.contentBytes, "base64");
    let parsedData: string[][] | null = null;
    let shouldForward = false;
    let reason = "";

    const fileName = att.name?.toLowerCase() || "";
    const isCsv =
      att.contentType === "text/csv" ||
      att.name?.toLowerCase().endsWith(".csv");

    const isXlsx =
      att.contentType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileName.endsWith(".xlsx");

    if (isCsv) {
      try {
        const rows = await this.parseCsvBuffer(buffer);
        parsedData = rows;

        const validationResult = this.validateCSV(rows, interactionLevel);
        if(validationResult.answerValidation){
          const errorDetails = validationResult.errors?.join(", ");
          reason = `CSV validation failed - ${errorDetails}`;
          await this.sendMailWithAttachment(
            message,
            att.name,
            buffer,
            reason,
            forwardEmail,
            graphClient,
            email
          );
          this.logger.error(`Forwarding file "${att.name}" due to: ${reason}`);
        }

        if (validationResult.valid) {
          this.logger.info("Valid CSV:", att.name);
        } else {
          const errorDetails = validationResult.errors.join(", ");
          shouldForward = true;
          reason = `CSV validation failed - ${errorDetails}`;
          this.logWebhookEmailEvent({
            schemaName: options.accountNumber,
            emailSubject: options.subject,
            emailSender: options.sender,
            status: "INVALID_FORMAT",
            errorMessage: "CSV validation failed",
          });
        }
      } catch (err) {
        shouldForward = true;
        reason = `CSV parse error - ${(err as Error).message}`;
        this.logWebhookEmailEvent({
          schemaName: options.accountNumber,
          emailSubject: options.subject,
          emailSender: options.sender,
          status: "INVALID_FORMAT",
          errorMessage: reason,
        });
      }

      if (shouldForward) {
        await this.sendMailWithAttachment(
          message,
          att.name,
          buffer,
          reason,
          forwardEmail,
          graphClient,
          email
        );
        this.logger.error(`Forwarding file "${att.name}" due to: ${reason}`);
        return;
      }
    } else if (isXlsx) {
      try {
        const workbook: any = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0]; // Get first sheet

        const rows: string[][] = [];

        worksheet.eachRow((row: any) => {
          const rowValues = row.values
            .slice(1) // remove first index (ExcelJS uses 1-based indexes)
            .map((cell: any) => (cell?.toString?.() ?? "").trim());
          rows.push(rowValues);
        });

        parsedData = rows;

        const validationResult = this.validateCSV(rows, interactionLevel);

        if (validationResult.valid) {
          this.logger.info("Valid XLSX:", att.name);
        } else {
          shouldForward = true;
          const errorDetails = validationResult.errors.join("; ");
          reason = `CSV validation failed - ${errorDetails}`;
          this.logWebhookEmailEvent({
            schemaName: options.accountNumber,
            emailSubject: options.subject,
            emailSender: options.sender,
            status: "INVALID_FORMAT",
            errorMessage: reason,
          });
        }
      } catch (err) {
        shouldForward = true;
        reason = `XLSX parse error - ${(err as Error).message}`;
        this.logWebhookEmailEvent({
          schemaName: options.accountNumber,
          emailSubject: options.subject,
          emailSender: options.sender,
          status: "INVALID_FORMAT",
          errorMessage: reason,
        });
      }

      if (shouldForward) {
        await this.sendMailWithAttachment(
          message,
          att.name,
          buffer,
          reason,
          forwardEmail,
          graphClient,
          email
        );
        this.logger.error(`Forwarding file "${att.name}" due to: ${reason}`);
        return;
      }
    } else {
      // Non-CSV file
      await this.sendMailWithAttachment(
        message,
        att.name,
        buffer,
        "Non-CSV attachment",
        forwardEmail,
        graphClient,
        email
      );
      this.logger.warn(
        `Non-CSV file "${att.name}" received. Skipping or forward as needed.`
      );
      this.logWebhookEmailEvent({
        schemaName: options.accountNumber,
        emailSubject: options.subject,
        emailSender: options.sender,
        status: "MISSING_ATTACHMENT",
        errorMessage: `Non-CSV file "${att.name}" received`,
      });
      return;
    }

    return {
      name: att.name,
      contentBytes: att.contentBytes,
      file: buffer,
      fileName,
      parsedData,
    };
  }

  private async fetchGlobalInteractions(interactionId: string) {
    const mainDbSequelize =
      await this.interactionModelService.getMainSequelize();

    const interactions = await mainDbSequelize.query(
      rawQueries.fetchInteractionSummaryById(),
      {
        type: "SELECT",
        replacements: {
          interaction_rid: interactionId,
        },
      }
    );

    return interactions;
  }

  private async fetchKeyContacts(accountNumber: string, accountId: string) {
    const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;

    const orgDbSequelize = await this.interactionModelService.getSequelize();
    const mainDbSequelize =
      await this.interactionModelService.getMainSequelize();

    // Step 1: Fetch key contact details from organization-specific DB
    const keyContacts = await orgDbSequelize.query(
      rawQueries.fetchKeyContactsByEntityRid(schemaName),
      {
        replacements: { entity_rid: accountId },
        type: "SELECT",
      }
    );

    const roleIds = keyContacts
      .map((kc: any) => kc.key_contact_role)
      .filter(Boolean);

    if (roleIds.length === 0) {
      return null;
    }

    // Step 2: Fetch role names from main DB
    const roles = await mainDbSequelize.query(rawQueries.fetchRolesByIds(), {
      replacements: { roleIds },
      type: "SELECT",
    });

    // Step 3: Find the rid of "Professional Services Consultant"
    const targetRole: any = roles.find(
      (role: any) => role.role_name === "Professional Services Consultant"
    );

    if (!targetRole) {
      return null;
    }

    // Step 4: Find the email of the person with the matching key_contact_role
    const targetContact: any = keyContacts.find(
      (kc: any) => kc.key_contact_role === targetRole.rid
    );

    return targetContact?.key_contact_email || null;
  }

  private async fetchInteractionLevel(
    accountNumber: string,
    interactionId: string
  ) {
    const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;

    const orgDbSequelize = await this.interactionModelService.getSequelize();
    const mainDbSequelize =
      await this.interactionModelService.getMainSequelize();

    const interactionDetails: any = await orgDbSequelize.query(
      rawQueries.fetchInteractionDetailsById(schemaName, interactionId),
      {
        type: "SELECT",
      }
    );

    if (interactionDetails && interactionDetails.length > 0) {
      const interactionLevelId =
        interactionDetails[0]?.interaction_level_rid ?? null;
      const result: any = await mainDbSequelize.query(
        rawQueries.fetchInteractionLevel([interactionLevelId]),
        {
          type: "SELECT",
        }
      );

      if (result && result.length > 0) {
        return result[0]?.interaction_level_name ?? null;
      }
    }
    return null;
  }

  private parseCsvBuffer(buffer: Buffer): Promise<string[][]> {
    return new Promise((resolve, reject) => {
      const rows: string[][] = [];

      Readable.from(buffer)
        .pipe(csv({ headers: false }))
        .on("data", (data) => {
          rows.push(Object.values(data));
        })
        .on("end", () => resolve(rows))
        .on("error", (err) => reject(err));
    });
  }

  private validateCSV(
    array: string[][],
    interactionLevel: string
  ): { valid: true, answerValidation?: boolean, errors?: string[] } | { valid: false; errors: string[], answerValidation?: boolean } {
    const errors: string[] = [];

    if (!Array.isArray(array) || array.length < 6) {
      return {
        valid: false,
        errors: ["CSV has too few rows or is not an array."],
      };
    }

    // Header Checks (Rows 0 to 4)
    if (array[0]?.[0] !== "Account ID" || !array[0]?.[1]) {
      errors.push("Missing or invalid 'Account ID' in row 1.");
    }
    if (array[1]?.[0] !== "Interaction ID" || !array[1]?.[1]) {
      errors.push("Missing or invalid 'Interaction ID' in row 2.");
    }
    if (
      (array[2]?.[0] !== "Project ID" || !array[2]?.[1]) &&
      interactionLevel === "Project"
    ) {
      errors.push("Missing or invalid 'Project ID' in row 3.");
    }

    if (
      (array[4]?.[0] !== "Project Code" || !array[4]?.[1]) &&
      interactionLevel === "Project"
    ) {
      errors.push("Missing or invalid 'Project Code' in row 5.");
    }

    // Column Headers at index 5
    const expectedHeaders = [
      "Question No",
      "Questions",
      "Answers",
      "Notes",
      "Is Mandatory",
    ];
    const tableHeader = array[5] || [];

    expectedHeaders.forEach((expected, index) => {
      if (tableHeader[index] !== expected) {
        errors.push(
          `Expected column "${expected}" at position ${
            index + 1
          } in header row (row 6).`
        );
      }
    });

    // Data rows validation
    const dataRows = array.slice(6);
    const totalRows = dataRows.length;

    let answeredRowsCount = 0;
    let mandatoryQuestionsCount = 0;
    let answerValidation = false;

    for (let i = 0; i < totalRows; i++) {
      const row = dataRows[i];
      if (!row) continue;

      const questionId = row[0];
      const question = row[1];
      const answer = row[2]?.trim();
      const notes = row[3];
      const isMandatory = row[4]?.trim().toLowerCase();

      const rowErrors: string[] = [];

      // Count answered rows
      const hasAnswer = !!answer;
      if (hasAnswer) answeredRowsCount++;

      if (isMandatory === "yes") mandatoryQuestionsCount++;

      // Special case: only one row
      if (totalRows === 1 && isMandatory === "yes" && !hasAnswer) {
        rowErrors.push(
          "Answer is required because the question is mandatory"
        );
      }

      if (isMandatory === "yes" && !answer?.trim()) {
        answerValidation = true;
        rowErrors.push("Answer is required because the question is mandatory");
      }

      // Skip empty-answer rows (in multiple row case)
      // if (totalRows > 1 && !hasAnswer) continue;

      // For answered rows, validate required fields
      if (!questionId) rowErrors.push("Question No");
      if (!question) rowErrors.push("Questions");
      if (!isMandatory) rowErrors.push("Is Mandatory");

      if (rowErrors.length > 0) {
        errors.push(`Row ${i + 7} is missing: ${rowErrors.join(", ")}`);
      }
    }

    if (answeredRowsCount === 0 && mandatoryQuestionsCount > 0) {
      errors.push(
        "No answers provided. At least one answered row is required."
      );
    }

    if (errors.length > 0) {
      return { valid: answerValidation ? true : false, errors, answerValidation };
    }

    return { valid: true, answerValidation: false };
  }

  private async sendMailWithAttachment(
    originalMessage: any,
    filename: string,
    buffer: Buffer | null,
    reason: string,
    forwardEmail: string | null,
    graphClient: Client,
    senderEmail: string
  ): Promise<void> {
    try {
      const forwardTo = forwardEmail;

      if (!senderEmail) {
        throw new Error("Missing SENDER_EMAIL or FORWARD_TO in env variables.");
      }

      if (forwardEmail) {
        const message = {
          subject: `Forwarded: ${filename} (${reason})`,
          body: {
            contentType: "Text",
            content: `Reason for forwarding: ${reason}\n\nOriginal subject: ${
              originalMessage.subject || "(no subject)"
            }`,
          },
          toRecipients: [
            {
              emailAddress: {
                address: forwardTo,
              },
            },
          ],
          attachments:
            buffer && buffer.length > 0
              ? [
                  {
                    "@odata.type": "#microsoft.graph.fileAttachment",
                    name: filename,
                    contentBytes: buffer.toString("base64"),
                  },
                ]
              : [],
        };

        await graphClient
          .api(`/users/${encodeURIComponent(senderEmail)}/sendMail`)
          .post({
            message,
            saveToSentItems: true,
          });

        this.logger.info(`Forwarded "${filename}" due to: ${reason}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : JSON.stringify(err);
      this.logger.error(`sendMailWithAttachment error: ${errorMessage}`);
    }
  }

  private createGraphClient(
    tenantId: string,
    clientId: string,
    clientSecret: string
  ): Client {
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    );
    return Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken(
            "https://graph.microsoft.com/.default"
          );
          return token.token;
        },
      },
    });
  }

  async logWebhookEmailEvent({
    schemaName,
    emailSubject,
    emailSender,
    attachmentName = null,
    extractedAnswers = null,
    status,
    errorMessage = null,
    uploadedTime = new Date(),
  }: {
    schemaName: string;
    emailSubject: string;
    emailSender: string;
    attachmentName?: string | null;
    extractedAnswers?: string | null;
    status: WebhookEmailLogAttributes["status"];
    errorMessage?: string | null;
    uploadedTime?: Date;
  }) {
    try {
      const { WebhookEmailLog } = await this.interactionModelService.getModels(
        schemaName
      );

      await WebhookEmailLog.create({
        created_by: "SYSTEM",
        created_datetime: new Date(),

        email_subject: emailSubject,
        email_sender: emailSender,
        attachment_name: attachmentName,
        extracted_answers: extractedAnswers,
        uploaded_time: uploadedTime,

        status,
        error_message: errorMessage,
      });
    } catch (err) {
      console.error("Failed to log webhook email event:", err);
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
