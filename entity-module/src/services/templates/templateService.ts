import { initMainDbSequelize } from "../../config/mainDataSource";
import { HttpStatus, rawQueries } from "../../utils/constants";
import { logMessage, uploadEntityTemplatesToAzureBlob } from "../../utils/helpers";

export class TemplateService {
  constructor() {}

  /**
   * Retrieves the list of templates from the main database.
   *
   * This method:
   * 1. Executes a database query to fetch all template records.
   * 2. Returns the retrieved templates along with a success status.
   *
   * @returns Promise resolving to an object containing status code, message, and template data array
   * @throws Throws a service error if the database query fails
   */
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
      logMessage(`Error fetching templates: ${(err as Error).message}`);
      throw this.throwServiceError(err as Error);
    }
  }

  /**
   * Uploads a template file to Azure Blob Storage and updates the template record in the database.
   *
   * This method:
   * 1. Uploads the provided file to Azure Blob Storage linked to the given template ID.
   * 2. Updates the template record in the main database with the new blob URL and user information.
   *
   * @param file - The file to upload (received from Multer middleware)
   * @param templateId - The ID of the template to update
   * @param userId - The ID of the user performing the upload
   * @returns Promise resolving to an object containing status code, message, and uploaded template data (including blob URL)
   * @throws Throws a service error if the upload or database update fails
   */
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
      logMessage(`Error uploading template: ${(err as Error).message}`);
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
