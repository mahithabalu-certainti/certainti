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
  entity_type: string;
  sortBy?: string;
  filters?: string;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface ConfigAssignUserListApiResponse extends CommonApiResponse {
  data: {
    users: ConfigAssignUserList[];
    count: number;
  };
}

//Mutation
export interface AssignUserAccess {
  account_rid: string;
  user_rid?: string;
  access_type?: string;
  users?: userList;
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
