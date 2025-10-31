export type TaskSortOrder = 'ASC' | 'DESC';

export interface TaskTemplateListParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: TaskSortOrder;
  filters?: object;
  searchTerm?: string;
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
    taskTemplates: TaskTemplateList[];
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
  task_description: string;
  task_type: string;
  efforts: number;
}

export type TaskTemplateFormPayload = {
  template_rid?: string;
  task_name?: string;
  task_description?: string;
  task_type_rid?: string;
  efforts?: number;
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

export interface TaskTemplateTypeResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    taskTemplateType: TaskTemplateType[];
  };
}
