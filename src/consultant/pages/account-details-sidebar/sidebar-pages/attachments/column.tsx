import { AttachmentList } from '../../../../types/attchment';

export interface ResourceTableColumn<T> {
  id: string;
  label: string;
  width: string | number;
  sortId: string;
  sortable?: boolean;
  sticky?: boolean;
  sx?: React.CSSProperties;
  render?: (row: T) => React.ReactNode;
}

export const getAttachmentColumns = (
  onResourceIdClick?: (row: AttachmentList) => void
): ResourceTableColumn<AttachmentList>[] => [
  {
    id: 'document_name',
    sortId: 'document_name',
    label: 'Document Name',
    width: 160,
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
    render: (row: AttachmentList) =>
      onResourceIdClick ? (
        <span
          onClick={() => onResourceIdClick(row)}
          className='cursor-pointer no-underline hover:underline hover:text-[#1755E7]'
        >
          {row.document_name}
        </span>
      ) : (
        row.document_name
      ),
  },
  {
    id: 'document_id',
    sortId: 'document_id',
    label: 'Document ID',
    width: 160,
    sortable: true,
  },
  {
    id: 'document_number',
    sortId: 'document_number',
    label: 'Document Number',
    width: 140,
    sortable: true,
  },
  {
    id: 'attachment_level',
    sortId: 'attachment_level',
    label: 'Attachment Level',
    width: 140,
    sortable: true,
  },
  {
    id: 'attachment_to_id',
    sortId: 'attachment_to_id',
    label: 'Attachment To ID',
    width: 160,
    sortable: true,
  },
  {
    id: 'attachment_description',
    sortId: 'attachment_description',
    label: 'Attachment Description',
    width: 200,
    sortable: true,
  },
];
