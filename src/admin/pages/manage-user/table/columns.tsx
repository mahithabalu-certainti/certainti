import { ManageUser, ManageUserColumn } from '../../../types/manage-user';

export const userColumns: ManageUserColumn<ManageUser>[] = [
  { id: 'username', header: 'Username', sortable: true },
  { id: 'fullName', header: 'Full name', sortable: true },
  { id: 'email', header: 'Email', sortable: true },
  { id: 'profile', header: 'Profile', sortable: true },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    render: (row: ManageUser) => (
      <span style={{ color: row.status === 'Active' ? '#4CAF50' : '#F44336' }}>
        {row.status}
      </span>
    ),
  },
];
