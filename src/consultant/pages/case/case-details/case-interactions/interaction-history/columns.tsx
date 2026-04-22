import { formatDateToYYYYMMDDWithTime } from '../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../components/table/types';
import { InteractionHistoryList } from './utils';

export const getCaseInteractionHistoryListColumns =
  () // permissionMap: Record<string, { read: boolean; edit: boolean }>
  : ListTableColumn<InteractionHistoryList>[] => [
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
    {
      id: 'status_name',
      sortId: 'status_name',
      label: 'Action',
      width: 160,
      sortable: true,
      render: (row: InteractionHistoryList) => row.status_name || '-',
      // hide:
      //   !permissionMap?.['r_number']?.edit &&
      //   !permissionMap?.['r_number']?.read,
    },
  ];
