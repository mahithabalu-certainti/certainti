import { formatDateToYYYYMMDDWithTime } from '../../common-utils';
import { AttachmentList } from '../../consultant/types/attachment';

export const attachmentColumns = [
  {
    id: 'document_name',
    label: 'Document Name',
    width: 160,
    sticky: true,
    sx: {
      position: 'sticky' as const,
      left: 0,
      background: '#fff',
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
      zIndex: 10,
    },
  },
  {
    id: 'format',
    label: 'Format',
    width: 140,
  },
  {
    id: 'size_in_mb',
    label: 'Size',
    width: 140,
  },
  {
    id: 'fiscal_year',
    label: 'Fiscal Year',
    width: 140,
    render: (row: AttachmentList) => `FY-${row.fiscal_year}`,
  },
  {
    id: 'document_category',
    label: 'Document Category',
    width: 250,
    render: (row: AttachmentList) =>
      row.document_category_others
        ? `${row.document_category} - ${row.document_category_others}`
        : row.document_category,
  },
  {
    id: 'document_type',
    label: 'Document Type',
    width: 300,
    render: (row: AttachmentList) =>
      row.document_type_others
        ? `${row.document_type} - ${row.document_type_others}`
        : row.document_type,
  },
  {
    id: 'attachment_level',
    label: 'Related Entity',
    width: 140,
  },
  {
    id: 'attach_to',
    label: 'Related To ID',
    width: 180,
  },
  {
    id: 'attached_to',
    label: 'Related To Name',
    width: 180,
  },
  {
    id: 'uploaded_by',
    label: 'Attached By',
    width: 180,
  },
  {
    id: 'created_datetime',
    label: 'Attached On',
    width: 200,
    render: (row: AttachmentList) =>
      formatDateToYYYYMMDDWithTime(row.created_datetime),
  },
  {
    id: 'r_number',
    label: 'Attachment ID',
    width: 160,
  },
];
