import { IconButton, Snackbar, Tooltip } from '@mui/material';
import React, { useState } from 'react';
import { CopyIcon } from '../../assets';

interface DetailItem {
  label?: string;
  value?: React.ReactNode;
}

const DetailsSection: React.FC<{
  title: string;
  data: DetailItem[];
  customStyle?: string;
  fullColumn?: boolean;
  isAudit?: boolean;
}> = ({ title, data, customStyle, fullColumn, isAudit }) => {
  const leftColumn: DetailItem[] = [];
  const middleColumn: DetailItem[] = [];
  const rightColumn: DetailItem[] = [];

  if (isAudit) {
    data.forEach((item, index) => {
      if (index % 2 === 0) leftColumn.push(item);
      else middleColumn.push(item);
    });
  } else {
    data.forEach((item, index) => {
      if (index % 3 === 0) leftColumn.push(item);
      else if (index % 3 === 1) middleColumn.push(item);
      else rightColumn.push(item);
    });
  }

  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const handleCopy = (valueToCopy: string) => {
    navigator.clipboard.writeText(valueToCopy);
    setCopiedValue(valueToCopy);
    setTimeout(() => setCopiedValue(null), 1500);
  };

  const renderValue = (value: React.ReactNode, label?: string) => {
    if (value === 'empty') return <span></span>;

    if (typeof value === 'string') {
      const status = value.toLowerCase();

      if (status === 'active')
        return <span className='text-[#199806]'>Active</span>;

      if (status === 'inactive')
        return <span className='text-[#f44336]'>In-Active</span>;

      if (label?.toLowerCase() === 'website') {
        const hasProtocol = /^https?:\/\//i.test(value);
        const formattedHref = hasProtocol ? value : `https://${value}`;
        return (
          <span className='font-medium text-[13px] text-[#425A76]'>
            <a
              href={formattedHref}
              target='_blank'
              rel='noopener noreferrer'
              className='underline decoration-[#425A76]'
            >
              {value}
            </a>
          </span>
        );
      }

      return (
        <Tooltip
          title={
            <div className='flex items-center gap-1'>
              <span className='break-all max-w-[200px]'>{value}</span>
              <IconButton
                size='small'
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(value);
                }}
              >
                <CopyIcon alt='copy-icon' className='w-3.5 h-3.5' />
              </IconButton>
            </div>
          }
          arrow
          placement='top-start'
        >
          <span className='font-medium text-[13px] text-[#425A76] truncate max-w-full inline-block'>
            {value}
          </span>
        </Tooltip>
      );
    }

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
        <div className='flex items-center align-middle px-6  h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
          {title}
        </div>
      )}
      <div className='text-sm my-[6px] px-6 grid gap-y-3'>
        {fullColumn
          ? data.map((item, index) => (
              <div
                key={index}
                className='grid grid-cols-[100px_auto] sm:grid-cols-[200px_auto] gap-x-2'
              >
                <div className='text-left font-semibold text-[13px] text-[#425A76] pr-1'>
                  {item.label}
                </div>
                <div className='font-medium text-[13px] break-all overflow-hidden text-ellipsis whitespace-nowrap'>
                  {renderValue(item.value)}
                </div>
              </div>
            ))
          : leftColumn.map((leftItem, index) => {
              const midItem = middleColumn[index];
              const rightItem = isAudit ? undefined : rightColumn[index];

              const itemsToRender = isAudit
                ? [leftItem, midItem]
                : [leftItem, midItem, rightItem];

              return (
                <div
                  key={index}
                  className={`grid grid-cols-1 gap-6 ${
                    isAudit ? 'md:grid-cols-2 w-full' : 'md:grid-cols-3'
                  }`}
                >
                  {itemsToRender.map(
                    (item, idx) =>
                      item && (
                        <div
                          key={idx}
                          className='grid grid-cols-[100px_auto] sm:grid-cols-[200px_auto] gap-x-2'
                        >
                          <div className='text-left font-semibold text-[13px] text-[#425A76] pr-1'>
                            {item.label}
                          </div>
                          <div className='font-medium text-[13px] break-all overflow-hidden text-ellipsis whitespace-nowrap'>
                            {renderValue(item.value, item.label)}
                          </div>
                        </div>
                      )
                  )}
                </div>
              );
            })}
      </div>
      <Snackbar
        open={!!copiedValue}
        autoHideDuration={1500}
        message='Copied to clipboard'
      />
    </div>
  );
};

export type { DetailItem };
export default DetailsSection;
