import { ListTableColumn } from '../../../../../../../../components/table/types';
import { ConfigAssignGroupsList } from '../../../../../../../types';

export const getConfigAssignGroupsColumns =
  (): ListTableColumn<ConfigAssignGroupsList>[] => [
    {
      id: 'group_name',
      editId: 'group_name',
      sortId: 'group_name',
      label: 'Group Name',
      width: '45%',
      sortable: true,
      sticky: true,
      sx: {
        textAlign: 'left',
        position: 'sticky',
        left: 0,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2 !important',
        borderBottom: '1px solid #CBD6E2 !important',
      },
    },
    {
      id: 'user_count',
      sortId: 'user_count',
      label: 'Number of Users',
      width: '43%',
      sortable: true,
    },
  ];
