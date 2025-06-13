import { Detail } from '../../admin/types/admin-user-detail';
import { UserDetail } from '../../common-service';
import { Skeleton } from '@mui/material';
import { formatDateToYYYYMMDDWithTime } from '../../common-utils';

export const UserDetailComponent = ({ data, loading }: UserDetail) => {
  const renderRows = (data: Detail[]) => {
    return data.map((detail, index) => (
      <div
        key={index}
        className={`${detail.full ? 'col-span-2 border-t -mt-[1px] bg-[#ECECEC]' : ''} grid ${detail.full ? 'grid-cols-1' : 'grid-cols-[150px_auto]'} gap-1 items-center border-gray-200 p-2 px-4`}
      >
        <div
          className={`text-[14px] text-left ${detail.full ? 'font-semibold text-[#2D3E4F] ' : 'font-medium text-[#425A76]'}`}
        >
          {detail.label ?? ''}
        </div>
        {!detail.full && (
          <div className='break-all whitespace-normal font-light text-[#425A76] text-[14px] max-w-full'>
            {loading ? (
              <Skeleton variant='rounded' width='100%' />
            ) : (
              (detail.value ?? '-')
            )}
          </div>
        )}
      </div>
    ));
  };

  const capitalizeFirstLetter = (str?: string | null) => {
    if (str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    return '-';
  };

  // Map your API data to the mock data structure
  const getValueOrDefault = (
    value?: string | number | null,
    defaultValue = '-'
  ): string => {
    return value?.toString() || defaultValue;
  };

  const mappedUserDetails: Detail[] = [
    { label: 'Identity', value: '', full: true },
    {
      label: 'First Name',
      value: getValueOrDefault(data?.first_name),
    },
    { label: 'Last Name', value: getValueOrDefault(data?.last_name) },
    { label: 'Email address', value: getValueOrDefault(data?.email) },
    {
      label: 'Phone Number',
      value: getValueOrDefault(data?.phone),
    },
    { label: 'Access & Role', value: '', full: true },
    {
      label: 'Profile',
      value: getValueOrDefault(data?.profile?.profile_name),
    },
    {
      label: 'Role',
      value: getValueOrDefault(data?.business_teams?.business_teams),
    },
    {
      label: 'Status',
      value: capitalizeFirstLetter(
        data?.status === 'inactive' ? 'In-Active' : data?.status
      ),
    },
    { label: 'Address', value: '', full: true },
    { label: 'Street', value: getValueOrDefault(data?.street) },
    {
      label: 'Country',
      value: getValueOrDefault(data?.country_name),
    },
    {
      label: 'Region',
      value: getValueOrDefault(data?.state_name),
    },
    { label: 'City', value: getValueOrDefault(data?.city_name) },
    {
      label: 'Zip Code / Area Code',
      value: getValueOrDefault(data?.zip_code),
    },

    { label: 'Audit Information', value: '', full: true },
    { label: 'User Record ID', value: getValueOrDefault(data?.rid) },
    {
      label: 'User ID',
      value: getValueOrDefault(data?.r_number),
    },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(data?.created_datetime) || '-',
    },
    {
      label: 'Created By',
      value: capitalizeFirstLetter(data?.created_by),
    },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(data?.modified_datetime) || '-',
    },
    { label: 'Updated By', value: capitalizeFirstLetter(data?.modified_by) },
  ];
  return (
    <div className='grid grid-cols-2 divide-y'>
      {renderRows(mappedUserDetails)}
    </div>
  );
};
