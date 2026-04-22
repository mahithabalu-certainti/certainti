import React from 'react';

interface PageSkeletonProps {
  showLeftPanel?: boolean;
  showHeader?: boolean;
  showCategories?: boolean;
  showCards?: boolean;
  categoryCount?: number;
  cardsPerCategory?: number;
}

const PageSkeleton: React.FC<PageSkeletonProps> = ({
  showLeftPanel = false,
  showHeader = true,
  showCategories = true,
  showCards = true,
  categoryCount = 2,
  cardsPerCategory = 8,
}) => {
  return (
    <>
      {showLeftPanel ? (
        <div className='flex justify-items-start pl-10 flex-shrink-0 w-[30%] py-10 min-h-[calc(100vh-182px)] max-h-[calc(100vh-182px)] overflow-y-auto'>
          <div className='w-[90%] max-w-[90%] animate-pulse'>
            {[...Array(3)].map((_, index) => (
              <React.Fragment key={index}>
                {/* Card */}
                <div className='border border-gray-300 rounded-lg p-4 min-h-[70px] bg-white'>
                  <div className='flex items-start gap-3'>
                    <div className='w-8 h-8 rounded-full bg-gray-200'></div>

                    <div className='flex-1 space-y-2'>
                      <div className='h-3 w-32 bg-gray-300 rounded'></div>
                      <div className='h-2 w-3/4 bg-gray-200 rounded'></div>
                    </div>
                  </div>
                </div>

                {/* Connector — no space above or below, only if NOT last */}
                {index < 2 && (
                  <div className='pl-[28px]'>
                    <div className='w-[1px] h-8 bg-gray-300'></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <div className='h-full overflow-y-auto space-y-6'>
          {/* HEADER SECTION */}
          {showHeader && (
            <div className='p-6 border-b border-[#CBD6E2] animate-pulse'>
              {/* Page Title */}
              <div className='h-5 w-40 bg-gray-200 rounded mb-4'></div>

              {/* Search Box */}
              <div className='h-9 bg-gray-200 rounded w-full mb-4'></div>

              {/* Tabs */}
              <div className='flex gap-2'>
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    style={{ width: '16.1%' }}
                    className='h-7 bg-gray-200 rounded'
                  ></div>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORY + CARDS */}
          {showCategories &&
            [...Array(categoryCount)].map((_, categoryIndex) => (
              <div key={categoryIndex} className='space-y-4 mb-6 px-6'>
                {/* Category Title */}
                <div className='h-4 bg-gray-200 rounded w-1/4'></div>

                {/* CARDS GRID */}
                {showCards && (
                  <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
                    {[...Array(cardsPerCategory)].map((_, i) => (
                      <div
                        key={i}
                        className='w-full flex items-start gap-3 p-3 rounded-md border border-[#CBD6E2] bg-gray-50 animate-pulse'
                      >
                        <div className='mt-0.5 p-1.5 rounded-md w-7 h-7 flex-shrink-0 bg-gray-300'></div>
                        <div className='flex-1 min-w-0 space-y-2'>
                          <div className='h-3 bg-gray-300 rounded w-3/4'></div>
                          <div className='h-2 bg-gray-200 rounded w-full'></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </>
  );
};

export default PageSkeleton;
