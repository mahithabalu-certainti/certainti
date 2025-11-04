import { ICreateCases, ICreateCaseTeam, ICreateChecklist } from "../../utils/types";

export interface ICaseService {
  createCase(
    caseRequest: ICreateCases,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { cases: any };
  }>;
  updateCase(
    caseRequest: ICreateCases,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { cases: any };
  }>;
  getCaseFilingType(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseFilingType: any };
  }>;
  fetchCaseHeadersSectionsList(
    caseRid: string,
    accountRid: string
  ): Promise<any>;
  getCaseStatus(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseStatus: any };
  }>;
  fetchProjectsForAssign(
    data: any,
    assignedProjects: boolean,
    userId: string,
    isExport : boolean
  ): Promise<any>;
  assignProjectToCases(data: any, userId: string): Promise<any>;
  listAllCasesAccount(
    data: any,
    filters: Record<string, any>,
    userId: string,
    apiType: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseInfo: any; count: number };
  }>;
  getAllowedExportFields(
    userId: string,
    permission_name: string
  ): Promise<any[]>;
  deleteAssignedProjectFromCases(data: any, userId: string): Promise<any>;
  listAllCasesSummary(
    data: any,
    filters: Record<string, any>,
    userId: string,
    apiType: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseInfo: any; count: number };
  }>;
  createCaseTeam(
    caseTeamRequest: ICreateCaseTeam,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?:any;
  }>;
  getCaseTeamRoles(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseRoles: any };
  }>;
  listCaseTeamMembers( data: any, filters: Record<string, any>,userId:string,apiType:string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseTeamMembers: any };
  }>;
  exportAssignedProjects (data : any) : Promise<any>
}

export interface ICaseManagementService {
    createAdminCheckList(
    checklistRequest: ICreateChecklist,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { checklist: any };
  }>;
}
