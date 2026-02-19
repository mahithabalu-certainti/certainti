import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom';
import { RootState } from '../../../../../../store/store';
import {
  useInteractionDetails,
  useSendInteraction,
} from '../../../../../services/interactions/interactions-service';
import { useToast } from '../../../../../../hooks';
import { AllPermissions } from '../../../../../../common-service';
import { InteractionList, StatusTypeEnum } from '../../../../../types';
import { INTERACTIONS_EDIT } from '../../../../../../routes';
import DetailsSection, {
  DetailItem,
} from '../../../../../../components/details-section/details';
import { getCaseInteractionStatusColor } from '../helpers';
import {
  applyHidePermission,
  formatDateToYYYYMMDDWithTime,
} from '../../../../../../common-utils';
import SectionHeader from '../../../../../../components/details-section/section-header';
import { InteractionDetailIcon } from '../../../../../../assets';
import DetailsSectionSkeleton from '../../../../../../components/skeleton-component/detailsskeleton';
import { Typography } from '@mui/material';
import {
  InteractionQuestions,
  SendInteractionModal,
} from '../../../../../../components';
import { useProjectDetail } from '../../../../../services/project';

interface InteractionDetailsProps {
  accountInActive: boolean;
  handleBackClick: () => void;
  // projectDetails: NewProjectData | null;
  isSendInteraction: boolean;
  isFinancialWorkingSignoff?: boolean;
}

const InteractionDetails: React.FC<InteractionDetailsProps> = ({
  accountInActive,
  handleBackClick,
  // projectDetails,
  isSendInteraction,
  isFinancialWorkingSignoff,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const interactionId = searchParams.get('interaction_id') || undefined;
  const projectFiscalRid = searchParams.get('project_fiscal_rid');

  const { permission } = useSelector((state: RootState) => state.permission);
  const sendInteraction = useSendInteraction();
  const { successToast } = useToast();
  const { data, isLoading, error, refetch } = useInteractionDetails(
    accountId,
    interactionId,
    projectFiscalRid as string
  );
  const { data: projectData, isLoading: projectDetailsLoading } =
    useProjectDetail(accountId, projectFiscalRid || '');
  const projectDetails = projectData?.data?.project;
  const [reInitiateModalOpen, setReInitiateModalOpen] = useState(false);

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

  const disableReminderBtn = [
    StatusTypeEnum.sent,
    StatusTypeEnum.response_draft,
  ].includes((data?.status_name || '').toLowerCase() as StatusTypeEnum);

  const disableEditResBtn = [
    StatusTypeEnum.draft,
    StatusTypeEnum.response_received,
    StatusTypeEnum.inqueue,
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
    const projectData = {
      project_code: projectDetails?.project_code || '',
      project_name: projectDetails?.project_name || '',
      fiscal_year: projectDetails?.fiscal_year || '',
      account_name: projectDetails?.account_name || '',
      account_rid: projectDetails?.account_rid || '',
      project_rid: projectDetails?.project_rid || '',
      project_fiscal_rid:
        projectDetails?.project_fiscal_rid || projectDetails?.rid || '',
    };
    const path = generatePath(INTERACTIONS_EDIT, {
      module: 'project',
      interactionId: data?.interaction_rid || interactionId || '',
    });
    const queryParams = new URLSearchParams({
      accountId,
      source: 'project',
      projectDetails: JSON.stringify(projectData),
      project_fiscal_rid: data?.project_fiscal_rid || projectFiscalRid || '',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const handleReminder = () => {
    const interactions = [
      {
        interaction_rid: data?.interaction_rid || interactionId || '',
        project_fiscal_rid:
          data?.project_fiscal_rid || projectDetails?.rid || '',
      },
    ];

    const payload = {
      account_rid: data?.account_rid || accountId || '',
      is_interaction_followup: true,
      interactions,
      email_info: {
        email: '',
        name: '',
      },
    };
    sendInteraction.mutate(payload, {
      onSuccess: (response) => {
        successToast(response?.statusMessage);
        refetch();
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
      disabled:
        accountInActive ||
        disableInteractionEditBtn ||
        isFinancialWorkingSignoff,
      onClick: () => handleEdit(),
      sx: { width: '48px', minWidth: '48px' },
      hide: !interactionFieldsEditable,
    },
    {
      label: 'Re-Initiate Interaction',
      variant: 'outlined' as const,
      disabled:
        accountInActive ||
        !disableReminderBtn ||
        !isSendInteraction ||
        isFinancialWorkingSignoff,
      onClick: () => setReInitiateModalOpen(true),
      sx: { width: '160px', minWidth: '160px' },
    },
    {
      label: 'Reminder',
      variant: 'outlined' as const,
      disabled:
        accountInActive ||
        !disableReminderBtn ||
        !isSendInteraction ||
        isFinancialWorkingSignoff,
      onClick: () => handleReminder(),
      sx: { width: '78px', minWidth: '78px' },
      hide: false,
      isLoading: sendInteraction.isPending,
    },
    {
      label: 'Back To Interactions',
      variant: 'contained' as const,
      onClick: () => handleBackClick(),
      sx: { width: '140px', minWidth: '140px' },
    },
  ];

  const basicInfo: DetailItem[] = [
    {
      label: 'Project Code',
      value: data?.project_code,
      key: 'project_code',
    },
    {
      label: 'Project Name',
      value: data?.project_name,
      key: 'project_name',
    },
    {
      label: 'Fiscal Year',
      value: data?.fiscal_year,
      key: 'fiscal_year',
    },
  ];

  const InteractionInfo: DetailItem[] = [
    {
      label: 'Interaction Type',
      value: data?.interaction_type_name,
      key: 'interaction_type_name',
    },
    {
      label: 'Interaction Status',
      value: (
        <span
          className={`font-semibold ${getCaseInteractionStatusColor(data?.status_name)}`}
        >
          {data?.status_name}
        </span>
      ),
      key: 'status',
    },
    {
      label: 'Response Updated By',
      value: data?.response_updated_by,
      key: 'response_updated_by',
    },
    {
      label: 'Recipient Name',
      value: data?.recipient_name,
      key: 'recipient_name',
    },
    {
      label: 'Recipient email',
      value: data?.recipient_email,
      key: 'recipient_email',
    },
    {
      label: 'Response Received On',
      value: formatDateToYYYYMMDDWithTime(data?.response_updated_on) || '-',
      key: 'response_updated_on',
    },
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
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(data?.modified_datetime),
      key: 'modified_datetime',
    },
    {
      label: 'Updated By',
      value: data?.modified_by,
      key: 'modified_by',
    },
  ];

  const basicDetails = applyHidePermission(basicInfo, permissionMap);
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
        {isLoading && projectDetailsLoading ? (
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
              title='Basic Information'
              data={basicDetails}
              customStyle='pt-0 mt-0'
            />
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
            account_rid: projectDetails?.account_rid || '',
            project_rid: projectDetails?.project_rid || '',
            project_fiscal_rid: projectDetails?.rid || '',
            interaction_rid: data?.interaction_rid || interactionId || '',
          }}
          isProjectSignedOff={Boolean(isFinancialWorkingSignoff)}
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
      <SendInteractionModal
        title='Re-Initiate Interaction'
        isOpen={reInitiateModalOpen}
        onClose={() => setReInitiateModalOpen(false)}
        selectedRows={
          data
            ? [
              {
                rid: data.interaction_rid || interactionId || '',
                interaction_level_name: data.interaction_level_name || '',
                project_fiscal_rid: data.project_fiscal_rid || '',
                recipient_name: data.recipient_name || '',
                recipient_email: data.recipient_email || '',
                status_name: data.status_name || '',
              } as InteractionList,
            ]
            : []
        }
        onSuccessRefetch={refetch}
      />
    </>
  );
};

export default InteractionDetails;
