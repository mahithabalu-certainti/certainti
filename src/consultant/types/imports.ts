export type ImportsList = {
  rid: string;
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
  status_description: string | null;
  import_type: string | null;
  imported_by: string;
  imported_on: string;
};

export interface ImportsListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  accountId: string;
}

export type ImportListResponse = {
  data: {
    listAllImportedData: {
      statusCode: number;
      statusCodeValue: string;
      statusMessage: string;
      data: {
        page: number;
        limit: number;
        total_count: number;
        imports: ImportsList[];
      };
    };
  };
};

export type ImportErrorRecord = {
  id: string;
  reason: string;
  description: string;
};
