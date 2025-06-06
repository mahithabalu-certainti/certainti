import { ManageUser, UserTableColumn } from '../../../types/manage-user';

export const userColumns: UserTableColumn<ManageUser>[] = [
  {
    id: 'username',
    sortId: 'first_name',
    label: 'Username',
    width: 300,
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
  },
  {
    id: 'email',
    sortId: 'email',
    label: 'Email',
    width: 300,
    sortable: true,
  },
  {
    id: 'profile',
    sortId: 'profile',
    label: 'Profile',
    width: 300,
    sortable: true,
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
