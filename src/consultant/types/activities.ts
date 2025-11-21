export type ActivityType = 'all' | 'task' | 'email' | 'meeting' | 'call';

export interface ActivityListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  activity_type?: ActivityType;
  search?: string;
  entityId?: string;
  accountRid?: string;
  attachmentLevel?: string;
}

export type ActivityList = {
  // Required fields (always present in your data)
  rid: string;
  created_by: string;
  created_datetime: string;
  account_rid: string;
  attach_to: string;
  attachment_level: string;
  activity_type: string;
  created_by_name: string;
  attached_to: string;

  // Optional fields (may be null or missing in some objects)
  r_number?: string | null;
  modified_by?: string | null;
  modified_datetime?: string | null;
  status_rid?: string | null;
  effective_start_datetime?: string | null;
  effective_end_datetime?: string | null;
  subject?: string | null;
  description?: string | null;
  email_sent_datetime?: string | null;
  priority_rid?: string | null;
  assigned_to?: string | null;
  task_name?: string | null;
  task_template_rid?: string | null;
  remainder_interval?: number | null;
  task_repeat_frequency?: string | null;
  event_url?: string | null;
  event_code?: string | null;
  event_password?: string | null;
  transcript?: string | null;
  event_platform?: string | null;
  event_time?: string | null;
  invitees_list?: string | null;
  attendees_list?: string | null;
  mom?: string | null;
  to_email?: string | null;
  cc_email?: string | null;
  sender_email?: string | null;
  fiscal_year?: string | null;
  body_html?: string | null;
  meeting_participants?: string | null;
  modified_by_name?: string | null;
};

export interface ActivityListApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    activities: ActivityList[];
    totalCount: number;
  };
}

// Email activity details
export interface EmailActivityDetails {
  rid: string;
  r_number: string;
  email_to: string | null;
  email_status: string | null;
  email_cc: string | null;
  subject: string | null;
  body: string | null;
  description: string | null;
  attachment_level: string | null;
  attach_to: string | null;
  created_datetime: string;
  created_by_name: string;
  modified_datetime: string | null;
  modified_by_name: string | null;
}

export interface EmailActivityDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: EmailActivityDetails;
}

// Task activity details
export interface TaskActivityDetails {
  rid: string;
  r_number: string;
  task_status: string;
  created_by_name: string;
  created_datetime: string;
  modified_by_name?: string;
  modified_datetime?: string;
  due_date?: string;
  subject?: string;
  description?: string;
  attached_to?: string;
}

export interface TaskActivityDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: TaskActivityDetails;
}
