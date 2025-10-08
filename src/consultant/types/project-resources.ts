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
  accountNumber?: string;
  fiscalYear?: string | number;
  id?: string;
  projectid?: string;
}

export type ProjectResourcesListType = {
  rid?: string;
  project_rid?: string;
  account_rid?: string;
  resource_name: string | null;
  resource_code: string;
  resource_type_rid?: string;
  resource_orgname?: string | null;
  designation?: string | null;
  resource_role?: string | null;
  assigned_skill_role_type_rid?: string | null;
  skill_role_rid?: string | null;
  skill_role_others?: string | null;
  status_rid?: string | null;
  country_rid?: string | null;
  region_rid?: string;
  currency_rid?: string | null;
  start_date?: string | null;
  status_name?: string | null;
  end_date?: string | null;
  total_hours_pro_res?: string;
  total_cost_pro_res?: string;
  salary?: string | null;
  bonus?: string | null;
  insurance?: string | null;
  deductions?: string | null;
  description?: string | null;
  currency_symbol?: string;
  project_fiscal_rid?: string;
};

export interface ProjectResourcesApiResponse extends CommonApiResponse {
  data: {
    projectResources: ProjectResourcesListType[];
    count: number;
  };
}

export interface ProjectResourceDetailsType {
  rid: string;
  r_number: string;
  eid: string | null;
  created_by: string;
  modified_by: string;
  created_datetime: string;
  modified_datetime: string;
  account_rid: string;
  project_rid: string;
  resource_rid: string;
  fiscal_year: number;
  project_resource_code: string;
  project_resource_role: string;
  project_code: string;
  start_date: string | null;
  end_date: string | null;
  resource_code: string;
  resource_name: string;
  resource_type_rid: string;
  designation: string | null;
  resource_role: string | null;
  assigned_skill_role_type_rid: string | null;
  skill_role_rid?: string | null;
  skill_role_others?: string | null;
  total_hours_pro_res: number;
  total_cost_pro_res: string;
  status_rid: string | null;
  country_rid: string | null;
  region_rid: string;
  currency_rid: string | null;
  resource_orgname: string | null;
  effort_project_resource_level: number | null;
  cost_project_resource_level: number | null;
  qre_final: number | null;
  qre_percent: number | null;
  salary?: number | null;
  bonus?: number | null;
  insurance?: number | null;
  deductions: number | null;
  description: string | null;

  // Derived or display fields
  country_name: string | null;
  country_code: string | null;
  region_name: string | null;
  currency_name: string | null;
  currency_symbol: string;
  created_name: string | null;
  modified_name: string | null;
  status_name: string | null;
  resource_type_name: string | null;
  assigned_skill_role: string | null;
  project_fiscal_rid: string;
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
  projectResource: ProjectResourceDetailsType;
  attachment: [];
}

export interface ProjectResourceDetailsApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ProjectResourceData;
}

export interface ProjectResourceCodeResponse extends CommonApiResponse {
  data: {
    resourceCodes: ProjectResourceCodeData[];
  };
}
export interface ProjectResourceTaskCodeResponse extends CommonApiResponse {
  data: ProjectResourceTaskCodeData[];
}

interface ProjectResourceCodeData {
  resource_type_rid?: string;
  resource_type_name?: string;
  rid: string;
  resource_code: string;
  resource_name: string;
}
interface ProjectResourceTaskCodeData {
  rid: string;
  resource_code: string;
  resource_name: string;
  project_resource_role: string;
}
// skill type
export interface PRSkillSubTypeResponse extends CommonApiResponse {
  data: {
    resourceRolesSubType: ProjectResourceSkillSubTypeData[];
  };
}

interface ProjectResourceSkillSubTypeData {
  rid: string;
  skill_role_rid: string;
  sub_type_name: string;
}

//Role skill
export interface RoleSkillResponse extends CommonApiResponse {
  data: {
    resourceRoles: ProjectResourceRoleSkillData[];
  };
}

interface ProjectResourceRoleSkillData {
  rid: string;
  skill_role_name: string;
}

//create project resource payload type
export interface ProjectResourceNewPayload {
  rid?: string;
  project_resource_rid?: string;
  project_fiscal_rid: string;
  account_rid: string;
  resource_name?: string | null;
  resource_code: string;
  resource_type_rid: string;
  resource_orgname?: string | null;
  designation?: string | null;
  resource_role?: string | null;
  assigned_skill_role_type_rid?: string | null;
  skill_role_rid?: string | null;
  skill_role_others?: string | null;
  status_rid?: string | null;
  project_resource_role?: string | null;
  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  total_hours_pro_res?: string | null;
  total_cost_pro_res?: string | null;
  salary?: string | null;
  bonus?: string | null;
  insurance?: string | null;
  deductions?: string | null;
  description?: string | null;
}

//Row project resource items
export interface ProjectResourceRowItem {
  rid: string;
  r_number: string;
  eid: string | null;
  created_by: string;
  modified_by: string | null;
  created_datetime: string;
  modified_datetime: string | null;
  account_rid: string;
  project_rid: string;
  resource_rid: string;
  fiscal_year: number;
  project_resource_code: string;
  project_code: string;
  start_date: string | null;
  end_date: string | null;
  resource_code: string;
  resource_name: string | null;
  resource_type_rid: string;
  designation: string | null;
  resource_role: string | null;
  assigned_skill_role_type_rid: string | null;
  total_hours_pro_res: number | null;
  total_cost_pro_res: number | null;
  status_rid: string | null;
  country_rid: string | null;
  region_rid: string | null;
  currency_rid: string | null;
  resource_orgname: string | null;
  effort_project_resource_level: number | null;
  cost_project_resource_level: number | null;
  qre_final: number | null;
  qre_percent: number | null;
  salary: number | null;
  bonus: number | null;
  insurance: number | null;
  deductions: number | null;
  description: string | null;
  region_name: string | null;
  resource_type_name: string | null;
  _level: number;
  _type: 'parent' | 'child' | string;
}
export interface ProjectResourceStatusApiResponse extends CommonApiResponse {
  data: {
    updateStatus: number[];
  };
}
export type ProjectResourceStatusPayload = {
  rid: string;
  accountId: string;
  action: string;
  resourceCode: string;
  type: string;
};
