export type CaseSortOrder = 'ASC' | 'DESC';

export interface CaseGlobalFilters {
  [key: string]: string[];
}

export interface CaseListParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: CaseSortOrder;
  fiscalYear?: number | string;
  filters?: object;
  searchTerm?: string;
  timezone?: string;
  globalFilters?: CaseGlobalFilters;
}

// List
export type CaseList = {
  rid: string;
  r_number: string;
  case_name: string;
  description: string;
  fiscal_year: number;
  case_owner_rid: string;
  case_owner_name: string;
  total_projects: number | null;
  total_projects_cost: number | null;
  total_project_rd_credits: number | null;
  total_qre_cost: number | null;
  filing_type_rid: string;
  filing_type_name: string;
  status_rid: string;
  status_name: string;
  created_by: string;
  created_user_name: string;
  modified_by: string | null;
  modified_user_name: string | null;
  created_datetime: string; // ISO timestamp
  modified_datetime: string | null;
  submitted_on?: string | null;
  approved_on?: string | null;
};

export interface CaseListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    caseInfo: CaseList[];
    count: number;
  };
}

// Details
export interface CaseDetails {
  rid: string;
  r_number: string;
  account_id: string;
  account_name: string;
  filing_type_rid: string;
  filing_type_name: string;
  case_name: string;
  case_owner_rid: string;
  case_owner_name: string;
  fiscal_year: number;
  country: string;
  country_rid: string;
  start_date: string;
  planned_submission_date: string;
  statutory_submission_date: string;
  description: string;
  created_by: string;
  created_user_name: string;
  created_datetime: string;
  modified_by?: string | null;
  modified_user_name?: string | null;
  modified_datetime?: string | null;
}

export interface CaseDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    caseDetails: CaseDetails;
  };
}

//Form

export interface CaseFormFields {
  account_id?: string;
  account_name?: string;
  case_owner?: string;
  case_name?: string;
  description?: string;
  fiscal_year?: number;
  filing_type?: string;
  country?: string;
  case_startdate?: string;
  planned_submission_date?: string;
  statutory_submission_date?: string;
}

export interface CaseFormPayload {
  case_rid?: string;
  account_rid: string;
  case_owner_rid: string;
  case_name: string;
  description: string;
  fiscal_year: number;
  filing_type_rid: string;
  country_rid: string;
  case_startdate: string;
  planned_submission_date: string;
  statutory_submission_date: string;
}

export interface CreateCaseApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    cases: CaseDetails[];
  };
}

// Export
export interface ExportCaseListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: string;
}

// Case filling type
export interface CaseFilingType {
  rid: string;
  filing_type_name: string;
}

export interface CaseFilingTypeResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    caseFilingType: CaseFilingType[];
  };
}
