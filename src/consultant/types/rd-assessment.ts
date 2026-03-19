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
  created_by: string | null;
  modified_by: string | null;
  created_datetime: string | null;
  modified_datetime: string | null;
  transaction_id: string | null;
  project_rid: string | null;
  project_fiscal_rid: string | null;
  account_rid: string | null;
  is_qre_processed: boolean;
  is_tech_summary_processed: boolean;
  is_interaction_question_processed: boolean;
  is_four_part_assessment_processed: boolean;
  data_ingestion: boolean;
  ai_assessment_api_status: string | null;
  interaction_question_error_message: string | null;
  qre_error_message: string | null;
  technical_summary_error_message: string | null;
  data_ingestion_error_message: string | null;
  four_part_assessment_error_message: string | null;
  project_code: string | null;
  currency_rid: string | null;
  account_name: string | null;
  four_part_assessment: string | null;
  project_summary: string | null;
  qre_summary: string | null;
  interaction_status: string | null;
  created_by_name: string | null;
  modified_by_name: string | null;
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
