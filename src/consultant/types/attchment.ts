export type AttachmentList = {
  rid: string;
  r_number: string;
  document_name: string;
  document_number: string;
  attachmemnt_id: string;
  attchment_number: string;
  description: string;
};

export interface AttachmentsListURLParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  accountNumber: string;
  value?: string;
}
export type AttachmentData = {
  resources: AttachmentList[];
  count: number;
};
export type AttachmentListResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: AttachmentData;
};
