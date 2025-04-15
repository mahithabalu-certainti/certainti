import { ManageUserColumn } from '../../../types/manage-user';

export const userColumns: ManageUserColumn[] = [
  { id: 'username', header: 'Username', sortable: true },
  { id: 'fullName', header: 'Full name', sortable: true },
  { id: 'email', header: 'Email', sortable: true },
  { id: 'profile', header: 'Profile',sortable: true },
  { id: 'status', header: 'Status',sortable: true },
];
