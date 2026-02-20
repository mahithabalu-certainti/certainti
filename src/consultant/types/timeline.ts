export interface TimelineItem {
    rid: string;
    created_by: string;
    modified_by: string;
    created_datetime: string;
    modified_datetime: string;
    user_rid: string;
    notification_message: string;
    status_rid: string;
}

export interface TimelineListApiResponse {
    statusCode: number;
    statusCodeValue: string;
    statusMessage: string;
    data: {
        notifications: TimelineItem[];
        total: number;
        unreadCount: number;
        nextOffset: string | null;
    };
}

export interface TimelineParams {
    nextOffset?: string | number;
    limit?: number;
    account_rid: string;
    entityType: string;
}