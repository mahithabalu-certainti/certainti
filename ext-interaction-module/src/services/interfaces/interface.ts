import {
  IGenerateOtp,
  IVerifyOtp,
  InteractionResponse,
} from "../../utils/types";

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
    data?: { auth_token: string; email: string };
  }>;
  resendOtp(data: IGenerateOtp): Promise<{
    statusCode: number;
    statusMessage: string;
    errorMessage?: string;
    data?: { otp: any };
  }>;
}

export interface IInteractionService {
  updateInteractionResponse(
    interactionData: InteractionResponse,
    userId: string,
    authToken: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }>;
  getInteractionDetailsById(
    interactionRid: string,
    accountId: string,
    userId: string,
    authToken: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionDetails: any };
  }>;
  deleteFromAzureBlob(
    fileUrl: string,
    userId: string,
    authToken: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }>;
  uploadAttachment(
    file: Express.Multer.File,
    accountId: string,
    interactionRid: string,
    projectId: string,
    userId: string,
    authToken: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: {
      fileName: string;
      fileSize: number;
      fileType: string;
      fileUrl: string;
    };
  }>
}
