export type SortOrder = 'ASC' | 'DESC';

export interface TemplateListParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: object;
  searchTerm?: string;
  timezone?: string;
}

// List
export type InteractionTemplateList = {
  rid: string;
  status: string;
  r_number: string;
  template_name: string;
  created_by: string;
  modified_by: string | null;
  status_name: string;
  total_records: number;
  created_datetime: string;
  interaction_type: string;
  created_user_name: string;
  interaction_level: string;
  modified_datetime: string | null;
  modified_user_name: string | null;
  interaction_type_name: string;
  interaction_level_name: string;
};

export interface InteractionTemplateListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: {
    page: number;
    limit: number;
    totalCount: number;
    interactions: InteractionTemplateList[];
  };
}

// Details
export interface InteractionTemplateQuestion {
  rid: string;
  question_seq_num: string;
  question: string;
  notes: string;
  is_mandatory: boolean;
  is_editable?: boolean;
}

export interface InteractionTemplateDetails {
  template_rid: string;
  r_number: string;
  template_name: string;
  interaction_type: string;
  interaction_type_name: string;
  interaction_level_rid: string;
  interaction_level_name: string;
  status_rid: string;
  status_name: string;
  modified_by: string | null;
  created_by: string;
  created_datetime: string;
  modified_datetime: string | null;
  questions: InteractionTemplateQuestion[];
}

export interface InteractionTemplateDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    interactionDetails: InteractionTemplateDetails;
  };
}

// Form types
export enum ActionType {
  Add = 'add',
  Edit = 'edit',
  Delete = 'delete',
}

export type InteractionTemplateQuestionPayload = {
  rid?: string;
  question: string;
  notes: string;
  is_mandatory: boolean;
  action_type: ActionType;
};

export type TemplateFormPayload = {
  template_rid?: string;
  interaction_level_rid?: string;
  template_name?: string;
  status_rid?: string;
  questions: InteractionTemplateQuestionPayload[];
};

export interface ExportInteractionTemplateResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: string;
}
