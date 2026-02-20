import moment, { Moment } from "moment";
import "moment-timezone";
import { initOrgSequelize } from "../config/orgDataSource";
import { Attachment, setupAttachmentSeq } from "../models/attachments";
import { DOSSIER_NAME, entityTypes, eventNames, eventTypes, HttpStatus, MAIN_SCHEMA_NAME, rawQueries } from "../utils/constants";
import { ICreateAttachment } from "../utils/types";
import { Op, QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../config/mainDataSource";
import SchemaService from "./schemaService";
import { Logger } from "winston";
import { AttachmentTimeline, setupAttachmentTimelineSequence } from "../models/attachmentTimeline";
import { errorLog, logMessage, uploadToAzureBlob } from "../utils/helpers";
import ProjectIngestionService from "./projectIngestionService";
import { ResourceService } from "./resourceServices";
import ResourceCostService from "./resourceCostService";
import ResourceSkillService from "./resourceSkillService";
import { DocumentType } from "../models/documentType";
import { AttachmentSummary } from "../models/attachmentSummary";
import { generateSasUrl } from "../utils/blob";
import { isValidTimezone } from "../utils/valideTimeChecker";


export class AttachmentService {
  private schemaService: SchemaService;
  private projectIngestionService: ProjectIngestionService;
  private resourceService: ResourceService;
  private resourceCostService: ResourceCostService;
  private resourceSkillService: ResourceSkillService;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.schemaService = new SchemaService();
    this.projectIngestionService = new ProjectIngestionService(logger);
    this.resourceService = new ResourceService();
    this.resourceCostService = new ResourceCostService();
    this.resourceSkillService = new ResourceSkillService();
  }

  /**
 * Creates a new attachment record along with related timeline and summary entries.
 *
 * This async function performs several validation and setup steps:
 * - Validates the account existence and status.
 * - Determines the correct account number based on storage type and parent account logic.
 * - Ensures the associated schema exists and creates attachment-related tables if necessary.
 * - Uploads the file to Azure Blob Storage.
 * - Validates document name length.
 * - Creates entries in `Attachment`, `AttachmentTimeline`, and `AttachmentSummary` tables.
 *
 * Returns a structured response with success or error details, depending on the outcome.
 *
 * @param {ICreateAttachment} attachmentData - The data required to create the attachment, including document metadata and account identifiers.
 * @param {string} userId - The ID of the user performing the operation.
 * @param {Express.Multer.File} file - The uploaded file object received via Multer middleware.
 *
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { attachment: any };
  * }>} - The result of the attachment creation operation, including error message if applicable.
  *
  * @throws {Error} - Throws if any validation or service step fails during the process.
  */ 
  async createAttachment(
    attachmentData: ICreateAttachment,
    userId: string,
    file: Express.Multer.File
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { attachment: any };
  }> {
    try {
      const { account_rid, attachment_level } = attachmentData;

      const accountData = await this.schemaService.fetchAccountById(
        account_rid
      );

      if (!accountData) {
        logMessage(`Attachment creation failed: Invalid account ID ${account_rid}`);
        throw new Error("Attachment creation failed: Invalid account ID");
      }

      if (accountData.status !== "active") {
        logMessage(`Attachment creation failed: The selected account ${account_rid} is inactive.`);
        throw new Error(
          "Attachment creation failed: The selected account is inactive. Please choose an active account."
        );
      }

      let accountNumber = accountData.r_number;

      if (accountData.is_parent && attachment_level !== "account") {
        logMessage(`Attachment creation failed: Invalid account ID ${account_rid}`);
        throw new Error("Attachment creation failed: Invalid account ID");
      }

      if (accountData.storage_type === "store_in_parent") {
        accountNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountNumber
      );

      if (!isExists) {
        logMessage(`Attachment creation failed: schema doesn't exists for account number ${accountNumber}`);
        throw new Error("Attachment creation failed: schema doesn't exists");
      }

      await this.createAttachmentTables(accountNumber);

        const { url, name, extension, size } = await uploadToAzureBlob(file, account_rid, accountData.r_number);
        
        if(name.length > 100) {
          logMessage("Document name cannot exceed 100 characters: " + name);
            throw new Error("Document name cannot exceed 100 characters");
        }

      // Create the attachment record
      const attachmentModel = await Attachment.create({
        browse_file: url,
        document_name: name,
        attach_to: attachmentData.attach_to,
        attachment_level: attachmentData.attachment_level,
        fiscal_year: attachmentData.fiscal_year,
        account_rid: account_rid,
        format: extension,
        size_in_mb: size,
        document_category_rid: attachmentData.document_category_rid,
        document_type_rid: attachmentData.document_type_rid,
        document_category_others:
          attachmentData.document_category_others || null,
        document_type_others: attachmentData.document_type_others || null,
        comments: attachmentData.comments || null,
        created_by: userId,
      });

      const userEventInfo:any = await this.schemaService.fetchUserAndEventInfo({
                                                      userId: userId!,
                                                      eventType: eventTypes.UI_HANDLER
                                                    });
              // Use SchemaService to determine timeline entity type(s)
      const timelineTypes = this.schemaService.getTimelineTypesForAttachmentLevel(attachmentData.attachment_level);
      
      await this.schemaService.createAccountTimelineEntry(accountNumber!, {
                created_by: userId!,
                account_rid: account_rid,
                entity_rid: attachmentModel.rid,
                entity_name: entityTypes.ATTACHMENT,
                created_by_name: userEventInfo.full_name,
                event_type_rid: userEventInfo.event_type_rid,
                event_name: eventNames.CREATE,
                descriptions: name
              }, timelineTypes);

      await AttachmentTimeline.create({
        document_rid: attachmentModel.rid,
        document_name: attachmentModel.document_name,
        document_category_rid: attachmentModel.document_category_rid,
        document_type_rid: attachmentModel.document_type_rid,
        created_by: userId,
        modified_by: userId,
        attach_to: attachmentData.attach_to,
        attachment_level: attachmentData.attachment_level,
        event_type: "ui handler",
        event_status: "success",
        event_name: "create",
        event_datetime: new Date(),
      });

      await AttachmentSummary.create({
        r_number: attachmentModel.r_number,
        browse_file: attachmentModel.browse_file,
        document_name: attachmentModel.document_name,
        document_rid: attachmentModel.rid,
        attach_to: attachmentModel.attach_to,
        attachment_level: attachmentModel.attachment_level,
        fiscal_year: attachmentModel.fiscal_year,
        account_rid: account_rid,
        format: extension,
        size_in_mb: size,
        document_category_rid: attachmentModel.document_category_rid,
        document_type_rid: attachmentModel.document_type_rid,
        document_category_others:
          attachmentModel.document_category_others || null,
        document_type_others: attachmentModel.document_type_others || null,
        comments: attachmentModel.comments || null,
        created_by: userId,
      });

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { attachment: attachmentModel },
      };
    } catch (error) {
        errorLog('Error creating attachment:', (error as Error).message);
        
        // Handle specific errors
        if ((error as any).name === 'SequelizeForeignKeyConstraintError') {
            return {
                statusCode: 400,
                message: 'Invalid reference',
                errorMessage: 'The specified document category or type does not exist'
            };
        }

      return {
        statusCode: 500,
        message: "Failed to create attachment",
        errorMessage:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  }

  async createAttachmentTables(accountNumber: string) {
    try {
      const orgDbSequlize = await initOrgSequelize();
      const mainDbSequlize = await initMainDbSequelize();
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const AttachmentModel = await Attachment.initialize(
        orgDbSequlize,
        schemaName
      );

      const AttachmentTimelineModel = await AttachmentTimeline.initialize(
        orgDbSequlize,
        schemaName
      );

      const AttachmentSummaryModel =
        AttachmentSummary.initialize(mainDbSequlize);

      await AttachmentModel.sync({ force: false });
      await AttachmentTimelineModel.sync({ force: false });
      await AttachmentSummaryModel.sync({ force: false });

      await setupAttachmentSeq(orgDbSequlize, schemaName);
      await setupAttachmentTimelineSequence(orgDbSequlize, schemaName);
    } catch (err) {
      errorLog('Error creating attachment tables:', (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }

  /**
 * Retrieves a list of attachments based on various filters, levels, and pagination options.
 *
 * This function dynamically builds the attachments query based on:
 * - Attachment level (account, project, resource, etc.)
 * - Entity ID (to fetch attachments related to a specific entity)
 * - Filters and search criteria
 * - Sorting and pagination preferences
 *
 * It supports complex hierarchical fetching for child entities (e.g. fetching attachments for
 * project resources and tasks under a project or resources under an account).
 * It also enriches the result with display names for attached entities, user info, and
 * document type/category names from the main schema.
 *
 * @param {string} userId - The ID of the user making the request.
 * @param {string} [attachmentLevel] - The level of attachment (e.g. 'account', 'project', 'resource').
 * @param {string} [entityId] - The specific entity RID the attachments are tied to.
 * @param {string} [accountRid] - The account RID, required for schema and data scoping.
 * @param {number} [page=1] - The page number for pagination.
 * @param {number} [limit=10] - The number of records per page.
 * @param {string} [search] - Optional search term for filtering attachments by text fields.
 * @param {Record<string, any>} [filters={}] - Additional dynamic filters to apply.
 * @param {string} [sortBy='created_datetime'] - The field to sort results by.
 * @param {string} [sortOrder='DESC'] - The sort order, either 'ASC' or 'DESC'.
 * @param {number} [fiscalYear=0] - Optional fiscal year filter.
 * @param {any} [graphqlData] - Optional GraphQL context object containing specific attachment constraints.
 *
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { attachments: any[]; totalCount: number };
  * }>} - Returns a structured response with a paginated list of enriched attachment objects
  *       or an error message in case of failure.
  *
  * @throws {Error} - Throws if the account is invalid, schema initialization fails, or any DB query errors occur.
  */ 
  async getAttachments(
    userId: string,
    attachmentLevel?: string,
    entityId?: string,
    accountRid?: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "DESC",
    fiscalYear: number = 0,
    graphqlData?: any,
    type? : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { attachments: any[]; totalCount: number };
  }> {
    try {
      if (!accountRid) throw new Error("Account RID is required");

      const orgDbSequelize = await initOrgSequelize();
      if (!orgDbSequelize)
        throw new Error("Failed to initialize database connection");

      const accountData = await this.schemaService.fetchAccountById(accountRid);
      if (!accountData) throw new Error("Invalid account ID");

      let schemaNumber = accountData.r_number;
      if (accountData.storage_type === "store_in_parent") {
        schemaNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(
        /\D/g,
        ""
      )}`;
      const AttachmentModel = Attachment.initialize(orgDbSequelize, schemaName);

      let allAttachments: any[] = [];

      // Handle attached_to and uploaded_by filters separately
      let attachedToFilter;
      let uploadedByFilter;
      let projectNameFilter;
      let projectCodeFilter;
      if (filters.attached_to) {
        attachedToFilter = filters.attached_to;
        delete filters.attached_to;
      }
      if (filters.uploaded_by) {
        uploadedByFilter = filters.uploaded_by;
        delete filters.uploaded_by;
      }
      if (filters.project_name) {
        projectNameFilter = filters.project_name;
        delete filters.project_name;
      }
      if (filters.project_code) {
        projectCodeFilter = filters.project_code;
        delete filters.project_code;
      }

      const { whereClause } = this.buildRawWhereClause(filters, search);

      if (fiscalYear !== 0) {
        if (!whereClause[Op.and]) {
          whereClause[Op.and] = [];
        }
        whereClause[Op.and].push({ fiscal_year: fiscalYear });
      }

      // 🔷 Helper functions

    const fetchAttachments = async (model: any, level: string, attachToIds: string[]) => {
      if (attachToIds.length === 0) return [];
      let where;
      if(graphqlData?.document_rid) {
      logMessage(`Doc Id : ${graphqlData.document_rid}`);
        where = {
          rid : graphqlData.document_rid,
          attachment_level : level,
          attach_to : { [Op.in]: attachToIds }
        };
      
        let arrayData = []
        arrayData.push(await model.findOne({ where }))
        return arrayData
      } else {
        let attachmentLevel;

        if(level === "case") {
          attachmentLevel = ["case", "close case"]
        } else {
          attachmentLevel = [level]
        }
        where = {
          [Op.and]: [
            { attachment_level: {
              [Op.in] : attachmentLevel
            } },
            { attach_to: { [Op.in]: attachToIds } },
            ...(whereClause[Op.and] || [])
          ]
        };
        return model.findAll({ where });
      }
    };

      // 🔷 Optimized resource cost and skill attachments fetch for multiple resources
      const fetchResourceCostSkillAttachmentsBulk = async (
        model: any,
        resourceIds: string[]
      ) => {
        let resourceCostSkillAttachments: any[] = [];
        if (resourceIds.length === 0) return resourceCostSkillAttachments;

        // 🔹 Fetch all resource_costs in one call
        const resourceCosts =
          await this.resourceCostService.getResourceCostsByResourceIds(
            schemaNumber,
            resourceIds
          );
        const allResourceCostIds = resourceCosts.map((rc) => rc.rid);
        if (allResourceCostIds.length > 0) {
          const resourceCostAttachments = await fetchAttachments(
            model,
            "resource_cost",
            allResourceCostIds
          );
          resourceCostSkillAttachments.push(...resourceCostAttachments);
        }

        // 🔹 Fetch all resource_skills in one call
        const resourceSkills =
          await this.resourceSkillService.getResourceSkillsByResourceIds(
            schemaNumber,
            resourceIds
          );
        const allResourceSkillIds = resourceSkills.map((rs) => rs.rid);
        if (allResourceSkillIds.length > 0) {
          const resourceSkillAttachments = await fetchAttachments(
            model,
            "resource_skill",
            allResourceSkillIds
          );
          resourceCostSkillAttachments.push(...resourceSkillAttachments);
        }

        return resourceCostSkillAttachments;
      };

      // 🔷 Optimized project resource + task attachments fetch for multiple projects
      const fetchProjectResourceTaskAttachmentsBulk = async (
        model: any,
        projectIds: string[]
      ) => {
        let projectChildAttachments: any[] = [];
        if (projectIds.length === 0) return projectChildAttachments;

        // 🔹 Fetch all project_resources under projects in one call
        const projectResources =
          await this.projectIngestionService.getProjectResourcesByProjectIds(
            schemaNumber,
            projectIds
          );
        const projectResourceIds = projectResources.map((r) => r.rid);

        if (projectResourceIds.length > 0) {
          const projectResourceAttachments = await fetchAttachments(
            model,
            "project_resource",
            projectResourceIds
          );
          projectChildAttachments.push(...projectResourceAttachments);
        }

        // 🔹 Fetch all project_tasks under projects in one call
        const projectTasks =
          await this.projectIngestionService.getProjectTasksByProjectIds(
            schemaNumber,
            projectIds
          );
        const projectTaskIds = projectTasks.map((t) => t.rid);

        if (projectTaskIds.length > 0) {
          const projectTaskAttachments = await fetchAttachments(
            model,
            "project_task",
            projectTaskIds
          );
          projectChildAttachments.push(...projectTaskAttachments);
        }

        return projectChildAttachments;
      };

      // 🔷 Non-parent account logic with batched optimized fetches
      if (attachmentLevel === "account" && entityId) {
        const accountAttachments = await fetchAttachments(
          AttachmentModel,
          "account",
          [entityId]
        );
        allAttachments.push(...accountAttachments);

        const projects =
          await this.projectIngestionService.getProjectsByAccountId(
            schemaNumber,
            entityId
          );
        const projectIds = projects.map((p) => p.rid);
        if (projectIds.length > 0) {
          const projectAttachments = await fetchAttachments(
            AttachmentModel,
            "project",
            projectIds
          );
          allAttachments.push(...projectAttachments);

          const projectChildAttachments =
            await fetchProjectResourceTaskAttachmentsBulk(
              AttachmentModel,
              projectIds
            );
          allAttachments.push(...projectChildAttachments);
        }

        const resources = await this.resourceService.getResourcesByAccountId(
          schemaNumber,
          entityId
        );
        const resourceIds = resources.map((r) => (r as { rid: string }).rid);
        if (resourceIds.length > 0) {
          const resourceAttachments = await fetchAttachments(
            AttachmentModel,
            "resource",
            resourceIds
          );
          allAttachments.push(...resourceAttachments);

          const resourceCostSkillAttachments =
            await fetchResourceCostSkillAttachmentsBulk(
              AttachmentModel,
              resourceIds
            );
          allAttachments.push(...resourceCostSkillAttachments);
        }
      }

      // 🔷 Project logic
      else if (attachmentLevel === "project" && entityId) {
        let entityIds : string[]
        if(type === DOSSIER_NAME) {
          let orgSchemaName = rawQueries.fetchSchemaName(schemaNumber)
          const caseProjectIds = await orgDbSequelize.query<string[]>(rawQueries.fetchAssignedProjectIds(entityId, orgSchemaName), {type : QueryTypes.SELECT})
          entityIds = caseProjectIds.map((d : any) => d.project_fiscal_rid)
        } else entityIds = [entityId]
        const projectAttachments = await fetchAttachments(
          AttachmentModel,
          "project",
          entityIds
        );
        allAttachments.push(...projectAttachments);
        if(type !== DOSSIER_NAME) {
           const projectChildAttachments =
            await fetchProjectResourceTaskAttachmentsBulk(AttachmentModel, [
              entityId,
            ]);
          allAttachments.push(...projectChildAttachments);
        }
      }

      // 🔷 Project_resource logic
      else if (attachmentLevel === "project_resource" && entityId) {
        const projectResourceAttachments = await fetchAttachments(
          AttachmentModel,
          "project_resource",
          [entityId]
        );
        allAttachments.push(...projectResourceAttachments);

        const projectResource =
          await this.projectIngestionService.fetchProjectResourceById(
            schemaNumber,
            entityId
          );
        const projectTasks =
          await this.projectIngestionService.getProjectTasksByProjectIds(
            schemaNumber,
            [(projectResource as any)?.project_fiscal_rid]
          );
        const projectTaskIds = projectTasks.map((t) => t.rid);
        if (projectTaskIds.length > 0) {
          const projectTaskAttachments = await fetchAttachments(
            AttachmentModel,
            "project_task",
            projectTaskIds
          );
          allAttachments.push(...projectTaskAttachments);
        }
      }

      // 🔷 Resource logic
      else if (attachmentLevel === "resource" && entityId) {
        const resourceAttachments = await fetchAttachments(
          AttachmentModel,
          "resource",
          [entityId]
        );
        allAttachments.push(...resourceAttachments);

        const resourceCostSkillAttachments =
          await fetchResourceCostSkillAttachmentsBulk(AttachmentModel, [
            entityId,
          ]);
        allAttachments.push(...resourceCostSkillAttachments);
      }

      // 🔷 Case logic
      else if (attachmentLevel === "case" && entityId) {
        const caseAttachments = await fetchAttachments(
          AttachmentModel,
          "case",
          [entityId]
        );
        allAttachments.push(...caseAttachments);
      }

      // 🔷 Other direct levels
      else {
        if (!whereClause[Op.and]) {
          whereClause[Op.and] = [];
        }

        if (entityId) {
          whereClause[Op.and].push({ attach_to: entityId });
        } else if (attachmentLevel) {
          whereClause[Op.and].push({ attachment_level: attachmentLevel });
        }

      try {
        const result = await AttachmentModel.findAll({ where: whereClause });
        allAttachments.push(...result);
      } catch (error) {
        errorLog('Error fetching attachments:', (error as Error).message);
        throw new Error('Failed to fetch attachments');
      }
    }

      // 🔷 Fetch display names
      if (graphqlData?.document_rid) {
        allAttachments = allAttachments.filter((d: any) => d != null);
      }
      const attachmentDisplayNames = await this.getAttachmentDisplayNames(
        allAttachments,
        schemaNumber,
        type
      );

      // 🔷 Sort
      const validSortFields = [
        "document_name",
        "document_type",
        "document_category",
        "r_number",
        "format",
        "attachment_level",
        "size_in_mb",
        "attached_to",
        "created_datetime",
        "comments",
        "uploaded_by",
        "fiscal_year",
        "project_name",
        "project_code"
      ];
      const finalSortBy = validSortFields.includes(sortBy)
        ? sortBy
        : "created_datetime";
      const finalSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
        ? sortOrder.toUpperCase()
        : "DESC";

      allAttachments.sort((a, b) => {
        // Special handling for created_datetime
        if (finalSortBy === "created_datetime") {
          const aDate = new Date(a[finalSortBy]).getTime();
          const bDate = new Date(b[finalSortBy]).getTime();
          return finalSortOrder === "ASC" ? aDate - bDate : bDate - aDate;
        }

        let aVal =
          finalSortBy === "attached_to"
            ? attachmentDisplayNames[a.rid] ?? ""
            : a[finalSortBy] ?? "";
        let bVal =
          finalSortBy === "attached_to"
            ? attachmentDisplayNames[b.rid] ?? ""
            : b[finalSortBy] ?? "";

        // Convert to string safely
        aVal =
          typeof aVal === "string"
            ? aVal.toLowerCase()
            : String(aVal).toLowerCase();
        bVal =
          typeof bVal === "string"
            ? bVal.toLowerCase()
            : String(bVal).toLowerCase();

        const aEmpty = !aVal || aVal.trim() === "";
        const bEmpty = !bVal || bVal.trim() === "";

        if (aEmpty && bEmpty) return 0; // Both empty – equal
        if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1; // a empty comes last in ASC, first in DESC
        if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1; // b empty comes last in ASC, first in DESC

        // Both non-empty, normal comparison
        return finalSortOrder === "ASC"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });

      // 🔷 Map document types and users
      const documentTypeIds = [
        ...new Set(allAttachments.map((att) => att.document_type_rid)),
      ];
      const documentCategoryIds = [
        ...new Set(
          allAttachments.map((att) => att.document_category_rid)
        ),
      ];
      const userIds = [
        ...new Set(allAttachments.map((att) => att.created_by)),
      ];

      const mainSequelize = await initMainDbSequelize();
      const [documentTypes, documentCategories, users] = await Promise.all([
        documentTypeIds.length > 0
          ? mainSequelize.query(
              rawQueries.fetchDocumentByIds(),
              { replacements: { documentTypeIds }, type: "SELECT" }
            )
          : Promise.resolve([]),
        documentCategoryIds.length > 0
          ? mainSequelize.query(
              rawQueries.fetchDocumentCategory(),
              { replacements: { documentCategoryIds }, type: "SELECT" }
            )
          : Promise.resolve([]),
        userIds.length > 0
          ? mainSequelize.query(
              rawQueries.fetchUserByIds(),
              { replacements: { userIds }, type: "SELECT" }
            )
          : Promise.resolve([]),
      ]);

      const documentTypeMap = new Map(
        documentTypes.map((dt: any) => [dt.rid, dt.type_name])
      );
      const documentCategoryMap = new Map(
        documentCategories.map((dc: any) => [dc.rid, dc.category_name])
      );
      const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));

    // 🔷 Map final results
    let attachments = await Promise.all(allAttachments.map(async attachment => ({
      ...attachment.get({ plain: true }),
      document_type: documentTypeMap.get(attachment.document_type_rid) || null,
      document_category: documentCategoryMap.get(attachment.document_category_rid) || null,
      uploaded_by: userMap.get(attachment.created_by) || attachment.created_by,
      attached_to: attachmentDisplayNames[attachment.rid] || attachment.attach_to,
      browse_file : await generateSasUrl(attachment.browse_file)
    })));

     if (attachedToFilter) {
        attachments = attachments.filter((attachment) => {
          let displayName =
            attachmentDisplayNames[attachment.rid] ||
            String(attachment.attach_to) ||
            "";
          const displayValue = displayName.toLowerCase();
          const operator = Object.keys(attachedToFilter)[0];
          const filterValue = (attachedToFilter[operator] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return displayValue.includes(filterValue);
            case "equals":
              return displayValue === filterValue;
            case "not_equals":
              return displayValue !== filterValue || displayValue === null;
            default:
              return false;
          }
        });
      }

      if (uploadedByFilter) {
        attachments = attachments.filter((attachment) => {
          const uploadedBy = attachment.uploaded_by?.toLowerCase() || "";
          const operator = Object.keys(uploadedByFilter)[0];
          const filterValue = (uploadedByFilter[operator] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return uploadedBy.includes(filterValue);
            case "equals":
              return uploadedBy === filterValue;
            case "not_equals":
              return uploadedBy !== filterValue || uploadedBy === null;
            default:
              return false;
          }
        });
      }
      if (projectCodeFilter) {
        attachments = attachments.filter((attachment) => {
          const projectCode = attachment.project_code?.toLowerCase() || "";
          const operator = Object.keys(projectCodeFilter)[0];
          const filterValue = (projectCodeFilter[operator] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return projectCode.includes(filterValue);
            case "equals":
              return projectCode === filterValue;
            case "not_equals":
              return projectCode !== filterValue || projectCode === null;
            default:
              return false;
          }
        });
      }
      if (projectNameFilter) {
        attachments = attachments.filter((attachment) => {
          const projectName = attachment.project_name?.toLowerCase() || "";
          const operator = Object.keys(projectNameFilter)[0];
          const filterValue = (projectNameFilter[operator] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return projectName.includes(filterValue);
            case "equals":
              return projectName === filterValue;
            case "not_equals":
              return projectName !== filterValue || projectName === null;
            default:
              return false;
          }
        });
      }

      // Handle uploaded_by sorting
      if (sortBy === "uploaded_by") {
        attachments.sort((a, b) => {
          const aType = a.uploaded_by || "";
          const bType = b.uploaded_by || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }

      // Handle document_type sorting
      if (sortBy === "document_type") {
        attachments.sort((a, b) => {
          const aType = a.document_type || "";
          const bType = b.document_type || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }

      // Handle document_category sorting
      if (sortBy === "document_category") {
        attachments.sort((a, b) => {
          const aType = a.document_category || "";
          const bType = b.document_category || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }
      if (sortBy === "project_code") {
        attachments.sort((a, b) => {
          const aType = a.project_code || "";
          const bType = b.project_code || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }
      if (sortBy === "project_name") {
        attachments.sort((a, b) => {
          const aType = a.project_name || "";
          const bType = b.project_name || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }

      // Add "mb" suffix to size values for attachments
      attachments = attachments.map((attachment) => ({
        ...attachment,
        size_in_mb: attachment.size_in_mb
          ? `${attachment.size_in_mb} mb`
          : null,
      }));
       // 🔷 Pagination
      let totalCount = attachments.length;
      attachments = attachments.slice(
        (page - 1) * limit,
        page * limit
      );

    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: { attachments, totalCount }
    };

  } catch (error) {
    errorLog("getAttachments error:", (error as Error).message);
    return {
      statusCode: 500,
      message: 'Failed to fetch attachments',
      errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
      data: { attachments: [], totalCount: 0 }
    };
  }
}

  /**
 * Exports attachment records related to a given entity (account, project, resource, etc.)
 * and returns them in a standardized, exportable format. It supports filtering, sorting,
 * and field-level access control.
 *
 * @async
 * @param {string} userId - The ID of the user making the request.
 * @param {string} [attachmentLevel] - The level of the attachment (e.g., 'account', 'project', 'resource').
 * @param {string} [entityId] - The RID of the entity to which attachments are linked.
 * @param {string} [accountRid] - The account RID used to determine the schema and access.
 * @param {string} [search] - A search term to apply across allowed fields.
 * @param {Record<string, any>} [filters={}] - A key-value pair of filters to apply.
 * @param {string} [sortBy="created_datetime"] - The field by which to sort the results.
 * @param {string} [sortOrder="DESC"] - The sort order, either "ASC" or "DESC".
 * @param {number} [fiscalYear=0] - If provided (non-zero), filters attachments by fiscal year.
 * @param {any} [graphqlData] - Optional GraphQL-specific metadata (e.g., document_rid).
 *
 * @returns {Promise<{
 *   statusCode: number,
 *   message: string,
 *   errorMessage?: string,
 *   data?: { attachments: any[] }
 * }>} - Returns an object containing the status, message, optional error message, and exported attachments.
 *
 * @throws {Error} - Throws an error if database initialization or fetching fails.
 *
 * @example
 * const result = await exportAttachments(
 *   "user_123",
 *   "account",
 *   "acc_456",
 *   "acc_456",
 *   "invoice",
 *   { uploaded_by: { contains: "John" } },
 *   "uploaded_by",
 *   "ASC",
 *   2024
 * );
 */
  async exportAttachments(
    userId: string,
    attachmentLevel?: string,
    entityId?: string,
    accountRid?: string,
    search?: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "DESC",
    fiscalYear: number = 0,
    graphqlData?: any,
    timezone : string = ``,
    type? : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { attachments: any[] };
  }> {
    try {
      if (!accountRid) throw new Error("Account RID is required");

      const orgDbSequelize = await initOrgSequelize();
      if (!orgDbSequelize)
        throw new Error("Failed to initialize database connection");

      const accountData = await this.schemaService.fetchAccountById(accountRid);
      if (!accountData) throw new Error("Invalid account ID");

      let schemaNumber = accountData.r_number;
      if (accountData.storage_type === "store_in_parent") {
        schemaNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(
        /\D/g,
        ""
      )}`;
      const AttachmentModel = Attachment.initialize(orgDbSequelize, schemaName);

      let allAttachments: any[] = [];

      // Handle attached_to and uploaded_by filters separately
      let attachedToFilter;
      let uploadedByFilter;
      let projectCodeFilter;
      let projectNameFilter;
      if (filters.attached_to) {
        attachedToFilter = filters.attached_to;
        delete filters.attached_to;
      }
      if (filters.uploaded_by) {
        uploadedByFilter = filters.uploaded_by;
        delete filters.uploaded_by;
      }
      if (filters.project_code) {
        projectCodeFilter = filters.project_code;
        delete filters.project_code;
      }
      if (filters.project_name) {
        projectNameFilter = filters.project_name;
        delete filters.project_name;
      }

      const { whereClause } = this.buildRawWhereClause(filters, search);

      if (fiscalYear !== 0) {
        if (!whereClause[Op.and]) {
          whereClause[Op.and] = [];
        }
        whereClause[Op.and].push({ fiscal_year: fiscalYear });
      }

      // 🔷 Helper functions

    const fetchAttachments = async (model: any, level: string, attachToIds: string[]) => {
      if (attachToIds.length === 0) return [];
      let where;
      if(graphqlData?.document_rid) {
       logMessage(`Doc Id : ${graphqlData.document_rid}`);
        where = {
          rid : graphqlData.document_rid,
          attachment_level : level,
          attach_to : { [Op.in]: attachToIds }
        };
      
        let arrayData = []
        arrayData.push(await model.findOne({ where }))
        return arrayData
      } else {
        where = {
          [Op.and]: [
            { attachment_level: level },
            { attach_to: { [Op.in]: attachToIds } },
            ...(whereClause[Op.and] || [])
          ]
        };
        return model.findAll({ where });
      }
    };

      // 🔷 Optimized resource cost and skill attachments fetch for multiple resources
      const fetchResourceCostSkillAttachmentsBulk = async (
        model: any,
        resourceIds: string[]
      ) => {
        let resourceCostSkillAttachments: any[] = [];
        if (resourceIds.length === 0) return resourceCostSkillAttachments;

        // 🔹 Fetch all resource_costs in one call
        const resourceCosts =
          await this.resourceCostService.getResourceCostsByResourceIds(
            schemaNumber,
            resourceIds
          );
        const allResourceCostIds = resourceCosts.map((rc) => rc.rid);
        if (allResourceCostIds.length > 0) {
          const resourceCostAttachments = await fetchAttachments(
            model,
            "resource_cost",
            allResourceCostIds
          );
          resourceCostSkillAttachments.push(...resourceCostAttachments);
        }

        // 🔹 Fetch all resource_skills in one call
        const resourceSkills =
          await this.resourceSkillService.getResourceSkillsByResourceIds(
            schemaNumber,
            resourceIds
          );
        const allResourceSkillIds = resourceSkills.map((rs) => rs.rid);
        if (allResourceSkillIds.length > 0) {
          const resourceSkillAttachments = await fetchAttachments(
            model,
            "resource_skill",
            allResourceSkillIds
          );
          resourceCostSkillAttachments.push(...resourceSkillAttachments);
        }

        return resourceCostSkillAttachments;
      };

      // 🔷 Optimized project resource + task attachments fetch for multiple projects
      const fetchProjectResourceTaskAttachmentsBulk = async (
        model: any,
        projectIds: string[]
      ) => {
        let projectChildAttachments: any[] = [];
        if (projectIds.length === 0) return projectChildAttachments;

        // 🔹 Fetch all project_resources under projects in one call
        const projectResources =
          await this.projectIngestionService.getProjectResourcesByProjectIds(
            schemaNumber,
            projectIds
          );
        const projectResourceIds = projectResources.map((r) => r.rid);

        if (projectResourceIds.length > 0) {
          const projectResourceAttachments = await fetchAttachments(
            model,
            "project_resource",
            projectResourceIds
          );
          projectChildAttachments.push(...projectResourceAttachments);
        }

        // 🔹 Fetch all project_tasks under projects in one call
        const projectTasks =
          await this.projectIngestionService.getProjectTasksByProjectIds(
            schemaNumber,
            projectIds
          );
        const projectTaskIds = projectTasks.map((t) => t.rid);

        if (projectTaskIds.length > 0) {
          const projectTaskAttachments = await fetchAttachments(
            model,
            "project_task",
            projectTaskIds
          );
          projectChildAttachments.push(...projectTaskAttachments);
        }
        return projectChildAttachments;
      };

      // 🔷 Non-parent account logic with batched optimized fetches
      if (attachmentLevel === "account" && entityId) {
        const accountAttachments = await fetchAttachments(
          AttachmentModel,
          "account",
          [entityId]
        );
        allAttachments.push(...accountAttachments);

        const projects =
          await this.projectIngestionService.getProjectsByAccountId(
            schemaNumber,
            entityId
          );
        const projectIds = projects.map((p) => p.rid);
        if (projectIds.length > 0) {
          const projectAttachments = await fetchAttachments(
            AttachmentModel,
            "project",
            projectIds
          );
          allAttachments.push(...projectAttachments);

          const projectChildAttachments =
            await fetchProjectResourceTaskAttachmentsBulk(
              AttachmentModel,
              projectIds
            );
          allAttachments.push(...projectChildAttachments);
        }

        const resources = await this.resourceService.getResourcesByAccountId(
          schemaNumber,
          entityId
        );
        const resourceIds = resources.map((r) => (r as { rid: string }).rid);
        if (resourceIds.length > 0) {
          const resourceAttachments = await fetchAttachments(
            AttachmentModel,
            "resource",
            resourceIds
          );
          allAttachments.push(...resourceAttachments);

          const resourceCostSkillAttachments =
            await fetchResourceCostSkillAttachmentsBulk(
              AttachmentModel,
              resourceIds
            );
          allAttachments.push(...resourceCostSkillAttachments);
        }
      }

      // 🔷 Project logic
      else if (attachmentLevel === "project" && entityId) {
        let entityIds : string[]
        if(type === DOSSIER_NAME) {
          let orgSchemaName = rawQueries.fetchSchemaName(schemaNumber)
          const caseProjectIds = await orgDbSequelize.query<string[]>(rawQueries.fetchAssignedProjectIds(entityId, orgSchemaName), {type : QueryTypes.SELECT})
          entityIds = caseProjectIds.map((d : any) => d.project_fiscal_rid)
        } else entityIds = [entityId]
        const projectAttachments = await fetchAttachments(
          AttachmentModel,
          "project",
          entityIds
        );
        if(type === DOSSIER_NAME) {
          let fetchProjectDetails : any[] = [...new Set(projectAttachments.map((project : any) => project.dataValues.attach_to))];
          let projectFiscalDetails = await orgDbSequelize.query(rawQueries.fetchProjectFiscalDetails(fetchProjectDetails, schemaName));
          let projectDetailsMap = new Map(projectFiscalDetails[0].map((d : any) => [d.rid, {project_name : d.project_name, project_code : d.project_code, signoff : d.signoff}]))
          projectAttachments.forEach((d: any) => {
            d.dataValues.project_code = projectDetailsMap.get(d.dataValues.attach_to)?.project_code || null;
            d.dataValues.project_name = projectDetailsMap.get(d.dataValues.attach_to)?.project_name || null;
          });
        }  
        allAttachments.push(...projectAttachments);
        if(type !== DOSSIER_NAME) {
           const projectChildAttachments =
            await fetchProjectResourceTaskAttachmentsBulk(AttachmentModel, [
              entityId,
            ]);
          allAttachments.push(...projectChildAttachments);
        }
      }

      // 🔷 Project_resource logic
      else if (attachmentLevel === "project_resource" && entityId) {
        const projectResourceAttachments = await fetchAttachments(
          AttachmentModel,
          "project_resource",
          [entityId]
        );
        allAttachments.push(...projectResourceAttachments);
        const projectResource =
          await this.projectIngestionService.fetchProjectResourceById(
            schemaNumber,
            entityId
          );
        const projectTasks =
          await this.projectIngestionService.getProjectTasksByProjectIds(
            schemaNumber,
            [(projectResource as any)?.project_fiscal_rid]
          );
        const projectTaskIds = projectTasks.map((t) => t.rid);
        if (projectTaskIds.length > 0) {
          const projectTaskAttachments = await fetchAttachments(
            AttachmentModel,
            "project_task",
            projectTaskIds
          );
          allAttachments.push(...projectTaskAttachments);
        }
      }

      // 🔷 Resource logic
      else if (attachmentLevel === "resource" && entityId) {
        const resourceAttachments = await fetchAttachments(
          AttachmentModel,
          "resource",
          [entityId]
        );
        allAttachments.push(...resourceAttachments);

        const resourceCostSkillAttachments =
          await fetchResourceCostSkillAttachmentsBulk(AttachmentModel, [
            entityId,
          ]);
        allAttachments.push(...resourceCostSkillAttachments);
      }

      // 🔷 Other direct levels
      else {
        if (!whereClause[Op.and]) {
          whereClause[Op.and] = [];
        }

        if (entityId) {
          whereClause[Op.and].push({ attach_to: entityId });
        } else if (attachmentLevel) {
          whereClause[Op.and].push({ attachment_level: attachmentLevel });
        }

      try {
        const result = await AttachmentModel.findAll({ where: whereClause });
        allAttachments.push(...result);
      } catch (error) {
        errorLog('Error fetching attachments:', (error as Error).message);
        throw new Error('Failed to fetch attachments');
      }
    }

      // 🔷 Fetch display names
      if (graphqlData?.document_rid) {
        allAttachments = allAttachments.filter((d: any) => d != null);
      }
      const attachmentDisplayNames = await this.getAttachmentDisplayNames(
        allAttachments,
        schemaNumber
      );

      // 🔷 Sort
      const validSortFields = [
        "document_name",
        "document_type",
        "document_category",
        "r_number",
        "format",
        "attachment_level",
        "size_in_mb",
        "attached_to",
        "comments",
        "uploaded_by",
        "created_datetime",
        "fiscal_year",
      ];
      const finalSortBy = validSortFields.includes(sortBy)
        ? sortBy
        : "created_datetime";
      const finalSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
        ? sortOrder.toUpperCase()
        : "DESC";

      allAttachments.sort((a, b) => {
        // Special handling for created_datetime
        if (finalSortBy === "created_datetime") {
          const aDate = new Date(a[finalSortBy]).getTime();
          const bDate = new Date(b[finalSortBy]).getTime();
          return finalSortOrder === "ASC" ? aDate - bDate : bDate - aDate;
        }

        let aVal =
          finalSortBy === "attached_to"
            ? attachmentDisplayNames[a.rid] ?? ""
            : a[finalSortBy] ?? "";
        let bVal =
          finalSortBy === "attached_to"
            ? attachmentDisplayNames[b.rid] ?? ""
            : b[finalSortBy] ?? "";

        // Convert to string safely
        aVal =
          typeof aVal === "string"
            ? aVal.toLowerCase()
            : String(aVal).toLowerCase();
        bVal =
          typeof bVal === "string"
            ? bVal.toLowerCase()
            : String(bVal).toLowerCase();

        const aEmpty = !aVal || aVal.trim() === "";
        const bEmpty = !bVal || bVal.trim() === "";

        if (aEmpty && bEmpty) return 0; // Both empty – equal
        if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1; // a empty comes last in ASC, first in DESC
        if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1; // b empty comes last in ASC, first in DESC

        // Both non-empty, normal comparison
        return finalSortOrder === "ASC"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });

      // 🔷 Map document types and users
      const documentTypeIds = [
        ...new Set(allAttachments.map((att) => att.document_type_rid)),
      ];
      const documentCategoryIds = [
        ...new Set(allAttachments.map((att) => att.document_category_rid)),
      ];
      const userIds = [...new Set(allAttachments.map((att) => att.created_by))];

      const mainSequelize = await initMainDbSequelize();
      const [documentTypes, documentCategories, users] = await Promise.all([
        documentTypeIds.length > 0
          ? mainSequelize.query(
              rawQueries.fetchDocumentByIds(),
              { replacements: { documentTypeIds }, type: "SELECT" }
            )
          : Promise.resolve([]),
        documentCategoryIds.length > 0
          ? mainSequelize.query(
              rawQueries.fetchDocumentCategory(),
              { replacements: { documentCategoryIds }, type: "SELECT" }
            )
          : Promise.resolve([]),
        userIds.length > 0
          ? mainSequelize.query(
              rawQueries.fetchUserByIds(),
              { replacements: { userIds }, type: "SELECT" }
            )
          : Promise.resolve([]),
      ]);

      const documentTypeMap = new Map(
        documentTypes.map((dt: any) => [dt.rid, dt.type_name])
      );
      const documentCategoryMap = new Map(
        documentCategories.map((dc: any) => [dc.rid, dc.category_name])
      );
      const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));

    // 🔷 Map final results
    let attachments = await Promise.all(allAttachments.map(async attachment => ({
      ...attachment.get({ plain: true }),
      document_type: documentTypeMap.get(attachment.document_type_rid) || null,
      document_category: documentCategoryMap.get(attachment.document_category_rid) || null,
      uploaded_by: userMap.get(attachment.created_by) || attachment.created_by,
      attached_to: attachmentDisplayNames[attachment.rid] || attachment.attach_to,
      browse_file : await generateSasUrl(attachment.browse_file)
    })))

          // 🔷 Apply attached_to filter if present
      if (attachedToFilter) {
        attachments = attachments.filter((attachment) => {
          let displayName =
            attachmentDisplayNames[attachment.rid] ||
            String(attachment.attach_to) ||
            "";
          const displayValue = displayName.toLowerCase();
          const operator = Object.keys(attachedToFilter)[0];
          const filterValue = (attachedToFilter[operator] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return displayValue.includes(filterValue);
            case "equals":
              return displayValue === filterValue;
            case "not_equals":
              return displayValue !== filterValue || displayValue === null;
            default:
              return false;
          }
        });
      }

      if (uploadedByFilter) {
        attachments = attachments.filter((attachment) => {
          const uploadedBy = attachment.uploaded_by?.toLowerCase() || "";
          const operator = Object.keys(uploadedByFilter)[0];
          const filterValue = (uploadedByFilter[operator] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return uploadedBy.includes(filterValue);
            case "equals":
              return uploadedBy === filterValue;
            case "not_equals":
              return uploadedBy !== filterValue || uploadedBy === null;
            default:
              return false;
          }
        });
      }
      if (projectCodeFilter) {
        attachments = attachments.filter((attachment) => {
          const projectCode = attachment.project_code?.toLowerCase() || "";
          const operator = Object.keys(projectCodeFilter)[0];
          const filterValue = (projectCodeFilter[operator] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return projectCode.includes(filterValue);
            case "equals":
              return projectCode === filterValue;
            case "not_equals":
              return projectCode !== filterValue || projectCode === null;
            default:
              return false;
          }
        });
      }
      if (projectNameFilter) {
        attachments = attachments.filter((attachment) => {
          const projectName = attachment.project_name?.toLowerCase() || "";
          const operator = Object.keys(projectNameFilter)[0];
          const filterValue = (projectNameFilter[operator] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return projectName.includes(filterValue);
            case "equals":
              return projectName === filterValue;
            case "not_equals":
              return projectName !== filterValue || projectName === null;
            default:
              return false;
          }
        });
      }

      // Handle uploaded_by sorting
      if (sortBy === "uploaded_by") {
        attachments.sort((a, b) => {
          const aType = a.uploaded_by || "";
          const bType = b.uploaded_by || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }
      if (sortBy === "project_code") {
        attachments.sort((a, b) => {
          const aType = a.project_code || "";
          const bType = b.project_code || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }
      if (sortBy === "project_name") {
        attachments.sort((a, b) => {
          const aType = a.project_name || "";
          const bType = b.project_name || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }

      // Handle document_type sorting
      if (sortBy === "document_type") {
        attachments.sort((a, b) => {
          const aType = a.document_type || "";
          const bType = b.document_type || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }

      // Handle document_category sorting
      if (sortBy === "document_category") {
        attachments.sort((a, b) => {
          const aType = a.document_category || "";
          const bType = b.document_category || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }

      const allowedFieldsForExport =
        await this.schemaService.getAllowedExportFields(
          userId,
          "attachments_view_edit"
        );
      const allowedProjectFieldsForExport =
        await this.schemaService.getAllowedExportFields(
          userId,
          "projects_view_edit"
        );
      const allowedFieldSet = new Set<string>();
      const allowedFieldSetForProjects = new Set<string>();
      for (const field of allowedFieldsForExport) {
        if (field.read) {
          allowedFieldSet.add(field.field_desc);
        }
      }
       for (const field of allowedProjectFieldsForExport) {
        if (field.read) {
          allowedFieldSetForProjects.add(field.field_desc);
        }
      }
      const labelMap: Record<string, string> = {
        "Project Code": "Project Code",
        "Project Name": "Name",
        "Document Name": "Document Name",
        Format: "Format",
        Size: "Size",
        "Fiscal Year": "Fiscal Year",
        "Document Category": "Document Category",
        "Document Type": "Document Type",
        "Related Entity": "Related Entity",
        "Related To ID": "Related To ID",
        "Related To Name": "Related To Name",
        "Attached By": "Attached By",
        "Attached On": "Attached On",
        "Attachment ID": "Attachment ID",
      };
      // Add "mb" suffix to size values for attachments
      attachments = attachments.map((attachment) => ({
        ...attachment,
        size_in_mb: attachment.size_in_mb
          ? `${attachment.size_in_mb} mb`
          : null,
      }));

      attachments = attachments.map((at) => {
        const rawMapped = this.mapAttachmentToCommonFormat(at, timezone); // with internal keys
        const filtered: Record<string, any> = {};
        let dynamicLabel : string;
        for (const [fieldKey, value] of Object.entries(rawMapped)) {
          const label = labelMap[fieldKey]; // field_desc
          if (allowedFieldSet.has(label)) {
            filtered[label] = value; // export with label name
          }
          if (allowedFieldSetForProjects.has(label!)) {
            if(label === 'Name') dynamicLabel = "Project Name"
            else dynamicLabel = label!
            filtered[dynamicLabel] = value
          }
        }
        return filtered;
      });

    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: { attachments }
    };

  } catch (error) {
   errorLog("getAttachments error:", (error as Error).message);
    return {
      statusCode: 500,
      message: 'Failed to fetch attachments',
      errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
      data: { attachments: [] }
    };
  }
}

  // Helper function to map attachment data to common format
  private mapAttachmentToCommonFormat(at: any, timezone : string) {
    return {
      "Project Code": at.project_code || "-",
      "Project Name": at.project_name || "-",
      "Document Name": at.document_name || "-",
      Format: at.format || "-",
      Size: at.size_in_mb || "-",
      "Fiscal Year": `FY-${at.fiscal_year}` || "-",
      "Document Category": at.document_category || "-",
      "Document Type": at.document_type || "-",
      "Related Entity": at.attachment_level || "-",
      "Related To ID": at.attach_to || "-",
      "Related To Name": at.attached_to || "-",
      "Attached By": at.uploaded_by || "-",
      "Attached On": at.created_datetime
        ? timezone && isValidTimezone(timezone)
        ? moment(at.created_datetime)
            .tz(timezone)
            .format("YYYY-MMM-DD, hh:mm:ss A")
        : moment(at.created_datetime).format(
            "YYYY-MMM-DD, hh:mm:ss A"
          )
      : "-",
      "Attachment ID": at.r_number || "-",
    };
  }

  /**
 * Retrieves a paginated, sorted, and filtered summary of attachments accessible to a given user.
 * Includes additional metadata such as document type, category, uploader name, and attachment target.
 * 
 * Handles user-based access control, global and column filters, sorting on multiple fields,
 * and post-processing like display name resolution and unit conversion.
 *
 * @async
 * @param {string} userId - The user RID to determine access control and permissions.
 * @param {number} [page=1] - Page number for pagination.
 * @param {number} [limit=10] - Number of items per page.
 * @param {string} [search] - Optional search string applied to relevant fields.
 * @param {Record<string, any>} [filters={}] - Column-specific filters for the attachments.
 * @param {Record<string, any>} [globalFilters={}] - Global filters, typically based on account hierarchy.
 * @param {string} [sortBy="created_datetime"] - Field to sort the results by.
 * @param {string} [sortOrder="DESC"] - Sort order: "ASC" or "DESC".
 * @param {number} [fiscalYear=0] - Optional fiscal year filter.
 *
 * @returns {Promise<{
 *   statusCode: number,
  *   message: string,
  *   errorMessage?: string,
  *   data?: {
  *     attachments: any[],
  *     totalCount: number
  *   }
  * }>} An object containing the status, optional error message, and a paginated list of enriched attachment records.
  *
  * @throws {Error} Throws an error if database access fails, filters are invalid, or unexpected errors occur during processing.
  */ 
  async getAttachmentSummary(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters: Record<string, any> = {},
    globalFilters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "DESC",
    fiscalYear: number = 0
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { attachments: any[]; totalCount: number };
  }> {
    try {
      const mainSequelize = await initMainDbSequelize();
      if (!mainSequelize)
        throw new Error("Failed to initialize main DB connection");

      const AttachmentSummaryModel =
        AttachmentSummary.initialize(mainSequelize);
      const userGroupType = await this.schemaService.getUserGroupType(userId);
      const isCustomGlobal = userGroupType === "DEFAULT";
      let accessibleAccountIds: string[] = [];
      if (!isCustomGlobal) {
        const accessibleAccounts =
          await this.schemaService.getAccessibleAccountInfo(userId);
        const accessibleAccountIds = accessibleAccounts.map((acc) => acc.id);

        // If user has no accessible accounts, return empty response
        if (accessibleAccountIds.length === 0) {
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              attachments: [],
              totalCount: 0,
            },
          };
        }
      }

      let attachedToFilter, uploadedByFilter;
      if (filters.attached_to) {
        attachedToFilter = filters.attached_to;
        delete filters.attached_to;
      }
      if (filters.uploaded_by) {
        uploadedByFilter = filters.uploaded_by;
        delete filters.uploaded_by;
      }

      const { whereClause } = this.buildRawWhereClause(filters, search);
      if (typeof globalFilters === "string")
        globalFilters = JSON.parse(globalFilters);
      whereClause[Op.and] = whereClause[Op.and] || [];

      if (globalFilters && Object.keys(globalFilters).length > 0) {
        const parentAccountRid = Object.keys(globalFilters)[0];
        const childAccountRids = globalFilters[parentAccountRid];
        const filterAccounts = [...childAccountRids, parentAccountRid];

        // Intersect frontend filters with backend-accessible accounts
        if (!isCustomGlobal) {
          const validAccounts = filterAccounts.filter((rid) =>
            accessibleAccountIds.includes(rid)
          );

          // No valid accounts → return early
          if (validAccounts.length === 0) {
            return {
              statusCode: HttpStatus.SUCCESS,
              message: HttpStatus.SUCCESS_MESSAGE,
              data: {
                attachments: [],
                totalCount: 0,
              },
            };
          }
          // Apply valid filtered accounts
          whereClause[Op.and].push({
            account_rid: { [Op.in]: validAccounts },
          });
        } else {
          // Apply valid filtered accounts
          whereClause[Op.and].push({
            account_rid: { [Op.in]: filterAccounts },
          });
        }
      } else {
        // No global filters — use all backend-accessible accounts
        if (!isCustomGlobal) {
          whereClause[Op.and].push({
            account_rid: { [Op.in]: accessibleAccountIds },
          });
        }
      }

      if (fiscalYear !== 0) {
        whereClause[Op.and] = whereClause[Op.and] || [];
        whereClause[Op.and].push({ fiscal_year: fiscalYear });
      }

      const attachmentsRaw = await AttachmentSummaryModel.findAll({
        where: whereClause,
      });

      const accountRids = [
        ...new Set(attachmentsRaw.map((a) => a.account_rid)),
      ];
      const accounts = await this.schemaService.fetchAccountsByIds(accountRids);
      const accountMap = new Map(accounts.map((a: any) => [a.rid, a]));
      const accountStatus = await this.schemaService.fetchAccountsWithStatusByIds(accountRids);
      const accountStatusMap = new Map(accountStatus.map((a: any) => [a.rid, a]));

      const schemaNumberMap = new Map<string, string>();

      await Promise.all(
        accounts.map(async (account) => {
          const acc = account as {
            rid: string;
            storage_type: string;
            r_number: string;
            parent_account_rid: string;
          };
          const { rid, storage_type, r_number, parent_account_rid } = acc;

          if (storage_type === "store_in_parent") {
            const parent = await this.schemaService.fetchParentAccount(
              parent_account_rid
            );
            schemaNumberMap.set(rid, parent);
          } else {
            schemaNumberMap.set(rid, r_number);
          }
        })
      );

      // Group attachments by schemaNumber
      const schemaAttachmentMap = new Map<string, any[]>();

      attachmentsRaw.forEach((att) => {
        const schemaNumber = schemaNumberMap.get(att.account_rid);
        if (!schemaNumber) return;

        if (!schemaAttachmentMap.has(schemaNumber)) {
          schemaAttachmentMap.set(schemaNumber, []);
        }
        schemaAttachmentMap.get(schemaNumber)!.push(att);
      });

      // Build attachment display names for each schemaNumber group
      const attachmentDisplayNames: Record<string, string> = {};

      await Promise.all(
        Array.from(schemaAttachmentMap.entries()).map(
          async ([schemaNumber, attachments]) => {
            const displayNames = await this.getAttachmentDisplayNames(
              attachments,
              schemaNumber
            );
            Object.assign(attachmentDisplayNames, displayNames);
          }
        )
      );

      // Map enriched data
      const documentTypeIds = [
        ...new Set(attachmentsRaw.map((att) => att.document_type_rid)),
      ];
      const documentCategoryIds = [
        ...new Set(attachmentsRaw.map((att) => att.document_category_rid)),
      ];
      const userIds = [...new Set(attachmentsRaw.map((att) => att.created_by))];

      const [documentTypes, documentCategories, users] = await Promise.all([
        documentTypeIds.length > 0
          ? mainSequelize.query(
              rawQueries.fetchDocumentByIds(),
              { replacements: { documentTypeIds }, type: "SELECT" }
            )
          : [],
        documentCategoryIds.length > 0
          ? mainSequelize.query(
              rawQueries.fetchDocumentCategory(),
              { replacements: { documentCategoryIds }, type: "SELECT" }
            )
          : [],
        userIds.length > 0
          ? mainSequelize.query(
              rawQueries.fetchUserByIds(),
              { replacements: { userIds }, type: "SELECT" }
            )
          : [],
      ]);

      const documentTypeMap = new Map(
        documentTypes.map((dt: any) => [dt.rid, dt.type_name])
      );
      const documentCategoryMap = new Map(
        documentCategories.map((dc: any) => [dc.rid, dc.category_name])
      );
      const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));

    let attachments = await Promise.all(attachmentsRaw.map(async att => {

      const accountStatusInfo = accountStatusMap.get(att.account_rid);

      return {
      ...att.get({ plain: true }),
      document_type: documentTypeMap.get(att.document_type_rid) || null,
      document_category: documentCategoryMap.get(att.document_category_rid) || null,
      uploaded_by: userMap.get(att.created_by) || att.created_by,
      attached_to: attachmentDisplayNames[att.rid] || att.attach_to,
      browse_file : await generateSasUrl(att.browse_file),
      status_rid: accountStatusInfo?.status_rid || null,
      status_name: accountStatusInfo?.status_name || null
      }

    }));

      // Filters: attached_to
      if (attachedToFilter) {
        attachments = attachments.filter((att) => {
          const displayName = (att.attached_to || "").toLowerCase();
          const operator = Object.keys(attachedToFilter)[0];
          const filterValue = (attachedToFilter[operator] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return displayName.includes(filterValue);
            case "equals":
              return displayName === filterValue;
            case "not_equals":
              return displayName !== filterValue || displayName === null;
            default:
              return false;
          }
        });
      }

      // Filters: uploaded_by
      if (uploadedByFilter) {
        attachments = attachments.filter((att) => {
          const uploadedBy = (att.uploaded_by || "").toLowerCase();
          const operator = Object.keys(uploadedByFilter)[0];
          const filterValue = (uploadedByFilter[operator] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return uploadedBy.includes(filterValue);
            case "equals":
              return uploadedBy === filterValue;
            case "not_equals":
              return uploadedBy !== filterValue || uploadedBy === null;
            default:
              return false;
          }
        });
      }

      // 🔷 Sort with custom field sorting logic
      const validSortFields = [
        "document_name",
        "document_type",
        "document_category",
        "r_number",
        "format",
        "attachment_level",
        "size_in_mb",
        "attached_to",
        "comments",
        "uploaded_by",
        "created_datetime",
        "fiscal_year",
      ];
      const finalSortBy = validSortFields.includes(sortBy)
        ? sortBy
        : "created_datetime";
      const finalSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
        ? sortOrder.toUpperCase()
        : "DESC";

      attachments.sort((a, b) => {
        // Special handling for created_datetime
        if (finalSortBy === "created_datetime") {
          const aDate = new Date(a[finalSortBy]).getTime();
          const bDate = new Date(b[finalSortBy]).getTime();
          return finalSortOrder === "ASC" ? aDate - bDate : bDate - aDate;
        }

        let aVal: string = "";
        let bVal: string = "";

        switch (finalSortBy) {
          case "attached_to":
            aVal = a.attached_to || "";
            bVal = b.attached_to || "";
            break;
          case "uploaded_by":
            aVal = a.uploaded_by || "";
            bVal = b.uploaded_by || "";
            break;
          case "document_type":
            aVal = a.document_type || "";
            bVal = b.document_type || "";
            break;
          case "document_category":
            aVal = a.document_category || "";
            bVal = b.document_category || "";
            break;
          default:
            aVal =
              a[finalSortBy] !== undefined && a[finalSortBy] !== null
                ? String(a[finalSortBy])
                : "";
            bVal =
              b[finalSortBy] !== undefined && b[finalSortBy] !== null
                ? String(b[finalSortBy])
                : "";
        }

        aVal = aVal.trim().toLowerCase();
        bVal = bVal.trim().toLowerCase();

        const isAEmpty = !aVal;
        const isBEmpty = !bVal;

        // 🔷 Ascending: empty values last
        if (finalSortOrder === "ASC") {
          if (isAEmpty && !isBEmpty) return 1;
          if (!isAEmpty && isBEmpty) return -1;
          return aVal.localeCompare(bVal);
        }

        // 🔷 Descending: empty values first (reverse logic)
        else {
          if (isAEmpty && !isBEmpty) return -1;
          if (!isAEmpty && isBEmpty) return 1;
          return bVal.localeCompare(aVal);
        }
      });

      // Pagination AFTER sorting
      const paginatedAttachments = attachments.slice(
        (page - 1) * limit,
        page * limit
      );

      // Add "mb" suffix to size values for paginated attachments
      const paginatedAttachmentsWithSizeSuffix = paginatedAttachments.map(
        (attachment) => ({
          ...attachment,
          size_in_mb: attachment.size_in_mb
            ? `${attachment.size_in_mb} mb`
            : null,
        })
      );

    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: {
        attachments: paginatedAttachmentsWithSizeSuffix,
        totalCount: attachments.length
      }
    };

  } catch (error) {
   errorLog("getAttachmentSummary error:", (error as Error).message);
    return {
      statusCode: 500,
      message: 'Failed to fetch attachment summary',
      errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
      data: { attachments: [], totalCount: 0 }
    };
  }
}

  /**
 * Exports a filtered and enriched list of attachment summaries accessible to a specific user.
 * Applies global and column-level filters, user-based access controls, sorting, and dynamic field filtering
 * based on export field permissions. Includes metadata enrichment such as document type, category, and uploader.
 *
 * This method is typically used for exporting data (e.g., to CSV or Excel) with only the fields the user is allowed to see.
 *
 * @async
 * @param {string} userId - The user RID to evaluate access control and allowed export fields.
 * @param {string} [search] - Optional search string to filter across multiple fields.
 * @param {Record<string, any>} [filters={}] - Column-specific filters applied to attachments.
 * @param {Record<string, any>} [globalFilters={}] - Global filters, typically structured by account hierarchy.
 * @param {string} [sortBy="created_datetime"] - Field by which to sort the attachment list.
 * @param {string} [sortOrder="DESC"] - Sort order, either "ASC" or "DESC".
 * @param {number} [fiscalYear=0] - Optional fiscal year filter.
 *
 * @returns {Promise<{
 *   statusCode: number,
  *   message: string,
  *   errorMessage?: string,
  *   data?: {
  *     attachments: any[]
  *   }
  * }>} A promise that resolves to an object containing the exportable attachment data and status.
  *
  * @throws {Error} If any step in the process fails (e.g., DB initialization, access filtering, data enrichment).
  */ 
  async exportAttachmentSummary(
    userId: string,
    search?: string,
    filters: Record<string, any> = {},
    globalFilters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "DESC",
    fiscalYear: number = 0,
    timezone : string = ``
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { attachments: any[] };
  }> {
    try {
      const mainSequelize = await initMainDbSequelize();
      if (!mainSequelize)
        throw new Error("Failed to initialize main DB connection");

      const AttachmentSummaryModel =
        AttachmentSummary.initialize(mainSequelize);
      const userGroupType = await this.schemaService.getUserGroupType(userId);
      const isCustomGlobal = userGroupType === "DEFAULT";
      let accessibleAccountIds: string[] = [];
      if (!isCustomGlobal) {
        const accessibleAccounts =
          await this.schemaService.getAccessibleAccountInfo(userId);
        const accessibleAccountIds = accessibleAccounts.map((acc) => acc.id);

        // If user has no accessible accounts, return empty response
        if (accessibleAccountIds.length === 0) {
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              attachments: [],
            },
          };
        }
      }

      let attachedToFilter, uploadedByFilter;
      if (filters.attached_to) {
        attachedToFilter = filters.attached_to;
        delete filters.attached_to;
      }
      if (filters.uploaded_by) {
        uploadedByFilter = filters.uploaded_by;
        delete filters.uploaded_by;
      }

    const { whereClause } = this.buildRawWhereClause(filters, search);
    if (typeof globalFilters === 'string') globalFilters = JSON.parse(globalFilters);
    whereClause[Op.and] = whereClause[Op.and] || [];

    
      if (globalFilters && Object.keys(globalFilters).length > 0) {
        const parentAccountRid = Object.keys(globalFilters)[0];
        const childAccountRids = globalFilters[parentAccountRid];
        const filterAccounts = [...childAccountRids, parentAccountRid];

        // Intersect frontend filters with backend-accessible accounts
        if (!isCustomGlobal) {
          const validAccounts = filterAccounts.filter((rid) =>
            accessibleAccountIds.includes(rid)
          );

          // No valid accounts → return early
          if (validAccounts.length === 0) {
            return {
              statusCode: HttpStatus.SUCCESS,
              message: HttpStatus.SUCCESS_MESSAGE,
              data: {
                attachments: [],
              },
            };
          }
          // Apply valid filtered accounts
          whereClause[Op.and].push({
            account_rid: { [Op.in]: validAccounts },
          });
        } else {
          // Apply valid filtered accounts
          whereClause[Op.and].push({
            account_rid: { [Op.in]: filterAccounts },
          });
        }
      } else {
        // No global filters — use all backend-accessible accounts
        if (!isCustomGlobal) {
          whereClause[Op.and].push({
            account_rid: { [Op.in]: accessibleAccountIds },
          });
        }
      }

      if (fiscalYear !== 0) {
        whereClause[Op.and] = whereClause[Op.and] || [];
        whereClause[Op.and].push({ fiscal_year: fiscalYear });
      }

      const attachmentsRaw = await AttachmentSummaryModel.findAll({
        where: whereClause,
      });

      const accountRids = [
        ...new Set(attachmentsRaw.map((a) => a.account_rid)),
      ];
      const accounts = await this.schemaService.fetchAccountsByIds(accountRids);
      const accountMap = new Map(accounts.map((a: any) => [a.rid, a]));

      const schemaNumberMap = new Map<string, string>();

      await Promise.all(
        accounts.map(async (account) => {
          const acc = account as {
            rid: string;
            storage_type: string;
            r_number: string;
            parent_account_rid: string;
          };
          const { rid, storage_type, r_number, parent_account_rid } = acc;

          if (storage_type === "store_in_parent") {
            const parent = await this.schemaService.fetchParentAccount(
              parent_account_rid
            );
            schemaNumberMap.set(rid, parent);
          } else {
            schemaNumberMap.set(rid, r_number);
          }
        })
      );

      // Group attachments by schemaNumber
      const schemaAttachmentMap = new Map<string, any[]>();

      attachmentsRaw.forEach((att) => {
        const schemaNumber = schemaNumberMap.get(att.account_rid);
        if (!schemaNumber) return;

        if (!schemaAttachmentMap.has(schemaNumber)) {
          schemaAttachmentMap.set(schemaNumber, []);
        }
        schemaAttachmentMap.get(schemaNumber)!.push(att);
      });

      // Build attachment display names for each schemaNumber group
      const attachmentDisplayNames: Record<string, string> = {};

      await Promise.all(
        Array.from(schemaAttachmentMap.entries()).map(
          async ([schemaNumber, attachments]) => {
            const displayNames = await this.getAttachmentDisplayNames(
              attachments,
              schemaNumber
            );
            Object.assign(attachmentDisplayNames, displayNames);
          }
        )
      );

      // Map enriched data
      const documentTypeIds = [
        ...new Set(attachmentsRaw.map((att) => att.document_type_rid)),
      ];
      const documentCategoryIds = [
        ...new Set(attachmentsRaw.map((att) => att.document_category_rid)),
      ];
      const userIds = [...new Set(attachmentsRaw.map((att) => att.created_by))];

      const [documentTypes, documentCategories, users] = await Promise.all([
        documentTypeIds.length > 0
          ? mainSequelize.query(
              rawQueries.fetchDocumentByIds(),
              { replacements: { documentTypeIds }, type: "SELECT" }
            )
          : [],
        documentCategoryIds.length > 0
          ? mainSequelize.query(
              rawQueries.fetchDocumentCategory(),
              { replacements: { documentCategoryIds }, type: "SELECT" }
            )
          : [],
        userIds.length > 0
          ? mainSequelize.query(
              rawQueries.fetchUserByIds(),
              { replacements: { userIds }, type: "SELECT" }
            )
          : [],
      ]);

      const documentTypeMap = new Map(
        documentTypes.map((dt: any) => [dt.rid, dt.type_name])
      );
      const documentCategoryMap = new Map(
        documentCategories.map((dc: any) => [dc.rid, dc.category_name])
      );
      const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));

    let attachments = await Promise.all(attachmentsRaw.map(async att => ({
      ...att.get({ plain: true }),
      document_type: documentTypeMap.get(att.document_type_rid) || null,
      document_category: documentCategoryMap.get(att.document_category_rid) || null,
      uploaded_by: userMap.get(att.created_by) || att.created_by,
      attached_to: attachmentDisplayNames[att.rid] || att.attach_to,
      browse_file : await generateSasUrl(att.browse_file)
    })));

      // Filters: attached_to
      if (attachedToFilter) {
        attachments = attachments.filter((att) => {
          const displayName = (att.attached_to || "").toLowerCase();
          const operator = Object.keys(attachedToFilter)[0];
          const filterValue = (attachedToFilter[operator] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return displayName.includes(filterValue);
            case "equals":
              return displayName === filterValue;
            case "not_equals":
              return displayName !== filterValue || displayName === null;
            default:
              return false;
          }
        });
      }

      // Filters: uploaded_by
      if (uploadedByFilter) {
        attachments = attachments.filter((att) => {
          const uploadedBy = (att.uploaded_by || "").toLowerCase();
          const operator = Object.keys(uploadedByFilter)[0];
          const filterValue = (uploadedByFilter[operator] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return uploadedBy.includes(filterValue);
            case "equals":
              return uploadedBy === filterValue;
            case "not_equals":
              return uploadedBy !== filterValue || uploadedBy === null;
            default:
              return false;
          }
        });
      }

      // 🔷 Sort with custom field sorting logic
      const validSortFields = [
        "document_name",
        "document_type",
        "document_category",
        "r_number",
        "format",
        "attachment_level",
        "size_in_mb",
        "attached_to",
        "comments",
        "uploaded_by",
        "created_datetime",
        "fiscal_year",
      ];
      const finalSortBy = validSortFields.includes(sortBy)
        ? sortBy
        : "created_datetime";
      const finalSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
        ? sortOrder.toUpperCase()
        : "DESC";

      attachments.sort((a, b) => {
        // Special handling for created_datetime
        if (finalSortBy === "created_datetime") {
          const aDate = new Date(a[finalSortBy]).getTime();
          const bDate = new Date(b[finalSortBy]).getTime();
          return finalSortOrder === "ASC" ? aDate - bDate : bDate - aDate;
        }

        let aVal: string = "";
        let bVal: string = "";

        switch (finalSortBy) {
          case "attached_to":
            aVal = a.attached_to || "";
            bVal = b.attached_to || "";
            break;
          case "uploaded_by":
            aVal = a.uploaded_by || "";
            bVal = b.uploaded_by || "";
            break;
          case "document_type":
            aVal = a.document_type || "";
            bVal = b.document_type || "";
            break;
          case "document_category":
            aVal = a.document_category || "";
            bVal = b.document_category || "";
            break;
          default:
            aVal =
              a[finalSortBy] !== undefined && a[finalSortBy] !== null
                ? String(a[finalSortBy])
                : "";
            bVal =
              b[finalSortBy] !== undefined && b[finalSortBy] !== null
                ? String(b[finalSortBy])
                : "";
        }

        aVal = aVal.trim().toLowerCase();
        bVal = bVal.trim().toLowerCase();

        const isAEmpty = !aVal;
        const isBEmpty = !bVal;

        // 🔷 Ascending: empty values last
        if (finalSortOrder === "ASC") {
          if (isAEmpty && !isBEmpty) return 1;
          if (!isAEmpty && isBEmpty) return -1;
          return aVal.localeCompare(bVal);
        }

        // 🔷 Descending: empty values first (reverse logic)
        else {
          if (isAEmpty && !isBEmpty) return -1;
          if (!isAEmpty && isBEmpty) return 1;
          return bVal.localeCompare(aVal);
        }
      });

      // Add "mb" suffix to size values for attachments
      attachments = attachments.map((attachment) => ({
        ...attachment,
        size_in_mb: attachment.size_in_mb
          ? `${attachment.size_in_mb} mb`
          : null,
      }));

      const allowedFieldsForExport =
        await this.schemaService.getAllowedExportFields(
          userId,
          "attachments_view_edit"
        );
      const allowedFieldSet = new Set<string>();
      for (const field of allowedFieldsForExport) {
        if (field.read) {
          allowedFieldSet.add(field.field_desc);
        }
      }
      const labelMap: Record<string, string> = {
        "Document Name": "Document Name",
        Format: "Format",
        Size: "Size",
        "Fiscal Year": "Fiscal Year",
        "Document Category": "Document Category",
        "Document Type": "Document Type",
        "Related Entity": "Related Entity",
        "Related To ID": "Related To ID",
        "Related To Name": "Related To Name",
        "Attached By": "Attached By",
        "Attached On": "Attached On",
        "Attachment ID": "Attachment ID",
        "Project ID" : "Project ID",
        "Project Name": "Project Name"
      };

      attachments = attachments.map((at) => {
        const rawMapped = this.mapAttachmentToCommonFormat(at, timezone); // with internal keys
        const filtered: Record<string, any> = {};
        for (const [fieldKey, value] of Object.entries(rawMapped)) {
          const label = labelMap[fieldKey]; // field_desc
          if (allowedFieldSet.has(label)) {
            filtered[label] = value; // export with label name
          }
        }
        return filtered;
      });

    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: {
        attachments: attachments,
      }
    };

  } catch (error) {
    errorLog("getAttachmentSummary error:", (error as Error).message);
    return {
      statusCode: 500,
      message: 'Failed to fetch attachment summary',
      errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
      data: { attachments: [] }
    };
  }
}



// Helper method to get display names for attachments
private async getAttachmentDisplayNames(attachments: any[], schemaNumber: string, type? : string): Promise<Record<string, string>> {
  const displayNames: Record<string, string> = {};
  for (const attachment of attachments) {
    try {
      switch (attachment.attachment_level) {
        case 'account':
          const account = await this.schemaService.fetchAccountById(attachment.attach_to);
          displayNames[attachment.rid] = account?.account_name || attachment.attach_to;
          break;
        case 'project':
          const project = await this.projectIngestionService.fetchProjectInfoById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = project?.project_code || attachment.attach_to;
          if(type === DOSSIER_NAME) {
            attachment.dataValues.project_code = project?.project_code || ''
            attachment.dataValues.project_name = project?.project_name || ''
          }
          break;
        case 'project_resource':
          const projectResource = await this.projectIngestionService.fetchProjectResourceById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (projectResource as { r_number?: string })?.r_number || attachment.attach_to;
          break;
        case 'project_task':
          const projectTask = await this.projectIngestionService.fetchProjectTaskById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (projectTask as { r_number?: string })?.r_number || attachment.attach_to;
          break;
        case 'resource':
          const resource = await this.projectIngestionService.fetchResourceById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (resource as { resource_code?: string })?.resource_code || attachment.attach_to;
          break;
        case 'resource_cost':
          const resourceCost = await this.projectIngestionService.fetchResourceCostById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (resourceCost as { r_number?: string })?.r_number || attachment.attach_to;
          break;
        case 'resource_skill': 
          const resourceSkill = await this.projectIngestionService.fetchResourceSkillById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (resourceSkill as { r_number?: string })?.r_number || attachment.attach_to;
          break;     
        case 'case': 
          const cases = await this.projectIngestionService.fetchCaseById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (cases as { case_name?: string })?.case_name || attachment.attach_to;
          break;     
        default:
          displayNames[attachment.rid] = attachment.attach_to;
      }
    } catch (err) {
      errorLog(`Error fetching display name for attachment ${attachment.rid}:`, (err as Error).message);
      displayNames[attachment.rid] = attachment.attach_to;
    }
  }
  
  return displayNames;
}

  /**
 * Retrieves all document types and categories from the main database.
 * Optionally filters document types based on a specific document category RID.
 *
 * @async
 * @param {string} [category_rid] - Optional category RID to filter document types by category.
 *
 * @returns {Promise<{
 *   statusCode: number,
  *   message: string,
  *   errorMessage?: string,
  *   data?: {
  *     documentTypes: any[],
  *     documentCategories: any[]
  *   }
  * }>} - An object containing the status code, message, optional error message, and arrays of document types and categories.
  *
  * @throws {Error} - Throws an error if the database connection fails or a query error occurs.
  */ 
  async getDocumentTypeAndCategory(category_rid?: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { documentTypes: any[]; documentCategories: any[] };
  }> {
    try {
      const mainSequelize = await initMainDbSequelize();

      let whereCategory = "";
      if (category_rid) {
        whereCategory = `WHERE category_rid = '${category_rid}'`;
      }

      // Fetch document types and categories from main DB
      const [documentTypes, documentCategories] = await Promise.all([
        mainSequelize.query(
          rawQueries.fetchDocumentTypeByCategory(whereCategory),
          { type: "SELECT" }
        ),
        mainSequelize.query(
          rawQueries.fetchDocumentCategoryByorder(),
          { type: "SELECT" }
        ),
      ]);

    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: {
        documentTypes,
        documentCategories
      }
    };

  } catch (error) {
    errorLog("Error fetching document types and categories:", (error as Error).message);
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
      data: {
        documentTypes: [],
        documentCategories: []
      }
    };
  }
}



  private buildRawWhereClause(
    filters: Record<string, any>,
    search?: string
  ): { whereClause: any } {
    const whereClause: any = {
      [Op.and]: [],
    };

    // Search logic
    if (search) {
      whereClause[Op.and].push({
        [Op.or]: [
          { document_name: { [Op.iLike]: `%${search}%` } },
          { r_number: { [Op.iLike]: `%${search}%` } },
          { comments: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

  // Filter logic for your input structure
  Object.entries(filters).forEach(([field, filter]) => {
    if (!filter || typeof filter !== 'object') {
      logMessage(`Skipping filter for field ${field} due to invalid structure`);
      return;
    }

      const operator = Object.keys(filter)[0];
      const value = filter[operator];

    if (!operator || value === undefined) {
     logMessage(`Skipping filter for field ${field} due to missing operator or value`);
      return;
    }

      const condition: any = {};

      switch (field) {
        case "size_in_mb":
          switch (operator.toLowerCase()) {
            case "equals":
              condition[field] = { [Op.eq]: Number(value) };
              break;
            case "not_equals":
              condition[field] = {
                [Op.or]: [{ [Op.ne]: Number(value) }, { [Op.is]: null }],
              };
              break;
            case "less_than":
              condition[field] = { [Op.lt]: Number(value) };
              break;
            case "greater_than":
              condition[field] = { [Op.gt]: Number(value) };
              break;
            case "between":
              if (Array.isArray(value)) {
                condition[field] = {
                  [Op.between]: [Number(value[0]), Number(value[1])],
                };
              }
              break;
            case "is_empty":
              condition[field] = {
                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: 0 }],
              };
              break;
          }
          break;

        case "document_name":
        case "attachment_level":
        case "format":
        case "comments":
        case "attached_to":
        case "attach_to":
        case "r_number":
        case "uploaded_by":
          switch (operator.toLowerCase()) {
            case "equals":
              condition[field] = { [Op.iLike]: value };
              break;
            case "not_equals":
              condition[field] = {
                [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }],
              };
              break;
            case "contains":
              condition[field] = { [Op.iLike]: `%${value}%` };
              break;
            case "is_empty":
              condition[field] = {
                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
              };
              break;
          }
          break;

        case "created_datetime":
          switch (operator.toLowerCase()) {
            case "equals": {
              const date = new Date(value);
              condition[field] = Sequelize.literal(
                `DATE("${field}") = DATE('${date.toISOString()}')`
              );
              break;
            }
            case "before": {
              const date = new Date(value);
              condition[field] = Sequelize.literal(
                `DATE("${field}") < DATE('${date.toISOString()}')`
              );
              break;
            }
            case "after": {
              const date = new Date(value);
              condition[field] = Sequelize.literal(
                `DATE("${field}") > DATE('${date.toISOString()}')`
              );
              break;
            }
            case "between": {
              if (Array.isArray(value)) {
                const startDate = new Date(value[0]);
                const endDate = new Date(value[1]);
                condition[field] = Sequelize.literal(
                  `DATE("${field}") BETWEEN DATE('${startDate.toISOString()}') AND DATE('${endDate.toISOString()}')`
                );
              }
              break;
            }
            case "is_empty":
              condition[field] = { [Op.is]: null };
              break;
          }
          break;

        case "document_type_rid":
        case "document_category_rid":
        case "fiscal_year":
          switch (operator.toLowerCase()) {
            case "equals":
              condition[field] = { [Op.eq]: value };
              break;
            case "not_equals":
              condition[field] = {
                [Op.or]: [{ [Op.ne]: value }, { [Op.is]: null }],
              };
              break;
            case "in":
              condition[field] = {
                [Op.in]: Array.isArray(value) ? value : [value],
              };
              break;
            case "is_empty":
              condition[field] = {
                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
              };
              break;
          }
          break;

      default:
        logMessage(`Unhandled filter field: ${field}`);
    }

      if (Object.keys(condition).length > 0) {
        whereClause[Op.and].push(condition);
      }
    });

    return { whereClause: whereClause[Op.and].length > 0 ? whereClause : {} };
  }

  /**
   * Formats an error response to be returned from service methods.
   *
   * @param {Error} err - The caught error.
   * @returns {object} - Standardized error response object.
   */
  throwServiceError(err: Error): {
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
