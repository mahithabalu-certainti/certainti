export interface InteractionAttachmentType {
  rid: string;
  question_number: string;
  name: string;
  type: string;
  size: string;
  uploaded_by: string;
  uploaded_date: string;
  download: string;
  [key: string]: unknown; // Add index signature
}

export type SortOrder = 'ASC' | 'DESC';

export type FilterCondition = {
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  equals?: string | number | boolean;
  // Add other filter conditions as needed
};

export type Filters = Record<string, FilterCondition>;

export interface InteractionAttachmentListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Filters;
  searchTerm?: string;
  exportKey?: string;
  timezone?: string;
  entity_type?: string;
}

export interface InteractionAttachmentApiResponse {
  data: {
    attachments: InteractionAttachmentType[];
    total_count: number;
  };
}
