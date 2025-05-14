/* eslint-disable @typescript-eslint/no-explicit-any */
import { CircularProgress, Typography } from '@mui/material';
import React from 'react';
import { useResourceDetail } from '../../../../../services/resource-details';
import { CreateSectionData } from '../../../../../types';
import { formatDateToMMDDYYYY, formatDateToMMDDYYYYWithTime } from '../utils';

interface ResourceDetailsProps {
  resourceId: string;
  accountId: string;
}

interface DetailItem {
  label: string;
  value: React.ReactNode;
}

const formatKey = (key: string): string => {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
      <span className='font-light text-[14px] text-[#2D3E4F]'>{value || 'NA'}</span>
    );
  };

  return (
    <div className={title === 'Basic Information' ? 'mt-0' : 'mt-6'}>
      <div className='text-[16px] text-[#2D3E4F] font-semibold'>{title}</div>
      <div className='text-sm my-1.5 grid gap-y-2'>
        {leftColumn.map((leftItem, index) => {
          const rightItem = rightColumn[index];

          return (
            <div
              key={`row-${index}`}
              className='grid grid-cols-1 md:grid-cols-2 gap-6'
            >
              {/* Left column */}
              <div className='grid grid-cols-[120px_auto] sm:grid-cols-[200px_auto] gap-x-4 py-2'>
                <div className='text-right font-normal text-[14px] text-[#65686F] pr-2'>
                  {leftItem.label}
                </div>
                <div className='font-light text-[14px] break-all overflow-hidden'>
                  {renderValue(leftItem.value)}
                </div>
              </div>

              {/* Right column */}
              {rightItem ? (
                <div className='grid grid-cols-[120px_auto] sm:grid-cols-[200px_auto] gap-x-4 py-2'>
                  <div className='text-right font-normal text-[14px] text-[#65686F] pr-2'>
                    {rightItem.label}
                  </div>
                  <div className='font-light text-[14px] break-all overflow-hidden'>
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

  const   CreateSectionData = (
    dataObj: Partial<CreateSectionData>,
    customMappings?: Record<string, (val: any) => React.ReactNode>
  ) => {
    return Object.entries(dataObj).map(([key, value]) => {
      // Handle nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return {
          label: formatKey(key),
          value: Object.values(value).join(', ') || 'NA', // or handle nested objects differently
        };
      }

      if (key === 'resource_ref_id' && !Array.isArray(value)) {
        return {
          label: 'Resource Code',
          value: value ?? 'NA', // or handle nested objects differently
        };
      }

      if (key === 'resource_startdate' && !Array.isArray(value)) {
        return {
          label: 'Effective Date',
          value: formatDateToMMDDYYYY(value as string) || 'NA', // or handle nested objects differently
        };
      }

      if (key === 'resource_enddate' && !Array.isArray(value)) {
        return {
          label: 'End Date',
          value: formatDateToMMDDYYYY(value as string) || 'NA', // or handle nested objects differently
        };
      }

      if (key === 'total_years_in_org' && !Array.isArray(value)) {
        return {
          label: 'Total Years in Organization',
          value: value || 'NA', // or handle nested objects differently
        };
      }

      if (key === 'total_years_experience' && !Array.isArray(value)) {
        return {
          label: 'Total Years of Experience',
          value: value || 'NA', // or handle nested objects differently
        };
      }

      if (key === 'resource_fullname' && !Array.isArray(value)) {
        return {
          label: 'Name',
          value: value ?? 'NA', // or handle nested objects differently
        };
      }

      if (key === 'resource_orgname' && !Array.isArray(value)) {
        return {
          label: 'Resource Org Name',
          value: value ?? 'NA', // or handle nested objects differently
        };

        
      }

      const displayValue =
        value === null || value === '' || value === undefined
          ? 'NA'
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
    resource_code: resourceData.resource_ref_id,
    resource_fullname: resourceData.resource_fullname,
    resource_type: resourceData.resource_type,
    resource_orgname: resourceData.resource_orgname,
    status: resourceData.resource_status,
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
    },
    {
      resource_effective_from: formatDateToMMDDYYYY,
      resource_end_date: formatDateToMMDDYYYY,
    }
  );

  const description = CreateSectionData({
    comments: resourceData.comments,
  });
  const auditLogSection = CreateSectionData({
    record_id: resourceData.rid,
    resource_id: resourceData.r_number,
    Created_On: formatDateToMMDDYYYYWithTime(resourceData.created_datetime),
    Created_By: resourceData.created_by,
    Updated_On: formatDateToMMDDYYYYWithTime(resourceData.modified_datetime),
    Updated_By: resourceData.modified_by,
  });

  return (
    <div className='max-w-6xl p-6'>
      <DetailsSection title='Basic Information' data={basicInfo} />
      <DetailsSection
        title='Location and Currency Information'
        data={locationInfo}
      />
      <DetailsSection title='Employment Details' data={employmentDetails} />
      <DetailsSection title='Comments' data={description} />
      <DetailsSection title='Audit Information' data={auditLogSection} />
    </div>
  );
};

export default ResourceDetails;
