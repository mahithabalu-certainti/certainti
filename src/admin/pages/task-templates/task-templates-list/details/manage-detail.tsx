import { Fragment } from 'react/jsx-runtime';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { TaskTemplateDetails } from '../../../../types';
import { RootState } from '../../../../../store/store';
import { AllPermissions } from '../../../../../common-service';
import DetailsSectionSkeleton from '../../../../../components/skeleton-component/detailsskeleton';
import DetailsSection, {
  DetailItem,
} from '../../../../../components/details-section/details';
import {
  applyHidePermission,
  formatDateToYYYYMMDDWithTime,
} from '../../../../../common-utils';
interface ManageDetailComponentProps {
  data: TaskTemplateDetails | undefined;
  loading: boolean;
}
export const ManageDetailComponent = ({
  data,
  loading,
}: ManageDetailComponentProps) => {
  // Map your API data to the mock data structure

  console.log('userDetail', data);
  const getValueOrDefault = (
    value?: string | number | null,
    defaultValue = '-'
  ): string => {
    return value?.toString() || defaultValue;
  };
  const { permission } = useSelector((state: RootState) => state.permission);
  const userViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.TASK_TEMPLATE_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    userViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [userViewEditFields]);

  if (loading) {
    return (
      <div>
        <DetailsSectionSkeleton />
      </div>
    );
  }

  const identityInfo: DetailItem[] = [
    {
      key: 'task_name',
      label: 'Task Name',
      value: getValueOrDefault(data?.task_name) || '-',
    },

    {
      key: 'task_type_rid',
      label: 'Task Type',
      value: getValueOrDefault(data?.task_type_name) || '-',
    },
    {
      key: 'milestone_type_rid',
      label: 'Milestone Name',
      value: getValueOrDefault(data?.milestone_name) || '-',
    },
    {
      key: 'case_team_member_role_rid',
      label: 'Assign Role',
      value: getValueOrDefault(data?.role_name) || '-',
    },
    {
      key: 'effort_in_days',
      label: 'Effort in Days',
      value: getValueOrDefault(data?.effort_in_days) || '-',
    },
    {
      key: 'priority_rid',
      label: 'Priority',
      value: getValueOrDefault(data?.priority_name) || '-',
    },
    {
      key: 'checklist',
      label: 'Checklist',
      value: getValueOrDefault(data?.checklist_name) || '-',
    },
    {
      key: 'status_rid',
      label: 'Status',
      value: getValueOrDefault(data?.status_name) || '-',
    },
  ];

  const accessInfo: DetailItem[] = [
    {
      //   key: 'profile_rid',
      label: 'Linked Type',
      value: getValueOrDefault(
        data?.workflow_connector?.relationship_type_name
      ),
    },
    {
      //   key: 'profile_rid',
      label: 'Linked Task',
      value: getValueOrDefault(
        data?.workflow_connector?.target_data?.[0]
          ?.map((item) => item.target_name)
          ?.join(', ') || '-'
      ),
    },
  ];
  const DescrptionInfo: DetailItem[] = [
    {
      key: 'task_description',
      label: 'Description',
      value: getValueOrDefault(data?.task_description),
    },
  ];
  const auditInfo: DetailItem[] = [
    {
      key: 'rid',
      label: 'Record ID',
      value: getValueOrDefault(data?.rid),
    },
    {
      key: 'r_number',
      label: 'User ID',
      value: getValueOrDefault(data?.r_number),
    },
    {
      key: 'created_datetime',
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(data?.created_datetime) || '-',
    },
    {
      key: 'created_by',
      label: 'Created By',
      value: data?.created_by_name,
    },
    {
      key: 'modified_datetime',
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(data?.modified_datetime) || '-',
    },
    {
      key: 'modified_by',
      label: 'Updated By',
      value: data?.modified_by_name,
    },
  ];

  const IdentityDetails = applyHidePermission(identityInfo, permissionMap);
  const AccessDetails = applyHidePermission(accessInfo, permissionMap);
  const AuditDetails = applyHidePermission(auditInfo, permissionMap);
  const DescrptionDetails = applyHidePermission(DescrptionInfo, permissionMap);

  return (
    <Fragment>
      <DetailsSection
        title='Basic Information'
        data={IdentityDetails}
        customStyle='pt-0 mt-0'
      />
      <DetailsSection title='' data={AccessDetails} />
      <DetailsSection title='' data={DescrptionDetails} />

      <DetailsSection
        title='Audit Information'
        data={AuditDetails}
        isAudit={true}
      />
    </Fragment>
  );
};
