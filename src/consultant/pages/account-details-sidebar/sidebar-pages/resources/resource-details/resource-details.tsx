/* eslint-disable @typescript-eslint/no-explicit-any */
import { CircularProgress, Typography } from '@mui/material';
import React from 'react';
import { useResourceDetail } from '../../../../../services/resource-details';
import { CreateSectionData } from '../../../../../types';
import { formatDateToYYYYMMDD, formatDateToYYYYMMDDWithTime } from '../utils';

interface ResourceDetailsProps {
  resourceId: string;
  accountId: string;
}

interface DetailItem {
  label: string;
  value: React.ReactNode;
}

interface AuditDetailsSectionProps {
  title: string;
  data: {
    rid: string;
    r_number: string;
    created_datetime: string;
    created_by: string;
    modified_datetime: string;
    modified_by: string | null;
  };
}

const formatKey = (key: string): string => {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
interface AuditDetailsSectionProps {
  title: string;
  data: {
    rid: string;
    r_number: string;
    created_datetime: string;
    created_by: string;
    modified_datetime: string;
    modified_by: string | null;
  };
}

interface AuditItem {
  label: string;
  value: React.ReactNode;
  column: 1 | 2;
  row?: number;
}

const AuditDetailsSection: React.FC<AuditDetailsSectionProps> = ({
  title,
  data,
}) => {
  // Define audit items with their columns
  const auditItems: AuditItem[] = [
    { label: 'Record ID', value: data.rid, column: 1 },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(data.created_datetime),
      column: 1,
    },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(data.modified_datetime),
      column: 1,
    },
    { label: 'Resource ID', value: data.r_number, column: 2 },
    { label: 'Created By', value: data.created_by, column: 2 },
    { label: 'Updated By', value: data.modified_by, column: 2 },
  ];

  // Group items by column
  const columnOneItems = auditItems.filter((item) => item.column === 1);
  const columnTwoItems = auditItems.filter((item) => item.column === 2);

  return (
    <div className='mt-3'>
      <div className='text-[15px] text-[#2D3E4F] font-bold'>{title}</div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* First Column */}
        <div className='text-sm my-[6px] grid gap-y-3'>
          {columnOneItems.map((item, index) => (
            <AuditItemRow key={`col1-${index}`} item={item} />
          ))}
        </div>

        {/* Second Column */}
        <div className='text-sm my-[6px] grid gap-y-3'>
          {/* First row - Resource Id */}
          <AuditItemRow item={columnTwoItems[0]} />

          {/* Second row - Empty space for alignment */}
          {/* <div>&nbsp;</div> */}

          {/* Remaining items */}
          {columnTwoItems.slice(1).map((item, index) => (
            <AuditItemRow key={`col2-${index + 1}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Extracted reusable row component
const AuditItemRow: React.FC<{ item: AuditItem }> = ({ item }) => {
  if (!item) return null;

  return (
    <div className='grid grid-cols-[120px_auto] sm:grid-cols-[200px_auto] gap-x-2 gap-y-3'>
      <div className='text-right font-semibold text-[13px] text-[#425A76] pr-1'>
        {item.label}
      </div>
      <div className='font-medium text-[13px] break-all overflow-hidden'>
        <span className='font-medium text-[13px] text-[#425A76]'>
          {item.value || '-'}
        </span>
      </div>
    </div>
  );
};

const DetailsSection: React.FC<{
  title: string;
  data: DetailItem[];
}> = ({ title, data }) => {
  // Split data into two columns
  const leftColumn: DetailItem[] = [];
  const rightColumn: DetailItem[] = [];

  data.forEach((item, index) => {
    if (index % 2 === 0) {
      leftColumn.push(item);
    } else {
      rightColumn.push(item);
    }
  });

  const renderValue = (value: React.ReactNode) => {
    if (typeof value === 'string') {
      const status = value.toLowerCase();
      if (status === 'active') {
        return <span className='text-[#199806]'>Active</span>;
      }
      if (status === 'inactive') {
        return <span className='text-[#f44336]'>In-Active</span>;
      }
    }
    return (
      <span className='font-medium text-[13px] text-[#425A76]'>
        {value || '-'}
      </span>
    );
  };

  return (
    <div className={title === 'Basic Information' ? 'mt-0' : 'mt-3'}>
      <div className='text-[15px] text-[#2D3E4F] font-bold'>{title}</div>
      <div className='text-sm my-[6px] grid gap-y-3'>
        {title === 'Comments'
          ? // Full-width single column layout for Comments
            data.map((item, index) => (
              <div
                key={`comment-row-${index}`}
                className='grid grid-cols-[120px_auto] sm:grid-cols-[200px_auto] gap-x-2'
              >
                <div className='text-right font-semibold text-[13px] text-[#425A76] pr-1'>
                  {item.label}
                </div>
                <div className='font-medium text-[13px] break-all overflow-hidden'>
                  {renderValue(item.value)}
                </div>
              </div>
            ))
          : leftColumn.map((leftItem, index) => {
              const rightItem = rightColumn[index];

              return (
                <div
                  key={`row-${index}`}
                  className='grid grid-cols-1 md:grid-cols-2 gap-6'
                >
                  {/* Left column */}
                  <div className='grid grid-cols-[120px_auto] sm:grid-cols-[200px_auto] gap-x-2'>
                    <div className='text-right font-semibold text-[13px] text-[#425A76] pr-1'>
                      {leftItem.label}
                    </div>
                    <div className='font-medium text-[13px] break-all overflow-hidden'>
                      {renderValue(leftItem.value)}
                    </div>
                  </div>

                  {/* Right column */}
                  {rightItem ? (
                    <div className='grid grid-cols-[120px_auto] sm:grid-cols-[200px_auto] gap-x-2'>
                      <div className='text-right font-semibold text-[13px] text-[#425A76] pr-1'>
                        {rightItem.label}
                      </div>
                      <div className='font-medium text-[13px] break-all overflow-hidden'>
                        {renderValue(rightItem.value)}
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
};

const ResourceDetails: React.FC<ResourceDetailsProps> = ({
  resourceId,
  accountId,
}) => {
  const {
    data: resource,
    isLoading,
    error,
  } = useResourceDetail(resourceId, accountId);

  const resourceData = resource?.data?.resourceDetails;

  const CreateSectionData = (
    dataObj: Partial<CreateSectionData>,
    customMappings?: Record<string, (val: any) => React.ReactNode>
  ) => {
    return Object.entries(dataObj).map(([key, value]) => {
      // Handle nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return {
          label: formatKey(key),
          value: Object.values(value).join(', ') || '-', // or handle nested objects differently
        };
      }

      if (key === 'resource_ref_id' && !Array.isArray(value)) {
        return {
          label: 'Resource Code',
          value: value ?? '-', // or handle nested objects differently
        };
      }

      if (key === 'resource_startdate' && !Array.isArray(value)) {
        return {
          label: 'Effective From',
          value: formatDateToYYYYMMDD(value as string) || '-', // or handle nested objects differently
        };
      }

      if (key === 'resource_enddate' && !Array.isArray(value)) {
        return {
          label: 'End Date',
          value: formatDateToYYYYMMDD(value as string) || '-', // or handle nested objects differently
        };
      }

      if (key === 'total_years_in_org' && !Array.isArray(value)) {
        return {
          label: 'Total Years in Organization',
          value: value || '-', // or handle nested objects differently
        };
      }

      if (key === 'total_years_experience' && !Array.isArray(value)) {
        return {
          label: 'Total Years of Experience',
          value: value || '-', // or handle nested objects differently
        };
      }

      if (key === 'resource_fullname' && !Array.isArray(value)) {
        return {
          label: 'Name',
          value: value ?? '-', // or handle nested objects differently
        };
      }

      if (key === 'resource_orgname' && !Array.isArray(value)) {
        return {
          label: 'Resource Org Name',
          value: value ?? '-', // or handle nested objects differently
        };
      }

      const displayValue =
        value === null || value === '' || value === undefined
          ? '-'
          : customMappings?.[key]
            ? customMappings[key](value)
            : value;

      return {
        label: formatKey(key),
        value: displayValue,
      };
    });
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <CircularProgress />
        <Typography variant='body1' className='ml-4'>
          Loading resource details...
        </Typography>
      </div>
    );
  }

  if (error) {
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
          {error.message ||
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

  // Section data with custom formatting where needed
  const basicInfo = CreateSectionData({
    resource_code: resourceData.resource_code,
    resource_fullname:
      resourceData?.resource_name?.trim() ||
      (
        (resourceData?.resource_firstname?.trim() || '') +
        ' ' +
        (resourceData?.resource_lastname?.trim() || '')
      ).trim() ||
      ' - ',
    resource_type: resourceData.resource_type,
    first_name: resourceData.resource_firstname,
    status: resourceData.resource_status,
    last_name: resourceData.resource_lastname,
    role: resourceData.resource_role,
    resource_orgname: resourceData.resource_orgname,
  });

  const locationInfo = CreateSectionData({
    country: resourceData?.country_name,
    region: resourceData.region_name,
    city: resourceData.city_name,
  });

  const employmentDetails = CreateSectionData(
    {
      resource_startdate: resourceData.resource_startdate,
      resource_enddate: resourceData.resource_enddate,
      total_years_experience: resourceData.resource_total_experience,
      designation: resourceData.resource_designation,
      total_years_in_org: resourceData.resource_total_experience_organization,
    }
    // {
    //   resource_effective_from: formatDateToYYYYMMDD,
    //   resource_end_date: formatDateToYYYYMMDD,
    // }
  );

  const description = CreateSectionData({
    comments: resourceData.comments,
  });

  // const auditInfo = CreateSectionData(
  //   {
  //     rid: resourceData.rid,
  //     r_number: resourceData.r_number,
  //     created_datetime: resourceData.created_datetime,
  //     created_by: resourceData.created_by,
  //     modified_datetime: resourceData.modified_datetime,
  //     modified_by: resourceData.modified_by,
  //   }
  // )

  return (
    <div className='max-w-6xl px-6 py-2'>
      <DetailsSection title='Basic Information' data={basicInfo} />
      <DetailsSection
        title='Location and Currency Information'
        data={locationInfo}
      />
      <DetailsSection title='Employment Details' data={employmentDetails} />
      <DetailsSection title='Comments' data={description} />
      <AuditDetailsSection
        title='Audit Information'
        data={{
          rid: resourceData.rid,
          r_number: resourceData.r_number,
          created_datetime: resourceData.created_datetime,
          created_by: resourceData.created_by,
          modified_datetime: resourceData.modified_datetime,
          modified_by: resourceData.modified_by,
        }}
      />
    </div>
  );
};

export default ResourceDetails;
