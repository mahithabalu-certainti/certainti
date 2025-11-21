import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Typography } from '@mui/material';
import { useEmailActivityDetails } from '../../../services/activities/activities-service';
import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';
import DetailsSection, {
  DetailItem,
} from '../../../../components/details-section/details';
import SectionHeader from '../../../../components/details-section/section-header';
import { DraftEmailIcon } from '../../../../assets';
import DetailsSectionSkeleton from '../../../../components/skeleton-component/detailsskeleton';
import { ActivityType } from '../../../types';

interface EmailDetailsProps {
  accountInActive: boolean;
  tabValue: ActivityType;
}

const EmailDetails: React.FC<EmailDetailsProps> = ({
  accountInActive,
  tabValue,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const activityId = searchParams.get('activity_id') || '';

  const { data, isLoading, error } = useEmailActivityDetails(
    accountId,
    activityId,
    true
  );

  const handleEdit = () => {
    console.log('handleEdit');
  };

  const handleBackClick = () => {
    searchParams.delete('activity_id');
    searchParams.delete('activity_type');
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const headerButtons = [
    {
      label: 'Edit',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: handleEdit,
      sx: { width: '48px', minWidth: '48px' },
      hide: false,
    },
    {
      label: tabValue === 'all' ? 'Back To All' : 'Back To Email',
      variant: 'contained' as const,
      onClick: handleBackClick,
      sx: { width: 'auto', px: '9px' },
    },
  ];

  const emailInformation: DetailItem[] = [
    {
      label: 'Email ID',
      value: data?.r_number,
      key: 'r_number',
    },
    {
      label: 'Email To',
      value: data?.email_to,
      key: 'email_to',
    },
    {
      label: 'Email Status',
      value: data?.email_status,
      key: 'email_status',
    },
    {
      label: 'Email CC',
      value: data?.email_cc,
      key: 'email_cc',
    },
    {
      label: 'Subject',
      value: data?.subject,
      key: 'subject',
    },
    {
      label: 'Body',
      value: data?.body,
      key: 'body',
    },
  ];

  const descriptionBlock: DetailItem[] = [
    {
      label: 'Description',
      value: data?.description,
      key: 'description',
    },
  ];

  const auditDetails: DetailItem[] = [
    {
      label: 'Record ID',
      value: data?.rid || activityId,
      key: 'rid',
    },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(data?.created_datetime),
      key: 'created_datetime',
    },
    {
      label: 'Created By',
      value: data?.created_by_name,
      key: 'created_by_name',
    },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(data?.modified_datetime),
      key: 'modified_datetime',
    },
    {
      label: 'Updated By',
      value: data?.modified_by_name,
      key: 'modified_by_name',
    },
  ];

  // const basicEmailInfo = applyHidePermission(emailInformation, permissionMap);
  // const descriptionDetails = applyHidePermission(
  //   descriptionBlock,
  //   permissionMap
  // );
  // const auditInfo = applyHidePermission(auditDetails, permissionMap);

  return (
    <div>
      <SectionHeader
        title='Email'
        subValue={data?.r_number || ''}
        titleIcon={
          <DraftEmailIcon
            alt='email-icon'
            className='w-7 h-7 p-1.5 [&>path]:stroke-white bg-[#FF73C3] rounded-[2px]'
          />
        }
        className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
        buttons={headerButtons}
      />

      {isLoading ? (
        <DetailsSectionSkeleton className='p-0 m-0' />
      ) : error ? (
        <div className='flex items-center justify-center h-64 p-4'>
          <Typography variant='h6' color='error' className='mb-2'>
            Error loading email details
          </Typography>
        </div>
      ) : (
        <>
          <DetailsSection
            title='Email Information'
            data={emailInformation}
            customStyle='pt-0 mt-0'
          />

          <DetailsSection
            title=''
            data={descriptionBlock}
            fullColumn={true}
            customStyle='pt-[1px]'
          />

          <DetailsSection
            title='Audit Information'
            data={auditDetails}
            customStyle='pt-0 mt-0'
            isAudit={true}
          />
        </>
      )}
    </div>
  );
};

export default EmailDetails;
