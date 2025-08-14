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
  interaction_age: number;
  status: {
    rid: string;
    status_name: string;
  };
  recipient_details: {
    rid: string;
    recipient_name: string;
    recipient_email: string;
  };
  last_sent_on: string;
  last_reminder_on: string;
  response_submitted_on: string;
  response_updated_on: string;
  attachments: number;
  interaction_url: string;
  interaction_history: string;
  parent_interaction_rid: string;
  interaction_type: {
    rid: string;
    type_name: string;
  };
  response_source: string;
  created_by: {
    rid: string;
    created_by_user_name: string;
  };
  created_datetime: string;
  modified_by: {
    rid: string;
    modified_by_user_name: string;
  };
  modified_datetime: string;
  account_rid: string;
  project_fiscal_rid: string;
  fiscal_year: number;
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
}

export interface InteractionListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: {
    page: number;
    limit: number;
    totalRecords: number;
    interactions: InteractionList[];
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
