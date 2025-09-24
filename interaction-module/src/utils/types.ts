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
  parent_interaction_rid?: string | null;
  interaction_iteration?: number;
  status_rid: string;
  interaction_url?: string;
  interaction_age?: number;
  created_by: string;
  modified_by?: string;
  status_action?: string;
  interaction_level_rid:string;
  interaction_level?:string;
  projects?:IProject[];
  trigger_send?: boolean
}

export interface IProject {
    project_rid: string;
    project_fiscal_rid: string;
    fiscal_year: number;
}

export interface ICreateAccountInteraction {
  account_rid: string;
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
  status_rid: string;
  created_by: string;
  account_interaction_rid?: string;
  modified_by?: string;
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
  status_rid: string;
  interaction_url?: string;
  interaction_age?: number;
  created_by: string;
  modified_by?: string;
  status_action?: string;
  interaction_level?:string;
  interaction_level_rid:string
  trigger_send?: boolean
}

export interface InteractionDetailsResponse {
  account_rid: string;
  project_rid: string;
  project_name: string;
  account_name : string;
  account_rnumber : string;
  project_code: string;
  project_rnumber : string;
  interaction_rid:string
  fiscal_year: number;
  project_fiscal_rid: string;
  r_number: string;
  interaction_type: string;
  interaction_type_name: string;
  interaction_level_rid: string | null;
  interaction_level_name: string | null;
  status: string;
  status_name: string;
  modified_by: string;
  modified_datetime: Date | null;
  questions: any[];
  global_attachments: any[];
  created_by: string;
  created_datetime: Date | null;
  response_updated_by: string | null;
  response_updated_on: Date | null;
  recipient_name: string | null;
  recipient_email: string | null;
  hasEmailRecipient: boolean | false;
}
export interface InteractionResponse {
  interaction_rid: string;
  interaction_item_rid?: string;
  project_fiscal_rid: string;
  account_rid: string;
  project_rid: string;
  fiscal_yea?: number;
  status_rid?: string;
  status_action:string;
  response_source_rid:string;
  response_source:string;
  attachments:any;
  questions: {
    rid: string;
    notes?: string;
    response: string;
    action_type?: string;
    question_seq_num?: string;
    attachments:any; // Assuming attachments are stored as an array of strings (URLs or IDs)
  }[];
  created_by: string;
  modified_by?: string;
}
export interface IEmailMessage {
  subject: string;
  body: {
    contentType: string;
    content: string;
  };
  toRecipients: { emailAddress: { address: string } }[];
}

export interface ICreateTemplateInteraction {
  interaction_type_rid: string;
  template_rid?: string;
  template_name: string;
  status_rid: string;
  created_by: string;
  modified_by?: string;
  interaction_level_rid:string;
  questions: {
    rid?: string;
    notes: string;
    question: string;
    response: string;
    action_type: string;
    question_seq_num?: string;
  }[];

}