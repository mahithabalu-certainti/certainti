import { ListTableColumn } from '../../../../components/table/types';
import { InteractionHistoryList } from './utils';

export const getInteractionHistoryListColumns =
  () // permissionMap: Record<string, { read: boolean; edit: boolean }>
  : ListTableColumn<InteractionHistoryList>[] => [
    {
      id: 'action',
      sortId: 'action',
      label: 'Action',
      width: 160,
      sortable: true,
      sticky: true,
      render: (row: InteractionHistoryList) => row.interaction_type || '-',
      // hide:
      //   !permissionMap?.['r_number']?.edit &&
      //   !permissionMap?.['r_number']?.read,
      sx: {
        position: 'sticky',
        left: 32,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2',
        borderBottom: '1px solid #CBD6E2 !important',
      },
    },
    {
      id: 'date',
      sortId: 'date',
      label: 'Date',
      width: 140,
      sortable: true,
      // hide: !permissionMap?.['status_rid']?.edit && !permissionMap?.['status_rid']?.read,
      render: (row: InteractionHistoryList) => row.date || '-',
    },
  ];
