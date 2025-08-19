import { ListTableColumn } from '../../../../../../components/table/types';
import { InteractionAttachmentType } from '../../../../../types';

export const getInteractionAttachmentListColumns =
  (): ListTableColumn<InteractionAttachmentType>[] => [
    {
      id: 'question_number',
      sortId: 'question_number',
      label: 'Question Number',
      width: 160,
      sortable: true,
      sticky: true,
      render: (row: InteractionAttachmentType) => row.question_rnumber || '-',
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
      id: 'name',
      sortId: 'name',
      label: 'Name',
      width: 140,
      sortable: true,
      render: (row: InteractionAttachmentType) => row.attachment_name || '-',
    },
    {
      id: 'type',
      sortId: 'type',
      label: 'Type',
      width: 140,
      sortable: true,
      render: (row: InteractionAttachmentType) => row.attachment_type || '-',
    },
    {
      id: 'size',
      sortId: 'size',
      label: 'Size',
      width: 140,
      sortable: true,
      render: (row: InteractionAttachmentType) => row.attachment_size || '-',
    },
    {
      id: 'uploaded_by',
      sortId: 'uploaded_by',
      label: 'Uploaded By',
      width: 140,
      sortable: true,
      render: (row: InteractionAttachmentType) => row.uploaded_by || '-',
    },
    {
      id: 'uploaded_date',
      sortId: 'uploaded_date',
      label: 'Uploaded Date',
      width: 140,
      sortable: true,
      render: (row: InteractionAttachmentType) => row.uploaded_date || '-',
    },
    {
      id: 'download',
      sortId: 'download',
      label: 'Download',
      width: 140,
      sortable: true,
      render: (row: InteractionAttachmentType) => row.download_link || '-',
    },
  ];
