import { initMainDbSequelize } from "../../config/mainDataSource";
import { HttpStatus, rawQueries } from "../../utils/constants";
import { uploadEntityTemplatesToAzureBlob } from "../../utils/helpers";

export class TemplateService {
  constructor() {}

  async listTemplates(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }> {
    try {
      const query = rawQueries.fetchTemplate();

      const mainSequelize = await initMainDbSequelize();
      const templateData: any = await mainSequelize.query(query, {
        type: "SELECT",
      });

      return {
        statusCode: HttpStatus.SUCCESS,
        message: "Template Added successfully",
        data: {
          templateData,
        },
      };
    } catch (err) {
      throw this.throwServiceError(err as Error);
    }
  }

  async uploadTemplate(
    file: Express.Multer.File,
    templateId: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }> {
    try {
      const { url } = await uploadEntityTemplatesToAzureBlob(file, templateId);
      const query = rawQueries.updateTemplate(url, templateId, userId);

      const mainSequelize = await initMainDbSequelize();
      await mainSequelize.query(query, {
        type: "UPDATE",
      });

      return {
        statusCode: HttpStatus.SUCCESS,
        message: "Template Added successfully",
        data: {
          blob_url: url,
          templateId,
        },
      };
    } catch (err) {
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
