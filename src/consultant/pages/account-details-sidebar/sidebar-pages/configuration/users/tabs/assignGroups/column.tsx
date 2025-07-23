import { Switch } from '@mui/material';
import { ListTableColumn } from '../../../../../../../../components/table/types';

interface AssignUsersColumnsProps {
  selectedUserId: string | null;
  onAssignChange: (rowId: string, checked: boolean) => void;
}

export const getAccountAssignUsersColumns = ({
  onAssignChange,
}: AssignUsersColumnsProps): ListTableColumn<any>[] => [
  {
    id: 'group_name',
    editId: 'group_name',
    sortId: 'group_name',
    label: 'Group Name',
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
    editId: 'organization',
    sortId: 'organization',
    label: 'Organisation Name',
    width: 200,
    sortable: true,
  },
  {
    id: 'number_of_users',
    editId: 'resource_type_rid',
    sortId: 'resource_type_rid',
    label: 'Number of Users',
    width: 140,
    sortable: true,
  },
  {
    id: 'assign',
    label: 'Assign',
    width: 100,
    sortId: 'assign',
    sortable: false,
    render: (row: any) => (
      <Switch
        checked={row.assign || false}
        onChange={(e) => onAssignChange(row.rid, e.target.checked)}
        color='success'
      />
    ),
  },
];
