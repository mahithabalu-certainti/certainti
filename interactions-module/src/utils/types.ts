export interface ICreateInteraction {
  project_fiscal_rid: string;
  account_rid: string;
  project_rid: string;
  fiscal_year: number;
  interaction_source_rid: string;
  interaction_type_rid: string;
  questions: {
    rid?: string;
    notes: string;
    question: string;
    response: string;
    action_type: string;
    question_seq_num?: string;
  }[];
  template_rid?: string;
  parent_interaction_rid?: string;
  interaction_iteration?: number;
  interaction_status_rid?: string;
  interaction_url?: string;
  interaction_age?: number;
  created_by: string;
  modified_by?: string;
  status_action: string; // This should match the keys in statusAction
}

export interface IUpdateInteraction {
  interaction_rid: string;
  project_fiscal_rid: string;
  account_rid: string;
  project_rid: string;
  fiscal_year: number;
  interaction_source_rid: string;
  interaction_type_rid: string;
  questions: {
    question: string;
    notes: string;
    response: string;
    action_type: string;
  }[];
  template_rid?: string;
  parent_interaction_rid?: string;
  interaction_iteration?: number;
  interaction_status_rid?: string;
  interaction_url?: string;
  interaction_age?: number;
  created_by: string;
  modified_by?: string;
  status_action: string;
}

export interface InteractionDetailsResponse {
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
  modified_datetime: Date | null;
  questions: any[];
  created_by: string;
  created_datetime: Date | null;
}
export interface InteractionResponse {
  interaction_rid: string;
  interaction_item_rid: string;
  project_fiscal_rid: string;
  account_rid: string;
  project_rid: string;
  fiscal_year: number;
  status_rid: string;
  questions: {
    rid: string;
    notes: string;
    response: string;
    action_type: string;
    question_seq_num?: string;
  }[];
  created_by: string;
  modified_by?: string;
}
