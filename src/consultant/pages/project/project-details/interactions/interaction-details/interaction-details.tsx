import React, { useMemo } from 'react';
import DetailsSectionSkeleton from '../../../../../../components/skeleton-component/detailsskeleton';
import { Typography } from '@mui/material';
import DetailsSection, {
  DetailItem,
} from '../../../../../../components/details-section/details';
import { InteractionDetailIcon } from '../../../../../../assets';
import SectionHeader from '../../../../../../components/details-section/section-header';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  useInteractionDetails,
  useSendInteraction,
} from '../../../../../services/interactions/interactions-service';
import {
  applyHidePermission,
  formatDateToYYYYMMDDWithTime,
} from '../../../../../../common-utils';
import { INTERACTIONS_EDIT } from '../../../../../../routes';
import { NewProjectData } from '../../../../../types/project';
import { InteractionQuestions } from '../../../../../../components/interaction';
import { getInteractionStatusColor } from '../helpers';
import { StatusTypeEnum } from '../../../../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';
import { AllPermissions } from '../../../../../../common-service';
import { useToast } from '../../../../../../hooks';

interface InteractionDetailsProps {
  accountInActive: boolean;
  handleBackClick: () => void;
  projectDetails: NewProjectData | null;
}

const InteractionDetails: React.FC<InteractionDetailsProps> = ({
  accountInActive,
  handleBackClick,
  projectDetails,
}) => {
  const { projectid } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const interactionId = searchParams.get('interaction_id') || undefined;

  const { permission } = useSelector((state: RootState) => state.permission);
  const sendInteraction = useSendInteraction();
  const { successToast } = useToast();
  const { data, isLoading, error, refetch } = useInteractionDetails(
    accountId,
    interactionId
  );
  // commented for if may future use
  // const disableEditResBtn =
  //   data?.status_name.toLowerCase() === StatusTypeEnum.response_received;

  const interactionFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.INTERACTIONS_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const disableInteractionEditBtn = [
    StatusTypeEnum.cancelled,
    StatusTypeEnum.completed,
    StatusTypeEnum.response_received,
  ].includes((data?.status_name || '').toLowerCase() as StatusTypeEnum);
  const disableRemainderBtn = [
    StatusTypeEnum.sent,
    StatusTypeEnum.resent,
    StatusTypeEnum.question_updated,
    StatusTypeEnum.response_draft,
  ].includes((data?.status_name || '').toLowerCase() as StatusTypeEnum);

  const disableEditResBtn = [
    StatusTypeEnum.cancelled,
    StatusTypeEnum.draft,
    StatusTypeEnum.completed,
    StatusTypeEnum.response_received,
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
        projectDetails?.project_fiscal_rid ||
        projectid ||
        projectDetails?.rid ||
        '',
    };
    const path = generatePath(INTERACTIONS_EDIT, {
      module: 'project',
      interactionId: data?.interaction_rid || interactionId || '',
    });
    const queryParams = new URLSearchParams({
      accountId,
      source: 'project',
      projectDetails: JSON.stringify(projectData),
    });
    navigate(`${path}?${queryParams.toString()}`);
  };
  const handleRemainder = () => {
    const interactions = [
      {
        interaction_rid: projectDetails?.rid || '',
        project_fiscal_rid: projectDetails?.project_fiscal_rid || '',
        email_info: {
          email: '',
          name: '',
        },
      },
    ];

    const payload = {
      account_rid: projectDetails?.account_rid || '',
      is_interaction_followup: true,
      interactions,
    };
    sendInteraction.mutate(payload, {
      onSuccess: (response) => {
        successToast(response?.statusMessage);
        // onSuccessRefetch();
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
      onClick: () => handleRemainder(),
      sx: { width: '78px', minWidth: '78px' },
      hide: false,
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
          className={`font-semibold ${getInteractionStatusColor(data?.status_name)}`}
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
          onBackClick={handleBackClick}
          showBackArrow={true}
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
            project_fiscal_rid:
              projectDetails?.project_fiscal_rid ||
              projectid ||
              projectDetails?.rid ||
              '',
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
