export interface cases {
  caseId: string;
  caseNo: string;
  fiscalYear: number;
  caseCode: string;
  caseType: string;
  country: string;
  region: string;
  caseOwner: string;
  rdClaim: string;
  creator: string;
}

export interface Case {
  [key: string]: unknown;
  case_id: string;
  case_number: string;
  fiscal_year: number;
  case_code: string;
  case_type: string;
  country: string;
  region: string;
  case_owner: string;
  rd_claim: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  account_rid?: string;
}

export interface CaseListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  fiscalYear?: number;
  filters?: Record<string, string | number | boolean>;
  globalFilters?: Record<string, string | number | boolean>;
}

export interface CaseListResponse {
  cases: Case[];
  count: number;
  totalCount: number;
}

export interface CaseApiResponse {
  data: CaseListResponse;
  statusCode: number;
  statusMessage: string;
}

export interface CaseDetailsResponse {
  data: Case;
  statusCode: number;
  statusMessage: string;
}

export interface CasesPayload {
  caseId: string;
  caseNo: string;
  fiscalYear: number;
  caseCode: string;
  caseType: string;
  country: string;
  region: string;
  caseOwner: string;
  rdClaim: string;
  creator: string;
}
