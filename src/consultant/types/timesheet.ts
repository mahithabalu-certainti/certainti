export type TimeSheetList = {
  rid: string;
  r_number: string;
  file_name: string;
  format: string;
  size: string;
  fiscal: string | number | null;
  entity: string;
  total_records: number | null;
  records_loaded_successfully: number | null;
  records_failed_to_load: number | null;
  records_with_warning: number | null;
  records_failed_to_stage?: number | null;
  status: string;
  status_descriptions?: string | null;
  import_type?: string | null;
  imported_by: string;
  imported_on: string;
  document_url: string;
};

export interface TimeSheetListURLParams {
  page: number;
  limit: number;
  sort: string;
  sort_by: 'asc' | 'desc';
  filters?: object;
  fiscal_year?: number | string;
  account_rid: string;
  documentRid?: string;
  search?: string;
}

export interface TImesheetListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue: string;
  data: {
    page: number;
    limit: number;
    imports: TimeSheetList[];
    count?: number;
    total_count?: number;
  };
}

export interface TimesheetDetails {
  rid: string;
  size: string;
  entity: string;
  fiscal: number;
  format: string;
  status: string;
  r_number: string;
  file_name: string;
  imported_on: string;
  total_records: number;
  records_with_warning: number | null;
  records_failed_to_load: number;
  records_failed_to_stage: number;
  records_loaded_successfully: number;
  imported_by: string;
  status_description: string;
  document_url: string;
  document_rid: string;
}

export interface TimesheetDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    imports: TimesheetDetails;
  };
}
