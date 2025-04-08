import { Op, where } from "sequelize";
import sequelize from "../config/dataSource";
import ResourceCost from "../models/ResourceCost";
import { HttpStatus } from "../utils/constants";
import { IResourceCost, IUpdateResourceCost } from "../utils/types";
import Resources from "../models/Resource";

class ResourceCostService {
  private resourceCostRepository: typeof ResourceCost | null;

  constructor() {
    this.resourceCostRepository = null;
  }

  /**
   * Retrieves the Resource Cost model instance.
   * If the repository has not been initialized, it creates a new instance
   * using the database configuration.
   *
   * @returns {typeof ResourceCost} - The model for Resource cost entity.
   */
  private getResourceCostRepository(): typeof ResourceCost {
    if (!this.resourceCostRepository) {
      this.resourceCostRepository = ResourceCost;
    }
    return this.resourceCostRepository;
  }

  /**
   * Retrieves an ResourceCost by its ID.
   *
   * @async
   * @param {number} rid - The ID of the account to retrieve.
   * @returns {Promise<{ statusCode: number, message: string, data?: { account: any } }>}
   * - An object containing the status code, message, and retrieved account data.
   */
  async resourceCostList(
    page: number,
    limit: number,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCost: any; count: number };
  }> {
    try {
      const repository = this.getResourceCostRepository();

      const { whereClause } = this.buildWhereClause(filters, search);
      const offset = (page - 1) * limit;

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );

      const resourceCost = await repository.findAll({
        where: {
          ...whereClause,
        },
        include: [
          {
            model: Resources,
            required: true,
            as: "Resource",
            attributes: ["resource_number"],
          },
        ],
        limit,
        offset,
        order: [[finalSortBy, finalSortOrder]],
        subQuery: false,
      });

      const formattedResourceCost = resourceCost.map((rc: any) => {
        const { Resource, ...rest } = rc.toJSON();
        return {
          ...rest,
          resource_number: Resource?.resource_number || null,
        };
      });

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceCost: formattedResourceCost,
          count: formattedResourceCost.length,
        },
      };
    } catch (err) {
      console.log("Error ", err);
      return this.throwServiceError(err as Error);
    }
  }

  async createResourceCost(resourceCost: IResourceCost): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCost: any };
  }> {
    try {
      const repository = this.getResourceCostRepository();
      const {
        resource_ref_id,
        resource_currency,
        resource_start_date,
        resource_end_date,
        resource_annual_compensation,
        resource_monthly_compensation,
        resource_weekly_compensation,
        resource_daily_compensation,
        resource_hourly_compensation,
      } = resourceCost;

      const createdResourceCost = await repository.create({
        resource_ref_id,
        currency: resource_currency,
        start_date: resource_start_date,
        end_date: resource_end_date,
        annual_compensataion: resource_annual_compensation,
        monthly_compensation: resource_monthly_compensation,
        weekly_compensation: resource_weekly_compensation,
        daily_compensation: resource_daily_compensation,
        hourly_compensation: resource_hourly_compensation,
      });

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceCost: createdResourceCost,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  async updateResourceCost(resourceCostData: IUpdateResourceCost) {
    try {
      const repository = this.getResourceCostRepository();
      const {
        id,
        resource_currency,
        resource_start_date,
        resource_end_date,
        resource_annual_compensation,
        resource_monthly_compensation,
        resource_weekly_compensation,
        resource_daily_compensation,
        resource_hourly_compensation,
        status,
      } = resourceCostData;

      const [affectedCounts, affectedRows] = await repository.update(
        {
          id,
          currency: resource_currency,
          start_date: resource_start_date,
          end_date: resource_end_date,
          annual_compensataion: resource_annual_compensation,
          monthly_compensation: resource_monthly_compensation,
          weekly_compensation: resource_weekly_compensation,
          daily_compensation: resource_daily_compensation,
          hourly_compensation: resource_hourly_compensation,
          status,
        },
        {
          where: {
            id: id,
          },
          returning: true,
        }
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          affectedCounts,
          resourceCost: affectedRows[0],
        },
      };
    } catch (err) {
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: (err as Error).message,
      };
    }
  }

  async resourceCostById(id: string) {
    try {
      const repository = await this.getResourceCostRepository();
      const resourceCostById = await repository.findOne({
        where: {
          id: id,
        },
        include: [
          {
            model: Resources,
            required: true,
            as: "Resource",
          },
        ],
      });

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceCostById,
        },
      };
    } catch (err) {
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: (err as Error).message,
      };
    }
  }

  // async createNewSchema(account_number: string) {
  //   try {
  //     await sequelize.createSchema(`platform_v2_${account_number}`, {});
  //     await this.createAccountTables(account_number);
  //   } catch (err) {
  //     console.error("Error creating schema and tables: ", err);
  //     throw new Error("Error creating schema and tables.");
  //   }
  // }

  // async createAccountTables(account_number: string) {
  //   const schemaName = `platform_v2_${account_number}`;

  //   await sequelize.query(`
  //     CREATE TABLE IF NOT EXISTS "${schemaName}"."account_details" (
  //       rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  //       account_rid UUID NOT NULL,
  //       tax_claim_level VARCHAR(50) NULL,
  //       max_ai_interactions INT CHECK (max_ai_interactions BETWEEN 3 AND 5) NOT NULL,
  //       autosend_interaction BOOLEAN NOT NULL,
  //       fiscal_start_date VARCHAR(10) NOT NULL,
  //       fiscal_end_date VARCHAR(10) NOT NULL,
  //       interaction_cc_list VARCHAR,
  //       blended_rate_fte VARCHAR(10),
  //       blended_rate_subcon VARCHAR(10),
  //       created_by VARCHAR(255),
  //       modified_by VARCHAR(255),
  //       primary_contact_email VARCHAR(50) NOT NULL,
  //       primary_contact_number VARCHAR(50) NOT NULL,
  //       finance_poc_name VARCHAR(25) NOT NULL,
  //       finance_poc_email VARCHAR(50) NOT NULL,
  //       finanace_poc_number VARCHAR(50) NOT NULL,
  //       website VARCHAR(50),
  //       project_manager VARCHAR(50) NOT NULL,
  //       data_residency VARCHAR(255),
  //       data_storage VARCHAR(255) CHECK (data_storage IN ('separate_db', 'store_in_parent')),
  //       auto_access_rd BOOLEAN NOT NULL,
  //       created_datetime DATE DEFAULT CURRENT_TIMESTAMP NULL,
  //       modified_datetime DATE DEFAULT CURRENT_TIMESTAMP NULL
  //     );
  //   `);
  // }

  //   async insertAccountDetails(
  //     account_number: string,
  //     accountData: IAccount,
  //     account_rid: string
  //   ) {
  //     try {
  //       const schemaName = `platform_v2_${account_number}`;

  //       await sequelize.query(
  //         `
  //         INSERT INTO "${schemaName}"."account_details" (
  //           account_rid, max_ai_interactions,
  //           autosend_interaction, fiscal_start_date, fiscal_end_date,
  //           interaction_cc_list, blended_rate_fte, blended_rate_subcon,
  //           created_by, modified_by, primary_contact_email, primary_contact_number,
  //           finance_poc_name, finance_poc_email, finanace_poc_number, website,
  //           project_manager,
  //           data_residency, data_storage, auto_access_rd
  //         )
  //         VALUES (
  //           :account_rid, :max_ai_interactions,
  //           :autosend_interaction, :fiscal_start_date, :fiscal_end_date,
  //           :interaction_cc_list, :blended_rate_fte, :blended_rate_subcon,
  //           :created_by, :modified_by, :primary_contact_email, :primary_contact_number,
  //           :finance_poc_name, :finance_poc_email, :finanace_poc_number, :website,
  //           :project_manager,
  //           :data_residency, :data_storage, :auto_access_rd
  //         );
  //       `,
  //         {
  //           replacements: {
  //             account_rid: account_rid,
  //             max_ai_interactions: accountData.max_ai_interactions,
  //             autosend_interaction: accountData.autosend_interaction,
  //             fiscal_start_date: accountData.fiscal_start_date,
  //             fiscal_end_date: accountData.fiscal_end_date,
  //             interaction_cc_list: accountData.interaction_cc_list ?? null,
  //             blended_rate_fte: accountData.blended_rate_fte ?? null,
  //             blended_rate_subcon: accountData.blended_rate_subcon ?? null,
  //             created_by: "Admin",
  //             modified_by: "Admin",
  //             primary_contact_email: accountData.primary_contact_email,
  //             primary_contact_number: accountData.primary_contact_number,
  //             finance_poc_name: accountData.finance_poc_name,
  //             finance_poc_email: accountData.finance_poc_email,
  //             finanace_poc_number: accountData.finance_poc_number,
  //             website: accountData.website ?? null,
  //             project_manager: accountData.project_manager,
  //             data_residency: accountData.data_residency ?? null,
  //             data_storage: accountData.data_storage ?? null,
  //             auto_access_rd: accountData.auto_access_rd
  //           },
  //         }
  //       );
  //     } catch (err) {
  //       throw new Error((err as Error).message);
  //     }
  //   }

  //   async updateAccountDetails(
  //     account_rid: string,
  //     accountData: IUpdateAccount,
  //     account_number: string
  //   ) {
  //     try {
  //       const schemaName = `platform_v2_${account_number}`;

  //       await sequelize.query(
  //         `
  //         UPDATE "${schemaName}"."account_details"
  //         SET
  //           max_ai_interactions = :max_ai_interactions,
  //           autosend_interaction = :autosend_interaction,
  //           interaction_cc_list = :interaction_cc_list,
  //           blended_rate_fte = :blended_rate_fte,
  //           blended_rate_subcon = :blended_rate_subcon,
  //           modified_by = :modified_by,
  //           primary_contact_email = :primary_contact_email,
  //           primary_contact_number = :primary_contact_number,
  //           finance_poc_name = :finance_poc_name,
  //           finance_poc_email = :finance_poc_email,
  //           finanace_poc_number = :finanace_poc_number,
  //           website = :website,
  //           project_manager = :project_manager,
  //           auto_access_rd = :auto_access_rd,
  //           modified_datetime = :modified_datetime
  //         WHERE account_rid = :account_rid;
  //       `,
  //         {
  //           replacements: {
  //             account_rid: account_rid,
  //             max_ai_interactions: accountData.max_ai_interactions,
  //             autosend_interaction: accountData.autosend_interaction,
  //             interaction_cc_list: accountData.interaction_cc_list ?? null,
  //             blended_rate_fte: accountData.blended_rate_fte ?? null,
  //             blended_rate_subcon: accountData.blended_rate_subcon ?? null,
  //             modified_by: "Admin",
  //             primary_contact_email: accountData.primary_contact_email,
  //             primary_contact_number: accountData.primary_contact_number,
  //             finance_poc_name: accountData.finance_poc_name,
  //             finance_poc_email: accountData.finance_poc_email,
  //             finanace_poc_number: accountData.finance_poc_number,
  //             website: accountData.website ?? null,
  //             project_manager: accountData.project_manager,
  //             auto_access_rd: accountData.auto_access_rd,
  //             modified_datetime: new Date()
  //           },
  //         }
  //       );
  //     } catch (err) {
  //       throw new Error((err as Error).message);
  //     }
  //   }

  //   async fetchAccountDetails(account_number: string, account_rid: string) {
  //     try {
  //       const query = `
  //         SELECT * FROM "platform_v2_${account_number}".account_details WHERE account_rid = :account_rid
  //       `;

  //       const users = await sequelize.query(query, {
  //         replacements: { account_rid },
  //         type: "SELECT",
  //       });
  //       return users;
  //     } catch (err) {
  //       throw new Error("Error retrieving account details");
  //     }
  //   }

  buildWhereClause(
    filters: Record<string, any>,
    search: string
  ): {
    whereClause: Record<string, any>;
  } {
    let whereClause: Record<string, any> = {};

    whereClause = this.applyFilters(filters, whereClause);

    if (search) {
      whereClause = this.buildSearchCondition(search, whereClause);
    }

    return { whereClause };
  }

  private buildSearchCondition(
    search: string,
    whereClause: Record<string, any>
  ): Record<string, any> {
    const searchCondition = {
      [Op.or]: [
        { resource_cost_number: { [Op.iLike]: `%${search}%` } },
        { currency: { [Op.iLike]: `%${search}%` } },
        { "$Resource.resource_full_name$": { [Op.iLike]: `%${search}%` } },
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
    const filterFields = [
      { clientField: "resource_cost_number", dbField: "resource_cost_number" },
      { clientField: "currency", dbField: "currency" },
      { clientField: "start_date", dbField: "start_date" },
      { clientField: "end_date", dbField: "end_date" },
    ];

    filterFields.forEach(({ clientField, dbField }) => {
      if (filters[clientField]) {
        const fieldFilter = filters[clientField];
        whereClause[dbField] = this.getFieldFilter(fieldFilter, dbField);
      }
    });

    if (filters.compensation_type) {
      const selectedCompField = filters.compensation_type;

      const validCompFields = [
        "annual_compensation",
        "monthly_compensation",
        "weekly_compensation",
        "daily_compensation",
        "hourly_compensation",
      ];

      if (validCompFields.includes(selectedCompField)) {
        // Example filter: only return rows where selected compensation is not null or > 0
        whereClause[selectedCompField] = {
          [Op.not]: null,
        };
      }
    }

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
    if (fieldFilter.greaterThan) {
      return { [Op.gt]: fieldFilter.greaterThan };
    }
    if (fieldFilter.lesserThan) {
      return { [Op.lt]: fieldFilter.lesserThan };
    }
    if (
      fieldFilter.between &&
      Array.isArray(fieldFilter.between) &&
      fieldFilter.between.length === 2
    ) {
      return { [Op.between]: fieldFilter.between };
    }
    return null;
  }

  //   private getMultiValueFilter(filter: any): any {
  //     if (Array.isArray(filter)) {
  //       return {
  //         [Op.or]: filter.map((value: string) => ({ [Op.iLike]: `%${value}%` })),
  //       };
  //     }
  //     return null;
  //   }

  //   private applyParentAccountFilter(
  //     filters: Record<string, any>,
  //     whereClause: Record<string, any>
  //   ): Record<string, any> {
  //     if (filters.parent_account.contains) {
  //       whereClause["account_name"] = {
  //         [Op.iLike]: `%${filters.parent_account.contains}%`,
  //       };
  //       whereClause["is_parent"] = true;
  //     }
  //     if (filters.parent_account.equals) {
  //       whereClause["account_name"] = {
  //         [Op.iLike]: `${filters.parent_account.equals}`,
  //       };
  //       whereClause["is_parent"] = true;
  //     }
  //     return whereClause;
  //   }

  //   private applyAccountNumberFilter(
  //     filters: Record<string, any>,
  //     whereClause: Record<string, any>
  //   ): Record<string, any> {
  //     if (filters.account_number.contains) {
  //       whereClause = {
  //         [Op.or]: [
  //           { r_number: { [Op.like]: `%${filters.account_number.contains}%` } },
  //           {
  //             "$child_accounts.r_number$": {
  //               [Op.like]: `%${filters.account_number.contains}%`,
  //             },
  //           },
  //         ],
  //       };
  //     }
  //     if (filters.account_number.equals) {
  //       whereClause = {
  //         [Op.or]: [
  //           { r_number: { [Op.like]: `%${filters.account_number.equals}%` } },
  //           {
  //             "$child_accounts.r_number$": {
  //               [Op.like]: `%${filters.account_number.equals}%`,
  //             },
  //           },
  //         ],
  //       };
  //     }
  //     return whereClause;
  //   }

  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "resource_cost_number",
      "resource_ref_id",
      "start_date",
      "end_date",
    ];
    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_at";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  //   private getAccountIncludeOptions() {
  //     return [
  //       {
  //         model: Account,
  //         as: "child_accounts",
  //         include: [
  //           { model: Country, as: "country", attributes: ["country_name"] },
  //           { model: Currency, as: "currency", attributes: ["currency_code"] },
  //           {
  //             model: Account,
  //             as: "parent_account",
  //             attributes: ["account_name"],
  //           },
  //         ],
  //       },
  //       {
  //         model: Country,
  //         as: "country",
  //         attributes: ["country_name"],
  //         required: true,
  //       },
  //       {
  //         model: Currency,
  //         as: "currency",
  //         attributes: ["currency_code"],
  //         required: true,
  //       },
  //     ];
  //   }

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

export default ResourceCostService;
