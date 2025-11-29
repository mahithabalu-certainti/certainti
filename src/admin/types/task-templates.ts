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
  effort_in_days: number;
  reminder_interval: number;
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
  modified_by_name: string | null;
  created_by_name: string;
};

export interface TaskTemplateListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: {
    page: number;
    limit: number;
    total_result: number;
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
  created_by_name: string | null;
  modified_by_name: string | null;
  status_name?: string;
  checklist_name?: string;
  priority_name?: string;
  milestone_name?: string;
  role_name?: string;
  effort_in_days?: number;
  category_name?: string;
  weightage_value?: string;
  workflow_connector?: {
    source_rid: string;
    relationship_connector_rid?: string;
    relationship_type_name?: string;
    source_name?: string;
    target_name?: string;
    target_rid?: string;

    target_data?: {
      target_rid: string;
      target_name?: string;
    }[][];
  };
}

export interface TaskTemplateDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: TaskTemplateDetails;
}

// Form Types
export interface TaskTemplateFormData {
  task_name: string;
  task_type: string;
  status_rid: string;
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
  target_rid?: string;
  task_category_rid?: string;
  weightage_rid?: string;
  relationship_connector_rid?: string;
  workflow_connector?: {
    source_rid: string;
    target_rid?: string[];
    relationship_connector_rid?: string;
  };
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
  rid?: string;
  target_rid?: string;
  relationship_connector_rid?: string;
  weightage_rid?: string;
  task_category_rid?: string;
  status_rid?: string;
  workflow_connector?: {
    source_rid?: string;
    target_rid?: string[];
    relationship_connector_rid?: string;
  };
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
export interface TaskCategoryListType {
  rid: string;
  category_name: string;
}
export interface TaskWeightAgeListType {
  rid: string;
  weightage_value: string;
}
export interface TaskRoleType {
  rid: string;
  role_name: string;
}
export interface TaskLinkType {
  rid: string;
  relationship_type: string;
}
export interface TaskTemplateType {
  rid: string;
  task_name: string;
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
export interface TaskPriorityTypeResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: TaskPriorityType[];
}
export interface TaskCategoryTypeResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: TaskCategoryListType[];
}
export interface TaskWeightAgeTypeResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    data: TaskWeightAgeListType[];
  };
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
export interface TaskLinkTypeResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: TaskLinkType[];
}
export interface TaskTemplateResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: TaskTemplateType[];
}
