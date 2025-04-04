import sequelize from "../config/dataSource";
import { IAccount, IUpdateAccount } from "../utils/types";

class SchemaService {
  async createNewSchema(account_number: string) {
    try {
      await sequelize.createSchema(`platform_v2_${account_number}`, {});
      await this.createAccountTables(account_number);
    } catch (err) {
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
          auto_access_rd: accountData.auto_access_rd,
        },
      }
    );
  }

  async updateAccountDetails(
    account_rid: string,
    accountData: IUpdateAccount,
    account_number: string
  ) {
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
          modified_datetime: new Date(),
        },
      }
    );
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
}

export default SchemaService;
