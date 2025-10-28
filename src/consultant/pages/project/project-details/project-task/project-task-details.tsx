import { Typography } from '@mui/material';
import { ProjectTaskDetailsType } from '../../../../types/project-task';
import {
  applyHidePermission,
  costDisplay,
  formatDateToYYYYMMDDWithTime,
  getDateFormat,
  valueDisplay,
} from '../../../../../common-utils';
import DetailsTable from '../../../../../components/details-section/details-table';
import { useMemo } from 'react';
import { AllPermissions } from '../../../../../common-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { getDetailsAttachmentColumns } from '../../../../../components/details-section/helpers';
import DetailsSectionSkeleton from '../../../../../components/skeleton-component/detailsskeleton';
import DetailsSection from '../../../../../components/details-section/details';

interface ErrorProps {
  message?: string;
}
interface ResourceDetailsProps {
  projectTaskData?: ProjectTaskDetailsType;
  isDetailsLoading?: boolean;
  detailsError?: ErrorProps | null | undefined;
}

interface DetailItem {
  key?: string;
  label: string;
  value: React.ReactNode;
}

const ProjectTaskDetails: React.FC<ResourceDetailsProps> = ({
  projectTaskData,
  isDetailsLoading,
  detailsError,
}) => {
  const { permission } = useSelector((state: RootState) => state.permission);
  const projectViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.PROJECTS_TASK_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMapTaskTableColumn = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);
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

  if (isDetailsLoading) {
    return <DetailsSectionSkeleton className='p-0 m-0' />;
  }

  if (detailsError) {
    return (
      <div className='flex flex-col items-center justify-center h-64 p-4'>
        <Typography variant='h6' color='error' className='mb-2'>
          Error loading task details
        </Typography>
        <Typography
          variant='body2'
          color='textSecondary'
          className='text-center'
        >
          {detailsError?.message ||
            'Failed to fetch task details. Please try again later.'}
        </Typography>
      </div>
    );
  }

  if (!projectTaskData) {
    return (
      <div className='flex flex-col items-center justify-center h-64 p-4'>
        <Typography variant='h6' color='textSecondary'>
          No task details available
        </Typography>
      </div>
    );
  }

  const basicInfo: DetailItem[] = [
    {
      key: 'resource_code',
      label: 'Resource Code',
      value: projectTaskData.resource_code,
    },
    {
      key: 'resource_name',
      label: 'Resource Name',
      value: projectTaskData.resource_name,
    },
    {
      key: 'resource_type_name',
      label: 'Resource Type',
      value: projectTaskData.resource_type_name,
    },
    {
      key: 'resource_role',
      label: 'Resource Role',
      value: projectTaskData.resource_role,
    },
    {
      key: 'status_action',
      label: 'Status',
      value: projectTaskData.status_name,
    },
  ];

  const projectDetails: DetailItem[] = [
    {
      key: 'start_date',
      label: 'Start Date',
      value: getDateFormat(projectTaskData.start_date ?? undefined),
    },
    {
      key: 'end_date',
      label: 'End Date',
      value: getDateFormat(projectTaskData.end_date ?? undefined),
    },
    {
      key: 'total_cost_pro_task',
      label: 'Cost',
      value: costDisplay(
        projectTaskData.total_cost_pro_task,
        projectTaskData?.currency_symbol
      ),
    },
    {
      key: 'total_hours_pro_task',
      label: 'Effort',
      value: valueDisplay(projectTaskData.total_hours_pro_task),
    },
  ];

  const auditInfo: DetailItem[] = [
    { key: 'rid', label: 'Record ID', value: projectTaskData.rid },
    {
      key: 'r_number',
      label: 'Project Task ID',
      value: projectTaskData.r_number,
    },
    {
      key: 'created_datetime',
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(
        projectTaskData.created_datetime ?? undefined
      ),
    },
    {
      key: 'created_by',
      label: 'Created By',
      value: projectTaskData.created_by,
    },
    {
      key: 'modified_datetime',
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(
        projectTaskData.modified_datetime ?? undefined
      ),
    },
    {
      key: 'modified_by',
      label: 'Updated By',
      value: projectTaskData.modified_by,
    },
  ];
  const description: DetailItem[] = [
    { key: 'comments', label: 'Comments', value: projectTaskData.comments },
  ];
  const IdentityDetails = applyHidePermission(
    basicInfo,
    permissionMapTaskTableColumn
  );
  const descriptionDetails = applyHidePermission(
    description,
    permissionMapTaskTableColumn
  );
  const projectTaskDetails = applyHidePermission(
    projectDetails,
    permissionMapTaskTableColumn
  );
  const auditInfoDetails = applyHidePermission(
    auditInfo,
    permissionMapTaskTableColumn
  );

  return (
    <div>
      <DetailsSection
        title='Basic Information'
        data={IdentityDetails as DetailItem[]}
        customStyle='pt-0 mt-0'
        isAudit={true}
      />
      <DetailsSection
        title='Task Details'
        data={projectTaskDetails as DetailItem[]}
        isAudit={true}
      />
      <DetailsSection
        title='Comments'
        data={descriptionDetails as DetailItem[]}
      />
      {projectTaskData?.attachment &&
        projectTaskData?.attachment.length > 0 && (
          <DetailsTable
            title='Attachments'
            columns={attachmentColumns}
            data={projectTaskData.attachment || []}
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

export default ProjectTaskDetails;
