import { ListTableColumn } from '../../../../../../components/table/types';
import { formatDateToYYYYMMDDWithTime } from '../../resources/utils';
import { InteractionHistoryList } from './utils';

export const getInteractionHistoryListColumns =
  () // permissionMap: Record<string, { read: boolean; edit: boolean }>
  : ListTableColumn<InteractionHistoryList>[] => [
    {
      id: 'status_name',
      sortId: 'status_name',
      label: 'Action',
      width: 160,
      sortable: true,
      sticky: true,
      render: (row: InteractionHistoryList) => <>{row.status_name || '-'}</>,
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
      width: 200,
      sortable: true,
      // hide: !permissionMap?.['status_rid']?.edit && !permissionMap?.['status_rid']?.read,
      render: (row: InteractionHistoryList) =>
        row?.date ? <span>{formatDateToYYYYMMDDWithTime(row.date)}</span> : '-',
    },
  ];
