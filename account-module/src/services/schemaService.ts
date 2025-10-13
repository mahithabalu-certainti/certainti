import { QueryTypes, Sequelize } from "sequelize";
import { initSequelize } from "../config/maindbDataSource";
import { initOrgSequelize } from "../config/orgdbDataSource";
import { setupKeyContactsSequence } from "../models/projectSummary";
import {
  DEFAULT_ACCOUNT_DETAILS,
  rawQueries,
  SCHEMANAME_PREFIX,
} from "../utils/constant";
import {
  decryptClientSecret,
  errorLog,
  logMessage,
} from "../utils/helpers";
import {
  IAccount,
  IUpdateAccount,
  IKeyContactDetail,
  IUpdateKeyContactDetail,
} from "../utils/types";
import Decimal from "decimal.js";
class SchemaService {
  async getKeyContactRoleById(key_contact_role: string): Promise<any> {
    try {
      const sequelize = await initSequelize();
      const result = await sequelize.query(
        rawQueries.getActiveKeyContactRoleByIdQuery(),
        {
          replacements: { key_contact_role },
          type: QueryTypes.SELECT,
        }
      );

      return result[0];
    } catch (error) {
      errorLog("Error fetching key contact role:", (error as Error).message);
      throw new Error("Failed to fetch key contact role");
    }
  }
  async createNewSchema(account_number: string) {
    try {
      const sequelize = await initOrgSequelize();
      const schema_name = `${SCHEMANAME_PREFIX}${account_number.replace(
        /\D/g,
        ""
      )}`;
      await sequelize.createSchema(schema_name, {});
      await this.grantAllReadOnlyAccessToSchema(schema_name, sequelize);
      await this.createAccountTables(account_number);
    } catch (err) {
      errorLog("Error creating schema and tables:", (err as Error).message);
      throw new Error("Error creating schema and tables.");
    }
  }

  async createAccountTables(account_number: string) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${account_number.replace(
        /\D/g,
        ""
      )}`;
      const sequelize = await initOrgSequelize();
      const transaction = await sequelize.transaction();

      await this.createAccountDetailsTable(schemaName, sequelize);
      await this.createAccountFiscalTable(schemaName, sequelize);
      await this.createAccountFiscalRegionTable(schemaName, sequelize);

      await this.createProjectTable(schemaName, sequelize);
      await this.createProjectFiscalTable(schemaName, sequelize);
      await this.createProjectHistoryTable(schemaName, sequelize);
      await this.createProjectFiscalRegionTable(schemaName, sequelize);
      await this.createProjectTimelineTable(schemaName, sequelize);

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
      await this.createAttachmentTable(schemaName, sequelize);
      await this.createAttachmentTimeline(schemaName, sequelize);
      await this.createResourceFiscalRegionTable(schemaName, sequelize);

      await this.createProjectResourcesTable(schemaName, sequelize);
      await this.createProjectResourcesTimelineTable(schemaName, sequelize);
      await this.createProjectResourcesHistoryTable(schemaName, sequelize);
      await this.createProjectResourceFiscalTable(schemaName, sequelize);
      await this.createProjectResourceFiscalRegionTable(schemaName, sequelize);

      await this.createProjectTaskTable(schemaName, sequelize);
      await this.createProjectTaskTimeLineTable(schemaName, sequelize);
      await this.createProjectTaskHistoryTable(schemaName, sequelize);
      await this.createInteractionTable(schemaName, sequelize);
      await this.createInteractionItemTable(schemaName, sequelize);
      await this.createInteractionHistoryTable(schemaName, sequelize);
      await this.createInteractionResponseTable(schemaName, sequelize);
      await this.createInteractionAttachments(schemaName, sequelize);
      await this.createAITechnicalSummary(schemaName, sequelize);
      await this.createInteractionTimeline(schemaName, sequelize);
      await this.createAIAssesmentAudit(schemaName, sequelize);
      await this.createQRETracker(schemaName, sequelize);
      await this.createAutoSendInteractionAudit(schemaName, sequelize);

      await this.createOtpEntries(schemaName, sequelize);
      await this.createOtpEntriesHistory(schemaName, sequelize);
      await this.createEmailWebhookHistory(schemaName, sequelize);
      await this.createNotesTable(schemaName, sequelize);
      await this.createNotesTimeline(schemaName, sequelize);

      await transaction.commit();
    } catch (Err) {
      errorLog("Error creating account tables:", (Err as Error).message);
    }
  }

  async grantAllReadOnlyAccessToSchema(
    schema_name: string,
    sequelize: Sequelize
  ) {
    await sequelize.query(rawQueries.getGrantSchemaUsageQuery(schema_name));
    await sequelize.query(
      rawQueries.getGrantSelectOnAllTablesQuery(schema_name)
    );
    await sequelize.query(
      rawQueries.getGrantSelectOnAllSequencesQuery(schema_name)
    );
    await sequelize.query(
      rawQueries.getAlterDefaultPrivilegesForTablesQuery(schema_name)
    );
    await sequelize.query(
      rawQueries.getAlterDefaultPrivilegesForSequencesQuery(schema_name)
    );
  }

  private async createQRETracker(schemaName: string, sequelize: Sequelize) {
    await sequelize.query(
      rawQueries.getCreateAiAssessmentQreTableQuery(schemaName)
    );
    await sequelize.query(
      rawQueries.getAlterAiAssessmentQreForeignKeysQuery(schemaName)
    );
  }

  private async createAIAssesmentAudit(
    schemaName: string,
    sequelize: Sequelize
  ) {
    await sequelize.query(
      rawQueries.getCreateAiAssessmentAuditTableQuery(schemaName)
    );
    await sequelize.query(
      rawQueries.getAlterAiAssessmentAuditForeignKeysQuery(schemaName)
    );
  }

  private async createAITechnicalSummary(
    schemaName: string,
    sequelize: Sequelize
  ) {
    await sequelize.query(
      rawQueries.getCreateAiTechnicalSummarySequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateAiTechnicalSummaryTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAlterAiTechnicalSummaryForeignKeysQuery(schemaName)
    );
  }

  private async createAttachmentTimeline(
    schemaName: string,
    sequelize: Sequelize
  ) {
    await sequelize.query(
      rawQueries.getCreateAttachmentTimelineSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateAttachmentTimelineTableQuery(schemaName)
    );
  }

  private async createAttachmentTable(
    schemaName: string,
    sequelize: Sequelize
  ) {
    await sequelize.query(
      rawQueries.getCreateAttachmentSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateAttachmentsTableQuery(schemaName)
    );

    const indexQueries =
      rawQueries.getCreateAttachmentsIndexesQueries(schemaName);
    for (const query of indexQueries) {
      await sequelize.query(query);
    }
  }

  private async createAccountDetailsTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateAccountDetailsTableQuery(schemaName)
    );

    const fieldsToIndex = [
      "account_name",
      "fiscal_start_date",
      "fiscal_end_date",
      "data_storage",
      "business_details",
    ];

    const queries = rawQueries.getCreateIndexesForAccountDetails(
      schemaName,
      fieldsToIndex
    );

    for (const query of queries) {
      await sequelize.query(query);
    }
  }

  async fetchKeyContactRoles(entity_type: string): Promise<any[]> {
    const sequelize = await initSequelize();
    const result = await sequelize.query(
      rawQueries.getActiveKeyContactRolesByEntityTypeQuery(entity_type)
    );
    return result[0];
  }

  private async createAccountFiscalTable(schemaName: string, sequelize: any) {
    // First, create the sequence (if needed)
    await sequelize.query(
      rawQueries.getCreateAccountFiscalSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateAccountFiscalTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAccountFiscalForeignKeyQuery(schemaName)
    );

    const indexQueries = rawQueries.getAccountFiscalIndexesQueries(schemaName);
    for (const query of indexQueries) {
      await sequelize.query(query);
    }
  }

  private async createAccountFiscalRegionTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateAccountFiscalRegionSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateAccountFiscalRegionTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAccountFiscalRegionForeignKeyQuery(schemaName)
    );
  }

  private async createProjectTable(schemaName: string, sequelize: any) {
    // First, create the sequence (if needed)
    await sequelize.query(rawQueries.getCreateProjectSequenceQuery(schemaName));

    await sequelize.query(rawQueries.getCreateProjectTableQuery(schemaName));

    await sequelize.query(rawQueries.getCreateProjectTableQuery(schemaName));

    // Fields to index (excluding rid and r_number)
    const fieldsToIndex = [
      "project_code",
      "industry_rid",
      "account_rid",
      "project_name",
      "project_type_rid",
      "project_classification_rid",
      "project_client_group",
      "project_group",
      "status_rid",
      "country_rid",
      "region_rid",
      "currency_rid",
      "total_effort",
      "total_cost",
      "total_fte",
    ];

    // Create indexes conditionally
    for (const field of fieldsToIndex) {
      await sequelize.query(
        rawQueries.getProjectFieldIndexQuery(schemaName, field)
      );
    }
  }

  private async createProjectHistoryTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateProjectHistorySequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateProjectHistoryTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddProjectHistoryForeignKeyQuery(schemaName)
    );
  }

  private async createProjectFiscalTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateProjectFiscalSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateProjectFiscalTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getProjectFiscalForeignKeyQuery(schemaName)
    );

    // Fields to index (excluding rid and r_number)
    const fieldsToIndex = [
      "project_rid",
      "project_code",
      "fiscal_year",
      "project_name",
      "project_type_rid",
      "project_classification_rid",
      "project_client_group",
      "project_group",
      "account_rid",
      "country_rid",
      "status_rid",
    ];

    for (const field of fieldsToIndex) {
      await sequelize.query(
        rawQueries.getProjectFiscalIndexQuery(schemaName, field)
      );
    }
  }

  private async createProjectFiscalRegionTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateProjectFiscalRegionSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateProjectFiscalRegionTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddProjectFiscalRegionForeignKeysQuery(schemaName)
    );
  }

  private async createProjectTimelineTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateProjectTimelineSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateProjectTimelineTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddProjectTimelineForeignKeysQuery(schemaName)
    );
  }

  private async createProjectResourcesTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateProjectResourceSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateProjectResourceTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getProjectResourceForeignKeysQuery(schemaName)
    );
  }

  private async createProjectResourcesTimelineTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateProjectResourceTimelineSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateProjectResourceTimelineTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddProjectResourceTimelineConstraintsQuery(schemaName)
    );
  }

  private async createProjectResourcesHistoryTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateProjectResourceHistorySequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateProjectResourceHistoryTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddProjectResourceHistoryConstraintsQuery(schemaName)
    );
  }

  private async createDocumentTable(schemaName: string, sequelize: any) {
    // First, create the sequence (if needed)
    await sequelize.query(
      rawQueries.getCreateDocumentSequenceQuery(schemaName)
    );

    await sequelize.query(rawQueries.getCreateDocumentTableQuery(schemaName));
  }

  private async createImportTable(schemaName: string, sequelize: any) {
    // First, create the sequence (if needed)
    await sequelize.query(rawQueries.getCreateImportSequenceQuery(schemaName));

    await sequelize.query(rawQueries.getCreateImportTableQuery(schemaName));
  }

  private async createClientFirmDocumentTemplate(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateClientFirmDocumentTemplateTableQuery(schemaName)
    );
  }

  private async createClientFirmDocumentTemplateMetadata(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateClientFirmDocumentTemplateMetadataTableQuery(
        schemaName
      )
    );
  }

  private async createKafkaEventsTable(schemaName: string, sequelize: any) {
    // First, create the sequence (if needed)
    await sequelize.query(
      rawQueries.getCreateKafkaEventsSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateKafkaEventsTableQuery(schemaName)
    );
  }

  private async createResourcesTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateResourcesSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateResourcesTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddResourcesForeignKeyQuery(schemaName)
    );

    // List of columns to index (excluding rid and comments)
    const indexQueries =
      rawQueries.getCreateResourcesIndexesQueries(schemaName);
    for (const query of indexQueries) {
      await sequelize.query(query);
    }
  }

  private async createResourceFiscalTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateResourceFiscalSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateResourceFiscalTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddResourceFiscalForeignKeysQuery(schemaName)
    );

    const indexQueries = rawQueries.getCreateResourceFiscalIndexes(schemaName);
    for (const query of indexQueries) {
      await sequelize.query(query);
    }
  }

  private async createResourceFiscalRegionTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateResourceFiscalRegionSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateResourceFiscalRegionTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getResourceFiscalRegionForeignKeysQuery(schemaName)
    );
  }

  private async createProjectTaskTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateProjectTasksSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateProjectTaskTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddProjectTaskConstraintsQuery(schemaName)
    );
  }

  private async createProjectTaskTimeLineTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateProjectTaskTimelineSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateProjectTaskTimelineTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddProjectTaskTimelineConstraintsQuery(schemaName)
    );
  }

  private async createProjectTaskHistoryTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateProjectTaskHistorySequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateProjectTaskHistoryTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddProjectTaskHistoryConstraintsQuery(schemaName)
    );
  }

  private async createResourceHistoryTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateResourcesHistorySequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateResourcesHistoryTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddResourcesHistoryForeignKeyQuery(schemaName)
    );
  }

  private async createResourceTimelineTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateResourcesTimelineSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateResourcesTimelineTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddResourcesTimelineForeignKeysQuery(schemaName)
    );
  }

  private async createResourceCostTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateResourceCostSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateResourceCostTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddResourceCostAccountForeignKeyQuery(schemaName)
    );

    const indexQueries =
      rawQueries.getCreateResourceCostIndexesQueries(schemaName);
    for (const query of indexQueries) {
      await sequelize.query(query);
    }
  }

  private async createResourceCostTimelineTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateResourceCostTimelineSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateResourceCostTimelineTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddResourceCostTimelineForeignKeysQuery(schemaName)
    );
  }

  private async createResourceCostHistoryTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateResourceCostHistorySequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateResourceCostHistoryTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddResourceCostHistoryForeignKeyQuery(schemaName)
    );
  }

  private async createResourceSkillTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateResourceSkillSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateResourceSkillTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddResourceSkillAccountForeignKeyQuery(schemaName)
    );

    const indexQueries =
      rawQueries.getCreateResourceSkillIndexesQueries(schemaName);
    for (const query of indexQueries) {
      await sequelize.query(query);
    }
  }
  private async createResourceSkillTimelineTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateResourceSkillTimelineSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateResourceSkillTimelineTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddResourceSkillTimelineForeignKeysQuery(schemaName)
    );
  }

  private async createResourceSkillHistoryTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateResourceSkillHistorySequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateResourceSkillHistoryTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddResourceSkillHistoryForeignKeyQuery(schemaName)
    );
  }

  async createProjectResourceFiscalTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateProjectResourceFiscalSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateProjectResourceFiscalTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddProjectResourceFiscalConstraintsQuery(schemaName)
    );
  }

  async createProjectResourceFiscalRegionTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateProjectResourceFiscalRegionSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateProjectResourceFiscalRegionTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAddProjectResourceFiscalRegionConstraintsQuery(schemaName)
    );
  }

  private async createInteractionTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateInteractionsSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateInteractionsTableQuery(schemaName)
    );

    const indexQueries =
      rawQueries.getCreateInteractionsIndexesQueries(schemaName);
    for (const query of indexQueries) {
      await sequelize.query(query);
    }

    await sequelize.query(
      rawQueries.getCreateInteractionStatusHistoryTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateInteractionStatusChangeFunctionQuery(schemaName)
    );

    await sequelize.query(rawQueries.getDropTriggerQuery(schemaName));

    await sequelize.query(rawQueries.getCreateTriggerQuery(schemaName));
  }

  private async createInteractionHistoryTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateInteractionHistorySequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateInteractionHistoryTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAlterInteractionHistoryForeignKeysQuery(schemaName)
    );
  }

  private async createInteractionItemTable(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateInteractionItemSequencesQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateInteractionItemsTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAlterInteractionItemsForeignKeysQuery(schemaName)
    );

    const indexQueries =
      rawQueries.getCreateInteractionItemsIndexesQueries(schemaName);
    for (const query of indexQueries) {
      await sequelize.query(query);
    }
  }

  private async createInteractionResponseTable(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateInteractionResponseHistorySequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateInteractionResponseHistoryTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAlterInteractionResponseHistoryForeignKeysQuery(schemaName)
    );

    for (const query of rawQueries.getCreateInteractionResponseHistoryIndexes(
      schemaName
    )) {
      await sequelize.query(query);
    }
  }

  private async createInteractionAttachments(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateInteractionAttachmentsTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAlterInteractionAttachmentsForeignKeysQuery(schemaName)
    );

    for (const indexQuery of rawQueries.getCreateInteractionAttachmentsIndexes(
      schemaName
    )) {
      await sequelize.query(indexQuery);
    }
  }

  private async createInteractionTimeline(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateInteractionTimelineSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateInteractionTimelineTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAlterInteractionTimelineForeignKeysQuery(schemaName)
    );
  }

  private async createAutoSendInteractionAudit(
    schemaName: string,
    sequelize: any
  ) {
    await sequelize.query(
      rawQueries.getCreateAutosendInteractionAuditTableQuery(schemaName)
    );
    await sequelize.query(
      rawQueries.getAlterAutosendInteractionAuditForeignKeysQuery(schemaName)
    );

    for (const indexQuery of rawQueries.getCreateAutosendInteractionAuditIndexes(
      schemaName
    )) {
      await sequelize.query(indexQuery);
    }
  }

  private async createOtpEntries(schemaName: string, sequelize: any) {
    await sequelize.query(rawQueries.getCreateOtpEntriesTableQuery(schemaName));

    await sequelize.query(
      rawQueries.getAlterOtpEntriesForeignKeysQuery(schemaName)
    );
  }

  private async createOtpEntriesHistory(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateOtpEntriesHistoryTableQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getAlterOtpEntriesHistoryForeignKeysQuery(schemaName)
    );
  }

  private async createEmailWebhookHistory(schemaName: string, sequelize: any) {
    await sequelize.query(
      rawQueries.getCreateWebhookEmailHistoryTableQuery(schemaName)
    );
  }

  private async createNotesTable(schemaName: string, sequelize: Sequelize) {
    await sequelize.query(rawQueries.getCreateNotesSequenceQuery(schemaName));

    await sequelize.query(rawQueries.getCreateNotesTableQuery(schemaName));

    for (const indexQuery of rawQueries.getCreateNotesIndexes(schemaName)) {
      await sequelize.query(indexQuery);
    }
  }

  private async createNotesTimeline(schemaName: string, sequelize: Sequelize) {
    await sequelize.query(
      rawQueries.getCreateNotesTimelineSequenceQuery(schemaName)
    );

    await sequelize.query(
      rawQueries.getCreateNotesTimelineTableQuery(schemaName)
    );
  }

  async insertAccountDetails(
    account_number: string,
    accountData: IAccount,
    account_rid: string,
    userId: string
  ) {
    const schemaName = `${SCHEMANAME_PREFIX}${account_number.replace(
      /\D/g,
      ""
    )}`;
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
          max_ai_interactions: DEFAULT_ACCOUNT_DETAILS.maxAiInteraction,
          autosend_interaction: false,
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
          auto_access_rd: false,
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
    const schemaName = `${SCHEMANAME_PREFIX}${account_number.replace(
      /\D/g,
      ""
    )}`;
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
    const schemaName = `${SCHEMANAME_PREFIX}${account_number.replace(
      /\D/g,
      ""
    )}`;
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
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
        /\D/g,
        ""
      )}`;

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
            this.deleteKeyContactDetails(account_rid, contact.rid, schemaName);
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
    } catch (err) {
      errorLog("Error in manageKeyContacts: ", (err as Error).message);
    }
  }
  async updateAccountDetails(
    account_rid: string,
    accountData: IUpdateAccount,
    account_number: string,
    userId: string
  ) {
    const schemaName = `${SCHEMANAME_PREFIX}${account_number.replace(
      /\D/g,
      ""
    )}`;
    const sequelize = await initOrgSequelize();

    await sequelize.query(
      `
        UPDATE "${schemaName}"."account_details"
        SET 
          interaction_cc_list = :interaction_cc_list,
          modified_by = :modified_by,
          website = :website,
          modified_datetime = :modified_datetime,
          business_details = :business_details
        WHERE account_rid = :account_rid;
      `,
      {
        replacements: {
          account_rid: account_rid,
          interaction_cc_list: accountData.interaction_cc_list ?? null,
          modified_by: userId,
          website: accountData.website ?? null,
          business_details: accountData.business_details,
          comments: accountData.comments ?? null,
          modified_datetime: new Date(),
        },
      }
    );
  }

  async fetchAccountDetails(
    account_number: string,
    account_rid: string,
    parentAccountId: string,
    isParentAccount: boolean
  ) {
    let schemaName = `${SCHEMANAME_PREFIX}${account_number.replace(/\D/g, "")}`;
    try {
      const query = rawQueries.fetchAccountDetails(schemaName, account_rid);

      const parentAccountQuery = rawQueries.fetchAccountDetails(
        schemaName,
        parentAccountId
      );

      const sequelize = await initOrgSequelize();

      const users: any = await sequelize.query(query, {
        type: "SELECT",
      });
      const fetchParentAccount: any = await sequelize.query(
        parentAccountQuery,
        {
          type: "SELECT",
        }
      );
      if (!isParentAccount) {
        const parentRnumber = rawQueries.getParentAccountByRidQuery();
        const mainSequelize = await initSequelize();
        const [parentAccountInfo]: any[] = await mainSequelize.query(
          parentRnumber,
          {
            replacements: { parentAccountId },
            type: "SELECT",
          }
        );
        let schemaNameParent = `trd365_${parentAccountInfo.r_number.replace(
          /\D/g,
          ""
        )}`;
        const parentquery = rawQueries.fetchAccountDetails(
          schemaNameParent,
          parentAccountId
        );
        const parentSubscriptioninfo: any = await sequelize.query(parentquery, {
          type: "SELECT",
        });
        if (parentSubscriptioninfo && parentSubscriptioninfo.length > 0) {
          logMessage(
            "Parent Subscription Info: " +
              JSON.stringify(parentSubscriptioninfo)
          );
          const parentDetails = parentSubscriptioninfo[0];

          const isSubscriptionCreated = Boolean(
            parentDetails.subscription_created &&
              parentDetails.tenant_id &&
              parentDetails.client_id &&
              parentDetails.client_secret
          );
          if (Array.isArray(users) && users.length > 0) {
            users[0].is_send_interaction = isSubscriptionCreated;
          }
        } else {
          if (Array.isArray(users) && users.length > 0) {
            const clientSecret = users[0]?.client_secret;
            if (clientSecret) {
              const decryptedSecret = await decryptClientSecret(clientSecret);
              users[0].client_secret = decryptedSecret;
            }
            users[0].is_send_interaction = false;
          }
        }
      } else {
        if (fetchParentAccount && fetchParentAccount.length > 0) {
          const parentDetails = fetchParentAccount[0];

          const isSubscriptionCreated = Boolean(
            parentDetails.subscription_created &&
              parentDetails.tenant_id &&
              parentDetails.client_id &&
              parentDetails.client_secret
          );

          if (Array.isArray(users) && users.length > 0) {
            users[0].is_send_interaction = isSubscriptionCreated;
          }
        } else {
          if (Array.isArray(users) && users.length > 0) {
            const clientSecret = users[0]?.client_secret;
            if (clientSecret) {
              const decryptedSecret = await decryptClientSecret(clientSecret);
              users[0].client_secret = decryptedSecret;
            }
            users[0].is_send_interaction = false;
          }
        }
      }
      if (!isParentAccount) {
        if (Array.isArray(users) && users.length > 0) {
          users[0].subscription_created = false;
          users[0].tenant_id = "";
          users[0].client_id = "";
          users[0].client_secret = "";
          users[0].support_email = "";
        }
      }

      return users;
    } catch (err) {
      errorLog("Error in fetchAccountDetails: ", (err as Error).message);
      throw new Error("Error retrieving account details");
    }
  }
  async fetchUserNames(created_by: string) {
    const sequelize = await initSequelize();
    return await sequelize.query(rawQueries.getFullNameByUserIdQuery(), {
      replacements: { userId: created_by },
      type: "SELECT",
    });
  }

  async fetchKeyContacts(account_rid: string, accountNumber: string) {
    try {
      const sequelize = await initOrgSequelize();
      const mainSequelize = await initSequelize();
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      const keyContact: any = await sequelize.query(
        rawQueries.getKeyContactsForAccountQuery(schemaName),
        {
          type: "SELECT",
          replacements: { account_rid },
        }
      );

      const keyContacts = keyContact || [];

      const keyContactIds = [
        ...new Set(keyContacts.map((r: any) => r.key_contact_role)),
      ].filter(Boolean);
      const statusIds = [
        ...new Set(keyContacts.map((r: any) => r.status_rid)),
      ].filter(Boolean);

      let keyContactMap: Record<string, string> = {};
      let statusMap: Record<string, string> = {};

      if (keyContactIds.length > 0) {
        const keyContactRows = await mainSequelize.query(
          rawQueries.getKeyContactRolesByIdsQuery(),
          {
            replacements: { ids: keyContactIds },
            type: "SELECT",
          }
        );

        keyContactMap = Object.fromEntries(
          keyContactRows.map((c: any) => [c.rid, c.role_name])
        );
      }
      if (statusIds.length > 0) {
        const statusRows = await mainSequelize.query(
          rawQueries.getStatusesByIdsQuery(),
          {
            replacements: { ids: statusIds },
            type: "SELECT",
          }
        );

        statusMap = Object.fromEntries(
          statusRows.map((s: any) => [s.rid, s.status_name])
        );
      }

      const enrichedKeyContacts = keyContacts.map((kc: any) => ({
        ...kc,
        role_name: keyContactMap[kc.key_contact_role] || null,
        status_name: statusMap[kc.status_rid] || null,
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
      rawQueries.deleteKeyContactForAccountQuery(schemaName),
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
        rawQueries.updateKeyContactForAccountQuery(schemaName),
        {
          replacements: {
            account_rid: account_rid,
            key_contact_id: keyContactDetails.rid,
            key_contact_name: keyContactDetails.key_contact_name,
            key_contact_email: keyContactDetails.key_contact_email,
            key_contact_role_rid: keyContactDetails.key_contact_role,
            status_rid: keyContactDetails.status_rid,
            is_primary_contact: keyContactDetails.is_primary_contact,
            interaction_cc_recipient:
              keyContactDetails.interaction_cc_recipient,
            include_in_communication:
              keyContactDetails.include_in_communication,
            modified_by: userId,
          },
        }
      );
    } catch (error) {
      errorLog("Error updating key contact details:", (error as Error).message);
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
        rawQueries.insertKeyContactForAccountQuery(schemaName),
        {
          replacements: {
            account_rid,
            key_contact_name: keyContactDetails.key_contact_name,
            key_contact_email: keyContactDetails.key_contact_email,
            key_contact_role_rid: keyContactDetails.key_contact_role,
            status_rid: keyContactDetails.status_rid,
            is_primary_contact: keyContactDetails.is_primary_contact,
            interaction_cc_recipient:
              keyContactDetails.interaction_cc_recipient,
            include_in_communication:
              keyContactDetails.include_in_communication,
            created_by: userId,
            modified_by: userId,
          },
        }
      );
    } catch (error) {
      errorLog(
        "Error inserting key contact details:",
        (error as Error).message
      );
      throw error;
    }
  }

  async createKeyContact(schemaName: string, sequelize: any) {
    try {
      await sequelize.query(
        rawQueries.getCreateKeyContactDetailsTableQuery(schemaName)
      );
    } catch (err) {
      throw err;
    }
  }

  async insertIndustyName(account: any) {
    try {
      const mainDdSequilze = await initSequelize();

      if (account.industry_rid) {
        const industryResult: any = await mainDdSequilze.query(
          rawQueries.getIndustryNameByIdQuery(),
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
        rawQueries.getKeyContactRolesWithRoleMapQuery(),
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
                  rawQueries.getKeyContactsByAccountRidsQuery(schema),
                  { replacements: { accountRids }, type: "SELECT" }
                );
              } catch (error) {
                errorLog(
                  `Key contacts query failed for schema ${schema}:`,
                  (error as Error).message
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
                const schemaName = `${SCHEMANAME_PREFIX}${schema.replace(
                  /\D/g,
                  ""
                )}`;
                return await orgDbSequelize.query(
                  rawQueries.getAccountFiscalSummaryByAccountRidsQuery(
                    schemaName
                  ),
                  { replacements: { accountRids }, type: "SELECT" }
                );
              } catch (error) {
                errorLog(
                  `Fiscal data skipped for schema ${schema}:`,
                  (error as Error).message
                );
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
          keyContactsResults
            .map((kc: any) => kc.key_contact_role)
            .filter(Boolean)
        ),
      ];

      const keyContactRoleMap = new Map<string, string>(
        roleRids.length
          ? (
              await sequelize.query(rawQueries.getKeyContactRolesByIdsQuery(), {
                replacements: { ids: roleRids },
                type: "SELECT",
              })
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
        const contact = keyContacts.find((kc) => kc.is_primary_contact);
        if (!contact) return { roleKey: null, name: null };

        const roleKey =
          Object.entries(roleKeyMap).find(
            ([_, value]) => value === contact.role_name
          )?.[0] || null;

        return {
          roleKey,
          name: contact.key_contact_name || null,
        };
      };
      // 7. Optimized account enrichment
      const enrichAccount = (account: any, isChild: boolean) => {
        const rawKeyContacts = accountKeyContactMap.get(account.rid) || [];
        const { roleKey, name } = getPrimaryContact(rawKeyContacts);
        // Prepare contacts with default values
        const preparedKeyContacts = rawKeyContacts.map((kc) => ({
          ...kc,
          role_name: kc.role_name || "",
          key_contact_name: kc.key_contact_name || "",
        }));

        // Apply filters only to parent accounts
        let keyContacts = preparedKeyContacts;
        const getPrimaryContactName = (roleName: string) => {
          const contact = keyContacts.find(
            (kc) => kc.role_name === roleName && kc.is_primary_contact
          );
          return contact?.key_contact_name || null;
        };

        return {
          ...account,
          key_contacts: keyContacts,
          primary_contact_role: roleKey || "",
          primary_contact_name: name || "", // technical_consultant: getPrimaryContactName("Technical Consultant") || "-",
          professional_services_consultant:
            getPrimaryContactName(
              roleKeyMap.professional_services_consultant
            ) || "-",
          finance_executive:
            getPrimaryContactName(roleKeyMap.finance_executive) || "-",
          finance_lead: getPrimaryContactName(roleKeyMap.finance_lead) || "-",
          ...(isChild && {
            projects_by_fiscal_year: accountFiscalMap.get(account.rid) || [],
          }),
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
      if (
        filters?.finance_lead ||
        filters?.finance_executive ||
        filters?.professional_services_consultant
      ) {
        const filterKeys = Object.keys(filters).filter((key) =>
          [
            "finance_lead",
            "finance_executive",
            "professional_services_consultant",
          ].includes(key)
        );
        for (const filterKey of filterKeys) {
          const filterValue = (filters as any)[filterKey];
          if (typeof filterValue === "string") {
            if (filterValue === "-" || filterValue.toLowerCase() === "empty") {
              // Filter for empty values
              enrichedAccounts = enrichedAccounts.filter((account: any) => {
                const contactName = account[filterKey] || "";
                return contactName.trim() === "";
              });
            } else {
              // Filter for contains match
              enrichedAccounts = enrichedAccounts.filter((account: any) => {
                const contactName = (account[filterKey] || "").toLowerCase();
                return contactName.includes(filterValue.toLowerCase());
              });
            }
          } else if (typeof filterValue === "object" && filterValue !== null) {
            const filterType = Object.keys(filterValue)[0];
            const filterVal = filterValue[filterType];
            const roleName = roleKeyMap[filterKey];
            enrichedAccounts = enrichedAccounts.filter((account: any) => {
              const contactName = account[filterKey] || "";
              // Step 2: Find the primary contact for this specific role
              const primaryContact = (account.key_contacts || []).find(
                (kc: any) => kc.is_primary_contact && kc.role_name === roleName
              );

              switch (filterType) {
                case "equals":
                  return (
                    contactName.toLowerCase() ===
                    String(filterVal).toLowerCase()
                  );

                case "not_equals":
                  if (!roleName) {
                    // Role mapping not found → exclude the account (filter key is invalid for this account)
                    return false;
                  }

                  // Step 3: If no primary contact exists for this role, exclude the account
                  if (!primaryContact) {
                    return false;
                  }

                  // Step 4: Check if the primary contact's name does NOT match the filter value
                  const contactNamenot =
                    primaryContact.key_contact_name?.toLowerCase() || "";
                  const filterValueNormalized = String(filterVal).toLowerCase();
                  return contactNamenot !== filterValueNormalized;
                case "contains":
                  return contactName
                    .toLowerCase()
                    .includes(String(filterVal).toLowerCase());

                case "is_empty":
                  if (!roleName) {
                    return false; // Invalid role → exclude account
                  }

                  if (filterVal === true) {
                    // Filter for empty: either no contact or empty name
                    return (
                      !primaryContact ||
                      !primaryContact.key_contact_name ||
                      primaryContact.key_contact_name.trim() === ""
                    );
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
        filters?.finance_lead ||
        filters?.finance_executive ||
        filters?.professional_services_consultant ||
        (sortBy && SORTABLE_FIELDS.has(sortBy));

      if (
        shouldPaginate &&
        limit !== undefined &&
        offset !== undefined &&
        type != "download"
      ) {
        enrichedAccounts = enrichedAccounts.slice(offset, offset + limit);
      }
      return { data: enrichedAccounts, total };
    } catch (err) {
      throw new Error("Error updating key contacts.");
    }
  }
  async insertFiscalInfoOnly(
    accountData: any,
    filters?: any,
    limit?: number,
    offset?: number,
    sortBy?: string,
    sortOrder?: string,
    type?: string,
    fiscalYear?: any
  ) {
    try {
      const orgDbSequelize = await initOrgSequelize();

      // 1. Prepare schema mappings
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

      // 2. Fetch fiscal data in parallel
      const fiscalResults = await (async () => {
        const queries = Array.from(schemaToAccountRids).map(
          async ([schema, accountRids]) => {
            try {
              const schemaName = `${SCHEMANAME_PREFIX}${schema.replace(
                /\D/g,
                ""
              )}`;

              // Build the base query
              let query = rawQueries.getAccountFiscalSummaryQuery(schemaName);

              // Add fiscal year condition only if it's provided
              const replacements: any = { accountRids };
              if (fiscalYear != null && fiscalYear != "FY-All") {
                query += ` AND fiscal_year = :fiscal_year`;
                replacements.fiscal_year = fiscalYear;
              }

              query += ` GROUP BY account_rid, fiscal_year`;

              return await orgDbSequelize.query(query, {
                replacements,
                type: "SELECT",
              });
            } catch (error) {
              errorLog(
                `Fiscal data skipped for schema ${schema}:`,
                (error as Error).message
              );
              return [];
            }
          }
        );
        return (await Promise.all(queries)).flat();
      })();

      // 3. Map fiscal data to account RID
      const accountFiscalMap = new Map<string, any[]>();
      fiscalResults.forEach((f: any) => {
        const fiscalData = accountFiscalMap.get(f.account_rid) || [];
        fiscalData.push(f);
        accountFiscalMap.set(f.account_rid, fiscalData);
      });

      // 4. Enrich accounts with fiscal data
      const enrichAccount = (account: any, isChild: boolean) => {
        return {
          ...account,
          ...(isChild && {
            projects_by_fiscal_year: accountFiscalMap.get(account.rid) || [],
          }),
        };
      };

      let enrichedAccounts = accountData.map((account: any) => {
        const parent = enrichAccount(account.dataValues, false);
        const children = (account.dataValues?.child_accounts || []).map(
          (c: any) => enrichAccount(c.dataValues, true)
        );

        parent.child_accounts = children;
        return parent;
      });
      // After enriching accounts with fiscal data, apply filtering
      let filteredAccounts = enrichedAccounts;
      if (fiscalYear != null && fiscalYear != "FY-All") {
        filteredAccounts = filteredAccounts
          .map((parent: any) => {
            // Filter child accounts - keep only those with fiscal data
            const filteredChildren =
              parent.child_accounts?.filter(
                (child: any) => child.projects_by_fiscal_year?.length > 0
              ) || [];
            // Return a copy of parent with filtered children
            return {
              ...parent,
              child_accounts: filteredChildren,
            };
          })
          // Filter out parents that have no children left after filtering
          .filter((parent: any) => parent.child_accounts?.length > 0);
      }

      return {
        data: filteredAccounts,
        total: filteredAccounts.length,
      };
    } catch (err) {
      throw new Error("Error fetching fiscal data.");
    }
  }

  async getOrgInfo() {
    try {
      const mainDdSequilze = await initSequelize();

      const result: any = await mainDdSequilze.query(
        rawQueries.getOrganizationLicensesQuery(),
        {
          type: "SELECT",
        }
      );

      const orgLicenseInfo = result[0];
      return orgLicenseInfo;
    } catch (err) {
      errorLog("Error in getOrgInfo: ", (err as Error).message);
      throw new Error("Error getOrgInfo: " + (err as Error).message);
    }
  }

  async fetchAttachments(account_rid: string): Promise<any[]> {
    try {
      const sequelize = await initSequelize();

      const result = await sequelize.query(
        rawQueries.getAttachmentSummaryByAccountRidQuery(),
        {
          replacements: { account_rid },
          type: QueryTypes.SELECT,
        }
      );

      return result;
    } catch (error) {
      errorLog("Error fetching attachments:", (error as Error).message);
      throw new Error("Failed to fetch attachments");
    }
  }

  async createUserGroup(
    accountData: IAccount,
    userId: string,
    is_parent: boolean,
    account_rid: string,
    parent_account_rid?: string | null
  ) {
    const sequelize = await initSequelize();
    const transaction = await sequelize.transaction();

    try {
      const groupTypeName = is_parent
        ? "AUTO_ASSIGNED_PARENT"
        : "AUTO_ASSIGNED_CHILD";

      const groupTypeResult = await sequelize.query<{ rid: string }>(
        rawQueries.SQL_GET_GROUP_TYPE,
        {
          replacements: { group_type_name: groupTypeName },
          type: QueryTypes.SELECT,
          transaction,
        }
      );

      const group_type_rid = groupTypeResult?.[0]?.rid;
      if (!group_type_rid) {
        throw new Error(`Group type '${groupTypeName}' not found.`);
      }

      const newGroupResult = await sequelize.query<{ rid: string }>(
        rawQueries.CREATE_AUTO_ASSIGNED_GROUP,
        {
          replacements: {
            group_name: "G-" + accountData.account_name,
            group_type_rid,
            created_by: userId,
          },
          type: QueryTypes.SELECT,
          transaction,
        }
      );

      const groupRid = newGroupResult?.[0]?.rid;
      if (!groupRid) throw new Error("Failed to create new user group.");

      // 4. If it's a child, map it to AUTO_ASSIGNED_PARENT group of parent
      if (!is_parent && parent_account_rid) {
        const autoAssignedParentGroup = await sequelize.query<{
          group_rid: string;
        }>(rawQueries.GET_PARENT_USER_GROUP_TYPE, {
          replacements: { parent_account_rid },
          type: QueryTypes.SELECT,
          transaction,
        });

        const parentGroupRid = autoAssignedParentGroup?.[0]?.group_rid;
        if (parentGroupRid) {
          await sequelize.query(rawQueries.CREATE_ENTITY_ACCESS, {
            replacements: {
              group_rid: parentGroupRid,
              entity_rid: account_rid,
              created_by: userId,
            },
            transaction,
          });
          // 5. Insert into user_group_account_mapping for parent
          await sequelize.query(rawQueries.CREATE_ACCOUNT_MAPPING, {
            replacements: {
              group_rid: parentGroupRid,
              account_rid,
              created_by: userId,
            },
            transaction,
          });
        }
      }
      // 5. Insert into user_group_account_mapping
      await sequelize.query(rawQueries.CREATE_ACCOUNT_MAPPING, {
        replacements: {
          group_rid: groupRid,
          account_rid,
          created_by: userId,
        },
        transaction,
      });

      // 6. Insert into user_group_entity_access
      await sequelize.query(rawQueries.CREATE_ENTITY_ACCESS, {
        replacements: {
          group_rid: groupRid,
          entity_rid: account_rid,
          created_by: userId,
        },
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      errorLog("Error in createUserGroup:", (err as Error).message);
      throw err;
    }
  }

  async getUserGroupType(userRid: string): Promise<string | null> {
    const mainDbSequelize = await initSequelize();

    try {
      const results = await mainDbSequelize.query<{ group_type: string }>(
        rawQueries.GET_USER_GROUP_TYPE, // Important if user can only have one group type
        {
          replacements: { userRid },
          type: QueryTypes.SELECT,
        }
      );

      if (!results || results.length === 0) {
        return null;
      }

      return results[0]?.group_type;
    } catch (error) {
      // Log the error for debugging
      errorLog("Error fetching user group type:", (error as Error).message);
      throw new Error("Failed to get user group type");
    }
  }
  async getAccessibleAccountInfo(userRid: string): Promise<
    Array<{
      id: string;
      isChild: boolean;
      parentId: string | null;
    }>
  > {
    const mainDbSequelize = await initSequelize();

    try {
      // 1. Direct access with account info
      const directAccess = await mainDbSequelize.query<{
        entity_rid: string;
        parent_account_rid: string | null;
        is_child: boolean;
      }>(rawQueries.GET_ACCOUNT_DIRECT_ACCESS_USER_IDS, {
        replacements: { userRid },
        type: QueryTypes.SELECT,
      });

      // 2. Direct EXCLUDE access — normalize and store in a Set
      const directExclude = await mainDbSequelize.query<{ entity_rid: string }>(
        rawQueries.GET_ACCOUNT_DIRECT_EXCLUDE_ACCESS_USER_IDS,
        {
          replacements: { userRid },
          type: QueryTypes.SELECT,
        }
      );

      const excludedEntityRids = new Set(
        directExclude.map((e) => e.entity_rid?.trim().toLowerCase())
      );

      // 3. Group INCLUDE access
      const groupAccess = await mainDbSequelize.query<{
        entity_rid: string;
        parent_account_rid: string | null;
        is_child: boolean;
      }>(rawQueries.GET_GROUP_ACCESS, {
        replacements: { userRid },
        type: QueryTypes.SELECT,
      });

      // 3. Combine and deduplicate
      const allAccess = [...directAccess, ...groupAccess];
      const uniqueAccess = new Map<
        string,
        {
          id: string;
          isChild: boolean;
          parentId: string | null;
        }
      >();

      allAccess.forEach((access) => {
        const normalizedEntityId = access.entity_rid?.trim().toLowerCase();
        if (
          !excludedEntityRids.has(normalizedEntityId) &&
          !uniqueAccess.has(normalizedEntityId)
        ) {
          uniqueAccess.set(normalizedEntityId, {
            id: access.entity_rid,
            isChild: access.is_child,
            parentId: access.parent_account_rid,
          });
        }
      });

      return Array.from(uniqueAccess.values());
    } catch (err) {
      errorLog("Error in getAccessibleAccountInfo:", (err as Error).message);
      return [];
    }
  }

  async getAllowedExportFields(
    userId: string,
    permission_name: string
  ): Promise<any[]> {
    const mainDbSequelize = await initSequelize();
    const [userInfo] = (await mainDbSequelize.query(
      rawQueries.GET_USER_PROFILE,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    )) as [{ profile_rid: string }] | [];

    if (!userInfo?.profile_rid) {
      return [];
    }

    const sequelize = await initSequelize();
    const [profileFields, userFields] = await Promise.all([
      sequelize.query(rawQueries.GET_PROFILE_PERMISSION, {
        replacements: {
          permissionName: permission_name,
          profileId: userInfo?.profile_rid,
        },
        type: "SELECT",
      }),
      sequelize.query(rawQueries.GET_USER_EXTENDED_PERMISSION, {
        replacements: {
          permissionName: permission_name,
          userId,
        },
        type: QueryTypes.SELECT,
      }),
    ]);

    // Merge: user overrides profile
    const userFieldMap = new Map<string, any>();
    for (const field of userFields as any[]) {
      userFieldMap.set(field.field_name, field);
    }

    const merged = (profileFields as any[]).map((pf) => {
      const userPerm = userFieldMap.get(pf.field_name);
      if (userPerm) {
        userFieldMap.delete(pf.field_name);
        return {
          field_desc: pf.field_desc,
          field_name: pf.field_name,
          read: pf.read ? true : userPerm?.read === true,
        };
      }
      return {
        field_desc: pf.field_desc,
        field_name: pf.field_name,
        read: pf.read,
      };
    });

    const userOnly = Array.from(userFieldMap.values()).map((uf) => ({
      field_desc: uf.field_desc,
      field_name: uf.field_name,
      read: uf.read,
    }));

    const exportableFields = [...merged, ...userOnly].filter((f) => f.read);
    return exportableFields;
  }
  async updateGroupNameForAccount(
    accountRid: string,
    userId: string,
    is_parent: boolean,
    accountName: string
  ): Promise<void> {
    const sequelize: Sequelize = await initSequelize();
    const groupTypeName = is_parent
      ? "AUTO_ASSIGNED_PARENT"
      : "AUTO_ASSIGNED_CHILD";
    const result = await sequelize.query<{ rid: string; group_name: string }>(
      rawQueries.SQL_GET_EX_GROUP_DATA,
      {
        replacements: {
          account_rid: accountRid,
          group_type_name: groupTypeName,
        },
        type: QueryTypes.SELECT,
      }
    );
    const groupRid = result?.[0]?.rid;
    await sequelize.query(rawQueries.UPDATE_GROUP_NAME, {
      replacements: {
        group_name: "G-" + accountName,
        group_rid: groupRid,
      },
    });
  }
}
export default SchemaService;
