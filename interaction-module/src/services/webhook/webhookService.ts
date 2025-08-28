import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import csv from "csv-parser";
import ExcelJS from "exceljs";
import { HttpStatus, MAIN_SCHEMA_NAME } from "../../utils/constants";
import { Readable } from "stream";
import { InteractionModelService } from "../interactionModelsService";
import InteractionSchemaService from "../interactions/schemaService";
import { InteractionService } from "../interactions/interactionService";
import { Logger } from "winston";
import { isLeafType } from "graphql";

export class WebHookService {
  private graphClient: Client;
  private interactionModelService: InteractionModelService;
  private interactionSchemaService: InteractionSchemaService;
  private interactionService: InteractionService;
  private processedMessageIds = new Set();

  constructor(logger: Logger) {
    const credential = new ClientSecretCredential(
      process.env.TENANT_ID!,
      process.env.CLIENT_ID!,
      process.env.CLIENT_SECRET!
    );

    this.interactionModelService = new InteractionModelService();
    this.interactionSchemaService = new InteractionSchemaService();
    this.interactionService = new InteractionService(logger);

    this.graphClient = Client.initWithMiddleware({
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

  async webhookHanlder(data: any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }> {
    try {
      const notifications = data.value;
      const results = [];

      for (const notification of notifications) {
        const messageId = notification.resourceData?.id;

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
        const result = await this.processNotification(notification);

        if(!result.success){
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.BAD_REQUEST_MESSAGE,
            errorMessage: "Invalid notification",
          };
        }

        if(result.attachments && result.attachments.length == 0){
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.BAD_REQUEST_MESSAGE,
            errorMessage: "Attachemnts Not found",
          };
        }
        if (result) {
          results.push(result);
        }
      }

      if(!results[0].attachments && results[0].attachments.length === 0 && results[0].attachments[0].parsedData){
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid attachments",
        }
      }

      const parsedData = results[0].attachments[0].parsedData;
      let interactionId: string | null = null;
      let accountNumber: string | null = null;
      
      const answers: {
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

      if (!accountNumber) {
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid Account Number",
        };
      }

      if (!interactionId) {
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid Interaction ID",
        };
      }

      const { accountNumber: validAccountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberByNumber(
          accountNumber
        );

      const interaction = await this.fetchInteractionById(
        validAccountNumber,
        interactionId
      );
      if (!interaction) {
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid Interaction ID",
        };
      }

      const interactionItem = await this.fetchInteractionItemById(validAccountNumber, interaction.rid);

      for (const answer of answers) {
        const questionSeqNum = answer?.questionSeqId || ""; // Adjust key if needed
      
        const matchingItem = interactionItem.find(
          (item: any) => item.question_seq_num?.toString() === questionSeqNum?.toString()
        );
      
        if (matchingItem) {
          answer.rid = matchingItem.rid;
        } else {
          console.warn(`No matching interaction item found for question_seq_num: ${questionSeqNum}`);
        }
      }

      const updateResponeObj = {
        interaction_rid: interaction.rid,
        account_rid: interaction.account_rid,
        project_rid: interaction.project_rid,
        project_fiscal_rid: interaction.project_fiscal_rid,
        status_action: "RESPONSE_RECEIVED",
        response_source: "Email Reply",
        parent_interaction_rid: null,
        attachments: [],
        questions: answers,
        created_by: interaction.recipient_email || "",
      };

      await this.interactionService.updateInteractionResponse(
        updateResponeObj,
        interaction.recipient_email || ""
      );

      console.log("Finished response", updateResponeObj);

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {},
      };
    } catch (err) {
      console.log("Error handling webhook", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async fetchInteractionById(accountNumber: string, interactionId: string) {
    const { Interaction } = await this.interactionModelService.getModels(
      accountNumber
    );

    const interaction = await Interaction.findOne({
      where: {
        r_number: interactionId,
      },
    });

    return interaction;
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

  async storeInteractions(results: any) {
    const { InteractionItem } = await this.interactionModelService.getModels(
      ""
    );

    await InteractionItem.update(
      {},
      {
        where: {
          rid: "",
        },
      }
    );
  }

  async createSubscription() {
    try {
      const expiration = new Date();
      expiration.setMinutes(expiration.getMinutes() + 4230);

      const response = await this.graphClient.api("/subscriptions").post({
        changeType: "created",
        notificationUrl: process.env.NOTIFICATION_URL,
        resource: `users/${process.env.MONITORED_EMAIL}/mailFolders('Inbox')/messages`,
        expirationDateTime: expiration.toISOString(),
        clientState:
          process.env.CLIENT_STATE || "custom_secret_validation_string",
      });

      if (response && response.id) {
        console.log("Subscription created:", response.id);
      }
    } catch (err) {
      console.error("Failed to create subscription:", err);
    }
  }

  async renewSubscriptions() {
    try {
      const subscriptions = await this.graphClient.api("/subscriptions").get();

      for (const sub of subscriptions.value) {
        if (sub.resource.includes(process.env.MONITORED_EMAIL)) {
          const expiration = new Date();
          expiration.setMinutes(expiration.getMinutes() + 4230);

          await this.graphClient.api(`/subscriptions/${sub.id}`).patch({
            expirationDateTime: expiration.toISOString(),
          });

          console.log(
            `Renewed subscription ${sub.id} to ${expiration.toISOString()}`
          );
        }
      }
    } catch (err) {
      console.error("Error renewing subscriptions:", err);
    }
  }

  private async processNotification(notification: any): Promise<any | null> {
    const messageId = notification.resourceData?.id;
    if (!messageId) return null;

    console.log("Inside api receieved", messageId);

    const email = "support@yourdomain.com";

    const accesss_token =
      "";

    // const url = `/users/${email}/messages/${encodeURIComponent(
    //   messageId
    // )}?$expand=attachments`;
    // const message = await this.graphClient.api(url).get();

    const url = `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(
      messageId
    )}?$expand=attachments`;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accesss_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Failed to fetch message: ${resp.status} ${txt}`);
    }

    const message = await resp.json();

    console.log("Received message", message);

    const subject = message.subject;
    if (!subject.toLowerCase().includes("interaction")) {
      console.log("Subject is not related to interaction. Skipping.");
      return {
        success: false
      };
    }

    const from = message.from?.emailAddress?.address;
    const attachments: any = message.attachments || [];
    let interactionIdFomSubject: string = "";
    let FORWARD_EMAIL: string | null = null;

    const match = subject.match(/INT-\d{10}/);
    if (match) {
      interactionIdFomSubject = match[0];
      const globalInteraction: any = await this.fetchGlobalnteractions(
        interactionIdFomSubject
      );
      console.log(globalInteraction);
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          globalInteraction[1].account_rid
        );
      const keyContactsEmail = await this.fetchKeyContacts(
        accountNumber,
        globalInteraction[1].account_rid
      );
      FORWARD_EMAIL = keyContactsEmail;
    }else{
      return {
        success: false
      };
    }

    const processedAttachments = [];

    if(attachments.length === 0){
      await this.sendMailWithAttachment(
        message,
        "",
        null,
        "Non-CSV attachment",
        FORWARD_EMAIL,
        accesss_token
      );
    }

    for (const att of attachments) {
      const result = await this.processAttachment(
        att,
        message,
        FORWARD_EMAIL,
        accesss_token
      );
      if (result) {
        processedAttachments.push(result);
      }
    }

    // await this.graphClient
    //   .api(`/users/${email}/messages/${messageId}`)
    //   .update({ isRead: true });

    const markAsRead = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(
        messageId
      )}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accesss_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isRead: true }),
      }
    );

    if (markAsRead.ok) {
      console.log("Email marked as Read");
    }

    return {
      subject,
      from,
      attachments: processedAttachments,
      success: true
    };
  }

  private async processAttachment(
    att: any,
    message: any,
    forwardEmail: string | null,
    token: string
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

        if (this.validateCSV(rows)) {
          console.log("✅ Valid CSV:", att.name);
        } else {
          shouldForward = true;
          reason = "CSV validation failed";
        }
      } catch (err) {
        shouldForward = true;
        reason = `CSV parse error: ${(err as Error).message}`;
      }

      if (shouldForward) {
        await this.sendMailWithAttachment(
          message,
          att.name,
          buffer,
          reason,
          forwardEmail,
          token
        );
        console.warn(`❗ Forwarding file "${att.name}" due to: ${reason}`);
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

        if (this.validateCSV(rows)) {
          console.log("✅ Valid XLSX:", att.name);
        } else {
          shouldForward = true;
          reason = "XLSX validation failed";
        }
      } catch (err) {
        shouldForward = true;
        reason = `XLSX parse error: ${(err as Error).message}`;
      }
    } else {
      // Non-CSV file
      await this.sendMailWithAttachment(
        message,
        att.name,
        buffer,
        "Non-CSV attachment",
        forwardEmail,
        token
      );
      console.warn(
        `📎 Non-CSV file "${att.name}" received. Skipping or forward as needed.`
      );
    }

    return {
      name: att.name,
      contentBytes: att.contentBytes,
      parsedData,
    };
  }

  private async fetchGlobalnteractions(interactionId: string) {
    const mainDbSequelize =
      await this.interactionModelService.getMainSequelize();

    const interactions = await mainDbSequelize.query(
      `SELECT rid, r_number, account_rid FROM ${MAIN_SCHEMA_NAME}.interactions_summary WHERE r_number = :r_number`,
      {
        type: "SELECT",
        replacements: {
          r_number: interactionId,
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
      `SELECT rid, key_contact_role, key_contact_email FROM "${schemaName}".key_contact_details WHERE entity_rid = :entity_rid`,
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
    const roles = await mainDbSequelize.query(
      `SELECT rid, role_name FROM "${MAIN_SCHEMA_NAME}".key_contact_role WHERE rid IN (:roleIds)`,
      {
        replacements: { roleIds },
        type: "SELECT",
      }
    );

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

  private validateCSV(array: string[][]): boolean {
    if (!Array.isArray(array) || array.length < 5) return false;

    // Check header rows
    const headerChecks =
      array?.[0]?.[0] === "Account ID" &&
      !!array?.[0]?.[1] &&
      array?.[1]?.[0] === "Interaction ID" &&
      !!array?.[1]?.[1] &&
      array?.[2]?.[0] === "Project ID" &&
      !!array?.[2]?.[1] &&
      array?.[3]?.[0] === "Project Name";

    if (!headerChecks) return false;

    // Validate the column headers at index 4
    const tableHeader = array[4];
    if (
      tableHeader?.[0] !== "Question No" ||
      tableHeader?.[1] !== "Questions" ||
      tableHeader?.[2] !== "Answers" ||
      tableHeader?.[3] !== "Notes" ||
      tableHeader?.[4] !== "Is Mandatory"
    ) {
      return false;
    }

    // Validate the data rows
    for (let i = 5; i < array.length; i++) {
      const row = array[i];
      const question = row?.[0];
      const answer = row?.[1];
      const isMandatory = row?.[3]?.trim().toLowerCase();

      // If row is empty, skip
      if (!question && !answer && !isMandatory) continue;

      // If Is Mandatory is 'yes', answer must not be empty
      if (isMandatory === "yes" && !answer?.trim()) {
        return false;
      }
    }

    return true;
  }

  private async sendMailWithAttachment(
    originalMessage: any,
    filename: string,
    buffer: Buffer | null,
    reason: string,
    forwardEmail: string | null,
    token: string
  ): Promise<void> {
    try {
      const senderEmail = "yogesh.sundaramoorthy@certainti.ai";
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

        // await this.graphClient
        //   .api(`/users/${encodeURIComponent(senderEmail)}/sendMail`)
        //   .post({
        //     message,
        //     saveToSentItems: true,
        //   });

        const resp = await fetch(
          "https://graph.microsoft.com/v1.0/me/sendMail",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message, saveToSentItems: true }),
          }
        );

        console.log(`✅ Forwarded "${filename}" due to: ${reason}`);
      }
      console.log("Inside send email forward");
    } catch (err) {
      console.error("❌ sendMailWithAttachment error:", err);
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
