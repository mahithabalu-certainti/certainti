/* eslint-disable @typescript-eslint/no-explicit-any */
import { Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { ProjectResourceDetailsType } from '../../../../../types/project-resources';
import {
  applyHidePermission,
  checkPermission,
  costDisplay,
  getDateFormat,
  formatDateToYYYYMMDDWithTime,
} from '../../../../../../common-utils';
import { AllPermissions, Permissions } from '../../../../../../common-service';
import DetailsSectionSkeleton from '../../../../../../components/skeleton-component/detailsskeleton';
import DetailsTable from '../../../../../../components/details-section/details-table';
import { getDetailsAttachmentColumns } from '../../../../../../components/details-section/helpers';
import { AttachmentList } from '../../../../../types/attachment';
import DetailsSection from '../../../../../../components/details-section/details';

interface ErrorProps {
  message?: string;
}
interface ResourceDetailsProps {
  resourceData?: ProjectResourceDetailsType;
  attachment?: AttachmentList[];
  isDetailsLoading?: boolean;
  detailsError?: ErrorProps | null | undefined;
  permission?: Permissions[];
}

interface DetailItem {
  label: string;
  value: React.ReactNode;
  key?: string;
}

const ProjectResourceDetails: React.FC<ResourceDetailsProps> = ({
  resourceData,
  attachment,
  isDetailsLoading,
  detailsError,
  permission,
}) => {
  const projectViewEditFields = useMemo(
    () =>
      (permission ?? []).find(
        (item) => item.name === AllPermissions.PROJECTS_RESOURCES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);
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

  if (isDetailsLoading || !resourceData) {
    return <DetailsSectionSkeleton />;
  }

  if (detailsError) {
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
          {detailsError?.message ||
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

  const basicInfo: DetailItem[] = [
    {
      label: 'Resource Code',
      value: resourceData.resource_code,
      key: 'resource_code',
    },
    { label: 'Status', value: resourceData.status_name, key: 'status_rid' },
  ];
  const locationInfo: DetailItem[] = [
    { label: 'Country', value: resourceData.country_name, key: 'country_rid' },
    { label: 'Region', value: resourceData.region_name, key: 'region_rid' },
    {
      label: 'Currency',
      value: resourceData.currency_name,
      key: 'currency_rid',
    },
  ];
  const projectDetails: DetailItem[] = [
    {
      label: 'Resource Start Date',
      value: getDateFormat(resourceData.start_date ?? undefined),
      key: 'start_date',
    },
    {
      label: 'End Date',
      value: getDateFormat(resourceData.end_date ?? undefined),
      key: 'end_date',
    },
    {
      label: 'Effort',
      value: resourceData.total_hours_pro_res,
      key: 'total_hours_pro_res',
    },
    {
      label: 'Salary',
      value: costDisplay(resourceData.salary, resourceData?.currency_symbol),
      key: 'salary',
    },
    {
      label: 'Bonus',
      value: costDisplay(resourceData.bonus, resourceData?.currency_symbol),
      key: 'bonus',
    },
    {
      label: 'Insurance',
      value: costDisplay(resourceData.insurance, resourceData?.currency_symbol),
      key: 'insurance',
    },
    {
      label: 'Deductions',
      value: costDisplay(
        resourceData.deductions,
        resourceData?.currency_symbol
      ),
      key: 'deductions',
    },
    {
      label: 'Cost',
      value: costDisplay(
        resourceData.total_cost_pro_res,
        resourceData?.currency_symbol
      ),
      key: 'total_cost_pro_res',
    },
  ];

  const auditInfo: DetailItem[] = [
    { label: 'Record ID', value: resourceData.project_rid, key: 'project_rid' },
    {
      label: 'Project Resource ID',
      value: resourceData.r_number,
      key: 'r_number',
    },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(resourceData.created_datetime ?? undefined),
      key: 'created_datetime',
    },
    {
      label: 'Created By',
      value: resourceData.created_name,
      key: 'created_name',
    },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(resourceData.modified_datetime ?? undefined),
      key: 'modified_datetime',
    },
    {
      label: 'Updated By',
      value: resourceData.modified_name,
      key: 'modified_name',
    },
    {
      label: 'Project Resource Code',
      value: resourceData.project_resource_code,
      key: 'project_resource_code',
    },
  ];
  const description: DetailItem[] = [
    { label: 'Comments', value: resourceData.description, key: 'description' },
  ];

  const IdentityDetails = applyHidePermission(basicInfo, permissionMap);
  const descriptionDetails = applyHidePermission(description, permissionMap);
  const locationInfoDetails = applyHidePermission(locationInfo, permissionMap);

  const projectResourceDetails = applyHidePermission(
    projectDetails,
    permissionMap
  );
  const auditInfoDetails = applyHidePermission(auditInfo, permissionMap);
  return (
    <div>
      <DetailsSection
        title='Basic Information'
        data={IdentityDetails as DetailItem[]}
        customStyle='pt-0 mt-0'
      />
      <DetailsSection
        title='Location and Currency Information'
        data={locationInfoDetails as DetailItem[]}
      />
      <DetailsSection
        title='Project Details'
        data={projectResourceDetails as DetailItem[]}
      />
      <DetailsSection
        title='Comments'
        data={descriptionDetails as DetailItem[]}
      />
      {attachment && attachment.length > 0 && isAttachmentViewEnable && (
        <DetailsTable
          title='Attachments'
          columns={attachmentColumns}
          data={attachment || []}
        />
      )}
      <DetailsSection
        title='Audit Information'
        data={auditInfoDetails as DetailItem[]}
        isAudit={true}
      />
    </div>
  );
};

export default ProjectResourceDetails;
