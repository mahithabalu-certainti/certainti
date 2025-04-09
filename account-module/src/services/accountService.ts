import { Op } from "sequelize";
import { HttpStatus } from "../utils/constant";
import { IAccount, IUpdateAccount } from "../utils/types";
import SchemaService from "./schemaService";
import { models } from "../models";

const { Account, Country, Currency } = models;

class AccountService {
  private accountRepository: typeof Account | null;
  private schemaService: SchemaService;

  constructor() {
    this.accountRepository = null;
    this.schemaService = new SchemaService();
  }

  /**
   * Retrieves the Account model instance.
   * If the repository has not been initialized, it creates a new instance
   * using the database configuration.
   *
   * @returns {typeof Account} - The model for Account entities.
   */
  private getAccountRepository(): typeof Account {
    if (!this.accountRepository) {
      this.accountRepository = Account;
    }
    return this.accountRepository;
  }

  /**
   * Retrieves an account by its ID.
   *
   * @async
   * @param {number} rid - The ID of the account to retrieve.
   * @returns {Promise<{ statusCode: number, message: string, data?: { account: any } }>}
   * - An object containing the status code, message, and retrieved account data.
   */
  async accountList(
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
    data?: { account: any; count: number };
  }> {
    try {
      const repository = this.getAccountRepository();

      const { whereClause } = this.buildWhereClause(filters, search);

      const offset = (page - 1) * limit;

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );

      const order: any[] = [];

      if (finalSortBy !== "country" && finalSortBy !== "currency") {
        order.push([finalSortBy, finalSortOrder]);
      }

      if (finalSortBy === "country") {
        order.push([
          { model: Country, as: "country" },
          "country_name",
          finalSortOrder,
        ]);
      }

      if (finalSortBy === "currency") {
        order.push([
          { model: Currency, as: "currency" },
          "currency_code",
          finalSortOrder,
        ]);
      }

      const account = await repository.findAll({
        where: {
          parent_account_rid: {
            [Op.is]: null,
          } as any,
          ...whereClause,
        },
        limit,
        offset,
        order,
        subQuery: false,
        include: this.getAccountIncludeOptions(),
      });

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          account,
          count: account.length,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  async createAccount(accountData: IAccount): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { account: any };
  }> {
    try {
      const repository = this.getAccountRepository();
      let parent_account = null;
      const {
        account_name,
        account_description,
        parent_account_rid,
        account_country_rid,
        account_currency_rid,
        industry,
        primary_contact_name,
        account_country_region_rid,
        data_storage,
        status,
        annual_revenue,
      } = accountData;

      if (data_storage === "store_in_parent" && !parent_account_rid) {
        throw new Error(
          "Please select global account to store in parent account"
        );
      }

      const isUnique = await this.checkIsAccounUnique(account_name);
      if(!isUnique){
        throw new Error("Account name must be unique");
      }

      if (parent_account_rid !== null) {
        const parent_account = await repository.findOne({
          where: {
            rid: parent_account_rid,
          },
        });
        if (!parent_account) {
          throw new Error("Invalid parent account");
        }
      }

      if (data_storage === "store_in_parent" && parent_account_rid !== null) {
        parent_account = await repository.findOne({
          where: {
            rid: parent_account_rid || "",
          },
        });
      }

      const account = await repository.create({
        account_name,
        account_description: account_description || "",
        r_number: "fnfdfn",
        region: parent_account
          ? parent_account.region
          : account_country_region_rid,
        is_parent: parent_account_rid ? false : true,
        parent_account_rid: parent_account_rid || null,
        storage_type: data_storage,
        country_rid: parent_account
          ? parent_account.country_rid
          : account_country_rid,
        currency_rid: parent_account
          ? parent_account.currency_rid
          : account_currency_rid,
        industry,
        primary_contact_name,
        status,
        annual_revenue,
      });

      if (parent_account && data_storage === "store_in_parent") {
        await this.schemaService.insertAccountDetails(
          parent_account?.r_number,
          accountData,
          account.rid
        );
      } else {
        await this.schemaService.createNewSchema(account.r_number);
        await this.schemaService.insertAccountDetails(
          account.r_number,
          accountData,
          account.rid
        );
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          account,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  async updateAccount(accountData: IUpdateAccount): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { affectedCounts: number };
  }> {
    try {
      const repository = this.getAccountRepository();
      const {
        account_name,
        account_description,
        account_country_rid,
        account_currency_rid,
        industry,
        primary_contact_name,
        account_country_region_rid,
        data_storage,
        account_rid,
        annual_revenue,
      } = accountData;

      const [affectedCounts, affectedRows] = await repository.update(
        {
          account_name,
          account_description: account_description || "",
          region: account_country_region_rid,
          country_rid: account_country_rid,
          currency_rid: account_currency_rid,
          industry,
          primary_contact_name,
          annual_revenue,
        },
        {
          where: {
            rid: account_rid,
          },
          returning: true,
        }
      );

      const default_parent_id = affectedRows[0].parent_account_rid;
      const default_r_number = affectedRows[0].r_number;

      if (default_parent_id && data_storage === "separate_db") {
        this.schemaService.updateAccountDetails(
          account_rid,
          accountData,
          default_r_number
        );
      }

      if (default_parent_id === "store_in_parent") {
        this.schemaService.updateAccountDetails(
          default_parent_id,
          accountData,
          default_r_number
        );
      }

      if (default_parent_id === null) {
        this.schemaService.updateAccountDetails(
          account_rid,
          accountData,
          default_r_number
        );
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          affectedCounts,
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

  async globalAccounts(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { gloablAcconunt: any; count: number };
  }> {
    try {
      const repository = await this.getAccountRepository();
      const gloablAcconunt = await repository.findAll({
        where: {
          parent_account_rid: {
            [Op.is]: null,
          } as any,
        },
        attributes: ["rid", "account_name"],
      });
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          gloablAcconunt,
          count: gloablAcconunt.length,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  async accountById(account_id: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { accountById: any; accountDetails: any };
  }> {
    try {
      const repository = await this.getAccountRepository();
      const accountById = await repository.findOne({
        where: {
          rid: account_id,
        },
        include: [
          {
            model: Account,
            as: "child_accounts",
          },
          {
            model: Country,
            as: "country",
            attributes: ["country_name"],
            required: true,
          },
          {
            model: Currency,
            as: "currency",
            attributes: ["currency_code"],
            required: true,
          },
          {
            model: Account,
            as: "parent_account",
            attributes: ["account_name"],
          },
        ],
      });

      let acconuntNumber = accountById?.r_number || "";
      if(accountById?.storage_type === "store_in_parent"){
        const parentAccount = await repository.findOne({
          where: {
            rid: accountById.parent_account_rid || ""
          }
        })
        acconuntNumber = parentAccount?.r_number || "";
      }

      const accountDetails = await this.schemaService.fetchAccountDetails(
        acconuntNumber,
        accountById?.rid || "",
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          accountById,
          accountDetails: accountDetails.length > 0 ? accountDetails[0] : {},
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
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
        { account_name: { [Op.iLike]: `%${search}%` } },
        { r_number: { [Op.iLike]: `%${search}%` } },
        { industry: { [Op.iLike]: `%${search}%` } },
        { status: { [Op.iLike]: `%${search}%` } },
        { primary_contact_name: { [Op.iLike]: `%${search}%` } },
        { "$country.country_name$": { [Op.iLike]: `%${search}%` } },
        { "$currency.currency_code$": { [Op.iLike]: `%${search}%` } },
        ...(isNaN(parseInt(search))
          ? []
          : [{ annual_revenue: { [Op.eq]: parseInt(search) } }]),
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
      { clientField: "parent_account", dbField: "account_name" },
      { clientField: "account_number", dbField: "r_number" },
      { clientField: "account_name", dbField: "account_name" },
      { clientField: "status", dbField: "status" },
      { clientField: "industry", dbField: "industry" },
      { clientField: "country", dbField: "$country.country_name$" },
      { clientField: "currency", dbField: "$currency.currency_code$" },
      { clientField: "primary_contact", dbField: "primary_contact_name" },
      { clientField: "is_parent_account", dbField: "is_parent" },
      { clientField: "annual_revenue", dbField: "annual_revenue" },
      { clientField: "account_id", dbField: "eid" },
    ];

    filterFields.forEach(({ clientField, dbField }) => {
      if (filters[clientField]) {
        const fieldFilter = filters[clientField];
        whereClause[dbField] = this.getFieldFilter(fieldFilter, dbField);
      }
    });

    if (filters.country) {
      whereClause["$country.country_name$"] = this.getMultiValueFilter(
        filters.country
      );
    }

    if (filters.currency) {
      whereClause["$currency.currency_code$"] = this.getMultiValueFilter(
        filters.currency
      );
    }

    if (filters && filters.parent_account) {
      whereClause = this.applyParentAccountFilter(filters, whereClause);
    }

    if (filters.account_number) {
      whereClause = this.applyAccountNumberFilter(filters, whereClause);
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
  }

  private getMultiValueFilter(filter: any): any {
    if (Array.isArray(filter)) {
      return {
        [Op.or]: filter.map((value: string) => ({ [Op.iLike]: `%${value}%` })),
      };
    }
    return null;
  }

  private applyParentAccountFilter(
    filters: Record<string, any>,
    whereClause: Record<string, any>
  ): Record<string, any> {
    if (filters.parent_account.contains) {
      whereClause["account_name"] = {
        [Op.iLike]: `%${filters.parent_account.contains}%`,
      };
      whereClause["is_parent"] = true;
    }
    if (filters.parent_account.equals) {
      whereClause["account_name"] = {
        [Op.iLike]: `${filters.parent_account.equals}`,
      };
      whereClause["is_parent"] = true;
    }
    return whereClause;
  }

  private applyAccountNumberFilter(
    filters: Record<string, any>,
    whereClause: Record<string, any>
  ): Record<string, any> {
    if (filters.account_number.contains) {
      whereClause = {
        [Op.or]: [
          { r_number: { [Op.like]: `%${filters.account_number.contains}%` } },
          {
            "$child_accounts.r_number$": {
              [Op.like]: `%${filters.account_number.contains}%`,
            },
          },
        ],
      };
    }
    if (filters.account_number.equals) {
      whereClause = {
        [Op.or]: [
          { r_number: { [Op.like]: `%${filters.account_number.equals}%` } },
          {
            "$child_accounts.r_number$": {
              [Op.like]: `%${filters.account_number.equals}%`,
            },
          },
        ],
      };
    }
    return whereClause;
  }

  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "account_name",
      "status",
      "r_number",
      "industry",
      "primary_contact_name",
      "is_parent",
      "country",
      "currency",
      "annual_revenue",
    ];
    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  private getAccountIncludeOptions() {
    return [
      {
        model: Account,
        as: "child_accounts",
        include: [
          { model: Country, as: "country", attributes: ["country_name"] },
          { model: Currency, as: "currency", attributes: ["currency_code"] },
          {
            model: Account,
            as: "parent_account",
            attributes: ["account_name"],
          },
        ],
      },
      {
        model: Country,
        as: "country",
        attributes: ["country_name"],
        required: true,
      },
      {
        model: Currency,
        as: "currency",
        attributes: ["currency_code"],
        required: true,
      },
    ];
  }

  private async checkIsAccounUnique(account_name: string): Promise<boolean> {
    const response = await Account.findOne({
      where: {
        account_name,
      },
    });
    if (response && response.account_name) {
      return false;
    }
    return true;
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

export default AccountService;
