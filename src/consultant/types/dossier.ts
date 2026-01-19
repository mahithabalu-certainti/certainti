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
  'Project Code'?: string;
  'Currency Symbol'?: string;
  is_qualified?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface FinancialHighlightsComputedFields {
  Title: Record<string, string>;
  Total: Record<string, number | string>;
  Columns: string[];
  Projects: FinancialHighlightsProject[];
  'Technical Submissions by Cost that are 50% or more of Total QRE'?: FinancialHighlightsProject[];
  'Total Project to be shared with HMRC'?: {
    Total: number;
  };
  'Percentage Calculation'?: Record<string, string | number>;
}

export interface FinancialHighlightsData {
  rid: string;
  created_datetime: string;
  modified_datetime: string;
  case_rid: string;
  country_rid: string;
  input_params: Record<string, string | number | unknown | null>;
  computed_fields:
    | FinancialHighlightsComputedFields
    | AustraliaComputedFields
    | USAComputedFields;
}

export interface CaseSummaryData {
  rid: string;
  created_datetime: string;
  modified_datetime: string;
  case_rid: string;
  country_rid: string;
  input_params: Record<string, string | number | unknown | null>;
  computed_fields:
    | FinancialHighlightsComputedFields
    | AustraliaComputedFields
    | USAComputedFields;
}

export interface AustraliaRdExpenditure {
  [key: string]: number;
}

export interface AustraliaTierOfIntensity {
  name: string;
  'offset Amount': number;
  'Notional deductions applied': number;
}

export interface AustraliaAdditionalInfo {
  'Tax rate': string;
}

export interface AustraliaNonRefundableTaxOffset {
  'R&D intensity': string;
  'R&D entity total expenses': number;
  'Total notional R&D deductions': Record<
    string,
    string | number | unknown | null
  >;
}

export interface AustraliaComputedFields {
  Title?: Record<string, string>;
  Total?: Record<string, number>;
  Columns?: string[];
  Projects?: FinancialHighlightsProject[];
  'R&D Expenditure': AustraliaRdExpenditure;
  'Tier of intensity': AustraliaTierOfIntensity[];
  'Additional Information': AustraliaAdditionalInfo;
  'Preliminary Calculation': number;
  'Non-refundable tax offset': AustraliaNonRefundableTaxOffset;
  'Non-refundable R&D tax offset': number;
}

export interface USAReduction280C {
  reduction280c: {
    elect280c: {
      credit: string;
      factor?: number;
      rate?: number;
    };
    no_elect280c: {
      credit: string;
      factor?: number;
      rate?: number;
    };
  };
}

export interface USACreditASC {
  excess_qre: string;
  final_credit: string;
  percentage_used: number;
  asc_credit_amount: string;
  adjusted_base_amount: string;
  tot_current_year_qre: string;
  total_prior_3years_qre: string;
  total_section_b_credit: string;
}

export interface USACreditRRC {
  base_amount: string;
  final_credit: string;
  half_total_qre: string;
  tot_current_year_qre: string;
  fixed_base_percentage: number;
  total_section_a_credit: string;
  excess_qre_over_base_amount: string;
  average_annual_gross_receipts: string;
}

export interface USAComputedFields {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
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
