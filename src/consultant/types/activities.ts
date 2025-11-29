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

export interface ActivityListExportURLParams {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  activity_type?: ActivityType;
  search?: string;
  entityId?: string;
  accountRid?: string;
  attachmentLevel?: string;
  timezone?: string;
}

export type ActivityList = {
  // Required fields
  rid: string;
  created_by: string;
  created_datetime: string;
  account_rid: string;
  attach_to: string;
  attachment_level: string;
  activity_type: string;
  created_by_name: string;
  attached_to: string;

  // Optional fields
  r_number?: string | null;
  modified_by?: string | null;
  modified_datetime?: string | null;
  status_rid?: string | null;
  status_name?: string | null;
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
  to_email?: string | null | string[];
  cc_email?: string | null | string[];
  sender_email?: string | null;
  fiscal_year?: string | number | null;
  body_html?: string | null;
  meeting_participants?: string | null;
  modified_by_name?: string | null;

  // missing fields
  meeting_id?: string | null;
  meeting_invite?: string | null;
  call_platform?: string | null;
  minutes_of_meeting?: string | null;
  caller_id?: string | null;
  call_participants?: string[] | string | null;
  recurrence_days?: string | null;
  recurrence_interval?: number | null;
  recurrence_type?: string | null;
  time_zone?: string | null;
  effective_start_time?: string | null;
  effective_end_time?: string | null;
  assigned_to_name?: string | null;
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
export interface EmailAttachment {
  rid: string;
  r_number: string;
  created_by: string;
  created_datetime: string;
  modified_by: string | null;
  modified_datetime: string | null;
  account_rid: string;
  activity_rid: string;
  browse_file: string;
  size: string;
  document_name: string;
  format: string;
  is_file_deleted: boolean;
}

export interface EmailActivityDetails {
  attach_to: string;
  attachment_level: string;
  attached_to: string;
  activity_rid: string;
  activity_type: string;
  subject: string;
  body_html: string;
  to_email: string[];
  cc_emails: string[];
  email_status: string;
  r_number: string;
  status_rid: string;
  account_rid: string;
  fiscal_year: string | null;
  status_name: string;
  modified_by: string | null;
  created_by: string;
  created_datetime: string;
  modified_datetime: string | null;
  attachments: EmailAttachment[];
}

export interface EmailActivityDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    emailActivityDetails: EmailActivityDetails;
  };
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

// Meeting activity details
export interface MeetingActivityAttachment {
  rid: string;
  r_number: string;
  created_by: string;
  created_datetime: string;
  modified_by: string | null;
  modified_datetime: string | null;
  account_rid: string;
  activity_rid: string;
  browse_file: string;
  size: string;
  document_name: string;
  format: string;
  is_file_deleted: boolean;
}

export interface MeetingActivityDetails {
  attach_to: string;
  attachment_level: string;
  attached_to: string;
  activity_rid: string;
  activity_type: string;
  subject: string;
  meeting_url: string;
  meeting_id: string;
  meeting_participants: string[];
  r_number: string;
  status_rid: string;
  account_rid: string;
  fiscal_year: string | null;
  status_name: string;
  modified_by: string | null;
  created_by: string;
  created_datetime: string;
  modified_datetime: string | null;
  attachments: MeetingActivityAttachment[];
  effective_start_datetime: string;
  effective_end_datetime: string;
  recurrence_days: string[];

  recurrence_interval: number;
  recurrence_type: string;
}

export interface MeetingActivityDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    activityDetails: MeetingActivityDetails;
  };
}

// Call Activity details
export interface CallActivityAttachment {
  rid: string;
  r_number: string;
  created_by: string;
  created_datetime: string;
  modified_by: string | null;
  modified_datetime: string | null;
  account_rid: string;
  activity_rid: string;
  browse_file: string;
  size: string;
  document_name: string;
  format: string;
  is_file_deleted: boolean;
}

export interface CallActivityDetails {
  attach_to: string;
  attachment_level: string;
  attached_to: string;
  activity_rid: string;
  activity_type: string;
  subject: string;
  call_participants: string[];
  caller_id: string;
  minutes_of_meeting: string;
  call_platform: string;
  r_number: string;
  status_rid: string;
  account_rid: string;
  fiscal_year: string | null;
  status_name: string;
  modified_by: string | null;
  created_by: string;
  created_datetime: string;
  modified_datetime: string | null;
  effective_start_datetime: string;
  effective_end_datetime: string;
  attachments: CallActivityAttachment[];
}

export interface CallActivityDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    activityDetails: CallActivityDetails;
  };
}

// Task Activity form payload
export interface ActivityTaskFormPayload {
  account_rid: string;
  attach_to: string;
  attachment_level: string;
  task_name: string;
  description?: string;
  fiscal_year?: number;
  effective_start_datetime?: string;
  effective_end_datetime?: string;
  assigned_to?: string;
  status_rid?: string;
  priority_rid?: string;
  checklist_rid?: string;
  tags?: string | Array<{ tag_rid: string; is_new_tag: boolean }>;
}

//Activity status
export interface ActivityStatus {
  rid?: string;
  status_name: string;
}

export interface ActivityStatusResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    activityStatus: ActivityStatus[];
  };
}

// Export type
export interface ExportAcivityListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: string;
}
