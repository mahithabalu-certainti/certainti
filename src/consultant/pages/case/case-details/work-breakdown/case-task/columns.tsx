import { ListTableColumn } from '../../../../../../components/table/types';
import { InteractionAttachmentType } from '../../../../../types';

export const getInteractionAttachmentListColumns =
  (): ListTableColumn<InteractionAttachmentType>[] => [
    {
      id: 'task_name',
      sortId: 'task_name',
      label: 'Task Name',
      width: 120,
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
      id: 'assign_to',
      sortId: 'assign_to',
      label: 'Assign To',
      width: 120,
      render: (row: InteractionAttachmentType) => row.name || '-',
    },
    {
      id: 'start_date',
      sortId: 'start_date',
      label: 'Start Date',
      width: 120,
      render: (row: InteractionAttachmentType) => row.type || '-',
    },
    {
      id: 'due_date',
      sortId: 'due_date',
      label: 'Due Date',
      width: 120,
      render: (row: InteractionAttachmentType) => row.size || '-',
    },
    {
      id: 'status',
      sortId: 'status',
      label: 'Status',
      width: 140,
      render: (row: InteractionAttachmentType) => row.uploaded_by || '-',
    },
  ];
