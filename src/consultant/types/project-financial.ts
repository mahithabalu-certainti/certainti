export type SummaryResourceMetric = {
  rid: string;
  metric: string;
  fte: string | number;
  subcon: string | number;
  nonlabor: string | number;
};

export type SummaryDetailedMetric = {
  rid: string;
  metric_name: string;
  project_level: string | number;
  project_resource_level: string | number;
  project_task_level?: string | number;
};

export type SummaryRdPercent = {
  rid: string;
  name: string;
  rd_percent_potential: string | number;
  rd_percent_adjustment: string | number;
  rd_percent_final: string | number;
};

export type SummaryClaimJurisdiction = {
  rid: string;
  name: string;
  rd_credits_fte: string | number;
  rd_credits_subcon: string | number;
  rd_credits_nonlabor: string | number;
};

export type SummaryQRE = {
  rid: string;
  name: string;
  qre_fte: string | number;
  qre_subcon: string | number;
  qre_nonlabor: string | number;
  qre_final: string | number;
};

export type SummaryRdCredits = {
  rid: string;
  name: string;
  rd_credits_fte: string | number;
  rd_credits_subcon: string | number;
  rd_credits_nonlabor: string | number;
  rd_credits_total: string | number;
};

export type SummaryClaimStatus = {
  status: string;
};

export interface ProjectFinancialSummary {
  account_rid: string;
  fiscal_year: number;
  project_name: string;
  resource_metrics: SummaryResourceMetric[];
  detailed_metrics: SummaryDetailedMetric[];
  claim_jurisdiction: SummaryClaimJurisdiction[];
  rd_percent: SummaryRdPercent[];
  qre: SummaryQRE[];
  rd_credits: SummaryRdCredits[];
  claim_status: SummaryClaimStatus;
}

export interface ProjectFinancialSummaryListParams {
  account_rid: string;
  project_fiscal_rid: string;
  fiscal_year?: number;
}

export type ProjectFinancialSummaryResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ProjectFinancialSummary;
};

export type FinancialResourceCost = {
  rid: string;
  project_code: string;
  project_name: string;
  project_id: string;
  resource_code: string;
  resource_name: string;
  resource_type: string;
  country: string;
  region: string;
  cost: number;
  rd: number;
  project_qre: string;
  rd_credit: number;
};

export interface ResourceCostFinancialHighlightListParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ResourceCostFinancialHighlight {
  data: any;
}

export interface ResourceCostFinancialHighlightResponse {
  data: ResourceCostFinancialHighlight;
  message: string;
  status: number;
}
