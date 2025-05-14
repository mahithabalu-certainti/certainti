import { ManageUser, ManageUserColumn } from '../../../types/manage-user';

export const userColumns: ManageUserColumn<ManageUser>[] = [
  { id: 'username', header: 'Username', sortable: true, sort: 'first_name', width: '20%' },
  { id: 'email', header: 'Email', sortable: true, sort: 'email', width: '30%' },
  { id: 'profile', header: 'Profile', sortable: true, sort: 'profile', width: '25%' },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    sort: 'status',
    width: '10%',
    render: (row: ManageUser) => (
      <span>
        {row.status === 'Active' ? 'Active' : 'In-Active'}
      </span>
    ),
  },
];
