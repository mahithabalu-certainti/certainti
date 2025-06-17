import { UserDetail } from '../../common-service';
import { CircularProgress, Typography } from '@mui/material';
import { formatDateToYYYYMMDDWithTime } from '../../common-utils';
import { Fragment } from 'react/jsx-runtime';
import DetailsSection, { DetailItem } from '../details-section/details';

export const UserDetailComponent = ({ data, loading }: UserDetail) => {
  // Map your API data to the mock data structure
  const getValueOrDefault = (
    value?: string | number | null,
    defaultValue = '-'
  ): string => {
    return value?.toString() || defaultValue;
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64 border-t border-[#CBD6E2]'>
        <CircularProgress />
        <Typography variant='body1' className='ml-4'>
          Loading details...
        </Typography>
      </div>
    );
  }

  const identityInfo: DetailItem[] = [
    {
      label: 'First Name',
      value: getValueOrDefault(data?.first_name) || '-',
    },
    {
      label: 'Last Name',
      value: getValueOrDefault(data?.last_name) || '-',
    },
    { label: 'Email address', value: getValueOrDefault(data?.email) || '-' },
    {
      label: 'Phone Number',
      value: getValueOrDefault(data?.phone) || '-',
    },
  ];

  const addressInfo: DetailItem[] = [
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
  ];

  const accessInfo: DetailItem[] = [
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
      value: data?.status,
    },
  ];

  const auditInfo: DetailItem[] = [
    { label: 'Record ID', value: getValueOrDefault(data?.rid) },
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
      value: data?.created_by,
    },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(data?.modified_datetime) || '-',
    },
    { label: 'Updated By', value: data?.modified_by },
  ];

  return (
    <Fragment>
      <DetailsSection
        title='Identity'
        data={identityInfo}
        customStyle='pt-0 mt-0'
      />
      <DetailsSection title='Access & Role' data={accessInfo} />
      <DetailsSection title='Address' data={addressInfo} />
      <DetailsSection
        title='Audit Information'
        data={auditInfo}
        isAudit={true}
      />
    </Fragment>
  );
};
