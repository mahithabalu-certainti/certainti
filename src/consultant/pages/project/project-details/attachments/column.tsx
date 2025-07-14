import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { AttachmentList } from '../../../../types/attachment';

export const getProjectAttachmentColumns =
  (): ListTableColumn<AttachmentList>[] => [
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
    },
    {
      id: 'format',
      sortId: 'format',
      label: 'Format',
      width: 140,
      sortable: false,
    },
    {
      id: 'size_in_mb',
      sortId: 'size_in_mb',
      label: 'Size',
      width: 140,
      sortable: true,
    },
    {
      id: 'fiscal_year',
      sortId: 'fiscal_year',
      label: 'Fiscal',
      width: 140,
      sortable: true,
    },
    {
      id: 'document_category',
      sortId: 'document_category',
      label: 'Document Category',
      width: 250,
      sortable: true,
    },
    {
      id: 'document_type',
      sortId: 'document_type',
      label: 'Document Type',
      width: 300,
      sortable: true,
    },
    {
      id: 'attachment_level',
      sortId: 'attachment_level',
      label: 'Related Entity',
      width: 140,
      sortable: true,
    },
    {
      id: 'attach_to',
      sortId: 'attach_to',
      label: 'Related To ID',
      width: 180,
      sortable: true,
    },
    {
      id: 'attached_to',
      sortId: 'attached_to',
      label: 'Related To Name',
      width: 180,
      sortable: true,
    },
    {
      id: 'uploaded_by',
      sortId: 'uploaded_by',
      label: 'Attached By',
      width: 180,
      sortable: true,
    },
    {
      id: 'created_datetime',
      sortId: 'created_datetime',
      label: 'Attached On',
      width: 200,
      sortable: true,
      render: (row: AttachmentList) =>
        formatDateToYYYYMMDDWithTime(row.created_datetime),
    },
    {
      id: 'r_number',
      sortId: 'r_number',
      label: 'Attachment ID',
      width: 160,
      sortable: true,
    },
  ];
