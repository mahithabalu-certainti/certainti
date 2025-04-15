/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useResourceDetail } from '../../../../../services/resource-details';

const ResourceDetails: React.FC<any> = ({ resourceDetails }) => {
  const { data: resource } = useResourceDetail(resourceDetails.rid);
  const resourceData = resource?.data?.resource;
  // Helper function to format date strings
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Helper function to format keys
  const formatKey = (key: string) => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper component to render a section with a table
  const DetailsSection: React.FC<{
    title: string;
    data: Array<{ label: string; value: React.ReactNode }>;
  }> = ({ title, data }) => {
    // Split data into two columns
    const leftColumn = [];
    const rightColumn = [];

    for (let i = 0; i < data.length; i += 2) {
      leftColumn.push(data[i]);
      if (i + 1 < data.length) {
        rightColumn.push(data[i + 1]);
      }
    }

    return (
      <div className='mb-8'>
        <h2 className='text-lg font-semibold text-gray-700 mb-4 pb-2 '>
          {title}
        </h2>
        <div className='grid grid-cols-2 gap-x-6'>
          {/* Left column */}
          <div>
            {leftColumn.map((item, index) => (
              <div key={index} className='grid grid-cols-2 py-2'>
                <div className='text-right pr-4 text-gray-600 font-medium'>
                  {item.label}
                </div>
                <div>{item.value || '-'}</div>
              </div>
            ))}
          </div>

          {/* Right column */}
          <div>
            {rightColumn.map((item, index) => (
              <div key={index} className='grid grid-cols-2 py-2'>
                <div className='text-right pr-4 text-gray-600 font-medium'>
                  {item.label}
                </div>
                <div>
                  {typeof item.value === 'string' &&
                  item.value.toLowerCase() === 'active' ? (
                    <span className='text-green-600'>Active</span>
                  ) : (
                    item.value || '-'
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Create section data in the format needed by the DetailsSection component
  const createSectionData = (dataObj: Record<string, any>) => {
    return Object.entries(dataObj).map(([key, value]) => ({
      label: formatKey(key),
      value: typeof value === 'object' ? JSON.stringify(value) : value,
    }));
  };

  // Mapping of resource properties to display labels
  const basicInfo = createSectionData({
    resource_ref_id: resourceData?.resource_ref_id,
    resource_fullname: resourceData?.resource_fullname,
    resource_type: resourceData?.resource_type,
    resource_orgname: resourceData?.resource_orgname,
    resource_firstname: resourceData?.resource_firstname,
    resource_status: resourceData?.resource_status,
    resource_middlename: resourceData?.resource_middlename,
    status: resourceData?.resource_status, // Additional field shown in the image
    resource_lastname: resourceData?.resource_lastname,
  });

  const contactInfo = createSectionData({
    resource_email: resourceData?.resource_email,
    resource_mobile: resourceData?.resource_mobile,
  });

  const locationInfo = createSectionData({
    country: resourceData?.country,
    currency: resourceData?.currency,
    region: resourceData?.region,
  });

  const financialInfo = createSectionData({
    cost_frequency: resourceData?.cost_frequency,
    cost: `$ ${resourceData?.cost}`,
    fiscal_year: resourceData?.fiscal_year,
  });

  const employmentDetails = createSectionData({
    resource_effective_from: formatDate(
      resourceData?.resource_startdate as string
    ),
    manager_name: resourceData?.manager_name,
    resource_end_date: resourceData?.resource_enddate
      ? formatDate(resourceData.resource_enddate)
      : '-',
    total_years_experience: resourceData?.total_years_experience,
    designation: resourceData?.designation,
    total_years_in_organisation: resourceData?.total_years_in_org,
    resource_role: resourceData?.resource_role,
  });

  const systemInfo = createSectionData({
    created_datetime: formatDate(resourceData?.created_datetime as string),
    created_by: resourceData?.created_by,
    modified_datetime: formatDate(resourceData?.modified_datetime as string),
    modified_by: resourceData?.modified_by || '-',
  });

  return (
    <div className='mx-auto p-6'>
      <DetailsSection title='Basic Information' data={basicInfo} />
      <DetailsSection title='Contact Information' data={contactInfo} />
      <DetailsSection
        title='Location and Currency Information'
        data={locationInfo}
      />
      <DetailsSection title='Financial Information' data={financialInfo} />
      <DetailsSection title='Employment Details' data={employmentDetails} />
      <DetailsSection title='System Information' data={systemInfo} />
    </div>
  );
};

export default ResourceDetails;
