import {
  AllPermissions,
  PermissionTable,
  UserDetail,
} from '../../common-service';
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
import { useSearchParams } from 'react-router-dom';
import { ListTable } from '../table';
import TextButton from '../button/text-button';
import { ExtendedPermissionColumns } from './column';

export const UserDetailComponent = ({
  data,
  loading,
  gotoExtendedPermission,
}: UserDetail) => {
  // Map your API data to the mock data structure
  const getValueOrDefault = (
    value?: string | number | null,
    defaultValue = '-'
  ): string => {
    return value?.toString() || defaultValue;
  };
  const [searchparams] = useSearchParams();
  const profile = searchparams.get('userView');
  const viewDetails = profile === 'profile';
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
  const permissionTable = useMemo(() => {
    const modulesData = data?.permissions
      ?.filter((item) => item.type === 'module')
      .map((module) => {
        // Find parent menu
        const menu = data?.permissions?.find(
          (m) => m.type === 'menu' && m.menu_id === module.menu_id
        );

        // Find permissions under this module
        const permissions = data?.permissions?.filter(
          (p) => p.type === 'permission' && p.module_id === module.module_id
        );

        // Collect permission names and sort alphabetically
        const permissionNames = permissions?.map((p) => p.desc);
        const sortedPermissionNames = permissionNames?.sort((a, b) =>
          a.localeCompare(b)
        );

        // Collect fields belonging to any of those permissions
        const permissionIds = permissions?.map((p) => p.permission_id);
        const fields = data?.permissions?.filter(
          (f) => f.type === 'field' && permissionIds?.includes(f.permission_id)
        );

        // Collect field names and sort alphabetically
        const fieldNames = fields?.map((f) => f.desc);
        const sortedFieldNames = fieldNames?.sort((a, b) => a.localeCompare(b));

        return {
          rid: module.rid,
          menu: menu?.desc || '',
          modules: module.desc,
          permissions: sortedPermissionNames?.join(', '),
          fields: sortedFieldNames?.join(', '),
        };
      });

    const standaloneMenus = data?.permissions
      ?.filter((item) => item.type === 'menu')
      ?.filter((menu) => {
        const hasModules = data?.permissions?.some(
          (item) => item.type === 'module' && item.menu_id === menu.menu_id
        );
        return !hasModules;
      })
      ?.map((menu) => ({
        rid: menu.rid,
        menu: menu.desc || '',
        modules: '',
        permissions: '',
        fields: '',
      }));
    const combinedData = [...(modulesData || []), ...(standaloneMenus || [])];
    return combinedData?.sort((a, b) => a.menu.localeCompare(b.menu));
  }, [data?.permissions]);

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
      label: 'Business Name',
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
        data={viewDetails ? identityInfo : IdentityDetails}
        customStyle='pt-0 mt-0'
      />
      <DetailsSection
        title='Access & Role'
        data={viewDetails ? accessInfo : AccessDetails}
      />
      <DetailsSection
        title='Address'
        data={viewDetails ? addressInfo : AddressDetails}
      />
      <div className='pt-2 mt-3'>
        <div className='flex items-center justify-between align-middle px-3 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC] '>
          <span>Extended Permissions</span>
          <TextButton
            label='Edit'
            onClick={gotoExtendedPermission}
            sx={{
              width: '50px',
              minWidth: '50px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
        </div>
        <div className='text-sm p-3 grid gap-y-3'>
          <div className='w-full border-t border-l border-solid border-[#CBD6E2]'>
            <ListTable
              data={permissionTable as PermissionTable[]}
              columns={ExtendedPermissionColumns()}
              getRowId={(row: PermissionTable) => row.rid}
              hoverHighlight={false}
              tableStyle={{
                height: '100%',
                maxHeight: 'calc(100vh - 195px)',
                overflow: 'auto',
              }}
              selectable={false}
              stickyHeader
              actionWidth={60}
              showEmptyRow={false}
            />
          </div>
        </div>
      </div>
      <DetailsSection
        title='Audit Information'
        data={viewDetails ? auditInfo : AuditDetails}
        isAudit={true}
      />
    </Fragment>
  );
};
