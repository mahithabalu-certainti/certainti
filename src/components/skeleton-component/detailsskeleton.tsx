import React from 'react';
import SingleSkeleton from './singleskeleton';

interface DetailsSectionSkeletonProps {
  fullColumn?: boolean;
  isAudit?: boolean;
  rows?: number;
}

const DetailsSectionSkeleton: React.FC<DetailsSectionSkeletonProps> = ({
  fullColumn = false,
  isAudit = false,
  rows = 9,
}) => {
  const getGridCols = () => {
    if (fullColumn) return 'grid-cols-1';
    if (isAudit) return 'md:grid-cols-2';
    return 'md:grid-cols-3';
  };

  const getItemsPerRow = () => {
    if (fullColumn) return 1;
    if (isAudit) return 2;
    return 3;
  };

  const skeletonRows = Array.from({
    length: Math.ceil(rows / getItemsPerRow()),
  });

  return (
    <div className='pt-2 mt-3'>
      <div className='flex items-center align-middle px-6 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
        <SingleSkeleton width={120} height={18} variant='text' />
      </div>
      <div className='text-sm my-[6px] px-6 grid gap-y-3'>
        {skeletonRows.map((_, rowIndex) => (
          <div key={rowIndex} className={`grid gap-6 ${getGridCols()}`}>
            {Array.from({ length: getItemsPerRow() }).map((_, colIndex) => (
              <div
                key={colIndex}
                className='grid grid-cols-[100px_auto] sm:grid-cols-[200px_auto] gap-x-2 min-w-0'
              >
                <div className='pr-1'>
                  <SingleSkeleton width='80%' height={18} variant='text' />
                </div>
                <div className='min-w-0'>
                  <SingleSkeleton width='100%' height={18} variant='text' />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className='flex items-center align-middle px-6 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
        <SingleSkeleton width={120} height={18} variant='text' />
      </div>
      <div className='text-sm my-[6px] p-6 grid gap-y-3'>
        {skeletonRows.map((_, rowIndex) => (
          <div key={rowIndex} className={`grid gap-6 ${getGridCols()}`}>
            {Array.from({ length: getItemsPerRow() }).map((_, colIndex) => (
              <div
                key={colIndex}
                className='grid grid-cols-[100px_auto] sm:grid-cols-[200px_auto] gap-x-2 min-w-0'
              >
                <div className='pr-1'>
                  <SingleSkeleton width='80%' height={18} variant='text' />
                </div>
                <div className='min-w-0'>
                  <SingleSkeleton width='100%' height={18} variant='text' />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className='flex items-center align-middle px-6 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
        <SingleSkeleton width={120} height={18} variant='text' />
      </div>
      <div className='text-sm my-[6px] px-6 grid gap-y-3'>
        {skeletonRows.map((_, rowIndex) => (
          <div key={rowIndex} className={`grid gap-6 ${getGridCols()}`}>
            {Array.from({ length: getItemsPerRow() }).map((_, colIndex) => (
              <div
                key={colIndex}
                className='grid grid-cols-[100px_auto] sm:grid-cols-[200px_auto] gap-x-2 min-w-0'
              >
                <div className='pr-1'>
                  <SingleSkeleton width='80%' height={18} variant='text' />
                </div>
                <div className='min-w-0'>
                  <SingleSkeleton width='100%' height={18} variant='text' />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailsSectionSkeleton;
