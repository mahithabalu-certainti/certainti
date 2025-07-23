import { CommonApiResponse } from '../../common-service';

export type SortOrder = 'ASC' | 'DESC';
export type FilterCondition = {
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  equals?: string | number | boolean;
  // Add other filter conditions as needed
};
export type Filters = Record<string, FilterCondition>;
export interface UserAccountListParams {
  entity_type: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Filters;
  searchTerm?: string;
  exportKey?: string;
  timezone?: string;
}
export interface ManageAccountsProjectList {
  project_rid: string;
  project_name: string;
  project_code: string;
  account_rid: string;
  access_type: string;
  has_access: boolean;
}
export type ManageAccountsGroupList = {
  rid: string;
  group_name: string;
  is_consultant_only_group: boolean;
  group_type_name: string;
  group_type_description: string;
  type: string;
  has_access: boolean;
  user_count: string;
};
export type ManageAccountsUserList = {
  rid: string;
  email: string;
  status_rid: string;
  frist_name: string;
  org_id: string;
  is_consult_firm: boolean;
  is_grouped: boolean;
  has_access: boolean;
};
export interface ManageUserListParms {
  entity_type: string;
  sortBy?: string;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}
export interface ManageAccountUserListApiResponse extends CommonApiResponse {
  data: {
    users: ManageAccountsUserList[];
    count: number;
  };
}
export interface ManageAccountGroupListApiResponse extends CommonApiResponse {
  data: {
    groups: ManageAccountsGroupList[];
    count: number;
  };
}
export interface ManageAccountProjectListApiResponse extends CommonApiResponse {
  data: {
    projects: ManageAccountsProjectList[];
    count: number;
  };
}
export type ManageAccountList = {
  rid?: string;
  group_name?: string;
  is_consultant_only_group?: boolean;
  group_type_name?: string;
  first_name?: string;
  project_code?: string;
  project_name?: string;
  account_name?: string;
};
export interface AccountAccessDetail {
  account_rid: string;
  access_type: string;
  users?: userList;
  groups?: userList;
}
export type userList = [
  {
    rid: string;
    is_enabled: boolean;
    is_modified: boolean;
  },
];
export interface AccountAccessParms {
  account_rid: string;
  access_type: string;
  users?: userList;
  groups?: userList;
}

export interface ProfileResponse {
  depended_by_module?: string[];
}
export interface ManageAccountResponse {
  source_profile_id: string;
}
export interface ManageProjectResponse {
  source_profile_id: string;
}
export interface AccountAccessApiResponse extends CommonApiResponse {
  data: ManageAccountResponse;
}
export interface AccountProjectApiResponse extends CommonApiResponse {
  data: ManageProjectResponse;
}
