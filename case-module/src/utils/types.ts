export interface ICreateCases {
  case_rid?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid: string;
  case_name: string;
  description?: string;
  fiscal_year: number;
  filing_type_rid: string;
  case_owner_rid: string;
  case_startdate: Date;
  planned_submission_date: Date;
  statutory_submission_date: Date;
  status_rid?: string;
}

export type CaseHeadersColumns = {
  rid : string,
  account_rid : string,
  case_name : string,
  account_name : string,
  filing_type_rid : string,
  case_owner_rid : string,
  fiscal_year : number,
  status_rid : string,
  country_rid : string | null,
  currency_rid : string | null,
  filing_type_name : string | null,
  country_name : string | null,
  country_code : string | null,
  case_owner_name : string | null,
  account_rnumber : string | null,
  currency_code : string | null,
  status_name : string | null,
  case_total_projects : number | null,
  case_total_project_cost : number | null,
  case_total_rd_cost : number | null,
  case_total_qre_cost : number | null,
  case_total_qualified_projects : number | null,
  case_total_qualified_project_cost : number | null,
  case_completion_percentage: number | null,
  r_number : string,
  planned_submission_date: Date,
  statutory_submission_date: Date,
  description?: string,
  created_by: string | null,
  modified_by: string | null;
  created_by_name : string | null,
  modified_by_name : string | null,
  account_status_rid : string,
  account_status_name : string

}

export type FilingType = {
  rid : string,
  filing_type_name : string
}

export type CountryType = {
  rid : string,
  country_name : string
  country_code: string
}

export type AccountType = {
  rid : string,
  r_number : string,
  account_name : string,
  country_rid : string | null,
  currency_rid : string | null,
  status_rid : string
}

export type CaseOwnerType = {
  rid : string,
  name : string
}

export type CaseStatusType = {
  rid : string,
  status_name : string
}

export type CurrencyType = {
  rid : string,
  currency_code : string
}

export type FilterType = {
  [key : string] : {
    [condition : string] : any
  }
}

export const validColumnsForSorting : any = {
  project_code : "project_code",
  project_name : "project_name",
  fiscal_year : "fiscal_year",
  project_classification_other : "project_classification_other",
  project_client_group : "project_client_group",
  project_group : "project_group",
  total_effort_prj : "total_effort_prj",
  total_cost_prj : "total_cost_prj",
  total_cost_fte_prj : "total_cost_fte_prj",
  total_cost_subcon_prj : "total_cost_subcon_prj",
  total_cost_nonlabor_prj : "total_cost_nonlabor_prj",
  assessment_status : "assessment_status",
  rd_percent_final : "rd_percent_final",
  qre_final : "qre_final",
  comments : "comments",
  modified_datetime : "modified_datetime",
  r_number : "r_number",
  project_point_of_contact : "project_point_of_contact",
  project_technical_point_of_contact : "project_technical_point_of_contact"
}

export const validColumns : any = {
  project_code : "project_code",
  project_name : "project_name",
  fiscal_year : "fiscal_year",
  project_classification_rid : "project_classification_rid",
  project_type_rid : "project_type_rid",
  project_type_name : "project_type_name",
  project_classification_other : "project_classification_other",
  project_client_group : "project_client_group",
  project_group : "project_group",
  total_effort_prj : "total_effort_prj",
  total_cost_prj : "total_cost_prj",
  total_cost_fte_prj : "total_cost_fte_prj",
  total_cost_subcon_prj : "total_cost_subcon_prj",
  total_cost_nonlabor_prj : "total_cost_nonlabor_prj",
  assessment_status : "assessment_status",
  rd_percent_final : "rd_percent_final",
  qre_final : "qre_final",
  comments : "comments",
  modified_datetime : "modified_datetime",
  r_number : "r_number",
  project_point_of_contact : "project_point_of_contact",
  project_technical_point_of_contact : "project_technical_point_of_contact"
}

export const columnType : any = {
  project_code : "string",
  project_name : "string",
  fiscal_year : "number",
  project_classification_rid : "string",
  project_type_rid : "string",
  project_classification_other : "string",
  project_client_group : "string",
  project_group : "string",
  total_effort_prj : "number",
  total_cost_prj : "number",
  total_cost_fte_prj : "number",
  total_cost_subcon_prj : "number",
  total_cost_nonlabor_prj : "number",
  assessment_status : "string",
  rd_percent_final : "number",
  qre_final : "number",
  comments : "string",
  modified_datetime : "date",
  r_number : "string",
  project_point_of_contact : "string",
  project_technical_point_of_contact : "string"
}

export type caseProjectsResponseType = {
  project_code : string,
  project_name : string,
  fiscal_year : number,
  project_classification_rid : string,
  project_classification_name : string,
  project_type_rid : string,
  project_classification_other : string,
  project_client_group : string,
  project_group : string,
  total_effort_prj : number,
  total_cost_prj : number
  total_cost_fte_prj : number,
  total_cost_subcon_prj : number,
  total_cost_nonlabor_prj : number,
  assessment_status : string,
  rd_percent_final : number,
  qre_final : number,
  comments : string,
  modified_datetime : Date,
  r_number : number,
  project_point_of_contact : string,
  project_technical_point_of_contact : string
}

export type filterType = {
  [key: string]: {
    [condition: string]: any;
  };
};

export type assignProjectType = {
  account_rid : string,
  case_rid : string,
  created_by : string,
  modified_by? : string,
  created_datetime : Date,
  modified_datetime : Date,
  case_total_projects? : number | null,
  case_total_project_cost : number | null,
  projects : projectType[]
}

type projectType = {
  project_rid : string,
  project_fiscal_rid : string,
  project_group : string,
}

export interface ICreateCaseTeam {
  account_rid: string;
  case_rid: string;
 
  created_by: string;
  modified_by?: string;
  created_datetime: Date;
  modified_datetime?: Date;
  team_members: TeamMember[];
}

export interface TeamMember {
  user_rid: string;
  role_rid: string;
  case_team_rid?: string;
  effective_from: Date;
  effective_to: Date;
  is_primary: boolean;
  status_rid: string;
  action_type: "add" | "edit" | "delete";
}

export interface ICreateChecklistTemplate {
  checklist_name: string;
  checklist_template_rid?: string;
  checklist_description?: string;
  status_rid?: string;
  created_by: string;
  modified_by?: string;
  created_datetime: Date;
  modified_datetime?: Date;
  checklist_items: ICreateChecklistItemTemplate[];
}

export interface ICreateChecklist {
  
  account_rid: string;
  checklist_rid: string;
  attach_to: string;
  attachment_level: string;
  checklist_template_rid?: string | null;
  checklist_name: string;
  checklist_description?: string;
  status_rid?: string;
  created_by: string;
  modified_by?: string;
  created_datetime: Date;
  modified_datetime?: Date;
  fiscal_year: number;
  checklist_items: ICreateChecklistItem[];
}

export interface ICreateChecklistItem{
  checklist_item_name: string;
  checklist_item_rid: string;
  action_type: "add" | "edit" | "delete";
  status_rid: string;
  checklist_item_description?: string;
  created_by: string;
  modified_by?: string;
  created_datetime: Date;
  modified_datetime?: Date;
}
export interface ICreateChecklistItemTemplate {
  checklist_item_name: string;
  action_type: "add" | "edit" | "delete";
  checklist_item_rid: string;
  description?: string;
  created_by: string;
  modified_by?: string;
  created_datetime: Date;
  modified_datetime?: Date;
}

export type CreateTaskTemplateType = {
  created_by : string,
  modified_by : string,
  created_datetime : Date,
  modified_datetime : Date,
  task_name : string,
  sequence_no : number,
  effort_in_days : number,
  reminder_interval : number,
  effective_start_datetime : Date,
  effective_end_datetime : Date,
  case_team_member_role_rid : string,
  checklist_template_rid : string,
  status_rid : string,
  priority_rid : string,
  task_type_rid: string,
  milestone_template_rid : string,
  task_description : string
}

export type priorityTypes = {
  rid : string,
  priority_name : string
}

export type MilestoneTypes = {
  rid : string,
  case_filing_type_rid : string,
  case_filing_type_name : string,
  milestone_name : string
}

export type checkListTypes = {
  rid : string,
  checklist_name : string
}

export type UpdateTaskTemplateType = {
  rid : string,
  created_by : string,
  modified_by : string,
  created_datetime : Date,
  modified_datetime : Date,
  task_name : string,
  sequence_no : number,
  effort_in_days : number,
  reminder_interval : number,
  effective_start_datetime : Date,
  effective_end_datetime : Date,
  case_team_member_role_rid : string,
  checklist_template_rid : string,
  status_rid : string,
  priority_rid : string,
  task_type_rid: string,
  milestone_template_rid : string,
  task_description : string
}

export type AdminTaskTemplateResponseTypes = {
  rid : string,
  r_number : string,
  created_by : string,
  created_by_name : string,
  modified_by : string,
  modified_by_name : string,
  created_datetime : Date,
  modified_datetime : Date,
  task_name : string,
  sequence_no : number,
  effort_in_days : number,
  reminder_interval : number,
  effective_start_datetime : Date,
  effective_end_datetime : Date,
  case_team_member_role_rid : string,
  role_name : string,
  checklist_template_rid : string,
  status_rid : string,
  status_name : string,
  priority_rid : string,
  priority_name : string,
  milestone_template_rid : string,
  milestone_name : string,
  total_result: string
}

export type AdminTaskTemplatePayloadType = {
  page : number,
  limit : number,
  search : string,
  filter : FilterType,
  sort : string,
  sort_by : string
}

export type TaskType = {
  rid : string,
  task_type_name : string
}
export type TaskTypeResponse = {
  rid : string
}

export interface TaskData {
  rid: string;
  task_name: string;
  r_number: string;
  created_by: string;
  sequence_no: number | null;
  effort_in_days: number | null;
  reminder_interval: number | null;
  effective_start_datetime: string | Date | null;
  effective_end_datetime: string | Date | null;
  case_team_member_role_rid: string | null;
  assigned_to: string | null;
  status_rid: string | null;
  priority_rid: string | null;
  task_type_rid: string | null;
  task_description: string | null;
  checklists_count: number;
}

export interface MilestoneData {
  rid: string;
  milestone_name: string;
  task_count: number;
  tasks: TaskData[] | null;
}

export type MilestoneResponse = MilestoneData[];

export type CreateCaseTaskType = {
  created_by : string,
  created_datetime : Date,
  task_name : string,
  sequence_no : number,
  effort_in_days : number,
  reminder_interval : number, 
  effective_start_datetime : Date,
  effective_end_datetime : Date,
  case_team_member_role_rid : string,
  task_status_rid : string,
  priority_rid : string,
  milestone_template_rid : string,
  checklist_template_rid : string,
  account_rid : string,
  case_rid: string,
  task_type_rid : string,
  task_description : string,
  status_rid : string
}

export type UpdateCaseTaskType = {
  rid : string
  modified_by : string,
  modified_datetime : Date,
  task_name : string,
  sequence_no : number,
  effort_in_days : number,
  reminder_interval : number, 
  effective_start_datetime : Date,
  effective_end_datetime : Date,
  case_team_member_role_rid : string,
  task_status_rid : string,
  priority_rid : string,
  milestone_template_rid : string,
  checklist_template_rid : string,
  account_rid : string,
  case_rid: string,
  task_type_rid : string,
  task_description : string
}

export type CaseTaskQueryType = {
  rid : string,
  task_name : string,
  assigned_to : string,
  effective_start_datetime : Date,
  effective_end_datetime : Date,
  task_status_rid : string,
  total_result : string
}

export type ICreateEmailTemplate = {
  template_name: string;
  description?: string; 
  created_by?: string;
  modified_by?: string;
  status_rid?: string;
  category_rid?: string;
  subject: string;
  body_html?: string;
  email_template_rid:string;
}
export type AddCommentsType = {
  created_by : string
  created_datetime : Date
  case_rid : string
  account_rid : string
  task_rid : string
  comments : string
}

export type UpdateCommentsType = {
  modified_by : string
  modified_datetime : Date
  case_rid : string
  account_rid : string
  task_rid : string
  rid : string,
  comments : string,
  deleted_file_ids : string[]
}
export type DeleteCommentsType = {
  modified_by : string
  case_rid : string
  account_rid : string
  task_rid : string
  rid : string
  deleted_file_ids : string[]
}

export type CommentsListType = {
  account_rid : string
  case_rid : string
  task_rid : string
}
