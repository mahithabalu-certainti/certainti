import { AdminTaskTemplatePayloadType, CreateTaskTemplateType, ICreateCases, ICreateCaseTeam, ICreateChecklist, ICreateChecklistTemplate, UpdateTaskTemplateType } from "../../utils/types";

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
  listUsersForCaseTeam(accountRid: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { users: any };
  }>;
  createCheckList(
    checklistRequest: ICreateChecklist,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { checklist: any };
  }>;

  exportAssignedProjects (data : any) : Promise<any>
}

export interface ICaseManagementService {
    createAdminCheckList(
    checklistRequest: ICreateChecklistTemplate,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { checklist: any };
  }>;
  listAdminCheckList(
    data: any,
    filters: Record<string, any>,
    userId: string,
    apiType: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { checklist: any; count: number };
  }>;
  updateAdminChecklist(
    data: any,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { checklist: any };
  }>;
  getCheckListTemplateDetailsById(
    checkListRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { checklistDetails: any };
  }>;
  createTaskTemplate(data : CreateTaskTemplateType, userId : string) :Promise<any>;
  getAllPriority() : Promise<any>
  getMilestones() : Promise<any>
  getChecklist() : Promise<any>
  updateTaskTemplate(data : UpdateTaskTemplateType, userId : string) :Promise<any>;
  fetchTaskTemplate(data : AdminTaskTemplatePayloadType, isExport : boolean, isGraphql : boolean, templateRid : string | null) : Promise<any>
  inlineEditTaskTemplate(data : any) : Promise<any>
}
