import type React from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Popover, IconButton, Badge, Button } from '@mui/material';
import {
  blendWithWhite,
  getIconFromMessage,
  getRandomColorForId,
  getRelativeTime,
  getSvgIcon,
} from './helper';
import { NotificationItem } from '../../consultant/types';
import { useNotifications } from '../../consultant/services/notification/notification-service';

export default function NotificationPanel() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<
    NotificationItem[]
  >([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const userId = 'current-user-id';

  const {
    data: apiNotifications = [],
    isLoading,
    isError,
  } = useNotifications(userId, true);

  // Initialize localNotifications only once when API data is loaded
  useEffect(() => {
    if (apiNotifications.length > 0 && !isInitialized) {
      setLocalNotifications(apiNotifications);
      setIsInitialized(true);
    }
  }, [apiNotifications, isInitialized]);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setShowAll(false);
  };

  const handleMarkAsRead = useCallback((id: string) => {
    setLocalNotifications((prev) =>
      prev.map((notification) =>
        notification.rid === id
          ? { ...notification, is_read: true }
          : notification
      )
    );
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setLocalNotifications((prev) =>
      prev.map((notification) => ({ ...notification, is_read: true }))
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setLocalNotifications((prev) =>
      prev.filter((notification) => notification.rid !== id)
    );
  }, []);

  const sortedNotifications = useMemo(() => {
    return [...localNotifications].sort((a, b) => {
      if (a.is_read !== b.is_read) {
        return a.is_read ? 1 : -1;
      }
      return (
        new Date(b.created_datetime).getTime() -
        new Date(a.created_datetime).getTime()
      );
    });
  }, [localNotifications]);

  const displayedNotifications = useMemo(() => {
    if (showAll) {
      return sortedNotifications;
    }
    return sortedNotifications.slice(0, 5);
  }, [sortedNotifications, showAll]);

  // Derived values
  const unreadCount = localNotifications.filter((n) => !n.is_read).length;
  const unreadNotifications = displayedNotifications.filter((n) => !n.is_read);
  const readNotifications = displayedNotifications.filter((n) => n.is_read);
  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      {/* Bell Icon */}
      <IconButton size='large' onClick={handleOpen} color='inherit'>
        <Badge
          badgeContent={unreadCount}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '10px',
              height: '16px',
              minWidth: '16px',
              padding: '0 4px',
              backgroundColor: '#FF7256',
              color: 'white',
              right: 3,
              top: 2,
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
            <div className='flex gap-2'>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className='text-[11px] text-blue-500 hover:underline flex items-center justify-center cursor-pointer'
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
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
          <div className='overflow-y-auto max-h-[280px] space-y-2 bg-white p-2'>
            {/* UNREAD */}
            {unreadNotifications.map((n) => {
              const icon = getIconFromMessage(n.message);
              const timestamp = getRelativeTime(n.created_datetime);
              const iconBgColor = getRandomColorForId(n.rid);

              return (
                <div
                  key={n.rid}
                  className='px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-2'
                >
                  <div
                    className='w-8 h-8 rounded-full flex items-center justify-center'
                    style={{
                      backgroundColor: blendWithWhite(iconBgColor),
                      color: '#3A3A3A',
                    }}
                  >
                    {getSvgIcon(icon, '#3A3A3A')}
                  </div>

                  <div className='flex-1'>
                    <p className='text-xs text-[#2A2A2A] line-clamp-1 truncate'>
                      {n.message}
                    </p>
                    <p className='text-xs text-[#425A76] mt-1'>{timestamp}</p>
                  </div>

                  <div className='flex gap-0.5'>
                    <button
                      onClick={() => handleMarkAsRead(n.rid)}
                      className='w-6 h-6 rounded-full text-blue-500 hover:bg-blue-200 flex items-center justify-center cursor-pointer'
                      title='Mark as read'
                    >
                      {getSvgIcon('done', '#425A76')}
                    </button>

                    <button
                      onClick={() => handleDelete(n.rid)}
                      className='w-6 h-6 rounded-full text-[#425A76] hover:bg-gray-200 flex items-center justify-center cursor-pointer'
                      title='Delete notification'
                    >
                      {getSvgIcon('close', '#425A76')}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* READ */}
            {readNotifications.map((n) => {
              const icon = getIconFromMessage(n.message);
              const timestamp = getRelativeTime(n.created_datetime);

              return (
                <div
                  key={n.rid}
                  className='px-3 py-2 rounded-lg bg-gray-50 border border-[#CBD6E2] hover:bg-gray-100 flex items-center gap-2'
                >
                  <div className='w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center'>
                    {getSvgIcon(icon, '#686868')}
                  </div>

                  <div className='flex-1'>
                    <p className='text-xs text-[#2A2A2A] line-clamp-1 truncate'>
                      {n.message}
                    </p>
                    <p className='text-xs text-[#425A76] mt-1'>{timestamp}</p>
                  </div>

                  <button
                    onClick={() => handleDelete(n.rid)}
                    className='w-6 h-6 rounded-full text-[#425A76] hover:bg-gray-200 flex items-center justify-center cursor-pointer'
                    title='Delete notification'
                  >
                    {getSvgIcon('close', '#425A76')}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {localNotifications.length > 5 && (
          <div className='border-t border-[#CBD6E2] bg-gray-50 px-3 py-2 rounded-b-[8px]'>
            <Button
              fullWidth
              variant='text'
              onClick={() => setShowAll((prev) => !prev)}
              sx={{
                textTransform: 'none',
                color: '#0066cc',
                fontSize: '0.75rem',
              }}
            >
              {showAll ? 'View Less' : 'View All'}
            </Button>
          </div>
        )}
      </Popover>
    </>
  );
}
