import { ICreateCases } from "../../utils/types";

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
  fetchCaseHeadersSectionsList(caseRid : string, accountRid : string) : Promise<any>
  getCaseStatus(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseStatus: any };
  }>;
  fetchProjectsForAssign(data : any, assignedProjects : boolean, userId : string) : Promise<any>
  assignProjectToCases(data : any, userId : string) : Promise<any>
  listAllCasesAccount(
    data: any,
    filters: Record<string, any>,
    userId: string,
    apiType: string,
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
  deleteAssignedProjectFromCases(data : any, userId : string) :Promise<any>;
  listAllCasesSummary(
    data: any,
    filters: Record<string, any>,
    userId: string,
    apiType: string,
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseInfo: any; count: number };
  }>;
}
