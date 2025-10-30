import { useState } from 'react';
import { ListTableColumn } from '../../../../../components/table/types';
import { QrePercentHistoryItem } from '../../../../types/qre-percent-history';
import { formatDateToYYYYMMDDWithTime } from '../resources/utils';
import { IconButton } from '@mui/material';
import { InfoIcon } from '../../../../../assets';
import QrePercentHistoryModal from './modal';

interface ContentCellProps {
  content: string;
}

const ContentCell: React.FC<ContentCellProps> = ({ content }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <IconButton size='small' onClick={() => setModalOpen(true)}>
        <InfoIcon fontSize='small' />
      </IconButton>
      <QrePercentHistoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        content={content}
      />
    </>
  );
};

export const getQrePercentHistoryColumns =
  (): ListTableColumn<QrePercentHistoryItem>[] => {
    return [
      {
        id: 'version',
        sortId: 'version',
        label: 'Sequence',
        width: 80,
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
        width: 60,
        render: (row: QrePercentHistoryItem) => (
          <ContentCell content={JSON.stringify(row.qre_detailed_breakdown || {})} />
        ),
      },
      {
        id: 'qre_percent',
        sortId: 'qre_percent',
        label: 'QRE Percent Score',
        width: 120,
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
  };
