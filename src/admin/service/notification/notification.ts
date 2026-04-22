import { useQuery } from '@tanstack/react-query';
import {
  NotificationsListApiResponse,
  updateNotificationAPiResponse,
} from '../../types/notification';
import { userServiceApi } from '../../../api/api';

export const getNotificationListUrl = (
  nextOffset: string | number,
  limit: number
): string => {
  return `/api/notifications/list?nextOffset=${nextOffset}&limit=${limit}`;
};
export const fetchNotificationList = async (
  nextOffset: string | number,
  limit: number
) => {
  const url = getNotificationListUrl(nextOffset, limit);
  const response = await userServiceApi.get<NotificationsListApiResponse>(url);
  return response.data;
};

export const useNotificationList = (
  nextOffset: string | number,
  limit: number,
  refreshTrigger?: number
) => {
  return useQuery<NotificationsListApiResponse, Error>({
    queryKey: ['notification-list', nextOffset, refreshTrigger],
    queryFn: () => fetchNotificationList(nextOffset, limit),
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    // enabled: !!refreshUserTrigger,
  });
};

export const updateNotificationListUrl = (): string => {
  return `/api/notifications/updateStatus`;
};
export const fetchUpdateNotification = async () => {
  const url = updateNotificationListUrl();
  const response = await userServiceApi.get<updateNotificationAPiResponse>(url);
  return response.data;
};

export const useUpdateNotificationList = (enabled?: boolean) => {
  return useQuery<updateNotificationAPiResponse, Error>({
    queryKey: ['updateNotification'],
    queryFn: () => fetchUpdateNotification(),
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    enabled: enabled,
  });
};
