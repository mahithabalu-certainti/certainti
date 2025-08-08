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
  age_days: number;
  status: string;
  recipient_name: string;
  recipient_email: string;
  last_sent_date: string;
  last_reminder_date: string;
  response_date: string;
  last_response_update: string;
  attachments: string;
  interaction_history: string;
  interaction_link: string;
  parent_interaction_id: string;
  type: string;
  response_source: string;
  created_by: string;
  created_date: string;
  last_updated_by: string;
  last_updated_date: string;
};

export interface InteractionListURLParams {
  page: number;
  limit: number;
  sort: string;
  sort_by: 'ASC' | 'DESC';
  filters?: object;
  accountRid?: string;
  projectRid?: string;
}

export interface InteractionListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue: string;
  data: {
    interactions: InteractionList[];
    count: number;
  };
}

export interface Attachment {
  file_id: string;
  file_name: string;
  file_url: string;
}

export interface InteractionQuestion {
  question_id: string;
  rid: string;
  question: string;
  answer: string;
  response_received_on: string;
  attachments: Attachment[];
  mandatory: boolean;
  notes: string;
}

export interface InteractionDetails {
  rid: string;
  r_number: string;
  project_code: string;
  fiscal_year: string;
  interaction_type: string;
  status: string;
  response_updated_by: string;
  response_received_on: string;
  created_on: string;
  created_by: string;
  updated_on: string;
  updated_by: string;
  questions: InteractionQuestion[];
}

export interface InteractionDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    interactions: InteractionDetails;
  };
}
