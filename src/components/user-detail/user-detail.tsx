import { Detail } from '../../admin/types/admin-user-detail';
import { UserDetail } from '../../common-service';
import { Skeleton } from '@mui/material';

export const UserDetailComponent = ({ data, loading }: UserDetail) => {
  const renderRows = (data: Detail[]) => {
    return data.map((detail, index) => (
      <div
        key={index}
        className={`${detail.full ? 'col-span-2 border-t -mt-[1px] bg-[#CBD6E2]' : ''} grid ${detail.full ? 'grid-cols-1' : 'grid-cols-[1fr_2fr]'} gap-1 items-center justify-center border-gray-200 p-2`}
      >
        <div className='font-bold text-left'>{detail.label ?? ''}</div>
        {!detail.full && (
          <div className='break-words whitespace-normal max-w-full'>
            {loading ? (
              <Skeleton variant='rounded' width='100%' />
            ) : (
              (detail.value ?? '')
            )}
          </div>
        )}
      </div>
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
    { label: 'Identity', value: '', full: true },
    { label: 'User ID', value: getValueOrDefault(data?.rid) },
    {
      label: 'User number',
      value: getValueOrDefault(data?.r_number),
    },
    { label: 'Full name', value: getValueOrDefault(data?.full_name) },
    {
      label: 'First name',
      value: getValueOrDefault(data?.first_name),
    },
    { label: 'Last name', value: getValueOrDefault(data?.last_name) },
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
    { label: 'Status', value: capitalizeFirstLetter(data?.status) },
    { label: 'Address', value: '', full: true },
    { label: 'Street', value: getValueOrDefault(data?.street) },
    { label: 'City', value: getValueOrDefault(data?.city_name) },
    {
      label: 'State/Province',
      value: getValueOrDefault(data?.state_name),
    },
    {
      label: 'Zip/Postal Code',
      value: getValueOrDefault(data?.zip_code),
    },
    {
      label: 'Country',
      value: getValueOrDefault(data?.country_name),
    },
  ];
  return (
    <div className='grid grid-cols-2 divide-y'>
      {renderRows(mappedUserDetails)}
    </div>
  );
};
