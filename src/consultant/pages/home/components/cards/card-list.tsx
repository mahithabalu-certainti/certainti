import { Skeleton, Tooltip } from '@mui/material';
import { getDynamicSvgIcon } from '../../helpers';
import React from 'react';
import { ExportIcon } from '../../../../../assets';
import { ExportReportType } from '../../../../types';

interface CardListProps<T> {
  title: string;
  subtitle?: string;
  items: T[];
  itemRenderer: (item: T, index: number) => React.ReactNode;
  className?: string;
  maxHeight?: number;
  isLoading?: boolean;
  getItemStyle?: (item: T) => React.CSSProperties;
  exportEnable?: boolean;
  exportKey?: ExportReportType;
  handleExport?: (key: ExportReportType) => void;
}

const CardList = <T,>({
  title,
  subtitle,
  items,
  itemRenderer,
  className = '',
  maxHeight = 400,
  isLoading = false,
  getItemStyle,
  exportEnable = false,
  exportKey,
  handleExport,
}: CardListProps<T>) => {
  if (isLoading) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
      >
        {/* Header Skeleton */}
        <div className='flex items-center gap-3 px-4 py-3 border-b border-gray-200'>
          <div className='flex-shrink-0'>
            <Skeleton variant='circular' width={26} height={26} />
          </div>
          <div className='space-y-1.5'>
            <Skeleton variant='text' width={120} height={24} />
            <Skeleton variant='text' width={180} height={20} />
          </div>
        </div>

        {/* Content Skeleton */}
        <div
          className='px-4 py-3 overflow-y-auto space-y-3'
          style={{ maxHeight: `${maxHeight}px`, minHeight: `${maxHeight}px` }}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className='border-l-4 rounded p-3 bg-white space-y-1'
              style={{
                borderLeftColor: '#E2E8F0',
                boxShadow:
                  'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
              }}
            >
              <Skeleton variant='text' width='40%' height={20} />
              <Skeleton variant='text' width='100%' height={20} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200'>
        <div className='flex items-center gap-3'>
          <div className='flex-shrink-0'>{getDynamicSvgIcon(title, 26)}</div>
          <div>
            <h3 className='text-xl font-semibold text-[#2A2A2A]'>{title}</h3>
            {subtitle && (
              <p className='text-sm text-[#425A76] mt-0.5'>{subtitle}</p>
            )}
          </div>
        </div>
        {exportEnable && exportKey && handleExport && items.length > 0 && (
          <div className='flex-shrink-0'>
            <Tooltip placement='top' title='Export' arrow>
              <button
                className='flex border border-[#CBD6E2] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer'
                onClick={() => handleExport(exportKey)}
              >
                <React.Suspense fallback={null}>
                  <ExportIcon alt='export-icon' className='h-5' />
                </React.Suspense>
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className='flex justify-center items-center h-[200px] text-sm text-[#425A76]'>
          No data available
        </div>
      ) : (
        <div
          className={`px-4 py-3 overflow-y-auto space-y-3`}
          style={{ maxHeight: `${maxHeight}px`, minHeight: `${maxHeight}px` }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className='border-l-4 rounded p-3 bg-white hover:bg-gray-100 space-y-1 overflow-x-hidden'
              style={{
                borderLeftColor: '#CBD6E2',
                boxShadow:
                  'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
                ...getItemStyle?.(item),
              }}
            >
              {itemRenderer(item, index)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CardList;
