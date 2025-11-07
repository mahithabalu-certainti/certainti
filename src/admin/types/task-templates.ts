export type TaskSortOrder = 'ASC' | 'DESC';

export interface TaskTemplateListParams {
  page: number;
  limit: number;
  sort_by?: TaskSortOrder;
  sort?: string;
  filter?: object;
  search?: string;
  timezone?: string;
}

// List Types
export type TaskTemplateList = {
  rid: string;
  r_number: string;

  task_name: string;
  task_description: string;

  task_type_name: string;
  task_type_rid: string;

  efforts: number;

  created_by: string;
  modified_by: string | null;
  created_user_name: string;
  modified_user_name: string | null;
  created_datetime: string;
  modified_datetime: string | null;
};

export interface TaskTemplateListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: {
    page: number;
    limit: number;
    totalCount: number;
    task_templates: TaskTemplateList[];
  };
}

// Details Types
export interface TaskTemplateDetails {
  rid: string;
  r_number: string;
  task_name: string;
  task_description: string;
  task_type_name: string;
  task_type_rid: string;
  efforts: number | string;
  created_by: string;
  modified_by: string | null;
  created_datetime: string;
  modified_datetime: string | null;
}

export interface TaskTemplateDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    templateDetails: TaskTemplateDetails;
  };
}

// Form Types
export interface TaskTemplateFormData {
  task_name: string;
  task_type: string;

  task_description: string;
  task_type_rid: string;
  effort_in_days: string | number;
  milestone_template_rid: string;
  priority_rid: string;
  checklist_template_rid: string;
  case_team_member_role_rid: string;
  reminder_interval: string;
  checklist_rid: string;
  milestone_rid: string;
}

export type TaskTemplateFormPayload = {
  template_rid?: string;
  task_name?: string;
  task_description?: string;
  task_type_rid?: string;
  effort_in_days?: string | number;
  milestone_template_rid?: string;
  priority_rid?: string;
  checklist_template_rid?: string;
  case_team_member_role_rid?: string;
  reminder_interval?: string;
};

export interface ExportTaskTemplateResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: string;
}

// Task template type
export interface TaskTemplateType {
  rid: string;
  task_type_name: string;
}
export interface TaskMileStoneType {
  rid: string;
  milestone_name: string;
}
export interface TaskPriorityType {
  rid: string;
  priority_name: string;
}
export interface TaskcheckListType {
  rid: string;
  checklist_name: string;
}
export interface TaskRoleType {
  rid: string;
  role_name: string;
}

export interface TaskTemplateTypeResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: TaskTemplateType[];
}
export interface TaskMilestoneTypeResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: TaskMileStoneType[];
}
export interface TaskPiriorityTypeResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: TaskPriorityType[];
}
export interface TaskCheckListTypeResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: TaskcheckListType[];
}
export interface TaskAssigneRoleTypeResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    caseRoles: TaskRoleType[];
  };
}
