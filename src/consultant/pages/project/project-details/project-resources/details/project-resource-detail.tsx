import { CircularProgress, Typography } from '@mui/material';
import { ProjectResourceDetailsType } from '../../../../../types/project-resources';
import { TruncateWithTooltip } from '../../../../../../components/truncate-with-tooltip';
import {
  applyHidePermission,
  getDateFormat,
  getDateTimeFormat,
} from '../../../../../../common-utils';
import { useMemo } from 'react';
import { AllPermissions, Permissions } from '../../../../../../common-service';

interface ErrorProps {
  message?: string;
}
interface ResourceDetailsProps {
  resourceData?: ProjectResourceDetailsType;
  isDetailsLoading?: boolean;
  detailsError?: ErrorProps | null | undefined;
  permission?: Permissions[];
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

const ProjectResourceDetails: React.FC<ResourceDetailsProps> = ({
  resourceData,
  isDetailsLoading,
  detailsError,
  permission,
}) => {
  const projectViewEditFields = useMemo(
    () =>
      (permission ?? []).find(
        (item) => item.name === AllPermissions.PROJECTS_RESOURCES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);

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
    // { label: 'Resource Type', value: resourceData.resource_type_name },
    // { label: 'Resource Org Name', value: resourceData.resource_orgname },
    // { label: 'Resource Name', value: resourceData.resource_name },
    // { label: 'Designation', value: resourceData.designation },
    // { label: 'Resource Role', value: resourceData.resource_role },

    // {
    //   label: 'Resource Skill Role Type',
    //   value: resourceData.assigned_skill_role,
    // },

    { label: 'Status', value: resourceData.status_name },
  ];
  const locationInfo: DetailItem[] = [
    { label: 'Country', value: resourceData.country_name },
    { label: 'Region', value: resourceData.region_name },
    { label: 'Currency', value: resourceData.currency_name },
  ];
  const projectDetails: DetailItem[] = [
    {
      label: 'Resource Start Date',
      value: getDateFormat(resourceData.start_date ?? undefined),
    },
    {
      label: 'End Date',
      value: getDateFormat(resourceData.end_date ?? undefined),
    },
    { label: 'Effort', value: resourceData.total_hours_pro_res },
    { label: 'Salary', value: resourceData.salary },
    { label: 'Bonus', value: resourceData.bonus },
    { label: 'Insurance', value: resourceData.insurance },
    { label: 'Deductions', value: resourceData.deductions },
    { label: 'Cost', value: resourceData.total_cost_pro_res },
  ];

  const auditInfo: DetailItem[] = [
    { label: 'Record ID', value: resourceData.project_rid },
    { label: 'Project Resource ID', value: resourceData.r_number },
    {
      label: 'Created On',
      value: getDateTimeFormat(resourceData.created_datetime ?? undefined),
    },
    { label: 'Created By', value: resourceData.created_name },
    {
      label: 'Updated On',
      value: getDateTimeFormat(resourceData.modified_datetime ?? undefined),
    },
    { label: 'Updated By', value: resourceData.modified_name },
    {
      label: 'Project Resource Code',
      value: resourceData.project_resource_code,
    },
  ];
  const description: DetailItem[] = [
    { label: 'Comments', value: resourceData.description },
  ];

  const IdentityDetails = applyHidePermission(basicInfo, permissionMap);
  const descriptionDetails = applyHidePermission(description, permissionMap);
  const locationInfoDetails = applyHidePermission(locationInfo, permissionMap);

  const projectResourceDetails = applyHidePermission(
    projectDetails,
    permissionMap
  );
  const auditInfoDetails = applyHidePermission(auditInfo, permissionMap);

  return (
    <div>
      <DetailsSection
        title='Basic Information'
        data={IdentityDetails as DetailItem[]}
        customStyle='pt-0 mt-0'
      />
      <DetailsSection
        title='Location and Currency Information'
        data={locationInfoDetails as DetailItem[]}
      />
      <DetailsSection
        title='Project Details'
        data={projectResourceDetails as DetailItem[]}
      />
      <DetailsSection
        title='Comments'
        data={descriptionDetails as DetailItem[]}
      />
      <DetailsSection
        title='Audit Information'
        data={auditInfoDetails as DetailItem[]}
        isAudit={true}
      />
    </div>
  );
};

export default ProjectResourceDetails;
