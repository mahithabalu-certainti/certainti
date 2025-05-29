export interface ResourceDetailsTypes {
  account_id: string;
  account_number: string;
  rid: string;
  r_number: string;
  eid: string | null;
  resource_code: string;
  resource_region: string;
  resource_designation: string;
  resource_city: string;
  resource_type: string;
  resource_name: string;
  resource_firstname: string;
  resource_lastname: string;
  resource_orgname: string;
  resource_org_name?: string;
  resource_role: string;
  fiscal_year: number;
  country_name: string;
  resource_country: string;
  region_name: string; // UUID format
  city_name: string; // UUID format
  city: string; // UUID format
  resource_startdate: string; // ISO date string
  resource_enddate: string; // ISO date string
  designation: string;
  resource_total_experience: number;
  resource_total_experience_organization: number;
  resource_status: string;
  created_datetime: string; // ISO date string
  modified_datetime: string; // ISO date string
  created_by: string; // UUID format
  modified_by: string | null;
  comments: string;
  resource_number?: string;
  country?: string;
  state?: string;
}

export interface ResourceDetailsForPayload {
  account_id: string;
  account_number: string;
  rid: string;
  r_number: string;
  eid: string | null;
  resource_code: string;
  resource_type: string;
  resource_name: string;
  resource_orgname: string;
  resource_role: string;
  fiscal_year: number;
  country: string;
  state: string; // UUID format
  city: string; // UUID format
  resource_startdate: string; // ISO date string
  resource_effective_from?: string; // ISO date string
  resource_end_date?: string; // ISO date string
  resource_enddate: string; // ISO date string
  designation: string;
  total_years_of_experience?: number;
  total_years_experience: number;
  total_years_in_org: number;
  resource_status: string;
  created_datetime: string; // ISO date string
  modified_datetime: string; // ISO date string
  created_by: string; // UUID format
  modified_by: string | null;
  comments: string;
  resource_number?: string;
  resource_firstname?: string;
  resource_lastname?: string;
}

export interface CreateSectionData {
  account_id: string;
  account_number: string;
  rid: string;
  r_number: string;
  eid: string | null;
  resource_ref_ID: string;
  resource_code: string;
  resource_type: string;
  resource_fullname: string;
  resource_orgname: string;
  resource_role: string;
  fiscal_year: number;
  country: string;
  country_name: string;
  region_name: string; // UUID format
  region?: string; // UUID format
  city: string; // UUID format
  resource_startdate: string; // ISO date string
  resource_enddate: string; // ISO date string
  designation: string;
  total_years_experience: number;
  total_years_in_org: number;
  status: string;
  first_name?: string;
  last_name?: string;
  role: string;
  created_datetime: string; // ISO date string
  modified_datetime: string; // ISO date string
  created_by: string; // UUID format
  modified_by?: string | null;
  comments: string;
  resource_number?: string;
  record_id?: string;
  resource_id?: string;
  Created_On?: string;
  Created_By?: string;
  Updated_On?: string;
  Updated_By?: string | null;
}
interface ResourceData {
  resourceDetails: ResourceDetailsTypes;
}

export interface ResourceDetailsApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ResourceData;
}

export interface ResourceDetailsProps {
  resourceDetails: ResourceDetailsApiResponse;
}
