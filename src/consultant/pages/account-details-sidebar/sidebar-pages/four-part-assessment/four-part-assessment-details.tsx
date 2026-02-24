import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useFourPartAssessmentDetails } from '../../../../services/four-part-assessment/four-part-assessment-service';
import DetailsSection, {
  DetailItem,
} from '../../../../../components/details-section/details';
import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import SectionHeader from '../../../../../components/details-section/section-header';
import { NotesSideIcon } from '../../../../../assets';
import DetailsSectionSkeleton from '../../../../../components/skeleton-component/detailsskeleton';
import { Typography } from '@mui/material';
import { ColorCode } from '../../../../types';

const FourPartAssessmentDetails: React.FC = () => {
  const navigate = useNavigate();
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const fourPartAssessmentId = searchParams.get('fpa_id') || '';

  const { data, isLoading, isError } = useFourPartAssessmentDetails(
    accountid,
    fourPartAssessmentId,
    true
  );

  // const { permission } = useSelector((state: RootState) => state.permission);

  // // Permissions
  // const fourPartAssessmentEditFields = useMemo(
  //   () =>
  //     permission?.find(
  //       (item) => item.name === AllPermissions.FOUR_PART_ASSESSMENT_VIEW_EDIT
  //     )?.fields ?? [],
  //   [permission]
  // );

  // const fourPartAssessmentFieldsEditable = useMemo(
  //   () =>
  //     permission
  //       .find(
  //         (item) => item.name === AllPermissions.FOUR_PART_ASSESSMENT_VIEW_EDIT
  //       )
  //       ?.fields?.some((field) => field.edit),
  //   [permission]
  // );

  // const permissionMap = useMemo(() => {
  //   const map: Record<string, { read: boolean; edit: boolean }> = {};
  //   fourPartAssessmentEditFields.forEach((item) => {
  //     map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
  //   });
  //   return map;
  // }, [fourPartAssessmentEditFields]);

  const handleBackClick = () => {
    searchParams.delete('fpa_id');
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const headerButtons = [
    {
      label: 'Back To Four Part Assessment',
      variant: 'contained' as const,
      onClick: () => handleBackClick(),
      sx: { width: '205px', minWidth: '205px' },
    },
  ];

  const auditInfo: DetailItem[] = [
    {
      label: 'Record ID',
      value: data?.rid || fourPartAssessmentId,
      key: 'rid',
    },
    {
      label: 'Four Part Assessment ID',
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
      value: data?.created_by_name,
      key: 'created_by_name',
    },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(data?.modified_datetime),
      key: 'modified_datetime',
    },
    {
      label: 'Updated By',
      value: data?.modified_by_name,
      key: 'modified_by_name',
    },
  ];

  const basicInfo: DetailItem[] = [
    {
      label: 'Project Code',
      value: data?.project_code,
      key: 'project_code',
    },
    {
      label: 'Range',
      value: data?.range,
      key: 'range',
    },
    {
      label: 'Status',
      value: data?.status_name,
      key: 'status_name',
    },
  ];

  const description: DetailItem[] = [
    {
      label: 'Project Description',
      value: data?.tracker_one_liner || '',
      key: 'descriptions',
    },
  ];

  // const basicDetails = applyHidePermission(basicInfo, permissionMap);
  // const auditDetails = applyHidePermission(auditInfo, permissionMap);
  // const descriptionDetails = applyHidePermission(
  //   description,
  //   permissionMap
  // );

  return (
    <>
      <div className='border border-[#CBD6E2]'>
        <SectionHeader
          title='Four Part Assessment'
          subValue={data?.r_number || ''}
          titleIcon={
            <NotesSideIcon
              className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
              alt='Notes-header-icon'
            />
          }
          className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
          buttons={headerButtons}
          iconBg={ColorCode.accountBgColor}
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
              data={basicInfo}
              customStyle='pt-0 mt-0'
            />
            <DetailsSection
              title=''
              data={description}
              fullColumn={true}
              customStyle='pt-[1px]'
            />
          </>
        )}
      </div>
      {!isLoading && !isError && data?.assessment_questions && (
        <div className='my-3 border border-[#CBD6E2] rounded-[2px]'>
          <div className='flex items-center justify-between px-3.5 border-b border-[#CBD6E2] min-h-[40px] max-h-[40px]'>
            <div className='text-[14px] text-[#2D3E4F] font-semibold'>
              Four Part Assessment
            </div>
          </div>
          {Object.entries(data.assessment_questions).map(
            ([question, response], index) => {
              const questionLabels: Record<string, string> = {
                permitted_purpose: 'Permitted Purpose',
                technological_uncertainty: 'Technological Uncertainty',
                process_of_experimentation: 'Process of Experimentation',
                technological_in_nature: 'Technological in Nature',
              };

              return (
                <div
                  key={question}
                  className='p-3 border-b last:border-b-0 border-[#CBD6E2]'
                >
                  <div className='font-medium text-[14px] text-[#2D3E4F] mb-2'>
                    <span className='font-bold'>{`Q${index + 1}`}</span> -{' '}
                    {questionLabels[question] || question}
                  </div>

                  <div className='mt-2 border border-[#CBD6E2] rounded-[2px] py-2 px-3 text-[14px] text-[#425A76] font-normal bg-[#FFFBFA]'>
                    {response}
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
            data={auditInfo}
            customStyle='pt-0 mt-0'
            isAudit={true}
          />
        </div>
      )}
    </>
  );
};

export default FourPartAssessmentDetails;
