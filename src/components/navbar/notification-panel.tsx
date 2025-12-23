import type React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Popover, IconButton, Badge } from '@mui/material';
import { getRelativeTime, getSvgIcon } from './helper';
import { NotificationItem } from '../../admin/types/notification';
import {
  useNotificationList,
  useUpdateNotificationList,
} from '../../admin/service/notification/notification';

import { useRef } from 'react';
import { getDynamicSvgIcon } from '../../admin/pages/workflow-builder/form/helper';
import { useWebSocketEvent } from '../../hooks/use-websocket';
import { useToast } from '../../hooks/use-toast';

export default function NotificationPanel() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [localNotifications, setLocalNotifications] = useState<
    NotificationItem[]
  >([]);
  const [nextOffset, setNextOffset] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isTabVisible, setIsTabVisible] = useState(true);

  const [currentOffset, setCurrentOffset] = useState<string | number>(0);
  const [limit] = useState(10);

  const {
    data: apiNotifications,
    isLoading,
    isError,
    refetch: refetchNotifications,
  } = useNotificationList(currentOffset, limit);

  const { refetch: triggerMarkAsRead } = useUpdateNotificationList(false);
  const { showToast } = useToast();

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

  // Track tab visibility using Page Visibility API
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    // Set initial state
    setIsTabVisible(!document.hidden);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window && Notification.permission === 'default') {
      console.log(
        'Browser notifications supported. Permission will be requested on first notification.'
      );
    }
  }, []);

  // Function to request notification permission and show notification
  const showBrowserNotification = async (title: string, body: string) => {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    // Request permission if not already granted or denied
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
    }

    // Show notification if permission granted
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'notification',
        requireInteraction: false,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    }

    return false;
  };

  // Listen for real-time notification updates via WebSocket
  useWebSocketEvent('*', (message) => {
    // Check if this is a notification message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageData = message as any;
    const isNotification =
      message?.type === 'notification' ||
      messageData?.id ||
      message?.data?.notification_message;

    if (isNotification) {
      const notificationMessage =
        message?.data?.notification_message ||
        messageData?.message ||
        message?.data?.message ||
        'New notification received';

      // Industry Standard Notification Architecture
      if (isTabVisible) {
        // Tab is active and visible → Show in-app toast
        showToast(`${notificationMessage}`, 'info');
      } else {
        // Tab is inactive, minimized, or in background → Show browser notification
        showBrowserNotification('New Notification', notificationMessage);
      }

      // Update unread count
      setUnreadCount((prev) => prev + 1);

      // Only refetch if popup is closed to avoid glitch
      if (!anchorEl) {
        setCurrentOffset(0);
        setLocalNotifications([]);
        refetchNotifications();
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
                    {getDynamicSvgIcon(message, 16, '#686868')}
                  </div>

                  <div className='flex-1'>
                    <p className='text-xs text-[#2A2A2A] text-wrap'>
                      {message}
                    </p>
                    <p className='text-xs text-[#425A76] mt-1'>{timestamp}</p>
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
