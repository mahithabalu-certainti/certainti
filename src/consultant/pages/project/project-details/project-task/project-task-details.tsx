import { CircularProgress, Typography } from '@mui/material';
import { ProjectTaskDetailsType } from '../../../../types/project-task';
import { TruncateWithTooltip } from '../../../../../components/truncate-with-tooltip';
import { getDateFormat } from '../../../../../common-utils';

interface ErrorProps {
  message?: string;
}
interface ResourceDetailsProps {
  resourceData?: ProjectTaskDetailsType;
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
                    className={`grid grid-cols-1 gap-6 ${
                      isAudit ? 'md:grid-cols-2 w-full' : 'md:grid-cols-3'
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
  resourceData,
  isDetailsLoading,
  detailsError,
  // accountId,
}) => {
  // const resourceData = resourceDetails?.data?.projectResourceDetails;

  if (isDetailsLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <CircularProgress />
        <Typography variant='body1' className='ml-4'>
          Loading resource details...
        </Typography>
      </div>
    );
  }

  if (detailsError) {
    return (
      <div className='flex flex-col items-center justify-center h-64 p-4'>
        <Typography variant='h6' color='error' className='mb-2'>
          Error loading resource details
        </Typography>
        <Typography
          variant='body2'
          color='textSecondary'
          className='text-center'
        >
          {detailsError?.message ||
            'Failed to fetch resource details. Please try again later.'}
        </Typography>
      </div>
    );
  }

  if (!resourceData) {
    return (
      <div className='flex flex-col items-center justify-center h-64 p-4'>
        <Typography variant='h6' color='textSecondary'>
          No resource details available
        </Typography>
      </div>
    );
  }

  const basicInfo: DetailItem[] = [
    { label: 'Resource Code', value: resourceData.resource_code },
    { label: 'Resource Type', value: resourceData.resource_type },
    { label: 'Resource Org Name', value: resourceData.resource_org_name },
    { label: 'Resource Name', value: resourceData.resource_name },
    { label: 'Designation', value: resourceData.designation },
    { label: 'Resource Role', value: resourceData.resource_role },
    { label: 'Fiscal Year', value: resourceData.fiscal_year },
    { label: 'Status', value: resourceData.status },
  ];
  const locationInfo: DetailItem[] = [
    { label: 'Country', value: resourceData.country },
    { label: 'Region', value: resourceData.region },
    { label: 'Currency', value: resourceData.currency },
  ];
  const projectDetails: DetailItem[] = [
    {
      label: 'Effective From',
      value: getDateFormat(resourceData.resource_effective_from ?? undefined),
    },
    {
      label: 'End Date',
      value: getDateFormat(resourceData.resource_enddate ?? undefined),
    },
    { label: 'Cost', value: resourceData.cost },
    { label: 'Effort', value: resourceData.effort },
  ];

  const auditInfo: DetailItem[] = [
    { label: 'Record ID', value: resourceData.project_id },
    { label: 'Created On', value: resourceData.created_on },
    { label: 'Updated On', value: resourceData.updated_on },
    { label: 'Project Resource ID', value: resourceData.project_resource_id },
    { label: 'Created By', value: resourceData.created_by },
    { label: 'Updated By', value: resourceData.updated_by },
    {
      label: 'Project Resource Code',
      value: resourceData.project_resource_code,
    },
  ];
  const description: DetailItem[] = [
    { label: 'Comments', value: resourceData.comments },
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
      />
    </div>
  );
};

export default ProjectTaskDetails;
