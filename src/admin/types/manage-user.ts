import { CommonApiResponse, UserRoles } from '../../common-service';

export type ManageUser = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  profile: string;
  status: string;
};

export type ManageUserColumn = {
  id: string;
  header: string;
  sortable?: boolean;
};

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
export interface ManagerUserApiResponse extends CommonApiResponse {
  data: {
    users: User[];
  };
}

export interface ManagerUserDetailApiResponse extends CommonApiResponse {
  data: {
    users: UserDetail[];
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

// For your table component (simplified version)
// export type ManageUserList = {
//   id: string; // mapped from rid
//   username: string; // mapped from first_name
//   fullName: string; // mapped from full_name
//   email: string;
//   profile: string; // mapped from profile.profile_name
//   status: string;
//   businessTeam: string; // mapped from business_teams.business_teams
// };
