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

//--------- PDF Viewer Types --------
export interface PDFField {
  id: string;
  name: string;
  type: string;
  page: number;
  rect: number[];
  defaultValue?: string;
  possibleValues?: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PDFDocument {
  file: File;
  pageCount: number;
  fields: PDFField[];
}

//----------- Mapping Details Types --------
export type ObjectRidMap = Record<number, string>;
export interface FormDetail {
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
  extracted_data: unknown | null;
  country_name: string;
  state_name: string;
  status_name: string;
  created_by_name: string;
  modified_by_name: string | null;
  form_type: 'fillable' | 'non-fillable';
}

export interface FieldMapping {
  rid: string;
  created_datetime: string;
  created_by: string;
  modified_datetime: string | null;
  modified_by: string | null;
  form_rid: string;
  field_label: string;
  field_id: string | null;
  calculation_config: ObjectRidMap | null;
  field_type: 'line-item' | 'table';
  column_id: string | null;
}

export interface MappingDetailsData {
  formDetail: FormDetail;
  mappings: FieldMapping[];
  base64File: string;
}

export interface MappingDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: MappingDetailsData;
}

//----------- Objects List Types --------
export interface ObjectItem {
  rid: string;
  created_by: string;
  modified_by: string | null;
  created_datetime: string;
  modified_datetime: string | null;
  country_rid: string | null;
  state_rid: string | null;
  ref_table: string;
  field_name: string | null;
  parent_object: string;
  object_name: string;
  is_json: boolean;
  field_type: 'line-item' | 'table';
}

export interface ObjectsListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ObjectItem[];
}

//----------- Data Mapper Config Types --------
export interface DataMapperFieldMapping {
  rid: string;
  created_datetime: string;
  created_by: string;
  modified_datetime: string | null;
  modified_by: string | null;
  form_rid: string;
  field_label: string;
  field_id: string | null;
  calculation_config: ObjectRidMap | null;
  field_type: 'line-item' | 'table';
  column_id: string | null;
}

export interface DataMapperConfigPayload {
  rid: string;
  mappings: DataMapperFieldMapping[];
}

export interface DataMapperConfigResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    rid: string;
  };
}

//------ Data Mapper status --------
export interface DataMapperStatus {
  rid: string;
  created_datetime: string;
  created_by: string;
  modified_datetime: string | null;
  modified_by: string | null;
  status_name: string;
  status_description: string;
  status: 'active' | 'inactive' | string;
}

export interface DataMapperStatusApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: DataMapperStatus[];
}
