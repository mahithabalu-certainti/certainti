import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { NotificationItem, NotificationResponse } from '../../types';
import { userServiceApi } from '../../../api/api';

const fetchNotifications = async (
  userId: string
): Promise<NotificationItem[]> => {
    const response = await userServiceApi.get<NotificationResponse>(
      `/api/notifications/list`
    );

    return response.data.data;

  console.log('notifications', userId);
  // Simulate 2-second delay
  // await new Promise((resolve) => setTimeout(resolve, 2000));

  // // Mock data
  // const mockResponse: NotificationResponse = {
  //   statusCode: 200,
  //   statusCodeValue: 'Success',
  //   statusMessage: 'Operation completed successfully!',
  //   data: [
  //     {
  //       rid: '1',
  //       message: 'Your order #45321 has been shipped',
  //       is_read: false,
  //       created_datetime: '2025-12-05T12:15:22.123+00:00',
  //     },
  //     {
  //       rid: '2',
  //       message: 'Password changed successfully',
  //       is_read: true,
  //       created_datetime: '2025-12-04T09:31:10.552+00:00',
  //     },
  //     {
  //       rid: '3',
  //       message: 'New login detected from a new device',
  //       is_read: false,
  //       created_datetime: '2025-12-03T14:02:49.934+00:00',
  //     },
  //     {
  //       rid: '4',
  //       message: 'Your subscription will renew in 3 days',
  //       is_read: false,
  //       created_datetime: '2025-12-02T17:45:30.110+00:00',
  //     },
  //     {
  //       rid: '5',
  //       message: 'Promo: Get 20% off your next purchase!',
  //       is_read: true,
  //       created_datetime: '2025-12-01T11:05:00.780+00:00',
  //     },
  //     {
  //       rid: '6',
  //       message: 'Your payment of $99 has been processed',
  //       is_read: false,
  //       created_datetime: '2025-11-30T15:27:40.500+00:00',
  //     },
  //     {
  //       rid: '7',
  //       message: 'Security alert: Suspicious activity detected',
  //       is_read: false,
  //       created_datetime: '2025-11-29T08:13:55.210+00:00',
  //     },
  //     {
  //       rid: '8',
  //       message: 'Your profile has been updated successfully',
  //       is_read: true,
  //       created_datetime: '2025-11-28T19:40:12.880+00:00',
  //     },
  //     {
  //       rid: '9',
  //       message: 'Weekly report is now available',
  //       is_read: true,
  //       created_datetime: '2025-11-27T10:22:30.300+00:00',
  //     },
  //     {
  //       rid: '10',
  //       message: 'New message received from support team',
  //       is_read: false,
  //       created_datetime: '2025-11-26T14:50:44.670+00:00',
  //     },
  //   ],
  // };

  // return mockResponse.data;
};

export const useNotifications = (
  userId?: string,
  isEnable?: boolean
): UseQueryResult<NotificationItem[] | undefined, Error> => {
  return useQuery<NotificationItem[] | undefined, Error>({
    queryKey: ['notifications', userId, isEnable],
    queryFn: () => fetchNotifications(userId!),
    retry: 0,
    gcTime: 0,
    enabled: !!userId && isEnable,
  });
};
