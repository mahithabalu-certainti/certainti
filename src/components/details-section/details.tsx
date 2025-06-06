import React from 'react';

interface DetailItem {
  label?: string;
  value?: React.ReactNode;
}

const DetailsSection: React.FC<{
  title: string;
  data: DetailItem[];
  customStyle?: string;
  fullColumn?: boolean;
}> = ({ title, data, customStyle, fullColumn }) => {
  const leftColumn: DetailItem[] = [];
  const middleColumn: DetailItem[] = [];
  const rightColumn: DetailItem[] = [];

  data.forEach((item, index) => {
    if (index % 3 === 0) leftColumn.push(item);
    else if (index % 3 === 1) middleColumn.push(item);
    else rightColumn.push(item);
  });

  const renderValue = (value: React.ReactNode, label?: string) => {
    if (typeof value === 'string') {
      const status = value.toLowerCase();

      if (status === 'active')
        return <span className='text-[#199806]'>Active</span>;

      if (status === 'inactive')
        return <span className='text-[#f44336]'>In-Active</span>;

      if (value === 'empty') return <span></span>;

      if (label?.toLowerCase() === 'website') {
        return (
          <span className='font-medium text-[13px] text-[#425A76]'>
            <a
              href={value}
              target='_blank'
              rel='noreferrer'
              className='underline decoration-[#425A76]'
            >
              {value}
            </a>
          </span>
        );
      }
    }

    // This handles non-string values or fallback
    if (value === 'empty') return <span></span>; // ensure it works even if value is not a string but equals 'empty'

    return (
      <span className='font-medium text-[13px] text-[#425A76]'>
        {value || (value === 0 ? 0 : '-')}
      </span>
    );
  };

  const styleName = customStyle ? customStyle : ' pt-2 mt-3  ';
  return (
    <div className={styleName}>
      {title && (
        <div className='flex items-center align-middle px-6  h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#F5F9FF]'>
          {title}
        </div>
      )}
      <div className='text-sm my-[6px] px-6 grid gap-y-3'>
        {fullColumn
          ? data.map((item, index) => (
              <div
                key={index}
                className='grid grid-cols-[100px_auto] sm:grid-cols-[120px_auto] gap-x-2'
              >
                <div className='text-left font-semibold text-[13px] text-[#425A76] pr-1'>
                  {item.label}
                </div>
                <div className='font-medium text-[13px] break-all overflow-hidden'>
                  {renderValue(item.value)}
                </div>
              </div>
            ))
          : leftColumn.map((leftItem, index) => {
              const midItem = middleColumn[index];
              const rightItem = rightColumn[index];

              return (
                <div
                  key={index}
                  className='grid grid-cols-1 gap-6 md:grid-cols-3'
                >
                  {[leftItem, midItem, rightItem].map(
                    (item, idx) =>
                      item && (
                        <div
                          key={idx}
                          className='grid grid-cols-[100px_auto] sm:grid-cols-[120px_auto] gap-x-2'
                        >
                          <div className='text-left font-semibold text-[13px] text-[#425A76] pr-1'>
                            {item.label}
                          </div>
                          <div className='font-medium text-[13px] break-all overflow-hidden'>
                            {renderValue(item.value, item.label)}
                          </div>
                        </div>
                      )
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
};

export type { DetailItem };
export default DetailsSection;
