// Define types for the resource create payload
export interface ResourceCreatePayload {
  account_id: string;
  account_number: string;
  resource_ref_id: string;
  resource_type: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  org_name: string;
  role: string;
  fiscal_year: string;
  email: string;
  mobile: string;
  country: string;
  region: string;
  currency: string;
  effective_from_date: string;
  effective_end_date: string;
  designation: string;
  manager_name: string;
  total_years_experience: number;
  total_years_in_org: number;
  description: string;
  cost: number;
  cost_frequencty: string;
  resource_status: string;
  created_by: string;
}

// Define types for the resource in the API response
export interface Resource {
  rid: string;
  resource_code: string;
  created_datetime: string;
  modified_datetime: string;
  resource_ref_id: string;
  resource_type: string;
  fiscal_year: number;
  resource_firstname: string;
  resource_middlename: string;
  resource_lastname: string;
  resource_fullname: string;
  resource_status: string;
  resource_email: string;
  resource_mobile: string;
  resource_orgname: string;
  resource_startdate: string;
  resource_enddate: string;
  resource_role: string;
  region: string;
  country: string;
  currency: string;
  designation: string;
  manager_name: string;
  total_years_experience: number;
  total_years_in_org: number;
  cost_frequency: string;
  cost: string;
  created_by: string;
  modified_by: null | string;
  account_rid: string;
  r_number: string;
  eid: null | string;
  resource_desc: null | string;
}

// Define type for the API response
export interface ResourceCreateApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    resource: Resource;
  };
}
