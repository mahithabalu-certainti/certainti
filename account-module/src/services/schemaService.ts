import { initOrgSequelize } from "../config/orgdbDataSource";
import { IAccount, IUpdateAccount } from "../utils/types";

class SchemaService {
  async createNewSchema(account_number: string) {
    try {
      const sequelize = await initOrgSequelize();
      await sequelize.createSchema(`platform_v2_${account_number}`, {});
      await this.createAccountTables(account_number);
    } catch (err) {
      console.log(err)
      throw new Error("Error creating schema and tables.");
    }
  }

  async createAccountTables(account_number: string) {
    const schemaName = `platform_v2_${account_number}`;
    const sequelize = await initOrgSequelize();
    await this.createAccountDetailsTable(schemaName, sequelize);
    await this.createAccountFiscalTable(schemaName, sequelize);
    await this.createProjectTable(schemaName, sequelize);
    await this.createDocumentTable(schemaName, sequelize);
    await this.createImportTable(schemaName, sequelize);
    await this.createKafkaEventsTable(schemaName, sequelize);
  }

  private async createAccountDetailsTable(schemaName: string, sequelize: any) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."account_details" (
        rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_rid UUID NOT NULL UNIQUE,
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
        business_details VARCHAR(2000) NOT NULL,
        created_datetime DATE DEFAULT CURRENT_TIMESTAMP NULL,
        modified_datetime DATE DEFAULT CURRENT_TIMESTAMP NULL
      );
    `);
  }

  private async createAccountFiscalTable(schemaName: string, sequelize: any) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."account_fiscal" (
        rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        r_number VARCHAR(100) NOT NULL,
        eid UUID,
        fiscal_year VARCHAR(10) NOT NULL,
        account_rid UUID NOT NULL REFERENCES "${schemaName}"."account_details"(account_rid),
        parent_account_rid UUID,
        tax_claim_level VARCHAR(50),
        blended_rate_fte VARCHAR(10),
        blended_rate_subcon VARCHAR(10),
        total_projects INT,
        total_fte INT,
        total_subcon INT,
        total_project_hours_fte INT,
        total_project_hours_subcon INT,
        total_project_hours INT,
        total_project_cost_fte VARCHAR(20),
        total_project_cost_subcon VARCHAR(20),
        total_project_cost_nonlabor VARCHAR(20),
        total_project_cost VARCHAR(20),
        total_project_qre_fte VARCHAR(20),
        total_project_qre_subcon VARCHAR(20),
        total_projects_qre VARCHAR(20),
        total_projects_rd_credits_fte VARCHAR(20),
        total_projects_rd_credits_subcon VARCHAR(20),
        total_projects_rd_credits VARCHAR(20),
        total_qualifying_projects_fed INT,
        qualifying_fte_fed INT,
        qualifying_subcon_fed INT,
        qualifying_project_hours_fte_fed INT,
        qualifying_project_hours_subcon_fed INT,
        qualifying_project_hours_fed INT,
        qualifying_project_cost_fte_fed VARCHAR(20),
        qualifying_project_cost_subcon_fed VARCHAR(20),
        qualifying_project_cost_nonlabor_fed VARCHAR(20),
        qualifying_project_cost_fed VARCHAR(20),
        qualifying_project_qre_fte_fed VARCHAR(20),
        qualifying_project_qre_subcon_fed VARCHAR(20),
        qualifying_project_qre_fed VARCHAR(20),
        qualifying_project_rd_credits_fte_fed VARCHAR(20),
        qualifying_project_rd_credits_subcon_fed VARCHAR(20),
        qualifying_project_rd_credits_fed VARCHAR(20),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  private async createProjectTable(schemaName: string, sequelize: any) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."project" (
        rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        r_number VARCHAR(100) NOT NULL,
        project_name VARCHAR(255) NOT NULL,
        eid UUID,
        account_rid UUID NOT NULL REFERENCES "${schemaName}"."account_details"(account_rid),
        account_fiscal_rid UUID REFERENCES "${schemaName}"."account_fiscal"(rid),
        project_description TEXT,
        project_status VARCHAR(50),
        project_startdate DATE,
        project_enddate DATE,
        blended_rate DECIMAL(18,2),
        project_summary TEXT,
        industry_rid VARCHAR(100),
        industry_name VARCHAR(100),
        project_ref_id VARCHAR(100) NOT NULL,
        country VARCHAR(100),
        currency VARCHAR(3),
        city VARCHAR(100),
        region VARCHAR(100),
        project_manager VARCHAR(100),
        project_lead VARCHAR(100),
        spoc_name VARCHAR(100),
        spoc_email VARCHAR(100),
        spoc_mobile VARCHAR(20),
        ptp_contact_name VARCHAR(100),
        ptp_email VARCHAR(100),
        ptp_contact_mobile VARCHAR(20),
        project_cc_list TEXT,
        account_billing_type VARCHAR(50),
        total_effort INT CHECK (total_effort >= 0),
        total_cost DECIMAL(18,2) CHECK (total_cost >= 0),
        total_fte INT CHECK (total_fte >= 0),
        total_sub_con INT CHECK (total_sub_con >= 0),
        totalnon_labor_cost DECIMAL(18,2) CHECK (totalnon_labor_cost >= 0),
        total_fte_effort INT CHECK (total_fte_effort >= 0),
        total_subcon_effort INT CHECK (total_subcon_effort >= 0),
        total_fte_cost DECIMAL(18,2) CHECK (total_fte_cost >= 0),
        total_subcon_cost DECIMAL(18,2) CHECK (total_subcon_cost >= 0),
        last_rd_ai_assessed_on TIMESTAMPTZ,
        last_rd_ai_assessed_by VARCHAR(100),
        program_name VARCHAR(100),
        client_organization VARCHAR(100),
        project_classification VARCHAR(100),
        project_client_group VARCHAR(100),
        project_group VARCHAR(100),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }


  private async createDocumentTable(schemaName: string, sequelize: any) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."document" (
        rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        r_number VARCHAR(100) NOT NULL,
        eid UUID,
        account_rid UUID REFERENCES "${schemaName}"."account_details"(account_rid),
        related_to VARCHAR(50) NOT NULL,
        related_to_rid UUID,
        document_source VARCHAR(100) NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        document_format VARCHAR(10) NOT NULL,
        document_version VARCHAR(10),
        document_url VARCHAR(2048) NOT NULL,
        bypass_rd_assessment BOOLEAN DEFAULT false,
        document_size VARCHAR(100) NOT NULL,
        document_status VARCHAR(100) NOT NULL,
        failure_reason TEXT,
        created_by UUID,
        modified_by UUID,
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  private async createImportTable(schemaName: string, sequelize: any) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."import" (
        rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        r_number VARCHAR(100) NOT NULL,
        eid UUID,
        account_rid UUID REFERENCES "${schemaName}"."account_details"(account_rid),
        project_rid UUID REFERENCES "${schemaName}"."project"(rid),
        uploaded_by_user_rid UUID,
        related_to VARCHAR(50) NOT NULL,
        related_to_rid UUID,
        entity_type VARCHAR(100),
        uploaded_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        document_name VARCHAR(255) NOT NULL,
        document_rid UUID REFERENCES "${schemaName}"."document"(rid),
        upload_status VARCHAR(100) NOT NULL,
        upload_failure_reason TEXT,
        staging_table VARCHAR(100),
        staging_status VARCHAR(100),
        staging_start_timestamp TIMESTAMPTZ,
        staging_end_timestamp TIMESTAMPTZ,
        staging_error TEXT,
        total_records INT,
        total_staging_processed INT,
        target_load_status VARCHAR(100),
        target_load_start_timestamp TIMESTAMPTZ,
        target_load_end_timestamp TIMESTAMPTZ,
        target_load_error_records_count INT,
        target_ai_records_processed INT,
        target_ai_error_records_count INT,
        created_by UUID,
        modified_by UUID,
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  private async createKafkaEventsTable(schemaName: string, sequelize: any) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."kafka_events" (
        rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        r_number VARCHAR(100) NOT NULL,
        eid UUID,
        source_name VARCHAR(100) NOT NULL,
        producer_id UUID,
        document_rid UUID REFERENCES "${schemaName}"."document"(rid),
        document_name VARCHAR(255),
        document_upload_rid UUID REFERENCES "${schemaName}"."import"(rid),
        topic_name VARCHAR(255) NOT NULL,
        related_to VARCHAR(50),
        related_to_rid UUID,
        consumer_id UUID,
        message_on_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) NOT NULL,
        error_description TEXT,
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async insertAccountDetails(
    account_number: string,
    accountData: IAccount,
    account_rid: string,
    userId: string
  ) {
    const schemaName = `platform_v2_${account_number}`;
    const sequelize = await initOrgSequelize();
    await sequelize.query(
      `
        INSERT INTO "${schemaName}"."account_details" (
          account_rid, max_ai_interactions, 
          autosend_interaction, fiscal_start_date, fiscal_end_date, 
          interaction_cc_list, blended_rate_fte, blended_rate_subcon, 
          created_by, modified_by, primary_contact_email, primary_contact_number, 
          finance_poc_name, finance_poc_email, finanace_poc_number, website, 
          project_manager, 
          data_residency, data_storage, auto_access_rd,business_details
        ) 
        VALUES (
          :account_rid, :max_ai_interactions, 
          :autosend_interaction, :fiscal_start_date, :fiscal_end_date, 
          :interaction_cc_list, :blended_rate_fte, :blended_rate_subcon, 
          :created_by, :modified_by, :primary_contact_email, :primary_contact_number, 
          :finance_poc_name, :finance_poc_email, :finanace_poc_number, :website, 
          :project_manager, 
          :data_residency, :data_storage, :auto_access_rd,:business_details
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
          created_by: userId,
          modified_by: userId,
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
          business_details:accountData.business_details
        },
      }
    );
  }

  async updateAccountDetails(
    account_rid: string,
    accountData: IUpdateAccount,
    account_number: string,
    userId: string
  ) {
    const schemaName = `platform_v2_${account_number}`;

    const sequelize = await initOrgSequelize();

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
          modified_datetime = :modified_datetime,
          business_details = :business_details
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
          modified_by: userId,
          primary_contact_email: accountData.primary_contact_email,
          primary_contact_number: accountData.primary_contact_number,
          finance_poc_name: accountData.finance_poc_name,
          finance_poc_email: accountData.finance_poc_email,
          finanace_poc_number: accountData.finance_poc_number,
          website: accountData.website ?? null,
          project_manager: accountData.project_manager,
          auto_access_rd: accountData.auto_access_rd,
          business_details:accountData.business_details,
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

      const sequelize = await initOrgSequelize();

      const users = await sequelize.query(query, {
        replacements: { account_rid },
        type: "SELECT",
      });
      return users;
    } catch (err) {
      throw new Error("Error retrieving account details");
    }
  }

  async fetchKeyContacts(account_rid: string) {
    const sequelize = await initOrgSequelize();
    return await sequelize.query(
      `SELECT * FROM "public"."key_contact_details" WHERE account_rid = :account_rid`,
      {
        type: "SELECT",
        replacements: { account_rid },
      }
    );
  }
  async inserKeyContactDetails(
    accountData: IAccount,
    account_rid: string,
    userId: string,
) {
  const keyContactDetails = accountData.key_contacts;
      const sequelize = await initOrgSequelize();
      try {
        const result = await sequelize.query(
          `SELECT key_contact_id FROM "public"."key_contact_details" 
           ORDER BY key_contact_id DESC LIMIT 1;`,
          {
            type: "SELECT",
            plain: true,
          }
        ) as { key_contact_id: string };
        
        const keyContactId = result?.key_contact_id ?? '';
        let lastKeyId = keyContactId.startsWith('KEY') ? parseInt(keyContactId.replace("KEY", "")) : 0; // Direct check for 'KEY'  
        const insertQueries = keyContactDetails.map((contact:any) => {
          lastKeyId++;
          const key_contact_id = `KEY${String(lastKeyId).padStart(3, '0')}`;
            return sequelize.query(
            `INSERT INTO "public"."key_contact_details" (
              key_contact_id,account_rid, key_contact_name, 
              key_contact_email, key_contact_role, status, 
              is_primary_contact, include_in_communication, 
              created_by, modified_by
            ) VALUES (
              :key_contact_id,:account_rid, :key_contact_name, 
              :key_contact_email, :key_contact_role, :key_contact_status, 
              :is_primary_contact, :include_in_communication, 
              :created_by, :modified_by
            );`,
            {
              replacements: {
                key_contact_id: key_contact_id,
                account_rid: account_rid,
                key_contact_name: contact.key_contact_name,
                key_contact_email: contact.key_contact_email,
                key_contact_role: contact.key_contact_role,
                key_contact_status: contact.status,
                is_primary_contact: contact.is_primary_contact,
                include_in_communication: contact.include_in_communication,
                created_by: userId,
                modified_by: userId,
              },
            }
          );
        });
    
        await Promise.all(insertQueries);
      } catch (error) {
        console.error("Error inserting key contact details:", error);
        throw error;
      }
  }

}

export default SchemaService;
