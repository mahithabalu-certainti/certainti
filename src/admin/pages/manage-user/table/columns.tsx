import {
  formatDateToYYYYMMDDWithTime,
  REGEX_PATTERNS,
} from '../../../../common-utils';
import {
  DependencyRowData,
  ListOption,
  ListTableColumn,
} from '../../../../components/table/types';
import { ManageUser } from '../../../types/manage-user';

export const getUserColumns = (
  onClick: (row: ManageUser) => void,
  profileOptions: ListOption[],
  roleOptions: ListOption[],
  statusOptions: ListOption[],
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<ManageUser>[] => [
  {
    id: 'username',
    editId: 'first_name',
    sortId: 'first_name',
    label: 'Username',
    width: 200,
    sortable: true,
    sticky: true,
    editable:
      permissionMap?.['first_name']?.read &&
      permissionMap?.['first_name']?.edit,
    hide:
      !permissionMap?.['first_name']?.read &&
      !permissionMap?.['first_name']?.edit,
    sx: {
      position: 'sticky',
      left: '32px',
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: ManageUser) =>
      onClick ? (
        <span
          onClick={() => onClick(row)}
          className='cursor-pointer no-underline hover:underline hover:text-[#1755E7]'
        >
          {row.username}
        </span>
      ) : (
        row.username
      ),
    field: {
      type: 'text',
      required: true,
      placeholder: 'Enter Username',
      validation: [
        {
          regex: REGEX_PATTERNS.MIN_3,
          errorMessage: 'Username must be more than 2 characters long',
        },
        {
          regex: REGEX_PATTERNS.MAX_64,
          errorMessage: 'Max length exceeded',
        },
        {
          regex: REGEX_PATTERNS.NAME_REGEX,
          errorMessage:
            "Username must contain only letters, space( ), apostrophes(') and hyphens(-).",
        },
      ],
    },
  },
  {
    id: 'email',
    sortId: 'email',
    label: 'Email',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['first_name']?.read &&
      !permissionMap?.['first_name']?.edit,
  },
  {
    id: 'profile',
    editId: 'profile_rid',
    sortId: 'profile',
    label: 'Profile',
    width: 200,
    sortable: true,
    // editable:
    //   permissionMap?.['profile_rid']?.read &&
    //   permissionMap?.['profile_rid']?.edit,
    // hide:
    //   !permissionMap?.['profile_rid']?.read &&
    //   !permissionMap?.['profile_rid']?.edit,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: profileOptions,
      getFieldData: (rowData: DependencyRowData) => {
        return String(rowData.profile_rid);
      },
    },
  },
  {
    id: 'role',
    editId: 'role_rid',
    sortId: 'business_teams',
    label: 'Role',
    width: 200,
    sortable: true,
    editable:
      permissionMap?.['business_teams']?.read &&
      permissionMap?.['business_teams']?.edit,
    hide:
      !permissionMap?.['business_teams']?.read &&
      !permissionMap?.['business_teams']?.edit,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: roleOptions,
      getFieldData: (rowData: DependencyRowData) => {
        return String(rowData.role_rid);
      },
    },
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    width: 190,
    sortable: true,
    hide:
      !permissionMap?.['created_datetime']?.read &&
      !permissionMap?.['created_datetime']?.edit,
    render: (row: ManageUser) =>
      row.created_datetime
        ? formatDateToYYYYMMDDWithTime(row.created_datetime)
        : '-',
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Updated On',
    width: 190,
    sortable: true,
    hide:
      !permissionMap?.['modified_datetime']?.read &&
      !permissionMap?.['modified_datetime']?.edit,
    render: (row: ManageUser) =>
      row.modified_datetime
        ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
        : '-',
  },
  {
    id: 'status',
    editId: 'status_rid',
    sortId: 'status_name',
    label: 'Status',
    width: 100,
    sortable: true,
    editable:
      permissionMap?.['status_rid']?.read &&
      permissionMap?.['status_rid']?.edit,
    hide:
      !permissionMap?.['status_rid']?.read &&
      !permissionMap?.['status_rid']?.edit,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: statusOptions,
      getFieldData: (rowData: DependencyRowData) => {
        return String(rowData.status_rid);
      },
    },
  },
];
