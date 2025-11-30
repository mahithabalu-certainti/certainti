import React, { useMemo } from 'react';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { Typography } from '@mui/material';
import { useEmailActivityDetails } from '../../../services/activities/activities-service';
import {
  applyHidePermission,
  formatDateToYYYYMMDDWithTime,
} from '../../../../common-utils';
import DetailsSection, {
  DetailItem,
} from '../../../../components/details-section/details';
import SectionHeader from '../../../../components/details-section/section-header';
import { DraftEmailIcon } from '../../../../assets';
import DetailsSectionSkeleton from '../../../../components/skeleton-component/detailsskeleton';
import { ActivityType } from '../../../types';
import { ACTIVITY_EDIT } from '../../../../routes';
import {
  getPermissionMap,
  parseToStringArray,
} from '../activities-list/helper';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { AllPermissions } from '../../../../common-service';

interface EmailDetailsProps {
  accountInActive: boolean;
  tabValue: ActivityType;
  entityDetails?: {
    r_number: string;
    module: string;
    source: string;
  };
  entityLevel: 'account' | 'case' | 'project';
}

const EmailDetails: React.FC<EmailDetailsProps> = ({
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

  const { data, isLoading, error } = useEmailActivityDetails(
    accountId || accountid || '',
    activityId,
    true
  );

  // Permission
  const emailPermissionMap = useMemo(
    () => getPermissionMap(permission, AllPermissions.ACTIVITY_EMAIL_VIEW_EDIT),
    [permission]
  );

  const emailActivityFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.ACTIVITY_EMAIL_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const handleEdit = () => {
    const path = generatePath(ACTIVITY_EDIT, {
      module: entityDetails?.module || '',
      activityId: data?.activity_rid || activityId,
      type: 'email',
    });
    const queryParams = new URLSearchParams({
      accountId: accountid || accountId,
      entityLevel: data?.attachment_level || entityDetails?.module || '',
      entityId: data?.attach_to || '',
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
      disabled: accountInActive || data?.status_name?.toLowerCase() === 'sent',
      onClick: handleEdit,
      sx: { width: '48px', minWidth: '48px' },
      hide: !emailActivityFieldsEditable,
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
      label: 'Email To',
      value: parseToStringArray(data?.to_email)?.join(', ') ?? '',
      key: 'to_email',
    },
    {
      label: 'Email Status',
      value: data?.email_status ?? '',
      key: 'status_rid',
    },
    {
      label: 'Email CC',
      value: parseToStringArray(data?.cc_emails)?.join(', ') ?? '',
      key: 'cc_email',
    },
    {
      label: 'Subject',
      value: data?.subject ?? '',
      key: 'subject',
    },
  ];

  const emailBodyBlock: DetailItem[] = [
    {
      label: 'Body',
      value: (
        <div
          className={`
  text-[14px] text-[#425A76] font-normal 

  [&_p]:mb-2
  [&_strong]:font-bold [&_em]:italic
  [&_u]:underline [&_s]:line-through

  [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3
  [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2
  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2
  [&_h4]:text-base [&_h4]:font-medium [&_h4]:mb-1
  [&_h5]:text-sm [&_h5]:font-medium [&_h5]:mb-1
  [&_h6]:text-xs [&_h6]:font-medium [&_h6]:mb-1

  [&_ul]:list-disc [&_ul]:pl-5
  [&_ol]:list-decimal [&_ol]:pl-5
  [&_li]:mb-1

  [&_a]:text-blue-600 [&_a]:underline
  [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic

  [&_code]:font-mono [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded
  [&_pre]:font-mono [&_pre]:bg-gray-100 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto

  [&_img]:max-w-full [&_img]:rounded
  [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300 [&_table]:my-2
  [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:px-2 [&_th]:py-1
  [&_td]:border [&_td]:border-gray-300 [&_td]:px-2 [&_td]:py-1
`}
          dangerouslySetInnerHTML={{ __html: data?.body_html || '' }}
        />
      ),
      key: 'body_html',
    },
  ];

  const auditDetails: DetailItem[] = [
    {
      label: 'Record ID',
      value: data?.activity_rid || activityId,
      key: 'rid',
    },
    {
      label: 'Email ID',
      value: data?.r_number ?? '',
      key: 'r_number',
    },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(data?.created_datetime),
      key: 'created_datetime',
    },
    {
      label: 'Created By',
      value: data?.created_by,
      key: 'created_by_name',
    },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(data?.modified_datetime),
      key: 'modified_datetime',
    },
    {
      label: 'Updated By',
      value: data?.modified_by,
      key: 'modified_by_name',
    },
  ];

  const basicEmailInfo = applyHidePermission(
    emailInformation,
    emailPermissionMap
  );
  const emailBody = applyHidePermission(emailBodyBlock, emailPermissionMap);
  const auditInfo = applyHidePermission(auditDetails, emailPermissionMap);

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
            data={basicEmailInfo}
            customStyle='pt-0 mt-0'
          />

          <DetailsSection
            title=''
            data={emailBody}
            fullColumn={true}
            customStyle='pt-[1px]'
          />

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

export default EmailDetails;
