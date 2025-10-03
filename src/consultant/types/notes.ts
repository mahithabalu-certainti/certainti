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
  noteLevel?: string;
  entityId?: string;
  accountRid?: string;
  isGlobal?: boolean;
  search?: string;
}

export type NotesList = {
  rid: string;
  r_number: string;
  title: string;
  note_owner: string;
  related_to: string;
  created_by: string;
  created_datetime: string;
  modified_by: string | null;
  modified_datetime: string | null;
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
  note_owner: string;
  related_to: string;
  description: string;
  created_by: string;
  created_datetime: string;
  modified_by: string | null;
  modified_datetime: string | null;
}

export interface NoteDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    noteDetails: NoteDetails;
  };
}

export interface NotesFormDataPayload {
  rid: string;
  attachment: File;
  entity_level: string;
  entity_id: string;
  title: string;
  note_owner: string;
  note_description: string;
}
