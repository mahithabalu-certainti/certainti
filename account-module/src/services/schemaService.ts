import { QueryTypes } from "sequelize";
import { initSequelize } from "../config/maindbDataSource";
import { initOrgSequelize } from "../config/orgdbDataSource";
import { setupKeyContactsSequence } from "../models/projectSummary";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constant";
import { getTableSchemaByEntity } from "../utils/helpers";
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
      const schema_name = `trd365_${account_number.replace(/\D/g, '')}`;
      await sequelize.createSchema(schema_name, {});
      await this.createAccountTables(account_number);
    } catch (err) {
      console.log(err);
      throw new Error("Error creating schema and tables.");
    }
  }

  async createAccountTables(account_number: string) {
    try {
      const schemaName = `trd365_${account_number.replace(/\D/g, '')}`;
      const sequelize = await initOrgSequelize();
      const transaction = await sequelize.transaction();

      await this.createAccountDetailsTable(schemaName, sequelize);
      await this.createAccountFiscalTable(schemaName, sequelize);
      await this.createProjectTable(schemaName, sequelize);
      await this.createProjectHistoryTable(schemaName, sequelize);
      await this.createProjectFiscalTable(schemaName, sequelize);
      await this.createProjectTimelineTable(schemaName, sequelize);

      await this.createProjectResourcesTable(schemaName, sequelize);
      await this.createProjectResourcesTimelineTable(schemaName, sequelize);
      await this.createProjectResourcesHistoryTable(schemaName, sequelize);

      await this.createDocumentTable(schemaName, sequelize);
      await this.createImportTable(schemaName, sequelize);
      await this.createKafkaEventsTable(schemaName, sequelize);
      await this.createKeyContact(schemaName, sequelize);
      await setupKeyContactsSequence(sequelize, schemaName);
      await this.createClientFirmDocumentTemplate(schemaName, sequelize);
      await this.createClientFirmDocumentTemplateMetadata(
        schemaName,
        sequelize
      );

      await this.createResourcesTable(schemaName, sequelize);
      await this.createResourceHistoryTable(schemaName, sequelize);
      await this.createResourceTimelineTable(schemaName, sequelize);
      await this.createResourceCostTable(schemaName, sequelize);
      await this.createResourceCostTimelineTable(schemaName, sequelize);
      await this.createResourceCostHistoryTable(schemaName, sequelize);
      await this.createResourceSkillTable(schemaName, sequelize);
      await this.createResourceSkillTimelineTable(schemaName, sequelize);
      await this.createResourceSkillHistoryTable(schemaName, sequelize);
      await this.createResourceFiscalTable(schemaName, sequelize);

      await transaction.commit();
    } catch (Err) {
      console.log("Ta ble createng err", Err);
    }
  }

  private async createAccountDetailsTable(schemaName: string, sequelize: any) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."account_details" (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime DATE DEFAULT CURRENT_TIMESTAMP NULL,
        modified_datetime DATE NULL,
        account_rid VARCHAR(50) NOT NULL UNIQUE,
        account_name VARCHAR(255) NOT NULL,
        tax_claim_level VARCHAR(50) NULL,
        max_ai_interactions INT CHECK (max_ai_interactions BETWEEN 1 AND 10) NOT NULL,
        autosend_interaction BOOLEAN NOT NULL,
        fiscal_start_date VARCHAR(10) NOT NULL,
        fiscal_end_date VARCHAR(10) NOT NULL,
        interaction_cc_list VARCHAR,
        blended_rate_fte NUMERIC(18,2),
        blended_rate_subcon NUMERIC(18,2),
        website VARCHAR(50),
        data_residency VARCHAR(255),
        data_storage VARCHAR(255) CHECK (data_storage IN ('separate_db', 'store_in_parent')),
        auto_access_rd BOOLEAN NOT NULL,
        business_details VARCHAR(2000) NOT NULL
        
      );
    `);
  }

  async fetchKeyContactRoles(entity_type: string): Promise<any[]> {
    const sequelize = await initSequelize();
    const result = await sequelize.query(`
      SELECT *
      FROM "public".key_contact_role where entity_type = '${entity_type}' AND LOWER(role_status) = 'active'
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
        rid VARCHAR(50) DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT 'ACF ' || LPAD(nextval('"${schemaName}".account_fiscal_seq')::text, 10, '0'),        
        eid VARCHAR(120),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ,
        account_rid varchar(50) NOT NULL,
        fiscal_year integer NOT NULL,
        total_projects integer,
        total_fte integer,
        total_subcon integer,
        total_project_hours_fte numeric(18,2),
        total_project_hours_subcon numeric(18,2),
        total_project_hours numeric(18,2),
        total_project_cost_fte numeric(18,2),
        total_project_cost_subcon numeric(18,2),
        total_project_cost_nonlabor numeric(18,2),
        total_project_cost numeric(18,2),
        total_project_qre_fte numeric(18,2),
        total_project_qre_subcon numeric(18,2),
        total_projects_qre numeric(18,2),
        total_projects_rd_credits_fte numeric(18,2),
        total_projects_rd_credits_subcon numeric(18,2),
        total_projects_rd_credits numeric(18,2),
        total_qualifying_projects_fed numeric(18,2),
        qualifying_fte_fed numeric(18,2),
        qualifying_subcon_fed numeric(18,2),
        qualifying_project_hours_fte_fed numeric(18,2),
        qualifying_project_hours_subcon_fed numeric(18,2),
        qualifying_project_hours_fed numeric(18,2),
        qualifying_project_cost_fte_fed numeric(18,2),
        qualifying_project_cost_subcon_fed numeric(18,2),
        qualifying_project_cost_nonlabor_fed numeric(18,2),
        qualifying_project_cost_fed numeric(18,2),
        qualifying_project_qre_fte_fed numeric(18,2),
        qualifying_project_qre_subcon_fed numeric(18,2),
        qualifying_project_qre_fed numeric(18,2),
        qualifying_project_rd_credits_fte_fed numeric(18,2),
        qualifying_project_rd_credits_subcon_fed numeric(18,2),
        qualifying_project_rd_credits_fed numeric(18,2),
        CONSTRAINT account_fiscal_pkey PRIMARY KEY (rid),
        CONSTRAINT account_fiscal_r_number_key UNIQUE (r_number)
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
      rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
      r_number VARCHAR(20) DEFAULT 'PRJ-' || LPAD(nextval('"${schemaName}".project_seq')::text, 10, '0'),        
      eid VARCHAR(120),
      created_by VARCHAR(50) NOT NULL,
      modified_by VARCHAR(50),
      created_datetime TIMESTAMP NOT NULL,
      modified_datetime TIMESTAMP,
      project_code VARCHAR(120) NOT NULL,
      industry_rid VARCHAR(50),
      industry_name VARCHAR(100),
      account_rid VARCHAR(50) NOT NULL,
      program_name VARCHAR(255),
      project_name VARCHAR(255),

      project_startdate TIMESTAMP,
      project_enddate TIMESTAMP,

      project_type VARCHAR(20) NOT NULL CHECK (project_type IN ('Fixed', 'Time & Material')),
      project_classification_rid VARCHAR(50),
      project_classification_other VARCHAR(300),

      project_client_group VARCHAR(255),
      project_group VARCHAR(255),

      project_status VARCHAR(10) NOT NULL CHECK (project_status IN ('Active', 'Inactive')),

      country_rid VARCHAR(50),
      region_rid VARCHAR(50),
      currency_rid VARCHAR(50),

      total_effort NUMERIC(18, 2),
      total_cost NUMERIC(18, 2),
      total_fte INTEGER,
      total_subcon INTEGER,

      total_effort_fte NUMERIC(18, 2),
      total_effort_subcon NUMERIC(18, 2),

      total_cost_fte NUMERIC(18, 2),
      total_cost_subcon NUMERIC(18, 2),
      total_cost_nonlabor NUMERIC(18, 2),

      auto_send_ai_interaction BOOLEAN NOT NULL DEFAULT false,
      auto_access_rd BOOLEAN DEFAULT false,
      max_ai_interaction INTEGER NOT NULL,

      blended_rate_fte NUMERIC(18, 2),
      blended_rate_subcon NUMERIC(18, 2),
      blended_rate NUMERIC(18, 2),

      project_description VARCHAR(2000),
      comments VARCHAR(2000),

      is_rd_qualified BOOLEAN,
      qre NUMERIC(18, 2),

      assessment_status VARCHAR(150)
    );

    `);
  }

  private async createProjectHistoryTable(schemaName: string, sequelize: any) {
    await sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_history_seq START 1;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".project_history (
      rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
      r_number VARCHAR(20) UNIQUE DEFAULT 'PRH-' || LPAD(nextval('"${schemaName}".project_history_seq')::TEXT, 10, '0'),
      created_by varchar(50) NOT NULL,
      modified_by varchar(50),
      created_datetime TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
      modified_datetime TIMESTAMP WITHOUT TIME ZONE,
      project_rid varchar(50) NOT NULL,
      attribute_name VARCHAR(100) NOT NULL,
      old_value VARCHAR(2000),
      new_value VARCHAR(2000) NOT NULL
      );
    `);
  }

  private async createProjectFiscalTable(schemaName: string, sequelize: any) {
    await sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_fiscal_seq START 1;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".project_fiscal (
      rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
      r_number VARCHAR(20) UNIQUE DEFAULT 'PFI-' || LPAD(nextval('"${schemaName}".project_fiscal_seq')::TEXT, 10, '0'),
      eid VARCHAR(120),
      created_by VARCHAR(50) NOT NULL,
      modified_by VARCHAR(50),
      created_datetime TIMESTAMP DEFAULT NOW(),
      modified_datetime TIMESTAMP,
      project_rid VARCHAR(50) NOT NULL,
      project_code VARCHAR(120) NOT NULL,
      industry_rid VARCHAR(50),
      industry_name VARCHAR(100),
      fiscal_year INTEGER NOT NULL,
      project_name VARCHAR(200),
      program_name TEXT,
      project_type VARCHAR(20) NOT NULL CHECK (project_type IN ('Fixed', 'Time & Material')),
      project_classification_rid VARCHAR(50),
      project_classification_other TEXT,
      project_client_group TEXT,
      project_group TEXT,
      auto_send_ai_interaction BOOLEAN NOT NULL DEFAULT FALSE,
      account_rid VARCHAR(50) NOT NULL,
      country_rid VARCHAR(50),
      region_rid VARCHAR(50),
      currency_rid VARCHAR(50),
      max_ai_interaction INTEGER NOT NULL,
      expiry_duration INTEGER,
      auto_access_rd BOOLEAN,
      project_status TEXT NOT NULL,
      project_startdate TIMESTAMP,
      project_enddate TIMESTAMP,

      -- FTE & Subcon
      total_fte_prj INTEGER,
      total_fte_from_prj_res INTEGER,
      total_fte_from_tasks INTEGER,
      total_subcon_prj INTEGER,
      total_subcon_from_prj_res INTEGER,
      total_subcon_from_tasks INTEGER,

      -- Non-labor & Resources
      total_nonlabor_prj DECIMAL(18,2),
      total_nonlabor_from_prj_res DECIMAL(18,2),
      total_resources_prj INTEGER,
      total_resources_from_prj_res INTEGER,
      total_resources_from_tasks INTEGER,

      -- Effort
      total_effort_prj DECIMAL(18,2),
      total_effort_fte_prj DECIMAL(18,2),
      total_effort_subcon_prj DECIMAL(18,2),
      total_effort_from_prj_res DECIMAL(18,2),
      total_effort_fte_from_prj_res DECIMAL(18,2),
      total_effort_subcon_from_prj_res DECIMAL(18,2),
      total_effort_from_tasks DECIMAL(18,2),
      total_effort_fte_from_tasks DECIMAL(18,2),
      total_effort_subcon_from_tasks DECIMAL(18,2),

      -- Cost
      total_cost_prj DECIMAL(18,2),
      total_cost_fte_prj DECIMAL(18,2),
      total_cost_subcon_prj DECIMAL(18,2),
      total_cost_nonlabor_prj DECIMAL(18,2),
      total_cost_from_prj_res DECIMAL(18,2),
      total_cost_fte_from_prj_res DECIMAL(18,2),
      total_cost_subcon_from_prj_res DECIMAL(18,2),
      total_cost_nonlabor_from_prj_res DECIMAL(18,2),
      total_cost_from_tasks DECIMAL(18,2),
      total_cost_fte_from_tasks DECIMAL(18,2),
      total_cost_subcon_from_tasks DECIMAL(18,2),

      -- Blended Cost
      total_cost_prj_blended DECIMAL(18,2),
      total_cost_fte_prj_blended DECIMAL(18,2),
      total_cost_subcon_prj_blended DECIMAL(18,2),
      total_cost_from_prj_res_blended DECIMAL(18,2),
      total_cost_fte_from_prj_res_blended DECIMAL(18,2),
      total_cost_subcon_from_prj_res_blended DECIMAL(18,2),
      total_cost_from_tasks_blended DECIMAL(18,2),
      total_cost_fte_from_tasks_blended DECIMAL(18,2),
      total_cost_subcon_from_tasks_blended DECIMAL(18,2),

      -- Blended Rates
      blended_rate_fte NUMERIC(18,2),
      blended_rate_subcon NUMERIC(18,2),

      -- R&D + QRE
      rd_percent_potential_ai DECIMAL(18,2),
      rd_percent_adjustment DECIMAL(18,2),
      rd_percent_final DECIMAL(18,2),
      qre_fte DECIMAL(18,2),
      qre_subcon DECIMAL(18,2),
      qre_nonlabor DECIMAL(18,2),
      qre_final DECIMAL(18,2),
      rd_credits_fte_fed_level DECIMAL(18,2),
      rd_credits_subcon_fed_level DECIMAL(18,2),
      rd_credits_nonlabor_fed_level DECIMAL(18,2),
      rd_credits_fed_level DECIMAL(18,2),
      rd_credits_total DECIMAL(18,2),

      -- Misc
      interaction_cc_list TEXT,
      assessment_status TEXT,
      claim_status TEXT,
      comments VARCHAR(2000),
      project_description VARCHAR(2000)
    );

    `);
  }

  private async createProjectTimelineTable(schemaName: string, sequelize: any) {
    await sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_timeline_seq START 1;
    `);

    await sequelize.query(`
      CREATE TABLE "${schemaName}".project_timeline (
       rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
      r_number varchar(20) DEFAULT (('PRT-'::text || lpad(nextval('"${schemaName}".project_timeline_seq'::regclass)::text, 10, '0'::text))) NULL,
      created_by VARCHAR(50) NOT NULL,
      modified_by VARCHAR(50),
      created_datetime TIMESTAMP DEFAULT NOW(),
      modified_datetime TIMESTAMP,
      account_rid varchar(50) NOT NULL,
      entity_rid varchar(50) NOT NULL,
      event_name varchar(100) NOT NULL,
      event_type varchar(100) NOT NULL,
      event_status varchar(100) NOT NULL,
      event_datetime timestamptz NOT NULL,
      CONSTRAINT project_timeline_r_number_key UNIQUE (r_number)
    );  
    `);
  }

  private async createProjectResourcesTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_resource_seq START 1;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".project_resource (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) UNIQUE DEFAULT 'PRS-' || LPAD(nextval('"${schemaName}".project_resource_seq')::TEXT, 10, '0'),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMP DEFAULT NOW(),
        modified_datetime TIMESTAMP,
        project_code VARCHAR(50) NOT NULL UNIQUE,
        start_date DATE,
        end_date DATE,
        resource_code VARCHAR(100),
        resource_name VARCHAR(200),
        resource_type VARCHAR(100),
        designation VARCHAR(100),
        resource_role VARCHAR(100),
        total_hours_pro_res DOUBLE PRECISION,
        total_cost_pro_res NUMERIC(18, 2),
        status VARCHAR(30),
        account_rid varchar(50),
        currency_rid varchar(50),
        description TEXT,
        country_rid varchar(50),
  
        resource_orgname VARCHAR(200),
        resource_firstname VARCHAR(100),
        resource_middlename VARCHAR(100),
        resource_lastname VARCHAR(100),
        manager_name VARCHAR(200),
        manager_ref_id VARCHAR(200),
        effort_project_resource_level DOUBLE PRECISION,
        cost_project_resource_level NUMERIC(18, 2),
        cost_project_task_level NUMERIC(18, 2),
        blended_cost_project_task_level NUMERIC(18, 2),
        blended_cost_project_resource_level NUMERIC(18, 2),
        effort_project_task_level DOUBLE PRECISION,
        total_hours_from_tasks DOUBLE PRECISION,
        total_cost_from_tasks NUMERIC(18, 2),
        total_cost_from_tasks_blended NUMERIC(18, 2),
  
        rd_percent_potential_al DOUBLE PRECISION,
        rd_percent_adjustment DOUBLE PRECISION,
        rd_percent_final DOUBLE PRECISION,
  
        qre_fte NUMERIC(18, 2),
        qre_subcon NUMERIC(18, 2),
        qre_nonlabor NUMERIC(18, 2),
        qre_final NUMERIC(18, 2),
  
        rd_credits_fte_region_level NUMERIC(18, 2),
        rd_credits_subcon_region_level NUMERIC(18, 2),
        rd_credits_nonlabor_region_level NUMERIC(18, 2),
        rd_credits_region_level NUMERIC(18, 2),
  
        rd_credits_fte_fed_level NUMERIC(18, 2),
        rd_credits_subcon_fed_level NUMERIC(18, 2),
        rd_credits_nonlabor_fed_level NUMERIC(18, 2),
        rd_credits_fed_level NUMERIC(18, 2),
        rd_credits_total NUMERIC(18, 2)
      );
    `);
  }

  private async createProjectResourcesTimelineTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_resource_timline_seq START 1;
    `);

    await sequelize.query(`
      CREATE TABLE "${schemaName}".project_resource_timeline (
      rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
      r_number varchar(20) DEFAULT (('PRRT-'::text || lpad(nextval('"${schemaName}".project_resource_timline_seq'::regclass)::text, 10, '0'::text))) NULL,
      created_by VARCHAR(50) NOT NULL,
      modified_by VARCHAR(50),
      created_datetime TIMESTAMP DEFAULT NOW(),
      modified_datetime TIMESTAMP,
      account_rid varchar(50) NOT NULL,
      entity_rid varchar(50) NOT NULL,
      event_name varchar(100) NOT NULL,
      event_type varchar(100) NOT NULL,
      event_status varchar(100) NOT NULL,
      event_datetime timestamptz NOT NULL,
      CONSTRAINT project_resource_timeline_r_number_key UNIQUE (r_number)
      );  
    `);
  }

  private async createProjectResourcesHistoryTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_resource_history_seq START 1;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".project_resource_history (
      rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
      r_number VARCHAR(20) UNIQUE DEFAULT 'PRRH-' || LPAD(nextval('"${schemaName}".project_resource_history_seq')::TEXT, 10, '0'),
      created_by VARCHAR(50) NOT NULL,
      modified_by VARCHAR(50),
      created_datetime TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
      modified_datetime TIMESTAMP WITHOUT TIME ZONE,
      project_resource_rid varchar(50) NOT NULL,
      attribute_name VARCHAR(100) NOT NULL,
      old_value VARCHAR(2000),
      new_value VARCHAR(2000) NOT NULL
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
         rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT 'DOC-' || LPAD(nextval('"${schemaName}".doc_seq')::text, 10, '0'),      
        eid VARCHAR(120),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ,
        account_rid varchar(50) REFERENCES "${schemaName}"."account_details"(account_rid),
        related_to VARCHAR(50) NOT NULL,
        related_to_rid varchar(50),
        document_source VARCHAR(100) NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        document_format VARCHAR(10) NOT NULL,
        document_version VARCHAR(10),
        document_url VARCHAR(2048) NOT NULL,
        bypass_rd_assessment BOOLEAN DEFAULT false,
        document_size VARCHAR(100) NOT NULL,
        document_status VARCHAR(100) NOT NULL,
        failure_reason TEXT
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
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT 'IMP-' || LPAD(nextval('"${schemaName}".import_seq')::text, 10, '0'),      
        eid VARCHAR(120),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ,
        account_rid varchar(50) REFERENCES "${schemaName}"."account_details"(account_rid),
        project_rid varchar(50) REFERENCES "${schemaName}"."project"(rid),
        uploaded_by_user_rid varchar(50),
        related_to VARCHAR(50) NOT NULL,
        related_to_rid varchar(50),
        entity_type VARCHAR(100),
        uploaded_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        document_name VARCHAR(255) NOT NULL,
        document_rid varchar(50) REFERENCES "${schemaName}"."document"(rid),
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
        target_ai_error_records_count INT
      );
    `);
  }

  private async createClientFirmDocumentTemplate(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."clientfirm_document_template" (
       rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        eid VARCHAR(120),
        created_by VARCHAR(50),
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ,
        client_document_template_name VARCHAR(100) NOT NULL,
        account_rid varchar(50) NOT NULL,
        entity_type VARCHAR(500) NOT NULL,
        version VARCHAR(10),
        status VARCHAR(50) NOT NULL
      );
    `);
  }

  private async createClientFirmDocumentTemplateMetadata(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."clientfirm_document_template_metadata" (
         rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        eid VARCHAR(120),
        created_by VARCHAR(50),
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ,
        account_rid varchar(50) NOT NULL,
        client_template_rid varchar(50) NOT NULL,
        sheet_name VARCHAR(100), 
        col_seq VARCHAR(100) NOT NULL,
        col_name VARCHAR(100) NOT NULL,
        col_type VARCHAR(100) NOT NULL,
        required boolean
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
       rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number VARCHAR(20) DEFAULT 'KFE-' || LPAD(nextval('"${schemaName}".kafka_events_seq')::text, 10, '0'),      
        eid VARCHAR(120),
        created_by VARCHAR(50) NOT NULL,
        modified_by VARCHAR(50),
        created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        modified_datetime TIMESTAMPTZ,
        source_name VARCHAR(100) NOT NULL,
        producer_id varchar(50),
        document_rid varchar(50) REFERENCES "${schemaName}"."document"(rid),
        document_name VARCHAR(255),
        document_upload_rid varchar(50) REFERENCES "${schemaName}"."import"(rid),
        topic_name VARCHAR(255) NOT NULL,
        related_to VARCHAR(50),
        related_to_rid varchar(50),
        consumer_id varchar(50),
        message_on_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) NOT NULL,
        error_description TEXT
      );
    `);
  }

  private async createResourcesTable(schemaName: string, sequelize: any) {
    await sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resources_seq START 1;
    `);
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".resources (
      rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
      r_number character varying(20) DEFAULT ('RES-' || lpad((nextval('"${schemaName}".resources_seq'))::text, 10, '0')),
      eid VARCHAR(120),
      created_by VARCHAR(50) NOT NULL,
      modified_by VARCHAR(50),
      created_datetime timestamp with time zone NOT NULL,
      modified_datetime timestamp with time zone  NULL,
      account_rid varchar(50) NOT NULL,
      resource_code character varying(50) NOT NULL,
      resource_type VARCHAR(50) CHECK (resource_type IN ('Full-Time','Sub Con','Non-Labor')),
      resource_name character varying(200),
      resource_firstname character varying(100),
      resource_lastname character varying(100),
      resource_orgname character varying(100),
      resource_role character varying(100),
      country_rid varchar(50),
      region_rid varchar(50),
      city_rid varchar(50),
      resource_startdate DATE,
      resource_enddate DATE,
      resource_designation character varying(100),
      resource_total_experience numeric(4,2),
      resource_total_experience_organization numeric(4,2),
      resource_status VARCHAR(50) CHECK (resource_status IN ('Active','Inactive')),
      comments text,
      CONSTRAINT resources_resource_code_key UNIQUE (resource_code))
     `);
  }

  private async createResourceFiscalTable(schemaName: string, sequelize: any) {
    await sequelize.query(
    `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_fiscal_seq START 1`
    );

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".resource_fiscal
(
     rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
    r_number character varying(20) DEFAULT ('RSF-' || lpad((nextval('"${schemaName}".resource_fiscal_seq'))::text, 10, '0')),
    eid VARCHAR(120) NULL,
    created_by VARCHAR(50) NOT NULL,
    modified_by VARCHAR(50),
    created_datetime timestamp with time zone NOT NULL,
    modified_datetime timestamp with time zone,
    account_rid varchar(50) NOT NULL,
    resource_rid varchar(50) NOT NULL,
    resource_type VARCHAR(50) CHECK (resource_type IN ('Full-Time','Sub Con','Non-Labor')),
    fiscal_year integer,
    country_rid varchar(50),
    country_region_rid varchar(50),
    cost_type VARCHAR(50) CHECK (cost_type IN ('Annual',
            'Monthly',
            'Bi-Weekly',
            'Weekly',
            'Daily',
            'Hourly')),
    annual_cost numeric(18,2),
    monthly_cost numeric(18,2),
    weekly_cost numeric(18,2),
    bi_weekly_cost numeric(18,2),
    daily_cost numeric(18,2),
    hourly_cost numeric(18,2),
    total_cost_for_year_project numeric(18,2),
    total_cost_for_year_project_resource_level numeric(18,2),
    total_cost_for_year_project_task_level numeric(18,2),
    total_effort_for_year_project numeric(18,2),
    total_effort_for_year_project_resource_level numeric(18,2),
    total_effort_for_year_project_task_level numeric(18,2),
    effective_date DATE,
    end_date DATE,
    estimated_rd_hours numeric(18,2),
    CONSTRAINT resource_fiscal_r_number_key UNIQUE (r_number)
)
      `);
  }

  private async createResourceHistoryTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_history_seq START 1`
    );

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".resources_history
      (
         rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
          r_number varchar(20) DEFAULT (
            'REH-' || lpad((nextval('"${schemaName}".resource_history_seq'::regclass))::text, 10, '0')
          ),
          created_by varchar(50) NOT NULL,
          modified_by varchar(50),
          created_datetime timestamptz NOT NULL,
          modified_datetime timestamptz,
          resource_rid varchar(50) NOT NULL,
          attribute_name varchar(100) NOT NULL,
          old_value varchar(1000),
          new_value varchar(1000) NOT NULL
      )
     `);
  }

  private async createResourceTimelineTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_timeline_seq START 1`
    );

    await sequelize.query(`
     CREATE TABLE IF NOT EXISTS "${schemaName}".resources_timeline (
         rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number varchar(20) DEFAULT ('RTL-' || lpad((nextval('"${schemaName}".resource_timeline_seq'::regclass))::text, 10, '0')),
        created_by varchar(50) NOT NULL,
        modified_by varchar(50),
        created_datetime timestamptz NOT NULL,
        modified_datetime timestamptz,
        account_rid varchar(50) NOT NULL,
        entity_rid varchar(50) NOT NULL,
        event_name varchar(100) NOT NULL,
        event_type varchar(100) NOT NULL,
        event_status varchar(100) NOT NULL,
        event_datetime timestamptz NOT NULL
      )
    `);
  }

  private async createResourceCostTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_cost_seq START 1`
    );

    await sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${schemaName}".resource_cost (
          rid VARCHAR(50) PRIMARY KEY NOT NULL DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
          r_number varchar(20) DEFAULT (
            'RCO-' || lpad((nextval('"${schemaName}".resource_cost_seq'::regclass))::text, 10, '0')
            ),
	       eid VARCHAR(120),
	       created_by varchar(50) NOT NULL,
	       modified_by varchar(50),
	       created_datetime timestamp with time zone,
         modified_datetime timestamp with time zone,
         account_rid varchar(50) NOT NULL,
         resource_type character varying(255) NOT NULL,
         resource_rid varchar(50),
         resource_code character varying(255) NOT NULL,
         resource_number character varying(255) NOT NULL,
         fiscal_year integer NOT NULL,
         effective_from date,
         end_date date,
         effort_in_hrs numeric(18,2),
         currency_rid varchar(50),
         status varchar(255) DEFAULT 'active'::character varying,
         comments text,
         deductions numeric(18,2),
         insurance numeric(18,2),
         bonus numeric(18,2),
         resource_cost numeric(18,2),
         salary numeric(18,2),
         net_resource_cost numeric(20,2),
         CONSTRAINT resource_cost_resource_rid_fkey FOREIGN KEY (resource_rid)
              REFERENCES "${schemaName}".resources (rid)
              ON UPDATE CASCADE
              ON DELETE SET NULL
        )

    `);
  }

  private async createResourceCostTimelineTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_cost_timeline_seq START 1`
    );

    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".resource_cost_timeline (
        rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
        r_number varchar(20) DEFAULT (
          'RCT-' || lpad((nextval('"${schemaName}".resource_cost_timeline_seq'::regclass))::text, 10, '0')
        ),
        created_by varchar(50) NOT NULL,
        modified_by varchar(50),
        created_datetime timestamptz,
        modified_datetime timestamptz,
        account_rid varchar(50) NOT NULL,
        event_name varchar(255) NOT NULL,
        event_status varchar(255) NOT NULL,
        event_type varchar(255) DEFAULT 'Ui Handler',
        entity_rid varchar(50) NOT NULL,
        event_datetime timestamptz NOT NULL
        );
    `)
   }

  private async createResourceCostHistoryTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_cost_history_seq START 1`
    );

    await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "${schemaName}".resource_cost_history (
          rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
          r_number varchar(20) DEFAULT (
            'RCH-' || lpad((nextval('"${schemaName}".resource_cost_history_seq'::regclass))::text, 10, '0')
          ),
          created_by varchar(50) NOT NULL,
          modified_by varchar(50),
          created_datetime timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
          modified_datetime timestamptz,
          resource_cost_rid varchar(50) NOT NULL,
          attribute_name varchar(255) NOT NULL,
          old_value varchar(255),
          new_value varchar(255) NOT NULL
      );
    `);
  }

  private async createResourceSkillTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_skill_seq START 1`
    );

    await sequelize.query(`
           CREATE TABLE IF NOT EXISTS "${schemaName}".resource_skill (
    rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
    r_number varchar(20) DEFAULT (
      'RSK-' || lpad((nextval('"${schemaName}".resource_skill_seq'::regclass))::text, 10, '0')
    ),
    eid VARCHAR(120),
    created_by varchar(50) NOT NULL,
    modified_by varchar(50),
    created_datetime timestamptz,
    modified_datetime timestamptz,
    account_rid varchar(50) NOT NULL,
    resource_type varchar(255) NOT NULL,
    resource_rid varchar(50) NOT NULL,
    resource_number varchar(255) NOT NULL,
    start_date DATE,
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
    CONSTRAINT resource_skill_resource_rid_fkey FOREIGN KEY (resource_rid)
        REFERENCES "${schemaName}".resources (rid)
        ON UPDATE CASCADE
        ON DELETE NO ACTION
);

    `);
  }
  private async createResourceSkillTimelineTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_skill_timeline_seq START 1`
    );

    await sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${schemaName}".resource_skill_timeline (
           rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
          r_number varchar(20) DEFAULT (
            'RST-' || lpad((nextval('"${schemaName}".resource_skill_timeline_seq'::regclass))::text, 10, '0')
          ),
          created_by varchar(50) NOT NULL,
          modified_by varchar(50),
          created_datetime timestamptz,
          modified_datetime timestamptz,
          account_rid varchar(50) NOT NULL,
          event_name varchar(255) NOT NULL,
          event_status varchar(255) NOT NULL,
          event_type varchar(255) DEFAULT 'Ui Handler',
          entity_rid varchar(50) NOT NULL,
          event_datetime timestamptz NOT NULL
        );
    `);
   }

  private async createResourceSkillHistoryTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_skill_history_seq START 1`
    );

    await sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${schemaName}".resource_skill_history (
          rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
          r_number varchar(20) DEFAULT (
            'RSH-' || lpad((nextval('"${schemaName}".resource_skill_history_seq'::regclass))::text, 10, '0')
          ),
          created_by varchar(50) NOT NULL,
          modified_by varchar(50),
          created_datetime timestamptz,
          modified_datetime timestamptz,
          resource_skill_rid varchar(50) NOT NULL,
          attribute_name varchar(255) NOT NULL,
          old_value varchar(255),
          new_value varchar(255) NOT NULL
      );
    `);
  }

  async insertAccountDetails(
    account_number: string,
    accountData: IAccount,
    account_rid: string,
    userId: string
  ) {
    const schemaName = `trd365_${account_number.replace(/\D/g, '')}`;
    const sequelize = await initOrgSequelize();
    await sequelize.query(
      `
        INSERT INTO "${schemaName}"."account_details" (
          account_rid, account_name, max_ai_interactions, 
          autosend_interaction, fiscal_start_date, fiscal_end_date, 
          interaction_cc_list, blended_rate_fte, blended_rate_subcon, 
          created_by, website, 
          data_residency, data_storage, auto_access_rd,business_details
        ) 
        VALUES (
          :account_rid, :account_name, :max_ai_interactions, 
          :autosend_interaction, :fiscal_start_date, :fiscal_end_date, 
          :interaction_cc_list, :blended_rate_fte, :blended_rate_subcon, 
          :created_by,
          :website, 
          :data_residency, :data_storage, :auto_access_rd,:business_details
        );
      `,
      {
        replacements: {
          account_rid: account_rid,
          account_name: accountData.account_name,
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
    tableSchema: Array<{
      column_name: string;
      data_type: string;
      required: boolean;
    }>,
    client_template_rid: string,
    account_rid: string
  ) {
    const schemaName = `trd365_${account_number.replace(/\D/g, '')}`;
    const sequelize = await initOrgSequelize();
    // Generate VALUES for each column in tableSchema
    const values = tableSchema
      .map(
        (col, index) => `(
      :client_template_rid, 
      :account_rid, 
      :sheet_name, 
      :col_seq_${index}, 
      :col_name_${index}, 
      :col_type_${index},
      :required_${index}
    )`
      )
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
      replacements[`required_${index}`] = col.required;
    });

    // Execute the query
    await sequelize.query(
      `
      INSERT INTO "${schemaName}"."clientfirm_document_template_metadata" (
      client_template_rid, account_rid, sheet_name, col_seq, col_name, col_type,required
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
    template_name: string,
    entity_type: string,
    account_rid: string
  ): Promise<string> {
    const schemaName = `trd365_${account_number.replace(/\D/g, '')}`;
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
          version: "2.0",
          status: "active",
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
      const schemaName = `trd365_${accountNumber.replace(/\D/g, '')}`;

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
              contact.rid,
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
    const schemaName = `trd365_${account_number.replace(/\D/g, '')}`;
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
      const schemaName = `trd365_${account_number.replace(/\D/g, '')}`;
    try {
      const query = `
        SELECT * FROM "${schemaName}".account_details WHERE account_rid = :account_rid
      `;

      const sequelize = await initOrgSequelize();

      const users = await sequelize.query(query, {
        replacements: { account_rid },
        type: "SELECT",
      });
      return users;
    } catch (err) {
      console.log("Errr ", err);
      throw new Error("Error retrieving account details");
    }
  }
  async fetchUserNames(created_by: string) {
    const sequelize = await initSequelize();
    return await sequelize.query(
      `SELECT first_name || ' ' || last_name AS full_name FROM public."user" WHERE rid = :userId LIMIT 1`,
      {
        replacements: { userId: created_by },
        type: "SELECT",
      }
    );
  }

  async fetchKeyContacts(account_rid: string, accountNumber: string) {
    try {
      const sequelize = await initOrgSequelize();
      const mainSequelize = await initSequelize();
      const schemaName = `trd365_${accountNumber.replace(/\D/g, '')}`;
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
       WHERE rid = :key_contact_id AND entity_rid = :account_rid and entity_type = 'Account'`,
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
              interaction_cc_recipient = :interaction_cc_recipient,
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
            interaction_cc_recipient: keyContactDetails.interaction_cc_recipient?.length
            ? `{${keyContactDetails.interaction_cc_recipient.join(',')}}`
            : '{}',
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
      
      await sequelize.query(
        `INSERT INTO "${schemaName}"."key_contact_details" (
         entity_rid, key_contact_name, 
          key_contact_email, key_contact_role, status, 
          is_primary_contact, include_in_communication, interaction_cc_recipient,
          created_by, modified_by, entity_type
        ) VALUES (
          :account_rid, :key_contact_name, 
          :key_contact_email, :key_contact_role_rid, :status, 
          :is_primary_contact, :include_in_communication, :interaction_cc_recipient,
          :created_by, :modified_by, 'Account'
        );`,
        {
          replacements: {
            account_rid,
            key_contact_name: keyContactDetails.key_contact_name,
            key_contact_email: keyContactDetails.key_contact_email,
            key_contact_role_rid: keyContactDetails.key_contact_role,
            status: keyContactDetails.status,
            is_primary_contact: keyContactDetails.is_primary_contact,
            include_in_communication:
              keyContactDetails.include_in_communication,
            interaction_cc_recipient: keyContactDetails.interaction_cc_recipient?.length
            ? `{${keyContactDetails.interaction_cc_recipient.join(',')}}`
            : '{}',
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
          rid VARCHAR(50) PRIMARY KEY DEFAULT ('${ENV_PREFIX}' || gen_random_uuid()),
          r_number VARCHAR(30),
          created_by varchar(50),
          modified_by varchar(50),
          created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
          modified_datetime TIMESTAMPTZ,
          entity_rid varchar(50) NOT NULL,
          entity_type VARCHAR(500) NOT NULL,
          key_contact_name VARCHAR(128),
          key_contact_email VARCHAR(125),
          key_contact_role varchar(50),
          is_primary_contact BOOLEAN,
          include_in_communication BOOLEAN,
          interaction_cc_recipient  TEXT[],
          status VARCHAR(10) CHECK (status IN ('Active', 'Inactive')) DEFAULT 'Active'
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

  async insertKeyContactInfo(
    accountData: any,
    filters?: any,
    limit?: number,
    offset?: number,
    sortBy?: string,
    sortOrder?: string,
    type?: string
  ) {
    try {
    const sequelize = await initSequelize();
    const orgDbSequelize = await initOrgSequelize();
    const roleKeyMap: Record<string, string> = {};
    const dbRoleMap = await sequelize.query(
      `SELECT role_map, role_name FROM key_contact_role WHERE role_map IS NOT NULL`,
      { type: "SELECT" }
  );

  dbRoleMap.forEach((row: any) => {
      if (row.role_map && row.role_name) {
          roleKeyMap[row.role_map] = row.role_name;
      }
  });
    
    // 2. Account processing
    const parentRidToRNumber = new Map<string, string>();
    const allAccounts: any[] = [];

    accountData.forEach((account: { dataValues: any }) => {
      const parent = account.dataValues;
      parentRidToRNumber.set(parent.rid, parent.r_number);
      allAccounts.push(
        parent,
        ...(parent.child_accounts?.map((c: any) => c.dataValues) || [])
      );
    });

    // 3. Schema mapping with Map
    const schemaToAccountRids = new Map<string, string[]>();

    for (const acc of allAccounts) {
      const schema =
        acc.storage_type === "store_in_parent"
          ? parentRidToRNumber.get(acc.parent_account_rid)
          : acc.r_number;

      if (!schema) continue;

      const accountRids = schemaToAccountRids.get(schema) || [];
      accountRids.push(acc.rid);
      schemaToAccountRids.set(schema, accountRids);
    }

    // 4. Parallelize database queries
    const [keyContactsResults, fiscalResults] = await Promise.all([
      // Key contacts query
      (async () => {
        const queries = Array.from(schemaToAccountRids).map(
          async ([schema, accountRids]) => {
            try {
              return await orgDbSequelize.query(
                `SELECT * FROM "trd365_${schema.replace(/^ACC-/, '')}".key_contact_details 
             WHERE entity_rid IN (:accountRids) AND entity_type = 'Account'`,
                { replacements: { accountRids }, type: "SELECT" }
              );
            } catch (error) {
              console.error(
                `Key contacts query failed for schema ${schema}:`,
                error
              );
              return [];
            }
          }
        );
        return (await Promise.all(queries)).flat();
      })(),

      // Fiscal data query
      (async () => {
        const queries = Array.from(schemaToAccountRids).map(
          async ([schema, accountRids]) => {
            try {
                const schemaName = `trd365_${schema.replace(/\D/g, '')}`;
              return await orgDbSequelize.query(
                `SELECT fiscal_year, account_rid,
             SUM(total_projects::NUMERIC) AS total_projects,
             SUM(total_project_hours::NUMERIC) AS total_project_hours,
             SUM(total_project_cost::NUMERIC) AS total_project_cost,
             SUM(qualifying_project_hours_fed::NUMERIC) AS qualifying_project_hours_fed,
             SUM(qualifying_project_qre_fed::NUMERIC) AS qualifying_project_qre_fed,
             SUM(qualifying_project_rd_credits_fed::NUMERIC) AS qualifying_project_rd_credits_fed,
             SUM(total_projects_rd_credits::NUMERIC) AS total_projects_rd_credits
             FROM "${schemaName}".account_fiscal
             WHERE account_rid IN (:accountRids)
             GROUP BY account_rid, fiscal_year`,
                { replacements: { accountRids }, type: "SELECT" }
              );
            } catch (error) {
              console.warn(`Fiscal data skipped for schema ${schema}:`, error);
              return [];
            }
          }
        );
        return (await Promise.all(queries)).flat();
      })(),
    ]);

    // 5. Optimize role mapping
    const roleRids = [
      ...new Set(
        keyContactsResults.map((kc: any) => kc.key_contact_role).filter(Boolean)
      ),
    ];

    const keyContactRoleMap = new Map<string, string>(
      roleRids.length
        ? (
            await sequelize.query(
              `SELECT rid, role_name FROM key_contact_role WHERE rid IN (:ids)`,
              { replacements: { ids: roleRids }, type: "SELECT" }
            )
          ).map((r: any) => [r.rid, r.role_name])
        : []
    );

    // 6. Efficient contact mapping
    const accountKeyContactMap = new Map<string, any[]>();
    const accountFiscalMap = new Map<string, any[]>();

    keyContactsResults.forEach((kc: any) => {
      const contacts = accountKeyContactMap.get(kc.entity_rid) || [];
      contacts.push({
        ...kc,
        role_name: keyContactRoleMap.get(kc.key_contact_role) || null,
      });
      accountKeyContactMap.set(kc.entity_rid, contacts);
    });

    fiscalResults.forEach((f: any) => {
      const fiscalData = accountFiscalMap.get(f.account_rid) || [];
      fiscalData.push(f);
      accountFiscalMap.set(f.account_rid, fiscalData);
    });
    const getPrimaryContact = (keyContacts: any[]) => {
      const contact = keyContacts.find(kc => kc.is_primary_contact);
      if (!contact) return { roleKey: null, name: null };

      const roleKey = Object.entries(roleKeyMap).find(
        ([_, value]) => value === contact.role_name
      )?.[0] || null;

      return {
        roleKey,
        name: contact.key_contact_name || null
      };
    };
    // 7. Optimized account enrichment
    const enrichAccount = (account: any, isChild: boolean) => {
    const rawKeyContacts = accountKeyContactMap.get(account.rid) || [];
    const { roleKey, name } = getPrimaryContact(rawKeyContacts);
    // Prepare contacts with default values
    const preparedKeyContacts = rawKeyContacts.map(kc => ({
      ...kc,
      role_name: kc.role_name || '',
      key_contact_name: kc.key_contact_name || ''
    }));
    
    // Apply filters only to parent accounts
    let keyContacts = preparedKeyContacts;
    const getPrimaryContactName = (roleName: string) => {
    const contact = keyContacts.find(
      kc => kc.role_name === roleName && kc.is_primary_contact
    );
    return contact?.key_contact_name || null;
  };

    return {
      ...account,
      key_contacts: keyContacts,
      primary_contact_role: roleKey || "",
      primary_contact_name: name || "",    // technical_consultant: getPrimaryContactName("Technical Consultant") || "-",
      professional_services_consultant: getPrimaryContactName("Professional Services Consultant") || "-",
      finance_executive: getPrimaryContactName("Client Finance Executive") || "-",
      finance_lead: getPrimaryContactName("Client Finance Lead") || "-",
      ...(isChild && { 
        projects_by_fiscal_year: accountFiscalMap.get(account.rid) || [] 
      })
    };
  };

    // 8. Process accounts with early filtering
    let enrichedAccounts = accountData
      .map((account: any) => {
        const parent = enrichAccount(account.dataValues, false);
        const children = (account.dataValues?.child_accounts || []).map(
          (c: any) => enrichAccount(c.dataValues, true)
        );

        parent.child_accounts = children;

        // Special handling for is_empty: true filter
        return parent;
      })
      .filter(Boolean);
  // 8. Optimized filtering logic
    if (filters?.finance_lead || filters?.finance_executive || filters?.professional_services_consultant) {
      const filterKeys = Object.keys(filters).filter(key => 
        ['finance_lead', 'finance_executive', 'professional_services_consultant'].includes(key)
      );
      for (const filterKey of filterKeys) {
        const filterValue = (filters as any)[filterKey];
        if (typeof filterValue === 'string') {
          if (filterValue === '-' || filterValue.toLowerCase() === 'empty') {
        // Filter for empty values
            enrichedAccounts = enrichedAccounts.filter((account: any) => {
            const contactName = account[filterKey] || '';
            return contactName.trim() === '';
          });
        } else {
        // Filter for contains match
          enrichedAccounts = enrichedAccounts.filter((account: any) => {
          const contactName = (account[filterKey] || '').toLowerCase();
          return contactName.includes(filterValue.toLowerCase());
          });
        }
    }
    else if (typeof filterValue === 'object' && filterValue !== null) {
      const filterType = Object.keys(filterValue)[0];
      const filterVal = filterValue[filterType];
       const roleName = roleKeyMap[filterKey];
      enrichedAccounts = enrichedAccounts.filter((account: any) => {
        const contactName = account[filterKey] || '';
         // Step 2: Find the primary contact for this specific role
          const primaryContact = (account.key_contacts || []).find(
            (kc: any) => 
              kc.is_primary_contact && 
              kc.role_name === roleName
          );

        switch (filterType) {
          case 'equals':
            return contactName.toLowerCase() === String(filterVal).toLowerCase();
            
         case 'not_equals': 
          if (!roleName) {
              // Role mapping not found → exclude the account (filter key is invalid for this account)
          return false;
          }
        
          // Step 3: If no primary contact exists for this role, exclude the account
          if (!primaryContact) {
            return false;
          }

          // Step 4: Check if the primary contact's name does NOT match the filter value
          const contactNamenot = primaryContact.key_contact_name?.toLowerCase() || '';
          const filterValueNormalized = String(filterVal).toLowerCase();
          return contactNamenot !== filterValueNormalized;   
          case 'contains':
            return contactName.toLowerCase().includes(String(filterVal).toLowerCase());
            
         case 'is_empty':
         
          if (!roleName) {
            return false; // Invalid role → exclude account
          }
      

          if (filterVal === true) {
            // Filter for empty: either no contact or empty name
            return !primaryContact || 
                  !primaryContact.key_contact_name || 
                  primaryContact.key_contact_name.trim() === '';
          }
          default:
            return true;
        }
      });
    }
  }
}
    // 5. Apply sorting if needed
    const SORTABLE_FIELDS = new Set([
      "professional_services_consultant",
      "finance_lead",
      "finance_executive",
    ]);

    if (sortBy && SORTABLE_FIELDS.has(sortBy)) {
      enrichedAccounts.sort(
        (a: { [x: string]: string }, b: { [x: string]: string }) => {
          const valA = a[sortBy] || "";
          const valB = b[sortBy] || "";

        if (valA === "-" && valB !== "-") {
          return sortOrder === "DESC" ? -1 : 1;
        }
        if (valB === "-" && valA !== "-") {
          return sortOrder === "DESC" ? 1 : -1;
        }
        if (valA === "-" && valB === "-") {
          return 0; // Both empty → equal
        }
      // For non-empty values: sort alphabetically
      return sortOrder === "DESC"
        ? valB.localeCompare(valA, undefined, { sensitivity: "base" }) // Z → A
        : valA.localeCompare(valB, undefined, { sensitivity: "base" }); // A → Z
    }
  );
}

    // 6. Apply pagination
    const total = enrichedAccounts.length;
    const shouldPaginate =
      (filters?.finance_lead || filters?.finance_executive || filters?.professional_services_consultant) || (sortBy && SORTABLE_FIELDS.has(sortBy));

    if (
      shouldPaginate &&
      limit !== undefined &&
      offset !== undefined &&
      type != "download"
    ) {
      enrichedAccounts = enrichedAccounts.slice(offset, offset + limit);
    }
    return { data: enrichedAccounts, total };
  }
  catch(err)
  {
      throw new Error("Error updating key contacts.");
  }
}

  async getOrgInfo() {
    try {
      const mainDdSequilze = await initSequelize();

      const result: any = await mainDdSequilze.query(
          `SELECT logo_url,firm_name FROM organization_licenses`,
          {
            type: "SELECT",
          }
        );

        const orgLicenseInfo = result[0]
      
      console.log("orgLicenseInfo",orgLicenseInfo)
      return orgLicenseInfo;
    } catch (err) {
      throw new Error("Error enriching key roles: " + (err as Error).message);
    }
  }
}
export default SchemaService;
