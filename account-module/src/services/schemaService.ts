import { QueryTypes } from "sequelize";
import { initSequelize } from "../config/maindbDataSource";
import { initOrgSequelize } from "../config/orgdbDataSource";
import { setupKeyContactsSequence } from "../models/projectSummary";
import { R_NUMBER_PREFIX } from "../utils/constant";
import { getTableSchemaByEntity} from  "../utils/helpers";
import {
  IAccount,
  IUpdateAccount,
  IKeyContactDetail,
  IUpdateKeyContactDetail,
} from "../utils/types";
import Decimal from "decimal.js";
class SchemaService {
  async createNewSchema(account_number: string) {
    try {
      const sequelize = await initOrgSequelize();
      await sequelize.createSchema(`platform_v2_${account_number}`, {});
      await this.createAccountTables(account_number);
    } catch (err) {
      console.log(err);
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
    await this.createKeyContact(schemaName, sequelize);
    await setupKeyContactsSequence(sequelize, schemaName);
    await this.createClientFirmDocumentTemplate(schemaName,sequelize)
    await this.createClientFirmDocumentTemplateMetadata(schemaName,sequelize)

    await this.createResourcesTable(schemaName,sequelize);
    await this.createResourceHistoryTable(schemaName,sequelize)
    await this.createResourceTimelineTable(schemaName,sequelize)
    await this.createResourceCostTable(schemaName,sequelize)
    await this.createResourceCostTimelineTable(schemaName,sequelize)
    await this.createResourceCostHistoryTable(schemaName,sequelize)
    await this.createResourceSkillTable(schemaName,sequelize)
    await this.createResourceSkillTimelineTable(schemaName,sequelize)
    await this.createResourceSkillHistoryTable(schemaName,sequelize)

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
        blended_rate_fte VARCHAR(20),
        blended_rate_subcon VARCHAR(20),
        created_by VARCHAR(255),
        modified_by VARCHAR(255),
        website VARCHAR(50),
        data_residency VARCHAR(255),
        data_storage VARCHAR(255) CHECK (data_storage IN ('separate_db', 'store_in_parent')),
        auto_access_rd BOOLEAN NOT NULL,
        business_details VARCHAR(2000) NOT NULL,
        created_datetime DATE DEFAULT CURRENT_TIMESTAMP NULL,
        modified_datetime DATE DEFAULT CURRENT_TIMESTAMP NULL
      );
    `);
  }

  async fetchKeyContactRoles(): Promise<any[]> {
    const sequelize = await initSequelize();
    const result = await sequelize.query(`
      SELECT *
      FROM "public".key_contact_role
      ORDER BY role_name ASC;
    `);
    return result[0];
  }

  private async createAccountFiscalTable(schemaName: string, sequelize: any) {

    // First, create the sequence (if needed)
    await sequelize.query(`
     CREATE SEQUENCE IF NOT EXISTS "${schemaName}".account_fiscal_seq START 1;
   `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."account_fiscal" (
        rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        r_number VARCHAR(20) DEFAULT 'ACF ' || LPAD(nextval('"${schemaName}".account_fiscal_seq')::text, 10, '0'),        
        eid UUID,
        fiscal_year VARCHAR(10) NOT NULL,
        account_rid UUID NOT NULL REFERENCES "${schemaName}"."account_details"(account_rid),
        parent_account_rid UUID,
        tax_claim_level VARCHAR(50),
        blended_rate_fte VARCHAR(20),
        blended_rate_subcon VARCHAR(20),
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

    // First, create the sequence (if needed)
    await sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_seq START 1;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."project" (
      rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      r_number VARCHAR(20) DEFAULT 'PRJ ' || LPAD(nextval('"${schemaName}".project_seq')::text, 10, '0'),      
      eid UUID,
      account_rid UUID NOT NULL REFERENCES "${schemaName}"."account_details"(account_rid),
      account_fiscal_rid UUID REFERENCES "${schemaName}"."account_fiscal"(rid),
      project_code VARCHAR(50) NOT NULL UNIQUE,
      industry_rid UUID,
      industry_name VARCHAR(100),
      program_name VARCHAR(255),
      project_name VARCHAR(255),
      project_startdate DATE,
      project_enddate DATE,
      project_type VARCHAR(50) CHECK (project_type IN ('Fixed', 'Time & Material')),
      project_classification_rid UUID,
      project_classification_other VARCHAR(300),
      project_client_group VARCHAR(100),
      project_group VARCHAR(100),
      project_status VARCHAR(50) CHECK (project_status IN ('Active', 'Inactive')),
      fiscal_year INTEGER NOT NULL,
      country UUID,
      region UUID,
      currency UUID,
      total_effort DECIMAL(18,2),
      total_cost DECIMAL(18,2) CHECK (total_cost >= 0),
      total_fte INTEGER CHECK (total_fte >= 0),
      total_sub_con INTEGER CHECK (total_sub_con >= 0),
      total_non_labor_cost DECIMAL(18,2),
      total_fte_effort DECIMAL(18,2),
      total_sub_con_effort DECIMAL(18,2),
      total_fte_cost DECIMAL(18,2),
      total_sub_con_cost DECIMAL(18,2),
      auto_send_ai_interaction BOOLEAN NOT NULL DEFAULT false,
      auto_access_rd BOOLEAN DEFAULT false,
      max_ai_interaction INTEGER NOT NULL,
      blended_rate DECIMAL(18,2),
      blended_rate_fte DECIMAL(18,2),
      blended_rate_sub_con DECIMAL(18,2),
      project_description TEXT,
      qualified_research_expenditure DECIMAL(18,2),
      is_rd_qualified BOOLEAN,
      qre INTEGER,
      comments TEXT,
      created_by UUID NOT NULL,
      modified_by UUID,
      created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      modified_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    `);
  }

  private async createDocumentTable(schemaName: string, sequelize: any) {

    // First, create the sequence (if needed)
    await sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".doc_seq START 1;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."document" (
        rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        r_number VARCHAR(20) DEFAULT 'DOC ' || LPAD(nextval('"${schemaName}".doc_seq')::text, 10, '0'),      
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

    // First, create the sequence (if needed)
    await sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".import_seq START 1;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."import" (
        rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        r_number VARCHAR(20) DEFAULT 'IMP ' || LPAD(nextval('"${schemaName}".import_seq')::text, 10, '0'),      
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

  private async createClientFirmDocumentTemplate(schemaName: string, sequelize: any) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."clientfirm_document_template" (
        rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        eid UUID,
        client_document_template_name VARCHAR(100) NOT NULL,
        account_rid UUID NOT NULL,
        entity_type VARCHAR(500) NOT NULL,
        version VARCHAR(10),
        status VARCHAR(50) NOT NULL
      );
    `);
  }
  
  private async createClientFirmDocumentTemplateMetadata(schemaName: string, sequelize: any) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."clientfirm_document_template_metadata" (
        rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        eid UUID,
        account_rid UUID NOT NULL,
        client_template_rid UUID NOT NULL,
        sheet_name VARCHAR(100), 
        col_seq VARCHAR(100) NOT NULL,
        col_name VARCHAR(100) NOT NULL,
        col_type VARCHAR(100) NOT NULL
      );
    `);
  }
  
  private async createKafkaEventsTable(schemaName: string, sequelize: any) {
     // First, create the sequence (if needed)
    await sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".kafka_events_seq START 1;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."kafka_events" (
        rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        r_number VARCHAR(20) DEFAULT 'KFE ' || LPAD(nextval('"${schemaName}".kafka_events_seq')::text, 10, '0'),      
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

   private async createResourcesTable(schemaName: string, sequelize: any) {
     await sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resources_seq START 1;
    `);
     await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".resources (
      rid uuid NOT NULL DEFAULT gen_random_uuid(),
      r_number character varying(20) DEFAULT ('RES ' || lpad((nextval('"${schemaName}".resources_seq'))::text, 10, '0')),
      eid character varying(50),
      account_rid uuid NOT NULL,
      resource_code character varying(50) NOT NULL,
      resource_type VARCHAR(50) CHECK (resource_type IN ('Full-Time','Sub Con','Non-Labor')),
      resource_name character varying(200),
      resource_firstname character varying(100),
      resource_lastname character varying(100),
      resource_orgname character varying(100),
      resource_role character varying(100),
      resource_country uuid,
      resource_region uuid,
      resource_city uuid,
      resource_startdate timestamp with time zone,
      resource_enddate timestamp with time zone,
      resource_designation character varying(100),
      resource_total_experience numeric(4,2),
      resource_total_experience_organization numeric(4,2),
      resource_status VARCHAR(50) CHECK (resource_status IN ('Active','Inactive')),
      created_datetime timestamp with time zone NOT NULL,
      modified_datetime timestamp with time zone NOT NULL,
      created_by uuid,
      modified_by uuid,
      comments text,
      CONSTRAINT resources_pkey PRIMARY KEY (rid),
      CONSTRAINT resources_resource_code_key UNIQUE (resource_code))
     `)
   }

   private async createResourceHistoryTable(schemaName: string, sequelize: any) {
     await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_history_seq START 1`);

     await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".resources_history
      (
          rid uuid NOT NULL DEFAULT gen_random_uuid(),
          r_number varchar(20) DEFAULT (
            'REH ' || lpad((nextval('"${schemaName}".resource_history_seq'::regclass))::text, 10, '0')
          ),
          resource_rid uuid NOT NULL,
          attribute_name varchar(100) NOT NULL,
          old_value varchar(1000),
          new_value varchar(1000) NOT NULL,
          modified_datetime timestamptz NOT NULL,
          created_datetime timestamptz NOT NULL,
          modified_by uuid NOT NULL,
          CONSTRAINT resources_history_pkey PRIMARY KEY (rid)
      )
     `)
   }

  private async createResourceTimelineTable(schemaName: string, sequelize: any) {
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_timeline_seq START 1`);

     await sequelize.query(`
     CREATE TABLE IF NOT EXISTS "${schemaName}".resources_timeline (
        rid uuid NOT NULL DEFAULT gen_random_uuid(),
        r_number varchar(20) DEFAULT ('RTL ' || lpad((nextval('"${schemaName}".resource_timeline_seq'::regclass))::text, 10, '0')),
        account_rid uuid NOT NULL,
        entity_rid uuid NOT NULL,
        event_name varchar(100) NOT NULL,
        event_type varchar(100) NOT NULL,
        event_status varchar(100) NOT NULL,
        event_datetime timestamptz NOT NULL,
        modified_by uuid NOT NULL,
        CONSTRAINT resources_timeline_pkey PRIMARY KEY (rid)
      )
    `)
   }

   
   private async createResourceCostTable(schemaName: string, sequelize: any) {
     await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_cost_seq START 1`);

     await sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${schemaName}".resource_cost (
          rid uuid NOT NULL,
          r_number varchar(20) DEFAULT (
            'RCO ' || lpad((nextval('"${schemaName}".resource_cost_seq'::regclass))::text, 10, '0')
          ),
          eid varchar(255),
          account_rid uuid NOT NULL,
          resource_type varchar(255) NOT NULL,
          resource_rid uuid,
          resource_code varchar(255) NOT NULL,
          resource_number varchar(255) NOT NULL,
          fiscal_year integer NOT NULL,
          effective_date timestamptz,
          end_date timestamptz,
          annual_cost numeric(18,2),
          monthly_cost numeric(18,2),
          weekly_cost numeric(18,2),
          bi_weekly_cost numeric(18,2),
          daily_cost numeric(18,2),
          hourly_cost numeric(18,2),
          currency_rid uuid,
          status varchar(255) DEFAULT 'active',
          comments text,
          created_datetime timestamptz,
          modified_datetime timestamptz,
          created_by uuid,
          modified_by uuid,
          CONSTRAINT resource_cost_pkey PRIMARY KEY (rid),
          CONSTRAINT resource_cost_resource_rid_fkey FOREIGN KEY (resource_rid)
              REFERENCES "${schemaName}".resources (rid)
              ON UPDATE CASCADE
              ON DELETE SET NULL
      )
    `)
   }
   
  private async createResourceCostTimelineTable(schemaName: string, sequelize: any) {
     await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_cost_timeline_seq START 1`);

     await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".resource_cost_timeline (
        rid uuid NOT NULL,
        r_number varchar(20) DEFAULT (
          'RCT ' || lpad((nextval('"${schemaName}".resource_cost_timeline_seq'::regclass))::text, 10, '0')
        ),
        account_rid uuid NOT NULL,
        event_name varchar(255) NOT NULL,
        event_status varchar(255) NOT NULL,
        event_type varchar(255) DEFAULT 'Ui Handler',
        entity_rid uuid NOT NULL,
        event_datetime timestamptz NOT NULL,
        modified_datetime timestamptz,
        modified_by varchar(255) NOT NULL,
        CONSTRAINT resource_cost_timeline_pkey PRIMARY KEY (rid)
    );

    `)
   }

  
  private async createResourceCostHistoryTable(schemaName: string, sequelize: any) {
     await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_cost_history_seq START 1`);

     await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "${schemaName}".resource_cost_history (
          rid uuid NOT NULL,
          r_number varchar(20) DEFAULT (
            'RCH ' || lpad((nextval('"${schemaName}".resource_cost_history_seq'::regclass))::text, 10, '0')
          ),
          resource_cost_rid uuid NOT NULL,
          attribute_name varchar(255) NOT NULL,
          old_value varchar(255),
          new_value varchar(255) NOT NULL,
          modified_datetime timestamptz,
          modified_by varchar(255) NOT NULL,
          CONSTRAINT resource_cost_history_pkey PRIMARY KEY (rid)
      );
    `)
   }

   
  private async createResourceSkillTable(schemaName: string, sequelize: any) {
     await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_skill_seq START 1`);

     await sequelize.query(`
           CREATE TABLE IF NOT EXISTS "${schemaName}".resource_skill (
    rid uuid NOT NULL,
    r_number varchar(20) DEFAULT (
      'RSK ' || lpad((nextval('"${schemaName}".resource_skill_seq'::regclass))::text, 10, '0')
    ),
    eid varchar(255),
    account_rid uuid NOT NULL,
    resource_type varchar(255) NOT NULL,
    resource_rid uuid NOT NULL,
    resource_number varchar(255) NOT NULL,
    start_date timestamptz,
    skill_description varchar(255),
    skill_level varchar(255) DEFAULT 'Beginner',
    skill_type_others varchar(255),
    skill_subtype_others varchar(255),
    resource_code varchar(255) NOT NULL,
    status varchar(255) DEFAULT 'active',
    skill_type_rid varchar(255) NOT NULL,
    skill_subtype_rid varchar(255) NOT NULL,
    skill_details text,
    comments text,
    created_datetime timestamptz,
    modified_datetime timestamptz,
    created_by varchar(255),
    modified_by varchar(255),
    CONSTRAINT resource_skill_pkey PRIMARY KEY (rid),
    CONSTRAINT resource_skill_resource_rid_fkey FOREIGN KEY (resource_rid)
        REFERENCES "${schemaName}".resources (rid)
        ON UPDATE CASCADE
        ON DELETE NO ACTION
);

    `)
   }
  private async createResourceSkillTimelineTable(schemaName: string, sequelize: any) {
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_skill_timeline_seq START 1`);
    
    await sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${schemaName}".resource_skill_timeline (
          rid uuid NOT NULL,
          r_number varchar(20) DEFAULT (
            'RST ' || lpad((nextval('"${schemaName}".resource_skill_timeline_seq'::regclass))::text, 10, '0')
          ),
          account_rid uuid NOT NULL,
          event_name varchar(255) NOT NULL,
          event_status varchar(255) NOT NULL,
          event_type varchar(255) DEFAULT 'Ui Handler',
          entity_rid uuid NOT NULL,
          event_datetime timestamptz NOT NULL,
          modified_datetime timestamptz,
          modified_by varchar(255) NOT NULL,
          CONSTRAINT resource_skill_timeline_pkey PRIMARY KEY (rid)
        );

    `)
   }

  private async createResourceSkillHistoryTable(schemaName: string, sequelize: any) {
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_skill_history_seq START 1`);

    await sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${schemaName}".resource_skill_history (
          rid uuid NOT NULL,
          r_number varchar(20) DEFAULT (
            'RSH ' || lpad((nextval('"${schemaName}".resource_skill_history_seq'::regclass))::text, 10, '0')
          ),
          resource_skill_rid uuid NOT NULL,
          attribute_name varchar(255) NOT NULL,
          old_value varchar(255),
          new_value varchar(255) NOT NULL,
          modified_datetime timestamptz,
          modified_by varchar(255) NOT NULL,
          CONSTRAINT resource_skill_history_pkey PRIMARY KEY (rid)
      );
    `)
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
          created_by, modified_by, website, 
          data_residency, data_storage, auto_access_rd,business_details
        ) 
        VALUES (
          :account_rid, :max_ai_interactions, 
          :autosend_interaction, :fiscal_start_date, :fiscal_end_date, 
          :interaction_cc_list, :blended_rate_fte, :blended_rate_subcon, 
          :created_by, :modified_by, 
          :website, 
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
          blended_rate_fte: accountData.blended_rate_fte
            ? new Decimal(accountData.blended_rate_fte).toNumber().toString()
            : null,
          blended_rate_subcon: accountData.blended_rate_subcon
            ? new Decimal(accountData.blended_rate_subcon).toNumber().toString()
            : null,
          created_by: userId,
          modified_by: userId,
          website: accountData.website ?? null,
          data_residency: accountData.data_residency ?? null,
          data_storage: accountData.data_storage ?? null,
          auto_access_rd: accountData.auto_access_rd,
          business_details: accountData.business_details,
          comments: accountData.comments ?? null,
        },
      }
    );
  }
 async insertClientTemplateMetaDataDetails(
  account_number: string,
  entity: string,
  tableSchema: Array<{ column_name: string; data_type: string }>,
  client_template_rid: string,
  account_rid: string,
) {

  const schemaName = `platform_v2_${account_number}`;
  const sequelize = await initOrgSequelize();
  // Generate VALUES for each column in tableSchema
  const values = tableSchema
    .map((col, index) => `(
      :client_template_rid, 
      :account_rid, 
      :sheet_name, 
      :col_seq_${index}, 
      :col_name_${index}, 
      :col_type_${index}
    )`)
    .join(", ");

  // Build replacements dynamically
  const replacements: Record<string, any> = {
    account_rid: account_rid,
    client_template_rid,
    sheet_name: entity,
  };

  // Add column-specific replacements
  tableSchema.forEach((col, index) => {
    replacements[`col_seq_${index}`] = index + 1; // Sequence starts at 1
    replacements[`col_name_${index}`] = col.column_name;
    replacements[`col_type_${index}`] = col.data_type;
  });

  // Execute the query
  await sequelize.query(
    `
      INSERT INTO "${schemaName}"."clientfirm_document_template_metadata" (
      client_template_rid, account_rid, sheet_name, col_seq, col_name, col_type
      ) 
      VALUES ${values};
    `,
    {
      replacements,
      type: QueryTypes.INSERT,
    }
  );
}
 async insertClientTemplateDetails(
    account_number: string,
    template_name:string,
    entity_type:string,
    account_rid: string,
  ): Promise<string> {
    const schemaName = `platform_v2_${account_number}`;
    const sequelize = await initOrgSequelize();
    const [result] = await sequelize.query(
      `INSERT INTO "${schemaName}"."clientfirm_document_template" (
        client_document_template_name,account_rid,entity_type,version,status
        ) 
        VALUES (
          :template_name, 
          :account_rid, :entity_type, :version, 
          :status
        )
         RETURNING rid;`,
      {
        replacements: {
          account_rid: account_rid,
          template_name: template_name,
          entity_type,
          version:'2.0',
          status:'active'
        },
      }
    );
    const rows = result as { rid: string }[];
    // Validate the result
    if (!rows || rows.length === 0) {
      throw new Error("Failed to retrieve rid after insertion");
    }
    return rows[0].rid; // Return the rid
 
  }
  async manageKeyContacts(
    key_contacts: IKeyContactDetail,
    account_rid: string,
    userId: string,
    accountNumber: string
  ) {
    try {
      const schemaName = `platform_v2_${accountNumber}`;

      for (const contact of Object.values(key_contacts)) {
        if (contact.action_type === "edit") {
          if (
            contact.key_contact_name ||
            contact.key_contact_email ||
            contact.key_contact_role
          ) {
            this.updateKeyContactDetails(
              contact,
              account_rid,
              userId,
              schemaName
            );
          }
        } else if (contact.action_type === "delete") {
          {
            this.deleteKeyContactDetails(
              account_rid,
              contact.key_contact_id,
              schemaName
            );
          }
        } else if (contact.action_type === "add") {
          if (
            contact.key_contact_name ||
            contact.key_contact_email ||
            contact.key_contact_role
          ) {
            this.insertKeyContactDetails(
              contact,
              account_rid,
              userId,
              schemaName
            );
          }
        }
      }
    } catch (Error) {
      console.log(Error);
    }
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
         
          website = :website,
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
          blended_rate_fte: accountData.blended_rate_fte
            ? new Decimal(accountData.blended_rate_fte).toNumber().toString()
            : null,
          blended_rate_subcon: accountData.blended_rate_subcon
            ? new Decimal(accountData.blended_rate_subcon).toNumber().toString()
            : null,
          modified_by: userId,
          website: accountData.website ?? null,
          auto_access_rd: accountData.auto_access_rd,
          business_details: accountData.business_details,
          comments: accountData.comments ?? null,
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
  async fetchUserNames(created_by:string)
  {
     const sequelize = await initSequelize();
     return await sequelize.query(
          `SELECT first_name || ' ' || last_name AS full_name FROM public."user" WHERE rid = :userId LIMIT 1`,
          {
            replacements: { userId: created_by },
            type: 'SELECT'
          }
        )
  }

  async fetchKeyContacts(account_rid: string, accountNumber: string) {
    try {
      const sequelize = await initOrgSequelize();
      const mainSequelize = await initSequelize();
      const schemaName = `platform_v2_${accountNumber}`;

      const keyContact: any = await sequelize.query(
        `SELECT * FROM "${schemaName}"."key_contact_details" WHERE entity_rid = :account_rid AND entity_type = 'Account'`,
        {
          type: "SELECT",
          replacements: { account_rid },
        }
      );

      const keyContacts = keyContact || [];

      const keyContactIds = [
        ...new Set(keyContacts.map((r: any) => r.key_contact_role)),
      ].filter(Boolean);

      let keyContactMap: Record<string, string> = {};

      if (keyContactIds.length > 0) {
        const keyContactRows = await mainSequelize.query(
          `SELECT rid, role_name FROM key_contact_role WHERE rid IN (:ids)`,
          {
            replacements: { ids: keyContactIds },
            type: "SELECT",
          }
        );

        keyContactMap = Object.fromEntries(
          keyContactRows.map((c: any) => [c.rid, c.role_name])
        );
      }

      const enrichedKeyContacts = keyContacts.map((kc: any) => ({
        ...kc,
        role_name: keyContactMap[kc.key_contact_role] || null,
      }));

      return enrichedKeyContacts;
    } catch (err) {
      throw err;
    }
  }

  async deleteKeyContactDetails(
    account_rid: string,
    key_contact_id: string,
    schemaName: string
  ) {
    const sequelize = await initOrgSequelize();
    await sequelize.query(
      `DELETE FROM "${schemaName}"."key_contact_details" 
       WHERE r_number = :key_contact_id AND entity_rid = :account_rid and entity_type = 'Account'`,
      {
        replacements: {
          key_contact_id,
          account_rid,
        },
      }
    );
  }
  async updateKeyContactDetails(
    key_contact: IUpdateKeyContactDetail,
    account_rid: string,
    userId: string,
    schemaName: string
  ) {
    const keyContactDetails = key_contact;
    const sequelize = await initOrgSequelize();
    try {
      await sequelize.query(
        `
            UPDATE "${schemaName}"."key_contact_details"
            SET 
              key_contact_name = :key_contact_name,
              key_contact_email = :key_contact_email,
              key_contact_role = :key_contact_role_rid,
              status = :status,
              is_primary_contact = :is_primary_contact,
              include_in_communication = :include_in_communication,
              modified_by = :modified_by
            WHERE entity_rid = :account_rid
            AND rid = :key_contact_id
            AND entity_type = 'Account'
          `,
        {
          replacements: {
            account_rid: account_rid,
            key_contact_id: keyContactDetails.rid,
            key_contact_name: keyContactDetails.key_contact_name,
            key_contact_email: keyContactDetails.key_contact_email,
            key_contact_role_rid: keyContactDetails.key_contact_role,
            status: keyContactDetails.status,
            is_primary_contact: keyContactDetails.is_primary_contact,
            include_in_communication:
              keyContactDetails.include_in_communication,
            modified_by: userId,
          },
        }
      );
    } catch (error) {
      console.error("Error updating key contact details:", error);
      throw error;
    }
  }
  async insertKeyContactDetails(
    keyContacts: IKeyContactDetail,
    account_rid: string,
    userId: string,
    schemaName: string
  ) {
    const keyContactDetails = keyContacts;
    const sequelize = await initOrgSequelize();
    try {
      const [latest]: any = await sequelize.query(
        `SELECT r_number FROM "${schemaName}"."key_contact_details" 
         ORDER BY r_number DESC LIMIT 1;`,
        {
          type: "SELECT",
        }
      );

      let nextRNumber = "0000000001";
      if (latest?.r_number?.startsWith("KEY")) {
        const currentNum = parseInt(latest.r_number.split(" ")[1] || "0");
        nextRNumber = (currentNum + 1).toString().padStart(10, "0");
      }
      const finalRNumber = `KEY ${nextRNumber}`;

      await sequelize.query(
        `INSERT INTO "${schemaName}"."key_contact_details" (
          r_number, entity_rid, key_contact_name, 
          key_contact_email, key_contact_role, status, 
          is_primary_contact, include_in_communication, 
          created_by, modified_by, entity_type
        ) VALUES (
          :r_number, :account_rid, :key_contact_name, 
          :key_contact_email, :key_contact_role_rid, :status, 
          :is_primary_contact, :include_in_communication, 
          :created_by, :modified_by, 'Account'
        );`,
        {
          replacements: {
            r_number: finalRNumber,
            account_rid,
            key_contact_name: keyContactDetails.key_contact_name,
            key_contact_email: keyContactDetails.key_contact_email,
            key_contact_role_rid: keyContactDetails.key_contact_role,
            status: keyContactDetails.status,
            is_primary_contact: keyContactDetails.is_primary_contact,
            include_in_communication:
              keyContactDetails.include_in_communication,
            created_by: userId,
            modified_by: userId,
          },
        }
      );
    } catch (error) {
      console.error("Error inserting key contact details:", error);
      throw error;
    }
  }

  async createKeyContact(schemaName: string, sequelize: any) {
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."key_contact_details" (
          rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_rid UUID NOT NULL,
          entity_type VARCHAR(500) NOT NULL,
          r_number VARCHAR(14),
          key_contact_name VARCHAR(128),
          key_contact_email VARCHAR(125),
          key_contact_role UUID,
          is_primary_contact BOOLEAN,
          include_in_communication BOOLEAN,
          status VARCHAR(10) CHECK (status IN ('Active', 'Inactive')) DEFAULT 'Active',
          created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
          modified_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          created_by UUID,
          modified_by UUID
        );
      `);
    } catch (err) {
      throw err;
    }
  }

  async insertIndustyName(account: any) {
    try {
      const mainDdSequilze = await initSequelize();

      if (account.industry_rid) {
        const industryResult: any = await mainDdSequilze.query(
          `SELECT industry_name FROM industry WHERE rid = :id`,
          {
            replacements: { id: account.industry_rid },
            type: "SELECT",
          }
        );

        const industry = industryResult[0];
        account.dataValues.industry_rid_name = industry?.industry_name || null;
      } else {
        account.dataValues.industry_rid_name = null;
      }

      return account;
    } catch (err) {
      throw new Error("Error enriching key roles: " + (err as Error).message);
    }
  }

  async insertKeyContactInfo(accountData: any) {
  try {
    const sequelize = await initSequelize();
    const orgDbSequelize = await initOrgSequelize();

    const allAccounts = accountData.flatMap((account: any) => [
      account.dataValues,
      ...(account.dataValues.child_accounts || []),
    ]);

    // Step 2: Build a map of parent rid to r_number
    const parentRidToRNumber: Record<string, string> = {};
    for (const parent of accountData) {
      parentRidToRNumber[parent.dataValues.rid] = parent.dataValues.r_number;
    }

    // Step 3: Build schema to accountRids map
    const schemaToAccountRids: Record<string, string[]> = {};

    for (const acc of allAccounts) {
      let schema: string | undefined;

      if (acc.storage_type === "store_in_parent") {
        const parentRNumber = parentRidToRNumber[acc.parent_account_rid];
        if (!parentRNumber) {
          console.warn(`Missing parent r_number for account ${acc.rid}`);
          continue;
        }
        schema = parentRNumber;
      } else {
        schema = acc.r_number;
      }

      if (!schema) continue;

      if (!schemaToAccountRids[schema]) {
        schemaToAccountRids[schema] = [];
      }

      schemaToAccountRids[schema].push(acc.rid);
    }

    // Step 3: Query each schema's key_contact_details
    let allKeyContacts: any[] = [];

    for (const [schema, accountRids] of Object.entries(schemaToAccountRids)) {
      const schemaName = `platform_v2_${schema}`;
      const keyContacts = await orgDbSequelize.query(
        `SELECT * FROM "${schemaName}".key_contact_details WHERE entity_rid IN (:accountRids) and entity_type = 'Account'`,
        {
          replacements: { accountRids },
          type: "SELECT",
        }
      );
      allKeyContacts = allKeyContacts.concat(keyContacts);
    }

    // Step 4: Get unique role RIDs
    const keyContactRoleRids = [
      ...new Set(
        allKeyContacts.map((kc: any) => kc.key_contact_role).filter(Boolean)
      ),
    ];

    // Step 5: Query key_contact_role table
    let keyContactRoleMap: Record<string, string> = {};

    if (keyContactRoleRids.length > 0) {
      const roleRows = await sequelize.query(
        `SELECT rid, role_name FROM key_contact_role WHERE rid IN (:ids)`,
        {
          replacements: { ids: keyContactRoleRids },
          type: "SELECT",
        }
      );

      keyContactRoleMap = Object.fromEntries(
        roleRows.map((row: any) => [row.rid, row.role_name])
      );
    }

      // Step 6: Create accountKeyContactMap
    const accountKeyContactMap: Record<string, any[]> = {};

    for (const kc of allKeyContacts) {
      const contact = kc as {
        account_rid: string;
        key_contact_role: string;
        is_primary_contact: boolean;
        [key: string]: any;
      };

      const enriched = {
        ...contact,
        role_name: keyContactRoleMap[contact.key_contact_role] || null,
      };

      if (!accountKeyContactMap[contact.entity_rid]) {
        accountKeyContactMap[contact.entity_rid] = [];
      }

      accountKeyContactMap[contact.entity_rid].push(enriched);
    }

      // Step 7: Helper to enrich a single account
      function enrichAccount(account: any) {
      const keyContacts = accountKeyContactMap[account.rid] || [];
  
      const hasTechnical = keyContacts.some(
        (e: any) =>
          e.role_name === "Technical Consultant" && e.is_primary_contact
      );
      const hasFinancial = keyContacts.some(
        (e: any) =>
          e.role_name === "Financial Consultant" && e.is_primary_contact
      );
      const hasDeliveryHead = keyContacts.some(
        (e: any) =>
          e.role_name === "Client Project Delivery Head" && e.is_primary_contact
      );
      const hasFinanceExecutive = keyContacts.some(
        (e: any) =>
          e.role_name === "Client Finance Executive" && e.is_primary_contact
      );
  
        return {
        ...account,
        key_contacts: keyContacts,
          technical_consultant: hasTechnical
            ? "Technical Consultant"
            : "N/A",
          financial_consultant: hasFinancial
            ? "Financial Consultant"
            : "N/A",
          delivery_head: hasDeliveryHead
            ? "Project Point of Contact"
            : "N/A",
          finance_executive: hasFinanceExecutive
            ? "Project Point of Contact"
            : "N/A",
      };
    }

      // Step 8: Enrich all parent and child accounts
      const enrichedAccounts = accountData.map((account: any) => {
        const enrichedParent = enrichAccount(account.dataValues);
        const enrichedChildren = (account.dataValues.child_accounts || []).map((e: any) => enrichAccount(e.dataValues));
    return {
      ...enrichedParent,
      child_accounts: enrichedChildren,
    };
      });

      return enrichedAccounts;
  } catch (err) {
    throw err;
    }
  }
}

export default SchemaService;
