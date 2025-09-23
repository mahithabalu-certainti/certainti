import React, { useMemo } from 'react';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { INTERACTIONS_EDIT } from '../../../../../../routes';
import DetailsSection, {
  DetailItem,
} from '../../../../../../components/details-section/details';
import {
  useAccountInteractionDetails,
  useSendInteraction,
} from '../../../../../services/interactions/interactions-service';
import {
  applyHidePermission,
  formatDateToYYYYMMDDWithTime,
} from '../../../../../../common-utils';
import { InteractionDetailIcon } from '../../../../../../assets';
import DetailsSectionSkeleton from '../../../../../../components/skeleton-component/detailsskeleton';
import { Typography } from '@mui/material';
import SectionHeader from '../../../../../../components/details-section/section-header';
import { accountDetailsProps } from '../../../../account-details/utils';
import { InteractionQuestions } from '../../../../../../components';
import { StatusTypeEnum } from '../../../../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';
import { AllPermissions } from '../../../../../../common-service';
import { useToast } from '../../../../../../hooks';

interface InteractionDetailsProps {
  accountInActive: boolean;
  handleBackClick: () => void;
  accountDetails?: accountDetailsProps;
}

const InteractionDetails: React.FC<InteractionDetailsProps> = ({
  accountInActive,
  handleBackClick,
  accountDetails,
}) => {
  const navigate = useNavigate();
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const interactionId = searchParams.get('interaction_id') || undefined;

  const { permission } = useSelector((state: RootState) => state.permission);
  const sendInteraction = useSendInteraction();
  const { successToast } = useToast();
  const { data, isLoading, error, refetch } = useAccountInteractionDetails(
    accountid,
    interactionId,
    true
  );

  const interactionFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.INTERACTIONS_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const disableInteractionEditBtn = [
    StatusTypeEnum.sent,
    StatusTypeEnum.response_draft,
    StatusTypeEnum.response_received,
    StatusTypeEnum.inqueue,
  ].includes((data?.status_name || '').toLowerCase() as StatusTypeEnum);

  const disableEditResBtn = [
    StatusTypeEnum.draft,
    StatusTypeEnum.response_received,
    StatusTypeEnum.inqueue,
  ].includes((data?.status_name || '').toLowerCase() as StatusTypeEnum);

  const disableRemainderBtn = [
    StatusTypeEnum.sent,
    StatusTypeEnum.response_draft,
  ].includes((data?.status_name || '').toLowerCase() as StatusTypeEnum);

  //permission
  const interactionsViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.INTERACTIONS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    interactionsViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [interactionsViewEditFields]);

  const handleEdit = () => {
    const accountId = accountid ?? '';
    const path = generatePath(INTERACTIONS_EDIT, {
      module: 'account',
      interactionId: data?.interaction_rid || interactionId || '',
    });
    const queryParams = new URLSearchParams({
      accountId,
      source: 'account',
      account_name: accountDetails?.accountById?.account_name || '',
      project_fiscal_rid: data?.project_fiscal_rid || '',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const handleReminderBtn = () => {
    const interactions = [
      {
        interaction_rid: data?.interaction_rid || interactionId || '',
        project_fiscal_rid: data?.project_fiscal_rid || '',
        email_info: {
          email: '',
          name: '',
        },
      },
    ];

    const payload = {
      account_rid: data?.account_rid || accountid || '',
      is_interaction_followup: true,
      interactions,
    };
    sendInteraction.mutate(payload, {
      onSuccess: (response) => {
        successToast(response?.statusMessage);
        // refetch();
      },
    });
    return;
  };

  const handleResponseHistory = () => {
    searchParams.set('history', 'response_histroy');
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const headerButtons = [
    {
      label: 'Edit',
      variant: 'outlined' as const,
      disabled: accountInActive || disableInteractionEditBtn,
      onClick: () => handleEdit(),
      sx: { width: '48px', minWidth: '48px' },
      hide: !interactionFieldsEditable,
    },
    {
      label: 'Reminder',
      variant: 'outlined' as const,
      disabled: accountInActive || !disableRemainderBtn,
      onClick: () => handleReminderBtn(),
      sx: { width: '78px', minWidth: '78px' },
      hide: true,
      loading: sendInteraction.isPending,
    },
    {
      label: 'Back To Interactions',
      variant: 'contained' as const,
      onClick: () => handleBackClick(),
      sx: { width: '140px', minWidth: '140px' },
    },
  ];

  const InteractionInfo: DetailItem[] = [
    {
      label: 'Interaction Type',
      value: data?.interaction_type_name,
      key: 'interaction_type_name',
    },
    //might be added in future if required
    // {
    //   label: 'Interaction Status',
    //   value: (
    //     <span
    //       className={`font-semibold ${getInteractionStatusColor(data?.status_name)}`}
    //     >
    //       {data?.status_name}
    //     </span>
    //   ),
    //   key: 'status',
    // },
    // {
    //   label: 'Response Updated By',
    //   value: data?.response_updated_by,
    //   key: 'response_updated_by',
    // },
    // {
    //   label: 'Response Received On',
    //   value: formatDateToYYYYMMDDWithTime(data?.response_updated_on) || '-',
    //   key: 'response_updated_on',
    // },
  ];

  const auditInfo: DetailItem[] = [
    {
      label: 'Record ID',
      value: data?.interaction_rid || interactionId,
      key: 'rid',
    },
    {
      label: 'Interaction ID',
      value: data?.r_number,
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
      key: 'created_by',
    },
    //might be added in future if required
    // {
    //   label: 'Updated On',
    //   value: formatDateToYYYYMMDDWithTime(data?.modified_datetime),
    //   key: 'modified_datetime',
    // },
    // {
    //   label: 'Updated By',
    //   value: data?.modified_by,
    //   key: 'modified_by',
    // },
  ];

  const interactionDetails = applyHidePermission(
    InteractionInfo,
    permissionMap
  );
  const auditDetails = applyHidePermission(auditInfo, permissionMap);
  const hideQuestions =
    !permissionMap['interaction_questions']?.read &&
    !permissionMap['interaction_questions']?.edit;

  const showInteractionQuestions =
    data?.questions && data?.questions.length > 0 && !hideQuestions;

  return (
    <>
      <div className='border border-[#CBD6E2]'>
        <SectionHeader
          title='Interaction'
          subValue={data?.r_number || ''}
          titleIcon={
            <InteractionDetailIcon
              alt='financial-header-icon'
              className={`w-7 h-7 p-1 bg-[#E25A32] rounded-[2px]`}
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
              Error loading interaction details
            </Typography>
          </div>
        ) : (
          <>
            <DetailsSection
              title='Interaction Information'
              data={interactionDetails}
              customStyle='pt-0 mt-0'
            />
          </>
        )}
      </div>
      {showInteractionQuestions && (
        <InteractionQuestions
          questions={data?.questions}
          globalAttachments={data?.global_attachments}
          isEditEnable={!disableEditResBtn}
          actionButtonEnable={interactionFieldsEditable}
          handleResponseHistory={handleResponseHistory}
          refetchDetails={refetch}
          formData={{
            account_rid: accountid || data?.account_rid || '',
            project_rid: data?.project_rid || '',
            project_fiscal_rid: data?.project_fiscal_rid || '',
            interaction_rid: data?.interaction_rid || interactionId || '',
          }}
        />
      )}
      {!isLoading && !error && (
        <div className='border border-t-0 border-[#CBD6E2] mb-4'>
          <DetailsSection
            title='Audit Information'
            data={auditDetails}
            customStyle='pt-0 mt-0'
            isAudit={true}
          />
        </div>
      )}
    </>
  );
};

export default InteractionDetails;
