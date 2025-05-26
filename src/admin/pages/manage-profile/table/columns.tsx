import { getDateFormat } from '../../../../common-utils';
import { ManageProfileList, ManageProfile, ProfileTableColumn } from '../../../types';

export const profileColumns: ProfileTableColumn<ManageProfileList>[] = [
  {
    id: 'profile_name',
    sortId: 'profile_name',
    label: 'Profile Name',
    sortable: true,
    sort: 'profile_name',
    width: '30%',
  },
  {
    id: 'created_datetime',
    sortId: 'created_on',
    label: 'Created On',
    sortable: true,
    sort: 'created_on',
    render: (row: ManageProfile) => getDateFormat(row.createdOn),
  },
  {
    id: 'created_by',
    sortId: 'created_by',
    label: 'Created By',
    sortable: true,
    sort: 'created_by',
    width: '30%',
  },
];
