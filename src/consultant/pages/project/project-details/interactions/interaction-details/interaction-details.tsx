import React from 'react';
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
import { useInteractionDetails } from '../../../../../services/interactions/interactions-service';
import { formatDateToYYYYMMDDWithTime } from '../../../../../../common-utils';
import { INTERACTIONS_EDIT } from '../../../../../../routes';
import { NewProjectData } from '../../../../../types/project';
import { InteractionQuestions } from '../../../../../../components/interaction';

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

  const { data, isLoading, error, refetch } = useInteractionDetails(
    accountId,
    interactionId
  );

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
  const handleResponseHistory = () => {
    searchParams.set('history', 'response_histroy');
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const headerButtons = [
    {
      label: 'Edit',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handleEdit(),
      sx: { width: '48px', minWidth: '48px' },
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
      value: data?.interaction_type,
      key: 'interaction_type',
    },
    {
      label: 'Interaction Status',
      value: (
        <span
          className={`font-semibold ${
            data?.status_name === 'Draft'
              ? 'text-gray-500'
              : data?.status_name === 'Created'
                ? 'text-blue-500'
                : data?.status_name === 'Sent'
                  ? 'text-purple-500'
                  : data?.status_name === 'Response Draft'
                    ? 'text-orange-500'
                    : data?.status_name === 'Response Received'
                      ? 'text-green-600'
                      : data?.status_name === 'On-Hold'
                        ? 'text-yellow-500'
                        : data?.status_name === 'Cancelled'
                          ? 'text-red-600'
                          : 'text-gray-700'
          }`}
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
      value: data?.response_updated_on,
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
              data={basicInfo}
              customStyle='pt-0 mt-0'
            />
            <DetailsSection
              title='Interaction Information'
              data={InteractionInfo}
              customStyle='pt-0 mt-0'
            />
          </>
        )}
      </div>
      {data?.questions && data?.questions.length > 0 && (
        <InteractionQuestions
          questions={data?.questions}
          globalAttachments={data?.global_attachments}
          isEditEnable={true}
          actionButtonEnable={true}
          handleResponseHistory={handleResponseHistory}
          refetchDeetails={refetch}
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
            data={auditInfo}
            customStyle='pt-0 mt-0'
            isAudit={true}
          />
        </div>
      )}
    </>
  );
};

export default InteractionDetails;
