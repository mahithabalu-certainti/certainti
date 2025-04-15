import { HttpStatus } from "../utils/constants";
import { ICreateResource, IUpdateResource } from "../utils/types";
import { models } from "../models/index";
import SchemaService from "./schemaService";
import moment from "moment";
import { Op, Sequelize } from "sequelize";

const { Resources } = models;

export class ResourceService {
  private resourceCostRepository: typeof Resources | null;
  private schemaService: SchemaService;

  constructor() {
    this.resourceCostRepository = null;
    this.schemaService = new SchemaService();
  }

  /**
   * Retrieves the Resource model instance.
   * If the repository has not been initialized, it creates a new instance
   * using the database configuration.
   *
   * @returns {typeof Resources} - The model for Resource cost entity.
   */
  private getResourceCostRepository(): typeof Resources {
    if (!this.resourceCostRepository) {
      this.resourceCostRepository = Resources;
    }
    return this.resourceCostRepository;
  }

  async createResource(resourceData: ICreateResource): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resource: any };
  }> {
    try {
      const { account_number, account_id } = resourceData;

      const { isAccountExist, dataStorage, parentAccountId } =
        await this.schemaService.checkAccountIdAndNumber(
          account_number,
          account_id
        );

      if (!isAccountExist) {
        throw new Error(
          "Invalid account number or account ID. The specified account was not found."
        );
      }

      let accountNumber = account_number;

      if (dataStorage === "store_in_parent") {
        accountNumber = await this.schemaService.fetchParentAccount(
          parentAccountId
        );
      }

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountNumber
      );

      if (!isExists) {
        throw new Error(
          "Invalid account number: The account number does not exist."
        );
      }

      await this.schemaService.createResourceTable(accountNumber);

      const startDate = moment(resourceData.effective_from_date, "DD/MM/YYYY");
      const endDate = moment(resourceData.effective_end_date, "DD/MM/YYYY");

      const resource = await this.schemaService.insertResourcesTable(
        resourceData,
        startDate,
        endDate,
        accountNumber
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resource,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  async resourcesList(
    accountNumber: string,
    fiscal_year: number,
    page: number = 1,
    limit: number = 10,
    search: string,
    filters: Record<string, string> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC"
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resources: any; count: number };
  }> {
    try {
      const { accountNumber: accountRNumber } =
        await this.schemaService.fetchAccountByNumber(accountNumber);

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountRNumber
      );

      if (!isExists) {
        throw new Error(
          "Invalid account number: The account number does not exist."
        );
      }

      const offset = (page - 1) * limit;

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );

      const { whereClause } = this.buildWhereClause(filters, search);

      const resources = await this.schemaService.fetchResources(
        accountRNumber,
        offset,
        limit,
        [[finalSortBy, finalSortOrder]],
        whereClause
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resources,
          count: resources.length,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  async updateResource(resourceData: IUpdateResource): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resource: any };
  }> {
    try {
      const { account_number, resource_id } = resourceData;

      let { accountNumber, accountId } =
        await this.schemaService.fetchAccountByNumber(account_number);

      const isResourceExist = await this.schemaService.checkIfResourceExists(
        resource_id,
        accountNumber
      );

      if (!isResourceExist) {
        throw new Error(
          "Invalid resource ID: The specified resource does not exist."
        );
      }

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountNumber
      );

      if (!isExists) {
        throw new Error(
          "Invalid account number: The account number does not exist."
        );
      }

      const resource = await this.schemaService.updateResource(
        resourceData,
        accountNumber,
        accountId
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resource,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  async resourceById(
    accountRNumber: string,
    resourceId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceDetails: any };
  }> {
    try {
      let { accountNumber } = await this.schemaService.fetchAccountByNumber(
        accountRNumber
      );

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountNumber
      );

      if (!isExists) {
        throw new Error(
          "Invalid account number: The account number does not exist."
        );
      }

      const isResourceExist = await this.schemaService.checkIfResourceExists(
        resourceId,
        accountNumber
      );

      if (!isResourceExist) {
        throw new Error(
          "Invalid resource ID: The specified resource does not exist."
        );
      }

      const resourceDetails = await this.schemaService.resourceDetails(
        accountNumber,
        resourceId
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceDetails,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "r_number",
      "resource_ref_id",
      "resource_fullname",
      "resource_type",
      "status",
    ];
    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  buildWhereClause(
    filters: Record<string, any>,
    search: string
  ): {
    whereClause: Record<string, any>;
  } {
    let whereClause: Record<string, any> = {};

    if (search) {
      whereClause = this.buildSearchCondition(search, whereClause);
    }

    whereClause = this.applyFilters(filters, whereClause);

    return { whereClause };
  }

  private buildSearchCondition(
    search: string,
    whereClause: Record<string, any>
  ): Record<string, any> {
    const searchCondition = {
      [Op.or]: [
        { resource_fullname: { [Op.iLike]: `%${search}%` } },
        { r_number: { [Op.iLike]: `%${search}%` } },
      ],
    };

    return Object.keys(whereClause).length > 0
      ? { [Op.and]: [whereClause, searchCondition] }
      : searchCondition;
  }

  private applyFilters(
    filters: Record<string, any>,
    whereClause: Record<string, any>
  ): Record<string, any> {
    const castToTextFields = ["resource_type", "resource_status", "rid"]; 

    const filterFields = [
      { clientField: "rid", dbField: "rid" },
      { clientField: "resource_ref_id", dbField: "resource_ref_id" },
      { clientField: "r_number", dbField: "r_number" },
      { clientField: "resource_fullname", dbField: "resource_fullname" },
      { clientField: "resource_type", dbField: "resource_type" },
      { clientField: "resource_status", dbField: "resource_status" },
    ];

    filterFields.forEach(({ clientField, dbField }) => {
      if (filters[clientField]) {
        const fieldFilter = filters[clientField];

        if (castToTextFields.includes(dbField)) {
          whereClause[dbField] = Sequelize.where(
            Sequelize.cast(Sequelize.col(dbField), "TEXT"),
            this.getFieldFilter(fieldFilter, dbField)
          );
        } else {
          whereClause[dbField] = this.getFieldFilter(fieldFilter, dbField);
        }
      }
    });

    return whereClause;
  }

  private getFieldFilter(fieldFilter: any, dbField: string): any {
    if (fieldFilter.equals) {
      return { [Op.iLike]: fieldFilter.equals };
    }
    if (fieldFilter.contains) {
      return { [Op.iLike]: `%${fieldFilter.contains}%` };
    }
    if (fieldFilter.value) {
      return fieldFilter.value;
    }
  }

  private throwServiceError(err: Error): {
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
