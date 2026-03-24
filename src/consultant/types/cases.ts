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
  case_total_qualified_project_cost: string | null;
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
  created_by: string;
  status_rid: string;
  account_rid: string;
  country_rid: string;
  fiscal_year: number;
  modified_by: string;
  status_name: string;
  account_name: string;
  country_code: string;
  country_name: string;
  currency_code: string;
  total_records: number;
  case_owner_rid: string;
  case_owner_name: string;
  currency_symbol: string;
  filing_type_rid: string;
  account_r_number: string;
  created_datetime: string;
  filing_type_name: string;
  approved_datetime: string | null;
  created_user_name: string;
  modified_datetime: string;
  updated_user_name: string;
  account_status_rid: string;
  account_status_name: string;
  submitted_datetime: string | null;
  case_total_rd_cost: string | null;
  case_total_projects: number | null;
  case_total_qre_cost: string | null;
  case_total_project_cost: string | null;
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
  parent_case_rid?: string;
  fiscal_year: number;
  status_rid: string;
  case_total_projects: string | number | null;
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
  is_initiated: boolean;
  country_rid: string;
  case_owner_name: string;
  created_by_name: string;
  modified_by_name: string | null;
  status_name: string;
  currency_code: string;
  currency_symbol: string;
  currency_rid: string;
  case_completion_percentage: string | null;
  case_total_qualified_projects: string | number | null;
  case_total_qualified_project_cost: string | null;
  country_code?: string;
  account_status_name?: string;
  account_status_rid?: string;
  is_send_interaction?: boolean;
  is_case_team_created?: boolean;
  is_state_available?: boolean;
  state_rid?: string;
  financial_working_signoff?: boolean;
  rd_form_signoff?: boolean;
  final_credit?: string | number | null;
  all_task_completed?: boolean;
  case_progress?: string;
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
  account_rid?: string;
  account_name?: string;
  case_owner?: string;
  parent_case_rid?: string;
  case_name?: string;
  description?: string;
  fiscal_year?: number;
  filing_type?: string;
  country?: string;
  case_startdate?: string;
  planned_submission_date?: string;
  statutory_submission_date?: string;
  heat_light_power?: string;
  total_nonlabor_cost?: string;
  tax_liability?: string;
  tax_liability_ga?: string | null;
  tax_liability_ct?: string | null;
  tax_liability_sc?: string | null;
  other_can?: string | null;
  other_on?: string | null;
  other_uk?: string | null;
  other_irl?: string | null;
  lease_costs_of_computers_az?: string | null;
  lease_costs_of_computers_ca?: string | null;
  lease_costs_of_computers_il?: string | null;
  lease_costs_of_computers_nj?: string | null;
  lease_costs_of_computers_id?: string | null;
  other_credits_total_ga?: string | null;
  other_credits_total_sc?: string | null;
  basic_research_payments_ma?: string | null;
  basic_research_payments_id?: string | null;
  status_rid?: string;
  total_expenses?: string | null;
  aggregated_turnover: string | null;
  unpaid_amounts_paid: string | null;
  unpaid_amounts: string | null;
  cloud_software: string | null;
  sub_contracts: string | null;
  public_sub_contracts: string | null;
  material_software_cost: string | null;
  employers_pension_contribution: string | null;
  taxable_income: string | null;
  export_sales_revenue: string | null;
  other: string | null;
  illinois_research_payments_corp_only: string | null;
  lease_costs_of_computers: string | null;
  qualified_computer_rental_time_expenses: string | null;
  basic_research_payments?: string | null;
  illinois_rd_credit_partnership_corp: string | null;
  credit_carry_forward_py_ga: string | null;
  credit_carry_forward_py_sc: string | null;
  credit_carry_forward_py_tx: string | null;
  current_year_gross_receipts: string | null;
}

export interface CaseFormPayload {
  case_rid?: string;
  account_rid: string;
  case_owner_rid: string;
  parent_case_rid?: string;
  case_name: string;
  description: string;
  fiscal_year: number;
  filing_type_rid: string;
  country_rid?: string;
  case_startdate: string;
  planned_submission_date: string;
  statutory_submission_date: string;
  heat_light_power?: string | null;
  total_nonlabor_cost?: string | null;
  tax_liability?: string | null;
  tax_liability_ga?: string | null;
  tax_liability_ct?: string | null;
  tax_liability_sc?: string | null;
  other_can?: string | null;
  other_on?: string | null;
  other_uk?: string | null;
  other_irl?: string | null;
  lease_costs_of_computers_az?: string | null;
  lease_costs_of_computers_ca?: string | null;
  lease_costs_of_computers_il?: string | null;
  lease_costs_of_computers_nj?: string | null;
  lease_costs_of_computers_id?: string | null;
  other_credits_total_ga?: string | null;
  other_credits_total_sc?: string | null;
  basic_research_payments_ma?: string | null;
  basic_research_payments_id?: string | null;
  basic_research_payments?: string | null;
  lease_costs_of_computers?: string | null;
  status_rid?: string;
  total_expenses?: string | null;
  aggregated_turnover: string | null;
  unpaid_amounts_paid: string | null;
  unpaid_amounts: string | null;
  cloud_software: string | null;
  sub_contracts: string | null;
  public_sub_contracts: string | null;
  material_software_cost: string | null;
  employers_pension_contribution: string | null;
  taxable_income: string | null;
  export_sales_revenue: string | null;
  illinois_research_payments_corp_only: string | null;
  qualified_computer_rental_time_expenses: string | null;
  illinois_rd_credit_partnership_corp: string | null;
  credit_carry_forward_py_ga: string | null;
  credit_carry_forward_py_sc: string | null;
  credit_carry_forward_py_tx: string | null;
  current_year_gross_receipts: string | null;
  // Nested amendment info (only sent on amendment create)
  amendment_case_info?: {
    fiscal_year: number;
    country_rid?: string;
    state_rid?: string;
    state_name?: string;
    is_federal?: boolean;
    total_project?: number;
    total_qualified_project?: number;
    total_qualified_project_cost?: number;
    total_fte_cost: number;
    total_subcon_cost: number;
    total_nonlabor_cost: number;
    total_project_cost: number;
    total_qre: number;
    total_rd_credits: number;
    annual_gross_receipts: number;
    action_type: 'add' | 'edit' | 'delete';
  }[];
}

export interface updateCaseJurisdictionPayload {
  case_rid?: string;
  account_rid: string;
  is_federal_level: boolean;
  is_state_level: boolean;
  states: string[];
  level?: string;
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
export interface CaseTaskExportParams {
  page: number;
  limit: number;
  sort: string;
  sort_by: 'ASC' | 'DESC';
  filter?: object;
  account_rid?: string;
  case_rid?: string;
  fiscal_year?: number;
  search?: string;
  timezone?: string;
  account_id?: string;
}

export interface CaseAssignedExportParams {
  page: number;
  limit: number;
  sort: string;
  sort_by: 'ASC' | 'DESC';
  filter?: object;
  account_rid?: string;
  case_rid?: string;
  fiscal_year?: number;
  search?: string;
  timezone?: string;
  account_id?: string;
  type?: string;
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
export interface CaseExportResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    data: string;
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

export interface CaseOwner {
  rid: string;
  name: string;
  email: string;
}

export interface CaseOwnersResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    caseOwners: CaseOwner[];
  };
}

export interface CaseSubmissionDate {
  caseSubmissionDate: string;
}

export interface CaseSubmissionDateResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: CaseSubmissionDate;
}

// Closed case list
export interface ClosedCaseList {
  rid: string;
  case_full_name: string;
  fiscal_year: string;
}

export interface ClosedCaseListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    cases: ClosedCaseList[];
  };
}
