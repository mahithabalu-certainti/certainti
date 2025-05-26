export type ManageProfile = {
  id: string;
  profileName: string;
  createdOn: string;
  createdBy: string;
};
 

export type ManageProfileList = {
  rid: string;
  sort?: string;
  r_number: string;
  profile_name: string;
  profile_description: string;
  profile_type: string;
  profile_status: string;
  created_datetime: string;
  modified_datetime: string;
  created_by: string | null;
  modified_by: string | null;
};
export interface ProfileTableColumn<T> {
  id: string;
  label: string;
  sort?: string;
  width?: string;
  sortId: string;
  sortable?: boolean;
  sticky?: boolean;
  sx?: React.CSSProperties;
  render?: (row: T) => React.ReactNode;
}

export interface ProfileDetail {
  source_profile_id: string; 
  profile_name: string;
  profile_description: string;
  profile_type: string;
}
 
export interface UserPermissionsResponse {
  rid: string;
  type: 'menu' | 'module' | 'permission' | 'field'; // adjust if there are other types
  menu_id: string;
  module_id?: string;
  name: string;
  desc: string;
  is_enabled: boolean;
}
 
export interface CommonProfileApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    source_profile_id: string;
    rid: string;
    user_role: string;
    user_id: string;
    profile_id: string;
    permissions: UserPermissionsResponse[];
  };
}

export interface ProfilePermission {
  profile_id: string;
  profile_name: string;
  privileges: Privilege[];
}

export interface Privilege {
  rid: string;
  type: 'menu' | 'module' | 'permission' | 'field';
  menu_id?: string;
  module_id?: string;
  permission_id?: string;
  field_id?: string;
  name: string;
  desc: string;
  is_enabled?: boolean;
  is_modified?: boolean;
  is_field_available?: boolean;
  read?: boolean;
  edit?: boolean;
}
export interface ProfileHeaderData {
  profile_id: string;
  profile_number: string;
  source_profile_id: string;
  profile_name: string;
}

export interface ProfileHeaderResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ProfileHeaderData;
}

// create profile permision api input types 
interface PrivilegePermission {
  rid: string;
  type: 'menu' | 'module' | 'permission' | 'field';
  menu_id?: string;
  module_id?: string;
  permission_id?: string;
  field_id?: string;
  name: string;
  desc: string;
  is_enabled?: boolean;
  is_modified?: boolean;
  is_field_available?: boolean;
  read?: boolean;
  edit?: boolean;
}

export interface ProfilePermission {
  profile_id: string;
  profile_name: string;
  privileges: PrivilegePermission[];
}
// create profile permision api response types 
interface ProfilePermissionResponse {
  profile_id: string;
  updated_permission_count: number;
}

export interface CommonProfilePermissionApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ProfilePermissionResponse;
  requestId: string;
}

// In profile permision, - clone api reponse types
interface PrivilegeClone {
  rid: string;
  type: 'menu' | 'module' | 'permission' | 'field';
  menu_id?: string;
  module_id?: string;
  permission_id?: string;
  field_id?: string;
  name: string;
  desc: string;
  is_enabled?: boolean;
  read?: boolean;
  edit?: boolean;
}

interface ProfileData {
  profile_id: string;
  profile_number: string;
  source_profile_id: string;
  profile_name: string;
  privileges: PrivilegeClone[];
}

export interface CommonCloneApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ProfileData;
  requestId?: string;
}