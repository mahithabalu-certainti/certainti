import React from 'react';
import { Detail } from '../../admin/types/admin-user-detail';
import { getDateTimeFormat } from '../../common-utils';
import { UserDetail } from '../../common-service';
import { Skeleton } from '@mui/material';

export const UserDetailComponent = ({ data, loading }: UserDetail) => {
  const renderRows = (left: Detail[], right: Detail[]) => {
    const maxLength = Math.max(left.length, right.length);

    const DetailRow = ({
      detail,
      isLoading,
    }: {
      detail: Detail | undefined;
      isLoading: boolean;
    }) => (
      <div className='grid grid-cols-[1fr_2fr] gap-1 items-center justify-center border-b border-gray-200 py-2'>
        <div className='font-bold text-left'>{detail?.label ?? ''}</div>
        <div className='break-words whitespace-normal max-w-full'>
          {isLoading ? (
            <Skeleton variant='rounded' width='100%' />
          ) : (
            (detail?.value ?? '')
          )}
        </div>
      </div>
    );

    return Array.from({ length: maxLength }).map((_, index) => (
      <React.Fragment key={index}>
        <DetailRow detail={left[index]} isLoading={loading} />
        <DetailRow detail={right[index]} isLoading={loading} />
      </React.Fragment>
    ));
  };

  const capitalizeFirstLetter = (str?: string) => {
    if (str) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    return 'N/A';
  };

  // Map your API data to the mock data structure
  const getValueOrDefault = (
    value?: string | number | null,
    defaultValue = 'N/A'
  ): string => {
    return value?.toString() || defaultValue;
  };

  const mappedUserDetails: Detail[] = [
    { label: 'User ID', value: getValueOrDefault(data?.rid) as string },
    { label: 'Full name', value: getValueOrDefault(data?.full_name) as string },
    { label: 'Email address', value: getValueOrDefault(data?.email) as string },
    {
      label: 'Profile',
      value: getValueOrDefault(data?.profile?.profile_name) as string,
    },
    { label: 'Status', value: capitalizeFirstLetter(data?.status) as string },
    {
      label: 'First name',
      value: getValueOrDefault(data?.first_name) as string,
    },
    { label: 'Last name', value: getValueOrDefault(data?.last_name) as string },
    { label: 'Street', value: getValueOrDefault(data?.street) as string },
    { label: 'City', value: getValueOrDefault(data?.city_name) as string },
  ];

  const mappedAdditionalDetails: Detail[] = [
    {
      label: 'User number',
      value: getValueOrDefault(data?.r_number) as string,
    },
    {
      label: 'State/Province',
      value: getValueOrDefault(data?.state_name) as string,
    },
    {
      label: 'Zip/Postal Code',
      value: getValueOrDefault(data?.zip_code) as string,
    },
    {
      label: 'Country',
      value: getValueOrDefault(data?.country_name) as string,
    },
    {
      label: 'Created by',
      value: capitalizeFirstLetter(data?.created_by) as string,
    },
    {
      label: 'Created on',
      value: getDateTimeFormat(data?.created_datetime) as string,
    },
    {
      label: 'Last Updated by',
      value: getValueOrDefault(data?.modified_by) as string,
    },
    {
      label: 'Last Updated On',
      value: getDateTimeFormat(data?.modified_datetime),
    },
    {
      label: 'Role',
      value: getValueOrDefault(data?.business_teams?.business_teams) as string,
    },
  ];

  return (
    <>
      <div className='flex bg-[#CBD6E2] p-2'>
        <div className='py-1 text-small font-semibold'>User Details</div>
      </div>
      <div className='grid grid-cols-2 divide-y px-2 gap-2'>
        {renderRows(mappedUserDetails, mappedAdditionalDetails)}
      </div>
    </>
  );
};
