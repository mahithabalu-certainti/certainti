import { filterType } from "./rawQueries";

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
  trigger_send?: boolean;
  email_info? : {
    email : any,
    name : any
  }
  recipient_name? : any,
  recipient_email? : any
  interaction_assessment_source_rid? : string
  interaction_status_rid? : string
  transaction_id?: string
  four_part_assessment_rid?: string | null
  interaction_batch_id?: string
  is_primary?: boolean;
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
  email_info? : {
    email : any,
    name : any
  }
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
  trigger_send?: boolean;
  email_info? : {
    email : any,
    name : any
  }
  recipient_name? : any,
  recipient_email? : any
  transaction_id?: string
  four_part_assessment_rid?: string | null
  interaction_batch_id?: string
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
export interface ProjectMetadata {
  projectId : string
  companyId : string
  jurisdiction : string
}

export interface FourPartAssessment {
  permitted_purpose: {
    status : string
    rationale : string
  }
  technological_uncertainty: {
    status : string
    rationale : string
  }
  process_of_experimentation: {
    status : string
    rationale : string
  }
  technological_in_nature: {
    status : string
    rationale : string
  }
  status: string
  rationale: string
  summary_judgment: string
  rd_potential_category: string
}

export interface Assessment {
  tracker_one_liner : string
  project_metadata : ProjectMetadata
  four_part_assessment : FourPartAssessment
}

export interface FourPartAssessmentResponse {
  assessment : Assessment
  summary_judgment : string
  rd_potential_category : string
  follow_up_questions : string[]
}

export interface FourPartAssessmentRequestPayload {
  account_rid : string
  project_fiscal_rid : string
  case_rid : string
  page : number
  limit : number
  search : string
  filter : filterType,
  sort : string
  sort_by : string
  type : string
  isExport : boolean
}

export interface ListResponseType<T> {
  statusCode : number
  statusCodeValue : string
  statusMessage : string
  data : T
}

export interface ParentAccountType {
  rid : string
  account_name : string
  r_number : string
  storage_type : string
  is_parent : boolean
  currency_rid : string
}

interface FourPartRes {
  
}

export interface FourPartAssessmentListResponse {
  rid : string
  r_number : string
  project_code : string
  status : string
  rd_potential_category : string
  created_datetime : string
  modified_datetime : string
  created_by : string
  modified_by : string
  created_by_name : string
  modified_by_name : string | null
  total_results : string
}

export interface UserReturnType {
  rid : string
  first_name : string
  last_name : string
}

export interface InteractionStatusUpdateRequest {
  rid : string
  account_rid : string
  status_name : string
}

export interface AllStatusType {
  rid : string
  status_name : string
  status : string
}