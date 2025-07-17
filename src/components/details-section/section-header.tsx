import React from 'react';
import { SxProps } from '@mui/material';
import { Theme } from '@emotion/react';
import { LeftArrowIcon } from '../../assets';
import TextButton from '../button/text-button';

interface SectionHeaderButton {
  label: string;
  variant: 'text' | 'outlined' | 'contained';
  onClick: () => void;
  sx?: SxProps<Theme>;
  hide?: boolean;
  disabled?: boolean;
}

interface SectionHeaderProps {
  title: string;
  titleIcon?: React.ReactNode;
  count?: number;
  buttons?: SectionHeaderButton[];
  onViewToggle?: () => void;
  showBackArrow?: boolean;
  onBackClick?: () => void;
  subValue?: string;
  showItemCount?: boolean;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  titleIcon,
  count = 0,
  buttons = [],
  onViewToggle,
  showBackArrow = false,
  onBackClick,
  subValue,
  showItemCount = false,
  className,
}) => {
  return (
    <div
      className={
        className
          ? className
          : 'border-t border-[1px] border-b-0 border-[#CBD6E2] rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
      }
    >
      <div className='h-full flex items-center justify-between gap-4 py-1 px-3'>
        <div className='flex items-center gap-1'>
          {showBackArrow && (
            <div
              className='cursor-pointer w-[24px] h-[24px] flex justify-center items-center -ml-2'
              onClick={onBackClick}
            >
              <LeftArrowIcon className='h-[12px]' alt='leftArrowIcon' />
            </div>
          )}

          {titleIcon && (
            <div className='w-[24px] h-[24px] flex items-center justify-center'>
              {titleIcon}
            </div>
          )}

          <div>
            <div className='flex'>
              <h1 className='text-[13px] font-semibold text-[#2D3E4F]'>
                {title}
              </h1>
              {subValue && (
                <div className='text-[13px] font-semibold text-[#2D3E4F] pl-1.5'>
                  {subValue}
                </div>
              )}
            </div>

            {showItemCount && (
              <h2 className='text-[12px] -mt-1.5 font-medium text-[#7D98B6]'>
                {`${count} items`}
              </h2>
            )}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {buttons.map((button, index) =>
            button.hide ? null : (
              <TextButton
                key={`section-header-btn-${index}`}
                label={button.label}
                onClick={
                  button.label.toLowerCase() === 'view'
                    ? onViewToggle
                    : button.onClick
                }
                aria-label={button.label}
                sx={button.sx}
                disabled={button.disabled}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionHeader;
