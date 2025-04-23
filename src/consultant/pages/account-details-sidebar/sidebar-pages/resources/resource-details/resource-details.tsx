/* eslint-disable @typescript-eslint/no-explicit-any */
import { CircularProgress, Typography } from '@mui/material';
import React from 'react';
import { useResourceDetail } from '../../../../../services/resource-details';
import { ResourceDetailsTypes } from '../../../../../types';

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

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch {
    return '-';
  }
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
    return value || '-';
  };

  return (
    <div className='mb-8'>
      <Typography variant='h6' className='mb-4 pb-2 border-b border-gray-200'>
        {title}
      </Typography>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6'>
        {/* Left column */}
        <div>
          {leftColumn.map((item, index) => (
            <div key={`left-${index}`} className='grid grid-cols-2 py-2'>
              <div className='text-right pr-4 text-gray-600 font-medium'>
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
              <div className='text-right pr-4 text-gray-600 font-medium'>
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

  const createSectionData = (
    dataObj: Partial<ResourceDetailsTypes>,
    customMappings?: Record<string, (val: any) => React.ReactNode>
  ): DetailItem[] => {
    return Object.entries(dataObj)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => ({
        label: formatKey(key),
        value: customMappings?.[key] ? customMappings[key](value) : value,
      }));
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <CircularProgress />
        <Typography variant='body1' className='ml-4'>
          Loading resource details...
        </Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col justify-center items-center h-64 p-4'>
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
      <div className='flex flex-col justify-center items-center h-64 p-4'>
        <Typography variant='h6' color='textSecondary'>
          No resource details available
        </Typography>
      </div>
    );
  }

  // Section data with custom formatting where needed
  const basicInfo = createSectionData({
    resource_ref_id: resourceData.resource_ref_id,
    resource_fullname: resourceData.resource_fullname,
    resource_type: resourceData.resource_type,
    resource_orgname: resourceData.resource_orgname,
    resource_status: resourceData.resource_status,
    fiscal_year: resourceData.fiscal_year,
  });

  const locationInfo = createSectionData({
    country: resourceData.country,
    state: resourceData.state,
    city: resourceData.city,
  });

  const employmentDetails = createSectionData(
    {
      resource_startdate: resourceData.resource_startdate,
      resource_enddate: resourceData.resource_enddate,
      total_years_experience: resourceData.total_years_experience,
      designation: resourceData.designation,
      total_years_in_org: resourceData.total_years_in_org,
      resource_role: resourceData.resource_role,
    },
    {
      resource_effective_from: formatDate,
      resource_end_date: formatDate,
    }
  );

  const systemInfo = createSectionData(
    {
      created_datetime: resourceData.created_datetime,
      created_by: resourceData.created_by,
      modified_datetime: resourceData.modified_datetime,
      modified_by: resourceData.modified_by,
    },
    {
      created_datetime: formatDate,
      modified_datetime: formatDate,
    }
  );

  return (
    <div className='mx-auto p-6 max-w-6xl'>
      <DetailsSection title='Basic Information' data={basicInfo} />
      <DetailsSection
        title='Location and Currency Information'
        data={locationInfo}
      />
      <DetailsSection title='Employment Details' data={employmentDetails} />
      <DetailsSection title='System Information' data={systemInfo} />
    </div>
  );
};

export default ResourceDetails;
