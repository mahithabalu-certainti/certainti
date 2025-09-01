
import React from 'react';
import { Skeleton } from '@mui/material';

const SideMenuSkeleton: React.FC<{ isCollapsed?: boolean }> = ({
  isCollapsed,
}) => {
  const renderSkeletonItem = (isSubmenu = false) => (
    <li className={`min-h-[32px] mb-1 flex items-center ${isSubmenu ? (isCollapsed ? 'pl-[15px]' : 'pl-9') : (isCollapsed ? 'pl-[15px]' : 'pl-[15px]')} py-1.5 pr-3`}>
      <Skeleton variant="circular" width={22} height={22} className="flex-shrink-0" />
      {!isCollapsed && (
        <Skeleton variant="text" className="flex-1 ml-2" width="80%" />
      )}
    </li>
  );

  return (
    <div
      className='w-full h-full bg-white border-r border-[#CBD6E2] overflow-hidden'
      style={{
        transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDuration: isCollapsed ? '300ms' : '500ms',
      }}
    >
      {/* Header Skeleton */}
      <div
        className={`flex items-center h-[30px] mb-1 ${
          isCollapsed ? 'justify-center' : ''
        } ${isCollapsed ? 'px-3 ml-2' : 'px-[18px]'}`}
      >
        <div
          className={`flex items-center ${
            !isCollapsed ? 'justify-between w-full' : 'gap-0'
          }`}
        >
          {!isCollapsed && <Skeleton variant="text" width={100} />}
          <Skeleton variant="rectangular" width={18} height={18} />
        </div>
      </div>

      {/* Menu Items Skeleton */}
      <ul className='overflow-y-auto'>
        {renderSkeletonItem()}
        {renderSkeletonItem()}
        {renderSkeletonItem(true)}
        {renderSkeletonItem(true)}
        {renderSkeletonItem()}
        {renderSkeletonItem()}
        {renderSkeletonItem(true)}
        {renderSkeletonItem()}
      </ul>
    </div>
  );
};

export default SideMenuSkeleton;
