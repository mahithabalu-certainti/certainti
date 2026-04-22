import type React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Popover, IconButton, Badge } from '@mui/material';
import { getRelativeTime, getSvgIcon } from './helper';
import { sanitizeHtml, stripHtmlTags } from '../../utils/html-utils';
import { NotificationItem } from '../../admin/types/notification';
import {
  useNotificationList,
  useUpdateNotificationList,
} from '../../admin/service/notification/notification';
import { getDynamicSvgIcon } from '../../admin/pages/workflow-builder/form/helper';
import { useWebSocketEvent } from '../../hooks/use-websocket';
import { useServiceWorkerPush } from '../../hooks/use-service-worker-push';

export default function NotificationPanel() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [localNotifications, setLocalNotifications] = useState<
    NotificationItem[]
  >([]);
  const [nextOffset, setNextOffset] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [currentOffset, setCurrentOffset] = useState<string | number>(0);

  const {
    data: apiNotifications,
    isLoading,
    isError,
    refetch: refetchNotifications,
  } = useNotificationList(currentOffset, 10);

  const { refetch: triggerMarkAsRead } = useUpdateNotificationList(false);

  // Service Worker Push API
  const {
    isSupported: isPushSupported,
    showNotification: showPushNotification,
  } = useServiceWorkerPush();

  useEffect(() => {
    if (apiNotifications?.data) {
      const {
        notifications,
        nextOffset: apiNextOffset,
        unreadCount,
      } = apiNotifications.data;

      setLocalNotifications((prev) => {
        return currentOffset === 0
          ? notifications
          : [...prev, ...notifications];
      });

      setNextOffset(apiNextOffset);
      setUnreadCount(unreadCount);
    }
  }, [apiNotifications, currentOffset]);

  // Listen for real-time notification updates via WebSocket
  useWebSocketEvent('*', (message) => {
    // Ignore pong messages from keep-alive
    if (message?.type === 'pong') {
      return;
    }

    // Check if this is a notification message
    // Azure Web PubSub sends notifications as type 'message' with data object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageData = message as any;

    const isNotification =
      message?.type === 'notification' ||
      (message?.type === 'message' && message?.data) || // Azure Web PubSub format
      messageData?.id ||
      message?.data?.notification_message ||
      messageData?.notification_message;

    if (isNotification) {
      const notificationMessage =
        message?.data?.notification_message ||
        messageData?.notification_message ||
        messageData?.message ||
        message?.data?.message ||
        'New notification received';

      // Show browser notification via Service Worker
      // Using consistent tag prevents duplicate notifications across multiple tabs
      if (isPushSupported) {
        // Strip HTML tags for browser notification to show plain text
        const plainTextMessage = stripHtmlTags(notificationMessage);

        showPushNotification('New Notification', {
          body: plainTextMessage,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: `websocket-notification-${Date.now()}`, // Unique tag each time
          requireInteraction: false,
          data: {
            url: window.location.origin,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Update unread count
      setUnreadCount((prev) => prev + 1);

      // Always refetch notifications to get the latest data from server
      setCurrentOffset(0);
      refetchNotifications();

      // If popup is open, automatically mark new notifications as read
      if (anchorEl) {
        // Delay slightly to ensure refetch completes first
        setTimeout(async () => {
          try {
            await triggerMarkAsRead();
            setUnreadCount(0);
          } catch (error) {
            console.error('Failed to mark notifications as read:', error);
          }
        }, 300);
      }
    }
  });

  // Handle infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;

    // Load more when user scrolls near the bottom
    if (
      scrollHeight - scrollTop <= clientHeight + 50 &&
      nextOffset !== null &&
      !isLoading
    ) {
      setCurrentOffset(nextOffset);
    }
  };

  // Handle bell icon click - open popup and mark all as read
  const handleOpen = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);

    // If there are unread notifications, mark them as read
    if (unreadCount > 0) {
      try {
        await triggerMarkAsRead();
        // Update unread count immediately without clearing notifications
        setUnreadCount(0);
      } catch (error) {
        console.error('Failed to mark notifications as read:', error);
      }
    }
  };

  const handleClose = () => {
    setAnchorEl(null);

    // Refetch notifications when closing to get latest data
    setCurrentOffset(0);
    setLocalNotifications([]);
    refetchNotifications();
  };

  const sortedNotifications = useMemo(() => {
    return localNotifications;
  }, [localNotifications]);

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      {/* Bell Icon */}
      <IconButton
        size='large'
        onClick={handleOpen}
        color='inherit'
        sx={{ mb: '2px' }}
      >
        <Badge
          badgeContent={unreadCount}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '9px',
              height: '15px',
              minWidth: '15px',
              padding: '0px 4px',
              backgroundColor: '#FF7256',
              color: 'white',
              right: 4,
              top: 3,
            },
          }}
        >
          {getSvgIcon('bell')}
        </Badge>
      </IconButton>

      {/* Popover */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            width: '340px',
            maxHeight: '480px',
            mt: '-5px',
            border: '1px solid #CBD6E2',
          },
        }}
      >
        {/* Header */}
        <div className='sticky top-0 z-10 border-b border-[#CBD6E2] bg-white px-4 py-3 rounded-t-[8px]'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-base font-semibold text-[#2A2A2A]'>
                Notifications
              </h2>
              {unreadCount > 0 && (
                <p className='text-xs text-[#425A76]'>{unreadCount} unread</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading && localNotifications.length === 0 ? (
          <div className='flex items-center justify-center py-8 text-xs text-[#425A76]'>
            Loading...
          </div>
        ) : isError ? (
          <div className='flex flex-col items-center justify-center py-8 text-[#425A76]'>
            {getSvgIcon('bell')}
            <p className='text-xs'>Failed to load notifications</p>
          </div>
        ) : localNotifications.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-8 text-[#425A76]'>
            {getSvgIcon('bell')}
            <p className='text-xs'>No notifications available</p>
          </div>
        ) : (
          <div
            className='overflow-y-auto max-h-[280px] space-y-2 bg-white p-2'
            onScroll={handleScroll}
            ref={scrollContainerRef}
          >
            {sortedNotifications.map((n, index) => {
              const message = n?.notification_message || '';
              const timestamp = getRelativeTime(n.created_datetime);
              // Sanitize HTML to prevent XSS attacks while preserving safe formatting
              const sanitizedMessage = sanitizeHtml(message);
              const plainTextMessage = stripHtmlTags(message);

              return (
                <div
                  key={`${n.rid}-${index + 1}`}
                  className={`px-3 py-2 rounded-lg border flex items-center gap-2 bg-gray-50 border-[#CBD6E2] hover:bg-gray-100`}
                >
                  <div
                    className='w-8 h-8 rounded-full flex items-center justify-center'
                    style={{
                      backgroundColor: '#e0e0e0',
                      color: '#686868',
                    }}
                  >
                    {getDynamicSvgIcon(plainTextMessage, 16, '#686868')}
                  </div>

                  <div className='flex-1'>
                    <div
                      className='text-xs text-[#2A2A2A] leading-tight [&>*]:m-0 [&>*]:leading-tight [&>*:last-child]:mb-0 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_s]:line-through [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_h4]:text-xs [&_h4]:font-medium [&_h5]:text-xs [&_h5]:font-medium [&_h6]:text-xs [&_h6]:font-medium [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mt-1 [&_ul]:mb-0 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mt-1 [&_ol]:mb-0 [&_li]:mb-0 [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-2 [&_blockquote]:italic [&_code]:font-mono [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_pre]:font-mono [&_pre]:bg-gray-100 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_img]:max-w-full [&_img]:rounded [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300 [&_table]:mt-1 [&_table]:mb-0 [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-gray-300 [&_td]:px-2 [&_td]:py-1'
                      dangerouslySetInnerHTML={{ __html: sanitizedMessage }}
                    />
                    <p className='text-xs text-[#425A76] mt-1 leading-tight'>
                      {timestamp}
                    </p>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className='flex items-center justify-center py-2 text-xs text-[#425A76]'>
                Loading more...
              </div>
            )}

            {!isLoading &&
              nextOffset === null &&
              localNotifications.length > 0 && (
                <div className='flex items-center justify-center py-2 text-xs text-[#425A76]'>
                  No more notifications
                </div>
              )}
          </div>
        )}
      </Popover>
    </>
  );
}
