export interface TechnicalSummaryListURLParams {
  page: number;
  limit: number;
  sortOrder: 'ASC' | 'DESC';
  sortBy: string;
  filters?: object;
  account_rid?: string;
  project_rid?: string;
  project_fiscal_rid?: string;
  case_rid?: string;
  type?: string;
}

export interface TechnicalSummaryExportListParams {
  sortOrder: 'ASC' | 'DESC';
  sortBy: string;
  filters?: object;
  account_rid?: string;
  project_rid?: string;
  project_fiscal_rid?: string;
  timezone?: string;
  case_rid?: string;
  type?: string;
  summaryType?: string;
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
  project_rid: string;
  project_fiscal_rid: string;
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
export interface Technical_summary {
  title: string;
  summary: string;
  summary_tag_ids: number | string;
}
export interface TechnicalSummaryDetails {
  rid: string;
  r_number: string;
  technical_summary: Technical_summary[];
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
  data: TechnicalSummaryDetails;
}

export interface TechnicalSummaryTextUpdateRequest {
  account_rid: string;
  tech_summary_rid: string;
  project_fiscal_rid: string;
  technical_summary: Technical_summary[];
}
export interface TechnicalSummaryRefinePromptRequest {
  account_rid: string;
  tech_summary_rid: string;
  project_fiscal_rid: string;
  refinement_prompt: string;
  existing_summary: SummaryList[];
}
export interface SummaryList {
  title: string;
  summary: string;
  summary_tag_ids: number | string;
}
export interface TechnicalSummaryTextUpdateResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    technicalSummary?: TechnicalSummaryDetails;
    updated_summary?: SummaryList[];
  };
}
