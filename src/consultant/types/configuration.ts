import { CommonApiResponse } from '../../common-service';

export type SortOrder = 'ASC' | 'DESC';

export type ConfigAssignUserList = {
  rid: string;
  email: string;
  status_rid: string;
  first_name: string;
  org_id: string;
  is_consult_firm: boolean;
  is_grouped: boolean;
  has_access: boolean;
};

export interface ConfigAssignUserListParms {
  page: number;
  limit: number;
  entity_type: string;
  sortBy?: string;
  filters?: object;
  sortOrder?: SortOrder;
  search?: string;
}

export interface ConfigAssignUserListApiResponse extends CommonApiResponse {
  data: {
    users: ConfigAssignUserList[];
    count: number;
  };
}

export interface ConfigAssignGroupsListParms {
  page: number;
  limit: number;
  entity_type: string;
  sortBy?: string;
  filters?: object;
  sortOrder?: SortOrder;
  search?: string;
}

export type ConfigAssignGroupsList = {
  rid: string;
  group_name: string;
  is_consultant_only_group: boolean;
  group_type_name: string;
  group_type_description: string;
  type: string;
  has_access: boolean;
  user_count: string;
};

export interface ConfigAssignGroupsListApiResponse extends CommonApiResponse {
  data: {
    groups: ConfigAssignGroupsList[];
    count: number;
  };
}

//Mutation
export interface AssignUserAccess {
  account_rid: string;
  project_rid: string;
  user_rid?: string;
  access_type?: string;
  users?: userList;
  entity_type?: string;
  projects?: {
    [rid: string]: boolean;
  };
}

export type userList = [
  {
    rid: string;
    is_enabled: boolean;
    is_modified: boolean;
  },
];

export interface AssignUserAccessApiResponse extends CommonApiResponse {
  data: {
    source_profile_id: string;
  };
}
