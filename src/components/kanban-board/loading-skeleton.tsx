import React from 'react';
import { Skeleton } from '@mui/material';

interface LoadingSkeletonProps {
  count?: number;
  variant?: 'comment' | 'activity';
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  count = 2,
  variant = 'comment',
}) => {
  const isComment = variant === 'comment';

  return (
    <div className='space-y-3'>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className='flex gap-3 pb-3 border-b border-gray-200 last:border-b-0 rounded-lg p-3 -mx-3'
        >
          {/* Avatar Skeleton */}
          <div className='flex-shrink-0'>
            <Skeleton
              variant='circular'
              width={32}
              height={32}
              sx={{
                bgcolor: isComment
                  ? 'rgba(0, 0, 0, 0.08)'
                  : 'rgba(139, 92, 246, 0.15)',
              }}
            />
          </div>

          {/* Content Skeleton */}
          <div
            className={`flex-1 min-w-0 ${isComment ? 'space-y-2' : 'space-y-1.5'}`}
          >
            {isComment ? (
              <>
                {/* User name and date for comments */}
                <div className='space-y-1'>
                  <Skeleton
                    variant='text'
                    width='30%'
                    height={16}
                    sx={{ bgcolor: 'rgba(0, 0, 0, 0.08)' }}
                  />
                  <Skeleton
                    variant='text'
                    width='20%'
                    height={12}
                    sx={{ bgcolor: 'rgba(0, 0, 0, 0.06)' }}
                  />
                </div>

                {/* Comment text */}
                <div className='space-y-1'>
                  <Skeleton
                    variant='text'
                    width='95%'
                    height={14}
                    sx={{ bgcolor: 'rgba(0, 0, 0, 0.08)' }}
                  />
                  <Skeleton
                    variant='text'
                    width='85%'
                    height={14}
                    sx={{ bgcolor: 'rgba(0, 0, 0, 0.08)' }}
                  />
                  <Skeleton
                    variant='text'
                    width='60%'
                    height={14}
                    sx={{ bgcolor: 'rgba(0, 0, 0, 0.08)' }}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Activity text */}
                <Skeleton
                  variant='text'
                  width='90%'
                  height={16}
                  sx={{ bgcolor: 'rgba(0, 0, 0, 0.08)' }}
                />

                {/* Date */}
                <Skeleton
                  variant='text'
                  width='25%'
                  height={12}
                  sx={{ bgcolor: 'rgba(0, 0, 0, 0.06)' }}
                />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
