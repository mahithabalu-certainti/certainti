import { CircularProgress, Typography } from '@mui/material';
import { ProjectTaskDetailsType } from '../../../../types/project-task';
import { TruncateWithTooltip } from '../../../../../components/truncate-with-tooltip';
import { getDateFormat, getDateTimeFormat } from '../../../../../common-utils';

interface ErrorProps {
  message?: string;
}
interface ResourceDetailsProps {
  projectTaskData?: ProjectTaskDetailsType;
  isDetailsLoading?: boolean;
  detailsError?: ErrorProps | null | undefined;
}

interface DetailItem {
  label: string;
  value: React.ReactNode;
}

const DetailsSection: React.FC<{
  title: string;
  data: DetailItem[];
  customStyle?: string;
  fullColumn?: boolean;
  isAudit?: boolean;
}> = ({ title, data, customStyle, fullColumn, isAudit }) => {
  // Split data into two columns
  const leftColumn: DetailItem[] = [];
  const middleColumn: DetailItem[] = [];
  const rightColumn: DetailItem[] = [];

  if (isAudit) {
    data.forEach((item, index) => {
      if (index % 2 === 0) leftColumn.push(item);
      else middleColumn.push(item);
    });
  } else {
    data.forEach((item, index) => {
      if (index % 3 === 0) leftColumn.push(item);
      else if (index % 3 === 1) middleColumn.push(item);
      else rightColumn.push(item);
    });
  }

  const renderValue = (value: React.ReactNode, label?: string) => {
    if (!value) return <span>-</span>;
    if (value === 'empty') return <span></span>;

    if (typeof value === 'string') {
      const status = value.toLowerCase();

      if (status === 'active')
        return <span className='text-[#199806]'>Active</span>;

      if (status === 'inactive' || status === 'in-active')
        return <span className='text-[#f44336]'>In-Active</span>;

      if (label?.toLowerCase() === 'website') {
        const hasProtocol = /^https?:\/\//i.test(value);
        const formattedHref = hasProtocol ? value : `https://${value}`;
        return (
          <span className='font-medium text-[13px] text-[#425A76]'>
            <a
              href={formattedHref}
              target='_blank'
              rel='noopener noreferrer'
              className='underline decoration-[#425A76]'
            >
              {value}
            </a>
          </span>
        );
      }

      return (
        <span className='font-medium text-[13px] text-[#425A76]'>{value}</span>
      );
    }

    return (
      <span className='font-medium text-[13px] text-[#425A76]'>
        {value || (value === 0 ? 0 : '-')}
      </span>
    );
  };
  const styleName = customStyle ? customStyle : ' pt-2 mt-3';
  return (
    <>
      <div className={styleName}>
        {title && (
          <div className='flex items-center align-middle px-6  h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
            {title}
          </div>
        )}
        <div className='text-sm my-[6px] px-6 grid gap-y-3'>
          {fullColumn
            ? data.map((item, index) => (
              <div
                key={index}
                className='grid grid-cols-[100px_auto] sm:grid-cols-[200px_auto] gap-x-2'
              >
                <div className='text-left font-semibold text-[13px] text-[#425A76] pr-1'>
                  {item.label}
                </div>
                <div className='font-medium text-[13px] break-all overflow-hidden text-ellipsis whitespace-nowrap'>
                  <TruncateWithTooltip
                    text={String(item.value)}
                    maxWidth={'100%'}
                    className='truncate inline-block max-w-full'
                    alwaysShowTooltip={true}
                    tooltipMaxWidth={'50vw'}
                  >
                    {renderValue(item.value)}
                  </TruncateWithTooltip>
                </div>
              </div>
            ))
            : leftColumn.map((leftItem, index) => {
              const midItem = middleColumn[index];
              const rightItem = isAudit ? undefined : rightColumn[index];

              const itemsToRender = isAudit
                ? [leftItem, midItem]
                : [leftItem, midItem, rightItem];

              return (
                <div
                  key={index}
                  className={`grid grid-cols-1 gap-6 ${isAudit ? 'md:grid-cols-2 w-full' : 'md:grid-cols-3'
                    }`}
                >
                  {itemsToRender.map(
                    (item, idx) =>
                      item && (
                        <div
                          key={idx}
                          className='grid grid-cols-[100px_auto] sm:grid-cols-[200px_auto] gap-x-2 min-w-0'
                        >
                          <div className='text-left font-semibold text-[13px] text-[#425A76] pr-1'>
                            {item.label}
                          </div>
                          <div className='font-medium text-[13px] truncate min-w-0'>
                            <TruncateWithTooltip
                              // text={String(item.value)}
                              maxWidth={'100%'}
                              className='truncate inline-block max-w-full'
                              alwaysShowTooltip={
                                item.value &&
                                  item.value !== 'empty' &&
                                  item.value !== '-'
                                  ? true
                                  : false
                              }
                            >
                              {renderValue(item.value, item.label)}
                            </TruncateWithTooltip>
                          </div>
                        </div>
                      )
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
};

const ProjectTaskDetails: React.FC<ResourceDetailsProps> = ({
  projectTaskData,
  isDetailsLoading,
  detailsError,
  // accountId,
}) => {
  // const projectTaskData = resourceDetails?.data?.projectResourceDetails;

  if (isDetailsLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <CircularProgress />
        <Typography variant='body1' className='ml-4'>
          Loading task details...
        </Typography>
      </div>
    );
  }

  if (detailsError) {
    return (
      <div className='flex flex-col items-center justify-center h-64 p-4'>
        <Typography variant='h6' color='error' className='mb-2'>
          Error loading task details
        </Typography>
        <Typography
          variant='body2'
          color='textSecondary'
          className='text-center'
        >
          {detailsError?.message ||
            'Failed to fetch task details. Please try again later.'}
        </Typography>
      </div>
    );
  }

  if (!projectTaskData) {
    return (
      <div className='flex flex-col items-center justify-center h-64 p-4'>
        <Typography variant='h6' color='textSecondary'>
          No task details available
        </Typography>
      </div>
    );
  }

  const basicInfo: DetailItem[] = [
    { label: 'Resource Code', value: projectTaskData.resource_code },
    { label: 'Resource Name', value: projectTaskData.resource_name },
    { label: 'Resource Type', value: projectTaskData.resource_type_name },
    // { label: 'Resource Org Name', value: projectTaskData.resource_orgname }, 
    { label: 'Resource Role', value: projectTaskData.resource_role },
  ];
  const locationInfo: DetailItem[] = [
    { label: 'Country', value: projectTaskData.country_name },
    { label: 'Region', value: projectTaskData.region_name },
    { label: 'Currency', value: projectTaskData.currency_name },
  ];

  const projectDetails: DetailItem[] = [
    {
      label: 'Effective From',
      value: getDateFormat(projectTaskData.start_date ?? undefined),
    },
    {
      label: 'End Date',
      value: getDateFormat(projectTaskData.end_date ?? undefined),
    },
    { label: 'Cost', value: projectTaskData.total_cost_pro_task },
    { label: 'Effort', value: projectTaskData.total_hours_pro_task },
  ];

  const auditInfo: DetailItem[] = [
    { label: 'Record ID', value: projectTaskData.r_number },
    { label: 'Project Task ID', value: projectTaskData.r_number },
    { label: 'Created On', value: getDateTimeFormat(projectTaskData.created_datetime ?? undefined) },
    { label: 'Created By', value: projectTaskData.created_by },
    { label: 'Updated On', value: getDateTimeFormat(projectTaskData.modified_datetime ?? undefined) },
    { label: 'Updated By', value: projectTaskData.modified_by },

  ];
  const description: DetailItem[] = [
    { label: 'Comments', value: projectTaskData.comments },
  ];

  return (
    <div>
      <DetailsSection
        title='Basic Information'
        data={basicInfo as DetailItem[]}
        customStyle='pt-0 mt-0'
      />
      <DetailsSection
        title='Location and Currency Information'
        data={locationInfo as DetailItem[]}
      />
      <DetailsSection
        title='Project Details'
        data={projectDetails as DetailItem[]}
        isAudit={true}
      />
      <DetailsSection title='Comments' data={description as DetailItem[]} />
      <DetailsSection
        title='Audit Information'
        data={auditInfo as DetailItem[]}
        isAudit={true}
      />
    </div>
  );
};

export default ProjectTaskDetails;
