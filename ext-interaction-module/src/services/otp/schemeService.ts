import { Interaction } from "../../models/interaction";
import {
  HttpStatus,
  MAIN_SCHEMA_NAME,
  OTP_EXPIRY_MINUTES,
} from "../../utils/constants";
import { logMessage } from "../../utils/helpers";
import { IGenerateOtp, IOtpHistoryStatus } from "../../utils/types";
import { InteractionModelService } from "../interactionModelsService";

export class OtpSchemaService {
  private interactionModelService: InteractionModelService;

  constructor() {
    this.interactionModelService = new InteractionModelService();
  }

  async fetchValidAccountNumberById(accountId: string) {
    try {
      if (!this.interactionModelService.mainDbSequelize) {
        this.interactionModelService.mainDbSequelize =
          await this.interactionModelService.getMainSequelize();
      }

      const [account]: any[] =
        await this.interactionModelService.mainDbSequelize.query(
          `SELECT * FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = :rid`,
          {
            replacements: { rid: accountId },
            type: "SELECT",
          }
        );

      let accountRnumber = account?.r_number;

      if (account?.storage_type === "store_in_parent") {
        const [accountData]: any[] =
          await this.interactionModelService.mainDbSequelize.query(
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

  async storeOtp(
    accountNumber: string,
    data: IGenerateOtp,
    otpHash: string,
    email: string
  ) {
    const { Otp } = await this.interactionModelService.getModels(accountNumber);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.create({
      otp: otpHash,
      email: email,
      account_rid: data.account_rid,
      interaction_rid: data.interaction_rid,
      is_verified: false,
      expires_at: expiresAt,
      created_by: email,
      created_datetime: now,
      otp_attempt_count: 0,
    });
  }

  async storeOtpHistory({
    accountNumber,
    email,
    account_rid,
    interaction_rid,
    otp,
    status,
    attempt_number,
    error_message = null,
  }: {
    accountNumber: string;
    email: string;
    account_rid: string;
    interaction_rid: string;
    otp: string;
    status: IOtpHistoryStatus;
    attempt_number: number;
    error_message?: string | null;
  }) {
    const { OtpHistory } = await this.interactionModelService.getModels(
      accountNumber
    );
    try {
      await OtpHistory.create({
        created_by: email,
        created_datetime: new Date(),
        email,
        account_rid,
        interaction_rid,
        otp,
        status,
        attempt_number,
        error_message,
      });
    } catch (err) {
     logMessage(`[OTP HISTORY] Failed to log OTP attempt: ${err}`);
    }
  }

  async getLatestOtpEntry(
    accountNumber: string,
    accountId: string,
    interactionId: string,
    email: string
  ) {
    const { Otp } = await this.interactionModelService.getModels(accountNumber);

    return await Otp.findOne({
      where: {
        account_rid: accountId,
        interaction_rid: interactionId,
        email: email,
      },
      order: [["created_datetime", "DESC"]],
    });
  }

  async getOtpMeta(
    accountNumber: string,
    accountId: string,
    interactionId: string,
    email: string
  ): Promise<{
    otp_attempt_count: number;
    otp_block_until: Date | null;
  } | null> {
    const { Otp } = await this.interactionModelService.getModels(accountNumber);

    const otpEntry = await Otp.findOne({
      where: { account_rid: accountId, interaction_rid: interactionId, email },
      attributes: ["otp_attempt_count", "otp_block_until"],
    });

    if (!otpEntry) {
      return null;
    }

    return {
      otp_attempt_count: otpEntry.getDataValue("otp_attempt_count") || 0,
      otp_block_until: otpEntry.getDataValue("otp_block_until") || null,
    };
  }

  async updateOtpMeta(
    accountNumber: string,
    accountId: string,
    interactionId: string,
    email: string,
    data: {
      otp_attempt_count: number;
      otp_block_until?: Date | null;
    }
  ): Promise<void> {
    const { Otp } = await this.interactionModelService.getModels(accountNumber);

    const updatePayload: any = {
      otp_attempt_count: data.otp_attempt_count,
      otp_block_until: data.otp_block_until ?? null,
      modified_datetime: new Date(),
      modified_by: "SYSTEM",
    };

    const [affectedRows] = await Otp.update(updatePayload, {
      where: { account_rid: accountId, interaction_rid: interactionId, email },
    });

    if (affectedRows === 0) {
      logMessage(
        `[OTP] No OTP entry found for update (account_rid: ${accountId})`
      );
    }
  }

  async resendOtpAttempts(
    accountNumber: string,
    accountId: string,
    interactionId: string,
    email: string,
    data: {
      otp_attempt_count: number;
    }
  ){
    const { Otp } = await this.interactionModelService.getModels(accountNumber);

    const updatePayload: any = {
      otp_attempt_count: data.otp_attempt_count,
      modified_datetime: new Date(),
      modified_by: "SYSTEM",
    };

    const [affectedRows] = await Otp.update(updatePayload, {
      where: { account_rid: accountId, interaction_rid: interactionId, email },
    });

    if (affectedRows === 0) {
      logMessage(
        `[OTP] No OTP entry found for update (account_rid: ${accountId})`
      );
    }
  }

  async countOtpAttempts(
    accountNumber: string,
    accountId: string,
    interactionId: string,
    email: string
  ): Promise<number> {
    const { OtpHistory } = await this.interactionModelService.getModels(
      accountNumber
    );

    const failedAttempts = await OtpHistory.count({
      where: {
        account_rid: accountId,
        interaction_rid: interactionId,
        email: email,
        status: "VERIFICATION_FAILED",
      },
    });

    return failedAttempts;
  }

  async clearVerifiedOtp(accountNumber: string, otpId: string) {
    const { Otp } = await this.interactionModelService.getModels(accountNumber);

    await Otp.destroy({ where: { rid: otpId } });
  }

  async clearPreviousOtp(
    accountNumber: string,
    data: IGenerateOtp,
    email: string
  ) {
    const { Otp } = await this.interactionModelService.getModels(accountNumber);

    await Otp.destroy({
      where: {
        account_rid: data.account_rid,
        interaction_rid: data.interaction_rid,
        email,
        is_verified: false,
      },
    });
  }

  async removeOtp(
    accountNumber: string,
    account_rid: string,
    interaction_rid: string
  ) {
    const { Otp } = await this.interactionModelService.getModels(accountNumber);

    await Otp.destroy({
      where: {
        account_rid,
        interaction_rid,
      },
    });
  }

  async countOtpResendAttempts(
    accountNumber: string,
    accountId: string,
    interactionId: string,
    email: string
  ): Promise<number> {
    const { OtpHistory } = await this.interactionModelService.getModels(
      accountNumber
    );

    return await OtpHistory.count({
      where: {
        account_rid: accountId,
        interaction_rid: interactionId,
        email,
        status: "SENT",
      },
    });
  }

  async validateInputs({
    account_rid,
    interaction_rid,
  }: {
    account_rid: string;
    interaction_rid: string;
  }): Promise<
    | {
        success: true;
        accountNumber: string;
        email: string;
      }
    | {
        success: false;
        statusCode: number;
        statusMessage: string;
        errorMessage: string;
      }
  > {
    try {
      const { accountNumber } = await this.fetchValidAccountNumberById(
        account_rid
      );

      if (!accountNumber) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          statusMessage: "Invalid account ID",
          errorMessage: "Invalid account ID",
        };
      }

      const interactionData = await this.validateInteractionById(
        accountNumber,
        account_rid,
        interaction_rid
      );

      if (!interactionData) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          statusMessage: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid interaction ID: Interaction doesn't exist",
        };
      }

      return {
        success: true,
        accountNumber,
        email: interactionData?.dataValues?.recipient_email ?? "",
      };
    } catch (err) {
      return {
        success: false,
        statusCode: HttpStatus.FAILED,
        statusMessage: HttpStatus.FAILED_MESSAGE,
        errorMessage: (err as Error).message || "Unknown error",
      };
    }
  }

  async validateInteractionById(
    accountNumber: string,
    accountId: string,
    interactionId: string
  ): Promise<Interaction | null> {
    const { Interaction } = await this.interactionModelService.getModels(
      accountNumber
    );

    const existingInteraction = await Interaction.findOne({
      where: {
        account_rid: accountId,
        rid: interactionId,
      },
    });

    return existingInteraction;
  }

  async validatePointOfContact(
    accountNumber: string,
    projectFiscalId: string,
    email: string
  ): Promise<boolean> {
    const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
    const sequelize = await this.interactionModelService.getSequelize();

    const contactQuery = `
      SELECT * 
      FROM ${schemaName}.key_contact_details
      WHERE entity_rid = :projectFiscalId 
        AND is_primary_contact = :is_primary_contact
        AND key_contact_email = :email
    `;

    const contactResults: any = await sequelize.query(contactQuery, {
      type: "SELECT",
      replacements: {
        projectFiscalId,
        is_primary_contact: true,
        email,
      },
    });

    if (!contactResults || contactResults.length === 0) {
      return false;
    }

    const keyContact = contactResults[0];

    const mainDbSequelize =
      await this.interactionModelService.getMainSequelize();

    const roleResults: any = await mainDbSequelize.query(
      `
        SELECT * 
        FROM ${MAIN_SCHEMA_NAME}.key_contact_role 
        WHERE rid = :rid
      `,
      {
        type: "SELECT",
        replacements: {
          rid: keyContact.key_contact_role,
        },
      }
    );

    if (!roleResults || roleResults.length === 0) {
      return false;
    }

    const role = roleResults[0];

    return role.role_name === "Client Project Point of Contact";
  }
}
