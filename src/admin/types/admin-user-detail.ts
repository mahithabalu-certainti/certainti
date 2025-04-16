export interface Detail {
  label: string;
  value: string | number | undefined;
}

// Base types for nested objects
type Profile = {
  profile_name: string;
};

type BusinessTeams = {
  business_teams: string;
};

// Main User type
type User = {
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
  state: number | null; // Changed to number based on your example
  zip_code: string | null;
  country: number | null; // Changed to number based on your example
  role_rid: string;
  profile_rid: string;
  last_login_datetime: string | null;
  login_attempt_failure_count: number | null;
  status: 'active' | 'inactive' | 'suspended';
  created_by: string;
  modified_by: string | null;
  createdAt: string;
  updatedAt: string;
  created_datetime: string;
  modified_datetime: string;
  profile: Profile;
  business_teams: BusinessTeams;
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
