import { getDateFormat } from '../../../../common-utils';
import { ManageProfileList, ProfileTableColumn } from '../../../types';

export const profileColumns: ProfileTableColumn<ManageProfileList>[] = [
  {
    id: 'profile_name',
    sortId: 'profile_name',
    label: 'Profile Name',
    width: 500,
    sortable: true,
    sort: 'profile_name',
  },
  {
    id: 'created_datetime',
    sortId: 'created_on',
    label: 'Created On',
    width: 300,
    sortable: true,
    sort: 'created_on',
    render: (row: ManageProfileList) => getDateFormat(row.created_datetime),
  },
  {
    id: 'created_by',
    sortId: 'created_by',
    label: 'Created By',
    width: 400,
    sortable: true,
    sort: 'created_by',
  },
];
