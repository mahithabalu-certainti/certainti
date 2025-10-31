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
  isGlobal?: boolean;
  search?: string;
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
  case_total_projects: number | null;
  case_total_project_cost: string | null;
  case_total_rd_cost: string | null;
  case_total_qre_cost: string | null;
  filing_type_rid: string;
  filing_type_name: string;
  status_rid: string;
  status_name: string;
  created_by: string;
  created_user_name: string;
  modified_by: string | null;
  modified_user_name: string | null;
  created_datetime: string;
  modified_datetime: string | null;
  submitted_datetime: string | null;
  approved_datetime: string | null;
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

// Global case list
export type CaseGlobalList = {
  rid: string;
  r_number: string;
  case_name: string;
  description: string;
  fiscal_year: number;
  case_owner_rid: string;
  case_owner_name: string;
  case_total_projects: number | null;
  case_total_project_cost: string | null;
  case_total_rd_cost: string | null;
  case_total_qre_cost: string | null;
  filing_type_rid: string;
  filing_type_name: string;
  status_rid: string;
  status_name: string;
  created_by: string;
  created_user_name: string;
  modified_by: string | null;
  modified_user_name: string | null;
  created_datetime: string;
  modified_datetime: string | null;
  submitted_datetime: string | null;
  approved_datetime: string | null;
  account_rid?: string;
  account_name?: string;
  account_number?: string;
  country_rid?: string;
  country_name?: string;
  currency_symbol?: string;
};

export interface CaseGlobalListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    caseInfo: CaseGlobalList[];
    count: number;
  };
}

// Details
export interface CaseDetails {
  rid: string;
  account_rid: string;
  account_name: string;
  case_name: string;
  filing_type_rid: string;
  case_owner_rid: string;
  fiscal_year: number;
  status_rid: string;
  case_total_projects: number | null;
  case_total_project_cost: string | null;
  case_total_rd_cost: string | null;
  case_total_qre_cost: string | null;
  planned_submission_date: string | null;
  statutory_submission_date: string | null;
  case_startdate: string | null;
  description: string | null;
  r_number: string;
  created_by: string;
  modified_by: string | null;
  created_datetime: string;
  modified_datetime: string | null;
  account_rnumber: string;
  filing_type_name: string;
  country_name: string;
  country_rid: string;
  case_owner_name: string;
  created_by_name: string;
  modified_by_name: string | null;
  status_name: string;
  currency_code: string;
  currency_rid: string;
  case_completion_percentage: string | null;
  case_total_qualified_projects: string | null;
  case_total_qualified_project_cost: string | null;
  country_code?: string;
}

export interface CaseDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: CaseDetails;
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
  country_rid?: string;
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

export interface CaseListExportParams {
  sortBy?: string;
  sortOrder?: CaseSortOrder;
  filters?: object;
  fiscalYear?: number | string;
  globalFilters?: CaseGlobalFilters;
  timezone?: string;
  isGlobal?: boolean;
  search?: string;
}
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

//Case status
export interface CaseStatus {
  rid: string;
  status_name: string;
}

export interface CaseStatusResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    caseStatus: CaseStatus[];
  };
}
