export interface TechnicalSummaryListURLParams {
  page: number;
  limit: number;
  sortOrder: 'ASC' | 'DESC';
  sortBy: string;
  filters?: object;
  account_rid?: string;
  project_rid?: string;
  project_fiscal_rid?: string;
}

export interface TechnicalSummaryExportListParams {
  sortOrder: 'ASC' | 'DESC';
  sortBy: string;
  filters?: object;
  account_rid?: string;
  project_rid?: string;
  project_fiscal_rid?: string;
}

export type TechnicalSummaryList = {
  rid: string;
  r_number: string;
  technical_summary: string;
  version: string | number;
  status: string;
  created_by: string;
  created_user_name: string;
  created_datetime: string;
  modified_by: string | null;
  modified_user_name: string | null;
  modified_datetime: string | null;
};

export interface TechnicalSummaryListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: {
    count: number;
    techSummaryInfo: TechnicalSummaryList[];
  };
}

export interface TechnicalSummaryDetails {
  rid: string;
  r_number: string;
  technical_summary: string;
  version: number;
  status_rid: string | null;
  status_name: string | null;
  created_by: string;
  created_user_name: string;
  modified_user_name: string | null;
  modified_by: string | null;
  created_datetime: string;
  modified_datetime: string | null;
  technical_summary_refinement_prompt: string | null;
}

export interface TechnicalSummaryDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    technicalSummaryDetails: TechnicalSummaryDetails;
  };
}

export interface TechnicalSummaryTextUpdateRequest {
  account_rid: string;
  tech_summary_rid: string;
  project_fiscal_rid: string;
  summary_context: string;
}

export interface TechnicalSummaryTextUpdateResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    technicalSummary: null;
  };
}
