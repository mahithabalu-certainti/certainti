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

const AuditDetailsSection: React.FC<AuditDetailsSectionProps> = ({ title, data }) => {
  // Define audit items with their columns
  const auditItems: AuditItem[] = [
    { label: 'Record ID', value: data.rid, column: 1 },
    { 
      label: 'Created On', 
      value: formatDateToMMDDYYYYWithTime(data.created_datetime), 
      column: 1 
    },
    { 
      label: 'Updated On', 
      value: formatDateToMMDDYYYYWithTime(data.modified_datetime), 
      column: 1 
    },
    { label: 'Resource ID', value: data.r_number, column: 2 },
    { label: 'Created By', value: data.created_by, column: 2 },
    { label: 'Updated By', value: data.modified_by, column: 2 },
  ];

  // Group items by column
  const columnOneItems = auditItems.filter(item => item.column === 1);
  const columnTwoItems = auditItems.filter(item => item.column === 2);
  
  return (
    <div className="mt-6">
      <div className="text-[16px] text-[#2D3E4F] font-semibold">
        {title}
      </div>
      
      <div className="grid grid-cols-1 text-sm md:grid-cols-2 my-1.5 gap-x-6">
        {/* First Column */}
        <div>
          {columnOneItems.map((item, index) => (
            <AuditItemRow key={`col1-${index}`} item={item} />
          ))}
        </div>
        
        {/* Second Column */}
        <div>
          {/* First row - Resource Id */}
          <AuditItemRow item={columnTwoItems[0]} />
          
          {/* Second row - Empty space for alignment */}
          <div>&nbsp;</div>
          
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
    <div className="grid grid-cols-2 py-2">
      <div className="text-right font-normal text-[14px] text-[#65686F] pr-4 min-w-[120px] break-words">
        {item.label}
      </div>
      <div className="font-light text-[14px] pl-2 break-words">
        <span className="font-light text-[14px] text-[#2D3E4F]">
          {item.value || 'NA'}
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
      <span className='font-light text-[14px] text-[#2D3E4F]'>
        {value || 'NA'}
      </span>
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
    frist_name: resourceData.resource_firstname,
    last_name: resourceData.resource_lastname,
    resource_orgname: resourceData.resource_orgname,
    role: resourceData.resource_role,
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

  return (
    <div className='max-w-6xl p-6'>
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
