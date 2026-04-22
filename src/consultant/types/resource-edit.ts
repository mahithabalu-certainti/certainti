// Resource data types
export interface ResourceUpdata {
  resource_id: string;
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
  description: string | null;
  cost: number;
  cost_frequencty: string;
  resource_status: string;
  modified_by: string | null;
}

// API Response types
export interface ResourceData {
  resource: ResourceUpdata[];
}

export interface ResourceUpdateApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ResourceData;
}

// Update operation types
export interface ResourceUpdatePayload {
  resource_id: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  full_name?: string;
  org_name?: string;
  role?: string;
  email?: string;
  mobile?: string;
  designation?: string;
  manager_name?: string;
  description?: string | null;
  cost?: number;
  cost_frequencty?: string;
  resource_status?: string;
}

export interface ResourceUpdateResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    resource: number[]; // Array of affected resource counts
  };
}
