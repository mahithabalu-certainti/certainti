import { Op, Sequelize } from "sequelize";
import { initOrgSequelize } from "../../config/orgDataSource";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { ICreateNotesSchema, IUpdateNotesSchema } from "./notesSchemas";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../../utils/constants";
import { Notes, setupNotesSeq } from "../../models/notes";
import { NotesTimeline, setupNotesTimelineSequence } from "../../models/notesTimeline";
import { TaskSummary } from "../../models/taskSummary";
import SchemaService from "../schemaService";
import { Logger } from "winston";
import { deleteFromAzureBlob, uploadToAzureBlob } from "../../utils/helpers";
import ProjectIngestionService from "../projectIngestionService";
import { ResourceService } from "../resourceServices";
import ResourceCostService from "../resourceCostService";
import ResourceSkillService from "../resourceSkillService";
import moment from "moment";
import { IFetchNotesDetailsInput } from "../../utils/types";
import { fetchActiveStatus, fetchNotesById, fetchUsers } from "../../utils/rawQueries";
import { generateSasUrl } from "../../utils/blob";
import { isValidTimezone } from "../../utils/valideTimeChecker";

export class TaskService {
    private logger: Logger;
    private schemaService: SchemaService;
    private projectIngestionService: ProjectIngestionService;
    private resourceService: ResourceService;
    private resourceCostService: ResourceCostService;
    private resourceSkillService: ResourceSkillService;
    private mainDbSequelize : Sequelize | null = null
    private orgDbSequelize : Sequelize | null = null

    constructor(logger: Logger) {
        this.logger = logger;
        this.schemaService = new SchemaService();
        this.projectIngestionService = new ProjectIngestionService(logger);
        this.resourceService = new ResourceService();
        this.resourceCostService = new ResourceCostService();
        this.resourceSkillService = new ResourceSkillService();
    }

    async fetchMainDb () {
      if(!this.mainDbSequelize) {
        this.mainDbSequelize = await initMainDbSequelize()
      }
      return this.mainDbSequelize;
    }

    async fetchOrgDb () {
      if(!this.orgDbSequelize) {
        this.orgDbSequelize = await initOrgSequelize()
      }
      return this.orgDbSequelize
    }

    async getTaskSummary(
      userId: string,
      page: number = 1,
      limit: number = 10,
      search?: string,
      filters: Record<string, any> = {},
      globalFilters: Record<string, any> = {},
      sortBy: string = 'created_datetime',
      sortOrder: string = 'DESC',
      fiscalYear: number = 0
    ): Promise<{
      statusCode: number;
      message: string;
      errorMessage?: string;
      data?: { notes: any[]; totalCount: number };
    }> {
      try {
        const mainSequelize = await initMainDbSequelize();
        if (!mainSequelize) throw new Error("Failed to initialize main DB connection");
    
        const TaskSummaryModel = TaskSummary.initialize(mainSequelize);
        const userGroupType = await this.schemaService.getUserGroupType(userId);
        const isCustomGlobal = userGroupType === "DEFAULT";
        let accessibleAccountIds: string[] = [];
        if (!isCustomGlobal) {
        const accessibleAccounts = await this.schemaService.getAccessibleAccountInfo(userId);
        const accessibleAccountIds = accessibleAccounts.map((acc) => acc.id);
    
          // If user has no accessible accounts, return empty response
          if (accessibleAccountIds.length === 0) {
            return {
              statusCode: HttpStatus.SUCCESS,
              message: HttpStatus.SUCCESS_MESSAGE,
              data: {
                notes: [],
                totalCount: 0,
              },
            };
          }
        }
    
        let attachedToFilter, createdByFilter, modifiedByFilter, notesOwnerFilter;
        if (filters.attached_to) {
          attachedToFilter = filters.attached_to;
          delete filters.attached_to;
        }
        if (filters.created_by_name) {
          createdByFilter = filters.created_by_name;
          delete filters.created_by_name;
        }
        if (filters.modified_by_name) {
          modifiedByFilter = filters.modified_by_name;
          delete filters.modified_by_name;
        }
    
        const { whereClause } = this.buildRawWhereClause(filters, search);
        if (typeof globalFilters === 'string') globalFilters = JSON.parse(globalFilters);
          whereClause[Op.and] = whereClause[Op.and] || [];
    
    
        if (globalFilters && Object.keys(globalFilters).length > 0) {
          const parentAccountRid = Object.keys(globalFilters)[0];
          const childAccountRids = globalFilters[parentAccountRid];
            const filterAccounts = [...childAccountRids, parentAccountRid];
    
            // Intersect frontend filters with backend-accessible accounts
            if(!isCustomGlobal)
            {
              const validAccounts = filterAccounts.filter((rid) =>
                accessibleAccountIds.includes(rid)
              );
    
              // No valid accounts → return early
              if (validAccounts.length === 0) {
                return {
                  statusCode: HttpStatus.SUCCESS,
                  message: HttpStatus.SUCCESS_MESSAGE,
                  data: {
                    notes: [],
                    totalCount: 0,
                  },
                };
              }
               // Apply valid filtered accounts
              whereClause[Op.and].push({
                account_rid: { [Op.in]: validAccounts },
              });
            }
            else
            {
               // Apply valid filtered accounts
            whereClause[Op.and].push({
              account_rid: { [Op.in]: filterAccounts },
            });
            }
           
          } else {
            // No global filters — use all backend-accessible accounts
            if(!isCustomGlobal)
            {
                whereClause[Op.and].push({
                account_rid: { [Op.in]: accessibleAccountIds },
            });
            }
            
          }
    
        if (fiscalYear !== 0) {
          whereClause[Op.and] = whereClause[Op.and] || [];
          whereClause[Op.and].push({ fiscal_year: fiscalYear });
        }
    
        const attachmentsRaw = await TaskSummaryModel.findAll({ where: whereClause });
    
        const accountRids = [...new Set(attachmentsRaw.map(a => a.account_rid))];
        const accounts = await this.schemaService.fetchAccountsByIds(accountRids);
        const accountMap = new Map(accounts.map((a: any) => [a.rid, a]));
        const accountStatus = await this.schemaService.fetchAccountsWithStatusByIds(accountRids);
        const accountStatusMap = new Map(accountStatus.map((a: any) => [a.rid, a]));

        const schemaNumberMap = new Map<string, string>();
    
        await Promise.all(
          accounts.map(async (account) => {
            const acc = account as { rid: string; storage_type: string; r_number: string; parent_account_rid: string };
            const { rid, storage_type, r_number, parent_account_rid } = acc;
    
            if (storage_type === "store_in_parent") {
              const parent = await this.schemaService.fetchParentAccount(parent_account_rid);
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
        let parentDisplayRid : Record<string, string> = {}
        let currencyDisplayRid : Record<string, string> = {}
    
        await Promise.all(
          Array.from(schemaAttachmentMap.entries()).map(async ([schemaNumber, attachments]) => {
            const {displayNames, parentRid, currencyRid} = await this.getAttachmentDisplayNames(attachments, schemaNumber);
            Object.assign(attachmentDisplayNames, displayNames);
            Object.assign(parentDisplayRid, parentRid)
            Object.assign(currencyDisplayRid, currencyRid)
          })
        );
    
        // Map enriched data
        const userIds = [...new Set(attachmentsRaw.flatMap(att => [att.created_by, att.modified_by, att.notes_owner]))];
    
        const [users] = await Promise.all([
          userIds.length > 0 ? mainSequelize.query(
            `SELECT rid, CONCAT(first_name, ' ', last_name) as full_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (:userIds)`,
            { replacements: { userIds }, type: 'SELECT' }
          ) : []
        ]);
        const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));
    
        let attachments = await Promise.all(attachmentsRaw.map(async att => {

          const accountStatusInfo = accountStatusMap.get(att.account_rid);
          return {
            ...att.get({ plain: true }),
            created_by_name: userMap.get(att.created_by) || att.created_by,
            modified_by_name: userMap.get(att.modified_by) || att.modified_by,
            attached_to: attachmentDisplayNames[att.rid] || att.attach_to,
            notes_owner_name: userMap.get(att.notes_owner) || att.notes_owner,
            browse_file: att.browse_file !== '' && att.browse_file !== null && att.browse_file !== undefined ? await generateSasUrl(att.browse_file) : null,
            parent_rid: parentDisplayRid[att.attach_to],
            currency_rid: currencyDisplayRid[att.attach_to],
            status_rid: accountStatusInfo?.status_rid || null,
            status_name: accountStatusInfo?.status_name || null
          };
        }));

        // Filters: attached_to
        if (attachedToFilter) {
          attachments = attachments.filter(att => {
            const displayName = (att.attached_to || '').toLowerCase();
            const operator = Object.keys(attachedToFilter)[0];
            const filterValue = (attachedToFilter[operator] || '').toLowerCase();
            switch (operator) {
              case 'contains': return displayName.includes(filterValue);
              case 'equals': return displayName === filterValue;
              case 'not_equals': return displayName !== filterValue || displayName === null;
              default: return false;
            }
          });
        }
    
        // Filters: uploaded_by
         if (createdByFilter) {
          let filterValue;
            attachments = attachments.filter(notes => {
            const uploadedBy = notes.created_by_name?.toLowerCase() || '';
            const operator = Object.keys(createdByFilter)[0];
            if(operator === 'is_empty') filterValue = ''
            else filterValue = (createdByFilter[operator] || '').toLowerCase();
            switch (operator) {
              case 'contains': return uploadedBy.includes(filterValue);
              case 'equals': return uploadedBy === filterValue;
              case 'not_equals': return uploadedBy !== filterValue;
              case 'is_empty': return uploadedBy === null || uploadedBy === ''
              default: return false;
            }
          });
        }
        if (modifiedByFilter) {
          let filterValue;
            attachments = attachments.filter(notes => {
            const uploadedBy = notes.modified_by_name?.toLowerCase() || '';
            const operator = Object.keys(modifiedByFilter)[0];
            if(operator === 'is_empty') filterValue = ''
            else filterValue = (modifiedByFilter[operator] || '').toLowerCase();
            switch (operator) {
              case 'contains': return uploadedBy.includes(filterValue);
              case 'equals': return uploadedBy === filterValue;
              case 'not_equals': return uploadedBy !== filterValue
              case 'is_empty': return uploadedBy === null || uploadedBy === ''
              default: return false;
            }
          });
        }
        // 🔷 Sort with custom field sorting logic
        const validSortFields = ['document_name', 'title', 'r_number', 'format', 'attachment_level', 'size_in_mb', 'attached_to', 'descriptions', 'created_by_name', 'created_datetime', 'fiscal_year', 'modified_by_name', 'modified_datetime', 'notes_owner_name'];
        const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_datetime';
        const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
        attachments.sort((a, b) => {
          // Special handling for created_datetime
          if (finalSortBy === 'created_datetime') {
            const aDate = new Date(a[finalSortBy]).getTime();
            const bDate = new Date(b[finalSortBy]).getTime();
            return finalSortOrder === 'ASC' ? aDate - bDate : bDate - aDate;
          }
    
        let aVal: string = '';
        let bVal: string = '';
    
        switch (finalSortBy) {
          case 'attached_to': aVal = a.attached_to || ''; bVal = b.attached_to || ''; break;
          case 'created_by_name': aVal = a.created_by_name || ''; bVal = b.created_by_name || ''; break;
          case 'modified_by_name': aVal = a.modified_by_name || ''; bVal = b.modified_by_name || ''; break;
          case 'notes_owner_name': aVal = a.notes_owner_name || ''; bVal = b.notes_owner_name || ''; break;
          default:
            aVal = a[finalSortBy] !== undefined && a[finalSortBy] !== null ? String(a[finalSortBy]) : '';
            bVal = b[finalSortBy] !== undefined && b[finalSortBy] !== null ? String(b[finalSortBy]) : '';
        }
    
        aVal = aVal.trim().toLowerCase();
        bVal = bVal.trim().toLowerCase();
    
        const isAEmpty = !aVal;
        const isBEmpty = !bVal;
    
        // 🔷 Ascending: empty values last
        if (finalSortOrder === 'ASC') {
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
        const paginatedNotes = attachments.slice((page - 1) * limit, page * limit);
    
        // Add "mb" suffix to size values for paginated attachments
        const paginatedAttachmentsWithSizeSuffix = paginatedNotes.map(notes => ({
          ...notes,
          size_in_mb: notes.size_in_mb ? `${notes.size_in_mb} mb` : null
        }));
    
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            notes: paginatedAttachmentsWithSizeSuffix,
            totalCount: attachments.length
          }
        };
    
      } catch (error) {
        console.error("getTaskSummary error:", error);
        return {
          statusCode: 500,
          message: 'Failed to fetch notes summary',
          errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
          data: { notes: [], totalCount: 0 }
        };
      }
    }

    async exportTaskSummary(
      userId: string,
      search?: string,
      filters: Record<string, any> = {},
      globalFilters: Record<string, any> = {},
      sortBy: string = 'created_datetime',
      sortOrder: string = 'DESC',
      fiscalYear: number = 0,
      timezone : string = ``
    ): Promise<{
      statusCode: number;
      message: string;
      errorMessage?: string;
      data?: { notes: any[] };
    }> {
      try {
        const mainSequelize = await initMainDbSequelize();
        if (!mainSequelize) throw new Error("Failed to initialize main DB connection");
    
        const AttachmentSummaryModel = TaskSummary.initialize(mainSequelize);
        const userGroupType = await this.schemaService.getUserGroupType(userId);
        const isCustomGlobal = userGroupType === "DEFAULT";
        let accessibleAccountIds: string[] = [];
        if (!isCustomGlobal) {
        const accessibleAccounts = await this.schemaService.getAccessibleAccountInfo(userId);
        const accessibleAccountIds = accessibleAccounts.map((acc) => acc.id);
    
          // If user has no accessible accounts, return empty response
          if (accessibleAccountIds.length === 0) {
            return {
              statusCode: HttpStatus.SUCCESS,
              message: HttpStatus.SUCCESS_MESSAGE,
              data: {
                notes: []
              },
            };
          }
        }
    
        let attachedToFilter, createdByFilter, modifiedByFilter, notesOwnerFilter;
        if (filters.attached_to) {
          attachedToFilter = filters.attached_to;
          delete filters.attached_to;
        }
        if (filters.created_by_name) {
          createdByFilter = filters.created_by_name;
          delete filters.created_by_name;
        }
        if (filters.modified_by_name) {
          modifiedByFilter = filters.modified_by_name;
          delete filters.modified_by_name;
        }
    
        const { whereClause } = this.buildRawWhereClause(filters, search);
        if (typeof globalFilters === 'string') globalFilters = JSON.parse(globalFilters);

        whereClause[Op.and] = whereClause[Op.and] || [];

          if (globalFilters && Object.keys(globalFilters).length > 0) {
            const parentAccountRid = Object.keys(globalFilters)[0];
            const childAccountRids = globalFilters[parentAccountRid];
            const filterAccounts = [...childAccountRids, parentAccountRid];
    
            // Intersect frontend filters with backend-accessible accounts
            if(!isCustomGlobal)
            {
              const validAccounts = filterAccounts.filter((rid) =>
                accessibleAccountIds.includes(rid)
              );
    
              // No valid accounts → return early
              if (validAccounts.length === 0) {
                return {
                  statusCode: HttpStatus.SUCCESS,
                  message: HttpStatus.SUCCESS_MESSAGE,
                  data: {
                    notes: []
                  },
                };
              }
               // Apply valid filtered accounts
              whereClause[Op.and].push({
                account_rid: { [Op.in]: validAccounts },
              });
            }
            else
            {
               // Apply valid filtered accounts
            whereClause[Op.and].push({
              account_rid: { [Op.in]: filterAccounts },
            });
            }
           
          } else {
            // No global filters — use all backend-accessible accounts
             if(!isCustomGlobal)
            {
                whereClause[Op.and].push({
                account_rid: { [Op.in]: accessibleAccountIds },
            });
            }
          }
    
        if (fiscalYear !== 0) {
          whereClause[Op.and] = whereClause[Op.and] || [];
          whereClause[Op.and].push({ fiscal_year: fiscalYear });
        }
    
        const attachmentsRaw = await AttachmentSummaryModel.findAll({ where: whereClause });
    
        const accountRids = [...new Set(attachmentsRaw.map(a => a.account_rid))];
        const accounts = await this.schemaService.fetchAccountsByIds(accountRids);
        const accountMap = new Map(accounts.map((a: any) => [a.rid, a]));
    
        const schemaNumberMap = new Map<string, string>();
    
        await Promise.all(
          accounts.map(async (account) => {
            const acc = account as { rid: string; storage_type: string; r_number: string; parent_account_rid: string };
            const { rid, storage_type, r_number, parent_account_rid } = acc;
    
            if (storage_type === "store_in_parent") {
              const parent = await this.schemaService.fetchParentAccount(parent_account_rid);
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
          Array.from(schemaAttachmentMap.entries()).map(async ([schemaNumber, attachments]) => {
            const {displayNames} = await this.getAttachmentDisplayNames(attachments, schemaNumber);
            Object.assign(attachmentDisplayNames, displayNames);
          })
        );
    
        // Map enriched data
        const userIds = [...new Set(attachmentsRaw.flatMap(att => [att.created_by, att.modified_by, att.notes_owner]))];
    
        const [users] = await Promise.all([
          userIds.length > 0 ? mainSequelize.query(
            `SELECT rid, CONCAT(first_name, ' ', last_name) as full_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (:userIds)`,
            { replacements: { userIds }, type: 'SELECT' }
          ) : []
        ]);
        const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));
    
        let attachments = await Promise.all(attachmentsRaw.map(async att => ({
          ...att.get({ plain: true }),
          created_by_name: userMap.get(att.created_by) || att.created_by,
          modified_by_name: userMap.get(att.modified_by) || att.modified_by,
          attached_to: attachmentDisplayNames[att.rid] || att.attach_to,
          notes_owner_name: userMap.get(att.notes_owner) || att.notes_owner,
          browse_file : att.browse_file !== '' && att.browse_file !== null && att.browse_file !== undefined ? await generateSasUrl(att.browse_file) : null,
        })));
    
        // Filters: attached_to
        if (attachedToFilter) {
          attachments = attachments.filter(att => {
            const displayName = (att.attached_to || '').toLowerCase();
            const operator = Object.keys(attachedToFilter)[0];
            const filterValue = (attachedToFilter[operator] || '').toLowerCase();
            switch (operator) {
              case 'contains': return displayName.includes(filterValue);
              case 'equals': return displayName === filterValue;
              case 'not_equals': return displayName !== filterValue || displayName === null;
              default: return false;
            }
          });
        }
    
        // Filters: uploaded_by
        if (createdByFilter) {
          attachments = attachments.filter(att => {
            const uploadedBy = (att.created_by_name || '').toLowerCase();
            const operator = Object.keys(createdByFilter)[0];
            const filterValue = (createdByFilter[operator] || '').toLowerCase();
            switch (operator) {
              case 'contains': return uploadedBy.includes(filterValue);
              case 'equals': return uploadedBy === filterValue;
              case 'not_equals': return uploadedBy !== filterValue || uploadedBy === null;
              default: return false;
            }
          });
        }
        if (modifiedByFilter) {
          attachments = attachments.filter(att => {
            const modifiedBy = (att.modified_by_name || '').toLowerCase();
            const operator = Object.keys(modifiedByFilter)[0];
            const filterValue = (modifiedByFilter[operator] || '').toLowerCase();
            switch (operator) {
              case 'contains': return modifiedBy.includes(filterValue);
              case 'equals': return modifiedBy === filterValue;
              case 'not_equals': return modifiedBy !== filterValue || modifiedBy === null;
              default: return false;
            }
          });
        }
    
        // 🔷 Sort with custom field sorting logic
        const validSortFields = ['document_name', 'title', 'notes_owner', 'r_number', 'format', 'attachment_level', 'size_in_mb', 'attached_to', 'descriptions', 'created_by_name', 'created_datetime', 'fiscal_year', 'modified_by_name', 'modified_datetime', 'notes_owner_name'];
        const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_datetime';
        const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
        attachments.sort((a, b) => {
        // Special handling for created_datetime
        if (finalSortBy === 'created_datetime') {
          const aDate = new Date(a[finalSortBy]).getTime();
          const bDate = new Date(b[finalSortBy]).getTime();
          return finalSortOrder === 'ASC' ? aDate - bDate : bDate - aDate;
        }
    
        let aVal: string = '';
        let bVal: string = '';
    
       switch (finalSortBy) {
          case 'attached_to': aVal = a.attached_to || ''; bVal = b.attached_to || ''; break;
          case 'created_by_name': aVal = a.created_by_name || ''; bVal = b.created_by_name || ''; break;
          case 'modified_by_name': aVal = a.modified_by_name || ''; bVal = b.modified_by_name || ''; break;
          case 'notes_owner_name': aVal = a.notes_owner_name || ''; bVal = b.notes_owner_name || ''; break;
          default:
            aVal = a[finalSortBy] !== undefined && a[finalSortBy] !== null ? String(a[finalSortBy]) : '';
            bVal = b[finalSortBy] !== undefined && b[finalSortBy] !== null ? String(b[finalSortBy]) : '';
        }
    
        aVal = aVal.trim().toLowerCase();
        bVal = bVal.trim().toLowerCase();
    
        const isAEmpty = !aVal;
        const isBEmpty = !bVal;
    
        // 🔷 Ascending: empty values last
        if (finalSortOrder === 'ASC') {
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
        attachments = attachments.map(attachment => ({
          ...attachment,
          size_in_mb: attachment.size_in_mb ? `${attachment.size_in_mb} mb` : null
        }));
    
        const allowedFieldsForExport = await this.schemaService.getAllowedExportFields(userId,"notes_view_edit");
            const allowedFieldSet = new Set<string>();
            for (const field of allowedFieldsForExport) {
              if (field.read) {
                allowedFieldSet.add(field.field_desc);
              }
            }
        const labelMap: Record<string, string> = {
          "Note ID": "Note ID",
          "Title": "Title",
          "Note Owner": "Note Owner",
          "Related Entity": "Related Entity",
          "Related To ID": "Related To ID",
          "Related To Name": "Related To Name",
          "Fiscal Year": "Fiscal Year",
          "Document Name": "Document Name",
          "Format": "Format",
          "Size": "Size",
          "Created By": "Created By",
          "Created On": "Created On",
          "Modified By": "Modified By",
          "Modified On": "Modified On",
          "Download": "Download"
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
            notes: attachments,
          }
        };
    
      } catch (error) {
        console.error("getTaskSummary error:", error);
        return {
          statusCode: 500,
          message: 'Failed to fetch notes summary',
          errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
          data: { notes: [] }
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
            { r_number: { [Op.iLike]: `%${search}%` } },
            { descriptions : { [Op.iLike]: `%${search}%` } },
            { title : { [Op.iLike]: `%${search}%` } },
            { attachment_level : { [Op.iLike]: `%${search}%` } }
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
          case 'task_name':
          case 'attachment_level':  
          case 'descriptions':
          case 'attach_to':
          case 'assigned_to':
          case 'r_number':
            switch (operator.toLowerCase()) {
              case 'equals': condition[field] = { [Op.iLike]: value }; break;
              case 'not_equals': condition[field] = { [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }] }; break;          
              case 'contains': condition[field] = { [Op.iLike]: `%${value}%` }; break;
              case 'is_empty': condition[field] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
              case 'in': condition[field] = { [Op.in]: Array.isArray(value) ? value : [value] }; break;
            }
            break;
    
          case 'effective_start_datetime':
            switch (operator.toLowerCase()) {
              case 'equals': {
                const date = new Date(value);
                condition[field] = Sequelize.literal(`DATE("${field}") = DATE('${date.toISOString()}')`);
                break;
              }
              case 'before': {
                const date = new Date(value);
                condition[field] = Sequelize.literal(`DATE("${field}") < DATE('${date.toISOString()}')`);
                break;
              }
              case 'after': {
                const date = new Date(value);
                condition[field] = Sequelize.literal(`DATE("${field}") > DATE('${date.toISOString()}')`);
                break;
              }
              case 'between': {
                if (Array.isArray(value)) {
                  const startDate = new Date(value[0]);
                  const endDate = new Date(value[1]);
                  condition[field] = Sequelize.literal(
                    `DATE("${field}") BETWEEN DATE('${startDate.toISOString()}') AND DATE('${endDate.toISOString()}')`
                  );
                }
                break;
              }
              case 'is_empty': condition[field] = { [Op.is]: null }; break;
            }
            break;

          case 'effective_end_datetime':
            switch (operator.toLowerCase()) {
              case 'equals': {
                const date = new Date(value);
                condition[field] = Sequelize.literal(`DATE("${field}") = DATE('${date.toISOString()}')`);
                break;
              }
              case 'before': {
                const date = new Date(value);
                condition[field] = Sequelize.literal(`DATE("${field}") < DATE('${date.toISOString()}')`);
                break;
              }
              case 'after': {
                const date = new Date(value);
                condition[field] = Sequelize.literal(`DATE("${field}") > DATE('${date.toISOString()}')`);
                break;
              }
              case 'between': {
                if (Array.isArray(value)) {
                  const startDate = new Date(value[0]);
                  const endDate = new Date(value[1]);
                  condition[field] = Sequelize.literal(
                    `DATE("${field}") BETWEEN DATE('${startDate.toISOString()}') AND DATE('${endDate.toISOString()}')`
                  );
                }
                break;
              }
              case 'is_empty': condition[field] = { [Op.is]: null }; break;
            }
            break;

          case 'created_datetime':
            switch (operator.toLowerCase()) {
              case 'equals': {
                const date = new Date(value);
                condition[field] = Sequelize.literal(`DATE("${field}") = DATE('${date.toISOString()}')`);
                break;
              }
              case 'before': {
                const date = new Date(value);
                condition[field] = Sequelize.literal(`DATE("${field}") < DATE('${date.toISOString()}')`);
                break;
              }
              case 'after': {
                const date = new Date(value);
                condition[field] = Sequelize.literal(`DATE("${field}") > DATE('${date.toISOString()}')`);
                break;
              }
              case 'between': {
                if (Array.isArray(value)) {
                  const startDate = new Date(value[0]);
                  const endDate = new Date(value[1]);
                  condition[field] = Sequelize.literal(
                    `DATE("${field}") BETWEEN DATE('${startDate.toISOString()}') AND DATE('${endDate.toISOString()}')`
                  );
                }
                break;
              }
              case 'is_empty': condition[field] = { [Op.is]: null }; break;
            }
            break;

          case 'modified_datetime':
            switch (operator.toLowerCase()) {
              case 'equals': {
                const date = new Date(value);
                condition[field] = Sequelize.literal(`DATE("${field}") = DATE('${date.toISOString()}')`);
                break;
              }
              case 'before': {
                const date = new Date(value);
                condition[field] = Sequelize.literal(`DATE("${field}") < DATE('${date.toISOString()}')`);
                break;
              }
              case 'after': {
                const date = new Date(value);
                condition[field] = Sequelize.literal(`DATE("${field}") > DATE('${date.toISOString()}')`);
                break;
              }
              case 'between': {
                if (Array.isArray(value)) {
                  const startDate = new Date(value[0]);
                  const endDate = new Date(value[1]);
                  condition[field] = Sequelize.literal(
                    `DATE("${field}") BETWEEN DATE('${startDate.toISOString()}') AND DATE('${endDate.toISOString()}')`
                  );
                }
                break;
              }
              case 'is_empty': condition[field] = { [Op.is]: null }; break;
            }
            break;
    
          case 'fiscal_year':  
            switch (operator.toLowerCase()) {
              case 'equals': condition[field] = { [Op.eq]: value }; break;
              case 'not_equals': condition[field] = { [Op.or]: [{ [Op.ne]: value }, { [Op.is]: null }] }; break;          
              case 'in': condition[field] = { [Op.in]: Array.isArray(value) ? value : [value] }; break;
              case 'is_empty': condition[field] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
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

    // Helper method to get display names for attachments
private async getAttachmentDisplayNames(attachments: any[], schemaNumber: string): Promise<any> {
  const displayNames: Record<string, string> = {};
  let parentRid : Record<string, string> = {}
  let currencyRid : Record<string, string> = {}
  for (const attachment of attachments) {
    try {
      switch (attachment.attachment_level) {
        case 'account':
          const account = await this.schemaService.fetchAccountById(attachment.attach_to);
          displayNames[attachment.rid] = account?.account_name || attachment.attach_to;
          parentRid[attachment.attach_to] = ''
          currencyRid[attachment.attach_to] = ''
          break;
        case 'project':
          const project = await this.projectIngestionService.fetchProjectInfoById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = project?.project_code || attachment.attach_to;
          parentRid[attachment.attach_to] =''
          currencyRid[attachment.attach_to] = project?.currency_rid || ''
          break;
        case 'project_resource':
          const projectResource = await this.projectIngestionService.fetchProjectResourceById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (projectResource as { r_number?: string })?.r_number || attachment.attach_to;
          parentRid[attachment.attach_to] = (projectResource as {project_fiscal_rid? : string})?.project_fiscal_rid || ''
          currencyRid[attachment.attach_to] = (projectResource as {currency_rid? : string})?.currency_rid || ''
          break;
        case 'project_task':
          const projectTask = await this.projectIngestionService.fetchProjectTaskById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (projectTask as { r_number?: string })?.r_number || attachment.attach_to;
          parentRid[attachment.attach_to] = (projectTask as {project_fiscal_rid? : string})?.project_fiscal_rid || ''
          currencyRid[attachment.attach_to] = (projectTask as {currency_rid? : string})?.currency_rid || ''
          break;
        case 'resource':
          const resource = await this.projectIngestionService.fetchResourceById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (resource as { resource_code?: string })?.resource_code || attachment.attach_to;
          parentRid[attachment.attach_to] = ''
          currencyRid[attachment.attach_to] = ''
          break;
        case 'resource_cost':
          const resourceCost = await this.projectIngestionService.fetchResourceCostById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (resourceCost as { r_number?: string })?.r_number || attachment.attach_to;
          parentRid[attachment.attach_to] = (resourceCost as {resource_rid? : string})?.resource_rid || attachment.attach_to
          currencyRid[attachment.attach_to] = ''
          break;
        case 'resource_skill': 
          const resourceSkill = await this.projectIngestionService.fetchResourceSkillById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (resourceSkill as { r_number?: string })?.r_number || attachment.attach_to;
          parentRid[attachment.attach_to] = (resourceSkill as {resource_rid? : string})?.resource_rid || ''
          currencyRid[attachment.attach_to] = ''
          break;       
        case 'case': 
          const cases = await this.projectIngestionService.fetchCaseById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (cases as { case_name?: string })?.case_name || attachment.attach_to;
          parentRid[attachment.attach_to] = ''
          currencyRid[attachment.attach_to] = ''
          break;       
        default:
          displayNames[attachment.rid] = attachment.attach_to;
      }
    } catch (err) {
      console.error(`Error fetching display name for attachment ${attachment.rid}:`, err);
      displayNames[attachment.rid] = attachment.attach_to;
    }
  }
  
  return {
    displayNames,
    parentRid,
    currencyRid
  };
}

private mapAttachmentToCommonFormat(at: any, timezone : string) {
  return {
  "Note ID": at.r_number || "-",
  "Title": at.title || "-",
  "Note Owner": at.notes_owner_name || "-",
  "Related Entity": at.attachment_level || "-",
  "Related To ID": at.attach_to || "-",
  "Related To Name": at.attached_to || "-", // added as per labelMap
  "Fiscal Year": `FY-${at.fiscal_year}` || "-",
  "Document Name": at.document_name || "-",
  "Format": at.format || "-",
  "Size": at.size_in_mb || "-",
  "Created By": at.created_by_name || "-",
  "Created On": at.created_datetime
    ? timezone && isValidTimezone(timezone)
    ? moment(at.created_datetime)
        .tz(timezone)
        .format("YYYY-MMM-DD, hh:mm:ss A")
    : moment(at.created_datetime).format(
        "YYYY-MMM-DD, hh:mm:ss A"
      )
  : "-",
  "Modified By": at.modified_by_name || "-",
  "Modified On": at.modified_datetime 
    ? timezone && isValidTimezone(timezone)
    ? moment(at.modified_datetime)
        .tz(timezone)
        .format("YYYY-MMM-DD, hh:mm:ss A")
    : moment(at.modified_datetime).format(
        "YYYY-MMM-DD, hh:mm:ss A"
      )
  : "-",
  "Download": at.browse_file || "-"
};
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

    async getTaskDetailsById (data : IFetchNotesDetailsInput) : Promise<{
    statusCode : number,
    statusMessage : string,
    data : any
  }> {
        const mainDb = await this.fetchMainDb();
        const orgDb = await this.fetchOrgDb();

        const fetchParentAccount : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb))
        if(fetchParentAccount[0].length > 0) {
          let schemaName = rawQueries.fetchSchemaName(fetchParentAccount[0][0].r_number);

          const fetchNotes = await orgDb.query(fetchNotesById(schemaName, data.rid))
          if(fetchNotes[0].length > 0) {
            const fetchActiveStatusId : any = await mainDb.query(fetchActiveStatus())
            const uniqueUserIds = [...new Set(fetchNotes[0].flatMap((d : any) => [d.created_by, d.modified_by, d.notes_owner]))]
            const allUsers = await mainDb.query(fetchUsers(fetchActiveStatusId[0][0].rid, uniqueUserIds))

            const createdUserMap : Map<string, string> = new Map(allUsers[0].map((d : any) => [d.rid, `${d.first_name} ${d.last_name}`]))

            const finalStructuredData = await Promise.all(fetchNotes[0].map(async (n : any) => {
              return {
                ...n,
                created_by_name : createdUserMap.get(n.created_by) || null,
                modified_by_name : createdUserMap.get(n.modified_by) || null,
                notes_owner_name : createdUserMap.get(n.notes_owner) || null,
                browse_file : n.browse_file !== '' && n.browse_file !== null && n.browse_file !== undefined ? await generateSasUrl(n.browse_file) : null,
              }
            }))
            return {
              statusCode : HttpStatus.SUCCESS,
              statusMessage : STATUS_MESSAGE.notesFetchedSuccess,
              data : finalStructuredData[0]
            }
          } else {
            return {
              statusCode : HttpStatus.NOT_FOUND,
              statusMessage : STATUS_MESSAGE.noNotesRecordFound,
              data : {}
            } 
          }
        } else {
          return {
              statusCode : HttpStatus.NOT_FOUND,
              statusMessage : STATUS_MESSAGE.accountNoFound,
              data : {}
            } 
        }
    }

    // async updateNotes (notesData : IUpdateNotesSchema, userId: string, file?: Express.Multer.File, isFileDeleted? : boolean) : Promise<any> {
    //   try {
    //     const sequelize = await initOrgSequelize();
    //     const mainDdSequilze = await initMainDbSequelize();
    //     const { account_rid, attachment_level } = notesData;
    //     const accountData = await this.schemaService.fetchAccountById(account_rid);

    //     if (!accountData) {
    //     throw new Error("Notes updation failed: Invalid account ID");
    //     }

    //     if (accountData.status !== "active") {
    //     throw new Error(
    //         "Notes updation failed: The selected account is inactive. Please choose an active account."
    //     );
    //     }
    //     let accountNumber = accountData.r_number;
    //     if (accountData.is_parent && attachment_level !== "account") {
    //         throw new Error("Notes updation failed: Invalid account ID");
    //     }

    //     if (accountData.storage_type === "store_in_parent") {
    //         accountNumber = await this.schemaService.fetchParentAccount(
    //         accountData.parent_account_rid
    //         );
    //     }
    //     const isExists = await this.schemaService.checkIfSchemaExists(
    //         accountNumber
    //     );

    //     if (!isExists) {
    //         throw new Error("Notes updation failed: schema doesn't exists");
    //     }

    //     const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
    //     const NotesModel = Notes.initialize(sequelize, schemaName)
    //     const NotesTimelineModel = NotesTimeline.initialize(sequelize, schemaName)
    //     const TaskSummaryModel = TaskSummary.initialize(mainDdSequilze)

    //     const isNotesExists = await Notes.findOne({
    //       where : {
    //         rid : notesData.rid
    //       }
    //     })

    //     if(!isNotesExists) {
    //       return {
    //         statusCode: HttpStatus.NOT_FOUND,
    //         message: HttpStatus.NOT_FOUND_MESSAGE,
    //         data: { affectedCount : 0 }
    //     };
    //     } 
    //     else {
    //       let name : string | null = null
    //       let url : string | null = null
    //       let extension : string | null = null
    //       let size : number | null = null
    //       if(isFileDeleted && file == undefined) {
    //         await deleteFromAzureBlob(isNotesExists.browse_file)
    //         name = null
    //         url = null
    //         extension = null
    //         size = null
    //       }
    //       else if(file && !isFileDeleted) {
    //         await deleteFromAzureBlob(isNotesExists.browse_file)
    //         const uploadResult = await uploadToAzureBlob(file, account_rid, "notes");
    //       if(uploadResult.name.length > 100) {
    //         throw new Error("Document name cannot exceed 100 characters");
    //       }  
    //         name = uploadResult.name
    //         url = uploadResult.url
    //         extension = uploadResult.extension
    //         size = uploadResult.size
    //     } else {
    //         name = isNotesExists.document_name
    //         url = isNotesExists.browse_file
    //         extension = isNotesExists.format
    //         size = isNotesExists.size_in_mb
    //     }      
    //     const [affectedCount] = await NotesModel.update({
    //       browse_file: url,
    //       document_name: name,
    //       attach_to: notesData.attach_to,
    //       attachment_level: notesData.attachment_level,
    //       fiscal_year: notesData.fiscal_year,
    //       account_rid: account_rid,
    //       format: extension,
    //       size_in_mb: size,
    //       title: notesData.title,
    //       notes_owner: notesData.notes_owner,
    //       descriptions: notesData.descriptions || null,
    //       modified_by: userId,
    //       modified_datetime : new Date()
    //   }, {
    //     where : {
    //       rid : isNotesExists.rid
    //     }
    //     });
    //     if(affectedCount > 0) {
    //       await NotesTimelineModel.create({
    //           notes_rid : notesData.rid,
    //           document_name: name,
    //           title : notesData.title,
    //           descriptions: notesData.descriptions || null,
    //           notes_owner : notesData.notes_owner,
    //           created_by: userId,
    //           modified_by: userId,
    //           attach_to: notesData.attach_to,
    //           attachment_level: notesData.attachment_level,
    //           event_type: 'ui handler',
    //           event_status: 'success',
    //           event_name: 'update',
    //           event_datetime: new Date(),
    //       })

    //       await TaskSummaryModel.update({
    //           browse_file: url,
    //           document_name: name,
    //           attach_to: notesData.attach_to,
    //           attachment_level: notesData.attachment_level,
    //           fiscal_year: notesData.fiscal_year,
    //           account_rid: account_rid,
    //           format: extension,
    //           size_in_mb: size,
    //           title: notesData.title,
    //           notes_owner : notesData.notes_owner,
    //           descriptions : notesData.descriptions || null,
    //           modified_by : userId,
    //           modified_datetime : new Date()
    //       }, {
    //         where : {
    //           notes_rid : notesData.rid
    //         }
    //       });

    //       return {
    //           statusCode: HttpStatus.SUCCESS,
    //           message: HttpStatus.SUCCESS_MESSAGE,
    //           data: { affectedCount: affectedCount }
    //         };
    //       }
    //     }
    //   }
    //   catch (error) {
    //     console.error('Error updating notes:', error);

    //     return {
    //         statusCode: 500,
    //         message: 'Failed to update Notes',
    //         errorMessage: error instanceof Error ? error.message : 'An unknown error occurred'
    //     };
    //   }
    // }




}