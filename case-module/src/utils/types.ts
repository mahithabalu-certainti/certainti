export interface ICreateCases {
  case_rid?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid: string;
  case_name: string;
  description?: string;
  fiscal_year: number;
  filing_type: string;
  case_owner: string;
  case_startdate: Date;
  planned_submission_date: Date;
  statutory_submission_date: Date;
  status_rid?: string;
}

export type CaseHeadersColumns = {
  rid : string,
  account_rid : string,
  case_name : string,
  account_name : string,
  filing_type_rid : string,
  case_owner_rid : string,
  fiscal_year : number,
  status_rid : string,
  country_rid : string | null,
  currency_rid : string | null,
  filing_type_name : string | null,
  country_name : string | null,
  case_owner_name : string | null,
  account_rnumber : string | null,
  currency_code : string | null,
  status_name : string | null,
  case_total_projects : number | null,
  case_total_project_cost : number | null,
  case_total_rd_cost : number | null,
  case_total_qre_cost : number | null
}

export type Filingtype = {
  rid : string,
  filing_type_name : string
}

export type Countrytype = {
  rid : string,
  country_name : string
}

export type Accounttype = {
  rid : string,
  r_number : string,
  account_name : string,
  country_rid : string | null,
  currency_rid : string | null
}

export type CaseOwnertype = {
  rid : string,
  name : string
}

export type CaseStatustype = {
  rid : string,
  status_name : string
}

export type Currencytype = {
  rid : string,
  currency_code : string
}