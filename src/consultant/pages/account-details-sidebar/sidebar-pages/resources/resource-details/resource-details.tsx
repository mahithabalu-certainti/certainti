/* eslint-disable @typescript-eslint/no-explicit-any */
import { CircularProgress, Typography } from '@mui/material';
import React from 'react';
import { useResourceDetail } from '../../../../../services/resource-details';
import { CreateSectionData } from '../../../../../types';

interface ResourceDetailsProps {
  resourceDetails: {
    rid: string;
  };
  accountId: string;
}

interface DetailItem {
  label: string;
  value: React.ReactNode;
}

const formatDateToMMDDYYYY = (dateString?: string | null): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

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
    if (typeof value === 'string' && value.toLowerCase() === 'active') {
      return <span className='text-green-600'>Active</span>;
    }
    return (
      <span className='font-light text-sm text-[#2D3E4F]'>{value || '-'}</span>
    );
  };

  return (
    <div className='mb-8'>
      <Typography variant='h6' className='pb-2 mb-4 text-base font-semibold'>
        {title}
      </Typography>
      <div className='grid grid-cols-1 text-sm md:grid-cols-2 gap-x-6'>
        {/* Left column */}
        <div>
          {leftColumn.map((item, index) => (
            <div key={`left-${index}`} className='grid grid-cols-2 py-2'>
              <div className='text-right pr-4 font-normal text-[#65686F]'>
                {item.label}
              </div>
              <div>{renderValue(item.value)}</div>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div>
          {rightColumn.map((item, index) => (
            <div key={`right-${index}`} className='grid grid-cols-2 py-2'>
              <div className='text-right pr-4 text-[#65686F] font-normal'>
                {item.label}
              </div>
              <div>{renderValue(item.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ResourceDetails: React.FC<ResourceDetailsProps> = ({
  resourceDetails,
  accountId,
}) => {
  const {
    data: resource,
    isLoading,
    error,
  } = useResourceDetail(resourceDetails.rid, accountId);

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
          value: Object.values(value).join(', ') || 'NA', // or handle nested objects differently
        };
      }

      if (key === 'resource_startdate' && !Array.isArray(value)) {
        return {
          label: 'Resource Effective From',
          value: formatDateToMMDDYYYY(value as string) || 'NA', // or handle nested objects differently
        };
      }

      if (key === 'resource_enddate' && !Array.isArray(value)) {
        return {
          label: 'Resource End Date',
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
          label: 'Resource Full Name',
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
    resource_ref_id: resourceData.resource_ref_id,
    resource_number: resourceData.r_number,
    resource_fullname: resourceData.resource_fullname,
    resource_type: resourceData.resource_type,
    resource_orgname: resourceData.resource_orgname,
    resource_status: resourceData.resource_status,
  });

  const locationInfo = CreateSectionData({
    country: resourceData?.country_name,
    region: resourceData.state_name,
    city: resourceData.city_name,
  });

  const employmentDetails = CreateSectionData(
    {
      resource_startdate: resourceData.resource_startdate,
      resource_enddate: resourceData.resource_enddate,
      total_years_experience: resourceData.total_years_experience,
      designation: resourceData.designation,
      total_years_in_org: resourceData.total_years_in_org,
    },
    {
      resource_effective_from: formatDateToMMDDYYYY,
      resource_end_date: formatDateToMMDDYYYY,
    }
  );

  const description = CreateSectionData({
    comments: resourceData.comments,
  });

  return (
    <div className='max-w-6xl p-6 mx-auto'>
      <DetailsSection title='Basic Information' data={basicInfo} />
      <DetailsSection
        title='Location and Currency Information'
        data={locationInfo}
      />
      <DetailsSection title='Employment Details' data={employmentDetails} />
      <DetailsSection title='Description' data={description} />
    </div>
  );
};

export default ResourceDetails;
