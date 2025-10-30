import { useState } from 'react';
import { IconButton } from '@mui/material';
import { InfoIcon } from '../../../../../assets';
import QrePercentHistoryModal from './modal';
import { QrePercentHistoryItem } from '../../../../types/qre-percent-history';
import { ListTableColumn } from '../../../../../components/table/types';
import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';

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
        width: '8%',
        sticky: true,
        render: (row: QrePercentHistoryItem) => (
          <div
            style={{
              textAlign: 'right',
            }}
          >{`${row.version || '-'}`}</div>
        ),
      },
      {
        id: 'type',
        sortId: 'type',
        label: 'Type',
        width: '17%',
        render: (row: QrePercentHistoryItem) => row.type || '-',
      },
      {
        id: 'contents',
        sortId: 'contents',
        label: 'Contents',
        width: '10%',
        render: (row: QrePercentHistoryItem) => (
          <div
            style={{
              textAlign: 'center',
            }}
          >
            <ContentCell
              content={JSON.stringify(row.qre_detailed_breakdown || {})}
            />
          </div>
        ),
      },
      {
        id: 'qre_percent',
        sortId: 'qre_percent',
        label: 'QRE Percent Score',
        width: '13%',
        render: (row: QrePercentHistoryItem) => (
          <div
            style={{
              textAlign: 'right',
            }}
          >{`${row.qre_percent + '%' || '-'}`}</div>
        ),
      },
      {
        id: 'created_datetime',
        sortId: 'created_datetime',
        label: 'Date',
        width: '20%',
        render: (row: QrePercentHistoryItem) =>
          formatDateToYYYYMMDDWithTime(row.created_datetime) || '-',
      },
    ];
  };
