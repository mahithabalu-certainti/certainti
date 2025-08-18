import { Logger } from "winston";
import { HttpStatus, MAX_RESEND_ATTEMPTS } from "../../utils/constants";
import { IEmailMessage, IGenerateOtp, IVerifyOtp } from "../../utils/types";
import { OtpSchemaService } from "./schemeService";
import {
  compareOtp,
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

      const validationResult = await this.otpSchema.validateInputs({
        account_rid,
        interaction_rid,
      });

      if (!validationResult.success) {
        return validationResult;
      }

      const { accountNumber, email } = validationResult;

      const randomOtpDigit = generateRandomOtpDigit();

      const otpHash = await hashOtp(randomOtpDigit);

      await this.otpSchema.storeOtp(accountNumber, data, otpHash, email);

      const mailContent = otpMailTemplate(randomOtpDigit, email);
      await this.sendOtpWithRetries(email, mailContent);

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
      if (latestOtpEntry.is_verified) {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          statusMessage: HttpStatus.FAILED_MESSAGE,
          errorMessage: "OTP already used. Please request a new one.",
        };
      }

      // Check if expired
      const now = new Date();
      if (now > new Date(latestOtpEntry.expires_at)) {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          statusMessage: HttpStatus.FAILED_MESSAGE,
          errorMessage: "OTP expired. Please request a new one.",
        };
      }

      // Count previous failed attempts
      const attemptCount = await this.otpSchema.countOtpAttempts(
        accountNumber,
        account_rid,
        interaction_rid,
        email
      );

      if (attemptCount >= 3) {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          statusMessage: HttpStatus.FAILED_MESSAGE,
          errorMessage: "You have exceeded the maximum number of attempts.",
        };
      }

      // Compare hashed OTP
      const isMatch = await compareOtp(enteredOtp, latestOtpEntry.otp);

      // Log to history (success/failure)
      if (isMatch) {
        await this.otpSchema.clearVerifiedOtp(
          accountNumber,
          latestOtpEntry.rid
        );

        await this.otpSchema.storeOtpHistory({
          accountNumber,
          email,
          account_rid,
          interaction_rid,
          otp: latestOtpEntry.otp,
          status: "VERIFIED",
          attempt_number: attemptCount + 1,
        });

        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage:
            "OTP verified successfully. Redirecting to interaction details.",
        };
      } else {
        await this.otpSchema.storeOtpHistory({
          accountNumber,
          email,
          account_rid,
          interaction_rid,
          otp: latestOtpEntry.otp,
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
      this.logger.error("OTP verification failed", err);
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

      const validationResult = await this.otpSchema.validateInputs({
        account_rid,
        interaction_rid,
      });

      if (!validationResult.success) {
        return validationResult;
      }

      const { accountNumber, email } = validationResult;

      // 🔢 Check current resend attempt count
      const resendAttempts = await this.otpSchema.countOtpResendAttempts(
        accountNumber,
        account_rid,
        interaction_rid,
        email
      );

      if (resendAttempts >= MAX_RESEND_ATTEMPTS) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          statusMessage: HttpStatus.FAILED_MESSAGE,
          errorMessage: "You have exceeded the maximum number of attempts",
        };
      }

      // 🧹 Invalidate/clear previous OTP
      await this.otpSchema.clearPreviousOtp(accountNumber, data, email);

      // 🔐 Generate and hash new OTP
      const newOtp = generateRandomOtpDigit();
      const hashedOtp = await hashOtp(newOtp);

      // 💾 Store new OTP
      await this.otpSchema.storeOtp(accountNumber, data, hashedOtp, email);

      // 📧 Send OTP email
      const mailContent = otpMailTemplate(newOtp, email);
      const sendResult = await this.sendOtpWithRetries(email, mailContent);

      // 📝 Log to OTP history
      await this.otpSchema.storeOtpHistory({
        accountNumber,
        email,
        account_rid,
        interaction_rid,
        otp: hashedOtp,
        status: "SENT",
        attempt_number: resendAttempts + 1,
      });

      // if (!sendResult.success) {
      //   return {
      //     statusCode: HttpStatus.SERVER_ERROR,
      //     statusMessage: HttpStatus.FAILURE_MESSAGE,
      //     errorMessage: "Failed to resend OTP. Please try again later.",
      //   };
      // }

      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: "A new OTP has been sent to your registered email.",
      };
    } catch (err) {
      this.logger.error("Error resending OTP:", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async sendOtpWithRetries(
    email: string,
    mailContent: {
      message: IEmailMessage;
    }
  ) {
    let attempts = 0;
    const maxRetries = 3;
    let sent = false;
    let lastError: Error | null = null;

    while (attempts < maxRetries && !sent) {
      try {
        await sendEmail(mailContent);
        sent = true;
        this.logger.info(
          `[OTP] OTP email sent successfully to ${email} on attempt ${
            attempts + 1
          }`
        );
      } catch (err) {
        attempts++;
        lastError = err as Error;
        this.logger.warn(
          `[OTP] Failed to send OTP to ${email} on attempt ${attempts}: ${lastError.message}`
        );
      }
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
