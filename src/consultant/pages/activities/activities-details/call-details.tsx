import React, { useMemo } from 'react';
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
import {
  applyHidePermission,
  formatDateToYYYYMMDDWithTime,
} from '../../../../common-utils';
import { ACTIVITY_EDIT } from '../../../../routes';
import { ActivityType } from '../../../types';
import { useCallActivityDetails } from '../../../services/activities/activities-service';
import { CallLogIcon } from '../../../../assets';
import {
  getPermissionMap,
  parseToStringArray,
} from '../activities-list/helper';
import { RootState } from '../../../../store/store';
import { useSelector } from 'react-redux';
import { AllPermissions } from '../../../../common-service';

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

  const { permission } = useSelector((state: RootState) => state.permission);

  const accountId = searchParams.get('accountID') || '';
  const activityId = searchParams.get('activity_id') || '';

  // Fetch Call Details
  const {
    data: call,
    isLoading,
    error,
  } = useCallActivityDetails(accountId || accountid || '', activityId, true);

  // Permission
  const callPermissionMap = useMemo(
    () => getPermissionMap(permission, AllPermissions.ACTIVITY_CALL_VIEW_EDIT),
    [permission]
  );

  const callActivityFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.ACTIVITY_CALL_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

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
      hide: !callActivityFieldsEditable,
    },
    {
      label: tabValue === 'all' ? 'Back To All' : 'Back To Call',
      variant: 'contained' as const,
      onClick: handleBackClick,
      sx: { width: 'auto', px: '9px' },
    },
  ];

  const basicDetails: DetailItem[] = [
    {
      label: 'Related To Name',
      value: call?.attached_to ?? '-',
      key: 'attached_to',
    },
    {
      label: 'Call Status',
      value: call?.status_name ?? '-',
      key: 'status_rid',
    },
    { label: 'Call Subject', value: call?.subject ?? '-', key: 'subject' },
    {
      label: 'Call Type',
      value: call?.activity_type ?? '-',
      key: 'activity_type',
    },
  ];

  const scheduleDetails: DetailItem[] = [
    {
      label: 'Call Platform',
      value: call?.call_platform ?? '-',
      key: 'call_platform',
    },
    {
      label: 'Call Participants',
      value: parseToStringArray(call?.call_participants)?.join(',') ?? '-',
      key: 'call_participants',
    },
    {
      label: 'Call Start Date',
      value: formatDateToYYYYMMDDWithTime(call?.effective_start_datetime),
      key: 'effective_start_datetime',
    },
    {
      label: 'Call End Date',
      value: formatDateToYYYYMMDDWithTime(call?.effective_end_datetime),
      key: 'effective_end_datetime',
    },
    { label: 'Caller ID', value: call?.caller_id ?? '-', key: 'caller_id' },
  ];

  const description: DetailItem[] = [
    {
      label: 'Description',
      value: call?.minutes_of_meeting ?? '-',
      key: 'minutes_of_meeting',
    },
  ];

  const auditDetails: DetailItem[] = [
    {
      label: 'Record ID',
      value: call?.activity_rid || activityId,
      key: 'rid',
    },
    {
      label: 'Call ID',
      value: call?.r_number ?? '',
      key: 'r_number',
    },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(call?.created_datetime),
      key: 'created_datetime',
    },
    {
      label: 'Created By',
      value: call?.created_by,
      key: 'created_by_name',
    },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(call?.modified_datetime),
      key: 'modified_datetime',
    },
    {
      label: 'Updated By',
      value: call?.modified_by,
      key: 'modified_by_name',
    },
  ];
  console.log(callPermissionMap);

  const basicInfo = applyHidePermission(basicDetails, callPermissionMap);
  const scheduleInfo = applyHidePermission(scheduleDetails, callPermissionMap);
  const descriptionInfo = applyHidePermission(description, callPermissionMap);
  const auditInfo = applyHidePermission(auditDetails, callPermissionMap);

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
        className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
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
            data={descriptionInfo}
            customStyle='pt-[1px]'
          />
          <DetailsSection
            title='Audit Information'
            data={auditInfo}
            customStyle='pt-0 mt-0'
            isAudit
          />
        </>
      )}
    </div>
  );
};

export default CallDetails;
