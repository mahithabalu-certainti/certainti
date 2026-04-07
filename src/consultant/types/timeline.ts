export interface TimelineItem {
  rid: string;
  entity_name: string;
  created_by_name: string;
  created_datetime: string;
  descriptions: string;
  event_name: string;
}

export interface TimelineListApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    timeLineEntries: TimelineItem[];
    total: number;
    unreadCount: number;
    nextOffset: number | null;
  };
}

export interface TimelineParams {
  nextOffset: string | number;
  limit: number;
  account_rid?: string;
  project_rid?: string;
  case_rid?: string;
  entityType: string;
}
