import { Logger } from "winston";
import FormData from "form-data";
import axios, { AxiosError } from "axios";
import { InteractionResponse } from "../../utils/types";
import { HttpStatus, rawQueries } from "../../utils/constants";
import { generateNewCustomJwtKey } from "../../utils/otpGenerator";
import { InteractionModelService } from "../interactionModelsService";

const INTERACTION_BASE_URL = process.env.INTERACTION_BASE_URL!;
export class InteractionService {
  private logger: Logger;
  private interactionModelService: InteractionModelService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.interactionModelService = new InteractionModelService();
  }

  async updateInteractionResponse(
    interactionData: InteractionResponse,
    userId: string,
    authToken: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }> {
    try {
      const newCustomJwtToken = await this.generateNewToken(authToken);

      const response = await axios.put(
        `${INTERACTION_BASE_URL}/extInteractions/updateResponse`,
        {
          ...interactionData,
        },
        {
          headers: {
            "x-user-id": userId,
            Authorization: newCustomJwtToken,
          },
        }
      );

      if (response.status !== 200) {
        return {
          statusCode: response.status,
          message: "Failed to fetch interaction questions.",
          errorMessage:
            response.data?.errorMessage || "Unexpected error occurred.",
        };
      }

      // Check if data is structured as expected
      const updateResponse = response.data?.data?.interactionDetails;

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactions: updateResponse,
        },
      };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getInteractionDetailsById(
    interactionRid: string,
    accountRid: string,
    userId: string,
    authToken: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionDetails: any };
  }> {
    try {
      const newCustomJwtToken = await this.generateNewToken(authToken);

      const response = await axios.get(
        `${INTERACTION_BASE_URL}/extInteractions/detail/${accountRid}/${interactionRid}`,
        {
          headers: {
            "x-user-id": userId,
            Authorization: newCustomJwtToken,
          },
        }
      );

      if (response.status !== 200) {
        return {
          statusCode: response.status,
          message: "Failed to fetch interaction questions.",
          errorMessage:
            response.data?.errorMessage || "Unexpected error occurred.",
        };
      }

      // Check if data is structured as expected
      const interactionDetails = response.data?.data?.interactionDetails;

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactionDetails,
        },
      };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async uploadAttachment(
    file: Express.Multer.File,
    accountRid: string,
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
  }> {
    try {
      const formData = new FormData();
      formData.append("file", file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      formData.append("account_rid", accountRid);
      formData.append("interaction_rid", interactionRid);
      formData.append("project_rid", projectId);

      const newCustomJwtToken = await this.generateNewToken(authToken);

      const response = await axios.post(
        `${INTERACTION_BASE_URL}/extInteractions/uploadAttachment`,
        formData,
        {
          headers: {
            "x-user-id": userId,
            Authorization: newCustomJwtToken,
          },
        }
      );

      if (response.status !== 200) {
        return {
          statusCode: response.status,
          message: "Failed to fetch interaction questions.",
          errorMessage:
            response.data?.errorMessage || "Unexpected error occurred.",
        };
      }

      // Check if data is structured as expected
      const attachementResponse = response.data?.data;

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          ...attachementResponse,
        },
      };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async deleteFromAzureBlob(
    fileUrl: string,
    userId: string,
    authToken: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }> {
    try {
      const newCustomJwtToken = await this.generateNewToken(authToken);
      const response = await axios.delete(
        `${INTERACTION_BASE_URL}/extInteractions/deleteAttachment`,
        {
          data: {
            file_url: fileUrl,
          },
          headers: {
            "x-user-id": userId,
            Authorization: newCustomJwtToken,
          },
        }
      );

      if (response.status !== 200) {
        return {
          statusCode: response.status,
          message: "Failed to fetch interaction questions.",
          errorMessage:
            response.data?.errorMessage || "Unexpected error occurred.",
        };
      }

      // Check if data is structured as expected
      const attachementResponse = response.data?.data;

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {},
      };
    } catch (err) {
      return this.handleError(err);
    }
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

  async generateNewToken(oldToken: string): Promise<string> {
    if (!oldToken || typeof oldToken !== "string") {
      throw new Error("Invalid old token");
    }

    const parts = oldToken.trim().split(" ");
    const rawToken = parts.length === 2 ? parts[1] : parts[0];

    if (!rawToken) {
      throw new Error("Token format is invalid");
    }

    const newToken = await generateNewCustomJwtKey(rawToken);

    return `Bearer ${newToken}`;
  }

  private handleError(err: unknown) {
    if (axios.isAxiosError(err)) {
      return this.handleAxiosError(err);
    }

    return this.handleUnknownError(err);
  }

  private handleAxiosError(error: AxiosError) {
    const apiMessage =
      (error.response?.data as { message?: string })?.message;
  
    if (this.isUnauthorizedError(error)) {
      console.log("Inside unauthorized error", error, error.response?.status);
      return this.throwServiceError(error, apiMessage || "Unauthorized", error.response?.status);
    }
  
    return this.throwServiceError(
      error,
      apiMessage || error.message || "An unexpected API error occurred."
    );
  }

  private isUnauthorizedError(error: AxiosError): boolean {
    return error.response?.status === 401;
  }

  private handleUnknownError(err: unknown) {
    return this.throwServiceError(err as Error, "Unexpected error occurred.");
  }

  /**
   * Formats an error response to be returned from service methods.
   *
   * @param {Error} err - The caught error.
   * @returns {object} - Standardized error response object.
   */
  throwServiceError(
    err: Error,
    errMessage?: string,
    errCode?: number
  ): {
    statusCode: number;
    message: string;
    errorMessage: string;
  } {
    return {
      statusCode: errCode ?? HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: errMessage ?? err.message,
    };
  }
}
