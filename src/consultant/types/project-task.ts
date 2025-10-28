import { CommonApiResponse } from '../../common-service';

export enum ProjectResourceStatus {
  active = 'Active',
  inactive = 'Inactive',
}
export interface ProjectTaskListExportParams {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  projectRid?: string;
  accountRid?: string;
}
export interface ProjectResourcesListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: string | number;
  // id?: string;
  accountRid?: string;
  projectRid?: string;
}

export type ProjectTaskListType = {
  rid: string;
  r_number: string;
  account_rid: string;
  project_fiscal_rid: string;
  account_name: string;
  project_rid: string;
  project_name: string | null;
  project_code: string;
  project_resource_code: string;
  resource_rid: string;
  resource_code: string;
  fiscal_year: number;
  start_date: string;
  end_date: string;
  resource_name: string;
  resource_type_rid: string;
  resource_type_name: string;
  resource_role: string;
  status_rid: string;
  country_rid: string;
  country_name: string;
  region_rid: string;
  region_name: string;
  currency_rid: string;
  currency_symbol: string;
  resource_orgname: string | null;
  total_hours_pro_task: string;
  total_cost_pro_task: string;
  description: string;
  comments: string | null;
  created_by: string;
  modified_by: string;
  status_name: string;
  created_datetime: string;
  modified_datetime: string;
  // need to modidy list data based on mock data or api response
};

export interface ProjectTaskApiResponse extends CommonApiResponse {
  data: {
    tasks: ProjectTaskListType[];
    totalCount: number;
  };
}

export interface ProjectTaskDetailsType {
  rid: string;
  r_number: string;
  account_rid: string;
  account_name: string;
  project_rid: string;
  project_fiscal_rid: string;
  project_name: string | null;
  project_code: string;
  resource_rid: string;
  resource_code: string;
  fiscal_year: number;
  start_date: string;
  end_date: string;
  resource_name: string;
  resource_type_rid: string;
  resource_type_name: string;
  resource_role: string;
  status_rid: string;
  country_rid: string;
  country_name: string;
  region_rid: string;
  region_name: string;
  currency_rid: string;
  currency_symbol: string;
  resource_orgname: string | null;
  description: string;
  comments: string | null;
  attachment: Attachment[];
  created_datetime: string;
  modified_datetime: string;
  created_by: string;
  modified_by: string;
  currency_name: string;
  total_cost_pro_task: string;
  total_hours_pro_task: string;
  status_name: string;
}

export interface Attachment {
  rid: string;
  r_number: string;
  created_datetime: string;
  created_by: string;
  modified_datetime: string | null;
  modified_by: string | null;
  account_rid: string;
  browse_file: string;
  document_name: string;
  attach_to: string;
  attachment_level: string;
  fiscal_year: number;
  format: string;
  size_in_mb: string;
  document_category_rid: string;
  document_type_rid: string;
  document_category_others: string | null;
  document_type_others: string | null;
  comments: string | null;
  document_rid: string;
  document_type: string;
  document_category: string;
  uploaded_by: string;
  attached_to: string;
}

export type ProjectResourcePayload = {
  id: string;
  project_resource_number?: string;
  project_id?: string;
  resource_ref_id?: string;
  resource_full_name?: string;
  resource_type?: string;
  resource_org_name?: string;
  resource_role?: string;
  status?: ProjectResourceStatus;
  country?: string;
  region?: string;
  currency?: string;
  resource_effective_from?: string;
  resource_enddate?: string;
  designation?: string;
  effort?: number;
  cost?: string | number;
  cost_project_tasks?: number | string;
  blended_cost?: number | string;
  blended_cost_project_tasks?: number | string;
  financeEffort?: number;
  description?: string;
};

interface ProjectResourceData {
  projectResourceDetails: ProjectTaskDetailsType;
}

export interface ProjectResourceDetailsApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ProjectResourceData;
}
//Detail task api response
export interface ProjectTaskDetailsApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ProjectTaskDetailsType;
}

//create task api payload
export interface ProjectTaskInput {
  account_rid: string;
  project_fiscal_rid: string;
  project_task_rid: string | null;
  resource_code: string;
  country_rid: string | null;
  region_rid: string | null;
  currency_rid: string | null;
  start_date: string | null;
  end_date: string | null;
  total_hours_pro_task: string | null;
  total_cost_pro_task: string | null;
  comments: string | null;
  user_preference: string;
  project_resource_rid: string;
}
//create task api response,
export interface createProjectTaskApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    projectTask: createProjectTaskResponseType;
  };
}

export interface createProjectTaskResponseType {
  rid: string;
  eid: string | null;
  created_by: string;
  created_datetime: string;
  account_rid: string;
  project_rid: string;
  resource_rid: string;
  project_resource_code: string;
  fiscal_year: number;
  start_date: string;
  end_date: string;
  total_hours_pro_task: string;
  total_cost_pro_task: string;
  country_rid: string;
  region_rid: string;
  currency_rid: string;
  comments: string;
  r_number: string;
  modified_by: string | null;
  modified_datetime: string | null;
}
export interface ProjectTaskStatusApiResponse extends CommonApiResponse {
  data: {
    updateStatus: number[];
  };
}
export type ProjectTaskStatusPayload = {
  rid: string;
  accountId: string;
  action: string;
  resourceCode: string;
  type: string;
};
