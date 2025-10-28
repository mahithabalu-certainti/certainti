/* eslint-disable @typescript-eslint/no-explicit-any */
import { SxProps } from '@mui/material';
import React from 'react';
import TextButton from '../../../../../components/button/text-button';
import { Theme } from '@emotion/react';

interface ResourceTableHeaderProps {
  title: string;
  titleIcon: React.ReactNode;
  count?: number;
  headerButtons?: {
    label: string;
    variant: 'text' | 'outlined' | 'contained';
    loading?: boolean;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    sx?: SxProps<Theme>;
    hide?: boolean;
    disabled?: boolean;
  }[];
  toggleViewMode?: () => void;
  showBackArrow?: boolean;
  onBackClick?: () => void;
  value: string;
  resourceNumber?: string;
  showCount?: boolean;
  iconBg?: string;
  bgType?: 'circle' | 'react';
}

const ResourceTableHeader: React.FC<ResourceTableHeaderProps> = ({
  title = '',
  titleIcon,
  count,
  headerButtons = [],
  toggleViewMode,
  value,
  resourceNumber,
  showCount = true,
  iconBg,
  bgType,
}) => {
  return (
    <div className='border-t border-[1px] border-b-0 border-[#CBD6E2] rounded-tl-[2px] h-[40px] rounded-tr-[2px]'>
      <div className='h-full flex items-center justify-between gap-4 py-1 px-3'>
        <div className='flex items-center gap-1'>
          {/* {showBackArrow && (
            <div
              className='cursor-pointer w-[24px] h-[24px] flex justify-center items-center -ml-2'
              onClick={onBackClick}
            >
              <LeftArrowIcon className='h-[12px]' alt='leftArrowIcon' />
            </div>
          )} */}
          {titleIcon && (
            <div
              className={`w-[24px] h-[24px] flex items-center justify-center ${bgType === 'circle' ? 'rounded-full' : 'rounded-[4px]'}`}
              style={{ backgroundColor: iconBg }}
            >
              {titleIcon}
            </div>
          )}
          <div>
            <div className='flex'>
              <h1 className='text-[13px] font-semibold text-[#2D3E4F]'>
                {title}
              </h1>
              <div className='text-[13px] font-semibold text-[#2D3E4F] pl-1.5'>
                {(value === 'details' ||
                  value === 'cost' ||
                  value === 'skill' ||
                  value === 'attachments') &&
                  resourceNumber}
              </div>
            </div>

            {showCount && value !== 'details' && (
              <h1 className='text-[12px] -mt-1.5 font-medium text-[#7D98B6]'>
                {`${(count ?? 0) > 0 ? count : 0} items`}
              </h1>
            )}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <div className='flex gap-2'>
            {headerButtons?.map((button, index) => {
              if (button.hide) return null;
              return (
                <TextButton
                  key={`header-button-${index}`}
                  label={button.label}
                  loading={button.loading}
                  onClick={
                    button.label.toLowerCase() === 'view'
                      ? toggleViewMode
                      : button.onClick
                  }
                  aria-label={button.label}
                  sx={button.sx}
                  disabled={button.disabled}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceTableHeader;
