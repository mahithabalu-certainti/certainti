// Data Mapper Types
export interface DataMapperFormPayload {
  form_name: string;
  effective_from_date: string;
  effective_to_date: string;
  country_rid: string;
  state_rid: string;
  file?: File;
}

export interface DataMapperDetails {
  rid: string;
  r_number: string;
  created_datetime: string;
  created_by: string;
  modified_datetime: string | null;
  modified_by: string | null;
  form_name: string;
  browse_file: string;
  document_name: string;
  effective_from_date: string;
  effective_to_date: string | null;
  country_rid: string;
  state_rid: string;
  format: string;
  size_in_mb: string;
  status_rid: string;
  is_active: boolean;
  error_message: string | null;
  country_name: string;
  state_name: string;
  status_name: string;
  created_by_name: string;
  modified_by_name: string;
}

export interface DataMapperDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: DataMapperDetails;
}

export interface DataMapperCreateResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
}

// Data Mapper List Types
export interface DataMapperListParams {
  page: number;
  limit: number;
  search?: string;
  filters?: object;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export interface DataMapperExportListParams {
  search?: string;
  filters?: object;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  timezone?: string;
}

export type DataMapperListItem = {
  rid: string;
  r_number: string;
  created_datetime: string;
  created_by: string;
  modified_datetime: string | null;
  modified_by: string | null;
  form_name: string;
  browse_file: string;
  document_name: string;
  effective_from_date: string;
  effective_to_date: string | null;
  country_rid: string;
  state_rid: string;
  format: string;
  size_in_mb: string;
  status_rid: string;
  is_active: boolean;
  error_message: string | null;
  country_name: string;
  state_name: string;
  status_name: string;
  created_by_name: string;
  modified_by_name: string | null;
};

export interface DataMapperListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    items: DataMapperListItem[];
    totalCount: number;
  };
}
