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
  filterVisibility: boolean;
  title: string;
  titleIcon: React.ReactNode;
  headerButtons: {
    label: string;
    variant: 'text' | 'outlined' | 'contained';
    onClick: () => void;
  }[];
  toggleViewMode?: () => void;
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
  filterVisibility,
}) => {
  const getFilterFields = () => {
    if (!value) return resourceFilterFields;
    return value === 'cost' ? costFilterFields : skillFilterFields;
  };
  return (
    <div className='mr-2 border-t border-[1px] border-b-0 border-[#CBD6E2] rounded-tl-[2px] rounded-tr-[2px]'>
      <div className='flex items-center justify-between p-4'>
        <div className='flex items-center gap-2'>
          {showBackArrow && (
            <div className='cursor-pointer w-[24px] h-[24px] flex justify-center items-center -ml-2' onClick={onBackClick}>
              <img src={leftArrowIcon} className='h-[16px]' alt='leftArrowIcon' />
            </div>
            //   <button
            //     onClick={onBackClick}
            //     className='mr-2'
            //     aria-label='Go back'
            //   >

            //   </button>
          )}
          {titleIcon && (
            < div className='w-[24px] h-[24px] flex items-center justify-center'>
              {titleIcon}
            </div>
          )}
          <h1 className='text-sm font-medium leading-none tracking-normal text-[#2D3E4F]'>{title}</h1>
        </div>

        <div className='flex gap-2'>
          <Box className='relative'>
            {filterVisibility && (
              <Box
                onClick={handleFilter}
                className='h-[35px] w-[38px] flex items-center justify-center border border-[#CBD6E2] cursor-pointer'
              >
                <Image src={resourceFilterIcon} />
              </Box>
            )}
            {showFilter && value !== 'details' && (
              <Box className='absolute right-0 z-50'>
                <Filter
                  filterMenu={getFilterFields()}
                  setAppliedFilters={setAppliedFilters}
                  handleFilter={handleFilter}
                />
              </Box>
            )}
          </Box>
          <div className='flex gap-2'>
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
