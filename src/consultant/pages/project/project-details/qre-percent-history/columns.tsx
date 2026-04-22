import { useState } from 'react';

import QrePercentHistoryModal from './modal';
import { QrePercentHistoryItem } from '../../../../types/qre-percent-history';
import { ListTableColumn } from '../../../../../components/table/types';
import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';

interface ContentCellProps {
  content: string;
  qrePercent?: number;
}

// eslint-disable-next-line react-refresh/only-export-components
const ContentCell: React.FC<ContentCellProps> = ({ content, qrePercent }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <span
        onClick={() => setModalOpen(true)}
        style={{
          cursor: 'pointer',
          color: '#0056D2',
          textDecoration: 'underline',
        }}
      >
        View
      </span>
      <QrePercentHistoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        content={content}
        qrePercent={qrePercent}
      />
    </>
  );
};

export const getQrePercentHistoryColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<QrePercentHistoryItem>[] => {
  return [
    {
      id: 'version',
      sortId: 'version',
      label: 'Sequence',
      sortable: true,
      width: '8%',
      sticky: true,
      hide: !permissionMap?.['version']?.read,
      render: (row: QrePercentHistoryItem) => (
        <div
          style={{
            textAlign: 'left',
          }}
        >{`${row.version || '-'}`}</div>
      ),
    },
    {
      id: 'qre_percent',
      sortId: 'qre_percent',
      label: 'QRE Percent Score',
      sortable: true,
      width: '13%',
      hide: !permissionMap?.['qre_percent']?.read,
      render: (row: QrePercentHistoryItem) => (
        <div
          style={{
            textAlign: 'left',
          }}
        >{`${row.qre_percent + '%' || '-'}`}</div>
      ),
    },
    {
      id: 'created_datetime',
      sortId: 'created_datetime',
      label: 'Date',
      sortable: true,
      width: '20%',
      hide: !permissionMap?.['created_datetime']?.read,
      render: (row: QrePercentHistoryItem) =>
        formatDateToYYYYMMDDWithTime(row.created_datetime) || '-',
    },
    {
      id: 'contents',
      sortId: 'contents',
      label: 'Contents',
      width: '10%',
      hide: !permissionMap?.['contents']?.read,
      render: (row: QrePercentHistoryItem) => (
        <div
          style={{
            textAlign: 'left',
          }}
        >
          <ContentCell
            content={JSON.stringify(row.qre_detailed_breakdown || {})}
            qrePercent={row.qre_percent}
          />
        </div>
      ),
    },
  ];
};
