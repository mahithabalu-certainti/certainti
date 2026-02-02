import { ListTableColumn } from '../../../../../../../components/table/types';
import { DownloadIcon } from '../../../../../../../assets';
import { formatDateToYYYYMMDDWithTime } from '../../../../../../../common-utils';
import { AttachmentList } from '../../../../../../types/attachment';

const handleDownload = (documentUrl: string, documentName: string) => {
  if (!documentUrl) return;

  const link = document.createElement('a');
  link.href = documentUrl;
  link.download = documentName || '';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getProjectDocumentsColumns =
  () //   permissionMap: Record<string, { read: boolean; edit: boolean }>
    : ListTableColumn<AttachmentList>[] => [
      {
        id: 'project_code',
        label: 'Project Code',
        sortable: true,
        sortId: 'project_code',
        width: 160,
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
        id: 'project_name',
        label: 'Project Name',
        sortable: true,
        sortId: 'project_name',
        width: 200,
      },
      {
        id: 'document_name',
        label: 'Document Name',
        sortable: true,
        sortId: 'document_name',
        width: 200,
      },
      {
        id: 'format',
        label: 'Format',
        sortable: true,
        sortId: 'format',
        width: 120,
      },
      {
        id: 'size_in_mb',
        label: 'Size',
        sortable: true,
        sortId: 'size_in_mb',
        width: 120,
      },
      {
        id: 'document_category',
        label: 'Document Category',
        sortable: true,
        sortId: 'document_category',
        width: 250,
      },
      {
        id: 'document_type',
        label: 'Document Type',
        sortable: true,
        sortId: 'document_type',
        width: 250,
      },
      {
        id: 'attachment_level',
        label: 'Related Entity',
        sortable: true,
        sortId: 'attachment_level',
        width: 150,
      },
      {
        id: 'attach_to',
        label: 'Related To ID',
        sortable: true,
        sortId: 'attach_to',
        width: 200,
      },
      {
        id: 'attached_to',
        label: 'Related To Name',
        sortable: true,
        sortId: 'attached_to',
        width: 180,
      },
      {
        id: 'uploaded_by',
        label: 'Attached By',
        sortable: true,
        sortId: 'uploaded_by',
        width: 180,
      },
      {
        id: 'created_datetime',
        label: 'Attached On',
        sortable: true,
        sortId: 'created_datetime',
        width: 200,
        render: (row) => formatDateToYYYYMMDDWithTime(row.created_datetime),
      },
      {
        id: 'r_number',
        label: 'Attachment ID',
        sortable: true,
        sortId: 'r_number',
        width: 200,
      },
      {
        id: 'download',
        label: 'Download',
        sortable: false,
        sortId: 'download',
        width: 80,
        render: (row) => (
          <button
            className='flex border border-[#CBD6E2] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer mx-auto'
            onClick={() => handleDownload(row.browse_file, row.document_name)}
          >
            <DownloadIcon alt='download-icon' className='h-4' />
          </button>
        ),
      },
    ];
