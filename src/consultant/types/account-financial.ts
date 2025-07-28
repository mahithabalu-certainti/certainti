export type FinancialProjectCostList = {
  id: string;
  rid: string;
  project_code: string;
  fiscal_year: string;
  project_name: string;
  project_id: string;
  fte_cost: number;
  sub_con_cost: number;
  non_labor_cost: number;
  project_cost: string;
  rd: number;
  project_qre: string;
  rd_credit: string;
};

export type SortOrder = 'ASC' | 'DESC';

export interface CostListParms {
  page: number;
  limit: number;
  sortBy?: string;
  filters?: object;
  sortOrder?: SortOrder;
  fiscalYear?: number;
}
