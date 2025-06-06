/* eslint-disable @typescript-eslint/no-explicit-any */
import { CircularProgress, Typography } from '@mui/material';
import React from 'react';
import { useResourceDetail } from '../../../../../services/resource-details';
import { CreateSectionData } from '../../../../../types';
import { formatDateToYYYYMMDD } from '../utils';
import DetailsSection, {
  DetailItem,
} from '../../../../../../components/details-section/details';
import { formatDateToYYYYMMDDWithTime } from '../../../../../../common-utils';

interface ResourceDetailsProps {
  resourceId: string;
  accountId: string;
}

const formatKey = (key: string): string => {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
// interface AuditDetailsSectionProps {
//   title: string;
//   data: {
//     rid: string;
//     r_number: string;
//     created_datetime: string;
//     created_by: string;
//     modified_datetime: string;
//     modified_by: string | null;
//   };
// }

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
          label: 'Effective Date',
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
    resource_type: resourceData.resource_type,
    resource_orgname: resourceData.resource_orgname,
    resource_fullname:
      resourceData?.resource_name?.trim() ||
      (
        (resourceData?.resource_firstname?.trim() || '') +
        ' ' +
        (resourceData?.resource_lastname?.trim() || '')
      ).trim() ||
      ' - ',
    first_name: resourceData.resource_firstname,
    last_name: resourceData.resource_lastname,
    role: resourceData.resource_role,
    status: resourceData.resource_status,
  });

  const locationInfo = CreateSectionData({
    country: resourceData?.country_name,
    region: resourceData.region_name,
    city: resourceData.city_name,
  });

  // const employmentDetails = CreateSectionData(
  //   {
  //     resource_startdate: resourceData.resource_startdate,
  //     resource_enddate: resourceData.resource_enddate,
  //     total_years_experience: resourceData.resource_total_experience,
  //     designation: resourceData.resource_designation,
  //     total_years_in_org: resourceData.resource_total_experience_organization,
  //   }
  //   // {
  //   //   resource_effective_from: formatDateToYYYYMMDD,
  //   //   resource_end_date: formatDateToYYYYMMDD,
  //   // }
  // );

  const employmentDetails: DetailItem[] = [
    {
      label: 'Start Date',
      value: formatDateToYYYYMMDD(resourceData?.resource_startdate),
    },
    {
      label: 'End Date',
      value: formatDateToYYYYMMDD(resourceData?.resource_enddate),
    },
    {
      label: '',
      value: 'empty',
    },
    {
      label: 'Designation',
      value: resourceData?.resource_designation,
    },
    {
      label: 'Total Years of Experience',
      value: resourceData?.resource_total_experience,
    },
    {
      label: 'Total Years in Organization',
      value: resourceData?.resource_total_experience_organization,
    },
  ];

  const description = CreateSectionData({
    comments: resourceData.comments,
  });

  const auditInfo: DetailItem[] = [
    { label: 'Record ID', value: resourceData?.rid },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(resourceData?.created_datetime),
    },
    { label: 'Created By', value: resourceData?.created_by },
    { label: 'Resource Number', value: resourceData?.r_number },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(resourceData?.modified_datetime),
    },
    { label: 'Updated By', value: resourceData?.modified_by },
  ];

  return (
    <div className='max-w-6xl px-6 py-2'>
      <DetailsSection title='Basic Information' data={basicInfo} />
      <DetailsSection
        title='Location and Currency Information'
        data={locationInfo}
      />
      <DetailsSection title='Employment Details' data={employmentDetails} />
      <DetailsSection title='Comments' data={description} />
      <DetailsSection title='Audit Information' data={auditInfo} />
    </div>
  );
};

export default ResourceDetails;
