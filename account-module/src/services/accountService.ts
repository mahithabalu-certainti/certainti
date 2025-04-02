import { Op, where } from "sequelize";
import sequelize from "../config/dataSource";
import Account from "../models/accountModel";
import { HttpStatus } from "../utils/constant";
import { IAccount, IUpdateAccount } from "../utils/types";
import { Country } from "../models/countryModel";
import { Currency } from "../models/currencyModel";

class AccountService {
  private accountRepository: typeof Account | null;

  constructor() {
    this.accountRepository = null;
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

      const account = await repository.findAll({
        where: {
          parent_account_rid: {
            [Op.is]: null,
          } as any,
          ...whereClause,
        },
        limit,
        offset,
        order: [[finalSortBy, finalSortOrder]],
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
      console.log("Error ", err);
      return this.throwServiceError(err as Error);
    }
  }

  async createAccount(accountData: IAccount) {
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
        await this.insertAccountDetails(
          parent_account?.r_number,
          accountData,
          account.rid
        );
      } else {
        await this.createNewSchema(account.r_number);
        await this.insertAccountDetails(
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
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: (err as Error).message,
      };
    }
  }

  async updateAccount(accountData: IUpdateAccount) {
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
        parent_account_rid,
        r_number,
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
        this.updateAccountDetails(account_rid, accountData, default_r_number);
      }

      if (default_parent_id === "store_in_parent") {
        this.updateAccountDetails(
          default_parent_id,
          accountData,
          default_r_number
        );
      }

      if (default_parent_id === null) {
        this.updateAccountDetails(account_rid, accountData, default_r_number);
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

  async gloablAcconunts() {
    try {
      const repository = await this.getAccountRepository();
      const gloablAcconunts = await repository.findAll({
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
          gloablAcconunts,
          count: gloablAcconunts.length,
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

  async accountById(account_id: string) {
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
        ],
      });
      const accountDetails = await this.fetchAccountDetails(
        accountById?.r_number || "",
        accountById?.rid || ""
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
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: (err as Error).message,
      };
    }
  }

  async createNewSchema(account_number: string) {
    try {
      await sequelize.createSchema(`platform_v2_${account_number}`, {});
      await this.createAccountTables(account_number);
    } catch (err) {
      console.error("Error creating schema and tables: ", err);
      throw new Error("Error creating schema and tables.");
    }
  }

  async createAccountTables(account_number: string) {
    const schemaName = `platform_v2_${account_number}`;

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."account_details" (
        rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_rid UUID NOT NULL,
        tax_claim_level VARCHAR(50) NULL,
        max_ai_interactions INT CHECK (max_ai_interactions BETWEEN 3 AND 5) NOT NULL,
        autosend_interaction BOOLEAN NOT NULL,
        fiscal_start_date VARCHAR(10) NOT NULL,
        fiscal_end_date VARCHAR(10) NOT NULL,
        interaction_cc_list VARCHAR,
        blended_rate_fte VARCHAR(10),
        blended_rate_subcon VARCHAR(10),
        created_by VARCHAR(255),
        modified_by VARCHAR(255),
        primary_contact_email VARCHAR(50) NOT NULL,
        primary_contact_number VARCHAR(50) NOT NULL,
        finance_poc_name VARCHAR(25) NOT NULL,
        finance_poc_email VARCHAR(50) NOT NULL,
        finanace_poc_number VARCHAR(50) NOT NULL,
        website VARCHAR(50),
        project_manager VARCHAR(50) NOT NULL,
        data_residency VARCHAR(255),
        data_storage VARCHAR(255) CHECK (data_storage IN ('separate_db', 'store_in_parent')),
        auto_access_rd BOOLEAN NOT NULL,
        created_datetime DATE DEFAULT CURRENT_TIMESTAMP NULL,
        modified_datetime DATE DEFAULT CURRENT_TIMESTAMP NULL
      );
    `);
  }

  async insertAccountDetails(
    account_number: string,
    accountData: IAccount,
    account_rid: string
  ) {
    try {
      const schemaName = `platform_v2_${account_number}`;

      await sequelize.query(
        `
        INSERT INTO "${schemaName}"."account_details" (
          account_rid, max_ai_interactions, 
          autosend_interaction, fiscal_start_date, fiscal_end_date, 
          interaction_cc_list, blended_rate_fte, blended_rate_subcon, 
          created_by, modified_by, primary_contact_email, primary_contact_number, 
          finance_poc_name, finance_poc_email, finanace_poc_number, website, 
          project_manager, 
          data_residency, data_storage, auto_access_rd
        ) 
        VALUES (
          :account_rid, :max_ai_interactions, 
          :autosend_interaction, :fiscal_start_date, :fiscal_end_date, 
          :interaction_cc_list, :blended_rate_fte, :blended_rate_subcon, 
          :created_by, :modified_by, :primary_contact_email, :primary_contact_number, 
          :finance_poc_name, :finance_poc_email, :finanace_poc_number, :website, 
          :project_manager, 
          :data_residency, :data_storage, :auto_access_rd
        );
      `,
        {
          replacements: {
            account_rid: account_rid,
            max_ai_interactions: accountData.max_ai_interactions,
            autosend_interaction: accountData.autosend_interaction,
            fiscal_start_date: accountData.fiscal_start_date,
            fiscal_end_date: accountData.fiscal_end_date,
            interaction_cc_list: accountData.interaction_cc_list ?? null,
            blended_rate_fte: accountData.blended_rate_fte ?? null,
            blended_rate_subcon: accountData.blended_rate_subcon ?? null,
            created_by: "Admin",
            modified_by: "Admin",
            primary_contact_email: accountData.primary_contact_email,
            primary_contact_number: accountData.primary_contact_number,
            finance_poc_name: accountData.finance_poc_name,
            finance_poc_email: accountData.finance_poc_email,
            finanace_poc_number: accountData.finance_poc_number,
            website: accountData.website ?? null,
            project_manager: accountData.project_manager,
            data_residency: accountData.data_residency ?? null,
            data_storage: accountData.data_storage ?? null,
            auto_access_rd: accountData.auto_access_rd
          },
        }
      );
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  async updateAccountDetails(
    account_rid: string,
    accountData: IUpdateAccount,
    account_number: string
  ) {
    try {
      const schemaName = `platform_v2_${account_number}`;

      await sequelize.query(
        `
        UPDATE "${schemaName}"."account_details"
        SET 
          max_ai_interactions = :max_ai_interactions,
          autosend_interaction = :autosend_interaction,
          interaction_cc_list = :interaction_cc_list,
          blended_rate_fte = :blended_rate_fte,
          blended_rate_subcon = :blended_rate_subcon,
          modified_by = :modified_by,
          primary_contact_email = :primary_contact_email,
          primary_contact_number = :primary_contact_number,
          finance_poc_name = :finance_poc_name,
          finance_poc_email = :finance_poc_email,
          finanace_poc_number = :finanace_poc_number,
          website = :website,
          project_manager = :project_manager,
          auto_access_rd = :auto_access_rd,
          modified_datetime = :modified_datetime
        WHERE account_rid = :account_rid;
      `,
        {
          replacements: {
            account_rid: account_rid,
            max_ai_interactions: accountData.max_ai_interactions,
            autosend_interaction: accountData.autosend_interaction,
            interaction_cc_list: accountData.interaction_cc_list ?? null,
            blended_rate_fte: accountData.blended_rate_fte ?? null,
            blended_rate_subcon: accountData.blended_rate_subcon ?? null,
            modified_by: "Admin",
            primary_contact_email: accountData.primary_contact_email,
            primary_contact_number: accountData.primary_contact_number,
            finance_poc_name: accountData.finance_poc_name,
            finance_poc_email: accountData.finance_poc_email,
            finanace_poc_number: accountData.finance_poc_number,
            website: accountData.website ?? null,
            project_manager: accountData.project_manager,
            auto_access_rd: accountData.auto_access_rd,
            modified_datetime: new Date()
          },
        }
      );
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  async fetchAccountDetails(account_number: string, account_rid: string) {
    try {
      const query = `
        SELECT * FROM "platform_v2_${account_number}".account_details WHERE account_rid = :account_rid
      `;

      const users = await sequelize.query(query, {
        replacements: { account_rid },
        type: "SELECT",
      });
      return users;
    } catch (err) {
      throw new Error("Error retrieving account details");
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
      { clientField: "country", dbField: "country" },
      { clientField: "currency", dbField: "currency" },
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

    if (filters.parent_account) {
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
    return null;
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
