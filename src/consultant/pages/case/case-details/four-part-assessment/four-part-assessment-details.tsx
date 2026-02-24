import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Typography } from '@mui/material';
import { useFourPartAssessmentDetails } from '../../../../services/four-part-assessment/four-part-assessment-service';
import DetailsSection, {
  DetailItem,
} from '../../../../../components/details-section/details';
import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import SectionHeader from '../../../../../components/details-section/section-header';
import { NotesSideIcon } from '../../../../../assets';
import { ColorCode } from '../../../../types';
import DetailsSectionSkeleton from '../../../../../components/skeleton-component/detailsskeleton';

const FourPartAssessmentDetails: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const fourPartAssessmentId = searchParams.get('fpa_id') || '';

  const { data, isLoading, isError } = useFourPartAssessmentDetails(
    accountId,
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
      label: 'Back To FPA',
      variant: 'contained' as const,
      onClick: () => handleBackClick(),
      sx: { width: '100px', minWidth: '100px' },
    },
  ];

  const auditInfo: DetailItem[] = [
    {
      label: 'Record ID',
      value: data?.rid || fourPartAssessmentId,
      key: 'rid',
    },
    {
      label: 'FPA ID',
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

  // const basicDetails = applyHidePermission(basicInfo, permissionMap);
  // const auditDetails = applyHidePermission(auditInfo, permissionMap);

  return (
    <>
      <div className='border border-[#CBD6E2]'>
        <SectionHeader
          title='Four-Part Assessment'
          subValue={data?.r_number || ''}
          titleIcon={
            <NotesSideIcon
              className={`[&>path]:stroke-[${ColorCode.caseTextColor}] w-[14px] h-[14px]`}
              alt='Notes-header-icon'
            />
          }
          className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
          buttons={headerButtons}
          iconBg={ColorCode.caseBgColor}
          bgType='circle'
        />
        {isLoading ? (
          <DetailsSectionSkeleton className='p-0 m-0' />
        ) : isError ? (
          <div className='flex items-center justify-center h-64 p-4'>
            <Typography variant='h6' color='error' className='mb-2'>
              Error loading four-part assessment details
            </Typography>
          </div>
        ) : (
          <DetailsSection
            title='Basic Information'
            data={basicInfo}
            customStyle='pt-0 mt-0'
          />
        )}
      </div>
      {!isLoading &&
        !isError &&
        data?.assessment_questions &&
        data.assessment_questions.length > 0 && (
          <div className='my-3 border border-[#CBD6E2] rounded-[2px]'>
            <div className='flex items-center justify-between px-3.5 border-b border-[#CBD6E2] min-h-[40px] max-h-[40px]'>
              <div className='text-[14px] text-[#2D3E4F] font-semibold'>
                Four-Part Assessment Questions
              </div>
            </div>
            {data.assessment_questions.map((q, index) => (
              <div key={q.rid} className='p-3'>
                <div className='font-medium text-[14px] text-[#2D3E4F]'>
                  <span className='font-bold'>{`Q${index + 1}`}</span> -{' '}
                  {q.question}
                  {q.question}
                </div>

                <div
                  className={`
  mt-2 border border-[#CBD6E2] rounded-[2px] py-2 px-3 min-h-20
  text-[14px] text-[#425A76] font-normal bg-[#FFFBFA]

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
                  dangerouslySetInnerHTML={{ __html: q.response || '' }}
                />
              </div>
            ))}
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
