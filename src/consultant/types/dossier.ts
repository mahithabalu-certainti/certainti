//-------- Project Documents ----------
export interface ProjectDocumentsListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
}

export interface ProjectDocumentsListExportParams {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
  timezone?: string;
}

export type ProjectDocumentItem = {
  rid: string;
  r_number: string;
  project_ref_id: string;
  project_name: string;
  document_number: string;
  document_type: string;
  document_name: string;
};

export interface ProjectDocumentListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    page?: number;
    limit?: number;
    count: number;
    projectDocuments: ProjectDocumentItem[];
  };
}

//-------- Resource Summary ----------
export interface ResourceSummaryListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
}

export interface ResourceSummaryListExportParams {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
  timezone?: string;
}

export type ResourceSummaryItem = {
  rid: string;
  r_number: string;
  project_ref_id: string;
  project_name: string;
  resource_ref_id: string;
  resource_name: string;
  resource_type: string;
  country_region: string;
  cost: string;
  rd_percentage: string;
  qre: string;
  rd_credit: string;
};

export interface ResourceSummaryListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    page?: number;
    limit?: number;
    count: number;
    resourceSummary: ResourceSummaryItem[];
  };
}

//-------- Project Summary ----------
export interface ProjectSummaryListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
}

export interface ProjectSummaryListExportParams {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
  timezone?: string;
}

export type ProjectSummaryItem = {
  rid: string;
  r_number: string;
  project_ref_id: string;
  project_name: string;
  fte_cost: string;
  sub_con_cost: string;
  non_labour_cost: string;
  project_cost: string;
  rd_percentage: string;
  project_qre: string;
  rd_credit: string;
};

export interface ProjectSummaryListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    page?: number;
    limit?: number;
    count: number;
    projectSummary: ProjectSummaryItem[];
  };
}

// RD form
export interface RDFormResponse {
  status: number;
  message: string;
  data: string; // Base64 encoded PDF data
}

export interface RDFormPayload {
  country_rid: string;
  region_rid?: string;
}

// financial highlights

export interface RDCreditPreviewResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    rid: string;
    case_rid: string;
    country_rid: string;
    state_rid: string;
    input_params: {
      metadata: {
        country: string;
        currency: string;
        credit_type: string;
      };
      qreSummary: {
        totalQREs: number;
        prior_year_qre_1: number;
        prior_year_qre_2: number;
      };
    };
    computed_fields: {
      computed_fields: {
        excess_qre: number;
        allowable_credit: number;
        sum_prior_two_years: number;
        fifty_percent_of_prior_two_years: number;
      };
    };
    final_credit: number | null;
    created_datetime: string;
    modified_datetime: string;
  };
}

export interface RDCreditStatusResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: string; // "COMPLETED", "PENDING", etc.
}

export interface RDCreditInitiatePayload {
  account_rid: string;
  case_rid: string;
  fiscal_year?: number;
}
export interface InputParams {
  country: string;
  currency: string;
  credit_type: string;
}
export interface TitleFields {
  Expleo: string;
  'Account ID': string;
  Description: string;
  'Account Name': string;
}
export type DynamicNumberMap = Record<string, number>;
export interface FinancialHighlightsProject {
  'Project ID': string;
  'Project Name': string;
  'Currency Symbol'?: string;
  [key: string]: string | number | undefined;
}

export interface FinancialHighlightsComputedFields {
  Title: Record<string, string>;
  Total: Record<string, number>;
  Columns: string[];
  Projects: FinancialHighlightsProject[];
}

export interface FinancialHighlightsData {
  rid: string;
  created_datetime: string;
  modified_datetime: string;
  case_rid: string;
  country_rid: string;
  input_params: Record<string, string | number | unknown | null>;
  computed_fields: FinancialHighlightsComputedFields;
}

export interface CaseSummaryData {
  rid: string;
  created_datetime: string;
  modified_datetime: string;
  case_rid: string;
  country_rid: string;
  input_params: Record<string, string | number | unknown | null>;
  computed_fields: FinancialHighlightsComputedFields;
}

export interface FinancialHighlightsResponse {
  statusCode: number;
  statusCodeValue: string;
  data: FinancialHighlightsData;
}

export interface RDCreditInitiateResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: CaseSummaryData | string; // Adjusted to allow string (from previous usage or just flexible)
}
