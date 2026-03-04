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
import { moduleColorMap } from './helper';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { AllPermissions } from '../../../common-service';

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
    if (isFromInteraction) {
      searchParams.delete('fpa_id');
      searchParams.delete('navigate_source');
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
    } else {
      searchParams.delete('fpa_id');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const headerButtons = [
    {
      label: isFromInteraction
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
      value: data?.basic_information?.project_code,
      key: 'project_code',
      ignorePermission: true,
      hide:
        moduleLevel === 'project' ||
        (!projectPermissionMap?.['project_code']?.edit &&
          !projectPermissionMap?.['project_code']?.read),
    },
    {
      label: 'Range',
      value: data?.basic_information?.rd_potential_category,
      key: 'rd_potential_category',
    },
    {
      label: 'Status',
      value: data?.basic_information?.status,
      key: 'status_rid',
    },
  ];

  const description: DetailItem[] = [
    {
      label: 'Project Description',
      value: data?.basic_information?.project_description || '',
      key: 'project_description',
    },
  ];

  const basicDetails = applyHidePermission(basicInfo, permissionMap);
  const auditDetails = applyHidePermission(auditInfo, permissionMap);
  const descriptionDetails = applyHidePermission(
    description,
    projectPermissionMap
  );

  const hideFourPartAssessment =
    !permissionMap?.['four_part_assessment']?.edit &&
    !permissionMap?.['four_part_assessment']?.read;

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
            <DetailsSection
              title=''
              data={descriptionDetails}
              fullColumn={true}
              customStyle='pt-[1px]'
            />
          </>
        )}
      </div>
      {!hideFourPartAssessment &&
        !isLoading &&
        !isError &&
        data?.four_part_assessment && (
          <div className='my-3 border border-[#CBD6E2] rounded-[2px]'>
            <div className='flex items-center justify-between px-3.5 border-b border-[#CBD6E2] min-h-[40px] max-h-[40px]'>
              <div className='text-[14px] text-[#2D3E4F] font-semibold'>
                Four Part Assessment
              </div>
            </div>
            {Object.entries(data.four_part_assessment).map(
              ([question, response], index) => {
                return (
                  <div
                    key={question}
                    className='p-3 border-b last:border-b-0 border-[#CBD6E2]'
                  >
                    <div className='font-medium text-[14px] text-[#2D3E4F] mb-2'>
                      <span className='font-bold'>{`${index + 1}`}</span> -{' '}
                      {formatSnakeCaseLabel(question)}
                    </div>

                    <div className='mt-2 border border-[#CBD6E2] rounded-[2px] py-2 px-3 text-[14px] text-[#425A76] font-normal bg-[#FFFBFA]'>
                      {response || '-'}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
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
