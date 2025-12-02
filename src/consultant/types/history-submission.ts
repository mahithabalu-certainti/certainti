export interface HistorySubmission {
  rid: string;
  r_number: string;
  eid: string | null;
  created_by: string;
  modified_by: string | null;
  created_datetime: string;
  modified_datetime: string | null;
  account_rid: string;
  country_rid: string | null;
  state_rid: string | null;
  total_fte_cost: string;
  total_subcon_cost: string | null;
  total_nonlabor_cost: string | null;
  fiscal_year: number;
  total_project: number;
  total_qualified_project: number;
  total_project_cost: string;
  total_qualified_project_cost: string;
  total_qre: string;
  total_rd_credits: string;
  annual_gross_receipts: string;
  currency_rid: string;
  currency_symbol: string;
}

export interface HistoricalSubmissionResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    historicalSubmissions: HistorySubmission[];
  };
}

export interface historySummary {
  user_id?: string;
  rid?: string;
  r_number: string;
  eid: string | null;
  created_by: string;
  modified_by: string | null;
  created_datetime: string;
  modified_datetime: string | null;
  account_rid: string;
  country_rid: string | null;
  state_rid: string | null;
  total_fte_cost?: string;
  total_subcon_cost?: string;
  total_nonlabor_cost?: string;
  fiscal_year: number | string;
  total_project: number;
  total_qualified_project: number;
  total_project_cost: string;
  total_qualified_project_cost: string;
  total_qre: string;
  total_rd_credits: string;
  annual_gross_receipts: string;
  currency_rid?: string;
  currency_symbol?: string;
}

export interface HistoryFormData {
  region?: string;
  historicalSubmissions: historySummary[];
}
export interface HistoryFormErrors {
  region?: string;
  country?: string;
  historicalSubmissions?: HistoryErrors[];
}
export interface HistoryErrors {
  fiscal_year?: string;
  total_project_cost?: string;
  total_nonlabor_cost?: string;
  total_subcon_cost?: string;
  total_fte_cost?: string;
  total_qre?: string;
  total_rd_credits?: string;
  annual_gross_receipts?: string;
}

export interface HistoricalSubmissionPayload {
  account_rid: string;
  historical_submissions: Array<{
    history_submission_rid?: string;
    fiscal_year: number;
    total_project: number;
    total_qualified_project: number;
    total_project_cost: number;
    total_qualified_project_cost: number;
    total_nonlabor_cost?: number;
    total_subcon_cost?: number;
    total_fte_cost?: number;
    total_qre: number;
    total_rd_credits: number;
    annual_gross_receipts: number;
    action_type: 'add' | 'edit' | 'delete';
    country_rid: string;
    state_rid: string;
  }>;
}

export interface HistorySubmissionFormResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    fiscal_year: number;
    account_rid: string;
    error?: string;
  }[];
}
