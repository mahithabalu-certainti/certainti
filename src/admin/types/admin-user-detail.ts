export interface Detail {
  label: string;
  value: string | number | undefined;
  full?: boolean;
}

// Base types for nested objects
type Profile = {
  profile_name: string;
};

type BusinessTeams = {
  business_teams: string;
};

type Status = {
  status_name: string;
};

// Main User type
export type User = {
  rid: string;
  r_number: string | null;
  eid: string | null;
  azure_id: string;
  ext_object_id: string | null;
  login_id: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  email: string;
  street: string | null;
  city: number | null; // Changed to number based on your example
  city_name: string | null; // Changed to number based on your example
  state: number | null; // Changed to number based on your example
  state_name: string | null; // Changed to number based on your example
  zip_code: string | null;
  country: number | null; // Changed to number based on your example
  country_name: string | null;
  role_rid: string;
  profile_rid: string;
  last_login_datetime: string | null;
  login_attempt_failure_count: number | null;
  status: Status;
  created_by: string;
  modified_by: string | null;
  createdAt: string;
  updatedAt: string;
  created_datetime: string;
  modified_datetime: string;
  profile: Profile;
  business_teams: BusinessTeams;
  phone: string;
  is_consultant_firm: string;
  org_name: string;
};

// Response status types
type StatusCodeValue = 'Success' | 'Error'; // Add other possible values

// Main API response type
export type ManageUserDetailApiResponse = {
  statusCode: number;
  statusCodeValue: StatusCodeValue;
  statusMessage: string;
  data: {
    users: User;
  };
};
export type ManageSetting = {
  rid: string;
  auto_send_interaction: boolean;
  auto_access_rd: false;
  email: string;
};
export type ConfigureManageSettingApiResponse = {
  statusCode: number;
  statusCodeValue: StatusCodeValue;
  statusMessage: string;
  data: {
    settings: ManageSetting;
  };
};
