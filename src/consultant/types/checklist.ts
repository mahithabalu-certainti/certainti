interface GlobalFilters {
  [key: string]: string[];
}

export interface ChecklistListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  globalFilters?: GlobalFilters;
  attachmentLevel?: string;
  entityId?: string;
  accountRid?: string;
  isGlobal?: boolean;
  search?: string;
}

export interface ChecklistListExportParams {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  globalFilters?: GlobalFilters;
  timezone?: string;
  attachmentLevel?: string;
  entityId?: string;
  accountRid?: string;
  search?: string;
  isGlobal?: boolean;
  page?: number;
  limit?: number;
}

//List
export type ChecklistList = {
  rid: string;
  r_number: string;
  checklist_name: string;
  created_datetime: string;
  created_by: string;
  modified_datetime: string | null;
  modified_by: string | null;
  account_rid: string;
  attach_to: string;
  attachment_level: string;
  fiscal_year: string | number | null;
  created_by_name: string;
  modified_by_name: string | null;
  attached_to: string;
};

export interface ChecklistListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    checklists: ChecklistList[];
    totalCount: number;
  };
}

//Details
export interface ChecklistDetails {
  rid: string;
  r_number: string;
  title: string;
  descriptions: string;
  checklist_owner: string;
  checklist_owner_name: string;
  created_by: string;
  modified_by: string;
  account_rid: string;
  browse_file: string;
  created_datetime: string;
  modified_datetime: string;
  document_name: string;
  fiscal_year: number;
  attached_to: string;
  attach_to: string;
  format: string;
  size_in_mb: string;
  attachment_level: string;
  created_by_name: string;
  modified_by_name: string;
}

export interface ChecklistDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ChecklistDetails;
}

//Form types
export interface ChecklistFormDataPayload {
  rid: string;
  attachment: File;
  attachment_level: string;
  attach_to: string;
  fiscal_year?: string | number;
  title: string;
  checklist_owner: string;
  descriptions: string;
}
