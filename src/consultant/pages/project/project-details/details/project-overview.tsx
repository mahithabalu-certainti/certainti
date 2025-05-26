/* eslint-disable @typescript-eslint/no-explicit-any */
import { SxProps } from '@mui/material';
import React from 'react';
import { leftArrowIcon } from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';
import { Theme } from '@emotion/react';
import { NewProjectData } from '../../../../types/project';
import {
  formatDateToMMDDYYYY,
  formatDateToMMDDYYYYWithTime,
} from '../../../account-details-sidebar/sidebar-pages/resources/utils';
interface DetailItem {
  label: string;
  value: React.ReactNode;
}
interface ProjectOverviewProps {
  title: string;
  titleIcon: React.ReactNode;
  headerButtons: {
    label: string;
    variant: 'text' | 'outlined' | 'contained';
    onClick: () => void;
    sx?: SxProps<Theme>;
    disabled?: boolean;
  }[];
  toggleViewMode?: () => void;
  showBackArrow?: boolean;
  onBackClick?: () => void;
  projectDetails?: NewProjectData | null;
}

const formatKey = (key: string): string => {
  return key
    .split('_')
    .map((word) =>
      word.toLowerCase() === 'id'
        ? 'ID'
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
};
const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  title = '',
  titleIcon,
  headerButtons = [],
  toggleViewMode,
  showBackArrow = false,
  onBackClick,
  projectDetails,
}) => {
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
          {title === 'Comments'
            ? // Full-width single column layout for Comments
              data.map((item, index) => (
                <div
                  key={`comment-row-${index}`}
                  className='grid grid-cols-[120px_auto] sm:grid-cols-[200px_auto] gap-x-4 py-2'
                >
                  <div className='text-right font-normal text-[14px] text-[#65686F] pr-2'>
                    {item.label}
                  </div>
                  <div className='font-light text-[14px] break-all overflow-hidden'>
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
  const CreateSectionData = (
    dataObj: Partial<NewProjectData>,
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
      if (
        (key === 'created_on' || key === 'updated_on') &&
        typeof value === 'string'
      ) {
        return {
          label: formatKey(key),
          value: formatDateToMMDDYYYYWithTime(value), // custom formatter
        };
      }
      if (
        (key === 'project_enddate' || key === 'project_startdate') &&
        typeof value === 'string'
      ) {
        return {
          label: formatKey(key),
          value: formatDateToMMDDYYYY(value), // custom formatter
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

  const basicInfo = CreateSectionData({
    project_code: projectDetails?.project_code,
    name: projectDetails?.project_name,
    industry:
      projectDetails?.industry_name || projectDetails?.industry_rid_name,
    program_name: projectDetails?.program_name,
    fiscal_year: projectDetails?.fiscal_year,
    project_startdate: projectDetails?.project_startdate,
    project_enddate: projectDetails?.project_enddate,
    project_type: projectDetails?.project_type,
    clasification: projectDetails?.project_classification_rid,
    client_group: projectDetails?.project_client_group,
    description: projectDetails?.project_description,
    status: projectDetails?.project_status,
  });

  const locationInfo = CreateSectionData({
    country: projectDetails?.country_name,
    region: projectDetails?.region_name,
    currency: projectDetails?.currency_name,
  });
  const firstKeyContact = projectDetails?.keyContact?.[0];
  const keyContacts = CreateSectionData({
    key_contact_name: firstKeyContact?.key_contact_name ?? '',
    key_contact_role: firstKeyContact?.role_name ?? '',
    key_contact_email: firstKeyContact?.key_contact_email ?? '',
    is_primary_contact: firstKeyContact?.is_primary_contact ? 'Yes' : 'No',
    include_in_communication: firstKeyContact?.include_in_communication
      ? 'Yes'
      : 'No',
    key_contact_status: firstKeyContact?.status ?? undefined,
  });
  const fincialInfo = CreateSectionData({
    efforts_in_hrs: projectDetails?.total_effort,
    total_cost: projectDetails?.total_cost,
    total_fte_count: projectDetails?.total_fte,
    total_sub_con_count: projectDetails?.total_sub_con_count,
    total_fte_effort: projectDetails?.total_fte_effort,
    total_sub_con_effort: projectDetails?.total_sub_con_effort,
    total_fte_cost: projectDetails?.total_fte_cost,
    total_sub_con_cost: projectDetails?.total_sub_con_cost,
    total_non_labor_cost: projectDetails?.total_non_labor_cost,
  });
  const auditInfo = CreateSectionData({
    record_id: projectDetails?.rid,
    project_id: projectDetails?.r_number,
    created_on: projectDetails?.created_datetime,
    created_by: projectDetails?.created_by,
    updated_on: projectDetails?.modified_datetime,
    Updated_By: projectDetails?.modified_by,
  });
  const settingInfo = CreateSectionData({
    auto_send_ai_interaction: projectDetails?.auto_send_ai_interaction
      ? 'Yes'
      : 'No',
    max_ai_interaction: projectDetails?.max_ai_interaction,
    auto_assessment: projectDetails?.auto_access_rd ? 'Yes' : 'No',
    blended_rate_fte: projectDetails?.blended_rate_fte,
    blended_rate_sub_con: projectDetails?.blended_rate_sub_con,
  });
  const comments = CreateSectionData({
    comments: projectDetails?.comments,
  });
  return (
    <>
      <div className='border-t border-[1px] border-b-0 border-[#CBD6E2] rounded-tl-[2px] h-[50px] rounded-tr-[2px]'>
        <div className='flex items-center justify-between h-full px-4'>
          <div className='flex items-center gap-2'>
            {showBackArrow && (
              <div
                className='cursor-pointer w-[24px] h-[24px] flex justify-center items-center -ml-2'
                onClick={onBackClick}
              >
                <img
                  src={leftArrowIcon}
                  className='h-[14px]'
                  alt='leftArrowIcon'
                />
              </div>
              //   <button
              //     onClick={onBackClick}
              //     className='mr-2'
              //     aria-label='Go back'
              //   >

              //   </button>
            )}
            {titleIcon && (
              <div className='w-[24px] h-[24px] flex items-center justify-center'>
                {titleIcon}
              </div>
            )}
            <h1 className='text-[14px] font-medium text-[#2D3E4F]'>{title}</h1>
          </div>

          <div className='flex items-center gap-2'>
            <div className='flex gap-2'>
              {headerButtons?.map((button, index) => (
                <TextButton
                  key={`header-button-${index}`}
                  label={button.label}
                  onClick={
                    button.label.toLowerCase() === 'view'
                      ? toggleViewMode
                      : button.onClick
                  }
                  aria-label={button.label}
                  sx={button.sx}
                  disabled={button.disabled}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className='max-w-6xl p-6  border-[1px]  border-[#CBD6E2]'>
          <DetailsSection
            title='Basic Information'
            data={basicInfo as DetailItem[]}
          />
          <DetailsSection
            title='Location and Currency Information'
            data={locationInfo as DetailItem[]}
          />
          <DetailsSection
            title='Project Key Contacts - List'
            data={keyContacts as DetailItem[]}
          />
          <DetailsSection
            title='Project Key Contacts - List'
            data={fincialInfo as DetailItem[]}
          />
          <DetailsSection
            title='Project Settings'
            data={settingInfo as DetailItem[]}
          />
          <DetailsSection
            title='Audit Information'
            data={auditInfo as DetailItem[]}
          />
          <DetailsSection title='Comments' data={comments as DetailItem[]} />
        </div>
      </div>
    </>
  );
};

export default ProjectOverview;
