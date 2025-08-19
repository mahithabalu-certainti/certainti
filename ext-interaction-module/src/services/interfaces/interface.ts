import { IGenerateOtp, IVerifyOtp } from "../../utils/types";

export interface IOtpServices {
  generateOtp(data: IGenerateOtp): Promise<{
    statusCode: number;
    statusMessage: string;
    errorMessage?: string;
    data?: { otp: string };
  }>;
  verifyOtp(data: IVerifyOtp): Promise<{
    statusCode: number;
    statusMessage: string;
    errorMessage?: string;
    data?: { auth_token: string, email: string };
  }>;
  resendOtp(data: IGenerateOtp): Promise<{
    statusCode: number;
    statusMessage: string;
    errorMessage?: string;
    data?: { otp: any };
  }>;
}
