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
  approved?: string | number;
  permission: string;
  hide?: boolean;
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
  claim_rd_credits_fte: string | number;
  claim_rd_credits_subcon: string | number;
  claim_rd_credits_nonlabor: string | number;
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
  case_rid?: string;
}

export type ProjectFinancialSummaryResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ProjectFinancialSummary;
};
export interface ProjectFinancialResourceListParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  accountNumber?: string;
  fiscalYear?: number;
  projectRid?: string;
  accountRid?: string;
  caseRid?: string;
}

export interface ProjectFinancialResourceExportParams {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  accountNumber?: string;
  fiscalYear?: number;
  projectRid?: string;
  accountRid?: string;
  search?: string;
  caseRid?: string;
}
export interface ProjectResourceExportParams {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  accountNumber?: string;
  projectRid?: string;
  accountRid?: string;
  search?: string;
}

export interface ProjectFinancialProjectExportParams {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number;
  accountRid?: string;
  search?: string;
  caseRid?: string;
}

export type ProjectFinancialResourceCostList = {
  total_cost_pro_res: string | null;
  rd_percent_final: number | null;
  qre_final: number | null;
  rd_credits_total: number | null;
  resource_rid: string;
  project_fiscal_rid: string;
  fiscal_year: number;
  country_rid: string | null;
  region_rid: string | null;
  project_code: string;
  r_number: string;
  project_name: string | null;
  resource_code: string;
  resource_name: string | null;
  resource_type_rid: string;
  resource_type_name: string;
  country_code: string | null;
  region_name: string | null;
  country_name: string | null;
};

export interface ProjectFinancialResourceCostResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    projectResourceFiscal: ProjectFinancialResourceCostList[];
    count: number;
  };
}
