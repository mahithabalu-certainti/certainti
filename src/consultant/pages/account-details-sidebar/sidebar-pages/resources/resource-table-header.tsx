/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box } from '@mui/material';
import React from 'react';
import { leftArrowIcon, resourceFilterIcon } from '../../../../../assets';
import { Image } from '../../../../../components';
import TextButton from '../../../../../components/button/text-button';
import Filter from '../../components/filter/filter';
import {
  costFilterFields,
  resourceFilterFields,
  skillFilterFields,
} from './utils';

interface ResourceTableHeaderProps {
  title: string;
  titleIcon: React.ReactNode;
  headerButtons: {
    label: string;
    variant: 'text' | 'outlined' | 'contained';
    onClick: () => void;
  }[];
  toggleViewMode: () => void;
  showBackArrow?: boolean;
  onBackClick?: () => void;
  handleFilter: () => void;
  value: string;
  showFilter: boolean;
  setAppliedFilters: (filters: Record<string, any>) => void;
}

const ResourceTableHeader: React.FC<ResourceTableHeaderProps> = ({
  title = '',
  titleIcon,
  headerButtons = [],
  toggleViewMode,
  showBackArrow = false,
  onBackClick,
  handleFilter,
  setAppliedFilters,
  value,
  showFilter,
}) => {
  const getFilterFields = () => {
    if (!value) return resourceFilterFields;
    return value === 'cost' ? costFilterFields : skillFilterFields;
  };
  return (
    <div className='border-x border-t border-gray-300 mr-2'>
      <div className='flex items-center justify-between p-4'>
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

        <div className='flex gap-2'>
          <Box
            onClick={handleFilter}
            className='h-[35px] w-[38px] flex items-center justify-center border border-[#CBD6E2] cursor-pointer'
          >
            <Image src={resourceFilterIcon} />
          </Box>
          <div className='flex gap-2'>
            {showFilter && (
              <Filter
                filterMenu={getFilterFields()}
                setAppliedFilters={setAppliedFilters}
                handleFilter={handleFilter}
              />
            )}
            {headerButtons?.map((button, index) => (
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
        </div>
      </div>
    </div>
  );
};

export default ResourceTableHeader;
