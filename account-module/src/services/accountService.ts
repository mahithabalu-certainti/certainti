import { Op } from "sequelize";
import sequelize from "../config/dataSource";
import Account from "../models/accountModel";
import { HttpStatus } from "../utils/constant";
import { IAccount } from "../utils/types";

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
  async accountList(): Promise<{
    statusCode: number;
    message: string;
    data?: { account: any };
  }> {
    try {
      const repository = this.getAccountRepository();

      const account = await repository.findAll({
        where: {
          parent_account_rid: {
            [Op.is]: null,
          } as any,
        },
        include: [
          {
            model: Account,
            as: "child_accounts",
          },
        ],
      });

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
      };
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
        data_storage
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
      });

      if (data_storage === "store_in_parent") {
        await this.insertAccountDetails(
          account.parent_account_rid,
          accountData
        );
      } else {
        await this.createNewSchema(account.rid);
        await this.insertAccountDetails(account.rid, accountData);
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

  async createNewSchema(accountId: string) {
    try {
      await sequelize.createSchema(`account_${accountId}`, {});
      await this.createAccountTables(accountId);
    } catch (err) {
      console.error("Error creating schema and tables: ", err);
      throw new Error("Error creating schema and tables.");
    }
  }

  async createAccountTables(accountId: string) {
    const schemaName = `account_${accountId}`;

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."account_details" (
        rid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        status VARCHAR(20) CHECK (status IN ('active', 'inactive')) NOT NULL,
        account_rid UUID NOT NULL,
        tax_claim_level VARCHAR(50) NOT NULL,
        max_ai_interactions INT CHECK (max_ai_interactions BETWEEN 3 AND 5) NOT NULL,
        autosend_interaction BOOLEAN NOT NULL,
        fiscal_start_date VARCHAR(10) NOT NULL,
        fiscal_end_date VARCHAR(10) NOT NULL,
        interaction_cc_list VARCHAR,
        blended_rate_fte VARCHAR(10),
        blended_rate_subcon VARCHAR(10),
        created_by VARCHAR(255),
        modified_by VARCHAR(255),
        primary_contact VARCHAR(50) NOT NULL,
        contact_number VARCHAR(50) NOT NULL,
        point_of_contact VARCHAR(25) NOT NULL,
        poc_email VARCHAR(50) NOT NULL,
        poc_number VARCHAR(50) NOT NULL,
        website VARCHAR(50),
        project_manager VARCHAR(50) NOT NULL,
        annual_revenue VARCHAR(50) NOT NULL,
        data_residency VARCHAR(255),
        data_storage VARCHAR(255) CHECK (data_storage IN ('separate_db', 'store_in_parent'))
      );
    `);
  }

  async insertAccountDetails(account_rid: string, accountData: IAccount) {
    try {
      const schemaName = `account_${account_rid}`;

      await sequelize.query(
        `
        INSERT INTO "${schemaName}"."account_details" (
          status, account_rid, tax_claim_level, max_ai_interactions, 
          autosend_interaction, fiscal_start_date, fiscal_end_date, 
          interaction_cc_list, blended_rate_fte, blended_rate_subcon, 
          created_by, modified_by, primary_contact, contact_number, 
          point_of_contact, poc_email, poc_number, website, 
          project_manager, annual_revenue, 
          data_residency, data_storage
        ) 
        VALUES (
          'active', :account_rid, :tax_claim_level, :max_ai_interactions, 
          :autosend_interaction, :fiscal_start_date, :fiscal_end_date, 
          :interaction_cc_list, :blended_rate_fte, :blended_rate_subcon, 
          :created_by, :modified_by, :primary_contact, :contact_number, 
          :point_of_contact, :poc_email, :poc_number, :website, 
          :project_manager, :annual_revenue, 
          :data_residency, :data_storage
        );
      `,
        {
          replacements: {
            account_rid: account_rid,
            tax_claim_level: accountData.data_residency,
            max_ai_interactions: accountData.max_ai_interactions,
            autosend_interaction: accountData.autosend_interaction,
            fiscal_start_date: accountData.fiscal_start_date,
            fiscal_end_date: accountData.fiscal_end_date,
            interaction_cc_list: accountData.interaction_cc_list ?? null,
            blended_rate_fte: accountData.blended_rate_fte ?? null,
            blended_rate_subcon: accountData.blended_rate_subcon ?? null,
            created_by: "Admin",
            modified_by: "Admin",
            primary_contact: accountData.primary_contact,
            contact_number: accountData.contact_number,
            point_of_contact: accountData.contact_number,
            poc_email: accountData.poc_email,
            poc_number: accountData.poc_number,
            website: accountData.website ?? null,
            project_manager: accountData.project_manager,
            annual_revenue: accountData.annual_revenue,
            data_residency: accountData.data_residency ?? null,
            data_storage: accountData.data_storage ?? null,
          },
        }
      );
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  buildWhereClause(
    filters: Record<string, any>,
    search: string
  ): Record<string, any> {
    let whereClause: Record<string, any> = {};

    if (search) {
      const searchCondition = {
        [Op.or]: [
          { account_name: { [Op.iLike]: `%${search}%` } },
          { r_number: { [Op.iLike]: `%${search}%` } },
          { parent_account: { [Op.iLike]: `%${search}%` } },
          { industry: { [Op.iLike]: `%${search}%` } },
          { country: { [Op.iLike]: `%${search}%` } },
          { currecy: { [Op.iLike]: `%${search}%` } },
          { status: { [Op.iLike]: `%${search}%` } },
          { primary_contact_name: { [Op.iLike]: `%${search}%` } },
        ],
      };

      if (Object.keys(whereClause).length > 0) {
        whereClause = {
          [Op.and]: [whereClause, searchCondition],
        };
      } else {
        whereClause = searchCondition;
      }
    }

    const filterFields = [
      { clientField: "user_name", dbField: "first_name" },
      { clientField: "full_name", dbField: "full_name" },
      { clientField: "email", dbField: "email" },
      { clientField: "status", dbField: "status" },
    ];

    filterFields.forEach((fieldMapping) => {
      const { clientField, dbField } = fieldMapping;

      if (filters[clientField]) {
        const fieldFilter = filters[clientField];

        if (fieldFilter.startsWith) {
          whereClause[dbField] = { [Op.iLike]: `${fieldFilter.startsWith}%` };
        } else if (fieldFilter.endWith) {
          whereClause[dbField] = { [Op.iLike]: `%${fieldFilter.endWith}` };
        } else if (fieldFilter.contains) {
          whereClause[dbField] = { [Op.iLike]: `%${fieldFilter.contains}%` };
        } else if (fieldFilter.value) {
          whereClause[dbField] = fieldFilter.value;
        }
      }
    });

    if (filters.profile && filters.profile.startsWith) {
      whereClause["$profile.profile_name$"] = {
        [Op.iLike]: `%${filters.profile.startsWith}%`,
      };
    }

    return whereClause;
  }
}

export default AccountService;
