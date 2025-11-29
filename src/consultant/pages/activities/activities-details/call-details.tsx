import React from 'react';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { Typography } from '@mui/material';
import SectionHeader from '../../../../components/details-section/section-header';
import DetailsSection, {
  DetailItem,
} from '../../../../components/details-section/details';
import DetailsSectionSkeleton from '../../../../components/skeleton-component/detailsskeleton';
import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';
import { ACTIVITY_EDIT } from '../../../../routes';
import { ActivityType } from '../../../types';
import { useCallActivityDetails } from '../../../services/activities/activities-service';
import { CallLogIcon } from '../../../../assets';
import { parseToStringArray } from '../activities-list/helper';

interface CallDetailsProps {
  accountInActive: boolean;
  tabValue: ActivityType;
  entityDetails?: {
    r_number: string;
    module: string;
    source: string;
  };
  entityLevel: 'account' | 'case' | 'project';
}

const CallDetails: React.FC<CallDetailsProps> = ({
  accountInActive,
  tabValue,
  entityDetails,
}) => {
  const { accountid } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const accountId = searchParams.get('accountID') || '';
  const activityId = searchParams.get('activity_id') || '';

  // Fetch Call Details
  const {
    data: call,
    isLoading,
    error,
  } = useCallActivityDetails(accountId || accountid || '', activityId, true);

  // Edit handler
  const handleEdit = () => {
    const path = generatePath(ACTIVITY_EDIT, {
      module: entityDetails?.module || '',
      activityId: call?.activity_rid || activityId,
      type: 'call',
    });

    const queryParams = new URLSearchParams({
      accountId: accountid || accountId,
      entityLevel: call?.attachment_level || entityDetails?.module || '',
      entityId: call?.attach_to || '',
      source: entityDetails?.source || '',
    });

    navigate(`${path}?${queryParams.toString()}`);
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
    },
    {
      label: tabValue === 'all' ? 'Back To All' : 'Back To Call',
      variant: 'contained' as const,
      onClick: handleBackClick,
      sx: { width: 'auto', px: '9px' },
    },
  ];

  const basicInfo: DetailItem[] = [
    { label: 'Related To', value: call?.attached_to ?? '-', key: 'related_to' },
    { label: 'Call Status', value: call?.status_name ?? '-', key: 'status' },
    { label: 'Call Subject', value: call?.subject ?? '-', key: 'subject' },
    { label: 'Call Type', value: call?.activity_type ?? '-', key: 'type' },
  ];

  const scheduleInfo: DetailItem[] = [
    {
      label: 'Call Platform',
      value: call?.call_platform ?? '-',
      key: 'platform',
    },
    {
      label: 'Call Participants',
      value: parseToStringArray(call?.call_participants)?.join(',') ?? '-',
      key: 'call_participants',
    },
    {
      label: 'Call Start Date',
      value: formatDateToYYYYMMDDWithTime(call?.effective_start_datetime),
      key: 'start_time',
    },
    {
      label: 'Call End Date',
      value: formatDateToYYYYMMDDWithTime(call?.effective_end_datetime),
      key: 'end_time',
    },
    { label: 'Caller ID', value: call?.caller_id ?? '-', key: 'caller' },
  ];

  const description: DetailItem[] = [
    {
      label: 'Description',
      value: call?.minutes_of_meeting ?? '-',
      key: 'mom',
    },
  ];

  const auditDetails: DetailItem[] = [
    { label: 'Record ID', value: call?.activity_rid || '-', key: 'rid' },
    { label: 'Call ID', value: call?.r_number ?? '-', key: 'r_number' },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(call?.created_datetime),
      key: 'created_datetime',
    },
    { label: 'Created By', value: call?.created_by ?? '-', key: 'created_by' },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(call?.modified_datetime),
      key: 'modified_datetime',
    },
    {
      label: 'Updated By',
      value: call?.modified_by ?? '-',
      key: 'modified_by',
    },
  ];

  return (
    <div>
      <SectionHeader
        title='Call'
        subValue={call?.r_number || ''}
        titleIcon={
          <CallLogIcon
            alt='call-icon'
            className='w-7 h-7 p-1.5 [&>path]:stroke-white bg-[#AF78FF] rounded-[2px]'
          />
        }
        buttons={headerButtons}
      />

      {isLoading ? (
        <DetailsSectionSkeleton className='p-0 m-0' />
      ) : error ? (
        <div className='flex items-center justify-center h-64 p-4'>
          <Typography variant='h6' color='error'>
            Error loading call details
          </Typography>
        </div>
      ) : (
        <>
          <DetailsSection
            title='Basic Information'
            data={basicInfo}
            customStyle='pt-0 mt-0'
          />
          <DetailsSection
            title='Schedule Information'
            data={scheduleInfo}
            customStyle='pt-0 mt-0'
          />
          <DetailsSection
            title=''
            fullColumn={true}
            data={description}
            customStyle='pt-[1px]'
          />
          <DetailsSection
            title='Audit Information'
            data={auditDetails}
            customStyle='pt-0 mt-0'
            isAudit
          />
        </>
      )}
    </div>
  );
};

export default CallDetails;
