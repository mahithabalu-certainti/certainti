import { ListTableColumn } from '../../../../../components/table/types';
import { QrePercentHistoryItem } from '../../../../types/qre-percent-history';
import { formatDateToYYYYMMDDWithTime } from '../resources/utils';

export const getQrePercentHistoryColumns =
  (): ListTableColumn<QrePercentHistoryItem>[] => [
    {
      id: 'version',
      sortId: 'version',
      label: 'Sequence',
      width: 130,
      sticky: true,
      render: (row: QrePercentHistoryItem) => row.version || '-',
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
      id: 'type',
      sortId: 'type',
      label: 'Type',
      width: 60,
      render: (row: QrePercentHistoryItem) => row.type || '-',
    },
    {
      id: 'contents',
      sortId: 'contents',
      label: 'Contents',
      width: 80,
      render: (row: QrePercentHistoryItem) => row.contents || '-',
    },
    {
      id: 'qre_percent',
      sortId: 'qre_percent',
      label: 'QRE Percent Score',
      width: 180,
      render: (row: QrePercentHistoryItem) => row.qre_percent || '-',
    },
    {
      id: 'created_datetime',
      sortId: 'created_datetime',
      label: 'Date',
      width: 180,
      render: (row: QrePercentHistoryItem) =>
        formatDateToYYYYMMDDWithTime(row.created_datetime) || '-',
    },
  ];
