import React, { useMemo } from 'react';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { Typography } from '@mui/material';
import { DocumentIcon, DownloadIcon, MeetingIcon } from '../../../../assets';
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
import {
  useCancelledActivityMeeting,
  useCompletedActivityMeeting,
  useMeetingActivityDetails,
} from '../../../services/activities/activities-service';
import {
  getPermissionMap,
  parseToStringArray,
} from '../activities-list/helper';
import { RootState } from '../../../../store/store';
import { useSelector } from 'react-redux';
import { AllPermissions } from '../../../../common-service';
import { TruncateWithTooltip } from '../../../../components';
import { useToast } from '../../../../hooks';

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

  const { permission } = useSelector((state: RootState) => state.permission);

  const completeMeeting = useCompletedActivityMeeting();
  const cancelMeeting = useCancelledActivityMeeting();

  // Fetch Meeting Details
  const {
    data: meeting,
    isLoading,
    error,
    refetch,
  } = useMeetingActivityDetails(accountId || accountid || '', activityId, true);

  const { successToast } = useToast();

  const handleCompleteMeeting = () => {
    completeMeeting.mutate(
      {
        account_rid: accountId || accountid || '',
        activity_rid: activityId,
      },
      {
        onSuccess: async () => {
          successToast('Meeting Status Updated Successfully');
          refetch();
        },
      }
    );
  };

  const handleCancelMeeting = () => {
    cancelMeeting.mutate(
      {
        account_rid: accountId || accountid || '',
        activity_rid: activityId,
      },
      {
        onSuccess: async () => {
          successToast('Meeting Status Updated Successfully');
          refetch();
        },
      }
    );
  };

  // Permission
  const meetingPermissionMap = useMemo(
    () =>
      getPermissionMap(permission, AllPermissions.ACTIVITY_MEETING_VIEW_EDIT),
    [permission]
  );

  const meetingActivityFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.ACTIVITY_MEETING_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

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
      label: 'Cancel Meeting',
      variant: 'outlined' as const,
      disabled: accountInActive,
      loading: cancelMeeting.isPending,
      onClick: handleCancelMeeting,
      sx: { width: '120px', minWidth: '120px' },
      hide:
        !meetingActivityFieldsEditable || meeting?.status_name !== 'Scheduled',
    },
    {
      label: 'Complete Meeting',
      variant: 'contained' as const,
      disabled: accountInActive,
      loading: completeMeeting.isPending,
      onClick: handleCompleteMeeting,
      sx: { width: '120px', minWidth: '120px' },
      hide:
        !meetingActivityFieldsEditable || meeting?.status_name !== 'Scheduled',
    },
    {
      label: 'Edit',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: handleEdit,
      sx: { width: '48px', minWidth: '48px' },
      hide: !meetingActivityFieldsEditable,
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
      label: 'Participants',
      value:
        parseToStringArray(meeting?.meeting_participants)?.join(', ') ?? '',
      key: 'meeting_participants',
    },
    {
      label: 'Status',
      value: meeting?.status_name ?? '',
      key: 'status_rid',
    },
    {
      label: 'Meeting Invite',
      value: meeting?.meeting_url ? (
        <a
          href={meeting?.meeting_url}
          target='_blank'
          rel='noopener noreferrer'
          className='text-[#1755E7] underline'
        >
          Link
        </a>
      ) : (
        ''
      ),
      key: 'meeting_invite',
      hideTooltip: true,
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

  const handleDownload = (documentUrl: string) => {
    if (!documentUrl) return;

    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const basicInfo = applyHidePermission(
    meetingInformation,
    meetingPermissionMap
  );
  const auditInfo = applyHidePermission(auditDetails, meetingPermissionMap);

  const hideAttachments =
    !meetingPermissionMap?.['attachments']?.edit &&
    !meetingPermissionMap?.['attachments']?.read;

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
            data={basicInfo}
            customStyle='pt-0 mt-0'
          />

          {/* Attachments Section */}
          {!hideAttachments && meeting && meeting?.attachments?.length > 0 && (
            <div className='flex flex-col h-full'>
              <div className='flex items-center align-middle px-3 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
                Attachments
              </div>
              <div className='flex-1 p-3'>
                <div
                  className={`flex flex-col gap-1 max-h-[85px] ${
                    meeting?.attachments?.length > 2
                      ? 'overflow-auto'
                      : 'overflow-visible'
                  }`}
                >
                  {meeting?.attachments?.map((file, idx) => (
                    <div
                      key={idx}
                      className='flex items-center justify-between border border-[#CBD6E2] bg-[#FFFBFA] rounded-[2px] p-2 px-3'
                    >
                      <div className='flex items-center gap-2 w-[95%]'>
                        <DocumentIcon className='w-6 h-6' />
                        <div className='text-[14px] text-[#425A76] font-normal max-w-[90%]'>
                          <TruncateWithTooltip
                            text={`${file.document_name}${file.format}`}
                            maxWidth={'100%'}
                          >
                            {file.document_name}
                            {file.format}
                          </TruncateWithTooltip>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(file.browse_file)}
                        className='p-1 border border-[#CBD6E2] rounded-[2px] cursor-pointer'
                        style={{
                          boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
                          background:
                            'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
                        }}
                      >
                        <DownloadIcon />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DetailsSection
            title='Audit Information'
            data={auditInfo}
            customStyle='pt-0 mt-0'
            isAudit={true}
          />
        </>
      )}
    </div>
  );
};

export default MeetingDetails;
