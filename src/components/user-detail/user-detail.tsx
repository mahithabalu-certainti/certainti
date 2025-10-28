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

  const transformedData = useMemo(() => {
    const menus: {
      [key: string]: {
        menu_id: string | number | undefined;
        menu_desc: string;
        modules: {
          [key: string]: {
            module_desc: string;
            permissions: string[];
            fields: string[];
            hasPermission: boolean;
          };
        };
      };
    } = {};

    data?.permissions?.forEach((item) => {
      if (item.menu_id !== undefined && !menus[item.menu_id]) {
        menus[item.menu_id] = {
          menu_id: item.menu_id,
          menu_desc: item.menu_desc || '',
          modules: {},
        };
      }

      if (item.type === 'module') {
        if (!menus[item.menu_id].modules[item.module_id]) {
          menus[item.menu_id].modules[item.module_id] = {
            module_desc: item.module_desc || item.module_name || '',
            permissions: [],
            fields: [],
            hasPermission: false,
          };
        }
      }

      if (item.type === 'permission') {
        if (!menus[item.menu_id].modules[item.module_id]) {
          menus[item.menu_id].modules[item.module_id] = {
            module_desc: item.module_desc || '',
            permissions: [],
            fields: [],
            hasPermission: false,
          };
        }

        const moduleGroup = menus[item.menu_id].modules[item.module_id];
        moduleGroup.hasPermission = true;
        moduleGroup.permissions.push(item.permission_desc);

        if (item.is_field_available && item.fields?.length) {
          moduleGroup.fields.push(...item.fields.map((f) => f.field_desc));
        }
      }
    });

    const output: PermissionTable[] = [];
    Object.values(menus).forEach((menu) => {
      const moduleValues = Object.values(menu.modules);

      if (moduleValues.length === 0) {
        output.push({
          rid: String(output.length + 1),
          menu: menu.menu_desc,
          modules: '',
          permissions: '',
          fields: '',
        });
      } else {
        moduleValues.forEach((module) => {
          if (!module.hasPermission) {
            output.push({
              rid: String(output.length + 1),
              menu: menu.menu_desc,
              modules: module.module_desc,
              permissions: '',
              fields: '',
            });
          } else {
            output.push({
              rid: String(output.length + 1),
              menu: menu.menu_desc,
              modules: module.module_desc,
              permissions: module.permissions.join(', '),
              fields: module.fields.join(', '),
            });
          }
        });
      }
    });

    return output;
  }, [data]);

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
              data={transformedData}
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
