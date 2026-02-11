import { Skeleton } from '@mui/material';
import { getDynamicSvgIcon } from '../../helpers';

interface CardListProps<T> {
  title: string;
  subtitle?: string;
  items: T[];
  itemRenderer: (item: T, index: number) => React.ReactNode;
  className?: string;
  maxHeight?: number;
  isLoading?: boolean;
  getItemStyle?: (item: T) => React.CSSProperties;
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
          style={{ maxHeight: `${maxHeight}px` }}
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
      <div className='flex items-center gap-3 px-4 py-3 border-b border-gray-200'>
        <div className='flex-shrink-0'>{getDynamicSvgIcon(title, 26)}</div>
        <div>
          <h3 className='text-xl font-semibold text-[#2A2A2A]'>{title}</h3>
          {subtitle && (
            <p className='text-sm text-[#425A76] mt-0.5'>{subtitle}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className={`px-4 py-3 overflow-y-auto space-y-3`}
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {items.length === 0 ? (
          <div className='flex justify-center items-center h-[360px] text-sm text-[#425A76] italic'>
            No data available
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className='border-l-4 rounded p-3 bg-white hover:bg-gray-100 space-y-1'
              style={{
                borderLeftColor: '#CBD6E2',
                boxShadow:
                  'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
                ...getItemStyle?.(item),
              }}
            >
              {itemRenderer(item, index)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CardList;
