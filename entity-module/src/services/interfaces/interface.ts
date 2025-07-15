import { Project } from "../../models/project";
import {
  ICreateAttachment,
  ICreateProject,
  ICreateProjectResource,
  ICreateResource,
  IResourceCost,
  IResourceSkill,
  IUpdateProject,
  IUpdateProjectResource,
  IUpdateResource,
  IUpdateResourceCost,
  IUpdateResourceSkill,
} from "../../utils/types";

export interface IProjectGraphQlServices {
  inLineEditProject(data : any) : Promise<{
    statusCode: number;
    statusMessage: string;
}> 
}

export interface IResourceService {
  createResource(
    resourceData: ICreateResource,
    userId: string,
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
    sortOrder: string
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
  exportResourceCostList(
    search: any, 
    parsedFilters: Record<string, any>, 
    sortBy: any, 
    sortOrder: any, 
    accountNumber: any, 
    fiscalYear: any, 
    resourceRid: any): Promise<{
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
    userPreference: string,
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCost: any };
  }>;

  updateResourceCost(
    resourceCostData: IUpdateResourceCost,
    userId: string,
    userPreference: string,
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
    type: string,
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
  
  resourceSkillById(id: string,accountNumber: string): Promise<{
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
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceSkill: any; };
  }>;
}

export interface IProjectService {
  createProject(projectData: ICreateProject, userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any };
  }>;
  updateProject(projectData: IUpdateProject, userId: string): Promise<{
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
    data?: { project: any, attachment: any };
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
    bothParentAndChild: boolean
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any, totalCount: number };
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
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any, count: number };
  }>;
  getProjectClassification(
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectClassifications: any, count: number };
  }>;
  exportProjectList(
    accountId: string,
    fiscal_year: number,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    bothParentAndChild: boolean,
    timezone:string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any, totalCount: number };
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
    timezone:string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any, count: number };
  }>;
}

export interface IResourceGraphQlServices {
  inLineEditResources(data : any) : Promise<{
    statusCode: number;
    statusMessage: string;
} | undefined>
}

export interface IResourceCostGraphQlService {
  inlineEditResourceCost(data : any) : Promise<{
    statusCode: number;
    statusMesage: string;
    statusMessage?: undefined;
} | {
    statusCode: number;
    statusMessage: string;
    statusMesage?: undefined;
} | undefined>
}

export interface IResourceSkillGraphQlService {
  updateInlineResourceSkill(data : any) : Promise<{
    statusCode: number;
    statusMessage: string;
} | undefined>
}
export interface IAttachmentService {
   createAttachment(attachmentData: ICreateAttachment, userId: string, file: Express.Multer.File): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { attachment: any };
  }>;

  getAttachments(userId: string,
  attachmentLevel: string,
  entityId: string,
  accountRid: string,
  page:number,
  limit:number,
  search: string,
  filters: Record<string, any>,
  sortBy: string,
  sortOrder: string,
  fiscalYear:number, graphqlData : any):Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { attachments: any[]; totalCount: number };
  }>

  getAttachmentSummary(userId: string,
  page:number,
  limit:number,
  search: string,
  filters: Record<string, any>,
  globalFilters: Record<string, any>,
  sortBy: string,
  sortOrder: string,
  fiscalYear:number):Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { attachments: any[]; totalCount: number };
  }>

  getDocumentTypeAndCategory(category_rid: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { documentTypes: any[]; documentCategories: any[] };
  }>;
}

export interface IProjectResourceService {
  createProjectResource(projectResourceData: ICreateProjectResource, userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResource: any };
  }>;
  updateProjectResource(projectResourceData: IUpdateProjectResource, userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResource: any };
  }>;
  projectResourceDetails(projectResourceId: string, accountId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResource: any, attachment: any };
  }>;
  getResourceCodes(accountId: string): Promise<{
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
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResources: any , count: number };
  }>;
  exportProjectResources(
    accountId: string,
    projectId: string,
    fiscal_year: number,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResources: any };
  }>;
}

export interface IAttachmentGraphqlServices {
  updateInlineAttachment (data : any) : Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceRolesSubType: any };
  }>;
}