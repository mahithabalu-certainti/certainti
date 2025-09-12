import { SortOrder } from './configuration';

// Form Types
export enum QuestionUpdate {
  Add = 'add',
  Edit = 'edit',
  Delete = 'delete',
}

export enum StatusActionEnum {
  Create = 'CREATE',
  Draft = 'DRAFT',
}

export enum StatusTypeEnum {
  cancelled = 'cancelled',
  completed = 'completed',
  created = 'created',
  draft = 'draft',
  on_hold = 'on hold',
  question_updated = 'question updated',
  response_draft = 'response draft',
  response_received = 'response received',
  resume = 'resume',
  sent = 'sent',
  resent = 'resent',
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
  question_seq_num: string;
  question: string;
  is_mandatory: boolean;
  notes: string;
  rid?: string;
  action_type?: QuestionUpdate;
  is_editable?: boolean;
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
  flag?: StatusActionEnum;
}

export type InteractionQuestionPayload = {
  rid?: string;
  question: string;
  notes: string;
  is_mandatory: boolean;
  action_type: QuestionUpdate;
};

export type InteractionFormPayload = {
  account_rid: string;
  project_rid: string;
  project_fiscal_rid: string;
  status_action?: StatusActionEnum;
  fiscal_year?: number;
  interaction_rid?: string;
  status_rid?: string;
  interaction_type_rid?: string;
  parent_interaction_rid?: string;
  questions: InteractionQuestionPayload[];
};

export interface InteractionQuestionErrors {
  question?: string;
  mandatory?: string;
  notes?: string;
}

export interface InteractionFormErrors {
  accountName?: string;
  projectCode?: string;
  projectName?: string;
  fiscalYear?: string;
  status?: string;
  questions?: InteractionQuestionErrors[];
}

// List and Details Types
export type InteractionList = {
  status_name: string;
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
  created_user_name: string | null;
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
  attachment_count: number | null;
  has_email_recipient: boolean;
  disableCheckBox?: boolean;
  account_name?: string | null;
  project_count?: string
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
  interaction_rid: string;
  interaction_item_rid: string;
  interaction_source_rid: string;
  interaction_source_name: string;
  interaction_version: number;
  response_source_name: string;
  response_by: string;
  attachment_count: number | string | null;
};
export interface InteractionListURLParams {
  page: number;
  limit: number;
  sort: string;
  sort_by: 'ASC' | 'DESC';
  filters?: object;
  globalFilters?: object;
  account_rid?: string;
  interaction_rid?: string;
  project_rid?: string;
  project_fiscal_rid?: string;
  fiscal_year?: number;
  isGlobal?: boolean;
  flag?: string;
  attachment_count?: number | string | null;
}

export interface ResponseListURLParams {
  account_rid?: string;
  interaction_rid?: string;
  version: number;
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
export interface AccountInteractionListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: {
    page: number;
    limit: number;
    totalCount: number;
    accountInteractions: InteractionList[];
  };
}
export interface ExportInteractionResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: string;
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
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: string | number;
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
  is_editable?: boolean;
}

export interface InteractionDetails {
  rid?: string;
  interaction_rid?: string;
  recipient_name: string;
  account_rid: string;
  project_rid: string;
  fiscal_year: number;
  project_fiscal_rid: string;
  r_number: string;
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
  response_updated_by: string | null;
  response_updated_on: string | null;
}

export interface InteractionDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    interactionDetails: InteractionDetails;
  };
}

export interface InteractionHistoryResponse {
  interaction_response_rid: string;
  interaction_item_rid: string;
  response_submitted_on: string;
  question_id: string;
  question: string;
  response: string;
  response_on: string;
  attachments: Attachment[];
}
export interface InteractionDetailsHistoryResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    history_details: InteractionHistoryResponse[];
    global_attachments: Attachment[];
    interaction_rid: string;
    response_on: string;
    project_name: string;
  };
}

export interface InteractionAttachmentType {
  rid: string;
  name: string;
  size: number;
  type: string;
  version: number;
  created_by: string;
  uploaded_date: string;
  question_rnumber: string;
  uploaded_by: string;
  download_link: string;
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
  account_rid?: string;
  interaction_rid?: string;
}

export interface InteractionAttachmentApiResponse {
  data: {
    data: InteractionAttachmentType[];
    totalRecords: number;
  };
}

// Interaction Question Response

export interface InteractionQuestionResponseType {
  question: string;
  response: string;
  rid: string;
  attachments?: Attachment[];
}

export interface InteractionQuestionResUpdateRequest {
  account_rid: string;
  project_rid: string;
  project_fiscal_rid: string;
  interaction_rid: string;
  status_action: 'RESPONSE_DRAFT' | 'RESPONSE_RECEIVED';
  attachments: Attachment[];
  questions: InteractionQuestionResponseType[];
  response_source: 'Manual' | 'Email' | 'Sheet';
}

export interface InteractionQuestionResUpdateResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: unknown;
}

// Upload Interaction Attachment
export interface UploadInteractionAttachmentRequest {
  account_rid: string;
  project_rid: string;
  interaction_rid: string;
  file: File;
}

export interface UploadInteractionAttachmentResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
  };
}

// Send Interaction types

export interface InteractionItem {
  interaction_rid: string;
  project_fiscal_rid: string;
  email_info: {
    email: string;
    name: string;
  };
}

export interface SendInteractionPayload {
  account_rid: string;
  interactions: InteractionItem[];
  customRecipient?: boolean;
  is_interaction_followup?: boolean;
}


export interface SendIntractionProject {
  project_rid: string;
  project_fiscal_rid: string;
  fiscal_year: string;
}
export interface AccountSendInteractionPayload {
  account_rid: string;
  account_interaction_rid: string[]
  projects: SendIntractionProject[];
}