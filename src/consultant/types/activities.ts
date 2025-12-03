export type ActivityType = 'all' | 'task' | 'email' | 'meeting' | 'call';
export type ActivityModuleType = 'task' | 'email' | 'meeting' | 'call';

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
  task_name: string;
  created_by: string;
  created_by_name: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  modified_by: string | null;
  modified_by_name: string | null;
  priority_rid: string | null;
  priority_name: string | null;
  task_status_name: string | null;
  created_datetime: string;
  effective_start_datetime: string | null;
  effective_end_datetime: string | null;
  checklist_rid: string | null;
  checklist_name: string | null;
  case_team_member_role_name: string | null;
  weightage_value: string | null;
  task_category_name: string | null;
  checklists?: {
    rid: string;
    task_rid: string;
    checklist_name: string;
    checklist_description: string | null;
    checklist_items_count: number;
    completed_items_count: number;
    checklist_items: Array<{
      rid: string;
      status_rid: string;
      checklist_item_status_name: string;
      checklist_item_name: string;
      checklist_item_description: string | null;
    }>;
  };
  tags: string[];
  task_description?: string;
  attach_to?: string;
  attached_to?: string;
  fiscal_year?: string;
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
  // Time fields (note the spelling with single 'f')
  efective_start_time: string | null;
  efective_end_time: string | null;
  recurrence_days: string[];
  recurrence_interval: number;
  recurrence_type: string;
  // New monthly recurrence fields
  recurrence_day_of_month?: string | null;
  recurrence_monthly_index?: string | null;
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
  task_description?: string;
  fiscal_year?: string | number;
  effective_start_datetime?: string;
  effective_end_datetime?: string;
  assigned_to?: string;
  task_status_rid?: string;
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

// Email templates list
export interface EamilTemplateItem {
  rid: string;
  template_name: string;
  category_rid?: string;
}

export interface EamilTemplateItemsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    emailTemplates: EamilTemplateItem[];
  };
}
