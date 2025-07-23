import { ListTableColumn } from '../../../../../../../../components/table/types';
import { Switch } from '@mui/material';

export const getAccountAssignUsersColumns = ({
  onAssignChange,
}: {
  onAssignChange: (id: string, checked: boolean) => void;
}): ListTableColumn<{
  rid: string;
  assign?: boolean;
  full_name?: string;
  organization?: string;
  number_of_users?: number;
}>[] => [
  {
    id: 'full_name',
    editId: 'full_name',
    sortId: 'full_name',
    label: 'User Full Name',
    width: 150,
    sortable: true,
    sticky: true,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
  },
  {
    id: 'organization',
    sortId: 'organization',
    label: 'Organisation Name',
    width: 200,
    sortable: true,
  },
  {
    id: 'number_of_users',
    sortId: 'number_of_users',
    label: 'Number of Users',
    width: 140,
    sortable: true,
  },
  {
    id: 'inclusion',
    sortId: 'inclusion',
    label: 'Inclusion',
    width: 140,
    render: (row: { rid: string; assign?: boolean }) => (
      <Switch
        checked={row.assign || false}
        onChange={(e) => onAssignChange(row.rid, e.target.checked)}
        color='success'
      />
    ),
  },
];
