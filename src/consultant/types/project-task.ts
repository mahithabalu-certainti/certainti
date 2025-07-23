import { CommonApiResponse } from '../../common-service';

export enum ProjectResourceStatus {
  active = 'Active',
  inactive = 'Inactive',
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
  id: string;
  project_resource_number?: string;
  project_resource_id?: string;
  resource_code?: string;
  project_resource_code?: string;
  resource_name?: string;
  project_name?: string;
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
  comments?: string;
  fiscal_year?: string;
  created_on?: string;
  created_by?: string;
  updated_on?: string;
  updated_by?: string;
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
