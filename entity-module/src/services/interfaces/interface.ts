import { Project } from "../../models/project";
import {
  IAnomalyStatus,
  ICreateAttachment,
  ICreateProject,
  ICreateProjectResource,
  ICreateProjectTask,
  ICreateResource,
  IFetchNotesDetailsInput,
  IResourceCost,
  IResourceSkill,
  IUpdateProject,
  IUpdateProjectResource,
  IUpdateProjectTask,
  IUpdateQrePecentAdjustment,
  IUpdateResource,
  IUpdateResourceCost,
  IUpdateResourceSkill,
} from "../../utils/types";
import { ICreateNotesSchema, IUpdateNotesSchema } from "../notes/notesSchemas";

export interface IProjectGraphQlServices {
  inLineEditProject(data: any): Promise<{
    statusCode: number;
    statusMessage: string;
  }>;
}

export interface IResourceService {
  createResource(
    resourceData: ICreateResource,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resource: any };
  }>;
  resourcesList(
    accountNumber: string,
    page: number,
    limit: number,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resources: any };
  }>;

  exportResourcesList(
    accountNumber: string,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resources: any };
  }>;
  resourceById(
    accountNumber: string,
    resourceId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceDetails: any };
  }>;
  updateResource(
    resourceData: IUpdateResource,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resource: any };
  }>;
}

export interface IResourceCostService {
    exportResourceCostsForFinancialHighlights(
    search: any, 
    parsedFilters: Record<string, any>, 
    sortBy: any, 
    sortOrder: any, 
    accountNumber: any, 
    fiscalYear: any,
    project_id: string,
    account_id:string,
    userId:string,
    caseRid? : string
  ): Promise<{
      statusCode: number;
      message: string;
      errorMessage?: string;
      data?: { financialHighlights: any };
    }>;
  resourceCostsForFinancialHighlights(
    page: number,
    limit: number,
    search: string,
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    accountNumber: string,
    fiscalYear: number,
    project_id: string,
    account_id:string,
    caseRid? : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResourceFiscal: any; count: number };
  }>;
  exportResourceCostList(
    search: any,
    parsedFilters: Record<string, any>,
    sortBy: any,
    sortOrder: any,
    accountNumber: any,
    fiscalYear: any,
    userId: string,
    resourceRid: any
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCost: any };
  }>;
  resourceCostList(
    page: number,
    limit: number,
    search: string,
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    accountNumber: string,
    fiscalYear: number,
    resourceRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCost: any; count: number };
  }>;

  createResourceCost(
    resourceCostData: IResourceCost,
    userId: string,
    userPreference: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCost: any };
  }>;

  updateResourceCost(
    resourceCostData: IUpdateResourceCost,
    userId: string,
    userPreference: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { affectedCounts: number };
  }>;

  resourceCostById(
    id: string,
    accountNumber: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCostById: any };
  }>;

  acceptResourceCostStatus(
    id: string,
    accountNumber: string,
    action: string,
    type: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { updateStatus: any };
  }>;
}

export interface IResourceSkillService {
  getSkillSubTypes(skillTypeRids: string[] | string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { skillSubTypes: any[] };
  }>;

  getSkillTypes(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { skillTypes: any[] };
  }>;

  createResourceSkill(
    resourceSkillData: IResourceSkill,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceSkill: any };
  }>;

  updateResourceSkill(
    resourceSkillData: IUpdateResourceSkill,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { affectedCounts: number };
  }>;

  resourceSkillList(
    page: number,
    limit: number,
    search: string,
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    accountNumber: string,
    fiscalYear: number,
    resourceRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceSkill: any; count: number };
  }>;

  resourceSkillById(
    id: string,
    accountNumber: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceSkillById: any };
  }>;

  exportResourceSkillList(
    search: string,
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    accountNumber: string,
    fiscalYear: number,
    resourceRid: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceSkill: any };
  }>;
}

export interface IProjectService {
  createProject(
    projectData: ICreateProject,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any };
  }>;
  updateProject(
    projectData: IUpdateProject,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any };
  }>;
  createProjectTables(accountNumber: string): void;
  createProjectRecords(
    projectData: ICreateProject,
    accountNumber: string,
    accountData: any,
    userId: string
  ): Promise<Project>;
  projectById(
    accountId: string,
    projectId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any; attachment: any };
  }>;
  projectList(
    accountId: string,
    fiscal_year: number,
    page: number,
    limit: number,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    bothParentAndChild: boolean,
    userId: string,
    apiSource:string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; totalCount: number };
  }>;
  allProjectList(
    fiscal_year: number,
    page: number,
    limit: number,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    globalFilters: Record<string, string[]>,
    userId: string,
    bothParentAndChild: boolean,
    isFromuserGroup?: boolean,
    accountRid?: string[]
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; count: number };
  }>;
  getProjectClassification(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectClassifications: any; count: number };
  }>;
  exportProjectList(
    accountId: string,
    fiscal_year: number,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    bothParentAndChild: boolean,
    timezone: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; totalCount: number };
  }>;
  exportAllProjectList(
    fiscal_year: number,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    globalFilters: Record<string, string[]>,
    userId: string,
    bothParentAndChild: boolean,
    timezone: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; count: number };
  }>;
  fetchQreHistoryByAccountId(data : any) : Promise<any>
}

export interface IResourceGraphQlServices {
  inLineEditResources(data: any): Promise<
    | {
        statusCode: number;
        statusMessage: string;
      }
    | undefined
  >;
}

export interface IResourceCostGraphQlService {
  inlineEditResourceCost(data: any): Promise<
    | {
        statusCode: number;
        statusMesage: string;
        statusMessage?: undefined;
      }
    | {
        statusCode: number;
        statusMessage: string;
        statusMesage?: undefined;
      }
    | undefined
  >;
}

export interface IResourceSkillGraphQlService {
  updateInlineResourceSkill(data: any): Promise<
    | {
        statusCode: number;
        statusMessage: string;
      }
    | undefined
  >;
}
export interface IAttachmentService {
  createAttachment(
    attachmentData: ICreateAttachment,
    userId: string,
    file: Express.Multer.File
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { attachment: any };
  }>;

  getAttachments(
    userId: string,
    attachmentLevel: string,
    entityId: string,
    accountRid: string,
    page: number,
    limit: number,
    search: string,
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    fiscalYear: number,
    graphqlData: any,
    type? : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { attachments: any[]; totalCount: number };
  }>;

  exportAttachments(
    userId: string,
    attachmentLevel: string,
    entityId: string,
    accountRid: string,
    search: string,
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    fiscalYear: number,
    graphqlData: any,
    timezone : string,
    type? : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { attachments: any[] };
  }>;

  getAttachmentSummary(
    userId: string,
    page: number,
    limit: number,
    search: string,
    filters: Record<string, any>,
    globalFilters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    fiscalYear: number
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { attachments: any[]; totalCount: number };
  }>;

  exportAttachmentSummary(
    userId: string,
    search: string,
    filters: Record<string, any>,
    globalFilters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    fiscalYear: number,
    timezone : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { attachments: any[] };
  }>;

  getDocumentTypeAndCategory(category_rid: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { documentTypes: any[]; documentCategories: any[] };
  }>;
}

export interface IProjectResourceService {
  createProjectResource(
    projectResourceData: ICreateProjectResource,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResource: any };
  }>;
  updateProjectResource(
    projectResourceData: IUpdateProjectResource,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResource: any };
  }>;
  projectResourceDetails(
    projectResourceId: string,
    accountId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResource: any; attachment: any };
  }>;
  getResourceCodes(accountId: string, projectFiscalRid : string, search: string | null): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCodes: any };
  }>;
  getResourceSkillRoles(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceRoles: any };
  }>;
  getResourceSkillRolesSubtype(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceRolesSubType: any };
  }>;
  listProjectResources(
    accountId: string,
    projectId: string,
    fiscal_year: number,
    page: number,
    limit: number,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    search : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResources: any; count: number };
  }>;
  exportProjectResources(
    accountId: string,
    projectId: string,
    fiscal_year: number,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    userId: string,
    search : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResources: any };
  }>;
  getAssignedResourceCodes(accountId: string, projectFiscalId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCodes: any };
  }>;
  handleAnomalyStatus(data: IAnomalyStatus, userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResource: any };
  }>;
}

export interface IAttachmentGraphqlServices {
  updateInlineAttachment(data: any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceRolesSubType: any };
  }>;
}

export interface IImportListGraphqlServices {
  listAllImportedData(
    page: number,
    limit: number,
    sort: string,
    sortBy: string,
    account_rid: string,
    filters: any,
    fiscal_year: number,
    search : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceRolesSubType: any };
  }>;
  fetchUserDetails(userRids: string[]): Promise<any[]>;
  fetchImportById(
    account_rid: any,
    rid: any
  ): Promise<
    | {
        statusCode: number;
        data: {};
      }
    | {
        statusCode: number;
        data: null;
      }
  >;

  listAllStageFailures(
    account_rid: string,
    import_rid: string,
    entity_type: string
  ): Promise<
    | {
        statusCode: number;
        data: {};
      }
    | {
        statusCode: number;
        data: null;
      }
  >;

  listAllLoadFailures(
    account_rid: string,
    rid: string,
    entity_type: string
  ): Promise<
    | {
        statusCode: number;
        data: {};
      }
    | {
        statusCode: number;
        data: null;
      }
  >;

  listAllWarnings(
    account_rid: string,
    rid: string,
    entity_type: string
  ): Promise<
    | {
        statusCode: number;
        data: {};
      }
    | {
        statusCode: number;
        data: null;
      }
  >;

  fetchAccountLevelImportedProjects(
    accountId: string,
    fiscal_year: number,
    page: number,
    limit: number,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    bothParentAndChild: boolean,
    userId: string,
    documentRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; totalCount: number };
  }>;

  exportAccountLevelImportedProjects(
    accountId: string,
    fiscal_year: number,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    bothParentAndChild: boolean,
    userId: string,
    timezone: string,
    documentRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; totalCount: number };
  }>;

  fetchAccountLevelImportedResources(
    accountId: string,
    page: number,
    limit: number,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    documentRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resources: any; count: number};
  }>;

  exportAccountLevelImportedResources(
    accountId: string,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    documentRid: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resources: any; count: number};
  }>;

  fetchAccountLevelImportedProjectTasks(
    accountRid: string,
    documentRid: string,
    filters: Record<string, any>,
    search: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { tasks: any[]; totalCount: number };
  }>;
  
  exportAccountLevelImportedProjectTasks(
    accountRid: string,
    documentRid: string,
    userId: string,
    filters: Record<string, any>,
    search: string,
    sortBy: string,
    sortOrder: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { tasks: any[]; totalCount: number };
  }>;

  getAllowedExportFields(
      userId: string,
      permission_name: string
    ): Promise<any[]>;
}

export interface IProjectTaskIngestionService {
  createProjectTask(
    projectTaskData: ICreateProjectTask,
    userId: string,
    userPreference : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectTask: any };
  }>;
  updateProjectTask(
    projectTaskData: IUpdateProjectTask,
    userId: string,
    userPreference : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectTask: any };
  }>;
  getAssignedResourceCodes(accountId: string, projectFiscalId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCodes: any };
  }>;
   handleAnomalyStatus(data: IAnomalyStatus,
    userId: string) : Promise<{
    statusCode: number;
    message: string;
    data?: { projectTask: any };
  }>
  listResourceCodeForProjectTask(data : any) : Promise<any>;
  listProjectTaskTypes() : Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectTaskTypes: any };
  }>;
  listProjectTaskClassification(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectTaskClassification: any };
  }>;
}
export interface IProjectTaskService {
  listProjectTasks(
    accountRid: string,
    projectRid: string,
    filters: Record<string, any>,
    search: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { tasks: any[]; totalCount: number };
  }>;

  listProjectTasksExport(
    userId: string,
    accountRid: string,
    projectRid: string,
    filters: Record<string, any>,
    search: string,
    sortBy: string,
    sortOrder: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { tasks: any[]; totalCount: number };
  }>;

  getProjectTaskById(
    accountRid: string,
    taskRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }>;
}

export interface IProjectTaskGraphqlServices {
  updateInlineAttachment(data: any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }>;
}

export interface ISettingsServices {
  updateSettings(data : any) : Promise<{
    statusCode : number
    statusMessage : string
  }>
}

export interface IFinancialHighlights {
  summaryHighlightsList(data : any) : Promise<{
    statusCode : number,
    statusMessage : string,
    data : any
  }>
  projectFinancialHighlights(data : any) : Promise<{
    statusCode : number,
    statusMessage : string,
    data : any
  }>

  listAccountLevelProjectCostFinancialHighlights(
  accountRid: string,
  filters: Record<string, any>,
  search: string,
  fiscalYear:number,
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: string,
  caseRid? : string
): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { summaries: any[]; totalCount: number }
}>

exportListAccountLevelProjectCostFinancialHighlights(
  accountRid: string,
  filters: Record<string, any>,
  search: string,
  fiscalYear:number,
  sortBy: string,
  sortOrder: string,
  caseRid : string
): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { summaries: any[]; totalCount: number }
}>
fetchRegions(data : any) : Promise <any>
}

export interface INotesService {
   createNotes(
    notesData: ICreateNotesSchema,
    userId: string,
    file?: Express.Multer.File
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { notes: any };
  }>;

  getNotes(
    userId: string,
    attachmentLevel: string,
    entityId: string,
    accountRid: string,
    page: number,
    limit: number,
    search: string,
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    fiscalYear: number,
    graphqlData: any
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { notes: any[]; totalCount: number };
  }>;

  exportNotes(
    userId: string,
    attachmentLevel: string,
    entityId: string,
    accountRid: string,
    search: string,
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    fiscalYear: number,
    graphqlData: any,
    timezone : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { notes: any[] };
  }>;

  getNotesSummary(
    userId: string,
    page: number,
    limit: number,
    search: string,
    filters: Record<string, any>,
    globalFilters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    fiscalYear: number
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { notes: any[]; totalCount: number };
  }>;

  exportNotesSummary(
    userId: string,
    search: string,
    filters: Record<string, any>,
    globalFilters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    fiscalYear: number,
    timezone : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { notes: any[] };
  }>;
  getNotesDetailsById(data : IFetchNotesDetailsInput) : Promise<{
    statusCode : number,
    statusMessage : string,
    data : any
  }>
  updateNotes (notesData : IUpdateNotesSchema, userId: string, file?: Express.Multer.File, isFileDeleted? : boolean) : Promise<any>
}
export interface ITemplates {
  uploadTemplate(
    file: Express.Multer.File,
    templateId: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }>;
  listTemplates(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }>;
}
export interface ITaskSummaryGraphqlServices {
  updateInlineTaskSummary(data: any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }>;
}
export interface INotesGraphqlServices {
  updateInlineNotes(data: any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { notes: any };
  }>;
}

export interface EnrichedTask extends Record<string, any>  {
  rid: string;
  r_number: string;
  created_by: string;
  modified_by?: string | null;
  created_datetime: Date;
  modified_datetime?: Date | null;
  account_rid: string;
  attach_to: string;
  attachment_level: string;
  task_name: string;
  description?: string | null;
  fiscal_year: number;
  assigned_to: string;
  status_rid: string;
  priority_rid: string;
  effective_start_datetime: Date;
  effective_end_datetime: Date;
  task_rid: string;
  created_by_name: string;
  modified_by_name?: string;
  status_name: string;
  priority_name: string;
  assigned_to_name: string;
  account_status_rid?: string;
  account_status_name?: string;
}