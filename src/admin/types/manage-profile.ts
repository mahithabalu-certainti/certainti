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

export interface Depends_on {
  id: string;
  type: string;
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
