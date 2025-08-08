import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { INTERACTIONS } from '../../../../../../routes';
import DetailsSection, {
  DetailItem,
} from '../../../../../../components/details-section/details';
import { useInteractionDetails } from '../../../../../services/interactions/interactions-service';
import { formatDateToYYYYMMDDWithTime } from '../../../../../../common-utils';
import { InteractionDetailIcon } from '../../../../../../assets';
import DetailsSectionSkeleton from '../../../../../../components/skeleton-component/detailsskeleton';
import { Typography } from '@mui/material';
import InteractionQuestions from './interaction-qus';
import SectionHeader from '../../../../../../components/details-section/section-header';
import { accountDetailsProps } from '../../../../account-details/utils';

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

  const { data, isLoading, error } = useInteractionDetails(
    accountid,
    interactionId
  );

  const handleEdit = () => {
    const accountId = accountid ?? '';
    const queryParams = new URLSearchParams({
      accountId,
      source: 'account',
      account_name: accountDetails?.accountById?.account_name || '',
    });
    navigate(`${INTERACTIONS}/edit/${data?.rid}?${queryParams.toString()}`);
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
            data?.status === 'Draft'
              ? 'text-gray-500'
              : data?.status === 'Created'
                ? 'text-blue-500'
                : data?.status === 'Sent'
                  ? 'text-purple-500'
                  : data?.status === 'Response Draft'
                    ? 'text-orange-500'
                    : data?.status === 'Response Received'
                      ? 'text-green-600'
                      : data?.status === 'On-Hold'
                        ? 'text-yellow-500'
                        : data?.status === 'Cancelled'
                          ? 'text-red-600'
                          : 'text-gray-700'
          }`}
        >
          {data?.status}
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
      value: data?.response_received_on,
      key: 'response_received_on',
    },
  ];

  const auditInfo: DetailItem[] = [
    {
      label: 'Record ID',
      value: data?.rid,
      key: 'rid',
    },
    {
      label: 'Interaction ID',
      value: data?.r_number,
      key: 'r_number',
    },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(data?.created_on),
      key: 'created_on',
    },
    {
      label: 'Created By',
      value: data?.created_by,
      key: 'created_by',
    },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(data?.updated_on),
      key: 'updated_on',
    },
    {
      label: 'Updated By',
      value: data?.updated_by,
      key: 'updated_by',
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
        <InteractionQuestions questions={data?.questions} />
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
