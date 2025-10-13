import { Logger } from "winston";
import FormData from "form-data";
import axios, { AxiosError } from "axios";
import { InteractionResponse } from "../../utils/types";
import { HttpStatus, rawQueries } from "../../utils/constants";
import { generateNewCustomJwtKey } from "../../utils/otpGenerator";
import { InteractionModelService } from "../interactionModelsService";
import { logMessage } from "../../utils/helpers";

const INTERACTION_BASE_URL = process.env.INTERACTION_BASE_URL!;
export class InteractionService {
  private logger: Logger;
  private interactionModelService: InteractionModelService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.interactionModelService = new InteractionModelService();
  }

  /**
   * Updates an interaction response by sending the updated data to an external interaction service.
   *
   * This function generates a custom JWT token using the provided auth token,
   * then makes a `PUT` request to the external interaction service to update
   * interaction response data. It returns the updated interaction details on success.
   *
   * @param {InteractionResponse} interactionData - The interaction data payload to be updated.
   * @param {string} userId - The ID of the user performing the update (used in request headers).
   * @param {string} authToken - The original authentication token used to generate a new JWT.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { interactions: any };
   * }>} - Returns a promise that resolves with the status of the update, and updated interaction data if successful.
   *
   * @throws {Error} - Throws an error if the request to the external service fails or if any unexpected error occurs during execution.
   */
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

  /**
   * Retrieves detailed information for a specific interaction from the external interaction service.
   *
   * This function generates a new custom JWT token using the provided auth token,
   * and performs a `GET` request to fetch interaction details based on the provided
   * interaction RID and account RID. The user ID is included in the headers for tracking/auth purposes.
   *
   * @param {string} interactionRid - The unique identifier of the interaction to retrieve.
   * @param {string} accountRid - The unique identifier of the associated account.
   * @param {string} userId - The ID of the user making the request (used in request headers).
   * @param {string} authToken - The authentication token used to generate a custom JWT.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { interactionDetails: any };
   * }>} - A promise that resolves with the interaction details if the request is successful,
   * or an error message if the request fails.
   *
   * @throws {Error} - Throws an error if the request to the interaction service fails or an unexpected error occurs.
   */
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

  /**
   * Uploads an attachment related to a specific interaction to Azure via the external interaction service.
   *
   * This function builds a multipart form with the file and related metadata (account, interaction, and project IDs),
   * generates a custom JWT token from the provided auth token, and sends a POST request to the external service.
   * If successful, it returns metadata about the uploaded file (name, size, type, URL).
   *
   * @param {Express.Multer.File} file - The file object uploaded via Multer middleware.
   * @param {string} accountRid - The unique identifier of the account associated with the file.
   * @param {string} interactionRid - The unique identifier of the interaction the file is linked to.
   * @param {string} projectId - The unique identifier of the project related to the interaction.
   * @param {string} userId - The user ID performing the upload (used in headers).
   * @param {string} authToken - The bearer token used to generate a custom JWT for authorization.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: {
   *     fileName: string;
   *     fileSize: number;
   *     fileType: string;
   *     fileUrl: string;
   *   };
   * }>} - A promise resolving to the status and details of the uploaded file if successful.
   *
   * @throws {Error} - Throws an error if the upload fails due to network issues, invalid inputs, or unexpected responses.
   */
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

  /**
   * Deletes an attachment from Azure Blob Storage via the external interaction service.
   *
   * This function sends a DELETE request to the interaction service with the provided file URL,
   * using a custom JWT token generated from the provided authentication token.
   * It is primarily used to remove files that were previously uploaded in relation to an interaction.
   *
   * @param {string} fileUrl - The full URL of the file to be deleted from Azure Blob Storage.
   * @param {string} userId - The ID of the user performing the delete operation (included in request headers).
   * @param {string} authToken - The bearer token used to generate a custom JWT for authorization.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: any;
   * }>} - A promise that resolves with the status of the delete operation and optional data.
   *
   * @throws {Error} - Throws an error if the request to the external service fails or returns an unexpected status.
   */
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
    const apiMessage = (error.response?.data as { message?: string })?.message;

    if (this.isUnauthorizedError(error)) {
      logMessage(`Inside unauthorized error: ${error}, ${error.response?.status}`);
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
