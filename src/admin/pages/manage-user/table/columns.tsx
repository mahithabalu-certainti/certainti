import {
  formatDateToYYYYMMDDWithTime,
  REGEX_PATTERNS,
} from '../../../../common-utils';
import { ListOption } from '../../../../components/table/types';
import { ManageUser, UserTableColumn } from '../../../types/manage-user';

export const getUserColumns = (
  onClick: (row: ManageUser) => void,
  profileOptions: ListOption[],
  roleOptions: ListOption[]
): UserTableColumn<ManageUser>[] => [
  {
    id: 'username',
    sortId: 'first_name',
    label: 'Username',
    width: 200,
    sortable: true,
    sticky: true,
    editable: true,
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
    editable: true,
    field: {
      type: 'text',
      required: true,
      placeholder: 'Enter Email Address',
      validation: [
        {
          regex: REGEX_PATTERNS.MAX_EMAIL_REGEX,
          errorMessage: 'Max length exceeded',
        },
        {
          regex: REGEX_PATTERNS.EMAIL,
          errorMessage: 'Invalid email address',
        },
      ],
    },
  },
  {
    id: 'profile',
    sortId: 'profile',
    label: 'Profile',
    width: 200,
    sortable: true,
    editable: true,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: profileOptions,
    },
  },
  {
    id: 'role',
    sortId: 'business_teams',
    label: 'Role',
    width: 200,
    sortable: true,
    editable: true,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: roleOptions,
    },
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    width: 190,
    sortable: true,
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
    render: (row: ManageUser) =>
      row.modified_datetime
        ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
        : '-',
  },
  {
    id: 'status',
    sortId: 'status_name',
    label: 'Status',
    width: 100,
    sortable: true,
  },
];
