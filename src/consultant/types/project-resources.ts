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
  // accountNumber?: string;
  fiscalYear?: string | number;
  id?: string;
  projectRid?: string;
}

export type ProjectResourcesListType = {
  id: string;
  rid?: string;
  project_resource_id?: string;
  resource_number?: string;
  resource_code?: string;
  resource_ref_id?: string;
  resource_name: string;
  resource_type: string;
  resource_org_name: string;
  resource_role: string;
  status: ProjectResourceStatus;
  country: string;
  region: string;
  currency: string;
  cost: string | number;
  effort: number;
  // need to modidy list data based on mock data or api response
};

export interface ProjectResourcesApiResponse extends CommonApiResponse {
  data: {
    projectResources: ProjectResourcesListType[];
    count: number;
  };
}

export interface ProjectResourceDetailsType {
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
  projectResourceDetails: ProjectResourceDetailsType;
}

export interface ProjectResourceDetailsApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ProjectResourceData;
}
