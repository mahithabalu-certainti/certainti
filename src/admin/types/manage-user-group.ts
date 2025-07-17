import { CommonApiResponse } from '../../common-service';

// Complete API Response Type
export interface UserGroupApiResponse extends CommonApiResponse {
  data: {
    usergroup: UserGroup[];
    count: number;
  };
}

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
  account_name: string | null;
};
