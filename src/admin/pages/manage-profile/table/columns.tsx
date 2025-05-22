import { getDateFormat } from '../../../../common-utils';
import { ManageProfile } from '../../../types';
import { ManageUserColumn } from '../../../types/manage-user';

export const profileColumns: ManageUserColumn<ManageProfile>[] = [
  {
    id: 'profileName',
    header: 'Profile Name',
    sortable: true,
    sort: 'profile_name',
    width: '400px',
  },
  {
    id: 'createdOn',
    header: 'Created On',
    sortable: true,
    sort: 'created_on',
    width: '300px',
    render: (row: ManageProfile) => getDateFormat(row.createdOn),
  },
  {
    id: 'createdBy',
    header: 'Created By',
    sortable: true,
    sort: 'created_by',
    width: '300px',
  },
];
