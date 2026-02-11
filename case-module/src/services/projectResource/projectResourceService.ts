import { Op, Order, Sequelize } from "sequelize";
import { HttpStatus, rawQueries } from "../../utils/constants";
import {
  IAnomalyStatus,
  IUpdateInlineProjectResource,
  IUpdateProjectResource,
} from "../../utils/types";
import { ProjectResourceSchemaService } from "./schemaService";
// import { ProjectResourceMapper } from "../../utils/projectMapper";
import { initMainDbSequelize } from "../../config/mainDataSource";
// import ProjectIngestionService from "../projectIngestionService";
import { Logger } from "winston";
import moment from "moment";
import Decimal from "decimal.js";
// import { ProjectResource } from "../../models/projectResource";
import { errorLog, logMessage } from "../../utils/helpers";

export class ProjectResourceService {
  private projectResourceSchema: ProjectResourceSchemaService;
  // private projectIngestion: ProjectIngestionService;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.projectResourceSchema = new ProjectResourceSchemaService();
    // this.projectIngestion = new ProjectIngestionService(this.logger);
  }

  getFilterFields(): { clientField: string; dbField: string }[] {
    const projectFilterFields = [
      { clientField: "region_rid", dbField: "region_rid" },
      { clientField: "country_rid", dbField: "country_rid" },
      { clientField: "total_hours_pro_res", dbField: "total_hours_pro_res" },
      { clientField: "total_cost_pro_res", dbField: "total_cost_pro_res" },
      { clientField: "net_total_cost_pro_res", dbField: "net_total_cost_pro_res" },
      { clientField: "qre_final", dbField: "qre_final" },
      { clientField: "qre_percent", dbField: "qre_percent" },
      { clientField: "description", dbField: "description" },
      {
        clientField: "project_resource_code",
        dbField: "project_resource_code",
      },
      { clientField: "status_rid", dbField: "status_rid" },
      { clientField: "project_resource_role", dbField: "project_resource_role" },
      { clientField: "r_number", dbField: "r_number" },
    ];

    return projectFilterFields;
  }

  private getFieldFilter(
    fieldFilter: any,
    isNumberField: boolean,
    isEnumField: boolean
  ): any {
    if (isNumberField) {
      if (fieldFilter.equals !== undefined) {
        const value = String(fieldFilter.equals).includes(".")
          ? fieldFilter.equals
          : `${fieldFilter.equals}.00`;
        return { [Op.eq]: value };
      }
      if (fieldFilter.not_equals !== undefined) {
        const value = String(fieldFilter.not_equals).includes(".")
          ? fieldFilter.not_equals
          : `${fieldFilter.not_equals}.00`;
        return {
          [Op.or]: [{ [Op.ne]: value }, { [Op.is]: null }],
        };
      }
      if (fieldFilter.less_than !== undefined) {
        const value = String(fieldFilter.less_than).includes(".")
          ? fieldFilter.less_than
          : `${fieldFilter.less_than}.00`;
        return { [Op.lt]: value };
      }
      if (fieldFilter.greater_than !== undefined) {
        const value = String(fieldFilter.greater_than).includes(".")
          ? fieldFilter.greater_than
          : `${fieldFilter.greater_than}.00`;
        return { [Op.gt]: value };
      }
      if (
        fieldFilter.between &&
        Array.isArray(fieldFilter.between) &&
        fieldFilter.between.length === 2
      ) {
        const value1 = String(fieldFilter.between[0]).includes(".")
          ? fieldFilter.between[0]
          : `${fieldFilter.between[0]}.00`;
        const value2 = String(fieldFilter.between[1]).includes(".")
          ? fieldFilter.between[1]
          : `${fieldFilter.between[1]}.00`;
        return {
          [Op.between]: [value1, value2],
        };
      }
      if (fieldFilter.is_empty === true) {
        return { [Op.or]: [null] };
      }
    }

    if (isEnumField) {
      if (fieldFilter.equals !== undefined) {
        return { [Op.eq]: fieldFilter.equals };
      }
      if (fieldFilter.not_equals !== undefined) {
        return {
          [Op.or]: [{ [Op.ne]: fieldFilter.not_equals }, { [Op.is]: null }],
        };
      }
      if (fieldFilter.in && Array.isArray(fieldFilter.in)) {
        return { [Op.in]: fieldFilter.in };
      }
      if (fieldFilter.is_empty === true) {
        return { [Op.or]: [null] };
      }
    }

    // String (default)
    if (fieldFilter.equals) {
      return { [Op.iLike]: fieldFilter.equals };
    }
    if (fieldFilter.not_equals) {
      return {
        [Op.or]: [{ [Op.notILike]: fieldFilter.not_equals }, { [Op.is]: null }],
      };
    }
    if (fieldFilter.contains) {
      return { [Op.iLike]: `%${fieldFilter.contains}%` };
    }
    if (fieldFilter.not_contains) {
      return {
        [Op.or]: [
          { [Op.notILike]: `%${fieldFilter.not_contains}%` },
          { [Op.is]: null },
        ],
      };
    }
    if (fieldFilter.is_empty === true) {
      return { [Op.or]: [null, ""] };
    }
    if (fieldFilter.value) {
      return fieldFilter.value;
    }

    return undefined;
  }

  private applyFilters(
    filters: Record<string, any>,
    whereClause: Record<string, any>
  ): Record<string, any> {
    const castToTextFields = [
      "rid",
      "project_startdate",
      "project_enddate",
      "total_effort",
      "total_cost",
      "fiscal_year",
    ];

    const numberFields = [
      "total_hours_pro_res",
      "total_cost_pro_res",
      "net_total_cost_pro_res",
      "qre_percent",
      "qre_final",
    ];

    const enumFields = ["country_rid", "region_rid", "status_rid"];

    const filterFields = this.getFilterFields();

    filterFields.forEach(({ clientField, dbField }) => {
      if (filters[clientField]) {
        const fieldFilter = filters[clientField];
        const isNumber = numberFields.includes(dbField);
        const isEnum = enumFields.includes(dbField);
        const isTextCastNeeded =
          castToTextFields.includes(clientField) && !isNumber;

        if (isTextCastNeeded) {
          whereClause[dbField] = Sequelize.where(
            Sequelize.cast(Sequelize.col(dbField), "TEXT"),
            this.getFieldFilter(fieldFilter, isNumber, isEnum)
          );
        } else {
          whereClause[dbField] = this.getFieldFilter(
            fieldFilter,
            isNumber,
            isEnum
          );
        }
      }
    });

    return whereClause;
  }

  buildWhereClause(filters: Record<string, any>, search: string): {
    whereClause: Record<string, any>;
  } {
    const whereClause: any = {
      [Op.and]: [],
    };
    if (search) {
      whereClause[Op.and].push({
        [Op.or]: [
          { "$project_resource_resource.resource_name$": { [Op.iLike]: `%${search}%` } },
          { "$project_resource_resource.resource_code$": { [Op.iLike]: `%${search}%` } },
        ],
      });
    }
    const filterConditions = this.applyFilters(filters, {});
    if (Object.keys(filterConditions).length > 0) {
      whereClause[Op.and].push(filterConditions);
    }
    return { whereClause: whereClause[Op.and].length ? whereClause : {} };
  }

  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "fiscal_year",
      "total_hours_pro_res",
      "total_cost_pro_res",
      "net_total_cost_pro_res",
      "qre_percent",
      "qre_final",
      "description",
      "project_resource_code",
      "project_resource_role",
      "r_number"
    ];

    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  /**
 * Retrieves a paginated list of project resources based on filtering, sorting, and search criteria.
 *
 * Validates the provided account ID and constructs the query parameters including
 * offset for pagination, sorting options, and filtering conditions. Fetches the matching
 * project resources and total count from the data source.
 *
 * @param {string} accountId - The ID of the account to which the project resources belong.
 * @param {string} projectId - The ID of the project for which resources are to be listed.
 * @param {number} fiscal_year - The fiscal year for filtering project resources.
 * @param {number} page - The current page number for pagination.
 * @param {number} limit - The number of records per page.
 * @param {Record<string, string>} filters - Key-value pairs for filtering the results.
 * @param {string} sortBy - The field name to sort the results by.
 * @param {string} sortOrder - The sort order, typically 'ASC' or 'DESC'.
 * @param {string} search - A search string to filter project resources by matching fields.
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { projectResources: any; count: number };
  * }>} Response object containing status, message, and optionally the list of project resources and total count.
  *
  * @throws Throws an error if the account ID is invalid or if there is any issue fetching data.
  */
  async listProjectResources(
    accountId: string,
    caseId: string,
    fiscal_year: number,
    page: number,
    limit: number,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    search: string,
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResources: any; count: number };
  }> {
    try {
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(accountId);

      if (!accountNumber) {
        logMessage("Invalid account ID");
        throw new Error("Invalid account ID");
      }

      const offset = (page - 1) * limit;

      // construct sorting
      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );
      const order: Order = [[finalSortBy, finalSortOrder]];

      // construct filters
      const { whereClause } = this.buildWhereClause(filters, search);

      let { data: projectResources, count } =
        await this.projectResourceSchema.listProjectResourceSchema(
          accountNumber,
          accountId,
          caseId,
          filters,
          whereClause,
          fiscal_year,
          offset,
          limit,
          order,
          sortBy,
          sortOrder
        );
      projectResources = projectResources.slice(offset, page * limit);

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectResources,
          count,
        },
      };
    } catch (err) {
      errorLog(`Error fetching project resource, ${(err as Error).message}`);
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

  /**
 * Exports project resources for a given account and project with applied filters, sorting, and search.
 *
 * Validates the account ID, constructs sorting and filtering criteria, then fetches the
 * project resources data suitable for export.
 *
 * @param {string} accountId - The account ID used to validate and scope the query.
 * @param {string} projectId - The project ID to fetch resources from.
 * @param {number} fiscal_year - The fiscal year to filter the project resources.
 * @param {Record<string, string>} filters - Key-value pairs for filtering the project resources.
 * @param {string} sortBy - The field to sort the project resources by.
 * @param {string} sortOrder - The sort direction, either 'ASC' or 'DESC'.
 * @param {string} userId - The ID of the user performing the export (used for logging or auditing).
 * @param {string} search - Search string to apply across relevant fields.
 * 
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { projectResources: any };
  * }>} Response object containing the status, message, and optionally the exported project resources data.
  *
  * @throws Throws an error if the account ID is invalid or if fetching the project resources fails.
  */
  async exportProjectResources(
    accountId: string,
    caseId: string,
    fiscal_year: number,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    userId: string,
    search: string,
    type? : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResources: any };
  }> {
    try {
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(accountId);

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      // construct sorting
      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );
      const order: Order = [[finalSortBy, finalSortOrder]];

      // construct filters
      const { whereClause } = this.buildWhereClause(filters, search);

      const projectResources =
        await this.projectResourceSchema.exportProjectResourceSchema(
          accountNumber,
          accountId,
          caseId,
          filters,
          whereClause,
          fiscal_year,
          order,
          sortBy,
          sortOrder,
          userId,
          type
        );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectResources,
        },
      };
    } catch (err) {
      errorLog(`Error exporting project resource, ${(err as Error).message}`);
      throw this.throwServiceError(err as Error);
    }
  }

  /**
* Retrieves detailed information about a specific project resource, including its attachments.
*
* Validates the provided account ID, fetches the project resource details,
* and retrieves associated attachments with enriched metadata such as document type,
* document category, uploader details, and formatted size.
*
* @param {string} projectResourceId - The unique identifier of the project resource.
* @param {string} accountId - The account ID to validate and scope the query.
* @returns {Promise<{
*   statusCode: number;
*   message: string;
*   errorMessage?: string;
*   data?: { projectResource: any; attachment: any };
* }>} Response object containing status, message, and optionally the project resource details and attachments.
*
* @throws Throws an error if the account ID is invalid or if there is any issue fetching data.
*/
  async projectResourceDetails(
    caseProjectResourceId: string,
    accountId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResource: any };
  }> {
    try {
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(accountId);

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const projectResource =
        await this.projectResourceSchema.fetchProjectResourceDetails(
          accountNumber,
          caseProjectResourceId
        );

      // Fetch attachments for the project resource
      // const attachments =
      //   await this.projectResourceSchema.fetchAttachmentsByProjectResourceId(
      //     caseProjectResourceId
      //   );
      // let mappedAttachments = [];
      // if (attachments.length > 0) {
      //   const sequelize = await initMainDbSequelize();
      //   // Get all IDs from attachments
      //   const documentTypeIds = attachments.map(
      //     (attachment) => attachment.document_type_rid
      //   );
      //   const documentCategoryIds = attachments.map(
      //     (attachment) => attachment.document_category_rid
      //   );
      //   const userIds = attachments.map((attachment) => attachment.created_by);

      //   // Execute all queries in parallel
      //   const [documentTypes, documentCategories, users] = await Promise.all([
      //     documentTypeIds.length > 0
      //       ? sequelize.query(rawQueries.GET_DOCUMENT_TYPES, {
      //         replacements: { documentTypeIds },
      //         type: "SELECT",
      //       })
      //       : [],
      //     documentCategoryIds.length > 0
      //       ? sequelize.query(rawQueries.GET_DOCUMENT_CATEGORIES, {
      //         replacements: { documentCategoryIds },
      //         type: "SELECT",
      //       })
      //       : [],
      //     userIds.length > 0
      //       ? sequelize.query(rawQueries.GET_USERS, {
      //         replacements: { userIds },
      //         type: "SELECT",
      //       })
      //       : [],
      //   ]);

      //   // Enhance attachments with related data
      //   mappedAttachments = attachments.map((attachment) => {
      //     const documentType = documentTypes.find(
      //       (dt: any) => dt.rid === attachment.document_type_rid
      //     );
      //     const documentCategory = documentCategories.find(
      //       (dc: any) => dc.rid === attachment.document_category_rid
      //     );
      //     const uploadedBy = users.find(
      //       (u: any) => u.rid === attachment.created_by
      //     );
      //     const attachedTo = projectResource?.r_number;

      //     return {
      //       ...attachment,
      //       document_type: (documentType as any)?.type_name || "",
      //       document_category: (documentCategory as any)?.category_name || "",
      //       uploaded_by: (uploadedBy as any)?.full_name || "",
      //       attached_to: attachedTo,
      //       size_in_mb: attachment.size_in_mb
      //         ? `${attachment.size_in_mb} mb`
      //         : "0 mb",
      //     };
      //   });
      // }
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectResource,
          // attachment: mappedAttachments,
        },
      };
    } catch (err) {
      errorLog(`Error fetching project resource details, ${(err as Error).message}`);
      throw this.throwServiceError(err as Error);
    }
  }



}