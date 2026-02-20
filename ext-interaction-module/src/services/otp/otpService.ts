import { Logger } from "winston";
import moment from "moment-timezone";
import { HttpStatus, MAX_RESEND_ATTEMPTS, STATUS_MESSAGE } from "../../utils/constants";
import { IEmailMessage, IGenerateOtp, IVerifyOtp } from "../../utils/types";
import { OtpSchemaService } from "./schemeService";
import {
  compareOtp,
  generateCustomJwtToken,
  generateRandomOtpDigit,
  hashOtp,
} from "../../utils/otpGenerator";
import { otpMailTemplate } from "../../utils/mailTemplate";
import { sendEmail } from "../emailService";
import { logMessage } from "../../utils/helpers";

export class OtpService {
  private logger: Logger;
  otpSchema: OtpSchemaService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.otpSchema = new OtpSchemaService();
  }

  /**
   * Generates a One-Time Password (OTP) for the given interaction and account.
   *
   * This function performs several steps to generate and send an OTP:
   * 1. Validates the input data for required fields.
   * 2. Checks if the user is temporarily blocked from receiving OTPs.
   * 3. Generates a random OTP and hashes it.
   * 4. Stores the hashed OTP in the database.
   * 5. Sends the OTP to the user's email (only once).
   * 6. Tracks OTP send attempt history and handles failure scenarios.
   * 7. Resets OTP attempt counters on successful send.
   *
   * @param {IGenerateOtp} data - The input data containing account and interaction identifiers.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   statusMessage: string;
   *   errorMessage?: string;
   * }>} - A promise resolving with the operation status including success or detailed error messages.
   *
   * @throws {Error} - Throws an error if any internal process fails during OTP generation or sending.
   */
  async generateOtp(data: IGenerateOtp): Promise<{
    statusCode: number;
    statusMessage: string;
    errorMessage?: string;
  }> {
    try {
      const { account_rid, interaction_rid } = data;

      // 1. Validate inputs
      const validationResult = await this.otpSchema.validateInputs({
        account_rid,
        interaction_rid,
      });

      if (!validationResult.success) {
        return validationResult;
      }

      const { accountNumber, email } = validationResult;

      // 2. Check if user is blocked
      const otpMeta = await this.otpSchema.getOtpMeta(
        accountNumber,
        account_rid,
        interaction_rid,
        email
      );
      const now = new Date();

      if (
        otpMeta != null &&
        otpMeta?.otp_block_until &&
        new Date(otpMeta.otp_block_until) > now
      ) {
        await this.otpSchema.resendOtpAttempts(
          accountNumber,
          account_rid,
          interaction_rid,
          email,
          {
            otp_attempt_count: 0,
          }
        );
        return {
          statusCode: HttpStatus.FORBIDDEN,
          statusMessage: "OTP generation blocked temporarily",
          errorMessage: "Please try again after one hour.",
        };
      }

      // 3. Generate and hash OTP
      const randomOtpDigit = generateRandomOtpDigit();
      const otpHash = await hashOtp(randomOtpDigit);

      // 4. Store OTP in DB
      await this.otpSchema.storeOtp(accountNumber, data, otpHash, email);

      // 5. Send OTP email (only once)
      const safeOtpMeta = otpMeta ?? { otp_attempt_count: 0 };
      let emailContents = await this.otpSchema.getTemplateDetailsByCategory("interaction otp");
      let  mailContent = {
          message: {
          subject :  emailContents.subject,
          body: {
              contentType: "HTML",
              content:this.replacePlaceholders(emailContents.body_html,randomOtpDigit,process.env.SUPPORT_EMAIL!
              ),
            },
        toRecipients: [
              {
                emailAddress: {address: email,},
              },
            ],
         
        },
        }
     // const mailContent = otpMailTemplate(randomOtpDigit, email);
      const sent = await this.sendOtpOnceAndTrackFailure(
        accountNumber,
        email,
        mailContent,
        account_rid,
        safeOtpMeta,
        interaction_rid
      );

      // 6. Update attempt history
      if (!sent.success) {
        const attempt_number = (otpMeta?.otp_attempt_count || 0) + 1;

        await this.otpSchema.storeOtpHistory({
          accountNumber,
          email,
          account_rid,
          interaction_rid,
          otp: otpHash,
          status: "SEND_FAILED",
          attempt_number,
        });

        return {
          statusCode: HttpStatus.BAD_REQUEST,
          statusMessage: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: STATUS_MESSAGE.otpFailedToSend,
        };
      }

      // 7. Reset attempt count on success
      await this.otpSchema.updateOtpMeta(
        accountNumber,
        account_rid,
        interaction_rid,
        email,
        {
          otp_attempt_count: 0,
          otp_block_until: null,
        }
      );

      await this.otpSchema.storeOtpHistory({
        accountNumber,
        email,
        account_rid,
        interaction_rid,
        otp: otpHash,
        status: "SENT",
        attempt_number: 1,
      });

      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: HttpStatus.SUCCESS_MESSAGE,
      };
    } catch (err) {
      logMessage(`Error generating OTP: ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

    replacePlaceholders(
      template: string,
      otp: string,
      supportEmail: string
    ): string {
      return template.replace(/{{(.*?)}}/g, (_: string, key: string) => {
        const normalized = key.trim().toLowerCase().replace(/\s+/g, "");
        if (normalized === "otp") return otp;
        if (normalized === "supportemail") return supportEmail;
        return "";
      });
    }

  /**
   * Verifies the provided OTP for a given account and interaction.
   *
   * This function performs the following steps:
   * 1. Validates the input data.
   * 2. Retrieves the latest OTP entry for the account and interaction.
   * 3. Checks if the OTP exists, has not expired, and has not been used before.
   * 4. Compares the entered OTP with the stored hashed OTP.
   * 5. Updates OTP verification status and logs history of attempts.
   * 6. Generates and returns a custom JWT token upon successful verification.
   *
   * @param {IVerifyOtp} data - The input data including account RID, interaction RID, and the OTP to verify.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   statusMessage: string;
   *   errorMessage?: string;
   *   data?: { auth_token: string; email: string };
   * }>} - A promise resolving to the verification result including success, failure, or error details.
   *
   * @throws {Error} - Throws an error if internal operations fail during OTP verification.
   */
  async verifyOtp(data: IVerifyOtp): Promise<{
    statusCode: number;
    statusMessage: string;
    errorMessage?: string;
    data?: { auth_token: string; email: string };
  }> {
    try {
      const { account_rid, interaction_rid, otp: enteredOtp } = data;

      const validationResult = await this.otpSchema.validateInputs({
        account_rid,
        interaction_rid,
      });

      if (!validationResult.success) {
        return validationResult;
      }

      const { accountNumber, email } = validationResult;

      // Fetch latest OTP entry
      const latestOtpEntry = await this.otpSchema.getLatestOtpEntry(
        accountNumber,
        account_rid,
        interaction_rid,
        email
      );

      if (!latestOtpEntry) {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          statusMessage: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid OTP. Please try again.",
        };
      }

      // Check if already verified
      if (latestOtpEntry.dataValues.is_verified) {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          statusMessage: HttpStatus.FAILED_MESSAGE,
          errorMessage: "OTP already used. Please request a new one.",
        };
      }

      // Count previous failed attempts
      const attemptCount = await this.otpSchema.countOtpAttempts(
        accountNumber,
        account_rid,
        interaction_rid,
        email
      );

      // Check if expired
      const nowUtc = moment();
      if (nowUtc.isAfter(latestOtpEntry.dataValues.expires_at)) {
        await this.otpSchema.storeOtpHistory({
          accountNumber,
          email,
          account_rid,
          interaction_rid,
          otp: latestOtpEntry.dataValues.otp,
          status: "VERIFICATION_FAILED",
          attempt_number: attemptCount + 1,
        });
        await this.otpSchema.removeOtp(
          accountNumber,
          account_rid,
          interaction_rid
        );
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          statusMessage: HttpStatus.FAILED_MESSAGE,
          errorMessage: "OTP expired. Please request a new one.",
        };
      }

      // Compare hashed OTP
      const isMatch = await compareOtp(
        enteredOtp,
        latestOtpEntry.dataValues.otp
      );

      // Log to history (success/failure)
      if (isMatch) {
        await this.otpSchema.clearVerifiedOtp(
          accountNumber,
          latestOtpEntry.dataValues.rid
        );

        await this.otpSchema.storeOtpHistory({
          accountNumber,
          email,
          account_rid,
          interaction_rid,
          otp: latestOtpEntry.dataValues.otp,
          status: "VERIFIED",
          attempt_number: attemptCount + 1,
        });

        const payload = {
          account_rid,
          interaction_rid,
          email,
        };

        const token = await generateCustomJwtToken(payload);

        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage:
            "OTP verified successfully. Redirecting to interaction details.",
          data: {
            auth_token: token,
            email,
          },
        };
      } else {
        await this.otpSchema.storeOtpHistory({
          accountNumber,
          email,
          account_rid,
          interaction_rid,
          otp: latestOtpEntry.dataValues.otp,
          status: "VERIFICATION_FAILED",
          attempt_number: attemptCount + 1,
          error_message: "Invalid OTP entered",
        });

        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          statusMessage: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid OTP. Please try again.",
        };
      }
    } catch (err) {
      logMessage(`Error verifying OTP: ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

  /**
   * Resends an OTP for a specified account and interaction after validating and managing resend attempts.
   *
   * This function performs the following operations:
   * 1. Validates input data for account and interaction identifiers.
   * 2. Checks OTP metadata for resend attempt limits and blocks if the limit is exceeded.
   * 3. Clears any previously generated OTP for the user.
   * 4. Generates a new OTP, hashes it, and stores it securely.
   * 5. Sends the new OTP to the user's registered email.
   * 6. Updates the resend attempt count and OTP metadata.
   * 7. Logs the OTP resend attempt in history.
   *
   * @param {IGenerateOtp} data - The data containing account RID and interaction RID needed to resend the OTP.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   statusMessage: string;
   *   errorMessage?: string;
   * }>} - A promise resolving with the result of the resend operation, including success or error details.
   *
   * @throws {Error} - Throws an error if any internal operation fails during OTP resend processing.
   */
  async resendOtp(data: IGenerateOtp): Promise<{
    statusCode: number;
    statusMessage: string;
    errorMessage?: string;
  }> {
    try {
      const { account_rid, interaction_rid } = data;

      // 1. Validate inputs
      const validationResult = await this.otpSchema.validateInputs({
        account_rid,
        interaction_rid,
      });

      if (!validationResult.success) {
        return validationResult;
      }

      const { accountNumber, email } = validationResult;

      // 2. Check OTP meta (for block status)
      const otpMeta = await this.otpSchema.getOtpMeta(
        accountNumber,
        account_rid,
        interaction_rid,
        email
      );
      const now = new Date();

      if (otpMeta?.otp_block_until && new Date(otpMeta.otp_block_until) > now) {
        await this.otpSchema.resendOtpAttempts(
          accountNumber,
          account_rid,
          interaction_rid,
          email,
          {
            otp_attempt_count: 0,
          }
        );

        otpMeta.otp_attempt_count = 0;
        return {
          statusCode: HttpStatus.FORBIDDEN,
          statusMessage: "OTP resend temporarily blocked",
          errorMessage: "You have exceeded the maximum number of attempts",
        };
      }

      const currentAttemptCount =
        parseInt(otpMeta?.otp_attempt_count as any, 10) || 0;
      const newAttemptCount = currentAttemptCount + 1;

      // 3. Block if attempts exceeded
      if (newAttemptCount > MAX_RESEND_ATTEMPTS) {
        await this.otpSchema.updateOtpMeta(
          accountNumber,
          account_rid,
          interaction_rid,
          email,
          {
            otp_attempt_count: newAttemptCount,
            otp_block_until: new Date(Date.now() + 60 * 60 * 1000),
          }
        );

        return {
          statusCode: HttpStatus.FORBIDDEN,
          statusMessage: HttpStatus.FAILED_MESSAGE,
          errorMessage: "You have exceeded the maximum number of attempts",
        };
      }

      // 4. Clear previous OTP
      await this.otpSchema.clearPreviousOtp(accountNumber, data, email);

      // 5. Generate + hash new OTP
      const newOtp = generateRandomOtpDigit();
      const hashedOtp = await hashOtp(newOtp);

      // 6. Store new OTP
      await this.otpSchema.storeOtp(accountNumber, data, hashedOtp, email);

      const safeOtpMeta = otpMeta ?? { otp_attempt_count: newAttemptCount };

      // 7. Send OTP email
      const mailContent = otpMailTemplate(newOtp, email);
      const sent = await this.sendOtpOnceAndTrackFailure(
        accountNumber,
        email,
        mailContent,
        account_rid,
        safeOtpMeta,
        interaction_rid
      );

      if (!sent.success) {
        return {
          statusCode: HttpStatus.FAILED,
          statusMessage: HttpStatus.FAILED_MESSAGE,
          errorMessage: sent.message,
        };
      }

      // // 8. Update attempt meta (increase count, no block unless max hit)
      await this.otpSchema.updateOtpMeta(
        accountNumber,
        account_rid,
        interaction_rid,
        email,
        {
          otp_attempt_count: newAttemptCount,
        }
      );

      // 9. Log history
      await this.otpSchema.storeOtpHistory({
        accountNumber,
        email,
        account_rid,
        interaction_rid,
        otp: hashedOtp,
        status: "RESENT",
        attempt_number: newAttemptCount,
      });

      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: "A new OTP has been sent to your registered email.",
      };
    } catch (err) {
      this.logger.error("Error resending OTP:", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async sendOtpOnceAndTrackFailure(
    accountNumber: string,
    email: string,
    mailContent: {
      message: IEmailMessage;
    },
    account_rid: string,
    otpMeta: {
      otp_attempt_count?: number;
      otp_block_until?: Date | null;
    },
    interactionId: string
  ) {
    try {
      const emailResult = await sendEmail(mailContent, account_rid);
      if(emailResult.status === HttpStatus.NOT_FOUND_MESSAGE) {
        return {
          success : false,
          message : STATUS_MESSAGE.noConfigurationFound
        }
      }
      this.logger.info(`[OTP] OTP email sent successfully to ${email}`);
      return {
        success : true,
        message : STATUS_MESSAGE.otpSentSuccessfully
      };
    } catch (err) {
      this.logger.error(
        `[OTP] Failed to send OTP to ${email}: ${(err as Error).message}`
      );

      const currentAttemptCount = otpMeta?.otp_attempt_count || 0;
      const newAttemptCount = currentAttemptCount + 1;

      const updatePayload: {
        otp_attempt_count: number;
        otp_block_until?: Date;
      } = {
        otp_attempt_count: newAttemptCount,
      };

      if (newAttemptCount >= 3) {
        updatePayload.otp_block_until = new Date(Date.now() + 60 * 60 * 1000); // 1 hour block
      }

      await this.otpSchema.updateOtpMeta(
        accountNumber,
        account_rid,
        interactionId,
        email,
        updatePayload
      );

      return {
        success : false,
        message : STATUS_MESSAGE.otpFailedToSend
      };
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
    statusMessage: string;
    errorMessage: string;
  } {
    return {
      statusCode: HttpStatus.FAILED,
      statusMessage: HttpStatus.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }
}
