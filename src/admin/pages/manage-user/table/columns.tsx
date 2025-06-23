import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';
import { ManageUser, UserTableColumn } from '../../../types/manage-user';

export const getUserColumns = (
  onClick: (row: ManageUser) => void
): UserTableColumn<ManageUser>[] => [
  {
    id: 'username',
    sortId: 'first_name',
    label: 'Username',
    width: 200,
    sortable: true,
    sticky: true,
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
  },
  {
    id: 'email',
    sortId: 'email',
    label: 'Email',
    width: 200,
    sortable: true,
  },
  {
    id: 'profile',
    sortId: 'profile',
    label: 'Profile',
    width: 200,
    sortable: true,
  },
  {
    id: 'role',
    sortId: 'business_teams',
    label: 'Role',
    width: 200,
    sortable: true,
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
    sortId: 'status',
    label: 'Status',
    width: 100,
    sortable: true,
    render: (row: ManageUser) => (
      <span>{row.status === 'Active' ? 'Active' : 'In-Active'}</span>
    ),
  },
];
