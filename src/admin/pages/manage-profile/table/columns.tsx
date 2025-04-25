import { getDateFormat } from '../../../../common-utils';
import { ManageProfile } from '../../../types/manage-profile';
import { ManageUserColumn } from '../../../types/manage-user';

export const profileColumns: ManageUserColumn<ManageProfile>[] = [
  {
    id: 'profileName',
    header: 'Profile Name',
    sortable: true,
    sort: 'profile_name',
    width: '180px',
  },
  {
    id: 'createdOn',
    header: 'Created On',
    sortable: true,
    sort: 'created_on',
    width: '200px',
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
