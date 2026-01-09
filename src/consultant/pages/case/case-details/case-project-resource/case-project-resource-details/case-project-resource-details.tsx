import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../../../../../../store/store';
import { AllPermissions } from '../../../../../../common-service';
import {
  applyHidePermission,
  costDisplay,
  formatDateToYYYYMMDDWithTime,
  getDateFormat,
  valueDisplay,
} from '../../../../../../common-utils';
import DetailsSectionSkeleton from '../../../../../../components/skeleton-component/detailsskeleton';
import { Typography } from '@mui/material';
import DetailsSection, {
  DetailItem,
} from '../../../../../../components/details-section/details';
import { ProjectResourceDetailData } from '../../../../../types/project-task';

interface ResourceDetailsProps {
  resource: ProjectResourceDetailData | null;
  isLoading: boolean;
  error: string | null;
}

const ResourceDetails: React.FC<ResourceDetailsProps> = ({
  resource,
  isLoading,
  error,
}) => {
  const resourceData = resource;
  const { permission } = useSelector((state: RootState) => state.permission);
  const viewResourceEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.PROJECTS_RESOURCES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const resourcePermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    viewResourceEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [viewResourceEditFields]);

  if (isLoading || !resourceData) {
    return <DetailsSectionSkeleton />;
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
          {error || 'Failed to fetch resource details. Please try again later.'}
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
    {
      label: 'Resource Name',
      value: resourceData.resource_name,
      key: 'resource_name',
    },
    {
      label: 'Resource Role',
      value: resourceData.project_resource_role,
      key: 'project_resource_role',
    },
    {
      label: 'Resource Type',
      value: resourceData.resource_type_name,
      key: 'resource_type_name',
    },
    {
      key: 'status_action',
      label: 'Status',
      value: resourceData.status_name,
    },
  ];

  const locationInfo: DetailItem[] = [
    {
      label: 'Country',
      value: resourceData.country_name,
      key: 'country_rid',
    },
    {
      label: 'Region',
      value: resourceData.region_name,
      key: 'region_rid',
    },
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
      value: valueDisplay(resourceData.total_hours_pro_res),
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
    {
      key: 'net_total_cost_pro_res',
      label: 'Net Resource Cost',
      value: costDisplay(
        resourceData.net_total_cost_pro_res,
        resourceData?.currency_symbol
      ),
    },
  ];

  const description: DetailItem[] = [
    {
      label: 'Comments',
      value: resourceData.description,
      key: 'comments',
    },
  ];

  const auditInfo: DetailItem[] = [
    {
      label: 'Record ID',
      value: resourceData.project_rid,
      //  key: 'project_rid'
    },
    {
      label: 'Project Resource ID',
      value: resourceData.r_number,
      key: 'r_number',
    },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(
        resourceData.created_datetime ?? undefined
      ),
      key: 'created_datetime',
    },
    {
      label: 'Created By',
      value: resourceData.created_name,
      key: 'created_name',
    },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(
        resourceData.modified_datetime ?? undefined
      ),
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
  const basicDetails = applyHidePermission(basicInfo, resourcePermissionMap);
  const locationDetails = applyHidePermission(
    locationInfo,
    resourcePermissionMap
  );
  const descriptionDetails = applyHidePermission(
    description,
    resourcePermissionMap
  );
  const auditInfoDetails = applyHidePermission(
    auditInfo,
    resourcePermissionMap
  );

  return (
    <div className='border border-[#CBD6E2]'>
      <DetailsSection
        title='Basic Information'
        data={basicDetails}
        customStyle='pt-0 mt-0'
      />
      <DetailsSection
        title='Location and Currency Information'
        data={locationDetails}
      />
      <DetailsSection title='Project Details' data={projectDetails} />
      <DetailsSection title='Comments' data={descriptionDetails} />
      <DetailsSection
        title='Audit Information'
        data={auditInfoDetails}
        isAudit={true}
      />
    </div>
  );
};

export default ResourceDetails;
