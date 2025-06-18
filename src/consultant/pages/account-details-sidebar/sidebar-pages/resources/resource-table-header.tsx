/* eslint-disable @typescript-eslint/no-explicit-any */
import { SxProps } from '@mui/material';
import React from 'react';
import { LeftArrowIcon } from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';
import { Theme } from '@emotion/react';
interface ResourceTableHeaderProps {
  title: string;
  titleIcon: React.ReactNode;
  headerButtons: {
    label: string;
    variant: 'text' | 'outlined' | 'contained';
    onClick: () => void;
    sx?: SxProps<Theme>;
    hide?: boolean;
    disabled?: boolean;
  }[];
  toggleViewMode?: () => void;
  showBackArrow?: boolean;
  onBackClick?: () => void;
  value: string;
  resourceNumber?: string;
}

const ResourceTableHeader: React.FC<ResourceTableHeaderProps> = ({
  title = '',
  titleIcon,
  headerButtons = [],
  toggleViewMode,
  showBackArrow = false,
  onBackClick,
  value,
  resourceNumber,
}) => {
  return (
    <div className='border-t border-[1px] border-b-0 border-[#CBD6E2] rounded-tl-[2px] h-[38px] rounded-tr-[2px]'>
      <div className='h-full flex items-center justify-between gap-4 py-1 px-2'>
        <div className='flex items-center gap-1'>
          {showBackArrow && (
            <div
              className='cursor-pointer w-[24px] h-[24px] flex justify-center items-center -ml-2'
              onClick={onBackClick}
            >
              <LeftArrowIcon
                className='h-[12px]'
                alt='leftArrowIcon'
              />
            </div>
            //   <button
            //     onClick={onBackClick}
            //     className='mr-2'
            //     aria-label='Go back'
            //   >

            //   </button>
          )}
          {titleIcon && (
            <div className='w-[24px] h-[24px] flex items-center justify-center'>
              {titleIcon}
            </div>
          )}
          <h1 className='text-[14px] font-medium text-[#2D3E4F]'>{title}</h1>
          <div className='text-[14px] font-medium text-[#2D3E4F]'>
            {(value === 'details' || value === 'cost' || value === 'skill') &&
              resourceNumber}
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
