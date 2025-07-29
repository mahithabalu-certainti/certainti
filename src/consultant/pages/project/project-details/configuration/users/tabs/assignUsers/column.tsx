import { ListTableColumn } from '../../../../../../../../components/table/types';
import { ConfigAssignUserList } from '../../../../../../../types';

export const getConfigAssignUsersColumns =
  (): ListTableColumn<ConfigAssignUserList>[] => [
    {
      id: 'first_name',
      editId: 'first_name',
      sortId: 'first_name',
      label: 'Username',
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
      id: 'email',
      sortId: 'email',
      label: 'Email Address',
      width: 180,
      sortable: true,
    },
    {
      id: 'organization_name',
      sortId: 'organization_name',
      label: 'Organisation Name',
      width: 200,
      sortable: true,
    },
  ];
