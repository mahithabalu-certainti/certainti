import { ManageUser, ManageUserColumn } from '../../../types/manage-user';

export const userColumns: ManageUserColumn<ManageUser>[] = [
  { id: 'username', header: 'Username', sortable: true, sort: 'first_name' },
  { id: 'fullName', header: 'Full name', sortable: true, sort: 'full_name' },
  { id: 'email', header: 'Email', sortable: true, sort: 'email' },
  { id: 'profile', header: 'Profile', sortable: true, sort: 'profile' },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    sort: 'status',
    render: (row: ManageUser) => (
      <span style={{ color: row.status === 'Active' ? '#4CAF50' : '#F44336' }}>
        {row.status}
      </span>
    ),
  },
];
