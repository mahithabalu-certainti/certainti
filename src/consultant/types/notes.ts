interface globalFilters {
  [key: string]: string[];
}

export interface NotesListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  globalFilters?: globalFilters;
  attachmentLevel?: string;
  entityId?: string;
  accountRid?: string;
  isGlobal?: boolean;
  search?: string;
}

export interface NotesListExportParams {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  globalFilters?: globalFilters;
  timezone?: string;
  attachmentLevel?: string;
  entityId?: string;
  accountRid?: string;
  search?: string;
  isGlobal?: boolean;
  page?: number;
  limit?: number;
}

export type NotesList = {
  rid: string;
  notes_rid?: string;
  r_number: string;
  created_datetime: string;
  created_by: string;
  modified_datetime: string;
  modified_by: string;
  account_rid: string;
  browse_file: string;
  document_name: string;
  attach_to: string;
  attachment_level: string;
  fiscal_year: number;
  format: string;
  size_in_mb: string;
  title: string;
  notes_owner: string;
  descriptions: string;
  created_by_name: string;
  modified_by_name: string;
  attached_to: string;
  uploaded_by?: string | null;
};

export interface NotesListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    page?: number;
    limit?: number;
    totalCount: number;
    notes: NotesList[];
  };
}

export interface NoteDetails {
  rid: string;
  r_number: string;
  title: string;
  descriptions: string;
  notes_owner: string;
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

export interface NoteDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: NoteDetails;
}

export interface NotesFormDataPayload {
  rid: string;
  attachment: File;
  attachment_level: string;
  attach_to: string;
  fiscal_year?: string | number;
  title: string;
  notes_owner: string;
  descriptions: string;
}
