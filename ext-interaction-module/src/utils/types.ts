export interface IGenerateOtp {
  email: string;
  interaction_rid: string;
  account_rid: string;
}

export interface IVerifyOtp {
  otp: string;
  interaction_rid: string;
  account_rid: string;
}

export interface IEmailMessage {
  subject: string;
  body: {
    contentType: string;
    content: string;
  };
  toRecipients: { emailAddress: { address: string } }[];
}

export type IOtpHistoryStatus =
  | "SENT"
  | "RESENT"
  | "SEND_FAILED"
  | "VERIFIED"
  | "VERIFICATION_FAILED";

export interface InteractionResponse {
  interaction_rid: string;
  interaction_item_rid: string;
  project_fiscal_rid: string;
  account_rid: string;
  project_rid: string;
  fiscal_year: number;
  status_rid: string;
  status_action: string;
  attachments: any;
  questions: {
    rid: string;
    notes: string;
    response: string;
    action_type: string;
    question_seq_num?: string;
    attachments: any; 
  }[];
  created_by: string;
  modified_by?: string;
}
