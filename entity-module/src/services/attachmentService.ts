import moment, { Moment } from "moment";
import "moment-timezone";  
import { initOrgSequelize } from "../config/orgDataSource";
import { Attachment, setupAttachmentSeq } from "../models/attachments";
import { HttpStatus, MAIN_SCHEMA_NAME } from "../utils/constants";
import { ICreateAttachment } from "../utils/types";
import { Op, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../config/mainDataSource";
import SchemaService from "./schemaService";
import { Logger } from "winston";
import { AttachmentTimeline, setupAttachmentTimelineSequence } from "../models/attachmentTimeline";
import { uploadToAzureBlob } from "../utils/helpers";
import ProjectIngestionService from "./projectIngestionService";
import { DocumentType } from "../models/documentType";
import { AttachmentSummary } from "../models/attachmentSummary";


export class AttachmentService {
    private schemaService: SchemaService;
    private projectIngestionService: ProjectIngestionService;
    private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.schemaService = new SchemaService();
    this.projectIngestionService = new ProjectIngestionService(logger);
  }

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
        // Check if file exists (if file upload is required)
        if (!file) {
            return {
                statusCode: 400,
                message: 'File upload failed',
                errorMessage: 'No file was uploaded'
            };
        }

         const { account_rid, attachment_level } = attachmentData;

      const accountData = await this.schemaService.fetchAccountById(account_rid);

      if (!accountData) {
        throw new Error("Error creating project: Invalid account ID");
      }

      if (accountData.status !== "active") {
        throw new Error(
          "Attachment creation failed: The selected account is inactive. Please choose an active account."
        );
      }

      let accountNumber = accountData.r_number;

      if (
        accountData.parent_account_rid === null && attachment_level !== "parent_account" ||
        accountData.parent_account_rid === "" && attachment_level !== "parent_account"
      ) {
        throw new Error("Error creating project: Invalid account ID");
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
        throw new Error("Invalid account ID: schema doesn't exists");
      }
       
        await this.createAttachmentTables(accountNumber);

        const { url, name, extension, size } = await uploadToAzureBlob(file, account_rid);
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
            document_category_others: attachmentData.document_category_others || null,
            document_type_others: attachmentData.document_type_others || null,
            comments: attachmentData.comments || null,
            created_by: userId,
            // modified_by: userId
        });

        await AttachmentTimeline.create({
            document_rid: attachmentModel.rid,
            document_name: attachmentModel.document_name,
            document_category_rid: attachmentModel.document_category_rid,
            document_type_rid: attachmentModel.document_type_rid,
            created_by: userId,
            modified_by: userId,
            attach_to: attachmentData.attach_to,
            attachment_level: attachmentData.attachment_level,
            event_type: 'ui handler',
            event_status: 'success',
            event_name: 'create',
            event_datetime: new Date(),
        })

        await AttachmentSummary.create({
            r_number: attachmentModel.r_number,
            browse_file: attachmentModel.browse_file,
            document_name: attachmentModel.document_name,
            attach_to: attachmentModel.attach_to,
            attachment_level: attachmentModel.attachment_level,
            fiscal_year: attachmentModel.fiscal_year,
            account_rid: account_rid,
            format: extension,
            size_in_mb: size,
            document_category_rid: attachmentModel.document_category_rid,
            document_type_rid: attachmentModel.document_type_rid,
            document_category_others: attachmentModel.document_category_others || null,
            document_type_others: attachmentModel.document_type_others || null,
            comments: attachmentModel.comments || null,
            created_by: userId,
            modified_by: userId
        });

        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: { attachment: attachmentModel }
        };

    } catch (error) {
        console.error('Error creating attachment:', error);
        
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
            message: 'Failed to create attachment',
            errorMessage: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

   async createAttachmentTables(accountNumber: string) {
    try {
      const orgDbSequlize = await initOrgSequelize();
      const mainDbSequlize = await initMainDbSequelize();
      const schemaName = `trd365_${accountNumber.replace(/\D/g, '')}`;
      

      const AttachmentModel = await Attachment.initialize(
        orgDbSequlize,
        schemaName
      );

      const AttachmentTimelineModel = await AttachmentTimeline.initialize(
        orgDbSequlize,
        schemaName
      );

      const AttachmentSummaryModel = AttachmentSummary.initialize(mainDbSequlize);

      await AttachmentModel.sync({ force: false });
      await AttachmentTimelineModel.sync({ force: false });
      await AttachmentSummaryModel.sync({ force: false });

      await setupAttachmentSeq(orgDbSequlize, schemaName);
      await setupAttachmentTimelineSequence(orgDbSequlize, schemaName);
      
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }
  

async getAttachments(
  userId: string,
  level?: string,
  entityId?: string,
  accountRid?: string,
  page: number = 1,
  limit: number = 10,
  search?: string,
  filters: Record<string, any> = {},
  sortBy: string = 'created_datetime',
  sortOrder: string = 'DESC'
): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { attachments: any[]; totalCount: number };
}> {
  try {
    if (!accountRid) throw new Error("Account RID is required");

    const orgDbSequelize = await initOrgSequelize();
    if (!orgDbSequelize) throw new Error("Failed to initialize database connection");

    const accountData = await this.schemaService.fetchAccountById(accountRid);
    if (!accountData) throw new Error("Invalid account ID");

    let schemaNumber = accountData.r_number;
    if (accountData.storage_type === "store_in_parent" && accountData.parent_account_rid) {
      schemaNumber = await this.schemaService.fetchParentAccount(accountData.parent_account_rid);
    }

    const schemaName = `trd365_${schemaNumber.replace(/\D/g, '')}`;
    const AttachmentModel = Attachment.initialize(orgDbSequelize, schemaName);

    let allAttachments: any[] = [];

    // Handle attached_to filter separately
    let attachedToFilter;
    if (filters.attached_to) {
      attachedToFilter = filters.attached_to;
      delete filters.attached_to; // Remove from main filters
    }

    // Build whereClause for remaining filters + search
    const { whereClause } = this.buildRawWhereClause(filters, search);

    // 🔷 Handle parent_account separately
    if (level === 'parent_account' && entityId) {
      // ... [Previous parent account logic remains the same]
      const parentAccountData = await this.schemaService.fetchAccountById(entityId);
      if (!parentAccountData) throw new Error("Invalid parent account ID");

      const parentSchemaNumber = parentAccountData.r_number;
      const parentSchemaName = `trd365_${parentSchemaNumber.replace(/\D/g, '')}`;
      const ParentAttachmentModel = Attachment.initialize(orgDbSequelize, parentSchemaName);

      const parentWhere = {
        [Op.and]: [
          { attachment_level: 'parent_account' },
          { attach_to: entityId },
          ...(whereClause[Op.and] || [])
        ]
      };

      const parentAttachments = await ParentAttachmentModel.findAll({ where: parentWhere });
      allAttachments.push(...parentAttachments);

      // ... [Rest of parent account logic remains the same]
      const childAccounts = await this.schemaService.getChildAccounts(entityId);

      const schemaToChildAccountsMap: Record<string, any[]> = {};
      for (const child of childAccounts) {
        const schemaToUse = ((child as any).storage_type === 'separate_db')
          ? `trd365_${(child as any).r_number.replace(/\D/g, '')}`
          : parentSchemaName;

        if (!schemaToChildAccountsMap[schemaToUse]) {
          schemaToChildAccountsMap[schemaToUse] = [];
        }
        schemaToChildAccountsMap[schemaToUse].push(child);
      }

      for (const [schema, children] of Object.entries(schemaToChildAccountsMap)) {
        const ChildAttachmentModel = Attachment.initialize(orgDbSequelize, schema);

        for (const child of children) {
          const childRid = child.rid;

          const childAccountWhere = {
            [Op.and]: [
              { attachment_level: 'child_account' },
              { attach_to: childRid },
              ...(whereClause[Op.and] || [])
            ]
          };

          const childAccountAttachments = await ChildAttachmentModel.findAll({
            where: childAccountWhere
          });
          allAttachments.push(...childAccountAttachments);

          const childProjects = await this.projectIngestionService.getProjectsByAccountId(
            schema.replace('trd365_', ''),
            childRid
          );
          const childProjectIds = childProjects.map(p => p.rid);

          if (childProjectIds.length > 0) {
            const childProjectWhere = {
              [Op.and]: [
                { attachment_level: 'project' },
                { attach_to: { [Op.in]: childProjectIds } },
                ...(whereClause[Op.and] || [])
              ]
            };

            const childProjectAttachments = await ChildAttachmentModel.findAll({
              where: childProjectWhere
            });
            allAttachments.push(...childProjectAttachments);
          }
        }
      }
    } else {
      // Other levels handling
      if (entityId) {
        switch (level) {
          case 'project':
            whereClause[Op.and].push({
              attachment_level: 'project',
              attach_to: entityId
            });
            break;
          case 'child_account':
            if (whereClause[Op.and]) {
              whereClause[Op.and].push({
                attachment_level: 'child_account',
                attach_to: entityId
              });
            } else {
              whereClause[Op.and] = [{
                attachment_level: 'child_account',
                attach_to: entityId
              }];
            }
            break;
          default:
            whereClause[Op.and].push({ attach_to: entityId });
        }
      } else if (level) {
        whereClause[Op.and].push({ attachment_level: level });
      }

      const result = await AttachmentModel.findAll({
        where: whereClause
      });
      allAttachments.push(...result);
    }

    // Fetch display names for all attachments first
    const attachmentDisplayNames = await this.getAttachmentDisplayNames(allAttachments, schemaNumber);

    // Apply attached_to filter if present
    if (attachedToFilter) {
      const filteredAttachments = allAttachments.filter(attachment => {
        let displayName = attachmentDisplayNames[attachment.rid];
        // Fallback to attach_to field if displayName is missing
        if (!displayName && attachment.attach_to) {
          displayName = String(attachment.attach_to);
        }

        if (!displayName) return false; // Final safeguard

        // Safely handle potential undefined values
        const displayValue = (displayName || '').toLowerCase();
        const operator = Object.keys(attachedToFilter)[0];
        const filterValue = (attachedToFilter[operator] || '').toLowerCase();

        switch (operator) {
          case 'contains':
            return displayValue.includes(filterValue);
          case 'equals':
            return displayValue === filterValue;
          case 'not_equals':
            return displayValue !== filterValue;
          default:
            // If invalid operator, filter out everything for safety
            return false;
        }
      });

      allAttachments = [...filteredAttachments];
    }


    // Sort with display names
    const validSortFields = ['document_name', 'document_type', 'r_number', 'format', 'attachment_level', 'size_in_mb', 'attached_to', 'comments', 'created_by', 'created_datetime'];
    const validOrder = ['ASC', 'DESC'];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_datetime';
    const finalSortOrder = validOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    allAttachments.sort((a, b) => {
      if (finalSortBy === 'attached_to') {
        const aDisplay = attachmentDisplayNames[a.rid] || '';
        const bDisplay = attachmentDisplayNames[b.rid] || '';
        return finalSortOrder === 'ASC' 
          ? aDisplay.localeCompare(bDisplay)
          : bDisplay.localeCompare(aDisplay);
      } else {
        if (finalSortOrder === 'ASC') {
          return (a[finalSortBy] > b[finalSortBy]) ? 1 : -1;
        } else {
          return (a[finalSortBy] < b[finalSortBy]) ? 1 : -1;
        }
      }
    });

    // Pagination
    const totalCount = allAttachments.length;
    const paginatedAttachments = allAttachments.slice((page - 1) * limit, page * limit);

    // Map document types and user names
    const documentTypeIds = [...new Set(paginatedAttachments.map(att => att.document_type_rid))];
    const userIds = [...new Set(paginatedAttachments.map(att => att.created_by))];

    const mainSequelize = await initMainDbSequelize();

    const [documentTypes, users] = await Promise.all([
      documentTypeIds.length > 0 
        ? mainSequelize.query(
            `SELECT rid, type_name FROM ${MAIN_SCHEMA_NAME}.document_type WHERE rid IN (:documentTypeIds)`,
            {
              replacements: { documentTypeIds },
              type: 'SELECT'
            }
          )
        : Promise.resolve([]),
      userIds.length > 0
        ? mainSequelize.query(
            `SELECT rid, CONCAT(first_name, ' ', last_name) as full_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (:userIds)`,
            {
              replacements: { userIds }, 
              type: 'SELECT'
            }
          )
        : Promise.resolve([])
    ]);

    const documentTypeMap = new Map(documentTypes.map((dt: any) => [dt.rid, dt.type_name]));
    const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));

    // Map final results
    const attachments = paginatedAttachments.map(attachment => ({
      ...attachment.get({ plain: true }),
      document_type: documentTypeMap.get(attachment.document_type_rid) || null,
      uploaded_by: userMap.get(attachment.created_by) || attachment.created_by,
      attached_to: attachmentDisplayNames[attachment.rid] || attachment.attach_to
    }));

    // Handle document_type sorting separately if needed
    if (sortBy === 'document_type') {
      attachments.sort((a, b) => {
        const aType = a.document_type || '';
        const bType = b.document_type || '';
        return finalSortOrder === 'ASC' 
          ? aType.localeCompare(bType)
          : bType.localeCompare(aType);
      });
    }

    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: {
        attachments,
        totalCount
      }
    };

  } catch (error) {
    console.error("getAttachments error:", error);
    return {
      statusCode: 500,
      message: 'Failed to fetch attachments',
      errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
      data: {
        attachments: [],
        totalCount: 0
      }
    };
  }
}


// Helper method to get display names for attachments
private async getAttachmentDisplayNames(attachments: any[], schemaNumber: string): Promise<Record<string, string>> {
  const displayNames: Record<string, string> = {};
  
  for (const attachment of attachments) {
    try {
      switch (attachment.attachment_level) {
        case 'child_account':
        case 'parent_account':
          const account = await this.schemaService.fetchAccountById(attachment.attach_to);
          displayNames[attachment.rid] = account?.account_name || attachment.attach_to;
          break;
        case 'project':
          const project = await this.projectIngestionService.fetchProjectById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = project?.project_code || attachment.attach_to;
          break;
        default:
          displayNames[attachment.rid] = attachment.attach_to;
      }
    } catch (err) {
      console.error(`Error fetching display name for attachment ${attachment.rid}:`, err);
      displayNames[attachment.rid] = attachment.attach_to;
    }
  }
  
  return displayNames;
}

async getDocumentTypeAndCategory(category_rid?: string): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { documentTypes: any[]; documentCategories: any[] };
}> {
  try {
    const mainSequelize = await initMainDbSequelize();

    let whereCategory="";
    if(category_rid){
       whereCategory=`WHERE category_rid = '${category_rid}'`;
    }

    // Fetch document types and categories from main DB
    const [documentTypes, documentCategories] = await Promise.all([
      mainSequelize.query(
        `SELECT 
          rid, 
          type_name, 
          type_description,
          category_rid 
         FROM ${MAIN_SCHEMA_NAME}.document_type 
         ${whereCategory}
         ORDER BY type_name ASC`,
        { type: 'SELECT' }
      ),
      mainSequelize.query(
        `SELECT 
          rid, 
          category_name, 
          category_description 
         FROM ${MAIN_SCHEMA_NAME}.document_category
         ORDER BY category_name ASC`,
        { type: 'SELECT' }
      )
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
    console.error("Error fetching document types and categories:", error);
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
    [Op.and]: []
  };

  // Search logic
  if (search) {
    whereClause[Op.and].push({
      [Op.or]: [
        { document_name: { [Op.iLike]: `%${search}%` } },
        { document_id: { [Op.iLike]: `%${search}%` } },
        { comments: { [Op.iLike]: `%${search}%` } }
      ]
    });
  }

  // Filter logic for your input structure
  Object.entries(filters).forEach(([field, filter]) => {
    if (!filter || typeof filter !== 'object') {
      console.log(`Skipping filter for field ${field} due to invalid structure`);
      return;
    }

    const operator = Object.keys(filter)[0];
    const value = filter[operator];

    if (!operator || value === undefined) {
      console.log(`Skipping filter for field ${field} due to missing operator or value`);
      return;
    }

    const condition: any = {};

    switch (field) {
      case 'size_in_mb':
        switch (operator.toLowerCase()) {
          case 'equals': condition[field] = { [Op.eq]: Number(value) }; break;
          case 'not_equals': condition[field] = { [Op.ne]: Number(value) }; break;
          case 'less_than': condition[field] = { [Op.lt]: Number(value) }; break;
          case 'greater_than': condition[field] = { [Op.gt]: Number(value) }; break;
          case 'between':
            if (Array.isArray(value)) {
              condition[field] = { [Op.between]: [Number(value[0]), Number(value[1])] };
            }
            break;
          case 'is_empty':
            condition[field] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: 0 }] };
            break;
        }
        break;

      case 'document_name':
      case 'attachment_level':  
      case 'format':
      case 'comments':
      case 'attach_to':  
      case 'r_number':
      case 'created_by':
        switch (operator.toLowerCase()) {
          case 'equals': condition[field] = { [Op.eq]: value }; break;
          case 'not_equals': condition[field] = { [Op.ne]: value }; break;
          case 'contains': condition[field] = { [Op.iLike]: `%${value}%` }; break;
          case 'is_empty': condition[field] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
        }
        break;

      case 'created_datetime':
        switch (operator.toLowerCase()) {
          case 'equals':
            condition[field] = {
              [Op.and]: [
                { [Op.gte]: new Date(value).setHours(0, 0, 0, 0) },
                { [Op.lte]: new Date(value).setHours(23, 59, 59, 999) }
              ]
            };
            break;
          case 'before': condition[field] = { [Op.lt]: new Date(value) }; break;
          case 'after': condition[field] = { [Op.gt]: new Date(value) }; break;
          case 'between':
            if (Array.isArray(value)) {
              condition[field] = { [Op.between]: [new Date(value[0]), new Date(value[1])] };
            }
            break;
          case 'is_empty': condition[field] = { [Op.is]: null }; break;
        }
        break;

      case 'document_type':
        switch (operator.toLowerCase()) {
          case 'equals': condition[field] = { [Op.eq]: value }; break;
          case 'not_equals': condition[field] = { [Op.ne]: value }; break;
          case 'in': condition[field] = { [Op.in]: Array.isArray(value) ? value : [value] }; break;
        }
        break;

      default:
        console.log(`Unhandled filter field: ${field}`);
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