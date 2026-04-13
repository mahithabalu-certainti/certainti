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

  // Newly added missing fields
  effective_progress?: string | number | null;
  total_nonlabor_cost?: string | number | null;
  heat_light_power?: string | number | null;
  tax_liability_sc?: string | number | null;
  tax_liability_ct?: string | number | null;
  tax_liability_ga?: string | number | null;
  employers_pension_contribution?: string | number | null;
  other_can?: string | number | null;
  other_uk?: string | number | null;
  other_on?: string | number | null;
  other_irl?: string | number | null;
  material_software_cost?: string | number | null;
  sub_contracts?: string | number | null;
  cloud_software?: string | number | null;
  unpaid_amounts_paid?: string | number | null;
  unpaid_amounts?: string | number | null;
  aggregated_turnover?: string | number | null;
  total_expenses?: string | number | null;
  taxable_income?: string | number | null;
  export_sales_revenue?: string | number | null;
  lease_costs_of_computers_nj?: string | number | null;
  lease_costs_of_computers_il?: string | number | null;
  lease_costs_of_computers_ca?: string | number | null;
  lease_costs_of_computers_az?: string | number | null;
  lease_costs_of_computers_id?: string | number | null;
  illinois_rd_credit_partnership_corp?: string | number | null;
  illinois_research_payments_corp_only?: string | number | null;
  basic_research_payments_ma?: string | number | null;
  basic_research_payments_id?: string | number | null;
  basic_research_payments_dc?: string | number | null;
  basic_research_payments_ia?: string | number | null;
  energy_consortia_amount_dc?: string | number | null;
  qualified_org_baseamount_dc?: string | number | null;
  lease_costs_of_computers_dc?: string | number | null;
  qualified_computer_rental_time_expenses?: string | number | null;
  credit_carry_forward_py_ga?: string | number | null;
  credit_carry_forward_py_sc?: string | number | null;
  credit_carry_forward_py_tx?: string | number | null;
  current_year_gross_receipts?: string | number | null;
  other_credits_total_sc?: string | number | null;
  other_credits_total_ga?: string | number | null;
  qualified_org_baseamount_ia?: string | number | null;
  non_qualifying_wages_ia?: string | number | null;
  non_qualifying_contract_expenses_ia?: string | number | null;
  cost_of_supplies_ia?: string | number | null;
  rac_share_ia?: string | number | null;
  supplement_rac_ia?: string | number | null;
  passthrough_supplement_rac_ia?: string | number | null;
  tax_liability_ks?: string | number | null;
  machinery_equipments_ks?: string | number | null;
  llet_credit_ky?: string | number | null;
  corporation_tax_credit_ky?: string | number | null;
  individual_tax_credit_ky?: string | number | null;
  credit_carry_forward_py_me?: string | number | null;
  nonprofit_development_contributions_mn?: string | number | null;
  basic_research_amount_mn?: string | number | null;
  credit_carry_over_mn?: string | number | null;
  credit_tax_limit_mn?: string | number | null;
  lease_costs_of_computers_mn?: string | number | null;
  off_campus_research_expenses_ne?: string | number | null;
  payroll_factor_on_campus_ne?: string | number | null;
  payroll_factor_off_campus_ne?: string | number | null;
  property_factor_on_campus_ne?: string | number | null;
  property_factor_off_campus_ne?: string | number | null;
  credit_distributed_ne?: string | number | null;
  credit_tax_refunds_ne?: string | number | null;
  basic_research_payments_vt?: string | number | null;
  energy_consortia_amount_vt?: string | number | null;
  qualified_org_baseamount_vt?: string | number | null;
  lease_costs_of_computers_vt?: string | number | null;
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

  // ============ US - Iowa (IA) ============
  basic_research_payments_ia?: number | null;
  qualified_org_baseamount_ia?: number | null;
  cost_of_supplies_ia?: number | null;
  rac_share_ia?: number | null;
  supplemental_rac_ia?: number | null;
  pass_through_supplemental_rac_ia?: number | null;
  non_qualifying_ia_wages?: number | null;

  // ============ US - Maine (ME) ============
  credit_carry_forward_py_me?: number | null;

  // US - Kansas (KS)
  tax_liability_ks?: number | null;
  machinery_equipments_ks?: number | null;
  // ============ US - District of Columbia (DC) ============
  basic_research_payments_dc?: number | null;
  energy_consortia_amount_dc?: number | null;
  qualified_org_baseamount_dc?: number | null;
  lease_costs_of_computers_dc?: number | null;

  // ============ US - Kentucky (KY) ============
  llet_credit_ky?: number | null;
  corporation_tax_credit_ky?: number | null;
  individual_tax_credit_ky?: number | null;

  // US - Minnesota (MN)
  nonprofit_development_contributions_mn?: number | null;
  basic_research_amount_mn?: number | null;
  credit_carry_over_mn?: number | null;
  credit_tax_limit_mn?: number | null;
  lease_costs_of_computers_mn?: number | null;
  // US - Nebraska (NE)
  off_campus_research_expenses_ne?: number | null;
  payroll_factor_on_campus_ne?: number | null;
  payroll_factor_off_campus_ne?: number | null;
  property_factor_on_campus_ne?: number | null;
  property_factor_off_campus_ne?: number | null;
  credit_distributed_ne?: number | null;
  credit_tax_refunds_ne?: number | null;
  // US - Vermont (VT)
  credit_attributable_to_shared_wages_vt?: number | null;
  basic_research_payments_vt?: number | null;
  energy_consortia_amount_vt?: number | null;
  qualified_org_baseamount_vt?: number | null;
  lease_costs_of_computers_vt?: number | null;

  // US - Virginia (VA)
  credit_requested_not_exceed_va?: number | null;
  college_credit_requested_not_exceed_va?: number | null;
  total_eligible_research_expenses_va?: number | null;

  // US - Wisconsin (WI)
  research_supplies_expenses_wi?: number | null;
  total_pass_through_credits_wi?: number | null;
  computer_rental_expenses_wi?: number | null;
  fiduciary_beneficiary_credit_wi?: number | null;
  orphan_drug_research_expenses_wi?: number | null;
  credit_offset_tax_wi?: number | null;
  credit_carry_forward_py_wi?: number | null;
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
  // ============ US - District of Columbia (DC) ============
  basic_research_payments_dc?: number | null;
  energy_consortia_amount_dc?: number | null;
  qualified_org_baseamount_dc?: number | null;
  lease_costs_of_computers_dc?: number | null;

  // ============ US - Kentucky (KY) ============
  llet_credit_ky?: number | null;
  corporation_tax_credit_ky?: number | null;
  individual_tax_credit_ky?: number | null;

  // ============ US - Iowa (IA) ============
  basic_research_payments_ia?: number | null;
  qualified_org_baseamount_ia?: number | null;
  cost_of_supplies_ia?: number | null;
  rac_share_ia?: number | null;
  supplemental_rac_ia?: number | null;
  pass_through_supplemental_rac_ia?: number | null;
  non_qualifying_ia_wages?: number | null;

  // ============ US - Maine (ME) ============
  credit_carry_forward_py_me?: number | null;
  // US - Kansas (KS)
  tax_liability_ks?: number | null;
  machinery_equipments_ks?: number | null;

  // US - Minnesota (MN)
  nonprofit_development_contributions_mn?: number | null;
  basic_research_amount_mn?: number | null;
  credit_carry_over_mn?: number | null;
  credit_tax_limit_mn?: number | null;
  lease_costs_of_computers_mn?: number | null;

  // US - Nebraska (NE)
  off_campus_research_expenses_ne?: number | null;
  payroll_factor_on_campus_ne?: number | null;
  payroll_factor_off_campus_ne?: number | null;
  property_factor_on_campus_ne?: number | null;
  property_factor_off_campus_ne?: number | null;
  credit_distributed_ne?: number | null;
  credit_tax_refunds_ne?: number | null;

  // US - Vermont (VT)
  credit_attributable_to_shared_wages_vt?: number | null;
  basic_research_payments_vt?: number | null;
  energy_consortia_amount_vt?: number | null;
  qualified_org_baseamount_vt?: number | null;
  lease_costs_of_computers_vt?: number | null;
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
export interface updateCaseSettingsPayload {
  rid?: string;
  account_rid: string;
  assessment_methodology?: string;
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
  currency_symbol?: string;
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
