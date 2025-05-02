import { Project } from "../../models/project";
import {
  ICreateProject,
  ICreateResource,
  IResourceCost,
  IResourceSkill,
  IUpdateProject,
  IUpdateResource,
  IUpdateResourceCost,
  IUpdateResourceSkill,
} from "../../utils/types";

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
    fiscal_year: number,
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
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCost: any };
  }>;

  updateResourceCost(
    resourceCostData: IUpdateResourceCost,
    userId: string
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
}

export interface IResourceSkillService {
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
}

export interface IProjectService {
  createProject(projectData: ICreateProject, userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any };
  }>;
  updateProjectRecords(projectData: IUpdateProject, userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any };
  }>;
  createProjectTables(accountNumber: string): void;
  createProjectRecords(
    projectData: ICreateProject,
    accountNumber: string
  ): Promise<Project>;
  projectById(
    accountNumber: string,
    projectId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any };
  }>;
  projectList(
    accountNumber: string,
    fiscal_year: number,
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
    data?: { projects: any };
  }>;
}
