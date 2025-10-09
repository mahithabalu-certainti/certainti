import { Op, Sequelize } from "sequelize";
import { initOrgSequelize } from "../../config/orgDataSource";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { ICreateNotesSchema, IUpdateNotesSchema } from "./notesSchemas";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../../utils/constants";
import { Notes, setupNotesSeq } from "../../models/notes";
import { NotesTimeline, setupNotesTimelineSequence } from "../../models/notesTimeline";
import { NotesSummary } from "../../models/notesSummary";
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

export class NotesService {
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

    async createNotes (notesData : ICreateNotesSchema, userId: string, file: Express.Multer.File) {
        try {
        const { account_rid, attachment_level } = notesData;
        const accountData = await this.schemaService.fetchAccountById(account_rid);

        if (!accountData) {
        throw new Error("Notes creation failed: Invalid account ID");
        }

        if (accountData.status !== "active") {
        throw new Error(
            "Notes creation failed: The selected account is inactive. Please choose an active account."
        );
        }
        let accountNumber = accountData.r_number;
        if (accountData.is_parent && attachment_level !== "account") {
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
            throw new Error("Attachment creation failed: schema doesn't exists");
        }

        await this.createNotesTables(accountNumber)

        const { url, name, extension, size } = await uploadToAzureBlob(file, account_rid, "notes");        
        if(name.length > 100) {
            throw new Error("Document name cannot exceed 100 characters");
        }

        const notesModel = await Notes.create({
            browse_file: url,
            document_name: name,
            attach_to: notesData.attach_to,
            attachment_level: notesData.attachment_level,
            fiscal_year: notesData.fiscal_year,
            account_rid: account_rid,
            format: extension,
            size_in_mb: size,
            title: notesData.title,
            notes_owner: notesData.notes_owner,
            descriptions: notesData.descriptions || null,
            created_by: userId,
        });

        await NotesTimeline.create({
            notes_rid : notesModel.rid,
            document_name: notesModel.document_name,
            title : notesModel.title,
            descriptions: notesModel.descriptions || null,
            notes_owner : notesModel.notes_owner,
            created_by: userId,
            modified_by: userId,
            attach_to: notesModel.attach_to,
            attachment_level: notesModel.attachment_level,
            event_type: 'ui handler',
            event_status: 'success',
            event_name: 'create',
            event_datetime: new Date(),
        })

        await NotesSummary.create({
            r_number: notesModel.r_number,
            browse_file: notesModel.browse_file,
            document_name: notesModel.document_name,
            notes_rid: notesModel.rid,
            attach_to: notesModel.attach_to,
            attachment_level: notesModel.attachment_level,
            fiscal_year: notesModel.fiscal_year,
            account_rid: account_rid,
            format: extension,
            size_in_mb: size,
            title: notesModel.title,
            notes_owner : notesModel.notes_owner,
            descriptions : notesModel.descriptions || null,
            created_by: userId,
        });

        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: { notes: notesModel }
        };
        }
        catch (error) {
        console.error('Error creating attachment:', error);
        return {
            statusCode: 500,
            message: 'Failed to create Notes',
            errorMessage: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
    }

    async createNotesTables(accountNumber: string) {
    try {
        const orgDbSequlize = await initOrgSequelize();
        const mainDbSequlize = await initMainDbSequelize();
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(/\D/g, '')}`;
        
        const NotesModel = await Notes.initialize(
        orgDbSequlize,
        schemaName
        );

        const NotesTimelineModel = await NotesTimeline.initialize(
        orgDbSequlize,
        schemaName
        );

        const NotesSummaryModel = NotesSummary.initialize(mainDbSequlize);

        await NotesModel.sync({ force: false });
        await NotesTimelineModel.sync({ force: false });
        await NotesSummaryModel.sync({ force: false });

        await setupNotesSeq(orgDbSequlize, schemaName);
        await setupNotesTimelineSequence(orgDbSequlize, schemaName);
        
    } catch (err) {
        return this.throwServiceError(err as Error);
    }
    }

    async getNotes(
      userId: string,
      attachmentLevel?: string,
      entityId?: string,
      accountRid?: string,
      page: number = 1,
      limit: number = 10,
      search?: string,
      filters: Record<string, any> = {},
      sortBy: string = 'created_datetime',
      sortOrder: string = 'DESC',
      fiscalYear: number = 0,
      graphqlData? : any
    ): Promise<{
      statusCode: number;
      message: string;
      errorMessage?: string;
      data?: { notes: any[]; totalCount: number };
    }> {
      try {
        if (!accountRid) throw new Error("Account RID is required");
    
        const orgDbSequelize = await initOrgSequelize();
        if (!orgDbSequelize) throw new Error("Failed to initialize database connection");
    
        const accountData = await this.schemaService.fetchAccountById(accountRid);
        if (!accountData) throw new Error("Invalid account ID");
    
        let schemaNumber = accountData.r_number;
        if (accountData.storage_type === "store_in_parent") {
          schemaNumber = await this.schemaService.fetchParentAccount(accountData.parent_account_rid);
        }
    
        const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(/\D/g, '')}`;
        const NotesModel = Notes.initialize(orgDbSequelize, schemaName);
    
        let allNotes: any[] = [];
    
        // Handle attached_to and uploaded_by filters separately
        let attachedToFilter;
        let createdByFilter;
        let modifiedByFilter;
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
          if(graphqlData?.notes_rid) {
            console.log("Doc Id : ", graphqlData.notes_rid)
            where = {
              rid : graphqlData.notes_rid,
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
        const fetchResourceCostSkillAttachmentsBulk = async (model: any, resourceIds: string[]) => {
          let resourceCostSkillAttachments: any[] = [];
          if (resourceIds.length === 0) return resourceCostSkillAttachments;
    
          // 🔹 Fetch all resource_costs in one call
          const resourceCosts = await this.resourceCostService.getResourceCostsByResourceIds(schemaNumber, resourceIds);
          const allResourceCostIds = resourceCosts.map(rc => rc.rid);
          if (allResourceCostIds.length > 0) {
            const resourceCostAttachments = await fetchAttachments(model, 'resource_cost', allResourceCostIds);
            resourceCostSkillAttachments.push(...resourceCostAttachments);
          }
    
          // 🔹 Fetch all resource_skills in one call
          const resourceSkills = await this.resourceSkillService.getResourceSkillsByResourceIds(schemaNumber, resourceIds);
          const allResourceSkillIds = resourceSkills.map(rs => rs.rid);
          if (allResourceSkillIds.length > 0) {
            const resourceSkillAttachments = await fetchAttachments(model, 'resource_skill', allResourceSkillIds);
            resourceCostSkillAttachments.push(...resourceSkillAttachments);
          }
    
          return resourceCostSkillAttachments;
        };
    
        // 🔷 Optimized project resource + task attachments fetch for multiple projects
        const fetchProjectResourceTaskAttachmentsBulk = async (model: any, projectIds: string[]) => {
          let projectChildAttachments: any[] = [];
          if (projectIds.length === 0) return projectChildAttachments;
    
          // 🔹 Fetch all project_resources under projects in one call
          const projectResources = await this.projectIngestionService.getProjectResourcesByProjectIds(schemaNumber, projectIds);
          const projectResourceIds = projectResources.map(r => r.rid);
    
          if (projectResourceIds.length > 0) {
            const projectResourceAttachments = await fetchAttachments(model, 'project_resource', projectResourceIds);
            projectChildAttachments.push(...projectResourceAttachments);
          }
            
            // 🔹 Fetch all project_tasks under projects in one call
            const projectTasks = await this.projectIngestionService.getProjectTasksByProjectIds(schemaNumber, projectIds);
            const projectTaskIds = projectTasks.map(t => t.rid);
    
            if (projectTaskIds.length > 0) {
              const projectTaskAttachments = await fetchAttachments(model, 'project_task', projectTaskIds);
              projectChildAttachments.push(...projectTaskAttachments);
            }
    
          return projectChildAttachments;
        };
    
        // 🔷 Non-parent account logic with batched optimized fetches
        if (attachmentLevel === 'account' && entityId) {
          const accountAttachments = await fetchAttachments(NotesModel, 'account', [entityId]);
          allNotes.push(...accountAttachments);
    
          const projects = await this.projectIngestionService.getProjectsByAccountId(schemaNumber, entityId);
          const projectIds = projects.map(p => p.rid);
          if (projectIds.length > 0) {
            const projectAttachments = await fetchAttachments(NotesModel, 'project', projectIds);
            allNotes.push(...projectAttachments);
    
            const projectChildAttachments = await fetchProjectResourceTaskAttachmentsBulk(NotesModel, projectIds);
            allNotes.push(...projectChildAttachments);
          }
    
          const resources = await this.resourceService.getResourcesByAccountId(schemaNumber, entityId);
          const resourceIds = resources.map(r => (r as { rid: string }).rid);
          if (resourceIds.length > 0) {
            const resourceAttachments = await fetchAttachments(NotesModel, 'resource', resourceIds);
            allNotes.push(...resourceAttachments);
    
            const resourceCostSkillAttachments = await fetchResourceCostSkillAttachmentsBulk(NotesModel, resourceIds);
            allNotes.push(...resourceCostSkillAttachments);
          }
        }
    
        // 🔷 Project logic
        else if (attachmentLevel === 'project' && entityId) {
          const projectAttachments = await fetchAttachments(NotesModel, 'project', [entityId]);
          allNotes.push(...projectAttachments);
    
          const projectChildAttachments = await fetchProjectResourceTaskAttachmentsBulk(NotesModel, [entityId]);
          allNotes.push(...projectChildAttachments);
        }
    
        // 🔷 Project_resource logic
        else if (attachmentLevel === 'project_resource' && entityId) {
          const projectResourceAttachments = await fetchAttachments(NotesModel, 'project_resource', [entityId]);
          allNotes.push(...projectResourceAttachments);
    
          const projectResource = await this.projectIngestionService.fetchProjectResourceById(schemaNumber, entityId);
          const projectTasks = await this.projectIngestionService.getProjectTasksByProjectIds(schemaNumber, [(projectResource as any)?.project_fiscal_rid]);
          const projectTaskIds = projectTasks.map(t => t.rid);
          if (projectTaskIds.length > 0) {
            const projectTaskAttachments = await fetchAttachments(NotesModel, 'project_task', projectTaskIds);
            allNotes.push(...projectTaskAttachments);
          }
        }
    
        // 🔷 Resource logic
        else if (attachmentLevel === 'resource' && entityId) {
          const resourceAttachments = await fetchAttachments(NotesModel, 'resource', [entityId]);
          allNotes.push(...resourceAttachments);
    
          const resourceCostSkillAttachments = await fetchResourceCostSkillAttachmentsBulk(NotesModel, [entityId]);
          allNotes.push(...resourceCostSkillAttachments);
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
            const result = await NotesModel.findAll({ where: whereClause });
            allNotes.push(...result);
          } catch (error) {
            console.error('Error fetching attachments:', error);
            throw new Error('Failed to fetch attachments');
          }
        }
    
        // 🔷 Fetch display names
        if(graphqlData?.notes_rid) {
          allNotes = allNotes.filter((d : any) => d != null)
        }
        const attachmentDisplayNames = await this.getAttachmentDisplayNames(allNotes, schemaNumber);
    
        // 🔷 Apply attached_to filter if present
        if (attachedToFilter) {
          allNotes = allNotes.filter(attachment => {
            let displayName = attachmentDisplayNames[attachment.rid] || String(attachment.attach_to) || '';
            const displayValue = displayName.toLowerCase();
            const operator = Object.keys(attachedToFilter)[0];
            const filterValue = (attachedToFilter[operator] || '').toLowerCase();
            switch (operator) {
              case 'contains': return displayValue.includes(filterValue);
              case 'equals': return displayValue === filterValue;
              case 'not_equals': return displayValue !== filterValue || displayValue === null;
              default: return false;
            }
          });
        }
    
        // 🔷 Sort
        const validSortFields = ['document_name', 'title', 'notes_owner', 'r_number', 'format', 'attachment_level', 'size_in_mb', 'attached_to', 'created_datetime', 'descriptions', 'created_by_name', 'fiscal_year', 'modified_by_name', 'modified_datetime'];
        const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_datetime';
        const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
        allNotes.sort((a, b) => {
          // Special handling for created_datetime
          if (finalSortBy === 'created_datetime') {
            const aDate = new Date(a[finalSortBy]).getTime();
            const bDate = new Date(b[finalSortBy]).getTime();
            return finalSortOrder === 'ASC' ? aDate - bDate : bDate - aDate;
          }
    
          let aVal = finalSortBy === 'attached_to' ? (attachmentDisplayNames[a.rid] ?? '') : (a[finalSortBy] ?? '');
          let bVal = finalSortBy === 'attached_to' ? (attachmentDisplayNames[b.rid] ?? '') : (b[finalSortBy] ?? '');
    
          // Convert to string safely
          aVal = typeof aVal === 'string' ? aVal.toLowerCase() : String(aVal).toLowerCase();
          bVal = typeof bVal === 'string' ? bVal.toLowerCase() : String(bVal).toLowerCase();
    
          const aEmpty = !aVal || aVal.trim() === '';
          const bEmpty = !bVal || bVal.trim() === '';
    
          if (aEmpty && bEmpty) return 0; // Both empty – equal
          if (aEmpty) return finalSortOrder === 'ASC' ? 1 : -1; // a empty comes last in ASC, first in DESC
          if (bEmpty) return finalSortOrder === 'ASC' ? -1 : 1; // b empty comes last in ASC, first in DESC
    
          // Both non-empty, normal comparison
          return finalSortOrder === 'ASC' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
        const paginatedAttachments = allNotes
    
        // 🔷 Map document types and users
        const userIds = [...new Set(paginatedAttachments.flatMap(att => [att.created_by,att.modified_by]))];
    
        const mainSequelize = await initMainDbSequelize();
        const [users] = await Promise.all([
          userIds.length > 0 ? mainSequelize.query(
            `SELECT rid, CONCAT(first_name, ' ', last_name) as full_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (:userIds)`,
            { replacements: { userIds }, type: 'SELECT' }
          ) : Promise.resolve([]),
        ]);
    
        const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));

        // 🔷 Map final results
        let notes = await Promise.all(paginatedAttachments.map(async attachment => ({
          ...attachment.get({ plain: true }),
          created_by_name: userMap.get(attachment.created_by) || attachment.created_by,
          modified_by_name: userMap.get(attachment.modified_by) || attachment.modified_by,
          attached_to: attachmentDisplayNames[attachment.rid] || attachment.attach_to,
          browse_file : await generateSasUrl(attachment.browse_file)
        })));
    
        // Handle uploaded_by sorting
        if (sortBy === 'created_by_name') {
          notes.sort((a, b) => {
            const aType = a.created_by_name || '';
            const bType = b.created_by_name || '';
            const aEmpty = !aType || aType.trim() === '';
            const bEmpty = !bType || bType.trim() === '';
            
            if (aEmpty && bEmpty) return 0;
            if (aEmpty) return finalSortOrder === 'ASC' ? 1 : -1;
            if (bEmpty) return finalSortOrder === 'ASC' ? -1 : 1;
            
            return finalSortOrder === 'ASC' ? 
              aType.localeCompare(bType) : 
              bType.localeCompare(aType);
          });
        }

        if (sortBy === 'modified_by_name') {
          notes.sort((a, b) => {
            const aType = a.modified_by_name || '';
            const bType = b.modified_by_name || '';
            const aEmpty = !aType || aType.trim() === '';
            const bEmpty = !bType || bType.trim() === '';
            
            if (aEmpty && bEmpty) return 0;
            if (aEmpty) return finalSortOrder === 'ASC' ? 1 : -1;
            if (bEmpty) return finalSortOrder === 'ASC' ? -1 : 1;
            
            return finalSortOrder === 'ASC' ? 
              aType.localeCompare(bType) : 
              bType.localeCompare(aType);
          });
        }
        // Apply uploaded_by filter if present
        if (createdByFilter) {
          let filterValue;
            notes = notes.filter(notes => {
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
            notes = notes.filter(notes => {
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
    
        // Add "mb" suffix to size values for attachments
          notes = notes.map(notes => ({
          ...notes,
          size_in_mb: notes.size_in_mb ? `${notes.size_in_mb} mb` : null
          }));
          const totalCount = notes.length;
          notes = notes.slice((page - 1) * limit, page * limit);
    
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: { notes, totalCount }
        };
    
      } catch (error) {
        console.error("getAttachments error:", error);
        return {
          statusCode: 500,
          message: 'Failed to fetch attachments',
          errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
          data: { notes: [], totalCount: 0 }
        };
      }
    }

    async exportNotes(
      userId: string,
      attachmentLevel?: string,
      entityId?: string,
      accountRid?: string,
      search?: string,
      filters: Record<string, any> = {},
      sortBy: string = 'created_datetime',
      sortOrder: string = 'DESC',
      fiscalYear: number = 0,
      graphqlData? : any
    ): Promise<{
      statusCode: number;
      message: string;
      errorMessage?: string;
      data?: { notes: any[] };
    }> {
      try {
        if (!accountRid) throw new Error("Account RID is required");
    
        const orgDbSequelize = await initOrgSequelize();
        if (!orgDbSequelize) throw new Error("Failed to initialize database connection");
    
        const accountData = await this.schemaService.fetchAccountById(accountRid);
        if (!accountData) throw new Error("Invalid account ID");
    
        let schemaNumber = accountData.r_number;
        if (accountData.storage_type === "store_in_parent") {
          schemaNumber = await this.schemaService.fetchParentAccount(accountData.parent_account_rid);
        }
    
        const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(/\D/g, '')}`;
        const NotesModel = Notes.initialize(orgDbSequelize, schemaName);
    
        let allNotes: any[] = [];
    
        // Handle attached_to and uploaded_by filters separately
        let attachedToFilter;
        let createdByFilter;
        let modifiedByFilter;
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
            console.log("Doc Id : ", graphqlData.document_rid)
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
        const fetchResourceCostSkillAttachmentsBulk = async (model: any, resourceIds: string[]) => {
          let resourceCostSkillAttachments: any[] = [];
          if (resourceIds.length === 0) return resourceCostSkillAttachments;
    
          // 🔹 Fetch all resource_costs in one call
          const resourceCosts = await this.resourceCostService.getResourceCostsByResourceIds(schemaNumber, resourceIds);
          const allResourceCostIds = resourceCosts.map(rc => rc.rid);
          if (allResourceCostIds.length > 0) {
            const resourceCostAttachments = await fetchAttachments(model, 'resource_cost', allResourceCostIds);
            resourceCostSkillAttachments.push(...resourceCostAttachments);
          }
        
          // 🔹 Fetch all resource_skills in one call
          const resourceSkills = await this.resourceSkillService.getResourceSkillsByResourceIds(schemaNumber, resourceIds);
          const allResourceSkillIds = resourceSkills.map(rs => rs.rid);
          if (allResourceSkillIds.length > 0) {
            const resourceSkillAttachments = await fetchAttachments(model, 'resource_skill', allResourceSkillIds);
            resourceCostSkillAttachments.push(...resourceSkillAttachments);
          }
    
          return resourceCostSkillAttachments;
        };
    
        // 🔷 Optimized project resource + task attachments fetch for multiple projects
        const fetchProjectResourceTaskAttachmentsBulk = async (model: any, projectIds: string[]) => {
          let projectChildAttachments: any[] = [];
          if (projectIds.length === 0) return projectChildAttachments;
    
          // 🔹 Fetch all project_resources under projects in one call
          const projectResources = await this.projectIngestionService.getProjectResourcesByProjectIds(schemaNumber, projectIds);
          const projectResourceIds = projectResources.map(r => r.rid);
    
          if (projectResourceIds.length > 0) {
            const projectResourceAttachments = await fetchAttachments(model, 'project_resource', projectResourceIds);
            projectChildAttachments.push(...projectResourceAttachments);
          }
    
            // 🔹 Fetch all project_tasks under projects in one call
            const projectTasks = await this.projectIngestionService.getProjectTasksByProjectIds(schemaNumber, projectIds);
            const projectTaskIds = projectTasks.map(t => t.rid);
    
            if (projectTaskIds.length > 0) {
              const projectTaskAttachments = await fetchAttachments(model, 'project_task', projectTaskIds);
              projectChildAttachments.push(...projectTaskAttachments);
            }
            return projectChildAttachments;
          };
    
        // 🔷 Non-parent account logic with batched optimized fetches
        if (attachmentLevel === 'account' && entityId) {
          const accountAttachments = await fetchAttachments(NotesModel, 'account', [entityId]);
          allNotes.push(...accountAttachments);
    
          const projects = await this.projectIngestionService.getProjectsByAccountId(schemaNumber, entityId);
          const projectIds = projects.map(p => p.rid);
          if (projectIds.length > 0) {
            const projectAttachments = await fetchAttachments(NotesModel, 'project', projectIds);
            allNotes.push(...projectAttachments);
    
            const projectChildAttachments = await fetchProjectResourceTaskAttachmentsBulk(NotesModel, projectIds);
            allNotes.push(...projectChildAttachments);
          }
    
          const resources = await this.resourceService.getResourcesByAccountId(schemaNumber, entityId);
          const resourceIds = resources.map(r => (r as { rid: string }).rid);
          if (resourceIds.length > 0) {
            const resourceAttachments = await fetchAttachments(NotesModel, 'resource', resourceIds);
            allNotes.push(...resourceAttachments);
    
            const resourceCostSkillAttachments = await fetchResourceCostSkillAttachmentsBulk(NotesModel, resourceIds);
            allNotes.push(...resourceCostSkillAttachments);
          }
        }
    
        // 🔷 Project logic
        else if (attachmentLevel === 'project' && entityId) {
          const projectAttachments = await fetchAttachments(NotesModel, 'project', [entityId]);
          allNotes.push(...projectAttachments);
    
          const projectChildAttachments = await fetchProjectResourceTaskAttachmentsBulk(NotesModel, [entityId]);
          allNotes.push(...projectChildAttachments);
        }
    
        // 🔷 Project_resource logic
        else if (attachmentLevel === 'project_resource' && entityId) {
          const projectResourceAttachments = await fetchAttachments(NotesModel, 'project_resource', [entityId]);
          allNotes.push(...projectResourceAttachments);
          const projectResource = await this.projectIngestionService.fetchProjectResourceById(schemaNumber, entityId);
          const projectTasks = await this.projectIngestionService.getProjectTasksByProjectIds(schemaNumber, [(projectResource as any)?.project_fiscal_rid]);
          const projectTaskIds = projectTasks.map(t => t.rid);
          if (projectTaskIds.length > 0) {
            const projectTaskAttachments = await fetchAttachments(NotesModel, 'project_task', projectTaskIds);
            allNotes.push(...projectTaskAttachments);
          }
        }
    
        // 🔷 Resource logic
        else if (attachmentLevel === 'resource' && entityId) {
          const resourceAttachments = await fetchAttachments(NotesModel, 'resource', [entityId]);
          allNotes.push(...resourceAttachments);
    
          const resourceCostSkillAttachments = await fetchResourceCostSkillAttachmentsBulk(NotesModel, [entityId]);
          allNotes.push(...resourceCostSkillAttachments);
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
            const result = await NotesModel.findAll({ where: whereClause });
            allNotes.push(...result);
          } catch (error) {
            console.error('Error fetching Notes:', error);
            throw new Error('Failed to fetch Notes');
          }
        }
    
        // 🔷 Fetch display names
        if(graphqlData?.document_rid) {
          allNotes = allNotes.filter((d : any) => d != null)
        }
        const attachmentDisplayNames = await this.getAttachmentDisplayNames(allNotes, schemaNumber);
    
        // 🔷 Apply attached_to filter if present
        if (attachedToFilter) {
          allNotes = allNotes.filter(attachment => {
            let displayName = attachmentDisplayNames[attachment.rid] || String(attachment.attach_to) || '';
            const displayValue = displayName.toLowerCase();
            const operator = Object.keys(attachedToFilter)[0];
            const filterValue = (attachedToFilter[operator] || '').toLowerCase();
            switch (operator) {
              case 'contains': return displayValue.includes(filterValue);
              case 'equals': return displayValue === filterValue;
              case 'not_equals': return displayValue !== filterValue || displayValue === null;
              default: return false;
            }
          });
        }
    
        // 🔷 Sort
        const validSortFields = ['document_name', 'title', 'notes_owner', 'r_number', 'format', 'attachment_level', 'size_in_mb', 'attached_to', 'descriptions', 'created_by_name', 'created_datetime', 'fiscal_year', 'modified_by_name','modified_datetime'];
        const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_datetime';
        const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
        allNotes.sort((a, b) => {
          // Special handling for created_datetime
          if (finalSortBy === 'created_datetime') {
            const aDate = new Date(a[finalSortBy]).getTime();
            const bDate = new Date(b[finalSortBy]).getTime();
            return finalSortOrder === 'ASC' ? aDate - bDate : bDate - aDate;
          }
    
          let aVal = finalSortBy === 'attached_to' ? (attachmentDisplayNames[a.rid] ?? '') : (a[finalSortBy] ?? '');
          let bVal = finalSortBy === 'attached_to' ? (attachmentDisplayNames[b.rid] ?? '') : (b[finalSortBy] ?? '');
    
          // Convert to string safely
          aVal = typeof aVal === 'string' ? aVal.toLowerCase() : String(aVal).toLowerCase();
          bVal = typeof bVal === 'string' ? bVal.toLowerCase() : String(bVal).toLowerCase();
    
          const aEmpty = !aVal || aVal.trim() === '';
          const bEmpty = !bVal || bVal.trim() === '';
    
          if (aEmpty && bEmpty) return 0; // Both empty – equal
          if (aEmpty) return finalSortOrder === 'ASC' ? 1 : -1; // a empty comes last in ASC, first in DESC
          if (bEmpty) return finalSortOrder === 'ASC' ? -1 : 1; // b empty comes last in ASC, first in DESC
    
          // Both non-empty, normal comparison
          return finalSortOrder === 'ASC' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
        const userIds = [...new Set(allNotes.flatMap(att => [att.created_by, att.modified_by]))];
    
        const mainSequelize = await initMainDbSequelize();
        const [users] = await Promise.all([
          userIds.length > 0 ? mainSequelize.query(
            `SELECT rid, CONCAT(first_name, ' ', last_name) as full_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (:userIds)`,
            { replacements: { userIds }, type: 'SELECT' }
          ) : Promise.resolve([]),
        ]);

        const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));
    
        // 🔷 Map final results
        let notes = await Promise.all(allNotes.map(async attachment => ({
          ...attachment.get({ plain: true }),
          created_by_name: userMap.get(attachment.created_by) || attachment.created_by,
          modified_by_name: userMap.get(attachment.modified_by) || attachment.modified_by,
          attached_to: attachmentDisplayNames[attachment.rid] || attachment.attach_to,
          browse_file : await generateSasUrl(attachment.browse_file)
        })));
    
        // Handle uploaded_by sorting
        if (sortBy === 'created_by_name') {
          notes.sort((a, b) => {
            const aType = a.created_by_name || '';
            const bType = b.created_by_name || '';
            const aEmpty = !aType || aType.trim() === '';
            const bEmpty = !bType || bType.trim() === '';
            
            if (aEmpty && bEmpty) return 0;
            if (aEmpty) return finalSortOrder === 'ASC' ? 1 : -1;
            if (bEmpty) return finalSortOrder === 'ASC' ? -1 : 1;
            
            return finalSortOrder === 'ASC' ? 
              aType.localeCompare(bType) : 
              bType.localeCompare(aType);
          });
        }
        if (sortBy === 'modified_by_name') {
          notes.sort((a, b) => {
            const aType = a.modified_by_name || '';
            const bType = b.modified_by_name || '';
            const aEmpty = !aType || aType.trim() === '';
            const bEmpty = !bType || bType.trim() === '';
            
            if (aEmpty && bEmpty) return 0;
            if (aEmpty) return finalSortOrder === 'ASC' ? 1 : -1;
            if (bEmpty) return finalSortOrder === 'ASC' ? -1 : 1;
            
            return finalSortOrder === 'ASC' ? 
              aType.localeCompare(bType) : 
              bType.localeCompare(aType);
          });
        }
         
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
        // Apply uploaded_by filter if present
         if (createdByFilter) {
          let filterValue;
            notes = notes.filter(notes => {
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
            notes = notes.filter(notes => {
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
    
        // Add "mb" suffix to size values for attachments
           notes = notes.map(notes => ({
            ...notes,
            size_in_mb: notes.size_in_mb ? `${notes.size_in_mb} mb` : null
          }));
    
        notes = notes.map((at) => {
        const rawMapped = this.mapAttachmentToCommonFormat(at); // with internal keys
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
          data: { notes }
        };
    
      } catch (error) {
        console.error("getNotes error:", error);
        return {
          statusCode: 500,
          message: 'Failed to fetch notes',
          errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
          data: { notes: [] }
        };
      }
    }

    async getNotesSummary(
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
    
        const NotesSummaryModel = NotesSummary.initialize(mainSequelize);
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
    
        let attachedToFilter, createdByFilter, modifiedByFilter;
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
    
        const attachmentsRaw = await NotesSummaryModel.findAll({ where: whereClause });
    
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
            const displayNames = await this.getAttachmentDisplayNames(attachments, schemaNumber);
            Object.assign(attachmentDisplayNames, displayNames);
          })
        );
    
        // Map enriched data
        const userIds = [...new Set(attachmentsRaw.flatMap(att => [att.created_by, att.modified_by]))];
    
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
          browse_file: await generateSasUrl(att.browse_file)
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
        const validSortFields = ['document_name', 'title', 'notes_owner', 'r_number', 'format', 'attachment_level', 'size_in_mb', 'attached_to', 'descriptions', 'created_by_name', 'created_datetime', 'fiscal_year', 'modified_by_name', 'modified_datetime'];
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
        console.error("getNotesSummary error:", error);
        return {
          statusCode: 500,
          message: 'Failed to fetch notes summary',
          errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
          data: { notes: [], totalCount: 0 }
        };
      }
    }

    async exportNotesSummary(
      userId: string,
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
      data?: { notes: any[] };
    }> {
      try {
        const mainSequelize = await initMainDbSequelize();
        if (!mainSequelize) throw new Error("Failed to initialize main DB connection");
    
        const AttachmentSummaryModel = NotesSummary.initialize(mainSequelize);
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
    
        let attachedToFilter, createdByFilter, modifiedByFilter;
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
            const displayNames = await this.getAttachmentDisplayNames(attachments, schemaNumber);
            Object.assign(attachmentDisplayNames, displayNames);
          })
        );
    
        // Map enriched data
        const userIds = [...new Set(attachmentsRaw.flatMap(att => [att.created_by, att.modified_by]))];
    
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
          browse_file: await generateSasUrl(att.browse_file)
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
        const validSortFields = ['document_name', 'title', 'notes_owner', 'r_number', 'format', 'attachment_level', 'size_in_mb', 'attached_to', 'descriptions', 'created_by_name', 'created_datetime', 'fiscal_year', 'modified_by_name', 'modified_datetime'];
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
        const rawMapped = this.mapAttachmentToCommonFormat(at); // with internal keys
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
        console.error("getNotesSummary error:", error);
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
            { notes_owner : { [Op.iLike]: `%${search}%` } },
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
          case 'size_in_mb':
            switch (operator.toLowerCase()) {
              case 'equals': condition[field] = { [Op.eq]: Number(value) }; break;
              case 'not_equals': condition[field] = { [Op.or]: [{ [Op.ne]: Number(value) }, { [Op.is]: null }] }; break;
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
          case 'descriptions':
          case 'attached_to':
          case 'attach_to':
          case 'r_number':
          case 'title':
          case 'notes_owner':
            switch (operator.toLowerCase()) {
              case 'equals': condition[field] = { [Op.iLike]: value }; break;
              case 'not_equals': condition[field] = { [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }] }; break;          
              case 'contains': condition[field] = { [Op.iLike]: `%${value}%` }; break;
              case 'is_empty': condition[field] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
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
private async getAttachmentDisplayNames(attachments: any[], schemaNumber: string): Promise<Record<string, string>> {
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

private mapAttachmentToCommonFormat(at: any) {
  return {
  "Note ID": at.r_number || "-",
  "Title": at.title || "-",
  "Note Owner": at.notes_owner || "-",
  "Related Entity": at.attachment_level || "-",
  "Related To ID": at.attached_to || "-",
  "Related To Name": at.related_to_name || "-", // added as per labelMap
  "Fiscal Year": at.fiscal_year || "-",
  "Document Name": at.document_name || "-",
  "Format": at.format || "-",
  "Size": at.size_in_mb || "-",
  "Created By": at.created_by_name || "-",
  "Created On": at.created_datetime ? moment(at.created_datetime).format("YYYY-MMM-DD") : "-",
  "Modified By": at.modified_by_name || "-",
  "Modified On": at.modified_datetime ? moment(at.modified_datetime).format("YYYY-MMM-DD") : "-",
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

    async getNotesDetailsById (data : IFetchNotesDetailsInput) : Promise<{
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
            const uniqueUserIds = [...new Set(fetchNotes[0].flatMap((d : any) => [d.created_by, d.modified_by]))]
            const allUsers = await mainDb.query(fetchUsers(fetchActiveStatusId[0][0].rid, uniqueUserIds))

            const createdUserMap : Map<string, string> = new Map(allUsers[0].map((d : any) => [d.rid, `${d.first_name} ${d.last_name}`]))

            const finalStructuredData = await Promise.all(fetchNotes[0].map(async (n : any) => {
              return {
                ...n,
                created_by_name : createdUserMap.get(n.created_by) || null,
                modified_by_name : createdUserMap.get(n.modified_by) || null,
                browse_file : await generateSasUrl(n.browse_file)
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

    async updateNotes (notesData : IUpdateNotesSchema, userId: string, file?: Express.Multer.File) : Promise<any> {
      try {
        const sequelize = await initOrgSequelize();
        const mainDdSequilze = await initMainDbSequelize();
        const { account_rid, attachment_level } = notesData;
        const accountData = await this.schemaService.fetchAccountById(account_rid);

        if (!accountData) {
        throw new Error("Notes updation failed: Invalid account ID");
        }

        if (accountData.status !== "active") {
        throw new Error(
            "Notes updation failed: The selected account is inactive. Please choose an active account."
        );
        }
        let accountNumber = accountData.r_number;
        if (accountData.is_parent && attachment_level !== "account") {
            throw new Error("Notes updation failed: Invalid account ID");
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
            throw new Error("Notes updation failed: schema doesn't exists");
        }

        const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
        const NotesModel = Notes.initialize(sequelize, schemaName)
        const NotesTimelineModel = NotesTimeline.initialize(sequelize, schemaName)
        const NotesSummaryModel = NotesSummary.initialize(mainDdSequilze)

        const isNotesExists = await Notes.findOne({
          where : {
            rid : notesData.rid
          }
        })

        if(!isNotesExists) {
          return {
            statusCode: HttpStatus.NOT_FOUND,
            message: HttpStatus.NOT_FOUND_MESSAGE,
            data: { affectedCount : 0 }
        };
        } 
        else {
          let name : string = ``
          let url : string = ``
          let extension : string = ``
          let size : number = 0
          if(file) {
            await deleteFromAzureBlob(isNotesExists.browse_file)
            const uploadResult = await uploadToAzureBlob(file, account_rid, "notes");
          if(uploadResult.name.length > 100) {
            throw new Error("Document name cannot exceed 100 characters");
          }  
            name = uploadResult.name
            url = uploadResult.url
            extension = uploadResult.extension
            size = uploadResult.size
        } else {
            name = isNotesExists.document_name
            url = isNotesExists.browse_file
            extension = isNotesExists.format
            size = isNotesExists.size_in_mb
        }      
        const [affectedCount] = await NotesModel.update({
          browse_file: url,
          document_name: name,
          attach_to: notesData.attach_to,
          attachment_level: notesData.attachment_level,
          fiscal_year: notesData.fiscal_year,
          account_rid: account_rid,
          format: extension,
          size_in_mb: size,
          title: notesData.title,
          notes_owner: notesData.notes_owner,
          descriptions: notesData.descriptions || null,
          modified_by: userId,
          modified_datetime : new Date()
      }, {
        where : {
          rid : isNotesExists.rid
        }
        });
        if(affectedCount > 0) {
          await NotesTimelineModel.create({
              notes_rid : notesData.rid,
              document_name: name,
              title : notesData.title,
              descriptions: notesData.descriptions || null,
              notes_owner : notesData.notes_owner,
              created_by: userId,
              modified_by: userId,
              attach_to: notesData.attach_to,
              attachment_level: notesData.attachment_level,
              event_type: 'ui handler',
              event_status: 'success',
              event_name: 'update',
              event_datetime: new Date(),
          })

          await NotesSummaryModel.update({
              browse_file: url,
              document_name: name,
              attach_to: notesData.attach_to,
              attachment_level: notesData.attachment_level,
              fiscal_year: notesData.fiscal_year,
              account_rid: account_rid,
              format: extension,
              size_in_mb: size,
              title: notesData.title,
              notes_owner : notesData.notes_owner,
              descriptions : notesData.descriptions || null,
              modified_by : userId,
              modified_datetime : new Date()
          }, {
            where : {
              notes_rid : notesData.rid
            }
          });

          return {
              statusCode: HttpStatus.SUCCESS,
              message: HttpStatus.SUCCESS_MESSAGE,
              data: { affectedCount: affectedCount }
            };
          }
        }
      }
      catch (error) {
        console.error('Error updating notes:', error);

        return {
            statusCode: 500,
            message: 'Failed to update Notes',
            errorMessage: error instanceof Error ? error.message : 'An unknown error occurred'
        };
      }
    }



}