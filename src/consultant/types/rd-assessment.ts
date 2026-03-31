export interface RdAssessmentStatusListURLParams {
  account_rid?: string;
  project_fiscal_rid?: string;
  case_rid?: string;
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
}

export interface RdAssessmentStatusExportURLParams {
  account_rid?: string;
  project_fiscal_rid?: string;
  case_rid?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  timezone?: string;
}

export interface ExportRdAssessmentStatusListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: string;
}

export type RdAssessmentStatusItem = {
  rid: string;
  account_rid: string;
  project_fiscal_rid: string;
  transaction_id: string;
  created_datetime: string;
  project_code: string;
  currency_rid: string;
  account_name: string;
  four_part_assessment: string;
  project_summary: string;
  qre_summary: string;
  interaction_status: string;
};

export interface RdAssessmentStatusListApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    auditInfo: RdAssessmentStatusItem[];
    count: number;
  };
}
