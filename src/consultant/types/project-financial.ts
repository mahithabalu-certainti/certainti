export type SummaryResourceMetric = {
  rid: string;
  metric: string;
  fte: number;
  sub_con: number;
  non_labor: number;
};

export type SummaryDetailedMetric = {
  rid: string;
  metric_name: string;
  project_level: string | number;
  project_resource_level: string | number;
  project_task_level: string | number;
};

export type SummaryRdPercent = {
  rid: string;
  rd_percent_potential: string;
  rd_percent_adjustment: string;
  rd_percent_final: string;
};

export type SummaryQRE = {
  rid: string;
  qre_fte: number;
  qre_sub_con: number;
  qre_non_labor: number;
  qre_final: number;
};

export type SummaryRdCredits = {
  rid: string;
  rd_credits_fte: number;
  rd_credits_sub_con: number;
  rd_credits_non_labor: number;
  rd_credits_total: number;
};

export type SummaryClaimStatus = {
  rid: string;
  status: string;
};

export interface ProjectFinancialSummary {
  resource_metrics: SummaryResourceMetric[];
  detailed_metrics: SummaryDetailedMetric[];
  rd_percent: SummaryRdPercent[];
  qre: SummaryQRE[];
  rd_credits: SummaryRdCredits[];
  claim_status: SummaryClaimStatus;
}

export type ProjectFinancialSummaryResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ProjectFinancialSummary;
};
