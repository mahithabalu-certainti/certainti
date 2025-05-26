import { getDateFormat } from '../../../../common-utils';
import { ManageProfileList, ProfileTableColumn } from '../../../types';

export const profileColumns: ProfileTableColumn<ManageProfileList>[] = [
  {
    id: 'profile_name',
    sortId: 'profile_name',
    label: 'Profile Name',
    width: 400,
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
    id: 'created_datetime',
    sortId: 'created_on',
    label: 'Created On',
    width: 300,
    sortable: true,
    render: (row: ManageProfileList) => getDateFormat(row.created_datetime),
  },
  {
    id: 'created_by',
    sortId: 'created_by',
    label: 'Created By',
    width: 300,
    sortable: true,
  },
];
