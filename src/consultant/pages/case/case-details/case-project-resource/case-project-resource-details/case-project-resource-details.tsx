import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../../../../../../store/store';
import { AllPermissions } from '../../../../../../common-service';
import {
  applyHidePermission,
  checkPermission,
  formatDateToYYYYMMDDWithTime,
  getDateFormat,
} from '../../../../../../common-utils';
import { getDetailsAttachmentColumns } from '../../../../../../components/details-section/helpers';
import DetailsSectionSkeleton from '../../../../../../components/skeleton-component/detailsskeleton';
import { Typography } from '@mui/material';
import DetailsSection, {
  DetailItem,
} from '../../../../../../components/details-section/details';
import DetailsTable from '../../../../../../components/details-section/details-table';
import { AttachmentList } from '../../../../../../consultant/types/attachment';

// Define resource type locally to avoid namespace conflicts
interface ResourceData {
  rid: string;
  r_number: string;
  resource_code: string;
  resource_firstname: string | null;
  resource_lastname: string | null;
  resource_name: string | null;
  country_name: string | null;
  region_name: string | null;
  city_name: string | null;
  resource_startdate: string | null;
  resource_enddate: string | null;
  resource_total_experience: string | number | null;
  resource_total_experience_organization: string | number | null;
  comments: string | null;
  created_by: string;
  modified_by: string;
  created_datetime: string;
  modified_datetime: string;
  attachment: AttachmentList[];
}

interface ResourceDetailsProps {
  resource: ResourceData | null;
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
        (item) => item.name === AllPermissions.ACCOUNT_RESOURCES_VIEW_EDIT
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
      label: 'First Name',
      value: resourceData.resource_firstname,
      key: 'resource_firstname',
    },
    {
      label: 'Last Name',
      value: resourceData.resource_lastname,
      key: 'resource_lastname',
    },
  ];

  const locationInfo: DetailItem[] = [
    { label: 'Country', value: resourceData.country_name, key: 'country_rid' },
    { label: 'Region', value: resourceData.region_name, key: 'region_rid' },
    { label: 'City', value: resourceData.city_name, key: 'city_rid' },
  ];

  const employmentDetails: DetailItem[] = [
    {
      label: 'Effective Date',
      value: getDateFormat(resourceData.resource_startdate ?? undefined),
      key: 'resource_startdate',
    },
    {
      label: 'End Date',
      value: getDateFormat(resourceData.resource_enddate ?? undefined),
      key: 'resource_enddate',
    },
    {
      label: '',
      value: 'empty',
    },
    {
      label: 'Total Years of Experience',
      value: resourceData.resource_total_experience,
      key: 'resource_total_experience',
    },
    {
      label: 'Total Years in the Organisation',
      value: resourceData.resource_total_experience_organization,
      key: 'resource_total_experience_organization',
    },
  ];

  const description: DetailItem[] = [
    {
      label: 'Comments',
      value: resourceData.comments,
      key: 'comments',
    },
  ];

  const auditInfo: DetailItem[] = [
    { label: 'Record ID', value: resourceData.rid, key: 'rid' },
    {
      label: 'Resource ID',
      value: resourceData.r_number,
      key: 'r_number',
    },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(resourceData.created_datetime),
      key: 'created_datetime',
    },
    { label: 'Created By', value: resourceData.created_by, key: 'created_by' },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(resourceData.modified_datetime),
      key: 'modified_datetime',
    },
    {
      label: 'Updated By',
      value: resourceData.modified_by,
      key: 'modified_by',
    },
  ];
  const basicDetails = applyHidePermission(basicInfo, resourcePermissionMap);
  const locationDetails = applyHidePermission(
    locationInfo,
    resourcePermissionMap
  );
  const employmentDetailsInfo = applyHidePermission(
    employmentDetails,
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
      <DetailsSection title='Employment Details' data={employmentDetailsInfo} />
      <DetailsSection title='Comments' data={descriptionDetails} />
      {resourceData.attachment &&
        resourceData.attachment.length > 0 &&
        isAttachmentViewEnable && (
          <DetailsTable
            title='Attachments'
            columns={attachmentColumns}
            data={resourceData.attachment || []}
          />
        )}
      <DetailsSection
        title='Audit Information'
        data={auditInfoDetails}
        isAudit={true}
      />
    </div>
  );
};

export default ResourceDetails;
