import { Logger } from "winston";
import FormData from 'form-data';
import axios from "axios";
import { InteractionResponse } from "../../utils/types";
import { HttpStatus, INTERACTION_BASE_URL } from "../../utils/constants";

export class InteractionService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async updateInteractionResponse(
    interactionData: InteractionResponse,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }> {
    try {
      const response = await axios.put(
        `${INTERACTION_BASE_URL}/ext_interactions/updateResponse`,
        {
          ...interactionData,
        },
        {
          headers: {
            "x-user-id": userId,
            Authorization: "Bearer ",
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
      throw this.throwServiceError(err as Error);
    }
  }

  async getInteractionDetailsById(
    interactionRid: string,
    accountRid: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionDetails: any };
  }> {
    try {
      const response = await axios.get(
        `${INTERACTION_BASE_URL}/ext_interactions/detail/${accountRid}/${interactionRid}`,
        {
          headers: {
            "x-user-id": userId,
            Authorization: "Bearer ",
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
      throw this.throwServiceError(err as Error);
    }
  }

  async uploadAttachment(
    file: Express.Multer.File,
    accountRid: string,
    interactionRid: string,
    projectId: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: {
      fileName: string;
      fileSize: number;
      fileType: string;
      fileUrl: string;
    }
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });      

      formData.append("account_rid", accountRid);
      formData.append("interaction_rid", interactionRid);
      formData.append("project_rid", projectId);

      const response = await axios.post(
        `${INTERACTION_BASE_URL}/ext_interactions/uploadAttachment`,
        formData,
        {
          headers: {
            "x-user-id": userId,
            Authorization: "Bearer ",
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
      console.log("Error uploading attachments", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async deleteFromAzureBlob(
    fileUrl: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any
  }> {
    try {
      const response = await axios.delete(
        `${INTERACTION_BASE_URL}/ext_interactions/deleteAttachment`,
        {
          data: {
            file_url: fileUrl
          },
          headers: {
            'x-user-id': userId,
            Authorization: 'Bearer ',
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
        data: {}
      };
    } catch (err) {
      console.log("Error uploading attachments", err);
      throw this.throwServiceError(err as Error);
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
