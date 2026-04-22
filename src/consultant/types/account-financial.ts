export type FinancialProjectCostList = {
  id: string;
  rid: string;
  r_number: string;
  account_rid: string;
  project_rid: string;
  project_name: string | null;
  project_code: string;
  fiscal_year: number;
  country_rid: string | null;
  region_rid: string | null;
  currency_rid: string;
  currency_symbol: string;
  total_cost_fte_prj: number | null;
  total_cost_subcon_prj: number | null;
  total_cost_nonlabor_prj: number | null;
  total_cost_prj: number | null;
  rd_percent_final: number | null;
  qre_final: number | null;
  rd_credits_total: number | null;
  created_by: string;
  modified_by: string | null;
  created_datetime: string;
  modified_datetime: string | null;
};

export type SortOrder = 'ASC' | 'DESC';

export interface CostListParms {
  page: number;
  limit: number;
  sortBy?: string;
  filters?: object;
  sortOrder?: SortOrder;
  fiscalYear?: number;
  search?: string;
  caseRid?: string;
}
