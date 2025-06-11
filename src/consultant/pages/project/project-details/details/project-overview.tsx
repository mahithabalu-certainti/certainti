/* eslint-disable @typescript-eslint/no-explicit-any */
import { CircularProgress, Typography } from '@mui/material';
import { SxProps } from '@mui/material';
import React from 'react';
import { leftArrowIcon } from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';
import { Theme } from '@emotion/react';
import { NewProjectData } from '../../../../types/project';
import {
  formatDateToYYYYMMDD,
  formatDateToYYYYMMDDWithTime,
} from '../../../account-details-sidebar/sidebar-pages/resources/utils';
import { KeyContactProps } from '../../../account-details/utils';
import { costDisplay } from '../../../../../common-utils';
import DetailsSection from '../../../../../components/details-section/details';
import KeyContactSection from '../../../../../components/details-section/keyContact';
interface DetailItem {
  label: string;
  value: React.ReactNode;
}
interface trasnformedKeyContacts {
  keyContactId?: string | undefined;
  keyContactName?: string | undefined;
  keyContactRole?: string | undefined;
  keyContactEmail?: string | undefined;
  isPrimaryContact?: boolean | undefined;
  includeInCommnunications?: boolean | undefined;
  keyContactStatus?: string | undefined;
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
    hide?: boolean;
  }[];
  toggleViewMode?: () => void;
  showBackArrow?: boolean;
  onBackClick?: () => void;
  projectDetails?: NewProjectData | null;
  isDetailsLoading?: boolean;
  detailsError?: boolean;
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
  isDetailsLoading,
  detailsError,
}) => {
  if (isDetailsLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <CircularProgress />
        <Typography variant='body1' className='ml-4'>
          Loading details...
        </Typography>
      </div>
    );
  }

  if (detailsError) {
    return (
      <div className='flex flex-col items-center justify-center h-64 p-4'>
        <Typography variant='h6' color='error' className='mb-2'>
          Error loading details
        </Typography>
        <Typography
          variant='body2'
          color='textSecondary'
          className='text-center'
        >
          {'Failed to fetch details. Please try again later.'}
        </Typography>
      </div>
    );
  }

  if (!projectDetails) {
    return (
      <div className='flex flex-col items-center justify-center h-64 p-4'>
        <Typography variant='h6' color='textSecondary'>
          No details available
        </Typography>
      </div>
    );
  }

  const CreateSectionData = (
    dataObj: Partial<NewProjectData>,
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
      if (
        (key === 'created_on' || key === 'updated_on') &&
        typeof value === 'string'
      ) {
        return {
          label: formatKey(key),
          value: formatDateToYYYYMMDDWithTime(value), // custom formatter
        };
      }
      if (
        (key === 'project_enddate' || key === 'project_startdate') &&
        typeof value === 'string'
      ) {
        return {
          label: formatKey(key),
          value: formatDateToYYYYMMDD(value), // custom formatter
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

  const basicInfo: DetailItem[] = [
    { label: 'Project Code', value: projectDetails?.project_code },
    { label: 'Fiscal Year', value: projectDetails?.fiscal_year },
    { label: 'Name', value: projectDetails?.project_name },
    { label: 'Project Type', value: projectDetails?.project_type },
    { label: 'Start Date', value: projectDetails?.project_startdate },
    { label: 'End Date', value: projectDetails?.project_enddate },
    {
      label: 'Classification',
      value:
        projectDetails?.project_classification_other ||
        projectDetails?.classification_name,
    },

    { label: 'Project Group', value: projectDetails?.project_group },
    { label: 'Client Group', value: projectDetails?.project_client_group },
    { label: 'Program Name', value: projectDetails?.program_name },
    {
      label: 'Industry',
      value: projectDetails?.industry_name || projectDetails?.industry_rid_name,
    },
    { label: 'Status', value: projectDetails?.project_status },
  ];

  const locationInfo: DetailItem[] = [
    { label: 'Country', value: projectDetails?.country_name },
    { label: 'Region', value: projectDetails?.region_name },
    { label: 'Currency', value: projectDetails?.currency_name },
  ];

  const keyContactsList: trasnformedKeyContacts[] | undefined =
    projectDetails?.keyContact?.map((contact: KeyContactProps) => ({
      keyContactId: contact.r_number,
      keyContactName: contact.key_contact_name,
      keyContactRole: contact.role_name,
      keyContactEmail: contact.key_contact_email,
      isPrimaryContact: contact.is_primary_contact,
      includeInCommnunications: contact.include_in_communication,
      keyContactStatus: contact.status,
    }));
  const financialInfo: DetailItem[] = [
    { label: 'Total FTE Count', value: projectDetails?.total_fte },
    {
      label: 'Total Sub Con Count',
      value: projectDetails?.total_sub_con,
    },
    { label: '', value: 'empty' },
    { label: 'Total FTE Effort', value: projectDetails?.total_fte_effort },
    {
      label: 'Total Sub Con Effort',
      value: projectDetails?.total_sub_con_effort,
    },
    { label: 'Total Effort in Hrs', value: projectDetails?.total_effort },
    {
      label: 'Total FTE Cost',
      value: costDisplay(
        projectDetails?.total_fte_cost,
        projectDetails?.currency_symbol
      ),
    },
    {
      label: 'Total Sub Con Cost',
      value: costDisplay(
        projectDetails?.total_sub_con_cost,
        projectDetails?.currency_symbol
      ),
    },

    {
      label: 'Total Non Labor Cost',
      value: costDisplay(
        projectDetails?.total_non_labor_cost,
        projectDetails?.currency_symbol
      ),
    },
    {
      label: 'Total Cost',
      value: costDisplay(
        projectDetails?.total_cost,
        projectDetails?.currency_symbol
      ),
    },
  ];

  const auditInfo = CreateSectionData({
    record_id: projectDetails?.rid,
    created_on: projectDetails?.created_datetime,
    created_by: projectDetails?.created_name,
    project_id: projectDetails?.r_number,
    updated_on: projectDetails?.modified_datetime,
    Updated_By: projectDetails?.modified_name,
  });
  // const settingInfo = CreateSectionData({
  //   auto_send_ai_interaction: projectDetails?.auto_send_ai_interaction
  //     ? 'Yes'
  //     : 'No',
  //   blended_rate_FTE: projectDetails?.blended_rate_fte,
  //   auto_assessment: projectDetails?.auto_access_rd ? 'Yes' : 'No',
  //   blended_rate_subCon: projectDetails?.blended_rate_sub_con,
  //   max_ai_interaction_follow_up: projectDetails?.max_ai_interaction,
  // });
  const comments = CreateSectionData({
    comments: projectDetails?.comments,
  });
  const description = CreateSectionData({
    description: projectDetails?.project_description,
  });

  const settingInfo: DetailItem[] = [
    {
      label: 'Blended Rate - FTE',
      value: costDisplay(
        projectDetails?.blended_rate_fte,
        projectDetails?.currency_symbol
      ),
    },
    {
      label: 'Blended Rate - SubCon',
      value: costDisplay(
        projectDetails?.blended_rate_sub_con,
        projectDetails?.currency_symbol
      ),
    },
    { label: '', value: 'empty' },
    {
      label: 'Auto Assessment',
      value: projectDetails?.auto_access_rd ? 'Yes' : 'No',
    },
    {
      label: 'Auto Send Interaction',
      value: projectDetails?.auto_send_ai_interaction ? 'Yes' : 'No',
    }, // need to Discuss

    {
      label: 'Max Interaction Follow up',
      value: projectDetails?.max_ai_interaction,
    },
  ];
  return (
    <div className='flex flex-col gap-0 border border-[#CBD6E2] rounded-[2px]'>
      <div className='flex items-center justify-between gap-4 h-[38px] py-1 px-2'>
        <div className='flex items-center gap-2'>
          {showBackArrow && (
            <div
              className='cursor-pointer  flex justify-center items-center -ml-2'
              onClick={onBackClick}
            >
              <img src={leftArrowIcon} alt='leftArrowIcon' />
            </div>
          )}
          {titleIcon && (
            <div className='text-[13px] text-[#2D3E4F] font-semibold'>
              {titleIcon}
            </div>
          )}
          <h1 className='text-[14px] font-medium text-[#2D3E4F]'>{title}</h1>
        </div>

        <div className='flex items-center gap-2'>
          <div className='flex gap-2'>
            {headerButtons?.map((button, index) => {
              if (button.hide) return null;
              return (
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
              );
            })}
          </div>
        </div>
      </div>
      <div>
        <DetailsSection
          title='Basic Information'
          data={basicInfo as DetailItem[]}
          customStyle='pt-0 mt-0'
        />
        <DetailsSection title='' data={description as DetailItem[]} />
        <DetailsSection
          title='Location and Currency Information'
          data={locationInfo as DetailItem[]}
        />
        {/* {isKeyContactAvailable && keyContactsList && ( */}
        <KeyContactSection
          title='Key Contacts List'
          data={keyContactsList || []}
        />
        {/* )} */}
        <DetailsSection
          title='Financial Information'
          data={financialInfo as DetailItem[]}
        />
        <DetailsSection
          title='Project Settings'
          data={settingInfo as DetailItem[]}
        />
        <DetailsSection title='Comments' data={comments as DetailItem[]} />
        <DetailsSection
          title='Audit Information'
          data={auditInfo as DetailItem[]}
        />
      </div>
    </div>
  );
};

export default ProjectOverview;
