/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
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

    const renderValue = (value: React.ReactNode, label?: string) => {
      if (typeof value === 'string') {
        const status = value.toLowerCase();
        if (status === 'active') {
          return <span className='text-[#199806]'>Active</span>;
        }
        if (status === 'inactive') {
          return <span className='text-[#f44336]'>In-Active</span>;
        }
        if (label && label.toLowerCase() === 'website') {
          return (
            <span className='font-medium text-[13px] text-[#425A76]'>
              {value ? (
                <a
                  href={value}
                  target='_blank'
                  className='underline decoration-[#425A76]'
                >
                  {value}
                </a>
              ) : (
                '-'
              )}
            </span>
          );
        }
      }
      return (
        <span className='font-medium text-[13px] text-[#425A76]'>
          {value || '-'}
        </span>
      );
    };

    return (
      <div
        className={
          title === 'Basic Information' ? 'px-6 pt-2 mt-0' : 'px-6 pt-2 mt-3'
        }
      >
        {title !== 'description' && (
          <div className='text-[15px] text-[#2D3E4F] font-bold'>{title}</div>
        )}

        <div className='text-sm my-[6px] grid gap-y-3'>
          {title === 'Comments' || title === 'description'
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
                        {renderValue(leftItem.value, leftItem.label)}
                      </div>
                    </div>

                    {/* Right column */}
                    {rightItem ? (
                      <div className='grid grid-cols-[120px_auto] sm:grid-cols-[200px_auto] gap-x-2'>
                        <div className='text-right font-semibold text-[13px] text-[#425A76] pr-1'>
                          {rightItem.label}
                        </div>
                        <div className='font-medium text-[13px] break-all overflow-hidden'>
                          {renderValue(rightItem.value, rightItem.label)}
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

  const KeyContactSection: React.FC<{
    title: string;
    data: trasnformedKeyContacts[];
  }> = ({ title, data }) => {
    return (
      <div className=''>
        <div className='flex items-center align-middle px-6 h-[30px] border-x-0 border border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#F5F9FF]'>
          {title}
        </div>
        <TableContainer
          sx={{
            'overflow-x': 'auto',
          }}
        >
          <Table>
            <TableHead
              sx={{
                '& .MuiTableCell-root': {
                  fontWeight: 700,
                  fontSize: '13px',
                  color: '#2A2A2A',
                  padding: '0px 8px',
                  height: '29px',
                  boxSizing: 'border-box',
                  backgroundColor: ' #FCFCFC',
                  borderBottom: '1px solid #CBD6E2',
                },
                '& .MuiTableCell-root:first-of-type': {
                  paddingLeft: '24px',
                },
              }}
            >
              <TableRow sx={{ height: 29 }}>
                <TableCell sx={{ minWidth: '140px' }}>ID</TableCell>
                <TableCell sx={{ minWidth: '140px' }}>Name</TableCell>
                <TableCell sx={{ minWidth: '140px' }}>Role</TableCell>
                <TableCell sx={{ minWidth: '180px' }}>Email</TableCell>
                <TableCell sx={{ minWidth: '140px' }}>
                  Is Primary Contact?
                </TableCell>
                <TableCell sx={{ minWidth: '190px' }}>
                  Include in Communications?
                </TableCell>
                <TableCell sx={{ minWidth: '140px', borderRight: 'none' }}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody
              sx={{
                '& .MuiTableCell-root': {
                  padding: '0px 8px',
                  borderBottom: '1px solid #CBD6E2',
                  // borderTop: 'none',
                  height: '30px',
                  color: '#425A76',
                  fontWeight: 500,
                  fontSize: '13px',
                  // borderRight: 'none',
                },
                '& .MuiTableRow-root > .MuiTableCell-root:first-of-type': {
                  paddingLeft: '24px',
                },
              }}
            >
              {data.map((field) => (
                <TableRow
                  sx={{
                    '& .MuiTableCell-root': {
                      height: '30px !important',
                    },
                  }}
                >
                  <TableCell sx={{ minWidth: '140px' }}>
                    {field.keyContactId || '-'}
                  </TableCell>
                  <TableCell sx={{ minWidth: '140px' }}>
                    {field.keyContactName || '-'}
                  </TableCell>
                  <TableCell sx={{ minWidth: '140px' }}>
                    {field.keyContactRole || '-'}
                  </TableCell>
                  <TableCell
                    sx={{
                      minWidth: '180px',
                      textDecoration: field.keyContactEmail
                        ? 'underline'
                        : 'none',
                      textDecorationColor: '#425A76',
                    }}
                  >
                    {field.keyContactEmail || '-'}
                  </TableCell>
                  <TableCell sx={{ minWidth: '140px' }}>
                    {field.isPrimaryContact ? 'Yes' : 'No'}
                  </TableCell>
                  <TableCell sx={{ minWidth: '190px' }}>
                    {field.includeInCommnunications ? 'Yes' : 'No'}
                  </TableCell>
                  <TableCell
                    sx={{
                      minWidth: '140px',
                      borderRight: 'none',
                      color:
                        field.keyContactStatus?.toLowerCase() === 'active'
                          ? '#3EA72F !important'
                          : '#f44336 !important',
                    }}
                  >
                    {field.keyContactStatus?.toLowerCase() === 'active'
                      ? 'Active'
                      : 'In-Active'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  };
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
  const isKeyContactAvailable =
    projectDetails?.keyContact && projectDetails.keyContact.length > 0;
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

  const basicInfo = CreateSectionData({
    project_code: projectDetails?.project_code,
    fiscal_year: projectDetails?.fiscal_year,
    name: projectDetails?.project_name,
    start_date: projectDetails?.project_startdate,
    program_name: projectDetails?.program_name,
    end_date: projectDetails?.project_enddate,
    project_group: projectDetails?.project_group,
    industry:
      projectDetails?.industry_name || projectDetails?.industry_rid_name,
    client_group: projectDetails?.project_client_group,
    classification:
      projectDetails?.project_classification_other ||
      projectDetails?.classification_name,
    project_type: projectDetails?.project_type,
    status: projectDetails?.project_status,
  });

  const locationInfo = CreateSectionData({
    country: projectDetails?.country_name,
    region: projectDetails?.region_name,
    currency: projectDetails?.currency_name,
  });

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
    { label: 'Total Effort in Hrs', value: projectDetails?.total_effort },
    {
      label: 'Total Cost',
      value: costDisplay(
        projectDetails?.total_cost,
        projectDetails?.currency_symbol
      ),
    },
    { label: 'Total FTE Effort', value: projectDetails?.total_fte_effort },
    {
      label: 'Total FTE Cost',
      value: costDisplay(
        projectDetails?.total_fte_cost,
        projectDetails?.currency_symbol
      ),
    },

    {
      label: 'Total Sub Con Effort',
      value: projectDetails?.total_sub_con_effort,
    },
    {
      label: 'Total Sub Con Cost',
      value: costDisplay(
        projectDetails?.total_sub_con_cost,
        projectDetails?.currency_symbol
      ),
    },
    { label: 'Total FTE Count', value: projectDetails?.total_fte },

    {
      label: 'Total Non Labor Cost',
      value: costDisplay(
        projectDetails?.total_non_labor_cost,
        projectDetails?.currency_symbol
      ),
    },
    {
      label: 'Total Sub Con Count',
      value: projectDetails?.total_sub_con,
    },
  ];

  const auditInfo = CreateSectionData({
    record_id: projectDetails?.rid,
    project_id: projectDetails?.r_number,
    created_on: projectDetails?.created_datetime,
    created_by: projectDetails?.created_name,
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
      label: 'Auto Send Interaction',
      value: projectDetails?.auto_send_ai_interaction ? 'Yes' : 'No',
    }, // need to Discuss
    { label: 'Blended Rate - FTE', value: projectDetails?.blended_rate_fte },

    {
      label: 'Auto Assessment',
      value: projectDetails?.auto_access_rd ? 'Yes' : 'No',
    },

    {
      label: 'Blended Rate - SubCon',
      value: projectDetails?.blended_rate_sub_con,
    },
    {
      label: 'Max Interaction Follow up',
      value: projectDetails?.max_ai_interaction,
    },
  ];
  return (
    <>
      <div className='border-t border-[1px] border-b-0 border-[#CBD6E2] rounded-tl-[2px]  rounded-tr-[2px]'>
        <div className='flex items-center  justify-between  gap-4 h-[35px] px-2  rounded-[2px]'>
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
      </div>
      <div>
        <div className='border-[1px]  border-[#CBD6E2]'>
          <DetailsSection
            title='Basic Information'
            data={basicInfo as DetailItem[]}
          />
          <DetailsSection
            title='description'
            data={description as DetailItem[]}
          />
          <DetailsSection
            title='Location and Currency Information'
            data={locationInfo as DetailItem[]}
          />
          {isKeyContactAvailable && keyContactsList && (
            <KeyContactSection
              title='Key Contacts List'
              data={keyContactsList}
            />
          )}
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
    </>
  );
};

export default ProjectOverview;
