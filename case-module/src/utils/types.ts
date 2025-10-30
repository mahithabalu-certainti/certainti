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
  filing_type_rid: string;
  case_owner_rid: string;
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
  case_total_qre_cost : number | null,
  r_number : string,
  planned_submission_date: Date,
  statutory_submission_date: Date,
  description?: string,
  created_by: string | null,
  modified_by: string | null;
  created_by_name : string | null,
  modified_by_name : string | null

}

export type FilingType = {
  rid : string,
  filing_type_name : string
}

export type CountryType = {
  rid : string,
  country_name : string
}

export type AccountType = {
  rid : string,
  r_number : string,
  account_name : string,
  country_rid : string | null,
  currency_rid : string | null
}

export type CaseOwnerType = {
  rid : string,
  name : string
}

export type CaseStatusType = {
  rid : string,
  status_name : string
}

export type CurrencyType = {
  rid : string,
  currency_code : string
}

export type FilterType = {
  [key : string] : {
    [condition : string] : any
  }
}

export const validColumnsForSorting : any = {
  project_code : "project_code",
  project_name : "project_name",
  fiscal_year : "fiscal_year",
  project_classification_other : "project_classification_other",
  project_client_group : "project_client_group",
  project_group : "project_group",
  total_effort_prj : "total_effort_prj",
  total_cost_prj : "total_cost_prj",
  total_cost_fte_prj : "total_cost_fte_prj",
  total_cost_subcon_prj : "total_cost_subcon_prj",
  total_cost_nonlabor_prj : "total_cost_nonlabor_prj",
  assessment_status : "assessment_status",
  rd_percent_final : "rd_percent_final",
  qre_final : "qre_final",
  comments : "comments",
  modified_datetime : "modified_datetime",
  r_number : "r_number",
  project_point_of_contact : "project_point_of_contact",
  project_technical_point_of_contact : "project_technical_point_of_contact"
}

export const validColumns : any = {
  project_code : "project_code",
  project_name : "project_name",
  fiscal_year : "fiscal_year",
  project_classification_rid : "project_classification_rid",
  project_type_rid : "project_type_rid",
  project_type_name : "project_type_name",
  project_classification_other : "project_classification_other",
  project_client_group : "project_client_group",
  project_group : "project_group",
  total_effort_prj : "total_effort_prj",
  total_cost_prj : "total_cost_prj",
  total_cost_fte_prj : "total_cost_fte_prj",
  total_cost_subcon_prj : "total_cost_subcon_prj",
  total_cost_nonlabor_prj : "total_cost_nonlabor_prj",
  assessment_status : "assessment_status",
  rd_percent_final : "rd_percent_final",
  qre_final : "qre_final",
  comments : "comments",
  modified_datetime : "modified_datetime",
  r_number : "r_number",
  project_point_of_contact : "project_point_of_contact",
  project_technical_point_of_contact : "project_technical_point_of_contact"
}

export const columnType : any = {
  project_code : "string",
  project_name : "string",
  fiscal_year : "number",
  project_classification_rid : "string",
  project_type_rid : "string",
  project_classification_other : "string",
  project_client_group : "string",
  project_group : "string",
  total_effort_prj : "number",
  total_cost_prj : "number",
  total_cost_fte_prj : "number",
  total_cost_subcon_prj : "number",
  total_cost_nonlabor_prj : "number",
  assessment_status : "string",
  rd_percent_final : "number",
  qre_final : "number",
  comments : "string",
  modified_datetime : "date",
  r_number : "string",
  project_point_of_contact : "string",
  project_technical_point_of_contact : "string"
}

export type caseProjectsResponseType = {
  project_code : string,
  project_name : string,
  fiscal_year : number,
  project_classification_rid : string,
  project_classification_name : string,
  project_type_rid : string,
  project_classification_other : string,
  project_client_group : string,
  project_group : string,
  total_effort_prj : number,
  total_cost_prj : number
  total_cost_fte_prj : number,
  total_cost_subcon_prj : number,
  total_cost_nonlabor_prj : number,
  assessment_status : string,
  rd_percent_final : number,
  qre_final : number,
  comments : string,
  modified_datetime : Date,
  r_number : number,
  project_point_of_contact : string,
  project_technical_point_of_contact : string
}

export type assignProjectType = {
  account_rid : string,
  case_rid : string,
  created_by : string,
  modified_by? : string,
  created_datetime : Date,
  modified_datetime : Date,
  case_total_projects? : number | null,
  case_total_project_cost : number | null,
  projects : projectType[]
}

type projectType = {
  project_rid : string,
  project_fiscal_rid : string,
  project_group : string,
}