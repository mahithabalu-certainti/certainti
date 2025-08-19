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
