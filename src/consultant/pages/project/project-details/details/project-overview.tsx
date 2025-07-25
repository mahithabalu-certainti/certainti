import { Typography } from '@mui/material';
import { SxProps } from '@mui/material';
import React, { useMemo } from 'react';
import { LeftArrowIcon } from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';
import { Theme } from '@emotion/react';
import { NewProjectData } from '../../../../types/project';
import { KeyContactProps } from '../../../account-details/utils';
import {
  applyHidePermission,
  checkPermission,
  costDisplay,
  getDateFormat,
} from '../../../../../common-utils';
import DetailsSection from '../../../../../components/details-section/details';
import KeyContactSection from '../../../../../components/details-section/keyContact';
import DetailsSectionSkeleton from '../../../../../components/skeleton-component/detailsskeleton';
import DetailsTable from '../../../../../components/details-section/details-table';
import { AllPermissions, Permissions } from '../../../../../common-service';
import { getDetailsAttachmentColumns } from '../../../../../components/details-section/helpers';
interface DetailItem {
  key?: string;
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
  isKeyContactAvailable?: boolean;
  permission: Permissions[];
}

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
  isKeyContactAvailable,
  permission,
}) => {
  const projectViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);
  const keycontactVisable =
    !permissionMap['key_contacts']?.read &&
    !permissionMap['key_contacts']?.edit;
  const commentsHide =
    !permissionMap['comments']?.read && !permissionMap['comments']?.edit;

  const isAttachmentViewEnable = checkPermission(
    permission || [],
    AllPermissions.ATTACHMENT_VIEW_EDIT
  );

  const attachmentViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ATTACHMENT_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const attachmentPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    attachmentViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [attachmentViewEditFields]);

  const attachmentColumns = getDetailsAttachmentColumns(
    attachmentPermissionMap
  );

  const basicInfo: DetailItem[] = [
    {
      key: 'project_code',
      label: 'Project Code',
      value: projectDetails?.project_code,
    },
    {
      key: 'fiscal_year',
      label: 'Fiscal Year',
      value: projectDetails?.fiscal_year,
    },
    { key: 'project_name', label: 'Name', value: projectDetails?.project_name },
    {
      key: 'project_type_rid',
      label: 'Project Type',
      value: projectDetails?.project_type_name,
    },
    {
      key: 'project_startdate',
      label: 'Start Date',
      value: getDateFormat(projectDetails?.project_startdate ?? undefined),
    },
    {
      key: 'project_enddate',
      label: 'End Date',
      value: getDateFormat(projectDetails?.project_enddate ?? undefined),
    },
    {
      key: 'project_classification_rid',
      label: 'Classification',
      value:
        projectDetails?.project_classification_other ||
        projectDetails?.classification_name,
    },

    {
      key: 'project_group',
      label: 'Project Group',
      value: projectDetails?.project_group,
    },
    {
      key: 'project_client_group',
      label: 'Client Group',
      value: projectDetails?.project_client_group,
    },
    {
      key: 'program_name',
      label: 'Program Name',
      value: projectDetails?.program_name,
    },
    {
      key: 'industry_rid',
      label: 'Industry',
      value: projectDetails?.industry_name || projectDetails?.industry_rid_name,
    },
    { key: 'status_rid', label: 'Status', value: projectDetails?.status_name },
  ];

  const locationInfo: DetailItem[] = [
    { key: 'country', label: 'Country', value: projectDetails?.country_name },
    { key: 'region', label: 'Region', value: projectDetails?.region_name },
    {
      key: 'currency',
      label: 'Currency',
      value: projectDetails?.currency_name,
    },
  ];

  const keyContactsList: trasnformedKeyContacts[] | undefined =
    projectDetails?.keyContact?.map((contact: KeyContactProps) => ({
      keyContactId: contact.r_number,
      keyContactName: contact.key_contact_name,
      keyContactRole: contact.role_name,
      keyContactEmail: contact.key_contact_email,
      isPrimaryContact: contact.is_primary_contact,
      includeInCommnunications: contact.include_in_communication,
      keyContactStatus: contact.status_name,
    }));
  const financialInfo: DetailItem[] = [
    {
      key: 'total_fte',
      label: 'Total FTE Count',
      value: projectDetails?.total_fte,
    },
    {
      key: 'total_subcon',
      label: 'Total Sub Con Count',
      value: projectDetails?.total_subcon,
    },
    { label: '', value: 'empty' },
    {
      key: 'total_effort_fte',
      label: 'Total FTE Effort',
      value: projectDetails?.total_effort_fte,
    },
    {
      key: 'total_effort_subcon',
      label: 'Total Sub Con Effort',
      value: projectDetails?.total_effort_subcon,
    },
    {
      key: 'total_effort',
      label: 'Total Effort in Hrs',
      value: projectDetails?.total_effort,
    },
    {
      key: 'total_cost_fte',
      label: 'Total FTE Cost',
      value: costDisplay(
        projectDetails?.total_cost_fte,
        projectDetails?.currency_symbol
      ),
    },
    {
      key: 'total_cost_subcon',
      label: 'Total Sub Con Cost',
      value: costDisplay(
        projectDetails?.total_cost_subcon,
        projectDetails?.currency_symbol
      ),
    },

    {
      key: 'total_cost_nonlabor',
      label: 'Total Non Labor Cost',
      value: costDisplay(
        projectDetails?.total_cost_nonlabor,
        projectDetails?.currency_symbol
      ),
    },
    {
      key: 'total_cost',
      label: 'Total Cost',
      value: costDisplay(
        projectDetails?.total_cost,
        projectDetails?.currency_symbol
      ),
    },
  ];

  const auditInfo: DetailItem[] = [
    { key: 'rid', label: 'Record ID', value: projectDetails?.rid },
    { key: 'r_number', label: 'Project ID', value: projectDetails?.r_number },
    {
      key: 'created_datetime',
      label: 'Created On',
      value: projectDetails?.created_datetime,
    },
    {
      key: 'created_by',
      label: 'Created By',
      value: projectDetails?.created_name,
    },
    {
      key: 'modified_datetime',
      label: 'Updated On',
      value: projectDetails?.modified_datetime,
    },
    {
      key: 'modified_by',
      label: 'Updated By',
      value: projectDetails?.modified_name,
    },
  ];
  const comments: DetailItem[] = [
    { key: 'comments', label: 'Comments', value: projectDetails?.comments },
  ];

  const description: DetailItem[] = [
    {
      key: 'project_description',
      label: 'description',
      value: projectDetails?.project_description,
    },
  ];

  const IdentityDetails = applyHidePermission(basicInfo, permissionMap);
  const descriptionDetails = applyHidePermission(description, permissionMap);
  const locationInfoDetails = applyHidePermission(locationInfo, permissionMap);
  const financialInfoDetails = applyHidePermission(
    financialInfo,
    permissionMap
  );

  const commentsDetails = applyHidePermission(comments, permissionMap);
  const auditInfoDetails = applyHidePermission(auditInfo, permissionMap);

  return (
    <div className='flex flex-col gap-0 border border-[#CBD6E2] rounded-[2px]'>
      <div className='flex items-center justify-between gap-4 h-[38px] py-1 px-2'>
        <div className='flex items-center gap-2'>
          {showBackArrow && (
            <div
              className='cursor-pointer  flex justify-center items-center -ml-2'
              onClick={onBackClick}
            >
              <LeftArrowIcon alt='leftArrowIcon' />
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
      {isDetailsLoading ? (
        <DetailsSectionSkeleton />
      ) : detailsError ? (
        <div className='flex flex-col items-center justify-center h-64 p-4'>
          <Typography variant='h6' color='error' className='mb-2'>
            Error loading details
          </Typography>
          <Typography
            variant='body2'
            color='textSecondary'
            className='text-center'
          >
            Failed to fetch details. Please try again later.
          </Typography>
        </div>
      ) : !projectDetails ? (
        <div className='flex flex-col items-center justify-center h-64 p-4'>
          <Typography variant='h6' color='textSecondary'>
            No details available
          </Typography>
        </div>
      ) : (
        <div>
          <DetailsSection
            title='Basic Information'
            data={IdentityDetails as DetailItem[]}
            customStyle='pt-0 mt-0'
          />
          <DetailsSection title='' data={descriptionDetails as DetailItem[]} />
          <DetailsSection
            title='Location and Currency Information'
            data={locationInfoDetails as DetailItem[]}
          />
          {isKeyContactAvailable && keyContactsList && !keycontactVisable && (
            <KeyContactSection
              title='Key Contacts List'
              data={keyContactsList || []}
            />
          )}
          <DetailsSection
            title='Financial Information'
            data={financialInfoDetails as DetailItem[]}
          />
          {!commentsHide && (
            <DetailsSection
              title='Comments'
              data={commentsDetails as DetailItem[]}
            />
          )}
          {projectDetails?.attachment &&
            projectDetails?.attachment.length > 0 &&
            isAttachmentViewEnable && (
              <DetailsTable
                title='Attachments'
                columns={attachmentColumns}
                data={projectDetails?.attachment || []}
              />
            )}
          <DetailsSection
            title='Audit Information'
            data={auditInfoDetails as DetailItem[]}
            isAudit={true}
          />
        </div>
      )}
    </div>
  );
};

export default ProjectOverview;
