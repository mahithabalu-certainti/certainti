import { ManageUser, ManageUserColumn } from '../../../types/manage-user';

export const userColumns: ManageUserColumn<ManageUser>[] = [
  { id: 'username', header: 'Username', sortable: true, sort: 'first_name', width: '180px' },
  { id: 'fullName', header: 'Full name', sortable: true, sort: 'full_name', width: '200px' },
  { id: 'email', header: 'Email', sortable: true, sort: 'email', width: '300px' },
  { id: 'profile', header: 'Profile', sortable: true, sort: 'profile', width: '180px' },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    sort: 'status',
    width: '120px',
    render: (row: ManageUser) => (
      <span>
        {row.status}
      </span>
    ),
  },
];
