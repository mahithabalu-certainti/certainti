import React from 'react';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { Typography } from '@mui/material';
import { MeetingIcon } from '../../../../assets';
import SectionHeader from '../../../../components/details-section/section-header';
import DetailsSection, {
  DetailItem,
} from '../../../../components/details-section/details';
import DetailsSectionSkeleton from '../../../../components/skeleton-component/detailsskeleton';
import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';
import { ACTIVITY_EDIT } from '../../../../routes';
import { ActivityType } from '../../../types';
import { useMeetingActivityDetails } from '../../../services/activities/activities-service';

interface MeetingDetailsProps {
  accountInActive: boolean;
  tabValue: ActivityType;
  entityDetails?: {
    r_number: string;
    module: string;
    source: string;
  };
  entityLevel: 'account' | 'case' | 'project';
}

const MeetingDetails: React.FC<MeetingDetailsProps> = ({
  accountInActive,
  tabValue,
  entityDetails,
}) => {
  const { accountid } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const accountId = searchParams.get('accountID') || '';
  const activityId = searchParams.get('activity_id') || '';

  // Fetch Meeting Details
  const {
    data: meeting,
    isLoading,
    error,
  } = useMeetingActivityDetails(accountId || accountid || '', activityId, true);

  // Edit handler
  const handleEdit = () => {
    const path = generatePath(ACTIVITY_EDIT, {
      module: entityDetails?.module || '',
      activityId: meeting?.activity_rid || activityId,
      type: 'meeting',
    });

    const queryParams = new URLSearchParams({
      accountId: accountid || accountId,
      entityLevel: meeting?.attachment_level || entityDetails?.module || '',
      entityId: meeting?.attach_to || '',
      source: entityDetails?.source || '',
    });

    navigate(`${path}?${queryParams.toString()}`);
  };

  //Back handler
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
      label: tabValue === 'all' ? 'Back To All' : 'Back To Meeting',
      variant: 'contained' as const,
      onClick: handleBackClick,
      sx: { width: 'auto', px: '9px' },
    },
  ];

  //Meeting Information Fields
  const meetingInformation: DetailItem[] = [
    { label: 'Subject', value: meeting?.subject ?? '', key: 'subject' },
    {
      label: 'Meeting URL',
      value: meeting?.meeting_url ?? '',
      key: 'meeting_url',
    },
    {
      label: 'Meeting Code',
      value: meeting?.meeting_id ?? '',
      key: 'meeting_code',
    },
    {
      label: 'Participants',
      value: meeting?.meeting_participants?.join(', ') ?? '',
      key: 'meeting_participants',
    },
    {
      label: 'Status',
      value: meeting?.status_name ?? '',
      key: 'status',
    },
    {
      label: 'Fiscal Year',
      value: meeting?.fiscal_year ?? '',
      key: 'fiscal_year',
    },
  ];

  // Audit Information
  const auditDetails: DetailItem[] = [
    {
      label: 'Record ID',
      value: meeting?.activity_rid || activityId,
      key: 'rid',
    },
    { label: 'Meeting ID', value: meeting?.r_number ?? '', key: 'r_number' },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(meeting?.created_datetime),
      key: 'created_datetime',
    },
    {
      label: 'Created By',
      value: meeting?.created_by,
      key: 'created_by_name',
    },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(meeting?.modified_datetime),
      key: 'modified_datetime',
    },
    {
      label: 'Updated By',
      value: meeting?.modified_by,
      key: 'modified_by_name',
    },
  ];

  return (
    <div>
      <SectionHeader
        title='Meeting'
        subValue={meeting?.r_number || ''}
        titleIcon={
          <MeetingIcon
            alt='meeting-icon'
            className='w-7 h-7 p-1.5 [&>path]:stroke-white bg-[#FF5F5F] rounded-[2px]'
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
            Error loading meeting details
          </Typography>
        </div>
      ) : (
        <>
          <DetailsSection
            title='Meeting Information'
            data={meetingInformation}
            customStyle='pt-0 mt-0'
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

export default MeetingDetails;
