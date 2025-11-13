import { CaseTask } from "../../models/caseTaskModel";
import { Tags } from "../../models/tagsModel";
import { TaskComments } from "../../models/taskCommentsModel";
import { TaskTag } from "../../models/taskTagsModel";
import { AddCommentsType, AdminTaskTemplatePayloadType, CaseTaskQueryType, CreateCaseTaskType, CreateTaskTemplateType, ICreateCases, ICreateCaseTeam, ICreateChecklist, ICreateChecklistTemplate, ICreateEmailTemplate, MilestoneResponse, UpdateCaseTaskType, UpdateTaskTemplateType, UpdateCommentsType, DeleteCommentsType, CommentsListType, ActivityType } from "../../utils/types";

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
  getChecklistStatus(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { checklistStatus: any };
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
  getCaseOwner() : Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseOwners: any };
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
  updateCheckList(
    checklistRequest: ICreateChecklist,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { checklist: any };
  }>;
   getCheckListDetailsById(
    checkListRid: string,
    value:any
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { checklistDetails: any };
  }>;
   getAllChecklists(
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
    apiType: string,
    graphqlData: any
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { checklists: any[]; totalCount: number };
  }>;

  exportAssignedProjects (data : any) : Promise<any>,
  createUserLevelTask(data : CreateCaseTaskType): Promise<{
    statusCode: number;
    statusMessage: string;
    data: null;
} | {
    statusCode: number;
    statusMessage: string;
    data: CaseTask | {};
}>
updateUserLevelTask(data : UpdateCaseTaskType): Promise<{
    statusCode: number;
    statusMessage: string;
} | undefined>
taskListForCases(data : any, isExport : boolean) : Promise<{
    statusCode: number;
    data: CaseTaskQueryType[];
}>
createOrMapTags(data : any) : Promise<{
    statusCode: number;
    data: string | TaskTag | null;
}>
fetchTagsForDropdown() : Promise<{
    statusCode: number;
    data: Tags[];
}>
addCommentsToTask(data : AddCommentsType, userId : string, files? : Express.Multer.File[]) : Promise<{
    statusCode: number;
    statusMessage: string;
    data: TaskComments;
} | {
    statusCode: number;
    statusMessage: string;
    data: null;
}>
exportTask(data : any, userId : string) : Promise<{
    statusCode: number;
    data: string;
} | {
    statusCode: number;
    data: null;
}>
updateComments(data : UpdateCommentsType, userId : string, files? : Express.Multer.File[]) : Promise<{
    statusCode: number;
    statusMessage: string;
}>
deleteComments(data : DeleteCommentsType, userId : string) : Promise<{
    statusCode: number;
    statusMessage: string;
}>
fetchTaskComment(data : CommentsListType) : Promise<any>
addTaskLevelAttachment (data : any, userId : string, files : Express.Multer.File[]) : Promise<{
    statusCode: number;
    statusMessage: string;
}>
deleteTaskLevelAttachment (data : any, userId : string) : Promise<{
    statusCode: number;
    statusMessage: string;
}>
listTaskLevelAttachment (data : any) : Promise<{
    statusCode: number;
    statusCodeValue: string;
    data: any[];
}>
fetchAllTaskActivities (data : any) : Promise<{
    statusCode: number;
    data: {
        page: any;
        limit: any;
        total_result: number;
        data: any[];
    };
}>
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
  createEmailTemplate(
    emailRequest: ICreateEmailTemplate,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { emailTemplate: any };
  }>;
  updateEmailTemplate(
    emailRequest: ICreateEmailTemplate,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { emailTemplate: any };
  }>;
  getEmailPlaceHolders() : Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { placeHolders: any };
  }>;
  listEmailTemplates(
    data: any,
    filters: Record<string, any>,
    userId: string,
    apiType: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { emailTemplates: any; count: number };
  }>;
  updateAdminCheckList(
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
  getEmailTemplateDetailsById(
    templateRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { emailTemplateDetails: any };
  }>;
  getEmailCategoryPlaceHolders
  (categoryRid : string) : Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { placeholders: any };
  }>;
  getEmailTemplateCategory() : Promise<{
    statusCode: number;
    message: string; 
    errorMessage?: string;
    data?: { categories: any };
  }>;
  createTaskTemplate(data : CreateTaskTemplateType, userId : string) :Promise<any>;
  getAllPriority() : Promise<any>
  getMilestones() : Promise<any>
  getChecklist() : Promise<any>
  updateTaskTemplate(data : UpdateTaskTemplateType, userId : string) :Promise<any>;
  fetchTaskTemplate(data : AdminTaskTemplatePayloadType, isExport : boolean, isGraphql : boolean, templateRid : string | null) : Promise<any>
  inlineEditTaskTemplate(data : any) : Promise<any>
  fetchTaskTypeForTemplate() : Promise<any>
  getTaskTemplateDetailsById (rid : string) : Promise<any>,
  fetchKanbanBoardForCase(accountRid : string, caseRid : string): Promise<{
    statusCode: number;
    data: MilestoneResponse[];
}>
}
