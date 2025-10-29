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
