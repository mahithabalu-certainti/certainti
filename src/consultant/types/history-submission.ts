export interface HistorySubmission {
  rid: string;
  r_number: string;
  created_by: string;
  modified_by: string;
  created_datetime: string;
  modified_datetime: string;
  account_rid: string;
  fiscal_year: number;
  total_project: number;
  total_qualified_project: number;
  total_project_cost: string;
  total_qualified_project_cost: string;
  total_qre: string;
  total_rd_credits: string;
  annual_gross_receipts: string;
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
  fiscal_year: number | string;
  total_project: number;
  total_qualified_project: number;
  total_project_cost: string;
  total_qualified_project_cost: string;
  total_qre: string;
  total_rd_credits: string;
  annual_gross_receipts: string;
  currency_symbol?: string;
}

export interface HistoryFormData {
  historicalSubmissions: historySummary[];
}
export interface HistoryFormErrors {
  historicalSubmissions?: HistoryErrors[];
}
export interface HistoryErrors {
  fiscal_year?: string;
  total_project_cost?: string;
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
    total_qre: number;
    total_rd_credits: number;
    annual_gross_receipts: number;
    action_type: 'add' | 'edit' | 'delete';
  }>;
}
