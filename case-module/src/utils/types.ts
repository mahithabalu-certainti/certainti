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
  heat_light_power?: number;
  total_nonlabor_cost?: number;
  tax_liability_sc?: number;
  tax_liability_ct? : number;
  tax_liability_ga? : number;
  employers_pension_contribution?: number
  other_can? : number
  other_on? : number
  other_uk? : number
  other_irl? : number
  material_software_cost?: number;
  sub_contracts?: number;
  cloud_software?: number;
  unpaid_amounts_paid?: number;
  unpaid_amounts?: number;
  aggregated_turnover?: number;
  total_expenses?: number;
  taxable_income?: number;
  export_sales_revenue?: number;
  lease_costs_of_computers_nj: number,
  lease_costs_of_computers_il: number,
  lease_costs_of_computers_ca: number,
  lease_costs_of_computers_az: number,
  lease_costs_of_computers_id: number,
  illinois_rd_credit_partnership_corp?: number
  illinois_research_payments_corp_only?: number
  basic_research_payments_ma?: number;
  basic_research_payments_id?: number;
  qualified_computer_rental_time_expenses?: number
  credit_carry_forward_py_ga? : number
  credit_carry_forward_py_sc? : number
  credit_carry_forward_py_tx? : number
  current_year_gross_receipts?: number
  other_credits_total_sc?: number
  other_credits_total_ga? : number
  parent_case_rid?: string;
  amendment_case_info?: Array<{
    fiscal_year: number;
    total_project: number;
    total_qualified_project: number;
    total_project_cost: number;
    total_qualified_project_cost: number;
    total_nonlabor_cost: number;
    total_subcon_cost: number;
    total_fte_cost: number;
    total_qre: number;
    total_rd_credits: number;
    annual_gross_receipts: number;
    action_type: "add" | "edit" | "delete";
    country_rid: string;
    state_rid?: string;
    state_name?: string;
    is_federal: boolean;
  }>;
}

export type CaseHeadersColumns = {
  rid: string,
  account_rid: string,
  case_name: string,
  account_name: string,
  filing_type_rid: string,
  case_owner_rid: string,
  fiscal_year: number,
  status_rid: string,
  country_rid: string | null,
  currency_rid: string | null,
  filing_type_name: string | null,
  country_name: string | null,
  country_code: string | null,
  case_owner_name: string | null,
  account_rnumber: string | null,
  currency_code: string | null,
  currency_symbol: string | null,
  status_name: string | null,
  case_total_projects: number | null,
  case_total_project_cost: number | null,
  case_total_rd_cost: number | null,
  case_total_qre_cost: number | null,
  case_total_qualified_projects: number | null,
  case_total_qualified_project_cost: number | null,
  case_completion_percentage: number | null,
  r_number: string,
  planned_submission_date: Date,
  statutory_submission_date: Date,
  description?: string,
  created_by: string | null,
  modified_by: string | null;
  created_by_name: string | null,
  modified_by_name: string | null,
  account_status_rid: string,
  account_status_name: string
  is_send_interaction: boolean
  is_state_available: boolean
  state_rid: string | null,
  state_name: string | null
  financial_working_signoff: boolean,
  effective_progress: number | null,
  case_progress: string | null
}

export type FilingType = {
  rid: string,
  filing_type_name: string
}

export type CountryType = {
  rid: string,
  country_name: string
  country_code: string
}
export type StateType = {
  rid: string,
  state_name: string
}

export type AccountType = {
  rid: string,
  r_number: string,
  account_name: string,
  country_rid: string | null,
  currency_rid: string | null,
  status_rid: string
}

export type CaseOwnerType = {
  rid: string,
  name: string
}

export type CaseStatusType = {
  rid: string,
  status_name: string
}

export type CurrencyType = {
  rid: string,
  currency_code: string
  currency_symbol: string
}

export type FilterType = {
  [key: string]: {
    [condition: string]: any
  }
}

export const validColumnsForSorting: any = {
  project_code: "project_code",
  project_name: "project_name",
  fiscal_year: "fiscal_year",
  project_classification_other: "project_classification_other",
  project_client_group: "project_client_group",
  project_group: "project_group",
  total_effort: "total_effort_prj",
  total_cost: "total_cost_prj",
  total_cost_fte_prj: "total_cost_fte_prj",
  total_cost_subcon_prj: "total_cost_subcon_prj",
  total_cost_nonlabor_prj: "total_cost_nonlabor_prj",
  assessment_status: "assessment_status",
  rd_percent_final: "rd_percent_final",
  qre_final: "qre_final",
  comments: "comments",
  modified_datetime: "modified_datetime",
  r_number: "r_number",
  project_point_of_contact: "project_point_of_contact",
  project_technical_point_of_contact: "project_technical_point_of_contact",
  is_qualified: "is_qualified"
}

export const validColumns: any = {
  project_code: "project_code",
  project_name: "project_name",
  fiscal_year: "fiscal_year",
  project_classification_rid: "project_classification_rid",
  project_type_rid: "project_type_rid",
  project_type_name: "project_type_name",
  project_classification_other: "project_classification_other",
  project_client_group: "project_client_group",
  project_group: "project_group",
  total_effort: "total_effort_prj",
  total_cost: "total_cost_prj",
  total_cost_fte: "total_cost_fte_prj",
  total_cost_subcon: "total_cost_subcon_prj",
  total_cost_nonlabor: "total_cost_nonlabor_prj",
  assessment_status: "assessment_status",
  rd_percent_final: "rd_percent_final",
  qre_final: "qre_final",
  comments: "comments",
  modified_datetime: "modified_datetime",
  r_number: "r_number",
  project_point_of_contact: "project_point_of_contact",
  project_technical_point_of_contact: "project_technical_point_of_contact",
  is_qualified: "is_qualified"
}

export const columnType: any = {
  project_code: "string",
  project_name: "string",
  fiscal_year: "number",
  project_classification_rid: "string",
  project_type_rid: "string",
  project_classification_other: "string",
  project_client_group: "string",
  project_group: "string",
  total_effort_prj: "number",
  total_cost_prj: "number",
  total_cost_fte_prj: "number",
  total_cost_subcon_prj: "number",
  total_cost_nonlabor_prj: "number",
  assessment_status: "string",
  rd_percent_final: "number",
  qre_final: "number",
  comments: "string",
  modified_datetime: "date",
  r_number: "string",
  project_point_of_contact: "string",
  project_technical_point_of_contact: "string",
  is_qualified: "string"
}

export type caseProjectsResponseType = {
  project_code: string,
  project_name: string,
  fiscal_year: number,
  project_classification_rid: string,
  project_classification_name: string,
  project_type_rid: string,
  project_classification_other: string,
  project_client_group: string,
  project_group: string,
  total_effort_prj: number,
  total_cost_prj: number
  total_cost_fte_prj: number,
  total_cost_subcon_prj: number,
  total_cost_nonlabor_prj: number,
  assessment_status: string,
  rd_percent_final: number,
  qre_final: number,
  comments: string,
  modified_datetime: Date,
  r_number: number,
  project_point_of_contact: string,
  project_technical_point_of_contact: string
}

export type filterType = {
  [key: string]: {
    [condition: string]: any;
  };
};

export type assignProjectType = {
  account_rid: string,
  case_rid: string,
  created_by: string,
  modified_by?: string,
  created_datetime: Date,
  modified_datetime: Date,
  case_total_projects?: number | null,
  case_total_project_cost: number | null,
  fiscal_year: number
  projects: projectType[]
}

type projectType = {
  project_rid: string,
  project_fiscal_rid: string,
  project_group: string,
  project_case_rid?: string
  project_code: string
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

export interface ICreateHistoricalSubmission {
  account_rid: string;
  case_rid: string;
  created_by: string;
  modified_by?: string;
  created_datetime: Date;
  modified_datetime?: Date;
  historical_submissions: CaseHistorySubmission[];
}

export interface CaseHistorySubmission {
  history_submission_rid: string;
  case_rid: string;
  fiscal_year: string;
  total_project: number;
  total_qualified_project: number;
  total_project_cost: number;
  total_qualified_project_cost: number;
  total_qre: number;
  total_rd_credits: number;
  total_fte_cost?: number;
  total_subcon_cost?: number;
  total_nonlabor_cost?: number;
  country_rid: string;
  state_rid?: string;
  annual_gross_receipts?: number;
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
  case_rid?: string
}

export interface ICreateChecklistItem {
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

type WorkflowConnectorItems = {
  source_rid: string
  relationship_connector_rid: string
  target_rid: string[],
  delete_target_rids: string[]
  created_by: string
}

type WorkflowConnectorItemsAccountLevel = {
  case_rid: string
  account_rid: string
  task_rid: string
  source_rid: string
  delete_target_rids: string[]
  relationship_connector_rid: string
  target_rid: string[]
  created_by: string
  created_datetime: Date
  is_new_changes: boolean,
  key_name?: string
}

export type CreateTaskTemplateType = {
  created_by: string,
  modified_by: string,
  created_datetime: Date,
  modified_datetime: Date,
  task_name: string,
  sequence_no: number,
  effort_in_days: number,
  effective_start_datetime: Date,
  effective_end_datetime: Date,
  case_team_member_role_rid: string,
  checklist_template_rid: string,
  status_rid: string,
  priority_rid: string,
  task_type_rid: string,
  milestone_template_rid: string,
  task_description: string,
  workflow_connector: WorkflowConnectorItems
  weightage_rid: string
  task_category_rid: string
  milestone_sequence: number
}

export type priorityTypes = {
  rid: string,
  priority_name: string
}

export type MilestoneTypes = {
  rid: string,
  case_filing_type_rid: string,
  case_filing_type_name: string,
  milestone_name: string
}

export type checkListTypes = {
  rid: string,
  checklist_name: string
}

export type UpdateTaskTemplateType = {
  rid: string,
  created_by: string,
  modified_by: string,
  created_datetime: Date,
  modified_datetime: Date,
  task_name: string,
  sequence_no: number,
  effort_in_days: number,
  effective_start_datetime: Date,
  effective_end_datetime: Date,
  case_team_member_role_rid: string,
  checklist_template_rid: string,
  status_rid: string,
  priority_rid: string,
  task_type_rid: string,
  milestone_template_rid: string,
  task_description: string,
  workflow_connector: WorkflowConnectorItems,
  weightage_rid: string,
  task_category_rid: string
}

export type UpdateTaskTemplateActionType = {
  rid: string,
  created_by: string,
  modified_by: string,
  created_datetime: Date,
  modified_datetime: Date,
  task_name: string,
  checklist_template_rid: string,
  status_rid: string,
  priority_rid: string,
  task_type_rid: string,
  workflow_connector: WorkflowConnectorItems
}

export type AdminTaskTemplateResponseTypes = {
  rid: string,
  r_number: string,
  created_by: string,
  created_by_name: string,
  modified_by: string,
  modified_by_name: string,
  created_datetime: Date,
  modified_datetime: Date,
  task_name: string,
  sequence_no: number,
  effort_in_days: number,
  effective_start_datetime: Date,
  effective_end_datetime: Date,
  case_team_member_role_rid: string,
  role_name: string,
  checklist_template_rid: string,
  status_rid: string,
  status_name: string,
  priority_rid: string,
  priority_name: string,
  milestone_template_rid: string,
  milestone_name: string,
  total_result: string
}

export type AdminTaskTemplatePayloadType = {
  page: number,
  limit: number,
  search: string,
  filter: FilterType,
  sort: string,
  sort_by: string
}

export type TaskType = {
  rid: string,
  task_type_name: string
}
export type TaskTypeResponse = {
  rid: string
}

export interface TaskData {
  rid: string;
  task_name: string;
  r_number: string;
  created_by: string;
  sequence_no: number | null;
  effort_in_days: number | null;
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

type tagTypes = {
  tag_rid: string
  is_new_tag: boolean
}

export type CreateCaseTaskType = {
  created_by: string,
  created_datetime: Date,
  task_name: string,
  sequence_no: number,
  effective_start_datetime: Date,
  effective_end_datetime: Date,
  case_team_member_role_rid: string,
  assigned_to: string,
  task_status_rid: string,
  priority_rid: string,
  milestone_template_rid: string,
  checklist_template_rid: string,
  account_rid: string,
  case_rid: string,
  task_type_rid: string,
  task_description: string,
  status_rid: string,
  tags: tagTypes[],
  workflow_connector: WorkflowConnectorItemsAccountLevel,
  weightage_rid: string
  task_category_rid: string
}

export type UpdateCaseTaskType = {
  rid: string
  modified_by: string,
  modified_datetime: Date,
  task_name: string,
  sequence_no: number,
  effective_start_datetime: Date,
  effective_end_datetime: Date,
  case_team_member_role_rid: string,
  assigned_to: string,
  task_status_rid: string,
  priority_rid: string,
  milestone_template_rid: string,
  checklist_template_rid: string,
  account_rid: string,
  case_rid: string,
  task_type_rid: string,
  task_description: string
  tags: tagTypes[],
  workflow_connector: WorkflowConnectorItemsAccountLevel,
  weightage_rid: string
  task_category_rid: string,
  is_flagged: boolean
}

export type CaseTaskQueryType = {
  rid: string,
  task_name: string,
  assigned_to: string,
  effective_start_datetime: Date,
  effective_end_datetime: Date,
  task_status_rid: string,
  total_result: string
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
  email_template_rid: string;
}
export type AddCommentsType = {
  created_by: string
  created_datetime: Date
  case_rid: string
  account_rid: string
  task_rid: string
  comments: string
  task_type: string
}

export interface IActivityMeetingAction {
  activity_rid: string;
  account_rid: string;
}

export type UpdateCommentsType = {
  modified_by: string
  modified_datetime: Date
  case_rid: string
  account_rid: string
  task_rid: string
  rid: string,
  comments: string,
  task_type: string,
  deleted_file_ids: string[]
}
export type DeleteCommentsType = {
  modified_by: string
  case_rid: string
  account_rid: string
  task_rid: string
  rid: string
  deleted_file_ids: string[],
  task_type: string
}

export type CommentsListType = {
  page: number
  limit: number
  account_rid: string
  case_rid: string
  task_rid: string
  task_type: string
}

export type ActivityType = {
  rid: string
  r_number: string
  case_rid: string
  created_by: string
  created_datetime: Date
  attribute_name: string
  old_value: string
  new_value: string
  task_rid: string,
  total_result: string
}
export type ChecklistItems = {
  rid: string
  checklist_item_name: string
  checklist_item_description: string
  status_rid: string
  checklist_item_status_name: string
}

export type taskTags = {
  tag_rid: string
}

export type taskWorkFlowConnector = {
  rid: string
  source_rid: string
  target_rid: string
  relationship_connector_rid: string
}

export type checklistType = {
  rid: string
  checklist_name: string
  checklist_description: string
  task_rid: string,
  checklist_items_count: string
  completed_items_count: string
  checklist_items: ChecklistItems[]
}

export type TaskCardDetailsType = {
  rid: string
  r_number: string
  created_by: string
  modified_by: string
  created_datetime: Date
  task_name: string
  effective_start_datetime: Date
  effective_end_datetime: Date
  assigned_to: string
  priority_rid: string
  task_description: string
  description: string
  task_status_rid: string
  priority_name: string
  task_status_name: string
  assigned_to_name: string
  checklists: checklistType,
  checklist_rid: string
  checklist_name: string
  case_team_member_role_rid: string
  tags: taskTags[]
  workflow_connector: taskWorkFlowConnector[],
  weightage_rid: string
  task_category_rid: string
  fiscal_year: number,
  is_flagged: boolean
}
export type TaskCardResponse = {
  task_details: TaskCardDetailsType
}
export type caseTaskStatusTypes = {
  rid: string,
  task_status_name: string
}
export type WorkflowConnectorType = {
  rid: string,
  relationship_type: string
}
export type TagsTypes = {
  rid: string
  tag_name: string
}
export type caseStatusType = {
  rid: string,
  status_name: string
}

export type CaseTaskWorkFlowCreate = {
  case_rid: string,
  account_rid: string,
  source_rid: string,
  target_rid: string[],
  delete_target_rids: string[]
  relationship_connector_rid: string
  created_by: string
  created_datetime: Date
}
export type CaseTaskWorkFlowDelete = {
  rid: string
  case_rid: string,
  account_rid: string
  created_by: string
  modified_datetime: string
}
export interface IAnomalyStatus {
  rid: string,
  accountId: string,
  action: "accept" | "reject",
  resourceCode: string;
  type: string
}

export interface IUpdateInlineProjectResource {
  // Fields that exist in case_project_resource table
  project_resource_rid: string;  // project_resource_rid maps to rid
  project_fiscal_rid: string;
  account_rid: string;
  resource_rid?: string;
  total_hours_pro_res?: number;
  total_cost_pro_res?: number;
  region_rid?: string | null;
  country_rid?: string | null;
  description?: string | null;
  modified_by?: string;
  status_rid?: string | null;
}

export interface IUpdateProjectResource {
  // Fields that exist in case_project_resource table
  project_resource_rid: string;  // project_resource_rid maps to rid
  project_fiscal_rid: string;
  account_rid: string;
  resource_rid: string;  // resource_id maps to resource_rid
  total_hours_pro_res?: number;
  total_cost_pro_res?: number;
  fiscal_year: number;
  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;
  effort_project_resource_level?: number | null;
  cost_project_resource_level?: number | null;
  description?: string | null;
  modified_by?: string;
  total_hours_from_tasks?: number | null;
  total_cost_from_tasks?: number | null;
  status_rid?: string | null;
}

export interface IUpdateProjectTask {
  project_task_rid: string;
  project_fiscal_rid: string;
  account_rid: string;
  resource_id: string;
  resource_code: string;
  total_hours_pro_task?: number;
  total_cost_pro_task?: number;
  fiscal_year: number;
  country_rid: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  comments?: string | null;
  created_by: string;
  modified_by?: string;
  status_rid: string
  project_resource_rid: string;
  task_name?: string;
  task_description?: string;
  task_type_rid?: string;
  task_classification_rid?: string;
}
export interface IActivityTask {
  task_template_rid?: string;
  task_rid: string;
  activity_type: string
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  accountRid: string;
  fiscal_year: number;
  attach_to: string;
  attachment_level: string;
  task_name: string;
  description?: string;
  task_description?: string;
  effective_start_datetime: Date;
  effective_end_datetime: Date;
  priority_rid?: string;
  assigned_to?: string | null;
  status_rid?: string;
  remainder_interval?: number;
  account_rid?: string;
  checklist_rid?: string;
  tags: tagTypes[],
  task_type_rid?: string;
}

export interface IActivityEmail {
  activity_rid: string;
  activity_type: string
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  accountRid: string;
  fiscal_year: number;
  attach_to: string;
  attachment_level: string;
  email_status: string;
  to_email: string[];
  cc_email?: string[];
  subject: string;
  body_html?: string;
  sender_email?: string;
  email_status_rid?: string;
  account_rid?: string;
  deleted_file_ids: string[]
}

export interface IActivityMeeting {
  activity_rid: string;
  activity_type: string
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  accountRid: string;
  fiscal_year: number;
  attach_to: string;
  attachment_level: string;
  meeting_status: string;
  meeting_status_rid?: string;
  invitees: JSON;
  meeting_participants: string[];
  subject: string;
  meeting_platform?: string;
  meeting_invite?: string;
  meeting_id?: string;
  effective_start_date: Date;
  effective_end_date?: Date;
  effective_start_time: string;
  effective_end_time: string;
  meeting_code?: string;
  minutes_of_meeting?: string;
  account_rid?: string;
  description?: string;
  time_zone?: string;
  recurrence_type?: string;
  recurrence_interval?: number;
  recurrence_days?: string[];
  recurrence_day_of_month?: number;
  recurrence_monthly_index?: string;
  deleted_file_ids: string[]
  invited_by: string
}

export interface IActivityCall {
  activity_rid: string;
  activity_type: string
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  accountRid: string;
  fiscal_year: number;
  attach_to: string;
  attachment_level: string;
  caller_id: string
  meeting_participants: string[];
  call_platform?: string;
  effective_start_datetime: Date;
  effective_end_datetime?: Date;
  minutes_of_meeting?: string;
  status_rid?: string;
  account_rid?: string;
  subject?: string;
  deleted_file_ids: string[]
  call_participants?: string[];
}


export interface IEmailMessage {
  subject: string;
  body: {
    contentType: string;
    content: string;
  };
  toRecipients: { emailAddress: { address: string } }[];
}

export type WeightageType = {
  rid: string
  weightage_value: number
}

export type TaskCategoryType = {
  rid: string
  category_name: string
}
export type CaseTaskDropdownType = {
  rid: string
  task_name: string
}

export type ProjectFiscalType = {
  rid: string
  signoff: boolean
  project_code: string
}

export type ProjectFiscalIds = {
  project_fiscal_rid: string
}
export type RegionIds = {
  region_rid: string
}
export type RegionDetails = {
  rid: string
  state_name: string
}
export type ProjectComputeValue = {
  project_name: string;
  total_projects: number;
  employees: number;
  epw: number;
  reductions: number;
  net_epw: number;
  total_project_value_labor: number;
}
export type CalculateQreCostType = {
  fte_qre_amount: number;
  subcon_qre_amount: number;
  nonlabor_qre_amount: number;
}
export type ProjectCalculatedDataCanada = {
  project_code: string
  project_name: string
  total_effort_prj: number
  total_cost_prj: number
  total_cost_fte_prj: number
  total_cost_subcon_prj: number
  total_cost_nonlabor_prj: number
  rd_percent_final: number
}

export type SignOffDetailsResponse = {
  signoff_type_rid: string
  created_by: string
  created_datetime: string
}

export type CaseClosureRemarks = {
  case_rid: string
  signoff_details: SignOffDetailsResponse[]
}

// Flat array structure interface
export interface FieldData {
  label: string;
  field_type: string;
  value: string | number;
  value_field_id: string;
  section_id?: string;
  id?: string;
}

export interface CaseData {
  rid: string;
  r_number: string;
  case_name: string;
  account_rid: string;

  fiscal_year: number;

  material_software_cost: number | null;
  heat_light_power: number | null;
  total_nonlabor_cost: number | null;

  employers_pension_contribution: number | null;
  other_can : number | null;
  other_on : number | null;
  other_uk : number | null;
  other_irl : number | null;

  total_expenses: number | null;
  sub_contracts: number | null;
  cloud_software: number | null;

  unpaid_amounts_paid: number | null;
  unpaid_amounts: number | null;

  aggregated_turnover: number | null;
  taxable_income: number | null;
  export_sales_revenue: number | null;

  lease_costs_of_computers_nj: number | null,
  lease_costs_of_computers_il: number | null,
  lease_costs_of_computers_ca: number | null,
  lease_costs_of_computers_az: number | null,
  lease_costs_of_computers_id: number | null,

  illinois_rd_credit_partnership_corp: number | null;
  illinois_research_payments_corp_only: number | null;
  basic_research_payments_ma: number | null;
  basic_research_payments_id : number | null;

  qualified_computer_rental_time_expenses: number | null;

  credit_carry_forward_py_ga? : number
  credit_carry_forward_py_sc? : number
  credit_carry_forward_py_tx? : number
  current_year_gross_receipts: number | null;
  other_credits_total_ga: number | null;
  other_credits_total_sc: number | null;
}

interface RdCreditsCountry {
  country_rid : string
  rd_credits_computed : number
  rd_credits_approved : number
  rd_credits_submitted : number
  comments : string
}

export interface RdCreditsState {
  state_rid : string
  rd_credits_computed : number
  rd_credits_approved : number
  rd_credits_submitted : number
  comments : string
}

export interface CaseCloseType {
  account_rid : string
  case_rid : string
  country_credits : RdCreditsCountry,
  state_credits : RdCreditsState[]
  user_rid : string
  fiscal_year : string
  user_preference : string
  country_rid : string
}

export interface ParentAccountType {
  rid : string
  account_name : string
  r_number : string
  storage_type : string
  is_parent : boolean
  currency_rid : string
}

export interface CaseSubmissionType {
  total_fte_cost : number
  total_subcon_cost : number
  total_nonlabor_cost : number
  total_project_cost : number
  total_qre : number,
  average_annual_gross_receipts : number
  state_rid : string
}

export interface ComputedValueRequest {
  case_rid : string
  account_rid : string
  country_rid : string
  state_rid : string[],
}

export interface CaseStateComputedType {
  state_rid : string
  final_credit : string
  state_name : string
}
export interface CaseCountryComputedType {
  country_rid : string
  final_credit : string
  country_name : string
}
export interface RevokeSignoffRequest {
  case_rid : string
  account_rid : string
  type : string
  userId : string
}
export interface DossierFormResponse {
  rid : string
  r_number : string
  created_by : string
  created_by_name : string
  created_datetime : Date
  dossier_version : number
  document_name : string
  total_result : string
}
