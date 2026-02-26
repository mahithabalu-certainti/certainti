export type AttachmentList = {
  rid: string;
  document_rid: string;
  r_number: string;
  created_datetime: string;
  created_by: string;
  modified_datetime: string | null;
  modified_by: string | null;
  account_rid: string;
  browse_file: string;
  document_name: string;
  attach_to: string;
  attachment_level: string;
  fiscal_year: number;
  format: string;
  size_in_mb: string;
  document_category_rid: string;
  document_category: string;
  document_type_rid: string;
  document_category_others: string | null;
  document_type_others: string | null;
  comments: string | null;
  document_type: string;
  uploaded_by: string;
  attached_to: string;
  status_name?: string;
  status_rid?: string;
};

export interface globalFilters {
  [key: string]: string[];
}

export interface AttachmentsListURLParams {
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
  type?: string;
}

export type AttachmentListResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    attachments: AttachmentList[];
    count: number;
    totalCount: number;
  };
};

export interface AttachmentsListExportParams {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  globalFilters?: globalFilters;
  timezone?: string;
  attachmentLevel?: string;
  entityId?: string;
  accountRid?: string;
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
}

export interface AttachmentUploadPayload {
  attachment: File;
  account_rid: string;
  attach_to: string;
  attachment_level: string;
  fiscal_year: string;
  document_category_rid: string;
  document_type_rid: string;
  document_category_others?: string;
  document_type_others?: string;
  comments?: string;
}
