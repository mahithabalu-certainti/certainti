import { Logger } from "winston";
import moment from "moment-timezone";
import { HttpStatus, MAX_RESEND_ATTEMPTS } from "../../utils/constants";
import { IEmailMessage, IGenerateOtp, IVerifyOtp } from "../../utils/types";
import { OtpSchemaService } from "./schemeService";
import {
  compareOtp,
  generateJwtToken,
  generateRandomOtpDigit,
  hashOtp,
} from "../../utils/otpGenerator";
import { otpMailTemplate } from "../../utils/mailTemplate";
import { sendEmail } from "../emailService";

export class OtpService {
  private logger: Logger;
  otpSchema: OtpSchemaService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.otpSchema = new OtpSchemaService();
  }

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

      const mailContent = otpMailTemplate(randomOtpDigit, email);
      const sent = await this.sendOtpOnceAndTrackFailure(
        accountNumber,
        email,
        mailContent,
        account_rid,
        safeOtpMeta,
        interaction_rid
      );

      // 6. Update attempt history
      if (!sent) {
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
          errorMessage: "Failed to send OTP. Please try again.",
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
      console.log("Error generating OTP", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async verifyOtp(data: IVerifyOtp): Promise<{
    statusCode: number;
    statusMessage: string;
    errorMessage?: string;
    data?: { auth_token: string, email: string }
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
    
        const token = generateJwtToken(payload);

        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage:
            "OTP verified successfully. Redirecting to interaction details.",
          data: {
            auth_token: token,
            email
          }
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
      console.log("Inside error", err);
      throw this.throwServiceError(err as Error);
    }
  }

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

      const currentAttemptCount = parseInt(otpMeta?.otp_attempt_count as any, 10) || 0;
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

      if (!sent) {
        return {
          statusCode: HttpStatus.FAILED,
          statusMessage: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Failed to resend OTP. Please try again later.",
        };
      }

      // // 8. Update attempt meta (increase count, no block unless max hit)
      await this.otpSchema.updateOtpMeta(accountNumber, account_rid, interaction_rid, email, {
        otp_attempt_count: newAttemptCount,
      });

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
  ): Promise<boolean> {
    try {
      await sendEmail(mailContent);
      this.logger.info(`[OTP] OTP email sent successfully to ${email}`);
      return true;
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

      return false;
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
