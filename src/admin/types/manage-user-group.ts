import { CommonApiResponse } from '../../common-service';
import { FilterType } from './common';

// Complete API Response Type
export interface UserGroupApiResponse extends CommonApiResponse {
  data: {
    usergroup: UserGroup[];
    count: number;
  };
}

export interface UserGroupTypesApiResponse extends CommonApiResponse {
  data: {
    groupTypes: UserGroupTypes[];
  };
}

export interface ActiveUserForGroupApiResponse extends CommonApiResponse {
  data: {
    users: ActiveUserForGroup[];
    count: number;
  };
}

export interface UserGroupDetailsApiResponse extends CommonApiResponse {
  data: {
    userGroupById: UserGroupById;
  };
}

export interface GroupByIdUsers extends ActiveUserForGroup {
  has_access: boolean;
}

export interface GroupByIdAccount {
  rid: string;
  account_name: string;
  has_access: boolean;
}

export interface GroupByIdProjects {
  project_rid: string;
  project_name: string;
  project_code: string;
  account_rid: string;
  account_name: string;
  has_access: boolean;
  access_type: string;
}

export interface UserGroupById {
  rid: string;
  r_number: string;
  created_by: string;
  modified_by: string | null;
  created_datetime: string; // ISO string, can use `Date` if you parse it
  modified_datetime: string | null;
  group_name: string;
  group_type_rid: string;
  is_consultant_only_group: boolean;
  status_rid: string;
  group_type: string;
  users: GroupByIdUsers[];
  accounts: GroupByIdAccount[];
  projects: GroupByIdProjects[];
}

export type ProjectFiscal = {
  project_code: string;
  project_group: string | null;
  project_name: string | null;
  project_type_name: string | null;
  project_type_rid: string | null;
  fiscal_year: number;
  project_client_group: string | null;
  project_classification_rid: string | null;
  account_name: string;
  qre: string | null;
  classification_name: string | null;
  project_classification_other: string | null;
  total_effort: string | null;
  total_cost: string | null;
  total_cost_fte: string | null;
  total_cost_subcon: string | null;
  total_cost_nonlabor: string | null;
  assessment_status: string | null;
  created_datetime: string; // ISO date string
  qre_final: number;
  project_point_of_contact: string | null;
  technical_point_of_contact: string | null;
  comments: string | null;
  modified_datetime: string | null; // ISO date string
  project_rid: string;
  project_fiscal_rid: string;
  r_number: string;
  account_rid: string;
  currency_code: string;
  currency_symbol: string;
};

export type ActiveUserForGroup = {
  rid: string;
  email: string;
  status_rid: string;
  first_name: string;
  org_id: string;
  is_consultant_firm: boolean;
  organization_name: string;
};

export type UserGroupTypes = {
  rid: string;
  group_type_name: string;
  group_type_description: string;
  type: string;
  is_consultant_only_group: boolean;
};

interface User {
  first_name: string;
  last_name: string;
}

interface UserGroupType {
  group_type_name: string;
  type: string;
}

export interface UserGroup {
  rid: string;
  created_datetime: string;
  modified_datetime: string | null;
  group_name: string;
  is_consultant_only_group: boolean;
  group_type_rid: string;
  user_count: string;
  user: User;
  usergrouptype: UserGroupType;
  account_name: string | null;
}

export type UserGroupList = {
  rid: string;
  sort?: string;
  created_datetime: string;
  modified_datetime: string | null;
  group_name: string;
  is_consultant_only_group: string;
  group_type_rid: string;
  user_count: string;
  user: User;
  usergrouptype: string;
  usergroup_type: string;
  account_name: string | null;
};

export interface UserGroupParam {
  [key: string]: unknown;
}

export interface UserGroupDetailsCommon {
  rid: string;
  is_enabled: boolean;
  is_modified?: boolean;
}

export interface UserGroupDetails {
  group_name: string;
  is_consultant_only_group: boolean;
  group_type_rid: string;
  accounts: UserGroupDetailsCommon[];
  users: UserGroupDetailsCommon[];
  projects: { [key: string]: boolean };
}

export interface UserGroupUpdateDetails extends Partial<UserGroupDetails> {
  group_rid: string;
}

export interface FetchUsersByAccountBody {
  page: number;
  limit: number;
  is_consultant_only_group: boolean;
  account_rid: string[];
  group_type_rid?: string;
  group_rid?: string;
  filters?: Record<string, FilterType>;
  sortBy?: string;
  sortOrder?: string;
}
