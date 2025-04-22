import React from 'react';
import { leftArrowIcon } from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';

interface ResourceTableHeaderProps {
  title?: string;
  titleIcon?: React.ReactNode;
  headerButtons?: {
    label: string;
    variant: 'text' | 'outlined' | 'contained';
    onClick: () => void;
  }[];
  toggleViewMode: () => void;
  showBackArrow?: boolean;
  onBackClick?: () => void;
}

const ResourceTableHeader: React.FC<ResourceTableHeaderProps> = ({
  title = '',
  titleIcon,
  headerButtons = [],
  toggleViewMode,
  showBackArrow = false,
  onBackClick,
}) => {
  const hasTitleSection = title || titleIcon;
  const hasButtons = headerButtons.length > 0;

  return (
    <div className='border-x border-t border-gray-300 mr-2'>
      <div className='flex items-center justify-between p-4'>
        {hasTitleSection && (
          <div className='flex gap-2 items-center'>
            {showBackArrow && (
              <div className='cursor-pointer' onClick={onBackClick}>
                <img src={leftArrowIcon} alt='leftArrowIcon' />
              </div>
              //   <button
              //     onClick={onBackClick}
              //     className='mr-2'
              //     aria-label='Go back'
              //   >

              //   </button>
            )}
            {titleIcon && (
              <div
                className='bg-pink-100 p-2 rounded-lg mr-2'
                role='img'
                aria-hidden='true'
              >
                {titleIcon}
              </div>
            )}
            <h1 className='text-xl font-medium'>{title}</h1>
          </div>
        )}

        {hasButtons && (
          <div className='flex gap-2'>
            {headerButtons.map((button, index) => (
              <TextButton
                key={`header-button-${index}`}
                label={button.label}
                variant={button.variant}
                onClick={
                  button.label.toLowerCase() === 'view'
                    ? toggleViewMode
                    : button.onClick
                }
                aria-label={button.label}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceTableHeader;
