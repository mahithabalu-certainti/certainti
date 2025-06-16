import { CommonApiResponse, UserRoles } from '../../common-service';
import { Privilege } from './manage-profile';

export type ManageUser = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  profile: string;
  status: 'Active' | 'Inactive';
  created_datetime: string;
  modified_datetime: string;
  role: string;
};

export interface UserTableColumn<T> {
  id: string;
  label: string;
  width: string | number;
  sortId: string;
  sortable?: boolean;
  sticky?: boolean;
  sx?: React.CSSProperties;
  render?: (row: T) => React.ReactNode;
}

export type SortOrder = 'ASC' | 'DESC';

export type FilterCondition = {
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  equals?: string | number | boolean;
  // Add other filter conditions as needed
};

export type Filters = Record<string, FilterCondition>;

export interface UserListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Filters;
  searchTerm?: string;
  exportKey?: string;
  timezone?: string;
}

// User Profile Type
export interface UserProfile {
  profile_name: string;
}

// Business Teams Type
export interface BusinessTeams {
  business_teams: string;
}

// Individual User Type
export interface User {
  rid: string;
  email: string;
  status: string;
  full_name: string;
  first_name: string;
  profile: UserProfile;
  business_teams: BusinessTeams;
  created_datetime: string;
  modified_datetime: string;
}

export interface Profile {
  rid: string;
  createdBy: string;
  createdOn: string;
  profileName: string;
}
export interface Profiles {
  rid: string;
  created_by: string;
  created_datetime: string;
  profile_name: string;
  profile_type: string;
  profile_status: string;
}

// User details
export interface UserDetail {
  rid: string;
  email: string;
  status: string;
  full_name: string;
  first_name: string;
  last_name: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  profile_rid: string;
  role: string;
  role_rid: string;
  azure_id: string;
  organization: string;
  profile_id: string;
  updated_by: UserRole;
  phone?: string;
  r_number: string;
  created_by: string;
  modified_by: string;
  created_datetime: string;
  modified_datetime: string;
  country_name?: string;
  state_name?: string;
  profile: {
    profile_name: string;
  };
  business_teams: {
    business_teams: string;
  };
  org_id: string;
  is_consultant_firm: boolean;
}

export enum UserRole {
  Admin = 'Admin',
  Consultant = 'Consultant',
}

export interface Profiles {
  rid: string;
  profile_name: string;
  profile_description: string;
}

export interface Roles {
  rid: string;
  business_teams: UserRoles;
}

// API Response Data Type
export interface UsersData {
  users: User[];
}

// Complete API Response Type
export interface ManageUserApiResponse extends CommonApiResponse {
  data: {
    users: User[];
    count: number;
  };
}

export interface ManageProfileApiResponse extends CommonApiResponse {
  data: {
    profiles: Profiles[];
    count: number;
  };
}

export interface ManageUserDetailApiResponse extends CommonApiResponse {
  data: {
    users: UserDetail;
  };
}

export interface UserProfileApiResponse extends CommonApiResponse {
  data: {
    profiles: Profiles[];
  };
}

export interface UserRolesApiResponse extends CommonApiResponse {
  data: {
    roles: Roles[];
  };
}

// User Permission Types
interface UserPermissionData {
  rid: string;
  user_role: string;
  user_id: string;
  user_name: string;
  permissions: Privilege[];
}

export interface UserPermissionApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: UserPermissionData;
}

// orgname api response

export interface accountInfo {
  rid: string;
  account_name: string;
  organisation_name: string;
}
export interface orgData {
  logo_url: string;
  firm_name: string;
}
export interface OrgNameData {
  accountData: accountInfo[];
  orgData: orgData;
}
export interface OrgNameApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: OrgNameData;
  requestId: string;
}
