import React, { useMemo } from 'react';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useFourPartAssessmentDetails } from '../../services/four-part-assessment/four-part-assessment-service';
import {
  ACCOUNT_DETAILS,
  CASE_DETAILS,
  PROJECT_DETAILS,
} from '../../../routes';
import DetailsSection, {
  DetailItem,
} from '../../../components/details-section/details';
import {
  applyHidePermission,
  formatDateToYYYYMMDDWithTime,
} from '../../../common-utils';
import SectionHeader from '../../../components/details-section/section-header';
import { FourPartIcon } from '../../../assets';
import DetailsSectionSkeleton from '../../../components/skeleton-component/detailsskeleton';
import { Typography } from '@mui/material';
import { moduleColorMap, renderAssessmentChip } from './helper';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { AllPermissions } from '../../../common-service';
import { FourPartAssessmentInteractionQuestions } from '../../types';
import { TruncateWithTooltip } from '../../../components';

interface FourPartAssessmentDetailsProps {
  moduleLevel: 'account' | 'project' | 'case';
}

const formatSnakeCaseLabel = (key: string): string =>
  key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const FourPartAssessmentDetails: React.FC<FourPartAssessmentDetailsProps> = ({
  moduleLevel,
}) => {
  const navigate = useNavigate();
  const { accountid, caseId, projectid } = useParams();
  const [searchParams] = useSearchParams();
  const accountID = searchParams.get('accountID') || '';
  const fourPartAssessmentId = searchParams.get('fpa_id') || '';
  const isFromInteraction =
    searchParams.get('navigate_source') === 'interactions';
  const isFromMainInteraction =
    searchParams.get('main_navigate_source') === 'interactions';

  const { data, isLoading, isError } = useFourPartAssessmentDetails(
    accountid || accountID,
    fourPartAssessmentId,
    true
  );

  const { permission } = useSelector((state: RootState) => state.permission);

  // Permissions
  const fourPartAssessmentEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.FOUR_PART_ASSESSMENT_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    fourPartAssessmentEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [fourPartAssessmentEditFields]);

  const projectViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const projectPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);

  const handleBackClick = () => {
    if (isFromInteraction || isFromMainInteraction) {
      searchParams.delete('navigate_source');
      searchParams.delete('main_navigate_source');
      searchParams.set('list', 'interactions');

      if (moduleLevel === 'account') {
        const path = generatePath(ACCOUNT_DETAILS, {
          accountid: accountid || '',
        });
        navigate(`${path}?${searchParams.toString()}`, {
          state: { activeKey: 'interactions' },
          replace: true,
        });
      } else if (moduleLevel === 'project') {
        const path = generatePath(PROJECT_DETAILS, {
          projectid: projectid || '',
        });
        navigate(`${path}?${searchParams.toString()}`, {
          state: { activeKey: 'interactions' },
          replace: true,
        });
      } else if (moduleLevel === 'case') {
        const path = generatePath(CASE_DETAILS, {
          caseId: caseId || '',
        });
        navigate(`${path}?${searchParams.toString()}`, {
          state: { activeKey: 'interactions' },
          replace: true,
        });
      }
      searchParams.delete('fpa_id');
    } else {
      searchParams.delete('fpa_id');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const headerButtons = [
    {
      label:
        isFromInteraction || isFromMainInteraction
          ? 'Back To Interactions'
          : 'Back To Four Part Assessment',
      variant: 'contained' as const,
      onClick: () => handleBackClick(),
      sx: { width: 'auto', padding: '0 9px' },
    },
  ];

  const auditInfo: DetailItem[] = [
    {
      label: 'Record ID',
      value: data?.title?.rid || fourPartAssessmentId,
      key: 'rid',
    },
    {
      label: 'Four Part Assessment ID',
      value:
        data?.title?.r_number ||
        data?.audit_information?.four_part_assessment_id,
      key: 'r_number',
    },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(data?.audit_information?.created_on),
      key: 'created_datetime',
    },
    {
      label: 'Created By',
      value: data?.audit_information?.created_by_name,
      key: 'created_by',
    },
  ];

  const basicInfo: DetailItem[] = [
    {
      label: 'Project Code',
      value: data?.record_information?.project_code,
      key: 'project_code',
      ignorePermission: true,
      hide:
        !projectPermissionMap?.['project_code']?.edit &&
        !projectPermissionMap?.['project_code']?.read,
    },
    {
      label: 'R&D Potential Category',
      value: renderAssessmentChip(
        data?.record_information?.rd_potential_category
      ),
      key: 'rd_potential_category',
    },
    {
      label: 'Status',
      value: renderAssessmentChip(data?.record_information?.status),
      key: 'status_rid',
    },
  ];

  const handleInteractionNavigate = (
    interaction: FourPartAssessmentInteractionQuestions | null
  ) => {
    if (!interaction?.interaction_rid) return;
    searchParams.set('list', 'interactions');
    searchParams.set('interaction_id', interaction?.interaction_rid);
    searchParams.set('interaction_number', interaction?.r_number);
    searchParams.set('navigate_source', 'four_part');
    if (isFromInteraction) {
      searchParams.set('main_navigate_source', 'interactions');
    }
    searchParams.set('project_fiscal_rid', interaction?.project_fiscal_rid);

    navigate(
      { search: searchParams.toString() },
      { state: { activeKey: 'interactions' }, replace: true }
    );
  };

  const basicDetails = applyHidePermission(basicInfo, permissionMap);
  const auditDetails = applyHidePermission(auditInfo, permissionMap);

  const hideFourPartAssessment =
    !permissionMap?.['four_part_assessment']?.edit &&
    !permissionMap?.['four_part_assessment']?.read;

  const hideInteractionQuestions =
    !permissionMap?.['interaction_questions']?.edit &&
    !permissionMap?.['interaction_questions']?.read;

  const hideSummary =
    !permissionMap?.['summary_judgment']?.edit &&
    !permissionMap?.['summary_judgment']?.read;

  const currentModuleColors = moduleColorMap[moduleLevel];

  return (
    <>
      <div className='border border-[#CBD6E2]'>
        <SectionHeader
          title='Four Part Assessment'
          subValue={data?.title?.r_number || ''}
          titleIcon={
            <FourPartIcon
              className={`text-[${currentModuleColors.text}] w-[13px] h-[13px]`}
              alt='header-icon'
            />
          }
          className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
          buttons={headerButtons}
          iconBg={currentModuleColors.bg}
          bgType='circle'
        />
        {isLoading ? (
          <DetailsSectionSkeleton className='p-0 m-0' />
        ) : isError ? (
          <div className='flex items-center justify-center h-64 p-4'>
            <Typography variant='h6' color='error' className='mb-2'>
              Error loading four part assessment details
            </Typography>
          </div>
        ) : (
          <>
            <DetailsSection
              title='Basic Information'
              data={basicDetails}
              customStyle='pt-0 mt-0'
            />
            {!hideSummary && (
              <div className='pt-[1px]'>
                <div className='flex items-center align-middle px-3 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
                  Summary
                </div>
                <TruncateWithTooltip
                  text={undefined}
                  maxWidth={'100%'}
                  className='break-all max-w-full inline-block'
                  alwaysShowTooltip={true}
                  tooltipMaxWidth={'50vw'}
                  whiteSpace='normal'
                >
                  <span className='inline-block font-medium text-[13px] text-[#425A76] px-6 my-[6px]'>
                    {data?.record_information?.tracker_one_liner || '-'}
                  </span>
                </TruncateWithTooltip>
              </div>
            )}
          </>
        )}
      </div>
      {!hideFourPartAssessment &&
        !isLoading &&
        !isError &&
        data?.four_part_assessment_evaluation && (
          <div className='my-3 border border-[#CBD6E2] rounded-[2px]'>
            <div className='flex items-center justify-between px-3.5 border-b border-[#CBD6E2] min-h-[40px] max-h-[40px]'>
              <div className='text-[14px] text-[#2D3E4F] font-semibold'>
                Four Part Assessment
              </div>
            </div>
            {Object.entries(data.four_part_assessment_evaluation).map(
              ([question, item], index) => {
                return (
                  <div
                    key={question}
                    className='p-3 border-b last:border-b-0 border-[#CBD6E2]'
                  >
                    <div className='flex items-center justify-between gap-2 mb-2'>
                      <div className='flex items-center gap-1'>
                        <span className='font-bold text-[14px] text-[#2D3E4F]'>
                          {index + 1}
                        </span>
                        <span className='font-medium text-[14px] text-[#2D3E4F]'>
                          - {formatSnakeCaseLabel(question)}
                        </span>
                      </div>
                      {item?.status && renderAssessmentChip(item.status)}
                    </div>
                    <div className='mt-2 border border-[#CBD6E2] rounded-[2px] py-2 px-3 text-[14px] text-[#425A76] font-normal bg-[#FFFBFA]'>
                      {item?.rationale || '-'}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      {!hideInteractionQuestions &&
      !isLoading &&
      !isError &&
      data?.interaction_questions?.question_details?.length ? (
        <div className='my-3 border border-[#CBD6E2] rounded-[2px]'>
          <div className='flex items-center justify-between px-3.5 border-b border-[#CBD6E2] min-h-[40px] max-h-[40px]'>
            <div className='text-[14px] text-[#2D3E4F] font-semibold'>
              Interaction Questions
            </div>
            <span
              onClick={() =>
                handleInteractionNavigate(data?.interaction_questions)
              }
              className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
            >
              View Interaction
            </span>
          </div>
          {data.interaction_questions.question_details.map((item, index) => (
            <div
              key={item.question_seq_num}
              className='flex items-start gap-2 px-3.5 py-2.5 border-b last:border-b-0 border-[#CBD6E2]'
            >
              <span className='font-bold text-[13px] text-[#2D3E4F] shrink-0'>
                {index + 1}.
              </span>
              <span className='text-[13px] text-[#425A76] font-normal leading-snug'>
                {item.question}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {!isLoading && !isError && data && (
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

export default FourPartAssessmentDetails;
