import { CommonApiResponse } from '../../common-service';

export interface NotificationStatus {
  status_description: string;
  status_name: string;
}

export interface NotificationItem {
  rid: string;
  created_by: string;
  modified_by: string;
  created_datetime: string;
  modified_datetime: string;
  user_rid: string;
  notification_message: string;
  status_rid: string;
  notificationstatus: NotificationStatus;
}

export interface NotificationsListApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    notifications: NotificationItem[];
    total: number;
    unreadCount: number;
    nextOffset: string | null;
  };
}

export interface NotificationParams {
  nextOffset?: number;
  limit?: number;
}

export interface updateNotificationAPiResponse extends CommonApiResponse {
  data: {
    notifications: number[];
  };
}
