import type React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Popover, IconButton, Badge } from '@mui/material';
import {
  blendWithWhite,
  getIconFromMessage,
  getRandomColorForId,
  getRelativeTime,
  getSvgIcon,
} from './helper';
import { NotificationItem } from '../../consultant/types';
import { useNotificationList, useUpdateNotificationList } from '../../admin/service/notification/notification';

import { useRef } from 'react';

export default function NotificationPanel() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [localNotifications, setLocalNotifications] = useState<
    NotificationItem[]
  >([]);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);


  const [offset, setOffset] = useState(0);
  const [limit,setLimit] = useState(0);

  const {
    data: apiNotifications,
    isLoading,
    isError,
  } = useNotificationList(offset,limit);

  const { refetch: triggerUpdate } = useUpdateNotificationList(false);


  useEffect(() => {
    if (apiNotifications?.data?.users) {
      setLocalNotifications((prev) => {
        // If offset is 0, replace; otherwise append
        return offset === 0 ? apiNotifications.data.users : [...prev, ...apiNotifications.data.users];
      });

      // Check for enddate or if we received fewer than limit (assuming 20)
      // @ts-ignore
      if (apiNotifications?.data?.enddate === true) {
        setHasMore(false);
      }
    }
  }, [apiNotifications, offset]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoading) {
      setOffset((prev) => prev + 1);
    }
  };


  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    triggerUpdate();
  };



  const handleClose = () => {
    setAnchorEl(null);
  };

  const sortedNotifications = useMemo(() => {
    return localNotifications;
  }, [localNotifications]);


  // Derived values
  const unreadCount = localNotifications.filter((n) => !n.is_read).length;
  // const unreadNotifications = sortedNotifications.filter((n) => !n.is_read);
  // const readNotifications = sortedNotifications.filter((n) => n.is_read);
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
          <div className='overflow-y-auto max-h-[280px] space-y-2 bg-white p-2' onScroll={handleScroll} ref={scrollContainerRef}>
            {sortedNotifications.map((n) => {
              const icon = getIconFromMessage(n.message);
              const timestamp = getRelativeTime(n.created_datetime);
              const iconBgColor = getRandomColorForId(n.rid);
              const isRead = n.is_read;

              return (
                <div
                  key={n.rid}
                  className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${isRead ? 'bg-gray-50 border-[#CBD6E2] hover:bg-gray-100' : 'bg-blue-50 hover:bg-blue-100 border-blue-200'}`}
                >
                  <div
                    className='w-8 h-8 rounded-full flex items-center justify-center'
                    style={{
                      backgroundColor: isRead ? '#e0e0e0' : blendWithWhite(iconBgColor),
                      color: isRead ? '#686868' : '#3A3A3A',
                    }}
                  >
                    {getSvgIcon(icon, isRead ? '#686868' : '#3A3A3A')}
                  </div>

                  <div className='flex-1'>
                    <p className='text-xs text-[#2A2A2A] line-clamp-1 truncate'>
                      {n.message}
                    </p>
                    <p className='text-xs text-[#425A76] mt-1'>{timestamp}</p>
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className='flex items-center justify-center py-2 text-xs text-[#425A76]'>
                Loading more...
              </div>
            )}
          </div>
        )}

      </Popover >
    </>
  );
}
