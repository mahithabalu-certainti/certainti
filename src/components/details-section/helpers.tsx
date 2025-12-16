import { formatDateToYYYYMMDDWithTime } from '../../common-utils';
import { ChecklistItemDetails } from '../../consultant/types';
import { AttachmentList } from '../../consultant/types/attachment';

type Column<T> = {
  id: string;
  label: string;
  width?: number;
  hide?: boolean;
  sticky?: boolean;
  render?: (row: T) => React.ReactNode;
  sx?: React.CSSProperties;
};

export const getDetailsAttachmentColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): Column<AttachmentList>[] => [
  {
    id: 'document_name',
    label: 'Document Name',
    width: 160,
    sticky: true,
    hide:
      !permissionMap?.['document_name']?.edit &&
      !permissionMap?.['document_name']?.read,
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
    hide: !permissionMap?.['format']?.edit && !permissionMap?.['format']?.read,
  },
  {
    id: 'size_in_mb',
    label: 'Size',
    width: 140,
    hide:
      !permissionMap?.['size_in_mb']?.edit &&
      !permissionMap?.['size_in_mb']?.read,
  },
  {
    id: 'fiscal_year',
    label: 'Fiscal Year',
    width: 140,
    hide:
      !permissionMap?.['fiscal_year']?.edit &&
      !permissionMap?.['fiscal_year']?.read,
    render: (row: AttachmentList) => `FY-${row.fiscal_year}`,
  },
  {
    id: 'document_category',
    label: 'Document Category',
    width: 250,
    hide:
      !permissionMap?.['document_category_rid']?.edit &&
      !permissionMap?.['document_category_rid']?.read,
    render: (row: AttachmentList) =>
      row.document_category_others
        ? `${row.document_category} - ${row.document_category_others}`
        : row.document_category,
  },
  {
    id: 'document_type',
    label: 'Document Type',
    width: 300,
    hide:
      !permissionMap?.['document_type_rid']?.edit &&
      !permissionMap?.['document_type_rid']?.read,
    render: (row: AttachmentList) =>
      row.document_type_others
        ? `${row.document_type} - ${row.document_type_others}`
        : row.document_type,
  },
  {
    id: 'attachment_level',
    label: 'Related Entity',
    width: 140,
    hide:
      !permissionMap?.['attachment_level']?.edit &&
      !permissionMap?.['attachment_level']?.read,
  },
  {
    id: 'attach_to',
    label: 'Related To ID',
    width: 180,
    hide:
      !permissionMap?.['attach_to']?.edit &&
      !permissionMap?.['attach_to']?.read,
  },
  {
    id: 'attached_to',
    label: 'Related To Name',
    width: 180,
    hide:
      !permissionMap?.['attached_to']?.edit &&
      !permissionMap?.['attached_to']?.read,
  },
  {
    id: 'uploaded_by',
    label: 'Attached By',
    width: 180,
    hide:
      !permissionMap?.['uploaded_by']?.edit &&
      !permissionMap?.['uploaded_by']?.read,
  },
  {
    id: 'created_datetime',
    label: 'Attached On',
    width: 200,
    hide:
      !permissionMap?.['created_datetime']?.edit &&
      !permissionMap?.['created_datetime']?.read,
    render: (row: AttachmentList) =>
      formatDateToYYYYMMDDWithTime(row.created_datetime),
  },
  {
    id: 'r_number',
    label: 'Attachment ID',
    width: 160,
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
  },
];

export const getChecklistItemsTableColumns =
  (): Column<ChecklistItemDetails>[] => [
    {
      id: 'checklist_item_name',
      label: 'Checklist Item Name',
      width: 200,
      sticky: true,
      sx: {
        position: 'sticky',
        left: 0,
        background: '#fff',
        borderRight: '1px solid #CBD6E2',
        zIndex: 10,
      },
    },
    {
      id: 'checklist_item_description',
      label: 'Comments',
      width: 700,
    },
    {
      id: 'modified_by_name',
      label: 'Completed By',
      width: 200,
    },
    {
      id: 'status_name',
      label: 'Status',
      width: 100,
    },
  ];
