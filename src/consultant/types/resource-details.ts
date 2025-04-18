interface Resource {
  rid: string;
  r_number: string;
  eid: string | null;
  resource_ref_id: string;
  resource_type: string;
  resource_firstname: string;
  resource_middlename: string;
  resource_lastname: string;
  resource_fullname: string;
  resource_orgname: string;
  resource_role: string;
  fiscal_year: number;
  resource_email: string;
  resource_mobile: string;
  country: string; // UUID format
  region: string; // UUID format
  currency: string; // UUID format
  cost_frequency: string;
  cost: string; // Consider using number if possible
  resource_startdate: string; // ISO date string
  resource_enddate: string; // ISO date string
  designation: string;
  manager_name: string;
  total_years_experience: number;
  total_years_in_org: number;
  resource_desc: string | null;
  resource_status: string;
  created_datetime: string; // ISO date string
  modified_datetime: string; // ISO date string
  created_by: string; // UUID format
  modified_by: string | null;
}

export interface ResourceData {
  resource: Resource;
}

export interface mockResourceDetailsApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ResourceData;
}

export interface ResourceDetailsProps {
  resourceDetails: mockResourceDetailsApiResponse;
}
