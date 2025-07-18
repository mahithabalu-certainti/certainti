export type ImportsList = {
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
  status: string;
  status_description?: string | null;
  import_type?: string | null;
  imported_by: string;
  imported_on: string;
};

export interface ImportsListURLParams {
  page: number;
  limit: number;
  sort: string;
  sort_by: 'asc' | 'desc';
  filters?: object;
  fiscal_year?: number | string;
  account_rid: string;
}

export interface ImportListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue: string;
  data: {
    page: number;
    limit: number;
    imports: ImportsList[];
    count?: number;
    total_count?: number;
  };
}

export type ImportErrorRecord = {
  id: string;
  reason: string;
  description: string;
};
