import { SortOrder } from './configuration';

// Form Types
export enum QuestionUpdate {
  Add = 'add',
  Edit = 'edit',
  Delete = 'delete',
  NoChange = 'no_change',
}
export interface InteractionFormTableColumn {
  name: string;
  label: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  required?: boolean;
  disabled?: boolean;
  hide?: boolean;
}

export interface ProjectDetails {
  project_code: string;
  project_name: string;
  fiscal_year: number;
  account_name: string;
}

export interface InteractionFormQuestion {
  questionNo: string;
  question: string;
  mandatory: boolean;
  notes: string;
  rid?: string;
  action_type?: QuestionUpdate;
}

export interface InteractionFormData {
  id?: string;
  accountName: string;
  projectCode: string;
  projectName: string;
  fiscalYear: number;
  questions: InteractionFormQuestion[];
  status?: string;
  rid?: string;
  interaction_id?: string;
  created_on?: string;
  created_by?: string;
  updated_on?: string;
  updated_by?: string;
  flag?: 'submit' | 'draft';
}

export interface InteractionQuestionErrors {
  question?: string;
  mandatory?: string;
  notes?: string;
}

export interface InteractionFormErrors {
  projectCode?: string;
  projectName?: string;
  fiscalYear?: string;
  status?: string;
  questions?: InteractionQuestionErrors[];
}

// List and Details Types
export type InteractionList = {
  rid: string;
  r_number: string;
  iteration: number;
  interaction_age: number | null;
  status: string;
  status_rid: string;
  recipient_name: string | null;
  recipient_email: string | null;
  last_sent_on: string | null;
  last_reminder_on: string | null;
  response_submitted_on: string | null;
  response_updated_on: string | null;
  attachments: number;
  interaction_url: string | null;
  interaction_history: string;
  parent_interaction_rid: string | null;
  interaction_type: string;
  interaction_type_name: string;
  response_source: string | null;
  created_by: string;
  created_user_name: string;
  created_datetime: string;
  modified_by: string | null;
  updated_user_name: string | null;
  modified_datetime: string | null;
  account_rid: string;
  project_fiscal_rid: string;
  fiscal_year: number;
  total_records: number;
  totalCount: number;
  last_resent_on: string | null;
  interaction_iteration: number | null;
};
export type ResponseInteractionList = {
  rid: string;
  r_number: string;
  response_on: string;
  total_records: number;
  response_email: null | string;
  response_by_rid: string;
  response_source: string;
  interaction_response: string;
  interaction_source_rid: string;
  interaction_source_name: string;
  response_by: string;
};
export interface InteractionListURLParams {
  page: number;
  limit: number;
  sort: string;
  sort_by: 'ASC' | 'DESC';
  filters?: object;
  account_rid?: string;
  project_rid?: string;
  project_fiscal_rid?: string;
  fiscal_year?: number;
  isGlobal?: boolean;
  flag?: string;
}

export interface InteractionListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: {
    page: number;
    limit: number;
    totalCount: number;
    interactions: InteractionList[];
  };
}
export interface ResponseInteractionListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: {
    page: number;
    limit: number;
    totalCount: number;
    response_history: ResponseInteractionList[];
    count?: number;
  };
}

export interface Attachment {
  file_id: string;
  file_name: string;
  file_url: string;
}

export interface InteractionQuestion {
  rid: string;
  question_seq_num: string;
  question: string;
  notes: string;
  is_mandatory: boolean;
  response_on_datetime: string | null;
  response: string | null;
  attachments: Attachment[];
}

export interface InteractionDetails {
  rid: string;
  account_rid: string;
  project_rid: string;
  fiscal_year: number;
  project_fiscal_rid: string;
  interaction_number: string;
  interaction_type: string;
  interaction_type_name: string;
  status: string;
  status_name: string;
  modified_by: string;
  created_by: string;
  created_datetime: string;
  modified_datetime: string | null;
  questions: InteractionQuestion[];
  global_attachments: Attachment[];
  project_code: string;
  project_name: string | null;
  account_name: string | null;
  response_updated_by: string;
  response_received_on: string;
}

export interface InteractionDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    interactions: InteractionDetails;
  };
}

export interface InteractionAttachmentType {
  rid: string;
  question_number: string;
  name: string;
  type: string;
  size: string;
  uploaded_by: string;
  uploaded_date: string;
  download: string;
  [key: string]: unknown;
}

export type FilterCondition = {
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  equals?: string | number | boolean;
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
