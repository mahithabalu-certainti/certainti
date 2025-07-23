import { AllPermissions, UserDetail } from '../../common-service';
import {
  applyHidePermission,
  formatDateToYYYYMMDDWithTime,
} from '../../common-utils';
import { Fragment } from 'react/jsx-runtime';
import DetailsSection, { DetailItem } from '../details-section/details';
import DetailsSectionSkeleton from '../skeleton-component/detailsskeleton';
import { RootState } from '../../store/store';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';

export const UserDetailComponent = ({ data, loading }: UserDetail) => {
  // Map your API data to the mock data structure
  const getValueOrDefault = (
    value?: string | number | null,
    defaultValue = '-'
  ): string => {
    return value?.toString() || defaultValue;
  };
  const { permission } = useSelector((state: RootState) => state.permission);
  const userViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.USER_VIEW_EDIT)
        ?.fields ?? [],
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
      key: 'first_name',
      label: 'First Name',
      value: getValueOrDefault(data?.first_name) || '-',
    },

    {
      key: 'last_name',
      label: 'Last Name',
      value: getValueOrDefault(data?.last_name) || '-',
    },
    {
      key: 'email',
      label: 'Email address',
      value: getValueOrDefault(data?.email) || '-',
    },
    {
      key: 'phone',
      label: 'Phone Number',
      value: getValueOrDefault(data?.phone) || '-',
    },
    {
      key: 'is_consultant_firm',
      label: 'Is Consultant Firm',
      value: getValueOrDefault(data?.is_consultant_firm ? 'Yes' : 'No') || '-',
    },
    {
      key: 'org_rid',
      label: 'Org Name',
      value: getValueOrDefault(data?.org_name) || '-',
    },
  ];

  const addressInfo: DetailItem[] = [
    { key: 'street', label: 'Street', value: getValueOrDefault(data?.street) },
    {
      key: 'country_rid',
      label: 'Country',
      value: getValueOrDefault(data?.country_name),
    },
    {
      key: 'state_rid',
      label: 'Region',
      value: getValueOrDefault(data?.state_name),
    },
    {
      key: 'city_rid',
      label: 'City',
      value: getValueOrDefault(data?.city_name),
    },
    {
      key: 'zip_code',
      label: 'Zip Code / Area Code',
      value: getValueOrDefault(data?.zip_code),
    },
  ];

  const accessInfo: DetailItem[] = [
    {
      key: 'profile_rid',
      label: 'Profile',
      value: getValueOrDefault(data?.profile?.profile_name),
    },
    {
      key: 'business_teams',
      label: 'Role',
      value: getValueOrDefault(data?.business_teams?.business_teams),
    },
    {
      key: 'state_rid',
      label: 'Status',
      value: data?.status?.status_name,
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
      value: data?.created_by,
    },
    {
      key: 'modified_datetime',
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(data?.modified_datetime) || '-',
    },
    {
      key: 'modified_by',
      label: 'Updated By',
      value: data?.modified_by,
    },
  ];

  const IdentityDetails = applyHidePermission(identityInfo, permissionMap);
  const AddressDetails = applyHidePermission(addressInfo, permissionMap);
  const AccessDetails = applyHidePermission(accessInfo, permissionMap);
  const AuditDetails = applyHidePermission(auditInfo, permissionMap);
  return (
    <Fragment>
      <DetailsSection
        title='Identity'
        data={IdentityDetails}
        customStyle='pt-0 mt-0'
      />
      <DetailsSection title='Access & Role' data={AccessDetails} />
      <DetailsSection title='Address' data={AddressDetails} />
      <DetailsSection
        title='Audit Information'
        data={AuditDetails}
        isAudit={true}
      />
    </Fragment>
  );
};
